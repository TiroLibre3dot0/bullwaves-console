import React, { useEffect, useMemo, useState } from 'react'
import CardSection from '../../components/common/CardSection'
import KpiCard from '../../components/common/KpiCard'
import PnLTrendChart from '../../components/PnLTrendChart'
import { formatEuro, formatEuroFull, formatNumberShort, formatPercent, normalizeKey } from '../../lib/formatters'
import YearSelector from '../../components/common/YearSelector'
import { useMediaPaymentsData } from '../media-payments/hooks/useMediaPaymentsData'
import AnalysisEngine from './components/AnalysisEngine'
import { buildWeeklyAffiliateReport } from './utils/buildWeeklyAffiliateReport'
import { computeCohortBreakEvenForAffiliate } from './utils/computeCohortBreakEvenForAffiliate'
import { filterTop10CohortRowsForAffiliate, loadTop10CohortData } from './utils/getTop10CohortDataForAffiliate'

const badgeTone = (profit) => {
  if (profit >= 0) return { label: 'Healthy', color: '#22c55e' }
  if (profit > -1000) return { label: 'Watch', color: '#f59e0b' }
  return { label: 'At risk', color: '#ef4444' }
}

export default function AffiliateAnalysis() {
  const { mediaRows, payments, affiliateOptions } = useMediaPaymentsData()
  const [selectedAffiliate, setSelectedAffiliate] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const [top10CohortRows, setTop10CohortRows] = useState([])

  const yearOptions = useMemo(() => {
    const set = new Set()
    mediaRows.forEach((r) => { if (Number.isFinite(r.year)) set.add(r.year) })
    payments.forEach((p) => { if (Number.isFinite(p.year)) set.add(p.year) })
    return Array.from(set).sort((a, b) => a - b)
  }, [mediaRows, payments])

  const matchesYear = (row) => {
    if (selectedYear === 'all') return true
    return Number(row?.year) === Number(selectedYear)
  }

  const filteredMedia = useMemo(() => {
    if (!selectedAffiliate) return []
    const sel = normalizeKey(selectedAffiliate)
    return mediaRows.filter((r) => matchesYear(r) && normalizeKey(r.affiliate) === sel)
  }, [mediaRows, selectedAffiliate, selectedYear])

  const filteredPayments = useMemo(() => {
    if (!selectedAffiliate) return []
    const sel = normalizeKey(selectedAffiliate)
    return payments.filter((p) => matchesYear(p) && normalizeKey(p.affiliate) === sel)
  }, [payments, selectedAffiliate, selectedYear])

  useEffect(() => {
    loadTop10CohortData().then(setTop10CohortRows).catch(() => setTop10CohortRows([]))
  }, [])

  const topAffiliates = useMemo(() => {
    const profitByAffiliate = new Map()
    mediaRows.forEach((r) => {
      const entry = profitByAffiliate.get(r.affiliate) || { affiliate: r.affiliate, pl: 0, netDeposits: 0, payments: 0 }
      entry.pl += Number(r.pl) || 0
      entry.netDeposits += Number(r.netDeposits) || 0
      profitByAffiliate.set(r.affiliate, entry)
    })
    payments.forEach((p) => {
      const entry = profitByAffiliate.get(p.affiliate) || { affiliate: p.affiliate, pl: 0, netDeposits: 0, payments: 0 }
      entry.payments += Number(p.amount) || 0
      profitByAffiliate.set(p.affiliate, entry)
    })

    const list = Array.from(profitByAffiliate.values()).map((entry) => ({
      ...entry,
      profit: (entry.pl || 0) - (entry.payments || 0),
      hasCohort: filterTop10CohortRowsForAffiliate(top10CohortRows, entry.affiliate).length > 0,
    }))

    return list
      .sort((a, b) => (b.profit || 0) - (a.profit || 0))
      .slice(0, 10)
  }, [mediaRows, payments, top10CohortRows])

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
    const users = sum(filteredMedia, 'uniqueVisitors') || sum(filteredMedia, 'visitors') || registrations
    const profit = pl - paymentsTotal
    const roi = paymentsTotal ? (profit / Math.max(Math.abs(paymentsTotal), 1)) * 100 : 0
    const cpa = ftd ? Math.abs(paymentsTotal) / Math.max(ftd, 1) : 0
    const arpu = registrations ? pl / Math.max(registrations, 1) : 0
    const ltv = users ? pl / Math.max(users, 1) : 0
    const profitMargin = pl ? (profit / pl) * 100 : 0
    return { registrations, visitors, ftd, qftd, netDeposits, pl, paymentsTotal, profit, roi, cpa, arpu, ltv, profitMargin, users }
  }, [filteredMedia, filteredPayments, selectedAffiliate])

  const monthly = useMemo(() => {
    if (!selectedAffiliate) return []
    const map = new Map()
    filteredMedia.forEach((r) => {
      const key = r.monthKey || 'unknown'
      const acc = map.get(key) || { monthKey: key, monthLabel: r.monthLabel || key, monthIndex: r.monthIndex ?? -1, netDeposits: 0, pl: 0, payments: 0 }
      acc.netDeposits += r.netDeposits || 0
      acc.pl += r.pl || 0
      map.set(key, acc)
    })
    filteredPayments.forEach((p) => {
      const key = p.monthKey || 'unknown'
      const acc = map.get(key) || { monthKey: key, monthLabel: p.monthLabel || key, monthIndex: p.monthIndex ?? -1, netDeposits: 0, pl: 0, payments: 0 }
      acc.payments += p.amount || 0
      map.set(key, acc)
    })
    return Array.from(map.values())
      .sort((a, b) => (a.monthIndex || 0) - (b.monthIndex || 0) || a.monthKey.localeCompare(b.monthKey))
      .map((m) => ({ ...m, profit: (m.pl || 0) - (m.payments || 0) }))
  }, [filteredMedia, filteredPayments, selectedAffiliate])

  const cohortMonthlyRows = useMemo(() => {
    if (!selectedAffiliate) return []
    const cohortRowsForAffiliate = filterTop10CohortRowsForAffiliate(top10CohortRows, selectedAffiliate)
    if (!cohortRowsForAffiliate.length) return []

    const monthsCount = Math.max(...cohortRowsForAffiliate.map((r) => (r.months || []).length), 12)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const byMonth = Array.from({ length: monthsCount }, (_, idx) => ({
      monthIndex: idx,
      monthLabel: monthNames[idx] || `Month ${idx + 1}`,
      pl: 0,
      commissions: 0,
    }))

    cohortRowsForAffiliate.forEach((row) => {
      ;(row.months || []).forEach((m) => {
        const idx = typeof m.index === 'number' ? m.index : m.monthIndex ?? m.month ?? 0
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
  }, [filteredPayments, selectedAffiliate, top10CohortRows])

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
  }, [filteredMedia, filteredPayments, cohortMonthlyRows, selectedAffiliate, selectedYear, yearOptions])

  const withdrawalsTotal = useMemo(() => {
    if (!selectedAffiliate) return 0
    return filteredMedia.reduce((acc, r) => acc + (Number(r.withdrawals) || 0), 0)
  }, [filteredMedia, selectedAffiliate])

  const keyMetrics = useMemo(() => {
    if (!analysisReport?.kpis) return []
    const k = analysisReport.kpis
    const metrics = []
    const add = (label, value, helper, tone) => metrics.push({ label, value, helper, tone })

    add('CPA', formatEuro(Math.round(k.cpa || 0)), 'Payments / FTD')
    add('ARPU', formatEuro(Math.round(k.arpu || 0)), 'PL / registrations')

    const ltvUsers = totals?.users || k.registrations || 0
    if (ltvUsers) add('LTV / user', formatEuro(Math.round((k.totalPL || 0) / Math.max(ltvUsers, 1))), 'PL / users')

    if (k.totalPL) add('Profit margin', formatPercent((k.totalProfit || 0) / Math.max(k.totalPL, 1) * 100, 1), 'Profit vs PL')

    add('Churn %', formatPercent(k.churnPct || 0, 1), 'Weighted churn %')

    const visitors = totals?.visitors || totals?.users
    if (visitors) add('Conversion rate', formatPercent((k.registrations || 0) / Math.max(visitors, 1) * 100, 1), 'Registrations / visitors')

    if (k.registrations) add('FTD ratio', formatPercent((k.ftd || 0) / Math.max(k.registrations, 1) * 100, 1), 'FTD / registrations')
    if (k.ftd) add('QFTD ratio', formatPercent((k.qftd || 0) / Math.max(k.ftd, 1) * 100, 1), 'QFTD / FTD')

    if (withdrawalsTotal) add('Withdrawals', formatEuro(withdrawalsTotal), 'Total withdrawals')

    if (k.bestMonth) add('Best Month', k.bestMonth.monthLabel || k.bestMonth.monthKey || '—', 'By profit')
    if (k.worstMonth) add('Worst Month', k.worstMonth.monthLabel || k.worstMonth.monthKey || '—', 'By profit')

    return metrics
  }, [analysisReport, totals, withdrawalsTotal])

  const heroBadge = badgeTone(totals?.profit || 0)
  const emptyState = !selectedAffiliate

  const renderTopAffiliates = (
    <CardSection title="Top 10 Affiliates (by Profit)" subtitle="Select an affiliate to view its analysis">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {topAffiliates.map((a) => {
          const isActive = selectedAffiliate === a.affiliate
          return (
            <button
              key={a.affiliate}
              onClick={() => setSelectedAffiliate(a.affiliate)}
              className="card card-global"
              style={{
                padding: 10,
                textAlign: 'left',
                border: isActive ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.08)',
                background: isActive ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'transform 120ms ease, border-color 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.affiliate || '—'}</div>
              <div style={{ fontSize: 12, color: '#cbd5e1' }}>Profit {formatEuro(a.profit || 0)}</div>
              <div style={{ fontSize: 11, color: a.hasCohort ? '#22d3ee' : '#94a3b8', marginTop: 4 }}>
                {a.hasCohort ? 'Cohort ✓' : 'No Cohort'}
              </div>
            </button>
          )
        })}
      </div>
    </CardSection>
  )

  const renderAnalysis = (!emptyState && totals && analysisReport) && (
    <>
      <button
        onClick={() => setSelectedAffiliate('')}
        className="card card-global"
        style={{ padding: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
      >
        ← Back to Top Affiliates
      </button>

      <CardSection
        title={`Affiliate Analysis ${selectedAffiliate ? `– ${selectedAffiliate}` : ''}`}
        subtitle={`Performance overview · Period: ${analysisReport?.periodMeta?.displayLabel || analysisReport?.periodLabel || '—'}`}
        actions={(
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <YearSelector availableYears={yearOptions} value={selectedYear} onChange={(val) => setSelectedYear(val)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ color: '#94a3b8', fontSize: 12 }}>Affiliate</label>
              <select
                value={selectedAffiliate}
                onChange={(e) => setSelectedAffiliate(e.target.value)}
                style={{ background: '#0f172a', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', minWidth: 200 }}
              >
                <option value="">Select affiliate…</option>
                {affiliateOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            {selectedAffiliate && (
              <span style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: heroBadge.color, fontWeight: 700, fontSize: 12 }}>
                {heroBadge.label} · Profit {formatEuro(totals?.profit || 0)}
              </span>
            )}
          </div>
        )}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <KpiCard label="Net Deposits" value={formatEuro(totals.netDeposits)} helper={formatEuroFull(totals.netDeposits)} tone="#22d3ee" />
        <KpiCard label="PL" value={formatEuro(totals.pl)} helper="Total P&L" tone="#10b981" />
        <KpiCard label="Profit" value={formatEuro(totals.profit)} helper="PL − payments" tone={totals.profit >= 0 ? '#34d399' : '#ef4444'} />
        <KpiCard label="ROI" value={`${(totals.roi || 0).toFixed(1)}%`} helper="Profit / payments" tone={totals.roi >= 0 ? '#34d399' : '#ef4444'} />
        <KpiCard label="Payments" value={formatEuro(totals.paymentsTotal)} helper="Commission / payouts" tone="#f59e0b" />
        <KpiCard label="FTD / Reg" value={`${formatNumberShort(totals.ftd)} / ${formatNumberShort(totals.registrations)}`} helper="First deposits vs registrations" tone="#fbbf24" />
      </div>

      <AnalysisEngine
        affiliateName={selectedAffiliate}
        periodLabel={analysisReport?.periodLabel || 'This period'}
        kpis={analysisReport?.kpis}
      />

      <CardSection title="Financial metrics" subtitle="Efficiency snapshots">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <KpiCard label="Payback vs deposits" value={formatPercent((totals.profit / Math.max(totals.netDeposits || 1, 1)) * 100)} helper="Profit / net deposits" />
          <KpiCard label="Payout ratio" value={formatPercent((totals.paymentsTotal / Math.max(totals.netDeposits || 1, 1)) * 100)} helper="Payments / net deposits" tone="#f59e0b" />
          <KpiCard label="PL per FTD" value={formatEuro(Math.round(totals.ftd ? totals.pl / totals.ftd : 0))} helper="PL / FTD" />
          <KpiCard label="Profit per user" value={formatEuro(Math.round(totals.users ? totals.profit / totals.users : 0))} helper="Profit / users" />
        </div>
      </CardSection>

      {analysisReport?.kpis && (
        <CardSection title="All Key Metrics for this Affiliate" subtitle="Full KPI snapshot for this affiliate">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {keyMetrics.map((m) => (
              <KpiCard key={m.label} label={m.label} value={m.value} helper={m.helper} tone={m.tone} />
            ))}
          </div>
        </CardSection>
      )}

      <CardSection title="Monthly trends" subtitle="Net Deposits, PL, Profit">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <div className="card card-global" style={{ height: 260 }}>
            <PnLTrendChart
              dataPoints={monthly.map((m) => m.netDeposits)}
              labels={monthly.map((m) => m.monthLabel)}
              datasetLabel="Net Deposits"
              formatValue={(v) => formatEuro(v)}
            />
          </div>
          <div className="card card-global" style={{ height: 260 }}>
            <PnLTrendChart
              dataPoints={monthly.map((m) => m.pl)}
              labels={monthly.map((m) => m.monthLabel)}
              datasetLabel="PL"
              formatValue={(v) => formatEuro(v)}
            />
          </div>
          <div className="card card-global" style={{ height: 260 }}>
            <PnLTrendChart
              dataPoints={monthly.map((m) => m.profit)}
              labels={monthly.map((m) => m.monthLabel)}
              datasetLabel="Profit"
              formatValue={(v) => formatEuro(v)}
            />
          </div>
        </div>
      </CardSection>
    </>
  )

  return (
    <div className="w-full space-y-6">
      {!selectedAffiliate && renderTopAffiliates}

      {!selectedAffiliate && (
        <div className="card card-global" style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>
          Select an affiliate to view its analysis
        </div>
      )}

      {selectedAffiliate && renderAnalysis}
    </div>
  )
}
