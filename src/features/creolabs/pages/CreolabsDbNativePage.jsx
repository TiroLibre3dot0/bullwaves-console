import { useCallback, useEffect, useMemo, useState } from 'react'
import KpiCard from '../../../components/common/KpiCard'

const DEFAULT_LIMIT = 200
const DEFAULT_CURRENCY = 'USD'

const COLUMNS = [
  { key: 'affiliateId', label: 'Affiliate ID', align: 'left', type: 'text' },
  { key: 'clientId', label: 'Client ID', align: 'left', type: 'text' },
  { key: 'clientName', label: 'Client Name', align: 'left', type: 'text' },
  { key: 'clientLogin', label: 'Client LOGIN', align: 'left', type: 'text' },
  { key: 'user', label: 'User', align: 'left', type: 'text' },
  { key: 'country', label: 'Country', align: 'left', type: 'text' },
  { key: 'date', label: 'DATE', align: 'left', type: 'date' },
  { key: 'balance', label: '$ Balance', align: 'right', type: 'money' },
  { key: 'commission', label: 'LTV Commission', align: 'right', type: 'money' },
  { key: 'closedPl', label: '$ Closed PL', align: 'right', type: 'money' },
  { key: 'openPl', label: '$ Open PL', align: 'right', type: 'money' },
  { key: 'trades', label: '# Trades', align: 'right', type: 'int' },
  { key: 'ftd', label: '$ FTD', align: 'right', type: 'money' },
  { key: 'rdp', label: '$ RDP', align: 'right', type: 'money' },
  { key: 'deposit', label: '$ Deposit', align: 'right', type: 'money' },
  { key: 'wd', label: '$ WD', align: 'right', type: 'money' },
  { key: 'net', label: '$ Net', align: 'right', type: 'money' },
  { key: 'equity', label: '$ Equity', align: 'right', type: 'money' },
]

const moneyFmtCache = new Map()
const intFmt = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const buttonStyle = {
  appearance: 'none',
  border: '1px solid rgba(148,163,184,0.28)',
  background: 'rgba(30,41,59,0.72)',
  color: '#e2e8f0',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
}

function getMoneyFormatter(currencyCode) {
  const code = /^[A-Z]{3}$/.test(String(currencyCode || '').toUpperCase())
    ? String(currencyCode).toUpperCase()
    : DEFAULT_CURRENCY

  if (!moneyFmtCache.has(code)) {
    moneyFmtCache.set(
      code,
      new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
  }

  return moneyFmtCache.get(code)
}

function formatMoney(value, currencyCode = DEFAULT_CURRENCY) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return getMoneyFormatter(currencyCode).format(n)
}

function formatCell(value, type, currencyCode = DEFAULT_CURRENCY) {
  if (type === 'money') return formatMoney(value, currencyCode)
  if (type === 'int') {
    const n = Number(value)
    return Number.isFinite(n) ? intFmt.format(Math.trunc(n)) : '-'
  }
  if (type === 'date') {
    const text = String(value || '')
    return text ? text.slice(0, 10) : '-'
  }
  return String(value || '-')
}

