export default function TemplatePerformanceChart({ trend, period = 'last7Days', unavailableReason = '' }) {
  const points = trend?.[period] || []

  if (!points.length) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Performance trend</h3>
        <p className="mt-3 text-sm text-slate-400">{unavailableReason || 'No trend data available.'}</p>
      </section>
    )
  }

  const max = Math.max(...points.map((item) => item.replyRate), 1)

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Performance trend chart</h3>
        <span className="text-xs text-slate-400">{period === 'last7Days' ? 'Last 7 days' : 'Last 30 days'}</span>
      </div>
      <div className="mt-4 flex h-36 items-end gap-1">
        {points.map((item) => (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-sm"
              style={{
                height: `${Math.max(4, (item.replyRate / max) * 100)}%`,
                background: 'linear-gradient(to top, rgba(2,132,199,0.68), rgba(34,211,238,0.72))',
              }}
            />
            <span className="text-[10px] text-slate-500">{item.day}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
