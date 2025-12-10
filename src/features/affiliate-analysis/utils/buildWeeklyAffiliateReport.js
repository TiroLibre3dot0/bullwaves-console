import { formatEuro, formatNumberShort, formatPercent } from '../../../lib/formatters'

const normalizeDate = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatPeriodLabel = (fromDate, toDate) => {
  const start = normalizeDate(fromDate)
  const end = normalizeDate(toDate)
  if (!start || !end) return 'This period'
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

const sumField = (rows = [], field) => rows.reduce((acc, r) => acc + (Number(r?.[field]) || 0), 0)

const normalizeSeries = (series = []) => [...series]
  .map((entry) => ({
    monthKey: entry?.monthKey || entry?.key || 'unknown',
    monthLabel: entry?.monthLabel || entry?.label || entry?.monthKey || 'Unknown',
    monthIndex: typeof entry?.monthIndex === 'number' ? entry.monthIndex : 99,
    value: Number(entry?.value ?? entry ?? 0),
  }))
  .sort((a, b) => (a.monthIndex - b.monthIndex) || (a.monthKey || '').localeCompare(b.monthKey || ''))

const calculateTrend = (series = []) => {
  if (!series || series.length < 2) return null
  const sorted = normalizeSeries(series)
  const current = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]
  const delta = current.value - previous.value
  const pct = previous.value ? (delta / Math.abs(previous.value)) * 100 : 0
  const direction = pct > 5 ? 'up' : pct < -5 ? 'down' : 'flat'
  return { current, previous, delta, pct, direction }
}

const extractYear = (label = '') => {
  const tokens = String(label).trim().split(/\s+/)
  const last = tokens[tokens.length - 1]
  const num = Number(last)
  return Number.isFinite(num) && last.length >= 4 ? num : null
}

const monthName = (label = '') => String(label).trim().split(' ')[0] || label || '—'

const derivePeriodLabels = (monthlyProfit = [], { selectedYear, allYearsRange } = {}) => {
  const availableYears = Array.isArray(allYearsRange)
    ? Array.from(new Set(allYearsRange.filter((y) => Number.isFinite(y)))).sort((a, b) => a - b)
    : []
  const minYear = availableYears.length ? availableYears[0] : null
  const maxYear = availableYears.length ? availableYears[availableYears.length - 1] : null
  const isAllYears = !selectedYear || selectedYear === 'all'

  if (!monthlyProfit || monthlyProfit.length === 0) {
    if (isAllYears) {
      const rangeLabel = minYear && maxYear ? (minYear === maxYear ? `${minYear}` : `${minYear}–${maxYear}`) : 'All years'
      const displayLabel = rangeLabel === 'All years' ? 'All years' : `${rangeLabel} (All years)`
      return {
        periodSpanLabel: displayLabel,
        currentPeriodLabel: displayLabel,
        previousPeriodLabel: 'Previous period',
        periodMeta: {
          periodType: 'ALL',
          year: null,
          yearRange: rangeLabel,
          periodRangeLabel: rangeLabel,
          displayLabel,
        },
      }
    }

    const year = Number.isFinite(Number(selectedYear)) ? Number(selectedYear) : new Date().getFullYear()
    const rangeLabel = `Jan–Dec ${year}`
    const displayLabel = `${rangeLabel} (YTD)`
    return {
      periodSpanLabel: displayLabel,
      currentPeriodLabel: displayLabel,
      previousPeriodLabel: 'Previous period',
      periodMeta: {
        periodType: 'YTD',
        year,
        periodRangeLabel: rangeLabel,
        displayLabel,
      },
    }
  }

  const sorted = normalizeSeries(monthlyProfit)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const firstYear = extractYear(first.monthLabel)
  const lastYear = extractYear(last.monthLabel) || firstYear
  const sameYear = firstYear && lastYear && firstYear === lastYear
  const coversFromJan = first.monthIndex === 0
  const coversFullYear = coversFromJan && (last.monthIndex >= 11) && sameYear

  let periodSpanLabel = last.monthLabel || 'This period'
  if (coversFullYear) {
    periodSpanLabel = `Jan–Dec ${lastYear} (YTD)`
  } else if (coversFromJan && sameYear) {
    periodSpanLabel = `Jan–${monthName(last.monthLabel)} ${lastYear} (YTD)`
  } else if (sameYear) {
    periodSpanLabel = `${monthName(first.monthLabel)}–${last.monthLabel}`
  } else if (first.monthLabel && last.monthLabel) {
    periodSpanLabel = `${first.monthLabel} – ${last.monthLabel}`
  }

  let currentPeriodLabel = last.monthLabel || periodSpanLabel
  const previousPeriodLabel = sorted.length > 1 ? (sorted[sorted.length - 2].monthLabel || 'Previous period') : 'Previous period'

  let periodMeta = {
    periodType: 'YTD',
    year: lastYear || firstYear || new Date().getFullYear(),
    periodRangeLabel: periodSpanLabel.replace(' (YTD)', ''),
    displayLabel: `${periodSpanLabel.replace(' (YTD)', '')} (YTD)`,
  }

  if (isAllYears) {
    const rangeLabel = minYear && maxYear
      ? (minYear === maxYear ? `${minYear}` : `${minYear}–${maxYear}`)
      : (firstYear && lastYear ? (firstYear === lastYear ? `${firstYear}` : `${firstYear}–${lastYear}`) : periodSpanLabel)
    const displayLabel = rangeLabel ? `${rangeLabel} (All years)` : 'All years'
    periodSpanLabel = displayLabel
    currentPeriodLabel = displayLabel
    periodMeta = {
      periodType: 'ALL',
      year: null,
      yearRange: rangeLabel,
      periodRangeLabel: rangeLabel || periodSpanLabel,
      displayLabel,
    }
  } else if (Number.isFinite(Number(selectedYear))) {
    const year = Number(selectedYear)
    const ytdRangeLabel = coversFromJan ? (coversFullYear ? `Jan–Dec ${year}` : `Jan–${monthName(last.monthLabel)} ${year}`) : periodSpanLabel.replace(' (YTD)', '')
    const displayLabel = coversFromJan ? `${ytdRangeLabel} (YTD)` : ytdRangeLabel
    periodSpanLabel = displayLabel
    currentPeriodLabel = currentPeriodLabel || displayLabel
    periodMeta = {
      periodType: coversFromJan ? 'YTD' : 'PARTIAL_YEAR',
      year,
      periodRangeLabel: ytdRangeLabel,
      displayLabel,
    }
  }

  return { periodSpanLabel, currentPeriodLabel, previousPeriodLabel, periodMeta }
}

