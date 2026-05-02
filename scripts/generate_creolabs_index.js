/*
Generate lightweight JSON artifacts consumed by the Creolabs page and unified investments view.

Input:
  CREOLABS/Traders Ranking Rewards.xlsx

Output:
  public/creolabs_index.json

Notes:
  - Uses exceljs streaming reader to avoid OOM on larger XLSX files.
  - Aggregates by (Year Month, Client) and exports Top-N leaderboards.
  - Keeps the legacy `creolabs_*` artifact shapes so existing pages can consume
    a single source of truth derived from Traders Ranking Rewards.
*/

const fs = require('fs')
const path = require('path')
const ExcelJS = require('exceljs')

const ROOT_DIR = path.join(__dirname, '..')
const CREOLABS_DIR = path.join(ROOT_DIR, 'CREOLABS')
const DEFAULT_INPUT_PATH = path.join(CREOLABS_DIR, 'Traders Ranking Rewards.xlsx')
const OUT_PATH = path.join(ROOT_DIR, 'public', 'creolabs_index.json')
const OUT_TABLE_PATH = path.join(ROOT_DIR, 'public', 'creolabs_clients_table.json')
const OUT_AFF_MONTH_PATH = path.join(ROOT_DIR, 'public', 'creolabs_affiliate_month.json')

const TOP_N = 50

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function writeFileAtomicWithRetry(filePath, content, {
  encoding = 'utf8',
  retries = 6,
  baseDelayMs = 80,
} = {}) {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })

  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  let lastErr = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await fs.promises.writeFile(tmpPath, content, { encoding })
      // rename is atomic on the same volume
      await fs.promises.rename(tmpPath, filePath)
      return
    } catch (e) {
      lastErr = e
      try {
        await fs.promises.unlink(tmpPath)
      } catch {
        // ignore
      }

      // Transient Windows locks often surface as UNKNOWN/EPERM/EBUSY.
      const code = String(e?.code || '')
      const transient = code === 'UNKNOWN' || code === 'EBUSY' || code === 'EPERM' || code === 'EACCES'
      if (!transient || attempt === retries) break
      const delay = baseDelayMs * Math.pow(2, attempt)
      await sleep(delay)
    }
  }

  throw lastErr
}

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

function getByHeader(values, headerToIdx, name) {
  if (!headerToIdx) return ''
  const idx = headerToIdx.get(normHeader(name))
  return idx == null ? '' : values[idx]
}

function getAny(values, headerToIdx, names) {
  for (const name of names || []) {
    const value = getByHeader(values, headerToIdx, name)
    if (value !== '' && value != null) return value
  }
  return ''
}

function fallbackPeriodIdFromDate(d) {
  const date = d instanceof Date ? d : new Date()
  const year = date.getFullYear()
  const monNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mon = monNames[date.getMonth()] || 'Jan'
  return `${year}-${mon}`
}

function periodIdFromFilename(filePath) {
  const base = path.basename(filePath || '')
  const name = base.replace(/\.[^.]+$/, '')
  const s = name.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!s) return null

  const monNames = {
    jan: 'Jan',
    january: 'Jan',
    feb: 'Feb',
    february: 'Feb',
    mar: 'Mar',
    march: 'Mar',
    apr: 'Apr',
    april: 'Apr',
    may: 'May',
    jun: 'Jun',
    june: 'Jun',
    jul: 'Jul',
    july: 'Jul',
    aug: 'Aug',
    august: 'Aug',
    sep: 'Sep',
    sept: 'Sep',
    september: 'Sep',
    oct: 'Oct',
    october: 'Oct',
    nov: 'Nov',
    november: 'Nov',
    dec: 'Dec',
    december: 'Dec',
  }

  // Patterns like 2026-02 or 2026 02
  const mNum = s.match(/(\d{4})\D{0,3}(0?[1-9]|1[0-2])\b/)
  if (mNum) {
    const year = Number(mNum[1])
    const month = Number(mNum[2])
    if (Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12) {
      const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]
      return `${year}-${mon}`
    }
  }

  // Patterns like Feb 2026 / February 2026
  const mNameFirst = s.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b\D{0,6}(\d{4})\b/i)
  if (mNameFirst) {
    const mon = monNames[String(mNameFirst[1]).toLowerCase()]
    const year = Number(mNameFirst[2])
    if (mon && Number.isFinite(year)) return `${year}-${mon}`
  }

  // Patterns like 2026 Feb / 2026 February
  const mYearFirst = s.match(/\b(\d{4})\b\D{0,6}\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i)
  if (mYearFirst) {
    const year = Number(mYearFirst[1])
    const mon = monNames[String(mYearFirst[2]).toLowerCase()]
    if (mon && Number.isFinite(year)) return `${year}-${mon}`
  }

  return null
}

