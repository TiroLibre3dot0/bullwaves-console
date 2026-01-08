const STORAGE_KEY = 'bw_weekly_map_v1'
const SHARE_TOKEN_KEY = 'bw_weekly_map_share_token'

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function generateShareToken() {
  return (
    'share_' +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  )
}

function getOrCreateShareToken() {
  let token = typeof window !== 'undefined' ? window.localStorage.getItem(SHARE_TOKEN_KEY) : null
  if (!token) {
    token = generateShareToken()
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SHARE_TOKEN_KEY, token)
    }
  }
  return token
}

function getShareLink() {
  const token = getOrCreateShareToken()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/share/weekly-map/${token}`
}

export { getOrCreateShareToken, getShareLink }

function toIsoDate(d) {
  return new Date(d).toISOString().slice(0, 10)
}

function makeWeeklyMapId(weekStart) {
  return `wm_${weekStart}`
}

function makeWeeklyTaskId(weekStart, megaStoryId, index) {
  return `wt_${weekStart}_${megaStoryId}_${String(index).padStart(2, '0')}`
}

// EXACT current-week execution commitments (no extras).
const INITIAL_EXECUTION_PLAN_BY_MEGA = {
  retention_lifecycle: [
    {
      title: 'Call prep: Retention use cases + Solitics scope',
      owner: 'Paolo',
      department: 'Ops / Analytics',
      tool: 'https://solitics-ltd.monday.com/boards/5089697723/views/41153755',
      expectedImpact:
        'Retention strategy foundation established: retention/bonus use cases clarified; integration scope kept minimal and focused on lifecycle measurement; Cohort Analysis identified as primary measurement tool.',
      status: 'done',
    },
    {
      title: 'Solitics call: Retention automation + ownership clarity',
      owner: 'Paolo',
      department: 'Ops / Analytics',
      tool: 'https://solitics-ltd.monday.com/boards/5089697723/views/41153755',
      expectedImpact:
        'Retention ownership model locked in: Internal owns lifecycle data/integration + retention decision rules; Marketing owns retention loops + campaign execution; Solitics provides automation + dashboards. Replica access confirmed; integration path clear; weekly cadence set with Roman + Marketing.',
      status: 'done',
    },
    {
      title: 'Solitics onboarding kick-off: retention alignment + timeline',
      owner: 'Paolo, Marketing Lead, Solitics',
      department: 'Ops / Analytics / Marketing',
      tool: 'Solitics platform + Cohort Analysis',
      expectedImpact:
        'Onboarding officially started with clear delivery cadence: up to 45 business days for integration, then 90-day hypercare. Risk focus locked: content readiness (not technical delivery). Core KPIs agreed and will be measured via Affiliate → Cohort Analysis: +15% LTV (post-first deposit), +20% retention, +20% reactivation.',
      status: 'done',
    },
    {
      title: 'Formalize retention KPIs ↔ Cohort Analysis metrics (v1)',
      owner: 'Paolo, Michael Roizman, Marketing Lead',
      department: 'Ops / BI / Marketing',
      tool: 'Affiliate → Cohort Analysis',
      expectedImpact:
        'KPI definitions operational and measurable: LTV (post-first deposit), retention, and reactivation mapped to cohort events + windows; baseline snapshot captured; weekly reporting template locked. Next step: publish a 1-page KPI spec (definitions + cohort query mapping) and validate with Solitics in a 30-min review call.',
      status: 'in_progress',
    },
    {
      title: 'Content readiness: emails + creatives + lifecycle flows (onboarding/reactivation)',
      owner: 'Marketing Lead, Solitics',
      department: 'Marketing',
      tool: 'Solitics content library / email templates',
      expectedImpact:
        'Content pack ready to execute retention loops: onboarding journey, reactivation journey, and trigger-based retention messages defined with copy + creatives + send rules; owners and deadlines assigned. Next step: deliver a first draft pack (2 journeys + 5 triggers) for review and approval, then upload into Solitics for QA.',
      status: 'in_progress',
    },
    {
      title: 'Assess Scale SDK requirements for advanced engagement features',
      owner: 'Product Team, Solitics',
      department: 'Product / Data',
      tool: 'Scale SDK / Solitics SDK requirements',
      expectedImpact:
        'SDK integration scope assessed with a clear go/no-go: required events, SDK capabilities, privacy constraints, and effort estimate documented for advanced engagement (in-app, push, deep links). Next step: confirm SDK requirements + feasibility with Scale tech contact and share ETA with the team.',
      status: 'planned',
    },
    {
      title: 'Set up shared Solitics execution board (hypercare governance)',
      owner: 'Paolo, Solitics',
      department: 'Ops / Analytics',
      tool: 'Shared execution board (Solitics/Monday/Jira)',
      expectedImpact:
        'Single source of truth created for onboarding + hypercare: backlog, owners, weekly milestones, blockers, and KPI progress visible to both teams. Next step: create the board, invite stakeholders, and agree on a weekly update cadence + definition of done for each deliverable.',
      status: 'in_progress',
    },
  ],

  ops_governance: [
    {
      title: 'Call with Stamatis: Risk scoring framework + KYC integration',
      owner: 'Paolo',
      department: 'Compliance / Operations',
      tool: 'Weekly Map checklist',
      expectedImpact:
        'Risk scoring framework locked in: enhanced KYC questionnaire; per-answer scoring logic defined; client risk score calculated; enables AML monitoring via behavior vs declared risk comparison. Decisions captured: threshold (60+), TM escalation policy, BI KPIs, manual approval flow, Scale/KYC/BI integration roadmap.',
      status: 'done',
    },
  ],

  aml_compliance: [
    {
      title: 'Build Risk Score & AML Alerts Dashboard',
      owner: 'Michael Roizman, Stamatis',
      department: 'Data / Compliance',
      tool: 'BI platform / Risk scoring engine',
      expectedImpact:
        'AML dashboard live with real-time risk scoring + alerts: clients 60+ flagged instantly; TM escalation triggers visible; deposit/trading behavior anomalies vs KYC risk profile highlighted; alerts routed to Ops for manual review. Next step: confirm BI ETA (data model + queries); Stamatis to validate alert logic; launch by end of week.',
      status: 'in_progress',
    },
    {
      title: 'Formalize and apply High Risk threshold (60+ points)',
      owner: 'Stamatis',
      department: 'Compliance',
      tool: 'Compliance manual / risk scoring',
      expectedImpact:
        'High-risk is enforced as 60+ points across scoring, handling, and reporting (single standard, weekly controlled).',
      status: 'in_progress',
    },
    {
      title: 'Standardize transaction monitoring escalation (30/60/90)',
      owner: 'Stamatis',
      department: 'Compliance',
      tool: 'TM rules + enforcement',
      expectedImpact:
        'TM escalation is applied consistently: alert (deposit > declared income) → +30d deposit block → +60d trading disabled → +90d closure + refund.',
      status: 'in_progress',
    },
    {
      title: 'Define minimum AML KPIs for BI (v1)',
      owner: 'Data Platform',
      department: 'Data',
      tool: 'BI / KPIs spec',
      expectedImpact:
        'BI v1 KPIs defined: alerts generated, high-risk clients (60+), blocked/closed accounts (baseline: 155 country blocks).',
      status: 'planned',
    },
    {
      title: 'Track BI AML dashboard demo delivery (~2 weeks)',
      owner: 'Data Platform',
      department: 'Data',
      tool: 'BI dashboard demo',
      expectedImpact:
        'Demo delivered with agreed KPI definitions and data sources (weekly checkpoint until shipped).',
      status: 'planned',
    },
    {
      title: 'Track AML manual approval + Ops alignment',
      owner: 'Stamatis',
      department: 'Compliance',
      tool: 'AML manual',
      expectedImpact:
        'Approved manual received and Ops procedure aligned (no gap vs live scoring + TM enforcement).',
      status: 'planned',
    },
    {
      title: 'Track Scale/KYC/BI integration dependency (blocking)',
      owner: 'Product Team',
      department: 'Product',
      tool: 'Scale / KYC / BI integration',
      expectedImpact:
        'Dependency is controlled weekly: questionnaire data, risk scores, and TM flags are integrated end-to-end; Ops included in comms.',
      status: 'blocked',
    },
  ],

  skale_tickets: [
    {
      title: 'Consolidate Skale CRM compliance integration â€” client data integrity',
      owner: 'Compliance / Ops / Product',
      department: 'Compliance / Ops / IT',
      tool: 'Skale CRM / Scale API',
      expectedImpact:
        'Three compliance cases consolidated and tracked: (1) Automatic duplicate blocking (phone #) â€” provide Skale test case + confirm active tracking; (2) POI/POA field standardization â€” clarify Country logic and new POA Country field + timeline; (3) Batch client updates â€” verify black list / Trading Disabled / Account Enabled flags applied; confirm execution with timestamp/report. Next: schedule meeting with Skale tech team (gilad@skalecrm.com) to finalize Scale API integration, ownership model, and dev repo setup. Outcome: unified client data compliance layer live + weekly sync cadence established.',
      status: 'in_progress',
    },
  ],

  internal_comms: [
    {
      title: 'Send trading platform overview email',
      owner: 'Paolo',
      department: 'Ops / Product',
      tool: 'gmail',
      expectedImpact:
        'First draft sent (incl. trading platform link) to communicate readiness and reinforce operational credibility.',
      status: 'done',
    },
    {
      title: 'Send first month invoice',
      owner: 'Paolo',
      department: 'Finance / Ops',
      tool: 'Invoice',
      expectedImpact: 'December invoice sent; payment pending (track until settled).',
      status: 'in_progress',
    },
  ],

  execution_clarity: [
    {
      title: 'Validate Weekly Map and close the week',
      owner: 'Paolo',
      department: 'Ops',
      expectedImpact: 'Review execution outcomes and prepare next week’s commitments.',
      status: 'planned',
    },
  ],
}

export function getWeekRange(date = new Date()) {
  const d = new Date(date)
  // Operational week: Sunday → Saturday.
  // If today is Sunday, treat "current week" as the one that just ended Saturday.
  const day = d.getDay() // 0=Sun..6=Sat
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - day)
  if (day === 0) start.setDate(start.getDate() - 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { week_start: toIsoDate(start), week_end: toIsoDate(end) }
}

function normalizeWeeklyMap(map, weekStart, weekEnd, status) {
  const resolvedStatus =
    status || (weekStart === getWeekRange(new Date()).week_start ? 'active' : 'archived')
  return {
    ...(map || {}),
    id: map?.id || makeWeeklyMapId(weekStart),
    status: map?.status || resolvedStatus,
    week_start: map?.week_start || weekStart,
    week_end: map?.week_end || weekEnd,
    tasks: Array.isArray(map?.tasks) ? map.tasks : [],
  }
}

export function ensureWeekMap(store, weekStart, weekEnd, status) {
  const base = store && typeof store === 'object' ? store : { version: 2, weeks: {} }
  const next = { ...base, version: 2, weeks: { ...(base.weeks || {}) } }
  const existing = next.weeks[weekStart]
  next.weeks[weekStart] = normalizeWeeklyMap(existing, weekStart, weekEnd, status)
  return next
}

export function listWeeks(store) {
  const weeks = store?.weeks
  if (!weeks || typeof weeks !== 'object') return []
  return Object.keys(weeks)
    .sort((a, b) => b.localeCompare(a))
    .map((weekStart) => weeks[weekStart])
    .filter(Boolean)
}

export function getWeekMap(store, weekStart) {
  return store?.weeks?.[weekStart] || null
}

export function upsertWeeklyTask(store, weekStart, task) {
  const base = store && typeof store === 'object' ? store : { version: 2, weeks: {} }
  const current = getWeekRange(new Date())
  const defaultWeekEnd =
    weekStart === current.week_start ? current.week_end : base.weeks?.[weekStart]?.week_end || ''
  const next = ensureWeekMap(base, weekStart, task.week_end || defaultWeekEnd || current.week_end)
  const bucket = next.weeks[weekStart]
  const weeklyMapId = bucket.id || makeWeeklyMapId(weekStart)

  const normalizedTask = {
    ...task,
    weeklyMapId: task.weeklyMapId || weeklyMapId,
    week_start: task.week_start || weekStart,
    week_end: task.week_end || bucket.week_end,
  }

  const tasks = Array.isArray(bucket.tasks) ? [...bucket.tasks] : []
  const idx = tasks.findIndex((t) => t.id === normalizedTask.id)
  if (idx >= 0) tasks[idx] = normalizedTask
  else tasks.push(normalizedTask)

  next.weeks[weekStart] = { ...bucket, tasks }
  return next
}

export function deleteWeeklyTask(store, weekStart, taskId) {
  const base = store && typeof store === 'object' ? store : { version: 2, weeks: {} }
  const bucket = base.weeks?.[weekStart]
  if (!bucket) return base
  const next = { ...base, version: 2, weeks: { ...(base.weeks || {}) } }
  const tasks = Array.isArray(bucket.tasks) ? bucket.tasks.filter((t) => t.id !== taskId) : []
  next.weeks[weekStart] = { ...bucket, tasks }
  return next
}

function migrateStoreToV2(store) {
  if (
    store &&
    typeof store === 'object' &&
    store.version === 2 &&
    store.weeks &&
    typeof store.weeks === 'object'
  ) {
    return { ...store, version: 2, weeks: { ...store.weeks } }
  }

  // v1 shape (maps[megaStoryId][weekStart] = bucket)
  const maps = store?.maps
  if (!maps || typeof maps !== 'object') {
    return { version: 2, weeks: {} }
  }

  const weeks = {}
  Object.keys(maps).forEach((megaStoryId) => {
    const byWeek = maps[megaStoryId]
    if (!byWeek || typeof byWeek !== 'object') return
    Object.keys(byWeek).forEach((weekStart) => {
      const bucket = byWeek[weekStart]
      if (!bucket) return
      const weekEnd = bucket.week_end || ''
      const current =
        weeks[weekStart] ||
        normalizeWeeklyMap(null, weekStart, weekEnd || getWeekRange(new Date()).week_end)
      const existingTasks = Array.isArray(current.tasks) ? current.tasks : []
      const incoming = Array.isArray(bucket.tasks) ? bucket.tasks : []
      const normalizedIncoming = incoming
        .map((t) => ({
          ...t,
          megaStoryId: t.megaStoryId || megaStoryId,
          weeklyMapId: makeWeeklyMapId(weekStart),
          week_start: t.week_start || weekStart,
          week_end: t.week_end || bucket.week_end || current.week_end,
        }))
        .filter((t) => t && t.id)

      weeks[weekStart] = {
        ...current,
        id: makeWeeklyMapId(weekStart),
        week_start: weekStart,
        week_end: current.week_end || bucket.week_end,
        tasks: [...existingTasks, ...normalizedIncoming],
      }
    })
  })

  return { version: 2, weeks }
}

function buildExecutionContractTasks(weekStart, weekEnd) {
  const weeklyMapId = makeWeeklyMapId(weekStart)
  const nowIso = new Date().toISOString()
  const tasks = []

  Object.keys(INITIAL_EXECUTION_PLAN_BY_MEGA).forEach((megaStoryId) => {
    const plan = INITIAL_EXECUTION_PLAN_BY_MEGA[megaStoryId] || []
    plan.forEach((t, idx) => {
      tasks.push({
        id: makeWeeklyTaskId(weekStart, megaStoryId, idx + 1),
        weeklyMapId,
        megaStoryId,
        title: t.title,
        owner: t.owner,
        department: t.department,
        tool: t.tool,
        expectedImpact: t.expectedImpact,
        status: t.status,
        week_start: weekStart,
        week_end: weekEnd,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
    })
  })

  return tasks
}

export function ensureSeededCurrentWeek(store) {
  const current = getWeekRange(new Date())
  const base = store && typeof store === 'object' ? store : { version: 2, weeks: {} }
  let next = { ...base, version: 2, weeks: { ...(base.weeks || {}) } }

  // Enforce the execution contract for the active week (authoritative, no extras, never empty).
  next = ensureWeekMap(next, current.week_start, current.week_end, 'active')
  next.weeks[current.week_start] = {
    ...next.weeks[current.week_start],
    tasks: buildExecutionContractTasks(current.week_start, current.week_end),
  }

  return next
}

export function loadWeeklyMapStore() {
  if (typeof window === 'undefined') return { version: 2, weeks: {} }
  const raw = window.localStorage.getItem(STORAGE_KEY)

  const parsed = raw ? safeJsonParse(raw, { version: 2, weeks: {} }) : { version: 2, weeks: {} }
  const migrated = migrateStoreToV2(parsed)
  const seeded = ensureSeededCurrentWeek(migrated)
  saveWeeklyMapStore(seeded)
  return seeded
}

export function saveWeeklyMapStore(store) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}
