import TemplateFilters from './TemplateFilters'
import TemplateList from './TemplateList'

export default function TemplateLibraryPanel({
  filters,
  options,
  templates,
  selectedTemplateId,
  onFilterChange,
  onClearFilters,
  onSelectTemplate,
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900/95 via-slate-900/80 to-slate-950/90 p-4 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">Template Library</h2>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-400">
          {templates.length} visible
        </span>
      </div>

      <TemplateFilters
        value={filters}
        options={options}
        onChange={onFilterChange}
        onClear={onClearFilters}
        disabledClear={
          filters.search === '' &&
          filters.category === 'all' &&
          filters.status === 'all' &&
          filters.tone === 'all' &&
          filters.sortBy === 'most-recent'
        }
      />

      <TemplateList
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelect={onSelectTemplate}
        onClearFilters={onClearFilters}
      />
    </section>
  )
}
