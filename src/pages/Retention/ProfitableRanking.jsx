import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import KpiCard from '../../components/common/KpiCard'
import { getPublicShareOrigin } from '../../utils/publicShareOrigin'
import { readXlsxToRows } from '../../utils/retentionRanking'
import { buildTradersRankingRewardsDataset } from '../../utils/tradersRankingRewards'
import { buildRankingsV1 } from '../../utils/profitableRankingV1'

const numberFmt0 = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const numberFmt2 = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const eurFmt0 = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const eurFmt2 = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percentFmt2 = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function fmtMoney0(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '—'
  return eurFmt0.format(n)
}

function fmtMoney2(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '—'
  return eurFmt2.format(n)
}

function fmtNum2(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return numberFmt2.format(n)
}

function fmtPct2(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return percentFmt2.format(n)
}

function fmtInt(v) {
  const n = Math.floor(Number(v || 0))
  if (!Number.isFinite(n)) return '—'
  return numberFmt0.format(n)
}

function medal(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function fmtDateYmd(v) {
  const d = v instanceof Date ? v : v ? new Date(v) : null
  if (!d || !Number.isFinite(d.getTime())) return '—'
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  const dd = d.getUTCDate()
  return `${y}-${pad2(m)}-${pad2(dd)}`
}

function downloadBlob(blob, fileName) {
  if (typeof window === 'undefined') return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function toCsv(rows) {
  const safeRows = Array.isArray(rows) ? rows : []
  if (!safeRows.length) return ''

  const headers = Object.keys(safeRows[0] || {})
  const escape = (v) => {
    const s = v == null ? '' : String(v)
    if (/[\r\n",]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const lines = []
  lines.push(headers.map(escape).join(','))
  for (const r of safeRows) {
    lines.push(headers.map((h) => escape(r?.[h])).join(','))
  }
  return lines.join('\n')
}

function buildLeaderboardExportRows({ tabKey, rows }) {
  const safeRows = Array.isArray(rows) ? rows : []

  return safeRows.map((r, idx) => {
    const common = {
      Rank: idx + 1,
      'Client Name': r?.clientName || '',
      Country: r?.country || '',
    }

    if (tabKey === 'most_active') {
      return {
        ...common,
        'Total Trades': Number(r?.totalTrades || 0),
        'Trades Per Month': Number(r?.tradesPerMonth || 0),
        'Last Trade Date': fmtDateYmd(r?.lastTradeDate),
        'Net Deposit': Number(r?.netDeposit || 0),
      }
    }

    if (tabKey === 'top_performing') {
      return {
        ...common,
        'Closed PL': Number(r?.closedPL || 0),
        ROI: Number(r?.roi || 0),
        'Total Trades': Number(r?.totalTrades || 0),
        Equity: Number(r?.equity || 0),
      }
    }

    if (tabKey === 'most_consistent') {
      return {
        ...common,
        'Trades Per Month': Number(r?.tradesPerMonth || 0),
        'Redeposit Ratio': Number(r?.redepositRatio || 0),
        'Last Trade Date': fmtDateYmd(r?.lastTradeDate),
        'Consistency Score': Number(r?.consistencyScore || 0),
      }
    }

    if (tabKey === 'rising') {
      return {
        ...common,
        'Last Trade Date': fmtDateYmd(r?.lastTradeDate),
        'Trades Per Month': Number(r?.tradesPerMonth || 0),
        'Momentum Score': Number(r?.momentumScore || 0),
        Equity: Number(r?.equity || 0),
      }
    }

    // best_reward
    return {
      ...common,
      'Reward Score': Number(r?.rewardScore || 0),
      'Total Trades': Number(r?.totalTrades || 0),
      'Net Deposit': Number(r?.netDeposit || 0),
      'Closed PL': Number(r?.closedPL || 0),
      Equity: Number(r?.equity || 0),
      'Last Trade Date': fmtDateYmd(r?.lastTradeDate),
    }
  })
}

function exportLeaderboardCsv({ tabKey, rows }) {
  const stamp = new Date()
  const ymd = `${stamp.getUTCFullYear()}-${pad2(stamp.getUTCMonth() + 1)}-${pad2(stamp.getUTCDate())}`
  const base = `profitable-ranking_${String(tabKey || 'leaderboard')}_${ymd}`

  const exportRows = buildLeaderboardExportRows({ tabKey, rows })
  const csv = toCsv(exportRows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  return { blob, fileName: `${base}.csv` }
}

function exportLeaderboardExcel({ tabKey, tabLabel, rows }) {
  const stamp = new Date()
  const ymd = `${stamp.getUTCFullYear()}-${pad2(stamp.getUTCMonth() + 1)}-${pad2(stamp.getUTCDate())}`
  const base = `profitable-ranking_${String(tabKey || 'leaderboard')}_${ymd}`

  const exportRows = buildLeaderboardExportRows({ tabKey, rows })
  const ws = XLSX.utils.json_to_sheet(exportRows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    wb,
    ws,
    String(tabLabel || 'Leaderboard').slice(0, 31) || 'Leaderboard'
  )
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  return { blob, fileName: `${base}.xlsx` }
}

function sortByKey(list, { key, dir }) {
  const sign = dir === 'asc' ? 1 : -1
  const k = String(key || '')
  const copy = [...list]

  copy.sort((a, b) => {
    const av = a?.[k]
    const bv = b?.[k]

    // Numeric first if possible
    const an = Number(av)
    const bn = Number(bv)
    const bothNumeric = Number.isFinite(an) && Number.isFinite(bn)
    if (bothNumeric) return (an - bn) * sign

    const as = String(av ?? '').toLowerCase()
    const bs = String(bv ?? '').toLowerCase()
    if (as < bs) return -1 * sign
    if (as > bs) return 1 * sign
    return 0
  })

  return copy
}

function clampInt(n, min, max) {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v)) return min
  return Math.max(min, Math.min(max, v))
}

function Table({ rows, columns, sortState, onSort, pageSize, onPageSize, page, onPage }) {
  const safeColumns = Array.isArray(columns) ? columns : []
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.max(1, Math.min(page, totalPages))
  const start = (safePage - 1) * pageSize
  const end = Math.min(total, start + pageSize)
  const pageRows = rows.slice(start, end)

  useEffect(() => {
    if (page !== safePage) onPage(safePage)
  }, [onPage, page, safePage])

  const SortTh = ({ label, colKey, align = 'right', width }) => {
    const isActive = sortState.key === colKey
    const arrow = isActive ? (sortState.dir === 'asc' ? '▲' : '▼') : ''
    return (
      <th
        onClick={() => onSort(colKey)}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          textAlign: align,
          width,
        }}
        title="Click to sort"
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>{label}</span>
          <span style={{ opacity: isActive ? 1 : 0.35 }}>{arrow || '↕'}</span>
        </span>
      </th>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          margin: '10px 0 8px',
        }}
      >
        <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
          Showing {start + 1}-{end} of {total}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>Rows</span>
            <select
              className="search-hero-input"
              value={pageSize}
              onChange={(e) => onPageSize(clampInt(e.target.value, 1, 1000))}
              style={{ width: 96, fontSize: 13, padding: '7px 10px', borderRadius: 10 }}
            >
              {[25, 50, 100].map((n) => (
                <option key={String(n)} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              className="pill-tab"
              onClick={() => onPage(1)}
              disabled={safePage <= 1}
              title="First page"
            >
              «
            </button>
            <button
              type="button"
              className="pill-tab"
              onClick={() => onPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              title="Previous page"
            >
              ‹
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 800 }}>
              {safePage}/{totalPages}
            </span>
            <button
              type="button"
              className="pill-tab"
              onClick={() => onPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              title="Next page"
            >
              ›
            </button>
            <button
              type="button"
              className="pill-tab"
              onClick={() => onPage(totalPages)}
              disabled={safePage >= totalPages}
              title="Last page"
            >
              »
            </button>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table payout-unified-table ranking-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Rank</th>
              <th style={{ textAlign: 'left', width: 240 }}>Trader</th>
              <SortTh label="Country" colKey="country" align="left" width={150} />
              {safeColumns.map((c) => (
                <SortTh
                  key={String(c.key)}
                  label={c.label}
                  colKey={c.key}
                  align={c.align || 'right'}
                  width={c.width}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              const rank = start + i + 1
              const m = medal(rank)
              return (
                <tr key={String(r.clientId || rank)}>
                  <td style={{ textAlign: 'left', fontWeight: 800 }}>
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 18, display: 'inline-block' }}>{m}</span>
                      <span>{rank}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 850, color: 'var(--text-primary)' }}>
                      {r.clientName || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                      {r.clientId || ''}
                    </div>
                  </td>
                  <td style={{ textAlign: 'left' }}>{r.country || '—'}</td>
                  {safeColumns.map((c) => (
                    <td key={String(c.key)} style={{ textAlign: c.align || 'right' }}>
                      {typeof c.render === 'function' ? c.render(r) : String(r?.[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              )
            })}

            {!pageRows.length ? (
              <tr>
                <td
                  colSpan={3 + safeColumns.length}
                  style={{ padding: 14, color: 'var(--text-muted)' }}
                >
                  No rows match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TAB_CONFIGS = [
  {
    key: 'most_active',
    label: 'Most Active Traders',
    defaultSort: { key: 'totalTrades', dir: 'desc' },
    columns: [
      {
        key: 'totalTrades',
        label: 'Total Trades',
        align: 'right',
        width: 120,
        render: (r) => fmtInt(r.totalTrades),
      },
      {
        key: 'tradesPerMonth',
        label: 'Trades Per Month',
        align: 'right',
        width: 150,
        render: (r) => fmtNum2(r.tradesPerMonth),
      },
      {
        key: 'lastTradeDateMs',
        label: 'Last Trade Date',
        align: 'right',
        width: 150,
        render: (r) => fmtDateYmd(r.lastTradeDate),
      },
      {
        key: 'netDeposit',
        label: 'Net Deposit',
        align: 'right',
        width: 140,
        render: (r) => fmtMoney0(r.netDeposit),
      },
    ],
  },
  {
    key: 'top_performing',
    label: 'Top Performing Traders',
    defaultSort: { key: 'closedPL', dir: 'desc' },
    columns: [
      {
        key: 'closedPL',
        label: 'Closed PL',
        align: 'right',
        width: 140,
        render: (r) => fmtMoney0(r.closedPL),
      },
      {
        key: 'roi',
        label: 'ROI',
        align: 'right',
        width: 90,
        render: (r) => fmtPct2(r.roi),
      },
      {
        key: 'totalTrades',
        label: 'Total Trades',
        align: 'right',
        width: 120,
        render: (r) => fmtInt(r.totalTrades),
      },
      {
        key: 'equity',
        label: 'Equity',
        align: 'right',
        width: 140,
        render: (r) => fmtMoney0(r.equity),
      },
    ],
  },
  {
    key: 'most_consistent',
    label: 'Most Consistent Traders',
    defaultSort: { key: 'consistencyScore', dir: 'desc' },
    columns: [
      {
        key: 'tradesPerMonth',
        label: 'Trades Per Month',
        align: 'right',
        width: 150,
        render: (r) => fmtNum2(r.tradesPerMonth),
      },
      {
        key: 'redepositRatio',
        label: 'Redeposit Ratio',
        align: 'right',
        width: 150,
        render: (r) => fmtNum2(r.redepositRatio),
      },
      {
        key: 'lastTradeDateMs',
        label: 'Last Trade Date',
        align: 'right',
        width: 150,
        render: (r) => fmtDateYmd(r.lastTradeDate),
      },
      {
        key: 'consistencyScore',
        label: 'Consistency Score',
        align: 'right',
        width: 160,
        render: (r) => fmtNum2(r.consistencyScore),
      },
    ],
  },
  {
    key: 'rising',
    label: 'Rising Traders',
    defaultSort: { key: 'momentumScore', dir: 'desc' },
    columns: [
      {
        key: 'lastTradeDateMs',
        label: 'Last Trade Date',
        align: 'right',
        width: 150,
        render: (r) => fmtDateYmd(r.lastTradeDate),
      },
      {
        key: 'tradesPerMonth',
        label: 'Trades Per Month',
        align: 'right',
        width: 150,
        render: (r) => fmtNum2(r.tradesPerMonth),
      },
      {
        key: 'momentumScore',
        label: 'Momentum Score',
        align: 'right',
        width: 160,
        render: (r) => fmtNum2(r.momentumScore),
      },
      {
        key: 'equity',
        label: 'Equity',
        align: 'right',
        width: 140,
        render: (r) => fmtMoney0(r.equity),
      },
    ],
  },
  {
    key: 'best_reward',
    label: 'Best Reward Candidates',
    defaultSort: { key: 'rewardScore', dir: 'desc' },
    columns: [
      {
        key: 'rewardScore',
        label: 'Reward Score',
        align: 'right',
        width: 120,
        render: (r) => fmtNum2(r.rewardScore),
      },
      {
        key: 'totalTrades',
        label: 'Total Trades',
        align: 'right',
        width: 120,
        render: (r) => fmtInt(r.totalTrades),
      },
      {
        key: 'netDeposit',
        label: 'Net Deposit',
        align: 'right',
        width: 140,
        render: (r) => fmtMoney0(r.netDeposit),
      },
      {
        key: 'closedPL',
        label: 'Closed PL',
        align: 'right',
        width: 140,
        render: (r) => fmtMoney0(r.closedPL),
      },
      {
        key: 'equity',
        label: 'Equity',
        align: 'right',
        width: 140,
        render: (r) => fmtMoney0(r.equity),
      },
      {
        key: 'lastTradeDateMs',
        label: 'Last Trade Date',
        align: 'right',
        width: 150,
        render: (r) => fmtDateYmd(r.lastTradeDate),
      },
    ],
  },
]

export default function ProfitableRanking({ publicMode = false, initialState = null } = {}) {
  const fileRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

  const [dataset, setDataset] = useState(null)

  // Auto-load from console artifacts (generated from Creolabs XLSX) when available.
  // Browser apps cannot read arbitrary local project folders; fetching from `public/` is the safe way.
  useEffect(() => {
    let cancelled = false

    const tryAutoLoad = async () => {
      setError('')
      setLoading(true)
      try {
        const ts = Date.now()
        const baseUrl = (import.meta?.env?.BASE_URL || '/').replace(/\/+$/, '/')
        const res = await fetch(`${baseUrl}traders_ranking_rewards_table.json?ts=${ts}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('Traders Ranking Rewards report not found in console assets')
        const json = await res.json()
        const rows = Array.isArray(json?.rows) ? json.rows : []
        const headers = Array.isArray(json?.headers) ? json.headers : Object.keys(rows[0] || {})
        if (cancelled) return

        setFileName('Traders Ranking Rewards.xlsx (auto)')
        const built = buildTradersRankingRewardsDataset({ rows, headers })
        setDataset(built)
      } catch {
        // Silent fallback: user can still upload an XLSX.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Only auto-load if nothing is loaded yet.
    if (!dataset) tryAutoLoad()

    return () => {
      cancelled = true
    }
  }, [dataset])

  const todayRef = useRef(null)
  if (!todayRef.current) todayRef.current = new Date()

  // Global filters
  const [minDeposit, setMinDeposit] = useState(
    Number.isFinite(Number(initialState?.minDeposit)) ? Number(initialState?.minDeposit) : 0
  )
  const [minTrades, setMinTrades] = useState(
    Number.isFinite(Number(initialState?.minTrades)) ? Number(initialState?.minTrades) : 0
  )
  const [activityRecencyDays, setActivityRecencyDays] = useState(
    Number.isFinite(Number(initialState?.activityRecencyDays))
      ? Number(initialState?.activityRecencyDays)
      : 0
  )
  const [selectedCountries, setSelectedCountries] = useState(
    Array.isArray(initialState?.selectedCountries) ? initialState.selectedCountries : []
  )

  const validTabKeys = useMemo(() => new Set(TAB_CONFIGS.map((t) => t.key)), [])
  const [activeTab, setActiveTab] = useState(
    validTabKeys.has(String(initialState?.activeTab || ''))
      ? String(initialState.activeTab)
      : 'most_active'
  )

  const [sortByTab, setSortByTab] = useState(() => {
    const out = {}
    for (const t of TAB_CONFIGS) out[t.key] = t.defaultSort
    return out
  })

  const [pageByTab, setPageByTab] = useState(() => {
    const out = {}
    for (const t of TAB_CONFIGS) out[t.key] = 1
    return out
  })
  const [pageSize, setPageSize] = useState(50)

  const onShare = async () => {
    if (typeof window === 'undefined') return

    const payload = {
      v: 1,
      k: 'profitable-ranking',
      generatedAt: new Date().toISOString(),
      s: {
        md: Number(minDeposit) || 0,
        mt: Number(minTrades) || 0,
        r: Number(activityRecencyDays) || 0,
        c: Array.isArray(selectedCountries) ? selectedCountries : [],
        tab: String(activeTab || ''),
      },
    }

    const shareOrigin = getPublicShareOrigin()
    const runtimeOrigin = window.location?.origin || ''
    const isLocalhost = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(runtimeOrigin)

    let token = ''
    try {
      const resp = await fetch('/api/share/create-profitable-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })
      const data = await resp.json().catch(() => null)
      if (resp.ok && data?.ok && data?.token) token = String(data.token)
      else throw new Error(data?.error || data?.message || 'share-not-available')
    } catch {
      if (!isLocalhost) {
        window.alert('Share link non disponibile (storage share non configurato).')
        return
      }

      // Local fallback (dev only): store snapshot in localStorage (same browser/device only)
      try {
        const bytes = new Uint8Array(12)
        if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes)
        token = `share_local_${Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}`
      } catch {
        token = `share_local_${Math.random().toString(16).slice(2)}`
      }

      try {
        window.localStorage.setItem(
          `bw_share_profitable_ranking:${token}`,
          JSON.stringify({ payload })
        )
      } catch {
        // ignore
      }
    }

    const isKvToken = token.startsWith('share_') && !token.startsWith('share_local_')
    const href = isKvToken
      ? `${shareOrigin}/s/${encodeURIComponent(token)}`
      : `${shareOrigin}/share/profitable-ranking/${encodeURIComponent(token)}`

    // Open in a new tab only. Never navigate away from this page.
    let opened = false
    try {
      const w = window.open(href, '_blank', 'noopener,noreferrer')
      opened = Boolean(w)
    } catch {
      // ignore
    }

    // Some browsers block window.open but still allow a user-initiated anchor click.
    if (!opened) {
      try {
        const a = document.createElement('a')
        a.href = href
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        a.remove()
        opened = true
      } catch {
        // ignore
      }
    }

    // Best-effort: copy link so the user can paste it even if popups are blocked.
    let copied = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(href)
        copied = true
      }
    } catch {
      // ignore
    }

    if (!opened) {
      window.alert(
        copied
          ? `Popup bloccato dal browser. Link copiato negli appunti:\n\n${href}`
          : `Popup bloccato dal browser. Apri manualmente questo link:\n\n${href}`
      )
    }
  }

  useEffect(() => {
    // Reset paging when tab changes
    setPageByTab((p) => ({ ...p, [activeTab]: 1 }))
  }, [activeTab])

  const missingFields = dataset?.missingFields || []

  const v1 = useMemo(() => {
    if (!dataset?.clients) return null
    return buildRankingsV1({
      dataset,
      minTrades: Number(minTrades) || 0,
      minDeposit: Number(minDeposit) || 0,
      countries: Array.isArray(selectedCountries) ? selectedCountries : [],
      activityRecencyDays: Number(activityRecencyDays) || 0,
      today: todayRef.current,
    })
  }, [activityRecencyDays, dataset, minDeposit, minTrades, selectedCountries])

  const activeList = useMemo(() => {
    const r = v1?.rankings
    if (!r) return []
    if (activeTab === 'most_active') return r.mostActive || []
    if (activeTab === 'top_performing') return r.topPerforming || []
    if (activeTab === 'most_consistent') return r.mostConsistent || []
    if (activeTab === 'rising') return r.rising || []
    if (activeTab === 'best_reward') return r.bestRewardCandidates || []
    return []
  }, [activeTab, v1?.rankings])

  const activeListWithSortKeys = useMemo(() => {
    // Ensure date sort works consistently even if some rows miss dates.
    return activeList.map((r) => {
      const ms =
        r?.lastTradeDate instanceof Date
          ? r.lastTradeDate.getTime()
          : r?.lastTradeDate
            ? new Date(r.lastTradeDate).getTime()
            : 0
      return { ...r, lastTradeDateMs: Number.isFinite(ms) ? ms : 0 }
    })
  }, [activeList])

  const kpis = useMemo(() => {
    const s = v1?.summary
    return {
      count: Number(s?.totalTraders || 0),
      totalDeposits: Number(s?.totalDeposits || 0),
      totalTrades: Number(s?.totalTrades || 0),
      totalClosedPL: Number(s?.totalClosedPL || 0),
    }
  }, [v1?.summary])

  const activeTabConfig = useMemo(
    () => TAB_CONFIGS.find((t) => t.key === activeTab) || TAB_CONFIGS[0],
    [activeTab]
  )

  const sortedForDisplay = useMemo(() => {
    const fallback = activeTabConfig?.defaultSort || { key: 'rewardScore', dir: 'desc' }
    const s = sortByTab[activeTab] || fallback
    return sortByKey(activeListWithSortKeys, s)
  }, [activeListWithSortKeys, activeTab, activeTabConfig, sortByTab])

  const setSort = (tabKey, colKey) => {
    setSortByTab((prev) => {
      const cur = prev[tabKey] || { key: colKey, dir: 'desc' }
      if (cur.key === colKey) {
        return { ...prev, [tabKey]: { key: colKey, dir: cur.dir === 'asc' ? 'desc' : 'asc' } }
      }
      return { ...prev, [tabKey]: { key: colKey, dir: 'desc' } }
    })
  }

  const onFilePicked = async (file) => {
    setError('')
    setLoading(true)

    try {
      if (!file) throw new Error('No file selected')
      setFileName(file.name || '')

      const { rows, headers } = await readXlsxToRows(file, { sheetIndex: 0 })
      const built = buildTradersRankingRewardsDataset({ rows, headers })
      setDataset(built)

      // Reset filters when data changes
      setSelectedCountries([])
      setMinDeposit(0)
      setMinTrades(0)
      setActivityRecencyDays(0)
      setActiveTab('most_active')

      setSortByTab(() => {
        const out = {}
        for (const t of TAB_CONFIGS) out[t.key] = t.defaultSort
        return out
      })
      setPageByTab(() => {
        const out = {}
        for (const t of TAB_CONFIGS) out[t.key] = 1
        return out
      })
    } catch (e) {
      setDataset(null)
      setError(e?.message || 'Unable to read XLSX')
    } finally {
      setLoading(false)
    }
  }

  const countryOptions = dataset?.countries || []

  return (
    <div className="page-shell">
      <header
        className="page-header ranking-header ranking-sticky-header"
        style={{ alignItems: 'stretch' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <p className="page-label">Retention</p>
            <h1 className="page-title">Profitable Traders Ranking (Retention Rewards)</h1>
            <p className="page-subtitle">
              Rank traders by broker value and engagement for reward campaigns.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {!publicMode ? (
              <>
                <button
                  type="button"
                  className="pill-tab"
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                  title="Load the Excel file"
                >
                  {fileName ? 'Replace XLSX' : 'Load XLSX'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(e) => onFilePicked(e.target.files?.[0] || null)}
                />
              </>
            ) : null}

            {fileName ? (
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
                {fileName}
                {dataset
                  ? ` • ${fmtInt(dataset.rowCount)} rows • ${fmtInt(dataset.clientCount)} clients`
                  : ''}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
                Upload “Traders Ranking Rewards.xlsx” to start.
              </span>
            )}

            {loading ? (
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
                Reading…
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          {!publicMode ? (
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="pill-tab"
                onClick={() => {
                  const out = exportLeaderboardCsv({ tabKey: activeTab, rows: sortedForDisplay })
                  downloadBlob(out.blob, out.fileName)
                }}
                disabled={loading || !dataset}
                title="Export current leaderboard (CSV)"
              >
                Export CSV
              </button>
              <button
                type="button"
                className="pill-tab"
                onClick={() => {
                  const out = exportLeaderboardExcel({
                    tabKey: activeTab,
                    tabLabel: activeTabConfig?.label,
                    rows: sortedForDisplay,
                  })
                  downloadBlob(out.blob, out.fileName)
                }}
                disabled={loading || !dataset}
                title="Export current leaderboard (Excel)"
              >
                Export Excel
              </button>
              <button
                type="button"
                className="pill-tab"
                onClick={onShare}
                disabled={loading}
                title="Open public share view"
              >
                SHARE
              </button>
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 10,
              width: '100%',
            }}
          >
            <KpiCard label="Total Traders" value={fmtInt(kpis.count)} size="sm" />
            <KpiCard label="Total Deposits" value={fmtMoney0(kpis.totalDeposits)} size="sm" />
            <KpiCard label="Total Trades" value={fmtInt(kpis.totalTrades)} size="sm" />
            <KpiCard label="Total Closed PL" value={fmtMoney0(kpis.totalClosedPL)} size="sm" />
          </div>

          <div style={{ height: 1, width: '100%', background: 'rgba(255,255,255,0.06)' }} />

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 800 }}>
              Min Deposit
            </span>
            <input
              type="number"
              className="search-hero-input"
              value={minDeposit}
              onChange={(e) => setMinDeposit(Number(e.target.value || 0))}
              style={{ width: 110, fontSize: 13, padding: '7px 10px', borderRadius: 10 }}
            />

            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 800 }}>
              Min Trades
            </span>
            <input
              type="number"
              className="search-hero-input"
              value={minTrades}
              onChange={(e) => setMinTrades(Number(e.target.value || 0))}
              style={{ width: 110, fontSize: 13, padding: '7px 10px', borderRadius: 10 }}
            />

            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 800 }}>
              Activity Recency
            </span>
            <select
              className="search-hero-input"
              value={String(activityRecencyDays)}
              onChange={(e) => setActivityRecencyDays(Number(e.target.value || 0))}
              style={{ width: 160, fontSize: 13, padding: '7px 10px', borderRadius: 10 }}
              aria-label="Activity recency filter"
            >
              <option value="0">Any</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 800 }}>
              Countries (Ctrl/Cmd+Click)
            </span>
            <select
              multiple
              value={selectedCountries}
              onChange={(e) => {
                const next = []
                for (const opt of e.target.options) {
                  if (opt.selected) next.push(opt.value)
                }
                setSelectedCountries(next)
              }}
              className="search-hero-input"
              style={{
                width: 260,
                fontSize: 13,
                padding: '7px 10px',
                borderRadius: 10,
                height: 38,
              }}
              disabled={!countryOptions.length}
              aria-label="Country filter"
            >
              {countryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {error ? (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(248, 113, 113, 0.08)',
            border: '1px solid rgba(248, 113, 113, 0.18)',
            color: 'rgba(248, 113, 113, 0.95)',
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      ) : null}

      {dataset && missingFields.length ? (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.18)',
            color: 'rgba(251, 191, 36, 0.95)',
            fontWeight: 800,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div>Missing fields in XLSX: {missingFields.join(', ')}</div>
        </div>
      ) : null}

      <div style={{ marginTop: 14 }}>
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {TAB_CONFIGS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`pill-tab${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key)}
                disabled={!dataset}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}></div>
        </div>

        {dataset ? (
          <Table
            rows={sortedForDisplay}
            columns={activeTabConfig?.columns || []}
            sortState={
              sortByTab[activeTab] ||
              activeTabConfig?.defaultSort || { key: 'totalTrades', dir: 'desc' }
            }
            onSort={(colKey) => setSort(activeTab, colKey)}
            pageSize={pageSize}
            onPageSize={(n) => {
              setPageSize(n)
              setPageByTab((p) => ({ ...p, [activeTab]: 1 }))
            }}
            page={pageByTab[activeTab] || 1}
            onPage={(n) => setPageByTab((p) => ({ ...p, [activeTab]: n }))}
          />
        ) : (
          <div
            style={{
              marginTop: 14,
              padding: '14px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              color: 'var(--text-muted)',
              fontWeight: 800,
            }}
          >
            Load an XLSX file with the required columns to see leaderboards.
          </div>
        )}

        {dataset && sortedForDisplay.length === 0 ? (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)',
              fontWeight: 800,
            }}
          >
            0 results with current filters. Try lowering Min Deposit / Min Trades.
          </div>
        ) : null}
      </div>
    </div>
  )
}
