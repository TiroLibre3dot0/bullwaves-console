/*
Generate lightweight report metadata used by the frontend to avoid expensive browser-side CSV scanning.

Outputs:
  public/reports_meta.json

This file is intentionally small and safe to fetch on every app load.
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const OUT_PATH = path.join(PUBLIC_DIR, 'reports_meta.json')

const FORCE = process.argv.includes('--force')

const REPORTS = [
  {
    key: 'registrations',
    label: 'Registrations Report',
    path: path.join(PUBLIC_DIR, 'Registrations Report.csv'),
    dateCandidates: [
      'registrationdate',
      'regdate',
      'externaldate',
      'registered',
      'registration_date',
      'registration date',
    ],
  },
  {
    key: 'payments',
    label: 'Payments Report',
    path: path.join(PUBLIC_DIR, 'Payments Report.csv'),
    dateCandidates: ['paymentdate', 'payment_date', 'payment date', 'date'],
  },
  {
    key: 'media',
    label: 'Media Report',
    path: path.join(PUBLIC_DIR, 'Media Report.csv'),
    // This report is often aggregated by month; use file mtime as primary signal.
    dateCandidates: ['month', 'monthlabel', 'month_label', 'date'],
  },
  {
    key: 'comments',
    label: 'Comments Report',
    // The comments pipeline writes to `public/comments.csv`.
    // Keep meta aligned so `generatedAt` updates when comments change.
    path: path.join(PUBLIC_DIR, 'comments.csv'),
    dateCandidates: ['created_on', 'createdon', 'created', 'date'],
  },
]

function walkFiles(dir) {
  const out = []
  let items = []
  try {
    items = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const ent of items) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      // Skip common noisy folders.
      const name = String(ent.name || '').toLowerCase()
      if (name === 'node_modules' || name === 'dist') continue
      out.push(...walkFiles(p))
    } else if (ent.isFile()) {
      out.push(p)
    }
  }
  return out
}

function isDataFile(p) {
  const base = path.basename(String(p || ''))
  if (!base) return false
  if (base === 'reports_meta.json') return false
  const lower = base.toLowerCase()
  if (lower.endsWith('.csv')) return true
  // Include generated indexes and share artifacts that affect dashboards.
  if (lower.endsWith('.json')) return true
  return false
}

function normKey(k) {
  return String(k || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '')
}

function parseDateMaybe(v) {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null

  // Native Date handles ISO and many common formats.
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d

  // Try MM/DD/YYYY ...
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) {
    const mm = Number(m[1])
    const dd = Number(m[2])
    let yy = Number(m[3])
    if (yy < 100) yy += 2000
    const d2 = new Date(yy, mm - 1, dd)
    if (!Number.isNaN(d2.getTime())) return d2
  }

  return null
}

function countNonEmptyLines(text) {
  const lines = String(text || '').split(/\r?\n/)
  let count = 0
  for (const line of lines) {
    if (line && line.trim().length) count += 1
  }
  return count
}

function scanLatestDateFromCsvText(text, candidates) {
  const candidateSet = new Set((candidates || []).map(normKey))
  let latest = null
  let dateKey = null
  let rowCount = 0

  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    step: (res) => {
      const row = res && res.data ? res.data : null
      if (!row) return
      rowCount += 1

      if (!dateKey) {
        const keys = Object.keys(row || {})
        const found = keys.find((k) => candidateSet.has(normKey(k)))
        dateKey = found || null
      }
      if (!dateKey) return

      const dt = parseDateMaybe(row[dateKey])
      if (!dt) return
      if (!latest || dt > latest) latest = dt
    },
  })

  return { latest, rowCount, dateKey }
}

function buildReportMeta(rep) {
  const exists = fs.existsSync(rep.path)
  if (!exists) {
    return {
      key: rep.key,
      label: rep.label,
      exists: false,
    }
  }

  const stat = fs.statSync(rep.path)
  const sizeBytes = stat.size
  const mtime = stat.mtime ? new Date(stat.mtime) : null

  let text = null
  try {
    // Read a bounded amount for huge files? For now read all; Node is fine.
    text = fs.readFileSync(rep.path, 'utf8')
  } catch {
    text = null
  }

  let latestDate = null
  let rowCount = null
  let dateKey = null

  if (text) {
    // Approx row count without parsing: lines - header
    const nonEmptyLines = countNonEmptyLines(text)
    rowCount = Math.max(0, nonEmptyLines - 1)

    // Attempt latest date from a candidate column.
    try {
      const scanned = scanLatestDateFromCsvText(text, rep.dateCandidates)
      if (scanned && scanned.latest) latestDate = scanned.latest
      if (scanned && scanned.dateKey) dateKey = scanned.dateKey
    } catch {
      // ignore
    }
  }

  const latestIso = latestDate ? latestDate.toISOString() : null
  const mtimeIso = mtime ? mtime.toISOString() : null

  return {
    key: rep.key,
    label: rep.label,
    exists: true,
    path: `/${path.basename(rep.path)}`,
    sizeBytes,
    rowCount,
    latestDate: latestIso || mtimeIso,
    dateKey: dateKey ? String(dateKey) : null,
    mtime: mtimeIso,
  }
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('Missing public dir:', PUBLIC_DIR)
    process.exit(1)
  }

  if (!FORCE && fs.existsSync(OUT_PATH)) {
    try {
      const outStat = fs.statSync(OUT_PATH)
      // IMPORTANT:
      // This file is used as a global cache-busting/version signal by the frontend.
      // If we only watch a subset of reports here, other data files (e.g. KPI/Fraud)
      // can change without bumping the version, causing clients/CDN to serve stale data.
      const inputMt = walkFiles(PUBLIC_DIR)
        .filter(isDataFile)
        .map((p) => {
          try {
            return fs.statSync(p).mtimeMs
          } catch {
            return 0
          }
        })
        .reduce((a, b) => Math.max(a, b), 0)
      if (outStat.mtimeMs >= inputMt) {
        console.log(`Reports meta up-to-date (use --force to regenerate) -> ${path.relative(process.cwd(), OUT_PATH)}`)
        return
      }
    } catch {
      // Fall through to regeneration.
    }
  }

  const reports = {}
  for (const rep of REPORTS) {
    reports[rep.key] = buildReportMeta(rep)
  }

  const out = {
    version: 1,
    generatedAt: new Date().toISOString(),
    reports,
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
  console.log(`Generated reports meta -> ${path.relative(process.cwd(), OUT_PATH)}`)
}

main()
