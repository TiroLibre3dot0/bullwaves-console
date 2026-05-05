/**
 * Find working measure field names in Qlik live data model.
 * Already confirmed dims: 'Client Name', 'Client ID', 'Period', 'Brand'
 */
const dotenv = require('dotenv')
const path = require('path')
;['.env.sendgrid.local', '.env.server.local', '.env.server', '.env.local', '.env'].forEach(name => {
  dotenv.config({ path: path.resolve(__dirname, '..', name), override: false })
})
const WebSocket = require('ws')

const TENANT_HTTP = (process.env.QLIK_TENANT_URL || '').replace(/\/+$/, '')
const TENANT_WS = TENANT_HTTP.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
const API_KEY = process.env.QLIK_API_KEY || ''
const CLIENT_ID = process.env.QLIK_OAUTH_CLIENT_ID || ''
const CLIENT_SECRET = process.env.QLIK_OAUTH_CLIENT_SECRET || ''
const APP_ID = 'c6f37daa-0278-42b0-ab9b-813d2b9aafeb'

async function getAuth() {
  if (API_KEY) return `Bearer ${API_KEY}`
  const r = await fetch(`${TENANT_HTTP}/oauth/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials', scope: process.env.QLIK_OAUTH_SCOPE || 'user_default' }),
  })
  const b = await r.json()
  if (!r.ok) throw new Error(`OAuth: ${b.error_description || b.error}`)
  return `Bearer ${b.access_token}`
}

function timeout(p, ms, label) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`${label} timeout`)), ms)
    p.then(v => { clearTimeout(t); res(v) }).catch(e => { clearTimeout(t); rej(e) })
  })
}

async function main() {
  const auth = await getAuth()
  const ws = await timeout(new Promise((res, rej) => {
    const s = new WebSocket(`${TENANT_WS}/app/${APP_ID}`, { headers: { Authorization: auth } })
    s.once('open', () => res(s)); s.once('error', rej)
  }), 15000, 'connect')

  let id = 1
  const pending = new Map()
  ws.on('message', raw => {
    try {
      const m = JSON.parse(String(raw))
      const n = Number(m?.id || 0)
      if (!n || !pending.has(n)) return
      const p = pending.get(n); pending.delete(n)
      m.error ? p.reject(Object.assign(new Error(`E${m.error.code}: ${m.error.message}`), { details: m.error })) : p.resolve(m.result)
    } catch {}
  })
  ws.on('close', () => { for (const [, p] of pending) p.reject(new Error('closed')); pending.clear() })

  function call(handle, method, params = []) {
    const n = id++
    return timeout(new Promise((res, rej) => {
      pending.set(n, { resolve: res, reject: rej })
      ws.send(JSON.stringify({ jsonrpc: '2.0', id: n, handle, method, params }))
    }), 20000, method)
  }

  const openResult = await call(-1, 'OpenDoc', [APP_ID])
  const docHandle = Number(openResult?.qReturn?.qHandle || 0)
  if (!docHandle) throw new Error('OpenDoc failed')
  console.log('Doc handle:', docHandle, '\n')

  // Probe measures via Sum() - using 'Client Name' as fixed dim
  const measureCandidates = [
    'P&L', 'PL', 'Net P&L', 'Gross P&L', 'Total P&L',
    'Profit & Loss', 'Net Profit', 'Net Revenue', 'Profit',
    'Balance', 'Equity', 'Net', 'Revenue', 'Turnover',
    'Trades', 'Volume', 'Lots', 'Commission', 'Rebate', 'Spread',
    'Deposit', 'Withdrawal', 'WD', 'Net Deposit', 'FTD',
    'Open P&L', 'Closed P&L', 'Floating P&L', 'Realized P&L',
    'Swap', 'Tax', 'Fee', 'Margin', 'Credit',
  ]

  console.log('--- Probing measures Sum([field]) ---')
  const found = []
  for (const m of measureCandidates) {
    try {
      const r = await call(docHandle, 'CreateSessionObject', [{
        qInfo: { qType: 'p' },
        qHyperCubeDef: {
          qDimensions: [{ qDef: { qFieldDefs: ['Client Name'] } }],
          qMeasures: [{ qDef: { qDef: `Sum([${m}])` } }],
          qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: 1, qWidth: 2 }],
        },
      }])
      const h = Number(r?.qReturn?.qHandle || 0)
      if (!h) continue
      const layout = await call(h, 'GetLayout', [])
      const cube = layout?.qLayout?.qHyperCube
      const cx = cube?.qSize?.qcx || 0
      const cy = cube?.qSize?.qcy || 0
      const val = cube?.qDataPages?.[0]?.qMatrix?.[0]?.[1]?.qNum
      if (cx >= 2 && cy > 0 && val != null && isFinite(val) && val !== 0) {
        console.log(`  ✓ "${m}" → cy=${cy}, first Sum=${val.toFixed(2)}`)
        found.push(m)
      }
    } catch {}
  }

  console.log('\nFound measures:', found)

  if (found.length > 0) {
    // Build sample with Client Name + Period + found measures (max 5)
    const useMeasures = found.slice(0, 5)
    console.log(`\n--- Sample: Client Name + Period + [${useMeasures.join(', ')}] ---`)
    try {
      const r = await call(docHandle, 'CreateSessionObject', [{
        qInfo: { qType: 'sample' },
        qHyperCubeDef: {
          qDimensions: [
            { qDef: { qFieldDefs: ['Client Name'] } },
            { qDef: { qFieldDefs: ['Period'] } },
          ],
          qMeasures: useMeasures.map(m => ({ qDef: { qDef: `Sum([${m}])` } })),
          qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: 10, qWidth: 2 + useMeasures.length }],
        },
      }])
      const h = Number(r?.qReturn?.qHandle || 0)
      if (h) {
        const layout = await call(h, 'GetLayout', [])
        const cube = layout?.qLayout?.qHyperCube
        console.log(`size: qcx=${cube?.qSize?.qcx}, qcy=${cube?.qSize?.qcy}`)
        const rows = cube?.qDataPages?.[0]?.qMatrix || []
        console.log(`cols: Client Name | Period | ${useMeasures.join(' | ')}`)
        console.log('-'.repeat(100))
        for (const row of rows) {
          console.log(row.map((c, i) => {
            const v = i >= 2 ? (c.qNum != null ? c.qNum.toFixed(2) : c.qText) : c.qText
            return String(v).padEnd(20)
          }).join(' | '))
        }
      }
    } catch (e) {
      console.error('Sample error:', e.message)
    }
  }

  ws.close()
  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
