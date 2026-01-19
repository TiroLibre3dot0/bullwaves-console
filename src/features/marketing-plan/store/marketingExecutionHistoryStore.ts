import { ScenarioKey } from '../model'

export type MarketingExecutionSnapshot = {
  id: string
  createdAt: string
  windowDays: 30 | 60 | 90
  scenario: ScenarioKey
  forecastTotals: {
    usersDelta: number
    depositsDelta: number
    retentionDeltaPct: number
    revenueDelta: number
  }
  actualsProxy: {
    usersActual: number
    depositsActual: number
    depositCountActual: number
  }
  notes?: string
}

const STORAGE_KEY = 'bw_marketing_execution_history_v1'

function safeParse(raw: string | null) {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function loadMarketingExecutionHistory(): MarketingExecutionSnapshot[] {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

export function saveMarketingExecutionHistory(rows: MarketingExecutionSnapshot[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

export function addMarketingExecutionSnapshot(snapshot: Omit<MarketingExecutionSnapshot, 'id' | 'createdAt'>) {
  const existing = loadMarketingExecutionHistory()
  const next: MarketingExecutionSnapshot = {
    id: `mkt_snap_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    ...snapshot,
  }
  const merged = [next, ...existing].slice(0, 50)
  saveMarketingExecutionHistory(merged)
  return merged
}

export function clearMarketingExecutionHistory() {
  saveMarketingExecutionHistory([])
}
