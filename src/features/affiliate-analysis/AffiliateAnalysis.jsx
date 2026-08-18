import { useEffect, useMemo, useState } from 'react'
import CardSection from '../../components/common/CardSection'
import { getPublicShareOrigin } from '../../utils/publicShareOrigin'
import KpiCard from '../../components/common/KpiCard'
import PnLTrendChart from '../../components/PnLTrendChart'
import {
  formatEuro,
  formatEuroFull,
  formatNumberShort,
  formatPercent,
  normalizeKey,
} from '../../lib/formatters'
import YearSelector from '../../components/common/YearSelector'
import { useMediaPaymentsData } from '../media-payments/hooks/useMediaPaymentsData'
import { loadCellxAffiliateMonthTable } from '../cellx/services/cellxService'
import AnalysisEngine from './components/AnalysisEngine'
import { buildWeeklyAffiliateReport } from './utils/buildWeeklyAffiliateReport'
import { computeCohortBreakEvenForAffiliate } from './utils/computeCohortBreakEvenForAffiliate'
import {
  filterTop10CohortRowsForAffiliate,
  loadTop10CohortData,
} from './utils/getTop10CohortDataForAffiliate'
import { checkDataStatus } from '../../utils/dataStatusChecker'
import { useDataStatus } from '../../context/DataStatusContext'
import { useI18n } from '../../i18n/I18nContext'

const badgeTone = (t, profit) => {
  if (profit >= 0) return { label: t('affiliateAnalysis.badge.healthy'), color: '#22c55e' }
  if (profit > -1000) return { label: t('affiliateAnalysis.badge.watch'), color: '#f59e0b' }
  return { label: t('affiliateAnalysis.badge.atRisk'), color: '#ef4444' }
}

const matchesAffiliate = (value, row) => {
  const sel = normalizeKey(value)
  if (!sel) return false
  return [row?.affiliate, row?.affiliateId, row?.uid].some(
    (candidate) => normalizeKey(candidate) === sel
  )
}

const monthRowMatchesYear = (row, selectedYear) => {
  if (!selectedYear || selectedYear === 'all') return true
  return String(row?.year || '') === String(selectedYear)
}

const aggregateFastAffiliateRows = (
  rows = [],
  selectedYear = 'all',
  affiliateNameById = new Map()
) => {
  const byAffiliate = new Map()
  rows.forEach((row) => {
    if (!monthRowMatchesYear(row, selectedYear)) return
    const affiliateId = String(row?.affiliateId || row?.uid || row?.affiliateName || '').trim()
    const rawName = String(row?.affiliateName || row?.affiliate || '').trim()
    const affiliateName =
      affiliateNameById.get(normalizeKey(affiliateId)) ||
      (rawName && rawName !== affiliateId ? rawName : '') ||
      affiliateId
    if (!affiliateName) return
    const key = normalizeKey(affiliateName || affiliateId)
    const entry = byAffiliate.get(key) || {
      affiliate: affiliateName,
      affiliateId,
      pl: 0,
      netDeposits: 0,
      payments: 0,
    }
    entry.affiliate = affiliateName
    entry.affiliateId = affiliateId || entry.affiliateId
    entry.pl += Number(row?.pl) || 0
    entry.netDeposits += Number(row?.netDeposits) || 0
    entry.payments += Number(row?.commission) || 0
    byAffiliate.set(key, entry)
  })

  return Array.from(byAffiliate.values())
    .map((entry) => ({ ...entry, profit: (entry.pl || 0) - (entry.payments || 0) }))
    .sort((a, b) => (b.profit || 0) - (a.profit || 0))
}

