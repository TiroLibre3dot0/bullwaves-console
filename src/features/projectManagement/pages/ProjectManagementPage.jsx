import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getPublicShareOrigin } from '../../../utils/publicShareOrigin'

const PH_AGENTS = [
  {
    id: 1,
    name: 'Agent 1',
    color: '#3b82f6',
    light: '#eff6ff',
    role: 'Night Coverage',
    weeklyHours: 45,
    schedule: {
      mon: { s: 19, e: 28 },
      tue: { s: 19, e: 28 },
      wed: { s: 19, e: 28 },
      thu: { s: 19, e: 28 },
      fri: null,
      sat: null,
      sun: { s: 19, e: 28 },
    },
  },
  {
    id: 2,
    name: 'Agent 2',
    color: '#059669',
    light: '#ecfdf5',
    role: 'Early Morning Coverage',
    weeklyHours: 45,
    schedule: {
      mon: { s: 4, e: 13 },
      tue: { s: 4, e: 13 },
      wed: { s: 4, e: 13 },
      thu: { s: 4, e: 13 },
      fri: { s: 4, e: 13 },
      sat: null,
      sun: null,
    },
  },
  {
    id: 3,
    name: 'Agent 3',
    color: '#d97706',
    light: '#fffbeb',
    role: 'Main Business Hours',
    weeklyHours: 45,
    schedule: {
      mon: { s: 10, e: 19 },
      tue: { s: 10, e: 19 },
      wed: { s: 10, e: 19 },
      thu: { s: 10, e: 19 },
      fri: { s: 10, e: 19 },
      sat: null,
      sun: { s: 10, e: 19 },
    },
  },
  {
    id: 4,
    name: 'Agent 4',
    color: '#7c3aed',
    light: '#f5f3ff',
    role: 'Night Coverage (Tue-Sat)',
    weeklyHours: 45,
    schedule: {
      mon: null,
      tue: { s: 19, e: 28 },
      wed: { s: 19, e: 28 },
      thu: { s: 19, e: 28 },
      fri: { s: 19, e: 28 },
      sat: { s: 19, e: 28 },
      sun: null,
    },
  },
  {
    id: 5,
    name: 'Agent 5',
    color: '#dc2626',
    light: '#fef2f2',
    role: 'Day Coverage (Mon-Sat)',
    weeklyHours: 45,
    schedule: {
      mon: { s: 10, e: 19 },
      tue: { s: 10, e: 19 },
      wed: { s: 10, e: 19 },
      thu: { s: 10, e: 19 },
      fri: { s: 10, e: 19 },
      sat: { s: 10, e: 19 },
      sun: null,
    },
  },
]
const PH_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const PH_DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PH_GRID_START = 4
const PH_GRID_END = 22
const PH_HOUR_PX = 32
const PH_GRID_HEIGHT = (PH_GRID_END - PH_GRID_START) * PH_HOUR_PX

function phShiftPos(shift) {
  if (!shift) return null
  const s = Math.max(shift.s, PH_GRID_START)
  const e = Math.min(shift.e, PH_GRID_END)
  if (e <= s) return null
  return {
    topPx: (s - PH_GRID_START) * PH_HOUR_PX,
    heightPx: (e - s) * PH_HOUR_PX,
    clipped: shift.e > PH_GRID_END,
    startLabel: `${String(shift.s % 24).padStart(2, '0')}:00`,
    endLabel: `${String(shift.e % 24).padStart(2, '0')}:00`,
  }
}

function phCoverageAt(day, hour) {
  return PH_AGENTS.filter((a) => {
    const sh = a.schedule[day]
    return sh != null && hour >= sh.s && hour < sh.e
  }).length
}

function phHeatColor(count) {
  if (count === 0) return '#fca5a5'
  if (count === 1) return '#fde68a'
  if (count === 2) return '#86efac'
  return '#22c55e'
}

function formatHourLabel(hour24) {
  const normalized = ((hour24 % 24) + 24) % 24
  return `${String(normalized).padStart(2, '0')}:00`
}

const SECTION_ORDER = ['Infrastructure', 'Branding', 'Mobile App', 'Compliance', 'Launch']
const GMAIL_SKALE_QUERIES = [
  'from:support@skalecrm.com',
  'to:support@skalecrm.com',
  'label:SKALE',
  'skalecrm.com',
  'subject:"Skale CRM Support [Case"',
  'subject:"Case "',
]

const SKALE_TICKET_STATUS_META = {
  open: { label: 'Open', bg: '#22c55e', color: '#ffffff', border: '#16a34a' },
  awaitingYourReply: {
    label: 'Awaiting your reply',
    bg: '#f97316',
    color: '#ffffff',
    border: '#ea580c',
  },
  solved: { label: 'Solved', bg: '#2563eb', color: '#ffffff', border: '#1d4ed8' },
  unknown: { label: 'Unknown', bg: '#6b7280', color: '#ffffff', border: '#4b5563' },
}

const SKALE_TICKET_STATUS_ORDER = {
  open: 0,
  awaitingYourReply: 1,
  solved: 2,
  unknown: 3,
}

const SKALE_STATUS_OVERRIDES_BY_TICKET = {
  33490: 'solved',
  33491: 'solved',
  33493: 'solved',
  33498: 'solved',
  33506: 'solved',
  33604: 'solved',
  33685: 'solved',
  33715: 'solved',
  33782: 'open',
  33816: 'open',
  33823: 'solved',
  33850: 'solved',
  33881: 'solved',
  33904: 'solved',
  33912: 'open',
  33944: 'solved',
  33992: 'solved',
  34008: 'open',
  34014: 'solved',
  34028: 'solved',
  34047: 'open',
  34056: 'open',
  34058: 'solved',
  34078: 'solved',
  34084: 'solved',
  34100: 'solved',
  34112: 'solved',
  34142: 'open',
  34157: 'solved',
  34190: 'open',
  34199: 'solved',
  34201: 'solved',
  34223: 'solved',
  34261: 'open',
  34267: 'solved',
  34272: 'open',
  34301: 'solved',
  34302: 'solved',
  34303: 'solved',
  34304: 'open',
}

const PROJECT_STATUS_META = {
  planning: { label: 'Planning', bg: '#f1f5f9', color: '#334155', border: '#d7dee7' },
  inProgress: { label: 'In Progress', bg: '#eaf2ff', color: '#1f4ea3', border: '#bfd4ff' },
  waitingExternalAction: {
    label: 'Waiting External Action',
    bg: '#fff4e8',
    color: '#9a5200',
    border: '#ffd5a6',
  },
  blocked: { label: 'Blocked', bg: '#fdecec', color: '#b42318', border: '#f8c9c9' },
  completed: { label: 'Completed', bg: '#e9f9ef', color: '#166534', border: '#b9e7c8' },
}

