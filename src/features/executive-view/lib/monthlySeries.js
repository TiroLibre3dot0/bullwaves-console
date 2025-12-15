import { buildOpexBase, defaultAssumptions } from './assumptions'
import { projectCostForMonth } from './roadmapCosting'

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function monthKeyFromParts(year, monthIndex) {
  return `${year}-${String(monthIndex).padStart(2, '0')}`
}

export function buildMonthRange() {
  const months = []
  for (let year = 2025; year <= 2026; year += 1) {
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      months.push({
        year,
        monthIndex,
        key: monthKeyFromParts(year, monthIndex),
        label: `${monthNames[monthIndex]} ${year}`,
      })
    }
  }
  return months
}

function seedMonths(baseOpex, projectPlan, assumptions) {
  const months = buildMonthRange()
  const dubaiStartKey = assumptions?.opex?.dubai?.startMonth || '2026-00'
  const [dy, dm] = dubaiStartKey.split('-').map((v) => Number(v))
  const dubaiStartIndex = (Number.isFinite(dy) ? dy : 2026) * 12 + (Number.isFinite(dm) ? dm : 0)
  const baseWithoutDubai = baseOpex.total - (baseOpex.components?.dubai || 0)
  const dubaiMonthly = assumptions?.opex?.dubai?.monthly || baseOpex.components?.dubai || 0

  return months.map((m) => {
    const roadmapCosts = projectCostForMonth(projectPlan, m.key)
    const currentIndex = m.year * 12 + m.monthIndex
    const opexDubai = currentIndex >= dubaiStartIndex ? dubaiMonthly : 0
    const opex = baseWithoutDubai + opexDubai + roadmapCosts.total
    return {
      ...m,
      registrations: 0,
      ftd: 0,
      qftd: 0,
      netDeposits: 0,
      revenue: 0,
      payouts: 0,
      opex,
      opexBase: baseWithoutDubai,
      opexDubai,
      opexRoadmap: roadmapCosts.total,
      ebitda: -opex,
      pnl: -opex,
      roiMonthly: -100,
      roadmapCosts,
    }
  })
}

function aggregateActuals({ mediaRows, payments, baseOpex, projectPlan, assumptions }) {
  const months = seedMonths(baseOpex, projectPlan, assumptions)
  const monthIndex = new Map(months.map((m, idx) => [m.key, idx]))

  const media2025 = (mediaRows || []).filter((r) => r.year === 2025)
  media2025.forEach((r) => {
    const idx = monthIndex.get(r.monthKey)
    if (idx === undefined) return
    const target = months[idx]
    target.registrations += r.registrations || 0
    target.ftd += r.ftd || 0
    target.qftd += r.qftd || 0
    target.netDeposits += r.netDeposits || 0
    target.revenue += r.pl || 0
  })

  const payments2025 = (payments || []).filter((p) => p.year === 2025)
  payments2025.forEach((p) => {
    const idx = monthIndex.get(p.monthKey)
    if (idx === undefined) return
    const target = months[idx]
    target.payouts += Math.abs(p.amount || 0)
  })

  months.forEach((m) => {
    const costBase = (m.payouts || 0) + (m.opex || 0)
    const pnl = (m.revenue || 0) - costBase
    const roiMonthly = costBase ? (pnl / costBase) * 100 : 0
    m.pnl = pnl
    m.ebitda = pnl
    m.roiMonthly = roiMonthly
  })

  return months
}

