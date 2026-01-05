const STORAGE_KEY = 'bw_weekly_map_v1'

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

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
  profitability: [
    {
      title: 'Prepare Solitics call',
      owner: 'Paolo',
      department: 'Ops / Analytics',
      expectedImpact: 'Arrive at the Solitics call with clear retention and bonus use cases, avoiding non-impactful integrations.',
      status: 'planned',
    },
    {
      title: 'Solitics call + decision summary',
      owner: 'Paolo',
      department: 'Ops / Analytics',
      expectedImpact: 'Clearly define what Solitics owns vs what remains internal, removing ambiguity.',
      status: 'planned',
    },
  ],
  ops_governance: [
    {
      title: 'Prepare call with Stamatis',
      owner: 'Paolo',
      department: 'Operations',
      expectedImpact: 'Enter the call with a clear narrative on status, priorities, and decisions required.',
      status: 'planned',
    },
    {
      title: 'Call with Stamatis',
      owner: 'Paolo',
      department: 'Operations',
      expectedImpact: 'Align governance, roadmap direction, and execution focus.',
      status: 'planned',
    },
    {
      title: 'Post-call written follow-up',
      owner: 'Paolo',
      department: 'Operations',
      expectedImpact: 'Lock decisions in writing to prevent execution drift.',
      status: 'planned',
    },
  ],
  internal_comms: [
    {
      title: 'Send trading platform overview email',
      owner: 'Paolo',
      department: 'Ops / Product',
      expectedImpact: 'Communicate platform readiness and reinforce operational credibility.',
      status: 'planned',
    },
    {
      title: 'Send first month invoice',
      owner: 'Paolo',
      department: 'Finance / Ops',
      expectedImpact: 'Formalize the collaboration and reinforce structured operations.',
      status: 'planned',
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
  const resolvedStatus = status || (weekStart === getWeekRange(new Date()).week_start ? 'active' : 'archived')
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
  const defaultWeekEnd = weekStart === current.week_start ? current.week_end : (base.weeks?.[weekStart]?.week_end || '')
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
  if (store && typeof store === 'object' && store.version === 2 && store.weeks && typeof store.weeks === 'object') {
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
      const current = weeks[weekStart] || normalizeWeeklyMap(null, weekStart, weekEnd || getWeekRange(new Date()).week_end)
      const existingTasks = Array.isArray(current.tasks) ? current.tasks : []
      const incoming = Array.isArray(bucket.tasks) ? bucket.tasks : []
      const normalizedIncoming = incoming
        .map((t) => ({
          ...t,
          megaStoryId: t.megaStoryId || megaStoryId,
          weeklyMapId: makeWeeklyMapId(weekStart),
          week_start: t.week_start || weekStart,
          week_end: t.week_end || (bucket.week_end || current.week_end),
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
