import EmptyTemplateState from './EmptyTemplateState'
import TemplateAudienceInsights from './TemplateAudienceInsights'
import TemplateComparisonCard from './TemplateComparisonCard'
import TemplateKpiGrid from './TemplateKpiGrid'
import TemplatePerformanceChart from './TemplatePerformanceChart'
import TemplatePerformanceFunnel from './TemplatePerformanceFunnel'
import TemplateRecommendationsCard from './TemplateRecommendationsCard'
import { buildRecommendations } from '../utils/whatsappTemplateMetrics'

export default function TemplateStatsPanel({
  template,
  allTemplates,
  overview,
  capabilities,
  compareTemplateId,
  onCompareTemplate,
  trendPeriod,
  onTrendPeriod,
}) {
  if (!template) {
    return (
      <EmptyTemplateState
        title="Select a template to preview its content and performance"
        subtitle="Performance insights, funnel and comparisons will appear here."
      />
    )
  }

  const recommendations = buildRecommendations(template, overview)

  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900/95 via-slate-900/85 to-slate-950/90 p-4 shadow-2xl shadow-black/20">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Performance & statistics</h2>
            <p className="text-xs text-slate-400">Executive view for template decision-making</p>
          </div>
          <div className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
            Template Score {template.templateScore}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-500/8 p-3 text-xs text-amber-100">
        KPIs shown here are based on Convrs callbacks and tracked mids. Public Convrs API does not expose historical
        template analytics, audience breakdowns or previous-period trend series.
      </div>

      <TemplateKpiGrid template={template} capabilities={capabilities} />

      <div className="flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={() => onTrendPeriod('last7Days')}
          className={`rounded-full border px-2.5 py-1 ${
            trendPeriod === 'last7Days'
              ? 'border-sky-400/40 bg-sky-500/10 text-sky-200'
              : 'border-slate-700 text-slate-300'
          }`}
        >
          Last 7 days
        </button>
        <button
          type="button"
          onClick={() => onTrendPeriod('last30Days')}
          className={`rounded-full border px-2.5 py-1 ${
            trendPeriod === 'last30Days'
              ? 'border-sky-400/40 bg-sky-500/10 text-sky-200'
              : 'border-slate-700 text-slate-300'
          }`}
        >
          Last 30 days
        </button>
      </div>

      <TemplatePerformanceChart
        trend={template.stats.trend}
        period={trendPeriod}
        unavailableReason={
          capabilities?.trendSeries === false
            ? 'Convrs does not expose historical trend series for previously sent templates.'
            : null
        }
      />
      <TemplatePerformanceFunnel stats={template.stats} />
      <TemplateAudienceInsights
        stats={template.stats}
        available={capabilities?.audienceInsights !== false}
      />
      <TemplateComparisonCard
        selectedTemplate={template}
        allTemplates={allTemplates}
        overview={overview}
        previousPeriodAvailable={capabilities?.previousPeriodComparison !== false}
        compareTemplateId={compareTemplateId}
        onCompareTemplate={onCompareTemplate}
      />
      <TemplateRecommendationsCard recommendations={recommendations} />
    </section>
  )
}
