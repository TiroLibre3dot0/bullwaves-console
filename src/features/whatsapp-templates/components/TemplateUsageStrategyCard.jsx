export default function TemplateUsageStrategyCard({ template }) {
  const rows = [
    { label: 'When to use', value: template.usageNotes },
    { label: 'Target user type', value: template.targetAudience },
    { label: 'Objective', value: template.objective },
    { label: 'Suggested follow-up timing', value: template.followUpTiming },
  ]

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold text-slate-200">Usage strategy</h3>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{row.label}</p>
            <p className="mt-1 text-sm text-slate-200">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
