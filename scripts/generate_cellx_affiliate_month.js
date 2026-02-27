/*
Generate a lightweight CellXpert affiliate+month table used by the Investments dashboard.

Purpose:
- Avoid parsing large CSVs in the browser (stability + speed)
- Provide deterministic values for Unified View (CellX vs Creolabs)

Output: public/cellx_affiliate_month.json
Rows: { affiliateId, affiliateName, year, monthIndex, netDeposits, commission, pl }
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const ROOT_DIR = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT_DIR, 'public')

const MEDIA_CANDIDATES = ['Media Report.csv', '01012025 to 12072025 Media Report.csv']

const OUT_PATH = path.join(PUBLIC_DIR, 'cellx_affiliate_month.json')

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function cleanNumber(value) {
  if (value === null || value === undefined) return 0
  const str = String(value).replace(/[$,]/g, '').trim()
  if (!str) return 0
  const num = Number(str)
  return Number.isNaN(num) ? 0 : num
}

function parseMonth(raw) {
  const s = String(raw || '').trim()
  if (!s) return null

  // month-first: 1/2026, 01/2026
  let m = s.match(/^\s*(\d{1,2})\/(\d{4})\s*$/)
  if (m) {
    const monthIndex = Math.max(0, (Number(m[1]) || 1) - 1)
    const year = Number(m[2])
    if (Number.isFinite(year)) return { year, monthIndex }
  }

  // year-first: 2026-01 or 2026/1
  m = s.match(/^\s*(\d{4})[\/-](\d{1,2})\s*$/)
  if (m) {
    const year = Number(m[1])
    const monthIndex = Math.max(0, (Number(m[2]) || 1) - 1)
    if (Number.isFinite(year)) return { year, monthIndex }
  }

  // ISO-ish date: 2026-01-31
  m = s.match(/^\s*(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s*$/)
  if (m) {
    const year = Number(m[1])
    const monthIndex = Math.max(0, (Number(m[2]) || 1) - 1)
    if (Number.isFinite(year)) return { year, monthIndex }
  }

  const dt = new Date(s)
  if (!Number.isNaN(dt.getTime())) return { year: dt.getFullYear(), monthIndex: dt.getMonth() }

  return null
}

function pick(row, keys, fallback = '') {
  for (const k of keys) {
    if (!k) continue
    if (Object.prototype.hasOwnProperty.call(row, k) && row[k] != null && String(row[k]).trim() !== '') {
      return row[k]
    }
  }
  return fallback
}

function findFirstExistingCsvPath() {
  for (const filename of MEDIA_CANDIDATES) {
    const p = path.join(PUBLIC_DIR, filename)
    if (fs.existsSync(p)) return p
  }
  return null
}

function buildAffiliateNameToIdMap() {
  const idxPath = path.join(PUBLIC_DIR, 'affiliate_index.json')
  const json = readJson(idxPath)
  const byId = json && typeof json === 'object' ? json.byId : null
  if (!byId || typeof byId !== 'object') return new Map()

  const map = new Map()
  for (const [id, entry] of Object.entries(byId)) {
    const name = typeof entry === 'string' ? entry : entry?.name || entry?.affiliateName
    const s = String(name || '').trim()
    if (!s) continue
    const k = s.toLowerCase()
    if (!map.has(k)) map.set(k, String(id).trim())
  }
  return map
}

function writeFileAtomic(filePath, content) {
  const dir = path.dirname(filePath)
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`)
  fs.writeFileSync(tmp, content)
  fs.renameSync(tmp, filePath)
}

function main() {
  const mediaPath = findFirstExistingCsvPath()
  if (!mediaPath) {
    console.warn('[CellX] No Media Report CSV found; skipping cellx_affiliate_month.json')
    writeFileAtomic(
      OUT_PATH,
      JSON.stringify({ generatedAt: new Date().toISOString(), rows: [] }, null, 2)
    )
    return
  }

  const nameToId = buildAffiliateNameToIdMap()

  const text = fs.readFileSync(mediaPath, 'utf8')
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })

  if (parsed.errors && parsed.errors.length) {
    console.warn('[CellX] CSV parse warnings:', parsed.errors.slice(0, 3))
  }

  const rows = Array.isArray(parsed.data) ? parsed.data : []

  const acc = new Map()

  for (const r of rows) {
    const monthRaw = pick(r, ['month', 'Month'], '')
    const mm = parseMonth(monthRaw)
    if (!mm) continue

    const affiliateName = String(pick(r, ['affiliate', 'Affiliate'], '—')).trim() || '—'
    const uid = String(pick(r, ['uid', 'UID'], '')).trim()

    const mappedId = nameToId.get(affiliateName.toLowerCase())
    const affiliateId = (mappedId || uid || affiliateName || '—').trim() || '—'

    const key = `${affiliateId}|${mm.year}|${mm.monthIndex}`
    if (!acc.has(key)) {
      acc.set(key, {
        affiliateId,
        affiliateName,
        year: mm.year,
        monthIndex: mm.monthIndex,
        netDeposits: 0,
        commission: 0,
        pl: 0,
      })
    }

    const a = acc.get(key)
    a.netDeposits += cleanNumber(pick(r, ['net_deposits', 'Net Deposits', 'netdeposits'], 0))
    a.commission += cleanNumber(pick(r, ['commission', 'Commission'], 0))
    a.pl += cleanNumber(pick(r, ['pl', 'PL'], 0))
  }

  const outRows = Array.from(acc.values()).sort(
    (a, b) => b.year - a.year || b.monthIndex - a.monthIndex || String(a.affiliateId).localeCompare(String(b.affiliateId))
  )

  const payload = {
    generatedAt: new Date().toISOString(),
    source: path.basename(mediaPath),
    rows: outRows,
  }

  writeFileAtomic(OUT_PATH, JSON.stringify(payload, null, 2))
  console.log(`[CellX] Wrote public\\cellx_affiliate_month.json (rows=${outRows.length})`)
}

main()
