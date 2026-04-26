export default function TemplateRecommendationsCard({ recommendations = [] }) {
  return (
    <section className="rounded-xl border border-gray-600 bg-linear-to-br from-gray-700/80 via-gray-700/70 to-indigo-950/20 p-4">
      <h3 className="text-sm font-semibold text-gray-200">Recommendations</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-200">
        {recommendations.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="rounded-lg border border-gray-600 bg-gray-900/60 p-2.5"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
