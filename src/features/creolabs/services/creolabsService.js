import { fetchTextCached, withReportsVersion } from '../../../lib/fetchCache'

const CREOLABS_INDEX_URL = '/creolabs_index.json'
const CREOLABS_CLIENTS_TABLE_URL = '/creolabs_clients_table.json'
const CREOLABS_AFFILIATE_MONTH_URL = '/creolabs_affiliate_month.json'
const PRIME_CLIENTS_RANKING_TABLE_URL = '/prime_clients_ranking_table.json'
const PRIME_EMAIL_INDEX_URL = '/prime_email_index.json'
const TRADERS_RANKING_REWARDS_TABLE_URL = '/traders_ranking_rewards_table.json'
const CREOLABS_QLIK_CLIENT_MONTHS_URL = '/api/qlik/creolabs/client-months'
const CREOLABS_QLIK_AFFILIATE_MONTH_URL = '/api/qlik/creolabs/affiliate-month'
const CREOLABS_QLIK_KPIS_URL = '/api/qlik/creolabs/kpis'
const CREOLABS_QLIK_ANALYTICS_URL = '/api/qlik/creolabs/analytics'
const CREOLABS_QLIK_CLIENT_SCORES_URL = '/api/qlik/creolabs/client-scores'

export function isQlikApiUnavailableError(err) {
  if (!err) return false
  return err.isQlikUnavailable === true
}

function qlikErrorSummary(err) {
  if (!err) return 'unknown error'
  const status = Number(err?.status)
  if (Number.isFinite(status)) return `HTTP ${status}`
  const msg = String(err?.message || '').trim()
  return msg || 'unknown error'
}

export function logCreolabsQlikFallbackUsed(context, err) {
  console.info(`[Creolabs][Qlik] ${context}: local fallback enabled (${qlikErrorSummary(err)})`)
}

export function logCreolabsQlikFallbackBlocked(context, err) {
  console.warn(
    `[Creolabs][Qlik] ${context}: local fallback blocked because API is reachable (${qlikErrorSummary(err)})`,
    err
  )
}

async function loadCreolabsQlikResource(url, { force = false, staleKeys = [] } = {}) {
  const fetchPayload = async (useBust) => {
    const bust = useBust ? '?bust=1' : ''
    let res
    try {
      res = await fetch(`${url}${bust}`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      })
    } catch (cause) {
      const err = new Error('Qlik API unavailable (network error)')
      err.cause = cause
      err.isQlikUnavailable = true
      throw err
    }

    if (!res.ok) {
      const err = new Error(`Qlik API failed (${res.status})`)
      err.status = res.status
      // Strict mode: HTTP responses are considered API reachable, so no fallback.
      err.isQlikUnavailable = false
      throw err
    }

    const payload = await res.json()
    if (!payload?.ok || !payload?.data || typeof payload.data !== 'object') {
      throw new Error('Invalid Qlik API payload')
    }
    return payload
  }

  const looksStale = (payload) => {
    const data = payload?.data
    if (!data || typeof data !== 'object') return false
    const hasNullArrays = staleKeys.some((key) => data[key] == null)
    const fetched = Number(data.totalFetched)
    return hasNullArrays && Number.isFinite(fetched) && fetched > 0
  }

  const payload = await fetchPayload(Boolean(force))
  if (!force && looksStale(payload)) {
    console.info('[Creolabs][Qlik] stale cache payload detected; forcing one bust reload')
    return await fetchPayload(true)
  }

  return payload
}

export async function loadCreolabsQlikClientMonths({ force = false } = {}) {
  return loadCreolabsQlikResource(CREOLABS_QLIK_CLIENT_MONTHS_URL, {
    force,
    staleKeys: ['clientMonths'],
  })
}

export async function loadCreolabsQlikAffiliateMonth({ force = false } = {}) {
  return loadCreolabsQlikResource(CREOLABS_QLIK_AFFILIATE_MONTH_URL, {
    force,
    staleKeys: ['affiliateMonth'],
  })
}

