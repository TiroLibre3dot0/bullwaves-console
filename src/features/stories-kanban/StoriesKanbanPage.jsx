import React, { useMemo, useState } from 'react'
import StorySidebar from '../../components/sidebars/StorySidebar'
import TaskSidebar from '../../components/sidebars/TaskSidebar'

const seedStories = () => [
  {
    id: 'story-growth-acq',
    epic: 'Acquisition',
    title: 'Growth Engine: Acquisition & Brand',
    owner: 'Marketing / Growth',
    progress: 0.28,
    risk: 'Medium',
    goal: 'Build a predictable acquisition machine: paid + lifecycle + social, with measurable CAC/CPA and weekly execution cadence.',
    kpis: [
      { label: 'Qualified Leads / week', current: '—', target: '↑' },
      { label: 'CPA / CAC', current: '—', target: '↓' },
      { label: 'Content Output', current: '—', target: '↑' },
    ],
    status: 'Executing',
    blockers: [
      'Unclear ownership split between paid/lifecycle/content',
      'Measurement (tracking + attribution) not fully standardized',
    ],
    decisions: [
      {
        text: 'Set Q1 growth target + budget guardrails (CPA/CAC thresholds).',
        owner: 'CEO/Finance',
      },
      {
        text: 'Decide primary channels mix: Paid vs Affiliates vs Organic (weekly cadence).',
        owner: 'Growth Lead',
      },
    ],
    tasks: [
      { id: 'task-growth-1', title: 'Media Buying', owner: 'Paid', done: false, impact: 'High' },
      {
        id: 'task-growth-2',
        title: 'Email & SMS Marketing',
        owner: 'Lifecycle',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-growth-3',
        title: 'Social Media Content Production (UGC + Agency)',
        owner: 'Content',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-growth-4',
        title: 'Ambassadors',
        owner: 'Community',
        done: false,
        impact: 'Medium',
      },
      {
        id: 'task-growth-5',
        title: 'Trading Competition',
        owner: 'Growth',
        done: false,
        impact: 'Medium',
      },
      { id: 'task-growth-6', title: 'Expo', owner: 'Events', done: false, impact: 'Low' },
      {
        id: 'task-growth-7',
        title: 'Affiliate Funnel 2.0 Launch',
        owner: 'Partnerships',
        done: false,
        impact: 'High',
      },
    ],
  },
  {
    id: 'story-partners-ib',
    epic: 'Acquisition',
    title: 'Partners & IB: Commercial Ops Stack',
    owner: 'Partnerships / Sales Ops',
    progress: 0.18,
    risk: 'High',
    goal: 'Standardize partner operations: payments, reporting, multi-level IB structure and reputation flywheel to scale without chaos.',
    kpis: [
      { label: 'Partner Reporting Coverage', current: '—', target: '100%' },
      { label: 'Payment Process SLA', current: '—', target: '≤ X days' },
      { label: 'Partner NPS/Reviews', current: '—', target: '↑' },
    ],
    status: 'Executing',
    blockers: [
      'Missing single source of truth for partner commercial terms',
      'Reporting definitions not aligned across teams',
    ],
    decisions: [
      {
        text: 'Approve standardized partner reporting template + cadence (weekly/monthly).',
        owner: 'COO',
      },
      {
        text: 'Confirm multi-level IB model and qualification rules (how to become IB).',
        owner: 'Partnerships Lead',
      },
    ],
    tasks: [
      {
        id: 'task-partners-1',
        title: 'Redefine the Payment processes for partners',
        owner: 'Finance',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-partners-2',
        title: 'Create clear reporting for Partners',
        owner: 'BI',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-partners-3',
        title: 'Focus on multy level IB set up with existing clients (How each to become IB)',
        owner: 'Partnerships',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-partners-4',
        title: 'Create a Trustpilot department',
        owner: 'Ops',
        done: false,
        impact: 'Medium',
      },
    ],
  },
  {
    id: 'story-product-crm',
    epic: 'Platform',
    title: 'Client Experience: Product, CRM & Education',
    owner: 'Product / CRM',
    progress: 0.22,
    risk: 'Medium',
    goal: 'Improve client experience and conversion with clear dashboards, CRM automation, education assets, and comparable positioning.',
    kpis: [
      { label: 'Activation Rate', current: '—', target: '↑' },
      { label: 'Support Tickets / user', current: '—', target: '↓' },
      { label: 'CRM Automation Coverage', current: '—', target: '↑' },
    ],
    status: 'Executing',
    blockers: [
      'Unclear technical dependencies between CRM/product/reporting',
      'Content + product roadmap not synchronized',
    ],
    decisions: [
      { text: 'Define MVP scope for client dashboard + tracking metrics.', owner: 'Product Lead' },
      {
        text: 'Pick the CRM automation priorities (onboarding, retention, reactivation).',
        owner: 'COO/Growth',
      },
    ],
    tasks: [
      {
        id: 'task-product-1',
        title: 'Creating personalized client dashboard',
        owner: 'Product',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-product-2',
        title: 'Bullwaves CRM Automation',
        owner: 'CRM',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-product-3',
        title: 'Skale integrating stats on Voiso',
        owner: 'Ops/BI',
        done: false,
        impact: 'Medium',
      },
      {
        id: 'task-product-4',
        title: 'Education Section: Market Analyst & Webinars',
        owner: 'Content',
        done: false,
        impact: 'Medium',
      },
      {
        id: 'task-product-5',
        title: 'Comparison Website',
        owner: 'Web',
        done: false,
        impact: 'Low',
      },
    ],
  },
  {
    id: 'story-retention-prop',
    epic: 'Retention',
    title: 'Prop & Retention: Reactivation + Payments Friction',
    owner: 'Growth / Risk',
    progress: 0.16,
    risk: 'High',
    goal: 'Increase retention and reactivation by fixing withdrawals engagement, failed deposits, and improving evaluation flow.',
    kpis: [
      { label: 'Failed Deposit Rate', current: '—', target: '↓' },
      { label: 'Reactivation %', current: '—', target: '↑' },
      { label: 'Withdrawal Completion', current: '—', target: '↑' },
    ],
    status: 'Executing',
    blockers: [
      'Root-cause of failed deposits not tracked end-to-end',
      'No unified owner between growth/risk/ops for withdrawals',
    ],
    decisions: [
      {
        text: 'Choose top 3 friction points to fix first (deposits/withdrawals/evaluation).',
        owner: 'COO',
      },
      {
        text: 'Set success metrics and guardrails (fraud + compliance).',
        owner: 'Risk/Compliance',
      },
    ],
    tasks: [
      {
        id: 'task-retention-1',
        title: 'Focus on Prop reactivation, withdrawals engagement, retention, Failed Deposit',
        owner: 'Growth',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-retention-2',
        title: 'New Prop Firm Evaluation Flow',
        owner: 'Product',
        done: false,
        impact: 'High',
      },
    ],
  },
  {
    id: 'story-ops-org',
    epic: 'Ops',
    title: 'Ops & Org: Platform Stability + Company Setup',
    owner: 'COO / Ops',
    progress: 0.24,
    risk: 'Medium',
    goal: 'Make the company operationally scalable: org design, HR/payroll, office setup, and critical infrastructure migrations.',
    kpis: [
      { label: 'Ops Incidents', current: '—', target: '↓' },
      { label: 'Hiring/Onboarding SLA', current: '—', target: '↑' },
      { label: 'Migration Risk', current: '—', target: '↓' },
    ],
    status: 'Executing',
    blockers: [
      'Cross-team dependencies not sequenced',
      'Undefined owners for HR system + payroll rollout',
    ],
    decisions: [
      { text: 'Confirm org structure and accountable owners per pillar.', owner: 'CEO/COO' },
      {
        text: 'Approve timeline for liquidity provider migration and contingency plan.',
        owner: 'Ops Lead',
      },
    ],
    tasks: [
      {
        id: 'task-ops-1',
        title: 'Liquidity Provider Migration',
        owner: 'Ops',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-ops-2',
        title: 'set up and launch the GGC office',
        owner: 'Ops',
        done: false,
        impact: 'Medium',
      },
      { id: 'task-ops-3', title: 'HR System', owner: 'HR', done: false, impact: 'Medium' },
      {
        id: 'task-ops-4',
        title: 'International Payroll System',
        owner: 'HR/Finance',
        done: false,
        impact: 'Medium',
      },
      {
        id: 'task-ops-5',
        title: 'Organizational Structure',
        owner: 'Leadership',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-ops-6',
        title: 'Restructuring',
        owner: 'Leadership',
        done: false,
        impact: 'Medium',
      },
      { id: 'task-ops-7', title: 'Athletes Management', owner: 'Ops', done: false, impact: 'Low' },
    ],
  },
]

