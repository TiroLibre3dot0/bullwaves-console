import { useEffect, useMemo, useState } from 'react'
import { encodeSharePayload } from '../../utils/shareCodec'
import { getPublicShareOrigin } from '../../utils/publicShareOrigin'
import TaskSidebar from '../../components/sidebars/TaskSidebar'
import { useI18n } from '../../i18n/I18nContext'
import { buildBoardTasksFromStories, mergeTasksById } from './storyTasksImport'

const STATUSES = ['Backlog', 'Planned', 'Executing', 'Review & QA', 'Blocked', 'Done']

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
  {
    id: 'pb_acq_channels',
    strategicCategory: 'Growth & Acquisition',
    impactLevel: 'High',
    owner: 'Marketing',
    status: 'Backlog',
    icon: 'megaphone',
    i18n: {
      en: {
        title: 'Optimize Acquisition Channels for Scalable Growth',
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
        notes: '',
      },
      it: {
        title: 'Ottimizzare i canali di acquisizione per una crescita scalabile',
        strategicObjective:
          'Costruire un motore di acquisizione scalabile che generi lead di qualità al costo ottimale',
        problemSolved:
          'L’acquisizione attuale è frammentata e manca di un framework sistematico di test/scaling',
        expectedBusinessImpact:
          'Aumento del 30% dei lead qualificati, riduzione del 25% del CAC, base per raddoppiare i ricavi',
        kpiOrMetric: 'Lead qualificati/mese, CAC, tasso di conversione lead → cliente',
        taskBreakdown: [
          'Audit di tutti i canali di acquisizione attuali e delle performance',
          'Implementare framework test → kill → scale per nuovi canali',
          'Impostare tracking avanzato e attribuzione su tutti i touchpoint',
          'Ottimizzare i flussi di traffico interni per massimizzare conversione e LTV',
          'Stabilire partnership con fonti media di alta qualità',
        ],
        description:
          'Sbloccare traffico è relativamente facile: le agenzie media cercano continuamente di monetizzare. La chiave è strutturare correttamente i canali di acquisizione, non inseguire volume casuale.\n\nFocus su:\n\nFonti dirette (es. investing.com): capire modello di delivery, qualità lead e scalabilità.\n\nFonti indirette: media buying e affiliate, con logica veloce test → kill → scale e tracking rigoroso.\n\nIn parallelo, strutturare i flussi interni per massimizzare efficienza di conversione e LTV.',
        summary: 'Traffico diretto + indiretto, test rapidi, tracking rigoroso.',
        notes: '',
      },
    },
  },
  {
    id: 'pb_upsell_forex_am',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'High',
    owner: 'Sales',
    status: 'Backlog',
    icon: 'briefcase',
    i18n: {
      en: {
        title: 'Systematize Client Upsell Flows to Forex & Account Management',
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
        notes: '',
      },
      it: {
        title: 'Sistematizzare gli upsell verso Forex e Account Management',
        strategicObjective:
          'Convertire i clienti prop esistenti in trader forex e clienti di account management a maggiore valore',
        problemSolved:
          'Il traffico caldo dei clienti prop non viene monetizzato in modo sistematico tramite upsell',
        expectedBusinessImpact:
          'Aumento del 40% dell’LTV medio, miglioramento del 25% dell’efficienza di monetizzazione',
        kpiOrMetric:
          'Tasso di conversione upsell, LTV medio per segmento, ricavi ricorrenti mensili da upsell',
        taskBreakdown: [
          'Mappare il journey attuale dal prop trading agli upsell',
          'Progettare trigger automatici in base a comportamento e performance',
          'Creare value proposition convincenti per forex e account management',
          'Implementare A/B test su messaggi e timing di upsell',
          'Impostare tracking e analytics del funnel di upsell',
        ],
        description:
          'I clienti prop sono già traffico caldo. Serve un flusso di upsell strutturato per convertirli in:\n\nTrader forex\n\nClienti di account management\n\nObiettivo:\n\nAumentare LTV\n\nMigliorare efficienza di monetizzazione\n\nSfruttare traffico esistente a costo di acquisizione quasi zero',
        summary: 'Upsell strutturato sul traffico interno caldo.',
        notes: '',
      },
    },
  },
  {
    id: 'pb_premium_channels',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'Medium',
    owner: 'CRM & Automation',
    status: 'Executing',
    icon: 'messages',
    i18n: {
      en: {
        title: 'Centralize Premium Client Communication Channels',
        strategicObjective:
          'Create unified premium support and booking experience across all channels',
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
        notes:
          'Status: executing. WhatsApp Business Platform tested and first user accounts created. Facebook verification for Bullwaves is still pending (external dependency). Next: call with convrs.io to deep-dive how the platform works end-to-end; then Orlin will act as primary owner / point of contact for day-to-day tool management. Support contact: Regine (convrs.io).',
      },
      it: {
        title: 'Centralizzare i canali di comunicazione per clienti premium',
        strategicObjective:
          'Creare un’esperienza unificata di supporto premium e prenotazione call su tutti i canali',
        problemSolved:
          'La comunicazione con i clienti è frammentata su più piattaforme con un’esperienza incoerente',
        expectedBusinessImpact:
          'Riduzione del 50% dei tempi di risposta, +30% nei punteggi di soddisfazione cliente',
        kpiOrMetric: 'Tempo medio di risposta, NPS soddisfazione, conversione prenotazione call',
        taskBreakdown: [
          'Valutare e scegliere la piattaforma unificata (convrs.io)',
          'Integrare WhatsApp, Telegram e Discord',
          'Progettare flussi strutturati per ticket supporto e booking call',
          'Implementare routing automatico per tier cliente e tipo di issue',
          'Creare template standard e procedure di escalation',
        ],
        description:
          'Testare e implementare l’integrazione convrs.io per centralizzare:\n\nWhatsApp\n\nTelegram\n\nDiscord\n\nObiettivi:\n\nCanale premium di supporto\n\nPrenotazione call diretta con sales o market analyst\n\nEngagement strutturato post-registrazione\n\nSolo dopo aver validato questo layer, valutare eventuali integrazioni aggiuntive con Solitics.\nOrlin ha un ruolo chiave nel design dei flussi, logica di automazione e segmentazione.',
        summary: 'Centralizzazione canali premium e booking call.',
        notes:
          'Status: executing. WhatsApp Business Platform testato e create le prime utenze. Verifica Bullwaves da Facebook ancora in attesa (dipendenza esterna). Prossimo step: call con convrs.io per capire meglio il funzionamento end-to-end; poi Orlin prenderà ownership come referente principale per la gestione operativa del tool. Supporto: Regine (convrs.io).',
      },
    },
  },
  {
    id: 'pb_skale_test_env',
    strategicCategory: 'Platform & Infrastructure',
    impactLevel: 'High',
    owner: 'Tech',
    status: 'Executing',
    icon: 'plus',
    i18n: {
      en: {
        title: 'Skale Test Environment Setup (New UI)',
        strategicObjective:
          'Provision and validate a Skale test environment to safely test and iterate on the new UI layer',
        problemSolved:
          'Without a ready Skale test environment we cannot run end-to-end validation of the new UI against real flows',
        expectedBusinessImpact:
          'Unblocks UI delivery and reduces integration risk by enabling structured E2E testing before production',
        kpiOrMetric: 'Test environment ready, E2E smoke tests passing, critical flows validated',
        taskBreakdown: [
          'Confirm Skale test environment provisioning status',
          'Validate access + connectivity (accounts, auth, wallet)',
          'Run E2E smoke tests on the new UI (auth → account → wallet)',
          'Document gaps/blockers and align fixes with Skale',
        ],
        description:
          'Skale requested MT5 credentials to provision the test environment — credentials already provided. We are currently waiting for the environment to be ready.\n\nNext: once the environment is live, apply our code and run end-to-end UI tests on Skale.',
        summary: 'MT5 creds sent; waiting env; then apply code + test UI.',
        notes:
          'Status: executing. MT5 credentials already provided to Skale. Waiting for test environment readiness; then apply our code and validate E2E flows.',
      },
      it: {
        title: 'Setup ambiente di test Skale (nuova UI)',
        strategicObjective:
          'Provisionare e validare un ambiente di test Skale per testare in sicurezza la nuova UI',
        problemSolved:
          'Senza un ambiente di test Skale pronto non possiamo fare validazione end-to-end della nuova UI sui flussi reali',
        expectedBusinessImpact:
          'Sblocca la delivery della UI e riduce il rischio di integrazione abilitando test E2E strutturati prima della produzione',
        kpiOrMetric: 'Ambiente di test pronto, smoke test E2E ok, flussi critici validati',
        taskBreakdown: [
          'Confermare lo stato di provisioning ambiente test Skale',
          'Validare accesso + connettività (account, auth, wallet)',
          'Eseguire smoke test E2E sulla nuova UI (auth → account → wallet)',
          'Documentare gap/blocchi e allineare fix con Skale',
        ],
        description:
          'Skale ha richiesto le credenziali MT5 per provisionare l’ambiente di test — credenziali già fornite. In questo momento stiamo aspettando che l’ambiente sia pronto.\n\nProssimo step: appena l’ambiente è live, applicare il nostro codice e fare test end-to-end della UI su Skale.',
        summary: 'Credenziali MT5 inviate; attesa ambiente; poi codice + test UI.',
        notes:
          'Status: executing. Credenziali MT5 già inviate a Skale. In attesa dell’ambiente di test; poi applicare il nostro codice e validare i flussi E2E.',
      },
    },
  },
  {
    id: 'pb_support_user_check_release',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'High',
    owner: 'Dan',
    status: 'Done',
    icon: 'plus',
    i18n: {
      en: {
        title: 'Support User Check tool — released to Support',
        strategicObjective:
          'Give Support a fast, reliable internal tool to inspect users and resolve cases without manual report digging',
        problemSolved:
          'Support workflows were slow and inconsistent due to scattered data and manual checks',
        expectedBusinessImpact:
          'Faster case resolution, fewer escalations, and better operational visibility for day-to-day support',
        kpiOrMetric: 'Time-to-resolution, escalation rate, Support adoption',
        taskBreakdown: [
          'Ship the tool in the console',
          'Validate access and permissions',
          'Roll out to Support team and collect feedback',
        ],
        description:
          'Released Support User Check and it is already actively used by the Support team. This is a completed delivery item.',
        summary: 'Released and in active use by Support.',
        notes: 'Completed: released and adopted by Support.',
      },
      it: {
        title: 'Support User Check — rilasciato al team Supporto',
        strategicObjective:
          'Dare al Supporto uno strumento veloce e affidabile per verificare utenti e risolvere casi senza controlli manuali',
        problemSolved:
          'I flussi Support erano lenti e incoerenti per dati sparsi e verifiche manuali',
        expectedBusinessImpact:
          'Riduzione tempi di risoluzione, meno escalation, maggiore visibilità operativa nel day-to-day',
        kpiOrMetric: 'Time-to-resolution, tasso escalation, adozione tool',
        taskBreakdown: [
          'Rilasciare il tool nella console',
          'Validare accessi e permessi',
          'Rollout al team Supporto e raccolta feedback',
        ],
        description:
          'Support User Check è stato rilasciato ed è già utilizzato dal team di supporto. Questo task è da considerarsi completato.',
        summary: 'Rilasciato e in uso dal Supporto.',
        notes: 'Completato: rilasciato e adottato dal Supporto.',
      },
    },
  },
  {
    id: 'pb_affiliate_console_analytics',
    strategicCategory: 'Partnerships & Affiliates',
    impactLevel: 'High',
    owner: 'Dan',
    status: 'Done',
    icon: 'plus',
    i18n: {
      en: {
        title: 'Affiliate analytics console — data processing + insights',
        strategicObjective:
          'Centralize processed affiliate data and analyses into a single console for faster decisions and partner ops',
        problemSolved:
          'Affiliate performance and economics were hard to read and required manual report stitching',
        expectedBusinessImpact:
          'Better partner decisions, faster anomaly detection, and clearer payout/ROI visibility',
        kpiOrMetric: 'Time to produce reports, partner ROI visibility, anomaly detection time',
        taskBreakdown: [
          'Process key reports into consolidated datasets',
          'Build the console views for affiliate analysis',
          'Validate calculations and publish to internal users',
        ],
        description:
          'Console with processed data and affiliate analyses is already completed and has been available internally for some time.',
        summary: 'Affiliate analytics console completed.',
        notes: 'Completed: console exists with processed affiliate analysis data.',
      },
      it: {
        title: 'Console analisi affiliati — dati elaborati + insight',
        strategicObjective:
          'Centralizzare dati elaborati e analisi affiliati in una console unica per decisioni più rapide',
        problemSolved:
          'Le performance affiliate e l’economia erano difficili da leggere e richiedevano unione manuale report',
        expectedBusinessImpact:
          'Migliori decisioni partner, rilevazione anomalie più veloce, visibilità payout/ROI più chiara',
        kpiOrMetric: 'Tempo produzione report, visibilità ROI partner, tempo rilevazione anomalie',
        taskBreakdown: [
          'Elaborare i report chiave in dataset consolidati',
          'Costruire le viste console per l’analisi affiliati',
          'Validare calcoli e pubblicare per uso interno',
        ],
        description:
          'La console con i dati elaborati e le analisi degli affiliati è già completata e disponibile internamente da tempo.',
        summary: 'Console affiliate completata.',
        notes: 'Completato: console disponibile con analisi affiliati.',
      },
    },
  },
  {
    id: 'pb_affiliate_monthly_payments_rework',
    strategicCategory: 'Partnerships & Affiliates',
    impactLevel: 'High',
    owner: 'Dan',
    status: 'Executing',
    icon: 'plus',
    i18n: {
      en: {
        title: 'Revisit monthly affiliate payments calculation',
        strategicObjective:
          'Make monthly affiliate payout calculations consistent, auditable, and aligned with current rules and edge-cases',
        problemSolved:
          'Current monthly payout calculation logic needs revision to reduce mismatches, rework, and disputes',
        expectedBusinessImpact:
          'Lower payout errors, faster monthly runs, clearer audit trail for partner disputes',
        kpiOrMetric: 'Payout Error Rate (PER), time to produce monthly payout, dispute count',
        taskBreakdown: [
          'Review current monthly payout logic and edge cases',
          'Align rules + tiers and define single source of truth',
          'Validate against agreed sample cases and historical months',
          'Ship updated calculation + report outputs',
        ],
        description:
          'Ongoing: revisiting the monthly affiliate payments calculation to ensure correctness and auditability. Next: confirm rules, validate samples, then ship updated logic.',
        summary: 'Rework monthly affiliate payout calculation.',
        notes: 'Status: executing. Focus on correctness + audit trail.',
      },
      it: {
        title: 'Rivisitazione calcolo pagamenti mensili affiliati',
        strategicObjective:
          'Rendere il calcolo payout affiliate mensile coerente, auditabile e allineato alle regole attuali',
        problemSolved:
          'La logica di calcolo dei pagamenti mensili richiede revisione per ridurre mismatch, rework e contestazioni',
        expectedBusinessImpact:
          'Meno errori payout, run mensile più veloce, audit trail chiaro per dispute con i partner',
        kpiOrMetric:
          'Tasso errori payout (PER), tempo produzione payout mensile, numero contestazioni',
        taskBreakdown: [
          'Rivedere logica attuale e casi limite',
          'Allineare regole + tier e definire single source of truth',
          'Validare su casi campione concordati e mesi storici',
          'Rilasciare calcolo aggiornato + output report',
        ],
        description:
          'Ongoing: revisione del calcolo dei pagamenti mensili affiliati per garantire correttezza e auditabilità. Prossimo step: confermare regole, validare campioni, poi rilasciare la logica aggiornata.',
        summary: 'Rework calcolo payout affiliate mensile.',
        notes: 'Status: executing. Focus su correttezza + audit trail.',
      },
    },
  },
  {
    id: 'pb_market_intel',
    strategicCategory: 'Retention & Monetization',
    impactLevel: 'Medium',
    owner: 'CRM & Automation',
    status: 'Review & QA',
    icon: 'broadcast',
    i18n: {
      en: {
        title: 'Automate Market Intelligence Distribution',
        strategicObjective:
          'Deliver personalized market insights to increase client engagement and retention',
        problemSolved:
          'Market analysis and news are distributed manually with inconsistent reach and timing',
        expectedBusinessImpact: '35% increase in client engagement, 20% reduction in churn rate',
        kpiOrMetric: 'Client engagement rate, content open rates, retention rate by segment',
        taskBreakdown: [
          'Demo calls completed with Autochartist and Trading Central (evaluation)',
          'Comparison email sent to the Board → await decision on tool selection',
          'Design content calendar for market analysis and news distribution',
          'Set up automated segmentation for personalized content delivery',
          'Integrate market data feeds for real-time insights',
          'Create A/B testing framework for content and messaging',
          'Implement engagement tracking and optimization loops',
        ],
        description:
          'Automate distribution of market analysis and news through WhatsApp and other messaging channels.\n\nObjectives:\n\nIncrease engagement\n\nImprove retention\n\nReduce manual workload\n\nStandardize communication quality\n\nIntegration with Solitics to be evaluated only after convrs.io setup is stable.',
        summary: 'Automated market insights and news via messaging channels.',
        notes:
          'Status: executing (evaluation phase). Demo calls completed with Autochartist and Trading Central. A comparison email has been sent to the Board; waiting for a decision on which tool to select. Next: once selected, define scope + integration approach and move into implementation planning.',
      },
      it: {
        title: 'Automatizzare la distribuzione di market intelligence',
        strategicObjective:
          'Inviare insight di mercato personalizzati per aumentare engagement e retention',
        problemSolved:
          'Analisi di mercato e news sono distribuite manualmente con copertura e timing incoerenti',
        expectedBusinessImpact: '+35% engagement cliente, -20% churn',
        kpiOrMetric: 'Tasso engagement, open rate contenuti, retention per segmento',
        taskBreakdown: [
          'Demo call completate con Autochartist e Trading Central (fase valutazione)',
          'Mail di comparazione inviata al Board → in attesa decisione sul tool da selezionare',
          'Progettare calendario contenuti per analisi e news',
          'Impostare segmentazione automatica per contenuti personalizzati',
          'Integrare feed dati di mercato per insight real-time',
          'Creare framework A/B test per contenuto e messaggi',
          'Implementare tracking engagement e loop di ottimizzazione',
        ],
        description:
          'Automatizzare la distribuzione di analisi di mercato e news tramite WhatsApp e altri canali di messaggistica.\n\nObiettivi:\n\nAumentare engagement\n\nMigliorare retention\n\nRidurre lavoro manuale\n\nStandardizzare la qualità della comunicazione\n\nValutare l’integrazione con Solitics solo dopo che convrs.io è stabile.',
        summary: 'Insight e news automatizzati via messaggistica.',
        notes:
          'Status: executing (fase valutazione). Demo call completate con Autochartist e Trading Central. Mail di comparazione inviata al Board; in attesa della decisione su quale tool selezionare. Prossimo step: una volta scelto, definire scope + approccio integrazione e passare al planning implementativo.',
      },
    },
  },
  {
    id: 'pb_ifx_expo_feb_2026',
    strategicCategory: 'Partnerships & Affiliates',
    impactLevel: 'Medium',
    owner: 'Marketing',
    status: 'Planned',
    icon: 'briefcase',
    i18n: {
      en: {
        title: 'IFX Expo — 10–12 February (2026)',
        strategicObjective:
          'Use IFX Expo to accelerate partnerships and business development through structured meetings and follow-ups',
        problemSolved:
          'Without a structured plan, expo attendance risks becoming untracked networking with low conversion into real pipeline',
        expectedBusinessImpact:
          'Increase qualified partner conversations, speed up BD cycles, and convert top meetings into actionable next steps',
        kpiOrMetric:
          'Number of meetings booked, qualified leads, follow-ups completed, partnerships progressed post-event',
        taskBreakdown: [
          'Confirm attendance logistics (passes, travel, agenda)',
          'Prepare pitch deck + one-pager + offer positioning',
          'Create target partner list and pre-book meetings (10–12 Feb)',
          'Meetings: Trading Central, Autochartist, Skale, Solitics, convrs.io',
          'Run meetings on-site and capture notes/next steps consistently',
          'Post-event follow-ups + pipeline tracking within 72h',
        ],
        description:
          'Plan and execute IFX Expo attendance during 10–12 February.\n\nPlanned meetings:\n\nTrading Central\n\nAutochartist\n\nSkale\n\nSolitics\n\nconvrs.io\n\nGoals:\n\nPartnership discovery\n\nBD meetings and introductions\n\nClear follow-up actions and pipeline tracking after the event.',
        summary: 'Expo plan + meetings + follow-up pipeline.',
        notes:
          'Status: planned. Event window: 10–12 February (IFX Expo). Meetings scheduled with Trading Central, Autochartist, Skale, Solitics, convrs.io.',
      },
      it: {
        title: 'IFX Expo — 10–12 Febbraio (2026)',
        strategicObjective:
          'Usare IFX Expo per accelerare partnership e sviluppo business con meeting pianificati e follow-up strutturati',
        problemSolved:
          'Senza un piano strutturato, la presenza in fiera rischia di rimanere networking non tracciato e con bassa conversione in pipeline',
        expectedBusinessImpact:
          'Aumentare conversazioni qualificate con partner, velocizzare cicli BD e trasformare i meeting migliori in next step concreti',
        kpiOrMetric:
          'Numero meeting prenotati, lead qualificati, follow-up completati, partnership avanzate post-evento',
        taskBreakdown: [
          'Confermare logistica (pass, viaggio, agenda)',
          'Preparare pitch deck + one-pager + posizionamento offerta',
          'Definire lista target e pre-book dei meeting (10–12 Feb)',
          'Meeting: Trading Central, Autochartist, Skale, Solitics, convrs.io',
          'Eseguire meeting on-site e tracciare note/next step in modo consistente',
          'Follow-up post-evento + tracking pipeline entro 72h',
        ],
        description:
          "Pianificare ed eseguire la presenza a IFX Expo dal 10 al 12 Febbraio.\n\nMeeting pianificati:\n\nTrading Central\n\nAutochartist\n\nSkale\n\nSolitics\n\nconvrs.io\n\nObiettivi:\n\nScouting partnership\n\nMeeting BD e introduzioni\n\nAzioni di follow-up chiare e tracking pipeline dopo l'evento.",
        summary: 'Piano expo + meeting + pipeline follow-up.',
        notes:
          'Status: planned. Finestra evento: 10–12 Febbraio (IFX Expo). Meeting pianificati con Trading Central, Autochartist, Skale, Solitics, convrs.io.',
      },
    },
  },
  {
    id: 'pb_outreach_opt',
    strategicCategory: 'Growth & Acquisition',
    impactLevel: 'Medium',
    owner: 'Sales',
    status: 'Backlog',
    icon: 'search',
    i18n: {
      en: {
        title: 'Optimize Outreach Performance and Conversion',
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
        notes: '',
      },
      it: {
        title: 'Ottimizzare performance e conversione dell’outreach',
        strategicObjective: 'Migliorare l’efficacia dell’outreach con ottimizzazione data-driven',
        problemSolved:
          'Le attività di outreach mancano di un framework sistematico di misurazione e ottimizzazione',
        expectedBusinessImpact: '+40% conversione outreach, +25% qualità lead',
        kpiOrMetric: 'Response rate, conversion rate, costo per lead qualificato',
        taskBreakdown: [
          'Implementare tracking completo per tutte le attività di outreach',
          'Analizzare performance attuali su canali e script',
          'A/B test su messaggi, timing e targeting',
          'Sviluppare modelli predittivi per lead scoring e priorità',
          'Creare loop di ottimizzazione automatizzati',
        ],
        description:
          'Review attività Kommo:\n\nVolume messaggi\n\nResponse rate\n\nQualità feedback\n\nImpatto conversione\n\nObiettivo:\n\nCapire performance reali\n\nOttimizzare script\n\nMigliorare targeting\n\nAumentare efficienza di conversione',
        summary: 'Misurare e ottimizzare l’outreach attuale.',
        notes: '',
      },
    },
  },
  {
    id: 'pb_withdraw_automation',
    strategicCategory: 'Operations & Compliance',
    impactLevel: 'High',
    owner: 'Payments & Compliance',
    status: 'Backlog',
    icon: 'payments',
    i18n: {
      en: {
        title: 'Implement Automated Withdrawal Systems',
        strategicObjective:
          'Eliminate manual withdrawal processing to improve client experience and operational efficiency',
        problemSolved:
          'Manual withdrawal processing creates delays, errors, and high operational costs',
        expectedBusinessImpact:
          '90% reduction in withdrawal processing time, 60% decrease in support tickets, major UX improvement',
        kpiOrMetric:
          'Average withdrawal processing time, support ticket volume, client satisfaction',
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
        notes: '',
      },
      it: {
        title: 'Implementare sistemi di prelievo automatizzati',
        strategicObjective:
          'Eliminare la gestione manuale dei prelievi per migliorare UX cliente ed efficienza operativa',
        problemSolved:
          'La gestione manuale dei prelievi crea ritardi, errori e alti costi operativi',
        expectedBusinessImpact:
          '-90% tempo di processing prelievi, -60% ticket supporto, grande miglioramento UX',
        kpiOrMetric:
          'Tempo medio processing prelievi, volume ticket supporto, soddisfazione cliente',
        taskBreakdown: [
          'Selezionare e integrare provider prelievi carta (BridgerPay + SolidPayments)',
          'Implementare prelievo carta istantaneo',
          'Impostare automazione prelievi crypto (Skale + Uniwire)',
          'Creare procedure complete di test e failover',
          'Definire comunicazione cliente e processi supporto per prelievi automatizzati',
        ],
        description:
          'Implementare prelievi automatizzati:\n\nPrelievi carta — BridgerPay + SolidPayments\n\nAccredito istantaneo ai clienti\n\nZero fee bancarie\n\nForte miglioramento UX\n\nRiduzione significativa carico support\n\nPrelievi crypto — Skale + Uniwire\n\nPagamenti istantanei\n\nEnorme efficienza operativa\n\nGrande risparmio di tempo per support e finance\n\nPriorità must-have / deal-breaker.',
        summary: 'Automazione completa prelievi carta e crypto.',
        notes: '',
      },
    },
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
    color: '#64748b',
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
            Backlog: t('tasksBoard.status.backlog'),
            Planned: t('tasksBoard.status.planned'),
            Executing: t('tasksBoard.status.executing'),
            'Review & QA': t('tasksBoard.status.reviewQa'),
            Blocked: t('tasksBoard.status.blocked'),
            Done: t('tasksBoard.status.done'),
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
