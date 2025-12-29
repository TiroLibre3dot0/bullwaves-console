import React, { useMemo, useState } from 'react'
import CardSection from '../../../components/common/CardSection'
import FilterBar from '../../../components/common/FilterBar'
import PnLTrendChart from '../../../components/PnLTrendChart'
import ExecutiveAnalysisEngine from '../../executive-summary/components/ExecutiveAnalysisEngine'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useMediaPaymentsData } from '../hooks/useMediaPaymentsData'
import { formatEuro, formatEuroFull, formatNumber, formatNumberShort, formatPercent, normalizeKey } from '../../../lib/formatters'
import { checkDataStatus } from '../../../utils/dataStatusChecker'
import { useDataStatus } from '../../../context/DataStatusContext'

const formatNumberFull = (value) => formatNumber(value)
const formatPercentDisplay = (value) => formatPercent(value, 2)
const selectStyle = { minWidth: 160, background: '#0d1a2c', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }

export default function GlobalDashboard() {
  const { mediaRows, payments, loading, monthOptions = [], affiliateOptions = [] } = useMediaPaymentsData()

  const yearOptions = useMemo(() => {
    const set = new Set()
    mediaRows.forEach((r) => { if (r.year !== undefined && r.year !== null) set.add(r.year) })
    payments.forEach((p) => { if (p.year !== undefined && p.year !== null) set.add(p.year) })
    return Array.from(set).filter((y) => !Number.isNaN(Number(y))).sort((a, b) => a - b)
  }, [mediaRows, payments])

  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedAffiliate, setSelectedAffiliate] = useState('all')
  const { setDataStatus } = useDataStatus()

  const selectedAffiliateKey = normalizeKey(selectedAffiliate)

  const filteredMedia = useMemo(() => mediaRows.filter((r) => {
    const matchYear = selectedYear === 'all' ? true : r.year === Number(selectedYear)
    const matchMonth = selectedMonth === 'all' ? true : r.monthKey === selectedMonth
    const matchAff = selectedAffiliate === 'all' ? true : normalizeKey(r.affiliate) === selectedAffiliateKey
    return matchYear && matchMonth && matchAff
  }), [mediaRows, selectedAffiliate, selectedAffiliateKey, selectedMonth, selectedYear])

  const filteredPayments = useMemo(() => payments.filter((p) => {
    const matchYear = selectedYear === 'all' ? true : p.year === Number(selectedYear)
    const matchMonth = selectedMonth === 'all' ? true : p.monthKey === selectedMonth
    const matchAff = selectedAffiliate === 'all' ? true : normalizeKey(p.affiliate) === selectedAffiliateKey
    return matchYear && matchMonth && matchAff
  }), [payments, selectedAffiliate, selectedAffiliateKey, selectedMonth, selectedYear])

  const totals = useMemo(() => {
    const sum = (field) => filteredMedia.reduce((acc, r) => acc + (Number(r[field]) || 0), 0)
    const visitors = sum('visitors')
    const registrations = sum('registrations')
    const ftd = sum('ftd')
    const qftd = sum('qftd')
    const deposits = sum('deposits')
    const withdrawals = sum('withdrawals')
    const paymentsTotal = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0)
    const roiValues = filteredMedia.map((r) => r.roi).filter((v) => !Number.isNaN(v))
    const roiAvg = roiValues.length ? roiValues.reduce((a, b) => a + b, 0) / roiValues.length : 0
    const conversion = visitors > 0 ? (registrations / visitors) * 100 : 0
    const pl = sum('pl')
    const profit = pl - paymentsTotal

    return {
      impressions: sum('impressions'),
      uniqueImpressions: sum('uniqueImpressions'),
      ctrAvg: filteredMedia.length ? (filteredMedia.reduce((acc, r) => acc + (r.ctr || 0), 0) / filteredMedia.length) : 0,
      visitors,
      uniqueVisitors: sum('uniqueVisitors'),
      leads: sum('leads'),
      registrations,
      ftd,
      qftd,
      deposits,
      withdrawals,
      netDeposits: sum('netDeposits'),
      pl,
      paymentsTotal,
      profit,
      conversion,
      roiAvg,
    }
  }, [filteredMedia, filteredPayments])

  const perMonth = useMemo(() => {
    const map = new Map()
    const ensureMonth = (key, label, monthIndex) => {
      if (!map.has(key)) {
        map.set(key, {
          monthKey: key,
          monthLabel: label,
          monthIndex,
          visitors: 0,
          registrations: 0,
          ftd: 0,
          netDeposits: 0,
          pl: 0,
          payments: 0,
          roiSum: 0,
          roiCount: 0,
        })
      }
      return map.get(key)
    }

    filteredMedia.forEach((r) => {
      const acc = ensureMonth(r.monthKey, r.monthLabel, r.monthIndex)
      acc.visitors += r.visitors || 0
      acc.registrations += r.registrations || 0
      acc.ftd += r.ftd || 0
      acc.netDeposits += r.netDeposits || 0
      acc.pl += r.pl || 0
      if (!Number.isNaN(r.roi)) {
        acc.roiSum += r.roi
        acc.roiCount += 1
      }
    })

    filteredPayments.forEach((p) => {
      const acc = ensureMonth(p.monthKey, p.monthLabel, p.monthIndex)
      acc.payments += p.amount || 0
    })

    return Array.from(map.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((r) => ({
        ...r,
        conversion: r.visitors > 0 ? (r.registrations / r.visitors) * 100 : 0,
        roi: r.roiCount ? r.roiSum / r.roiCount : 0,
        profit: (r.pl || 0) - (r.payments || 0),
      }))
  }, [filteredMedia, filteredPayments])

  const affiliateLeaderboard = useLeaderboard(filteredMedia, filteredPayments)

  React.useEffect(() => {
    if (mediaRows.length > 0) {
      const status = checkDataStatus(mediaRows, 'monthLabel', 'Media Report')
      setDataStatus(status)
    }
  }, [mediaRows])

  const breakEven = useMemo(() => {
    const months = [...perMonth]
      .filter((m) => m.monthIndex >= 0)
      .sort((a, b) => (a.year - b.year) || (a.monthIndex - b.monthIndex))

    const labels = months.map((m) => m.monthLabel)
    const cumulativeProfit = []
    const cumulativePl = []
    const cumulativePayments = []
    let plSum = 0
    let paySum = 0

    months.forEach((m) => {
      plSum += m.pl || 0
      paySum += m.payments || 0
      cumulativePl.push(plSum)
      cumulativePayments.push(paySum)
      cumulativeProfit.push(plSum - paySum)
    })

    const firstActive = cumulativeProfit.findIndex((v, idx) => idx === 0 || months[idx].pl || months[idx].payments)
    const beIndex = cumulativeProfit.findIndex((v, idx) => idx >= (firstActive >= 0 ? firstActive : 0) && v >= 0)
    const beLabel = beIndex >= 0 ? labels[beIndex] : null
    return { labels, curve: cumulativeProfit, cumulativePl, cumulativePayments, breakEvenIndex: beIndex, breakEvenLabel: beLabel }
  }, [perMonth])

  const perMonthTotals = useMemo(() => {
    const base = {
      visitors: 0,
      registrations: 0,
      ftd: 0,
      netDeposits: 0,
      pl: 0,
      payments: 0,
      roiSum: 0,
      roiCount: 0,
    }
    perMonth.forEach((m) => {
      base.visitors += m.visitors || 0
      base.registrations += m.registrations || 0
      base.ftd += m.ftd || 0
      base.netDeposits += m.netDeposits || 0
      base.pl += m.pl || 0
      base.payments += m.payments || 0
      base.roiSum += (m.roi || 0) * (m.roiCount || 1)
      base.roiCount += m.roiCount || 0
    })
    const conversion = base.visitors > 0 ? (base.registrations / base.visitors) * 100 : 0
    const roi = base.roiCount ? base.roiSum / base.roiCount : 0
    const profit = (base.pl || 0) - (base.payments || 0)
    return { ...base, conversion, roi, profit }
  }, [perMonth])

  const acquisitionSteps = useMemo(() => {
    const steps = [
      { key: 'uniqueVisitors', label: 'Unique visitors', value: totals.uniqueVisitors || totals.visitors, note: 'Top of funnel' },
      { key: 'registrations', label: 'Registrations / Leads', value: totals.registrations || totals.leads, note: `${formatPercentDisplay(totals.conversion)} CVR` },
      { key: 'ftd', label: 'FTD', value: totals.ftd, note: totals.visitors ? `${formatPercentDisplay((totals.ftd / Math.max(totals.visitors, 1)) * 100)} of visitors` : 'FTD' },
      { key: 'qftd', label: 'QFTD', value: totals.qftd, note: totals.ftd ? `${formatPercentDisplay((totals.qftd / Math.max(totals.ftd, 1)) * 100)} of FTD` : 'Qualified' },
      { key: 'payments', label: 'Payments (payout)', value: totals.paymentsTotal, note: totals.ftd ? `${formatEuroFull(totals.paymentsTotal / Math.max(totals.ftd, 1))} per FTD` : 'Payouts' },
    ]
    const max = Math.max(...steps.map((s) => s.value || 0), 1)
    return steps.map((s, idx) => ({ ...s, width: ((s.value || 0) / max) * 100, color: ['#38bdf8', '#a855f7', '#22d3ee', '#f97316', '#fbbf24'][idx % 5] }))
  }, [totals])

  const moneySteps = useMemo(() => {
    const steps = [
      { key: 'deposits', label: 'Deposits', value: totals.deposits, note: 'Gross inflow' },
      { key: 'withdrawals', label: 'Withdrawals', value: totals.withdrawals, note: 'Cash out' },
      { key: 'netDeposits', label: 'Net deposits', value: totals.netDeposits, note: 'Deposits - Withdrawals' },
      { key: 'pl', label: 'PL', value: totals.pl, note: 'P&L (trading)' },
    ]
    const max = Math.max(...steps.map((s) => Math.abs(s.value || 0)), 1)
    return steps.map((s, idx) => ({ ...s, width: (Math.abs(s.value || 0) / max) * 100, color: ['#10b981', '#f59e0b', '#22d3ee', '#a855f7'][idx % 4] }));
  }, [totals])

  const insights = useMemo(() => {
    const list = []
    if (totals.conversion) list.push(`Conversion: ${formatPercentDisplay(totals.conversion)} from visitors to reg.`)
    if (totals.ftd && totals.registrations) {
      list.push(`FTD rate: ${formatPercentDisplay((totals.ftd / Math.max(totals.registrations, 1)) * 100)} from reg to FTD.`)
    }
    if (totals.qftd && totals.ftd) list.push(`QFTD quality: ${formatPercentDisplay((totals.qftd / Math.max(totals.ftd, 1)) * 100)} of FTD are qualified.`)
    if (totals.paymentsTotal && totals.ftd) list.push(`Payout per FTD: ${formatEuroFull(totals.paymentsTotal / Math.max(totals.ftd, 1))}.`)
    if (Number.isFinite(totals.profit)) list.push(`Profit: ${formatEuroFull(totals.profit)} (P&L - payments).`)
    return list
  }, [totals])

  const badgeStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 12,
    color: '#cbd5e1',
  }

  const SHOW_QUICK_INSIGHTS = false
  const SHOW_MONTHLY_TABLE = false
  const SHOW_BOTTOM_KPI_ROLLUP = false

  const periodLabel = useMemo(() => {
    if (selectedYear === 'all' && selectedMonth === 'all') return 'Full period'
    if (selectedYear !== 'all' && selectedMonth === 'all') return `Year ${selectedYear}`
    if (selectedMonth !== 'all') {
      const match = monthOptions.find((m) => m.key === selectedMonth)
      if (match) return match.label
    }
    return 'Filtered period'
  }, [selectedMonth, selectedYear, monthOptions])

  return (
    <div className="w-full space-y-3">
      <CardSection
        title="Global view"
        subtitle="Media Report + Payments Report per panorama unico"
        sticky
        stickyTop={12}
        actions={(
          <FilterBar>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Anno</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{ ...selectStyle, minWidth: 120 }}
                >
                  <option value="all">Tutti</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Mese</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={selectStyle}
              >
                <option value="all">Tutti</option>
                {monthOptions.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Affiliate</span>
              <select
                value={selectedAffiliate}
                onChange={(e) => setSelectedAffiliate(e.target.value)}
                style={{ ...selectStyle, minWidth: 200 }}
              >
                <option value="all">Tutti</option>
                {affiliateOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <button className="btn secondary" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => { setSelectedAffiliate('all'); setSelectedMonth('all'); setSelectedYear('all') }}>
              Reset filtri
            </button>
          </FilterBar>
        )}
      />

      {/* PRIMARY KPI strip */}
      <div className="card card-global" style={{ padding: 14 }}>
        <h3 style={{ margin: 0, marginBottom: 10 }}>Executive KPIs</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[{
            label: 'Net deposits', value: totals.netDeposits, helper: 'Net dep', formatter: formatEuro,
          }, {
            label: 'P&L', value: totals.pl, helper: 'Total P&L', formatter: formatEuro,
          }, {
            label: 'Payments', value: totals.paymentsTotal, helper: 'Total payments', formatter: formatEuro,
          }, {
            label: 'Profit', value: totals.profit, helper: 'Profit = P&L – payments', formatter: formatEuro,
          }, {
            label: 'ROI avg', value: totals.roiAvg, helper: 'Avg ROI', formatter: formatPercentDisplay,
          }].map((kpi) => (
            <div key={kpi.label} style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{kpi.helper}</div>
              <div style={{ fontWeight: 700, fontSize: 24 }}>{kpi.formatter(kpi.value)}</div>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      <ExecutiveAnalysisEngine
        kpis={{
          netDeposits: totals.netDeposits,
          totalPL: totals.pl,
          totalPayments: totals.paymentsTotal,
          profit: totals.profit,
          avgROI: totals.roiAvg,
          conversionRate: totals.conversion,
          marginPct: totals.netDeposits ? (totals.profit / Math.max(Math.abs(totals.netDeposits), 1)) * 100 : 0,
          bestMonth: perMonth.reduce((best, m) => (best === null || m.profit > best.profit ? m : best), null),
          worstMonth: perMonth.reduce((worst, m) => (worst === null || m.profit < worst.profit ? m : worst), null),
          volatility: (() => {
            const profits = perMonth.map((m) => m.profit)
            if (profits.length < 2) return 0
            const avg = profits.reduce((a, b) => a + b, 0) / profits.length
            const variance = profits.reduce((acc, v) => acc + (v - avg) ** 2, 0) / profits.length
            return Math.sqrt(variance)
          })(),
          recentTrend: (() => {
            const profits = perMonth.map((m) => m.profit)
            const last = profits.slice(-3)
            const prev = profits.slice(-6, -3)
            const avgLast = last.length ? last.reduce((a, b) => a + b, 0) / last.length : 0
            const avgPrev = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0
            return avgLast - avgPrev
          })(),
        }}
        periodLabel={periodLabel}
      />

      {/* SECONDARY KPI row */}
      <div className="card card-global" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Acquisition & quality</h3>
          <span style={badgeStyle}>Funnel health</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {[{
            label: 'Visitors', value: totals.visitors, formatter: formatNumberShort,
          }, {
            label: 'Registrations', value: totals.registrations, formatter: formatNumberShort,
          }, {
            label: 'FTD', value: totals.ftd, formatter: formatNumberShort,
          }, {
            label: 'QFTD', value: totals.qftd, formatter: formatNumberShort,
          }, {
            label: 'Conversion', value: totals.conversion, formatter: formatPercentDisplay,
          }].map((kpi) => (
            <div key={kpi.label} className="kpi" style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <span>{kpi.label}</span>
              <strong>{kpi.formatter(kpi.value)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-global" style={{ alignItems: 'start', rowGap: 12 }}>
        <div className="card card-global" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(168,85,247,0.10))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Acquisition funnel</h3>
            <span style={badgeStyle}>Visitors → Reg → FTD → QFTD</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {acquisitionSteps.map((s) => (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: s.color, display: 'inline-block' }} />
                    <strong style={{ fontSize: 13 }}>{s.label}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
                    <span title={formatNumberFull(s.value)}>{formatNumberShort(s.value)}</span>
                    <span style={{ color: '#9fb3c8' }}>{s.note}</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${Math.max(s.width, 6)}%`, height: '100%', background: s.color, boxShadow: '0 6px 18px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-global" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,211,238,0.10))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Money flow</h3>
            <span style={badgeStyle}>Deposits → Withdrawals → Net → PL</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {moneySteps.map((s) => (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: s.color, display: 'inline-block' }} />
                    <strong style={{ fontSize: 13 }}>{s.label}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
                    <span title={formatEuroFull(s.value)}>{formatEuro(s.value)}</span>
                    <span style={{ color: '#9fb3c8' }}>{s.note}</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${Math.max(s.width, 6)}%`, height: '100%', background: s.color, boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-global" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0 }}>Best affiliates</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#9fb3c8' }}>Top 15 per net deposits, clicca per filtrare</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={badgeStyle}>Top 10 + Next 5 + Others</span>
              <button
                className="btn secondary"
                style={{ padding: '6px 10px', fontSize: 12 }}
                onClick={() => setSelectedAffiliate('all')}
              >
                Reset filtro
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 13 }}>Top 10</strong>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {(affiliateLeaderboard?.top10 || []).map((r) => (
                  <button
                    key={`top10-${r.affiliate}`}
                    onClick={() => setSelectedAffiliate(r.affiliate)}
                    className="btn secondary"
                    style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '6px 10px', fontSize: 12, background: selectedAffiliate === r.affiliate ? 'rgba(96,165,250,0.16)' : '#0f172a' }}
                    title={`Net dep ${formatEuroFull(r.netDeposits)} | P&L ${formatEuroFull(r.pl)} | Profit ${formatEuroFull(r.profit)}`}
                  >
                    <span style={{ fontWeight: 600 }}>{r.affiliate}</span>
                    <span style={{ color: (r.netDeposits || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(r.netDeposits)}</span>
                  </button>
                ))}
                {(affiliateLeaderboard?.top10 || []).length === 0 && (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Nessun dato</span>
                )}
              </div>
            </div>

            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 13 }}>Next 5</strong>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {(affiliateLeaderboard?.mid5 || []).map((r) => (
                  <button
                    key={`mid5-${r.affiliate}`}
                    onClick={() => setSelectedAffiliate(r.affiliate)}
                    className="btn secondary"
                    style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '6px 10px', fontSize: 12, background: selectedAffiliate === r.affiliate ? 'rgba(96,165,250,0.16)' : '#0f172a' }}
                    title={`Net dep ${formatEuroFull(r.netDeposits)} | P&L ${formatEuroFull(r.pl)} | Profit ${formatEuroFull(r.profit)}`}
                  >
                    <span style={{ fontWeight: 600 }}>{r.affiliate}</span>
                    <span style={{ color: (r.netDeposits || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(r.netDeposits)}</span>
                  </button>
                ))}
                {(affiliateLeaderboard?.mid5 || []).length === 0 && (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                )}
              </div>
            </div>

            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 13 }}>Others</strong>
                {affiliateLeaderboard?.othersAgg && (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{affiliateLeaderboard.othersAgg.count} affiliates</span>
                )}
              </div>
              {affiliateLeaderboard?.othersAgg ? (
                <button
                  onClick={() => setSelectedAffiliate('all')}
                  className="btn secondary"
                  style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '6px 10px', fontSize: 12, background: '#0f172a' }}
                  title={`Net dep ${formatEuroFull(affiliateLeaderboard.othersAgg.netDeposits)} | P&L ${formatEuroFull(affiliateLeaderboard.othersAgg.pl)} | Profit ${formatEuroFull(affiliateLeaderboard.othersAgg.profit)}`}
                >
                  <span style={{ fontWeight: 600 }}>Others</span>
                  <span style={{ color: (affiliateLeaderboard.othersAgg.netDeposits || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(affiliateLeaderboard.othersAgg.netDeposits)}</span>
                </button>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Nessun dato aggiuntivo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card card-global" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Performance charts</h3>
          <span style={badgeStyle}>Filtri attivi: {periodLabel}</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Le serie riflettono anno/mese/affiliate selezionati. Se scegli un singolo mese viene mostrato solo quel punto.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 10 }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h4 style={{ margin: 0 }}>P&L by month</h4>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>€</span>
            </div>
            <div style={{ height: 220 }}>
              <PnLTrendChart
                labels={breakEven.labels}
                dataPoints={perMonth.map((m) => m.pl)}
                datasetLabel="P&L"
                formatValue={formatEuroFull}
                tooltipFormatter={({ value, label }) => `${label}: ${formatEuroFull(value)}`}
              />
            </div>
            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>Break-even: {breakEven.breakEvenLabel || 'non raggiunto'}.</p>
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h4 style={{ margin: 0 }}>Margin % by month</h4>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>%</span>
            </div>
            <div style={{ height: 220 }}>
              <PnLTrendChart
                labels={breakEven.labels}
                dataPoints={perMonth.map((m) => {
                  const profit = m.profit
                  const base = Math.max(Math.abs(m.netDeposits || 0), 1)
                  return (profit / base) * 100
                })}
                datasetLabel="Margin %"
                formatValue={formatPercent}
                tooltipFormatter={({ value, label }) => `${label}: ${formatPercent(value, 2)}`}
              />
            </div>
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h4 style={{ margin: 0 }}>ROI % by month</h4>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>%</span>
            </div>
            <div style={{ height: 220 }}>
              <PnLTrendChart
                labels={breakEven.labels}
                dataPoints={perMonth.map((m) => {
                  if (m.roi || m.roi === 0) return m.roi
                  const base = Math.max(Math.abs(m.payments || 0), 1)
                  return (m.profit / base) * 100
                })}
                datasetLabel="ROI %"
                formatValue={formatPercent}
                tooltipFormatter={({ value, label }) => `${label}: ${formatPercent(value, 2)}`}
              />
            </div>
          </div>
        </div>
      </div>

      {SHOW_MONTHLY_TABLE && (
        <div className="card card-global">
          <h3 style={{ marginBottom: 8 }}>Per month (filtered)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ textAlign: 'right' }}>Visitors</th>
                  <th style={{ textAlign: 'right' }}>Reg</th>
                  <th style={{ textAlign: 'right' }}>FTD</th>
                  <th style={{ textAlign: 'right' }}>Net dep</th>
                  <th style={{ textAlign: 'right' }}>PL</th>
                  <th style={{ textAlign: 'right' }}>Payments</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                  <th style={{ textAlign: 'right' }}>ROI</th>
                  <th style={{ textAlign: 'right' }}>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {perMonth.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8' }}>Nessun dato per i filtri selezionati</td>
                  </tr>
                )}
                {perMonth.map((m) => (
                  <tr key={m.monthKey}>
                    <td>{m.monthLabel}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumberShort(m.visitors)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumberShort(m.registrations)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumberShort(m.ftd)}</td>
                    <td style={{ textAlign: 'right' }}>{formatEuro(m.netDeposits)}</td>
                    <td style={{ textAlign: 'right' }}>{formatEuro(m.pl)}</td>
                    <td style={{ textAlign: 'right' }}>{formatEuro(m.payments)}</td>
                    <td style={{ textAlign: 'right' }}>{formatEuro(m.profit)}</td>
                    <td style={{ textAlign: 'right' }}>{formatPercentDisplay(m.roi)}</td>
                    <td style={{ textAlign: 'right' }}>{formatPercentDisplay(m.conversion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {SHOW_BOTTOM_KPI_ROLLUP && (
        <div className="card card-global" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0 }}>KPI roll-up (per-month agg)</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>Sommatoria mese filtrato</p>
            </div>
            <span style={badgeStyle}>Conversion, ROI, Profit</span>
          </div>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div className="kpi">
              <span>Visitors</span>
              <strong>{formatNumberShort(perMonthTotals.visitors)}</strong>
            </div>
            <div className="kpi">
              <span>Registrations</span>
              <strong>{formatNumberShort(perMonthTotals.registrations)}</strong>
            </div>
            <div className="kpi">
              <span>FTD</span>
              <strong>{formatNumberShort(perMonthTotals.ftd)}</strong>
            </div>
            <div className="kpi">
              <span>Net dep</span>
              <strong>{formatEuro(perMonthTotals.netDeposits)}</strong>
            </div>
            <div className="kpi">
              <span>PL</span>
              <strong>{formatEuro(perMonthTotals.pl)}</strong>
            </div>
            <div className="kpi">
              <span>Payments</span>
              <strong>{formatEuro(perMonthTotals.payments)}</strong>
            </div>
            <div className="kpi">
              <span>Profit</span>
              <strong>{formatEuro(perMonthTotals.profit)}</strong>
            </div>
            <div className="kpi">
              <span>ROI</span>
              <strong>{formatPercentDisplay(perMonthTotals.roi)}</strong>
            </div>
            <div className="kpi">
              <span>Conversion</span>
              <strong>{formatPercentDisplay(perMonthTotals.conversion)}</strong>
            </div>
          </div>
        </div>
      )}

      {SHOW_QUICK_INSIGHTS && (
        <div className="card card-global">
          <h3 style={{ marginBottom: 8 }}>Quick insights</h3>
          <ul style={{ color: '#cbd5e1', margin: 0, paddingLeft: 18 }}>
            {insights.length === 0 && <li style={{ color: '#94a3b8' }}>Nessun dato</li>}
            {insights.map((i, idx) => (<li key={idx}>{i}</li>))}
          </ul>
        </div>
      )}

      {loading && (
        <div className="card card-global" style={{ textAlign: 'center', color: '#94a3b8' }}>Caricamento dati…</div>
      )}
    </div>
  )
}
