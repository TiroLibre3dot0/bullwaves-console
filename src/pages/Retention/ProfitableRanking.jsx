import { useEffect, useMemo, useRef, useState } from 'react'
import KpiCard from '../../components/common/KpiCard'
import { getPublicShareOrigin } from '../../utils/publicShareOrigin'
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

function fmtMoney0(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '—'
  return eurFmt0.format(n)
}

function fmtNum2(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return numberFmt2.format(n)
}

function fmtInt(v) {
  const n = Math.floor(Number(v || 0))
  if (!Number.isFinite(n)) return '—'
  return numberFmt0.format(n)
}

function fmtDaysSuffix(v) {
  const n = Math.floor(Number(v))
  if (!Number.isFinite(n)) return '—'
  return `${Math.max(0, n)}d`
}

function statusHelpText() {
  return 'Activity classification based on trading frequency and recency.'
}

function statusBadgeClass(statusKey) {
  if (statusKey === 'very_active') return 'status-success'
  if (statusKey === 'active') return 'status-info'
  if (statusKey === 'dormant') return 'status-warning'
  return 'status-muted'
}

function StatusBadge({ statusKey, statusLabel }) {
  const label = String(statusLabel || 'Inactive')
  const cls = statusBadgeClass(String(statusKey || 'inactive'))
  return (
    <span className={`status-badge ${cls}`} title={statusHelpText()}>
      {label}
    </span>
  )
}

function rewardLabelHelpText() {
  return (
    'Deterministic action label. ' +
    'Very Active/Active: Send Reward if Net Deposit ≥ 1000 OR Total Deposit ≥ 1000, else Nurture. ' +
    'Dormant: Winback if Net Deposit ≥ 1000 OR Total Deposit ≥ 1000, else Ignore. ' +
    'Inactive: Winback if Net Deposit ≥ 3000, else Ignore.'
  )
}

function rewardChipClass(label) {
  const v = String(label || '').toLowerCase()
  if (v === 'send reward') return 'reward-success'
  if (v === 'nurture') return 'reward-info'
  if (v === 'winback') return 'reward-warning'
  return 'reward-muted'
}

function RewardChip({ label }) {
  const text = String(label || '').trim() || '—'
  const cls = rewardChipClass(text)
  return (
    <span className={`reward-chip ${cls}`} title={rewardLabelHelpText()}>
      {text}
    </span>
  )
}

function rewardLabelColumn() {
  return {
    key: 'rewardLabel',
    label: 'Reward Label',
    help: rewardLabelHelpText(),
    align: 'left',
    width: 130,
    render: (r) => <RewardChip label={r?.rewardLabel} />,
  }
}

