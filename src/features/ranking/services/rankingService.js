import { fetchTextCached, withReportsVersion } from '../../../lib/fetchCache'

const RANKINGS_INDEX_URL = '/rankings_index.json'
const RANKINGS_USERS_TABLE_URL = '/rankings_users_table.json'
const AFFILIATE_INDEX_URL = '/affiliate_index.json'

export async function loadRankingsIndex({ force = false } = {}) {
  const url = withReportsVersion(RANKINGS_INDEX_URL)
  const text = await fetchTextCached(url, { force })
  try {
    return JSON.parse(text)
  } catch (e) {
    const err = new Error('Invalid rankings_index.json')
    err.cause = e
    throw err
  }
}

export async function loadRankingsUsersTable({ force = false } = {}) {
  const url = withReportsVersion(RANKINGS_USERS_TABLE_URL)
  const text = await fetchTextCached(url, { force })
  try {
    return JSON.parse(text)
  } catch (e) {
    const err = new Error('Invalid rankings_users_table.json')
    err.cause = e
    throw err
  }
}

export async function loadAffiliateIndexById({ force = false } = {}) {
  const url = withReportsVersion(AFFILIATE_INDEX_URL)
  const text = await fetchTextCached(url, { force })
  try {
    const json = JSON.parse(text)
    const byId = json && typeof json === 'object' ? json.byId : null
    if (!byId || typeof byId !== 'object') return null
    return byId
  } catch {
    return null
  }
}
