const { hasKvEnv, kvGetJson } = require('./_kv')

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
