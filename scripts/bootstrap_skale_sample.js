#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

const ROOT = path.join(__dirname, '..')
const INPUT_XLSX = path.join(ROOT, 'reports', 'Lista clienti Robert - final-enriched.xlsx')
const OUTPUT_JSON = path.join(ROOT, 'public', 'skale', 'skale-users-sample.json')
const AUTH_URL = 'https://client.api.skaleapps.io/api/authorisation'
const API_URL = 'https://client.api.skaleapps.io/api/v-2'
const LIMIT = 50
const DELAY_MS = 250

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseEnvFile(filePath) {
  const out = {}
  if (!fs.existsSync(filePath)) return out
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = String(line || '').trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const idx = trimmed.indexOf('=')
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    out[key] = value
  }
  return out
}

function firstSheetRows(filePath) {
  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' })
  return rows
}

function pickLoginKey(row) {
  const keys = Object.keys(row || {})
  for (const key of keys) {
    const n = key.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (n === 'login' || n === 'mt account' || n === 'account number') return key
  }
  return null
}

function pickNameKey(row) {
  const keys = Object.keys(row || {})
  for (const key of keys) {
    const n = key.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (n === 'name' || n === 'full name') return key
  }
  return null
}

function cleanLogin(raw) {
  const s = String(raw == null ? '' : raw).replace(/[^0-9]/g, '').trim()
  return s || ''
}

async function auth(clientId, clientSecret) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const resp = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })
  const data = await resp.json()
  const token = String(data?.access_token || '').trim()
  if (!token) throw new Error(`Auth failed: ${JSON.stringify(data)}`)
  return token
}

async function skaleRequest(token, requestName, params = {}) {
  const body = new URLSearchParams({
    access_token: token,
    request: requestName,
  })
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    body.set(k, String(v))
  }
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })
  return resp.json()
}

async function skaleRequestWithRefresh(authState, requestName, params = {}) {
  let payload = await skaleRequest(authState.token, requestName, params)
  if (String(payload?.error || '').toLowerCase() === 'invalid_token') {
    authState.token = await auth(authState.clientId, authState.clientSecret)
    payload = await skaleRequest(authState.token, requestName, params)
  }
  return payload
}

async function main() {
  const env = {
    ...parseEnvFile(path.join(ROOT, '.env.server.local')),
    ...parseEnvFile(path.join(ROOT, '.env.server')),
    ...parseEnvFile(path.join(ROOT, '.env.local')),
    ...parseEnvFile(path.join(ROOT, '.env')),
  }

  const clientId = String(env.SKALE_CLIENT_ID || '').trim()
  const clientSecret = String(env.SKALE_CLIENT_SECRET || '').trim()
  if (!clientId || !clientSecret) {
    throw new Error('Missing SKALE_CLIENT_ID / SKALE_CLIENT_SECRET')
  }

  const rows = firstSheetRows(INPUT_XLSX)
  if (!rows.length) throw new Error('No rows found in source xlsx')

  const loginKey = pickLoginKey(rows[0])
  const nameKey = pickNameKey(rows[0])
  if (!loginKey) throw new Error('Could not detect Login column')

  const selected = rows
    .map((row) => ({
      login: cleanLogin(row[loginKey]),
      name: String(row[nameKey] || '').trim(),
    }))
    .filter((r) => r.login)
    .slice(0, LIMIT)

  const authState = {
    clientId,
    clientSecret,
    token: await auth(clientId, clientSecret),
  }
  const resultRows = []
  let success = 0
  let partial = 0
  let failed = 0

  for (let i = 0; i < selected.length; i += 1) {
    const item = selected[i]
    const idx = i + 1
    try {
      const accountDetails = await skaleRequestWithRefresh(authState, 'GetAccountDetails', {
        account_number: item.login,
      })

      let userDetails = null
      const email = String(accountDetails?.object?.email || '').trim()
      if (email) {
        userDetails = await skaleRequestWithRefresh(authState, 'GetUserDetailsByEmail', { email })
      }

      const accountOk = String(accountDetails?.status || '').toLowerCase() === 'success'
      const userOk = userDetails
        ? String(userDetails?.status || '').toLowerCase() === 'success'
        : false

      if (accountOk && userOk) success += 1
      else if (accountOk || userOk) partial += 1
      else failed += 1

      resultRows.push({
        login: item.login,
        name: item.name,
        fetchedAt: new Date().toISOString(),
        accountDetails,
        userDetails,
      })

      console.log(`[${idx}/${selected.length}] OK login=${item.login} name=${item.name}`)
    } catch (err) {
      failed += 1
      resultRows.push({
        login: item.login,
        name: item.name,
        fetchedAt: new Date().toISOString(),
        accountDetails: null,
        userDetails: null,
        error: err?.message || 'unknown_error',
      })
      console.log(`[${idx}/${selected.length}] ERROR login=${item.login}: ${err?.message || 'error'}`)
    }

    await sleep(DELAY_MS)
  }

  const out = {
    generatedAt: new Date().toISOString(),
    limit: LIMIT,
    delayMs: DELAY_MS,
    totals: {
      selected: selected.length,
      success,
      partial,
      failed,
    },
    rows: resultRows,
  }

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true })
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(out, null, 2), 'utf8')

  console.log('\nDone')
  console.log(`Output: ${OUTPUT_JSON}`)
  console.log(`Selected: ${selected.length}, Success: ${success}, Partial: ${partial}, Failed: ${failed}`)
}

main().catch((err) => {
  console.error(err?.stack || err)
  process.exit(1)
})
