import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import KpiCard from '../../components/common/KpiCard'
import FullPageLoader from '../../components/FullPageLoader'
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
  if (v === null || v === undefined || v === '') return '—'
  const n = Math.floor(Number(v))
  if (!Number.isFinite(n)) return '—'
  const d = Math.max(0, n)
  if (d === 0) return 'today'
  return `${d}d`
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

function StatusBadge({ statusKey, statusLabel, daysSinceLastTrade }) {
  const label = String(statusLabel || 'Inactive')
  const daysText = fmtDaysSuffix(daysSinceLastTrade)
  const cls = statusBadgeClass(String(statusKey || 'inactive'))
  return (
    <span className={`status-badge ${cls}`} title={statusHelpText()}>
      {label} ({daysText})
    </span>
  )
}

function rewardLabelHeaderHelpText() {
  return 'Suggested marketing action based on trader activity and capital engagement.'
}

function normalizeRewardLabel(v) {
  return String(v ?? '').trim()
}

function rewardLabelDisplayText(label) {
  const raw = normalizeRewardLabel(label)
  if (!raw) return '—'
  if (raw.toLowerCase() === 'ignore') return 'Low Priority'
  return raw
}

function rewardLabelBadgeTooltip(label) {
  const raw = normalizeRewardLabel(label)
  const key = raw.toLowerCase() === 'ignore' ? 'low priority' : raw.toLowerCase()

  if (key === 'send reward') {
    return 'Active trader with strong engagement. Good candidate for reward campaigns or VIP incentives.'
  }
  if (key === 'winback') {
    return 'Previously valuable trader who has stopped trading recently. Suitable for reactivation campaigns.'
  }
  if (key === 'nurture') {
    return 'Active trader with lower capital. Suitable for engagement campaigns to increase activity or deposits.'
  }
  if (key === 'low priority') {
    return 'Low activity or low capital account. Not a priority for reward campaigns.'
  }

  return rewardLabelHeaderHelpText()
}

function rewardChipClass(label) {
  const v0 = normalizeRewardLabel(label).toLowerCase()
  const v = v0 === 'ignore' ? 'low priority' : v0
  if (v === 'send reward') return 'reward-success'
  if (v === 'nurture') return 'reward-info'
  if (v === 'winback') return 'reward-warning'
  return 'reward-muted'
}

function RewardChip({ label }) {
  const raw = normalizeRewardLabel(label)
  const text = rewardLabelDisplayText(raw)
  const cls = rewardChipClass(raw)
  return (
    <span className={`reward-chip ${cls}`} title={rewardLabelBadgeTooltip(raw)}>
      {text}
    </span>
  )
}

