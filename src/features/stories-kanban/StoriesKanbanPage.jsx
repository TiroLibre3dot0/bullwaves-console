import React, { useEffect, useMemo, useRef, useState } from 'react'
import StorySidebar from '../../components/sidebars/StorySidebar'
import TaskSidebar from '../../components/sidebars/TaskSidebar'
import { fetchCsvRowsCached, withReportsVersion } from '../../lib/fetchCache'
import { useI18n } from '../../i18n/I18nContext'
import { seedStories } from './storiesSeed'

function laneKeyForStory(story) {
  const status = String(story?.status || '').toLowerCase()
  const risk = String(story?.risk || '').toLowerCase()
  const progress = Number(story?.progress)

  if (Number.isFinite(progress) && progress >= 0.95) return 'done'
  if (status.includes('done') || status.includes('complete')) return 'done'
  if (risk.includes('high') || status.includes('risk')) return 'atRisk'
  if (status.includes('execut') || status.includes('in progress') || status.includes('active'))
    return 'inProgress'
  return 'planned'
}

function storySort(a, b) {
  const ap = Number.isFinite(Number(a?.progress)) ? Number(a.progress) : 0
  const bp = Number.isFinite(Number(b?.progress)) ? Number(b.progress) : 0
  if (bp !== ap) return bp - ap
  return String(a?.title || '').localeCompare(String(b?.title || ''), undefined, {
    sensitivity: 'base',
  })
}

function formatInt(n, locale) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  try {
    return new Intl.NumberFormat(locale || undefined).format(Math.round(x))
  } catch {
    return String(Math.round(x))
  }
}

function formatCurrencyEUR(n, locale) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(x)
  } catch {
    return `€${Math.round(x)}`
  }
}

function numLoose(s) {
  return parseFloat(String(s || '').replace(/[^0-9\.-]/g, '')) || 0
}

function getValRow(r, keys) {
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(r, k)) return r[k]
  return ''
}

function mergeLocalizedStories(prev, locale) {
  const template = seedStories({ locale })
  const prevById = new Map((Array.isArray(prev) ? prev : []).map((s) => [s.id, s]))

  return (template || []).map((s) => {
    const prevStory = prevById.get(s.id)

    const prevTasks = new Map(
      (Array.isArray(prevStory?.tasks) ? prevStory.tasks : []).map((t) => [t.id, t])
    )
    const nextTasks = (Array.isArray(s.tasks) ? s.tasks : []).map((t) => {
      const prior = prevTasks.get(t.id)
      return prior ? { ...t, done: !!prior.done } : t
    })

    const prevKpis = new Map(
      (Array.isArray(prevStory?.kpis) ? prevStory.kpis : []).map((k) => [k.id, k])
    )
    const nextKpis = (Array.isArray(s.kpis) ? s.kpis : []).map((k) => {
      const prior = prevKpis.get(k.id)
      if (!prior) return k
      return {
        ...k,
        current: prior.current ?? k.current,
        target: prior.target ?? k.target,
      }
    })

    return {
      ...s,
      // Preserve runtime fields if anything else mutates them.
      progress: prevStory?.progress ?? s.progress,
      risk: prevStory?.risk ?? s.risk,
      status: prevStory?.status ?? s.status,
      kpis: nextKpis,
      tasks: nextTasks,
    }
  })
}

