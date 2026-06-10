const { json, safeParseJsonBody } = require('./_http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const dotenv = require('dotenv')

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.server.local'),
  override: false,
})

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.server'),
  override: false,
})

const DEFAULT_API_BASE_URL = 'https://api.sms.dynamicmessaging.co.uk'
const HISTORY_STORE_PATH = path.join(__dirname, '..', '..', 'uploads', 'sms_history_store.json')
const HISTORY_MAX_ITEMS = 500

function env(name, fallback = '') {
  const value = process.env[name]
  return value == null ? fallback : String(value).trim()
}

function normalizeBaseUrl(raw) {
  const safe = String(raw || DEFAULT_API_BASE_URL).trim()
  return safe.replace(/\/+$/, '')
}

function getConfig() {
  return {
    apiBaseUrl: normalizeBaseUrl(env('DYNAMIC_SMS_API_BASE_URL', DEFAULT_API_BASE_URL)),
    apiKey: env('DYNAMIC_SMS_API_KEY'),
    defaultSender: env('DYNAMIC_SMS_DEFAULT_SENDER', 'Bullwaves'),
    allowAllRecipients: env('DYNAMIC_SMS_ALLOW_ALL_RECIPIENTS') === '1',
    allowedRecipients: new Set(
      String(env('DYNAMIC_SMS_ALLOWED_RECIPIENTS', ''))
        .split(',')
        .map((item) => normalizePhone(item))
        .filter(Boolean)
    ),
  }
}

function maskToken(token) {
  const raw = String(token || '')
  if (!raw) return ''
  if (raw.length <= 8) return `${raw.slice(0, 2)}***${raw.slice(-2)}`
  return `${raw.slice(0, 4)}...${raw.slice(-4)}`
}

function normalizePhone(value) {
  return String(value || '')
    .trim()
    .replace(/[\s\-()]/g, '')
}

function nowIso() {
  return new Date().toISOString()
}

function mapProviderStatus(code) {
  const n = Number(code)
  if (!Number.isFinite(n)) return 'unknown'
  if (n === 0) return 'queued'
  if (n === 1) return 'processing'
  if (n === 2) return 'delivered'
  if (n === 3) return 'failed'
  if (n === 4) return 'rejected'
  return `status-${n}`
}

function ensureHistoryDir() {
  const dir = path.dirname(HISTORY_STORE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readHistoryStore() {
  try {
    if (!fs.existsSync(HISTORY_STORE_PATH)) {
      return { updatedAt: null, items: [] }
    }
    const raw = fs.readFileSync(HISTORY_STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed?.items) ? parsed.items : []
    return {
      updatedAt: parsed?.updatedAt || null,
      items,
    }
  } catch {
    return { updatedAt: null, items: [] }
  }
}

function writeHistoryStore(items) {
  ensureHistoryDir()
  const nextItems = Array.isArray(items) ? items.slice(0, HISTORY_MAX_ITEMS) : []
  fs.writeFileSync(
    HISTORY_STORE_PATH,
    JSON.stringify(
      {
        updatedAt: nowIso(),
        count: nextItems.length,
        items: nextItems,
      },
      null,
      2
    ),
    'utf8'
  )
}

function sortHistoryItems(items) {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a?.submittedAt || a?.lastCheckedAt || 0) || 0
    const tb = Date.parse(b?.submittedAt || b?.lastCheckedAt || 0) || 0
    return tb - ta
  })
}

function upsertHistoryItem(entry) {
  const providerMessageId = String(entry?.providerMessageId || '').trim()
  if (!providerMessageId) return null

  const store = readHistoryStore()
  const items = Array.isArray(store?.items) ? [...store.items] : []
  const idx = items.findIndex((item) => String(item?.providerMessageId || '') === providerMessageId)
  const current = idx >= 0 ? items[idx] : {}

  const next = {
    ...current,
    ...entry,
    providerMessageId,
    updatedAt: nowIso(),
    submittedAt: current?.submittedAt || entry?.submittedAt || nowIso(),
  }

  if (idx >= 0) items[idx] = next
  else items.push(next)

  const sorted = sortHistoryItems(items).slice(0, HISTORY_MAX_ITEMS)
  writeHistoryStore(sorted)
  return next
}

function findHistoryItem(providerMessageId) {
  const id = String(providerMessageId || '').trim()
  if (!id) return null
  const store = readHistoryStore()
  const items = Array.isArray(store?.items) ? store.items : []
  return items.find((item) => String(item?.providerMessageId || '') === id) || null
}