const monthKeyFromRow = (row = {}) => row.monthKey || 'unknown'

const monthLabelFromRow = (row = {}) => row.monthLabel || row.monthKey || 'Unknown'

const buildMonthlyAggregates = (mediaRows = [], paymentsRows = []) => {
  const map = new Map()
  mediaRows.forEach((r) => {
    const key = monthKeyFromRow(r)
    const existing = map.get(key) || { monthKey: key, monthLabel: monthLabelFromRow(r), monthIndex: typeof r.monthIndex === 'number' ? r.monthIndex : 99, netDeposits: 0, pl: 0, payments: 0 }
    existing.netDeposits += Number(r?.netDeposits) || 0
    existing.pl += Number(r?.pl) || 0
    map.set(key, existing)
  })
  paymentsRows.forEach((p) => {
    const key = monthKeyFromRow(p)
    const existing = map.get(key) || { monthKey: key, monthLabel: monthLabelFromRow(p), monthIndex: typeof p.monthIndex === 'number' ? p.monthIndex : 99, netDeposits: 0, pl: 0, payments: 0 }
    existing.payments += Number(p?.amount) || 0
    map.set(key, existing)
  })

  const aggregates = Array.from(map.values())
    .map((m) => ({ ...m, profit: (m.pl || 0) - (m.payments || 0) }))
    .sort((a, b) => (a.monthIndex - b.monthIndex) || (a.monthKey || '').localeCompare(b.monthKey || ''))

  const monthlyNetDeposits = aggregates.map((m) => ({ monthKey: m.monthKey, monthLabel: m.monthLabel, monthIndex: m.monthIndex, value: m.netDeposits }))
  const monthlyPL = aggregates.map((m) => ({ monthKey: m.monthKey, monthLabel: m.monthLabel, monthIndex: m.monthIndex, value: m.pl }))
  const monthlyProfit = aggregates.map((m) => ({ monthKey: m.monthKey, monthLabel: m.monthLabel, monthIndex: m.monthIndex, value: m.profit }))

  const bestMonth = aggregates.reduce((best, m) => {
    if (best === null || (m.profit || 0) > (best.profit || 0)) return m
    return best
  }, null)

  const worstMonth = aggregates.reduce((worst, m) => {
    if (worst === null || (m.profit || 0) < (worst.profit || 0)) return m
    return worst
  }, null)

  return {
    monthlyNetDeposits,
    monthlyPL,
    monthlyProfit,
    bestMonth,
    worstMonth,
  }
}

