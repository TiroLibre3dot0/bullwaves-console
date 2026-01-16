import React, { useEffect, useMemo, useState } from 'react'

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

      {/* People (secondary, injected into the SAME structure) */}
      <div
        className={
          'transition-all duration-300 ease-out overflow-hidden ' +
          (showPeople ? 'max-h-[1400px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0')
        }
        aria-hidden={!showPeople}
      >
        {safePeople.length ? (
          <div className="space-y-1">
            {safePeople.map((p) => (
              <div
                key={`${title}-${p.name}-${p.title}`}
                className={
                  'rounded-lg border px-2.5 py-2 ' +
                  (p.isHead
                    ? 'border-slate-600/55 bg-slate-950/45'
                    : 'border-slate-700/40 bg-slate-950/30')
                }
              >
                <div
                  className={
                    'text-[11px] leading-snug ' +
                    (p.isHead ? 'font-bold text-slate-100' : 'font-semibold text-slate-100')
                  }
                >
                  {p.name}
                </div>
                <div className="text-[10px] text-slate-400 leading-snug flex items-center gap-1.5">
                  <span>{p.title}</span>
                  {p.isHead ? (
                    <span
                      className={
                        'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ' +
                        headBadgeClass
                      }
                    >
                      Head
                    </span>
                  ) : null}
                </div>
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

const VIEW_MODES = {
  structure: 'structure',
  people: 'people',
}

function normalizeKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
}

const EXPLICIT_HEADS_BY_NODE = {
  // Confirmed department heads
  sales: ['roberta jovanovic'],
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
  if (name === 'ivana jelic' || name === 'nevena milosavljevic' || name === 'nevena planic') {
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

export default function ShareOrgChartTrueTree() {
  const [mode, setMode] = useState(VIEW_MODES.structure)
  const [peoplePayload, setPeoplePayload] = useState(null)
  const [peopleLoadError, setPeopleLoadError] = useState(null)

  const governance = ORG_TREE.children.find((c) => c.id === 'governance')
  const macroGroup = ORG_TREE.children.find((c) => c.id === 'macro-areas')
  const macroAreas = (macroGroup?.children || []).slice(0, 4)

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
    const seenByName = new Set()

    for (const section of peoplePayload?.sections || []) {
      const sectionId = section?.id
      for (const role of section?.roles || []) {
        if (!isInternalRoleEligible(sectionId, role)) continue

        const name = String(role.name || '').trim()
        let roleTitle = String(role.title || '').trim()
        const nk = normalizeKey(name)
        if (nk === 'ivana jelic') roleTitle = 'Tech Operations (Systems)'
        if (nk === 'nevena milosavljevic' || nk === 'nevena planic')
          roleTitle = 'Tech Operations (User Provisioning)'

        const dedupeKey = nk
        if (seenByName.has(dedupeKey)) continue
        seenByName.add(dedupeKey)

        const mapped = mapInternalRoleToPublicNode(sectionId, role)
        const person = { name, title: roleTitle }

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
            byArea[areaId].push({ ...person, isHead: isHeadForNode(areaId, person) })
          }
          continue
        }

        const nodeId = mapped.nodeId
        const nodeIds = Array.isArray(mapped.nodeIds) ? mapped.nodeIds : null

        if (nodeIds && nodeIds.length) {
          for (const id of nodeIds) {
            if (!id) continue
            if (!byNode[id]) byNode[id] = []
            byNode[id].push({ ...person, isHead: isHeadForNode(id, person) })
          }
          continue
        }

        if (!nodeId) continue
        if (!byNode[nodeId]) byNode[nodeId] = []
        byNode[nodeId].push({ ...person, isHead: isHeadForNode(nodeId, person) })
      }
    }

    // Stable ordering
    for (const k of Object.keys(byNode)) byNode[k].sort(sortPeople)
    for (const k of Object.keys(byArea)) byArea[k].sort(sortPeople)
    governancePeople.sort((a, b) => a.name.localeCompare(b.name))

    return { byNode, byArea, governancePeople }
  }, [peoplePayload])

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

  const ops = macroAreasPopulated.find((a) => a?.id === 'operations')
  const revenue = macroAreasPopulated.find((a) => a?.id === 'revenue')
  const trading = macroAreasPopulated.find((a) => a?.id === 'trading-risk')
  const corporate = macroAreasPopulated.find((a) => a?.id === 'corporate')

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
                        <Card
                          title={p.name}
                          lines={p.title ? [p.title] : []}
                          accentDotClass={ACCENTS.governance}
                          size="md"
                        />
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
            <div className="w-full max-w-[90rem]">
              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                }}
              >
                {/* mobile layout */}
                <div className="grid grid-cols-1 gap-6 lg:hidden">
                  {macroAreasPopulated.map((area) => (
                    <MacroAreaColumn key={area.id} area={area} />
                  ))}
                </div>

                {/* desktop layout */}
                <div className="hidden lg:block">
                  <HLine className="w-full" />
                  <div className="grid grid-cols-4 gap-6">
                    {macroAreasPopulated.map((a) => (
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

function MacroAreaColumn({ area }) {
  if (!area) return null
  const safeAreaPeople = (area.people || []).filter((p) => p && p.name && p.title)
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
          area.showPeople ? (
            <div
              className={
                'transition-all duration-300 ease-out overflow-hidden ' +
                (area.showPeople ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0')
              }
            >
              {safeAreaPeople.length ? (
                <div className="mt-2 space-y-1">
                  {safeAreaPeople.map((p) => (
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
                          (p.isHead ? 'font-bold text-slate-100' : 'font-semibold text-slate-100')
                        }
                      >
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-snug flex items-center gap-1.5">
                        <span>{p.title}</span>
                        {p.isHead ? (
                          <span
                            className={
                              'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ' +
                              headBadgeClass
                            }
                          >
                            Head
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null
        }
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
              <SubCard
                title={fn.label}
                lines={getNodeLines(fn)}
                borderClass={border}
                headBadgeClass={headBadgeClass}
                people={fn.people || []}
                showPeople={Boolean(fn.showPeople)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
