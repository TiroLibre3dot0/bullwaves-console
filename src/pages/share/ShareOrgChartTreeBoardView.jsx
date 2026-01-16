import React, { useMemo } from 'react'

function initials(name) {
  const s = String(name || '').trim()
  if (!s) return '?'
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-sm backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  )
}

function Avatar({ name, accentClassName }) {
  return (
    <div
      aria-hidden="true"
      className={`h-9 w-9 rounded-full bg-slate-800/70 text-slate-100 flex items-center justify-center text-xs font-bold ring-1 ${accentClassName}`}
      title={name}
    >
      {initials(name)}
    </div>
  )
}

function PersonCard({ name, role, accent }) {
  return (
    <Card className="p-5 flex items-center gap-3">
      <Avatar name={name} accentClassName={accent} />
      <div className="min-w-0">
        <div className="text-xs text-slate-400">{role}</div>
        <div className="text-base font-semibold text-slate-100 truncate" title={name}>
          {name}
        </div>
      </div>
    </Card>
  )
}

function HeadsBlock({ heads = [], accent }) {
  return (
    <div className="mt-3 space-y-2">
      {heads.map((h) => (
        <div key={`${h.name}-${h.role}`} className="flex items-center gap-3">
          <Avatar name={h.name} accentClassName={accent.ring} />
          <div className="min-w-0">
            <div className="text-xs text-slate-400">{h.role}</div>
            <div className="text-sm font-semibold text-slate-100 truncate" title={h.name}>
              {h.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DomainCard({ domain, accent }) {
  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              {domain.title}
            </div>
            {domain.heads?.length ? <HeadsBlock heads={domain.heads} accent={accent} /> : null}

            {!domain.heads?.length && domain.headName ? (
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={domain.headName} accentClassName={accent.ring} />
                <div className="min-w-0">
                  <div className="text-xs text-slate-400">{domain.headRole}</div>
                  <div
                    className="text-sm font-semibold text-slate-100 truncate"
                    title={domain.headName}
                  >
                    {domain.headName}
                  </div>
                </div>
              </div>
            ) : null}

            {domain.secondaryLabel ? (
              <div className="mt-3 text-xs text-slate-300">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold bg-slate-950/30 ${accent.pillBorder} text-slate-100`}
                >
                  {domain.secondaryLabel}
                </span>
              </div>
            ) : null}
          </div>
          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${accent.dot}`} aria-hidden="true" />
        </div>

        {domain.areas?.length ? (
          <div className="mt-4 pt-4 border-t border-slate-800/70">
            <div className="space-y-1.5">
              {domain.areas.map((a) => (
                <div key={`${domain.title}-${a}`} className="text-xs text-slate-300">
                  <span className="text-slate-500 mr-2">•</span>
                  {a}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

function VLine({ h = 10, className = '' }) {
  return (
    <div className={`w-px bg-slate-500/35 ${className}`} style={{ height: h }} aria-hidden="true" />
  )
}

function HLine({ className = '' }) {
  return <div className={`h-px bg-slate-500/35 ${className}`} aria-hidden="true" />
}

export default function ShareOrgChartTreeBoardView() {
  const leadership = useMemo(
    () => [
      { name: 'Francesco Ceccarini', role: 'Founder', accent: 'ring-cyan-400/35' },
      { name: 'Stefan Popovski', role: 'Founder', accent: 'ring-violet-400/30' },
      { name: 'Renato Pezzi', role: 'Founder', accent: 'ring-emerald-400/30' },
    ],
    []
  )

  const domains = useMemo(
    () => [
      {
        key: 'OPERATIONS',
        title: 'OPERATIONS',
        headName: 'Emanuele Braha',
        headRole: 'COO',
        secondaryLabel: 'Executive Sponsor — Francesco Ceccarini',
        areas: [
          'Sales & Retention',
          'Customer Support',
          'Withdrawals',
          'Failed Deposits',
          'Back Office',
        ],
      },
      {
        key: 'GROWTH',
        title: 'GROWTH',
        headName: 'Daniel',
        headRole: 'Head of Growth',
        secondaryLabel: 'Executive Sponsor — Francesco Ceccarini',
        areas: [
          'Marketing & Branding',
          'Acquisition',
          'Affiliates & IB',
          'PR & Sponsorship',
          'CRM & Email',
        ],
      },
      {
        key: 'TRADING & RISK',
        title: 'TRADING & RISK',
        headName: 'Chris Psomas',
        headRole: 'Head of Trading & Dealing',
        secondaryLabel: 'Executive Sponsor — Renato Pezzi',
        areas: ['Dealing Operations', 'Risk Management', 'Prop Trading', 'MT5 Administration'],
      },
      {
        key: 'CORPORATE',
        title: 'CORPORATE',
        secondaryLabel: 'Executive Sponsor — Stefan Popovski',
        heads: [
          { role: 'Finance & Compliance', name: 'Renato Pezzi' },
          { role: 'Technology & Data', name: 'Paolo Vullo' },
          { role: 'People & HR', name: 'Marina Christoforou' },
        ],
        areas: ['Finance & Payments', 'Compliance & Legal', 'Technology & Data', 'HR & People'],
      },
    ],
    []
  )

  const accents = {
    OPERATIONS: {
      dot: 'bg-cyan-400/60',
      ring: 'ring-cyan-400/35',
      pillBorder: 'border-cyan-400/20',
    },
    GROWTH: {
      dot: 'bg-fuchsia-400/60',
      ring: 'ring-fuchsia-400/30',
      pillBorder: 'border-fuchsia-400/20',
    },
    'TRADING & RISK': {
      dot: 'bg-amber-400/60',
      ring: 'ring-amber-400/30',
      pillBorder: 'border-amber-400/20',
    },
    CORPORATE: {
      dot: 'bg-emerald-400/60',
      ring: 'ring-emerald-400/30',
      pillBorder: 'border-emerald-400/20',
    },
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        <header className="flex flex-col items-center text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Company Organizational Chart
          </h1>
          <p className="mt-2 text-sm text-slate-400">High-level structure overview (Board view)</p>
          <div className="mt-4">
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1 text-xs text-slate-200">
              Names only · No contact details
            </span>
          </div>
        </header>

        <main className="mt-12" aria-label="Organizational chart">
          {/* LEVEL 0 */}
          <div className="flex flex-col items-center">
            <Card className="px-6 py-3">
              <div className="text-sm font-semibold">Bullwaves Group</div>
            </Card>

            {/* Connector down to leadership junction */}
            <div className="flex justify-center">
              <VLine h={28} />
            </div>

            {/* LEVEL 1 (leadership) with minimal branching */}
            <div className="w-full max-w-4xl">
              {/* Junction: small horizontal + three down stubs */}
              <div className="hidden md:block">
                <HLine className="w-full" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex justify-center">
                    <VLine h={18} />
                  </div>
                  <div className="flex justify-center">
                    <VLine h={18} />
                  </div>
                  <div className="flex justify-center">
                    <VLine h={18} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                {leadership.map((p) => (
                  <PersonCard key={p.name} name={p.name} role={p.role} accent={p.accent} />
                ))}
              </div>
            </div>

            {/* Connector down to core areas spine */}
            <div className="hidden lg:flex justify-center mt-6">
              <VLine h={26} />
            </div>

            {/* LEVEL 2 (core areas): single-row spine on lg+ */}
            <div className="w-full mt-6 lg:mt-0">
              <div className="hidden lg:block">
                <HLine className="w-full" />
                <div className="grid grid-cols-4 gap-4">
                  {domains.map((d) => (
                    <div key={`stub-${d.key}`} className="flex justify-center">
                      <VLine h={18} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                {domains.map((d) => (
                  <DomainCard
                    key={d.key}
                    domain={d}
                    accent={accents[d.key] || accents.OPERATIONS}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-12 flex justify-center">
          <div className="text-xs text-slate-400 border border-slate-800/80 bg-slate-900/35 rounded-full px-4 py-2">
            Public view: names only · No contact details
          </div>
        </footer>
      </div>
    </div>
  )
}
