import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../../context/AuthContext'
import {
  deleteWeeklyTask,
  ensureSeededCurrentWeek,
  ensureWeekMap,
  getWeekMap,
  getWeekRange,
  listWeeks,
  loadWeeklyMapStore,
  saveWeeklyMapStore,
  upsertWeeklyTask,
} from '../utils/weeklyMapStore'

const weeklyStatusColumns = [
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'done', label: 'Done' },
]

const departments = ['Infrastructure', 'Product', 'Data', 'Compliance', 'UX', 'Partners']

const TASK_CHECKLISTS = {
  'Prepare Solitics call': {
    title: 'Prepare Solitics call — Checklist',
    sections: [
      {
        title: 'USE CASES',
        items: [
          'What concrete user behaviors are we trying to detect?',
          'Which retention or churn scenarios matter most right now?',
        ],
      },
      {
        title: 'DATA & INTEGRATION',
        items: [
          'What is the minimum dataset needed to generate value?',
          'What can be excluded safely?',
        ],
      },
      {
        title: 'DECISION-MAKING',
        items: [
          'What decisions should Solitics actively support?',
          'What remains internal decision logic?',
        ],
      },
      {
        title: 'OWNERSHIP & LIMITS',
        items: [
          'What Solitics should NOT do?',
          'How do we measure success after 30 days?',
        ],
      },
    ],
  },
  'Prepare call with Stamatis': {
    title: 'Prepare call with Stamatis — Checklist',
    sections: [
      {
        title: 'PRIORITIES',
        items: [
          'What is the single top priority for the next 30–60 days?',
          'What can explicitly be deprioritized?',
        ],
      },
      {
        title: 'GOVERNANCE',
        items: [
          'Who decides what enters or exits the roadmap?',
          'What defines success or failure of an initiative?',
        ],
      },
      {
        title: 'ROLE & AUTONOMY',
        items: [
          'Which decisions can be taken autonomously?',
          'When is escalation required?',
        ],
      },
      {
        title: 'CLOSURE',
        items: [
          'What concrete decisions must be taken in this call?',
          'What follow-up is required after the call?',
        ],
      },
    ],
  },
}

