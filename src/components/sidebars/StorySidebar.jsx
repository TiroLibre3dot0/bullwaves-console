import React, { useMemo } from 'react'
import RightSidebar from '../RightSidebar'

const EPICS = {
  Retention: {
    label: 'Retention',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.14)',
    border: 'rgba(245,158,11,0.30)',
  },
  Acquisition: {
    label: 'Acquisition',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.14)',
    border: 'rgba(16,185,129,0.30)',
  },
  Platform: {
    label: 'Platform',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.14)',
    border: 'rgba(139,92,246,0.30)',
  },
  Ops: {
    label: 'Ops',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.14)',
    border: 'rgba(239,68,68,0.30)',
  },
}

function clamp01(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

function resolveEpic(story) {
  const explicit = String(story?.epic || story?.pillar || story?.category || '').trim()
  if (explicit) {
    const key = Object.keys(EPICS).find((k) => k.toLowerCase() === explicit.toLowerCase())
    if (key) return EPICS[key]
  }
  const title = String(story?.title || '').toLowerCase()
  if (title.includes('retent') || title.includes('d30') || title.includes('ltv'))
    return EPICS.Retention
  if (title.includes('affiliate') || title.includes('acquis') || title.includes('traffic'))
    return EPICS.Acquisition
  if (title.includes('platform') || title.includes('infra') || title.includes('api'))
    return EPICS.Platform
  if (title.includes('ops') || title.includes('withdraw') || title.includes('compliance'))
    return EPICS.Ops
  return EPICS.Platform
}

function SectionCard({ title, children }) {
  return (
    <div
      className="card"
      style={{
        padding: 14,
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
      }}
    >
      <div
        style={{
          color: 'rgba(148,163,184,0.95)',
          fontSize: 11,
          fontWeight: 950,
          letterSpacing: 0.6,
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  )
}

function ProgressBar({ value }) {
  const v = clamp01(value)
  return (
    <div
      style={{
        height: 10,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.round(v * 100)}%`,
          height: '100%',
          background:
            'linear-gradient(90deg, rgba(59,130,246,0.70) 0%, rgba(34,211,238,0.60) 100%)',
          boxShadow: '0 0 18px rgba(34,211,238,0.25)',
        }}
      />
    </div>
  )
}

function normalizeStatus(s) {
  const x = String(s || '').trim()
  if (!x) return '—'
  return x
}

function riskTone(level) {
  const v = String(level || '').toLowerCase()
  if (v.includes('high') || v.includes('red')) return { label: 'High', color: '#ef4444' }
  if (v.includes('low') || v.includes('green')) return { label: 'Low', color: '#10b981' }
  return { label: 'Medium', color: '#f59e0b' }
}

function isDone(task) {
  const s = String(task?.status || task?.state || '').toLowerCase()
  return Boolean(task?.done) || s === 'done' || s === 'completed'
}

function impactRank(v) {
  const s = String(v || '').toLowerCase()
  if (s === 'high' || s === 'p0') return 0
  if (s === 'medium' || s === 'p1') return 1
  if (s === 'low' || s === 'p2') return 2
  return 9
}

export default function StorySidebar({
  open,
  story,
  onClose,
  onSelectTask,
  onOpenProjectBoard,
  onToggleTaskDone,
}) {
  const epic = useMemo(() => resolveEpic(story), [story])

  const tasks = useMemo(() => {
    const list = Array.isArray(story?.tasks)
      ? story.tasks
      : Array.isArray(story?.taskBreakdown)
        ? story.taskBreakdown.map((t, idx) => ({
            id: `${story?.id || 'story'}_tb_${idx}`,
            title: String(t),
            status: 'Todo',
          }))
        : []
    return [...list].sort((a, b) => impactRank(a.impact) - impactRank(b.impact))
  }, [story])

  const blockers = useMemo(() => {
    const list = Array.isArray(story?.blockers) ? story.blockers : []
    const alerts = Array.isArray(story?.alerts) ? story.alerts : []
    return [...list, ...alerts].filter(Boolean)
  }, [story])

  const decisions = useMemo(
    () => (Array.isArray(story?.decisions) ? story.decisions : []).filter(Boolean),
    [story]
  )

  const computedProgress = useMemo(() => {
    const explicit = story?.progress
    if (Number.isFinite(Number(explicit))) {
      const n = Number(explicit)
      return n > 1 ? clamp01(n / 100) : clamp01(n)
    }
    if (!tasks.length) return 0
    const doneCount = tasks.filter(isDone).length
    return doneCount / tasks.length
  }, [story, tasks])

  const risk = riskTone(story?.risk)
  const goal = String(story?.goal || story?.strategicObjective || story?.objective || '').trim()

  const kpis = useMemo(() => {
    const list = Array.isArray(story?.kpis) ? story.kpis : []
    const normalized = list
      .map((k) => ({
        label: String(k?.label || '').trim(),
        current: k?.current ?? '—',
        target: k?.target ?? '—',
      }))
      .filter((k) => k.label)

    if (normalized.length >= 3) return normalized.slice(0, 3)

    // Fallback: keep UI stable with 3 rows
    const seed = normalized.length
      ? normalized
      : [{ label: String(story?.kpi || 'Primary KPI'), current: '—', target: '—' }]
    while (seed.length < 3) seed.push({ label: 'KPI', current: '—', target: '—' })
    return seed.slice(0, 3)
  }, [story])

  if (!story) return null

  return (
    <RightSidebar open={open} onClose={onClose} width={460} ariaLabel="Story sidebar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header */}
        <div
          className="card"
          style={{
            padding: 14,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 999,
                padding: '6px 10px',
                border: `1px solid ${epic.border}`,
                background: epic.bg,
                color: epic.color,
                fontWeight: 950,
                fontSize: 11,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
            >
              {epic.label}
            </div>

            <button
              type="button"
              onClick={onOpenProjectBoard}
              style={{
                padding: '8px 10px',
                borderRadius: 12,
                fontWeight: 950,
                fontSize: 12,
                background: 'rgba(59,130,246,0.14)',
                border: '1px solid rgba(59,130,246,0.30)',
                color: 'rgba(226,232,240,0.92)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Open Project Board
            </button>
          </div>

          <div
            style={{
              marginTop: 10,
              color: 'rgba(241,245,249,0.96)',
              fontSize: 18,
              fontWeight: 980,
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
          >
            {story.title}
          </div>

          <div style={{ marginTop: 10 }}>
            <ProgressBar value={computedProgress} />
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                color: 'rgba(148,163,184,0.95)',
                fontSize: 12,
                fontWeight: 850,
              }}
            >
              <div>{Math.round(computedProgress * 100)}% progress</div>
              <div>Owner: {story.owner || '—'}</div>
            </div>
          </div>
        </div>

        {/* GOAL */}
        <SectionCard title="GOAL">
          <div
            style={{
              color: 'rgba(226,232,240,0.92)',
              fontSize: 13,
              fontWeight: 650,
              lineHeight: 1.4,
            }}
          >
            {goal || '—'}
          </div>
        </SectionCard>

        {/* KPI TARGET */}
        <SectionCard title="KPI TARGET">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kpis.map((k, idx) => (
              <div
                key={`${k.label}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    color: 'rgba(226,232,240,0.92)',
                    fontSize: 12,
                    fontWeight: 850,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {k.label}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'rgba(148,163,184,0.95)',
                    fontSize: 12,
                    fontWeight: 850,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{String(k.current)}</span>
                  <span style={{ color: 'rgba(226,232,240,0.35)' }}>→</span>
                  <span style={{ color: 'rgba(226,232,240,0.92)' }}>{String(k.target)}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* CURRENT STATUS */}
        <SectionCard title="CURRENT STATUS">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div
              className="card"
              style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 11, fontWeight: 950 }}>
                Progress
              </div>
              <div style={{ marginTop: 6, color: 'rgba(241,245,249,0.96)', fontWeight: 950 }}>
                {Math.round(computedProgress * 100)}%
              </div>
            </div>
            <div
              className="card"
              style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 11, fontWeight: 950 }}>
                Risk
              </div>
              <div style={{ marginTop: 6, color: risk.color, fontWeight: 980 }}>{risk.label}</div>
            </div>
            <div
              className="card"
              style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 11, fontWeight: 950 }}>
                Blockers
              </div>
              <div style={{ marginTop: 6, color: 'rgba(241,245,249,0.96)', fontWeight: 980 }}>
                {blockers.length}
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              color: 'rgba(148,163,184,0.95)',
              fontSize: 12,
              fontWeight: 850,
            }}
          >
            Status: {normalizeStatus(story.status)}
          </div>
        </SectionCard>

        {/* TASK LIST */}
        <SectionCard title="TASK LIST">
          {tasks.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map((task) => {
                const done = isDone(task)
                return (
                  <div
                    key={task.id || task.title}
                    className="card"
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      cursor: 'pointer',
                    }}
                    onClick={() => onSelectTask?.(task)}
                    title="Open task cockpit"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleTaskDone?.(task)
                      }}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: done ? 'rgba(16,185,129,0.20)' : 'rgba(255,255,255,0.04)',
                        boxShadow: done ? '0 0 18px rgba(16,185,129,0.18)' : 'none',
                        marginTop: 2,
                        cursor: 'pointer',
                        color: done ? '#10b981' : 'rgba(226,232,240,0.55)',
                        fontWeight: 950,
                        fontSize: 12,
                        lineHeight: '16px',
                      }}
                      aria-label={done ? 'Mark not done' : 'Mark done'}
                      title={done ? 'Mark not done' : 'Mark done'}
                    >
                      {done ? '✓' : ''}
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: done ? 'rgba(148,163,184,0.95)' : 'rgba(241,245,249,0.96)',
                          fontSize: 13,
                          fontWeight: 850,
                          textDecoration: done ? 'line-through' : 'none',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {task.title || task}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          color: 'rgba(148,163,184,0.9)',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {task.owner ? `Owner: ${task.owner}` : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 800 }}>—</div>
          )}
        </SectionCard>

        {/* BLOCKERS & ALERTS */}
        <SectionCard title="BLOCKERS & ALERTS">
          {blockers.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {blockers.map((b, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
                >
                  <div
                    style={{
                      color: 'rgba(241,245,249,0.92)',
                      fontSize: 13,
                      fontWeight: 750,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {String(b?.text || b)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 800 }}>
              No active blockers.
            </div>
          )}
        </SectionCard>

        {/* DECISION ZONE */}
        <SectionCard title="DECISION ZONE">
          {decisions.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {decisions.map((d, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
                >
                  <div
                    style={{
                      color: 'rgba(241,245,249,0.96)',
                      fontSize: 13,
                      fontWeight: 900,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {String(d?.text || d)}
                  </div>
                  {d?.owner || d?.due ? (
                    <div
                      style={{
                        marginTop: 6,
                        color: 'rgba(148,163,184,0.95)',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {d?.owner ? `Owner: ${d.owner}` : ''}
                      {d?.owner && d?.due ? ' • ' : ''}
                      {d?.due ? `Due: ${d.due}` : ''}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 800 }}>
              No decisions required.
            </div>
          )}
        </SectionCard>
      </div>
    </RightSidebar>
  )
}
