const crypto = require('crypto')
const { hasKvEnv, kvGetJson, kvSetJson } = require('./_kv')

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function safeParseJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (!req.body || typeof req.body !== 'string') return null
  try {
    return JSON.parse(req.body)
  } catch {
    return null
  }
}

module.exports = async (req, res) => {
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

  // MODE A: Validate + fetch a shared snapshot by shareId (used by public share pages)
  if (body?.shareId != null) {
    const shareId = String(body.shareId || '').trim()
    console.log('[share/support-botlist] shareId received:', shareId)

    if (!shareId || !shareId.startsWith('share_')) {
      console.log('[share/support-botlist] invalid shareId')
      return json(res, 400, { ok: false, error: 'Invalid shareId' })
    }

    const key = `sb50:${shareId}`
    let payload = null
    try {
      payload = await kvGetJson(key)
    } catch (e) {
      console.log('[share/support-botlist] KV error:', e?.message || String(e))
      return json(res, 500, { ok: false, error: 'Failed to read share snapshot' })
    }

    if (!payload) {
      console.log('[share/support-botlist] KV miss for key:', key)
      return json(res, 403, {
        ok: false,
        code: 'accessDenied',
        message: 'Invalid or expired share link',
      })
    }

    console.log('[share/support-botlist] KV hit for key:', key)
    return json(res, 200, { ok: true, data: payload })
  }

  // MODE B: Create a shared snapshot by payload (used by authenticated dashboard)
  const payload = body?.payload

  if (!payload || typeof payload !== 'object') {
    return json(res, 400, { ok: false, error: 'Missing payload' })
  }

  // Basic shape validation (keep permissive for forward compatibility)
  if (payload.k !== 'sb50') {
    return json(res, 400, { ok: false, error: 'Invalid payload key' })
  }

  const token = `share_${crypto.randomBytes(12).toString('hex')}`
  const key = `sb50:${token}`

  // 30 days TTL
  await kvSetJson(key, payload, 60 * 60 * 24 * 30)
  console.log('[share/support-botlist] created token:', token)

  return json(res, 200, { ok: true, token })
}
