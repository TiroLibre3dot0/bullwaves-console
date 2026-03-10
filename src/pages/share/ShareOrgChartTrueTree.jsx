import React, { useEffect, useMemo, useState } from 'react'
import { track, trackPublicShareOpen } from '../../utils/analytics'

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
          {lines.map((l, idx) => (
            <div
              key={
                typeof l === 'string'
                  ? `${idx}-${l}`
                  : `${idx}-${String(l?.text || l?.title || '')}`
              }
              className={
                (isSm ? 'text-xs text-slate-300' : 'text-sm text-slate-300') +
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
    <div className={`w-px bg-slate-500/35 ${className}`} style={{ height: h }} aria-hidden="true" />
  )
}

function HLine({ className = '' }) {
  return <div className={`h-px bg-slate-500/35 ${className}`} aria-hidden="true" />
}

function SubCard({
  title,
  lines = [],
  borderClass = 'border-slate-800/70',
  headBadgeClass = 'border-slate-300/25 text-slate-200/80 bg-slate-950/20',
  people = [],
  showPeople = false,
}) {
  const filtered = (lines || []).filter(Boolean)
  const safePeople = (people || []).filter((p) => p && p.name && p.title)
  const useDenseGrid = safePeople.length >= 9
  const isCustomerSupport = title === 'Customer Support'
  const useSupportGrid = isCustomerSupport && safePeople.length >= 6
  return (
    <div className={`bg-slate-900/20 border ${borderClass} rounded-xl px-3 py-2 whitespace-normal`}>
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
                      ? 'border-slate-600/55 bg-slate-950/45'
                      : 'border-slate-700/40 bg-slate-950/30') +
                    (isFacilitator ? ' border-dashed' : '')
                  )
                })()}
              >
                {(() => {
                  const fp = formatPersonText(p, { maxTitleLen: 26 })
                  return (
                    <>
                      <div
                        className={
                          'text-[11px] leading-snug ' +
                          (p.isHead ? 'font-bold text-slate-100' : 'font-semibold text-slate-100')
                        }
                        title={fp.displayName}
                      >
                        {fp.displayName}
                      </div>
                      <div
                        className={
                          (isCustomerSupport ? 'mt-0.5 text-[10px] ' : 'mt-0.5 text-[11px] ') +
                          'text-slate-400 leading-snug flex flex-wrap items-center gap-1.5 min-w-0'
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
                          <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-slate-300/20 text-slate-200/70 bg-slate-950/20">
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
          <div className="text-[10px] text-slate-500">No people mapped</div>
        )}
      </div>
    </div>
  )
}

function SalesSupportFacilitatorBridge({ people = [] }) {
  const safe = (people || []).filter((p) => p && p.name && p.title)
  if (!safe.length) return null

  return (
    <div className="relative w-full">
      <div className="border-t border-dashed border-brand-400/70" />
      <div className="absolute left-2 -top-3 text-[10px] text-brand-200/80 bg-slate-950/70 px-2 py-0.5 rounded-full border border-brand-400/45">
        Customer Support
      </div>
      <div className="absolute right-2 -top-3 text-[10px] text-brand-200/80 bg-slate-950/70 px-2 py-0.5 rounded-full border border-brand-400/45">
        Sales
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 -top-7">
        {(() => {
          const two = safe.slice(0, 2)
          const a = two[0] || null
          const b = two[1] || null
          return (
            <div className="flex items-stretch gap-8">
              {a
                ? (() => {
                    const fp = formatPersonText(a, { maxTitleLen: 28 })
                    return (
                      <div
                        key={`bridge-${a.name}-${a.title}`}
                        className="min-w-[12rem] max-w-[14rem] rounded-xl border border-dashed border-brand-400/50 bg-slate-950/70 px-3 py-2"
                      >
                        <div
                          className="text-[11px] font-semibold text-slate-100 leading-snug"
                          title={fp.displayName}
                        >
                          {fp.displayName}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400 leading-snug flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="min-w-0 flex-1 break-normal" title={fp.titleTooltip}>
                            {fp.shortenedTitle || fp.fullTitle}
                          </span>
                          <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-slate-300/20 text-slate-200/70 bg-slate-950/20">
                            Facilitator
                          </span>
                        </div>
                      </div>
                    )
                  })()
                : null}

              {a && b ? (
                <div className="flex flex-col items-center justify-center px-1">
                  <div className="text-[9px] font-semibold tracking-wide text-brand-200/80 bg-slate-950/60 px-2 py-0.5 rounded-full border border-dashed border-brand-400/45 whitespace-nowrap">
                    Interaction ↔
                  </div>
                  <div className="mt-1 flex items-center">
                    <div className="w-10 border-t border-dashed border-brand-400/65" />
                    <div className="mx-1 h-2 w-2 rounded-full bg-brand-400/75" />
                    <div className="w-10 border-t border-dashed border-brand-400/65" />
                  </div>
                </div>
              ) : null}

              {b
                ? (() => {
                    const fp = formatPersonText(b, { maxTitleLen: 28 })
                    return (
                      <div
                        key={`bridge-${b.name}-${b.title}`}
                        className="min-w-[12rem] max-w-[14rem] rounded-xl border border-dashed border-brand-400/50 bg-slate-950/70 px-3 py-2"
                      >
                        <div
                          className="text-[11px] font-semibold text-slate-100 leading-snug"
                          title={fp.displayName}
                        >
                          {fp.displayName}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400 leading-snug flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="min-w-0 flex-1 break-normal" title={fp.titleTooltip}>
                            {fp.shortenedTitle || fp.fullTitle}
                          </span>
                          <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-slate-300/20 text-slate-200/70 bg-slate-950/20">
                            Facilitator
                          </span>
                        </div>
                      </div>
                    )
                  })()
                : null}
            </div>
          )
        })()}
      </div>

      <div className="h-10" aria-hidden="true" />
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
            { id: 'platforms-tools', label: 'CRM & Tools', type: 'function' },
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

const VIEW_MODES = {
  structure: 'structure',
  people: 'people',
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

const HUB_CLUSTERS = {
  operations: [
    {
      label: 'Core Ops',
      fnIds: ['business-ops', 'payments', 'reporting', 'platforms-tools'],
    },
    { label: 'Enablement', fnIds: ['tech-ops', 'marketing-ops'] },
    { label: 'Support', fnIds: ['customer-support'] },
  ],
  revenue: [
    { label: 'Sales & Retention', fnIds: ['sales', 'retention', 'mena'] },
    { label: 'Channels', fnIds: ['affiliates-ib', 'performance'] },
  ],
  'trading-risk': [
    { label: 'Trading', fnIds: ['dealing', 'prop'] },
    { label: 'Risk & Platforms', fnIds: ['risk', 'mt5'] },
  ],
  corporate: [
    { label: 'Finance', fnIds: ['accounting'] },
    { label: 'People & Compliance', fnIds: ['hr-recruiting', 'compliance-legal'] },
  ],
}

function normalizeKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
}

const EXPLICIT_HEADS_BY_NODE = {
  // Confirmed department heads
  sales: ['orlin simovonyan'],
  accounting: ['rodoula xenofontos'],

  // Area/sub-area heads
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
    // Requested: do not show on the board; keep in Operations only
    return { kind: 'node', nodeId: 'business-ops' }
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
  if (sectionId === 'payments') return { kind: 'node', nodeId: 'payments' }
  if (sectionId === 'compliance') return { kind: 'node', nodeId: 'compliance-legal' }
  if (sectionId === 'dealing') return { kind: 'node', nodeId: 'dealing' }

  if (sectionId === 'business-development') {
    if (department.includes('retention')) return { kind: 'node', nodeId: 'retention' }
    if (department.includes('dubai')) return { kind: 'node', nodeId: 'mena' }
    return { kind: 'node', nodeId: 'sales' }
  }

  if (sectionId === 'affiliation') {
    // Keep under Affiliates & IB (do not duplicate across areas).
    return { kind: 'node', nodeId: 'affiliates-ib' }
  }

  if (sectionId === 'marketing') {
    // Marketing in internal chart is acquisition/performance.
    if (department === 'support team') return { kind: 'node', nodeId: 'customer-support' }
    return { kind: 'node', nodeId: 'performance' }
  }

  if (sectionId === 'finance') {
    return { kind: 'node', nodeId: 'accounting' }
  }

  if (sectionId === 'operations' || sectionId === 'management-team') {
    if (department === 'hr') return { kind: 'node', nodeId: 'hr-recruiting' }
    if (department === 'support team') return { kind: 'node', nodeId: 'customer-support' }
    if (department === 'psp') return { kind: 'node', nodeId: 'payments' }
    if (department === 'dealing') return { kind: 'node', nodeId: 'dealing' }
    if (department === 'affiliate manager') return { kind: 'node', nodeId: 'affiliates-ib' }
    if (division === 'technology' || department === 'technology')
      return { kind: 'node', nodeId: 'tech-ops' }
    return { kind: 'node', nodeId: 'business-ops' }
  }

  // Safe fallback: Operations/Business Operations (primary operational area)
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
  const macroGroup = tree?.children?.find((c) => c?.id === 'macro-areas')
  for (const macro of macroGroup?.children || []) {
    const areaId = macro?.id
    for (const fn of macro?.children || []) {
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
  const [peoplePayload, setPeoplePayload] = useState(null)
  const [peopleLoadError, setPeopleLoadError] = useState(null)

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
  const macroAreas = (macroGroup?.children || []).slice(0, 4)

  const publicNodeLookup = useMemo(() => buildPublicNodeLabelLookup(ORG_TREE), [])

  useEffect(() => {
    if (mode !== VIEW_MODES.people) return
    if (peoplePayload) return

    let cancelled = false
    setPeopleLoadError(null)

    async function loadPeople() {
      try {
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
      operations: [],
      revenue: [],
      'trading-risk': [],
      corporate: [],
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

  const showPeople = mode === VIEW_MODES.people
  const isPeopleLoading = showPeople && !peoplePayload && !peopleLoadError
  const isPeopleError = showPeople && Boolean(peopleLoadError)
  const governanceDisplayCount = 3
  const governanceSeatsToShow = (governance?.children || []).slice(0, governanceDisplayCount)
  const governancePeopleToShow = (peopleIndex.governancePeople || []).slice(
    0,
    governanceDisplayCount
  )

  // Inject people into the SAME structure (no node changes).
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      {/* Fixed logo top-left */}
      <a href="/" className="fixed left-5 top-5 z-20" aria-label="Bullwaves">
        <img src="/Logo.png" alt="Bullwaves" className="h-7 w-auto opacity-95" />
      </a>

      <div className="mx-auto max-w-[140rem] px-3 sm:px-4 md:px-6 2xl:px-10 pt-10 pb-6">
        <header className="flex flex-col items-center text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Company Organizational Chart
          </h1>
          <p className="mt-2 text-sm text-slate-400">Board-level view</p>

          {/* Mode toggle (structure ↔ people) */}
          <div className="mt-5 inline-flex rounded-full border border-slate-700/50 bg-slate-950/40 p-1">
            <button
              type="button"
              onClick={() => setMode(VIEW_MODES.structure)}
              className={
                'px-4 py-1.5 text-xs font-semibold rounded-full transition ' +
                (mode === VIEW_MODES.structure
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-300 hover:text-white')
              }
              aria-pressed={mode === VIEW_MODES.structure}
            >
              Structure only
            </button>
            <button
              type="button"
              onClick={() => setMode(VIEW_MODES.people)}
              className={
                'px-4 py-1.5 text-xs font-semibold rounded-full transition ' +
                (mode === VIEW_MODES.people
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-300 hover:text-white')
              }
              aria-pressed={mode === VIEW_MODES.people}
            >
              People
            </button>
          </div>

          {mode === VIEW_MODES.people ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-slate-300/25 text-slate-200/80 bg-slate-950/20">
                  Head
                </span>
                <span>Operational head</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex items-center rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-slate-300/20 text-slate-200/70 bg-slate-950/20">
                  Facilitator
                </span>
                <span>Cross-team coordination</span>
              </span>
            </div>
          ) : null}

          {showPeople ? (
            <p className="mt-2 text-xs text-slate-500">
              {isPeopleLoading
                ? 'Loading people…'
                : isPeopleError
                  ? 'People unavailable (public view stays private)'
                  : 'Names + role titles only · No emails'}
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No people · Structure only</p>
          )}
        </header>

        <main className="mt-12" aria-label="Organizational tree">
          <div className="flex flex-col items-center">
            {/* ROOT */}
            <div className="flex flex-col items-center">
              <div
                className="rounded-2xl border border-slate-800/80 bg-slate-950/40 px-6 py-4 backdrop-blur-md"
                aria-label={ORG_TREE.label}
              >
                <img src="/Logo.png" alt={ORG_TREE.label} className="h-10 w-auto opacity-95" />
              </div>
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

            <div className="flex justify-center">
              <VLine h={40} className="bg-slate-500/40" />
            </div>

            {/* LEVEL 2 — MACRO AREAS (ONLY 4) */}
            <div className="w-full max-w-[140rem]">
              {/* Structure spine only on very large screens (4 pillars in one row) */}
              <div className="hidden xl:block">
                <HLine className="w-full" />
                <div className="grid grid-cols-4 gap-6">
                  {macroAreasPopulated.map((a) => (
                    <div key={`macro-stub-${a.id}`} className="flex justify-center">
                      <VLine h={18} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pillar hubs (responsive: 1 → 2 → 4) */}
              <div
                className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 2xl:gap-6"
                style={{ alignItems: 'start' }}
              >
                {macroAreasPopulated.map((area) => (
                  <MacroAreaColumn
                    key={area.id}
                    area={area}
                    facilitators={facilitatorsByArea?.[area.id] || []}
                  />
                ))}
              </div>

              {/* Sales ↔ Support bridge (compact for <xl) */}
              {showPeople && salesSupportBridgeFacilitators.length ? (
                <div className="mt-6 xl:hidden">
                  <div className="rounded-2xl border border-slate-800/60 bg-slate-900/20 px-4 py-3">
                    <div className="text-[10px] font-semibold text-slate-400">
                      Sales ↔ Customer Support facilitators
                    </div>
                    <div className="mt-2 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
                      {salesSupportBridgeFacilitators.slice(0, 2).map((p) => {
                        const fp = formatPersonText(p, { maxTitleLen: 28 })
                        return (
                          <div
                            key={`bridge-compact-${p.name}-${p.title}`}
                            className="min-w-0 rounded-xl border border-dashed border-brand-400/45 bg-slate-950/50 px-3 py-2"
                          >
                            <div
                              className="text-[11px] font-semibold text-slate-100 leading-snug"
                              title={fp.displayName}
                            >
                              {fp.displayName}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-400 leading-snug flex items-center gap-1.5 flex-wrap min-w-0">
                              <span className="min-w-0 flex-1 break-normal" title={fp.titleTooltip}>
                                {fp.shortenedTitle || fp.fullTitle}
                              </span>
                              <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-slate-300/20 text-slate-200/70 bg-slate-950/20">
                                Facilitator
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Facilitation line label (NOT reporting). Keep only when pillars are in one row. */}
              <div className="mt-8 hidden xl:grid grid-cols-4 gap-6 items-center">
                <div className="col-span-2">
                  {showPeople ? (
                    <SalesSupportFacilitatorBridge people={salesSupportBridgeFacilitators} />
                  ) : null}
                </div>
                <div className="col-span-2">
                  <div className="relative w-full">
                    <div className="border-t border-dashed border-brand-400/65" />
                    {showPeople && paoloVulloPerson
                      ? (() => {
                          const fp = formatPersonText(paoloVulloPerson, { maxTitleLen: 32 })
                          return (
                            <div className="absolute left-6 -top-7 min-w-[12rem] max-w-[14rem] rounded-xl border border-brand-400/45 bg-slate-950/70 px-3 py-2">
                              <div
                                className="text-[11px] font-semibold text-slate-100 leading-snug"
                                title={fp.displayName}
                              >
                                {fp.displayName}
                              </div>
                              <div className="mt-0.5 text-[11px] text-slate-400 leading-snug min-w-0">
                                <span className="min-w-0 break-normal" title={fp.titleTooltip}>
                                  {fp.shortenedTitle || fp.fullTitle}
                                </span>
                              </div>
                            </div>
                          )
                        })()
                      : null}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 py-1 rounded-full border border-brand-400/40 bg-slate-950/70 text-[11px] text-slate-300">
                      Operations as a Servant Organization (Agile Model)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-12 flex justify-center">
          <div className="text-xs text-slate-400 border border-slate-800/80 bg-slate-900/35 rounded-full px-4 py-2">
            {showPeople
              ? 'Public view: people + roles · No emails / no personal metadata'
              : 'Public view: structure only · No people'}
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

function MacroAreaColumn({ area, facilitators = [] }) {
  if (!area) return null
  const safeAreaPeople = (area.people || []).filter((p) => p && p.name && p.title)
  const safeFacilitators = (facilitators || []).filter((p) => p && p.name && p.title)
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

  const headBadgeClass =
    area.id === 'operations'
      ? 'border-slate-300/25 text-slate-200/80 bg-slate-950/20'
      : area.id === 'revenue'
        ? 'border-indigo-300/25 text-indigo-200/80 bg-indigo-950/20'
        : area.id === 'trading-risk'
          ? 'border-amber-300/25 text-amber-200/80 bg-amber-950/20'
          : 'border-emerald-300/25 text-emerald-200/80 bg-emerald-950/20'

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
        extra={
          <div>
            {area.showPeople && safeFacilitators.length ? (
              <div className="mt-2">
                <div className="text-[10px] font-semibold text-slate-400">Facilitators</div>
                <div className="mt-2 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
                  {safeFacilitators.map((p) =>
                    (() => {
                      const fp = formatPersonText(p, { maxTitleLen: 26 })
                      const targets = Array.isArray(p.facilitatorFor) ? p.facilitatorFor : []
                      const targetsText = targets.length ? `→ ${targets.join(' · ')}` : ''
                      return (
                        <div
                          key={`fac-${area.id}-${p.name}-${p.title}`}
                          className="rounded-xl border border-dashed border-slate-800/60 bg-slate-950/30 px-3 py-2"
                        >
                          <div className="text-[11px] leading-snug font-semibold text-slate-100">
                            <span title={fp.displayName}>{fp.displayName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 leading-snug flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="min-w-0 flex-1 break-normal" title={fp.titleTooltip}>
                              {fp.shortenedTitle || fp.fullTitle}
                            </span>
                            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-semibold tracking-wide border-slate-300/20 text-slate-200/70 bg-slate-950/20">
                              Facilitator
                            </span>
                            {targetsText ? (
                              <span className="text-[9px] text-slate-500 break-normal">
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
                <div className="text-[10px] font-semibold text-slate-400">Key roles</div>
                <div className="mt-2 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
                  {safeAreaPeople.map((p) =>
                    (() => {
                      const fp = formatPersonText(p, { maxTitleLen: 26 })
                      return (
                        <div
                          key={`${area.id}-${p.name}-${p.title}`}
                          className={
                            'rounded-xl border px-3 py-2 ' +
                            (p.isHead
                              ? 'border-slate-700/70 bg-slate-950/45'
                              : 'border-slate-800/60 bg-slate-950/30')
                          }
                        >
                          <div
                            className={
                              'text-[11px] leading-snug ' +
                              (p.isHead
                                ? 'font-bold text-slate-100'
                                : 'font-semibold text-slate-100')
                            }
                            title={fp.displayName}
                          >
                            {fp.displayName}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400 leading-snug flex flex-wrap items-center gap-1.5 min-w-0">
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
                return (
                  <div key={`${area.id}-${cluster.label}`}>
                    <div className="text-[10px] font-semibold text-slate-400">{cluster.label}</div>
                    <div
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
                        />
                      ))}
                    </div>
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
