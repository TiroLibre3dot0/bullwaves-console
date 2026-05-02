import { useEffect, useMemo, useRef, useState } from 'react'
import { useQlikStatus } from '../../context/QlikStatusContext'
import {
  isQlikApiUnavailableError,
  loadCreolabsQlikClients,
  logCreolabsQlikFallbackBlocked,
  logCreolabsQlikFallbackUsed,
} from './services/creolabsService'
const moneyFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const intFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const TH = {
  padding: '8px 12px',
  textAlign: 'right',
  fontWeight: 600,
  fontSize: '0.75rem',
  color: '#94a3b8',
  borderBottom: '1px solid rgba(71,85,105,0.4)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  userSelect: 'none',
}
const TH_L = { ...TH, textAlign: 'left' }
const TD = {
  padding: '6px 12px',
  textAlign: 'right',
  fontSize: '0.82rem',
  borderBottom: '1px solid rgba(71,85,105,0.15)',
  whiteSpace: 'nowrap',
}
const TD_L = { ...TD, textAlign: 'left' }

const BRANDS = ['BW', 'BW Global', 'BW Prime']
const PAGE_SIZE = 100

const FOREX_COLS = [
  { key: 'brand', label: 'Brand', align: 'left', type: 'text' },
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
  { key: 'opened_trades', label: '# Opened Trades', align: 'right', type: 'int' },
]

const PRIME_COLS = [
  { key: 'year', label: 'Year', align: 'right', type: 'int' },
  { key: 'month', label: 'Month', align: 'left', type: 'text' },
  { key: 'year_month', label: 'Year Month', align: 'left', type: 'text' },
  { key: 'week', label: 'Week', align: 'left', type: 'text' },
  { key: 'date', label: 'Date', align: 'left', type: 'date' },
  { key: 'brand', label: 'Brand', align: 'left', type: 'text' },
  { key: 'affiliate_id', label: 'Affiliate ID', align: 'left', type: 'text' },
  { key: 'client_id', label: 'Client ID', align: 'left', type: 'text' },
  { key: 'client_name', label: 'Client Name', align: 'left', type: 'text' },
  { key: 'status', label: 'Status', align: 'left', type: 'text' },
  { key: 'country', label: 'Country', align: 'left', type: 'text' },
  { key: 'last_time_contact', label: 'Last Time Contact', align: 'left', type: 'text' },
  { key: 'ltc_group', label: 'LTC Group', align: 'left', type: 'text' },
  { key: 'last_time_call', label: 'Last Time Call', align: 'left', type: 'text' },
  { key: 'last_time_comment', label: 'Last Time Comment', align: 'left', type: 'text' },
  { key: 'pl', label: '$ PL', align: 'right', type: 'money' },
  { key: 'raw_pl', label: '$ Raw PL', align: 'right', type: 'money' },
  { key: 'pl_adjustment', label: '$ PL Adjustment', align: 'right', type: 'money' },
  { key: 'open_pl', label: '$ Open PL', align: 'right', type: 'money' },
  { key: 'closed_pl', label: '$ Closed PL', align: 'right', type: 'money' },
  { key: 'closed_vol', label: '$ Closed VOL', align: 'right', type: 'money' },
  { key: 'open_vol', label: '$ Open VOL', align: 'right', type: 'money' },
  { key: 'traders', label: '# Traders', align: 'right', type: 'int' },
  { key: 'trades', label: '# Trades', align: 'right', type: 'int' },
  { key: 'open_trades', label: '# Open Trades', align: 'right', type: 'int' },
  { key: 'rdp', label: '$ RDP', align: 'right', type: 'money' },
  { key: 'rdps', label: '# RDPs', align: 'right', type: 'int' },
  { key: 'wd', label: '$ WD', align: 'right', type: 'money' },
  { key: 'std', label: '$ STD', align: 'right', type: 'money' },
  { key: 'stds', label: '# STDs', align: 'right', type: 'int' },
  { key: 'ftd', label: '$ FTD', align: 'right', type: 'money' },
  { key: 'deposit', label: '$ Deposit', align: 'right', type: 'money' },
  { key: 'net', label: '$ Net', align: 'right', type: 'money' },
  { key: 'rdr', label: '% RDR', align: 'right', type: 'money' },
  { key: 'ftds', label: '# FTDs', align: 'right', type: 'int' },
  { key: 'leads', label: '# Leads', align: 'right', type: 'int' },
  { key: 'cr', label: '% CR', align: 'right', type: 'money' },
  { key: 'client_email', label: 'Client Email', align: 'left', type: 'text' },
]

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function parseHeaderRows(payload) {
  const headers = Array.isArray(payload?.headers) ? payload.headers : []
  const rows = Array.isArray(payload?.rows) ? payload.rows : []
  return rows.map((row) => {
    const out = {}
    for (let i = 0; i < headers.length; i += 1) out[headers[i]] = row?.[i]
    return out
  })
}

