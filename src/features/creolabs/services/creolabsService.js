import { fetchTextCached, withReportsVersion } from '../../../lib/fetchCache'

const CREOLABS_INDEX_URL = '/creolabs_index.json'
const CREOLABS_CLIENTS_TABLE_URL = '/creolabs_clients_table.json'
const CREOLABS_AFFILIATE_MONTH_URL = '/creolabs_affiliate_month.json'
const TRADERS_RANKING_REWARDS_TABLE_URL = '/traders_ranking_rewards_table.json'

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
