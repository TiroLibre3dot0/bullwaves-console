// Badge color per tipo evento
const EVENT_COLORS = {
  public_share_open: '#6366f1',
  page_view: '#10b981',
  support_botlist: '#f59e42',
  default: '#64748b',
}

// Icona per tipo evento
const EVENT_ICONS = {
  public_share_open: '🔗',
  page_view: '👁️',
  support_botlist: '🤖',
  default: '📊',
}

function describeEvent(eventName, props) {
  if (eventName === 'public_share_open') {
    let kind = props?.kind || ''
    let share = ''
    if (kind === 'org_chart') share = 'Organigramma'
    else if (kind === 'project_board') share = 'Project Board'
    else if (kind === 'affiliate_reports') share = 'Report Affiliato'
    else if (kind) share = kind.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    else share = 'Link pubblico'

    let details = []
    if (props?.variant)
      details.push(
        <span
          style={{
            background: '#e0e7ff',
            color: '#3730a3',
            borderRadius: 6,
            padding: '2px 7px',
            marginRight: 4,
            fontWeight: 600,
          }}
        >
          Vista: {props.variant}
        </span>
      )
    if (props?.mode)
      details.push(
        <span
          style={{
            background: '#fef9c3',
            color: '#92400e',
            borderRadius: 6,
            padding: '2px 7px',
            marginRight: 4,
            fontWeight: 600,
          }}
        >
          Modalità: {props.mode}
        </span>
      )
    if (props?.period)
      details.push(
        <span
          style={{
            background: '#bbf7d0',
            color: '#166534',
            borderRadius: 6,
            padding: '2px 7px',
            marginRight: 4,
            fontWeight: 600,
          }}
        >
          Periodo: {props.period}
        </span>
      )
    if (props?.generated_at)
      details.push(
        <span
          style={{
            background: '#f1f5f9',
            color: '#334155',
            borderRadius: 6,
            padding: '2px 7px',
            marginRight: 4,
          }}
        >
          Creato il: {formatDateTime(props.generated_at)}
        </span>
      )
    if (props?.share_id)
      details.push(
        <span
          style={{
            background: '#f3e8ff',
            color: '#7c3aed',
            borderRadius: 6,
            padding: '2px 7px',
            marginRight: 4,
          }}
        >
          ID: {props.share_id}
        </span>
      )
    return (
      <span>
        <b>{share}</b> {details}
      </span>
    )
  }
  if (eventName === 'page_view') {
    return (
      <span>
        <b>Page View</b>{' '}
        {props?.page && (
          <span
            style={{
              background: '#d1fae5',
              color: '#065f46',
              borderRadius: 6,
              padding: '2px 7px',
              marginRight: 4,
            }}
          >
            page: {props.page}
          </span>
        )}{' '}
        {props?.access && (
          <span
            style={{
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: 6,
              padding: '2px 7px',
              marginRight: 4,
            }}
          >
            access: {props.access}
          </span>
        )}
      </span>
    )
  }
  if (eventName === 'support_botlist') {
    return (
      <span>
        <b>Support Botlist</b>{' '}
        {props?.share_id && (
          <span
            style={{
              background: '#f3e8ff',
              color: '#7c3aed',
              borderRadius: 6,
              padding: '2px 7px',
              marginRight: 4,
            }}
          >
            ID: {props.share_id}
          </span>
        )}{' '}
        {props?.kind && (
          <span
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: 6,
              padding: '2px 7px',
              marginRight: 4,
            }}
          >
            kind: {props.kind}
          </span>
        )}
      </span>
    )
  }
  // fallback generico
  return (
    <span>
      <b>{eventName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</b>
    </span>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { clearLocalEvents, getRecentLocalEvents } from '../../../utils/analytics'

const RANGE_OPTIONS = [
  { value: 'day', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '12mo', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
]

function formatNumber(n) {
  try {
    return new Intl.NumberFormat().format(n || 0)
  } catch {
    return String(n || 0)
  }
}

function formatDateTime(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}

function Table({ title, rows, dimKey }) {
  return (
    <div
      style={{
        border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(30,41,59,0.85)',
        boxShadow: '0 2px 12px 0 rgba(30,41,59,0.10)',
        marginBottom: 18,
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', opacity: 0.85 }}>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>{dimKey}</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>events</th>
            </tr>
          </thead>
          <tbody>
            {(rows?.length ? rows : []).map((r, idx) => (
              <tr
                key={`${r[dimKey]}-${idx}`}
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <td
                  style={{
                    padding: '10px 14px',
                    maxWidth: 520,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={r[dimKey]}
                >
                  {r[dimKey] || '(empty)'}
                </td>
                <td style={{ padding: '10px 14px' }}>{formatNumber(r.events)}</td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td style={{ padding: '12px 14px', opacity: 0.7 }} colSpan={2}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function CustomEventsPage() {
  const [range, setRange] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [localEventsVersion, setLocalEventsVersion] = useState(0)

  const localEvents = useMemo(() => {
    return getRecentLocalEvents(50)
  }, [localEventsVersion])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const resp = await fetch(
        `/api/analytics/public-share-open?range=${encodeURIComponent(range)}`
      )
      const json = await resp.json().catch(() => null)

      if (!resp.ok || !json?.ok) {
        const msg = json?.error || `Request failed (${resp.status})`
        throw new Error(msg)
      }

      setData(json)
    } catch (e) {
      setData(null)
      setError(e?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Lightweight polling to keep local event preview fresh.
  useEffect(() => {
    const id = window.setInterval(() => setLocalEventsVersion((v) => v + 1), 1500)
    return () => window.clearInterval(id)
  }, [])

  const totalEvents = data?.totalEvents ?? 0

  return (
    <div style={{ padding: '18px 16px', maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Custom Events</div>
          <div style={{ opacity: 0.75, marginTop: 4 }}>
            Visibility for `public_share_open` (Plausible goal)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'inherit',
            }}
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            onClick={refresh}
            disabled={loading}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: loading ? 'rgba(255,255,255,0.06)' : 'rgba(99, 102, 241, 0.25)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 18,
            padding: '18px 18px',
            borderRadius: 16,
            border: '1px solid #f87171',
            background: 'linear-gradient(90deg, #f87171 0%, #fbbf24 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            boxShadow: '0 2px 12px 0 rgba(239,68,68,0.10)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 28, marginRight: 8 }}>⚠️</span>
          <span>
            Analytics non disponibili
            <br />
            <span style={{ fontWeight: 400, opacity: 0.95 }}>{error}</span>
            <br />
            <span style={{ fontWeight: 400, opacity: 0.85 }}>
              Verifica le variabili d'ambiente <b>PLAUSIBLE_STATS_API_KEY</b> e{' '}
              <b>PLAUSIBLE_SITE_ID</b> sul server.
              <br />
              La preview locale funziona comunque.
            </span>
          </span>
        </div>
      )}

      {!error && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          <div
            style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}
          >
            <div style={{ opacity: 0.75 }}>Total events</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
              {formatNumber(totalEvents)}
            </div>
            <div style={{ opacity: 0.65, marginTop: 6 }}>Range: {data?.range || range}</div>
          </div>
          <div
            style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}
          >
            <div style={{ opacity: 0.75 }}>Plausible site</div>
            <div
              style={{
                fontWeight: 700,
                marginTop: 6,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={data?.siteId || ''}
            >
              {data?.siteId || '—'}
            </div>
            <div style={{ opacity: 0.65, marginTop: 6 }}>Goal: public_share_open</div>
          </div>
          <div
            style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}
          >
            <div style={{ opacity: 0.75 }}>Client tracker</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>Plausible + local preview</div>
            <div style={{ opacity: 0.65, marginTop: 6 }}>Local events shown below</div>
          </div>
        </div>
      )}

      {!error && totalEvents === 0 && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ fontWeight: 600 }}>Seeing 0?</div>
          <div style={{ opacity: 0.8, marginTop: 4 }}>
            Make sure you created a Plausible goal named <b>public_share_open</b> (custom event),
            and that the domain matches.
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
          marginTop: 16,
        }}
      >
        <Table title="By kind" rows={data?.byKind} dimKey="kind" />
        <Table title="By device" rows={data?.byDevice} dimKey="device" />
        <Table title="By page" rows={data?.byPage} dimKey="page" />
        <Table title="By referrer" rows={data?.byReferrer} dimKey="referrer" />
      </div>

      <div
        style={{
          marginTop: 18,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontWeight: 700 }}>Local preview (last 50)</div>
          <button
            onClick={() => {
              clearLocalEvents()
              setLocalEventsVersion((v) => v + 1)
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', opacity: 0.85 }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>time</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>evento</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>dettagli</th>
              </tr>
            </thead>
            <tbody>
              {localEvents.map((e, idx) => {
                const color = EVENT_COLORS[e.eventName] || EVENT_COLORS.default
                const icon = EVENT_ICONS[e.eventName] || EVENT_ICONS.default
                return (
                  <tr
                    key={`${e.ts}-${idx}`}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {formatDateTime(e.ts)}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 700 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: color,
                          color: '#fff',
                          borderRadius: 8,
                          padding: '2px 10px',
                          marginRight: 8,
                          fontSize: 15,
                          fontWeight: 800,
                          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
                        }}
                      >
                        {icon}
                      </span>{' '}
                      {describeEvent(e.eventName, e.props)}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        maxWidth: 720,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        opacity: 0.85,
                      }}
                      title={JSON.stringify(e.props || {})}
                    >
                      {Object.keys(e.props || {}).length
                        ? Object.entries(e.props)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' | ')
                        : '—'}
                    </td>
                  </tr>
                )
              })}
              {!localEvents.length && (
                <tr>
                  <td style={{ padding: '12px 14px', opacity: 0.7 }} colSpan={3}>
                    No local events yet. Open any public share link to generate `public_share_open`.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ opacity: 0.65, marginTop: 14, fontSize: 13 }}>
        Note: local preview is stored in the browser only; Plausible numbers are authoritative.
      </div>
    </div>
  )
}
