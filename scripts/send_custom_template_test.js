const fs = require('node:fs')
const path = require('node:path')
const XLSX = require('xlsx')

const TEMPLATE_ID = 'bullwaves-global-exclusive-tradable-bonus-en'
const CATALOG_PATH = path.join(__dirname, '..', 'src', 'features', 'sales', 'data', 'allTemplatesCatalog.js')
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'BONUS-CAMPAIGN-20%.xlsx')
const CAMPAIGN_SNAPSHOT_PATH = path.join(__dirname, '..', 'reports', 'bonus_preview_converted_by_currency.json')
const CLIENT_MONTHS_URL = 'http://localhost:4000/api/qlik/creolabs/client-months'
const SEND_TEST_URL = 'http://localhost:4000/api/email/send-test'
const REQUEST_TIMEOUT_MS = 45000

const FALLBACK_USER_BY_ACCOUNT = {
  '1219094': {
    clientId: '548036',
    country: 'GB',
    brand: 'BW Global',
    netDeposits: 167099.79,
  },
}

function extractTemplateHtml(catalogText, templateId) {
  const idNeedle = `id: '${templateId}'`
  const idPos = catalogText.indexOf(idNeedle)
  if (idPos < 0) return ''

  const htmlStartMarker = 'html: `'
  const htmlStart = catalogText.indexOf(htmlStartMarker, idPos)
  if (htmlStart < 0) return ''

  const contentStart = htmlStart + htmlStartMarker.length
  const contentEnd = catalogText.indexOf('`', contentStart)
  if (contentEnd < 0) return ''

  return catalogText.slice(contentStart, contentEnd)
}

function parseName(fullName) {
  const clean = String(fullName || '').trim()
  if (!clean) return 'Trader'
  const first = clean.split(/\s+/)[0]
  return first || 'Trader'
}

function normalizeCurrencyCode(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase()
  if (/^[A-Z]{3}$/.test(code)) return code
  return ''
}

function inferCurrencyCode(country, brand) {
  const cc = String(country || '').trim().toUpperCase()
  const brandText = String(brand || '').toLowerCase()

  if (cc === 'GB') return 'GBP'
  if (['IT', 'FR', 'ES', 'DE', 'NL', 'PT', 'IE', 'BE', 'AT', 'FI', 'GR', 'LU', 'MT', 'CY', 'SI', 'SK', 'EE', 'LV', 'LT'].includes(cc)) {
    return 'EUR'
  }
  if (cc === 'CH') return 'CHF'
  if (cc === 'JP') return 'JPY'
  if (cc === 'AU') return 'AUD'
  if (cc === 'NZ') return 'NZD'
  if (cc === 'CA') return 'CAD'

  if (brandText.includes('global')) return 'USD'
  return 'USD'
}

function resolveCurrencyCode(clientRow = {}, reportRow = {}) {
  const direct = [
    clientRow.currency,
    clientRow.clientCurrency,
    clientRow.accountCurrency,
    clientRow.baseCurrency,
    reportRow.Currency,
    reportRow.currency,
  ]
    .map(normalizeCurrencyCode)
    .find(Boolean)

  if (direct) return direct
  return inferCurrencyCode(clientRow.country, clientRow.brand)
}

function formatCurrencyAmount(amount, currencyCode) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatWholeAmount(amount, currencyCode) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(amount || 0)))
}

function roundToNearestThousand(value) {
  return Math.round(Number(value || 0) / 1000) * 1000
}

async function getJson(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const response = await fetch(url, { signal: controller.signal })
  clearTimeout(timer)
  if (!response.ok) {
    throw new Error(`REQUEST_FAILED ${response.status} ${url}`)
  }
  return response.json()
}

async function postJson(url, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-viewer-email': 'paolo.v@bullwaves.com',
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
  clearTimeout(timer)
  const json = await response.json().catch(() => ({}))
  return { status: response.status, body: json }
}

