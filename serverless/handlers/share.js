const crypto = require('crypto')
const { Buffer } = require('buffer')
const { json, pickHeader, safeParseJsonBody } = require('./_http')
const { hasKvEnv, kvExpire, kvGetJson, kvLpushJson, kvSetJson } = require('./kv')

function base64UrlEncode(value) {
  return Buffer.from(String(value), 'utf8').toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8')
}

function getShareSecret() {
  return String(
    process.env.SHARE_TOKEN_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.CONSOLE_CREDENTIALS ||
      ''
  ).trim()
}

function signStatelessShareBody(body) {
  const secret = getShareSecret()
  if (!secret) return ''
  return crypto.createHmac('sha256', secret).update(String(body)).digest('base64url')
}

function makeStatelessShareToken(expectedK, prefix, payload, ttlSeconds) {
  const ttl = Number(ttlSeconds)
  const now = Date.now()
  const envelope = {
    v: 1,
    p: prefix,
    k: expectedK,
    exp: Number.isFinite(ttl) && ttl > 0 ? now + Math.trunc(ttl) * 1000 : null,
    payload,
  }
  const body = base64UrlEncode(JSON.stringify(envelope))
  const sig = signStatelessShareBody(body)
  if (!sig) return ''
  return `share_${prefix}_${body}.${sig}`
}

function readStatelessShareToken(expectedK, prefix, token) {
  const clean = String(token || '').trim()
  const marker = `share_${prefix}_`
  if (!clean.startsWith(marker)) return null

  const rest = clean.slice(marker.length)
  const dot = rest.lastIndexOf('.')
  if (dot <= 0) return { ok: false, error: 'Invalid token' }

  const body = rest.slice(0, dot)
  const sig = rest.slice(dot + 1)
  const expectedSig = signStatelessShareBody(body)
  if (!expectedSig) return { ok: false, error: 'Share token secret not configured' }

  const a = Buffer.from(sig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: 'Invalid token' }
  }

  let envelope = null
  try {
    envelope = JSON.parse(base64UrlDecode(body))
  } catch {
    return { ok: false, error: 'Invalid token' }
  }

  if (!envelope || envelope.p !== prefix || envelope.k !== expectedK) {
    return { ok: false, error: 'Invalid token' }
  }

  const exp = Number(envelope.exp)
  if (Number.isFinite(exp) && exp > 0 && Date.now() > exp) {
    return { ok: false, error: 'Expired token' }
  }

  const payload = envelope.payload
  if (!payload || typeof payload !== 'object' || payload.k !== expectedK) {
    return { ok: false, error: 'Invalid payload' }
  }

  return { ok: true, payload }
}

function getTokenFrom(parts, idx) {
  const tok = parts[idx]
  return tok == null ? '' : String(tok).trim()
}

async function handleShareSupportBotlistPost(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  if (!hasKvEnv()) {
    return json(res, 501, {
      ok: false,
      error: 'Share storage not configured (missing KV env).',
    })
  }

  const body = safeParseJsonBody(req)
  const shareId = String(body?.shareId || '').trim()
  console.log('[share/support-botlist] shareId received:', shareId)

  if (!shareId || !shareId.startsWith('share_')) {
    console.log('[share/support-botlist] response status:', 400)
    return json(res, 400, { ok: false, error: 'Invalid shareId' })
  }

  const key = `sb50:${shareId}`
  let payload = null
  try {
    payload = await kvGetJson(key)
  } catch (e) {
    console.log('[share/support-botlist] KV error:', e?.message || String(e))
    console.log('[share/support-botlist] response status:', 500)
    return json(res, 500, { ok: false, error: 'Failed to read share snapshot' })
  }

  if (!payload) {
    console.log('[share/support-botlist] KV miss for key:', key)
    console.log('[share/support-botlist] response status:', 403)
    return json(res, 403, {
      ok: false,
      code: 'accessDenied',
      message: 'Invalid or expired share link',
    })
  }

  console.log('[share/support-botlist] KV hit for key:', key)
  console.log('[share/support-botlist] response status:', 200)
  return json(res, 200, { ok: true, data: payload })
}

