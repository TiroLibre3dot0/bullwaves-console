import React, { useEffect, useMemo, useState } from 'react'
import { formatEuro, formatEuroFull, formatNumber, formatNumberShort, formatPercent, cleanNumber } from '../lib/formatters'
import { parseCsv, parseMonthLabel, parseMonthFirstDate } from '../lib/csv'

const formatNumberFull = (value) => formatNumber(value)

export default function SummaryReport() {
  const [mediaRows, setMediaRows] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      try {
        const mediaCandidates = ['/Media Report.csv', '/01012025 to 12072025 Media Report.csv']
        const paymentsCandidates = ['/Payments Report.csv', '/commissions.csv']

        let mediaText = ''
        for (const path of mediaCandidates) {
          const resp = await fetch(path)
          if (resp.ok) {
            mediaText = await resp.text()
            break
          }
        }

        let paymentsText = ''
        for (const path of paymentsCandidates) {
          const resp = await fetch(path)
          if (resp.ok) {
            paymentsText = await resp.text()
            break
          }
        }

        const parsedMedia = mediaText ? parseCsv(mediaText).map((r) => {
          const monthMeta = parseMonthLabel(r.Month)
          return {
            monthKey: monthMeta.key,
            monthIndex: monthMeta.monthIndex,
            monthLabel: monthMeta.label,
            affiliate: (r.Affiliate || '—').toString().trim(),
            registrations: cleanNumber(r.Registrations || r.Leads),
            ftd: cleanNumber(r.FTD),
            pl: cleanNumber(r.PL),
            netDeposits: cleanNumber(r['Net Deposits']),
            withdrawals: cleanNumber(r.Withdrawals || r['Withdrawals']),
            churnPct: cleanNumber(r['Churn %'] || r.Churn || 0),
          }
        }) : []

        const parsedPayments = paymentsText ? parseCsv(paymentsText).map((r) => {
          const date = r.PaymentDate ? parseMonthFirstDate(r.PaymentDate) : r['Commission Date'] ? new Date(r['Commission Date']) : null
          const monthIndex = date && !Number.isNaN(date.getTime()) ? date.getMonth() : -1
          return {
            monthIndex,
            affiliate: (r.Affiliate || r['Affiliate Id'] || '—').toString().trim(),
            amount: cleanNumber(r['Payment amount'] || r.amount),
          }
        }) : []

        setMediaRows(parsedMedia)
        setPayments(parsedPayments)
      } catch (err) {
        console.error('Failed to load reports', err)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  const byAffiliate = useMemo(() => {
    const map = new Map()
    const ensure = (name) => {
      const key = name || '—'
      if (!map.has(key)) {
        map.set(key, {
          affiliate: key,
          registrations: 0,
          ftd: 0,
          pl: 0,
          netDeposits: 0,
          withdrawals: 0,
          churnPctSum: 0,
          churnCount: 0,
          payments: 0,
          monthlyPl: Array(12).fill(0),
          monthlyPay: Array(12).fill(0),
        })
      }
      return map.get(key)
    }

    mediaRows.forEach((r) => {
      const acc = ensure(r.affiliate)
      acc.registrations += r.registrations || 0
      acc.ftd += r.ftd || 0
      acc.pl += r.pl || 0
      acc.netDeposits += r.netDeposits || 0
      acc.withdrawals += r.withdrawals || 0
      if (r.monthIndex >= 0 && r.monthIndex < 12) {
        acc.monthlyPl[r.monthIndex] += r.pl || 0
      }
      if (!Number.isNaN(r.churnPct)) {
        acc.churnPctSum += r.churnPct || 0
        acc.churnCount += 1
      }
    })

    payments.forEach((p) => {
      const acc = ensure(p.affiliate)
      if (p.monthIndex >= 0 && p.monthIndex < 12) {
        acc.monthlyPay[p.monthIndex] += p.amount || 0
      }
      acc.payments += p.amount || 0
    })

    return Array.from(map.values()).map((r) => {
      const cpa = (r.ftd || 0) ? Math.abs(r.payments || 0) / Math.max(r.ftd, 1) : 0
      const churn = r.churnCount ? (r.churnPctSum / r.churnCount) : 0
      const arpu = (r.registrations || 0) ? (r.pl || 0) / Math.max(r.registrations, 1) : 0
      const profit = (r.pl || 0) - (r.payments || 0)
      const roi = r.payments ? (((r.pl || 0) - (r.payments || 0)) / Math.abs(r.payments)) * 100 : 0
      let breakEvenMonth = null
      let accDiff = 0
      for (let i = 0; i < 12; i += 1) {
        accDiff += (r.monthlyPl[i] || 0) - (r.monthlyPay[i] || 0)
        if (breakEvenMonth === null && accDiff >= 0) breakEvenMonth = i
      }
      return {
        ...r,
        cpa,
        arpu,
        churn,
        withdrawals: r.withdrawals || 0,
        profit,
        roi,
        breakEvenReached: profit >= 0,
        breakEvenMonths: breakEvenMonth !== null ? breakEvenMonth + 1 : null,
      }
    })
  }, [mediaRows, payments])

  const totals = useMemo(() => {
    const sum = (field) => byAffiliate.reduce((acc, r) => acc + (r[field] || 0), 0)
    const registrations = sum('registrations')
    const ftd = sum('ftd')
    const pl = sum('pl')
    const paymentsTotal = sum('payments')
    const cpa = ftd ? Math.abs(paymentsTotal) / Math.max(ftd, 1) : 0
    const arpu = registrations ? pl / Math.max(registrations, 1) : 0
    const churn = (() => {
      const w = byAffiliate.reduce((acc, r) => acc + (r.churnCount || 0), 0)
      if (!w) return 0
      return byAffiliate.reduce((acc, r) => acc + (r.churn || 0) * (r.churnCount || 0), 0) / w
    })()
    const profit = pl - paymentsTotal
    const withdrawals = sum('withdrawals')
    return { registrations, ftd, pl, paymentsTotal, cpa, arpu, churn, profit, withdrawals }
  }, [byAffiliate])

  const bestAffiliates = useMemo(() => {
    return [...byAffiliate]
      .sort((a, b) => (b.netDeposits || 0) - (a.netDeposits || 0) || (b.registrations || 0) - (a.registrations || 0) || (b.pl || 0) - (a.pl || 0))
      .slice(0, 15)
  }, [byAffiliate])

  const topNetDeposits = useMemo(() => {
    return [...byAffiliate]
      .sort((a, b) => (b.netDeposits || 0) - (a.netDeposits || 0) || (b.pl || 0) - (a.pl || 0))
      .slice(0, 5)
  }, [byAffiliate])

  const bestTotals = useMemo(() => {
    const sum = (field) => bestAffiliates.reduce((acc, r) => acc + (r[field] || 0), 0)
    const registrations = sum('registrations')
    const ftd = sum('ftd')
    const pl = sum('pl')
    const paymentsTotal = sum('payments')
    const withdrawals = sum('withdrawals')
    const cpa = ftd ? Math.abs(paymentsTotal) / Math.max(ftd, 1) : 0
    const arpu = registrations ? pl / Math.max(registrations, 1) : 0
    const profit = pl - paymentsTotal
    const fastestBE = bestAffiliates
      .filter((r) => r.breakEvenMonths !== null)
      .sort((a, b) => a.breakEvenMonths - b.breakEvenMonths || b.profit - a.profit)[0] || null
    return { registrations, ftd, pl, paymentsTotal, withdrawals, cpa, arpu, profit, fastestBE }
  }, [bestAffiliates])

  const netTopTotals = useMemo(() => {
    const sum = (field) => topNetDeposits.reduce((acc, r) => acc + (r[field] || 0), 0)
    const registrations = sum('registrations')
    const ftd = sum('ftd')
    const pl = sum('pl')
    const paymentsTotal = sum('payments')
    const netDeposits = sum('netDeposits')
    const withdrawals = sum('withdrawals')
    const cpa = ftd ? Math.abs(paymentsTotal) / Math.max(ftd, 1) : 0
    const arpu = registrations ? pl / Math.max(registrations, 1) : 0
    const profit = pl - paymentsTotal
    return { registrations, ftd, pl, paymentsTotal, withdrawals, cpa, arpu, profit, netDeposits }
  }, [topNetDeposits])

  const rankings = useMemo(() => {
    const pool = bestAffiliates
    const bestCpa = [...pool]
      .filter((r) => r.ftd > 0 && r.payments > 0 && r.cpa > 0)
      .sort((a, b) => a.cpa - b.cpa)
      .slice(0, 10)

    const bestArpu = [...pool]
      .filter((r) => r.registrations > 0 && r.pl > 0 && r.arpu > 0)
      .sort((a, b) => b.arpu - a.arpu)
      .slice(0, 10)

    const bestBreakEven = [...pool]
      .filter((r) => r.breakEvenMonths !== null || r.breakEvenReached)
      .sort((a, b) => {
        const aReach = a.breakEvenMonths !== null
        const bReach = b.breakEvenMonths !== null

    // Rankings based on net deposits first, then registrations, then PL
        if (aReach !== bReach) return aReach ? -1 : 1
        if (aReach && bReach) return a.breakEvenMonths - b.breakEvenMonths || b.profit - a.profit
        return b.profit - a.profit
      })
      .slice(0, 10)

    return { bestCpa, bestArpu, bestBreakEven }
  }, [bestAffiliates])

  const quadrants = useMemo(() => {
    const base = bestAffiliates
    const baseTop = base.slice(0, 5)
    const baseRest = base.slice(5, 15)

    const mk = (topList, restList, sortFn) => {
      const top = [...topList].sort(sortFn)
      const rest = [...restList].sort(sortFn)
      return { top, rest }
    }

    const bestSort = (a, b) => (b.netDeposits || 0) - (a.netDeposits || 0) || (b.registrations || 0) - (a.registrations || 0)
    const best = mk(baseTop, baseRest, bestSort)

    const cpaSort = (a, b) => {
      const av = a.cpa > 0 ? a.cpa : Number.POSITIVE_INFINITY
      const bv = b.cpa > 0 ? b.cpa : Number.POSITIVE_INFINITY
      return av - bv || (b.ftd || 0) - (a.ftd || 0)
    }
    const arpuSort = (a, b) => (b.arpu || 0) - (a.arpu || 0) || (b.registrations || 0) - (a.registrations || 0)
    const plSort = (a, b) => (b.pl || 0) - (a.pl || 0)
    const roiSort = (a, b) => (b.roi || -Infinity) - (a.roi || -Infinity)

    const cpa = mk(baseTop, baseRest, cpaSort)
    const arpu = mk(baseTop, baseRest, arpuSort)
    const pl = mk(baseTop, baseRest, plSort)
    const roi = mk(baseTop, baseRest, roiSort)

    return { best, cpa, arpu, pl, roi }
  }, [bestAffiliates])

  const kpiBest = useMemo(() => {
    return [...byAffiliate]
      .filter((r) => (r.registrations || r.ftd || r.pl || r.payments))
      .sort((a, b) => (b.profit || 0) - (a.profit || 0) || (b.roi || -Infinity) - (a.roi || -Infinity))
      .slice(0, 8)
  }, [byAffiliate])

  const kpiWorst = useMemo(() => {
    return [...byAffiliate]
      .filter((r) => (r.registrations || r.ftd || r.pl || r.payments))
      .sort((a, b) => (a.profit || 0) - (b.profit || 0) || (a.roi || Infinity) - (b.roi || Infinity))
      .slice(0, 8)
  }, [byAffiliate])

  const quickInsights = useMemo(() => {
    const items = []
    const bestTop = quadrants.best.top || []
    const cpaTop = quadrants.cpa.top || []
    const arpuTop = quadrants.arpu.top || []
    const plTop = quadrants.pl.top || []
    const roiTop = quadrants.roi.top || []
    if (cpaTop[0]) items.push({ label: 'Best CPA (base top5)', value: `${cpaTop[0].affiliate} · ${formatEuroFull(cpaTop[0].cpa)}` })
    if (arpuTop[0]) items.push({ label: 'Best ARPU/CLV (base top5)', value: `${arpuTop[0].affiliate} · ${formatEuroFull(arpuTop[0].arpu)}` })
    if (roiTop[0]) items.push({ label: 'Best ROI (base top5)', value: `${roiTop[0].affiliate} · ${(roiTop[0].roi || 0).toFixed(1)}%` })
    const be = plTop.find((r) => r.breakEvenMonths !== null)
    if (be) items.push({ label: 'Fastest break-even (base top5)', value: `${be.affiliate} · ~${be.breakEvenMonths} months · PL ${formatEuro(be.pl)} / pay ${formatEuro(be.payments)}` })
    if (bestTop[0]) items.push({ label: 'Top registrations/net dep', value: bestTop[0].affiliate })
    if (!items.length) items.push({ label: 'No insights available for current datasets', value: '' })
    return items
  }, [quadrants])

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.2 }}>Summary report · Media Report + Payments</div>

      <aside className="card w-full" style={{ background: '#0d1524' }}>
        <h3 style={{ marginTop: 0 }}>Quick insights (aligned with quadrants)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {quickInsights.map((q, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(34,211,238,0.25)',
                background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(56,189,248,0.08))',
                fontSize: 13,
                boxShadow: '0 10px 30px rgba(14,165,233,0.15)'
              }}
            >
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{q.label}:</span>{' '}
              <span style={{ color: '#22d3ee', fontWeight: 700 }}>{q.value}</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="w-full" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <aside className="card w-full" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Best KPI snapshot</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Top by profit/ROI</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 0, width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th>Affiliate</th>
                  <th style={{ textAlign: 'right' }}>PL</th>
                  <th style={{ textAlign: 'right' }}>Payments (New Reg)</th>
                  <th style={{ textAlign: 'right' }}>ROI</th>
                  <th style={{ textAlign: 'right' }}>CPA</th>
                  <th style={{ textAlign: 'right' }}>Withdrawals</th>
                </tr>
              </thead>
              <tbody>
                {kpiBest.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>No data</td>
                  </tr>
                )}
                {kpiBest.map((r, idx) => {
                  const accent = ['#22d3ee', '#34d399', '#38bdf8', '#fbbf24'][idx] || '#cbd5e1'
                  return (
                    <tr key={`best-kpi-${r.affiliate}`} style={{ background: idx < 3 ? 'rgba(34,211,238,0.06)' : 'transparent' }}>
                      <td style={{ color: accent, fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.affiliate}</td>
                      <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{formatEuro(r.pl || 0)}</td>
                      <td style={{ textAlign: 'right', color: '#cbd5e1' }}>
                        {formatEuro(r.payments || 0)}{r.registrations ? ` (${formatNumberShort(r.registrations)})` : ''}
                      </td>
                      <td style={{ textAlign: 'right', color: accent }}>{(r.roi || 0).toFixed(1)}%</td>
                      <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{formatEuroFull(r.cpa || 0)}</td>
                      <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{formatEuro(r.withdrawals || 0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </aside>

        <aside className="card w-full" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Worst KPI snapshot</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Lowest profit/ROI</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 0, width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th>Affiliate</th>
                  <th style={{ textAlign: 'right' }}>PL</th>
                  <th style={{ textAlign: 'right' }}>Payments (New Reg)</th>
                  <th style={{ textAlign: 'right' }}>ROI</th>
                  <th style={{ textAlign: 'right' }}>CPA</th>
                  <th style={{ textAlign: 'right' }}>Withdrawals</th>
                </tr>
              </thead>
              <tbody>
                {kpiWorst.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>No data</td>
                  </tr>
                )}
                {kpiWorst.map((r, idx) => {
                  const accent = ['#f87171', '#fb923c', '#fbbf24', '#94a3b8'][idx] || '#e2e8f0'
                  return (
                    <tr key={`worst-kpi-${r.affiliate}`} style={{ background: idx < 3 ? 'rgba(248,113,113,0.06)' : 'transparent' }}>
                      <td style={{ color: accent, fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.affiliate}</td>
                      <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{formatEuro(r.pl || 0)}</td>
                      <td style={{ textAlign: 'right', color: '#cbd5e1' }}>
                        {formatEuro(r.payments || 0)}{r.registrations ? ` (${formatNumberShort(r.registrations)})` : ''}
                      </td>
                      <td style={{ textAlign: 'right', color: accent }}>{(r.roi || 0).toFixed(1)}%</td>
                      <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{formatEuroFull(r.cpa || 0)}</td>
                      <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{formatEuro(r.withdrawals || 0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </aside>
      </section>

      <section className="w-full quadrant-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {[
          {
            title: 'Best Affiliates (Top 15)',
            rowsTop: quadrants.best.top,
            rowsRest: quadrants.best.rest,
            metric: (r) => formatNumberFull(r.registrations || r.ftd || 0),
            metricLabel: 'Reg/FTD',
            extra: (r) => formatEuro(r.netDeposits || 0),
            extraLabel: 'Net Deposits',
            note: 'Top 15 ordered by net deposits',
          },
          {
            title: 'CPA (Top 15)',
            rowsTop: quadrants.cpa.top,
            rowsRest: quadrants.cpa.rest,
            metric: (r) => formatEuroFull(r.cpa),
            metricLabel: 'CPA',
            extra: (r) => formatEuro(r.netDeposits || 0),
            extraLabel: 'Net Deposits',
            note: 'Same 15 as the first quadrant',
          },
          {
            title: 'ARPU / CLV (Top 15)',
            rowsTop: quadrants.arpu.top,
            rowsRest: quadrants.arpu.rest,
            metric: (r) => formatEuroFull(r.arpu),
            metricLabel: 'ARPU/CLV',
            extra: (r) => formatEuro(r.netDeposits || 0),
            extraLabel: 'Net Deposits',
            note: 'Same 15 as the first quadrant',
          },
          {
            title: 'Annual PL (Top 15)',
            rowsTop: quadrants.pl.top,
            rowsRest: quadrants.pl.rest,
            metric: (r) => formatEuro(r.pl),
            metricLabel: 'PL',
            extra: (r) => formatEuro(r.netDeposits || 0),
            extraLabel: 'Net Deposits',
            note: 'Same 15 as the first quadrant',
          },
          {
            title: 'ROI (Top 15)',
            rowsTop: quadrants.roi.top,
            rowsRest: quadrants.roi.rest,
            metric: (r) => `${(r.roi || 0).toFixed(1)}%`,
            metricLabel: 'ROI',
            extra: (r) => formatEuro(r.netDeposits || 0),
            extraLabel: 'Net Deposits',
            note: 'Same 15 as the first quadrant',
          },
        ].map((card) => (
          <aside key={card.title} className="card w-full quadrant-card" style={{ minHeight: 260, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{card.title}</h3>
              <span style={{ color: '#64748b', fontSize: 11 }}>{card.note}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: 0, width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Affiliate</th>
                    <th style={{ textAlign: 'right' }}>{card.metricLabel}</th>
                    <th style={{ textAlign: 'right' }}>{card.extraLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {(card.rowsTop || []).length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>No data</td>
                    </tr>
                  )}
                  {(card.rowsTop || []).map((r, rankIdx) => {
                    const accent = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#22d3ee'][rankIdx] || '#cbd5e1'
                    return (
                      <tr key={`${card.title}-top-${r.affiliate}`} style={{ background: 'rgba(34,211,238,0.06)' }}>
                        <td style={{ color: accent, fontWeight: 700 }}>{rankIdx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{r.affiliate}</td>
                        <td style={{ textAlign: 'right', color: accent }}>{card.metric(r)}</td>
                        <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{card.extra(r)}</td>
                      </tr>
                    )
                  })}
                  {(card.rowsRest || []).length > 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', fontSize: 11, padding: '6px 0' }}>— Next ranking —</td>
                    </tr>
                  )}
                  {(card.rowsRest || []).map((r, idx) => {
                    const rank = idx + 6
                    return (
                      <tr key={`${card.title}-rest-${r.affiliate}`}>
                        <td style={{ color: '#94a3b8' }}>{rank}</td>
                        <td style={{ fontWeight: 600 }}>{r.affiliate}</td>
                        <td style={{ textAlign: 'right', color: '#e2e8f0' }}>{card.metric(r)}</td>
                        <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{card.extra(r)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </aside>
        ))}
      </section>

      <aside className="card w-full" style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Top 5 Net Deposits (separate ranking)</h3>
          <span style={{ color: '#64748b', fontSize: 11 }}>Ordered by Net Deposits</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 0, width: '100%', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Affiliate</th>
                <th style={{ textAlign: 'right' }}>Net Deposits</th>
                <th style={{ textAlign: 'right' }}>PL</th>
                <th style={{ textAlign: 'right' }}>Withdrawals</th>
              </tr>
            </thead>
            <tbody>
              {topNetDeposits.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No data</td>
                </tr>
              )}
              {topNetDeposits.map((r, idx) => {
                const accent = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#22d3ee'][idx] || '#cbd5e1'
                return (
                  <tr key={`net-${r.affiliate}`} style={{ background: idx < 5 ? 'rgba(34,211,238,0.05)' : 'transparent' }}>
                    <td style={{ color: accent, fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{r.affiliate}</td>
                    <td style={{ textAlign: 'right', color: accent }}>{formatEuro(r.netDeposits || 0)}</td>
                    <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{formatEuro(r.pl || 0)}</td>
                    <td style={{ textAlign: 'right', color: '#cbd5e1' }}>{formatEuro(r.withdrawals || 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </aside>
    </div>
  )
}
