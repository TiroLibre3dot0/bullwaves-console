import { useEffect, useMemo, useState } from 'react'

import FullPageLoader from '../../../components/FullPageLoader'
import CohortDecayView from '../../../components/CohortDecayView'
import CohortPredictiveView from '../../../components/affiliate/cohort/views/CohortPredictiveView'
import CohortCompositionView from '../components/CohortCompositionView'
import { useCohortChurnAnalysis } from '../hooks/useCohortChurnAnalysis'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const selectStyle = {
  minWidth: 170,
  background: '#0d1a2c',
  color: 'var(--text)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10,
  padding: '8px 10px',
}

const pillStyle = (active) => ({
  padding: '8px 12px',
  borderRadius: 999,
  border: `1px solid ${active ? 'rgba(96,165,250,0.45)' : 'rgba(255,255,255,0.10)'}`,
  background: active ? 'rgba(96,165,250,0.12)' : 'rgba(2,6,23,0.25)',
  color: active ? '#e2e8f0' : 'rgba(226,232,240,0.75)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
})

function buildCalendarEntries(absRange, selectedYear) {
  if (selectedYear !== 'all') {
    const y = Number(selectedYear)
    if (Number.isFinite(y)) {
      const entries = []
      const minAbs = y * 12
      const maxAbs = y * 12 + 11
      for (let abs = minAbs; abs <= maxAbs; abs += 1) {
        const month = abs % 12
        entries.push({ abs, label: months[month] })
      }
      return entries
    }
  }

  if (!absRange) return []

  const entries = []
  for (let abs = absRange.minAbs; abs <= absRange.maxAbs; abs += 1) {
    const year = Math.floor(abs / 12)
    const month = abs % 12
    entries.push({ abs, label: `${months[month]} ${year}` })
  }
  return entries
}

export default function AffiliateCohortPage() {
  const [view, setView] = useState('composition') // composition | decay | predictive
  const [metric, setMetric] = useState('netDeposits')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedAffiliate, setSelectedAffiliate] = useState('all')
  const [compositionValueMode, setCompositionValueMode] = useState('absolute') // absolute | percent
  const [initialReady, setInitialReady] = useState(false)

  const cohort = useCohortChurnAnalysis(metric)

  const metricLabel = useMemo(() => {
    if (metric === 'deposits') return 'Deposits'
    if (metric === 'depositsCount') return 'Number of deposits'
    if (metric === 'withdrawals') return 'Withdrawals'
    return 'Net deposits'
  }, [metric])

  const metricKind = metric === 'depositsCount' ? 'count' : 'currency'

  const calendarEntries = useMemo(() => {
    return buildCalendarEntries(cohort.absRange, selectedYear)
  }, [cohort.absRange, selectedYear])

  const yearOptions = useMemo(() => {
    const years = new Set()

    cohort.rows.forEach((r) => {
      const y = Number(r.cohortYear)
      if (Number.isFinite(y)) years.add(y)
    })

    // Remove empty years: only show years that actually exist in data.
    // If we somehow have none (shouldn't happen), fall back to a sane default.
    const list = Array.from(years).sort((a, b) => a - b)
    return list.length ? list : [2024, 2025]
  }, [cohort.rows])

  const latestYear = useMemo(() => {
    if (!yearOptions.length) return null
    return yearOptions[yearOptions.length - 1]
  }, [yearOptions])

  const affiliateOptions = useMemo(() => {
    const set = new Set(['all'])
    cohort.rows.forEach((r) => {
      const a = String(r.affiliate || '').trim()
      if (a) set.add(a)
    })

    const list = Array.from(set)
    // keep 'all' first, others alphabetical
    return [
      'all',
      ...list.filter((x) => x !== 'all').sort((a, b) => String(a).localeCompare(String(b))),
    ]
  }, [cohort.rows])

  const loading = cohort.loading

  const progress = cohort.loading ? 0 : 100

  useEffect(() => {
    if (!initialReady && !loading) setInitialReady(true)
  }, [initialReady, loading])

  // Default to the latest populated year so the page doesn't try to render a massive all-years matrix.
  useEffect(() => {
    if (!initialReady) return
    if (selectedYear !== 'all') return
    if (!latestYear) return
    setSelectedYear(String(latestYear))
  }, [initialReady, latestYear, selectedYear])

  // Only block the page on the very first load.
  // Subsequent reloads (e.g. report version bumps) should not flash the whole UI.
  if (!initialReady && loading) {
    return <FullPageLoader progress={progress} subtitle="Parsing reports…" />
  }

  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={pillStyle(view === 'composition')} onClick={() => setView('composition')}>
            Composition
          </button>
          <button style={pillStyle(view === 'decay')} onClick={() => setView('decay')}>
            Decay
          </button>
          <button style={pillStyle(view === 'predictive')} onClick={() => setView('predictive')}>
            Predictive
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} style={selectStyle}>
            <option value="netDeposits">Net deposits</option>
            <option value="deposits">Deposits</option>
            <option value="depositsCount">Deposits count</option>
            <option value="withdrawals">Withdrawals</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ ...selectStyle, minWidth: 130 }}
          >
            <option value="all">All years</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={selectedAffiliate}
            onChange={(e) => setSelectedAffiliate(e.target.value)}
            style={{ ...selectStyle, minWidth: 180 }}
          >
            <option value="all">All affiliates</option>
            {affiliateOptions
              .filter((a) => a !== 'all')
              .map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
          </select>

          {view === 'composition' ? (
            <select
              value={compositionValueMode}
              onChange={(e) => setCompositionValueMode(e.target.value)}
              style={{ ...selectStyle, minWidth: 160 }}
            >
              <option value="absolute">Absolute</option>
              <option value="percent">% of monthly total</option>
            </select>
          ) : null}

          {loading ? (
            <div style={{ fontSize: 12, color: 'rgba(203,213,225,0.7)' }}>Refreshing…</div>
          ) : null}
        </div>
      </div>

      {view === 'composition' ? (
        selectedYear === 'all' ? (
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 16,
              color: 'rgba(226,232,240,0.85)',
              background: 'rgba(2,6,23,0.25)',
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Composition</div>
            <div style={{ fontSize: 13, color: 'rgba(226,232,240,0.75)' }}>
              Select a specific year to render the composition matrix (All years can be very heavy).
            </div>
          </div>
        ) : (
          <CohortCompositionView
            cohortRows={cohort.rows}
            calendarEntries={calendarEntries}
            selectedAffiliate={selectedAffiliate}
            valueMode={compositionValueMode}
            metricKind={metricKind}
          />
        )
      ) : null}

      {view === 'decay' ? (
        <CohortDecayView
          rows={cohort.rows}
          calendarEntries={calendarEntries}
          startAbs={calendarEntries.length ? calendarEntries[0].abs : 0}
          selectedAffiliate={selectedAffiliate}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          layout="split"
          metricLabel={metricLabel}
          hideControls={true}
          defaultValueMode={metricKind === 'currency' ? 'percent' : 'absolute'}
          // new prop: keep cohorts across years; constrain only the x-axis
          filterByCohortYear={false}
        />
      ) : null}

      {view === 'predictive' ? (
        <CohortPredictiveView
          cohortRows={cohort.rows}
          calendarEntries={calendarEntries}
          selectedAffiliate={selectedAffiliate}
          metric={metric}
          metricKind={metricKind}
          selectedYear={selectedYear}
        />
      ) : null}

      {cohort.error ? (
        <div style={{ color: '#fca5a5', fontSize: 13 }}>Data error: {String(cohort.error)}</div>
      ) : null}
    </div>
  )
}
