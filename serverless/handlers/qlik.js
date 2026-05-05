const { json } = require('./_http')
const WebSocket = require('ws')

const ENGINE_CONNECT_TIMEOUT_MS = 30_000
const ENGINE_CALL_TIMEOUT_MS = 120_000

function env(name) {
  const v = process.env[name]
  return v == null ? '' : String(v).trim()
}

function normalizeTenantUrl(raw) {
  const value = String(raw || '').trim().replace(/\/+$/, '')
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `https://${value}`
}

function parseLimit(rawLimit, fallback = 20) {
  const value = Number(rawLimit)
  if (Number.isNaN(value) || value <= 0) return fallback
  return Math.min(100, Math.max(1, value))
}

function parsePositiveInt(rawValue, fallback, max) {
  const value = Number(rawValue)
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.min(max, Math.max(1, Math.trunc(value)))
}

function normalizeWsTenantUrl(tenantUrl) {
  return String(tenantUrl || '').replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://')
}

function safeText(value) {
  return String(value == null ? '' : value)
}

function withTimeout(promise, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${timeoutMs}ms`)
      err.code = 'timeout'
      reject(err)
    }, timeoutMs)
    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

class QlikEngineSession {
  constructor(config, appId) {
    this.config = config
    this.appId = safeText(appId).trim()
    this.ws = null
    this.nextId = 1
    this.pending = new Map()
    this.docHandle = 0
  }

  async connect() {
    const wsBase = normalizeWsTenantUrl(this.config.tenant)
    const wsUrl = `${wsBase}/app/${this.appId}`
    const authHeader = await getAuthHeader(this.config)

    this.ws = await withTimeout(
      new Promise((resolve, reject) => {
        const socket = new WebSocket(wsUrl, {
          headers: {
            Authorization: authHeader,
          },
        })

        socket.once('open', () => resolve(socket))
        socket.once('error', (error) => reject(error))
      }),
      ENGINE_CONNECT_TIMEOUT_MS,
      'Engine websocket connection'
    )

    this.ws.on('message', (raw) => {
      let message = null
      try {
        message = JSON.parse(String(raw || ''))
      } catch {
        return
      }

      const id = Number(message?.id || 0)
      if (!id || !this.pending.has(id)) return

      const pending = this.pending.get(id)
      this.pending.delete(id)

      if (message.error) {
        const err = new Error(`Engine error: ${message.error.message || 'unknown'}`)
        err.details = message.error
        pending.reject(err)
        return
      }

      pending.resolve(message.result)
    })

    this.ws.on('close', () => {
      for (const [, pending] of this.pending) {
        pending.reject(new Error('Engine websocket closed'))
      }
      this.pending.clear()
    })

    const openDoc = await this.call(-1, 'OpenDoc', [this.appId])
    this.docHandle = Number(openDoc?.qReturn?.qHandle || 0)
    if (!this.docHandle) {
      throw new Error('Unable to open Qlik app document')
    }
  }

  call(handle, method, params = []) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Engine websocket is not open'))
    }

    const id = this.nextId
    this.nextId += 1

    const payload = {
      jsonrpc: '2.0',
      id,
      handle,
      method,
      params,
    }

    return withTimeout(
      new Promise((resolve, reject) => {
        this.pending.set(id, { resolve, reject })
        try {
          this.ws.send(JSON.stringify(payload))
        } catch (error) {
          this.pending.delete(id)
          reject(error)
        }
      }),
      ENGINE_CALL_TIMEOUT_MS,
      `Engine call ${method}`
    )
  }

  async close() {
    if (!this.ws) return
    try {
      this.ws.close()
    } catch {
      // ignore close errors
    }
    this.ws = null
  }
}

async function withEngineSession(config, appId, fn) {
  const session = new QlikEngineSession(config, appId)
  await session.connect()
  try {
    return await fn(session)
  } finally {
    await session.close()
  }
}

function simplifyCell(cell) {
  return {
    text: safeText(cell?.qText),
    number: typeof cell?.qNum === 'number' ? cell.qNum : null,
    state: safeText(cell?.qState),
    isNull: Boolean(cell?.qIsNull),
  }
}

function extractSheetObjectsFromLayout(layout) {
  const map = new Map()
  const seen = new WeakSet()
  const rootId = safeText(layout?.qInfo?.qId).trim()

  function addRef(idRaw, typeRaw = '') {
    const id = safeText(idRaw).trim()
    const type = safeText(typeRaw).trim()
    if (!id || id === rootId) return

    const prev = map.get(id)
    if (!prev) {
      map.set(id, { id, type })
      return
    }
    if (!prev.type && type) {
      map.set(id, { id, type })
    }
  }

  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (seen.has(node)) return
    seen.add(node)

    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }

    addRef(node?.qInfo?.qId, node?.qInfo?.qType)
    addRef(node?.name || node?.qName, '')

    const qItems = Array.isArray(node?.qChildList?.qItems) ? node.qChildList.qItems : []
    for (const item of qItems) walk(item)

    const cells = Array.isArray(node?.cells) ? node.cells : []
    for (const cell of cells) walk(cell)

    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') walk(value)
    }
  }

  walk(layout)
  return Array.from(map.values())
}

function unwrapLayout(layoutResult) {
  return layoutResult && typeof layoutResult === 'object' && layoutResult.qLayout
    ? layoutResult.qLayout
    : layoutResult
}

function getConfig() {
  const tenant = normalizeTenantUrl(env('QLIK_TENANT_URL'))
  const apiKey = env('QLIK_API_KEY')
  const clientId = env('QLIK_OAUTH_CLIENT_ID')
  const clientSecret = env('QLIK_OAUTH_CLIENT_SECRET')
  const scope = env('QLIK_OAUTH_SCOPE') || 'user_default'

  const hasOauth = Boolean(clientId && clientSecret)
  const hasApiKey = Boolean(apiKey)
  const mode = hasOauth ? 'oauth-m2m' : hasApiKey ? 'api-key' : 'none'

  return {
    tenant,
    apiKey,
    clientId,
    clientSecret,
    scope,
    hasOauth,
    hasApiKey,
    mode,
  }
}

const tokenCache = {
  accessToken: '',
  expiresAtMs: 0,
}

async function getOauthAccessToken(config) {
  const now = Date.now()
  if (tokenCache.accessToken && tokenCache.expiresAtMs - 30_000 > now) {
    return tokenCache.accessToken
  }

  const response = await fetch(`${config.tenant}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'client_credentials',
      scope: config.scope,
    }),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const reason = body?.error_description || body?.error || `OAuth token request failed (${response.status})`
    const err = new Error(reason)
    err.status = response.status
    throw err
  }

  const token = String(body?.access_token || '')
  const expiresIn = Number(body?.expires_in || 0)
  if (!token) {
    throw new Error('OAuth token response missing access_token')
  }

  tokenCache.accessToken = token
  tokenCache.expiresAtMs = now + Math.max(60, expiresIn) * 1000
  return token
}

async function getAuthHeader(config) {
  if (config.hasOauth) {
    const token = await getOauthAccessToken(config)
    return `Bearer ${token}`
  }
  if (config.hasApiKey) {
    return `Bearer ${config.apiKey}`
  }
  throw new Error('Missing auth configuration')
}

