/* global URLSearchParams */

import { fetchTextCached, withReportsVersion } from '../../../lib/fetchCache'

const CELLX_AFF_MONTH_URL = '/cellx_affiliate_month.json'
const CELLXPERT_PERFORMANCE_API = '/api/cellxpert/performance'

function defaultDateRange() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return {
    from: '2024-01-01',
    to: `${now.getFullYear()}-${month}-${day}`,
  }
}

async function loadCellxAffiliateMonthTableFromApi() {
  const { from, to } = defaultDateRange()
  const params = new URLSearchParams({
    from,
    to,
  })
  const response = await fetch(`${CELLXPERT_PERFORMANCE_API}?${params.toString()}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Cellxpert live performance failed (${response.status})`)
  }
  const rows = Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : []
  return {
    generatedAt: payload?.fetchedAt || new Date().toISOString(),
    source: payload?.source || 'cellxpert-admin-api',
    live: true,
    rows,
  }
}

export async function loadCellxAffiliateMonthTable({ force = false } = {}) {
  try {
    return await loadCellxAffiliateMonthTableFromApi()
  } catch (apiError) {
    if (force) console.warn('Cellxpert live API unavailable, falling back to static report artifact', apiError)
  }

  const url = withReportsVersion(CELLX_AFF_MONTH_URL)
  const text = await fetchTextCached(url, { force })
  try {
    const json = JSON.parse(text)
    const rows = Array.isArray(json?.rows) ? json.rows : []
    return { ...json, live: false, rows }
  } catch (e) {
    const err = new Error('Invalid cellx_affiliate_month.json')
    err.cause = e
    throw err
  }
}
