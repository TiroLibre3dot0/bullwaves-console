import { useEffect, useMemo, useState } from 'react'
import { encodeSharePayload } from '../../utils/shareCodec'
import { getPublicShareOrigin } from '../../utils/publicShareOrigin'
import TaskSidebar from '../../components/sidebars/TaskSidebar'
import { useI18n } from '../../i18n/I18nContext'
import { buildBoardTasksFromStories, mergeTasksById } from './storyTasksImport'

const STATUSES = ['Strategic', 'Backlog', 'Executing', 'Review & QA', 'Done', 'Next Priorities']

const STRATEGIC_CATEGORIES = {
  'Growth & Acquisition': { color: '#10b981', labelKey: 'tasksBoard.categories.growth' }, // emerald
  'Retention & Monetization': { color: '#f59e0b', labelKey: 'tasksBoard.categories.retention' }, // amber
  'Platform & Infrastructure': { color: '#8b5cf6', labelKey: 'tasksBoard.categories.platform' }, // violet
  'Partnerships & Affiliates': { color: '#06b6d4', labelKey: 'tasksBoard.categories.partners' }, // cyan
  'Operations & Compliance': { color: '#ef4444', labelKey: 'tasksBoard.categories.ops' }, // red
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
  if (
    title.includes('acquisition') ||
    title.includes('acquisizione') ||
    title.includes('traffic') ||
    title.includes('traffico')
  )
    return 'target'
  if (
    title.includes('sales leverage') ||
    title.includes('account management') ||
    title.includes('forex') ||
    title.includes('gestione account')
  )
    return 'briefcase'
  if (
    title.includes('communication') ||
    title.includes('comunicazione') ||
    title.includes('channels') ||
    title.includes('canali') ||
    title.includes('booking') ||
    title.includes('prenot')
  )
    return 'link'
  if (
    title.includes('market analysis') ||
    title.includes('analisi di mercato') ||
    title.includes('news') ||
    title.includes('notizie')
  )
    return 'broadcast'
  if (title.includes('outreach') || title.includes('kommo') || title.includes('review'))
    return 'activity'
  if (title.includes('withdraw') || title.includes('preliev')) return 'shield'
  return 'plus'
}

function isItalian(locale) {
  return String(locale || '')
    .toLowerCase()
    .startsWith('it')
}

function pick(locale, en, it) {
  return isItalian(locale) ? it : en
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
    lower === 'focus su:' ||
    lower === 'focus su' ||
    lower === 'goal:' ||
    lower === 'obiettivo:' ||
    lower === 'obiettivi:' ||
    lower === 'objectives:' ||
    lower === 'objectives' ||
    lower === 'focus on' ||
    lower === 'goals:' ||
    lower === 'notes:' ||
    lower === 'note:'
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

  if (
    full.includes('critical') ||
    full.includes('critico') ||
    full.includes('deal-breaker') ||
    full.includes('must-have') ||
    full.includes('imprescindibile')
  )
    return 'P0'
  if (
    t.includes('define') ||
    t.includes('definisci') ||
    t.includes('scope') ||
    t.includes('ambito') ||
    t.includes('acceptance') ||
    t.includes('accettazione')
  )
    return 'P0'
  if (
    t.includes('implement') ||
    t.includes('setup') ||
    t.includes('integrat') ||
    t.includes('centralize') ||
    t.includes('implementa') ||
    t.includes('integra')
  )
    return 'P0'
  if (
    t.includes('test') ||
    t.includes('qa') ||
    t.includes('monitor') ||
    t.includes('monitoraggio') ||
    t.includes('tracking') ||
    t.includes('tracciamento')
  )
    return 'P1'
  if (
    t.includes('optimiz') ||
    t.includes('ottimiz') ||
    t.includes('improv') ||
    t.includes('miglior') ||
    t.includes('evaluate') ||
    t.includes('valuta') ||
    t.includes('review')
  )
    return 'P1'
  if (
    t.includes('doc') ||
    t.includes('document') ||
    t.includes('rollout') ||
    t.includes('rilascio') ||
    t.includes('polish') ||
    t.includes('rifinit')
  )
    return 'P2'

  return 'P1'
}

