/*
Generate a lightweight Support User index for the frontend.

Goal:
- Avoid expensive browser-side CSV parsing for SupportUserCheck search.
- Keep payload reasonably small by including only the fields needed by the UI.

Input:
- public/Registrations Report.csv (or common variants)

Output:
- public/support_users_index.json

Usage:
  node scripts/generate_support_users_index.js
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const OUT_PATH = path.join(PUBLIC_DIR, 'support_users_index.json')
const QUICK_OUT_PATH = path.join(PUBLIC_DIR, 'support_users_search_index.json')
const BOT_CANDIDATES_OUT_PATH = path.join(PUBLIC_DIR, 'support_bot_candidates.json')

const FORCE = process.argv.includes('--force')

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

function normalizeForIndex(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim().toLowerCase()
}

function stripOuterQuotes(value) {
  if (value == null) return ''
  let s = String(value)
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1)
  s = s.trim()
  // Remove spurious surrounding quotes (malformed CSV exports)
  s = s.replace(/^"+|"+$/g, '').trim()
  return s
}

function normalizeLooseToken(value) {
  let s = stripOuterQuotes(value)
  // Some malformed rows leak delimiter fragments into the value (e.g. ,"2/16/2026 ...).
  // Drop only leading delimiter noise; keep the rest untouched.
  s = s.replace(/^[,;\s]+/, '')
  s = s.replace(/^"+|"+$/g, '').trim()
  return s
}

function normalizeMt5Account(value) {
  const s = normalizeLooseToken(value)
  if (!s) return ''

  // Date/time-like artifacts are not valid MT5 accounts.
  if (/[/:]/.test(s)) return ''

  const digits = digitsOnly(s)
  if (digits && digits.length >= 5 && digits.length <= 12) return digits

  // Fallback: keep cleaned value only if it doesn't look like delimiter noise.
  if (/[",;]/.test(s)) return ''
  return s
}

function digitsOnly(s) {
  if (s == null) return ''
  return String(s).replace(/\D+/g, '')
}

function isNonEmpty(v) {
  return v !== undefined && v !== null && String(v).trim() !== ''
}

function pickFieldNormalized(row, candidates) {
  if (!row) return ''
  for (const k of candidates) {
    if (isNonEmpty(row[k])) return normalizeLooseToken(row[k])
    // Also check duplicate keys (e.g. "foo__2")
    for (let i = 2; i <= 6; i += 1) {
      const dk = `${k}__${i}`
      if (isNonEmpty(row[dk])) return normalizeLooseToken(row[dk])
    }
  }
  return ''
}

function rowNonEmptyScore(row) {
  if (!row || typeof row !== 'object') return 0
  let score = 0
  for (const k of Object.keys(row)) {
    if (k && String(k).startsWith('__')) continue
    const v = row[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') score += 1
  }
  return score
}

function parsePositionCountValue(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const n = Number(raw.replace(/[^0-9.-]+/g, ''))
  if (!Number.isFinite(n) || n < 0 || n > 100000) return null
  return Math.round(n)
}

function parseFlexibleDate(value) {
  if (value == null) return null
  const s = String(value).trim()
  if (!s) return null

  const parts = s.split(/\s+/, 2)
  const d = (parts[0] || '').split('/')
  if (d.length >= 3) {
    let a = parseInt(d[0], 10)
    let b = parseInt(d[1], 10)
    const yyyy = parseInt(d[2], 10)
    if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(yyyy)) {
      let mm = a
      let dd = b
      if (a > 12) {
        dd = a
        mm = b
      }
      let hh = 0
      let mi = 0
      let ss = 0
      if (parts[1]) {
        const tp = parts[1].split(':')
        hh = parseInt(tp[0] || '0', 10)
        mi = parseInt(tp[1] || '0', 10)
        ss = parseInt(tp[2] || '0', 10)
      }
      const dt = new Date(yyyy, mm - 1, dd, hh, mi, ss)
      if (!Number.isNaN(dt.getTime())) return dt
    }
  }

  const dt = new Date(s)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function toNum(value) {
  if (value == null || value === '') return 0
  const n = Number(String(value).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(n) ? n : 0
}

function computeBotIntel(row, now = new Date()) {
  const positions = parsePositionCountValue(row.positioncount)
  if (positions == null || positions <= 0) return null

  const regDate = parseFlexibleDate(row.registrationdate)
  if (!regDate) return null

  const ageDays = Math.max(1, Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24)))
  const positionsPerDay = positions / ageDays
  const earlyHyper = ageDays <= 7 && (positions >= 200 || positionsPerDay >= 30)
  const isPotentialBot = earlyHyper || (positionsPerDay >= 50 && positions >= 100)
  const botScore = positionsPerDay * 2 + positions / 50 + (earlyHyper ? 100 : 0)

  let tier = 'inactive'
  if (positionsPerDay < 1) tier = 'low'
  else if (positionsPerDay < 5) tier = 'active'
  else if (positionsPerDay < 20) tier = 'high'
  else tier = 'hyper'

  return {
    ageDays,
    positions,
    positionsPerDay,
    withdrawals: Math.trunc(toNum(row.withdrawals)),
    withdrawalRatio: toNum(row.totaldeposits) > 0 ? toNum(row.withdrawals) / Math.max(toNum(row.totaldeposits), 1) : null,
    tier,
    signals: [],
    isPotentialBot,
    botScore,
    thresholds: {
      lowMax: 1,
      activeMax: 5,
      highMax: 20,
      earlyDays: 7,
      earlyPositions: 200,
      earlyPositionsPerDay: 30,
      veryHighPositionsPerDay: 50,
    },
  }
}

function buildBotCandidates(rows, generatedAt, source) {
  const BOT_LIST_SIZE = 50
  const CANDIDATE_POOL = 400
  const now = new Date()
  const pool = []

  function pushTopByPositions(item) {
    if (pool.length < CANDIDATE_POOL) {
      pool.push(item)
      return
    }
    let minIdx = 0
    let minVal = pool[0]?.positions || 0
    for (let i = 1; i < pool.length; i += 1) {
      const v = pool[i]?.positions || 0
      if (v < minVal) {
        minVal = v
        minIdx = i
      }
    }
    if ((item?.positions || 0) > minVal) pool[minIdx] = item
  }

  for (const row of rows || []) {
    const positions = parsePositionCountValue(row.positioncount)
    if (!positions) continue
    pushTopByPositions({ row, positions })
  }

  const scored = []
  for (const item of pool) {
    const intel = computeBotIntel(item.row, now)
    if (!intel || intel.positions == null) continue
    scored.push({
      raw: {
        customername: item.row.customername || '',
        userid: item.row.userid || '',
        mt5account: item.row.mt5account || '',
        affiliateid: item.row.affiliateid || '',
        status: item.row.status || '',
        country: item.row.country || '',
        registrationdate: item.row.registrationdate || '',
        totaldeposits: item.row.totaldeposits || '',
        netdeposits: item.row.netdeposits || '',
        withdrawals: item.row.withdrawals || '',
        positioncount: item.row.positioncount || '',
        position_count: item.row.positioncount || '',
        volume: item.row.volume || '',
        pl: item.row.pl || '',
      },
      intel,
      affiliateName: null,
      regDate: item.row.registrationdate || null,
    })
  }

  scored.sort((a, b) => {
    const botDelta = Number(b?.intel?.isPotentialBot || false) - Number(a?.intel?.isPotentialBot || false)
    if (botDelta) return botDelta
    return (b?.intel?.botScore || 0) - (a?.intel?.botScore || 0)
  })

  return {
    version: 1,
    generatedAt,
    source,
    total: Math.min(scored.length, BOT_LIST_SIZE),
    rows: scored.slice(0, BOT_LIST_SIZE),
  }
}

function buildDedupKey(row) {
  if (!row || typeof row !== 'object') return ''
  const uid = stripOuterQuotes(row.userid || '')
  const mt5 = stripOuterQuotes(row.mt5account || '')
  const email = stripOuterQuotes(row.email || row.customeremail || '')
  const parts = [uid, mt5, email].map((x) => String(x || '').trim().toLowerCase())
  if (!parts.some(Boolean)) return ''
  return parts.join('|')
}

function addIndex(map, key, idx) {
  if (!key) return
  const prev = map[key]
  if (prev === undefined) {
    map[key] = idx
    return
  }
  if (Array.isArray(prev)) {
    prev.push(idx)
    return
  }
  map[key] = [prev, idx]
}

function findFirstExistingInput() {
  for (const name of INPUT_CANDIDATES) {
    const p = path.join(PUBLIC_DIR, name)
    if (fs.existsSync(p)) return p
  }
  return null
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
      total: 0,
      byUserId: {},
      byMt5: {},
      byEmail: {},
      rows: [],
    }
    const quickOut = { ...out, rows: [] }
    fs.writeFileSync(OUT_PATH, JSON.stringify(out), 'utf8')
    fs.writeFileSync(QUICK_OUT_PATH, JSON.stringify(quickOut), 'utf8')
    console.log(`No registrations CSV found. Wrote empty indexes -> ${path.relative(process.cwd(), OUT_PATH)}, ${path.relative(process.cwd(), QUICK_OUT_PATH)}`)
    return
  }

  if (!FORCE && fs.existsSync(OUT_PATH)) {
    try {
      const outStat = fs.statSync(OUT_PATH)
      const inStat = fs.statSync(inputPath)
      if (outStat.mtimeMs >= inStat.mtimeMs) {
        console.log(`Support users index up-to-date (use --force to regenerate) -> ${path.relative(process.cwd(), OUT_PATH)}`)
        return
      }
    } catch {
      // Fall through to regeneration.
    }
  }

  const csvText = fs.readFileSync(inputPath, 'utf8')
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  const fields = (parsed && parsed.meta && parsed.meta.fields) || []
  const headerPairs = buildHeaderPairs(fields)

  const rows = []
  const byUserId = {}
  const byMt5 = {}
  const byEmail = {}

  // Dedup map: key -> { row, score }
  const bestByKey = new Map()
  const order = []

  for (const rawRow of parsed.data || []) {
    const r = rowToNormalized(rawRow, headerPairs)

    // Canonical fields used by the UI (SupportUserCheck.jsx candidate key lists)
    const outRow = {
      customername: pickFieldNormalized(r, ['customername', 'name', 'fullname']),
      userid: pickFieldNormalized(r, ['userid', 'user', 'user_id']),
      mt5account: normalizeMt5Account(pickFieldNormalized(r, ['mt5account', 'mt5', 'mt5_account'])),
      registrationdate: pickFieldNormalized(r, [
        'registrationdate',
        'regdate',
        'externaldate',
        'registered',
        'registration_date',
      ]),
      firstdeposit: pickFieldNormalized(r, ['firstdeposit', 'first_deposit']),
      // Needed by SupportUserDetails timeline to display "Data deposito".
      // Source CSV header is typically `first_deposit_date` which normalizes to `firstdepositdate`.
      firstdepositdate: pickFieldNormalized(r, ['firstdepositdate', 'firstdepositat']),
      qualificationdate: pickFieldNormalized(r, ['qualificationdate', 'qualification_date', 'qualifydate']),
      depositcount: pickFieldNormalized(r, ['depositcount', 'deposit_count', 'depositscount', 'deposits_count']),
      totaldeposits: pickFieldNormalized(r, ['totaldeposits', 'total_deposits', 'totaldeposit', 'total_deposit']),
      netdeposits: pickFieldNormalized(r, ['netdeposits', 'net_deposits']),
      withdrawals: pickFieldNormalized(r, ['withdrawals', 'totalwithdrawals', 'total_withdrawals']),
      affiliateid: pickFieldNormalized(r, ['affiliateid', 'affiliate_id', 'affiliate']),
      status: pickFieldNormalized(r, ['status']),
      country: pickFieldNormalized(r, ['country']),
      fraud: pickFieldNormalized(r, ['fraud', 'fraudchargeback']),
      action: pickFieldNormalized(r, ['action']),
      positioncount: pickFieldNormalized(r, ['positioncount', 'position_count', 'position count']),
      lots: pickFieldNormalized(r, ['lots', 'total_lots']),
      volume: pickFieldNormalized(r, ['volume', 'turnover']),
      pl: pickFieldNormalized(r, ['pl', 'profitloss', 'netpl', 'net_pl']),
      spread: pickFieldNormalized(r, ['spread']),
      roi: pickFieldNormalized(r, ['roi']),
      commissions: pickFieldNormalized(r, ['commissions', 'affiliatecommissions', 'affiliate_commissions', 'comm']),
      affiliatecommissions: pickFieldNormalized(r, ['affiliatecommissions', 'affiliate_commissions']),
      subaffiliatecommissions: pickFieldNormalized(r, [
        'subaffiliatecommissions',
        'sub_affiliate_commissions',
        'sub_aff_commissions',
      ]),
      cpacommission: pickFieldNormalized(r, ['cpacommission', 'cpa_commission', 'cpa']),
      cplcommission: pickFieldNormalized(r, ['cplcommission', 'cpl_commission', 'cpl']),
      revshare: pickFieldNormalized(r, ['revshare', 'revsharecommission', 'revshare_commission']),
      email: pickFieldNormalized(r, ['email', 'customeremail']),
    }

    const cleanPositionCount = parsePositionCountValue(outRow.positioncount)
    outRow.positioncount = cleanPositionCount == null ? '' : String(cleanPositionCount)

    // Search index (hot path during typing)
    outRow.__searchIndex = [
      outRow.userid,
      outRow.mt5account,
      outRow.customername,
      outRow.email,
      outRow.affiliateid,
      outRow.country,
      outRow.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    // Dedup: some exports contain the same user twice, one with a trailing quote in userid.
    // Prefer the row with more non-empty fields.
    const key = buildDedupKey(outRow)
    if (!key) {
      order.push({ key: null, row: outRow })
      continue
    }
    const score = rowNonEmptyScore(outRow)
    if (!bestByKey.has(key)) {
      bestByKey.set(key, { row: outRow, score })
      order.push({ key, row: null })
      continue
    }
    const prev = bestByKey.get(key)
    if (prev && score > (prev.score || 0)) bestByKey.set(key, { row: outRow, score })
  }

  // Materialize deduped rows in stable order
  for (const item of order) {
    if (!item.key) {
      rows.push(item.row)
      continue
    }
    const rec = bestByKey.get(item.key)
    if (rec && rec.row) rows.push(rec.row)
    bestByKey.delete(item.key)
  }

  // Build indices on the final deduped array
  for (let i = 0; i < rows.length; i += 1) {
    const outRow = rows[i]
    const uidKey = digitsOnly(outRow.userid)
    if (uidKey) addIndex(byUserId, uidKey, i)

    const mt5Key = digitsOnly(outRow.mt5account)
    if (mt5Key) addIndex(byMt5, mt5Key, i)

    const emailKey = normalizeForIndex(outRow.email)
    if (emailKey) addIndex(byEmail, emailKey, i)
  }

  const generatedAt = new Date().toISOString()
  const out = {
    version: 3,
    generatedAt,
    source: path.basename(inputPath),
    total: rows.length,
    byUserId,
    byMt5,
    byEmail,
    rows,
  }

  const quickOut = {
    version: 1,
    generatedAt,
    source: path.basename(inputPath),
    total: rows.length,
    rows: rows.map((row) => ({
      customername: row.customername || '',
      userid: row.userid || '',
      mt5account: row.mt5account || '',
      registrationdate: row.registrationdate || '',
      affiliateid: row.affiliateid || '',
      status: row.status || '',
      country: row.country || '',
      totaldeposits: row.totaldeposits || '',
      netdeposits: row.netdeposits || '',
      withdrawals: row.withdrawals || '',
      positioncount: row.positioncount || '',
      position_count: row.positioncount || '',
      volume: row.volume || '',
      pl: row.pl || '',
      __searchIndex: row.__searchIndex || '',
    })),
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out), 'utf8')
  fs.writeFileSync(QUICK_OUT_PATH, JSON.stringify(quickOut), 'utf8')
  const botCandidatesOut = buildBotCandidates(rows, generatedAt, path.basename(inputPath))
  fs.writeFileSync(BOT_CANDIDATES_OUT_PATH, JSON.stringify(botCandidatesOut), 'utf8')

  const fullSizeMb = (fs.statSync(OUT_PATH).size / (1024 * 1024)).toFixed(2)
  const quickSizeMb = (fs.statSync(QUICK_OUT_PATH).size / (1024 * 1024)).toFixed(2)
  const botSizeKb = (fs.statSync(BOT_CANDIDATES_OUT_PATH).size / 1024).toFixed(1)
  console.log(
    `Generated ${rows.length} support users -> ${path.relative(process.cwd(), OUT_PATH)} (${fullSizeMb} MB), ${path.relative(process.cwd(), QUICK_OUT_PATH)} (${quickSizeMb} MB), ${path.relative(process.cwd(), BOT_CANDIDATES_OUT_PATH)} (${botSizeKb} KB)`
  )
}

main()