function makeId() {
  return `w_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export default function WeeklyMapView({ megaMap, storyMap, filterMegaStoryId }) {
  const currentWeek = useMemo(() => getWeekRange(new Date()), [])
  const { user } = useAuth()
  const currentUserName = user?.name || ''

  const [store, setStore] = useState(() => loadWeeklyMapStore())
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeek.week_start)
  const [checklistTask, setChecklistTask] = useState(null)

  useEffect(() => {
    // Ensure the current week map exists and is seeded (never empty by default).
    let next = loadWeeklyMapStore()
    next = ensureWeekMap(next, currentWeek.week_start, currentWeek.week_end, 'active')
    next = ensureSeededCurrentWeek(next)
    saveWeeklyMapStore(next)
    setStore(next)
  }, [currentWeek.week_end, currentWeek.week_start])

  const weeks = useMemo(() => listWeeks(store), [store])

  const selectedBucket = useMemo(() => {
    return getWeekMap(store, selectedWeekStart)
  }, [store, selectedWeekStart])

  const isCurrentWeek = selectedWeekStart === currentWeek.week_start
  const readOnly = !isCurrentWeek

  const tasks = useMemo(() => {
    const list = selectedBucket?.tasks
    return Array.isArray(list) ? list : []
  }, [selectedBucket])

  const tasksFiltered = useMemo(() => {
    if (!filterMegaStoryId) return tasks
    return tasks.filter((t) => t.megaStoryId === filterMegaStoryId)
  }, [tasks, filterMegaStoryId])

  const checklistData = useMemo(() => {
    const key = String(checklistTask?.title || '').trim()
    return key ? TASK_CHECKLISTS[key] || null : null
  }, [checklistTask])

  const checklistOpen = Boolean(checklistTask && checklistData)

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!checklistOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [checklistOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!checklistOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setChecklistTask(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [checklistOpen])

  const tasksGroupedByMega = useMemo(() => {
    const map = new Map()
    tasksFiltered.forEach((t) => {
      const megaId = t.megaStoryId || 'unknown'
      const list = map.get(megaId) || []
      list.push(t)
      map.set(megaId, list)
    })
    return map
  }, [tasksFiltered])

  const storyLabel = (storyId) => storyMap?.[storyId]?.label || storyId
  const megaLabel = (megaId) => megaMap?.[megaId]?.label || megaId

  const megaOptions = useMemo(() => {
    const ids = megaMap ? Object.keys(megaMap) : []
    return ids.map((id) => ({ id, label: megaLabel(id) }))
  }, [megaMap])

  const storyOptions = useMemo(() => {
    const ids = storyMap ? Object.keys(storyMap) : []
    const byMega = filterMegaStoryId
      ? ids.filter((id) => {
        const s = storyMap[id]
        return s && s.objectiveId === filterMegaStoryId
      })
      : ids
    return byMega.map((id) => ({ id, label: storyLabel(id) }))
  }, [filterMegaStoryId, storyMap])

  const [draft, setDraft] = useState({
    megaStoryId: filterMegaStoryId || '',
    title: '',
    storyId: '',
    department: departments[0],
    owner: currentUserName,
    expectedImpact: '',
  })

  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    // Keep a sensible default owner, without clobbering manual edits.
    if (!currentUserName) return
    setDraft((d) => (String(d.owner || '').trim() ? d : { ...d, owner: currentUserName }))
  }, [currentUserName])

  useEffect(() => {
    // Keep the mega filter pinned when in filtered mode.
    if (!filterMegaStoryId) return
    setDraft((d) => ({ ...d, megaStoryId: filterMegaStoryId }))
  }, [filterMegaStoryId])

  const createTask = () => {
    if (readOnly) return
    const megaStoryId = filterMegaStoryId || String(draft.megaStoryId || '').trim()
    const title = String(draft.title || '').trim()
    const owner = String(draft.owner || '').trim()
    const expectedImpact = String(draft.expectedImpact || '').trim()
    if (!megaStoryId || !title || !owner || !expectedImpact) return

    const nextTask = {
      id: makeId(),
      weeklyMapId: selectedBucket.id,
      title,
      megaStoryId,
      storyId: draft.storyId ? draft.storyId : undefined,
      department: draft.department,
      owner,
      expectedImpact,
      status: 'planned',
      week_start: selectedBucket.week_start,
      week_end: selectedBucket.week_end,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setStore((prev) => {
      const ensured = ensureWeekMap(prev, selectedBucket.week_start, selectedBucket.week_end)
      const updated = upsertWeeklyTask(ensured, selectedBucket.week_start, nextTask)
      saveWeeklyMapStore(updated)
      return updated
    })

    setDraft((d) => ({ ...d, title: '', expectedImpact: '' }))
    setShowCreate(false)
  }

  const updateTaskStatus = (taskId, nextStatus) => {
    if (readOnly) return
    const existing = tasks.find((t) => t.id === taskId)
    if (!existing) return

    const updatedTask = { ...existing, status: nextStatus, updatedAt: new Date().toISOString() }
    setStore((prev) => {
      const updated = upsertWeeklyTask(prev, selectedBucket.week_start, updatedTask)
      saveWeeklyMapStore(updated)
      return updated
    })
  }

  const removeTask = (taskId) => {
    if (readOnly) return
    const ok = window.confirm('Delete this weekly task?')
    if (!ok) return
    setStore((prev) => {
      const updated = deleteWeeklyTask(prev, selectedBucket.week_start, taskId)
      saveWeeklyMapStore(updated)
      return updated
    })
  }

  const onDragStart = (e, taskId) => {
    if (readOnly) return
    e.dataTransfer.setData('text/plain', String(taskId))
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = (e, status) => {
    if (readOnly) return
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return
    updateTaskStatus(taskId, status)
  }

  const onDragOver = (e) => {
    if (readOnly) return
    e.preventDefault()
  }

  if (!selectedBucket) return null

  const totalTasks = tasksFiltered.length

  const headerTitle = filterMegaStoryId ? 'Weekly Map — filtered by Mega-Story' : 'Weekly Map (All Mega-Stories)'

  const modalNode = checklistOpen && typeof document !== 'undefined'
    ? createPortal(
      <div
        className="modal-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setChecklistTask(null)
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="modal-card"
          style={{ width: 'min(720px, 96vw)' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <div style={{ fontWeight: 800 }}>{checklistData.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                Read-only focus mode — use this to prepare decisions.
              </div>
            </div>
            <button type="button" className="btn secondary" onClick={() => setChecklistTask(null)}>Close</button>
          </div>

          {checklistData.sections.map((section) => (
            <div key={section.title} className="modal-section">
              <div className="label">{section.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {section.items.map((text) => (
                  <div key={text} style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.4 }}>
                    • {text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>,
      document.body
    )
    : null

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <p className="ongoing-label">{headerTitle}</p>
          {filterMegaStoryId ? (
            <h3 className="ongoing-feed-title" style={{ marginBottom: 2 }}>{megaLabel(filterMegaStoryId)}</h3>
          ) : (
            <h3 className="ongoing-feed-title" style={{ marginBottom: 2 }}>Execution contract for the week</h3>
          )}
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Week {selectedBucket.week_start} → {selectedBucket.week_end}
            {isCurrentWeek ? ' (CURRENT WEEK)' : ''}
            {selectedBucket.status === 'archived' || !isCurrentWeek ? ' (archived, read-only)' : ''}
          </div>
          <div className="ongoing-counter-pill" style={{ marginTop: 8 }}>
            <span className="pill-dot dot-progress" aria-hidden="true" />
            <span>Execution commitments</span>
            <span className="pill-sep">&middot;</span>
            <span>{totalTasks} tasks</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>Week</label>
            <select
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px', minWidth: 200 }}
            >
              {weeks.map((w) => (
                <option key={w.week_start} value={w.week_start}>
                  {w.week_start} → {w.week_end}{w.week_start === currentWeek.week_start ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={checklistOpen ? { pointerEvents: 'none' } : undefined}>
        {Array.from(tasksGroupedByMega.entries()).map(([megaId, list]) => {
        const byStatus = { planned: [], in_progress: [], blocked: [], done: [] }
        list.forEach((t) => {
          const key = byStatus[t.status] ? t.status : 'planned'
          byStatus[key].push(t)
        })

        return (
          <div key={megaId} style={{ marginTop: 14 }}>
            {!filterMegaStoryId ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>{megaLabel(megaId)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{list.length} tasks</div>
              </div>
            ) : null}

            <div className="roadmap-board">
              {weeklyStatusColumns.map((col) => (
                <div
                  key={col.id}
                  className={`roadmap-column ${readOnly ? 'weekly-readonly' : ''}`}
                  onDrop={(e) => onDrop(e, col.id)}
                  onDragOver={onDragOver}
                >
                  <div className="roadmap-column-header">
                    <div className="roadmap-column-title">{col.label}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{(byStatus[col.id] || []).length}</div>
                  </div>

                  <div className="roadmap-column-body">
                    {(byStatus[col.id] || []).map((t) => {
                      const checklistKey = String(t.title || '').trim()
                      const hasChecklist = t.status === 'planned' && Boolean(TASK_CHECKLISTS[checklistKey])
                      const isDraggable = !readOnly && !hasChecklist
                      return (
                      <div
                        key={t.id}
                        className="roadmap-card"
                        draggable={isDraggable}
                        onDragStart={(e) => {
                          if (!isDraggable) {
                            e.preventDefault()
                            return
                          }
                          onDragStart(e, t.id)
                        }}
                        onClick={() => {
                          if (!hasChecklist) return
                          setChecklistTask(t)
                        }}
                        style={{ cursor: readOnly ? 'default' : (hasChecklist ? 'pointer' : 'grab') }}
                      >
                        <div className="roadmap-card-header">
                          <div>
                            <div className="roadmap-area">{t.owner || '—'}</div>
                            <div className="roadmap-activity">{t.title}</div>
                          </div>
                          {!readOnly ? (
                            <button
                              type="button"
                              className="btn secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeTask(t.id)
                              }}
                              style={{ padding: '6px 8px', fontSize: 12 }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                        <div className="roadmap-meta">
                          {!filterMegaStoryId ? (
                            <div>
                              <span className="label">Mega</span>
                              <span className="value"> {megaLabel(t.megaStoryId || megaId)}</span>
                            </div>
                          ) : null}

                          <div>
                            <span className="label">Dept</span>
                            <span className="value"> {t.department || '—'}</span>
                          </div>
                          <div>
                            <span className="label">Story</span>
                            <span className="value"> {t.storyId ? storyLabel(t.storyId) : '—'}</span>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, color: '#9fb3c8', fontSize: 12, lineHeight: 1.35 }}>
                          {t.expectedImpact}
                        </div>
                      </div>
                    )})}
                    {(byStatus[col.id] || []).length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: 12 }}>No tasks</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
        })}
      </div>

      <div style={{ marginTop: 14, opacity: readOnly ? 0.6 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Add a new commitment (current week only)
          </div>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setShowCreate((v) => !v)}
            disabled={readOnly}
            style={{ padding: '8px 10px', fontSize: 13 }}
          >
            {showCreate ? 'Hide form' : 'Add commitment'}
          </button>
        </div>

        {showCreate ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.9fr', gap: 8, alignItems: 'end' }}>
              {!filterMegaStoryId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)' }}>Mega-Story</label>
                  <select
                    value={draft.megaStoryId}
                    onChange={(e) => setDraft((d) => ({ ...d, megaStoryId: e.target.value }))}
                    disabled={readOnly}
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                  >
                    <option value="">Select…</option>
                    {megaOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Title</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Weekly task title"
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Story (optional)</label>
                <select
                  value={draft.storyId}
                  onChange={(e) => setDraft((d) => ({ ...d, storyId: e.target.value }))}
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                >
                  <option value="">—</option>
                  {storyOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Department</label>
                <select
                  value={draft.department}
                  onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))}
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                >
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Owner</label>
                <input
                  value={draft.owner}
                  onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))}
                  placeholder="Owner"
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                />
              </div>

              <button type="button" className="btn" onClick={createTask} disabled={readOnly} style={{ height: 38 }}>
                Save
              </button>
            </div>

            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Expected impact (mandatory)</label>
                <input
                  value={draft.expectedImpact}
                  onChange={(e) => setDraft((d) => ({ ...d, expectedImpact: e.target.value }))}
                  placeholder="Why it matters this week"
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                />
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Without Expected impact, the task can’t be saved.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {modalNode}
    </div>
  )
}
