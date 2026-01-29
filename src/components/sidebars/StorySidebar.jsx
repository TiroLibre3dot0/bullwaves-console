import React, { useMemo } from 'react'
import RightSidebar from '../RightSidebar'
import { useI18n } from '../../i18n/I18nContext'

const EPICS = {
  Retention: {
    key: 'Retention',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.14)',
    border: 'rgba(245,158,11,0.30)',
  },
  Acquisition: {
    key: 'Acquisition',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.14)',
    border: 'rgba(16,185,129,0.30)',
  },
  Platform: {
    key: 'Platform',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.14)',
    border: 'rgba(139,92,246,0.30)',
  },
  Ops: {
    key: 'Ops',
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
  if (v.includes('high') || v.includes('red')) return { key: 'high', color: '#ef4444' }
  if (v.includes('low') || v.includes('green')) return { key: 'low', color: '#10b981' }
  return { key: 'medium', color: '#f59e0b' }
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
  publicMode = false,
}) {
  const { t } = useI18n()
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

  const projectBoardFocus = useMemo(() => {
    if (!story) return null
    const titles = (tasks || []).map((t) => String(t?.title || t || '').trim()).filter(Boolean)
    return {
      storyId: String(story?.id || ''),
      storyTitle: String(story?.title || '').trim(),
      storyEpic: String(story?.epic || story?.pillar || story?.category || '').trim(),
      taskTitles: titles,
    }
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
      : [{ label: String(story?.kpi || t('storySidebar.primaryKpi')), current: '—', target: '—' }]
    while (seed.length < 3)
      seed.push({ label: t('storySidebar.kpiRow'), current: '—', target: '—' })
    return seed.slice(0, 3)
  }, [story, t])

  const sensitiveStyle = useMemo(
    () => ({
      filter: 'blur(7px)',
      opacity: 0.32,
      userSelect: 'none',
    }),
    []
  )

  const renderSensitive = (v) => {
    const txt = String(v ?? '—')
    if (!publicMode) return txt
    if (!txt || txt === '—') return txt
    return <span style={sensitiveStyle}>{txt}</span>
  }

  if (!story) return null

  return (
    <RightSidebar open={open} onClose={onClose} width={460} ariaLabel={t('storySidebar.ariaLabel')}>
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
              {t(`epics.${epic.key}`)}
            </div>

            <button
              type="button"
              onClick={() => {
                if (!onOpenProjectBoard) return
                onOpenProjectBoard(projectBoardFocus)
              }}
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
              {t('storySidebar.openTasks')}
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
              <div>{t('common.progressPct', { pct: Math.round(computedProgress * 100) })}</div>
              <div>
                {t('common.owner')}: {story.owner || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* GOAL */}
        <SectionCard title={t('storySidebar.sections.goal')}>
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
        <SectionCard title={t('storySidebar.sections.kpiTarget')}>
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
                  <span>{renderSensitive(k.current)}</span>
                  <span style={{ color: 'rgba(226,232,240,0.35)' }}>→</span>
                  <span style={{ color: 'rgba(226,232,240,0.92)' }}>
                    {renderSensitive(k.target)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* CURRENT STATUS */}
        <SectionCard title={t('storySidebar.sections.currentStatus')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div
              className="card"
              style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 11, fontWeight: 950 }}>
                {t('storySidebar.status.progress')}
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
                {t('storySidebar.status.risk')}
              </div>
              <div style={{ marginTop: 6, color: risk.color, fontWeight: 980 }}>
                {t(`common.risk.${risk.key}`)}
              </div>
            </div>
            <div
              className="card"
              style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 11, fontWeight: 950 }}>
                {t('storySidebar.status.blockers')}
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
            {t('storySidebar.status.statusLabel')}: {normalizeStatus(story.status)}
          </div>
        </SectionCard>

        {/* TASK LIST */}
        <SectionCard title={t('storySidebar.sections.taskList')}>
          {tasks.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map((task) => {
                const done = isDone(task)
                const success = String(
                  task?.success || task?.metric || task?.context || task?.summary || ''
                ).trim()
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
                    title={t('storySidebar.task.openCockpit')}
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
                      aria-label={done ? t('common.markNotDone') : t('common.markDone')}
                      title={done ? t('common.markNotDone') : t('common.markDone')}
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
                      {success ? (
                        <div
                          style={{
                            marginTop: 4,
                            color: 'rgba(148,163,184,0.82)',
                            fontSize: 12,
                            fontWeight: 750,
                            fontStyle: 'italic',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {success}
                        </div>
                      ) : null}
                      <div
                        style={{
                          marginTop: success ? 6 : 4,
                          color: 'rgba(148,163,184,0.9)',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {task.owner ? `${t('common.owner')}: ${task.owner}` : ''}
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
        <SectionCard title={t('storySidebar.sections.blockersAlerts')}>
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
              {t('storySidebar.empty.noBlockers')}
            </div>
          )}
        </SectionCard>

        {/* DECISION ZONE */}
        <SectionCard title={t('storySidebar.sections.decisionZone')}>
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
                      {d?.owner ? `${t('common.owner')}: ${d.owner}` : ''}
                      {d?.owner && d?.due ? ' • ' : ''}
                      {d?.due ? `${t('common.due')}: ${d.due}` : ''}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 800 }}>
              {t('storySidebar.empty.noDecisions')}
            </div>
          )}
        </SectionCard>
      </div>
    </RightSidebar>
  )
}
