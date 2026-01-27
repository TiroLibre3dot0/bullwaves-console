import React, { useState, useMemo } from 'react'

// --- DATA MODEL ---
const STATUSES = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'planned', title: 'Planned' },
  { id: 'executing', title: 'Executing' },
  { id: 'review', title: 'Review & QA' },
  { id: 'blocked', title: 'Blocked' },
  { id: 'done', title: 'Done' },
]

const IMPACT_COLORS = {
  'Very High': '#ef4444',
  High: '#f59e42',
  Medium: '#22d3ee',
  Low: '#a3e635',
}

const EPICS = [
  {
    epicId: 'retention',
    title: 'RETENTION & MONETIZATION',
    description:
      'Build a modern retention engine to increase FTD→QFTD conversion and improve user engagement and reactivation.',
    impact: 'Very High',
    ownerDepartment: 'CRM / Product',
    status: 'executing',
    kpis: [
      'FTD → QFTD conversion rate',
      'D7 / D30 retention',
      'Reactivation rate',
      '% users engaged post-registration',
    ],
    milestones: {
      q1: [
        'WhatsApp platform enabled + first journeys live',
        'Solitics onboarding completed + initial segments defined',
        'CRM automation baseline flows deployed',
      ],
      q2: [
        'Full multi-step journeys (onboarding + reactivation) automated',
        'KPI dashboards for retention + churn triggers',
      ],
      q3: ['Optimization and experimentation engine (A/B tests, personalization)'],
    },
    initiatives: [
      {
        initiativeId: '1.1',
        title: 'WhatsApp Business Platform Activation (via convrs.io)',
        objective:
          'Make WhatsApp the primary engagement channel for onboarding, retention and reactivation.',
        kpis: ['WhatsApp engagement rate', 'Onboarding completion'],
        milestones: [],
        ownerDepartment: 'CRM',
        status: 'executing',
        notes: 'We are enabling WhatsApp Business Platform through convrs.io.',
        tasks: ['Enable API', 'Setup onboarding flows', 'Monitor engagement'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
      {
        initiativeId: '1.2',
        title: 'Solitics Onboarding & Go-Live (March)',
        objective: 'Enable segmentation, triggers, and automated journeys via Solitics.',
        kpis: ['Segments created', 'Automated journeys live'],
        milestones: [],
        ownerDepartment: 'CRM',
        status: 'planned',
        notes:
          'Onboarding is ongoing with Roman (our Customer Manager) to learn the dashboard and capabilities.',
        tasks: ['Complete onboarding', 'Define segments', 'Deploy first journeys'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
      {
        initiativeId: '1.3',
        title: 'CRM Automation & Lifecycle Journeys',
        objective:
          'Automate lifecycle flows to improve conversion and retention (onboarding, reactivation, churn prevention).',
        kpis: ['Automated flows live', 'Churn rate'],
        milestones: [],
        ownerDepartment: 'CRM',
        status: 'planned',
        notes: '',
        tasks: ['Map lifecycle', 'Automate onboarding', 'Setup churn triggers'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-20',
  },
  {
    epicId: 'acquisition',
    title: 'ACQUISITION & TRAFFIC DIVERSIFICATION',
    description:
      'Reduce dependency from affiliates by building and testing alternative traffic sources and owned channels.',
    impact: 'Very High',
    ownerDepartment: 'Marketing',
    status: 'planned',
    kpis: [
      '% registrations from non-affiliate sources',
      'CPA by channel',
      'Conversion rate by channel',
      'Net deposits per channel',
    ],
    milestones: {
      q1: ['3-5 new sources tested (small budget)', 'tracking framework and reporting'],
      q2: ['scale winners, kill losers'],
      q3: ['build repeatable acquisition playbook'],
    },
    initiatives: [
      {
        initiativeId: '2.1',
        title: 'New Traffic Sources Discovery & Deals',
        objective:
          'Identify and activate new traffic sources suitable for Bullwaves through partnerships and content ecosystems.',
        kpis: ['# new sources', 'Partnerships signed'],
        milestones: [],
        ownerDepartment: 'Marketing',
        status: 'planned',
        notes: '',
        tasks: ['Scout sources', 'Negotiate deals', 'Launch test campaigns'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
      {
        initiativeId: '2.2',
        title: 'Thematic Social Pages & Paid Distribution',
        objective:
          'Build non-branded thematic pages and run paid distribution to drive controlled traffic to Bullwaves.',
        kpis: ['Pages live', 'Traffic volume'],
        milestones: [],
        ownerDepartment: 'Marketing',
        status: 'backlog',
        notes: '',
        tasks: ['Create pages', 'Setup paid campaigns', 'Measure traffic'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
      {
        initiativeId: '2.3',
        title: 'Channel Performance Tracking & Iteration',
        objective: 'Set tracking and learn quickly which sources scale and which don’t.',
        kpis: ['Tracking live', 'Performance reports'],
        milestones: [],
        ownerDepartment: 'Marketing',
        status: 'planned',
        notes: '',
        tasks: ['Setup tracking', 'Analyze results', 'Iterate'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-20',
  },
  {
    epicId: 'platform',
    title: 'PLATFORM & UX EVOLUTION',
    description:
      'Improve conversion and user experience by building our own UI layer integrated with Skale APIs.',
    impact: 'High',
    ownerDepartment: 'Product / Tech',
    status: 'planned',
    kpis: [
      'Registration conversion rate',
      'KYC completion rate',
      'Deposit conversion rate',
      'Support tickets related to UX',
    ],
    milestones: {
      q1: ['test environment ready', 'UX redesign scope defined'],
      q2: ['first UI modules released (highest conversion pages)'],
      q3: ['broader rollout + optimization'],
    },
    initiatives: [
      {
        initiativeId: '3.1',
        title: 'Skale Test Environment Setup',
        objective: 'Obtain and configure Skale test environment to develop custom UI safely.',
        kpis: ['Test env ready'],
        milestones: [],
        ownerDepartment: 'Tech',
        status: 'planned',
        notes: '',
        tasks: ['Request access', 'Configure env', 'Validate setup'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
      {
        initiativeId: '3.2',
        title: 'Custom Frontend UI Development',
        objective: 'Build our UI/UX layer (conversion oriented, modern, clear).',
        kpis: ['UI modules live'],
        milestones: [],
        ownerDepartment: 'Product',
        status: 'backlog',
        notes: '',
        tasks: ['Design UI', 'Develop modules', 'QA'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
      {
        initiativeId: '3.3',
        title: 'Skale API Integration Layer',
        objective: 'Integrate our UI with Skale APIs (authentication, account, wallet, etc.).',
        kpis: ['APIs integrated'],
        milestones: [],
        ownerDepartment: 'Tech',
        status: 'planned',
        notes: '',
        tasks: ['Map APIs', 'Develop integration', 'Test flows'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-20',
  },
  {
    epicId: 'ops',
    title: 'OPERATIONAL SCALABILITY',
    description:
      'Automate operations and reduce friction to increase speed, reduce cost and scale safely.',
    impact: 'High',
    ownerDepartment: 'Operations',
    status: 'planned',
    kpis: ['onboarding time', 'KYC processing time', 'ops time spent per user', 'incident rate'],
    milestones: {
      q1: ['KYC automation prototype', 'migration assessment'],
      q2: ['KYC automation go-live', 'migration execution'],
      q3: ['ops automation expansion'],
    },
    initiatives: [
      {
        initiativeId: '4.1',
        title: 'KYC Automation to Reduce Onboarding Time by 60%',
        objective: 'Automate KYC steps to reduce onboarding time and friction.',
        kpis: ['Onboarding time', 'KYC completion'],
        milestones: [],
        ownerDepartment: 'Ops',
        status: 'planned',
        notes: '',
        tasks: ['Select vendor', 'Integrate', 'Monitor results'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
      {
        initiativeId: '4.2',
        title: 'Liquidity / Platform Migration Stability Upgrade',
        objective: 'Improve platform stability and reduce disruptions via migration.',
        kpis: ['Downtime', 'Incident rate'],
        milestones: [],
        ownerDepartment: 'Ops',
        status: 'backlog',
        notes: '',
        tasks: ['Assess migration', 'Plan execution', 'Monitor stability'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
      {
        initiativeId: '4.3',
        title: 'Payroll / Payments Operations System',
        objective: 'Streamline payroll/payments processes and reduce manual work.',
        kpis: ['Payroll time', 'Error rate'],
        milestones: [],
        ownerDepartment: 'Ops',
        status: 'planned',
        notes: '',
        tasks: ['Map process', 'Automate steps', 'QA'],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-20',
      },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-20',
  },
]

// --- FILTERS (CONTROL MODE) ---
function useBoardFilters(epics) {
  const [epicFilter, setEpicFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [impactFilter, setImpactFilter] = useState('')
  const [search, setSearch] = useState('')

  // CONTROL MODE: Only filter epics and initiatives, never tasks
  const filteredEpics = useMemo(() => {
    let data = epics
    if (epicFilter) data = data.filter((e) => e.epicId === epicFilter)
    if (ownerFilter)
      data = data.filter((e) => e.ownerDepartment.toLowerCase().includes(ownerFilter.toLowerCase()))
    if (impactFilter) data = data.filter((e) => e.impact === impactFilter)
    if (search) {
      data = data.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.initiatives.some((i) => i.title.toLowerCase().includes(search.toLowerCase()))
      )
    }
    return data
  }, [epics, epicFilter, ownerFilter, impactFilter, search])

  return {
    epicFilter,
    setEpicFilter,
    ownerFilter,
    setOwnerFilter,
    impactFilter,
    setImpactFilter,
    search,
    setSearch,
    filteredEpics,
  }
}

function ImpactBadge({ impact }) {
  return (
    <span
      style={{
        background: IMPACT_COLORS[impact] || '#ddd',
        color: '#fff',
        borderRadius: 8,
        fontSize: 12,
        padding: '2px 8px',
        marginLeft: 8,
        fontWeight: 600,
      }}
    >
      {impact}
    </span>
  )
}

function EpicTag({ epic }) {
  return (
    <span
      style={{
        background: '#232c3b',
        color: '#38bdf8',
        borderRadius: 8,
        fontSize: 12,
        padding: '2px 8px',
        marginRight: 8,
        fontWeight: 600,
        border: '1px solid #38bdf8',
      }}
    >
      {epic}
    </span>
  )
}

function InitiativeCard({ initiative, epic, onExpand }) {
  // CONTROL MODE: Only show title, impact, owner, status
  return (
    <div
      style={{
        background: '#232c3b',
        borderRadius: 8,
        marginBottom: 10,
        padding: 12,
        cursor: 'pointer',
        borderLeft: `4px solid #38bdf8`,
        boxShadow: '0 1px 4px #0002',
      }}
      onClick={onExpand}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <EpicTag epic={epic.title.split(' ')[0]} />
        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{initiative.title}</span>
        <ImpactBadge impact={epic.impact} />
      </div>
      <div
        style={{ fontSize: 12, color: '#b3b3b3', display: 'flex', justifyContent: 'space-between' }}
      >
        <span>{initiative.ownerDepartment}</span>
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{initiative.status}</span>
      </div>
    </div>
  )
}

function EpicCard({ epic, onExpand }) {
  // CONTROL MODE: Only show name, impact, owner, status
  return (
    <div
      style={{
        background: '#181f2a',
        borderRadius: 12,
        marginBottom: 16,
        padding: 18,
        boxShadow: '0 2px 8px #0003',
        borderLeft: `6px solid #38bdf8`,
        cursor: 'pointer',
      }}
      onClick={onExpand}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <EpicTag epic={epic.title.split(' ')[0]} />
        <span style={{ fontWeight: 800, fontSize: 16, flex: 1 }}>{epic.title}</span>
        <ImpactBadge impact={epic.impact} />
      </div>
      <div
        style={{ fontSize: 13, color: '#b3b3b3', display: 'flex', justifyContent: 'space-between' }}
      >
        <span>{epic.ownerDepartment}</span>
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{epic.status}</span>
      </div>
    </div>
  )
}

function InitiativeModal({ initiative, epic, onClose }) {
  if (!initiative) return null
  // Group tasks by phase if possible (for now, just show as checklist)
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#181f2a',
          borderRadius: 14,
          minWidth: 400,
          maxWidth: 540,
          padding: 32,
          boxShadow: '0 4px 32px #0008',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
          }}
        >
          &times;
        </button>
        <h3 style={{ color: '#38bdf8', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
          {initiative.title}
        </h3>
        <div style={{ color: '#b3b3b3', fontSize: 14, marginBottom: 8 }}>
          {initiative.objective}
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Owner:</b> {initiative.ownerDepartment}
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Status:</b> {initiative.status}
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Strategic Overview:</b>
          <ul style={{ margin: '4px 0 0 18px' }}>
            <li>
              <b>Objective:</b> {initiative.objective}
            </li>
            <li>
              <b>Expected Impact:</b> {epic.impact}
            </li>
            <li>
              <b>Business Problem:</b> {initiative.notes || '-'}
            </li>
          </ul>
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>KPI:</b>
          <ul style={{ margin: '4px 0 0 18px' }}>
            {initiative.kpis.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Quarterly Milestones:</b>
          <div style={{ marginLeft: 12 }}>
            <b>Q1:</b>{' '}
            <ul>
              {epic.milestones.q1.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
            <b>Q2:</b>{' '}
            <ul>
              {epic.milestones.q2.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
            <b>Q3:</b>{' '}
            <ul>
              {epic.milestones.q3.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Task Breakdown:</b>
          <ul style={{ margin: '4px 0 0 18px' }}>
            {initiative.tasks.map((t, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" disabled style={{ accentColor: '#38bdf8' }} />
                <span>{t}</span>
                <span style={{ fontSize: 11, color: '#b3b3b3', marginLeft: 8 }}>
                  [{initiative.ownerDepartment}]
                </span>
                <span style={{ fontSize: 11, color: '#38bdf8', marginLeft: 8 }}>
                  {initiative.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Notes / Context:</b> {initiative.notes || '-'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Created:</b> {initiative.createdAt} <b>Updated:</b> {initiative.updatedAt}
        </div>
      </div>
    </div>
  )
}

function EpicModal({ epic, onClose }) {
  if (!epic) return null
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#181f2a',
          borderRadius: 14,
          minWidth: 400,
          maxWidth: 540,
          padding: 32,
          boxShadow: '0 4px 32px #0008',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
          }}
        >
          &times;
        </button>
        <h2 style={{ color: '#38bdf8', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
          {epic.title}
        </h2>
        <div style={{ color: '#b3b3b3', fontSize: 15, marginBottom: 8 }}>{epic.description}</div>
        <div style={{ marginBottom: 10 }}>
          <b>Owner:</b> {epic.ownerDepartment}
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Status:</b> {epic.status}
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Impact:</b> <ImpactBadge impact={epic.impact} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>KPIs:</b>
          <ul style={{ margin: '4px 0 0 18px' }}>
            {epic.kpis.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Milestones:</b>
          <div style={{ marginLeft: 12 }}>
            <b>Q1:</b>{' '}
            <ul>
              {epic.milestones.q1.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
            <b>Q2:</b>{' '}
            <ul>
              {epic.milestones.q2.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
            <b>Q3:</b>{' '}
            <ul>
              {epic.milestones.q3.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <b>Created:</b> {epic.createdAt} <b>Updated:</b> {epic.updatedAt}
        </div>
      </div>
    </div>
  )
}

export default function NotionBoard({ pillarFilter }) {
  const [expandedEpic, setExpandedEpic] = useState(null)
  const [expandedInitiative, setExpandedInitiative] = useState(null)
  // If pillarFilter is set, filter epics to only that pillar
  const filteredEpics = useMemo(() => {
    if (!pillarFilter) return EPICS
    return EPICS.filter((e) => e.epicId === pillarFilter)
  }, [pillarFilter])
  const filters = useBoardFilters(filteredEpics)

  // CONTROL MODE: Only show epics and max 1-2 active initiatives per epic (executing/planned)
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 18 }}>
        Strategic Execution System
        <span style={{ color: '#38bdf8', fontWeight: 400, fontSize: 15, marginLeft: 12 }}>
          (Control Mode)
        </span>
        {pillarFilter && (
          <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: 15, marginLeft: 18 }}>
            — Focus: {filteredEpics[0]?.title || pillarFilter}
          </span>
        )}
      </h2>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
        <select
          value={filters.epicFilter}
          onChange={(e) => filters.setEpicFilter(e.target.value)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option value="">All Epics</option>
          {EPICS.map((e) => (
            <option key={e.epicId} value={e.epicId}>
              {e.title}
            </option>
          ))}
        </select>
        <select
          value={filters.ownerFilter}
          onChange={(e) => filters.setOwnerFilter(e.target.value)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option value="">All Departments</option>
          {[...new Set(EPICS.map((e) => e.ownerDepartment))].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={filters.impactFilter}
          onChange={(e) => filters.setImpactFilter(e.target.value)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option value="">All Impact</option>
          {Object.keys(IMPACT_COLORS).map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <input
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder="Search…"
          style={{ padding: 6, borderRadius: 6, minWidth: 120 }}
        />
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`, gap: 18 }}
      >
        {STATUSES.map((col) => (
          <div key={col.id}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 16, marginBottom: 10 }}>
              {col.title}
            </div>
            {/* Epics in this status */}
            {filters.filteredEpics
              .filter((e) => e.status === col.id)
              .map((epic) => (
                <EpicCard key={epic.epicId} epic={epic} onExpand={() => setExpandedEpic(epic)} />
              ))}
            {/* Initiatives in this status (grouped by epic, CONTROL MODE: max 2 per epic in planned, max 1-2 in executing) */}
            {filters.filteredEpics.map((epic) => {
              let initiatives = epic.initiatives.filter((i) => i.status === col.id)
              if (col.id === 'executing') initiatives = initiatives.slice(0, 2)
              if (col.id === 'planned') initiatives = initiatives.slice(0, 2)
              else if (col.id !== 'executing' && col.id !== 'planned') initiatives = []
              return initiatives.map((initiative) => (
                <InitiativeCard
                  key={initiative.initiativeId}
                  initiative={initiative}
                  epic={epic}
                  onExpand={() => setExpandedInitiative({ initiative, epic })}
                />
              ))
            })}
          </div>
        ))}
      </div>
      {expandedEpic && <EpicModal epic={expandedEpic} onClose={() => setExpandedEpic(null)} />}
      {expandedInitiative && (
        <InitiativeModal
          initiative={expandedInitiative.initiative}
          epic={expandedInitiative.epic}
          onClose={() => setExpandedInitiative(null)}
        />
      )}
    </div>
  )
}
// ...existing code up to export default function NotionBoard() { ...
