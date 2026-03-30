const { json, safeParseJsonBody, pickHeader } = require('./_http')
const { hasKvEnv, kvGetJson, kvSetJson } = require('./kv')
const fs = require('fs')
const path = require('path')

const STATE_KEY = 'convrs:whatsapp:stats:v1'
const STATE_TTL_SECONDS = 60 * 60 * 24 * 30
const MAX_TRACKED_MESSAGES = 5000
const DEFAULT_API_URL = 'https://data.conv.rs/api'
const LOCAL_STATE_FILE = path.join(__dirname, '..', '..', '.convrs-state.json')

function coerceState(raw) {
  const base = defaultState()
  const source = raw && typeof raw === 'object' ? raw : {}

  const summary = source.summary && typeof source.summary === 'object'
    ? source.summary
    : {}

  return {
    ...base,
    ...source,
    templateStats: source.templateStats && typeof source.templateStats === 'object'
      ? source.templateStats
      : {},
    messageAckByMid: source.messageAckByMid && typeof source.messageAckByMid === 'object'
      ? source.messageAckByMid
      : {},
    messageMetaByMid: source.messageMetaByMid && typeof source.messageMetaByMid === 'object'
      ? source.messageMetaByMid
      : {},
    messageOrder: Array.isArray(source.messageOrder) ? source.messageOrder : [],
    summary: {
      ...base.summary,
      ...summary,
      errors: Array.isArray(summary.errors) ? summary.errors : [],
    },
  }
}

function hydrateMemoryStateFromDisk() {
  if (global.__BW_CONVRS_STATE_LOADED__) return
  global.__BW_CONVRS_STATE_LOADED__ = true

  try {
    if (!fs.existsSync(LOCAL_STATE_FILE)) return
    const raw = fs.readFileSync(LOCAL_STATE_FILE, 'utf8')
    if (!raw.trim()) return
    const parsed = JSON.parse(raw)
    global.__BW_CONVRS_STATE__ = coerceState(parsed)
  } catch {
    // Ignore malformed/partial local state and continue with defaults.
  }
}

function persistMemoryStateToDisk(state) {
  try {
    const payload = JSON.stringify(state, null, 2)
    fs.writeFileSync(LOCAL_STATE_FILE, payload, 'utf8')
  } catch {
    // Keep in-memory state even when local file persistence fails.
  }
}

function normalizeTemplateKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
}

function defaultState() {
  return {
    updatedAt: null,
    lastSyncAt: null,
    templateStats: {},
    messageAckByMid: {},
    messageMetaByMid: {},
    messageOrder: [],
    summary: {
      users: null,
      openConversations: null,
      closedConversationMessages: null,
      latestClosedConversationAt: null,
      errors: [],
    },
  }
}

function getMemoryState() {
  hydrateMemoryStateFromDisk()
  if (!global.__BW_CONVRS_STATE__) {
    global.__BW_CONVRS_STATE__ = defaultState()
  }
  return global.__BW_CONVRS_STATE__
}

async function readState() {
  if (!hasKvEnv()) return getMemoryState()

  try {
    const fromKv = await kvGetJson(STATE_KEY)
    if (fromKv && typeof fromKv === 'object') return fromKv
  } catch {
    // Fall back to memory when KV is temporarily unavailable.
  }

  return getMemoryState()
}

async function writeState(nextState) {
  const stamped = {
    ...nextState,
    updatedAt: new Date().toISOString(),
  }

  global.__BW_CONVRS_STATE__ = stamped

  if (hasKvEnv()) {
    try {
      await kvSetJson(STATE_KEY, stamped, STATE_TTL_SECONDS)
    } catch {
      // Keep memory as fallback even when KV write fails.
    }
  } else {
    persistMemoryStateToDisk(stamped)
  }

  return stamped
}

function readWebhookSecret() {
  return String(process.env.CONVRS_WEBHOOK_SECRET || '').trim()
}

