import { formatPercent } from '../utils/whatsappTemplateMetrics'

const cardTone = [
  'from-sky-500/20 to-transparent border-sky-400/30',
  'from-emerald-500/20 to-transparent border-emerald-400/30',
  'from-indigo-500/20 to-transparent border-indigo-400/30',
  'from-amber-500/20 to-transparent border-amber-400/30',
]

export default function WhatsAppTemplatesOverviewCards({ overview }) {
  const cards = [
    {
      label: 'Total Templates',
      value: overview.totalTemplates,
      helper: 'Library coverage',
    },
    {
      label: 'Active Templates',
      value: overview.activeTemplates,
      helper: 'Currently in use',
    },
    {
      label: 'Average Reply Rate',
      value: formatPercent(overview.averageReplyRate),
      helper: 'Across all templates',
    },
    {
      label: 'Best Performing Template',
      value: overview.bestPerformingTemplate,
      helper: 'Highest template score',
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, idx) => (
        <article
          key={card.label}
          className={`rounded-2xl border bg-linear-to-br ${cardTone[idx]} from-10% p-4 shadow-xl shadow-black/20`}
        >
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{card.label}</p>
          <p className="mt-2 line-clamp-2 text-lg font-semibold text-slate-100">{card.value}</p>
          <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
        </article>
      ))}
    </section>
  )
}
