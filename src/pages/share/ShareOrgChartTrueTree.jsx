import React from 'react'

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
  operations: 'bg-slate-300/50',
  revenue: 'bg-indigo-300/45',
  trading: 'bg-amber-300/40',
  corporate: 'bg-emerald-300/40',
}

const BORDERS = {
  operations: 'border-slate-300/20',
  revenue: 'border-indigo-300/20',
  trading: 'border-amber-300/18',
  corporate: 'border-emerald-300/18',
}

// Structure-only view. HR-owned role assignment.
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
          icon: 'operations',
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
          icon: 'revenue',
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
          icon: 'trading',
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
          icon: 'corporate',
          children: [
            { id: 'accounting', label: 'Accounting', type: 'function' },
            { id: 'compliance-legal', label: 'Compliance & Legal', type: 'function' },
            { id: 'hr-recruiting', label: 'HR & Recruiting', type: 'function' },
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
              {/* Founders line label (indicator only) */}
              <div className="flex justify-center md:hidden">
                <div className="px-3 py-1 rounded-full border border-slate-600/30 bg-slate-950/70 text-[11px] text-slate-300">
                  {governance?.label || 'Founders'}
                </div>
              </div>

              {/* Horizontal spine (desktop+) with inline label */}
              <div className="hidden md:block">
                <div className="relative w-full">
                  <HLine className="w-full" />
                  <div className="absolute left-0 -top-3 px-3 py-1 rounded-full border border-slate-600/30 bg-slate-950/70 text-[11px] text-slate-300">
                    {governance?.label || 'Founders'}
                  </div>
                </div>
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

                {/* desktop layout */}
                <div className="hidden lg:block">
                  <HLine className="w-full" />
                  <div className="grid grid-cols-4 gap-6">
                    {macroAreas.map((a) => (
                      <div key={`macro-stub-${a.id}`} className="flex justify-center">
                        <VLine h={18} />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-6 mt-3" style={{ alignItems: 'start' }}>
                    <MacroAreaColumn area={ops} />
                    <MacroAreaColumn area={revenue} />
                    <MacroAreaColumn area={trading} />
                    <MacroAreaColumn area={corporate} />
                  </div>

                  {/* Operations as Servant Organization (Agile Model) — enablement line (NOT reporting) */}
                  <div className="mt-8 grid grid-cols-4 gap-6 items-center">
                    <div />
                    <div className="col-span-3">
                      <div className="relative w-full">
                        <div className="border-t border-dashed border-slate-500/35" />
                        <div className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 py-1 rounded-full border border-slate-600/30 bg-slate-950/70 text-[11px] text-slate-300">
                          Operations as a Servant Organization (Agile Model)
                        </div>
                      </div>
                    </div>
                  </div>
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

function MacroIcon({ kind, className = '' }) {
  // Monochrome, outline/stroke-based icons (enterprise SaaS style)
  const common = {
    className: `h-4 w-4 ${className}`,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  if (kind === 'operations') {
    return (
      <svg {...common}>
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M16.24 16.24l2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M4.93 19.07l2.83-2.83" />
        <path d="M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  if (kind === 'revenue') {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15l4-4 3 3 5-6" />
        <path d="M20 8v6h-6" />
      </svg>
    )
  }

  if (kind === 'trading') {
    return (
      <svg {...common}>
        <path d="M7 20V10" />
        <path d="M12 20V4" />
        <path d="M17 20v-7" />
        <path d="M5 10h4" />
        <path d="M10 4h4" />
        <path d="M15 13h4" />
      </svg>
    )
  }

  // corporate
  return (
    <svg {...common}>
      <path d="M3 21h18" />
      <path d="M5 21V8l7-4 7 4v13" />
      <path d="M9 21v-8h6v8" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
    </svg>
  )
}

function MacroAreaColumn({ area }) {
  if (!area) return null
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

  const iconTone =
    area.id === 'operations'
      ? 'text-slate-200/70'
      : area.id === 'revenue'
        ? 'text-indigo-200/70'
        : area.id === 'trading-risk'
          ? 'text-amber-200/70'
          : 'text-emerald-200/70'

  return (
    <div className="flex flex-col min-w-0">
      <Card
        title={
          <div className="flex items-center gap-2">
            <span className={iconTone} aria-hidden="true">
              <MacroIcon kind={area.icon} />
            </span>
            <span>{area.label}</span>
          </div>
        }
        lines={getNodeLines(area)}
        accentDotClass={accent}
        size="md"
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