export async function loadCreolabsQlikKpis({ brand = '', period = '', force = false } = {}) {
  const params = new globalThis.URLSearchParams()
  if (brand) params.set('brand', String(brand))
  if (period) params.set('period', String(period))
  if (force) params.set('bust', '1')

  const qs = params.toString()
  const url = `${CREOLABS_QLIK_KPIS_URL}${qs ? `?${qs}` : ''}`

  let res
  try {
    res = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch (cause) {
    const err = new Error('Qlik KPI API unavailable (network error)')
    err.cause = cause
    err.isQlikUnavailable = true
    throw err
  }

  if (!res.ok) {
    const err = new Error(`Qlik KPI API failed (${res.status})`)
    err.status = res.status
    err.isQlikUnavailable = false
    throw err
  }

  const payload = await res.json()
  if (!payload?.ok || !payload?.data || typeof payload.data !== 'object') {
    throw new Error('Invalid /api/qlik/creolabs/kpis payload')
  }
  return payload
}

export async function loadCreolabsQlikAnalytics({
  brand = '',
  year = '',
  top = 20,
  force = false,
} = {}) {
  const params = new globalThis.URLSearchParams()
  if (brand) params.set('brand', String(brand))
  if (year) params.set('year', String(year))
  if (Number.isFinite(Number(top)))
    params.set('top', String(Math.max(5, Math.min(200, Number(top)))))
  if (force) params.set('bust', '1')

  const qs = params.toString()
  const url = `${CREOLABS_QLIK_ANALYTICS_URL}${qs ? `?${qs}` : ''}`

  let res
  try {
    res = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch (cause) {
    const err = new Error('Qlik analytics API unavailable (network error)')
    err.cause = cause
    err.isQlikUnavailable = true
    throw err
  }

  if (!res.ok) {
    const err = new Error(`Qlik analytics API failed (${res.status})`)
    err.status = res.status
    err.isQlikUnavailable = false
    throw err
  }

  const payload = await res.json()
  if (!payload?.ok || !payload?.data || typeof payload.data !== 'object') {
    throw new Error('Invalid /api/qlik/creolabs/analytics payload')
  }
  return payload
}

export async function loadCreolabsQlikClientScores({ brand = '', force = false } = {}) {
  const params = new globalThis.URLSearchParams()
  if (brand) params.set('brand', String(brand))
  if (force) params.set('bust', '1')

  const qs = params.toString()
  const url = `${CREOLABS_QLIK_CLIENT_SCORES_URL}${qs ? `?${qs}` : ''}`

  let res
  try {
    res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
  } catch (cause) {
    const err = new Error('Qlik client-scores API unavailable (network error)')
    err.cause = cause
    err.isQlikUnavailable = true
    throw err
  }

  if (!res.ok) {
    const err = new Error(`Qlik client-scores API failed (${res.status})`)
    err.status = res.status
    err.isQlikUnavailable = false
    throw err
  }

  const payload = await res.json()
  if (!payload?.ok || !payload?.data || typeof payload.data !== 'object') {
    throw new Error('Invalid /api/qlik/creolabs/client-scores payload')
  }
  return payload
}

export async function loadCreolabsIndex({ force = false } = {}) {
  const url = withReportsVersion(CREOLABS_INDEX_URL)
  const text = await fetchTextCached(url, {
    force,
    headers: {
      Accept: 'application/json',
    },
  })

  const trimmed = String(text || '').trimStart()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    throw new Error(
      'creolabs_index.json is missing (server returned HTML). If you are in dev, restart Vite so it can serve newly generated public files.'
    )
  }
  try {
    return JSON.parse(text)
  } catch (e) {
    if (!force) return await loadCreolabsIndex({ force: true })
    const err = new Error('Invalid creolabs_index.json')
    err.cause = e
    throw err
  }
}

export async function loadCreolabsClientsTable({ force = false } = {}) {
  const url = withReportsVersion(CREOLABS_CLIENTS_TABLE_URL)
  const text = await fetchTextCached(url, {
    force,
    headers: {
      Accept: 'application/json',
    },
  })

  const trimmed = String(text || '').trimStart()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    throw new Error(
      'creolabs_clients_table.json is missing (server returned HTML). If you are in dev, restart Vite so it can serve newly generated public files.'
    )
  }

  try {
    return JSON.parse(text)
  } catch (e) {
    if (!force) return await loadCreolabsClientsTable({ force: true })
    const err = new Error('Invalid creolabs_clients_table.json')
    err.cause = e
    throw err
  }
}

export async function loadCreolabsAffiliateMonthTable({ force = false } = {}) {
  const url = withReportsVersion(CREOLABS_AFFILIATE_MONTH_URL)
  const text = await fetchTextCached(url, {
    force,
    headers: {
      Accept: 'application/json',
    },
  })

  const trimmed = String(text || '').trimStart()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    throw new Error(
      'creolabs_affiliate_month.json is missing (server returned HTML). If you are in dev, restart Vite so it can serve newly generated public files.'
    )
  }

  try {
    return JSON.parse(text)
  } catch (e) {
    if (!force) return await loadCreolabsAffiliateMonthTable({ force: true })
    const err = new Error('Invalid creolabs_affiliate_month.json')
    err.cause = e
    throw err
  }
}

export async function loadTradersRankingRewardsTable({ force = false } = {}) {
  const url = withReportsVersion(TRADERS_RANKING_REWARDS_TABLE_URL)
  const text = await fetchTextCached(url, {
    force,
    headers: {
      Accept: 'application/json',
    },
  })

  const trimmed = String(text || '').trimStart()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    throw new Error(
      'traders_ranking_rewards_table.json is missing (server returned HTML). If you are in dev, restart Vite so it can serve newly generated public files.'
    )
  }

  try {
    return JSON.parse(text)
  } catch (e) {
    if (!force) return await loadTradersRankingRewardsTable({ force: true })
    const err = new Error('Invalid traders_ranking_rewards_table.json')
    err.cause = e
    throw err
  }
}

export async function loadPrimeClientsRankingTable({ force = false } = {}) {
  const url = withReportsVersion(PRIME_CLIENTS_RANKING_TABLE_URL)
  const text = await fetchTextCached(url, {
    force,
    headers: {
      Accept: 'application/json',
    },
  })

  const trimmed = String(text || '').trimStart()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    throw new Error(
      'prime_clients_ranking_table.json is missing (server returned HTML). If you are in dev, restart Vite so it can serve newly generated public files.'
    )
  }

  try {
    return JSON.parse(text)
  } catch (e) {
    if (!force) return await loadPrimeClientsRankingTable({ force: true })
    const err = new Error('Invalid prime_clients_ranking_table.json')
    err.cause = e
    throw err
  }
}

export async function loadPrimeEmailIndex({ force = false } = {}) {
  const url = withReportsVersion(PRIME_EMAIL_INDEX_URL)
  const text = await fetchTextCached(url, { force, headers: { Accept: 'application/json' } })
  const trimmed = String(text || '').trimStart()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
