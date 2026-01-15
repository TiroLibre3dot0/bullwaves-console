// Lightweight service to load affiliate KPI index for dashboard/maps
// Usage: import { loadAffiliateKpiIndex, getAffiliateKpi } from './affiliateKpiService'

export async function loadAffiliateKpiIndex() {
  const res = await fetch('/affiliate_kpi_index.json')
  if (!res.ok) throw new Error('Failed to load affiliate KPI index')
  return await res.json()
}

export function getAffiliateKpi(index, affiliateId) {
  if (!index || !affiliateId) return null
  const key = String(affiliateId).trim().toLowerCase()
  return index[key] || null
}
