/**
 * Get master library dimensions and measures from Qlik app.
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
  console.log('Doc handle:', docHandle)

  // 1. Get master library dimensions
  console.log('\n--- Master Dimensions ---')
  try {
    const r = await call(docHandle, 'GetDimensions', [])
    const dims = r?.qList || []
    console.log(`Count: ${dims.length}`)
    for (const d of dims.slice(0, 30)) {
      const info = d?.qInfo
      const def = d?.qDim?.qFieldDefs?.[0] || d?.qDim?.qFieldDefs?.join(', ') || ''
      const label = d?.qMetaDef?.title || d?.qDim?.qFieldLabels?.[0] || ''
      console.log(`  [${info?.qId}] "${label}" → field: "${def}"`)
    }
  } catch (e) {
    console.error('GetDimensions error:', e.message)
  }

  // 2. Get master library measures
  console.log('\n--- Master Measures ---')
  try {
    const r = await call(docHandle, 'GetMeasures', [])
    const measures = r?.qList || []
    console.log(`Count: ${measures.length}`)
    for (const m of measures.slice(0, 50)) {
      const info = m?.qInfo
      const expr = m?.qMeasure?.qDef || ''
      const label = m?.qMetaDef?.title || ''
      console.log(`  [${info?.qId}] "${label}" → expr: "${expr}"`)
    }
  } catch (e) {
    console.error('GetMeasures error:', e.message)
  }

  // 3. Try GetObjects with various types
  console.log('\n--- GetObjects types ---')
  const typesToTry = ['sheet', 'table', 'chart', 'listbox', 'masterobject', 'embeddedsnapshot', 'auto-chart']
  for (const t of typesToTry) {
    try {
      const r = await call(docHandle, 'GetObjects', [{ qTypes: [t], qIncludeSessionObjects: false }])
      const list = r?.qList || []
      if (list.length > 0) console.log(`  type="${t}": ${list.length} objects`)
    } catch (e) {
      console.log(`  type="${t}": error ${e.message}`)
    }
  }

  // 4. Try CreateSessionObject with first master measure (if any were found)
  // Also try known Creolabs CR expression patterns
  console.log('\n--- Trying CR-style expressions ---')
  const crExpressions = [
    { label: 'P&L sum', expr: 'Sum([P&L])' },
    { label: 'Net PL', expr: 'Sum([Net P&L])' },
    { label: 'Profit', expr: 'Sum([Profit])' },
    { label: 'cr_pl', expr: 'Sum([cr_pl])' },
    { label: 'cr_net', expr: 'Sum([cr_net])' },
    { label: 'CR_PL', expr: 'Sum([CR_PL])' },
    { label: 'Total trades', expr: 'Count([Client Name])' },
    { label: 'Count rows', expr: 'Count(1)' },
    { label: 'Total clients', expr: 'Count(Distinct [Client Name])' },
  ]
  for (const { label, expr } of crExpressions) {
    try {
      const r = await call(docHandle, 'CreateSessionObject', [{
        qInfo: { qType: 'p' },
        qHyperCubeDef: {
          qDimensions: [{ qDef: { qFieldDefs: ['Client Name'] } }],
          qMeasures: [{ qDef: { qDef: expr } }],
          qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: 1, qWidth: 2 }],
        },
      }])
      const h = Number(r?.qReturn?.qHandle || 0)
      if (!h) continue
      const layout = await call(h, 'GetLayout', [])
      const cube = layout?.qLayout?.qHyperCube
      const cy = cube?.qSize?.qcy || 0
      const cx = cube?.qSize?.qcx || 0
      const val = cube?.qDataPages?.[0]?.qMatrix?.[0]?.[1]
      console.log(`  ${label} (${expr}): cx=${cx}, cy=${cy}, val=${val?.qText || val?.qNum}`)
    } catch (e) {
      console.log(`  ${label}: error ${e.message.slice(0, 80)}`)
    }
  }

  ws.close()
  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
