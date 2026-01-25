const { hasKvEnv, kvGetJson } = require('../support-botlist/_kv')

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

module.exports = async (req, res) => {
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

  const token = String(req.query?.token || '').trim()
  if (!token || !(token.startsWith('share_') || token.startsWith('share_local_'))) {
    return json(res, 400, { ok: false, error: 'Invalid token' })
  }

  // share_local_* is handled client-side (localStorage); server only supports share_*.
  if (token.startsWith('share_local_')) {
    return json(res, 404, { ok: false, error: 'Not found' })
  }

  const key = `suc:${token}`
  const payload = await kvGetJson(key)

  if (!payload) {
    return json(res, 404, { ok: false, error: 'Not found' })
  }

  return json(res, 200, { ok: true, payload })
}
