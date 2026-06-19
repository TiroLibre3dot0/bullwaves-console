import { useEffect, useMemo, useState } from 'react'
import KpiCard from '../../../components/common/KpiCard'
import { fetchSoliticsSummary } from '../services/soliticsService'

const pctFmt = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const numFmt = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
})

const hourFmt = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function fmtPct(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '--'
  return pctFmt.format(n)
}

function fmtNum(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '--'
  return numFmt.format(n)
}

function fmtHours(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '--'
  return `${hourFmt.format(n)} h`
}

function fmtDateTime(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function priorityFromBranch(branch) {
  if (!branch) return 'normal'
  const rr = Number(branch.responseRate || 0)
  if (rr < 0.3) return 'high'
  if (rr < 0.5) return 'medium'
  return 'low'
}

export default function SoliticsInsightsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const payload = await fetchSoliticsSummary()
        if (!mounted) return
        setData(payload)
      } catch (e) {
        if (!mounted) return
        setError(String(e?.message || 'Unable to load Solitics summary'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [])

  const actions = useMemo(() => {
    const branchStats = Array.isArray(data?.branchStats) ? data.branchStats : []
    return branchStats
      .map((branch) => {
        const priority = priorityFromBranch(branch)
        if (priority === 'low') return null
        const action =
          priority === 'high'
            ? 'Review audience + message copy and trigger resend experiment in 48h.'
            : 'Run A/B copy test on top journey for this branch this week.'
        return {
          branch: branch.branch,
          responseRate: branch.responseRate,
          clickRate: branch.clickRate,
          total: branch.total,
          priority,
          action,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.responseRate - b.responseRate)
      .slice(0, 5)
  }, [data])

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-label">REPORTS · ACTION INTELLIGENCE</p>
          <h1 className="page-title">Solitics Engagement Insights</h1>
          <p className="page-subtitle">
            Concept section to transform raw Solitics export into readable KPIs, risk flags and
            execution-ready actions for sales/retention.
          </p>
        </div>
      </header>

      {loading ? <p className="muted">Caricamento insight Solitics…</p> : null}
      {error ? (
        <div
          style={{
            border: '1px solid rgba(239,68,68,0.45)',
            borderRadius: 12,
            padding: 12,
            background: 'rgba(127, 29, 29, 0.2)',
            color: '#fecaca',
          }}
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <section className="card-block" style={{ marginBottom: 20 }}>
            <div className="card-block-header">
              <div>
                <p className="eyebrow">KPI Snapshot</p>
                <h3>Performance Summary</h3>
              </div>
            </div>
            <div className="card-columns" role="list">
              <KpiCard
                label="Rows"
                value={fmtNum(data?.kpis?.totalRows)}
                helper="Total Solitics events"
                tone="#c4b5fd"
              />
              <KpiCard
                label="Unique Members"
                value={fmtNum(data?.kpis?.uniqueMembers)}
                helper="Distinct member id"
                tone="#93c5fd"
              />
              <KpiCard
                label="Response Rate"
                value={fmtPct(data?.kpis?.responseRateRows)}
                helper="Rows with any response"
                tone="#86efac"
              />
              <KpiCard
                label="Click Rate"
                value={fmtPct(data?.kpis?.clickRateRows)}
                helper="Rows with Clicked response"
                tone="#fcd34d"
              />
              <KpiCard
                label="Avg Response Lag"
                value={fmtHours(data?.kpis?.avgLagHours)}
                helper="Registration to response"
                tone="#fca5a5"
              />
              <KpiCard
                label="Potential Duplicates"
                value={fmtNum(data?.kpis?.potentialDuplicateEvents)}
                helper="Same member+response+timestamp"
                tone="#fda4af"
              />
            </div>
          </section>

          <section className="card-block" style={{ marginBottom: 20 }}>
            <div className="card-block-header">
              <div>
                <p className="eyebrow">Action Queue</p>
                <h3>Priority Next Actions</h3>
                <p className="muted">
                  Auto-generated from weakest branch response rates for immediate execution.
                </p>
              </div>
            </div>

            {!actions.length ? (
              <p className="muted">No urgent branch-level actions detected.</p>
            ) : (
              <div className="card-columns" role="list">
                {actions.map((item) => (
                  <article
                    key={item.branch}
                    className="card card-global"
                    role="listitem"
                    style={{ borderLeft: '3px solid rgba(248,113,113,0.7)' }}
                  >
                    <div className="eyebrow">{item.priority.toUpperCase()} PRIORITY</div>
                    <h4 style={{ margin: '6px 0 8px' }}>{item.branch || 'Unknown branch'}</h4>
                    <p className="muted" style={{ marginTop: 0 }}>
                      Response {fmtPct(item.responseRate)} · Click {fmtPct(item.clickRate)} · Volume{' '}
                      {fmtNum(item.total)}
                    </p>
                    <p style={{ margin: 0 }}>{item.action}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="card-block" style={{ marginBottom: 20 }}>
            <div className="card-block-header">
              <div>
                <p className="eyebrow">Journey Ranking</p>
                <h3>Top Journeys by Engagement</h3>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Journey</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Promotion</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>Rows</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>Response</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>Click</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(data?.topJourneys) ? data.topJourneys : []).map((row) => (
                    <tr key={`${row.journey}-${row.promotion}`}>
                      <td style={{ padding: '8px 10px' }}>{row.journey || '--'}</td>
                      <td style={{ padding: '8px 10px' }}>{row.promotion || '--'}</td>
                      <td style={{ textAlign: 'right', padding: '8px 10px' }}>{fmtNum(row.total)}</td>
                      <td style={{ textAlign: 'right', padding: '8px 10px' }}>
                        {fmtPct(row.responseRate)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px 10px' }}>{fmtPct(row.clickRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card-block">
            <div className="card-block-header">
              <div>
                <p className="eyebrow">Data Freshness</p>
                <h3>Coverage Window</h3>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              Registrations: {fmtDateTime(data?.timeline?.firstRegistrationAt)} -{' '}
              {fmtDateTime(data?.timeline?.lastRegistrationAt)}
            </p>
            <p className="muted" style={{ marginTop: 0 }}>
              Responses: {fmtDateTime(data?.timeline?.firstResponseAt)} -{' '}
              {fmtDateTime(data?.timeline?.lastResponseAt)}
            </p>
            <p className="muted" style={{ marginTop: 0 }}>
              Generated at: {fmtDateTime(data?.generatedAt)}
            </p>
          </section>
        </>
      ) : null}
    </div>
  )
}
