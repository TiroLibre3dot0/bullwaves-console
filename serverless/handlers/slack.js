const { json, pickHeader, safeParseJsonBody } = require('./_http')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.server.local'),
  override: false,
})

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.server'),
  override: false,
})

const API_BASE_URL = 'https://slack.com/api'
const STORE_PATH = path.join(__dirname, '..', '..', 'uploads', 'slack_inbox_store.json')
const MAX_ITEMS = 4000

function env(name, fallback = '') {
  const value = process.env[name]
  return value == null ? fallback : String(value).trim()
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function parseAdminEmails() {
  return String(env('ADMIN_EMAILS', ''))
    .split(',')
    .map((item) => normalizeEmail(item))
    .filter(Boolean)
}

function readViewerEmail(req, body, reqUrl) {
  const byHeader = normalizeEmail(pickHeader(req, 'x-bullwaves-user-email'))
  if (byHeader) return byHeader

  const byBody = normalizeEmail(body?.viewerEmail)
  if (byBody) return byBody

  const byQuery = normalizeEmail(reqUrl?.searchParams?.get('viewerEmail'))
  if (byQuery) return byQuery

  return ''
}

function ensureAdminAccess(req, body, reqUrl) {
  const requireAdmin = env('SLACK_REQUIRE_ADMIN', '0') === '1'
  if (!requireAdmin) return { ok: true }

  const admins = parseAdminEmails()
  if (!admins.length) {
    return {
      ok: false,
      status: 500,
      payload: { ok: false, error: 'SLACK_REQUIRE_ADMIN=1 but ADMIN_EMAILS is empty' },
    }
  }

  const viewerEmail = readViewerEmail(req, body, reqUrl)
  if (!viewerEmail || !admins.includes(viewerEmail)) {
    return {
      ok: false,
      status: 403,
      payload: {
        ok: false,
        error: 'Access denied. Admin email required.',
        viewerEmail: viewerEmail || null,
      },
    }
  }

  return { ok: true, viewerEmail }
}

function ensureStoreDir() {
  const dir = path.dirname(STORE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function defaultStore() {
  return {
    updatedAt: null,
    syncedAt: null,
    channels: [],
    items: [],
  }
}

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return defaultStore()
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed?.items) ? parsed.items : []
    const channels = Array.isArray(parsed?.channels) ? parsed.channels : []
    return {
      updatedAt: parsed?.updatedAt || null,
      syncedAt: parsed?.syncedAt || null,
      channels,
      items,
    }
  } catch {
    return defaultStore()
  }
}

function writeStore(store) {
  ensureStoreDir()
  const items = Array.isArray(store?.items) ? store.items.slice(0, MAX_ITEMS) : []
  const channels = Array.isArray(store?.channels) ? store.channels : []

  const payload = {
    updatedAt: nowIso(),
    syncedAt: store?.syncedAt || null,
    channels,
    count: items.length,
    items,
  }

  fs.writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), 'utf8')
  return payload
}

function getConfig() {
  return {
    botToken: env('SLACK_BOT_TOKEN'),
    watchChannels: String(env('SLACK_WATCH_CHANNELS', ''))
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    defaultPerChannelLimit: Math.max(5, Math.min(150, Number(env('SLACK_PER_CHANNEL_LIMIT', '45')) || 45)),
    defaultChannelCount: Math.max(1, Math.min(30, Number(env('SLACK_DEFAULT_CHANNEL_COUNT', '8')) || 8)),
  }
}

async function slackApi(config, endpoint, params = {}) {
  const token = String(config?.botToken || '').trim()
  if (!token) {
    const err = new Error('Missing SLACK_BOT_TOKEN')
    err.status = 500
    throw err
  }

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params || {})) {
    if (value == null || value === '') continue
    query.set(key, String(value))
  }

  const target = `${API_BASE_URL}/${endpoint}${query.toString() ? `?${query.toString()}` : ''}`
  const response = await fetch(target, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body?.ok) {
    const err = new Error('Slack API request failed')
    err.status = response.status || 502
    err.details = body?.error || body || response.statusText || 'unknown_error'
    throw err
  }

  return body
}

