import React from 'react'

function Card({ title, lines = [], accentDotClass = 'bg-slate-400/60', size = 'md', extra }) {
  const isSm = size === 'sm'
  return (
    <div
      className={
        `relative bg-slate-900/35 border border-slate-800/80 ring-1 ring-slate-800/30 rounded-2xl shadow-sm backdrop-blur-md ` +
        (isSm ? 'px-4 py-3' : 'px-5 py-4')
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
          ' whitespace-normal break-words leading-snug'
        }
      >
        {title}
      </div>
      {lines.length ? (
        <div className={isSm ? 'mt-1 space-y-0.5' : 'mt-2 space-y-1'}>
          {lines.map((l) => (
            <div
              key={`${title}-${l}`}
              className={
                (isSm ? 'text-xs text-slate-300' : 'text-sm text-slate-300') +
                ' whitespace-normal break-words leading-snug'
              }
            >
              {l}
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

function SubCard({ title, lines = [], borderClass = 'border-slate-800/70' }) {
  const filtered = (lines || []).filter(Boolean)
  return (
    <div
      className={`bg-slate-900/20 border ${borderClass} rounded-xl px-3 py-2 whitespace-normal break-words`}
    >
      <div className="text-xs text-slate-200 font-semibold leading-snug">{title}</div>
      {filtered.length ? (
        <div className="mt-1 space-y-0.5">
          {filtered.map((l) => (
            <div key={`${title}-${l}`} className="text-[11px] text-slate-400 leading-snug">
              {l}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const ACCENTS = {
  root: 'bg-slate-400/60',
  governance: 'bg-slate-400/60',
  operations: 'bg-cyan-400/60',
  revenue: 'bg-fuchsia-400/60',
  trading: 'bg-amber-400/60',
  corporate: 'bg-sky-400/60',
}

const BORDERS = {
  operations: 'border-cyan-400/18',
  revenue: 'border-fuchsia-400/18',
  trading: 'border-amber-400/18',
  corporate: 'border-sky-400/18',
}

// HR can insert names at data level without changing layout.
const ORG_TREE = {
  id: 'bullwaves-group',
  label: 'Bullwaves Group',
  children: [
    {
      id: 'governance',
      label: 'Founders (4 seats)',
      type: 'governance',
      children: [
        { id: 'founder-1', label: 'Founder', type: 'seat' },
        { id: 'founder-2', label: 'Founder', type: 'seat' },
        { id: 'founder-3', label: 'Founder', type: 'seat' },
        { id: 'founder-4', label: 'Founder', type: 'seat' },
      ],
    },
    {
      id: 'macro-areas',
      label: 'Macro Areas',
      type: 'macro-group',
      children: [
        {
          id: 'operations',
          label: 'Operations',
          type: 'macro',
          central: true,
          supports: ['Revenue', 'Trading & Risk', 'Corporate'],
          children: [
            { id: 'business-ops', label: 'Business Operations', type: 'function' },
            { id: 'marketing-ops', label: 'Marketing Operations', type: 'function' },
            { id: 'tech-ops', label: 'Tech Operations', type: 'function' },
            { id: 'customer-support', label: 'Customer Support', type: 'function' },
            { id: 'payments', label: 'Payments', type: 'function' },
            { id: 'reporting', label: 'Reporting', type: 'function' },
            { id: 'platforms-tools', label: 'Platforms & Tools', type: 'function' },
          ],
        },
        {
          id: 'revenue',
          label: 'Revenue',
          type: 'macro',
          supportedBy: 'Operations',
          children: [
            { id: 'sales', label: 'Sales', type: 'function' },
            { id: 'retention', label: 'Retention', type: 'function' },
            { id: 'affiliates-ib', label: 'Affiliates & IB', type: 'function' },
            { id: 'partners', label: 'Partners', type: 'function' },
            { id: 'performance', label: 'Performance Channels', type: 'function' },
            { id: 'mena', label: 'MENA', type: 'function' },
          ],
        },
        {
          id: 'trading-risk',
          label: 'Trading & Risk',
          type: 'macro',
          supportedBy: 'Operations',
          children: [
            { id: 'dealing', label: 'Dealing', type: 'function' },
            { id: 'prop', label: 'Prop Trading', type: 'function' },
            { id: 'risk', label: 'Risk Management', type: 'function' },
            { id: 'mt5', label: 'MT5 Administration', type: 'function' },
          ],
        },
        {
          id: 'corporate',
          label: 'Corporate',
          type: 'macro',
          supportedBy: 'Operations',
          children: [
            { id: 'accounting', label: 'Accounting', type: 'function' },
            { id: 'compliance-legal', label: 'Compliance & Legal', type: 'function' },
            { id: 'hr', label: 'HR', type: 'function' },
            { id: 'recruiting', label: 'Recruiting', type: 'function' },
          ],
        },
      ],
    },
  ],
}

function getNodeLines(node) {
  const lines = []
  if (node?.head) lines.push(`Area head: ${node.head}`)
  if (node?.lead) lines.push(`Function lead: ${node.lead}`)
  return lines.filter(Boolean)
}

export default function ShareOrgChartTrueTree() {
  const governance = ORG_TREE.children.find((c) => c.id === 'governance')
  const macroGroup = ORG_TREE.children.find((c) => c.id === 'macro-areas')
  const macroAreas = (macroGroup?.children || []).slice(0, 4)

  const ops = macroAreas.find((a) => a.id === 'operations')
  const revenue = macroAreas.find((a) => a.id === 'revenue')
  const trading = macroAreas.find((a) => a.id === 'trading-risk')
  const corporate = macroAreas.find((a) => a.id === 'corporate')

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      {/* Fixed logo top-left */}
      <a href="/" className="fixed left-5 top-5 z-20" aria-label="Bullwaves">
        <img src="/Logo.png" alt="Bullwaves" className="h-7 w-auto opacity-95" />
      </a>

      <div className="mx-auto max-w-[90rem] px-4 md:px-6 pt-10 pb-6">
        <header className="flex flex-col items-center text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Company Organizational Chart
          </h1>
          <p className="mt-2 text-sm text-slate-400">Structure-only (board-level)</p>
        </header>

        <main className="mt-12" aria-label="Organizational tree">
          <div className="flex flex-col items-center">
            {/* ROOT */}
            <div className="w-full max-w-md">
              <Card title={ORG_TREE.label} lines={[]} accentDotClass={ACCENTS.root} size="md" />
            </div>

            <div className="flex justify-center">
              <VLine h={36} className="bg-slate-500/40" />
            </div>

            {/* LEVEL 1 — GOVERNANCE */}
            <div className="w-full max-w-6xl">
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <Card
                    title={governance?.label || 'Governance'}
                    lines={[]}
                    accentDotClass={ACCENTS.governance}
                    size="sm"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <VLine h={18} className="bg-slate-500/35" />
              </div>

              {/* Horizontal spine (desktop+) */}
              <div className="hidden md:block">
                <HLine className="w-full" />
                <div className="grid grid-cols-4 gap-6">
                  {(governance?.children || []).map((seat) => (
                    <div key={`seat-stub-${seat.id}`} className="flex justify-center">
                      <VLine h={18} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-3">
                {(governance?.children || []).map((seat) => (
                  <div key={seat.id} className="min-w-0">
                    <Card
                      title={seat.label}
                      lines={getNodeLines(seat)}
                      accentDotClass={ACCENTS.governance}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <VLine h={40} className="bg-slate-500/40" />
            </div>

            {/* LEVEL 2 — MACRO AREAS (ONLY 4) */}
            <div className="w-full max-w-[90rem]">
              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                }}
              >
                {/* mobile layout */}
                <div className="grid grid-cols-1 gap-6 lg:hidden">
                  {macroAreas.map((area) => (
                    <MacroAreaColumn key={area.id} area={area} />
                  ))}
                </div>

                {/* desktop layout (Operations wider) */}
                <div
                  className="hidden lg:grid gap-6"
                  style={{
                    gridTemplateColumns: '1.35fr 1fr 1fr 1fr',
                    alignItems: 'start',
                  }}
                >
                  <MacroAreaColumn area={ops} />
                  <MacroAreaColumn area={revenue} />
                  <MacroAreaColumn area={trading} />
                  <MacroAreaColumn area={corporate} />
                </div>
              </div>

              {/* Visual relationships (NOT reporting): Operations supports other areas */}
              <div className="mt-6 flex flex-col items-center">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">
                  Support (non-reporting)
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <SupportPill from="Operations" to="Revenue" />
                  <SupportPill from="Operations" to="Trading & Risk" />
                  <SupportPill from="Operations" to="Corporate" />
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-12 flex justify-center">
          <div className="text-xs text-slate-400 border border-slate-800/80 bg-slate-900/35 rounded-full px-4 py-2">
            Public view: structure only · No people / no personal roles
          </div>
        </footer>
      </div>
    </div>
  )
}

function SupportPill({ from, to }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-900/25 px-3 py-1 text-[11px] text-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300/60" aria-hidden="true" />
      <span
        className="leading-none"
        style={{ borderBottom: '1px dotted rgba(148, 163, 184, 0.6)' }}
      >
        {from} supports {to}
      </span>
    </div>
  )
}

function MacroAreaColumn({ area }) {
  if (!area) return null
  const isOps = area.id === 'operations'
  const accent =
    area.id === 'operations'
      ? ACCENTS.operations
      : area.id === 'revenue'
        ? ACCENTS.revenue
        : area.id === 'trading-risk'
          ? ACCENTS.trading
          : ACCENTS.corporate

  const border =
    area.id === 'operations'
      ? BORDERS.operations
      : area.id === 'revenue'
        ? BORDERS.revenue
        : area.id === 'trading-risk'
          ? BORDERS.trading
          : BORDERS.corporate

  const supportLine = !isOps && area.supportedBy ? `Supported by ${area.supportedBy}` : null

  const extra = supportLine ? (
    <div className="text-[11px] text-slate-300">
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-900/20 px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300/50" aria-hidden="true" />
        <span style={{ borderBottom: '1px dotted rgba(148, 163, 184, 0.6)' }}>{supportLine}</span>
      </span>
    </div>
  ) : null

  return (
    <div className="flex flex-col min-w-0">
      <Card
        title={area.label}
        lines={getNodeLines(area)}
        accentDotClass={accent}
        size="md"
        extra={extra}
      />

      <div className="mt-4 flex justify-center">
        <VLine h={16} className="bg-slate-500/30" />
      </div>

      <div className="relative">
        <div
          className="hidden lg:block absolute left-4 top-2 bottom-2 w-px bg-slate-500/20"
          aria-hidden="true"
        />
        <div className="grid grid-cols-1 gap-3 pl-8">
          {(area.children || []).map((fn) => (
            <div key={fn.id} className="relative">
              <div
                className="hidden lg:block absolute -left-4 top-3 w-4 h-px bg-slate-500/25"
                aria-hidden="true"
              />
              <SubCard title={fn.label} lines={getNodeLines(fn)} borderClass={border} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
