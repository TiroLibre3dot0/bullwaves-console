import { fetchTextCached, withReportsVersion } from '../../../lib/fetchCache'

const CELLX_AFF_MONTH_URL = '/cellx_affiliate_month.json'

export async function loadCellxAffiliateMonthTable({ force = false } = {}) {
  const url = withReportsVersion(CELLX_AFF_MONTH_URL)
  const text = await fetchTextCached(url, { force })
  try {
    const json = JSON.parse(text)
    const rows = Array.isArray(json?.rows) ? json.rows : []
    return { ...json, rows }
  } catch (e) {
    const err = new Error('Invalid cellx_affiliate_month.json')
    err.cause = e
    throw err
  }
}
