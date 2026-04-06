const { json, pickHeader, safeParseJsonBody } = require('./_http')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.sendgrid.local'),
  override: false,
})

const SENDGRID_API = 'https://api.sendgrid.com/v3/mail/send'
const PRIVATE_PREVIEW_EMAILS = new Set(['paolo.v@bullwaves.com'])
const PRIVATE_PREVIEW_RECIPIENTS = new Set(['paolo.v@bullwaves.com'])

function env(name, fallback = '') {
  const value = process.env[name]
  return value == null ? fallback : String(value).trim()
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function getConfig() {
  return {
    apiKey: env('SENDGRID_API_KEY'),
    fromEmail: env('SENDGRID_FROM_EMAIL'),
    fromName: env('SENDGRID_FROM_NAME', 'Bullwaves'),
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

function isAllowedRecipient(email) {
  return PRIVATE_PREVIEW_RECIPIENTS.has(normalizeEmail(email))
}

function normalizeContent(body) {
  const subject = String(body?.subject || 'Bullwaves SendGrid test').trim()
  const text = String(body?.text || 'Bullwaves SendGrid test email').trim()
  const html = String(body?.html || `<p>${text}</p>`).trim()
  return { subject, text, html }
}

function buildPayload(body, config) {
  const to = String(body?.to || '').trim()
  const subject = String(body?.subject || '').trim()
  const templateId = String(body?.templateId || '').trim()
  const dynamicTemplateData =
    body?.dynamicTemplateData && typeof body.dynamicTemplateData === 'object'
      ? body.dynamicTemplateData
      : undefined

  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
      },
    ],
    from: {
      email: String(body?.fromEmail || config.fromEmail).trim(),
      name: String(body?.fromName || config.fromName).trim() || 'Bullwaves',
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
    return payload
  }

  const content = normalizeContent(body)
  payload.personalizations[0].subject = content.subject
  payload.content = [
    { type: 'text/plain', value: content.text },
    { type: 'text/html', value: content.html },
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
      },
      access: {
        viewerEmail,
        recipientLock: Array.from(PRIVATE_PREVIEW_RECIPIENTS),
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

  if (!isValidEmail(fromEmail)) {
    return json(res, 400, { ok: false, error: 'Missing or invalid field: fromEmail' }, { 'Cache-Control': 'no-store' })
  }

  const payload = buildPayload(body, config)

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

    return json(
      res,
      200,
      {
        ok: true,
        accepted: true,
        sendgridStatus: result.status,
        messageId: result.headers.messageId,
        request: {
          viewerEmail,
          to,
          fromEmail: payload.from.email,
          fromName: payload.from.name,
          templateId: payload.template_id || null,
          usedDynamicTemplateData: Boolean(payload.personalizations?.[0]?.dynamic_template_data),
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

async function routeEmail(req, res, parts) {
  const head = parts[0] || ''
  if (head === 'health') return handleHealth(req, res)
  if (head === 'send-test') return handleSendTest(req, res)
  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeEmail,
}