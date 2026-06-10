const { json, pickHeader, safeParseJsonBody } = require('./_http')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.sendgrid.local'),
  override: false,
})

const SENDGRID_API = 'https://api.sendgrid.com/v3/mail/send'
const PRIVATE_PREVIEW_EMAILS = new Set(['paolo.v@bullwaves.com'])
const PRIVATE_PREVIEW_RECIPIENTS = new Set(['paolo.v@bullwaves.com'])
const MESSAGE_ID_TRIMMER = /\..*$/
const TRACKING_STORE_PATH = path.join(__dirname, '..', '..', 'uploads', 'email_tracking_store.json')
const TRACKING_MAX_EVENTS = 40
const CAMPAIGN_PREVIEW_PATH = path.join(
  __dirname,
  '..',
  '..',
  'src',
  'features',
  'sales',
  'data',
  'bonus_preview_converted_by_currency.json'
)

const mailTrackingByMessageId = new Map()
const mailTrackingByNormalizedMessageId = new Map()
let trackingStoreLoaded = false

function env(name, fallback = '') {
  const value = process.env[name]
  return value == null ? fallback : String(value).trim()
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function normalizeAgentName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
}

function getConfig() {
  return {
    apiKey: env('SENDGRID_API_KEY'),
    fromEmail: env('SENDGRID_FROM_EMAIL'),
    fromName: env('SENDGRID_FROM_NAME', 'Bullwaves'),
    unsubscribeGroupId: env('SENDGRID_UNSUBSCRIBE_GROUP_ID'),
    senderName: env('SENDGRID_SENDER_NAME', ''),
    senderAddress: env('SENDGRID_SENDER_ADDRESS', ''),
    senderCity: env('SENDGRID_SENDER_CITY', ''),
    senderState: env('SENDGRID_SENDER_STATE', ''),
    senderZip: env('SENDGRID_SENDER_ZIP', ''),
  }
}

