#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx')

const ROOT = path.join(__dirname, '..')
const INPUT_FILE = path.join(ROOT, 'reports', 'Lista clienti Robert.xlsx')
const OUTPUT_FILE = path.join(ROOT, 'reports', 'Lista clienti Robert - enriched.xlsx')

const AUTH_URL = 'https://client.api.skaleapps.io/api/authorisation'
const API_URL = 'https://client.api.skaleapps.io/api/v-2'

function loadLocalEnv() {
  const envFiles = [
    '.env.server.local',
    '.env.server',
    '.env.local',
    '.env',
  ]

  const env = {}
  for (const fileName of envFiles) {
    const filePath = path.join(ROOT, fileName)
    if (!fs.existsSync(filePath)) continue

    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
      const idx = trimmed.indexOf('=')
      const key = trimmed.slice(0, idx).trim()
      const value = trimmed.slice(idx + 1).trim()
      if (!(key in env)) env[key] = value
    }
  }

  return env
}

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function findHeader(headers, aliases) {
  for (const h of headers) {
    const n = normalizeHeader(h)
    if (aliases.includes(n)) return h
  }
  return null
}

function coerceLogin(raw) {
  const cleaned = String(raw == null ? '' : raw).replace(/[^0-9]/g, '').trim()
  return cleaned || null
}

function pickFirstValue(...values) {
  for (const value of values) {
    const text = String(value == null ? '' : value).trim()
    if (text) return text
  }
  return ''
}

function parseArgs(argv) {
  const out = {
    input: INPUT_FILE,
    output: OUTPUT_FILE,
    sheet: '',
  }

  for (let i = 2; i < argv.length; i += 1) {
    const key = String(argv[i] || '').trim()
    const value = String(argv[i + 1] || '').trim()
    if (!key.startsWith('--')) continue

    if (key === '--input' && value) {
      out.input = path.isAbsolute(value) ? value : path.join(ROOT, value)
      i += 1
      continue
    }

    if (key === '--output' && value) {
      out.output = path.isAbsolute(value) ? value : path.join(ROOT, value)
      i += 1
      continue
    }

    if (key === '--sheet' && value) {
      out.sheet = value
      i += 1
    }
  }

  return out
}

class SkaleClient {
  constructor(clientId, clientSecret) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.accessToken = ''
  }

  async auth() {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
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
    if (!resp.ok || !token) {
      throw new Error(`Skale auth failed: ${JSON.stringify(data)}`)
    }

    this.accessToken = token
  }

  async request(request, params = {}, retried = false) {
    if (!this.accessToken) await this.auth()

    const payload = new URLSearchParams({
      access_token: this.accessToken,
      request,
    })

    for (const [key, value] of Object.entries(params || {})) {
      if (value == null) continue
      payload.set(key, String(value))
    }

    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: payload,
    })

    const data = await resp.json()
    if (data?.error === 'invalid_token' && !retried) {
      this.accessToken = ''
      return this.request(request, params, true)
    }

    return data
  }
}

async function main() {
  const args = parseArgs(process.argv)
  if (!fs.existsSync(args.input)) {
    throw new Error(`Input file not found: ${args.input}`)
  }

  const env = loadLocalEnv()
  const clientId = String(env.SKALE_CLIENT_ID || '').trim()
  const clientSecret = String(env.SKALE_CLIENT_SECRET || '').trim()
  if (!clientId || !clientSecret) {
    throw new Error('Missing SKALE_CLIENT_ID or SKALE_CLIENT_SECRET in local env files')
  }

  const wb = XLSX.readFile(args.input)
  const sheetName = args.sheet && wb.SheetNames.includes(args.sheet) ? args.sheet : wb.SheetNames[0]
  const sourceSheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sourceSheet, { defval: '' })

  if (!rows.length) {
    throw new Error('Input file has no rows')
  }

  const headers = Object.keys(rows[0])
  const loginKey = findHeader(headers, ['login', 'mt account', 'account', 'account number'])
  const nameKey = findHeader(headers, ['name', 'full name'])

  if (!loginKey) {
    throw new Error(`Could not find login column in headers: ${headers.join(', ')}`)
  }

  const outEmail = 'Email'
  const outStatus = 'Status'
  const outMt = 'MT Account'
  const outVerification = 'Verification Status'
  const outPlatform = 'Platform'
  const outNote = 'Skale Note'

  const skale = new SkaleClient(clientId, clientSecret)

  let okCount = 0
  let missCount = 0
  let errorCount = 0

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const login = coerceLogin(row[loginKey])

    if (!login) {
      row[outNote] = pickFirstValue(row[outNote], 'Missing login')
      missCount += 1
      continue
    }

    try {
      const details = await skale.request('GetAccountDetails', { account_number: login })
      if (String(details?.status || '').toLowerCase() !== 'success' || !details?.object) {
        row[outNote] = pickFirstValue(row[outNote], `No account details (${details?.error || details?.status || 'unknown'})`)
        missCount += 1
        continue
      }

      const obj = details.object || {}
      const mtAccount = pickFirstValue(obj.mt4_account, login)
      const email = pickFirstValue(obj.email)

      let status = ''
      let verificationStatus = ''
      let platform = ''

      if (email) {
        const userData = await skale.request('GetUserDetailsByEmail', { email })
        const first = Array.isArray(userData?.data) && userData.data.length ? userData.data[0] : null
        const accountInfo = Array.isArray(first?.tp_accounts_general_info) && first.tp_accounts_general_info.length
          ? first.tp_accounts_general_info[0]
          : null

        status = pickFirstValue(
          accountInfo?.tp_accountstatus,
          accountInfo?.account_type,
          first?.account_status,
          first?.status
        )
        verificationStatus = pickFirstValue(first?.verification_status)
        platform = pickFirstValue(accountInfo?.platformname)
      }

      if (!row[outEmail]) row[outEmail] = email
      if (!row[outStatus]) row[outStatus] = status
      if (!row[outMt]) row[outMt] = mtAccount
      if (!row[outVerification]) row[outVerification] = verificationStatus
      if (!row[outPlatform]) row[outPlatform] = platform
      if (!row[outNote]) row[outNote] = ''

      okCount += 1
      const displayName = pickFirstValue(row[nameKey], row.Name, '')
      console.log(`[${i + 1}/${rows.length}] OK login=${login}${displayName ? ` name=${displayName}` : ''}`)
    } catch (error) {
      errorCount += 1
      row[outNote] = pickFirstValue(row[outNote], `Error: ${error.message}`)
      console.log(`[${i + 1}/${rows.length}] ERROR login=${login}: ${error.message}`)
    }
  }

  const outputHeaders = [...headers]
  for (const extra of [outEmail, outStatus, outMt, outVerification, outPlatform, outNote]) {
    if (!outputHeaders.includes(extra)) outputHeaders.push(extra)
  }

  const outSheet = XLSX.utils.json_to_sheet(rows, {
    header: outputHeaders,
    skipHeader: false,
  })

  wb.Sheets[sheetName] = outSheet
  XLSX.writeFile(wb, args.output)

  console.log('\nDone')
  console.log(`Sheet:  ${sheetName}`)
  console.log(`Input:  ${args.input}`)
  console.log(`Output: ${args.output}`)
  console.log(`Rows: ${rows.length}, OK: ${okCount}, Missing: ${missCount}, Errors: ${errorCount}`)
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