function statusReasonColumn() {
  return {
    key: 'statusReasonShort',
    label: 'Status Reason',
    help: 'Short explanation of why the trader received this activity status.',
    align: 'left',
    width: 180,
    getTitle: (r) => String(r?.statusReasonFull || ''),
    render: (r) => (
      <div
        style={{
          maxWidth: 170,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {r?.statusReasonShort ? String(r.statusReasonShort) : '—'}
      </div>
    ),
  }
}

function tradesPerDayColumn() {
  return {
    key: 'tradesPerDay',
    label: 'Est. Trades/Day',
    help: 'Estimated trades/day derived from Total Trades and days since first/last activity (approximation).',
    align: 'right',
    width: 105,
    render: (r) => (Number.isFinite(Number(r?.tradesPerDay)) ? fmtNum2(r.tradesPerDay) : '—'),
  }
}

function daysSinceLastTradeColumn() {
  return {
    key: 'daysSinceLastTradeSort',
    label: 'Days Since Last Trade',
    help: 'Today − Last Trade Date. Helps identify traders who recently stopped trading.',
    align: 'right',
    width: 150,
    render: (r) => fmtDaysSuffix(r?.daysSinceLastTrade),
  }
}

function medal(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

function compareByKey(a, b, { key, dir } = {}) {
  const sign = dir === 'asc' ? 1 : -1
  const k = String(key || '')

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
}

function sortByKey(list, sortState, tieBreakers = []) {
  const copy = [...list]
  const ties = Array.isArray(tieBreakers) ? tieBreakers : []
  copy.sort((a, b) => {
    const primary = compareByKey(a, b, sortState)
    if (primary) return primary
    for (const t of ties) {
      const cmp = compareByKey(a, b, t)
      if (cmp) return cmp
    }
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

  const SortTh = ({ label, colKey, align = 'right', width, help }) => {
    const isActive = sortState.key === colKey
    const arrow = isActive ? (sortState.dir === 'asc' ? '▲' : '▼') : ''
    const title = help ? `${help} • Click to sort` : 'Click to sort'
    return (
      <th
        onClick={() => onSort(colKey)}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          textAlign: align,
          width,
        }}
        title={title}
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

      <div className="ranking-table-scroll hide-scrollbar">
        <table className="table payout-unified-table ranking-table sticky-metrics-table">
          <thead>
            <tr>
              <th className="ranking-sticky-col ranking-sticky-col-1" style={{ textAlign: 'left' }}>
                Rank
              </th>
              <th
                className="ranking-sticky-col ranking-sticky-col-2"
                style={{ textAlign: 'left', width: 210 }}
                title="Trader name (Client ID shown below)"
              >
                Trader
              </th>
              <SortTh
                label="Country"
                colKey="country"
                align="left"
                width={120}
                help="Trader country from the report"
              />
              {safeColumns.map((c) => (
                <SortTh
                  key={String(c.key)}
                  label={c.label}
                  colKey={c.key}
                  align={c.align || 'right'}
                  width={c.width}
                  help={c.help}
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
                  <td
                    className="ranking-sticky-col ranking-sticky-col-1"
                    style={{ textAlign: 'left', fontWeight: 800 }}
                  >
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 18, display: 'inline-block' }}>{m}</span>
                      <span>{rank}</span>
                    </span>
                  </td>
                  <td
                    className="ranking-sticky-col ranking-sticky-col-2"
                    style={{ textAlign: 'left' }}
                    title={
                      r.clientName || r.clientId
                        ? `${String(r.clientName || '—')}\n${String(r.clientId || '')}`.trim()
                        : undefined
                    }
                  >
                    <div style={{ fontWeight: 850, color: 'var(--text-primary)' }}>
                      {r.clientName || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
                      {r.clientId || ''}
                    </div>
                  </td>
                  <td style={{ textAlign: 'left' }}>{r.country || '—'}</td>
                  {safeColumns.map((c) =>
                    (() => {
                      const cellTitle =
                        typeof c.getTitle === 'function' ? c.getTitle(r) : c.help || undefined
                      const isNumeric = (c.align || 'right') === 'right'
                      return (
                        <td
                          key={String(c.key)}
                          className={isNumeric ? 'ranking-td-numeric' : undefined}
                          style={{ textAlign: c.align || 'right' }}
                          title={cellTitle || undefined}
                        >
                          {typeof c.render === 'function' ? c.render(r) : String(r?.[c.key] ?? '—')}
                        </td>
                      )
                    })()
                  )}
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
    tooltip: 'Sort: Total Trades DESC.',
    defaultSort: { key: 'totalTrades', dir: 'desc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => <StatusBadge statusKey={r.statusKey} statusLabel={r.statusLabel} />,
      },
      statusReasonColumn(),
      rewardLabelColumn(),
      {
        key: 'totalTrades',
        label: 'Total Trades',
        help: 'Total number of executed trades. Note: can be very high for algorithmic trading strategies (EAs).',
        align: 'right',
        width: 110,
        render: (r) => fmtInt(r.totalTrades),
      },
      {
        key: 'tradesPerMonth',
        label: 'Est. Trades/Month',
        help: 'Estimated trades/month derived from Total Trades and Active Months (approximation).',
        align: 'right',
        width: 130,
        render: (r) => fmtNum2(r.tradesPerMonth),
      },
      tradesPerDayColumn(),
      daysSinceLastTradeColumn(),
      {
        key: 'totalDeposit',
        label: 'Total Deposit',
        help: 'Total capital deposited by the trader, raw from source.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.totalDeposit),
      },
      {
        key: 'netDeposit',
        label: 'Net Deposit',
        help: 'Raw from source when available. Derived as Deposit - Withdrawals when missing.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
    ],
  },
  {
    key: 'top_performing',
    label: 'Top Performing Traders',
    tooltip: 'Sort: Closed PL DESC (only traders with Deposit ≥ 1000 and Trades ≥ 50).',
    defaultSort: { key: 'closedPL', dir: 'desc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => <StatusBadge statusKey={r.statusKey} statusLabel={r.statusLabel} />,
      },
      statusReasonColumn(),
      rewardLabelColumn(),
      {
        key: 'closedPL',
        label: 'Closed PL',
        help: 'Closed profit/loss from the report (higher is better).',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.closedPL),
      },
      daysSinceLastTradeColumn(),
      tradesPerDayColumn(),
      {
        key: 'totalDeposit',
        label: 'Total Deposit',
        help: 'Total capital deposited by the trader, raw from source.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.totalDeposit),
      },
      {
        key: 'netDeposit',
        label: 'Net Deposit',
        help: 'Raw from source when available. Derived as Deposit - Withdrawals when missing.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
      {
        key: 'totalTrades',
        label: 'Total Trades',
        help: 'Total number of executed trades. Note: can be very high for algorithmic trading strategies (EAs).',
        align: 'right',
        width: 110,
        render: (r) => fmtInt(r.totalTrades),
      },
      {
        key: 'tradesPerMonth',
        label: 'Est. Trades/Month',
        help: 'Estimated trades/month derived from Total Trades and Active Months (approximation).',
        align: 'right',
        width: 130,
        render: (r) => fmtNum2(r.tradesPerMonth),
      },
    ],
  },
  {
    key: 'most_consistent',
    label: 'Most Consistent Traders',
    tooltip: 'Sort: Active Months DESC, then Est. Trades/Month DESC.',
    defaultSort: { key: 'activeMonths', dir: 'desc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => <StatusBadge statusKey={r.statusKey} statusLabel={r.statusLabel} />,
      },
      statusReasonColumn(),
      rewardLabelColumn(),
      {
        key: 'activeMonths',
        label: 'Active Months',
        help: 'Number of months observed since first activity date to today (approximation).',
        align: 'right',
        width: 120,
        render: (r) => fmtInt(r.activeMonths),
      },
      {
        key: 'tradesPerMonth',
        label: 'Est. Trades/Month',
        help: 'Estimated trades/month derived from Total Trades and Active Months (approximation).',
        align: 'right',
        width: 130,
        render: (r) => fmtNum2(r.tradesPerMonth),
      },
      daysSinceLastTradeColumn(),
      tradesPerDayColumn(),
      {
        key: 'totalTrades',
        label: 'Total Trades',
        help: 'Total number of executed trades. Note: can be very high for algorithmic trading strategies (EAs).',
        align: 'right',
        width: 110,
        render: (r) => fmtInt(r.totalTrades),
      },
      {
        key: 'redeposit',
        label: 'Redeposit',
        help: 'Total redeposit amount from the report.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.redeposit),
      },
      {
        key: 'totalDeposit',
        label: 'Total Deposit',
        help: 'Total capital deposited by the trader, raw from source.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.totalDeposit),
      },
      {
        key: 'netDeposit',
        label: 'Net Deposit',
        help: 'Raw from source when available. Derived as Deposit - Withdrawals when missing.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
    ],
  },
  {
    key: 'rising',
    label: 'Rising Traders',
    tooltip: 'Sort: Days Since Last Trade ASC, then Est. Trades/Month DESC.',
    defaultSort: { key: 'daysSinceLastTradeSort', dir: 'asc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => <StatusBadge statusKey={r.statusKey} statusLabel={r.statusLabel} />,
      },
      statusReasonColumn(),
      rewardLabelColumn(),
      daysSinceLastTradeColumn(),
      tradesPerDayColumn(),
      {
        key: 'tradesPerMonth',
        label: 'Est. Trades/Month',
        help: 'Estimated trades/month derived from Total Trades and Active Months (approximation).',
        align: 'right',
        width: 130,
        render: (r) => fmtNum2(r.tradesPerMonth),
      },
      {
        key: 'totalTrades',
        label: 'Total Trades',
        help: 'Total number of executed trades. Note: can be very high for algorithmic trading strategies (EAs).',
        align: 'right',
        width: 110,
        render: (r) => fmtInt(r.totalTrades),
      },
      {
        key: 'totalDeposit',
        label: 'Total Deposit',
        help: 'Total capital deposited by the trader, raw from source.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.totalDeposit),
      },
      {
        key: 'netDeposit',
        label: 'Net Deposit',
        help: 'Raw from source when available. Derived as Deposit - Withdrawals when missing.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
    ],
  },
  {
    key: 'best_reward',
    label: 'Best Reward Candidates',
    tooltip:
      'Sort: Status priority (Very Active → Active → Dormant → Inactive), then Net Deposit DESC, then Total Trades DESC.',
    defaultSort: { key: 'statusOrder', dir: 'desc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => <StatusBadge statusKey={r.statusKey} statusLabel={r.statusLabel} />,
      },
      statusReasonColumn(),
      rewardLabelColumn(),
      {
        key: 'totalTrades',
        label: 'Total Trades',
        help: 'Total number of executed trades. Note: can be very high for algorithmic trading strategies (EAs).',
        align: 'right',
        width: 110,
        render: (r) => fmtInt(r.totalTrades),
      },
      {
        key: 'tradesPerMonth',
        label: 'Est. Trades/Month',
        help: 'Estimated trades/month derived from Total Trades and Active Months (approximation).',
        align: 'right',
        width: 130,
        render: (r) => fmtNum2(r.tradesPerMonth),
      },
      tradesPerDayColumn(),
      daysSinceLastTradeColumn(),
      {
        key: 'totalDeposit',
        label: 'Total Deposit',
        help: 'Total capital deposited by the trader, raw from source.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.totalDeposit),
      },
      {
        key: 'netDeposit',
        label: 'Net Deposit',
        help: 'Raw from source when available. Derived as Deposit - Withdrawals when missing.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
      {
        key: 'redeposit',
        label: 'Redeposit',
        help: 'Total redeposit amount from the report.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.redeposit),
      },
      {
        key: 'closedPL',
        label: 'Closed PL',
        help: 'Closed profit/loss from the report (higher is better).',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.closedPL),
      },
    ],
  },
]

export default function ProfitableRanking({ publicMode = false, initialState = null } = {}) {
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

  const hasDepositCount = useMemo(() => {
    const clients = dataset?.clients
    if (!Array.isArray(clients) || !clients.length) return false
    return clients.some((c) => Number.isFinite(Number(c?.depositCount)))
  }, [dataset?.clients])

  const tabConfigs = useMemo(() => {
    return TAB_CONFIGS.map((t) => {
      const safeCols = Array.isArray(t.columns) ? t.columns : []
      const cols = safeCols.filter((c) => {
        if (c?.requires === 'depositCount' && !hasDepositCount) return false
        if (c?.excludes === 'depositCount' && hasDepositCount) return false
        return true
      })
      return { ...t, columns: cols }
    })
  }, [hasDepositCount])

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

  const activeTabConfig = useMemo(() => {
    const configs = Array.isArray(tabConfigs) && tabConfigs.length ? tabConfigs : TAB_CONFIGS
    return configs.find((t) => t.key === activeTab) || configs[0]
  }, [activeTab, tabConfigs])

  const sortedForDisplay = useMemo(() => {
    const fallback = activeTabConfig?.defaultSort || { key: 'totalTrades', dir: 'desc' }
    const s = sortByTab[activeTab] || fallback
    const tieBreakers = []

    // Enforce the exact per-tab sorting rules even if the JS engine sort stability differs.
    if (activeTab === 'top_performing' && s.key === 'closedPL' && s.dir === 'desc') {
      tieBreakers.push({ key: 'totalTrades', dir: 'desc' })
    }

    if (activeTab === 'most_consistent' && s.key === 'activeMonths' && s.dir === 'desc') {
      tieBreakers.push({ key: 'tradesPerMonth', dir: 'desc' })
    }

    if (activeTab === 'rising' && s.key === 'daysSinceLastTradeSort' && s.dir === 'asc') {
      tieBreakers.push({ key: 'tradesPerMonth', dir: 'desc' })
    }

    if (activeTab === 'best_reward' && s.key === 'statusOrder' && s.dir === 'desc') {
      tieBreakers.push({ key: 'netDeposit', dir: 'desc' }, { key: 'totalTrades', dir: 'desc' })
    }

    return sortByKey(activeListWithSortKeys, s, tieBreakers)
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

  const countryOptions = dataset?.countries || []

  return (
    <div className="page-shell profitable-ranking-page">
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
            {fileName ? (
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
                {fileName}
                {dataset
                  ? ` • ${fmtInt(dataset.rowCount)} rows • ${fmtInt(dataset.clientCount)} clients`
                  : ''}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
                Data loads automatically when available.
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
            <div className="ranking-header-actions">
              <button
                type="button"
                className="pill-tab ranking-share-btn"
                onClick={onShare}
                disabled={loading || !dataset}
                title="Open the public page for this ranking (opens in a new tab and copies the link)"
              >
                Open Public Page
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
        </div>
      </header>

      <div className="ranking-controls">
        <div className="ranking-tabs-row">
          {tabConfigs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`pill-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              disabled={!dataset}
              title={t.tooltip || ''}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ranking-filters-grid">
          <label className="ranking-filter-field">
            <span className="ranking-filter-label">Min Deposit</span>
            <input
              type="number"
              className="search-hero-input ranking-filter-input"
              value={minDeposit}
              onChange={(e) => setMinDeposit(Number(e.target.value || 0))}
            />
          </label>

          <label className="ranking-filter-field">
            <span className="ranking-filter-label">Min Trades</span>
            <input
              type="number"
              className="search-hero-input ranking-filter-input"
              value={minTrades}
              onChange={(e) => setMinTrades(Number(e.target.value || 0))}
            />
          </label>

          <label className="ranking-filter-field">
            <span className="ranking-filter-label">Activity Recency</span>
            <select
              className="search-hero-input ranking-filter-input"
              value={String(activityRecencyDays)}
              onChange={(e) => setActivityRecencyDays(Number(e.target.value || 0))}
              aria-label="Activity recency filter"
            >
              <option value="0">Any</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
            </select>
          </label>

          <label className="ranking-filter-field ranking-filter-field--countries">
            <span className="ranking-filter-label">Countries (Ctrl/Cmd+Click)</span>
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
              className="search-hero-input ranking-filter-input ranking-filter-countries"
              disabled={!countryOptions.length}
              aria-label="Country filter"
            >
              {countryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

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
              padding: 14,
              marginTop: 10,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-muted)',
              fontWeight: 800,
            }}
          >
            Data is not available.
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
