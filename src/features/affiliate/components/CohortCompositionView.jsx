import React, { useMemo } from 'react'
import { normalizeKey } from '../../../lib/formatters'
import {
  computeYearlyAverageCompositionShares,
  computeMonthlyTotalFromMatrix,
} from '../utils/cohortCompositionKpis'

const formatCompact = (value, kind) => {
  const num = Number(value || 0)
  if (!Number.isFinite(num)) return '—'
  if (kind === 'percent') return `${num.toFixed(1)}%`

  const abs = Math.abs(num)
  if (abs >= 1_000_000) return `${num < 0 ? '-' : ''}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1000) return `${num < 0 ? '-' : ''}${Math.round(abs / 1000)}K`
  return `${Math.round(num)}`
}

const formatValue = (value, metricKind) => {
  if (value === null || value === undefined) return '—'
  if (!Number.isFinite(Number(value))) return '—'
  if (metricKind === 'currency') return `€${formatCompact(value, 'number')}`
  return formatCompact(value, 'number')
}

const formatPct = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 10) return `${n.toFixed(1)}%`
  if (abs >= 1) return `${n.toFixed(2)}%`
  if (abs >= 0.1) return `${n.toFixed(3)}%`
  return `${n.toFixed(4)}%`
}

const heatBg = (pct) => {
  if (pct === null || pct === undefined) return 'transparent'
  if (!Number.isFinite(pct)) return 'transparent'
  // Dark theme heat: low -> subtle red, high -> subtle green
  if (pct >= 20) return 'rgba(34, 197, 94, 0.18)'
  if (pct >= 10) return 'rgba(234, 179, 8, 0.16)'
  if (pct > 0) return 'rgba(248, 113, 113, 0.14)'
  return 'rgba(148, 163, 184, 0.08)'
}

function monthKeyFromAbs(abs) {
  const year = Math.floor(abs / 12)
  const monthIndex = abs % 12
  return `${year}-${String(monthIndex).padStart(2, '0')}`
}

export default function CohortCompositionView({
  cohortRows = [],
  calendarEntries = [], // [{abs,label}]
  selectedAffiliate = 'all',
  valueMode = 'absolute', // absolute | percent
  metricKind = 'currency', // currency | count
}) {
  const filteredCohorts = useMemo(() => {
    const affiliateKey = normalizeKey(selectedAffiliate)
    if (affiliateKey === 'all') return cohortRows
    return cohortRows.filter((r) => normalizeKey(r.affiliate || '') === affiliateKey)
  }, [cohortRows, selectedAffiliate])

  const perMonth = useMemo(() => {
    const monthsList = Array.isArray(calendarEntries) ? calendarEntries : []

    const cohortTotals = monthsList.map((entry) => {
      const abs = Number(entry?.abs)
      if (!Number.isFinite(abs)) {
        return {
          abs,
          monthKey: 'unknown',
          total: 0,
        }
      }
      const monthKey = monthKeyFromAbs(abs)

      const res = computeMonthlyTotalFromMatrix(filteredCohorts, abs)
      return {
        abs,
        monthKey,
        total: res.complete && res.total !== null ? res.total : null,
        complete: res.complete,
      }
    })
    return { cohortTotals }
  }, [calendarEntries, filteredCohorts])

  const compositionKpis = useMemo(() => {
    return computeYearlyAverageCompositionShares({ cohortRows: filteredCohorts, calendarEntries })
  }, [calendarEntries, filteredCohorts])

  const totalByMonthKey = useMemo(() => {
    const map = new Map()
    perMonth.cohortTotals.forEach((m) => {
      if (!m || !m.monthKey) return
      const total = Number(m.total)
      map.set(m.monthKey, Number.isFinite(total) ? total : null)
    })
    return map
  }, [perMonth.cohortTotals])

  const sortedCohorts = useMemo(() => {
    const entries = Array.isArray(calendarEntries) ? calendarEntries : []
    const absList = entries.map((e) => Number(e?.abs)).filter((v) => Number.isFinite(v))
    const minAbs = absList.length ? Math.min(...absList) : null
    const maxAbs = absList.length ? Math.max(...absList) : null

    const overlapping = filteredCohorts.filter((r) => {
      if (minAbs === null || maxAbs === null) return true
      const start = Number(r.baseAbs)
      const len = Number(r.values?.length || 0)
      const end = start + Math.max(0, len - 1)
      return start <= maxAbs && end >= minAbs
    })

    // Drop cohorts that don't contribute anything in the visible calendar window.
    // For net deposits (can be negative), use absolute sum so -/+ don't cancel out.
    const active = overlapping.filter((r) => {
      if (!entries.length) return true
      let sumAbs = 0
      for (const entry of entries) {
        const abs = Number(entry?.abs)
        if (!Number.isFinite(abs)) continue
        const offset = abs - Number(r.baseAbs)
        if (offset < 0) continue
        const v = r.values?.[offset]
        if (!Number.isFinite(Number(v))) continue
        sumAbs += Math.abs(Number(v))
      }
      return sumAbs > 0
    })

    // Render cap to keep UI responsive.
    // Most useful cohorts for a given year are the most recent ones.
    const CAP = 80
    const sorted = active.sort((a, b) => Number(b.baseAbs) - Number(a.baseAbs))
    if (sorted.length <= CAP) return sorted
    return sorted.slice(0, CAP)
  }, [filteredCohorts, calendarEntries])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {filteredCohorts.length > sortedCohorts.length ? (
        <div style={{ color: 'rgba(203,213,225,0.7)', fontSize: 12 }}>
          Showing {sortedCohorts.length} of {filteredCohorts.length} cohorts (filtered to the
          selected calendar window).
        </div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ color: 'rgba(226,232,240,0.75)', fontSize: 12 }}>
          View: {valueMode === 'percent' ? '% of monthly total' : 'absolute'}
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: 10 }}
      >
        {[
          {
            title: 'Current Cohort Avg Share',
            value: compositionKpis.avgShares.current,
            hint: 'avg contribution share',
          },
          {
            title: 'Previous 2 Cohorts Avg Share',
            value: compositionKpis.avgShares.prev2,
            hint: 'avg contribution share',
          },
          {
            title: 'Older Cohorts Avg Share',
            value: compositionKpis.avgShares.older,
            hint: 'avg contribution share',
          },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '12px 14px',
              background: 'rgba(2,6,23,0.25)',
              minHeight: 72,
            }}
            title={card.hint}
          >
            <div style={{ fontSize: 12, color: 'rgba(203,213,225,0.75)', fontWeight: 700 }}>
              {card.title}
            </div>
            <div style={{ fontSize: 20, color: '#e2e8f0', fontWeight: 900, marginTop: 6 }}>
              {card.value === null ? '—' : formatPct(card.value * 100)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', marginTop: 2 }}>
              avg contribution share • Avg over {compositionKpis.monthsUsed} months
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          overflow: 'auto',
          background: 'rgba(2,6,23,0.35)',
        }}
      >
        <table
          style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 980 }}
        >
          <thead>
            <tr>
              <th
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontSize: 12,
                  background: 'rgba(2,6,23,0.95)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  color: '#cbd5e1',
                  whiteSpace: 'nowrap',
                }}
              >
                Cohort
              </th>
              {calendarEntries.map((e) => (
                <th
                  key={e.abs}
                  style={{
                    textAlign: 'center',
                    padding: '10px 10px',
                    fontSize: 12,
                    background: 'rgba(2,6,23,0.95)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    color: '#cbd5e1',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {e.label}
                </th>
              ))}
            </tr>

            <tr>
              <th
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: 12,
                  background: 'rgba(2,6,23,0.85)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(203,213,225,0.8)',
                  whiteSpace: 'nowrap',
                }}
              >
                Total
              </th>
              {perMonth.cohortTotals.map((m) => {
                const label =
                  valueMode === 'percent'
                    ? '100%'
                    : m.total === null
                      ? '—'
                      : formatValue(m.total, metricKind)
                return (
                  <th
                    key={`total-${m.abs}`}
                    title={
                      m.total === null
                        ? 'Monthly total not available (missing cohort values).'
                        : `Monthly total from cohort matrix: ${formatValue(m.total, metricKind)}`
                    }
                    style={{
                      textAlign: 'center',
                      padding: '8px 10px',
                      fontSize: 12,
                      background: 'rgba(2,6,23,0.85)',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(203,213,225,0.8)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {sortedCohorts.map((row) => (
              <tr key={row.id}>
                <td
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    background: 'rgba(2,6,23,0.75)',
                    padding: '10px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                  title={row.cohortDateRaw || row.cohortLabel}
                >
                  {row.cohortLabel}
                </td>

                {calendarEntries.map((entry) => {
                  const abs = Number(entry.abs)
                  const offset = abs - Number(row.baseAbs)
                  const rawValue = offset >= 0 ? row.values?.[offset] : null
                  const monthKey = monthKeyFromAbs(abs)
                  const denomValue = totalByMonthKey.get(monthKey)
                  const denom = Number.isFinite(Number(denomValue)) ? Number(denomValue) : 0

                  const pct =
                    valueMode === 'percent' && Number.isFinite(Number(rawValue)) && denom > 0
                      ? (Number(rawValue) / denom) * 100
                      : null

                  const display =
                    valueMode === 'percent'
                      ? pct === null
                        ? '—'
                        : `${pct.toFixed(1)}%`
                      : Number.isFinite(Number(rawValue))
                        ? formatValue(Number(rawValue), metricKind)
                        : '—'

                  return (
                    <td
                      key={`${row.id}-${abs}`}
                      style={{
                        textAlign: 'center',
                        padding: '10px 10px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(226,232,240,0.9)',
                        fontSize: 12,
                        background: valueMode === 'percent' ? heatBg(pct) : 'transparent',
                        whiteSpace: 'nowrap',
                      }}
                      title={
                        offset < 0
                          ? 'Not active yet'
                          : valueMode === 'percent'
                            ? `Value: ${formatValue(rawValue, metricKind)} | Share of month total: ${pct?.toFixed(2) ?? '—'}% (cohort matrix total)`
                            : `Value: ${formatValue(rawValue, metricKind)}`
                      }
                    >
                      {display}
                    </td>
                  )
                })}
              </tr>
            ))}

            {!sortedCohorts.length ? (
              <tr>
                <td
                  colSpan={1 + calendarEntries.length}
                  style={{ padding: 16, color: 'rgba(203,213,225,0.8)', fontSize: 13 }}
                >
                  No cohort rows match the selected filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ color: 'rgba(203,213,225,0.7)', fontSize: 12 }}>
        Tip: Select a specific calendar year to keep the matrix readable.
      </div>
    </div>
  )
}
