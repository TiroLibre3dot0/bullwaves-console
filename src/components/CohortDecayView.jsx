import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { formatPercent, formatNumberShort, normalizeKey } from '../lib/formatters'

const palette = ['#34d399', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa', '#22d3ee']
const heatColor = (value) => {
  if (value === null || value === undefined) return 'transparent'
  if (value >= 90) return 'rgba(34,197,94,0.22)'
  if (value >= 70) return 'rgba(74,222,128,0.18)'
  if (value >= 50) return 'rgba(234,179,8,0.18)'
  if (value >= 20) return 'rgba(248,113,113,0.18)'
  return 'rgba(239,68,68,0.22)'
}

const heatText = (value) => {
  if (value === null || value === undefined) return '#cbd5e1'
  if (value >= 80) return '#e2e8f0'
  if (value >= 50) return '#fef3c7'
  return '#fecdd3'
}

const avg = (arr = []) => {
  const vals = arr.filter((v) => Number.isFinite(v))
  if (!vals.length) return null
  return vals.reduce((s, v) => s + v, 0) / vals.length
}

export default function CohortDecayView({
  rows = [],
  calendarEntries = [], // [{ abs, label }]
  startAbs = 0,
  selectedAffiliate = 'all',
  selectedYear = 'all',
  onYearChange = () => {},
  layout = 'toggle', // 'toggle' (legacy) | 'split' (chart + table side by side)
  showAverageLine = true,
  metricLabel = 'Net deposits',
}) {
  const [viewMode, setViewMode] = useState('heatmap')
  const [valueMode, setValueMode] = useState('absolute')
  const [selectedRows, setSelectedRows] = useState([])
  const chartRef = useRef(null)
  const [curveFlags, setCurveFlags] = useState([])

  const affiliateKey = normalizeKey(selectedAffiliate)

  const availableYears = useMemo(() => {
    const set = new Set()
    rows.forEach((r) => {
      if (r.cohortYear) set.add(r.cohortYear)
    })
    return Array.from(set).sort((a, b) => a - b)
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows
      .filter((r) => (selectedYear === 'all' ? true : r.cohortYear === selectedYear))
      .filter((r) => (affiliateKey === 'all' ? true : normalizeKey(r.affiliate || '') === affiliateKey))
      .sort((a, b) => a.baseAbs - b.baseAbs)
  }, [rows, selectedYear, affiliateKey])

  const aggregatedRows = useMemo(() => {
    const byCohort = new Map()
    filteredRows.forEach((row) => {
      const key = row.baseAbs
      const existing = byCohort.get(key) || {
        ...row,
        values: Array.from({ length: row.values?.length || 12 }).fill(0),
        cohortSize: 0,
      }
      const values = Array.from({ length: Math.max(existing.values.length, row.values?.length || 0) }).map(
        (_, idx) => (existing.values[idx] || 0) + ((row.values || [])[idx] || 0)
      )
      byCohort.set(key, { ...existing, values, cohortSize: (existing.cohortSize || 0) + (row.cohortSize || 0) })
    })

    return Array.from(byCohort.values())
      .map((row) => {
        const m0 = row.values?.[0]
        const normalized = row.values.map((v) => {
          // Percent-retained view must never show negative values.
          // If a given month is negative (net outflow), clamp retained % to 0.
          if (!Number.isFinite(m0) || m0 === 0) return null
          if (!Number.isFinite(v)) return null
          const pct = (v / m0) * 100
          if (!Number.isFinite(pct)) return null
          if (v < 0) return 0
          return pct < 0 ? 0 : pct
        })
        return { ...row, normalized }
      })
      .sort((a, b) => a.baseAbs - b.baseAbs)
  }, [filteredRows])

  const rowById = useMemo(() => {
    const map = new Map()
    aggregatedRows.forEach((r) => map.set(r.id, r))
    return map
  }, [aggregatedRows])

  const churn = useMemo(() => {
    const grab = (idx) => avg(aggregatedRows.map((r) => r.normalized[idx]).filter((v) => v !== null && v !== undefined))
    return {
      m1: grab(1),
      m3: grab(3),
      m6: grab(6),
    }
  }, [aggregatedRows])

  const averageSeries = useMemo(() => {
    if (!aggregatedRows.length || !calendarEntries.length) return []
    return calendarEntries.map((entry) => {
      const vals = aggregatedRows.map((row) => {
        const offset = entry.abs - row.baseAbs
        if (offset < 0 || offset >= row.normalized.length) return null
        const source = valueMode === 'percent' ? row.normalized : row.values
        return source[offset]
      }).filter((v) => v !== null && v !== undefined)
      if (!vals.length) return null
      return vals.reduce((s, v) => s + v, 0) / vals.length
    })
  }, [aggregatedRows, calendarEntries, valueMode])

  const displayedRows = useMemo(() => {
    if (selectedRows.length) {
      const ids = new Set(selectedRows)
      return aggregatedRows.filter((r) => ids.has(r.id))
    }
    return aggregatedRows.slice(0, 3)
  }, [aggregatedRows, selectedRows])

  const toggleRow = (id) => {
    setSelectedRows((prev) => {
      const set = new Set(prev)
      if (set.has(id)) {
        set.delete(id)
      } else {
        set.add(id)
      }
      return Array.from(set).slice(0, 6)
    })
  }

  const trendData = useMemo(() => {
    const datasets = []

    if (showAverageLine && averageSeries.length) {
      datasets.push({
        label: 'Average (all filtered cohorts)',
        data: averageSeries,
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251,191,36,0.12)',
        tension: 0.2,
        spanGaps: true,
        pointRadius: 0,
        borderWidth: 3,
      })
    }

    displayedRows.forEach((row, idx) => {
      const color = palette[idx % palette.length]

      if (valueMode === 'absolute') {
        const barData = calendarEntries.map((entry) => {
          const offset = entry.abs - row.baseAbs
          return offset === 0 ? Number(row.cohortSize || 0) : null
        })
        datasets.push({
          type: 'bar',
          label: `${row.cohortLabel} (initial size)`,
          data: barData,
          backgroundColor: `${color}55`,
          borderWidth: 0,
          maxBarThickness: 18,
          stack: 'size',
          yAxisID: 'y',
        })
      }

      const lineData = calendarEntries.map((entry) => {
        const offset = entry.abs - row.baseAbs
        if (offset < 0 || offset >= row.values.length) return null
        const source = valueMode === 'percent' ? row.normalized : row.values
        return source[offset] === null ? null : Number(source[offset])
      })

      const flagIndex = lineData.findIndex((v) => v !== null && v !== undefined)
      datasets.push({
        label: row.cohortLabel,
        data: lineData,
        borderColor: color,
        backgroundColor: `${color}33`,
        tension: 0.2,
        spanGaps: true,
        pointRadius: 0,
        type: 'line',
        yAxisID: 'y',
        _flagIndex: flagIndex,
        _cohortSize: Number(row.cohortSize || 0),
        _rowId: row.id,
      })
    })

    return {
      labels: calendarEntries.map((e) => e.label),
      datasets,
    }
  }, [calendarEntries, displayedRows, valueMode, showAverageLine, averageSeries])

  const trendOptions = useMemo(() => {
    const showAllMonthTicks = selectedYear !== 'all' && calendarEntries.length <= 12
    return ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#cbd5e1' } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y
            if (val === null || val === undefined) return ''
            if (valueMode !== 'percent') {
              return `${ctx.dataset.label}: ${formatNumberShort(val)}`
            }

            let suffix = ''
            const rowId = ctx.dataset?._rowId
            if (rowId) {
              const row = rowById.get(rowId)
              const entry = calendarEntries[ctx.dataIndex]
              const offset = row && entry ? entry.abs - row.baseAbs : null
              const absVal = row && offset !== null && offset >= 0 && offset < (row.values || []).length ? row.values[offset] : null
              if (absVal !== null && absVal !== undefined && Number.isFinite(absVal) && absVal < 0) {
                // Percent view: negative absolute value is clamped to 0%.
                suffix = ' (net outflow)'
              }
            }

            return `${ctx.dataset.label}: ${formatPercent(val, 0)}${suffix}`
          },
          footer: (items) => {
            if (!items?.length) return ''
            if (valueMode !== 'percent') return ''
            const v = items[0]?.parsed?.y
            if (!Number.isFinite(v)) return ''
            if (v <= 100) return ''
            return 'Values above 100% indicate additional deposits after acquisition and do not imply recovery of long-term retention.'
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cbd5e1',
          maxRotation: 0,
          minRotation: 0,
          autoSkip: !showAllMonthTicks,
        },
        grid: { display: false },
      },
      y: {
        grace: valueMode === 'percent' ? '12%' : '18%',
        suggestedMax: valueMode === 'percent' ? 110 : undefined,
        suggestedMin: valueMode === 'percent' ? 0 : undefined,
        ticks: {
          color: '#cbd5e1',
          callback: (v) => (valueMode === 'percent' ? `${v}%` : formatNumberShort(v)),
        },
        grid: { color: 'rgba(148,163,184,0.2)' },
      },
    },
    })
  }, [valueMode, selectedYear, calendarEntries, rowById])

  const computeCurveFlags = useMemo(() => {
    // Precompute flag anchors in data-space (x index + y value).
    if (!displayedRows.length || !calendarEntries.length) return []
    return displayedRows.map((row, idx) => {
      const startIndex = calendarEntries.findIndex((e) => e.abs === row.baseAbs)
      if (startIndex < 0) return null
      const size = Number(row.cohortSize || 0)
      const yVal = valueMode === 'percent' ? 100 : (Number(row.values?.[0] || 0) || 0)
      return {
        id: row.id,
        startIndex,
        yVal,
        size,
        color: palette[idx % palette.length],
      }
    }).filter(Boolean)
  }, [displayedRows, calendarEntries, valueMode])

  useEffect(() => {
    const update = () => {
      const chart = chartRef.current
      if (!chart || !chart.scales?.x || !chart.scales?.y) {
        setCurveFlags([])
        return
      }
      const xScale = chart.scales.x
      const yScale = chart.scales.y
      const chartArea = chart.chartArea
      const next = computeCurveFlags.map((f) => {
        const x = xScale.getPixelForValue(f.startIndex)
        const y = yScale.getPixelForValue(f.yVal)
        const left = Math.max(chartArea.left, Math.min(chartArea.right, x))
        const top = Math.max(chartArea.top, Math.min(chartArea.bottom, y))
        return { ...f, left, top }
      })
      setCurveFlags(next)
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [computeCurveFlags])

  return (
    <section className="card w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 m-0">Time-based cohort decay</h3>
          <p className="text-xs text-slate-400 m-0">{metricLabel} per cohort month (Month 0 onward). Toggle for retained %.</p>
        </div>
        {layout === 'toggle' && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1">
              <button
                className={`btn secondary ${viewMode === 'heatmap' ? 'active' : ''}`}
                onClick={() => setViewMode('heatmap')}
                style={{ padding: '4px 10px', height: 28 }}
              >
                Table
              </button>
              <button
                className={`btn secondary ${viewMode === 'trend' ? 'active' : ''}`}
                onClick={() => setViewMode('trend')}
                style={{ padding: '4px 10px', height: 28 }}
              >
                Trend chart
              </button>
            </div>
          </div>
        )}
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
        {(layout === 'toggle' ? viewMode === 'trend' : true) && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>Y scale:</span>
            <button
              className={`btn secondary ${valueMode === 'percent' ? 'active' : ''}`}
              onClick={() => setValueMode('percent')}
              style={{ padding: '4px 8px', height: 26 }}
            >
              % retained
            </button>
            <button
              className={`btn secondary ${valueMode === 'absolute' ? 'active' : ''}`}
              onClick={() => setValueMode('absolute')}
              style={{ padding: '4px 8px', height: 26 }}
            >
              Absolute
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        {[{ key: 'm1', label: 'Month 1' }, { key: 'm3', label: 'Month 3' }, { key: 'm6', label: 'Month 6' }].map((c, idx) => {
          const value = churn[c.key]
          return (
            <div key={c.key} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="text-xs text-slate-400">Average retained value across selected cohorts</div>
              <div className="text-[11px] text-slate-500">{c.label} ({metricLabel})</div>
              <div className="text-lg font-semibold" style={{ color: heatText(value ?? 0) }}>
                {value === null ? '—' : formatPercent(value, 0)}
              </div>
            </div>
          )
        })}
      </div>

      <div className={`mt-5 ${layout === 'split' ? 'grid grid-cols-2 gap-4' : ''}`}>
        {(layout === 'toggle' ? viewMode === 'trend' : true) && (
          <div className={`${layout === 'split' ? 'col-span-1' : ''}`} style={{ height: layout === 'split' ? 360 : 320 }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-semibold text-slate-300 m-0">Sample cohorts + average</h4>
                <p className="text-[11px] text-slate-500 m-0">Not all cohorts are shown. Average line includes all filtered cohorts (same calendar-aligned dataset as the table).</p>
              </div>
              <div className="text-xs text-slate-400">{displayedRows.length} sample cohort(s) plotted</div>
            </div>
            {valueMode === 'percent' && (
              <div className="text-[11px] text-slate-500 mb-2">
                Values above 100% indicate additional deposits after acquisition and do not imply recovery of long-term retention. Months with net outflow are shown as 0%.
              </div>
            )}
            <div className="h-full w-full relative">
              <Line ref={chartRef} data={trendData} options={trendOptions} />
              <div className="absolute inset-0 pointer-events-none">
                {curveFlags.map((f) => (
                  <div
                    key={`flag-${f.id}`}
                    className="absolute text-[10px] px-2 py-0.5 rounded border border-slate-700 bg-slate-900/90 text-slate-200"
                    style={{
                      left: f.left,
                      top: f.top,
                      transform: 'translate(-10%, -140%)',
                      whiteSpace: 'nowrap',
                      color: f.color,
                    }}
                  >
                    initial size {formatNumberShort(f.size)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(layout === 'toggle' ? viewMode === 'heatmap' : true) && (
          <div className={`${layout === 'split' ? 'col-span-1' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-semibold text-slate-300 m-0">Time-based cohort decay</h4>
                <p className="text-[11px] text-slate-500 m-0">One row per cohort: cohort date, size, and Month 0→n {metricLabel.toLowerCase()}.</p>
              </div>
            </div>
            {valueMode === 'percent' && (
              <div className="text-[11px] text-slate-500 mb-2">
                Values above 100% indicate additional deposits after acquisition and do not imply recovery of long-term retention. Months with net outflow are shown as 0%.
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th className="text-left">Cohort date</th>
                    <th className="text-right">Initial cohort size</th>
                    {calendarEntries.map((entry) => (
                      <th key={entry.label} className="text-center text-xs text-slate-400">{entry.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aggregatedRows.map((row) => (
                    <tr key={row.id} onClick={() => toggleRow(row.id)} style={{ cursor: 'pointer' }}>
                      <td className="text-sm text-slate-200">
                        <span title={row.cohortDateRaw || undefined}>{row.cohortLabel}</span>
                        {selectedRows.includes(row.id) && <span className="ml-2 text-[11px] text-slate-400">(selected)</span>}
                      </td>
                      <td className="text-right text-xs text-slate-300" title={formatNumberShort(row.cohortSize || 0)}>
                        {formatNumberShort(row.cohortSize || 0)}
                      </td>
                      {calendarEntries.map((entry) => {
                        const offset = entry.abs - row.baseAbs
                        const source = valueMode === 'percent' ? row.normalized : row.values
                        const value = offset < 0 || offset >= source.length ? null : source[offset]
                        const absVal = offset < 0 || offset >= (row.values || []).length ? null : row.values[offset]
                        const isNetOutflow = valueMode === 'percent' && absVal !== null && absVal !== undefined && Number.isFinite(absVal) && absVal < 0
                        return (
                          <td
                            key={`${row.id}-${entry.abs}`}
                            className="text-center text-xs"
                            style={{ background: valueMode === 'percent' ? heatColor(value) : 'transparent', color: valueMode === 'percent' ? heatText(value) : '#e2e8f0' }}
                            title={
                              value === null
                                ? undefined
                                : valueMode === 'percent'
                                  ? `${formatPercent(value, 1)}${isNetOutflow ? ' (net outflow)' : ''}`
                                  : formatNumberShort(value)
                            }
                          >
                            {value === null
                              ? '—'
                              : valueMode === 'percent'
                                ? `${Math.round(value)}%${isNetOutflow ? '' : ''}`
                                : formatNumberShort(value)}
                          </td>
                        )}
                      )}
                    </tr>
                  ))}
                  {!aggregatedRows.length && (
                    <tr>
                      <td colSpan={calendarEntries.length + 2} className="text-center text-slate-500 text-sm py-4">
                        No cohorts match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