async function handleShareTokenGet(req, res, prefix, token) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const expectedK = prefix === 'affrep' ? 'affrep' : null
  if (expectedK) {
    const stateless = readStatelessShareToken(expectedK, prefix, token || req.query?.token || '')
    if (stateless?.ok) {
      return json(res, 200, { ok: true, payload: stateless.payload })
    }
    if (stateless && !stateless.ok) {
      return json(res, 404, { ok: false, error: stateless.error || 'Not found' })
    }
  }

  if (!hasKvEnv()) {
    return json(res, 501, {
      ok: false,
      error: 'Share storage not configured (missing KV env).',
    })
  }

  const t = String(token || req.query?.token || '').trim()
  if (!t || !t.startsWith('share_')) {
    return json(res, 400, { ok: false, error: 'Invalid token' })
  }

  const key = `${prefix}:${t}`
  let payload = null
  try {
    payload = await kvGetJson(key)
  } catch (e) {
    console.error('[share] failed to read KV share token:', e?.message || String(e))
    return json(res, 503, { ok: false, error: 'Share storage unavailable' })
  }

  if (!payload) {
    return json(res, 404, { ok: false, error: 'Not found' })
  }

  return json(res, 200, { ok: true, payload })
}

async function handleSupportUserCheckTokenGet(req, res, token) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  if (!hasKvEnv()) {
    return json(res, 501, {
      ok: false,
      error: 'Share storage not configured (missing KV env).',
    })
  }

  const t = String(token || req.query?.token || '').trim()
  if (!t || !(t.startsWith('share_') || t.startsWith('share_local_'))) {
    return json(res, 400, { ok: false, error: 'Invalid token' })
  }

  if (t.startsWith('share_local_')) {
    return json(res, 404, { ok: false, error: 'Not found' })
  }

  const key = `suc:${t}`
  const payload = await kvGetJson(key)
  if (!payload) {
    return json(res, 404, { ok: false, error: 'Not found' })
  }
  return json(res, 200, { ok: true, payload })
}

async function handleSupportUserCheckTrack(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  if (!hasKvEnv()) {
    return json(res, 501, {
      ok: false,
      error: 'Share storage not configured (missing KV env).',
    })
  }

  const body = safeParseJsonBody(req)
  const token = String(body?.token || '').trim()
  if (!token || !token.startsWith('share_')) {
    return json(res, 400, { ok: false, error: 'Invalid token' })
  }

  const now = Date.now()
  const ip = String(pickHeader(req, 'x-forwarded-for') || '').split(',')[0].trim()
  const ua = String(pickHeader(req, 'user-agent') || '')
  const ref = String(pickHeader(req, 'referer') || '')

  const event = {
    t: now,
    token,
    userEmail: String(body?.userEmail || ''),
    userName: String(body?.userName || ''),
    userRole: String(body?.userRole || ''),
    event: String(body?.event || 'OPEN'),
    device: body?.device && typeof body.device === 'object' ? body.device : null,
    ip: ip || null,
    ua: ua || null,
    ref: ref || null,
  }

  const key = `suc_events:${token}`
  await kvLpushJson(key, event)
  await kvExpire(key, 60 * 60 * 24 * 30)

  return json(res, 200, { ok: true })
}

async function handleCreateShare(req, res, expectedK, prefix, ttlSeconds) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const body = safeParseJsonBody(req)
  const payload = body?.payload

  if (!payload || typeof payload !== 'object') {
    return json(res, 400, { ok: false, error: 'Missing payload' })
  }

  if (payload.k !== expectedK) {
    return json(res, 400, { ok: false, error: 'Invalid payload key' })
  }

  if (prefix === 'affrep') {
    const token = makeStatelessShareToken(expectedK, prefix, payload, ttlSeconds)
    if (token) return json(res, 200, { ok: true, token })
  }

  if (!hasKvEnv()) {
    return json(res, 501, {
      ok: false,
      error: 'Share storage not configured (missing KV env).',
    })
  }

  const token = `share_${crypto.randomBytes(12).toString('hex')}`
  const key = `${prefix}:${token}`
  try {
    await kvSetJson(key, payload, ttlSeconds)
    // Also store a small mapping for fast short-link resolution.
    await kvSetJson(`smap:${token}`, { p: prefix, k: expectedK, t: Date.now() }, ttlSeconds)
  } catch (e) {
    console.error('[share] failed to write KV share token:', e?.message || String(e))
    return json(res, 503, { ok: false, error: 'Share storage unavailable' })
  }
  return json(res, 200, { ok: true, token })
}

