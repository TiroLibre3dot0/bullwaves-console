function renderMessageWithTokens(message) {
  const parts = String(message || '').split(/(\[[^\]]+\])/g)
  return parts.map((part, index) => {
    if (/^\[[^\]]+\]$/.test(part)) {
      return (
        <span
          key={`${part}-${index}`}
          className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-200"
        >
          {part}
        </span>
      )
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}

export default function TemplatePreviewCard({ template }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold text-slate-200">Template message preview</h3>
      <div className="mt-3 rounded-2xl border border-slate-700 bg-linear-to-b from-slate-950 to-slate-900 p-3">
        <div className="mx-auto max-w-xl rounded-[1.25rem] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm leading-relaxed text-slate-100 shadow-lg shadow-emerald-500/10">
          {renderMessageWithTokens(template.message)}
        </div>
      </div>
    </section>
  )
}