function descriptionForSubtask(title, priority, story, locale) {
  const cleanTitle = String(title || '').trim()
  const storyTitle = String(story?.title || '').trim()

  const prefix = storyTitle
    ? pick(locale, `From “${storyTitle}”`, `Da “${storyTitle}”`)
    : pick(locale, 'From story', 'Dalla storia')

  const deliverable = pick(
    locale,
    'Deliverable: link/PR + 2–3 lines of notes in the task comments.',
    'Deliverable: link/PR + 2–3 righe di note nei commenti del task.'
  )

  if (priority === 'P0') {
    return pick(
      locale,
      `${prefix}: do this first. Define “done”, list dependencies, then implement: ${cleanTitle}. ${deliverable}`,
      `${prefix}: fai questo per primo. Definisci “fatto”, elenca le dipendenze, poi implementa: ${cleanTitle}. ${deliverable}`
    )
  }
  if (priority === 'P2') {
    return pick(
      locale,
      `${prefix}: polish/rollout. Validate, document decisions, communicate changes, and ship safely for: ${cleanTitle}. ${deliverable}`,
      `${prefix}: rifinitura/rilascio. Valida, documenta le decisioni, comunica i cambiamenti e rilascia in sicurezza per: ${cleanTitle}. ${deliverable}`
    )
  }
  return pick(
    locale,
    `${prefix}: implement next, then validate + monitor. Task: ${cleanTitle}. ${deliverable}`,
    `${prefix}: implementa, poi valida + monitora. Task: ${cleanTitle}. ${deliverable}`
  )
}

