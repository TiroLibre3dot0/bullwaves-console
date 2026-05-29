import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import KpiCard from '../../../components/common/KpiCard'

const DEFAULT_FROM = ''
const DEFAULT_TO = ''
const DEFAULT_LIMIT = 200
const REQUEST_TIMEOUT_MS = 20000
const DEFAULT_SORT = '-clientTimestamp,-clientId'
const FILTER_BRANDS = ['BW', 'BW Global']
const FILTER_MONTHS = [
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
const FILTER_PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'current-week', label: 'Current Week' },
  { id: 'current-month', label: 'Current Month' },
  { id: 'previous-month', label: 'Previous Month' },
  { id: 'last-3m', label: 'Last 3M' },
  { id: 'mtd', label: 'MTD' },
]

const COLUMNS = [
  { key: 'affiliate_id', label: 'Affiliate ID', align: 'left', type: 'text' },
  { key: 'client_id', label: 'Client ID', align: 'left', type: 'text' },
  { key: 'client_name', label: 'Client Name', align: 'left', type: 'text' },
  { key: 'client_login', label: 'Client LOGIN', align: 'left', type: 'text' },
  { key: 'user', label: 'User', align: 'left', type: 'text' },
  { key: 'country', label: 'Country', align: 'left', type: 'text' },
  { key: 'balance', label: '$ Balance', align: 'right', type: 'money' },
  { key: 'ltv_commission', label: 'LTV Commission', align: 'right', type: 'money' },
  { key: 'closed_pl', label: '$ Closed PL', align: 'right', type: 'money' },
  { key: 'open_pl', label: '$ Open PL', align: 'right', type: 'money' },
  { key: 'trades', label: '# Trades', align: 'right', type: 'int' },
  { key: 'ftd', label: '$ FTD', align: 'right', type: 'money' },
  { key: 'rdp', label: '$ RDP', align: 'right', type: 'money' },
  { key: 'deposit', label: '$ Deposit', align: 'right', type: 'money' },
  { key: 'wd', label: '$ WD', align: 'right', type: 'money' },
  { key: 'net', label: '$ Net', align: 'right', type: 'money' },
  { key: 'client_timestamp', label: 'Client Timestamp', align: 'left', type: 'date' },
  { key: 'ltd_date', label: 'LTD Date', align: 'left', type: 'date' },
  { key: 'ltt_date', label: 'LTT Date', align: 'left', type: 'date' },
  { key: 'equity', label: '$ Equity', align: 'right', type: 'money' },
  { key: 'clients_p', label: '# Clients (P)', align: 'right', type: 'int' },
  { key: 'year_month', label: 'Year Month', align: 'left', type: 'text' },
  { key: 'source_period', label: 'Source Period', align: 'left', type: 'text' },
  { key: 'opened_trades', label: '# Opened Trades', align: 'right', type: 'int' },
]

const moneyFmt = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const intFmt = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const primaryButtonStyle = {
  appearance: 'none',
  border: '1px solid rgba(56,189,248,0.35)',
  background: 'linear-gradient(180deg, rgba(14,165,233,0.22), rgba(2,132,199,0.16))',
  color: '#e0f2fe',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  border: '1px solid rgba(148,163,184,0.28)',
  background: 'rgba(30,41,59,0.72)',
  color: '#e2e8f0',
}

function isNetworkFetchError(err) {
  const msg = String(err?.message || '').toLowerCase()
  return (
    err instanceof TypeError ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('load failed')
  )
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTimeoutAndRetry(
  url,
  options = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
  retries = 1
) {
  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new globalThis.AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return res
    } catch (err) {
      lastError = err
      if (err?.name === 'AbortError') throw err
      if (!isNetworkFetchError(err) || attempt >= retries) throw err
      await delay(350 * (attempt + 1))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError || new Error('Network request failed')
}

function toYearMonthLabel(isoText) {
  const value = String(isoText || '').trim()
  const time = Date.parse(value)
  if (!Number.isFinite(time)) return 'All time'
  const date = new Date(time)
  const months = [
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
  return `${date.getUTCFullYear()}-${months[date.getUTCMonth()]}`
}

function toIsoDateOnly(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const y = String(date.getFullYear())
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMonthRange(year, monthIndex) {
  const safeYear = Number(year)
  const safeMonth = Number(monthIndex)
  if (!Number.isFinite(safeYear) || !Number.isFinite(safeMonth)) return { from: '', to: '' }
  const start = new Date(safeYear, safeMonth, 1)
  const end = new Date(safeYear, safeMonth + 1, 0)
  return { from: toIsoDateOnly(start), to: toIsoDateOnly(end) }
}

function getYearRange(year) {
  const safeYear = Number(year)
  if (!Number.isFinite(safeYear)) return { from: '', to: '' }
  return { from: `${safeYear}-01-01`, to: `${safeYear}-12-31` }
}

function resolvePeriodRange(periodId) {
  const now = new Date()
  const today = toIsoDateOnly(now)
  if (periodId === 'today') return { from: today, to: today }

  if (periodId === 'yesterday') {
    const d = new Date(now)
    d.setDate(now.getDate() - 1)
    const y = toIsoDateOnly(d)
    return { from: y, to: y }
  }

  if (periodId === 'current-week') {
    const d = new Date(now)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return { from: toIsoDateOnly(d), to: today }
  }

  if (periodId === 'current-month' || periodId === 'mtd') {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return { from: `${y}-${m}-01`, to: today }
  }

  if (periodId === 'previous-month') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    return getMonthRange(d.getFullYear(), d.getMonth())
  }

  if (periodId === 'last-3m') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 2)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    return { from: toIsoDateOnly(start), to: today }
  }

  return null
}

