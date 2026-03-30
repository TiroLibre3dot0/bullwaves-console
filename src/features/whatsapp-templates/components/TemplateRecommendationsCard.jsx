export default function TemplateRecommendationsCard({ recommendations = [] }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-linear-to-br from-slate-900/80 via-slate-900/70 to-indigo-950/20 p-4">
      <h3 className="text-sm font-semibold text-slate-200">Recommendations</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        {recommendations.map((item, index) => (
          <li key={`${item}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