function isWebhookAuthorized(req) {
  const expected = readWebhookSecret()
  if (!expected) return true

  try {
    const parsed = new URL(req?.url || '/', 'http://localhost')
    const byQuerySecret = String(parsed.searchParams.get('secret') || '').trim()
    const byQueryToken = String(parsed.searchParams.get('token') || '').trim()
    if ((byQuerySecret && byQuerySecret === expected) || (byQueryToken && byQueryToken === expected)) {
      return true
    }
  } catch {
    // Ignore malformed URL and continue with header-based checks.
  }

  const byHeader = String(pickHeader(req, 'x-convrs-webhook-secret') || '').trim()
  if (byHeader && byHeader === expected) return true

  const auth = String(pickHeader(req, 'authorization') || '').trim()
  if (auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim()
    if (token === expected) return true
  }

  return false
}

async function convrsCommand(cmd, payload) {
  const token = String(process.env.CONVRS_API_TOKEN || '').trim()
  if (!token) {
    const err = new Error('Missing CONVRS_API_TOKEN env variable')
    err.status = 503
    throw err
  }

  const apiUrl = String(process.env.CONVRS_API_URL || DEFAULT_API_URL).trim() || DEFAULT_API_URL
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const body = {
      token,
      cmd,
      ...(payload && typeof payload === 'object' ? payload : null),
    }

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    let data = null
    try {
      data = await resp.json()
    } catch {
      data = null
    }

    if (!resp.ok) {
      const err = new Error(`Convrs request failed (${resp.status})`)
      err.status = resp.status
      err.data = data
      throw err
    }

    if (!data || Number(data.ok) !== 1) {
      const err = new Error(data?.error || 'Convrs returned an error')
      err.status = 400
      err.data = data
      throw err
    }

    return data
  } finally {
    clearTimeout(timeout)
  }
}

function getTemplateBucket(templateStats, templateId, templateName) {
  const key = normalizeTemplateKey(templateId || templateName || 'unknown_template')
  if (!templateStats[key]) {
    templateStats[key] = {
      key,
      templateId: templateId || null,
      templateName: templateName || null,
      sent: 0,
      delivered: 0,
      read: 0,
      replies: 0,
      failed: 0,
      pending: 0,
      lastAck: null,
      lastEventAt: null,
      updatedAt: null,
    }
  }
  return templateStats[key]
}

function toAck(value) {
  const ack = Number(value)
  return Number.isFinite(ack) ? ack : null
}

function applyAckToBucket(bucket, ack) {
  if (ack === -1 || ack === -2) {
    bucket.failed += 1
    return
  }

  if (ack === 0) {
    bucket.pending += 1
  }

  if (ack >= 1) bucket.sent += 1
  if (ack >= 2) bucket.delivered += 1
  if (ack >= 3) bucket.read += 1
  if (ack === 10) bucket.replies += 1
}

function ensureMessageOrderAndPrune(state) {
  if (!Array.isArray(state.messageOrder)) state.messageOrder = []
  if (!state.messageAckByMid || typeof state.messageAckByMid !== 'object') state.messageAckByMid = {}
  if (!state.messageMetaByMid || typeof state.messageMetaByMid !== 'object') state.messageMetaByMid = {}

  while (state.messageOrder.length > MAX_TRACKED_MESSAGES) {
    const oldMid = state.messageOrder.shift()
    if (!oldMid) continue
    delete state.messageAckByMid[oldMid]
    delete state.messageMetaByMid[oldMid]
  }
}

function rebuildTemplateStatsFromMessages(state) {
  const templateStats = {}
  const byMid = state.messageMetaByMid && typeof state.messageMetaByMid === 'object'
    ? state.messageMetaByMid
    : {}

  for (const mid of state.messageOrder || []) {
    const meta = byMid[mid]
    if (!meta || typeof meta !== 'object') continue

    const templateId = String(meta.templateId || '').trim()
    const templateName = String(meta.templateName || '').trim()
    const ack = toAck(meta.ack)
    if (!Number.isFinite(ack)) continue

    const bucket = getTemplateBucket(templateStats, templateId, templateName)
    applyAckToBucket(bucket, ack)

    const eventAt = String(meta.timestamp || meta.updatedAt || '')
    if (eventAt) bucket.lastEventAt = eventAt
    if (!bucket.updatedAt || String(meta.updatedAt || '') > String(bucket.updatedAt || '')) {
      bucket.updatedAt = String(meta.updatedAt || new Date().toISOString())
      bucket.lastAck = ack
    }

    if (!bucket.templateId && templateId) bucket.templateId = templateId
    if (!bucket.templateName && templateName) bucket.templateName = templateName
  }

  state.templateStats = templateStats
}

