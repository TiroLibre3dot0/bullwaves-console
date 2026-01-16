import React, { useMemo } from 'react'

function initials(name) {
  const s = String(name || '').trim()
  if (!s) return '?'
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Avatar({ name, accentClassName = 'ring-cyan-400/30' }) {
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

function Pill({ children, accentClassName = 'border-slate-700 text-slate-200' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${accentClassName}`}
    >
      {children}
    </span>
  )
}

function LeadershipCard({ name, role, accent }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-sm backdrop-blur-md">
      <div className="p-5 flex items-center gap-3">
        <Avatar name={name} accentClassName={accent} />
        <div className="min-w-0">
          <div className="text-xs text-slate-400">{role}</div>
          <div className="text-base font-semibold text-slate-100 truncate" title={name}>
            {name}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniRow({ role, name }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-xs text-slate-400">{role}</div>
      <div className="text-sm text-slate-100 font-semibold text-right">{name}</div>
    </div>
  )
}

function ClusterCard({ domain, accent }) {
  const { title, executiveLabel, headName, sponsorName, keyLeads = [], areas = [] } = domain

  return (
    <section
      className="bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-sm backdrop-blur-md overflow-hidden"
      aria-labelledby={`domain-${title}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h2
            id={`domain-${title}`}
            className="text-[11px] uppercase tracking-[0.18em] text-slate-400"
          >
            {title}
          </h2>
          <span className={`h-2.5 w-2.5 rounded-full ${accent.dot}`} aria-hidden="true" />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Avatar name={headName} accentClassName={accent.ring} />
          <div className="min-w-0">
            <div className="text-xs text-slate-400">{executiveLabel}</div>
            <div className="text-sm font-semibold text-slate-100 truncate" title={headName}>
              {headName}
            </div>
          </div>
        </div>

        {sponsorName ? (
          <div className="mt-3">
            <Pill accentClassName={`border ${accent.pillBorder} text-slate-100 bg-slate-950/30`}>
              Executive Sponsor: {sponsorName}
            </Pill>
          </div>
        ) : null}

        {keyLeads.length ? (
          <div className="mt-6 pt-5 border-t border-slate-800/70">
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Key Leads</div>
            <div className="mt-3 space-y-2">
              {keyLeads.slice(0, 3).map((k) => (
                <MiniRow key={`${title}-${k.role}-${k.name}`} role={k.role} name={k.name} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 pt-5 border-t border-slate-800/70">
          <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Areas</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {areas.map((a) => (
              <Pill
                key={`${title}-${a}`}
                accentClassName={`border ${accent.pillBorder} text-slate-200`}
              >
                {a}
              </Pill>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ShareOrgChartBoardView() {
  const leadership = useMemo(
    () => [
      { name: 'Francesco Ceccarini', role: 'Group CEO', accent: 'ring-cyan-400/35' },
      { name: 'Stefan Popovski', role: 'Group CEO / Co-Founder', accent: 'ring-violet-400/30' },
    ],
    []
  )

  const domains = useMemo(
    () => [
      {
        title: 'OPERATIONS',
        executiveLabel: 'COO',
        headName: 'Emanuele Braha',
        keyLeads: [
          { role: 'Head of Operations', name: 'Paolo Vullo' },
          { role: 'Head of Support', name: 'Tamara Popovic Yakimov' },
        ],
        areas: [
          'Sales & Retention',
          'Customer Support',
          'Withdrawals',
          'Failed Deposits',
          'Back Office',
        ],
      },
      {
        title: 'MARKETING & GROWTH',
        executiveLabel: 'Head',
        headName: 'Daniel',
        sponsorName: 'Francesco Ceccarini',
        areas: [
          'Acquisition',
          'Affiliate & IB',
          'Branding',
          'PR & Sponsorship',
          'Social & Content',
          'CRM & Email',
          'Reputation',
        ],
      },
      {
        title: 'TRADING & DEALING',
        executiveLabel: 'Head',
        headName: 'Chris Psomas',
        areas: ['Dealing Operations', 'Risk Management', 'MT5 Administration', 'Prop Trading'],
      },
      {
        title: 'FINANCE & COMPLIANCE',
        executiveLabel: 'Head',
        headName: 'Renato Pezzi',
        keyLeads: [
          { role: 'Accounting', name: 'Rodoula Xenofontos' },
          { role: 'Payments', name: 'Konstantina Zafeiropoulou' },
          { role: 'Compliance', name: 'Stamatis Daravanis' },
        ],
        areas: ['Accounting', 'Payments', 'Reconciliation', 'Legal', 'Compliance'],
      },
      {
        title: 'TECHNOLOGY & DATA',
        executiveLabel: 'Head',
        headName: 'Paolo Vullo',
        areas: [
          'Platform & Infrastructure',
          'Internal Tools',
          'Data & Reporting',
          'Dashboards',
          'CRM Integrations',
        ],
      },
      {
        title: 'PEOPLE & HR',
        executiveLabel: 'Head',
        headName: 'Marina Christoforou',
        areas: ['Recruiting', 'Employer Branding', 'HR Admin', 'Policies & Benefits'],
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
    'MARKETING & GROWTH': {
      dot: 'bg-fuchsia-400/60',
      ring: 'ring-fuchsia-400/30',
      pillBorder: 'border-fuchsia-400/20',
    },
    'TRADING & DEALING': {
      dot: 'bg-amber-400/60',
      ring: 'ring-amber-400/30',
      pillBorder: 'border-amber-400/20',
    },
    'FINANCE & COMPLIANCE': {
      dot: 'bg-emerald-400/60',
      ring: 'ring-emerald-400/30',
      pillBorder: 'border-emerald-400/20',
    },
    'TECHNOLOGY & DATA': {
      dot: 'bg-sky-400/60',
      ring: 'ring-sky-400/30',
      pillBorder: 'border-sky-400/20',
    },
    'PEOPLE & HR': {
      dot: 'bg-violet-400/60',
      ring: 'ring-violet-400/30',
      pillBorder: 'border-violet-400/20',
    },
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        {/* 1) Header */}
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

        {/* 2) Group level (top) */}
        <section className="mt-12" aria-label="Group leadership">
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-slate-900/45 px-5 py-2 text-sm font-semibold">
              Bullwaves Group
            </div>

            <div className="mt-6 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              {leadership.map((p) => (
                <LeadershipCard key={p.name} name={p.name} role={p.role} accent={p.accent} />
              ))}
            </div>
          </div>
        </section>

        {/* 3) Executive domains */}
        <main className="mt-12" aria-label="Executive domains">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {domains.map((d) => (
              <ClusterCard
                key={d.title}
                domain={d}
                accent={accents[d.title] || accents.OPERATIONS}
              />
            ))}
          </div>
        </main>

        {/* 4) Legend */}
        <footer className="mt-12 flex justify-center">
          <div className="text-xs text-slate-400 border border-slate-800/80 bg-slate-900/35 rounded-full px-4 py-2">
            Public view: names only · No contact details
          </div>
        </footer>
      </div>
    </div>
  )
}