function deriveBaselines(actualMonths) {
  const take = actualMonths.slice(0, 12)
  const totals = take.reduce((acc, m) => ({
    registrations: acc.registrations + (m.registrations || 0),
    ftd: acc.ftd + (m.ftd || 0),
    qftd: acc.qftd + (m.qftd || 0),
    netDeposits: acc.netDeposits + (m.netDeposits || 0),
    revenue: acc.revenue + (m.revenue || 0),
    payouts: acc.payouts + (m.payouts || 0),
    opex: acc.opex + (m.opex || 0),
  }), { registrations: 0, ftd: 0, qftd: 0, netDeposits: 0, payouts: 0, revenue: 0, opex: 0 })

  const monthsWithData = take.filter((m) => m.registrations || m.ftd || m.qftd || m.netDeposits)
  const avgRegs = monthsWithData.length ? totals.registrations / monthsWithData.length : 0
  const avgFtd = monthsWithData.length ? totals.ftd / monthsWithData.length : 0
  const avgQftd = monthsWithData.length ? totals.qftd / monthsWithData.length : 0
  const avgRevenue = monthsWithData.length ? totals.revenue / monthsWithData.length : 0
  const avgPayout = monthsWithData.length ? totals.payouts / monthsWithData.length : 0
  const avgOpex = monthsWithData.length ? totals.opex / monthsWithData.length : 0

  const regToFtd = avgRegs ? avgFtd / Math.max(avgRegs, 1) : 0.18
  const ftdToQftd = avgFtd ? avgQftd / Math.max(avgFtd, 1) : 0.7
  const plPerFtd = avgFtd ? avgRevenue / Math.max(avgFtd, 1) : 280
  const cpaPerQftd = avgQftd ? avgPayout / Math.max(avgQftd, 1) : 150

  const seasonality = buildSeasonality(take)

  return {
    totals,
    avgRegs,
    regToFtd,
    ftdToQftd,
    plPerFtd,
    cpaPerQftd,
    avgQftd,
    avgPayout,
    avgOpex,
    avgRevenue,
    seasonality,
  }
}

function clamp(value, min = 0.7, max = 1.3) {
  return Math.min(max, Math.max(min, value))
}

function buildSeasonality(actualMonths) {
  const base = { index: Array(12).fill(1) }
  if (!actualMonths || !actualMonths.length) return base
  const take = actualMonths.slice(0, 12)
  const values = take.map((m) => m.revenue || m.netDeposits || 0)
  const mean = values.reduce((acc, v) => acc + v, 0) / Math.max(values.filter((v) => v > 0).length || 1, 1)
  if (!mean) return base
  const index = values.map((v) => clamp(v / mean))
  return { index }
}

