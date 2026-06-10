const path = require('node:path')
const XLSX = require('xlsx')

const REPORT_PATH = path.join(__dirname, '..', 'reports', 'BONUS-CAMPAIGN-20%.xlsx')
const CLIENT_MONTHS_URL = 'http://localhost:4000/api/qlik/creolabs/client-months'

function inferCurrencyCode(country, brand) {
  const cc = String(country || '').trim().toUpperCase()
  const brandText = String(brand || '').toLowerCase()

  if (cc === 'GB') return 'GBP'
  if (['IT', 'FR', 'ES', 'DE', 'NL', 'PT', 'IE', 'BE', 'AT', 'FI', 'GR', 'LU', 'MT', 'CY', 'SI', 'SK', 'EE', 'LV', 'LT'].includes(cc)) return 'EUR'
  if (cc === 'CH') return 'CHF'
  if (cc === 'JP') return 'JPY'
  if (cc === 'AU') return 'AUD'
  if (cc === 'NZ') return 'NZD'
  if (cc === 'CA') return 'CAD'
  if (brandText.includes('global')) return 'USD'
  return 'USD'
}

function formatAmount(amount, currencyCode) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount)
}

async function main() {
  const wb = XLSX.readFile(REPORT_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  const top10 = rows.filter((r) => String(r['Trading Account'] || '').trim()).slice(0, 10)

  const response = await fetch(CLIENT_MONTHS_URL)
  if (!response.ok) throw new Error(`client-months failed: ${response.status}`)
  const data = await response.json()
  const clientMonths = data?.data?.clientMonths || []

  const out = top10.map((r, idx) => {
    const account = String(r['Trading Account']).trim()
    const name = String(r.Name || '').trim()
    const email = String(r.Email || '').trim()
    const matches = clientMonths.filter((cm) => String(cm.clientLogin || '').trim() === account)
    const netDeposits = matches.reduce((acc, cm) => acc + Number(cm.net || 0), 0)
    const bonus = Math.round(Math.max(0, netDeposits) * 0.2)
    const ref = matches[0] || {}
    const currencyCode = inferCurrencyCode(ref.country, ref.brand)

    return {
      rank: idx + 1,
      name,
      email,
      tradingAccount: account,
      country: ref.country || '',
      brand: ref.brand || '',
      netDeposits: Number(netDeposits.toFixed(2)),
      bonusRaw: bonus,
      currencyCode,
      bonusFormatted: formatAmount(bonus, currencyCode),
      matchedRows: matches.length,
    }
  })

  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
