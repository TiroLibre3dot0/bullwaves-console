const { json } = require('./_http')
const WebSocket = require('ws')
const fs = require('fs')
const path = require('path')

function parsePositiveInt(rawValue, fallback, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(rawValue)
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.min(max, Math.max(1, Math.trunc(value)))
}

function parseNonNegativeInt(rawValue, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const value = Number(rawValue)
  if (!Number.isFinite(value) || value < 0) return fallback
  return Math.min(max, Math.max(0, Math.trunc(value)))
}

function parseLimit(rawValue, fallback = 20) {
  return parsePositiveInt(rawValue, fallback, 100)
}

function env(name, fallback = '') {
  const value = process.env?.[name]
  if (value == null) return fallback
  return String(value)
}

function safeText(value) {
  if (value == null) return ''
  return String(value)
}

const ENGINE_CONNECT_TIMEOUT_MS = 30_000
const ENGINE_CALL_TIMEOUT_MS = 120_000
const REGISTERED_LEADS_OBJECT_TIMEOUT_MS = parsePositiveInt(env('REGISTERED_LEADS_OBJECT_TIMEOUT_MS'), 120_000, 300_000)
const REGISTERED_LEADS_PAGE_SIZE = parsePositiveInt(env('REGISTERED_LEADS_PAGE_SIZE'), 250, 1000)
const REGISTERED_LEADS_PAGE_PARALLEL = parsePositiveInt(env('REGISTERED_LEADS_PAGE_PARALLEL'), 1, 6)
const DB_LIVE_INGEST_INTERVAL_MS = parsePositiveInt(env('DB_LIVE_INGEST_INTERVAL_MS'), 15 * 60 * 1000, 24 * 60 * 60 * 1000)
const DB_LIVE_LOOKBACK_DAYS = 7
const DB_LIVE_STALE_LOOKBACK_DAYS = 14
const DB_LIVE_RECOVERY_LOOKBACK_DAYS = 30
const DB_LIVE_BOOTSTRAP_FROM = '2024-01-01'
const DB_LIVE_RUNS_HISTORY_MAX = 40
const DB_LIVE_STORE_USERS_MAX = 200_000
const DB_LIVE_INGEST_CONTROL_WINDOW_MS = 5 * 60 * 1000
const DB_LIVE_INGEST_CONTROL_MAX_ACTIONS = 6
const DB_LIVE_AUDIT_LOG_MAX_BYTES = 2 * 1024 * 1024
const DB_LIVE_IDENTITY_MISSING_WARN_RATIO = 0.01
const DB_LIVE_UNMAPPED_LABEL = 'UNMAPPED'
const DB_LIVE_MIN_SAFE_USERS = parsePositiveInt(env('DB_LIVE_MIN_SAFE_USERS'), 5_000, 500_000)
const CREOLABS_NATIVE_API_URL = env('CREOLABS_NATIVE_API_URL')
const CREOLABS_NATIVE_API_KEY = env('CREOLABS_NATIVE_API_KEY')
const CREOLABS_NATIVE_PAGE_LIMIT = 50_000
const CREOLABS_NATIVE_FETCH_TIMEOUT_MS = parsePositiveInt(env('CREOLABS_NATIVE_FETCH_TIMEOUT_MS'), 45_000, 180_000)
const CREOLABS_NATIVE_SYNC_PAGE_SIZE = parsePositiveInt(env('CREOLABS_NATIVE_SYNC_PAGE_SIZE'), 10_000, CREOLABS_NATIVE_PAGE_LIMIT)
const CREOLABS_NATIVE_SYNC_MAX_PAGES = parsePositiveInt(env('CREOLABS_NATIVE_SYNC_MAX_PAGES'), 500, 5000)
const DB_NATIVE_MAX_STALE_MS = parsePositiveInt(env('DB_NATIVE_MAX_STALE_MS'), 60 * 60 * 1000, 24 * 60 * 60 * 1000)
const DB_NATIVE_AUTO_REFRESH_INTERVAL_MS = parsePositiveInt(env('DB_NATIVE_AUTO_REFRESH_INTERVAL_MS'), 6 * 60 * 60 * 1000, 48 * 60 * 60 * 1000)
const DB_NATIVE_CONTRACT_VERSION = 'db-native-v1.0'
const DB_NATIVE_REPORT_COLUMNS = Object.freeze([
  Object.freeze({ key: 'affiliate_id', apiField: 'affiliateId', label: 'Affiliate ID', type: 'text' }),
  Object.freeze({ key: 'client_id', apiField: 'clientId', label: 'Client ID', type: 'text' }),
  Object.freeze({ key: 'client_name', apiField: 'clientName', label: 'Client Name', type: 'text' }),
  Object.freeze({ key: 'client_login', apiField: 'clientLogin', label: 'Client LOGIN', type: 'text' }),
  Object.freeze({ key: 'user', apiField: 'user', label: 'User', type: 'text' }),
  Object.freeze({ key: 'country', apiField: 'country', label: 'Country', type: 'text' }),
  Object.freeze({ key: 'date', apiField: 'date', fallbackApiField: 'clientTimestamp', label: 'DATE', type: 'date' }),
  Object.freeze({ key: 'balance', apiField: 'balance', label: '$ Balance', type: 'money' }),
  Object.freeze({ key: 'ltv_commission', apiField: 'commission', label: 'LTV Commission', type: 'money' }),
  Object.freeze({ key: 'closed_pl', apiField: 'closedPl', label: '$ Closed PL', type: 'money' }),
  Object.freeze({ key: 'open_pl', apiField: 'openPl', label: '$ Open PL', type: 'money' }),
  Object.freeze({ key: 'trades', apiField: 'trades', label: '# Trades', type: 'int' }),
  Object.freeze({ key: 'ftd', apiField: 'ftd', label: '$ FTD', type: 'money' }),
  Object.freeze({ key: 'rdp', apiField: 'rdp', label: '$ RDP', type: 'money' }),
  Object.freeze({ key: 'deposit', apiField: 'deposit', label: '$ Deposit', type: 'money' }),
  Object.freeze({ key: 'wd', apiField: 'wd', label: '$ WD', type: 'money' }),
  Object.freeze({ key: 'net', apiField: 'net', label: '$ Net', type: 'money' }),
  Object.freeze({ key: 'equity', apiField: 'equity', label: '$ Equity', type: 'money' }),
])
const QLIK_DYNAMIC_CACHE_TTL_MS = 15 * 60 * 1000
const QLIK_DYNAMIC_ENGINE_PAGE_SIZE = 500
const QLIK_DYNAMIC_MAX_CACHE_ITEMS = 120

function normalizeTenantUrl(raw) {
  const value = String(raw || '').trim().replace(/\/+$/, '')
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `https://${value}`
}

