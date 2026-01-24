import React, { useMemo, useState } from 'react'
import { encodeSharePayload } from '../../utils/shareCodec'

const STATUSES = ['Backlog', 'In Progress', 'Blocked', 'Done']

const DEPARTMENT_ACCENTS = {
  // Colors aligned with Org Chart accents (marketing=fuchsia, ops/cyan, finance=emerald)
  Marketing: { rgb: [232, 121, 249] },
  Sales: { rgb: [34, 211, 238] },
  'CRM & Automation': { rgb: [232, 121, 249] },
  'Payments & Compliance': { rgb: [52, 211, 153] },
}

function rgba(rgb, a) {
  const [r, g, b] = Array.isArray(rgb) ? rgb : [148, 163, 184]
  return `rgba(${r},${g},${b},${a})`
}

function DepartmentPill({ department }) {
  const clean = String(department || '').trim()
  const accent = DEPARTMENT_ACCENTS[clean] || { rgb: [148, 163, 184] }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        border: `1px solid ${rgba(accent.rgb, 0.35)}`,
        background: `linear-gradient(180deg, ${rgba(accent.rgb, 0.24)}, ${rgba(accent.rgb, 0.14)})`,
        color: 'rgba(241,245,249,0.92)',
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.12,
        whiteSpace: 'nowrap',
      }}
      title={clean}
    >
      {clean || '—'}
    </span>
  )
}

function resolveStoryIcon(task) {
  const title = String(task?.title || '').toLowerCase()
  if (title.includes('acquisition') || title.includes('traffic')) return 'target'
  if (
    title.includes('sales leverage') ||
    title.includes('account management') ||
    title.includes('forex')
  )
    return 'briefcase'
  if (title.includes('communication') || title.includes('channels') || title.includes('booking'))
    return 'link'
  if (title.includes('market analysis') || title.includes('news')) return 'broadcast'
  if (title.includes('outreach') || title.includes('kommo') || title.includes('review'))
    return 'activity'
  if (title.includes('withdraw')) return 'shield'
  return 'plus'
}

function StoryIcon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }

  switch (name) {
    case 'target':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      )
    case 'link':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'activity':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M3 12h4l2-6 4 12 2-6h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'megaphone':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M4 11v2c0 1.1.9 2 2 2h1l3.5 3.5c.6.6 1.5.2 1.5-.6V6.1c0-.8-.9-1.2-1.5-.6L7 9H6c-1.1 0-2 .9-2 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M14 9c2 0 4-1 6-2v10c-2-1-4-2-6-2" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'briefcase':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M9 6h6V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 12h18" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'messages':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M8 12h.01M12 12h.01M16 12h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'broadcast':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="2" />
          <path
            d="M4.9 19.1a10 10 0 0 1 0-14.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M19.1 4.9a10 10 0 0 1 0 14.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7.8 16.2a6 6 0 0 1 0-8.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16.2 7.8a6 6 0 0 1 0 8.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'search':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'payments':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 11h18" stroke="currentColor" strokeWidth="2" />
          <path d="M7 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
  }
}

function makeId(prefix = 'pb') {
  try {
    // eslint-disable-next-line no-undef
    return `${prefix}_${crypto.randomUUID()}`
  } catch {
    return `${prefix}_${String(Math.random()).slice(2)}_${Date.now()}`
  }
}

