import { useEffect, useMemo, useState } from 'react'
import {
  fetchBrokereeHealth,
  fetchBrokereePerformance,
} from '../services/brokereePerformanceService'

function formatMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 'n/a'
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(num)
}

function formatCount(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  return new Intl.NumberFormat('it-IT').format(num)
}

function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function defaultDateRange() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 30)
  return {
    from: toIsoDate(from),
    to: toIsoDate(to),
  }
}

function SourceStatusBadge({ ok, skipped }) {
  if (skipped) {
    return (
      <span className="chip" style={{ background: 'rgba(148, 163, 184, 0.25)', color: '#cbd5e1' }}>
        Non configurato
      </span>
    )
  }
  if (ok) {
    return (
      <span className="chip" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#86efac' }}>
        OK
      </span>
    )
  }
  return (
    <span className="chip" style={{ background: 'rgba(248, 113, 113, 0.2)', color: '#fca5a5' }}>
      Errore
    </span>
  )
}

export default function BrokereePerformancePanel() {
  const [{ from, to }, setRange] = useState(() => defaultDateRange())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [health, setHealth] = useState(null)
  const [data, setData] = useState(null)

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const [healthResp, performanceResp] = await Promise.all([
        fetchBrokereeHealth(),
        fetchBrokereePerformance({ from, to }),
      ])
      setHealth(healthResp)
      setData(performanceResp)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante il caricamento Brokeree')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const summary = data?.summary || {}
  const sources = Array.isArray(data?.sources) ? data.sources : []
  const topProviders = Array.isArray(data?.top?.providers) ? data.top.providers : []
  const topOffers = Array.isArray(data?.top?.offers) ? data.top.offers : []

  const freshnessText = useMemo(() => {
    if (!data?.fetchedAt) return 'n/a'
    const d = new Date(data.fetchedAt)
    if (Number.isNaN(d.getTime())) return 'n/a'
    return d.toLocaleString('it-IT')
  }, [data?.fetchedAt])

  return (
    <section className="card-block" style={{ marginBottom: 20 }}>
      <div className="card-block-header">
        <div>
          <p className="eyebrow">Brokeree</p>
          <h3>Performance Dashboard</h3>
          <p className="muted">
            Vista performance interna senza download manuali: KPI principali, top performer e stato
            delle sorgenti API.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="muted" style={{ fontSize: 12 }}>
            Dal
            <input
              type="date"
              value={from}
              onChange={(event) => setRange((prev) => ({ ...prev, from: event.target.value }))}
              style={{ marginLeft: 8 }}
            />
          </label>
          <label className="muted" style={{ fontSize: 12 }}>
            Al
            <input
              type="date"
              value={to}
              onChange={(event) => setRange((prev) => ({ ...prev, to: event.target.value }))}
              style={{ marginLeft: 8 }}
            />
          </label>
          <button type="button" className="btn" onClick={refresh} disabled={loading}>
            {loading ? 'Aggiorno...' : 'Aggiorna'}
          </button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            border: '1px solid rgba(248, 113, 113, 0.45)',
            borderRadius: 12,
            padding: 12,
            background: 'rgba(127, 29, 29, 0.25)',
            color: '#fecaca',
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      {!health?.configured ? (
        <div
          style={{
            border: '1px solid var(--border-primary)',
            borderRadius: 12,
            padding: 12,
            background: 'rgba(15, 23, 42, 0.35)',
            marginBottom: 12,
          }}
        >
          <p className="muted" style={{ margin: 0 }}>
            Integrazione non configurata. Imposta almeno BROKEREE_BASE_URL e
            BROKEREE_API_TOKEN nel file .env.server.local.
          </p>
        </div>
      ) : null}

      <div className="card-columns" role="list" style={{ marginBottom: 12 }}>
        <div className="card card-global" role="listitem">
          <div className="eyebrow">Offers Earnings</div>
          <h4 style={{ margin: '6px 0 0' }}>{formatMoney(summary.offersEarnings)}</h4>
        </div>

        <div className="card card-global" role="listitem">
          <div className="eyebrow">Providers Earnings</div>
          <h4 style={{ margin: '6px 0 0' }}>{formatMoney(summary.providersEarnings)}</h4>
        </div>

        <div className="card card-global" role="listitem">
          <div className="eyebrow">Fees Paid</div>
          <h4 style={{ margin: '6px 0 0' }}>{formatMoney(summary.feesPaid)}</h4>
        </div>

        <div className="card card-global" role="listitem">
          <div className="eyebrow">Net Result</div>
          <h4 style={{ margin: '6px 0 0' }}>{formatMoney(summary.netResult)}</h4>
        </div>

        <div className="card card-global" role="listitem">
          <div className="eyebrow">Published Positions</div>
          <h4 style={{ margin: '6px 0 0' }}>{formatCount(summary.publishedPositions)}</h4>
        </div>

        <div className="card card-global" role="listitem">
          <div className="eyebrow">Copied Positions</div>
          <h4 style={{ margin: '6px 0 0' }}>{formatCount(summary.copiedPositions)}</h4>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            border: '1px solid var(--panel-border, #2a2f40)',
            borderRadius: 12,
            padding: 12,
            background: 'rgba(15, 23, 42, 0.4)',
          }}
        >
          <div className="eyebrow">Top Providers</div>
          {topProviders.length ? (
            <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
              {topProviders.map((row) => (
                <li key={`provider-${row.rank}-${row.label}`} className="muted">
                  {row.label}: {formatMoney(row.value)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ marginTop: 10 }}>
              Nessun dato disponibile
            </p>
          )}
        </div>

        <div
          style={{
            border: '1px solid var(--panel-border, #2a2f40)',
            borderRadius: 12,
            padding: 12,
            background: 'rgba(15, 23, 42, 0.4)',
          }}
        >
          <div className="eyebrow">Top Offers</div>
          {topOffers.length ? (
            <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
              {topOffers.map((row) => (
                <li key={`offer-${row.rank}-${row.label}`} className="muted">
                  {row.label}: {formatMoney(row.value)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ marginTop: 10 }}>
              Nessun dato disponibile
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--panel-border, #2a2f40)',
          borderRadius: 12,
          padding: 12,
          background: 'rgba(15, 23, 42, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p className="muted" style={{ margin: 0 }}>
            Ultimo aggiornamento: {freshnessText}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Intervallo: {from || 'n/a'} → {to || 'n/a'}
          </p>
        </div>

        <div style={{ marginTop: 12, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: 540 }}>
            <thead>
              <tr>
                <th>Sorgente</th>
                <th>Stato</th>
                <th>Righe</th>
                <th>HTTP</th>
                <th>Errore</th>
              </tr>
            </thead>
            <tbody>
              {sources.length ? (
                sources.map((source) => (
                  <tr key={source.key}>
                    <td>{source.label}</td>
                    <td>
                      <SourceStatusBadge ok={source.ok} skipped={source.skipped} />
                    </td>
                    <td>{formatCount(source.count)}</td>
                    <td>{source.status || 'n/a'}</td>
                    <td className="muted">{source.error || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="muted">
                    Nessuna sorgente caricata
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