function upsertTrackedMessage(state, payload) {
  const mid = String(payload?.mid || '').trim()
  const ack = toAck(payload?.ack)
  if (!mid || !Number.isFinite(ack)) return false

  const templatePayload = payload?.webhookPayload && typeof payload.webhookPayload === 'object'
    ? payload.webhookPayload
    : {}

  const templateId = String(
    templatePayload.templateId || templatePayload.templateKey || payload?.templateId || ''
  ).trim()
  const templateName = String(
    templatePayload.templateName || payload?.templateName || templatePayload.name || ''
  ).trim()

  const prevAck = toAck(state.messageAckByMid[mid])
  if (Number.isFinite(prevAck) && prevAck >= ack) {
    // Ignore out-of-order or duplicate callbacks for the same message.
    return false
  }

  const nowIso = new Date().toISOString()
  const prevMeta = state.messageMetaByMid[mid] && typeof state.messageMetaByMid[mid] === 'object'
    ? state.messageMetaByMid[mid]
    : {}

  state.messageAckByMid[mid] = ack
  state.messageMetaByMid[mid] = {
    ...prevMeta,
    mid,
    ack,
    uid: String(payload?.uid || prevMeta.uid || '').trim() || null,
    botID: Number.isFinite(Number(payload?.botID)) ? Number(payload?.botID) : (prevMeta.botID || null),
    templateId: templateId || prevMeta.templateId || null,
    templateName: templateName || prevMeta.templateName || null,
    timestamp: String(payload?.timestamp || prevMeta.timestamp || nowIso),
    lastDetailsCheckAt: prevMeta.lastDetailsCheckAt || null,
    updatedAt: nowIso,
  }

  if (!state.messageOrder.includes(mid)) {
    state.messageOrder.push(mid)
  }

  ensureMessageOrderAndPrune(state)
  rebuildTemplateStatsFromMessages(state)
  return true
}

async function refreshMessageDetails(state, options = {}) {
  const maxItems = Math.max(0, Math.min(200, Number(options.maxItems || 25)))
  if (!maxItems) return { requested: 0, checked: 0, updated: 0, errors: [] }

  const now = Date.now()
  const staleMs = 1000 * 60 * 10
  const mids = []

  for (let i = (state.messageOrder || []).length - 1; i >= 0; i -= 1) {
    const mid = state.messageOrder[i]
    if (!mid) continue
    const meta = state.messageMetaByMid?.[mid]
    if (!meta) continue

    const ack = toAck(meta.ack)
    const lastCheckAt = Date.parse(String(meta.lastDetailsCheckAt || ''))
    const stale = !Number.isFinite(lastCheckAt) || now - lastCheckAt > staleMs
    const shouldRefresh = !Number.isFinite(ack) || ack < 10 || stale
    if (!shouldRefresh) continue

    mids.push(mid)
    if (mids.length >= maxItems) break
  }

  let checked = 0
  let updated = 0
  const errors = []

  for (const mid of mids) {
    checked += 1
    try {
      const details = await convrsCommand('GetMessageDetails', { mid })
      const ack = toAck(details?.ack)
      const current = state.messageMetaByMid?.[mid]
      if (!current) continue

      const prevAck = toAck(current.ack)
      const nowIso = new Date().toISOString()

      state.messageMetaByMid[mid] = {
        ...current,
        ack: Number.isFinite(ack) ? ack : current.ack,
        uid: String(details?.uid || current.uid || '').trim() || null,
        botID: Number.isFinite(Number(details?.botID)) ? Number(details?.botID) : (current.botID || null),
        lastDetailsCheckAt: nowIso,
        updatedAt: nowIso,
      }

      if (Number.isFinite(ack)) {
        state.messageAckByMid[mid] = ack
      }

      if (Number.isFinite(ack) && (!Number.isFinite(prevAck) || ack > prevAck)) {
        updated += 1
      }
    } catch (e) {
      if (errors.length < 10) {
        errors.push({ mid, message: e?.message || 'Unknown error' })
      }
    }
  }

  if (checked > 0) {
    ensureMessageOrderAndPrune(state)
    rebuildTemplateStatsFromMessages(state)
  }

  return { requested: mids.length, checked, updated, errors }
}

