const { json } = require('./_http')
const WebSocket = require('ws')

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
      15_000,
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
      15_000,
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
  const qItems = Array.isArray(layout?.qChildList?.qItems) ? layout.qChildList.qItems : []
  const fromChildren = qItems
    .map((item) => ({
      id: safeText(item?.qInfo?.qId).trim(),
      type: safeText(item?.qInfo?.qType).trim(),
    }))
    .filter((item) => item.id)

  const cells = Array.isArray(layout?.cells) ? layout.cells : []
  const fromCells = cells
    .map((cell) => ({
      id: safeText(cell?.name || cell?.qName).trim(),
      type: '',
    }))
    .filter((item) => item.id)

  const map = new Map()
  for (const entry of [...fromChildren, ...fromCells]) {
    const prev = map.get(entry.id)
    if (!prev) {
      map.set(entry.id, entry)
      continue
    }
    if (!prev.type && entry.type) {
      map.set(entry.id, entry)
    }
  }

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

async function routeQlik(req, res, parts) {
  const head = parts[0] || ''

  if (!head || head === 'health') return handleHealth(req, res)
  if (head === 'users' && parts[1] === 'me') return handleUsersMe(req, res)
  if (head === 'items') return handleItems(req, res)
  if (head === 'apps') return handleApps(req, res)

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

  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeQlik,
}
