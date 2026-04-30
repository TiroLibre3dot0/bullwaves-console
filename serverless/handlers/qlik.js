const { json } = require('./_http')

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

async function routeQlik(req, res, parts) {
  const head = parts[0] || ''

  if (!head || head === 'health') return handleHealth(req, res)
  if (head === 'users' && parts[1] === 'me') return handleUsersMe(req, res)
  if (head === 'items') return handleItems(req, res)
  if (head === 'apps') return handleApps(req, res)

  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeQlik,
}
