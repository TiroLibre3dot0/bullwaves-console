import React, { useMemo } from 'react'
import { formatPercent, formatNumberShort, normalizeKey } from '../lib/formatters'

const monthLabels = Array.from({ length: 12 }, (_, idx) => `M${idx}`)

const heatColor = (value) => {
  if (value === null || value === undefined) return 'transparent'
  if (value >= 90) return 'rgba(34,197,94,0.22)'
  if (value >= 70) return 'rgba(74,222,128,0.18)'
  if (value >= 50) return 'rgba(234,179,8,0.20)'
  if (value >= 20) return 'rgba(248,113,113,0.18)'
  return 'rgba(248,113,113,0.28)'
}

const heatText = (value) => {
  if (value === null || value === undefined) return '#cbd5e1'
  if (value >= 80) return '#e2e8f0'
  if (value >= 50) return '#fef3c7'
  return '#fecdd3'
}

const avg = (values = []) => {
  const valid = values.filter((v) => Number.isFinite(v))
  if (!valid.length) return null
  return valid.reduce((s, v) => s + v, 0) / valid.length
}

const normalizeRow = (row, friendlyCohortLabel, calendarMonths) => {
  const base = Number(row?.months?.[0] ?? 0)
  const normalized = (row?.months ?? []).map((v, idx) => {
    if (idx === 0) return base ? 100 : null
    if (!base) return null
    return (Number(v || 0) / base) * 100
  })

  const fallbackLabel = row?.monthIndex !== undefined && row?.monthIndex !== null
    ? calendarMonths[row.monthIndex] || `Month ${row.monthIndex}`
    : 'Cohort'

  return {
    ...row,
    base,
    normalized,
    cohortLabel: row?.cohortLabel || friendlyCohortLabel(row?.cohortDate || fallbackLabel),
  }
}

const computeChurn = (normalizedRows) => {
  const m1 = avg(normalizedRows.map((r) => r.normalized[1]))
  const m3 = avg(normalizedRows.map((r) => r.normalized[3]))
  const m6 = avg(normalizedRows.map((r) => r.normalized[6]))

  const available = [m1, m3, m6].filter((v) => v !== null)
  const score = available.length ? available.reduce((s, v) => s + v, 0) / available.length : null

  if (score === null) {
    return { m1, m3, m6, score: null, status: 'No data', tone: 'neutral', color: '#94a3b8' }
  }

  if (score >= 75) return { m1, m3, m6, score, status: 'Healthy', tone: 'positive', color: '#22c55e' }
  if (score >= 50) return { m1, m3, m6, score, status: 'Warning', tone: 'warning', color: '#eab308' }
  return { m1, m3, m6, score, status: 'Red flag', tone: 'negative', color: '#ef4444' }
}

const computeYoY = (rowsByYear) => {
  const years = Array.from(rowsByYear.keys()).sort((a, b) => a - b)
  if (years.length < 2) return null
  const latest = years[years.length - 1]
  const prev = years[years.length - 2]
  const latestAvg = avg(rowsByYear.get(latest)?.map((r) => r.normalized[3]) || [])
  const prevAvg = avg(rowsByYear.get(prev)?.map((r) => r.normalized[3]) || [])
  if (latestAvg === null || prevAvg === null) return null
  const delta = latestAvg - prevAvg
  return { latest, prev, latestAvg, prevAvg, delta }
}

const buildInsights = ({ normalizedRows, churn, baseStats, yoyTrend }) => {
  if (!normalizedRows.length) return ['No cohort data available for the selected filters.']

  const insights = []
  const { m1, m3, m6, status } = churn

  if (m1 !== null && m1 < 60 && m6 !== null && m6 < 45) {
    insights.push('Cohorts show strong early decay with no long-term stabilization.')
  } else if (m1 !== null && m1 >= 80 && (m3 ?? 0) >= 65) {
    insights.push('Early retention is strong; focus on sustaining value past Month 3.')
  }

  if (m3 !== null && m6 !== null) {
    const drift = m6 - m3
    if (drift < -8) insights.push('Economic value keeps decaying after Month 3; long-tail retention is weak.')
    else if (Math.abs(drift) <= 5) insights.push('Value stabilizes after Month 3; decay slows in later months.')
  }

  if (baseStats?.stable && m1 !== null && m1 < 70) {
    insights.push('Deposit average remains stable; decay is driven by a reduction in active users/retention.')
  }

  if (yoyTrend) {
    const { delta, latest, prev } = yoyTrend
    const trendLabel = delta >= 5
      ? `Recent cohorts show improvement vs ${prev} (M3: ${formatPercent(yoyTrend.latestAvg, 0)} vs ${formatPercent(yoyTrend.prevAvg, 0)}).`
      : `Recent cohorts show no improvement vs ${prev}; M3 retention changed by ${formatPercent(delta, 0)}.`
    insights.push(trendLabel)
  }

  if (!insights.length) {
    if (status === 'Healthy') insights.push('Retention is holding well; consider scaling acquisition on similar cohorts.')
    else insights.push('Retention is middling; target onboarding or reactivation to lift Month 1 and Month 3 value.')
  }

  return insights
}

