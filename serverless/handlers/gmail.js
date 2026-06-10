const { json, pickHeader, safeParseJsonBody } = require('./_http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execFile } = require('child_process')
const dotenv = require('dotenv')
const { google } = require('googleapis')

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.server.local'),
  override: false,
})

dotenv.config({
  path: path.join(__dirname, '..', '..', '.env.server'),
  override: false,
})

const TOKEN_STORE_PATH = path.join(__dirname, '..', '..', 'uploads', 'gmail_oauth_tokens.json')
const DEFAULT_REDIRECT_URI = 'http://localhost:4000/api/gmail/oauth/callback'
const SKALE_SUPPORT_EMAIL = 'support@skalecrm.com'
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
]

const REPLY_TEMPLATES = {
  acknowledge: 'Thanks for your message. We received it and will follow up shortly.',
  support_received:
    'Thanks for contacting Bullwaves support. Your request is now in our queue and one of our agents will reply as soon as possible.',
  follow_up:
    'Following up on your previous message. Could you share any additional details so we can proceed faster?',
}

function env(name, fallback = '') {
  const value = process.env[name]
  return value == null ? fallback : String(value).trim()
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function isValidEmail(value) {
  const email = String(value || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function parseAdminEmails() {
  return String(env('ADMIN_EMAILS', ''))
    .split(',')
    .map((item) => normalizeEmail(item))
    .filter((item) => isValidEmail(item))
}

function readViewerEmail(req, body, reqUrl) {
  const byHeader = normalizeEmail(pickHeader(req, 'x-bullwaves-user-email'))
  if (isValidEmail(byHeader)) return byHeader

  const byBody = normalizeEmail(body?.viewerEmail)
  if (isValidEmail(byBody)) return byBody

  const byQuery = normalizeEmail(reqUrl?.searchParams?.get('viewerEmail'))
  if (isValidEmail(byQuery)) return byQuery

  return ''
}

function ensureAdminAccess(req, body, reqUrl) {
  const viewerEmail = readViewerEmail(req, body, reqUrl)
  const admins = parseAdminEmails()

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

function getScopes() {
  const configured = String(env('GMAIL_OAUTH_SCOPES', ''))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return configured.length ? configured : DEFAULT_SCOPES
}

function getOAuthConfig() {
  return {
    clientId: env('GMAIL_OAUTH_CLIENT_ID'),
    clientSecret: env('GMAIL_OAUTH_CLIENT_SECRET'),
    redirectUri: env('GMAIL_OAUTH_REDIRECT_URI', DEFAULT_REDIRECT_URI),
    scopes: getScopes(),
    stateSecret: env('GMAIL_OAUTH_STATE_SECRET'),
  }
}

function createOAuthClient(config = getOAuthConfig()) {
  if (!config.clientId || !config.clientSecret) {
    return { error: 'GMAIL_OAUTH_CLIENT_ID and GMAIL_OAUTH_CLIENT_SECRET are required' }
  }

  const client = new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri)
  return { client }
}

function loadTokenStore() {
  try {
    if (!fs.existsSync(TOKEN_STORE_PATH)) return null
    const raw = fs.readFileSync(TOKEN_STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch (error) {
    console.error('[gmail] Failed to load token store:', error?.message || error)
    return null
  }
}

function saveTokenStore(store) {
  try {
    const dir = path.dirname(TOKEN_STORE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(TOKEN_STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('[gmail] Failed to save token store:', error?.message || error)
    return false
  }
}

function createSignedState(viewerEmail, stateSecret) {
  const ts = Date.now().toString()
  const email = normalizeEmail(viewerEmail)
  const payloadJson = JSON.stringify({ ts, email })
  const encodedPayload = toBase64Url(payloadJson)

  if (!stateSecret) return encodedPayload

  const signature = crypto.createHmac('sha256', stateSecret).update(encodedPayload).digest('hex')
  return `${encodedPayload}.${signature}`
}

function verifySignedState(state, stateSecret) {
  const raw = String(state || '').trim()
  if (!raw) return { ok: false, reason: 'missing_state' }

  const parsePayload = (payloadToken) => {
    const decoded = decodeBase64Url(payloadToken)
    if (decoded) {
      try {
        const parsed = JSON.parse(decoded)
        return {
          timestamp: Number(parsed?.ts) || null,
          viewerEmail: normalizeEmail(parsed?.email || ''),
        }
      } catch {
        // Fall through to legacy parser below.
      }
    }

    // Legacy fallback: "timestamp.email" without encoding.
    const dotIndex = payloadToken.indexOf('.')
    if (dotIndex <= 0) return null
    return {
      timestamp: Number(payloadToken.slice(0, dotIndex)) || null,
      viewerEmail: normalizeEmail(payloadToken.slice(dotIndex + 1) || ''),
    }
  }

  const lastDotIndex = raw.lastIndexOf('.')
  const hasSignature = lastDotIndex > 0
  const payloadToken = hasSignature ? raw.slice(0, lastDotIndex) : raw
  const signature = hasSignature ? raw.slice(lastDotIndex + 1) : ''

  if (stateSecret) {
    if (!hasSignature || !signature) return { ok: false, reason: 'missing_signature' }
    const expected = crypto.createHmac('sha256', stateSecret).update(payloadToken).digest('hex')
    if (signature !== expected) return { ok: false, reason: 'bad_signature' }
  }

  const parsed = parsePayload(payloadToken)
  if (!parsed) return { ok: false, reason: 'invalid_state' }

  return {
    ok: true,
    timestamp: parsed.timestamp,
    viewerEmail: parsed.viewerEmail,
  }
}

async function getAuthedGmailClient() {
  const config = getOAuthConfig()
  const { client, error } = createOAuthClient(config)
  if (error) return { error }

  const store = loadTokenStore()
  const tokens = store?.tokens
  if (!tokens || typeof tokens !== 'object') {
    return { error: 'Gmail is not connected yet. Complete OAuth first.' }
  }

  client.setCredentials(tokens)
  client.on('tokens', (newTokens) => {
    if (!newTokens || typeof newTokens !== 'object') return
    const merged = {
      ...tokens,
      ...newTokens,
      refresh_token: newTokens.refresh_token || tokens.refresh_token || null,
    }

    saveTokenStore({
      ...(store || {}),
      tokens: merged,
      updatedAt: new Date().toISOString(),
    })
  })

  return {
    gmail: google.gmail({ version: 'v1', auth: client }),
    oauthClient: client,
    tokenStore: store,
    oauthConfig: config,
  }
}

function decodeBase64Url(value) {
  const raw = String(value || '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = raw.padEnd(Math.ceil(raw.length / 4) * 4, '=')
  try {
    return Buffer.from(padded, 'base64').toString('utf8')
  } catch {
    return ''
  }
}

function extractHeader(headers, name) {
  const key = String(name || '').trim().toLowerCase()
  if (!Array.isArray(headers)) return ''
  const item = headers.find((h) => String(h?.name || '').toLowerCase() === key)
  return String(item?.value || '').trim()
}

function parseFromHeader(fromValue) {
  const raw = String(fromValue || '').trim()
  if (!raw) return { email: '', name: '' }

  const match = raw.match(/^(.*)<([^>]+)>$/)
  if (!match) return { email: normalizeEmail(raw), name: '' }

  return {
    name: String(match[1] || '').replace(/"/g, '').trim(),
    email: normalizeEmail(match[2]),
  }
}

function ensureReplySubject(subject) {
  const s = String(subject || '').trim()
  if (!s) return 'Re: your email'
  return /^re\s*:/i.test(s) ? s : `Re: ${s}`
}

function toBase64Url(plain) {
  return Buffer.from(String(plain || ''), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
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

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderBulletListText(items) {
  const source = Array.isArray(items) ? items : []
  return source.map((item) => `- ${String(item || '').trim()}`).filter(Boolean)
}

function renderBulletListHtml(items) {
  const source = Array.isArray(items) ? items : []
  const lis = source
    .map((item) => `<li>${escapeHtml(String(item || '').trim())}</li>`)
    .join('')
  if (!lis) return ''
  return `<ul style="margin: 8px 0 0 18px; padding: 0;">${lis}</ul>`
}

function stripHtmlTags(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickFirstValue(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = pickFirstValue(...value)
      if (nested) return nested
      continue
    }

    const text = String(value || '').trim()
    if (text) return text
  }

  return ''
}

function splitContextLines(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function extractUrlsFromText(value) {
  const text = String(value || '')
  const matches = text.match(/https?:\/\/[^\s<>()"']+/gi) || []
  return [...new Set(matches.map((item) => item.replace(/[),.;]+$/g, '')))]
}

function extractIdentifiersFromText(value) {
  const text = String(value || '')
  const matches = []
  const patterns = [
    /\b[bB]ullwaves-\d+\b/g,
    /\b\d{5,}\b/g,
    /\b[A-Z]{2,6}-\d+\b/g,
    /\b[A-Z]{2,6}\s*#?\d+\b/g,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  ]

  for (const pattern of patterns) {
    const found = text.match(pattern) || []
    matches.push(...found)
  }

  return [...new Set(matches.map((item) => String(item || '').trim()).filter(Boolean))]
}

function extractStepsFromText(value) {
  const lines = splitContextLines(value)
  const steps = []

  for (const line of lines) {
    if (/^(steps to reproduce|reproduction steps|step\s*\d+|\d+[.)]|-\s+)/i.test(line)) {
      const cleaned = line.replace(/^(steps to reproduce:|reproduction steps:)/i, '').trim()
      if (cleaned) steps.push(cleaned.replace(/^[-\d.)\s]+/, '').trim())
    }
  }

  return steps.filter(Boolean)
}

function normalizeImpactedUsersLabel(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return 'Unknown'
  if (raw.includes('all')) return 'All users'
  if (raw.includes('multiple') || raw.includes('many') || raw.includes('several')) return 'Multiple users'
  if (raw.includes('one') || raw.includes('single') || raw.includes('1 user') || raw.includes('one user')) return 'One user'
  return 'Unknown'
}

function inferSkalePriority({ contextText, issueRequest, expectedResult, actualResult, businessImpact, numberOfUsersImpacted }) {
  const text = `${contextText} ${issueRequest} ${expectedResult} ${actualResult} ${businessImpact}`.toLowerCase()
  const impacted = normalizeImpactedUsersLabel(numberOfUsersImpacted)

  const containsAny = (tokens) => tokens.some((token) => text.includes(token))

  const critical =
    impacted === 'All users' ||
    impacted === 'Multiple users' ||
    containsAny(['platform unavailable', 'platform down', 'system down', 'outage', 'service unavailable']) ||
    containsAny(['deposit blocked', 'withdrawal blocked', 'payment blocked', 'cannot deposit', 'cannot withdraw']) ||
    (containsAny(['client portal', 'crm', 'registration', 'login']) &&
      containsAny(['not working', 'down', 'cannot', "can't", 'unable', 'failed', 'error'])) ||
    containsAny(['urgent business impact', 'critical impact', 'severe impact', 'urgent'])

  if (critical) return 'Critical'

  const high =
    containsAny(['blocked user', 'user blocked', 'users blocked', 'operations blocked']) ||
    (containsAny(['registration', 'login', 'kyc', 'campaign', 'affiliate', 'ib portal', 'ib']) &&
      containsAny(['issue', 'error', 'failed', 'cannot', 'unable', 'not working'])) ||
    containsAny(['important operational', 'operational impact', 'business operations'])

  if (high) return 'High'

  const low =
    containsAny(['clarification', 'how to', 'how-to', 'minor ui', 'small configuration', 'non-urgent', 'not urgent']) ||
    (text.includes('?') && containsAny(['question', 'clarify']))

  if (low) return 'Low'

  const medium =
    containsAny(['workaround', 'limited impact', 'investigation needed', 'investigate']) ||
    impacted === 'Unknown' ||
    impacted === 'One user'

  if (medium) return 'Medium'
  return 'Medium'
}

function inferSkaleCategory({ contextText, issueRequest, requestToSkale }) {
  const text = `${contextText} ${issueRequest} ${requestToSkale}`.toLowerCase()
  const containsAny = (tokens) => tokens.some((token) => text.includes(token))

  if (
    containsAny([
      'gmail',
      'api',
      'integration',
      'sync',
      'webhook',
      'third-party',
      'automation',
      'payment provider',
      'tracking',
    ])
  ) {
    return 'Integration'
  }

  if (containsAny(['new feature', 'enhancement', 'product change', 'custom development', 'develop', 'feature request'])) {
    return 'Development Request'
  }

  if (containsAny(['not working', 'error', 'fails', 'failed', 'unexpected', 'bug', 'broken', 'cannot', "can't", 'unable'])) {
    return 'Bug'
  }

  if (containsAny(['settings', 'permission', 'permissions', 'campaign setup', 'portal setup', 'crm configuration', 'ib setup', 'affiliate setup', 'configuration'])) {
    return 'Configuration'
  }

  if (
    containsAny(['how to', 'how-to', 'clarification', 'question', 'can you explain']) ||
    (text.includes('?') && !containsAny(['error', 'failed', 'not working', 'cannot', 'unable', 'configuration', 'settings']))
  ) {
    return 'Question'
  }

  if (containsAny(['investigate', 'investigation', 'check logs', 'unclear', 'verify backend'])) {
    return 'Investigation'
  }

  return 'Investigation'
}

function isUnclearIssueDescription(value) {
  const text = String(value || '').trim().toLowerCase()
  if (!text || text === 'not provided') return true
  if (text.length < 12) return true
  return (
    text === 'issue' ||
    text === 'problem' ||
    text === 'help needed' ||
    text === 'support request' ||
    text === 'crm problem' ||
    text === 'skale issue'
  )
}

function normalizeSkaleSubject(value) {
  const cleaned = String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^re:\s*/i, '')
    .replace(/\s*[-|]\s*.+$/g, '')
    .trim()
  if (!cleaned || isGenericSkaleTicketSubject(cleaned)) return ''
  return cleaned.slice(0, 100)
}

function hasRequiredSkaleSections(text) {
  const source = String(text || '')
  const required = [
    'Brand Name:',
    'Priority:',
    'Category:',
    'Issue / Request:',
    'Steps to Reproduce:',
    'Expected Result:',
    'Actual Result:',
    'Request to Skale:',
  ]
  return required.every((section) => source.includes(section))
}

function buildSkaleTicketContent(body) {
  const data = body?.templateData && typeof body.templateData === 'object' ? body.templateData : {}
  const contextText = stripHtmlTags(
    pickFirstValue(
      body?.conversation,
      body?.context,
      body?.message,
      body?.prompt,
      body?.description,
      data.conversation,
      data.context,
      data.message,
      data.prompt,
      data.description
    )
  )

  const brandName = pickFirstValue(body?.brandName, body?.brand, data.brandName, data.brand) || 'Bullwaves'
  const issueRequestRaw = pickFirstValue(
    body?.issueRequest,
    body?.issue,
    body?.summary,
    body?.title,
    body?.request,
    data.issueRequest,
    data.issue,
    data.summary,
    data.title,
    data.request,
    contextText
  )
  const issueRequest = issueRequestRaw || 'Not Provided'

  const relevantLinks = [
    ...(Array.isArray(body?.relevantLinks) ? body.relevantLinks : []),
    ...(Array.isArray(data?.relevantLinks) ? data.relevantLinks : []),
    ...extractUrlsFromText(contextText),
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean)

  const affectedUsersSource = [
    ...(Array.isArray(body?.affectedUsers) ? body.affectedUsers : []),
    ...(Array.isArray(body?.accounts) ? body.accounts : []),
    ...(Array.isArray(body?.identifiers) ? body.identifiers : []),
    ...(Array.isArray(data?.affectedUsers) ? data.affectedUsers : []),
    ...(Array.isArray(data?.accounts) ? data.accounts : []),
    ...(Array.isArray(data?.identifiers) ? data.identifiers : []),
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean)

  const inferredIdentifiers = extractIdentifiersFromText(contextText)
  const affectedUsers = [...new Set([...affectedUsersSource, ...inferredIdentifiers])]
  const numberOfUsersImpacted = normalizeImpactedUsersLabel(
    pickFirstValue(
    body?.numberOfUsersImpacted,
    body?.usersImpacted,
    body?.impactCount,
    data.numberOfUsersImpacted,
    data.usersImpacted,
    data.impactCount,
    affectedUsers.length ? (affectedUsers.length === 1 ? 'One user' : 'Multiple users') : ''
    )
  )

  const screenshotsSource = [
    ...(Array.isArray(body?.attachments) ? body.attachments : []),
    ...(Array.isArray(body?.screenshots) ? body.screenshots : []),
    ...(Array.isArray(body?.recordings) ? body.recordings : []),
    ...(Array.isArray(data?.attachments) ? data.attachments : []),
    ...(Array.isArray(data?.screenshots) ? data.screenshots : []),
    ...(Array.isArray(data?.recordings) ? data.recordings : []),
  ]
    .map((item) => String(item?.name || item?.filename || item || '').trim())
    .filter(Boolean)

  const screenshots = [...new Set([...screenshotsSource, ...extractUrlsFromText(contextText)])]
  const steps = [
    ...(Array.isArray(body?.stepsToReproduce) ? body.stepsToReproduce : []),
    ...(Array.isArray(body?.steps) ? body.steps : []),
    ...(Array.isArray(data?.stepsToReproduce) ? data.stepsToReproduce : []),
    ...(Array.isArray(data?.steps) ? data.steps : []),
    ...extractStepsFromText(contextText),
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean)

  const expectedResult = pickFirstValue(
    body?.expectedResult,
    body?.expected,
    data.expectedResult,
    data.expected
  ) || 'Not Provided'

  const actualResult = pickFirstValue(body?.actualResult, body?.actual, data.actualResult, data.actual) || 'Not Provided'

  const businessImpact = pickFirstValue(
    body?.businessImpact,
    body?.impact,
    data.businessImpact,
    data.impact
  ) || 'Not Provided'

  const requestToSkale = pickFirstValue(
    body?.requestToSkale,
    body?.skaleRequest,
    body?.request,
    data.requestToSkale,
    data.skaleRequest,
    data.request
  ) || 'Please investigate, correct the issue if required, and confirm the expected workflow.'

  const priority = inferSkalePriority({
    contextText,
    issueRequest,
    expectedResult,
    actualResult,
    businessImpact,
    numberOfUsersImpacted,
  })

  const category = inferSkaleCategory({ contextText, issueRequest, requestToSkale })

  const preferredSubject = normalizeSkaleSubject(pickFirstValue(body?.subject, data.subject))
  const generatedSubject = normalizeSkaleSubject(
    pickFirstValue(issueRequest, data.title, data.summary, contextText, 'Investigation Required')
  )
  const finalSubject = preferredSubject || generatedSubject || 'Investigation Required'
  const issueClear = !isUnclearIssueDescription(issueRequest)
  const attachmentsIncluded = screenshots.length > 0

  const textLines = [
    `Brand Name: ${brandName}`,
    '',
    `Priority: ${priority}`,
    '',
    `Category: ${category}`,
    '',
    `Issue / Request: ${issueRequest}`,
    '',
    'Relevant Links:',
    ...(relevantLinks.length ? relevantLinks.map((item) => `- ${item}`) : ['- Not Provided']),
    '',
    'Affected Users / Accounts:',
    ...(affectedUsers.length ? affectedUsers.map((item) => `- ${item}`) : ['- Not Provided']),
    '',
    `Number of Users Impacted: ${numberOfUsersImpacted}`,
    '',
    'Screenshots / Recordings:',
    ...(screenshots.length ? screenshots.map((item) => `- ${item}`) : ['- Not Provided']),
    '',
    'Steps to Reproduce:',
    ...(steps.length ? steps.map((item, index) => `${index + 1}. ${item}`) : ['1. Not Provided']),
    '',
    `Expected Result: ${expectedResult}`,
    '',
    `Actual Result: ${actualResult}`,
    '',
    `Business Impact: ${businessImpact}`,
    '',
    `Request to Skale: ${requestToSkale}`,
  ]

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="760" cellspacing="0" cellpadding="0" style="max-width:760px;width:100%;background:#ffffff;border:1px solid #dbe4f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0b2a57;color:#ffffff;padding:18px 22px;">
                <div style="font-size:22px;font-weight:700;">${escapeHtml(finalSubject)}</div>
                <div style="font-size:14px;opacity:0.92;margin-top:4px;"><strong>Brand:</strong> ${escapeHtml(brandName)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 22px;font-size:15px;line-height:1.6;">
                <h3 style="margin:0 0 8px;font-size:16px;color:#0b2a57;">Brand Name</h3>
                <p style="margin:0 0 14px;">${escapeHtml(brandName)}</p>

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Priority</h3>
                <p style="margin:0 0 14px;">${escapeHtml(priority)}</p>

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Category</h3>
                <p style="margin:0 0 14px;">${escapeHtml(category)}</p>

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Issue / Request</h3>
                <p style="margin:0 0 14px;">${escapeHtml(issueRequest)}</p>

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Relevant Links</h3>
                ${renderBulletListHtml(relevantLinks) || '<p style="margin:0;color:#475569;">Not Provided</p>'}

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Affected Users / Accounts</h3>
                ${renderBulletListHtml(affectedUsers) || '<p style="margin:0;color:#475569;">Not Provided</p>'}

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Number of Users Impacted</h3>
                <p style="margin:0 0 14px;">${escapeHtml(numberOfUsersImpacted)}</p>

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Screenshots / Recordings</h3>
                ${renderBulletListHtml(screenshots) || '<p style="margin:0;color:#475569;">Not Provided</p>'}

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Steps to Reproduce</h3>
                ${renderBulletListHtml(steps.length ? steps.map((step, index) => `${index + 1}. ${step}`) : ['1. Not Provided'])}

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Expected Result</h3>
                <p style="margin:0 0 14px;">${escapeHtml(expectedResult)}</p>

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Actual Result</h3>
                <p style="margin:0 0 14px;">${escapeHtml(actualResult)}</p>

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Business Impact</h3>
                <p style="margin:0 0 14px;">${escapeHtml(businessImpact)}</p>

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Request to Skale</h3>
                <p style="margin:0;">${escapeHtml(requestToSkale)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return {
    subject: finalSubject,
    text: textLines.join('\n').trim(),
    html,
    meta: {
      priority,
      category,
      issueClear,
      attachmentsIncluded,
    },
  }
}

function isSkaleTicketIntent(body) {
  const data = body?.templateData && typeof body.templateData === 'object' ? body.templateData : {}
  const triggerText = [
    body?.intent,
    body?.destination,
    body?.assistant,
    body?.ticketType,
    body?.template,
    body?.subject,
    body?.text,
    body?.html,
    body?.conversation,
    body?.context,
    body?.message,
    body?.prompt,
    body?.description,
    data.intent,
    data.destination,
    data.assistant,
    data.ticketType,
    data.template,
    data.subject,
    data.text,
    data.html,
    data.conversation,
    data.context,
    data.message,
    data.prompt,
    data.description,
  ]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    triggerText.includes('skale') &&
    (triggerText.includes('open a skale ticket') ||
      triggerText.includes('create a skale ticket') ||
      triggerText.includes('send to skale') ||
      triggerText.includes('report the issue to skale') ||
      triggerText.includes('report to skale') ||
      triggerText.includes('skale ticket') ||
      triggerText.includes('support@skalecrm.com') ||
      triggerText.includes('support case'))
  )
}

function isGenericSkaleTicketSubject(value) {
  const text = String(value || '').trim().toLowerCase()
  if (!text) return true
  return (
    text === 'skale' ||
    text === 'support request' ||
    text === 'ticket' ||
    text.includes('open a skale ticket') ||
    text.includes('create a skale ticket') ||
    text.includes('send to skale') ||
    text.includes('report to skale') ||
    text.includes('report the issue to skale') ||
    text.includes('skale ticket') ||
    text.includes('support case')
  )
}

function readSkaleTicketDraft(body) {
  const generated = buildSkaleTicketContent(body)
  const explicitSubject = String(body?.subject || '').trim()
  const explicitText = String(body?.text || '').trim()
  const explicitHtml = String(body?.html || '').trim()

  return {
    subject: explicitSubject || generated.subject,
    text: explicitText || generated.text,
    html: explicitHtml || generated.html,
    meta: generated.meta,
  }
}

function signatureHtmlToText(value) {
  return stripHtmlTags(String(value || ''))
}

function formatTextAsSimpleHtmlParagraphs(value) {
  const lines = String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return ''
  return `<p style="margin:18px 0 0;color:#475569;">${lines.map((line) => escapeHtml(line)).join('<br>')}</p>`
}

function appendSignatureToBodies(text, html, signatureText, signatureHtml) {
  const sigText = String(signatureText || '').trim() || signatureHtmlToText(signatureHtml)
  const sigHtml = String(signatureHtml || '').trim() || formatTextAsSimpleHtmlParagraphs(sigText)

  let outText = String(text || '').trim()
  let outHtml = String(html || '').trim()

  if (sigText && (!outText || !outText.includes(sigText))) {
    outText = outText ? `${outText}\n\n${sigText}` : sigText
  }

  if (sigHtml && outHtml && !outHtml.includes(sigHtml)) {
    outHtml = outHtml.includes('</body>') ? outHtml.replace('</body>', `${sigHtml}\n  </body>`) : `${outHtml}\n${sigHtml}`
  }

  return {
    text: outText,
    html: outHtml,
  }
}

async function readGoogleSignature(gmail) {
  try {
    const listed = await gmail.users.settings.sendAs.list({ userId: 'me' })
    const entries = Array.isArray(listed?.data?.sendAs) ? listed.data.sendAs : []
    const preferred = entries.find((item) => item?.isPrimary) || entries[0]
    const signatureHtml = String(preferred?.signature || '').trim()
    const signatureText = signatureHtmlToText(signatureHtml)
    if (!signatureHtml && !signatureText) return null
    return {
      text: signatureText,
      html: signatureHtml,
    }
  } catch {
    return null
  }
}

function buildExecutiveBriefingContent(body) {
  const data = body?.templateData && typeof body.templateData === 'object' ? body.templateData : {}
  const title = String(data.title || 'Executive Briefing').trim()
  const focus = String(data.focus || '').trim()
  const date = String(data.date || new Date().toISOString().slice(0, 10)).trim()
  const greeting = String(data.greeting || 'Ciao Paolo,').trim()
  const intro = String(data.intro || 'di seguito trovi il riepilogo operativo della giornata.').trim()
  const deneoCount = Number(data.deneoCount || 0)
  const digicertCount = Number(data.digicertCount || 0)
  const priorities = Array.isArray(data.priorities) ? data.priorities : []
  const deneoHighlights = Array.isArray(data.deneoHighlights) ? data.deneoHighlights : []
  const digicertHighlights = Array.isArray(data.digicertHighlights) ? data.digicertHighlights : []
  const nextSteps = Array.isArray(data.nextSteps) ? data.nextSteps : []

  const normalizedFocus = focus ? ` - ${focus}` : ''
  const subject = `${title}${normalizedFocus} (${date})`

  const textLines = [
    `${title}${normalizedFocus}`,
    `Data: ${date}`,
    '',
    greeting,
    '',
    intro,
    '',
    'SNAPSHOT',
    `- DENEO: ${deneoCount}`,
    `- DigiCert: ${digicertCount}`,
    '',
    'DENEO - HIGHLIGHTS',
    ...renderBulletListText(deneoHighlights),
    '',
    'DIGICERT - HIGHLIGHTS',
    ...renderBulletListText(digicertHighlights),
    '',
    'PRIORITA OGGI',
    ...renderBulletListText(priorities),
    '',
    'PROSSIMI STEP',
    ...renderBulletListText(nextSteps),
    '',
    'Grazie,',
    'Bullwaves Console',
  ]

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="720" cellspacing="0" cellpadding="0" style="max-width:720px;width:100%;background:#ffffff;border:1px solid #dbe4f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0b2a57;color:#ffffff;padding:18px 22px;">
                <div style="font-size:22px;font-weight:700;">${escapeHtml(title)}</div>
                <div style="font-size:14px;opacity:0.92;margin-top:4px;"><strong>Focus:</strong> ${escapeHtml(focus || 'N/A')} | <strong>Data:</strong> ${escapeHtml(date)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 22px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 10px;"><strong>${escapeHtml(greeting)}</strong></p>
                <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>

                <h3 style="margin:18px 0 8px;font-size:16px;color:#0b2a57;">Snapshot</h3>
                <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px;border:1px solid #dbe4f0;background:#f8fbff;"><strong>DENEO</strong></td>
                    <td style="padding:10px;border:1px solid #dbe4f0;background:#f8fbff;" align="right"><strong>${deneoCount}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding:10px;border:1px solid #dbe4f0;"><strong>DigiCert</strong></td>
                    <td style="padding:10px;border:1px solid #dbe4f0;" align="right"><strong>${digicertCount}</strong></td>
                  </tr>
                </table>

                <h3 style="margin:18px 0 8px;font-size:16px;color:#0b2a57;">DENEO - Highlights</h3>
                ${renderBulletListHtml(deneoHighlights) || '<p style="margin:0;color:#475569;">Nessun elemento rilevante.</p>'}

                <h3 style="margin:18px 0 8px;font-size:16px;color:#0b2a57;">DigiCert - Highlights</h3>
                ${renderBulletListHtml(digicertHighlights) || '<p style="margin:0;color:#475569;">Nessun elemento rilevante.</p>'}

                <h3 style="margin:18px 0 8px;font-size:16px;color:#0b2a57;">Priorita Oggi</h3>
                ${renderBulletListHtml(priorities) || '<p style="margin:0;color:#475569;">Nessuna priorita specifica.</p>'}

                <h3 style="margin:18px 0 8px;font-size:16px;color:#0b2a57;">Prossimi Step</h3>
                ${renderBulletListHtml(nextSteps) || '<p style="margin:0;color:#475569;">Nessun prossimo step configurato.</p>'}

                <p style="margin:22px 0 0;color:#475569;">Grazie,<br><strong>Bullwaves Console</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return {
    subject,
    text: textLines.join('\n').trim(),
    html,
  }
}

function buildStatusBriefingContent(body) {
  const data = body?.templateData && typeof body.templateData === 'object' ? body.templateData : {}
  const title = String(data.title || 'Status Briefing').trim()
  const focus = String(data.focus || '').trim()
  const date = String(data.date || new Date().toISOString().slice(0, 10)).trim()
  const greeting = String(data.greeting || 'Hi team,').trim()
  const opening = String(data.opening || 'Here is a focused status update with clear ownership and next actions.').trim()
  const currentStatus = String(data.currentStatus || '').trim()
  const desiredStatus = String(data.desiredStatus || '').trim()
  const ongoing = Array.isArray(data.ongoing) ? data.ongoing : []
  const done = Array.isArray(data.done) ? data.done : []
  const todo = Array.isArray(data.todo) ? data.todo : []
  const nextSteps = Array.isArray(data.nextSteps) ? data.nextSteps : []
  const closing = String(data.closing || 'If needed, I can share a tighter delta update at end of day.').trim()
  const signature = String(data.signature || 'Bullwaves Console').trim()

  const normalizedFocus = focus ? ` - ${focus}` : ''
  const subject = `${title}${normalizedFocus} (${date})`

  const textLines = [
    `${title}${normalizedFocus}`,
    `Date: ${date}`,
    '',
    greeting,
    '',
    opening,
    '',
    'CURRENT STATUS',
    currentStatus || '-',
    '',
    'DESIRED STATUS',
    desiredStatus || '-',
    '',
    'ONGOING',
    ...renderBulletListText(ongoing),
    '',
    'DONE',
    ...renderBulletListText(done),
    '',
    'TO DO',
    ...renderBulletListText(todo),
    '',
    'NEXT STEPS',
    ...renderBulletListText(nextSteps),
    '',
    closing,
    '',
    signature,
  ]

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="760" cellspacing="0" cellpadding="0" style="max-width:760px;width:100%;background:#ffffff;border:1px solid #dbe4f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0b2a57;color:#ffffff;padding:18px 22px;">
                <div style="font-size:22px;font-weight:700;">${escapeHtml(title)}</div>
                <div style="font-size:14px;opacity:0.92;margin-top:4px;"><strong>Focus:</strong> ${escapeHtml(focus || 'N/A')} | <strong>Date:</strong> ${escapeHtml(date)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 22px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 8px;"><strong>${escapeHtml(greeting)}</strong></p>
                <p style="margin:0 0 16px;">${escapeHtml(opening)}</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:12px 0;">
                  <tr>
                    <td style="width:50%;padding:12px;border:1px solid #dbe4f0;background:#f8fbff;vertical-align:top;">
                      <div style="font-weight:700;color:#0b2a57;margin-bottom:6px;">Current Status</div>
                      <div>${escapeHtml(currentStatus || 'N/A')}</div>
                    </td>
                    <td style="width:50%;padding:12px;border:1px solid #dbe4f0;background:#f8fbff;vertical-align:top;">
                      <div style="font-weight:700;color:#0b2a57;margin-bottom:6px;">Desired Status</div>
                      <div>${escapeHtml(desiredStatus || 'N/A')}</div>
                    </td>
                  </tr>
                </table>

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Ongoing</h3>
                ${renderBulletListHtml(ongoing) || '<p style="margin:0;color:#475569;">No ongoing items.</p>'}

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Done</h3>
                ${renderBulletListHtml(done) || '<p style="margin:0;color:#475569;">No completed items yet.</p>'}

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">To Do</h3>
                ${renderBulletListHtml(todo) || '<p style="margin:0;color:#475569;">No open actions.</p>'}

                <h3 style="margin:16px 0 8px;font-size:16px;color:#0b2a57;">Next Steps</h3>
                ${renderBulletListHtml(nextSteps) || '<p style="margin:0;color:#475569;">No next steps configured.</p>'}

                <p style="margin:20px 0 0;color:#475569;">${escapeHtml(closing)}</p>
                <p style="margin:10px 0 0;color:#475569;"><strong>${escapeHtml(signature)}</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return {
    subject,
    text: textLines.join('\n').trim(),
    html,
  }
}

function escapeForPowerShellSingleQuoted(value) {
  return String(value || '').replace(/'/g, "''")
}

function runPowerShell(command) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell',
      ['-NoProfile', '-Command', command],
      {
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          const err = new Error(stderr || error.message || 'PowerShell execution failed')
          err.cause = error
          reject(err)
          return
        }

        resolve(String(stdout || '').trim())
      }
    )
  })
}

function shouldTryPowerShellTokenFallback(error) {
  const message = String(error?.message || '').toLowerCase()
  const causeCode = String(error?.cause?.code || '').toUpperCase()
  return (
    message.includes('fetch failed') ||
    message.includes('etimedout') ||
    message.includes('enetunreach') ||
    causeCode === 'ETIMEDOUT' ||
    causeCode === 'ENETUNREACH'
  )
}

async function getTokenViaPowerShell(oauthConfig, code) {
  const bodyPairs = [
    `code=${encodeURIComponent(String(code || ''))}`,
    `client_id=${encodeURIComponent(String(oauthConfig.clientId || ''))}`,
    `client_secret=${encodeURIComponent(String(oauthConfig.clientSecret || ''))}`,
    `redirect_uri=${encodeURIComponent(String(oauthConfig.redirectUri || ''))}`,
    'grant_type=authorization_code',
  ].join('&')

  const escapedBody = escapeForPowerShellSingleQuoted(bodyPairs)
  const script = [
    "$payload = '" + escapedBody + "'",
    "$resp = Invoke-RestMethod -Uri 'https://oauth2.googleapis.com/token' -Method Post -Body $payload -ContentType 'application/x-www-form-urlencoded' -TimeoutSec 30",
    '$resp | ConvertTo-Json -Depth 8 -Compress',
  ].join('; ')

  const raw = await runPowerShell(script)
  if (!raw) throw new Error('PowerShell fallback returned empty OAuth token payload')

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`PowerShell fallback returned non-JSON response: ${raw}`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('PowerShell fallback returned invalid token payload')
  }

  return parsed
}

async function ensureLabelId(gmail, labelName, cache) {
  const normalized = String(labelName || '').trim()
  if (!normalized) return ''

  if (cache.has(normalized)) return cache.get(normalized)

  const listed = await gmail.users.labels.list({ userId: 'me' })
  const labels = listed?.data?.labels || []
  const found = labels.find((l) => String(l?.name || '') === normalized)
  if (found?.id) {
    cache.set(normalized, found.id)
    return found.id
  }

  const created = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name: normalized,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    },
  })

  const id = String(created?.data?.id || '')
  if (id) cache.set(normalized, id)
  return id
}

function summarizeMessage(message) {
  const payload = message?.payload || {}
  const headers = payload?.headers || []
  const snippet = String(message?.snippet || '').trim()
  const internalDate = Number(message?.internalDate || 0)

  return {
    id: message?.id || null,
    threadId: message?.threadId || null,
    labelIds: Array.isArray(message?.labelIds) ? message.labelIds : [],
    snippet,
    subject: extractHeader(headers, 'Subject'),
    from: extractHeader(headers, 'From'),
    date: extractHeader(headers, 'Date') || (internalDate ? new Date(internalDate).toISOString() : null),
    internalDate: internalDate || null,
  }
}

async function handleHealth(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const admin = ensureAdminAccess(req, null, reqUrl)
  if (!admin.ok) {
    return json(res, admin.status, admin.payload, { 'Cache-Control': 'no-store' })
  }

  const oauthConfig = getOAuthConfig()
  const tokenStore = loadTokenStore()

  return json(
    res,
    200,
    {
      ok: true,
      configured: Boolean(oauthConfig.clientId && oauthConfig.clientSecret),
      connected: Boolean(tokenStore?.tokens?.refresh_token || tokenStore?.tokens?.access_token),
      redirectUri: oauthConfig.redirectUri,
      scopes: oauthConfig.scopes,
      connectedAccount: tokenStore?.gmail?.emailAddress || null,
      tokenUpdatedAt: tokenStore?.updatedAt || null,
      viewerEmail: admin.viewerEmail,
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleAuthUrl(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const admin = ensureAdminAccess(req, null, reqUrl)
  if (!admin.ok) {
    return json(res, admin.status, admin.payload, { 'Cache-Control': 'no-store' })
  }

  const oauthConfig = getOAuthConfig()
  const { client, error } = createOAuthClient(oauthConfig)
  if (error) return json(res, 503, { ok: false, error }, { 'Cache-Control': 'no-store' })

  const state = createSignedState(admin.viewerEmail, oauthConfig.stateSecret)
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: oauthConfig.scopes,
    state,
  })

  return json(
    res,
    200,
    {
      ok: true,
      authUrl,
      state,
      redirectUri: oauthConfig.redirectUri,
      scopes: oauthConfig.scopes,
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handleOAuthCallback(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const code = String(reqUrl.searchParams.get('code') || '').trim()
  const state = String(reqUrl.searchParams.get('state') || '').trim()

  if (!code) {
    return json(res, 400, { ok: false, error: 'Missing OAuth code' }, { 'Cache-Control': 'no-store' })
  }

  const oauthConfig = getOAuthConfig()
  const { client, error } = createOAuthClient(oauthConfig)
  if (error) return json(res, 503, { ok: false, error }, { 'Cache-Control': 'no-store' })

  const stateCheck = verifySignedState(state, oauthConfig.stateSecret)
  if (!stateCheck.ok) {
    return json(res, 401, { ok: false, error: `Invalid OAuth state (${stateCheck.reason})` }, { 'Cache-Control': 'no-store' })
  }

  try {
    let tokens = null
    try {
      const tokenResponse = await client.getToken(code)
      tokens = tokenResponse?.tokens || null
    } catch (tokenError) {
      if (!shouldTryPowerShellTokenFallback(tokenError)) throw tokenError
      if (process.platform !== 'win32') throw tokenError

      const fallbackTokens = await getTokenViaPowerShell(oauthConfig, code)
      tokens = fallbackTokens
    }

    if (!tokens || typeof tokens !== 'object') {
      return json(res, 502, { ok: false, error: 'Google OAuth did not return tokens' }, { 'Cache-Control': 'no-store' })
    }

    client.setCredentials(tokens)
    const gmail = google.gmail({ version: 'v1', auth: client })
    const profile = await gmail.users.getProfile({ userId: 'me' })
    const emailAddress = String(profile?.data?.emailAddress || '').trim()

    const store = {
      provider: 'gmail',
      gmail: {
        emailAddress: emailAddress || null,
      },
      linkedBy: stateCheck.viewerEmail || null,
      linkedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokens,
    }

    saveTokenStore(store)

    return json(
      res,
      200,
      {
        ok: true,
        connected: true,
        gmailAccount: emailAddress || null,
        linkedBy: stateCheck.viewerEmail || null,
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (oauthError) {
    return json(
      res,
      502,
      {
        ok: false,
        error: oauthError?.message || 'OAuth exchange failed',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleMessages(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const admin = ensureAdminAccess(req, null, reqUrl)
  if (!admin.ok) {
    return json(res, admin.status, admin.payload, { 'Cache-Control': 'no-store' })
  }

  const maxResultsRaw = Number(reqUrl.searchParams.get('maxResults') || 15)
  const maxResults = Math.min(50, Math.max(1, Number.isFinite(maxResultsRaw) ? Math.round(maxResultsRaw) : 15))
  const q = String(reqUrl.searchParams.get('q') || '').trim()
  const pageToken = String(reqUrl.searchParams.get('pageToken') || '').trim()

  const { gmail, error } = await getAuthedGmailClient()
  if (error) return json(res, 503, { ok: false, error }, { 'Cache-Control': 'no-store' })

  try {
    const listed = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      ...(q ? { q } : {}),
      ...(pageToken ? { pageToken } : {}),
    })

    const ids = Array.isArray(listed?.data?.messages) ? listed.data.messages : []
    const details = await Promise.all(
      ids.map((item) =>
        gmail.users.messages.get({
          userId: 'me',
          id: item.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date', 'Message-ID'],
        })
      )
    )

    const messages = details.map((entry) => summarizeMessage(entry?.data || {}))

    return json(
      res,
      200,
      {
        ok: true,
        count: messages.length,
        q: q || null,
        pageToken: pageToken || null,
        nextPageToken: String(listed?.data?.nextPageToken || '').trim() || null,
        messages,
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (gmailError) {
    return json(
      res,
      502,
      {
        ok: false,
        error: gmailError?.message || 'Failed to fetch Gmail messages',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleAutoTriage(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const body = safeParseJsonBody(req)
  const admin = ensureAdminAccess(req, body, reqUrl)
  if (!admin.ok) {
    return json(res, admin.status, admin.payload, { 'Cache-Control': 'no-store' })
  }

  const dryRun = Boolean(body?.dryRun ?? true)
  const q = String(body?.q || 'is:unread newer_than:7d').trim()
  const maxResultsRaw = Number(body?.maxResults || 25)
  const maxResults = Math.min(100, Math.max(1, Number.isFinite(maxResultsRaw) ? Math.round(maxResultsRaw) : 25))
  const rulesRaw = Array.isArray(body?.rules) ? body.rules : []

  const rules = rulesRaw
    .map((rule, index) => {
      const contains = String(rule?.contains || '').trim().toLowerCase()
      const fromIncludes = String(rule?.fromIncludes || '').trim().toLowerCase()
      const label = String(rule?.label || '').trim()
      return {
        id: String(rule?.id || `rule-${index + 1}`),
        contains,
        fromIncludes,
        label,
        star: Boolean(rule?.star),
        markRead: Boolean(rule?.markRead),
      }
    })
    .filter((rule) => rule.contains || rule.fromIncludes || rule.label || rule.star || rule.markRead)

  if (!rules.length) {
    return json(
      res,
      400,
      {
        ok: false,
        error: 'No valid rules provided. Add at least one contains/fromIncludes/label/star/markRead rule.',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const { gmail, error } = await getAuthedGmailClient()
  if (error) return json(res, 503, { ok: false, error }, { 'Cache-Control': 'no-store' })

  const labelCache = new Map()

  try {
    const listed = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      ...(q ? { q } : {}),
    })

    const ids = Array.isArray(listed?.data?.messages) ? listed.data.messages : []
    const details = await Promise.all(
      ids.map((item) =>
        gmail.users.messages.get({
          userId: 'me',
          id: item.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        })
      )
    )

    const results = []
    for (const row of details) {
      const message = row?.data || {}
      const summary = summarizeMessage(message)
      const from = String(summary.from || '').toLowerCase()
      const textProbe = `${String(summary.subject || '').toLowerCase()} ${String(summary.snippet || '').toLowerCase()}`

      const matchedRules = rules.filter((rule) => {
        const containsOk = rule.contains ? textProbe.includes(rule.contains) : true
        const fromOk = rule.fromIncludes ? from.includes(rule.fromIncludes) : true
        return containsOk && fromOk
      })

      if (!matchedRules.length) {
        results.push({
          id: summary.id,
          from: summary.from,
          subject: summary.subject,
          matchedRules: [],
          changed: false,
        })
        continue
      }

      const addLabelIds = []
      const removeLabelIds = []
      for (const rule of matchedRules) {
        if (rule.label) {
          // Create label on demand to keep automation self-serve.
          // A cache avoids listing labels for every message.
          // eslint-disable-next-line no-await-in-loop
          const labelId = await ensureLabelId(gmail, rule.label, labelCache)
          if (labelId) addLabelIds.push(labelId)
        }
        if (rule.star) addLabelIds.push('STARRED')
        if (rule.markRead) removeLabelIds.push('UNREAD')
      }

      const uniqueAdd = [...new Set(addLabelIds)]
      const uniqueRemove = [...new Set(removeLabelIds)]

      if (!dryRun && (uniqueAdd.length || uniqueRemove.length)) {
        // eslint-disable-next-line no-await-in-loop
        await gmail.users.messages.modify({
          userId: 'me',
          id: summary.id,
          requestBody: {
            addLabelIds: uniqueAdd,
            removeLabelIds: uniqueRemove,
          },
        })
      }

      results.push({
        id: summary.id,
        from: summary.from,
        subject: summary.subject,
        matchedRules: matchedRules.map((rule) => rule.id),
        changed: uniqueAdd.length > 0 || uniqueRemove.length > 0,
        dryRun,
        planned: {
          addLabelIds: uniqueAdd,
          removeLabelIds: uniqueRemove,
        },
      })
    }

    const changedCount = results.filter((item) => item.changed).length

    return json(
      res,
      200,
      {
        ok: true,
        dryRun,
        q,
        scanned: results.length,
        changedCount,
        results,
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (gmailError) {
    return json(
      res,
      502,
      {
        ok: false,
        error: gmailError?.message || 'Failed to run Gmail auto-triage',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleReplyTemplate(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const body = safeParseJsonBody(req)
  const admin = ensureAdminAccess(req, body, reqUrl)
  if (!admin.ok) {
    return json(res, admin.status, admin.payload, { 'Cache-Control': 'no-store' })
  }

  const messageId = String(body?.messageId || '').trim()
  const templateName = String(body?.template || 'acknowledge').trim().toLowerCase()
  const customText = String(body?.customText || '').trim()
  const signature = String(body?.signature || '').trim()

  if (!messageId) {
    return json(res, 400, { ok: false, error: 'Missing required field: messageId' }, { 'Cache-Control': 'no-store' })
  }

  const templateText = customText || REPLY_TEMPLATES[templateName] || REPLY_TEMPLATES.acknowledge
  const finalBody = signature ? `${templateText}\n\n${signature}` : templateText

  const { gmail, error } = await getAuthedGmailClient()
  if (error) return json(res, 503, { ok: false, error }, { 'Cache-Control': 'no-store' })

  try {
    const original = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Message-ID'],
    })

    const headers = original?.data?.payload?.headers || []
    const from = parseFromHeader(extractHeader(headers, 'From'))
    const subject = ensureReplySubject(extractHeader(headers, 'Subject'))
    const originalMessageHeader = extractHeader(headers, 'Message-ID')

    if (!from.email || !isValidEmail(from.email)) {
      return json(
        res,
        400,
        { ok: false, error: 'Could not detect sender email from original message' },
        { 'Cache-Control': 'no-store' }
      )
    }

    const lines = [
      `To: ${from.email}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
    ]

    if (originalMessageHeader) {
      lines.push(`In-Reply-To: ${originalMessageHeader}`)
      lines.push(`References: ${originalMessageHeader}`)
    }

    lines.push('')
    lines.push(finalBody)

    const raw = toBase64Url(lines.join('\r\n'))
    const sent = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId: original?.data?.threadId || undefined,
      },
    })

    return json(
      res,
      200,
      {
        ok: true,
        sent: true,
        template: customText ? 'custom' : templateName,
        to: from.email,
        threadId: original?.data?.threadId || null,
        sentMessageId: sent?.data?.id || null,
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (gmailError) {
    return json(
      res,
      502,
      {
        ok: false,
        error: gmailError?.message || 'Failed to send Gmail reply',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleSend(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const body = safeParseJsonBody(req)
  const admin = ensureAdminAccess(req, body, reqUrl)
  if (!admin.ok) {
    return json(res, admin.status, admin.payload, { 'Cache-Control': 'no-store' })
  }

  const to = normalizeRecipientList(body?.to)
  const cc = normalizeRecipientList(body?.cc)
  const bcc = normalizeRecipientList(body?.bcc)
  const template = String(body?.template || '').trim().toLowerCase()
  const skaleIntent = isSkaleTicketIntent(body)
  const skaleFlow = skaleIntent || template === 'skale_ticket'
  const recipientList = skaleFlow ? [SKALE_SUPPORT_EMAIL] : to
  let skaleMeta = null

  let subject = String(body?.subject || '').trim()
  let text = String(body?.text || '').trim()
  let html = String(body?.html || '').trim()

  if (skaleFlow) {
    const generated = readSkaleTicketDraft(body)
    skaleMeta = generated.meta || null
    if (skaleMeta && !skaleMeta.issueClear) {
      return json(
        res,
        400,
        {
          ok: false,
          error: 'Issue description is unclear. Provide a clearer Issue / Request before sending to Skale.',
        },
        { 'Cache-Control': 'no-store' }
      )
    }

    if (!subject || isGenericSkaleTicketSubject(subject)) subject = generated.subject
    if (!text) text = generated.text
    if (!html) html = generated.html

    if (!hasRequiredSkaleSections(text)) {
      text = generated.text
      html = generated.html
    }

    if (isGenericSkaleTicketSubject(subject)) {
      subject = generated.subject
    }
  }

  if (template === 'executive_briefing') {
    const generated = buildExecutiveBriefingContent(body)
    if (!subject) subject = generated.subject
    if (!text) text = generated.text
    if (!html) html = generated.html
  }
  if (template === 'status_briefing') {
    const generated = buildStatusBriefingContent(body)
    if (!subject) subject = generated.subject
    if (!text) text = generated.text
    if (!html) html = generated.html
  }
  if (template === 'skale_ticket' && !skaleFlow) {
    const generated = buildSkaleTicketContent(body)
    if (!subject) subject = generated.subject
    if (!text) text = generated.text
    if (!html) html = generated.html
    skaleMeta = generated.meta || null
  }

  if (!recipientList.length) {
    return json(res, 400, { ok: false, error: 'Missing required field: to' }, { 'Cache-Control': 'no-store' })
  }

  if (!subject) {
    return json(res, 400, { ok: false, error: 'Missing required field: subject' }, { 'Cache-Control': 'no-store' })
  }

  if (!text && !html) {
    return json(
      res,
      400,
      {
        ok: false,
        error: 'Missing content. Provide text, html, or template=executive_briefing, status_briefing, or skale_ticket.',
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const { gmail, error } = await getAuthedGmailClient()
  if (error) return json(res, 503, { ok: false, error }, { 'Cache-Control': 'no-store' })

  try {
    let finalText = text
    let finalHtml = html

    // For Skale ticket requests, append sender signature at the end.
    if (skaleFlow) {
      const providedSignatureText = String(body?.signature || body?.templateData?.signature || '').trim()
      const providedSignatureHtml = String(body?.signatureHtml || body?.templateData?.signatureHtml || '').trim()
      let signatureText = providedSignatureText
      let signatureHtml = providedSignatureHtml

      if (!signatureText && !signatureHtml) {
        const googleSignature = await readGoogleSignature(gmail)
        if (googleSignature) {
          signatureText = googleSignature.text
          signatureHtml = googleSignature.html
        }
      }

      if (!signatureText && !signatureHtml && admin?.viewerEmail) {
        signatureText = `Best regards,\n${admin.viewerEmail}`
      }

      const withSignature = appendSignatureToBodies(finalText, finalHtml, signatureText, signatureHtml)
      finalText = withSignature.text
      finalHtml = withSignature.html
    }

    const safeText = finalText || String(finalHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const lines = [
      `To: ${recipientList.join(', ')}`,
      ...(cc.length ? [`Cc: ${cc.join(', ')}`] : []),
      ...(bcc.length ? [`Bcc: ${bcc.join(', ')}`] : []),
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
    ]

    if (finalHtml) {
      const boundary = `bw-${crypto.randomBytes(12).toString('hex')}`
      lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
      lines.push('')
      lines.push(`--${boundary}`)
      lines.push('Content-Type: text/plain; charset="UTF-8"')
      lines.push('Content-Transfer-Encoding: 7bit')
      lines.push('')
      lines.push(safeText)
      lines.push(`--${boundary}`)
      lines.push('Content-Type: text/html; charset="UTF-8"')
      lines.push('Content-Transfer-Encoding: 7bit')
      lines.push('')
      lines.push(finalHtml)
      lines.push(`--${boundary}--`)
    } else {
      lines.push('Content-Type: text/plain; charset="UTF-8"')
      lines.push('')
      lines.push(safeText)
    }

    const raw = toBase64Url(lines.join('\r\n'))
    const sent = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    })

    return json(
      res,
      200,
      {
        ok: true,
        sent: true,
        to: recipientList,
        cc,
        bccCount: bcc.length,
        subject,
        sentMessageId: sent?.data?.id || null,
        template: skaleFlow ? 'skale_ticket' : template || null,
        priority: skaleMeta?.priority || null,
        category: skaleMeta?.category || null,
        attachmentsIncluded: Boolean(skaleMeta?.attachmentsIncluded),
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (gmailError) {
    return json(
      res,
      502,
      {
        ok: false,
        error: gmailError?.message || 'Failed to send Gmail message',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function handleDisconnect(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const reqUrl = new URL(req.url, 'http://localhost')
  const body = safeParseJsonBody(req)
  const admin = ensureAdminAccess(req, body, reqUrl)
  if (!admin.ok) {
    return json(res, admin.status, admin.payload, { 'Cache-Control': 'no-store' })
  }

  try {
    if (fs.existsSync(TOKEN_STORE_PATH)) fs.unlinkSync(TOKEN_STORE_PATH)
    return json(res, 200, { ok: true, disconnected: true }, { 'Cache-Control': 'no-store' })
  } catch (error) {
    return json(
      res,
      500,
      {
        ok: false,
        error: error?.message || 'Failed to disconnect Gmail account',
      },
      { 'Cache-Control': 'no-store' }
    )
  }
}

async function routeGmail(req, res, parts) {
  const head = parts[0] || ''
  const tail = parts[1] || ''

  if (head === 'health') return handleHealth(req, res)
  if (head === 'auth-url') return handleAuthUrl(req, res)
  if (head === 'oauth' && tail === 'callback') return handleOAuthCallback(req, res)
  if (head === 'messages') return handleMessages(req, res)
  if (head === 'auto-triage') return handleAutoTriage(req, res)
  if (head === 'reply-template') return handleReplyTemplate(req, res)
  if (head === 'send') return handleSend(req, res)
  if (head === 'disconnect') return handleDisconnect(req, res)

  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeGmail,
  decodeBase64Url,
}
