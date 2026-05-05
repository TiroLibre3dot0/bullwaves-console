/**
 * Scan Qlik table objects to find one with client PL data.
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

function tout(p, ms, l) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`${l} timeout`)), ms)
    p.then(v => { clearTimeout(t); res(v) }).catch(e => { clearTimeout(t); rej(e) })
  })
}

async function main() {
  const auth = await getAuth()
  const ws = await tout(new Promise((res, rej) => {
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
    return tout(new Promise((res, rej) => {
      pending.set(n, { resolve: res, reject: rej })
      ws.send(JSON.stringify({ jsonrpc: '2.0', id: n, handle, method, params }))
    }), 20000, method)
  }

  const openResult = await call(-1, 'OpenDoc', [APP_ID])
  const docHandle = Number(openResult?.qReturn?.qHandle || 0)
  if (!docHandle) throw new Error('OpenDoc failed')
  console.log('Connected, doc handle:', docHandle)

  // Get all table objects
  const tablesResult = await call(docHandle, 'GetObjects', [{ qTypes: ['table'], qIncludeSessionObjects: false }])
  const tables = tablesResult?.qList || []
  console.log(`\nTotal table objects: ${tables.length}`)

  // Scan each table for relevant data (client name + numeric cols)
  const clientKeywords = ['client', 'trader', 'user', 'name', 'player']
  const plKeywords = ['p&l', 'pl', 'profit', 'loss', 'net', 'balance', 'equity', 'revenue']

  let found = []
  console.log('\nScanning tables...')
  for (const t of tables) {
    const qId = t?.qInfo?.qId
    if (!qId) continue
    try {
      const objResult = await call(docHandle, 'GetObject', [qId])
      const h = Number(objResult?.qReturn?.qHandle || 0)
      if (!h) continue

      const layout = await call(h, 'GetLayout', [])
      const qLayout = layout?.qLayout || layout
      const title = qLayout?.qMeta?.title || qLayout?.title || qId
      const cube = qLayout?.qHyperCube
      const straight = qLayout?.qListObject

      if (cube) {
        const cx = cube?.qSize?.qcx || 0
        const cy = cube?.qSize?.qcy || 0
        const dims = (cube?.qDimensionInfo || []).map(d => d?.qFallbackTitle || d?.qGroupFieldDefs?.[0] || '')
        const meas = (cube?.qMeasureInfo || []).map(m => m?.qFallbackTitle || m?.qLabel || '')
        const allCols = [...dims, ...meas].map(s => s.toLowerCase())
        const hasClient = allCols.some(c => clientKeywords.some(k => c.includes(k)))
        const hasPl = allCols.some(c => plKeywords.some(k => c.includes(k)))
        if (hasClient && cy > 0) {
          found.push({ id: qId, title, cx, cy, dims, meas, hasPl })
          console.log(`  ✓ [${qId}] "${title}" cx=${cx} cy=${cy} | dims: ${dims.slice(0,4).join(', ')} | meas: ${meas.slice(0,4).join(', ')}`)
        }
      }
    } catch (e) {
      // silent
    }
  }

  // Show first rows of the most promising table
  const best = found.find(f => f.hasPl) || found[0]
  if (best) {
    console.log(`\n--- Fetching 5 rows from best table: [${best.id}] "${best.title}" ---`)
    try {
      const objResult = await call(docHandle, 'GetObject', [best.id])
      const h = Number(objResult?.qReturn?.qHandle || 0)
      const layout = await call(h, 'GetLayout', [])
      const cube = (layout?.qLayout || layout)?.qHyperCube
      const data = await call(h, 'GetHyperCubeData', ['/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qHeight: 5, qWidth: best.cx }]])
      const rows = data?.qDataPages?.[0]?.qMatrix || []
      const headers = [...best.dims, ...best.meas]
      console.log(headers.map(h => h.slice(0, 15).padEnd(16)).join(' | '))
      console.log('-'.repeat(headers.length * 18))
      for (const row of rows) {
        console.log(row.map((c, i) => String(i < best.dims.length ? c.qText : (c.qNum != null ? c.qNum.toFixed(2) : c.qText)).slice(0,15).padEnd(16)).join(' | '))
      }
    } catch (e) {
      console.error('Fetch rows error:', e.message)
    }
  } else {
    console.log('\nNo relevant table found.')
    // Show a sample of what was found
    console.log('First 5 tables by cy:')
    const sorted = found.sort((a, b) => b.cy - a.cy).slice(0, 5)
    for (const f of sorted) console.log(`  [${f.id}] "${f.title}" cy=${f.cy}`)
  }

  ws.close()
  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
