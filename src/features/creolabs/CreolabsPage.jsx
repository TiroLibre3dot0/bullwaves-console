import { useEffect, useMemo, useState } from 'react'
import { fetchQlikItems } from '../reportsHub/services/qlikConsoleService'
import { loadCreolabsClientsTable } from './services/creolabsService'

const QLIK_TENANT = 'https://creolabs.uk.qlikcloud.com'

const moneyFmt = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const intFmt = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function toNumber(value) {
  if (isFiniteNumber(value)) return value
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function periodToRank(periodId) {
  const s = String(periodId || '').trim()
  const m = s.match(/^(\d{4})-([A-Za-z]{3})$/)
  if (!m) return -1
  const year = Number(m[1])
  const mon = String(m[2]).toLowerCase()
  const map = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  }
  const month = map[mon]
  if (!year || !month) return -1
  return year * 100 + month
}

function isPlaceholderClientName(name) {
  const s = String(name || '')
    .trim()
    .toLowerCase()
  return !s || s === 'name' || s === 'unknown' || s === '-'
}

function formatMetric(key, value) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '-'
  if (key === 'trades') return intFmt.format(Math.round(n))
  return moneyFmt.format(n)
}

export default function CreolabsPage() {
  const [apps, setApps] = useState([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [appsError, setAppsError] = useState('')

  const [loadingTable, setLoadingTable] = useState(true)
  const [tableError, setTableError] = useState('')
  const [tableRows, setTableRows] = useState([])
  const [comparisonRows, setComparisonRows] = useState([])
  const [tableMetrics, setTableMetrics] = useState([])
  const [tablePeriod, setTablePeriod] = useState('')
  const [livePlData, setLivePlData] = useState(new Map())
  const [loadingLivePl, setLoadingLivePl] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadingApps(true)
    setAppsError('')
    fetchQlikItems(50)
      .then((res) => {
        if (cancelled) return
        const rows = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : []
        setApps(rows.filter((r) => r.resourceType === 'app'))
      })
      .catch((e) => {
        if (cancelled) return
        setAppsError(
          e instanceof Error ? e.message : 'Errore durante il caricamento delle app Qlik'
        )
      })
      .finally(() => {
        if (!cancelled) setLoadingApps(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingTable(true)
    setTableError('')

    loadCreolabsClientsTable({ force: true })
      .then((payload) => {
        if (cancelled) return

        const rawRows = Array.isArray(payload?.rows) ? payload.rows : []
        if (!rawRows.length) {
          setTableRows([])
          setComparisonRows([])
          setTableMetrics([])
          setTablePeriod('')
          return
        }

        const validRows = rawRows.filter((r) => r && typeof r === 'object')
        const validPeriods = [
          ...new Set(validRows.map((r) => String(r.periodId || '').trim())),
        ].filter(Boolean)

        validPeriods.sort((a, b) => periodToRank(b) - periodToRank(a))
        const latestPeriod = validPeriods[0] || ''
        const periodRows = validRows.filter((r) => String(r.periodId || '').trim() === latestPeriod)

        const excluded = new Set([
          'periodId',
          'clientId',
          'clientLogin',
          'clientName',
          'affiliateId',
          'user',
          'country',
          'brand',
        ])

        const metricSet = new Set()
        for (const row of periodRows) {
          for (const key of Object.keys(row || {})) {
            if (excluded.has(key)) continue
            if (toNumber(row[key]) != null) metricSet.add(key)
          }
        }

        const preferredOrder = ['deposit', 'wd', 'net', 'pl', 'commission', 'balance', 'trades']
        const metrics = [...metricSet].sort((a, b) => {
          const ai = preferredOrder.indexOf(a)
          const bi = preferredOrder.indexOf(b)
          if (ai >= 0 && bi >= 0) return ai - bi
          if (ai >= 0) return -1
          if (bi >= 0) return 1
          return a.localeCompare(b)
        })

        const byClient = new Map()
        for (const row of periodRows) {
          const clientName = String(row.clientName || '').trim()
          if (isPlaceholderClientName(clientName)) continue

          const key = [clientName, String(row.clientId || ''), String(row.clientLogin || '')].join(
            '|'
          )
          let agg = byClient.get(key)

          if (!agg) {
            agg = {
              clientName,
              clientId: row.clientId || '-',
              clientLogin: row.clientLogin || '-',
              affiliateId: row.affiliateId || '-',
              user: row.user || '-',
              country: row.country || '-',
              brand: row.brand || '-',
              metrics: Object.fromEntries(metrics.map((m) => [m, 0])),
            }
            byClient.set(key, agg)
          }

          for (const metric of metrics) {
            const n = toNumber(row[metric])
            if (n != null) agg.metrics[metric] += n
          }
        }

        const rankScore = (r) => {
          const trades = Number(r.metrics.trades || 0)
          const net = Math.abs(Number(r.metrics.net || 0))
          const pl = Math.abs(Number(r.metrics.pl || 0))
          return trades * 1_000_000 + net * 100 + pl
        }

        const allClients = [...byClient.values()]
        const top10 = allClients.sort((a, b) => rankScore(b) - rankScore(a)).slice(0, 10)

        const top5ByPl = [...byClient.values()]
          .sort((a, b) => Math.abs(Number(b.metrics.pl || 0)) - Math.abs(Number(a.metrics.pl || 0)))
          .slice(0, 5)

        setTablePeriod(latestPeriod)
        setTableMetrics(metrics)
        setTableRows(top10)
        setComparisonRows(top5ByPl)
      })
      .catch((e) => {
        if (cancelled) return
        setTableError(
          e instanceof Error ? e.message : 'Errore durante il caricamento della tabella CREOLABS'
        )
        setTableRows([])
        setComparisonRows([])
        setTableMetrics([])
        setTablePeriod('')
      })
      .finally(() => {
        if (!cancelled) setLoadingTable(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingLivePl(true)
    fetch('/api/qlik/creolabs/live-pl?limit=50&maxRows=5000')
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        const clients = Array.isArray(body?.data?.clients) ? body.data.clients : []
        const map = new Map()
        for (const c of clients) {
          if (c.clientName) map.set(c.clientName, c.plLive)
        }
        setLivePlData(map)
      })
      .catch(() => {
        // silently ignore – live column stays empty
      })
      .finally(() => {
        if (!cancelled) setLoadingLivePl(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const tableStats = useMemo(
    () => ({ users: tableRows.length, metrics: tableMetrics.length, period: tablePeriod || '-' }),
    [tableRows.length, tableMetrics.length, tablePeriod]
  )

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-label">CREOLABS</p>
          <h1 className="page-title">Qlik Cloud</h1>
          <p className="page-subtitle">
            App analitiche disponibili nel tenant Creolabs. Clic su una card per aprirla in Qlik
            Cloud.
          </p>
        </div>
      </header>

      <section className="card-block">
        <div className="card-block-header">
          <div>
            <p className="eyebrow">App disponibili</p>
            <h3>CREOLABS · {loadingApps ? '…' : apps.length} app</h3>
          </div>
        </div>

        {appsError ? (
          <div
            style={{
              border: '1px solid rgba(239,68,68,0.45)',
              borderRadius: 12,
              padding: 14,
              background: 'rgba(127,29,29,0.25)',
              color: '#fecaca',
            }}
          >
            {appsError}
          </div>
        ) : loadingApps ? (
          <p className="muted">Caricamento app in corso…</p>
        ) : apps.length === 0 ? (
          <p className="muted">Nessuna app trovata. Verifica la connessione Qlik.</p>
        ) : (
          <div className="card-columns" role="list">
            {apps.map((app) => (
              <a
                key={app.resourceId}
                href={`${QLIK_TENANT}/sense/app/${app.resourceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-global"
                style={{ textDecoration: 'none', display: 'block', textAlign: 'left' }}
                role="listitem"
              >
                <div className="eyebrow">Qlik App</div>
                <h4 style={{ margin: '6px 0 4px' }}>{app.name}</h4>
                <p
                  className="muted"
                  style={{ marginTop: 6, fontSize: '0.76rem', wordBreak: 'break-all' }}
                >
                  {app.resourceId}
                </p>
                <p className="muted" style={{ marginTop: 8, fontSize: '0.8rem' }}>
                  Apri in Qlik Cloud →
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="card-block" style={{ marginTop: 20 }}>
        <div className="card-block-header">
          <div>
            <p className="eyebrow">DB Comparison</p>
            <h3>CREOLABS · Top 5 Clients (Local vs Live)</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Confronto dati locali con DB live. Periodo: <strong>{tableStats.period}</strong>
            </p>
          </div>
        </div>

        {tableError ? (
          <div
            style={{
              border: '1px solid rgba(239,68,68,0.45)',
              borderRadius: 12,
              padding: 14,
              background: 'rgba(127,29,29,0.25)',
              color: '#fecaca',
            }}
          >
            {tableError}
          </div>
        ) : loadingTable ? (
          <p className="muted">Caricamento dati di confronto…</p>
        ) : comparisonRows.length === 0 ? (
          <p className="muted">Nessun dato disponibile per il confronto.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 900,
                fontSize: '0.84rem',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'rgba(71, 85, 105, 0.3)' }}>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Period</th>
                  <th style={thStyle}>Trades</th>
                  <th style={{ ...thStyle, color: '#94e7d5' }}>PL Local €</th>
                  <th style={{ ...thStyle, color: '#fbbf24' }}>PL Live €</th>
                  <th style={{ ...thStyle, color: '#f87171' }}>Diff %</th>
                  <th style={thStyle}>Balance €</th>
                  <th style={thStyle}>Net €</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => {
                  const plLocal = Number(row.metrics.pl || 0)
                  const plLive = livePlData.has(row.clientName)
                    ? livePlData.get(row.clientName)
                    : null
                  const diffPct =
                    plLive !== null
                      ? (((plLive - plLocal) / Math.max(Math.abs(plLocal), 1)) * 100).toFixed(1)
                      : '-'

                  return (
                    <tr
                      key={`${row.clientName}-${row.clientId}-${idx}`}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'rgba(15, 23, 42, 0.5)' : 'transparent',
                      }}
                    >
                      <td style={tdStyle}>
                        <strong>{row.clientName}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                          {row.clientId} / {row.clientLogin}
                        </div>
                      </td>
                      <td style={tdStyle}>{tableStats.period}</td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatMetric('trades', row.metrics.trades)}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          color: '#94e7d5',
                        }}
                      >
                        {formatMetric('pl', plLocal)}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          color: '#fbbf24',
                        }}
                      >
                        {loadingLivePl ? (
                          <span style={{ opacity: 0.4 }}>…</span>
                        ) : plLive !== null ? (
                          formatMetric('pl', plLive)
                        ) : (
                          <span style={{ opacity: 0.6 }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          color: '#f87171',
                        }}
                      >
                        {diffPct}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatMetric('balance', row.metrics.balance)}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatMetric('net', row.metrics.net)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 8,
                background: 'rgba(71, 85, 105, 0.2)',
                fontSize: '0.78rem',
                color: '#cbd5e1',
              }}
            >
              <p style={{ margin: 0, marginBottom: 6 }}>
                📊 <strong>Legenda:</strong> Colonna{' '}
                <span style={{ color: '#94e7d5' }}>PL Local</span> caricata da
                pubblico/creolabs_clients_table.json.
              </p>
              <p style={{ margin: 0 }}>
                Colonna <span style={{ color: '#fbbf24' }}>PL Live</span> sarà poppolata da query
                API Qlik (in fase di implementazione). La colonna{' '}
                <span style={{ color: '#f87171' }}>Diff %</span> mostrerà la percentuale di
                differenza tra i due.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="card-block" style={{ marginTop: 20 }}>
        <div className="card-block-header">
          <div>
            <p className="eyebrow">Console Data</p>
            <h3>CREOLABS · Top 10 utenti + metriche complete</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Periodo: <strong>{tableStats.period}</strong> · Utenti:{' '}
              <strong>{tableStats.users}</strong> · Metriche: <strong>{tableStats.metrics}</strong>
            </p>
          </div>
        </div>

        {tableError ? (
          <div
            style={{
              border: '1px solid rgba(239,68,68,0.45)',
              borderRadius: 12,
              padding: 14,
              background: 'rgba(127,29,29,0.25)',
              color: '#fecaca',
            }}
          >
            {tableError}
          </div>
        ) : loadingTable ? (
          <p className="muted">Caricamento tabella in corso…</p>
        ) : tableRows.length === 0 ? (
          <p className="muted">Nessun dato disponibile per la tabella CREOLABS.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 1200,
                fontSize: '0.86rem',
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Client Name</th>
                  <th style={thStyle}>Client ID</th>
                  <th style={thStyle}>Client LOGIN</th>
                  <th style={thStyle}>Affiliate ID</th>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Country</th>
                  <th style={thStyle}>Brand</th>
                  {tableMetrics.map((metric) => (
                    <th key={metric} style={thStyle}>
                      {metric}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={`${row.clientName}-${row.clientId}-${row.clientLogin}`}>
                    <td style={tdStyle}>{row.clientName}</td>
                    <td style={tdStyle}>{row.clientId}</td>
                    <td style={tdStyle}>{row.clientLogin}</td>
                    <td style={tdStyle}>{row.affiliateId}</td>
                    <td style={tdStyle}>{row.user}</td>
                    <td style={tdStyle}>{row.country}</td>
                    <td style={tdStyle}>{row.brand || '-'}</td>
                    {tableMetrics.map((metric) => (
                      <td
                        key={metric}
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatMetric(metric, row.metrics[metric])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(148,163,184,0.25)',
  color: '#94a3b8',
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(148,163,184,0.14)',
  color: '#e2e8f0',
  whiteSpace: 'nowrap',
}
