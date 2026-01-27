import React, { useMemo, useState } from 'react'
import StorySidebar from '../../components/sidebars/StorySidebar'
import TaskSidebar from '../../components/sidebars/TaskSidebar'

const seedStories = () => [
  {
    id: 'story-1',
    epic: 'Retention',
    title: 'Increase D30 Retention',
    owner: 'Growth',
    progress: 0.35,
    risk: 'Medium',
    goal: 'Lift D30 retention from baseline to 25% without sacrificing lead quality.',
    kpis: [
      { label: 'D30 Retention %', current: '18%', target: '25%' },
      { label: 'Activation Rate', current: '41%', target: '55%' },
      { label: 'Churn (D7)', current: '29%', target: '20%' },
    ],
    status: 'Executing',
    blockers: [
      'Attribution gaps across onboarding steps',
      'No unified cohort view for product + CRM',
    ],
    decisions: [
      {
        text: 'Approve incentive budget for the D7→D30 retention loop (cap + KPI gate).',
        owner: 'CEO',
      },
      {
        text: 'Select primary channel for retention experiments (email vs in-app) for the next sprint.',
        owner: 'Growth Lead',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Segment user cohorts and define activation thresholds',
        owner: 'Data',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-2',
        title: 'Deploy retention campaign v1 (triggered)',
        owner: 'Growth',
        done: false,
        impact: 'High',
        eta: '7d',
      },
      {
        id: 'task-3',
        title: 'Build churn early-warning dashboard',
        owner: 'BI',
        done: false,
        impact: 'Medium',
      },
    ],
  },
  {
    id: 'story-2',
    epic: 'Acquisition',
    title: 'Launch Affiliate Program',
    owner: 'Partnerships',
    progress: 0.1,
    risk: 'Low',
    goal: 'Onboard 10 quality affiliates with predictable CPA and conversion, then scale safely.',
    kpis: [
      { label: 'New Affiliates', current: '2', target: '10' },
      { label: 'CPA', current: '—', target: '≤ €X' },
      { label: 'Qualified Leads / week', current: '—', target: 'N' },
    ],
    status: 'Planned',
    blockers: ['Need final terms approval (compliance + payments)'],
    decisions: [
      {
        text: 'Approve affiliate terms + payout schedule (net + thresholds).',
        owner: 'Legal/Finance',
      },
    ],
    tasks: [
      {
        id: 'task-4',
        title: 'Draft program terms + payout schedule',
        owner: 'Legal',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-5',
        title: 'Publish affiliate landing page + tracking hooks',
        owner: 'Web',
        done: false,
        impact: 'High',
      },
      {
        id: 'task-6',
        title: 'Set up affiliate KPI dashboard',
        owner: 'BI',
        done: false,
        impact: 'Medium',
      },
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
      <div style={{ flex: 1, padding: 24 }}>
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
              className="card"
              onClick={() => {
                openStory(story.id)
              }}
              style={{
                textAlign: 'left',
                width: 320,
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