async function qlikGet(config, pathWithQuery) {
  const authorization = await getAuthHeader(config)
  const response = await fetch(`${config.tenant}${pathWithQuery}`, {
    method: 'GET',
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
    },
  })

  const text = await response.text()
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = null
  }

  if (!response.ok) {
    const error = parsed?.message || parsed?.error || response.statusText || 'Qlik request failed'
    const err = new Error(error)
    err.status = response.status
    err.details = typeof text === 'string' ? text.slice(0, 500) : ''
    throw err
  }

  return parsed == null ? text : parsed
}

function notAllowed(req, res, allow) {
  res.setHeader('Allow', allow)
  return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
}

function missingConfigPayload(config) {
  return {
    QLIK_TENANT_URL: !config.tenant,
    QLIK_OAUTH_CLIENT_ID: !config.clientId,
    QLIK_OAUTH_CLIENT_SECRET: !config.clientSecret,
    QLIK_API_KEY: !config.apiKey,
  }
}

async function handleHealth(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')

  const config = getConfig()
  const configured = Boolean(config.tenant && (config.hasOauth || config.hasApiKey))
  if (!configured) {
    return json(
      res,
      200,
      {
        ok: true,
        configured: false,
        mode: config.mode,
        missing: missingConfigPayload(config),
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  try {
    const me = await qlikGet(config, '/api/v1/users/me')
    return json(
      res,
      200,
      {
        ok: true,
        configured: true,
        mode: config.mode,
        tenant: config.tenant,
        user: me,
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        configured: true,
        mode: config.mode,
        tenant: config.tenant,
        error: e?.message || 'Qlik health check failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

function ensureConfigured(res) {
  const config = getConfig()
  const configured = Boolean(config.tenant && (config.hasOauth || config.hasApiKey))
  if (configured) return config

  json(
    res,
    501,
    {
      ok: false,
      error: 'Qlik API not configured. Set OAuth M2M vars or QLIK_API_KEY.',
      mode: config.mode,
      missing: missingConfigPayload(config),
    },
    { 'Cache-Control': 'no-store' }
  )
  return null
}

async function handleUsersMe(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  try {
    const data = await qlikGet(config, '/api/v1/users/me')
    return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(res, e?.status || 502, { ok: false, error: e?.message || 'Qlik request failed', details: e?.details || '' }, { 'Cache-Control': 'no-store' })
  }
}

async function handleItems(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const limit = parseLimit(req.query?.limit, 20)
  try {
    const data = await qlikGet(config, `/api/v1/items?limit=${limit}`)
    return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(res, e?.status || 502, { ok: false, error: e?.message || 'Qlik request failed', details: e?.details || '' }, { 'Cache-Control': 'no-store' })
  }
}

async function handleApps(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const limit = parseLimit(req.query?.limit, 20)
  try {
    const data = await qlikGet(config, `/api/v1/apps?limit=${limit}`)
    return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(res, e?.status || 502, { ok: false, error: e?.message || 'Qlik request failed', details: e?.details || '' }, { 'Cache-Control': 'no-store' })
  }
}

async function handleEngineSheets(req, res, appId) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  try {
    const data = await withEngineSession(config, appId, async (session) => {
      const result = await session.call(session.docHandle, 'GetObjects', [
        {
          qTypes: ['sheet'],
          qIncludeSessionObjects: false,
        },
      ])

      const rows = Array.isArray(result?.qList) ? result.qList : []
      return rows.map((row) => ({
        id: safeText(row?.qInfo?.qId),
        type: safeText(row?.qInfo?.qType),
        title: safeText(row?.qMeta?.title),
        description: safeText(row?.qMeta?.description),
        published: Boolean(row?.qMeta?.published),
      }))
    })

    return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Qlik Engine sheets request failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleEngineSheetObjects(req, res, appId, sheetId) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  try {
    const data = await withEngineSession(config, appId, async (session) => {
      const sheetObj = await session.call(session.docHandle, 'GetObject', [sheetId])
      const sheetHandle = Number(sheetObj?.qReturn?.qHandle || 0)
      if (!sheetHandle) throw new Error('Sheet not found')

      const sheetLayoutResult = await session.call(sheetHandle, 'GetLayout', [])
      const sheetLayout = unwrapLayout(sheetLayoutResult)
      const objectRefs = extractSheetObjectsFromLayout(sheetLayout)

      const objects = []
      for (const ref of objectRefs) {
        try {
          const objectResult = await session.call(session.docHandle, 'GetObject', [ref.id])
          const objectHandle = Number(objectResult?.qReturn?.qHandle || 0)
          if (!objectHandle) continue

          const objectLayoutResult = await session.call(objectHandle, 'GetLayout', [])
          const objectLayout = unwrapLayout(objectLayoutResult)
          const qType = safeText(objectLayout?.qInfo?.qType || ref.type)
          const qTitle = safeText(objectLayout?.qMeta?.title || objectLayout?.title)
          const qDescription = safeText(objectLayout?.qMeta?.description)
          const hasHypercube = Boolean(objectLayout?.qHyperCube)

          objects.push({
            id: ref.id,
            type: qType,
            title: qTitle,
            description: qDescription,
            hasHypercube,
          })
        } catch {
          objects.push({
            id: ref.id,
            type: ref.type,
            title: '',
            description: '',
            hasHypercube: false,
          })
        }
      }

      return objects
    })

    return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Qlik Engine sheet objects request failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleEngineObjectData(req, res, appId, objectId) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const rowLimit = parsePositiveInt(req.query?.rows, 200, 2_000)
  const colLimit = parsePositiveInt(req.query?.cols, 20, 50)

  try {
    const data = await withEngineSession(config, appId, async (session) => {
      const objectResult = await session.call(session.docHandle, 'GetObject', [objectId])
      const objectHandle = Number(objectResult?.qReturn?.qHandle || 0)
      if (!objectHandle) throw new Error('Object not found')

      const layoutResult = await session.call(objectHandle, 'GetLayout', [])
      const layout = unwrapLayout(layoutResult)
      const hypercube = layout?.qHyperCube
      if (!hypercube) {
        return {
          id: objectId,
          type: safeText(layout?.qInfo?.qType),
          title: safeText(layout?.qMeta?.title),
          hasHypercube: false,
          data: [],
        }
      }

      const qSize = hypercube?.qSize || {}
      const height = Math.max(1, Math.min(rowLimit, Number(qSize.qcy || 0) || rowLimit))
      const width = Math.max(1, Math.min(colLimit, Number(qSize.qcx || 0) || colLimit))

      const pages = await session.call(objectHandle, 'GetHyperCubeData', [
        '/qHyperCubeDef',
        [{ qTop: 0, qLeft: 0, qHeight: height, qWidth: width }],
      ])

      const matrix = Array.isArray(pages?.[0]?.qMatrix) ? pages[0].qMatrix : []
      const dimensions = Array.isArray(hypercube?.qDimensionInfo)
        ? hypercube.qDimensionInfo.map((d) => safeText(d?.qFallbackTitle || d?.qGroupFallbackTitles?.[0]))
        : []
      const measures = Array.isArray(hypercube?.qMeasureInfo)
        ? hypercube.qMeasureInfo.map((m) => safeText(m?.qFallbackTitle || m?.qLabel))
        : []

      return {
        id: objectId,
        type: safeText(layout?.qInfo?.qType),
        title: safeText(layout?.qMeta?.title),
        hasHypercube: true,
        size: {
          rows: Number(qSize.qcy || 0),
          cols: Number(qSize.qcx || 0),
        },
        dimensions,
        measures,
        data: matrix.map((row) => (Array.isArray(row) ? row.map(simplifyCell) : [])),
      }
    })

    return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Qlik Engine object data request failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleEngineObjectLayout(req, res, appId, objectId) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  try {
    const data = await withEngineSession(config, appId, async (session) => {
      const objectResult = await session.call(session.docHandle, 'GetObject', [objectId])
      const objectHandle = Number(objectResult?.qReturn?.qHandle || 0)
      if (!objectHandle) throw new Error('Object not found')

      const layoutResult = await session.call(objectHandle, 'GetLayout', [])
      const layout = unwrapLayout(layoutResult)

      const rootKeys = layout && typeof layout === 'object' ? Object.keys(layout).sort() : []
      const qExtendsId = safeText(layout?.qExtendsId)
      const qType = safeText(layout?.qInfo?.qType)
      const qTitle = safeText(layout?.qMeta?.title)
      const rawPath = safeText(req.query?.path).trim()

      function getByPath(obj, pathStr) {
        if (!obj || !pathStr) return undefined
        const parts = pathStr
          .split('.')
          .map((p) => p.trim())
          .filter(Boolean)

        let current = obj
        for (const part of parts) {
          if (current == null) return undefined

          const indexMatch = part.match(/^(.+)\[(\d+)\]$/)
          if (indexMatch) {
            const key = indexMatch[1]
            const idx = Number(indexMatch[2])
            current = current?.[key]
            if (!Array.isArray(current)) return undefined
            current = current[idx]
            continue
          }

          current = current?.[part]
        }

        return current
      }

      // Keep payload bounded but useful for debugging custom extensions.
      const compactLayout = {}
      if (layout && typeof layout === 'object') {
        for (const key of rootKeys) {
          const value = layout[key]
          if (value == null) {
            compactLayout[key] = value
            continue
          }
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            compactLayout[key] = value
            continue
          }
          if (Array.isArray(value)) {
            compactLayout[key] = {
              kind: 'array',
              length: value.length,
              sample: value.slice(0, 3),
            }
            continue
          }
          if (typeof value === 'object') {
            compactLayout[key] = {
              kind: 'object',
              keys: Object.keys(value).sort(),
            }
          }
        }
      }

      return {
        id: objectId,
        type: qType,
        title: qTitle,
        qExtendsId,
        rootKeys,
        compactLayout,
        requestedPath: rawPath || '',
        requestedValue: rawPath ? getByPath(layout, rawPath) : undefined,
      }
    })

    return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Qlik Engine object layout request failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

// Known object IDs for CREOLABS live data (discovered via Engine scan)
const CREOLABS_APP_ID = 'c6f37daa-0278-42b0-ab9b-813d2b9aafeb'
// "Previous Month" table – contains per-account PL filtered for the most recent period
// Dims: Brand, Affiliate, User, Client Name, Client ID, Client LOGIN, LOGIN, Country
// Meas col 5 = "$ PL", col 3 = "$ Deposit", col 4 = "$ WD", col 10 = "# Accounts"
const CREOLABS_APR_OBJ = '53c14348-64ce-48a2-a8c7-5fcfc983be32'
const _CREOLABS_N_DIMS = 8
const CREOLABS_COL_CLIENT_NAME = 3
const CREOLABS_COL_CLIENT_ID = 4
const CREOLABS_COL_PL = 13      // nDims(8) + measIdx(5)
const CREOLABS_COL_DEPOSIT = 11 // nDims(8) + measIdx(3)
const CREOLABS_COL_WD = 12      // nDims(8) + measIdx(4)
const CREOLABS_COL_WIDTH = 20

// Cache for CREOLABS live PL (stale-while-revalidate, TTL 15min)
let _creolabsPlCache = null // { data, fetchedAt, promise }
const CREOLABS_CACHE_TTL = 15 * 60 * 1000

function aggregateRows(matrix, byClient) {
  for (const row of matrix) {
    if (!Array.isArray(row) || row.length < CREOLABS_COL_WIDTH) continue
    const clientName = safeText(row[CREOLABS_COL_CLIENT_NAME]?.qText).trim()
    const clientId = safeText(row[CREOLABS_COL_CLIENT_ID]?.qText).trim()
    if (!clientName || clientName === '-' || clientName === 'null') continue
    const plVal = row[CREOLABS_COL_PL]?.qNum
    const depVal = row[CREOLABS_COL_DEPOSIT]?.qNum
    const wdVal = row[CREOLABS_COL_WD]?.qNum
    const key = `${clientName}|${clientId}`
    const prev = byClient.get(key) || { clientName, clientId, plLive: 0, deposit: 0, wd: 0 }
    prev.plLive += typeof plVal === 'number' && isFinite(plVal) ? plVal : 0
    prev.deposit += typeof depVal === 'number' && isFinite(depVal) ? depVal : 0
    prev.wd += typeof wdVal === 'number' && isFinite(wdVal) ? wdVal : 0
    byClient.set(key, prev)
  }
}

async function fetchCreolabsLivePlData(config) {
  return withEngineSession(config, CREOLABS_APP_ID, async (session) => {
    const objResult = await session.call(session.docHandle, 'GetObject', [CREOLABS_APR_OBJ])
    const h = Number(objResult?.qReturn?.qHandle || 0)
    if (!h) throw new Error('Creolabs live PL object not found')

    const layoutResult = await session.call(h, 'GetLayout', [])
    const layout = unwrapLayout(layoutResult)
    const cube = layout?.qHyperCube
    const totalRows = Number(cube?.qSize?.qcy || 0)
    const period = safeText(layout?.qMeta?.title || '')

    const byClient = new Map()
    const pageSize = 500
    const PARALLEL = 8

    // Build list of all page offsets
    const offsets = []
    for (let off = 0; off < totalRows; off += pageSize) offsets.push(off)

    // Fetch in parallel batches
    for (let i = 0; i < offsets.length; i += PARALLEL) {
      const batch = offsets.slice(i, i + PARALLEL)
      const results = await Promise.all(
        batch.map((offset) =>
          session.call(h, 'GetHyperCubeData', [
            '/qHyperCubeDef',
            [{ qTop: offset, qLeft: 0, qHeight: pageSize, qWidth: CREOLABS_COL_WIDTH }],
          ]).then((p) => (Array.isArray(p?.qDataPages?.[0]?.qMatrix) ? p.qDataPages[0].qMatrix : []))
        )
      )
      for (const matrix of results) aggregateRows(matrix, byClient)
    }

    return {
      period,
      fetchedRows: totalRows,
      uniqueClients: byClient.size,
      totalRows,
      clients: [...byClient.values()],
    }
  })
}

async function handleCreolabsLivePl(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const now = Date.now()
  const cacheAge = _creolabsPlCache?.fetchedAt ? now - _creolabsPlCache.fetchedAt : Infinity
  const cacheWarm = _creolabsPlCache?.data && cacheAge < CREOLABS_CACHE_TTL

  // Return stale data immediately and trigger background refresh
  if (cacheWarm) {
    return json(res, 200, { ok: true, data: { ..._creolabsPlCache.data, cached: true } }, { 'Cache-Control': 'no-store' })
  }

  // If already fetching, wait for it
  if (_creolabsPlCache?.promise) {
    try {
      const data = await _creolabsPlCache.promise
      return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
    } catch (e) {
      return json(res, e?.status || 502, { ok: false, error: e?.message || 'Creolabs live PL request failed' }, { 'Cache-Control': 'no-store' })
    }
  }

  // Start fresh fetch
  const promise = fetchCreolabsLivePlData(config).then((data) => {
    _creolabsPlCache = { data, fetchedAt: Date.now(), promise: null }
    return data
  }).catch((e) => {
    if (_creolabsPlCache) _creolabsPlCache.promise = null
    throw e
  })

  if (!_creolabsPlCache) _creolabsPlCache = { data: null, fetchedAt: 0, promise }
  else _creolabsPlCache.promise = promise

  try {
    const data = await promise
    return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(res, e?.status || 502, { ok: false, error: e?.message || 'Creolabs live PL request failed', details: e?.details || '' }, { 'Cache-Control': 'no-store' })
  }
}

// CREOLABS Clients table (5bac0559)
// Empirical column order confirmed by Engine probe 2026-05-01:
//   [0] Brand  [1] Affiliate ID  [2] Client ID  [3] Client Name
//   [4] LOGIN  [5] User          [6] Country    [7] $ Balance  [8] LTV Commission
//   [9] $ Closed PL  [10] $ Open PL  [11] # Trades
//   [12] $ FTD  [13] $ RDP  [14] $ Deposit  [15] $ WD  [16] $ Net
//   [17] Year Month
const CREOLABS_CLIENTS_OBJ = '5bac0559-4987-4961-816c-e5da8b254cfe'
const CC_BRAND = 0, CC_AFF = 1, CC_CLIENT_ID = 2, CC_CLIENT_NAME = 3
const CC_LOGIN = 4, CC_USER = 5, CC_COUNTRY = 6, CC_BALANCE = 7, CC_LTV = 8
const CC_CLOSED_PL = 9, CC_OPEN_PL = 10, CC_TRADES = 11
const CC_FTD = 12, CC_RDP = 13, CC_DEPOSIT = 14, CC_WD = 15, CC_NET = 16
const CC_YEAR_MONTH = 17, CC_WIDTH = 18

const _MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
function ymRank(text) {
  const m = String(text || '').trim().match(/^(\d{4})-([A-Za-z]{3})$/)
  return m ? Number(m[1]) * 100 + (_MON[m[2].toLowerCase()] || 0) : -1
}

let _creolabsClientsCache = null
let _creolabsSnapshotCache = null

const _creolabsClientVariantCaches = {
  full: null,
  clientMonths: null,
  affiliateMonth: null,
}

function clearCreolabsClientVariantCaches() {
  for (const key of Object.keys(_creolabsClientVariantCaches)) {
    _creolabsClientVariantCaches[key] = null
  }
  _creolabsClientsCache = null
  _creolabsSnapshotCache = null
}

function getCreolabsClientVariantOptions(variant) {
  if (variant === 'clientMonths') {
    return {
      includeClients: false,
      includeClientMonths: true,
      includeAffiliateMonth: false,
      sortClientMonths: false,
      sortAffiliateMonth: false,
    }
  }
  if (variant === 'affiliateMonth') {
    return {
      includeClients: false,
      includeClientMonths: false,
      includeAffiliateMonth: true,
      sortClientMonths: false,
      sortAffiliateMonth: false,
    }
  }
  return {
    includeClients: true,
    includeClientMonths: true,
    includeAffiliateMonth: true,
    sortClientMonths: true,
    sortAffiliateMonth: true,
  }
}

function getCreolabsClientVariantCache(variant) {
  return variant === 'full' ? _creolabsClientsCache : _creolabsClientVariantCaches[variant]
}

function setCreolabsClientVariantCache(variant, value) {
  if (variant === 'full') _creolabsClientsCache = value
  else _creolabsClientVariantCaches[variant] = value
}

function projectCreolabsVariantFromSnapshot(snapshotData, variant) {
  if (!snapshotData || typeof snapshotData !== 'object') return {}

  const base = {
    period: snapshotData.period,
    periodFrom: snapshotData.periodFrom,
    periodTo: snapshotData.periodTo,
    periods: Array.isArray(snapshotData.periods) ? snapshotData.periods : [],
    totalFetched: Number(snapshotData.totalFetched || 0),
  }

  if (variant === 'clientMonths') {
    return {
      ...base,
      clientMonths: Array.isArray(snapshotData.clientMonths) ? snapshotData.clientMonths : [],
    }
  }

  if (variant === 'affiliateMonth') {
    return {
      ...base,
      affiliateMonth: Array.isArray(snapshotData.affiliateMonth) ? snapshotData.affiliateMonth : [],
    }
  }

  return {
    ...base,
    clients: Array.isArray(snapshotData.clients) ? snapshotData.clients : [],
    clientMonths: Array.isArray(snapshotData.clientMonths) ? snapshotData.clientMonths : [],
    affiliateMonth: Array.isArray(snapshotData.affiliateMonth) ? snapshotData.affiliateMonth : [],
  }
}

async function resolveCreolabsSnapshot(config) {
  const now = Date.now()
  const age = _creolabsSnapshotCache?.fetchedAt ? now - _creolabsSnapshotCache.fetchedAt : Infinity
  if (_creolabsSnapshotCache?.data && age < CREOLABS_CACHE_TTL) {
    return { data: _creolabsSnapshotCache.data, cached: true }
  }

  if (_creolabsSnapshotCache?.promise) {
    const data = await _creolabsSnapshotCache.promise
    return { data, cached: false }
  }

  const promise = fetchCreolabsClientsData(config, {
    includeClients: true,
    includeClientMonths: true,
    includeAffiliateMonth: true,
    sortClientMonths: false,
    sortAffiliateMonth: false,
  })
    .then((data) => {
      _creolabsSnapshotCache = { data, fetchedAt: Date.now(), promise: null }
      return data
    })
    .catch((e) => {
      if (_creolabsSnapshotCache) _creolabsSnapshotCache.promise = null
      throw e
    })

  _creolabsSnapshotCache = { data: null, fetchedAt: 0, promise }
  const data = await promise
  return { data, cached: false }
}

async function fetchCreolabsClientsData(
  config,
  {
    includeClients = true,
    includeClientMonths = true,
    includeAffiliateMonth = true,
    sortClientMonths = true,
    sortAffiliateMonth = true,
  } = {}
) {
  return withEngineSession(config, CREOLABS_APP_ID, async (session) => {
    const objResult = await session.call(session.docHandle, 'GetObject', [CREOLABS_CLIENTS_OBJ])
    const h = Number(objResult?.qReturn?.qHandle || 0)
    if (!h) throw new Error('Creolabs clients object not found')

    const layoutResult = await session.call(h, 'GetLayout', [])
    const totalRows = Number(unwrapLayout(layoutResult)?.qHyperCube?.qSize?.qcy || 0)

    // Keep page size below common Qlik hypercube cell limits to avoid 502s.
    const pageSize = 500
    const PARALLEL = 8
    const offsets = []
    for (let off = 0; off < totalRows; off += pageSize) offsets.push(off)

    let minRank = Number.POSITIVE_INFINITY
    let maxRank = -1
    let periodFrom = ''
    let periodTo = ''
    const periodSet = new Set()
    let totalFetched = 0

    // Month-level datasets used by API-first consumers.
    const byClientMonth = includeClientMonths ? new Map() : null
    const byAffiliateMonth = includeAffiliateMonth ? new Map() : null

    // Key by clientId+clientName only (NOT brand) so that brand is taken from the
    // most recent period. In the all-time Qlik view some clients appear as 'BW'
    // in older periods but 'BW Global' in recent periods; keying on brand caused
    // them all to collapse to 'BW'. We now track _latestRank and overwrite brand
    // whenever we see a more recent row for the same client.
    const byKey = includeClients ? new Map() : null
    for (let i = 0; i < offsets.length; i += PARALLEL) {
      const results = await Promise.all(
        offsets.slice(i, i + PARALLEL).map((offset) =>
          session
            .call(h, 'GetHyperCubeData', [
              '/qHyperCubeDef',
              [{ qTop: offset, qLeft: 0, qHeight: pageSize, qWidth: CC_WIDTH }],
            ])
            .then((p) => p?.qDataPages?.[0]?.qMatrix || [])
        )
      )

      for (const matrix of results) {
        totalFetched += Array.isArray(matrix) ? matrix.length : 0
        for (const row of matrix || []) {
          if (!Array.isArray(row) || row.length < CC_WIDTH) continue

          const ym = safeText(row[CC_YEAR_MONTH]?.qText).trim()
          const rank = ymRank(ym)
          if (rank > 0) {
            periodSet.add(ym)
            if (rank < minRank) {
              minRank = rank
              periodFrom = ym
            }
            if (rank > maxRank) {
              maxRank = rank
              periodTo = ym
            }
          }

          const brand = safeText(row[CC_BRAND]?.qText).trim()
          const clientId = safeText(row[CC_CLIENT_ID]?.qText).trim()
          const clientName = safeText(row[CC_CLIENT_NAME]?.qText).trim()
          if (!clientName || clientName === '-' || clientName === 'null') continue

          const affiliateId = safeText(row[CC_AFF]?.qText).trim()
          const clientLogin = safeText(row[CC_LOGIN]?.qText).trim()
          const user = safeText(row[CC_USER]?.qText).trim()
          const country = safeText(row[CC_COUNTRY]?.qText).trim()
          const n = (idx) => {
            const v = row[idx]?.qNum
            return typeof v === 'number' && isFinite(v) ? v : 0
          }

          if (includeClientMonths && ym) {
            const clientMonthKey = `${brand}|${affiliateId}|${clientId}|${ym}`
            if (!byClientMonth.has(clientMonthKey)) {
              byClientMonth.set(clientMonthKey, {
                periodId: ym,
                brand,
                affiliateId,
                clientId,
                clientName,
                clientLogin,
                user,
                country,
                balance: 0,
                commission: 0,
                pl: 0,
                openPl: 0,
                trades: 0,
                ftd: 0,
                rdp: 0,
                deposit: 0,
                wd: 0,
                net: 0,
              })
            }

            const cm = byClientMonth.get(clientMonthKey)
            const bal = n(CC_BALANCE)
            if (bal > Number(cm.balance || 0)) cm.balance = bal
            cm.commission += n(CC_LTV)
            cm.pl += n(CC_CLOSED_PL)
            cm.openPl += n(CC_OPEN_PL)
            cm.trades += Math.round(n(CC_TRADES))
            cm.ftd += n(CC_FTD)
            cm.rdp += n(CC_RDP)
            cm.deposit += n(CC_DEPOSIT)
            cm.wd += n(CC_WD)
            cm.net += n(CC_NET)
          }

          if (includeAffiliateMonth && ym) {
            const affiliateMonthKey = `${brand}|${affiliateId}|${ym}`
            if (!byAffiliateMonth.has(affiliateMonthKey)) {
              byAffiliateMonth.set(affiliateMonthKey, {
                periodId: ym,
                brand,
                affiliateId,
                net: 0,
                pl: 0,
                commission: 0,
                balance: 0,
              })
            }
            const am = byAffiliateMonth.get(affiliateMonthKey)
            am.net += n(CC_NET)
            am.pl += n(CC_CLOSED_PL)
            am.commission += n(CC_LTV)
            am.balance += n(CC_BALANCE)
          }

          if (includeClients) {
            const key = `${clientId}|${clientName}`
            if (!byKey.has(key)) {
              byKey.set(key, {
                brand,
                clientId,
                clientName,
                affiliateId,
                user,
                country,
                balance: 0,
                closedPl: 0,
                openPl: 0,
                trades: 0,
                ftd: 0,
                rdp: 0,
                deposit: 0,
                wd: 0,
                net: 0,
                _latestRank: rank,
              })
            }

            const client = byKey.get(key)
            if (rank > client._latestRank) {
              client._latestRank = rank
              client.brand = brand
              client.affiliateId = affiliateId
              client.user = user
              client.country = country
            }

            client.closedPl += n(CC_CLOSED_PL)
            client.openPl += n(CC_OPEN_PL)
            client.trades += Math.round(n(CC_TRADES))
            client.ftd += n(CC_FTD)
            client.rdp += n(CC_RDP)
            client.deposit += n(CC_DEPOSIT)
            client.wd += n(CC_WD)
            client.net += n(CC_NET)
            const bal = n(CC_BALANCE)
            if (bal !== 0) client.balance = bal
          }
        }
      }
    }

    // Strip internal tracking field before returning
    if (includeClients) {
      for (const client of byKey.values()) delete client._latestRank
    }

    const periods = [...periodSet].sort((a, b) => ymRank(a) - ymRank(b))
    const data = {
      period: 'ALL',
      periodFrom,
      periodTo,
      periods,
      totalFetched,
    }

    if (includeClients) data.clients = [...byKey.values()]
    if (includeClientMonths) {
      const clientMonths = [...byClientMonth.values()]
      if (sortClientMonths) {
        clientMonths.sort((a, b) => {
          const ra = ymRank(a?.periodId)
          const rb = ymRank(b?.periodId)
          if (ra !== rb) return ra - rb
          const aa = safeText(a?.affiliateId)
          const ab = safeText(b?.affiliateId)
          if (aa !== ab) return aa.localeCompare(ab)
          const ba = safeText(a?.brand)
          const bb = safeText(b?.brand)
          if (ba !== bb) return ba.localeCompare(bb)
          return safeText(a?.clientId).localeCompare(safeText(b?.clientId))
        })
      }
      data.clientMonths = clientMonths
    }
    if (includeAffiliateMonth) {
      const affiliateMonth = [...byAffiliateMonth.values()]
      if (sortAffiliateMonth) {
        affiliateMonth.sort((a, b) => {
          const ra = ymRank(a?.periodId)
          const rb = ymRank(b?.periodId)
          if (ra !== rb) return ra - rb
          const aa = safeText(a?.affiliateId)
          const ab = safeText(b?.affiliateId)
          if (aa !== ab) return aa.localeCompare(ab)
          return safeText(a?.brand).localeCompare(safeText(b?.brand))
        })
      }
      data.affiliateMonth = affiliateMonth
    }

    return data
  })
}

async function resolveCreolabsClientVariant(config, variant) {
  const cacheEntry = getCreolabsClientVariantCache(variant)
  const now = Date.now()
  const age = cacheEntry?.fetchedAt ? now - cacheEntry.fetchedAt : Infinity
  if (cacheEntry?.data && age < CREOLABS_CACHE_TTL) {
    return { data: cacheEntry.data, cached: true }
  }

  if (cacheEntry?.promise) {
    const data = await cacheEntry.promise
    return { data, cached: false }
  }

  const promise = resolveCreolabsSnapshot(config)
    .then((snapshot) => projectCreolabsVariantFromSnapshot(snapshot.data, variant))
    .then((data) => {
      setCreolabsClientVariantCache(variant, { data, fetchedAt: Date.now(), promise: null })
      return data
    })
    .catch((e) => {
      const current = getCreolabsClientVariantCache(variant)
      if (current) current.promise = null
      throw e
    })

  const nextCacheValue = { data: null, fetchedAt: 0, promise }
  setCreolabsClientVariantCache(variant, nextCacheValue)

  const data = await promise
  return { data, cached: false }
}

async function handleCreolabsClientVariant(req, res, variant, failureMessage) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  try {
    const { data, cached } = await resolveCreolabsClientVariant(config, variant)
    return json(res, 200, { ok: true, data: { ...data, cached } }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      { ok: false, error: e?.message || failureMessage, details: e?.details || '' },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleCreolabsClients(req, res) {
  return handleCreolabsClientVariant(req, res, 'full', 'Creolabs clients request failed')
}

/**
 * GET /api/qlik/creolabs/client-lists?days=30
 *
 * Returns 3 deduplicated client lists per brand (BW, BW Global) for the
 * rolling window of the last `days` calendar days (default 30).
 *
 * Because data is month-granular, any month whose end-of-month falls on or
 * after the cutoff date is included (e.g. for May 5 with days=30 → Apr+May).
 *
 * Lists:
 *   deposited  – clients with deposit > 0 in the window
 *   withdrawn  – clients with wd > 0 in the window
 *   inProfit   – clients with (closedPl + openPl) > 0 in the window
 */
async function handleCreolabsClientLists(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  const rawDays = urlObj.searchParams.get('days')
  const days = parsePositiveInt(rawDays, 30, 365)

  try {
    const { data, cached } = await resolveCreolabsClientVariant(config, 'clientMonths')
    const clientMonths = Array.isArray(data?.clientMonths) ? data.clientMonths : []

    // Determine which periodIds fall within the last `days` days.
    const now = new Date()
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    // Include any month whose last day >= cutoff → month rank >= cutoff month rank.
    const cutoffRank = cutoff.getFullYear() * 100 + (cutoff.getMonth() + 1)

    // Collect period labels that are in range (for metadata).
    const periodsInRange = new Set()
    let minRankFound = Number.POSITIVE_INFINITY
    let maxRankFound = -1

    // Aggregate per brand+clientId over the filtered months.
    const byBrandClient = new Map()

    for (const row of clientMonths) {
      const periodId = normalizeText(row?.periodId)
      const rank = ymRank(periodId)
      if (rank < cutoffRank) continue // outside window

      periodsInRange.add(periodId)
      if (rank < minRankFound) minRankFound = rank
      if (rank > maxRankFound) maxRankFound = rank

      const brand = normalizeText(row?.brand)
      if (!brand) continue

      const clientId = normalizeText(row?.clientId)
      const clientName = normalizeText(row?.clientName)
      if (!clientId && !clientName) continue

      const mapKey = `${brand}|${clientId}|${clientName}`
      if (!byBrandClient.has(mapKey)) {
        byBrandClient.set(mapKey, {
          brand,
          clientId,
          clientName,
          clientLogin: normalizeText(row?.clientLogin),
          affiliateId: normalizeText(row?.affiliateId),
          country: normalizeText(row?.country),
          deposit: 0,
          wd: 0,
          closedPl: 0,
          openPl: 0,
          trades: 0,
        })
      }

      const agg = byBrandClient.get(mapKey)
      agg.deposit += toFiniteNumber(row?.deposit)
      agg.wd += toFiniteNumber(row?.wd)
      agg.closedPl += toFiniteNumber(row?.pl)
      agg.openPl += toFiniteNumber(row?.openPl)
      agg.trades += Math.round(toFiniteNumber(row?.trades))
      // Keep most recent login/country/affiliate in case they changed.
      if (normalizeText(row?.clientLogin)) agg.clientLogin = normalizeText(row?.clientLogin)
      if (normalizeText(row?.country)) agg.country = normalizeText(row?.country)
      if (normalizeText(row?.affiliateId)) agg.affiliateId = normalizeText(row?.affiliateId)
    }

    // Build per-brand lists.
    const result = {}
    for (const agg of byBrandClient.values()) {
      const b = agg.brand
      if (!result[b]) {
        result[b] = { deposited: [], withdrawn: [], inProfit: [] }
      }

      // Strip internal brand field from the client object.
      const client = {
        clientId: agg.clientId,
        clientName: agg.clientName,
        clientLogin: agg.clientLogin,
        affiliateId: agg.affiliateId,
        country: agg.country,
        deposit: agg.deposit,
        wd: agg.wd,
        closedPl: agg.closedPl,
        openPl: agg.openPl,
        trades: agg.trades,
      }

      if (agg.deposit > 0) result[b].deposited.push(client)
      if (agg.wd > 0) result[b].withdrawn.push(client)
      if (agg.closedPl + agg.openPl > 0) result[b].inProfit.push(client)
    }

    // Sort each list by the primary metric descending for easier consumption.
    for (const brand of Object.keys(result)) {
      result[brand].deposited.sort((a, b) => b.deposit - a.deposit)
      result[brand].withdrawn.sort((a, b) => b.wd - a.wd)
      result[brand].inProfit.sort((a, b) => (b.closedPl + b.openPl) - (a.closedPl + a.openPl))
    }

    // Periods metadata (sorted ascending).
    const periods = [...periodsInRange].sort((a, b) => ymRank(a) - ymRank(b))
    const fromPeriod = minRankFound !== Number.POSITIVE_INFINITY ? periods[0] : null
    const toPeriod = periods.length ? periods[periods.length - 1] : null

    return json(
      res,
      200,
      {
        ok: true,
        data: {
          days,
          cutoffDate: cutoff.toISOString().slice(0, 10),
          fromPeriod,
          toPeriod,
          periods,
          brands: result,
          cached,
        },
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      { ok: false, error: e?.message || 'Creolabs client-lists request failed', details: e?.details || '' },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleCreolabsClientMonths(req, res) {
  return handleCreolabsClientVariant(req, res, 'clientMonths', 'Creolabs client-months request failed')
}

async function handleCreolabsAffiliateMonth(req, res) {
  return handleCreolabsClientVariant(req, res, 'affiliateMonth', 'Creolabs affiliate-month request failed')
}

function normalizeText(value) {
  return String(value == null ? '' : value).trim()
}

function toFiniteNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function aggregateClientMonthKpis(rows) {
  const byClient = new Set()
  const k = {
    rows: 0,
    uniqueClients: 0,
    deposit: 0,
    wd: 0,
    net: 0,
    closedPl: 0,
    openPl: 0,
    commission: 0,
    balance: 0,
    trades: 0,
    ftd: 0,
    rdp: 0,
  }

  for (const row of rows || []) {
    const clientId = normalizeText(row?.clientId)
    if (clientId) byClient.add(clientId)

    k.rows += 1
    k.deposit += toFiniteNumber(row?.deposit)
    k.wd += toFiniteNumber(row?.wd)
    k.net += toFiniteNumber(row?.net)
    k.closedPl += toFiniteNumber(row?.pl)
    k.openPl += toFiniteNumber(row?.openPl)
    k.commission += toFiniteNumber(row?.commission)
    k.balance += toFiniteNumber(row?.balance)
    k.trades += toFiniteNumber(row?.trades)
    k.ftd += toFiniteNumber(row?.ftd)
    k.rdp += toFiniteNumber(row?.rdp)
  }

  k.uniqueClients = byClient.size
  return k
}

function buildKpiValidationChecks(kpi) {
  const derivedNet = Number(kpi.deposit) - Number(kpi.wd)
  const netDelta = Math.abs(derivedNet - Number(kpi.net))

  const checks = [
    {
      id: 'rows_non_negative',
      passed: Number(kpi.rows) >= 0,
      detail: `rows=${kpi.rows}`,
    },
    {
      id: 'clients_non_negative',
      passed: Number(kpi.uniqueClients) >= 0,
      detail: `uniqueClients=${kpi.uniqueClients}`,
    },
    {
      id: 'net_matches_deposit_minus_wd',
      passed: netDelta < 0.01,
      detail: `net=${kpi.net.toFixed(2)} vs deposit-wd=${derivedNet.toFixed(2)} (delta=${netDelta.toFixed(4)})`,
    },
  ]

  return {
    pass: checks.every((c) => c.passed),
    checks,
  }
}

function buildCreolabsAnalytics(rows, { topN = 20 } = {}) {
  const annual = new Map()
  const monthly = new Map()
  const byClient = new Map()

  for (const row of rows || []) {
    const periodId = normalizeText(row?.periodId || row?.yearMonth)
    const year = /^\d{4}/.test(periodId) ? periodId.slice(0, 4) : 'unknown'
    const brand = normalizeText(row?.brand)
    const clientId = normalizeText(row?.clientId)
    const clientName = normalizeText(row?.clientName)

    const dep = toFiniteNumber(row?.deposit)
    const wd = toFiniteNumber(row?.wd)
    const net = toFiniteNumber(row?.net)
    const pl = toFiniteNumber(row?.pl)
    const openPl = toFiniteNumber(row?.openPl)
    const bal = toFiniteNumber(row?.balance)
    const commission = toFiniteNumber(row?.commission)
    const trades = toFiniteNumber(row?.trades)
    const ftd = toFiniteNumber(row?.ftd)
    const rdp = toFiniteNumber(row?.rdp)

    if (!annual.has(year)) {
      annual.set(year, {
        year,
        rows: 0,
        uniqueClients: new Set(),
        deposit: 0,
        wd: 0,
        net: 0,
        closedPl: 0,
        openPl: 0,
        balance: 0,
        commission: 0,
        trades: 0,
        ftd: 0,
        rdp: 0,
      })
    }
    const y = annual.get(year)
    y.rows += 1
    if (clientId) y.uniqueClients.add(clientId)
    y.deposit += dep
    y.wd += wd
    y.net += net
    y.closedPl += pl
    y.openPl += openPl
    y.balance += bal
    y.commission += commission
    y.trades += trades
    y.ftd += ftd
    y.rdp += rdp

    if (!monthly.has(periodId)) {
      monthly.set(periodId, {
        periodId,
        year,
        rows: 0,
        uniqueClients: new Set(),
        deposit: 0,
        wd: 0,
        net: 0,
        closedPl: 0,
        openPl: 0,
        balance: 0,
        commission: 0,
        trades: 0,
        ftd: 0,
        rdp: 0,
      })
    }
    const m = monthly.get(periodId)
    m.rows += 1
    if (clientId) m.uniqueClients.add(clientId)
    m.deposit += dep
    m.wd += wd
    m.net += net
    m.closedPl += pl
    m.openPl += openPl
    m.balance += bal
    m.commission += commission
    m.trades += trades
    m.ftd += ftd
    m.rdp += rdp

    if (clientId) {
      if (!byClient.has(clientId)) {
        byClient.set(clientId, {
          clientId,
          clientName,
          brand,
          rows: 0,
          periods: new Set(),
          deposit: 0,
          wd: 0,
          net: 0,
          closedPl: 0,
          openPl: 0,
          balance: 0,
          commission: 0,
          trades: 0,
          ftd: 0,
          rdp: 0,
        })
      }
      const c = byClient.get(clientId)
      c.rows += 1
      if (periodId) c.periods.add(periodId)
      c.clientName = clientName || c.clientName
      c.brand = brand || c.brand
      c.deposit += dep
      c.wd += wd
      c.net += net
      c.closedPl += pl
      c.openPl += openPl
      c.balance = bal !== 0 ? bal : c.balance
      c.commission += commission
      c.trades += trades
      c.ftd += ftd
      c.rdp += rdp
    }
  }

  const normalizeAgg = (item) => ({
    ...item,
    uniqueClients: item.uniqueClients.size,
  })

  const annualRows = [...annual.values()]
    .map(normalizeAgg)
    .sort((a, b) => Number(a.year) - Number(b.year))

  const monthlyRows = [...monthly.values()]
    .map(normalizeAgg)
    .sort((a, b) => ymRank(a.periodId) - ymRank(b.periodId))

  const rankingRows = [...byClient.values()].map((c) => ({
    ...c,
    periods: c.periods.size,
  }))

  const pickTop = (key) =>
    [...rankingRows]
      .sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))
      .slice(0, Math.max(1, topN))

  return {
    annual: annualRows,
    monthly: monthlyRows,
    weekly: [],
    rankings: {
      topNet: pickTop('net'),
      topClosedPl: pickTop('closedPl'),
      topTrades: pickTop('trades'),
      topDeposit: pickTop('deposit'),
    },
    weeklyNote:
      'Weekly aggregates are unavailable from this source because CREOLABS clients data is month-grain only (Year Month).',
  }
}

async function handleCreolabsAnalytics(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  const brandFilter = normalizeText(urlObj.searchParams.get('brand'))
  const yearFilter = normalizeText(urlObj.searchParams.get('year'))
  const topN = Math.max(5, Math.min(200, Number(urlObj.searchParams.get('top') || 20)))

  let baseData = null
  try {
    const resolved = await resolveCreolabsClientVariant(config, 'clientMonths')
    baseData = resolved.data
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Creolabs analytics request failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const sourceRows = Array.isArray(baseData?.clientMonths) ? baseData.clientMonths : []
  const filteredRows = sourceRows.filter((row) => {
    const brandOk = !brandFilter || normalizeText(row?.brand) === brandFilter
    const periodId = normalizeText(row?.periodId || row?.yearMonth)
    const year = /^\d{4}/.test(periodId) ? periodId.slice(0, 4) : ''
    const yearOk = !yearFilter || year === yearFilter
    return brandOk && yearOk
  })

  const analytics = buildCreolabsAnalytics(filteredRows, { topN })

  return json(
    res,
    200,
    {
      ok: true,
      data: {
        filters: {
          brand: brandFilter || null,
          year: yearFilter || null,
          top: topN,
        },
        sourceRows: sourceRows.length,
        filteredRows: filteredRows.length,
        periodFrom: normalizeText(baseData?.periodFrom),
        periodTo: normalizeText(baseData?.periodTo),
        analytics,
      },
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleCreolabsKpis(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  const brandFilter = normalizeText(urlObj.searchParams.get('brand'))
  const periodFilter = normalizeText(urlObj.searchParams.get('period'))

  let baseData = null
  try {
    baseData = (await resolveCreolabsClientVariant(config, 'clientMonths')).data
  } catch (e) {
    return json(res, e?.status || 502, { ok: false, error: e?.message || 'Creolabs KPI request failed', details: e?.details || '' }, { 'Cache-Control': 'no-store' })
  }

  const sourceRows = Array.isArray(baseData?.clientMonths) ? baseData.clientMonths : []
  const filteredRows = sourceRows.filter((row) => {
    const brandOk = !brandFilter || normalizeText(row?.brand) === brandFilter
    const periodValue = normalizeText(row?.periodId || row?.yearMonth)
    const periodOk = !periodFilter || periodValue === periodFilter
    return brandOk && periodOk
  })

  const kpis = aggregateClientMonthKpis(filteredRows)
  const validation = buildKpiValidationChecks(kpis)

  return json(
    res,
    200,
    {
      ok: true,
      data: {
        filters: {
          brand: brandFilter || null,
          period: periodFilter || null,
        },
        basePeriodFrom: normalizeText(baseData?.periodFrom),
        basePeriodTo: normalizeText(baseData?.periodTo),
        sourceRows: sourceRows.length,
        filteredRows: filteredRows.length,
        kpis,
        validation,
        cached: Boolean(baseData?.cached),
      },
    },
    { 'Cache-Control': 'no-store' }
  )
}

/**
 * Aggregates clientMonths snapshot into one row per unique client.
 * Includes lastPeriodId and firstPeriodId so the frontend can compute recency
 * and activeMonths without needing the full month-grain dump.
 */
function buildCreolabsClientScores(rows) {
  const byClient = new Map()

  for (const row of rows || []) {
    const clientId = normalizeText(row?.clientId)
    if (!clientId) continue

    const periodId = normalizeText(row?.periodId)
    const brand = normalizeText(row?.brand)
    const clientName = normalizeText(row?.clientName)
    const affiliateId = normalizeText(row?.affiliateId)
    const clientLogin = normalizeText(row?.clientLogin)
    const user = normalizeText(row?.user)
    const country = normalizeText(row?.country)

    const dep = toFiniteNumber(row?.deposit)
    const wd = toFiniteNumber(row?.wd)
    const net = toFiniteNumber(row?.net)
    const pl = toFiniteNumber(row?.pl)
    const openPl = toFiniteNumber(row?.openPl)
    const bal = toFiniteNumber(row?.balance)
    const commission = toFiniteNumber(row?.commission)
    const trades = Math.round(toFiniteNumber(row?.trades))
    const ftd = toFiniteNumber(row?.ftd)
    const rdp = toFiniteNumber(row?.rdp)

    if (!byClient.has(clientId)) {
      byClient.set(clientId, {
        clientId,
        clientName,
        brand,
        affiliateId,
        clientLogin,
        user,
        country,
        deposit: 0,
        wd: 0,
        net: 0,
        closedPl: 0,
        openPl: 0,
        balance: 0,
        commission: 0,
        trades: 0,
        ftd: 0,
        rdp: 0,
        activeMonths: 0,
        firstPeriodId: '',
        lastPeriodId: '',
        _periods: new Set(),
        _latestRank: 0,
      })
    }

    const c = byClient.get(clientId)

    // Keep brand/meta from most recent period
    const rank = typeof ymRank === 'function' ? ymRank(periodId) : 0
    if (rank > c._latestRank) {
      c._latestRank = rank
      c.brand = brand || c.brand
      c.affiliateId = affiliateId || c.affiliateId
      c.user = user || c.user
      c.country = country || c.country
    }

    // Update name if longer
    if ((clientName || '').length > c.clientName.length) c.clientName = clientName

    c.deposit += dep
    c.wd += wd
    c.net += net
    c.closedPl += pl
    c.openPl += openPl
    if (bal !== 0) c.balance = bal // last non-zero wins
    c.commission += commission
    c.trades += trades
    c.ftd += ftd
    c.rdp += rdp

    if (periodId) {
      c._periods.add(periodId)
      // Track first and last period for recency computation
      if (!c.firstPeriodId || (typeof ymRank === 'function' ? ymRank(periodId) < ymRank(c.firstPeriodId) : false)) {
        c.firstPeriodId = periodId
      }
      if (!c.lastPeriodId || (typeof ymRank === 'function' ? ymRank(periodId) > ymRank(c.lastPeriodId) : false)) {
        c.lastPeriodId = periodId
      }
    }
  }

  return [...byClient.values()].map((c) => {
    const activeMonths = c._periods.size
    // eslint-disable-next-line no-unused-vars
    const { _periods, _latestRank, ...rest } = c
    return { ...rest, activeMonths }
  })
}

async function handleCreolabsClientScores(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  const brandFilter = normalizeText(urlObj.searchParams.get('brand'))

  let baseData = null
  try {
    const resolved = await resolveCreolabsClientVariant(config, 'clientMonths')
    baseData = resolved.data
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Creolabs client-scores request failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const sourceRows = Array.isArray(baseData?.clientMonths) ? baseData.clientMonths : []
  const filteredRows = brandFilter
    ? sourceRows.filter((r) => normalizeText(r?.brand) === brandFilter)
    : sourceRows

  const scores = buildCreolabsClientScores(filteredRows)

  return json(
    res,
    200,
    {
      ok: true,
      data: {
        filters: { brand: brandFilter || null },
        sourceRows: sourceRows.length,
        filteredRows: filteredRows.length,
        clientCount: scores.length,
        periodFrom: normalizeText(baseData?.periodFrom),
        periodTo: normalizeText(baseData?.periodTo),
        periods: Array.isArray(baseData?.periods) ? baseData.periods : [],
        totalFetched: Number(baseData?.totalFetched || 0),
        cached: Boolean(baseData?.cached),
        scores,
      },
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function routeQlik(req, res, parts) {
  const head = parts[0] || ''

  if (!head || head === 'health') return handleHealth(req, res)
  if (head === 'users' && parts[1] === 'me') return handleUsersMe(req, res)
  if (head === 'items') return handleItems(req, res)
  if (head === 'apps') return handleApps(req, res)

  // Creolabs live PL comparison route
  if (head === 'creolabs' && parts[1] === 'live-pl') {
    return handleCreolabsLivePl(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'clients') {
    return handleCreolabsClients(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'client-months') {
    return handleCreolabsClientMonths(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'affiliate-month') {
    return handleCreolabsAffiliateMonth(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'kpis') {
    return handleCreolabsKpis(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'analytics') {
    return handleCreolabsAnalytics(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'client-scores') {
    return handleCreolabsClientScores(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'client-lists') {
    return handleCreolabsClientLists(req, res)
  }

  if (head === 'engine' && parts[1] === 'apps' && parts[2] && parts[3] === 'sheets' && !parts[4]) {
    return handleEngineSheets(req, res, parts[2])
  }

  if (
    head === 'engine' &&
    parts[1] === 'apps' &&
    parts[2] &&
    parts[3] === 'sheets' &&
    parts[4] &&
    parts[5] === 'objects'
  ) {
    return handleEngineSheetObjects(req, res, parts[2], parts[4])
  }

  if (
    head === 'engine' &&
    parts[1] === 'apps' &&
    parts[2] &&
    parts[3] === 'objects' &&
    parts[4] &&
    parts[5] === 'data'
  ) {
    return handleEngineObjectData(req, res, parts[2], parts[4])
  }

  if (
    head === 'engine' &&
    parts[1] === 'apps' &&
    parts[2] &&
    parts[3] === 'objects' &&
    parts[4] &&
    parts[5] === 'layout'
  ) {
    return handleEngineObjectLayout(req, res, parts[2], parts[4])
  }

  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeQlik,
}

// Auto-prefetch CREOLABS live PL on module load so the cache is warm before first user request
setTimeout(() => {
  const config = getConfig()
  if (!config.hasApiKey && !config.hasOauth) return
  fetchCreolabsLivePlData(config)
    .then((data) => {
      _creolabsPlCache = { data, fetchedAt: Date.now(), promise: null }
    })
    .catch(() => {
      // silently ignore prefetch errors; the next user request will retry
    })
}, 500) // short delay to let the server finish booting

setTimeout(() => {
  const config = getConfig()
  if (!config.hasApiKey && !config.hasOauth) return
  resolveCreolabsClientVariant(config, 'clientMonths')
    .catch(() => {})
}, 1500)
