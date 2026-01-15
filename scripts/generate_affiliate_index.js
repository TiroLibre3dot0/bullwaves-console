/*
Generate a lightweight affiliate id -> name index used by the frontend.

Reads from public/Payments Report.csv (preferred, contains affiliate_id + affiliate).
Optionally enriches from other CSVs if present.

Usage:
  node scripts/generate_affiliate_index.js

Output:
  public/affiliate_index.json
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const OUT_PATH = path.join(PUBLIC_DIR, 'affiliate_index.json')

const FORCE = process.argv.includes('--force')

const PAYMENTS_PATH = path.join(PUBLIC_DIR, 'Payments Report.csv')

function safeReadText(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

function normalizeId(v) {
  const s = String(v ?? '').trim()
  return s
}

function normalizeName(v) {
  const s = String(v ?? '').trim()
  return s
}

function parseCsv(text) {
  const res = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  return Array.isArray(res.data) ? res.data : []
}

function buildFromPayments() {
  const text = safeReadText(PAYMENTS_PATH)
  if (!text) return { map: new Map(), source: null }

  const rows = parseCsv(text)
  const map = new Map()

  for (const row of rows) {
    const id = normalizeId(row.affiliate_id ?? row.affiliateId ?? row['Affiliate ID'] ?? row['affiliate id'])
    const name = normalizeName(row.affiliate ?? row.affiliate_name ?? row['Affiliate'] ?? row['Affiliate Name'])
    if (!id) continue
    if (!name) continue
    if (!map.has(id)) map.set(id, name)
  }

  return { map, source: 'Payments Report.csv' }
}

function writeIndex(map, meta = {}) {
  const byId = {}
  const entries = Array.from(map.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  for (const [id, name] of entries) byId[String(id)] = String(name)

  const out = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sources: meta.sources || [],
    total: entries.length,
    byId,
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
  return out
}

function main() {
  if (!FORCE && fs.existsSync(OUT_PATH)) {
    try {
      const outStat = fs.statSync(OUT_PATH)
      const paymentsMt = fs.existsSync(PAYMENTS_PATH) ? fs.statSync(PAYMENTS_PATH).mtimeMs : 0
      if (outStat.mtimeMs >= paymentsMt) {
        console.log(`Affiliate index up-to-date (use --force to regenerate) -> ${path.relative(process.cwd(), OUT_PATH)}`)
        return
      }
    } catch {
      // Fall through to regeneration.
    }
  }

  const sources = []
  const { map: paymentsMap, source: paymentsSource } = buildFromPayments()
  if (paymentsSource) sources.push(paymentsSource)

  const merged = new Map()
  for (const [k, v] of paymentsMap.entries()) merged.set(k, v)

  const out = writeIndex(merged, { sources })
  console.log(`Generated ${out.total} affiliate names -> ${path.relative(process.cwd(), OUT_PATH)}`)
  if (!out.total) {
    console.log('Note: no affiliates found. Ensure public/Payments Report.csv exists and includes affiliate_id + affiliate columns.')
  }
}

main()
