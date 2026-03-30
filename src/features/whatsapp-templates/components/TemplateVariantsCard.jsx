export default function TemplateVariantsCard({ variants = [] }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">A/B variations</h3>
        <span className="text-xs text-slate-400">Future test-ready</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {variants.map((variant) => (
          <article key={variant.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-300">{variant.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{variant.message}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
