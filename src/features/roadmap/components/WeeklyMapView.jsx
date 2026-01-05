import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../../context/AuthContext'
import { useI18n } from '../../../i18n/I18nContext'
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

const departments = ['Infrastructure', 'Product', 'Data', 'Compliance', 'UX', 'Partners']

function getTaskChecklists(t) {
  return {
    'Prepare Solitics call': {
      title: t('weeklyMap.checklists.prepareSolitics.title'),
      sections: [
        {
          title: t('weeklyMap.checklists.common.useCases.title'),
          items: [
            t('weeklyMap.checklists.prepareSolitics.useCases.item1'),
            t('weeklyMap.checklists.prepareSolitics.useCases.item2'),
          ],
        },
        {
          title: t('weeklyMap.checklists.common.dataIntegration.title'),
          items: [
            t('weeklyMap.checklists.prepareSolitics.data.item1'),
            t('weeklyMap.checklists.prepareSolitics.data.item2'),
          ],
        },
        {
          title: t('weeklyMap.checklists.common.decisionMaking.title'),
          items: [
            t('weeklyMap.checklists.prepareSolitics.decisions.item1'),
            t('weeklyMap.checklists.prepareSolitics.decisions.item2'),
          ],
        },
        {
          title: t('weeklyMap.checklists.common.ownershipLimits.title'),
          items: [
            t('weeklyMap.checklists.prepareSolitics.ownership.item1'),
            t('weeklyMap.checklists.prepareSolitics.ownership.item2'),
          ],
        },
      ],
    },
    'Prepare call with Stamatis': {
      title: t('weeklyMap.checklists.prepareStamatis.title'),
      sections: [
        {
          title: t('weeklyMap.checklists.common.priorities.title'),
          items: [
            t('weeklyMap.checklists.prepareStamatis.priorities.item1'),
            t('weeklyMap.checklists.prepareStamatis.priorities.item2'),
          ],
        },
        {
          title: t('weeklyMap.checklists.common.governance.title'),
          items: [
            t('weeklyMap.checklists.prepareStamatis.governance.item1'),
            t('weeklyMap.checklists.prepareStamatis.governance.item2'),
          ],
        },
        {
          title: t('weeklyMap.checklists.common.roleAutonomy.title'),
          items: [
            t('weeklyMap.checklists.prepareStamatis.autonomy.item1'),
            t('weeklyMap.checklists.prepareStamatis.autonomy.item2'),
          ],
        },
        {
          title: t('weeklyMap.checklists.common.closure.title'),
          items: [
            t('weeklyMap.checklists.prepareStamatis.closure.item1'),
            t('weeklyMap.checklists.prepareStamatis.closure.item2'),
          ],
        },
      ],
    },
  }
}

