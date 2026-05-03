import React, { useEffect, useMemo, useState } from 'react'
import PnLTrendChart from '../../../components/PnLTrendChart'
import CardSection from '../../../components/common/CardSection'
import FilterBar from '../../../components/common/FilterBar'
import KpiCard from '../../../components/common/KpiCard'
import YearSelector from '../../../components/common/YearSelector'
import FullPageLoader from '../../../components/FullPageLoader'
import {
  formatEuro,
  formatEuroFullNoDecimals,
  formatNumber,
  formatNumberShort,
} from '../../../lib/formatters'
import { useCellxInvestmentsData } from '../../cellx/hooks/useCellxInvestmentsData'
import { useAffiliateLedger } from '../../media-payments/hooks/useAffiliateLedger'
import { useCreolabsBreakdownData } from '../../creolabs/hooks/useCreolabsBreakdownData'
import {
  isQlikApiUnavailableError,
  loadCreolabsClientsTable,
  loadCreolabsQlikClientMonths,
  logCreolabsQlikFallbackBlocked,
  logCreolabsQlikFallbackUsed,
} from '../../creolabs/services/creolabsService'
import { loadAffiliateIndexById } from '../../ranking/services/rankingService'
import { checkDataStatus } from '../../../utils/dataStatusChecker'
import { useDataStatus } from '../../../context/DataStatusContext'
import { useI18n } from '../../../i18n/I18nContext'
import { getPublicShareOrigin } from '../../../utils/publicShareOrigin'
import { withReportsVersion } from '../../../lib/fetchCache'
import AffiliatePayoutUnifiedTable from './AffiliatePayoutUnifiedTable'
import StickyMetricsTable from './StickyMetricsTable'
import { formatMonthReference } from '../utils/formatMonthReference'
import { useQlikStatus } from '../../../context/QlikStatusContext'

const selectStyle = {
  minWidth: 180,
  background: '#0d1a2c',
  color: 'var(--text)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '8px 10px',
}
const formatNumberFull = (value) => formatNumber(value)
const INVESTMENTS_SOURCE_KEY = 'investments-data-source'
const INVESTMENTS_VIEW_MODE_KEY = 'investments-view-mode'