const computeChurnPct = (mediaRows = []) => {
  if (!mediaRows.length) return 0
  const weighted = mediaRows.reduce((acc, row) => {
    const weight = Number(row?.registrations) || 1
    return acc + weight * (Number(row?.churnPct) || 0)
  }, 0)
  const regSum = mediaRows.reduce((acc, row) => acc + (Number(row?.registrations) || 0), 0)
  const divisor = regSum || mediaRows.length
  return divisor ? weighted / divisor : 0
}

export const deriveAffiliateKpis = ({ mediaRows = [], paymentsRows = [] } = {}) => {
  const totalNetDeposits = sumField(mediaRows, 'netDeposits')
  const totalPL = sumField(mediaRows, 'pl')
  const totalPayments = paymentsRows.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0)
  const registrations = sumField(mediaRows, 'registrations')
  const ftd = sumField(mediaRows, 'ftd')
  const qftd = sumField(mediaRows, 'qftd')
  const totalProfit = totalPL - totalPayments
  const roi = totalPayments ? (totalProfit / Math.max(Math.abs(totalPayments), 1)) * 100 : 0
  const cpa = ftd ? Math.abs(totalPayments) / Math.max(ftd, 1) : 0
  const arpu = registrations ? totalPL / Math.max(registrations, 1) : 0
  const churnPct = computeChurnPct(mediaRows)

  const monthly = buildMonthlyAggregates(mediaRows, paymentsRows)

  return {
    totalNetDeposits,
    totalPL,
    totalProfit,
    totalPayments,
    registrations,
    ftd,
    qftd,
    roi,
    cpa,
    arpu,
    churnPct,
    bestMonth: monthly.bestMonth,
    worstMonth: monthly.worstMonth,
    monthlyNetDeposits: monthly.monthlyNetDeposits,
    monthlyPL: monthly.monthlyPL,
    monthlyProfit: monthly.monthlyProfit,
  }
}