export default function StoriesKanbanPage({
  onOpenProjectBoard,
  embedded = false,
  publicMode = false,
  focusStoryId = null,
  focusNonce = 0,
}) {
  const { t, locale } = useI18n()
  const [stories, setStories] = useState(() => seedStories({ locale }))
  const [dockStoryId, setDockStoryId] = useState(null)
  const [dockTaskId, setDockTaskId] = useState(null)
  const [storyOpen, setStoryOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [pulseStoryId, setPulseStoryId] = useState(null)
  const rootRef = useRef(null)

  useEffect(() => {
    setStories((prev) => mergeLocalizedStories(prev, locale))
  }, [locale])

  // Real KPI wiring: reuse existing Fraud Monitoring KPIs.
  // Everything not yet calculated stays on standby (no example numbers).
  useEffect(() => {
    let cancelled = false

    const apply = async () => {
      try {
        // 1) Preferred: Media Report (same source used in Fraud Monitoring dashboard)
        let mediaFtd = null
        let mediaQftd = null
        let avgCpa = null
        let mediaTotalDeposits = null
        let mediaTotalWithdrawals = null
        let mediaTotalNetDeposits = null

        try {
          const mediaUrl = withReportsVersion('/Media Report.csv')
          const rows = await fetchCsvRowsCached(mediaUrl, { force: false })
          if (!cancelled && Array.isArray(rows) && rows.length) {
            let ftdSum = 0
            let qftdSum = 0
            let totalCpa = 0
            let totalDeposits = 0
            let totalWithdrawals = 0
            let totalNetDeposits = 0
            rows.forEach((r) => {
              ftdSum += numLoose(getValRow(r, ['FTD', 'Ftd', 'ftd', 'ftd_count']))
              qftdSum += numLoose(getValRow(r, ['QFTD', 'Qftd', 'qftd']))
              totalCpa += numLoose(
                getValRow(r, [
                  'CPA Commission',
                  'CPA_Commission',
                  'cpa_commission',
                  'cpa commission',
                ])
              )
              totalDeposits += numLoose(getValRow(r, ['Deposits', 'deposits']))
              totalWithdrawals += numLoose(getValRow(r, ['Withdrawals', 'withdrawals']))
              totalNetDeposits += numLoose(
                getValRow(r, [
                  'Net Deposits',
                  'Net_Deposits',
                  'net_deposits',
                  'netDeposits',
                  'NetDeposits',
                ])
              )
            })
            mediaFtd = ftdSum
            mediaQftd = qftdSum
            avgCpa = ftdSum > 0 ? totalCpa / ftdSum : null
            mediaTotalDeposits = totalDeposits
            mediaTotalWithdrawals = totalWithdrawals
            mediaTotalNetDeposits = totalNetDeposits
          }
        } catch {
          // ignore; fallback to summary below
        }

        // 2) Fallback: Fraud monitor summary JSON
        let summaryFtd = null
        let summaryQftd = null
        try {
          const url = withReportsVersion('/fraud_monitor_summary.json')
          const res = await fetch(url, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const summary = data?.summary || {}
            summaryFtd = summary?.users_with_ftd
            summaryQftd = summary?.users_with_qftd
          }
        } catch {
          // ignore
        }

        if (cancelled) return

        const ftd =
          Number.isFinite(Number(mediaFtd)) && Number(mediaFtd) > 0 ? mediaFtd : summaryFtd
        const qftd =
          Number.isFinite(Number(mediaQftd)) && Number(mediaQftd) > 0 ? mediaQftd : summaryQftd

        if (
          !Number.isFinite(Number(ftd)) &&
          !Number.isFinite(Number(qftd)) &&
          !Number.isFinite(Number(avgCpa)) &&
          !Number.isFinite(Number(mediaTotalDeposits)) &&
          !Number.isFinite(Number(mediaTotalWithdrawals)) &&
          !Number.isFinite(Number(mediaTotalNetDeposits))
        ) {
          return
        }

        setStories((prev) =>
          (prev || []).map((s) => {
            if (s.id !== 'story-growth-acq' && s.id !== 'story-retention-prop') return s
            const nextKpis = (Array.isArray(s.kpis) ? s.kpis : []).map((k) => {
              const id = String(k?.id || '')

              // Growth
              if (s.id === 'story-growth-acq') {
                if (id === 'ftd') return { ...k, current: formatInt(ftd, locale) }
                if (id === 'qftd') return { ...k, current: formatInt(qftd, locale) }
                if (id === 'cpa')
                  return {
                    ...k,
                    current: Number.isFinite(Number(avgCpa))
                      ? formatCurrencyEUR(avgCpa, locale)
                      : '—',
                  }
                return k
              }

              // Retention (from Media Report totals)
              if (s.id === 'story-retention-prop') {
                if (id === 'nd')
                  return {
                    ...k,
                    current: Number.isFinite(Number(mediaTotalNetDeposits))
                      ? formatCurrencyEUR(mediaTotalNetDeposits, locale)
                      : '—',
                  }
                if (id === 'dep')
                  return {
                    ...k,
                    current: Number.isFinite(Number(mediaTotalDeposits))
                      ? formatCurrencyEUR(mediaTotalDeposits, locale)
                      : '—',
                  }
                if (id === 'wd')
                  return {
                    ...k,
                    current: Number.isFinite(Number(mediaTotalWithdrawals))
                      ? formatCurrencyEUR(mediaTotalWithdrawals, locale)
                      : '—',
                  }
                return k
              }

              return k
            })
            return { ...s, kpis: nextKpis }
          })
        )
      } catch {
        // Keep KPI placeholders if the summary isn't available.
      }
    }

    apply()
    return () => {
      cancelled = true
    }
  }, [locale])

  const lanes = useMemo(() => {
    const buckets = { planned: [], inProgress: [], atRisk: [], done: [] }
    for (const s of stories || []) {
      const key = laneKeyForStory(s)
      buckets[key] = [...(buckets[key] || []), s]
    }
    return {
      planned: (buckets.planned || []).sort(storySort),
      inProgress: (buckets.inProgress || []).sort(storySort),
      atRisk: (buckets.atRisk || []).sort(storySort),
      done: (buckets.done || []).sort(storySort),
    }
  }, [stories])

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

  // Option A: Story continuity/handoff.
  // When a story is clicked in the cockpit, Execution Hub switches here and passes focusStoryId.
  // We open the same story, scroll it into view, and briefly highlight it.
  useEffect(() => {
    const sid = typeof focusStoryId === 'string' ? focusStoryId : null
    if (!sid) return

    openStory(sid)
    setPulseStoryId(sid)

    const tryScroll = () => {
      const root = rootRef.current
      if (!root) return false
      const el = root.querySelector(`[data-story-id="${sid}"]`)
      if (!el || typeof el.scrollIntoView !== 'function') return false
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      } catch {
        // ignore
      }
      return true
    }

    // Tabs are kept mounted but may be display:none; schedule a couple attempts.
    const t1 = window.setTimeout(() => {
      const ok = tryScroll()
      if (!ok) window.setTimeout(() => tryScroll(), 120)
    }, 60)

    const t2 = window.setTimeout(() => setPulseStoryId(null), 1600)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
    // focusNonce lets us re-trigger even if the same story is clicked twice.
  }, [focusStoryId, focusNonce])

  const closeStory = () => {
    setStoryOpen(false)
    // Keep the selected story docked so its card stays highlighted.
    setTaskOpen(false)
    window.setTimeout(() => {
      setDockTaskId(null)
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
      <div ref={rootRef} className="sk-root" style={{ flex: 1, padding: 24 }}>
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
              {t('storiesKanban.topline')}
            </div>
            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: '#fff' }}>
              {t('storiesKanban.title')}
            </div>
            <div
              style={{
                marginTop: 6,
                color: 'rgba(148,163,184,0.95)',
                fontWeight: 650,
                fontSize: 12,
              }}
            >
              {t('storiesKanban.subtitle')}
            </div>
          </>
        )}

        <div className="sk-board" style={{ marginTop: 16 }}>
          {[
            {
              key: 'planned',
              title: t('storiesKanban.lanes.planned'),
              tone: { border: 'rgba(148,163,184,0.22)', bg: 'rgba(148,163,184,0.06)' },
              items: lanes.planned,
            },
            {
              key: 'inProgress',
              title: t('storiesKanban.lanes.inProgress'),
              tone: { border: 'rgba(59,130,246,0.30)', bg: 'rgba(59,130,246,0.08)' },
              items: lanes.inProgress,
            },
            {
              key: 'atRisk',
              title: t('storiesKanban.lanes.atRisk'),
              tone: { border: 'rgba(239,68,68,0.30)', bg: 'rgba(239,68,68,0.08)' },
              items: lanes.atRisk,
            },
            {
              key: 'done',
              title: t('storiesKanban.lanes.done'),
              tone: { border: 'rgba(16,185,129,0.30)', bg: 'rgba(16,185,129,0.08)' },
              items: lanes.done,
            },
          ].map((col) => (
            <div
              key={col.key}
              className="sk-col card"
              style={{
                padding: 12,
                borderRadius: 16,
                border: `1px solid ${col.tone.border}`,
                background: col.tone.bg,
                boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    color: 'rgba(226,232,240,0.96)',
                    fontWeight: 950,
                    fontSize: 12,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}
                >
                  {col.title}
                </div>
                <div
                  style={{
                    color: 'rgba(148,163,184,0.95)',
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {col.items?.length || 0}
                </div>
              </div>

              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(col.items || []).map((story) =>
                  (() => {
                    const isPulse = story.id === pulseStoryId
                    const isSelected = story.id === dockStoryId

                    return (
                      <button
                        key={story.id}
                        type="button"
                        data-story-id={story.id}
                        className={`card sk-card${isSelected ? ' sk-selected' : ''}${
                          isPulse ? ' sk-handoff' : ''
                        }`}
                        onClick={() => {
                          openStory(story.id)
                        }}
                        style={{
                          textAlign: 'left',
                          width: '100%',
                          padding: 12,
                          borderRadius: 14,
                          border:
                            isPulse || isSelected
                              ? '1px solid rgba(226,232,240,0.85)'
                              : '1px solid rgba(255,255,255,0.08)',
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                          boxShadow:
                            isPulse || isSelected
                              ? '0 18px 52px rgba(0,0,0,0.45)'
                              : '0 10px 24px rgba(0,0,0,0.18)',
                          cursor: 'pointer',
                          transform: isPulse ? 'translateY(-1px)' : 'translateY(0px)',
                          transition:
                            'box-shadow 220ms ease, border-color 220ms ease, transform 220ms ease',
                        }}
                        title={story.title}
                      >
                        <div
                          className="sk-card-title"
                          style={{
                            color: 'rgba(226,232,240,0.96)',
                            fontWeight: 950,
                            fontSize: 13,
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
                            fontWeight: 750,
                          }}
                        >
                          {t('storiesKanban.ownerLabel')}: {story.owner || '—'}
                        </div>
                        <div
                          className="sk-card-goal"
                          style={{
                            marginTop: 6,
                            color: 'rgba(148,163,184,0.82)',
                            fontSize: 12,
                            fontWeight: 650,
                            lineHeight: 1.3,
                          }}
                        >
                          {String(story.goal || '').slice(0, 90)}
                          {String(story.goal || '').length > 90 ? '…' : ''}
                        </div>
                      </button>
                    )
                  })()
                )}
                {(col.items || []).length ? null : (
                  <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 800 }}>
                    —
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .sk-board {
          display: grid;
          grid-template-columns: repeat(4, minmax(260px, 1fr));
          gap: 12px;
          align-items: start;
        }

        @keyframes skHandoffPulse {
          0% { box-shadow: 0 0 0 rgba(0,0,0,0); }
          40% { box-shadow: 0 0 0 6px rgba(226,232,240,0.22); }
          100% { box-shadow: 0 0 0 0 rgba(226,232,240,0.00); }
        }

        .sk-handoff {
          animation: skHandoffPulse 1100ms ease-out 1;
        }

        .sk-selected {
          position: relative;
        }

        .sk-selected::before {
          content: '';
          position: absolute;
          inset: 0;
          border-left: 3px solid rgba(226,232,240,0.70);
          background: rgba(226,232,240,0.05);
          border-radius: 14px;
          pointer-events: none;
        }

        @media (max-width: 720px) {
          .sk-root { padding: 14px !important; }
          .sk-card { padding: 12px !important; border-radius: 14px !important; }
          .sk-card-title { font-size: 13px !important; line-height: 1.15 !important; }
          .sk-card-owner { margin-top: 6px !important; font-size: 11px !important; }
          .sk-card-goal { margin-top: 4px !important; font-size: 11px !important; line-height: 1.25 !important; }

          .sk-board {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 6px;
            -webkit-overflow-scrolling: touch;
          }

          .sk-col {
            min-width: 280px;
            flex: 0 0 auto;
          }
        }
      `}</style>

      {/* Sidebars (right) */}
      <StorySidebar
        open={Boolean(selectedStory) && storyOpen}
        story={selectedStory}
        publicMode={publicMode}
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
