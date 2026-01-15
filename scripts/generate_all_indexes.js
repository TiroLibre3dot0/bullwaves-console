/*
Generate all lightweight JSON artifacts consumed by the frontend.

This is intended for:
- Local dev (one-shot regeneration)
- CI / Vercel builds (via npm prebuild)

Usage:
  node scripts/generate_all_indexes.js
*/

const path = require('path')
const { spawnSync } = require('child_process')

function run(scriptName) {
  const scriptPath = path.join(__dirname, scriptName)
  const res = spawnSync(process.execPath, [scriptPath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    windowsHide: true,
  })
  if (res.status && res.status !== 0) {
    process.exit(res.status)
  }
}

run('generate_reports_meta.js')
run('generate_affiliate_index.js')
run('generate_support_users_index.js')

run('generate_fraud_patterns_index.js')
run('generate_affiliate_kpi_index.js')
