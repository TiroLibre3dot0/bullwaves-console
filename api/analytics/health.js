function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function env(name) {
  const v = process.env[name]
  return v == null ? '' : String(v).trim()
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const apiKey = env('PLAUSIBLE_STATS_API_KEY') || env('PLAUSIBLE_API_KEY')
  const siteId = env('PLAUSIBLE_SITE_ID') || env('PLAUSIBLE_DOMAIN')

  return json(res, 200, {
    ok: true,
    configured: Boolean(apiKey && siteId),
    missing: {
      PLAUSIBLE_STATS_API_KEY: !apiKey,
      PLAUSIBLE_SITE_ID: !siteId,
    },
  })
}
