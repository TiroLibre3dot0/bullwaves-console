const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { json, pickHeader, safeParseJsonBody } = require('./_http')

function resolveStorePath() {
  // Vercel serverless: writable area is /tmp. Local dev keeps using project uploads/.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'ypf_webhook_events.json')
  }
  return path.join(__dirname, '..', '..', 'uploads', 'ypf_webhook_events.json')
}

const STORE_PATH = resolveStorePath()
const MAX_EVENTS = 2000

function env(name, fallback = '') {
  const value = process.env?.[name]
  if (value == null) return fallback
  return String(value).trim()
}

function nowIso() {
  return new Date().toISOString()
}

function mask(value) {
  const raw = String(value || '')
  if (!raw) return ''
  if (raw.length <= 8) return `${raw.slice(0, 2)}***${raw.slice(-2)}`
  return `${raw.slice(0, 4)}...${raw.slice(-4)}`
}

function ensureStoreDir() {
  const dir = path.dirname(STORE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return { updatedAt: null, count: 0, events: [] }
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    const events = Array.isArray(parsed?.events) ? parsed.events : []
    return {
      updatedAt: parsed?.updatedAt || null,
      count: Number.isFinite(parsed?.count) ? Number(parsed.count) : events.length,
      events,
    }
  } catch {
    return { updatedAt: null, count: 0, events: [] }
  }
}

function writeStore(events) {
  ensureStoreDir()
  const safeEvents = Array.isArray(events) ? events.slice(0, MAX_EVENTS) : []
  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify(
      {
        updatedAt: nowIso(),
        count: safeEvents.length,
        events: safeEvents,
      },
      null,
      2
    ),
    'utf8'
  )
}

function constantTimeEquals(a, b) {
  const left = Buffer.from(String(a || ''))
  const right = Buffer.from(String(b || ''))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

function readSecret() {
  return env('YPF_WEBHOOK_SECRET')
}

function isAuthorized(req) {
  const expected = readSecret()
  if (!expected) return true

  const byHeader = String(pickHeader(req, 'x-ypf-webhook-secret') || '').trim()
  const byAltHeader = String(pickHeader(req, 'x-yourpropfirm-webhook-secret') || '').trim()
  const byQuery = String(req?.query?.secret || '').trim()
  const candidate = byHeader || byAltHeader || byQuery
  if (!candidate) return false

  return constantTimeEquals(candidate, expected)
}

function inferEventType(payload) {
  if (!payload || typeof payload !== 'object') return ''
  const candidates = [
    payload.event,
    payload.eventType,
    payload.type,
    payload.name,
    payload.topic,
  ]
  for (const value of candidates) {
    const text = String(value || '').trim()
    if (text) return text
  }
  return 'unknown'
}

function inferEntityId(payload) {
  if (!payload || typeof payload !== 'object') return ''
  const candidates = [
    payload.accountId,
    payload.userId,
    payload.challengeId,
    payload.payoutId,
    payload.id,
  ]
  for (const value of candidates) {
    const text = String(value || '').trim()
    if (text) return text
  }
  return ''
}

function redactPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload
  const blockedKeys = new Set(['password', 'token', 'secret', 'authorization', 'apiKey'])
  const out = Array.isArray(payload) ? [] : {}

  for (const [k, v] of Object.entries(payload)) {
    if (blockedKeys.has(String(k || '').toLowerCase())) {
      out[k] = '[REDACTED]'
      continue
    }

    if (v && typeof v === 'object') {
      out[k] = redactPayload(v)
    } else {
      out[k] = v
    }
  }

  return out
}

async function handleHealth(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const secret = readSecret()
  const store = readStore()

  return json(
    res,
    200,
    {
      ok: true,
      provider: 'yourpropfirm',
      configured: {
        hasWebhookSecret: Boolean(secret),
        webhookSecretPreview: mask(secret),
      },
      events: {
        stored: store.events.length,
        max: MAX_EVENTS,
        updatedAt: store.updatedAt,
      },
      defaultEventSet: [
        'account.created',
        'account.updated',
        'challenge.status_changed',
        'payout.status_changed',
      ],
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleWebhook(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  if (!isAuthorized(req)) {
    return json(res, 401, { ok: false, error: 'Unauthorized webhook request' }, { 'Cache-Control': 'no-store' })
  }

  const payload = safeParseJsonBody(req) || {}
  const eventType = inferEventType(payload)
  const entityId = inferEntityId(payload)
  const store = readStore()

  const entry = {
    receivedAt: nowIso(),
    requestId: crypto.randomUUID(),
    eventType,
    entityId,
    sourceIp: String(req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '').trim(),
    userAgent: String(pickHeader(req, 'user-agent') || '').trim(),
    payload: redactPayload(payload),
  }

  const nextEvents = [entry, ...(Array.isArray(store.events) ? store.events : [])].slice(0, MAX_EVENTS)
  writeStore(nextEvents)

  return json(
    res,
    200,
    {
      ok: true,
      accepted: true,
      eventType,
      entityId,
      requestId: entry.requestId,
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleEvents(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const limitRaw = Number(req?.query?.limit)
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.trunc(limitRaw))) : 50
  const store = readStore()

  return json(
    res,
    200,
    {
      ok: true,
      count: store.events.length,
      limit,
      events: (store.events || []).slice(0, limit),
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function routeYpf(req, res, parts) {
  const head = String(parts?.[0] || '').trim().toLowerCase()

  if (!head || head === 'health') return handleHealth(req, res)
  if (head === 'webhook') return handleWebhook(req, res)
  if (head === 'events') return handleEvents(req, res)

  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeYpf,
}
