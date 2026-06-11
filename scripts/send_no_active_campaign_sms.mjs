import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const CAMPAIGN_PATH = path.join(ROOT, 'src', 'features', 'sales', 'data', 'bonus_preview_converted_by_currency.json')
const PAGE_PATH = path.join(ROOT, 'src', 'features', 'sales', 'pages', 'MarketingCampaignPage.jsx')
const SMS_SEND_URL = 'http://127.0.0.1:4000/api/sms/send-test'
const SKALE_PHONES_URL = 'http://127.0.0.1:4000/api/skale/phones'
const LOGIN_URL = 'https://my.bullwaves.global/login'
const SENDER = 'Bullwaves'

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function normalizeText(v) {
  return String(v || '').trim()
}

function normalizeEmail(v) {
  return normalizeText(v).toLowerCase()
}

function parseSetItems(source, constName) {
  const re = new RegExp(`const\\s+${constName}\\s*=\\s*new\\s+Set\\(\\[([\\s\\S]*?)\\]\\)`, 'm')
  const m = source.match(re)
  if (!m) return new Set()
  const items = new Set()
  const inner = m[1]
  const itemRe = /'([^']+)'/g
  let it
  while ((it = itemRe.exec(inner)) !== null) {
    items.add(String(it[1]).trim())
  }
  return items
}

function firstName(fullName) {
  const raw = normalizeText(fullName)
  if (!raw) return 'Client'
  return raw.split(/\s+/)[0] || 'Client'
}

function toRowKey(row, idx) {
  const acc = normalizeText(row?.tradingAccount)
  const email = normalizeEmail(row?.email)
  return `${acc}:${email || idx}`
}

function normalizePhone(raw) {
  const s = normalizeText(raw).replace(/[\s\-()]/g, '')
  if (!s) return ''
  let out = s
  if (out.startsWith('00')) out = `+${out.slice(2)}`
  if (!out.startsWith('+') && /^\d{8,15}$/.test(out)) out = `+${out}`
  // UK numbers sometimes arrive as +4407... (national zero kept after country code).
  if (out.startsWith('+440')) out = `+44${out.slice(4)}`
  return out
}

function languageFromCountry(countryRaw) {
  const c = normalizeText(countryRaw).toLowerCase()
  if (!c) return 'en'

  const it = new Set(['italy', 'italia', 'it'])
  const pl = new Set(['poland', 'polonia', 'pl'])
  const ar = new Set(['united arab emirates', 'uae', 'saudi arabia', 'qatar', 'kuwait', 'oman', 'bahrain'])

  if (it.has(c)) return 'it'
  if (pl.has(c)) return 'pl'
  if (ar.has(c)) return 'ar'
  return 'en'
}

function fallbackAmount(row) {
  const amount = Number(row?.officialBonusAccountCurrencyRaw || row?.bonusAccountCurrencyRaw || 0)
  const currency = normalizeText(row?.accountCurrency) || 'USD'
  const rounded = Math.round(amount)
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(rounded)
  return `${currency} ${grouped}`
}

function bonusAmount(row) {
  const preferred = normalizeText(row?.officialBonusAccountCurrencyFormatted || row?.bonusAccountCurrencyFormatted)
  if (preferred) {
    return preferred.replace(/\s+/g, ' ').trim()
  }
  return fallbackAmount(row)
}

function buildMessage(lang, row) {
  const name = firstName(row?.name)
  const account = normalizeText(row?.tradingAccount)
  const amount = bonusAmount(row)

  if (lang === 'it') {
    return `Ciao ${name}, abbiamo riaccreditato sul tuo conto n. ${account} un bonus esclusivo di ${amount}. Non e necessario alcun deposito. Questo credito ti da piu flessibilita per ripartire. Accedi e attivalo quando vuoi: ${LOGIN_URL}`
  }

  if (lang === 'pl') {
    return `Czesc ${name}, ponownie uznalismy Twoje konto nr ${account} ekskluzywnym bonusem ${amount}. Nie jest wymagany zaden depozyt. Ten kredyt daje Ci wiecej elastycznosci, aby wrocic do tradingu. Zaloguj sie i aktywuj go kiedy chcesz: ${LOGIN_URL}`
  }

  if (lang === 'ar') {
    return `مرحبا ${name}، قمنا باعادة اضافة مكافاة حصرية بقيمة ${amount} الى حسابك رقم ${account}. لا يوجد اي ايداع مطلوب. هذا الرصيد يمنحك مرونة اكبر للعودة. سجل الدخول وفعله في اي وقت: ${LOGIN_URL}`
  }

  return `Hi ${name}, we have re-credited your account no. ${account} with an exclusive bonus of ${amount}. No deposit is required. This credit gives you extra flexibility to restart. Log in and activate it anytime: ${LOGIN_URL}`
}