export default function CohortHealthPanel({
  cohortRows = [],
  selectedAffiliate = 'all',
  availableYears = [],
  selectedYear = 'all',
  onYearChange = () => {},
  friendlyCohortLabel,
  calendarMonths,
}) {
  const affiliateKey = normalizeKey(selectedAffiliate)

  const normalizedForAffiliate = useMemo(() => {
    return (cohortRows || [])
      .filter((row) => (affiliateKey === 'all' ? true : normalizeKey(row.affiliate || '') === affiliateKey))
      .map((row) => normalizeRow(row, friendlyCohortLabel, calendarMonths))
      .filter((row) => row.base !== 0)
  }, [cohortRows, affiliateKey, friendlyCohortLabel, calendarMonths])

  const normalizedRows = useMemo(() => {
    return normalizedForAffiliate.filter((row) => (selectedYear === 'all' ? true : row.cohortYear === selectedYear))
  }, [normalizedForAffiliate, selectedYear])

  const rowsByYear = useMemo(() => {
    const map = new Map()
    normalizedForAffiliate.forEach((row) => {
      if (!row.cohortYear) return
      const arr = map.get(row.cohortYear) || []
      arr.push(row)
      map.set(row.cohortYear, arr)
    })
    return map
  }, [normalizedForAffiliate])

  const churn = useMemo(() => computeChurn(normalizedRows), [normalizedRows])

  const baseStats = useMemo(() => {
    const bases = normalizedRows.map((r) => r.base).filter((v) => Number.isFinite(v) && v !== 0)
    if (!bases.length) return { stable: false }
    const min = Math.min(...bases)
    const max = Math.max(...bases)
    const avgBase = avg(bases) || 0
    const stable = avgBase > 0 && (max - min) / avgBase < 0.25
    return { stable, avgBase }
  }, [normalizedRows])

  const yoyTrend = useMemo(() => computeYoY(rowsByYear), [rowsByYear])

  const insights = useMemo(
    () => buildInsights({ normalizedRows, churn, baseStats, yoyTrend }),
    [normalizedRows, churn, baseStats, yoyTrend]
  )

  const matrixMonths = useMemo(() => {
    const maxCols = normalizedRows.reduce((m, r) => Math.max(m, r.normalized.length), 0)
    return monthLabels.slice(0, Math.max(maxCols, 1))
  }, [normalizedRows])

  return (
    <section className="card w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 m-0">Cohort health & retention</h3>
          <p className="text-xs text-slate-400 m-0">Normalized net deposits (Month 0 = 100%) with economic churn checkpoints.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60" style={{ color: churn.color }}>
            Status: {churn.status}
          </span>
          <span className="px-3 py-1 rounded-full border border-slate-700 bg-slate-800/60">
            Cohorts: {formatNumberShort(normalizedRows.length)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mt-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2"
          >
            <option value="all">All years</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/60">
          Affiliate filter: {selectedAffiliate === 'all' ? 'All affiliates' : selectedAffiliate}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        {[{ key: 'm1', label: 'Month 1' }, { key: 'm3', label: 'Month 3' }, { key: 'm6', label: 'Month 6' }].map((c) => {
          const value = churn[c.key]
          return (
            <div key={c.key} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="text-xs text-slate-400">Retained value {c.label}</div>
              <div className="text-lg font-semibold" style={{ color: heatText(value ?? 0) }}>
                {value === null ? '—' : formatPercent(value, 0)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-300 m-0">Cohort decay matrix</h4>
            <p className="text-[11px] text-slate-500 m-0">Cells show retained economic value vs Month 0 (100%).</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th className="text-left">Cohort</th>
                {matrixMonths.map((m) => (
                  <th key={m} className="text-center text-xs text-slate-400">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {normalizedRows.map((row) => (
                <tr key={`${row.cohortLabel}-${row.cohortYear}-${row.affiliate}`}>
                  <td className="text-sm text-slate-200">{row.cohortLabel}</td>
                  {matrixMonths.map((_, idx) => {
                    const value = row.normalized[idx]
                    return (
                      <td key={`${row.cohortLabel}-${idx}`} className="text-center text-xs" style={{ background: heatColor(value), color: heatText(value) }}>
                        {value === null ? '—' : `${Math.round(value)}%`}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {!normalizedRows.length && (
                <tr>
                  <td colSpan={matrixMonths.length + 1} className="text-center text-slate-500 text-sm py-4">
                    No cohorts match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="text-xs font-semibold text-slate-300 m-0">Cohort insight engine</h4>
        <ul className="mt-2 space-y-1 text-sm text-slate-200 list-disc list-inside">
          {insights.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
