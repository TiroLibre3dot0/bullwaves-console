import React, { useEffect, useMemo, useRef, useState } from 'react'
import FullPageLoader from '../../../components/FullPageLoader'
import LanguageSelect from '../../../components/LanguageSelect'
import TrustpilotGuidePage from './TrustpilotGuidePage'
import { useI18n } from '../../../i18n/I18nContext'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'
import { trackPublicShareOpen } from '../../../utils/analytics'

const TRACKED_FIELDS = [
  'reviewSummary',
  'issueType',
  'actionNeeded',
  'assignedTo',
  'status',
  'contacted',
  'contactChannel',
  'contactOutcome',
  'clientSentiment',
  'mainIssue',
  'actionTaken',
  'reviewStatus',
  'followUpNeeded',
  'additionalNotes',
]

function normalizeText(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim()
}

function parseReviewDate(input) {
  const str = String(input || '').trim()
  if (!str) return null

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\D.*)?$/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day)
      if (
        !Number.isNaN(d.getTime()) &&
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
      ) {
        return d
      }
    }
  }

  const match = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:\D.*)?$/)
  if (match) {
    const a = Number(match[1])
    const b = Number(match[2])
    let year = Number(match[3])
    if (year < 100) year += 2000

    let day = a
    let month = b
    if (a <= 12 && b > 12) {
      day = b
      month = a
    } else if (a > 12 && b <= 12) {
      day = a
      month = b
    } else {
      day = a
      month = b
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day)
      if (
        !Number.isNaN(d.getTime()) &&
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
      ) {
        return d
      }
    }
  }

  const direct = new Date(str)
  if (!Number.isNaN(direct.getTime())) return direct

  return null
}

