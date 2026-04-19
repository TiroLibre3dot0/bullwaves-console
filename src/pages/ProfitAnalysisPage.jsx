import { useEffect, useMemo, useState } from 'react'
import KpiCard from '../components/profit/KpiCard'
import FullPageLoader from '../components/FullPageLoader'
import PnLTrendChart from '../components/PnLTrendChart'
import { useI18n } from '../i18n/I18nContext'
import { fetchFirstOkCsvRowsCached, fetchTextCached, withReportsVersion } from '../lib/fetchCache'
import { track } from '../utils/analytics'

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const numberFmt = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const FILTER_SOURCE_VALUES = ['both', 'creolabs', 'cellxpert']

// Current (partial) month — excluded by default, but can be included from the UI
const NOW_MONTH_KEY = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})()

const KPI_CONFIG = [
  { key: 'registrations', label: 'Registrations', kind: 'count', tone: '#8b5cf6' },
  { key: 'activeUsers', label: 'Active Traders (>0 Trades)', kind: 'count', tone: '#22c55e' },
  { key: 'ftdAmount', label: 'FTD Amount', kind: 'money', tone: '#f59e0b' },
  { key: 'ftdCount', label: 'FTD Count', kind: 'count', tone: '#fbbf24' },
  { key: 'deposits', label: 'Deposits', kind: 'money', tone: '#38bdf8' },
  { key: 'withdrawals', label: 'Withdrawals', kind: 'money', tone: '#f43f5e' },
  { key: 'withdrawalCount', label: 'Number of Withdrawals', kind: 'count', tone: '#fb7185' },
  { key: 'netDeposits', label: 'Net Deposits', kind: 'money', tone: '#22d3ee' },
  { key: 'churn60', label: 'Churners (60d)', kind: 'count', tone: '#f59e0b' },
]
const FILTER_KPI_VALUES = ['all', ...KPI_CONFIG.map((k) => k.key)]

const EMPTY_METRIC = {
  registrations: null,
  activeUsers: null,
  churn60: null,
  ftdAmount: null,
  ftdCount: null,
  qftd: null,
  deposits: null,
  depositCount: null,
  withdrawals: null,
  withdrawalCount: null,
  netDeposits: null,
}

function cleanNumber(value) {
  if (value === null || value === undefined) return 0
  const str = String(value).replace(/[$,]/g, '').trim()
  if (!str || str === '-') return 0
  const num = Number(str)
  return Number.isFinite(num) ? num : 0
}

function parseMediaMonth(raw) {
  const s = String(raw || '').trim()
  const m = /^(\d{1,2})\/(\d{4})$/.exec(s)
  if (!m) return null
  const month = Number(m[1])
  const year = Number(m[2])
  if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) return null
  const key = `${year}-${String(month).padStart(2, '0')}`
  return { key, year, month, label: `${monthNames[month - 1]} ${year}` }
}

function parseTradersYearMonth(raw) {
  const s = String(raw || '').trim()
  const m = /^(\d{4})-([A-Za-z]{3})$/.exec(s)
  if (!m) return null
  const year = Number(m[1])
  const idx = monthNames.findIndex((x) => x.toLowerCase() === m[2].toLowerCase())
  if (!Number.isFinite(year) || idx < 0) return null
  const month = idx + 1
  const key = `${year}-${String(month).padStart(2, '0')}`
  return { key, year, month, label: `${monthNames[idx]} ${year}` }
}

function parseDateToMonthKey(raw) {
  const s = String(raw || '').trim()
  if (!s || s === '-' || s === '—') return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth() + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

function parseDateValue(raw) {
  const s = String(raw || '').trim()
  if (!s || s === '-' || s === '—') return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function addDaysUTC(date, days) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  const d = new Date(date.getTime())
  d.setUTCDate(d.getUTCDate() + Number(days || 0))
  return d
}

function monthToIndex(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(key || ''))
  if (!m) return Number.NEGATIVE_INFINITY
  return Number(m[1]) * 12 + (Number(m[2]) - 1)
}

function formatShort(value) {
  const num = Number(value || 0)
  const abs = Math.abs(num)
  if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (abs >= 1000) return `${(num / 1000).toFixed(1)}k`
  return numberFmt.format(Math.round(num))
}

function formatMetricValue(value, kind) {
  const num = Number(value || 0)
  if (kind === 'money') return `${formatShort(num)} €`
  return numberFmt.format(Math.round(num))
}

function pctChange(current, previous) {
  const c = Number(current || 0)
  const p = Number(previous || 0)
  if (p === 0) return c === 0 ? 0 : null
  return ((c - p) / Math.abs(p)) * 100
}

function formatPct(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return 'n/a'
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function pctTone(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return '#94a3b8'
  if (pct > 0) return '#22c55e'
  if (pct < 0) return '#f43f5e'
  return '#e2e8f0'
}

function monthKeyToLabel(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(key || ''))
  if (!m) return String(key || 'n/a')
  const year = Number(m[1])
  const month = Number(m[2])
  return `${monthNames[month - 1] || 'M'} ${year}`
}

function monthRangeLabel(keys) {
  if (!keys || !keys.length) return 'n/a'
  if (keys.length === 1) return monthKeyToLabel(keys[0])
  return `${monthKeyToLabel(keys[0])} - ${monthKeyToLabel(keys[keys.length - 1])}`
}

function normalizeJsonRows(payload) {
  const headers = Array.isArray(payload?.headers) ? payload.headers : []
  const rows = Array.isArray(payload?.rows) ? payload.rows : []

  if (!rows.length) return []
  if (!Array.isArray(rows[0])) return rows
  if (!headers.length) return []

  return rows.map((row) => {
    const obj = {}
    headers.forEach((header, idx) => {
      obj[String(header || '').trim()] = row[idx]
    })
    return obj
  })
}

function buildComparisonEntry({ current, previous, currentLabel, previousLabel }) {
  return {
    pct: pctChange(current, previous),
    current,
    previous,
    currentLabel,
    previousLabel,
  }
}

function readFiltersFromUrl() {
  try {
    const params = new window.URLSearchParams(window.location.search || '')
    const source = String(params.get('source') || '').trim()
    const kpi = String(params.get('kpi') || '').trim()
    const normalizedSource = source === 'combined' ? 'both' : source
    const includeCurrentMonth = ['1', 'true', 'yes'].includes(
      String(params.get('includeCurrentMonth') || '')
        .trim()
        .toLowerCase()
    )
    return {
      timeRange: 'last24',
      sourceMode: FILTER_SOURCE_VALUES.includes(normalizedSource) ? normalizedSource : 'both',
      selectedKpi: FILTER_KPI_VALUES.includes(kpi) ? kpi : 'all',
      includeCurrentMonth,
    }
  } catch {
    return {
      timeRange: 'last24',
      sourceMode: 'both',
      selectedKpi: 'all',
      includeCurrentMonth: false,
    }
  }
}

