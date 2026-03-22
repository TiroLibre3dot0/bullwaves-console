import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDataStatus } from '../context/DataStatusContext'
import { useMediaPaymentsData } from '../features/media-payments/hooks/useMediaPaymentsData'
import { useI18n } from '../i18n/I18nContext'
import { CONSOLE_TOOLS } from '../config/tools'
import { withReportsVersion } from '../lib/fetchCache'
import DataInfoModal from './DataInfoModal'

function parseReviewDate(input) {
  const str = String(input || '').trim()
  if (!str) return null
  const direct = new Date(str)
  if (!Number.isNaN(direct.getTime())) return direct

  const match = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/)
  if (match) {
    const day = Number(match[1])
    const month = Number(match[2])
    let year = Number(match[3])
    if (year < 100) year += 2000
    const d = new Date(year, month - 1, day)
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

function toDateKey(input) {
  const d = input instanceof Date ? input : parseReviewDate(input)
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

const TRUSTPILOT_TRACKED_FIELDS = [
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

function normalizeSnapshotValue(value) {
  return String(value == null ? '' : value).trim()
}

function compactValue(value, max = 72) {
  const text = normalizeSnapshotValue(value)
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max - 3)}...` : text
}

function buildTrustpilotSnapshot(rows) {
  const out = {}
  for (const row of Array.isArray(rows) ? rows : []) {
    const line = Number(row?.reviewLine)
    if (!Number.isFinite(line)) continue
    const entry = {}
    for (const field of TRUSTPILOT_TRACKED_FIELDS) {
      entry[field] = normalizeSnapshotValue(row?.[field])
    }
    out[String(line)] = entry
  }
  return out
}

function diffTrustpilotSnapshots(prevSnapshot, nextSnapshot) {
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

    for (const field of TRUSTPILOT_TRACKED_FIELDS) {
      const before = normalizeSnapshotValue(prevRow[field])
      const after = normalizeSnapshotValue(nextRow[field])
      if (before === after) continue

      changedFields += 1
      rowChanged = true

      if (highlights.length < 3) {
        highlights.push({
          reviewLine: Number(lineKey),
          field,
          before,
          after,
        })
      }
    }

    if (rowChanged) changedRows += 1
  }

  return { changedRows, changedFields, highlights }
}

function DataStatusIcon({ dataStatus, onClick }) {
  const { t } = useI18n()
  const { status } = dataStatus
  const getIcon = () => {
    switch (status) {
      case 'updated':
        return (
          <span className="text-green-500" title={t('dataStatus.updated')}>
            ✅
          </span>
        )
      case 'outdated':
        return (
          <span className="text-yellow-500" title={t('dataStatus.outdated')}>
            ⏰
          </span>
        )
      case 'no-data':
        return (
          <span className="text-red-500" title={t('dataStatus.noData')}>
            ⚠️
          </span>
        )
      default:
        return (
          <span className="text-gray-400" title={t('dataStatus.unknown')}>
            ❓
          </span>
        )
    }
  }
  return (
    <div className="data-status-icon flex items-center cursor-pointer" onClick={onClick}>
      {getIcon()}
    </div>
  )
}

export default function Topbar({
  children,
  onAdminClick,
  showAdmin = false,
  onToggleSidebar,
  isSidebarOpen = false,
}) {
  const { t, locale, setLocale, locales } = useI18n()
  const { dataStatus } = useDataStatus()
  const { mediaRows, payments, mediaSource, paymentsSource } = useMediaPaymentsData()
  const { user, logout } = useAuth()
  const initial = user?.name?.[0]?.toUpperCase() || 'B'
  const [showTools, setShowTools] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showDataInfoModal, setShowDataInfoModal] = useState(false)
  const [reportsMeta, setReportsMeta] = useState(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationReadById, setNotificationReadById] = useState({})
  const [dailyUpdate, setDailyUpdate] = useState(null)
  const [updateSummary, setUpdateSummary] = useState({
    changedRows: 0,
    changedFields: 0,
    highlights: [],
  })
  const notificationsWrapRef = useRef(null)
  const hasNav = Boolean(children)

  const openTrustpilotGuide = () => {
    if (typeof window === 'undefined') return
    setNotificationsOpen(false)
    if (window.location.pathname === '/trustpilot-guide') return
    window.location.assign('/trustpilot-guide')
  }

  const refreshConsole = () => {
    if (typeof window === 'undefined') return
    setShowTools(false)
    setShowMobileMenu(false)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('refresh', String(Date.now()))
      window.location.replace(url.toString())
    } catch {
      window.location.reload()
    }
  }

  const isMobile = () => window.innerWidth <= 768

  // Calcola informazioni sui dati più recenti
  const getDataInfo = useMemo(() => {
    if (!mediaRows.length && !payments.length) {
      return { lastDate: t('dataStatus.noData'), mediaFile: 'N/A', paymentsFile: 'N/A' }
    }

    // Trova la data più recente nei media data
    const mediaDates = mediaRows
      .map((r) => r.monthIndex)
      .filter((idx) => idx > 0)
      .sort((a, b) => b - a)

    // Trova la data più recente nei payments
    const paymentDates = payments
      .map((p) => p.monthIndex)
      .filter((idx) => idx > 0)
      .sort((a, b) => b - a)

    const latestMonthIndex = Math.max(mediaDates[0] || 0, paymentDates[0] || 0)

    // Converti monthIndex in data leggibile
    const year = Math.floor(latestMonthIndex / 12) + 2000
    const month = (latestMonthIndex % 12) + 1
    const monthNamesByLocale = {
      en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      it: [
        'Gennaio',
        'Febbraio',
        'Marzo',
        'Aprile',
        'Maggio',
        'Giugno',
        'Luglio',
        'Agosto',
        'Settembre',
        'Ottobre',
        'Novembre',
        'Dicembre',
      ],
      sr: [
        'Januar',
        'Februar',
        'Mart',
        'April',
        'Maj',
        'Jun',
        'Jul',
        'Avgust',
        'Septembar',
        'Oktobar',
        'Novembar',
        'Decembar',
      ],
    }
    const monthNames = monthNamesByLocale[locale] || monthNamesByLocale.en
    const lastDate =
      latestMonthIndex > 0 ? `${monthNames[month - 1]} ${year}` : t('dataStatus.unknown')

    return {
      lastDate,
      mediaFile: mediaSource ? mediaSource.replace('/', '') : 'N/A',
      paymentsFile: paymentsSource ? paymentsSource.replace('/', '') : 'N/A',
    }
  }, [mediaRows, payments, mediaSource, paymentsSource, locale, t])

  const handleDataStatusClick = () => {
    setShowDataInfoModal(true)
  }

  // Load lightweight meta so we can warn if Registrations Report is behind.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.fetch) return

    let cancelled = false

    const getVersion = () => {
      try {
        return String(
          window.localStorage.getItem('bw_reports_version') ||
            window.localStorage.getItem('bw_reports_meta_generatedAt') ||
            ''
        )
      } catch {
        return ''
      }
    }

    const fetchMeta = async () => {
      try {
        const v = getVersion()
        const url = v
          ? `/reports_meta.json?v=${encodeURIComponent(v)}`
          : `/reports_meta.json?ts=${Date.now()}`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return
        const meta = await res.json()
        if (cancelled) return
        setReportsMeta(meta || null)
      } catch {
        // ignore
      }
    }

    const sync = () => fetchMeta()

    const onStorage = (e) => {
      if (!e || e.key === 'bw_reports_version' || e.key === 'bw_reports_meta_generatedAt') sync()
    }

    fetchMeta()
    window.addEventListener('bw-reports-updated', sync)
    window.addEventListener('storage', onStorage)

    return () => {
      cancelled = true
      window.removeEventListener('bw-reports-updated', sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const registrationsMeta = reportsMeta?.reports?.registrations || null
  const registrationsLatestIso = registrationsMeta?.latestDate || ''
  const registrationsLatest = registrationsLatestIso ? new Date(registrationsLatestIso) : null
  const registrationsOutdated = useMemo(() => {
    if (!registrationsLatest || Number.isNaN(registrationsLatest.getTime())) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const latest = new Date(registrationsLatest)
    latest.setHours(0, 0, 0, 0)
    return latest < today
  }, [registrationsLatestIso])

  const tools = useMemo(() => CONSOLE_TOOLS, [])

  const handleLogoClick = () => {
    setShowTools((v) => !v)
    setShowMobileMenu(false)
  }

  const handleOverlayClick = () => {
    setShowTools(false)
    setShowMobileMenu(false)
  }

  const toggleMobileMenu = () => {
    if (!hasNav) return
    setShowMobileMenu(!showMobileMenu)
  }

  const toggleSidebar = () => {
    if (!onToggleSidebar) return
    setShowTools(false)
    setShowMobileMenu(false)
    onToggleSidebar()
  }

  const openTool = (href) => {
    window.open(href, '_blank', 'noopener,noreferrer')
    setShowTools(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!showTools) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowTools(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showTools])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('bw_tp_notifications_read:v1')
      const parsed = raw ? JSON.parse(raw) : {}
      if (parsed && typeof parsed === 'object') setNotificationReadById(parsed)
    } catch {
      setNotificationReadById({})
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        'bw_tp_notifications_read:v1',
        JSON.stringify(notificationReadById)
      )
    } catch {
      // ignore
    }
  }, [notificationReadById])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.fetch) return

    let cancelled = false

    const loadTrustpilotDaily = async () => {
      try {
        const baseUrl = withReportsVersion('/trustpilot_guidance.json')
        const sep = baseUrl.includes('?') ? '&' : '?'
        const url = `${baseUrl}${sep}ts=${Date.now()}`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const rows = Array.isArray(data?.rows) ? data.rows : []

        let delta = { changedRows: 0, changedFields: 0, highlights: [] }
        try {
          const currentSnapshot = buildTrustpilotSnapshot(rows)
          const rawPrevSnapshot = window.localStorage.getItem('bw_tp_snapshot:v1')
          const prevSnapshot = rawPrevSnapshot ? JSON.parse(rawPrevSnapshot) : null
          if (prevSnapshot && typeof prevSnapshot === 'object') {
            delta = diffTrustpilotSnapshots(prevSnapshot, currentSnapshot)
          }
          window.localStorage.setItem('bw_tp_snapshot:v1', JSON.stringify(currentSnapshot))
        } catch {
          // ignore snapshot issues
        }
        setUpdateSummary(delta)

        const datedRows = rows
          .map((row) => ({ row, date: parseReviewDate(row?.dateReviewed) }))
          .filter((x) => x.date)

        if (!datedRows.length) {
          setDailyUpdate(null)
          return
        }

        const latestMs = Math.max(...datedRows.map((x) => x.date.getTime()))
        const latestDate = new Date(latestMs)
        const dateKey = toDateKey(latestDate)
        const rowsOnLatestDay = datedRows
          .map((x) => x.row)
          .filter((row) => toDateKey(row?.dateReviewed) === dateKey)

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

        const notificationId = `daily:${dateKey}:${rowsOnLatestDay.length}:${contactedCount}:${pendingCount}:${completedCount}:${delta.changedFields}`

        setDailyUpdate({
          dateKey,
          notificationId,
          dateLabel: latestDate.toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-US'),
          rows: rowsOnLatestDay.length,
          contactedCount,
          pendingCount,
          completedCount,
        })
      } catch {
        if (!cancelled) setDailyUpdate(null)
      }
    }

    const onReportsUpdated = () => loadTrustpilotDaily()
    const onFocus = () => loadTrustpilotDaily()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadTrustpilotDaily()
    }
    const timerId = window.setInterval(loadTrustpilotDaily, 60000)

    loadTrustpilotDaily()
    window.addEventListener('bw-reports-updated', onReportsUpdated)
    window.addEventListener('focus', onFocus)
    window.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.removeEventListener('bw-reports-updated', onReportsUpdated)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(timerId)
    }
  }, [locale])

  useEffect(() => {
    if (!dailyUpdate?.notificationId) return
    try {
      const key = `bw_tp_daily_notice_logged:${dailyUpdate.notificationId}`
      if (window.localStorage.getItem(key) === '1') return
      console.info(
        `[Trustpilot Daily Update ${dailyUpdate.dateLabel}] rows=${dailyUpdate.rows}, contacted=${dailyUpdate.contactedCount}, pending=${dailyUpdate.pendingCount}, completed=${dailyUpdate.completedCount}`
      )
      window.localStorage.setItem(key, '1')
    } catch {
      // ignore
    }
  }, [dailyUpdate])

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

  const notificationsText = useMemo(() => {
    if (locale === 'it') {
      return {
        title: 'Notifiche',
        buttonAria: 'Apri notifiche',
        empty: 'Nessuna notifica da leggere.',
        markRead: 'Segna come letta',
        read: 'Letta',
        unread: 'Da leggere',
        ctaOpenGuide: 'Apri Trustpilot Guide',
        dailyTitle: `Aggiornamenti giornalieri del ${dailyUpdate?.dateLabel || ''}`.trim(),
        subtitle: 'Riepilogo automatico del giorno review piu recente nel foglio sorgente.',
        summaryNoChanges: "Nessuna variazione rilevata dall'ultimo controllo.",
        summaryWithChanges: '{fields} campi aggiornati su {rows} review.',
        highlightsTitle: 'Esempi aggiornamenti',
        rows: 'Righe aggiornate',
        contacted: 'Gia contattati',
        pending: 'Richiedono follow-up',
        completed: 'Chiuse/revisionate',
        fieldLabels: {
          reviewSummary: 'Sintesi review',
          issueType: 'Issue type',
          actionNeeded: 'Azione richiesta',
          assignedTo: 'Assegnato a',
          status: 'Stato',
          contacted: 'Contattato',
          contactChannel: 'Canale',
          contactOutcome: 'Esito contatto',
          clientSentiment: 'Sentiment cliente',
          mainIssue: 'Issue principale',
          actionTaken: 'Azione eseguita',
          reviewStatus: 'Stato review',
          followUpNeeded: 'Follow-up necessario',
          additionalNotes: 'Note aggiuntive',
        },
      }
    }
    return {
      title: 'Notifications',
      buttonAria: 'Open notifications',
      empty: 'No notifications to read.',
      markRead: 'Mark as read',
      read: 'Read',
      unread: 'Unread',
      ctaOpenGuide: 'Open Trustpilot Guide',
      dailyTitle: `Daily updates for ${dailyUpdate?.dateLabel || ''}`.trim(),
      subtitle: 'Automatic summary from the latest review day in the source sheet.',
      summaryNoChanges: 'No changes detected since the last check.',
      summaryWithChanges: '{fields} fields updated across {rows} reviews.',
      highlightsTitle: 'Update examples',
      rows: 'Rows updated',
      contacted: 'Already contacted',
      pending: 'Needs follow-up',
      completed: 'Closed/reviewed',
      fieldLabels: {
        reviewSummary: 'Review summary',
        issueType: 'Issue type',
        actionNeeded: 'Action needed',
        assignedTo: 'Assigned to',
        status: 'Status',
        contacted: 'Contacted',
        contactChannel: 'Contact channel',
        contactOutcome: 'Contact outcome',
        clientSentiment: 'Client sentiment',
        mainIssue: 'Main issue',
        actionTaken: 'Action taken',
        reviewStatus: 'Review status',
        followUpNeeded: 'Follow-up needed',
        additionalNotes: 'Additional notes',
      },
    }
  }, [locale, dailyUpdate?.dateLabel])

  const notificationItems = useMemo(() => {
    if (!dailyUpdate) return []
    const summaryLine =
      updateSummary?.changedFields > 0
        ? notificationsText.summaryWithChanges
            .replace('{fields}', String(updateSummary.changedFields))
            .replace('{rows}', String(updateSummary.changedRows))
        : notificationsText.summaryNoChanges
    return [
      {
        id: dailyUpdate.notificationId || `daily:${dailyUpdate.dateKey}`,
        title: notificationsText.dailyTitle,
        subtitle: notificationsText.subtitle,
        summaryLine,
        highlights: Array.isArray(updateSummary?.highlights) ? updateSummary.highlights : [],
        stats: [
          `${notificationsText.rows}: ${dailyUpdate.rows}`,
          `${notificationsText.contacted}: ${dailyUpdate.contactedCount}`,
          `${notificationsText.pending}: ${dailyUpdate.pendingCount}`,
          `${notificationsText.completed}: ${dailyUpdate.completedCount}`,
        ],
      },
    ]
  }, [dailyUpdate, notificationsText, updateSummary])

  const unreadNotificationsCount = useMemo(
    () => notificationItems.filter((item) => !notificationReadById?.[item.id]).length,
    [notificationItems, notificationReadById]
  )

  const markNotificationRead = (notificationId) => {
    if (!notificationId) return
    setNotificationReadById((prev) => ({ ...prev, [notificationId]: true }))
  }

  return (
    <>
      {(showTools || showMobileMenu) && (
        <div className="logo-tools-backdrop" onClick={handleOverlayClick} />
      )}
      <header className="topbar">
        {/* Sidebar Toggle */}
        {typeof onToggleSidebar === 'function' && (
          <button
            type="button"
            className="sidebar-hamburger"
            onClick={toggleSidebar}
            aria-label={t('topbar.aria.toggleSidebar')}
            aria-expanded={isSidebarOpen ? 'true' : 'false'}
            title={t('topbar.aria.toggleSidebar')}
          >
            <span className="sidebar-hamburger-icon" aria-hidden="true">
              {isSidebarOpen ? '×' : '≡'}
            </span>
          </button>
        )}
        <div
          className="title logo-hit flex items-center"
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          aria-label={t('app.tools')}
          aria-expanded={showTools ? 'true' : 'false'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleLogoClick()
          }}
        >
          <img
            src="/Logo.png"
            alt="Bullwaves Logo"
            className="h-10 w-auto transition-all duration-300 hover:scale-105 cursor-pointer mr-2"
          />
          {dataStatus && <DataStatusIcon dataStatus={dataStatus} onClick={handleDataStatusClick} />}
          {showTools && (
            <div className="logo-tools-pop">
              <div className="logo-tools-title">{t('app.tools')}</div>
              <div className="logo-tools-list">
                {tools.map((tool) => (
                  <button
                    key={tool.key || tool.name}
                    className="logo-tools-item"
                    onClick={() => openTool(tool.href)}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="topbar-nav-slot">
          {/* Hamburger Menu Button - Mobile Only (render only when viewport is mobile) */}
          {hasNav && typeof window !== 'undefined' && isMobile() && (
            <button
              className="hamburger-menu flex flex-col justify-center items-center w-8 h-8 space-y-1 bg-transparent border-none cursor-pointer"
              onClick={toggleMobileMenu}
              aria-label={t('topbar.aria.toggleNavMenu')}
            >
              <span
                className={`hamburger-line w-5 h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? 'rotate-45 translate-y-1.5' : ''}`}
              ></span>
              <span
                className={`hamburger-line w-5 h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? 'opacity-0' : ''}`}
              ></span>
              <span
                className={`hamburger-line w-5 h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? '-rotate-45 -translate-y-1.5' : ''}`}
              ></span>
            </button>
          )}

          {/* Desktop Navigation */}
          {hasNav ? <div className="hidden md:block">{children}</div> : null}

          {/* Mobile Navigation Menu */}
          {hasNav && showMobileMenu && (
            <div className="mobile-nav-menu absolute top-full left-0 right-0 bg-linear-to-b from-slate-900/98 to-slate-800/98 backdrop-blur-lg border-b border-white/10 shadow-2xl md:hidden z-50">
              <div className="px-4 py-4 max-h-96 overflow-y-auto">
                {React.cloneElement(children, {
                  onItemClick: () => setShowMobileMenu(false),
                })}
              </div>
            </div>
          )}
        </div>
        <div className="meta">
          {user ? (
            <div className="user-chip">
              <div className="lang-switch" title={t('lang.label')}>
                <div ref={notificationsWrapRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    aria-label={notificationsText.buttonAria}
                    onClick={() => setNotificationsOpen((value) => !value)}
                    className="lang-select"
                    style={{
                      width: 40,
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingLeft: 0,
                      paddingRight: 0,
                      position: 'relative',
                      marginRight: 8,
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
                    {unreadNotificationsCount > 0 ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          minWidth: 16,
                          height: 16,
                          borderRadius: 999,
                          padding: '0 4px',
                          background: '#dc2626',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {unreadNotificationsCount}
                      </span>
                    ) : null}
                  </button>

                  {notificationsOpen ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: 360,
                        maxWidth: 'min(92vw, 360px)',
                        border: '1px solid #1f2937',
                        borderRadius: 12,
                        background: '#0b1220',
                        boxShadow: '0 14px 36px rgba(2, 6, 23, 0.52)',
                        padding: 10,
                        zIndex: 60,
                        display: 'grid',
                        gap: 8,
                      }}
                    >
                      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 800 }}>
                        {notificationsText.title}
                      </div>
                      {notificationItems.length ? (
                        notificationItems.map((item) => {
                          const isRead = Boolean(notificationReadById?.[item.id])
                          return (
                            <div
                              key={item.id}
                              style={{
                                border: '1px solid #1f2937',
                                borderRadius: 10,
                                padding: 10,
                                background: isRead ? '#0f172a' : 'rgba(30, 64, 175, 0.16)',
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
                                    background: isRead ? '#1f2937' : '#1d4ed8',
                                    color: isRead ? '#cbd5e1' : '#dbeafe',
                                    fontWeight: 700,
                                  }}
                                >
                                  {isRead ? notificationsText.read : notificationsText.unread}
                                </span>
                              </div>
                              <div style={{ color: '#93c5fd', fontSize: 11, marginTop: 4 }}>
                                {item.subtitle}
                              </div>
                              <div
                                style={{
                                  marginTop: 6,
                                  color: '#f8fafc',
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {item.summaryLine}
                              </div>
                              {item.highlights?.length ? (
                                <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 11 }}>
                                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                    {notificationsText.highlightsTitle}
                                  </div>
                                  {item.highlights.map((h, idx) => {
                                    const label =
                                      notificationsText.fieldLabels?.[h.field] || h.field || 'Field'
                                    return (
                                      <div key={`${h.reviewLine}-${h.field}-${idx}`}>
                                        {`#${h.reviewLine} · ${label}: ${compactValue(h.before)} -> ${compactValue(h.after)}`}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : null}
                              <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 12 }}>
                                {item.stats.join(' | ')}
                              </div>
                              <button
                                type="button"
                                onClick={openTrustpilotGuide}
                                style={{
                                  marginTop: 8,
                                  border: '1px solid #334155',
                                  background: '#0b1220',
                                  color: '#e2e8f0',
                                  borderRadius: 8,
                                  padding: '5px 8px',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                {notificationsText.ctaOpenGuide}
                              </button>
                              {!isRead ? (
                                <button
                                  type="button"
                                  onClick={() => markNotificationRead(item.id)}
                                  style={{
                                    marginTop: 8,
                                    border: '1px solid #1e40af',
                                    background: '#0f172a',
                                    color: '#bfdbfe',
                                    borderRadius: 8,
                                    padding: '5px 8px',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {notificationsText.markRead}
                                </button>
                              ) : null}
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>
                          {notificationsText.empty}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <select
                  className="lang-select"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  aria-label={t('lang.label')}
                >
                  {locales.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="user-avatar" aria-hidden="true">
                {initial}
              </div>
              <div className="user-meta">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.title || user.department}</div>
              </div>
              {showAdmin && (
                <button type="button" className="admin-btn" onClick={onAdminClick}>
                  {t('app.admin')}
                </button>
              )}
              <button
                type="button"
                className="logout-btn"
                onClick={refreshConsole}
                title="Refresh console data"
              >
                Refresh
              </button>
              <button type="button" className="logout-btn" onClick={logout}>
                {t('app.logout')}
              </button>
            </div>
          ) : (
            <div className="user-chip ghost">{t('app.version')}</div>
          )}
        </div>
      </header>

      {/* Data Info Modal */}
      <DataInfoModal
        isOpen={showDataInfoModal}
        onClose={() => setShowDataInfoModal(false)}
        dataInfo={{
          ...getDataInfo,
          registrationsLatestDate: registrationsLatestIso,
          registrationsOutdated,
        }}
      />
    </>
  )
}
