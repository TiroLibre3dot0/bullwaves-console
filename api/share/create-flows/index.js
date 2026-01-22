const crypto = require('crypto')
const { hasKvEnv, kvSetJson } = require('../support-botlist/_kv')

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
  const payload = body?.payload

  if (!payload || typeof payload !== 'object') {
    return json(res, 400, { ok: false, error: 'Missing payload' })
  }

  if (payload.k !== 'flows') {
    return json(res, 400, { ok: false, error: 'Invalid payload key' })
  }

  const token = `share_${crypto.randomBytes(12).toString('hex')}`
  const key = `flows:${token}`

  // 90 days TTL
  await kvSetJson(key, payload, 60 * 60 * 24 * 90)

  return json(res, 200, { ok: true, token })
}