function isValidEmail(value) {
  const email = String(value || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function readViewerEmail(req, body) {
  const byHeader = normalizeEmail(pickHeader(req, 'x-bullwaves-user-email'))
  if (isValidEmail(byHeader)) return byHeader

  const byBody = normalizeEmail(body?.viewerEmail)
  if (isValidEmail(byBody)) return byBody

  return ''
}

function canAccessPrivatePreview(email) {
  return PRIVATE_PREVIEW_EMAILS.has(normalizeEmail(email))
}

function getAllowedRecipients() {
  const configured = String(env('SENDGRID_ALLOWED_RECIPIENTS', ''))
    .split(',')
    .map((item) => normalizeEmail(item))
    .filter((item) => isValidEmail(item))

  if (configured.length) return new Set(configured)
  return PRIVATE_PREVIEW_RECIPIENTS
}

function isAllowedRecipient(email) {
  const allowAllRecipients = String(env('SENDGRID_ALLOW_ALL_RECIPIENTS', '')).trim() === '1'
  if (allowAllRecipients) return isValidEmail(email)
  return getAllowedRecipients().has(normalizeEmail(email))
}

function normalizeRecipientList(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(',')
  const out = []
  const seen = new Set()

  for (const item of source) {
    const email = normalizeEmail(typeof item === 'string' ? item : item?.email)
    if (!email || !isValidEmail(email) || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }

  return out
}

function parsePreviewRows() {
  try {
    // Keep a static require so serverless bundlers can include this JSON file.
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const bundled = require('../../src/features/sales/data/bonus_preview_converted_by_currency.json')
    const bundledRows = Array.isArray(bundled?.rows) ? bundled.rows : []
    if (bundledRows.length) return bundledRows
  } catch {
    // Fallback to fs read for local/dev execution.
  }

  try {
    const raw = fs.readFileSync(CAMPAIGN_PREVIEW_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.rows) ? parsed.rows : []
  } catch (error) {
    console.error('[email-agent-clients] Failed to read preview rows:', error?.message || error)
    return []
  }
}

function formatCurrency(value, currency) {
  const amount = Number(value || 0)
  if (!currency) return '—'
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: String(currency),
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toFixed(0)} ${String(currency).toUpperCase()}`
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeRawHtmlFooterPlaceholders(html, body, config) {
  let output = String(html || '')
  if (!output) return output

  const senderName = escapeHtml(config.senderName || body?.fromName || config.fromName || 'Bullwaves')
  const senderAddress = escapeHtml(config.senderAddress)
  const senderCity = escapeHtml(config.senderCity)
  const senderState = escapeHtml(config.senderState)
  const senderZip = escapeHtml(config.senderZip)
  const fallbackUnsubscribe = `mailto:${encodeURIComponent(config.fromEmail || 'support@bullwaves.com')}?subject=Unsubscribe`
  const fallbackPreferences = `mailto:${encodeURIComponent(config.fromEmail || 'support@bullwaves.com')}?subject=Email%20Preferences`
  const unsubscribeUrl = String(body?.unsubscribeUrl || fallbackUnsubscribe).trim()
  const preferencesUrl = String(body?.unsubscribePreferencesUrl || fallbackPreferences).trim()

  output = output
    .replaceAll('{{Sender_Name}}', senderName)
    .replaceAll('{{Sender_Address}}', senderAddress)
    .replaceAll('{{Sender_City}}', senderCity)
    .replaceAll('{{Sender_State}}', senderState)
    .replaceAll('{{Sender_Zip}}', senderZip)
    .replaceAll('{{{unsubscribe}}}', unsubscribeUrl)
    .replaceAll('{{unsubscribe}}', unsubscribeUrl)
    .replaceAll('{{{unsubscribe_preferences}}}', preferencesUrl)
    .replaceAll('{{unsubscribe_preferences}}', preferencesUrl)

  // If address details are not configured, hide the address paragraph to avoid dangling punctuation.
  if (!senderAddress && !senderCity && !senderState && !senderZip) {
    output = output.replace(/<p[^>]*>\s*<span[^>]*Unsubscribe--senderAddress[\s\S]*?<\/p>/gi, '')
  }

  return output
}

function ensureTrackingStoreLoaded() {
  if (trackingStoreLoaded) return
  trackingStoreLoaded = true

  try {
    if (!fs.existsSync(TRACKING_STORE_PATH)) return
    const raw = fs.readFileSync(TRACKING_STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    const entries = Array.isArray(parsed?.items) ? parsed.items : []

    for (const entry of entries) {
      const messageId = String(entry?.messageId || '').trim()
      if (!messageId) continue

      const normalizedMessageId = normalizeMessageId(messageId)
      const clean = {
        messageId,
        normalizedMessageId,
        status: String(entry?.status || 'pending').toLowerCase(),
        acceptedAt: entry?.acceptedAt || null,
        deliveredAt: entry?.deliveredAt || null,
        failedAt: entry?.failedAt || null,
        updatedAt: entry?.updatedAt || null,
        to: entry?.to || null,
        fromEmail: entry?.fromEmail || null,
        fromName: entry?.fromName || null,
        subject: entry?.subject || null,
        lastEvent: entry?.lastEvent || null,
        openCount: Number(entry?.openCount || 0),
        clickCount: Number(entry?.clickCount || 0),
        firstOpenAt: entry?.firstOpenAt || null,
        lastOpenAt: entry?.lastOpenAt || null,
        firstClickAt: entry?.firstClickAt || null,
        lastClickAt: entry?.lastClickAt || null,
        events: Array.isArray(entry?.events) ? entry.events.slice(-TRACKING_MAX_EVENTS) : [],
      }

      mailTrackingByMessageId.set(messageId, clean)
      if (normalizedMessageId) {
        mailTrackingByNormalizedMessageId.set(normalizedMessageId, messageId)
      }
    }
  } catch (error) {
    console.error('[email-tracking] Failed to load tracking store:', error?.message || error)
  }
}

function saveTrackingStoreToDisk() {
  try {
    const dir = path.dirname(TRACKING_STORE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const items = Array.from(mailTrackingByMessageId.values())
      .sort((a, b) => {
        const ta = Date.parse(a?.updatedAt || 0) || 0
        const tb = Date.parse(b?.updatedAt || 0) || 0
        return tb - ta
      })
      .slice(0, 2000)

    fs.writeFileSync(
      TRACKING_STORE_PATH,
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          count: items.length,
          items,
        },
        null,
        2
      ),
      'utf8'
    )
  } catch (error) {
    console.error('[email-tracking] Failed to save tracking store:', error?.message || error)
  }
}

function normalizeMessageId(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw.replace(MESSAGE_ID_TRIMMER, '').trim()
}

function toIsoTimestamp(value) {
  if (value == null || value === '') return new Date().toISOString()

  if (typeof value === 'number' && Number.isFinite(value)) {
    const epochMs = value > 1e12 ? value : value * 1000
    return new Date(epochMs).toISOString()
  }

  const parsed = Date.parse(String(value))
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString()
  }

  return new Date().toISOString()
}

function getTrackedStatus(rawStatus) {
  const status = String(rawStatus || '').trim().toLowerCase()

  if (status === 'accepted' || status === 'processed' || status === 'deferred') return status
  if (status === 'delivered') return 'delivered'
  if (status === 'bounce' || status === 'bounced' || status === 'dropped' || status === 'blocked') {
    return 'failed'
  }

  return status || 'pending'
}

function upsertTrackingRecord(record) {
  ensureTrackingStoreLoaded()

  const messageId = String(record?.messageId || '').trim()
  if (!messageId) return null

  const normalizedMessageId = normalizeMessageId(messageId)
  const current = mailTrackingByMessageId.get(messageId)
  const next = {
    messageId,
    normalizedMessageId,
    status: String(record?.status || current?.status || 'pending').toLowerCase(),
    acceptedAt: record?.acceptedAt || current?.acceptedAt || null,
    deliveredAt: record?.deliveredAt || current?.deliveredAt || null,
    failedAt: record?.failedAt || current?.failedAt || null,
    updatedAt: record?.updatedAt || current?.updatedAt || new Date().toISOString(),
    to: record?.to || current?.to || null,
    fromEmail: record?.fromEmail || current?.fromEmail || null,
    fromName: record?.fromName || current?.fromName || null,
    subject: record?.subject || current?.subject || null,
    lastEvent: record?.lastEvent || current?.lastEvent || null,
    openCount: Number(record?.openCount ?? current?.openCount ?? 0),
    clickCount: Number(record?.clickCount ?? current?.clickCount ?? 0),
    firstOpenAt: record?.firstOpenAt || current?.firstOpenAt || null,
    lastOpenAt: record?.lastOpenAt || current?.lastOpenAt || null,
    firstClickAt: record?.firstClickAt || current?.firstClickAt || null,
    lastClickAt: record?.lastClickAt || current?.lastClickAt || null,
    events: Array.isArray(record?.events)
      ? record.events
      : Array.isArray(current?.events)
        ? current.events
        : [],
  }

  next.events = next.events.slice(-TRACKING_MAX_EVENTS)

  mailTrackingByMessageId.set(messageId, next)
  if (normalizedMessageId) {
    mailTrackingByNormalizedMessageId.set(normalizedMessageId, messageId)
  }

  saveTrackingStoreToDisk()

  return next
}

function findTrackingRecordByMessageId(messageId) {
  ensureTrackingStoreLoaded()

  const raw = String(messageId || '').trim()
  if (!raw) return null

  const direct = mailTrackingByMessageId.get(raw)
  if (direct) return direct

  const normalized = normalizeMessageId(raw)
  const mappedMessageId = mailTrackingByNormalizedMessageId.get(normalized)
  if (mappedMessageId) {
    const mapped = mailTrackingByMessageId.get(mappedMessageId)
    if (mapped) return mapped
  }

  for (const record of mailTrackingByMessageId.values()) {
    if (record?.normalizedMessageId && record.normalizedMessageId === normalized) {
      return record
    }
  }

  return null
}

function trackAcceptedSend(messageId, payload) {
  if (!messageId) return null

  const now = new Date().toISOString()
  return upsertTrackingRecord({
    messageId,
    status: 'accepted',
    acceptedAt: now,
    updatedAt: now,
    to: payload?.personalizations?.[0]?.to?.[0]?.email || null,
    fromEmail: payload?.from?.email || null,
    fromName: payload?.from?.name || null,
    subject: payload?.personalizations?.[0]?.subject || null,
    openCount: 0,
    clickCount: 0,
    lastEvent: 'accepted',
    events: [
      {
        event: 'accepted',
        at: now,
      },
    ],
  })
}

function trackSendgridEvent(eventPayload) {
  const eventName = String(eventPayload?.event || '').trim().toLowerCase()
  const sgMessageId = String(eventPayload?.sg_message_id || eventPayload?.smtp_id || '').trim()
  if (!eventName || !sgMessageId) {
    return { updated: false, reason: 'missing event or sg_message_id' }
  }

  const existing = findTrackingRecordByMessageId(sgMessageId)
  const messageId = existing?.messageId || sgMessageId
  const eventTime = toIsoTimestamp(eventPayload?.timestamp)
  const trackedStatus = getTrackedStatus(eventName)
  const existingEvents = Array.isArray(existing?.events) ? existing.events : []
  const previousStatus = String(existing?.status || 'pending').toLowerCase()
  const isOpen = eventName === 'open'
  const isClick = eventName === 'click'

  const next = {
    ...(existing || {}),
    messageId,
    status:
      isOpen || isClick
        ? previousStatus && previousStatus !== 'pending'
          ? previousStatus
          : 'delivered'
        : trackedStatus,
    updatedAt: eventTime,
    lastEvent: eventName,
    to: existing?.to || eventPayload?.email || null,
    openCount: Number(existing?.openCount || 0) + (isOpen ? 1 : 0),
    clickCount: Number(existing?.clickCount || 0) + (isClick ? 1 : 0),
    firstOpenAt: isOpen ? existing?.firstOpenAt || eventTime : existing?.firstOpenAt || null,
    lastOpenAt: isOpen ? eventTime : existing?.lastOpenAt || null,
    firstClickAt: isClick ? existing?.firstClickAt || eventTime : existing?.firstClickAt || null,
    lastClickAt: isClick ? eventTime : existing?.lastClickAt || null,
    events: [
      ...existingEvents,
      {
        event: eventName,
        at: eventTime,
        reason: eventPayload?.reason || null,
        email: eventPayload?.email || null,
        sgEventId: eventPayload?.sg_event_id || null,
      },
    ],
  }

  if (trackedStatus === 'delivered' && !next.deliveredAt) {
    next.deliveredAt = eventTime
  }

  if (trackedStatus === 'failed' && !next.failedAt) {
    next.failedAt = eventTime
  }

  upsertTrackingRecord(next)
  return { updated: true, messageId, status: trackedStatus }
}

function normalizeContent(body) {
  const subject = String(body?.subject || 'Bullwaves SendGrid test').trim()
  const text = String(body?.text || 'Bullwaves SendGrid test email').trim()
  const html = String(body?.html || `<p>${text}</p>`).trim()
  return { subject, text, html }
}

function getProxyBaseUrl() {
  return env('SENDGRID_PROXY_BASE_URL')
}

function normalizeProxyBaseUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

async function proxyEmailRoute(req, res, parts) {
  const proxyBaseUrl = normalizeProxyBaseUrl(getProxyBaseUrl())
  if (!proxyBaseUrl) return false

  const suffix = parts.length ? `/${parts.join('/')}` : ''
  const url = `${proxyBaseUrl}/api/email${suffix}`
  const method = String(req.method || 'GET').toUpperCase()
  const incomingBody = safeParseJsonBody(req)

  const headers = {
    Accept: 'application/json',
  }

  const contentType = String(pickHeader(req, 'content-type') || '').trim()
  if (contentType) headers['Content-Type'] = contentType

  const forwardedHeaders = [
    'x-bullwaves-user-email',
    'x-sendgrid-event-secret',
    'x-sendgrid-test-secret',
    'authorization',
  ]

  for (const headerName of forwardedHeaders) {
    const value = pickHeader(req, headerName)
    if (value != null && String(value).trim()) {
      headers[headerName] = String(value)
    }
  }

  const fetchOptions = {
    method,
    headers,
  }

  if (method !== 'GET' && method !== 'HEAD' && incomingBody != null) {
    fetchOptions.body = typeof incomingBody === 'string' ? incomingBody : JSON.stringify(incomingBody)
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
  }

  try {
    const response = await fetch(url, fetchOptions)
    const text = await response.text()

    const responseType = response.headers.get('content-type') || 'application/json; charset=utf-8'
    res.statusCode = response.status
    res.setHeader('Content-Type', responseType)
    res.setHeader('Cache-Control', 'no-store')
    res.end(text)
    return true
  } catch (error) {
    return json(
      res,
      502,
      {
        ok: false,
        error: `Email proxy request failed: ${error?.message || 'unknown error'}`,
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

function buildPayload(body, config) {
  const to = String(body?.to || '').trim()
  const cc = normalizeRecipientList(body?.cc)
  const bcc = normalizeRecipientList(body?.bcc)
  const subject = String(body?.subject || '').trim()
  const templateId = String(body?.templateId || '').trim()
  const dynamicTemplateData =
    body?.dynamicTemplateData && typeof body.dynamicTemplateData === 'object'
      ? body.dynamicTemplateData
      : undefined
  const unsubscribeGroupId = Number(body?.unsubscribeGroupId || config.unsubscribeGroupId || 0)

  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
        ...(cc.length ? { cc: cc.map((email) => ({ email })) } : {}),
        ...(bcc.length ? { bcc: bcc.map((email) => ({ email })) } : {}),
      },
    ],
    from: {
      email: String(body?.fromEmail || config.fromEmail).trim(),
      name: String(body?.fromName || config.fromName).trim() || 'Bullwaves',
    },
    tracking_settings: {
      click_tracking: {
        enable: true,
        enable_text: true,
      },
      open_tracking: {
        enable: true,
      },
    },
  }

  if (templateId) {
    payload.template_id = templateId
    if (subject) {
      payload.personalizations[0].subject = subject
    }
    if (dynamicTemplateData) {
      payload.personalizations[0].dynamic_template_data = dynamicTemplateData
    }
    if (Number.isInteger(unsubscribeGroupId) && unsubscribeGroupId > 0) {
      payload.asm = {
        group_id: unsubscribeGroupId,
      }
    }
    return payload
  }

  const content = normalizeContent(body)
  const safeHtml = sanitizeRawHtmlFooterPlaceholders(content.html, body, config)
  payload.personalizations[0].subject = content.subject
  payload.content = [
    { type: 'text/plain', value: content.text },
    { type: 'text/html', value: safeHtml },
  ]
  return payload
}

async function sendgridSend(payload, apiKey) {
  const response = await fetch(SENDGRID_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    headers: {
      messageId: response.headers.get('x-message-id') || null,
    },
    data,
  }
}

async function handleHealth(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const viewerEmail = readViewerEmail(req)
  if (!canAccessPrivatePreview(viewerEmail)) {
    return json(
      res,
      403,
      {
        ok: false,
        error: 'Access denied. This preview is limited to paolo.v@bullwaves.com.',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const config = getConfig()

  return json(
    res,
    200,
    {
      ok: true,
      configured: Boolean(config.apiKey && config.fromEmail),
      missing: {
        SENDGRID_API_KEY: !config.apiKey,
        SENDGRID_FROM_EMAIL: !config.fromEmail,
      },
      defaults: {
        fromEmail: config.fromEmail || null,
        fromName: config.fromName || null,
        unsubscribeGroupId: config.unsubscribeGroupId || null,
      },
      access: {
        viewerEmail,
        recipientLock: Array.from(getAllowedRecipients()),
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

  const body = safeParseJsonBody(req)
  const viewerEmail = readViewerEmail(req, body)

  if (!canAccessPrivatePreview(viewerEmail)) {
    return json(
      res,
      403,
      {
        ok: false,
        error: 'Access denied. This preview is limited to paolo.v@bullwaves.com.',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const config = getConfig()
  if (!config.apiKey || !config.fromEmail) {
    return json(
      res,
      501,
      {
        ok: false,
        error: 'SendGrid not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.',
        missing: {
          SENDGRID_API_KEY: !config.apiKey,
          SENDGRID_FROM_EMAIL: !config.fromEmail,
        },
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const to = String(body?.to || '').trim()
  const ccRecipients = normalizeRecipientList(body?.cc)
  const bccRecipients = normalizeRecipientList(body?.bcc)
  const fromEmail = String(body?.fromEmail || config.fromEmail).trim()

  if (!isValidEmail(to)) {
    return json(res, 400, { ok: false, error: 'Missing or invalid field: to' }, { 'Cache-Control': 'no-store' })
  }

  if (!isAllowedRecipient(to)) {
    return json(
      res,
      403,
      {
        ok: false,
        error: 'Recipient locked. Test emails can currently be sent only to paolo.v@bullwaves.com.',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const additionalRecipients = [...ccRecipients, ...bccRecipients]
  const disallowed = additionalRecipients.find((email) => !isAllowedRecipient(email))
  if (disallowed) {
    return json(
      res,
      403,
      {
        ok: false,
        error: `Recipient locked. ${disallowed} is not allowed by SENDGRID_ALLOWED_RECIPIENTS.`,
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  if (!isValidEmail(fromEmail)) {
    return json(res, 400, { ok: false, error: 'Missing or invalid field: fromEmail' }, { 'Cache-Control': 'no-store' })
  }

  const payload = buildPayload(
    {
      ...body,
      cc: ccRecipients,
      bcc: bccRecipients,
    },
    config
  )

  try {
    const result = await sendgridSend(payload, config.apiKey)
    if (!result.ok) {
      return json(
        res,
        502,
        {
          ok: false,
          error: 'SendGrid rejected the request',
          sendgridStatus: result.status,
          details: result.data,
        },
        { 'Cache-Control': 'no-store' }
      )
    }

    const tracked = trackAcceptedSend(result.headers.messageId, payload)

    return json(
      res,
      200,
      {
        ok: true,
        accepted: true,
        sendgridStatus: result.status,
        messageId: result.headers.messageId,
        tracking: tracked,
        request: {
          viewerEmail,
          to,
          cc: ccRecipients,
          bccCount: bccRecipients.length,
          fromEmail: payload.from.email,
          fromName: payload.from.name,
          templateId: payload.template_id || null,
          usedDynamicTemplateData: Boolean(payload.personalizations?.[0]?.dynamic_template_data),
          unsubscribeGroupId: payload.asm?.group_id || null,
        },
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (error) {
    return json(
      res,
      502,
      { ok: false, error: error?.message || 'Failed to call SendGrid' },
      { 'Cache-Control': 'no-store' }
    )
  }
}

function renderAgentClientsPage({ agentName, campaignName, rows }) {
  const safeAgent = escapeHtml(agentName || 'Agent')
  const safeCampaign = escapeHtml(campaignName || 'Global Exclusive Tradable Bonus')
  const list = Array.isArray(rows) ? rows : []

  const totalBonusUsd = list.reduce((sum, row) => {
    const usdToAccountRate = Number(row?.usdToAccountRate || 0)
    const bonusRaw =
      Number(row?.officialBonusAccountCurrencyRaw || 0) || Number(row?.bonusAccountCurrencyRaw || 0)
    if (!usdToAccountRate) return sum
    return sum + bonusRaw / usdToAccountRate
  }, 0)

  const rowsHtml = list
    .map((row, index) => {
      const bonus = formatCurrency(Number(row?.bonusAccountCurrencyRaw || 0), row?.accountCurrency)
      const officialBonus = formatCurrency(
        Number(row?.officialBonusAccountCurrencyRaw || 0) || Number(row?.bonusAccountCurrencyRaw || 0),
        row?.accountCurrency
      )
      const netUsd = formatCurrency(Number(row?.netDepositsUsd || 0), 'USD')
      const name = escapeHtml(row?.name || '—')
      const email = escapeHtml(row?.email || '—')
      const account = escapeHtml(row?.tradingAccount || '—')
      const owner = escapeHtml(row?.user || '—')

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${name}</td>
          <td>${email}</td>
          <td>${account}</td>
          <td>${bonus}</td>
          <td>${officialBonus}</td>
          <td>${netUsd}</td>
          <td>${owner}</td>
        </tr>
      `
    })
    .join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeAgent} Clients | Bullwaves</title>
    <style>
      :root {
        --bg: #f2f6ff;
        --panel: #ffffff;
        --ink: #0f172a;
        --muted: #5b6b84;
        --line: #dce6f5;
        --brand: #0f2a57;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: var(--bg);
        color: var(--ink);
      }
      .wrap {
        max-width: 1100px;
        margin: 22px auto;
        padding: 0 12px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 16px;
        overflow: hidden;
      }
      .hero {
        background: linear-gradient(135deg, #0b1b3a 0%, #15408a 100%);
        color: #fff;
        padding: 18px 20px;
      }
      .hero h1 {
        margin: 6px 0 0;
        font-size: 26px;
      }
      .hero p {
        margin: 8px 0 0;
        color: #dbe8ff;
        font-size: 13px;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 14px 20px;
        border-bottom: 1px solid var(--line);
      }
      .chip {
        background: #edf4ff;
        border: 1px solid #d7e3fb;
        color: var(--brand);
        border-radius: 10px;
        padding: 8px 10px;
        font-size: 12px;
        font-weight: 700;
      }
      .table-wrap { overflow-x: auto; }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 860px;
      }
      th {
        background: var(--brand);
        color: #dbe8ff;
        text-align: left;
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 10px 9px;
      }
      td {
        border-top: 1px solid var(--line);
        padding: 9px;
        font-size: 13px;
      }
      .empty {
        padding: 24px 20px;
        color: var(--muted);
      }
      .footer {
        padding: 14px 20px 20px;
        color: var(--muted);
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="panel">
        <header class="hero">
          <img src="https://bullwaves-console.vercel.app/Logo.png" alt="Bullwaves" width="152" style="display:block;width:152px;max-width:152px;height:auto;border:0;" />
          <h1>${safeAgent} Client Table</h1>
          <p>${safeCampaign}</p>
        </header>
        <div class="meta">
          <div class="chip">Clients: ${list.length}</div>
          <div class="chip">Official Bonus (USD): ${formatCurrency(totalBonusUsd, 'USD')}</div>
        </div>
        ${
          list.length
            ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Client</th><th>Email</th><th>Account</th><th>Bonus</th><th>Official Bonus</th><th>Net USD</th><th>Owner</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`
            : '<div class="empty">No clients found for this view.</div>'
        }
        <div class="footer">Bullwaves LTD · Internal Marketing Operations View</div>
      </section>
    </div>
  </body>
</html>`
}

async function handleAgentClientsPublic(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const agentParam = reqUrl.searchParams.get('agent')
  const campaignParam = reqUrl.searchParams.get('campaign')
  const format = String(reqUrl.searchParams.get('format') || '').trim().toLowerCase()
  const normalizedAgent = normalizeAgentName(agentParam)
  const includeAllAgents = !normalizedAgent || normalizedAgent === 'all'

  const allRows = parsePreviewRows()
  const filteredRows = includeAllAgents
    ? allRows
    : allRows.filter((row) => normalizeAgentName(row?.user) === normalizedAgent)
  const displayAgentName = includeAllAgents ? 'All Sales Agents' : (filteredRows[0]?.user || agentParam || 'Agent')
  const campaignName = campaignParam || 'Global Exclusive Tradable Bonus'

  if (format === 'json') {
    return json(
      res,
      200,
      {
        ok: true,
        agent: displayAgentName,
        scope: includeAllAgents ? 'all' : 'single-agent',
        campaign: campaignName,
        count: filteredRows.length,
        rows: filteredRows,
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const html = renderAgentClientsPage({
    agentName: displayAgentName,
    campaignName,
    rows: filteredRows,
  })

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(html)
}

async function routeEmail(req, res, parts) {
  const head = parts[0] || ''

  const shouldProxy = Boolean(getProxyBaseUrl()) && head !== 'events' && head !== 'agent-clients'
  if (shouldProxy) {
    const proxied = await proxyEmailRoute(req, res, parts)
    if (proxied) return
  }

  if (head === 'health') return handleHealth(req, res)
  if (head === 'agent-clients') return handleAgentClientsPublic(req, res)
  if (head === 'status') return handleStatus(req, res, parts)
  if (head === 'events') return handleEvents(req, res)
  if (head === 'send-test') return handleSendTest(req, res)
  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeEmail,
}

async function handleStatus(req, res, parts) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const viewerEmail = readViewerEmail(req)
  if (!canAccessPrivatePreview(viewerEmail)) {
    return json(
      res,
      403,
      {
        ok: false,
        error: 'Access denied. This preview is limited to paolo.v@bullwaves.com.',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const rawMessageId = decodeURIComponent(String(parts?.[1] || '').trim())
  if (!rawMessageId) {
    ensureTrackingStoreLoaded()
    const items = Array.from(mailTrackingByMessageId.values())
      .sort((a, b) => {
        const ta = Date.parse(a?.updatedAt || 0) || 0
        const tb = Date.parse(b?.updatedAt || 0) || 0
        return tb - ta
      })
      .slice(0, 100)

    return json(
      res,
      200,
      {
        ok: true,
        items,
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const tracking = findTrackingRecordByMessageId(rawMessageId)
  if (!tracking) {
    return json(
      res,
      404,
      {
        ok: false,
        error: 'Message id not found in local tracking store',
        messageId: rawMessageId,
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  return json(res, 200, { ok: true, tracking }, { 'Cache-Control': 'no-store' })
}

async function handleEvents(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const configSecret = env('SENDGRID_EVENT_WEBHOOK_SECRET')
  if (configSecret) {
    const sentSecret = String(pickHeader(req, 'x-sendgrid-event-secret') || '').trim()
    if (!sentSecret || sentSecret !== configSecret) {
      return json(res, 401, { ok: false, error: 'Invalid webhook secret' }, { 'Cache-Control': 'no-store' })
    }
  }

  const body = safeParseJsonBody(req)
  const events = Array.isArray(body) ? body : body ? [body] : []

  if (!events.length) {
    return json(res, 400, { ok: false, error: 'Missing events payload' }, { 'Cache-Control': 'no-store' })
  }

  const updates = events.map(trackSendgridEvent)
  const updatedCount = updates.filter((item) => item.updated).length

  return json(
    res,
    202,
    {
      ok: true,
      received: events.length,
      updated: updatedCount,
    },
    { 'Cache-Control': 'no-store' }
  )
}