function applyCallbackEvent(state, payload) {
  const tracked = upsertTrackedMessage(state, payload)
  if (tracked) return

  // If the payload has a mid the event was either a duplicate or out-of-order —
  // upsertTrackedMessage already handled it (or intentionally skipped it).
  // Do NOT apply the fallback in this case or we'd double-count.
  const hasMid = Boolean(String(payload?.mid || '').trim())
  if (hasMid) return

  // Fallback for callbacks missing mid (cannot be deduplicated/reconciled).
  const ack = toAck(payload?.ack)
  if (!Number.isFinite(ack)) return

  const templatePayload = payload?.webhookPayload && typeof payload.webhookPayload === 'object'
    ? payload.webhookPayload
    : {}
  const templateId = String(
    templatePayload.templateId || templatePayload.templateKey || payload?.templateId || ''
  ).trim()
  const templateName = String(
    templatePayload.templateName || payload?.templateName || templatePayload.name || ''
  ).trim()
  const bucket = getTemplateBucket(state.templateStats, templateId, templateName)
  applyAckToBucket(bucket, ack)
  bucket.lastAck = ack
  bucket.lastEventAt = String(payload?.timestamp || new Date().toISOString())
  bucket.updatedAt = new Date().toISOString()
}

function deriveApiStatus() {
  const hasToken = Boolean(String(process.env.CONVRS_API_TOKEN || '').trim())
  const hasSecret = Boolean(readWebhookSecret())
  const hasKv = hasKvEnv()

  return {
    configured: hasToken,
    hasWebhookSecret: hasSecret,
    persistence: hasKv ? 'kv' : 'local-file',
    apiUrl: String(process.env.CONVRS_API_URL || DEFAULT_API_URL).trim() || DEFAULT_API_URL,
    capabilities: {
      historicalTemplateAnalytics: false,
      sentMessageListing: false,
      templateCatalog: false,
      previousPeriodComparison: false,
      trendSeries: false,
      audienceInsights: false,
      conversionMetrics: false,
      replyLatency: false,
      supportsMessageDetailsForTrackedMids: true,
      webhookTrackingRequired: true,
      conversationsFlatScope: 'closed-agent-conversations',
      templateAttribution: 'callbacks-and-known-mid-only',
    },
  }
}

function buildTrackingCoverage(state) {
  const mids = Array.isArray(state?.messageOrder) ? state.messageOrder : []
  const byMid = state?.messageMetaByMid && typeof state.messageMetaByMid === 'object'
    ? state.messageMetaByMid
    : {}

  let attributedMessages = 0

  for (const mid of mids) {
    const meta = byMid[mid]
    if (!meta || typeof meta !== 'object') continue
    if (String(meta.templateId || '').trim() || String(meta.templateName || '').trim()) {
      attributedMessages += 1
    }
  }

  return {
    trackedMessages: mids.length,
    attributedMessages,
    unattributedMessages: Math.max(0, mids.length - attributedMessages),
    trackedTemplates: Object.keys(state?.templateStats || {}).length,
  }
}

function formatTemplateStatsForClient(templateStats) {
  const list = Object.values(templateStats || {}).map((item) => {
    const sent = Number(item.sent || 0)
    const delivered = Number(item.delivered || 0)
    const read = Number(item.read || 0)
    const replies = Number(item.replies || 0)

    return {
      ...item,
      replyRate: sent > 0 ? Number(((replies / sent) * 100).toFixed(1)) : 0,
      deliveryRate: sent > 0 ? Number(((delivered / sent) * 100).toFixed(1)) : 0,
      readRate: sent > 0 ? Number(((read / sent) * 100).toFixed(1)) : 0,
    }
  })

  list.sort((a, b) => Number(b.sent || 0) - Number(a.sent || 0))

  const byTemplateId = {}
  const byTemplateName = {}

  for (const row of list) {
    if (row.templateId) byTemplateId[normalizeTemplateKey(row.templateId)] = row
    if (row.templateName) byTemplateName[normalizeTemplateKey(row.templateName)] = row
  }

  return {
    list,
    byTemplateId,
    byTemplateName,
  }
}

