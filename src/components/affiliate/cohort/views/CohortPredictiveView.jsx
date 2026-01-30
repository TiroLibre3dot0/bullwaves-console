import { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'

import { normalizeKey } from '../../../../lib/formatters'
import { generatePredictiveInsights } from '../predictive/insightEngine'
import InsightsPanel from '../predictive/InsightsPanel'
import {
  computeCompositionSharesForMonth,
  computeYearlyAverageCompositionShares,
} from '../../../../features/affiliate/utils/cohortCompositionKpis'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthLabelFromAbs(abs) {
  const year = Math.floor(abs / 12)
  const month = abs % 12
  return `${MONTHS[month]} ${year}`
}

function formatCompactNumber(value, kind) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (kind === 'count') return String(Math.round(n))

  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `€${n < 0 ? '-' : ''}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1000) return `€${n < 0 ? '-' : ''}${Math.round(abs / 1000)}K`
  return `€${Math.round(n)}`
}

function formatPct(p) {
  const n = Number(p)
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function toneForRisk({ gqi, di }) {
  if (gqi !== null && gqi < 0.3)
    return { label: 'HIGH', bg: 'rgba(248,113,113,0.18)', border: 'rgba(248,113,113,0.35)' }
  if (di !== null && di > 0.7)
    return { label: 'HIGH', bg: 'rgba(248,113,113,0.18)', border: 'rgba(248,113,113,0.35)' }

  if (gqi !== null && gqi < 0.45)
    return { label: 'MED', bg: 'rgba(234,179,8,0.16)', border: 'rgba(234,179,8,0.30)' }
  if (di !== null && di > 0.5)
    return { label: 'MED', bg: 'rgba(234,179,8,0.16)', border: 'rgba(234,179,8,0.30)' }

  return { label: 'LOW', bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.35)' }
}

function averagePatternFromLastKCohorts(cohortRows, k, maxOffsets) {
  const rows = Array.isArray(cohortRows) ? cohortRows : []
  const sorted = rows
    .slice()
    .sort((a, b) => Number(b.baseAbs) - Number(a.baseAbs))
    .slice(0, Math.max(1, Number(k) || 3))

  const pattern = []
  for (let i = 0; i < maxOffsets; i += 1) {
    let sum = 0
    let count = 0
    for (const r of sorted) {
      const v = r?.values?.[i]
      const n = Number(v)
      if (!Number.isFinite(n)) continue
      sum += n
      count += 1
    }
    pattern.push(count ? sum / count : 0)
  }
  return { pattern, cohortsUsed: sorted.length }
}

function simulateSteadyAcquisition(pattern, multiplierPct, horizon) {
  const m = (Number(multiplierPct) || 0) / 100
  const out = Array.from({ length: horizon }, () => 0)
  for (let i = 0; i < horizon; i += 1) {
    let sum = 0
    for (let j = 0; j <= i; j += 1) {
      sum += pattern[i - j] || 0
    }
    out[i] = m * sum
  }
  return out
}

function computeAbsRangeFromCohorts(cohortRows) {
  const rows = Array.isArray(cohortRows) ? cohortRows : []
  let minAbs = null
  let maxAbs = null

  for (const r of rows) {
    const baseAbs = Number(r?.baseAbs)
    if (!Number.isFinite(baseAbs)) continue

    if (minAbs === null || baseAbs < minAbs) minAbs = baseAbs

    const vals = Array.isArray(r?.values) ? r.values : []
    // Find deepest finite value index (offset) for this cohort.
    for (let i = vals.length - 1; i >= 0; i -= 1) {
      const n = Number(vals[i])
      if (!Number.isFinite(n)) continue
      const endAbs = baseAbs + i
      if (maxAbs === null || endAbs > maxAbs) maxAbs = endAbs
      break
    }
  }

  if (minAbs === null || maxAbs === null) return null
  return { minAbs, maxAbs }
}

function computeMonthlyTotalMissingAsZero(cohortRows, monthAbs, metric) {
  const rows = Array.isArray(cohortRows) ? cohortRows : []
  const abs = Number(monthAbs)
  if (!Number.isFinite(abs)) return null

  let total = 0
  for (const r of rows) {
    const baseAbs = Number(r?.baseAbs)
    if (!Number.isFinite(baseAbs)) continue
    const offset = abs - baseAbs
    if (offset < 0) continue

    const v = r?.values?.[offset]
    const n = Number(v)
    // Forecast rule: missing contrib => 0 (do not drop cohorts).
    total += Number.isFinite(n) ? n : 0
  }

  // Withdrawals should behave like absolute outflow in the dashboard.
  if (metric === 'withdrawals') return Math.abs(total)
  return total
}

export default function CohortPredictiveView({
  cohortRows = [],
  calendarEntries = [], // selected year
  selectedAffiliate = 'all',
  metric = 'netDeposits',
  metricKind = 'currency',
  selectedYear = 'all',
}) {
  const [horizon, setHorizon] = useState(6) // 6 or 12
  const [acqMultiplier, setAcqMultiplier] = useState(100) // 0..150 (% investment vs parity)
  const [patternK, setPatternK] = useState(3)
  const [targetNextMonth, setTargetNextMonth] = useState('')
  const [insightMode, setInsightMode] = useState('executive') // executive | operator
  const [showAllInsights, setShowAllInsights] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  const filteredCohorts = useMemo(() => {
    const affiliateKey = normalizeKey(selectedAffiliate)
    if (affiliateKey === 'all') return cohortRows
    return cohortRows.filter((r) => normalizeKey(r.affiliate || '') === affiliateKey)
  }, [cohortRows, selectedAffiliate])

  const { pattern, cohortsUsed } = useMemo(() => {
    // Use last K cohorts as “shape” for simulated acquisition.
    // Keep offsets big enough for 12-month mode.
    return averagePatternFromLastKCohorts(filteredCohorts, patternK, 12)
  }, [filteredCohorts, patternK])

  const patternSignalMonths = useMemo(() => {
    const p = Array.isArray(pattern) ? pattern : []
    for (let i = p.length - 1; i >= 0; i -= 1) {
      const n = Number(p[i])
      if (Number.isFinite(n) && Math.abs(n) > 0) return i + 1
    }
    return 0
  }, [pattern])

  const absRangeAll = useMemo(() => {
    return computeAbsRangeFromCohorts(filteredCohorts)
  }, [filteredCohorts])

  const globalAnchorMonthAbs = useMemo(() => {
    // Global anchor = last month (across all months) where Total(M) > 0.
    // Note: absRangeAll.maxAbs may include far-future months with explicit 0s.
    if (!absRangeAll) return null

    for (let abs = absRangeAll.maxAbs; abs >= absRangeAll.minAbs; abs -= 1) {
      const total = computeMonthlyTotalMissingAsZero(filteredCohorts, abs, metric)
      if (total === null) continue
      if (total > 0) return abs
    }

    return null
  }, [absRangeAll, filteredCohorts, metric])

  const yearAnchorMonthAbs = useMemo(() => {
    // Selected-year anchor = last month in selectedYear where Total(M) > 0.
    if (selectedYear === 'all') return null

    const entries = Array.isArray(calendarEntries) ? calendarEntries : []
    const absList = entries
      .map((e) => Number(e?.abs))
      .filter((abs) => Number.isFinite(abs))
      .sort((a, b) => a - b)

    for (let i = absList.length - 1; i >= 0; i -= 1) {
      const abs = absList[i]
      const total = computeMonthlyTotalMissingAsZero(filteredCohorts, abs, metric)
      if (total === null) continue
      if (total > 0) return abs
    }

    return null
  }, [calendarEntries, filteredCohorts, metric, selectedYear])

  const anchorMonthAbs = useMemo(() => {
    return yearAnchorMonthAbs ?? globalAnchorMonthAbs
  }, [globalAnchorMonthAbs, yearAnchorMonthAbs])

  const lastActualTotal = useMemo(() => {
    if (anchorMonthAbs === null) return null
    return computeMonthlyTotalMissingAsZero(filteredCohorts, anchorMonthAbs, metric)
  }, [anchorMonthAbs, filteredCohorts, metric])

  const baseForecast12 = useMemo(() => {
    if (anchorMonthAbs === null) return []
    const list = []
    for (let i = 1; i <= 12; i += 1) {
      const abs = anchorMonthAbs + i
      const total = computeMonthlyTotalMissingAsZero(filteredCohorts, abs, metric)
      list.push({ abs, total: total === null ? 0 : total })
    }
    return list
  }, [anchorMonthAbs, filteredCohorts, metric])

  const canUse12Months = useMemo(() => {
    // Enable 12 when pattern supports it OR when base forecast has signal beyond 6 months.
    if (patternSignalMonths >= 12) return true
    const beyond6 = (baseForecast12 || [])
      .slice(6, 12)
      .some((x) => Number.isFinite(Number(x?.total)) && Number(x.total) > 0)
    return beyond6
  }, [baseForecast12, patternSignalMonths])

  // Clamp UI horizon when data can't support 12.
  const effectiveHorizon = useMemo(() => {
    if (horizon === 12 && !canUse12Months) return 6
    return horizon
  }, [canUse12Months, horizon])

  const baseForecast = useMemo(() => {
    const h = Math.max(6, Number(effectiveHorizon) || 6)
    return (baseForecast12 || []).slice(0, h)
  }, [baseForecast12, effectiveHorizon])

  const simulated = useMemo(() => {
    const h = Math.max(6, Number(effectiveHorizon) || 6)
    return simulateSteadyAcquisition(pattern, acqMultiplier, h)
  }, [acqMultiplier, effectiveHorizon, pattern])

  const scenarioForecast = useMemo(() => {
    const h = Math.max(6, Number(effectiveHorizon) || 6)
    const out = []
    for (let i = 0; i < h; i += 1) {
      const base = baseForecast[i]?.total
      const sim = simulated[i] || 0
      out.push({
        abs: baseForecast[i]?.abs ?? null,
        base: Number.isFinite(Number(base)) ? Number(base) : 0,
        sim,
        total: (Number.isFinite(Number(base)) ? Number(base) : 0) + sim,
      })
    }
    return out
  }, [baseForecast, simulated, effectiveHorizon])

  const baseHasSignal = useMemo(() => {
    const h = Math.max(6, Number(effectiveHorizon) || 6)
    return baseForecast
      .slice(0, h)
      .some((x) => Number.isFinite(Number(x?.total)) && Number(x.total) > 0)
  }, [baseForecast, effectiveHorizon])

  const scenarioHasSignal = useMemo(() => {
    const h = Math.max(6, Number(effectiveHorizon) || 6)
    return scenarioForecast
      .slice(0, h)
      .some((x) => Number.isFinite(Number(x?.total)) && Number(x.total) > 0)
  }, [effectiveHorizon, scenarioForecast])

  const forecastUsable = useMemo(() => {
    if (anchorMonthAbs === null) return false
    if (!(Number.isFinite(Number(lastActualTotal)) && Number(lastActualTotal) > 0)) return false
    return baseHasSignal || scenarioHasSignal
  }, [anchorMonthAbs, baseHasSignal, lastActualTotal, scenarioHasSignal])

  const baseLimitedByDepth = useMemo(() => {
    return !baseHasSignal && scenarioHasSignal
  }, [baseHasSignal, scenarioHasSignal])

  const forecastCards = useMemo(() => {
    const next = Number.isFinite(Number(scenarioForecast[0]?.total))
      ? Number(scenarioForecast[0].total)
      : null
    const h = Math.max(6, Number(effectiveHorizon) || 6)

    const totals = scenarioForecast.slice(0, h).map((x) => Number(x.total))
    const ok = totals.every((x) => Number.isFinite(x))
    const totalN = ok ? totals.reduce((s, x) => s + x, 0) : null

    const growth =
      Number.isFinite(Number(next)) &&
      Number.isFinite(Number(lastActualTotal)) &&
      Number(lastActualTotal) > 0
        ? (Number(next) - Number(lastActualTotal)) / Number(lastActualTotal)
        : null

    // Structural indices computed on the selected year (calendarEntries).
    const comp = computeYearlyAverageCompositionShares({
      cohortRows: filteredCohorts,
      calendarEntries,
    })
    const di = comp.avgShares.current
    const gqi =
      comp.avgShares.prev2 !== null && comp.avgShares.older !== null
        ? comp.avgShares.prev2 + comp.avgShares.older
        : null
    const risk = toneForRisk({ gqi, di })

    return {
      next,
      totalN,
      growth,
      di,
      gqi,
      risk,
      monthsUsed: comp.monthsUsed,
    }
  }, [calendarEntries, filteredCohorts, effectiveHorizon, lastActualTotal, scenarioForecast])

  const totalsHistory = useMemo(() => {
    // Last eligible months (up to 6) ending at anchor, based on Total(M) > 0.
    if (!absRangeAll || anchorMonthAbs === null) return []
    const out = []
    for (let abs = anchorMonthAbs; abs >= absRangeAll.minAbs && out.length < 6; abs -= 1) {
      const total = computeMonthlyTotalMissingAsZero(filteredCohorts, abs, metric)
      if (!Number.isFinite(Number(total))) continue
      if (Number(total) > 0) out.unshift({ abs, total: Number(total) })
    }
    return out
  }, [absRangeAll, anchorMonthAbs, filteredCohorts, metric])

  const requiredMultiplierToHitTarget = useMemo(() => {
    const target = Number(targetNextMonth)
    const base = baseForecast[0]?.total
    const p0 = Number(pattern[0] || 0)

    if (
      !Number.isFinite(target) ||
      !Number.isFinite(Number(base)) ||
      !Number.isFinite(p0) ||
      p0 === 0
    )
      return null
    const delta = target - Number(base)
    const req = (delta / p0) * 100
    if (!Number.isFinite(req)) return null
    return Math.max(0, req)
  }, [baseForecast, pattern, targetNextMonth])

  const compositionSeries = useMemo(() => {
    // Insight engine needs last 3–6 months of share history even when selectedYear has no actual months (e.g. 2026).
    if (!absRangeAll) return []

    const series = []
    const end = globalAnchorMonthAbs ?? absRangeAll.maxAbs
    const start = Math.max(absRangeAll.minAbs, end - 36)
    for (let abs = start; abs <= end; abs += 1) {
      const res = computeCompositionSharesForMonth({ cohortRows: filteredCohorts, monthAbs: abs })
      if (!res.eligible || !res.shares) continue
      series.push({
        abs,
        label: monthLabelFromAbs(abs),
        di: res.shares.s0,
        gqi: res.shares.s2 + res.shares.sold,
        shares: {
          current: res.shares.s0,
          prev2: res.shares.s2,
          older: res.shares.sold,
        },
      })
    }

    return series.sort((a, b) => a.abs - b.abs)
  }, [absRangeAll, filteredCohorts, globalAnchorMonthAbs])

  const insights = useMemo(() => {
    const lastActualValue = lastActualTotal
    const nextScenario = scenarioForecast[0]?.total ?? null
    const nextBase = scenarioForecast[0]?.base ?? null

    const base = scenarioForecast[0]?.base
    const scenario = scenarioForecast[0]?.total
    const scenarioDeltaPct =
      Number.isFinite(Number(base)) && Number.isFinite(Number(scenario)) && Number(base) !== 0
        ? (Number(scenario) - Number(base)) / Number(base)
        : null

    const list = generatePredictiveInsights({
      metric,
      selectedYear,
      lastActualValue: Number.isFinite(Number(lastActualValue)) ? Number(lastActualValue) : null,
      nextMonthForecast: Number.isFinite(Number(nextScenario)) ? Number(nextScenario) : null,
      baseNextMonthForecast: Number.isFinite(Number(nextBase)) ? Number(nextBase) : null,
      forecastGrowth: Number.isFinite(Number(forecastCards.growth))
        ? Number(forecastCards.growth)
        : null,
      gqi: Number.isFinite(Number(forecastCards.gqi)) ? Number(forecastCards.gqi) : null,
      di: Number.isFinite(Number(forecastCards.di)) ? Number(forecastCards.di) : null,
      series: compositionSeries,
      totalsSeries: totalsHistory.map((p) => p.total),
      scenarioDelta: scenarioDeltaPct,
    })

    return list.slice(0, 6)
  }, [
    compositionSeries,
    forecastCards.di,
    forecastCards.gqi,
    forecastCards.growth,
    lastActualTotal,
    metric,
    scenarioForecast,
    selectedYear,
    totalsHistory,
  ])

  const insightsShown = useMemo(() => {
    if (showAllInsights) return insights
    return insights.slice(0, 2)
  }, [insights, showAllInsights])

  const warningChips = useMemo(() => {
    const chips = []

    // Build monthly GQI/DI series for the selected year.
    const entries = Array.isArray(calendarEntries) ? calendarEntries : []
    const series = entries
      .map((e) => {
        const abs = Number(e?.abs)
        if (!Number.isFinite(abs)) return null
        const res = computeCompositionSharesForMonth({ cohortRows: filteredCohorts, monthAbs: abs })
        if (!res.eligible || !res.shares) return null
        const di = res.shares.s0
        const gqi = res.shares.s2 + res.shares.sold
        return { abs, di, gqi }
      })
      .filter(Boolean)
      .sort((a, b) => a.abs - b.abs)

    const last3 = series.slice(-3)
    if (last3.length === 3) {
      const gqiDecreasing = last3[0].gqi > last3[1].gqi && last3[1].gqi > last3[2].gqi
      const diHigh = last3.every((x) => x.di > 0.7)

      if (gqiDecreasing) chips.push({ label: 'Retention decay risk', tone: 'danger' })
      if (diHigh) chips.push({ label: 'Over-dependence on acquisition', tone: 'danger' })
    }

    const next = baseForecast[0]?.total
    if (
      Number.isFinite(Number(next)) &&
      Number.isFinite(Number(lastActualTotal)) &&
      Number(lastActualTotal) > 0
    ) {
      const drop = (Number(next) - Number(lastActualTotal)) / Number(lastActualTotal)
      if (drop < -0.15) chips.push({ label: 'Revenue contraction risk', tone: 'danger' })
    }

    return chips
  }, [baseForecast, calendarEntries, filteredCohorts, lastActualTotal])

  const chartModel = useMemo(() => {
    if (anchorMonthAbs === null) return null

    const futureWindow = Math.max(6, Number(effectiveHorizon) || 6)

    // Last 6 actual months ending at anchor, keeping ONLY months where Total(M) > 0.
    const actualAbs = []
    if (absRangeAll) {
      for (let abs = anchorMonthAbs; abs >= absRangeAll.minAbs && actualAbs.length < 6; abs -= 1) {
        const total = computeMonthlyTotalMissingAsZero(filteredCohorts, abs, metric)
        if (total === null) continue
        if (total > 0) actualAbs.unshift(abs)
      }
    }

    const futureAbs = []
    for (let i = 1; i <= futureWindow; i += 1) futureAbs.push(anchorMonthAbs + i)

    const timelineAbs = [...actualAbs, ...futureAbs]
    const labels = timelineAbs.map((abs) => monthLabelFromAbs(abs))

    const actual = []
    const forecastBase = []
    const forecastScenario = []

    for (const abs of timelineAbs) {
      const isFuture = abs > anchorMonthAbs
      const total = computeMonthlyTotalMissingAsZero(filteredCohorts, abs, metric)

      if (!isFuture) {
        actual.push(total)
        forecastBase.push(null)
        forecastScenario.push(null)
      } else {
        actual.push(null)
        forecastBase.push(total === null ? 0 : total)

        const step = abs - (anchorMonthAbs + 1)
        const sim = step >= 0 && step < simulated.length ? simulated[step] : 0
        const base = total === null ? 0 : total
        forecastScenario.push(base + sim)
      }
    }

    const showScenario = Number(acqMultiplier) > 0

    return {
      labels,
      datasets: [
        {
          label: 'Actual',
          data: actual,
          borderColor: 'rgba(96,165,250,0.95)',
          backgroundColor: 'rgba(96,165,250,0.15)',
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
        },
        {
          label: 'Forecast (base)',
          data: forecastBase,
          borderColor: 'rgba(148,163,184,0.85)',
          backgroundColor: 'rgba(148,163,184,0.10)',
          borderWidth: 2,
          borderDash: [6, 6],
          tension: 0.25,
          pointRadius: 0,
        },
        ...(showScenario
          ? [
              {
                label: 'Forecast (scenario)',
                data: forecastScenario,
                borderColor: 'rgba(34,197,94,0.9)',
                backgroundColor: 'rgba(34,197,94,0.12)',
                borderWidth: 2,
                borderDash: [2, 4],
                tension: 0.25,
                pointRadius: 0,
              },
            ]
          : []),
      ],
    }
  }, [
    absRangeAll,
    acqMultiplier,
    anchorMonthAbs,
    effectiveHorizon,
    filteredCohorts,
    metric,
    simulated,
  ])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: 'rgba(226,232,240,0.85)', font: { size: 12, weight: '600' } },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(203,213,225,0.75)',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 14,
          },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: { color: 'rgba(203,213,225,0.75)' },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
    }),
    []
  )

  const header = useMemo(() => {
    if (metric === 'deposits') return 'Deposits'
    if (metric === 'depositsCount') return 'Deposits count'
    if (metric === 'withdrawals') return 'Withdrawals'
    return 'Net deposits'
  }, [metric])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* A) Forecast summary KPIs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontWeight: 900, color: '#e2e8f0' }}>Predictive Intelligence · {header}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ color: 'rgba(203,213,225,0.8)', fontSize: 12 }}>
            {anchorMonthAbs === null
              ? 'Last actual: —'
              : `Last actual: ${monthLabelFromAbs(anchorMonthAbs)}`}
          </div>
          <button
            onClick={() => setShowDebug((v) => !v)}
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.10)',
              background: showDebug ? 'rgba(96,165,250,0.12)' : 'rgba(2,6,23,0.25)',
              color: 'rgba(226,232,240,0.9)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
            title="Toggle debug panel"
          >
            Debug
          </button>
        </div>
      </div>

      {!forecastUsable ? (
        <div
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 12,
            color: 'rgba(226,232,240,0.85)',
            background: 'rgba(2,6,23,0.25)',
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Not enough cohort depth</div>
          <div style={{ fontSize: 13, color: 'rgba(226,232,240,0.75)' }}>
            Not enough cohort depth to forecast future months for this metric/filters.
          </div>
        </div>
      ) : null}

      {baseLimitedByDepth && forecastUsable ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(148,163,184,0.12)',
              border: '1px solid rgba(148,163,184,0.22)',
              color: 'rgba(226,232,240,0.85)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Base forecast limited by cohort depth → using pattern-based projection for scenario.
          </div>
        </div>
      ) : null}

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: 10 }}
      >
        {[
          {
            title: 'Next Month Forecast',
            value: forecastUsable ? forecastCards.next : null,
            sub: 'forecast (base + scenario)',
          },
          {
            title: `${Math.max(6, Number(effectiveHorizon) || 6)}-Month Forecast Total`,
            value: forecastUsable ? forecastCards.totalN : null,
            sub: 'sum of forecast months',
          },
          {
            title: 'Expected Growth Rate',
            value:
              forecastUsable && forecastCards.growth !== null
                ? `${(forecastCards.growth * 100).toFixed(1)}%`
                : null,
            sub: 'vs last actual month',
          },
          {
            title: 'Structural Risk Indicator',
            value: forecastCards.risk.label,
            sub: `GQI ${forecastCards.gqi === null ? '—' : formatPct(forecastCards.gqi)} · DI ${forecastCards.di === null ? '—' : formatPct(forecastCards.di)}`,
            tone: forecastCards.risk,
          },
        ].map((c) => (
          <div
            key={c.title}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '10px 12px',
              background: 'rgba(2,6,23,0.25)',
              minHeight: 70,
            }}
          >
            <div style={{ fontSize: 12, color: 'rgba(203,213,225,0.75)', fontWeight: 800 }}>
              {c.title}
            </div>
            <div style={{ fontSize: 20, color: '#e2e8f0', fontWeight: 900, marginTop: 6 }}>
              {c.title.includes('Risk') ? (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${c.tone?.border || 'rgba(255,255,255,0.10)'}`,
                    background: c.tone?.bg || 'rgba(148,163,184,0.12)',
                  }}
                >
                  {String(c.value || '—')}
                </span>
              ) : (
                formatCompactNumber(c.value, metricKind)
              )}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', marginTop: 2 }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Insights & Actions */}
      <div
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 12,
          background: 'rgba(2,6,23,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 800, color: '#e2e8f0' }}>Insights & Actions</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {insights.length > 2 ? (
              <button
                onClick={() => setShowAllInsights((v) => !v)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(2,6,23,0.25)',
                  color: 'rgba(226,232,240,0.9)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {showAllInsights ? 'Show top 2' : 'Show all'}
              </button>
            ) : null}

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setInsightMode('executive')}
                style={{
                  padding: '7px 10px',
                  borderRadius: 10,
                  border: `1px solid ${insightMode === 'executive' ? 'rgba(96,165,250,0.45)' : 'rgba(255,255,255,0.10)'}`,
                  background:
                    insightMode === 'executive' ? 'rgba(96,165,250,0.12)' : 'rgba(2,6,23,0.25)',
                  color: '#e2e8f0',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Executive
              </button>
              <button
                onClick={() => setInsightMode('operator')}
                style={{
                  padding: '7px 10px',
                  borderRadius: 10,
                  border: `1px solid ${insightMode === 'operator' ? 'rgba(96,165,250,0.45)' : 'rgba(255,255,255,0.10)'}`,
                  background:
                    insightMode === 'operator' ? 'rgba(96,165,250,0.12)' : 'rgba(2,6,23,0.25)',
                  color: '#e2e8f0',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Operator
              </button>
            </div>
          </div>
        </div>

        {totalsHistory.length < 3 && compositionSeries.length < 3 ? (
          <div style={{ fontSize: 12, color: 'rgba(203,213,225,0.75)' }}>
            No insights available (insufficient eligible months).
          </div>
        ) : insights.length ? (
          <InsightsPanel insights={insightsShown} mode={insightMode} />
        ) : (
          <div style={{ fontSize: 12, color: 'rgba(203,213,225,0.75)' }}>
            No insights available (no rules triggered).
          </div>
        )}
      </div>

      {/* E) Early warning indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {warningChips.length ? (
          warningChips.map((w) => (
            <div
              key={w.label}
              style={{
                padding: '6px 10px',
                borderRadius: 999,
                background: 'rgba(248,113,113,0.14)',
                border: '1px solid rgba(248,113,113,0.28)',
                color: '#fecaca',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {w.label}
            </div>
          ))
        ) : (
          <div style={{ color: 'rgba(203,213,225,0.7)', fontSize: 12 }}>
            No warnings triggered (based on recent history).
          </div>
        )}
      </div>

      {/* Forecast chart */}
      {forecastUsable ? (
        <div
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 12,
            background: 'rgba(2,6,23,0.25)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 800, color: '#e2e8f0' }}>Forecast trajectory</div>
            <div style={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
              last actual months + next {Math.max(6, Number(effectiveHorizon) || 6)} forecast months
            </div>
          </div>
          <div style={{ height: 260 }}>
            {chartModel ? <Line data={chartModel} options={chartOptions} /> : null}
          </div>
        </div>
      ) : null}

      {showDebug ? (
        <div
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 12,
            background: 'rgba(2,6,23,0.25)',
            fontSize: 12,
            color: 'rgba(226,232,240,0.85)',
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Debug</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))',
              gap: 8,
            }}
          >
            <div>Anchor: {anchorMonthAbs === null ? '—' : monthLabelFromAbs(anchorMonthAbs)}</div>
            <div>
              Total(anchor):{' '}
              {lastActualTotal === null ? '—' : formatCompactNumber(lastActualTotal, metricKind)}
            </div>
            <div>
              BaseForecast(anchor+1):{' '}
              {baseForecast[0]?.total === undefined
                ? '—'
                : formatCompactNumber(baseForecast[0].total, metricKind)}
            </div>
            <div>
              ScenarioForecast(anchor+1):{' '}
              {scenarioForecast[0]?.total === undefined
                ? '—'
                : formatCompactNumber(scenarioForecast[0].total, metricKind)}
            </div>
            <div>
              Pattern K: {patternK} (cohorts used: {cohortsUsed})
            </div>
            <div>
              Pattern[0..3]:{' '}
              {pattern
                .slice(0, 4)
                .map((x) => formatCompactNumber(x, metricKind))
                .join(' · ')}
            </div>
            <div>Rows iterated: {filteredCohorts.length}</div>
            <div>
              Coverage (anchor+6):{' '}
              {(() => {
                if (anchorMonthAbs === null) return '—'
                const targetAbs = anchorMonthAbs + 6
                let rowsWithOffset = 0
                let numericCount = 0
                for (const r of filteredCohorts) {
                  const baseAbs = Number(r?.baseAbs)
                  if (!Number.isFinite(baseAbs)) continue
                  const offset = targetAbs - baseAbs
                  if (offset < 0) continue
                  const vals = Array.isArray(r?.values) ? r.values : []
                  if (offset >= vals.length) continue
                  rowsWithOffset += 1
                  const n = Number(vals[offset])
                  if (Number.isFinite(n)) numericCount += 1
                }
                return `${rowsWithOffset} rows have values[offset] · ${numericCount} numeric`
              })()}
            </div>
            <div>
              Coverage (anchor+12):{' '}
              {(() => {
                if (anchorMonthAbs === null) return '—'
                const targetAbs = anchorMonthAbs + 12
                let rowsWithOffset = 0
                let numericCount = 0
                for (const r of filteredCohorts) {
                  const baseAbs = Number(r?.baseAbs)
                  if (!Number.isFinite(baseAbs)) continue
                  const offset = targetAbs - baseAbs
                  if (offset < 0) continue
                  const vals = Array.isArray(r?.values) ? r.values : []
                  if (offset >= vals.length) continue
                  rowsWithOffset += 1
                  const n = Number(vals[offset])
                  if (Number.isFinite(n)) numericCount += 1
                }
                return `${rowsWithOffset} rows have values[offset] · ${numericCount} numeric`
              })()}
            </div>
          </div>
        </div>
      ) : null}

      {/* Scenario simulator */}
      <div
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 14,
          background: 'rgba(2,6,23,0.25)',
        }}
      >
        <div style={{ fontWeight: 800, color: '#e2e8f0', marginBottom: 10 }}>
          Scenario simulator
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))',
            gap: 12,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(203,213,225,0.75)',
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              Monthly acquisition multiplier
            </div>
            <input
              type="range"
              min={0}
              max={150}
              step={5}
              value={acqMultiplier}
              onChange={(e) => setAcqMultiplier(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                fontSize: 12,
                color: 'rgba(226,232,240,0.8)',
              }}
            >
              <span>0%</span>
              <b>{acqMultiplier}%</b>
              <span>150%</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', marginTop: 6 }}>
              0% = base forecast only · 100% = repeat last-month acquisition pattern
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(203,213,225,0.75)',
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              Simulation horizon
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[6, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => setHorizon(n)}
                  disabled={n === 12 && !canUse12Months}
                  title={n === 12 && !canUse12Months ? 'not enough cohort depth' : ''}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1px solid ${effectiveHorizon === n ? 'rgba(96,165,250,0.45)' : 'rgba(255,255,255,0.10)'}`,
                    background:
                      effectiveHorizon === n ? 'rgba(96,165,250,0.12)' : 'rgba(2,6,23,0.25)',
                    color: n === 12 && !canUse12Months ? 'rgba(226,232,240,0.35)' : '#e2e8f0',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: n === 12 && !canUse12Months ? 'not-allowed' : 'pointer',
                    opacity: n === 12 && !canUse12Months ? 0.6 : 1,
                  }}
                >
                  {n} months
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', marginTop: 8 }}>
              Pattern uses last <b>{patternK}</b> cohorts (avg shape) · cohorts used: {cohortsUsed}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(203,213,225,0.75)' }}>K</span>
              <input
                type="number"
                value={patternK}
                min={1}
                max={12}
                onChange={(e) =>
                  setPatternK(Math.max(1, Math.min(12, Number(e.target.value) || 3)))
                }
                style={{
                  width: 70,
                  background: '#0d1a2c',
                  color: 'var(--text)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 10,
                  padding: '8px 10px',
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(203,213,225,0.75)',
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              Target (next month)
            </div>
            <input
              value={targetNextMonth}
              onChange={(e) => setTargetNextMonth(e.target.value)}
              placeholder={
                forecastCards.next === null ? '—' : String(Math.round(Number(forecastCards.next)))
              }
              style={{
                width: '100%',
                background: '#0d1a2c',
                color: 'var(--text)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10,
                padding: '8px 10px',
              }}
            />
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', marginTop: 8 }}>
              Required multiplier:{' '}
              {requiredMultiplierToHitTarget === null
                ? '—'
                : `${requiredMultiplierToHitTarget.toFixed(1)}%`}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', marginTop: 4 }}>
              Delta vs base (next month):{' '}
              {scenarioForecast[0]?.base === null || scenarioForecast[0]?.total === null
                ? '—'
                : formatCompactNumber(
                    Number(scenarioForecast[0].total) - Number(scenarioForecast[0].base),
                    metricKind
                  )}
            </div>
          </div>
        </div>
      </div>

      {/* D) Structural KPIs */}
      <div
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 14,
          background: 'rgba(2,6,23,0.25)',
        }}
      >
        <div style={{ fontWeight: 800, color: '#e2e8f0', marginBottom: 10 }}>Structural KPIs</div>

        {(() => {
          const comp = computeYearlyAverageCompositionShares({
            cohortRows: filteredCohorts,
            calendarEntries,
          })
          const di = comp.avgShares.current
          const gqi =
            comp.avgShares.prev2 !== null && comp.avgShares.older !== null
              ? comp.avgShares.prev2 + comp.avgShares.older
              : null

          const gqiTone =
            gqi === null ? 'neutral' : gqi < 0.3 ? 'danger' : gqi < 0.45 ? 'warn' : 'ok'
          const diTone = di === null ? 'neutral' : di > 0.7 ? 'danger' : di > 0.5 ? 'warn' : 'ok'

          const toneStyle = (tone) => {
            if (tone === 'danger')
              return {
                bg: 'rgba(248,113,113,0.14)',
                border: 'rgba(248,113,113,0.28)',
                fg: '#fecaca',
              }
            if (tone === 'warn')
              return { bg: 'rgba(234,179,8,0.14)', border: 'rgba(234,179,8,0.28)', fg: '#fde68a' }
            if (tone === 'ok')
              return { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.28)', fg: '#bbf7d0' }
            return {
              bg: 'rgba(148,163,184,0.12)',
              border: 'rgba(148,163,184,0.20)',
              fg: 'rgba(226,232,240,0.9)',
            }
          }

          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))',
                gap: 10,
              }}
            >
              {[
                {
                  title: 'Growth Quality Index (GQI) (carry-over strength: Prev2 + Older share)',
                  value: gqi,
                  tone: gqiTone,
                  helper:
                    'Higher = more compounding/retention-driven. <30% fragile, 30–45% healthy, >45% strong.',
                },
                {
                  title: 'Dependency Index (DI) (new acquisition dependence: Current cohort share)',
                  value: di,
                  tone: diTone,
                  helper:
                    'Higher = more acquisition-dependent. >70% risky, 50–65% balanced, <50% retention-driven.',
                },
              ].map((kpi) => {
                const t = toneStyle(kpi.tone)
                return (
                  <div
                    key={kpi.title}
                    style={{
                      border: `1px solid ${t.border}`,
                      borderRadius: 12,
                      padding: '12px 14px',
                      background: t.bg,
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 900 }}>
                      {kpi.title}
                    </div>
                    <div style={{ fontSize: 22, color: t.fg, fontWeight: 900, marginTop: 6 }}>
                      {kpi.value === null ? '—' : formatPct(kpi.value)}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.75)', marginTop: 2 }}>
                      {kpi.helper}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.65)', marginTop: 2 }}>
                      months used: {comp.monthsUsed}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