async function routeShare(req, res, parts) {
  const head = parts[0] || ''

  if (head === 'support-botlist') {
    if (parts.length === 1) return handleShareSupportBotlistPost(req, res)
    if (parts.length === 2) return handleShareTokenGet(req, res, 'sb50', getTokenFrom(parts, 1))
  }

  if (head === 'support-user-check') {
    if (parts.length === 2 && parts[1] !== 'track') return handleSupportUserCheckTokenGet(req, res, getTokenFrom(parts, 1))
    if (parts.length === 2 && parts[1] === 'track') return handleSupportUserCheckTrack(req, res)
    if (parts.length === 3 && parts[1] === 'track') return handleSupportUserCheckTrack(req, res)
  }

  if (head === 'flows' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'flows', getTokenFrom(parts, 1))
  }

  if (head === 'affiliate-analysis' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'affrep', getTokenFrom(parts, 1))
  }

  if (head === 'affiliate-reports' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'affrep', getTokenFrom(parts, 1))
  }

  if (head === 'marketing-plan' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'mplan', getTokenFrom(parts, 1))
  }

  if (head === 'project-board' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'pboard', getTokenFrom(parts, 1))
  }

  if (head === 'pelican-network-integration' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'plcn', getTokenFrom(parts, 1))
  }

  if (head === 'execution' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'exec', getTokenFrom(parts, 1))
  }

  if (head === 'trustpilot-guide' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'tpguide', getTokenFrom(parts, 1))
  }

  if (head === 'commission-validation-rules' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'comval', getTokenFrom(parts, 1))
  }

  if (head === 'profitable-ranking' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'prank', getTokenFrom(parts, 1))
  }

  if (head === 'weekly-map' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'wmap', getTokenFrom(parts, 1))
  }

  if (head === 'weekly-execution-history' && parts.length === 2) {
    return handleShareTokenGet(req, res, 'wmap', getTokenFrom(parts, 1))
  }

  if (head === 'create-support-user-check') {
    return handleCreateShare(req, res, 'suc', 'suc', 60 * 60 * 24 * 30)
  }

  if (head === 'create-support-botlist') {
    return handleCreateShare(req, res, 'sb50', 'sb50', 60 * 60 * 24 * 30)
  }

  if (head === 'create-flows') {
    return handleCreateShare(req, res, 'flows', 'flows', 60 * 60 * 24 * 90)
  }

  if (head === 'create-affiliate-analysis') {
    return handleCreateShare(req, res, 'affrep', 'affrep', 60 * 60 * 24 * 90)
  }

  if (head === 'create-affiliate-reports') {
    return handleCreateShare(req, res, 'affrep', 'affrep', 60 * 60 * 24 * 90)
  }

  if (head === 'create-marketing-plan') {
    return handleCreateShare(req, res, 'mplan', 'mplan', 60 * 60 * 24 * 90)
  }

  if (head === 'create-project-board') {
    return handleCreateShare(req, res, 'pboard', 'pboard', 60 * 60 * 24 * 90)
  }

  if (head === 'create-pelican-network-integration') {
    return handleCreateShare(req, res, 'pelican', 'plcn', 60 * 60 * 24 * 90)
  }

  if (head === 'create-execution') {
    return handleCreateShare(req, res, 'exec', 'exec', 60 * 60 * 24 * 90)
  }

  if (head === 'create-trustpilot-guide') {
    return handleCreateShare(req, res, 'tpguide', 'tpguide', 60 * 60 * 24 * 90)
  }

  if (head === 'create-commission-validation-rules') {
    return handleCreateShare(req, res, 'comval', 'comval', 60 * 60 * 24 * 90)
  }

  if (head === 'create-profitable-ranking') {
    return handleCreateShare(req, res, 'profitable-ranking', 'prank', 60 * 60 * 24 * 90)
  }

  if (head === 'create-weekly-map') {
    return handleCreateShare(req, res, 'wmap', 'wmap', 60 * 60 * 24 * 30)
  }

  return json(res, 404, { ok: false, error: 'Not found' })
}

module.exports = {
  routeShare,
}