function getPeriodRange(keysSorted, mode) {
  if (!keysSorted.length) return []
  if (mode === 'all') return keysSorted

  const latest = keysSorted[keysSorted.length - 1]
  const latestIdx = monthToIndex(latest)
  const latestYear = Number(latest.slice(0, 4))

  if (mode === 'last12') {
    return keysSorted.filter((k) => monthToIndex(k) >= latestIdx - 11)
  }
  if (mode === 'last24') {
    return keysSorted.filter((k) => monthToIndex(k) >= latestIdx - 23)
  }
  if (mode === 'ytd') {
    return keysSorted.filter((k) => Number(k.slice(0, 4)) === latestYear)
  }
  if (mode === 'currentYear') {
    return keysSorted.filter((k) => Number(k.slice(0, 4)) === latestYear)
  }
  return keysSorted
}

function sumRange(monthMap, metric, keys) {
  return keys.reduce((acc, key) => acc + Number(monthMap[key]?.[metric] || 0), 0)
}

function buildComparisons({ keysInScope, allKeys, monthMap, metric }) {
  if (!keysInScope.length) {
    return {
      ytd: buildComparisonEntry({
        current: 0,
        previous: 0,
        currentLabel: 'n/a',
        previousLabel: 'n/a',
      }),
      mom: buildComparisonEntry({
        current: 0,
        previous: 0,
        currentLabel: 'n/a',
        previousLabel: 'n/a',
      }),
      yoy: buildComparisonEntry({
        current: 0,
        previous: 0,
        currentLabel: 'n/a',
        previousLabel: 'n/a',
      }),
      qoq: buildComparisonEntry({
        current: 0,
        previous: 0,
        currentLabel: 'n/a',
        previousLabel: 'n/a',
      }),
      halfYear: buildComparisonEntry({
        current: 0,
        previous: 0,
        currentLabel: 'n/a',
        previousLabel: 'n/a',
      }),
      latestValue: 0,
      latestMonth: null,
    }
  }

  const latest = keysInScope[keysInScope.length - 1]
  const latestIdx = monthToIndex(latest)
  const latestYear = Number(latest.slice(0, 4))
  const latestMonth = Number(latest.slice(5, 7))

  const latestValue = Number(monthMap[latest]?.[metric] || 0)
  const prevMonthKey = allKeys.find((k) => monthToIndex(k) === latestIdx - 1)
  const sameMonthPrevYear = allKeys.find((k) => monthToIndex(k) === latestIdx - 12)

  const ytdKeysCurrent = allKeys.filter((k) => {
    const y = Number(k.slice(0, 4))
    const m = Number(k.slice(5, 7))
    return y === latestYear && m <= latestMonth
  })
  const ytdKeysPrev = allKeys.filter((k) => {
    const y = Number(k.slice(0, 4))
    const m = Number(k.slice(5, 7))
    return y === latestYear - 1 && m <= latestMonth
  })

  const qCurrent = allKeys.filter((k) => {
    const idx = monthToIndex(k)
    return idx >= latestIdx - 2 && idx <= latestIdx
  })
  const qPrev = allKeys.filter((k) => {
    const idx = monthToIndex(k)
    return idx >= latestIdx - 5 && idx <= latestIdx - 3
  })

  const hCurrent = allKeys.filter((k) => {
    const idx = monthToIndex(k)
    return idx >= latestIdx - 5 && idx <= latestIdx
  })
  const hPrev = allKeys.filter((k) => {
    const idx = monthToIndex(k)
    return idx >= latestIdx - 11 && idx <= latestIdx - 6
  })

  return {
    latestMonth: latest,
    latestValue,
    ytd: buildComparisonEntry({
      current: sumRange(monthMap, metric, ytdKeysCurrent),
      previous: sumRange(monthMap, metric, ytdKeysPrev),
      currentLabel: `YTD ${monthRangeLabel(ytdKeysCurrent)}`,
      previousLabel: `YTD ${monthRangeLabel(ytdKeysPrev)}`,
    }),
    mom: buildComparisonEntry({
      current: latestValue,
      previous: Number(monthMap[prevMonthKey]?.[metric] || 0),
      currentLabel: monthKeyToLabel(latest),
      previousLabel: monthKeyToLabel(prevMonthKey),
    }),
    yoy: buildComparisonEntry({
      current: latestValue,
      previous: Number(monthMap[sameMonthPrevYear]?.[metric] || 0),
      currentLabel: monthKeyToLabel(latest),
      previousLabel: monthKeyToLabel(sameMonthPrevYear),
    }),
    qoq: buildComparisonEntry({
      current: sumRange(monthMap, metric, qCurrent),
      previous: sumRange(monthMap, metric, qPrev),
      currentLabel: `Quarter ${monthRangeLabel(qCurrent)}`,
      previousLabel: `Quarter ${monthRangeLabel(qPrev)}`,
    }),
    halfYear: buildComparisonEntry({
      current: sumRange(monthMap, metric, hCurrent),
      previous: sumRange(monthMap, metric, hPrev),
      currentLabel: `Half ${monthRangeLabel(hCurrent)}`,
      previousLabel: `Half ${monthRangeLabel(hPrev)}`,
    }),
  }
}

function sourceHasMetric(monthMap, metric) {
  return Object.values(monthMap).some((m) => m?.[metric] !== null && m?.[metric] !== undefined)
}

