import React, { useMemo, useState } from 'react'
import PnLTrendChart from '../../../components/PnLTrendChart'
import CardSection from '../../../components/common/CardSection'
import FilterBar from '../../../components/common/FilterBar'
import KpiCard from '../../../components/common/KpiCard'
import YearSelector from '../../../components/common/YearSelector'
import { formatEuro, formatEuroFull, formatNumber, formatNumberShort, formatPercent } from '../../../lib/formatters'
import { useMediaPaymentsData } from '../../media-payments/hooks/useMediaPaymentsData'
import { useAffiliateLedger } from '../../media-payments/hooks/useAffiliateLedger'
import { exportToCsv } from '../../media-payments/utils/exportCsv'

const selectStyle = { minWidth: 180, background: '#0d1a2c', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }
const formatNumberFull = (value) => formatNumber(value)

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
  const [expanded, setExpanded] = useState(null)

  const ledger = useAffiliateLedger({ mediaRows, payments, selectedYear, selectedMonth, search })

  const availableYears = useMemo(() => {
    const set = new Set()
    mediaRows.forEach((m) => Number.isFinite(Number(m.year)) && set.add(Number(m.year)))
    payments.forEach((p) => Number.isFinite(Number(p.year)) && set.add(Number(p.year)))
    return Array.from(set).sort((a, b) => a - b)
  }, [mediaRows, payments])

  const monthOptions = useMemo(() => {
    if (selectedYear === 'all') return []
    const set = new Set()
    mediaRows.forEach((m) => Number(m.year) === Number(selectedYear) && set.add(m.monthIndex))
    payments.forEach((p) => Number(p.year) === Number(selectedYear) && set.add(p.monthIndex))
    return Array.from(set).sort((a, b) => a - b).map((idx) => ({ value: idx, label: monthLabel(`${selectedYear}-${String(Number(idx) + 1).padStart(2, '0')}`) }))
  }, [mediaRows, payments, selectedYear])

  const toggleExpand = (aff) => setExpanded((prev) => (prev === aff ? null : aff))

  const handleExport = () => {
    exportToCsv({
      filename: 'finance-report.csv',
      headers: [
        'Month',
        'Affiliate name',
        'Registrations',
        'FTD',
        'QFTD',
        'Net Deposits',
        'ROI',
        'Negotiated CPA',
        'CPA theoretical',
        'CPA payable',
        'CPA deferred',
        'Paid amount',
        'Payment date',
        'Status',
      ],
      rows: ledger.ledger.map((r) => ([
        monthLabel(r.month),
        r.affiliateName,
        r.registrations,
        r.ftd,
        r.qftd,
        r.netDeposits,
        r.roi,
        r.negotiatedCpa,
        r.cpaTheoretical,
        r.cpaPayable,
        r.cpaDeferred,
        r.paidAmount,
        r.paymentDate || '',
        r.status,
      ])),
    })
  }

  return (
    <div className="w-full space-y-4">
      <CardSection
        title="Marketing Expenses – Affiliate Payout Ledger"
        subtitle="End-of-month affiliate costs based on Qualified FTD, CPA and ROI."
        actions={(
          <FilterBar>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Year</span>
              <YearSelector
                availableYears={availableYears}
                value={selectedYear}
                onChange={(val) => {
                  setSelectedYear(val)
                  setSelectedMonth('all')
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Month</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ ...selectStyle, minWidth: 160 }}
                disabled={selectedYear === 'all'}
              >
                <option value="all">All months</option>
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...selectStyle, minWidth: 180 }}
                placeholder="Search affiliate"
              />
            </div>
            <button className="btn" onClick={handleExport} style={{ marginLeft: 'auto' }}>
              Export Finance Report
            </button>
            <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 999, fontSize: 12, color: '#cbd5e1' }}>
              {ledger.ledger.length} monthly rows
            </span>
          </FilterBar>
        )}
      />

      {loading ? (
        <div className="card card-global" style={{ padding: 16 }}>Loading data…</div>
      ) : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <KpiCard label="Total QFTD" value={formatNumberShort(ledger.totals.totalQftd)} helper={formatNumberFull(ledger.totals.totalQftd)} />
            <KpiCard label="CPA theoretical" value={formatEuro(ledger.totals.totalCpaTheoretical)} helper={formatEuroFull(ledger.totals.totalCpaTheoretical)} />
            <KpiCard label="CPA payable" value={formatEuro(ledger.totals.totalCpaPayable)} helper={formatEuroFull(ledger.totals.totalCpaPayable)} tone="#22c55e" />
            <KpiCard label="CPA deferred" value={formatEuro(ledger.totals.totalCpaDeferred)} helper={formatEuroFull(ledger.totals.totalCpaDeferred)} tone="#f97316" />
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
            <h3 style={{ marginBottom: 8 }}>Affiliate payout summary</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Affiliate</th>
                    <th style={{ textAlign: 'right' }}>Total QFTD</th>
                    <th style={{ textAlign: 'right' }}>Paid</th>
                    <th style={{ textAlign: 'right' }}>Deferred</th>
                    <th style={{ textAlign: 'left' }}>Last month</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                    <th style={{ textAlign: 'left' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.affiliateSummaries.map((a) => (
                    <React.Fragment key={a.affiliateId}>
                      <tr>
                        <td>{a.affiliateName}</td>
                        <td style={{ textAlign: 'right' }} className="num">{formatNumberShort(a.totalQftd)}</td>
                        <td style={{ textAlign: 'right' }} className="num" title={formatEuroFull(a.totalPaid)}>{formatEuro(a.totalPaid)}</td>
                        <td style={{ textAlign: 'right', color: '#f97316' }} className="num" title={formatEuroFull(a.totalDeferred)}>{formatEuro(a.totalDeferred)}</td>
                        <td>{a.lastMonth ? monthLabel(a.lastMonth) : '—'}</td>
                        <td>{a.lastStatus}</td>
                        <td>
                          <button className="btn" onClick={() => toggleExpand(a.affiliateId)}>
                            {expanded === a.affiliateId ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {expanded === a.affiliateId && (
                        <tr>
                          <td colSpan={7}>
                            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                              <table className="table" style={{ width: '100%' }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left' }}>Month</th>
                                    <th style={{ textAlign: 'right' }}>Reg</th>
                                    <th style={{ textAlign: 'right' }}>FTD</th>
                                    <th style={{ textAlign: 'right' }}>QFTD</th>
                                    <th style={{ textAlign: 'right' }}>Net Deposits</th>
                                    <th style={{ textAlign: 'right' }}>ROI</th>
                                    <th style={{ textAlign: 'right' }}>CPA</th>
                                    <th style={{ textAlign: 'right' }}>CPA theoretical</th>
                                    <th style={{ textAlign: 'right' }}>CPA payable</th>
                                    <th style={{ textAlign: 'right' }}>CPA deferred</th>
                                    <th style={{ textAlign: 'right' }}>Paid</th>
                                    <th style={{ textAlign: 'left' }}>Payment date</th>
                                    <th style={{ textAlign: 'left' }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ledger.ledger
                                    .filter((r) => r.affiliateId === a.affiliateId)
                                    .sort((x, y) => (y.year - x.year) || (y.monthIndex - x.monthIndex))
                                    .map((r) => (
                                      <tr key={`${r.month}-${r.affiliateId}`}>
                                        <td>{monthLabel(r.month)}</td>
                                        <td style={{ textAlign: 'right' }} className="num">{formatNumberShort(r.registrations)}</td>
                                        <td style={{ textAlign: 'right' }} className="num">{formatNumberShort(r.ftd)}</td>
                                        <td style={{ textAlign: 'right' }} className="num">{formatNumberShort(r.qftd)}</td>
                                        <td style={{ textAlign: 'right', color: '#38bdf8' }} className="num" title={formatEuroFull(r.netDeposits)}>{formatEuro(r.netDeposits)}</td>
                                        <td style={{ textAlign: 'right' }} className="num">{formatPercent(r.roi * 100 || r.roi, 1)}</td>
                                        <td style={{ textAlign: 'right' }} className="num" title={formatEuroFull(r.negotiatedCpa)}>{formatEuro(r.negotiatedCpa)}</td>
                                        <td style={{ textAlign: 'right' }} className="num" title={formatEuroFull(r.cpaTheoretical)}>{formatEuro(r.cpaTheoretical)}</td>
                                        <td style={{ textAlign: 'right', color: '#22c55e' }} className="num" title={formatEuroFull(r.cpaPayable)}>{formatEuro(r.cpaPayable)}</td>
                                        <td style={{ textAlign: 'right', color: '#f97316' }} className="num" title={formatEuroFull(r.cpaDeferred)}>{formatEuro(r.cpaDeferred)}</td>
                                        <td style={{ textAlign: 'right', color: '#38bdf8' }} className="num" title={formatEuroFull(r.paidAmount)}>{formatEuro(r.paidAmount)}</td>
                                        <td>{r.paymentDate || '—'}</td>
                                        <td>{r.status}</td>
                                      </tr>
                                    ))}
                                  {!ledger.ledger.some((r) => r.affiliateId === a.affiliateId) && (
                                    <tr><td colSpan={13} style={{ textAlign: 'center', color: '#94a3b8' }}>No monthly rows.</td></tr>
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
            </div>
          </div>
        </>
      )}
    </div>
  )
}
