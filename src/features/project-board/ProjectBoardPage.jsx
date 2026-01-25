import { useEffect, useMemo, useState } from 'react'
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
        maxWidth: 180,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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

const PRIORITY_ORDER = ['P0', 'P1', 'P2']

function isComplexStory(task) {
  const description = String(task?.description || '').trim()
  if (!description) return false

  const words = description.split(/\s+/).filter(Boolean)
  const lines = description
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const hasStructuredBlocks = description.includes('\n\n') || lines.length >= 8

  return description.length >= 320 || words.length >= 70 || hasStructuredBlocks
}

function normalizeSubtaskTitle(raw) {
  const cleaned = String(raw || '')
    .replace(/^[-*•\u2022]+\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/:\s*$/g, '')
  if (!cleaned) return ''
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}…` : cleaned
}

function isHeadingLine(line) {
  const lower = String(line || '')
    .trim()
    .toLowerCase()
  if (!lower) return false
  return (
    lower === 'focus on:' ||
    lower === 'goal:' ||
    lower === 'objectives:' ||
    lower === 'objectives' ||
    lower === 'focus on' ||
    lower === 'goals:' ||
    lower === 'notes:'
  )
}

function extractCandidateLines(description) {
  const lines = String(description || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const candidates = []
  for (const line of lines) {
    if (isHeadingLine(line)) continue
    // Lines ending with ':' are almost always section headings in our backlog stories.
    if (/\:\s*$/.test(line)) continue

    const looksLikeBullet = /^[-*•\u2022]/.test(line)
    const looksLikeListItem = !/[.!?]$/.test(line) && line.length <= 70
    const hasSeparator = /\s—\s|\s-\s/.test(line)

    if (looksLikeBullet || looksLikeListItem || hasSeparator) {
      const title = normalizeSubtaskTitle(line)
      if (title) candidates.push(title)
    }
  }

  // De-dupe while preserving order.
  return [...new Set(candidates)]
}

function priorityNumber(priority) {
  const p = String(priority || '').trim()
  const match = p.match(/P(\d+)/i)
  if (match) return match[1]
  return '1'
}

function parseDescriptionBlocks(description) {
  const raw = String(description || '')
  const lines = raw.split(/\r?\n/)

  const blocks = []
  let pendingParagraph = []
  let pendingBullets = []

  const flushParagraph = () => {
    const text = pendingParagraph.join(' ').trim()
    pendingParagraph = []
    if (text) blocks.push({ type: 'p', text })
  }

  const flushBullets = () => {
    const items = pendingBullets.map((x) => x.trim()).filter(Boolean)
    pendingBullets = []
    if (items.length) blocks.push({ type: 'ul', items })
  }

  const isHeading = (line) => {
    const trimmed = String(line || '').trim()
    if (!trimmed) return false
    if (isHeadingLine(trimmed)) return true
    return /\:\s*$/.test(trimmed)
  }

  const isBulletish = (line) => {
    const trimmed = String(line || '').trim()
    if (!trimmed) return false
    if (/^[-*•\u2022]/.test(trimmed)) return true
    // Short list-ish lines without sentence punctuation.
    return !/[.!?]$/.test(trimmed) && trimmed.length <= 80
  }

  for (const line of lines) {
    const trimmed = String(line || '').trim()

    if (!trimmed) {
      flushParagraph()
      flushBullets()
      continue
    }

    if (isHeading(trimmed)) {
      flushParagraph()
      flushBullets()
      blocks.push({ type: 'h', text: trimmed.replace(/\:\s*$/g, '') })
      continue
    }

    if (isBulletish(trimmed)) {
      flushParagraph()
      pendingBullets.push(normalizeSubtaskTitle(trimmed))
      continue
    }

    flushBullets()
    pendingParagraph.push(trimmed)
  }

  flushParagraph()
  flushBullets()

  return blocks
}

function priorityForTitle(title, story) {
  const t = String(title || '').toLowerCase()
  const full = `${String(story?.title || '').toLowerCase()}\n${String(story?.description || '').toLowerCase()}`

  if (full.includes('critical') || full.includes('deal-breaker') || full.includes('must-have'))
    return 'P0'
  if (t.includes('define') || t.includes('scope') || t.includes('acceptance')) return 'P0'
  if (
    t.includes('implement') ||
    t.includes('setup') ||
    t.includes('integrat') ||
    t.includes('centralize')
  )
    return 'P0'
  if (t.includes('test') || t.includes('qa') || t.includes('monitor') || t.includes('tracking'))
    return 'P1'
  if (
    t.includes('optimiz') ||
    t.includes('improv') ||
    t.includes('evaluate') ||
    t.includes('review')
  )
    return 'P1'
  if (t.includes('doc') || t.includes('rollout') || t.includes('polish')) return 'P2'

  return 'P1'
}

function descriptionForSubtask(title, priority, story) {
  const cleanTitle = String(title || '').trim()
  const storyTitle = String(story?.title || '').trim()

  const prefix = storyTitle ? `From “${storyTitle}”` : 'From story'

  if (priority === 'P0') {
    return `${prefix}: deliver this first. Define “done” clearly, list dependencies, and implement the core piece for: ${cleanTitle}.`
  }
  if (priority === 'P2') {
    return `${prefix}: polish/rollout task. Document decisions, communicate changes, and ship safely for: ${cleanTitle}.`
  }
  return `${prefix}: second-phase task. Validate, monitor, and improve the delivery for: ${cleanTitle}.`
}

function generatePrioritizedSubtasks(story) {
  const description = String(story?.description || '').trim()
  if (!description) return []

  const extracted = extractCandidateLines(description)
  const subtasks = []

  // If we can extract meaningful items, use them; otherwise fall back to a standard breakdown.
  if (extracted.length >= 3) {
    for (const title of extracted) {
      const priority = priorityForTitle(title, story)
      subtasks.push({
        id: makeId('pbst'),
        title,
        description: descriptionForSubtask(title, priority, story),
        priority,
        done: false,
      })
    }
  } else {
    const base = [
      {
        title: 'Define scope, acceptance criteria, and dependencies',
        description:
          'Write a 5–10 bullet definition of done, constraints, owners, dependencies, and rollout plan. Confirm success metrics and risks.',
        priority: 'P0',
      },
      {
        title: 'Deliver core implementation (MVP)',
        description:
          'Implement the minimum viable solution end-to-end. Ensure the main flow works and blockers are resolved.',
        priority: 'P0',
      },
      {
        title: 'Add tracking/monitoring and edge-case handling',
        description:
          'Add logging/metrics/alerts where needed, and cover edge cases. Validate the system is observable and resilient.',
        priority: 'P1',
      },
      {
        title: 'QA: test plan + validation',
        description:
          'Create a test checklist, validate main scenarios + regressions, and confirm acceptance criteria are met.',
        priority: 'P1',
      },
      {
        title: 'Documentation + rollout notes',
        description:
          'Document what changed, how to operate it, and how to roll back. Share rollout notes with stakeholders.',
        priority: 'P2',
      },
    ]
    for (const item of base) subtasks.push({ id: makeId('pbst'), ...item, done: false })
  }

  // Sort by priority, preserve relative order within the same priority.
  return subtasks
    .map((s, idx) => ({ ...s, _idx: idx }))
    .sort((a, b) => {
      const pa = PRIORITY_ORDER.indexOf(a.priority)
      const pb = PRIORITY_ORDER.indexOf(b.priority)
      if (pa !== pb) return pa - pb
      return a._idx - b._idx
    })
    .map(({ _idx, ...rest }) => rest)
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
    subtasks: generatePrioritizedSubtasks({
      title: 'Acquisition & Traffic Structure',
      description:
        'Traffic is easy to unlock — media agencies are constantly looking to monetize. The key is structuring acquisition channels properly, not chasing random volume.\n\nFocus on:\n\nDirect sources (e.g. investing.com): understand delivery model, lead quality and scalability.\n\nIndirect sources: media buying & affiliates, with fast test → kill → scale logic and strict tracking.\n\nIn parallel, structure internal traffic flows to maximize conversion efficiency and LTV.',
    }),
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
    subtasks: generatePrioritizedSubtasks({
      title: 'Sales Leverage: Prop Clients → Forex & Account Management',
      description:
        'Prop clients are already warm traffic. We should build a structured upsell flow to convert them into:\n\nForex traders\n\nAccount management clients\n\nGoal:\n\nIncrease LTV\n\nImprove monetization efficiency\n\nLeverage existing traffic at near-zero acquisition cost',
    }),
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
    subtasks: generatePrioritizedSubtasks({
      title: 'Client Communication Channels (Premium Support & Booking)',
      description:
        'Test and implement convrs.io integration to centralize:\n\nWhatsApp\n\nTelegram\n\nDiscord\n\nObjectives:\n\nPremium support channel\n\nDirect call booking with sales or market analyst\n\nStructured post-registration engagement\n\nOnly after validating this layer, evaluate additional integrations with Solitics if needed.\nOrlin has a key role in designing flows, automation logic and segmentation.',
    }),
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
    subtasks: generatePrioritizedSubtasks({
      title: 'Automation: Market Analysis & News Distribution',
      description:
        'Automate distribution of market analysis and news through WhatsApp and other messaging channels.\n\nObjectives:\n\nIncrease engagement\n\nImprove retention\n\nReduce manual workload\n\nStandardize communication quality\n\nIntegration with Solitics to be evaluated only after convrs.io setup is stable.',
    }),
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
    subtasks: generatePrioritizedSubtasks({
      title: 'Outreach Review: Kommo Performance & Feedback',
      description:
        'Review Kommo activity:\n\nMessage volume\n\nResponse rate\n\nFeedback quality\n\nConversion impact\n\nGoal:\n\nUnderstand real performance\n\nOptimize scripts\n\nImprove targeting\n\nIncrease conversion efficiency',
    }),
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
    subtasks: generatePrioritizedSubtasks({
      title: 'Withdrawals Automation (Critical)',
      description:
        'Implement automated withdrawals:\n\nCard withdrawals — BridgerPay + SolidPayments\n\nInstant credit to clients\n\nNo banking fees\n\nStrong UX improvement\n\nSignificant support workload reduction\n\nCrypto withdrawals — Skale + Uniwire\n\nInstant payouts\n\nMassive operational efficiency\n\nMajor time saving for support and finance teams\n\nThis is a must-have and deal-breaker priority.',
    }),
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
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            minWidth: 0,
            flex: '1 1 220px',
          }}
        >
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
              minWidth: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {task.title}
          </div>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <DepartmentPill department={task.owner} />
        </div>
      </div>
    </button>
  )
}

function Modal({ task, onClose, onUpdate, readOnly = false }) {
  if (!task) return null

  const canEdit = !readOnly
  const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : []
  const complex = isComplexStory(task)
  const hasSubtasks = subtasks.length > 0
  const [activeSubtaskId, setActiveSubtaskId] = useState(null)
  const [subtaskDensity, setSubtaskDensity] = useState('compact')

  const requestClose = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    onClose()
  }

  const requestCloseSubtask = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setActiveSubtaskId(null)
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      // If subtask is open, close it first.
      if (activeSubtaskId) {
        setActiveSubtaskId(null)
        return
      }
      onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeSubtaskId, onClose])

  const activeSubtask = subtasks.find((st) => st.id === activeSubtaskId) || null
  const descriptionBlocks = useMemo(
    () => parseDescriptionBlocks(task?.description),
    [task?.description]
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose(e)
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(10px, 3vw, 16px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        zIndex: 60,
      }}
    >
      <div
        className={`card pb-story-modal ${subtaskDensity === 'compact' ? 'pb-density-compact' : 'pb-density-comfort'}`}
        style={{
          width: 'min(920px, 100%)',
          maxHeight: 'calc(100dvh - 32px)',
          overflow: 'auto',
          overscrollBehavior: 'contain',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.10)',
          background: '#0b1020',
          padding: 'clamp(10px, 2vw, 14px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        }}
      >
        <div
          className="pb-story-modal__header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 900 }}>Project</div>
            <div
              style={{
                color: 'var(--text)',
                fontSize: 'clamp(16px, 2.2vw, 20px)',
                fontWeight: 950,
                marginTop: 4,
                lineHeight: 1.15,
                overflowWrap: 'anywhere',
              }}
            >
              {task.title}
            </div>
            <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, marginTop: 6 }}>
              Department: {task.owner || '—'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <button
              type="button"
              onPointerDown={requestClose}
              onClick={requestClose}
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

        <div
          className="pb-story-modal__body"
          style={{
            marginTop: 12,
          }}
        >
          <div
            className="pb-story-modal__main"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 0,
            }}
          >
            <div className="card" style={{ padding: 12, borderRadius: 12 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 900 }}>
                Description
              </div>
              {String(task.summary || '').trim() && (
                <div
                  style={{
                    color: 'rgba(226,232,240,0.84)',
                    fontSize: 12,
                    marginTop: 8,
                    fontWeight: 700,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {task.summary}
                </div>
              )}
              <div className="pb-desc" style={{ marginTop: 10 }}>
                {descriptionBlocks.length ? (
                  descriptionBlocks.map((block, idx) => {
                    if (block.type === 'h') {
                      return (
                        <div key={`${block.type}-${idx}`} className="pb-desc__heading">
                          {block.text}
                        </div>
                      )
                    }
                    if (block.type === 'ul') {
                      return (
                        <ul key={`${block.type}-${idx}`} className="pb-desc__list">
                          {block.items.map((item) => (
                            <li key={item} className="pb-desc__li">
                              {item}
                            </li>
                          ))}
                        </ul>
                      )
                    }
                    return (
                      <div
                        key={`${block.type}-${idx}`}
                        className={idx === 0 ? 'pb-desc__lead' : 'pb-desc__p'}
                      >
                        {block.text}
                      </div>
                    )
                  })
                ) : (
                  <div className="pb-desc__p">—</div>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 12, borderRadius: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 900 }}>Tasks</div>
                  {hasSubtasks && (
                    <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>
                      Click a task to read/edit its text.
                    </div>
                  )}
                </div>

                {hasSubtasks && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12, fontWeight: 800 }}>
                      View
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'rgba(255,255,255,0.03)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSubtaskDensity('compact')}
                        style={{
                          padding: '8px 10px',
                          border: 0,
                          background:
                            subtaskDensity === 'compact' ? 'rgba(34,211,238,0.12)' : 'transparent',
                          color: 'rgba(226,232,240,0.95)',
                          fontWeight: 900,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Compact
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubtaskDensity('comfort')}
                        style={{
                          padding: '8px 10px',
                          border: 0,
                          background:
                            subtaskDensity === 'comfort' ? 'rgba(34,211,238,0.12)' : 'transparent',
                          color: 'rgba(226,232,240,0.95)',
                          fontWeight: 900,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Comfort
                      </button>
                    </div>
                  </div>
                )}
                {canEdit && complex && !hasSubtasks && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate(task.id, { subtasks: generatePrioritizedSubtasks(task) })
                    }
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      fontWeight: 900,
                      fontSize: 12,
                      background: 'rgba(34,211,238,0.10)',
                      border: '1px solid rgba(34,211,238,0.25)',
                      color: 'rgba(226,232,240,0.95)',
                      cursor: 'pointer',
                    }}
                  >
                    Generate
                  </button>
                )}
              </div>

              {!hasSubtasks ? (
                <div style={{ marginTop: 10, color: 'rgba(148,163,184,0.95)', fontSize: 13 }}>
                  {complex
                    ? 'No tasks yet. Use Generate to break this story down.'
                    : 'Story looks simple — no task breakdown needed.'}
                </div>
              ) : (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="pb-subtask-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveSubtaskId(st.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setActiveSubtaskId(st.id)
                        }
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '18px minmax(0, 1fr) auto',
                        gap: subtaskDensity === 'compact' ? 8 : 10,
                        alignItems: 'center',
                        padding: subtaskDensity === 'compact' ? '6px 8px' : '8px 10px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        className="pb-subtask-checkbox"
                        type="checkbox"
                        checked={Boolean(st.done)}
                        disabled={!canEdit}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const next = subtasks.map((x) =>
                            x.id === st.id ? { ...x, done: e.target.checked } : x
                          )
                          onUpdate(task.id, { subtasks: next })
                        }}
                        style={{ marginTop: 2 }}
                      />

                      <div
                        style={{
                          minWidth: 0,
                          color: 'rgba(226,232,240,0.92)',
                          fontSize: subtaskDensity === 'compact' ? 12 : 13,
                          fontWeight: 850,
                          textAlign: 'left',
                          textDecoration: st.done ? 'line-through' : 'none',
                          opacity: st.done ? 0.65 : 1,
                          overflowWrap: 'anywhere',
                        }}
                        title="Open task text"
                      >
                        {st.title}
                      </div>

                      <div
                        className="pb-subtask-meta"
                        style={{
                          display: 'inline-flex',
                          gap: 6,
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          flex: '0 0 auto',
                        }}
                      >
                        <span
                          className={`pb-priority-pill pb-priority-${priorityNumber(st.priority || 'P1')}`}
                        >
                          Priority {priorityNumber(st.priority || 'P1')}
                        </span>
                        {st.done ? <span className="pb-done-pill">Done</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className="card pb-story-modal__aside"
            style={{ padding: 12, borderRadius: 12, minWidth: 0 }}
          >
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

        {activeSubtask && (
          <div
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) requestCloseSubtask(e)
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: 'clamp(10px, 3vw, 16px)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              zIndex: 70,
            }}
          >
            <div
              className="card"
              style={{
                width: 'min(760px, 100%)',
                maxHeight: 'calc(100dvh - 32px)',
                overflow: 'auto',
                overscrollBehavior: 'contain',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.10)',
                background: '#0b1020',
                padding: 'clamp(10px, 2vw, 14px)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      className={`pb-priority-pill pb-priority-${priorityNumber(activeSubtask.priority || 'P1')}`}
                    >
                      Priority {priorityNumber(activeSubtask.priority || 'P1')}
                    </span>
                    <div
                      style={{
                        color: 'rgba(241,245,249,0.96)',
                        fontSize: 'clamp(14px, 2vw, 16px)',
                        fontWeight: 950,
                        lineHeight: 1.2,
                        overflowWrap: 'anywhere',
                        minWidth: 0,
                      }}
                    >
                      {activeSubtask.title}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onPointerDown={requestCloseSubtask}
                  onClick={requestCloseSubtask}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    fontWeight: 900,
                    fontSize: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    flex: '0 0 auto',
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12, fontWeight: 900 }}>
                Text
              </div>

              {canEdit ? (
                <textarea
                  value={activeSubtask.description || ''}
                  onChange={(e) => {
                    const next = subtasks.map((x) =>
                      x.id === activeSubtask.id ? { ...x, description: e.target.value } : x
                    )
                    onUpdate(task.id, { subtasks: next })
                  }}
                  placeholder="Task text (definition of done, notes, links…)"
                  rows={8}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    padding: 10,
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'rgba(226,232,240,0.92)',
                    resize: 'vertical',
                    fontSize: 13,
                    lineHeight: 1.35,
                    minHeight: 160,
                  }}
                />
              ) : (
                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'rgba(226,232,240,0.92)',
                    fontSize: 13,
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {String(activeSubtask.description || '').trim() ? activeSubtask.description : '—'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectBoardPage({ publicMode = false, sharePayload = null }) {
  const [tasks, setTasks] = useState(() => {
    const inPayload = Array.isArray(sharePayload?.tasks) ? sharePayload.tasks : null

    const base = publicMode && inPayload ? inPayload : seedTasks()
    if (publicMode) return base

    // For editable mode, automatically break down complex Backlog stories the first time
    // they appear (keeps simple stories untouched).
    return (base || []).map((t) => {
      const hasSubtasks = Array.isArray(t?.subtasks) && t.subtasks.length > 0
      const isBacklog = String(t?.status || '') === 'Backlog'
      if (isBacklog && !hasSubtasks && isComplexStory(t)) {
        return { ...t, subtasks: generatePrioritizedSubtasks(t) }
      }
      return t
    })
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
      k: 'pboard',
      v: 1,
      generatedAt: new Date().toISOString(),
      board: {
        title: 'Project Board',
      },
      tasks,
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const isLocalhost = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(origin)

    let token = ''
    try {
      const resp = await fetch('/api/share/create-project-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })
      const data = await resp.json().catch(() => null)
      if (resp.ok && data?.ok && data?.token) token = String(data.token)
      else throw new Error(data?.error || data?.message || 'share-not-available')
    } catch {
      if (!isLocalhost) {
        window.alert('Share link non disponibile (storage share non configurato).')
        return
      }

      // Local fallback (dev only): store snapshot in localStorage (same browser/device only)
      try {
        const bytes = new Uint8Array(12)
        if (typeof window !== 'undefined' && window.crypto?.getRandomValues)
          window.crypto.getRandomValues(bytes)
        token = `share_local_${Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}`
      } catch {
        token = `share_local_${Math.random().toString(16).slice(2)}`
      }
      try {
        window.localStorage.setItem(`bw_share_project_board:${token}`, JSON.stringify({ payload }))
      } catch {
        // ignore
      }
    }

    const href = token.startsWith('share_')
      ? `${origin}/s/${encodeURIComponent(token)}`
      : `${origin}/share/project-board/${encodeURIComponent(token)}`

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
              className="card pb-column"
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
        .pb-grid { grid-template-columns: repeat(4, minmax(260px, 1fr)); }
        @media (max-width: 1100px) {
          .pb-grid { grid-template-columns: repeat(2, minmax(260px, 1fr)); }
        }
        @media (max-width: 720px) {
          /* Mobile-first Kanban: swipe columns horizontally instead of stacking a very tall page */
          .pb-grid {
            grid-template-columns: none;
            grid-auto-flow: column;
            grid-auto-columns: minmax(86vw, 1fr);
            overflow-x: auto;
            overflow-y: visible;
            padding-bottom: 10px;
            scroll-snap-type: x mandatory;
            overscroll-behavior-x: contain;
            -webkit-overflow-scrolling: touch;
          }
          .pb-column { scroll-snap-align: start; }
        }
      `}</style>
    </div>
  )
}
