// Pure KPI utilities for Cohort > Composition.
// Source of truth: cohort matrix only (no external monthly totals).

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n)
}

function toFiniteNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function groupRowsByBaseAbs(rows) {
  const map = new Map()
  ;(Array.isArray(rows) ? rows : []).forEach((r) => {
    const baseAbs = Number(r?.baseAbs)
    if (!Number.isFinite(baseAbs)) return
    const list = map.get(baseAbs) || []
    list.push(r)
    map.set(baseAbs, list)
  })
  return map
}

export function computeCohortContribution(rowsForCohortAbs, monthOffset) {
  const rows = Array.isArray(rowsForCohortAbs) ? rowsForCohortAbs : []
  if (!rows.length) return { sum: null, complete: false }

  let sum = 0
  for (const r of rows) {
    const v = r?.values?.[monthOffset]
    const n = toFiniteNumber(v)
    if (!isFiniteNumber(n)) return { sum: null, complete: false }
    sum += n
  }
  return { sum, complete: true }
}

export function computeMonthlyTotalFromMatrix(cohortRows, monthAbs) {
  const rows = Array.isArray(cohortRows) ? cohortRows : []
  const abs = Number(monthAbs)
  if (!Number.isFinite(abs)) return { total: null, complete: false }

  let total = 0
  for (const r of rows) {
    const baseAbs = Number(r?.baseAbs)
    if (!Number.isFinite(baseAbs)) continue
    const offset = abs - baseAbs
    if (offset < 0) continue

    const v = r?.values?.[offset]
    const n = toFiniteNumber(v)
    if (!isFiniteNumber(n)) return { total: null, complete: false }
    total += n
  }

  return { total, complete: true }
}

export function computeCompositionSharesForMonth({ cohortRows, monthAbs }) {
  const abs = Number(monthAbs)
  if (!Number.isFinite(abs)) {
    return { monthAbs: abs, eligible: false, reason: 'invalid-month', shares: null }
  }

  const grouped = groupRowsByBaseAbs(cohortRows)

  const totalRes = computeMonthlyTotalFromMatrix(cohortRows, abs)
  if (!totalRes.complete || totalRes.total === null) {
    return { monthAbs: abs, eligible: false, reason: 'missing-total', shares: null }
  }

  // Requirement: only use months where Total(M) > 0.
  if (!(totalRes.total > 0)) {
    return { monthAbs: abs, eligible: false, reason: 'non-positive-total', shares: null }
  }

  const cur = computeCohortContribution(grouped.get(abs), 0)
  const prev1 = computeCohortContribution(grouped.get(abs - 1), 1)
  const prev2 = computeCohortContribution(grouped.get(abs - 2), 2)

  // Requirement: if required cohort data is missing, skip month (do not treat missing as zero).
  if (!cur.complete || !prev1.complete || !prev2.complete) {
    return { monthAbs: abs, eligible: false, reason: 'missing-required-cohorts', shares: null }
  }

  const total = totalRes.total
  const s0 = cur.sum / total
  const s2 = (prev1.sum + prev2.sum) / total
  const sold = 1 - s0 - s2

  if (![s0, s2, sold].every((x) => Number.isFinite(x))) {
    return { monthAbs: abs, eligible: false, reason: 'invalid-shares', shares: null }
  }

  return {
    monthAbs: abs,
    eligible: true,
    reason: null,
    shares: {
      total,
      currentSum: cur.sum,
      prev2Sum: prev1.sum + prev2.sum,
      olderSum: total - cur.sum - (prev1.sum + prev2.sum),
      s0,
      s2,
      sold,
    },
  }
}

export function computeYearlyAverageCompositionShares({ cohortRows, calendarEntries }) {
  const entries = Array.isArray(calendarEntries) ? calendarEntries : []
  const months = []

  const s0Values = []
  const s2Values = []
  const soldValues = []

  for (const e of entries) {
    const abs = Number(e?.abs)
    if (!Number.isFinite(abs)) continue

    const res = computeCompositionSharesForMonth({ cohortRows, monthAbs: abs })
    if (!res.eligible || !res.shares) continue

    months.push({
      abs,
      monthKey: e?.label ?? null,
      total: res.shares.total,
      currentSum: res.shares.currentSum,
      prev2Sum: res.shares.prev2Sum,
      olderSum: res.shares.olderSum,
      s0: res.shares.s0,
      s2: res.shares.s2,
      sold: res.shares.sold,
    })

    s0Values.push(res.shares.s0)
    s2Values.push(res.shares.s2)
    soldValues.push(res.shares.sold)
  }

  const avg = (xs) => {
    const list = (xs || []).filter((x) => Number.isFinite(x))
    if (!list.length) return null
    return list.reduce((s, x) => s + x, 0) / list.length
  }

  return {
    monthsUsed: months.length,
    avgShares: {
      current: avg(s0Values),
      prev2: avg(s2Values),
      older: avg(soldValues),
    },
    months, // for debugging / tooltip info if needed
  }
}