function makeId() {
  return `w_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export default function WeeklyMapView({ megaMap, storyMap, filterMegaStoryId }) {
  const { t } = useI18n()
  const weeklyStatusColumns = useMemo(() => [
    { id: 'planned', label: t('weeklyMap.columns.planned') },
    { id: 'in_progress', label: t('weeklyMap.columns.inProgress') },
    { id: 'blocked', label: t('weeklyMap.columns.blocked') },
    { id: 'done', label: t('weeklyMap.columns.done') },
  ], [t])
  const TASK_CHECKLISTS = useMemo(() => getTaskChecklists(t), [t])
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
    tasksFiltered.forEach((task) => {
      const megaId = task.megaStoryId || 'unknown'
      const list = map.get(megaId) || []
      list.push(task)
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
    const ok = window.confirm(t('weeklyMap.confirm.deleteTask'))
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

  const headerTitle = filterMegaStoryId ? t('weeklyMap.header.filteredTitle') : t('weeklyMap.header.allTitle')

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
                {t('weeklyMap.modal.readOnlyHint')}
              </div>
            </div>
            <button type="button" className="btn secondary" onClick={() => setChecklistTask(null)}>{t('common.close')}</button>
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
            <h3 className="ongoing-feed-title" style={{ marginBottom: 2 }}>{t('weeklyMap.header.executionContract')}</h3>
          )}
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {t('weeklyMap.header.weekRange', { start: selectedBucket.week_start, end: selectedBucket.week_end })}
            {isCurrentWeek ? ` ${t('weeklyMap.header.currentWeekBadge')}` : ''}
            {selectedBucket.status === 'archived' || !isCurrentWeek ? ` ${t('weeklyMap.header.archivedReadOnlyBadge')}` : ''}
          </div>
          <div className="ongoing-counter-pill" style={{ marginTop: 8 }}>
            <span className="pill-dot dot-progress" aria-hidden="true" />
            <span>{t('weeklyMap.header.executionCommitments')}</span>
            <span className="pill-sep">&middot;</span>
            <span>{t('weeklyMap.header.tasksCount', { count: totalTasks })}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('weeklyMap.filters.week')}</label>
            <select
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px', minWidth: 200 }}
            >
              {weeks.map((w) => (
                <option key={w.week_start} value={w.week_start}>
                  {w.week_start} → {w.week_end}{w.week_start === currentWeek.week_start ? ` ${t('weeklyMap.filters.currentBadge')}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={checklistOpen ? { pointerEvents: 'none' } : undefined}>
        {Array.from(tasksGroupedByMega.entries()).map(([megaId, list]) => {
        const byStatus = { planned: [], in_progress: [], blocked: [], done: [] }
        list.forEach((task) => {
          const key = byStatus[task.status] ? task.status : 'planned'
          byStatus[key].push(task)
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
                    {(byStatus[col.id] || []).map((task) => {
                      const checklistKey = String(task.title || '').trim()
                      const hasChecklist = task.status === 'planned' && Boolean(TASK_CHECKLISTS[checklistKey])
                      const isDraggable = !readOnly && !hasChecklist
                      return (
                      <div
                        key={task.id}
                        className="roadmap-card"
                        draggable={isDraggable}
                        onDragStart={(e) => {
                          if (!isDraggable) {
                            e.preventDefault()
                            return
                          }
                          onDragStart(e, task.id)
                        }}
                        onClick={() => {
                          if (!hasChecklist) return
                          setChecklistTask(task)
                        }}
                        style={{ cursor: readOnly ? 'default' : (hasChecklist ? 'pointer' : 'grab') }}
                      >
                        <div className="roadmap-card-header">
                          <div>
                            <div className="roadmap-area">{task.owner || '—'}</div>
                            <div className="roadmap-activity">{task.title}</div>
                          </div>
                          {!readOnly ? (
                            <button
                              type="button"
                              className="btn secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeTask(task.id)
                              }}
                              style={{ padding: '6px 8px', fontSize: 12 }}
                            >
                              {t('common.delete')}
                            </button>
                          ) : null}
                        </div>
                        <div className="roadmap-meta">
                          {!filterMegaStoryId ? (
                            <div>
                              <span className="label">{t('weeklyMap.card.mega')}</span>
                              <span className="value"> {megaLabel(task.megaStoryId || megaId)}</span>
                            </div>
                          ) : null}

                          <div>
                            <span className="label">{t('weeklyMap.card.dept')}</span>
                            <span className="value"> {task.department || '—'}</span>
                          </div>
                          <div>
                            <span className="label">{t('weeklyMap.card.story')}</span>
                            <span className="value"> {task.storyId ? storyLabel(task.storyId) : '—'}</span>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, color: '#9fb3c8', fontSize: 12, lineHeight: 1.35 }}>
                          {task.expectedImpact}
                        </div>
                      </div>
                    )})}
                    {(byStatus[col.id] || []).length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: 12 }}>{t('weeklyMap.empty.noTasks')}</div>
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
            {t('weeklyMap.actions.addCommitmentHint')}
          </div>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setShowCreate((v) => !v)}
            disabled={readOnly}
            style={{ padding: '8px 10px', fontSize: 13 }}
          >
            {showCreate ? t('weeklyMap.actions.hideForm') : t('weeklyMap.actions.addCommitment')}
          </button>
        </div>

        {showCreate ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.9fr', gap: 8, alignItems: 'end' }}>
              {!filterMegaStoryId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('weeklyMap.form.megaStory')}</label>
                  <select
                    value={draft.megaStoryId}
                    onChange={(e) => setDraft((d) => ({ ...d, megaStoryId: e.target.value }))}
                    disabled={readOnly}
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                  >
                    <option value="">{t('common.selectEllipsis')}</option>
                    {megaOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('weeklyMap.form.title')}</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder={t('weeklyMap.placeholders.weeklyTaskTitle')}
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('weeklyMap.form.storyOptional')}</label>
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
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('weeklyMap.form.department')}</label>
                <select
                  value={draft.department}
                  onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))}
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                >
                  {departments.map((d) => <option key={d} value={d}>{t(`departments.${d}`)}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('weeklyMap.form.owner')}</label>
                <input
                  value={draft.owner}
                  onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))}
                  placeholder={t('weeklyMap.placeholders.owner')}
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                />
              </div>

              <button type="button" className="btn" onClick={createTask} disabled={readOnly} style={{ height: 38 }}>
                {t('common.save')}
              </button>
            </div>

            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>{t('weeklyMap.form.expectedImpactMandatory')}</label>
                <input
                  value={draft.expectedImpact}
                  onChange={(e) => setDraft((d) => ({ ...d, expectedImpact: e.target.value }))}
                  placeholder={t('weeklyMap.placeholders.expectedImpact')}
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                />
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {t('weeklyMap.validation.expectedImpactRequired')}
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
