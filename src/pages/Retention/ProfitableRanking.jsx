import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import KpiCard from '../../components/common/KpiCard'
import FullPageLoader from '../../components/FullPageLoader'
import SegmentJourneyModal from './SegmentJourneyModal'
import { getPublicShareOrigin } from '../../utils/publicShareOrigin'
import { buildTradersRankingRewardsDataset } from '../../utils/tradersRankingRewards'
import { buildRankingsV1 } from '../../utils/profitableRankingV1'
import {
  nodes as mostConsistentTradersNodes,
  edges as mostConsistentTradersEdges,
  meta as mostConsistentTradersMeta,
} from '../../flows/mostConsistentTradersFlow'
import {
  nodes as topPerformingTradersNodes,
  edges as topPerformingTradersEdges,
  meta as topPerformingTradersMeta,
} from '../../flows/topPerformingTradersFlow'
import {
  nodes as unfundedNewcomersNodes,
  edges as unfundedNewcomersEdges,
  meta as unfundedNewcomersMeta,
} from '../../flows/unfundedNewcomersFlow'

const JOURNEY_SEGMENT_KEYS = new Set(['top_performing', 'most_consistent', 'new_unfunded'])

function derivedStatusFormula(statusName) {
  const v = String(statusName || '')
    .trim()
    .toLowerCase()
  if (v === 'very active') return 'daysSinceLastTrade <= 7 AND Avg Trades / Month >= 20'
  if (v === 'active') return 'daysSinceLastTrade <= 30 AND Avg Trades / Month >= 5'
  if (v === 'dormant') return '30 < daysSinceLastTrade <= 90'
  if (v === 'inactive') {
    return 'totalTrades <= 0 OR missing last-trade date OR daysSinceLastTrade > 90'
  }
  return ''
}

