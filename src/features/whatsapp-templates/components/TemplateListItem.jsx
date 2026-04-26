import { formatDate, formatPercent } from '../utils/whatsappTemplateMetrics'

const statusClasses = {
  active: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  draft: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  archived: 'border-slate-500/40 bg-slate-500/10 text-gray-300',
}

const performanceClasses = {
  'Best performer': 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  'Good engagement': 'text-sky-300 border-sky-400/30 bg-sky-500/10',
  'Low reply rate': 'text-rose-300 border-rose-400/30 bg-rose-500/10',
  'Needs review': 'text-amber-300 border-amber-400/30 bg-amber-500/10',
  Untested: 'text-violet-300 border-violet-400/30 bg-violet-500/10',
}

export default function TemplateListItem({ template, selected, onSelect }) {
  const score = Number(template.templateScore || 0)

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-sky-400/70 bg-linear-to-br from-gray-700/95 to-gray-700 shadow-lg shadow-sky-500/10'
          : 'border-gray-600 bg-gray-700/70 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-100">{template.name}</p>
          <p className="mt-1 text-xs text-gray-400">{template.category}</p>
        </div>
        <div className="rounded-full border border-sky-400/35 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-200">
          Score {score}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses[template.status] || statusClasses.archived}`}
        >
          {template.status}
        </span>
        <span className="rounded-full border border-slate-600 bg-gray-700/80 px-2 py-0.5 text-[11px] font-semibold text-gray-200">
          {template.tone}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-gray-300">{template.snippet}</p>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>Updated {formatDate(template.updatedAt)}</span>
        <span>{template.isFavorite ? 'Favorite' : 'Standard'}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-gray-600 bg-gray-900/60 p-2">
          <div className="text-slate-500">Reply Rate</div>
          <div className="font-semibold text-gray-200">
            {formatPercent(template.stats.replyRate)}
          </div>
        </div>
        <div className="rounded-lg border border-gray-600 bg-gray-900/60 p-2">
          <div className="text-slate-500">Conversion Rate</div>
          <div className="font-semibold text-gray-200">
            {formatPercent(template.stats.conversionRate)}
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-gray-700">
        <div
          className="h-full rounded-full bg-linear-to-r from-sky-500 to-emerald-400"
          style={{ width: `${Math.max(8, Math.min(score, 100))}%` }}
        />
      </div>

      <div
        className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${performanceClasses[template.performanceLabel] || performanceClasses['Needs review']}`}
      >
        {template.performanceLabel}
      </div>
    </button>
  )
}
