import React, { useMemo, useState } from 'react'
import useRoadmapData from '../hooks/useRoadmapData'

const priorityColors = {
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

const priorityOrder = ['High', 'Medium', 'Low']

function Pill({ children, tone = 'default' }) {
  const style = {
    background: tone === 'muted' ? 'rgba(255,255,255,0.05)' : 'rgba(34,211,238,0.1)',
    color: '#e8f1fb',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
  }
  return <span style={style}>{children}</span>
}

function KpiCard({ label, value, accent }) {
  return (
    <div className="card small-card" style={{ borderColor: accent }}>
      <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#e8f1fb' }}>{value}</div>
    </div>
  )
}

function ProjectCard({ item, onTogglePin, onOpen }) {
  const priority = item.priority || 'Medium'
  const color = priorityColors[priority] || '#93c5fd'

  return (
    <div
      className="roadmap-card compact"
      style={{ borderColor: color, padding: 12, cursor: 'pointer' }}
      onClick={() => onOpen?.(item.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {item.manualOrder && (
            <span style={{ background: 'rgba(255,255,255,0.08)', color: '#e8f1fb', borderRadius: 999, padding: '4px 8px', fontSize: 10, border: '1px solid rgba(255,255,255,0.12)', whiteSpace: 'nowrap' }}>Pinned</span>
          )}
          <div style={{ fontWeight: 700, color: '#e8f1fb', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.activity || 'Untitled task'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="roadmap-priority" style={{ color, fontSize: 12, whiteSpace: 'nowrap' }}>{priority}</span>
          <button
            className="btn"
            style={{ padding: '4px 10px', fontSize: 11, whiteSpace: 'nowrap' }}
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin?.(item)
            }}
          >
            {item.manualOrder ? 'Unpin' : 'Pin'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', color: '#cbd5e1', fontSize: 12 }}>
        <span style={{ whiteSpace: 'nowrap' }}>Owner: {item.responsibleName || '—'}</span>
        <span style={{ whiteSpace: 'nowrap' }}>Due: {item.dueDate || 'TBD'}</span>
        {item.target && <span style={{ flex: 1, minWidth: 160, color: '#94a3b8' }}>{item.target.slice(0, 80)}{item.target.length > 80 ? '…' : ''}</span>}
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const { objectives, projects, stats, sortByPriorityThenDue } = useRoadmapData()
  const [deptFilter, setDeptFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [expandedDept, setExpandedDept] = useState(new Set())
  const [openCard, setOpenCard] = useState(null)
  const [manualState, setManualState] = useState({})
  const [drafts, setDrafts] = useState({})
  const [customProjects, setCustomProjects] = useState([])
  const [newProject, setNewProject] = useState({
    department: '',
    area: '',
    activity: '',
    target: '',
    priority: 'Medium',
    responsibleName: '',
    dueDate: '',
  })
  const [showAddModal, setShowAddModal] = useState(false)

  const allProjects = useMemo(() => [...projects, ...customProjects], [projects, customProjects])

  const projectsWithManual = useMemo(() => {
    return allProjects.map((p) => {
      const draft = drafts[p.id] || {}
      return {
        ...p,
        ...draft,
        manualOrder: manualState[p.id]?.manualOrder || false,
        manualRank: manualState[p.id]?.manualRank ?? null,
        nextStep: draft.nextStep ?? p.nextStep ?? p.target ?? '',
      }
    })
  }, [allProjects, manualState, drafts])

  const nextRankForPriority = (priority) => {
    const ranks = projectsWithManual
      .filter((p) => p.priority === priority && p.manualOrder && Number.isFinite(p.manualRank))
      .map((p) => Number(p.manualRank))
    if (!ranks.length) return 1
    return Math.max(...ranks) + 1
  }

  const togglePin = (project) => {
    setManualState((prev) => {
      const current = prev[project.id] || {}
      const willPin = !current.manualOrder
      const manualRank = willPin ? nextRankForPriority(project.priority) : null
      return {
        ...prev,
        [project.id]: {
          manualOrder: willPin,
          manualRank,
        },
      }
    })
  }

  const onEditField = (id, field, value) => {
    if (field === 'priority') {
      setManualState((prev) => {
        const current = prev[id]
        if (!current?.manualOrder) return prev
        return {
          ...prev,
          [id]: {
            ...current,
            manualRank: nextRankForPriority(value),
          },
        }
      })
    }

    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }))
  }

  const toggleDept = (dept) => {
    setExpandedDept((prev) => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept)
      else next.add(dept)
      return next
    })
  }

  const openCardModal = (id) => setOpenCard(id)
  const closeCardModal = () => setOpenCard(null)

  const ownerOptions = useMemo(() => {
    const names = new Set(projectsWithManual.map((p) => p.responsibleName).filter(Boolean))
    return Array.from(names)
  }, [projectsWithManual])

  const departments = useMemo(() => {
    const set = new Set(projectsWithManual.map((p) => p.department))
    return ['All', ...Array.from(set)]
  }, [projectsWithManual])

  const derivedStats = useMemo(() => {
    const byDepartment = {}
    const byPriority = { high: 0, medium: 0, low: 0 }
    projectsWithManual.forEach((p) => {
      byDepartment[p.department] = (byDepartment[p.department] || 0) + 1
      const key = (p.priority || 'Medium').toLowerCase()
      if (byPriority[key] !== undefined) byPriority[key] += 1
    })
    return {
      totalProjects: projectsWithManual.length,
      byDepartment,
      byPriority,
    }
  }, [projectsWithManual])

  const filtered = useMemo(() => {
    return projectsWithManual.filter((p) => {
      if (deptFilter !== 'All' && p.department !== deptFilter) return false
      if (priorityFilter !== 'All' && p.priority !== priorityFilter) return false
      if (search) {
        const s = search.toLowerCase()
        const text = `${p.activity} ${p.target}`.toLowerCase()
        if (!text.includes(s)) return false
      }
      return true
    })
  }, [projectsWithManual, deptFilter, priorityFilter, search])

  const groupedByDepartment = useMemo(() => {
    const map = new Map()
    filtered.forEach((p) => {
      const list = map.get(p.department) || []
      list.push(p)
      map.set(p.department, list)
    })
    // within each department, keep list unsorted here; we'll sort inside the render per priority
    return map
  }, [filtered])

  const sortWithinPriority = (items) => {
    const autoSorted = sortByPriorityThenDue(items)
    const pinned = autoSorted.filter((p) => p.manualOrder).sort((a, b) => (a.manualRank ?? 0) - (b.manualRank ?? 0))
    const others = autoSorted.filter((p) => !p.manualOrder)
    return [...pinned, ...others]
  }

  const updateNewProject = (field, value) => {
    setNewProject((prev) => ({ ...prev, [field]: value }))
  }

  const addProject = () => {
    if (!newProject.activity || !newProject.department) return
    const id = `custom-${Date.now()}`
    const payload = { ...newProject, id }
    setCustomProjects((prev) => [...prev, payload])
    setNewProject({ department: '', area: '', activity: '', target: '', priority: 'Medium', responsibleName: '', dueDate: '' })
    setShowAddModal(false)
  }

  const isNewValid = newProject.activity.trim() && newProject.department.trim()

  const openCardData = useMemo(() => projectsWithManual.find((p) => p.id === openCard) || null, [openCard, projectsWithManual])

  return (
    <div className="roadmap-page">
      <div className="roadmap-header card-global">
        <div>
          <h1>2026 Roadmap</h1>
          <p className="text-muted">Strategic initiatives by department and priority.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="pill">{derivedStats.totalProjects} projects · {Object.keys(derivedStats.byDepartment).length} departments</div>
          <button className="btn" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => setShowAddModal(true)}>+ Nuovo progetto</button>
        </div>
      </div>

      <div className="grid-global" style={{ marginBottom: 12 }}>
        {objectives.map((o) => (
          <div key={o.id} className="card" style={{ minHeight: 90 }}>
            <div className="text-muted" style={{ fontSize: 12 }}>Strategic Objective</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{o.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-global" style={{ marginBottom: 12 }}>
        <KpiCard label="Total projects" value={derivedStats.totalProjects} accent="rgba(255,255,255,0.08)" />
        <KpiCard label="High priority" value={derivedStats.byPriority.high} accent={priorityColors.High} />
        <KpiCard label="Medium priority" value={derivedStats.byPriority.medium} accent={priorityColors.Medium} />
        <KpiCard label="Low priority" value={derivedStats.byPriority.low} accent={priorityColors.Low} />
      </div>

      <div className="filters card">
        <div className="filter-group">
          <label>Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
          >
            {['All', ...priorityOrder].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Search</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity or target" />
        </div>
      </div>

      <div className="roadmap-board">
        {Array.from(groupedByDepartment.entries()).map(([dept, list]) => {
          const total = list.length
          const counts = priorityOrder.map((p) => list.filter((item) => item.priority === p).length)
          const pct = counts.map((c) => (total ? Math.round((c / total) * 100) : 0))
          const isOpen = expandedDept.has(dept)

          return (
            <div key={dept} className="roadmap-column" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <button className="roadmap-column-header" style={{ width: '100%', textAlign: 'left' }} onClick={() => toggleDept(dept)}>
                <div>
                  <div className="roadmap-column-title">{dept}</div>
                  <div className="text-muted small">{total} projects</div>
                </div>
                <div style={{ flex: 1, margin: '0 12px' }}>
                  <div style={{ display: 'flex', height: 8, overflow: 'hidden', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                    {priorityOrder.map((p, idx) => (
                      <div key={p} style={{ width: `${pct[idx]}%`, background: priorityColors[p] || '#64748b', transition: 'width 0.2s ease' }} />
                    ))}
                  </div>
                  <div className="text-muted small" style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {priorityOrder.map((p, idx) => (
                      <span key={p}>{p}: {counts[idx]}</span>
                    ))}
                  </div>
                </div>
                <Pill tone="muted">{isOpen ? 'Hide' : 'Show'}</Pill>
              </button>

              {isOpen && (
                <div className="roadmap-column-body" style={{ gap: 12 }}>
                  {priorityOrder.map((prio) => {
                    const bucket = list.filter((item) => item.priority === prio)
                    if (!bucket.length) return null
                    const sorted = sortWithinPriority(bucket)
                    return (
                      <div key={`${dept}-${prio}`} style={{ display: 'grid', gap: 8 }}>
                        <div className="text-muted" style={{ fontWeight: 700, fontSize: 12 }}>{prio}</div>
                        {sorted.map((item) => (
                          <ProjectCard
                            key={item.id}
                            item={item}
                            onTogglePin={togglePin}
                            onOpen={openCardModal}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" style={{ maxWidth: 720, width: 'min(96vw, 720px)', padding: '18px clamp(12px, 3vw, 22px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="roadmap-area">New project</div>
                <div className="roadmap-activity" style={{ fontSize: 16 }}>Add the core details</div>
              </div>
              <button className="logout-btn" onClick={() => setShowAddModal(false)}>Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
              <input value={newProject.activity} onChange={(e) => updateNewProject('activity', e.target.value)} placeholder="Activity" style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px' }} />
              <input value={newProject.area} onChange={(e) => updateNewProject('area', e.target.value)} placeholder="Area" style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px' }} />
              <input value={newProject.department} onChange={(e) => updateNewProject('department', e.target.value)} placeholder="Department" style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px' }} />
              <select value={newProject.priority} onChange={(e) => updateNewProject('priority', e.target.value)} style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px' }}>
                {priorityOrder.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={newProject.responsibleName} onChange={(e) => updateNewProject('responsibleName', e.target.value)} placeholder="Owner" style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px' }} />
              <input value={newProject.dueDate} onChange={(e) => updateNewProject('dueDate', e.target.value)} placeholder="Due date" style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px' }} />
            </div>

            <textarea value={newProject.target} onChange={(e) => updateNewProject('target', e.target.value)} placeholder="Target / next step" style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px', minHeight: 80, width: '100%', marginBottom: 12 }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn" style={{ padding: '10px 16px', opacity: isNewValid ? 1 : 0.5, pointerEvents: isNewValid ? 'auto' : 'none' }} onClick={addProject}>Save</button>
            </div>
          </div>
        </div>
      )}

      {openCardData && (
        <div className="modal-backdrop" onClick={closeCardModal}>
          <div className="modal-card" style={{ width: 'min(96vw, 780px)', padding: '18px clamp(12px, 3vw, 22px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <div className="text-muted small">{openCardData.department}{openCardData.area ? ` · ${openCardData.area}` : ''}</div>
                <div className="roadmap-activity" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{openCardData.activity}</div>
                {openCardData.target && <div className="text-muted" style={{ marginTop: 2, fontSize: 12 }}>{openCardData.target}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 240 }}>
                <div className="roadmap-priority" style={{ color: priorityColors[openCardData.priority] || '#e8f1fb', fontSize: 12, padding: '6px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, whiteSpace: 'nowrap' }}>{openCardData.priority}</div>
                {openCardData.manualOrder && <Pill tone="muted">Pinned</Pill>}
                <select
                  aria-label="Owner"
                  value={openCardData.responsibleName || ''}
                  onChange={(e) => onEditField(openCardData.id, 'responsibleName', e.target.value)}
                  style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 8px', fontSize: 12, minWidth: 120 }}
                >
                  <option value="">Owner</option>
                  {ownerOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select
                  aria-label="Priority"
                  value={openCardData.priority}
                  onChange={(e) => onEditField(openCardData.id, 'priority', e.target.value)}
                  style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 8px', fontSize: 12, minWidth: 120 }}
                >
                  {priorityOrder.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  aria-label="Due date"
                  value={openCardData.dueDate || ''}
                  onChange={(e) => onEditField(openCardData.id, 'dueDate', e.target.value)}
                  style={{ background: '#0b1220', color: '#e8f1fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 8px', fontSize: 12, minWidth: 120 }}
                  placeholder="Due date"
                />
              </div>
            </div>

            <div className="modal-section" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, background: 'rgba(255,255,255,0.02)', display: 'grid', gap: 10, marginTop: 12 }}>
              <div className="label">Roadmap steps</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative', paddingTop: 6, flexWrap: 'wrap' }}>
                {[{
                  title: 'Next step',
                  desc: openCardData.nextStep || 'To be defined',
                  accent: '#38bdf8',
                }, {
                  title: 'Align stakeholders',
                  desc: `Department ${openCardData.department}`,
                  accent: '#a78bfa',
                }, {
                  title: 'Confirm due date',
                  desc: openCardData.dueDate || 'TBD',
                  accent: '#f59e0b',
                }].map((step, idx, arr) => (
                  <div key={step.title} style={{ flex: 1, minWidth: 180, position: 'relative', paddingRight: 8 }}>
                    {idx < arr.length - 1 && (
                      <div style={{ position: 'absolute', top: 12, right: -4, width: 8, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: step.accent, boxShadow: `0 0 0 4px rgba(255,255,255,0.05)` }}></span>
                      <div style={{ fontSize: 12, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 0.3 }}>{step.title}</div>
                    </div>
                    <div style={{ marginTop: 4, color: '#e8f1fb', fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={closeCardModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