function toDateKey(value) {
  const d = value instanceof Date ? value : parseReviewDate(value)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isTruthyFlag(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase()
  if (!v) return false
  return ['yes', 'si', 'true', '1', 'done', 'completed', 'contacted'].includes(v)
}

function compactValue(value, max = 58) {
  const text = normalizeText(value)
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max - 3)}...` : text
}

function buildSnapshot(rows) {
  const out = {}
  for (const row of Array.isArray(rows) ? rows : []) {
    const line = Number(row?.reviewLine)
    if (!Number.isFinite(line)) continue
    const item = {}
    for (const field of TRACKED_FIELDS) item[field] = normalizeText(row?.[field])
    out[String(line)] = item
  }
  return out
}

function diffSnapshots(prevSnapshot, nextSnapshot) {
  const prev = prevSnapshot && typeof prevSnapshot === 'object' ? prevSnapshot : {}
  const next = nextSnapshot && typeof nextSnapshot === 'object' ? nextSnapshot : {}
  const lineKeys = new Set([...Object.keys(prev), ...Object.keys(next)])

  let changedRows = 0
  let changedFields = 0
  const highlights = []

  for (const lineKey of lineKeys) {
    const prevRow = prev[lineKey] || {}
    const nextRow = next[lineKey] || {}
    let rowChanged = false

    for (const field of TRACKED_FIELDS) {
      const before = normalizeText(prevRow[field])
      const after = normalizeText(nextRow[field])
      if (before === after) continue

      changedFields += 1
      rowChanged = true

      if (highlights.length < 3) {
        highlights.push({ reviewLine: Number(lineKey), field, before, after })
      }
    }

    if (rowChanged) changedRows += 1
  }

  return { changedRows, changedFields, highlights }
}

function isShareToken(value) {
  const clean = String(value || '').trim()
  return (clean.startsWith('share_') || clean.startsWith('share_local_')) && clean.length <= 96
}

export default function PublicTrustpilotGuideSharePage({ token = '' }) {
  const { t, locale } = useI18n()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readById, setReadById] = useState({})
  const [updateSummary, setUpdateSummary] = useState({
    changedRows: 0,
    changedFields: 0,
    highlights: [],
  })
  const notificationsWrapRef = useRef(null)

  const cleanToken = useMemo(() => String(token || '').trim(), [token])

  useEffect(() => {
    setOpenGraphMeta({
      title: 'Trustpilot Guide - Public Share',
      description: 'Read-only Trustpilot operational guide.',
      image: '/Logo.png',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })
    return () => resetOpenGraphMeta()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')
        setPayload(null)

        if (!cleanToken || !isShareToken(cleanToken)) {
          throw new Error('Invalid or missing share token')
        }

        if (cleanToken.startsWith('share_local_')) {
          const raw = window.localStorage.getItem(`bw_share_trustpilot_guide:${cleanToken}`)
          const parsed = raw ? JSON.parse(raw) : null
          const localPayload = parsed?.payload
          if (!localPayload) throw new Error('Missing local share snapshot')
          if (!cancelled) setPayload(localPayload)
          return
        }

        const resp = await fetch(`/api/share/trustpilot-guide/${encodeURIComponent(cleanToken)}`)
        const data = await resp.json().catch(() => null)
        const remotePayload = data?.payload

        if (!resp.ok || !data?.ok || !remotePayload) {
          throw new Error(data?.error || data?.message || 'Failed to load share')
        }

        if (!cancelled) setPayload(remotePayload)
      } catch (e) {
        if (!cancelled) {
          setPayload(null)
          setError(e?.message || 'Unable to load public share')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [cleanToken])

  const isValid = payload && payload.k === 'tpguide' && payload.v === 1
  const rows = useMemo(() => (Array.isArray(payload?.rows) ? payload.rows : []), [payload])

  const dailyUpdate = useMemo(() => {
    const datedRows = rows
      .map((row) => ({ row, date: parseReviewDate(row?.dateReviewed) }))
      .filter((x) => x.date)

    if (!datedRows.length) return null

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const eligibleRows = datedRows.filter((x) => x.date.getTime() <= today.getTime())
    const referenceRows = eligibleRows.length ? eligibleRows : datedRows

    const latestMs = Math.max(...referenceRows.map((x) => x.date.getTime()))
    const latestDate = new Date(latestMs)
    const dateKey = toDateKey(latestDate)
    const rowsOnLatestDay = referenceRows
      .filter((x) => toDateKey(x.date) === dateKey)
      .map((x) => x.row)

    const contactedCount = rowsOnLatestDay.filter((row) => isTruthyFlag(row?.contacted)).length
    const pendingCount = rowsOnLatestDay.filter((row) => {
      const followUpNeeded = String(row?.followUpNeeded || '')
        .toLowerCase()
        .trim()
      const reviewStatus = String(row?.reviewStatus || '')
        .toLowerCase()
        .trim()
      return (
        followUpNeeded.includes('yes') ||
        followUpNeeded.includes('si') ||
        reviewStatus.includes('pending') ||
        reviewStatus.includes('escalat')
      )
    }).length
    const completedCount = rowsOnLatestDay.filter((row) => {
      const reviewStatus = String(row?.reviewStatus || '')
        .toLowerCase()
        .trim()
      return (
        reviewStatus.includes('closed') ||
        reviewStatus.includes('reviewed') ||
        reviewStatus.includes('replied') ||
        reviewStatus.includes('resolved')
      )
    }).length

    return {
      dateKey,
      dateLabel: latestDate.toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB'),
      rows: rowsOnLatestDay.length,
      contactedCount,
      pendingCount,
      completedCount,
    }
  }, [rows, locale])

  const text = useMemo(() => {
    if (locale === 'it') {
      return {
        title: 'Notifiche',
        empty: 'Nessuna notifica da leggere.',
        read: 'Letta',
        unread: 'Da leggere',
        markRead: 'Segna come letta',
        cta: 'Vai alla guida',
        dailyTitle: `Aggiornamenti giornalieri del ${dailyUpdate?.dateLabel || ''}`.trim(),
        subtitle: 'Riepilogo automatico del giorno review piu recente nel foglio condiviso.',
        summaryNoChanges: "Nessuna variazione rilevata dall'ultimo controllo.",
        summaryWithChanges: '{fields} campi aggiornati su {rows} review.',
        highlightsTitle: 'Esempi aggiornamenti',
        rows: 'Righe aggiornate',
        contacted: 'Gia contattati',
        pending: 'Richiedono follow-up',
        completed: 'Chiuse/revisionate',
      }
    }
    return {
      title: 'Notifications',
      empty: 'No notifications to read.',
      read: 'Read',
      unread: 'Unread',
      markRead: 'Mark as read',
      cta: 'Go to guide',
      dailyTitle: `Daily updates for ${dailyUpdate?.dateLabel || ''}`.trim(),
      subtitle: 'Automatic summary from the latest review day in the shared sheet.',
      summaryNoChanges: 'No changes detected since the last check.',
      summaryWithChanges: '{fields} fields updated across {rows} reviews.',
      highlightsTitle: 'Update examples',
      rows: 'Rows updated',
      contacted: 'Already contacted',
      pending: 'Needs follow-up',
      completed: 'Closed/reviewed',
    }
  }, [locale, dailyUpdate?.dateLabel])

  const notificationItems = useMemo(() => {
    if (!dailyUpdate) return []
    const summaryLine =
      updateSummary?.changedFields > 0
        ? text.summaryWithChanges
            .replace('{fields}', String(updateSummary.changedFields))
            .replace('{rows}', String(updateSummary.changedRows))
        : text.summaryNoChanges
    return [
      {
        id: `public:${cleanToken}:${dailyUpdate.dateKey}:${dailyUpdate.rows}:${dailyUpdate.contactedCount}:${dailyUpdate.pendingCount}:${dailyUpdate.completedCount}:${updateSummary?.changedFields || 0}`,
        title: text.dailyTitle,
        subtitle: text.subtitle,
        summaryLine,
        highlights: Array.isArray(updateSummary?.highlights) ? updateSummary.highlights : [],
        stats: [
          `${text.rows}: ${dailyUpdate.rows}`,
          `${text.contacted}: ${dailyUpdate.contactedCount}`,
          `${text.pending}: ${dailyUpdate.pendingCount}`,
          `${text.completed}: ${dailyUpdate.completedCount}`,
        ],
      },
    ]
  }, [cleanToken, dailyUpdate, text, updateSummary])

  const unreadCount = useMemo(
    () => notificationItems.filter((item) => !readById?.[item.id]).length,
    [notificationItems, readById]
  )

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('bw_tp_public_notifications_read:v1')
      const parsed = raw ? JSON.parse(raw) : {}
      if (parsed && typeof parsed === 'object') setReadById(parsed)
    } catch {
      setReadById({})
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('bw_tp_public_notifications_read:v1', JSON.stringify(readById))
    } catch {
      // ignore
    }
  }, [readById])

  useEffect(() => {
    if (!isValid) return
    try {
      const key = `bw_tp_public_snapshot:${cleanToken || 'default'}`
      const currentSnapshot = buildSnapshot(rows)
      const rawPrev = window.localStorage.getItem(key)
      const prevSnapshot = rawPrev ? JSON.parse(rawPrev) : null
      const delta = prevSnapshot
        ? diffSnapshots(prevSnapshot, currentSnapshot)
        : { changedRows: 0, changedFields: 0, highlights: [] }
      setUpdateSummary(delta)
      window.localStorage.setItem(key, JSON.stringify(currentSnapshot))
    } catch {
      setUpdateSummary({ changedRows: 0, changedFields: 0, highlights: [] })
    }
  }, [isValid, cleanToken, rows])

  useEffect(() => {
    if (!notificationsOpen) return
    const onMouseDown = (event) => {
      if (!notificationsWrapRef.current) return
      if (!notificationsWrapRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [notificationsOpen])

  const markRead = (id) => setReadById((prev) => ({ ...prev, [id]: true }))

  const jumpToGuide = () => {
    const node = document.getElementById('public-trustpilot-guide-root')
    if (!node) return
    node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setNotificationsOpen(false)
  }

  useEffect(() => {
    if (!isValid) return
    trackPublicShareOpen({
      kind: 'trustpilot-guide',
      token: cleanToken,
      generatedAt: payload?.generatedAt,
    })
  }, [isValid, cleanToken, payload])

  if (loading) {
    return <FullPageLoader progress={25} subtitle={t('common.loading')} />
  }

  if (!isValid) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: 24 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 950 }}>Trustpilot Guide</div>
            <LanguageSelect />
          </div>
          <div style={{ marginTop: 8, color: 'rgba(148,163,184,0.95)', fontWeight: 700 }}>
            {error || 'Invalid or expired public link'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ width: '100%', padding: 'clamp(10px, 1.8vw, 24px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <img
            src="/Logo.png"
            alt="Bullwaves"
            style={{ height: 26, width: 'auto', display: 'block', opacity: 0.95 }}
          />
          <div
            ref={notificationsWrapRef}
            style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setNotificationsOpen((v) => !v)
              }}
              style={{
                position: 'relative',
                width: 34,
                height: 34,
                borderRadius: 999,
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#dbeafe',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <path
                  d="M12 3.5a4.5 4.5 0 0 0-4.5 4.5v2.2c0 .9-.3 1.8-.8 2.6L5.3 15c-.5.8.1 1.8 1 1.8h11.4c.9 0 1.5-1 1-1.8l-1.4-2.2c-.5-.8-.8-1.7-.8-2.6V8A4.5 4.5 0 0 0 12 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M9.5 18.2a2.5 2.5 0 0 0 5 0"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              {unreadCount > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    padding: '0 4px',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 380,
                  maxWidth: 'min(94vw, 380px)',
                  border: '1px solid #374151',
                  borderRadius: 12,
                  background: '#1e293b',
                  boxShadow: '0 14px 36px rgba(2, 6, 23, 0.52)',
                  padding: 10,
                  zIndex: 80,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 800 }}>{text.title}</div>
                {notificationItems.length ? (
                  notificationItems.map((item) => {
                    const isRead = Boolean(readById?.[item.id])
                    const hasChanges = updateSummary?.changedFields > 0
                    return (
                      <div
                        key={item.id}
                        style={{
                          border: hasChanges ? '1px solid #f59e0b' : '1px solid #374151',
                          borderRadius: 10,
                          padding: 10,
                          background: hasChanges
                            ? 'linear-gradient(180deg, rgba(245,158,11,0.16), rgba(30,41,59,0.9))'
                            : isRead
                              ? '#0f172a'
                              : 'rgba(30, 64, 175, 0.16)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 8,
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ color: '#dbeafe', fontSize: 12, fontWeight: 800 }}>
                            {item.title}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              borderRadius: 999,
                              padding: '2px 8px',
                              background: isRead ? '#374151' : '#1d4ed8',
                              color: isRead ? '#cbd5e1' : '#dbeafe',
                              fontWeight: 700,
                            }}
                          >
                            {isRead ? text.read : text.unread}
                          </span>
                        </div>
                        <div style={{ color: '#93c5fd', fontSize: 11, marginTop: 4 }}>
                          {item.subtitle}
                        </div>
                        <div
                          style={{ marginTop: 6, color: '#f8fafc', fontSize: 12, fontWeight: 800 }}
                        >
                          {item.summaryLine}
                        </div>
                        {item.highlights?.length ? (
                          <div style={{ marginTop: 8, color: '#cbd5e1', fontSize: 11 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>
                              {text.highlightsTitle}
                            </div>
                            {item.highlights.map((h, idx) => (
                              <div
                                key={`${h.reviewLine}-${h.field}-${idx}`}
                                style={{
                                  marginBottom: 4,
                                  borderLeft: '3px solid #f59e0b',
                                  paddingLeft: 6,
                                }}
                              >
                                {`#${h.reviewLine} · ${h.field}: ${compactValue(h.before)} -> ${compactValue(h.after)}`}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 12 }}>
                          {item.stats.join(' | ')}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={jumpToGuide}
                            style={{
                              border: '1px solid #334155',
                              background: '#1e293b',
                              color: '#e2e8f0',
                              borderRadius: 8,
                              padding: '5px 8px',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            {text.cta}
                          </button>
                          {!isRead ? (
                            <button
                              type="button"
                              onClick={() => markRead(item.id)}
                              style={{
                                border: '1px solid #1e40af',
                                background: '#0f172a',
                                color: '#bfdbfe',
                                borderRadius: 8,
                                padding: '5px 8px',
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              {text.markRead}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{text.empty}</div>
                )}
              </div>
            ) : null}

            <LanguageSelect />
          </div>
        </div>
        <div id="public-trustpilot-guide-root">
          <TrustpilotGuidePage publicMode sharePayload={payload} />
        </div>
      </div>
    </div>
  )
}