function rewardLabelColumn() {
  return {
    key: 'rewardLabel',
    label: 'Reward Label',
    help: rewardLabelHeaderHelpText(),
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

function toFiniteNumber(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function toFiniteInt(v, fallback = 0) {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) ? n : fallback
}

function computeDaysSinceLastTrade(row) {
  const raw = row?.recencyDays
  if (raw === null || raw === undefined || raw === '') return null
  const d = Number(raw)
  if (!Number.isFinite(d)) return null
  return Math.max(0, Math.floor(d))
}

function computeTradesPerDay(row) {
  const tpm = toFiniteNumber(row?.tradesPerMonth, NaN)
  if (Number.isFinite(tpm)) return Math.max(0, tpm) / 30

  const trades = Math.max(0, toFiniteInt(row?.totalTrades, 0))
  const months = Math.max(1, toFiniteInt(row?.activeMonths, 1))
  return trades / (months * 30)
}

function classifyActivityStatus({ totalTrades, tradesPerMonth, daysSinceLastTrade } = {}) {
  const trades = Math.max(0, toFiniteInt(totalTrades, 0))
  const tpm = Math.max(0, toFiniteNumber(tradesPerMonth, 0))
  const d = Number.isFinite(Number(daysSinceLastTrade))
    ? Math.max(0, Math.floor(Number(daysSinceLastTrade)))
    : null
  const tpmText = Number.isFinite(tpm) ? tpm.toFixed(2) : '—'

  if (trades <= 0) {
    return {
      statusKey: 'inactive',
      statusLabel: 'Inactive',
      statusOrder: 0,
      statusReasonShort: 'No trades',
      statusReasonFull: 'No trades recorded in the dataset for this trader.',
    }
  }

  if (d == null) {
    return {
      statusKey: 'inactive',
      statusLabel: 'Inactive',
      statusOrder: 0,
      statusReasonShort: 'No last-trade date',
      statusReasonFull: 'No valid last-trade activity date was found for this trader.',
    }
  }

  if (d <= 7 && tpm >= 20) {
    return {
      statusKey: 'very_active',
      statusLabel: 'Very Active',
      statusOrder: 3,
      statusReasonShort: 'Recent + high frequency',
      statusReasonFull: `Last trade ${d}d ago; avg ${tpmText} trades/month.`,
    }
  }

  if (d <= 30 && tpm >= 5) {
    return {
      statusKey: 'active',
      statusLabel: 'Active',
      statusOrder: 2,
      statusReasonShort: 'Recent activity',
      statusReasonFull: `Last trade ${d}d ago; avg ${tpmText} trades/month.`,
    }
  }

  if (d <= 90) {
    return {
      statusKey: 'dormant',
      statusLabel: 'Dormant',
      statusOrder: 1,
      statusReasonShort: 'Not recently active',
      statusReasonFull: `Last trade ${d}d ago; avg ${tpmText} trades/month.`,
    }
  }

  return {
    statusKey: 'inactive',
    statusLabel: 'Inactive',
    statusOrder: 0,
    statusReasonShort: 'Long inactive',
    statusReasonFull: `Last trade ${d}d ago; avg ${tpmText} trades/month.`,
  }
}

function classifyRewardLabel({
  statusKey,
  totalDeposit,
  netDeposit,
  equity,
  totalTrades,
  tradesPerMonth,
} = {}) {
  const dep = toFiniteNumber(totalDeposit, 0)
  const net = toFiniteNumber(netDeposit, 0)
  const eq = toFiniteNumber(equity, 0)
  const trades = Math.max(0, toFiniteInt(totalTrades, 0))
  const tpm = Math.max(0, toFiniteNumber(tradesPerMonth, 0))

  const valueSignal = Math.max(0, net) + Math.max(0, eq)
  const highValue = valueSignal >= 1000 || dep >= 1000
  const mediumValue = valueSignal >= 300 || dep >= 300

  if (statusKey === 'very_active') {
    return highValue || mediumValue ? 'Send reward' : 'Nurture'
  }
  if (statusKey === 'active') {
    return highValue ? 'Send reward' : 'Nurture'
  }
  if (statusKey === 'dormant') {
    return highValue || trades >= 100 || tpm >= 10 ? 'Winback' : 'Ignore'
  }
  return 'Ignore'
}

function tradesPerDayColumn() {
  return {
    key: 'tradesPerDay',
    label: 'Avg Trades / Day',
    help: 'Average number of trades executed per day.',
    align: 'right',
    width: 105,
    render: (r) => (Number.isFinite(Number(r?.tradesPerDay)) ? fmtNum2(r.tradesPerDay) : '—'),
  }
}

function daysSinceLastTradeColumn() {
  return {
    key: 'daysSinceLastTradeSort',
    label: 'Last Trade',
    help: 'How long ago the trader executed their last trade.',
    align: 'right',
    width: 150,
    render: (r) => fmtDaysSuffix(r?.daysSinceLastTrade),
  }
}

function equityColumn() {
  return {
    key: 'equity',
    label: 'Equity',
    help: 'Current equity from the report (per trader).',
    align: 'right',
    width: 130,
    render: (r) => fmtMoney0(r?.equity),
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

function normalizeKeyName(k) {
  return String(k || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function yearMonthIndex(y, m) {
  return y * 12 + (m - 1)
}

function coerceInt(v) {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) ? n : null
}

function buildPeriodKey(year, month) {
  const y = Math.floor(Number(year))
  const m = Math.floor(Number(month))
  if (!Number.isFinite(y) || !Number.isFinite(m)) return ''
  return `${y}-${String(m).padStart(2, '0')}`
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

    let sortedHint = ''
    if (isActive) {
      const dir = String(sortState.dir || 'desc')
      if (String(colKey) === 'daysSinceLastTradeSort') {
        sortedHint = `Sorted by ${label} (${dir === 'asc' ? 'most recent first' : 'longest ago first'})`
      } else if (align === 'left') {
        sortedHint = `Sorted by ${label} (${dir === 'asc' ? 'A to Z' : 'Z to A'})`
      } else {
        sortedHint = `Sorted by ${label} (${dir === 'asc' ? 'lowest first' : 'highest first'})`
      }
    }

    const parts = []
    if (sortedHint) parts.push(sortedHint)
    if (help) parts.push(help)
    parts.push('Click to sort')
    const title = parts.join('\n')
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
    <div className="ranking-table-block">
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

      <div className="ranking-table-scroll hide-scrollbar" tabIndex={0} aria-label="Trader list">
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
                label="Agent"
                colKey="agentUser"
                align="left"
                width={140}
                help="Assigned agent from the report (User column)"
              />
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
                  <td style={{ textAlign: 'left' }} title={String(r.agentUser || 'Unassigned')}>
                    <div
                      style={{
                        maxWidth: 135,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 750,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {String(r.agentUser || 'Unassigned')}
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
                  colSpan={4 + safeColumns.length}
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
    subtitle: 'Traders with the highest trading activity.',
    tooltip: 'Traders with the highest trading activity.',
    defaultSort: { key: 'totalTrades', dir: 'desc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => (
          <StatusBadge
            statusKey={r.statusKey}
            statusLabel={r.statusLabel}
            daysSinceLastTrade={r?.daysSinceLastTrade}
          />
        ),
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
        label: 'Avg Trades / Month',
        help: "Average number of trades executed per month during the trader's activity.",
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
        label: 'Net Deposited Capital',
        help: 'Total deposits minus withdrawals.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
      equityColumn(),
    ],
  },
  {
    key: 'top_performing',
    label: 'Top Performing Traders',
    subtitle: 'Traders generating the highest realized profits.',
    tooltip: 'Traders generating the highest realized profits.',
    defaultSort: { key: 'closedPL', dir: 'desc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => (
          <StatusBadge
            statusKey={r.statusKey}
            statusLabel={r.statusLabel}
            daysSinceLastTrade={r?.daysSinceLastTrade}
          />
        ),
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
        label: 'Net Deposited Capital',
        help: 'Total deposits minus withdrawals.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
      equityColumn(),
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
        label: 'Avg Trades / Month',
        help: "Average number of trades executed per month during the trader's activity.",
        align: 'right',
        width: 130,
        render: (r) => fmtNum2(r.tradesPerMonth),
      },
    ],
  },
  {
    key: 'most_consistent',
    label: 'Most Consistent Traders',
    subtitle: 'Traders with steady activity over time.',
    tooltip: 'Traders with steady activity over time.',
    defaultSort: { key: 'activeMonths', dir: 'desc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => (
          <StatusBadge
            statusKey={r.statusKey}
            statusLabel={r.statusLabel}
            daysSinceLastTrade={r?.daysSinceLastTrade}
          />
        ),
      },
      statusReasonColumn(),
      rewardLabelColumn(),
      {
        key: 'activeMonths',
        label: 'Active Trading Months',
        help: 'Number of months the trader has been active.',
        align: 'right',
        width: 120,
        render: (r) => fmtInt(r.activeMonths),
      },
      {
        key: 'tradesPerMonth',
        label: 'Avg Trades / Month',
        help: "Average number of trades executed per month during the trader's activity.",
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
        label: 'Net Deposited Capital',
        help: 'Total deposits minus withdrawals.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
      equityColumn(),
    ],
  },
  {
    key: 'rising',
    label: 'Rising Traders',
    subtitle: 'Traders with increasing recent activity.',
    tooltip: 'Traders with increasing recent activity.',
    defaultSort: { key: 'daysSinceLastTradeSort', dir: 'asc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => (
          <StatusBadge
            statusKey={r.statusKey}
            statusLabel={r.statusLabel}
            daysSinceLastTrade={r?.daysSinceLastTrade}
          />
        ),
      },
      statusReasonColumn(),
      rewardLabelColumn(),
      daysSinceLastTradeColumn(),
      tradesPerDayColumn(),
      {
        key: 'tradesPerMonth',
        label: 'Avg Trades / Month',
        help: "Average number of trades executed per month during the trader's activity.",
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
        label: 'Net Deposited Capital',
        help: 'Total deposits minus withdrawals.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
      equityColumn(),
    ],
  },
  {
    key: 'best_reward',
    label: 'Best Reward Candidates',
    subtitle: 'Traders most suitable for marketing rewards.',
    tooltip: 'Traders most suitable for marketing rewards.',
    defaultSort: { key: 'statusOrder', dir: 'desc' },
    columns: [
      {
        key: 'statusOrder',
        label: 'Status',
        help: 'Activity classification based on trading frequency and recency.',
        align: 'left',
        width: 120,
        render: (r) => (
          <StatusBadge
            statusKey={r.statusKey}
            statusLabel={r.statusLabel}
            daysSinceLastTrade={r?.daysSinceLastTrade}
          />
        ),
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
        label: 'Avg Trades / Month',
        help: "Average number of trades executed per month during the trader's activity.",
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
        label: 'Net Deposited Capital',
        help: 'Total deposits minus withdrawals.',
        align: 'right',
        width: 130,
        render: (r) => fmtMoney0(r.netDeposit),
      },
      equityColumn(),
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

  const rootRef = useRef(null)

  const [isUpdating, setIsUpdating] = useState(false)
  const updateTimerRef = useRef(null)

  const deferRef = useRef(null)

  const triggerUpdate = () => {
    if (!dataset) return
    setIsUpdating(true)
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current)
    updateTimerRef.current = setTimeout(() => setIsUpdating(false), 520)
  }

  const deferAfterUpdate = (fn) => {
    if (typeof fn !== 'function') return
    triggerUpdate()
    if (deferRef.current) clearTimeout(deferRef.current)
    deferRef.current = setTimeout(() => {
      deferRef.current = null
      fn()
    }, 0)
  }

  useEffect(() => {
    return () => {
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current)
      if (deferRef.current) clearTimeout(deferRef.current)
    }
  }, [])

  const [headerCollapsed, setHeaderCollapsed] = useState(() => {
    try {
      if (typeof window === 'undefined') return true
      const v = window.localStorage.getItem('profitableRankingHeaderCollapsed')
      if (v == null) return true
      return v === 'true'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      window.localStorage.setItem('profitableRankingHeaderCollapsed', String(headerCollapsed))
    } catch {
      // ignore
    }
  }, [headerCollapsed])

  const [artifact, setArtifact] = useState(null)

  // Timeframe (global)
  const [timeframe, setTimeframe] = useState('last12')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonthKey, setSelectedMonthKey] = useState('')

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
        setArtifact({ rows, headers })
      } catch {
        // Silent fallback: user can still upload an XLSX.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Only auto-load if nothing is loaded yet.
    if (!artifact) tryAutoLoad()
    return () => {
      cancelled = true
    }
  }, [artifact])

  const todayRef = useRef(null)
  if (!todayRef.current) todayRef.current = new Date()

  useEffect(() => {
    // Dashboard-style page: prevent the global document from scrolling.
    // Only the table container should scroll.
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const dashboardContent =
      rootRef.current?.closest?.('.dashboard-content') ||
      document.querySelector('.dashboard-content')
    const prevDashOverflowY = dashboardContent?.style?.overflowY
    const prevDashOverscroll = dashboardContent?.style?.overscrollBehavior

    if (dashboardContent) {
      dashboardContent.style.overflowY = 'hidden'
      dashboardContent.style.overscrollBehavior = 'none'
    }

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      if (dashboardContent) {
        dashboardContent.style.overflowY = prevDashOverflowY || ''
        dashboardContent.style.overscrollBehavior = prevDashOverscroll || ''
      }
    }
  }, [])

  const rawRows = artifact?.rows || []
  const rawHeaders = artifact?.headers || []

  const periodConfig = useMemo(() => {
    const headers = Array.isArray(rawHeaders) ? rawHeaders : []
    const firstRow = Array.isArray(rawRows) && rawRows.length ? rawRows[0] : null
    const rowKeys = firstRow && typeof firstRow === 'object' ? Object.keys(firstRow) : []
    const candidates = [...headers, ...rowKeys]

    const byNorm = new Map()
    for (const h of candidates) {
      const norm = normalizeKeyName(h)
      if (!norm) continue
      if (!byNorm.has(norm)) byNorm.set(norm, String(h))
    }

    const yearCol = byNorm.get('year') || null
    const monthCol = byNorm.get('month') || null

    const periodCol =
      byNorm.get('yearmonth') ||
      byNorm.get('monthyear') ||
      byNorm.get('yyyymm') ||
      byNorm.get('year_month') ||
      byNorm.get('yearmonthkey') ||
      byNorm.get('period') ||
      null

    return { yearCol, monthCol, periodCol }
  }, [rawHeaders, rawRows])

  const parsePeriodValue = useCallback((v) => {
    if (v == null) return null
    const s = String(v).trim()
    if (!s) return null

    function monthNameToNumber(name) {
      const t = String(name || '')
        .trim()
        .toLowerCase()
      if (!t) return null
      const key = t.slice(0, 3)
      const map = {
        jan: 1,
        gen: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        may: 5,
        mag: 5,
        jun: 6,
        giu: 6,
        jul: 7,
        lug: 7,
        aug: 8,
        ago: 8,
        sep: 9,
        set: 9,
        oct: 10,
        ott: 10,
        nov: 11,
        dec: 12,
        dic: 12,
      }
      return map[key] || null
    }

    // ISO-like (YYYY-MM or YYYY-MM-DD)
    const m1 = s.match(/(\d{4})\s*[-\/._\s]\s*(\d{1,2})/)
    if (m1) {
      const y = Math.floor(Number(m1[1]))
      const m = Math.floor(Number(m1[2]))
      if (Number.isFinite(y) && Number.isFinite(m) && y > 1900 && y < 3000 && m >= 1 && m <= 12) {
        return { year: y, month: m }
      }
    }

    // Month name formats like '2024-Apr' or 'Apr-2024' or 'Apr 2024'
    const mName1 = s.match(/\b(\d{4})\s*[-\/._\s]\s*([A-Za-z]{3,9})\b/)
    if (mName1) {
      const y = Math.floor(Number(mName1[1]))
      const m = monthNameToNumber(mName1[2])
      if (Number.isFinite(y) && y > 1900 && y < 3000 && m && m >= 1 && m <= 12) {
        return { year: y, month: m }
      }
    }

    const mName2 = s.match(/\b([A-Za-z]{3,9})\s*[-\/._\s]\s*(\d{4})\b/)
    if (mName2) {
      const y = Math.floor(Number(mName2[2]))
      const m = monthNameToNumber(mName2[1])
      if (Number.isFinite(y) && y > 1900 && y < 3000 && m && m >= 1 && m <= 12) {
        return { year: y, month: m }
      }
    }

    // Compact (YYYYMM)
    const m2 = s.match(/\b(\d{4})(\d{2})\b/)
    if (m2) {
      const y = Math.floor(Number(m2[1]))
      const m = Math.floor(Number(m2[2]))
      if (Number.isFinite(y) && Number.isFinite(m) && y > 1900 && y < 3000 && m >= 1 && m <= 12) {
        return { year: y, month: m }
      }
    }

    // Last resort: Date.parse if it looks like a date
    const ms = Date.parse(s)
    if (Number.isFinite(ms)) {
      const d = new Date(ms)
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      if (y > 1900 && y < 3000 && m >= 1 && m <= 12) return { year: y, month: m }
    }

    return null
  }, [])

  const extractPeriod = useCallback(
    (row) => {
      const r = row && typeof row === 'object' ? row : null
      if (!r) return null

      // Prefer explicit year/month fields if present.
      if (periodConfig.yearCol && periodConfig.monthCol) {
        const y = coerceInt(r[periodConfig.yearCol])
        const m = coerceInt(r[periodConfig.monthCol])
        if (y && m && y > 1900 && y < 3000 && m >= 1 && m <= 12) {
          const periodKey = buildPeriodKey(y, m)
          const periodDate = new Date(Date.UTC(y, m - 1, 1))
          return { periodKey, year: y, month: m, periodDate }
        }
      }

      // Otherwise parse a period-like field.
      const val = periodConfig.periodCol ? r[periodConfig.periodCol] : null
      const parsed = parsePeriodValue(val)
      if (!parsed) return null
      const periodKey = buildPeriodKey(parsed.year, parsed.month)
      const periodDate = new Date(Date.UTC(parsed.year, parsed.month - 1, 1))
      return { periodKey, year: parsed.year, month: parsed.month, periodDate }
    },
    [parsePeriodValue, periodConfig]
  )

  const periodAvailable = useMemo(() => {
    for (const r of rawRows) {
      if (extractPeriod(r)) return true
    }
    return false
  }, [extractPeriod, rawRows])

  useEffect(() => {
    if (periodAvailable) return
    if (timeframe === 'year' || timeframe === 'month') {
      setTimeframe('last12')
    }
  }, [periodAvailable, timeframe])

  const yearOptions = useMemo(() => {
    if (!periodAvailable) return []
    const set = new Set()
    for (const r of rawRows) {
      const p = extractPeriod(r)
      if (p?.year) set.add(p.year)
    }
    return [...set].sort((a, b) => b - a)
  }, [extractPeriod, periodAvailable, rawRows])

  const monthOptions = useMemo(() => {
    if (!periodAvailable) return []
    const set = new Set()
    const list = []
    for (const r of rawRows) {
      const p = extractPeriod(r)
      if (!p?.periodKey) continue
      if (set.has(p.periodKey)) continue
      set.add(p.periodKey)
      list.push(p.periodKey)
    }
    return list.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
  }, [extractPeriod, periodAvailable, rawRows])

  useEffect(() => {
    if (!yearOptions.length) return
    if (selectedYear && yearOptions.includes(selectedYear)) return
    setSelectedYear(yearOptions[0])
  }, [selectedYear, yearOptions])

  useEffect(() => {
    if (!monthOptions.length) return
    if (selectedMonthKey && monthOptions.includes(selectedMonthKey)) return
    setSelectedMonthKey(monthOptions[0])
  }, [selectedMonthKey, monthOptions])

  const filteredRows = useMemo(() => {
    const list = Array.isArray(rawRows) ? rawRows : []
    if (!list.length) return []

    if (timeframe === 'all') return list

    // If source data doesn't provide a usable month/year period, do not attempt month/year filtering.
    if (!periodAvailable) return list

    if (timeframe === 'year') {
      const y0 = Number(selectedYear)
      if (!Number.isFinite(y0)) return list
      const yy = Math.floor(y0)
      return list.filter((r) => {
        const p = extractPeriod(r)
        return p?.year === yy
      })
    }

    if (timeframe === 'month') {
      const k = String(selectedMonthKey || '').trim()
      if (!k) return list
      return list.filter((r) => {
        const p = extractPeriod(r)
        return p?.periodKey === k
      })
    }

    // last12 (default)
    const t = todayRef.current instanceof Date ? todayRef.current : new Date()
    const currentIdx = t.getUTCFullYear() * 12 + t.getUTCMonth()
    const cutoffIdx = currentIdx - 11

    return list.filter((r) => {
      const p = extractPeriod(r)
      if (!p?.year || !p?.month) return false
      return yearMonthIndex(p.year, p.month) >= cutoffIdx
    })
  }, [extractPeriod, periodAvailable, rawRows, selectedMonthKey, selectedYear, timeframe])

  const dataset = useMemo(() => {
    if (!artifact) return null
    const rows = Array.isArray(filteredRows) ? filteredRows : []
    const headers = Array.isArray(rawHeaders) ? rawHeaders : []
    return buildTradersRankingRewardsDataset({ rows, headers })
  }, [artifact, filteredRows, rawHeaders])

  useEffect(() => {
    if (!dataset) setIsUpdating(false)
  }, [dataset])

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

  const [selectedAgents, setSelectedAgents] = useState([])
  const [agentSearch, setAgentSearch] = useState('')

  const hasMinDepositFilter = Number(minDeposit) > 0
  const hasMinTradesFilter = Number(minTrades) > 0
  const hasActivityRecencyFilter = Number(activityRecencyDays) > 0
  const hasCountryFilter = Array.isArray(selectedCountries) && selectedCountries.length > 0
  const hasAgentFilter = Array.isArray(selectedAgents) && selectedAgents.length > 0
  const hasAnyFilterActive =
    hasMinDepositFilter ||
    hasMinTradesFilter ||
    hasActivityRecencyFilter ||
    hasCountryFilter ||
    hasAgentFilter

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

  const agentOptions = useMemo(() => {
    const list = Array.isArray(dataset?.agentUsers) ? dataset.agentUsers : []
    if (list.length) return list
    const clients = Array.isArray(dataset?.clients) ? dataset.clients : []
    const set = new Set()
    for (const c of clients) set.add(String(c?.agentUser || 'Unassigned').trim() || 'Unassigned')
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [dataset?.agentUsers, dataset?.clients])

  const datasetForRanking = useMemo(() => {
    if (!dataset?.clients) return null
    const agents = Array.isArray(selectedAgents) ? selectedAgents : []
    if (!agents.length) return dataset
    const allowed = new Set(agents.map((a) => String(a || '').trim()))
    const clients = dataset.clients.filter((c) =>
      allowed.has(String(c?.agentUser || 'Unassigned').trim() || 'Unassigned')
    )
    return { ...dataset, clients }
  }, [dataset, selectedAgents])

  const agentByClientId = useMemo(() => {
    const map = new Map()
    const clients = Array.isArray(datasetForRanking?.clients) ? datasetForRanking.clients : []
    for (const c of clients) {
      const id = String(c?.clientId || '').trim()
      if (!id) continue
      map.set(id, String(c?.agentUser || 'Unassigned').trim() || 'Unassigned')
    }
    return map
  }, [datasetForRanking?.clients])

  const v1 = useMemo(() => {
    if (!datasetForRanking?.clients) return null
    return buildRankingsV1({
      dataset: datasetForRanking,
      minTrades: Number(minTrades) || 0,
      minDeposit: Number(minDeposit) || 0,
      countries: Array.isArray(selectedCountries) ? selectedCountries : [],
      activityRecencyDays: Number(activityRecencyDays) || 0,
      today: todayRef.current,
    })
  }, [activityRecencyDays, datasetForRanking, minDeposit, minTrades, selectedCountries])

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
      const agentUser = agentByClientId.get(String(r?.clientId || '').trim()) || 'Unassigned'

      const daysSinceLastTrade = computeDaysSinceLastTrade(r)
      const daysSinceLastTradeSort = daysSinceLastTrade == null ? 999999 : daysSinceLastTrade
      const tradesPerDay = computeTradesPerDay(r)

      const status = classifyActivityStatus({
        totalTrades: r?.totalTrades,
        tradesPerMonth: r?.tradesPerMonth,
        daysSinceLastTrade,
      })

      const rewardLabel = classifyRewardLabel({
        statusKey: status.statusKey,
        totalDeposit: r?.totalDeposit,
        netDeposit: r?.netDeposit,
        equity: r?.equity,
        totalTrades: r?.totalTrades,
        tradesPerMonth: r?.tradesPerMonth,
      })

      return {
        ...r,
        agentUser,
        lastTradeDateMs: Number.isFinite(ms) ? ms : 0,
        daysSinceLastTrade,
        daysSinceLastTradeSort,
        tradesPerDay,
        ...status,
        rewardLabel,
      }
    })
  }, [activeList, agentByClientId])

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
  const agentSearchLower = String(agentSearch || '')
    .trim()
    .toLowerCase()
  const filteredAgentOptions = useMemo(() => {
    if (!agentSearchLower) return agentOptions
    return agentOptions.filter((a) => String(a).toLowerCase().includes(agentSearchLower))
  }, [agentOptions, agentSearchLower])

  const agentSummaryText = useMemo(() => {
    const agents = Array.isArray(selectedAgents) ? selectedAgents : []
    if (!agents.length) return 'All'
    return agents.join(', ')
  }, [selectedAgents])

  const timeframeLabel = useMemo(() => {
    if (timeframe === 'all') return 'All Time'
    if (timeframe === 'last12') return 'Last 12 Months'
    if (timeframe === 'year') {
      const y = Number(selectedYear)
      return Number.isFinite(y) ? `Year ${Math.floor(y)}` : 'Year'
    }
    if (timeframe === 'month') {
      const k = String(selectedMonthKey || '').trim()
      return `Month ${k || '—'}`
    }
    return 'Last 12 Months'
  }, [monthOptions, selectedMonthKey, selectedYear, timeframe])

  const showOverlayLoader = Boolean(loading || isUpdating)
  const overlaySubtitle = 'Loading…'

  return (
    <div
      ref={rootRef}
      className={`page-shell profitable-ranking-page profitable-ranking-dashboard profitable-ranking-compact${
        headerCollapsed ? ' profitable-ranking-collapsed' : ''
      }`}
    >
      {showOverlayLoader ? (
        <div
          className="logo-tools-backdrop"
          role="status"
          aria-live="polite"
          aria-label={overlaySubtitle}
          style={{ zIndex: 210, display: 'grid', placeItems: 'center', padding: 14 }}
        >
          <div style={{ width: 'min(420px, 92vw)' }}>
            <FullPageLoader progress={45} subtitle={overlaySubtitle} minHeight="auto" />
          </div>
        </div>
      ) : null}

      <div className="profitable-ranking-dashboard-content">
        <div className="profitable-ranking-fixed">
          <div className="profitable-ranking-collapsible profitable-ranking-collapsible--top">
            <header
              className="page-header ranking-header ranking-sticky-header"
              style={{ alignItems: 'stretch' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>
                  <p className="page-label">Retention</p>
                  <h1 className="page-title">Profitable Traders Ranking (Retention Rewards)</h1>
                  <p className="page-subtitle">
                    Rank traders by broker value and engagement for reward campaigns.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {fileName ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
                      {fileName}
                      {dataset ? ` • ${fmtInt(kpis.count)} traders` : ''}
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

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}
              >
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
                    gap: 8,
                    width: '100%',
                  }}
                >
                  <KpiCard
                    label="Total Traders"
                    value={fmtInt(kpis.count)}
                    size="sm"
                    density="compact"
                  />
                  <KpiCard
                    label="Total Deposits"
                    value={fmtMoney0(kpis.totalDeposits)}
                    size="sm"
                    density="compact"
                  />
                  <KpiCard
                    label="Total Trades"
                    value={fmtInt(kpis.totalTrades)}
                    size="sm"
                    density="compact"
                  />
                  <KpiCard
                    label="Total Closed PL"
                    value={fmtMoney0(kpis.totalClosedPL)}
                    size="sm"
                    density="compact"
                  />
                </div>

                <div style={{ height: 1, width: '100%', background: 'rgba(255,255,255,0.06)' }} />
              </div>
            </header>
          </div>

          <div className="ranking-controls">
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                marginBottom: 6,
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 900 }}>
                Timeframe
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`pill-tab${timeframe === 'all' ? ' active' : ''}`}
                  onClick={() => {
                    deferAfterUpdate(() => setTimeframe('all'))
                  }}
                  disabled={!dataset}
                  title="Show all available data"
                >
                  All Time
                </button>

                <button
                  type="button"
                  className={`pill-tab${timeframe === 'last12' ? ' active' : ''}`}
                  onClick={() => {
                    deferAfterUpdate(() => setTimeframe('last12'))
                  }}
                  disabled={!dataset}
                  title="Show only the last 12 months of data"
                >
                  Last 12 Months
                </button>

                {periodAvailable ? (
                  <select
                    className={`pill-tab${timeframe === 'year' ? ' active' : ''}`}
                    value={selectedYear == null ? '' : String(selectedYear)}
                    onFocus={() => {
                      deferAfterUpdate(() => setTimeframe('year'))
                    }}
                    onChange={(e) => {
                      const nextYear = Number(e.target.value)
                      deferAfterUpdate(() => {
                        setSelectedYear(nextYear)
                        setTimeframe('year')
                      })
                    }}
                    disabled={!dataset || !yearOptions.length}
                    title="Filter by year"
                  >
                    {yearOptions.map((y) => (
                      <option key={String(y)} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                ) : null}

                {periodAvailable ? (
                  <select
                    className={`pill-tab${timeframe === 'month' ? ' active' : ''}`}
                    value={selectedMonthKey}
                    onFocus={() => {
                      deferAfterUpdate(() => setTimeframe('month'))
                    }}
                    onChange={(e) => {
                      const nextKey = String(e.target.value)
                      deferAfterUpdate(() => {
                        setSelectedMonthKey(nextKey)
                        setTimeframe('month')
                      })
                    }}
                    disabled={!dataset || !monthOptions.length}
                    title="Filter by month (YYYY-MM)"
                  >
                    {monthOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                ) : null}

                <button
                  type="button"
                  className="pill-tab ranking-collapse-toggle"
                  onClick={() => setHeaderCollapsed((v) => !v)}
                  title={headerCollapsed ? 'Expand header' : 'Collapse header'}
                >
                  {headerCollapsed ? 'Expand' : 'Collapse'}{' '}
                  <span aria-hidden="true" style={{ fontWeight: 900 }}>
                    {headerCollapsed ? '▾' : '▴'}
                  </span>
                </button>
              </div>
            </div>

            {dataset && !periodAvailable ? (
              <div
                style={{
                  margin: '-2px 0 10px',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Month/Year not available in source data
              </div>
            ) : null}

            <div className="ranking-tabs-row">
              {tabConfigs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`pill-tab${activeTab === t.key ? ' active' : ''}`}
                  onClick={() => {
                    deferAfterUpdate(() => setActiveTab(t.key))
                  }}
                  disabled={!dataset}
                  title={t.tooltip || ''}
                >
                  <span
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      alignItems: 'flex-start',
                    }}
                  >
                    <span>{t.label}</span>
                    {t.subtitle ? (
                      <span
                        style={{ fontSize: 11, fontWeight: 700, opacity: 0.78, lineHeight: 1.1 }}
                      >
                        {t.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>

            <div className="ranking-filters-grid ranking-filters-grid--minimal">
              <label
                className={`ranking-filter-field ranking-filter-field--agent${
                  hasAgentFilter ? ' ranking-filter-field--active' : ''
                }`}
              >
                <span className="ranking-filter-label">Agent</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="text"
                    className={`search-hero-input ranking-filter-input${
                      String(agentSearch || '').trim() ? ' ranking-filter-input--active' : ''
                    }`}
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(String(e.target.value || ''))}
                    placeholder="Search agents…"
                    aria-label="Agent search"
                  />
                  <button
                    type="button"
                    className="pill-tab"
                    onClick={() => {
                      triggerUpdate()
                      setSelectedAgents([])
                      setAgentSearch('')
                    }}
                    disabled={!selectedAgents.length && !agentSearch}
                    title="Clear agent selection"
                  >
                    ×
                  </button>
                </div>
                <select
                  multiple
                  size={headerCollapsed ? 2 : 3}
                  value={selectedAgents}
                  onChange={(e) => {
                    triggerUpdate()
                    const next = []
                    for (const opt of e.target.options) {
                      if (opt.selected) next.push(opt.value)
                    }
                    setSelectedAgents(next)
                  }}
                  className={`search-hero-input ranking-filter-input ranking-filter-agents${
                    hasAgentFilter ? ' ranking-filter-input--active' : ''
                  }`}
                  disabled={!agentOptions.length}
                  aria-label="Agent filter"
                  title="Filter by assigned agent (Ctrl/Cmd+Click to multi-select)"
                >
                  {filteredAgentOptions.map((a) => (
                    <option key={String(a)} value={String(a)}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className={`ranking-filter-field${hasMinDepositFilter ? ' ranking-filter-field--active' : ''}`}
              >
                <span className="ranking-filter-label">Min Deposit</span>
                <input
                  type="number"
                  className={`search-hero-input ranking-filter-input${
                    hasMinDepositFilter ? ' ranking-filter-input--active' : ''
                  }`}
                  value={minDeposit}
                  onChange={(e) => {
                    triggerUpdate()
                    setMinDeposit(Number(e.target.value || 0))
                  }}
                />
              </label>

              <label
                className={`ranking-filter-field${hasMinTradesFilter ? ' ranking-filter-field--active' : ''}`}
              >
                <span className="ranking-filter-label">Min Trades</span>
                <input
                  type="number"
                  className={`search-hero-input ranking-filter-input${
                    hasMinTradesFilter ? ' ranking-filter-input--active' : ''
                  }`}
                  value={minTrades}
                  onChange={(e) => {
                    triggerUpdate()
                    setMinTrades(Number(e.target.value || 0))
                  }}
                />
              </label>

              <label
                className={`ranking-filter-field ranking-filter-field--countries${
                  hasCountryFilter ? ' ranking-filter-field--active' : ''
                }`}
              >
                <span className="ranking-filter-label">Countries (Ctrl/Cmd+Click)</span>
                <select
                  multiple
                  size={headerCollapsed ? 2 : 3}
                  value={selectedCountries}
                  onChange={(e) => {
                    triggerUpdate()
                    const next = []
                    for (const opt of e.target.options) {
                      if (opt.selected) next.push(opt.value)
                    }
                    setSelectedCountries(next)
                  }}
                  className={`search-hero-input ranking-filter-input ranking-filter-countries${
                    hasCountryFilter ? ' ranking-filter-input--active' : ''
                  }`}
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

              <div
                className="ranking-filter-field ranking-filter-field--reset"
                style={{ alignSelf: 'end' }}
              >
                <button
                  type="button"
                  className={`pill-tab${hasAnyFilterActive ? ' active' : ''}`}
                  onClick={() => {
                    triggerUpdate()
                    setMinDeposit(0)
                    setMinTrades(0)
                    setActivityRecencyDays(0)
                    setSelectedCountries([])
                    setSelectedAgents([])
                    setAgentSearch('')
                  }}
                  title="Reset all filters"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {dataset ? (
              <div
                style={{
                  margin: '2px 0 0',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                Agent: {agentSummaryText}
              </div>
            ) : null}

            <div className="profitable-ranking-collapsible profitable-ranking-collapsible--advanced">
              <div className="ranking-filters-grid ranking-filters-grid--advanced">
                <label
                  className={`ranking-filter-field${
                    hasActivityRecencyFilter ? ' ranking-filter-field--active' : ''
                  }`}
                >
                  <span className="ranking-filter-label">Activity Recency</span>
                  <select
                    className={`search-hero-input ranking-filter-input${
                      hasActivityRecencyFilter ? ' ranking-filter-input--active' : ''
                    }`}
                    value={String(activityRecencyDays)}
                    onChange={(e) => {
                      triggerUpdate()
                      setActivityRecencyDays(Number(e.target.value || 0))
                    }}
                    aria-label="Activity recency filter"
                  >
                    <option value="0">Any</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last 12 months</option>
                  </select>
                </label>
              </div>
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

          {dataset ? (
            <div
              style={{
                margin: '6px 0 0',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Showing: {timeframeLabel}
            </div>
          ) : null}

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

        <div className="profitable-ranking-scroll">
          {dataset ? (
            <Table
              rows={sortedForDisplay}
              columns={activeTabConfig?.columns || []}
              sortState={
                sortByTab[activeTab] ||
                activeTabConfig?.defaultSort || { key: 'totalTrades', dir: 'desc' }
              }
              onSort={(colKey) => {
                deferAfterUpdate(() => setSort(activeTab, colKey))
              }}
              pageSize={pageSize}
              onPageSize={(n) => {
                deferAfterUpdate(() => {
                  setPageSize(n)
                  setPageByTab((p) => ({ ...p, [activeTab]: 1 }))
                })
              }}
              page={pageByTab[activeTab] || 1}
              onPage={(n) => {
                deferAfterUpdate(() => setPageByTab((p) => ({ ...p, [activeTab]: n })))
              }}
            />
          ) : (
            <div
              style={{
                padding: 14,
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
        </div>
      </div>
    </div>
  )
}
