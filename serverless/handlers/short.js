const { json } = require('./_http')
const { hasKvEnv, kvGetJson } = require('./kv')

function redirect(res, status, location) {
  res.statusCode = status
  res.setHeader('Location', location)
  res.setHeader('Cache-Control', 'no-store')
  res.end('')
}

async function tryGetPayload(prefix, token) {
  try {
    const payload = await kvGetJson(`${prefix}:${token}`)
    return payload || null
  } catch {
    return null
  }
}

async function resolveShare(req, token) {
  // Prefer mapping if present.
  try {
    const mapping = await kvGetJson(`smap:${token}`)
    const prefix = mapping?.p
    if (prefix) {
      const payload = await tryGetPayload(prefix, token)
      if (payload) return { prefix, payload }
    }
  } catch {
    // ignore
  }

  // Backward-compatible fallback: brute-force known prefixes.
    const prefixes = [
      'flows',
      'affrep',
      'mplan',
      'pboard',
      'exec',
      'tpguide',
      'prank',
      'sb50',
      'suc',
      'wmap',
    ]
  for (const prefix of prefixes) {
    const payload = await tryGetPayload(prefix, token)
    if (payload) return { prefix, payload }
  }

  return null
}

function destinationFor(prefix, token, payload) {
  if (prefix === 'flows') {
    const initial = String(payload?.initialFlow || 'retention')
    return `/share/flows/${encodeURIComponent(token)}?flow=${encodeURIComponent(initial)}`
  }
  if (prefix === 'affrep') return `/share/affiliate-reports/${encodeURIComponent(token)}`
  if (prefix === 'mplan') return `/share/marketing-plan/${encodeURIComponent(token)}`
  if (prefix === 'pboard') return `/share/project-board/${encodeURIComponent(token)}`
  if (prefix === 'exec') return `/share/execution/${encodeURIComponent(token)}`
    if (prefix === 'tpguide') return `/share/trustpilot-guide/${encodeURIComponent(token)}`
  if (prefix === 'prank') return `/share/profitable-ranking/${encodeURIComponent(token)}`
  if (prefix === 'sb50') return `/share/support-botlist/${encodeURIComponent(token)}`
  if (prefix === 'suc') return `/share/support-user-check/${encodeURIComponent(token)}`
  if (prefix === 'wmap') {
    const view = String(payload?._view || '').trim()
    if (view === 'h') return `/share/weekly-execution-history/${encodeURIComponent(token)}`
    return `/share/weekly-map/${encodeURIComponent(token)}`
  }
  return null
}

async function routeShort(req, res, parts) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const token = String(parts?.[0] || '').trim()
  const view = String(parts?.[1] || '').trim()
  if (!token || !token.startsWith('share_')) {
    return json(res, 400, { ok: false, error: 'Invalid token' })
  }

  if (!hasKvEnv()) {
    return json(res, 501, { ok: false, error: 'Share storage not configured (missing KV env).' })
  }

  const resolved = await resolveShare(req, token)
  if (!resolved) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end('Not found')
    return
  }

  const normalizedView = view === 'h' || view === 'history' || view === 'weekly-execution-history' ? 'h' : ''
  const dest = destinationFor(resolved.prefix, token, {
    ...(resolved.payload || null),
    _view: normalizedView,
  })
  if (!dest) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end('Not found')
    return
  }

  return redirect(res, 302, dest)
}

module.exports = {
  routeShort,
}
