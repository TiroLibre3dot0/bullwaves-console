import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDataStatus } from '../context/DataStatusContext'
import { useQlikStatus } from '../context/QlikStatusContext'
import QlikSourcePill from './common/QlikSourcePill'
import { useMediaPaymentsData } from '../features/media-payments/hooks/useMediaPaymentsData'
import { useI18n } from '../i18n/I18nContext'
import { CONSOLE_TOOLS } from '../config/tools'
import { withReportsVersion } from '../lib/fetchCache'
import DataInfoModal from './DataInfoModal'

const SUPPORT_NAME_KEYS = ['customername', 'customer_name', 'name', 'fullname']
const SUPPORT_USERID_KEYS = ['userid', 'user_id', 'user id', 'user']
const SUPPORT_MT5_KEYS = ['mt5account', 'mt5_account', 'mt5']
const SUPPORT_REGDATE_KEYS = [
  'registrationdate',
  'registrationDate',
  'regdate',
  'regDate',
  'externaldate',
  'externalDate',
  'registered',
  'registeredAt',
  'registration_at',
  'registration_date',
]
const SUPPORT_FIRST_DEPOSIT_KEYS = [
  'firstdeposit',
  'firstDeposit',
  'first_deposit',
  'first deposit',
  'firstDepositAmount',
]
const SUPPORT_QUALIFY_KEYS = [
  'qualificationdate',
  'qualificationDate',
  'qualification_date',
  'qualifydate',
  'qftd',
]
const SUPPORT_DEPOSIT_COUNT_KEYS = [
  'depositcount',
  'depositCount',
  'deposit_count',
  'depositscount',
  'depositsCount',
  'deposits_count',
]
const SUPPORT_TOTAL_DEPOSITS_KEYS = [
  'totaldeposits',
  'totalDeposits',
  'total_deposits',
  'totaldeposit',
  'totalDeposit',
  'total_deposit',
]
const SUPPORT_NET_DEPOSITS_KEYS = ['netdeposits', 'netDeposits', 'net_deposits']
const SUPPORT_WITHDRAWALS_KEYS = ['withdrawals', 'totalwithdrawals', 'total_withdrawals']
const SUPPORT_AFFILIATE_KEYS = ['affiliateid', 'affiliate_id', 'affiliate']
const SUPPORT_STATUS_KEYS = ['status']
const SUPPORT_COUNTRY_KEYS = ['country']
const SUPPORT_ACTION_KEYS = ['action']
const SUPPORT_POSITION_COUNT_KEYS = ['positioncount', 'position_count', 'position count']
const SUPPORT_LOTS_KEYS = ['lots', 'total_lots']
const SUPPORT_VOLUME_KEYS = ['volume', 'turnover']
const SUPPORT_PL_KEYS = ['pl', 'profitloss', 'netpl', 'net_pl']
const SUPPORT_SPREAD_KEYS = ['spread']
const SUPPORT_ROI_KEYS = ['roi']
const SUPPORT_COMMISSIONS_KEYS = ['commissions', 'affiliatecommissions', 'affiliate_commissions']
const SUPPORT_AFF_COMM_KEYS = ['affiliatecommissions', 'affiliate_commissions']
const SUPPORT_SUB_AFF_COMM_KEYS = [
  'subaffiliatecommissions',
  'sub_affiliate_commissions',
  'sub_aff_commissions',
]
const SUPPORT_CPA_KEYS = ['cpacommission', 'cpa_commission', 'cpa']
const SUPPORT_CPL_KEYS = ['cplcommission', 'cpl_commission', 'cpl']
const SUPPORT_REVSHARE_KEYS = ['revshare', 'revsharecommission', 'revshare_commission']