const TASK_STATUS_META = {
  todo: { label: 'Todo', bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' },
  inProgress: { label: 'In Progress', bg: '#eaf2ff', color: '#1d4ed8', border: '#c7d7fe' },
  done: { label: 'Done', bg: '#ecfdf3', color: '#15803d', border: '#c7f2d4' },
  blocked: { label: 'Blocked', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
}

const TASK_STATUS_ORDER = {
  todo: 0,
  inProgress: 1,
  done: 2,
  blocked: 3,
}

const BASE_PROJECTS = [
  {
    id: 'pelican-network-integration',
    title: 'Pelican network integration',
    summary: 'Integration and app-store readiness stream.',
    status: 'inProgress',
    lastUpdated: '2026-06-01',
    theme: {
      cardBg: '#d9efff',
      cardBorder: '#74bdf2',
      cardAccent: '#085b91',
    },
    tasks: [
      {
        id: 'plcn-001',
        title: 'Whitelist all Pelican infrastructure IP addresses (DCS list)',
        status: 'inProgress',
        owner: 'Pelican',
        dueDate: '2026-06-03',
        section: 'Infrastructure',
      },
      {
        id: 'plcn-002',
        title:
          'MT5 data package received from Chris: Server BullWaves - LIVE, Domain mt-api.bullwaves.com, Public endpoints 83.136.181.190:443, 81.17.120.222:443, 185.169.2.79:443',
        status: 'done',
        owner: 'Chris',
        dueDate: '2026-06-04',
        section: 'Infrastructure',
      },
      {
        id: 'plcn-003',
        title:
          'Manager supervise/accountant credentials received: Login 1301, Password PvO@GuT6@2MbPqCz',
        status: 'done',
        owner: 'Chris',
        dueDate: '2026-06-04',
        section: 'Infrastructure',
      },
      {
        id: 'plcn-015',
        title: 'Create the Manager\\Administrator_Pelican admin manager group',
        status: 'todo',
        owner: 'Bullwaves',
        section: 'Infrastructure',
      },
      {
        id: 'plcn-016',
        title:
          'Configure Manager\\Administrator_Pelican: hedging risk management, tradable symbols only, and risk warning off',
        status: 'todo',
        owner: 'Bullwaves',
        section: 'Infrastructure',
      },
      {
        id: 'plcn-017',
        title: 'Add MT5 Manager permissions and the Pelican IP Access List for supervision access',
        status: 'todo',
        owner: 'Bullwaves',
        section: 'Infrastructure',
      },
      {
        id: 'plcn-018',
        title:
          'Apply real-group settings: hedging accounting, warning window off, and Expert Advisor trading enabled',
        status: 'todo',
        owner: 'Bullwaves',
        section: 'Infrastructure',
      },
      {
        id: 'plcn-004',
        title: 'Prepare splash and login logos (SVG + PNG)',
        status: 'done',
        owner: 'Marketing',
        section: 'Branding',
      },
      {
        id: 'plcn-005',
        title: 'Provide login wallpaper in 19.5:9 format',
        status: 'done',
        owner: 'Marketing',
        section: 'Branding',
      },
      {
        id: 'plcn-006',
        title: 'Share brand color palette and style sheet',
        status: 'done',
        owner: 'Marketing',
        section: 'Branding',
      },
      {
        id: 'plcn-007',
        title: 'Provide 10 test accounts on each server',
        status: 'todo',
        owner: 'Pelican',
        section: 'Mobile App',
      },
      {
        id: 'plcn-008',
        title:
          'Access Apple Developer account (filippo.derosa@moonance.com) and invite Pelican admin with Admin rights',
        status: 'done',
        owner: 'Bullwaves',
        section: 'Mobile App',
      },
      {
        id: 'plcn-009',
        title: 'Apple Developer Program membership renewed and paid',
        status: 'done',
        owner: 'Bullwaves',
        section: 'Mobile App',
      },
      {
        id: 'plcn-019',
        title:
          'Issue Apple app certificate, distribution profile, and APNS key (after admin access validation)',
        status: 'todo',
        owner: 'Bullwaves',
        section: 'Mobile App',
      },
      {
        id: 'plcn-010',
        title:
          'Test funded account received: Login 300200, Password !s7aDfKqI_U7QwAc. MT5 version/build information confirmed by Chris',
        status: 'done',
        owner: 'Chris',
        section: 'Mobile App',
      },
      {
        id: 'plcn-011',
        title:
          'MT5 compatibility sheet completed: Version MT5, Build 5660, Live Update Disabled, Last update Mid-April, Update frequency every 1-2 months, Next update before end of June',
        status: 'done',
        owner: 'Bullwaves',
        section: 'Compliance',
      },
      {
        id: 'plcn-012',
        title: 'Prepare Play Store screenshots for mobile and tablets',
        status: 'done',
        owner: 'Marketing',
        section: 'Launch',
      },
      {
        id: 'plcn-020',
        title: 'Create Google Play Console account and grant required Pelican support/admin access',
        status: 'todo',
        owner: 'Bullwaves',
        section: 'Launch',
      },
      {
        id: 'plcn-013',
        title: 'Prepare Play Store feature graphic',
        status: 'done',
        owner: 'Marketing',
        section: 'Launch',
      },
      {
        id: 'plcn-021',
        title: 'Prepare iOS App Store screenshot sets (6.5in, 6.7in, 5.5in, iPad 12.9in)',
        status: 'todo',
        owner: 'Marketing',
        section: 'Launch',
      },
      {
        id: 'plcn-022',
        title: 'Provide store icon assets: iOS 1024x1024 and Android 512x512',
        status: 'todo',
        owner: 'Marketing',
        section: 'Launch',
      },
      {
        id: 'plcn-023',
        title:
          'Provide internal links and PM contact package (create account URL, support contacts, direct line)',
        status: 'todo',
        owner: 'Bullwaves',
        section: 'Launch',
      },
      {
        id: 'plcn-014',
        title: 'Kickoff meeting completed',
        status: 'done',
        owner: 'Bullwaves',
        section: 'Launch',
      },
    ],
  },
  {
    id: 'fxbo',
    title: 'FXBO',
    summary: 'Back-office onboarding and configuration.',
    status: 'planning',
    lastUpdated: '2026-06-01',
    theme: {
      cardBg: '#dcf7e5',
      cardBorder: '#79d39a',
      cardAccent: '#166534',
    },
    tasks: [
      {
        id: 'fxbo-001',
        title: 'Collect FXBO environment access and credentials',
        status: 'todo',
        owner: 'FXBO Team',
        section: 'Infrastructure',
      },
      {
        id: 'fxbo-002',
        title: 'Define account mapping and lifecycle states',
        status: 'inProgress',
        owner: 'Bullwaves',
        section: 'Compliance',
      },
      {
        id: 'fxbo-003',
        title: 'Plan go-live checklist and owner approvals',
        status: 'todo',
        owner: 'FXBO Team',
        section: 'Launch',
      },
      {
        id: 'fxbo-004',
        title: 'Technical kickoff completed',
        status: 'done',
        owner: 'Bullwaves',
        section: 'Launch',
      },
    ],
  },
  {
    id: 'trading-competition',
    title: 'Trading Competition',
    summary: 'Competition flow and leaderboard rollout.',
    status: 'inProgress',
    lastUpdated: '2026-06-01',
    theme: {
      cardBg: '#e2dcff',
      cardBorder: '#a792ff',
      cardAccent: '#4c1d95',
    },
    tasks: [
      {
        id: 'tc-001',
        title: 'Finalize competition rules and scoring model',
        status: 'inProgress',
        owner: 'Marketing',
        section: 'Compliance',
      },
      {
        id: 'tc-002',
        title: 'Prepare campaign creatives and public assets',
        status: 'todo',
        owner: 'Design Team',
        section: 'Branding',
      },
      {
        id: 'tc-003',
        title: 'Validate leaderboard refresh cadence',
        status: 'blocked',
        owner: 'Tech Team',
        section: 'Infrastructure',
      },
      {
        id: 'tc-004',
        title: 'Competition launch plan approved',
        status: 'done',
        owner: 'Bullwaves',
        section: 'Launch',
      },
    ],
  },
  {
    id: 'ph-team-new-schedule',
    title: 'PH Team New schedule',
    summary: 'Shift redesign and handover alignment.',
    status: 'waitingExternalAction',
    lastUpdated: '2026-05-31',
    theme: {
      cardBg: '#ffe7d3',
      cardBorder: '#ffb87d',
      cardAccent: '#9a3412',
    },
    tasks: [
      {
        id: 'phs-001',
        title: 'Collect current shift availability from PH team',
        status: 'inProgress',
        owner: 'PH Team',
        section: 'Infrastructure',
      },
      {
        id: 'phs-002',
        title: 'Define final rota draft and overlap rules',
        status: 'todo',
        owner: 'Operations',
        section: 'Compliance',
      },
      {
        id: 'phs-003',
        title: 'Confirm schedule sign-off from external stakeholders',
        status: 'blocked',
        owner: 'External Partner',
        section: 'Launch',
      },
    ],
  },
  {
    id: 'new-marketing-strategy',
    title: 'New Marketing Strategy',
    summary:
      'Revive the Customer.io initiative for transactional + marketing emails across YourPropFirm and FXBO.',
    status: 'inProgress',
    lastUpdated: '2026-06-03',
    theme: {
      cardBg: '#e7f5ff',
      cardBorder: '#8ecdf5',
      cardAccent: '#0b5f8a',
    },
    tasks: [
      {
        id: 'nms-001',
        title: 'Re-open the paused evaluation with Customer.io based on previous October notes',
        status: 'done',
        owner: 'Filippo',
        section: 'Launch',
      },
      {
        id: 'nms-002',
        title: 'Book and run discovery call with Chris to align on complex migration constraints',
        status: 'todo',
        owner: 'Filippo',
        section: 'Launch',
      },
      {
        id: 'nms-003',
        title: 'Define full requirements for transactional emails and lifecycle email marketing',
        status: 'inProgress',
        owner: 'Marketing',
        section: 'Compliance',
      },
      {
        id: 'nms-004',
        title:
          'Map current tooling per CRM (Stopchurn, SendGrid, AWS) and identify deprecation risks',
        status: 'todo',
        owner: 'Tech Team',
        section: 'Infrastructure',
      },
      {
        id: 'nms-005',
        title: 'Define migration plan for both CRMs (YourPropFirm and FXBO) with phased rollout',
        status: 'todo',
        owner: 'Bullwaves',
        section: 'Infrastructure',
      },
      {
        id: 'nms-006',
        title: 'Prepare KPI dashboard for deliverability, open rate, conversion and retention lift',
        status: 'todo',
        owner: 'Data Team',
        section: 'Launch',
      },
    ],
  },
  {
    id: 'ai-call-system',
    title: 'AI Call System',
    summary:
      'Activation stream for the AI call system with payment execution, account setup, and rollout readiness.',
    status: 'inProgress',
    lastUpdated: '2026-06-09',
    theme: {
      cardBg: '#ecfeff',
      cardBorder: '#67e8f9',
      cardAccent: '#0e7490',
    },
    tasks: [
      {
        id: 'aic-001',
        title: 'Confirm payment route with Finance: wire transfer selected over PayPal',
        status: 'done',
        owner: 'Rodoula Xenofontos',
        section: 'Compliance',
      },
      {
        id: 'aic-002',
        title: 'Collect complete wire transfer beneficiary details from provider (Ofekai / Yaniv)',
        status: 'inProgress',
        owner: 'Paolo V',
        section: 'Infrastructure',
      },
      {
        id: 'aic-003',
        title: 'Execute activation payment (€200) and receive account activation confirmation',
        status: 'todo',
        owner: 'Finance Team',
        section: 'Launch',
      },
      {
        id: 'aic-004',
        title: 'Set monthly subscription control (€100 fixed) and assign recurring payment owner',
        status: 'todo',
        owner: 'Finance Team',
        section: 'Compliance',
      },
      {
        id: 'aic-005',
        title:
          'Run AI call system kickoff and define first-week success checks with affiliate team',
        status: 'todo',
        owner: 'Paolo V',
        section: 'Launch',
      },
    ],
  },
  {
    id: 'dmo-leaderboard',
    title: 'DMO Leaderboard',
    summary: 'Leaderboard rollout planning and execution.',
    status: 'planning',
    lastUpdated: '2026-06-08',
    theme: {
      cardBg: '#e8f6ef',
      cardBorder: '#9fd8bb',
      cardAccent: '#1f7a4f',
    },
    tasks: [],
  },
  {
    id: 'affiliate-report-stefan-jun8',
    title: 'Affiliate Report - Stefan Call',
    summary:
      'Operational affiliate reporting stream aligned on redeposit, withdrawal, LTV, and Cell Expert commission source.',
    status: 'inProgress',
    lastUpdated: '2026-06-08',
    theme: {
      cardBg: '#e8f4ff',
      cardBorder: '#99c4f4',
      cardAccent: '#1b4f8a',
    },
    tasks: [
      {
        id: 'afr-001',
        title:
          'Build Affiliate Performance Report with redeposit ratio, withdrawal ratio, player lifetime value, and commission per client',
        status: 'todo',
        owner: 'Paolo V',
        section: 'Launch',
      },
      {
        id: 'afr-002',
        title: 'Use Cell Expert as primary commission data source for payout-accurate reporting',
        status: 'inProgress',
        owner: 'Paolo V',
        section: 'Infrastructure',
      },
      {
        id: 'afr-003',
        title:
          'Run report review with Stefan to validate data quality and define required Creolabs modifications',
        status: 'todo',
        owner: 'Paolo V, Stefan Popovski',
        section: 'Compliance',
      },
      {
        id: 'afr-004',
        title: 'Provide Stefan access credentials to live dashboard for monitoring',
        status: 'todo',
        owner: 'Paolo V',
        section: 'Launch',
      },
      {
        id: 'afr-005',
        title: 'Upgrade weekly Board Snapshot to include customer lifetime value metrics',
        status: 'todo',
        owner: 'Paolo V',
        section: 'Launch',
      },
      {
        id: 'afr-006',
        title: 'Define affiliate manager access model for Crayolabs custom performance dashboards',
        status: 'todo',
        owner: 'Paolo V',
        section: 'Compliance',
      },
    ],
  },
  {
    id: 'marketing-campaign',
    title: 'Marketing Campaign',
    summary: 'Execution timeline and partner deliverables.',
    status: 'planning',
    lastUpdated: '2026-05-30',
    theme: {
      cardBg: '#eadcff',
      cardBorder: '#b899ff',
      cardAccent: '#6d28d9',
    },
    tasks: [
      {
        id: 'mkt-001',
        title: 'Approve campaign messaging and CTA set',
        status: 'todo',
        owner: 'Marketing',
        section: 'Branding',
      },
      {
        id: 'mkt-002',
        title: 'Set channel publishing calendar',
        status: 'todo',
        owner: 'Marketing',
        section: 'Launch',
      },
      {
        id: 'mkt-003',
        title: 'Align campaign measurement framework',
        status: 'inProgress',
        owner: 'Data Team',
        section: 'Launch',
      },
    ],
  },
]

function formatDateLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function toEpoch(value) {
  const date = new Date(value)
  const stamp = date.getTime()
  return Number.isNaN(stamp) ? 0 : stamp
}

function extractTicketNumbers(subject) {
  const text = String(subject || '').trim()
  if (!text) return []

  const out = new Set()

  const caseMatches = text.matchAll(/\bcase\s*#?\s*([0-9]{4,})\b/gi)
  for (const match of caseMatches) {
    if (match?.[1]) out.add(match[1])
  }

  const ticketMatches = text.matchAll(/\bticket\s*#?\s*([0-9]{4,})\b/gi)
  for (const match of ticketMatches) {
    if (match?.[1]) out.add(match[1])
  }

  const hashMatches = text.matchAll(/#\s*([0-9]{4,})\b/g)
  for (const match of hashMatches) {
    if (match?.[1]) out.add(match[1])
  }

  return [...out]
}

function inferSkaleTicketStatus(message) {
  const probe = `${String(message?.subject || '')} ${String(message?.snippet || '')}`.toLowerCase()

  if (/awaiting\s+your\s+reply|awaiting\s+your\s+response|reply\s+required/.test(probe)) {
    return 'awaitingYourReply'
  }

  if (/marked\s+as\s+solved|has\s+been\s+solved|status\s+.*\bsolved\b|\bsolved\b/.test(probe)) {
    return 'solved'
  }

  if (/\bopen\b|ticket\s+opening\s+request|new\s+request/.test(probe)) {
    return 'open'
  }

  return 'unknown'
}

function getSkaleStatusMeta(status) {
  return SKALE_TICKET_STATUS_META[status] || SKALE_TICKET_STATUS_META.unknown
}

function countByStatus(tasks, status) {
  return tasks.filter((task) => task.status === status).length
}

function sortTasksByStatus(tasks) {
  return [...tasks].sort((a, b) => {
    const aOrder = TASK_STATUS_ORDER[a.status] ?? 99
    const bOrder = TASK_STATUS_ORDER[b.status] ?? 99
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.title.localeCompare(b.title)
  })
}

export default function ProjectManagementPage() {
  const { user } = useAuth()
  const [activeSubsection, setActiveSubsection] = useState('projectManagement')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [detailReady, setDetailReady] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleView, setScheduleView] = useState('calendar')
  const [hoveredShift, setHoveredShift] = useState(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [calendarScrollTop, setCalendarScrollTop] = useState(0)
  const [gmailTopicsState, setGmailTopicsState] = useState({
    loading: false,
    error: '',
    scannedAt: '',
    messagesScanned: 0,
    skaleTickets: [],
  })

  const viewerEmail = String(user?.email || '')
    .trim()
    .toLowerCase()
  const requestViewerHeaders = useMemo(
    () => (viewerEmail ? { 'x-bullwaves-user-email': viewerEmail } : {}),
    [viewerEmail]
  )
  const calendarGridRef = useRef(null)
  const phCoverageShareUrl = useMemo(() => {
    const origin = getPublicShareOrigin()
    return origin
      ? `${origin}/share/project-management/ph-team-new-schedule`
      : '/share/project-management/ph-team-new-schedule'
  }, [])
  const currentFocusHour = useMemo(() => {
    const offsetHours = Math.floor(calendarScrollTop / PH_HOUR_PX)
    const h = Math.min(PH_GRID_END - 1, Math.max(PH_GRID_START, PH_GRID_START + offsetHours))
    return formatHourLabel(h)
  }, [calendarScrollTop])

  const activeProject = useMemo(() => {
    if (!activeProjectId) return null
    return BASE_PROJECTS.find((project) => project.id === activeProjectId) || null
  }, [activeProjectId])

  const activeTasks = activeProject?.tasks || []
  const isPhScheduleProject = activeProject?.id === 'ph-team-new-schedule'
  const totalTasks = activeTasks.length
  const doneTasks = countByStatus(activeTasks, 'done')
  const todoTasks = countByStatus(activeTasks, 'todo')
  const inProgressTasks = countByStatus(activeTasks, 'inProgress')
  const overallProgress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  const groupedTasks = useMemo(() => {
    const grouped = {}
    SECTION_ORDER.forEach((section) => {
      grouped[section] = []
    })
    activeTasks.forEach((task) => {
      const key = SECTION_ORDER.includes(task.section) ? task.section : 'Launch'
      grouped[key].push(task)
    })

    SECTION_ORDER.forEach((section) => {
      grouped[section] = sortTasksByStatus(grouped[section])
    })

    return grouped
  }, [activeTasks])

  const gmailTicketStatusSummary = useMemo(() => {
    const counters = {
      open: 0,
      awaitingYourReply: 0,
      solved: 0,
      unknown: 0,
    }

    for (const ticket of gmailTopicsState.skaleTickets || []) {
      const key = Object.prototype.hasOwnProperty.call(counters, ticket?.status)
        ? ticket.status
        : 'unknown'
      counters[key] += 1
    }

    return {
      total: (gmailTopicsState.skaleTickets || []).length,
      items: [
        { key: 'open', count: counters.open },
        { key: 'awaitingYourReply', count: counters.awaitingYourReply },
        { key: 'solved', count: counters.solved },
        { key: 'unknown', count: counters.unknown },
      ],
    }
  }, [gmailTopicsState.skaleTickets])

  useEffect(() => {
    if (!activeProjectId) return
    const nextState = {}
    SECTION_ORDER.forEach((section) => {
      nextState[section] = false
    })
    setCollapsedSections(nextState)
  }, [activeProjectId])

  useEffect(() => {
    if (!activeProjectId) {
      setDetailReady(false)
      setShowScheduleModal(false)
      setScheduleView('calendar')
      setHoveredShift(null)
      setShareCopied(false)
      setCalendarScrollTop(0)
      return
    }

    setDetailReady(false)
    let raf = 0
    raf = window.requestAnimationFrame(() => {
      setDetailReady(true)
    })

    return () => {
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [activeProjectId])

  useEffect(() => {
    if (activeSubsection !== 'gmail') return

    if (!viewerEmail) {
      setGmailTopicsState((prev) => ({
        ...prev,
        loading: false,
        error: 'User session unavailable. Unable to query Gmail topics.',
      }))
      return
    }

    let cancelled = false

    async function fetchAllMessagesForQuery(query) {
      const pages = []
      let nextPageToken = ''
      let guard = 0

      while (guard < 20) {
        const params = new window.URLSearchParams({
          maxResults: '50',
          q: query,
        })
        if (nextPageToken) params.set('pageToken', nextPageToken)

        const response = await fetch(`/api/gmail/messages?${params.toString()}`, {
          cache: 'no-store',
          headers: requestViewerHeaders,
        })
        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.ok) break

        const messages = Array.isArray(data.messages) ? data.messages : []
        pages.push(...messages)

        const token = String(data.nextPageToken || '').trim()
        if (!token) break
        nextPageToken = token
        guard += 1
      }

      return pages
    }

    async function loadGmailSkaleTickets() {
      setGmailTopicsState((prev) => ({
        ...prev,
        loading: true,
        error: '',
      }))

      try {
        const byMessageId = new Map()

        for (const query of GMAIL_SKALE_QUERIES) {
          const messages = await fetchAllMessagesForQuery(query)
          for (const message of messages) {
            if (!message?.id) continue
            const existing = byMessageId.get(message.id)
            if (!existing) {
              byMessageId.set(message.id, {
                ...message,
                _sources: [query],
              })
              continue
            }

            if (!existing._sources.includes(query)) existing._sources.push(query)
          }
        }

        const ticketsByNumber = new Map()
        for (const message of byMessageId.values()) {
          const ticketNumbers = extractTicketNumbers(message.subject)
          if (!ticketNumbers.length) continue

          for (const ticketNumber of ticketNumbers) {
            const existing = ticketsByNumber.get(ticketNumber)
            if (!existing) {
              const inferredStatus =
                SKALE_STATUS_OVERRIDES_BY_TICKET[ticketNumber] || inferSkaleTicketStatus(message)
              ticketsByNumber.set(ticketNumber, {
                ticketNumber,
                subject: String(message.subject || '').trim() || 'No subject',
                date: message.date || null,
                from: String(message.from || '').trim() || 'Unknown sender',
                status: inferredStatus,
                sources: Array.isArray(message._sources) ? [...message._sources] : [],
              })
              continue
            }

            const inferredStatus =
              SKALE_STATUS_OVERRIDES_BY_TICKET[ticketNumber] || inferSkaleTicketStatus(message)
            if (toEpoch(message.date) > toEpoch(existing.date)) {
              existing.subject = String(message.subject || '').trim() || existing.subject
              existing.date = message.date || existing.date
              existing.from = String(message.from || '').trim() || existing.from
              existing.status = inferredStatus
            } else if (existing.status === 'unknown' && inferredStatus !== 'unknown') {
              existing.status = inferredStatus
            }

            for (const source of message._sources || []) {
              if (!existing.sources.includes(source)) existing.sources.push(source)
            }
          }
        }

        const skaleTickets = [...ticketsByNumber.values()].sort((left, right) => {
          const leftOrder = SKALE_TICKET_STATUS_ORDER[left.status] ?? 99
          const rightOrder = SKALE_TICKET_STATUS_ORDER[right.status] ?? 99
          if (leftOrder !== rightOrder) return leftOrder - rightOrder
          return Number(right.ticketNumber) - Number(left.ticketNumber)
        })

        if (cancelled) return
        setGmailTopicsState({
          loading: false,
          error: '',
          scannedAt: new Date().toISOString(),
          messagesScanned: byMessageId.size,
          skaleTickets,
        })
      } catch (error) {
        if (cancelled) return
        setGmailTopicsState((prev) => ({
          ...prev,
          loading: false,
          error: error?.message || 'Failed to load Gmail topic data.',
        }))
      }
    }

    loadGmailSkaleTickets()

    return () => {
      cancelled = true
    }
  }, [activeSubsection, requestViewerHeaders, viewerEmail])

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div
      style={{
        height: '100%',
        padding: 24,
        borderRadius: 24,
        background:
          'radial-gradient(circle at top left, rgba(226,240,255,0.9) 0%, rgba(255,255,255,0) 32%), linear-gradient(180deg, #f8fbff 0%, #ffffff 38%)',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'grid',
          gap: 6,
          padding: '2px 2px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: 4 }}>
            <h1 style={{ margin: 0, fontSize: 36, lineHeight: 1.02, letterSpacing: '-0.04em' }}>
              Project management
            </h1>
          </div>
        </div>
      </header>

      <div
        style={{
          display: 'inline-flex',
          gap: 8,
          flexWrap: 'wrap',
          alignSelf: 'start',
          padding: 6,
          borderRadius: 999,
          border: '1px solid rgba(148,163,184,0.2)',
          background: 'rgba(255,255,255,0.78)',
          boxShadow: '0 14px 32px rgba(15,23,42,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveSubsection('projectManagement')
            setActiveProjectId(null)
          }}
          style={{
            border:
              activeSubsection === 'projectManagement'
                ? '1px solid #1f4ea3'
                : '1px solid transparent',
            background:
              activeSubsection === 'projectManagement'
                ? 'linear-gradient(180deg, #0f4c81 0%, #153b66 100%)'
                : 'transparent',
            color: activeSubsection === 'projectManagement' ? '#ffffff' : '#415468',
            borderRadius: 999,
            padding: '9px 14px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            boxShadow:
              activeSubsection === 'projectManagement'
                ? '0 10px 22px rgba(15,76,129,0.26)'
                : 'none',
          }}
        >
          Project management
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubsection('gmail')
            setActiveProjectId(null)
          }}
          style={{
            border: activeSubsection === 'gmail' ? '1px solid #1f4ea3' : '1px solid transparent',
            background:
              activeSubsection === 'gmail'
                ? 'linear-gradient(180deg, #0f4c81 0%, #153b66 100%)'
                : 'transparent',
            color: activeSubsection === 'gmail' ? '#ffffff' : '#415468',
            borderRadius: 999,
            padding: '9px 14px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.01em',
            cursor: 'pointer',
            boxShadow: activeSubsection === 'gmail' ? '0 10px 22px rgba(15,76,129,0.26)' : 'none',
          }}
        >
          Gmail
        </button>
      </div>

      {activeSubsection === 'projectManagement' && !activeProject ? (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 12,
              paddingBottom: 14,
            }}
          >
            {BASE_PROJECTS.map((project) => {
              const total = project.tasks.length
              const statusMeta = PROJECT_STATUS_META[project.status] || PROJECT_STATUS_META.planning

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setActiveProjectId(project.id)}
                  style={{
                    textAlign: 'left',
                    borderRadius: 26,
                    border: `1px solid ${project.theme.cardBorder}`,
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,250,252,0.96) 100%)',
                    padding: 13,
                    cursor: 'pointer',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                    boxShadow: '0 14px 28px rgba(15,23,42,0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: '0 auto 0 0',
                      width: 8,
                      background: `linear-gradient(180deg, ${project.theme.cardAccent} 0%, ${project.theme.cardBorder} 100%)`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: -26,
                      right: -18,
                      width: 118,
                      height: 118,
                      borderRadius: 999,
                      background: `${project.theme.cardBg}`,
                      opacity: 0.55,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        maxWidth: '100%',
                        minHeight: 36,
                        borderRadius: 999,
                        background: project.theme.cardAccent,
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '6px 11px',
                        letterSpacing: '0.04em',
                        boxShadow: '0 10px 20px rgba(15,23,42,0.14)',
                        lineHeight: 1.15,
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      {project.title}
                    </div>
                    <p
                      style={{
                        margin: '10px 0 0',
                        minHeight: 44,
                        fontSize: 12,
                        color: '#314456',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      {project.summary}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gap: 8, position: 'relative', zIndex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: 999,
                          border: `1px solid ${statusMeta.border}`,
                          background: statusMeta.bg,
                          color: statusMeta.color,
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '4px 8px',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {statusMeta.label}
                      </div>

                      <div style={{ fontSize: 10, color: '#64748b', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#24364a' }}>{total} tasks</div>
                        <div>{formatDateLabel(project.lastUpdated)}</div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </section>
        </div>
      ) : null}

      {activeSubsection === 'gmail' ? (
        <section
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            border: '1px solid #d9e2ef',
            borderRadius: 16,
            background: 'linear-gradient(180deg, #f7fbff 0%, #ffffff 40%)',
            boxShadow: '0 14px 34px rgba(15,23,42,0.08)',
            padding: 16,
            display: 'grid',
            gap: 14,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}
          >
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Gmail - SKALE Tickets</h3>
            <div
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#334155' }}
            >
              <span
                style={{
                  border: '1px solid #d5deeb',
                  borderRadius: 999,
                  padding: '4px 9px',
                  background: '#ffffff',
                  fontWeight: 700,
                }}
              >
                Scanned: {gmailTopicsState.messagesScanned}
              </span>
              <span
                style={{
                  border: '1px solid #d5deeb',
                  borderRadius: 999,
                  padding: '4px 9px',
                  background: '#ffffff',
                  fontWeight: 700,
                }}
              >
                Last scan:{' '}
                {gmailTopicsState.scannedAt ? formatDateLabel(gmailTopicsState.scannedAt) : 'N/A'}
              </span>
            </div>
          </div>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
              gap: 10,
            }}
          >
            <article
              style={{
                border: '1px solid #d3deed',
                borderRadius: 12,
                background: '#ffffff',
                padding: '11px 12px',
                display: 'grid',
                gap: 2,
                boxShadow: '0 8px 18px rgba(15,23,42,0.06)',
              }}
            >
              <span
                style={{ fontSize: 11, color: '#475569', fontWeight: 700, letterSpacing: '0.02em' }}
              >
                Total tickets
              </span>
              <strong style={{ fontSize: 23, color: '#0f172a', lineHeight: 1.1 }}>
                {gmailTicketStatusSummary.total}
              </strong>
            </article>

            {gmailTicketStatusSummary.items.map((item) => {
              const meta = getSkaleStatusMeta(item.key)
              return (
                <article
                  key={item.key}
                  style={{
                    border: `1px solid ${meta.border}`,
                    borderRadius: 12,
                    background: meta.bg,
                    padding: '11px 12px',
                    display: 'grid',
                    gap: 2,
                    boxShadow: '0 10px 20px rgba(15,23,42,0.08)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: meta.color,
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                      opacity: 0.95,
                    }}
                  >
                    {meta.label}
                  </span>
                  <strong style={{ fontSize: 23, color: meta.color, lineHeight: 1.1 }}>
                    {item.count}
                  </strong>
                </article>
              )
            })}
          </section>

          {gmailTopicsState.loading ? (
            <div style={{ padding: '8px 4px', color: '#475569', fontSize: 13 }}>
              Scanning Gmail...
            </div>
          ) : null}

          {!gmailTopicsState.loading && gmailTopicsState.error ? (
            <div
              style={{
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 13,
              }}
            >
              {gmailTopicsState.error}
            </div>
          ) : null}

          {!gmailTopicsState.loading && !gmailTopicsState.error ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  background: '#f8fafc',
                  padding: '7px 10px',
                  fontSize: 11,
                  color: '#64748b',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                Inbox view
              </div>
              {gmailTopicsState.skaleTickets.length ? (
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#ffffff',
                  }}
                >
                  {gmailTopicsState.skaleTickets.map((ticket, index) => {
                    const statusMeta = getSkaleStatusMeta(ticket.status)
                    return (
                      <article
                        key={ticket.ticketNumber}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '12px auto minmax(0, 1fr) auto',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderBottom:
                            index === gmailTopicsState.skaleTickets.length - 1
                              ? 'none'
                              : '1px solid #eef2f7',
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: statusMeta.bg,
                            border: `1px solid ${statusMeta.border}`,
                            display: 'inline-block',
                          }}
                        />

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid #dbe3ef',
                            background: '#f8fafc',
                            color: '#0f172a',
                            borderRadius: 999,
                            padding: '3px 10px',
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: '0.01em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          #{ticket.ticketNumber}
                        </span>

                        <div
                          style={{
                            color: '#1e293b',
                            fontSize: 13,
                            lineHeight: 1.35,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={ticket.subject}
                        >
                          {ticket.subject}
                        </div>

                        <span
                          style={{
                            border: `1px solid ${statusMeta.border}`,
                            background: statusMeta.bg,
                            color: statusMeta.color,
                            borderRadius: 999,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.01em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {statusMeta.label}
                        </span>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div style={{ padding: '8px 10px', color: '#94a3b8', fontSize: 13 }}>
                  No SKALE ticket numbers found in current scan.
                </div>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeSubsection === 'projectManagement' && activeProject ? (
        <section
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'minmax(290px, 360px) minmax(0, 1fr)',
            gap: 18,
            overflow: 'hidden',
            opacity: detailReady ? 1 : 0,
            transform: detailReady ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 220ms ease, transform 220ms ease',
          }}
        >
          <aside
            style={{
              display: 'grid',
              alignContent: 'start',
              gap: 12,
              minHeight: 0,
              transform: detailReady ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'transform 220ms ease',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveProjectId(null)}
              style={{
                justifySelf: 'start',
                border: '1px solid rgba(148,163,184,0.25)',
                background: 'rgba(255,255,255,0.85)',
                color: '#334155',
                borderRadius: 999,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
              }}
            >
              Back to projects
            </button>

            <div
              style={{
                border: `1px solid ${activeProject.theme.cardBorder}`,
                borderRadius: 24,
                background: `radial-gradient(circle at top right, ${activeProject.theme.cardBg} 0%, rgba(255,255,255,0) 36%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)`,
                padding: 18,
                display: 'grid',
                gap: 16,
                boxShadow: '0 24px 48px rgba(15,23,42,0.08)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 0',
                  width: 8,
                  background: `linear-gradient(180deg, ${activeProject.theme.cardAccent} 0%, ${activeProject.theme.cardBorder} 100%)`,
                }}
              />
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: '100%',
                  minHeight: 42,
                  borderRadius: 999,
                  background: activeProject.theme.cardAccent,
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '8px 14px',
                  letterSpacing: '0.04em',
                  textAlign: 'center',
                  boxShadow: '0 14px 28px rgba(15,23,42,0.14)',
                }}
              >
                {activeProject.title}
              </div>

              <p style={{ margin: 0, fontSize: 14, color: '#314456', lineHeight: 1.6 }}>
                {activeProject.summary}
              </p>

              {isPhScheduleProject ? (
                <button
                  type="button"
                  onClick={() => {
                    setScheduleView('calendar')
                    setHoveredShift(null)
                    setShowScheduleModal(true)
                  }}
                  style={{
                    justifySelf: 'start',
                    border: '1px solid rgba(154,52,18,0.35)',
                    background: 'rgba(255,244,236,0.95)',
                    color: '#7c2d12',
                    borderRadius: 999,
                    padding: '7px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                  }}
                >
                  View proposed calendar
                </button>
              ) : null}

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                {(() => {
                  const meta =
                    PROJECT_STATUS_META[activeProject.status] || PROJECT_STATUS_META.planning
                  return (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        border: `1px solid ${meta.border}`,
                        background: meta.bg,
                        color: meta.color,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '5px 10px',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {meta.label}
                    </span>
                  )
                })()}

                <div style={{ fontSize: 11, color: '#64748b', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#24364a' }}>{totalTasks} tasks</div>
                  <div>{formatDateLabel(activeProject.lastUpdated)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: '#516274',
                  }}
                >
                  <span>Completion</span>
                  <strong style={{ color: '#0f172a' }}>{overallProgress}%</strong>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: 'rgba(203,213,225,0.45)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${overallProgress}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${activeProject.theme.cardAccent} 0%, ${activeProject.theme.cardBorder} 100%)`,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                }}
              >
                {[
                  { label: 'Todo', value: todoTasks },
                  { label: 'Done', value: doneTasks },
                  { label: 'In Progress', value: inProgressTasks },
                  { label: 'Updated', value: formatDateLabel(activeProject.lastUpdated) },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      border: '1px solid rgba(203,213,225,0.55)',
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.7)',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#64748b' }}>{item.label}</div>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div
            style={{
              height: '100%',
              minHeight: 0,
              overflow: 'auto',
              paddingRight: 6,
              display: 'grid',
              alignContent: 'start',
              gap: 16,
              transform: detailReady ? 'translateX(0)' : 'translateX(8px)',
              transition: 'transform 220ms ease',
            }}
          >
            <div
              style={{
                border: '1px solid rgba(203,213,225,0.7)',
                borderRadius: 24,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)',
                boxShadow: '0 26px 54px rgba(15,23,42,0.08)',
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 32,
                      lineHeight: 1.04,
                      letterSpacing: '-0.04em',
                      color: '#0f172a',
                    }}
                  >
                    {activeProject.title}
                  </h2>
                  <p
                    style={{ margin: '8px 0 0', color: '#516274', fontSize: 15, lineHeight: 1.55 }}
                  >
                    {activeProject.summary}
                  </p>
                  {activeProject.goal ? (
                    <div
                      style={{
                        marginTop: 14,
                        border: '1px solid #d9e7fb',
                        borderRadius: 16,
                        background: 'linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%)',
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#1d4ed8',
                          letterSpacing: '0.14em',
                        }}
                      >
                        GOAL
                      </div>
                      <p
                        style={{
                          margin: '8px 0 0',
                          color: '#334155',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        {activeProject.goal}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 10,
                    minWidth: 220,
                    border: '1px solid rgba(203,213,225,0.6)',
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.72)',
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Overall Progress</span>
                    <strong style={{ color: '#0f172a' }}>{overallProgress}%</strong>
                  </div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background: 'rgba(203,213,225,0.5)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${overallProgress}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${activeProject.theme.cardAccent} 0%, ${activeProject.theme.cardBorder} 100%)`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Last Updated</span>
                    <strong style={{ color: '#0f172a' }}>
                      {formatDateLabel(activeProject.lastUpdated)}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {(() => {
                  const meta =
                    PROJECT_STATUS_META[activeProject.status] || PROJECT_STATUS_META.planning
                  return (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        border: `1px solid ${meta.border}`,
                        background: meta.bg,
                        color: meta.color,
                        fontSize: 13,
                        fontWeight: 800,
                        padding: '8px 14px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {meta.label}
                    </span>
                  )
                })()}
              </div>
            </div>

            {
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 12,
                  }}
                >
                  {[
                    { label: 'Total Tasks', value: totalTasks },
                    { label: 'Todo', value: todoTasks },
                    { label: 'In Progress', value: inProgressTasks },
                    { label: 'Done', value: doneTasks },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      style={{
                        border: '1px solid rgba(203,213,225,0.72)',
                        borderRadius: 18,
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '0 18px 36px rgba(15,23,42,0.06)',
                        padding: '14px 14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: '#64748b',
                          marginBottom: 6,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {kpi.label}
                      </div>
                      <div
                        style={{ fontSize: 28, lineHeight: 1, fontWeight: 800, color: '#0f172a' }}
                      >
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  {SECTION_ORDER.map((sectionName) => {
                    const tasks = groupedTasks[sectionName] || []
                    const sectionDone = tasks.filter((task) => task.status === 'done').length
                    const collapsed = Boolean(collapsedSections[sectionName])

                    return (
                      <section
                        key={sectionName}
                        style={{
                          border: '1px solid rgba(203,213,225,0.72)',
                          borderRadius: 20,
                          background:
                            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                          boxShadow: '0 18px 36px rgba(15,23,42,0.06)',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSection(sectionName)}
                          style={{
                            width: '100%',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '14px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontWeight: 800,
                            color: '#0f172a',
                            fontSize: 14,
                          }}
                          aria-expanded={!collapsed}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span>{sectionName}</span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                borderRadius: 999,
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #cfe0ff',
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {sectionDone} / {tasks.length} complete
                            </span>
                          </span>
                          <span style={{ color: '#64748b' }}>{collapsed ? '▸' : '▾'}</span>
                        </button>

                        {!collapsed ? (
                          <div
                            style={{
                              borderTop: '1px solid #eef2f7',
                              padding: '10px 12px 14px',
                              display: 'grid',
                              gap: 8,
                            }}
                          >
                            {tasks.length ? (
                              tasks.map((task) => {
                                const statusMeta =
                                  TASK_STATUS_META[task.status] || TASK_STATUS_META.todo
                                return (
                                  <div
                                    key={task.id}
                                    style={{
                                      border: '1px solid rgba(226,232,240,0.95)',
                                      borderRadius: 16,
                                      background: '#ffffff',
                                      padding: '12px 13px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 12,
                                      boxShadow: '0 10px 22px rgba(15,23,42,0.04)',
                                    }}
                                  >
                                    <div style={{ minWidth: 0, display: 'grid', gap: 5 }}>
                                      <div
                                        style={{
                                          fontSize: 14,
                                          color: '#172334',
                                          fontWeight: 700,
                                          lineHeight: 1.35,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {task.title}
                                      </div>
                                      <div
                                        style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}
                                      >
                                        <span style={{ fontWeight: 700, color: '#475569' }}>
                                          Owner:
                                        </span>{' '}
                                        {task.owner}
                                        {task.dueDate
                                          ? `  ·  Due ${formatDateLabel(task.dueDate)}`
                                          : ''}
                                      </div>
                                    </div>

                                    <span
                                      style={{
                                        flexShrink: 0,
                                        borderRadius: 999,
                                        border: `1px solid ${statusMeta.border}`,
                                        background: statusMeta.bg,
                                        color: statusMeta.color,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        padding: '5px 10px',
                                        letterSpacing: '0.03em',
                                        textTransform: 'uppercase',
                                      }}
                                    >
                                      {statusMeta.label}
                                    </span>
                                  </div>
                                )
                              })
                            ) : (
                              <div style={{ padding: '8px 10px', color: '#94a3b8', fontSize: 13 }}>
                                No tasks yet
                              </div>
                            )}
                          </div>
                        ) : null}
                      </section>
                    )
                  })}
                </div>
              </>
            }
          </div>
        </section>
      ) : null}

      {activeSubsection === 'projectManagement' &&
      activeProject &&
      isPhScheduleProject &&
      showScheduleModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="PH Team Coverage Plan"
          onClick={() => {
            setShowScheduleModal(false)
            setHoveredShift(null)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.62)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 50,
            padding: 12,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(1380px, 99vw)',
              maxHeight: '96vh',
              overflow: 'auto',
              borderRadius: 24,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 40px 80px rgba(15,23,42,0.34)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Sticky Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
                position: 'sticky',
                top: 0,
                background: 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 65%, #0f172a 100%)',
                zIndex: 10,
                borderRadius: '24px 24px 0 0',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                  }}
                >
                  PH Team Coverage Plan (CEST)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#cbd5e1' }}>
                  Sales &amp; Conversion team with extended coverage for night hours and weekends.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setScheduleView('calendar')}
                  style={{
                    border: scheduleView === 'calendar' ? '1px solid #1d4ed8' : '1px solid #475569',
                    background: scheduleView === 'calendar' ? '#eff6ff' : '#1e293b',
                    color: scheduleView === 'calendar' ? '#1d4ed8' : '#e2e8f0',
                    borderRadius: 999,
                    padding: '6px 11px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Calendar View
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleView('heatmap')}
                  style={{
                    border: scheduleView === 'heatmap' ? '1px solid #15803d' : '1px solid #475569',
                    background: scheduleView === 'heatmap' ? '#f0fdf4' : '#1e293b',
                    color: scheduleView === 'heatmap' ? '#15803d' : '#e2e8f0',
                    borderRadius: 999,
                    padding: '6px 11px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Coverage Heatmap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false)
                    setHoveredShift(null)
                  }}
                  style={{
                    border: '1px solid #475569',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    borderRadius: 999,
                    padding: '6px 11px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div
              style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div
                style={{
                  border: '1px solid #dbe6fb',
                  borderRadius: 14,
                  background: 'linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%)',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: '#475569',
                    }}
                  >
                    SHARE ACCESS
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 12,
                      color: '#1e3a8a',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 620,
                    }}
                    title={phCoverageShareUrl}
                  >
                    {phCoverageShareUrl}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => window.open(phCoverageShareUrl, '_blank', 'noopener,noreferrer')}
                    style={{
                      border: '1px solid #1d4ed8',
                      background: '#1d4ed8',
                      color: '#ffffff',
                      borderRadius: 999,
                      padding: '6px 12px',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Open Share
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(phCoverageShareUrl)
                        setShareCopied(true)
                        window.setTimeout(() => setShareCopied(false), 1800)
                      } catch {
                        setShareCopied(false)
                      }
                    }}
                    style={{
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      borderRadius: 999,
                      padding: '6px 12px',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {shareCopied ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Agent Legend */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PH_AGENTS.map((agent) => (
                  <div
                    key={agent.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      border: `1px solid ${agent.color}44`,
                      borderRadius: 999,
                      background: agent.light,
                      padding: '4px 10px',
                      fontSize: 11,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: agent.color,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 800, color: agent.color }}>{agent.name}</span>
                    <span style={{ color: '#64748b' }}>— {agent.role}</span>
                    <span style={{ color: '#94a3b8', fontSize: 10 }}>{agent.weeklyHours}h/wk</span>
                  </div>
                ))}
              </div>

              {/* ── CALENDAR VIEW ── */}
              {scheduleView === 'calendar' ? (
                <div>
                  <div
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 4,
                      marginBottom: 8,
                      border: '1px solid #dbe6fb',
                      borderRadius: 12,
                      background: 'rgba(248,251,255,0.95)',
                      backdropFilter: 'blur(6px)',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.08em',
                          fontWeight: 800,
                          color: '#64748b',
                        }}
                      >
                        TIME FOCUS
                      </span>
                      <span
                        style={{
                          border: '1px solid #c7d7fe',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          borderRadius: 999,
                          padding: '3px 10px',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {currentFocusHour}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[4, 8, 10, 12, 16, 19, 22].map((h) => (
                        <span
                          key={h}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#475569',
                            background: '#ffffff',
                          }}
                        >
                          {formatHourLabel(h)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    ref={calendarGridRef}
                    onScroll={(event) => setCalendarScrollTop(event.currentTarget.scrollTop)}
                    style={{
                      overflow: 'auto',
                      maxHeight: '68vh',
                      border: '1px solid #e2e8f0',
                      borderRadius: 14,
                      background: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', minWidth: 980 }}>
                      {/* Time label column */}
                      <div
                        style={{
                          width: 54,
                          flexShrink: 0,
                          paddingTop: 32,
                          position: 'sticky',
                          left: 0,
                          background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
                          borderRight: '1px solid #e2e8f0',
                          zIndex: 3,
                        }}
                      >
                        {Array.from({ length: 18 }, (_, i) => {
                          const h = PH_GRID_START + i
                          return (
                            <div
                              key={i}
                              style={{
                                height: PH_HOUR_PX,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: 7,
                                fontSize: 10,
                                color: '#64748b',
                                fontWeight: 700,
                                boxSizing: 'border-box',
                              }}
                            >
                              {`${String(h).padStart(2, '0')}:00`}
                            </div>
                          )
                        })}
                      </div>

                      {/* Day columns */}
                      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                        {PH_DAYS.map((day, di) => {
                          const dayAgents = PH_AGENTS.filter(
                            (a) => phShiftPos(a.schedule[day]) != null
                          )
                          const isWeekend = di >= 5
                          return (
                            <div key={day} style={{ flex: 1, minWidth: 0 }}>
                              {/* Day header */}
                              <div
                                style={{
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 3,
                                  height: 32,
                                  textAlign: 'center',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: isWeekend ? '#6d28d9' : '#0f172a',
                                  background: isWeekend ? '#f5f3ff' : '#f8fafc',
                                  borderTop: `2px solid ${isWeekend ? '#7c3aed' : '#e2e8f0'}`,
                                  borderLeft: '1px solid #e2e8f0',
                                  borderBottom: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {PH_DAY_SHORT[di]}
                              </div>
                              {/* Column body */}
                              <div
                                style={{
                                  position: 'relative',
                                  height: PH_GRID_HEIGHT,
                                  borderLeft: '1px solid #e2e8f0',
                                  background: isWeekend ? '#faf8ff' : '#ffffff',
                                }}
                              >
                                {Array.from({ length: 9 }, (_, i) => (
                                  <div
                                    key={`band-${i}`}
                                    style={{
                                      position: 'absolute',
                                      top: i * PH_HOUR_PX * 2,
                                      left: 0,
                                      right: 0,
                                      height: PH_HOUR_PX * 2,
                                      background:
                                        i % 2 === 0 ? 'rgba(148,163,184,0.06)' : 'transparent',
                                    }}
                                  />
                                ))}
                                {/* Hour grid lines */}
                                {Array.from({ length: 18 }, (_, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      position: 'absolute',
                                      top: i * PH_HOUR_PX,
                                      left: 0,
                                      right: 0,
                                      borderTop:
                                        i % 2 === 0 ? '1px solid #dbe5f3' : '1px solid #f5f7fb',
                                    }}
                                  />
                                ))}
                                {/* Agent pills */}
                                {dayAgents.map((agent, ai) => {
                                  const pos = phShiftPos(agent.schedule[day])
                                  if (!pos) return null
                                  const isHov =
                                    hoveredShift &&
                                    hoveredShift.agentId === agent.id &&
                                    hoveredShift.day === day
                                  const colW = 100 / dayAgents.length
                                  return (
                                    <div
                                      key={agent.id}
                                      onMouseEnter={() =>
                                        setHoveredShift({ agentId: agent.id, day, agent })
                                      }
                                      onMouseLeave={() => setHoveredShift(null)}
                                      style={{
                                        position: 'absolute',
                                        top: pos.topPx + 1,
                                        height: Math.max(pos.heightPx - 2, 20),
                                        left: `calc(${ai * colW}% + 1px)`,
                                        width: `calc(${colW}% - 2px)`,
                                        background: agent.light,
                                        border: `1.5px solid ${agent.color}`,
                                        borderRadius: 8,
                                        padding: '4px 5px',
                                        fontSize: 10,
                                        color: agent.color,
                                        fontWeight: 800,
                                        overflow: 'hidden',
                                        cursor: 'default',
                                        zIndex: isHov ? 20 : 2,
                                        opacity: hoveredShift && !isHov ? 0.35 : 1,
                                        boxShadow: isHov ? `0 4px 14px ${agent.color}55` : 'none',
                                        transition: 'opacity 110ms ease, box-shadow 110ms ease',
                                        boxSizing: 'border-box',
                                      }}
                                    >
                                      <div
                                        style={{
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {agent.name}
                                      </div>
                                      {pos.heightPx >= 44 ? (
                                        <div style={{ fontSize: 9, opacity: 0.9, marginTop: 1 }}>
                                          {pos.startLabel}–{pos.endLabel}
                                          {pos.clipped ? '+' : ''}
                                        </div>
                                      ) : null}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Hover tooltip */}
                  {hoveredShift
                    ? (() => {
                        const a = hoveredShift.agent
                        const pos = phShiftPos(a?.schedule[hoveredShift.day])
                        if (!a || !pos) return null
                        return (
                          <div
                            style={{
                              marginTop: 6,
                              padding: '8px 14px',
                              borderRadius: 10,
                              border: `1px solid ${a.color}44`,
                              background: a.light,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              flexWrap: 'wrap',
                              fontSize: 12,
                            }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: a.color,
                                flexShrink: 0,
                                display: 'inline-block',
                              }}
                            />
                            <strong style={{ color: a.color }}>{a.name}</strong>
                            <span style={{ color: '#334155' }}>
                              {pos.startLabel} – {pos.endLabel}
                              {pos.clipped ? ' (cont. next day)' : ''}
                            </span>
                            <span style={{ color: '#94a3b8' }}>·</span>
                            <span style={{ color: '#334155' }}>{a.weeklyHours}h/week</span>
                            <span style={{ color: '#94a3b8' }}>·</span>
                            <span style={{ color: '#475569', fontStyle: 'italic' }}>{a.role}</span>
                          </div>
                        )
                      })()
                    : null}
                </div>
              ) : null}

              {/* ── HEATMAP VIEW ── */}
              {scheduleView === 'heatmap' ? (
                <div>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', minWidth: 980 }}>
                      {/* Time column */}
                      <div style={{ width: 48, flexShrink: 0, paddingTop: 28 }}>
                        {Array.from({ length: 18 }, (_, i) => {
                          const h = PH_GRID_START + i
                          return (
                            <div
                              key={i}
                              style={{
                                height: PH_HOUR_PX,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: 6,
                                fontSize: 9,
                                color: '#94a3b8',
                                fontWeight: 700,
                                boxSizing: 'border-box',
                              }}
                            >
                              {i % 2 === 0 ? `${String(h).padStart(2, '0')}:00` : ''}
                            </div>
                          )
                        })}
                      </div>
                      {/* Day columns */}
                      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                        {PH_DAYS.map((day, di) => {
                          const isWeekend = di >= 5
                          return (
                            <div key={day} style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  height: 28,
                                  textAlign: 'center',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: isWeekend ? '#6d28d9' : '#0f172a',
                                  background: isWeekend ? '#f5f3ff' : '#f8fafc',
                                  borderTop: `2px solid ${isWeekend ? '#7c3aed' : '#e2e8f0'}`,
                                  borderLeft: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {PH_DAY_SHORT[di]}
                              </div>
                              {Array.from({ length: 18 }, (_, i) => {
                                const hour = PH_GRID_START + i
                                const count = phCoverageAt(day, hour)
                                return (
                                  <div
                                    key={i}
                                    title={`${String(hour).padStart(2, '0')}:00 — ${count} agent${count !== 1 ? 's' : ''} on duty`}
                                    style={{
                                      height: PH_HOUR_PX,
                                      background: phHeatColor(count),
                                      borderBottom: '1px solid rgba(255,255,255,0.55)',
                                      borderLeft: '1px solid rgba(255,255,255,0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color:
                                        count === 0
                                          ? '#991b1b'
                                          : count === 1
                                            ? '#78350f'
                                            : '#14532d',
                                    }}
                                  >
                                    {count > 0 ? count : '—'}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 10,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                      Coverage level:
                    </span>
                    {[
                      { label: 'No coverage', color: '#fca5a5' },
                      { label: '1 agent', color: '#fde68a' },
                      { label: '2 agents', color: '#86efac' },
                      { label: '3+ agents', color: '#22c55e' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            background: item.color,
                            display: 'inline-block',
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#475569' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* ── KPI SUMMARY ── */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '0.1em',
                    marginBottom: 10,
                  }}
                >
                  SCHEDULE SUMMARY
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: 8,
                  }}
                >
                  {[
                    { label: 'Total Agents', value: '5' },
                    { label: 'Hours / Agent', value: '45h/wk' },
                    { label: 'Total Weekly', value: '225h' },
                    { label: 'Night Coverage', value: 'Yes ✓' },
                    { label: 'Weekend', value: 'Yes ✓' },
                    { label: 'Main 10:00-19:00', value: '2-3 agents' },
                    { label: 'Early Morning', value: 'Yes ✓' },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        background: '#f8fafc',
                        padding: '8px 10px',
                      }}
                    >
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>
                        {kpi.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── COVERAGE ANALYSIS ── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    border: '1px solid #bbf7d0',
                    borderRadius: 14,
                    background: '#f0fdf4',
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#15803d',
                      letterSpacing: '0.08em',
                      marginBottom: 8,
                    }}
                  >
                    COVERED PERIODS
                  </div>
                  {[
                    'Night Coverage (19:00–04:00)',
                    'Early Morning Coverage (04:00–10:00)',
                    'Main European Trading Hours (10:00–19:00)',
                    'Weekend Coverage (Sat &amp; Sun)',
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        fontSize: 12,
                        color: '#166534',
                        marginBottom: 4,
                        display: 'flex',
                        gap: 6,
                      }}
                    >
                      <span>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    border: '1px solid #fde68a',
                    borderRadius: 14,
                    background: '#fffbeb',
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#92400e',
                      letterSpacing: '0.08em',
                      marginBottom: 8,
                    }}
                  >
                    LIMITED COVERAGE
                  </div>
                  {['Weekend Early Morning (04:00–10:00)'].map((item) => (
                    <div
                      key={item}
                      style={{
                        fontSize: 12,
                        color: '#92400e',
                        marginBottom: 4,
                        display: 'flex',
                        gap: 6,
                      }}
                    >
                      <span>⚠</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
