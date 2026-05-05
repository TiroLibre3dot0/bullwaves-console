/**
 * Probe: find the Qlik object that corresponds to Prime Clients Ranking.xlsx
 * Key columns to match: week, status, client_email, ltc_group, last_time_contact, ftd, rdp
 */
const dotenv = require('dotenv')
const path = require('path')
;['.env.server.local', '.env.local'].forEach(name => {
  dotenv.config({ path: path.resolve(__dirname, '..', name), override: false })
})
const WebSocket = require('ws')

const TENANT_HTTP = (process.env.QLIK_TENANT_URL || '').replace(/\/+$/, '')
const TENANT_WS = TENANT_HTTP.replace(/^https:\/\//, 'wss://')
const API_KEY = process.env.QLIK_API_KEY || ''
const APP_ID = 'c6f37daa-0278-42b0-ab9b-813d2b9aafeb'

// Signature of Prime Clients Ranking: look for objects with these dimension/measure titles
const PRIME_KEYWORDS = ['week', 'status', 'email', 'ltc', 'last time', 'ftd', 'rdp', 'lead']

async function main() {
  const auth = `Bearer ${API_KEY}`
  const ws = await new Promise((res, rej) => {
    const s = new WebSocket(`${TENANT_WS}/app/${APP_ID}`, { headers: { Authorization: auth } })
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
  ws.on('close', () => { for (const [,p] of pending) p.reject(new Error('closed')); pending.clear() })

  function call(handle, method, params = []) {
    const n = id++
    return new Promise((res, rej) => {
      pending.set(n, { resolve: res, reject: rej })
      ws.send(JSON.stringify({ jsonrpc: '2.0', id: n, handle, method, params }))
    })
  }

  const openResult = await call(-1, 'OpenDoc', [APP_ID])
  const docHandle = Number(openResult?.qReturn?.qHandle || 0)
  console.log('Doc handle:', docHandle)

  // Get all objects via GetAllInfos
  const allInfos = await call(docHandle, 'GetAllInfos', [])
  const items = (allInfos?.qInfos || []).filter(i => {
    const t = (i?.qType || '').toLowerCase()
    return t.includes('table') || t.includes('chart') || t.includes('pivot') || t.includes('straight')
  })
  console.log(`\nTotal candidate objects: ${items.length}`)

  // Scan each table object for Prime Clients Ranking signature
  const candidates = []

  for (const item of items) {
    const objId = item?.qId || item?.qInfo?.qId
    if (!objId) continue

    try {
      const objRes = await call(docHandle, 'GetObject', [objId])
      const h = Number(objRes?.qReturn?.qHandle || 0)
      if (!h) continue

      const layout = await call(h, 'GetLayout', [])
      const qL = layout?.qLayout || layout
      const cube = qL?.qHyperCube
      if (!cube) continue

      const cx = cube?.qSize?.qcx || 0
      const cy = cube?.qSize?.qcy || 0
      if (cy < 10000) continue // too small

      const dims = (cube?.qDimensionInfo || []).map(d => (d.qFallbackTitle || '').toLowerCase())
      const meas = (cube?.qMeasureInfo || []).map(m => (m.qFallbackTitle || '').toLowerCase())
      const allTitles = [...dims, ...meas].join(' ')

      const matchCount = PRIME_KEYWORDS.filter(kw => allTitles.includes(kw)).length

      if (matchCount >= 2) {
        candidates.push({
          id: objId,
          title: qL?.qMeta?.title || qL?.qInfo?.qType || '',
          cx, cy, matchCount,
          dims: dims.slice(0, 10),
          meas: meas.slice(0, 10),
        })
      }
    } catch {
      // skip inaccessible objects
    }
  }

  candidates.sort((a, b) => b.matchCount - a.matchCount || b.cy - a.cy)

  console.log(`\n=== Prime Clients Ranking candidates (${candidates.length}) ===`)
  for (const c of candidates.slice(0, 8)) {
    console.log(`\n[${c.id}] "${c.title}" cx=${c.cx} cy=${c.cy} matches=${c.matchCount}`)
    console.log('  Dims:', c.dims.join(', '))
    console.log('  Meas:', c.meas.join(', '))
  }

  // Also check the known big object 90510982
  console.log('\n=== Checking object 90510982 directly ===')
  try {
    const r = await call(docHandle, 'GetObject', ['90510982'])
    const h = Number(r?.qReturn?.qHandle || 0)
    if (h) {
      const layout = await call(h, 'GetLayout', [])
      const qL = layout?.qLayout || layout
      const cube = qL?.qHyperCube
      console.log('Title:', qL?.qMeta?.title || '(no title)')
      console.log('Size:', cube?.qSize?.qcx, 'x', cube?.qSize?.qcy)
      console.log('Dims:', (cube?.qDimensionInfo || []).map(d => d.qFallbackTitle).join(', '))
      console.log('Meas:', (cube?.qMeasureInfo || []).map(m => m.qFallbackTitle).join(', '))

      // Fetch first row
      const data = await call(h, 'GetHyperCubeData', ['/qHyperCubeDef', [{ qTop: 0, qLeft: 0, qHeight: 1, qWidth: Math.min(cube?.qSize?.qcx || 10, 24) }]])
      const row = data?.qDataPages?.[0]?.qMatrix?.[0] || []
      console.log('First row:', row.map(c => c.qText || c.qNum).join(' | '))
    }
  } catch (e) {
    console.log('90510982 error:', e.message)
  }

  ws.close()
  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
