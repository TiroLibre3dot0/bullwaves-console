import React, { useEffect, useMemo, useState } from 'react'
import StorySidebar from '../../components/sidebars/StorySidebar'
import TaskSidebar from '../../components/sidebars/TaskSidebar'
import { fetchCsvRowsCached, withReportsVersion } from '../../lib/fetchCache'
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

function formatInt(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  try {
    return new Intl.NumberFormat().format(Math.round(x))
  } catch {
    return String(Math.round(x))
  }
}

function formatCurrencyEUR(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  try {
    return new Intl.NumberFormat(undefined, {
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
              const label = String(k?.label || '').toLowerCase()

              // Growth
              if (s.id === 'story-growth-acq') {
                if (label.includes('(ftd)')) return { ...k, current: formatInt(ftd) }
                if (label.includes('(qftd)')) return { ...k, current: formatInt(qftd) }
                if (label.includes('(cpa)'))
                  return {
                    ...k,
                    current: Number.isFinite(Number(avgCpa)) ? formatCurrencyEUR(avgCpa) : '—',
                  }
                return k
              }

              // Retention (from Media Report totals)
              if (s.id === 'story-retention-prop') {
                if (label.includes('(nd)'))
                  return {
                    ...k,
                    current: Number.isFinite(Number(mediaTotalNetDeposits))
                      ? formatCurrencyEUR(mediaTotalNetDeposits)
                      : '—',
                  }
                if (label.includes('(dep)'))
                  return {
                    ...k,
                    current: Number.isFinite(Number(mediaTotalDeposits))
                      ? formatCurrencyEUR(mediaTotalDeposits)
                      : '—',
                  }
                if (label.includes('(wd)'))
                  return {
                    ...k,
                    current: Number.isFinite(Number(mediaTotalWithdrawals))
                      ? formatCurrencyEUR(mediaTotalWithdrawals)
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
  }, [])

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

        <div className="sk-board" style={{ marginTop: 16 }}>
          {[
            {
              key: 'planned',
              title: 'Planned',
              tone: { border: 'rgba(148,163,184,0.22)', bg: 'rgba(148,163,184,0.06)' },
              items: lanes.planned,
            },
            {
              key: 'inProgress',
              title: 'In Progress',
              tone: { border: 'rgba(59,130,246,0.30)', bg: 'rgba(59,130,246,0.08)' },
              items: lanes.inProgress,
            },
            {
              key: 'atRisk',
              title: 'At Risk',
              tone: { border: 'rgba(239,68,68,0.30)', bg: 'rgba(239,68,68,0.08)' },
              items: lanes.atRisk,
            },
            {
              key: 'done',
              title: 'Done',
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
                {(col.items || []).map((story) => (
                  <button
                    key={story.id}
                    type="button"
                    className="card sk-card"
                    onClick={() => {
                      openStory(story.id)
                    }}
                    style={{
                      textAlign: 'left',
                      width: '100%',
                      padding: 12,
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                      boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                      cursor: 'pointer',
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
                      Owner: {story.owner || '—'}
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
                ))}
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
