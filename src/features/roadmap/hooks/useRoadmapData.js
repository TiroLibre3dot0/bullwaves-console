import { useMemo } from 'react'
import { strategicObjectives, projects2026 } from '../data/roadmapData'
import { mapResponsibleToOrg } from '../utils/mapResponsibleToOrg'

const priorityRank = { High: 0, Medium: 1, Low: 2 }

function normalizeProject(project, index) {
  const department = project.department || 'Unknown'
  const responsibleName = project.responsibleName || ''
  const matched = mapResponsibleToOrg(responsibleName)
  const id = project.id || `${department}-${index}`
  return {
    id,
    department,
    area: project.area || '',
    activity: project.activity || project.activities || '',
    target: project.target || project.targets || '',
    priority: project.priority || 'Medium',
    responsibleName,
    responsibleEmail: matched?.email,
    responsibleRole: matched?.role,
    responsibleDepartment: matched?.department,
    dueDate: project.dueDate || '',
    objectiveId: project.objectiveId || null,
  }
}

function aggregate(projects) {
  const byDepartment = {}
  const byPriority = { high: 0, medium: 0, low: 0 }
  projects.forEach((p) => {
    byDepartment[p.department] = (byDepartment[p.department] || 0) + 1
    const key = (p.priority || 'Medium').toLowerCase()
    if (byPriority[key] !== undefined) byPriority[key] += 1
  })
  return {
    totalProjects: projects.length,
    byDepartment,
    byPriority,
  }
}

export function useRoadmapData() {
  const projects = useMemo(() => projects2026.map((p, idx) => normalizeProject(p, idx)), [])
  const stats = useMemo(() => aggregate(projects), [projects])
  const objectives = useMemo(() => strategicObjectives, [])
  const sortByPriorityThenDue = (items) => {
    return [...items].sort((a, b) => {
      const pa = priorityRank[a.priority] ?? 1
      const pb = priorityRank[b.priority] ?? 1
      if (pa !== pb) return pa - pb
      const da = parseDue(a.dueDate)
      const db = parseDue(b.dueDate)
      if (da && db && da.getTime() !== db.getTime()) return da.getTime() - db.getTime()
      return (a.area || '').localeCompare(b.area || '') || (a.activity || '').localeCompare(b.activity || '')
    })
  }

  return { objectives, projects, stats, sortByPriorityThenDue }
}

function parseDue(raw = '') {
  if (!raw) return null
  // Try formats like "Mar 2026" or "Q1 2026"
  const qMatch = raw.match(/Q(\d)\s+(\d{4})/i)
  if (qMatch) {
    const quarter = Number(qMatch[1])
    const year = Number(qMatch[2])
    const month = Math.max(0, (quarter - 1) * 3)
    return new Date(year, month, 1)
  }
  const mMatch = raw.match(/([A-Za-z]{3,})\s+(\d{4})/)
  if (mMatch) {
    const monthName = mMatch[1].slice(0,3).toLowerCase()
    const year = Number(mMatch[2])
    const monthIndex = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(monthName)
    if (monthIndex >= 0 && year) return new Date(year, monthIndex, 1)
  }
  return null
}

export default useRoadmapData
