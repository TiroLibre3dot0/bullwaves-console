import React, { useEffect, useMemo, useState } from 'react'
import PnLTrendChart from '../../../components/PnLTrendChart'
import CardSection from '../../../components/common/CardSection'
import FilterBar from '../../../components/common/FilterBar'
import KpiCard from '../../../components/common/KpiCard'
import YearSelector from '../../../components/common/YearSelector'
import { formatEuro, formatEuroFull, formatNumber, formatNumberShort, formatPercent } from '../../../lib/formatters'
import { useMediaPaymentsData } from '../../media-payments/hooks/useMediaPaymentsData'
import { useAffiliateLedger } from '../../media-payments/hooks/useAffiliateLedger'

const selectStyle = { minWidth: 180, background: '#0d1a2c', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }
const formatNumberFull = (value) => formatNumber(value)
const DEFAULT_NEGOTIATED_CPA = 400
const CPA_STORAGE_KEY = 'affiliate-cpa-overrides'
const FINANCE_CONFIRMED_KEY = 'affiliate-finance-confirmed'
const monthLabel = (m) => {
  const parts = (m || '').split('-')
  if (parts.length < 2) return m
  const idx = Number(parts[1]) - 1
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${names[idx] || m} ${parts[0]}`
}

export default function InvestmentsDashboard() {
  const { payments, mediaRows, loading } = useMediaPaymentsData()
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [search, setSearch] = useState('')
  const [showAllAffiliates, setShowAllAffiliates] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [cpaOverrides, setCpaOverrides] = useState({})
  const [financeConfirmed, setFinanceConfirmed] = useState({})

  const ledger = useAffiliateLedger({ mediaRows, payments, selectedYear, selectedMonth, search, negotiatedCpaOverrides: cpaOverrides })

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
      map.set(key, monthLabel(key))
    }
    mediaRows.forEach(add)
    payments.forEach(add)
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value.localeCompare(b.value))
  }, [mediaRows, payments, selectedYear])

  const toggleExpand = (aff) => setExpanded((prev) => (prev === aff ? null : aff))
  const setAffiliateCpa = (affiliateId, value) => {
    setCpaOverrides((prev) => ({ ...prev, [affiliateId]: value }))
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CPA_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setCpaOverrides(parsed)
      }
      const rawFinance = localStorage.getItem(FINANCE_CONFIRMED_KEY)
      if (rawFinance) {
        const parsed = JSON.parse(rawFinance)
        if (parsed && typeof parsed === 'object') setFinanceConfirmed(parsed)
      }
    } catch (e) {
      console.warn('Unable to load CPA overrides', e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CPA_STORAGE_KEY, JSON.stringify(cpaOverrides))
      localStorage.setItem(FINANCE_CONFIRMED_KEY, JSON.stringify(financeConfirmed))
    } catch (e) {
      console.warn('Unable to persist CPA overrides', e)
    }
  }, [cpaOverrides, financeConfirmed])

  const toggleFinanceConfirmed = (affiliateId) => {
    setFinanceConfirmed((prev) => ({ ...prev, [affiliateId]: !prev[affiliateId] }))
  }

  return (
    <div className="w-full space-y-4">
      <div style={{ position: 'sticky', top: 0, zIndex: 40, paddingTop: 4, marginTop: -4, background: 'linear-gradient(180deg, rgba(9,16,28,0.96), rgba(9,16,28,0.85))', backdropFilter: 'blur(8px)' }}>
        <CardSection
          title="Affiliate Payments – Affiliate Payout Ledger"
          subtitle="End-of-month affiliate costs based on Qualified FTD, CPA and ROI."
          actions={(
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
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Month</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ ...selectStyle, minWidth: 160 }}
              >
                <option value="all">All months</option>
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 999, fontSize: 12, color: '#cbd5e1' }}>
              {ledger.ledger.length} monthly rows
            </span>
            </FilterBar>
          )}
        />
      </div>

      {loading ? (
        <div className="card card-global" style={{ padding: 16 }}>Loading data…</div>
      ) : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <KpiCard label="Total QFTD" value={formatNumberShort(ledger.totals.totalQftd)} helper={formatNumberFull(ledger.totals.totalQftd)} />
            <KpiCard label="Avg CPA" value={formatEuro(ledger.totals.avgCpa)} helper={formatEuroFull(ledger.totals.avgCpa)} />
            <KpiCard label="Total commissions" value={formatEuro(ledger.totals.totalCommission)} helper={formatEuroFull(ledger.totals.totalCommission)} />
            <KpiCard label="Commission payable" value={formatEuro(ledger.totals.totalMarketingPayable)} helper={formatEuroFull(ledger.totals.totalMarketingPayable)} tone="#22c55e" />
            <KpiCard label="Commissions deferred" value={formatEuro(ledger.totals.totalMarketingDeferred)} helper={formatEuroFull(ledger.totals.totalMarketingDeferred)} tone="#f97316" />
            <KpiCard label="ROI" value={formatNumber(ledger.totals.totalRoi, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} helper={formatNumber(ledger.totals.totalRoi, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} />
            <KpiCard label="Paid" value={formatEuro(ledger.totals.totalPaid)} helper={formatEuroFull(ledger.totals.totalPaid)} tone="#38bdf8" />
          </div>

          <div className="card card-global" style={{ minWidth: 320 }}>
            <h3 style={{ marginBottom: 8 }}>Payout timeline</h3>
            <div style={{ height: 260 }}>
              <PnLTrendChart
                labels={ledger.timelineSeries.map((m) => m.label)}
                series={[
                  { label: 'Paid', data: ledger.timelineSeries.map((m) => m.paid), color: '#f97316' },
                ]}
                formatValue={formatNumberShort}
              />
            </div>
          </div>

          <div className="card card-global">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h3 style={{ marginBottom: 0, flex: 1 }}>Affiliate payout summary</h3>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...selectStyle, minWidth: 200, background: 'rgba(255,255,255,0.04)' }}
                placeholder="Search affiliate"
                aria-label="Search affiliate"
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Affiliate</th>
                    <th style={{ textAlign: 'right' }}>CPA</th>
                    <th style={{ textAlign: 'right' }}>Total QFTD</th>
                    <th style={{ textAlign: 'right' }} title="Paid amounts within current filters">Paid (filtered)</th>
                    <th style={{ textAlign: 'right' }}>PL</th>
                    <th style={{ textAlign: 'right' }}>Current month comm.</th>
                    <th style={{ textAlign: 'center' }}>Finance confirmed</th>
                    <th style={{ textAlign: 'left' }}>Last month</th>
                    <th style={{ textAlign: 'left' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 600 }}>
                    <td>Totals (filters)</td>
                    <td style={{ textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(ledger.totals.totalQftd)}>{formatNumberShort(ledger.totals.totalQftd)}</td>
                    <td style={{ textAlign: 'right', color: '#38bdf8' }} className="num" title={formatEuroFull(ledger.totals.totalPaid)}>{formatEuro(ledger.totals.totalPaid)}</td>
                    <td style={{ textAlign: 'right', color: ledger.totals.totalPl >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatEuroFull(ledger.totals.totalPl)}>{formatEuro(ledger.totals.totalPl)}</td>
                    <td style={{ textAlign: 'right', color: '#f97316' }} className="num" title={formatEuroFull(ledger.totals.totalCurrentMonthCommission)}>{formatEuro(ledger.totals.totalCurrentMonthCommission)}</td>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>—</td>
                    <td>—</td>
                    <td></td>
                  </tr>
                  {(showAllAffiliates ? ledger.affiliateSummaries : ledger.affiliateSummaries.slice(0, 10)).map((a) => (
                    <React.Fragment key={a.affiliateId}>
                      <tr>
                        <td>{a.affiliateName}</td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            min={0}
                            value={cpaOverrides[a.affiliateId] ?? ''}
                            onChange={(e) => setAffiliateCpa(a.affiliateId, e.target.value)}
                            placeholder={`${formatEuroFull(DEFAULT_NEGOTIATED_CPA)}`}
                            style={{ width: 90, background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 6px' }}
                            title="Override CPA for this affiliate"
                          />
                        </td>
                        <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(a.totalQftd)}>{formatNumberShort(a.totalQftd)}</td>
                        <td style={{ textAlign: 'right', color: '#38bdf8' }} className="num" title={formatEuroFull(a.totalPaid)}>{formatEuro(a.totalPaid)}</td>
                        <td style={{ textAlign: 'right', color: a.totalPl >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatEuroFull(a.totalPl)}>{formatEuro(a.totalPl)}</td>
                        <td style={{ textAlign: 'right', color: '#f97316' }} className="num" title={formatEuroFull(a.currentMonthCommission)}>{formatEuro(a.currentMonthCommission)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={!!financeConfirmed[a.affiliateId]}
                            onChange={() => toggleFinanceConfirmed(a.affiliateId)}
                            title="Mark as confirmed by finance"
                          />
                        </td>
                        <td>{a.lastMonth ? monthLabel(a.lastMonth) : '—'}</td>
                        <td>
                          <button className="btn" onClick={() => toggleExpand(a.affiliateId)}>
                            {expanded === a.affiliateId ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {expanded === a.affiliateId && (
                        <tr>
                          <td colSpan={8}>
                            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                              <table className="table" style={{ width: '100%' }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left' }}>Month</th>
                                    <th style={{ textAlign: 'right' }}>Reg</th>
                                    <th style={{ textAlign: 'right' }}>FTD</th>
                                    <th style={{ textAlign: 'right' }}>QFTD</th>
                                    <th style={{ textAlign: 'right' }}>Net Deposits</th>
                                    <th style={{ textAlign: 'right' }}>Commissions</th>
                                    <th style={{ textAlign: 'right' }}>PL</th>
                                    <th style={{ textAlign: 'right' }} title="ROI = Net Deposits / Commission">ROI</th>
                                    <th style={{ textAlign: 'right' }}>CPA</th>
                                    <th style={{ textAlign: 'right' }} title="Expected = commission from Media Report">Comm expected</th>
                                    <th style={{ textAlign: 'right' }} title="Actual uses ROI guardrail: if ROI >= 1.5 use expected, else Net Deposits / 1.5">Comm actual</th>
                                    <th style={{ textAlign: 'right' }} title="Payable = min(expected, actual)">Comm payable</th>
                                    <th style={{ textAlign: 'right' }} title="Deferred = expected − payable">Comm deferred</th>
                                    <th style={{ textAlign: 'right' }}>Paid</th>
                                    <th style={{ textAlign: 'left' }}>Payment date</th>
                                    <th style={{ textAlign: 'left' }}>Details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ledger.ledger
                                    .filter((r) => r.affiliateId === a.affiliateId)
                                    .sort((x, y) => (y.year - x.year) || (y.monthIndex - x.monthIndex))
                                    .map((r) => (
                                      <tr key={`${r.month}-${r.affiliateId}`}>
                                        <td>{monthLabel(r.month)}</td>
                                        <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(r.registrations)}>{formatNumberShort(r.registrations)}</td>
                                        <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(r.ftd)}>{formatNumberShort(r.ftd)}</td>
                                        <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(r.qftd)}>{formatNumberShort(r.qftd)}</td>
                                        <td style={{ textAlign: 'right', color: '#38bdf8' }} className="num" title={formatEuroFull(r.netDeposits)}>{formatEuro(r.netDeposits)}</td>
                                        <td style={{ textAlign: 'right' }} className="num" title={formatEuroFull(r.commissionTotal)}>{formatEuro(r.commissionTotal)}</td>
                                        <td style={{ textAlign: 'right', color: r.pl >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatEuroFull(r.pl)}>{formatEuro(r.pl)}</td>
                                        <td style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }} className="num" title={formatNumber(r.roi, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}>
                                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.roi >= 1.5 ? '#22c55e' : '#ef4444' }} />
                                          {formatNumber(r.roi, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ textAlign: 'right' }} className="num" title={formatEuroFull(r.negotiatedCpa)}>{formatEuro(r.negotiatedCpa)}</td>
                                        <td style={{ textAlign: 'right' }} className="num" title={formatEuroFull(r.marketingExpected)}>{formatEuro(r.marketingExpected)}</td>
                                        <td style={{ textAlign: 'right' }} className="num" title={formatEuroFull(r.marketingActual)}>{formatEuro(r.marketingActual)}</td>
                                        <td style={{ textAlign: 'right', color: '#22c55e' }} className="num" title={formatEuroFull(r.marketingPayable)}>{formatEuro(r.marketingPayable)}</td>
                                        <td style={{ textAlign: 'right', color: '#f97316' }} className="num" title={formatEuroFull(r.marketingDeferred)}>{formatEuro(r.marketingDeferred)}</td>
                                        <td style={{ textAlign: 'right', color: '#38bdf8' }} className="num" title={formatEuroFull(r.paidAmount)}>{formatEuro(r.paidAmount)}</td>
                                        <td>{r.paymentDate || '—'}</td>
                                        <td title={r.details?.length ? r.details.join(' | ') : '—'}>
                                          {r.details?.length ? r.details.join(' • ') : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  {!ledger.ledger.some((r) => r.affiliateId === a.affiliateId) && (
                                    <tr><td colSpan={16} style={{ textAlign: 'center', color: '#94a3b8' }}>No monthly rows.</td></tr>
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
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>No affiliates for current filters.</td></tr>
                  )}
                </tbody>
              </table>
              {ledger.affiliateSummaries.length > 10 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <button
                    className="btn"
                    onClick={() => setShowAllAffiliates((prev) => !prev)}
                    style={{ padding: '8px 14px' }}
                  >
                    {showAllAffiliates ? 'Show top 10' : `Show all (${ledger.affiliateSummaries.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