function isLikelyPhone(value) {
  const s = normalizePhone(value)
  if (!s) return false
  return /^\+?[0-9]{8,15}$/.test(s)
}

function isAllowedRecipient(phoneNumber, config) {
  const normalized = normalizePhone(phoneNumber)
  if (!normalized) return false
  if (config.allowAllRecipients) return true
  if (!config.allowedRecipients.size) return true
  return config.allowedRecipients.has(normalized)
}

async function dynamicFetch(config, endpoint, options = {}) {
  const target = `${config.apiBaseUrl}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey,
    Authorization: `Bearer ${config.apiKey}`,
    ...(options.headers || {}),
  }

  const response = await fetch(target, {
    ...options,
    headers,
  })

  const text = await response.text()
  let parsed = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!response.ok) {
    const err = new Error('Dynamic Messaging API request failed')
    err.status = response.status
    err.details = parsed || text || response.statusText
    throw err
  }

  return {
    status: response.status,
    data: parsed,
  }
}

async function handleHealth(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const config = getConfig()
  const configured = Boolean(config.apiKey)

  return json(
    res,
    configured ? 200 : 503,
    {
      ok: configured,
      provider: 'dynamic-messaging',
      configured,
      apiBaseUrl: config.apiBaseUrl,
      tokenPreview: maskToken(config.apiKey),
      recipientGuard: {
        allowAll: config.allowAllRecipients,
        allowListSize: config.allowedRecipients.size,
      },
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleSendTest(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const config = getConfig()
  if (!config.apiKey) {
    return json(
      res,
      500,
      {
        ok: false,
        error: 'Missing DYNAMIC_SMS_API_KEY',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const body = safeParseJsonBody(req) || {}
  const phoneNumber = normalizePhone(body?.phoneNumber)
  const message = String(body?.message || '').trim()
  const sender = String(body?.sender || config.defaultSender).trim()

  if (!isLikelyPhone(phoneNumber)) {
    return json(
      res,
      400,
      {
        ok: false,
        error: 'Invalid phoneNumber. Use E.164-like format, e.g. +447000000000',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  if (!isAllowedRecipient(phoneNumber, config)) {
    return json(
      res,
      403,
      {
        ok: false,
        error: 'Recipient not allowed by DYNAMIC_SMS_ALLOWED_RECIPIENTS policy',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  if (!message) {
    return json(
      res,
      400,
      {
        ok: false,
        error: 'message is required',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const payload = {
    sender,
    phoneNumber,
    message,
    newId: String(body?.newId || crypto.randomUUID()),
  }

  const optionalKeys = ['clientId', 'campaignId', 'phoneNumberId', 'token', 'trackLink', 'storageId']
  for (const key of optionalKeys) {
    if (body?.[key] != null && body?.[key] !== '') {
      payload[key] = body[key]
    }
  }

  try {
    const result = await dynamicFetch(config, '/api/SMSMessages', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const providerMessageId = String(
      typeof result?.data === 'string' ? result.data : result?.data?.id || result?.data?.uuid || ''
    ).trim()

    if (providerMessageId) {
      upsertHistoryItem({
        providerMessageId,
        sender,
        phoneNumber,
        message,
        statusCode: null,
        statusText: 'submitted',
        requestId: payload.newId,
        provider: 'dynamic-messaging',
        submittedAt: nowIso(),
        lastCheckedAt: null,
        rawStatus: null,
        error: null,
      })
    }

    return json(
      res,
      200,
      {
        ok: true,
        provider: 'dynamic-messaging',
        request: {
          endpoint: '/api/SMSMessages',
          phoneNumber,
          sender,
          newId: payload.newId,
        },
        providerMessageId,
        response: result.data,
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (error) {
    return json(
      res,
      error?.status || 502,
      {
        ok: false,
        provider: 'dynamic-messaging',
        error: error?.message || 'SMS send failed',
        details: error?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleMessageStatus(req, res, parts) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const config = getConfig()
  if (!config.apiKey) {
    return json(res, 500, { ok: false, error: 'Missing DYNAMIC_SMS_API_KEY' }, { 'Cache-Control': 'no-store' })
  }

  const messageId = String(parts?.[1] || '').trim()
  if (!messageId) {
    return json(res, 400, { ok: false, error: 'Missing message id' }, { 'Cache-Control': 'no-store' })
  }

  try {
    const result = await dynamicFetch(config, `/api/SMSMessages/${encodeURIComponent(messageId)}`, {
      method: 'GET',
    })

    const providerPayload = result?.data && typeof result.data === 'object' ? result.data : null
    const statusCode = Number(providerPayload?.status)
    const statusText = mapProviderStatus(statusCode)
    upsertHistoryItem({
      providerMessageId: messageId,
      statusCode: Number.isFinite(statusCode) ? statusCode : null,
      statusText,
      rawStatus: providerPayload,
      sender: providerPayload?.senderNumber || findHistoryItem(messageId)?.sender || '',
      phoneNumber: providerPayload?.phoneNumber || findHistoryItem(messageId)?.phoneNumber || '',
      lastCheckedAt: nowIso(),
      error: null,
    })

    return json(
      res,
      200,
      {
        ok: true,
        provider: 'dynamic-messaging',
        messageId,
        statusCode: Number.isFinite(statusCode) ? statusCode : null,
        statusText,
        response: result.data,
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (error) {
    return json(
      res,
      error?.status || 502,
      {
        ok: false,
        provider: 'dynamic-messaging',
        error: error?.message || 'SMS status request failed',
        details: error?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleHistory(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const limitRaw = Number(reqUrl.searchParams.get('limit'))
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.trunc(limitRaw))) : 50

  const store = readHistoryStore()
  const items = sortHistoryItems(Array.isArray(store?.items) ? store.items : []).slice(0, limit)

  return json(
    res,
    200,
    {
      ok: true,
      provider: 'dynamic-messaging',
      count: items.length,
      updatedAt: store?.updatedAt || null,
      items,
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleHistoryRefresh(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const config = getConfig()
  if (!config.apiKey) {
    return json(res, 500, { ok: false, error: 'Missing DYNAMIC_SMS_API_KEY' }, { 'Cache-Control': 'no-store' })
  }

  const body = safeParseJsonBody(req) || {}
  const idsFromBody = Array.isArray(body?.ids)
    ? body.ids.map((id) => String(id || '').trim()).filter(Boolean)
    : []
  const maxRaw = Number(body?.max)
  const max = Number.isFinite(maxRaw) ? Math.max(1, Math.min(100, Math.trunc(maxRaw))) : 25

  const store = readHistoryStore()
  const storeItems = sortHistoryItems(Array.isArray(store?.items) ? store.items : [])
  const targetIds = idsFromBody.length
    ? idsFromBody.slice(0, max)
    : storeItems.map((item) => String(item?.providerMessageId || '')).filter(Boolean).slice(0, max)

  const refreshed = []
  const failed = []

  for (const messageId of targetIds) {
    try {
      const result = await dynamicFetch(config, `/api/SMSMessages/${encodeURIComponent(messageId)}`, {
        method: 'GET',
      })
      const providerPayload = result?.data && typeof result.data === 'object' ? result.data : null
      const statusCode = Number(providerPayload?.status)
      const statusText = mapProviderStatus(statusCode)
      const updated = upsertHistoryItem({
        providerMessageId: messageId,
        statusCode: Number.isFinite(statusCode) ? statusCode : null,
        statusText,
        rawStatus: providerPayload,
        sender: providerPayload?.senderNumber || findHistoryItem(messageId)?.sender || '',
        phoneNumber: providerPayload?.phoneNumber || findHistoryItem(messageId)?.phoneNumber || '',
        lastCheckedAt: nowIso(),
        error: null,
      })
      refreshed.push(updated || { providerMessageId: messageId, statusCode, statusText })
    } catch (error) {
      const msg = error?.message || 'Status refresh failed'
      upsertHistoryItem({
        providerMessageId: messageId,
        lastCheckedAt: nowIso(),
        error: msg,
      })
      failed.push({
        providerMessageId: messageId,
        error: msg,
      })
    }
  }

  const nextStore = readHistoryStore()
  const nextItems = sortHistoryItems(Array.isArray(nextStore?.items) ? nextStore.items : []).slice(0, max)

  return json(
    res,
    200,
    {
      ok: true,
      provider: 'dynamic-messaging',
      requested: targetIds.length,
      refreshed: refreshed.length,
      failed: failed.length,
      failures: failed,
      items: nextItems,
      updatedAt: nextStore?.updatedAt || nowIso(),
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function routeSms(req, res, parts) {
  const head = String(parts?.[0] || '')

  if (head === 'health') return handleHealth(req, res)
  if (head === 'send-test') return handleSendTest(req, res)
  if (head === 'history') {
    if (parts[1] === 'refresh') return handleHistoryRefresh(req, res)
    return handleHistory(req, res)
  }
  if (head === 'status') return handleMessageStatus(req, res, parts)

  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeSms,
}