export default function AffiliateAnalysis({ initialAffiliate = '', initialYear = '' } = {}) {
  const { t } = useI18n()
  const [selectedAffiliate, setSelectedAffiliate] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const {
    mediaRows,
    payments,
    affiliateOptions,
    loading: fullDataLoading,
  } = useMediaPaymentsData({
    includePayments: Boolean(selectedAffiliate),
  })
  const [fastAffiliateRows, setFastAffiliateRows] = useState([])
  const [fastAffiliateMeta, setFastAffiliateMeta] = useState(null)
  const [fastAffiliateLoading, setFastAffiliateLoading] = useState(true)
  const [top10CohortRows, setTop10CohortRows] = useState([])
  const [shareBusy, setShareBusy] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareError, setShareError] = useState('')
  const { setDataStatus } = useDataStatus()

  // Allow deep-linking and embedding:
  // - /affiliate?affiliate=<nameOrId>&year=<all|YYYY>
  // - <AffiliateAnalysis initialAffiliate="..." initialYear="..." />
  //
  // Note: we intentionally only auto-apply these values when the local state
  // is still empty/default so we don't override the user's manual selections.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new window.URLSearchParams(window.location.search || '')
    const urlAffiliate = String(params.get('affiliate') || '').trim()
    const urlYear = String(params.get('year') || '').trim()

    const seedAffiliate = String(initialAffiliate || urlAffiliate || '').trim()
    const seedYear = String(initialYear || urlYear || '').trim()

    if (!selectedAffiliate && seedAffiliate) {
      setSelectedAffiliate(seedAffiliate)
    }
    if (selectedYear === 'all' && seedYear && seedYear !== 'all') {
      setSelectedYear(seedYear)
    }
  }, [initialAffiliate, initialYear, selectedAffiliate, selectedYear])

  const randomTokenSuffix = (len = 12) => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let out = ''
    const arr = new Uint8Array(len)
    try {
      window.crypto?.getRandomValues?.(arr)
      for (let i = 0; i < len; i++) out += alphabet[arr[i] % alphabet.length]
      return out
    } catch {
      // ignore
    }
    for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
    return out
  }

  const createShareLink = async () => {
    if (shareBusy) return
    setShareError('')
    setShareBusy(true)

    const shareOrigin = getPublicShareOrigin()
    const origin = window.location.origin
    const isLocalhost = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(origin)

    const payload = {
      k: 'affrep',
      g: Date.now(),
      affiliate: selectedAffiliate || '',
      year: selectedYear || 'all',
    }

    let href = null
    try {
      let resp = await fetch('/api/share/create-affiliate-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })
      if (!resp.ok) {
        // Backward-compatible fallback
        resp = await fetch('/api/share/create-affiliate-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        })
      }

      const data = await resp.json().catch(() => null)
      const token = data?.token
      if (resp.ok && token && String(token).startsWith('share_')) {
        href = `${shareOrigin}/share/affiliate-reports/${encodeURIComponent(token)}`
      }
    } catch {
      // ignore
    }

    if (!href && !isLocalhost) {
      const affiliatePath = selectedAffiliate ? `/${encodeURIComponent(selectedAffiliate)}` : ''
      href = `${shareOrigin}/share/affiliate-reports${affiliatePath}`
    }

    // Local dev fallback (Vite dev doesn't run serverless functions): store a marker in localStorage.
    if (!href && isLocalhost) {
      try {
        const token = `share_local_${randomTokenSuffix(16)}`
        const key = `bw_share_affrep:${token}`
        window.localStorage.setItem(key, JSON.stringify({ payload, createdAt: Date.now() }))
        href = `${origin}/share/affiliate-reports/${encodeURIComponent(token)}`
      } catch {
        // ignore
      }
    }

    if (!href) {
      if (!isLocalhost) {
        setShareError('Share link non disponibile (storage share non configurato).')
      } else {
        setShareError(t('affiliateAnalysis.share.error') || 'Unable to create share link')
      }
      setShareBusy(false)
      return
    }

    try {
      await navigator.clipboard.writeText(href)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 1400)
    } catch {
      // ignore
    }

    window.open(href, '_blank', 'noopener,noreferrer')
    setShareBusy(false)
  }

  const yearOptions = useMemo(() => {
    const set = new Set()
    mediaRows.forEach((r) => {
      if (Number.isFinite(r.year)) set.add(r.year)
    })
    payments.forEach((p) => {
      if (Number.isFinite(p.year)) set.add(p.year)
    })
    return Array.from(set).sort((a, b) => a - b)
  }, [mediaRows, payments])

  const matchesYear = (row) => {
    if (selectedYear === 'all') return true
    return Number(row?.year) === Number(selectedYear)
  }

  const filteredMedia = useMemo(() => {
    if (!selectedAffiliate) return []
    return mediaRows.filter((r) => matchesYear(r) && matchesAffiliate(selectedAffiliate, r))
  }, [mediaRows, selectedAffiliate, selectedYear])

  const filteredPayments = useMemo(() => {
    if (!selectedAffiliate) return []
    return payments.filter((p) => matchesYear(p) && matchesAffiliate(selectedAffiliate, p))
  }, [payments, selectedAffiliate, selectedYear])

  useEffect(() => {
    let cancelled = false
    setFastAffiliateLoading(true)
    loadCellxAffiliateMonthTable()
      .then((table) => {
        if (cancelled) return
        setFastAffiliateRows(Array.isArray(table?.rows) ? table.rows : [])
        setFastAffiliateMeta({
          source: table?.live
            ? 'cellxpert-admin-api'
            : table?.source || '/cellx_affiliate_month.json',
          generatedAt: table?.generatedAt || null,
        })
      })
      .catch(() => {
        if (!cancelled) {
          setFastAffiliateRows([])
          setFastAffiliateMeta(null)
        }
      })
      .finally(() => {
        if (!cancelled) setFastAffiliateLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    loadTop10CohortData()
      .then(setTop10CohortRows)
      .catch(() => setTop10CohortRows([]))
  }, [])

  useEffect(() => {
    if (mediaRows.length > 0) {
      const status = checkDataStatus(mediaRows, 'monthLabel', 'Media Report')
      setDataStatus(status)
    }
  }, [mediaRows])

  const affiliateNameById = useMemo(() => {
    const map = new Map()
    mediaRows.forEach((row) => {
      const id = normalizeKey(row.affiliateId || row.uid)
      const name = String(row.affiliate || '').trim()
      if (id && name && name !== '—') map.set(id, name)
    })
    return map
  }, [mediaRows])

  const fastTopAffiliates = useMemo(() => {
    return aggregateFastAffiliateRows(fastAffiliateRows, selectedYear, affiliateNameById)
      .map((entry) => ({
        ...entry,
        hasCohort: filterTop10CohortRowsForAffiliate(top10CohortRows, entry.affiliate).length > 0,
      }))
      .slice(0, 10)
  }, [affiliateNameById, fastAffiliateRows, selectedYear, top10CohortRows])

  const topAffiliates = useMemo(() => {
    const profitByAffiliate = new Map()
    mediaRows.forEach((r) => {
      const entry = profitByAffiliate.get(r.affiliate) || {
        affiliate: r.affiliate,
        pl: 0,
        netDeposits: 0,
        payments: 0,
      }
      entry.pl += Number(r.pl) || 0
      entry.netDeposits += Number(r.netDeposits) || 0
      profitByAffiliate.set(r.affiliate, entry)
    })
    payments.forEach((p) => {
      const entry = profitByAffiliate.get(p.affiliate) || {
        affiliate: p.affiliate,
        pl: 0,
        netDeposits: 0,
        payments: 0,
      }
      entry.payments += Number(p.amount) || 0
      profitByAffiliate.set(p.affiliate, entry)
    })

    const list = Array.from(profitByAffiliate.values()).map((entry) => ({
      ...entry,
      profit: (entry.pl || 0) - (entry.payments || 0),
      hasCohort: filterTop10CohortRowsForAffiliate(top10CohortRows, entry.affiliate).length > 0,
    }))

    return list.sort((a, b) => (b.profit || 0) - (a.profit || 0)).slice(0, 10)
  }, [mediaRows, payments, top10CohortRows])

  const visibleTopAffiliates = payments.length > 0 ? topAffiliates : fastTopAffiliates
  const topAffiliatesSource = payments.length > 0 ? 'full' : 'summary'

  const totals = useMemo(() => {
    if (!selectedAffiliate) return null
    const sum = (arr, field) => arr.reduce((acc, r) => acc + (Number(r[field]) || 0), 0)
    const registrations = sum(filteredMedia, 'registrations')
    const visitors = sum(filteredMedia, 'visitors')
    const ftd = sum(filteredMedia, 'ftd')
    const qftd = sum(filteredMedia, 'qftd')
    const netDeposits = sum(filteredMedia, 'netDeposits')
    const pl = sum(filteredMedia, 'pl')
    const paymentsTotal = sum(filteredPayments, 'amount')
    const users =
      sum(filteredMedia, 'uniqueVisitors') || sum(filteredMedia, 'visitors') || registrations
    const profit = pl - paymentsTotal
    const roi = paymentsTotal ? (profit / Math.max(Math.abs(paymentsTotal), 1)) * 100 : 0
    const cpa = ftd ? Math.abs(paymentsTotal) / Math.max(ftd, 1) : 0
    const arpu = registrations ? pl / Math.max(registrations, 1) : 0
    const ltv = users ? pl / Math.max(users, 1) : 0
    const profitMargin = pl ? (profit / pl) * 100 : 0
    return {
      registrations,
      visitors,
      ftd,
      qftd,
      netDeposits,
      pl,
      paymentsTotal,
      profit,
      roi,
      cpa,
      arpu,
      ltv,
      profitMargin,
      users,
    }
  }, [filteredMedia, filteredPayments, selectedAffiliate])

  const monthly = useMemo(() => {
    if (!selectedAffiliate) return []
    const map = new Map()
    filteredMedia.forEach((r) => {
      const key = r.monthKey || 'unknown'
      const acc = map.get(key) || {
        monthKey: key,
        monthLabel: r.monthLabel || key,
        monthIndex: r.monthIndex ?? -1,
        netDeposits: 0,
        pl: 0,
        payments: 0,
      }
      acc.netDeposits += r.netDeposits || 0
      acc.pl += r.pl || 0
      map.set(key, acc)
    })
    filteredPayments.forEach((p) => {
      const key = p.monthKey || 'unknown'
      const acc = map.get(key) || {
        monthKey: key,
        monthLabel: p.monthLabel || key,
        monthIndex: p.monthIndex ?? -1,
        netDeposits: 0,
        pl: 0,
        payments: 0,
      }
      acc.payments += p.amount || 0
      map.set(key, acc)
    })
    return Array.from(map.values())
      .sort(
        (a, b) => (a.monthIndex || 0) - (b.monthIndex || 0) || a.monthKey.localeCompare(b.monthKey)
      )
      .map((m) => ({ ...m, profit: (m.pl || 0) - (m.payments || 0) }))
  }, [filteredMedia, filteredPayments, selectedAffiliate])

  const cohortMonthlyRows = useMemo(() => {
    if (!selectedAffiliate) return []
    const cohortRowsForAffiliate = filterTop10CohortRowsForAffiliate(
      top10CohortRows,
      selectedAffiliate
    )
    if (!cohortRowsForAffiliate.length) return []

    const monthsCount = Math.max(...cohortRowsForAffiliate.map((r) => (r.months || []).length), 12)
    const byMonth = Array.from({ length: monthsCount }, (_, idx) => ({
      monthIndex: idx,
      monthLabel: t('affiliateAnalysis.cohort.monthLabel', { index: idx + 1 }),
      pl: 0,
      commissions: 0,
    }))

    cohortRowsForAffiliate.forEach((row) => {
      ;(row.months || []).forEach((m) => {
        const idx = typeof m.index === 'number' ? m.index : (m.monthIndex ?? m.month ?? 0)
        if (idx >= 0 && idx < byMonth.length) {
          byMonth[idx].pl += Number(m.value ?? m.pl ?? 0) || 0
          if (m.label) byMonth[idx].monthLabel = m.label
        }
      })
    })

    // Overlay commissions from the payments file for this affiliate, month-aligned
    filteredPayments.forEach((p) => {
      const idx = typeof p.monthIndex === 'number' ? p.monthIndex : -1
      if (idx >= 0 && idx < byMonth.length) {
        byMonth[idx].commissions += Math.abs(Number(p.amount) || 0)
        if (p.monthLabel) byMonth[idx].monthLabel = p.monthLabel
      }
    })

    return byMonth
  }, [filteredPayments, selectedAffiliate, top10CohortRows, t])

  const analysisReport = useMemo(() => {
    if (!selectedAffiliate) return null
    const windowEnd = new Date()
    const windowStart = new Date(windowEnd)
    windowStart.setDate(windowEnd.getDate() - 6)

    // Use cohort PL + commissions rows aligned with cohort page.
    const cohortBreakEven = computeCohortBreakEvenForAffiliate(cohortMonthlyRows)

    return buildWeeklyAffiliateReport({
      affiliateId: selectedAffiliate,
      affiliateName: selectedAffiliate,
      fromDate: windowStart,
      toDate: windowEnd,
      mediaRows: filteredMedia,
      paymentsRows: filteredPayments,
      cohortBreakEven,
      selectedYear,
      allYearsRange: yearOptions,
    })
  }, [
    filteredMedia,
    filteredPayments,
    cohortMonthlyRows,
    selectedAffiliate,
    selectedYear,
    yearOptions,
  ])

  const withdrawalsTotal = useMemo(() => {
    if (!selectedAffiliate) return 0
    return filteredMedia.reduce((acc, r) => acc + (Number(r.withdrawals) || 0), 0)
  }, [filteredMedia, selectedAffiliate])

  const keyMetrics = useMemo(() => {
    if (!analysisReport?.kpis) return []
    const k = analysisReport.kpis
    const metrics = []
    const add = (label, value, helper, tone) => metrics.push({ label, value, helper, tone })

    add(
      t('affiliateAnalysis.metrics.cpa'),
      formatEuro(Math.round(k.cpa || 0)),
      t('affiliateAnalysis.metrics.helper.paymentsDivFtd')
    )
    add(
      t('affiliateAnalysis.metrics.arpu'),
      formatEuro(Math.round(k.arpu || 0)),
      t('affiliateAnalysis.metrics.helper.plDivRegistrations')
    )

    const ltvUsers = totals?.users || k.registrations || 0
    if (ltvUsers)
      add(
        t('affiliateAnalysis.metrics.ltvPerUser'),
        formatEuro(Math.round((k.totalPL || 0) / Math.max(ltvUsers, 1))),
        t('affiliateAnalysis.metrics.helper.plDivUsers')
      )

    if (k.totalPL)
      add(
        t('affiliateAnalysis.metrics.profitMargin'),
        formatPercent(((k.totalProfit || 0) / Math.max(k.totalPL, 1)) * 100, 1),
        t('affiliateAnalysis.metrics.helper.profitVsPl')
      )

    add(
      t('affiliateAnalysis.metrics.churnPct'),
      formatPercent(k.churnPct || 0, 1),
      t('affiliateAnalysis.metrics.helper.weightedChurnPct')
    )

    const visitors = totals?.visitors || totals?.users
    if (visitors)
      add(
        t('affiliateAnalysis.metrics.conversionRate'),
        formatPercent(((k.registrations || 0) / Math.max(visitors, 1)) * 100, 1),
        t('affiliateAnalysis.metrics.helper.registrationsDivVisitors')
      )

    if (k.registrations)
      add(
        t('affiliateAnalysis.metrics.ftdRatio'),
        formatPercent(((k.ftd || 0) / Math.max(k.registrations, 1)) * 100, 1),
        t('affiliateAnalysis.metrics.helper.ftdDivRegistrations')
      )
    if (k.ftd)
      add(
        t('affiliateAnalysis.metrics.qftdRatio'),
        formatPercent(((k.qftd || 0) / Math.max(k.ftd, 1)) * 100, 1),
        t('affiliateAnalysis.metrics.helper.qftdDivFtd')
      )

    if (withdrawalsTotal)
      add(
        t('affiliateAnalysis.metrics.withdrawals'),
        formatEuro(withdrawalsTotal),
        t('affiliateAnalysis.metrics.helper.totalWithdrawals')
      )

    if (k.bestMonth)
      add(
        t('affiliateAnalysis.metrics.bestMonth'),
        k.bestMonth.monthLabel || k.bestMonth.monthKey || '—',
        t('affiliateAnalysis.metrics.helper.byProfit')
      )
    if (k.worstMonth)
      add(
        t('affiliateAnalysis.metrics.worstMonth'),
        k.worstMonth.monthLabel || k.worstMonth.monthKey || '—',
        t('affiliateAnalysis.metrics.helper.byProfit')
      )

    return metrics
  }, [analysisReport, totals, withdrawalsTotal, t])

  const heroBadge = badgeTone(t, totals?.profit || 0)
  const emptyState = !selectedAffiliate

  const renderTopAffiliates = (
    <CardSection
      title={t('affiliateAnalysis.topAffiliates.title')}
      subtitle={t('affiliateAnalysis.topAffiliates.subtitle')}
      actions={
        <span
          style={{
            padding: '5px 9px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.10)',
            background:
              topAffiliatesSource === 'full' ? 'rgba(34,197,94,0.10)' : 'rgba(34,211,238,0.08)',
            color: topAffiliatesSource === 'full' ? '#86efac' : '#67e8f9',
            fontSize: 11,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          {fastAffiliateLoading
            ? 'Loading live summary'
            : topAffiliatesSource === 'full'
              ? 'Full data'
              : fastAffiliateMeta?.source === 'cellxpert-admin-api'
                ? 'Live summary'
                : 'Cached summary'}
        </span>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10,
        }}
      >
        {visibleTopAffiliates.map((a) => {
          const isActive = matchesAffiliate(selectedAffiliate, a)
          return (
            <button
              key={a.affiliateId || a.affiliate}
              onClick={() => setSelectedAffiliate(a.affiliate || a.affiliateId)}
              className="card card-global"
              style={{
                padding: 12,
                textAlign: 'left',
                border: isActive ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.08)',
                background: isActive
                  ? 'rgba(34,211,238,0.06)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
                cursor: 'pointer',
                transition: 'transform 120ms ease, border-color 120ms ease',
                minHeight: 94,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.affiliate || '—'}</div>
              {a.affiliateId && normalizeKey(a.affiliateId) !== normalizeKey(a.affiliate) && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                  ID {a.affiliateId}
                </div>
              )}
              <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                {t('affiliateAnalysis.topAffiliates.profit', { value: formatEuro(a.profit || 0) })}
              </div>
              <div
                style={{ fontSize: 11, color: a.hasCohort ? '#22d3ee' : '#9ca3af', marginTop: 4 }}
              >
                {a.hasCohort
                  ? t('affiliateAnalysis.topAffiliates.cohortYes')
                  : t('affiliateAnalysis.topAffiliates.cohortNo')}
              </div>
            </button>
          )
        })}
      </div>
      {!fastAffiliateLoading && visibleTopAffiliates.length === 0 && (
        <div style={{ color: '#9ca3af', fontSize: 13, padding: 12 }}>
          {t('affiliateAnalysis.empty.selectAffiliate')}
        </div>
      )}
    </CardSection>
  )

  const detailLoading = Boolean(selectedAffiliate && fullDataLoading)

  const renderDetailLoading = detailLoading && (
    <div
      className="card card-global"
      style={{
        padding: 18,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.025)',
        color: '#cbd5e1',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      Loading full affiliate data...
    </div>
  )

  const renderAnalysis = !emptyState && !detailLoading && totals && analysisReport && (
    <>
      <button
        onClick={() => setSelectedAffiliate('')}
        className="card card-global"
        style={{
          padding: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
        }}
      >
        {t('affiliateAnalysis.button.backToTopAffiliates')}
      </button>

      <CardSection
        title={t('affiliateAnalysis.header.title', { affiliate: selectedAffiliate })}
        subtitle={t('affiliateAnalysis.header.subtitle', {
          period: analysisReport?.periodMeta?.displayLabel || analysisReport?.periodLabel || '—',
        })}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <YearSelector
              availableYears={yearOptions}
              value={selectedYear}
              onChange={(val) => setSelectedYear(val)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ color: '#9ca3af', fontSize: 12 }}>
                {t('affiliateAnalysis.filters.affiliate')}
              </label>
              <select
                value={selectedAffiliate}
                onChange={(e) => setSelectedAffiliate(e.target.value)}
                style={{
                  background: '#111827',
                  color: 'var(--text)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  minWidth: 200,
                }}
              >
                <option value="">{t('affiliateAnalysis.filters.selectAffiliate')}</option>
                {affiliateOptions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            {selectedAffiliate && (
              <span
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: heroBadge.color,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {t('affiliateAnalysis.badgeWithProfit', {
                  label: heroBadge.label,
                  value: formatEuro(totals?.profit || 0),
                })}
              </span>
            )}
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        <KpiCard
          label={t('affiliateAnalysis.kpi.netDeposits')}
          value={formatEuro(totals.netDeposits)}
          helper={formatEuroFull(totals.netDeposits)}
          tone="#22d3ee"
        />
        <KpiCard
          label={t('affiliateAnalysis.kpi.pl')}
          value={formatEuro(totals.pl)}
          helper={t('affiliateAnalysis.kpiHelper.totalPnL')}
          tone="#10b981"
        />
        <KpiCard
          label={t('affiliateAnalysis.kpi.profit')}
          value={formatEuro(totals.profit)}
          helper={t('affiliateAnalysis.kpiHelper.plMinusPayments')}
          tone={totals.profit >= 0 ? '#34d399' : '#ef4444'}
        />
        <KpiCard
          label={t('affiliateAnalysis.kpi.roi')}
          value={`${(totals.roi || 0).toFixed(1)}%`}
          helper={t('affiliateAnalysis.kpiHelper.profitDivPayments')}
          tone={totals.roi >= 0 ? '#34d399' : '#ef4444'}
        />
        <KpiCard
          label={t('affiliateAnalysis.kpi.payments')}
          value={formatEuro(totals.paymentsTotal)}
          helper={t('affiliateAnalysis.kpiHelper.commissionPayouts')}
          tone="#f59e0b"
        />
        <KpiCard
          label={t('affiliateAnalysis.kpi.ftdPerReg')}
          value={`${formatNumberShort(totals.ftd)} / ${formatNumberShort(totals.registrations)}`}
          helper={t('affiliateAnalysis.kpiHelper.firstDepositsVsRegistrations')}
          tone="#fbbf24"
        />
      </div>

      <AnalysisEngine
        affiliateName={selectedAffiliate}
        periodLabel={analysisReport?.periodLabel || t('affiliateAnalysis.period.thisPeriod')}
        kpis={analysisReport?.kpis}
      />

      <CardSection
        title={t('affiliateAnalysis.sections.financialMetrics.title')}
        subtitle={t('affiliateAnalysis.sections.financialMetrics.subtitle')}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          <KpiCard
            label={t('affiliateAnalysis.financial.paybackVsDeposits')}
            value={formatPercent((totals.profit / Math.max(totals.netDeposits || 1, 1)) * 100)}
            helper={t('affiliateAnalysis.financial.helper.profitDivNetDeposits')}
          />
          <KpiCard
            label={t('affiliateAnalysis.financial.payoutRatio')}
            value={formatPercent(
              (totals.paymentsTotal / Math.max(totals.netDeposits || 1, 1)) * 100
            )}
            helper={t('affiliateAnalysis.financial.helper.paymentsDivNetDeposits')}
            tone="#f59e0b"
          />
          <KpiCard
            label={t('affiliateAnalysis.financial.plPerFtd')}
            value={formatEuro(Math.round(totals.ftd ? totals.pl / totals.ftd : 0))}
            helper={t('affiliateAnalysis.financial.helper.plDivFtd')}
          />
          <KpiCard
            label={t('affiliateAnalysis.financial.profitPerUser')}
            value={formatEuro(Math.round(totals.users ? totals.profit / totals.users : 0))}
            helper={t('affiliateAnalysis.financial.helper.profitDivUsers')}
          />
        </div>
      </CardSection>

      {analysisReport?.kpis && (
        <CardSection
          title={t('affiliateAnalysis.sections.allKeyMetrics.title')}
          subtitle={t('affiliateAnalysis.sections.allKeyMetrics.subtitle')}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 10,
            }}
          >
            {keyMetrics.map((m) => (
              <KpiCard
                key={m.label}
                label={m.label}
                value={m.value}
                helper={m.helper}
                tone={m.tone}
              />
            ))}
          </div>
        </CardSection>
      )}

      <CardSection
        title={t('affiliateAnalysis.sections.monthlyTrends.title')}
        subtitle={t('affiliateAnalysis.sections.monthlyTrends.subtitle')}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          <div className="card card-global" style={{ height: 260 }}>
            <PnLTrendChart
              dataPoints={monthly.map((m) => m.netDeposits)}
              labels={monthly.map((m) => m.monthLabel)}
              datasetLabel={t('affiliateAnalysis.chart.netDeposits')}
              formatValue={(v) => formatEuro(v)}
            />
          </div>
          <div className="card card-global" style={{ height: 260 }}>
            <PnLTrendChart
              dataPoints={monthly.map((m) => m.pl)}
              labels={monthly.map((m) => m.monthLabel)}
              datasetLabel={t('affiliateAnalysis.chart.pl')}
              formatValue={(v) => formatEuro(v)}
            />
          </div>
          <div className="card card-global" style={{ height: 260 }}>
            <PnLTrendChart
              dataPoints={monthly.map((m) => m.profit)}
              labels={monthly.map((m) => m.monthLabel)}
              datasetLabel={t('affiliateAnalysis.chart.profit')}
              formatValue={(v) => formatEuro(v)}
            />
          </div>
        </div>
      </CardSection>
    </>
  )

  return (
    <div className="w-full space-y-6">
      {!selectedAffiliate && (
        <div
          className="card card-global"
          style={{
            padding: 14,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 220 }}>
            <div style={{ fontWeight: 800, color: 'var(--text)' }}>
              {t('affiliateAnalysis.share.button') || 'Share report'}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
              {t('affiliateAnalysis.share.hint') || 'Creates a public, read-only board report link'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={createShareLink}
              disabled={shareBusy}
              className="card card-global"
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: shareBusy ? 'rgba(255,255,255,0.04)' : 'rgba(34,211,238,0.10)',
                color: 'var(--text)',
                fontWeight: 900,
                cursor: shareBusy ? 'not-allowed' : 'pointer',
                minWidth: 170,
                textAlign: 'center',
              }}
            >
              {shareBusy
                ? t('affiliateAnalysis.share.creating') || 'Creating…'
                : shareCopied
                  ? t('affiliateAnalysis.share.copied') || 'Copied'
                  : t('affiliateAnalysis.share.button') || 'Share report'}
            </button>
            {!!shareError && (
              <span style={{ color: '#fb7185', fontSize: 12, fontWeight: 700 }}>{shareError}</span>
            )}
          </div>
        </div>
      )}

      {!selectedAffiliate && renderTopAffiliates}

      {!selectedAffiliate && (
        <div
          className="card card-global"
          style={{ textAlign: 'center', color: '#9ca3af', padding: 16 }}
        >
          {t('affiliateAnalysis.empty.selectAffiliate')}
        </div>
      )}

      {selectedAffiliate && renderDetailLoading}
      {selectedAffiliate && renderAnalysis}
    </div>
  )
}