function mapQlikClientMonthToForexRow(row) {
  const closed = Number(row?.closedPL || 0)
  const open = Number(row?.openPL || 0)
  return {
    brand: row?.brand || '',
    affiliate_id: row?.affiliateId || '',
    client_id: row?.clientId || '',
    client_name: row?.clientName || '',
    client_login: row?.clientLogin || '',
    user: row?.user || '',
    country: row?.country || '',
    balance: Number(row?.balance || 0),
    ltv_commission: Number(row?.ltvCommission || 0),
    closed_pl: closed,
    open_pl: open,
    trades: Number(row?.trades || 0),
    ftd: Number(row?.ftd || 0),
    rdp: Number(row?.rdp || 0),
    deposit: Number(row?.deposit || 0),
    wd: Number(row?.wd || 0),
    net: Number(row?.net || 0),
    client_timestamp: '',
    ltd_date: '',
    ltt_date: '',
    equity: 0,
    clients_p: 0,
    year_month: row?.yearMonth || row?.periodId || '',
    opened_trades: 0,
  }
}

function mapQlikClientMonthToPrimeRow(row) {
  const closed = Number(row?.closedPL || 0)
  const open = Number(row?.openPL || 0)
  const pl = closed + open
  return {
    year: '',
    month: '',
    year_month: row?.yearMonth || row?.periodId || '',
    week: '',
    date: '',
    brand: row?.brand || '',
    affiliate_id: row?.affiliateId || '',
    client_id: row?.clientId || '',
    client_name: row?.clientName || '',
    status: '',
    country: row?.country || '',
    last_time_contact: '',
    ltc_group: '',
    last_time_call: '',
    last_time_comment: '',
    pl,
    raw_pl: pl,
    pl_adjustment: 0,
    open_pl: open,
    closed_pl: closed,
    closed_vol: 0,
    open_vol: 0,
    traders: 1,
    trades: Number(row?.trades || 0),
    open_trades: 0,
    rdp: Number(row?.rdp || 0),
    rdps: 0,
    wd: Number(row?.wd || 0),
    std: Number(row?.deposit || 0),
    stds: 0,
    ftd: Number(row?.ftd || 0),
    deposit: Number(row?.deposit || 0),
    net: Number(row?.net || 0),
    rdr: 0,
    ftds: 0,
    leads: 0,
    cr: 0,
    client_email: '',
  }
}

function getClientId(row) {
  return String(row?.clientId || row?.client_id || '').trim()
}

