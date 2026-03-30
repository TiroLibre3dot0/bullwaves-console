export default function TemplateVariablesCard({ variables }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold text-slate-200">Variables</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {variables.map((item) => (
          <span
            key={item}
            className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}