async function handleHealth(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const state = await readState()
  return json(res, 200, {
    ok: true,
    status: deriveApiStatus(),
    lastSyncAt: state.lastSyncAt || null,
    updatedAt: state.updatedAt || null,
  })
}

async function handleStats(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const state = await readState()

  return json(res, 200, {
    ok: true,
    status: deriveApiStatus(),
    live: {
      templates: formatTemplateStatsForClient(state.templateStats),
      summary: state.summary,
      tracking: buildTrackingCoverage(state),
      updatedAt: state.updatedAt || null,
      lastSyncAt: state.lastSyncAt || null,
    },
  })
}

async function handleDebugState(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const state = await readState()
  const byMid = state.messageMetaByMid && typeof state.messageMetaByMid === 'object'
    ? state.messageMetaByMid
    : {}

  let limit = 20
  try {
    const parsed = new URL(req?.url || '/', 'http://localhost')
    const rawLimit = Number(parsed.searchParams.get('limit'))
    if (Number.isFinite(rawLimit)) {
      limit = Math.max(1, Math.min(200, Math.floor(rawLimit)))
    }
  } catch {
    // Ignore malformed URL and keep default limit.
  }

  const mids = Array.isArray(state.messageOrder) ? state.messageOrder : []
  const recent = mids.slice(-limit).reverse().map((mid) => {
    const meta = byMid[mid] && typeof byMid[mid] === 'object' ? byMid[mid] : {}
    return {
      mid,
      ack: toAck(meta.ack),
      templateId: meta.templateId || null,
      templateName: meta.templateName || null,
      uid: meta.uid || null,
      timestamp: meta.timestamp || null,
      updatedAt: meta.updatedAt || null,
      lastDetailsCheckAt: meta.lastDetailsCheckAt || null,
    }
  })

  return json(res, 200, {
    ok: true,
    status: deriveApiStatus(),
    debug: {
      trackedMessages: mids.length,
      templateBuckets: Object.keys(state.templateStats || {}).length,
      recentMessages: recent,
      updatedAt: state.updatedAt || null,
      lastSyncAt: state.lastSyncAt || null,
    },
  })
}

async function handleWebhook(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  if (!isWebhookAuthorized(req)) {
    return json(res, 401, { ok: false, error: 'Unauthorized webhook request' })
  }

  const body = safeParseJsonBody(req)
  if (!body || typeof body !== 'object') {
    return json(res, 400, { ok: false, error: 'Invalid JSON body' })
  }

  // Some Convrs plans expose only one global webhook URL.
  // If callback payloads (ack/mid) arrive here, process them as WhatsApp callbacks.
  const ack = Number(body?.ack)
  if (Number.isFinite(ack)) {
    const stateForAck = await readState()
    applyCallbackEvent(stateForAck, body)
    await writeState(stateForAck)
    return json(res, 200, { ok: true, ingested: 'whatsapp-callback-via-webhook' })
  }

  const cmd = String(body?.cmd || '').trim()

  const state = await readState()

  // Generic event ingestion. onUserConversation contains message arrays but not template metadata.
  if (cmd === 'onUserConversation') {
    const conv = Array.isArray(body?.data) ? body.data : []
    const messages = conv.length
    state.summary.closedConversationMessages = Number(state.summary.closedConversationMessages || 0) + messages
    state.summary.latestClosedConversationAt = new Date().toISOString()
    await writeState(state)
    return json(res, 200, { ok: true, ingested: cmd, messages })
  }

  await writeState(state)
  return json(res, 200, { ok: true, ingested: cmd || 'unknown' })
}