function generatePrioritizedSubtasks(story, locale) {
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
        description: descriptionForSubtask(title, priority, story, locale),
        priority,
        done: false,
      })
    }
  } else {
    const base = [
      {
        title: pick(
          locale,
          'Define scope, acceptance criteria, and dependencies',
          'Definisci ambito, criteri di accettazione e dipendenze'
        ),
        description: pick(
          locale,
          'Write a 5–10 bullet definition of done, constraints, owners, dependencies, and rollout plan. Confirm success metrics and risks.',
          'Scrivi una definizione di “fatto” in 5–10 punti con vincoli, owner, dipendenze e piano di rilascio. Conferma metriche di successo e rischi.'
        ),
        priority: 'P0',
      },
      {
        title: pick(
          locale,
          'Deliver core implementation (MVP)',
          'Consegna implementazione core (MVP)'
        ),
        description: pick(
          locale,
          'Implement the minimum viable solution end-to-end. Ensure the main flow works and blockers are resolved.',
          'Implementa la soluzione minima end-to-end. Assicura che il flusso principale funzioni e rimuovi i blocchi.'
        ),
        priority: 'P0',
      },
      {
        title: pick(
          locale,
          'Add tracking/monitoring and edge-case handling',
          'Aggiungi tracking/monitoraggio e gestione edge-case'
        ),
        description: pick(
          locale,
          'Add logging/metrics/alerts where needed, and cover edge cases. Validate the system is observable and resilient.',
          'Aggiungi log/metriche/alert dove serve e copri gli edge-case. Valida che il sistema sia osservabile e resiliente.'
        ),
        priority: 'P1',
      },
      {
        title: pick(locale, 'QA: test plan + validation', 'QA: piano test + validazione'),
        description: pick(
          locale,
          'Create a test checklist, validate main scenarios + regressions, and confirm acceptance criteria are met.',
          'Crea una checklist test, valida scenari principali + regressioni e conferma che i criteri di accettazione siano soddisfatti.'
        ),
        priority: 'P1',
      },
      {
        title: pick(locale, 'Documentation + rollout notes', 'Documentazione + note di rilascio'),
        description: pick(
          locale,
          'Document what changed, how to operate it, and how to roll back. Share rollout notes with stakeholders.',
          'Documenta cosa è cambiato, come operarlo e come fare rollback. Condividi le note di rilascio con gli stakeholder.'
        ),
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

const TASK_SEEDS = [
  // STRATEGIC
  {
    id: 'pb_strat_ops_architecture',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'High',
    owner: 'Tech',
    status: 'Strategic',
    title:
      'Define Bullwaves operational architecture (CRM, trading platform, automation, data layer)',
    summary: 'Single reference architecture and operating model for systems + data.',
  },
  {
    id: 'pb_strat_cross_team_workflows',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'High',
    owner: 'Ops',
    status: 'Strategic',
    title: 'Structure coordinated workflows across Sales, Support, Marketing and CRM',
    summary: 'Clear handoffs, owners, and shared operational cadence.',
  },
  {
    id: 'pb_strat_retention_infra',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'High',
    owner: 'CRM & Automation',
    status: 'Strategic',
    title: 'Consolidate retention & automation infrastructure',
    summary: 'Unify segmentation, journeys, triggers, and measurement loops.',
  },
  {
    id: 'pb_strat_ecosystem_alignment',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'High',
    owner: 'Tech',
    status: 'Strategic',
    title:
      'Align operational ecosystem across Skale, Solitics, CreoLabs, Voiso, Convrs and Cellxpert',
    summary: 'One operational ecosystem: consistent identifiers, events, and ownership.',
  },
  {
    id: 'pb_strat_affiliate_partner_infra',
    strategicCategory: 'Partnerships & Affiliates',
    impactLevel: 'High',
    owner: 'Dan',
    status: 'Strategic',
    title: 'Strengthen affiliate & partner integration infrastructure',
    summary: 'Reliable reporting, payout logic, and partner ops readiness.',
  },

  // BACKLOG
  {
    id: 'pb_acq_channels',
    strategicCategory: 'Growth & Acquisition',
    impactLevel: 'High',
    owner: 'Marketing',
    status: 'Backlog',
    title: 'Optimise acquisition channels for scalable growth',
    summary: 'Direct + indirect sources, fast testing, strict tracking.',
  },
  {
    id: 'pb_upsell_forex_am',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'High',
    owner: 'Sales',
    status: 'Backlog',
    title: 'Systematise upsell flows toward Forex / Account Management',
    summary: 'Convert warm internal traffic into higher-value segments.',
  },
  {
    id: 'pb_outreach_opt',
    strategicCategory: 'Growth & Acquisition',
    impactLevel: 'Medium',
    owner: 'Sales',
    status: 'Backlog',
    title: 'Improve outreach performance and conversion',
    summary: 'Measurement, scripts optimisation, targeting, conversion loops.',
  },
  {
    id: 'pb_withdraw_automation',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'High',
    owner: 'Payments & Compliance',
    status: 'Backlog',
    title: 'Implement automated withdrawal systems',
    summary: 'Automate card + crypto withdrawals to reduce ops load and improve UX.',
  },
  {
    id: 'pb_trading_data_visibility_sales',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'Medium',
    owner: 'Sales',
    status: 'Backlog',
    title: 'Improve trading data visibility for Sales',
    summary: 'Make the key trading/account signals usable in day-to-day sales workflows.',
  },
  {
    id: 'pb_agent_performance_dashboards',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'Medium',
    owner: 'Ops',
    status: 'Backlog',
    title: 'Structure agent performance dashboards',
    summary: 'KPIs, attribution, pipeline and daily operational visibility for agents.',
  },
  {
    id: 'pb_onboarding_pipeline_opt',
    strategicCategory: 'Growth & Acquisition',
    impactLevel: 'Medium',
    owner: 'CRM & Automation',
    status: 'Backlog',
    title: 'Optimise user onboarding pipeline',
    summary: 'Reduce drop-off with structured onboarding stages and automated nudges.',
  },
  {
    id: 'pb_affiliate_reporting_automation',
    strategicCategory: 'Partnerships & Affiliates',
    impactLevel: 'Medium',
    owner: 'Dan',
    status: 'Backlog',
    title: 'Automate affiliate reporting',
    summary: 'Standardised reporting, repeatable runs, fewer manual stitches.',
  },

  // EXECUTING
  {
    id: 'pb_premium_channels',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'Medium',
    owner: 'CRM & Automation',
    status: 'Executing',
    title: 'Centralise communication channels for premium clients',
    summary: 'Convrs setup for WhatsApp/Telegram/Discord premium flows + booking.',
  },
  {
    id: 'pb_skale_test_env',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'High',
    owner: 'Tech',
    status: 'Executing',
    title: 'Set up Skale testing environment (new UI)',
    summary: 'Provision, validate access, then run E2E smoke tests on the new UI.',
  },
  {
    id: 'pb_cellxpert_escail_data_alignment',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'High',
    owner: 'CRM & Automation',
    status: 'Executing',
    title: 'Align Cellxpert ↔ Skale data',
    summary: 'Canonical field map and validated sync (IDs, events, timestamps, ownership).',
  },
  {
    id: 'pb_affiliate_monthly_payments_rework',
    strategicCategory: 'Partnerships & Affiliates',
    impactLevel: 'High',
    owner: 'Dan',
    status: 'Executing',
    title: 'Review monthly affiliate payment calculation',
    summary: 'Make payout calculation consistent, auditable, and aligned to current rules.',
  },
  {
    id: 'pb_ops_data_distribution_sales_support',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'High',
    owner: 'Ops',
    status: 'Executing',
    title: 'Improve operational data distribution to Sales and Support',
    summary: 'Operational signals delivered consistently (dashboards, views, and routines).',
  },

  // REVIEW & QA
  {
    id: 'pb_voiso_skale_integration',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'High',
    owner: 'Tech',
    status: 'Review & QA',
    title: 'Voiso ↔ Skale integration (calling + ops workflow)',
    summary: 'Validate end-to-end and sign off: events, identifiers, reliability.',
  },
  {
    id: 'pb_market_intel',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'Medium',
    owner: 'CRM & Automation',
    status: 'Review & QA',
    title: 'Automate market intelligence distribution',
    summary: 'Automated market insights/news distribution via messaging channels.',
  },

  // DONE
  {
    id: 'pb_solitics_onboarding_completed',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'High',
    owner: 'Paolo / Solitics',
    status: 'Done',
    title:
      'Solitics onboarding completed: platform setup, onboarding sessions, data flow design, segmentation setup, workflow preparation',
    summary: 'One consolidated onboarding delivery completed and documented.',
  },
  {
    id: 'pb_affiliate_console_analytics',
    strategicCategory: 'Partnerships & Affiliates',
    impactLevel: 'High',
    owner: 'Dan',
    status: 'Done',
    title: 'Affiliate analysis console: processed data and operational insights',
    summary: 'Affiliate datasets + analysis views shipped for repeatable internal outputs.',
  },
  {
    id: 'pb_support_user_check_release',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'High',
    owner: 'Dan',
    status: 'Done',
    title: 'Support User Check released to Support team',
    summary: 'Support tool shipped and adopted for day-to-day case handling.',
  },
  {
    id: 'pb_history_mt_web_integration',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'High',
    owner: 'Tech',
    status: 'Done',
    title: 'MetaTrader Web integration completed',
    summary: 'Webtrader access enabled and validated on critical flows.',
  },
  {
    id: 'pb_history_social_trading_integration',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'High',
    owner: 'Tech',
    status: 'Done',
    title: 'Social Trading integration completed',
    summary: 'Brokeree social trading integration delivered and stabilised.',
  },
  {
    id: 'pb_history_scale_brokeree_coordination',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'Medium',
    owner: 'Tech',
    status: 'Done',
    title: 'Skale + Brokeree integration coordination completed',
    summary: 'Cross-vendor blockers resolved and delivery unblocked.',
  },
  {
    id: 'pb_history_retention_alignment',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'Medium',
    owner: 'Ops',
    status: 'Done',
    title: 'Retention alignment completed with owners and next steps defined',
    summary: 'Scope aligned, owners assigned, cadence defined.',
  },
  {
    id: 'pb_history_compliance_sync',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'Medium',
    owner: 'Compliance',
    status: 'Done',
    title: 'Compliance sync completed including risk scoring and KYC improvements',
    summary: 'Shared definitions and next steps captured.',
  },
  {
    id: 'pb_history_trading_platform_overview',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'Low',
    owner: 'Ops',
    status: 'Done',
    title: 'Trading platform operational overview shared',
    summary: 'Baseline shared to align stakeholders and accelerate ops decisions.',
  },

  // NEXT PRIORITIES
  {
    id: 'pb_next_activate_solitics_retention_workflows',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'High',
    owner: 'CRM & Automation',
    status: 'Next Priorities',
    title: 'Activate Solitics retention workflows',
    summary: 'Move from setup to live journeys with measurable impact.',
  },
  {
    id: 'pb_next_optimize_skale_crm_usage',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'Medium',
    owner: 'CRM & Automation',
    status: 'Next Priorities',
    title: 'Optimise Skale CRM usage',
    summary: 'Make the CRM layer operationally consistent and adoption-ready.',
  },
  {
    id: 'pb_next_improve_data_integration',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'High',
    owner: 'Tech',
    status: 'Next Priorities',
    title: 'Improve data integration across platforms',
    summary: 'Unify identifiers, events and reporting semantics.',
  },
  {
    id: 'pb_next_automate_retention_reengagement',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'High',
    owner: 'CRM & Automation',
    status: 'Next Priorities',
    title: 'Automate retention and re-engagement processes',
    summary: 'Lifecycle automation with tracking and optimisation loops.',
  },
  {
    id: 'pb_next_improve_sales_support_tools',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'High',
    owner: 'Ops',
    status: 'Next Priorities',
    title: 'Improve operational tools for Sales and Support',
    summary: 'More self-serve visibility, fewer manual checks, faster workflows.',
  },
  {
    id: 'pb_next_philippines_agents_activation',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'High',
    owner: 'Ops',
    status: 'Next Priorities',
    title:
      'Philippines agents activation: define action areas, tool stack, and contact lists (starts Mon 16)',
    summary:
      'Initial onboarding + agreements completed; define scope, tools to use, and target users to contact for week 1 execution.',
  },
]

export const seedTasks = ({ locale } = {}) => {
  const lang = isItalian(locale) ? 'it' : 'en'
  return TASK_SEEDS.map((seed) => {
    const { i18n, ...rest } = seed
    const text = i18n?.[lang] || i18n?.en || {}
    return { ...rest, ...text }
  })
}

function Card({ task, onOpen, draggable, onDragStart }) {
  const { t } = useI18n()
  const iconName = resolveStoryIcon(task)
  const category = STRATEGIC_CATEGORIES[task.strategicCategory] || {
    color: '#6b7280',
    labelKey: null,
  }
  const impact = IMPACT_LEVELS[task.impactLevel] || IMPACT_LEVELS.Medium
  const impactLabel =
    t?.(`tasksBoard.impact.${String(task?.impactLevel || '').toLowerCase()}`) ||
    String(task?.impactLevel || '')

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
            {category.labelKey ? t(category.labelKey) : '—'}
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
            {impactLabel}
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
  const { t, locale } = useI18n()

  const [tasks, setTasks] = useState(() => {
    const inPayload = Array.isArray(sharePayload?.tasks) ? sharePayload.tasks : null

    const base =
      publicMode && Array.isArray(inPayload) && inPayload.length ? inPayload : seedTasks({ locale })
    if (publicMode) return base

    // For editable mode, automatically break down complex Backlog stories the first time
    // they appear (keeps simple stories untouched).
    return (base || []).map((t) => {
      const hasSubtasks = Array.isArray(t?.subtasks) && t.subtasks.length > 0
      const isBacklog = String(t?.status || '') === 'Backlog'
      if (isBacklog && !hasSubtasks && isComplexStory(t)) {
        return { ...t, subtasks: generatePrioritizedSubtasks(t, locale) }
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
    if (
      t.includes('retention') ||
      t.includes('ritenzione') ||
      t.includes('reactivation') ||
      t.includes('riattiv') ||
      t.includes('prop')
    )
      return 'Retention & Monetization'
    if (
      t.includes('platform') ||
      t.includes('piattaform') ||
      t.includes('crm') ||
      t.includes('product') ||
      t.includes('dashboard')
    )
      return 'Platform & Infrastructure'
    if (
      t.includes('ops') ||
      t.includes('operaz') ||
      t.includes('compliance') ||
      t.includes('conformit') ||
      t.includes('payroll') ||
      t.includes('hr')
    )
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
        summary: t('tasksBoard.importedFromStories', { story: focusMeta.storyTitle || '—' }),
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

  useEffect(() => {
    if (publicMode) return
    if (Array.isArray(sharePayload?.tasks)) return

    const seeded = seedTasks({ locale })
    const byId = new Map(seeded.map((s) => [s.id, s]))

    setTasks((prev) =>
      (prev || []).map((task) => {
        const seed = byId.get(task.id)
        if (!seed) return task

        return {
          ...task,
          title: seed.title,
          strategicObjective: seed.strategicObjective,
          problemSolved: seed.problemSolved,
          expectedBusinessImpact: seed.expectedBusinessImpact,
          kpiOrMetric: seed.kpiOrMetric,
          taskBreakdown: seed.taskBreakdown,
          description: seed.description,
          summary: seed.summary,
        }
      })
    )
  }, [locale, publicMode, sharePayload])

  useEffect(() => {
    if (publicMode) return
    let cancelled = false

    const run = async () => {
      try {
        const mod = await import('../stories-kanban/storiesSeed')
        const stories = typeof mod.seedStories === 'function' ? mod.seedStories({ locale }) : []
        const incoming = buildBoardTasksFromStories(stories, { t })
        if (!incoming.length || cancelled) return

        const incomingById = new Map(incoming.map((x) => [x.id, x]))

        setTasks((prev) => {
          const merged = mergeTasksById(prev, incoming)
          return (merged || []).map((task) => {
            const src = incomingById.get(task?.id)
            if (!src) return task
            // Keep board-owned fields (like status) intact; update only localization-sensitive text.
            return {
              ...task,
              title: src.title,
              context: src.context,
              description: src.description,
              strategicObjective: src.strategicObjective,
              summary: src.summary,
            }
          })
        })
      } catch {
        // ignore
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [publicMode, locale, t])

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
    const by = Object.fromEntries(STATUSES.map((s) => [s, []]))
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
        window.alert(t('tasksBoard.share.notAvailable'))
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
              {t('app.tools')}
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>
            {t('tasksBoard.header.title')}
          </div>
          <div
            style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', fontWeight: 650, fontSize: 12 }}
          >
            {t('tasksBoard.header.subtitle')}
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
            {t('common.readOnly')}
          </div>
        ) : embedded ? null : (
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
            {t('tasksBoard.actions.sharePublicLink')}
          </button>
        )}

        <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 800 }}>
          {t('tasksBoard.stats.total', { count: visibleTasks.length })}
          {focusTitles.length ? (
            <span style={{ marginLeft: 8, opacity: 0.85 }}>{t('tasksBoard.stats.filtered')}</span>
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
            title={
              focusMeta.storyTitle
                ? t('tasksBoard.focus.titleWithStory', { story: focusMeta.storyTitle })
                : t('tasksBoard.focus.title')
            }
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('tasksBoard.focus.label', {
                story: focusMeta.storyTitle || t('tasksBoard.focus.fallbackStory'),
              })}
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
              {t('common.clear')}
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
            Strategic: t('tasksBoard.status.strategic'),
            Backlog: t('tasksBoard.status.backlog'),
            Executing: t('tasksBoard.status.executing'),
            'Review & QA': t('tasksBoard.status.reviewQa'),
            Done: t('tasksBoard.status.done'),
            'Next Priorities': t('tasksBoard.status.nextPriorities'),
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
                    {t('tasksBoard.empty.dropHere')}
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
