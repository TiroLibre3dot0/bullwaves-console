import EmptyTemplateState from './EmptyTemplateState'
import TemplatePreviewCard from './TemplatePreviewCard'
import TemplateUsageStrategyCard from './TemplateUsageStrategyCard'
import TemplateVariablesCard from './TemplateVariablesCard'
import TemplateVariantsCard from './TemplateVariantsCard'
import { formatDate } from '../utils/whatsappTemplateMetrics'

const ACTIONS = ['Edit Template', 'Duplicate', 'Archive', 'Send Test', 'Mark as Favorite']

export default function TemplateDetailPanel({ template }) {
  if (!template) {
    return <EmptyTemplateState />
  }

  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900/95 via-slate-900/85 to-slate-950/90 p-4 shadow-2xl shadow-black/20">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{template.name}</h2>
            <p className="mt-1 text-xs text-slate-400">Created by {template.createdBy}</p>
          </div>
          <div className="rounded-full border border-sky-400/35 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
            {template.category}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-slate-200">
            Status: {template.status}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-slate-200">
            Tone: {template.tone}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-slate-300">
            Updated: {formatDate(template.updatedAt)}
          </span>
        </div>
      </div>

      <TemplatePreviewCard template={template} />
      <TemplateVariablesCard variables={template.variables} />
      <TemplateUsageStrategyCard template={template} />

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Actions</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-400/50 hover:text-sky-200"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <TemplateVariantsCard variants={template.variants} />
    </section>
  )
}
