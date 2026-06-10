const fs = require('node:fs')
const path = require('node:path')

const TEMPLATE_ID = 'bullwaves-global-exclusive-tradable-bonus-en'
const CATALOG_PATH = path.join(__dirname, '..', 'src', 'features', 'sales', 'data', 'allTemplatesCatalog.js')
const SNAPSHOT_PATH = path.join(__dirname, '..', 'src', 'features', 'sales', 'data', 'bonus_preview_converted_by_currency.json')
const SEND_TEST_URL = 'http://localhost:4000/api/email/send-test'
const VIEWER_EMAIL = 'paolo.v@bullwaves.com'
const SUBJECT_EXACT = 'A June exclusive, 20% of your losses credited back.'

const REQUEST_TIMEOUT_MS = 45000
const DELAY_MS = 160

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  const dryRun = !args.has('--apply')
  const includeUnassigned = args.has('--include-unassigned')

  let limit = null
  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      const n = Number(arg.slice('--limit='.length))
      if (Number.isFinite(n) && n > 0) limit = Math.floor(n)
    }
  }

  return { dryRun, includeUnassigned, limit }
}

function extractTemplateById(catalogText, templateId) {
  const idNeedle = `id: '${templateId}'`
  const idPos = catalogText.indexOf(idNeedle)
  if (idPos < 0) return { subject: '', html: '' }

  const nextItemPos = catalogText.indexOf('\n  {', idPos + idNeedle.length)
  const blockEnd = nextItemPos > 0 ? nextItemPos : catalogText.length
  const block = catalogText.slice(idPos, blockEnd)

  const subjectMatch = block.match(/subject:\s*'([^']*)'/)
  const subject = subjectMatch ? subjectMatch[1] : ''

  const htmlStartMarker = 'html: `'
  const htmlStart = block.indexOf(htmlStartMarker)
  if (htmlStart < 0) return { subject, html: '' }
  const contentStart = htmlStart + htmlStartMarker.length
  const contentEnd = block.indexOf('`', contentStart)
  if (contentEnd < 0) return { subject, html: '' }
  const html = block.slice(contentStart, contentEnd)

  return { subject, html }
}

function normalizeEmail(raw) {
  const value = String(raw || '').trim().toLowerCase()
  if (!value || !value.includes('@')) return ''
  return value
}

function parseFirstName(fullName) {
  const clean = String(fullName || '').trim()
  if (!clean) return 'Trader'
  return clean.split(/\s+/)[0] || 'Trader'
}

function formatCurrencyAmount(amount, currencyCode) {
  const code = String(currencyCode || '').trim().toUpperCase() || 'USD'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))
}

function buildPersonalizedHtml(templateHtml, row) {
  const firstName = parseFirstName(row?.name)
  const accountId = String(row?.tradingAccount || '').trim() || '—'
  const officialBonusRaw =
    Number(row?.officialBonusAccountCurrencyRaw || 0) || Number(row?.bonusAccountCurrencyRaw || 0)
  const bonusAmount = formatCurrencyAmount(officialBonusRaw, row?.accountCurrency)

  return templateHtml
    .replaceAll('[First Name]', firstName)
    .replaceAll('[Bonus Amount]', bonusAmount)
    .replaceAll('[Trading Account ID]', accountId)
}

async function postJson(url, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-bullwaves-user-email': VIEWER_EMAIL,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const json = await response.json().catch(() => ({}))
    return { status: response.status, body: json }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const { dryRun, includeUnassigned, limit } = parseArgs(process.argv)

  const catalogText = fs.readFileSync(CATALOG_PATH, 'utf8')
  const template = extractTemplateById(catalogText, TEMPLATE_ID)
  if (!template.html) throw new Error(`Template not found: ${TEMPLATE_ID}`)

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'))
  const rows = Array.isArray(snapshot?.rows) ? snapshot.rows : []

  const recipients = rows
    .filter((row) => normalizeEmail(row?.email))
    .filter((row) => includeUnassigned || (String(row?.user || '').trim() || 'Unassigned') !== 'Unassigned')

  const selected = limit ? recipients.slice(0, limit) : recipients

  const out = {
    mode: dryRun ? 'dry-run' : 'apply',
    sourceGeneratedAt: snapshot?.generatedAt || '',
    totalRows: rows.length,
    selectedCount: selected.length,
    sent: 0,
    failed: 0,
    failures: [],
    sample: selected.slice(0, 5).map((r) => ({
      name: r.name,
      email: normalizeEmail(r.email),
      tradingAccount: r.tradingAccount,
      user: r.user,
      officialBonus: formatCurrencyAmount(r.officialBonusAccountCurrencyRaw || r.bonusAccountCurrencyRaw || 0, r.accountCurrency),
    })),
  }

  if (dryRun) {
    console.log(JSON.stringify(out, null, 2))
    return
  }

  for (const row of selected) {
    const to = normalizeEmail(row?.email)
    const firstName = parseFirstName(row?.name)
    const html = buildPersonalizedHtml(template.html, row)
    const accountId = String(row?.tradingAccount || '').trim() || '—'
    const bonusAmount = formatCurrencyAmount(
      Number(row?.officialBonusAccountCurrencyRaw || 0) || Number(row?.bonusAccountCurrencyRaw || 0),
      row?.accountCurrency
    )

    const payload = {
      viewerEmail: VIEWER_EMAIL,
      to,
      subject: SUBJECT_EXACT || template.subject,
      html,
      text: `Hi ${firstName}, your credited amount is ${bonusAmount} on account ${accountId}. Log in now and use the credit added to your account.`,
    }

    try {
      const response = await postJson(SEND_TEST_URL, payload)
      if (response.status >= 200 && response.status < 300 && response.body?.ok) {
        out.sent += 1
      } else {
        out.failed += 1
        out.failures.push({
          email: to,
          account: accountId,
          error: response.body?.error || `HTTP_${response.status}`,
        })
      }
    } catch (error) {
      out.failed += 1
      out.failures.push({
        email: to,
        account: accountId,
        error: error?.message || 'send failed',
      })
    }

    await sleep(DELAY_MS)
  }

  console.log(JSON.stringify(out, null, 2))
  if (out.failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