function listCreolabsInputs() {
  if (fs.existsSync(DEFAULT_INPUT_PATH)) return [DEFAULT_INPUT_PATH]
  return []
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
    user: r.user,
    country: r.country,
    brand: r.brand,
    deposit: r.deposit,
    wd: r.wd,
    net: r.net,
    pl: r.pl,
    trades: r.trades,
    balance: r.balance,
    commission: r.commission,
  }
}

async function main() {
  const nowIso = new Date().toISOString()
  const inputFiles = listCreolabsInputs()
  if (!inputFiles.length) {
    // Treat Creolabs inputs as optional in multi-project environments.
    // Write empty artifacts so builds/dev servers don't fail just because
    // the XLSX isn't present on a given machine.
    console.warn(`[Creolabs] Traders Ranking Rewards source not found: ${DEFAULT_INPUT_PATH}`)
    console.warn('[Creolabs] Writing empty artifacts so downstream pages keep working')

    const emptySource = null
    const emptyIndex = {
      version: 1,
      generatedAt: nowIso,
      source: emptySource,
      topN: TOP_N,
      now: nowIso,
      reportPeriods: [],
      leaderboardOrder: [],
      leaderboards: {},
      stats: {
        totalRows: 0,
        dataRows: 0,
        periods: 0,
        inputFiles: 0,
        derivedSnapshotDeltas: false,
      },
    }

    const emptyTable = {
      version: 1,
      generatedAt: nowIso,
      source: emptySource,
      now: nowIso,
      rows: [],
      stats: {
        totalRows: 0,
        dataRows: 0,
        periods: 0,
        clientsRows: 0,
        inputFiles: 0,
      },
    }

    const emptyAffMonth = {
      version: 1,
      generatedAt: nowIso,
      source: emptySource,
      now: nowIso,
      rows: [],
      stats: {
        totalRows: 0,
        dataRows: 0,
        periods: 0,
        rows: 0,
        inputFiles: 0,
      },
    }

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
    await writeFileAtomicWithRetry(OUT_PATH, JSON.stringify(emptyIndex, null, 2), { encoding: 'utf8' })
    await writeFileAtomicWithRetry(OUT_TABLE_PATH, JSON.stringify(emptyTable), { encoding: 'utf8' })
    await writeFileAtomicWithRetry(OUT_AFF_MONTH_PATH, JSON.stringify(emptyAffMonth), { encoding: 'utf8' })

    console.log(`[Creolabs] Wrote ${path.relative(ROOT_DIR, OUT_PATH)} (periods=0)`)
    console.log(`[Creolabs] Wrote ${path.relative(ROOT_DIR, OUT_TABLE_PATH)} (rows=0)`)
    console.log(`[Creolabs] Wrote ${path.relative(ROOT_DIR, OUT_AFF_MONTH_PATH)} (rows=0)`)
    return
  }

  // periodId -> clientKey -> agg
  const aggByPeriod = new Map()
  const periodSet = new Set()

  // Traders Ranking Rewards normally provides an explicit monthly column.
  // Keep the fallback logic defensive in case the export format changes.
  let sawExplicitPeriod = false

  let totalRows = 0
  let dataRows = 0

  for (const inputPath of inputFiles) {
    let headers = null
    let headerToIdx = null

    let mtime = null
    try {
      mtime = fs.statSync(inputPath)?.mtime
    } catch {
      mtime = null
    }
    const filePeriodFallback = periodIdFromFilename(inputPath) || fallbackPeriodIdFromDate(mtime || new Date())

    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(inputPath, {
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

        // Prefer the explicit monthly key from Traders Ranking Rewards.
        // If it's ever missing, keep the old synthetic-period fallback.
        const yearMonthRaw = getAny(values, headerToIdx, [
          'year_month',
          'Year Month',
          'YearMonth',
          'Period',
          'Month',
          'Report Month',
        ])

        const explicitPeriod = parseYearMonthId(yearMonthRaw)
        if (explicitPeriod) sawExplicitPeriod = true
        const yearMonth = explicitPeriod || filePeriodFallback

        const clientId = pickTitleCase(getAny(values, headerToIdx, ['client_id', 'Client ID', 'ID']))
        const clientLogin = pickTitleCase(
          getAny(values, headerToIdx, ['client_login', 'Client LOGIN', 'Client Login', 'Login'])
        )
        const clientName = pickTitleCase(
          getAny(values, headerToIdx, ['client_name', 'Client Name', 'Client'])
        )
        const clientKey = getClientKey({ clientId, clientLogin, clientName })

        const affiliateId = asString(
          getAny(values, headerToIdx, ['affiliate_id', 'Affiliate ID'])
        ).trim()
        const user = asString(getAny(values, headerToIdx, ['user', 'User'])).trim()
        const country = asString(getAny(values, headerToIdx, ['country', 'Country'])).trim()
        const brand = asString(getAny(values, headerToIdx, ['brand', 'Brand'])).trim()

        const commission = parseNumber(
          getAny(values, headerToIdx, ['ltv_commission', 'LTV Commission', 'Commission'])
        )

        const deposit = parseNumber(getAny(values, headerToIdx, ['deposit', '$ Deposit', 'Deposits']))
        const wd = parseNumber(getAny(values, headerToIdx, ['wd', '$ WD', 'Withdrawal', 'Withdrawals']))
        const net = parseNumber(getAny(values, headerToIdx, ['net', '$ Net', 'Net Deposit']))
        const trades = Math.max(
          0,
          Math.floor(parseNumber(getAny(values, headerToIdx, ['trades', '# Trades', 'num_trades'])))
        )

        // Traders Ranking Rewards exposes closed/open PL; keep explicit PL as a fallback.
        const plExplicit = parseNumber(getAny(values, headerToIdx, ['$ PL', 'pl']))
        const closedPl = parseNumber(
          getAny(values, headerToIdx, ['closed_pl', '$ Closed PL', 'Closed PL'])
        )
        const openPl = parseNumber(
          getAny(values, headerToIdx, ['open_pl', '$ Open PL', 'Open PL'])
        )
        const pl = plExplicit || closedPl + openPl

        const balance = parseNumber(getAny(values, headerToIdx, ['balance', '$ Balance']))

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
            user,
            country,
            brand,
            deposit: 0,
            wd: 0,
            net: 0,
            pl: 0,
            trades: 0,
            balance: 0,
            commission: 0,
          }
          per.set(clientKey, agg)
        }

        // Keep most descriptive identity fields if present.
        if (clientId !== '—' && agg.clientId === '—') agg.clientId = clientId
        if (clientLogin !== '—' && agg.clientLogin === '—') agg.clientLogin = clientLogin
        if (clientName !== '—' && agg.clientName === '—') agg.clientName = clientName
        if (affiliateId && !agg.affiliateId) agg.affiliateId = affiliateId
        if (user && !agg.user) agg.user = user
        if (country && !agg.country) agg.country = country
        if (brand && !agg.brand) agg.brand = brand

        agg.deposit += deposit
        agg.wd += wd
        agg.net += net
        agg.pl += pl
        agg.trades += trades
        agg.commission += commission
        // Balance isn't additive, but summing is still a stable proxy; keep last non-zero.
        if (balance) agg.balance = balance
      }

      break
    }
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
  const affiliateMonthRows = []

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

    // Pre-aggregate by affiliate/month to avoid shipping the huge clients table to pages
    // (e.g. Unified view) that only need affiliate-level monthly metrics.
    const byAffiliate = new Map()
    for (const r of list) {
      const affiliateId = String(r?.affiliateId || '—').trim() || '—'
      if (!byAffiliate.has(affiliateId)) {
        byAffiliate.set(affiliateId, { affiliateId, net: 0, pl: 0, commission: 0 })
      }
      const acc = byAffiliate.get(affiliateId)
      acc.net += Number(r?.net || 0) || 0
      acc.pl += Number(r?.pl || 0) || 0
      acc.commission += Number(r?.commission || 0) || 0
    }
    for (const acc of byAffiliate.values()) {
      affiliateMonthRows.push({ periodId, affiliateId: acc.affiliateId, net: acc.net, pl: acc.pl, commission: acc.commission })
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

  const derivedSnapshotDeltas = !sawExplicitPeriod && inputFiles.length > 1 && periods.length > 1
  if (derivedSnapshotDeltas) {
    const periodIndex = new Map(periods.map((id, idx) => [id, idx]))
    const byAffiliate = new Map()
    for (const row of affiliateMonthRows) {
      const affiliateId = String(row?.affiliateId || '—').trim() || '—'
      if (!byAffiliate.has(affiliateId)) byAffiliate.set(affiliateId, [])
      byAffiliate.get(affiliateId).push(row)
    }

    for (const rows of byAffiliate.values()) {
      rows.sort((a, b) => {
        const ia = periodIndex.get(a.periodId)
        const ib = periodIndex.get(b.periodId)
        if (ia != null && ib != null) return ia - ib
        return String(a.periodId).localeCompare(String(b.periodId))
      })

      let prevNet = 0
      let prevPl = 0
      let prevCommission = 0

      for (const r of rows) {
        const curNet = Number(r?.net || 0) || 0
        const curPl = Number(r?.pl || 0) || 0
        const curCommission = Number(r?.commission || 0) || 0

        r.net = curNet - prevNet
        r.pl = curPl - prevPl
        r.commission = curCommission - prevCommission

        prevNet = curNet
        prevPl = curPl
        prevCommission = curCommission
      }
    }
  }

  const out = {
    version: 1,
    generatedAt: nowIso,
    source:
      inputFiles.length === 1
        ? `CREOLABS/${path.basename(inputFiles[0])}`
        : inputFiles.map((p) => `CREOLABS/${path.basename(p)}`),
    topN: TOP_N,
    now: nowIso,
    reportPeriods,
    leaderboardOrder,
    leaderboards,
    stats: {
      totalRows,
      dataRows,
      periods: periods.length,
      inputFiles: inputFiles.length,
      derivedSnapshotDeltas,
    },
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  await writeFileAtomicWithRetry(OUT_PATH, JSON.stringify(out, null, 2), { encoding: 'utf8' })
  console.log(`[Creolabs] Wrote ${path.relative(ROOT_DIR, OUT_PATH)} (periods=${periods.length})`)

  const tableOut = {
    version: 1,
    generatedAt: nowIso,
    source: out.source,
    now: nowIso,
    rows: clientsTableRows,
    stats: {
      totalRows,
      dataRows,
      periods: periods.length,
      clientsRows: clientsTableRows.length,
      inputFiles: inputFiles.length,
    },
  }

  await writeFileAtomicWithRetry(OUT_TABLE_PATH, JSON.stringify(tableOut), { encoding: 'utf8' })
  console.log(
    `[Creolabs] Wrote ${path.relative(ROOT_DIR, OUT_TABLE_PATH)} (rows=${clientsTableRows.length})`
  )

  const affMonthOut = {
    version: 1,
    generatedAt: nowIso,
    source: out.source,
    now: nowIso,
    rows: affiliateMonthRows,
    stats: {
      totalRows,
      dataRows,
      periods: periods.length,
      rows: affiliateMonthRows.length,
      inputFiles: inputFiles.length,
    },
  }

  await writeFileAtomicWithRetry(OUT_AFF_MONTH_PATH, JSON.stringify(affMonthOut), { encoding: 'utf8' })
  console.log(
    `[Creolabs] Wrote ${path.relative(ROOT_DIR, OUT_AFF_MONTH_PATH)} (rows=${affiliateMonthRows.length})`
  )
}

main().catch((err) => {
  console.error('[Creolabs] Failed to generate index')
  console.error(err)
  process.exit(1)
})
