import React, { useMemo, useRef, useState, useEffect } from 'react';
import { departmentColors, divisionColors, getFlagData, sections } from './orgChartData';

function SectionCard({ title, roles = [], bullets = [] }) {
  const hasGrid = roles && roles.length > 0;
  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm" aria-labelledby={title.replace(/\s+/g, '-').toLowerCase()}>
      <h3 className="text-lg font-semibold text-slate-100 mb-3">{title}</h3>
      {hasGrid ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => (
            <div key={`${r.name}-${r.focus}`} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-base font-bold text-white leading-tight">{r.name}</div>
                  {r.title && <div className="text-xs text-slate-200">{r.title}</div>}
                </div>
                {(() => {
                  const flag = r.region ? getFlagData(r.region) : null;
                  if (flag && (flag.emoji || flag.iso)) {
                    return (
                      <div className="min-w-[24px] flex justify-end" title={r.region}>
                        {flag.emoji ? (
                          <span className="text-xl">{flag.emoji}</span>
                        ) : flag.iso ? (
                          <img
                            src={`https://flagcdn.com/24x18/${flag.iso}.png`}
                            alt={r.region}
                            className="h-4 w-6 rounded-sm"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="text-[11px] text-slate-300">{r.focus}</div>
              <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                {r.department && (
                  <span
                    className="px-2 py-1 rounded-full text-slate-900 font-semibold"
                    style={{ background: departmentColors[r.department] || '#94a3b8' }}
                  >
                    {r.department}
                  </span>
                )}
                {r.division && (
                  <span
                    className="px-2 py-1 rounded-full text-slate-900 font-semibold"
                    style={{ background: divisionColors[r.division] || '#cbd5e1' }}
                  >
                    {r.division}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.duties}</p>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                {r.division && <span><span className="text-slate-500">Division:</span> {r.division}</span>}
                {r.department && <span><span className="text-slate-500">Dept:</span> {r.department}</span>}
                {r.region && <span><span className="text-slate-500">Region:</span> {r.region}</span>}
                {r.email && <span className="col-span-2 break-all"><span className="text-slate-500">Email:</span> {r.email}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 text-sm text-slate-200 list-disc list-inside">
          {bullets.map((b, idx) => (
            <li key={idx} className="text-slate-300 leading-relaxed">{b}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HierarchyBlock({ selected }) {
  const labelMap = {
    'management-team': 'Management Team',
    'area-responsibility': 'Area Responsibility Layer',
    'support-team': 'Support Team',
    operations: 'Operations',
    dealing: 'Dealing / PSP',
    affiliation: 'Affiliation',
    'business-development': 'Business Development',
    marketing: 'Marketing',
    finance: 'Finance',
    payments: 'Payments',
    compliance: 'Compliance',
  };

  const fullItems = [
    'CEO / Leadership',
    'Management Team',
    'Area Responsibility Layer',
    'Support Team',
    'Operations',
    'Dealing / PSP',
    'Affiliation',
    'Business Development',
    'Marketing',
    'Finance & Payments',
    'Compliance',
  ];

  const selectedLabel = labelMap[selected];
  const items = selected === 'all'
    ? fullItems
    : selected === 'management-team'
      ? ['CEO / Leadership', 'Management Team']
      : ['CEO / Leadership', 'Management Team', selectedLabel || ''];

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      {items.filter(Boolean).map((label, idx, arr) => (
        <div key={label} className="flex flex-col items-center">
          <div className="px-4 py-2 rounded-full border border-slate-700 bg-slate-900/60 text-slate-100 text-sm font-semibold shadow-sm">
            {label}
          </div>
          {idx < arr.length - 1 && (
            <div className="w-px h-5 bg-slate-700" aria-hidden="true"></div>
          )}
        </div>
      ))}
    </div>
  );
}

function TableOfContents({ selected, onSelect }) {
  const links = [
    { id: 'management-team', label: 'Management' },
    { id: 'area-responsibility', label: 'Area Layer' },
    { id: 'support-team', label: 'Support' },
    { id: 'operations', label: 'Operations' },
    { id: 'affiliation', label: 'Affiliation' },
    { id: 'business-development', label: 'Business Dev' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'finance', label: 'Finance' },
    { id: 'payments', label: 'Payments' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'dealing', label: 'Dealing Desk' },
  ];
  return (
    <nav className="flex flex-wrap gap-2 items-center text-sm mb-4" aria-label="Table of contents">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`px-3 py-1 rounded-full border text-slate-200 transition ${selected === 'all' ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-slate-700 bg-slate-900/70 hover:border-cyan-400 hover:text-white'}`}
      >
        Tutti
      </button>
      {links.map((link) => (
        <button
          type="button"
          key={link.id}
          onClick={() => onSelect(link.id)}
          className={`px-3 py-1 rounded-full border text-slate-200 transition ${selected === link.id ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-slate-700 bg-slate-900/70 hover:border-cyan-400 hover:text-white'}`}
        >
          {link.label}
        </button>
      ))}
    </nav>
  );
}

export default function OrgChart() {
  const [selected, setSelected] = useState('management-team');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const sectionRefs = useRef({});

  const visibleSections = useMemo(() => {
    if (selected === 'all') return sections;
    return sections.filter((s) => s.id === selected);
  }, [selected]);

  const allRolesIndex = useMemo(
    () =>
      sections.flatMap((section) =>
        (section.roles || []).map((role) => ({
          name: role.name,
          sectionId: section.id,
        }))
      ),
    []
  );

  function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchTerm.trim().toLowerCase();
    if (!query) return;
    const found = allRolesIndex.find((r) => r.name.toLowerCase().includes(query));
    if (found) {
      setSelected(found.sectionId);
      setPendingScrollId(found.sectionId);
    }
  }

  useEffect(() => {
    if (pendingScrollId) {
      const el = sectionRefs.current[pendingScrollId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setPendingScrollId(null);
    }
  }, [pendingScrollId, selected]);

  return (
    <div className="w-full px-6 2xl:px-10">
      <div className="w-full space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Structure</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Company Organizational Chart</h1>
          <p className="text-sm text-slate-300 max-w-3xl">Hierarchy, responsibility layer, and department rosters with job title, division, department, region, and email per person.</p>
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center mt-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per nome e premi Invio"
              className="bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              style={{ minWidth: 240 }}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg border border-cyan-500 text-cyan-100 bg-cyan-500/10 text-sm"
            >
              Vai al reparto
            </button>
          </form>
        </header>

        <TableOfContents selected={selected} onSelect={setSelected} />

        <section aria-label="Hierarchy" className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Hierarchy</h2>
          <p className="text-sm text-slate-300">CEO / Leadership cascading to operational teams.</p>
          <HierarchyBlock selected={selected} />
        </section>

        <div className="space-y-6">
          {visibleSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[section.id] = el;
              }}
            >
              <SectionCard title={section.title} roles={section.roles} bullets={section.bullets} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
