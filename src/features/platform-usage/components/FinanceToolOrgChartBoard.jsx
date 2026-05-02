import React, { useMemo } from 'react'

function Card({ title, lines = [], accentDotClass = 'bg-slate-400/60', size = 'md', extra }) {
  const isSm = size === 'sm'

  return (
    <div
      className={
        `relative bg-slate-900/35 border border-slate-800/80 ring-1 ring-slate-800/30 rounded-2xl shadow-sm backdrop-blur-md ` +
        (isSm ? 'px-4 py-3 min-h-[60px]' : 'px-5 py-4 min-h-[84px]')
      }
    >
      <span
        className={`absolute -top-1.5 right-4 h-2.5 w-2.5 rounded-full ${accentDotClass}`}
        aria-hidden="true"
      />
      <div
        className={
          (isSm
            ? 'text-sm font-semibold text-slate-100'
            : 'text-base font-semibold text-slate-100') +
          ' min-w-0 whitespace-normal break-normal leading-snug tracking-tight'
        }
        title={typeof title === 'string' ? title : undefined}
      >
        {title}
      </div>
      {lines.length ? (
        <div className={isSm ? 'mt-1 space-y-0.5' : 'mt-2 space-y-1'}>
          {lines.map((line, index) => (
            <div
              key={`${index}-${typeof line === 'string' ? line : String(line?.text || '')}`}
              className={
                (isSm ? 'text-xs text-slate-300' : 'text-sm text-slate-300') +
                ' min-w-0 whitespace-normal break-normal leading-snug'
              }
              title={typeof line === 'object' && line ? line.title : undefined}
            >
              {typeof line === 'string' ? line : line.text}
            </div>
          ))}
        </div>
      ) : null}
      {extra ? <div className={isSm ? 'mt-2' : 'mt-3'}>{extra}</div> : null}
    </div>
  )
}

function VLine({ h, className = '' }) {
  return (
    <div className={`w-px bg-slate-500/35 ${className}`} style={{ height: h }} aria-hidden="true" />
  )
}

function HLine({ className = '' }) {
  return <div className={`h-px bg-slate-500/35 ${className}`} aria-hidden="true" />
}

function CollapsePill({ label }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700/60 bg-slate-950/30 px-2 py-0.5 text-[10px] text-slate-400">
      {label}
    </span>
  )
}

function ToolChip({ title, lines = [], accentDotClass, exploded = false }) {
  return (
    <div className="bg-slate-900/20 border border-slate-800/70 rounded-xl px-3 py-2 whitespace-normal">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs text-slate-200 font-semibold leading-snug">{title}</div>
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${accentDotClass}`}
          aria-hidden="true"
        />
      </div>

      {exploded && lines.length ? (
        <div className="mt-1.5 space-y-0.5">
          {lines.map((line, index) => (
            <div
              key={`${title}-${index}-${typeof line === 'string' ? line : String(line?.text || '')}`}
              className="text-[11px] text-slate-400 leading-snug"
              title={typeof line === 'object' && line ? line.title : undefined}
            >
              {typeof line === 'string' ? line : line.text}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function GroupCluster({ cluster, accent, exploded }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
          {cluster.label}
        </div>
        <CollapsePill label={exploded ? 'Expanded' : 'Collapse'} />
      </div>

      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
        {cluster.tools.map((tool) => (
          <ToolChip
            key={tool.id}
            title={tool.label}
            lines={tool.lines}
            accentDotClass={accent.dot}
            exploded={exploded}
          />
        ))}
      </div>
    </div>
  )
}

function MacroAreaCard({ area, accent, exploded }) {
  return (
    <section
      className="bg-slate-900/35 border border-slate-800/80 ring-1 ring-slate-800/30 rounded-2xl shadow-sm backdrop-blur-md overflow-hidden"
      aria-labelledby={`finance-area-${area.id}`}
      data-macro-area-id={area.id}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div id={`finance-area-${area.id}`} className="text-base font-semibold text-slate-100">
              {area.label}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              {area.description}
            </div>
          </div>
          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${accent.dot}`} aria-hidden="true" />
        </div>

        <div className="mt-4">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-slate-950/30 ${accent.pillBorder} text-slate-100`}
          >
            {area.summary}
          </span>
        </div>

        <div className="mt-4 space-y-4 border-t border-slate-800/70 pt-4">
          {area.clusters.map((cluster) => (
            <GroupCluster
              key={`${area.id}-${cluster.id}`}
              cluster={cluster}
              accent={accent}
              exploded={exploded}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function formatMoneyCurrency(value, currency) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '?'

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: String(currency || 'USD').toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${String(currency || '').toUpperCase()} ${amount.toFixed(0)}`.trim()
  }
}

function formatCurrencyBreakdown(currencyTotals) {
  const entries = Object.entries(currencyTotals || {}).filter(([, amount]) =>
    Number.isFinite(Number(amount))
  )

  if (!entries.length) return '?'

  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => formatMoneyCurrency(amount, currency))
    .join(' + ')
}

function buildToolLines(tool, t) {
  const lines = []

  if (tool?.functionLabel) {
    lines.push(
      `${t('platformUsageBilling.operational.tool.function') || 'Function'}: ${tool.functionLabel}`
    )
  }

  lines.push(
    `${t('platformUsageBilling.operational.summary.knownTotal') || 'Known total'}: ${
      tool?.invoiceFound
        ? tool.costLabel || formatMoneyCurrency(tool.monthlyCost, tool.currency)
        : '?'
    }`
  )

  lines.push(
    tool?.invoiceFound
      ? `${t('platformUsageBilling.operational.tool.invoiceFound') || 'Invoice found'}: ${tool.invoiceCoverageLabel || tool.invoiceMonthLabel || tool.invoiceMeta?.invoiceNo || 'Mapped'}`
      : t('platformUsageBilling.operational.tool.invoicePending') || 'Invoice mapping pending'
  )

  const sourceLabel = tool?.invoiceMeta?.invoiceNo
    ? `Invoice ${tool.invoiceMeta.invoiceNo}`
    : String(tool?.invoiceProviderKey || tool?.id || '')
        .replace(/-/g, ' ')
        .toUpperCase()

  lines.push(`${t('platformUsageBilling.operational.tool.source') || 'Source'}: ${sourceLabel}`)

  return lines
}

