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
const EXPORT_ALL_MODES = [
  { key: 'unique', label: 'Utenti unici' },
  { key: 'raw', label: 'Righe complete' },
]

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

function getPrimaryMetric(listKey, row) {
  if (listKey === 'deposited') return Number(row?.deposit) || 0
  if (listKey === 'withdrawn') return Number(row?.wd) || 0
  if (listKey === 'inProfit') return derivePl(row)
  return 0
}

function escapeCell(v) {
  const s = String(v == null ? '' : v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(rows, listKey, days) {
  const headers = [
    'brand',
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
        row.brand,
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
  a.href = url
  a.download = `client_list_${listKey}_all_brands_last${days}d.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildAllUsersRows(data) {
  if (!data?.brands) return []

  const byUser = new Map()

  for (const brand of BRANDS) {
    for (const list of LISTS) {
      const listRows = data.brands[brand]?.[list.key] || []
      for (const row of listRows) {
        const id = String(row?.clientId || '').trim()
        const login = String(row?.clientLogin || '').trim()
        const key = `${brand}::${id || login}`
        if (!id && !login) continue

        if (!byUser.has(key)) {
          byUser.set(key, {
            brand,
            clientId: row.clientId,
            clientName: row.clientName,
            clientLogin: row.clientLogin,
            affiliateId: row.affiliateId,
            country: row.country,
            deposit: Number(row.deposit) || 0,
            wd: Number(row.wd) || 0,
            closedPl: Number(row.closedPl) || 0,
            openPl: Number(row.openPl) || 0,
            trades: Number(row.trades) || 0,
            lists: new Set([list.key]),
          })
          continue
        }

        const current = byUser.get(key)
        current.deposit = Number(current.deposit || 0) + (Number(row.deposit) || 0)
        current.wd = Number(current.wd || 0) + (Number(row.wd) || 0)
        current.closedPl = Number(current.closedPl || 0) + (Number(row.closedPl) || 0)
        current.openPl = Number(current.openPl || 0) + (Number(row.openPl) || 0)
        current.trades = Number(current.trades || 0) + (Number(row.trades) || 0)
        current.lists.add(list.key)
      }
    }
  }

  const rows = Array.from(byUser.values()).map((r) => ({
    ...r,
    lists: Array.from(r.lists).sort().join('|'),
  }))

  rows.sort((a, b) => derivePl(b) - derivePl(a))
  return rows
}

function buildAllRawRows(data) {
  if (!data?.brands) return []

  const rows = []
  for (const brand of BRANDS) {
    for (const list of LISTS) {
      const listRows = data.brands[brand]?.[list.key] || []
      for (const row of listRows) {
        rows.push({
          ...row,
          brand,
          list: list.key,
        })
      }
    }
  }

  rows.sort((a, b) => derivePl(b) - derivePl(a))
  return rows
}

function downloadCsvAllUsers(rows, days) {
  const headers = [
    'brand',
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
    'lists',
  ]
  const lines = [headers.join(',')]
  for (const row of rows) {
    const pl = derivePl(row)
    lines.push(
      [
        row.brand,
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
        row.lists,
      ]
        .map(escapeCell)
        .join(',')
    )
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `client_list_all_users_all_brands_last${days}d.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadCsvAllRows(rows, days) {
  const headers = [
    'brand',
    'list',
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
        row.brand,
        row.list,
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
  a.href = url
  a.download = `client_list_all_rows_all_brands_last${days}d.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ClientTable({ rows, listDef }) {
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
              'Brand',
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
                <td style={{ padding: '5px 8px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                  {row.brand || '—'}
                </td>
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
  const [activeList, setActiveList] = useState('deposited')
  const [searchQuery, setSearchQuery] = useState('')
  const [exportAllMode, setExportAllMode] = useState('unique')

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
    const merged = []
    for (const brand of BRANDS) {
      const rows = data.brands[brand]?.[activeList] || []
      for (const row of rows) {
        merged.push({ ...row, brand })
      }
    }
    merged.sort((a, b) => getPrimaryMetric(activeList, b) - getPrimaryMetric(activeList, a))
    return merged
  }, [data, activeList])

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
    for (const l of LISTS) {
      let total = 0
      for (const b of BRANDS) {
        total += (data.brands[b]?.[l.key] || []).length
      }
      out[l.key] = total
    }
    return out
  }, [data])

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.clients += 1
        acc.deposit += Number(row?.deposit) || 0
        acc.wd += Number(row?.wd) || 0
        acc.pl += derivePl(row)
        acc.trades += Number(row?.trades) || 0
        return acc
      },
      { clients: 0, deposit: 0, wd: 0, pl: 0, trades: 0 }
    )
  }, [filteredRows])

  const allUsersRows = useMemo(() => buildAllUsersRows(data), [data])
  const allRawRows = useMemo(() => buildAllRawRows(data), [data])

  const scrollToTop = () => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    if (typeof window === 'undefined') return
    const h = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    )
    window.scrollTo({ top: h, behavior: 'smooth' })
  }

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
              Brand inclusi: <span style={{ color: '#94a3b8' }}>BW + BW Global</span>
              {' · '}
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
          {/* List tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {LISTS.map((l) => {
              const count = countsByBrandList[l.key] ?? 0
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

          {/* Cumulative cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ color: '#64748b', fontSize: 12 }}>Clienti</div>
              <div style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>
                {fmtCount(totals.clients)}
              </div>
            </div>
            <div
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ color: '#64748b', fontSize: 12 }}>Deposit Totale</div>
              <div style={{ color: '#38bdf8', fontSize: 22, fontWeight: 700 }}>
                {fmtMoney(totals.deposit)}
              </div>
            </div>
            <div
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ color: '#64748b', fontSize: 12 }}>Withdrawal Totale</div>
              <div style={{ color: '#fb7185', fontSize: 22, fontWeight: 700 }}>
                {fmtMoney(totals.wd)}
              </div>
            </div>
            <div
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ color: '#64748b', fontSize: 12 }}>P&L Totale</div>
              <div
                style={{
                  color: totals.pl >= 0 ? '#4ade80' : '#fb7185',
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {fmtPl(totals.pl)}
              </div>
            </div>
            <div
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ color: '#64748b', fontSize: 12 }}>Trades Totali</div>
              <div style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700 }}>
                {fmtCount(totals.trades)}
              </div>
            </div>
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
              placeholder="Cerca account (login), nome, client ID, affiliato, paese..."
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
              onClick={scrollToBottom}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ↓ Vai in fondo
            </button>
            <button
              onClick={scrollToTop}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#cbd5e1',
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ↑ Torna su
            </button>
            <button
              onClick={() => downloadCsv(filteredRows, activeList, days)}
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
            <select
              value={exportAllMode}
              onChange={(e) => setExportAllMode(e.target.value)}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#cbd5e1',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {EXPORT_ALL_MODES.map((mode) => (
                <option key={mode.key} value={mode.key}>
                  {mode.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (exportAllMode === 'raw') {
                  downloadCsvAllRows(allRawRows, days)
                  return
                }
                downloadCsvAllUsers(allUsersRows, days)
              }}
              style={{
                background: '#1d4ed8',
                border: '1px solid #2563eb',
                color: '#bfdbfe',
                borderRadius: 6,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ↓ Export CSV {exportAllMode === 'raw' ? 'Righe complete' : 'Tutti gli utenti'}
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
                BW + BW Global — {activeListDef.label}
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
