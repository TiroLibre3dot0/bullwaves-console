import React, { useMemo } from 'react'
import CardSection from '../../../components/common/CardSection'
import KpiCard from '../../../components/common/KpiCard'
import { formatEuro, formatPercent } from '../../../lib/formatters'
import { buildInsightTextBlocks } from '../utils/buildWeeklyAffiliateReport'
import { useI18n } from '../../../i18n/I18nContext'
import { loadAffiliateKpiIndex, getAffiliateKpi } from '../../../services/affiliateKpiService'

const SectionCard = ({ title, bullets }) => (
  <div
    className="card card-global"
    style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}
  >
    <div
      style={{
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        color: '#e2e8f0',
      }}
    >
      {title}
    </div>
    <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {bullets.map((line, idx) => (
        <li key={idx} style={{ color: '#cbd5e1', lineHeight: 1.4, fontSize: 12 }}>
          {line}
        </li>
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
  const pct = prev?.value || 0 ? (delta / Math.max(Math.abs(prev.value), 1)) * 100 : 0
  return { delta, pct }
}

export default function AnalysisEngine({ affiliateName, periodLabel, kpis }) {
  const { t } = useI18n()
  const hasData = Boolean(kpis)

  const resolvedPeriodLabel = periodLabel || t('affiliateAnalysis.period.thisPeriod')

  const insightBlocks = useMemo(
    () => buildInsightTextBlocks(kpis || {}, { affiliateName, periodLabel: resolvedPeriodLabel }),
    [affiliateName, kpis, resolvedPeriodLabel]
  )

  const [affiliateKpiIndex, setAffiliateKpiIndex] = React.useState(null)
  const [affiliateKpi, setAffiliateKpi] = React.useState(null)

  // Load affiliate KPI index on mount
  React.useEffect(() => {
    loadAffiliateKpiIndex()
      .then(setAffiliateKpiIndex)
      .catch(() => setAffiliateKpiIndex(null))
  }, [])

  // Update affiliate KPI for current affiliateName
  React.useEffect(() => {
    if (!affiliateKpiIndex || !affiliateName) {
      setAffiliateKpi(null)
      return
    }
    setAffiliateKpi(getAffiliateKpi(affiliateKpiIndex, affiliateName))
  }, [affiliateKpiIndex, affiliateName])

  if (!hasData) {
    return (
      <CardSection
        title={t('affiliateAnalysis.engine.empty.title')}
        subtitle={t('affiliateAnalysis.engine.empty.subtitle')}
      >
        <div className="card card-global" style={{ padding: 14, color: '#9ca3af' }}>
          {t('affiliateAnalysis.engine.empty.body')}
        </div>
      </CardSection>
    )
  }

  const sections = [
    {
      key: 'downsideBias',
      title: t('affiliateAnalysis.engine.sections.riskSignals'),
      bullets: insightBlocks.downsideBias,
    },
    {
      key: 'upsidePotential',
      title: t('affiliateAnalysis.engine.sections.upsideOpportunities'),
      bullets: insightBlocks.upsidePotential,
    },
    {
      key: 'outlook',
      title: t('affiliateAnalysis.engine.sections.currentOutlook'),
      bullets: insightBlocks.outlook,
    },
  ]

  const profitTrend = profitTrendFromSeries(kpis?.monthlyProfit)
  const profitTrendLabel = profitTrend
    ? `${formatEuro(profitTrend.delta)} (${formatPercent(profitTrend.pct || 0, 1)})`
    : t('affiliateAnalysis.common.na')
  const profitTrendSubtitle = t('affiliateAnalysis.engine.profitTrend.subtitle', {
    current: kpis?.currentPeriodLabel || resolvedPeriodLabel,
    previous: kpis?.previousPeriodLabel || t('affiliateAnalysis.period.previousMonth'),
  })

  const cohortValue = kpis?.cohortHasData
    ? kpis?.cohortBreakEvenPeriods !== null
      ? t('affiliateAnalysis.engine.cohort.monthsValue', {
          value: (kpis?.cohortBreakEvenPeriods || 0).toFixed(1),
        })
      : kpis?.cohortBreakEvenLabel || t('affiliateAnalysis.engine.cohort.notReached')
    : t('affiliateAnalysis.engine.cohort.notAvailable')
  const cohortHelper = kpis?.cohortHasData
    ? t('affiliateAnalysis.engine.cohort.helper.avgTimeToNetProfit')
    : t('affiliateAnalysis.engine.cohort.helper.noData')

  return (
    <CardSection
      title={t('affiliateAnalysis.engine.title', {
        affiliate: affiliateName || t('affiliateAnalysis.common.thisAffiliate'),
      })}
      subtitle={t('affiliateAnalysis.engine.subtitle', {
        period: kpis?.periodMeta?.displayLabel || kpis?.periodSpanLabel || resolvedPeriodLabel,
      })}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <KpiCard
          label={t('affiliateAnalysis.engine.kpi.periodProfit')}
          value={formatEuro(kpis?.totalProfit || 0)}
          helper={kpis?.periodSpanLabel || resolvedPeriodLabel}
          tone={(kpis?.totalProfit || 0) >= 0 ? '#34d399' : '#ef4444'}
        />
        <KpiCard
          label={t('affiliateAnalysis.engine.kpi.roi')}
          value={formatPercent(kpis?.roi || 0, 1)}
          helper={t('affiliateAnalysis.engine.kpiHelper.profitDivPayments')}
          tone={(kpis?.roi || 0) >= 0 ? '#34d399' : '#ef4444'}
        />
        <KpiCard
          label={t('affiliateAnalysis.engine.kpi.profitTrendLatestMonth')}
          value={profitTrendLabel}
          helper={profitTrendSubtitle}
        />
        <KpiCard
          label={t('affiliateAnalysis.engine.kpi.cohortBreakEven')}
          value={cohortValue}
          helper={cohortHelper}
          tone={kpis?.cohortHasData ? undefined : '#9ca3af'}
        />
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#cbd5e1',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {t('affiliateAnalysis.engine.headings.performanceRecap')}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {(insightBlocks.performanceRecap || []).map((section) => (
          <SectionCard key={section.title} title={section.title} bullets={section.bullets} />
        ))}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#cbd5e1',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {t('affiliateAnalysis.engine.headings.narrativeSignals')}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}
      >
        {sections.map((section) => (
          <SectionCard key={section.key} title={section.title} bullets={section.bullets} />
        ))}
      </div>

      {affiliateName && (insightBlocks?.recommendedActions || []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#cbd5e1',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}
          >
            {t('affiliateAnalysis.engine.headings.recommendedActions')}
          </div>
          <SectionCard
            title={t('affiliateAnalysis.engine.recommendedActions.nextSteps')}
            bullets={insightBlocks.recommendedActions}
          />
        </div>
      )}

      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>
        ROI {formatPercent(kpis?.roi || 0)} · CPA {formatEuro(Math.round(kpis?.cpa || 0))} · ARPU{' '}
        {formatEuro(Math.round(kpis?.arpu || 0))}
      </div>
    </CardSection>
  )
}