export default function StoriesKanbanPage({
  onOpenProjectBoard,
  embedded = false,
  publicMode = false,
}) {
  const [stories, setStories] = useState(() => seedStories())
  const [dockStoryId, setDockStoryId] = useState(null)
  const [dockTaskId, setDockTaskId] = useState(null)
  const [storyOpen, setStoryOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)

  const selectedStory = useMemo(
    () => stories.find((s) => s.id === dockStoryId) || null,
    [stories, dockStoryId]
  )
  const selectedTask = useMemo(
    () => selectedStory?.tasks?.find((t) => t.id === dockTaskId) || null,
    [selectedStory, dockTaskId]
  )

  const toggleStoryTaskDone = (task) => {
    if (publicMode) return
    if (!dockStoryId || !task?.id) return
    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== dockStoryId) return s
        const nextTasks = (s.tasks || []).map((t) =>
          t.id === task.id ? { ...t, done: !t.done } : t
        )
        return { ...s, tasks: nextTasks }
      })
    )
  }

  const openStory = (storyId) => {
    setDockStoryId(storyId)
    setStoryOpen(true)
    setTaskOpen(false)
  }

  const closeStory = () => {
    setStoryOpen(false)
    // Allow sidebar slide-out before clearing the story.
    window.setTimeout(() => {
      setDockStoryId(null)
      setDockTaskId(null)
      setTaskOpen(false)
    }, 220)
  }

  const openTask = (taskId) => {
    setDockTaskId(taskId)
    setTaskOpen(true)
    setStoryOpen(false)
  }

  const closeTask = () => {
    setTaskOpen(false)
    // Keep task mounted during slide-out, then clear.
    window.setTimeout(() => {
      setDockTaskId(null)
    }, 220)
  }

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Stories Kanban */}
      <div className="sk-root" style={{ flex: 1, padding: 24 }}>
        {embedded ? null : (
          <>
            <div
              style={{
                color: 'rgba(148,163,184,0.95)',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 0.2,
              }}
            >
              Strategic Execution
            </div>
            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: '#fff' }}>
              Stories Kanban
            </div>
            <div
              style={{
                marginTop: 6,
                color: 'rgba(148,163,184,0.95)',
                fontWeight: 650,
                fontSize: 12,
              }}
            >
              Select a story to open the Strategic Decision Cockpit.
            </div>
          </>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {stories.map((story) => (
            <button
              key={story.id}
              type="button"
              className="card sk-card"
              onClick={() => {
                openStory(story.id)
              }}
              style={{
                textAlign: 'left',
                width: 'min(360px, 100%)',
                padding: 16,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                cursor: 'pointer',
              }}
              title={story.title}
            >
              <div
                className="sk-card-title"
                style={{
                  color: 'rgba(226,232,240,0.96)',
                  fontWeight: 950,
                  fontSize: 14,
                  lineHeight: 1.2,
                  overflowWrap: 'anywhere',
                }}
              >
                {story.title}
              </div>
              <div
                className="sk-card-owner"
                style={{
                  marginTop: 8,
                  color: 'rgba(148,163,184,0.95)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Owner: {story.owner || '—'}
              </div>
              <div
                className="sk-card-goal"
                style={{
                  marginTop: 6,
                  color: 'rgba(148,163,184,0.8)',
                  fontSize: 12,
                  fontWeight: 650,
                  lineHeight: 1.35,
                }}
              >
                {String(story.goal || '').slice(0, 90)}
                {String(story.goal || '').length > 90 ? '…' : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .sk-root { padding: 14px !important; }
          .sk-card { padding: 12px !important; border-radius: 14px !important; }
          .sk-card-title { font-size: 13px !important; line-height: 1.15 !important; }
          .sk-card-owner { margin-top: 6px !important; font-size: 11px !important; }
          .sk-card-goal { margin-top: 4px !important; font-size: 11px !important; line-height: 1.25 !important; }
        }
      `}</style>

      {/* Sidebars (right) */}
      <StorySidebar
        open={Boolean(selectedStory) && storyOpen}
        story={selectedStory}
        onClose={closeStory}
        onOpenProjectBoard={onOpenProjectBoard}
        onSelectTask={(task) => {
          const taskId = task?.id || null
          if (!taskId) return
          openTask(taskId)
        }}
        onToggleTaskDone={publicMode ? undefined : toggleStoryTaskDone}
      />

      <TaskSidebar
        open={Boolean(selectedTask) && taskOpen}
        task={selectedTask}
        parentStory={selectedStory}
        onClose={closeTask}
        onBackToStory={() => {
          setTaskOpen(false)
          setStoryOpen(true)
        }}
        readOnly={publicMode}
        onOpenProjectBoard={onOpenProjectBoard}
      />
    </div>
  )
}
