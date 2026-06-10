import { useMemo } from 'react'

const SECTION_ORDER = ['Infrastructure', 'Compliance', 'Launch']

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

const PUBLIC_PROJECT = {
  id: 'ph-team-new-schedule',
  title: 'PH Team New schedule',
  summary: 'Shift redesign and handover alignment.',
  status: 'waitingExternalAction',
  lastUpdated: '2026-05-31',
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
}

function countByStatus(tasks, status) {
  return tasks.filter((task) => task.status === status).length
}

export default function PublicProjectManagementSharePage() {
  const groupedTasks = useMemo(() => {
    const grouped = {}
    SECTION_ORDER.forEach((section) => {
      grouped[section] = []
    })
    PUBLIC_PROJECT.tasks.forEach((task) => {
      if (!grouped[task.section]) grouped[task.section] = []
      grouped[task.section].push(task)
    })
    return grouped
  }, [])

  const stats = useMemo(() => {
    const total = PUBLIC_PROJECT.tasks.length
    const done = countByStatus(PUBLIC_PROJECT.tasks, 'done')
    const inProgress = countByStatus(PUBLIC_PROJECT.tasks, 'inProgress')
    const blocked = countByStatus(PUBLIC_PROJECT.tasks, 'blocked')
    const progress = total ? Math.round((done / total) * 100) : 0
    return { total, done, inProgress, blocked, progress }
  }, [])

  const projectStatus = PROJECT_STATUS_META[PUBLIC_PROJECT.status] || PROJECT_STATUS_META.planning

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#ffffff',
        padding: 14,
        fontFamily: 'Manrope, Segoe UI, system-ui, sans-serif',
        color: '#1f2937',
      }}
    >
      <div style={{ width: '100%', margin: '0 auto', display: 'grid', gap: 14 }}>
        <header
          style={{
            border: '1px solid #334155',
            borderRadius: 18,
            background: 'linear-gradient(165deg, #1e293b 0%, #0f172a 100%)',
            padding: '16px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            boxShadow: '0 10px 26px rgba(2,6,23,0.42)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/Logo.png"
              alt="Bullwaves"
              style={{
                height: 28,
                width: 'auto',
                display: 'block',
                opacity: 0.95,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                flexShrink: 0,
              }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Project Management
              </h1>
              <div style={{ marginTop: 5, fontSize: 12, color: '#a5b4c7', fontWeight: 600 }}>
                Public read-only project snapshot
              </div>
            </div>
          </div>

          <a
            href="/share/ph-team-coverage"
            style={{
              textDecoration: 'none',
              border: '1px solid #1d4ed8',
              background: '#1d4ed8',
              color: '#ffffff',
              borderRadius: 999,
              padding: '9px 14px',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Open PH Calendar
          </a>
        </header>

        <section
          style={{
            border: '1px solid #6b7a90',
            borderRadius: 24,
            background:
              'linear-gradient(180deg, rgba(247,250,255,0.98) 0%, rgba(232,239,248,0.96) 100%)',
            padding: 18,
            boxShadow: '0 24px 50px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.7)',
            display: 'grid',
            gap: 16,
          }}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 26, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {PUBLIC_PROJECT.title}
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 999,
                  border: `1px solid ${projectStatus.border}`,
                  background: projectStatus.bg,
                  color: projectStatus.color,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {projectStatus.label}
              </span>
            </div>

            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, maxWidth: 760 }}>
              {PUBLIC_PROJECT.summary}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            {[
              { label: 'Total Tasks', value: String(stats.total) },
              { label: 'In Progress', value: String(stats.inProgress) },
              { label: 'Blocked', value: String(stats.blocked) },
              { label: 'Completion', value: `${stats.progress}%` },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: '1px solid #7a889c',
                  borderRadius: 16,
                  background: 'linear-gradient(180deg, #ffffff 0%, #f3f7fd 100%)',
                  padding: '12px 14px',
                  boxShadow: '0 8px 18px rgba(15,23,42,0.05)',
                }}
              >
                <div style={{ fontSize: 11, color: '#52657f', fontWeight: 700 }}>{item.label}</div>
                <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              border: '1px solid #7a889c',
              borderRadius: 18,
              background: 'linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%)',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{ fontSize: 10, fontWeight: 900, color: '#5c6f87', letterSpacing: '0.14em' }}
              >
                LAST UPDATED
              </div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                {PUBLIC_PROJECT.lastUpdated}
              </div>
            </div>
            <div>
              <div
                style={{ fontSize: 10, fontWeight: 900, color: '#5c6f87', letterSpacing: '0.14em' }}
              >
                PUBLIC SCOPE
              </div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: '#334155' }}>
                Single project snapshot only
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {SECTION_ORDER.map((section) => {
              const tasks = groupedTasks[section] || []
              if (!tasks.length) return null
              return (
                <div
                  key={section}
                  style={{
                    border: '1px solid #6b7a90',
                    borderRadius: 20,
                    background: 'linear-gradient(180deg, #fdfefe 0%, #f4f7fb 100%)',
                    overflow: 'hidden',
                    boxShadow: '0 14px 28px rgba(15,23,42,0.06)',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #c8d3e3',
                      background: 'linear-gradient(180deg, #edf3fb 0%, #e1e8f4 100%)',
                      fontSize: 13,
                      fontWeight: 900,
                      color: '#1f2f46',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {section}
                  </div>

                  <div style={{ display: 'grid', gap: 10, padding: 12 }}>
                    {tasks.map((task) => {
                      const status = TASK_STATUS_META[task.status] || TASK_STATUS_META.todo
                      return (
                        <div
                          key={task.id}
                          style={{
                            border: '1px solid #d2dceb',
                            borderRadius: 16,
                            background: '#ffffff',
                            padding: '12px 14px',
                            display: 'grid',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: '#0f172a',
                                lineHeight: 1.45,
                              }}
                            >
                              {task.title}
                            </div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                borderRadius: 999,
                                border: `1px solid ${status.border}`,
                                background: status.bg,
                                color: status.color,
                                padding: '5px 9px',
                                fontSize: 10,
                                fontWeight: 900,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {status.label}
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: '#5b6b80', fontWeight: 700 }}>
                            Owner: {task.owner}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