export const buildInsightTextBlocks = (kpis = {}, { affiliateName, periodLabel } = {}) => {
  const {
    totalNetDeposits = 0,
    totalPL = 0,
    totalProfit = 0,
    totalPayments = 0,
    registrations = 0,
    ftd = 0,
    qftd = 0,
    roi = 0,
    cpa = 0,
    arpu = 0,
    churnPct = 0,
    bestMonth,
    worstMonth,
    monthlyNetDeposits = [],
    monthlyProfit = [],
    monthlyPL = [],
    cohortHasData = false,
    cohortBreakEvenLabel,
    cohortBreakEvenPeriods,
    periodSpanLabel,
    currentPeriodLabel,
    periodMeta,
  } = kpis || {}

  const subject = affiliateName || 'this affiliate'
  const windowLabel = periodMeta?.displayLabel || currentPeriodLabel || periodSpanLabel || periodLabel || 'this period'
  const ftdRatio = registrations ? (ftd / Math.max(registrations, 1)) * 100 : 0
  const qftdRatio = ftd ? (qftd / Math.max(ftd, 1)) * 100 : 0
  const payoutRatio = totalNetDeposits ? (totalPayments / Math.max(Math.abs(totalNetDeposits), 1)) * 100 : 0
  const marginPct = totalPL ? (totalProfit / Math.max(totalPL, 1)) * 100 : 0
  const netTrend = calculateTrend(monthlyNetDeposits)
  const profitTrend = calculateTrend(monthlyProfit)
  const monthSpread = (bestMonth?.profit ?? null) !== null && (worstMonth?.profit ?? null) !== null
    ? (bestMonth.profit || 0) - (worstMonth.profit || 0)
    : null

  const mixSection = {
    title: 'Acquisition Mix',
    bullets: [
      `Volume in ${windowLabel}: **${formatNumberShort(registrations)} regs**, **${formatNumberShort(ftd)} FTD**; conversion ${formatPercent(ftdRatio || 0, 1)} with ${formatPercent(qftdRatio || 0, 1)} qualified.`,
      netTrend ? `Momentum: net deposits ${netTrend.direction === 'down' ? 'softened' : 'improved'} ${formatEuro(netTrend.delta)} (${formatPercent(netTrend.pct || 0, 1)} vs prior month).` : 'Momentum: stable flow; monitor week-on-week shifts.',
    ],
  }

  const revenueSection = {
    title: 'Revenue & Profitability',
    bullets: [
      `Period profit **${formatEuro(totalProfit)}** on PL **${formatEuro(totalPL)}** with payouts **${formatEuro(totalPayments)}**; margin ${formatPercent(marginPct || 0, 1)} and ROI ${formatPercent(roi || 0, 1)}.`,
      monthSpread !== null ? `Volatility: best month (${bestMonth?.monthLabel || bestMonth?.monthKey || '—'}) beat worst (${worstMonth?.monthLabel || worstMonth?.monthKey || '—'}) by ${formatEuro(monthSpread)}, indicating ${monthSpread > 0 ? 'swingy performance' : 'flat trend'}.` : 'Volatility: limited signal; keep watching month-to-month swings.',
    ],
  }

  const efficiencySection = {
    title: 'Efficiency Metrics',
    bullets: [
      `Payout efficiency: CPA ${formatEuro(Math.round(cpa || 0))} vs ARPU ${formatEuro(Math.round(arpu || 0))}; ${cpa > arpu ? 'payback tight—renegotiate or optimise mix.' : 'headroom to scale while holding payout discipline.'}`,
      `Payout ratio ${formatPercent(payoutRatio || 0, 1)}; profit trend ${profitTrend ? profitTrend.direction : 'stable'} (${profitTrend ? formatEuro(profitTrend.delta) : 'N/A'}) vs last month.`,
    ],
  }

  const qualitySection = {
    title: 'User Quality Indicators',
    bullets: [
      `Quality: churn ${formatPercent(churnPct || 0, 1)}; QFTD depth ${formatPercent(qftdRatio || 0, 1)} implies ${qftdRatio >= 60 ? 'healthy' : qftdRatio >= 40 ? 'mixed' : 'weak'} retention outlook.`,
      cohortHasData ? `Cohort payback: ${cohortBreakEvenLabel || 'Not reached'} (${cohortBreakEvenPeriods !== null ? `${cohortBreakEvenPeriods.toFixed(1)} months` : 'still negative'}).` : 'Cohort: not in Top 10 PL file; run cohort sampling before scaling.',
    ],
  }

  const performanceRecap = [mixSection, revenueSection, efficiencySection, qualitySection]

  const downsideBias = []
  if (netTrend && netTrend.direction === 'down') downsideBias.push('Net deposits momentum cooling; revisit channel mix and landing conversion to protect volume.')
  if (profitTrend && profitTrend.direction === 'down') downsideBias.push('Profit curve rolling over; trim payouts or pause low-ROI segments until margin stabilises.')
  if (!profitTrend && roi < 0) downsideBias.push('Negative ROI without an improving trend increases payout risk; enforce tighter CPA caps.')
  if (cpa > (arpu || 1)) downsideBias.push('CPA above ARPU suggests weak payback; renegotiate or narrow targeting before scaling.')
  if (churnPct > 25) downsideBias.push('Elevated churn; retention drag may blunt PL gains—consider lifecycle/CRM fixes.')
  if (cohortHasData && cohortBreakEvenPeriods && cohortBreakEvenPeriods > 3) downsideBias.push('Slow cohort payback (>3 months) ties up capital; reduce bonuses or shift spend to faster cohorts.')
  if (!downsideBias.length) downsideBias.push('No acute downside signals; keep an eye on payout creep and conversion softness.')

  const upsidePotential = []
  if (roi > 10) upsidePotential.push('ROI in a scalable band; incremental spend can be tested within current payout structure.')
  if (netTrend && netTrend.direction === 'up') upsidePotential.push('Net deposits accelerating; lean into top-performing sources while guardrailing CPA.')
  if (profitTrend && profitTrend.direction === 'up') upsidePotential.push('Profit momentum improving; consider staged budget lifts aligned to profitable months.')
  if (qftdRatio >= 60) upsidePotential.push('High QFTD ratio signals strong lead quality—prioritise sources delivering this mix.')
  if (cohortHasData && cohortBreakEvenPeriods !== null && cohortBreakEvenPeriods <= 2) upsidePotential.push(`Fast cohort payback (${cohortBreakEvenLabel}); room to scale without heavy cash drag.`)
  if (!upsidePotential.length) upsidePotential.push('Upside requires steadier conversion and payout discipline; test creative/offer tweaks.')

  const outlook = []
  const profitable = totalProfit >= 0
  const trendWord = profitTrend?.direction === 'down' ? 'softening' : profitTrend?.direction === 'up' ? 'improving' : 'stable'
  outlook.push(`${profitable ? 'Constructive' : 'Cautious'} outlook: profit trend is ${trendWord} with ROI ${formatPercent(roi || 0, 1)} in ${windowLabel}.`)
  outlook.push(cpa > arpu ? 'Priority: compress CPA below ARPU and defend margin before expanding spend.' : 'Priority: maintain ROI while scaling channels that meet CPA guardrails.')
  if (churnPct) outlook.push(`Retention watch: churn at ${formatPercent(churnPct || 0, 1)}; invest in post-FTD journeys to lift ARPU.`)
  if (cohortHasData && cohortBreakEvenPeriods !== null) outlook.push(`Cohort payback at ${cohortBreakEvenLabel}; adjust payouts if the horizon drifts beyond 3 months.`)
  if (!cohortHasData) outlook.push('Gather cohort data to validate payback before aggressive scaling.')
  outlook.push(`Overall: ${subject} shows ${roi >= 0 ? 'scaling potential' : 'payback risk'} driven by ${qftdRatio >= 50 ? 'solid traffic quality' : 'conversion softness and payout pressure'}.`)
  if (outlook.length > 5) outlook.length = 5

  const recommendedActions = []
  if (cpa > arpu) recommendedActions.push('Rebalance spend toward sources delivering CPA below ARPU; negotiate payout tiers where ROI is thin.')
  if (qftdRatio >= 60) recommendedActions.push('Reinforce high-quality channels (QFTD > 60%) with incremental budget and tighter tracking.')
  if (netTrend && netTrend.direction === 'up') recommendedActions.push('Scale investment during months with rising net deposits; cap bids on flat/declining weeks.')
  if (cohortHasData && cohortBreakEvenPeriods && cohortBreakEvenPeriods > 3) recommendedActions.push('Shorten cohort payback by reducing bonuses or delaying payouts until Month 3 cash recovery.')
  if (profitTrend && profitTrend.direction === 'down') recommendedActions.push('Freeze low-ROI segments; retest creative/offer to restore profit slope before scaling again.')
  if (!recommendedActions.length) recommendedActions.push('Maintain current mix, monitor CPA/ROI weekly, and prepare a test budget for top-quality channels.')
  if (recommendedActions.length > 5) recommendedActions.length = 5

  return {
    performanceRecap,
    downsideBias,
    upsidePotential,
    outlook,
    recommendedActions,
  }
}

