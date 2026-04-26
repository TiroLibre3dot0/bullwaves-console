import TemplateListItem from './TemplateListItem'

export default function TemplateList({ templates, selectedTemplateId, onSelect, onClearFilters }) {
  if (!templates.length) {
    return (
      <div className="rounded-xl border border-gray-600 bg-gray-700/70 p-6 text-center">
        <p className="text-sm font-semibold text-gray-200">No templates match your filters</p>
        <p className="mt-1 text-xs text-gray-400">
          Adjust search criteria or clear filters to restore the full library.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/20"
        >
          Clear Filters
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <TemplateListItem
          key={template.id}
          template={template}
          selected={template.id === selectedTemplateId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
