const fs = require('fs')

const j = JSON.parse(fs.readFileSync('public/creolabs_clients_table.json', 'utf8'))
const rows = Array.isArray(j.rows) ? j.rows : []

// Group by client
const byClient = new Map()
for (const r of rows) {
  const name = String(r.clientName || '').trim()
  if (!name || name === 'Name' || name === 'Unknown' || name === '-') continue

  const key = [name, String(r.clientId || ''), String(r.clientLogin || '')].join('|')
  if (!byClient.has(key)) byClient.set(key, [])
  byClient.get(key).push(r)
}

// Build client list with latest period data
const clients = []
for (const [key, recs] of byClient) {
  const name = key.split('|')[0]
  const id = key.split('|')[1]
  const login = key.split('|')[2]

  // Find latest period
  const latestPeriod = Math.max(
    ...recs.map((r) => {
      const p = String(r.periodId || '')
      const m = p.match(/(\d{4})-([A-Za-z]{3})/)
      if (m) {
        const y = Number(m[1])
        const mon = String(m[2]).toLowerCase()
        const map = {
          jan: 1,
          feb: 2,
          mar: 3,
          apr: 4,
          may: 5,
          jun: 6,
          jul: 7,
          aug: 8,
          sep: 9,
          oct: 10,
          nov: 11,
          dec: 12,
        }
        return y * 100 + (map[mon] || 0)
      }
      return 0
    })
  )

  const rec =
    recs.find((r) => {
      const p = String(r.periodId || '')
      const m = p.match(/(\d{4})-([A-Za-z]{3})/)
      if (!m) return false
      const y = Number(m[1])
      const mon = String(m[2]).toLowerCase()
      const map = {
        jan: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        may: 5,
        jun: 6,
        jul: 7,
        aug: 8,
        sep: 9,
        oct: 10,
        nov: 11,
        dec: 12,
      }
      return y * 100 + (map[mon] || 0) === latestPeriod
    }) || recs[recs.length - 1]

  clients.push({
    name,
    id,
    login,
    period: rec.periodId || '-',
    trades: Number(rec.trades || 0),
    pl: Number(rec.pl || 0),
    balance: Number(rec.balance || 0),
    deposit: Number(rec.deposit || 0),
    net: Number(rec.net || 0),
  })
}

// Sort by absolute PL and take top 5
clients.sort((a, b) => Math.abs(b.pl) - Math.abs(a.pl))
const top5 = clients.slice(0, 5)

// Format function
const fmt = (v, k) => {
  if (k === 'trades') return Math.round(v).toString()
  return v.toFixed(2)
}

// Print table
console.log('')
console.log('╔════════════════════════════════════════════════════════════════════════════╗')
console.log('║ CREOLABS REPORT - TOP 5 CLIENTS (LOCAL DATA)                             ║')
console.log('╚════════════════════════════════════════════════════════════════════════════╝')
console.log('')
console.log('┌──────────────────┬─────────────┬──────────┬──────────┬──────────┬──────────┐')
console.log('│ Client Name      │ Period      │ Trades # │ PL €     │ Balance €│ Net €    │')
console.log('├──────────────────┼─────────────┼──────────┼──────────┼──────────┼──────────┤')

for (const c of top5) {
  const nameCol = (c.name || '').padEnd(16)
  const periodCol = (c.period || '').padEnd(11)
  const tradesCol = fmt(c.trades, 'trades').padStart(8)
  const plCol = fmt(c.pl).padStart(8)
  const balCol = fmt(c.balance).padStart(8)
  const netCol = fmt(c.net).padStart(8)

  console.log(
    `│ ${nameCol} │ ${periodCol} │ ${tradesCol} │ ${plCol} │ ${balCol} │ ${netCol} │`
  )
}

console.log('└──────────────────┴─────────────┴──────────┴──────────┴──────────┴──────────┘')
console.log('')
console.log(`Total unique clients in report: ${clients.length}`)
console.log(`Shown: Top 5 by absolute P&L value`)
console.log('')
