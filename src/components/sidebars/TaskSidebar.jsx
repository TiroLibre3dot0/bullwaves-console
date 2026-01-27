import React, { useEffect, useMemo, useRef, useState } from 'react'
import RightSidebar from '../RightSidebar'

function clamp01(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
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
            'linear-gradient(90deg, rgba(16,185,129,0.60) 0%, rgba(59,130,246,0.55) 100%)',
          boxShadow: '0 0 18px rgba(59,130,246,0.20)',
        }}
      />
    </div>
  )
}

function isDone(x) {
  const s = String(x?.status || '').toLowerCase()
  return Boolean(x?.done) || s === 'done' || s === 'completed'
}

function computeProgress(task) {
  const explicit = task?.progress
  if (Number.isFinite(Number(explicit))) {
    const n = Number(explicit)
    return n > 1 ? clamp01(n / 100) : clamp01(n)
  }
  const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : []
  if (!subtasks.length) return 0
  const done = subtasks.filter(isDone).length
  return done / subtasks.length
}

function storageKey(taskId) {
  return `bw_task_comments:${String(taskId || 'unknown')}`
}

export default function TaskSidebar({
  open,
  task,
  parentStory,
  onClose,
  onBackToStory,
  onToggleSubtaskDone,
  readOnly = false,
  onOpenProjectBoard,
}) {
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const inputRef = useRef(null)

  const progress = useMemo(() => computeProgress(task), [task])

  const contextText = String(
    task?.context || task?.summary || task?.problemSolved || task?.description || ''
  ).trim()
  const eta = String(task?.eta || task?.due || task?.deadline || '—').trim() || '—'
  const dependencies = useMemo(() => {
    const d = task?.dependencies
    if (Array.isArray(d)) return d
    if (typeof d === 'string' && d.trim()) return [d.trim()]
    return []
  }, [task])

  const links = useMemo(() => {
    const l = task?.links
    if (Array.isArray(l)) return l
    return []
  }, [task])

  const subtasks = useMemo(() => {
    if (Array.isArray(task?.subtasks)) return task.subtasks
    if (Array.isArray(task?.taskBreakdown))
      return task.taskBreakdown.map((t, idx) => ({
        id: `${task?.id || 'task'}_tb_${idx}`,
        title: String(t),
        status: 'Todo',
      }))
    return []
  }, [task])

  useEffect(() => {
    if (!open || !task?.id) return
    try {
      const raw = window.localStorage.getItem(storageKey(task.id))
      const parsed = raw ? JSON.parse(raw) : []
      setComments(Array.isArray(parsed) ? parsed : [])
    } catch {
      setComments([])
    }
  }, [open, task?.id])

  const persistComments = (next) => {
    setComments(next)
    try {
      if (!task?.id) return
      window.localStorage.setItem(storageKey(task.id), JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const addComment = () => {
    const text = String(commentText || '').trim()
    if (!text) return
    const next = [
      {
        id: `c_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        text,
        at: new Date().toISOString(),
      },
      ...comments,
    ]
    persistComments(next)
    setCommentText('')
    inputRef.current?.focus?.()
  }

  if (!open || !task) return null

  return (
    <RightSidebar open={open} onClose={onClose} width={460} ariaLabel="Task sidebar">
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
              justifyContent: 'space-between',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 950 }}>
                Task
              </div>
              <div
                style={{
                  marginTop: 4,
                  color: 'rgba(241,245,249,0.96)',
                  fontSize: 18,
                  fontWeight: 980,
                  lineHeight: 1.15,
                  overflowWrap: 'anywhere',
                }}
              >
                {task.title}
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                {parentStory?.title ? (
                  <button
                    type="button"
                    onClick={onBackToStory}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(226,232,240,0.92)',
                      fontWeight: 900,
                      fontSize: 12,
                      cursor: 'pointer',
                      maxWidth: '100%',
                    }}
                    title="Back to story cockpit"
                  >
                    ← {parentStory.title}
                  </button>
                ) : null}

                {onOpenProjectBoard ? (
                  <button
                    type="button"
                    onClick={onOpenProjectBoard}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: 'rgba(59,130,246,0.14)',
                      border: '1px solid rgba(59,130,246,0.30)',
                      color: 'rgba(226,232,240,0.92)',
                      fontWeight: 900,
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Open Board
                  </button>
                ) : null}

                <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 850 }}>
                  Owner: {task.owner || '—'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <ProgressBar value={progress} />
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
              <div>{Math.round(progress * 100)}% progress</div>
              <div>ETA: {eta}</div>
            </div>
          </div>
        </div>

        {/* CONTEXT */}
        <SectionCard title="CONTEXT">
          <div
            style={{
              color: 'rgba(226,232,240,0.92)',
              fontSize: 13,
              fontWeight: 650,
              lineHeight: 1.4,
            }}
          >
            {contextText ? contextText.split(/\n+/).slice(0, 3).join(' ') : '—'}
          </div>
        </SectionCard>

        {/* STATUS */}
        <SectionCard title="STATUS">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div
              className="card"
              style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 11, fontWeight: 950 }}>
                Progress
              </div>
              <div style={{ marginTop: 6, color: 'rgba(241,245,249,0.96)', fontWeight: 950 }}>
                {Math.round(progress * 100)}%
              </div>
            </div>
            <div
              className="card"
              style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 11, fontWeight: 950 }}>
                ETA
              </div>
              <div style={{ marginTop: 6, color: 'rgba(241,245,249,0.96)', fontWeight: 950 }}>
                {eta}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div
              style={{
                color: 'rgba(148,163,184,0.95)',
                fontSize: 11,
                fontWeight: 950,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Dependencies
            </div>
            {dependencies.length ? (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dependencies.map((d, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div
                      style={{
                        color: 'rgba(226,232,240,0.92)',
                        fontSize: 13,
                        fontWeight: 750,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {String(d)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  marginTop: 6,
                  color: 'rgba(148,163,184,0.95)',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                —
              </div>
            )}
          </div>
        </SectionCard>

        {/* SUBTASKS */}
        <SectionCard title="SUBTASKS">
          {subtasks.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {subtasks.map((st) => {
                const done = isDone(st)
                return (
                  <div
                    key={st.id || st.title}
                    className="card"
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                    }}
                  >
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => onToggleSubtaskDone?.(st)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: done ? 'rgba(16,185,129,0.20)' : 'rgba(255,255,255,0.04)',
                        boxShadow: done ? '0 0 18px rgba(16,185,129,0.18)' : 'none',
                        marginTop: 2,
                        cursor: readOnly ? 'not-allowed' : 'pointer',
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
                        {st.title}
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

        {/* LINKS */}
        <SectionCard title="LINKS">
          {links.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map((l, idx) => (
                <a
                  key={idx}
                  href={l?.url || l}
                  target="_blank"
                  rel="noreferrer"
                  className="card"
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                    color: 'rgba(226,232,240,0.92)',
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 13 }}>
                    {String(l?.label || l?.title || 'Link')}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      color: 'rgba(148,163,184,0.95)',
                      fontSize: 12,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {String(l?.url || l)}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 800 }}>—</div>
          )}
        </SectionCard>

        {/* COMMENTS */}
        <SectionCard title="COMMENTS">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={readOnly ? 'Read-only' : 'Write a comment…'}
              disabled={readOnly}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addComment()
                }
              }}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(226,232,240,0.92)',
                fontWeight: 650,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="button"
              disabled={readOnly}
              onClick={addComment}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                fontWeight: 950,
                fontSize: 12,
                background: 'rgba(59,130,246,0.14)',
                border: '1px solid rgba(59,130,246,0.30)',
                color: 'rgba(226,232,240,0.92)',
                cursor: readOnly ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Send
            </button>
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.length ? (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="card"
                  style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
                >
                  <div
                    style={{
                      color: 'rgba(226,232,240,0.92)',
                      fontSize: 13,
                      fontWeight: 750,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {c.text}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      color: 'rgba(148,163,184,0.95)',
                      fontSize: 11,
                      fontWeight: 850,
                    }}
                  >
                    {new Date(c.at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, fontWeight: 800 }}>
                No comments yet.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </RightSidebar>
  )
}