const seedTasks = () => [
  {
    id: makeId(),
    title: 'Acquisition & Traffic Structure',
    owner: 'Marketing',
    status: 'Backlog',
    description:
      'Traffic is easy to unlock — media agencies are constantly looking to monetize. The key is structuring acquisition channels properly, not chasing random volume.\n\nFocus on:\n\nDirect sources (e.g. investing.com): understand delivery model, lead quality and scalability.\n\nIndirect sources: media buying & affiliates, with fast test → kill → scale logic and strict tracking.\n\nIn parallel, structure internal traffic flows to maximize conversion efficiency and LTV.',
    summary: 'Direct + indirect traffic sources, fast testing, strict tracking.',
    icon: 'megaphone',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Sales Leverage: Prop Clients → Forex & Account Management',
    owner: 'Sales',
    status: 'Backlog',
    description:
      'Prop clients are already warm traffic. We should build a structured upsell flow to convert them into:\n\nForex traders\n\nAccount management clients\n\nGoal:\n\nIncrease LTV\n\nImprove monetization efficiency\n\nLeverage existing traffic at near-zero acquisition cost',
    summary: 'Systematize upsell of warm internal traffic.',
    icon: 'briefcase',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Client Communication Channels (Premium Support & Booking)',
    owner: 'CRM & Automation',
    status: 'Backlog',
    description:
      'Test and implement convrs.io integration to centralize:\n\nWhatsApp\n\nTelegram\n\nDiscord\n\nObjectives:\n\nPremium support channel\n\nDirect call booking with sales or market analyst\n\nStructured post-registration engagement\n\nOnly after validating this layer, evaluate additional integrations with Solitics if needed.\nOrlin has a key role in designing flows, automation logic and segmentation.',
    summary: 'Centralize WhatsApp, Telegram and Discord for premium flows and call booking.',
    icon: 'messages',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Automation: Market Analysis & News Distribution',
    owner: 'CRM & Automation',
    status: 'Backlog',
    description:
      'Automate distribution of market analysis and news through WhatsApp and other messaging channels.\n\nObjectives:\n\nIncrease engagement\n\nImprove retention\n\nReduce manual workload\n\nStandardize communication quality\n\nIntegration with Solitics to be evaluated only after convrs.io setup is stable.',
    summary: 'Automated market insights and news via messaging channels.',
    icon: 'broadcast',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Outreach Review: Kommo Performance & Feedback',
    owner: 'Sales',
    status: 'Backlog',
    description:
      'Review Kommo activity:\n\nMessage volume\n\nResponse rate\n\nFeedback quality\n\nConversion impact\n\nGoal:\n\nUnderstand real performance\n\nOptimize scripts\n\nImprove targeting\n\nIncrease conversion efficiency',
    summary: 'Measure effectiveness of current outreach.',
    icon: 'search',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Withdrawals Automation (Critical)',
    owner: 'Payments & Compliance',
    status: 'Backlog',
    description:
      'Implement automated withdrawals:\n\nCard withdrawals — BridgerPay + SolidPayments\n\nInstant credit to clients\n\nNo banking fees\n\nStrong UX improvement\n\nSignificant support workload reduction\n\nCrypto withdrawals — Skale + Uniwire\n\nInstant payouts\n\nMassive operational efficiency\n\nMajor time saving for support and finance teams\n\nThis is a must-have and deal-breaker priority.',
    summary: 'Full automation of card and crypto withdrawals.',
    icon: 'payments',
    notes: '',
  },
]

function Card({ task, onOpen, draggable, onDragStart }) {
  const iconName = resolveStoryIcon(task)
  return (
    <button
      type="button"
      className="card"
      style={{
        padding: 12,
        textAlign: 'left',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
      }}
      onClick={() => onOpen(task.id)}
      draggable={draggable}
      onDragStart={onDragStart}
      title={task.title}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
          <div style={{ color: 'rgba(226,232,240,0.70)', marginTop: 2, flex: '0 0 auto' }}>
            <StoryIcon name={iconName} />
          </div>
          <div
            style={{
              fontWeight: 850,
              fontSize: 13,
              letterSpacing: 0.1,
              color: 'rgba(241,245,249,0.96)',
              lineHeight: 1.22,
              textRendering: 'geometricPrecision',
            }}
          >
            {task.title}
          </div>
        </div>
        <DepartmentPill department={task.owner} />
      </div>
    </button>
  )
}

