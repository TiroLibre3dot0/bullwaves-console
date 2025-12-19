import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ongoingItems from '../data/ongoingItems'
import { strategicObjectives, projects2026 } from '../../roadmap/data/roadmapData'

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

export default function OngoingPage() {
  const megaMap = useMemo(() => mapById(strategicObjectives), [])
  const storyMap = useMemo(() => mapById(projects2026, 'activity'), [])

  const validateTask = useCallback((task) => {
    if (!megaMap[task.megaStoryId]) return { valid: false, reason: 'Unknown megaStoryId' }
    const story = storyMap[task.storyId]
    if (!story) return { valid: false, reason: 'Unknown storyId' }
    if (story.objectiveId && story.objectiveId !== task.megaStoryId) return { valid: false, reason: 'storyId not under megaStoryId' }
    return { valid: true }
  }, [megaMap, storyMap])

  const [tasks, setTasks] = useState(() => loadTasks(ongoingItems))
  const [viewMode, setViewMode] = useState('active')
  const [megaFilter, setMegaFilter] = useState('All')
  const [storyFilter, setStoryFilter] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
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

  const selectedTask = tasks.find((t) => t.id === selectedId) || null
  const selectedValidation = selectedTask ? validateTask(selectedTask) : null

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (e) {
      // ignore persist errors
    }
  }, [tasks])

  const resetToSeed = () => {
    const ok = window.confirm('This will overwrite local changes and reset to seed data. Continue?')
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
        triage.push({ ...task, triageReason: verdict.reason })
      }
    })
    return { validTasks: valid, triageTasks: triage }
  }, [tasks, validateTask])

  const storyOptions = useMemo(() => {
    const filtered = validTasks.filter((t) => (megaFilter === 'All' ? true : t.megaStoryId === megaFilter))
    const ids = Array.from(new Set(filtered.map((t) => t.storyId)))
    return ['All', ...ids]
  }, [megaFilter, validTasks])

  const baseFiltered = useMemo(() => {
    const scope = viewMode === 'done' ? validTasks.filter((t) => t.status === 'done') : validTasks.filter((t) => t.status !== 'done')
    return scope
      .filter((t) => (megaFilter === 'All' ? true : t.megaStoryId === megaFilter))
      .filter((t) => (storyFilter === 'All' ? true : t.storyId === storyFilter))
      .filter((t) => (departmentFilter === 'All' ? true : t.department === departmentFilter))
      .filter((t) => (platformFilter === 'All' ? true : t.platformArea === platformFilter))
      .filter((t) => (statusFilter === 'All' ? true : statusLabel[t.status] === statusFilter))
      .sort((a, b) => {
        const statusRank = { active: 0, blocked: 1, done: 2 }
        const priorityRank = { high: 0, medium: 1, low: 2 }
        if (statusRank[a.status] !== statusRank[b.status]) return statusRank[a.status] - statusRank[b.status]
        if (priorityRank[a.priority] !== priorityRank[b.priority]) return priorityRank[a.priority] - priorityRank[b.priority]
        return a.createdAt.localeCompare(b.createdAt)
      })
  }, [departmentFilter, megaFilter, platformFilter, statusFilter, storyFilter, validTasks, viewMode])

  useEffect(() => {
    if (viewMode === 'done') {
      setStatusFilter('Done')
    } else if (statusFilter === 'Done') {
      setStatusFilter('All')
    }
  }, [statusFilter, viewMode])

  useEffect(() => {
    const exists = tasks.some((t) => t.id === selectedId)
    if (selectedId && exists) return
    if (baseFiltered.length > 0) {
      setSelectedId(baseFiltered[0].id)
      return
    }
    if (triageTasks.length > 0) {
      setSelectedId(triageTasks[0].id)
      return
    }
    setSelectedId(null)
  }, [baseFiltered, selectedId, tasks, triageTasks])

  useEffect(() => {
    if (selectedTask) {
      setFixMega(selectedTask.megaStoryId || '')
      setFixStory(selectedTask.storyId || '')
    } else {
      setFixMega('')
      setFixStory('')
    }
  }, [selectedTask])

  const totals = useMemo(() => {
    const base = { active: 0, blocked: 0, done: 0 }
    validTasks.forEach((t) => { base[t.status] += 1 })
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
    setTasks((prev) => prev.map((t) => (
      t.id === selectedTask.id
        ? { ...t, status: 'done', impactType, impactedDepartment, impactedPlatformArea, impactedKPI, impactNote: impactDraft.impactNote, completedAt }
        : t
    )))
    setShowImpactModal(false)
    setViewMode('done')
    setStatusFilter('Done')
  }

  const storyLabel = (storyId) => storyMap[storyId]?.label || storyId
  const megaLabel = (megaId) => megaMap[megaId]?.label || megaId
  const triageFixStories = useMemo(
    () => Object.values(storyMap).filter((s) => !fixMega || s.objectiveId === fixMega),
    [fixMega, storyMap]
  )

  return (
    <div className="ongoing-page">
      <div className="ongoing-header card-global">
        <div className="ongoing-title-wrap">
          <p className="ongoing-label">Execution layer</p>
          <h1 className="ongoing-title">Execution Board</h1>
          <p className="ongoing-subtitle">Active tasks tied to 2026 Roadmap mega-stories and stories.</p>
        </div>
        <div className="ongoing-header-actions">
          <div className="ongoing-counter-pill">
            <span className="pill-dot dot-progress" aria-hidden="true" />
            <span>{totals.active} active</span>
            <span className="pill-sep">·</span>
            <span className="pill-blocked">{totals.blocked} blocked</span>
            <span className="pill-sep">·</span>
            <span>{totals.done} done</span>
          </div>
          <button type="button" className="btn secondary" onClick={resetToSeed}>Reset to seed</button>
          <div className="ongoing-toggle">
            <button type="button" className={`chip ${viewMode === 'active' ? 'active' : ''}`} onClick={() => setViewMode('active')}>Active</button>
            <button type="button" className={`chip ${viewMode === 'done' ? 'active' : ''}`} onClick={() => setViewMode('done')}>Done</button>
          </div>
        </div>
      </div>

      <div className="ongoing-kpi-grid">
        <div className="ongoing-kpi card">
          <span className="kpi-label">Active execution</span>
          <div className="kpi-value">{totals.active + totals.blocked}</div>
        </div>
        <div className="ongoing-kpi card">
          <span className="kpi-label">Active</span>
          <div className="kpi-value">{totals.active}</div>
        </div>
        <div className="ongoing-kpi card">
          <span className="kpi-label">Blocked</span>
          <div className="kpi-value">{totals.blocked}</div>
        </div>
        <div className="ongoing-kpi card">
          <span className="kpi-label">Done / History</span>
          <div className="kpi-value">{totals.done}</div>
        </div>
      </div>

      <div className="ongoing-filters card">
        <div className="filter-field">
          <label>Mega-Story</label>
          <select value={megaFilter} onChange={(e) => setMegaFilter(e.target.value)}>
            <option value="All">All</option>
            {Object.keys(megaMap).map((id) => (
              <option key={id} value={id}>{megaLabel(id)}</option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Story</label>
          <select value={storyFilter} onChange={(e) => setStoryFilter(e.target.value)}>
            {storyOptions.map((id) => (
              <option key={id} value={id}>{id === 'All' ? 'All' : storyLabel(id)}</option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Department</label>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="All">All</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label>Platform area</label>
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
            <option value="All">All</option>
            {platformAreas.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} disabled={viewMode === 'done'}>
            {statusFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="ongoing-layout">
        <div className="ongoing-feed card">
          <div className="ongoing-feed-header">
            <div>
              <p className="ongoing-label">{viewMode === 'done' ? 'History' : 'Execution feed'}</p>
              <h3 className="ongoing-feed-title">{viewMode === 'done' ? 'Completed tasks' : 'Active execution'}</h3>
            </div>
            <span className="feed-count">{baseFiltered.length} items</span>
          </div>
          <div className="ongoing-feed-list">
            {baseFiltered.map((item) => (
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
                      <span className="ongoing-pill subtle">{megaLabel(item.megaStoryId)}</span>
                      <span className="ongoing-pill subtle">{storyLabel(item.storyId)}</span>
                      <span className={`ongoing-badge status-${item.status}`}>{statusLabel[item.status]}</span>
                      <span className={`ongoing-badge priority-${item.priority}`}>{priorityLabel[item.priority]}</span>
                      <span className="ongoing-pill">{item.owner}</span>
                    </div>
                  </div>
                  <div className="ongoing-updated">{viewMode === 'done' ? `Completed ${item.completedAt || '—'}` : `Created ${item.createdAt}`}</div>
                </div>
                <div className="ongoing-line">
                  <span className="label">Next step</span>
                  <span className="value">{item.nextStep}</span>
                </div>
                {item.status === 'blocked' && item.dependencies?.length > 0 && (
                  <div className="ongoing-line">
                    <span className="label">Blocker</span>
                    <span className="value">{item.dependencies.join(' • ')}</span>
                  </div>
                )}
                {viewMode === 'done' && item.impactType && (
                  <div className="ongoing-line">
                    <span className="label">Impact</span>
                    <span className="value">{`${item.impactType} · ${item.impactedDepartment} · ${item.impactedPlatformArea}`}</span>
                  </div>
                )}
              </button>
            ))}
            {baseFiltered.length === 0 && (
              <div className="ongoing-empty">No tasks match the current filters.</div>
            )}
          </div>
        </div>

        <aside className="ongoing-details card">
          {selectedTask ? (
            <div className="ongoing-details-content">
              <div className="ongoing-detail-head">
                <div>
                  <p className="ongoing-label">Details</p>
                  <h3 className="ongoing-detail-title">{selectedTask.title}</h3>
                  <div className="detail-subline">{megaLabel(selectedTask.megaStoryId)} · {storyLabel(selectedTask.storyId)}</div>
                </div>
                <div className="ongoing-detail-badges">
                  <span className={`ongoing-badge status-${selectedTask.status}`}>{statusLabel[selectedTask.status]}</span>
                  <span className={`ongoing-badge priority-${selectedTask.priority}`}>{priorityLabel[selectedTask.priority]}</span>
                  <span className="ongoing-pill">{selectedTask.department}</span>
                  <span className="ongoing-pill subtle">{selectedTask.platformArea}</span>
                </div>
              </div>

              {selectedValidation && !selectedValidation.valid && (
                <div className="ongoing-detail-section">
                  <div className="detail-label">Needs triage</div>
                  <p className="detail-text">{selectedValidation.reason}</p>
                  <div className="detail-label" style={{ marginTop: 8 }}>Mega-Story</div>
                  <select value={fixMega} onChange={(e) => { setFixMega(e.target.value); setFixStory('') }}>
                    <option value="">Select mega-story</option>
                    {Object.keys(megaMap).map((id) => (
                      <option key={id} value={id}>{megaLabel(id)}</option>
                    ))}
                  </select>
                  <div className="detail-label" style={{ marginTop: 8 }}>Story</div>
                  <select value={fixStory} onChange={(e) => setFixStory(e.target.value)} disabled={!fixMega}>
                    <option value="">Select story</option>
                    {triageFixStories.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <div className="ongoing-detail-actions" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        if (!fixMega || !fixStory) return
                        setTasks((prev) => prev.map((t) => (
                          t.id === selectedTask.id ? { ...t, megaStoryId: fixMega, storyId: fixStory } : t
                        )))
                      }}
                    >
                      Save mapping
                    </button>
                  </div>
                </div>
              )}

              <div className="ongoing-detail-section">
                <div className="detail-label">Objective</div>
                <p className="detail-text">{selectedTask.objective}</p>
              </div>
              <div className="ongoing-detail-section">
                <div className="detail-label">Next step</div>
                <p className="detail-text">{selectedTask.nextStep}</p>
              </div>
              {selectedTask.dependencies?.length > 0 && (
                <div className="ongoing-detail-section">
                  <div className="detail-label">Dependencies / blockers</div>
                  <p className="detail-text">{selectedTask.dependencies.join(' · ')}</p>
                </div>
              )}
              <div className="ongoing-detail-section">
                <div className="detail-label">Created</div>
                <p className="detail-text">{selectedTask.createdAt}</p>
              </div>

              {selectedTask.status === 'done' && (
                <div className="ongoing-detail-section">
                  <div className="detail-label">Impact</div>
                  <p className="detail-text">{selectedTask.impactType ? `${selectedTask.impactType} · ${selectedTask.impactedDepartment} · ${selectedTask.impactedPlatformArea}` : 'Captured when marked done.'}</p>
                  {selectedTask.impactedKPI && <p className="detail-text">KPI: {selectedTask.impactedKPI}</p>}
                  {selectedTask.impactNote && <p className="detail-text">Note: {selectedTask.impactNote}</p>}
                  {selectedTask.completedAt && <p className="detail-text">Completed on {selectedTask.completedAt}</p>}
                </div>
              )}

              {selectedTask.status !== 'done' && selectedValidation?.valid && (
                <div className="ongoing-detail-actions">
                  <button type="button" className="btn secondary" onClick={handleMarkDone}>Mark as done</button>
                </div>
              )}
            </div>
          ) : (
            <div className="ongoing-empty">
              <p className="ongoing-label">Details panel</p>
              <h3 className="ongoing-feed-title">Select a task to see details.</h3>
            </div>
          )}
        </aside>
      </div>

      {showImpactModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <div className="detail-label">Mark as done</div>
                <h3 style={{ margin: 0 }}>{selectedTask?.title}</h3>
              </div>
              <button type="button" className="btn secondary" onClick={() => setShowImpactModal(false)}>Close</button>
            </div>

            <div className="modal-section">
              <div className="label">Impact type</div>
              <select value={impactDraft.impactType} onChange={(e) => setImpactDraft((d) => ({ ...d, impactType: e.target.value }))}>
                <option value="">Select impact type</option>
                {impactTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="modal-section">
              <div className="label">Impacted department</div>
              <select value={impactDraft.impactedDepartment} onChange={(e) => setImpactDraft((d) => ({ ...d, impactedDepartment: e.target.value }))}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="modal-section">
              <div className="label">Impacted platform area</div>
              <select value={impactDraft.impactedPlatformArea} onChange={(e) => setImpactDraft((d) => ({ ...d, impactedPlatformArea: e.target.value }))}>
                <option value="">Select area</option>
                {platformAreas.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="modal-section">
              <div className="label">Impacted KPI</div>
              <input
                type="text"
                value={impactDraft.impactedKPI}
                onChange={(e) => setImpactDraft((d) => ({ ...d, impactedKPI: e.target.value }))}
                placeholder="Example: Payout SLA compliance"
              />
            </div>
            <div className="modal-section">
              <div className="label">Impact note (optional)</div>
              <textarea
                rows={3}
                value={impactDraft.impactNote}
                onChange={(e) => setImpactDraft((d) => ({ ...d, impactNote: e.target.value }))}
              />
            </div>

            <div className="ongoing-detail-actions" style={{ marginTop: 6 }}>
              <button type="button" className="btn secondary" onClick={() => setShowImpactModal(false)}>Cancel</button>
              <button type="button" className="btn" onClick={saveImpact}>Save impact & close</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
        <div className="ongoing-feed-header" style={{ cursor: 'pointer' }} onClick={() => setTriageOpen((v) => !v)}>
          <div>
            <p className="ongoing-label">Needs triage</p>
            <h3 className="ongoing-feed-title">Mapping fixes required</h3>
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
                      <span className={`ongoing-badge priority-${item.priority}`}>{priorityLabel[item.priority]}</span>
                    </div>
                  </div>
                  <div className="ongoing-updated">{item.megaStoryId || 'no mega'} · {item.storyId || 'no story'}</div>
                </div>
                <div className="ongoing-line">
                  <span className="label">Reason</span>
                  <span className="value">{item.triageReason}</span>
                </div>
              </button>
            ))}
            {triageTasks.length === 0 && <div className="ongoing-empty">No tasks need triage.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
