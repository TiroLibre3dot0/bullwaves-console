import { defaultAssumptions } from './assumptions'

function parseMonthKey(key = '') {
  const [y, m] = key.split('-').map((v) => Number(v))
  return { year: Number.isFinite(y) ? y : 0, monthIndex: Number.isFinite(m) ? m : 0 }
}

function isWithinWindow(startKey, durationMonths, targetKey) {
  if (!startKey || !targetKey || !durationMonths) return false
  const start = parseMonthKey(startKey)
  const target = parseMonthKey(targetKey)
  const startIdx = start.year * 12 + start.monthIndex
  const targetIdx = target.year * 12 + target.monthIndex
  const diff = targetIdx - startIdx
  return diff >= 0 && diff < durationMonths
}

export function buildDefaultProjectPlan(projects = [], defaults = defaultAssumptions.projectDefaults) {
  const monthly = defaults?.monthly || {}
  const duration = defaults?.durationMonths || 6
  const startMonth = defaults?.startMonth || '2026-00'

  return projects.map((p) => {
    const deptKey = (p.department || '').toLowerCase()
    const deptFactor = deptKey.includes('marketing') ? 1.2 : deptKey.includes('compliance') ? 1.1 : 1
    return {
      id: p.id,
      label: p.activity || p.area || p.department || 'Project',
      department: p.department || '—',
      enabled: false,
      startMonth,
      duration,
      costs: {
        personnel: Math.round((monthly.personnel || 0) * deptFactor),
        tooling: Math.round((monthly.tooling || 0) * deptFactor),
        marketing: Math.round((monthly.marketing || 0) * (deptKey.includes('marketing') ? 1.2 : 1)),
      },
    }
  })
}

export function projectCostForMonth(projectPlan = [], monthKey) {
  const totals = { personnel: 0, tooling: 0, marketing: 0 }
  projectPlan.forEach((p) => {
    if (!p.enabled) return
    if (!isWithinWindow(p.startMonth, p.duration, monthKey)) return
    totals.personnel += Number(p.costs?.personnel || 0)
    totals.tooling += Number(p.costs?.tooling || 0)
    totals.marketing += Number(p.costs?.marketing || 0)
  })
  return { ...totals, total: totals.personnel + totals.tooling + totals.marketing }
}

export function updateProjectPlan(projectPlan, projectId, patch) {
  return projectPlan.map((p) => {
    if (p.id !== projectId) return p
    const nextCosts = patch.costs ? { ...p.costs, ...patch.costs } : p.costs
    return { ...p, ...patch, costs: nextCosts }
  })
}
