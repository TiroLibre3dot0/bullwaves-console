import { useEffect, useMemo, useState } from 'react'
import { encodeSharePayload } from '../../utils/shareCodec'
import { getPublicShareOrigin } from '../../utils/publicShareOrigin'
import TaskSidebar from '../../components/sidebars/TaskSidebar'

const STATUSES = ['Backlog', 'Planned', 'Executing', 'Review & QA', 'Blocked', 'Done']

const STRATEGIC_CATEGORIES = {
  'Growth & Acquisition': { color: '#10b981', label: 'Growth' }, // emerald
  'Retention & Monetization': { color: '#f59e0b', label: 'Retention' }, // amber
  'Platform & Infrastructure': { color: '#8b5cf6', label: 'Platform' }, // violet
  'Partnerships & Affiliates': { color: '#06b6d4', label: 'Partners' }, // cyan
  'Operations & Compliance': { color: '#ef4444', label: 'Ops' }, // red
}

const IMPACT_LEVELS = {
  High: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
  Low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' },
}

const DEPARTMENT_ACCENTS = {
  // Updated to use strategic categories with colors
  'Growth & Acquisition': { rgb: [16, 185, 129] }, // emerald
  'Retention & Monetization': { rgb: [245, 158, 11] }, // amber
  'Platform & Infrastructure': { rgb: [139, 92, 246] }, // violet
  'Partnerships & Affiliates': { rgb: [6, 182, 212] }, // cyan
  'Operations & Compliance': { rgb: [239, 68, 68] }, // red
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
    title: 'Optimize Acquisition Channels for Scalable Growth',
    strategicCategory: 'Growth & Acquisition',
    impactLevel: 'High',
    owner: 'Marketing',
    status: 'Backlog',
    strategicObjective:
      'Build a scalable acquisition engine that delivers high-quality leads at optimal cost',
    problemSolved:
      'Current acquisition is fragmented and lacks systematic testing/scaling framework',
    expectedBusinessImpact:
      '30% increase in qualified leads, 25% reduction in CAC, foundation for 2x revenue growth',
    kpiOrMetric: 'Qualified leads per month, CAC, conversion rate from lead to client',
    taskBreakdown: [
      'Audit all current acquisition channels and performance metrics',
      'Implement structured test → kill → scale framework for new channels',
      'Set up advanced tracking and attribution for all touchpoints',
      'Optimize internal traffic flows for maximum conversion efficiency',
      'Establish partnerships with high-quality media sources',
    ],
    description:
      'Traffic is easy to unlock — media agencies are constantly looking to monetize. The key is structuring acquisition channels properly, not chasing random volume.\n\nFocus on:\n\nDirect sources (e.g. investing.com): understand delivery model, lead quality and scalability.\n\nIndirect sources: media buying & affiliates, with fast test → kill → scale logic and strict tracking.\n\nIn parallel, structure internal traffic flows to maximize conversion efficiency and LTV.',
    summary: 'Direct + indirect traffic sources, fast testing, strict tracking.',
    icon: 'megaphone',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Systematize Client Upsell Flows to Forex & Account Management',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'High',
    owner: 'Sales',
    status: 'Backlog',
    strategicObjective:
      'Convert existing prop clients into higher-value forex traders and account management clients',
    problemSolved:
      'Warm traffic from prop clients is not being systematically monetized through upsells',
    expectedBusinessImpact:
      '40% increase in average client LTV, 25% improvement in monetization efficiency',
    kpiOrMetric:
      'Upsell conversion rate, average LTV per client segment, monthly recurring revenue from upsells',
    taskBreakdown: [
      'Map current client journey from prop trading to potential upsells',
      'Design automated upsell triggers based on trading behavior and performance',
      'Create compelling value propositions for forex trading and account management',
      'Implement A/B testing for upsell messaging and timing',
      'Set up tracking and analytics for upsell funnel performance',
    ],
    description:
      'Prop clients are already warm traffic. We should build a structured upsell flow to convert them into:\n\nForex traders\n\nAccount management clients\n\nGoal:\n\nIncrease LTV\n\nImprove monetization efficiency\n\nLeverage existing traffic at near-zero acquisition cost',
    summary: 'Systematize upsell of warm internal traffic.',
    icon: 'briefcase',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Centralize Premium Client Communication Channels',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'Medium',
    owner: 'CRM & Automation',
    status: 'Backlog',
    strategicObjective: 'Create unified premium support and booking experience across all channels',
    problemSolved:
      'Client communication is fragmented across multiple platforms with inconsistent experience',
    expectedBusinessImpact:
      '50% reduction in support response time, 30% increase in client satisfaction scores',
    kpiOrMetric: 'Average response time, client satisfaction NPS, booking conversion rate',
    taskBreakdown: [
      'Evaluate and select unified communication platform (convrs.io)',
      'Integrate WhatsApp, Telegram, and Discord channels',
      'Design structured flows for support tickets and call booking',
      'Implement automated routing based on client tier and issue type',
      'Create standardized response templates and escalation procedures',
    ],
    description:
      'Test and implement convrs.io integration to centralize:\n\nWhatsApp\n\nTelegram\n\nDiscord\n\nObjectives:\n\nPremium support channel\n\nDirect call booking with sales or market analyst\n\nStructured post-registration engagement\n\nOnly after validating this layer, evaluate additional integrations with Solitics if needed.\nOrlin has a key role in designing flows, automation logic and segmentation.',
    summary: 'Centralize WhatsApp, Telegram and Discord for premium flows and call booking.',
    icon: 'messages',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Automate Market Intelligence Distribution',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'Medium',
    owner: 'CRM & Automation',
    status: 'Backlog',
    strategicObjective:
      'Deliver personalized market insights to increase client engagement and retention',
    problemSolved:
      'Market analysis and news are distributed manually with inconsistent reach and timing',
    expectedBusinessImpact: '35% increase in client engagement, 20% reduction in churn rate',
    kpiOrMetric: 'Client engagement rate, content open rates, retention rate by segment',
    taskBreakdown: [
      'Design content calendar for market analysis and news distribution',
      'Set up automated segmentation for personalized content delivery',
      'Integrate market data feeds for real-time insights',
      'Create A/B testing framework for content and messaging',
      'Implement engagement tracking and optimization loops',
    ],
    description:
      'Automate distribution of market analysis and news through WhatsApp and other messaging channels.\n\nObjectives:\n\nIncrease engagement\n\nImprove retention\n\nReduce manual workload\n\nStandardize communication quality\n\nIntegration with Solitics to be evaluated only after convrs.io setup is stable.',
    summary: 'Automated market insights and news via messaging channels.',
    icon: 'broadcast',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Optimize Outreach Performance and Conversion',
    strategicCategory: 'Growth & Acquisition',
    impactLevel: 'Medium',
    owner: 'Sales',
    status: 'Backlog',
    strategicObjective: 'Improve outreach effectiveness through data-driven optimization',
    problemSolved: 'Outreach efforts lack systematic measurement and optimization framework',
    expectedBusinessImpact:
      '40% increase in outreach conversion rate, 25% improvement in lead quality',
    kpiOrMetric: 'Response rate, conversion rate, cost per qualified lead',
    taskBreakdown: [
      'Implement comprehensive tracking for all outreach activities',
      'Analyze current performance across all channels and scripts',
      'A/B test messaging, timing, and targeting strategies',
      'Develop predictive models for lead scoring and prioritization',
      'Create automated optimization loops for ongoing improvement',
    ],
    description:
      'Review Kommo activity:\n\nMessage volume\n\nResponse rate\n\nFeedback quality\n\nConversion impact\n\nGoal:\n\nUnderstand real performance\n\nOptimize scripts\n\nImprove targeting\n\nIncrease conversion efficiency',
    summary: 'Measure effectiveness of current outreach.',
    icon: 'search',
    notes: '',
  },
  {
    id: makeId(),
    title: 'Implement Automated Withdrawal Systems',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'High',
    owner: 'Payments & Compliance',
    status: 'Backlog',
    strategicObjective:
      'Eliminate manual withdrawal processing to improve client experience and operational efficiency',
    problemSolved:
      'Manual withdrawal processing creates delays, errors, and high operational costs',
    expectedBusinessImpact:
      '90% reduction in withdrawal processing time, 60% decrease in support tickets, major UX improvement',
    kpiOrMetric: 'Average withdrawal processing time, support ticket volume, client satisfaction',
    taskBreakdown: [
      'Select and integrate card withdrawal providers (BridgerPay + SolidPayments)',
      'Implement instant card withdrawal functionality',
      'Set up crypto withdrawal automation (Skale + Uniwire)',
      'Create comprehensive testing and failover procedures',
      'Develop client communication and support processes for automated withdrawals',
    ],
    description:
      'Implement automated withdrawals:\n\nCard withdrawals — BridgerPay + SolidPayments\n\nInstant credit to clients\n\nNo banking fees\n\nStrong UX improvement\n\nSignificant support workload reduction\n\nCrypto withdrawals — Skale + Uniwire\n\nInstant payouts\n\nMassive operational efficiency\n\nMajor time saving for support and finance teams\n\nThis is a must-have and deal-breaker priority.',
    summary: 'Full automation of card and crypto withdrawals.',
    icon: 'payments',
    notes: '',
  },
]