function applyForecast({ months, scenario, baselines, baseOpex, projectPlan, assumptions }) {
  const out = months.map((m) => ({ ...m }))
  const startIdx = 12 // Jan 2026
  const regGrowthMonthly = 1 + (scenario.regGrowth || 0)
  const seasonalityStrength = Number.isFinite(assumptions?.seasonalityStrength) ? assumptions.seasonalityStrength : 0.15
  const seasonalityIndex = baselines.seasonality?.index || Array(12).fill(1)

  const guardrail = (proposed, prevVal, anchor, caps = { up: 0.45, down: 0.35 }) => {
    if (!Number.isFinite(proposed)) return 0
    let value = proposed
    if (prevVal > 0) {
      const max = prevVal * (1 + caps.up)
      const min = prevVal * (1 - caps.down)
      value = Math.min(max, Math.max(min, value))
    }
    if (anchor > 0) {
      value = (value * 0.7) + (anchor * 0.3)
    }
    return Math.max(0, value)
  }

  for (let i = startIdx; i < out.length; i += 1) {
    const month = out[i]
    const monthSlot = i - startIdx
    const prev = out[i - 1] || {}
    const seasonalBaseline = months[monthSlot] || {}
    const baseRegs = prev.registrations || seasonalBaseline.registrations || baselines.avgRegs || 0
    const convRegToFtd = baselines.regToFtd * (scenario.regToFtdLift || 1)
    const convFtdToQftd = baselines.ftdToQftd * (scenario.ftdToQftdLift || 1)
    const netPerFtd = baselines.plPerFtd * (scenario.netPerFtdLift || 1)
    const cpaPerQftd = baselines.cpaPerQftd * (scenario.cpaPerQftdLift || 1)

    const seasonBias = seasonalityIndex[monthSlot] || 1
    const seasonFactor = 1 + seasonalityStrength * (seasonBias - 1)

    const proposedRegs = baseRegs * regGrowthMonthly * seasonFactor
    const regs = guardrail(proposedRegs, prev.registrations || seasonalBaseline.registrations, baselines.avgRegs)
    const ftd = guardrail(regs * convRegToFtd, prev.ftd || seasonalBaseline.ftd, baselines.avgFtd)
    const qftd = guardrail(ftd * convFtdToQftd, prev.qftd || seasonalBaseline.qftd, baselines.avgQftd)
    const revenue = guardrail(ftd * netPerFtd, prev.revenue || seasonalBaseline.revenue, baselines.avgRevenue)
    const effectiveQftd = Math.max(qftd, baselines.avgQftd * 0.35)
    const payouts = guardrail(effectiveQftd * cpaPerQftd, prev.payouts || seasonalBaseline.payouts, baselines.avgPayout)
    const roadmapCosts = projectCostForMonth(projectPlan, month.key)
    const opexDubai = (() => {
      const dk = assumptions?.opex?.dubai?.startMonth || '2026-00'
      const [dy, dm] = dk.split('-').map((v) => Number(v))
      const startIndex = (Number.isFinite(dy) ? dy : 2026) * 12 + (Number.isFinite(dm) ? dm : 0)
      const currentIndex = month.year * 12 + month.monthIndex
      return currentIndex >= startIndex ? (assumptions?.opex?.dubai?.monthly || 0) : 0
    })()
    const opexBase = (baseOpex.total - (baseOpex.components?.dubai || 0))
    const opex = opexBase + roadmapCosts.total + opexDubai
    const pnl = revenue - payouts - opex
    const roiMonthly = (payouts + opex) ? (pnl / (payouts + opex)) * 100 : 0

    Object.assign(month, {
      registrations: regs,
      ftd,
      qftd,
      netDeposits: revenue,
      revenue,
      payouts,
      opex,
      opexBase,
      opexDubai,
      opexRoadmap: roadmapCosts.total,
      ebitda: pnl,
      pnl,
      roiMonthly,
      roadmapCosts,
    })
  }

  return out
}

function extractSeries(months) {
  const series = {
    registrations: [],
    ftd: [],
    qftd: [],
    netDeposits: [],
    revenue: [],
    payouts: [],
    opex: [],
    ebitda: [],
    pnl: [],
    roiMonthly: [],
  }
  months.forEach((m) => {
    series.registrations.push(m.registrations || 0)
    series.ftd.push(m.ftd || 0)
    series.qftd.push(m.qftd || 0)
    series.netDeposits.push(m.netDeposits || 0)
    series.revenue.push(m.revenue || 0)
    series.payouts.push(m.payouts || 0)
    series.opex.push(m.opex || 0)
    series.ebitda.push(m.ebitda || 0)
    series.pnl.push(m.pnl || 0)
    series.roiMonthly.push(m.roiMonthly || 0)
  })
  return series
}

export function buildMonthlySeries({ mediaRows, payments, assumptions = defaultAssumptions, scenarioKey = 'base', projectPlan = [] }) {
  const baseOpex = buildOpexBase(assumptions)
  const seeded = aggregateActuals({ mediaRows, payments, baseOpex, projectPlan, assumptions })
  const baselines = deriveBaselines(seeded)
  const scenario = assumptions.scenarios?.[scenarioKey] || assumptions.scenarios?.base || defaultAssumptions.scenarios.base
  const withForecast = applyForecast({ months: seeded, scenario, baselines, baseOpex, projectPlan, assumptions })
  return {
    months: withForecast,
    labels: withForecast.map((m) => m.label),
    actualCount: 12,
    baselines,
    baseOpex,
    series: extractSeries(withForecast),
  }
}
