import React, { useMemo } from 'react'
import { formatEuro, formatEuroFull, formatNumber, formatNumberShort, formatPercent } from '../../../lib/formatters'
import { useMediaPaymentsData } from '../hooks/useMediaPaymentsData'
import { useLeaderboard } from '../hooks/useLeaderboard'

const formatNumberFull = (value) => formatNumber(value)

export default function SummaryReport() {
  const { mediaRows, payments, loading } = useMediaPaymentsData()
  const leaderboard = useLeaderboard(mediaRows, payments)

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

  const byAffiliateMap = useMemo(() => new Map(byAffiliate.map((r) => [r.affiliate, r])), [byAffiliate])

  const bestAffiliates = useMemo(() => {
    const ranked = leaderboard?.all?.length ? leaderboard.all : byAffiliate
    return ranked
      .map((r) => byAffiliateMap.get(r.affiliate) || r)
      .filter((r) => r)
      .sort((a, b) => (b.netDeposits || 0) - (a.netDeposits || 0) || (b.registrations || 0) - (a.registrations || 0) || (b.pl || 0) - (a.pl || 0))
      .slice(0, 15)
  }, [byAffiliate, byAffiliateMap, leaderboard])

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

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyPlMatrix = useMemo(() => bestAffiliates.map((r) => ({
    affiliate: r.affiliate,
    monthlyPl: r.monthlyPl || Array(12).fill(0),
    monthlyPay: r.monthlyPay || Array(12).fill(0),
    profit: r.profit || 0,
  })), [bestAffiliates])

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

      <aside className="card w-full" style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Monthly PL vs payments (top 15)</h3>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Per affiliate · PL over commissions to spot ROI drift</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 1100, width: '100%', fontSize: 12, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th>Affiliate</th>
                <th style={{ textAlign: 'right' }}>Profit</th>
                {months.map((m) => (
                  <th key={`head-${m}`} style={{ textAlign: 'right' }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyPlMatrix.length === 0 && (
                <tr>
                  <td colSpan={months.length + 2} style={{ textAlign: 'center', color: '#94a3b8' }}>No data</td>
                </tr>
              )}
              {monthlyPlMatrix.map((r) => (
                <tr key={`pl-matrix-${r.affiliate}`}>
                  <td style={{ fontWeight: 600 }}>{r.affiliate}</td>
                  <td style={{ textAlign: 'right', color: (r.profit || 0) >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>{formatEuro(r.profit || 0)}</td>
                  {months.map((m, idx) => {
                    const pl = r.monthlyPl[idx] || 0
                    const pay = r.monthlyPay[idx] || 0
                    const delta = pl - pay
                    const color = delta >= 0 ? '#34d399' : '#f87171'
                    return (
                      <td key={`${r.affiliate}-${m}`} style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <div style={{ color }}>{formatEuro(pl)}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Pay {formatEuro(pay)}</div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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

      <section className="w-full" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <aside className="card w-full" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Top net deposits (5)</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Net dep + PL + pay</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 0, width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Affiliate</th>
                  <th style={{ textAlign: 'right' }}>Net dep</th>
                  <th style={{ textAlign: 'right' }}>PL</th>
                  <th style={{ textAlign: 'right' }}>Payments</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                </tr>
              </thead>
              <tbody>
                {topNetDeposits.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>No data</td></tr>
                )}
                {topNetDeposits.map((r, idx) => (
                  <tr key={`netdep-${r.affiliate}`} style={{ background: idx < 3 ? 'rgba(52,211,153,0.06)' : 'transparent' }}>
                    <td style={{ color: '#22d3ee', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{r.affiliate}</td>
                    <td style={{ textAlign: 'right', color: '#22d3ee' }}>{formatEuro(r.netDeposits || 0)}</td>
                    <td style={{ textAlign: 'right' }}>{formatEuro(r.pl || 0)}</td>
                    <td style={{ textAlign: 'right' }}>{formatEuro(r.payments || 0)}</td>
                    <td style={{ textAlign: 'right', color: r.profit >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(r.profit || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>

        <aside className="card w-full" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Totals · best 15</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Aggregati per la top 15</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Registrations</div>
              <div style={{ fontWeight: 700 }}>{formatNumberShort(bestTotals.registrations)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>FTD</div>
              <div style={{ fontWeight: 700 }}>{formatNumberShort(bestTotals.ftd)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>PL</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(bestTotals.pl)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Payments</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(bestTotals.paymentsTotal)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Profit</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(bestTotals.profit)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Fastest BE</div>
              <div style={{ fontWeight: 700 }}>{bestTotals.fastestBE ? `${bestTotals.fastestBE.affiliate} · ${bestTotals.fastestBE.breakEvenMonths}m` : 'n/d'}</div>
            </div>
          </div>
        </aside>

        <aside className="card w-full" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Net deposit heroes</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Top 5 net dep</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Net dep</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(netTopTotals.netDeposits)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>PL</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(netTopTotals.pl)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Payments</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(netTopTotals.paymentsTotal)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Profit</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(netTopTotals.profit)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>CPA</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(Math.round(netTopTotals.cpa || 0))}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>ARPU</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(Math.round(netTopTotals.arpu || 0))}</div>
            </div>
          </div>
        </aside>
      </section>

      <section className="w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        <aside className="card w-full" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Quadrants · base top 15</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Top vs rest per metrica</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[{ key: 'best', label: 'Best overall' }, { key: 'cpa', label: 'CPA' }, { key: 'arpu', label: 'ARPU' }, { key: 'pl', label: 'PL' }, { key: 'roi', label: 'ROI' }]
              .map((cat) => (
                <div key={cat.key} style={{ border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{cat.label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Top 3</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(quadrants[cat.key].top || []).slice(0, 3).map((r, idx) => (
                      <div key={`${cat.key}-top-${r.affiliate}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>{r.affiliate}</span>
                        <span style={{ color: '#22d3ee' }}>{formatEuro(r.profit || r.pl || 0)}</span>
                      </div>
                    ))}
                    {(quadrants[cat.key].top || []).length === 0 && <div style={{ color: '#94a3b8', fontSize: 12 }}>No data</div>}
                  </div>
                </div>
              ))}
          </div>
        </aside>

        <aside className="card w-full" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Totals</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Global</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Registrations</div>
              <div style={{ fontWeight: 700 }}>{formatNumberShort(totals.registrations)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>FTD</div>
              <div style={{ fontWeight: 700 }}>{formatNumberShort(totals.ftd)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>PL</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(totals.pl)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Payments</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(totals.paymentsTotal)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>CPA</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(Math.round(totals.cpa || 0))}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>ARPU</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(Math.round(totals.arpu || 0))}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Churn</div>
              <div style={{ fontWeight: 700 }}>{formatPercent(totals.churn || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Withdrawals</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(totals.withdrawals || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Profit</div>
              <div style={{ fontWeight: 700 }}>{formatEuro(totals.profit)}</div>
            </div>
          </div>
        </aside>
      </section>

      {loading && (
        <div className="card w-full" style={{ textAlign: 'center', color: '#94a3b8' }}>Caricamento dati…</div>
      )}
    </div>
  )
}
