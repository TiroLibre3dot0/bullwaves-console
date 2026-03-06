import React, { useEffect, useMemo, useState } from 'react'
import PnLTrendChart from '../../../components/PnLTrendChart'
import CardSection from '../../../components/common/CardSection'
import FilterBar from '../../../components/common/FilterBar'
import KpiCard from '../../../components/common/KpiCard'
import YearSelector from '../../../components/common/YearSelector'
import FullPageLoader from '../../../components/FullPageLoader'
import {
  formatEuro,
  formatEuroFull,
  formatNumber,
  formatNumberShort,
  formatPercent,
  formatPercentRounded,
} from '../../../lib/formatters'
import { useCellxInvestmentsData } from '../../cellx/hooks/useCellxInvestmentsData'
import { useAffiliateLedger } from '../../media-payments/hooks/useAffiliateLedger'
import { useCreolabsBreakdownData } from '../../creolabs/hooks/useCreolabsBreakdownData'
import { loadAffiliateIndexById } from '../../ranking/services/rankingService'
import { checkDataStatus } from '../../../utils/dataStatusChecker'
import { useDataStatus } from '../../../context/DataStatusContext'
import { useI18n } from '../../../i18n/I18nContext'
import { getPublicShareOrigin } from '../../../utils/publicShareOrigin'
import AffiliatePayoutUnifiedTable from './AffiliatePayoutUnifiedTable'
import StickyMetricsTable from './StickyMetricsTable'
import { formatMonthReference } from '../utils/formatMonthReference'

const selectStyle = {
  minWidth: 180,
  background: '#0d1a2c',
  color: 'var(--text)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '8px 10px',
}
const formatNumberFull = (value) => formatNumber(value)
const FINANCE_CONFIRMED_KEY = 'affiliate-finance-confirmed'
const INVESTMENTS_SOURCE_KEY = 'investments-data-source'
const INVESTMENTS_VIEW_MODE_KEY = 'investments-view-mode'

