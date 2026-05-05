/**
 * Get properties (expressions) from Apr 2026 table + build top5 PL live query.
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
const APR_OBJ = '53c14348-64ce-48a2-a8c7-5fcfc983be32'

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

  const objResult = await call(docHandle, 'GetObject', [APR_OBJ])
  const h = Number(objResult?.qReturn?.qHandle || 0)
  if (!h) throw new Error('Object not found')
  console.log('Apr 2026 object handle:', h)

  // Get properties to see actual expressions
  console.log('\n--- Properties (measure expressions) ---')
  try {
    const props = await call(h, 'GetProperties', [])
    const cubeDef = props?.qProp?.qHyperCubeDef || props?.qHyperCubeDef
    const dimsP = cubeDef?.qDimensions || []
    const measP = cubeDef?.qMeasures || []
    console.log('Dims:')
    dimsP.forEach((d, i) => console.log(`  [${i}] "${d.qDef?.qFieldDefs?.[0]}" label="${d.qDef?.qFieldLabels?.[0] || ''}"`))
    console.log('Measures:')
    measP.forEach((m, i) => {
      const expr = m.qDef?.qDef || m.qLibraryId || '(library)'
      const label = m.qDef?.qLabel || m.qLabel || ''
      console.log(`  [${i}] label="${label}" expr="${String(expr).slice(0, 120)}"`)
    })
  } catch (e) {
    console.error('GetProperties error:', e.message)
  }

  // Create session object: Client Name + Client ID + $ PL aggregated
  // First try with directly Sum([$ PL]) - that won't work as $ PL isn't a field
  // So let's try using a master measure reference or find the expression
  // Actually use GetLayout to see qMeasureInfo which has min/max to identify which measure is PL
  const layout = await call(h, 'GetLayout', [])
  const qL = layout?.qLayout || layout
  const cube = qL?.qHyperCube
  console.log('\n--- Measure info from layout ---')
  ;(cube?.qMeasureInfo || []).forEach((m, i) => {
    console.log(`  [${i}] "${m.qFallbackTitle}" qMin=${m.qMin?.toFixed?.(2)} qMax=${m.qMax?.toFixed?.(2)} qAttrDimInfo=${JSON.stringify(m.qAttrDimInfo)?.slice(0,50)}`)
  })

  console.log('\n--- Try session object with Client Name + measures via library IDs ---')
  // Try using the library measure ID approach from the full property
  // We know the measure title is "$ PL" - let's try building with qLibraryId
  // From the previous scan of CR - Summary: qLibraryId: 81f35717-b80f-4241-92f9-14cfc385e120
  // But let's see if we can get data from this object by aggregating differently

  // Strategy: use GetHyperCubeData on the Apr 2026 object directly
  // and look for column 5 ($ PL) values aggregated by Client Name
  console.log('\n--- Get data sorted by abs PL (Client Name + PL col only) ---')
  // First find which column index has $ PL
  const measInfoList = cube?.qMeasureInfo || []
  const plIdx = measInfoList.findIndex(m => m.qFallbackTitle?.includes('PL') && !m.qFallbackTitle?.includes('Open') && !m.qFallbackTitle?.includes('Raw') && !m.qFallbackTitle?.includes('Swap'))
  const nDims = (cube?.qDimensionInfo || []).length
  console.log(`PL column index in measures: ${plIdx}, total dim cols: ${nDims}`)

  // Fetch top data - using sort by abs PL
  // Can't change sort on the existing object but let's get raw data and sort manually
  // Fetch 1000 rows to find top 5 by abs PL, aggregating by Client Name
  if (plIdx >= 0) {
    const plCol = nDims + plIdx
    const clientNameIdx = (cube?.qDimensionInfo || []).findIndex(d => d.qFallbackTitle === 'Client Name')
    const clientIdIdx = (cube?.qDimensionInfo || []).findIndex(d => d.qFallbackTitle === 'Client ID')
    console.log(`Client Name dim col: ${clientNameIdx}, Client ID dim col: ${clientIdIdx}`)

    // Fetch pages
    const byClient = new Map()
    const pageSize = 500
    let fetched = 0
    const totalRows = Math.min(cube?.qSize?.qcy || 0, 5000)
    while (fetched < totalRows) {
      const data = await call(h, 'GetHyperCubeData', ['/qHyperCubeDef', [{
        qTop: fetched, qLeft: 0, qHeight: pageSize, qWidth: cube?.qSize?.qcx || 20
      }]])
      const rows = data?.qDataPages?.[0]?.qMatrix || []
      if (!rows.length) break
      for (const row of rows) {
        const name = row[clientNameIdx]?.qText || '?'
        const cid = row[clientIdIdx]?.qText || '?'
        const plVal = row[plCol]?.qNum
        if (name === '?') continue
        const key = `${name}|${cid}`
        const prev = byClient.get(key) || { name, cid, pl: 0 }
        prev.pl += (isFinite(plVal) ? plVal : 0)
        byClient.set(key, prev)
      }
      fetched += rows.length
      if (rows.length < pageSize) break
    }
    console.log(`Fetched ${fetched} rows, ${byClient.size} unique clients`)

    const sorted = [...byClient.values()].sort((a, b) => Math.abs(b.pl) - Math.abs(a.pl)).slice(0, 10)
    console.log('\nTop 10 clients by |PL| (LIVE - Apr 2026):')
    console.log('Name'.padEnd(30), 'ClientID'.padEnd(12), '$ PL (live)')
    console.log('-'.repeat(60))
    for (const c of sorted) {
      console.log(c.name.padEnd(30), String(c.cid).padEnd(12), c.pl.toFixed(2))
    }
  }

  ws.close()
  console.log('\nDone.')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
