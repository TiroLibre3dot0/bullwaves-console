function json(res, status, payload, extraHeaders) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (extraHeaders && typeof extraHeaders === 'object') {
    for (const [k, v] of Object.entries(extraHeaders)) {
      res.setHeader(k, v)
    }
  }
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

module.exports = {
  json,
  pickHeader,
  safeParseJsonBody,
}
