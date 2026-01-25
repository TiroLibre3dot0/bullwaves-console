const { json } = require('./_http')

const PLAUSIBLE_API = 'https://plausible.io/api/v2/query'

function env(name) {
  const v = process.env[name]
  return v == null ? '' : String(v).trim()
}

function getConfig() {
  const apiKey = env('PLAUSIBLE_STATS_API_KEY') || env('PLAUSIBLE_API_KEY')
  const siteId = env('PLAUSIBLE_SITE_ID') || env('PLAUSIBLE_DOMAIN')
  return { apiKey, siteId }
}

function normalizeRange(raw) {
  const r = String(raw || '').trim() || '7d'
  const allowed = new Set(['day', '7d', '28d', '30d', '91d', 'month', '6mo', '12mo', 'year', 'all'])
  return allowed.has(r) ? r : '7d'
}

async function plausibleQuery(apiKey, query) {
  const resp = await fetch(PLAUSIBLE_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  })

  const data = await resp.json().catch(() => null)
  if (!resp.ok) {
    const msg = data?.error || data?.message || `Plausible error (${resp.status})`
    const e = new Error(msg)
    e.status = resp.status
    e.data = data
    throw e
  }

  return data
}

function mapRows(result, dimLabel) {
  const rows = Array.isArray(result?.results) ? result.results : []
  return rows
    .map((r) => {
      const dim = Array.isArray(r?.dimensions) ? r.dimensions[0] : null
      const metric = Array.isArray(r?.metrics) ? r.metrics[0] : null
      return {
        [dimLabel]: dim == null ? '' : String(dim),
        events: typeof metric === 'number' ? metric : Number(metric || 0) || 0,
      }
    })
    .filter((r) => r.events > 0)
}

async function handleHealth(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const { apiKey, siteId } = getConfig()

  return json(
    res,
    200,
    {
      ok: true,
      configured: Boolean(apiKey && siteId),
      missing: {
        PLAUSIBLE_STATS_API_KEY: !apiKey,
        PLAUSIBLE_SITE_ID: !siteId,
      },
    },
    { 'Cache-Control': 'no-store' }
  )
}

async function handlePublicShareOpen(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { ok: false, error: 'Method Not Allowed' }, { 'Cache-Control': 'no-store' })
  }

  const { apiKey, siteId } = getConfig()
  if (!apiKey || !siteId) {
    return json(
      res,
      501,
      {
        ok: false,
        error: 'Analytics API not configured. Set PLAUSIBLE_STATS_API_KEY and PLAUSIBLE_SITE_ID.',
        missing: {
          PLAUSIBLE_STATS_API_KEY: !apiKey,
          PLAUSIBLE_SITE_ID: !siteId,
        },
      },
      { 'Cache-Control': 'no-store' }
    )
  }

  const range = normalizeRange(req.query?.range)

  const base = {
    site_id: siteId,
    date_range: range,
    metrics: ['events'],
    filters: [['is', 'event:goal', ['public_share_open']]],
  }

  try {
    const total = await plausibleQuery(apiKey, base)

    const byKind = await plausibleQuery(apiKey, {
      ...base,
      dimensions: ['event:props:kind'],
      order_by: [['events', 'desc']],
      pagination: { limit: 50, offset: 0 },
    })

    const byPage = await plausibleQuery(apiKey, {
      ...base,
      dimensions: ['event:page'],
      order_by: [['events', 'desc']],
      pagination: { limit: 50, offset: 0 },
    })

    const byDevice = await plausibleQuery(apiKey, {
      ...base,
      dimensions: ['visit:device'],
      order_by: [['events', 'desc']],
      pagination: { limit: 20, offset: 0 },
    })

    const byReferrer = await plausibleQuery(apiKey, {
      ...base,
      dimensions: ['visit:referrer'],
      order_by: [['events', 'desc']],
      pagination: { limit: 20, offset: 0 },
    })

    const totalEvents =
      Array.isArray(total?.results) && total.results[0]?.metrics
        ? Number(total.results[0].metrics[0] || 0) || 0
        : 0

    return json(
      res,
      200,
      {
        ok: true,
        range,
        siteId,
        totalEvents,
        byKind: mapRows(byKind, 'kind'),
        byPage: mapRows(byPage, 'page'),
        byDevice: mapRows(byDevice, 'device'),
        byReferrer: mapRows(byReferrer, 'referrer'),
      },
      { 'Cache-Control': 'no-store' }
    )
  } catch (e) {
    return json(res, 502, { ok: false, error: e?.message || 'Failed to query Plausible' }, { 'Cache-Control': 'no-store' })
  }
}

async function routeAnalytics(req, res, parts) {
  const head = parts[0] || ''
  if (head === 'health') return handleHealth(req, res)
  if (head === 'public-share-open') return handlePublicShareOpen(req, res)
  return json(res, 404, { ok: false, error: 'Not found' }, { 'Cache-Control': 'no-store' })
}

module.exports = {
  routeAnalytics,
}