function buildPrimeCandidateClientIds(clientMonths = []) {
  const byClient = new Map()

  for (const row of clientMonths) {
    const clientId = getClientId(row)
    if (!clientId) continue

    const prev = byClient.get(clientId) || {
      closedPL: 0,
      openPL: 0,
      wd: 0,
      payoutCount: 0,
      payoutAmount: 0,
      isPayoutUser: false,
    }

    prev.closedPL += Number(row?.closedPL || 0)
    prev.openPL += Number(row?.openPL || 0)
    prev.wd += Number(row?.wd || 0)
    prev.payoutCount += Number(row?.payoutCount || 0)
    prev.payoutAmount += Number(row?.payoutAmount || 0)
    prev.isPayoutUser =
      prev.isPayoutUser || String(row?.isPayoutUser || '') === 'true' || Boolean(row?.isPayoutUser)

    byClient.set(clientId, prev)
  }

  const primeClientIds = new Set()
  for (const [clientId, metric] of byClient.entries()) {
    const explicitPayout =
      Boolean(metric?.isPayoutUser) ||
      Number(metric?.payoutCount || 0) > 0 ||
      Number(metric?.payoutAmount || 0) > 0 ||
      Number(metric?.wd || 0) > 0
    const positivePL =
      Number(metric?.closedPL || 0) > 0 ||
      Number(metric?.closedPL || 0) + Number(metric?.openPL || 0) > 0

    if (explicitPayout || positivePL) primeClientIds.add(clientId)
  }

  return primeClientIds
}

function fmt(type, value) {
  if (type === 'money') {
    const n = toNum(value)
    return n == null ? '—' : moneyFmt.format(n)
  }
  if (type === 'int') {
    const n = toNum(value)
    return n == null ? '—' : intFmt.format(Math.round(n))
  }
  if (type === 'date') {
    const t = String(value || '').trim()
    if (!t || t === '-') return '—'
    return t.length >= 10 ? t.slice(0, 10) : t
  }
  const t = String(value == null ? '' : value).trim()
  return t || '—'
}

function colorVal(n) {
  if (!Number.isFinite(n) || n === 0) return '#94a3b8'
  return n > 0 ? '#34d399' : '#f87171'
}

const SIGNED_COLOR_KEYS = new Set(['closed_pl', 'open_pl', 'net', 'pl', 'raw_pl', 'pl_adjustment'])

function getCellColor(col, rawValue) {
  if (!col || !SIGNED_COLOR_KEYS.has(col.key)) return '#e2e8f0'
  const n = toNum(rawValue)
  if (n == null) return '#94a3b8'
  return colorVal(n)
}

function SortArrow({ col, sortKey, dir }) {
  if (sortKey !== col) return <span style={{ opacity: 0.3, marginLeft: 3 }}>↕</span>
  return <span style={{ marginLeft: 3 }}>{dir === 'desc' ? '↓' : '↑'}</span>
}

