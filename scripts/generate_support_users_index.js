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
    if (isNonEmpty(row[k])) return stripOuterQuotes(row[k])
    // Also check duplicate keys (e.g. "foo__2")
    for (let i = 2; i <= 6; i += 1) {
      const dk = `${k}__${i}`
      if (isNonEmpty(row[dk])) return stripOuterQuotes(row[dk])
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
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
    console.log(`No registrations CSV found. Wrote empty index -> ${path.relative(process.cwd(), OUT_PATH)}`)
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
      mt5account: pickFieldNormalized(r, ['mt5account', 'mt5', 'mt5_account']),
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

  const out = {
    version: 2,
    generatedAt: new Date().toISOString(),
    source: path.basename(inputPath),
    total: rows.length,
    byUserId,
    byMt5,
    byEmail,
    rows,
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
  console.log(`Generated ${rows.length} support users -> ${path.relative(process.cwd(), OUT_PATH)}`)
}

main()