function RankingSpecsModal({
  isOpen,
  onClose,
  rows,
  onShareTable,
  shareDisabled,
  standalone = false,
  embedded = false,
  onSegmentClick,
}) {
  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const safeRows = Array.isArray(rows) ? rows : []
  const unassignedRow = safeRows.find((row) => row.key === 'unassigned') || null
  const totalPopulation = safeRows.reduce((acc, row) => acc + Number(row?.memberCount || 0), 0)
  const unassignedCount = Number(unassignedRow?.memberCount || 0)
  const coveredCount = Math.max(0, totalPopulation - unassignedCount)
  const coveragePct = totalPopulation > 0 ? (coveredCount / totalPopulation) * 100 : 0

  const card = (
    <div
      className={`modal-card profitable-ranking-specs-modal${standalone ? ' profitable-ranking-specs-modal--standalone' : ''}${embedded ? ' profitable-ranking-specs-modal--embedded' : ''}`}
      role="dialog"
      aria-modal={standalone ? undefined : 'true'}
      aria-labelledby="ranking-specs-modal-title"
    >
      <div className="modal-header profitable-ranking-specs-modal__header">
        <div>
          <p className="page-label" style={{ marginBottom: 4 }}>
            Retention
          </p>
          <h2 id="ranking-specs-modal-title" style={{ margin: 0, fontSize: 22 }}>
            Exclusive Segment Specifications
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Priority-based exclusive assignment for Solitics retention campaigns.
          </p>
        </div>

        {!standalone ? (
          <button
            type="button"
            className="pill-tab"
            onClick={onClose}
            aria-label="Close ranking specifications"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="profitable-ranking-specs-kpis">
        <div className="profitable-ranking-specs-kpi">
          <span className="profitable-ranking-specs-kpi__label">Total population</span>
          <span className="profitable-ranking-specs-kpi__value">{fmtInt(totalPopulation)}</span>
        </div>
        <div className="profitable-ranking-specs-kpi profitable-ranking-specs-kpi--accent">
          <span className="profitable-ranking-specs-kpi__label">Coverage</span>
          <span className="profitable-ranking-specs-kpi__value">{fmtNum2(coveragePct)}%</span>
        </div>
        <div className="profitable-ranking-specs-kpi">
          <span className="profitable-ranking-specs-kpi__label">Unassigned</span>
          <span className="profitable-ranking-specs-kpi__value">{fmtInt(unassignedCount)}</span>
        </div>
      </div>

      <div className="profitable-ranking-specs-modal__table-wrap">
        <table className="profitable-ranking-specs-table">
          <thead>
            {typeof onShareTable === 'function' ? (
              <tr className="profitable-ranking-specs-table__share-row">
                <th colSpan={6}>
                  <div className="profitable-ranking-specs-table__share-inner">
                    <span className="profitable-ranking-specs-table__share-label">
                      Public sharing link for this table only
                    </span>
                    <button
                      type="button"
                      className="pill-tab ranking-share-btn"
                      onClick={onShareTable}
                      disabled={Boolean(shareDisabled)}
                      title="Open and copy the public link for this segment table"
                    >
                      Share Segment Table Link
                    </button>
                  </div>
                </th>
              </tr>
            ) : null}
            <tr>
              <th>Segment</th>
              <th>Description</th>
              <th>Activity Status</th>
              <th>Goal</th>
              <th>Exact Rules</th>
              <th>Members</th>
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row) => {
              const rowCount = Number(row?.memberCount || 0)
              const sharePct = totalPopulation > 0 ? (rowCount / totalPopulation) * 100 : 0
              const isUnassigned = row.key === 'unassigned'
              const rulesList = Array.isArray(row?.rulesList)
                ? row.rulesList
                : String(row?.rules || '')
                    .split(';')
                    .map((item) => item.trim())
                    .filter((item) => Boolean(item))
              const soliticsStatuses = Array.isArray(row?.statusBuckets?.soliticsStatuses)
                ? row.statusBuckets.soliticsStatuses
                : []
              const derivedStatuses = Array.isArray(row?.statusBuckets?.derivedStatuses)
                ? row.statusBuckets.derivedStatuses
                : []
              const activityStatuses = [
                ...soliticsStatuses.map((statusName) => ({ statusName, tone: 'solitics' })),
                ...derivedStatuses.map((statusName) => ({ statusName, tone: 'derived' })),
              ]
              const activityStatusFormulas = activityStatuses
                .map(({ statusName }) => derivedStatusFormula(statusName))
                .filter((formula) => Boolean(formula))
              const description = String(row?.description || '').trim()
              return (
                <tr
                  key={row.key}
                  className={
                    isUnassigned
                      ? 'profitable-ranking-specs-table__row--unassigned'
                      : row?.journeyEnabled
                        ? 'profitable-ranking-specs-table__row--clickable'
                        : ''
                  }
                >
                  <td>
                    <div className="profitable-ranking-specs-table__rank-cell">
                      {row?.journeyEnabled && typeof onSegmentClick === 'function' ? (
                        <button
                          type="button"
                          className="profitable-ranking-specs-table__rank-link"
                          onClick={() => onSegmentClick(row)}
                          title="Open journey"
                        >
                          {row.label}
                        </button>
                      ) : (
                        <div className="profitable-ranking-specs-table__rank-name">{row.label}</div>
                      )}
                      <div className="profitable-ranking-specs-table__meta-row">
                        <span className="profitable-ranking-specs-table__group-pill">
                          {row.group}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="profitable-ranking-specs-table__description">
                      {description || 'No description available.'}
                    </div>
                  </td>
                  <td>
                    <div className="profitable-ranking-specs-table__status-pills">
                      {activityStatuses.length ? (
                        activityStatuses.map(({ statusName, tone }) => (
                          <span
                            key={`${row.key}-${tone}-${statusName}`}
                            className={`profitable-ranking-specs-table__status-pill profitable-ranking-specs-table__status-pill--${tone}`}
                          >
                            {statusName}
                          </span>
                        ))
                      ) : (
                        <span className="profitable-ranking-specs-table__status-empty">None</span>
                      )}
                    </div>
                    {activityStatusFormulas.length ? (
                      <ul className="profitable-ranking-specs-table__status-formulas">
                        {activityStatusFormulas.map((formula, idx) => (
                          <li
                            key={`${row.key}-activity-formula-${idx}`}
                            className="profitable-ranking-specs-table__status-formula-item"
                          >
                            {formula}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                  <td>
                    <div className="profitable-ranking-specs-table__goal">{row.goal}</div>
                  </td>
                  <td>
                    <ul className="profitable-ranking-specs-table__rules-list">
                      {rulesList.map((rule, idx) => (
                        <li
                          key={`${row.key}-rule-${idx}`}
                          className="profitable-ranking-specs-table__rules-item"
                        >
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <div className="profitable-ranking-specs-table__members-cell">
                      <div className="profitable-ranking-specs-table__count">
                        {fmtInt(row.memberCount)}
                      </div>
                      <div className="profitable-ranking-specs-table__share">
                        {fmtNum2(sharePct)}%
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (standalone) {
    return <div className="profitable-ranking-specs-standalone">{card}</div>
  }

  if (embedded) {
    return <div className="profitable-ranking-specs-embedded">{card}</div>
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      {card}
    </div>
  )
}

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

const SOLITICS_NATIVE_STATUS_KEYS = new Set(['dormant'])

function statusLabelFromKey(key) {
  if (key === 'very_active') return 'Very Active'
  if (key === 'active') return 'Active'
  if (key === 'dormant') return 'Dormant'
  if (key === 'inactive') return 'Inactive'
  return String(key)
}

function buildStatusBuckets(statusKeys) {
  const keys = Array.isArray(statusKeys) ? statusKeys : []

  return {
    soliticsStatuses: keys
      .filter((key) => SOLITICS_NATIVE_STATUS_KEYS.has(key))
      .map((key) => statusLabelFromKey(key)),
    derivedStatuses: keys
      .filter((key) => !SOLITICS_NATIVE_STATUS_KEYS.has(key))
      .map((key) => statusLabelFromKey(key)),
  }
}

const EXCLUSIVE_SEGMENT_CONFIGS = [
  {
    key: 'top_performing',
    label: 'Top Performing Traders',
    group: 'Retention',
    priority: 1,
    goal: 'Protect and upsell profitable high-value traders.',
    description:
      'A trader with positive closed P/L, at least 50 total trades, and total deposits of at least EUR 1,000.',
    statusBuckets: buildStatusBuckets([]),
    rules: 'closedPL > 0; totalTrades >= 50; totalDeposit >= 1,000',
    rulesList: ['closedPL > 0', 'totalTrades >= 50', 'totalDeposit >= 1,000'],
    matches: ({ metric }) =>
      Number(metric?.closedPL || 0) > 0 &&
      Number(metric?.totalTrades || 0) >= 50 &&
      Number(metric?.totalDeposit || 0) >= 1000,
  },
  {
    key: 'reward_candidates',
    label: 'Reward Candidates',
    group: 'Retention',
    priority: 2,
    goal: 'Retain high-value engaged traders before churn risk increases.',
    description:
      'A high-value active or recently dormant trader with net deposited capital of at least EUR 3,000, at least 50 trades, and a last trade between 7 and 60 days ago.',
    statusBuckets: buildStatusBuckets(['active', 'dormant']),
    rules:
      'status IN (Active, Dormant); netDepositedCapital >= 3,000; totalTrades >= 50; 7 <= daysSinceLastTrade <= 60',
    rulesList: [
      'status IN (Active, Dormant)',
      'netDepositedCapital >= 3,000',
      'totalTrades >= 50',
      '7 <= daysSinceLastTrade <= 60',
    ],
    matches: ({ metric, statusKey }) => {
      const d = Number(metric?.recencyDays)
      const netDepositedCapital = Number(metric?.netDeposit || 0)
      return (
        (statusKey === 'active' || statusKey === 'dormant') &&
        netDepositedCapital >= 3000 &&
        Number(metric?.totalTrades || 0) >= 50 &&
        Number.isFinite(d) &&
        d >= 7 &&
        d <= 60
      )
    },
  },
  {
    key: 'most_active',
    label: 'Most Active Traders',
    group: 'Activation',
    priority: 3,
    goal: 'Target hyper-active traders for frequency-based campaigns.',
    description:
      'A very high-frequency trader with average activity of at least 100 trades per month and a last trade within the past 14 days.',
    statusBuckets: buildStatusBuckets(['very_active', 'active']),
    rules: 'status IN (Very Active, Active); avgTradesPerMonth >= 100; daysSinceLastTrade <= 14',
    rulesList: [
      'status IN (Very Active, Active)',
      'avgTradesPerMonth >= 100',
      'daysSinceLastTrade <= 14',
    ],
    matches: ({ metric, statusKey }) => {
      const d = Number(metric?.recencyDays)
      return (
        (statusKey === 'very_active' || statusKey === 'active') &&
        Number.isFinite(d) &&
        d <= 14 &&
        Number(metric?.tradesPerMonth || 0) >= 100
      )
    },
  },
  {
    key: 'most_consistent',
    label: 'Most Consistent Traders',
    group: 'Retention',
    priority: 4,
    goal: 'Nurture stable medium-high engagement behavior over time.',
    description:
      'A trader active for at least 3 months, averaging at least 30 trades per month, with a last trade within the past 60 days.',
    statusBuckets: buildStatusBuckets(['very_active', 'active', 'dormant']),
    rules:
      'status IN (Very Active, Active, Dormant); activeMonths >= 3; avgTradesPerMonth >= 30; daysSinceLastTrade <= 60',
    rulesList: [
      'status IN (Very Active, Active, Dormant)',
      'activeMonths >= 3',
      'avgTradesPerMonth >= 30',
      'daysSinceLastTrade <= 60',
    ],
    matches: ({ metric, statusKey }) => {
      const d = Number(metric?.recencyDays)
      return (
        (statusKey === 'very_active' || statusKey === 'active' || statusKey === 'dormant') &&
        Number(metric?.activeMonths || 0) >= 3 &&
        Number(metric?.tradesPerMonth || 0) >= 30 &&
        Number.isFinite(d) &&
        d <= 60
      )
    },
  },
  {
    key: 'rising',
    label: 'Rising Traders',
    group: 'Activation',
    priority: 5,
    goal: 'Accelerate onboarding momentum for early-stage active traders.',
    description:
      'An early-stage high-momentum trader active for up to 3 months, averaging at least 50 trades per month, with a last trade within the past 7 days.',
    statusBuckets: buildStatusBuckets(['very_active']),
    rules:
      'status IN (Very Active, Active); daysSinceLastTrade <= 7; avgTradesPerMonth >= 50; activeMonths <= 3',
    rulesList: [
      'status IN (Very Active, Active)',
      'daysSinceLastTrade <= 7',
      'avgTradesPerMonth >= 50',
      'activeMonths <= 3',
    ],
    matches: ({ metric, statusKey }) => {
      const d = Number(metric?.recencyDays)
      return (
        (statusKey === 'very_active' || statusKey === 'active') &&
        Number.isFinite(d) &&
        d <= 7 &&
        Number(metric?.tradesPerMonth || 0) >= 50 &&
        Number(metric?.activeMonths || 0) <= 3
      )
    },
  },
  {
    key: 'engaged_builders',
    label: 'Engaged Builders',
    group: 'Activation',
    priority: 6,
    goal: 'Grow medium-activity users toward top engagement tiers.',
    description:
      'A medium-activity trader with net deposited capital of at least EUR 1,000, averaging at least 15 trades per month, and a last trade within the past 45 days.',
    statusBuckets: buildStatusBuckets(['active', 'dormant']),
    rules:
      'status IN (Active, Dormant); avgTradesPerMonth >= 15; daysSinceLastTrade <= 45; netDepositedCapital >= 1,000',
    rulesList: [
      'status IN (Active, Dormant)',
      'avgTradesPerMonth >= 15',
      'daysSinceLastTrade <= 45',
      'netDepositedCapital >= 1,000',
    ],
    matches: ({ metric, statusKey }) => {
      const d = Number(metric?.recencyDays)
      return (
        (statusKey === 'active' || statusKey === 'dormant') &&
        Number(metric?.tradesPerMonth || 0) >= 15 &&
        Number.isFinite(d) &&
        d <= 45 &&
        Number(metric?.netDeposit || 0) >= 1000
      )
    },
  },
  {
    key: 'at_risk_value',
    label: 'At-Risk Value Traders',
    group: 'Winback',
    priority: 7,
    goal: 'Win back historically valuable traders with declining recency.',
    description:
      'A historically valuable trader with at least 30 total trades and net deposited capital of at least EUR 1,500, but no trade in the last 61 to 180 days.',
    statusBuckets: buildStatusBuckets(['dormant', 'inactive']),
    rules:
      'status IN (Dormant, Inactive); totalTrades >= 30; netDepositedCapital >= 1,500; 60 < daysSinceLastTrade <= 180',
    rulesList: [
      'status IN (Dormant, Inactive)',
      'totalTrades >= 30',
      'netDepositedCapital >= 1,500',
      '60 < daysSinceLastTrade <= 180',
    ],
    matches: ({ metric, statusKey }) => {
      const d = Number(metric?.recencyDays)
      return (
        (statusKey === 'dormant' || statusKey === 'inactive') &&
        Number(metric?.totalTrades || 0) >= 30 &&
        Number(metric?.netDeposit || 0) >= 1500 &&
        Number.isFinite(d) &&
        d > 60 &&
        d <= 180
      )
    },
  },
  {
    key: 'early_stage',
    label: 'Early-Stage Traders',
    group: 'Activation',
    priority: 8,
    goal: 'Onboard newer traders with activation and first-value journeys.',
    description:
      'A trader active for up to 3 months, with 5 to 49 total trades, total deposits of at least EUR 500, and a last trade within the past 30 days.',
    statusBuckets: buildStatusBuckets([]),
    rules:
      'activeMonths <= 3; totalTrades BETWEEN 5 AND 49; daysSinceLastTrade <= 30; totalDeposit >= 500',
    rulesList: [
      'activeMonths <= 3',
      '5 <= totalTrades <= 49',
      'daysSinceLastTrade <= 30',
      'totalDeposit >= 500',
    ],
    matches: ({ metric }) => {
      const d = Number(metric?.recencyDays)
      const trades = Number(metric?.totalTrades || 0)
      return (
        Number(metric?.activeMonths || 0) <= 3 &&
        trades >= 5 &&
        trades <= 49 &&
        Number.isFinite(d) &&
        d <= 30 &&
        Number(metric?.totalDeposit || 0) >= 500
      )
    },
  },
  {
    key: 'vip_whales',
    label: 'VIP Whales',
    group: 'Retention',
    priority: 9,
    goal: 'Protect top-value traders with dedicated VIP retention and concierge campaigns.',
    description:
      'A top-value trader with total deposits of at least EUR 10,000 or equity of at least EUR 10,000.',
    statusBuckets: buildStatusBuckets([]),
    rules: 'totalDeposit >= 10,000 OR equity >= 10,000',
    rulesList: ['totalDeposit >= 10,000 OR equity >= 10,000'],
    matches: ({ metric }) =>
      Number(metric?.totalDeposit || 0) >= 10000 || Number(metric?.equity || 0) >= 10000,
  },
  {
    key: 'churned_high_value',
    label: 'Churned High Value',
    group: 'Winback',
    priority: 10,
    goal: 'Recover high-value traders who have become inactive for a long period.',
    description:
      'A high-value trader with net deposited capital of at least EUR 1,000 who has not executed any trade in more than 90 days.',
    statusBuckets: buildStatusBuckets(['inactive']),
    rules: 'status = Inactive; daysSinceLastTrade > 90; netDepositedCapital >= 1,000',
    rulesList: ['status = Inactive', 'daysSinceLastTrade > 90', 'netDepositedCapital >= 1,000'],
    matches: ({ metric, statusKey }) => {
      const d = Number(metric?.recencyDays)
      return (
        (statusKey === 'inactive' || statusKey === 'dormant') &&
        Number.isFinite(d) &&
        d > 90 &&
        Number(metric?.netDeposit || 0) >= 1000
      )
    },
  },
  {
    key: 'dormant_value',
    label: 'Dormant Value Traders',
    group: 'Winback',
    priority: 11,
    goal: 'Reactivate recently dormant traders that still hold meaningful value.',
    description:
      'A trader with net deposited capital of at least EUR 500 who has not executed any trade in the last 31 to 90 days.',
    statusBuckets: buildStatusBuckets(['dormant']),
    rules: 'status = Dormant; 30 < daysSinceLastTrade <= 90; netDepositedCapital >= 500',
    rulesList: ['status = Dormant', '30 < daysSinceLastTrade <= 90', 'netDepositedCapital >= 500'],
    matches: ({ metric, statusKey }) => {
      const d = Number(metric?.recencyDays)
      return (
        statusKey === 'dormant' &&
        Number.isFinite(d) &&
        d > 30 &&
        d <= 90 &&
        Number(metric?.netDeposit || 0) >= 500
      )
    },
  },
  {
    key: 'high_volume_losing',
    label: 'High-Volume Losing Traders',
    group: 'Risk',
    priority: 12,
    goal: 'Reduce churn risk with education and risk-managed trading support.',
    description: 'A trader with at least 100 total trades and a negative closed P/L.',
    statusBuckets: buildStatusBuckets([]),
    rules: 'totalTrades >= 100; closedPL < 0',
    rulesList: ['totalTrades >= 100', 'closedPL < 0'],
    matches: ({ metric }) =>
      Number(metric?.totalTrades || 0) >= 100 && Number(metric?.closedPL || 0) < 0,
  },
  {
    key: 'funded_no_trade',
    label: 'Funded, No Trade',
    group: 'Activation',
    priority: 13,
    goal: 'Convert funded accounts that never executed their first trade.',
    description: 'A funded trader who has deposited money but has not executed any trade.',
    statusBuckets: buildStatusBuckets(['inactive']),
    rules: 'totalDeposit > 0; totalTrades <= 0',
    rulesList: ['totalDeposit > 0', 'totalTrades <= 0'],
    matches: ({ metric }) =>
      Number(metric?.totalDeposit || 0) > 0 && Number(metric?.totalTrades || 0) <= 0,
  },
  {
    key: 'promising_mid',
    label: 'Promising Mid-Tier',
    group: 'Activation',
    priority: 14,
    goal: 'Scale medium-engagement traders toward high-value retention cohorts.',
    description:
      'A mid-tier trader with 10 to 49 total trades, net deposited capital of at least EUR 300, and a last trade within the past 45 days.',
    statusBuckets: buildStatusBuckets(['active', 'dormant']),
    rules: '10 <= totalTrades <= 49; daysSinceLastTrade <= 45; netDepositedCapital >= 300',
    rulesList: [
      '10 <= totalTrades <= 49',
      'daysSinceLastTrade <= 45',
      'netDepositedCapital >= 300',
    ],
    matches: ({ metric }) => {
      const d = Number(metric?.recencyDays)
      const trades = Number(metric?.totalTrades || 0)
      return (
        trades >= 10 &&
        trades <= 49 &&
        Number.isFinite(d) &&
        d <= 45 &&
        Number(metric?.netDeposit || 0) >= 300
      )
    },
  },
  {
    key: 'onboarding_light',
    label: 'Onboarding Light',
    group: 'Activation',
    priority: 15,
    goal: 'Increase early frequency for recently activated low-trade users.',
    description:
      'A recently activated trader with 1 to 9 total trades and a last trade within the past 30 days.',
    statusBuckets: buildStatusBuckets(['very_active', 'active', 'dormant']),
    rules: '1 <= totalTrades <= 9; daysSinceLastTrade <= 30',
    rulesList: ['1 <= totalTrades <= 9', 'daysSinceLastTrade <= 30'],
    matches: ({ metric }) => {
      const d = Number(metric?.recencyDays)
      const trades = Number(metric?.totalTrades || 0)
      return trades >= 1 && trades <= 9 && Number.isFinite(d) && d <= 30
    },
  },
  {
    key: 'new_unfunded',
    label: 'Unfunded Newcomers',
    group: 'Acquisition',
    priority: 16,
    goal: 'Convert newly registered accounts into first-time depositors quickly.',
    description: 'A newly registered account with no deposits and no trades recorded yet.',
    statusBuckets: buildStatusBuckets(['inactive']),
    rules: 'totalDeposit <= 0; totalTrades <= 0',
    rulesList: ['totalDeposit <= 0', 'totalTrades <= 0'],
    matches: ({ metric }) =>
      Number(metric?.totalDeposit || 0) <= 0 && Number(metric?.totalTrades || 0) <= 0,
  },
  {
    key: 'dormant_low',
    label: 'Dormant Low',
    group: 'Winback',
    priority: 17,
    goal: 'Re-engage low-value dormant traders before they become long-term inactive.',
    description:
      'A trader who has deposited less than or equal to EUR 499 and traded at least 3 times, but has not executed any trade in the last 31 to 120 days.',
    statusBuckets: buildStatusBuckets(['dormant', 'inactive']),
    rules:
      '31 < daysSinceLastTrade <= 120; totalTrades >= 3; totalDeposit > 0; totalDeposit <= 499',
    rulesList: [
      '31 < daysSinceLastTrade <= 120',
      'totalTrades >= 3',
      'totalDeposit > 0',
      'totalDeposit <= 499',
    ],
    matches: ({ metric }) => {
      const d = Number(metric?.recencyDays)
      return (
        Number.isFinite(d) &&
        d > 30 &&
        d <= 120 &&
        Number(metric?.totalTrades || 0) >= 3 &&
        Number(metric?.totalDeposit || 0) > 0 &&
        Number(metric?.totalDeposit || 0) <= 499
      )
    },
  },
  {
    key: 'dormant_mid',
    label: 'Dormant Mid',
    group: 'Winback',
    priority: 18,
    goal: 'Reactivate medium-value dormant traders with focused winback campaigns.',
    description:
      'A trader who has deposited between EUR 500 and EUR 1,999 and traded at least 3 times, but has not executed any trade in the last 31 to 120 days.',
    statusBuckets: buildStatusBuckets(['dormant', 'inactive']),
    rules: '31 < daysSinceLastTrade <= 120; totalTrades >= 3; 500 <= totalDeposit < 2,000',
    rulesList: [
      '31 < daysSinceLastTrade <= 120',
      'totalTrades >= 3',
      'totalDeposit >= 500',
      'totalDeposit < 2,000',
    ],
    matches: ({ metric }) => {
      const d = Number(metric?.recencyDays)
      return (
        Number.isFinite(d) &&
        d > 30 &&
        d <= 120 &&
        Number(metric?.totalTrades || 0) >= 3 &&
        Number(metric?.totalDeposit || 0) >= 500 &&
        Number(metric?.totalDeposit || 0) < 2000
      )
    },
  },
]

export default function ProfitableRanking({
  publicMode = false,
  initialState = null,
  segmentsOnly = false,
} = {}) {
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
  const [timeframe, setTimeframe] = useState('all')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonthKey, setSelectedMonthKey] = useState('')

  const loadReqRef = useRef(0)
  const loadFromConsoleArtifact = useCallback(async ({ silent = false } = {}) => {
    const reqId = (loadReqRef.current = loadReqRef.current + 1)

    if (!silent) setError('')
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
      if (loadReqRef.current !== reqId) return

      setFileName('Traders Ranking Rewards.xlsx (auto)')
      setArtifact({ rows, headers })
    } catch (e) {
      if (!silent) {
        const msg = String(e?.message || '').trim() || 'Refresh failed'
        setError(msg)
      }
    } finally {
      if (loadReqRef.current === reqId) setLoading(false)
    }
  }, [])

  // Auto-load from console artifacts (generated from Creolabs XLSX) when available.
  // Browser apps cannot read arbitrary local project folders; fetching from `public/` is the safe way.
  useEffect(() => {
    const tryAutoLoad = async () => {
      await loadFromConsoleArtifact({ silent: true })
    }

    // Only auto-load if nothing is loaded yet.
    if (!artifact) tryAutoLoad()
    return () => {
      // no-op
    }
  }, [artifact, loadFromConsoleArtifact])

  const todayRef = useRef(null)
  if (!todayRef.current) todayRef.current = new Date()

  const publicSegmentsStandalone = useMemo(() => {
    if (!publicMode) return false

    const fromSharedState = String(initialState?.sv || '').toLowerCase() === 'segments'
    if (fromSharedState) return true

    if (typeof window === 'undefined') return false
    const view = new window.URLSearchParams(window.location.search).get('view')
    return String(view || '').toLowerCase() === 'segments'
  }, [initialState?.sv, publicMode])

  useEffect(() => {
    if (segmentsOnly || publicSegmentsStandalone) return undefined

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
  }, [publicSegmentsStandalone, segmentsOnly])

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
  const [selectedSegmentForJourney, setSelectedSegmentForJourney] = useState(null)
  const [showSegmentJourneyModal, setShowSegmentJourneyModal] = useState(false)

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

  const onShareSegmentsTable = async () => {
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
        sv: 'segments',
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

    // Always use the full profitable-ranking share route here so `view=segments`
    // is preserved end-to-end without depending on short-link redirect behavior.
    const hrefBase = `${shareOrigin}/share/profitable-ranking/${encodeURIComponent(token)}`

    let href = hrefBase
    try {
      const u = new URL(hrefBase)
      u.searchParams.set('view', 'segments')
      href = u.toString()
    } catch {
      href = `${hrefBase}${hrefBase.includes('?') ? '&' : '?'}view=segments`
    }

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

  const rankingSpecsRows = useMemo(() => {
    const metrics = Array.isArray(v1?.metrics) ? v1.metrics : []
    const allClientIds = new Set(
      metrics
        .map((metric) => String(metric?.clientId || '').trim())
        .filter((clientId) => Boolean(clientId))
    )
    const assignedClientIds = new Set()

    const rows = EXCLUSIVE_SEGMENT_CONFIGS.map((segment) => {
      let memberCount = 0

      for (const metric of metrics) {
        const clientId = String(metric?.clientId || '').trim()
        if (!clientId || assignedClientIds.has(clientId)) continue

        const daysSinceLastTrade = computeDaysSinceLastTrade(metric)
        const status = classifyActivityStatus({
          totalTrades: metric?.totalTrades,
          tradesPerMonth: metric?.tradesPerMonth,
          daysSinceLastTrade,
        })

        if (!segment.matches({ metric, statusKey: status.statusKey, daysSinceLastTrade })) continue
        assignedClientIds.add(clientId)
        memberCount += 1
      }

      return {
        key: segment.key,
        label: segment.label,
        group: segment.group,
        priority: segment.priority,
        goal: segment.goal,
        description: segment.description,
        journeyEnabled: JOURNEY_SEGMENT_KEYS.has(segment.key),
        statusBuckets: segment.statusBuckets,
        rules: segment.rules,
        rulesList: segment.rulesList,
        memberCount,
      }
    })

    const unassignedCount = Math.max(0, allClientIds.size - assignedClientIds.size)
    const priorityRangeText = `NOT matched by priorities 1-${EXCLUSIVE_SEGMENT_CONFIGS.length}`
    rows.push({
      key: 'unassigned',
      label: 'Unassigned',
      group: 'Coverage Gap',
      priority: 'N/A',
      goal: 'Identify traders not covered by current Solitics retention segments.',
      description:
        'A trader who is not captured by any of the current segment rules and may require a new segment definition.',
      journeyEnabled: false,
      statusBuckets: buildStatusBuckets([]),
      rules: priorityRangeText,
      rulesList: [priorityRangeText],
      memberCount: unassignedCount,
    })

    const unassignedRow = rows.find((row) => row.key === 'unassigned') || null
    const assignedRows = rows
      .filter((row) => row.key !== 'unassigned')
      .sort((a, b) => {
        const diff = Number(b?.memberCount || 0) - Number(a?.memberCount || 0)
        if (diff !== 0) return diff
        return String(a?.label || '').localeCompare(String(b?.label || ''))
      })

    return unassignedRow ? [...assignedRows, unassignedRow] : assignedRows
  }, [v1?.metrics])

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

  // Map segment keys to flow data
  const segmentFlowMap = useMemo(
    () => ({
      top_performing: {
        nodes: topPerformingTradersNodes,
        edges: topPerformingTradersEdges,
        meta: topPerformingTradersMeta,
      },
      most_consistent: {
        nodes: mostConsistentTradersNodes,
        edges: mostConsistentTradersEdges,
        meta: mostConsistentTradersMeta,
      },
      new_unfunded: {
        nodes: unfundedNewcomersNodes,
        edges: unfundedNewcomersEdges,
        meta: unfundedNewcomersMeta,
      },
    }),
    []
  )

  const handleSegmentClick = (segment) => {
    setSelectedSegmentForJourney(segment)
    setShowSegmentJourneyModal(true)
  }

  const selectedSegmentFlowData = useMemo(() => {
    if (!selectedSegmentForJourney) return null
    const flowData = segmentFlowMap?.[selectedSegmentForJourney?.key]
    return flowData || null
  }, [selectedSegmentForJourney, segmentFlowMap])

  if (publicSegmentsStandalone) {
    return (
      <RankingSpecsModal
        isOpen
        onClose={null}
        rows={rankingSpecsRows}
        onShareTable={null}
        shareDisabled
        standalone
        onSegmentClick={handleSegmentClick}
      />
    )
  }

  if (segmentsOnly) {
    return (
      <div
        ref={rootRef}
        className="page-shell profitable-ranking-page profitable-ranking-segments-page"
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

        <header className="page-header ranking-header" style={{ alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>
              <p className="page-label">Customer Base</p>
              <h1 className="page-title">Segment Composition</h1>
              <p className="page-subtitle">
                Dedicated customer-base segmentation view for retention and winback planning.
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

              <button
                type="button"
                className="pill-tab"
                onClick={onShareSegmentsTable}
                disabled={loading || !dataset}
                title="Open the public share page for Segment Composition"
              >
                Share Public Page
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 8,
              minWidth: 'min(440px, 100%)',
            }}
          >
            <KpiCard label="Total Traders" value={fmtInt(kpis.count)} size="sm" density="compact" />
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

        {dataset ? (
          <RankingSpecsModal
            isOpen
            onClose={null}
            rows={rankingSpecsRows}
            onShareTable={null}
            shareDisabled={publicMode || loading || !dataset}
            standalone
            onSegmentClick={handleSegmentClick}
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

        <SegmentJourneyModal
          isOpen={showSegmentJourneyModal}
          onClose={() => {
            setShowSegmentJourneyModal(false)
            setSelectedSegmentForJourney(null)
          }}
          segment={selectedSegmentForJourney}
          flowData={selectedSegmentFlowData}
        />
      </div>
    )
  }

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
            <>
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
            </>
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

      <SegmentJourneyModal
        isOpen={showSegmentJourneyModal}
        onClose={() => {
          setShowSegmentJourneyModal(false)
          setSelectedSegmentForJourney(null)
        }}
        segment={selectedSegmentForJourney}
        flowData={selectedSegmentFlowData}
      />
    </div>
  )
}