function Card({ task, onOpen, draggable, onDragStart }) {
  const iconName = resolveStoryIcon(task)
  const category = STRATEGIC_CATEGORIES[task.strategicCategory] || { color: '#64748b', label: '—' }
  const impact = IMPACT_LEVELS[task.impactLevel] || IMPACT_LEVELS.Medium

  return (
    <button
      type="button"
      className="card"
      style={{
        padding: 16,
        textAlign: 'left',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => onOpen(task.id)}
      draggable={draggable}
      onDragStart={onDragStart}
      title={task.title}
    >
      {/* Strategic Category Tag */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${category.color} 0%, ${category.color}dd 100%)`,
        }}
      />

      <div style={{ marginTop: 8 }}>
        {/* Title */}
        <div
          style={{
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: 0.1,
            color: 'rgba(241,245,249,0.96)',
            lineHeight: 1.3,
            marginBottom: 12,
            overflowWrap: 'anywhere',
          }}
        >
          {task.title}
        </div>

        {/* Strategic Category and Impact Level */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 20,
              background: `rgba(${category.color
                .replace('#', '')
                .match(/.{2}/g)
                .map((x) => parseInt(x, 16))
                .join(',')}, 0.15)`,
              border: `1px solid rgba(${category.color
                .replace('#', '')
                .match(/.{2}/g)
                .map((x) => parseInt(x, 16))
                .join(',')}, 0.3)`,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 800,
              color: category.color,
              letterSpacing: 0.5,
            }}
          >
            {category.label}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 12,
              background: impact.bg,
              border: `1px solid ${impact.border}`,
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 900,
              color: impact.color,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {task.impactLevel}
          </div>
        </div>

        {/* Owner/Department */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ color: 'rgba(148,163,184,0.8)', fontSize: 12, fontWeight: 700 }}>
            {task.owner || '—'}
          </div>

          <div style={{ color: 'rgba(226,232,240,0.6)', marginTop: 1 }}>
            <StoryIcon name={iconName} size={16} />
          </div>
        </div>
      </div>
    </button>
  )
}

export default function ProjectBoardPage({
  publicMode = false,
  sharePayload = null,
  embedded = false,
  onShareSnapshot,
  focus = null,
  onClearFocus,
}) {
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
  const [taskOpen, setTaskOpen] = useState(false)

  const focusTitles = useMemo(() => {
    const list = Array.isArray(focus?.taskTitles) ? focus.taskTitles : []
    return list
      .map((t) => String(t || '').trim())
      .filter(Boolean)
      .map((t) => t.toLowerCase())
  }, [focus])

  const focusMeta = useMemo(() => {
    const title = String(focus?.storyTitle || '').trim()
    const epic = String(focus?.storyEpic || '').trim()
    const highlight = String(focus?.highlightTitle || '').trim()
    return {
      storyTitle: title,
      storyEpic: epic,
      highlightTitle: highlight,
    }
  }, [focus])

  const resolveStrategicCategoryFromFocus = () => {
    const t = `${focusMeta.storyTitle} ${focusMeta.storyEpic}`.toLowerCase()
    if (t.includes('partner') || t.includes('ib') || t.includes('affiliate'))
      return 'Partnerships & Affiliates'
    if (t.includes('retention') || t.includes('reactivation') || t.includes('prop'))
      return 'Retention & Monetization'
    if (
      t.includes('platform') ||
      t.includes('crm') ||
      t.includes('product') ||
      t.includes('dashboard')
    )
      return 'Platform & Infrastructure'
    if (t.includes('ops') || t.includes('compliance') || t.includes('payroll') || t.includes('hr'))
      return 'Operations & Compliance'
    return 'Growth & Acquisition'
  }

  useEffect(() => {
    if (!focusTitles.length) return
    if (publicMode) return

    // Ensure story-scoped tasks exist on the board (so filtering never looks empty).
    setTasks((prev) => {
      const existing = new Set(
        (prev || []).map((t) =>
          String(t?.title || '')
            .trim()
            .toLowerCase()
        )
      )
      const strategicCategory = resolveStrategicCategoryFromFocus()

      const missing = (Array.isArray(focus?.taskTitles) ? focus.taskTitles : [])
        .map((t) => String(t || '').trim())
        .filter(Boolean)
        .filter((t) => !existing.has(t.toLowerCase()))

      if (!missing.length) return prev

      const now = new Date().toISOString()
      const additions = missing.map((title) => ({
        id: makeId(),
        title,
        strategicCategory,
        impactLevel: 'Medium',
        owner: focusMeta.storyTitle ? focusMeta.storyTitle : '—',
        status: 'Backlog',
        strategicObjective: focusMeta.storyTitle || '—',
        problemSolved: '',
        expectedBusinessImpact: '',
        kpiOrMetric: '',
        taskBreakdown: [],
        description: '',
        summary: `Imported from Stories Kanban (${focusMeta.storyTitle || 'story'}).`,
        icon: 'plus',
        notes: `seededAt: ${now}`,
      }))

      return [...(prev || []), ...additions]
    })
  }, [focusTitles.join('|'), publicMode])

  useEffect(() => {
    if (typeof onShareSnapshot !== 'function') return
    onShareSnapshot({
      tasks,
    })
  }, [tasks, onShareSnapshot])

  const visibleTasks = useMemo(() => {
    if (!focusTitles.length) return tasks
    const byTitle = new Set(focusTitles)
    return (tasks || []).filter((t) =>
      byTitle.has(
        String(t?.title || '')
          .trim()
          .toLowerCase()
      )
    )
  }, [tasks, focusTitles])

  const grouped = useMemo(() => {
    const by = {
      Backlog: [],
      'In Progress': [],
      Blocked: [],
      Done: [],
    }
    for (const t of visibleTasks || []) {
      const key = STATUSES.includes(t.status) ? t.status : 'Backlog'
      by[key].push(t)
    }
    return by
  }, [visibleTasks])

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
        title: 'Tasks',
      },
      tasks,
    }

    const shareOrigin = getPublicShareOrigin()
    const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const isLocalhost = /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(runtimeOrigin)

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

    const isKvToken = token.startsWith('share_') && !token.startsWith('share_local_')
    const href = isKvToken
      ? `${shareOrigin}/s/${encodeURIComponent(token)}`
      : `${shareOrigin}/share/project-board/${encodeURIComponent(token)}`

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

  const openTask = (id) => {
    setActiveId(id)
    setTaskOpen(true)
  }

  const closeTask = () => {
    setTaskOpen(false)
    window.setTimeout(() => setActiveId(null), 220)
  }

  const toggleSubtaskDone = (subtask) => {
    if (publicMode) return
    if (!activeTask?.id || !subtask?.id) return
    const current = Array.isArray(activeTask.subtasks) ? activeTask.subtasks : []
    if (!current.length) return

    const next = current.map((st) => (st.id === subtask.id ? { ...st, done: !st.done } : st))
    updateTask(activeTask.id, { subtasks: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: embedded ? 24 : 0 }}>
      {embedded ? null : (
        <div>
          {publicMode ? null : (
            <div style={{ fontSize: 12, fontWeight: 900, color: '#9aa4b2', letterSpacing: 0.2 }}>
              Tools
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>
            Strategic Execution Control System
          </div>
          <div
            style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 650, fontSize: 12 }}
          >
            Bullwaves strategic initiatives board. Each card represents a strategic story with clear
            business impact.
          </div>
        </div>
      )}

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
          Total: {visibleTasks.length}
          {focusTitles.length ? (
            <span style={{ marginLeft: 8, opacity: 0.85 }}>(filtered)</span>
          ) : null}
        </div>

        {focusTitles.length ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 999,
              border: '1px solid rgba(56,189,248,0.26)',
              background: 'rgba(56,189,248,0.10)',
              color: 'rgba(226,232,240,0.92)',
              fontWeight: 900,
              fontSize: 12,
              maxWidth: '100%',
            }}
            title={focusMeta.storyTitle ? `Focused on: ${focusMeta.storyTitle}` : 'Focused view'}
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Focus: {focusMeta.storyTitle || 'Story'}
            </span>
            <button
              type="button"
              onClick={() => {
                if (typeof onClearFocus === 'function') onClearFocus()
              }}
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(0,0,0,0.20)',
                color: 'rgba(226,232,240,0.92)',
                fontWeight: 900,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div
        className="pb-grid"
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        {STATUSES.map((status) => {
          const columnTitles = {
            Backlog: 'Backlog',
            Planned: 'Planned',
            Executing: 'Executing',
            'Review & QA': 'Review & QA',
            Blocked: 'Blocked',
            Done: 'Done',
          }
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
                <div style={{ fontWeight: 950, color: 'var(--text)' }}>
                  {columnTitles[status] || status}
                </div>
                <div style={{ color: 'rgba(148,163,184,0.95)', fontWeight: 900, fontSize: 12 }}>
                  {list.length}
                </div>
              </div>

              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {list.map((task) => (
                  <Card
                    key={task.id}
                    task={task}
                    onOpen={openTask}
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

      <TaskSidebar
        open={Boolean(activeTask) && taskOpen}
        task={activeTask}
        parentStory={null}
        onClose={closeTask}
        onBackToStory={null}
        readOnly={publicMode}
        onToggleSubtaskDone={toggleSubtaskDone}
      />

      <style>{`
        .pb-grid { grid-template-columns: repeat(6, minmax(220px, 1fr)); }
        @media (max-width: 1400px) {
          .pb-grid { grid-template-columns: repeat(3, minmax(220px, 1fr)); }
        }
        @media (max-width: 1000px) {
          .pb-grid { grid-template-columns: repeat(2, minmax(220px, 1fr)); }
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
