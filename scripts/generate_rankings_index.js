/*
Generate Top-50 ranking leaderboards from the Registrations report.

Goal:
- Provide a fast, marketing-friendly Rankings page without parsing 80k+ CSV rows in the browser.

Input:
- public/Registrations Report.csv (or common variants)

Output:
- public/rankings_index.json

Cohort logic (method B):
- Period filters are based on First Deposit Date (fallback: External FTD Date).

Usage:
  node scripts/generate_rankings_index.js
  node scripts/generate_rankings_index.js --force
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const OUT_PATH = path.join(PUBLIC_DIR, 'rankings_index.json')
const FORCE = process.argv.includes('--force')
const TOP_N = 50
const OUT_USERS_PATH = path.join(PUBLIC_DIR, 'rankings_users_table.json')

const INPUT_CANDIDATES = [
  'Registrations Report.csv',
  'Registrations Report.fixed.csv',
  '01012023 to 01112026 Registrations Report.csv',
]

function normalizeHeaderKey(header) {
  if (header == null) return ''
  const s = header.toString().trim().toLowerCase()
  const base = s.replace(/[^a-z0-9]+/g, '')
  if (base) return base
  if (/^\.+$/.test(s)) return 'ellipsis'
  return 'col'
}

function isNonEmpty(v) {
  return v !== undefined && v !== null && String(v).trim() !== ''
}

function buildHeaderPairs(fields) {
  const seen = {}
  const pairs = []
  for (const origKey of fields || []) {
    let base = normalizeHeaderKey(origKey)
    if (!base) base = 'col'
    seen[base] = (seen[base] || 0) + 1
    const normKey = seen[base] === 1 ? base : `${base}__${seen[base]}`
    pairs.push({ origKey, normKey })
  }
  return pairs
}

function rowToNormalized(rawRow, headerPairs) {
  const row = {}
  for (const { origKey, normKey } of headerPairs) {
    const v = rawRow && rawRow[origKey]
    row[normKey] = v == null ? '' : String(v).trim()
  }
  return row
}

function pickField(row, candidates) {
  if (!row) return ''
  for (const k of candidates) {
    if (isNonEmpty(row[k])) return String(row[k]).trim()
    for (let i = 2; i <= 6; i += 1) {
      const dk = `${k}__${i}`
      if (isNonEmpty(row[dk])) return String(row[dk]).trim()
    }
  }
  return ''
}

function toNum(v) {
  if (v == null) return 0
  const s = String(v).trim()
  if (!s) return 0
  const cleaned = s.replace(/[€$\s]/g, '').replace(/,/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

function parseDmyDateTime(v) {
  const s = String(v || '').trim()
  if (!s) return null
  const parts = s.split(' ').filter(Boolean)
  const datePart = parts[0] || ''
  const timePart = parts[1] || ''

  const dmy = datePart.split('/').map((x) => x.trim())
  if (dmy.length < 3) return null
  const a = Number(dmy[0])
  const b = Number(dmy[1])
  const y = Number(dmy[2])

  // Primary format is D/M/YYYY, but some exports contain M/D/YYYY.
  // Heuristic:
  // - If b > 12 and a <= 12 => treat as M/D (e.g. 1/15/2026)
  // - Else treat as D/M (e.g. 15/1/2026)
  let d = a
  let m = b
  if (Number.isFinite(a) && Number.isFinite(b) && b > 12 && a >= 1 && a <= 12) {
    d = b
    m = a
  }

  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null

  let hh = 0
  let mm = 0
  let ss = 0
  if (timePart) {
    const t = timePart.split(':')
    hh = Number(t[0] || 0)
    mm = Number(t[1] || 0)
    ss = Number(t[2] || 0)
  }

  const ms = Date.UTC(y, m - 1, d, hh || 0, mm || 0, ss || 0)
  if (!Number.isFinite(ms)) return null
  return new Date(ms)
}

function formatYmdUTC(date) {
  if (!date) return null
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0))
}

function addUtcMonths(date, deltaMonths) {
  const d = new Date(date.getTime())
  d.setUTCMonth(d.getUTCMonth() + deltaMonths)
  return d
}

function getPeriods(now) {
  const nowUtc = new Date(now.getTime())
  const y = nowUtc.getUTCFullYear()
  const m = nowUtc.getUTCMonth() // 0-11

  const mtdStart = new Date(Date.UTC(y, m, 1, 0, 0, 0))

  const qStartMonth = Math.floor(m / 3) * 3
  const qtdStart = new Date(Date.UTC(y, qStartMonth, 1, 0, 0, 0))

  const ytdStart = new Date(Date.UTC(y, 0, 1, 0, 0, 0))

  const semStart = startOfUtcDay(addUtcMonths(nowUtc, -6))
  const annualStart = startOfUtcDay(addUtcMonths(nowUtc, -12))

  return [
    { id: 'mtd', start: mtdStart },
    { id: 'qtd', start: qtdStart },
    { id: 'ytd', start: ytdStart },
    { id: 'sem', start: semStart },
    { id: 'annual', start: annualStart },
    { id: 'all', start: null },
  ]
}

function slugifyId(v) {
  const s = String(v || '').trim().toLowerCase()
  if (!s) return ''
  return s
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function stableSortByMetricDesc(items, metricAccessor, tieAccessor) {
  const decorated = items.map((it, idx) => ({ it, idx }))
  decorated.sort((a, b) => {
    const av = metricAccessor(a.it)
    const bv = metricAccessor(b.it)
    if (bv !== av) return bv - av
    const at = tieAccessor ? tieAccessor(a.it) : 0
    const bt = tieAccessor ? tieAccessor(b.it) : 0
    if (bt !== at) return bt - at
    return a.idx - b.idx
  })
  return decorated.map((d) => d.it)
}

function stableSortByMetricAsc(items, metricAccessor, tieAccessor) {
  const decorated = items.map((it, idx) => ({ it, idx }))
  decorated.sort((a, b) => {
    const av = metricAccessor(a.it)
    const bv = metricAccessor(b.it)
    if (av !== bv) return av - bv
    const at = tieAccessor ? tieAccessor(a.it) : 0
    const bt = tieAccessor ? tieAccessor(b.it) : 0
    if (bt !== at) return bt - at
    return a.idx - b.idx
  })
  return decorated.map((d) => d.it)
}

function isFraudFlagged(raw) {
  const s = String(raw || '').trim()
  return Boolean(s)
}

function findFirstExistingInput() {
  for (const name of INPUT_CANDIDATES) {
    const p = path.join(PUBLIC_DIR, name)
    if (fs.existsSync(p)) return p
  }
  return null
}

function shouldSkipRegeneration(inputPath) {
  if (FORCE) return false
  if (!fs.existsSync(OUT_PATH)) return false
    if (!fs.existsSync(OUT_USERS_PATH)) return false
  try {
    const outStat = fs.statSync(OUT_PATH)
      const outUsersStat = fs.statSync(OUT_USERS_PATH)
    const inStat = fs.statSync(inputPath)
    const scriptStat = fs.statSync(__filename)
    const maxInputMs = Math.max(inStat.mtimeMs || 0, scriptStat.mtimeMs || 0)
      const outMs = Math.min(outStat.mtimeMs || 0, outUsersStat.mtimeMs || 0)
      return outMs >= maxInputMs
  } catch {
    return false
  }
}

  function computeDerivedUser(u, nowMs) {
    let tenureDays = 0
    if (u.registrationDate) {
      const rMs = new Date(u.registrationDate).getTime()
      if (Number.isFinite(rMs) && rMs > 0 && rMs <= nowMs) {
        tenureDays = Math.floor((nowMs - rMs) / (24 * 3600 * 1000))
      }
    }

    // NOTE: In the Registrations report, a negative P&L indicates profit for the user.
    // Prefer `pl` (often matches Qlik's "Closed PL") and fallback to `netPl`.
    const basePl = Number.isFinite(u.pl) && u.pl !== 0 ? u.pl : u.netPl || 0
    const userPl = -1 * (basePl || 0)
    const userPlPctNetDeposits = u.netDeposits > 0 ? userPl / u.netDeposits : 0

    return { ...u, tenureDays, userPl, userPlPctNetDeposits }
  }

  function writeUsersTable(users, { source, generatedAt, nowMs }) {
    const columns = [
      'userId',
      'customerName',
      'mt5Account',
      'affiliateId',
      'country',
      'ftdDate',
      'registrationDate',
      'netDeposits',
      'pl',
      'netPl',
      'positionCount',
      'userPl',
      'userPlPctNetDeposits',
      'period',
      'fraud',
    ]

    const rows = (users || []).map((u) => {
      const d = computeDerivedUser(u, nowMs)
      return [
        d.userId || '',
        d.customerName || '',
        d.mt5Account || '',
        d.affiliateId || '',
        d.country || '',
        d.ftdDate || '',
        d.registrationDate || '',
        d.netDeposits || 0,
        d.pl || 0,
        d.netPl || 0,
        d.positionCount || 0,
        d.userPl || 0,
        d.userPlPctNetDeposits || 0,
        d.period || '',
        Boolean(d.fraud),
      ]
    })

    const out = {
      version: 1,
      generatedAt,
      source,
      columns,
      rows,
    }

    // Keep this compact: it can be large and is only intended for search.
    fs.writeFileSync(OUT_USERS_PATH, JSON.stringify(out), 'utf8')
  }

function buildUserRecord(r) {
  const userId = pickField(r, ['userid', 'user', 'user_id'])
  const customerName = pickField(r, ['customername', 'name', 'fullname'])
  const mt5Account = pickField(r, ['mt5account', 'mt5', 'mt5_account'])
  const country = pickField(r, ['country'])
  const status = pickField(r, ['status'])
  const affiliateId = pickField(r, ['affiliateid', 'affiliate_id', 'affiliate'])

  const period = pickField(r, ['period'])

  const externalDateRaw = pickField(r, ['externaldate', 'external_date'])
  const externalDate = parseDmyDateTime(externalDateRaw)

  const registrationDateRaw = pickField(r, ['registrationdate', 'registration_date'])
  const registrationDate = parseDmyDateTime(registrationDateRaw)

  const firstDepositRaw = pickField(r, ['firstdeposit', 'first_deposit'])
  const firstDeposit = toNum(firstDepositRaw)

  const firstDepositDateRaw = pickField(r, ['firstdepositdate', 'firstdepositat'])
  const externalFtdDateRaw = pickField(r, ['externalftddate', 'external_ftd_date'])
  const ftdDate = parseDmyDateTime(firstDepositDateRaw) || parseDmyDateTime(externalFtdDateRaw)

  const netDeposits = toNum(pickField(r, ['netdeposits', 'net_deposits']))
  const totalDeposits = toNum(pickField(r, ['totaldeposits', 'total_deposits', 'totaldeposit']))
  const withdrawals = toNum(pickField(r, ['withdrawals', 'totalwithdrawals', 'total_withdrawals']))
  const depositCount = Math.round(toNum(pickField(r, ['depositcount', 'deposit_count', 'depositscount'])))

  const pl = toNum(pickField(r, ['pl', 'profitloss']))
  const netPl = toNum(pickField(r, ['netpl', 'net_pl'])) || pl
  const positionCount = Math.round(toNum(pickField(r, ['positioncount', 'position_count'])))
  const volume = toNum(pickField(r, ['volume', 'turnover']))
  const lots = toNum(pickField(r, ['lots', 'total_lots']))
  const spread = toNum(pickField(r, ['spread']))
  const roi = toNum(pickField(r, ['roi']))

  const fraudRaw = pickField(r, ['fraud', 'fraudchargeback'])
  const fraud = isFraudFlagged(fraudRaw)

  return {
    userId,
    customerName,
    mt5Account,
    country,
    status,
    affiliateId,
    period,
    registrationDate: registrationDate ? registrationDate.toISOString() : '',
    externalDate: externalDate ? externalDate.toISOString() : '',
    firstDeposit,
    ftdDate: ftdDate ? ftdDate.toISOString() : '',
    netDeposits,
    totalDeposits,
    withdrawals,
    depositCount,
    pl,
    netPl,
    positionCount,
    volume,
    lots,
    spread,
    roi,
    fraud,
  }
}

function computeKpiBoards(users, nowMs) {
  const withTenure = users.map((u) => {
    let tenureDays = 0
    if (u.registrationDate) {
      const rMs = new Date(u.registrationDate).getTime()
      if (Number.isFinite(rMs) && rMs > 0 && rMs <= nowMs) {
        tenureDays = Math.floor((nowMs - rMs) / (24 * 3600 * 1000))
      }
    }
    // NOTE: In the Registrations report, a negative P&L indicates profit for the user
    // (and profit for Bullwaves when positive). For marketing-oriented leaderboards,
    // we expose user-centric KPIs.
    // Prefer `pl` (often matches Qlik's "Closed PL") and fallback to `netPl`.
    const basePl = Number.isFinite(u.pl) && u.pl !== 0 ? u.pl : u.netPl || 0
    const userPl = -1 * (basePl || 0)
    const userPlPctNetDeposits = u.netDeposits > 0 ? userPl / u.netDeposits : 0
    return { ...u, tenureDays, userPl, userPlPctNetDeposits }
  })

  const boards = {}

  // KPI leaderboards (user-centric)
  // - P&L (user profit): userPl
  // - Position counts: positionCount
  // - % gain: userPlPctNetDeposits

  // 1) P&L (user profit)
  {
    const eligible = withTenure.filter((u) => u.positionCount > 0 && u.userPl > 0)
    const sorted = stableSortByMetricDesc(eligible, (u) => u.userPl, (u) => u.netDeposits)
    boards.userPl = { rows: sorted.slice(0, TOP_N) }
  }

  // 2) Position counts
  {
    const eligible = withTenure.filter((u) => u.positionCount > 0)
    const sorted = stableSortByMetricDesc(eligible, (u) => u.positionCount, (u) => u.userPl)
    boards.positionCount = { rows: sorted.slice(0, TOP_N) }
  }

  // 3) % gain (user profit vs net deposits)
  {
    const eligible = withTenure.filter((u) => u.netDeposits > 0 && u.positionCount > 0 && u.userPl > 0)
    const sorted = stableSortByMetricDesc(
      eligible,
      (u) => u.userPlPctNetDeposits,
      (u) => u.userPl
    )
    boards.userPlPctNetDeposits = { rows: sorted.slice(0, TOP_N) }
  }

  return boards
}

function buildLeaderboardsForPeriod(users, now, period) {
  const nowMs = now.getTime()
  const startMs = period.start ? period.start.getTime() : null

  // Period filtering for performance rankings:
  // use FTD date (First Deposit Date fallback: External FTD Date). The report is
  // aggregated per user, so we do not attempt per-trade periodization.
  const cohort = users.filter((u) => {
    if (u.fraud) return false
    if (startMs == null) return true
    const dt = u.ftdDate
    if (!dt) return false
    const ms = new Date(dt).getTime()
    if (!Number.isFinite(ms)) return false
    if (ms > nowMs) return false
    return ms >= startMs
  })

  const boards = computeKpiBoards(cohort, nowMs)
  return { cohortSize: cohort.length, boards }
}

function buildLeaderboardsForReportPeriodValue(users, now, value) {
  const nowMs = now.getTime()
  const v = String(value || '').trim()
  const cohort = users.filter((u) => !u.fraud && String(u.period || '').trim() === v)
  const boards = computeKpiBoards(cohort, nowMs)
  return { cohortSize: cohort.length, boards }
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('Missing public dir:', PUBLIC_DIR)
    process.exit(1)
  }

  const inputPath = findFirstExistingInput()
  if (!inputPath) {
    const out = {
      version: 1,
      generatedAt: new Date().toISOString(),
      source: null,
      cohortBy: 'firstDepositDate',
      topN: TOP_N,
      periods: {},
      leaderboards: {},
    }
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
      writeUsersTable([], { source: null, generatedAt: out.generatedAt, nowMs: Date.now() })
    console.log(
      `No registrations CSV found. Wrote empty rankings -> ${path.relative(process.cwd(), OUT_PATH)}`
    )
    return
  }

  if (shouldSkipRegeneration(inputPath)) {
    console.log(
      `Rankings index up-to-date (use --force to regenerate) -> ${path.relative(process.cwd(), OUT_PATH)}`
    )
    return
  }

  const csvText = fs.readFileSync(inputPath, 'utf8')
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  const fields = (parsed && parsed.meta && parsed.meta.fields) || []
  const headerPairs = buildHeaderPairs(fields)

  const users = []
  for (const rawRow of parsed.data || []) {
    const r = rowToNormalized(rawRow, headerPairs)
    const u = buildUserRecord(r)
    if (!u.userId && !u.mt5Account && !u.customerName) continue
    users.push(u)
  }

  const now = new Date()
    writeUsersTable(users, {
      source: path.basename(inputPath),
      generatedAt: new Date().toISOString(),
      nowMs: now.getTime(),
    })
  const periods = getPeriods(now)
  const periodsOut = {}
  const leaderboardsOut = {}
  const cohortStats = {}

  for (const p of periods) {
    periodsOut[p.id] = {
      start: p.start ? p.start.toISOString() : null,
      startYmd: p.start ? formatYmdUTC(p.start) : null,
    }
    const res = buildLeaderboardsForPeriod(users, now, p)
    leaderboardsOut[p.id] = res.boards
    cohortStats[p.id] = { cohortSize: res.cohortSize }
  }

  // Custom periods aligned to an optional `period` column in the input.
  const distinctReportPeriods = Array.from(
    new Set(
      (users || [])
        .map((u) => String(u.period || '').trim())
        .filter((s) => s)
    )
  )

  const reportPeriodsOut = []
  if (distinctReportPeriods.length) {
    const seenIds = {}
    for (const value of distinctReportPeriods) {
      const base = slugifyId(value) || 'period'
      seenIds[base] = (seenIds[base] || 0) + 1
      const id = seenIds[base] === 1 ? `rp__${base}` : `rp__${base}__${seenIds[base]}`
      reportPeriodsOut.push({ id, label: value, value })

      periodsOut[id] = { start: null, startYmd: null, reportPeriodValue: value }
      const res = buildLeaderboardsForReportPeriodValue(users, now, value)
      leaderboardsOut[id] = res.boards
      cohortStats[id] = { cohortSize: res.cohortSize }
    }
  }

  const out = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: path.basename(inputPath),
    cohortBy: 'firstDepositDate',
    topN: TOP_N,
    now: now.toISOString(),
    periods: periodsOut,
    reportPeriods: reportPeriodsOut,
    leaderboardOrder: ['userPl', 'positionCount', 'userPlPctNetDeposits'],
    leaderboards: leaderboardsOut,
    stats: {
      totalRows: users.length,
      cohortByPeriod: cohortStats,
    },
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
  console.log(`Generated rankings -> ${path.relative(process.cwd(), OUT_PATH)} (rows: ${users.length})`)
}

main()