function normalizeWsTenantUrl(tenantUrl) {
  return String(tenantUrl || '').replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://')
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

  return {
    tenant,
    apiKey,
    clientId,
    clientSecret,
    scope,
    hasOauth,
    hasApiKey,
    mode: hasOauth ? 'oauth-m2m' : hasApiKey ? 'api-key' : 'none',
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
  throw new Error('Missing auth configuration. Set OAuth M2M vars or QLIK_API_KEY.')
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

async function qlikPost(config, pathWithQuery, payload) {
  const authorization = await getAuthHeader(config)
  const response = await fetch(`${config.tenant}${pathWithQuery}`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload == null ? {} : payload),
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

const _qlikDynamicHypercubeCache = new Map()

function buildQlikDynamicCacheKey(endpointName, appId, urlObj) {
  const normalized = {
    endpoint: normalizeText(endpointName).toLowerCase(),
    appId: normalizeText(appId),
    from: normalizeText(urlObj.searchParams.get('from')),
    to: normalizeText(urlObj.searchParams.get('to')),
    brand: normalizeText(urlObj.searchParams.get('brand')).toLowerCase(),
    affiliateId: normalizeText(urlObj.searchParams.get('affiliateId')).toLowerCase(),
    clientId: normalizeText(urlObj.searchParams.get('clientId')).toLowerCase(),
    pageSize: parsePositiveInt(urlObj.searchParams.get('enginePageSize'), QLIK_DYNAMIC_ENGINE_PAGE_SIZE, 2000),
  }
  return JSON.stringify(normalized)
}

function readQlikDynamicCachedDataset(cacheKey) {
  const entry = _qlikDynamicHypercubeCache.get(cacheKey)
  if (!entry) return null
  const age = Date.now() - Number(entry.fetchedAt || 0)
  if (age > QLIK_DYNAMIC_CACHE_TTL_MS) {
    _qlikDynamicHypercubeCache.delete(cacheKey)
    return null
  }
  return entry.data
}

function writeQlikDynamicCachedDataset(cacheKey, data) {
  _qlikDynamicHypercubeCache.set(cacheKey, {
    fetchedAt: Date.now(),
    data,
  })

  if (_qlikDynamicHypercubeCache.size <= QLIK_DYNAMIC_MAX_CACHE_ITEMS) return

  const oldest = Array.from(_qlikDynamicHypercubeCache.entries())
    .sort((a, b) => Number(a?.[1]?.fetchedAt || 0) - Number(b?.[1]?.fetchedAt || 0))
    .slice(0, Math.max(1, _qlikDynamicHypercubeCache.size - QLIK_DYNAMIC_MAX_CACHE_ITEMS))

  for (const [key] of oldest) {
    _qlikDynamicHypercubeCache.delete(key)
  }
}

function qlikCellNumber(cell) {
  const qNum = Number(cell?.qNum)
  if (Number.isFinite(qNum)) return qNum
  const parsed = Number(String(cell?.qText || '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizePeriodText(value) {
  const raw = normalizeText(value)
  if (!raw) return ''
  const directRank = ymRank(raw)
  if (directRank > 0) return raw
  const ms = parseIsoDateBoundary(raw, { endOfDay: false })
  if (!Number.isFinite(ms)) return raw
  const d = new Date(ms)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getUTCFullYear()}-${months[d.getUTCMonth()]}`
}

function getDynamicEndpointDefinition(endpointName) {
  const baseMeasures = [
    { key: 'deposits', label: '$ Deposit', expr: 'Sum([Trans Deposit])' },
    { key: 'withdrawals', label: '$ WD', expr: 'Sum([Trans Withdrawal])' },
    { key: 'pnl', label: '$ PnL', expr: 'Sum([Trade PL Closed])' },
    { key: 'commissionAff', label: '$ Commission Aff', expr: 'Alt(Sum([Commission Aff]), Sum([Trans Commission]), 0)' },
  ]

  const definitions = {
    'client-months': {
      dimensions: [
        { key: 'clientId', label: 'Client ID', expr: '=[Client ID]' },
        { key: 'brand', label: 'Brand', expr: '=[Brand]' },
        { key: 'period', label: 'Year Month', expr: '=[Year Month]' },
        { key: 'affiliateId', label: 'Affiliate ID', expr: '=[Affiliate ID]' },
      ],
      measures: baseMeasures,
      rowPredicate: () => true,
    },
    sales: {
      dimensions: [
        { key: 'clientId', label: 'Client ID', expr: '=[Client ID]' },
        { key: 'brand', label: 'Brand', expr: '=[Brand]' },
        { key: 'period', label: 'Year Month', expr: '=[Year Month]' },
        { key: 'affiliateId', label: 'Affiliate ID', expr: '=[Affiliate ID]' },
      ],
      measures: baseMeasures,
      rowPredicate: (row) => Math.abs(Number(row?.deposits || 0)) > 0 || Math.abs(Number(row?.pnl || 0)) > 0,
    },
    retention: {
      dimensions: [
        { key: 'clientId', label: 'Client ID', expr: '=[Client ID]' },
        { key: 'brand', label: 'Brand', expr: '=[Brand]' },
        { key: 'period', label: 'Year Month', expr: '=[Year Month]' },
        { key: 'affiliateId', label: 'Affiliate ID', expr: '=[Affiliate ID]' },
      ],
      measures: baseMeasures,
      rowPredicate: (row) => Math.abs(Number(row?.withdrawals || 0)) > 0 || Math.abs(Number(row?.commissionAff || 0)) > 0,
    },
    deposits: {
      dimensions: [
        { key: 'clientId', label: 'Client ID', expr: '=[Client ID]' },
        { key: 'brand', label: 'Brand', expr: '=[Brand]' },
        { key: 'period', label: 'Year Month', expr: '=[Year Month]' },
        { key: 'affiliateId', label: 'Affiliate ID', expr: '=[Affiliate ID]' },
      ],
      measures: baseMeasures,
      rowPredicate: (row) => Math.abs(Number(row?.deposits || 0)) > 0 || Math.abs(Number(row?.withdrawals || 0)) > 0,
    },
    affiliates: {
      dimensions: [
        { key: 'period', label: 'Year Month', expr: '=[Year Month]' },
        { key: 'affiliateId', label: 'Affiliate ID', expr: '=[Affiliate ID]' },
        { key: 'brand', label: 'Brand', expr: '=[Brand]' },
      ],
      measures: [
        { key: 'commissionAff', label: '$ Commission Aff', expr: 'Alt(Sum([Commission Aff]), Sum([Trans Commission]), 0)' },
      ],
      rowPredicate: () => true,
    },
  }

  return definitions[normalizeText(endpointName).toLowerCase()] || null
}

function buildDynamicHypercubeDefinition(endpointDef, pageSize) {
  return {
    qInfo: { qType: 'tmp-qlik-dynamic-endpoint' },
    qHyperCubeDef: {
      qDimensions: endpointDef.dimensions.map((dim) => ({
        qDef: {
          qFieldDefs: [],
          qFieldLabels: [dim.label || dim.key],
          qLabel: dim.label || dim.key,
          qDef: dim.expr,
        },
      })),
      qMeasures: endpointDef.measures.map((measure) => ({
        qDef: {
          qDef: measure.expr,
          qLabel: measure.label || measure.key,
        },
      })),
      qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: Math.max(1, pageSize), qWidth: endpointDef.dimensions.length + endpointDef.measures.length }],
    },
  }
}

async function fetchSessionHypercubeDataPages(session, objectHandle, totalRows, totalCols, pageSize) {
  const pages = []
  for (let top = 0; top < totalRows; top += pageSize) {
    const height = Math.max(1, Math.min(pageSize, totalRows - top))
    const page = await session.call(objectHandle, 'GetHyperCubeData', [
      '/qHyperCubeDef',
      [{ qTop: top, qLeft: 0, qHeight: height, qWidth: totalCols }],
    ])
    const matrix = Array.isArray(page?.qDataPages?.[0]?.qMatrix) ? page.qDataPages[0].qMatrix : []
    pages.push(...matrix)
  }
  return pages
}

function normalizeDynamicRows(matrixRows, endpointDef) {
  const dimsCount = endpointDef.dimensions.length
  return matrixRows.map((row) => {
    const next = {}

    endpointDef.dimensions.forEach((dim, index) => {
      const cell = row?.[index]
      const text = normalizeText(cell?.qText)
      next[dim.key] = dim.key === 'period' ? normalizePeriodText(text) : text
    })

    endpointDef.measures.forEach((measure, index) => {
      const cell = row?.[dimsCount + index]
      next[measure.key] = qlikCellNumber(cell)
    })

    if (next.deposits != null || next.withdrawals != null) {
      next.netDeposit = Number(next.deposits || 0) - Number(next.withdrawals || 0)
    }

    if (next.clientId == null) next.clientId = ''
    if (next.brand == null) next.brand = ''
    if (next.period == null) next.period = ''
    if (next.deposits == null) next.deposits = 0
    if (next.withdrawals == null) next.withdrawals = 0
    if (next.netDeposit == null) next.netDeposit = 0
    if (next.pnl == null) next.pnl = 0
    if (next.commissionAff == null) next.commissionAff = 0

    return next
  })
}

function applyDynamicQueryFilters(rows, endpointName, urlObj) {
  const fromRaw = normalizeText(urlObj.searchParams.get('from'))
  const toRaw = normalizeText(urlObj.searchParams.get('to'))
  const fromRank = fromRaw ? periodRankFromIsoDate(fromRaw) : -1
  const toRank = toRaw ? periodRankFromIsoDate(toRaw) : -1
  const hasPeriodBounds = fromRank > 0 && toRank > 0

  const brandFilter = normalizeText(urlObj.searchParams.get('brand')).toLowerCase()
  const affiliateFilter = normalizeText(urlObj.searchParams.get('affiliateId')).toLowerCase()
  const clientFilter = normalizeText(urlObj.searchParams.get('clientId')).toLowerCase()

  const definition = getDynamicEndpointDefinition(endpointName)
  const rowPredicate = typeof definition?.rowPredicate === 'function' ? definition.rowPredicate : (() => true)

  return rows.filter((row) => {
    if (hasPeriodBounds) {
      const periodRank = ymRank(normalizePeriodText(row?.period))
      if (periodRank > 0 && (periodRank < fromRank || periodRank > toRank)) return false
    }

    if (brandFilter && normalizeText(row?.brand).toLowerCase() !== brandFilter) return false
    if (affiliateFilter && normalizeText(row?.affiliateId).toLowerCase() !== affiliateFilter) return false
    if (clientFilter && normalizeText(row?.clientId).toLowerCase() !== clientFilter) return false

    if (!rowPredicate(row)) return false
    return true
  })
}

async function resolveQlikDynamicEndpointRows(config, endpointName, appId, urlObj) {
  const endpointDef = getDynamicEndpointDefinition(endpointName)
  if (!endpointDef) {
    const error = new Error(`Unknown Qlik dynamic endpoint: ${endpointName}`)
    error.status = 404
    throw error
  }

  const cacheKey = buildQlikDynamicCacheKey(endpointName, appId, urlObj)
  const cached = readQlikDynamicCachedDataset(cacheKey)
  if (cached) {
    return { ...cached, cached: true }
  }

  const enginePageSize = parsePositiveInt(urlObj.searchParams.get('enginePageSize'), QLIK_DYNAMIC_ENGINE_PAGE_SIZE, 2000)

  const data = await withEngineSession(config, appId, async (session) => {
    const sessionObjectDef = buildDynamicHypercubeDefinition(endpointDef, enginePageSize)
    const created = await session.call(session.docHandle, 'CreateSessionObject', [sessionObjectDef])
    const handle = Number(created?.qReturn?.qHandle || 0)
    if (!handle) {
      const error = new Error('Unable to create session HyperCube object')
      error.status = 502
      throw error
    }

    const layoutResult = await session.call(handle, 'GetLayout', [])
    const cube = unwrapLayout(layoutResult)?.qHyperCube || {}
    const totalRows = Math.max(0, Number(cube?.qSize?.qcy || 0))
    const totalCols = Math.max(1, Number(cube?.qSize?.qcx || (endpointDef.dimensions.length + endpointDef.measures.length)))

    const matrixRows = totalRows > 0
      ? await fetchSessionHypercubeDataPages(session, handle, totalRows, totalCols, enginePageSize)
      : []

    const normalizedRows = normalizeDynamicRows(matrixRows, endpointDef)
    const filteredRows = applyDynamicQueryFilters(normalizedRows, endpointName, urlObj)

    return {
      rows: filteredRows,
      totalRows: filteredRows.length,
      sourceRows: normalizedRows.length,
      engineRows: totalRows,
      engineCols: totalCols,
      endpoint: endpointName,
      appId,
    }
  })

  writeQlikDynamicCachedDataset(cacheKey, data)
  return { ...data, cached: false }
}

async function handleQlikDynamicEndpoint(req, res, endpointName) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const appId = normalizeText(req.query?.appId || env('QLIK_APP_ID') || env('QLIK_CREOLABS_APP_ID') || CREOLABS_APP_ID)
  const urlObj = new URL(req.url || '/', 'http://localhost')
  const limit = parsePositiveInt(urlObj.searchParams.get('limit'), 500, 5000)
  const offset = parseNonNegativeInt(urlObj.searchParams.get('offset'), 0, 2_000_000)

  try {
    const resolved = await resolveQlikDynamicEndpointRows(config, endpointName, appId, urlObj)
    const rows = Array.isArray(resolved?.rows) ? resolved.rows : []
    const safeOffset = Math.min(offset, Math.max(0, rows.length))
    const pageRows = rows.slice(safeOffset, safeOffset + limit)

    return json(
      res,
      200,
      {
        ok: true,
        data: {
          contractVersion: 'qlik-dynamic-hypercube-v1',
          endpoint: endpointName,
          appId,
          source: 'engine-session-hypercube',
          cached: Boolean(resolved?.cached),
          query: {
            limit,
            offset: safeOffset,
            total: rows.length,
            from: normalizeText(urlObj.searchParams.get('from')),
            to: normalizeText(urlObj.searchParams.get('to')),
            brand: normalizeText(urlObj.searchParams.get('brand')),
            affiliateId: normalizeText(urlObj.searchParams.get('affiliateId')),
            clientId: normalizeText(urlObj.searchParams.get('clientId')),
          },
          diagnostics: {
            sourceRows: Number(resolved?.sourceRows || 0),
            engineRows: Number(resolved?.engineRows || 0),
            engineCols: Number(resolved?.engineCols || 0),
          },
          rows: pageRows,
        },
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || `Qlik ${endpointName} request failed`,
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
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

      const matrix = Array.isArray(pages?.qDataPages?.[0]?.qMatrix)
        ? pages.qDataPages[0].qMatrix
        : Array.isArray(pages?.[0]?.qMatrix)
          ? pages[0].qMatrix
          : []
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

async function handleEngineSessionPing(req, res, appId) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  try {
    const data = await withEngineSession(config, appId, async (session) => {
      const layoutResult = await session.call(session.docHandle, 'GetAppLayout', [])
      const layout = unwrapLayout(layoutResult)
      return {
        appId,
        docHandle: Number(session.docHandle || 0),
        appTitle: safeText(layout?.qTitle || layout?.qAppProperties?.title),
        connectedAt: new Date().toISOString(),
      }
    })

    return json(
      res,
      200,
      {
        ok: true,
        data: {
          contractVersion: 'engine-session-ping-v1',
          authMode: config.mode,
          ...data,
        },
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Qlik Engine session ping failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

function splitCsvParam(raw) {
  return safeText(raw)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function toDiscoveryRegex(raw) {
  const fallback = /(Client|Date|Timestamp|Time|KYC|Lead|Name|Email|Registration|LTD|LTT)/i
  const text = safeText(raw).trim()
  if (!text) return fallback
  try {
    return new RegExp(text, 'i')
  } catch {
    return fallback
  }
}

async function handleEngineObjectDiscovery(req, res, appId) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const targetSheets = new Set(splitCsvParam(req.query?.sheetIds))
  const maxSheets = parsePositiveInt(req.query?.maxSheets, 20, 100)
  const maxObjects = parsePositiveInt(req.query?.maxObjects, 250, 1000)
  const sampleRows = parsePositiveInt(req.query?.sampleRows, 1, 5)
  const sampleCols = parsePositiveInt(req.query?.sampleCols, 20, 50)
  const includeSample = safeText(req.query?.includeSample) === '1'
  const keywords = safeText(req.query?.keywords)
  const filterRegex = toDiscoveryRegex(keywords)

  try {
    const data = await withEngineSession(config, appId, async (session) => {
      const sheetsResult = await session.call(session.docHandle, 'GetObjects', [
        {
          qTypes: ['sheet'],
          qIncludeSessionObjects: false,
        },
      ])

      let sheets = (Array.isArray(sheetsResult?.qList) ? sheetsResult.qList : []).map((row) => ({
        id: safeText(row?.qInfo?.qId),
        title: safeText(row?.qMeta?.title),
      }))

      if (targetSheets.size > 0) {
        sheets = sheets.filter((sheet) => targetSheets.has(sheet.id))
      }

      sheets = sheets.slice(0, maxSheets)

      const candidates = []
      let scannedObjects = 0
      let scannedSheets = 0

      for (const sheet of sheets) {
        if (scannedObjects >= maxObjects) break
        scannedSheets += 1

        let refs = []
        try {
          const sheetObj = await session.call(session.docHandle, 'GetObject', [sheet.id])
          const sheetHandle = Number(sheetObj?.qReturn?.qHandle || 0)
          if (!sheetHandle) continue

          const sheetLayoutResult = await session.call(sheetHandle, 'GetLayout', [])
          const sheetLayout = unwrapLayout(sheetLayoutResult)
          refs = extractSheetObjectsFromLayout(sheetLayout)
        } catch {
          continue
        }

        for (const ref of refs) {
          if (scannedObjects >= maxObjects) break
          scannedObjects += 1

          let objectHandle = 0
          let layout = null
          try {
            const objectResult = await session.call(session.docHandle, 'GetObject', [ref.id])
            objectHandle = Number(objectResult?.qReturn?.qHandle || 0)
            if (!objectHandle) continue
            const layoutResult = await session.call(objectHandle, 'GetLayout', [])
            layout = unwrapLayout(layoutResult)
          } catch {
            continue
          }

          const hypercube = layout?.qHyperCube
          if (!hypercube) continue

          const objectType = safeText(layout?.qInfo?.qType || ref.type)
          const objectTitle = safeText(layout?.qMeta?.title || layout?.title)
          const dimensions = Array.isArray(hypercube?.qDimensionInfo)
            ? hypercube.qDimensionInfo.map((d) => safeText(d?.qFallbackTitle || d?.qGroupFallbackTitles?.[0]))
            : []
          const measures = Array.isArray(hypercube?.qMeasureInfo)
            ? hypercube.qMeasureInfo.map((m) => safeText(m?.qFallbackTitle || m?.qLabel))
            : []

          const haystack = `${objectType} ${objectTitle} ${dimensions.join(' ')} ${measures.join(' ')}`
          if (!filterRegex.test(haystack)) continue

          const qSize = hypercube?.qSize || {}
          const result = {
            sheetId: sheet.id,
            sheetTitle: sheet.title,
            objectId: ref.id,
            objectType,
            objectTitle,
            size: {
              rows: Number(qSize.qcy || 0),
              cols: Number(qSize.qcx || 0),
            },
            dimensions,
            measures,
          }

          if (includeSample) {
            try {
              const height = Math.max(1, Math.min(sampleRows, Number(qSize.qcy || 0) || sampleRows))
              const width = Math.max(1, Math.min(sampleCols, Number(qSize.qcx || 0) || sampleCols))
              const pages = await session.call(objectHandle, 'GetHyperCubeData', [
                '/qHyperCubeDef',
                [{ qTop: 0, qLeft: 0, qHeight: height, qWidth: width }],
              ])
              const matrix = Array.isArray(pages?.qDataPages?.[0]?.qMatrix)
                ? pages.qDataPages[0].qMatrix
                : Array.isArray(pages?.[0]?.qMatrix)
                  ? pages[0].qMatrix
                  : []
              result.sample = matrix.map((row) => (Array.isArray(row) ? row.map(simplifyCell) : []))
            } catch {
              result.sample = []
            }
          }

          candidates.push(result)
        }
      }

      return {
        filters: {
          sheetIds: [...targetSheets],
          keywords: keywords || filterRegex.source,
          includeSample,
          maxSheets,
          maxObjects,
        },
        scannedSheets,
        scannedObjects,
        matched: candidates.length,
        candidates,
      }
    })

    return json(res, 200, { ok: true, data }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Qlik Engine discovery request failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

// Known object IDs for CREOLABS live data (discovered via Engine scan)
const CREOLABS_APP_ID = 'c6f37daa-0278-42b0-ab9b-813d2b9aafeb'
// "Previous Month" table ÔÇô contains per-account PL filtered for the most recent period
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
const CREOLABS_WARMUP_MAX_MS = 2 * 60 * 1000

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

function periodRankFromIsoDate(isoDate) {
  const ms = parseIsoDateBoundary(isoDate, { endOfDay: false })
  if (!Number.isFinite(ms)) return -1
  const d = new Date(ms)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return ymRank(`${d.getUTCFullYear()}-${monthNames[d.getUTCMonth()]}`)
}

let _creolabsClientsCache = null
let _creolabsSnapshotCache = null
let _creolabsTradersRankingRewardsTableCache = null

const _creolabsClientVariantCaches = {
  full: null,
  clientMonths: null,
  affiliateMonth: null,
}
let _creolabsLatestLeadObjectCache = null
let _creolabsRegisteredLeadsObjectCache = null
let _creolabsPerformanceSummaryThisMonthCache = null
let _registeredUsersMetaCacheByClient = new Map()
let _registeredUsersMetaCacheTouchedAt = 0
const REGISTERED_USERS_META_CACHE_TTL = 12 * 60 * 60 * 1000
const PERFORMANCE_SUMMARY_THIS_MONTH_CACHE_TTL = 5 * 60 * 1000

const _dbLiveIngestionState = {
  schedulerStarted: false,
  hydratedFromDisk: false,
  timer: null,
  inFlight: false,
  startedAt: null,
  lastRunAt: null,
  lastSuccessAt: null,
  lastFailureAt: null,
  consecutiveFailures: 0,
  latestWatermark: '',
  runCount: 0,
  storeByClient: new Map(),
  lastRun: null,
  runs: [],
}

const _dbNativeStoreState = {
  hydratedFromDisk: false,
  inFlight: null,
  rows: [],
  report: null,
  schema: null,
  filters: null,
  warnings: [],
  generatedAt: '',
  updatedAt: '',
  sourcePaging: null,
}

const _dbNativeLeaderboardCache = new Map()
const DB_NATIVE_LEADERBOARD_CACHE_MS = 60 * 1000

const _dbLiveIngestionControlRate = new Map()

function clearCreolabsClientVariantCaches() {
  for (const key of Object.keys(_creolabsClientVariantCaches)) {
    _creolabsClientVariantCaches[key] = null
  }
  _creolabsClientsCache = null
  _creolabsSnapshotCache = null
  _creolabsTradersRankingRewardsTableCache = null
  _creolabsLatestLeadObjectCache = null
  _creolabsRegisteredLeadsObjectCache = null
  _creolabsPerformanceSummaryThisMonthCache = null
  _registeredUsersMetaCacheByClient = new Map()
  _registeredUsersMetaCacheTouchedAt = 0
}

const CREOLABS_LATEST_LEAD_OBJECT_ID = 'db41484c-0a43-4f59-a499-381dfceee46c'
const CREOLABS_LATEST_LEAD_OBJECT_TTL = 5 * 60 * 1000
const CREOLABS_REGISTERED_LEADS_OBJECT_ID = 'ZShKmrn'
const CREOLABS_REGISTERED_LEADS_OBJECT_TTL = 12 * 60 * 60 * 1000
const CREOLABS_LEAD_EXCLUDED_STATUSES = new Set(['duplicate', 'deleted', 'do not call', 'less than 18'])
const CREOLABS_PERFORMANCE_SUMMARY_THIS_MONTH_MEASURES = [
  {
    key: 'closedPl',
    label: '$ PL Closed (M)',
    def: "Sum({$<$(vSelectionsPeriod),[%_FULL_TM_TY]={'1'}>} [Trade PL Closed])",
  },
  {
    key: 'ftd',
    label: '$ FTD (M)',
    def: "Sum({$<$(vSelectionsPeriod),[%_FULL_TM_TY]={'1'}>} [Trans FTD])",
  },
  {
    key: 'deposit',
    label: '$ Deposit (M)',
    def: "Sum({$<$(vSelectionsPeriod),[%_FULL_TM_TY]={'1'}>} [Trans Deposit])",
  },
  {
    key: 'wd',
    label: '$ WD (M)',
    def: "Sum({$<$(vSelectionsPeriod),[%_FULL_TM_TY]={'1'}>} [Trans Withdrawal])",
  },
  {
    key: 'net',
    label: '$ Net (M)',
    def: "Sum({$<$(vSelectionsPeriod),[%_FULL_TM_TY]={'1'}>} [Trans Deposit]) - Sum({$<$(vSelectionsPeriod),[%_FULL_TM_TY]={'1'}>} [Trans Withdrawal])",
  },
  {
    key: 'closedVolume',
    label: '$ Volume Closed (M)',
    def: "Sum({$<$(vSelectionsPeriod),[%_FULL_TM_TY]={'1'}>} [Trade Volume Closed] + [Trade Volume Closed IN])",
  },
]

function qlikDateNumberToIsoDate(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  const ms = Date.UTC(1899, 11, 30) + Math.round(num) * 24 * 60 * 60 * 1000
  const d = new Date(ms)
  if (!Number.isFinite(d.getTime())) return ''
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseLooseNumber(text) {
  const raw = safeText(text).trim()
  if (!raw) return 0
  const normalized = raw.replace(/,/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

function findHeaderIndex(headers, pattern) {
  for (let i = 0; i < headers.length; i += 1) {
    const header = safeText(headers[i]).trim()
    if (pattern.test(header)) return i
  }
  return -1
}

function firstDefinedIndex(...indexes) {
  for (const idx of indexes) {
    if (Number.isInteger(idx) && idx >= 0) return idx
  }
  return -1
}

function hasCreolabsTradingActivity(user) {
  const tradesValue = toFiniteNumber(user?.trades)
  const openedTradesValue = toFiniteNumber(user?.openedTrades ?? user?.opened_trades)
  const closedVolumeValue = toFiniteNumber(
    user?.closedVolume ?? user?.closedVol ?? user?.closed_volume ?? user?.volumeClosed
  )
  const closedPlValue = toFiniteNumber(user?.closedPl ?? user?.closed_pl)
  const openPlValue = toFiniteNumber(user?.openPl ?? user?.open_pl)
  return (
    tradesValue > 0 ||
    openedTradesValue > 0 ||
    closedVolumeValue > 0 ||
    closedPlValue !== 0 ||
    openPlValue !== 0
  )
}

function aggregateCreolabsUserKpis(users, options = null) {
  const rows = Array.isArray(users) ? users : []
  const leadFromMs = Number.isFinite(Number(options?.leadFromMs))
    ? Number(options?.leadFromMs)
    : Number.NEGATIVE_INFINITY
  const leadToMs = Number.isFinite(Number(options?.leadToMs))
    ? Number(options?.leadToMs)
    : Number.POSITIVE_INFINITY
  let net = 0
  let deposit = 0
  let wd = 0
  let trades = 0
  let openedTrades = 0
  let closedVolume = 0
  let closedPl = 0
  let openPl = 0
  let ftd = 0
  let rdp = 0
  let commission = 0
  let balance = 0
  let equity = 0
  let activeMonths = 0

  let withCommission = 0
  let withFtd = 0
  let withDeposit = 0
  let withWd = 0
  let withNet = 0
  let withBalance = 0
  let withEquity = 0

  const clientIds = new Set()
  const leadClientIds = new Set()
  const activeTraderIds = new Set()
  const affiliates = new Set()
  const brands = new Set()
  const countries = new Set()
  const statuses = new Map()

  for (const user of rows) {
    const netValue = toFiniteNumber(user?.net)
    const depositValue = toFiniteNumber(user?.deposit)
    const wdValue = toFiniteNumber(user?.wd)
    const tradesValue = toFiniteNumber(user?.trades)
    const openedTradesValue = toFiniteNumber(user?.openedTrades ?? user?.opened_trades)
    const closedVolumeValue = toFiniteNumber(
      user?.closedVolume ?? user?.closedVol ?? user?.closed_volume ?? user?.volumeClosed
    )
    const closedPlValue = toFiniteNumber(user?.closedPl)
    const openPlValue = toFiniteNumber(user?.openPl)
    const ftdValue = toFiniteNumber(user?.ftd)
    const rdpValue = toFiniteNumber(user?.rdp)
    const commissionValue = toFiniteNumber(
      user?.commission ??
      user?.commissionAff ??
      user?.transactionCommission ??
      user?.transCommission
    )
    const balanceValue = toFiniteNumber(user?.balance)
    const equityValue = toFiniteNumber(user?.equity)
    const activeMonthsValue = toFiniteNumber(user?.activeMonths)

    net += netValue
    deposit += depositValue
    wd += wdValue
    trades += tradesValue
    openedTrades += openedTradesValue
    closedVolume += closedVolumeValue
    closedPl += closedPlValue
    openPl += openPlValue
    ftd += ftdValue
    rdp += rdpValue
    commission += commissionValue
    balance += balanceValue
    equity += equityValue
    activeMonths += activeMonthsValue

    if (commissionValue !== 0) withCommission += 1
    if (ftdValue !== 0) withFtd += 1
    if (depositValue !== 0) withDeposit += 1
    if (wdValue !== 0) withWd += 1
    if (netValue !== 0) withNet += 1
    if (balanceValue !== 0) withBalance += 1
    if (equityValue !== 0) withEquity += 1

    const clientId = normalizeText(user?.clientId)
    const affiliateId = normalizeText(user?.affiliateId)
    const brand = normalizeText(user?.brand)
    const country = normalizeText(user?.country)
    const status = normalizeText(user?.status).toLowerCase()

    if (clientId) clientIds.add(clientId)
    if (clientId) {
      const tsMs = parseIsoDateBoundary(normalizeText(user?.clientTimestamp), { endOfDay: false })
      if (Number.isFinite(tsMs) && tsMs >= leadFromMs && tsMs <= leadToMs) {
        leadClientIds.add(clientId)
      }
      if (hasCreolabsTradingActivity(user)) {
        activeTraderIds.add(clientId)
      }
    }
    if (affiliateId && !isMissingIdentityValue(affiliateId)) affiliates.add(affiliateId)
    if (brand) brands.add(brand)
    if (country) countries.add(country)
    if (status) statuses.set(status, (statuses.get(status) || 0) + 1)
  }

  return {
    rows: rows.length,
    uniqueClients: clientIds.size,
    totalLeads: leadClientIds.size,
    activeTraders: activeTraderIds.size,
    uniqueAffiliates: affiliates.size,
    uniqueBrands: brands.size,
    uniqueCountries: countries.size,
    net,
    deposit,
    wd,
    trades,
    openedTrades,
    closedVolume,
    closedPl,
    openPl,
    totalPl: closedPl + openPl,
    ftd,
    rdp,
    commission,
    balance,
    equity,
    activeMonths,
    withCommission,
    withFtd,
    withDeposit,
    withWd,
    withNet,
    withBalance,
    withEquity,
    statusCounts: Object.fromEntries(statuses.entries()),
  }
}

function cellToFiniteNumber(cell) {
  const qNum = Number(cell?.qNum)
  if (Number.isFinite(qNum)) return qNum
  const text = String(cell?.qText || '').replace(/,/g, '')
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : 0
}

async function evaluateEngineMeasureSet(session, qType, measures) {
  const normalized = Array.isArray(measures) ? measures.filter((m) => m && m.key && m.def) : []
  if (!normalized.length) return {}

  const sessionObj = await session.call(session.docHandle, 'CreateSessionObject', [
    {
      qInfo: { qType },
      qHyperCubeDef: {
        qDimensions: [],
        qMeasures: normalized.map((m) => ({ qDef: { qDef: m.def, qLabel: m.label || m.key } })),
        qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: 1, qWidth: normalized.length }],
      },
    },
  ])

  const h = Number(sessionObj?.qReturn?.qHandle || 0)
  if (!h) throw new Error(`Session object creation failed for ${qType}`)

  const layoutResult = await session.call(h, 'GetLayout', [])
  const cube = unwrapLayout(layoutResult)?.qHyperCube || {}
  let row = Array.isArray(cube?.qGrandTotalRow) ? cube.qGrandTotalRow : []

  if (!row.length) {
    const pageResult = await session.call(h, 'GetHyperCubeData', [
      '/qHyperCubeDef',
      [{ qTop: 0, qLeft: 0, qHeight: 1, qWidth: normalized.length }],
    ])
    row = pageResult?.qDataPages?.[0]?.qMatrix?.[0] || []
  }

  const out = {}
  normalized.forEach((m, idx) => {
    out[m.key] = cellToFiniteNumber(row[idx])
  })
  return out
}

async function fetchCreolabsPerformanceSummaryThisMonthKpis(config) {
  return withEngineSession(config, CREOLABS_APP_ID, async (session) => {
    return evaluateEngineMeasureSet(
      session,
      'tmp-performance-summary-this-month',
      CREOLABS_PERFORMANCE_SUMMARY_THIS_MONTH_MEASURES
    )
  })
}

async function resolveCreolabsPerformanceSummaryThisMonthKpis(config) {
  const now = Date.now()
  const age = _creolabsPerformanceSummaryThisMonthCache?.fetchedAt
    ? now - _creolabsPerformanceSummaryThisMonthCache.fetchedAt
    : Infinity
  if (_creolabsPerformanceSummaryThisMonthCache?.data && age < PERFORMANCE_SUMMARY_THIS_MONTH_CACHE_TTL) {
    return { data: _creolabsPerformanceSummaryThisMonthCache.data, cached: true }
  }

  if (_creolabsPerformanceSummaryThisMonthCache?.promise) {
    const data = await _creolabsPerformanceSummaryThisMonthCache.promise
    return { data, cached: true }
  }

  const promise = fetchCreolabsPerformanceSummaryThisMonthKpis(config)
    .then((data) => {
      _creolabsPerformanceSummaryThisMonthCache = { data, fetchedAt: Date.now(), promise: null }
      return data
    })
    .catch((error) => {
      if (_creolabsPerformanceSummaryThisMonthCache) {
        _creolabsPerformanceSummaryThisMonthCache.promise = null
      }
      throw error
    })

  if (!_creolabsPerformanceSummaryThisMonthCache) {
    _creolabsPerformanceSummaryThisMonthCache = { data: null, fetchedAt: 0, promise }
  } else {
    _creolabsPerformanceSummaryThisMonthCache.promise = promise
  }

  const data = await promise
  return { data, cached: false }
}

function toDbLiveMonthRow(row) {
  const periodId = normalizeText(row?.periodId || row?.year_month || row?.yearMonth)
  const startDate = monthStartDate(periodId)
  const endDate = monthEndDate(periodId)
  const explicitTimestamp = normalizeText(row?.clientTimestamp || row?.client_timestamp)
  const explicitTimestampMs = Date.parse(explicitTimestamp)
  const clientTimestamp = Number.isFinite(explicitTimestampMs)
    ? new Date(explicitTimestampMs).toISOString()
    : (startDate ? startDate.toISOString() : '')
  const lastTimeComment = endDate ? endDate.toISOString() : clientTimestamp
  const plTotal = toFiniteNumber(row?.pl)
  const closedPl = plTotal
  const openPl = 0
  const balance = toFiniteNumber(row?.balance)
  const equity = toFiniteNumber(row?.equity) || balance + openPl
  const commissionAff = toFiniteNumber(
    row?.commissionAff ??
    row?.transactionCommission ??
    row?.transCommission ??
    row?.commission_aff ??
    row?.['$ Commission Aff']
  )
  const commission = toFiniteNumber(row?.commission ?? row?.ltv_commission ?? commissionAff)

  return {
    ...row,
    clientTimestamp,
    kycTimestamp: clientTimestamp,
    status: normalizeText(row?.status) || 'active',
    ltdDate: normalizeText(row?.ltdDate),
    lttDate: normalizeText(row?.lttDate),
    lastTimeComment: normalizeText(row?.lastTimeComment) || lastTimeComment,
    closedPl,
    openPl,
    commission,
    commissionAff,
    balance,
    equity,
    openedTrades: Math.round(toFiniteNumber(row?.openedTrades ?? row?.opened_trades ?? row?.trades)),
    sourceObjectId: CREOLABS_CLIENTS_OBJ,
    sourcePeriod: periodId,
  }
}

function extractIsoDateFromCell(cell) {
  const numIso = qlikDateNumberToIsoDate(cell?.qNum)
  if (numIso) return numIso
  const text = safeText(cell?.qText).trim()
  const m = text.match(/^(\d{4}-\d{2}-\d{2})$/)
  return m ? m[1] : ''
}

function extractIsoDateFromRow(row) {
  for (const cell of row || []) {
    const text = safeText(cell?.qText).trim()
    const m = text.match(/^(\d{4}-\d{2}-\d{2})$/)
    if (m) return m[1]
  }
  return ''
}

function extractIsoDateFromAnyCell(cell) {
  const numIso = qlikDateNumberToIsoDate(cell?.qNum)
  if (numIso) return numIso

  const text = safeText(cell?.qText).trim()
  if (!text || text === '-') return ''

  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})$/)
  if (isoMatch) return isoMatch[1]

  const dmyMatch = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
  if (dmyMatch) {
    const dd = String(dmyMatch[1]).padStart(2, '0')
    const mm = String(dmyMatch[2]).padStart(2, '0')
    const yyyy = String(dmyMatch[3])
    return `${yyyy}-${mm}-${dd}`
  }

  const parsed = Date.parse(text)
  if (!Number.isFinite(parsed)) return ''
  return new Date(parsed).toISOString().slice(0, 10)
}

function looksLikeClientIdText(value) {
  const text = normalizeText(value)
  return /^\d{3,}$/.test(text)
}

function inferLeadObjectHeaderOffset(matrix, idxClientTs, idxClientId) {
  if (!Array.isArray(matrix) || !matrix.length) return 0

  let bestOffset = 0
  let bestScore = -1

  for (let offset = -3; offset <= 3; offset += 1) {
    let score = 0

    for (const row of matrix) {
      if (!Array.isArray(row)) continue

      const tsCell = row[idxClientTs + offset]
      const idCell = row[idxClientId + offset]
      const tsOk = Boolean(extractIsoDateFromAnyCell(tsCell))
      const idOk = looksLikeClientIdText(idCell?.qText)

      if (tsOk) score += 1
      if (idOk) score += 2
    }

    if (score > bestScore) {
      bestScore = score
      bestOffset = offset
    }
  }

  return bestOffset
}

async function fetchCreolabsRegisteredLeadsFromObject(config) {
  return withEngineSession(config, CREOLABS_APP_ID, async (session) => {
    const objectResult = await session.call(session.docHandle, 'GetObject', [CREOLABS_REGISTERED_LEADS_OBJECT_ID])
    const objectHandle = Number(objectResult?.qReturn?.qHandle || 0)
    if (!objectHandle) throw new Error('Creolabs registered-leads object not found')

    const propsResult = await session.call(objectHandle, 'GetProperties', [])
    const hypercubeDef = propsResult?.qProp?.qHyperCubeDef || propsResult?.qReturn?.qProp?.qHyperCubeDef || null
    if (!hypercubeDef) throw new Error('Creolabs registered-leads object has no hypercube definition')

    const dimensions = Array.isArray(hypercubeDef?.qDimensions)
      ? hypercubeDef.qDimensions.map((d) =>
        safeText(d?.qDef?.qFieldLabels?.[0] || d?.qDef?.qLabel || d?.qDef?.qFieldDefs?.[0])
      )
      : []
    const measures = Array.isArray(hypercubeDef?.qMeasures)
      ? hypercubeDef.qMeasures.map((m) => safeText(m?.qDef?.qLabel || m?.qDef?.qDef))
      : []
    const headers = [...dimensions, ...measures]

    const layoutResult = await session.call(objectHandle, 'GetLayout', [])
    const layout = unwrapLayout(layoutResult)
    const layoutCube = layout?.qHyperCube
    const layoutDimensions = Array.isArray(layoutCube?.qDimensionInfo)
      ? layoutCube.qDimensionInfo.map((d) => safeText(d?.qFallbackTitle || d?.qGroupFallbackTitles?.[0]))
      : []
    const layoutMeasures = Array.isArray(layoutCube?.qMeasureInfo)
      ? layoutCube.qMeasureInfo.map((m) => safeText(m?.qFallbackTitle || m?.qLabel))
      : []
    const layoutHeaders = [...layoutDimensions, ...layoutMeasures]

    const totalCols = Math.max(1, headers.length || layoutHeaders.length || Number(layoutCube?.qSize?.qcx || 0) || 40)

    let idxClientTs = firstDefinedIndex(
      findHeaderIndex(headers, /^client\s*timestamp$/i),
      findHeaderIndex(layoutHeaders, /^client\s*timestamp$/i)
    )
    let idxClientId = firstDefinedIndex(
      findHeaderIndex(headers, /^client\s*id$/i),
      findHeaderIndex(layoutHeaders, /^client\s*id$/i)
    )
    let idxClientName = firstDefinedIndex(
      findHeaderIndex(headers, /^client\s*name$/i),
      findHeaderIndex(layoutHeaders, /^client\s*name$/i)
    )
    let idxAffiliateId = firstDefinedIndex(
      findHeaderIndex(headers, /(^|\b)affiliate(\s*id)?(\b|$)/i),
      findHeaderIndex(layoutHeaders, /(^|\b)affiliate(\s*id)?(\b|$)/i)
    )
    let idxClientLogin = firstDefinedIndex(
      findHeaderIndex(headers, /(^|\b)client\s*login(\b|$)/i),
      findHeaderIndex(layoutHeaders, /(^|\b)client\s*login(\b|$)/i)
    )
    let idxBrand = firstDefinedIndex(
      findHeaderIndex(headers, /(^|\b)brand(\b|$)/i),
      findHeaderIndex(layoutHeaders, /(^|\b)brand(\b|$)/i)
    )
    let idxCountry = firstDefinedIndex(
      findHeaderIndex(headers, /^country$/i),
      findHeaderIndex(layoutHeaders, /^country$/i)
    )
    let idxStatus = firstDefinedIndex(
      findHeaderIndex(headers, /^status$/i),
      findHeaderIndex(layoutHeaders, /^status$/i)
    )
    let idxFtdDate = firstDefinedIndex(
      findHeaderIndex(headers, /^ftd\s*date$/i),
      findHeaderIndex(layoutHeaders, /^ftd\s*date$/i)
    )
    let idxLtdDate = firstDefinedIndex(
      findHeaderIndex(headers, /^ltd\s*date$/i),
      findHeaderIndex(layoutHeaders, /^ltd\s*date$/i)
    )
    let idxLttDate = firstDefinedIndex(
      findHeaderIndex(headers, /^ltt\s*date$/i),
      findHeaderIndex(layoutHeaders, /^ltt\s*date$/i)
    )
    let idxLastContact = firstDefinedIndex(
      findHeaderIndex(headers, /^last\s*time\s*contact$/i),
      findHeaderIndex(layoutHeaders, /^last\s*time\s*contact$/i)
    )
    let idxUser = firstDefinedIndex(
      findHeaderIndex(headers, /^user$/i),
      findHeaderIndex(layoutHeaders, /^user$/i)
    )

    let idxLtvDeposit = firstDefinedIndex(
      findHeaderIndex(headers, /^ltv\s*deposit$/i),
      findHeaderIndex(headers, /^\$\s*deposit$/i),
      findHeaderIndex(layoutHeaders, /^ltv\s*deposit$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*deposit$/i)
    )
    let idxLtvWd = firstDefinedIndex(
      findHeaderIndex(headers, /^ltv\s*withdrawal$/i),
      findHeaderIndex(headers, /^\$\s*withdrawal$/i),
      findHeaderIndex(layoutHeaders, /^ltv\s*withdrawal$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*withdrawal$/i)
    )
    let idxLtvCommission = firstDefinedIndex(
      findHeaderIndex(headers, /^ltv\s*commission$/i),
      findHeaderIndex(headers, /^\$\s*commission(\s*aff)?$/i),
      findHeaderIndex(layoutHeaders, /^ltv\s*commission$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*commission(\s*aff)?$/i)
    )
    let idxLtvPl = firstDefinedIndex(
      findHeaderIndex(headers, /^ltv\s*pl$/i),
      findHeaderIndex(headers, /^\$\s*pl$/i),
      findHeaderIndex(layoutHeaders, /^ltv\s*pl$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*pl$/i)
    )
    let idxLtvOpenPl = firstDefinedIndex(
      findHeaderIndex(headers, /^ltv\s*open\s*pl$/i),
      findHeaderIndex(headers, /^\$\s*open\s*pl$/i),
      findHeaderIndex(layoutHeaders, /^ltv\s*open\s*pl$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*open\s*pl$/i)
    )
    let idxLtvNet = firstDefinedIndex(
      findHeaderIndex(headers, /^ltv\s*net$/i),
      findHeaderIndex(headers, /^\$\s*net$/i),
      findHeaderIndex(layoutHeaders, /^ltv\s*net$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*net$/i)
    )
    let idxLtvBalance = firstDefinedIndex(
      findHeaderIndex(headers, /^ltv\s*balance$/i),
      findHeaderIndex(headers, /^\$\s*balance$/i),
      findHeaderIndex(layoutHeaders, /^ltv\s*balance$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*balance$/i)
    )
    let idxTrades = firstDefinedIndex(
      findHeaderIndex(headers, /^#\s*trades$/i),
      findHeaderIndex(headers, /^\$\s*volume$/i),
      findHeaderIndex(layoutHeaders, /^#\s*trades$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*volume$/i)
    )
    let idxFtdAmount = firstDefinedIndex(
      findHeaderIndex(headers, /^ftd\s*amount$/i),
      findHeaderIndex(headers, /^\$\s*ftd$/i),
      findHeaderIndex(layoutHeaders, /^ftd\s*amount$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*ftd$/i)
    )
    let idxStdAmount = firstDefinedIndex(
      findHeaderIndex(headers, /^std\s*amount$/i),
      findHeaderIndex(headers, /^\$\s*std$/i),
      findHeaderIndex(layoutHeaders, /^std\s*amount$/i),
      findHeaderIndex(layoutHeaders, /^\$\s*std$/i)
    )

    // Stable hard fallback for ZShKmrn column order when labels are weak/missing.
    if (normalizeText(CREOLABS_REGISTERED_LEADS_OBJECT_ID) === 'zshkmrn') {
      idxClientTs = firstDefinedIndex(idxClientTs, 2)
      idxClientId = firstDefinedIndex(idxClientId, 4)
      idxClientName = firstDefinedIndex(idxClientName, 5)
      idxCountry = firstDefinedIndex(idxCountry, 6)
      idxStatus = firstDefinedIndex(idxStatus, 7)
      idxFtdDate = firstDefinedIndex(idxFtdDate, 8)
      idxFtdAmount = firstDefinedIndex(idxFtdAmount, 9)
      idxStdAmount = firstDefinedIndex(idxStdAmount, 11)
      idxLtvDeposit = firstDefinedIndex(idxLtvDeposit, 12)
      idxLtvWd = firstDefinedIndex(idxLtvWd, 13)
      idxLtvNet = firstDefinedIndex(idxLtvNet, 14)
      idxLtvCommission = firstDefinedIndex(idxLtvCommission, 15)
      idxLtvPl = firstDefinedIndex(idxLtvPl, 16)
      idxLtvBalance = firstDefinedIndex(idxLtvBalance, 17)
      idxTrades = firstDefinedIndex(idxTrades, 18)
      idxUser = firstDefinedIndex(idxUser, 0)
    }

    const inferPage = await session.call(objectHandle, 'GetHyperCubeData', [
      '/qHyperCubeDef',
      [{ qTop: 0, qLeft: 0, qHeight: Math.min(250, REGISTERED_LEADS_PAGE_SIZE), qWidth: Math.min(totalCols, 40) }],
    ])
    const inferMatrix = Array.isArray(inferPage?.qDataPages?.[0]?.qMatrix)
      ? inferPage.qDataPages[0].qMatrix
      : Array.isArray(inferPage?.[0]?.qMatrix)
        ? inferPage[0].qMatrix
        : []
    if (!inferMatrix.length) return []

    // Some object variants expose weak/missing labels in properties: infer key columns from sample data.
    if (idxClientId < 0 || idxClientTs < 0) {
      const sampleWidth = inferMatrix.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
      let bestTsIdx = -1
      let bestTsScore = -1
      let bestIdIdx = -1
      let bestIdScore = -1

      for (let col = 0; col < sampleWidth; col += 1) {
        let tsScore = 0
        let idScore = 0
        for (const row of inferMatrix) {
          if (!Array.isArray(row)) continue
          const cell = row[col]
          if (extractIsoDateFromAnyCell(cell)) tsScore += 1
          if (looksLikeClientIdText(cell?.qText)) idScore += 1
        }
        if (tsScore > bestTsScore) {
          bestTsScore = tsScore
          bestTsIdx = col
        }
        if (idScore > bestIdScore) {
          bestIdScore = idScore
          bestIdIdx = col
        }
      }

      if (idxClientTs < 0 && bestTsScore > 0) idxClientTs = bestTsIdx
      if (idxClientId < 0 && bestIdScore > 0) {
        idxClientId = bestIdIdx === idxClientTs ? -1 : bestIdIdx
      }
    }

    if (idxClientId < 0 || idxClientTs < 0) {
      throw new Error('Creolabs registered-leads object missing required headers')
    }

    const requiredIndexes = [
      idxClientTs,
      idxClientId,
      idxClientName,
      idxAffiliateId,
      idxClientLogin,
      idxBrand,
      idxCountry,
      idxStatus,
      idxFtdDate,
      idxLtdDate,
      idxLttDate,
      idxLastContact,
      idxUser,
      idxLtvDeposit,
      idxLtvWd,
      idxLtvCommission,
      idxLtvPl,
      idxLtvOpenPl,
      idxLtvNet,
      idxLtvBalance,
      idxTrades,
      idxFtdAmount,
      idxStdAmount,
    ].filter((idx) => Number.isInteger(idx) && idx >= 0)
    const fetchWidth = Math.min(totalCols, Math.max(8, (requiredIndexes.length ? Math.max(...requiredIndexes) : 7) + 1))

    const headerOffset = inferLeadObjectHeaderOffset(inferMatrix, idxClientTs, idxClientId)

    // Keep per-request cells under common Qlik limits and stream until page exhaustion.
    const pageSize = REGISTERED_LEADS_PAGE_SIZE
    const pageParallel = REGISTERED_LEADS_PAGE_PARALLEL
    const maxRowsScan = 250_000
    const offsets = []
    for (let off = 0; off < maxRowsScan; off += pageSize) offsets.push(off)

    const leads = []
    let finished = false
    for (let i = 0; i < offsets.length && !finished; i += pageParallel) {
      const chunk = offsets.slice(i, i + pageParallel)
      const pages = await Promise.all(
        chunk.map((offset) =>
          session.call(objectHandle, 'GetHyperCubeData', [
            '/qHyperCubeDef',
            [{ qTop: offset, qLeft: 0, qHeight: pageSize, qWidth: fetchWidth }],
          ])
        )
      )

      for (const page of pages) {
        const matrix = Array.isArray(page?.qDataPages?.[0]?.qMatrix)
          ? page.qDataPages[0].qMatrix
          : Array.isArray(page?.[0]?.qMatrix)
            ? page[0].qMatrix
            : []

        if (!matrix.length) {
          finished = true
          continue
        }

        for (const row of matrix) {
          if (!Array.isArray(row)) continue
          const readCell = (idx) => {
            const shifted = idx + headerOffset
            if (shifted < 0 || shifted >= row.length) return null
            return row[shifted]
          }

          const clientId = normalizeText(readCell(idxClientId)?.qText)
          if (!clientId) continue

          const regDateIso = extractIsoDateFromAnyCell(readCell(idxClientTs))
          const clientTimestamp = regDateIso ? `${regDateIso}T00:00:00.000Z` : ''

          leads.push({
            clientId,
            clientName: idxClientName >= 0 ? normalizeText(readCell(idxClientName)?.qText) : '',
            affiliateId: idxAffiliateId >= 0 ? normalizeText(readCell(idxAffiliateId)?.qText) : '',
            clientLogin: idxClientLogin >= 0 ? normalizeText(readCell(idxClientLogin)?.qText) : '',
            brand: idxBrand >= 0 ? normalizeText(readCell(idxBrand)?.qText) : '',
            user: idxUser >= 0 ? normalizeText(readCell(idxUser)?.qText) : '',
            country: idxCountry >= 0 ? normalizeText(readCell(idxCountry)?.qText) : '',
            status: idxStatus >= 0 ? normalizeText(readCell(idxStatus)?.qText).toLowerCase() : '',
            clientTimestamp,
            kycTimestamp: clientTimestamp,
            ftdDate: idxFtdDate >= 0 ? extractIsoDateFromAnyCell(readCell(idxFtdDate)) : '',
            ltdDate: idxLtdDate >= 0 ? extractIsoDateFromAnyCell(readCell(idxLtdDate)) : '',
            lttDate: idxLttDate >= 0 ? extractIsoDateFromAnyCell(readCell(idxLttDate)) : '',
            lastTimeComment: idxLastContact >= 0 ? extractIsoDateFromAnyCell(readCell(idxLastContact)) : '',
            deposit: idxLtvDeposit >= 0 ? toFiniteNumber(readCell(idxLtvDeposit)?.qNum ?? parseLooseNumber(readCell(idxLtvDeposit)?.qText)) : 0,
            wd: idxLtvWd >= 0 ? toFiniteNumber(readCell(idxLtvWd)?.qNum ?? parseLooseNumber(readCell(idxLtvWd)?.qText)) : 0,
            net: idxLtvNet >= 0 ? toFiniteNumber(readCell(idxLtvNet)?.qNum ?? parseLooseNumber(readCell(idxLtvNet)?.qText)) : 0,
            closedPl: idxLtvPl >= 0 ? toFiniteNumber(readCell(idxLtvPl)?.qNum ?? parseLooseNumber(readCell(idxLtvPl)?.qText)) : 0,
            openPl: idxLtvOpenPl >= 0 ? toFiniteNumber(readCell(idxLtvOpenPl)?.qNum ?? parseLooseNumber(readCell(idxLtvOpenPl)?.qText)) : 0,
            commission: idxLtvCommission >= 0 ? toFiniteNumber(readCell(idxLtvCommission)?.qNum ?? parseLooseNumber(readCell(idxLtvCommission)?.qText)) : 0,
            ftd: idxFtdAmount >= 0 ? toFiniteNumber(readCell(idxFtdAmount)?.qNum ?? parseLooseNumber(readCell(idxFtdAmount)?.qText)) : 0,
            rdp: idxStdAmount >= 0 ? toFiniteNumber(readCell(idxStdAmount)?.qNum ?? parseLooseNumber(readCell(idxStdAmount)?.qText)) : 0,
            trades: idxTrades >= 0 ? Math.round(toFiniteNumber(readCell(idxTrades)?.qNum ?? parseLooseNumber(readCell(idxTrades)?.qText))) : 0,
            balance: idxLtvBalance >= 0 ? toFiniteNumber(readCell(idxLtvBalance)?.qNum ?? parseLooseNumber(readCell(idxLtvBalance)?.qText)) : 0,
            sourceObjectId: CREOLABS_REGISTERED_LEADS_OBJECT_ID,
          })
        }
      }
    }

    // Deduplicate exact repeats but keep historical day-level rows for each client.
    const byClientAndTimestamp = new Map()
    for (const row of leads) {
      const clientId = normalizeText(row?.clientId)
      const clientTimestamp = normalizeText(row?.clientTimestamp)
      const key = `${clientId}|${clientTimestamp || 'no-ts'}`
      if (!key) continue
      if (!byClientAndTimestamp.has(key)) byClientAndTimestamp.set(key, row)
    }

    return [...byClientAndTimestamp.values()]
  })
}

async function resolveCreolabsRegisteredLeadsFromObject(config) {
  const cache = _creolabsRegisteredLeadsObjectCache
  const age = cache?.fetchedAt ? Date.now() - cache.fetchedAt : Infinity
  if (cache?.data && age < CREOLABS_REGISTERED_LEADS_OBJECT_TTL) {
    return { data: cache.data, cached: true }
  }

  if (cache?.promise) {
    const data = await cache.promise
    return { data, cached: false }
  }

  const previousData = Array.isArray(cache?.data) ? cache.data : null
  const previousFetchedAt = Number(cache?.fetchedAt || 0)

  const promise = fetchCreolabsRegisteredLeadsFromObject(config)
    .then((data) => {
      _creolabsRegisteredLeadsObjectCache = { data, fetchedAt: Date.now(), promise: null }
      return data
    })
    .catch((e) => {
      if (_creolabsRegisteredLeadsObjectCache) _creolabsRegisteredLeadsObjectCache.promise = null
      throw e
    })

  _creolabsRegisteredLeadsObjectCache = { data: previousData, fetchedAt: previousFetchedAt, promise }

  try {
    const data = await promise
    return { data, cached: false }
  } catch (e) {
    if (previousData && previousData.length > 0) {
      return {
        data: previousData,
        cached: true,
        stale: true,
        staleAgeMs: previousFetchedAt > 0 ? Math.max(0, Date.now() - previousFetchedAt) : null,
      }
    }
    throw e
  }
}

async function fetchCreolabsLatestLeadFromObject(config) {
  return withEngineSession(config, CREOLABS_APP_ID, async (session) => {
    const objectResult = await session.call(session.docHandle, 'GetObject', [CREOLABS_LATEST_LEAD_OBJECT_ID])
    const objectHandle = Number(objectResult?.qReturn?.qHandle || 0)
    if (!objectHandle) throw new Error('Creolabs latest-lead object not found')

    const layoutResult = await session.call(objectHandle, 'GetLayout', [])
    const layout = unwrapLayout(layoutResult)
    const hypercube = layout?.qHyperCube
    if (!hypercube) throw new Error('Creolabs latest-lead object has no hypercube')

    const qSize = hypercube?.qSize || {}
    const totalRows = Math.max(0, Number(qSize.qcy || 0))
    const totalCols = Math.max(1, Number(qSize.qcx || 0))
    if (!totalRows) return null

    const pages = await session.call(objectHandle, 'GetHyperCubeData', [
      '/qHyperCubeDef',
      [{ qTop: 0, qLeft: 0, qHeight: Math.min(totalRows, 3000), qWidth: Math.min(totalCols, 50) }],
    ])
    const matrix = Array.isArray(pages?.qDataPages?.[0]?.qMatrix)
      ? pages.qDataPages[0].qMatrix
      : Array.isArray(pages?.[0]?.qMatrix)
        ? pages[0].qMatrix
        : []

    const dimensions = Array.isArray(hypercube?.qDimensionInfo)
      ? hypercube.qDimensionInfo.map((d) => safeText(d?.qFallbackTitle || d?.qGroupFallbackTitles?.[0]))
      : []
    const measures = Array.isArray(hypercube?.qMeasureInfo)
      ? hypercube.qMeasureInfo.map((m) => safeText(m?.qFallbackTitle || m?.qLabel))
      : []
    const headers = [...dimensions, ...measures]

    const idxClientId = findHeaderIndex(headers, /client\s*id/i)
    const idxClientName = findHeaderIndex(headers, /client\s*name/i)
    const idxClientEmail = findHeaderIndex(headers, /client\s*email/i)
    const idxDate = findHeaderIndex(headers, /^date$/i)
    const idxRiskLevel = findHeaderIndex(headers, /risk\s*level/i)
    const idxScore = findHeaderIndex(headers, /^score$/i)
    const idxLtvDeposit = findHeaderIndex(headers, /^ltv\s*deposit$/i)
    const idxDeposit = findHeaderIndex(headers, /^\$\s*deposit$/i)
    const idxDeposits = findHeaderIndex(headers, /^#\s*deposits$/i)

    if (idxClientId < 0 || idxDate < 0) {
      throw new Error('Creolabs latest-lead object missing required headers')
    }

    let best = null
    let bestDateNum = -1
    let bestDateIso = ''
    let bestClientIdNum = -1

    for (const row of matrix) {
      if (!Array.isArray(row)) continue
      const clientIdText = safeText(row[idxClientId]?.qText).trim()
      if (!clientIdText) continue

      const rowIsoDate = extractIsoDateFromRow(row) || (idxDate >= 0 ? extractIsoDateFromCell(row[idxDate]) : '')
      const dateRank = rowIsoDate ? Date.parse(`${rowIsoDate}T00:00:00.000Z`) : -1
      const clientIdNum = Number(clientIdText)
      const clientRank = Number.isFinite(clientIdNum) ? clientIdNum : -1

      if (dateRank > bestDateNum || (dateRank === bestDateNum && clientRank > bestClientIdNum)) {
        bestDateNum = dateRank
        bestDateIso = rowIsoDate
        bestClientIdNum = clientRank
        best = row
      }
    }

    if (!best) return null

    const isoDate = bestDateIso || extractIsoDateFromRow(best) || (idxDate >= 0 ? extractIsoDateFromCell(best[idxDate]) : '')
    const isoDateTime = isoDate ? `${isoDate}T00:00:00.000Z` : ''

    return {
      clientId: safeText(best[idxClientId]?.qText).trim(),
      clientName: idxClientName >= 0 ? safeText(best[idxClientName]?.qText).trim() : '',
      clientEmail: idxClientEmail >= 0 ? safeText(best[idxClientEmail]?.qText).trim() : '',
      riskLevel: idxRiskLevel >= 0 ? safeText(best[idxRiskLevel]?.qText).trim() : '',
      riskScore: idxScore >= 0 ? safeText(best[idxScore]?.qText).trim() : '',
      ltvDeposit: idxLtvDeposit >= 0 ? toFiniteNumber(best[idxLtvDeposit]?.qNum ?? parseLooseNumber(best[idxLtvDeposit]?.qText)) : 0,
      transactionDeposit: idxDeposit >= 0 ? toFiniteNumber(best[idxDeposit]?.qNum ?? parseLooseNumber(best[idxDeposit]?.qText)) : 0,
      depositsCount: idxDeposits >= 0 ? Math.round(toFiniteNumber(best[idxDeposits]?.qNum ?? parseLooseNumber(best[idxDeposits]?.qText))) : 0,
      transactionDate: isoDate,
      clientTimestamp: isoDateTime,
      lttDate: isoDateTime || '-',
      lastTimeComment: isoDateTime,
      status: 'active',
      sourceObjectId: CREOLABS_LATEST_LEAD_OBJECT_ID,
    }
  })
}

async function resolveCreolabsLatestLeadFromObject(config) {
  const cache = _creolabsLatestLeadObjectCache
  const age = cache?.fetchedAt ? Date.now() - cache.fetchedAt : Infinity
  if (cache?.data && age < CREOLABS_LATEST_LEAD_OBJECT_TTL) {
    return { data: cache.data, cached: true }
  }

  if (cache?.promise) {
    const data = await cache.promise
    return { data, cached: false }
  }

  const promise = fetchCreolabsLatestLeadFromObject(config)
    .then((data) => {
      _creolabsLatestLeadObjectCache = { data, fetchedAt: Date.now(), promise: null }
      return data
    })
    .catch((e) => {
      if (_creolabsLatestLeadObjectCache) _creolabsLatestLeadObjectCache.promise = null
      throw e
    })

  _creolabsLatestLeadObjectCache = { data: null, fetchedAt: 0, promise }
  const data = await promise
  return { data, cached: false }
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

  if (cacheEntry?.data) {
    if (!cacheEntry?.promise) {
      const refreshPromise = resolveCreolabsSnapshot(config)
        .then((snapshot) => projectCreolabsVariantFromSnapshot(snapshot.data, variant))
        .then((data) => {
          setCreolabsClientVariantCache(variant, { data, fetchedAt: Date.now(), promise: null, promiseStartedAt: 0 })
          return data
        })
        .catch((e) => {
          const current = getCreolabsClientVariantCache(variant)
          if (current) current.promise = null
          throw e
        })

      setCreolabsClientVariantCache(variant, {
        data: cacheEntry.data,
        fetchedAt: cacheEntry.fetchedAt,
        promise: refreshPromise,
        promiseStartedAt: Date.now(),
      })
    }

    return { data: cacheEntry.data, cached: true, stale: true }
  }

  if (cacheEntry?.promise) {
    const data = await cacheEntry.promise
    return { data, cached: false }
  }

  const promise = resolveCreolabsSnapshot(config)
    .then((snapshot) => projectCreolabsVariantFromSnapshot(snapshot.data, variant))
    .then((data) => {
      setCreolabsClientVariantCache(variant, { data, fetchedAt: Date.now(), promise: null, promiseStartedAt: 0 })
      return data
    })
    .catch((e) => {
      const current = getCreolabsClientVariantCache(variant)
      if (current) current.promise = null
      throw e
    })

  const nextCacheValue = { data: null, fetchedAt: 0, promise, promiseStartedAt: Date.now() }
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
 * after the cutoff date is included (e.g. for May 5 with days=30 ÔåÆ Apr+May).
 *
 * Lists:
 *   deposited  ÔÇô clients with deposit > 0 in the window
 *   withdrawn  ÔÇô clients with wd > 0 in the window
 *   inProfit   ÔÇô clients with (closedPl + openPl) > 0 in the window
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
    // Include any month whose last day >= cutoff ÔåÆ month rank >= cutoff month rank.
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

function isMissingIdentityValue(value) {
  const text = normalizeText(value)
  if (!text) return true
  return text.toUpperCase() === DB_LIVE_UNMAPPED_LABEL
}

function getClientIdCacheKeys(clientId) {
  const text = normalizeText(clientId)
  if (!text) return []
  const keys = [text]
  const num = Number(text)
  if (Number.isFinite(num)) keys.push(`n:${num}`)
  return keys
}

function ensureRegisteredUsersMetaCacheFresh() {
  if (!_registeredUsersMetaCacheTouchedAt) return
  if (Date.now() - _registeredUsersMetaCacheTouchedAt < REGISTERED_USERS_META_CACHE_TTL) return
  _registeredUsersMetaCacheByClient = new Map()
  _registeredUsersMetaCacheTouchedAt = 0
}

function mergeRegisteredUsersMeta(existing, incoming) {
  if (!existing) return { ...incoming }
  const merged = { ...existing }
  const keys = ['clientName', 'brand', 'affiliateId', 'clientLogin', 'user', 'country']
  for (const key of keys) {
    const value = normalizeText(incoming?.[key])
    if (value) merged[key] = value
  }
  return merged
}

function upsertRegisteredUsersMeta(candidate) {
  ensureRegisteredUsersMetaCacheFresh()
  const clientId = normalizeText(candidate?.clientId)
  if (!clientId) return

  const incoming = {
    clientId,
    clientName: normalizeText(candidate?.clientName),
    brand: normalizeText(candidate?.brand),
    affiliateId: normalizeText(candidate?.affiliateId),
    clientLogin: normalizeText(candidate?.clientLogin),
    user: normalizeText(candidate?.user),
    country: normalizeText(candidate?.country),
  }

  let merged = null
  const keys = getClientIdCacheKeys(clientId)
  for (const key of keys) {
    const existing = _registeredUsersMetaCacheByClient.get(key)
    merged = mergeRegisteredUsersMeta(merged || existing, incoming)
  }
  merged = mergeRegisteredUsersMeta(merged, incoming)

  for (const key of keys) {
    _registeredUsersMetaCacheByClient.set(key, merged)
  }
  _registeredUsersMetaCacheTouchedAt = Date.now()
}

function getRegisteredUsersMeta(clientId) {
  ensureRegisteredUsersMetaCacheFresh()
  for (const key of getClientIdCacheKeys(clientId)) {
    const cached = _registeredUsersMetaCacheByClient.get(key)
    if (cached) return cached
  }
  return null
}

function normalizeLooseIdentity(value) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, ' ').trim()
}

function buildIdentityFallbackKey(clientName, country, user) {
  const name = normalizeLooseIdentity(clientName)
  const ctry = normalizeLooseIdentity(country)
  const owner = normalizeLooseIdentity(user)
  if (!name || !ctry || !owner) return ''
  return `${name}|${ctry}|${owner}`
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
    const openedTrades = Math.round(toFiniteNumber(row?.openedTrades ?? row?.opened_trades))
    const equity = toFiniteNumber(row?.equity)
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
        openedTrades: 0,
        equity: 0,
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
      c.clientLogin = clientLogin || c.clientLogin
      c.user = user || c.user
      c.country = country || c.country
    }

    // Keep non-empty identity fields even if they are not from the latest month row.
    c.affiliateId = affiliateId || c.affiliateId
    c.clientLogin = clientLogin || c.clientLogin
    c.user = user || c.user
    c.country = country || c.country

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
    c.openedTrades += openedTrades
    if (equity !== 0) c.equity = equity // last non-zero wins
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

const PERIOD_MONTH_INDEX = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
}

function parsePeriodMeta(periodId) {
  const value = normalizeText(periodId)
  const match = value.match(/^(\d{4})-([A-Za-z]{3})$/)
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = PERIOD_MONTH_INDEX[match[2]]
  if (!Number.isFinite(year) || monthIndex == null) return null
  return { periodId: value, year, monthIndex }
}

function monthStartDate(periodId) {
  const meta = parsePeriodMeta(periodId)
  if (!meta) return null
  return new Date(Date.UTC(meta.year, meta.monthIndex, 1, 0, 0, 0))
}

function monthEndDate(periodId) {
  const meta = parsePeriodMeta(periodId)
  if (!meta) return null
  return new Date(Date.UTC(meta.year, meta.monthIndex + 1, 0, 23, 59, 59))
}

function daysInMonthFromPeriod(periodId) {
  const meta = parsePeriodMeta(periodId)
  if (!meta) return 30
  return new Date(Date.UTC(meta.year, meta.monthIndex + 1, 0)).getUTCDate()
}

function formatCompactCurrency(value) {
  const n = toFiniteNumber(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(toFiniteNumber(value))
}

function buildDerivedClientDatesRows(clientScores, latestPeriodId) {
  const latestStart = latestPeriodId ? monthStartDate(latestPeriodId) : new Date()
  return (clientScores || [])
    .filter((client) => normalizeText(client?.clientId))
    .map((client) => {
      const firstPeriod = normalizeText(client?.firstPeriodId) || normalizeText(client?.lastPeriodId) || latestPeriodId
      const lastPeriod = normalizeText(client?.lastPeriodId) || firstPeriod
      const clientTimestamp = monthStartDate(firstPeriod) || latestStart
      const ltdDate = monthStartDate(lastPeriod) || clientTimestamp
      const status = Number(client?.activeMonths || 0) > 6 ? 'active' : 'new'

      return {
        clientId: normalizeText(client?.clientId),
        clientTimestamp: clientTimestamp ? clientTimestamp.toISOString() : '',
        ltdDate: ltdDate ? ltdDate.toISOString() : '-',
        lttDate: ltdDate ? ltdDate.toISOString() : '-',
        kycTimestamp: clientTimestamp ? clientTimestamp.toISOString() : '',
        status,
        lastTimeComment: ltdDate ? ltdDate.toISOString() : '',
      }
    })
}

function buildDerivedClientDatesRowsFromClientMonths(clientMonthsRows, latestPeriodId) {
  const latestStart = latestPeriodId ? monthStartDate(latestPeriodId) : new Date()
  const byClient = new Map()

  for (const row of clientMonthsRows || []) {
    const clientId = normalizeText(row?.clientId)
    if (!clientId) continue
    const periodId = normalizeText(row?.periodId)
    if (!periodId) continue
    const rank = typeof ymRank === 'function' ? ymRank(periodId) : 0

    let entry = byClient.get(clientId)
    if (!entry) {
      entry = {
        clientId,
        firstPeriodId: null,
        lastPeriodId: null,
        firstDepositPeriodId: null,
        lastTradePeriodId: null,
        activeMonths: 0,
      }
      byClient.set(clientId, entry)
    }

    entry.activeMonths += 1

    if (!entry.firstPeriodId || (typeof ymRank === 'function' ? rank < ymRank(entry.firstPeriodId) : false)) {
      entry.firstPeriodId = periodId
    }
    if (!entry.lastPeriodId || (typeof ymRank === 'function' ? rank > ymRank(entry.lastPeriodId) : false)) {
      entry.lastPeriodId = periodId
    }

    const hasDeposit = toFiniteNumber(row?.deposit) > 0 || toFiniteNumber(row?.ftd) > 0
    if (hasDeposit) {
      if (!entry.firstDepositPeriodId || (typeof ymRank === 'function' ? rank < ymRank(entry.firstDepositPeriodId) : false)) {
        entry.firstDepositPeriodId = periodId
      }
    }

    if (toFiniteNumber(row?.trades) > 0) {
      if (!entry.lastTradePeriodId || (typeof ymRank === 'function' ? rank > ymRank(entry.lastTradePeriodId) : false)) {
        entry.lastTradePeriodId = periodId
      }
    }
  }

  return [...byClient.values()].map((client) => {
    const clientTimestamp = monthStartDate(client.firstPeriodId) || latestStart
    const ltdDate = client.firstDepositPeriodId ? monthStartDate(client.firstDepositPeriodId) : null
    const lttDate = client.lastTradePeriodId ? monthStartDate(client.lastTradePeriodId) : null
    const status = Number(client.activeMonths || 0) > 6 ? 'active' : 'new'

    return {
      clientId: client.clientId,
      clientTimestamp: clientTimestamp ? clientTimestamp.toISOString() : '',
      ltdDate: ltdDate ? ltdDate.toISOString() : '-',
      lttDate: lttDate ? lttDate.toISOString() : '-',
      kycTimestamp: clientTimestamp ? clientTimestamp.toISOString() : '',
      status,
      lastTimeComment: lttDate ? lttDate.toISOString() : (ltdDate ? ltdDate.toISOString() : ''),
    }
  })
}

function metricSeries(current, previous, { currentDays = 1, previousDays = 1, yoy = null } = {}) {
  const currentValue = toFiniteNumber(current)
  const previousValue = toFiniteNumber(previous)
  const yoyValue = yoy == null ? null : toFiniteNumber(yoy)
  const currentMtdDailyAverage = currentDays > 0 ? currentValue / currentDays : currentValue
  const previousComparableDailyAverage = previousDays > 0 ? previousValue / previousDays : previousValue
  const deltaPct = previousComparableDailyAverage > 0
    ? ((currentMtdDailyAverage - previousComparableDailyAverage) / previousComparableDailyAverage) * 100
    : 0
  const deltaYoyPct = yoyValue != null && yoyValue !== 0
    ? ((currentMtdDailyAverage - yoyValue) / yoyValue) * 100
    : null

  return {
    current: currentValue,
    previous: previousValue,
    currentMtdDailyAverage,
    previousComparableDailyAverage,
    deltaPct,
    deltaYoyPct,
  }
}

function buildCreolabsBoardSnapshotFromRows(clientMonthsRows, clientScoresRows = []) {
  const analytics = buildCreolabsAnalytics(clientMonthsRows, { topN: 10 })
  const monthlyRows = Array.isArray(analytics.monthly) ? analytics.monthly : []
  const latestMonth = monthlyRows.length ? monthlyRows[monthlyRows.length - 1] : null
  const previousMonth = monthlyRows.length > 1 ? monthlyRows[monthlyRows.length - 2] : null

  const latestMeta = parsePeriodMeta(latestMonth?.periodId)
  const today = new Date()
  const isCurrentMonth = Boolean(
    latestMeta && latestMeta.year === today.getUTCFullYear() && latestMeta.monthIndex === today.getUTCMonth()
  )
  const elapsedDays = latestMeta
    ? (isCurrentMonth ? today.getUTCDate() : daysInMonthFromPeriod(latestMonth.periodId))
    : 1
  const currentPeriodDays = latestMonth?.periodId ? daysInMonthFromPeriod(latestMonth.periodId) : 30
  const previousPeriodDays = previousMonth?.periodId ? daysInMonthFromPeriod(previousMonth.periodId) : currentPeriodDays

  const yoyMonth = latestMeta
    ? monthlyRows.find((row) => {
        const meta = parsePeriodMeta(row?.periodId)
        return meta && meta.year === latestMeta.year - 1 && meta.monthIndex === latestMeta.monthIndex
      })
    : null

  const latest = latestMonth || {}
  const prev = previousMonth || {}
  const yoy = yoyMonth || {}

  const kpis = {
    closedPl: metricSeries(latest.closedPl, prev.closedPl, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.closedPl,
    }),
    netDeposits: metricSeries(latest.net, prev.net, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.net,
    }),
    deposits: metricSeries(latest.deposit, prev.deposit, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.deposit,
    }),
    withdrawals: metricSeries(latest.wd, prev.wd, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.wd,
    }),
    activeUsers: metricSeries(latest.uniqueClients, prev.uniqueClients, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.uniqueClients,
    }),
    ftdCount: metricSeries(latest.ftd, prev.ftd, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.ftd,
    }),
    rdpCount: metricSeries(latest.rdp, prev.rdp, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.rdp,
    }),
    trades: metricSeries(latest.trades, prev.trades, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.trades,
    }),
    openPl: metricSeries(latest.openPl, prev.openPl, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.openPl,
    }),
    balance: metricSeries(latest.balance, prev.balance, {
      currentDays: elapsedDays,
      previousDays: previousPeriodDays,
      yoy: yoy.balance,
    }),
  }

  const comparison = [
    { kpi: 'Closed P&L', ...kpis.closedPl },
    { kpi: 'Net Deposits', ...kpis.netDeposits },
    { kpi: 'Deposits', ...kpis.deposits },
    { kpi: 'Withdrawals', ...kpis.withdrawals },
  ]

  const latestClientDates = buildDerivedClientDatesRows(clientScoresRows, latestMonth?.periodId)
  const registeredClientIds = new Set()
  const latestPeriodMeta = parsePeriodMeta(latestMonth?.periodId)
  for (const row of latestClientDates) {
    const regDate = row.clientTimestamp ? new Date(row.clientTimestamp) : null
    if (!latestPeriodMeta || !regDate || Number.isNaN(regDate.getTime())) continue
    if (regDate.getUTCFullYear() === latestPeriodMeta.year && regDate.getUTCMonth() === latestPeriodMeta.monthIndex) {
      registeredClientIds.add(row.clientId)
    }
  }

  const clientsInLatest = clientScoresRows.filter((client) => normalizeText(client?.lastPeriodId) === normalizeText(latestMonth?.periodId))
  const cohortClientsInLatest = clientsInLatest.filter((client) => registeredClientIds.has(normalizeText(client?.clientId)))
  const withFtd = new Set(cohortClientsInLatest.filter((client) => toFiniteNumber(client?.ftd) > 0).map((client) => normalizeText(client?.clientId)))
  const withQftd = new Set(cohortClientsInLatest.filter((client) => toFiniteNumber(client?.ftd) > 0 && toFiniteNumber(client?.rdp) > 0).map((client) => normalizeText(client?.clientId)))

  const funnel = {
    leads: toFiniteNumber(latest.uniqueClients),
    registrations: registeredClientIds.size || toFiniteNumber(latest.uniqueClients),
    withFtd: withFtd.size,
    withQftd: withQftd.size,
    ftdRate: registeredClientIds.size > 0 ? (withFtd.size / registeredClientIds.size) * 100 : 0,
    qftdRate: registeredClientIds.size > 0 ? (withQftd.size / registeredClientIds.size) * 100 : 0,
    registrationToQftdPct: registeredClientIds.size > 0 ? (withQftd.size / registeredClientIds.size) * 100 : 0,
  }

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    periodContext: {
      reportDate: latestMonth?.periodId ? (monthEndDate(latestMonth.periodId)?.toISOString() || new Date().toISOString()) : new Date().toISOString(),
      currentPeriod: latestMonth?.periodId || 'Current Period',
      previousPeriod: previousMonth?.periodId || '',
      currentPeriodStart: latestMonth?.periodId ? (monthStartDate(latestMonth.periodId)?.toISOString() || '') : '',
      currentPeriodEnd: latestMonth?.periodId ? (monthEndDate(latestMonth.periodId)?.toISOString() || '') : '',
      elapsedDays,
      totalDaysInMonth: currentPeriodDays,
    },
    kpis,
    funnel,
    comparison,
    clients: clientScoresRows.map((client) => {
      const firstPeriod = normalizeText(client?.firstPeriodId) || normalizeText(client?.lastPeriodId)
      const tenureStart = firstPeriod ? monthStartDate(firstPeriod) : null
      const tenureDays = tenureStart ? Math.max(0, Math.floor((Date.now() - tenureStart.getTime()) / 86400000)) : 0
      return {
        clientId: normalizeText(client?.clientId),
        clientName: normalizeText(client?.clientName),
        brand: normalizeText(client?.brand),
        affiliateId: normalizeText(client?.affiliateId),
        country: normalizeText(client?.country),
        ltv: toFiniteNumber(client?.commission || client?.net),
        tenureDays,
        totalTrades: toFiniteNumber(client?.trades),
        net: toFiniteNumber(client?.net),
        deposit: toFiniteNumber(client?.deposit),
        wd: toFiniteNumber(client?.wd),
        activeMonths: toFiniteNumber(client?.activeMonths),
        firstPeriodId: firstPeriod,
        lastPeriodId: normalizeText(client?.lastPeriodId),
      }
    }),
    monthly: monthlyRows,
  }
}

function buildLifetimeClustersFromClients(clientScoresRows) {
  const now = Date.now()
  const clients = (clientScoresRows || [])
    .filter((client) => normalizeText(client?.clientId))
    .map((client) => {
      const firstPeriod = normalizeText(client?.firstPeriodId) || normalizeText(client?.lastPeriodId)
      const lastPeriod = normalizeText(client?.lastPeriodId) || firstPeriod
      const tenureStart = firstPeriod ? monthStartDate(firstPeriod) : null
      const lastSeen = lastPeriod ? monthEndDate(lastPeriod) : null
      const tenureDays = tenureStart ? Math.max(0, Math.floor((now - tenureStart.getTime()) / 86400000)) : 0
      const recencyDays = lastSeen ? Math.max(0, Math.floor((now - lastSeen.getTime()) / 86400000)) : 9999
      const ltv = toFiniteNumber(client?.commission || client?.net)
      const totalTrades = toFiniteNumber(client?.trades)
      const activeMonths = toFiniteNumber(client?.activeMonths)
      let clusterId = 'core-growth'
      let label = 'Core Growth'

      if (activeMonths <= 1 && ltv <= 0 && totalTrades <= 1) {
        clusterId = 'churned'
        label = 'Churned'
      } else if (activeMonths <= 2 && ltv > 0) {
        clusterId = 'new-actives'
        label = 'New Actives'
      } else if (ltv < 0 || totalTrades < 5) {
        clusterId = 'at-risk'
        label = 'At Risk'
      } else if (activeMonths >= 6 && ltv > 0 && totalTrades >= 10) {
        clusterId = 'high-activity'
        label = 'High Activity'
      }

      return {
        clientId: normalizeText(client?.clientId),
        clientName: normalizeText(client?.clientName),
        clusterId,
        ltv,
        tenureDays,
        totalTrades,
        recencyDays,
        activeMonths,
        brand: normalizeText(client?.brand),
        affiliateId: normalizeText(client?.affiliateId),
        country: normalizeText(client?.country),
        clusterLabel: label,
      }
    })

  const clusterDefs = [
    { clusterId: 'high-activity', label: 'High Activity' },
    { clusterId: 'core-growth', label: 'Core Growth' },
    { clusterId: 'new-actives', label: 'New Actives' },
    { clusterId: 'at-risk', label: 'At Risk' },
    { clusterId: 'churned', label: 'Churned' },
  ]

  const clusters = clusterDefs.map((def) => {
    const members = clients.filter((client) => client.clusterId === def.clusterId)
    const clientCount = members.length
    const totalLtv = members.reduce((sum, client) => sum + client.ltv, 0)
    const totalTrades = members.reduce((sum, client) => sum + client.totalTrades, 0)
    const totalTenure = members.reduce((sum, client) => sum + client.tenureDays, 0)
    const totalRecency = members.reduce((sum, client) => sum + client.recencyDays, 0)

    return {
      clusterId: def.clusterId,
      label: def.label,
      clientCount,
      totalLtv,
      avgLtv: clientCount > 0 ? totalLtv / clientCount : 0,
      avgTenureDays: clientCount > 0 ? totalTenure / clientCount : 0,
      avgTrades: clientCount > 0 ? totalTrades / clientCount : 0,
      avgRecencyDays: clientCount > 0 ? totalRecency / clientCount : 0,
    }
  })

  const activeClients = clusters
    .filter((cluster) => cluster.clusterId !== 'churned')
    .reduce((sum, cluster) => sum + cluster.clientCount, 0)

  const churnedCluster = clusters.find((cluster) => cluster.clusterId === 'churned') || { clientCount: 0, totalLtv: 0 }

  return {
    clients,
    clusters,
    inactiveSegment: {
      clientCount: churnedCluster.clientCount,
      totalLtv: churnedCluster.totalLtv,
    },
    metadata: {
      validClients: clients.length,
      activeClients,
      churnedClients: churnedCluster.clientCount,
      generatedAt: new Date().toISOString(),
    },
  }
}

async function handleCreolabsClientDates(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  try {
    const { data } = await resolveCreolabsClientVariant(config, 'clientMonths')
    const rows = buildDerivedClientDatesRowsFromClientMonths(Array.isArray(data?.clientMonths) ? data.clientMonths : [], data?.periodTo)
    return json(res, 200, { ok: true, data: { rows } }, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(res, e?.status || 502, { ok: false, error: e?.message || 'Creolabs client-dates request failed', details: e?.details || '' }, { 'Cache-Control': 'no-store' })
  }
}

function parseIsoDateBoundary(raw, { endOfDay = false } = {}) {
  const text = normalizeText(raw)
  if (!text) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'
    const ms = Date.parse(`${text}${suffix}`)
    return Number.isFinite(ms) ? ms : null
  }

  const ms = Date.parse(text)
  if (!Number.isFinite(ms)) return null
  if (!endOfDay) return ms

  const d = new Date(ms)
  d.setUTCHours(23, 59, 59, 999)
  return d.getTime()
}

function toCsvCell(value) {
  const raw = value == null ? '' : String(value)
  const escaped = raw.replace(/"/g, '""')
  return `"${escaped}"`
}

function toCsv(rows, columns) {
  const header = columns.map(toCsvCell).join(',')
  const lines = rows.map((row) => columns.map((col) => toCsvCell(row?.[col])).join(','))
  return [header, ...lines].join('\n')
}

async function buildCreolabsRegisteredUsersDataset(req) {
  hydrateDbLiveIngestionMetaFromDisk()

  const config = getConfig()
  if (!config.hasOauth && !config.hasApiKey) {
    const error = new Error('Qlik handler not configured. Set QLIK_TENANT_URL and OAuth M2M credentials or QLIK_API_KEY.')
    error.status = 503
    throw error
  }

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  const fromRaw = urlObj.searchParams.get('from') || DB_LIVE_BOOTSTRAP_FROM
  const toRaw = urlObj.searchParams.get('to') || nowIsoDateOnly()
  const format = normalizeText(urlObj.searchParams.get('format') || 'json').toLowerCase()
  const allowMonthFallback = normalizeText(urlObj.searchParams.get('monthFallback')) === '1'
  const includeProvenance = normalizeText(urlObj.searchParams.get('provenance')) === '1'
  const preferLive = normalizeText(urlObj.searchParams.get('preferLive') || '0') === '1'
  const shouldLoadMonthSource = allowMonthFallback

  const fromMs = parseIsoDateBoundary(fromRaw, { endOfDay: false })
  const toMs = parseIsoDateBoundary(toRaw, { endOfDay: true })
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
    const error = new Error('Invalid date range. Use ?from=YYYY-MM-DD&to=YYYY-MM-DD')
    error.status = 400
    throw error
  }

  let monthsRows = []
  let monthsFromArtifact = false
  let latestPeriodTo = ''
  let clientMonthsError = ''

  if (shouldLoadMonthSource) {
    if (preferLive) {
      try {
        const resolvedClientMonths = await resolveCreolabsClientVariant(config, 'clientMonths')
        const monthData = resolvedClientMonths?.data || {}
        monthsRows = Array.isArray(monthData?.clientMonths) ? monthData.clientMonths : []
        latestPeriodTo = normalizeText(monthData?.periodTo)
      } catch (monthError) {
        clientMonthsError = normalizeText(monthError?.message)
        monthsRows = []
        latestPeriodTo = ''
      }
    } else {
      const clientMonthsCache = getCreolabsClientVariantCache('clientMonths')
      if (Array.isArray(clientMonthsCache?.data?.clientMonths) && clientMonthsCache.data.clientMonths.length > 0) {
        monthsRows = clientMonthsCache.data.clientMonths
        latestPeriodTo = normalizeText(clientMonthsCache.data?.periodTo)
      } else {
        resolveCreolabsClientVariant(config, 'clientMonths').catch(() => {})
      }
    }

    let localArtifactRows = []
    let localArtifactPeriodTo = ''
    try {
      const resolvedLocalArtifact = await resolveCreolabsTradersRankingRewardsRows()
      const artifactData = resolvedLocalArtifact?.data || {}
      localArtifactRows = Array.isArray(artifactData?.rows) ? artifactData.rows : []
      localArtifactPeriodTo = normalizeText(artifactData?.periodTo)
    } catch {
      localArtifactRows = []
    }

    if (!monthsRows.length && localArtifactRows.length > 0) {
      monthsRows = localArtifactRows
      monthsFromArtifact = true
      latestPeriodTo = localArtifactPeriodTo || latestPeriodTo
    }
  }

  const scores = buildCreolabsClientScores(monthsRows)
  for (const score of scores) {
    upsertRegisteredUsersMeta(score)
  }

  const identityCandidates = new Map()
  for (const score of scores) {
    const key = buildIdentityFallbackKey(score?.clientName, score?.country, score?.user)
    const affiliateId = normalizeText(score?.affiliateId)
    const clientLogin = normalizeText(score?.clientLogin)
    if (!key) continue
    if (!affiliateId && !clientLogin) continue
    if (!identityCandidates.has(key)) identityCandidates.set(key, [])
    identityCandidates.get(key).push({
      clientId: normalizeText(score?.clientId),
      affiliateId,
      clientLogin,
    })
  }

  const identityFallbackUnique = new Map()
  for (const [key, entries] of identityCandidates.entries()) {
    const uniqueClientIds = new Set(entries.map((entry) => normalizeText(entry?.clientId)).filter(Boolean))
    if (uniqueClientIds.size !== 1) continue
    const best = entries.find((entry) => normalizeText(entry?.affiliateId) || normalizeText(entry?.clientLogin)) || entries[0]
    identityFallbackUnique.set(key, {
      affiliateId: normalizeText(best?.affiliateId),
      clientLogin: normalizeText(best?.clientLogin),
    })
  }

  const scoreByClient = new Map()
  for (const score of scores) {
    const sid = normalizeText(score?.clientId)
    if (!sid) continue
    if (!scoreByClient.has(sid)) scoreByClient.set(sid, score)
    const sidNum = Number(sid)
    if (Number.isFinite(sidNum)) {
      const numericKey = `n:${sidNum}`
      if (!scoreByClient.has(numericKey)) scoreByClient.set(numericKey, score)
    }
  }

  let sourceRows = []
  let sourceMode = 'client-months'
  let sourceDiagnostics = {
    clientMonthsError,
  }
  let metadataCacheHits = 0
  let identityFallbackHits = 0
  let storeFallbackHits = 0

  const storeByClient = _dbLiveIngestionState?.storeByClient instanceof Map
    ? _dbLiveIngestionState.storeByClient
    : new Map()

  let leadRows = []
  let leadCached = false
  let leadStale = false
  let leadStaleAgeMs = null
  let leadObjectError = ''

  try {
    const resolvedLeads = await withTimeout(
      resolveCreolabsRegisteredLeadsFromObject(config),
      REGISTERED_LEADS_OBJECT_TIMEOUT_MS,
      'Creolabs registered-leads object'
    )
    leadRows = Array.isArray(resolvedLeads?.data) ? resolvedLeads.data : []
    leadCached = Boolean(resolvedLeads?.cached)
    leadStale = Boolean(resolvedLeads?.stale)
    leadStaleAgeMs = Number.isFinite(Number(resolvedLeads?.staleAgeMs))
      ? Number(resolvedLeads?.staleAgeMs)
      : null
  } catch (leadError) {
    leadObjectError = normalizeText(leadError?.message)
    leadRows = []
  }

  if (leadRows.length > 0) {
    sourceRows = leadRows
    sourceMode = 'lead-object'
    sourceDiagnostics = {
      ...sourceDiagnostics,
      leadObjectRows: leadRows.length,
      leadObjectCached: leadCached,
      leadObjectStale: leadStale,
      leadObjectStaleAgeMs: leadStaleAgeMs,
      clientMonthsRows: monthsRows.length,
    }
  } else {
    const canUseMonthFallback = allowMonthFallback && monthsRows.length > 0
    let fallbackRows = canUseMonthFallback ? monthsRows.map(toDbLiveMonthRow) : []
    let fallbackSourceObjectId = canUseMonthFallback
      ? (monthsFromArtifact ? 'public/traders_ranking_rewards_table.json' : CREOLABS_CLIENTS_OBJ)
      : ''
    let storeFallbackRows = 0

    if (!canUseMonthFallback) {
      const lastRunSourceMode = normalizeText(_dbLiveIngestionState?.lastRun?.sourceMode).toLowerCase()
      const storeEligible =
        lastRunSourceMode === 'lead-object' ||
        lastRunSourceMode === 'local-artifact-recovery' ||
        lastRunSourceMode === 'local-artifact'

      if (storeEligible) {
        const storeUsers = getDbLiveUsersSnapshot()
        if (storeUsers.length > 0) {
          fallbackRows = storeUsers.map((row) => ({
            ...row,
            sourceObjectId: normalizeText(row?.sourceObjectId || 'db-live-store'),
          }))
          storeFallbackRows = fallbackRows.length
          fallbackSourceObjectId = 'db-live-store'
        }
      }
    }

    sourceRows = fallbackRows
    sourceMode = canUseMonthFallback
      ? (monthsFromArtifact ? 'local-artifact-fallback' : 'client-months-fallback')
      : (fallbackRows.length > 0 ? 'db-live-store-fallback' : 'no-source')
    sourceDiagnostics = {
      ...sourceDiagnostics,
      leadObjectRows: 0,
      leadObjectCached: leadCached,
      leadObjectStale: leadStale,
      leadObjectStaleAgeMs: leadStaleAgeMs,
      leadObjectError,
      fallbackRows: fallbackRows.length,
      storeFallbackRows,
      clientMonthsRows: monthsRows.length,
      sourceObjectId: fallbackSourceObjectId,
    }
  }

  const users = []
  for (const row of sourceRows) {
    const ts = normalizeText(row?.clientTimestamp)
    const tsMs = ts ? Date.parse(ts) : NaN
    if (!Number.isFinite(tsMs)) continue
    if (tsMs < fromMs || tsMs > toMs) continue

    const normalizedStatus = normalizeText(row?.status).toLowerCase()
    if (sourceMode === 'lead-object' && CREOLABS_LEAD_EXCLUDED_STATUSES.has(normalizedStatus)) {
      continue
    }

    const clientId = normalizeText(row?.clientId)
    const clientIdNum = Number(clientId)
    const storeKey = getDbLiveStoreKey(row)
    const storeUser =
      storeByClient.get(storeKey) ||
      storeByClient.get(clientId) ||
      (Number.isFinite(clientIdNum) ? storeByClient.get(String(clientIdNum)) : null) ||
      null
    const score =
      scoreByClient.get(clientId) ||
      (Number.isFinite(clientIdNum) ? scoreByClient.get(`n:${clientIdNum}`) : null) ||
      null
    const cachedMeta = getRegisteredUsersMeta(clientId)
    if (cachedMeta) metadataCacheHits += 1

    const identityKey = buildIdentityFallbackKey(
      row?.clientName || score?.clientName || cachedMeta?.clientName,
      row?.country || score?.country || cachedMeta?.country,
      row?.user || score?.user || cachedMeta?.user
    )
    const identityFallback = identityKey ? identityFallbackUnique.get(identityKey) : null

    const pickSourceValue = (valueChain) => {
      for (const item of valueChain) {
        const value = normalizeText(item?.value)
        if (value) return { value, source: item.source }
      }
      return { value: '', source: 'missing' }
    }

    const affiliatePicked = pickSourceValue([
      { source: 'lead', value: row?.affiliateId },
      { source: 'score', value: score?.affiliateId },
      { source: 'cache', value: cachedMeta?.affiliateId },
      { source: 'identity', value: identityFallback?.affiliateId },
      { source: 'store', value: storeUser?.affiliateId },
    ])
    const loginPicked = pickSourceValue([
      { source: 'lead', value: row?.clientLogin },
      { source: 'score', value: score?.clientLogin },
      { source: 'cache', value: cachedMeta?.clientLogin },
      { source: 'identity', value: identityFallback?.clientLogin },
      { source: 'store', value: storeUser?.clientLogin },
    ])
    const namePicked = pickSourceValue([
      { source: 'lead', value: row?.clientName },
      { source: 'score', value: score?.clientName },
      { source: 'cache', value: cachedMeta?.clientName },
    ])
    const countryPicked = pickSourceValue([
      { source: 'lead', value: row?.country },
      { source: 'score', value: score?.country },
      { source: 'cache', value: cachedMeta?.country },
    ])
    const userPicked = pickSourceValue([
      { source: 'lead', value: row?.user },
      { source: 'score', value: score?.user },
      { source: 'cache', value: cachedMeta?.user },
    ])
    const brandPicked = pickSourceValue([
      { source: 'lead', value: row?.brand },
      { source: 'score', value: score?.brand },
      { source: 'cache', value: cachedMeta?.brand },
      { source: 'store', value: storeUser?.brand },
    ])

    const pickNumericSourceValue = (valueChain, { preferNonZero = false } = {}) => {
      if (preferNonZero) {
        for (const item of valueChain) {
          const n = Number(item?.value)
          if (Number.isFinite(n) && n !== 0) return { value: n, source: item.source }
        }
      }

      for (const item of valueChain) {
        const n = Number(item?.value)
        if (Number.isFinite(n)) return { value: n, source: item.source }
      }
      return { value: 0, source: 'missing' }
    }

    const openedTradesPicked = pickNumericSourceValue([
      { source: 'lead', value: row?.openedTrades ?? row?.opened_trades },
      { source: 'score', value: score?.openedTrades },
      { source: 'store', value: storeUser?.openedTrades },
      { source: 'lead-trades-fallback', value: row?.trades },
      { source: 'score-trades-fallback', value: score?.trades },
      { source: 'store-trades-fallback', value: storeUser?.trades },
    ], { preferNonZero: true })

    const equityPicked = pickNumericSourceValue([
      { source: 'lead', value: row?.equity },
      { source: 'score', value: score?.equity },
      { source: 'store', value: storeUser?.equity },
      { source: 'lead-derived-balance-openpl', value: toFiniteNumber(row?.balance) + toFiniteNumber(row?.openPl) },
      { source: 'score-derived-balance-openpl', value: toFiniteNumber(score?.balance) + toFiniteNumber(score?.openPl) },
      { source: 'lead-balance-fallback', value: row?.balance },
      { source: 'score-balance-fallback', value: score?.balance },
      { source: 'store-balance-fallback', value: storeUser?.balance },
    ], { preferNonZero: true })

    const enrichedUser = {
      clientId,
      clientName: namePicked.value,
      brand: brandPicked.value,
      affiliateId: affiliatePicked.value,
      clientLogin: loginPicked.value,
      user: userPicked.value,
      country: countryPicked.value,
      clientTimestamp: ts,
      kycTimestamp: normalizeText(row?.kycTimestamp || ts),
      status: normalizeText(row?.status),
      ltdDate: normalizeText(row?.ltdDate),
      lttDate: normalizeText(row?.lttDate),
      lastTimeComment: normalizeText(row?.lastTimeComment || row?.lttDate || row?.ltdDate),
      firstPeriodId: normalizeText(score?.firstPeriodId),
      lastPeriodId: normalizeText(score?.lastPeriodId),
      activeMonths: Math.round(toFiniteNumber(score?.activeMonths)),
      deposit: toFiniteNumber(row?.deposit || score?.deposit),
      wd: toFiniteNumber(row?.wd || score?.wd),
      net: toFiniteNumber(row?.net || score?.net),
      closedPl: toFiniteNumber(row?.closedPl || score?.closedPl),
      openPl: toFiniteNumber(row?.openPl || score?.openPl),
      commission: toFiniteNumber(
        row?.commission ??
        row?.commissionAff ??
        row?.transactionCommission ??
        row?.transCommission ??
        score?.commission ??
        storeUser?.commission
      ),
      commissionAff: toFiniteNumber(
        row?.commissionAff ??
        row?.transactionCommission ??
        row?.transCommission ??
        row?.commission ??
        score?.commission ??
        storeUser?.commission
      ),
      trades: Math.round(toFiniteNumber(row?.trades || score?.trades)),
      openedTrades: Math.round(openedTradesPicked.value),
      ftd: toFiniteNumber(row?.ftd || score?.ftd),
      rdp: toFiniteNumber(row?.rdp || score?.rdp),
      balance: toFiniteNumber(row?.balance || score?.balance),
      equity: toFiniteNumber(equityPicked.value),
      sourcePeriod: normalizeText(row?.sourcePeriod || row?.periodId || score?.lastPeriodId),
      sourceObjectId: normalizeText(row?.sourceObjectId),
    }

    if (includeProvenance) {
      enrichedUser.enrichmentSources = {
        affiliateId: affiliatePicked.source,
        clientLogin: loginPicked.source,
        clientName: namePicked.source,
        country: countryPicked.source,
        user: userPicked.source,
        brand: brandPicked.source,
        openedTrades: openedTradesPicked.source,
        equity: equityPicked.source,
      }
    }

    if (identityFallback && (!normalizeText(row?.affiliateId) || !normalizeText(row?.clientLogin))) {
      identityFallbackHits += 1
    }
    if ((affiliatePicked.source === 'store' || loginPicked.source === 'store') && storeUser) {
      storeFallbackHits += 1
    }

    upsertRegisteredUsersMeta(enrichedUser)
    users.push(enrichedUser)
  }

  users.sort((a, b) => {
    const at = Date.parse(a.clientTimestamp)
    const bt = Date.parse(b.clientTimestamp)
    if (at !== bt) return bt - at
    return Number(normalizeText(b.clientId)) - Number(normalizeText(a.clientId))
  })

  const queryKpis = aggregateCreolabsUserKpis(users)
  let volumeKpis = queryKpis
  let volumeKpisSource = sourceMode

  if (monthsRows.length > 0) {
    const monthRowsFiltered = applyDbLiveFilters(monthsRows.map(toDbLiveMonthRow), urlObj).filter((user) => {
      const ts = normalizeText(user?.clientTimestamp)
      const tsMs = ts ? Date.parse(ts) : NaN
      return Number.isFinite(tsMs) && tsMs >= fromMs && tsMs <= toMs
    })
    if (monthRowsFiltered.length > 0) {
      volumeKpis = aggregateCreolabsUserKpis(monthRowsFiltered)
      volumeKpisSource = monthsFromArtifact ? 'local-artifact' : 'client-months'
    }
  }

  if ((sourceMode === 'lead-object') && (volumeKpis === queryKpis)) {
    const storeSnapshot = getDbLiveUsersSnapshot()
    if (storeSnapshot.length > users.length) {
      const storeFiltered = applyDbLiveFilters(storeSnapshot, urlObj).filter((user) => {
        const ts = normalizeText(user?.clientTimestamp)
        const tsMs = ts ? Date.parse(ts) : NaN
        return Number.isFinite(tsMs) && tsMs >= fromMs && tsMs <= toMs
      })
      if (storeFiltered.length > 0) {
        volumeKpis = aggregateCreolabsUserKpis(storeFiltered)
        volumeKpisSource = 'db-live-store'
      }
    }
  }

  const meta = {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    total: users.length,
    queryKpis,
    volumeKpis,
    volumeKpisSource,
    sourceRows: {
      clientMonths: monthsRows.length,
      leadRows: sourceRows.length,
      clientScores: scores.length,
      sourceMode,
      metadataCacheSize: _registeredUsersMetaCacheByClient.size,
      metadataCacheHits,
      identityFallbackHits,
      identityFallbackKeys: identityFallbackUnique.size,
      storeFallbackHits,
      ...sourceDiagnostics,
    },
    note: sourceMode === 'client-months'
      ? 'Client-months source in use: historical month-grain rows from the all-time clients table.'
      : sourceMode === 'lead-object'
        ? 'Lead object source in use: Client Timestamp rows deduped by clientId.'
        : sourceMode === 'client-months-fallback'
          ? 'Fallback source in use: clientTimestamp is month-grain in current source dataset.'
          : 'No source available in time window: both lead-object and client-months timed out or unavailable.',
  }

  return {
    urlObj,
    format,
    fromMs,
    toMs,
    meta,
    users,
  }
}

function encodeDbLiveCursor(offset) {
  const raw = JSON.stringify({ offset: Math.max(0, Number(offset) || 0) })
  return Buffer.from(raw, 'utf8').toString('base64')
}

function decodeDbLiveCursor(cursor) {
  try {
    const raw = Buffer.from(String(cursor || ''), 'base64').toString('utf8')
    const parsed = JSON.parse(raw)
    const offset = Number(parsed?.offset)
    return Number.isFinite(offset) && offset >= 0 ? Math.trunc(offset) : 0
  } catch {
    return 0
  }
}

function isoDateOnlyFromMs(ms) {
  const d = new Date(ms)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function nowIsoDateOnly() {
  return isoDateOnlyFromMs(Date.now())
}

function localIsoDateOnlyFromMs(ms) {
  const d = new Date(ms)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function nowLocalIsoDateOnly() {
  return localIsoDateOnlyFromMs(Date.now())
}

function subtractDaysIsoDateOnly(isoDate, days) {
  const ms = parseIsoDateBoundary(isoDate, { endOfDay: false })
  if (!Number.isFinite(ms)) return nowIsoDateOnly()
  return isoDateOnlyFromMs(ms - Math.max(1, Number(days) || 1) * 24 * 60 * 60 * 1000)
}

function mergeDbLiveUsersByRecency(existingUser, incomingUser) {
  if (!existingUser) return incomingUser
  const aTs = Date.parse(normalizeText(existingUser?.clientTimestamp))
  const bTs = Date.parse(normalizeText(incomingUser?.clientTimestamp))
  const incomingIsNewer = Number.isFinite(bTs) && (!Number.isFinite(aTs) || bTs >= aTs)

  const primary = incomingIsNewer ? incomingUser : existingUser
  const secondary = incomingIsNewer ? existingUser : incomingUser
  const merged = { ...primary }

  const backfillKeys = ['affiliateId', 'clientLogin', 'clientName', 'country', 'user', 'brand']
  for (const key of backfillKeys) {
    if (!normalizeText(merged?.[key]) && normalizeText(secondary?.[key])) {
      merged[key] = secondary[key]
    }
  }

  const numericBackfillKeys = ['openedTrades', 'equity']
  for (const key of numericBackfillKeys) {
    const mergedValue = Number(merged?.[key])
    const secondaryValue = Number(secondary?.[key])
    if ((!Number.isFinite(mergedValue) || mergedValue === 0) && Number.isFinite(secondaryValue) && secondaryValue !== 0) {
      merged[key] = secondaryValue
    }
  }

  return merged
}

function getDbLiveStoreKey(user) {
  const clientId = normalizeText(user?.clientId)
  const sourcePeriod = normalizeText(user?.sourcePeriod)
  const clientTimestamp = normalizeText(user?.clientTimestamp)
  const sourceObjectId = normalizeText(user?.sourceObjectId)
  return [clientId || 'no-client', sourcePeriod || clientTimestamp || 'no-period', sourceObjectId || 'db-live'].join('|')
}

function getCreolabsTradersRankingRewardsTablePath() {
  return resolveCreolabsTradersRankingRewardsTableSource().filePath
}

async function resolveCreolabsTradersRankingRewardsRows() {
  const source = resolveCreolabsTradersRankingRewardsTableSource()
  const sourceFilePath = source.filePath
  const sourceObjectId = source.sourceObjectId
  const sourceType = source.sourceType
  let sourceMtimeMs = 0
  try {
    sourceMtimeMs = Number(fs.statSync(sourceFilePath)?.mtimeMs || 0)
  } catch {
    sourceMtimeMs = 0
  }

  const cache = _creolabsTradersRankingRewardsTableCache
  if (
    cache?.data &&
    normalizeText(cache?.filePath) === sourceFilePath &&
    Number(cache?.fileMtimeMs || 0) === sourceMtimeMs
  ) {
    return { data: cache.data, cached: true }
  }
  if (cache?.promise) {
    if (
      normalizeText(cache?.filePath) === sourceFilePath &&
      Number(cache?.fileMtimeMs || 0) === sourceMtimeMs
    ) {
      const data = await cache.promise
      return { data, cached: false }
    }
  }

  const promise = (async () => {
    const raw = await fs.promises.readFile(sourceFilePath, 'utf8')
    const parsed = JSON.parse(raw)

    const mapObjectRows = (objectRows) => {
      const mapped = (objectRows || []).map((row) => {
        const periodId = normalizeText(row?.periodId || row?.year_month || row?.yearMonth || row?.sourcePeriod)
        const clientTimestamp = normalizeText(row?.clientTimestamp || row?.client_timestamp)

        return {
          affiliateId: normalizeText(row?.affiliateId || row?.affiliate_id),
          clientId: normalizeText(row?.clientId || row?.client_id),
          clientName: normalizeText(row?.clientName || row?.client_name),
          clientLogin: normalizeText(row?.clientLogin || row?.client_login),
          user: normalizeText(row?.user),
          country: normalizeText(row?.country),
          brand: normalizeText(row?.brand) || 'CREOLABS',
          balance: toFiniteNumber(row?.balance),
          commission: toFiniteNumber(row?.commission || row?.ltv_commission),
          closedPl: toFiniteNumber(row?.closedPl || row?.closed_pl),
          openPl: toFiniteNumber(row?.openPl || row?.open_pl),
          trades: Math.round(toFiniteNumber(row?.trades)),
          ftd: toFiniteNumber(row?.ftd),
          rdp: toFiniteNumber(row?.rdp),
          deposit: toFiniteNumber(row?.deposit),
          wd: toFiniteNumber(row?.wd),
          net: toFiniteNumber(row?.net),
          openedTrades: Math.round(toFiniteNumber(row?.openedTrades || row?.opened_trades)),
          equity: toFiniteNumber(row?.equity),
          clientTimestamp,
          kycTimestamp: normalizeText(row?.kycTimestamp || row?.kyc_timestamp) || clientTimestamp,
          ltdDate: normalizeText(row?.ltdDate || row?.ltd_date),
          lttDate: normalizeText(row?.lttDate || row?.ltt_date),
          lastTimeComment:
            normalizeText(row?.lastTimeComment || row?.last_time_comment) ||
            normalizeText(row?.lttDate || row?.ltt_date) ||
            normalizeText(row?.ltdDate || row?.ltd_date) ||
            clientTimestamp,
          status: normalizeText(row?.status) || 'active',
          periodId,
          sourcePeriod: normalizeText(row?.sourcePeriod || row?.source_period) || periodId,
          sourceObjectId: normalizeText(row?.sourceObjectId || row?.source_object_id) || sourceObjectId,
        }
      })

      const periods = mapped
        .map((row) => normalizeText(row?.periodId || row?.sourcePeriod))
        .filter(Boolean)
        .sort((a, b) => ymRank(a) - ymRank(b))

      return {
        rows: mapped,
        periodFrom: periods[0] || normalizeText(parsed?.periodFrom),
        periodTo: periods[periods.length - 1] || normalizeText(parsed?.periodTo),
        rowCount: mapped.length,
        sourceType,
      }
    }

    if (Array.isArray(parsed?.rows) && parsed.rows.length > 0 && typeof parsed.rows[0] === 'object') {
      return mapObjectRows(parsed.rows)
    }

    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      return mapObjectRows(parsed)
    }

    const headers = Array.isArray(parsed?.headers) ? parsed.headers.map((header) => normalizeText(header).toLowerCase()) : []
    const rows = Array.isArray(parsed?.rows) ? parsed.rows : []

    const idx = new Map(headers.map((header, index) => [header, index]))
    const pick = (row, names) => {
      for (const name of names) {
        const key = normalizeText(name).toLowerCase()
        const columnIndex = idx.get(key)
        if (columnIndex == null) continue
        const value = row[columnIndex]
        if (value != null && value !== '') return value
      }
      return ''
    }

    const mapped = rows.map((row) => {
      const periodId = normalizeText(pick(row, ['year_month']))
      const clientTimestamp = normalizeText(pick(row, ['client_timestamp']))
      return {
        affiliateId: normalizeText(pick(row, ['affiliate_id'])),
        clientId: normalizeText(pick(row, ['client_id'])),
        clientName: normalizeText(pick(row, ['client_name'])),
        clientLogin: normalizeText(pick(row, ['client_login'])),
        user: normalizeText(pick(row, ['user'])),
        country: normalizeText(pick(row, ['country'])),
        brand: 'CREOLABS',
        balance: toFiniteNumber(pick(row, ['balance'])),
        commission: toFiniteNumber(pick(row, ['ltv_commission'])),
        closedPl: toFiniteNumber(pick(row, ['closed_pl'])),
        openPl: toFiniteNumber(pick(row, ['open_pl'])),
        trades: Math.round(toFiniteNumber(pick(row, ['trades']))),
        ftd: toFiniteNumber(pick(row, ['ftd'])),
        rdp: toFiniteNumber(pick(row, ['rdp'])),
        deposit: toFiniteNumber(pick(row, ['deposit'])),
        wd: toFiniteNumber(pick(row, ['wd'])),
        net: toFiniteNumber(pick(row, ['net'])),
        openedTrades: Math.round(toFiniteNumber(pick(row, ['opened_trades']))),
        equity: toFiniteNumber(pick(row, ['equity'])),
        clientTimestamp,
        kycTimestamp: clientTimestamp,
        ltdDate: normalizeText(pick(row, ['ltd_date'])),
        lttDate: normalizeText(pick(row, ['ltt_date'])),
        lastTimeComment: normalizeText(pick(row, ['ltt_date'])) || normalizeText(pick(row, ['ltd_date'])) || clientTimestamp,
        status: 'active',
        periodId,
        sourcePeriod: periodId,
        sourceObjectId,
      }
    })

    const periods = mapped
      .map((row) => normalizeText(row?.periodId))
      .filter(Boolean)
      .sort((a, b) => ymRank(a) - ymRank(b))
    const periodFrom = periods[0] || ''
    const periodTo = periods[periods.length - 1] || ''

    return {
      rows: mapped,
      periodFrom,
      periodTo,
      rowCount: mapped.length,
      sourceType,
    }
  })()

  _creolabsTradersRankingRewardsTableCache = {
    data: null,
    promise,
    filePath: sourceFilePath,
    fileMtimeMs: sourceMtimeMs,
  }
  try {
    const data = await promise
    _creolabsTradersRankingRewardsTableCache = {
      data,
      promise: null,
      filePath: sourceFilePath,
      fileMtimeMs: sourceMtimeMs,
    }
    return { data, cached: false }
  } catch (error) {
    _creolabsTradersRankingRewardsTableCache = null
    throw error
  }
}

function persistCreolabsLiveArtifactRows(rows, context = {}) {
  const users = Array.isArray(rows) ? rows : []
  if (!users.length) {
    return {
      written: false,
      reason: 'empty-rows',
      filePath: getCreolabsLiveArtifactPath(),
    }
  }

  const filePath = getCreolabsLiveArtifactPath()
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const mappedRows = users.map((user) => {
    const periodId = normalizeText(user?.sourcePeriod || user?.periodId || user?.year_month)
    return {
      ...user,
      periodId,
      sourcePeriod: periodId,
      year_month: periodId,
      client_timestamp: normalizeText(user?.clientTimestamp || user?.client_timestamp),
      kyc_timestamp: normalizeText(user?.kycTimestamp || user?.kyc_timestamp),
      ltd_date: normalizeText(user?.ltdDate || user?.ltd_date),
      ltt_date: normalizeText(user?.lttDate || user?.ltt_date),
      sourceObjectId: normalizeText(user?.sourceObjectId || CREOLABS_REGISTERED_LEADS_OBJECT_ID),
    }
  })

  const periods = mappedRows
    .map((row) => normalizeText(row?.periodId || row?.sourcePeriod))
    .filter(Boolean)
    .sort((a, b) => ymRank(a) - ymRank(b))

  const payload = {
    contractVersion: 'creolabs-live-artifact-v1',
    generatedAt: new Date().toISOString(),
    sourceMode: normalizeText(context?.sourceMode) || 'lead-object',
    from: normalizeText(context?.from),
    to: normalizeText(context?.to),
    periodFrom: periods[0] || '',
    periodTo: periods[periods.length - 1] || '',
    rowCount: mappedRows.length,
    rows: mappedRows,
  }

  const temp = `${filePath}.tmp`
  fs.writeFileSync(temp, JSON.stringify(payload, null, 2), 'utf8')
  fs.renameSync(temp, filePath)
  _creolabsTradersRankingRewardsTableCache = null

  return {
    written: true,
    filePath,
    rowCount: mappedRows.length,
    periodFrom: payload.periodFrom,
    periodTo: payload.periodTo,
  }
}

function buildDbLiveRunQuery({ from, to, monthFallback = 1, provenance = 1, preferLive = 1 }) {
  const query = new URLSearchParams()
  query.set('from', normalizeText(from) || DB_LIVE_BOOTSTRAP_FROM)
  query.set('to', normalizeText(to) || nowIsoDateOnly())
  query.set('monthFallback', monthFallback ? '1' : '0')
  query.set('provenance', provenance ? '1' : '0')
  query.set('preferLive', preferLive ? '1' : '0')
  return `/api/qlik/creolabs/registered-users?${query.toString()}`
}

function getDbLiveIngestionStateFilePath() {
  const fromEnv = normalizeText(env('DB_LIVE_INGESTION_STATE_FILE'))
  if (fromEnv) return fromEnv
  return path.join(process.cwd(), 'uploads', 'db-live-ingestion-state.json')
}

function getDbLiveStoreFilePath() {
  const fromEnv = normalizeText(env('DB_LIVE_STORE_FILE'))
  if (fromEnv) return fromEnv
  return path.join(process.cwd(), 'uploads', 'db-live-store.json')
}

function getDbLiveAuditLogFilePath() {
  const fromEnv = normalizeText(env('DB_LIVE_AUDIT_LOG_FILE'))
  if (fromEnv) return fromEnv
  return path.join(process.cwd(), 'uploads', 'db-live-audit.log')
}

function getCreolabsLiveArtifactPath() {
  const fromEnv = normalizeText(env('DB_LIVE_LOCAL_ARTIFACT_FILE'))
  if (fromEnv) return fromEnv
  return path.join(process.cwd(), 'uploads', 'traders_ranking_rewards_table.live.json')
}

function getCreolabsStaticArtifactPath() {
  return path.join(process.cwd(), 'public', 'traders_ranking_rewards_table.json')
}

function toWorkspaceRelativePath(filePath) {
  const absolute = normalizeText(filePath)
  if (!absolute) return ''
  const cwd = process.cwd()
  if (absolute.startsWith(cwd)) {
    return normalizeText(path.relative(cwd, absolute)).replace(/\\/g, '/')
  }
  return absolute.replace(/\\/g, '/')
}

function resolveCreolabsTradersRankingRewardsTableSource() {
  const livePath = getCreolabsLiveArtifactPath()
  if (livePath && fs.existsSync(livePath)) {
    return {
      filePath: livePath,
      sourceObjectId: toWorkspaceRelativePath(livePath) || livePath,
      sourceType: 'live-artifact',
    }
  }

  const staticPath = getCreolabsStaticArtifactPath()
  return {
    filePath: staticPath,
    sourceObjectId: toWorkspaceRelativePath(staticPath) || staticPath,
    sourceType: 'static-artifact',
  }
}

function getDbLiveActor(req) {
  const header = normalizeText(req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'])
  const forwarded = header
    .split(',')
    .map((v) => normalizeText(v))
    .filter(Boolean)
  if (forwarded.length) return forwarded[0]
  return normalizeText(req?.ip || req?.socket?.remoteAddress) || 'unknown'
}

function checkDbLiveIngestionControlRateLimit(req) {
  const actor = getDbLiveActor(req)
  const now = Date.now()
  const windowStart = now - DB_LIVE_INGEST_CONTROL_WINDOW_MS
  const history = (_dbLiveIngestionControlRate.get(actor) || []).filter((ts) => Number(ts) > windowStart)

  if (history.length >= DB_LIVE_INGEST_CONTROL_MAX_ACTIONS) {
    const oldest = Number(history[0] || now)
    const retryAfterMs = Math.max(1, DB_LIVE_INGEST_CONTROL_WINDOW_MS - (now - oldest))
    return {
      limited: true,
      actor,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
      remaining: 0,
    }
  }

  history.push(now)
  _dbLiveIngestionControlRate.set(actor, history)
  return {
    limited: false,
    actor,
    retryAfterSec: 0,
    remaining: Math.max(0, DB_LIVE_INGEST_CONTROL_MAX_ACTIONS - history.length),
  }
}

function appendDbLiveAuditEvent(event) {
  try {
    const targetFile = getDbLiveAuditLogFilePath()
    const dir = path.dirname(targetFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    if (fs.existsSync(targetFile)) {
      const stat = fs.statSync(targetFile)
      if (Number(stat?.size || 0) >= DB_LIVE_AUDIT_LOG_MAX_BYTES) {
        const rotated = `${targetFile}.1`
        if (fs.existsSync(rotated)) fs.unlinkSync(rotated)
        fs.renameSync(targetFile, rotated)
      }
    }

    const line = JSON.stringify({
      ts: new Date().toISOString(),
      ...event,
    })
    fs.appendFileSync(targetFile, `${line}\n`, 'utf8')
  } catch {
    // Never block API responses for audit logging failures.
  }
}

function serializeDbLiveStorePayload() {
  const users = Array.from(_dbLiveIngestionState.storeByClient.values())
    .slice(0, DB_LIVE_STORE_USERS_MAX)
    .map((user) => (user && typeof user === 'object' ? { ...user } : null))
    .filter(Boolean)

  return {
    contractVersion: 'db-live-store-v1',
    updatedAt: new Date().toISOString(),
    totalStoredClients: _dbLiveIngestionState.storeByClient.size,
    users,
  }
}

function serializeDbLiveIngestionMeta() {
  return {
    startedAt: normalizeText(_dbLiveIngestionState.startedAt),
    lastRunAt: normalizeText(_dbLiveIngestionState.lastRunAt),
    lastSuccessAt: normalizeText(_dbLiveIngestionState.lastSuccessAt),
    lastFailureAt: normalizeText(_dbLiveIngestionState.lastFailureAt),
    latestWatermark: normalizeText(_dbLiveIngestionState.latestWatermark),
    runCount: Number(_dbLiveIngestionState.runCount || 0),
    consecutiveFailures: Number(_dbLiveIngestionState.consecutiveFailures || 0),
    totalStoredClients: _dbLiveIngestionState.storeByClient.size,
    lastRun: _dbLiveIngestionState.lastRun || null,
    runs: Array.isArray(_dbLiveIngestionState.runs)
      ? _dbLiveIngestionState.runs.slice(0, DB_LIVE_RUNS_HISTORY_MAX)
      : [],
    updatedAt: new Date().toISOString(),
  }
}

function persistDbLiveIngestionMeta() {
  try {
    const targetFile = getDbLiveIngestionStateFilePath()
    const dir = path.dirname(targetFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const payload = JSON.stringify(serializeDbLiveIngestionMeta(), null, 2)
    const temp = `${targetFile}.tmp`
    fs.writeFileSync(temp, payload, 'utf8')
    fs.renameSync(temp, targetFile)
  } catch {
    // Ignore persistence errors to avoid blocking API requests.
  }

  try {
    const storeFile = getDbLiveStoreFilePath()
    const storeDir = path.dirname(storeFile)
    if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true })

    const storePayload = JSON.stringify(serializeDbLiveStorePayload(), null, 2)
    const tempStore = `${storeFile}.tmp`
    fs.writeFileSync(tempStore, storePayload, 'utf8')
    fs.renameSync(tempStore, storeFile)
  } catch {
    // Ignore store persistence errors to avoid blocking API requests.
  }
}

function hydrateDbLiveIngestionMetaFromDisk() {
  if (_dbLiveIngestionState.hydratedFromDisk) return
  _dbLiveIngestionState.hydratedFromDisk = true

  try {
    const targetFile = getDbLiveIngestionStateFilePath()
    if (!fs.existsSync(targetFile)) return
    const raw = fs.readFileSync(targetFile, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return

    _dbLiveIngestionState.startedAt = normalizeText(parsed?.startedAt) || _dbLiveIngestionState.startedAt
    _dbLiveIngestionState.lastRunAt = normalizeText(parsed?.lastRunAt) || _dbLiveIngestionState.lastRunAt
    _dbLiveIngestionState.lastSuccessAt = normalizeText(parsed?.lastSuccessAt) || _dbLiveIngestionState.lastSuccessAt
    _dbLiveIngestionState.lastFailureAt = normalizeText(parsed?.lastFailureAt) || _dbLiveIngestionState.lastFailureAt
    _dbLiveIngestionState.latestWatermark = normalizeText(parsed?.latestWatermark) || _dbLiveIngestionState.latestWatermark
    _dbLiveIngestionState.runCount = Number(parsed?.runCount || _dbLiveIngestionState.runCount || 0)
    _dbLiveIngestionState.consecutiveFailures = Number(
      parsed?.consecutiveFailures || _dbLiveIngestionState.consecutiveFailures || 0
    )

    const runs = Array.isArray(parsed?.runs) ? parsed.runs : []
    _dbLiveIngestionState.runs = runs.slice(0, DB_LIVE_RUNS_HISTORY_MAX)
    _dbLiveIngestionState.lastRun = parsed?.lastRun || _dbLiveIngestionState.runs[0] || null
  } catch {
    // Ignore hydration errors and continue with clean in-memory state.
  }

  try {
    if (_dbLiveIngestionState.storeByClient.size > 0) return

    const storeFile = getDbLiveStoreFilePath()
    if (!fs.existsSync(storeFile)) return
    const storeRaw = fs.readFileSync(storeFile, 'utf8')
    const storeParsed = JSON.parse(storeRaw)
    const users = Array.isArray(storeParsed?.users) ? storeParsed.users : []

    for (const user of users) {
      const storeKey = getDbLiveStoreKey(user)
      _dbLiveIngestionState.storeByClient.set(storeKey, user)
    }
  } catch {
    // Ignore store hydration errors and continue with clean in-memory state.
  }
}

function getDbLiveUsersSnapshot() {
  const users = Array.from(_dbLiveIngestionState.storeByClient.values())
  users.sort((a, b) => {
    const at = Date.parse(normalizeText(a?.clientTimestamp))
    const bt = Date.parse(normalizeText(b?.clientTimestamp))
    if (Number.isFinite(at) && Number.isFinite(bt) && at !== bt) return bt - at
    return Number(normalizeText(b?.clientId)) - Number(normalizeText(a?.clientId))
  })
  return users
}

function getDbLiveIngestionWindow() {
  const to = nowIsoDateOnly()
  let lookbackDays = DB_LIVE_LOOKBACK_DAYS
  let mode = 'delta'

  const lastSuccessMs = Date.parse(normalizeText(_dbLiveIngestionState.lastSuccessAt))
  const staleMs = Number.isFinite(lastSuccessMs) ? Date.now() - lastSuccessMs : Infinity

  if ((_dbLiveIngestionState.consecutiveFailures || 0) >= 3) {
    lookbackDays = DB_LIVE_RECOVERY_LOOKBACK_DAYS
    mode = 'delta-recovery'
  } else if (staleMs > DB_LIVE_INGEST_INTERVAL_MS * 6) {
    lookbackDays = DB_LIVE_STALE_LOOKBACK_DAYS
    mode = 'delta-stale'
  }

  if (_dbLiveIngestionState.latestWatermark) {
    return {
      from: subtractDaysIsoDateOnly(_dbLiveIngestionState.latestWatermark.slice(0, 10), lookbackDays),
      to,
      mode,
      lookbackDays,
    }
  }
  return {
    from: DB_LIVE_BOOTSTRAP_FROM,
    to,
    mode: 'bootstrap',
    lookbackDays: null,
  }
}

async function runDbLiveIngestionCycle({ reason = 'manual', forceFull = false } = {}) {
  hydrateDbLiveIngestionMetaFromDisk()

  if (_dbLiveIngestionState.inFlight) {
    return {
      skipped: true,
      reason: 'in-flight',
      run: _dbLiveIngestionState.lastRun,
    }
  }

  _dbLiveIngestionState.inFlight = true
  const startedAtMs = Date.now()
  const startedAtIso = new Date(startedAtMs).toISOString()
  _dbLiveIngestionState.startedAt = _dbLiveIngestionState.startedAt || startedAtIso
  _dbLiveIngestionState.lastRunAt = startedAtIso

  const window = forceFull
    ? { from: DB_LIVE_BOOTSTRAP_FROM, to: nowIsoDateOnly(), mode: 'full' }
    : getDbLiveIngestionWindow()

  const runMeta = {
    id: `${startedAtMs}-${Math.trunc(Math.random() * 10_000)}`,
    reason,
    mode: window.mode,
    lookbackDays: Number(window?.lookbackDays || 0) || null,
    from: window.from,
    to: window.to,
    startedAt: startedAtIso,
    finishedAt: '',
    durationMs: 0,
    status: 'running',
    fetchedUsers: 0,
    upserts: 0,
    totalStored: _dbLiveIngestionState.storeByClient.size,
    sourceMode: 'n/a',
    sourceRows: {},
    error: '',
  }

  try {
    const syntheticReq = { url: buildDbLiveRunQuery({ from: window.from, to: window.to, monthFallback: 1, provenance: 1 }) }
    const dataset = await buildCreolabsRegisteredUsersDataset(syntheticReq)
    const users = Array.isArray(dataset?.users) ? dataset.users : []
    const baselineStoreSize = _dbLiveIngestionState.storeByClient.size
    const needsSafetyGuard = window.mode === 'full' || baselineStoreSize === 0

    let effectiveUsers = users
    let effectiveSourceMode = normalizeText(dataset?.meta?.sourceRows?.sourceMode) || 'n/a'
    let effectiveSourceRows = dataset?.meta?.sourceRows || {}

    if (needsSafetyGuard && effectiveUsers.length < DB_LIVE_MIN_SAFE_USERS) {
      let artifactRows = []
      try {
        const artifact = await resolveCreolabsTradersRankingRewardsRows()
        artifactRows = Array.isArray(artifact?.data?.rows) ? artifact.data.rows : []
      } catch {
        artifactRows = []
      }

      if (artifactRows.length >= DB_LIVE_MIN_SAFE_USERS && artifactRows.length > effectiveUsers.length) {
        effectiveUsers = artifactRows
        effectiveSourceMode = 'local-artifact-recovery'
        effectiveSourceRows = {
          ...effectiveSourceRows,
          recoveryApplied: true,
          recoveryReason: 'min-safe-users',
          recoveryOriginalUsers: users.length,
          recoveryArtifactRows: artifactRows.length,
        }
      } else {
        const error = new Error(
          `Safety guard blocked ingestion snapshot: fetched ${effectiveUsers.length} users (< ${DB_LIVE_MIN_SAFE_USERS})`
        )
        error.code = 'db_live_min_safe_users'
        throw error
      }
    }

    let upserts = 0
    let watermarkMs = Date.parse(normalizeText(_dbLiveIngestionState.latestWatermark))
    if (!Number.isFinite(watermarkMs)) watermarkMs = -1

    for (const user of effectiveUsers) {
      const clientId = normalizeText(user?.clientId)
      if (!clientId) continue
      const storeKey = getDbLiveStoreKey(user)
      const prev = _dbLiveIngestionState.storeByClient.get(storeKey)
      const merged = mergeDbLiveUsersByRecency(prev, user)
      _dbLiveIngestionState.storeByClient.set(storeKey, merged)
      upserts += 1

      const ts = Date.parse(normalizeText(merged?.clientTimestamp))
      if (Number.isFinite(ts) && ts > watermarkMs) watermarkMs = ts
    }

    _dbLiveIngestionState.latestWatermark = Number.isFinite(watermarkMs) && watermarkMs > 0
      ? new Date(watermarkMs).toISOString()
      : _dbLiveIngestionState.latestWatermark
    _dbLiveIngestionState.lastSuccessAt = new Date().toISOString()
    _dbLiveIngestionState.lastFailureAt = null
    _dbLiveIngestionState.consecutiveFailures = 0
    _dbLiveIngestionState.runCount += 1

    runMeta.status = 'success'
  runMeta.fetchedUsers = effectiveUsers.length
    runMeta.upserts = upserts
    runMeta.totalStored = _dbLiveIngestionState.storeByClient.size
  runMeta.sourceMode = effectiveSourceMode
  runMeta.sourceRows = effectiveSourceRows

    try {
      const snapshotRows = Array.from(_dbLiveIngestionState.storeByClient.values())
      runMeta.localArtifactSync = persistCreolabsLiveArtifactRows(snapshotRows, {
        sourceMode: runMeta.sourceMode,
        from: window.from,
        to: window.to,
      })
    } catch (artifactError) {
      runMeta.localArtifactSync = {
        written: false,
        reason: 'write-failed',
        filePath: getCreolabsLiveArtifactPath(),
        error: normalizeText(artifactError?.message),
      }
    }

    runMeta.finishedAt = new Date().toISOString()
    runMeta.durationMs = Date.now() - startedAtMs
  } catch (error) {
    runMeta.status = 'failed'
    runMeta.error = normalizeText(error?.message || 'unknown-error')
    runMeta.finishedAt = new Date().toISOString()
    runMeta.durationMs = Date.now() - startedAtMs
    _dbLiveIngestionState.lastFailureAt = runMeta.finishedAt
    _dbLiveIngestionState.consecutiveFailures = Number(_dbLiveIngestionState.consecutiveFailures || 0) + 1
  } finally {
    _dbLiveIngestionState.inFlight = false
    _dbLiveIngestionState.lastRun = runMeta
    _dbLiveIngestionState.runs.unshift(runMeta)
    if (_dbLiveIngestionState.runs.length > DB_LIVE_RUNS_HISTORY_MAX) {
      _dbLiveIngestionState.runs.length = DB_LIVE_RUNS_HISTORY_MAX
    }
    persistDbLiveIngestionMeta()
  }

  return {
    skipped: false,
    run: runMeta,
  }
}

async function runDbLiveIdentityRepairCycle({ reason = 'repair-identity' } = {}) {
  hydrateDbLiveIngestionMetaFromDisk()

  const startedAtMs = Date.now()
  const startedAtIso = new Date(startedAtMs).toISOString()

  const runMeta = {
    id: `${startedAtMs}-${Math.trunc(Math.random() * 10_000)}`,
    reason,
    mode: 'repair-identity',
    startedAt: startedAtIso,
    finishedAt: '',
    durationMs: 0,
    status: 'running',
    scannedClients: 0,
    repairedClients: 0,
    totalStored: _dbLiveIngestionState.storeByClient.size,
    sourceMode: normalizeText(_dbLiveIngestionState?.lastRun?.sourceMode) || 'n/a',
    sourceRows: {
      beforeMissingIdentity: 0,
      afterMissingIdentity: 0,
    },
    error: '',
  }

  try {
    const syntheticReq = {
      url: buildDbLiveRunQuery({
        from: DB_LIVE_BOOTSTRAP_FROM,
        to: nowIsoDateOnly(),
        monthFallback: 1,
        provenance: 1,
      }),
    }
    const dataset = await buildCreolabsRegisteredUsersDataset(syntheticReq)
    const users = Array.isArray(dataset?.users) ? dataset.users : []

    const byClient = new Map()
    for (const user of users) {
      const cid = normalizeText(user?.clientId)
      if (!cid) continue
      if (!byClient.has(cid)) byClient.set(cid, user)
      const cidNum = Number(cid)
      if (Number.isFinite(cidNum)) {
        const numericKey = String(cidNum)
        if (!byClient.has(numericKey)) byClient.set(numericKey, user)
      }
    }

    const identityUnique = new Map()
    for (const user of users) {
      const key = buildIdentityFallbackKey(user?.clientName, user?.country, user?.user)
      if (!key) continue

      if (!identityUnique.has(key)) {
        identityUnique.set(key, {
          affiliateIds: new Set(),
          clientLogins: new Set(),
        })
      }
      const bucket = identityUnique.get(key)
      const aff = normalizeText(user?.affiliateId)
      const login = normalizeText(user?.clientLogin)
      if (aff) bucket.affiliateIds.add(aff)
      if (login) bucket.clientLogins.add(login)
    }

    const nextStore = new Map()
    let repairedClients = 0
    let beforeMissingIdentity = 0
    let afterMissingIdentity = 0

    for (const [storeKey, user] of _dbLiveIngestionState.storeByClient.entries()) {
      const current = user && typeof user === 'object' ? { ...user } : user
      if (!current || typeof current !== 'object') {
        nextStore.set(storeKey, current)
        continue
      }

      runMeta.scannedClients += 1

      const beforeMissing = isMissingIdentityValue(current?.affiliateId) || isMissingIdentityValue(current?.clientLogin)
      if (beforeMissing) beforeMissingIdentity += 1

      const cid = normalizeText(current?.clientId) || normalizeText(storeKey)
      const candidate = byClient.get(cid) || null
      const cachedMeta = getRegisteredUsersMeta(cid)
      const identityKey = buildIdentityFallbackKey(
        current?.clientName || candidate?.clientName || cachedMeta?.clientName,
        current?.country || candidate?.country || cachedMeta?.country,
        current?.user || candidate?.user || cachedMeta?.user
      )
      const identityFallback = identityKey ? identityUnique.get(identityKey) : null

      const nextAffiliateId =
        normalizeText(current?.affiliateId) ||
        normalizeText(candidate?.affiliateId) ||
        normalizeText(cachedMeta?.affiliateId) ||
        (identityFallback && identityFallback.affiliateIds.size === 1 ? Array.from(identityFallback.affiliateIds)[0] : '')

      const nextClientLogin =
        normalizeText(current?.clientLogin) ||
        normalizeText(candidate?.clientLogin) ||
        normalizeText(cachedMeta?.clientLogin) ||
        (identityFallback && identityFallback.clientLogins.size === 1 ? Array.from(identityFallback.clientLogins)[0] : '')

      const wasAffiliateMissing = isMissingIdentityValue(current?.affiliateId)
      const wasLoginMissing = isMissingIdentityValue(current?.clientLogin)
      const affiliateRecovered = wasAffiliateMissing && normalizeText(nextAffiliateId)
      const loginRecovered = wasLoginMissing && normalizeText(nextClientLogin)

      current.affiliateId = nextAffiliateId || ''
      current.clientLogin = nextClientLogin || ''

      if (affiliateRecovered || loginRecovered) repairedClients += 1

      const afterMissing = isMissingIdentityValue(current?.affiliateId) || isMissingIdentityValue(current?.clientLogin)
      if (afterMissing) afterMissingIdentity += 1

      nextStore.set(getDbLiveStoreKey(current), current)
    }

    _dbLiveIngestionState.storeByClient = nextStore
    persistDbLiveIngestionMeta()

    runMeta.repairedClients = repairedClients
    runMeta.sourceRows.beforeMissingIdentity = beforeMissingIdentity
    runMeta.sourceRows.afterMissingIdentity = afterMissingIdentity
    runMeta.totalStored = _dbLiveIngestionState.storeByClient.size
    runMeta.status = 'success'
  } catch (error) {
    runMeta.status = 'error'
    runMeta.error = normalizeText(error?.message)
  } finally {
    runMeta.finishedAt = new Date().toISOString()
    runMeta.durationMs = Math.max(1, Date.now() - startedAtMs)
    _dbLiveIngestionState.lastRun = runMeta
    _dbLiveIngestionState.lastRunAt = runMeta.finishedAt
    _dbLiveIngestionState.runs.unshift(runMeta)
    if (_dbLiveIngestionState.runs.length > DB_LIVE_RUNS_HISTORY_MAX) {
      _dbLiveIngestionState.runs.length = DB_LIVE_RUNS_HISTORY_MAX
    }
    persistDbLiveIngestionMeta()
  }

  return {
    skipped: false,
    run: runMeta,
  }
}

function startDbLiveIngestionScheduler() {
  if (_dbLiveIngestionState.schedulerStarted) return
  _dbLiveIngestionState.schedulerStarted = true
  hydrateDbLiveIngestionMetaFromDisk()

  const scheduleTick = () => {
    runDbLiveIngestionCycle({ reason: 'scheduled' }).catch(() => {})
  }

  scheduleTick()
  _dbLiveIngestionState.timer = setInterval(scheduleTick, DB_LIVE_INGEST_INTERVAL_MS)
}

function applyDbLiveFilters(users, urlObj) {
  const search = normalizeText(urlObj.searchParams.get('search')).toLowerCase()
  const status = normalizeText(urlObj.searchParams.get('status')).toLowerCase()
  const country = normalizeText(urlObj.searchParams.get('country')).toLowerCase()
  const affiliateId = normalizeText(urlObj.searchParams.get('affiliateId')).toLowerCase()
  const brands = normalizeText(urlObj.searchParams.get('brand'))
    .split(',')
    .map((value) => normalizeText(value).toLowerCase())
    .filter(Boolean)
  const brandSet = new Set(brands)

  return users.filter((user) => {
    if (status && normalizeText(user?.status).toLowerCase() !== status) return false
    if (country && normalizeText(user?.country).toLowerCase() !== country) return false
    if (affiliateId && normalizeText(user?.affiliateId).toLowerCase() !== affiliateId) return false
    if (brandSet.size > 0 && !brandSet.has(normalizeText(user?.brand).toLowerCase())) return false

    if (search) {
      const haystack = [
        user?.clientId,
        user?.clientName,
        user?.clientLogin,
        user?.affiliateId,
        user?.country,
        user?.user,
        user?.brand,
      ]
        .map((v) => normalizeText(v).toLowerCase())
        .join(' | ')
      if (!haystack.includes(search)) return false
    }

    return true
  })
}

function applyDbLiveSort(users, urlObj) {
  const sortRaw = normalizeText(urlObj.searchParams.get('sort') || '-clientTimestamp,-clientId')
  const tokens = sortRaw
    .split(',')
    .map((t) => normalizeText(t))
    .filter(Boolean)

  const allowed = new Set([
    'clientTimestamp',
    'clientId',
    'clientName',
    'affiliateId',
    'clientLogin',
    'country',
    'status',
    'net',
    'deposit',
    'wd',
    'trades',
    'openedTrades',
    'equity',
  ])

  const comparators = tokens
    .map((token) => {
      const dir = token.startsWith('-') ? -1 : 1
      const field = token.replace(/^[-+]/, '')
      if (!allowed.has(field)) return null
      return { field, dir }
    })
    .filter(Boolean)

  const normalizedComparators = comparators.length
    ? comparators
    : [{ field: 'clientTimestamp', dir: -1 }, { field: 'clientId', dir: -1 }]

  const sortable = [...users]
  sortable.sort((a, b) => {
    for (const cmp of normalizedComparators) {
      const field = cmp.field
      const dir = cmp.dir

      let av = a?.[field]
      let bv = b?.[field]

      if (field === 'clientTimestamp') {
        av = Date.parse(normalizeText(av))
        bv = Date.parse(normalizeText(bv))
      } else if (['clientId', 'net', 'deposit', 'wd', 'trades'].includes(field)) {
        av = Number(av)
        bv = Number(bv)
      } else {
        av = normalizeText(av).toLowerCase()
        bv = normalizeText(bv).toLowerCase()
      }

      if (Number.isFinite(av) && Number.isFinite(bv)) {
        if (av === bv) continue
        return av > bv ? dir : -dir
      }

      const as = normalizeText(av)
      const bs = normalizeText(bv)
      if (as === bs) continue
      return as > bs ? dir : -dir
    }
    return 0
  })

  return {
    users: sortable,
    sort: normalizedComparators.map((c) => `${c.dir < 0 ? '-' : '+'}${c.field}`).join(','),
  }
}

function normalizeNativeColumnKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function buildNativeRowAccessor(row) {
  const map = new Map()
  if (!row || typeof row !== 'object') return map
  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeNativeColumnKey(key)
    if (!normalized || map.has(normalized)) continue
    map.set(normalized, value)
  }
  return map
}

function getNativeValue(accessor, aliases = []) {
  for (const alias of aliases) {
    const normalized = normalizeNativeColumnKey(alias)
    if (!normalized) continue
    if (accessor.has(normalized)) return accessor.get(normalized)
  }
  return ''
}

function parseNativeNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = normalizeText(value).replace(/,/g, '')
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeNativeIsoDate(value) {
  const raw = normalizeText(value)
  if (!raw) return ''
  const ms = Date.parse(raw)
  if (!Number.isFinite(ms)) return raw
  return new Date(ms).toISOString()
}

function mapCreolabsNativeRow(row) {
  const accessor = buildNativeRowAccessor(row)
  const clientTimestamp = normalizeNativeIsoDate(
    getNativeValue(accessor, [
      'clientTimestamp',
      'client timestamp',
      'registration date',
      'registered date',
      'created at',
      'created_at',
      'date',
      'Client Timestamp',
    ])
  )
  const rawDate = normalizeText(
    getNativeValue(accessor, ['date', 'registration date', 'registered date', 'created at'])
  )
  return {
    clientId: normalizeText(getNativeValue(accessor, ['clientId', 'client id', 'client_id', 'Client ID'])),
    clientName: normalizeText(getNativeValue(accessor, ['clientName', 'client name', 'name', 'Client Name'])),
    clientLogin: normalizeText(getNativeValue(accessor, ['clientLogin', 'client login', 'login', 'Client LOGIN'])),
    affiliateId: normalizeText(getNativeValue(accessor, ['affiliateId', 'affiliate id', 'affiliate', 'Client Affiliate ID'])),
    user: normalizeText(getNativeValue(accessor, ['user', 'agent', 'sales agent', 'retention agent', 'Client User'])),
    country: normalizeText(getNativeValue(accessor, ['country', 'country code', 'Client Country'])),
    brand: normalizeText(getNativeValue(accessor, ['brand', 'Client User Type'])),
    status: normalizeText(getNativeValue(accessor, ['status'])),
    clientTimestamp,
    date: rawDate || (clientTimestamp ? clientTimestamp.slice(0, 10) : ''),
    balance: parseNativeNumber(getNativeValue(accessor, ['balance', '$ balance', 'Client Balance'])),
    commission: parseNativeNumber(getNativeValue(accessor, ['commission', 'ltv commission', 'commission aff', 'Client Commission'])),
    closedPl: parseNativeNumber(getNativeValue(accessor, ['closedPl', 'closed pl', '$ closed pl', 'Client PL Closed'])),
    openPl: parseNativeNumber(getNativeValue(accessor, ['openPl', 'open pl', '$ open pl', 'Client PL Open'])),
    trades: Math.round(parseNativeNumber(getNativeValue(accessor, ['trades', '# trades']))),
    openedTrades: Math.round(parseNativeNumber(getNativeValue(accessor, ['openedTrades', 'opened trades']))),
    ftd: parseNativeNumber(getNativeValue(accessor, ['ftd', '$ ftd', 'Client FTD Amount'])),
    rdp: parseNativeNumber(getNativeValue(accessor, ['rdp', '$ rdp'])),
    deposit: parseNativeNumber(getNativeValue(accessor, ['deposit', '$ deposit', 'deposits', 'Client Deposit'])),
    wd: parseNativeNumber(getNativeValue(accessor, ['wd', '$ wd', 'withdrawal', 'withdrawals', 'Client Withdrawal'])),
    net: parseNativeNumber(getNativeValue(accessor, ['net', '$ net', 'Client Net'])),
    equity: parseNativeNumber(getNativeValue(accessor, ['equity', '$ equity', 'Client Equity'])),
    raw: row,
  }
}

function aggregateDbNativeCatalogKpis(rows) {
  const list = Array.isArray(rows) ? rows : []
  const base = aggregateCreolabsUserKpis(list, { leadCountMode: 'row' })

  let leadsSum = 0
  let leadsSignalCount = 0
  let ftdCountSum = 0
  let ftdCountSignalCount = 0
  let ftdVolumeSum = 0
  let ftdVolumeSignalCount = 0
  let rdpSum = 0
  let rdpSignalCount = 0
  let wdSum = 0
  let wdSignalCount = 0
  let depositSum = 0
  let depositSignalCount = 0
  let closedPlSum = 0

  for (const row of list) {
    const accessor = buildNativeRowAccessor(row?.raw && typeof row.raw === 'object' ? row.raw : row)

    const leadsRaw = parseNativeNumber(
      getNativeValue(accessor, ['Client # Clients', '# Leads', 'client # clients', 'client # leads'])
    )
    if (leadsRaw !== 0) leadsSignalCount += 1
    leadsSum += leadsRaw

    const ftdIndRaw = parseNativeNumber(
      getNativeValue(accessor, ['Trans FTD Ind', 'trans ftd ind', 'FTD Ind', 'ftd ind'])
    )
    const ftdInd = ftdIndRaw !== 0 ? ftdIndRaw : (toFiniteNumber(row?.ftd) > 0 ? 1 : 0)
    if (ftdIndRaw !== 0 || toFiniteNumber(row?.ftd) > 0) ftdCountSignalCount += 1
    ftdCountSum += ftdInd

    const ftdVolumeRaw = parseNativeNumber(
      getNativeValue(accessor, ['Trans FTD', '$ FTD', 'Client FTD (USD)', 'Client FTD Amount'])
    )
    const ftdVolume = ftdVolumeRaw !== 0 ? ftdVolumeRaw : toFiniteNumber(row?.ftd)
    if (ftdVolumeRaw !== 0 || toFiniteNumber(row?.ftd) !== 0) ftdVolumeSignalCount += 1
    ftdVolumeSum += ftdVolume

    const rdpRaw = parseNativeNumber(getNativeValue(accessor, ['Trans RDP', 'Client RDP (USD)', 'RDP']))
    const rdpValue = rdpRaw !== 0 ? rdpRaw : toFiniteNumber(row?.rdp)
    if (rdpRaw !== 0 || toFiniteNumber(row?.rdp) !== 0) rdpSignalCount += 1
    rdpSum += rdpValue

    const wdRaw = parseNativeNumber(getNativeValue(accessor, ['Trans Withdrawal', 'Client Withdrawal']))
    const wdValue = wdRaw !== 0 ? wdRaw : toFiniteNumber(row?.wd)
    if (wdRaw !== 0 || toFiniteNumber(row?.wd) !== 0) wdSignalCount += 1
    wdSum += wdValue

    const depositRaw = parseNativeNumber(getNativeValue(accessor, ['Trans Deposit', 'Client Deposit']))
    const depositValue = depositRaw !== 0 ? depositRaw : toFiniteNumber(row?.deposit)
    if (depositRaw !== 0 || toFiniteNumber(row?.deposit) !== 0) depositSignalCount += 1
    depositSum += depositValue

    closedPlSum += toFiniteNumber(row?.closedPl)
  }

  const leads = leadsSignalCount > 0 ? leadsSum : base.totalLeads
  const ftdCount = ftdCountSignalCount > 0 ? ftdCountSum : base.withFtd
  const ftdVolume = ftdVolumeSignalCount > 0 ? ftdVolumeSum : base.ftd
  const rdp = rdpSignalCount > 0 ? rdpSum : base.rdp
  const wd = wdSignalCount > 0 ? wdSum : base.wd
  const deposit = depositSignalCount > 0 ? depositSum : base.deposit
  const net = deposit - wd

  return {
    ...base,
    totalLeads: leads,
    withFtd: ftdCount,
    ftd: ftdVolume,
    rdp,
    wd,
    deposit,
    net,
    closedPl: closedPlSum,
  }
}

async function fetchCreolabsNativeApiPayload({ forceRefresh = false, offset = 0, limit = 200 } = {}) {
  if (!CREOLABS_NATIVE_API_URL || !CREOLABS_NATIVE_API_KEY) {
    const error = new Error('Creolabs Native API not configured. Set CREOLABS_NATIVE_API_URL and CREOLABS_NATIVE_API_KEY.')
    error.status = 501
    throw error
  }

  const safeOffset = parseNonNegativeInt(offset, 0)
  const safeLimit = parsePositiveInt(limit, 200, CREOLABS_NATIVE_PAGE_LIMIT)
  const upstreamUrl = new URL(CREOLABS_NATIVE_API_URL)
  upstreamUrl.searchParams.set('format', 'json')
  upstreamUrl.searchParams.set('shape', 'rows')
  upstreamUrl.searchParams.set('limit', String(safeLimit))
  upstreamUrl.searchParams.set('offset', String(safeOffset))
  if (forceRefresh) upstreamUrl.searchParams.set('refresh', 'true')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CREOLABS_NATIVE_FETCH_TIMEOUT_MS)
  let response = null
  try {
    response = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-api-key': CREOLABS_NATIVE_API_KEY,
        Authorization: `Bearer ${CREOLABS_NATIVE_API_KEY}`,
      },
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`Creolabs Native API timed out after ${CREOLABS_NATIVE_FETCH_TIMEOUT_MS}ms`)
      timeoutError.status = 504
      throw timeoutError
    }
    throw error
  } finally {
    clearTimeout(timer)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload || !Array.isArray(payload.data)) {
    const error = new Error(payload?.error || payload?.message || `Creolabs Native API failed (${response.status})`)
    error.status = response.status || 502
    throw error
  }

  return {
    rows: payload.data,
    paging: payload.paging || {
      offset: safeOffset,
      limit: safeLimit,
      returned: Array.isArray(payload.data) ? payload.data.length : 0,
      total: Array.isArray(payload.data) ? payload.data.length : 0,
      hasMore: false,
    },
    report: payload.report || null,
    schema: payload.schema || null,
    filters: payload.filters || null,
    generatedAt: normalizeText(payload.generatedAt),
    warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
    fromCache: Boolean(payload.fromCache),
    _cache: { hit: false, ageMs: 0 },
  }
}

function getDbNativeStoreFilePath() {
  const fromEnv = normalizeText(env('DB_NATIVE_STORE_FILE'))
  if (fromEnv) return fromEnv
  return path.join(process.cwd(), 'uploads', 'db-native-store.json')
}

function persistDbNativeStore() {
  try {
    const targetFile = getDbNativeStoreFilePath()
    const dir = path.dirname(targetFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const payload = {
      contractVersion: 'db-native-store-v1',
      updatedAt: new Date().toISOString(),
      generatedAt: normalizeText(_dbNativeStoreState.generatedAt),
      sourcePaging: _dbNativeStoreState.sourcePaging || null,
      report: _dbNativeStoreState.report || null,
      schema: _dbNativeStoreState.schema || null,
      filters: _dbNativeStoreState.filters || null,
      warnings: Array.isArray(_dbNativeStoreState.warnings) ? _dbNativeStoreState.warnings : [],
      rows: Array.isArray(_dbNativeStoreState.rows) ? _dbNativeStoreState.rows : [],
    }

    const temp = `${targetFile}.tmp`
    fs.writeFileSync(temp, JSON.stringify(payload, null, 2), 'utf8')
    fs.renameSync(temp, targetFile)
    return true
  } catch {
    return false
  }
}

function hydrateDbNativeStoreFromDisk() {
  if (_dbNativeStoreState.hydratedFromDisk) return
  _dbNativeStoreState.hydratedFromDisk = true

  try {
    const targetFile = getDbNativeStoreFilePath()
    if (!fs.existsSync(targetFile)) return
    const raw = fs.readFileSync(targetFile, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return

    _dbNativeStoreState.rows = Array.isArray(parsed.rows) ? parsed.rows : []
    _dbNativeStoreState.report = parsed.report || null
    _dbNativeStoreState.schema = parsed.schema || null
    _dbNativeStoreState.filters = parsed.filters || null
    _dbNativeStoreState.warnings = Array.isArray(parsed.warnings) ? parsed.warnings : []
    _dbNativeStoreState.generatedAt = normalizeText(parsed.generatedAt)
    _dbNativeStoreState.updatedAt = normalizeText(parsed.updatedAt)
    _dbNativeStoreState.sourcePaging = parsed.sourcePaging || null
  } catch {
    _dbNativeStoreState.rows = []
  }
}

async function syncDbNativeStore({ forceRefresh = false } = {}) {
  if (_dbNativeStoreState.inFlight) return _dbNativeStoreState.inFlight

  const promise = (async () => {
    let offset = 0
    let pageCount = 0
    let hasMore = true
    const collectedRows = []
    let lastPayload = null

    while (hasMore) {
      if (pageCount >= CREOLABS_NATIVE_SYNC_MAX_PAGES) {
        const error = new Error(`DB Native sync exceeded max pages (${CREOLABS_NATIVE_SYNC_MAX_PAGES})`)
        error.status = 502
        throw error
      }

      const payload = await fetchCreolabsNativeApiPayload({
        forceRefresh: forceRefresh && pageCount === 0,
        offset,
        limit: CREOLABS_NATIVE_SYNC_PAGE_SIZE,
      })
      pageCount += 1
      lastPayload = payload

      const mapped = Array.isArray(payload.rows) ? payload.rows.map(mapCreolabsNativeRow) : []
      if (mapped.length) collectedRows.push(...mapped)

      const paging = payload?.paging || {}
      const returned = parseNonNegativeInt(paging?.returned, mapped.length)
      const total = parseNonNegativeInt(paging?.total, collectedRows.length)
      const offsetNext = offset + returned
      hasMore = Boolean(paging?.hasMore) || (returned > 0 && offsetNext < total)

      if (!hasMore || returned <= 0) break
      offset = offsetNext
    }

    _dbNativeStoreState.rows = collectedRows
    _dbNativeStoreState.report = lastPayload?.report || null
    _dbNativeStoreState.schema = lastPayload?.schema || null
    _dbNativeStoreState.filters = lastPayload?.filters || null
    _dbNativeStoreState.warnings = Array.isArray(lastPayload?.warnings) ? lastPayload.warnings : []
    _dbNativeStoreState.generatedAt = normalizeText(lastPayload?.generatedAt) || new Date().toISOString()
    _dbNativeStoreState.updatedAt = new Date().toISOString()
    _dbNativeStoreState.sourcePaging = {
      pageSize: CREOLABS_NATIVE_SYNC_PAGE_SIZE,
      pagesFetched: pageCount,
      totalRows: collectedRows.length,
      lastPaging: lastPayload?.paging || null,
      forceRefresh: Boolean(forceRefresh),
    }

    persistDbNativeStore()
    return {
      rows: _dbNativeStoreState.rows,
      report: _dbNativeStoreState.report,
      schema: _dbNativeStoreState.schema,
      filters: _dbNativeStoreState.filters,
      warnings: _dbNativeStoreState.warnings,
      generatedAt: _dbNativeStoreState.generatedAt,
      updatedAt: _dbNativeStoreState.updatedAt,
      sourcePaging: _dbNativeStoreState.sourcePaging,
    }
  })()

  _dbNativeStoreState.inFlight = promise
  try {
    return await promise
  } finally {
    _dbNativeStoreState.inFlight = null
  }
}

function applyDbNativeFilters(users, urlObj) {
  const search = normalizeText(urlObj.searchParams.get('search')).toLowerCase()
  const status = normalizeText(urlObj.searchParams.get('status')).toLowerCase()
  const country = normalizeText(urlObj.searchParams.get('country')).toLowerCase()
  const affiliateId = normalizeText(urlObj.searchParams.get('affiliateId')).toLowerCase()
  const clientFilter = normalizeText(urlObj.searchParams.get('client') || urlObj.searchParams.get('clientId')).toLowerCase()
  const agentFilter = normalizeText(urlObj.searchParams.get('user') || urlObj.searchParams.get('agent')).toLowerCase()
  const brands = normalizeText(urlObj.searchParams.get('brand'))
    .split(',')
    .map((value) => normalizeText(value).toLowerCase())
    .filter(Boolean)
  const brandSet = new Set(brands)

  return users.filter((user) => {
    if (status && normalizeText(user?.status).toLowerCase() !== status) return false
    if (country && normalizeText(user?.country).toLowerCase() !== country) return false
    if (affiliateId && !normalizeText(user?.affiliateId).toLowerCase().includes(affiliateId)) return false
    if (clientFilter) {
      const haystack = [user?.clientId, user?.clientName, user?.clientLogin]
        .map((value) => normalizeText(value).toLowerCase())
        .join(' | ')
      if (!haystack.includes(clientFilter)) return false
    }
    if (agentFilter && !normalizeText(user?.user).toLowerCase().includes(agentFilter)) return false
    if (brandSet.size > 0 && !brandSet.has(normalizeText(user?.brand).toLowerCase())) return false
    if (search) {
      const haystack = [
        user?.affiliateId,
        user?.clientId,
        user?.clientName,
        user?.clientLogin,
        user?.user,
        user?.country,
        user?.brand,
        user?.date,
      ]
        .map((value) => normalizeText(value).toLowerCase())
        .join(' | ')
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

function applyDbNativeSort(users, urlObj) {
  const sortRaw = normalizeText(urlObj.searchParams.get('sort') || '-date,-clientId')
  const tokens = sortRaw.split(',').map((token) => normalizeText(token)).filter(Boolean)
  const allowed = new Set(['date', 'clientId', 'clientName', 'affiliateId', 'clientLogin', 'user', 'country', 'balance', 'commission', 'closedPl', 'openPl', 'trades', 'ftd', 'rdp', 'deposit', 'wd', 'net', 'equity'])
  const comparators = tokens
    .map((token) => {
      const dir = token.startsWith('-') ? -1 : 1
      const field = token.replace(/^[-+]/, '')
      if (!allowed.has(field)) return null
      return { field, dir }
    })
    .filter(Boolean)

  const normalizedComparators = comparators.length ? comparators : [{ field: 'date', dir: -1 }, { field: 'clientId', dir: -1 }]
  const sortable = [...users]
  sortable.sort((a, b) => {
    for (const cmp of normalizedComparators) {
      const { field, dir } = cmp
      let av = a?.[field]
      let bv = b?.[field]
      if (field === 'date') {
        av = Date.parse(normalizeText(av))
        bv = Date.parse(normalizeText(bv))
      } else if (['balance', 'commission', 'closedPl', 'openPl', 'trades', 'ftd', 'rdp', 'deposit', 'wd', 'net', 'equity'].includes(field)) {
        av = Number(av)
        bv = Number(bv)
      } else {
        av = normalizeText(av).toLowerCase()
        bv = normalizeText(bv).toLowerCase()
      }

      if (Number.isFinite(av) && Number.isFinite(bv)) {
        if (av === bv) continue
        return av > bv ? dir : -dir
      }

      const as = normalizeText(av)
      const bs = normalizeText(bv)
      if (as === bs) continue
      return as > bs ? dir : -dir
    }
    return 0
  })

  return {
    users: sortable,
    sort: normalizedComparators.map((c) => `${c.dir < 0 ? '-' : '+'}${c.field}`).join(','),
  }
}

function buildLatestDbNativeSnapshotRows(users) {
  const rows = Array.isArray(users) ? users : []
  const byClient = new Map()

  for (const row of rows) {
    const clientId = normalizeText(row?.clientId)
    if (!clientId) continue

    const rowMs = Date.parse(normalizeText(row?.clientTimestamp || row?.date))
    const nextTs = Number.isFinite(rowMs) ? rowMs : Number.NEGATIVE_INFINITY
    const prev = byClient.get(clientId)
    if (!prev) {
      byClient.set(clientId, row)
      continue
    }

    const prevMs = Date.parse(normalizeText(prev?.clientTimestamp || prev?.date))
    const prevTs = Number.isFinite(prevMs) ? prevMs : Number.NEGATIVE_INFINITY
    if (nextTs >= prevTs) byClient.set(clientId, row)
  }

  return Array.from(byClient.values())
}

function resolveDbNativeRowIsoDate(row) {
  const ts = Date.parse(normalizeText(row?.clientTimestamp))
  if (Number.isFinite(ts)) return isoDateOnlyFromMs(ts)

  const dateText = normalizeText(row?.date)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText

  const fallbackTs = Date.parse(normalizeText(row?.date))
  if (!Number.isFinite(fallbackTs)) return ''
  return isoDateOnlyFromMs(fallbackTs)
}

async function handleCreolabsDbNativeLeaderboard(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  try {
    hydrateDbNativeStoreFromDisk()
    const urlObj = new URL(req.url || '/', 'http://localhost')
    const forceRefresh = normalizeText(urlObj.searchParams.get('refresh')) === '1'
    const plMode = normalizeText(urlObj.searchParams.get('plMode')).toLowerCase() === 'open' ? 'open' : 'closed'
    const affiliateId = normalizeText(urlObj.searchParams.get('affiliateId'))
    const topN = Math.min(parsePositiveInt(urlObj.searchParams.get('limit'), 100, 500), 500)
    const sortBy = urlObj.searchParams.get('sortBy') === 'volume' ? 'volume' : 'profit'
    const fromRaw = normalizeText(urlObj.searchParams.get('from'))
    const toRaw = normalizeText(urlObj.searchParams.get('to'))
    const hasExplicitDateFilter = Boolean(fromRaw || toRaw)

    let fromMs = Number.NEGATIVE_INFINITY
    let toMs = Number.POSITIVE_INFINITY
    if (hasExplicitDateFilter) {
      if (fromRaw) fromMs = parseIsoDateBoundary(fromRaw, { endOfDay: false })
      if (toRaw) toMs = parseIsoDateBoundary(toRaw, { endOfDay: true })
      if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
        const error = new Error('Invalid date range. Use ?from=YYYY-MM-DD&to=YYYY-MM-DD')
        error.status = 400
        throw error
      }
    }
    const fromIso = Number.isFinite(fromMs) ? isoDateOnlyFromMs(fromMs) : ''
    const toIso = Number.isFinite(toMs) ? isoDateOnlyFromMs(toMs) : ''

    let nativeRows = Array.isArray(_dbNativeStoreState.rows) ? _dbNativeStoreState.rows : []
    const nowMs = Date.now()
    const todayIsoUtc = nowIsoDateOnly()
    const storeGeneratedMs = Date.parse(normalizeText(_dbNativeStoreState.generatedAt || _dbNativeStoreState.updatedAt))
    const cacheAgeMs = Number.isFinite(storeGeneratedMs) ? Math.max(0, nowMs - storeGeneratedMs) : Number.MAX_SAFE_INTEGER
    const storeGeneratedUtcIso = Number.isFinite(storeGeneratedMs) ? isoDateOnlyFromMs(storeGeneratedMs) : ''
    const staleByAge = cacheAgeMs > DB_NATIVE_MAX_STALE_MS
    const staleByDay = !storeGeneratedUtcIso || storeGeneratedUtcIso !== todayIsoUtc
    const shouldSync = forceRefresh || !nativeRows.length || staleByAge || staleByDay

    if (shouldSync) {
      try {
        const synced = await syncDbNativeStore({ forceRefresh: forceRefresh || staleByAge || staleByDay })
        nativeRows = Array.isArray(synced?.rows) ? synced.rows : nativeRows
      } catch {
        // Keep serving available in-memory/disk rows when upstream sync is unavailable.
      }
    }

    const cacheKey = [
      affiliateId || '',
      topN,
      sortBy,
      plMode,
      fromIso,
      toIso,
      _dbNativeStoreState.updatedAt || '',
      Array.isArray(nativeRows) ? nativeRows.length : 0,
    ].join('|')
    const cached = _dbNativeLeaderboardCache.get(cacheKey)
    if (cached && cached.expiresAt > nowMs) {
      return json(res, 200, cached.payload, { 'Cache-Control': 'no-store' })
    }

    const allRows = Array.isArray(nativeRows) ? nativeRows : []
    const rawCandidates = affiliateId
      ? allRows.filter((raw) => {
          const aff = normalizeText(
            raw?.affiliateId ||
              raw?.affiliate_id ||
              raw?.affiliate ||
              raw?.['Client Affiliate ID'] ||
              raw?.['Affiliate ID']
          )
          return aff === affiliateId
        })
      : allRows
    const mapped = rawCandidates.map(mapCreolabsNativeRow)

    const byClient = new Map()
    for (const r of mapped) {
      const key = normalizeText(r.clientId) || normalizeText(r.clientLogin) || normalizeText(r.clientName)
      if (!key) continue
      if (affiliateId && normalizeText(r.affiliateId) !== affiliateId) continue

      const rowIso = resolveDbNativeRowIsoDate(r)
      const rowTsRaw = Date.parse(normalizeText(r.clientTimestamp))
      const rowTs = Number.isFinite(rowTsRaw)
        ? rowTsRaw
        : (rowIso ? Date.parse(`${rowIso}T00:00:00.000Z`) : Number.NaN)

      let state = byClient.get(key)
      if (!state) {
        state = {
          latestAll: null,
          latestAllTs: Number.NEGATIVE_INFINITY,
          latestInRange: null,
          latestInRangeTs: Number.NEGATIVE_INFINITY,
          baselineBefore: null,
          baselineBeforeTs: Number.NEGATIVE_INFINITY,
        }
        byClient.set(key, state)
      }

      if (Number.isFinite(rowTs) && rowTs >= state.latestAllTs) {
        state.latestAll = r
        state.latestAllTs = rowTs
      }

      if (!hasExplicitDateFilter) continue
      if (!rowIso) continue
      if (fromIso && rowIso < fromIso) {
        if (Number.isFinite(rowTs) && rowTs >= state.baselineBeforeTs) {
          state.baselineBefore = r
          state.baselineBeforeTs = rowTs
        }
        continue
      }
      if (toIso && rowIso > toIso) continue
      if (Number.isFinite(rowTs) && rowTs >= state.latestInRangeTs) {
        state.latestInRange = r
        state.latestInRangeTs = rowTs
      }
    }

    const clients = []
    for (const state of byClient.values()) {
      if (!hasExplicitDateFilter) {
        if (state.latestAll) clients.push(state.latestAll)
        continue
      }
      if (!state.latestInRange) continue

      const row = { ...state.latestInRange }
      const baseline = state.baselineBefore
      if (baseline && fromIso) {
        row.closedPl = toFiniteNumber(state.latestInRange.closedPl) - toFiniteNumber(baseline.closedPl)
        row.trades = Math.max(0, Math.round(toFiniteNumber(state.latestInRange.trades) - toFiniteNumber(baseline.trades)))
      } else {
        row.closedPl = toFiniteNumber(state.latestInRange.closedPl)
        row.trades = Math.max(0, Math.round(toFiniteNumber(state.latestInRange.trades)))
      }
      clients.push(row)
    }

    const enrichedClients = clients.map((row) => {
      const closedPl = toFiniteNumber(row?.closedPl)
      const openPl = toFiniteNumber(row?.openPl)
      return {
        ...row,
        closedPl,
        openPl,
        profitMetric: plMode === 'open' ? openPl : closedPl,
      }
    })

    const filteredClients = enrichedClients.filter((row) => {
      if (!(hasExplicitDateFilter && sortBy === 'profit')) return true
      return Math.abs(toFiniteNumber(row?.profitMetric)) > 0.00001
    })
    filteredClients.sort((a, b) => sortBy === 'volume' ? b.trades - a.trades : b.profitMetric - a.profitMetric)
    const top = filteredClients.slice(0, topN)

    const entries = top.map((r, i) => ({
      rank: i + 1,
      clientId: r.clientId,
      clientName: r.clientName,
      clientLogin: r.clientLogin,
      country: r.country,
      affiliateId: r.affiliateId,
      closedPl: r.closedPl,
      openPl: r.openPl,
      profitMetric: r.profitMetric,
      profit: r.profitMetric,
      trades: r.trades,
    }))

    const payload = {
      ok: true,
      data: {
        leaderboard: entries,
        total: filteredClients.length,
        topN,
        sortBy,
        plMode,
        affiliateId: affiliateId || null,
        from: fromRaw || null,
        to: toRaw || null,
        updatedAt: _dbNativeStoreState.updatedAt || null,
      },
    }

    _dbNativeLeaderboardCache.set(cacheKey, {
      expiresAt: nowMs + DB_NATIVE_LEADERBOARD_CACHE_MS,
      payload,
    })

    return json(res, 200, payload, { 'Cache-Control': 'no-store' })
  } catch (err) {
    return json(res, err.status || 500, { ok: false, error: err.message || 'Internal error' })
  }
}

async function handleCreolabsDbNative(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')

  try {
    const urlObj = new URL(req.url || '/', 'http://localhost')
    const limit = parsePositiveInt(urlObj.searchParams.get('limit'), 200, CREOLABS_NATIVE_PAGE_LIMIT)
    const offset = decodeDbLiveCursor(urlObj.searchParams.get('page'))
    const fromRaw = normalizeText(urlObj.searchParams.get('from'))
    const toRaw = normalizeText(urlObj.searchParams.get('to'))
    const hasExplicitDateFilter = Boolean(fromRaw || toRaw)
    const forceRefresh = normalizeText(urlObj.searchParams.get('refresh')) === '1'

    let fromMs = Number.NEGATIVE_INFINITY
    let toMs = Number.POSITIVE_INFINITY
    if (hasExplicitDateFilter) {
      if (fromRaw) fromMs = parseIsoDateBoundary(fromRaw, { endOfDay: false })
      if (toRaw) toMs = parseIsoDateBoundary(toRaw, { endOfDay: true })
      if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs) {
        const error = new Error('Invalid date range. Use ?from=YYYY-MM-DD&to=YYYY-MM-DD')
        error.status = 400
        throw error
      }
    }

    hydrateDbNativeStoreFromDisk()

    let nativeStore = {
      rows: _dbNativeStoreState.rows,
      report: _dbNativeStoreState.report,
      schema: _dbNativeStoreState.schema,
      filters: _dbNativeStoreState.filters,
      warnings: _dbNativeStoreState.warnings,
      generatedAt: _dbNativeStoreState.generatedAt,
      updatedAt: _dbNativeStoreState.updatedAt,
      sourcePaging: _dbNativeStoreState.sourcePaging,
    }

    const nowMs = Date.now()
    const todayIsoUtc = nowIsoDateOnly()
    const storeGeneratedMs = Date.parse(normalizeText(nativeStore.generatedAt || nativeStore.updatedAt))
    const initialCacheAgeMs = Number.isFinite(storeGeneratedMs) ? Math.max(0, nowMs - storeGeneratedMs) : Number.MAX_SAFE_INTEGER
    const storeGeneratedUtcIso = Number.isFinite(storeGeneratedMs) ? isoDateOnlyFromMs(storeGeneratedMs) : ''
    const staleByAge = initialCacheAgeMs > DB_NATIVE_MAX_STALE_MS
    const staleByDay = !storeGeneratedUtcIso || storeGeneratedUtcIso !== todayIsoUtc

    const shouldSync =
      forceRefresh ||
      !Array.isArray(nativeStore.rows) ||
      nativeStore.rows.length === 0 ||
      staleByAge ||
      staleByDay

    let syncTriggered = false
    if (shouldSync) {
      syncTriggered = true
      nativeStore = await syncDbNativeStore({ forceRefresh: forceRefresh || staleByAge || staleByDay })
    }

    const effectiveStoreGeneratedMs = Date.parse(normalizeText(nativeStore.generatedAt || nativeStore.updatedAt))
    const cacheAgeMs = Number.isFinite(effectiveStoreGeneratedMs) ? Math.max(0, nowMs - effectiveStoreGeneratedMs) : 0

    const mappedRows = Array.isArray(nativeStore.rows) ? nativeStore.rows : []
    const dateFiltered = hasExplicitDateFilter
      ? mappedRows.filter((user) => {
          const ts = parseIsoDateBoundary(normalizeText(user?.clientTimestamp || user?.date), { endOfDay: false })
          if (!Number.isFinite(ts)) return false
          return ts >= fromMs && ts <= toMs
        })
      : mappedRows

    const filtered = applyDbNativeFilters(dateFiltered, urlObj)
    const sorted = applyDbNativeSort(filtered, urlObj)
    const total = sorted.users.length
    const safeOffset = Math.min(Math.max(0, offset), Math.max(0, total - 1))
    const pageUsers = sorted.users.slice(safeOffset, safeOffset + limit)
    const upstreamReturned = pageUsers.length

    const hasPrev = safeOffset > 0
    const hasNext = safeOffset + limit < total
    const prevOffset = Math.max(0, safeOffset - limit)
    const nextOffset = safeOffset + upstreamReturned

    const snapshotRows = buildLatestDbNativeSnapshotRows(sorted.users)
    const todayIso = nowIsoDateOnly()
    const yesterdayIso = subtractDaysIsoDateOnly(todayIso, 1)
    const monthPrefix = todayIso.slice(0, 7)
    // Use the full unfiltered store for monthly/daily KPIs so UI filters
    // on the grid do not distort the current-month aggregates.
    const allStoreRows = Array.isArray(mappedRows) ? mappedRows : []
    const currentMonthRows = allStoreRows.filter((row) => {
      const iso = resolveDbNativeRowIsoDate(row)
      return iso.startsWith(monthPrefix) && iso <= todayIso
    })
    const currentDayRows = allStoreRows.filter((row) => resolveDbNativeRowIsoDate(row) === todayIso)
    const previousDayRows = allStoreRows.filter((row) => resolveDbNativeRowIsoDate(row) === yesterdayIso)
    const currentMonthSnapshotRows = buildLatestDbNativeSnapshotRows(currentMonthRows)
    const currentDaySnapshotRows = buildLatestDbNativeSnapshotRows(currentDayRows)
    const previousDaySnapshotRows = buildLatestDbNativeSnapshotRows(previousDayRows)

    const queryKpis = aggregateDbNativeCatalogKpis(snapshotRows)
    const currentMonthKpis = aggregateDbNativeCatalogKpis(currentMonthSnapshotRows)
    const currentDayKpis = aggregateDbNativeCatalogKpis(currentDaySnapshotRows)
    const previousDayKpis = aggregateDbNativeCatalogKpis(previousDaySnapshotRows)

    return json(
      res,
      200,
      {
        ok: true,
        data: {
          meta: {
            contractVersion: DB_NATIVE_CONTRACT_VERSION,
            parityMode: 'native-local-db',
            reportName: normalizeText(nativeStore?.report?.name || 'DB Native'),
            reportColumns: DB_NATIVE_REPORT_COLUMNS,
            sourceRows: {
              sourceMode: 'native-local-db',
              sourceSnapshot: 'db-native-store',
              updatedAt: normalizeText(nativeStore.generatedAt),
              cached: !syncTriggered,
              cacheAgeMs: Number.isFinite(cacheAgeMs) ? cacheAgeMs : 0,
              upstreamRows: Array.isArray(nativeStore.rows) ? nativeStore.rows.length : 0,
              upstreamTotal: Array.isArray(nativeStore.rows) ? nativeStore.rows.length : total,
              upstreamReturned,
              upstreamFromCache: !syncTriggered,
            },
            queryKpis: {
              scope: 'latest-per-client-with-filters',
              ...queryKpis,
            },
            volumeKpis: {
              scope: 'latest-per-client-with-filters',
              source: 'native-local-db',
              ...queryKpis,
            },
            currentMonthKpis: {
              scope: 'latest-per-client-current-month-local',
              referenceDate: todayIso,
              ...currentMonthKpis,
            },
            currentDayKpis: {
              scope: 'latest-per-client-current-day-local',
              referenceDate: todayIso,
              ...currentDayKpis,
            },
            previousDayKpis: {
              scope: 'latest-per-client-previous-day-local',
              referenceDate: yesterdayIso,
              ...previousDayKpis,
            },
            quality: {
              score: Array.isArray(nativeStore.warnings) && nativeStore.warnings.length ? 90 : 100,
              warnings: Array.isArray(nativeStore.warnings) ? nativeStore.warnings : [],
              sourceMode: 'native-local-db',
              fallbackUsed: false,
              consecutiveFailures: 0,
            },
            diagnostics: {
              reportId: normalizeText(nativeStore?.report?.publicId || nativeStore?.report?.id),
              schemaColumns: Array.isArray(nativeStore?.schema?.columns) ? nativeStore.schema.columns.length : 0,
              storeFile: toWorkspaceRelativePath(getDbNativeStoreFilePath()),
              storeUpdatedAt: normalizeText(nativeStore?.updatedAt),
            },
            nativeApi: {
              report: nativeStore.report || null,
              schema: nativeStore.schema || null,
              filters: nativeStore.filters || null,
              generatedAt: normalizeText(nativeStore.generatedAt),
              warnings: Array.isArray(nativeStore.warnings) ? nativeStore.warnings : [],
              fromCache: !forceRefresh,
              sourcePaging: nativeStore.sourcePaging || null,
            },
            query: {
              total,
              limit,
              offset: safeOffset,
              from: fromRaw,
              to: toRaw,
              sort: sorted.sort,
              search: normalizeText(urlObj.searchParams.get('search')),
              status: normalizeText(urlObj.searchParams.get('status')),
              country: normalizeText(urlObj.searchParams.get('country')),
              affiliateId: normalizeText(urlObj.searchParams.get('affiliateId')),
              brand: normalizeText(urlObj.searchParams.get('brand')),
              client: normalizeText(urlObj.searchParams.get('client') || urlObj.searchParams.get('clientId')),
              user: normalizeText(urlObj.searchParams.get('user') || urlObj.searchParams.get('agent')),
              refresh: forceRefresh,
            },
          },
          page: {
            count: pageUsers.length,
            hasPrev,
            hasNext,
            prev: hasPrev ? encodeDbLiveCursor(prevOffset) : '',
            next: hasNext ? encodeDbLiveCursor(nextOffset) : '',
          },
          users: pageUsers,
        },
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Creolabs db-native request failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleCreolabsRegisteredUsers(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')

  try {
    const dataset = await buildCreolabsRegisteredUsersDataset(req)

    if (dataset.format === 'csv') {
      const columns = [
        'clientId',
        'clientName',
        'brand',
        'affiliateId',
        'clientLogin',
        'user',
        'country',
        'clientTimestamp',
        'status',
        'openedTrades',
        'equity',
        'ltdDate',
        'lttDate',
      ]
      const csv = toCsv(dataset.users, columns)
      const filename = `creolabs-registered-users-${new Date(dataset.fromMs).toISOString().slice(0, 10)}_${new Date(dataset.toMs).toISOString().slice(0, 10)}.csv`
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Cache-Control', 'no-store')
      res.end(csv)
      return
    }

    return json(
      res,
      200,
      {
        ok: true,
        data: {
          meta: dataset.meta,
          users: dataset.users,
        },
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (e) {
    return json(
      res,
      e?.status || 502,
      {
        ok: false,
        error: e?.message || 'Creolabs registered-users request failed',
        details: e?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

function pickLatestLeadFromDatesRows(rows) {
  let best = null
  let bestRegistrationTime = -1
  let bestActivityTime = -1
  let bestClientIdNum = -1

  const parseIso = (value) => {
    const raw = normalizeText(value)
    if (!raw || raw === '-') return -1
    const t = Date.parse(raw)
    return Number.isFinite(t) ? t : -1
  }

  for (const row of rows || []) {
    const registrationTime = parseIso(row?.clientTimestamp)
    const ltdTime = parseIso(row?.ltdDate)
    const lttTime = parseIso(row?.lttDate)
    const activityTime = Math.max(registrationTime, ltdTime, lttTime)

    const clientIdText = normalizeText(row?.clientId)
    const clientIdNum = Number(clientIdText)
    const candidateClientIdNum = Number.isFinite(clientIdNum) ? clientIdNum : -1

    const betterRegistration = registrationTime > bestRegistrationTime
    const registrationTieBetterActivity = registrationTime === bestRegistrationTime && activityTime > bestActivityTime
    const fullTieBetterClientId =
      registrationTime === bestRegistrationTime &&
      activityTime === bestActivityTime &&
      candidateClientIdNum > bestClientIdNum

    if (betterRegistration || registrationTieBetterActivity || fullTieBetterClientId) {
      bestRegistrationTime = registrationTime
      bestActivityTime = activityTime
      bestClientIdNum = candidateClientIdNum
      best = row
    }
  }

  return best
}

function findLatestClientMonthMetaByClientId(clientMonthsRows, clientId) {
  const target = normalizeText(clientId)
  if (!target) return null

  const targetNum = Number(target)
  let best = null
  let bestRank = -1
  let bestActivity = -1

  for (const row of clientMonthsRows || []) {
    const rid = normalizeText(row?.clientId)
    if (!rid) continue
    const ridNum = Number(rid)
    const sameClient =
      rid === target ||
      (Number.isFinite(targetNum) && Number.isFinite(ridNum) && ridNum === targetNum)
    if (!sameClient) continue

    const periodId = normalizeText(row?.periodId)
    const rank = typeof ymRank === 'function' ? ymRank(periodId) : -1
    const activityScore =
      toFiniteNumber(row?.trades) +
      toFiniteNumber(row?.deposit) +
      Math.max(0, toFiniteNumber(row?.ftd)) +
      Math.max(0, toFiniteNumber(row?.rdp))

    if (rank > bestRank || (rank === bestRank && activityScore > bestActivity)) {
      bestRank = rank
      bestActivity = activityScore
      best = row
    }
  }

  if (!best) return null

  return {
    clientId: normalizeText(best?.clientId),
    clientName: normalizeText(best?.clientName),
    brand: normalizeText(best?.brand),
    affiliateId: normalizeText(best?.affiliateId),
    clientLogin: normalizeText(best?.clientLogin),
    user: normalizeText(best?.user),
    country: normalizeText(best?.country),
    periodId: normalizeText(best?.periodId),
  }
}

function findScoreByClientId(scores, clientId) {
  const target = normalizeText(clientId)
  if (!target) return null

  const targetNum = Number(target)
  for (const score of scores || []) {
    const sid = normalizeText(score?.clientId)
    if (!sid) continue
    if (sid === target) return score
    const sidNum = Number(sid)
    if (Number.isFinite(targetNum) && Number.isFinite(sidNum) && sidNum === targetNum) return score
  }
  return null
}

async function handleCreolabsLatestLead(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  const bust = urlObj.searchParams.get('bust') === '1'

  if (bust) {
    clearCreolabsClientVariantCaches()
  }

  let objectLatestLead = null
  let objectLatestLeadCached = false
  try {
    const objectResolved = await resolveCreolabsLatestLeadFromObject(config)
    objectLatestLead = objectResolved.data
    objectLatestLeadCached = Boolean(objectResolved.cached)
  } catch {
    objectLatestLead = null
  }

  let data = null
  let cached = false
  let stale = false
  let cacheAgeMs = null

  if (!bust) {
    let cacheEntry = getCreolabsClientVariantCache('clientMonths')
    const pendingAge = cacheEntry?.promiseStartedAt ? Date.now() - cacheEntry.promiseStartedAt : 0

    if (cacheEntry?.promise && pendingAge > CREOLABS_WARMUP_MAX_MS) {
      // Recover from stuck warmups by resetting in-flight promise.
      setCreolabsClientVariantCache('clientMonths', null)
      cacheEntry = null
    }

    const age = cacheEntry?.fetchedAt ? Date.now() - cacheEntry.fetchedAt : Infinity
    const hasData = Boolean(cacheEntry?.data)
    const warm = hasData && age < CREOLABS_CACHE_TTL

    if (warm) {
      data = cacheEntry.data
      cached = true
      cacheAgeMs = age
    } else {
      if (hasData) {
        // Prefer stale data for ms-level test UX while refreshing in background.
        data = cacheEntry.data
        cached = true
        stale = true
        cacheAgeMs = age
        if (!cacheEntry?.promise) {
          resolveCreolabsClientVariant(config, 'clientMonths').catch(() => {})
        }
      } else {
        if (!cacheEntry?.promise) {
          resolveCreolabsClientVariant(config, 'clientMonths').catch(() => {})
        }

        if (objectLatestLead) {
          return json(
            res,
            200,
            {
              ok: true,
              data: {
                cached: false,
                stale: false,
                cacheAgeMs: null,
                sourceRows: {
                  clientMonths: 0,
                  clientDates: 0,
                  clientScores: 0,
                },
                source: {
                  latestLeadObjectId: CREOLABS_LATEST_LEAD_OBJECT_ID,
                  latestLeadObjectUsed: true,
                  latestLeadObjectCached: Boolean(objectLatestLeadCached),
                  variantWarming: true,
                },
                latestLead: objectLatestLead,
                matchedClientScore: null,
                mergedLeadData: { ...(objectLatestLead || {}) },
              },
            },
            { 'Cache-Control': 'no-store' }
          )
        }

        return json(
          res,
          202,
          {
            ok: false,
            warming: true,
            warmingSinceMs: pendingAge > 0 ? Math.max(0, Math.round(pendingAge)) : 0,
            error: 'Creolabs cache warming in progress. Retry in a few seconds.',
          },
          { 'Cache-Control': 'no-store' }
        )
      }
    }
  }

  if (!data) {
    try {
      const resolved = await resolveCreolabsClientVariant(config, 'clientMonths')
      data = resolved.data
      cached = resolved.cached
    } catch (e) {
      return json(
        res,
        e?.status || 502,
        {
          ok: false,
          error: e?.message || 'Creolabs latest-lead request failed',
          details: e?.details || '',
        },
        { 'Cache-Control': 'no-store' }
      )
    }
  }

  const monthsRows = Array.isArray(data?.clientMonths) ? data.clientMonths : []
  const datesRows = buildDerivedClientDatesRowsFromClientMonths(monthsRows, data?.periodTo)
  const derivedLatestLead = pickLatestLeadFromDatesRows(datesRows)

  const latestLead = objectLatestLead || derivedLatestLead

  if (!latestLead) {
    return json(
      res,
      404,
      {
        ok: false,
        error: 'No latest lead available from current dataset',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const scores = buildCreolabsClientScores(monthsRows)
  const matchedClientScore = findScoreByClientId(scores, latestLead?.clientId)
  const monthMeta = findLatestClientMonthMetaByClientId(monthsRows, latestLead?.clientId)
  const mergedLeadData = {
    ...(matchedClientScore || {}),
    ...(monthMeta || {}),
    ...(objectLatestLead || {}),
    ...(latestLead || {}),
  }

  return json(
    res,
    200,
    {
      ok: true,
      data: {
        cached: Boolean(cached),
        stale: Boolean(stale),
        cacheAgeMs: Number.isFinite(cacheAgeMs) ? Math.max(0, Math.round(cacheAgeMs)) : null,
        sourceRows: {
          clientMonths: monthsRows.length,
          clientDates: datesRows.length,
          clientScores: scores.length,
        },
        source: {
          latestLeadObjectId: CREOLABS_LATEST_LEAD_OBJECT_ID,
          latestLeadObjectUsed: Boolean(objectLatestLead),
          latestLeadObjectCached: Boolean(objectLatestLeadCached),
        },
        latestLead,
        matchedClientScore,
        mergedLeadData,
      },
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleCreolabsBoardSnapshot(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  try {
    const { data } = await resolveCreolabsClientVariant(config, 'clientMonths')
    const scores = buildCreolabsClientScores(Array.isArray(data?.clientMonths) ? data.clientMonths : [])
    const snapshot = buildCreolabsBoardSnapshotFromRows(Array.isArray(data?.clientMonths) ? data.clientMonths : [], scores)
    return json(res, 200, snapshot, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(res, e?.status || 502, { ok: false, error: e?.message || 'Creolabs board snapshot request failed', details: e?.details || '' }, { 'Cache-Control': 'no-store' })
  }
}

async function handleCreolabsWeeklyExecutive(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  try {
    const { data } = await resolveCreolabsClientVariant(config, 'clientMonths')
    const scores = buildCreolabsClientScores(Array.isArray(data?.clientMonths) ? data.clientMonths : [])
    const snapshot = buildCreolabsBoardSnapshotFromRows(Array.isArray(data?.clientMonths) ? data.clientMonths : [], scores)
    const k = snapshot.kpis || {}
    const comparison = Array.isArray(snapshot.comparison) ? snapshot.comparison : []
    const attentionRequired = comparison
      .filter((row) => Number(row?.deltaPct) < 0)
      .map((row) => ({
        area: row.kpi,
        severity: Number(row.deltaPct) < -20 ? 'high' : 'medium',
        message: `${row.kpi} is down ${Math.abs(Math.round(Number(row.deltaPct) || 0))}% vs previous comparable period`,
      }))

    const businessHealth = [
      {
        area: 'Bullwaves Edge',
        score: Number(k.closedPl?.deltaPct || 0),
        status: Number(k.closedPl?.deltaPct || 0) >= 0 ? 'positive' : 'watch',
        summary: `Closed P&L ${formatCompactCurrency(k.closedPl?.current || 0)} vs previous period`,
      },
      {
        area: 'Net Deposits',
        score: Number(k.netDeposits?.deltaPct || 0),
        status: Number(k.netDeposits?.deltaPct || 0) >= 0 ? 'positive' : 'watch',
        summary: `Net deposits ${formatCompactCurrency(k.netDeposits?.current || 0)}`,
      },
      {
        area: 'Client Activation',
        score: Number(k.activeUsers?.deltaPct || 0),
        status: Number(k.activeUsers?.deltaPct || 0) >= 0 ? 'positive' : 'watch',
        summary: `Active users ${formatNumber(k.activeUsers?.current || 0)}`,
      },
    ]

    const intelligenceSignals = [
      {
        title: 'FTD momentum',
        direction: Number(k.ftdCount?.deltaPct || 0) >= 0 ? 'up' : 'down',
        detail: `FTD ${formatNumber(k.ftdCount?.current || 0)}`,
      },
      {
        title: 'Open P/L pressure',
        direction: Number(k.openPl?.current || 0) >= 0 ? 'up' : 'watch',
        detail: `Open P/L ${formatCompactCurrency(k.openPl?.current || 0)}`,
      },
      {
        title: 'Retention proxy',
        direction: Number(snapshot.funnel?.registrationToQftdPct || 0) >= 50 ? 'up' : 'watch',
        detail: `${Math.round(Number(snapshot.funnel?.registrationToQftdPct || 0))}% registration to QFTD`,
      },
    ]

    const recommendedActions = [
      {
        title: 'Protect the top clients',
        detail: 'Keep the high-value cluster warm and reduce churn risk on at-risk accounts.',
      },
      {
        title: 'Push conversion follow-up',
        detail: 'Focus on registrations that have not converted to FTD / QFTD yet.',
      },
    ]

    return json(
      res,
      200,
      {
        generatedAt: snapshot.generatedAt,
        executiveSnapshot: snapshot,
        businessHealth,
        intelligenceSignals,
        attentionRequired,
        recommendedActions,
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (e) {
    return json(res, e?.status || 502, { ok: false, error: e?.message || 'Creolabs weekly executive request failed', details: e?.details || '' }, { 'Cache-Control': 'no-store' })
  }
}

async function handleCreolabsLifetimeClusters(req, res) {
  if (req.method !== 'GET') return notAllowed(req, res, 'GET')
  const config = ensureConfigured(res)
  if (!config) return

  const urlObj = new URL(req.url || '/', 'http://localhost')
  if (urlObj.searchParams.get('bust') === '1') clearCreolabsClientVariantCaches()

  try {
    const { data } = await resolveCreolabsClientVariant(config, 'full')
    const scores = buildCreolabsClientScores(Array.isArray(data?.clients) ? data.clients : [])
    const clusterData = buildLifetimeClustersFromClients(scores)
    return json(res, 200, clusterData, { 'Cache-Control': 'no-store' })
  } catch (e) {
    return json(res, e?.status || 502, { ok: false, error: e?.message || 'Creolabs lifetime-clusters request failed', details: e?.details || '' }, { 'Cache-Control': 'no-store' })
  }
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
  if (head === 'sales') return handleQlikDynamicEndpoint(req, res, 'sales')
  if (head === 'retention') return handleQlikDynamicEndpoint(req, res, 'retention')
  if (head === 'deposits') return handleQlikDynamicEndpoint(req, res, 'deposits')
  if (head === 'affiliates') return handleQlikDynamicEndpoint(req, res, 'affiliates')
  if (head === 'client-months') return handleQlikDynamicEndpoint(req, res, 'client-months')

  // Creolabs live PL comparison route
  if (head === 'creolabs' && parts[1] === 'live-pl') {
    return handleCreolabsLivePl(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'clients') {
    return handleCreolabsClients(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'latest-lead') {
    return handleCreolabsLatestLead(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'client-dates') {
    return handleCreolabsClientDates(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'registered-users') {
    return handleCreolabsRegisteredUsers(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'db-live') {
    return json(res, 410, { ok: false, error: 'DB Live endpoint removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
  }

  if (head === 'creolabs' && parts[1] === 'db-live-2') {
    return json(res, 410, { ok: false, error: 'DB Live 2 endpoint removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
  }

  if (head === 'creolabs' && parts[1] === 'db-native' && parts[2] === 'leaderboard') {
    return handleCreolabsDbNativeLeaderboard(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'db-native') {
    return handleCreolabsDbNative(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'db-live-contract') {
    return json(res, 410, { ok: false, error: 'DB Live contract endpoint removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
  }

  if (head === 'creolabs' && parts[1] === 'db-live-ingestion-status') {
    return json(res, 410, { ok: false, error: 'DB Live ingestion endpoints removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
  }

  if (head === 'creolabs' && parts[1] === 'db-live-ingestion-control') {
    return json(res, 410, { ok: false, error: 'DB Live ingestion endpoints removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
  }

  if (head === 'creolabs' && parts[1] === 'db-live-export') {
    return json(res, 410, { ok: false, error: 'DB Live export endpoint removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
  }

  if (head === 'creolabs' && parts[1] === 'db-live-report-templates') {
    return json(res, 410, { ok: false, error: 'DB Live report endpoints removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
  }

  if (head === 'creolabs' && parts[1] === 'reports' && parts[2] === 'jobs' && !parts[3]) {
    return json(res, 410, { ok: false, error: 'DB Live report endpoints removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
  }

  if (head === 'creolabs' && parts[1] === 'reports' && parts[2] === 'jobs' && parts[3] && parts[4] === 'status') {
    return json(res, 410, { ok: false, error: 'DB Live report endpoints removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
  }

  if (head === 'creolabs' && parts[1] === 'reports' && parts[2] === 'jobs' && parts[3] && parts[4] === 'download') {
    return json(res, 410, { ok: false, error: 'DB Live report endpoints removed. Use /api/qlik/creolabs/db-native' }, { 'Cache-Control': 'no-store' })
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

  if (head === 'creolabs' && parts[1] === 'lifetime-clusters') {
    return handleCreolabsLifetimeClusters(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'reports' && parts[2] === 'board-snapshot') {
    return handleCreolabsBoardSnapshot(req, res)
  }

  if (head === 'creolabs' && parts[1] === 'reports' && parts[2] === 'weekly-executive') {
    return handleCreolabsWeeklyExecutive(req, res)
  }

  if (head === 'engine' && parts[1] === 'apps' && parts[2] && parts[3] === 'sheets' && !parts[4]) {
    return handleEngineSheets(req, res, parts[2])
  }

  if (head === 'engine' && parts[1] === 'apps' && parts[2] && parts[3] === 'session' && parts[4] === 'ping') {
    return handleEngineSessionPing(req, res, parts[2])
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
    parts[3] === 'discover'
  ) {
    return handleEngineObjectDiscovery(req, res, parts[2])
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
  if (!config.hasOauth && !config.hasApiKey) return
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
  if (!config.hasOauth && !config.hasApiKey) return
  resolveCreolabsClientVariant(config, 'clientMonths')
    .catch(() => {})
}, 1500)

setTimeout(() => {
  const config = getConfig()
  if (!config.hasOauth && !config.hasApiKey) return
  resolveCreolabsRegisteredLeadsFromObject(config)
    .catch(() => {})
}, 2000)

// DB Live scheduler intentionally disabled: system now runs on DB Native only.

// DB Native: auto-refresh the local store every DB_NATIVE_AUTO_REFRESH_INTERVAL_MS (default 6h)
setTimeout(() => {
  if (!CREOLABS_NATIVE_API_URL || !CREOLABS_NATIVE_API_KEY) return
  setInterval(() => {
    syncDbNativeStore({ forceRefresh: true })
      .catch((err) => {
        console.warn('[db-native] scheduled auto-refresh failed:', err?.message || String(err))
      })
  }, DB_NATIVE_AUTO_REFRESH_INTERVAL_MS)
}, 10_000) // initial delay to let server fully boot
