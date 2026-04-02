/**
 * All-time segment counts script
 * Mirrors EXCLUSIVE_SEGMENT_CONFIGS logic from ProfitableRanking.jsx
 * Uses the same field names as computeClientMetricsV1 in profitableRankingV1.js
 *
 * JSON row fields → metric fields:
 *   r.deposit     → totalDeposit
 *   r.net         → netDeposit
 *   r.closed_pl   → closedPL
 *   r.trades      → totalTrades
 *   r.equity      → equity
 *   r.ltt_date    → lastTradeDate (for recencyDays)
 *   r.active_months → activeMonths
 *   r.trades_per_month → tradesPerMonth
 *   r.status      → raw status string → statusKey
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataPath = join(__dirname, '..', 'public', 'traders_ranking_rewards_table.json')
console.log('Reading data from:', dataPath)

const parsed = JSON.parse(readFileSync(dataPath, 'utf8'))
const raw = Array.isArray(parsed) ? parsed : (parsed.rows || parsed.data || parsed.records || [])
console.log(`Total rows: ${raw.length}`)

const TODAY = new Date()

function daysSince(dateStr) {
  if (!dateStr || dateStr === '-') return Infinity
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return Infinity
  return Math.floor((TODAY - d) / (1000 * 60 * 60 * 24))
}

function statusKey(statusStr) {
  const s = String(statusStr || '').toLowerCase().replace(/\s+/g, '_')
  if (s === 'very_active' || s === 'veryactive' || s.includes('very')) return 'very_active'
  if (s === 'active') return 'active'
  if (s === 'dormant') return 'dormant'
  if (s === 'inactive') return 'inactive'
  return 'inactive' // fallback
}

// Aggregate rows by client (latest row per client)
const clientMap = new Map()
for (const r of raw) {
  const id = r.client_id || r.id || r.login || r.email
  if (!id) continue
  const existing = clientMap.get(id)
  // Keep the row with the most recent ltt_date (or any row if first)
  if (!existing) {
    clientMap.set(id, r)
  } else {
    // aggregate: sum deposits/trades across all rows, max equity, latest trade date
    const existingDate = existing._lastDate || new Date(existing.ltt_date || 0)
    const rowDate = new Date(r.ltt_date || 0)
    clientMap.set(id, {
      ...existing,
      deposit: (Number(existing.deposit) || 0) + (Number(r.deposit) || 0),
      net: (Number(existing.net) || 0) + (Number(r.net) || 0),
      closed_pl: (Number(existing.closed_pl) || 0) + (Number(r.closed_pl) || 0),
      trades: (Number(existing.trades) || 0) + (Number(r.trades) || 0),
      equity: Math.max(Number(existing.equity) || 0, Number(r.equity) || 0),
      active_months: Math.max(Number(existing.active_months) || 0, Number(r.active_months) || 0),
      trades_per_month: Math.max(Number(existing.trades_per_month) || 0, Number(r.trades_per_month) || 0),
      ltt_date: rowDate > existingDate ? r.ltt_date : existing.ltt_date,
      status: rowDate > existingDate ? r.status : existing.status,
      _lastDate: rowDate > existingDate ? rowDate : existingDate,
    })
  }
}

const clients = Array.from(clientMap.values())
console.log(`Unique clients: ${clients.length}`)

// Build metric object from aggregated row
function buildMetric(r) {
  return {
    totalDeposit: Number(r.deposit) || 0,
    netDeposit: Number(r.net) || 0,
    closedPL: Number(r.closed_pl) || 0,
    totalTrades: Number(r.trades) || 0,
    equity: Number(r.equity) || 0,
    activeMonths: Number(r.active_months) || 0,
    tradesPerMonth: Number(r.trades_per_month) || 0,
    recencyDays: daysSince(r.ltt_date),
  }
}

// Status thresholds (from profitableRankingV1.js)
function computeStatus(metric) {
  const d = metric.recencyDays
  const t = metric.totalTrades
  if (!isFinite(d) || d > 90) {
    if (t === 0) return 'inactive'
    return 'inactive'
  }
  if (d > 30) return 'dormant'
  if (metric.tradesPerMonth >= 100) return 'very_active'
  if (t >= 1) return 'active'
  return 'inactive'
}

// EXCLUSIVE_SEGMENT_CONFIGS - mirrors the JSX exactly
const SEGMENTS = [
  {
    key: 'top_performing',
    label: 'Top Performing Traders',
    priority: 1,
    matches: ({ metric }) =>
      metric.closedPL > 0 && metric.totalTrades >= 50 && metric.totalDeposit >= 1000,
  },
  {
    key: 'reward_candidates',
    label: 'Reward Candidates',
    priority: 2,
    matches: ({ metric, sk }) => {
      const d = metric.recencyDays
      return (
        (sk === 'active' || sk === 'dormant') &&
        metric.netDeposit >= 3000 &&
        metric.totalTrades >= 50 &&
        isFinite(d) && d >= 7 && d <= 60
      )
    },
  },
  {
    key: 'most_active',
    label: 'Most Active Traders',
    priority: 3,
    matches: ({ metric, sk }) => {
      const d = metric.recencyDays
      return (
        (sk === 'very_active' || sk === 'active') &&
        isFinite(d) && d <= 14 &&
        metric.tradesPerMonth >= 100
      )
    },
  },
  {
    key: 'most_consistent',
    label: 'Most Consistent Traders',
    priority: 4,
    matches: ({ metric, sk }) => {
      const d = metric.recencyDays
      return (
        (sk === 'very_active' || sk === 'active' || sk === 'dormant') &&
        metric.activeMonths >= 3 &&
        metric.tradesPerMonth >= 30 &&
        isFinite(d) && d <= 60
      )
    },
  },
  {
    key: 'rising',
    label: 'Rising Traders',
    priority: 5,
    matches: ({ metric, sk }) => {
      const d = metric.recencyDays
      return (
        (sk === 'very_active' || sk === 'active') &&
        isFinite(d) && d <= 7 &&
        metric.tradesPerMonth >= 50 &&
        metric.activeMonths <= 3
      )
    },
  },
  {
    key: 'engaged_builders',
    label: 'Engaged Builders',
    priority: 6,
    matches: ({ metric, sk }) => {
      const d = metric.recencyDays
      return (
        (sk === 'active' || sk === 'dormant') &&
        metric.tradesPerMonth >= 15 &&
        isFinite(d) && d <= 45 &&
        metric.netDeposit >= 1000
      )
    },
  },
  {
    key: 'at_risk_value',
    label: 'At-Risk Value Traders',
    priority: 7,
    matches: ({ metric, sk }) => {
      const d = metric.recencyDays
      return (
        (sk === 'dormant' || sk === 'inactive') &&
        metric.totalTrades >= 30 &&
        metric.netDeposit >= 1500 &&
        isFinite(d) && d > 60 && d <= 180
      )
    },
  },
  {
    key: 'early_stage',
    label: 'Early-Stage Traders',
    priority: 8,
    matches: ({ metric }) => {
      const d = metric.recencyDays
      const t = metric.totalTrades
      return (
        metric.activeMonths <= 3 &&
        t >= 5 && t <= 49 &&
        isFinite(d) && d <= 30 &&
        metric.totalDeposit >= 500
      )
    },
  },
  {
    key: 'vip_whales',
    label: 'VIP Whales',
    priority: 9,
    matches: ({ metric }) =>
      metric.totalDeposit >= 10000 || metric.equity >= 10000,
  },
  {
    key: 'churned_high_value',
    label: 'Churned High Value',
    priority: 10,
    matches: ({ metric, sk }) => {
      const d = metric.recencyDays
      return (
        (sk === 'inactive' || sk === 'dormant') &&
        isFinite(d) && d > 90 &&
        metric.netDeposit >= 1000
      )
    },
  },
  {
    key: 'dormant_value',
    label: 'Dormant Value Traders',
    priority: 11,
    matches: ({ metric, sk }) => {
      const d = metric.recencyDays
      return (
        sk === 'dormant' &&
        isFinite(d) && d > 30 && d <= 90 &&
        metric.netDeposit >= 500
      )
    },
  },
  {
    key: 'high_volume_losing',
    label: 'High-Volume Losing Traders',
    priority: 12,
    matches: ({ metric }) =>
      metric.totalTrades >= 100 && metric.closedPL < 0,
  },
  {
    key: 'funded_no_trade',
    label: 'Funded, No Trade',
    priority: 13,
    matches: ({ metric }) =>
      metric.totalDeposit > 0 && metric.totalTrades <= 0,
  },
  {
    key: 'promising_mid',
    label: 'Promising Mid-Tier',
    priority: 14,
    matches: ({ metric }) => {
      const d = metric.recencyDays
      const t = metric.totalTrades
      return t >= 10 && t <= 49 && isFinite(d) && d <= 45 && metric.netDeposit >= 300
    },
  },
  {
    key: 'onboarding_light',
    label: 'Onboarding Light',
    priority: 15,
    matches: ({ metric }) => {
      const d = metric.recencyDays
      const t = metric.totalTrades
      return t >= 1 && t <= 9 && isFinite(d) && d <= 30
    },
  },
  {
    key: 'new_unfunded',
    label: 'New Unfunded',
    priority: 16,
    matches: ({ metric }) =>
      metric.totalDeposit <= 0 && metric.totalTrades <= 0,
  },
]

// Count per segment (exclusive: first match wins)
const counts = Object.fromEntries(SEGMENTS.map(s => [s.key, 0]))
let unassigned = 0
const total = clients.length

for (const r of clients) {
  const metric = buildMetric(r)
  const sk = computeStatus(metric)
  let matched = false
  for (const seg of SEGMENTS) {
    if (seg.matches({ metric, sk })) {
      counts[seg.key]++
      matched = true
      break
    }
  }
  if (!matched) unassigned++
}

// Print results
console.log('\n=== ALL-TIME SEGMENT COUNTS ===\n')
console.log(`${'Priority'.padEnd(10)} ${'Key'.padEnd(25)} ${'Label'.padEnd(35)} ${'Count'.padEnd(8)} %CB`)
console.log('-'.repeat(100))
for (const seg of SEGMENTS) {
  const n = counts[seg.key]
  const pct = ((n / total) * 100).toFixed(2)
  console.log(`${String(seg.priority).padEnd(10)} ${seg.key.padEnd(25)} ${seg.label.padEnd(35)} ${String(n).padEnd(8)} ${pct}%`)
}
console.log('-'.repeat(100))
const assignedTotal = total - unassigned
const assignedPct = ((assignedTotal / total) * 100).toFixed(2)
const unassignedPct = ((unassigned / total) * 100).toFixed(2)
console.log(`${''.padEnd(10)} ${'unassigned'.padEnd(25)} ${'Unassigned'.padEnd(35)} ${String(unassigned).padEnd(8)} ${unassignedPct}%`)
console.log(`${''.padEnd(10)} ${'TOTAL'.padEnd(25)} ${'Assigned'.padEnd(35)} ${String(assignedTotal).padEnd(8)} ${assignedPct}%`)
console.log(`${''.padEnd(10)} ${'TOTAL'.padEnd(25)} ${'Grand Total (CB)'.padEnd(35)} ${String(total).padEnd(8)} 100.00%`)
