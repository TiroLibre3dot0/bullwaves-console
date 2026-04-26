import { formatPercent, getDelta } from '../utils/whatsappTemplateMetrics'

export default function TemplateComparisonCard({
  selectedTemplate,
  allTemplates,
  overview,
  previousPeriodAvailable = true,
  compareTemplateId,
  onCompareTemplate,
}) {
  const avgReply = Number(overview?.averageReplyRate || 0)
  const avgConversion = Number(overview?.avgConversionRate || 0)

  const selected = selectedTemplate?.stats || {}
  const vsAverageReply = getDelta(selected.replyRate, avgReply)
  const vsAverageConversion = getDelta(selected.conversionRate, avgConversion)
  const vsPrevReply = getDelta(selected.replyRate, selected.previousPeriodReplyRate)
  const vsPrevConversion = getDelta(selected.conversionRate, selected.previousPeriodConversionRate)

  const compareTemplate = allTemplates.find((item) => item.id === compareTemplateId)

  const winner = !compareTemplate
    ? 'Select a second template'
    : Number(selectedTemplate?.templateScore || 0) >= Number(compareTemplate?.templateScore || 0)
      ? selectedTemplate.name
      : compareTemplate.name

  return (
    <section className="space-y-3 rounded-xl border border-gray-600 bg-gray-700/70 p-4">
      <h3 className="text-sm font-semibold text-gray-200">Comparison block</h3>

      <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-gray-600 bg-gray-900/60 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Vs average template</p>
          <p className="mt-1 text-gray-200">
            Reply rate:{' '}
            <span className={vsAverageReply.positive ? 'text-emerald-300' : 'text-rose-300'}>
              {vsAverageReply.label}
            </span>
          </p>
          <p className="mt-1 text-gray-200">
            Conversion:{' '}
            <span className={vsAverageConversion.positive ? 'text-emerald-300' : 'text-rose-300'}>
              {vsAverageConversion.label}
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-gray-600 bg-gray-900/60 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Vs previous period</p>
          {previousPeriodAvailable ? (
            <>
              <p className="mt-1 text-gray-200">
                Reply rate:{' '}
                <span className={vsPrevReply.positive ? 'text-emerald-300' : 'text-rose-300'}>
                  {vsPrevReply.label}
                </span>
              </p>
              <p className="mt-1 text-gray-200">
                Conversion:{' '}
                <span className={vsPrevConversion.positive ? 'text-emerald-300' : 'text-rose-300'}>
                  {vsPrevConversion.label}
                </span>
              </p>
            </>
          ) : (
            <p className="mt-1 text-gray-400">
              Previous-period comparison is not available from Convrs public API.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-900/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Quick compare mode</p>
          <select
            value={compareTemplateId}
            onChange={(event) => onCompareTemplate(event.target.value)}
            className="rounded-lg border border-gray-600 bg-gray-900 px-2 py-1.5 text-xs text-gray-200"
          >
            <option value="">Select template</option>
            {allTemplates
              .filter((item) => item.id !== selectedTemplate?.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </div>

        {compareTemplate ? (
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
            <div className="rounded-lg border border-gray-600 bg-gray-700/70 p-2.5">
              <p className="font-semibold text-gray-200">{selectedTemplate.name}</p>
              <p className="mt-1 text-gray-400">Reply: {formatPercent(selected.replyRate)}</p>
              <p className="text-gray-400">Conversion: {formatPercent(selected.conversionRate)}</p>
              <p className="text-gray-400">Sent: {selected.sent}</p>
            </div>
            <div className="rounded-lg border border-gray-600 bg-gray-700/70 p-2.5">
              <p className="font-semibold text-gray-200">{compareTemplate.name}</p>
              <p className="mt-1 text-gray-400">
                Reply: {formatPercent(compareTemplate.stats.replyRate)}
              </p>
              <p className="text-gray-400">
                Conversion: {formatPercent(compareTemplate.stats.conversionRate)}
              </p>
              <p className="text-gray-400">Sent: {compareTemplate.stats.sent}</p>
            </div>
          </div>
        ) : null}

        <p className="mt-3 rounded-lg border border-gray-600 bg-gray-700/70 px-3 py-2 text-xs font-semibold text-sky-200">
          Recommended winner: {winner}
        </p>
      </div>
    </section>
  )
}
