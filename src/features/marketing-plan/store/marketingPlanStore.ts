import { MarketingPlanV1, defaultMarketingPlan, clonePlan } from '../model'

const STORAGE_KEY = 'bw_marketing_plan_v1'

function safeParse(raw: string | null): any {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function loadMarketingPlan(): MarketingPlanV1 {
  if (typeof window === 'undefined') return defaultMarketingPlan()
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY))
  if (parsed && parsed.version === 1 && Array.isArray(parsed.initiatives) && Array.isArray(parsed.objectives)) {
    return parsed as MarketingPlanV1
  }
  return defaultMarketingPlan()
}

export function saveMarketingPlan(plan: MarketingPlanV1) {
  if (typeof window === 'undefined') return
  const next: MarketingPlanV1 = { ...plan, updatedAt: new Date().toISOString() }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function resetMarketingPlan() {
  const p = defaultMarketingPlan()
  saveMarketingPlan(p)
  return p
}

export function exportMarketingPlanSnapshot(plan: MarketingPlanV1) {
  return {
    ...clonePlan(plan),
    exportedAt: new Date().toISOString(),
  }
}
