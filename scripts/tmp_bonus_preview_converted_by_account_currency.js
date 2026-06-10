const fs = require('node:fs')
const path = require('node:path')
const XLSX = require('xlsx')

const REPORT_PATH = path.join(__dirname, '..', 'reports', 'BONUS-CAMPAIGN-20%.xlsx')
const CLIENT_MONTHS_URL = 'http://localhost:4000/api/qlik/creolabs/client-months'
const FX_URL_USD_BASE = 'https://open.er-api.com/v6/latest/USD'
const OUT_JSON = path.join(__dirname, '..', 'reports', 'bonus_preview_converted_by_currency.json')
const OUT_CSV = path.join(__dirname, '..', 'reports', 'bonus_preview_converted_by_currency.csv')
const FRONTEND_JSON = path.join(__dirname, '..', 'src', 'features', 'sales', 'data', 'bonus_preview_converted_by_currency.json')
const FRONTEND_CSV = path.join(__dirname, '..', 'src', 'features', 'sales', 'data', 'bonus_preview_converted_by_currency.csv')
const REGISTERED_USERS_URL = 'http://localhost:4000/api/qlik/creolabs/registered-users?from=2025-01-01&to=2026-12-31&provenance=1'

const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CHF: 0.9,
  AUD: 1.52,
  CAD: 1.37,
  NZD: 1.64,
  JPY: 157,
}

function toCode(value) {
  const code = String(value || '').trim().toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : ''
}

function normalizeLooseName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function formatMoney(amount, currencyCode) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount)
}

function roundMoney(value) {
  return Math.round(Number(value || 0))
}

function toCsv(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => esc(row[h])).join(','))
  }
  return lines.join('\n')
}

async function fetchRatesUsdBase() {
  try {
    const response = await fetch(FX_URL_USD_BASE)
    if (!response.ok) throw new Error(`FX_HTTP_${response.status}`)
    const data = await response.json()
    if (!data || typeof data !== 'object' || !data.rates) throw new Error('FX_BAD_PAYLOAD')
    return { rates: data.rates, source: 'live-fx' }
  } catch (_error) {
    return { rates: FALLBACK_RATES, source: 'fallback-fx' }
  }
}

