// src/features/support/pages/SupportUserCheck.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { encodeSharePayload } from '../../../utils/shareCodec.js'
import { getPublicShareOrigin } from '../../../utils/publicShareOrigin'
import FullPageLoader from '../../../components/FullPageLoader'
import { useI18n } from '../../../i18n/I18nContext'
import {
  searchUsers,
  loadCsvRows,
  computeActivityIntelligence,
  loadPaymentsReport,
  resolveSearchedAffiliate,
  getPaymentAffiliateById,
  buildAffiliateKpiMap,
  getAffiliateKpi,
  computePriority,
  buildSupportDecision,
} from '../services/supportUserCheckService'
import SupportUserDetails from './SupportUserDetails'
import { useDataStatus } from '../../../context/DataStatusContext'
import {
  loadFraudPatternsIndex,
  getFraudPatternForUser,
} from '../../../services/fraudPatternsService'

// Key lists
const NAME_KEYS = ['customername', 'customer_name', 'name', 'fullname']
const USERID_KEYS = ['userid', 'user_id', 'user id', 'user']
const MT5_KEYS = ['mt5account', 'mt5_account', 'mt5']
const REGDATE_KEYS = [
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
const FIRST_DEPOSIT_KEYS = [
  'firstdeposit',
  'firstDeposit',
  'first_deposit',
  'first deposit',
  'firstDepositAmount',
]
const FIRST_DEPOSIT_DATE_KEYS = [
  'firstdepositdate',
  'firstDepositDate',
  'firstdeposit_at',
  'firstDepositAt',
]
const QUALIFY_KEYS = [
  'qualificationdate',
  'qualificationDate',
  'qualification_date',
  'qualifydate',
  'qftd',
]
const DEPOSIT_COUNT_KEYS = [
  'depositcount',
  'depositCount',
  'deposit_count',
  'depositscount',
  'depositsCount',
  'deposits_count',
]
const TOTAL_DEPOSITS_KEYS = [
  'totaldeposits',
  'totalDeposits',
  'total_deposits',
  'totaldeposit',
  'totalDeposit',
  'total_deposit',
]
const NET_DEPOSITS_KEYS = ['netdeposits', 'netDeposits', 'net_deposits']
const WITHDRAWALS_KEYS = ['withdrawals', 'totalwithdrawals', 'total_withdrawals']
const AFF_KEYS = ['affiliateid', 'affiliate_id', 'affiliate']
const STATUS_KEYS = ['status']
const COUNTRY_KEYS = ['country']
const FRAUD_KEYS = ['fraud', 'fraudchargeback', 'fraud/chargeback']
const ACTION_KEYS = ['action']

// Trading activity
const POSITION_COUNT_KEYS = ['positioncount', 'position_count', 'position count']

// Trading / comms
const LOTS_KEYS = ['lots', 'total_lots']
const VOLUME_KEYS = ['volume', 'turnover']
const PL_KEYS = ['pl', 'profitloss', 'netpl', 'net_pl']
const SPREAD_KEYS = ['spread']
const ROI_KEYS = ['roi']
const COMMISSIONS_KEYS = ['commissions', 'affiliatecommissions', 'affiliate_commissions', 'comm']
const AFF_COMM_KEYS = ['affiliatecommissions', 'affiliate_commissions']
const SUB_AFF_COMM_KEYS = [
  'subaffiliatecommissions',
  'sub_affiliate_commissions',
  'sub_aff_commissions',
]
const CPA_KEYS = ['cpacommission', 'cpa_commission', 'cpa']
const CPL_KEYS = ['cplcommission', 'cpl_commission', 'cpl']
const REVSHARE_KEYS = ['revshare', 'revsharecommission', 'revshare_commission']

// helpers
function pickField(row, candidates) {
  if (!row) return ''
  for (const k of candidates) {
    const v = row?.[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function getMapped(row) {
  if (!row) return null
  return {
    raw: row,
    name: pickField(row, NAME_KEYS),
    userId: pickField(row, USERID_KEYS),
    mt5: pickField(row, MT5_KEYS),
    regDate: pickField(row, REGDATE_KEYS),
    firstDeposit: pickField(row, FIRST_DEPOSIT_KEYS),
    qualificationDate: pickField(row, QUALIFY_KEYS),
    depositCount: pickField(row, DEPOSIT_COUNT_KEYS),
    totalDeposits: pickField(row, TOTAL_DEPOSITS_KEYS),
    depositNum: toNum(pickField(row, TOTAL_DEPOSITS_KEYS)),
    netDeposits: pickField(row, NET_DEPOSITS_KEYS),
    withdrawals: pickField(row, WITHDRAWALS_KEYS),
    affiliateId: pickField(row, AFF_KEYS),
    status: pickField(row, STATUS_KEYS),
    country: pickField(row, COUNTRY_KEYS),
    action: pickField(row, ACTION_KEYS),
    lots: pickField(row, LOTS_KEYS),
    volume: pickField(row, VOLUME_KEYS),
    positionCount: pickField(row, POSITION_COUNT_KEYS),
    pl: pickField(row, PL_KEYS),
    spread: pickField(row, SPREAD_KEYS),
    roi: pickField(row, ROI_KEYS),
    commissions: pickField(row, COMMISSIONS_KEYS),
    affiliateCommissions: pickField(row, AFF_COMM_KEYS),
    subAffiliateCommissions: pickField(row, SUB_AFF_COMM_KEYS),
    commission_cpa: pickField(row, CPA_KEYS),
    commission_cpl: pickField(row, CPL_KEYS),
    revshare: pickField(row, REVSHARE_KEYS),
  }
}

function toNum(x) {
  if (x === null || x === undefined) return 0
  const n = Number(String(x).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(n) ? n : 0
}

function parseDateToTs(value) {
  const s = String(value || '').trim()
  if (!s) return null

  // Try native parsing first (handles ISO, RFC, etc.)
  const native = Date.parse(s)
  if (Number.isFinite(native)) return native

  // Common formats we see in exports: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
  const m1 = s.match(
    /^\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?\s*$/
  )
  if (m1) {
    const day = Number(m1[1])
    const month = Number(m1[2])
    const year = Number(m1[3])
    const hh = m1[4] != null ? Number(m1[4]) : 0
    const mm = m1[5] != null ? Number(m1[5]) : 0
    const ss = m1[6] != null ? Number(m1[6]) : 0
    const dt = new Date(year, Math.max(0, month - 1), day, hh, mm, ss)
    const ts = dt.getTime()
    return Number.isFinite(ts) ? ts : null
  }

  return null
}

function fmtEuro(v) {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  const n = toNum(v)
  return `€${n.toLocaleString()}`
}

function fmtEuro2(v) {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  const n = toNum(v)
  return `€${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDollar(v) {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  const n = toNum(v)
  return `$${n.toLocaleString()}`
}

function fmtPercent(v) {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  const s = String(v).trim()
  if (s.includes('%')) return s
  const n = Number(String(s).replace(/[^0-9.-]+/g, ''))
  if (!Number.isFinite(n)) return s
  const out = Math.abs(n) < 1 ? n * 100 : n
  return `${out.toFixed(1)}%`
}

function colorForNumber(v) {
  const n = toNum(v)
  if (n > 0) return '#22c55e' // green
  if (n === 0) return '#f97316' // orange
  return '#f87171' // red
}

function toPartnerCustomerIdFromQuery(q) {
  const s = String(q || '').trim()
  if (!s) return null
  const lower = s.toLowerCase()
  if (lower.startsWith('bullwaves-')) {
    const digits = s.slice('bullwaves-'.length).replace(/\D+/g, '')
    return digits ? `bullwaves-${digits}` : null
  }
  const digits = s.replace(/\D+/g, '')
  return digits ? `bullwaves-${digits}` : null
}

const sectionTitleStyle = { fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 8 }
const sectionContentStyle = { color: '#9aa4b2' }

export default function SupportUserCheck({ shareConfig = null }) {
  const { t } = useI18n()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedRaw, setSelectedRaw] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [resultsFilter, setResultsFilter] = useState('all')
  const [browseDays, setBrowseDays] = useState(14)

  // Avoid blocking initial render with heavy CSV work; show the UI immediately.
  const [initializing, setInitializing] = useState(false)

  const [paymentsLoaded, setPaymentsLoaded] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const [affiliateName, setAffiliateName] = useState(null)
  const [affiliateKpi, setAffiliateKpi] = useState(null)
  const [fraudIndex, setFraudIndex] = useState(null)
  const [fraudPattern, setFraudPattern] = useState(null)
  const [dataStatus, setDataStatus] = useState(null)
  const [showDataStatusPopup, setShowDataStatusPopup] = useState(false)

  const { setDataStatus: setGlobalDataStatus } = useDataStatus()

  const inputRef = useRef(null)
  const lastReqRef = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Carica dati iniziali per status
  useEffect(() => {
    if (import.meta.env.DEV) console.log('Loading initial data for status')
    async function loadInitialData() {
      setInitializing(true)
      try {
        const version = (() => {
          try {
            return String(localStorage.getItem('bw_reports_version') || '')
          } catch {
            return ''
          }
        })()
        const metaUrl = version
          ? `/reports_meta.json?v=${encodeURIComponent(version)}`
          : '/reports_meta.json'
        const resp = await fetch(metaUrl)
        if (!resp || !resp.ok) return
        const text = await resp.text()
        if (!text || String(text).trimStart().startsWith('<')) return

        let meta = null
        try {
          meta = JSON.parse(text)
        } catch {
          meta = null
        }

        const latestIso = meta?.reports?.registrations?.latestDate
        if (!latestIso) return
        const latestDate = new Date(latestIso)
        if (Number.isNaN(latestDate.getTime())) return

        // Keep the same output shape as checkDataStatus() without scanning all rows.
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const latest = new Date(latestDate)
        latest.setHours(0, 0, 0, 0)
        const diffTime = today - latest
        const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        const reportName = 'Registrations Report'

        const statusObj =
          daysDiff <= 1
            ? {
                status: 'updated',
                message: `${reportName} aggiornato fino al ${latestDate.toLocaleDateString('it-IT')}`,
                latestDate,
                daysDiff,
                reportName,
              }
            : {
                status: 'outdated',
                message: `${reportName} obsoleto: ultimo aggiornamento ${latestDate.toLocaleDateString('it-IT')} (${daysDiff} giorni fa)`,
                latestDate,
                daysDiff,
                reportName,
              }

        setDataStatus(statusObj)
        setGlobalDataStatus(statusObj)
        setShowDataStatusPopup(true)
      } catch (err) {
        console.error('Failed to load registrations for status', err)
      } finally {
        setInitializing(false)
      }
    }
    loadInitialData()
  }, [])

  // Focus shortcut: press '/' to focus the search input (UI enhancement only)
  useEffect(() => {
    function onKey(e) {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        // ignore if typing in inputs or editable fields
        const tag = document.activeElement && document.activeElement.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable)
          return
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const selected = useMemo(() => (selectedRaw ? getMapped(selectedRaw) : null), [selectedRaw])
  const mappedResults = useMemo(
    () => (results || []).map((r) => ({ raw: r, mapped: getMapped(r) })),
    [results]
  )

  const filteredResults = useMemo(() => {
    if (!mappedResults || mappedResults.length === 0) return []
    if (!resultsFilter || resultsFilter === 'all') return mappedResults

    const hasFtd = (m) => {
      if (!m) return false
      const firstDeposit = String(m.firstDeposit || '').trim()
      const depositCount = toNum(m.depositCount)
      const totalDeposits = toNum(m.totalDeposits)
      const netDeposits = toNum(m.netDeposits)
      return Boolean(firstDeposit) || depositCount > 0 || totalDeposits > 0 || netDeposits > 0
    }

    const isQualified = (m) => {
      if (!m) return false
      const q = String(m.qualificationDate || '').trim()
      return Boolean(q)
    }

    const hasRegistration = (m) => {
      if (!m) return false
      const r = String(m.regDate || '').trim()
      return Boolean(r)
    }

    if (resultsFilter === 'registeredNoDeposit') {
      return mappedResults.filter(({ mapped }) => hasRegistration(mapped) && !hasFtd(mapped))
    }

    if (resultsFilter === 'ftdNotQualified') {
      return mappedResults.filter(({ mapped }) => hasFtd(mapped) && !isQualified(mapped))
    }

    return mappedResults
  }, [mappedResults, resultsFilter])
  const cacheRef = useRef(new Map())
  const debounceRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  // If reports are re-uploaded while this page is open, invalidate the per-query
  // cache so the next search reflects the new `support_users_index.json`.
  useEffect(() => {
    const onReportsUpdated = () => {
      try {
        cacheRef.current?.clear?.()
      } catch {
        // ignore
      }

      const trimmed = String(query || '').trim()
      if (trimmed) runSearch(trimmed)
    }

    const onStorage = (e) => {
      if (!e || e.key === 'bw_reports_version') onReportsUpdated()
    }

    window.addEventListener('bw-reports-updated', onReportsUpdated)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('bw-reports-updated', onReportsUpdated)
      window.removeEventListener('storage', onStorage)
    }
  }, [query])

  const [botCandidates, setBotCandidates] = useState([])
  const [botCandidatesLoading, setBotCandidatesLoading] = useState(false)
  const [botHoverIndex, setBotHoverIndex] = useState(null)
  const [botListMissingPositionCount, setBotListMissingPositionCount] = useState(false)
  const [botShareCopied, setBotShareCopied] = useState(false)
  const [pageShareCopied, setPageShareCopied] = useState(false)

  const onShareSupportUserCheck = async () => {
    try {
      if (typeof window === 'undefined') return
      const shareOrigin = getPublicShareOrigin()
      const origin = window.location.origin

      const payload = {
        v: 1,
        k: 'suc',
        g: Date.now(),
        // Mask config (kept compact)
        m: { comm: true, arev: true },
      }

      const randomTokenSuffix = (len = 12) => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let out = ''
        const arr = new Uint8Array(len)
        try {
          window.crypto?.getRandomValues?.(arr)
          for (let i = 0; i < len; i++) out += alphabet[arr[i] % alphabet.length]
          return out
        } catch {
          // ignore
        }
        for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
        return out
      }

      let href = null
      try {
        const resp = await fetch('/api/share/create-support-user-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        })
        const data = await resp.json().catch(() => null)
        const token = data?.token
        if (resp.ok && token && String(token).startsWith('share_')) {
          href = `${shareOrigin}/s/${encodeURIComponent(String(token))}`
        }
      } catch {
        // ignore
      }

      // Local dev fallback (no Vercel functions): store config in localStorage
      if (!href && /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(origin)) {
        try {
          const token = `share_local_${randomTokenSuffix(16)}`
          const key = `bw_share_support_user_check:${token}`
          window.localStorage.setItem(key, JSON.stringify({ payload, createdAt: Date.now() }))
          href = `${shareOrigin}/share/support-user-check/${token}`
        } catch {
          // ignore
        }
      }

      // Absolute fallback (no token)
      if (!href) href = `${shareOrigin}/share/support-user-check`

      try {
        await navigator.clipboard.writeText(href)
        setPageShareCopied(true)
        window.setTimeout(() => setPageShareCopied(false), 1400)
      } catch {
        // ignore
      }

      window.open(href, '_blank', 'noopener,noreferrer')
    } catch {
      // ignore
    }
  }

  const hasFtdFromRow = (row) => {
    if (!row) return false
    const firstDeposit = String(pickField(row, FIRST_DEPOSIT_KEYS) || '').trim()
    const firstDepositDate = String(pickField(row, FIRST_DEPOSIT_DATE_KEYS) || '').trim()
    const depositCount = toNum(pickField(row, DEPOSIT_COUNT_KEYS))
    const totalDeposits = toNum(pickField(row, TOTAL_DEPOSITS_KEYS))
    const netDeposits = toNum(pickField(row, NET_DEPOSITS_KEYS))
    return (
      Boolean(firstDeposit) ||
      Boolean(firstDepositDate) ||
      depositCount > 0 ||
      totalDeposits > 0 ||
      netDeposits > 0
    )
  }

  const isQualifiedFromRow = (row) => {
    if (!row) return false
    const q = String(pickField(row, QUALIFY_KEYS) || '').trim()
    return Boolean(q)
  }

  const hasRegistrationFromRow = (row) => {
    if (!row) return false
    const r = String(pickField(row, REGDATE_KEYS) || '').trim()
    return Boolean(r)
  }

  const runBrowse = async (segment) => {
    const nextSegment = segment || 'registeredNoDeposit'
    const days = Number(browseDays) || 14

    setLoading(true)
    setSearched(true)
    setSelectedRaw(null)
    setResultsFilter(nextSegment)

    try {
      const rows = await loadCsvRows()
      const now = Date.now()
      const minTs = now - days * 24 * 60 * 60 * 1000

      const candidates = []
      for (const row of rows || []) {
        const regStr = pickField(row, REGDATE_KEYS)
        const regTs = parseDateToTs(regStr)
        if (!regTs || regTs < minTs) continue

        if (nextSegment === 'registeredNoDeposit') {
          if (!hasRegistrationFromRow(row)) continue
          if (hasFtdFromRow(row)) continue
          candidates.push({ row, regTs })
          continue
        }

        if (nextSegment === 'ftdNotQualified') {
          if (!hasFtdFromRow(row)) continue
          if (isQualifiedFromRow(row)) continue
          candidates.push({ row, regTs })
          continue
        }
      }

      candidates.sort((a, b) => b.regTs - a.regTs)
      const limited = candidates.slice(0, 500).map((c) => c.row)
      setResults(limited)
    } catch (err) {
      console.error('Failed to build browse list', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Precompute a default "Potential Bot (EA aggressive)" list for fast triage.
  useEffect(() => {
    let mounted = true
    setBotCandidatesLoading(true)
    setBotListMissingPositionCount(false)

    const schedule =
      typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb) => window.setTimeout(() => cb({ timeRemaining: () => 0, didTimeout: true }), 30)

    const cancelSchedule =
      typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : (id) => window.clearTimeout(id)

    const jobId = schedule(async () => {
      try {
        const BOT_LIST_SIZE = 50
        const rows = await loadCsvRows()
        const safeRows = Array.isArray(rows) ? rows : []

        // Quick presence check: if Position Count column isn't there / isn't filled, skip.
        const hasAnyPositionCount = safeRows.some((raw) => {
          const s = pickField(raw, POSITION_COUNT_KEYS)
          return s !== undefined && s !== null && String(s).trim() !== ''
        })

        if (!hasAnyPositionCount) {
          if (!mounted) return
          setBotCandidates([])
          setBotListMissingPositionCount(true)
          return
        }

        // Avoid running computeActivityIntelligence over the whole dataset.
        // First collect a small pool of candidates by highest Position Count,
        // then run the heavier intelligence only on that pool.
        const CANDIDATE_POOL = 400
        const candidates = []

        function pushTopByPositions(list, item) {
          if (list.length < CANDIDATE_POOL) {
            list.push(item)
            return
          }
          let minIdx = 0
          let minVal = list[0]?.positions || 0
          for (let i = 1; i < list.length; i++) {
            const v = list[i]?.positions || 0
            if (v < minVal) {
              minVal = v
              minIdx = i
            }
          }
          if ((item?.positions || 0) > minVal) list[minIdx] = item
        }

        for (const raw of safeRows) {
          const posRaw = pickField(raw, POSITION_COUNT_KEYS)
          if (posRaw == null || String(posRaw).trim() === '') continue
          const positions = toNum(posRaw)
          if (!positions) continue
          pushTopByPositions(candidates, { raw, positions })
        }

        // Build top list without sorting the entire dataset.
        const topBots = []
        const topFill = []

        function pushTopByScore(list, item) {
          if (list.length < BOT_LIST_SIZE) {
            list.push(item)
            return
          }
          // Replace the current minimum if better.
          let minIdx = 0
          let minScore = list[0]?.intel?.botScore || 0
          for (let i = 1; i < list.length; i++) {
            const s = list[i]?.intel?.botScore || 0
            if (s < minScore) {
              minScore = s
              minIdx = i
            }
          }
          const newScore = item?.intel?.botScore || 0
          if (newScore > minScore) list[minIdx] = item
        }

        for (const c of candidates) {
          const raw = c.raw
          const intel = computeActivityIntelligence(raw)
          if (intel?.positions == null) continue

          const item = { raw, intel }
          if (intel?.isPotentialBot) pushTopByScore(topBots, item)
          else pushTopByScore(topFill, item)
        }

        const byScoreDesc = (a, b) => (b?.intel?.botScore || 0) - (a?.intel?.botScore || 0)
        topBots.sort(byScoreDesc)
        topFill.sort(byScoreDesc)
        const scored = topBots.concat(topFill).slice(0, BOT_LIST_SIZE)

        // Enrich list with affiliate name + registration date (limited size => OK)
        const enriched = await Promise.all(
          scored.map(async (x) => {
            const mapped = getMapped(x.raw)
            const affiliateId = mapped?.affiliateId
            let affiliateName = null
            try {
              const payInfo = await getPaymentAffiliateById(affiliateId)
              affiliateName = payInfo?.affiliateName || null
            } catch (e) {
              affiliateName = null
            }
            return {
              ...x,
              affiliateName,
              regDate: mapped?.regDate || null,
            }
          })
        )

        if (!mounted) return
        setBotCandidates(enriched)
      } catch (e) {
        if (!mounted) return
        setBotCandidates([])
        setBotListMissingPositionCount(false)
      } finally {
        if (mounted) setBotCandidatesLoading(false)
      }
    })

    return () => {
      mounted = false
      try {
        cancelSchedule(jobId)
      } catch {
        // ignore
      }
    }
  }, [])

  function compactDateLabel(s) {
    const raw = String(s || '').trim()
    if (!raw) return '—'
    // report dates are often like "M/D/YYYY HH:mm:ss"; show just the date part
    return raw.split(/\s+/, 1)[0] || raw
  }

  function formatRegDateShort(value) {
    const raw = String(value || '').trim()
    if (!raw) return '—'
    const first = raw.split(/\s+/, 1)[0] || raw
    const d = first.split('/')
    if (d.length >= 3) {
      const a = parseInt(d[0], 10)
      const b = parseInt(d[1], 10)
      const yyyy = parseInt(d[2], 10)
      if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(yyyy)) {
        // heuristic: if first number > 12 => D/M, else M/D
        let mm = a
        let dd = b
        if (a > 12) {
          dd = a
          mm = b
        }
        const pad = (n) => String(n).padStart(2, '0')
        return `${pad(dd)}/${pad(mm)}/${yyyy}`
      }
    }
    return first
  }

  async function runSearch(q) {
    const trimmed = String(q || '').trim()
    if (!trimmed) {
      // when clearing, clear results and selection (user asked to hide results when input emptied)
      setResults([])
      setSearched(false)
      setSelectedRaw(null)
      setAffiliateName(null)
      setAffiliateKpi(null)
      setPaymentsLoaded(false)
      setMediaLoaded(false)
      setLoading(false)
      lastReqRef.current = (lastReqRef.current || 0) + 1
      return
    }

    const reqId = Date.now()
    lastReqRef.current = reqId
    setLoading(true)
    setSearched(true)

    try {
      // simple in-memory cache to avoid repeating heavy CSV parsing for recent queries
      if (cacheRef.current.has(trimmed)) {
        const cached = cacheRef.current.get(trimmed)
        if (lastReqRef.current !== reqId) return
        setResults(Array.isArray(cached) ? cached : [])
        return
      }

      const rows = await searchUsers(trimmed)
      if (lastReqRef.current !== reqId) return
      const out = Array.isArray(rows) ? rows : []
      cacheRef.current.set(trimmed, out)
      setResults(out)
    } catch (err) {
      console.error(err)
      if (lastReqRef.current !== reqId) return
      setResults([])
    } finally {
      if (lastReqRef.current === reqId) setLoading(false)
    }
  }

  // When query becomes empty we must clear selection and return to results list (if present).
  useEffect(() => {
    const trimmed = String(query || '').trim()

    if (!trimmed) {
      // clear visible results when input is emptied
      setResults([])
      setSearched(false)
      setSelectedRaw(null)
      setAffiliateName(null)
      setAffiliateKpi(null)
      setPaymentsLoaded(false)
      setMediaLoaded(false)
      setLoading(false)
      lastReqRef.current = (lastReqRef.current || 0) + 1
    }
  }, [query])

  // Lazy-load affiliate info only when a user is selected
  useEffect(() => {
    let mounted = true

    setAffiliateName(null)
    setAffiliateKpi(null)
    setPaymentsLoaded(false)
    setMediaLoaded(false)

    if (!selectedRaw) return
    ;(async () => {
      const mapped = getMapped(selectedRaw)
      let resolvedAffiliate = null
      try {
        await loadPaymentsReport()
        if (!mounted) return
        setPaymentsLoaded(true)
      } catch (e) {
        if (!mounted) return
        setPaymentsLoaded(true)
      }
      try {
        resolvedAffiliate = await resolveSearchedAffiliate(selectedRaw)
        if (!mounted) return
        setAffiliateName(resolvedAffiliate)
      } catch (e) {
        if (!mounted) return
        setAffiliateName(null)
      }
      // additional fallback: if resolution failed but the raw row contains an affiliate id, try payments mapping
      try {
        if ((!resolvedAffiliate || !resolvedAffiliate.affiliateName) && mapped?.affiliateId) {
          const payInfo = await getPaymentAffiliateById(mapped.affiliateId)
          if (payInfo && payInfo.affiliateName) {
            if (!mounted) return
            setAffiliateName({
              affiliateId: String(mapped.affiliateId).replace(/\D+/g, ''),
              affiliateName: payInfo.affiliateName,
            })
          }
        }
      } catch (e) {
        /* ignore */
      }
      try {
        await buildAffiliateKpiMap()
        if (!mounted) return
        setMediaLoaded(true)
        // Prefer KPI lookup by resolved affiliate id (payments canonical), fallback to affiliateName
        let k = null
        if (resolvedAffiliate && resolvedAffiliate.affiliateId) {
          k = await getAffiliateKpi(resolvedAffiliate.affiliateId)
        } else if (resolvedAffiliate && resolvedAffiliate.affiliateName) {
          k = await getAffiliateKpi(resolvedAffiliate.affiliateName)
        } else if (mapped?.affiliateId) {
          k = await getAffiliateKpi(mapped.affiliateId)
        }
        setAffiliateKpi(k || null)
      } catch (e) {
        if (!mounted) return
        setMediaLoaded(true)
        setAffiliateKpi(null)
      }
    })()

    return () => {
      mounted = false
    }
  }, [selectedRaw])

  // Load fraud patterns index on mount
  useEffect(() => {
    loadFraudPatternsIndex()
      .then(setFraudIndex)
      .catch(() => setFraudIndex(null))
  }, [])

  // Update fraud pattern for selected user
  useEffect(() => {
    if (!selected || !fraudIndex) {
      setFraudPattern(null)
      return
    }
    setFraudPattern(getFraudPatternForUser(fraudIndex, selected.userId))
  }, [selected, fraudIndex])

  function onSelectUser(raw) {
    setSelectedRaw(raw)
  }

  // debounce query changes to avoid firing search on every keystroke
  useEffect(() => {
    const trimmed = String(query || '').trim()
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    // immediate search on Enter handled onKeyDown; debounce for typing
    debounceRef.current = setTimeout(() => {
      runSearch(trimmed)
    }, 140)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query])
  // UI-only derived values
  const qTrim = String(query || '').trim()
  const showHero = !searched && qTrim === '' && !selected

  const ppdTooltip = t('support.activity.tooltip.positionsPerDay')

  const onShareBotList = async () => {
    try {
      if (typeof window === 'undefined') return
      if (!Array.isArray(botCandidates) || botCandidates.length === 0) return

      // v2 payload: keep it extremely compact (arrays, no verbose keys) to shorten the share URL.
      // Row schema: [userId, account, affiliateId, affiliateName, regDate, ageDays, positions, pl, ppd, tier, isPotentialBot, botScore]
      const rows = botCandidates.map(({ raw, intel, affiliateName, regDate }) => {
        const mapped = getMapped(raw)
        const name = mapped?.name || mapped?.userId || '—'
        const plRaw = mapped?.pl
        const pl =
          plRaw !== null && plRaw !== undefined && String(plRaw).trim() !== '' ? plRaw : null
        return [
          mapped?.userId || null,
          name,
          mapped?.affiliateId || null,
          affiliateName || null,
          formatRegDateShort(regDate),
          intel?.ageDays ?? null,
          intel?.positions ?? null,
          pl,
          intel?.positionsPerDay ?? null,
          intel?.tier ?? null,
          Boolean(intel?.isPotentialBot),
          intel?.botScore ?? null,
        ]
      })

      const payload = {
        v: 2,
        k: 'sb50',
        g: Date.now(),
        r: rows,
      }
      const origin = window.location.origin

      const randomTokenSuffix = (len = 12) => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let out = ''
        const arr = new Uint8Array(len)
        try {
          window.crypto?.getRandomValues?.(arr)
          for (let i = 0; i < len; i++) out += alphabet[arr[i] % alphabet.length]
          return out
        } catch {
          // ignore
        }
        for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
        return out
      }

      // Prefer a short token link (WhatsApp-friendly preview).
      // No legacy payload-in-URL fallback: keep public URLs short.
      let href = null
      try {
        const shareOrigin = getPublicShareOrigin()
        const resp = await fetch('/api/share/create-support-botlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        })
        const data = await resp.json().catch(() => null)
        const token = data?.token
        if (resp.ok && token && String(token).startsWith('share_')) {
          href = `${shareOrigin}/s/${encodeURIComponent(String(token))}`
        }
      } catch {
        // ignore
      }

      // Local dev fallback: Vite dev doesn't run Vercel functions, so allow testing short links
      // by storing the snapshot in localStorage (works only on the same browser/device).
      if (!href && /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(origin)) {
        try {
          const shareOrigin = getPublicShareOrigin()
          const token = `share_local_${randomTokenSuffix(16)}`
          const key = `bw_share_support_botlist:${token}`
          window.localStorage.setItem(key, JSON.stringify({ payload, createdAt: Date.now() }))
          href = `${shareOrigin}/share/support-botlist/${token}`
        } catch {
          // ignore
        }
      }

      if (!href) {
        window.alert('Share link non disponibile (storage share non configurato).')
        return
      }

      // best-effort: copy to clipboard + open
      try {
        await navigator.clipboard.writeText(href)
        setBotShareCopied(true)
        window.setTimeout(() => setBotShareCopied(false), 1400)
      } catch {
        // ignore
      }

      window.open(href, '_blank', 'noopener,noreferrer')
    } catch {
      // ignore
    }
  }

  function initialsFor(mapped) {
    const seed = (mapped?.name || mapped?.userId || ' ? ')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join('')
      .toUpperCase()
    return seed
  }

  function tierMeta(tier) {
    const key = tier ? `support.activity.tier.${tier}` : null
    const label = key ? t(key) : '—'

    if (tier === 'inactive') {
      return {
        label,
        fg: 'rgba(255,255,255,0.72)',
        bg: 'rgba(148,163,184,0.12)',
        border: 'rgba(148,163,184,0.22)',
      }
    }
    if (tier === 'low') {
      return { label, fg: '#e2e8f0', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.20)' }
    }
    if (tier === 'active') {
      return { label, fg: '#dbeafe', bg: 'rgba(37,99,235,0.14)', border: 'rgba(37,99,235,0.26)' }
    }
    if (tier === 'high') {
      return { label, fg: '#fff7ed', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.28)' }
    }
    if (tier === 'hyper') {
      return { label, fg: '#fee2e2', bg: 'rgba(239,68,68,0.16)', border: 'rgba(239,68,68,0.32)' }
    }
    return {
      label,
      fg: 'rgba(255,255,255,0.72)',
      bg: 'rgba(148,163,184,0.10)',
      border: 'rgba(148,163,184,0.18)',
    }
  }

  function colorForPpd(ppd, tier) {
    if (!ppd || ppd <= 0) return 'rgba(255,255,255,0.72)'
    if (tier === 'hyper') return '#fca5a5'
    if (tier === 'high') return '#fde68a'
    if (tier === 'active') return '#93c5fd'
    return '#e2e8f0'
  }

  function riskDotMeta(intel) {
    const score = Number(intel?.botScore || 0)
    if (intel?.isPotentialBot) {
      return {
        level: 'high',
        color: '#ef4444',
        shadow: '0 0 0 4px rgba(239,68,68,0.18)',
      }
    }
    if (score >= 90) {
      return {
        level: 'medium',
        color: '#f59e0b',
        shadow: '0 0 0 4px rgba(245,158,11,0.16)',
      }
    }
    if (score >= 45) {
      return {
        level: 'low',
        color: '#22c55e',
        shadow: '0 0 0 4px rgba(34,197,94,0.14)',
      }
    }
    return {
      level: 'veryLow',
      color: 'rgba(148,163,184,0.55)',
      shadow: '0 0 0 4px rgba(148,163,184,0.10)',
    }
  }

  // sort mapped results by numeric total deposits (descending) to surface biggest depositors first
  const sortedResults = useMemo(() => {
    if (!filteredResults || filteredResults.length === 0) return []
    // create shallow copy and sort by mapped.depositNum (precomputed) falling back to parsed value
    return filteredResults.slice().sort((a, b) => {
      const aNum = (a?.mapped?.depositNum ?? toNum(a?.mapped?.totalDeposits)) || 0
      const bNum = (b?.mapped?.depositNum ?? toNum(b?.mapped?.totalDeposits)) || 0
      return bNum - aNum
    })
  }, [filteredResults])

  const resultsToShow = sortedResults.length > 0 ? sortedResults.slice(0, 15) : []

  // determine top-depositor threshold (top 10 results) for visual badge
  const topThreshold = useMemo(() => {
    if (!sortedResults || sortedResults.length === 0) return 0
    const idx = Math.min(9, sortedResults.length - 1)
    return sortedResults[idx]?.mapped?.depositNum || 0
  }, [sortedResults])

  // selected summary groups
  const selectedSummary = selected
    ? {
        account: {
          id: selected.userId || '—',
          mt5: selected.mt5 || '—',
          country: selected.country || '—',
        },
        deposits: {
          total: fmtEuro(selected.totalDeposits),
          count: selected.depositCount || '0',
          net: fmtEuro(selected.netDeposits),
          withdrawals: fmtEuro(selected.withdrawals),
        },
        affiliate: {
          id: affiliateName?.affiliateId || selected.affiliateId || '—',
          name: affiliateName?.affiliateName || '—',
        },
      }
    : null

  // Note: we no longer block the page while parsing large CSVs for initial status.

  // If a user is selected, render the full-width Support Decision Page in-place
  if (selected) {
    return (
      <div
        className={`support-user-check-page w-full px-6 2xl:px-10 ${showHero ? 'is-hero' : 'is-results'}`}
      >
        <SupportUserDetails
          selected={selected}
          shareConfig={shareConfig}
          affiliateName={affiliateName}
          affiliateKpi={affiliateKpi}
          paymentsLoaded={paymentsLoaded}
          mediaLoaded={mediaLoaded}
          fmtEuro={fmtEuro}
          suggestedReply={(mapped, affiliateNameArg, paymentsLoadedArg, mediaLoadedArg) =>
            suggestedReply(t, mapped, affiliateNameArg, paymentsLoadedArg, mediaLoadedArg)
          }
          copyToClipboard={copyToClipboard}
          computePriority={computePriority}
          onBack={() => {
            setSelectedRaw(null)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`support-user-check-page w-full px-6 2xl:px-10 ${showHero ? 'is-hero' : 'is-results'}`}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: showHero ? 0 : 12,
          minHeight: showHero ? '68vh' : undefined,
          alignItems: showHero ? 'center' : undefined,
        }}
      >
        <div style={{ width: '100%', paddingTop: showHero ? 0 : undefined }}>
          <header
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: showHero ? 10 : 6,
              marginBottom: showHero ? 0 : 10,
              textAlign: showHero ? 'center' : 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: showHero ? 'center' : 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <h1
                className="support-hero-title"
                style={{
                  margin: 0,
                  fontSize: showHero ? 26 : 20,
                  fontWeight: 900,
                  letterSpacing: '-0.2px',
                }}
              >
                {t('support.userCheck.title')}
              </h1>
              {typeof window !== 'undefined' &&
              !window.location.pathname.startsWith('/share/support-user-check') ? (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={onShareSupportUserCheck}
                  title={t('support.userCheck.pageShare.hint')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    lineHeight: 1,
                    opacity: 0.95,
                  }}
                >
                  {pageShareCopied
                    ? t('support.userCheck.pageShare.copied')
                    : t('support.userCheck.pageShare.label')}
                </button>
              ) : null}
            </div>
            <div
              style={{
                color: 'var(--muted)',
                fontSize: showHero ? 14 : 13,
                lineHeight: '1.35',
                opacity: showHero ? 0.55 : 1,
                marginTop: showHero ? 14 : 4,
                marginBottom: showHero ? 22 : 8,
              }}
            >
              {t('support.userCheck.subtitle')}
            </div>

            <div
              className={`search-bar ${showHero ? 'search-priority' : ''}`}
              style={{ marginTop: showHero ? 18 : 10, display: 'flex', justifyContent: 'center' }}
            >
              <div style={{ width: '100%', maxWidth: showHero ? 680 : 820, position: 'relative' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: showHero ? 'transparent' : undefined,
                    position: 'relative',
                  }}
                >
                  <span
                    className="search-icon"
                    aria-hidden
                    style={
                      showHero
                        ? {
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 4,
                            opacity: 0.55,
                          }
                        : undefined
                    }
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 21l-4.35-4.35"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (debounceRef.current) window.clearTimeout(debounceRef.current)
                        runSearch(query)
                      }
                    }}
                    placeholder={t('support.search.placeholder')}
                    className="search-input search-hero-input"
                    aria-label={t('support.search.ariaLabel')}
                    style={{
                      width: '100%',
                      fontSize: 16,
                      padding: showHero ? '16px 18px' : '12px 14px',
                      paddingLeft: showHero ? '44px' : undefined,
                    }}
                  />
                </div>

                {/* helper line under input - subtle and small */}
                {showHero && (
                  <div
                    style={{
                      marginTop: 32,
                      color: 'var(--muted)',
                      fontSize: 11,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 18,
                      opacity: 0.45,
                    }}
                  >
                    <div style={{ minWidth: 160, textAlign: 'center' }}>
                      {t('support.userCheck.hint.instant')}
                    </div>
                    <div style={{ minWidth: 160, textAlign: 'center' }}>
                      {t('support.userCheck.hint.press')} <strong>/</strong>{' '}
                      {t('support.userCheck.hint.toFocus')} ·{' '}
                      <strong>{t('common.keys.enter')}</strong> {t('support.userCheck.hint.toRun')}
                    </div>
                  </div>
                )}

                {showHero && (
                  <div
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                      opacity: 0.95,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)' }}>
                      Liste retention
                    </div>
                    <select
                      value={browseDays}
                      onChange={(e) => setBrowseDays(Number(e.target.value) || 14)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid rgba(148,163,184,0.22)',
                        background: 'rgba(2,6,23,0.35)',
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: 12,
                        fontWeight: 800,
                        outline: 'none',
                      }}
                      aria-label="Retention timeframe"
                    >
                      <option value={7}>Ultimi 7 giorni</option>
                      <option value={14}>Ultimi 14 giorni</option>
                      <option value={30}>Ultimi 30 giorni</option>
                      <option value={90}>Ultimi 90 giorni</option>
                    </select>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => runBrowse('registeredNoDeposit')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      Registrati · 0 depositi
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => runBrowse('ftdNotQualified')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      FTD · non qualificati
                    </button>
                  </div>
                )}

                {/* secondary placeholder inside input - muted examples */}
                {/* examples removed as secondary placeholder per request */}
              </div>
            </div>

            {/* Default triage list: potential Bot (EA aggressive) */}
            {showHero && (
              <div className="bot-top10-wrap" style={{ margin: '18px auto 0' }}>
                <div
                  className="card no-card-hover"
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: '1px solid rgba(239,68,68,0.14)',
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.70), rgba(2,6,23,0.55))',
                    boxShadow: '0 16px 38px rgba(2,6,23,0.60)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>
                        {t('support.userCheck.botList.title')}
                      </div>
                      <div
                        style={{ marginTop: 4, color: 'var(--muted)', fontSize: 12, opacity: 0.9 }}
                      >
                        {t('support.userCheck.botList.subtitle')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: botCandidatesLoading
                            ? 'rgba(255,255,255,0.65)'
                            : botListMissingPositionCount
                              ? 'rgba(255,255,255,0.72)'
                              : 'rgba(255,255,255,0.78)',
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: botCandidatesLoading
                            ? '1px solid rgba(148,163,184,0.18)'
                            : botListMissingPositionCount
                              ? '1px solid rgba(239,68,68,0.18)'
                              : '1px solid rgba(34,197,94,0.18)',
                          background: botCandidatesLoading
                            ? 'rgba(148,163,184,0.08)'
                            : botListMissingPositionCount
                              ? 'rgba(239,68,68,0.08)'
                              : 'rgba(34,197,94,0.08)',
                        }}
                        title={t('support.userCheck.botList.positionCountBadge.tooltip')}
                      >
                        {botCandidatesLoading
                          ? t('support.userCheck.botList.positionCountBadge.checking')
                          : botListMissingPositionCount
                            ? t('support.userCheck.botList.positionCountBadge.missing')
                            : t('support.userCheck.botList.positionCountBadge.ok')}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.72)',
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: '1px solid rgba(239,68,68,0.18)',
                          background: 'rgba(239,68,68,0.08)',
                          alignSelf: 'flex-start',
                        }}
                        title={ppdTooltip}
                      >
                        {t('support.userCheck.botList.ppdChip')}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.65)',
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: '1px solid rgba(148,163,184,0.18)',
                          background: 'rgba(148,163,184,0.08)',
                        }}
                        title={t('support.userCheck.botList.shortcuts')}
                      >
                        {t('support.userCheck.botList.shortcuts')}
                      </div>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={onShareBotList}
                        disabled={botCandidatesLoading || !botCandidates.length}
                        title={t('support.userCheck.botList.share.hint')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          lineHeight: 1,
                          opacity: botCandidatesLoading || !botCandidates.length ? 0.55 : 1,
                        }}
                      >
                        {botShareCopied
                          ? t('support.userCheck.botList.share.copied')
                          : t('support.userCheck.botList.share.label')}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {botCandidatesLoading ? (
                      <div style={{ padding: 12, color: 'var(--muted)', fontSize: 13 }}>
                        {t('support.userCheck.botList.loading')}
                      </div>
                    ) : botListMissingPositionCount ? (
                      <div style={{ padding: 12, color: 'var(--muted)', fontSize: 13 }}>
                        <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.82)' }}>
                          {t('support.userCheck.botList.missingPositionCount.title')}
                        </div>
                        <div style={{ marginTop: 6, lineHeight: 1.35 }}>
                          {t('support.userCheck.botList.missingPositionCount.body')}
                        </div>
                      </div>
                    ) : botCandidates.length ? (
                      <>
                        <div
                          className="bot-top10-grid bot-top10-header"
                          style={{
                            padding: '10px 12px',
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 0.2,
                            color: 'rgba(255,255,255,0.55)',
                            background: 'rgba(255,255,255,0.03)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 26, textAlign: 'center' }}>#</div>
                            <div aria-hidden style={{ width: 8, height: 8 }} />
                          </div>
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}
                          >
                            <div aria-hidden style={{ width: 34, height: 34, flex: '0 0 auto' }} />
                            <div style={{ minWidth: 0 }}>{t('support.details.account')}</div>
                          </div>
                          <div className="bot-top10-only-wide">
                            {t('support.details.affiliate')}
                          </div>
                          <div className="bot-top10-only-wide">
                            {t('support.details.userTimeline.registration')}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {t('support.activity.metrics.ageDays')}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {t('support.activity.metrics.positions')}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {t('support.details.tradingPerformance.pl')}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {t('support.activity.metrics.positionsPerDay')}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {t('support.activity.metrics.tier')}
                          </div>
                        </div>

                        <div className="hide-scrollbar bot-top10-scroll">
                          {botCandidates.map(({ raw, intel, affiliateName, regDate }, i) => {
                            const mapped = getMapped(raw)
                            const name = mapped?.name || mapped?.userId || '—'
                            const plRaw = mapped?.pl
                            const hasPl =
                              plRaw !== null && plRaw !== undefined && String(plRaw).trim() !== ''
                            const plNum = hasPl ? toNum(plRaw) : null
                            const ppd =
                              intel?.positionsPerDay != null ? intel.positionsPerDay : null
                            const ageDays = intel?.ageDays
                            const tier = intel?.tier
                            const tm = tierMeta(tier)
                            const isHover = botHoverIndex === i
                            const regLabel = formatRegDateShort(regDate)
                            const affLabel = affiliateName || '—'
                            const dot = riskDotMeta(intel)
                            const isBot = Boolean(intel?.isPotentialBot)

                            return (
                              <div
                                key={i}
                                role="button"
                                tabIndex={0}
                                onMouseEnter={() => setBotHoverIndex(i)}
                                onMouseLeave={() => setBotHoverIndex(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') onSelectUser(raw)
                                }}
                                onClick={() => onSelectUser(raw)}
                                className="bot-top10-grid"
                                style={{
                                  padding: '10px 12px',
                                  cursor: 'pointer',
                                  background: isHover
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(255,255,255,0.02))'
                                    : 'transparent',
                                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                                  transition: 'background 120ms ease, transform 120ms ease',
                                  transform: isHover ? 'translateY(-1px)' : 'translateY(0)',
                                }}
                                title={t('support.userCheck.botList.openHint')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 9,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 11,
                                      fontWeight: 900,
                                      color: 'rgba(255,255,255,0.8)',
                                      background: 'rgba(148,163,184,0.10)',
                                      border: '1px solid rgba(148,163,184,0.16)',
                                    }}
                                  >
                                    {i + 1}
                                  </div>
                                  <span
                                    aria-hidden
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: 999,
                                      background: dot.color,
                                      boxShadow: dot.shadow,
                                    }}
                                    title={`${t('support.userCheck.botList.riskScore')}: ${Number(intel?.botScore || 0).toFixed(0)}`}
                                  />
                                </div>

                                <div
                                  style={{
                                    minWidth: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: 12,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 900,
                                      fontSize: 12,
                                      color: '#fff',
                                      background:
                                        'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(2,6,23,0.15))',
                                      border: '1px solid rgba(99,102,241,0.22)',
                                      flex: '0 0 auto',
                                    }}
                                  >
                                    {initialsFor(mapped)}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        minWidth: 0,
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontWeight: 950,
                                          fontSize: 13,
                                          color: 'rgba(255,255,255,0.92)',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          minWidth: 0,
                                        }}
                                      >
                                        {name}
                                      </div>
                                      <span
                                        style={{
                                          fontSize: 10,
                                          fontWeight: 950,
                                          padding: '2px 8px',
                                          borderRadius: 999,
                                          border: isBot
                                            ? '1px solid rgba(239,68,68,0.35)'
                                            : '1px solid rgba(148,163,184,0.24)',
                                          background: isBot
                                            ? 'rgba(239,68,68,0.12)'
                                            : 'rgba(148,163,184,0.10)',
                                          color: isBot ? '#fecaca' : 'rgba(255,255,255,0.70)',
                                          flex: '0 0 auto',
                                          textTransform: 'uppercase',
                                          letterSpacing: 0.35,
                                        }}
                                        title={
                                          isBot
                                            ? t('support.userCheck.botList.badge.botHint')
                                            : t('support.userCheck.botList.badge.fillHint')
                                        }
                                      >
                                        {isBot
                                          ? t('support.userCheck.botList.badge.bot')
                                          : t('support.userCheck.botList.badge.fill')}
                                      </span>
                                    </div>
                                    <div
                                      className="bot-top10-only-compact"
                                      style={{
                                        marginTop: 2,
                                        color: 'rgba(255,255,255,0.55)',
                                        fontSize: 11,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {affLabel !== '—'
                                        ? affLabel
                                        : t('support.details.noAffiliate')}
                                      {regLabel && regLabel !== '—' ? ` · ${regLabel}` : ''}
                                    </div>
                                  </div>
                                </div>

                                <div className="bot-top10-only-wide" style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      fontSize: 12,
                                      color: 'rgba(255,255,255,0.78)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {affLabel}
                                  </div>
                                </div>
                                <div
                                  className="bot-top10-only-wide"
                                  style={{
                                    textAlign: 'right',
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.70)',
                                    fontWeight: 800,
                                  }}
                                >
                                  {regLabel}
                                </div>

                                <div
                                  style={{
                                    textAlign: 'right',
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.80)',
                                    fontWeight: 800,
                                  }}
                                >
                                  {ageDays != null ? ageDays : '—'}
                                </div>
                                <div
                                  style={{
                                    textAlign: 'right',
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.80)',
                                    fontWeight: 800,
                                  }}
                                >
                                  {intel?.positions == null
                                    ? '—'
                                    : intel.positions.toLocaleString()}
                                </div>
                                <div
                                  style={{
                                    textAlign: 'right',
                                    fontSize: 12,
                                    fontWeight: 900,
                                    color: hasPl ? colorForNumber(plNum) : 'rgba(255,255,255,0.55)',
                                  }}
                                  title={t('support.details.tradingPerformance.pl')}
                                >
                                  {hasPl ? fmtEuro2(plNum) : '—'}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div
                                    style={{
                                      fontWeight: 950,
                                      color: colorForPpd(ppd == null ? 0 : ppd, tier),
                                      fontSize: 13,
                                      lineHeight: 1,
                                    }}
                                    title={ppdTooltip}
                                  >
                                    {ppd == null ? '—' : ppd.toFixed(1)}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 900,
                                      padding: '5px 10px',
                                      borderRadius: 999,
                                      color: tm.fg,
                                      background: tm.bg,
                                      border: `1px solid ${tm.border}`,
                                    }}
                                  >
                                    {tm.label}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* subtle fade so scrollability is perceived without a scrollbar */}
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 34,
                            background:
                              'linear-gradient(180deg, rgba(2,6,23,0.00), rgba(2,6,23,0.55) 55%, rgba(2,6,23,0.70))',
                            pointerEvents: 'none',
                          }}
                        />
                      </>
                    ) : (
                      <div style={{ padding: 12, color: 'var(--muted)', fontSize: 13 }}>
                        {t('support.userCheck.botList.empty')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </header>

          {/* results area (unchanged logic, compact presentation) */}
          {searched && (
            <div style={{ marginTop: 6 }}>
              {loading ? (
                <FullPageLoader
                  minHeight={220}
                  progress={55}
                  subtitle={t('support.loader.results')}
                />
              ) : (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      flexWrap: 'wrap',
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)' }}>
                        Filtro
                      </div>
                      <select
                        value={resultsFilter}
                        onChange={(e) => setResultsFilter(e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 10,
                          border: '1px solid rgba(148,163,184,0.22)',
                          background: 'rgba(2,6,23,0.35)',
                          color: 'rgba(255,255,255,0.92)',
                          fontSize: 12,
                          fontWeight: 800,
                          outline: 'none',
                        }}
                        aria-label="Results filter"
                      >
                        <option value="all">Tutti</option>
                        <option value="registeredNoDeposit">Registrati, 0 depositi</option>
                        <option value="ftdNotQualified">FTD, non qualificati</option>
                      </select>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 800 }}>
                      {sortedResults.length.toLocaleString()} results
                    </div>
                  </div>

                  <div className="support-list">
                    {resultsToShow.map(({ raw, mapped }, idx) => {
                      const isSel = selectedRaw === raw
                      const isHover = hoverIndex === idx
                      const initials = initialsFor(mapped)
                      return (
                        <div key={idx} className="support-list-item" style={{ marginBottom: 6 }}>
                          <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') onSelectUser(raw)
                            }}
                            onClick={() => onSelectUser(raw)}
                            onMouseEnter={() => setHoverIndex(idx)}
                            onMouseLeave={() => setHoverIndex(null)}
                            className="support-row"
                            style={{ border: isSel ? '1px solid rgba(99,102,241,0.9)' : undefined }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                gap: 14,
                                alignItems: 'center',
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 12,
                                  background: 'linear-gradient(135deg,#06b6d4,#7c3aed)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                }}
                              >
                                {initials}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div className="name">{mapped.name || mapped.userId || '—'}</div>
                                  {(() => {
                                    const isTop =
                                      mapped?.depositNum &&
                                      topThreshold > 0 &&
                                      mapped.depositNum >= topThreshold
                                    return isTop ? (
                                      <span className="badge top">
                                        {t('support.userCheck.badge.top')}
                                      </span>
                                    ) : null
                                  })()}
                                </div>
                                <div className="meta">
                                  {mapped.userId || ''}
                                  {mapped.mt5 ? ` · ${mapped.mt5}` : ''}
                                  {mapped.country ? ` · ${mapped.country}` : ''}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 900 }}>{fmtEuro(mapped.totalDeposits)}</div>
                              <div className="deposits">
                                {t('support.userCheck.deposits', {
                                  count: mapped.depositCount || '0',
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {resultsToShow.length === 0 &&
                      (() => {
                        const partnerId = toPartnerCustomerIdFromQuery(query)
                        const partnerUrl = partnerId
                          ? `https://partner.trackingaffiliates.com/v2/adminv2/#!/app/customer-profile/${encodeURIComponent(partnerId)}`
                          : null
                        // Cellxpert logic: fixed format, only last 6 digits from user input
                        let cellxpertUrl = null
                        if (partnerId) {
                          const digits = String(query || '').replace(/\D+/g, '')
                          const last6 = digits.slice(-6)
                          if (last6.length === 6) {
                            cellxpertUrl = `https://partner.trackingaffiliates.com/v2/adminv2/#!/app/customer-profile/bullwaves-${last6}`
                          }
                        }

                        // Skale logic: fixed format, only last 6 digits from user input
                        let skaleUrl = null
                        if (partnerId) {
                          // Extract only the last 6 digits from the user input
                          const digits = String(query || '').replace(/\D+/g, '')
                          const last6 = digits.slice(-6)
                          if (last6.length === 6) {
                            skaleUrl = `https://bul934907.skalecrm.com/index.php?module=Accounts&view=Detail&record=${last6}`
                          }
                        }

                        return (
                          <div
                            className="neutral-card"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 900 }}>
                                {t('support.userCheck.noResults')}
                              </div>
                              {partnerId ? (
                                <div style={{ marginTop: 4, opacity: 0.8 }}>{partnerId}</div>
                              ) : null}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {cellxpertUrl && (
                                <a
                                  href={cellxpertUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 999,
                                    border: '1px solid rgba(99,102,241,0.28)',
                                    background: 'rgba(99,102,241,0.14)',
                                    color: 'rgba(255,255,255,0.92)',
                                    fontWeight: 900,
                                    fontSize: 12,
                                    textDecoration: 'none',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title="Open in Cellxpert"
                                >
                                  Open in Cellxpert
                                </a>
                              )}
                              {skaleUrl && (
                                <a
                                  href={skaleUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 999,
                                    border: '1px solid rgba(99,102,241,0.28)',
                                    background: 'rgba(99,102,241,0.14)',
                                    color: 'rgba(255,255,255,0.92)',
                                    fontWeight: 900,
                                    fontSize: 12,
                                    textDecoration: 'none',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title="Open in Skale"
                                >
                                  Open in Skale
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* selected user handled via full-page SupportUserDetails when present */}
        </div>
      </div>
    </div>
  )
}

function suggestedReply(t, mapped, affiliateName, paymentsLoaded, mediaLoaded) {
  if (!mapped) return ''

  // Use the Support Decision Engine for intelligent reply suggestions
  // Prefer real flags when available; otherwise assume data loaded.
  const decision = buildSupportDecision({
    ...mapped,
    paymentsLoaded: typeof paymentsLoaded === 'boolean' ? paymentsLoaded : true,
    mediaLoaded: typeof mediaLoaded === 'boolean' ? mediaLoaded : true,
  })

  if (decision?.replyKey) {
    const name = mapped.name || mapped.userId || t('support.reply.customerFallback')
    return t(decision.replyKey, { name })
  }

  const name = mapped.name || mapped.userId || t('support.reply.customerFallback')
  return t('support.reply.fallback', { name })
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard?.writeText(text)
  } catch (e) {
    /* ignore */
  }
}
