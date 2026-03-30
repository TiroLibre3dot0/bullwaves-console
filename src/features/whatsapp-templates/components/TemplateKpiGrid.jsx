import { formatPercent } from '../utils/whatsappTemplateMetrics'

export default function TemplateKpiGrid({ template, capabilities }) {
  const stats = template?.stats || {}
  const conversionAvailable = capabilities?.conversionMetrics !== false
  const replyLatencyAvailable = capabilities?.replyLatency !== false
  const kpis = [
    { label: 'Sent', value: stats.sent ?? 0 },
    { label: 'Delivered', value: stats.delivered ?? 0 },
    { label: 'Read', value: stats.read ?? 0 },
    { label: 'Replies', value: stats.replies ?? 0 },
    { label: 'Reply Rate', value: formatPercent(stats.replyRate), highlight: true },
    { label: 'Conversions', value: conversionAvailable ? (stats.conversions ?? 0) : 'N/A' },
    {
      label: 'Conversion Rate',
      value: conversionAvailable ? formatPercent(stats.conversionRate) : 'N/A',
      highlight: true,
    },
    { label: 'Avg. Time to Reply', value: replyLatencyAvailable ? (stats.avgReplyTime || 'N/A') : 'N/A' },
  ]

  return (
    <section className="grid grid-cols-2 gap-2">
      {kpis.map((kpi) => (
        <article
          key={kpi.label}
          className={`rounded-lg border p-3 ${
            kpi.highlight
              ? 'border-sky-400/30 bg-linear-to-br from-sky-500/10 to-slate-900/90'
              : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{kpi.label}</p>
          <p className="mt-1 text-base font-semibold text-slate-100">{kpi.value}</p>
        </article>
      ))}
    </section>
  )
}