function formatUpdatedAtCompact(value) {
  const raw = String(value || '').trim()
  const t = Date.parse(raw)
  if (!Number.isFinite(t)) return 'n/a'
  const date = new Date(t)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

function formatAgeCompact(ms) {
  const n = Number(ms)
  if (!Number.isFinite(n) || n < 0) return 'n/a'
  if (n < 60 * 1000) return '<1m'
  if (n < 60 * 60 * 1000) return `${Math.floor(n / (60 * 1000))}m`
  if (n < 24 * 60 * 60 * 1000) return `${Math.floor(n / (60 * 60 * 1000))}h`
  return `${Math.floor(n / (24 * 60 * 60 * 1000))}d`
}

function normalizeWarnings(warnings) {
  if (!Array.isArray(warnings) || !warnings.length) return 'none'
  return warnings.join(', ')
}

function resolveCurrencyCode(meta, rows) {
  const fromMeta = String(meta?.query?.currency || meta?.currency || '')
    .trim()
    .toUpperCase()
  if (/^[A-Z]{3}$/.test(fromMeta)) return fromMeta

  const fromRows = Array.isArray(rows)
    ? rows.find((row) =>
        /^[A-Z]{3}$/.test(
          String(row?.currency || '')
            .trim()
            .toUpperCase()
        )
      )
    : null
  const rowCode = String(fromRows?.currency || '')
    .trim()
    .toUpperCase()
  if (/^[A-Z]{3}$/.test(rowCode)) return rowCode

  return DEFAULT_CURRENCY
}

export default function CreolabsDbNativePage() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRows = useCallback(async ({ refresh = false } = {}) => {
    setLoading(true)
    setError('')
    try {
      const query = new window.URLSearchParams()
      query.set('limit', String(DEFAULT_LIMIT))
      if (refresh) query.set('refresh', '1')

      const res = await fetch(`/api/qlik/creolabs/db-native?${query.toString()}`, {
        cache: 'no-store',
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || `db-native failed (${res.status})`)
      }

      setRows(Array.isArray(payload.data.users) ? payload.data.users : [])
      setMeta(payload.data.meta || null)
    } catch (err) {
      setRows([])
      setMeta(null)
      setError(String(err?.message || 'Unable to load DB Native'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const summary = useMemo(() => {
    const q = meta?.queryKpis || {}
    const v = meta?.volumeKpis || {}
    const src = meta?.sourceRows || {}
    const quality = meta?.quality || {}
    const nativeApi = meta?.nativeApi || {}
    const month = meta?.currentMonthKpis || {}
    const currencyCode = resolveCurrencyCode(meta, rows)

    return {
      contract: String(meta?.contractVersion || '-'),
      total: Number(meta?.query?.total || 0),
      source: String(src?.sourceMode || '-'),
      sourceUpdatedAt: formatUpdatedAtCompact(src?.updatedAt || nativeApi?.generatedAt || ''),
      freshness: {
        cached: Boolean(src?.cached),
        cacheAgeMs: Number(src?.cacheAgeMs || 0),
      },
      warnings: normalizeWarnings(quality?.warnings),
      net: Number(v?.net ?? q?.net ?? 0),
      commission: Number(v?.commission ?? q?.commission ?? 0),
      closedPl: Number(v?.closedPl ?? q?.closedPl ?? 0),
      openPl: Number(v?.openPl ?? q?.openPl ?? 0),
      balance: Number(v?.balance ?? q?.balance ?? 0),
      equity: Number(v?.equity ?? q?.equity ?? 0),
      activeTraders: Number(q?.activeTraders || 0),
      leads: Number(q?.totalLeads || 0),
      upstreamRows: Number(src?.upstreamRows || 0),
      upstreamTotal: Number(src?.upstreamTotal || 0),
      reportName: String(meta?.reportName || 'DB Native'),
      reportId: String(meta?.diagnostics?.reportId || '-'),
      month: {
        rows: Number(month?.rows || 0),
        leads: Number(month?.totalLeads || 0),
        ftdCount: Number(month?.withFtd || 0),
        activeTraders: Number(month?.activeTraders || 0),
        ftd: Number(month?.ftd || 0),
        rdp: Number(month?.rdp || 0),
        deposit: Number(month?.deposit || 0),
        wd: Number(month?.wd || 0),
        net: Number(month?.net || 0),
        closedPl: Number(month?.closedPl || 0),
        openPl: Number(month?.openPl || 0),
        balance: Number(month?.balance || 0),
        equity: Number(month?.equity || 0),
        commission: Number(month?.commission || 0),
      },
      currencyCode,
    }
  }, [meta, rows])

  const snapshotCards = useMemo(
    () => [
      {
        label: 'Active traders',
        value: intFmt.format(summary.activeTraders),
        helper: `Total leads: ${intFmt.format(summary.leads)}`,
        tone: '#7dd3fc',
      },
      {
        label: 'Net',
        value: formatMoney(summary.net, summary.currencyCode),
        helper: 'Filtered selection',
        tone: '#34d399',
      },
      {
        label: 'Commission',
        value: formatMoney(summary.commission, summary.currencyCode),
        helper: 'Filtered selection',
        tone: '#f59e0b',
      },
      {
        label: 'Closed PL',
        value: formatMoney(summary.closedPl, summary.currencyCode),
        helper: 'Filtered selection',
        tone: '#2dd4bf',
      },
      {
        label: 'Open PL',
        value: formatMoney(summary.openPl, summary.currencyCode),
        helper: 'Filtered selection',
        tone: '#60a5fa',
      },
    ],
    [summary]
  )

  const monthCards = useMemo(() => {
    const m = summary.month
    const cr = m.leads > 0 ? (m.ftdCount / m.leads) * 100 : null
    const rdpPlusFtd = m.rdp + m.ftd
    const losingRatio = m.deposit > 0 ? Math.abs(m.closedPl) / m.deposit : null

    return [
      {
        label: 'Leads',
        value: intFmt.format(m.leads),
        helper: 'Current month',
        tone: '#7dd3fc',
      },
      {
        label: 'FTDs',
        value: intFmt.format(m.ftdCount),
        helper: 'Clients with FTD > 0',
        tone: '#818cf8',
      },
      {
        label: 'CR%',
        value: cr !== null ? `${cr.toFixed(1)}%` : '-',
        helper: 'FTDs / Leads',
        tone: '#a78bfa',
      },
      {
        label: 'Volume FTDs',
        value: formatMoney(m.ftd, summary.currencyCode),
        helper: 'Current month',
        tone: '#34d399',
      },
      {
        label: '$ RDP',
        value: formatMoney(m.rdp, summary.currencyCode),
        helper: 'Current month',
        tone: '#2dd4bf',
      },
      {
        label: 'RDP + FTD',
        value: formatMoney(rdpPlusFtd, summary.currencyCode),
        helper: 'RDP + Volume FTDs',
        tone: '#22d3ee',
      },
      {
        label: 'WD',
        value: formatMoney(m.wd, summary.currencyCode),
        helper: 'Current month',
        tone: '#f87171',
      },
      {
        label: 'NET',
        value: formatMoney(m.net, summary.currencyCode),
        helper: 'Current month',
        tone: '#4ade80',
      },
      {
        label: 'Closed PL',
        value: formatMoney(m.closedPl, summary.currencyCode),
        helper: 'Current month',
        tone: '#fb923c',
      },
      {
        label: 'Losing ratio',
        value: losingRatio !== null ? `${(losingRatio * 100).toFixed(1)}%` : '-',
        helper: '|Closed PL| / Deposit',
        tone: '#f43f5e',
      },
    ]
  }, [summary])
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div
        style={{
          border: '1px solid rgba(148,163,184,0.24)',
          borderRadius: 10,
          background: 'rgba(15,23,42,0.6)',
          padding: 12,
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800 }}>DB Native</div>
        <div style={{ fontSize: 13, color: '#cbd5e1' }}>
          Modello standalone su API stabile BI. Nessuna dipendenza operativa dai flussi DB Live
          legacy.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Contract: {summary.contract} | Report: {summary.reportName} ({summary.reportId}) |
            Updated: {summary.sourceUpdatedAt}
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 999,
              padding: '4px 10px',
              color: summary.freshness.cached ? '#fef3c7' : '#dcfce7',
              border: summary.freshness.cached
                ? '1px solid rgba(245,158,11,0.4)'
                : '1px solid rgba(34,197,94,0.35)',
              background: summary.freshness.cached
                ? 'rgba(245,158,11,0.14)'
                : 'rgba(34,197,94,0.14)',
            }}
          >
            {summary.freshness.cached ? 'CACHE' : 'LIVE'} - age{' '}
            {formatAgeCompact(summary.freshness.cacheAgeMs)}
          </span>
        </div>
      </div>

      <section
        style={{
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.24)',
          background: 'rgba(15,23,42,0.55)',
          padding: 14,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800 }}>Snapshot</div>
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          }}
        >
          {snapshotCards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              tone={card.tone}
              size="sm"
              density="compact"
            />
          ))}
        </div>
      </section>

      <section
        style={{
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.24)',
          background: 'rgba(15,23,42,0.55)',
          padding: 14,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800 }}>Current Month</div>
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          }}
        >
          {monthCards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              tone={card.tone}
              size="sm"
              density="compact"
            />
          ))}
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => loadRows({ refresh: true })}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Refreshing...' : 'Refresh source'}
        </button>
      </div>

      {summary.warnings !== 'none' ? (
        <div
          style={{
            color: '#f8fafc',
            background: 'rgba(15,23,42,0.55)',
            border: '1px solid rgba(245,158,11,0.26)',
            padding: '10px 12px',
            borderRadius: 10,
            fontSize: 13,
          }}
        >
          API warnings: {summary.warnings}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            color: '#ffe8bd',
            background: 'rgba(15,23,42,0.55)',
            border: '1px solid rgba(245,158,11,0.24)',
            padding: '10px 12px',
            borderRadius: 10,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.24)',
          background: 'rgba(15,23,42,0.55)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            fontSize: 12,
            color: '#93c5fd',
            borderBottom: '1px solid rgba(148,163,184,0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span>Native DB table</span>
          <span>Rows loaded {rows.length}</span>
        </div>

        <div style={{ overflow: 'auto', maxHeight: '70vh' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 2400 }}>
            <thead>
              <tr
                style={{ position: 'sticky', top: 0, background: 'rgba(30,41,59,0.96)', zIndex: 1 }}
              >
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    style={{
                      textAlign: column.align,
                      color: '#cbd5e1',
                      fontSize: 12,
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(148,163,184,0.18)',
                    }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const dateValue = row?.date || String(row?.clientTimestamp || '').slice(0, 10)
                return (
                  <tr key={`${row.clientId || 'n/a'}-${row.clientTimestamp || idx}`}>
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        style={{
                          textAlign: column.align,
                          color: '#e2e8f0',
                          fontSize: 12,
                          padding: '9px 12px',
                          borderBottom: '1px solid rgba(148,163,184,0.10)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatCell(
                          column.key === 'date' ? dateValue : row?.[column.key],
                          column.type,
                          summary.currencyCode
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
              {!rows.length && !loading ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    style={{ padding: 18, color: '#94a3b8', textAlign: 'center' }}
                  >
                    No rows available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
