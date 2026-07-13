const { routeAnalytics } = require('./handlers/analytics')
const { routeAuth } = require('./handlers/auth')
const { routeQlik } = require('./handlers/qlik')
const { routeEmail } = require('./handlers/email')
const { routeSms } = require('./handlers/sms')
const { routeGmail } = require('./handlers/gmail')
const { routeSlack } = require('./handlers/slack')
const { routeShare } = require('./handlers/share')
const { routeShort } = require('./handlers/short')
const { routeAcuity } = require('./handlers/acuity')
const { routeBrokeree } = require('./handlers/brokeree')
const { routeReports } = require('./handlers/reports')
const { routeYpf } = require('./handlers/ypf')

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
  if (raw == null || raw === '') {
    // Fallback: parse from URL pathname.
    try {
      const u = new URL(req.url, 'http://localhost')
      const pathname = String(u.pathname || '')
      if (!pathname.startsWith('/api')) return []
      const rest = pathname.replace(/^\/api\/?/, '')
      return rest ? rest.split('/').filter(Boolean) : []
    } catch {
      return []
    }
  }

  const s = String(raw)
  // When coming from a rewrite, :path* is a slash-delimited string.
  return s.includes('/') ? s.split('/').filter(Boolean) : [s]
}

async function routeApi(req, res) {
  const parts = getPathParts(req)
  const scope = parts[0] || ''

  if (scope === 'auth') {
    return routeAuth(req, res, parts.slice(1))
  }

  if (scope === 'analytics') {
    return routeAnalytics(req, res, parts.slice(1))
  }

  if (scope === 'qlik') {
    return routeQlik(req, res, parts.slice(1))
  }

  if (scope === 'email') {
    return routeEmail(req, res, parts.slice(1))
  }

  if (scope === 'sms') {
    return routeSms(req, res, parts.slice(1))
  }

  if (scope === 'gmail') {
    return routeGmail(req, res, parts.slice(1))
  }

  if (scope === 'slack') {
    return routeSlack(req, res, parts.slice(1))
  }

  if (scope === 'share') {
    return routeShare(req, res, parts.slice(1))
  }

  if (scope === 's') {
    return routeShort(req, res, parts.slice(1))
  }

  if (scope === 'acuity') {
    return routeAcuity(req, res, parts.slice(1))
  }

  if (scope === 'brokeree') {
    return routeBrokeree(req, res, parts.slice(1))
  }

  if (scope === 'reports') {
    return routeReports(req, res, parts.slice(1))
  }

  if (scope === 'ypf') {
    return routeYpf(req, res, parts.slice(1))
  }

  return json(res, 404, { ok: false, error: 'Not found' })
}

module.exports = {
  routeApi,
}
