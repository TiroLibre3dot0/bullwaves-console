import React, { useMemo, useState } from 'react'
import PnLTrendChart from '../../../components/PnLTrendChart'
import CardSection from '../../../components/common/CardSection'
import FilterBar from '../../../components/common/FilterBar'
import KpiCard from '../../../components/common/KpiCard'
import { formatEuro, formatEuroFull, formatNumber, formatNumberShort, formatPercentRounded } from '../../../lib/formatters'
import { usePaymentsReport } from '../../media-payments/hooks/useMediaPaymentsData'

const formatNumberFull = (value) => formatNumber(value)
const selectStyle = { minWidth: 160, background: '#0d1a2c', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }

export default function InvestmentsDashboard() {
  const { data: rows, loading } = usePaymentsReport()
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedAffiliate, setSelectedAffiliate] = useState('all')

  const monthOptions = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => map.set(r.monthKey, r.monthLabel))
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [rows])

  const affiliateOptions = useMemo(() => {
    const set = new Set()
    rows.forEach((r) => set.add(r.affiliate))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filteredRows = useMemo(() => rows.filter((r) => {
    const matchMonth = selectedMonth === 'all' ? true : r.monthKey === selectedMonth
    const matchAff = selectedAffiliate === 'all' ? true : r.affiliate === selectedAffiliate
    return matchMonth && matchAff
  }), [rows, selectedMonth, selectedAffiliate])

  const totals = useMemo(() => {
    const totalAmount = filteredRows.reduce((acc, r) => acc + (r.amount || 0), 0)
    return { totalAmount, count: filteredRows.length }
  }, [filteredRows])

  const monthlyAggregates = useMemo(() => {
    const map = new Map()
    filteredRows.forEach((r) => {
      const acc = map.get(r.monthKey) || { monthKey: r.monthKey, monthLabel: r.monthLabel, total: 0, count: 0 }
      acc.total += r.amount || 0
      acc.count += 1
      map.set(r.monthKey, acc)
    })
    return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }, [filteredRows])

  const topAffiliates = useMemo(() => {
    const grandTotal = filteredRows.reduce((acc, r) => acc + (r.amount || 0), 0) || 0
    const map = new Map()
    filteredRows.forEach((r) => {
      const key = r.affiliateId || r.affiliate
      const acc = map.get(key) || { affiliate: r.affiliate, affiliateId: r.affiliateId || '—', total: 0, count: 0 }
      acc.total += r.amount || 0
      acc.count += 1
      map.set(key, acc)
    })
    return Array.from(map.values())
      .map((a) => ({ ...a, share: grandTotal ? (a.total / grandTotal) * 100 : 0 }))
      .sort((a, b) => (b.total || 0) - (a.total || 0))
      .slice(0, 15)
  }, [filteredRows])

  const payoutSchema = useMemo(() => {
    const map = new Map()
    filteredRows.forEach((r) => {
      const key = r.type || 'Other'
      const acc = map.get(key) || { type: key, total: 0, count: 0 }
      acc.total += r.amount || 0
      acc.count += 1
      map.set(key, acc)
    })
    const list = Array.from(map.values()).sort((a, b) => (b.total || 0) - (a.total || 0))
    const grandTotal = list.reduce((s, x) => s + (x.total || 0), 0)
    return list.map((x) => ({ ...x, share: grandTotal ? (x.total / grandTotal) * 100 : 0 })).slice(0, 6)
  }, [filteredRows])

  const payoutSchemaTotals = useMemo(() => payoutSchema.reduce(
    (acc, item) => ({ total: acc.total + (item.total || 0), count: acc.count + (item.count || 0), share: acc.share + (item.share || 0) }),
    { total: 0, count: 0, share: 0 }
  ), [payoutSchema])

  const trendLabels = monthlyAggregates.map((m) => m.monthLabel)
  const trendValues = monthlyAggregates.map((m) => m.total)

  const topAffiliate = useMemo(() => (topAffiliates.length ? topAffiliates[0] : null), [topAffiliates])
  const topPayout = useMemo(() => (payoutSchema.length ? payoutSchema[0] : null), [payoutSchema])

  return (
    <div className="w-full space-y-4">
      <CardSection
        title="Investments / Marketing"
        subtitle="Commissioni da commissions.csv filtrabili per mese e affiliato."
        actions={(
          <FilterBar>
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
            <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: 999, fontSize: 12, color: '#cbd5e1' }}>
              {filteredRows.length} righe
            </span>
          </FilterBar>
        )}
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 280px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-global">
            <h3 style={{ marginBottom: 8 }}>KPI marketing</h3>
            <div className="kpi-grid" style={{ gridTemplateColumns: '1fr' }}>
              <KpiCard
                label="Commissioni tot"
                value={formatEuro(totals.totalAmount)}
                helper="Somma amount (filtri applicati)"
                tone="#fbbf24"
              />
              <KpiCard
                label="Transazioni"
                value={formatNumberShort(totals.count)}
                helper={formatNumberFull(totals.count)}
              />
              <KpiCard
                label="Avg ticket"
                value={formatEuro(totals.count ? totals.totalAmount / totals.count : 0)}
                helper={formatEuroFull(totals.count ? totals.totalAmount / totals.count : 0)}
              />
              <KpiCard
                label="Top affiliate"
                value={topAffiliate ? topAffiliate.affiliate : '—'}
                helper={topAffiliate ? formatEuroFull(topAffiliate.total) : '—'}
                tone="#f97316"
              />
              <KpiCard
                label="Top payout"
                value={topPayout ? `${topPayout.type} (${formatPercentRounded(topPayout.share)})` : '—'}
                helper={topPayout ? formatEuroFull(topPayout.total) : undefined}
                tone="#34d399"
              />
              <KpiCard
                label="Mesi coperti"
                value={monthOptions.length}
                helper="Mesi unici nei filtri"
                tone="#a855f7"
              />
            </div>
          </div>

          <div className="card card-global">
            <h3 style={{ marginBottom: 8 }}>Schema payout (top 6)</h3>
            <div style={{ overflowX: 'visible' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th style={{ minWidth: 0, maxWidth: 240 }}>Tipo</th>
                    <th style={{ textAlign: 'right' }}>Totale</th>
                    <th style={{ textAlign: 'right' }}>Count</th>
                    <th style={{ textAlign: 'right' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutSchema.map((t, idx) => {
                    const shareRounded = formatPercentRounded(t.share)
                    const lower = t.type.toLowerCase()
                    const displayLabel = lower.includes('cpa')
                      ? `CPA ${idx + 1}`
                      : lower.includes('rev')
                        ? 'RS'
                        : t.type
                    return (
                      <tr key={t.type}>
                        <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                        <td
                          style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25, maxWidth: 240 }}
                          title={t.type}
                        >
                          {displayLabel}
                        </td>
                        <td style={{ textAlign: 'right', color: '#fbbf24' }} className="num" title={formatEuroFull(t.total)}>{formatEuro(t.total)}</td>
                        <td style={{ textAlign: 'right' }} className="num" title={`${t.count} transazioni`}>{formatNumberShort(t.count)}</td>
                        <td style={{ textAlign: 'right', color: '#34d399' }} className="num">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                            <div style={{ position: 'relative', width: 72, height: 8, background: 'rgba(52,211,153,0.12)', borderRadius: 999 }}>
                              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, Math.max(0, t.share))}%`, background: '#34d399', borderRadius: 999 }} />
                            </div>
                            <span>{shareRounded}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!payoutSchema.length && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>Nessun dato.</td></tr>
                  )}
                  {payoutSchema.length > 0 && (
                    <tr style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                      <td></td>
                      <td style={{ fontWeight: 600 }}>Totale (top 6)</td>
                      <td style={{ textAlign: 'right', color: '#fbbf24' }} className="num" title={formatEuroFull(payoutSchemaTotals.total)}>{formatEuro(payoutSchemaTotals.total)}</td>
                      <td style={{ textAlign: 'right' }} className="num" title={`${payoutSchemaTotals.count} transazioni`}>{formatNumberShort(payoutSchemaTotals.count)}</td>
                      <td style={{ textAlign: 'right', color: '#34d399' }} className="num">{formatPercentRounded(payoutSchemaTotals.share)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 420px', minWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-global">
            <h3 style={{ marginBottom: 8 }}>Aggregati mensili</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mese</th>
                    <th style={{ textAlign: 'right' }}>Totale</th>
                    <th style={{ textAlign: 'right' }}>Count</th>
                    <th style={{ textAlign: 'right' }}>Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyAggregates.map((m) => (
                    <tr key={m.monthKey}>
                      <td>{m.monthLabel}</td>
                      <td style={{ textAlign: 'right', color: '#fbbf24' }} className="num" title={formatEuroFull(m.total)}>{formatEuro(m.total)}</td>
                      <td style={{ textAlign: 'right' }} className="num">{formatNumberShort(m.count)}</td>
                      <td style={{ textAlign: 'right' }} className="num" title={formatEuroFull(m.count ? m.total / m.count : 0)}>{formatEuro(m.count ? m.total / m.count : 0)}</td>
                    </tr>
                  ))}
                  {!monthlyAggregates.length && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Nessun dato per i filtri.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ flex: '0 0 360px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-global">
            <h3 style={{ marginBottom: 8 }}>Andamento commissioni</h3>
            <div style={{ height: 220 }}>
              <PnLTrendChart dataPoints={trendValues} labels={trendLabels} />
            </div>
          </div>

          <div className="card card-global">
            <h3 style={{ marginBottom: 8 }}>Top affiliates per spesa</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Affiliate</th>
                    <th style={{ textAlign: 'right' }}>Totale</th>
                    <th style={{ textAlign: 'right' }}>Peso %</th>
                  </tr>
                </thead>
                <tbody>
                  {topAffiliates.map((a, idx) => (
                    <tr key={`${a.affiliate}-${idx}`}>
                      <td>{a.affiliate}</td>
                      <td style={{ textAlign: 'right', color: '#fbbf24' }} className="num" title={formatEuroFull(a.total)}>{formatEuro(a.total)}</td>
                      <td style={{ textAlign: 'right', color: '#34d399' }} className="num">{`${a.share.toFixed(1)}%`}</td>
                    </tr>
                  ))}
                  {!topAffiliates.length && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8' }}>Nessun dato per i filtri.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="card card-global" style={{ textAlign: 'center', color: '#94a3b8' }}>Caricamento dati…</div>
      )}
    </div>
  )
}
