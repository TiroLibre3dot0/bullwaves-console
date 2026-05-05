/**
 * Get layout + first 10 rows from the best table object found.
 * Reveals actual measure expressions and data.
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

// The target object found from scan
const TARGET_OBJ = '90510982-3310-4f6c-a094-2030071eb1b8' // cy=195405, has $ Closed PL etc

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

  // Get the target object
  const objResult = await call(docHandle, 'GetObject', [TARGET_OBJ])
  const h = Number(objResult?.qReturn?.qHandle || 0)
  if (!h) throw new Error('Object not found')
  console.log(`Got handle: ${h} for object ${TARGET_OBJ}`)

  // Get layout to extract actual expressions
  const layoutResult = await call(h, 'GetLayout', [])
  const qLayout = layoutResult?.qLayout || layoutResult
  const cube = qLayout?.qHyperCube

  console.log('\n--- Dimensions ---')
  const dims = cube?.qDimensionInfo || []
  dims.forEach((d, i) => {
    console.log(`  [${i}] title="${d.qFallbackTitle}" fields=${JSON.stringify(d.qGroupFieldDefs)}`)
  })

  console.log('\n--- Measures ---')
  const meas = cube?.qMeasureInfo || []
  meas.forEach((m, i) => {
    console.log(`  [${i}] title="${m.qFallbackTitle}" label="${m.qLabel}" expr="${m.qDef?.slice?.(0, 80)}"`)
  })

  console.log(`\n--- Size: qcx=${cube?.qSize?.qcx}, qcy=${cube?.qSize?.qcy} ---`)

  // Fetch first 10 rows
  console.log('\n--- First 10 data rows ---')
  try {
    const data = await call(h, 'GetHyperCubeData', ['/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qHeight: 10, qWidth: (cube?.qSize?.qcx || 24) }]])
    const rows = data?.qDataPages?.[0]?.qMatrix || []
    const nDims = dims.length
    const headers = [...dims.map(d => d.qFallbackTitle), ...meas.map(m => m.qFallbackTitle)]
    console.log(headers.slice(0, 10).map(h => String(h).slice(0, 14).padEnd(15)).join(' | '))
    console.log('-'.repeat(160))
    for (const row of rows) {
      const vals = row.slice(0, 10).map((c, i) => {
        const v = i < nDims ? (c.qText || '-') : (c.qNum != null && isFinite(c.qNum) ? c.qNum.toFixed(2) : (c.qText || '0'))
        return String(v).slice(0, 14).padEnd(15)
      })
      console.log(vals.join(' | '))
    }
  } catch (e) {
    console.error('GetHyperCubeData error:', e.message)
  }

  // Also check the Apr 2026 specific table
  console.log('\n\n--- Apr 2026 table: 53c14348-64ce-48a2-a8c7-5fcfc983be32 ---')
  try {
    const obj2 = await call(docHandle, 'GetObject', ['53c14348-64ce-48a2-a8c7-5fcfc983be32'])
    const h2 = Number(obj2?.qReturn?.qHandle || 0)
    const lay2 = await call(h2, 'GetLayout', [])
    const qL2 = lay2?.qLayout || lay2
    const cube2 = qL2?.qHyperCube
    const dims2 = cube2?.qDimensionInfo || []
    const meas2 = cube2?.qMeasureInfo || []
    console.log('Dims:', dims2.map(d => d.qFallbackTitle).join(', '))
    console.log('Meas:', meas2.slice(0, 8).map(m => m.qFallbackTitle).join(', '))
    console.log(`Size: qcx=${cube2?.qSize?.qcx}, qcy=${cube2?.qSize?.qcy}`)
    const data2 = await call(h2, 'GetHyperCubeData', ['/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qHeight: 3, qWidth: Math.min(cube2?.qSize?.qcx || 20, 10) }]])
    const rows2 = data2?.qDataPages?.[0]?.qMatrix || []
    for (const row of rows2) {
      console.log(row.slice(0, 10).map(c => String(c.qNum != null && isFinite(c.qNum) ? c.qNum.toFixed(2) : (c.qText || '-')).slice(0,14).padEnd(15)).join(' | '))
    }
  } catch (e) {
    console.error('Apr 2026 table error:', e.message)
  }

  ws.close()
  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