const roiPillStyleRatio = (roiRatio) => {
  const ratio = Number(roiRatio)
  const isGood = Number.isFinite(ratio) ? ratio >= 1.5 : false
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    border: `1px solid ${isGood ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
    background: isGood ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
    color: isGood ? '#34d399' : '#f87171',
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

const CREO_MONTH_MAP = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

function parseCreolabsPeriodToMonthScore(periodId) {
  const s = String(periodId || '').trim()
  const m = s.match(/^(\d{4})[-\s]?([A-Za-z]{3,})/)
  if (!m) return null
  const year = Number(m[1])
  const monRaw = String(m[2] || '')
    .slice(0, 3)
    .toLowerCase()
  const monthIndex = CREO_MONTH_MAP[monRaw]
  if (!Number.isFinite(year) || monthIndex == null) return null
  const score = year * 12 + monthIndex
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  return { year, monthIndex, score, monthKey }
}

const formatRoiRatio = (value, digits = 2) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return formatNumber(n, { minimumFractionDigits: 0, maximumFractionDigits: digits })
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
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{t('investments.filters.month')}</span>
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
  const effectiveSource =
    viewMode === 'unified' && dataSource !== 'cellxpert' && dataSource !== 'creolabs'
      ? 'cellxpert'
      : dataSource
  const cellxpertLabel = t('investments.source.cellxpert')
  const creolabsLabel = t('investments.source.creolabs')
  const mixedLabel = t('investments.source.mixed')
  const singleModeLabel = t('investments.viewMode.single')
  const unifiedModeLabel = t('investments.viewMode.unified')

  const onMixedClick = () => {
    if (viewMode === 'unified') {
      requestDataSource('mixed')
      requestViewMode('single')
      return
    }

    if (sourceDisabled) return
    requestDataSource('mixed')
  }

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
          className={viewMode === 'single' && effectiveSource === 'mixed' ? 'btn' : 'btn secondary'}
          onClick={onMixedClick}
          disabled={viewMode === 'single' && sourceDisabled}
          aria-disabled={viewMode === 'single' && sourceDisabled ? 'true' : undefined}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 999,
            whiteSpace: 'nowrap',
            ...(viewMode === 'single' && effectiveSource === 'mixed'
              ? {}
              : {
                  background: 'transparent',
                  opacity: 0.85,
                }),
          }}
          title={viewMode === 'unified' ? t('investments.viewMode.single') : sourceHint}
        >
          {mixedLabel}
        </button>
        <button
          type="button"
          className={effectiveSource === 'cellxpert' ? 'btn' : 'btn secondary'}
          onClick={sourceDisabled ? undefined : () => requestDataSource('cellxpert')}
          disabled={sourceDisabled}
          aria-disabled={sourceDisabled ? 'true' : undefined}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 999,
            whiteSpace: 'nowrap',
            ...(effectiveSource === 'cellxpert'
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
          className={effectiveSource === 'creolabs' ? 'btn' : 'btn secondary'}
          onClick={sourceDisabled ? undefined : () => requestDataSource('creolabs')}
          disabled={sourceDisabled}
          aria-disabled={sourceDisabled ? 'true' : undefined}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 999,
            whiteSpace: 'nowrap',
            ...(effectiveSource === 'creolabs'
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
  const { reportQlikSource } = useQlikStatus()

  const [viewMode, setViewMode] = useState(() => {
    const initial = String(initialViewMode || '').trim()
    if (initial === 'single' || initial === 'unified') return initial

    if (isPublicShare) return 'single'

    try {
      const stored = String(localStorage.getItem(INVESTMENTS_VIEW_MODE_KEY) || '').trim()
      if (stored === 'single' || stored === 'unified') return stored
    } catch {
      // ignore
    }
    return 'unified'
  })

  useEffect(() => {
    if (isPublicShare) return
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
    if (initial === 'cellxpert' || initial === 'creolabs' || initial === 'mixed') return initial

    if (isPublicShare) return 'mixed'

    try {
      const stored = String(localStorage.getItem(INVESTMENTS_SOURCE_KEY) || '').trim()
      if (stored === 'cellxpert' || stored === 'creolabs' || stored === 'mixed') return stored
    } catch {
      // ignore
    }
    return 'mixed'
  })

  // Payments columns are shown for both sources.
  // For Creolabs we reuse CellXpert payments as denominator for ROI (see InvestmentsDashboardContent).
  const showCommissionColumns = true

  useEffect(() => {
    if (isPublicShare) return
    try {
      localStorage.setItem(INVESTMENTS_SOURCE_KEY, dataSource)
    } catch {
      // ignore
    }
  }, [dataSource])

  const [displaySource, setDisplaySource] = useState(dataSource)
  const [softSwitchLoading, setSoftSwitchLoading] = useState(false)

  const effectiveRequestedSource = viewMode === 'unified' ? 'mixed' : dataSource
  const effectiveDisplaySource = displayViewMode === 'unified' ? 'mixed' : displaySource

  const shouldLoadCreolabsClients =
    viewMode === 'unified' ||
    displayViewMode === 'unified' ||
    effectiveRequestedSource === 'creolabs' ||
    effectiveDisplaySource === 'creolabs' ||
    effectiveRequestedSource === 'mixed' ||
    effectiveDisplaySource === 'mixed'

  const [creolabsClientRows, setCreolabsClientRows] = useState([])
  const [creolabsClientsLoading, setCreolabsClientsLoading] = useState(false)

  useEffect(() => {
    if (!shouldLoadCreolabsClients) return
    let cancelled = false

    const load = async (force) => {
      setCreolabsClientsLoading(true)
      try {
        try {
          const api = await loadCreolabsQlikClientMonths({ force })
          const nextRows = Array.isArray(api?.data?.clientMonths) ? api.data.clientMonths : []
          if (!cancelled) setCreolabsClientRows(nextRows)
          if (!cancelled) reportQlikSource('creolabs-dashboard', 'api')
          return
        } catch (e) {
          if (!isQlikApiUnavailableError(e)) {
            logCreolabsQlikFallbackBlocked('affiliate/payments balances load', e)
            throw e
          }
          logCreolabsQlikFallbackUsed('affiliate/payments balances load', e)
          if (!cancelled) reportQlikSource('creolabs-dashboard', 'local')
          const table = await loadCreolabsClientsTable({ force })
          const nextRows = Array.isArray(table?.rows) ? table.rows : []
          if (!cancelled) setCreolabsClientRows(nextRows)
          return
        }
      } catch (e) {
        console.warn('Unable to load Creolabs clients table for balances', e)
        if (!cancelled) setCreolabsClientRows([])
      } finally {
        if (!cancelled) setCreolabsClientsLoading(false)
      }
    }

    load(false)

    const onUpdated = () => {
      load(true)
    }

    window.addEventListener('bw-reports-updated', onUpdated)
    return () => {
      cancelled = true
      window.removeEventListener('bw-reports-updated', onUpdated)
      reportQlikSource('creolabs-dashboard', null)
    }
  }, [shouldLoadCreolabsClients, reportQlikSource])

  const selectedActiveData = effectiveRequestedSource === 'creolabs' ? creolabs : cellxpert
  const selectedLoading =
    effectiveRequestedSource === 'mixed'
      ? Boolean(cellxpert?.loading) || Boolean(creolabs?.loading)
      : Boolean(selectedActiveData?.loading)

  const displayActiveData = effectiveDisplaySource === 'creolabs' ? creolabs : cellxpert
  const { payments, mediaRows, loading: rawLoading } = displayActiveData
  const loading =
    effectiveDisplaySource === 'mixed'
      ? Boolean(cellxpert?.loading) || Boolean(creolabs?.loading)
      : Boolean(rawLoading)

  const [dataCache, setDataCache] = useState(() => ({
    cellxpert: { payments: [], mediaRows: [] },
    creolabs: { payments: [], mediaRows: [] },
  }))

  const [selectedYear, setSelectedYear] = useState(initialSelectedYear || 'all')
  const [selectedMonth, setSelectedMonth] = useState(initialSelectedMonth || 'all')
  const [search, setSearch] = useState(initialSearch || '')
  const [showAllAffiliates, setShowAllAffiliates] = useState(false)
  const [expanded, setExpanded] = useState(null)
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
    if (next !== 'cellxpert' && next !== 'creolabs' && next !== 'mixed') return
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

  const cacheKey = effectiveDisplaySource === 'mixed' ? 'cellxpert' : effectiveDisplaySource
  const cached = dataCache[cacheKey] || { payments: [], mediaRows: [] }
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

  // Carica status dati
  useEffect(() => {
    async function loadDataStatus() {
      try {
        const resp = await fetch(withReportsVersion('/Payments Report.csv'), {
          cache: 'no-store',
        })
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
    dataSource: effectiveRequestedSource,
    requestDataSource,
    showCommissionColumns,
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
        : effectiveDisplaySource === 'mixed'
          ? t('investments.source.mixed')
          : effectiveDisplaySource === 'creolabs'
            ? t('investments.source.creolabs')
            : t('investments.source.cellxpert'),
    hideTimelineChart,
    creolabsClientRows,
    creolabsClientsLoading,
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
      creolabsMediaRowsForMixed={creoShownMediaRows}
      showAllAffiliates={showAllAffiliates}
      setShowAllAffiliates={setShowAllAffiliates}
      expanded={expanded}
      setExpanded={setExpanded}
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
  creolabsMediaRowsForMixed,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  search,
  setSearch,
  dataSource,
  requestDataSource,
  showCommissionColumns,
  viewMode,
  requestViewMode,
  softSwitchLoading,
  softSwitchLabel,
  showAllAffiliates,
  setShowAllAffiliates,
  expanded,
  setExpanded,
  hideTimelineChart,
  creolabsClientRows,
}) {
  const [affiliateIndexById, setAffiliateIndexById] = useState(null)
  const isMixed = dataSource === 'mixed'

  const cellxSourceSuffix = isMixed ? ` (${t('investments.source.cellxpert')})` : ''
  const creolabsSourceSuffix = isMixed ? ` (${t('investments.source.creolabs')})` : ''

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
    if (dataSource === 'creolabs' || dataSource === 'mixed') {
      return Array.isArray(cellxPaymentsForRoi) ? cellxPaymentsForRoi : []
    }
    return Array.isArray(payments) ? payments : []
  }, [dataSource, payments, cellxPaymentsForRoi])

  const effectiveMediaRows = useMemo(() => {
    const baseRows = Array.isArray(mediaRows) ? mediaRows : []
    if (dataSource !== 'creolabs') return baseRows

    // For Creolabs single-source view we want the same payments column as CellXpert.
    // We therefore override the commission field per affiliate+month using CellXpert payments sums,
    // so ROI (= netDeposits / commission) uses these values as denominator.
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

  const mixedPlLedger = useAffiliateLedger({
    mediaRows: isMixed && Array.isArray(creolabsMediaRowsForMixed) ? creolabsMediaRowsForMixed : [],
    payments: [],
    selectedYear,
    selectedMonth,
    // Mixed search filters on the Cellx (primary) dataset; avoid losing Creolabs P&L lookups.
    search: '',
  })

  const mixedPlAllTimeLedger = useAffiliateLedger({
    mediaRows: isMixed && Array.isArray(creolabsMediaRowsForMixed) ? creolabsMediaRowsForMixed : [],
    payments: [],
    selectedYear: 'all',
    selectedMonth: 'all',
    search: '',
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
          year,
          monthIndex,
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

  const canonicalizeAffiliateId = useMemo(() => {
    const byId =
      affiliateIndexById && typeof affiliateIndexById === 'object' ? affiliateIndexById : null
    const indexNameToId = {}

    if (byId) {
      Object.entries(byId).forEach(([id, entry]) => {
        const name =
          typeof entry === 'string'
            ? entry.trim()
            : String(entry?.name || entry?.affiliateName || '').trim()
        if (!name) return
        const k = name.toLowerCase()
        if (!indexNameToId[k]) indexNameToId[k] = id
      })
    }

    const derivedNameToId = {}
    ;(ledger?.affiliateSummaries || []).forEach((a) => {
      const id = String(a?.affiliateId || '').trim()
      const name = String(a?.affiliateName || '').trim()
      if (!id || !name) return
      const k = name.toLowerCase()
      if (!derivedNameToId[k]) derivedNameToId[k] = id
    })

    return (raw) => {
      const s = String(raw || '').trim() || '—'

      // If it's a known ID (affiliate_index.json), keep it.
      if (byId && Object.prototype.hasOwnProperty.call(byId, s)) return s

      // Try name -> id via affiliate_index.json.
      const maybeIndex = indexNameToId[s.toLowerCase()]
      if (maybeIndex) return maybeIndex

      // Fallback: try name -> id from current ledger summaries.
      const maybeDerived = derivedNameToId[s.toLowerCase()]
      return maybeDerived || s
    }
  }, [affiliateIndexById, ledger?.affiliateSummaries])

  const mixedPlByAffiliateMonth = useMemo(() => {
    const out = new Map()
    if (!isMixed) return out
    ;(mixedPlLedger?.ledger || []).forEach((row) => {
      const rawId = row?.affiliateId
      const id = canonicalizeAffiliateId
        ? canonicalizeAffiliateId(rawId)
        : String(rawId || '').trim() || '—'
      const year = Number(row?.year)
      const monthIndex = Number(row?.monthIndex)
      if (!id || !Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0) return
      const key = `${id}|${year}|${monthIndex}`
      out.set(key, Number(row?.pl) || 0)
    })

    return out
  }, [isMixed, mixedPlLedger?.ledger, canonicalizeAffiliateId])

  const mixedPlAllTimeByAffiliate = useMemo(() => {
    const out = new Map()
    if (!isMixed) return out
    ;(mixedPlAllTimeLedger?.ledger || []).forEach((row) => {
      const rawId = row?.affiliateId
      const id = canonicalizeAffiliateId
        ? canonicalizeAffiliateId(rawId)
        : String(rawId || '').trim() || '—'
      if (!id) return
      out.set(id, (out.get(id) || 0) + (Number(row?.pl) || 0))
    })
    return out
  }, [isMixed, mixedPlAllTimeLedger?.ledger, canonicalizeAffiliateId])

  const creolabsBalance = useMemo(() => {
    if (dataSource !== 'creolabs' && dataSource !== 'mixed') {
      return {
        available: false,
        wantMonth: null,
        monthByAffiliate: new Map(),
        everByAffiliate: new Map(),
      }
    }

    const rows = Array.isArray(creolabsClientRows) ? creolabsClientRows : []
    const wantedMonthKey = String(effectiveMonthKey || '').trim()
    const wantMonth = wantedMonthKey && wantedMonthKey !== 'all' ? wantedMonthKey : null
    if (!rows.length) {
      return {
        available: false,
        wantMonth,
        monthByAffiliate: new Map(),
        everByAffiliate: new Map(),
      }
    }

    // Balance is a monthly snapshot (per affiliate: SUM(max(balance) per client)).
    // For “All Time”, use the average of monthly snapshots (not a sum over months).
    const records = []

    for (const r of rows) {
      const parsed = parseCreolabsPeriodToMonthScore(r?.periodId)
      if (!parsed) continue
      const rawAff = r?.affiliateId
      const affiliateId = canonicalizeAffiliateId
        ? canonicalizeAffiliateId(rawAff)
        : String(rawAff || '').trim()
      if (!affiliateId) continue
      const clientId = String(r?.clientId || r?.clientLogin || r?.clientName || '').trim()
      if (!clientId) continue
      const bal = Number(r?.balance)
      if (!Number.isFinite(bal)) continue

      records.push({
        affiliateId,
        monthKey: parsed.monthKey,
        score: parsed.score,
        clientId,
        bal,
      })
    }

    const monthByAffiliate = new Map()
    const everByAffiliate = new Map()

    if (!records.length) {
      return {
        available: false,
        wantMonth,
        monthByAffiliate,
        everByAffiliate,
      }
    }

    records.sort((a, b) => {
      const affCmp = a.affiliateId.localeCompare(b.affiliateId)
      if (affCmp) return affCmp
      const scoreCmp = Number(a.score) - Number(b.score)
      if (scoreCmp) return scoreCmp
      return a.clientId.localeCompare(b.clientId)
    })

    const sumMonthsByAffiliate = new Map()
    const monthsCountByAffiliate = new Map()

    let curAffiliate = null
    let curMonthKey = null
    let curClient = null
    let curClientMax = 0
    let curMonthSum = 0
    let curAffiliateSum = 0
    let curAffiliateMonths = 0

    const flushClient = () => {
      if (curClient == null) return
      curMonthSum += Number(curClientMax) || 0
      curClient = null
      curClientMax = 0
    }

    const flushMonth = () => {
      if (curMonthKey == null) return
      flushClient()
      if (wantMonth && curMonthKey === wantMonth) {
        monthByAffiliate.set(curAffiliate, curMonthSum)
      }
      curAffiliateSum += Number(curMonthSum) || 0
      curAffiliateMonths += 1
      curMonthKey = null
      curMonthSum = 0
    }

    const flushAffiliate = () => {
      if (curAffiliate == null) return
      flushMonth()
      sumMonthsByAffiliate.set(curAffiliate, curAffiliateSum)
      monthsCountByAffiliate.set(curAffiliate, curAffiliateMonths)
      curAffiliate = null
      curAffiliateSum = 0
      curAffiliateMonths = 0
    }

    for (const rec of records) {
      if (curAffiliate !== rec.affiliateId) {
        flushAffiliate()
        curAffiliate = rec.affiliateId
        curMonthKey = rec.monthKey
        curClient = rec.clientId
        curClientMax = rec.bal
        continue
      }

      if (curMonthKey !== rec.monthKey) {
        flushMonth()
        curMonthKey = rec.monthKey
        curClient = rec.clientId
        curClientMax = rec.bal
        continue
      }

      if (curClient !== rec.clientId) {
        flushClient()
        curClient = rec.clientId
        curClientMax = rec.bal
        continue
      }

      if (Number(rec.bal) > Number(curClientMax)) curClientMax = rec.bal
    }

    flushAffiliate()

    sumMonthsByAffiliate.forEach((sum, affiliateId) => {
      const count = Number(monthsCountByAffiliate.get(affiliateId)) || 0
      if (count > 0) everByAffiliate.set(affiliateId, Number(sum) / count)
    })

    return {
      available: true,
      wantMonth,
      monthByAffiliate,
      everByAffiliate,
    }
  }, [dataSource, creolabsClientRows, effectiveMonthKey, canonicalizeAffiliateId])

  const roiFormulaTitle = useMemo(() => {
    return t('investments.details.title.roiFormula')
  }, [t])

  const formatRoiCell = (value) => {
    if (!Number.isFinite(Number(value))) return '—'
    return formatRoiRatio(value, 2)
  }

  const formatRoiCellFull = (value) => {
    if (!Number.isFinite(Number(value))) return '—'
    return formatRoiRatio(value, 4)
  }

  const singleColumnDefs = useMemo(() => {
    const cols = [
      { id: 'affiliate', label: 'Affiliate', width: 260 },
      { id: 'rank', label: 'Rank', width: 64 },

      {
        id: 'netDepositsMonth',
        label: `Net Deposits (${monthRef})${cellxSourceSuffix}`,
        width: 132,
      },
      {
        id: 'netDepositsEver',
        label: `Net Deposits (All Time)${cellxSourceSuffix}`,
        width: 132,
      },
    ]

    if (showCommissionColumns) {
      cols.push({
        id: 'commissionMonth',
        label: `Commission (${monthRef})${cellxSourceSuffix}`,
        width: 132,
      })
      cols.push({
        id: 'commissionEver',
        label: `Commission (All Time)${cellxSourceSuffix}`,
        width: 132,
      })
    }

    cols.push({ id: 'plMonth', label: `P&L (${monthRef})${creolabsSourceSuffix}`, width: 132 })
    cols.push({ id: 'plEver', label: `P&L (All Time)${creolabsSourceSuffix}`, width: 132 })

    cols.push({ id: 'roiMonth', label: `ROI (${monthRef})${cellxSourceSuffix}`, width: 112 })
    cols.push({ id: 'roiEver', label: `ROI (All Time)${cellxSourceSuffix}`, width: 112 })

    cols.push({
      id: 'balanceMonth',
      label: `Balance (${monthRef})${creolabsSourceSuffix}`,
      width: 150,
    })
    cols.push({
      id: 'balanceEver',
      label: `Balance (Historic AVG)${creolabsSourceSuffix}`,
      width: 150,
    })

    if (!isPublicShare) {
      cols.push({ id: 'lastMonth', label: 'Last Month', width: 120 })
    }

    cols.push({ id: 'details', label: 'Details', width: 140 })

    return cols
  }, [monthRef, showCommissionColumns, isPublicShare, cellxSourceSuffix, creolabsSourceSuffix])

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
      locked.add('lastMonth')
    }
    return locked
  }, [isPublicShare])

  const isSingleVisible = (id) => {
    if (singleLockedColumns.has(id)) return true
    return singleColumnVisibility?.[id] !== false
  }

  const toggleSingleColumn = (id) => {
    setSingleColumnVisibility((prev) => {
      if (singleLockedColumns.has(id)) return prev
      const isCurrentlyVisible = prev?.[id] !== false
      return { ...prev, [id]: !isCurrentlyVisible }
    })
  }

  const resetSingleColumns = () => {
    setSingleColumnVisibility(singleDefaultVisibility)
  }

  const singleVisibleColumnDefs = singleColumnDefs.filter((c) => isSingleVisible(c.id))
  const singleVisibleColSpan = Math.max(1, singleVisibleColumnDefs.length)

  // Details column is locked visible; keeping expanded rows safe.

  const scopeMonthTotals = useMemo(() => {
    const acc = { netDeposits: 0, commission: 0, pl: 0, roi: 0 }
    if (!scopeLatestMonth) return acc
    ledger.ledger.forEach((row) => {
      if (row.month !== scopeLatestMonth) return
      acc.netDeposits += Number(row.netDeposits) || 0
      acc.commission += Number(row.commissionTotal) || 0
      if (isMixed) {
        const canonicalId = canonicalizeAffiliateId
          ? canonicalizeAffiliateId(row?.affiliateId)
          : String(row?.affiliateId || '').trim() || '—'
        const key = `${canonicalId}|${Number(row.year)}|${Number(row.monthIndex)}`
        acc.pl += Number(mixedPlByAffiliateMonth.get(key)) || 0
      } else {
        acc.pl += Number(row.pl) || 0
      }
    })

    acc.roi = acc.commission > 0 ? acc.netDeposits / acc.commission : Number.NaN
    return acc
  }, [ledger.ledger, scopeLatestMonth, isMixed, mixedPlByAffiliateMonth, canonicalizeAffiliateId])

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
      acc.roi = acc.commission > 0 ? acc.netDeposits / acc.commission : Number.NaN
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
      if (isMixed) {
        const canonicalId = canonicalizeAffiliateId
          ? canonicalizeAffiliateId(a?.affiliateId)
          : String(a?.affiliateId || '').trim() || '—'
        acc.pl += Number(mixedPlAllTimeByAffiliate.get(canonicalId)) || 0
      } else {
        acc.pl += entry.pl
      }
    })

    acc.roi = acc.commission > 0 ? acc.netDeposits / acc.commission : Number.NaN
    return acc
  }, [
    ledger.affiliateSummaries,
    allTimeByAffiliate,
    isMixed,
    mixedPlAllTimeByAffiliate,
    canonicalizeAffiliateId,
  ])

  const balanceTotals = useMemo(() => {
    if (!creolabsBalance.available) {
      return { month: null, ever: null }
    }
    let month = 0
    let ever = 0
    ledger.affiliateSummaries.forEach((a) => {
      const rawId = a?.affiliateId
      const id = canonicalizeAffiliateId
        ? canonicalizeAffiliateId(rawId)
        : String(rawId || '').trim()
      if (creolabsBalance.monthByAffiliate.has(id)) {
        month += Number(creolabsBalance.monthByAffiliate.get(id)) || 0
      }
      if (creolabsBalance.everByAffiliate.has(id)) {
        ever += Number(creolabsBalance.everByAffiliate.get(id)) || 0
      }
    })
    return { month, ever }
  }, [ledger.affiliateSummaries, creolabsBalance, canonicalizeAffiliateId])

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
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
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
                helper={formatEuroFullNoDecimals(ledger.totals.avgCpa)}
              />
              <KpiCard
                label={t('investments.kpi.totalCommissions')}
                value={formatEuro(ledger.totals.totalCommission)}
                helper={formatEuroFullNoDecimals(ledger.totals.totalCommission)}
              />
              <KpiCard
                label={t('investments.kpi.commissionPayable')}
                value={formatEuro(ledger.totals.totalMarketingPayable)}
                helper={formatEuroFullNoDecimals(ledger.totals.totalMarketingPayable)}
                tone="#22c55e"
              />
              <KpiCard
                label={t('investments.kpi.commissionsDeferred')}
                value={formatEuro(ledger.totals.totalMarketingDeferred)}
                helper={formatEuroFullNoDecimals(ledger.totals.totalMarketingDeferred)}
                tone="#f97316"
              />
              <KpiCard
                label={t('investments.kpi.roi')}
                value={formatRoiCell(ledger.totals.totalRoi)}
                helper={formatRoiCellFull(ledger.totals.totalRoi)}
                fullValue={roiFormulaTitle}
                tone={(() => {
                  const v = ledger.totals.totalRoi
                  if (!Number.isFinite(Number(v))) return '#f87171'
                  return Number(v) >= 1.5 ? '#34d399' : '#f87171'
                })()}
              />
              <KpiCard
                label={t('investments.kpi.paid')}
                value={formatEuro(
                  dataSource === 'creolabs'
                    ? ledger.totals.totalCommission
                    : ledger.totals.totalPaid
                )}
                helper={formatEuroFullNoDecimals(
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
                <button className="btn secondary" onClick={resetSingleColumns}>
                  Reset columns
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
            {isPublicShare ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button className="btn secondary" onClick={resetSingleColumns}>
                  Reset columns
                </button>
              </div>
            ) : null}
            <StickyMetricsTable className="table payout-summary-table" maxHeight="70vh">
              <colgroup>
                {singleVisibleColumnDefs.map((c) => (
                  <col key={c.id} style={{ width: c.width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                    Affiliate
                  </th>
                  <th rowSpan={2} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    Rank
                  </th>
                  {(() => {
                    const span =
                      (isSingleVisible('netDepositsMonth') ? 1 : 0) +
                      (isSingleVisible('netDepositsEver') ? 1 : 0)
                    if (!span) return null
                    return (
                      <th
                        colSpan={span}
                        className="payout-summary-group"
                        style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                      >
                        {`Net Deposits${cellxSourceSuffix}`}
                      </th>
                    )
                  })()}
                  {showCommissionColumns
                    ? (() => {
                        const span =
                          (isSingleVisible('commissionMonth') ? 1 : 0) +
                          (isSingleVisible('commissionEver') ? 1 : 0)
                        if (!span) return null
                        return (
                          <th
                            colSpan={span}
                            className="payout-summary-group payout-summary-group-sep"
                            style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                            title={
                              dataSource === 'creolabs'
                                ? 'Commission (from CellX Payments)'
                                : 'Commission (from CellX Media Report)'
                            }
                          >
                            {`Commission${cellxSourceSuffix}`}
                          </th>
                        )
                      })()
                    : null}
                  {(() => {
                    const span =
                      (isSingleVisible('plMonth') ? 1 : 0) + (isSingleVisible('plEver') ? 1 : 0)
                    if (!span) return null
                    return (
                      <th
                        colSpan={span}
                        className="payout-summary-group payout-summary-group-sep"
                        style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                      >
                        {`P&L${creolabsSourceSuffix}`}
                      </th>
                    )
                  })()}
                  {(() => {
                    const span =
                      (isSingleVisible('roiMonth') ? 1 : 0) + (isSingleVisible('roiEver') ? 1 : 0)
                    if (!span) return null
                    return (
                      <th
                        colSpan={span}
                        className="payout-summary-group payout-summary-group-sep"
                        style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                        title={roiFormulaTitle}
                      >
                        {`ROI${cellxSourceSuffix}`}
                      </th>
                    )
                  })()}
                  {(() => {
                    const span =
                      (isSingleVisible('balanceMonth') ? 1 : 0) +
                      (isSingleVisible('balanceEver') ? 1 : 0)
                    if (!span) return null
                    return (
                      <th
                        colSpan={span}
                        className="payout-summary-group payout-summary-group-sep"
                        style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                        title="Balance (per month) = SUM(max client balances). Balance (Historic AVG) = average of monthly snapshots."
                      >
                        {`Balance${creolabsSourceSuffix}`}
                      </th>
                    )
                  })()}
                  {!isPublicShare ? (
                    <th rowSpan={2} style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                      Last Month
                    </th>
                  ) : null}
                  <th rowSpan={2} style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                    Details
                  </th>
                </tr>
                <tr>
                  {isSingleVisible('netDepositsMonth') ? (
                    <th
                      className="payout-summary-sub"
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title={`Totals for ${monthRef}\nClick to hide`}
                      onClick={() => toggleSingleColumn('netDepositsMonth')}
                    >
                      {monthRef}
                    </th>
                  ) : null}
                  {isSingleVisible('netDepositsEver') ? (
                    <th
                      className="payout-summary-sub"
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title="All-time totals\nClick to hide"
                      onClick={() => toggleSingleColumn('netDepositsEver')}
                    >
                      All Time
                    </th>
                  ) : null}

                  {showCommissionColumns && isSingleVisible('commissionMonth') ? (
                    <th
                      className="payout-summary-sub payout-summary-group-sep"
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title={`Totals for ${monthRef}\nClick to hide`}
                      onClick={() => toggleSingleColumn('commissionMonth')}
                    >
                      {monthRef}
                    </th>
                  ) : null}
                  {showCommissionColumns && isSingleVisible('commissionEver') ? (
                    <th
                      className={`payout-summary-sub${
                        showCommissionColumns && !isSingleVisible('commissionMonth')
                          ? ' payout-summary-group-sep'
                          : ''
                      }`}
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title="All-time totals\nClick to hide"
                      onClick={() => toggleSingleColumn('commissionEver')}
                    >
                      All Time
                    </th>
                  ) : null}

                  {isSingleVisible('plMonth') ? (
                    <th
                      className="payout-summary-sub payout-summary-group-sep"
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title={`Totals for ${monthRef}\nClick to hide`}
                      onClick={() => toggleSingleColumn('plMonth')}
                    >
                      {monthRef}
                    </th>
                  ) : null}
                  {isSingleVisible('plEver') ? (
                    <th
                      className={`payout-summary-sub${
                        !isSingleVisible('plMonth') ? ' payout-summary-group-sep' : ''
                      }`}
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title="All-time totals\nClick to hide"
                      onClick={() => toggleSingleColumn('plEver')}
                    >
                      All Time
                    </th>
                  ) : null}

                  {isSingleVisible('roiMonth') ? (
                    <th
                      className="payout-summary-sub payout-summary-group-sep"
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title={`${roiFormulaTitle}\nTotals for ${monthRef}\nClick to hide`}
                      onClick={() => toggleSingleColumn('roiMonth')}
                    >
                      {monthRef}
                    </th>
                  ) : null}
                  {isSingleVisible('roiEver') ? (
                    <th
                      className={`payout-summary-sub${
                        !isSingleVisible('roiMonth') ? ' payout-summary-group-sep' : ''
                      }`}
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title={`${roiFormulaTitle}\nAll Time\nClick to hide`}
                      onClick={() => toggleSingleColumn('roiEver')}
                    >
                      All Time
                    </th>
                  ) : null}

                  {isSingleVisible('balanceMonth') ? (
                    <th
                      className="payout-summary-sub payout-summary-group-sep"
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title={`Totals for ${monthRef}\nClick to hide`}
                      onClick={() => toggleSingleColumn('balanceMonth')}
                    >
                      {monthRef}
                    </th>
                  ) : null}
                  {isSingleVisible('balanceEver') ? (
                    <th
                      className={`payout-summary-sub${
                        !isSingleVisible('balanceMonth') ? ' payout-summary-group-sep' : ''
                      }`}
                      style={{
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title="Historic AVG (monthly snapshots)\nClick to hide"
                      onClick={() => toggleSingleColumn('balanceEver')}
                    >
                      Historic AVG
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 600 }}>
                  <td>Totals</td>
                  <td style={{ textAlign: 'right', color: '#9ca3af' }}>—</td>
                  {isSingleVisible('netDepositsMonth') ? (
                    <td
                      style={{
                        textAlign: 'right',
                        color: '#38bdf8',
                      }}
                      className="num"
                      title={`Totals for ${monthRef}\n${formatEuroFullNoDecimals(scopeMonthTotals.netDeposits)}`}
                    >
                      {formatEuroFullNoDecimals(scopeMonthTotals.netDeposits)}
                    </td>
                  ) : null}
                  {isSingleVisible('netDepositsEver') ? (
                    <td
                      style={{
                        textAlign: 'right',
                        color: '#38bdf8',
                      }}
                      className="num"
                      title={`All-time totals\n${formatEuroFullNoDecimals(allTimeVisibleTotals.netDeposits)}`}
                    >
                      {formatEuroFullNoDecimals(allTimeVisibleTotals.netDeposits)}
                    </td>
                  ) : null}

                  {showCommissionColumns && isSingleVisible('commissionMonth') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className="num payout-summary-group-sep"
                      title={`Totals for ${monthRef}\n${formatEuroFullNoDecimals(scopeMonthTotals.commission)}`}
                    >
                      {formatEuroFullNoDecimals(scopeMonthTotals.commission)}
                    </td>
                  ) : null}
                  {showCommissionColumns && isSingleVisible('commissionEver') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className={`num${
                        !isSingleVisible('commissionMonth') ? ' payout-summary-group-sep' : ''
                      }`}
                      title={`All-time totals\n${formatEuroFullNoDecimals(allTimeVisibleTotals.commission)}`}
                    >
                      {formatEuroFullNoDecimals(allTimeVisibleTotals.commission)}
                    </td>
                  ) : null}

                  {isSingleVisible('plMonth') ? (
                    <td
                      style={{
                        textAlign: 'right',
                        color: scopeMonthTotals.pl >= 0 ? '#34d399' : '#f87171',
                      }}
                      className="num payout-summary-group-sep"
                      title={`Totals for ${monthRef}\n${formatEuroFullNoDecimals(scopeMonthTotals.pl)}`}
                    >
                      {formatEuroFullNoDecimals(scopeMonthTotals.pl)}
                    </td>
                  ) : null}
                  {isSingleVisible('plEver') ? (
                    <td
                      style={{
                        textAlign: 'right',
                        color: allTimeVisibleTotals.pl >= 0 ? '#34d399' : '#f87171',
                      }}
                      className={`num${!isSingleVisible('plMonth') ? ' payout-summary-group-sep' : ''}`}
                      title={`All-time totals\n${formatEuroFullNoDecimals(allTimeVisibleTotals.pl)}`}
                    >
                      {formatEuroFullNoDecimals(allTimeVisibleTotals.pl)}
                    </td>
                  ) : null}

                  {isSingleVisible('roiMonth') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className="num payout-summary-group-sep"
                      title={`${roiFormulaTitle}\nTotals for ${monthRef}\n${formatRoiCellFull(scopeMonthTotals.roi)}`}
                    >
                      {Number.isFinite(Number(scopeMonthTotals.roi)) ? (
                        <span style={roiPillStyleRatio(scopeMonthTotals.roi)}>
                          {formatRoiCell(scopeMonthTotals.roi)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  ) : null}
                  {isSingleVisible('roiEver') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className={`num${!isSingleVisible('roiMonth') ? ' payout-summary-group-sep' : ''}`}
                      title={`${roiFormulaTitle}\nAll Time\n${formatRoiCellFull(allTimeVisibleTotals.roi)}`}
                    >
                      {Number.isFinite(Number(allTimeVisibleTotals.roi)) ? (
                        <span style={roiPillStyleRatio(allTimeVisibleTotals.roi)}>
                          {formatRoiCell(allTimeVisibleTotals.roi)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  ) : null}

                  {isSingleVisible('balanceMonth') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className="num payout-summary-group-sep"
                      title={
                        creolabsBalance.available && balanceTotals.month != null
                          ? `Totals for ${monthRef}\n${formatEuroFullNoDecimals(balanceTotals.month)}`
                          : undefined
                      }
                    >
                      {creolabsBalance.available && balanceTotals.month != null
                        ? formatEuroFullNoDecimals(balanceTotals.month)
                        : '—'}
                    </td>
                  ) : null}
                  {isSingleVisible('balanceEver') ? (
                    <td
                      style={{ textAlign: 'right' }}
                      className={`num${
                        !isSingleVisible('balanceMonth') ? ' payout-summary-group-sep' : ''
                      }`}
                      title={
                        creolabsBalance.available && balanceTotals.ever != null
                          ? `Historic AVG (monthly snapshots)\n${formatEuroFullNoDecimals(balanceTotals.ever)}`
                          : undefined
                      }
                    >
                      {creolabsBalance.available && balanceTotals.ever != null
                        ? formatEuroFullNoDecimals(balanceTotals.ever)
                        : '—'}
                    </td>
                  ) : null}
                  {!isPublicShare ? <td>—</td> : null}
                  <td></td>
                </tr>
                {(showAllAffiliates
                  ? ledger.affiliateSummaries
                  : ledger.affiliateSummaries.slice(0, 10)
                ).map((a) => (
                  <React.Fragment key={a.affiliateId}>
                    <tr>
                      <td title={String(a.affiliateId || '').trim() || undefined}>
                        {(() => {
                          const id = String(a.affiliateId || '').trim()
                          const mappedName = affiliateIndexById?.[id]
                          const name = (mappedName || a.affiliateName || '').trim()

                          if (name && id && name !== id) return `${name} (${id})`
                          return name || id || a.affiliateName
                        })()}
                      </td>
                      <td style={{ textAlign: 'right', color: '#9ca3af' }} className="num">
                        {a.rank}
                      </td>
                      {isSingleVisible('netDepositsMonth') ? (
                        <td
                          style={{
                            textAlign: 'right',
                            color: '#38bdf8',
                          }}
                          className="num"
                          title={`${t('investments.details.title.scopeMonthAffiliate')}\n${formatEuroFullNoDecimals(scopeLatestByAffiliate.get(a.affiliateId)?.netDeposits || 0)}`}
                        >
                          {formatEuroFullNoDecimals(
                            scopeLatestByAffiliate.get(a.affiliateId)?.netDeposits || 0
                          )}
                        </td>
                      ) : null}
                      {isSingleVisible('netDepositsEver') ? (
                        <td
                          style={{
                            textAlign: 'right',
                            color: '#38bdf8',
                          }}
                          className="num"
                          title={`${t('investments.details.title.scopeEverAffiliate')}\n${formatEuroFullNoDecimals(allTimeByAffiliate.get(a.affiliateId)?.netDeposits || 0)}`}
                        >
                          {formatEuroFullNoDecimals(
                            allTimeByAffiliate.get(a.affiliateId)?.netDeposits || 0
                          )}
                        </td>
                      ) : null}

                      {showCommissionColumns && isSingleVisible('commissionMonth') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className="num payout-summary-group-sep"
                          title={`${t('investments.details.title.scopeMonthAffiliate')}\n${formatEuroFullNoDecimals(scopeLatestByAffiliate.get(a.affiliateId)?.commission || 0)}`}
                        >
                          {formatEuroFullNoDecimals(
                            scopeLatestByAffiliate.get(a.affiliateId)?.commission || 0
                          )}
                        </td>
                      ) : null}
                      {showCommissionColumns && isSingleVisible('commissionEver') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className={`num${
                            !isSingleVisible('commissionMonth') ? ' payout-summary-group-sep' : ''
                          }`}
                          title={`${t('investments.details.title.scopeEverAffiliate')}\n${formatEuroFullNoDecimals(allTimeByAffiliate.get(a.affiliateId)?.commission || 0)}`}
                        >
                          {formatEuroFullNoDecimals(
                            allTimeByAffiliate.get(a.affiliateId)?.commission || 0
                          )}
                        </td>
                      ) : null}

                      {isSingleVisible('plMonth') ? (
                        <td
                          style={{
                            textAlign: 'right',
                            color: (() => {
                              if (!isMixed) {
                                return (scopeLatestByAffiliate.get(a.affiliateId)?.pl || 0) >= 0
                                  ? '#34d399'
                                  : '#f87171'
                              }

                              const latest = scopeLatestByAffiliate.get(a.affiliateId)
                              if (!latest) return '#9ca3af'
                              const canonicalId = canonicalizeAffiliateId
                                ? canonicalizeAffiliateId(a?.affiliateId)
                                : String(a?.affiliateId || '').trim() || '—'
                              const key = `${canonicalId}|${Number(latest.year)}|${Number(latest.monthIndex)}`
                              const v = Number(mixedPlByAffiliateMonth.get(key)) || 0
                              return v >= 0 ? '#34d399' : '#f87171'
                            })(),
                          }}
                          className="num payout-summary-group-sep"
                          title={`${t('investments.details.title.scopeMonthAffiliate')}\n${formatEuroFullNoDecimals(
                            (() => {
                              if (!isMixed)
                                return scopeLatestByAffiliate.get(a.affiliateId)?.pl || 0
                              const latest = scopeLatestByAffiliate.get(a.affiliateId)
                              if (!latest) return 0
                              const canonicalId = canonicalizeAffiliateId
                                ? canonicalizeAffiliateId(a?.affiliateId)
                                : String(a?.affiliateId || '').trim() || '—'
                              const key = `${canonicalId}|${Number(latest.year)}|${Number(latest.monthIndex)}`
                              return Number(mixedPlByAffiliateMonth.get(key)) || 0
                            })()
                          )}`}
                        >
                          {formatEuroFullNoDecimals(
                            (() => {
                              if (!isMixed)
                                return scopeLatestByAffiliate.get(a.affiliateId)?.pl || 0
                              const latest = scopeLatestByAffiliate.get(a.affiliateId)
                              if (!latest) return 0
                              const canonicalId = canonicalizeAffiliateId
                                ? canonicalizeAffiliateId(a?.affiliateId)
                                : String(a?.affiliateId || '').trim() || '—'
                              const key = `${canonicalId}|${Number(latest.year)}|${Number(latest.monthIndex)}`
                              return Number(mixedPlByAffiliateMonth.get(key)) || 0
                            })()
                          )}
                        </td>
                      ) : null}
                      {isSingleVisible('plEver') ? (
                        <td
                          style={{
                            textAlign: 'right',
                            color: (() => {
                              if (!isMixed) {
                                return (allTimeByAffiliate.get(a.affiliateId)?.pl || 0) >= 0
                                  ? '#34d399'
                                  : '#f87171'
                              }
                              const canonicalId = canonicalizeAffiliateId
                                ? canonicalizeAffiliateId(a?.affiliateId)
                                : String(a?.affiliateId || '').trim() || '—'
                              const v = Number(mixedPlAllTimeByAffiliate.get(canonicalId)) || 0
                              return v >= 0 ? '#34d399' : '#f87171'
                            })(),
                          }}
                          className={`num${!isSingleVisible('plMonth') ? ' payout-summary-group-sep' : ''}`}
                          title={`${t('investments.details.title.scopeEverAffiliate')}\n${formatEuroFullNoDecimals(
                            isMixed
                              ? Number(
                                  mixedPlAllTimeByAffiliate.get(
                                    canonicalizeAffiliateId
                                      ? canonicalizeAffiliateId(a?.affiliateId)
                                      : String(a?.affiliateId || '').trim() || '—'
                                  )
                                ) || 0
                              : allTimeByAffiliate.get(a.affiliateId)?.pl || 0
                          )}`}
                        >
                          {formatEuroFullNoDecimals(
                            isMixed
                              ? Number(
                                  mixedPlAllTimeByAffiliate.get(
                                    canonicalizeAffiliateId
                                      ? canonicalizeAffiliateId(a?.affiliateId)
                                      : String(a?.affiliateId || '').trim() || '—'
                                  )
                                ) || 0
                              : allTimeByAffiliate.get(a.affiliateId)?.pl || 0
                          )}
                        </td>
                      ) : null}

                      {isSingleVisible('roiMonth') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className="num payout-summary-group-sep"
                          title={`${roiFormulaTitle}\n${t('investments.details.title.scopeMonthAffiliate')}\n${formatRoiCellFull(
                            (() => {
                              const latest = scopeLatestByAffiliate.get(a.affiliateId)
                              if (!latest) return Number.NaN
                              return latest.roi
                            })()
                          )}`}
                        >
                          {(() => {
                            const latest = scopeLatestByAffiliate.get(a.affiliateId)
                            const v = latest ? latest.roi : Number.NaN

                            if (!Number.isFinite(Number(v))) return '—'

                            return <span style={roiPillStyleRatio(v)}>{formatRoiCell(v)}</span>
                          })()}
                        </td>
                      ) : null}
                      {isSingleVisible('roiEver') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className={`num${!isSingleVisible('roiMonth') ? ' payout-summary-group-sep' : ''}`}
                          title={`${roiFormulaTitle}\n${t('investments.details.title.scopeEverAffiliate')}\n${formatRoiCellFull(
                            (() => {
                              const entry = allTimeByAffiliate.get(a.affiliateId)
                              if (!entry) return Number.NaN
                              return entry.roi
                            })()
                          )}`}
                        >
                          {(() => {
                            const entry = allTimeByAffiliate.get(a.affiliateId)
                            const v = entry ? entry.roi : Number.NaN

                            if (!Number.isFinite(Number(v))) return '—'

                            return <span style={roiPillStyleRatio(v)}>{formatRoiCell(v)}</span>
                          })()}
                        </td>
                      ) : null}

                      {isSingleVisible('balanceMonth') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className="num payout-summary-group-sep"
                          title={(() => {
                            if (!creolabsBalance.available) return undefined
                            const key = canonicalizeAffiliateId
                              ? canonicalizeAffiliateId(a?.affiliateId)
                              : String(a?.affiliateId || '').trim()
                            if (!creolabsBalance.monthByAffiliate.has(key)) return undefined
                            return `${t('investments.details.title.scopeMonthAffiliate')}\n${formatEuroFullNoDecimals(creolabsBalance.monthByAffiliate.get(key))}`
                          })()}
                        >
                          {(() => {
                            if (!creolabsBalance.available) return '—'
                            const key = canonicalizeAffiliateId
                              ? canonicalizeAffiliateId(a?.affiliateId)
                              : String(a?.affiliateId || '').trim()
                            if (!creolabsBalance.monthByAffiliate.has(key)) return '—'
                            return formatEuroFullNoDecimals(
                              creolabsBalance.monthByAffiliate.get(key)
                            )
                          })()}
                        </td>
                      ) : null}
                      {isSingleVisible('balanceEver') ? (
                        <td
                          style={{ textAlign: 'right' }}
                          className={`num${
                            !isSingleVisible('balanceMonth') ? ' payout-summary-group-sep' : ''
                          }`}
                          title={(() => {
                            if (!creolabsBalance.available) return undefined
                            const key = canonicalizeAffiliateId
                              ? canonicalizeAffiliateId(a?.affiliateId)
                              : String(a?.affiliateId || '').trim()
                            if (!creolabsBalance.everByAffiliate.has(key)) return undefined
                            return `Historic AVG (monthly snapshots)\n${formatEuroFullNoDecimals(creolabsBalance.everByAffiliate.get(key))}`
                          })()}
                        >
                          {(() => {
                            if (!creolabsBalance.available) return '—'
                            const key = canonicalizeAffiliateId
                              ? canonicalizeAffiliateId(a?.affiliateId)
                              : String(a?.affiliateId || '').trim()
                            if (!creolabsBalance.everByAffiliate.has(key)) return '—'
                            return formatEuroFullNoDecimals(
                              creolabsBalance.everByAffiliate.get(key)
                            )
                          })()}
                        </td>
                      ) : null}
                      {!isPublicShare ? (
                        <td>{a.lastMonth ? monthLabel(locale, a.lastMonth) : '—'}</td>
                      ) : null}
                      <td>
                        <button className="btn" onClick={() => toggleExpand(a.affiliateId)}>
                          {expanded === a.affiliateId
                            ? t('common.hide')
                            : t('investments.button.details')}
                        </button>
                      </td>
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
                                    {`${t('investments.details.header.netDeposits')}${cellxSourceSuffix}`}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {`${t('investments.details.header.commissions')}${cellxSourceSuffix}`}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {`${t('investments.details.header.pl')}${creolabsSourceSuffix}`}
                                  </th>
                                  <th style={{ textAlign: 'right' }} title={roiFormulaTitle}>
                                    {`${t('investments.details.header.roi')}${cellxSourceSuffix}`}
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
                                        title={formatEuroFullNoDecimals(r.netDeposits)}
                                      >
                                        {formatEuroFullNoDecimals(r.netDeposits)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFullNoDecimals(r.commissionTotal)}
                                      >
                                        {formatEuroFullNoDecimals(r.commissionTotal)}
                                      </td>
                                      <td
                                        style={{
                                          textAlign: 'right',
                                          color: r.pl >= 0 ? '#34d399' : '#f87171',
                                        }}
                                        className="num"
                                        title={formatEuroFullNoDecimals(r.pl)}
                                      >
                                        {formatEuroFullNoDecimals(
                                          (() => {
                                            if (!isMixed) return r.pl
                                            const canonicalId = canonicalizeAffiliateId
                                              ? canonicalizeAffiliateId(r?.affiliateId)
                                              : String(r?.affiliateId || '').trim() || '—'
                                            const key = `${canonicalId}|${Number(r.year)}|${Number(r.monthIndex)}`
                                            return Number(mixedPlByAffiliateMonth.get(key)) || 0
                                          })()
                                        )}
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
                                        title={`${roiFormulaTitle}\n${formatRoiCellFull(r.roi)}`}
                                      >
                                        {(() => {
                                          const v = r.roi
                                          const good =
                                            Number.isFinite(Number(v)) && Number(v) >= 1.5

                                          return (
                                            <>
                                              <span
                                                style={{
                                                  width: 10,
                                                  height: 10,
                                                  borderRadius: '50%',
                                                  background: good ? '#22c55e' : '#ef4444',
                                                }}
                                              />
                                              {Number.isFinite(Number(v)) ? (
                                                <span style={roiPillStyleRatio(v)}>
                                                  {formatRoiCell(v)}
                                                </span>
                                              ) : (
                                                <span style={{ color: '#9ca3af', fontWeight: 700 }}>
                                                  —
                                                </span>
                                              )}
                                            </>
                                          )
                                        })()}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFullNoDecimals(r.negotiatedCpa)}
                                      >
                                        {formatEuroFullNoDecimals(r.negotiatedCpa)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFullNoDecimals(r.marketingExpected)}
                                      >
                                        {formatEuroFullNoDecimals(r.marketingExpected)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFullNoDecimals(r.marketingActual)}
                                      >
                                        {formatEuroFullNoDecimals(r.marketingActual)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#22c55e' }}
                                        className="num"
                                        title={formatEuroFullNoDecimals(r.marketingPayable)}
                                      >
                                        {formatEuroFullNoDecimals(r.marketingPayable)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#f97316' }}
                                        className="num"
                                        title={formatEuroFullNoDecimals(r.marketingDeferred)}
                                      >
                                        {formatEuroFullNoDecimals(r.marketingDeferred)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#38bdf8' }}
                                        className="num"
                                        title={formatEuroFullNoDecimals(r.paidAmount)}
                                      >
                                        {formatEuroFullNoDecimals(r.paidAmount)}
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
                                      style={{ textAlign: 'center', color: '#9ca3af' }}
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
                      style={{ textAlign: 'center', color: '#9ca3af' }}
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
  creolabsClientRows,
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

  const mixedLabel = t('investments.source.mixed')
  const cellxpertLabel = t('investments.source.cellxpert')
  const creolabsLabel = t('investments.source.creolabs')
  const singleModeLabel = t('investments.viewMode.single')
  const unifiedModeLabel = t('investments.viewMode.unified')
  const unifiedHint = t('investments.unified.sourceDisabledHint')

  const switchToMixedSingle = () => {
    requestDataSource('mixed')
    requestViewMode('single')
  }

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
                creolabsClientRows={creolabsClientRows}
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
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
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
              className={dataSource === 'mixed' ? 'btn' : 'btn secondary'}
              onClick={switchToMixedSingle}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 800,
                borderRadius: 999,
                whiteSpace: 'nowrap',
                ...(dataSource === 'mixed'
                  ? {}
                  : {
                      background: 'transparent',
                      opacity: 0.9,
                    }),
              }}
              title={t('investments.viewMode.single')}
            >
              {mixedLabel}
            </button>
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
            creolabsClientRows={creolabsClientRows}
          />
        </div>
      </div>
    </div>
  )
}