const roiPillStyle = (roi) => {
  const isPositive = Number(roi) > 0
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    border: `1px solid ${isPositive ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
    background: isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
    color: isPositive ? '#34d399' : '#f87171',
  }
}
const toIntlLocale = (locale) => {
  if (locale === 'it') return 'it-IT'
  if (locale === 'sr') return 'sr-RS'
  return 'en-US'
}

const monthLabel = (locale, m) => {
  const parts = (m || '').split('-')
  if (parts.length < 2) return m

  const year = Number(parts[0])
  const monthIdx = Number(parts[1]) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIdx) || monthIdx < 0 || monthIdx > 11)
    return m

  try {
    const date = new Date(year, monthIdx, 1)
    return new Intl.DateTimeFormat(toIntlLocale(locale), {
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return m
  }
}

function PublicShareHero({ title, t, searchDraft, setSearchDraft, autoFocus, children }) {
  return (
    <div style={{ paddingTop: 18, paddingBottom: 6 }}>
      <div style={{ maxWidth: 1800, width: '100%', margin: '0 auto', padding: '0 14px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, textAlign: 'center' }}>{title}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            autoFocus={autoFocus}
            placeholder={t('investments.search.placeholder')}
            aria-label={t('investments.search.aria')}
            style={{
              width: 'min(860px, 100%)',
              padding: '14px 16px',
              fontSize: 16,
              fontWeight: 800,
              borderRadius: 14,
              outline: 'none',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          />
        </div>

        {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}
      </div>
    </div>
  )
}

function PublicShareFiltersRow({
  t,
  availableYears,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  monthOptions,
  viewMode,
  requestViewMode,
  dataSource,
  requestDataSource,
  sourceDisabled = false,
  sourceHint,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <YearSelector
        availableYears={availableYears}
        value={selectedYear}
        onChange={(val) => {
          setSelectedYear(val)
          setSelectedMonth('all')
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{t('investments.filters.month')}</span>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ ...selectStyle, minWidth: 160 }}
        >
          <option value="all">{t('investments.filters.allMonths')}</option>
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <ModeControls
        t={t}
        viewMode={viewMode}
        requestViewMode={requestViewMode}
        dataSource={dataSource}
        requestDataSource={requestDataSource}
        sourceDisabled={sourceDisabled}
        sourceHint={sourceHint}
      />
    </div>
  )
}

function ModeControls({
  t,
  viewMode,
  requestViewMode,
  dataSource,
  requestDataSource,
  sourceDisabled = false,
  sourceHint,
}) {
  const cellxpertLabel = t('investments.source.cellxpert')
  const creolabsLabel = t('investments.source.creolabs')
  const singleModeLabel = t('investments.viewMode.single')
  const unifiedModeLabel = t('investments.viewMode.unified')

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          gap: 8,
          padding: 6,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
        }}
        aria-label={t('investments.viewMode.aria')}
      >
        <button
          type="button"
          className={viewMode === 'single' ? 'btn' : 'btn secondary'}
          onClick={() => requestViewMode('single')}
          aria-pressed={viewMode === 'single'}
          style={{ padding: '6px 10px', fontSize: 12, borderRadius: 999 }}
        >
          {singleModeLabel}
        </button>
        <button
          type="button"
          className={viewMode === 'unified' ? 'btn' : 'btn secondary'}
          onClick={() => requestViewMode('unified')}
          aria-pressed={viewMode === 'unified'}
          style={{ padding: '6px 10px', fontSize: 12, borderRadius: 999 }}
        >
          {unifiedModeLabel}
        </button>
      </div>

      <div
        style={{
          display: 'inline-flex',
          gap: 8,
          padding: 6,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          ...(sourceDisabled ? { opacity: 0.65 } : null),
        }}
        aria-label={t('investments.filters.source')}
        title={sourceHint}
      >
        <button
          type="button"
          className={dataSource === 'cellxpert' ? 'btn' : 'btn secondary'}
          onClick={sourceDisabled ? undefined : () => requestDataSource('cellxpert')}
          disabled={sourceDisabled}
          aria-disabled={sourceDisabled ? 'true' : undefined}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 999,
            whiteSpace: 'nowrap',
            ...(dataSource === 'cellxpert'
              ? {}
              : {
                  background: 'transparent',
                  opacity: 0.85,
                }),
          }}
        >
          {cellxpertLabel}
        </button>
        <button
          type="button"
          className={dataSource === 'creolabs' ? 'btn' : 'btn secondary'}
          onClick={sourceDisabled ? undefined : () => requestDataSource('creolabs')}
          disabled={sourceDisabled}
          aria-disabled={sourceDisabled ? 'true' : undefined}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 999,
            whiteSpace: 'nowrap',
            ...(dataSource === 'creolabs'
              ? {}
              : {
                  background: 'transparent',
                  opacity: 0.85,
                }),
          }}
        >
          {creolabsLabel}
        </button>
      </div>
    </div>
  )
}

export default function InvestmentsDashboard(props) {
  const {
    initialSelectedYear = 'all',
    initialSelectedMonth = 'all',
    initialSearch = '',
    initialSource = '',
    initialViewMode = '',
    hideTimelineChart = false,
    isPublicShare = false,
  } = props || {}

  const { t, locale } = useI18n()

  const [viewMode, setViewMode] = useState(() => {
    const initial = String(initialViewMode || '').trim()
    if (initial === 'single' || initial === 'unified') return initial
    try {
      const stored = String(localStorage.getItem(INVESTMENTS_VIEW_MODE_KEY) || '').trim()
      if (stored === 'single' || stored === 'unified') return stored
    } catch {
      // ignore
    }
    return 'single'
  })

  useEffect(() => {
    try {
      localStorage.setItem(INVESTMENTS_VIEW_MODE_KEY, viewMode)
    } catch {
      // ignore
    }
  }, [viewMode])

  const [displayViewMode, setDisplayViewMode] = useState(viewMode)

  const cellxpert = useCellxInvestmentsData({ includePayments: viewMode !== 'unified' })
  const creolabs = useCreolabsBreakdownData()

  useEffect(() => {
    // Dev-only diagnostics to understand why CellX data might appear empty in share/unified.
    try {
      if (!import.meta?.env?.DEV) return
    } catch {
      return
    }

    const mediaCount = Array.isArray(cellxpert?.mediaRows) ? cellxpert.mediaRows.length : -1
    const paymentsCount = Array.isArray(cellxpert?.payments) ? cellxpert.payments.length : -1

    // Log only when the signature changes to avoid noisy spam.
    const sig = `${viewMode}|${cellxpert?.loading}|${mediaCount}|${paymentsCount}|${cellxpert?.mediaSource}|${cellxpert?.paymentsSource}|${String(cellxpert?.error?.message || '')}`

    if (window.__bw_cellx_sig === sig) return

    window.__bw_cellx_sig = sig

    const debug = {
      viewMode,
      loading: Boolean(cellxpert?.loading),
      mediaRows: mediaCount,
      payments: paymentsCount,
      mediaSource: cellxpert?.mediaSource,
      paymentsSource: cellxpert?.paymentsSource,
      error: cellxpert?.error ? String(cellxpert.error?.message || cellxpert.error) : null,
    }

    window.__bw_cellx_debug = debug

    console.warn('[Unified][CellX]', debug)
  }, [
    viewMode,
    cellxpert?.loading,
    cellxpert?.mediaRows?.length,
    cellxpert?.payments?.length,
    cellxpert?.mediaSource,
    cellxpert?.paymentsSource,
    cellxpert?.error,
  ])

  const [dataSource, setDataSource] = useState(() => {
    const initial = String(initialSource || '').trim()
    if (initial === 'cellxpert' || initial === 'creolabs') return initial
    try {
      const stored = String(localStorage.getItem(INVESTMENTS_SOURCE_KEY) || '').trim()
      if (stored === 'cellxpert' || stored === 'creolabs') return stored
    } catch {
      // ignore
    }
    return 'cellxpert'
  })

  // Payments columns are shown for both sources.
  // For Creolabs we reuse CellXpert payments as denominator for ROI (see InvestmentsDashboardContent).
  const showCommissionColumns = true
  const affiliateSummaryColSpan = (showCommissionColumns ? 11 : 9) + (isPublicShare ? 0 : 2)

  useEffect(() => {
    try {
      localStorage.setItem(INVESTMENTS_SOURCE_KEY, dataSource)
    } catch {
      // ignore
    }
  }, [dataSource])

  const [displaySource, setDisplaySource] = useState(dataSource)
  const [softSwitchLoading, setSoftSwitchLoading] = useState(false)

  const selectedActiveData = dataSource === 'creolabs' ? creolabs : cellxpert
  const selectedLoading = Boolean(selectedActiveData?.loading)

  const displayActiveData = displaySource === 'creolabs' ? creolabs : cellxpert
  const { payments, mediaRows, loading } = displayActiveData

  const [dataCache, setDataCache] = useState(() => ({
    cellxpert: { payments: [], mediaRows: [] },
    creolabs: { payments: [], mediaRows: [] },
  }))

  const [selectedYear, setSelectedYear] = useState(initialSelectedYear || 'all')
  const [selectedMonth, setSelectedMonth] = useState(initialSelectedMonth || 'all')
  const [search, setSearch] = useState(initialSearch || '')
  const [showAllAffiliates, setShowAllAffiliates] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [financeConfirmed, setFinanceConfirmed] = useState({})
  const { setDataStatus } = useDataStatus()

  useEffect(() => {
    if (cellxpert?.loading) return
    setDataCache((prev) => ({
      ...prev,
      cellxpert: {
        payments: Array.isArray(cellxpert?.payments) ? cellxpert.payments : [],
        mediaRows: Array.isArray(cellxpert?.mediaRows) ? cellxpert.mediaRows : [],
      },
    }))
  }, [
    cellxpert?.loading,
    cellxpert?.mediaSource,
    cellxpert?.paymentsSource,
    cellxpert?.mediaRows?.length,
    cellxpert?.payments?.length,
  ])

  useEffect(() => {
    if (creolabs?.loading) return
    setDataCache((prev) => ({
      ...prev,
      creolabs: {
        payments: Array.isArray(creolabs?.payments) ? creolabs.payments : [],
        mediaRows: Array.isArray(creolabs?.mediaRows) ? creolabs.mediaRows : [],
      },
    }))
  }, [creolabs?.loading, creolabs?.mediaRows?.length, creolabs?.payments?.length])

  useEffect(() => {
    // When the newly selected source has finished loading, remove the overlay.
    if (!selectedLoading && dataSource === displaySource) {
      setSoftSwitchLoading(false)
    }
  }, [dataSource, displaySource, selectedLoading])

  useEffect(() => {
    // Clear the overlay after a view-mode transition completes and data is ready.
    if (!softSwitchLoading) return
    if (viewMode !== displayViewMode) return

    if (displayViewMode === 'unified') {
      if (Boolean(cellxpert?.loading) || Boolean(creolabs?.loading)) return
    } else {
      if (selectedLoading) return
      if (dataSource !== displaySource) return
    }

    const id = window.setTimeout(() => setSoftSwitchLoading(false), 0)
    return () => window.clearTimeout(id)
  }, [
    softSwitchLoading,
    viewMode,
    displayViewMode,
    cellxpert?.loading,
    creolabs?.loading,
    selectedLoading,
    dataSource,
    displaySource,
  ])

  const requestViewMode = (next) => {
    if (next !== 'single' && next !== 'unified') return
    if (next === viewMode) return

    setViewMode(next)
    setSoftSwitchLoading(true)

    // Let the overlay paint before swapping the heavy subtree.
    try {
      window.requestAnimationFrame(() => setDisplayViewMode(next))
    } catch {
      window.setTimeout(() => setDisplayViewMode(next), 0)
    }
  }

  const requestDataSource = (next) => {
    if (next === dataSource) return
    setDataSource(next)
    setSoftSwitchLoading(true)

    // Let the overlay paint before swapping the heavy dataset (ledger computations).
    try {
      window.requestAnimationFrame(() => setDisplaySource(next))
    } catch {
      // Fallback for environments without requestAnimationFrame.
      window.setTimeout(() => setDisplaySource(next), 0)
    }
  }

  const cached = dataCache[displaySource] || { payments: [], mediaRows: [] }
  const shownPayments = loading ? cached.payments : payments
  const shownMediaRows = loading ? cached.mediaRows : mediaRows
  const shouldShowFullLoader = loading && !shownPayments?.length && !shownMediaRows?.length

  const cellxCached = dataCache.cellxpert || { payments: [], mediaRows: [] }
  const creolabsCached = dataCache.creolabs || { payments: [], mediaRows: [] }
  const cellxShownPayments = cellxpert?.loading ? cellxCached.payments : cellxpert?.payments
  const cellxShownMediaRows = cellxpert?.loading ? cellxCached.mediaRows : cellxpert?.mediaRows
  const creoShownPayments = creolabs?.loading ? creolabsCached.payments : creolabs?.payments
  const creoShownMediaRows = creolabs?.loading ? creolabsCached.mediaRows : creolabs?.mediaRows

  const unifiedShouldShowFullLoader =
    (Boolean(cellxpert?.loading) && !cellxShownPayments?.length && !cellxShownMediaRows?.length) ||
    (Boolean(creolabs?.loading) && !creoShownPayments?.length && !creoShownMediaRows?.length)

  const isViewModeTransitioning = viewMode !== displayViewMode

  useEffect(() => {
    try {
      const rawFinance = localStorage.getItem(FINANCE_CONFIRMED_KEY)
      if (rawFinance) {
        const parsed = JSON.parse(rawFinance)
        if (parsed && typeof parsed === 'object') setFinanceConfirmed(parsed)
      }
    } catch (e) {
      console.warn('Unable to load finance confirmations', e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(FINANCE_CONFIRMED_KEY, JSON.stringify(financeConfirmed))
    } catch (e) {
      console.warn('Unable to persist finance confirmations', e)
    }
  }, [financeConfirmed])

  // Carica status dati
  useEffect(() => {
    async function loadDataStatus() {
      try {
        const resp = await fetch('/Payments Report.csv')
        if (!resp.ok) return
        const text = await resp.text()
        const lines = text.split(/\r?\n/).filter((line) => line.trim())
        if (lines.length < 2) return
        const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim())
        const rows = lines.slice(1).map((line) => {
          const cols = line.split(',').map((v) => v.replace(/"/g, '').trim())
          const row = {}
          headers.forEach((h, idx) => {
            row[h] = cols[idx] || ''
          })
          return row
        })
        // Trova colonna data, usa 'Date' o simili
        const dateKey = headers.find((h) => h.toLowerCase().includes('date')) || headers[0]
        const status = checkDataStatus(rows, dateKey, 'Payments Report')
        setDataStatus(status)
      } catch (err) {
        console.error('Failed to load payments for status', err)
      }
    }
    loadDataStatus()
  }, [])

  if (viewMode === 'unified' ? unifiedShouldShowFullLoader : shouldShowFullLoader) {
    return <FullPageLoader progress={45} subtitle={t('investments.loader.data')} />
  }

  const commonProps = {
    t,
    locale,
    isPublicShare,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    search,
    setSearch,
    dataSource,
    requestDataSource,
    showCommissionColumns,
    affiliateSummaryColSpan,
    viewMode,
    requestViewMode,
    softSwitchLoading:
      isViewModeTransitioning ||
      (displayViewMode === 'unified'
        ? Boolean(cellxpert?.loading) || Boolean(creolabs?.loading)
        : softSwitchLoading || dataSource !== displaySource || selectedLoading),
    softSwitchLabel: isViewModeTransitioning
      ? viewMode === 'unified'
        ? t('investments.viewMode.unified')
        : t('investments.viewMode.single')
      : displayViewMode === 'unified'
        ? t('investments.viewMode.unified')
        : displaySource === 'creolabs'
          ? t('investments.source.creolabs')
          : t('investments.source.cellxpert'),
    hideTimelineChart,
  }

  if (displayViewMode === 'unified') {
    if (unifiedShouldShowFullLoader) return <FullPageLoader />
    return (
      <InvestmentsDashboardUnifiedContent
        {...commonProps}
        cellxPayments={cellxShownPayments}
        cellxMediaRows={cellxShownMediaRows}
        creolabsPayments={creoShownPayments}
        creolabsMediaRows={creoShownMediaRows}
      />
    )
  }

  return (
    <InvestmentsDashboardContent
      {...commonProps}
      payments={shownPayments}
      mediaRows={shownMediaRows}
      cellxPaymentsForRoi={cellxShownPayments}
      showAllAffiliates={showAllAffiliates}
      setShowAllAffiliates={setShowAllAffiliates}
      expanded={expanded}
      setExpanded={setExpanded}
      financeConfirmed={financeConfirmed}
      setFinanceConfirmed={setFinanceConfirmed}
    />
  )
}

function InvestmentsDashboardContent({
  t,
  locale,
  isPublicShare,
  payments,
  mediaRows,
  cellxPaymentsForRoi,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  search,
  setSearch,
  dataSource,
  requestDataSource,
  showCommissionColumns,
  affiliateSummaryColSpan,
  viewMode,
  requestViewMode,
  softSwitchLoading,
  softSwitchLabel,
  showAllAffiliates,
  setShowAllAffiliates,
  expanded,
  setExpanded,
  financeConfirmed,
  setFinanceConfirmed,
  hideTimelineChart,
}) {
  const [affiliateIndexById, setAffiliateIndexById] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const byId = await loadAffiliateIndexById({ force: false })
        if (!cancelled) setAffiliateIndexById(byId)
      } catch {
        if (!cancelled) setAffiliateIndexById(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const [searchDraft, setSearchDraft] = useState(search)

  useEffect(() => {
    setSearchDraft(search)
  }, [search])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchDraft)
    }, 250)
    return () => window.clearTimeout(id)
  }, [searchDraft, setSearch])

  const effectivePayments = useMemo(() => {
    if (dataSource === 'creolabs') {
      return Array.isArray(cellxPaymentsForRoi) ? cellxPaymentsForRoi : []
    }
    return Array.isArray(payments) ? payments : []
  }, [dataSource, payments, cellxPaymentsForRoi])

  const effectiveMediaRows = useMemo(() => {
    const baseRows = Array.isArray(mediaRows) ? mediaRows : []
    if (dataSource !== 'creolabs') return baseRows

    // For Creolabs single-source view we want the same payments column as CellXpert.
    // We therefore override the commission field per affiliate+month using CellXpert payments sums,
    // so ROI (= netDeposits / commission - 1) uses these values as denominator.
    const paymentsByAffMonth = new Map()
    for (const p of effectivePayments) {
      const affiliateId = String(p?.affiliateId || p?.affiliate || '—').trim() || '—'
      const year = Number(p?.year)
      const monthIndex = Number(p?.monthIndex)
      if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0) continue
      const amount = Number(p?.amount)
      if (!Number.isFinite(amount)) continue
      const key = `${affiliateId}|${year}|${monthIndex}`
      paymentsByAffMonth.set(key, (paymentsByAffMonth.get(key) || 0) + amount)
    }

    return baseRows.map((m) => {
      const affiliateId = String(m?.affiliateId || m?.uid || m?.affiliate || '—').trim() || '—'
      const year = Number(m?.year)
      const monthIndex = Number(m?.monthIndex)
      const payKey = `${affiliateId}|${year}|${monthIndex}`
      const paymentSum = paymentsByAffMonth.get(payKey) || 0

      return {
        ...m,
        affiliateId,
        affiliateName:
          String(m?.affiliateName || '').trim() || String(m?.affiliate || '').trim() || affiliateId,
        uid: String(m?.uid || '').trim() || affiliateId,
        commission: paymentSum,
      }
    })
  }, [dataSource, mediaRows, effectivePayments])

  const ledger = useAffiliateLedger({
    mediaRows: effectiveMediaRows,
    payments: effectivePayments,
    selectedYear,
    selectedMonth,
    search,
  })
  const allTimeLedger = useAffiliateLedger({
    mediaRows: effectiveMediaRows,
    payments: effectivePayments,
    selectedYear: 'all',
    selectedMonth: 'all',
    search,
  })

  const scopeLatestByAffiliate = useMemo(() => {
    const map = new Map()
    ledger.ledger.forEach((row) => {
      const year = Number(row.year)
      const monthIndex = Number(row.monthIndex)
      if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0) return
      const score = year * 12 + monthIndex
      const key = row.affiliateId
      if (!map.has(key) || score > map.get(key).score) {
        map.set(key, {
          score,
          month: row.month,
          netDeposits: row.netDeposits,
          commission: row.commissionTotal,
          pl: row.pl,
          roi: row.roi,
        })
      }
    })
    return map
  }, [ledger.ledger])

  const scopeLatestMonth = useMemo(() => {
    let latest = null
    let latestScore = -Infinity
    ledger.ledger.forEach((row) => {
      const year = Number(row.year)
      const monthIndex = Number(row.monthIndex)
      if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0) return
      const score = year * 12 + monthIndex
      if (score > latestScore) {
        latestScore = score
        latest = row.month
      }
    })
    return latest
  }, [ledger.ledger])

  const effectiveMonthKey = useMemo(() => {
    const raw = String(selectedMonth || '').trim()
    if (raw && raw !== 'all') return raw
    return scopeLatestMonth || 'all'
  }, [selectedMonth, scopeLatestMonth])

  const monthRef = useMemo(
    () => formatMonthReference(selectedYear, effectiveMonthKey),
    [selectedYear, effectiveMonthKey]
  )

  const singleColumnDefs = useMemo(() => {
    const cols = [
      { id: 'affiliate', label: 'Affiliate', width: 260 },
      { id: 'rank', label: 'Rank', width: 64 },

      { id: 'netDepositsMonth', label: `Net Deposits (${monthRef})`, width: 132 },
      { id: 'netDepositsEver', label: 'Net Deposits (All Time)', width: 132 },
    ]

    if (showCommissionColumns) {
      cols.push({ id: 'commissionMonth', label: `Commission (${monthRef})`, width: 132 })
      cols.push({ id: 'commissionEver', label: 'Commission (All Time)', width: 132 })
    }

    cols.push({ id: 'plMonth', label: `P&L (${monthRef})`, width: 132 })
    cols.push({ id: 'plEver', label: 'P&L (All Time)', width: 132 })

    cols.push({ id: 'roiMonth', label: `ROI (${monthRef})`, width: 112 })
    cols.push({ id: 'roiEver', label: 'ROI (All Time)', width: 112 })

    if (!isPublicShare) {
      cols.push({ id: 'financeConfirmed', label: 'Finance Confirmed', width: 160 })
      cols.push({ id: 'lastMonth', label: 'Last Month', width: 120 })
    }

    cols.push({ id: 'details', label: 'Details', width: 140 })

    return cols
  }, [monthRef, showCommissionColumns, isPublicShare])

  const singleDefaultVisibility = useMemo(() => {
    const out = {}
    singleColumnDefs.forEach((c) => {
      out[c.id] = true
    })
    return out
  }, [singleColumnDefs])

  const [singleColumnVisibility, setSingleColumnVisibility] = useState(singleDefaultVisibility)

  useEffect(() => {
    setSingleColumnVisibility((prev) => {
      const next = { ...singleDefaultVisibility }
      Object.keys(next).forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(prev || {}, k)) next[k] = prev[k] !== false
      })
      return next
    })
  }, [singleDefaultVisibility])

  const singleLockedColumns = useMemo(() => {
    const locked = new Set(['affiliate', 'rank', 'details'])
    if (!isPublicShare) {
      locked.add('financeConfirmed')
      locked.add('lastMonth')
    }
    return locked
  }, [isPublicShare])

  const isSingleVisible = (id) => {
    if (singleLockedColumns.has(id)) return true
    return singleColumnVisibility?.[id] !== false
  }

  const singleToggleColumnDefs = useMemo(
    () => singleColumnDefs.filter((c) => !singleLockedColumns.has(c.id)),
    [singleColumnDefs, singleLockedColumns]
  )

  const singleVisibleCount = useMemo(() => {
    return singleToggleColumnDefs.reduce((acc, c) => acc + (isSingleVisible(c.id) ? 1 : 0), 0)
  }, [singleToggleColumnDefs, singleColumnVisibility])

  const toggleSingleColumn = (id) => {
    setSingleColumnVisibility((prev) => {
      if (singleLockedColumns.has(id)) return prev
      const isCurrentlyVisible = prev?.[id] !== false
      const visibleCount = singleToggleColumnDefs.reduce(
        (acc, c) => acc + (prev?.[c.id] !== false ? 1 : 0),
        0
      )
      if (isCurrentlyVisible && visibleCount <= 1) return prev
      return { ...prev, [id]: !isCurrentlyVisible }
    })
  }

  const singleVisibleColSpan = useMemo(() => {
    const n = singleColumnDefs.reduce((acc, c) => acc + (isSingleVisible(c.id) ? 1 : 0), 0)
    return Math.max(1, n)
  }, [singleColumnDefs, singleColumnVisibility])

  // Details column is locked visible; keeping expanded rows safe.

  const scopeMonthTotals = useMemo(() => {
    const acc = { netDeposits: 0, commission: 0, pl: 0, roi: 0 }
    if (!scopeLatestMonth) return acc
    ledger.ledger.forEach((row) => {
      if (row.month !== scopeLatestMonth) return
      acc.netDeposits += Number(row.netDeposits) || 0
      acc.commission += Number(row.commissionTotal) || 0
      acc.pl += Number(row.pl) || 0
    })
    acc.roi = acc.commission > 0 ? acc.netDeposits / acc.commission - 1 : 0
    return acc
  }, [ledger.ledger, scopeLatestMonth])

  const allTimeByAffiliate = useMemo(() => {
    const map = new Map()
    allTimeLedger.ledger.forEach((row) => {
      const key = row.affiliateId
      if (!map.has(key)) map.set(key, { netDeposits: 0, commission: 0, pl: 0, roi: 0 })
      const acc = map.get(key)
      acc.netDeposits += Number(row.netDeposits) || 0
      acc.commission += Number(row.commissionTotal) || 0
      acc.pl += Number(row.pl) || 0
    })
    map.forEach((acc) => {
      acc.roi = acc.commission > 0 ? acc.netDeposits / acc.commission - 1 : 0
    })
    return map
  }, [allTimeLedger.ledger])

  const allTimeVisibleTotals = useMemo(() => {
    const acc = { netDeposits: 0, commission: 0, pl: 0, roi: 0 }
    ledger.affiliateSummaries.forEach((a) => {
      const entry = allTimeByAffiliate.get(a.affiliateId)
      if (!entry) return
      acc.netDeposits += entry.netDeposits
      acc.commission += entry.commission
      acc.pl += entry.pl
    })
    acc.roi = acc.commission > 0 ? acc.netDeposits / acc.commission - 1 : 0
    return acc
  }, [ledger.affiliateSummaries, allTimeByAffiliate])

  const availableYears = useMemo(() => {
    const set = new Set()
    mediaRows.forEach((m) => Number.isFinite(Number(m.year)) && set.add(Number(m.year)))
    payments.forEach((p) => Number.isFinite(Number(p.year)) && set.add(Number(p.year)))
    return Array.from(set).sort((a, b) => a - b)
  }, [mediaRows, payments])

  const monthOptions = useMemo(() => {
    const map = new Map()
    const add = (row) => {
      if (row == null) return
      if (selectedYear !== 'all' && Number(row.year) !== Number(selectedYear)) return
      const year = Number(row.year)
      const monthIdx = Number(row.monthIndex)
      if (!Number.isFinite(year) || !Number.isFinite(monthIdx) || monthIdx < 0) return
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
      map.set(key, monthLabel(locale, key))
    }
    mediaRows.forEach(add)
    payments.forEach(add)
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value.localeCompare(b.value))
  }, [mediaRows, payments, selectedYear, locale])

  const toggleExpand = (aff) => setExpanded((prev) => (prev === aff ? null : aff))

  const toggleFinanceConfirmed = (affiliateId) => {
    setFinanceConfirmed((prev) => ({ ...prev, [affiliateId]: !prev[affiliateId] }))
  }

  const onShare = () => {
    try {
      const origin = getPublicShareOrigin()
      const params = new window.URLSearchParams()
      if (selectedYear && selectedYear !== 'all') params.set('year', String(selectedYear))
      if (selectedMonth && selectedMonth !== 'all') params.set('month', String(selectedMonth))
      if (search) params.set('search', String(search))
      if (dataSource && dataSource !== 'cellxpert') params.set('source', String(dataSource))
      params.set('mode', 'single')
      const qs = params.toString()
      const href = `${origin}/share/affiliate-payout-summary${qs ? `?${qs}` : ''}`
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch (e) {
      console.warn('Unable to open share link', e)
    }
  }

  return (
    <div className="w-full space-y-4">
      {isPublicShare ? (
        <PublicShareHero
          title={t('investments.header.title')}
          t={t}
          searchDraft={searchDraft}
          setSearchDraft={setSearchDraft}
          autoFocus
        >
          <PublicShareFiltersRow
            t={t}
            availableYears={availableYears}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            monthOptions={monthOptions}
            viewMode={viewMode}
            requestViewMode={requestViewMode}
            dataSource={dataSource}
            requestDataSource={requestDataSource}
          />
        </PublicShareHero>
      ) : null}

      {!isPublicShare ? (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            paddingTop: 4,
            marginTop: -4,
            background: 'linear-gradient(180deg, rgba(9,16,28,0.96), rgba(9,16,28,0.85))',
            backdropFilter: 'blur(8px)',
          }}
        >
          <CardSection
            title={t('investments.header.title')}
            subtitle={t('investments.header.subtitle')}
            actions={
              <FilterBar>
                <YearSelector
                  availableYears={availableYears}
                  value={selectedYear}
                  onChange={(val) => {
                    setSelectedYear(val)
                    setSelectedMonth('all')
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {t('investments.filters.month')}
                  </span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ ...selectStyle, minWidth: 160 }}
                  >
                    <option value="all">{t('investments.filters.allMonths')}</option>
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '4px 8px',
                    borderRadius: 999,
                    fontSize: 12,
                    color: '#cbd5e1',
                  }}
                >
                  {t('investments.badge.monthlyRows', { count: ledger.ledger.length })}
                </span>
              </FilterBar>
            }
          />
        </div>
      ) : null}

      {!isPublicShare ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <ModeControls
            t={t}
            viewMode={viewMode}
            requestViewMode={requestViewMode}
            dataSource={dataSource}
            requestDataSource={requestDataSource}
          />
        </div>
      ) : null}

      <div style={{ position: 'relative' }}>
        {softSwitchLoading ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(9,16,28,0.55)',
              borderRadius: 16,
              pointerEvents: 'none',
            }}
            aria-label={t('investments.loader.data')}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: 'rgba(255,255,255,0.95)',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <span>
                {t('investments.loader.data')} · {softSwitchLabel}
              </span>
            </div>
          </div>
        ) : null}

        <>
          {!isPublicShare ? (
            <div
              className="kpi-grid"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}
            >
              <KpiCard
                label={t('investments.kpi.totalQftd')}
                value={formatNumberShort(ledger.totals.totalQftd)}
                helper={formatNumberFull(ledger.totals.totalQftd)}
              />
              <KpiCard
                label={t('investments.kpi.avgCpa')}
                value={formatEuro(ledger.totals.avgCpa)}
                helper={formatEuroFull(ledger.totals.avgCpa)}
              />
              <KpiCard
                label={t('investments.kpi.totalCommissions')}
                value={formatEuro(ledger.totals.totalCommission)}
                helper={formatEuroFull(ledger.totals.totalCommission)}
              />
              <KpiCard
                label={t('investments.kpi.commissionPayable')}
                value={formatEuro(ledger.totals.totalMarketingPayable)}
                helper={formatEuroFull(ledger.totals.totalMarketingPayable)}
                tone="#22c55e"
              />
              <KpiCard
                label={t('investments.kpi.commissionsDeferred')}
                value={formatEuro(ledger.totals.totalMarketingDeferred)}
                helper={formatEuroFull(ledger.totals.totalMarketingDeferred)}
                tone="#f97316"
              />
              <KpiCard
                label={t('investments.kpi.roi')}
                value={formatPercent(ledger.totals.totalRoi * 100, 2)}
                helper={formatPercent(ledger.totals.totalRoi * 100, 4)}
                fullValue={t('investments.details.title.roiFormula')}
                tone={ledger.totals.totalRoi > 0 ? '#34d399' : '#f87171'}
              />
              <KpiCard
                label={t('investments.kpi.paid')}
                value={formatEuro(
                  dataSource === 'creolabs'
                    ? ledger.totals.totalCommission
                    : ledger.totals.totalPaid
                )}
                helper={formatEuroFull(
                  dataSource === 'creolabs'
                    ? ledger.totals.totalCommission
                    : ledger.totals.totalPaid
                )}
                fullValue={
                  dataSource === 'creolabs'
                    ? t('investments.details.title.paidCreolabs')
                    : undefined
                }
                tone="#38bdf8"
              />
            </div>
          ) : null}

          {!hideTimelineChart ? (
            <div className="card card-global" style={{ minWidth: 320 }}>
              <h3 style={{ marginBottom: 8 }}>{t('investments.section.payoutTimeline')}</h3>
              <div style={{ height: 260 }}>
                <PnLTrendChart
                  labels={ledger.timelineSeries.map((m) => m.label)}
                  series={[
                    {
                      label: t('investments.kpi.paid'),
                      data: ledger.timelineSeries.map((m) => m.paid),
                      color: '#f97316',
                    },
                  ]}
                  formatValue={formatNumberShort}
                />
              </div>
            </div>
          ) : null}

          <div className="card card-global">
            {!isPublicShare ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h3 style={{ marginBottom: 0, flex: 1 }}>
                  {t('investments.section.affiliatePayoutSummary')}
                </h3>
                <button className="btn" onClick={onShare} title={t('investments.share.title')}>
                  {t('investments.share.cta')}
                </button>
                <input
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  style={{ ...selectStyle, minWidth: 200, background: 'rgba(255,255,255,0.04)' }}
                  placeholder={t('investments.search.placeholder')}
                  aria-label={t('investments.search.aria')}
                />
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 10,
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
              aria-label="Column visibility"
            >
              {singleToggleColumnDefs.map((c) => (
                <label
                  key={c.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'rgba(203,213,225,0.95)',
                    userSelect: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title={c.label}
                >
                  <input
                    type="checkbox"
                    checked={isSingleVisible(c.id)}
                    disabled={isSingleVisible(c.id) && singleVisibleCount <= 1}
                    onChange={() => toggleSingleColumn(c.id)}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
            <StickyMetricsTable className="table payout-summary-table" maxHeight="70vh">
              <colgroup>
                {singleColumnDefs.map((c) =>
                  isSingleVisible(c.id) ? <col key={c.id} style={{ width: c.width }} /> : null
                )}
              </colgroup>
              <thead>
                <tr>
                  {isSingleVisible('affiliate') ? (
                    <th rowSpan={2} style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                      Affiliate
                    </th>
                  ) : null}
                  {isSingleVisible('rank') ? (
                    <th rowSpan={2} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      Rank
                    </th>
                  ) : null}

                  {(() => {
                    const groupOrder = [
                      'netDeposits',
                      ...(showCommissionColumns ? ['commission'] : []),
                      'pl',
                      'roi',
                    ]
                    const groupCounts = {
                      netDeposits:
                        (isSingleVisible('netDepositsMonth') ? 1 : 0) +
                        (isSingleVisible('netDepositsEver') ? 1 : 0),
                      commission:
                        (isSingleVisible('commissionMonth') ? 1 : 0) +
                        (isSingleVisible('commissionEver') ? 1 : 0),
                      pl:
                        (isSingleVisible('plMonth') ? 1 : 0) + (isSingleVisible('plEver') ? 1 : 0),
                      roi:
                        (isSingleVisible('roiMonth') ? 1 : 0) +
                        (isSingleVisible('roiEver') ? 1 : 0),
                    }
                    const hasPrev = (key) => {
                      const idx = groupOrder.indexOf(key)
                      if (idx <= 0) return false
                      return groupOrder.slice(0, idx).some((k) => (groupCounts[k] || 0) > 0)
                    }

                    return (
                      <>
                        {groupCounts.netDeposits > 0 ? (
                          <th
                            colSpan={groupCounts.netDeposits}
                            className="payout-summary-group"
                            style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                          >
                            Net Deposits
                          </th>
                        ) : null}

                        {showCommissionColumns && groupCounts.commission > 0 ? (
                          <th
                            colSpan={groupCounts.commission}
                            className={`payout-summary-group${hasPrev('commission') ? ' payout-summary-group-sep' : ''}`}
                            style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                            title="Commission (Payments)"
                          >
                            Commission
                          </th>
                        ) : null}

                        {groupCounts.pl > 0 ? (
                          <th
                            colSpan={groupCounts.pl}
                            className={`payout-summary-group${hasPrev('pl') ? ' payout-summary-group-sep' : ''}`}
                            style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                          >
                            P&L
                          </th>
                        ) : null}

                        {groupCounts.roi > 0 ? (
                          <th
                            colSpan={groupCounts.roi}
                            className={`payout-summary-group${hasPrev('roi') ? ' payout-summary-group-sep' : ''}`}
                            style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                            title="ROI = Net Deposits / Commission (Payments) - 1"
                          >
                            ROI
                          </th>
                        ) : null}

                        {!isPublicShare && isSingleVisible('financeConfirmed') ? (
                          <th rowSpan={2} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            Finance Confirmed
                          </th>
                        ) : null}
                        {!isPublicShare && isSingleVisible('lastMonth') ? (
                          <th rowSpan={2} style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                            Last Month
                          </th>
                        ) : null}

                        {isSingleVisible('details') ? (
                          <th rowSpan={2} style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                            Details
                          </th>
                        ) : null}
                      </>
                    )
                  })()}
                </tr>
                <tr>
                  {(() => {
                    const groupOrder = [
                      'netDeposits',
                      ...(showCommissionColumns ? ['commission'] : []),
                      'pl',
                      'roi',
                    ]
                    const groupCounts = {
                      netDeposits:
                        (isSingleVisible('netDepositsMonth') ? 1 : 0) +
                        (isSingleVisible('netDepositsEver') ? 1 : 0),
                      commission:
                        (isSingleVisible('commissionMonth') ? 1 : 0) +
                        (isSingleVisible('commissionEver') ? 1 : 0),
                      pl:
                        (isSingleVisible('plMonth') ? 1 : 0) + (isSingleVisible('plEver') ? 1 : 0),
                      roi:
                        (isSingleVisible('roiMonth') ? 1 : 0) +
                        (isSingleVisible('roiEver') ? 1 : 0),
                    }
                    const hasPrev = (key) => {
                      const idx = groupOrder.indexOf(key)
                      if (idx <= 0) return false
                      return groupOrder.slice(0, idx).some((k) => (groupCounts[k] || 0) > 0)
                    }

                    const renderMonthAll = (prefix, titlePrefix, firstSep) => {
                      const monthKey = `${prefix}Month`
                      const everKey = `${prefix}Ever`
                      const firstKey = isSingleVisible(monthKey)
                        ? monthKey
                        : isSingleVisible(everKey)
                          ? everKey
                          : null
                      const out = []
                      if (isSingleVisible(monthKey)) {
                        out.push(
                          <th
                            key={`${monthKey}-h`}
                            className={`payout-summary-sub${firstSep && firstKey === monthKey ? ' payout-summary-group-sep' : ''}`}
                            style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                            title={`${titlePrefix} ${monthRef}`}
                          >
                            {monthRef}
                          </th>
                        )
                      }
                      if (isSingleVisible(everKey)) {
                        out.push(
                          <th
                            key={`${everKey}-h`}
                            className={`payout-summary-sub${firstSep && firstKey === everKey ? ' payout-summary-group-sep' : ''}`}
                            style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                            title="All-time totals"
                          >
                            All Time
                          </th>
                        )
                      }
                      return out
                    }

                    return (
                      <>
                        {groupCounts.netDeposits > 0
                          ? renderMonthAll('netDeposits', 'Totals for', false)
                          : null}
                        {showCommissionColumns && groupCounts.commission > 0
                          ? renderMonthAll('commission', 'Totals for', hasPrev('commission'))
                          : null}
                        {groupCounts.pl > 0
                          ? renderMonthAll('pl', 'Totals for', hasPrev('pl'))
                          : null}
                        {groupCounts.roi > 0 ? (
                          <>
                            {isSingleVisible('roiMonth') ? (
                              <th
                                className={`payout-summary-sub${hasPrev('roi') ? ' payout-summary-group-sep' : ''}`}
                                style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                                title={`ROI = Net Deposits / Commission (Payments) - 1\nTotals for ${monthRef}`}
                              >
                                {monthRef}
                              </th>
                            ) : null}
                            {isSingleVisible('roiEver') ? (
                              <th
                                className={`payout-summary-sub${!isSingleVisible('roiMonth') && hasPrev('roi') ? ' payout-summary-group-sep' : ''}`}
                                style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                                title="ROI = Net Deposits / Commission (Payments) - 1\nAll Time"
                              >
                                All Time
                              </th>
                            ) : null}
                          </>
                        ) : null}
                      </>
                    )
                  })()}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 600 }}>
                  {isSingleVisible('affiliate') ? <td>Totals</td> : null}
                  {isSingleVisible('rank') ? (
                    <td style={{ textAlign: 'right', color: '#94a3b8' }}>—</td>
                  ) : null}
                  {isSingleVisible('netDepositsMonth') ? (
                    <td
                      style={{ textAlign: 'right', color: '#38bdf8' }}
                      className="num"
                      title={`Totals for ${monthRef}\n${formatEuroFull(scopeMonthTotals.netDeposits)}`}
                    >
                      {formatEuro(scopeMonthTotals.netDeposits)}
                    </td>
                  ) : null}
                  {isSingleVisible('netDepositsEver') ? (
                    <td
                      style={{ textAlign: 'right', color: '#38bdf8' }}
                      className="num"
                      title={`All-time totals\n${formatEuroFull(allTimeVisibleTotals.netDeposits)}`}
                    >
                      {formatEuro(allTimeVisibleTotals.netDeposits)}
                    </td>
                  ) : null}

                  {showCommissionColumns && isSingleVisible('commissionMonth') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className={`num${
                        isSingleVisible('netDepositsMonth') || isSingleVisible('netDepositsEver')
                          ? ' payout-summary-group-sep'
                          : ''
                      }`}
                      title={`Totals for ${monthRef}\n${formatEuroFull(scopeMonthTotals.commission)}`}
                    >
                      {formatEuro(scopeMonthTotals.commission)}
                    </td>
                  ) : null}
                  {showCommissionColumns && isSingleVisible('commissionEver') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className={`num${
                        (isSingleVisible('netDepositsMonth') ||
                          isSingleVisible('netDepositsEver')) &&
                        !isSingleVisible('commissionMonth')
                          ? ' payout-summary-group-sep'
                          : ''
                      }`}
                      title={`All-time totals\n${formatEuroFull(allTimeVisibleTotals.commission)}`}
                    >
                      {formatEuro(allTimeVisibleTotals.commission)}
                    </td>
                  ) : null}

                  {isSingleVisible('plMonth') ? (
                    <td
                      style={{
                        textAlign: 'right',
                        color: scopeMonthTotals.pl >= 0 ? '#34d399' : '#f87171',
                      }}
                      className={`num${
                        isSingleVisible('netDepositsMonth') ||
                        isSingleVisible('netDepositsEver') ||
                        (showCommissionColumns &&
                          (isSingleVisible('commissionMonth') || isSingleVisible('commissionEver')))
                          ? ' payout-summary-group-sep'
                          : ''
                      }`}
                      title={`Totals for ${monthRef}\n${formatEuroFull(scopeMonthTotals.pl)}`}
                    >
                      {formatEuro(scopeMonthTotals.pl)}
                    </td>
                  ) : null}
                  {isSingleVisible('plEver') ? (
                    <td
                      style={{
                        textAlign: 'right',
                        color: allTimeVisibleTotals.pl >= 0 ? '#34d399' : '#f87171',
                      }}
                      className={`num${
                        (isSingleVisible('netDepositsMonth') ||
                          isSingleVisible('netDepositsEver') ||
                          (showCommissionColumns &&
                            (isSingleVisible('commissionMonth') ||
                              isSingleVisible('commissionEver')))) &&
                        !isSingleVisible('plMonth')
                          ? ' payout-summary-group-sep'
                          : ''
                      }`}
                      title={`All-time totals\n${formatEuroFull(allTimeVisibleTotals.pl)}`}
                    >
                      {formatEuro(allTimeVisibleTotals.pl)}
                    </td>
                  ) : null}

                  {isSingleVisible('roiMonth') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className={`num${
                        isSingleVisible('netDepositsMonth') ||
                        isSingleVisible('netDepositsEver') ||
                        (showCommissionColumns &&
                          (isSingleVisible('commissionMonth') ||
                            isSingleVisible('commissionEver'))) ||
                        isSingleVisible('plMonth') ||
                        isSingleVisible('plEver')
                          ? ' payout-summary-group-sep'
                          : ''
                      }`}
                      title={`ROI = Net Deposits / Commission (Payments) - 1\nTotals for ${monthRef}\n${formatPercent(scopeMonthTotals.roi * 100, 4)}`}
                    >
                      <span style={roiPillStyle(scopeMonthTotals.roi)}>
                        {formatPercentRounded(scopeMonthTotals.roi * 100)}
                      </span>
                    </td>
                  ) : null}
                  {isSingleVisible('roiEver') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className={`num${
                        (isSingleVisible('netDepositsMonth') ||
                          isSingleVisible('netDepositsEver') ||
                          (showCommissionColumns &&
                            (isSingleVisible('commissionMonth') ||
                              isSingleVisible('commissionEver'))) ||
                          isSingleVisible('plMonth') ||
                          isSingleVisible('plEver')) &&
                        !isSingleVisible('roiMonth')
                          ? ' payout-summary-group-sep'
                          : ''
                      }`}
                      title={`ROI = Net Deposits / Commission (Payments) - 1\nAll Time\n${formatPercent(allTimeVisibleTotals.roi * 100, 4)}`}
                    >
                      <span style={roiPillStyle(allTimeVisibleTotals.roi)}>
                        {formatPercentRounded(allTimeVisibleTotals.roi * 100)}
                      </span>
                    </td>
                  ) : null}

                  {!isPublicShare && isSingleVisible('financeConfirmed') ? (
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>—</td>
                  ) : null}
                  {!isPublicShare && isSingleVisible('lastMonth') ? <td>—</td> : null}
                  {isSingleVisible('details') ? <td></td> : null}
                </tr>
                {(showAllAffiliates
                  ? ledger.affiliateSummaries
                  : ledger.affiliateSummaries.slice(0, 10)
                ).map((a) => (
                  <React.Fragment key={a.affiliateId}>
                    <tr>
                      {isSingleVisible('affiliate') ? (
                        <td title={String(a.affiliateId || '').trim() || undefined}>
                          {(() => {
                            const id = String(a.affiliateId || '').trim()
                            const mappedName = affiliateIndexById?.[id]
                            const name = (mappedName || a.affiliateName || '').trim()

                            if (name && id && name !== id) return `${name} (${id})`
                            return name || id || a.affiliateName
                          })()}
                        </td>
                      ) : null}
                      {isSingleVisible('rank') ? (
                        <td style={{ textAlign: 'right', color: '#94a3b8' }} className="num">
                          {a.rank}
                        </td>
                      ) : null}
                      {isSingleVisible('netDepositsMonth') ? (
                        <td
                          style={{
                            textAlign: 'right',
                            color: '#38bdf8',
                          }}
                          className="num"
                          title={`${t('investments.details.title.scopeMonthAffiliate')}\n${formatEuroFull(scopeLatestByAffiliate.get(a.affiliateId)?.netDeposits || 0)}`}
                        >
                          {formatEuro(scopeLatestByAffiliate.get(a.affiliateId)?.netDeposits || 0)}
                        </td>
                      ) : null}
                      {isSingleVisible('netDepositsEver') ? (
                        <td
                          style={{ textAlign: 'right', color: '#38bdf8' }}
                          className="num"
                          title={`${t('investments.details.title.scopeEverAffiliate')}\n${formatEuroFull(allTimeByAffiliate.get(a.affiliateId)?.netDeposits || 0)}`}
                        >
                          {formatEuro(allTimeByAffiliate.get(a.affiliateId)?.netDeposits || 0)}
                        </td>
                      ) : null}
                      {showCommissionColumns && isSingleVisible('commissionMonth') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className={`num${
                            isSingleVisible('netDepositsMonth') ||
                            isSingleVisible('netDepositsEver')
                              ? ' payout-summary-group-sep'
                              : ''
                          }`}
                          title={`${t('investments.details.title.scopeMonthAffiliate')}\n${formatEuroFull(scopeLatestByAffiliate.get(a.affiliateId)?.commission || 0)}`}
                        >
                          {formatEuro(scopeLatestByAffiliate.get(a.affiliateId)?.commission || 0)}
                        </td>
                      ) : null}
                      {showCommissionColumns && isSingleVisible('commissionEver') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className={`num${
                            (isSingleVisible('netDepositsMonth') ||
                              isSingleVisible('netDepositsEver')) &&
                            !isSingleVisible('commissionMonth')
                              ? ' payout-summary-group-sep'
                              : ''
                          }`}
                          title={`${t('investments.details.title.scopeEverAffiliate')}\n${formatEuroFull(allTimeByAffiliate.get(a.affiliateId)?.commission || 0)}`}
                        >
                          {formatEuro(allTimeByAffiliate.get(a.affiliateId)?.commission || 0)}
                        </td>
                      ) : null}
                      {isSingleVisible('plMonth') ? (
                        <td
                          style={{
                            textAlign: 'right',
                            color:
                              (scopeLatestByAffiliate.get(a.affiliateId)?.pl || 0) >= 0
                                ? '#34d399'
                                : '#f87171',
                          }}
                          className={`num${
                            isSingleVisible('netDepositsMonth') ||
                            isSingleVisible('netDepositsEver') ||
                            (showCommissionColumns &&
                              (isSingleVisible('commissionMonth') ||
                                isSingleVisible('commissionEver')))
                              ? ' payout-summary-group-sep'
                              : ''
                          }`}
                          title={`${t('investments.details.title.scopeMonthAffiliate')}\n${formatEuroFull(scopeLatestByAffiliate.get(a.affiliateId)?.pl || 0)}`}
                        >
                          {formatEuro(scopeLatestByAffiliate.get(a.affiliateId)?.pl || 0)}
                        </td>
                      ) : null}
                      {isSingleVisible('plEver') ? (
                        <td
                          style={{
                            textAlign: 'right',
                            color:
                              (allTimeByAffiliate.get(a.affiliateId)?.pl || 0) >= 0
                                ? '#34d399'
                                : '#f87171',
                          }}
                          className={`num${
                            (isSingleVisible('netDepositsMonth') ||
                              isSingleVisible('netDepositsEver') ||
                              (showCommissionColumns &&
                                (isSingleVisible('commissionMonth') ||
                                  isSingleVisible('commissionEver')))) &&
                            !isSingleVisible('plMonth')
                              ? ' payout-summary-group-sep'
                              : ''
                          }`}
                          title={`${t('investments.details.title.scopeEverAffiliate')}\n${formatEuroFull(allTimeByAffiliate.get(a.affiliateId)?.pl || 0)}`}
                        >
                          {formatEuro(allTimeByAffiliate.get(a.affiliateId)?.pl || 0)}
                        </td>
                      ) : null}
                      {isSingleVisible('roiMonth') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className={`num${
                            isSingleVisible('netDepositsMonth') ||
                            isSingleVisible('netDepositsEver') ||
                            (showCommissionColumns &&
                              (isSingleVisible('commissionMonth') ||
                                isSingleVisible('commissionEver'))) ||
                            isSingleVisible('plMonth') ||
                            isSingleVisible('plEver')
                              ? ' payout-summary-group-sep'
                              : ''
                          }`}
                          title={`${t('investments.details.title.roiFormula')}\n${t('investments.details.title.scopeMonthAffiliate')}\n${formatPercent((scopeLatestByAffiliate.get(a.affiliateId)?.roi || 0) * 100, 4)}`}
                        >
                          <span
                            style={roiPillStyle(
                              scopeLatestByAffiliate.get(a.affiliateId)?.roi || 0
                            )}
                          >
                            {formatPercentRounded(
                              (scopeLatestByAffiliate.get(a.affiliateId)?.roi || 0) * 100
                            )}
                          </span>
                        </td>
                      ) : null}
                      {isSingleVisible('roiEver') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className={`num${
                            (isSingleVisible('netDepositsMonth') ||
                              isSingleVisible('netDepositsEver') ||
                              (showCommissionColumns &&
                                (isSingleVisible('commissionMonth') ||
                                  isSingleVisible('commissionEver'))) ||
                              isSingleVisible('plMonth') ||
                              isSingleVisible('plEver')) &&
                            !isSingleVisible('roiMonth')
                              ? ' payout-summary-group-sep'
                              : ''
                          }`}
                          title={`${t('investments.details.title.roiFormula')}\n${t('investments.details.title.scopeEverAffiliate')}\n${formatPercent((allTimeByAffiliate.get(a.affiliateId)?.roi || 0) * 100, 4)}`}
                        >
                          <span
                            style={roiPillStyle(allTimeByAffiliate.get(a.affiliateId)?.roi || 0)}
                          >
                            {formatPercentRounded(
                              (allTimeByAffiliate.get(a.affiliateId)?.roi || 0) * 100
                            )}
                          </span>
                        </td>
                      ) : null}
                      {!isPublicShare && isSingleVisible('financeConfirmed') ? (
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={!!financeConfirmed[a.affiliateId]}
                            onChange={() => toggleFinanceConfirmed(a.affiliateId)}
                            title={t('investments.checkbox.title.financeConfirmed')}
                          />
                        </td>
                      ) : null}
                      {!isPublicShare && isSingleVisible('lastMonth') ? (
                        <td>{a.lastMonth ? monthLabel(locale, a.lastMonth) : '—'}</td>
                      ) : null}
                      {isSingleVisible('details') ? (
                        <td>
                          <button className="btn" onClick={() => toggleExpand(a.affiliateId)}>
                            {expanded === a.affiliateId
                              ? t('common.hide')
                              : t('investments.button.details')}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                    {expanded === a.affiliateId && isSingleVisible('details') && (
                      <tr>
                        <td colSpan={singleVisibleColSpan}>
                          <div
                            style={{
                              padding: '8px 12px',
                              background: 'rgba(255,255,255,0.02)',
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <table className="table" style={{ width: '100%' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left' }}>
                                    {t('investments.details.header.month')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.reg')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.ftd')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.qftd')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.netDeposits')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.commissions')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.pl')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.roiFormula')}
                                  >
                                    {t('investments.details.header.roi')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.cpa')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.commExpected')}
                                  >
                                    {t('investments.details.header.commExpected')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.commActual')}
                                  >
                                    {t('investments.details.header.commActual')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.commPayable')}
                                  >
                                    {t('investments.details.header.commPayable')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.commDeferred')}
                                  >
                                    {t('investments.details.header.commDeferred')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.paid')}
                                  </th>
                                  <th style={{ textAlign: 'left' }}>
                                    {t('investments.details.header.paymentDate')}
                                  </th>
                                  <th style={{ textAlign: 'left' }}>
                                    {t('investments.details.header.details')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {ledger.ledger
                                  .filter((r) => r.affiliateId === a.affiliateId)
                                  .sort((x, y) => y.year - x.year || y.monthIndex - x.monthIndex)
                                  .map((r) => (
                                    <tr key={`${r.month}-${r.affiliateId}`}>
                                      <td>{monthLabel(locale, r.month)}</td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatNumberFull(r.registrations)}
                                      >
                                        {formatNumberShort(r.registrations)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatNumberFull(r.ftd)}
                                      >
                                        {formatNumberShort(r.ftd)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatNumberFull(r.qftd)}
                                      >
                                        {formatNumberShort(r.qftd)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#38bdf8' }}
                                        className="num"
                                        title={formatEuroFull(r.netDeposits)}
                                      >
                                        {formatEuro(r.netDeposits)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFull(r.commissionTotal)}
                                      >
                                        {formatEuro(r.commissionTotal)}
                                      </td>
                                      <td
                                        style={{
                                          textAlign: 'right',
                                          color: r.pl >= 0 ? '#34d399' : '#f87171',
                                        }}
                                        className="num"
                                        title={formatEuroFull(r.pl)}
                                      >
                                        {formatEuro(r.pl)}
                                      </td>
                                      <td
                                        style={{
                                          textAlign: 'right',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'flex-end',
                                          gap: 6,
                                        }}
                                        className="num"
                                        title={`${t('investments.details.title.roiFormula')}\n${formatPercent(r.roi * 100, 4)}`}
                                      >
                                        <span
                                          style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: r.roi > 0 ? '#22c55e' : '#ef4444',
                                          }}
                                        />
                                        <span style={roiPillStyle(r.roi)}>
                                          {formatPercentRounded(r.roi * 100)}
                                        </span>
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFull(r.negotiatedCpa)}
                                      >
                                        {formatEuro(r.negotiatedCpa)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFull(r.marketingExpected)}
                                      >
                                        {formatEuro(r.marketingExpected)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFull(r.marketingActual)}
                                      >
                                        {formatEuro(r.marketingActual)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#22c55e' }}
                                        className="num"
                                        title={formatEuroFull(r.marketingPayable)}
                                      >
                                        {formatEuro(r.marketingPayable)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#f97316' }}
                                        className="num"
                                        title={formatEuroFull(r.marketingDeferred)}
                                      >
                                        {formatEuro(r.marketingDeferred)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#38bdf8' }}
                                        className="num"
                                        title={formatEuroFull(r.paidAmount)}
                                      >
                                        {formatEuro(r.paidAmount)}
                                      </td>
                                      <td>{r.paymentDate || '—'}</td>
                                      <td title={r.details?.length ? r.details.join(' | ') : '—'}>
                                        {r.details?.length ? r.details.join(' • ') : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                {!ledger.ledger.some((r) => r.affiliateId === a.affiliateId) && (
                                  <tr>
                                    <td
                                      colSpan={16}
                                      style={{ textAlign: 'center', color: '#94a3b8' }}
                                    >
                                      No monthly rows for this affiliate.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {!ledger.affiliateSummaries.length && (
                  <tr>
                    <td
                      colSpan={singleVisibleColSpan}
                      style={{ textAlign: 'center', color: '#94a3b8' }}
                    >
                      No affiliates found
                    </td>
                  </tr>
                )}
              </tbody>
            </StickyMetricsTable>
            {ledger.affiliateSummaries.length > 10 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <button
                  className="btn"
                  onClick={() => setShowAllAffiliates((prev) => !prev)}
                  style={{ padding: '8px 14px' }}
                >
                  {showAllAffiliates
                    ? t('investments.button.showTop10')
                    : t('investments.button.showAll', { count: ledger.affiliateSummaries.length })}
                </button>
              </div>
            )}
          </div>
        </>
      </div>
    </div>
  )
}

function InvestmentsDashboardUnifiedContent({
  t,
  locale,
  isPublicShare,
  cellxPayments,
  cellxMediaRows,
  creolabsPayments,
  creolabsMediaRows,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  search,
  setSearch,
  dataSource,
  requestDataSource,
  viewMode,
  requestViewMode,
  softSwitchLoading,
  softSwitchLabel,
}) {
  const [affiliateIndexById, setAffiliateIndexById] = useState(null)
  const [searchDraft, setSearchDraft] = useState(search)

  const cellxpertLabel = t('investments.source.cellxpert')
  const creolabsLabel = t('investments.source.creolabs')
  const singleModeLabel = t('investments.viewMode.single')
  const unifiedModeLabel = t('investments.viewMode.unified')
  const unifiedHint = t('investments.unified.sourceDisabledHint')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const byId = await loadAffiliateIndexById({ force: false })
        if (!cancelled) setAffiliateIndexById(byId)
      } catch {
        if (!cancelled) setAffiliateIndexById(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSearchDraft(search)
  }, [search])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchDraft)
    }, 250)
    return () => window.clearTimeout(id)
  }, [searchDraft, setSearch])

  const availableYears = useMemo(() => {
    const set = new Set()
    ;(cellxMediaRows || []).forEach(
      (m) => Number.isFinite(Number(m.year)) && set.add(Number(m.year))
    )
    ;(creolabsMediaRows || []).forEach(
      (m) => Number.isFinite(Number(m.year)) && set.add(Number(m.year))
    )
    ;(cellxPayments || []).forEach(
      (p) => Number.isFinite(Number(p.year)) && set.add(Number(p.year))
    )
    ;(creolabsPayments || []).forEach(
      (p) => Number.isFinite(Number(p.year)) && set.add(Number(p.year))
    )
    return Array.from(set).sort((a, b) => a - b)
  }, [cellxMediaRows, creolabsMediaRows, cellxPayments, creolabsPayments])

  const monthOptions = useMemo(() => {
    const map = new Map()
    const add = (row) => {
      if (row == null) return
      if (selectedYear !== 'all' && Number(row.year) !== Number(selectedYear)) return
      const year = Number(row.year)
      const monthIdx = Number(row.monthIndex)
      if (!Number.isFinite(year) || !Number.isFinite(monthIdx) || monthIdx < 0) return
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
      map.set(key, monthLabel(locale, key))
    }
    ;(cellxMediaRows || []).forEach(add)
    ;(creolabsMediaRows || []).forEach(add)
    ;(cellxPayments || []).forEach(add)
    ;(creolabsPayments || []).forEach(add)
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value.localeCompare(b.value))
  }, [cellxMediaRows, creolabsMediaRows, cellxPayments, creolabsPayments, selectedYear, locale])

  const onShare = () => {
    try {
      const origin = getPublicShareOrigin()
      const params = new window.URLSearchParams()
      if (selectedYear && selectedYear !== 'all') params.set('year', String(selectedYear))
      if (selectedMonth && selectedMonth !== 'all') params.set('month', String(selectedMonth))
      if (search) params.set('search', String(search))
      // Keep source param only for backwards compatibility; unified ignores it.
      if (dataSource && dataSource !== 'cellxpert') params.set('source', String(dataSource))
      params.set('mode', 'unified')
      const qs = params.toString()
      const href = `${origin}/share/affiliate-payout-summary${qs ? `?${qs}` : ''}`
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch (e) {
      console.warn('Unable to open share link', e)
    }
  }

  if (isPublicShare) {
    return (
      <div className="w-full space-y-4">
        <PublicShareHero
          title={t('investments.header.title')}
          t={t}
          searchDraft={searchDraft}
          setSearchDraft={setSearchDraft}
          autoFocus
        >
          <PublicShareFiltersRow
            t={t}
            availableYears={availableYears}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            monthOptions={monthOptions}
            viewMode={viewMode}
            requestViewMode={requestViewMode}
            dataSource={dataSource}
            requestDataSource={requestDataSource}
            sourceDisabled
            sourceHint={unifiedHint}
          />
        </PublicShareHero>

        <div style={{ padding: '0 14px' }}>
          <div style={{ maxWidth: 1800, width: '100%', margin: '0 auto' }}>
            <div className="card card-global">
              <AffiliatePayoutUnifiedTable
                t={t}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                search={search}
                cellxPayments={cellxPayments}
                cellxMediaRows={cellxMediaRows}
                creolabsPayments={creolabsPayments}
                creolabsMediaRows={creolabsMediaRows}
                affiliateIndexById={affiliateIndexById}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          paddingTop: 4,
          marginTop: -4,
          background: 'linear-gradient(180deg, rgba(9,16,28,0.96), rgba(9,16,28,0.85))',
          backdropFilter: 'blur(8px)',
        }}
      >
        <CardSection
          title={t('investments.header.title')}
          subtitle={t('investments.header.subtitle')}
          actions={
            <FilterBar>
              <YearSelector
                availableYears={availableYears}
                value={selectedYear}
                onChange={(val) => {
                  setSelectedYear(val)
                  setSelectedMonth('all')
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {t('investments.filters.month')}
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ ...selectStyle, minWidth: 160 }}
                >
                  <option value="all">{t('investments.filters.allMonths')}</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <span
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: 12,
                  color: '#cbd5e1',
                }}
                title={t('investments.viewMode.unified')}
              >
                {t('investments.viewMode.unified')}
              </span>
            </FilterBar>
          }
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              gap: 8,
              padding: 6,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
            }}
            aria-label={t('investments.viewMode.aria')}
          >
            <button
              type="button"
              className={viewMode === 'single' ? 'btn' : 'btn secondary'}
              onClick={() => requestViewMode('single')}
              aria-pressed={viewMode === 'single'}
              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 999 }}
            >
              {singleModeLabel}
            </button>
            <button
              type="button"
              className={viewMode === 'unified' ? 'btn' : 'btn secondary'}
              onClick={() => requestViewMode('unified')}
              aria-pressed={viewMode === 'unified'}
              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 999 }}
            >
              {unifiedModeLabel}
            </button>
          </div>

          <div
            style={{
              display: 'inline-flex',
              gap: 8,
              padding: 6,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              opacity: 0.65,
            }}
            aria-label={t('investments.filters.source')}
            title={unifiedHint}
          >
            <button
              type="button"
              className={dataSource === 'cellxpert' ? 'btn' : 'btn secondary'}
              disabled
              aria-disabled="true"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 800,
                borderRadius: 999,
                whiteSpace: 'nowrap',
                ...(dataSource === 'cellxpert'
                  ? {}
                  : {
                      background: 'transparent',
                      opacity: 0.85,
                    }),
              }}
            >
              {cellxpertLabel}
            </button>
            <button
              type="button"
              className={dataSource === 'creolabs' ? 'btn' : 'btn secondary'}
              disabled
              aria-disabled="true"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 800,
                borderRadius: 999,
                whiteSpace: 'nowrap',
                ...(dataSource === 'creolabs'
                  ? {}
                  : {
                      background: 'transparent',
                      opacity: 0.85,
                    }),
              }}
            >
              {creolabsLabel}
            </button>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>
            {unifiedHint}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {softSwitchLoading ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(9,16,28,0.55)',
              borderRadius: 16,
              pointerEvents: 'none',
            }}
            aria-label={t('investments.loader.data')}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: 'rgba(255,255,255,0.95)',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <span>
                {t('investments.loader.data')} · {softSwitchLabel}
              </span>
            </div>
          </div>
        ) : null}

        <div className="card card-global">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h3 style={{ marginBottom: 0, flex: 1 }}>{t('investments.unified.title')}</h3>
            {!isPublicShare ? (
              <button className="btn" onClick={onShare} title={t('investments.share.title')}>
                {t('investments.share.cta')}
              </button>
            ) : null}
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              style={{ ...selectStyle, minWidth: 200, background: 'rgba(255,255,255,0.04)' }}
              placeholder={t('investments.search.placeholder')}
              aria-label={t('investments.search.aria')}
            />
          </div>

          <AffiliatePayoutUnifiedTable
            t={t}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            search={search}
            cellxPayments={cellxPayments}
            cellxMediaRows={cellxMediaRows}
            creolabsPayments={creolabsPayments}
            creolabsMediaRows={creolabsMediaRows}
            affiliateIndexById={affiliateIndexById}
          />
        </div>
      </div>
    </div>
  )
}
