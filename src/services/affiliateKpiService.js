// Lightweight service to load affiliate KPI index for dashboard/maps
// Usage: import { loadAffiliateKpiIndex, getAffiliateKpi } from './affiliateKpiService'

import { withReportsVersion } from '../lib/fetchCache'

export async function loadAffiliateKpiIndex() {
  const res = await fetch(withReportsVersion('/affiliate_kpi_index.json'), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load affiliate KPI index')
  return await res.json()
}

export function getAffiliateKpi(index, affiliateId) {
  if (!index || !affiliateId) return null
  const key = String(affiliateId).trim().toLowerCase()
  return index[key] || null
}
