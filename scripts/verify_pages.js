/*
Verify that the built app pages will serve up-to-date data assets.

What this checks:
1) public/ artifacts existence + freshness relative to public/reports_meta.json
   (reports_meta is generated LAST and acts as global cache-busting signal).
2) After build, dist/ contains the same copied public assets (byte-identical)
   for the key JSON/CSV artifacts consumed by pages.

Usage:
  node scripts/verify_pages.js
  node scripts/verify_pages.js --dist
  node scripts/verify_pages.js --verbose

Exit codes:
  0 = OK
  2 = missing/stale/mismatch
  1 = unexpected error
*/

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const DIST = path.join(ROOT, 'dist')

function parseArgs(argv) {
  const out = { verbose: false, checkDist: false }
  for (const raw of argv || []) {
    const s = String(raw || '').trim()
    if (!s) continue
    if (s === '--verbose' || s === '-v') out.verbose = true
    if (s === '--dist') out.checkDist = true
  }
  return out
}

function safeStat(p) {
  try {
    const st = fs.statSync(p)
    return { exists: true, isFile: st.isFile(), mtimeMs: st.mtimeMs || 0, size: st.size || 0 }
  } catch {
    return { exists: false, isFile: false, mtimeMs: 0, size: 0 }
  }
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/')
}

function sha256File(p) {
  const h = crypto.createHash('sha256')
  h.update(fs.readFileSync(p))
  return h.digest('hex')
}

function main() {
  const opts = parseArgs(process.argv.slice(2))

  const problems = []
  const notes = []

  const metaPath = path.join(PUBLIC, 'reports_meta.json')
  const metaSt = safeStat(metaPath)
  if (!metaSt.exists) {
    problems.push(`Missing ${rel(metaPath)}`)
  }

  // Core artifacts that many pages depend on.
  // (Optional ones should not fail the run if their sources are not present.)
  const core = [
    { p: path.join(PUBLIC, 'affiliate_index.json'), optional: true },
    { p: path.join(PUBLIC, 'affiliate_kpi_index.json'), optional: true },
    { p: path.join(PUBLIC, 'support_users_index.json'), optional: true },
    { p: path.join(PUBLIC, 'fraud_patterns_index.json'), optional: true },
    { p: path.join(PUBLIC, 'rankings_index.json'), optional: true },
    { p: path.join(PUBLIC, 'rankings_users_table.json'), optional: true },
    { p: path.join(PUBLIC, 'cellx_affiliate_month.json'), optional: true },
    { p: path.join(PUBLIC, 'creolabs_index.json'), optional: true },
    { p: path.join(PUBLIC, 'creolabs_clients_table.json'), optional: true },
    { p: path.join(PUBLIC, 'creolabs_affiliate_month.json'), optional: true },
    { p: path.join(PUBLIC, 'share', 'org-chart-people.json'), optional: true },
    { p: path.join(PUBLIC, 'fraud_monitor_summary.json'), optional: true },
    { p: path.join(PUBLIC, 'fraud_monitor_name_groups.json'), optional: true },
  ]

  // If meta exists, ensure it is >= each artifact mtime (meta is generated last).
  const metaMtime = metaSt.exists ? metaSt.mtimeMs : 0
  const graceMs = 800

  for (const item of core) {
    const st = safeStat(item.p)
    if (!st.exists) {
      if (item.optional) {
        notes.push(`SKIP missing optional ${rel(item.p)}`)
        continue
      }
      problems.push(`Missing ${rel(item.p)}`)
      continue
    }
    if (metaMtime && st.mtimeMs > metaMtime + graceMs) {
      problems.push(`${rel(metaPath)} is older than ${rel(item.p)} (meta must be generated last)`)
    }
    if (opts.verbose) console.log(`OK  ${rel(item.p)} (${st.size.toLocaleString('en-US')} bytes)`) 
  }

  console.log(metaSt.exists ? `OK  ${rel(metaPath)} present` : `ERR ${rel(metaPath)} missing`)

  if (opts.checkDist) {
    const distSt = safeStat(DIST)
    if (!distSt.exists) {
      problems.push(`Missing ${rel(DIST)} (run build first)`)
    } else {
      for (const item of [metaPath, ...core.map((x) => x.p)]) {
        const pubSt = safeStat(item)
        if (!pubSt.exists) continue

        const distPath = path.join(DIST, path.relative(PUBLIC, item))
        const distFileSt = safeStat(distPath)
        if (!distFileSt.exists) {
          problems.push(`Missing ${rel(distPath)} (not copied to dist)`)
          continue
        }

        // Byte-identical check to ensure the build is using the latest copied assets.
        const a = sha256File(item)
        const b = sha256File(distPath)
        if (a !== b) {
          problems.push(`dist copy mismatch: ${rel(item)} != ${rel(distPath)}`)
        } else if (opts.verbose) {
          console.log(`OK  dist match ${rel(distPath)}`)
        }
      }
    }
  }

  if (notes.length && opts.verbose) {
    console.log('\nNotes:')
    for (const n of notes) console.log(' -', n)
  }

  if (!problems.length) {
    console.log(`\nOK Pages/assets look up-to-date${opts.checkDist ? ' (including dist/)' : ''}.`)
    process.exit(0)
  }

  console.error('\nERR Pages/assets verification failed:')
  for (const p of problems) console.error(' -', p)
  process.exit(2)
}

try {
  main()
} catch (e) {
  console.error('ERR verify_pages failed unexpectedly')
  console.error(e)
  process.exit(1)
}