async function handleWhatsappCallback(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  if (!isWebhookAuthorized(req)) {
    return json(res, 401, { ok: false, error: 'Unauthorized callback request' })
  }

  const body = safeParseJsonBody(req)
  if (!body || typeof body !== 'object') {
    return json(res, 400, { ok: false, error: 'Invalid JSON body' })
  }

  const ack = Number(body?.ack)
  if (!Number.isFinite(ack)) {
    return json(res, 400, { ok: false, error: 'Missing or invalid ack value' })
  }

  const state = await readState()
  applyCallbackEvent(state, body)
  await writeState(state)

  return json(res, 200, { ok: true })
}

async function handleSync(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const body = safeParseJsonBody(req) || {}
  const botID = Number(body?.botID)
  const createdDate = String(body?.createdDate || '').trim()
  const includeConversations = body?.includeConversations === true
  const refreshDetails = body?.refreshMessageDetails !== false
  const refreshDetailsLimit = Math.max(0, Math.min(200, Number(body?.refreshMessageDetailsLimit || 25)))

  const state = await readState()
  const nextSummary = {
    users: null,
    openConversations: null,
    closedConversationMessages: Number(state.summary?.closedConversationMessages || 0),
    latestClosedConversationAt: state.summary?.latestClosedConversationAt || null,
    errors: [],
  }

  try {
    const usersPayload = {}
    if (Number.isFinite(botID) && botID > 0) usersPayload.botID = botID
    if (createdDate) usersPayload.CreatedDate = createdDate

    const usersResp = await convrsCommand('GetUsers', usersPayload)
    const rows = Array.isArray(usersResp?.data) ? usersResp.data : []
    const whatsappUsers = rows.filter((row) => {
      const uid = String(row?.uid || '').toLowerCase()
      const bot = String(row?.bot || '').toLowerCase()
      return uid.includes('-wa3-') || bot === 'wa3' || bot === 'whatsapp'
    }).length

    nextSummary.users = {
      total: rows.length,
      whatsapp: whatsappUsers,
    }
  } catch (e) {
    nextSummary.errors.push({ cmd: 'GetUsers', message: e?.message || 'Unknown error' })
  }

  if (includeConversations) {
    try {
      const openResp = await convrsCommand('GetOpenConversations', {})
      const openRows = Array.isArray(openResp?.data) ? openResp.data : []
      nextSummary.openConversations = {
        total: openRows.length,
        whatsapp: openRows.filter((row) => {
          const bid = String(row?.bot || row?.bid || '').toLowerCase()
          const uid = String(row?.uid || '').toLowerCase()
          return bid.includes('wa3') || uid.includes('-wa3-')
        }).length,
      }
    } catch (e) {
      nextSummary.errors.push({ cmd: 'GetOpenConversations', message: e?.message || 'Unknown error' })
    }

    try {
      const convResp = await convrsCommand('GetConversationsFlat', {})
      const convRows = Array.isArray(convResp?.data) ? convResp.data : []
      const whatsappRows = convRows.filter((row) => {
        const bot = String(row?.bot || '').toLowerCase()
        return bot === 'wa3' || bot === 'whatsapp'
      })

      nextSummary.closedConversationMessages = whatsappRows.length
      nextSummary.latestClosedConversationAt = new Date().toISOString()
    } catch (e) {
      nextSummary.errors.push({ cmd: 'GetConversationsFlat', message: e?.message || 'Unknown error' })
    }
  }

  let detailsRefresh = {
    requested: 0,
    checked: 0,
    updated: 0,
    errors: [],
  }

  if (refreshDetails) {
    detailsRefresh = await refreshMessageDetails(state, { maxItems: refreshDetailsLimit })
    if (Array.isArray(detailsRefresh.errors) && detailsRefresh.errors.length) {
      nextSummary.errors.push({
        cmd: 'GetMessageDetails',
        message: `${detailsRefresh.errors.length} detail refresh errors`,
      })
    }
  }

  const nextState = {
    ...state,
    summary: nextSummary,
    lastSyncAt: new Date().toISOString(),
  }

  const saved = await writeState(nextState)

  return json(res, 200, {
    ok: true,
    status: deriveApiStatus(),
    detailRefresh: detailsRefresh,
    live: {
      templates: formatTemplateStatsForClient(saved.templateStats),
      summary: saved.summary,
      tracking: buildTrackingCoverage(saved),
      updatedAt: saved.updatedAt || null,
      lastSyncAt: saved.lastSyncAt || null,
    },
  })
}

