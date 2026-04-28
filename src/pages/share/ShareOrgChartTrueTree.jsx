import React, { useEffect, useMemo, useRef, useState } from 'react'
import { track, trackPublicShareOpen } from '../../utils/analytics'
import { fetchOrgChartFromGoogleSheets } from '../../utils/googleSheetsOrgParser'

function Card({ title, lines = [], accentDotClass = 'bg-gray-400/60', size = 'md', extra }) {
  const isSm = size === 'sm'
  return (
    <div
      className={
        `relative bg-gray-700/35 border border-gray-600/80 ring-1 ring-gray-500/30 rounded-2xl shadow-sm backdrop-blur-md ` +
        (isSm ? 'px-4 py-3 min-h-[60px]' : 'px-5 py-4 min-h-[84px]')
      }
    >
      <span
        className={`absolute -top-1.5 right-4 h-2.5 w-2.5 rounded-full ${accentDotClass}`}
        aria-hidden="true"
      />
      <div
        className={
          (isSm ? 'text-sm font-semibold text-gray-100' : 'text-base font-semibold text-gray-100') +
          ' min-w-0 whitespace-normal break-normal leading-snug tracking-tight'
        }
        title={typeof title === 'string' ? title : undefined}
      >
        {title}
      </div>
      {lines.length ? (
        <div className={isSm ? 'mt-1 space-y-0.5' : 'mt-2 space-y-1'}>
          {lines.map((l, idx) => (
            <div
              key={
                typeof l === 'string'
                  ? `${idx}-${l}`
                  : `${idx}-${String(l?.text || l?.title || '')}`
              }
              className={
                (isSm ? 'text-xs text-gray-300' : 'text-sm text-gray-300') +
                ' min-w-0 whitespace-normal break-normal leading-snug'
              }
              title={typeof l === 'object' && l ? l.title : undefined}
            >
              {typeof l === 'string' ? l : l.text}
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
    <div className={`w-px bg-gray-500/35 ${className}`} style={{ height: h }} aria-hidden="true" />
  )
}

function HLine({ className = '' }) {
  return <div className={`h-px bg-gray-500/35 ${className}`} aria-hidden="true" />
}

function SpotlightAreaConnections({ containerRef, areaRefs, spotlight }) {
  const [segments, setSegments] = useState([])
  const [canvas, setCanvas] = useState({ w: 0, h: 0 })

  useEffect(() => {
    let raf = 0

    const compute = () => {
      if (!spotlight?.relatedAreaIdMap) {
        setSegments([])
        setCanvas({ w: 0, h: 0 })
        return
      }

      const containerEl = containerRef?.current
      if (!containerEl) {
        setSegments([])
        setCanvas({ w: 0, h: 0 })
        return
      }

      const relatedAreaIds = Object.keys(spotlight.relatedAreaIdMap).filter(
        (k) => spotlight.relatedAreaIdMap?.[k]
      )

      if (relatedAreaIds.length < 2) {
        setSegments([])
        setCanvas({ w: 0, h: 0 })
        return
      }

      const containerRect = containerEl.getBoundingClientRect()
      const w = Math.max(1, Math.round(containerRect.width || 0))
      const h = Math.max(1, Math.round(containerRect.height || 0))
      setCanvas({ w, h })
      const points = []
      for (const areaId of relatedAreaIds) {
        const ref = areaRefs?.[areaId]
        const el = ref?.current || containerEl.querySelector(`[data-macro-area-id="${areaId}"]`)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        points.push({
          areaId,
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + Math.min(22, rect.height * 0.18) - containerRect.top,
        })
      }

      if (points.length < 2) {
        setSegments([])
        return
      }

      const next = []
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          next.push({
            key: `${points[i].areaId}__${points[j].areaId}`,
            x1: points[i].x,
            y1: points[i].y,
            x2: points[j].x,
            y2: points[j].y,
          })
        }
      }
      setSegments(next)
    }

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(compute)
    }

    schedule()
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
    }
  }, [containerRef, areaRefs, spotlight])

  if (!segments.length) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 block text-brand-400"
      width={canvas.w || undefined}
      height={canvas.h || undefined}
      viewBox={canvas.w && canvas.h ? `0 0 ${canvas.w} ${canvas.h}` : undefined}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {segments.map((s) => (
        <line
          key={s.key}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="6 6"
          strokeOpacity="0.9"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

function SubCard({
  title,
  lines = [],
  borderClass = 'border-gray-600/70',
  headBadgeClass = 'border-gray-300/25 text-gray-200/80 bg-gray-900/20',
  people = [],
  showPeople = false,
  areaId,
  nodeId,
  spotlight,
  onSpotlight,
  onClearSpotlight,
}) {
  const filtered = (lines || []).filter(Boolean)
  const safePeople = (people || []).filter((p) => p && p.name && p.title)
  const useDenseGrid = safePeople.length >= 9
  const isCustomerSupport = title === 'Customer Support'
  const useSupportGrid = isCustomerSupport && safePeople.length >= 6

  const isActive = Boolean(spotlight)
  const isNodeRelated = isActive && nodeId && spotlight?.relatedNodeIdMap?.[nodeId]
  const isAreaRelated = isActive && areaId && spotlight?.relatedAreaIdMap?.[areaId]
  const shouldDim = isActive && !isNodeRelated && !isAreaRelated
  const shouldRing = isActive && (isNodeRelated || (isAreaRelated && spotlight?.kind === 'area'))
  return (
    <div
      className={
        `bg-gray-700/20 border ${borderClass} rounded-xl px-3 py-2 whitespace-normal transition-opacity ` +
        (shouldDim ? 'opacity-30 ' : 'opacity-100 ') +
        (shouldRing ? 'ring-2 ring-brand-400/50 ' : '') +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50'
      }
      tabIndex={0}
      onMouseEnter={() => onSpotlight?.({ kind: 'function', areaId, nodeId, label: title })}
      onMouseLeave={() => onClearSpotlight?.()}
      onFocus={() => onSpotlight?.({ kind: 'function', areaId, nodeId, label: title })}
      onBlur={() => onClearSpotlight?.()}
      aria-label={title}
    >
      <div className="text-xs text-gray-200 font-semibold leading-snug">{title}</div>
      {filtered.length ? (
        <div className="mt-1 space-y-0.5">
          {filtered.map((l) => (
            <div key={`${title}-${l}`} className="text-[11px] text-gray-400 leading-snug">
              {l}
            </div>
          ))}
        </div>
      ) : null}

      {/* People (secondary, injected into the SAME structure) */}
      <div
        className={
          'transition-all duration-300 ease-out overflow-hidden ' +
          (showPeople ? 'max-h-[1400px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0')
        }
        aria-hidden={!showPeople}
      >
        {safePeople.length ? (
          <div
            className={
              useSupportGrid
                ? 'grid gap-2 grid-cols-2 lg:grid-cols-3'
                : useDenseGrid
                  ? 'grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]'
                  : 'space-y-1'
            }
          >
            {safePeople.map((p) => (
              <div
                key={`${title}-${p.name}-${p.title}`}
                className={(() => {
                  const isFacilitator =
                    Boolean(p.isFacilitator) ||
                    Boolean(p.crossTeamRole) ||
                    (Array.isArray(p.facilitatorFor) && p.facilitatorFor.length > 0)

                  return (
                    'min-w-0 rounded-lg border ' +
                    (isCustomerSupport ? 'px-2 py-1.5 ' : 'px-2.5 py-2 ') +
                    (p.isHead
                      ? 'border-gray-500/55 bg-gray-900/45'
                      : 'border-gray-600/40 bg-gray-900/30') +
                    (isFacilitator ? ' border-dashed border-brand-400' : '')
                  )
                })()}
                onMouseEnter={() =>
                  onSpotlight?.({
                    kind: 'person',
                    person: p,
                    hostAreaId: areaId,
                    hostNodeId: nodeId,
                  })
                }
              >
                {(() => {
                  const fp = formatPersonText(p, { maxTitleLen: 26 })
                  return (
                    <>
                      <div
                        className={
                          'text-[11px] leading-snug ' +
                          (p.isHead ? 'font-bold text-gray-100' : 'font-semibold text-gray-100')
                        }
                        title={fp.displayName}
                      >
                        {fp.displayName}
                      </div>
                      <div
                        className={
                          (isCustomerSupport ? 'mt-0.5 text-[10px] ' : 'mt-0.5 text-[11px] ') +
                          'text-gray-400 leading-snug flex flex-wrap items-center gap-1.5 min-w-0'
                        }
                      >
                        <span className="min-w-0 flex-1 break-normal" title={fp.titleTooltip}>
                          {fp.shortenedTitle || fp.fullTitle}
                        </span>
                        {p.isHead ? (
                          <span
                            className={
                              'inline-flex items-center whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ' +
                              headBadgeClass
                            }
                          >
                            Head
                          </span>
                        ) : null}
                        {p.isFacilitator ? (
                          <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-brand-400 text-brand-100/90 bg-brand-900/15">
                            Facilitator
                          </span>
                        ) : null}
                      </div>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-gray-500">No people mapped</div>
        )}
      </div>
    </div>
  )
}

function SalesSupportFacilitatorBridge({ people = [], spotlight, onSpotlight, onClearSpotlight }) {
  const safe = (people || []).filter((p) => p && p.name && p.title)
  if (!safe.length) return null

  const two = safe.slice(0, 2)
  const a = two[0] || null
  const b = two[1] || null

  const isActive = Boolean(spotlight)
  const bridgeRelated =
    !isActive ||
    spotlight?.highlightBridge ||
    spotlight?.relatedNodeIdMap?.sales ||
    spotlight?.relatedNodeIdMap?.['customer-support']
  const dimClass = isActive && !bridgeRelated ? 'opacity-30' : 'opacity-100'

  return (
    <div
      className={`relative w-full transition-opacity ${dimClass}`}
      onMouseEnter={() => onSpotlight?.({ kind: 'bridge' })}
      onMouseLeave={() => onClearSpotlight?.()}
    >
      <div className="border-t border-dashed border-brand-400" />
      <div className="absolute left-2 -top-3 text-[10px] text-brand-200 bg-gray-900/70 px-2 py-0.5 rounded-full border border-brand-400">
        Customer Support
      </div>
      <div className="absolute right-2 -top-3 text-[10px] text-brand-200 bg-gray-900/70 px-2 py-0.5 rounded-full border border-brand-400">
        Sales
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 -top-7">
        <div className="flex items-stretch gap-8">
          {a
            ? (() => {
                const fp = formatPersonText(a, { maxTitleLen: 28 })
                const isHighlighted =
                  isActive &&
                  (spotlight?.kind === 'bridge' ||
                    spotlight?.personNameKey === normalizeKey(a?.name))
                return (
                  <div
                    className={
                      'min-w-[12rem] max-w-[14rem] rounded-xl border border-dashed border-brand-400 bg-gray-900/70 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 ' +
                      (isHighlighted ? 'ring-2 ring-brand-400/50 ' : '')
                    }
                    tabIndex={0}
                    onMouseEnter={() => onSpotlight?.({ kind: 'person', person: a })}
                    onFocus={() => onSpotlight?.({ kind: 'person', person: a })}
                    onBlur={() => onClearSpotlight?.()}
                  >
                    <div
                      className="text-[11px] font-semibold text-gray-100 leading-snug"
                      title={fp.displayName}
                    >
                      {fp.displayName}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-400 leading-snug flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="min-w-0 flex-1 break-normal" title={fp.titleTooltip}>
                        {fp.shortenedTitle || fp.fullTitle}
                      </span>
                      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-brand-400 text-brand-100/90 bg-brand-900/15">
                        Facilitator
                      </span>
                    </div>
                  </div>
                )
              })()
            : null}

          {a && b ? (
            <div className="flex flex-col items-center justify-center px-1">
              <div className="text-[9px] font-semibold tracking-wide text-brand-200 bg-gray-900/60 px-2 py-0.5 rounded-full border border-dashed border-brand-400 whitespace-nowrap">
                Interaction ↔
              </div>
              <div className="mt-1 flex items-center">
                <div className="w-10 border-t border-dashed border-brand-400" />
                <div className="mx-1 h-2 w-2 rounded-full bg-brand-400" />
                <div className="w-10 border-t border-dashed border-brand-400" />
              </div>
            </div>
          ) : null}

          {b
            ? (() => {
                const fp = formatPersonText(b, { maxTitleLen: 28 })
                const isHighlighted =
                  isActive &&
                  (spotlight?.kind === 'bridge' ||
                    spotlight?.personNameKey === normalizeKey(b?.name))
                return (
                  <div
                    className={
                      'min-w-[12rem] max-w-[14rem] rounded-xl border border-dashed border-brand-400 bg-gray-900/70 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 ' +
                      (isHighlighted ? 'ring-2 ring-brand-400/50 ' : '')
                    }
                    tabIndex={0}
                    onMouseEnter={() => onSpotlight?.({ kind: 'person', person: b })}
                    onFocus={() => onSpotlight?.({ kind: 'person', person: b })}
                    onBlur={() => onClearSpotlight?.()}
                  >
                    <div
                      className="text-[11px] font-semibold text-gray-100 leading-snug"
                      title={fp.displayName}
                    >
                      {fp.displayName}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-400 leading-snug flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="min-w-0 flex-1 break-normal" title={fp.titleTooltip}>
                        {fp.shortenedTitle || fp.fullTitle}
                      </span>
                      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-brand-400 text-brand-100/90 bg-brand-900/15">
                        Facilitator
                      </span>
                    </div>
                  </div>
                )
              })()
            : null}
        </div>
      </div>

      <div className="h-10" aria-hidden="true" />
    </div>
  )
}

const ACCENTS = {
  root: 'bg-gray-400/60',
  governance: 'bg-gray-400/60',
  revenue: 'bg-indigo-300/45',
  affiliates: 'bg-orange-300/45',
  trading: 'bg-amber-300/40',
  marketing: 'bg-pink-300/40',
  finance: 'bg-teal-300/40',
  compliance: 'bg-slate-300/45',
  hr: 'bg-violet-300/40',
  support: 'bg-sky-300/40',
  operations: 'bg-gray-300/50',
}

const BORDERS = {
  revenue: 'border-indigo-300/20',
  affiliates: 'border-orange-300/20',
  trading: 'border-amber-300/18',
  marketing: 'border-pink-300/20',
  finance: 'border-teal-300/20',
  compliance: 'border-slate-300/20',
  hr: 'border-violet-300/20',
  support: 'border-sky-300/20',
  operations: 'border-gray-300/20',
}

// Structure-only view. HR-owned role assignment.
// HR can insert names at data level without changing layout.
const ORG_TREE = {
  id: 'bullwaves-group',
  label: 'Bullwaves Group',
  children: [
    {
      id: 'governance',
      label: 'Founders',
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
      label: 'Departments',
      type: 'macro-group',
      children: [
        {
          id: 'revenue',
          label: 'Revenue',
          type: 'macro',
          icon: 'revenue',
          children: [
            { id: 'sales', label: 'Sales', type: 'function' },
            { id: 'retention', label: 'Retention', type: 'function' },
            { id: 'mena', label: 'MENA', type: 'function' },
          ],
        },
        {
          id: 'affiliates',
          label: 'Affiliation & IB',
          type: 'macro',
          icon: 'affiliates',
          children: [
            { id: 'affiliates-ib', label: 'Affiliates & IB', type: 'function' },
            { id: 'performance', label: 'Performance Channels', type: 'function' },
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
          id: 'marketing',
          label: 'Marketing',
          type: 'macro',
          icon: 'marketing',
          children: [{ id: 'marketing-ops', label: 'Marketing & Brand', type: 'function' }],
        },
        {
          id: 'finance',
          label: 'Finance',
          type: 'macro',
          icon: 'corporate',
          children: [{ id: 'accounting', label: 'Accounting & Payments', type: 'function' }],
        },
        {
          id: 'compliance',
          label: 'Compliance & Legal',
          type: 'macro',
          icon: 'compliance',
          children: [{ id: 'compliance-legal', label: 'Compliance & Legal', type: 'function' }],
        },
        {
          id: 'hr',
          label: 'HR & People',
          type: 'macro',
          icon: 'hr',
          children: [{ id: 'hr-recruiting', label: 'HR & Recruiting', type: 'function' }],
        },
        {
          id: 'customer-support-area',
          label: 'Support',
          type: 'macro',
          icon: 'support',
          children: [
            { id: 'customer-support', label: 'Customer Support', type: 'function' },
            { id: 'tech-ops', label: 'Tech Operations', type: 'function' },
          ],
        },
        {
          id: 'operations-area',
          label: 'Operations',
          type: 'macro',
          icon: 'operations',
          children: [
            { id: 'business-ops', label: 'Business Operations', type: 'function' },
            { id: 'reporting', label: 'Reporting', type: 'function' },
            { id: 'platforms-tools', label: 'CRM & Tools', type: 'function' },
          ],
        },
      ],
    },
  ],
}

const VIEW_MODES = {
  structure: 'structure',
  people: 'people',
  department: 'department',
}

const VIEW_MODE_META = {
  [VIEW_MODES.structure]: {
    label: 'Structure only',
    shortLabel: 'Structure',
    description: 'Generic organizational structure',
  },
  [VIEW_MODES.people]: {
    label: 'People',
    shortLabel: 'People',
    description: 'Detailed org view with people',
  },
  [VIEW_MODES.department]: {
    label: 'Department focus',
    shortLabel: 'Department',
    description: 'Single department spotlight',
  },
}

function ViewModeIcon({ mode, className = '' }) {
  const common = {
    className: `h-4 w-4 ${className}`,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  if (mode === VIEW_MODES.people) {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M3.5 18c0-2.8 2.3-5 5-5h1" />
        <path d="M12 18c.2-2 1.9-3.5 4-3.5 2.2 0 4 1.8 4 4" />
      </svg>
    )
  }

  if (mode === VIEW_MODES.department) {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="7" height="16" rx="1.5" />
        <path d="M14 7h7" />
        <path d="M14 12h7" />
        <path d="M14 17h7" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <rect x="4" y="5" width="16" height="4" rx="1" />
      <rect x="4" y="11" width="16" height="8" rx="1" />
    </svg>
  )
}

function ViewModeDock({ mode, onChange }) {
  const items = [VIEW_MODES.structure, VIEW_MODES.people, VIEW_MODES.department]
  return (
    <div className="fixed left-5 top-16 z-30 rounded-2xl border border-gray-600/50 bg-gray-900/70 p-1.5 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="flex items-center gap-1">
        {items.map((item) => {
          const active = mode === item
          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={
                'inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ' +
                (active
                  ? 'border-brand-400/40 bg-brand-400/15 text-brand-100'
                  : 'border-transparent text-gray-300 hover:border-gray-500/40 hover:bg-gray-800/70 hover:text-white')
              }
              aria-label={VIEW_MODE_META[item].label}
              aria-pressed={active}
              title={VIEW_MODE_META[item].label}
            >
              <ViewModeIcon mode={item} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Small inline badges showing which founder(s) an area reports to
function FounderBadges({ areaId, className = '' }) {
  const founders = FOUNDER_BY_AREA[areaId] || []
  if (!founders.length) return null
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-600">
        reports to
      </span>
      {founders.map((f) => {
        const first = f.split(' ')[0]
        return (
          <span
            key={f}
            title={f}
            className="inline-flex items-center gap-1 rounded-full border border-gray-500/40 bg-gray-800/60 px-2 py-0.5 text-[9px] font-semibold text-gray-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400/60 flex-shrink-0" />
            {first}
          </span>
        )
      })}
    </div>
  )
}

function DepartmentSidebar({ areas = [], selectedAreaId, onSelect }) {
  return (
    <aside className="xl:sticky xl:top-24">
      <div className="rounded-2xl border border-gray-600/40 bg-gray-900/45 p-3 backdrop-blur-md">
        <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          Departments
        </div>
        <div className="flex flex-col gap-2">
          {areas.map((area) => {
            const active = area.id === selectedAreaId
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => onSelect(area.id)}
                className={
                  'w-full rounded-lg border px-3 py-2 text-left text-xs font-medium transition ' +
                  (active
                    ? 'border-brand-400/40 bg-brand-400/12 text-white'
                    : 'border-gray-600/35 bg-white/5 text-gray-300 hover:border-gray-500/40 hover:bg-white/8 hover:text-white')
                }
                aria-pressed={active}
              >
                {area.label}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

const TITLE_ABBREVIATIONS = [
  // phrases first
  { re: /\bBusiness\s+Development\b/gi, to: 'Biz Dev' },
  { re: /\bCustomer\s+Relations\b/gi, to: 'Customer Rel.' },
  { re: /\bSenior\s+Controller\b/gi, to: 'Sr Controller' },
  // single words
  { re: /\bBusiness\b/gi, to: 'Biz' },
  { re: /\bDevelopment\b/gi, to: 'Dev' },
  { re: /\bManager\b/gi, to: 'Mgr' },
  { re: /\bCoordinator\b/gi, to: 'Coord' },
  { re: /\bOperations\b/gi, to: 'Ops' },
  { re: /\bAdministration\b/gi, to: 'Admin' },
  { re: /\bRecruitment\b/gi, to: 'Recruit.' },
  { re: /\bCompliance\b/gi, to: 'Compl.' },
  { re: /\bSpecialist\b/gi, to: 'Spec.' },
  { re: /\bReconciliation\b/gi, to: 'Reconc.' },
  { re: /\bProvisioning\b/gi, to: 'Provision.' },
  { re: /\bMarketing\b/gi, to: 'Mktg' },
]

function abbreviateJobTitle(fullTitle) {
  let out = String(fullTitle || '').trim()
  for (const { re, to } of TITLE_ABBREVIATIONS) out = out.replace(re, to)
  out = out.replace(/\s{2,}/g, ' ')
  return out
}

function shortenJobTitleIfNeeded(fullTitle, { maxLen = 28 } = {}) {
  const t = String(fullTitle || '').trim()
  if (!t) return ''
  if (t.length <= maxLen) return t
  const abbreviated = abbreviateJobTitle(t)
  if (abbreviated.length <= maxLen) return abbreviated
  // If still long, keep abbreviated version (wraps) but avoid extremes
  return abbreviated
}

function formatPersonText(person, { maxTitleLen = 28 } = {}) {
  const displayName = String(person?.name || '').trim()
  const fullTitle = String(person?.title || '').trim()
  const shortenedTitle = shortenJobTitleIfNeeded(fullTitle, { maxLen: maxTitleLen })
  return {
    displayName,
    fullTitle,
    shortenedTitle,
    titleTooltip:
      shortenedTitle && fullTitle && shortenedTitle !== fullTitle ? fullTitle : undefined,
  }
}

// Derived from orgChartData.js area-responsibility section.
// Maps each macro-area to the founder(s) responsible for it.
const FOUNDER_BY_AREA = {
  revenue: ['Francesco Ceccarini'],
  affiliates: ['Stefan Popovski', 'Emanuele Braha'],
  'trading-risk': ['Renato Pezzi'],
  marketing: [],
  finance: [],
  compliance: ['Filippo De Rosa'],
  hr: ['Francesco Ceccarini'],
  'customer-support-area': ['Emanuele Braha'],
  'operations-area': ['Francesco Ceccarini'],
}

const HUB_CLUSTERS = {
  revenue: [
    { label: 'Sales & Conversion', fnIds: ['sales'] },
    { label: 'Retention', fnIds: ['retention'] },
    { label: 'MENA', fnIds: ['mena'] },
  ],
  affiliates: [
    { label: 'Affiliates & IB', fnIds: ['affiliates-ib'] },
    { label: 'Performance Channels', fnIds: ['performance'] },
  ],
  'trading-risk': [
    { label: 'Trading', fnIds: ['dealing', 'prop'] },
    { label: 'Risk & Platforms', fnIds: ['risk', 'mt5'] },
  ],
  marketing: [{ label: 'Marketing & Brand', fnIds: ['marketing-ops'] }],
  finance: [{ label: 'Accounting & Payments', fnIds: ['accounting'] }],
  compliance: [{ label: 'Compliance & Legal', fnIds: ['compliance-legal'] }],
  hr: [{ label: 'HR & Recruiting', fnIds: ['hr-recruiting'] }],
  'customer-support-area': [
    { label: 'Customer Support', fnIds: ['customer-support'] },
    { label: 'Tech Operations', fnIds: ['tech-ops'] },
  ],
  'operations-area': [
    { label: 'Business Ops', fnIds: ['business-ops'] },
    { label: 'Reporting & Tools', fnIds: ['reporting', 'platforms-tools'] },
  ],
}

function normalizeKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
}

function makeIdMap(ids) {
  const out = Object.create(null)
  for (const id of ids || []) {
    if (!id) continue
    out[id] = true
  }
  return out
}

const EXPLICIT_HEADS_BY_NODE = {
  sales: ['orlin simovonyan'],
  accounting: ['rodoula xenofontos'],
  'marketing-ops': ['chrystalla zezou'],
  'affiliates-ib': ['emanuele braha', 'stefan popovski'],
  'customer-support': ['tamara popovic yakimov'],
  risk: ['chris psomas'],
  mt5: ['chris psomas'],
}

function isHeadTitle(title) {
  const t = normalizeKey(title)
  return t.startsWith('head of') || t.includes(' head of ')
}

function isHeadForNode(nodeId, person) {
  const nk = normalizeKey(person?.name)
  const explicit = EXPLICIT_HEADS_BY_NODE[nodeId] || []
  if (explicit.includes(nk)) return true
  return isHeadTitle(person?.title)
}

function sortPeople(a, b) {
  const ah = a?.isHead ? 1 : 0
  const bh = b?.isHead ? 1 : 0
  if (ah !== bh) return bh - ah
  return String(a?.name || '').localeCompare(String(b?.name || ''))
}

function isInternalRoleEligible(sectionId, role) {
  // Do not infer or reinterpret. Skip non-person placeholders / area-layer summaries.
  if (!role) return false
  const name = String(role.name || '')
  const title = String(role.title || '')

  if (sectionId === 'area-responsibility') return false

  if (name.includes('(Area)')) return false
  if (normalizeKey(name).includes(' scope')) return false
  if (normalizeKey(title).includes('scope')) return false

  return Boolean(name.trim())
}

function mapInternalRoleToPublicNode(sectionId, role) {
  const name = normalizeKey(role?.name)
  const department = normalizeKey(role?.department)
  const division = normalizeKey(role?.division)
  const title = normalizeKey(role?.title)

  // Manual, explicit placements requested (do not change structure)
  if (name === 'emanuele braha') {
    // Affiliate Manager role → Affiliates & IB
    return { kind: 'node', nodeId: 'affiliates-ib' }
  }
  if (name === 'ivana jelic' || name === 'nevena planic') {
    // Requested: Technology-side support (systems/users) — place under Tech Operations
    return { kind: 'node', nodeId: 'tech-ops' }
  }
  if (name === 'renato pezzi') {
    // Requested: keep on Board, and also show in Prop Trading (explicit duplication allowed)
    return { kind: 'node', nodeId: 'prop', alsoGovernance: true }
  }
  if (name === 'paolo vullo') {
    return { kind: 'node', nodeIds: ['business-ops', 'reporting', 'platforms-tools'] }
  }
  if (name === 'chris psomas') {
    return { kind: 'node', nodeIds: ['mt5', 'risk'] }
  }
  if (name === 'daniel taddei') {
    return { kind: 'node', nodeId: 'marketing-ops' }
  }
  if (name === 'orlin simovonyan' || name === 'orlin savov') {
    // Requested: Orlin is the Sales Manager (show under Sales for board clarity)
    return { kind: 'node', nodeId: 'sales' }
  }

  // Governance / Founders (kept at top of public chart)
  if (
    department === 'shareholder' ||
    title.includes('shareholder') ||
    title.includes('non executive director')
  ) {
    return { kind: 'governance' }
  }

  // Fixed mapping: people are mapped to the existing public structure.
  // If a role touches multiple areas, assign to primary operational area by deterministic rules.
  if (sectionId === 'support-team') return { kind: 'node', nodeId: 'customer-support' }
  if (sectionId === 'payments') return { kind: 'node', nodeId: 'accounting' }
  if (sectionId === 'compliance') return { kind: 'node', nodeId: 'compliance-legal' }
  if (sectionId === 'dealing') return { kind: 'node', nodeId: 'dealing' }

  if (sectionId === 'business-development') {
    if (department.includes('retention')) return { kind: 'node', nodeId: 'retention' }
    if (department.includes('dubai')) return { kind: 'node', nodeId: 'mena' }
    return { kind: 'node', nodeId: 'sales' }
  }

  if (sectionId === 'affiliation') {
    return { kind: 'node', nodeId: 'affiliates-ib' }
  }

  if (sectionId === 'marketing') {
    if (department === 'support team') return { kind: 'node', nodeId: 'customer-support' }
    return { kind: 'node', nodeId: 'marketing-ops' }
  }

  if (sectionId === 'finance') {
    return { kind: 'node', nodeId: 'accounting' }
  }

  if (sectionId === 'operations' || sectionId === 'management-team') {
    if (department === 'hr') return { kind: 'node', nodeId: 'hr-recruiting' }
    if (department === 'support team') return { kind: 'node', nodeId: 'customer-support' }
    if (department === 'psp') return { kind: 'node', nodeId: 'accounting' }
    if (department === 'dealing') return { kind: 'node', nodeId: 'dealing' }
    if (department === 'affiliate manager') return { kind: 'node', nodeId: 'affiliates-ib' }
    if (division === 'technology' || department === 'technology')
      return { kind: 'node', nodeId: 'tech-ops' }
    return { kind: 'node', nodeId: 'business-ops' }
  }

  return { kind: 'node', nodeId: 'business-ops' }
}

function getNodeLines(node) {
  const lines = []
  if (node?.head) lines.push(`Area head: ${node.head}`)
  if (node?.lead) lines.push(`Function lead: ${node.lead}`)
  return lines.filter(Boolean)
}

function buildPublicNodeLabelLookup(tree) {
  const out = new Map()
  const group = tree?.children?.find((c) => c?.id === 'macro-areas')
  for (const area of group?.children || []) {
    const areaId = area?.id
    for (const fn of area?.children || []) {
      const labelKey = normalizeKey(fn?.label)
      if (labelKey) out.set(labelKey, { nodeId: fn?.id, areaId })
      const idKey = normalizeKey(fn?.id)
      if (idKey) out.set(idKey, { nodeId: fn?.id, areaId })
    }
  }
  return out
}

export default function ShareOrgChartTrueTree() {
  const [mode, setMode] = useState(VIEW_MODES.structure)
  const [selectedAreaId, setSelectedAreaId] = useState('revenue')
  const [peoplePayload, setPeoplePayload] = useState(null)
  const [peopleLoadError, setPeopleLoadError] = useState(null)
  const [spotlight, setSpotlight] = useState(null)
  const pillarsWrapRef = useRef(null)
  const macroAreaRefs = useRef(Object.create(null))

  useEffect(() => {
    track('page_view', { page: 'ShareOrgChartTrueTree', access: 'public' })
  }, [])

  useEffect(() => {
    trackPublicShareOpen({
      kind: 'org_chart',
      token: null,
      generatedAt: null,
      extra: { variant: 'true_tree' },
    })
  }, [])

  const governance = ORG_TREE.children.find((c) => c.id === 'governance')
  const macroGroup = ORG_TREE.children.find((c) => c.id === 'macro-areas')
  const macroAreas = macroGroup?.children || []

  useEffect(() => {
    if (!macroAreas.length) return
    if (!macroAreas.some((area) => area.id === selectedAreaId)) {
      setSelectedAreaId(macroAreas[0].id)
    }
  }, [macroAreas, selectedAreaId])

  const publicNodeLookup = useMemo(() => buildPublicNodeLabelLookup(ORG_TREE), [])

  const setSpotlightFromPayload = (payload) => {
    if (!payload) {
      setSpotlight(null)
      return
    }

    if (payload.kind === 'function') {
      const nodeId = payload.nodeId
      const areaId = payload.areaId
      setSpotlight({
        kind: 'function',
        label: payload.label || '',
        relatedNodeIdMap: makeIdMap([nodeId]),
        relatedAreaIdMap: makeIdMap([areaId]),
        highlightBridge: false,
      })
      return
    }

    if (payload.kind === 'area') {
      const areaId = payload.areaId
      setSpotlight({
        kind: 'area',
        label: payload.label || '',
        relatedNodeIdMap: makeIdMap([]),
        relatedAreaIdMap: makeIdMap([areaId]),
        highlightBridge: false,
      })
      return
    }

    if (payload.kind === 'bridge') {
      setSpotlight({
        kind: 'bridge',
        label: payload.label || 'Sales ↔ Customer Support',
        relatedNodeIdMap: makeIdMap(['sales', 'customer-support']),
        relatedAreaIdMap: makeIdMap([
          publicNodeLookup.get(normalizeKey('sales'))?.areaId,
          publicNodeLookup.get(normalizeKey('customer-support'))?.areaId,
        ]),
        highlightBridge: true,
      })
      return
    }

    if (payload.kind === 'person' && payload.person) {
      const person = payload.person
      const personNameKey = normalizeKey(person?.name)
      const relatedNodeIds = []
      const relatedAreaIds = []

      if (payload.hostNodeId) relatedNodeIds.push(payload.hostNodeId)
      if (payload.hostAreaId) relatedAreaIds.push(payload.hostAreaId)

      const targets = Array.isArray(person?.facilitatorFor) ? person.facilitatorFor : []
      for (const t of targets) {
        const hit = publicNodeLookup.get(normalizeKey(t))
        if (hit?.nodeId) relatedNodeIds.push(hit.nodeId)
        if (hit?.areaId) relatedAreaIds.push(hit.areaId)
      }

      const bridgeTargets = new Set(relatedNodeIds.map((x) => normalizeKey(x)))
      const highlightBridge = bridgeTargets.has('sales') && bridgeTargets.has('customer-support')

      setSpotlight({
        kind: 'person',
        label: String(person?.name || ''),
        personNameKey,
        relatedNodeIdMap: makeIdMap(Array.from(new Set(relatedNodeIds.filter(Boolean)))),
        relatedAreaIdMap: makeIdMap(Array.from(new Set(relatedAreaIds.filter(Boolean)))),
        highlightBridge,
      })
      return
    }

    setSpotlight(null)
  }

  useEffect(() => {
    if (mode !== VIEW_MODES.people) return
    if (peoplePayload) return

    let cancelled = false
    setPeopleLoadError(null)

    async function loadPeople() {
      try {
        // Try to fetch live data from Google Sheets first
        try {
          const sheetData = await fetchOrgChartFromGoogleSheets()
          if (!cancelled && sheetData?.sections?.length) {
            // Successfully loaded from Google Sheets
            if (!cancelled) setPeoplePayload(sheetData)
            return
          }
        } catch (sheetError) {
          // Google Sheets fetch failed or returned no data — fall back to static JSON
          console.warn(
            'Google Sheets fetch failed, falling back to static data:',
            sheetError?.message
          )
        }

        // Fall back to static JSON export
        const res = await fetch('/share/org-chart-people.json', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Failed to load people data (${res.status})`)
        }
        const json = await res.json()
        if (!cancelled) setPeoplePayload(json)
      } catch (e) {
        if (!cancelled) setPeopleLoadError(e)
      }
    }

    loadPeople()
    return () => {
      cancelled = true
    }
  }, [mode, peoplePayload])

  const peopleIndex = useMemo(() => {
    const byNode = {}
    const byArea = {}
    const governancePeople = []
    const facilitators = []

    // Pass 1: detect facilitators across ALL occurrences of the same person.
    const facilitatorNames = new Set()
    const facilitatorMetaByName = new Map()

    for (const section of peoplePayload?.sections || []) {
      const sectionId = section?.id
      for (const role of section?.roles || []) {
        if (!isInternalRoleEligible(sectionId, role)) continue

        const name = String(role.name || '').trim()
        const nk = normalizeKey(name)
        const crossTeamRole = String(role.crossTeamRole || '').trim()
        const facilitatorFor = Array.isArray(role.facilitatorFor)
          ? role.facilitatorFor.filter(Boolean)
          : []

        const isFacilitator =
          normalizeKey(crossTeamRole) === 'facilitator' || facilitatorFor.length > 0
        if (!isFacilitator) continue

        facilitatorNames.add(nk)
        const prev = facilitatorMetaByName.get(nk) || { crossTeamRole: '', facilitatorFor: [] }
        const mergedFor = Array.from(new Set([...(prev.facilitatorFor || []), ...facilitatorFor]))
        facilitatorMetaByName.set(nk, {
          crossTeamRole: prev.crossTeamRole || crossTeamRole,
          facilitatorFor: mergedFor,
        })
      }
    }

    // Pass 2: map each person once into the public structure.
    const seenByName = new Set()

    for (const section of peoplePayload?.sections || []) {
      const sectionId = section?.id
      for (const role of section?.roles || []) {
        if (!isInternalRoleEligible(sectionId, role)) continue

        const name = String(role.name || '').trim()
        let roleTitle = String(role.title || '').trim()
        const nk = normalizeKey(name)
        if (nk === 'ivana jelic') roleTitle = 'Tech Operations (Systems)'
        if (nk === 'nevena planic') roleTitle = 'Tech Operations (User Provisioning)'

        if (seenByName.has(nk)) continue
        seenByName.add(nk)

        const mapped = mapInternalRoleToPublicNode(sectionId, role)
        const facilitatorMeta = facilitatorMetaByName.get(nk)
        const isFacilitator = facilitatorNames.has(nk)

        const person = {
          name,
          title: roleTitle,
          crossTeamRole: facilitatorMeta?.crossTeamRole ? facilitatorMeta.crossTeamRole : undefined,
          facilitatorFor: facilitatorMeta?.facilitatorFor?.length
            ? facilitatorMeta.facilitatorFor
            : undefined,
          isFacilitator,
        }

        if (person.isFacilitator) {
          // Fallback placement for facilitators without explicit targets.
          let fallbackAreaId = null
          if (mapped?.kind === 'area' && mapped?.areaId) fallbackAreaId = mapped.areaId
          if (!fallbackAreaId && mapped?.kind === 'node' && mapped?.nodeId) {
            fallbackAreaId = publicNodeLookup.get(normalizeKey(mapped.nodeId))?.areaId || null
          }
          if (!fallbackAreaId && mapped?.kind === 'node' && Array.isArray(mapped?.nodeIds)) {
            const firstId = mapped.nodeIds.find(Boolean)
            if (firstId)
              fallbackAreaId = publicNodeLookup.get(normalizeKey(firstId))?.areaId || null
          }

          facilitators.push({
            ...person,
            facilitatorFallbackAreaId: fallbackAreaId || undefined,
          })
          continue
        }

        if (mapped?.alsoGovernance) {
          const nkGov = normalizeKey(person.name)
          if (nkGov !== 'filippo' && nkGov !== 'filippo de rosa') {
            governancePeople.push(person)
          }
        }

        if (mapped.kind === 'governance') {
          // Requested: remove specific people from founders list
          const nk = normalizeKey(person.name)
          if (nk !== 'filippo' && nk !== 'filippo de rosa') {
            governancePeople.push(person)
          }
          continue
        }

        if (mapped.kind === 'area') {
          const areaId = mapped.areaId
          if (areaId) {
            if (!byArea[areaId]) byArea[areaId] = []
            const withHead = { ...person, isHead: isHeadForNode(areaId, person) }
            byArea[areaId].push(withHead)
          }
          continue
        }

        const nodeId = mapped.nodeId
        const nodeIds = Array.isArray(mapped.nodeIds) ? mapped.nodeIds : null

        if (nodeIds && nodeIds.length) {
          for (const id of nodeIds) {
            if (!id) continue
            if (!byNode[id]) byNode[id] = []
            const withHead = { ...person, isHead: isHeadForNode(id, person) }
            byNode[id].push(withHead)
          }
          continue
        }

        if (!nodeId) continue
        if (!byNode[nodeId]) byNode[nodeId] = []
        const withHead = { ...person, isHead: isHeadForNode(nodeId, person) }
        byNode[nodeId].push(withHead)
      }
    }

    // Stable ordering
    for (const k of Object.keys(byNode)) byNode[k].sort(sortPeople)
    for (const k of Object.keys(byArea)) byArea[k].sort(sortPeople)
    governancePeople.sort((a, b) => a.name.localeCompare(b.name))
    facilitators.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))

    return { byNode, byArea, governancePeople, facilitators }
  }, [peoplePayload, publicNodeLookup])

  const salesSupportBridgeFacilitators = useMemo(() => {
    const list = (peopleIndex.facilitators || []).filter((p) => p && p.name && p.title)
    const out = []
    const seen = new Set()

    for (const p of list) {
      const targets = Array.isArray(p.facilitatorFor) ? p.facilitatorFor : []
      const hasSales = targets.some((t) => normalizeKey(t) === 'sales')
      const hasSupport = targets.some((t) => normalizeKey(t) === 'customer support')
      if (!hasSales || !hasSupport) continue

      const k = `${normalizeKey(p.name)}|${normalizeKey(p.title)}`
      if (seen.has(k)) continue
      seen.add(k)
      out.push(p)
    }

    out.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
    return out
  }, [peopleIndex.facilitators])

  const salesSupportBridgeFacilitatorKeys = useMemo(() => {
    const s = new Set()
    for (const p of salesSupportBridgeFacilitators || []) {
      if (!p?.name || !p?.title) continue
      s.add(`${normalizeKey(p.name)}|${normalizeKey(p.title)}`)
    }
    return s
  }, [salesSupportBridgeFacilitators])

  const paoloVulloPerson = useMemo(() => {
    const pools = [
      ...(peopleIndex.byNode?.['business-ops'] || []),
      ...(peopleIndex.byNode?.reporting || []),
      ...(peopleIndex.byNode?.['platforms-tools'] || []),
    ]

    return pools.find((p) => normalizeKey(p?.name) === 'paolo vullo') || null
  }, [peopleIndex.byNode])

  const facilitatorsByArea = useMemo(() => {
    const out = {
      revenue: [],
      affiliates: [],
      'trading-risk': [],
      marketing: [],
      finance: [],
      compliance: [],
      hr: [],
      'customer-support-area': [],
      'operations-area': [],
    }

    const seen = new Set()

    for (const p of peopleIndex.facilitators || []) {
      if (!p?.name || !p?.title) continue
      if (
        salesSupportBridgeFacilitatorKeys.has(`${normalizeKey(p.name)}|${normalizeKey(p.title)}`)
      ) {
        continue
      }

      const targets = Array.isArray(p.facilitatorFor) ? p.facilitatorFor : []
      const areaIds = new Set()
      for (const t of targets) {
        const hit = publicNodeLookup.get(normalizeKey(t))
        if (hit?.areaId) areaIds.add(hit.areaId)
      }

      if (!areaIds.size && p.facilitatorFallbackAreaId) {
        areaIds.add(p.facilitatorFallbackAreaId)
      }

      for (const areaId of areaIds) {
        if (!out[areaId]) continue
        const key = `${areaId}|${normalizeKey(p.name)}|${normalizeKey(p.title)}`
        if (seen.has(key)) continue
        seen.add(key)
        out[areaId].push(p)
      }
    }

    for (const k of Object.keys(out)) {
      out[k].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
    }

    return out
  }, [peopleIndex.facilitators, publicNodeLookup, salesSupportBridgeFacilitatorKeys])

  const showPeople = mode === VIEW_MODES.people || mode === VIEW_MODES.department
  const isPeopleLoading = showPeople && !peoplePayload && !peopleLoadError
  const isPeopleError = showPeople && Boolean(peopleLoadError)
  const governanceDisplayCount = 3
  const governanceSeatsToShow = (governance?.children || []).slice(0, governanceDisplayCount)
  const governancePeopleToShow = (peopleIndex.governancePeople || []).slice(
    0,
    governanceDisplayCount
  )

  // Inject people into departments.
  const macroAreasPopulated = useMemo(() => {
    const attach = (area) => {
      if (!area) return area
      return {
        ...area,
        people: peopleIndex.byArea?.[area.id] || [],
        showPeople,
        children: (area.children || []).map((fn) => ({
          ...fn,
          people: peopleIndex.byNode?.[fn.id] || [],
          showPeople,
        })),
      }
    }
    return (macroAreas || []).map(attach)
  }, [macroAreas, peopleIndex, showPeople])

  const selectedArea = useMemo(
    () =>
      macroAreasPopulated.find((area) => area.id === selectedAreaId) ||
      macroAreasPopulated[0] ||
      null,
    [macroAreasPopulated, selectedAreaId]
  )

  const viewSummary =
    mode === VIEW_MODES.department && selectedArea
      ? `${VIEW_MODE_META[mode].description} · ${selectedArea.label}`
      : VIEW_MODE_META[mode].description

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-700 text-gray-100">
      <ViewModeDock mode={mode} onChange={setMode} />

      {/* Fixed logo top-left */}
      <a href="/" className="fixed left-5 top-5 z-20" aria-label="Bullwaves">
        <img src="/Logo.png" alt="Bullwaves" className="h-7 w-auto opacity-95" />
      </a>

      <div className="mx-auto max-w-[140rem] px-3 sm:px-4 md:px-6 2xl:px-10 pt-10 pb-6">
        <header className="flex flex-col items-center text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Company Organizational Chart
          </h1>
          <p className="mt-2 text-sm text-gray-400">{viewSummary}</p>

          {showPeople ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-gray-300/25 text-gray-200/80 bg-gray-900/20">
                  Head
                </span>
                <span>Operational head</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex items-center rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-brand-400 text-brand-100/90 bg-brand-900/15">
                  Facilitator
                </span>
                <span>Cross-team coordination</span>
              </span>
            </div>
          ) : null}

          {showPeople ? (
            <p className="mt-2 text-xs text-gray-500">
              {isPeopleLoading
                ? 'Loading people…'
                : isPeopleError
                  ? 'People unavailable (public view stays private)'
                  : 'Names + role titles only · No emails'}
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">No people · Structure only</p>
          )}
        </header>

        <main className="mt-12" aria-label="Organizational tree">
          <div
            className={
              mode === VIEW_MODES.department
                ? 'grid grid-cols-1 xl:grid-cols-[13rem_minmax(0,1fr)] gap-6 xl:gap-8 items-start'
                : ''
            }
          >
            {mode === VIEW_MODES.department ? (
              <DepartmentSidebar
                areas={macroAreasPopulated}
                selectedAreaId={selectedArea?.id}
                onSelect={setSelectedAreaId}
              />
            ) : null}

            <div className="flex flex-col items-center">
              {/* ROOT — hidden in department focus */}
              {mode !== VIEW_MODES.department && (
                <>
                  <div className="flex flex-col items-center">
                    <div
                      className="rounded-2xl border border-gray-600/80 bg-gray-900/40 px-6 py-4 backdrop-blur-md"
                      aria-label={ORG_TREE.label}
                    >
                      <img
                        src="/Logo.png"
                        alt={ORG_TREE.label}
                        className="h-10 w-auto opacity-95"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <VLine h={36} className="bg-gray-500/40" />
                  </div>
                </>
              )}

              {/* LEVEL 1 — GOVERNANCE (hidden in department focus) */}
              {mode !== VIEW_MODES.department && (
                <div className="w-full max-w-6xl">
                  <div className="flex justify-center md:hidden">
                    <div className="px-3 py-1 rounded-full border border-gray-500/30 bg-gray-900/70 text-[11px] text-gray-300">
                      {governance?.label || 'Founders'}
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <div className="relative w-full">
                      <HLine className="w-full" />
                      <div className="absolute left-0 -top-3 px-3 py-1 rounded-full border border-gray-500/30 bg-gray-900/70 text-[11px] text-gray-300">
                        {governance?.label || 'Founders'}
                      </div>
                    </div>
                    {!showPeople ? (
                      <div className="grid grid-cols-3 gap-6">
                        {governanceSeatsToShow.map((seat) => (
                          <div key={`seat-stub-${seat.id}`} className="flex justify-center">
                            <VLine h={18} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-3">
                    {showPeople
                      ? (isPeopleLoading
                          ? Array.from({ length: governanceDisplayCount }, (_, idx) => ({
                              name: 'Loading…',
                              title: idx === 0 ? 'Fetching people data' : '',
                            }))
                          : governancePeopleToShow
                        ).map((p, idx) => (
                          <div key={`gov-card-${idx}-${p.name}-${p.title}`} className="min-w-0">
                            {(() => {
                              const fp = formatPersonText(p, { maxTitleLen: 30 })
                              const line = fp.shortenedTitle
                                ? [{ text: fp.shortenedTitle, title: fp.titleTooltip }]
                                : []
                              return (
                                <Card
                                  title={fp.displayName}
                                  lines={p.title ? line : []}
                                  accentDotClass={ACCENTS.governance}
                                  size="md"
                                />
                              )
                            })()}
                          </div>
                        ))
                      : governanceSeatsToShow.map((seat) => (
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
              )}

              {mode !== VIEW_MODES.department && (
                <div className="flex justify-center">
                  <VLine h={40} className="bg-gray-500/40" />
                </div>
              )}

              {mode === VIEW_MODES.department ? (
                <div className="w-full max-w-[110rem] rounded-[24px] border border-dashed border-brand-400/35 bg-white/[0.03] p-4 md:p-6 overflow-hidden">
                  <DepartmentFocusPanel
                    area={selectedArea}
                    facilitators={facilitatorsByArea?.[selectedArea?.id] || []}
                    spotlight={spotlight}
                    onSpotlight={setSpotlightFromPayload}
                    onClearSpotlight={() => setSpotlight(null)}
                    isPeopleLoading={isPeopleLoading}
                    isPeopleError={isPeopleError}
                  />
                </div>
              ) : (
                <>
                  <div className="w-full max-w-[160rem]">
                    <div className={showPeople ? 'hidden' : 'hidden xl:block'}>
                      <HLine className="w-full" />
                      <div className="grid grid-cols-9 gap-4">
                        {macroAreasPopulated.map((a) => (
                          <div key={`macro-stub-${a.id}`} className="flex justify-center">
                            <VLine h={18} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div ref={pillarsWrapRef} className="relative mt-3">
                      <div
                        className={
                          'relative z-0 grid ' +
                          (showPeople
                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 2xl:gap-5'
                            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 2xl:gap-5')
                        }
                        style={{ alignItems: 'start' }}
                      >
                        {macroAreasPopulated.map((area) => {
                          const areaRef =
                            macroAreaRefs.current[area.id] ||
                            (macroAreaRefs.current[area.id] = React.createRef())
                          return (
                            <MacroAreaColumn
                              key={area.id}
                              area={area}
                              facilitators={facilitatorsByArea?.[area.id] || []}
                              spotlight={spotlight}
                              onSpotlight={setSpotlightFromPayload}
                              onClearSpotlight={() => setSpotlight(null)}
                              containerRef={areaRef}
                            />
                          )
                        })}
                      </div>

                      <SpotlightAreaConnections
                        containerRef={pillarsWrapRef}
                        areaRefs={macroAreaRefs.current}
                        spotlight={spotlight}
                      />
                    </div>

                    <div className="mt-10">
                      {showPeople && salesSupportBridgeFacilitators.length ? (
                        <div className="mt-10">
                          <SalesSupportFacilitatorBridge
                            people={salesSupportBridgeFacilitators}
                            spotlight={spotlight}
                            onSpotlight={setSpotlightFromPayload}
                            onClearSpotlight={() => setSpotlight(null)}
                          />
                        </div>
                      ) : null}

                      <div className="relative mt-12 w-full">
                        <div className="border-t border-dashed border-brand-400" />
                        {showPeople && paoloVulloPerson
                          ? (() => {
                              const fp = formatPersonText(paoloVulloPerson, { maxTitleLen: 32 })
                              return (
                                <div className="absolute left-6 -top-7 min-w-[12rem] max-w-[14rem] rounded-xl border border-brand-400 bg-gray-900/70 px-3 py-2">
                                  <div
                                    className="text-[11px] font-semibold text-gray-100 leading-snug"
                                    title={fp.displayName}
                                  >
                                    {fp.displayName}
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-gray-400 leading-snug min-w-0">
                                    <span className="min-w-0 break-normal" title={fp.titleTooltip}>
                                      {fp.shortenedTitle || fp.fullTitle}
                                    </span>
                                  </div>
                                </div>
                              )
                            })()
                          : null}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 py-1 rounded-full border border-brand-400 bg-gray-900/70 text-[11px] text-gray-300 whitespace-nowrap">
                          Operations as a Servant Organization (Agile Model)
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        <footer className="mt-12 flex justify-center">
          <div className="text-xs text-gray-400 border border-gray-600/80 bg-gray-700/35 rounded-full px-4 py-2">
            {showPeople
              ? 'Public view: people + roles · No emails / no personal metadata'
              : 'Public view: structure only · No people'}
          </div>
        </footer>
      </div>
    </div>
  )
}

function DepartmentFocusPanel({
  area,
  facilitators = [],
  spotlight,
  onSpotlight,
  onClearSpotlight,
  isPeopleLoading = false,
  isPeopleError = false,
}) {
  if (!area) {
    return (
      <div className="rounded-xl border border-gray-600/40 bg-gray-900/35 px-4 py-6 text-center text-sm text-gray-400">
        Department not available.
      </div>
    )
  }

  const DEPT_STYLES = {
    revenue: {
      accent: ACCENTS.revenue,
      border: BORDERS.revenue,
      icon: 'text-indigo-200/70',
      head: 'border-indigo-300/25 text-indigo-200/80 bg-indigo-950/20',
    },
    affiliates: {
      accent: ACCENTS.affiliates,
      border: BORDERS.affiliates,
      icon: 'text-orange-200/70',
      head: 'border-orange-300/25 text-orange-200/80 bg-orange-950/20',
    },
    'trading-risk': {
      accent: ACCENTS.trading,
      border: BORDERS.trading,
      icon: 'text-amber-200/70',
      head: 'border-amber-300/25 text-amber-200/80 bg-amber-950/20',
    },
    marketing: {
      accent: ACCENTS.marketing,
      border: BORDERS.marketing,
      icon: 'text-pink-200/70',
      head: 'border-pink-300/25 text-pink-200/80 bg-pink-950/20',
    },
    finance: {
      accent: ACCENTS.finance,
      border: BORDERS.finance,
      icon: 'text-teal-200/70',
      head: 'border-teal-300/25 text-teal-200/80 bg-teal-950/20',
    },
    compliance: {
      accent: ACCENTS.compliance,
      border: BORDERS.compliance,
      icon: 'text-slate-200/70',
      head: 'border-slate-300/25 text-slate-200/80 bg-slate-900/20',
    },
    hr: {
      accent: ACCENTS.hr,
      border: BORDERS.hr,
      icon: 'text-violet-200/70',
      head: 'border-violet-300/25 text-violet-200/80 bg-violet-950/20',
    },
    'customer-support-area': {
      accent: ACCENTS.support,
      border: BORDERS.support,
      icon: 'text-sky-200/70',
      head: 'border-sky-300/25 text-sky-200/80 bg-sky-950/20',
    },
    'operations-area': {
      accent: ACCENTS.operations,
      border: BORDERS.operations,
      icon: 'text-gray-200/70',
      head: 'border-gray-300/25 text-gray-200/80 bg-gray-900/20',
    },
  }
  const s = DEPT_STYLES[area.id] || {
    accent: ACCENTS.operations,
    border: BORDERS.operations,
    icon: 'text-gray-200/70',
    head: 'border-gray-300/25 text-gray-200/80 bg-gray-900/20',
  }

  const childrenById = new Map()
  for (const fn of area.children || []) {
    if (fn?.id) childrenById.set(fn.id, fn)
  }
  const clusters = HUB_CLUSTERS[area.id] || [
    { label: 'Team', fnIds: (area.children || []).map((c) => c?.id).filter(Boolean) },
  ]
  const clustersWithPeople = clusters.map((cluster) => ({
    ...cluster,
    people: cluster.fnIds.flatMap((fnId) => {
      const fn = childrenById.get(fnId)
      return (fn?.people || []).filter((p) => p?.name && p?.title)
    }),
  }))

  const safeFacilitators = (facilitators || []).filter((p) => p && p.name && p.title)
  const totalPeople = clustersWithPeople.reduce((sum, c) => sum + c.people.length, 0)
  const hasRenderablePeople = totalPeople > 0 || safeFacilitators.length > 0

  return (
    <div className="w-full max-w-[110rem]">
      {/* Department header */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-gray-600/40 bg-gray-900/60 px-5 py-3">
        <span className={s.icon}>
          <MacroIcon kind={area.icon} />
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold text-gray-100">{area.label}</span>
          <FounderBadges areaId={area.id} />
        </div>
        {totalPeople > 0 && (
          <span className="ml-auto text-[11px] text-gray-500 flex-shrink-0">
            {totalPeople} members
          </span>
        )}
      </div>

      {!hasRenderablePeople ? (
        <div className="mb-4 rounded-xl border border-gray-600/40 bg-gray-900/35 px-4 py-3 text-xs text-gray-300">
          {isPeopleLoading
            ? 'Loading people for this department...'
            : isPeopleError
              ? 'People data unavailable right now for this department.'
              : 'No people mapped to this department yet.'}
        </div>
      ) : null}

      {/* Facilitators row */}
      {safeFacilitators.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Facilitators
          </div>
          <div className="flex flex-wrap gap-2">
            {safeFacilitators.map((p) => {
              const fp = formatPersonText(p, { maxTitleLen: 28 })
              const isActive = Boolean(spotlight)
              const isPersonHighlighted =
                isActive && spotlight?.personNameKey === normalizeKey(p?.name)
              const shouldDim = isActive && !isPersonHighlighted
              return (
                <div
                  key={`fac-${area.id}-${p.name}`}
                  className={
                    'rounded-xl border border-dashed border-brand-400 bg-gray-900/30 px-3 py-2 transition-opacity ' +
                    (shouldDim ? 'opacity-30' : 'opacity-100')
                  }
                  onMouseEnter={() =>
                    onSpotlight?.({ kind: 'person', person: p, hostAreaId: area.id })
                  }
                  onMouseLeave={() => onClearSpotlight?.()}
                >
                  <div className="text-[11px] font-semibold leading-snug text-gray-100">
                    {fp.displayName}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-snug text-gray-400">
                    {fp.shortenedTitle || fp.fullTitle}
                  </div>
                  <span className="mt-1 inline-flex items-center rounded-full border border-dashed border-brand-400 bg-brand-900/15 px-1.5 py-0.5 text-[8px] font-semibold tracking-wide text-brand-100/90">
                    Facilitator
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Horizontal clusters */}
      <div className="flex gap-4 items-start flex-wrap xl:flex-nowrap">
        {clustersWithPeople.map((cluster) => (
          <div key={cluster.label} className="flex-1 min-w-[12rem]">
            <div className="mb-3 flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${s.accent}`} />
              <span className="text-[11px] font-semibold text-gray-300">{cluster.label}</span>
              <span className="ml-auto text-[10px] text-gray-600">{cluster.people.length}</span>
            </div>
            <div className={`rounded-xl border ${s.border} bg-white/[0.015] p-3`}>
              {cluster.people.length > 0 ? (
                <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(12rem,1fr))]">
                  {cluster.people.map((p) => {
                    const fp = formatPersonText(p, { maxTitleLen: 26 })
                    const isActive = Boolean(spotlight)
                    const isPersonHighlighted =
                      isActive && spotlight?.personNameKey === normalizeKey(p?.name)
                    const shouldDim = isActive && !isPersonHighlighted
                    const shouldRing = isActive && isPersonHighlighted
                    return (
                      <div
                        key={`${cluster.label}-${p.name}-${p.title}`}
                        className={
                          'cursor-default rounded-lg border px-3 py-2 transition-opacity ' +
                          (p.isHead
                            ? 'border-gray-500/60 bg-gray-900/50'
                            : 'border-gray-600/40 bg-gray-900/30') +
                          (shouldDim ? ' opacity-30' : '') +
                          (shouldRing ? ' ring-2 ring-brand-400/50' : '')
                        }
                        onMouseEnter={() =>
                          onSpotlight?.({ kind: 'person', person: p, hostAreaId: area.id })
                        }
                        onMouseLeave={() => onClearSpotlight?.()}
                      >
                        <div
                          className={
                            'text-[11px] leading-snug ' +
                            (p.isHead ? 'font-bold text-white' : 'font-semibold text-gray-100')
                          }
                        >
                          {fp.displayName}
                        </div>
                        <div className="mt-0.5 text-[10px] leading-snug text-gray-400">
                          {fp.shortenedTitle || fp.fullTitle}
                        </div>
                        {p.isHead ? (
                          <span
                            className={
                              'mt-1 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[8px] font-semibold tracking-wide ' +
                              s.head
                            }
                          >
                            Head
                          </span>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-2 text-center text-[11px] text-gray-600">—</div>
              )}
            </div>
          </div>
        ))}
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

  if (kind === 'affiliates') {
    return (
      <svg {...common}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }

  if (kind === 'marketing') {
    return (
      <svg {...common}>
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
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

  // corporate / finance
  if (kind === 'corporate' || kind === 'finance') {
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

  if (kind === 'compliance') {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    )
  }

  if (kind === 'hr') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M17 13l2 2 4-4" />
      </svg>
    )
  }

  if (kind === 'support') {
    return (
      <svg {...common}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M12 9h.01" />
        <path d="M10 13c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2" />
      </svg>
    )
  }

  // fallback
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

function MacroAreaColumn({
  area,
  facilitators = [],
  spotlight,
  onSpotlight,
  onClearSpotlight,
  containerRef,
}) {
  if (!area) return null
  const safeAreaPeople = (area.people || []).filter((p) => p && p.name && p.title)
  const safeFacilitators = (facilitators || []).filter((p) => p && p.name && p.title)
  const [collapsedClusters, setCollapsedClusters] = useState(() => Object.create(null))

  const AREA_STYLES = {
    revenue: {
      accent: ACCENTS.revenue,
      border: BORDERS.revenue,
      icon: 'text-indigo-200/70',
      head: 'border-indigo-300/25 text-indigo-200/80 bg-indigo-950/20',
    },
    affiliates: {
      accent: ACCENTS.affiliates,
      border: BORDERS.affiliates,
      icon: 'text-orange-200/70',
      head: 'border-orange-300/25 text-orange-200/80 bg-orange-950/20',
    },
    'trading-risk': {
      accent: ACCENTS.trading,
      border: BORDERS.trading,
      icon: 'text-amber-200/70',
      head: 'border-amber-300/25 text-amber-200/80 bg-amber-950/20',
    },
    marketing: {
      accent: ACCENTS.marketing,
      border: BORDERS.marketing,
      icon: 'text-pink-200/70',
      head: 'border-pink-300/25 text-pink-200/80 bg-pink-950/20',
    },
    finance: {
      accent: ACCENTS.finance,
      border: BORDERS.finance,
      icon: 'text-teal-200/70',
      head: 'border-teal-300/25 text-teal-200/80 bg-teal-950/20',
    },
    compliance: {
      accent: ACCENTS.compliance,
      border: BORDERS.compliance,
      icon: 'text-slate-200/70',
      head: 'border-slate-300/25 text-slate-200/80 bg-slate-900/20',
    },
    hr: {
      accent: ACCENTS.hr,
      border: BORDERS.hr,
      icon: 'text-violet-200/70',
      head: 'border-violet-300/25 text-violet-200/80 bg-violet-950/20',
    },
    'customer-support-area': {
      accent: ACCENTS.support,
      border: BORDERS.support,
      icon: 'text-sky-200/70',
      head: 'border-sky-300/25 text-sky-200/80 bg-sky-950/20',
    },
    'operations-area': {
      accent: ACCENTS.operations,
      border: BORDERS.operations,
      icon: 'text-gray-200/70',
      head: 'border-gray-300/25 text-gray-200/80 bg-gray-900/20',
    },
  }
  const s = AREA_STYLES[area.id] || {
    accent: ACCENTS.operations,
    border: BORDERS.operations,
    icon: 'text-gray-200/70',
    head: 'border-gray-300/25 text-gray-200/80 bg-gray-900/20',
  }
  const accent = s.accent
  const border = s.border
  const iconTone = s.icon
  const headBadgeClass = s.head

  const childrenById = new Map()
  for (const fn of area.children || []) {
    if (fn?.id) childrenById.set(fn.id, fn)
  }
  const clusters = HUB_CLUSTERS[area.id] || [
    {
      label: 'Teams',
      fnIds: (area.children || []).map((c) => c?.id).filter(Boolean),
    },
  ]

  return (
    <div ref={containerRef} data-macro-area-id={area.id} className="flex flex-col min-w-0">
      <Card
        title={
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={iconTone} aria-hidden="true">
                <MacroIcon kind={area.icon} />
              </span>
              <span>{area.label}</span>
            </div>
            <FounderBadges areaId={area.id} className="mt-0.5" />
          </div>
        }
        lines={getNodeLines(area)}
        accentDotClass={accent}
        size="md"
        extra={
          <div>
            {area.showPeople && safeFacilitators.length ? (
              <div className="mt-2">
                <div className="text-[10px] font-semibold text-gray-400">Facilitators</div>
                <div className="mt-2 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]">
                  {safeFacilitators.map((p) =>
                    (() => {
                      const fp = formatPersonText(p, { maxTitleLen: 28 })
                      const targets = Array.isArray(p.facilitatorFor) ? p.facilitatorFor : []
                      const targetsText = targets.length ? `→ ${targets.join(' · ')}` : ''
                      const isActive = Boolean(spotlight)
                      const isAreaRelated =
                        !isActive || (area?.id && spotlight?.relatedAreaIdMap?.[area.id])
                      const isPersonHighlighted =
                        isActive && spotlight?.personNameKey === normalizeKey(p?.name)
                      const shouldDim = isActive && !isAreaRelated && !isPersonHighlighted
                      const shouldRing =
                        isActive &&
                        (isPersonHighlighted ||
                          (spotlight?.kind === 'area' &&
                            area?.id &&
                            spotlight?.relatedAreaIdMap?.[area.id]))
                      return (
                        <div
                          key={`fac-${area.id}-${p.name}-${p.title}`}
                          className={
                            'rounded-xl border border-dashed border-brand-400 bg-gray-900/30 px-3 py-2 transition-opacity ' +
                            (shouldDim ? 'opacity-30 ' : 'opacity-100 ') +
                            (shouldRing ? 'ring-2 ring-brand-400/50 ' : '')
                          }
                          onMouseEnter={() =>
                            onSpotlight?.({ kind: 'person', person: p, hostAreaId: area.id })
                          }
                          onMouseLeave={() => onClearSpotlight?.()}
                        >
                          <div className="text-[11px] leading-snug font-semibold text-gray-100">
                            <span title={fp.displayName}>{fp.displayName}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 leading-snug flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="min-w-0 flex-1 break-normal" title={fp.titleTooltip}>
                              {fp.shortenedTitle || fp.fullTitle}
                            </span>
                            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-brand-400 text-brand-100/90 bg-brand-900/15">
                              Facilitator
                            </span>
                            {targetsText ? (
                              <span className="text-[9px] text-gray-500 break-normal">
                                {targetsText}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    })()
                  )}
                </div>
              </div>
            ) : null}

            {area.showPeople && safeAreaPeople.length ? (
              <div className={(safeFacilitators.length ? 'mt-4 ' : 'mt-2 ') + 'space-y-1'}>
                <div className="text-[10px] font-semibold text-gray-400">Key roles</div>
                <div className="mt-2 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]">
                  {safeAreaPeople.map((p) =>
                    (() => {
                      const fp = formatPersonText(p, { maxTitleLen: 28 })
                      const isActive = Boolean(spotlight)
                      const isAreaRelated =
                        !isActive || (area?.id && spotlight?.relatedAreaIdMap?.[area.id])
                      const isPersonHighlighted =
                        isActive && spotlight?.personNameKey === normalizeKey(p?.name)
                      const shouldDim = isActive && !isAreaRelated && !isPersonHighlighted
                      const shouldRing =
                        isActive &&
                        (isPersonHighlighted ||
                          (spotlight?.kind === 'area' &&
                            area?.id &&
                            spotlight?.relatedAreaIdMap?.[area.id]))
                      return (
                        <div
                          key={`${area.id}-${p.name}-${p.title}`}
                          className={
                            'rounded-xl border px-3 py-2 transition-opacity ' +
                            (p.isHead
                              ? 'border-gray-600/70 bg-gray-900/45'
                              : 'border-gray-600/60 bg-gray-900/30') +
                            (shouldDim ? ' opacity-30' : '') +
                            (shouldRing ? ' ring-2 ring-brand-400/50' : '')
                          }
                          onMouseEnter={() =>
                            onSpotlight?.({ kind: 'person', person: p, hostAreaId: area.id })
                          }
                          onMouseLeave={() => onClearSpotlight?.()}
                        >
                          <div
                            className={
                              'text-[11px] leading-snug ' +
                              (p.isHead ? 'font-bold text-gray-100' : 'font-semibold text-gray-100')
                            }
                            title={fp.displayName}
                          >
                            {fp.displayName}
                          </div>
                          <div className="mt-0.5 text-[11px] text-gray-400 leading-snug flex flex-wrap items-center gap-1.5 min-w-0">
                            <span className="min-w-0 flex-1 break-normal" title={fp.titleTooltip}>
                              {fp.shortenedTitle || fp.fullTitle}
                            </span>
                            {p.isHead ? (
                              <span
                                className={
                                  'inline-flex items-center whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ' +
                                  headBadgeClass
                                }
                              >
                                Head
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    })()
                  )}
                </div>
              </div>
            ) : null}

            <div
              className={
                (area.showPeople && (safeAreaPeople.length || safeFacilitators.length)
                  ? 'mt-5 '
                  : 'mt-2 ') + 'space-y-4'
              }
            >
              {clusters.map((cluster) => {
                const fnNodes = (cluster.fnIds || [])
                  .map((id) => childrenById.get(id))
                  .filter(Boolean)
                if (!fnNodes.length) return null

                const clusterKey = normalizeKey(cluster.label)
                const isCollapsed = Boolean(collapsedClusters?.[clusterKey])
                const clusterGridId = `${area.id}-cluster-${clusterKey || 'default'}`
                return (
                  <div key={`${area.id}-${cluster.label}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-semibold text-gray-400">{cluster.label}</div>
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedClusters((prev) => ({
                            ...(prev || Object.create(null)),
                            [clusterKey]: !prev?.[clusterKey],
                          }))
                        }
                        className="text-[10px] font-semibold text-gray-400 hover:text-gray-200 rounded-full border border-gray-600/60 bg-gray-900/30 px-2 py-0.5"
                        aria-expanded={!isCollapsed}
                        aria-controls={clusterGridId}
                      >
                        {isCollapsed ? 'Expand' : 'Collapse'}
                      </button>
                    </div>

                    {!isCollapsed ? (
                      <div
                        id={clusterGridId}
                        className={
                          fnNodes.length === 1
                            ? 'mt-2 grid grid-cols-1 gap-2'
                            : 'mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-2'
                        }
                      >
                        {fnNodes.map((fn) => (
                          <SubCard
                            key={`${area.id}-${fn.id}`}
                            title={fn.label}
                            lines={getNodeLines(fn)}
                            borderClass={border}
                            headBadgeClass={headBadgeClass}
                            people={fn.people || []}
                            showPeople={Boolean(fn.showPeople)}
                            areaId={area.id}
                            nodeId={fn.id}
                            spotlight={spotlight}
                            onSpotlight={onSpotlight}
                            onClearSpotlight={onClearSpotlight}
                          />
                        ))}
                      </div>
                    ) : (
                      <div id={clusterGridId} className="sr-only" aria-hidden="true" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        }
      />
    </div>
  )
}
