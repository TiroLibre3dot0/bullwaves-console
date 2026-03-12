/*
Cleanup CSV artifacts safely.

Default mode is DRY-RUN (prints what would be deleted).

Targets (conservative):
- Root tmp_*.csv
- uploads/_stream_*.csv (smoke tests)
- artifacts/raw/*_raw.*.csv and artifacts/raw/*duplicates.*.csv
- public/raw/*_raw.*.csv and public/raw/*duplicates.*.csv (legacy)
- public/*.bak (only the auto backups created by sanitizers)

It does NOT touch canonical reports:
- public/Registrations Report.csv
- public/Payments Report.csv
- public/Media Report.csv

Usage:
  node scripts/cleanup_csv_artifacts.js
  node scripts/cleanup_csv_artifacts.js --apply
  node scripts/cleanup_csv_artifacts.js --days=30 --keep-bak=3 --keep-raw=5
  node scripts/cleanup_csv_artifacts.js --purge-raw --apply
*/

const fs = require('fs')
const path = require('path')

const repoRoot = path.join(__dirname, '..')

function argValue(name, def) {
  const prefix = `--${name}=`
  const hit = process.argv.find(a => a.startsWith(prefix))
  if (!hit) return def
  return hit.slice(prefix.length)
}

const APPLY = process.argv.includes('--apply')
const ALL_BACKUPS = process.argv.includes('--all-backups')
const PURGE_RAW = process.argv.includes('--purge-raw')

const DAYS = parseInt(argValue('days', (ALL_BACKUPS || PURGE_RAW) ? '0' : '30'), 10)
const KEEP_BAK = parseInt(argValue('keep-bak', ALL_BACKUPS ? '0' : '3'), 10)
const KEEP_RAW = parseInt(argValue('keep-raw', (ALL_BACKUPS || PURGE_RAW) ? '0' : '5'), 10)

const now = Date.now()
const cutoffMs = Number.isFinite(DAYS) ? DAYS * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000

function safeStat(p) {
  try { return fs.statSync(p) } catch { return null }
}

function listFiles(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = safeStat(full)
    if (!st || !st.isFile()) continue
    out.push({ name, full, st })
  }
  return out
}

function toMB(bytes) {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100
}

function pickOld(files, keepNewest, olderThanMs, reasonFn) {
  const sorted = [...files].sort((a, b) => b.st.mtimeMs - a.st.mtimeMs)
  const keep = new Set(sorted.slice(0, Math.max(0, keepNewest)).map(f => f.full))
  const candidates = []
  for (const f of sorted) {
    const age = now - f.st.mtimeMs
    if (keep.has(f.full)) continue
    if (age < olderThanMs) continue
    candidates.push({ ...f, reason: reasonFn ? reasonFn(f) : '' })
  }
  return candidates
}

function main() {
  const targets = []

  // 1) root tmp_*.csv (always safe: local scratch)
  for (const f of listFiles(repoRoot)) {
    if (/^tmp_.*\.csv$/i.test(f.name)) {
      targets.push({ ...f, reason: 'root tmp CSV' })
    }
  }

  // 2) uploads/_stream_*.csv (smoke test uploads)
  const uploadsDir = path.join(repoRoot, 'uploads')
  for (const f of listFiles(uploadsDir)) {
    if (/^_stream_.*\.csv$/i.test(f.name)) {
      targets.push({ ...f, reason: 'upload smoke CSV' })
    }
  }

  // 2b) uploads/<timestamp>-*.csv (uploaded copies saved by multer)
  // These are safe to delete: sanitizers write to public/*.csv, and these are just transient inputs.
  for (const f of listFiles(uploadsDir)) {
    if (/^\d{13}-.*\.csv$/i.test(f.name)) {
      targets.push({ ...f, reason: 'uploaded CSV copy (timestamped)' })
    }
  }

  // 3) raw backups and duplicates (keep newest few, delete older than DAYS)
  // New location: artifacts/raw (keeps backups out of Vite publicDir to avoid bloating dist/)
  // Legacy location: public/raw
  const rawDirs = [
    { label: 'artifacts/raw', dir: path.join(repoRoot, 'artifacts', 'raw') },
    { label: 'public/raw', dir: path.join(repoRoot, 'public', 'raw') },
  ]

  for (const { label, dir } of rawDirs) {
    const rawFilesAllCsv = listFiles(dir).filter(f => /\.csv$/i.test(f.name))
    const rawFiles = (ALL_BACKUPS || PURGE_RAW)
      ? rawFilesAllCsv
      : rawFilesAllCsv.filter(f => /(_raw\.|duplicates\.)/i.test(f.name))

    const byPrefix = new Map()
    for (const f of rawFiles) {
      const prefix = f.name.split('.')[0] // payments_raw / registrations_raw / registrations_duplicates / media_raw
      if (!byPrefix.has(prefix)) byPrefix.set(prefix, [])
      byPrefix.get(prefix).push(f)
    }

    for (const [prefix, files] of byPrefix.entries()) {
      const del = pickOld(
        files,
        KEEP_RAW,
        cutoffMs,
        () => `${label} ${prefix} (keep ${KEEP_RAW}, older than ${DAYS}d)`
      )
      targets.push(...del)
    }
  }

  // 4) public/*.bak (keep newest KEEP_BAK, delete older than DAYS)
  const publicDir = path.join(repoRoot, 'public')
  const bakFiles = listFiles(publicDir).filter(f => /\.bak$/i.test(f.name) && /Report\.csv\./i.test(f.name))
  targets.push(...pickOld(bakFiles, KEEP_BAK, cutoffMs, () => `public .bak (keep ${KEEP_BAK}, older than ${DAYS}d)`))

  // de-dup targets
  const seen = new Set()
  const unique = []
  for (const t of targets) {
    if (seen.has(t.full)) continue
    seen.add(t.full)
    unique.push(t)
  }

  unique.sort((a, b) => b.st.size - a.st.size)

  const totalBytes = unique.reduce((s, f) => s + (f.st.size || 0), 0)

  console.log(`CSV cleanup (${APPLY ? 'APPLY' : 'DRY-RUN'})`) 
  if (ALL_BACKUPS) console.log('Mode: --all-backups (delete all backup artifacts)')
  if (PURGE_RAW) console.log('Mode: --purge-raw (delete all public/raw/*.csv artifacts)')
  console.log(`Policy: days=${DAYS}, keep-raw=${KEEP_RAW}, keep-bak=${KEEP_BAK}`)
  console.log(`Found ${unique.length} files, ~${toMB(totalBytes)} MB`) 

  const maxToShow = 60
  for (const f of unique.slice(0, maxToShow)) {
    const ageDays = Math.round(((now - f.st.mtimeMs) / (24 * 60 * 60 * 1000)) * 10) / 10
    console.log(`- ${path.relative(repoRoot, f.full)}  (${toMB(f.st.size)} MB, ${ageDays}d)  [${f.reason}]`)
  }
  if (unique.length > maxToShow) console.log(`… and ${unique.length - maxToShow} more`) 

  if (!APPLY) {
    console.log('\nRun with --apply to delete the files above.')
    return
  }

  let deleted = 0
  let failed = 0
  for (const f of unique) {
    try {
      fs.unlinkSync(f.full)
      deleted++
    } catch (e) {
      failed++
      console.warn('Failed to delete:', f.full, e && e.message)
    }
  }

  console.log(`\nDeleted ${deleted} files. Failed: ${failed}.`) 
}

main()
