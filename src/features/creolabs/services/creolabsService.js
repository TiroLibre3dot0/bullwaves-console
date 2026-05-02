import { fetchTextCached, withReportsVersion } from '../../../lib/fetchCache'

const CREOLABS_INDEX_URL = '/creolabs_index.json'
const CREOLABS_CLIENTS_TABLE_URL = '/creolabs_clients_table.json'
const CREOLABS_AFFILIATE_MONTH_URL = '/creolabs_affiliate_month.json'
const TRADERS_RANKING_REWARDS_TABLE_URL = '/traders_ranking_rewards_table.json'
const CREOLABS_QLIK_CLIENTS_URL = '/api/qlik/creolabs/clients'

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

export async function loadCreolabsQlikClients({ force = false } = {}) {
  const fetchPayload = async (useBust) => {
    const bust = useBust ? '?bust=1' : ''
    let res
    try {
      res = await fetch(`${CREOLABS_QLIK_CLIENTS_URL}${bust}`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      })
    } catch (cause) {
      const err = new Error('Qlik clients API unavailable (network error)')
      err.cause = cause
      err.isQlikUnavailable = true
      throw err
    }

    if (!res.ok) {
      const err = new Error(`Qlik clients API failed (${res.status})`)
      err.status = res.status
      // Strict mode: HTTP responses are considered API reachable, so no fallback.
      err.isQlikUnavailable = false
      throw err
    }

    const payload = await res.json()
    if (!payload?.ok || !payload?.data || typeof payload.data !== 'object') {
      throw new Error('Invalid /api/qlik/creolabs/clients payload')
    }
    return payload
  }

  const looksStale = (payload) => {
    const data = payload?.data
    if (!data || typeof data !== 'object') return false
    const hasNullMonthArrays = data.clientMonths == null || data.affiliateMonth == null
    const fetched = Number(data.totalFetched)
    return hasNullMonthArrays && Number.isFinite(fetched) && fetched > 0
  }

  const payload = await fetchPayload(Boolean(force))
  if (!force && looksStale(payload)) {
    console.info('[Creolabs][Qlik] stale cache payload detected; forcing one bust reload')
    return await fetchPayload(true)
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
