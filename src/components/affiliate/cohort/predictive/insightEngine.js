const SEVERITY_RANK = {
  high: 0,
  medium: 1,
  low: 2,
  good: 3,
}

function clamp(arr, max) {
  return (Array.isArray(arr) ? arr : []).slice(0, max)
}

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n)
}

function avg(values) {
  const list = (Array.isArray(values) ? values : []).filter((x) => isFiniteNumber(x))
  if (!list.length) return null
  return list.reduce((s, x) => s + x, 0) / list.length
}

function pct(n) {
  if (!isFiniteNumber(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function lastN(series, n) {
  const list = Array.isArray(series) ? series.filter(Boolean) : []
  return list.slice(Math.max(0, list.length - n))
}

function isIncreasing3(values) {
  const xs = (Array.isArray(values) ? values : []).filter((x) => isFiniteNumber(x))
  if (xs.length < 3) return false
  const last3 = xs.slice(-3)
  return last3[0] < last3[1] && last3[1] < last3[2]
}

function isDecreasing3(values) {
  const xs = (Array.isArray(values) ? values : []).filter((x) => isFiniteNumber(x))
  if (xs.length < 3) return false
  const last3 = xs.slice(-3)
  return last3[0] > last3[1] && last3[1] > last3[2]
}

function pushUnique(insights, insight) {
  if (!insight || !insight.id) return
  if (insights.some((x) => x.id === insight.id)) return
  insights.push(insight)
}

export function generatePredictiveInsights(input) {
  const {
    metric,
    selectedYear,
    lastActualValue,
    nextMonthForecast,
    baseNextMonthForecast,
    forecastGrowth,
    gqi,
    di,
    series = [], // [{ abs, label, gqi, di, shares: { current, prev2, older } }]
    totalsSeries = [], // [Total(M)] last eligible months (up to 6)
    scenarioDelta,
  } = input || {}

  const insights = []

  const recent6 = lastN(series, 6)
  const recent3 = lastN(series, 3)

  const totals6 = lastN(Array.isArray(totalsSeries) ? totalsSeries : [], 6)

  const totalsIncreasing3 = isIncreasing3(totals6)
  const totalsDecreasing3 = isDecreasing3(totals6)

  const diSeries = recent6.map((p) => p.di)
  const gqiSeries = recent6.map((p) => p.gqi)

  const diAvg = avg(diSeries)
  const gqiAvg = avg(gqiSeries)

  const diHigh3Consecutive =
    recent3.length === 3 && recent3.every((p) => isFiniteNumber(p.di) && p.di > 0.7)

  const metricLabel =
    metric === 'withdrawals'
      ? 'Withdrawals'
      : metric === 'deposits'
        ? 'Deposits'
        : metric === 'depositsCount'
          ? 'Deposits count'
          : 'Net deposits'

  const latestPoint = series.length ? series[series.length - 1] : null
  const latestOlder = latestPoint?.shares?.older

  // A) Over-dependence on acquisition
  if ((isFiniteNumber(diAvg) && diAvg > 0.7) || diHigh3Consecutive) {
    pushUnique(insights, {
      id: 'over_dependence_acquisition',
      severity: 'high',
      title: 'Over-dependence on new acquisition',
      why: clamp(
        [
          isFiniteNumber(diAvg) ? `DI avg (last ${recent6.length}m): ${pct(diAvg)}` : null,
          diHigh3Consecutive ? `DI > 70% for 3 consecutive months` : null,
          isFiniteNumber(latestOlder)
            ? `Older share (latest month): ${pct(latestOlder)} (low carry-over)`
            : null,
        ].filter(Boolean),
        3
      ),
      do_now: clamp(
        [
          'Shift budget towards CRM/reactivation and deposit nudges',
          'Identify low-retention affiliates and reduce exposure',
          'Improve onboarding-to-second-deposit sequence (D+3, D+10)',
        ],
        3
      ),
      expected_impact: clamp(['+5–10pp GQI in 6–10 weeks', '-5–10pp DI in 6–10 weeks'], 2),
      owner: 'CRM/Retention',
      next_check: '14 days',
    })
  }

  // B) Fragile compounding / weak carry-over
  if (isFiniteNumber(gqi) && gqi < 0.3) {
    pushUnique(insights, {
      id: 'weak_carry_over',
      severity: 'high',
      title: 'Weak carry-over: retention not compounding',
      why: clamp(
        [
          `GQI: ${pct(gqi)} (<30% fragile)`,
          isFiniteNumber(gqiAvg) ? `GQI avg (last ${recent6.length}m): ${pct(gqiAvg)}` : null,
        ].filter(Boolean),
        3
      ),
      do_now: clamp(
        [
          'Launch lifecycle offers for cohorts at D+7 / D+14 / D+30',
          'Run reactivation on recent cohorts (2nd/3rd deposit nudges)',
          'Segment by affiliate to find retention winners/losers and replicate',
        ],
        3
      ),
      expected_impact: clamp(['+5–15pp GQI in 6–10 weeks'], 2),
      owner: 'CRM/Retention',
      next_check: '14 days',
    })
  }

  // C) Revenue contraction risk
  if (isFiniteNumber(nextMonthForecast) && isFiniteNumber(lastActualValue) && lastActualValue > 0) {
    if (nextMonthForecast < lastActualValue * 0.85) {
      const dropPct = (nextMonthForecast - lastActualValue) / lastActualValue
      pushUnique(insights, {
        id: 'revenue_contraction_risk',
        severity: 'high',
        title: 'Revenue contraction risk next month',
        why: clamp(
          [
            `${metricLabel}: next month forecast ${pct(dropPct)} vs last actual`,
            isFiniteNumber(baseNextMonthForecast)
              ? `Base forecast (next month): ${isFiniteNumber(baseNextMonthForecast) ? baseNextMonthForecast.toFixed(0) : '—'}`
              : null,
            isFiniteNumber(forecastGrowth)
              ? `Forecast growth vs last actual: ${pct(forecastGrowth)}`
              : null,
            isFiniteNumber(scenarioDelta)
              ? `Scenario delta vs base (next month): ${scenarioDelta >= 0 ? '+' : ''}${pct(scenarioDelta)}`
              : null,
          ].filter(Boolean),
          3
        ),
        do_now: clamp(
          [
            'Calculate acquisition gap to cover the shortfall',
            'Run short-term reactivation campaign on recent cohorts',
            'Apply traffic quality guardrails (stop worst sources)',
          ],
          3
        ),
        expected_impact: clamp(
          ['Stabilize next-month revenue trajectory', 'Reduce downside volatility'],
          2
        ),
        owner: 'Acquisition',
        next_check: '14 days',
      })
    }
  }

  // D) Healthy / scalable state
  if (isFiniteNumber(gqi) && isFiniteNumber(di) && gqi >= 0.45 && di >= 0.5 && di <= 0.65) {
    pushUnique(insights, {
      id: 'healthy_scalable',
      severity: 'good',
      title: 'Healthy compounding: scale with guardrails',
      why: clamp([`GQI: ${pct(gqi)} (strong)`, `DI: ${pct(di)} (balanced)`], 3),
      do_now: clamp(
        ['Scale acquisition gradually (+10–20%) while monitoring DI', 'Keep CRM cadence stable'],
        3
      ),
      expected_impact: clamp(['Growth without degrading DI', 'Sustained carry-over'], 2),
      owner: 'Acquisition',
      next_check: '30 days',
    })
  }

  // E) Improving trend
  const gqiImproving3 = isIncreasing3(series.map((p) => p.gqi))
  const diImproving3 = isDecreasing3(series.map((p) => p.di))

  if (gqiImproving3 || diImproving3 || totalsIncreasing3) {
    const alreadyHealthy =
      isFiniteNumber(gqi) && isFiniteNumber(di) && gqi >= 0.45 && di >= 0.5 && di <= 0.65
    pushUnique(insights, {
      id: 'trend_improving',
      severity: alreadyHealthy ? 'good' : 'medium',
      title: 'Trend improving: momentum building',
      why: clamp(
        [
          gqiImproving3 ? 'GQI increasing for 3 consecutive months' : null,
          diImproving3 ? 'DI decreasing for 3 consecutive months' : null,
          totalsIncreasing3
            ? `Totals increasing for 3 consecutive months (last ${totals6.length}m window)`
            : null,
          selectedYear ? `Observed within selected year: ${selectedYear}` : null,
        ].filter(Boolean),
        3
      ),
      do_now: clamp(
        [
          'Double-down on what improved the trend (affiliate mix, CRM cadence, onboarding)',
          'Keep guardrails: block low-quality sources if DI rebounds',
          'Monitor weekly for 4–6 weeks to confirm persistence',
        ],
        3
      ),
      expected_impact: clamp(
        ['Trend persistence into next cohorts', 'Lower forecast volatility'],
        2
      ),
      owner: 'Affiliate/Traffic Quality',
      next_check: '14 days',
    })
  }

  // F) Downtrend warning based on totals when composition signals are scarce
  if (totalsDecreasing3) {
    pushUnique(insights, {
      id: 'totals_downtrend',
      severity: 'medium',
      title: 'Totals trending down (last months)',
      why: clamp(
        [`Totals decreasing for 3 consecutive months (last ${totals6.length}m window)`],
        3
      ),
      do_now: clamp(
        [
          'Check affiliate mix shift',
          'Review retention cadence on last cohorts',
          'Validate traffic quality',
        ],
        3
      ),
      expected_impact: clamp(['Reduce downside drift', 'Stabilize next-month trajectory'], 2),
      owner: 'Affiliate/Traffic Quality',
      next_check: '14 days',
    })
  }

  // Sort and cap output (top 3–6 desired by UI)
  insights.sort((a, b) => {
    const ra = SEVERITY_RANK[a.severity] ?? 99
    const rb = SEVERITY_RANK[b.severity] ?? 99
    if (ra !== rb) return ra - rb
    return String(a.title || '').localeCompare(String(b.title || ''))
  })

  return insights
}
