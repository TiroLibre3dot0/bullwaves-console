const { hasKvEnv, kvExpire, kvLpushJson } = require('../../support-botlist/_kv')

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

function pickHeader(req, name) {
  const v = req.headers?.[name]
  if (Array.isArray(v)) return v[0]
  return v
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

  // Keep events for 30 days
  await kvLpushJson(key, event)
  await kvExpire(key, 60 * 60 * 24 * 30)

  return json(res, 200, { ok: true })
}
