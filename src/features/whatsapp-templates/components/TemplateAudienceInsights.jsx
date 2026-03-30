export default function TemplateAudienceInsights({ stats, available = true }) {
  const rows = [
    ['Best performing audience', stats?.bestAudience],
    ['Worst performing audience', stats?.worstAudience],
    ['Best sending hour', stats?.bestHour],
    ['Best sending day', stats?.bestDay],
    ['Top country', stats?.topCountry],
    ['Best account type', stats?.bestAccountType],
  ]

  if (!available) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Audience insights</h3>
        <p className="mt-3 text-sm text-slate-400">
          Audience, country and send-time breakdowns are not available through Convrs public API.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold text-slate-200">Audience insights</h3>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
            <dt className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm text-slate-200">{value || 'N/A'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
