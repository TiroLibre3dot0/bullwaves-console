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
      title: 'Prep Solitics retention call',
      owner: 'Paolo',
      department: 'Ops / Analytics',
      tool: 'https://solitics-ltd.monday.com/boards/5089697723/views/41153755',
      expectedImpact:
        'Use cases and scope prepared; focus set on lifecycle measurement in Affiliate → Cohort Analysis.',
      status: 'done',
    },
    {
      title: 'Solitics call: owners + next steps',
      owner: 'Paolo',
      department: 'Ops / Analytics',
      tool: 'https://solitics-ltd.monday.com/boards/5089697723/views/41153755',
      expectedImpact: 'Ownership aligned; onboarding path confirmed; weekly cadence agreed.',
      status: 'done',
    },
    {
      title: 'Solitics kick-off: onboarding active, content execution',
      owner: 'Paolo, Marketing Lead, Solitics',
      department: 'Ops / Analytics / Marketing',
      tool: 'Solitics platform + Cohort Analysis',
      expectedImpact:
        'Onboarding is active (45 business days). Current phase is marketing execution: define use cases and deliver content (emails/creatives). Main risk is content readiness (not technical setup).',
      status: 'done',
    },
    {
      title: 'Define Solitics use cases (v1)',
      owner: 'Paolo, Solitics',
      department: 'Ops / Marketing',
      tool: 'Affiliate → Cohort Analysis',
      expectedImpact:
        'Use cases + triggers documented (audience, trigger, message, channel). Next step: draft v1 list and review/prioritize with Solitics.',
      status: 'in_progress',
    },
    {
      title: 'Solitics marketing plan (calendar + assets)',
      owner: 'Daniel Taddei',
      department: 'Marketing',
      tool: 'Solitics + creative/email production',
      expectedImpact:
        'Plan ready to execute: calendar + asset list for onboarding/retention/reactivation, with owners and deadlines. Next step: deliver v1 plan for Paolo review and Solitics QA.',
      status: 'in_progress',
    },
    {
      title: 'Content pack: emails + creatives (v1)',
      owner: 'Marketing Lead, Solitics',
      department: 'Marketing',
      tool: 'Solitics content library / email templates',
      expectedImpact:
        'Draft journeys and triggers with copy/creatives ready for QA. Next step: deliver v1 pack for approval, then upload into Solitics.',
      status: 'in_progress',
    },
    {
      title: 'Assess Scale SDK needs (advanced engagement)',
      owner: 'Product Team, Solitics',
      department: 'Product / Data',
      tool: 'Scale SDK / Solitics SDK requirements',
      expectedImpact:
        'SDK scope clarified (events, capabilities, privacy) with a go/no-go and effort estimate. Next step: confirm requirements with Scale and share ETA.',
      status: 'planned',
    },
    {
      title: 'Shared execution board (Solitics)',
      owner: 'Paolo, Solitics',
      department: 'Ops / Analytics',
      tool: 'Shared execution board (Solitics/Monday/Jira)',
      expectedImpact:
        'One shared board with backlog, owners, milestones, and blockers. Next step: create it, invite stakeholders, set weekly cadence.',
      status: 'in_progress',
    },
  ],

  ops_governance: [
    {
      title: 'Stamatis call: risk scoring + KYC updates',
      owner: 'Paolo',
      department: 'Compliance / Operations',
      tool: 'Weekly Map checklist',
      expectedImpact:
        'Risk scoring framework defined (questionnaire + scoring); enables AML checks vs declared risk. Next step: align BI + Ops on rollout steps.',
      status: 'done',
    },
  ],

  aml_compliance: [
    {
      title: 'Risk score + AML alerts dashboard',
      owner: 'Michael Roizman, Stamatis',
      department: 'Data / Compliance',
      tool: 'BI platform / Risk scoring engine',
      expectedImpact:
        'Dashboard shows risk score, alerts, and escalation triggers; Ops can act fast. Next step: confirm BI ETA and validate alert logic with Stamatis.',
      status: 'in_progress',
    },
    {
      title: 'Apply high-risk threshold (60+)',
      owner: 'Stamatis',
      department: 'Compliance',
      tool: 'Compliance manual / risk scoring',
      expectedImpact:
        'Single standard enforced: 60+ = high risk across scoring, handling, and reporting.',
      status: 'in_progress',
    },
    {
      title: 'TM escalation rules (30/60/90)',
      owner: 'Stamatis',
      department: 'Compliance',
      tool: 'TM rules + enforcement',
      expectedImpact:
        'Escalation applied consistently: alert → 30d deposit block → 60d trading off → 90d close/refund.',
      status: 'in_progress',
    },
    {
      title: 'AML KPI list for BI (v1)',
      owner: 'Data Platform',
      department: 'Data',
      tool: 'BI / KPIs spec',
      expectedImpact:
        'Minimum KPI list agreed (alerts, high risk 60+, blocked/closed). Next step: publish the KPI list and data sources.',
      status: 'planned',
    },
    {
      title: 'BI AML dashboard demo (ETA)',
      owner: 'Data Platform',
      department: 'Data',
      tool: 'BI dashboard demo',
      expectedImpact:
        'Demo delivered with agreed definitions. Next step: confirm ETA and track weekly until shipped.',
      status: 'planned',
    },
    {
      title: 'AML manual approval + Ops alignment',
      owner: 'Stamatis',
      department: 'Compliance',
      tool: 'AML manual',
      expectedImpact: 'Manual approved and Ops procedure aligned with live scoring + TM rules.',
      status: 'planned',
    },
    {
      title: 'Scale/KYC/BI integration dependency',
      owner: 'Product Team',
      department: 'Product',
      tool: 'Scale / KYC / BI integration',
      expectedImpact:
        'End-to-end integration tracked weekly (questionnaire, risk score, TM flags) with Ops in the loop.',
      status: 'blocked',
    },
  ],

  skale_tickets: [
    {
      title: 'Skale CRM: client data integrity (compliance)',
      owner: 'Compliance / Ops / Product',
      department: 'Compliance / Ops / IT',
      tool: 'Skale CRM / Scale API',
      expectedImpact:
        'Track 3 items: (1) Duplicate account blocking (phone) — provide 1 test case + get written confirmation; (2) POI/POA fields — clarify Country/POA Country logic + timeline; (3) Batch updates — confirm black list / Trading Disabled / Account Enabled flags with timestamp/report. Next step: book Skale tech call and align on Scale API integration + ownership.',
      status: 'in_progress',
    },
  ],

  internal_comms: [
    {
      title: 'Send trading platform overview email',
      owner: 'Paolo',
      department: 'Ops / Product',
      tool: 'gmail',
      expectedImpact: 'Email sent with platform overview and link.',
      status: 'done',
    },
    {
      title: 'Send first month invoice',
      owner: 'Paolo',
      department: 'Finance / Ops',
      tool: 'Invoice',
      expectedImpact: 'Invoice sent. Next step: confirm payment receipt and close.',
      status: 'done',
    },
  ],

  execution_clarity: [
    {
      title: 'Close the week (Weekly Map)',
      owner: 'Paolo',
      department: 'Ops',
      expectedImpact:
        'Mark outcomes, capture blockers, and set next week commitments. Next step: finalize statuses and share the board link.',
      status: 'in_progress',
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
