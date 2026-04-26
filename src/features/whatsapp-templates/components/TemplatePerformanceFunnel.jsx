export default function TemplatePerformanceFunnel({ stats }) {
  const rows = [
    { label: 'Sent', value: Number(stats?.sent || 0) },
    { label: 'Delivered', value: Number(stats?.delivered || 0) },
    { label: 'Read', value: Number(stats?.read || 0) },
    { label: 'Replied', value: Number(stats?.replies || 0) },
    { label: 'Converted', value: Number(stats?.conversions || 0) },
  ]

  const max = Math.max(...rows.map((row) => row.value), 1)

  return (
    <section className="rounded-xl border border-gray-600 bg-gray-700/70 p-4">
      <h3 className="text-sm font-semibold text-gray-200">Funnel</h3>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-linear-to-r from-cyan-500/80 to-sky-400/80"
                style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