function pickSupportField(row, candidates) {
  if (!row) return ''
  for (const key of candidates) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function toSupportNum(value) {
  if (value === null || value === undefined) return 0
  const n = Number(String(value).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(n) ? n : 0
}

function mapSupportUser(row) {
  if (!row) return null
  return {
    raw: row,
    name: pickSupportField(row, SUPPORT_NAME_KEYS),
    userId: pickSupportField(row, SUPPORT_USERID_KEYS),
    mt5: pickSupportField(row, SUPPORT_MT5_KEYS),
    regDate: pickSupportField(row, SUPPORT_REGDATE_KEYS),
    firstDeposit: pickSupportField(row, SUPPORT_FIRST_DEPOSIT_KEYS),
    qualificationDate: pickSupportField(row, SUPPORT_QUALIFY_KEYS),
    depositCount: pickSupportField(row, SUPPORT_DEPOSIT_COUNT_KEYS),
    totalDeposits: pickSupportField(row, SUPPORT_TOTAL_DEPOSITS_KEYS),
    depositNum: toSupportNum(pickSupportField(row, SUPPORT_TOTAL_DEPOSITS_KEYS)),
    netDeposits: pickSupportField(row, SUPPORT_NET_DEPOSITS_KEYS),
    withdrawals: pickSupportField(row, SUPPORT_WITHDRAWALS_KEYS),
    affiliateId: pickSupportField(row, SUPPORT_AFFILIATE_KEYS),
    status: pickSupportField(row, SUPPORT_STATUS_KEYS),
    country: pickSupportField(row, SUPPORT_COUNTRY_KEYS),
    action: pickSupportField(row, SUPPORT_ACTION_KEYS),
    lots: pickSupportField(row, SUPPORT_LOTS_KEYS),
    volume: pickSupportField(row, SUPPORT_VOLUME_KEYS),
    positionCount: pickSupportField(row, SUPPORT_POSITION_COUNT_KEYS),
    pl: pickSupportField(row, SUPPORT_PL_KEYS),
    spread: pickSupportField(row, SUPPORT_SPREAD_KEYS),
    roi: pickSupportField(row, SUPPORT_ROI_KEYS),
    commissions: pickSupportField(row, SUPPORT_COMMISSIONS_KEYS),
    affiliateCommissions: pickSupportField(row, SUPPORT_AFF_COMM_KEYS),
    subAffiliateCommissions: pickSupportField(row, SUPPORT_SUB_AFF_COMM_KEYS),
    commission_cpa: pickSupportField(row, SUPPORT_CPA_KEYS),
    commission_cpl: pickSupportField(row, SUPPORT_CPL_KEYS),
    revshare: pickSupportField(row, SUPPORT_REVSHARE_KEYS),
  }
}

function formatSupportEuro(value) {
  if (value === null || value === undefined || String(value).trim() === '') return '—'
  const n = toSupportNum(value)
  return `€${n.toLocaleString()}`
}

function suggestedSupportReply(t, mapped) {
  if (!mapped) return ''
  const name = mapped.name || mapped.userId || t('support.reply.customerFallback')
  return t('support.reply.fallback', { name })
}

const CRM_QUICK_INDEX_URL = '/support_users_search_index.json'
let crmQuickRowsCache = null
let crmQuickRowsPromise = null

async function loadCrmQuickRows() {
  if (Array.isArray(crmQuickRowsCache)) return crmQuickRowsCache

  if (!crmQuickRowsPromise) {
    crmQuickRowsPromise = (async () => {
      try {
        const res = await fetch(withReportsVersion(CRM_QUICK_INDEX_URL), { cache: 'force-cache' })
        if (!res.ok) return null
        const data = await res.json()
        const rows = Array.isArray(data?.rows) ? data.rows : []
        crmQuickRowsCache = rows
        return rows
      } catch {
        return null
      }
    })()
  }

  const rows = await crmQuickRowsPromise
  return Array.isArray(rows) ? rows : null
}

// Fetch unique clients from Qlik API for new-registration notifications.
// Does NOT cache so each polling cycle sees the latest data.
async function loadQlikUniqueClients() {
  try {
    const res = await fetch('/api/qlik/creolabs/client-months', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    const months = Array.isArray(data?.data?.clientMonths) ? data.data.clientMonths : []
    const seen = new Set()
    const unique = []
    for (const row of months) {
      const id = String(row?.clientId || '').trim()
      if (!id || seen.has(id)) continue
      seen.add(id)
      unique.push({
        userid: id,
        customername: row?.clientName || '',
        country: row?.country || '',
      })
    }
    return unique.length ? unique : null
  } catch {
    return null
  }
}

function normalizeCrmQuery(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function parseMoneyLoose(value) {
  if (value == null || value === '') return 0
  const n = Number(String(value).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(n) ? n : 0
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
      // Ambiguous formats default to D/M/Y for this dataset.
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
  const { qlikSource } = useQlikStatus()
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
  const [newClientNotifs, setNewClientNotifs] = useState([])
  const [newClientToasts, setNewClientToasts] = useState([])
  const [updateSummary, setUpdateSummary] = useState({
    changedRows: 0,
    changedFields: 0,
    highlights: [],
  })
  const [crmQuery, setCrmQuery] = useState('')
  const [crmResults, setCrmResults] = useState([])
  const [crmSearchOpen, setCrmSearchOpen] = useState(false)
  const [crmLoading, setCrmLoading] = useState(false)
  const [crmSelectedRaw, setCrmSelectedRaw] = useState(null)
  const [crmCopiedKey, setCrmCopiedKey] = useState('')
  const notificationsWrapRef = useRef(null)
  const crmWrapRef = useRef(null)
  const crmInputRef = useRef(null)
  const crmDebounceRef = useRef(null)
  const crmCopyTimerRef = useRef(null)
  const crmLastReqRef = useRef(0)
  const crmCacheRef = useRef(new Map())
  const hasNav = Boolean(children)
  const crmSelected = useMemo(
    () => (crmSelectedRaw ? mapSupportUser(crmSelectedRaw) : null),
    [crmSelectedRaw]
  )
  const crmResultsToShow = useMemo(
    () =>
      (Array.isArray(crmResults) ? crmResults : []).slice(0, 8).map((raw) => ({
        raw,
        mapped: mapSupportUser(raw),
      })),
    [crmResults]
  )

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

  const runCrmSearch = async (value) => {
    const trimmed = String(value || '').trim()
    const digits = trimmed.replace(/\D+/g, '')
    const isReady = digits ? digits.length >= 3 : trimmed.length >= 2

    if (!trimmed || !isReady) {
      setCrmResults([])
      setCrmLoading(false)
      return
    }

    if (crmCacheRef.current.has(trimmed)) {
      setCrmResults(crmCacheRef.current.get(trimmed) || [])
      setCrmLoading(false)
      setCrmSearchOpen(true)
      return
    }

    const reqId = Date.now()
    crmLastReqRef.current = reqId
    setCrmLoading(true)

    try {
      const qNorm = normalizeCrmQuery(trimmed)
      const quickRows = await loadCrmQuickRows()

      let out = []
      if (Array.isArray(quickRows) && quickRows.length) {
        out = quickRows
          .filter((row) => {
            const userId = String(row?.userid || '').trim()
            const mt5 = String(row?.mt5account || '').trim()
            const haystack = String(row?.__searchIndex || '').toLowerCase()
            if (digits) return userId.includes(digits) || mt5.includes(digits)
            return haystack.includes(qNorm)
          })
          .sort((a, b) => {
            const aUser = String(a?.userid || '')
            const bUser = String(b?.userid || '')
            const aMt5 = String(a?.mt5account || '')
            const bMt5 = String(b?.mt5account || '')
            const aName = String(a?.customername || '').toLowerCase()
            const bName = String(b?.customername || '').toLowerCase()

            const score = (rowUser, rowMt5, rowName, row) => {
              let total = 0
              if (digits) {
                if (rowUser === digits) total += 1000
                else if (rowUser.startsWith(digits)) total += 700
                else if (rowUser.includes(digits)) total += 500
                if (rowMt5 === digits) total += 950
                else if (rowMt5.startsWith(digits)) total += 680
                else if (rowMt5.includes(digits)) total += 480
              } else {
                if (rowName === qNorm) total += 900
                else if (rowName.startsWith(qNorm)) total += 700
                else if (
                  String(row?.__searchIndex || '')
                    .toLowerCase()
                    .includes(qNorm)
                )
                  total += 420
              }
              total += Math.min(parseMoneyLoose(row?.totaldeposits) / 1000, 60)
              return total
            }

            return score(bUser, bMt5, bName, b) - score(aUser, aMt5, aName, a)
          })
          .slice(0, 8)
      }

      if (crmLastReqRef.current !== reqId) return
      crmCacheRef.current.set(trimmed, out)
      setCrmResults(out)
      setCrmSearchOpen(true)
    } catch {
      if (crmLastReqRef.current !== reqId) return
      setCrmResults([])
    } finally {
      if (crmLastReqRef.current === reqId) setCrmLoading(false)
    }
  }

  const handleSelectCrmUser = (raw) => {
    if (!raw) return
    const mapped = mapSupportUser(raw)
    setCrmQuery(mapped?.name || mapped?.userId || '')
    setCrmSelectedRaw(raw)
    setCrmSearchOpen(false)
  }

  const copyCrmValue = async (key, value) => {
    const text = String(value || '').trim()
    if (!text || text === '—') return
    try {
      await navigator.clipboard.writeText(text)
      setCrmCopiedKey(key)
      if (crmCopyTimerRef.current) window.clearTimeout(crmCopyTimerRef.current)
      crmCopyTimerRef.current = window.setTimeout(() => setCrmCopiedKey(''), 1400)
    } catch {
      // ignore
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
    const trimmed = String(crmQuery || '').trim()
    if (crmDebounceRef.current) window.clearTimeout(crmDebounceRef.current)

    if (!trimmed) {
      setCrmResults([])
      setCrmLoading(false)
      return undefined
    }

    crmDebounceRef.current = window.setTimeout(() => {
      runCrmSearch(trimmed)
    }, 180)

    return () => {
      if (crmDebounceRef.current) window.clearTimeout(crmDebounceRef.current)
    }
  }, [crmQuery])

  useEffect(() => {
    return () => {
      if (crmCopyTimerRef.current) window.clearTimeout(crmCopyTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onMouseDown = (event) => {
      if (!crmWrapRef.current) return
      if (!crmWrapRef.current.contains(event.target)) {
        setCrmSearchOpen(false)
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setCrmSearchOpen(false)
        if (crmSelectedRaw) setCrmSelectedRaw(null)
      }

      if (event.key === '/' && document.activeElement !== crmInputRef.current) {
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
          return
        }
        event.preventDefault()
        crmInputRef.current?.focus()
        if (String(crmQuery || '').trim()) setCrmSearchOpen(true)
      }
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [crmQuery, crmSelectedRaw])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    if (!crmSelectedRaw) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [crmSelectedRaw])

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

        const notificationId = `daily:${dateKey}:${rowsOnLatestDay.length}:${contactedCount}:${pendingCount}:${completedCount}:${delta.changedFields}`

        setDailyUpdate({
          dateKey,
          notificationId,
          dateLabel: latestDate.toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB'),
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

  // Detect new CRM registered users and push them as notifications.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.fetch) return

    let cancelled = false
    const SEEN_KEY = 'bw_crm_seen_ids:v1'
    const NOTIF_KEY = 'bw_crm_new_notifs:v1'
    const INTERVAL_MS = 5 * 60 * 1000

    const checkNewClients = async () => {
      try {
        const rows = await loadQlikUniqueClients()
        if (cancelled || !Array.isArray(rows) || !rows.length) return

        const storedSeen = (() => {
          try {
            const raw = window.localStorage.getItem(SEEN_KEY)
            return raw ? JSON.parse(raw) : null
          } catch {
            return null
          }
        })()

        const currentIds = new Set(
          rows.map((r) => String(r?.userid || r?.user_id || '').trim()).filter(Boolean)
        )

        if (!storedSeen) {
          // First run: persist current IDs as baseline, no notifications.
          try {
            window.localStorage.setItem(SEEN_KEY, JSON.stringify([...currentIds]))
          } catch {
            /* ignore */
          }
          return
        }

        const seenSet = new Set(Array.isArray(storedSeen) ? storedSeen : [])
        const newUsers = rows
          .filter((r) => {
            const id = String(r?.userid || r?.user_id || '').trim()
            return id && !seenSet.has(id)
          })
          .map((r) => mapSupportUser(r))
          .filter((u) => u?.userId || u?.name)

        if (cancelled) return

        if (newUsers.length > 0) {
          // Fire a toast for each new user (max 3 at a time).
          newUsers.slice(0, 3).forEach((u) => pushNewClientToast(u))

          // Merge with previously stored unread new-client notifications.
          const existing = (() => {
            try {
              const raw = window.localStorage.getItem(NOTIF_KEY)
              return raw ? JSON.parse(raw) : []
            } catch {
              return []
            }
          })()
          const existingIds = new Set(
            (Array.isArray(existing) ? existing : []).map((u) => u.userId)
          )
          const merged = [
            ...newUsers.filter((u) => !existingIds.has(u.userId)),
            ...(Array.isArray(existing) ? existing : []),
          ].slice(0, 30)

          try {
            window.localStorage.setItem(NOTIF_KEY, JSON.stringify(merged))
            window.localStorage.setItem(SEEN_KEY, JSON.stringify([...currentIds]))
          } catch {
            /* ignore */
          }

          setNewClientNotifs(merged)
        } else {
          // No new users but update seen set.
          try {
            window.localStorage.setItem(SEEN_KEY, JSON.stringify([...currentIds]))
          } catch {
            /* ignore */
          }
          // Restore any previously unread notifications from storage.
          const stored = (() => {
            try {
              const raw = window.localStorage.getItem(NOTIF_KEY)
              return raw ? JSON.parse(raw) : []
            } catch {
              return []
            }
          })()
          if (Array.isArray(stored) && stored.length) setNewClientNotifs(stored)
        }
      } catch {
        // Silently ignore — CRM index may not be available.
      }
    }

    const timerId = window.setInterval(checkNewClients, INTERVAL_MS)
    const onReportsUpdated = () => checkNewClients()
    window.addEventListener('bw-reports-updated', onReportsUpdated)
    checkNewClients()

    return () => {
      cancelled = true
      window.clearInterval(timerId)
      window.removeEventListener('bw-reports-updated', onReportsUpdated)
    }
  }, [])

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
        newClientsTitle: '{count} nuovo/i cliente/i registrato/i',
        newClientsSubtitle: 'Rilevati tramite CRM index — nome, affiliato e data registrazione.',
        newClientsClearAll: 'Segna tutti come visti',
        noAffiliate: 'Affiliato n/d',
        noDate: 'Data n/d',
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
      newClientsTitle: '{count} new client(s) registered',
      newClientsSubtitle: 'Detected via CRM index — name, affiliate and registration date.',
      newClientsClearAll: 'Mark all as seen',
      noAffiliate: 'No affiliate',
      noDate: 'Date n/a',
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
    const items = []

    if (dailyUpdate) {
      const summaryLine =
        updateSummary?.changedFields > 0
          ? notificationsText.summaryWithChanges
              .replace('{fields}', String(updateSummary.changedFields))
              .replace('{rows}', String(updateSummary.changedRows))
          : notificationsText.summaryNoChanges
      items.push({
        id: dailyUpdate.notificationId || `daily:${dailyUpdate.dateKey}`,
        kind: 'trustpilot',
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
      })
    }

    if (newClientNotifs.length > 0) {
      items.push({
        id: `new-clients:${newClientNotifs.length}:${newClientNotifs[0]?.userId || ''}`,
        kind: 'new-clients',
        title: notificationsText.newClientsTitle.replace('{count}', String(newClientNotifs.length)),
        subtitle: notificationsText.newClientsSubtitle,
        clients: newClientNotifs,
      })
    }

    return items
  }, [dailyUpdate, notificationsText, updateSummary, newClientNotifs])

  const unreadNotificationsCount = useMemo(
    () => notificationItems.filter((item) => !notificationReadById?.[item.id]).length,
    [notificationItems, notificationReadById]
  )

  const markNotificationRead = (notificationId) => {
    if (!notificationId) return
    setNotificationReadById((prev) => ({ ...prev, [notificationId]: true }))
  }

  const clearNewClientNotifs = () => {
    setNewClientNotifs([])
    try {
      window.localStorage.removeItem('bw_crm_new_notifs:v1')
    } catch {
      /* ignore */
    }
  }

  const pushNewClientToast = (user) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setNewClientToasts((prev) => [...prev.slice(-4), { id, user }])
    window.setTimeout(() => {
      setNewClientToasts((prev) => prev.filter((t) => t.id !== id))
    }, 6000)
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
          <div className="topbar-crm-shell" ref={crmWrapRef}>
            <div className={`topbar-crm-input-wrap${crmSearchOpen ? ' is-open' : ''}`}>
              <span className="topbar-crm-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <path
                    d="M21 21l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
              <input
                ref={crmInputRef}
                value={crmQuery}
                onChange={(e) => {
                  setCrmQuery(e.target.value)
                  setCrmSearchOpen(true)
                }}
                onFocus={() => {
                  if (String(crmQuery || '').trim() || crmResultsToShow.length) {
                    setCrmSearchOpen(true)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (crmResultsToShow[0]?.raw) handleSelectCrmUser(crmResultsToShow[0].raw)
                    else runCrmSearch(crmQuery)
                  }
                }}
                className="topbar-crm-input"
                placeholder={t('support.search.placeholder')}
                aria-label={t('support.search.ariaLabel')}
              />
              {crmLoading ? <span className="topbar-crm-spinner" aria-hidden="true" /> : null}
            </div>

            {crmSearchOpen && (crmLoading || String(crmQuery || '').trim()) ? (
              <div className="topbar-crm-dropdown hide-scrollbar">
                {crmLoading ? (
                  <div className="topbar-crm-empty">Searching user data…</div>
                ) : crmResultsToShow.length ? (
                  crmResultsToShow.map(({ raw, mapped }, index) => (
                    <button
                      key={`${mapped?.userId || mapped?.mt5 || 'user'}-${index}`}
                      type="button"
                      className="topbar-crm-result"
                      onClick={() => handleSelectCrmUser(raw)}
                    >
                      <span className="topbar-crm-result-main">
                        <span className="topbar-crm-result-name">
                          {mapped?.name || mapped?.userId || '—'}
                        </span>
                        <span className="topbar-crm-result-meta">
                          {mapped?.userId || '—'}
                          {mapped?.mt5 ? ` · MT5 ${mapped.mt5}` : ''}
                          {mapped?.affiliateId ? ` · AFF ${mapped.affiliateId}` : ''}
                        </span>
                      </span>
                      <span className="topbar-crm-result-side">
                        {mapped?.totalDeposits ? formatSupportEuro(mapped.totalDeposits) : '—'}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="topbar-crm-empty">{t('support.userCheck.noResults')}</div>
                )}
              </div>
            ) : null}
          </div>

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
            <div className="mobile-nav-menu absolute top-full left-0 right-0 bg-linear-to-b from-gray-700/98 to-gray-700/98 backdrop-blur-lg border-b border-white/10 shadow-2xl md:hidden z-50">
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
                {qlikSource ? (
                  <span style={{ marginRight: 8 }}>
                    <QlikSourcePill source={qlikSource} />
                  </span>
                ) : null}
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
                        border: '1px solid #374151',
                        borderRadius: 12,
                        background: '#374151',
                        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.40)',
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

                          if (item.kind === 'new-clients') {
                            return (
                              <div
                                key={item.id}
                                style={{
                                  border: '1px solid rgba(52,211,153,0.45)',
                                  borderRadius: 10,
                                  padding: 10,
                                  background: isRead
                                    ? '#374151'
                                    : 'linear-gradient(180deg, rgba(52,211,153,0.12), rgba(30,41,59,0.9))',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 8,
                                  }}
                                >
                                  <div style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 800 }}>
                                    {item.title}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      borderRadius: 999,
                                      padding: '2px 8px',
                                      background: isRead ? '#374151' : '#065f46',
                                      color: isRead ? '#cbd5e1' : '#6ee7b7',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {isRead ? notificationsText.read : notificationsText.unread}
                                  </span>
                                </div>
                                <div style={{ color: '#a7f3d0', fontSize: 11, marginTop: 4 }}>
                                  {item.subtitle}
                                </div>
                                <div style={{ marginTop: 8, display: 'grid', gap: 5 }}>
                                  {item.clients.slice(0, 8).map((u, idx) => (
                                    <div
                                      key={u.userId || idx}
                                      style={{
                                        borderLeft: '3px solid #34d399',
                                        paddingLeft: 8,
                                        fontSize: 11,
                                        color: '#e2e8f0',
                                      }}
                                    >
                                      <span style={{ fontWeight: 700 }}>
                                        {u.name || u.userId || '—'}
                                      </span>
                                      <span style={{ color: '#94a3b8', marginLeft: 6 }}>
                                        {'Aff: '}
                                        {u.affiliateId || notificationsText.noAffiliate}
                                      </span>
                                      {u.regDate ? (
                                        <span style={{ color: '#64748b', marginLeft: 6 }}>
                                          {u.regDate.slice(0, 10)}
                                        </span>
                                      ) : null}
                                    </div>
                                  ))}
                                  {item.clients.length > 8 ? (
                                    <div style={{ color: '#64748b', fontSize: 11 }}>
                                      +{item.clients.length - 8} altri…
                                    </div>
                                  ) : null}
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                  <button
                                    type="button"
                                    onClick={clearNewClientNotifs}
                                    style={{
                                      border: '1px solid #065f46',
                                      background: '#374151',
                                      color: '#6ee7b7',
                                      borderRadius: 8,
                                      padding: '5px 8px',
                                      fontSize: 11,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {notificationsText.newClientsClearAll}
                                  </button>
                                  {!isRead ? (
                                    <button
                                      type="button"
                                      onClick={() => markNotificationRead(item.id)}
                                      style={{
                                        border: '1px solid #1e40af',
                                        background: '#374151',
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
                              </div>
                            )
                          }

                          // Trustpilot / daily notification
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
                                    ? '#374151'
                                    : 'rgba(37, 99, 235, 0.18)',
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
                                    background: isRead ? '#374151' : '#2563eb',
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
                                  color: hasChanges ? '#fde68a' : '#f8fafc',
                                  fontSize: 12,
                                  fontWeight: 800,
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
                                      <div
                                        key={`${h.reviewLine}-${h.field}-${idx}`}
                                        style={{
                                          marginBottom: 4,
                                          borderLeft: '3px solid #f59e0b',
                                          paddingLeft: 6,
                                        }}
                                      >
                                        {`#${h.reviewLine} · ${label}: ${compactValue(h.before)} -> ${compactValue(h.after)}`}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : null}
                              <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 12 }}>
                                {item.stats.join(' | ')}
                              </div>
                              <div
                                style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}
                              >
                                <button
                                  type="button"
                                  onClick={openTrustpilotGuide}
                                  style={{
                                    border: '1px solid #374151',
                                    background: '#374151',
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
                                      border: '1px solid #1e40af',
                                      background: '#374151',
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
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: 12 }}>
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

      {crmSelected ? (
        <div
          className="topbar-crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="CRM user details"
        >
          <div className="topbar-crm-modal-backdrop" onClick={() => setCrmSelectedRaw(null)} />
          {crmCopiedKey ? <div className="topbar-crm-toast">Copiato</div> : null}
          <div className="topbar-crm-modal-panel">
            <button
              type="button"
              className="topbar-crm-modal-close"
              onClick={() => setCrmSelectedRaw(null)}
              aria-label="Close CRM modal"
            >
              ×
            </button>
            <div className="topbar-crm-profile">
              <div className="topbar-crm-profile-header">
                <div>
                  <div className="topbar-crm-profile-name-row">
                    <div className="topbar-crm-profile-name">{crmSelected.name || '—'}</div>
                    {crmSelected.name ? (
                      <button
                        type="button"
                        className="topbar-crm-copy-btn"
                        onClick={() => copyCrmValue('name', crmSelected.name)}
                        title={crmCopiedKey === 'name' ? 'Copiato' : 'Copia nome'}
                      >
                        {crmCopiedKey === 'name' ? '✓' : '⧉'}
                      </button>
                    ) : null}
                  </div>
                  <div className="topbar-crm-profile-subtitle">
                    <span className="topbar-crm-meta-pill">
                      <span>{crmSelected.userId || '—'}</span>
                      {crmSelected.userId ? (
                        <button
                          type="button"
                          className="topbar-crm-copy-btn"
                          onClick={() => copyCrmValue('userId', crmSelected.userId)}
                          title={crmCopiedKey === 'userId' ? 'Copiato' : 'Copia ID'}
                        >
                          {crmCopiedKey === 'userId' ? '✓' : '⧉'}
                        </button>
                      ) : null}
                    </span>
                    {crmSelected.mt5 ? (
                      <span className="topbar-crm-meta-pill">
                        <span>{`MT5 ${crmSelected.mt5}`}</span>
                        <button
                          type="button"
                          className="topbar-crm-copy-btn"
                          onClick={() => copyCrmValue('mt5', crmSelected.mt5)}
                          title={crmCopiedKey === 'mt5' ? 'Copiato' : 'Copia MT5'}
                        >
                          {crmCopiedKey === 'mt5' ? '✓' : '⧉'}
                        </button>
                      </span>
                    ) : null}
                    {crmSelected.country ? (
                      <span className="topbar-crm-meta-pill is-static">{crmSelected.country}</span>
                    ) : null}
                  </div>
                </div>
                <div className="topbar-crm-profile-badge">{crmSelected.status || 'Client'}</div>
              </div>

              <div className="topbar-crm-kpis">
                <div className="topbar-crm-kpi">
                  <span>Affiliate</span>
                  <strong className="topbar-crm-kpi-copy-row">
                    <span>{crmSelected.affiliateId || '—'}</span>
                    {crmSelected.affiliateId ? (
                      <button
                        type="button"
                        className="topbar-crm-copy-btn"
                        onClick={() => copyCrmValue('affiliate', crmSelected.affiliateId)}
                        title={crmCopiedKey === 'affiliate' ? 'Copiato' : 'Copia affiliate'}
                      >
                        {crmCopiedKey === 'affiliate' ? '✓' : '⧉'}
                      </button>
                    ) : null}
                  </strong>
                </div>
                <div className="topbar-crm-kpi">
                  <span>Total deposits</span>
                  <strong>{formatSupportEuro(crmSelected.totalDeposits)}</strong>
                </div>
                <div className="topbar-crm-kpi">
                  <span>Net deposits</span>
                  <strong>{formatSupportEuro(crmSelected.netDeposits)}</strong>
                </div>
                <div className="topbar-crm-kpi">
                  <span>Withdrawals</span>
                  <strong>{formatSupportEuro(crmSelected.withdrawals)}</strong>
                </div>
                <div className="topbar-crm-kpi">
                  <span>Volume</span>
                  <strong>{crmSelected.volume || '—'}</strong>
                </div>
                <div className="topbar-crm-kpi">
                  <span>P/L</span>
                  <strong>{formatSupportEuro(crmSelected.pl)}</strong>
                </div>
              </div>

              <div className="topbar-crm-modal-actions">
                <button
                  type="button"
                  className="topbar-crm-secondary-btn"
                  onClick={() =>
                    copyCrmValue(
                      'deepLink',
                      `${window.location.origin}/support/user-check?q=${encodeURIComponent(crmSelected.userId || crmSelected.name || '')}`
                    )
                  }
                >
                  {crmCopiedKey === 'deepLink' ? 'Link copiato' : 'Copia link'}
                </button>
                <a
                  className="topbar-crm-open-link"
                  href={`/support/user-check?q=${encodeURIComponent(crmSelected.userId || crmSelected.name || '')}`}
                >
                  Open full User Check ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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

      {/* New-client toast notifications — top-right stack */}
      {newClientToasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            right: 16,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          {newClientToasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                minWidth: 280,
                maxWidth: 340,
                background: 'linear-gradient(135deg, rgba(6,95,70,0.97), rgba(15,23,42,0.97))',
                border: '1px solid rgba(52,211,153,0.5)',
                borderRadius: 12,
                padding: '12px 14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                animation: 'bw-toast-in 0.25s ease',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>🆕</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#6ee7b7', fontWeight: 800, fontSize: 12, marginBottom: 3 }}>
                  Nuova registrazione
                </div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>
                  {toast.user?.name || toast.user?.userId || '—'}
                </div>
                {toast.user?.affiliateId ? (
                  <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                    Affiliato: {toast.user.affiliateId}
                  </div>
                ) : null}
                {toast.user?.regDate ? (
                  <div style={{ color: '#64748b', fontSize: 11 }}>
                    {String(toast.user.regDate).slice(0, 10)}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setNewClientToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6ee7b7',
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                  padding: 0,
                  marginTop: 1,
                }}
                aria-label="Chiudi notifica"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
