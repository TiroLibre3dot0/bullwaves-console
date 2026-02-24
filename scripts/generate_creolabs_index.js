/*
Generate a lightweight JSON artifact consumed by the Creolabs page.

Input:
  CREOLABS/creolabs breakdown.xlsx

Output:
  public/creolabs_index.json

Notes:
  - Uses exceljs streaming reader to avoid OOM on larger XLSX files.
  - Aggregates by (Year Month, Client) and exports Top-N leaderboards.
*/

const fs = require('fs')
const path = require('path')
const ExcelJS = require('exceljs')

const ROOT_DIR = path.join(__dirname, '..')
const INPUT_PATH = path.join(ROOT_DIR, 'CREOLABS', 'creolabs breakdown.xlsx')
const OUT_PATH = path.join(ROOT_DIR, 'public', 'creolabs_index.json')
const OUT_TABLE_PATH = path.join(ROOT_DIR, 'public', 'creolabs_clients_table.json')

const TOP_N = 50

function asString(v) {
  if (v == null) return ''
  if (typeof v === 'object' && v.text != null) return String(v.text)
  return String(v)
}

function normHeader(v) {
  return asString(v)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function parseNumber(v) {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0

  const s0 = asString(v).trim()
  if (!s0) return 0

  // Handle accounting negatives like (123.45)
  const isParenNeg = /^\(.*\)$/.test(s0)
  const s1 = isParenNeg ? s0.slice(1, -1) : s0

  // Strip currency symbols and thousands separators.
  const s2 = s1
    .replace(/[$€£]/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')

  const n = Number(s2)
  if (!Number.isFinite(n)) return 0
  return isParenNeg ? -n : n
}

function parseYearMonthId(v) {
  const s = asString(v).trim()
  return s
}

function monthSortKey(id) {
  // Expected like: 2024-Apr
  const s = String(id || '').trim()
  const m = s.match(/^(\d{4})[-\s]?([A-Za-z]{3,})/)
  if (!m) return { ok: false, key: s }
  const year = Number(m[1])
  const monRaw = m[2].slice(0, 3).toLowerCase()
  const monMap = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  }
  const month = monMap[monRaw]
  if (!year || !month) return { ok: false, key: s }
  return { ok: true, key: year * 100 + month }
}

function safeKeyPart(v) {
  return asString(v).trim().replace(/\s+/g, ' ')
}

function getClientKey({ clientId, clientLogin, clientName }) {
  const a = safeKeyPart(clientId)
  const b = safeKeyPart(clientLogin)
  const c = safeKeyPart(clientName)
  const base = `${a}::${b}`
  if (base !== '::') return base
  return c ? `name::${c}` : 'client'
}

function sortDescNumber(a, b) {
  const av = Number(a || 0)
  const bv = Number(b || 0)
  return (Number.isFinite(bv) ? bv : 0) - (Number.isFinite(av) ? av : 0)
}

function pickTitleCase(s) {
  const t = String(s || '').trim()
  return t || '—'
}

function serializeAggRow(periodId, r) {
  return {
    periodId,
    clientId: r.clientId,
    clientLogin: r.clientLogin,
    clientName: r.clientName,
    affiliateId: r.affiliateId,
    country: r.country,
    brand: r.brand,
    deposit: r.deposit,
    wd: r.wd,
    net: r.net,
    pl: r.pl,
    trades: r.trades,
    balance: r.balance,
  }
}

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`[Creolabs] Missing input XLSX: ${INPUT_PATH}`)
    process.exit(1)
  }

  const nowIso = new Date().toISOString()

  // periodId -> clientKey -> agg
  const aggByPeriod = new Map()
  const periodSet = new Set()

  let headers = null
  let headerToIdx = null
  let totalRows = 0
  let dataRows = 0

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(INPUT_PATH, {
    entries: 'emit',
    sharedStrings: 'cache',
    styles: 'cache',
    worksheets: 'emit',
  })

  for await (const worksheetReader of workbook) {
    // Use the first sheet only.
    for await (const row of worksheetReader) {
      totalRows += 1
      const values = Array.isArray(row.values) ? row.values.slice(1) : []

      if (!headers) {
        headers = values.map((v) => asString(v).trim())
        headerToIdx = new Map(headers.map((h, i) => [normHeader(h), i]))
        continue
      }

      const get = (name) => {
        if (!headerToIdx) return ''
        const idx = headerToIdx.get(normHeader(name))
        return idx == null ? '' : values[idx]
      }

      const yearMonth = parseYearMonthId(get('Year Month'))
      if (!yearMonth) continue

      const clientId = pickTitleCase(get('Client ID'))
      const clientLogin = pickTitleCase(get('Client LOGIN'))
      const clientName = pickTitleCase(get('Client Name'))
      const clientKey = getClientKey({ clientId, clientLogin, clientName })

      const affiliateId = asString(get('Affiliate ID')).trim()
      const country = asString(get('Country')).trim()
      const brand = asString(get('Brand')).trim()

      const deposit = parseNumber(get('$ Deposit'))
      const wd = parseNumber(get('$ WD'))
      const net = parseNumber(get('$ Net'))
      const trades = Math.max(0, Math.floor(parseNumber(get('# Trades'))))

      // Prefer explicit $ PL; else Closed+Open.
      const plExplicit = parseNumber(get('$ PL'))
      const closedPl = parseNumber(get('$ Closed PL'))
      const openPl = parseNumber(get('$ Open PL'))
      const pl = plExplicit || closedPl + openPl

      const balance = parseNumber(get('$ Balance'))

      periodSet.add(yearMonth)
      dataRows += 1

      let per = aggByPeriod.get(yearMonth)
      if (!per) {
        per = new Map()
        aggByPeriod.set(yearMonth, per)
      }

      let agg = per.get(clientKey)
      if (!agg) {
        agg = {
          clientId,
          clientLogin,
          clientName,
          affiliateId,
          country,
          brand,
          deposit: 0,
          wd: 0,
          net: 0,
          pl: 0,
          trades: 0,
          balance: 0,
        }
        per.set(clientKey, agg)
      }

      // Keep most descriptive identity fields if present.
      if (clientId !== '—' && agg.clientId === '—') agg.clientId = clientId
      if (clientLogin !== '—' && agg.clientLogin === '—') agg.clientLogin = clientLogin
      if (clientName !== '—' && agg.clientName === '—') agg.clientName = clientName
      if (affiliateId && !agg.affiliateId) agg.affiliateId = affiliateId
      if (country && !agg.country) agg.country = country
      if (brand && !agg.brand) agg.brand = brand

      agg.deposit += deposit
      agg.wd += wd
      agg.net += net
      agg.pl += pl
      agg.trades += trades
      // Balance isn't additive, but summing is still a stable proxy; keep last non-zero.
      if (balance) agg.balance = balance
    }

    break
  }

  const periods = [...periodSet]
    .sort((a, b) => {
      const ka = monthSortKey(a)
      const kb = monthSortKey(b)
      if (ka.ok && kb.ok) return ka.key - kb.key
      return String(a).localeCompare(String(b))
    })

  const reportPeriods = periods.map((id) => ({ id, label: id }))

  const leaderboardOrder = ['net', 'pl', 'deposit', 'trades']
  const leaderboards = {}
  const clientsTableRows = []

  for (const periodId of periods) {
    const per = aggByPeriod.get(periodId)
    const list = per ? [...per.values()] : []
    for (const r of list) {
      const denom = Number(r.net || 0)
      r.plPctNet = denom ? r.pl / denom : 0
    }

    for (const r of list) {
      clientsTableRows.push(serializeAggRow(periodId, r))
    }

    const byNet = [...list].sort((a, b) => sortDescNumber(a.net, b.net)).slice(0, TOP_N)
    const byPl = [...list].sort((a, b) => sortDescNumber(a.pl, b.pl)).slice(0, TOP_N)
    const byDeposit = [...list]
      .sort((a, b) => sortDescNumber(a.deposit, b.deposit))
      .slice(0, TOP_N)
    const byTrades = [...list]
      .sort((a, b) => sortDescNumber(a.trades, b.trades))
      .slice(0, TOP_N)

    leaderboards[periodId] = {
      net: { rows: byNet },
      pl: { rows: byPl },
      deposit: { rows: byDeposit },
      trades: { rows: byTrades },
    }
  }

  const out = {
    version: 1,
    generatedAt: nowIso,
    source: 'CREOLABS/creolabs breakdown.xlsx',
    topN: TOP_N,
    now: nowIso,
    reportPeriods,
    leaderboardOrder,
    leaderboards,
    stats: {
      totalRows,
      dataRows,
      periods: periods.length,
    },
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
  console.log(`[Creolabs] Wrote ${path.relative(ROOT_DIR, OUT_PATH)} (periods=${periods.length})`)

  const tableOut = {
    version: 1,
    generatedAt: nowIso,
    source: 'CREOLABS/creolabs breakdown.xlsx',
    now: nowIso,
    rows: clientsTableRows,
    stats: {
      totalRows,
      dataRows,
      periods: periods.length,
      clientsRows: clientsTableRows.length,
    },
  }

  fs.writeFileSync(OUT_TABLE_PATH, JSON.stringify(tableOut), 'utf8')
  console.log(
    `[Creolabs] Wrote ${path.relative(ROOT_DIR, OUT_TABLE_PATH)} (rows=${clientsTableRows.length})`
  )
}

main().catch((err) => {
  console.error('[Creolabs] Failed to generate index')
  console.error(err)
  process.exit(1)
})
