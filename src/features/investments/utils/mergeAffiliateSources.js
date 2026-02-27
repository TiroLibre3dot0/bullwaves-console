export function computeDelta(baseRaw, otherRaw) {
  const base = Number(baseRaw)
  const other = Number(otherRaw)

  const baseOk = Number.isFinite(base)
  const otherOk = Number.isFinite(other)

  const baseVal = baseOk ? base : 0
  const otherVal = otherOk ? other : 0

  const deltaAbs = otherVal - baseVal

  if (baseVal === 0 && otherVal === 0) {
    return { deltaAbs: 0, deltaPct: 0, deltaPctIsNa: false }
  }

  if (baseVal === 0 && otherVal !== 0) {
    // Avoid misleading infinity in UI; consumer can render as n/a.
    return { deltaAbs, deltaPct: null, deltaPctIsNa: true }
  }

  const deltaPct = (deltaAbs / baseVal) * 100
  return { deltaAbs, deltaPct, deltaPctIsNa: false }
}

export function mergeAffiliateSources({
  cellxByAffiliate = {},
  creolabsByAffiliate = {},
  metricKeys = [],
}) {
  const keys = new Set([
    ...Object.keys(cellxByAffiliate || {}),
    ...Object.keys(creolabsByAffiliate || {}),
  ])

  const rows = []
  keys.forEach((affiliateId) => {
    const cellx = cellxByAffiliate?.[affiliateId] || {}
    const creolabs = creolabsByAffiliate?.[affiliateId] || {}

    const delta = {}
    let maxAbsDeltaPct = 0
    let hasNaPct = false

    metricKeys.forEach((k) => {
      const { deltaAbs, deltaPct, deltaPctIsNa } = computeDelta(cellx?.[k], creolabs?.[k])
      delta[k] = { deltaAbs, deltaPct, deltaPctIsNa }

      if (deltaPctIsNa && (Number(cellx?.[k]) || 0) === 0 && (Number(creolabs?.[k]) || 0) !== 0) {
        hasNaPct = true
      }
      if (Number.isFinite(deltaPct)) {
        maxAbsDeltaPct = Math.max(maxAbsDeltaPct, Math.abs(deltaPct))
      }
    })

    rows.push({
      affiliateId,
      cellx,
      creolabs,
      delta,
      maxAbsDeltaPct,
      // Treat n/a percent (base 0, other > 0) as high discrepancy.
      discrepancyScore: hasNaPct ? 1e9 : maxAbsDeltaPct,
    })
  })

  return rows
}