function Modal({ task, onClose, onUpdate, readOnly = false }) {
  if (!task) return null

  const canEdit = !readOnly

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 60,
      }}
    >
      <div
        className="card"
        style={{
          width: 'min(820px, 100%)',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.10)',
          background: '#0b1020',
          padding: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 900 }}>Project</div>
            <div style={{ color: 'var(--text)', fontSize: 20, fontWeight: 950, marginTop: 4 }}>
              {task.title}
            </div>
            <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, marginTop: 6 }}>
              Department: {task.owner || '—'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                fontWeight: 900,
                fontSize: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#e2e8f0',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 12 }}>
          <div className="card" style={{ padding: 12, borderRadius: 12 }}>
            <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 900 }}>Description</div>
            {String(task.summary || '').trim() && (
              <div
                style={{
                  color: 'rgba(226,232,240,0.84)',
                  fontSize: 12,
                  marginTop: 8,
                  fontWeight: 800,
                }}
              >
                {task.summary}
              </div>
            )}
            <div style={{ color: 'rgba(226,232,240,0.92)', fontSize: 13, marginTop: 8 }}>
              {String(task.description || '').trim() ? task.description : '—'}
            </div>
          </div>

          <div className="card" style={{ padding: 12, borderRadius: 12 }}>
            <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 900 }}>Status</div>
            {canEdit ? (
              <select
                value={task.status}
                onChange={(e) => onUpdate(task.id, { status: e.target.value })}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '10px 10px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text)',
                  fontWeight: 800,
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} style={{ background: '#0b1020' }}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ marginTop: 8, fontWeight: 900, color: 'var(--text)' }}>
                {task.status}
              </div>
            )}

            <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12, fontWeight: 900 }}>
              Notes
            </div>
            {canEdit ? (
              <textarea
                value={task.notes || ''}
                onChange={(e) => onUpdate(task.id, { notes: e.target.value })}
                placeholder="Add notes, risks, dependencies…"
                rows={5}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text)',
                  resize: 'vertical',
                  fontSize: 13,
                }}
              />
            ) : (
              <div style={{ marginTop: 8, color: 'rgba(226,232,240,0.92)', fontSize: 13 }}>
                {String(task.notes || '').trim() ? task.notes : '—'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProjectBoardPage({ publicMode = false, sharePayload = null }) {
  const [tasks, setTasks] = useState(() => {
    const inPayload = Array.isArray(sharePayload?.tasks) ? sharePayload.tasks : null
    if (publicMode && inPayload) return inPayload
    return seedTasks()
  })
  const [activeId, setActiveId] = useState(null)

  const grouped = useMemo(() => {
    const by = {
      Backlog: [],
      'In Progress': [],
      Blocked: [],
      Done: [],
    }
    for (const t of tasks || []) {
      const key = STATUSES.includes(t.status) ? t.status : 'Backlog'
      by[key].push(t)
    }
    return by
  }, [tasks])

  const updateTask = (id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const onDragStart = (taskId) => (e) => {
    if (publicMode) return
    try {
      e.dataTransfer.setData('text/plain', String(taskId))
      e.dataTransfer.effectAllowed = 'move'
    } catch {
      // ignore
    }
  }

  const onDropTo = (status) => (e) => {
    if (publicMode) return
    e.preventDefault()
    let taskId = ''
    try {
      taskId = e.dataTransfer.getData('text/plain')
    } catch {
      taskId = ''
    }
    if (!taskId) return
    updateTask(taskId, { status })
  }

  const createPublicLink = async () => {
    if (publicMode) return

    const payload = {
      v: 1,
      generatedAt: new Date().toISOString(),
      board: {
        title: 'Project Board',
      },
      tasks,
    }

    const token = encodeSharePayload(payload)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const href = `${origin}/share/project-board/${token}`

    // Primary UX: open the public page immediately.
    try {
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch {
      // ignore
    }

    try {
      await navigator.clipboard.writeText(href)
      window.alert('Link copiato negli appunti')
    } catch {
      window.prompt('Copia il link:', href)
    }
  }

  const activeTask = useMemo(() => tasks.find((t) => t.id === activeId) || null, [tasks, activeId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        {publicMode ? null : (
          <div style={{ fontSize: 12, fontWeight: 900, color: '#9aa4b2', letterSpacing: 0.2 }}>
            Tools
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>Project Board</div>
        <div
          style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 650, fontSize: 12 }}
        >
          Kanban board for strategic initiatives. Drag & drop to update status.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {publicMode ? (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(226,232,240,0.92)',
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            Read-only
          </div>
        ) : (
          <button
            type="button"
            onClick={createPublicLink}
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 12,
              background: 'rgba(59,130,246,0.14)',
              border: '1px solid rgba(59,130,246,0.30)',
              color: '#e2e8f0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Share (public link)
          </button>
        )}

        <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 800 }}>
          Total: {tasks.length}
        </div>
      </div>

      <div
        className="pb-grid"
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        {STATUSES.map((status) => {
          const list = grouped[status] || []
          return (
            <div
              key={status}
              className="card"
              onDragOver={(e) => {
                if (!publicMode) e.preventDefault()
              }}
              onDrop={onDropTo(status)}
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.02)',
                minHeight: 220,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 950, color: 'var(--text)' }}>{status}</div>
                <div style={{ color: 'rgba(148,163,184,0.95)', fontWeight: 900, fontSize: 12 }}>
                  {list.length}
                </div>
              </div>

              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {list.map((task) => (
                  <Card
                    key={task.id}
                    task={task}
                    onOpen={setActiveId}
                    draggable={!publicMode}
                    onDragStart={onDragStart(task.id)}
                  />
                ))}

                {list.length === 0 ? (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: '1px dashed rgba(255,255,255,0.12)',
                      color: 'rgba(148,163,184,0.95)',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Drop items here
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        task={activeTask}
        onClose={() => setActiveId(null)}
        onUpdate={updateTask}
        readOnly={publicMode}
      />

      <style>{`
        .pb-grid { grid-template-columns: repeat(4, minmax(240px, 1fr)); }
        @media (max-width: 1100px) {
          .pb-grid { grid-template-columns: repeat(2, minmax(240px, 1fr)); }
        }
        @media (max-width: 720px) {
          .pb-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
