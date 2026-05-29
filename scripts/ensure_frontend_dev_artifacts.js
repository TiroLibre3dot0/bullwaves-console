#!/usr/bin/env node

/**
 * Creates minimal placeholder artifacts for frontend-only development.
 *
 * Safety rules:
 * - Never overwrite existing artifacts.
 * - Only create lightweight JSON placeholders when files are missing.
 * - Keep operational generators untouched.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function writeJsonIfMissing(relPath, payload) {
  const target = path.join(PUBLIC_DIR, relPath)
  ensureDir(path.dirname(target))

  if (fs.existsSync(target)) {
    console.log(`KEEP ${relPath}`)
    return false
  }

  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`CREATE ${relPath}`)
  return true
}

function nowIso() {
  return new Date().toISOString()
}

function main() {
  const generatedAt = nowIso()

  const placeholders = [
    ['reports_meta.json', { generatedAt }],

    ['affiliate_index.json', { generatedAt, rows: [], byId: {}, byName: {} }],
    ['support_users_index.json', { generatedAt, rows: [] }],
    ['affiliate_kpi_index.json', {}],
    ['fraud_patterns_index.json', {}],

    ['rankings_index.json', []],
    ['rankings_users_table.json', []],

    ['creolabs_index.json', { generatedAt, rows: [], periods: [] }],
    ['creolabs_clients_table.json', { generatedAt, rows: [] }],
    ['creolabs_affiliate_month.json', { generatedAt, rows: [] }],

    ['cellx_affiliate_month.json', { generatedAt, rows: [] }],

    ['traders_ranking_rewards_table.json', { generatedAt, rows: [] }],
    ['prime_clients_ranking_table.json', { generatedAt, rows: [] }],
    ['embed/prime-contest.json', { generatedAt, rows: [] }],

    ['fraud_monitor_summary.json', { generatedAt, rows: [] }],
    ['fraud_monitor_name_groups.json', { generatedAt, groups: [] }],
  ]

  let created = 0
  for (const [relPath, payload] of placeholders) {
    if (writeJsonIfMissing(relPath, payload)) created += 1
  }

  console.log(`\nFrontend dev placeholders ready (created=${created}, kept=${placeholders.length - created}).`)
}

try {
  main()
} catch (err) {
  console.error('Failed to prepare frontend-only artifacts.')
  console.error(err)
  process.exit(1)
}
