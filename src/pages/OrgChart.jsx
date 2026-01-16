import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { departmentColors, divisionColors, getFlagData, sections } from './orgChartData'

function SectionCard({ title, roles = [], bullets = [], t }) {
  const hasGrid = roles && roles.length > 0
  return (
    <section
      className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm"
      aria-labelledby={title.replace(/\s+/g, '-').toLowerCase()}
    >
      <h3 className="text-lg font-semibold text-slate-100 mb-3">{title}</h3>
      {hasGrid ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => (
            <div
              key={`${r.name}-${r.focus}`}
              className="bg-slate-800/60 border border-slate-700 rounded-lg p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-base font-bold text-white leading-tight">{r.name}</div>
                  {r.title && <div className="text-xs text-slate-200">{r.title}</div>}
                </div>
                {(() => {
                  const flag = r.region ? getFlagData(r.region) : null
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
                    )
                  }
                  return null
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
                {r.division && (
                  <span>
                    <span className="text-slate-500">{t('orgChart.role.division')}:</span>{' '}
                    {r.division}
                  </span>
                )}
                {r.department && (
                  <span>
                    <span className="text-slate-500">{t('orgChart.role.dept')}:</span>{' '}
                    {r.department}
                  </span>
                )}
                {r.region && (
                  <span>
                    <span className="text-slate-500">{t('orgChart.role.region')}:</span> {r.region}
                  </span>
                )}
                {r.email && (
                  <span className="col-span-2 break-all">
                    <span className="text-slate-500">{t('orgChart.role.email')}:</span> {r.email}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 text-sm text-slate-200 list-disc list-inside">
          {bullets.map((b, idx) => (
            <li key={idx} className="text-slate-300 leading-relaxed">
              {b}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function HierarchyBlock({ selected, t }) {
  const labelMap = {
    'management-team': t('orgChart.hierarchyItem.management'),
    'area-responsibility': t('orgChart.hierarchyItem.areaLayer'),
    'support-team': t('orgChart.hierarchyItem.support'),
    operations: t('orgChart.hierarchyItem.operations'),
    dealing: t('orgChart.hierarchyItem.dealing'),
    affiliation: t('orgChart.hierarchyItem.affiliation'),
    'business-development': t('orgChart.hierarchyItem.businessDev'),
    marketing: t('orgChart.hierarchyItem.marketing'),
    finance: t('orgChart.hierarchyItem.financePayments'),
    payments: t('orgChart.hierarchyItem.financePayments'),
    compliance: t('orgChart.hierarchyItem.compliance'),
  }

  const fullItems = [
    t('orgChart.hierarchyItem.ceo'),
    t('orgChart.hierarchyItem.management'),
    t('orgChart.hierarchyItem.areaLayer'),
    t('orgChart.hierarchyItem.support'),
    t('orgChart.hierarchyItem.operations'),
    t('orgChart.hierarchyItem.dealing'),
    t('orgChart.hierarchyItem.affiliation'),
    t('orgChart.hierarchyItem.businessDev'),
    t('orgChart.hierarchyItem.marketing'),
    t('orgChart.hierarchyItem.financePayments'),
    t('orgChart.hierarchyItem.compliance'),
  ]

  const selectedLabel = labelMap[selected]
  const items =
    selected === 'all'
      ? fullItems
      : selected === 'management-team'
        ? [t('orgChart.hierarchyItem.ceo'), t('orgChart.hierarchyItem.management')]
        : [
            t('orgChart.hierarchyItem.ceo'),
            t('orgChart.hierarchyItem.management'),
            selectedLabel || '',
          ]

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      {items.filter(Boolean).map((label, idx, arr) => (
        <div key={label} className="flex flex-col items-center">
          <div className="px-4 py-2 rounded-full border border-slate-700 bg-slate-900/60 text-slate-100 text-sm font-semibold shadow-sm">
            {label}
          </div>
          {idx < arr.length - 1 && <div className="w-px h-5 bg-slate-700" aria-hidden="true"></div>}
        </div>
      ))}
    </div>
  )
}

function TableOfContents({ selected, onSelect, t }) {
  const links = [
    { id: 'management-team', label: t('orgChart.toc.management') },
    { id: 'area-responsibility', label: t('orgChart.toc.areaLayer') },
    { id: 'support-team', label: t('orgChart.toc.support') },
    { id: 'operations', label: t('orgChart.toc.operations') },
    { id: 'affiliation', label: t('orgChart.toc.affiliation') },
    { id: 'business-development', label: t('orgChart.toc.businessDev') },
    { id: 'marketing', label: t('orgChart.toc.marketing') },
    { id: 'finance', label: t('orgChart.toc.finance') },
    { id: 'payments', label: t('orgChart.toc.payments') },
    { id: 'compliance', label: t('orgChart.toc.compliance') },
    { id: 'dealing', label: t('orgChart.toc.dealing') },
  ]
  return (
    <nav
      className="flex flex-wrap gap-2 items-center text-sm mb-4"
      aria-label={t('orgChart.toc.ariaLabel')}
    >
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`px-3 py-1 rounded-full border text-slate-200 transition ${selected === 'all' ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-slate-700 bg-slate-900/70 hover:border-cyan-400 hover:text-white'}`}
      >
        {t('orgChart.toc.all')}
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
  )
}

export default function OrgChart() {
  const { t } = useI18n()
  const [selected, setSelected] = useState('management-team')
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingScrollId, setPendingScrollId] = useState(null)
  const sectionRefs = useRef({})

  const visibleSections = useMemo(() => {
    if (selected === 'all') return sections
    return sections.filter((s) => s.id === selected)
  }, [selected])

  const allRolesIndex = useMemo(
    () =>
      sections.flatMap((section) =>
        (section.roles || []).map((role) => ({
          name: role.name,
          sectionId: section.id,
        }))
      ),
    []
  )

  function handleSearchSubmit(e) {
    e.preventDefault()
    const query = searchTerm.trim().toLowerCase()
    if (!query) return
    const found = allRolesIndex.find((r) => r.name.toLowerCase().includes(query))
    if (found) {
      setSelected(found.sectionId)
      setPendingScrollId(found.sectionId)
    }
  }

  useEffect(() => {
    if (pendingScrollId) {
      const el = sectionRefs.current[pendingScrollId]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setPendingScrollId(null)
    }
  }, [pendingScrollId, selected])

  return (
    <div className="w-full px-6 2xl:px-10">
      <div className="w-full space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            {t('orgChart.structure')}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{t('orgChart.title')}</h1>
          <p className="text-sm text-slate-300 max-w-3xl">{t('orgChart.description')}</p>
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center mt-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('orgChart.search.placeholder')}
              className="bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
              style={{ minWidth: 240 }}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg border border-cyan-500 text-cyan-100 bg-cyan-500/10 text-sm"
            >
              {t('orgChart.search.submit')}
            </button>
            <a
              href="/share/org-chart"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 bg-slate-900/70 hover:border-cyan-400 hover:text-white text-sm"
              title="Open public org chart"
            >
              {t('support.userCheck.botList.share.label')} ↗
            </a>
          </form>
        </header>

        <TableOfContents selected={selected} onSelect={setSelected} t={t} />

        <section
          aria-label={t('orgChart.hierarchy.ariaLabel')}
          className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            {t('orgChart.hierarchy.title')}
          </h2>
          <p className="text-sm text-slate-300">{t('orgChart.hierarchy.subtitle')}</p>
          <HierarchyBlock selected={selected} t={t} />
        </section>

        <div className="space-y-6">
          {visibleSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[section.id] = el
              }}
            >
              <SectionCard
                title={t(`orgChart.sectionTitle.${section.id}`) || section.title}
                roles={section.roles}
                bullets={section.bullets}
                t={t}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
