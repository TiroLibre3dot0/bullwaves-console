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

function ProjectCard({ item, onOpen }) {
  const priority = item.priority || 'Medium'
  const color = priorityColors[priority] || '#93c5fd'
  return (
    <button className="roadmap-card" onClick={() => onOpen(item)} style={{ borderColor: color }}>
      <div className="roadmap-card-header">
        <div>
          <div className="roadmap-area">{item.area || 'Untitled area'}</div>
          <div className="roadmap-activity">{(item.activity || '').slice(0, 120) || 'No description'}</div>
        </div>
        <span className="roadmap-priority" style={{ color }}>{priority}</span>
      </div>
      <div className="roadmap-meta">
        <span className="label">Target</span>
        <span className="value">{(item.target || '—').slice(0, 120)}</span>
      </div>
      <div className="roadmap-meta">
        <span className="label">Owner</span>
        <span className="value">
          {item.responsibleRole ? (
            <span className="owner-chip">{item.responsibleName} · {item.responsibleRole}</span>
          ) : (
            item.responsibleName || 'To be assigned'
          )}
        </span>
      </div>
      <div className="roadmap-meta">
        <span className="label">Department</span>
        <span className="value">{item.department}</span>
      </div>
      <div className="roadmap-meta">
        <span className="label">Due</span>
        <span className="value">{item.dueDate || 'TBD'}</span>
      </div>
    </button>
  )
}

function DetailModal({ item, onClose }) {
  if (!item) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="roadmap-area">{item.area}</div>
            <div className="roadmap-activity" style={{ fontSize: 16 }}>{item.activity}</div>
          </div>
          <button className="logout-btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-section">
          <div className="label">Target</div>
          <div>{item.target || '—'}</div>
        </div>
        <div className="modal-section">
          <div className="label">Owner</div>
          <div>
            {item.responsibleRole ? (
              <div className="owner-chip">{item.responsibleName} · {item.responsibleRole}</div>
            ) : (
              item.responsibleName || 'To be assigned'
            )}
            {item.responsibleDepartment && <div className="text-muted small">{item.responsibleDepartment}</div>}
            {item.responsibleEmail && <div className="text-muted small">{item.responsibleEmail}</div>}
          </div>
        </div>
        <div className="modal-section">
          <div className="label">Priority</div>
          <div className="roadmap-priority" style={{ color: priorityColors[item.priority] || '#e8f1fb' }}>{item.priority}</div>
        </div>
        <div className="modal-section">
          <div className="label">Due date</div>
          <div>{item.dueDate || 'TBD'}</div>
        </div>
        <div className="modal-section">
          <div className="label">Next steps</div>
          <div className="text-muted">Placeholder for execution steps and owners.</div>
        </div>
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const { objectives, projects, stats, sortByPriorityThenDue } = useRoadmapData()
  const [deptFilter, setDeptFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState('department')
  const [selected, setSelected] = useState(null)

  const departments = useMemo(() => {
    const set = new Set(projects.map((p) => p.department))
    return ['All', ...Array.from(set)]
  }, [projects])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (deptFilter !== 'All' && p.department !== deptFilter) return false
      if (priorityFilter !== 'All' && p.priority !== priorityFilter) return false
      if (search) {
        const s = search.toLowerCase()
        const text = `${p.activity} ${p.target}`.toLowerCase()
        if (!text.includes(s)) return false
      }
      return true
    })
  }, [projects, deptFilter, priorityFilter, search])

  const groupedByDepartment = useMemo(() => {
    const map = new Map()
    filtered.forEach((p) => {
      const list = map.get(p.department) || []
      list.push(p)
      map.set(p.department, list)
    })
    map.forEach((list, key) => map.set(key, sortByPriorityThenDue(list)))
    return map
  }, [filtered, sortByPriorityThenDue])

  const groupedByPriority = useMemo(() => {
    const map = new Map([['High', []], ['Medium', []], ['Low', []]])
    filtered.forEach((p) => {
      const list = map.get(p.priority) || []
      list.push(p)
      map.set(p.priority, list)
    })
    map.forEach((list, key) => map.set(key, sortByPriorityThenDue(list)))
    return map
  }, [filtered, sortByPriorityThenDue])

  return (
    <div className="roadmap-page">
      <div className="roadmap-header card-global">
        <div>
          <h1>2026 Roadmap</h1>
          <p className="text-muted">Strategic initiatives by department and priority.</p>
        </div>
        <div className="pill">{stats.totalProjects} projects · {Object.keys(stats.byDepartment).length} departments</div>
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
        <KpiCard label="Total projects" value={stats.totalProjects} accent="rgba(255,255,255,0.08)" />
        <KpiCard label="High priority" value={stats.byPriority.high} accent={priorityColors.High} />
        <KpiCard label="Medium priority" value={stats.byPriority.medium} accent={priorityColors.Medium} />
        <KpiCard label="Low priority" value={stats.byPriority.low} accent={priorityColors.Low} />
      </div>

      <div className="filters card">
        <div className="filter-group">
          <label>Department</label>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Priority</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            {['All', ...priorityOrder].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Search</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity or target" />
        </div>
        <div className="filter-group">
          <label>Group by</label>
          <div className="toggle-row">
            <button className={`toggle ${groupBy === 'department' ? 'active' : ''}`} onClick={() => setGroupBy('department')}>Department</button>
            <button className={`toggle ${groupBy === 'priority' ? 'active' : ''}`} onClick={() => setGroupBy('priority')}>Priority</button>
          </div>
        </div>
      </div>

      <div className="roadmap-board">
        {groupBy === 'department'
          ? Array.from(groupedByDepartment.entries()).map(([dept, list]) => (
            <div key={dept} className="roadmap-column">
              <div className="roadmap-column-header">
                <div className="roadmap-column-title">{dept}</div>
                <Pill tone="muted">{list.length} projects</Pill>
              </div>
              <div className="roadmap-column-body">
                {list.length === 0 ? (
                  <div className="text-muted small">No projects</div>
                ) : (
                  list.map((item) => <ProjectCard key={item.id} item={item} onOpen={setSelected} />)
                )}
              </div>
            </div>
          ))
          : priorityOrder.map((prio) => {
            const list = groupedByPriority.get(prio) || []
            return (
              <div key={prio} className="roadmap-column">
                <div className="roadmap-column-header">
                  <div className="roadmap-column-title">{prio}</div>
                  <Pill tone="muted">{list.length} projects</Pill>
                </div>
                <div className="roadmap-column-body">
                  {list.length === 0 ? (
                    <div className="text-muted small">No projects</div>
                  ) : (
                    list.map((item) => (
                      <ProjectCard key={item.id} item={item} onOpen={setSelected} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
      </div>

      <DetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
