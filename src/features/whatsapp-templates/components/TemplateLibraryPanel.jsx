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
    <section className="space-y-3 rounded-2xl border border-gray-600 bg-linear-to-br from-gray-700/95 via-gray-700/80 to-gray-900/90 p-4 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-300">
          Template Library
        </h2>
        <span className="rounded-full border border-gray-600 bg-gray-700/70 px-2.5 py-1 text-xs text-gray-400">
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
