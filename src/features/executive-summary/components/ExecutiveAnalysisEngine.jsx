import React, { useMemo } from 'react'
import { formatEuroFull, formatPercent, formatPercentRounded } from '../../../lib/formatters'

// Simple heuristic-based executive recap (no external calls)
export default function ExecutiveAnalysisEngine({ kpis, periodLabel }) {
  const safeKpis = kpis || {}
  const roi = Number(safeKpis.avgROI || 0)
  const margin = Number(safeKpis.marginPct || 0)
  const profit = Number(safeKpis.profit || 0)
  const netDeposits = Number(safeKpis.netDeposits || 0)
  const payments = Number(safeKpis.totalPayments || 0)
  const conversion = Number(safeKpis.conversionRate || 0)
  const volatility = Number(safeKpis.volatility || 0)
  const recentTrend = Number(safeKpis.recentTrend || 0)
  const bestMonth = safeKpis.bestMonth
  const worstMonth = safeKpis.worstMonth

  const recap = useMemo(() => {
    const items = []
    if (profit > 0) items.push(`Profit positivo (${formatEuroFull(profit)}) su ${formatEuroFull(netDeposits)} net dep.`)
    if (roi > 20) items.push(`ROI forte (${formatPercentRounded(roi)}) sul periodo.`)
    if (margin > 10) items.push(`Margine solido (${formatPercentRounded(margin)}) rispetto alla base selezionata.`)
    if (items.length === 0) items.push('Performance stabile, nessun segnale forte positivo o negativo.')
    return items
  }, [profit, netDeposits, roi, margin])

  const risks = useMemo(() => {
    const items = []
    if (profit <= 0) items.push('Profit negativo o nullo: priorità su efficienza costi e payout.')
    if (roi < 5) items.push('ROI basso: rivalutare fonti traffico / payout.')
    if (margin < 5) items.push('Margine stretto: attenzione a churn e escalation pagamenti.')
    if (volatility > Math.abs(profit) * 0.5) items.push('Alta volatilità mese su mese: rendimenti poco stabili.')
    if (items.length === 0) items.push('Rischi contenuti; monitorare comunque payout e churn.')
    return items
  }, [profit, roi, margin, volatility])

  const opportunities = useMemo(() => {
    const items = []
    if (recentTrend > 0) items.push('Trend recente in miglioramento: ampliare sui canali che performano.')
    if (conversion > 15) items.push(`Buona conversion (${formatPercentRounded(conversion)}): scalare creatività vincenti.`)
    if (bestMonth) items.push(`Mese migliore: ${bestMonth.monthLabel || 'n/d'} con profit ${formatEuroFull(bestMonth.profit || 0)}.`)
    if (items.length === 0) items.push('Opportunità: testare nuove offerte o geo dove il ROI è sopra la media.')
    return items
  }, [recentTrend, conversion, bestMonth])

  const outlook = useMemo(() => {
    const items = []
    if (profit > 0 && recentTrend >= 0) items.push('Prospettiva positiva: mantenere mix attuale e ottimizzare payout.')
    else if (profit > 0) items.push('Prospettiva cauta: profit ok ma trend in calo, ribilancia investimenti.')
    else items.push('Serve inversione: concentrare budget su canali con ROI positivo e tagliare sprechi.')
    if (worstMonth) items.push(`Mese critico: ${worstMonth.monthLabel || 'n/d'} (profit ${formatEuroFull(worstMonth.profit || 0)}).`)
    if (payments > 0) items.push(`Payout totale ${formatEuroFull(payments)}: negoziare laddove ROI < target.`)
    return items
  }, [profit, recentTrend, payments, worstMonth])

  const cards = [
    { title: 'Performance recap', items: recap },
    { title: 'Risk & stability', items: risks },
    { title: 'Upside opportunities', items: opportunities },
    { title: 'Current outlook / Next steps', items: outlook },
  ]

  return (
    <div className="card card-global" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>Executive Analysis</h3>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>{periodLabel}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {cards.map((card) => (
          <div key={card.title} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.02)' }}>
            <h4 style={{ margin: 0, marginBottom: 8 }}>{card.title}</h4>
            <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5e1', fontSize: 13, lineHeight: 1.45 }}>
              {card.items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
