import React, { useMemo } from 'react'
import CardSection from '../../../components/common/CardSection'
import KpiCard from '../../../components/common/KpiCard'
import { formatEuro, formatPercent } from '../../../lib/formatters'
import { buildInsightTextBlocks } from '../utils/buildWeeklyAffiliateReport'

const SectionCard = ({ title, bullets }) => (
  <div className="card card-global" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: '#e2e8f0' }}>{title}</div>
    <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {bullets.map((line, idx) => (
        <li key={idx} style={{ color: '#cbd5e1', lineHeight: 1.4, fontSize: 12 }}>{line}</li>
      ))}
    </ul>
  </div>
)

const profitTrendFromSeries = (series = []) => {
  if (!series || series.length < 2) return null
  const sorted = [...series].sort((a, b) => (a.monthIndex ?? 0) - (b.monthIndex ?? 0))
  const current = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  const delta = (current?.value || 0) - (prev?.value || 0)
  const pct = (prev?.value || 0) ? (delta / Math.max(Math.abs(prev.value), 1)) * 100 : 0
  return { delta, pct }
}

export default function AnalysisEngine({ affiliateName, periodLabel = 'This period', kpis }) {
  const hasData = Boolean(kpis)

  const insightBlocks = useMemo(
    () => buildInsightTextBlocks(kpis || {}, { affiliateName, periodLabel }),
    [affiliateName, kpis, periodLabel],
  )

  if (!hasData) {
    return (
      <CardSection title="Analysis Engine — Automated Insights" subtitle="Deterministic insights built from KPIs">
        <div className="card card-global" style={{ padding: 14, color: '#94a3b8' }}>
          Select an affiliate and date window to generate insights.
        </div>
      </CardSection>
    )
  }

  const sections = [
    { key: 'downsideBias', title: '📉 Risk Signals', bullets: insightBlocks.downsideBias },
    { key: 'upsidePotential', title: '🎯 Upside Opportunities', bullets: insightBlocks.upsidePotential },
    { key: 'outlook', title: '🧭 Current Outlook', bullets: insightBlocks.outlook },
  ]

  const profitTrend = profitTrendFromSeries(kpis?.monthlyProfit)
  const profitTrendLabel = profitTrend ? `${formatEuro(profitTrend.delta)} (${formatPercent(profitTrend.pct || 0, 1)})` : 'N/A'
  const profitTrendSubtitle = `Current vs previous month: ${kpis?.currentPeriodLabel || periodLabel} vs ${kpis?.previousPeriodLabel || 'previous month'}`

  const cohortValue = kpis?.cohortHasData
    ? (kpis?.cohortBreakEvenPeriods !== null
      ? `${(kpis?.cohortBreakEvenPeriods || 0).toFixed(1)} months`
      : kpis?.cohortBreakEvenLabel || 'Not reached')
    : 'Cohort not available'
  const cohortHelper = kpis?.cohortHasData
    ? 'Average time to reach net profit (Top 10 Cohort PL)'
    : 'Top 10 Cohort PL report has no data for this affiliate'

  return (
    <CardSection
      title={`Affiliate Performance Outlook — ${affiliateName || 'this affiliate'}`}
      subtitle={`Signals for ${kpis?.periodMeta?.displayLabel || kpis?.periodSpanLabel || periodLabel}`}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 10 }}>
        <KpiCard label="Period Profit" value={formatEuro(kpis?.totalProfit || 0)} helper={kpis?.periodSpanLabel || periodLabel} tone={(kpis?.totalProfit || 0) >= 0 ? '#34d399' : '#ef4444'} />
        <KpiCard label="ROI" value={formatPercent(kpis?.roi || 0, 1)} helper="Profit / payments" tone={(kpis?.roi || 0) >= 0 ? '#34d399' : '#ef4444'} />
        <KpiCard label="Profit trend (latest month)" value={profitTrendLabel} helper={profitTrendSubtitle} />
        <KpiCard label="Cohort Break Even" value={cohortValue} helper={cohortHelper} tone={kpis?.cohortHasData ? undefined : '#94a3b8'} />
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Performance Recap</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
        {(insightBlocks.performanceRecap || []).map((section) => (
          <SectionCard key={section.title} title={section.title} bullets={section.bullets} />
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Narrative Signals</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {sections.map((section) => (
          <SectionCard key={section.key} title={section.title} bullets={section.bullets} />
        ))}
      </div>

      {affiliateName && (insightBlocks?.recommendedActions || []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Recommended Actions</div>
          <SectionCard title="Next Steps" bullets={insightBlocks.recommendedActions} />
        </div>
      )}

      <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
        ROI {formatPercent(kpis?.roi || 0)} · CPA {formatEuro(Math.round(kpis?.cpa || 0))} · ARPU {formatEuro(Math.round(kpis?.arpu || 0))}
      </div>
    </CardSection>
  )
}
