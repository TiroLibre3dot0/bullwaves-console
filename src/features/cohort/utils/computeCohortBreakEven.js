// Compute break-even based on cumulative PL minus cumulative commissions.
// Accepts an array of monthly rows shaped like the Cohort table:
// [{ monthLabel, monthIndex, pl, commissions, ... }, ...]
// Returns the first index where cumulative >= 0 along with labels.
export function computeCohortBreakEvenFromRows(monthlyRows = []) {
  const rows = Array.isArray(monthlyRows) ? monthlyRows : []
  if (!rows.length) {
    return {
      hasCohortData: false,
      breakEvenIndex: null,
      breakEvenMonths: null,
      breakEvenLabel: 'Cohort not available',
    }
  }

  const normalized = [...rows]
    .map((r, idx) => ({
      monthIndex: typeof r?.monthIndex === 'number' ? r.monthIndex : idx,
      monthLabel: r?.monthLabel || r?.month || r?.label || `Month ${idx + 1}`,
      pl: Number(r?.pl ?? r?.value ?? 0) || 0,
      commissions: Math.abs(Number(r?.commissions ?? r?.payments ?? r?.amount ?? 0) || 0),
    }))
    .sort((a, b) => (a.monthIndex - b.monthIndex) || a.monthLabel.localeCompare(b.monthLabel))

  let acc = 0
  let breakEvenIndex = null
  for (let i = 0; i < normalized.length; i += 1) {
    acc += (normalized[i].pl || 0) - (normalized[i].commissions || 0)
    if (breakEvenIndex === null && acc >= 0) {
      breakEvenIndex = i
      break
    }
  }

  if (breakEvenIndex === null) {
    return {
      hasCohortData: true,
      breakEvenIndex: null,
      breakEvenMonths: null,
      breakEvenLabel: 'Not reached',
    }
  }

  const breakEvenMonths = breakEvenIndex + 1
  const label = normalized[breakEvenIndex]?.monthLabel || `Month ${breakEvenMonths}`

  return {
    hasCohortData: true,
    breakEvenIndex,
    breakEvenMonths,
    breakEvenLabel: `${label} (${breakEvenMonths} months)`,
  }
}

export default computeCohortBreakEvenFromRows
