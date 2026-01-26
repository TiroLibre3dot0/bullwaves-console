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
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.35)',
            background: 'rgba(239,68,68,0.10)',
          }}
        >
          <div style={{ fontWeight: 600 }}>Analytics unavailable</div>
          <div style={{ opacity: 0.85, marginTop: 4 }}>{error}</div>
          <div style={{ opacity: 0.75, marginTop: 8 }}>
            Configure server env vars: PLAUSIBLE_STATS_API_KEY and PLAUSIBLE_SITE_ID.
          </div>
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
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>event</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>props</th>
              </tr>
            </thead>
            <tbody>
              {localEvents.map((e, idx) => (
                <tr
                  key={`${e.ts}-${idx}`}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    {new Date(e.ts).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{e.eventName}</td>
                  <td
                    style={{
                      padding: '10px 14px',
                      maxWidth: 720,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={JSON.stringify(e.props || {})}
                  >
                    {JSON.stringify(e.props || {})}
                  </td>
                </tr>
              ))}
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
