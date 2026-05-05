/**
 * Probe the Qlik app data model: get field list and try to build a
 * session hypercube with clientName + pl fields directly (no custom report).
 */
const dotenv = require('dotenv')
const path = require('path')
;['.env.sendgrid.local', '.env.server.local', '.env.server', '.env.local', '.env'].forEach(name => {
  dotenv.config({ path: path.resolve(__dirname, '..', name), override: false })
})
const WebSocket = require('ws')

const TENANT = (process.env.QLIK_TENANT_URL || '').replace(/\/+$/, '').replace(/^https:\/\//, 'wss://')
const API_KEY = process.env.QLIK_API_KEY || ''
const CLIENT_ID = process.env.QLIK_OAUTH_CLIENT_ID || ''
const CLIENT_SECRET = process.env.QLIK_OAUTH_CLIENT_SECRET || ''
const APP_ID = 'c6f37daa-0278-42b0-ab9b-813d2b9aafeb'

async function getToken() {
  if (API_KEY) return `Bearer ${API_KEY}`
  const tenantHttp = TENANT.replace('wss://', 'https://')
  const r = await fetch(`${tenantHttp}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: process.env.QLIK_OAUTH_SCOPE || 'user_default',
    }),
  })
  const b = await r.json()
  if (!r.ok) throw new Error(`OAuth failed: ${b.error_description || b.error}`)
  return `Bearer ${b.access_token}`
}

function withTimeout(p, ms, label) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`${label} timed out`)), ms)
    p.then(v => { clearTimeout(t); res(v) }).catch(e => { clearTimeout(t); rej(e) })
  })
}

async function main() {
  const auth = await getToken()
  const wsUrl = `${TENANT}/app/${APP_ID}`
  console.log('Connecting to:', wsUrl.replace(TENANT, '[tenant]'))

  const ws = await withTimeout(new Promise((res, rej) => {
    const s = new WebSocket(wsUrl, { headers: { Authorization: auth } })
    s.once('open', () => res(s))
    s.once('error', rej)
  }), 15000, 'WS connect')

  let msgId = 1
  const pending = new Map()

  ws.on('message', (raw) => {
    try {
      const m = JSON.parse(String(raw))
      const id = Number(m?.id || 0)
      if (!id || !pending.has(id)) return
      const p = pending.get(id); pending.delete(id)
      if (m.error) {
        const e = new Error(`Engine error ${m.error.code}: ${m.error.message}`)
        e.details = m.error; p.reject(e)
      } else {
        p.resolve(m.result)
      }
    } catch {}
  })

  ws.on('close', () => {
    for (const [, p] of pending) p.reject(new Error('WS closed'))
    pending.clear()
  })

  function call(handle, method, params = []) {
    const id = msgId++
    return withTimeout(new Promise((res, rej) => {
      pending.set(id, { resolve: res, reject: rej })
      ws.send(JSON.stringify({ jsonrpc: '2.0', id, handle, method, params }))
    }), 20000, `${method}`)
  }

  // Open doc
  const openResult = await call(-1, 'OpenDoc', [APP_ID])
  const docHandle = Number(openResult?.qReturn?.qHandle || 0)
  if (!docHandle) throw new Error('Could not open doc')
  console.log('Doc handle:', docHandle)

  // Get all fields in data model
  console.log('\n--- Fields in data model ---')
  try {
    const fieldsResult = await call(docHandle, 'GetFieldList', [{ qShowSemantic: true, qShowSrcTables: true }])
    const fields = fieldsResult?.qFieldList?.qItems || []
    console.log(`Total fields: ${fields.length}`)
    const relevant = fields.filter(f => {
      const name = String(f.qName || '').toLowerCase()
      return name.includes('client') || name.includes('pl') || name.includes('profit')
        || name.includes('loss') || name.includes('trade') || name.includes('balance')
        || name.includes('net') || name.includes('login') || name.includes('name')
        || name.includes('period') || name.includes('deposit') || name.includes('wd')
    })
    console.log(`Relevant fields (${relevant.length}):`)
    for (const f of relevant) {
      console.log(`  "${f.qName}" src: ${(f.qSrcTables || []).map(t => t.qName).join(', ')}`)
    }
    if (relevant.length === 0) {
      console.log('All fields:')
      for (const f of fields.slice(0, 30)) console.log(`  "${f.qName}"`)
    }
  } catch (e) {
    console.error('GetFieldList error:', e.message)
  }

  // Try each dim alone to find which ones work
  const allCandidates = [
    'Client Name', 'Client', 'ClientName', 'Client ID', 'ClientId', 'Login', 'Client Login',
    'Period', 'Month', 'PeriodId', 'Period ID', 'Report Period', 'Month Year',
    'P&L', 'PL', 'Profit & Loss', 'Net P&L', 'Gross P&L', 'Total P&L', 'Net PL',
    'Balance', 'Equity', 'Net Revenue', 'Revenue', 'Net', 'Turnover',
    'Trades', 'Volume', 'Lots', 'Positions', 'Orders',
    'Deposit', 'Withdrawal', 'WD', 'FTD',
    'Commission', 'Rebate',
    'Country', 'Brand', 'Affiliate', 'Agent',
  ]

  console.log('\n--- Probing individual fields ---')
  const working = []
  for (const field of allCandidates) {
    try {
      const r = await call(docHandle, 'CreateSessionObject', [{
        qInfo: { qType: 'probe' },
        qHyperCubeDef: {
          qDimensions: [{ qDef: { qFieldDefs: [field] } }],
          qMeasures: [],
          qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: 1, qWidth: 1 }],
        },
      }])
      const h = Number(r?.qReturn?.qHandle || 0)
      if (!h) continue
      const layout = await call(h, 'GetLayout', [])
      const cube = layout?.qLayout?.qHyperCube
      const cy = cube?.qSize?.qcy || 0
      const cx = cube?.qSize?.qcx || 0
      if (cx > 0 && cy > 0) {
        const firstVal = cube?.qDataPages?.[0]?.qMatrix?.[0]?.[0]?.qText || '?'
        console.log(`  ✓ "${field}" → ${cy} rows, first: ${firstVal}`)
        working.push(field)
      }
    } catch (e) {
      // silent
    }
  }

  console.log('\nWorking fields:', working)

  ws.close()
  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