function toggleInArray(values, value) {
  const list = Array.isArray(values) ? values : []
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function resolveCombinedTemporalRange({ years = [], months = [], periods = [] }) {
  const ranges = []
  const nowYear = String(new Date().getFullYear())

  for (const year of years) {
    const range = getYearRange(year)
    if (range?.from && range?.to) ranges.push(range)
  }

  if (Array.isArray(months) && months.length) {
    const effectiveYears = Array.isArray(years) && years.length ? years : [nowYear]
    for (const year of effectiveYears) {
      for (const month of months) {
        const monthIdx = FILTER_MONTHS.indexOf(month)
        if (monthIdx < 0) continue
        const range = getMonthRange(year, monthIdx)
        if (range?.from && range?.to) ranges.push(range)
      }
    }
  }

  for (const period of periods) {
    const range = resolvePeriodRange(period)
    if (range?.from && range?.to) ranges.push(range)
  }

  if (!ranges.length) return { from: DEFAULT_FROM, to: DEFAULT_TO }

  const from =
    ranges
      .map((r) => r.from)
      .filter(Boolean)
      .sort()[0] || DEFAULT_FROM
  const to =
    ranges
      .map((r) => r.to)
      .filter(Boolean)
      .sort()
      .slice(-1)[0] || DEFAULT_TO
  return { from, to }
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
  const sec = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`
}

function formatCellValue(type, value) {
  if (type === 'money') {
    if (value == null || value === '') return '-'
    const number = Number(value)
    return Number.isFinite(number) ? moneyFmt.format(number) : '0.00'
  }
  if (type === 'int') {
    if (value == null || value === '') return '-'
    const number = Number(value)
    return Number.isFinite(number) ? intFmt.format(number) : '0'
  }
  if (type === 'date') {
    const raw = String(value || '').trim()
    if (!raw || raw === '-') return '-'
    const time = Date.parse(raw)
    if (!Number.isFinite(time)) return raw
    const date = new Date(time)
    const dd = String(date.getUTCDate()).padStart(2, '0')
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = date.getUTCFullYear()
    return `${dd}/${mm}/${yyyy}`
  }
  const text = String(value || '').trim()
  return text || '-'
}

function formatAgeMs(ms) {
  const value = Number(ms)
  if (!Number.isFinite(value) || value < 0) return 'n/a'
  const seconds = Math.floor(value / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return remMin ? `${hours}h ${remMin}m` : `${hours}h`
}

function formatIsoDateTime(value) {
  const raw = String(value || '').trim()
  const time = Date.parse(raw)
  if (!Number.isFinite(time)) return 'n/a'
  const date = new Date(time)
  const local = new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  const utcDd = String(date.getUTCDate()).padStart(2, '0')
  const utcMm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const utcYyyy = date.getUTCFullYear()
  const utcHh = String(date.getUTCHours()).padStart(2, '0')
  const utcMin = String(date.getUTCMinutes()).padStart(2, '0')

  return `${local} (UTC ${utcDd}/${utcMm}/${utcYyyy} ${utcHh}:${utcMin})`
}

function buildTableRow(user) {
  const optionalNumber = (input) => {
    if (input == null || input === '') return null
    const number = Number(input)
    return Number.isFinite(number) ? number : null
  }

  return {
    affiliate_id: user?.affiliateId || '',
    client_id: user?.clientId || '',
    client_name: user?.clientName || '',
    client_login: user?.clientLogin || '',
    user: user?.user || '',
    brand: user?.brand || '',
    country: user?.country || '',
    balance: optionalNumber(user?.balance),
    ltv_commission: optionalNumber(user?.commission),
    closed_pl: optionalNumber(user?.closedPl),
    open_pl: optionalNumber(user?.openPl),
    trades: optionalNumber(user?.trades),
    ftd: optionalNumber(user?.ftd),
    rdp: optionalNumber(user?.rdp),
    deposit: optionalNumber(user?.deposit),
    wd: optionalNumber(user?.wd),
    net: optionalNumber(user?.net),
    client_timestamp: user?.clientTimestamp || '',
    ltd_date: user?.ltdDate || '',
    ltt_date: user?.lttDate || '',
    equity: optionalNumber(user?.equity),
    clients_p: null,
    year_month: user?.sourcePeriod || toYearMonthLabel(user?.clientTimestamp),
    source_period: user?.sourcePeriod || '',
    opened_trades: optionalNumber(user?.openedTrades),
  }
}

export default function CreolabsDbLivePage() {
  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const [affiliateId, setAffiliateId] = useState('')
  const [sort, setSort] = useState(DEFAULT_SORT)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [allowMonthFallback, setAllowMonthFallback] = useState(false)
  const [strictLive, setStrictLive] = useState(false)
  const [markUnmappedIdentity, setMarkUnmappedIdentity] = useState(true)
  const [cursor, setCursor] = useState('')
  const [nextCursor, setNextCursor] = useState('')
  const [prevCursor, setPrevCursor] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState(null)
  const [pageInfo, setPageInfo] = useState({ count: 0, hasPrev: false, hasNext: false })
  const [ingestionBusy, setIngestionBusy] = useState(false)
  const [ingestionError, setIngestionError] = useState('')
  const [ingestionMessage, setIngestionMessage] = useState('')
  const [summaryRefreshing, setSummaryRefreshing] = useState(false)
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedYears, setSelectedYears] = useState([])
  const [selectedMonths, setSelectedMonths] = useState([])
  const [selectedPeriods, setSelectedPeriods] = useState([])
  const warnedMissingQueryKpisRef = useRef(false)

  const yearTabs = useMemo(() => {
    const y = new Date().getFullYear()
    return [String(y - 2), String(y - 1), String(y)]
  }, [])

  const updatedToText = useMemo(() => {
    const source = meta?.freshness?.lastSuccessAt || meta?.query?.at || meta?.updatedAt || ''
    return formatUpdatedAtCompact(source)
  }, [meta])
  const temporalMode = useMemo(() => {
    if (Array.isArray(selectedPeriods) && selectedPeriods.length > 0) return 'Period'
    if (
      (Array.isArray(selectedYears) && selectedYears.length > 0) ||
      (Array.isArray(selectedMonths) && selectedMonths.length > 0)
    ) {
      return 'Year-Month'
    }
    if (String(from || '').trim() || String(to || '').trim()) return 'Custom Date'
    return 'Year-Month'
  }, [from, selectedMonths, selectedPeriods, selectedYears, to])
  const isBusy = loading || ingestionBusy

  const visibleRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows])
  const summaryCards = useMemo(() => {
    const toFiniteOrNull = (value) => {
      const number = Number(value)
      return Number.isFinite(number) ? number : null
    }

    const formatMoneyOrNA = (value) => {
      const number = toFiniteOrNull(value)
      return number == null ? 'n/a' : moneyFmt.format(number)
    }

    const formatIntOrNA = (value) => {
      const number = toFiniteOrNull(value)
      return number == null ? 'n/a' : intFmt.format(number)
    }

    const queryKpis = meta?.queryKpis || null
    const hasQueryKpis = Boolean(
      queryKpis && typeof queryKpis === 'object' && Object.keys(queryKpis).length > 0
    )
    const queryTotal = toFiniteOrNull(meta?.query?.total)
    const totalFilteredRows = toFiniteOrNull(queryKpis?.rows) ?? queryTotal ?? visibleRows.length
    const totalUniqueClients =
      toFiniteOrNull(queryKpis?.uniqueClients) ??
      new Set(
        visibleRows
          .map((row) => String(row?.client_id || row?.clientId || '').trim())
          .filter(Boolean)
      ).size
    const totalUniqueAffiliates =
      toFiniteOrNull(queryKpis?.uniqueAffiliates) ??
      new Set(
        visibleRows
          .map((row) => String(row?.affiliate_id || row?.affiliateId || '').trim())
          .filter(Boolean)
      ).size
    const fallbackNet = visibleRows.reduce((sum, row) => sum + (toFiniteOrNull(row?.net) ?? 0), 0)
    const fallbackDeposit = visibleRows.reduce(
      (sum, row) => sum + (toFiniteOrNull(row?.deposit) ?? 0),
      0
    )
    const fallbackWd = visibleRows.reduce((sum, row) => sum + (toFiniteOrNull(row?.wd) ?? 0), 0)
    const fallbackTrades = visibleRows.reduce(
      (sum, row) => sum + (toFiniteOrNull(row?.trades) ?? 0),
      0
    )
    const fallbackPl = visibleRows.reduce(
      (sum, row) =>
        sum + ((toFiniteOrNull(row?.closed_pl) ?? 0) + (toFiniteOrNull(row?.open_pl) ?? 0)),
      0
    )
    const fallbackFtd = visibleRows.reduce((sum, row) => sum + (toFiniteOrNull(row?.ftd) ?? 0), 0)
    const fallbackRdp = visibleRows.reduce((sum, row) => sum + (toFiniteOrNull(row?.rdp) ?? 0), 0)
    const totalNet = toFiniteOrNull(queryKpis?.net) ?? fallbackNet
    const totalDeposit = toFiniteOrNull(queryKpis?.deposit) ?? fallbackDeposit
    const totalWd = toFiniteOrNull(queryKpis?.wd) ?? fallbackWd
    const totalTrades = toFiniteOrNull(queryKpis?.trades) ?? fallbackTrades
    const totalPl = toFiniteOrNull(queryKpis?.totalPl) ?? fallbackPl
    const totalFtd = toFiniteOrNull(queryKpis?.ftd) ?? fallbackFtd
    const totalRdp = toFiniteOrNull(queryKpis?.rdp) ?? fallbackRdp

    const queryLimit = toFiniteOrNull(meta?.query?.limit) ?? limit ?? DEFAULT_LIMIT
    const missingIdentity = toFiniteOrNull(meta?.quality?.identityMissing?.count)
    const missingIdentityRatio = toFiniteOrNull(meta?.quality?.identityMissing?.ratio) ?? 0
    const sourceMode = String(meta?.sourceRows?.sourceMode || 'n/a')

    return [
      {
        label: 'Filtered rows',
        value: formatIntOrNA(totalFilteredRows),
        helper: `${hasQueryKpis ? 'Total selection' : 'Fallback current page'} (page limit ${intFmt.format(queryLimit)}${queryTotal != null ? `, query total ${intFmt.format(queryTotal)}` : ''})`,
        tone: '#e2e8f0',
      },
      {
        label: 'Unique clients',
        value: formatIntOrNA(totalUniqueClients),
        helper: `Unique affiliates: ${formatIntOrNA(totalUniqueAffiliates)}`,
        tone: '#7dd3fc',
      },
      {
        label: 'Net',
        value: formatMoneyOrNA(totalNet),
        helper: 'Sum on filtered selection',
        tone: '#34d399',
      },
      {
        label: 'Deposit',
        value: formatMoneyOrNA(totalDeposit),
        helper: 'Sum on filtered selection',
        tone: '#fbbf24',
      },
      {
        label: 'WD',
        value: formatMoneyOrNA(totalWd),
        helper: 'Sum on filtered selection',
        tone: '#f472b6',
      },
      {
        label: 'Trades',
        value: formatIntOrNA(totalTrades),
        helper: 'Sum on filtered selection',
        tone: '#22d3ee',
      },
      {
        label: 'P&L',
        value: formatMoneyOrNA(totalPl),
        helper: 'Closed PL + Open PL',
        tone: '#fca5a5',
      },
      {
        label: 'FTD',
        value: formatMoneyOrNA(totalFtd),
        helper: `RDP: ${formatMoneyOrNA(totalRdp)}`,
        tone: '#93c5fd',
      },
      {
        label: 'Identity missing',
        value: formatIntOrNA(missingIdentity),
        helper: `${Math.round(missingIdentityRatio * 10000) / 100}% | source: ${sourceMode}`,
        tone: '#a78bfa',
      },
    ]
  }, [limit, meta, visibleRows.length])

  useEffect(() => {
    const hasQueryKpis = Boolean(
      meta?.queryKpis &&
      typeof meta.queryKpis === 'object' &&
      Object.keys(meta.queryKpis).length > 0
    )
    if (meta && !hasQueryKpis && !warnedMissingQueryKpisRef.current) {
      warnedMissingQueryKpisRef.current = true
      console.warn(
        '[Creolabs][DB Live] queryKpis missing in API payload, cards are using page fallback to avoid regression.'
      )
    }
  }, [meta])
  const runtimeBadge = useMemo(() => {
    const sourceMode = String(meta?.sourceRows?.sourceMode || 'n/a')
    const freshnessState = String(meta?.freshness?.state || 'unknown')
    const ageText = formatAgeMs(meta?.freshness?.ageMs)
    const lastSuccessAt = formatIsoDateTime(meta?.freshness?.lastSuccessAt)

    if (sourceMode === 'no-source' || sourceMode === 'n/a') {
      return {
        label: 'Snapshot-only / source unavailable',
        tone: {
          color: '#fecaca',
          border: '1px solid rgba(248,113,113,0.35)',
          background: 'rgba(127,29,29,0.28)',
        },
        details: `Source ${sourceMode} - Last update ${lastSuccessAt} - Age ${ageText}`,
      }
    }

    return {
      label: `Source ${sourceMode} (${freshnessState})`,
      tone: {
        color: '#bbf7d0',
        border: '1px solid rgba(74,222,128,0.35)',
        background: 'rgba(20,83,45,0.24)',
      },
      details: `Last update ${lastSuccessAt} - Age ${ageText}`,
    }
  }, [meta])

  const loadUsers = async (options = {}) => {
    const nextCursorArg = options.cursor || ''
    const resetCursor = Boolean(options.resetCursor)
    const effectiveFrom = String(options.from != null ? options.from : from).trim()
    const effectiveTo = String(options.to != null ? options.to : to).trim()
    const effectiveSearch = String(options.search != null ? options.search : search).trim()
    const effectiveStatus = String(options.status != null ? options.status : status).trim()
    const effectiveCountry = String(options.country != null ? options.country : country).trim()
    const effectiveAffiliateId = String(
      options.affiliateId != null ? options.affiliateId : affiliateId
    ).trim()
    const effectiveSort = String(options.sort != null ? options.sort : sort || DEFAULT_SORT).trim()
    const effectiveBrands = Array.isArray(options.brands)
      ? options.brands.map((item) => String(item || '').trim()).filter(Boolean)
      : selectedBrands
    const effectiveLimit = Number.isFinite(Number(options.limit))
      ? Math.max(1, Math.min(500, Number(options.limit)))
      : limit

    setLoading(true)
    setError('')

    try {
      const query = new globalThis.URLSearchParams()
      if (effectiveFrom) query.set('from', effectiveFrom)
      if (effectiveTo) query.set('to', effectiveTo)
      query.set('monthFallback', allowMonthFallback ? '1' : '0')
      query.set('strictLive', strictLive ? '1' : '0')
      query.set('markUnmappedIdentity', markUnmappedIdentity ? '1' : '0')
      query.set('limit', String(effectiveLimit))
      query.set('sort', effectiveSort || DEFAULT_SORT)
      if (effectiveSearch) query.set('search', effectiveSearch)
      if (effectiveStatus) query.set('status', effectiveStatus)
      if (effectiveCountry) query.set('country', effectiveCountry)
      if (effectiveAffiliateId) query.set('affiliateId', effectiveAffiliateId)
      if (effectiveBrands.length) query.set('brand', effectiveBrands.join(','))
      if (nextCursorArg) query.set('page', nextCursorArg)

      const res = await fetchWithTimeoutAndRetry(
        `/api/qlik/creolabs/db-live?${query.toString()}`,
        {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        },
        REQUEST_TIMEOUT_MS,
        1
      )

      if (!res.ok) {
        throw new Error(`db-live failed (${res.status})`)
      }

      const payload = await res.json()
      if (!payload?.ok) {
        throw new Error(payload?.error || 'Invalid db-live payload')
      }

      const users = Array.isArray(payload?.data?.users) ? payload.data.users : []
      const mappedRows = users.map(buildTableRow)
      const page = payload?.data?.page || {}

      setRows(mappedRows)
      setMeta(payload?.data?.meta || null)
      setPageInfo({
        count: Number(page?.count || mappedRows.length || 0),
        hasPrev: Boolean(page?.hasPrev),
        hasNext: Boolean(page?.hasNext),
      })
      setPrevCursor(String(page?.prev || ''))
      setNextCursor(String(page?.next || ''))
      setCursor(resetCursor ? '' : nextCursorArg)
    } catch (e) {
      setRows([])
      setMeta(null)
      setPageInfo({ count: 0, hasPrev: false, hasNext: false })
      setPrevCursor('')
      setNextCursor('')
      if (e?.name === 'AbortError') {
        setError('Request timeout: il server DB Live impiega troppo tempo a rispondere.')
      } else if (isNetworkFetchError(e)) {
        setError(
          'Failed to fetch DB Live API: verifica che Vite (5174) e upload server (4000) siano attivi.'
        )
      } else {
        setError(
          strictLive
            ? `${e?.message || 'Unable to load DB Live users'} (strict-live enabled)`
            : e?.message || 'Unable to load DB Live users'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers({ resetCursor: true })
  }, [])

  const refreshSummaryOnly = useCallback(async () => {
    if (loading || ingestionBusy) return

    const effectiveFrom = String(from).trim()
    const effectiveTo = String(to).trim()
    const effectiveSearch = String(search).trim()
    const effectiveStatus = String(status).trim()
    const effectiveCountry = String(country).trim()
    const effectiveAffiliateId = String(affiliateId).trim()
    const effectiveSort = String(sort || DEFAULT_SORT).trim()
    const effectiveBrands = Array.isArray(selectedBrands)
      ? selectedBrands.map((item) => String(item || '').trim()).filter(Boolean)
      : []

    try {
      setSummaryRefreshing(true)
      const query = new globalThis.URLSearchParams()
      if (effectiveFrom) query.set('from', effectiveFrom)
      if (effectiveTo) query.set('to', effectiveTo)
      query.set('monthFallback', allowMonthFallback ? '1' : '0')
      query.set('strictLive', strictLive ? '1' : '0')
      query.set('markUnmappedIdentity', markUnmappedIdentity ? '1' : '0')
      query.set('limit', '1')
      query.set('sort', effectiveSort || DEFAULT_SORT)
      if (effectiveSearch) query.set('search', effectiveSearch)
      if (effectiveStatus) query.set('status', effectiveStatus)
      if (effectiveCountry) query.set('country', effectiveCountry)
      if (effectiveAffiliateId) query.set('affiliateId', effectiveAffiliateId)
      if (effectiveBrands.length) query.set('brand', effectiveBrands.join(','))

      const res = await fetchWithTimeoutAndRetry(
        `/api/qlik/creolabs/db-live?${query.toString()}`,
        {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        },
        REQUEST_TIMEOUT_MS,
        1
      )

      if (!res.ok) return
      const payload = await res.json()
      if (!payload?.ok || !payload?.data?.meta) return

      setMeta((prev) => ({ ...(prev || {}), ...(payload.data.meta || {}) }))
    } catch {
      // Silent on timer refresh: keep latest cards without interrupting the user.
    } finally {
      setSummaryRefreshing(false)
    }
  }, [
    affiliateId,
    allowMonthFallback,
    country,
    from,
    ingestionBusy,
    loading,
    markUnmappedIdentity,
    search,
    selectedBrands,
    sort,
    status,
    strictLive,
    to,
  ])

  useEffect(() => {
    const timerId = setInterval(() => {
      refreshSummaryOnly()
    }, 60000)
    return () => clearInterval(timerId)
  }, [refreshSummaryOnly])

  const runIngestionControl = async (action) => {
    setIngestionBusy(true)
    setIngestionError('')
    setIngestionMessage('')
    try {
      const res = await fetchWithTimeoutAndRetry(
        '/api/qlik/creolabs/db-live-ingestion-control',
        {
          method: 'POST',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        },
        30000,
        1
      )
      const payload = await res.json()
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || `ingestion control failed (${res.status})`)
      }

      const runId = String(payload?.data?.run?.id || '')
      setIngestionMessage(runId ? `${action} completed - run ${runId}` : `${action} completed`)
      await loadUsers({ resetCursor: true })
    } catch (e) {
      if (isNetworkFetchError(e)) {
        setIngestionError(
          'Failed to fetch ingestion API: verifica che upload server (4000) sia attivo.'
        )
      } else {
        setIngestionError(e?.message || 'Unable to execute ingestion action')
      }
    } finally {
      setIngestionBusy(false)
    }
  }

  const applyDateWindowAndReload = (window) => {
    const nextFrom = String(window?.from || '').trim()
    const nextTo = String(window?.to || '').trim()
    setFrom(nextFrom)
    setTo(nextTo)
    loadUsers({ resetCursor: true, from: nextFrom, to: nextTo })
  }

  const resetAllFilters = () => {
    setSelectedBrands([])
    setSelectedYears([])
    setSelectedMonths([])
    setSelectedPeriods([])
    setFrom(DEFAULT_FROM)
    setTo(DEFAULT_TO)
    setSearch('')
    setStatus('')
    setCountry('')
    setAffiliateId('')
    setSort(DEFAULT_SORT)
    setLimit(DEFAULT_LIMIT)
    loadUsers({
      resetCursor: true,
      from: DEFAULT_FROM,
      to: DEFAULT_TO,
      search: '',
      status: '',
      country: '',
      affiliateId: '',
      brands: [],
      sort: DEFAULT_SORT,
      limit: DEFAULT_LIMIT,
    })
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 10 }}>
        <div
          style={{
            display: 'grid',
            gap: 8,
            gridTemplateColumns: '1fr auto',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              border: '1px solid rgba(148,163,184,0.28)',
              borderRadius: 8,
              background: 'rgba(15,23,42,0.6)',
              padding: 10,
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 12, color: '#cbd5e1', minWidth: 36 }}>Brand</strong>
              <div style={{ display: 'inline-flex', gap: 4 }}>
                {FILTER_BRANDS.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      const nextBrands = toggleInArray(selectedBrands, brand)
                      setSelectedBrands(nextBrands)
                      loadUsers({ resetCursor: true, brands: nextBrands })
                    }}
                    style={{
                      ...(selectedBrands.includes(brand)
                        ? primaryButtonStyle
                        : secondaryButtonStyle),
                      padding: '5px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                  >
                    {brand}
                  </button>
                ))}
              </div>

              <strong style={{ fontSize: 12, color: '#cbd5e1', minWidth: 28 }}>Year</strong>
              <div style={{ display: 'inline-flex', gap: 4 }}>
                {yearTabs.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      // Year/Month mode is exclusive from quick Period presets.
                      const nextYears = toggleInArray(selectedYears, year)
                      setSelectedYears(nextYears)
                      setSelectedPeriods([])
                      applyDateWindowAndReload(
                        resolveCombinedTemporalRange({
                          years: nextYears,
                          months: selectedMonths,
                          periods: [],
                        })
                      )
                    }}
                    style={{
                      ...(selectedYears.includes(year) ? primaryButtonStyle : secondaryButtonStyle),
                      padding: '5px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>

              <strong style={{ fontSize: 12, color: '#cbd5e1', minWidth: 36 }}>Month</strong>
              <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                {FILTER_MONTHS.map((month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => {
                      // Year/Month mode is exclusive from quick Period presets.
                      const nextMonths = toggleInArray(selectedMonths, month)
                      setSelectedMonths(nextMonths)
                      setSelectedPeriods([])
                      applyDateWindowAndReload(
                        resolveCombinedTemporalRange({
                          years: selectedYears,
                          months: nextMonths,
                          periods: [],
                        })
                      )
                    }}
                    style={{
                      ...(selectedMonths.includes(month)
                        ? primaryButtonStyle
                        : secondaryButtonStyle),
                      padding: '5px 7px',
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 12, color: '#cbd5e1', minWidth: 36 }}>Period</strong>
              <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                {FILTER_PERIODS.map((period) => (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => {
                      // Quick Period mode is exclusive from Year/Month manual composition.
                      const nextPeriods = toggleInArray(selectedPeriods, period.id)
                      setSelectedPeriods(nextPeriods)
                      setSelectedYears([])
                      setSelectedMonths([])
                      applyDateWindowAndReload(
                        resolveCombinedTemporalRange({
                          years: [],
                          months: [],
                          periods: nextPeriods,
                        })
                      )
                    }}
                    style={{
                      ...(selectedPeriods.includes(period.id)
                        ? primaryButtonStyle
                        : secondaryButtonStyle),
                      padding: '5px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              <strong style={{ fontSize: 12, color: '#cbd5e1', minWidth: 28 }}>Date</strong>
              <button
                type="button"
                style={{
                  ...secondaryButtonStyle,
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                Select a date range ▾
              </button>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  const nextFrom = String(e.target.value || '')
                  setSelectedYears([])
                  setSelectedMonths([])
                  setSelectedPeriods([])
                  applyDateWindowAndReload({ from: nextFrom, to })
                }}
                style={{
                  borderRadius: 4,
                  border: '1px solid #334155',
                  padding: '6px 8px',
                  fontSize: 12,
                  color: '#e2e8f0',
                  background: 'rgba(2,6,23,0.45)',
                }}
              />
              <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  const nextTo = String(e.target.value || '')
                  setSelectedYears([])
                  setSelectedMonths([])
                  setSelectedPeriods([])
                  applyDateWindowAndReload({ from, to: nextTo })
                }}
                style={{
                  borderRadius: 4,
                  border: '1px solid #334155',
                  padding: '6px 8px',
                  fontSize: 12,
                  color: '#e2e8f0',
                  background: 'rgba(2,6,23,0.45)',
                }}
              />
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  ...secondaryButtonStyle,
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                Reset filters
              </button>
            </div>

            <div style={{ fontSize: 11, color: '#93c5fd' }}>
              Temporal mode: Year-Month / Period / Custom Date
              <span style={{ marginLeft: 8, color: '#67e8f9', fontWeight: 700 }}>
                Active: {temporalMode}
              </span>
            </div>
          </div>

          <div
            style={{
              minWidth: 180,
              border: '1px solid rgba(148,163,184,0.28)',
              borderRadius: 8,
              background: 'rgba(15,23,42,0.6)',
              padding: '10px 12px',
              display: 'grid',
              alignContent: 'center',
              gap: 4,
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 700 }}>Data Updated to</div>
            {isBusy ? (
              <div
                style={{
                  color: '#67e8f9',
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#67e8f9"
                    strokeWidth="2.5"
                    fill="none"
                    opacity="0.25"
                  />
                  <path
                    d="M12 3a9 9 0 0 1 9 9"
                    stroke="#67e8f9"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      type="rotate"
                      from="0 12 12"
                      to="360 12 12"
                      dur="0.9s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
                <span>Updating...</span>
              </div>
            ) : (
              <div style={{ color: '#67e8f9', fontSize: 20, fontWeight: 800 }}>{updatedToText}</div>
            )}
          </div>
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
        <div style={{ display: 'grid', gap: 4 }}>
          <div
            style={{
              fontSize: 12,
              color: '#94a3b8',
              fontWeight: 700,
              letterSpacing: 0.4,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span>Snapshot</span>
            <span
              style={{
                fontSize: 11,
                color: '#67e8f9',
                border: '1px solid rgba(103,232,249,0.35)',
                borderRadius: 999,
                padding: '2px 8px',
                background: 'rgba(8,47,73,0.4)',
              }}
            >
              Cards scope: full filtered selection
            </span>
            {summaryRefreshing ? (
              <span style={{ fontSize: 11, color: '#93c5fd' }}>Refreshing cards...</span>
            ) : null}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Riepilogo DB Live</div>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>
            Controllo rapido del perimetro filtrato, prima della tabella dettagliata.
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          }}
        >
          {summaryCards.map((card) => (
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

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => runIngestionControl('refresh')}
          disabled={ingestionBusy}
          style={secondaryButtonStyle}
        >
          {ingestionBusy ? 'Running action...' : 'Ingestion refresh'}
        </button>
        <button
          type="button"
          onClick={() => runIngestionControl('full-refresh')}
          disabled={ingestionBusy}
          style={secondaryButtonStyle}
        >
          Full refresh
        </button>
        <button
          type="button"
          onClick={() => runIngestionControl('clear-store')}
          disabled={ingestionBusy}
          style={secondaryButtonStyle}
        >
          Clear store
        </button>
        <button
          type="button"
          onClick={() => runIngestionControl('repair-identity')}
          disabled={ingestionBusy}
          style={secondaryButtonStyle}
        >
          Repair identity
        </button>
      </div>

      <div style={{ color: '#94a3b8', fontSize: 12 }}>
        Comandi operativi DB: refresh incrementale, full rebuild, pulizia store e riparazione
        identity.
      </div>

      {meta ? (
        <div
          style={{
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12,
            ...runtimeBadge.tone,
          }}
        >
          <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>{runtimeBadge.label}</div>
          <div style={{ marginTop: 4, opacity: 0.95 }}>{runtimeBadge.details}</div>
          <div style={{ marginTop: 6, fontSize: 11, opacity: 0.9 }}>
            Strict-live: {strictLive ? 'enabled' : 'disabled'}
          </div>
        </div>
      ) : null}

      {ingestionMessage ? (
        <div style={{ color: '#bbf7d0', fontSize: 12 }}>{ingestionMessage}</div>
      ) : null}
      {ingestionError ? (
        <div style={{ color: '#fecaca', fontSize: 12 }}>{ingestionError}</div>
      ) : null}

      {meta ? (
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(15,23,42,0.42)',
            }}
          >
            <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase' }}>
              Total users
            </div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>
              {Number(meta?.query?.total || 0)}
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(15,23,42,0.42)',
            }}
          >
            <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase' }}>
              Source mode
            </div>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
              {String(meta?.sourceRows?.sourceMode || 'n/a')}
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(15,23,42,0.42)',
            }}
          >
            <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase' }}>
              Freshness
            </div>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
              {String(meta?.freshness?.state || 'unknown')} ({formatAgeMs(meta?.freshness?.ageMs)})
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(15,23,42,0.42)',
            }}
          >
            <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase' }}>
              Quality score
            </div>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
              {Number(meta?.quality?.score || 0)}
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(15,23,42,0.42)',
            }}
          >
            <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase' }}>
              Page size
            </div>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
              {Number(meta?.query?.limit || limit)}
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(15,23,42,0.42)',
            }}
          >
            <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase' }}>Range</div>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
              {from} - {to}
            </div>
          </div>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(245,158,11,0.18)',
              background: 'rgba(15,23,42,0.42)',
            }}
          >
            <div style={{ fontSize: 11, color: '#fbbf24', textTransform: 'uppercase' }}>
              Missing identity
            </div>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#fde68a' }}>
              {Number(meta?.quality?.identityMissing?.count || 0)} (
              {Math.round(Number(meta?.quality?.identityMissing?.ratio || 0) * 10000) / 100}%)
            </div>
          </div>
        </div>
      ) : null}

      {Array.isArray(meta?.warnings) && meta.warnings.length ? (
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
          API warnings: {meta.warnings.join(', ')}
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
          <span>DB table</span>
          <span>
            Rows in page {visibleRows.length} - Offset {Number(meta?.query?.offset || 0)} / Total{' '}
            {Number(meta?.query?.total || 0)}
          </span>
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
                      padding: '10px 12px',
                      textAlign: column.align,
                      color: '#cbd5e1',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      borderBottom: '1px solid rgba(148,163,184,0.18)',
                    }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, rowIndex) => (
                <tr key={`${row.client_id}-${rowIndex}`}>
                  {COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      style={{
                        padding: '9px 12px',
                        textAlign: column.align,
                        color: '#e2e8f0',
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        borderBottom: '1px solid rgba(148,163,184,0.10)',
                      }}
                    >
                      {formatCellValue(column.type, row?.[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && !visibleRows.length ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    style={{ padding: 18, color: '#94a3b8', textAlign: 'center' }}
                  >
                    No rows available for the selected range.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => loadUsers({ cursor: prevCursor })}
          disabled={loading || !pageInfo.hasPrev}
          style={secondaryButtonStyle}
        >
          Previous cursor page
        </button>
        <button
          type="button"
          onClick={() => loadUsers({ cursor: nextCursor })}
          disabled={loading || !pageInfo.hasNext}
          style={secondaryButtonStyle}
        >
          Next cursor page
        </button>
        <div style={{ alignSelf: 'center', fontSize: 12, color: '#94a3b8' }}>
          Cursor active: {cursor ? 'yes' : 'start'} - Returned rows: {pageInfo.count}
        </div>
      </div>
    </div>
  )
}