async function handleReset(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const resetState = defaultState()
  const saved = await writeState(resetState)
  return json(res, 200, { ok: true, updatedAt: saved.updatedAt })
}

/**
 * POST /api/convrs/register-send
 * Call this immediately after sending a WhatsApp template via Convrs API.
 * Body: { mid, templateName, templateId?, uid?, botID? }
 *
 * This seeds the message into the tracking state so that subsequent
 * Convrs callbacks (ack updates) can be attributed to the correct template.
 */
async function handleRegisterSend(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const body = safeParseJsonBody(req)
  const mid = String(body?.mid || '').trim()
  const templateName = String(body?.templateName || '').trim()
  const templateId = String(body?.templateId || '').trim()

  if (!mid) return json(res, 400, { ok: false, error: 'Missing required field: mid' })
  if (!templateName && !templateId) return json(res, 400, { ok: false, error: 'Missing required field: templateName or templateId' })

  const state = await readState()
  const nowIso = new Date().toISOString()

  // Register with ack=1 (sent) if not already present, otherwise keep existing ack.
  const existingAck = toAck(state.messageAckByMid[mid])
  const initialAck = Number.isFinite(existingAck) ? existingAck : 1

  const inserted = upsertTrackedMessage(state, {
    mid,
    ack: initialAck,
    uid: String(body?.uid || '').trim() || null,
    botID: Number.isFinite(Number(body?.botID)) ? Number(body?.botID) : null,
    templateId,
    templateName,
    timestamp: nowIso,
    webhookPayload: { templateId, templateName },
  })

  await writeState(state)

  return json(res, 200, {
    ok: true,
    mid,
    templateName: templateName || null,
    templateId: templateId || null,
    inserted,
    tracking: buildTrackingCoverage(state),
  })
}

/**
 * POST /api/convrs/test-callback
 * Simulates a Convrs ACK callback for a tracked mid — only for local dev/test.
 * Body: { mid, ack, templateName? }
 * ack values: 1=sent 2=delivered 3=read 10=reply -1=failed
 */
async function handleTestCallback(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  // Only allow in non-production environments.
  const nodeEnv = String(process.env.NODE_ENV || '').toLowerCase()
  if (nodeEnv === 'production') {
    return json(res, 403, { ok: false, error: 'Test callback not available in production' })
  }

  const body = safeParseJsonBody(req)
  const mid = String(body?.mid || '').trim()
  const ack = toAck(body?.ack)

  if (!mid) return json(res, 400, { ok: false, error: 'Missing required field: mid' })
  if (!Number.isFinite(ack)) return json(res, 400, { ok: false, error: 'Missing or invalid ack value (1=sent 2=delivered 3=read 10=reply -1=failed)' })

  const state = await readState()
  applyCallbackEvent(state, {
    mid,
    ack,
    templateName: String(body?.templateName || '').trim() || null,
    templateId: String(body?.templateId || '').trim() || null,
    timestamp: new Date().toISOString(),
  })
  await writeState(state)

  return json(res, 200, {
    ok: true,
    mid,
    ack,
    tracking: buildTrackingCoverage(state),
    templates: formatTemplateStatsForClient(state.templateStats),
  })
}

async function routeConvrs(req, res, parts) {
  const head = parts[0] || ''

  if (!head || head === 'health') return handleHealth(req, res)
  if (head === 'whatsapp-templates' && parts[1] === 'stats') return handleStats(req, res)
  if (head === 'debug-state') return handleDebugState(req, res)
  if (head === 'webhook') return handleWebhook(req, res)
  if (head === 'whatsapp-callback') return handleWhatsappCallback(req, res)
  if (head === 'sync') return handleSync(req, res)
  if (head === 'reset') return handleReset(req, res)
  if (head === 'register-send') return handleRegisterSend(req, res)
  if (head === 'test-callback') return handleTestCallback(req, res)

  return json(res, 404, { ok: false, error: 'Not found' })
}

module.exports = {
  routeConvrs,
}