function splitIntoClusters(tools) {
  if (!tools.length) return []
  if (tools.length <= 2) return [{ id: 'cluster-1', label: 'Tools', tools }]

  const midpoint = Math.ceil(tools.length / 2)
  return [
    { id: 'cluster-1', label: 'Cluster 1', tools: tools.slice(0, midpoint) },
    { id: 'cluster-2', label: 'Cluster 2', tools: tools.slice(midpoint) },
  ]
}

function buildMacroAreas(groups, t) {
  return (groups || []).map((group) => {
    const tools = (group.tools || []).map((tool) => ({
      id: tool.id,
      label: tool.label,
      lines: buildToolLines(tool, t),
    }))

    return {
      id: group.id,
      label: group.label,
      description: group.description,
      summary: `${group.toolCount} ${t('platformUsageBilling.operational.group.tools') || 'tools'} · ${formatCurrencyBreakdown(group.currencyTotals)}`,
      clusters: splitIntoClusters(tools),
    }
  })
}

const ACCENTS = [
  { dot: 'bg-cyan-400/60', pillBorder: 'border-cyan-400/20' },
  { dot: 'bg-fuchsia-400/60', pillBorder: 'border-fuchsia-400/20' },
  { dot: 'bg-amber-400/60', pillBorder: 'border-amber-400/20' },
  { dot: 'bg-emerald-400/60', pillBorder: 'border-emerald-400/20' },
  { dot: 'bg-sky-400/60', pillBorder: 'border-sky-400/20' },
]

export default function FinanceToolOrgChartBoard({ groups, t, mode = 'overview', onModeChange }) {
  const macroAreas = useMemo(() => buildMacroAreas(groups, t), [groups, t])
  const exploded = mode === 'details'

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 rounded-3xl overflow-hidden">
      <div className="mx-auto max-w-[140rem] px-3 sm:px-4 md:px-6 2xl:px-10 pt-10 pb-6">
        <header className="flex flex-col items-center text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {t('platformUsageBilling.operational.financeTitle') || 'Finance Tool Organigram'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">Board-level view</p>

          <div className="mt-5 inline-flex rounded-full border border-slate-700/50 bg-slate-950/40 p-1">
            <button
              type="button"
              onClick={() => onModeChange?.('overview')}
              className={
                'px-4 py-1.5 text-xs font-semibold rounded-full transition ' +
                (mode === 'overview'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-300 hover:text-white')
              }
              aria-pressed={mode === 'overview'}
            >
              {t('platformUsageBilling.operational.view.overview') || 'All tools'}
            </button>
            <button
              type="button"
              onClick={() => onModeChange?.('details')}
              className={
                'px-4 py-1.5 text-xs font-semibold rounded-full transition ' +
                (mode === 'details'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-300 hover:text-white')
              }
              aria-pressed={mode === 'details'}
            >
              {t('platformUsageBilling.operational.view.details') || 'Exploded specs'}
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {exploded
              ? t('platformUsageBilling.operational.board.explodedHint') ||
                'All tools with full specs inside the same structure'
              : t('platformUsageBilling.operational.board.structureHint') ||
                'All tools in structure-only board view'}
          </p>
        </header>

        <main className="mt-12" aria-label="Finance organizational tree">
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 px-6 py-4 backdrop-blur-md">
                <img src="/Logo.png" alt="Bullwaves" className="h-10 w-auto opacity-95" />
              </div>
            </div>

            <div className="flex justify-center">
              <VLine h={36} className="bg-slate-500/40" />
            </div>

            <div className="w-full max-w-xl">
              <div className="flex justify-center">
                <Card
                  title={t('platformUsageBilling.operational.financeEyebrow') || 'Finance'}
                  lines={[
                    t('platformUsageBilling.operational.financeNodeSubtitle') ||
                      'Tool cost governance, invoice visibility, and operational cost control.',
                  ]}
                  accentDotClass="bg-emerald-400/60"
                  size="md"
                />
              </div>
            </div>

            <div className="hidden lg:flex justify-center mt-6">
              <VLine h={26} />
            </div>

            <div className="w-full mt-6 lg:mt-0">
              <div className="hidden lg:block">
                <HLine className="w-full" />
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(macroAreas.length, 1)}, minmax(0, 1fr))`,
                  }}
                >
                  {macroAreas.map((area) => (
                    <div key={`stub-${area.id}`} className="flex justify-center">
                      <VLine h={18} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4 mt-3">
                {macroAreas.map((area, index) => (
                  <MacroAreaCard
                    key={area.id}
                    area={area}
                    accent={ACCENTS[index % ACCENTS.length]}
                    exploded={exploded}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-12 flex justify-center">
          <div className="text-xs text-slate-400 border border-slate-800/80 bg-slate-900/35 rounded-full px-4 py-2">
            {exploded
              ? t('platformUsageBilling.operational.board.footerDetails') ||
                'Public view: expanded tool specs'
              : t('platformUsageBilling.operational.board.footerOverview') ||
                'Public view: structure only'}
          </div>
        </footer>
      </div>
    </div>
  )
}
