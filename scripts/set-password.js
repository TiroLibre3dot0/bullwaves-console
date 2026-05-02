#!/usr/bin/env node
/**
 * set-password.js – Admin CLI to assign/update a console password for an email.
 *
 * Usage:
 *   node scripts/set-password.js user@example.com "YourPassword123"
 *   node scripts/set-password.js user@example.com --delete
 *
 * Passwords are hashed with PBKDF2-SHA512 (100 000 iterations) and stored in:
 *   config/credentials.json  (gitignored, server-side only)
 *
 * For Vercel / production: after updating credentials.json, copy its contents
 * to the CONSOLE_CREDENTIALS environment variable as a single-line JSON string.
 */

'use strict'

const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

const CREDS_PATH = path.join(__dirname, '..', 'config', 'credentials.json')

function usage() {
  console.log(`
Usage:
  node scripts/set-password.js <email> <password>    – set / update password
  node scripts/set-password.js <email> --delete       – remove credential entry
  node scripts/set-password.js --list                 – list emails that have a password set
`)
  process.exit(1)
}

function loadCreds() {
  if (!fs.existsSync(CREDS_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'))
  } catch {
    console.error('ERROR: Could not parse config/credentials.json')
    process.exit(1)
  }
}

function saveCreds(creds) {
  const dir = path.dirname(CREDS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CREDS_PATH, JSON.stringify(creds, null, 2) + '\n', 'utf8')
}

function hashPassword(plaintext) {
  const salt = crypto.randomBytes(32).toString('hex')
  const hash = crypto.pbkdf2Sync(plaintext, salt, 100000, 64, 'sha512').toString('hex')
  return { salt, hash }
}

// ---------------------------------------------------------------------------
const [, , ...args] = process.argv

if (args[0] === '--list') {
  const creds = loadCreds()
  const emails = Object.keys(creds)
  if (emails.length === 0) {
    console.log('No credentials set yet.')
  } else {
    console.log(`Emails with a password set (${emails.length}):`)
    emails.forEach((e) => console.log(`  ${e}`))
  }
  process.exit(0)
}

const email = (args[0] || '').trim().toLowerCase()
if (!email || !email.includes('@')) usage()

// ── Delete mode ──────────────────────────────────────────────────────────────
if (args[1] === '--delete') {
  const creds = loadCreds()
  if (!creds[email]) {
    console.log(`No entry found for: ${email}`)
    process.exit(0)
  }
  delete creds[email]
  saveCreds(creds)
  console.log(`✓ Removed credential for: ${email}`)
  process.exit(0)
}

// ── Set / update password ─────────────────────────────────────────────────────
const plaintext = args[1]
if (!plaintext) usage()

if (plaintext.length < 8) {
  console.error('ERROR: Password must be at least 8 characters.')
  process.exit(1)
}

const creds = loadCreds()
const { salt, hash } = hashPassword(plaintext)
const isUpdate = Boolean(creds[email])
creds[email] = { salt, hash }
saveCreds(creds)

console.log(`✓ ${isUpdate ? 'Updated' : 'Set'} password for: ${email}`)
console.log()
console.log('For Vercel/production, update the CONSOLE_CREDENTIALS env var with:')
console.log(JSON.stringify(creds))
