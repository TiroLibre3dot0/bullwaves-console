import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../../context/AuthContext'
import { useI18n } from '../../../i18n/I18nContext'
import { findConsoleToolByToken } from '../../../config/tools'
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
    'Solitics call + decision summary': {
      title: t('weeklyMap.checklists.soliticsDecisionSummary.title'),
      sections: [
        {
          title: t('weeklyMap.checklists.common.currentStatus.title'),
          items: [
            t('weeklyMap.checklists.soliticsDecisionSummary.status.item1'),
            t('weeklyMap.checklists.soliticsDecisionSummary.status.item2'),
            t('weeklyMap.checklists.soliticsDecisionSummary.status.item3'),
          ],
        },
        {
          title: t('weeklyMap.checklists.common.strategicAlignment.title'),
          items: [
            t('weeklyMap.checklists.soliticsDecisionSummary.alignment.item1'),
            t('weeklyMap.checklists.soliticsDecisionSummary.alignment.item2'),
          ],
        },
        {
          title: t('weeklyMap.checklists.common.ownershipModel.title'),
          items: [
            t('weeklyMap.checklists.soliticsDecisionSummary.ownership.item1'),
            t('weeklyMap.checklists.soliticsDecisionSummary.ownership.item2'),
            t('weeklyMap.checklists.soliticsDecisionSummary.ownership.item3'),
          ],
        },
        {
          title: t('weeklyMap.checklists.common.nextSteps.title'),
          items: [
            t('weeklyMap.checklists.soliticsDecisionSummary.next.item1'),
            t('weeklyMap.checklists.soliticsDecisionSummary.next.item2'),
            t('weeklyMap.checklists.soliticsDecisionSummary.next.item3'),
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

    'Call with Stamatis': {
      title: 'Call with Stamatis — Synthesis (ultra)',
      sections: [
        {
          title: 'SUMMARY',
          items: [
            'AML framework is live (questionnaire-based risk scoring).',
            'High-risk = 60+ points.',
            'TM escalation: alert (deposit > income) → +30d deposit block → +60d trading disabled → +90d closure + refund.',
            'BI AML dashboard demo in ~2 weeks (KPIs: alerts, high-risk, blocked/closed).',
            'AML manual pending approval; Ops alignment to follow.',
            'Country blocking active: 155 accounts blocked.',
            'Main dependency: Scale/KYC/BI integration (blocking).',
          ],
        },
      ],
    },
  }
}

function makeId() {
  return `w_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function megaAccentColor(megaId) {
  switch (megaId) {
    case 'aml_compliance':
      return 'var(--warning)'
    case 'skale_tickets':
      return 'var(--accent-secondary)'
    case 'internal_comms':
      return 'var(--success)'
    case 'ops_governance':
      return 'var(--info)'
    case 'profitability':
      return 'var(--accent-primary)'
    case 'execution_clarity':
      return 'var(--accent-secondary)'
    default:
      return 'var(--border-secondary)'
  }
}

function parseToolTokens(raw) {
  const v = String(raw || '').trim()
  if (!v) return []
  return v
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function statusLabelIt(status) {
  switch (status) {
    case 'planned':
      return 'Planned'
    case 'in_progress':
      return 'In progress'
    case 'blocked':
      return 'Blocked'
    case 'done':
      return 'Done'
    default:
      return 'Planned'
  }
}

function normalizeInline(v) {
  return String(v || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s\s+/g, ' ')
    .trim()
}

async function copyTextToClipboard(text) {
  const v = String(text || '')
  if (!v) return false
  try {
    await navigator.clipboard?.writeText(v)
    return true
  } catch {
    // fallback
    try {
      const el = document.createElement('textarea')
      el.value = v
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return Boolean(ok)
    } catch {
      return false
    }
  }
}

function buildWeeklyBoardReportMarkdown({ bucket, tasksByMega, megaLabel, resolveToolFn }) {
  const weekStart = bucket?.week_start || ''
  const weekEnd = bucket?.week_end || ''

  const tasks = bucket?.tasks
  const total = Array.isArray(tasks) ? tasks.length : 0

  const header = [
    `# Weekly Map — ${weekStart} → ${weekEnd}`,
    '',
    `Periodo di riferimento: settimana corrente (selezionata in console).`,
    `Totale task: ${total}.`,
    '',
  ]

  const megaEntries = Array.from(tasksByMega.entries())
    .sort((a, b) => String(megaLabel(a[0])).localeCompare(String(megaLabel(b[0]))))

  const lines = [...header]

  megaEntries.forEach(([megaId, list]) => {
    lines.push(`## ${megaLabel(megaId)}`)

    const byStatus = { in_progress: [], blocked: [], planned: [], done: [] }
    list.forEach((task) => {
      const key = byStatus[task.status] ? task.status : 'planned'
      byStatus[key].push(task)
    })

    ;['in_progress', 'blocked', 'planned', 'done'].forEach((status) => {
      const items = byStatus[status] || []
      if (!items.length) return
      lines.push(`### ${statusLabelIt(status)} (${items.length})`)

      items.forEach((task) => {
        const title = normalizeInline(task.title)
        const owner = normalizeInline(task.owner)
        const dept = normalizeInline(task.department)
        const outcome = normalizeInline(task.expectedImpact)

        const toolTokens = parseToolTokens(task.tool)
        const tools = toolTokens
          .map((tok) => resolveToolFn(tok))
          .filter((x) => x && x.label)
          .map((x) => (x.url ? `[${x.label}](${x.url})` : x.label))

        const toolPart = tools.length ? ` — Tools: ${tools.join(' · ')}` : ''

        lines.push(`- **${title}** — Owner: ${owner}${dept ? ` (${dept})` : ''} — Outcome: ${outcome}${toolPart}`)
      })

      lines.push('')
    })

    lines.push('')
  })

  return lines.join('\n').trim() + '\n'
}

function resolveTool(token) {
  const t = String(token || '').trim()
  if (!t) return null

  const lower = t.toLowerCase()

  // Resolve to the same tool links exposed in the console (Bullwaves logo menu)
  const consoleTool = findConsoleToolByToken(lower)
  if (consoleTool) {
    const kindByKey = {
      qlik: 'qlik',
      trading_platform: 'trading',
      cellxpert: 'cellxpert',
      skale_crm: 'crm',
      skale_brand_manager: 'brand',
      brokeree: 'link',
      bullwavesprime: 'link',
    }
    return {
      kind: kindByKey[consoleTool.key] || 'link',
      label: consoleTool.name,
      url: consoleTool.href,
    }
  }

  if (lower === 'gmail') return { kind: 'gmail', label: 'Gmail', url: 'https://mail.google.com/' }
  if (lower === 'meet' || lower === 'google meet') return { kind: 'meet', label: 'Google Meet', url: 'https://meet.google.com/' }

  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t)
      const host = (u.hostname || '').toLowerCase()
      if (host.includes('monday.com')) return { kind: 'monday', label: 'Monday', url: t }
      if (host.includes('meet.google.com')) return { kind: 'meet', label: 'Google Meet', url: t }
      if (host.includes('mail.google.com')) return { kind: 'gmail', label: 'Gmail', url: t }
      return { kind: 'link', label: 'Open', url: t }
    } catch {
      return { kind: 'text', label: t, url: '' }
    }
  }

  return { kind: 'text', label: t, url: '' }
}