async function main() {
  const workbook = XLSX.readFile(REPORT_PATH)
  const ws = workbook.Sheets[workbook.SheetNames[0]]
  const campaignRows = XLSX.utils.sheet_to_json(ws, { defval: '' })

  const { rates, source: fxSource } = await fetchRatesUsdBase()

  const registeredUsersResponse = await fetch(REGISTERED_USERS_URL)
  if (!registeredUsersResponse.ok) {
    throw new Error(`REGISTERED_USERS_HTTP_${registeredUsersResponse.status}`)
  }
  const registeredUsersJson = await registeredUsersResponse.json()
  const registeredUsers = registeredUsersJson?.data?.users || []

  const userByLogin = new Map()
  const userByEmail = new Map()
  const userByName = new Map()

  function putLatest(map, key, row) {
    if (!key) return
    const existing = map.get(key)
    if (!existing) {
      map.set(key, row)
      return
    }
    const currentTs = Date.parse(String(existing.clientTimestamp || ''))
    const incomingTs = Date.parse(String(row.clientTimestamp || ''))
    if (!Number.isFinite(currentTs) || (Number.isFinite(incomingTs) && incomingTs >= currentTs)) {
      map.set(key, row)
    }
  }

  for (const row of registeredUsers) {
    const login = String(row.clientLogin || '').trim()
    const email = normalizeEmail(row.email)
    const name = normalizeLooseName(row.clientName)

    if (login) putLatest(userByLogin, login, row)
    if (email) putLatest(userByEmail, email, row)
    if (name) putLatest(userByName, name, row)
  }

  const cmResponse = await fetch(CLIENT_MONTHS_URL)
  if (!cmResponse.ok) throw new Error(`CLIENT_MONTHS_HTTP_${cmResponse.status}`)
  const cmJson = await cmResponse.json()
  const clientMonths = cmJson?.data?.clientMonths || []

  const netByLogin = new Map()
  const netByName = new Map()
  for (const row of clientMonths) {
    const login = String(row.clientLogin || '').trim()
    const net = Number(row.net || 0)
    const name = normalizeLooseName(row.clientName)

    if (login && login !== '-') {
      netByLogin.set(login, (netByLogin.get(login) || 0) + net)
    }
    if (name) {
      netByName.set(name, (netByName.get(name) || 0) + net)
    }
  }

  const output = []
  for (const row of campaignRows) {
    const account = String(row['Trading Account'] || '').trim()
    if (!account) continue

    const currency = toCode(row.Currency)
    const rate = rates[currency]
    const rowName = normalizeLooseName(row.Name)
    const liveNetUsd = Number(Math.max(netByLogin.get(account) || 0, netByName.get(rowName) || 0).toFixed(2))
    const campaignBonusRaw = Number(row['New bonus'] || 0)
    const officialBonusRaw = Number(row['New bonus'] || 0)
    const hasLiveMatch = liveNetUsd > 0

    const netInAccountCurrency = hasLiveMatch
      ? currency && rate
        ? liveNetUsd * rate
        : 0
      : currency && rate
        ? Math.max(0, campaignBonusRaw) / 0.2
        : 0

    const roundedNetInAccountCurrency = currency && rate ? roundMoney(netInAccountCurrency) : 0
    const netUsd = hasLiveMatch && currency && rate ? roundMoney(liveNetUsd) : currency && rate ? roundMoney(roundedNetInAccountCurrency / rate) : 0
    const bonus = hasLiveMatch && currency && rate ? Math.round(Math.max(0, roundedNetInAccountCurrency) * 0.2) : Math.round(Math.max(0, campaignBonusRaw))
    const emailKey = normalizeEmail(row.Email)
    const liveUser =
      userByLogin.get(account) ||
      (emailKey ? userByEmail.get(emailKey) : null) ||
      (rowName ? userByName.get(rowName) : null)
    const user = String(liveUser?.user || '').trim() || 'Unassigned'

    output.push({
      name: String(row.Name || '').trim(),
      email: String(row.Email || '').trim(),
      tradingAccount: account,
      user,
      accountCurrency: currency || '',
      usdToAccountRate: rate ? Number(rate.toFixed(6)) : '',
      netDepositsUsd: netUsd,
      netDepositsAccountCurrency: currency && rate ? roundedNetInAccountCurrency : '',
      bonusAccountCurrencyRaw: bonus,
      bonusAccountCurrencyFormatted: currency && rate ? formatMoney(bonus, currency) : '',
      officialBonusAccountCurrencyRaw: officialBonusRaw,
      officialBonusAccountCurrencyFormatted: currency ? formatMoney(officialBonusRaw, currency) : '',
      status: currency && rate ? (hasLiveMatch ? 'ok' : 'campaign-fallback') : (!currency ? 'missing-currency' : 'missing-fx-rate'),
    })
  }

  const csv = toCsv(output)
  const snapshot = { fxSource, generatedAt: new Date().toISOString(), rows: output }
  fs.writeFileSync(OUT_JSON, JSON.stringify(snapshot, null, 2))
  fs.writeFileSync(OUT_CSV, csv)
  fs.writeFileSync(FRONTEND_JSON, JSON.stringify(snapshot, null, 2))
  fs.writeFileSync(FRONTEND_CSV, csv)

  const ok = output.filter((r) => r.status === 'ok').length
  const missingCurrency = output.filter((r) => r.status === 'missing-currency').length
  const missingFx = output.filter((r) => r.status === 'missing-fx-rate').length
  const unassigned = output.filter((r) => (String(r.user || '').trim() || 'Unassigned') === 'Unassigned')

  const preview = output.slice(0, 10)

  console.log(
    JSON.stringify(
      {
        totalRows: output.length,
        ok,
        missingCurrency,
        missingFx,
        unassignedCount: unassigned.length,
        unassignedPreview: unassigned.slice(0, 10),
        fxSource,
        preview,
        outJson: OUT_JSON,
        outCsv: OUT_CSV,
        frontendJson: FRONTEND_JSON,
        frontendCsv: FRONTEND_CSV,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