async function listChannels(config) {
  const all = []
  let cursor = ''

  for (let i = 0; i < 8; i += 1) {
    const data = await slackApi(config, 'conversations.list', {
      exclude_archived: true,
      limit: 200,
      types: 'public_channel,private_channel',
      cursor,
    })

    const channels = Array.isArray(data?.channels) ? data.channels : []
    channels.forEach((ch) => {
      const id = String(ch?.id || '').trim()
      if (!id) return
      all.push({
        id,
        name: String(ch?.name || '').trim(),
        isPrivate: Boolean(ch?.is_private),
        isMember: Boolean(ch?.is_member),
      })
    })

    cursor = String(data?.response_metadata?.next_cursor || '').trim()
    if (!cursor) break
  }

  return all
}

function normalizeIdentifier(value) {
  return String(value || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase()
}

function resolveChannels(catalog, requestedIdentifiers, fallbackCount) {
  const list = Array.isArray(catalog) ? catalog : []
  const byId = new Map(list.map((ch) => [String(ch.id || ''), ch]))
  const byName = new Map(list.map((ch) => [normalizeIdentifier(ch.name), ch]))

  const picked = []
  const seen = new Set()

  const pushChannel = (channel) => {
    const id = String(channel?.id || '').trim()
    if (!id || seen.has(id)) return
    seen.add(id)
    picked.push(channel)
  }

  const requested = Array.isArray(requestedIdentifiers)
    ? requestedIdentifiers.map((x) => String(x || '').trim()).filter(Boolean)
    : []

  if (requested.length) {
    for (const raw of requested) {
      const byExactId = byId.get(raw)
      if (byExactId) {
        pushChannel(byExactId)
        continue
      }
      const byNormalizedName = byName.get(normalizeIdentifier(raw))
      if (byNormalizedName) pushChannel(byNormalizedName)
    }
  }

  if (!picked.length) {
    list.slice(0, fallbackCount).forEach(pushChannel)
  }

  return picked
}

function parseSlackTimestamp(ts) {
  const n = Number(String(ts || '0'))
  if (!Number.isFinite(n)) return 0
  return Math.trunc(n * 1000)
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferPriority(text, message) {
  const raw = String(text || '').toLowerCase()
  const hasBroadcast = /<!(channel|here|everyone)>|@(channel|here|everyone)/i.test(raw)
  const hasUserMention = /<@[a-z0-9]+>/i.test(raw)
  const hasQuestion = /\?/.test(raw)
  const hasUrgentKeyword = /(urgent|asap|critical|critico|bloccat|blocco|down|incident|failure|failed|errore|error)/i.test(raw)
  const replyCount = Number(message?.reply_count || 0)

  if (hasBroadcast || hasUrgentKeyword) return 'high'
  if (hasUserMention || hasQuestion || replyCount > 0) return 'medium'
  return 'low'
}

function buildInboxItem(channel, message) {
  const channelId = String(channel?.id || '').trim()
  const channelName = String(channel?.name || '').trim()
  const ts = String(message?.ts || '').trim()
  const itemId = `${channelId}:${ts}`
  const text = normalizeText(message?.text)
  const replyCount = Number(message?.reply_count || 0)
  const createdAtMs = parseSlackTimestamp(ts)

  return {
    id: itemId,
    channelId,
    channelName,
    ts,
    userId: String(message?.user || '').trim() || null,
    text,
    permalink: null,
    replyCount: Number.isFinite(replyCount) ? replyCount : 0,
    priority: inferPriority(text, message),
    status: 'open',
    owner: '',
    note: '',
    createdAt: createdAtMs ? new Date(createdAtMs).toISOString() : null,
    updatedAt: nowIso(),
  }
}

function sortInboxItems(items) {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a?.createdAt || 0) || 0
    const tb = Date.parse(b?.createdAt || 0) || 0
    return tb - ta
  })
}

