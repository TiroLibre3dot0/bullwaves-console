/**
 * Probe 5bac0559 and 90510982 - periodic trading objects
 */
const dotenv = require('dotenv')
const path = require('path')
;['.env.server.local', '.env.local'].forEach(name => {
  dotenv.config({ path: path.resolve(__dirname, '..', name), override: false })
})
const WebSocket = require('ws')

const TENANT_WS = (process.env.QLIK_TENANT_URL || '').replace(/^https:\/\//, 'wss://')
const API_KEY = process.env.QLIK_API_KEY || ''
const APP_ID = 'c6f37daa-0278-42b0-ab9b-813d2b9aafeb'

const CANDIDATES = [
  '5bac0559-4987-4961-816c-e5da8b254cfe',
  '90510982-3310-4f6c-a094-2030071eb1b8',
]

async function main() {
  const ws = await new Promise((res, rej) => {
    const s = new WebSocket(`${TENANT_WS}/app/${APP_ID}`, { headers: { Authorization: `Bearer ${API_KEY}` } })
    s.once('open', () => res(s)); s.once('error', rej)
  })

  let id = 1
  const pending = new Map()
  ws.on('message', raw => {
    try {
      const m = JSON.parse(String(raw))
      const n = Number(m?.id || 0)
      if (!n || !pending.has(n)) return
      const p = pending.get(n); pending.delete(n)
      m.error ? p.reject(new Error(`E${m.error.code}: ${m.error.message}`)) : p.resolve(m.result)
    } catch {}
  })

  function call(handle, method, params = []) {
    const n = id++
    return new Promise((res, rej) => {
      pending.set(n, { resolve: res, reject: rej })
      ws.send(JSON.stringify({ jsonrpc: '2.0', id: n, handle, method, params }))
    })
  }

  const docHandle = Number((await call(-1, 'OpenDoc', [APP_ID]))?.qReturn?.qHandle || 0)

  for (const objId of CANDIDATES) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`OBJECT: ${objId}`)
    try {
      const r = await call(docHandle, 'GetObject', [objId])
      const h = Number(r?.qReturn?.qHandle || 0)
      const layout = await call(h, 'GetLayout', [])
      const qL = layout?.qLayout || layout
      const cube = qL?.qHyperCube
      const cx = cube?.qSize?.qcx || 0
      const cy = cube?.qSize?.qcy || 0
      console.log(`Title: "${qL?.qMeta?.title || ''}"  Size: ${cx}×${cy}`)
      
      const dims = cube?.qDimensionInfo || []
      const meas = cube?.qMeasureInfo || []
      console.log('\nAll Dimensions:')
      dims.forEach((d, i) => console.log(`  [${i}] ${d.qFallbackTitle}`))
      console.log('\nAll Measures:')
      meas.forEach((m, i) => console.log(`  [${i}] ${m.qFallbackTitle}`))

      // Fetch first 2 rows
      const data = await call(h, 'GetHyperCubeData', ['/qHyperCubeDef', [{
        qTop: 0, qLeft: 0, qHeight: 2, qWidth: Math.min(cx, 24)
      }]])
      const rows = data?.qDataPages?.[0]?.qMatrix || []
      console.log('\nFirst 2 rows:')
      rows.forEach((row, ri) => {
        const vals = row.map(c => `"${c.qText || ''}"`)
        console.log(`  Row${ri}: [${vals.join(', ')}]`)
      })
    } catch (e) {
      console.log(`ERROR: ${e.message}`)
    }
  }

  // Also do a wide scan for objects that have 'week' in their dims
  console.log(`\n\n${'='.repeat(60)}`)
  console.log('WIDE SCAN: looking for objects with "week" or "email" dimension...')
  const allInfos = await call(docHandle, 'GetAllInfos', [])
  const all = allInfos?.qInfos || []
  console.log(`Total objects in app: ${all.length}`)
  
  let found = 0
  for (const info of all) {
    const oid = info?.qId || info?.qInfo?.qId
    if (!oid) continue
    try {
      const r = await call(docHandle, 'GetObject', [oid])
      const h = Number(r?.qReturn?.qHandle || 0)
      if (!h) continue
      const layout = await call(h, 'GetLayout', [])
      const qL = layout?.qLayout || layout
      const cube = qL?.qHyperCube
      if (!cube) continue
      const dims = (cube?.qDimensionInfo || []).map(d => (d.qFallbackTitle || '').toLowerCase())
      const meas = (cube?.qMeasureInfo || []).map(m => (m.qFallbackTitle || '').toLowerCase())
      const all_titles = [...dims, ...meas].join(' ')
      if (all_titles.includes('week') || all_titles.includes('email')) {
        found++
        const cy = cube?.qSize?.qcy || 0
        console.log(`  [${oid}] cx=${cube?.qSize?.qcx} cy=${cy} dims=[${dims.join(', ')}] meas=[${meas.join(', ')}]`)
      }
    } catch {}
  }
  if (!found) console.log('  None found with "week" or "email"')

  ws.close()
  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