async function fetchPhones(rows) {
  const response = await fetch(SKALE_PHONES_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows, forceLive: false, concurrency: 4 }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || data?.error || `skale phones request failed (${response.status})`)
  }
  return data
}

async function sendOne(phoneNumber, message) {
  const response = await fetch(SMS_SEND_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      phoneNumber,
      sender: SENDER,
      message,
    }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok) {
    return {
      ok: false,
      error: data?.error || `send failed (${response.status})`,
      details: data?.details || null,
    }
  }

  return {
    ok: true,
    providerMessageId: normalizeText(data?.providerMessageId || data?.response),
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const onlyUkZeroFix = process.argv.includes('--only-uk-zero-fix')

  const campaign = readJson(CAMPAIGN_PATH)
  const pageSource = fs.readFileSync(PAGE_PATH, 'utf8')

  const loginNoActive = parseSetItems(pageSource, 'NO_ACTIVE_BONUS_LOGIN_IDS')
  const emailNoActive = parseSetItems(pageSource, 'NO_ACTIVE_BONUS_EMAILS')

  const rows = Array.isArray(campaign?.rows) ? campaign.rows : []

  const candidates = rows.filter((row) => {
    const login = normalizeText(row?.tradingAccount)
    const email = normalizeEmail(row?.email)
    return loginNoActive.has(login) || emailNoActive.has(email)
  })

  const skalePayloadRows = candidates.map((row, idx) => ({
    rowKey: toRowKey(row, idx),
    tradingAccount: normalizeText(row?.tradingAccount),
    email: normalizeEmail(row?.email),
  }))

  const phoneData = await fetchPhones(skalePayloadRows)
  const phones = phoneData?.phones || {}
  const countries = phoneData?.countries || {}

  const prepared = []
  for (let i = 0; i < candidates.length; i += 1) {
    const row = candidates[i]
    const key = toRowKey(row, i)
    const rawPhone = normalizeText(phones[key])
    const phone = normalizePhone(rawPhone)
    const country = normalizeText(countries[key])
    if (!phone) continue
    const compactRawPhone = rawPhone.replace(/[\s\-()]/g, '')
    const needsUkZeroFix = compactRawPhone.startsWith('+440') || compactRawPhone.startsWith('00440') || compactRawPhone.startsWith('440')
    if (onlyUkZeroFix && !needsUkZeroFix) continue

    const lang = languageFromCountry(country)
    const message = buildMessage(lang, row)

    prepared.push({
      key,
      name: normalizeText(row?.name),
      account: normalizeText(row?.tradingAccount),
      email: normalizeEmail(row?.email),
      phone,
      rawPhone,
      country,
      lang,
      message,
      bonus: bonusAmount(row),
      needsUkZeroFix,
    })
  }

  const summary = {
    dryRun,
    onlyUkZeroFix,
    totalCampaignRows: rows.length,
    noActiveCandidates: candidates.length,
    withPhoneReady: prepared.length,
    byLang: prepared.reduce((acc, r) => {
      acc[r.lang] = (acc[r.lang] || 0) + 1
      return acc
    }, {}),
  }

  if (dryRun) {
    console.log(JSON.stringify({
      ...summary,
      sample: prepared.slice(0, 5),
    }, null, 2))
    return
  }

  const results = []
  for (const row of prepared) {
    // Sequential send to keep provider-side errors readable and deterministic.
    // eslint-disable-next-line no-await-in-loop
    const sent = await sendOne(row.phone, row.message)
    results.push({
      key: row.key,
      account: row.account,
      phone: row.phone,
      lang: row.lang,
      bonus: row.bonus,
      ...sent,
    })
  }

  const okCount = results.filter((r) => r.ok).length
  const failCount = results.length - okCount

  console.log(JSON.stringify({
    ...summary,
    sent: results.length,
    okCount,
    failCount,
    failures: results.filter((r) => !r.ok).slice(0, 20),
    firstSent: results.filter((r) => r.ok).slice(0, 5),
  }, null, 2))
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error))
  process.exit(1)
})
