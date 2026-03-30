const selectClassName =
  'w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-sky-400/50'

export default function TemplateFilters({
  value,
  options,
  onChange,
  onClear,
  disabledClear = false,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/65 p-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-slate-400">Search</label>
        <input
          value={value.search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder="Search by name, snippet or message"
          className={selectClassName}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-slate-400">Category</label>
          <select
            value={value.category}
            onChange={(event) => onChange('category', event.target.value)}
            className={selectClassName}
          >
            {options.categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-slate-400">Status</label>
          <select
            value={value.status}
            onChange={(event) => onChange('status', event.target.value)}
            className={selectClassName}
          >
            {options.statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-slate-400">Tone</label>
          <select
            value={value.tone}
            onChange={(event) => onChange('tone', event.target.value)}
            className={selectClassName}
          >
            {options.tones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.08em] text-slate-400">Sort</label>
          <select
            value={value.sortBy}
            onChange={(event) => onChange('sortBy', event.target.value)}
            className={selectClassName}
          >
            {options.sortOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        disabled={disabledClear}
        className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-400/50 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Clear Filters
      </button>
    </div>
  )
}
