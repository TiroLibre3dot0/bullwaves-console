// Shared helpers to import/merge story-level tasks into the Tasks board.

function normalizeImpact(impact) {
  const v = String(impact || '')
    .trim()
    .toLowerCase()
  if (v === 'high' || v === 'p0') return 'High'
  if (v === 'low' || v === 'p2') return 'Low'
  return 'Medium'
}

function resolveStrategicCategoryFromStory({ epic, title }) {
  const e = String(epic || '').toLowerCase()
  const t = String(title || '').toLowerCase()

  if (t.includes('partner') || t.includes('ib') || t.includes('affiliate'))
    return 'Partnerships & Affiliates'

  if (e.includes('retent')) return 'Retention & Monetization'
  if (e.includes('ops') || e.includes('operation') || e.includes('compliance'))
    return 'Operations & Compliance'
  if (e.includes('platform') || e.includes('infra') || e.includes('product'))
    return 'Platform & Infrastructure'

  // Default: acquisition story tasks belong to Growth.
  return 'Growth & Acquisition'
}

export function buildBoardTasksFromStories(stories, { t } = {}) {
  const list = Array.isArray(stories) ? stories : []
  const res = []

  for (const story of list) {
    const storyId = String(story?.id || '').trim()
    const storyTitle = String(story?.title || '').trim()
    const storyEpic = String(story?.epic || story?.pillar || story?.category || '').trim()
    if (!storyId || !storyTitle) continue

    const rawTasks = Array.isArray(story?.tasks)
      ? story.tasks
      : Array.isArray(story?.taskBreakdown)
        ? story.taskBreakdown.map((x, idx) => ({
            id: `${storyId}_tb_${idx}`,
            title: String(x),
            status: 'Todo',
          }))
        : []

    for (const st of rawTasks) {
      const storyTaskId = String(st?.id || '').trim() || 'task'
      const title = String(st?.title || '').trim()
      if (!title) continue

      const context = String(st?.context || '').trim()

      const id = `pb_story_${storyId}__${storyTaskId}`

      res.push({
        id,
        title,
        strategicCategory: resolveStrategicCategoryFromStory({
          epic: storyEpic,
          title: storyTitle,
        }),
        impactLevel: normalizeImpact(st?.impact),
        owner: String(st?.owner || story?.owner || storyTitle || '—'),
        status: st?.done ? 'Done' : 'Backlog',
        strategicObjective: storyTitle,
        problemSolved: '',
        expectedBusinessImpact: '',
        kpiOrMetric: '',
        taskBreakdown: [],
        context,
        description: context,
        summary:
          typeof t === 'function'
            ? t('tasksBoard.importedFromStories', { story: storyTitle })
            : `Imported from story: ${storyTitle}`,
        icon: 'plus',
        notes: '',
        sourceStoryId: storyId,
        sourceStoryTaskId: storyTaskId,
      })
    }
  }

  return res
}

export function mergeTasksById(existing, incoming) {
  const base = Array.isArray(existing) ? existing : []
  const add = Array.isArray(incoming) ? incoming : []

  if (!add.length) return base

  const byId = new Map(base.map((t) => [String(t?.id || ''), t]))
  let changed = false

  for (const t of add) {
    const id = String(t?.id || '')
    if (!id) continue
    if (!byId.has(id)) {
      byId.set(id, t)
      changed = true
    }
  }

  if (!changed) return base
  return Array.from(byId.values())
}
