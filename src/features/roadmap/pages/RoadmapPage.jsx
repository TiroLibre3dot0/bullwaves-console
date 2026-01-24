import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ongoingItems from '../../ongoing/data/ongoingItems'
import { strategicObjectives, projects2026 } from '../data/roadmapData'
import { useI18n } from '../../../i18n/I18nContext'

const statusLabel = { active: 'Active', blocked: 'Blocked', done: 'Done' }
const priorityLabel = { high: 'High', medium: 'Medium', low: 'Low' }
const platformAreas = ['Trading', 'Analytics', 'Payments', 'Infra', 'Profile', 'Internal']
const departments = ['Infrastructure', 'Product', 'Data', 'Compliance', 'UX', 'Partners']
const statusFilters = ['All', 'Active', 'Blocked', 'Done']
const impactTypes = ['revenue', 'retention', 'risk_reduction', 'efficiency']
const STORAGE_KEY = 'bw_execution_tasks_v1'

function mapById(list, labelKey = 'label') {
  return list.reduce((acc, item) => {
    acc[item.id] = { label: item[labelKey], ...item }
    return acc
  }, {})
}

function loadTasks(seed) {
  if (typeof window === 'undefined') return seed
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return parsed
  } catch (e) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

export default function RoadmapPage() {
  const { t } = useI18n()

  const objectives = useMemo(
    () => [
      ...strategicObjectives,
      // Read-only, historical visibility layer (kept out of Weekly Map megas).
      { id: 'weekly_execution_history', label: 'Weekly Execution History' },
    ],
    []
  )

  const megaMap = useMemo(() => mapById(objectives), [objectives])
  const storyMap = useMemo(() => mapById(projects2026, 'activity'), [])

  const validateTask = useCallback(
    (task) => {
      if (!megaMap[task.megaStoryId])
        return { valid: false, reasonKey: 'roadmap.validation.unknownMegaStoryId' }
      const story = storyMap[task.storyId]
      if (!story) return { valid: false, reasonKey: 'roadmap.validation.unknownStoryId' }
      if (story.objectiveId && story.objectiveId !== task.megaStoryId)
        return { valid: false, reasonKey: 'roadmap.validation.storyNotUnderMega' }
      return { valid: true }
    },
    [megaMap, storyMap]
  )

  const [tasks, setTasks] = useState(() => loadTasks(ongoingItems))
  const [viewMode, setViewMode] = useState('active')
  const [megaFilter, setMegaFilter] = useState('All')
  const [storyFilter, setStoryFilter] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [selectedMega, setSelectedMega] = useState(objectives[0]?.id || null)
  const [showImpactModal, setShowImpactModal] = useState(false)
  const [impactDraft, setImpactDraft] = useState({
    impactType: '',
    impactedDepartment: '',
    impactedPlatformArea: '',
    impactedKPI: '',
    impactNote: '',
  })
  const [triageOpen, setTriageOpen] = useState(false)
  const [fixMega, setFixMega] = useState('')
  const [fixStory, setFixStory] = useState('')
  const [openStories, setOpenStories] = useState(() => new Set())
  const [selectedStoryId, setSelectedStoryId] = useState(null)

  const preserveScroll = useCallback((fn) => {
    if (typeof window === 'undefined') {
      fn()
      return
    }
    const y = window.scrollY
    fn()
    requestAnimationFrame(() => {
      window.scrollTo({ top: y })
    })
  }, [])

  const selectedTask = tasks.find((t) => t.id === selectedId) || null
  const selectedValidation = selectedTask ? validateTask(selectedTask) : null

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (e) {
      // ignore persist errors
    }
  }, [tasks])

  useEffect(() => {
    if (selectedMega && selectedMega !== megaFilter) {
      setMegaFilter(selectedMega)
      setStoryFilter('All')
    }
  }, [selectedMega, megaFilter])

  const resetToSeed = () => {
    const ok = window.confirm(t('roadmap.reset.confirm'))
    if (!ok) return
    setTasks(ongoingItems)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ongoingItems))
    } catch (e) {
      // ignore persist errors
    }
  }

  const { validTasks, triageTasks } = useMemo(() => {
    const valid = []
    const triage = []
    tasks.forEach((task) => {
      const verdict = validateTask(task)
      if (verdict.valid) {
        valid.push(task)
      } else {
        triage.push({ ...task, triageReason: verdict.reasonKey })
      }
    })
    return { validTasks: valid, triageTasks: triage }
  }, [tasks, validateTask])

  const storyOptions = useMemo(() => {
    const filtered = validTasks.filter((t) =>
      megaFilter === 'All' ? true : t.megaStoryId === megaFilter
    )
    const ids = Array.from(new Set(filtered.map((t) => t.storyId)))
    return ['All', ...ids]
  }, [megaFilter, validTasks])

  const baseFiltered = useMemo(() => {
    const scope =
      viewMode === 'done'
        ? validTasks.filter((t) => t.status === 'done')
        : validTasks.filter((t) => t.status !== 'done')
    return scope
      .filter((t) => (megaFilter === 'All' ? true : t.megaStoryId === megaFilter))
      .filter((t) => (storyFilter === 'All' ? true : t.storyId === storyFilter))
      .filter((t) => (departmentFilter === 'All' ? true : t.department === departmentFilter))
      .filter((t) => (platformFilter === 'All' ? true : t.platformArea === platformFilter))
      .filter((t) => (statusFilter === 'All' ? true : statusLabel[t.status] === statusFilter))
      .sort((a, b) => {
        const statusRank = { active: 0, blocked: 1, done: 2 }
        const priorityRank = { high: 0, medium: 1, low: 2 }
        if (statusRank[a.status] !== statusRank[b.status])
          return statusRank[a.status] - statusRank[b.status]
        if (priorityRank[a.priority] !== priorityRank[b.priority])
          return priorityRank[a.priority] - priorityRank[b.priority]
        return a.createdAt.localeCompare(b.createdAt)
      })
  }, [
    departmentFilter,
    megaFilter,
    platformFilter,
    statusFilter,
    storyFilter,
    validTasks,
    viewMode,
  ])

  useEffect(() => {
    if (viewMode === 'done') {
      setStatusFilter('Done')
    } else if (statusFilter === 'Done') {
      setStatusFilter('All')
    }
  }, [statusFilter, viewMode])

  useEffect(() => {
    if (selectedId && baseFiltered.some((t) => t.id === selectedId)) return
    if (baseFiltered.length > 0) {
      setSelectedId(baseFiltered[0].id)
      return
    }
    if (triageTasks.length > 0) {
      setSelectedId(triageTasks[0].id)
      return
    }
    setSelectedId(null)
  }, [baseFiltered, selectedId, triageTasks])

  useEffect(() => {
    if (selectedTask) {
      setFixMega(selectedTask.megaStoryId || '')
      setFixStory(selectedTask.storyId || '')
      setSelectedStoryId(selectedTask.storyId || null)
    } else {
      setFixMega('')
      setFixStory('')
      setSelectedStoryId(null)
    }
  }, [selectedTask])

  const triageFixStories = useMemo(
    () => Object.values(storyMap).filter((s) => !fixMega || s.objectiveId === fixMega),
    [fixMega, storyMap]
  )

  const totals = useMemo(() => {
    const base = { active: 0, blocked: 0, done: 0 }
    validTasks.forEach((t) => {
      base[t.status] += 1
    })
    return base
  }, [validTasks])

  const handleMarkDone = () => {
    if (!selectedTask) return
    setImpactDraft({
      impactType: '',
      impactedDepartment: '',
      impactedPlatformArea: '',
      impactedKPI: '',
      impactNote: '',
    })
    setShowImpactModal(true)
  }

  const saveImpact = () => {
    if (!selectedTask) return
    const { impactType, impactedDepartment, impactedPlatformArea, impactedKPI } = impactDraft
    if (!impactType || !impactedDepartment || !impactedPlatformArea || !impactedKPI) return
    const completedAt = new Date().toISOString().slice(0, 10)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              status: 'done',
              impactType,
              impactedDepartment,
              impactedPlatformArea,
              impactedKPI,
              impactNote: impactDraft.impactNote,
              completedAt,
            }
          : t
      )
    )
    setShowImpactModal(false)
    setViewMode('done')
    setStatusFilter('Done')
  }

  const storyLabel = (storyId) => storyMap[storyId]?.label || storyId
  const megaLabel = (megaId) => megaMap[megaId]?.label || megaId
  const focusedStoryId = selectedStoryId || selectedTask?.storyId || null

  const statusText = (status) => t(`roadmap.status.${status}`)
  const priorityText = (priority) => t(`roadmap.priority.${priority}`)
  const departmentText = (dept) =>
    t(`roadmap.department.${String(dept || '').toLowerCase()}`) || dept
  const platformAreaText = (area) =>
    t(`roadmap.platformArea.${String(area || '').toLowerCase()}`) || area
  const impactTypeText = (impactType) => t(`roadmap.impactType.${impactType}`) || impactType

  const megaStats = useMemo(() => {
    return objectives.map((obj) => {
      const list = validTasks.filter((t) => t.megaStoryId === obj.id)
      const departmentsSet = new Set(list.map((t) => t.department).filter(Boolean))
      const platformsSet = new Set(list.map((t) => t.platformArea).filter(Boolean))
      const done = list.filter((t) => t.status === 'done')
      const lastImpact = done
        .filter((t) => t.completedAt)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]

      const lastImpactLabel = lastImpact
        ? t('roadmap.mega.lastImpactValue', {
            impactType: impactTypeText(lastImpact.impactType || 'impact'),
            department: lastImpact.impactedDepartment || t('roadmap.mega.impact.unknownDepartment'),
            area: lastImpact.impactedPlatformArea || t('roadmap.mega.impact.unknownArea'),
          })
        : t('roadmap.mega.noImpactYet')

      return {
        id: obj.id,
        label: obj.label,
        active: list.filter((t) => t.status === 'active').length,
        blocked: list.filter((t) => t.status === 'blocked').length,
        done: done.length,
        departments: Array.from(departmentsSet),
        platforms: Array.from(platformsSet),
        lastImpact: lastImpactLabel,
      }
    })
  }, [impactTypeText, t, validTasks])

  const storiesForSelected = useMemo(() => {
    if (!selectedMega) return []
    return projects2026.filter((s) => s.objectiveId === selectedMega)
  }, [selectedMega])

  const toggleStory = (id) => {
    setOpenStories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const tasksByStory = useMemo(() => {
    const map = new Map()
    baseFiltered.forEach((t) => {
      const list = map.get(t.storyId) || []
      list.push(t)
      map.set(t.storyId, list)
    })
    return map
  }, [baseFiltered])

  const storiesOrdered = useMemo(() => {
    if (!selectedMega) return []
    return [...storiesForSelected].sort((a, b) => {
      const aCount = (tasksByStory.get(a.id) || []).length
      const bCount = (tasksByStory.get(b.id) || []).length
      if (aCount !== bCount) return bCount - aCount
      return a.activity.localeCompare(b.activity)
    })
  }, [selectedMega, storiesForSelected, tasksByStory])

  const selectMega = (id) => {
    preserveScroll(() => {
      setSelectedMega(id)
      setMegaFilter(id || 'All')
      setStoryFilter('All')
    })
  }

  return (
    <div className="roadmap-page">
      <div className="roadmap-header card-global">
        <div>
          <h1>{t('roadmap.header.title')}</h1>
          <p className="text-muted">{t('roadmap.header.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="ongoing-counter-pill">
            <span className="pill-dot dot-progress" aria-hidden="true" />
            <span>{t('roadmap.counter.active', { count: totals.active })}</span>
            <span className="pill-sep">&middot;</span>
            <span className="pill-blocked">
              {t('roadmap.counter.blocked', { count: totals.blocked })}
            </span>
            <span className="pill-sep">&middot;</span>
            <span>{t('roadmap.counter.done', { count: totals.done })}</span>
          </div>
          <button type="button" className="btn secondary" onClick={resetToSeed}>
            {t('roadmap.reset.button')}
          </button>
          <div className="ongoing-toggle">
            <button
              type="button"
              className={`chip ${viewMode === 'active' ? 'active' : ''}`}
              onClick={() => setViewMode('active')}
            >
              {t('roadmap.viewMode.active')}
            </button>
            <button
              type="button"
              className={`chip ${viewMode === 'done' ? 'active' : ''}`}
              onClick={() => setViewMode('done')}
            >
              {t('roadmap.viewMode.done')}
            </button>
          </div>
        </div>
      </div>

      <div className="ongoing-filters card">
        <div className="filter-field">
          <label>{t('roadmap.filters.megaStory')}</label>
          <select
            value={megaFilter}
            onChange={(e) => selectMega(e.target.value === 'All' ? null : e.target.value)}
          >
            <option value="All">{t('roadmap.filters.all')}</option>
            {Object.keys(megaMap).map((id) => (
              <option key={id} value={id}>
                {megaLabel(id)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t('roadmap.filters.story')}</label>
          <select value={storyFilter} onChange={(e) => setStoryFilter(e.target.value)}>
            {storyOptions.map((id) => (
              <option key={id} value={id}>
                {id === 'All' ? t('roadmap.filters.all') : storyLabel(id)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t('roadmap.filters.department')}</label>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="All">{t('roadmap.filters.all')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {departmentText(d)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t('roadmap.filters.platformArea')}</label>
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
            <option value="All">{t('roadmap.filters.all')}</option>
            {platformAreas.map((p) => (
              <option key={p} value={p}>
                {platformAreaText(p)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t('roadmap.filters.status')}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={viewMode === 'done'}
          >
            {statusFilters.map((s) => (
              <option key={s} value={s}>
                {s === 'All'
                  ? t('roadmap.filters.all')
                  : s === 'Active'
                    ? statusText('active')
                    : s === 'Blocked'
                      ? statusText('blocked')
                      : statusText('done')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-global mega-grid" style={{ marginBottom: 12 }}>
        {megaStats.map((mega) => {
          const total = mega.active + mega.blocked + mega.done
          const donePct = Math.round(total === 0 ? 0 : (mega.done / total) * 100)
          const dimmed = selectedMega && selectedMega !== mega.id
          return (
            <button
              type="button"
              key={mega.id}
              className={`mega-card ${selectedMega === mega.id ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`}
              onClick={() => selectMega(mega.id)}
            >
              <div className="mega-top">
                <div>
                  <div className="mega-tag">{t('roadmap.mega.tag')}</div>
                  <div className="mega-name">{mega.label}</div>
                </div>
                <div className="mega-total">{t('roadmap.mega.totalTasks', { count: total })}</div>
              </div>

              <div className="mega-progress">
                <div className="mega-progress-track">
                  <div className="mega-progress-fill" style={{ width: `${donePct}%` }} />
                </div>
                <div className="mega-progress-meta">
                  <span>
                    {t('roadmap.mega.progress.donePct', { done: mega.done, pct: donePct })}
                  </span>
                  <span>
                    {t('roadmap.mega.progress.inFlight', { count: mega.active + mega.blocked })}
                  </span>
                </div>
              </div>

              <div className="mega-metrics">
                <span className="mega-chip status-active">
                  {statusText('active')} {mega.active}
                </span>
                <span className="mega-chip status-blocked">
                  {statusText('blocked')} {mega.blocked}
                </span>
                <span className="mega-chip status-done">
                  {statusText('done')} {mega.done}
                </span>
              </div>

              <div className="mega-meta">
                <span className="label">{t('roadmap.mega.departments')}</span>
                <div className="mega-pill-row">
                  {(mega.departments.length ? mega.departments : ['—']).map((d) => (
                    <span key={d} className="mega-pill">
                      {d === '—' ? '—' : departmentText(d)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mega-meta">
                <span className="label">{t('roadmap.mega.platform')}</span>
                <div className="mega-pill-row">
                  {(mega.platforms.length ? mega.platforms : ['—']).map((p) => (
                    <span key={p} className="mega-pill subtle">
                      {p === '—' ? '—' : platformAreaText(p)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mega-impact">
                <span className="label">{t('roadmap.mega.lastImpact')}</span>
                <span className="value">{mega.lastImpact}</span>
              </div>
            </button>
          )
        })}
      </div>

      {selectedMega ? (
        <div className="ongoing-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 14 }}>
              <div className="ongoing-feed-header" style={{ alignItems: 'flex-start' }}>
                <div>
                  <p className="ongoing-label">{t('roadmap.mega.focusLabel')}</p>
                  <h3 className="ongoing-feed-title">{megaLabel(selectedMega)}</h3>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="feed-count">
                    {t('roadmap.feed.items', {
                      count: baseFiltered.filter((t) => t.megaStoryId === selectedMega).length,
                    })}
                  </span>
                </div>
              </div>

              <>
                <div className="ongoing-feed-list">
                  {storiesOrdered.map((story) => {
                    const tasksForStory = tasksByStory.get(story.id) || []
                    if (
                      tasksForStory.length === 0 &&
                      storyFilter !== 'All' &&
                      storyFilter !== story.id
                    )
                      return null
                    const open = openStories.has(story.id) || tasksForStory.length === 0
                    const storyFocused = focusedStoryId === story.id
                    const storyDimmed = focusedStoryId && focusedStoryId !== story.id
                    return (
                      <div
                        key={story.id}
                        className={`ongoing-card story-card ${storyFocused ? 'focused' : ''} ${storyDimmed ? 'dimmed' : ''}`}
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                      >
                        <button
                          type="button"
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            padding: 0,
                          }}
                          onClick={() => {
                            preserveScroll(() => {
                              toggleStory(story.id)
                              setSelectedStoryId(story.id)
                              if (tasksForStory.length > 0) {
                                setSelectedId(tasksForStory[0].id)
                              } else {
                                setSelectedId(null)
                              }
                            })
                          }}
                        >
                          <div className="ongoing-card-header" style={{ marginBottom: 0 }}>
                            <div>
                              <div className="ongoing-card-title">{story.activity}</div>
                              <div className="ongoing-card-meta">
                                <span className="ongoing-pill subtle">
                                  {story.area || t('roadmap.story.areaTbd')}
                                </span>
                                <span className="ongoing-pill subtle">
                                  {story.department || t('roadmap.story.deptTbd')}
                                </span>
                              </div>
                            </div>
                            <div className="ongoing-updated">
                              {t('roadmap.story.tasksCount', { count: tasksForStory.length })}
                            </div>
                          </div>
                        </button>

                        {open && (
                          <div className="ongoing-feed-list" style={{ marginTop: 10 }}>
                            {tasksForStory.map((item) => (
                              <button
                                type="button"
                                key={item.id}
                                className={`ongoing-card ${selectedId === item.id ? 'selected' : ''}`}
                                onClick={() => setSelectedId(item.id)}
                              >
                                <div className="ongoing-card-header">
                                  <div>
                                    <div className="ongoing-card-title">{item.title}</div>
                                    <div className="ongoing-card-meta">
                                      <span className={`ongoing-badge status-${item.status}`}>
                                        {statusText(item.status)}
                                      </span>
                                      <span className={`ongoing-badge priority-${item.priority}`}>
                                        {priorityText(item.priority)}
                                      </span>
                                      <span className="ongoing-pill">{item.owner}</span>
                                    </div>
                                  </div>
                                  <div className="ongoing-updated">
                                    {viewMode === 'done'
                                      ? t('roadmap.task.completedAt', {
                                          date: item.completedAt || '-',
                                        })
                                      : t('roadmap.task.createdAt', { date: item.createdAt })}
                                  </div>
                                </div>
                                <div className="ongoing-line">
                                  <span className="label">{t('roadmap.task.nextStep')}</span>
                                  <span className="value">{item.nextStep}</span>
                                </div>
                                {item.status === 'blocked' && item.dependencies?.length > 0 && (
                                  <div className="ongoing-line">
                                    <span className="label">{t('roadmap.task.blocker')}</span>
                                    <span className="value">{item.dependencies.join(' - ')}</span>
                                  </div>
                                )}
                                {viewMode === 'done' && item.impactType && (
                                  <div className="ongoing-line">
                                    <span className="label">{t('roadmap.task.impact')}</span>
                                    <span className="value">{`${impactTypeText(item.impactType)} - ${item.impactedDepartment} - ${item.impactedPlatformArea}`}</span>
                                  </div>
                                )}
                              </button>
                            ))}
                            {tasksForStory.length === 0 && (
                              <div className="ongoing-empty">
                                {t('roadmap.empty.noTasksForStory')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {storiesForSelected.length === 0 && (
                    <div className="ongoing-empty">{t('roadmap.empty.noStoriesForMega')}</div>
                  )}
                </div>
              </>
            </div>
          </div>

          <aside className="ongoing-details card">
            {selectedTask ? (
              <div className="ongoing-details-content">
                <div className="ongoing-detail-head">
                  <div>
                    <p className="ongoing-label">{t('roadmap.details.title')}</p>
                    <h3 className="ongoing-detail-title">{selectedTask.title}</h3>
                    <div className="detail-subline">
                      {megaLabel(selectedTask.megaStoryId)} - {storyLabel(selectedTask.storyId)}
                    </div>
                    <div className="detail-story-link">
                      {t('roadmap.details.storyFocus', { story: storyLabel(selectedTask.storyId) })}
                    </div>
                  </div>
                  <div className="ongoing-detail-badges">
                    <span className={`ongoing-badge status-${selectedTask.status}`}>
                      {statusText(selectedTask.status)}
                    </span>
                    <span className={`ongoing-badge priority-${selectedTask.priority}`}>
                      {priorityText(selectedTask.priority)}
                    </span>
                    <span className="ongoing-pill">{selectedTask.department}</span>
                    <span className="ongoing-pill subtle">{selectedTask.platformArea}</span>
                  </div>
                </div>

                {selectedValidation && !selectedValidation.valid && (
                  <div className="ongoing-detail-section">
                    <div className="detail-label">{t('roadmap.triage.needsTriage')}</div>
                    <p className="detail-text">{t(selectedValidation.reasonKey)}</p>
                    <div className="detail-label" style={{ marginTop: 8 }}>
                      {t('roadmap.filters.megaStory')}
                    </div>
                    <select
                      value={fixMega}
                      onChange={(e) => {
                        setFixMega(e.target.value)
                        setFixStory('')
                      }}
                    >
                      <option value="">{t('roadmap.triage.selectMegaStory')}</option>
                      {Object.keys(megaMap).map((id) => (
                        <option key={id} value={id}>
                          {megaLabel(id)}
                        </option>
                      ))}
                    </select>
                    <div className="detail-label" style={{ marginTop: 8 }}>
                      {t('roadmap.filters.story')}
                    </div>
                    <select
                      value={fixStory}
                      onChange={(e) => setFixStory(e.target.value)}
                      disabled={!fixMega}
                    >
                      <option value="">{t('roadmap.triage.selectStory')}</option>
                      {triageFixStories.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <div className="ongoing-detail-actions" style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          if (!fixMega || !fixStory) return
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === selectedTask.id
                                ? { ...t, megaStoryId: fixMega, storyId: fixStory }
                                : t
                            )
                          )
                        }}
                      >
                        {t('roadmap.triage.saveMapping')}
                      </button>
                    </div>
                  </div>
                )}

                <div className="ongoing-detail-section">
                  <div className="detail-label">{t('roadmap.details.objective')}</div>
                  <p className="detail-text">{selectedTask.objective}</p>
                </div>
                <div className="ongoing-detail-section">
                  <div className="detail-label">{t('roadmap.task.nextStep')}</div>
                  <p className="detail-text">{selectedTask.nextStep}</p>
                </div>
                {selectedTask.dependencies?.length > 0 && (
                  <div className="ongoing-detail-section">
                    <div className="detail-label">{t('roadmap.details.dependencies')}</div>
                    <p className="detail-text">{selectedTask.dependencies.join(' - ')}</p>
                  </div>
                )}
                <div className="ongoing-detail-section">
                  <div className="detail-label">{t('roadmap.details.created')}</div>
                  <p className="detail-text">{selectedTask.createdAt}</p>
                </div>

                {selectedTask.status === 'done' && (
                  <div className="ongoing-detail-section">
                    <div className="detail-label">{t('roadmap.task.impact')}</div>
                    <p className="detail-text">
                      {selectedTask.impactType
                        ? `${impactTypeText(selectedTask.impactType)} - ${selectedTask.impactedDepartment} - ${selectedTask.impactedPlatformArea}`
                        : t('roadmap.impact.capturedOnDone')}
                    </p>
                    {selectedTask.impactedKPI && (
                      <p className="detail-text">
                        {t('roadmap.impact.kpi', { kpi: selectedTask.impactedKPI })}
                      </p>
                    )}
                    {selectedTask.impactNote && (
                      <p className="detail-text">
                        {t('roadmap.impact.note', { note: selectedTask.impactNote })}
                      </p>
                    )}
                    {selectedTask.completedAt && (
                      <p className="detail-text">
                        {t('roadmap.impact.completedOn', { date: selectedTask.completedAt })}
                      </p>
                    )}
                  </div>
                )}

                {selectedTask.status !== 'done' && selectedValidation?.valid && (
                  <div className="ongoing-detail-actions">
                    <button type="button" className="btn secondary" onClick={handleMarkDone}>
                      {t('roadmap.markDone.button')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ongoing-empty">
                <p className="ongoing-label">{t('roadmap.details.panelTitle')}</p>
                <h3 className="ongoing-feed-title">{t('roadmap.details.selectTask')}</h3>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="ongoing-empty">{t('roadmap.empty.selectMega')}</div>
      )}

      {showImpactModal && (
        <div className="modal-backdrop">
          <div className="modal-card modal-form">
            <div className="modal-header">
              <div>
                <div className="detail-label">{t('roadmap.markDone.title')}</div>
                <h3 style={{ margin: 0 }}>{selectedTask?.title}</h3>
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowImpactModal(false)}
              >
                {t('roadmap.common.close')}
              </button>
            </div>

            <div className="modal-form__grid">
              <div className="modal-section">
                <div className="label">{t('roadmap.markDone.impactType')}</div>
                <select
                  value={impactDraft.impactType}
                  onChange={(e) => setImpactDraft((d) => ({ ...d, impactType: e.target.value }))}
                >
                  <option value="">{t('roadmap.markDone.selectImpactType')}</option>
                  {impactTypes.map((tp) => (
                    <option key={tp} value={tp}>
                      {impactTypeText(tp)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-section">
                <div className="label">{t('roadmap.markDone.impactedDepartment')}</div>
                <select
                  value={impactDraft.impactedDepartment}
                  onChange={(e) =>
                    setImpactDraft((d) => ({ ...d, impactedDepartment: e.target.value }))
                  }
                >
                  <option value="">{t('roadmap.markDone.selectDepartment')}</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {departmentText(d)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-section">
                <div className="label">{t('roadmap.markDone.impactedPlatformArea')}</div>
                <select
                  value={impactDraft.impactedPlatformArea}
                  onChange={(e) =>
                    setImpactDraft((d) => ({ ...d, impactedPlatformArea: e.target.value }))
                  }
                >
                  <option value="">{t('roadmap.markDone.selectArea')}</option>
                  {platformAreas.map((p) => (
                    <option key={p} value={p}>
                      {platformAreaText(p)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-section">
                <div className="label">{t('roadmap.markDone.impactedKpi')}</div>
                <input
                  type="text"
                  value={impactDraft.impactedKPI}
                  onChange={(e) => setImpactDraft((d) => ({ ...d, impactedKPI: e.target.value }))}
                  placeholder={t('roadmap.markDone.kpiPlaceholder')}
                />
              </div>
              <div className="modal-section modal-form__full">
                <div className="label">{t('roadmap.markDone.impactNoteOptional')}</div>
                <textarea
                  rows={3}
                  value={impactDraft.impactNote}
                  onChange={(e) => setImpactDraft((d) => ({ ...d, impactNote: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-form__footer ongoing-detail-actions" style={{ marginTop: 6 }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowImpactModal(false)}
              >
                {t('roadmap.common.cancel')}
              </button>
              <button type="button" className="btn" onClick={saveImpact}>
                {t('roadmap.markDone.saveAndClose')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
        <div
          className="ongoing-feed-header"
          style={{ cursor: 'pointer' }}
          onClick={() => setTriageOpen((v) => !v)}
        >
          <div>
            <p className="ongoing-label">{t('roadmap.triage.needsTriage')}</p>
            <h3 className="ongoing-feed-title">{t('roadmap.triage.mappingFixesRequired')}</h3>
          </div>
          <div className="ongoing-pill subtle">{triageTasks.length}</div>
        </div>
        {triageOpen && (
          <div className="ongoing-feed-list">
            {triageTasks.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`ongoing-card ${selectedId === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="ongoing-card-header">
                  <div>
                    <div className="ongoing-card-title">{item.title}</div>
                    <div className="ongoing-card-meta">
                      <span className={`ongoing-badge priority-${item.priority}`}>
                        {priorityText(item.priority)}
                      </span>
                    </div>
                  </div>
                  <div className="ongoing-updated">
                    {item.megaStoryId || t('roadmap.triage.noMega')} -{' '}
                    {item.storyId || t('roadmap.triage.noStory')}
                  </div>
                </div>
                <div className="ongoing-line">
                  <span className="label">{t('roadmap.triage.reason')}</span>
                  <span className="value">{t(item.triageReason)}</span>
                </div>
              </button>
            ))}
            {triageTasks.length === 0 && (
              <div className="ongoing-empty">{t('roadmap.triage.noTasks')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
