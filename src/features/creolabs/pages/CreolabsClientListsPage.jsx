import { useCallback, useEffect, useMemo, useState } from 'react'
import FullPageLoader from '../../../components/FullPageLoader'

const BRANDS = ['BW', 'BW Global']
const LISTS = [
  {
    key: 'deposited',
    label: 'Depositato (successo)',
    metricLabel: 'Deposit ($)',
    metricKey: 'deposit',
    color: '#38bdf8',
  },
  {
    key: 'withdrawn',
    label: 'Prelevato (successo)',
    metricLabel: 'Withdrawal ($)',
    metricKey: 'wd',
    color: '#fb7185',
  },
  {
    key: 'inProfit',
    label: 'In Profitto',
    metricLabel: 'P&L ($)',
    metricKey: 'pl',
    color: '#4ade80',
  },
]

const DAYS_OPTIONS = [7, 14, 30, 60, 90]

const fmt2 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt0 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

function fmtMoney(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return fmt2.format(n)
}
function fmtCount(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return fmt0.format(n)
}
function fmtPl(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  const s = fmt2.format(Math.abs(n))
  return n < 0 ? `-${s}` : s
}

function derivePl(row) {
  return (Number(row?.closedPl) || 0) + (Number(row?.openPl) || 0)
}

function escapeCell(v) {
  const s = String(v == null ? '' : v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(rows, listKey, brand, days) {
  const headers = [
    'clientId',
    'clientName',
    'clientLogin',
    'affiliateId',
    'country',
    'deposit',
    'wd',
    'closedPl',
    'openPl',
    'totalPl',
    'trades',
  ]
  const lines = [headers.join(',')]
  for (const row of rows) {
    const pl = derivePl(row)
    lines.push(
      [
        row.clientId,
        row.clientName,
        row.clientLogin,
        row.affiliateId,
        row.country,
        row.deposit,
        row.wd,
        row.closedPl,
        row.openPl,
        pl,
        row.trades,
      ]
        .map(escapeCell)
        .join(',')
    )
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeBrand = brand.replace(/\s+/g, '_')
  a.href = url
  a.download = `client_list_${listKey}_${safeBrand}_last${days}d.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ClientTable({ rows, listDef }) {
  const { key, metricKey, color } = listDef
  if (!rows || rows.length === 0) {
    return <p style={{ color: '#6b7280', fontSize: 13 }}>Nessun cliente in questa lista.</p>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            {[
              '#',
              'Client ID',
              'Nome',
              'Login',
              'Affiliato',
              'Paese',
              'Deposit ($)',
              'WD ($)',
              'Closed P&L ($)',
              'Open P&L ($)',
              'Tot P&L ($)',
              'Trades',
            ].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  color: '#9ca3af',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pl = derivePl(row)
            const plColor = pl > 0 ? '#4ade80' : pl < 0 ? '#fb7185' : '#9ca3af'
            return (
              <tr key={`${row.clientId}-${i}`} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: '5px 8px', color: '#6b7280' }}>{i + 1}</td>
                <td style={{ padding: '5px 8px', color: '#e5e7eb', fontFamily: 'monospace' }}>
                  {row.clientId || '—'}
                </td>
                <td style={{ padding: '5px 8px', color: '#f9fafb', fontWeight: 500 }}>
                  {row.clientName || '—'}
                </td>
                <td style={{ padding: '5px 8px', color: '#d1d5db' }}>{row.clientLogin || '—'}</td>
                <td style={{ padding: '5px 8px', color: '#d1d5db' }}>{row.affiliateId || '—'}</td>
                <td style={{ padding: '5px 8px', color: '#d1d5db' }}>{row.country || '—'}</td>
                <td style={{ padding: '5px 8px', color: '#38bdf8', textAlign: 'right' }}>
                  {fmtMoney(row.deposit)}
                </td>
                <td style={{ padding: '5px 8px', color: '#fb7185', textAlign: 'right' }}>
                  {fmtMoney(row.wd)}
                </td>
                <td style={{ padding: '5px 8px', color: plColor, textAlign: 'right' }}>
                  {fmtPl(row.closedPl)}
                </td>
                <td style={{ padding: '5px 8px', color: plColor, textAlign: 'right' }}>
                  {fmtPl(row.openPl)}
                </td>
                <td
                  style={{
                    padding: '5px 8px',
                    color: plColor,
                    textAlign: 'right',
                    fontWeight: 600,
                  }}
                >
                  {fmtPl(pl)}
                </td>
                <td style={{ padding: '5px 8px', color: '#d1d5db', textAlign: 'right' }}>
                  {fmtCount(row.trades)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function CreolabsClientListsPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeBrand, setActiveBrand] = useState('BW')
  const [activeList, setActiveList] = useState('deposited')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback((d, bust = false) => {
    setLoading(true)
    setError(null)
    const url = `/api/qlik/creolabs/client-lists?days=${d}${bust ? '&bust=1' : ''}`
    fetch(url, { cache: 'no-store' })
      .then((r) => r.json())
      .then((body) => {
        if (!body.ok) throw new Error(body.error || 'API error')
        setData(body.data)
      })
      .catch((e) => setError(e.message || 'Errore nel caricamento'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData(days)
  }, [days, fetchData])

  const activeListDef = LISTS.find((l) => l.key === activeList) || LISTS[0]

  const rawRows = useMemo(() => {
    if (!data?.brands) return []
    return data.brands[activeBrand]?.[activeList] || []
  }, [data, activeBrand, activeList])

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rawRows
    return rawRows.filter((r) => {
      return (
        String(r.clientId || '')
          .toLowerCase()
          .includes(q) ||
        String(r.clientName || '')
          .toLowerCase()
          .includes(q) ||
        String(r.clientLogin || '')
          .toLowerCase()
          .includes(q) ||
        String(r.affiliateId || '')
          .toLowerCase()
          .includes(q) ||
        String(r.country || '')
          .toLowerCase()
          .includes(q)
      )
    })
  }, [rawRows, searchQuery])

  const countsByBrandList = useMemo(() => {
    if (!data?.brands) return {}
    const out = {}
    for (const b of BRANDS) {
      out[b] = {}
      for (const l of LISTS) {
        out[b][l.key] = (data.brands[b]?.[l.key] || []).length
      }
    }
    return out
  }, [data])

  return (
    <div
      style={{ padding: '24px 28px', color: '#f9fafb', minHeight: '100vh', background: '#0f172a' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f9fafb' }}>
            Client Lists — Ultimi{' '}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{
                background: '#1e293b',
                color: '#f9fafb',
                border: '1px solid #374151',
                borderRadius: 6,
                padding: '2px 6px',
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {DAYS_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} giorni
                </option>
              ))}
            </select>
          </h1>
          {data && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>
              Periodi inclusi:{' '}
              <span style={{ color: '#94a3b8' }}>
                {data.fromPeriod} → {data.toPeriod}
              </span>
              {' · '}cutoff: <span style={{ color: '#94a3b8' }}>{data.cutoffDate}</span>
              {' · '}fonte:{' '}
              <span style={{ color: data.cached ? '#4ade80' : '#facc15' }}>
                {data.cached ? 'cache' : 'live Qlik'}
              </span>
              {data.periods?.length > 0 && (
                <>
                  {' · '}mesi: <span style={{ color: '#94a3b8' }}>{data.periods.join(', ')}</span>
                </>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => fetchData(days, true)}
          disabled={loading}
          style={{
            background: '#1e293b',
            border: '1px solid #374151',
            color: '#94a3b8',
            borderRadius: 6,
            padding: '6px 14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 13,
          }}
        >
          {loading ? '⏳ Caricamento…' : '↻ Aggiorna (bust cache)'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: '#450a0a',
            border: '1px solid #991b1b',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            color: '#fca5a5',
          }}
        >
          ⚠ {error}
        </div>
      )}

      {loading && !data && <FullPageLoader />}

      {data && (
        <>
          {/* Brand tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {BRANDS.map((b) => (
              <button
                key={b}
                onClick={() => setActiveBrand(b)}
                style={{
                  background: activeBrand === b ? '#3b82f6' : '#1e293b',
                  color: activeBrand === b ? '#fff' : '#94a3b8',
                  border: '1px solid ' + (activeBrand === b ? '#3b82f6' : '#374151'),
                  borderRadius: 8,
                  padding: '6px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {b}
              </button>
            ))}
          </div>

          {/* List tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {LISTS.map((l) => {
              const count = countsByBrandList[activeBrand]?.[l.key] ?? 0
              return (
                <button
                  key={l.key}
                  onClick={() => {
                    setActiveList(l.key)
                    setSearchQuery('')
                  }}
                  style={{
                    background: activeList === l.key ? '#1e293b' : 'transparent',
                    color: activeList === l.key ? l.color : '#6b7280',
                    border: '1px solid ' + (activeList === l.key ? l.color : '#374151'),
                    borderRadius: 8,
                    padding: '5px 14px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {l.label}
                  <span
                    style={{
                      marginLeft: 6,
                      background: activeList === l.key ? l.color : '#374151',
                      color: activeList === l.key ? '#0f172a' : '#9ca3af',
                      borderRadius: 99,
                      padding: '1px 7px',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search + CSV export */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 16,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="Cerca per nome, ID, login, affiliato, paese…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: 220,
                background: '#1e293b',
                border: '1px solid #374151',
                color: '#f9fafb',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <span style={{ color: '#6b7280', fontSize: 13 }}>
              {filteredRows.length}{' '}
              {filteredRows.length !== rawRows.length ? `/ ${rawRows.length}` : ''} clienti
            </span>
            <button
              onClick={() => downloadCsv(filteredRows, activeList, activeBrand, days)}
              style={{
                background: '#166534',
                border: '1px solid #15803d',
                color: '#86efac',
                borderRadius: 6,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ↓ Export CSV
            </button>
          </div>

          {/* Table */}
          <div
            style={{
              background: '#111827',
              borderRadius: 10,
              border: '1px solid #1f2937',
              padding: '12px 0',
            }}
          >
            <div
              style={{
                padding: '0 12px 10px',
                borderBottom: '1px solid #1f2937',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: activeListDef.color,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#f9fafb' }}>
                {activeBrand} — {activeListDef.label}
              </span>
            </div>
            <div style={{ padding: '0 12px' }}>
              <ClientTable rows={filteredRows} listDef={activeListDef} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