export const buildWeeklyAffiliateReport = ({
  affiliateId,
  affiliateName,
  fromDate,
  toDate,
  mediaRows = [],
  paymentsRows = [],
  cohortBreakEven,
  selectedYear,
  allYearsRange,
} = {}) => {
  const kpis = deriveAffiliateKpis({ mediaRows, paymentsRows })
  const profitTrend = calculateTrend(kpis.monthlyProfit)
  const { periodSpanLabel, currentPeriodLabel, previousPeriodLabel, periodMeta } = derivePeriodLabels(kpis.monthlyProfit, { selectedYear, allYearsRange })
  kpis.periodSpanLabel = periodSpanLabel || profitTrend?.current?.monthLabel || formatPeriodLabel(fromDate, toDate)
  const periodLabel = kpis.periodSpanLabel || profitTrend?.current?.monthLabel || formatPeriodLabel(fromDate, toDate)
  kpis.currentPeriodLabel = currentPeriodLabel || profitTrend?.current?.monthLabel || kpis.periodSpanLabel || periodLabel
  kpis.previousPeriodLabel = previousPeriodLabel || profitTrend?.previous?.monthLabel || 'Previous period'
  kpis.periodMeta = periodMeta || { periodType: 'YTD', year: new Date().getFullYear(), periodRangeLabel: kpis.periodSpanLabel, displayLabel: `${kpis.periodSpanLabel} (YTD)` }
  if (cohortBreakEven) {
    kpis.cohortHasData = Boolean(cohortBreakEven.hasCohortData)
    kpis.cohortBreakEvenLabel = cohortBreakEven.breakEvenLabel
    kpis.cohortBreakEvenPeriods = cohortBreakEven.breakEvenMonths
  } else {
    kpis.cohortHasData = false
    kpis.cohortBreakEvenLabel = 'Cohort not available'
    kpis.cohortBreakEvenPeriods = null
  }
  const summaryTextBlocks = buildInsightTextBlocks(kpis, { affiliateName, periodLabel })

  return {
    affiliateId,
    affiliateName,
    periodLabel,
    periodMeta: kpis.periodMeta,
    currentPeriodLabel: kpis.currentPeriodLabel,
    previousPeriodLabel: kpis.previousPeriodLabel,
    kpis,
    summaryTextBlocks,
  }
}

export default buildWeeklyAffiliateReport
