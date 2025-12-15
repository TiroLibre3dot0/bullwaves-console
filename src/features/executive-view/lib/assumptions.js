import { sections } from '../../../pages/orgChartData'
import { normalizeKey } from '../../../lib/formatters'

export const departmentBands = {
  'Support Team': 2600,
  Operations: 4200,
  HR: 3500,
  'Sales - Conversion': 4200,
  'Sales - Retention': 4200,
  'Sales - Dubai': 4800,
  'Affiliate Manager': 4300,
  Marketing: 4200,
  Finance: 4600,
  Reconciliation: 4300,
  PSP: 4400,
  Compliance: 5200,
  Dealing: 5200,
  Technology: 5600,
  Shareholder: 0,
  Support: 2600,
  Acquisition: 4200,
  Trading: 5200,
  'Trading & Dealing': 5200,
  Partners: 4200,
}

const DEFAULT_BAND = 3600

export function bandForDepartment(dept = '') {
  if (!dept) return DEFAULT_BAND
  const exact = departmentBands[dept]
  if (exact !== undefined) return exact
  const key = normalizeKey(dept)
  if (departmentBands[key] !== undefined) return departmentBands[key]
  return DEFAULT_BAND
}

export function derivePersonnelBaseline(customBands = departmentBands) {
  const breakdownMap = new Map()
  sections.forEach((section) => {
    (section.roles || []).forEach((role) => {
      const dept = role.department || role.division || 'Other'
      const key = normalizeKey(dept) || 'other'
      const monthlyCost = customBands[dept] ?? customBands[key] ?? bandForDepartment(dept)
      if (!breakdownMap.has(key)) {
        breakdownMap.set(key, { department: dept, headcount: 0, monthlyCost: 0 })
      }
      const acc = breakdownMap.get(key)
      acc.headcount += 1
      acc.monthlyCost += monthlyCost
    })
  })

  const breakdown = Array.from(breakdownMap.values()).sort((a, b) => b.monthlyCost - a.monthlyCost)
  const personnelTotal = breakdown.reduce((acc, row) => acc + row.monthlyCost, 0)
  return { breakdown, total: personnelTotal }
}

export const defaultPersonnelBaseline = derivePersonnelBaseline()

export const defaultAssumptions = {
  seasonalityStrength: 0.15,
  scenarios: {
    base: {
      regGrowth: 0.035,
      regToFtdLift: 1,
      ftdToQftdLift: 1,
      netPerFtdLift: 1.02,
      cpaPerQftdLift: 1,
    },
    conservative: {
      regGrowth: 0.015,
      regToFtdLift: 0.96,
      ftdToQftdLift: 0.95,
      netPerFtdLift: 0.96,
      cpaPerQftdLift: 1.05,
    },
    upside: {
      regGrowth: 0.06,
      regToFtdLift: 1.05,
      ftdToQftdLift: 1.04,
      netPerFtdLift: 1.08,
      cpaPerQftdLift: 0.96,
    },
  },
  opex: {
    personnel: defaultPersonnelBaseline,
    tech: {
      hosting: 18000,
      monitoring: 4500,
      tooling: 6000,
    },
    legal: {
      compliance: 9000,
      licensing: 6500,
    },
    dubai: {
      monthly: 32000,
      startMonth: '2026-00',
    },
  },
  projectDefaults: {
    monthly: { personnel: 6000, tooling: 3000, marketing: 5000 },
    durationMonths: 6,
    startMonth: '2026-00',
  },
}

export function cloneAssumptions(next = defaultAssumptions) {
  return JSON.parse(JSON.stringify(next))
}

export function buildOpexBase(assumptions = defaultAssumptions) {
  const personnel = assumptions.opex?.personnel?.total ?? defaultPersonnelBaseline.total
  const techTotal = Object.values(assumptions.opex?.tech || {}).reduce((acc, v) => acc + Number(v || 0), 0)
  const legalTotal = Object.values(assumptions.opex?.legal || {}).reduce((acc, v) => acc + Number(v || 0), 0)
  const dubaiBase = Number(assumptions.opex?.dubai?.monthly || 0)
  return {
    personnelBreakdown: assumptions.opex?.personnel?.breakdown || defaultPersonnelBaseline.breakdown,
    components: {
      personnel,
      tech: techTotal,
      legal: legalTotal,
      dubai: dubaiBase,
    },
    total: personnel + techTotal + legalTotal + dubaiBase,
  }
}
