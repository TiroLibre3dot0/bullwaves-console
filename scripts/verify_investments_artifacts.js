/*
Verify that the Investments/Unified data artifacts are fresh and consistent.

Why:
- The UI reads precomputed JSON artifacts (e.g. public/cellx_affiliate_month.json)
  generated from large CSVs (e.g. public/Media Report.csv).
- If the CSV is updated without regenerating the JSON, the UI can show stale totals.

Usage:
  node scripts/verify_investments_artifacts.js
  node scripts/verify_investments_artifacts.js --verbose
  node scripts/verify_investments_artifacts.js --tolerance=0.01

Exit codes:
  0 = OK
  2 = mismatches / stale artifacts
  1 = unexpected error
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')

const MEDIA_CSV = path.join(PUBLIC, 'Media Report.csv')
const CELLX_JSON = path.join(PUBLIC, 'cellx_affiliate_month.json')

function parseArgs(argv) {
  const out = { verbose: false, tolerance: 0.01 }
  for (const raw of argv) {
    const s = String(raw || '').trim()
    if (!s) continue
    if (s === '--verbose' || s === '-v') out.verbose = true
    if (s.startsWith('--tolerance=')) {
      const v = Number(s.split('=')[1])
      if (Number.isFinite(v) && v >= 0) out.tolerance = v
    }
  }
  return out
}

function cleanNumber(value) {
  if (value === null || value === undefined) return 0
  const s = String(value)
    .replace(/[$,]/g, '')
    .replace(/\u00a0/g, ' ')
    .trim()
  if (!s) return 0

  // Handle parentheses for negatives: (123.45)
  const paren = s.match(/^\((.*)\)$/)
  const normalized = paren ? `-${paren[1]}` : s

  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

function monthKeyFromMedia(m) {
  const s = String(m || '').trim()
  if (!s) return null

  // 2/2026 or 02/2026
  let mm = s.match(/^\s*(\d{1,2})\/(\d{4})\s*$/)
  if (mm) {
    const month = Number(mm[1])
    const year = Number(mm[2])
    if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) return null
    return `${year}-${String(month).padStart(2, '0')}`
  }

  // 2026-02 or 2026/2
  mm = s.match(/^\s*(\d{4})[\/-](\d{1,2})\s*$/)
  if (mm) {
    const year = Number(mm[1])
    const month = Number(mm[2])
    if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) return null
    return `${year}-${String(month).padStart(2, '0')}`
  }

  // ISO-ish date
  mm = s.match(/^\s*(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s*$/)
  if (mm) {
    const year = Number(mm[1])
    const month = Number(mm[2])
    if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) return null
    return `${year}-${String(month).padStart(2, '0')}`
  }

  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  return null
}

function monthKeyFromCellxRow(r) {
  const year = Number(r?.year)
  const monthIndex = Number(r?.monthIndex)
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11)
    return null
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function statLine(label, ok) {
  return `${ok ? 'OK ' : 'ERR'} ${label}`
}

function formatMoney(n) {
  const v = Number(n) || 0
  const rounded = Math.round(v * 100) / 100
  return rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function absDiff(a, b) {
  const x = Number(a) || 0
  const y = Number(b) || 0
  return Math.abs(x - y)
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function aggregateMediaCsv(csvPath) {
  const txt = fs.readFileSync(csvPath, 'utf8')
  const parsed = Papa.parse(txt, { header: true, skipEmptyLines: true })
  if (parsed.errors && parsed.errors.length) {
    const e = new Error(`CSV parse errors: ${parsed.errors[0]?.message || parsed.errors[0]?.type || 'unknown'}`)
    e.errors = parsed.errors
    throw e
  }

  const out = new Map()
  const rows = Array.isArray(parsed.data) ? parsed.data : []
  for (const r of rows) {
    const key = monthKeyFromMedia(r?.month ?? r?.Month)
    if (!key) continue
    if (!out.has(key)) out.set(key, { netDeposits: 0, pl: 0, commission: 0, rows: 0 })
    const acc = out.get(key)

    acc.netDeposits += cleanNumber(r?.net_deposits ?? r?.['Net Deposits'] ?? r?.netdeposits)
    acc.pl += cleanNumber(r?.pl ?? r?.PL)
    acc.commission += cleanNumber(r?.commission ?? r?.Commission)
    acc.rows += 1
  }

  return out
}

function aggregateCellxJson(jsonPath) {
  const j = readJson(jsonPath)
  const rows = Array.isArray(j?.rows) ? j.rows : []
  const out = new Map()

  for (const r of rows) {
    const key = monthKeyFromCellxRow(r)
    if (!key) continue
    if (!out.has(key)) out.set(key, { netDeposits: 0, pl: 0, commission: 0, rows: 0 })
    const acc = out.get(key)

    acc.netDeposits += cleanNumber(r?.netDeposits)
    acc.pl += cleanNumber(r?.pl)
    acc.commission += cleanNumber(r?.commission)
    acc.rows += 1
  }

  return { meta: j, byMonth: out }
}

function getFileMtimeMs(p) {
  try {
    return fs.statSync(p).mtimeMs
  } catch {
    return 0
  }
}

function coerceToMillis(v) {
  const s = String(v || '').trim()
  if (!s) return 0
  if (/^\d{10,}$/.test(s)) {
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }
  const d = Date.parse(s)
  return Number.isFinite(d) ? d : 0
}

function main() {
  const opts = parseArgs(process.argv.slice(2))

  const problems = []
  const notes = []

  if (!fs.existsSync(MEDIA_CSV)) problems.push(`Missing ${path.relative(ROOT, MEDIA_CSV)}`)
  if (!fs.existsSync(CELLX_JSON)) problems.push(`Missing ${path.relative(ROOT, CELLX_JSON)}`)
  if (problems.length) {
    console.error('ERR Missing required files:')
    problems.forEach((p) => console.error(' -', p))
    process.exit(2)
  }

  // Freshness check (mtime + generatedAt)
  const mediaMtime = getFileMtimeMs(MEDIA_CSV)
  const cellxMtime = getFileMtimeMs(CELLX_JSON)

  const { meta: cellxMeta, byMonth: cellxAgg } = aggregateCellxJson(CELLX_JSON)
  const cellxGeneratedMs = coerceToMillis(cellxMeta?.generatedAt)

  if (mediaMtime > cellxMtime + 500) {
    problems.push(
      `Stale artifact: cellx_affiliate_month.json mtime is older than Media Report.csv (csv newer by ${Math.round(
        (mediaMtime - cellxMtime) / 1000
      )}s)`
    )
  }

  if (cellxGeneratedMs && mediaMtime > cellxGeneratedMs + 500) {
    problems.push(
      `Stale artifact: cellx_affiliate_month.json generatedAt is older than Media Report.csv (csv newer by ${Math.round(
        (mediaMtime - cellxGeneratedMs) / 1000
      )}s)`
    )
  }

  const mediaAgg = aggregateMediaCsv(MEDIA_CSV)

  // Consistency check per-month totals
  const keys = new Set([...Array.from(mediaAgg.keys()), ...Array.from(cellxAgg.keys())])
  const mismatches = []

  for (const key of Array.from(keys).sort()) {
    const a = mediaAgg.get(key) || { netDeposits: 0, pl: 0, commission: 0, rows: 0 }
    const b = cellxAgg.get(key) || { netDeposits: 0, pl: 0, commission: 0, rows: 0 }

    const netDiff = absDiff(a.netDeposits, b.netDeposits)
    const plDiff = absDiff(a.pl, b.pl)
    const commDiff = absDiff(a.commission, b.commission)

    const maxDiff = Math.max(netDiff, plDiff, commDiff)
    if (maxDiff > opts.tolerance) {
      mismatches.push({
        month: key,
        media: a,
        cellx: b,
        diff: { net: netDiff, pl: plDiff, commission: commDiff },
      })
    }
  }

  if (mismatches.length) {
    problems.push(
      `Totals mismatch between Media Report.csv and cellx_affiliate_month.json for ${mismatches.length} month(s) (tolerance=${opts.tolerance}).`
    )
  }

  console.log(statLine('Required files present', true))
  console.log(statLine('cellx_affiliate_month.json freshness', problems.every((p) => !p.startsWith('Stale artifact'))))

  const feb = '2026-02'
  if (mediaAgg.has(feb)) {
    const m = mediaAgg.get(feb)
    const c = cellxAgg.get(feb)
    notes.push(
      `Feb 2026 (from CSV): net=${formatMoney(m.netDeposits)} pl=${formatMoney(m.pl)} comm=${formatMoney(m.commission)} rows=${m.rows}`
    )
    if (c) {
      notes.push(
        `Feb 2026 (from JSON): net=${formatMoney(c.netDeposits)} pl=${formatMoney(c.pl)} comm=${formatMoney(c.commission)} rows=${c.rows}`
      )
    }
  }

  if (opts.verbose) {
    console.log('--- Meta ---')
    console.log({
      mediaCsv: path.relative(ROOT, MEDIA_CSV),
      cellxJson: path.relative(ROOT, CELLX_JSON),
      mediaMtime: new Date(mediaMtime).toISOString(),
      cellxMtime: new Date(cellxMtime).toISOString(),
      cellxGeneratedAt: cellxMeta?.generatedAt || null,
      source: cellxMeta?.source || null,
      monthsInCsv: mediaAgg.size,
      monthsInJson: cellxAgg.size,
    })
  }

  notes.forEach((n) => console.log('INFO', n))

  if (mismatches.length && opts.verbose) {
    console.log('--- Mismatches (first 10) ---')
    mismatches.slice(0, 10).forEach((m) => {
      console.log(
        m.month,
        'diff:',
        {
          net: formatMoney(m.diff.net),
          pl: formatMoney(m.diff.pl),
          commission: formatMoney(m.diff.commission),
        },
        'csv:',
        {
          net: formatMoney(m.media.netDeposits),
          pl: formatMoney(m.media.pl),
          commission: formatMoney(m.media.commission),
          rows: m.media.rows,
        },
        'json:',
        {
          net: formatMoney(m.cellx.netDeposits),
          pl: formatMoney(m.cellx.pl),
          commission: formatMoney(m.cellx.commission),
          rows: m.cellx.rows,
        }
      )
    })
  }

  if (problems.length) {
    console.error('--- Problems ---')
    problems.forEach((p) => console.error(' -', p))
    process.exit(2)
  }

  console.log(statLine('Media CSV ↔ CellX JSON totals', true))
  process.exit(0)
}

try {
  main()
} catch (e) {
  console.error('ERR verify_investments_artifacts failed:', e && e.message ? e.message : e)
  if (e && e.errors && Array.isArray(e.errors)) {
    console.error('ERR CSV parse errors (first 3):', e.errors.slice(0, 3))
  }
  process.exit(1)
}