async function main() {
  const catalogText = fs.readFileSync(CATALOG_PATH, 'utf8')
  const templateHtml = extractTemplateHtml(catalogText, TEMPLATE_ID)
  if (!templateHtml) {
    throw new Error('TEMPLATE_NOT_FOUND')
  }

  const workbook = XLSX.readFile(REPORT_PATH)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const reportRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  const reportRow = reportRows.find((row) => String(row['Trading Account'] || '').trim())
  if (!reportRow) {
    throw new Error('NO_REPORT_ROW_FOUND')
  }

  const accountId = String(reportRow['Trading Account']).trim()
  const campaignSnapshot = JSON.parse(fs.readFileSync(CAMPAIGN_SNAPSHOT_PATH, 'utf8'))
  const snapshotRows = Array.isArray(campaignSnapshot?.rows) ? campaignSnapshot.rows : []
  const snapshotRow = snapshotRows.find((row) => String(row.tradingAccount || '').trim() === accountId)

  let latestRow = null
  let totalNetDeposits = 0
  let source = 'live-client-months'

  try {
    const clientMonthsRes = await getJson(CLIENT_MONTHS_URL)
    const clientMonths = clientMonthsRes?.data?.clientMonths || []
    const matchingRows = clientMonths.filter((row) => String(row.clientLogin || '').trim() === accountId)

    if (!matchingRows.length) {
      throw new Error(`CLIENT_NOT_FOUND_FOR_ACCOUNT_${accountId}`)
    }

    totalNetDeposits = matchingRows.reduce((acc, row) => acc + Number(row.net || 0), 0)
    latestRow = matchingRows[0]
  } catch (_error) {
    const fallback = FALLBACK_USER_BY_ACCOUNT[accountId]
    if (!fallback) {
      throw _error
    }
    source = 'fallback-snapshot'
    totalNetDeposits = Number(fallback.netDeposits || 0)
    latestRow = {
      clientId: fallback.clientId,
      country: fallback.country,
      brand: fallback.brand,
      clientName: reportRow.Name,
      clientLogin: accountId,
    }
  }

  const fullName = String(reportRow.Name || latestRow.clientName || '').trim()
  const firstName = parseName(fullName)

  const bonusRawFromSnapshot = Number(snapshotRow?.bonusAccountCurrencyRaw || 0)
  const bonus20pctRounded = snapshotRow
    ? roundToNearestThousand(bonusRawFromSnapshot)
    : Math.round(Math.max(0, totalNetDeposits) * 0.2)

  const currencyCode = normalizeCurrencyCode(snapshotRow?.accountCurrency) || resolveCurrencyCode(latestRow, reportRow)
  const bonusWithCurrency = formatCurrencyAmount(bonus20pctRounded, currencyCode)
  const netUsdRounded = Math.round(Math.max(0, totalNetDeposits))
  const personalizedSubject = `${firstName}, your exclusive tradable bonus of ${bonusWithCurrency} is ready - Acc ${accountId}`

  const personalizedHtml = templateHtml
    .replaceAll('[First Name]', firstName)
    .replaceAll('[Bonus Amount]', bonusWithCurrency)
    .replaceAll('[Trading Account ID]', accountId)

  const payload = {
    viewerEmail: 'paolo.v@bullwaves.com',
    to: 'paolo.v@bullwaves.com',
    fromEmail: 'support@bullwaves.com',
    fromName: 'Bullwaves Exclusive',
    subject: personalizedSubject,
    html: personalizedHtml,
    text: `Hi ${firstName}, your exclusive tradable bonus is ready: ${bonusWithCurrency}. Net deposits USD ${formatWholeAmount(netUsdRounded, 'USD')}.`,
  }

  const send = await postJson(SEND_TEST_URL, payload)
  const out = {
    ok: send.status >= 200 && send.status < 300,
    sendStatus: send.status,
    sendBody: send.body,
    user: {
      fullName,
      firstName,
      tradingAccount: accountId,
      clientId: String(latestRow.clientId || ''),
      country: String(latestRow.country || ''),
      brand: String(latestRow.brand || ''),
      netDeposits: totalNetDeposits,
      bonus20pctRounded,
      bonusRawFromSnapshot: snapshotRow ? bonusRawFromSnapshot : null,
      currencyCode,
      bonusWithCurrency,
      source: snapshotRow ? `${source}+campaign-snapshot` : source,
    },
    template: {
      id: TEMPLATE_ID,
      subject: personalizedSubject,
      placeholdersApplied: {
        firstName,
        bonusAmount: bonusWithCurrency,
        tradingAccount: accountId,
      },
    },
  }

  console.log(JSON.stringify(out, null, 2))

  if (!out.ok) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