export default function ProfitAnalysisPage() {
  const { t } = useI18n()
  const initialFilters = useMemo(() => readFiltersFromUrl(), [])
  const [loading, setLoading] = useState(true)
  const [mediaMonthly, setMediaMonthly] = useState({})
  const [creoMonthly, setCreoMonthly] = useState({})
  const [timeRange, setTimeRange] = useState(initialFilters.timeRange)
  const [sourceMode, setSourceMode] = useState(initialFilters.sourceMode)
  const [selectedKpi, setSelectedKpi] = useState(initialFilters.selectedKpi)
  const [includeCurrentMonth, setIncludeCurrentMonth] = useState(
    Boolean(initialFilters.includeCurrentMonth)
  )

  useEffect(() => {
    track('page_view', { page: 'OverviewExecutiveCompass', access: 'console' })
  }, [])

  useEffect(() => {
    const params = new window.URLSearchParams(window.location.search || '')
    params.set('range', timeRange)
    params.set('source', sourceMode)
    params.set('kpi', selectedKpi)
    if (includeCurrentMonth) params.set('includeCurrentMonth', '1')
    else params.delete('includeCurrentMonth')
    const next = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState(window.history.state, '', next)
  }, [timeRange, sourceMode, selectedKpi, includeCurrentMonth])

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)
      try {
        const mediaCandidates = ['/Media Report.csv', '/01012025 to 12072025 Media Report.csv']
        const { rows: mediaRows } = await fetchFirstOkCsvRowsCached(mediaCandidates)

        const nextMedia = {}
        for (const row of mediaRows || []) {
          const month = parseMediaMonth(row.Month ?? row.month)
          if (!month) continue
          const entry = nextMedia[month.key] || {
            ...EMPTY_METRIC,
            registrations: 0,
            ftdAmount: 0,
            ftdCount: 0,
            qftd: 0,
            deposits: 0,
            depositCount: 0,
            withdrawals: 0,
            withdrawalCount: 0,
            netDeposits: 0,
            label: month.label,
          }

          const dep = cleanNumber(row.Deposits ?? row.deposits)
          const wd = cleanNumber(row.Withdrawals ?? row.withdrawals)
          const depCount = cleanNumber(
            row['Deposits Count'] ??
              row['Deposits count'] ??
              row['Deposit Count'] ??
              row.deposit_count ??
              row.deposits_count ??
              row.num_deposits
          )
          const wdCount = cleanNumber(
            row['Withdrawals Count'] ??
              row['Withdrawal Count'] ??
              row.withdrawals_count ??
              row.withdrawal_count
          )

          entry.registrations += cleanNumber(
            row.Registrations ?? row.registrations ?? row.Leads ?? row.leads
          )
          entry.ftdAmount += cleanNumber(
            row.first_deposits ?? row.First_Deposits ?? row.firstDeposits
          )
          entry.ftdCount += cleanNumber(row.FTD ?? row.ftd)
          entry.qftd += cleanNumber(row.QFTD ?? row.Qftd ?? row.qftd)
          entry.deposits += dep
          entry.withdrawals += wd
          entry.netDeposits += cleanNumber(
            row['Net Deposits'] ?? row.net_deposits ?? row.netdeposits
          )
          entry.depositCount += depCount > 0 ? depCount : dep > 0 ? 1 : 0
          entry.withdrawalCount += wdCount > 0 ? wdCount : wd > 0 ? 1 : 0

          nextMedia[month.key] = entry
        }

        const tradersRaw = await fetchTextCached(
          withReportsVersion('/traders_ranking_rewards_table.json')
        )
        const tradersJson = JSON.parse(tradersRaw)
        const rows = normalizeJsonRows(tradersJson)

        const nextCreo = {}
        const activeByMonth = new Map()
        const registrationsByMonth = new Map()
        const ftdClientsByMonth = new Map()
        const clientsAgg = new Map()

        for (const row of rows) {
          const month = parseTradersYearMonth(row.year_month)
          if (month) {
            const entry = nextCreo[month.key] || {
              ...EMPTY_METRIC,
              ftdAmount: 0,
              ftdCount: 0,
              deposits: 0,
              depositCount: 0,
              withdrawals: 0,
              withdrawalCount: 0,
              netDeposits: 0,
              label: month.label,
            }

            const dep = cleanNumber(row.deposit)
            const wd = cleanNumber(row.wd)
            const ftdAmount = cleanNumber(row.ftd)
            const netRaw = row.net
            const net = String(netRaw ?? '').trim() === '' ? dep - wd : cleanNumber(netRaw)
            const depCount = cleanNumber(
              row.deposit_count ?? row.deposits_count ?? row.num_deposits
            )
            const wdCount = cleanNumber(row.withdrawal_count ?? row.withdrawals_count)

            entry.ftdAmount += ftdAmount
            entry.deposits += dep
            entry.withdrawals += wd
            entry.netDeposits += net
            entry.depositCount += depCount > 0 ? depCount : dep > 0 ? 1 : 0
            entry.withdrawalCount += wdCount > 0 ? wdCount : wd > 0 ? 1 : 0

            nextCreo[month.key] = entry
          }

          const registrationMonth = parseDateToMonthKey(row.client_timestamp)
          const clientId = String(row.client_id || '').trim()
          const rowFtdAmount = cleanNumber(row.ftd)
          const rowTrades = cleanNumber(row.trades)
          if (month?.key && clientId && rowTrades > 0) {
            if (!activeByMonth.has(month.key)) activeByMonth.set(month.key, new Set())
            activeByMonth.get(month.key).add(clientId)
          }
          if (registrationMonth && clientId) {
            if (!registrationsByMonth.has(registrationMonth))
              registrationsByMonth.set(registrationMonth, new Set())
            registrationsByMonth.get(registrationMonth).add(clientId)
          }
          if (month && clientId && rowFtdAmount > 0) {
            if (!ftdClientsByMonth.has(month.key)) ftdClientsByMonth.set(month.key, new Set())
            ftdClientsByMonth.get(month.key).add(clientId)
          }

          if (clientId) {
            const regDate = parseDateValue(row.client_timestamp)
            const lttDate = parseDateValue(row.ltt_date)
            const ltdDate = parseDateValue(row.ltd_date)
            const existing = clientsAgg.get(clientId) || {
              registrationDate: null,
              lastLttDate: null,
              lastLtdDate: null,
            }
            if (regDate && (!existing.registrationDate || regDate < existing.registrationDate)) {
              existing.registrationDate = regDate
            }
            if (lttDate && (!existing.lastLttDate || lttDate > existing.lastLttDate)) {
              existing.lastLttDate = lttDate
            }
            if (ltdDate && (!existing.lastLtdDate || ltdDate > existing.lastLtdDate)) {
              existing.lastLtdDate = ltdDate
            }
            clientsAgg.set(clientId, existing)
          }
        }

        for (const [key, clientsSet] of activeByMonth.entries()) {
          if (!nextCreo[key]) {
            const y = Number(key.slice(0, 4))
            const m = Number(key.slice(5, 7))
            nextCreo[key] = {
              ...EMPTY_METRIC,
              ftdAmount: 0,
              ftdCount: 0,
              deposits: 0,
              depositCount: 0,
              withdrawals: 0,
              withdrawalCount: 0,
              netDeposits: 0,
              label: `${monthNames[m - 1]} ${y}`,
            }
          }
          nextCreo[key].activeUsers = clientsSet.size
          nextCreo[key].activeUserIds = Array.from(clientsSet)
        }

        for (const [key, clientsSet] of registrationsByMonth.entries()) {
          if (!nextCreo[key]) {
            const y = Number(key.slice(0, 4))
            const m = Number(key.slice(5, 7))
            nextCreo[key] = {
              ...EMPTY_METRIC,
              ftdAmount: 0,
              ftdCount: 0,
              deposits: 0,
              depositCount: 0,
              withdrawals: 0,
              withdrawalCount: 0,
              netDeposits: 0,
              label: `${monthNames[m - 1]} ${y}`,
            }
          }
          nextCreo[key].registrations = clientsSet.size
        }

        for (const [key, clientsSet] of ftdClientsByMonth.entries()) {
          if (!nextCreo[key]) {
            const y = Number(key.slice(0, 4))
            const m = Number(key.slice(5, 7))
            nextCreo[key] = {
              ...EMPTY_METRIC,
              ftdAmount: 0,
              ftdCount: 0,
              deposits: 0,
              depositCount: 0,
              withdrawals: 0,
              withdrawalCount: 0,
              netDeposits: 0,
              label: `${monthNames[m - 1]} ${y}`,
            }
          }
          nextCreo[key].ftdCount = clientsSet.size
        }

        const MS_PER_DAY = 24 * 60 * 60 * 1000
        const now = new Date()
        const ensureMonthBucket = (monthKey) => {
          if (nextCreo[monthKey]) return
          const y = Number(monthKey.slice(0, 4))
          const m = Number(monthKey.slice(5, 7))
          nextCreo[monthKey] = {
            ...EMPTY_METRIC,
            ftdAmount: 0,
            ftdCount: 0,
            deposits: 0,
            depositCount: 0,
            withdrawals: 0,
            withdrawalCount: 0,
            netDeposits: 0,
            label: `${monthNames[m - 1]} ${y}`,
          }
        }
        for (const [, agg] of clientsAgg.entries()) {
          const regDate = agg.registrationDate
          if (!regDate) continue
          // Ultima attività = max(LTT, LTD). Se assenti, fallback alla registrazione.
          let lastActivity = agg.lastLttDate || null
          if (agg.lastLtdDate && (!lastActivity || agg.lastLtdDate > lastActivity)) {
            lastActivity = agg.lastLtdDate
          }
          if (!lastActivity) lastActivity = regDate

          const inactivityDays = Math.floor((now.getTime() - lastActivity.getTime()) / MS_PER_DAY)

          if (inactivityDays >= 60) {
            const churn60Date = addDaysUTC(lastActivity, 60)
            const churn60Month = churn60Date
              ? `${churn60Date.getUTCFullYear()}-${String(churn60Date.getUTCMonth() + 1).padStart(2, '0')}`
              : null
            if (churn60Month) {
              ensureMonthBucket(churn60Month)
              nextCreo[churn60Month].churn60 = Number(nextCreo[churn60Month].churn60 || 0) + 1
            }
          }
        }

        setMediaMonthly(nextMedia)
        setCreoMonthly(nextCreo)
      } catch (err) {
        console.error('Failed to load overview executive data', err)
      } finally {
        setLoading(false)
      }
    }

    const onReportsUpdated = () => loadDashboardData()
    const onStorage = (e) => {
      if (e && e.key === 'bw_reports_version') onReportsUpdated()
    }

    loadDashboardData()
    window.addEventListener('bw-reports-updated', onReportsUpdated)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('bw-reports-updated', onReportsUpdated)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const dashboard = useMemo(() => {
    const allMonthKeys = Array.from(
      new Set([...Object.keys(mediaMonthly), ...Object.keys(creoMonthly)])
    ).sort((a, b) => monthToIndex(a) - monthToIndex(b))

    const keysInScope = getPeriodRange(allMonthKeys, timeRange)
    const displayKeysInScope = includeCurrentMonth
      ? keysInScope
      : keysInScope.filter((k) => k !== NOW_MONTH_KEY)

    const hasFromCreo = {}
    const hasFromMedia = {}
    for (const metric of KPI_CONFIG.map((k) => k.key)) {
      hasFromCreo[metric] = sourceHasMetric(creoMonthly, metric)
      hasFromMedia[metric] = sourceHasMetric(mediaMonthly, metric)
    }

    const rows = KPI_CONFIG.filter(
      (cfg) => cfg.key !== 'churn60' && (selectedKpi === 'all' || cfg.key === selectedKpi)
    ).map((cfg) => {
      const labels = displayKeysInScope.map(
        (k) => mediaMonthly[k]?.label || creoMonthly[k]?.label || k
      )

      const creoSeries = displayKeysInScope.map((k) => Number(creoMonthly[k]?.[cfg.key] || 0))
      const mediaSeries = displayKeysInScope.map((k) => Number(mediaMonthly[k]?.[cfg.key] || 0))

      const showCreo =
        sourceMode === 'both'
          ? hasFromCreo[cfg.key]
          : sourceMode === 'creolabs' && hasFromCreo[cfg.key]
      const showMedia =
        sourceMode === 'both'
          ? hasFromMedia[cfg.key]
          : sourceMode === 'cellxpert' && hasFromMedia[cfg.key]

      const comparisonsCellxpert = buildComparisons({
        keysInScope: displayKeysInScope,
        allKeys: allMonthKeys,
        monthMap: mediaMonthly,
        metric: cfg.key,
      })
      const comparisonsCreolabs = buildComparisons({
        keysInScope: displayKeysInScope,
        allKeys: allMonthKeys,
        monthMap: creoMonthly,
        metric: cfg.key,
      })

      const sources = []
      if (showCreo && hasFromCreo[cfg.key]) sources.push('CreoLabs')
      if (showMedia && hasFromMedia[cfg.key]) sources.push('Cellxpert')
      if (!sources.length) {
        if (hasFromCreo[cfg.key]) sources.push('CreoLabs')
        if (hasFromMedia[cfg.key]) sources.push('Cellxpert')
      }

      return {
        ...cfg,
        labels,
        creoSeries,
        mediaSeries,
        tooltipData: displayKeysInScope.map((k, idx) => ({
          key: k,
          label: mediaMonthly[k]?.label || creoMonthly[k]?.label || k,
          creolabs: creoSeries[idx] || 0,
          cellxpert: mediaSeries[idx] || 0,
        })),
        showCreo,
        showMedia,
        allowFallbackSeries: sourceMode === 'both',
        comparisonsCellxpert,
        comparisonsCreolabs,
        sourceBadge: sources.join(' + ') || 'n/a',
      }
    })

    const topCards = KPI_CONFIG.map((cfg) => {
      const cellxTotal = keysInScope.reduce(
        (acc, key) => acc + Number(mediaMonthly[key]?.[cfg.key] || 0),
        0
      )
      const creoTotal =
        cfg.key === 'activeUsers'
          ? (() => {
              const uniqueIds = new Set()
              keysInScope.forEach((key) => {
                for (const clientId of creoMonthly[key]?.activeUserIds || []) {
                  if (clientId) uniqueIds.add(String(clientId))
                }
              })
              return uniqueIds.size
            })()
          : keysInScope.reduce((acc, key) => acc + Number(creoMonthly[key]?.[cfg.key] || 0), 0)

      let displayTotal = cellxTotal
      if (sourceMode === 'creolabs') displayTotal = creoTotal
      else if (sourceMode === 'cellxpert') displayTotal = cellxTotal
      else if (!hasFromMedia[cfg.key] && hasFromCreo[cfg.key]) displayTotal = creoTotal
      else if (!hasFromCreo[cfg.key] && hasFromMedia[cfg.key]) displayTotal = cellxTotal

      return { ...cfg, cellxTotal, creoTotal, displayTotal }
    })

    const ftdQftd = {
      labels: displayKeysInScope.map((k) => mediaMonthly[k]?.label || k),
      ftd: displayKeysInScope.map((k) => Number(mediaMonthly[k]?.ftdCount || 0)),
      qftd: displayKeysInScope.map((k) => Number(mediaMonthly[k]?.qftd || 0)),
      comparisonsFtd: buildComparisons({
        keysInScope: displayKeysInScope,
        allKeys: allMonthKeys,
        monthMap: mediaMonthly,
        metric: 'ftdCount',
      }),
      comparisonsQftd: buildComparisons({
        keysInScope: displayKeysInScope,
        allKeys: allMonthKeys,
        monthMap: mediaMonthly,
        metric: 'qftd',
      }),
      hasData: displayKeysInScope.some(
        (k) => Number(mediaMonthly[k]?.ftdCount || 0) > 0 || Number(mediaMonthly[k]?.qftd || 0) > 0
      ),
    }

    const churnTrend = {
      labels: displayKeysInScope.map((k) => creoMonthly[k]?.label || k),
      churn60: displayKeysInScope.map((k) => Number(creoMonthly[k]?.churn60 || 0)),
      hasData: displayKeysInScope.some((k) => Number(creoMonthly[k]?.churn60 || 0) > 0),
    }

    const comparisonsChurn60 = buildComparisons({
      keysInScope: displayKeysInScope,
      allKeys: allMonthKeys,
      monthMap: creoMonthly,
      metric: 'churn60',
    })

    return {
      allMonthKeys,
      keysInScope,
      displayKeysInScope,
      rows,
      topCards,
      hasFromCreo,
      hasFromMedia,
      ftdQftd,
      churnTrend,
      comparisonsChurn60,
    }
  }, [mediaMonthly, creoMonthly, sourceMode, timeRange, selectedKpi, includeCurrentMonth])

  if (loading) {
    return <FullPageLoader progress={35} subtitle={t('profitAnalysis.loader.mediaReport')} />
  }

  const showFtdQftd =
    (selectedKpi === 'all' || selectedKpi === 'ftdCount') && dashboard.ftdQftd.hasData
  const showChurnTrend =
    (selectedKpi === 'all' || selectedKpi === 'churn60') && dashboard.churnTrend.hasData

  return (
    <div
      className="w-full"
      style={{
        background: 'radial-gradient(120% 120% at 10% 20%, #0b1c24 0%, #0a0f1e 45%, #0a090f 100%)',
        padding: 16,
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Overview Compass</h2>
          <p style={{ margin: '4px 0 0', color: '#9fb3c8', fontSize: 12 }}>
            Executive performance view across CreoLabs and Cellxpert
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              background: '#0f172a',
              color: 'var(--text)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
            }}
          >
            <option value="all">All time</option>
            <option value="last24">Last 24 months</option>
            <option value="last12">Last 12 months</option>
            <option value="ytd">YTD</option>
            <option value="currentYear">Current year</option>
          </select>

          <select
            value={sourceMode}
            onChange={(e) => setSourceMode(e.target.value)}
            style={{
              background: '#0f172a',
              color: 'var(--text)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
            }}
          >
            <option value="both">Both sources</option>
            <option value="creolabs">CreoLabs</option>
            <option value="cellxpert">Cellxpert</option>
          </select>

          <select
            value={selectedKpi}
            onChange={(e) => setSelectedKpi(e.target.value)}
            style={{
              background: '#0f172a',
              color: 'var(--text)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 12,
            }}
          >
            <option value="all">All KPIs</option>
            {KPI_CONFIG.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#0f172a',
              color: 'var(--text)',
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            <input
              type="checkbox"
              checked={includeCurrentMonth}
              onChange={(e) => setIncludeCurrentMonth(e.target.checked)}
            />
            Include current month
          </label>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
          gap: 8,
        }}
      >
        {dashboard.topCards.map((card) => (
          <KpiCard
            key={card.key}
            size="sm"
            label={card.label}
            value={formatMetricValue(card.displayTotal, card.kind)}
            helper={
              card.key === 'activeUsers'
                ? `Distinct CreoLabs traders active in the selected period: ${formatMetricValue(card.creoTotal, card.kind)}`
                : `CreoLabs: ${formatMetricValue(card.creoTotal, card.kind)}`
            }
            fullValue={`Displayed: ${formatMetricValue(card.displayTotal, card.kind)} | Cellxpert: ${formatMetricValue(card.cellxTotal, card.kind)} | CreoLabs: ${formatMetricValue(card.creoTotal, card.kind)}`}
            tone={card.tone}
            style={{ minWidth: 140 }}
          />
        ))}
      </div>

      {showFtdQftd ? (
        <section
          className="card card-global"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(260px, 1fr)',
            gap: 14,
            alignItems: 'stretch',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>FTD vs QFTD Trend</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                  Monthly comparison
                </p>
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Cellxpert</span>
            </div>

            <div style={{ height: 220 }}>
              <PnLTrendChart
                labels={dashboard.ftdQftd.labels}
                formatValue={(v) => formatMetricValue(v, 'count')}
                showLegend
                tooltipFormatter={({ value, datasetLabel }) =>
                  `${datasetLabel}: ${formatMetricValue(value, 'count')}`
                }
                series={[
                  {
                    label: 'FTD',
                    data: dashboard.ftdQftd.ftd,
                    type: 'line',
                    color: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.18)',
                  },
                  {
                    label: 'QFTD',
                    data: dashboard.ftdQftd.qftd,
                    type: 'line',
                    color: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.18)',
                  },
                ]}
              />
            </div>
          </div>

          <div
            style={{
              borderLeft: '1px solid rgba(148,163,184,0.2)',
              paddingLeft: 14,
              display: 'grid',
              gridTemplateColumns: '1fr',
              alignContent: 'center',
              gap: 8,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontWeight: 600,
                      paddingBottom: 6,
                    }}
                  >
                    Metric
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      color: '#f59e0b',
                      fontWeight: 600,
                      paddingBottom: 6,
                    }}
                  >
                    FTD
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      color: '#22c55e',
                      fontWeight: 600,
                      paddingBottom: 6,
                    }}
                  >
                    QFTD
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    Value
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {dashboard.ftdQftd.comparisonsFtd.mom.currentLabel}
                    </div>
                  </td>
                  <td
                    style={{ textAlign: 'right', color: '#e2e8f0', padding: '4px 0' }}
                    title={`Latest: ${dashboard.ftdQftd.comparisonsFtd.latestMonth || 'n/a'}`}
                  >
                    {formatMetricValue(dashboard.ftdQftd.comparisonsFtd.latestValue, 'count')}
                  </td>
                  <td
                    style={{ textAlign: 'right', color: '#e2e8f0', padding: '4px 0' }}
                    title={`Latest: ${dashboard.ftdQftd.comparisonsQftd.latestMonth || 'n/a'}`}
                  >
                    {formatMetricValue(dashboard.ftdQftd.comparisonsQftd.latestValue, 'count')}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    MoM %
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {dashboard.ftdQftd.comparisonsFtd.mom.currentLabel} vs{' '}
                      {dashboard.ftdQftd.comparisonsFtd.mom.previousLabel}
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: pctTone(dashboard.ftdQftd.comparisonsFtd.mom.pct),
                      padding: '4px 0',
                    }}
                    title={`${dashboard.ftdQftd.comparisonsFtd.mom.currentLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsFtd.mom.current, 'count')} | ${dashboard.ftdQftd.comparisonsFtd.mom.previousLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsFtd.mom.previous, 'count')}`}
                  >
                    {formatPct(dashboard.ftdQftd.comparisonsFtd.mom.pct)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: pctTone(dashboard.ftdQftd.comparisonsQftd.mom.pct),
                      padding: '4px 0',
                    }}
                    title={`${dashboard.ftdQftd.comparisonsQftd.mom.currentLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsQftd.mom.current, 'count')} | ${dashboard.ftdQftd.comparisonsQftd.mom.previousLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsQftd.mom.previous, 'count')}`}
                  >
                    {formatPct(dashboard.ftdQftd.comparisonsQftd.mom.pct)}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    YoY %
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {dashboard.ftdQftd.comparisonsFtd.yoy.currentLabel} vs{' '}
                      {dashboard.ftdQftd.comparisonsFtd.yoy.previousLabel}
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: pctTone(dashboard.ftdQftd.comparisonsFtd.yoy.pct),
                      padding: '4px 0',
                    }}
                    title={`${dashboard.ftdQftd.comparisonsFtd.yoy.currentLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsFtd.yoy.current, 'count')} | ${dashboard.ftdQftd.comparisonsFtd.yoy.previousLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsFtd.yoy.previous, 'count')}`}
                  >
                    {formatPct(dashboard.ftdQftd.comparisonsFtd.yoy.pct)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: pctTone(dashboard.ftdQftd.comparisonsQftd.yoy.pct),
                      padding: '4px 0',
                    }}
                    title={`${dashboard.ftdQftd.comparisonsQftd.yoy.currentLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsQftd.yoy.current, 'count')} | ${dashboard.ftdQftd.comparisonsQftd.yoy.previousLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsQftd.yoy.previous, 'count')}`}
                  >
                    {formatPct(dashboard.ftdQftd.comparisonsQftd.yoy.pct)}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    YTD %
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {dashboard.ftdQftd.comparisonsFtd.ytd.currentLabel} vs{' '}
                      {dashboard.ftdQftd.comparisonsFtd.ytd.previousLabel}
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: pctTone(dashboard.ftdQftd.comparisonsFtd.ytd.pct),
                      padding: '4px 0',
                    }}
                    title={`${dashboard.ftdQftd.comparisonsFtd.ytd.currentLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsFtd.ytd.current, 'count')} | ${dashboard.ftdQftd.comparisonsFtd.ytd.previousLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsFtd.ytd.previous, 'count')}`}
                  >
                    {formatPct(dashboard.ftdQftd.comparisonsFtd.ytd.pct)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: pctTone(dashboard.ftdQftd.comparisonsQftd.ytd.pct),
                      padding: '4px 0',
                    }}
                    title={`${dashboard.ftdQftd.comparisonsQftd.ytd.currentLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsQftd.ytd.current, 'count')} | ${dashboard.ftdQftd.comparisonsQftd.ytd.previousLabel}: ${formatMetricValue(dashboard.ftdQftd.comparisonsQftd.ytd.previous, 'count')}`}
                  >
                    {formatPct(dashboard.ftdQftd.comparisonsQftd.ytd.pct)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {showChurnTrend ? (
        <section
          className="card card-global"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(260px, 1fr)',
            gap: 14,
            alignItems: 'stretch',
          }}
        >
          <div style={{ minWidth: 0, padding: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 15 }}>Churners (60d Inactivity Matured)</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                  Counted in the month when the client reaches 60 days of inactivity. Max(LTT, LTD)
                  as last activity.
                </p>
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>CreoLabs</span>
            </div>
            <div style={{ height: 230 }}>
              <PnLTrendChart
                labels={dashboard.churnTrend.labels}
                formatValue={(v) => formatMetricValue(v, 'count')}
                showLegend
                tooltipFormatter={({ value, datasetLabel }) =>
                  `${datasetLabel}: ${formatMetricValue(value, 'count')}`
                }
                series={[
                  {
                    label: 'Churners (60d)',
                    data: dashboard.churnTrend.churn60,
                    type: 'line',
                    color: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.14)',
                  },
                ]}
              />
            </div>
          </div>

          <div
            style={{
              borderLeft: '1px solid rgba(148,163,184,0.2)',
              padding: '14px 0 14px 14px',
              display: 'grid',
              gridTemplateColumns: '1fr',
              alignContent: 'center',
              gap: 8,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontWeight: 600,
                      paddingBottom: 6,
                    }}
                  >
                    Metric
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      color: '#f59e0b',
                      fontWeight: 600,
                      paddingBottom: 6,
                    }}
                  >
                    CreoLabs
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    Value
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {dashboard.comparisonsChurn60.mom.currentLabel}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', color: '#e2e8f0', padding: '4px 0' }}>
                    {formatMetricValue(dashboard.comparisonsChurn60.latestValue, 'count')}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    MoM %
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {dashboard.comparisonsChurn60.mom.currentLabel} vs{' '}
                      {dashboard.comparisonsChurn60.mom.previousLabel}
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: pctTone(dashboard.comparisonsChurn60.mom.pct),
                      padding: '4px 0',
                    }}
                    title={`${dashboard.comparisonsChurn60.mom.currentLabel}: ${formatMetricValue(dashboard.comparisonsChurn60.mom.current, 'count')} | ${dashboard.comparisonsChurn60.mom.previousLabel}: ${formatMetricValue(dashboard.comparisonsChurn60.mom.previous, 'count')}`}
                  >
                    {formatPct(dashboard.comparisonsChurn60.mom.pct)}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    YoY %
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {dashboard.comparisonsChurn60.yoy.currentLabel} vs{' '}
                      {dashboard.comparisonsChurn60.yoy.previousLabel}
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: pctTone(dashboard.comparisonsChurn60.yoy.pct),
                      padding: '4px 0',
                    }}
                    title={`${dashboard.comparisonsChurn60.yoy.currentLabel}: ${formatMetricValue(dashboard.comparisonsChurn60.yoy.current, 'count')} | ${dashboard.comparisonsChurn60.yoy.previousLabel}: ${formatMetricValue(dashboard.comparisonsChurn60.yoy.previous, 'count')}`}
                  >
                    {formatPct(dashboard.comparisonsChurn60.yoy.pct)}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    YTD %
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {dashboard.comparisonsChurn60.ytd.currentLabel} vs{' '}
                      {dashboard.comparisonsChurn60.ytd.previousLabel}
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: pctTone(dashboard.comparisonsChurn60.ytd.pct),
                      padding: '4px 0',
                    }}
                    title={`${dashboard.comparisonsChurn60.ytd.currentLabel}: ${formatMetricValue(dashboard.comparisonsChurn60.ytd.current, 'count')} | ${dashboard.comparisonsChurn60.ytd.previousLabel}: ${formatMetricValue(dashboard.comparisonsChurn60.ytd.previous, 'count')}`}
                  >
                    {formatPct(dashboard.comparisonsChurn60.ytd.pct)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {dashboard.rows.map((row) => (
        <section
          key={row.key}
          className="card card-global"
          style={{
            display: 'grid',
            gridTemplateColumns:
              row.key === 'churn60' ? '1fr' : 'minmax(0, 1.8fr) minmax(260px, 1fr)',
            gap: 14,
            alignItems: 'stretch',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>{row.label}</h3>
                {row.key === 'activeUsers' ? (
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                    Unique clients per month with trades strictly greater than zero.
                  </p>
                ) : null}
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{row.sourceBadge}</span>
            </div>

            <div style={{ height: 220 }}>
              <PnLTrendChart
                labels={row.labels}
                formatValue={(v) => formatMetricValue(v, row.kind)}
                showLegend
                tooltipData={row.tooltipData}
                tooltipFormatter={({ value, datasetLabel, extra }) => {
                  if (row.key === 'activeUsers') {
                    const current = formatMetricValue(value, row.kind)
                    return `${datasetLabel}: ${current}`
                  }
                  const current = formatMetricValue(value, row.kind)
                  const creo = formatMetricValue(extra?.creolabs || 0, row.kind)
                  const media = formatMetricValue(extra?.cellxpert || 0, row.kind)
                  return `${datasetLabel}: ${current} | Cellxpert: ${media} | CreoLabs: ${creo}`
                }}
                series={[
                  ...(row.showCreo
                    ? [
                        {
                          label: 'CreoLabs',
                          data: row.creoSeries,
                          type: 'line',
                          color: '#22d3ee',
                          backgroundColor: 'rgba(34,211,238,0.18)',
                        },
                      ]
                    : []),
                  ...(row.showMedia
                    ? [
                        {
                          label: 'Cellxpert',
                          data: row.mediaSeries,
                          type: 'line',
                          color: '#f59e0b',
                          backgroundColor: 'rgba(245,158,11,0.18)',
                        },
                      ]
                    : []),
                  ...(!row.showCreo && !row.showMedia && row.allowFallbackSeries
                    ? [
                        {
                          label: 'Cellxpert',
                          data: row.mediaSeries,
                          type: 'line',
                          color: '#f59e0b',
                          backgroundColor: 'rgba(245,158,11,0.18)',
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </div>

          <div
            style={{
              borderLeft: row.key === 'churn60' ? 'none' : '1px solid rgba(148,163,184,0.2)',
              paddingLeft: 14,
              display: 'grid',
              gridTemplateColumns: '1fr',
              alignContent: 'center',
              gap: 8,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      color: '#94a3b8',
                      fontWeight: 600,
                      paddingBottom: 6,
                    }}
                  >
                    Metric
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      color:
                        row.key === 'churn60' || row.key === 'activeUsers' ? '#f59e0b' : '#f59e0b',
                      fontWeight: 600,
                      paddingBottom: 6,
                    }}
                  >
                    {row.key === 'churn60' || row.key === 'activeUsers' ? 'CreoLabs' : 'Cellxpert'}
                  </th>
                  {row.key !== 'churn60' && row.key !== 'activeUsers' && (
                    <th
                      style={{
                        textAlign: 'right',
                        color: '#22d3ee',
                        fontWeight: 600,
                        paddingBottom: 6,
                      }}
                    >
                      CreoLabs
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    Value
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {row.key === 'churn60'
                        ? row.comparisonsCreolabs.mom.currentLabel
                        : row.key === 'activeUsers'
                          ? row.comparisonsCreolabs.mom.currentLabel
                          : row.comparisonsCellxpert.mom.currentLabel}
                    </div>
                  </td>
                  {row.key === 'churn60' || row.key === 'activeUsers' ? (
                    <td style={{ textAlign: 'right', color: '#e2e8f0', padding: '4px 0' }}>
                      {formatMetricValue(row.comparisonsCreolabs.latestValue, row.kind)}
                    </td>
                  ) : (
                    <>
                      <td style={{ textAlign: 'right', color: '#e2e8f0', padding: '4px 0' }}>
                        {formatMetricValue(
                          row.key === 'activeUsers'
                            ? row.comparisonsCreolabs.latestValue
                            : row.comparisonsCellxpert.latestValue,
                          row.kind
                        )}
                      </td>
                      <td style={{ textAlign: 'right', color: '#e2e8f0', padding: '4px 0' }}>
                        {formatMetricValue(row.comparisonsCreolabs.latestValue, row.kind)}
                      </td>
                    </>
                  )}
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    MoM %
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {row.key === 'churn60'
                        ? `${row.comparisonsCreolabs.mom.currentLabel} vs ${row.comparisonsCreolabs.mom.previousLabel}`
                        : row.key === 'activeUsers'
                          ? `${row.comparisonsCreolabs.mom.currentLabel} vs ${row.comparisonsCreolabs.mom.previousLabel}`
                          : `${row.comparisonsCellxpert.mom.currentLabel} vs ${row.comparisonsCellxpert.mom.previousLabel}`}
                    </div>
                  </td>
                  {row.key === 'churn60' || row.key === 'activeUsers' ? (
                    <td
                      style={{
                        textAlign: 'right',
                        color: pctTone(row.comparisonsCreolabs.mom.pct),
                        padding: '4px 0',
                      }}
                      title={`${row.comparisonsCreolabs.mom.currentLabel}: ${formatMetricValue(row.comparisonsCreolabs.mom.current, row.kind)} | ${row.comparisonsCreolabs.mom.previousLabel}: ${formatMetricValue(row.comparisonsCreolabs.mom.previous, row.kind)}`}
                    >
                      {formatPct(row.comparisonsCreolabs.mom.pct)}
                    </td>
                  ) : (
                    <>
                      <td
                        style={{
                          textAlign: 'right',
                          color: pctTone(
                            row.key === 'activeUsers'
                              ? row.comparisonsCreolabs.mom.pct
                              : row.comparisonsCellxpert.mom.pct
                          ),
                          padding: '4px 0',
                        }}
                        title={
                          row.key === 'activeUsers'
                            ? `${row.comparisonsCreolabs.mom.currentLabel}: ${formatMetricValue(row.comparisonsCreolabs.mom.current, row.kind)} | ${row.comparisonsCreolabs.mom.previousLabel}: ${formatMetricValue(row.comparisonsCreolabs.mom.previous, row.kind)}`
                            : `${row.comparisonsCellxpert.mom.currentLabel}: ${formatMetricValue(row.comparisonsCellxpert.mom.current, row.kind)} | ${row.comparisonsCellxpert.mom.previousLabel}: ${formatMetricValue(row.comparisonsCellxpert.mom.previous, row.kind)}`
                        }
                      >
                        {formatPct(
                          row.key === 'activeUsers'
                            ? row.comparisonsCreolabs.mom.pct
                            : row.comparisonsCellxpert.mom.pct
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          color: pctTone(row.comparisonsCreolabs.mom.pct),
                          padding: '4px 0',
                        }}
                        title={`${row.comparisonsCreolabs.mom.currentLabel}: ${formatMetricValue(row.comparisonsCreolabs.mom.current, row.kind)} | ${row.comparisonsCreolabs.mom.previousLabel}: ${formatMetricValue(row.comparisonsCreolabs.mom.previous, row.kind)}`}
                      >
                        {formatPct(row.comparisonsCreolabs.mom.pct)}
                      </td>
                    </>
                  )}
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    YoY %
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {row.key === 'churn60'
                        ? `${row.comparisonsCreolabs.yoy.currentLabel} vs ${row.comparisonsCreolabs.yoy.previousLabel}`
                        : row.key === 'activeUsers'
                          ? `${row.comparisonsCreolabs.yoy.currentLabel} vs ${row.comparisonsCreolabs.yoy.previousLabel}`
                          : `${row.comparisonsCellxpert.yoy.currentLabel} vs ${row.comparisonsCellxpert.yoy.previousLabel}`}
                    </div>
                  </td>
                  {row.key === 'churn60' || row.key === 'activeUsers' ? (
                    <td
                      style={{
                        textAlign: 'right',
                        color: pctTone(row.comparisonsCreolabs.yoy.pct),
                        padding: '4px 0',
                      }}
                      title={`${row.comparisonsCreolabs.yoy.currentLabel}: ${formatMetricValue(row.comparisonsCreolabs.yoy.current, row.kind)} | ${row.comparisonsCreolabs.yoy.previousLabel}: ${formatMetricValue(row.comparisonsCreolabs.yoy.previous, row.kind)}`}
                    >
                      {formatPct(row.comparisonsCreolabs.yoy.pct)}
                    </td>
                  ) : (
                    <>
                      <td
                        style={{
                          textAlign: 'right',
                          color: pctTone(
                            row.key === 'activeUsers'
                              ? row.comparisonsCreolabs.yoy.pct
                              : row.comparisonsCellxpert.yoy.pct
                          ),
                          padding: '4px 0',
                        }}
                        title={
                          row.key === 'activeUsers'
                            ? `${row.comparisonsCreolabs.yoy.currentLabel}: ${formatMetricValue(row.comparisonsCreolabs.yoy.current, row.kind)} | ${row.comparisonsCreolabs.yoy.previousLabel}: ${formatMetricValue(row.comparisonsCreolabs.yoy.previous, row.kind)}`
                            : `${row.comparisonsCellxpert.yoy.currentLabel}: ${formatMetricValue(row.comparisonsCellxpert.yoy.current, row.kind)} | ${row.comparisonsCellxpert.yoy.previousLabel}: ${formatMetricValue(row.comparisonsCellxpert.yoy.previous, row.kind)}`
                        }
                      >
                        {formatPct(
                          row.key === 'activeUsers'
                            ? row.comparisonsCreolabs.yoy.pct
                            : row.comparisonsCellxpert.yoy.pct
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          color: pctTone(row.comparisonsCreolabs.yoy.pct),
                          padding: '4px 0',
                        }}
                        title={`${row.comparisonsCreolabs.yoy.currentLabel}: ${formatMetricValue(row.comparisonsCreolabs.yoy.current, row.kind)} | ${row.comparisonsCreolabs.yoy.previousLabel}: ${formatMetricValue(row.comparisonsCreolabs.yoy.previous, row.kind)}`}
                      >
                        {formatPct(row.comparisonsCreolabs.yoy.pct)}
                      </td>
                    </>
                  )}
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', padding: '4px 0' }}>
                    YTD %
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {row.key === 'churn60'
                        ? `${row.comparisonsCreolabs.ytd.currentLabel} vs ${row.comparisonsCreolabs.ytd.previousLabel}`
                        : row.key === 'activeUsers'
                          ? `${row.comparisonsCreolabs.ytd.currentLabel} vs ${row.comparisonsCreolabs.ytd.previousLabel}`
                          : `${row.comparisonsCellxpert.ytd.currentLabel} vs ${row.comparisonsCellxpert.ytd.previousLabel}`}
                    </div>
                  </td>
                  {row.key === 'churn60' || row.key === 'activeUsers' ? (
                    <td
                      style={{
                        textAlign: 'right',
                        color: pctTone(row.comparisonsCreolabs.ytd.pct),
                        padding: '4px 0',
                      }}
                      title={`${row.comparisonsCreolabs.ytd.currentLabel}: ${formatMetricValue(row.comparisonsCreolabs.ytd.current, row.kind)} | ${row.comparisonsCreolabs.ytd.previousLabel}: ${formatMetricValue(row.comparisonsCreolabs.ytd.previous, row.kind)}`}
                    >
                      {formatPct(row.comparisonsCreolabs.ytd.pct)}
                    </td>
                  ) : (
                    <>
                      <td
                        style={{
                          textAlign: 'right',
                          color: pctTone(
                            row.key === 'activeUsers'
                              ? row.comparisonsCreolabs.ytd.pct
                              : row.comparisonsCellxpert.ytd.pct
                          ),
                          padding: '4px 0',
                        }}
                        title={
                          row.key === 'activeUsers'
                            ? `${row.comparisonsCreolabs.ytd.currentLabel}: ${formatMetricValue(row.comparisonsCreolabs.ytd.current, row.kind)} | ${row.comparisonsCreolabs.ytd.previousLabel}: ${formatMetricValue(row.comparisonsCreolabs.ytd.previous, row.kind)}`
                            : `${row.comparisonsCellxpert.ytd.currentLabel}: ${formatMetricValue(row.comparisonsCellxpert.ytd.current, row.kind)} | ${row.comparisonsCellxpert.ytd.previousLabel}: ${formatMetricValue(row.comparisonsCellxpert.ytd.previous, row.kind)}`
                        }
                      >
                        {formatPct(
                          row.key === 'activeUsers'
                            ? row.comparisonsCreolabs.ytd.pct
                            : row.comparisonsCellxpert.ytd.pct
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          color: pctTone(row.comparisonsCreolabs.ytd.pct),
                          padding: '4px 0',
                        }}
                        title={`${row.comparisonsCreolabs.ytd.currentLabel}: ${formatMetricValue(row.comparisonsCreolabs.ytd.current, row.kind)} | ${row.comparisonsCreolabs.ytd.previousLabel}: ${formatMetricValue(row.comparisonsCreolabs.ytd.previous, row.kind)}`}
                      >
                        {formatPct(row.comparisonsCreolabs.ytd.pct)}
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
