const { routeAnalytics } = require('./handlers/analytics')
const { routeShare } = require('./handlers/share')

function json(res, status, payload, headers) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (headers && typeof headers === 'object') {
    for (const [k, v] of Object.entries(headers)) {
      res.setHeader(k, v)
    }
  }
  res.end(JSON.stringify(payload))
}

function getPathParts(req) {
  const raw = req?.query?.path
  if (Array.isArray(raw)) return raw.map((p) => String(p))
  if (raw == null || raw === '') return []
  return [String(raw)]
}

async function routeApi(req, res) {
  const parts = getPathParts(req)
  const scope = parts[0] || ''

  if (scope === 'analytics') {
    return routeAnalytics(req, res, parts.slice(1))
  }

  if (scope === 'share') {
    return routeShare(req, res, parts.slice(1))
  }

  return json(res, 404, { ok: false, error: 'Not found' })
}

module.exports = {
  routeApi,
}