function ToolIcon({ kind }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }
  switch (kind) {
    case 'meet':
      return (
        <svg {...common}>
          <path d="M4 7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z" stroke="currentColor" strokeWidth="2" />
          <path d="M16 10l4-2v8l-4-2v-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'gmail':
      return (
        <svg {...common}>
          <path d="M4 8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8Z" stroke="currentColor" strokeWidth="2" />
          <path d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'monday':
      return (
        <svg {...common}>
          <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
          <path d="M7 9h10M7 13h10M7 17h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'cellxpert':
      return (
        <svg {...common}>
          <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="2" />
          <path d="M4 20a6 6 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'trading':
      return (
        <svg {...common}>
          <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 14l3-3 3 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      )
    case 'qlik':
      return (
        <svg {...common}>
          <path d="M6 7h12v10H6V7Z" stroke="currentColor" strokeWidth="2" />
          <path d="M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 11h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'crm':
      return (
        <svg {...common}>
          <path d="M7 4h10v16H7V4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M10 8h4M10 12h4M10 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'brand':
      return (
        <svg {...common}>
          <path d="M12 3l3 6 6 1-4.5 4.2 1 6.4L12 17l-5.5 3.8 1-6.4L3 10l6-1 3-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
  }
}

function toolColor(kind) {
  switch (kind) {
    case 'gmail':
      return 'var(--warning)'
    case 'meet':
      return 'var(--info)'
    case 'monday':
      return 'var(--accent-primary)'
    case 'cellxpert':
      return 'var(--success)'
    case 'trading':
      return 'var(--accent-secondary)'
    case 'qlik':
      return 'var(--accent-secondary)'
    case 'crm':
      return 'var(--info)'
    case 'brand':
      return 'var(--warning)'
    default:
      return 'var(--text)' // fallback
  }
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
    tool: '',
    expectedImpact: '',
  })

  const [showCreate, setShowCreate] = useState(false)
  const [reportCopied, setReportCopied] = useState(false)

  useEffect(() => {
    if (!reportCopied) return
    const tId = window.setTimeout(() => setReportCopied(false), 1500)
    return () => window.clearTimeout(tId)
  }, [reportCopied])

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
    const tool = String(draft.tool || '').trim()
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
      tool: tool ? tool : undefined,
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

    setDraft((d) => ({ ...d, title: '', tool: '', expectedImpact: '' }))
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

  const copyBoardReport = async () => {
    const markdown = buildWeeklyBoardReportMarkdown({
      bucket: selectedBucket,
      tasksByMega: tasksGroupedByMega,
      megaLabel,
      resolveToolFn: resolveTool,
    })

    const ok = await copyTextToClipboard(markdown)
    if (ok) setReportCopied(true)
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
              {(() => {
                const toolTokens = parseToolTokens(checklistTask?.tool)
                const tools = toolTokens.map(resolveTool).filter((x) => x && x.url)
                if (!tools.length) return null
                return (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {tools.map((tool) => (
                      <a
                        key={`${tool.kind}:${tool.url}`}
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        title={tool.label}
                        aria-label={tool.label}
                        className="tool-icon-btn"
                        style={{ color: toolColor(tool.kind) }}
                      >
                        <ToolIcon kind={tool.kind} />
                        <span className="tool-icon-label">{tool.label}</span>
                      </a>
                    ))}
                  </div>
                )
              })()}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'transparent' }}>.</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
              <button type="button" className="btn secondary" onClick={copyBoardReport}>
                {t('weeklyMap.actions.copyBoardReport')}
              </button>
              {reportCopied ? (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('weeklyMap.actions.copied')}</span>
              ) : null}
            </div>
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
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: megaAccentColor(megaId),
                        flex: '0 0 auto',
                      }}
                    />
                    <span>{megaLabel(megaId)}</span>
                  </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{list.length} tasks</div>
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    marginTop: 6,
                    height: 2,
                    borderRadius: 999,
                    background: megaAccentColor(megaId),
                    opacity: 0.25,
                  }}
                />
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
                      const hasChecklist = Boolean(TASK_CHECKLISTS[checklistKey])
                      const isDraggable = !readOnly && !hasChecklist
                      const toolTokens = parseToolTokens(task.tool)
                      const tools = toolTokens.map(resolveTool).filter(Boolean)
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
                        style={{ cursor: hasChecklist ? 'pointer' : (readOnly ? 'default' : 'grab') }}
                      >
                        <div className="roadmap-card-header">
                          <div>
                            <div className="roadmap-area">{task.owner || '—'}</div>
                            <div className="roadmap-activity">{task.title}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {tools.length ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {tools.map((tool) => {
                                  if (!tool.url) return null
                                  return (
                                    <a
                                      key={`${tool.kind}:${tool.url}`}
                                      href={tool.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      title={tool.label}
                                      aria-label={tool.label}
                                      className="tool-icon-btn"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ToolIcon kind={tool.kind} />
                                    </a>
                                  )
                                })}
                              </div>
                            ) : null}

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

                        {tools.some((x) => x.kind === 'text') ? (
                          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
                            <span style={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 11 }}>Tool</span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}> {tools.filter((x) => x.kind === 'text').map((x) => x.label).join(' · ')}</span>
                          </div>
                        ) : null}

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
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Tools (optional)</label>
                <input
                  value={draft.tool}
                  onChange={(e) => setDraft((d) => ({ ...d, tool: e.target.value }))}
                  placeholder="One per line: gmail, meet, https://..."
                  disabled={readOnly}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 10px' }}
                />
              </div>

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