function mergeInboxItems(existing, nextItems) {
  const map = new Map()
  const existingItems = Array.isArray(existing) ? existing : []
  const incomingItems = Array.isArray(nextItems) ? nextItems : []

  for (const item of existingItems) {
    const id = String(item?.id || '').trim()
    if (!id) continue
    map.set(id, item)
  }

  for (const item of incomingItems) {
    const id = String(item?.id || '').trim()
    if (!id) continue

    const prev = map.get(id)
    if (prev) {
      map.set(id, {
        ...item,
        status: prev?.status || 'open',
        owner: prev?.owner || '',
        note: prev?.note || '',
        updatedAt: nowIso(),
      })
    } else {
      map.set(id, item)
    }
  }

  return sortInboxItems(Array.from(map.values())).slice(0, MAX_ITEMS)
}

function filterInboxItems(items, query) {
  const list = Array.isArray(items) ? items : []
  const status = String(query?.status || '').trim().toLowerCase()
  const priority = String(query?.priority || '').trim().toLowerCase()
  const channelId = String(query?.channelId || '').trim()
  const search = String(query?.search || '').trim().toLowerCase()

  return list.filter((item) => {
    if (status && status !== 'all' && String(item?.status || 'open') !== status) return false
    if (priority && priority !== 'all' && String(item?.priority || '') !== priority) return false
    if (channelId && String(item?.channelId || '') !== channelId) return false
    if (search) {
      const hay = `${item?.channelName || ''} ${item?.text || ''}`.toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

function buildSummary(items) {
  const list = Array.isArray(items) ? items : []
  const summary = {
    total: list.length,
    open: 0,
    done: 0,
    high: 0,
    medium: 0,
    low: 0,
  }

  list.forEach((item) => {
    const status = String(item?.status || 'open')
    const priority = String(item?.priority || 'low')
    if (status === 'done') summary.done += 1
    else summary.open += 1

    if (priority === 'high') summary.high += 1
    else if (priority === 'medium') summary.medium += 1
    else summary.low += 1
  })

  return summary
}

async function handleHealth(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const config = getConfig()
  const tokenConfigured = Boolean(config.botToken)
  const store = readStore()

  return json(
    res,
    tokenConfigured ? 200 : 503,
    {
      ok: tokenConfigured,
      provider: 'slack',
      configured: tokenConfigured,
      watchChannelsCount: config.watchChannels.length,
      lastSyncAt: store?.syncedAt || null,
      inboxCount: Array.isArray(store?.items) ? store.items.length : 0,
      requireAdmin: env('SLACK_REQUIRE_ADMIN', '0') === '1',
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleChannels(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const access = ensureAdminAccess(req, null, reqUrl)
  if (!access.ok) {
    return json(res, access.status, access.payload, { 'Cache-Control': 'no-store' })
  }

  const config = getConfig()

  try {
    const channels = await listChannels(config)
    return json(
      res,
      200,
      {
        ok: true,
        provider: 'slack',
        count: channels.length,
        channels,
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (error) {
    return json(
      res,
      error?.status || 502,
      {
        ok: false,
        provider: 'slack',
        error: error?.message || 'Failed to load channels',
        details: error?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleInbox(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const store = readStore()

  const limitRaw = Number(reqUrl.searchParams.get('limit'))
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Math.trunc(limitRaw))) : 120

  const filtered = filterInboxItems(store.items, {
    status: reqUrl.searchParams.get('status') || '',
    priority: reqUrl.searchParams.get('priority') || '',
    channelId: reqUrl.searchParams.get('channelId') || '',
    search: reqUrl.searchParams.get('search') || '',
  })
  const items = filtered.slice(0, limit)

  return json(
    res,
    200,
    {
      ok: true,
      provider: 'slack',
      syncedAt: store?.syncedAt || null,
      updatedAt: store?.updatedAt || null,
      summary: buildSummary(store.items),
      filteredCount: filtered.length,
      count: items.length,
      channels: Array.isArray(store?.channels) ? store.channels : [],
      items,
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleRefresh(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const body = safeParseJsonBody(req) || {}
  const access = ensureAdminAccess(req, body, reqUrl)
  if (!access.ok) {
    return json(res, access.status, access.payload, { 'Cache-Control': 'no-store' })
  }

  const config = getConfig()
  const perChannelLimitRaw = Number(body?.perChannelLimit)
  const perChannelLimit = Number.isFinite(perChannelLimitRaw)
    ? Math.max(5, Math.min(150, Math.trunc(perChannelLimitRaw)))
    : config.defaultPerChannelLimit
  const includeBots = Boolean(body?.includeBots)

  const requestedIdentifiers = []
  if (Array.isArray(body?.channels)) {
    body.channels.forEach((v) => {
      const s = String(v || '').trim()
      if (s) requestedIdentifiers.push(s)
    })
  }
  if (Array.isArray(body?.channelIds)) {
    body.channelIds.forEach((v) => {
      const s = String(v || '').trim()
      if (s) requestedIdentifiers.push(s)
    })
  }

  if (!requestedIdentifiers.length && config.watchChannels.length) {
    requestedIdentifiers.push(...config.watchChannels)
  }

  try {
    const catalog = await listChannels(config)
    const selectedChannels = resolveChannels(
      catalog,
      requestedIdentifiers,
      config.defaultChannelCount
    )

    const nextItems = []

    for (const channel of selectedChannels) {
      const history = await slackApi(config, 'conversations.history', {
        channel: channel.id,
        limit: perChannelLimit,
      })
      const messages = Array.isArray(history?.messages) ? history.messages : []

      messages.forEach((message) => {
        const ts = String(message?.ts || '').trim()
        if (!ts) return
        if (String(message?.subtype || '').trim() === 'channel_join') return
        if (!includeBots && String(message?.subtype || '').trim() === 'bot_message') return

        const item = buildInboxItem(channel, message)
        if (!item.text && Number(item.replyCount || 0) <= 0) return
        nextItems.push(item)
      })
    }

    const store = readStore()
    const merged = mergeInboxItems(store.items, nextItems)
    const saved = writeStore({
      ...store,
      syncedAt: nowIso(),
      channels: selectedChannels,
      items: merged,
    })

    return json(
      res,
      200,
      {
        ok: true,
        provider: 'slack',
        selectedChannels,
        addedOrUpdated: nextItems.length,
        count: Array.isArray(saved?.items) ? saved.items.length : 0,
        syncedAt: saved?.syncedAt || null,
        updatedAt: saved?.updatedAt || null,
        summary: buildSummary(saved?.items || []),
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (error) {
    return json(
      res,
      error?.status || 502,
      {
        ok: false,
        provider: 'slack',
        error: error?.message || 'Slack refresh failed',
        details: error?.details || '',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleMark(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const body = safeParseJsonBody(req) || {}
  const access = ensureAdminAccess(req, body, reqUrl)
  if (!access.ok) {
    return json(res, access.status, access.payload, { 'Cache-Control': 'no-store' })
  }

  const itemId = String(body?.itemId || '').trim()
  if (!itemId) {
    return json(res, 400, { ok: false, error: 'itemId is required' }, { 'Cache-Control': 'no-store' })
  }

  const statusRaw = String(body?.status || '').trim().toLowerCase()
  const status = statusRaw === 'done' ? 'done' : 'open'
  const owner = String(body?.owner || '').trim().slice(0, 120)
  const note = String(body?.note || '').trim().slice(0, 1000)

  const store = readStore()
  const items = Array.isArray(store?.items) ? [...store.items] : []
  const idx = items.findIndex((item) => String(item?.id || '') === itemId)
  if (idx < 0) {
    return json(res, 404, { ok: false, error: 'Item not found' }, { 'Cache-Control': 'no-store' })
  }

  items[idx] = {
    ...items[idx],
    status,
    owner,
    note,
    updatedAt: nowIso(),
  }

  const saved = writeStore({
    ...store,
    items: sortInboxItems(items),
  })

  return json(
    res,
    200,
    {
      ok: true,
      provider: 'slack',
      item: items[idx],
      summary: buildSummary(saved?.items || []),
      updatedAt: saved?.updatedAt || null,
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function routeSlack(req, res, parts) {
  const head = String(parts?.[0] || '')

  if (head === 'health') return handleHealth(req, res)
  if (head === 'channels') return handleChannels(req, res)
  if (head === 'refresh') return handleRefresh(req, res)
  if (head === 'mark') return handleMark(req, res)
  if (head === 'inbox' || !head) return handleInbox(req, res)

  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeSlack,
}