export default function CreolabsPage() {
  const { reportQlikSource } = useQlikStatus()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forexRows, setForexRows] = useState([])
  const [primeRows, setPrimeRows] = useState([])
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [brandCached, setBrandCached] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [brand, setBrand] = useState('BW')
  const [sortKey, setSortKey] = useState('year_month')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showTopScrollbar, setShowTopScrollbar] = useState(false)

  const topScrollbarRef = useRef(null)
  const topScrollbarSizerRef = useRef(null)
  const tableViewportRef = useRef(null)
  const isSyncingScrollRef = useRef(false)

  function loadData(bustCache = false) {
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        // API-first: use the same Qlik source used by Prime Challenge ranking.
        const qlikPayload = await loadCreolabsQlikClients({ force: bustCache })
        if (cancelled) return

        const clientMonths = Array.isArray(qlikPayload?.data?.clientMonths)
          ? qlikPayload.data.clientMonths
          : []
        const literalPrimeRows = clientMonths.filter(
          (r) => String(r?.brand || '').trim() === 'BW Prime'
        )

        // Some Qlik snapshots expose only BW/BW Global labels; derive Prime cohort
        // using the same payout/positive-PL signal used by Prime ranking.
        const derivedPrimeClientIds = buildPrimeCandidateClientIds(clientMonths)
        const primeSourceRows =
          literalPrimeRows.length > 0
            ? literalPrimeRows
            : clientMonths.filter((r) => derivedPrimeClientIds.has(getClientId(r)))

        const primeClientIds = new Set(primeSourceRows.map((r) => getClientId(r)).filter(Boolean))

        const forex = clientMonths
          .filter((r) => !primeClientIds.has(getClientId(r)))
          .map(mapQlikClientMonthToForexRow)
        const prime = primeSourceRows.map((r) =>
          mapQlikClientMonthToPrimeRow({ ...r, brand: 'BW Prime' })
        )

        setForexRows(forex)
        setPrimeRows(prime)
        setPeriodFrom(String(qlikPayload?.data?.periodFrom || ''))
        setPeriodTo(String(qlikPayload?.data?.periodTo || ''))
        setBrandCached(Boolean(qlikPayload?.data?.cached))
        reportQlikSource('creolabs-overview', 'api')
      } catch (e) {
        if (cancelled) return

        // Strict policy: fallback only when API is unavailable.
        if (!isQlikApiUnavailableError(e)) {
          logCreolabsQlikFallbackBlocked('creolabs overview load', e)
          throw e
        }

        logCreolabsQlikFallbackUsed('creolabs overview load', e)
        const [forexPayload, primePayload] = await Promise.all([
          fetch('/traders_ranking_rewards_table.json').then((r) => r.json()),
          fetch('/prime_clients_ranking_table.json').then((r) => r.json()),
        ])
        if (cancelled) return

        const forex = parseHeaderRows(forexPayload)
        const prime = parseHeaderRows(primePayload)

        setForexRows(forex)
        setPrimeRows(prime)
        setBrandCached(false)
        reportQlikSource('creolabs-overview', 'local')
      }
    })()
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Errore durante il caricamento')
        reportQlikSource('creolabs-overview', 'local')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      })

    return () => {
      cancelled = true
    }
  }

  useEffect(() => {
    const cleanup = loadData(false)
    return () => {
      if (typeof cleanup === 'function') cleanup()
      reportQlikSource('creolabs-overview', null)
    }
  }, [reportQlikSource])

  // Silent background refresh — no loading spinner, doesn't interrupt the user.
  const silentInFlightRef = useRef(false)
  useEffect(() => {
    const INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

    const silentRefresh = async () => {
      if (silentInFlightRef.current) return
      silentInFlightRef.current = true
      try {
        const qlikPayload = await loadCreolabsQlikClients({ force: true })
        const clientMonths = Array.isArray(qlikPayload?.data?.clientMonths)
          ? qlikPayload.data.clientMonths
          : []
        const literalPrimeRows = clientMonths.filter(
          (r) => String(r?.brand || '').trim() === 'BW Prime'
        )
        const derivedPrimeClientIds = buildPrimeCandidateClientIds(clientMonths)
        const primeSourceRows =
          literalPrimeRows.length > 0
            ? literalPrimeRows
            : clientMonths.filter((r) => derivedPrimeClientIds.has(getClientId(r)))
        const primeClientIds = new Set(primeSourceRows.map((r) => getClientId(r)).filter(Boolean))
        const forex = clientMonths
          .filter((r) => !primeClientIds.has(getClientId(r)))
          .map(mapQlikClientMonthToForexRow)
        const prime = primeSourceRows.map((r) =>
          mapQlikClientMonthToPrimeRow({ ...r, brand: 'BW Prime' })
        )
        setForexRows(forex)
        setPrimeRows(prime)
        setPeriodFrom(String(qlikPayload?.data?.periodFrom || ''))
        setPeriodTo(String(qlikPayload?.data?.periodTo || ''))
        setBrandCached(Boolean(qlikPayload?.data?.cached))
        reportQlikSource('creolabs-overview', 'api')
      } catch {
        // Ignore errors on silent refresh — keep showing current data.
      } finally {
        silentInFlightRef.current = false
      }
    }

    const timerId = window.setInterval(silentRefresh, INTERVAL_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') silentRefresh()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(timerId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reportQlikSource])

  function handleRefreshBrands() {
    setRefreshing(true)
    loadData(true)
  }

  const cols = brand === 'BW Prime' ? PRIME_COLS : FOREX_COLS

  useEffect(() => {
    if (!cols.some((c) => c.key === sortKey)) {
      setSortKey(cols[0]?.key || 'client_id')
      setSortDir('asc')
    }
    setPage(0)
  }, [brand])

  const rows = useMemo(() => {
    let base
    if (brand === 'BW Prime') {
      base = primeRows.filter((r) => String(r.brand || '').trim() === 'BW Prime')
    } else {
      const exact = forexRows.filter((r) => String(r.brand || '').trim() === brand)
      if (brand === 'BW Global' && exact.length === 0) {
        // Temporary fallback: Qlik may emit BW label for BW Global clients.
        base = forexRows.filter((r) => String(r.brand || '').trim() === 'BW')
      } else {
        base = exact
      }
    }

    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter((r) =>
      Object.values(r || {}).some((v) =>
        String(v == null ? '' : v)
          .toLowerCase()
          .includes(q)
      )
    )
  }, [brand, forexRows, primeRows, search])

  const isBwGlobalFallback = useMemo(() => {
    if (brand !== 'BW Global') return false
    const globalCount = forexRows.filter((r) => String(r.brand || '').trim() === 'BW Global').length
    const bwCount = forexRows.filter((r) => String(r.brand || '').trim() === 'BW').length
    return globalCount === 0 && bwCount > 0
  }, [brand, forexRows])

  const sorted = useMemo(() => {
    const dir = sortDir === 'desc' ? -1 : 1
    return [...rows].sort((a, b) => {
      const av = a?.[sortKey]
      const bv = b?.[sortKey]
      const an = toNum(av)
      const bn = toNum(bv)
      if (an != null && bn != null) return dir * (an - bn)
      return dir * String(av == null ? '' : av).localeCompare(String(bv == null ? '' : bv))
    })
  }, [rows, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Prime-scope aggregate: identical to Prime Challenge ranking logic.
  // Aggregates by unique clientId across all periods — no active filters applied.
  const primeScope = useMemo(() => {
    if (!primeRows.length) return null
    const byClient = new Map()
    for (const r of primeRows) {
      const id = String(r.client_id || '').trim()
      if (!id) continue
      const prev = byClient.get(id) || { wd: 0, deposit: 0, closed_pl: 0 }
      prev.wd += toNum(r.wd) ?? 0
      prev.deposit += toNum(r.deposit) ?? 0
      prev.closed_pl += toNum(r.closed_pl) ?? 0
      byClient.set(id, prev)
    }
    const clients = [...byClient.values()]
    const totalWd = clients.reduce((a, c) => a + c.wd, 0)
    const totalDeposit = clients.reduce((a, c) => a + c.deposit, 0)
    const totalClosedPL = clients.reduce((a, c) => a + c.closed_pl, 0)
    return { clientCount: clients.length, totalWd, totalDeposit, totalClosedPL }
  }, [primeRows])

  const stats = useMemo(() => {
    if (!rows.length) return null
    const uniqueClients = new Set(
      rows.map((r) => String(r.client_id || r.clientId || '')).filter(Boolean)
    )
    const sum = (key) =>
      rows.reduce((acc, r) => {
        const n = toNum(r[key])
        return n != null ? acc + n : acc
      }, 0)
    if (brand === 'BW Prime') {
      return [
        { label: 'Clienti unici', value: intFmt.format(uniqueClients.size), color: '#94a3b8' },
        { label: 'Righe dataset', value: intFmt.format(rows.length), color: '#94a3b8' },
        { label: 'PL Totale', value: moneyFmt.format(sum('pl')), color: colorVal(sum('pl')) },
        {
          label: 'Closed PL',
          value: moneyFmt.format(sum('closed_pl')),
          color: colorVal(sum('closed_pl')),
        },
        {
          label: 'Open PL',
          value: moneyFmt.format(sum('open_pl')),
          color: colorVal(sum('open_pl')),
        },
        { label: 'Deposit Totale', value: moneyFmt.format(sum('deposit')), color: '#60a5fa' },
        { label: 'Net Totale', value: moneyFmt.format(sum('net')), color: colorVal(sum('net')) },
        { label: 'FTD Totale', value: moneyFmt.format(sum('ftd')), color: '#60a5fa' },
        { label: 'WD Totale', value: moneyFmt.format(sum('wd')), color: '#f87171' },
        { label: 'Trades Totali', value: intFmt.format(sum('trades')), color: '#94a3b8' },
      ]
    }
    return [
      { label: 'Clienti unici', value: intFmt.format(uniqueClients.size), color: '#94a3b8' },
      { label: 'Righe dataset', value: intFmt.format(rows.length), color: '#94a3b8' },
      { label: 'Balance Totale', value: moneyFmt.format(sum('balance')), color: '#60a5fa' },
      {
        label: 'Closed PL',
        value: moneyFmt.format(sum('closed_pl')),
        color: colorVal(sum('closed_pl')),
      },
      { label: 'Open PL', value: moneyFmt.format(sum('open_pl')), color: colorVal(sum('open_pl')) },
      { label: 'Deposit Totale', value: moneyFmt.format(sum('deposit')), color: '#60a5fa' },
      { label: 'Net Totale', value: moneyFmt.format(sum('net')), color: colorVal(sum('net')) },
      { label: 'FTD Totale', value: moneyFmt.format(sum('ftd')), color: '#60a5fa' },
      { label: 'WD Totale', value: moneyFmt.format(sum('wd')), color: '#f87171' },
      { label: 'Trades Totali', value: intFmt.format(sum('trades')), color: '#94a3b8' },
      {
        label: 'Equity Totale',
        value: moneyFmt.format(sum('equity')),
        color: colorVal(sum('equity')),
      },
      { label: 'LTV Commission', value: moneyFmt.format(sum('ltv_commission')), color: '#a78bfa' },
    ]
  }, [rows, brand, primeScope])

  useEffect(() => {
    const updateScrollMetrics = () => {
      const viewportEl = tableViewportRef.current
      const sizerEl = topScrollbarSizerRef.current
      if (!viewportEl || !sizerEl) return

      sizerEl.style.width = `${viewportEl.scrollWidth}px`
      setShowTopScrollbar(viewportEl.scrollWidth > viewportEl.clientWidth)

      const topEl = topScrollbarRef.current
      if (topEl && topEl.scrollLeft !== viewportEl.scrollLeft) {
        topEl.scrollLeft = viewportEl.scrollLeft
      }
    }

    const rafId = requestAnimationFrame(updateScrollMetrics)
    window.addEventListener('resize', updateScrollMetrics)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', updateScrollMetrics)
    }
  }, [brand, cols, error, loading, page, pageRows.length, search, sorted.length])

  function syncFromTopScroll(e) {
    if (isSyncingScrollRef.current) return
    const viewportEl = tableViewportRef.current
    if (!viewportEl) return
    isSyncingScrollRef.current = true
    viewportEl.scrollLeft = e.currentTarget.scrollLeft
    isSyncingScrollRef.current = false
  }

  function syncFromViewportScroll(e) {
    if (isSyncingScrollRef.current) return
    const topEl = topScrollbarRef.current
    if (!topEl) return
    isSyncingScrollRef.current = true
    topEl.scrollLeft = e.currentTarget.scrollLeft
    isSyncingScrollRef.current = false
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-label">CREOLABS</p>
          <h1 className="page-title">Forex vs Prime - Full Fields</h1>
          <p className="page-subtitle">
            Forex (BW, BW Global) con schema completo + Prime (BW Prime) da Prime Clients Ranking.
            {periodFrom && periodTo ? ` Range live brand map: ${periodFrom} -> ${periodTo}` : ''}
          </p>
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {BRANDS.map((b) => (
          <button
            key={b}
            className={`pill-tab${brand === b ? ' active' : ''}`}
            onClick={() => {
              setBrand(b)
              setPage(0)
            }}
          >
            {b}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {brandCached && (
            <span
              style={{
                fontSize: '0.72rem',
                color: '#f59e0b',
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              ⚠ cache attiva
            </span>
          )}
          <button
            onClick={handleRefreshBrands}
            disabled={refreshing || loading}
            style={{
              fontSize: '0.75rem',
              padding: '4px 12px',
              borderRadius: 8,
              border: '1px solid rgba(99,102,241,0.4)',
              background: 'rgba(99,102,241,0.12)',
              color: '#a5b4fc',
              cursor: 'pointer',
              opacity: refreshing || loading ? 0.5 : 1,
            }}
          >
            {refreshing ? '⟳ Ricarico…' : '⟳ Ricarica brand da Qlik'}
          </button>
        </div>
      </div>

      {!loading && !error && stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: brand !== 'BW Prime' && primeScope ? 10 : 18,
          }}
        >
          {stats.map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(71,85,105,0.3)',
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.7rem',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Prime-scope comparison bar — shown on Forex tabs so numbers are comparable with Prime Challenge */}
      {!loading && !error && brand !== 'BW Prime' && primeScope && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          {[
            {
              label: 'Prime – Clienti unici',
              value: intFmt.format(primeScope.clientCount),
              color: '#94a3b8',
            },
            {
              label: 'Prime – WD/Payout (same scope as Ranking)',
              value: moneyFmt.format(primeScope.totalWd),
              color: '#f87171',
            },
            {
              label: 'Prime – Deposit',
              value: moneyFmt.format(primeScope.totalDeposit),
              color: '#60a5fa',
            },
            {
              label: 'Prime – Closed PL',
              value: moneyFmt.format(primeScope.totalClosedPL),
              color: colorVal(primeScope.totalClosedPL),
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 180,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.65rem',
                  color: '#6366f1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 5,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          {isBwGlobalFallback && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#fbbf24',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid rgba(251,191,36,0.35)',
                background: 'rgba(251,191,36,0.1)',
              }}
            >
              Qlik live sta etichettando BW Global come BW: fallback attivo.
            </span>
          )}
          <input
            type="text"
            placeholder="Cerca su tutte le voci..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(71,85,105,0.45)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#e2e8f0',
              fontSize: '0.82rem',
              width: 280,
              outline: 'none',
            }}
          />
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
            {intFmt.format(rows.length)} righe · p. {page + 1}/{totalPages}
          </span>
        </div>
      )}

      <section className="card-block" style={{ padding: 0 }}>
        {error ? (
          <div
            style={{
              padding: 20,
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 12,
              background: 'rgba(127,29,29,0.2)',
              color: '#fecaca',
            }}
          >
            {error}
          </div>
        ) : loading ? (
          <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
            Caricamento dataset completi...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
            Nessun dato trovato per {brand}.
          </div>
        ) : (
          <>
            <div
              ref={topScrollbarRef}
              onScroll={syncFromTopScroll}
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                height: 14,
                display: showTopScrollbar ? 'block' : 'none',
                borderBottom: '1px solid rgba(71,85,105,0.25)',
              }}
            >
              <div ref={topScrollbarSizerRef} style={{ height: 1 }} />
            </div>

            <div
              ref={tableViewportRef}
              onScroll={syncFromViewportScroll}
              style={{ overflow: 'auto', maxHeight: '68vh' }}
            >
              <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      background: 'rgba(30,41,59,0.95)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                    }}
                  >
                    {cols.map((c) => (
                      <th
                        key={c.key}
                        style={c.align === 'left' ? TH_L : TH}
                        onClick={() => handleSort(c.key)}
                      >
                        {c.label}
                        <SortArrow col={c.key} sortKey={sortKey} dir={sortDir} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, idx) => (
                    <tr
                      key={`${brand}-${idx}`}
                      style={{ background: idx % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'transparent' }}
                    >
                      {cols.map((c) => {
                        const raw = row?.[c.key]
                        const textColor = getCellColor(c, raw)
                        const baseStyle = c.align === 'left' ? TD_L : TD
                        return (
                          <td key={c.key} style={{ ...baseStyle, color: textColor }}>
                            {fmt(c.type, raw)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {!loading && !error && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            className="pill-tab"
            style={{ opacity: page === 0 ? 0.4 : 1 }}
          >
            ««
          </button>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="pill-tab"
            style={{ opacity: page === 0 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ padding: '6px 12px', color: '#94a3b8', fontSize: '0.82rem' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="pill-tab"
            style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }}
          >
            Next →
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="pill-tab"
            style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }}
          >
            »»
          </button>
        </div>
      )}
    </div>
  )
}
