import React, { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import FullPageLoader from '../../../components/FullPageLoader'
import { useI18n } from '../../../i18n/I18nContext'
import { useMediaPaymentsData } from '../../media-payments/hooks/useMediaPaymentsData'
import {
  cleanNumber,
  formatEuro,
  formatNumberShort,
  formatPercent,
  normalizeAffiliateKey,
  normalizeKey,
} from '../../../lib/formatters'
import { deriveAffiliateKpis } from '../utils/buildWeeklyAffiliateReport'
import {
  getBoardSessionToken,
  isShareToken,
  validateAffiliateReportsToken,
} from '../utils/shareAuth'
import CohortDecayView from '../../../components/CohortDecayView'
import { useCohortNetDepositsCalendar } from '../hooks/useCohortNetDepositsCalendar'

const REGISTRATIONS_CANDIDATES = [
  '/Registrations Report.csv',
  '/01012023 to 01112026 Registrations Report.csv',
]
const AFFILIATE_INDEX_URL = '/affiliate_index.json'

let __bwShareAffiliateIndexCache = null
let __bwShareRegistrationsDepositAggCache = null

const pick = (row, keys, fallback = '') => {
  for (const k of keys) {
    if (!k) continue
    if (
      Object.prototype.hasOwnProperty.call(row, k) &&
      row[k] !== undefined &&
      row[k] !== null &&
      String(row[k]).trim() !== ''
    ) {
      return row[k]
    }
  }
  return fallback
}

const parseLooseUsDate = (raw) => {
  if (!raw) return null
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw
  const s = String(raw).trim()
  if (!s) return null

  const direct = new Date(s)
  if (!Number.isNaN(direct.getTime())) return direct

  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  const month = Number(m[1])
  const day = Number(m[2])
  const year = Number(m[3])
  const d = new Date(year, Math.max(month, 1) - 1, Math.max(day, 1))
  return Number.isNaN(d.getTime()) ? null : d
}

function getReportsVersion() {
  try {
    return String(localStorage.getItem('bw_reports_version') || '')
  } catch {
    return ''
  }
}

function buildVersionedUrl(path) {
  const v = getReportsVersion()

  const rawPath = String(path || '')
  const encodedPath = encodeURI(rawPath)
  const sep = encodedPath.includes('?') ? '&' : '?'
  const withVersion = v ? `${encodedPath}${sep}v=${encodeURIComponent(String(v))}` : encodedPath

  // PapaParse with { download: true, worker: true } runs XHR inside a blob worker.
  // Relative URLs can break there; prefer absolute URLs.
  try {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      if (/^https?:\/\//i.test(withVersion)) return withVersion
      return new URL(withVersion, window.location.origin).toString()
    }
  } catch {
    // ignore
  }

  return withVersion
}

function useAffiliateIndexByName(enabled = true) {
  const [byName, setByName] = useState(null)
  const [byNameStrict, setByNameStrict] = useState(null)

  useEffect(() => {
    if (!enabled) return

    const v = getReportsVersion()
    const cacheKey = v || ''
    if (__bwShareAffiliateIndexCache && __bwShareAffiliateIndexCache.key === cacheKey) {
      setByName(__bwShareAffiliateIndexCache.byName)
      setByNameStrict(__bwShareAffiliateIndexCache.byNameStrict)
      return
    }

    let alive = true

    ;(async () => {
      try {
        const url = v
          ? `${AFFILIATE_INDEX_URL}?v=${encodeURIComponent(String(v))}`
          : AFFILIATE_INDEX_URL
        const res = await fetch(url)
        if (!res || !res.ok) return
        const json = await res.json().catch(() => null)
        const byId = json && typeof json === 'object' ? json.byId : null
        if (!byId || typeof byId !== 'object') return

        const map = new Map()
        const mapStrict = new Map()
        for (const [id, name] of Object.entries(byId)) {
          const idKey = String(id || '').trim()
          const nm = String(name ?? '').trim()
          if (!idKey || !nm) continue
          const k = normalizeKey(nm)
          const ks = normalizeAffiliateKey(nm)
          if (k && !map.has(k)) map.set(k, idKey)
          if (ks && !mapStrict.has(ks)) mapStrict.set(ks, idKey)
        }

        __bwShareAffiliateIndexCache = { key: cacheKey, byName: map, byNameStrict: mapStrict }
        if (!alive) return
        setByName(map)
        setByNameStrict(mapStrict)
      } catch {
        // ignore
      }
    })()

    return () => {
      alive = false
    }
  }, [enabled])

  return { byName, byNameStrict }
}

function useRegistrationsDepositsAgg(enabled = false) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [byAffiliateMonth, setByAffiliateMonth] = useState(null)
  const [totalsByAffiliate, setTotalsByAffiliate] = useState(null)

  useEffect(() => {
    if (!enabled) return

    const urlCandidates = (REGISTRATIONS_CANDIDATES || []).map((p) => buildVersionedUrl(p))
    const cacheKey = urlCandidates.join('|')

    if (
      __bwShareRegistrationsDepositAggCache &&
      __bwShareRegistrationsDepositAggCache.key === cacheKey
    ) {
      setByAffiliateMonth(__bwShareRegistrationsDepositAggCache.byAffiliateMonth)
      setTotalsByAffiliate(__bwShareRegistrationsDepositAggCache.totalsByAffiliate)
      setError(null)
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)
    setError(null)

    const normalizeRow = (r) => {
      const normalized = {}
      Object.keys(r || {}).forEach((k) => {
        const nk = String(k || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
        normalized[nk] = typeof r[k] === 'string' ? r[k].trim() : r[k]
      })
      return normalized
    }

    const pickKey = (obj, candidates) =>
      candidates.find((k) => Object.prototype.hasOwnProperty.call(obj, k))

    const parseNum = (v) => Number(String(v || '').replace(/[^0-9\.-]/g, '')) || 0

    const parseFromUrl = (url) =>
      new Promise((resolve, reject) => {
        const perAffiliateMonth = new Map()
        const perAffiliateTotal = new Map()
        let sawAny = false
        let affiliateKey = null
        let depositKey = null
        let dateKey = null

        const ensure = (affiliateId) => {
          const k = String(affiliateId || '').trim()
          if (!k) return null
          if (!perAffiliateMonth.has(k)) perAffiliateMonth.set(k, new Map())
          return perAffiliateMonth.get(k)
        }

        const ingest = (rawRow) => {
          const r = normalizeRow(rawRow)
          if (!affiliateKey) {
            affiliateKey = pickKey(r, [
              'affiliate_id',
              'affiliateid',
              'affiliate',
              'affiliate_code',
              'affiliate_ref',
            ])
          }
          if (!depositKey) {
            depositKey = pickKey(r, [
              'deposit_count',
              'deposits_count',
              'num_deposits',
              'deposits',
              'depositcount',
            ])
          }
          if (!dateKey) {
            dateKey = pickKey(r, [
              'registration_date',
              'registrationdate',
              'reg_date',
              'date',
              'created_at',
              'createdat',
              'external_date',
              'externaldate',
            ])
          }

          const affiliateId = affiliateKey ? String(r[affiliateKey] || '').trim() : ''
          if (!affiliateId) return

          const dRaw = dateKey ? r[dateKey] : null
          const dt = parseLooseUsDate(dRaw)
          if (!dt) return

          const monthId = monthIdFromParts(dt.getFullYear(), dt.getMonth())
          if (typeof monthId !== 'number') return

          const depositCount = depositKey ? parseNum(r[depositKey]) : 0

          const monthMap = ensure(affiliateId)
          if (!monthMap) return
          if (depositCount) monthMap.set(monthId, (monthMap.get(monthId) || 0) + depositCount)
          perAffiliateTotal.set(
            affiliateId,
            (perAffiliateTotal.get(affiliateId) || 0) + depositCount
          )
        }

        Papa.parse(url, {
          download: true,
          worker: true,
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          chunk: (results) => {
            if (!alive) return
            const data = results?.data
            if (Array.isArray(data) && data.length) {
              sawAny = true
              for (const row of data) ingest(row)
            }
          },
          complete: () => {
            if (!alive) return
            if (!sawAny) {
              const err = new Error('Registrations CSV empty or missing')
              err.kind = 'missing'
              reject(err)
              return
            }
            resolve({ byAffiliateMonth: perAffiliateMonth, totalsByAffiliate: perAffiliateTotal })
          },
          error: (err) => {
            reject(err)
          },
        })
      })

    ;(async () => {
      try {
        let lastErr = null
        for (const url of urlCandidates) {
          try {
            const parsed = await parseFromUrl(url)
            if (!alive) return
            __bwShareRegistrationsDepositAggCache = { key: cacheKey, ...parsed }
            setByAffiliateMonth(parsed.byAffiliateMonth)
            setTotalsByAffiliate(parsed.totalsByAffiliate)
            setError(null)
            setLoading(false)
            return
          } catch (e) {
            lastErr = e
          }
        }
        if (!alive) return
        setError(lastErr || new Error('Unable to load registrations CSV'))
        setByAffiliateMonth(new Map())
        setTotalsByAffiliate(new Map())
        setLoading(false)
      } catch (e) {
        if (!alive) return
        setError(e)
        setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [enabled])

  return { loading, error, byAffiliateMonth, totalsByAffiliate }
}

const statusFromProfit = (t, profit) => {
  if (profit >= 0) return { label: t('shareAffiliateAnalysis.status.performing'), tone: '#22c55e' }
  if (profit > -1000) return { label: t('shareAffiliateAnalysis.status.stable'), tone: '#f59e0b' }
  return { label: t('shareAffiliateAnalysis.status.underperforming'), tone: '#ef4444' }
}

const LanguageToggle = ({ locale, setLocale }) => {
  const mkBtn = (id, label) => (
    <button
      key={id}
      onClick={() => setLocale(id)}
      className="card card-global"
      style={{
        padding: '8px 10px',
        borderRadius: 999,
        border:
          locale === id ? '1px solid rgba(34,211,238,0.7)' : '1px solid rgba(255,255,255,0.12)',
        background: locale === id ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.02)',
        color: 'var(--text)',
        fontWeight: 900,
        cursor: 'pointer',
        lineHeight: 1,
      }}
      aria-label={`Language ${label}`}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {mkBtn('en', 'EN')}
      {mkBtn('it', 'IT')}
    </div>
  )
}

const Card = ({ title, subtitle, onClick, rightTag }) => (
  <button
    onClick={onClick}
    className="card card-global"
    style={{
      padding: 14,
      textAlign: 'left',
      cursor: 'pointer',
      border: '1px solid rgba(255,255,255,0.10)',
      background: 'rgba(255,255,255,0.02)',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{subtitle}</div>
    </div>
    {rightTag}
  </button>
)

const Metric = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div
      style={{
        fontSize: 11,
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 800 }}>{value}</div>
  </div>
)

const monthSortKey = (row) => {
  const y = Number(row?.year)
  const m = Number(row?.monthIndex)
  const year = Number.isFinite(y) ? y : 0
  const monthIndex = Number.isFinite(m) ? m : -1
  return year * 100 + (monthIndex + 1)
}

const pickLatestMonth = (rows = []) => {
  if (!rows.length) return null
  const sorted = [...rows]
    .filter((r) => Number.isFinite(Number(r?.year)) && Number.isFinite(Number(r?.monthIndex)))
    .sort((a, b) => monthSortKey(a) - monthSortKey(b))
  return sorted.length ? sorted[sorted.length - 1] : null
}

const buildMonthLabel = (row) => {
  const label = String(row?.monthLabel || '').trim()
  if (label) return label
  const y = Number(row?.year)
  const m = Number(row?.monthIndex)
  if (Number.isFinite(y) && Number.isFinite(m) && m >= 0 && m <= 11) {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    return `${monthNames[m]} ${y}`
  }
  return '—'
}

const formatDelta = (value) => {
  const v = Number(value || 0)
  const sign = v > 0 ? '+' : ''
  return `${sign}${formatEuro(v)}`
}

const deltaPct = (current, previous) => {
  const c = Number(current || 0)
  const p = Number(previous || 0)
  if (!p) return null
  return ((c - p) / Math.max(Math.abs(p), 1)) * 100
}

const trendLine = (label, current, previous, formatter) => {
  const pct = deltaPct(current, previous)
  const delta = Number(current || 0) - Number(previous || 0)
  const deltaLabel =
    formatter === 'euro' ? formatDelta(delta) : `${delta > 0 ? '+' : ''}${formatNumberShort(delta)}`
  const pctLabel = pct === null ? '' : ` (${formatPercent(pct, 1)})`
  return `${label}: ${deltaLabel}${pctLabel} vs previous month.`
}

async function validateShareToken(token) {
  const clean = String(token || '').trim()
  if (!clean) return { ok: false, error: 'missing' }

  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  const canUseLocal =
    /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(origin) || clean.startsWith('share_local_')

  const tryLocal = () => {
    if (!canUseLocal) return null
    try {
      const key = `bw_share_affrep:${clean}`
      const raw = window.localStorage.getItem(key)
      if (raw) return { ok: true, payload: null }
    } catch {
      // ignore
    }
    return null
  }

  try {
    // Preferred route
    const resp = await fetch(`/api/share/affiliate-reports/${encodeURIComponent(clean)}`)
    const data = await resp.json().catch(() => null)
    if (!resp.ok) {
      const local = tryLocal()
      if (local) return local
      // Backward-compatible fallback
      try {
        const resp2 = await fetch(`/api/share/affiliate-analysis/${encodeURIComponent(clean)}`)
        const data2 = await resp2.json().catch(() => null)
        if (!resp2.ok) {
          const local2 = tryLocal()
          if (local2) return local2
          return { ok: false, error: data2?.error || data2?.message || 'invalid' }
        }
        if (!data2?.ok) return { ok: false, error: data2?.error || 'invalid' }
        return { ok: true, payload: data2?.payload || data2?.data || null }
      } catch {
        const local3 = tryLocal()
        if (local3) return local3
        return { ok: false, error: data?.error || data?.message || 'invalid' }
      }
    }
    if (!data?.ok) {
      const local = tryLocal()
      if (local) return local
      return { ok: false, error: data?.error || 'invalid' }
    }
    return { ok: true, payload: data?.payload || data?.data || null }
  } catch {
    const local = tryLocal()
    if (local) return local
    return { ok: false, error: 'network' }
  }
}

function encodeAffiliateId(affiliateName) {
  return encodeURIComponent(String(affiliateName || '').trim())
}

function decodeAffiliateId(affiliateId) {
  try {
    return decodeURIComponent(String(affiliateId || ''))
  } catch {
    return String(affiliateId || '')
  }
}

function normalizePeriodType(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase()
  if (!v) return ''
  if (v === 'since-ever' || v === 'sinceever' || v === 'since' || v === 'all' || v === 'lifetime')
    return 'since-ever'
  if (v === 'ytd' || v === 'year-to-date' || v === 'yeartodate') return 'ytd'
  if (v === 'monthly' || v === 'month') return 'monthly'
  if (v === 'quarterly' || v === 'quarter') return 'quarterly'
  if (v === 'annual' || v === 'yearly' || v === 'year') return 'annual'
  if (v === 'semi-annual' || v === 'semiannual' || v === 'semi') return 'semi-annual'
  return ''
}

const monthIdFromParts = (year, monthIndex) => year * 12 + monthIndex

const monthIdForRow = (row) => {
  const y = Number(row?.year)
  const m = Number(row?.monthIndex)
  if (Number.isFinite(y) && Number.isFinite(m)) return monthIdFromParts(y, m)

  const mk = String(row?.monthKey || '').trim()
  const match = mk.match(/^(\d{4})-(\d{2})$/)
  if (match) {
    const yy = Number(match[1])
    const mm = Number(match[2]) - 1
    if (Number.isFinite(yy) && Number.isFinite(mm) && mm >= 0 && mm <= 11)
      return monthIdFromParts(yy, mm)
  }
  return null
}

const partsFromMonthId = (id) => {
  const monthIndex = ((id % 12) + 12) % 12
  const year = Math.floor(id / 12)
  return { year, monthIndex }
}

const formatMonthYear = (year, monthIndex) => {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const m = Number(monthIndex)
  const y = Number(year)
  if (!Number.isFinite(m) || !Number.isFinite(y) || m < 0 || m > 11) return '—'
  return `${monthNames[m]} ${y}`
}

const formatMonthRange = (startId, endId) => {
  if (startId === null || endId === null) return '—'
  const s = partsFromMonthId(startId)
  const e = partsFromMonthId(endId)
  const a = formatMonthYear(s.year, s.monthIndex)
  const b = formatMonthYear(e.year, e.monthIndex)
  if (a === b) return a
  return `${a} — ${b}`
}

function buildRollingPeriodContext(rows, periodType, t) {
  const list = rows || []
  let latest = null
  let earliest = null
  for (const r of list) {
    const id = monthIdForRow(r)
    if (id === null) continue
    if (latest === null || id > latest) latest = id
    if (earliest === null || id < earliest) earliest = id
  }

  return buildRollingPeriodContextFromBounds({ earliest, latest }, periodType, t)
}

function buildRollingPeriodContextFromBounds(bounds, periodType, t) {
  const earliest = bounds?.earliest ?? null
  const latest = bounds?.latest ?? null

  if (periodType === 'since-ever') {
    return {
      type: 'since-ever',
      startId: null,
      endId: null,
      label: t('shareAffiliateReports.period.sinceEver') || 'Since Ever',
      hasPrevious: false,
      prevStartId: null,
      prevEndId: null,
    }
  }

  if (latest === null) {
    return {
      type: periodType,
      startId: null,
      endId: null,
      label: '—',
      hasPrevious: false,
      prevStartId: null,
      prevEndId: null,
    }
  }

  const endId = latest
  const end = partsFromMonthId(endId)

  const rollingMonths = (n) => {
    const startId = endId - (n - 1)
    const prevEndId = startId - 1
    const prevStartId = prevEndId - (n - 1)
    const hasPrevious = earliest !== null && prevStartId >= earliest
    return {
      startId,
      endId,
      label: `${formatMonthRange(startId, endId)}`,
      hasPrevious,
      prevStartId: hasPrevious ? prevStartId : null,
      prevEndId: hasPrevious ? prevEndId : null,
    }
  }

  if (periodType === 'monthly') {
    const startId = endId
    const prevEndId = endId - 1
    const hasPrevious = earliest !== null && prevEndId >= earliest
    return {
      type: 'monthly',
      startId,
      endId,
      label: formatMonthRange(startId, endId),
      hasPrevious,
      prevStartId: hasPrevious ? prevEndId : null,
      prevEndId: hasPrevious ? prevEndId : null,
    }
  }
  if (periodType === 'quarterly') {
    const r = rollingMonths(3)
    return { type: 'quarterly', ...r }
  }
  if (periodType === 'semi-annual') {
    const r = rollingMonths(6)
    return { type: 'semi-annual', ...r }
  }
  if (periodType === 'annual') {
    const r = rollingMonths(12)
    return { type: 'annual', ...r }
  }
  if (periodType === 'ytd') {
    const startId = monthIdFromParts(end.year, 0)
    const prevStartId = monthIdFromParts(end.year - 1, 0)
    const prevEndId = monthIdFromParts(end.year - 1, end.monthIndex)
    const hasPrevious = earliest !== null && prevStartId >= earliest
    const jan = formatMonthYear(end.year, 0).split(' ')[0]
    return {
      type: 'ytd',
      startId,
      endId,
      label: `${t('shareAffiliateReports.period.ytd') || 'Year to date'}: ${jan} — ${formatMonthYear(end.year, end.monthIndex)}`,
      hasPrevious,
      prevStartId: hasPrevious ? prevStartId : null,
      prevEndId: hasPrevious ? prevEndId : null,
    }
  }

  return {
    type: periodType,
    startId: null,
    endId: null,
    label: '—',
    hasPrevious: false,
    prevStartId: null,
    prevEndId: null,
  }
}

function periodKeyForRow(row, periodType) {
  const year = Number(row?.year)
  const monthIndex = Number(row?.monthIndex)
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return null

  if (periodType === 'monthly') {
    return String(row?.monthKey || `${year}-${monthIndex}`)
  }
  if (periodType === 'quarterly') {
    const q = Math.floor(monthIndex / 3) + 1
    return `${year}-Q${q}`
  }
  if (periodType === 'semi-annual') {
    const h = monthIndex < 6 ? 1 : 2
    return `${year}-H${h}`
  }
  if (periodType === 'annual') {
    return String(year)
  }
  return null
}

function periodSortValue(row, periodType) {
  const year = Number(row?.year)
  const monthIndex = Number(row?.monthIndex)
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return -1

  if (periodType === 'monthly') return year * 100 + monthIndex
  if (periodType === 'quarterly') return year * 10 + (Math.floor(monthIndex / 3) + 1)
  if (periodType === 'semi-annual') return year * 10 + (monthIndex < 6 ? 1 : 2)
  if (periodType === 'annual') return year
  return -1
}

function labelForPeriodKey(periodType, key, fallbackLabel) {
  if (periodType === 'monthly') return fallbackLabel || String(key || '—')
  const k = String(key || '')
  if (periodType === 'quarterly') {
    const m = k.match(/^(\d{4})-Q([1-4])$/)
    return m ? `Q${m[2]} ${m[1]}` : k || '—'
  }
  if (periodType === 'semi-annual') {
    const m = k.match(/^(\d{4})-H([1-2])$/)
    return m ? `H${m[2]} ${m[1]}` : k || '—'
  }
  if (periodType === 'annual') return k || '—'
  return k || '—'
}

function directionFromDelta(delta, deadband = 0.00001) {
  const d = Number(delta || 0)
  if (Math.abs(d) <= deadband) return 'flat'
  return d > 0 ? 'up' : 'down'
}

function trendWord(t, dir) {
  if (dir === 'up') return t('shareAffiliateAnalysis.comparison.up') || 'Up'
  if (dir === 'down') return t('shareAffiliateAnalysis.comparison.down') || 'Down'
  if (dir === 'flat') return t('shareAffiliateAnalysis.comparison.flat') || 'Flat'
  return '—'
}

function AffiliateExecutiveCumulativeChart({
  t,
  locale,
  data,
  height = 260,
  highlightStartId = null,
  highlightEndId = null,
}) {
  if (!data || data.length === 0) return null

  const colors = { regs: '#60a5fa', ftd: '#10b981', qftd: '#f59e0b' }

  const computeSizing = () => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1400
    const maxWidthPx =
      vw >= 2100 ? 1400 : vw >= 1600 ? 1200 : vw >= 1200 ? 1000 : vw >= 980 ? 900 : 760
    const responsiveHeight =
      vw >= 1600
        ? Math.max(height, 300)
        : vw >= 1200
          ? Math.max(height, 280)
          : Math.min(height, 240)
    return { maxWidthPx, responsiveHeight }
  }

  const [chartSizing, setChartSizing] = useState(() => computeSizing())
  const svgRef = React.useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    const onResize = () => setChartSizing(computeSizing())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const series = [...data]
    .map((d) => ({
      key: d.key,
      date: d.date instanceof Date ? d.date : new Date(d._ts || Date.parse(d.date)),
      _ts: Number(d._ts || Date.parse(d.date) || 0),
      monthId: d.monthId === null || d.monthId === undefined ? null : Number(d.monthId),
      regsCum: Number(d.cumRegs || 0),
      ftdCum: Number(d.cumFTD || 0),
      qftdCum: Number(d.cumQFTD || 0),
    }))
    .filter((s) => s.date && !Number.isNaN(s._ts))
    .sort((a, b) => a._ts - b._ts)
  if (!series.length) return null

  const highlight = (() => {
    if (highlightStartId === null || highlightStartId === undefined) return null
    if (highlightEndId === null || highlightEndId === undefined) return null
    const sId = Number(highlightStartId)
    const eId = Number(highlightEndId)
    if (!Number.isFinite(sId) || !Number.isFinite(eId)) return null

    const startIndex = series.findIndex((p) => Number.isFinite(p.monthId) && p.monthId >= sId)
    const endIndexFromRight = [...series]
      .reverse()
      .findIndex((p) => Number.isFinite(p.monthId) && p.monthId <= eId)
    const endIndex = endIndexFromRight >= 0 ? series.length - 1 - endIndexFromRight : -1
    if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) return null
    return { startIndex, endIndex }
  })()

  const maxRegs = Math.max(...series.map((s) => s.regsCum), 1)
  const maxRight = Math.max(...series.map((s) => Math.max(s.ftdCum, s.qftdCum)), 1)

  const nice = (v) => {
    const exp = Math.pow(10, Math.floor(Math.log10(v)))
    const n = v / exp
    const cap = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
    return cap * exp
  }

  const topLeft = Math.min(nice(Math.ceil(maxRegs * 1.08)), 250000)
  const topRight = nice(Math.ceil(maxRight * 1.08))

  const W = 1200
  const H = chartSizing.responsiveHeight
  const padL = 88
  const padR = 120
  const padT = 40
  const padB = 68

  const yLeft = (v) => padT + (H - padT - padB) * (1 - v / topLeft)
  const yRight = (v) => padT + (H - padT - padB) * (1 - v / topRight)
  const xFor = (i) => {
    const denom = Math.max(1, series.length - 1)
    return padL + (i * (W - padL - padR)) / denom
  }

  const highlightRect = (() => {
    if (!highlight) return null
    const x1 = xFor(highlight.startIndex)
    const x2 = xFor(highlight.endIndex)
    const left = Math.min(x1, x2)
    const width = Math.max(1, Math.abs(x2 - x1))
    return { left, width }
  })()

  const buildPath = (pts) => {
    if (!pts.length) return ''
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i === 0 ? pts[0] : pts[i - 1]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = i + 2 < pts.length ? pts[i + 2] : p2
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return d
  }

  const regsPts = series.map((s, i) => ({ x: xFor(i), y: yLeft(s.regsCum) }))
  const ftdPts = series.map((s, i) => ({ x: xFor(i), y: yRight(s.ftdCum) }))
  const qftdPts = series.map((s, i) => ({ x: xFor(i), y: yRight(s.qftdCum) }))

  const maxXlabels = 8
  const step = Math.max(1, Math.ceil(series.length / maxXlabels))

  const onMouseMove = (e) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const xRel = e.clientX - rect.left
    const xInView = (xRel / rect.width) * W
    let best = 0
    let bestDist = Infinity
    series.forEach((s, i) => {
      const dx = Math.abs(xInView - xFor(i))
      if (dx < bestDist) {
        bestDist = dx
        best = i
      }
    })
    const s = series[best]
    setHoverIndex(best)
    setHover({
      x: xFor(best),
      label: s.date ? s.date.toISOString().slice(0, 7) : s.key,
      regsCum: s.regsCum,
      ftdCum: s.ftdCum,
      qftdCum: s.qftdCum,
    })
  }
  const onMouseLeave = () => {
    setHoverIndex(null)
    setHover(null)
  }

  return (
    <div style={{ padding: 6, position: 'relative' }}>
      <div
        style={{
          width: '100%',
          maxWidth: chartSizing.maxWidthPx,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', aspectRatio: `${W} / ${H}` }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', height: '100%', display: 'block' }}
            role="img"
            aria-label={
              t('shareAffiliateReports.chart.aria.cumulative') ||
              'Affiliate growth cumulative chart'
            }
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            {highlightRect ? (
              <rect
                x={highlightRect.left}
                y={padT}
                width={highlightRect.width}
                height={Math.max(1, H - padT - padB)}
                fill="rgba(34,211,238,0.10)"
                stroke="rgba(34,211,238,0.18)"
                strokeWidth="1"
                rx="6"
              />
            ) : null}
            {Array.from({ length: 4 }).map((_, i) => {
              const v = Math.round(i * (topLeft / 3))
              const y = yLeft(v)
              return (
                <line
                  key={i}
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.03)"
                />
              )
            })}

            <path
              d={buildPath(regsPts)}
              fill="none"
              stroke={colors.regs}
              strokeWidth={2}
              opacity={0.22}
            />
            <path
              d={buildPath(ftdPts)}
              fill="none"
              stroke={colors.ftd}
              strokeWidth={3.5}
              opacity={0.95}
            />
            <path
              d={buildPath(qftdPts)}
              fill="none"
              stroke={colors.qftd}
              strokeWidth={2}
              opacity={0.18}
            />

            <line x1={padL} x2={padL} y1={padT} y2={H - padB} stroke="rgba(255,255,255,0.10)" />
            <line
              x1={W - padR}
              x2={W - padR}
              y1={padT}
              y2={H - padB}
              stroke="rgba(255,255,255,0.06)"
            />
            <line
              x1={padL}
              x2={W - padR}
              y1={H - padB}
              y2={H - padB}
              stroke="rgba(255,255,255,0.10)"
            />

            {Array.from({ length: 4 }).map((_, i) => {
              const v = Math.round(i * (topLeft / 3))
              const y = yLeft(v)
              return (
                <text
                  key={`yl-${i}`}
                  x={padL - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="rgba(255,255,255,0.55)"
                >
                  {formatNumberShort(v)}
                </text>
              )
            })}

            {Array.from({ length: 4 }).map((_, i) => {
              const v = Math.round(i * (topRight / 3))
              const y = yRight(v)
              return (
                <text
                  key={`yr-${i}`}
                  x={W - padR + 10}
                  y={y + 4}
                  textAnchor="start"
                  fontSize="12"
                  fill="rgba(255,255,255,0.40)"
                >
                  {formatNumberShort(v)}
                </text>
              )
            })}

            {series.map((s, i) => {
              if (i % step !== 0 && i !== series.length - 1) return null
              const d = s.date
              const localeTag = locale === 'it' ? 'it-IT' : 'en-US'
              const label = d
                ? d.toLocaleString(localeTag, { month: 'short', year: '2-digit' })
                : s.key
              return (
                <text
                  key={`x-${i}`}
                  x={xFor(i)}
                  y={H - padB + 22}
                  textAnchor="middle"
                  fontSize="12"
                  fill="rgba(255,255,255,0.45)"
                >
                  {label}
                </text>
              )
            })}

            {hoverIndex !== null && hover && (
              <line
                x1={hover.x}
                x2={hover.x}
                y1={padT}
                y2={H - padB}
                stroke="rgba(255,255,255,0.10)"
                strokeDasharray="4 4"
              />
            )}
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            marginTop: 8,
            color: 'rgba(255,255,255,0.45)',
            fontSize: 11,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.60)' }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                background: colors.ftd,
                marginRight: 6,
                borderRadius: 999,
              }}
            />
            {t('shareAffiliateReports.chart.legend.ftd') || 'FTD (cum.)'}
          </span>
          <span style={{ opacity: 0.55 }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                background: colors.regs,
                marginRight: 6,
                borderRadius: 999,
              }}
            />
            {t('shareAffiliateReports.chart.legend.regs') || 'Regs (cum.)'}
          </span>
          <span style={{ opacity: 0.5 }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                background: colors.qftd,
                marginRight: 6,
                borderRadius: 999,
              }}
            />
            {t('shareAffiliateReports.chart.legend.qftd') || 'QFTD (cum.)'}
          </span>
        </div>
      </div>

      {hover && (
        <div
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            background: 'rgba(15,23,42,0.92)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 10,
            padding: '8px 10px',
            color: '#e2e8f0',
            fontSize: 12,
            minWidth: 220,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>{hover.label}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ color: colors.regs }}>
              {t('shareAffiliateReports.chart.tooltip.regs') || 'Regs'}
            </span>
            <span>{formatNumberShort(hover.regsCum)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ color: colors.ftd }}>
              {t('shareAffiliateReports.chart.tooltip.ftd') || 'FTD'}
            </span>
            <span>{formatNumberShort(hover.ftdCum)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ color: colors.qftd }}>
              {t('shareAffiliateReports.chart.tooltip.qftd') || 'QFTD'}
            </span>
            <span>{formatNumberShort(hover.qftdCum)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function PublicAffiliateReportsEntryView({ t, locale, setLocale, affiliates, shareBase }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <div style={{ minWidth: 240 }}>
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted)',
                letterSpacing: 0.3,
                textTransform: 'uppercase',
              }}
            >
              {t('shareAffiliateReports.header.subtitle') || 'Read-only executive summary'}
            </div>
            <h1 style={{ color: 'var(--text)', fontSize: 28, margin: '6px 0 4px' }}>
              {t('shareAffiliateReports.header.title') || 'Affiliate Performance — Board View'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
              {t('shareAffiliateReports.header.note') ||
                'Top affiliates by commissions. Click an affiliate to open the full report.'}
            </p>
          </div>

          <LanguageToggle locale={locale} setLocale={setLocale} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {affiliates.map((a, idx) => {
            const status = statusFromProfit(t, a.profit || 0)
            const rank = typeof a.rank === 'number' ? a.rank : idx + 1
            const total = affiliates.length || 20
            const weightLabel = Number.isFinite(a.weightPct) ? formatPercent(a.weightPct, 1) : '—'

            const rightTag = (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}
              >
                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.03)',
                    color: status.tone,
                    fontWeight: 900,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {status.label}
                </span>
                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'var(--muted)',
                    fontWeight: 900,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  #{rank} / {total}
                </span>
              </div>
            )

            return (
              <Card
                key={a.affiliate}
                title={a.affiliate}
                subtitle={`${t('shareAffiliateReports.card.netDeposits') || 'Net Deposits'}: ${formatEuro(a.netDeposits || 0)} · ${t('shareAffiliateReports.card.pl') || 'P&L'}: ${formatEuro(a.pl || 0)} · ${t('shareAffiliateReports.card.weight') || 'Weight'}: ${weightLabel}`}
                rightTag={rightTag}
                onClick={() => {
                  const next = `${shareBase}/${encodeAffiliateId(a.affiliate)}`
                  window.location.href = next
                }}
              />
            )
          })}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted)' }}>
          {t('shareAffiliateReports.footer.note') ||
            'Board view is read-only. Data source: internal Affiliate → Analysis.'}
        </div>
      </div>
    </div>
  )
}

function PublicAffiliateReportsDetailView({
  t,
  locale,
  setLocale,
  shareBase,
  selectedAffiliateId,
  affiliates = [],
  selectedAffiliateName,
  periodType,
  setPeriodType,
  selectedPeriodLabel,
  highlightStartId,
  highlightEndId,
  companyRegistrations,
  report,
  kpiContext,
  cumulativeSeries,
}) {
  const current = report?.currentKpis || null
  const previous = report?.previousKpis || null

  const [affiliatePickerOpen, setAffiliatePickerOpen] = useState(false)
  const affiliatePickerWrapRef = React.useRef(null)

  const registrationsDepositsAgg = useRegistrationsDepositsAgg(Boolean(selectedAffiliateId))

  useEffect(() => {
    if (!affiliatePickerOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setAffiliatePickerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [affiliatePickerOpen])

  useEffect(() => {
    if (!affiliatePickerOpen) return
    const onPointerDown = (e) => {
      const wrap = affiliatePickerWrapRef.current
      if (!wrap) return
      if (wrap.contains(e.target)) return
      setAffiliatePickerOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => window.removeEventListener('pointerdown', onPointerDown, true)
  }, [affiliatePickerOpen])

  const openAffiliateHref = (name) => {
    const encoded = encodeAffiliateId(name)
    const p = String(periodType || '').trim()
    const next = p ? `${shareBase}/${encoded}/${p}` : `${shareBase}/${encoded}`
    if (typeof window !== 'undefined') window.location.href = next
  }

  const cohort = useCohortNetDepositsCalendar({ enabled: true })

  const profit = current ? current.totalProfit : null
  const roi = current ? current.roi : null
  const netDeposits = current ? current.totalNetDeposits : null
  const pl = current ? current.totalPL : null
  const paymentsTotal = current ? current.totalPayments : null
  const affiliateRegistrations = current ? current.registrations : null
  const ftd = current ? current.ftd : null
  const qftd = current ? current.qftd : null

  const depositsCountByMonth = useMemo(() => {
    if (!selectedAffiliateId) return null
    if (registrationsDepositsAgg.loading) return null
    const byAff = registrationsDepositsAgg.byAffiliateMonth
    if (!byAff) return null
    const map = byAff.get(String(selectedAffiliateId))
    return map || new Map()
  }, [
    registrationsDepositsAgg.loading,
    registrationsDepositsAgg.byAffiliateMonth,
    selectedAffiliateId,
  ])

  const depositsCount = useMemo(() => {
    if (!selectedAffiliateId) return null
    if (registrationsDepositsAgg.loading) return null
    if (!depositsCountByMonth) return null

    const entries = Array.from(depositsCountByMonth.entries())
    if (!entries.length) return 0

    if (
      periodType === 'since-ever' ||
      highlightStartId === null ||
      highlightStartId === undefined ||
      highlightEndId === null ||
      highlightEndId === undefined
    ) {
      return entries.reduce((acc, [, v]) => acc + (Number(v || 0) || 0), 0)
    }

    const start = Number(highlightStartId)
    const end = Number(highlightEndId)
    return entries.reduce((acc, [mId, v]) => {
      if (mId < start || mId > end) return acc
      return acc + (Number(v || 0) || 0)
    }, 0)
  }, [
    selectedAffiliateId,
    registrationsDepositsAgg.loading,
    depositsCountByMonth,
    periodType,
    highlightStartId,
    highlightEndId,
  ])

  const loginRatio = useMemo(() => {
    const regs = Number(current?.registrations || 0)
    const visitors = Number(current?.visitors || 0)
    if (!visitors) return null
    return (regs / Math.max(visitors, 1)) * 100
  }, [current])

  const avgDepositsCountPerFtdUser = useMemo(() => {
    const f = Number(ftd || 0)
    if (!f) return null
    if (depositsCount === null || depositsCount === undefined) return null
    const d = Number(depositsCount || 0)
    return d / Math.max(f, 1)
  }, [depositsCount, ftd])

  const status = statusFromProfit(t, Number(profit || 0))

  const affiliateOptions = useMemo(() => {
    const list = (affiliates || [])
      .map((a, idx) => {
        if (typeof a === 'string') return { affiliate: a, rank: idx + 1 }
        return {
          affiliate: a?.affiliate,
          rank: typeof a?.rank === 'number' ? a.rank : idx + 1,
          profit: a?.profit,
          netDeposits: a?.netDeposits,
          pl: a?.pl,
          roi: a?.roi,
        }
      })
      .filter((a) => a?.affiliate)
      .filter((a) => normalizeKey(a.affiliate) !== normalizeKey(selectedAffiliateName))
      .sort((a, b) => (a.rank || 999) - (b.rank || 999))

    return list
  }, [affiliates, selectedAffiliateName])
  const conversionRate = useMemo(() => {
    const regs = Number(current?.registrations || 0)
    const ftd = Number(current?.ftd || 0)
    if (!regs) return null
    return (ftd / Math.max(regs, 1)) * 100
  }, [current])

  const kpiFeedback = useMemo(() => {
    const hasPrev = Boolean(report?.hasPrevious && previous)
    const ndNow = Number(current?.totalNetDeposits || 0)
    const plNow = Number(current?.totalPL || 0)
    const roiNow = Number(current?.roi || 0)
    const ndPrev = Number(previous?.totalNetDeposits || 0)
    const plPrev = Number(previous?.totalPL || 0)
    const roiPrev = Number(previous?.roi || 0)

    const ndDir = hasPrev ? directionFromDelta(ndNow - ndPrev) : 'flat'
    const plDir = hasPrev ? directionFromDelta(plNow - plPrev) : 'flat'
    const roiDir = hasPrev ? directionFromDelta(roiNow - roiPrev, 0.0005) : 'flat'
    const softening = hasPrev && (ndDir === 'down' || plDir === 'down' || roiDir === 'down')

    let meaningKey = 'positiveStable'
    let nextKey = 'scaleCarefully'

    if (ndNow < 0 && plNow < 0) {
      meaningKey = 'negativeBoth'
      nextKey = 'stopScaling'
    } else if (ndNow >= 0 && plNow < 0) {
      meaningKey = 'positiveDepositsNegativePl'
      nextKey = 'holdCutCosts'
    } else if (ndNow < 0 && plNow >= 0) {
      meaningKey = 'positivePlNegativeDeposits'
      nextKey = 'checkQuality'
    } else if (roiNow < 0) {
      meaningKey = 'positiveButRoiNegative'
      nextKey = 'fixRoi'
    } else if (softening) {
      meaningKey = 'positiveSoftening'
      nextKey = 'monitorBeforeScale'
    }

    const meaning =
      t(`shareAffiliateReports.kpiFeedback.meaning.${meaningKey}`) ||
      (meaningKey === 'negativeBoth'
        ? 'Net deposits and P&L are negative.'
        : meaningKey === 'positiveDepositsNegativePl'
          ? 'Net deposits are positive but P&L is negative.'
          : meaningKey === 'positivePlNegativeDeposits'
            ? 'P&L is positive but net deposits are negative.'
            : meaningKey === 'positiveButRoiNegative'
              ? 'Net deposits and P&L are positive but ROI is negative.'
              : meaningKey === 'positiveSoftening'
                ? 'Results are positive but trends are weakening.'
                : 'Results are positive and stable.')

    const nextStep =
      t(`shareAffiliateReports.kpiFeedback.next.${nextKey}`) ||
      (nextKey === 'stopScaling'
        ? 'Stop scaling and review sources and costs.'
        : nextKey === 'holdCutCosts'
          ? 'Hold spend and reduce costs.'
          : nextKey === 'checkQuality'
            ? 'Check deposit quality and monitor withdrawals.'
            : nextKey === 'fixRoi'
              ? 'Keep spend flat and fix ROI before scaling.'
              : nextKey === 'monitorBeforeScale'
                ? 'Maintain exposure and monitor the next period.'
                : 'Maintain exposure and scale carefully.')

    return { meaning, nextStep }
  }, [current, previous, report?.hasPrevious, t])

  const weightFeedback = useMemo(() => {
    const w = Number(kpiContext?.weights?.netDepositsPct)
    if (!Number.isFinite(w)) return null
    if (w >= 20) {
      return {
        impact:
          t('shareAffiliateReports.weightFeedback.impact.high') ||
          'This affiliate drives a large share of total net deposits.',
        nextStep:
          t('shareAffiliateReports.weightFeedback.next.protectChannel') ||
          'Protect this channel and review quality regularly.',
      }
    }
    if (w <= 3) {
      return {
        impact:
          t('shareAffiliateReports.weightFeedback.impact.low') ||
          'This affiliate has a small share of total net deposits.',
        nextStep:
          t('shareAffiliateReports.weightFeedback.next.keepLean') ||
          'Keep spend lean and scale only after results improve.',
      }
    }
    return null
  }, [kpiContext, t])

  const finalDecisionSummary = useMemo(() => {
    const hasPrev = Boolean(report?.hasPrevious && previous)
    const ndNow = Number(current?.totalNetDeposits || 0)
    const plNow = Number(current?.totalPL || 0)
    const roiNow = Number(current?.roi || 0)
    const ndPrev = Number(previous?.totalNetDeposits || 0)
    const plPrev = Number(previous?.totalPL || 0)
    const roiPrev = Number(previous?.roi || 0)

    const ndDir = hasPrev ? directionFromDelta(ndNow - ndPrev) : 'flat'
    const plDir = hasPrev ? directionFromDelta(plNow - plPrev) : 'flat'
    const roiDir = hasPrev ? directionFromDelta(roiNow - roiPrev, 0.0005) : 'flat'

    const depositsNow = Number(kpiContext?.values?.deposits || 0)
    const withdrawalsNow = Number(kpiContext?.values?.withdrawals || 0)
    const withdrawalPressureDetected = depositsNow > 0 ? withdrawalsNow / depositsNow >= 0.7 : false

    const softening = hasPrev && (ndDir === 'down' || plDir === 'down' || roiDir === 'down')
    const negative = ndNow < 0 || plNow < 0 || roiNow < 0

    let overallKey = 'healthy'
    if (ndNow < 0 || plNow < 0) overallKey = 'needsAction'
    else if (roiNow < 0) overallKey = 'mixed'
    else if (softening) overallKey = 'softening'

    let strengthKey = 'stableProfit'
    if (ndNow > 0 && ndDir === 'up') strengthKey = 'scaleGrowing'
    else if (roiNow >= 0 && roiDir === 'up') strengthKey = 'efficiencyImproving'

    let riskKey = 'none'
    if (plNow < 0) riskKey = 'plNegative'
    else if (roiNow < 0) riskKey = 'roiNegative'
    else if (withdrawalPressureDetected) riskKey = 'withdrawalPressure'

    let actionKey = 'maintainScale'
    if (overallKey === 'needsAction') actionKey = 'pauseFix'
    else if (overallKey === 'mixed') actionKey = 'holdImprove'
    else if (overallKey === 'softening') actionKey = 'monitor'
    else if (negative) actionKey = 'holdImprove'

    return {
      overall:
        t(`shareAffiliateReports.finalSummary.value.${overallKey}`) ||
        (overallKey === 'needsAction'
          ? 'Performance needs action.'
          : overallKey === 'mixed'
            ? 'Performance is mixed.'
            : overallKey === 'softening'
              ? 'Performance is stable but softening.'
              : 'Performance is healthy.'),
      strength:
        t(`shareAffiliateReports.finalSummary.strength.${strengthKey}`) ||
        (strengthKey === 'scaleGrowing'
          ? 'Net deposits are growing.'
          : strengthKey === 'efficiencyImproving'
            ? 'ROI is improving.'
            : 'P&L is stable.'),
      risk:
        t(`shareAffiliateReports.finalSummary.risk.${riskKey}`) ||
        (riskKey === 'plNegative'
          ? 'P&L is negative.'
          : riskKey === 'roiNegative'
            ? 'ROI is negative.'
            : riskKey === 'withdrawalPressure'
              ? 'Withdrawals are high versus deposits.'
              : 'No material risk detected.'),
      action:
        t(`shareAffiliateReports.finalSummary.action.${actionKey}`) ||
        (actionKey === 'pauseFix'
          ? 'Pause scaling and fix efficiency.'
          : actionKey === 'holdImprove'
            ? 'Keep spend flat and improve conversion.'
            : actionKey === 'monitor'
              ? 'Maintain exposure and monitor closely.'
              : 'Maintain exposure and scale carefully.'),
    }
  }, [current, previous, report?.hasPrevious, kpiContext, t])

  const RankBadge = ({ item }) => {
    if (!item?.showRank || !item?.rank) return null
    return (
      <span
        title={`#${item.rank}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 950,
          color: item.rankTone.fg,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: item.rankTone.fg,
            boxShadow: `0 0 0 4px ${item.rankTone.bg}`,
          }}
        />
        <span style={{ color: 'rgba(255,255,255,0.65)' }}>#{item.rank}</span>
      </span>
    )
  }

  const KpiCell = ({ item }) => (
    <div style={{ padding: '10px 10px', minWidth: 0 }}>
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
            fontSize: 10,
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            letterSpacing: 0.35,
            fontWeight: 900,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.label}
        </div>
        <RankBadge item={item} />
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 950,
          color: item.valueTone || 'var(--text)',
          whiteSpace: 'nowrap',
          marginTop: 6,
        }}
      >
        {item.value}
      </div>
    </div>
  )

  const periodOptions = useMemo(
    () => [
      { id: 'since-ever', label: t('shareAffiliateReports.period.sinceEver') || 'Since Ever' },
      { id: 'ytd', label: t('shareAffiliateReports.period.ytd') || 'Year to date' },
      { id: 'monthly', label: t('shareAffiliateAnalysis.period.monthly') || 'Monthly' },
      { id: 'quarterly', label: t('shareAffiliateAnalysis.period.quarterly') || 'Quarterly' },
      { id: 'semi-annual', label: t('shareAffiliateAnalysis.period.semiAnnual') || 'Semi-Annual' },
      { id: 'annual', label: t('shareAffiliateAnalysis.period.annual') || 'Annual' },
    ],
    [t]
  )

  const toneForSigned = (v) => {
    const n = Number(v || 0)
    if (n > 0) return '#22c55e'
    if (n < 0) return n > -1000 ? '#f59e0b' : '#ef4444'
    return '#94a3b8'
  }

  const periodTrends = useMemo(() => {
    if (!current || !previous || !report?.hasPrevious || periodType === 'since-ever') return null
    const ndDelta = (current.totalNetDeposits || 0) - (previous.totalNetDeposits || 0)
    const plDelta = (current.totalPL || 0) - (previous.totalPL || 0)
    const roiDelta = (current.roi || 0) - (previous.roi || 0)
    return {
      nd: directionFromDelta(ndDelta),
      pl: directionFromDelta(plDelta),
      roi: directionFromDelta(roiDelta, 0.0005),
    }
  }, [current, previous, report?.hasPrevious, periodType])

  const narrative = useMemo(() => {
    const pieces = []
    const hasRegs = affiliateRegistrations !== null && affiliateRegistrations !== undefined
    const hasFtd = ftd !== null && ftd !== undefined
    const hasND = netDeposits !== null && netDeposits !== undefined
    const hasPL = pl !== null && pl !== undefined
    const hasROI = roi !== null && roi !== undefined

    const head = `${selectedAffiliateName}`
    const periodLabel = selectedPeriodLabel ? ` (${selectedPeriodLabel})` : ''

    const p1Parts = []
    if (hasRegs)
      p1Parts.push(
        `${formatNumberShort(affiliateRegistrations)} ${t('shareAffiliateAnalysis.metric.registrations') || 'Registrations'}`
      )
    if (hasFtd)
      p1Parts.push(`${formatNumberShort(ftd)} ${t('shareAffiliateAnalysis.metric.ftd') || 'FTD'}`)
    if (hasND)
      p1Parts.push(
        `${t('shareAffiliateAnalysis.metric.netDeposits') || 'Net Deposits'} ${formatEuro(netDeposits)}`
      )
    if (hasPL) p1Parts.push(`${t('shareAffiliateAnalysis.metric.pl') || 'P&L'} ${formatEuro(pl)}`)
    if (hasROI)
      p1Parts.push(`${t('shareAffiliateAnalysis.metric.roi') || 'ROI'} ${formatPercent(roi, 1)}`)
    const p1 = p1Parts.length
      ? `${head}${periodLabel}: ${p1Parts.join(' · ')}.`
      : `${head}${periodLabel}.`

    let p2 = kpiFeedback?.meaning || ''

    if (periodTrends) {
      const ndWord = trendWord(t, periodTrends.nd).toLowerCase()
      const plWord = trendWord(t, periodTrends.pl).toLowerCase()
      const roiWord = trendWord(t, periodTrends.roi).toLowerCase()
      p2 =
        `${p2} ${t('shareAffiliateReports.rank.vsPrevious') || 'Vs previous period'}: ${t('shareAffiliateAnalysis.metric.netDeposits') || 'Net Deposits'} ${ndWord}, ${t('shareAffiliateAnalysis.metric.pl') || 'P&L'} ${plWord}, ${t('shareAffiliateAnalysis.metric.roi') || 'ROI'} ${roiWord}.`.trim()
    }

    if (weightFeedback?.impact) {
      p2 = `${p2} ${weightFeedback.impact}`.trim()
    } else {
      const w = Number(kpiContext?.weights?.netDepositsPct)
      if (Number.isFinite(w)) {
        p2 =
          `${p2} ${t('shareAffiliateReports.section.weightOnTotal') || 'Weight on total'}: ${formatPercent(w, 1)} ${t('shareAffiliateReports.rank.ofTop20') || 'of Top 20 net deposits'}.`.trim()
      }
    }

    return { p1, p2 }
  }, [
    affiliateRegistrations,
    ftd,
    netDeposits,
    pl,
    roi,
    selectedAffiliateName,
    selectedPeriodLabel,
    kpiFeedback,
    periodTrends,
    weightFeedback,
    kpiContext,
    t,
  ])

  const [showCohortDetails, setShowCohortDetails] = useState(false)

  const headerRef = React.useRef(null)
  const initialHeaderLayout = (() => {
    if (typeof window === 'undefined') return 'wide'
    const w = Number(window.innerWidth || 0)
    if (w >= 1280) return 'wide'
    if (w >= 1100) return 'compact'
    if (w >= 560) return 'stack'
    return 'stack-narrow'
  })()

  const [headerLayout, setHeaderLayout] = useState(initialHeaderLayout)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = headerRef.current
    const ResizeObs = window.ResizeObserver
    if (!el || !ResizeObs) return

    const pickLayout = (widthPx) => {
      const w = Number(widthPx || 0)
      if (w >= 1280) return 'wide'
      if (w >= 1100) return 'compact'
      if (w >= 560) return 'stack'
      return 'stack-narrow'
    }

    let raf = 0
    const ro = new ResizeObs((entries) => {
      const width = entries?.[0]?.contentRect?.width
      if (!width) return
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const next = pickLayout(width)
        setHeaderLayout((prev) => (prev === next ? prev : next))
      })
    })

    ro.observe(el)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  const headerUi = useMemo(() => {
    // Goal: keep the whole header visually on one line when possible.
    // Metrics should be readable but not dominate the header.
    if (headerLayout === 'wide') {
      return {
        wrap: 'nowrap',
        gap: 18,
        titleSize: 26,
        metricValueSize: 30,
        metricHintSize: 10.5,
        metricMin: 160,
        metricMax: 720,
        metricGap: 14,
      }
    }
    if (headerLayout === 'compact') {
      return {
        wrap: 'nowrap',
        gap: 14,
        titleSize: 24,
        metricValueSize: 28,
        metricHintSize: 10,
        metricMin: 150,
        metricMax: 660,
        metricGap: 12,
      }
    }
    if (headerLayout === 'stack') {
      return {
        wrap: 'wrap',
        gap: 14,
        titleSize: 26,
        metricValueSize: 28,
        metricHintSize: 10,
        metricMin: 160,
        metricMax: 820,
        metricGap: 12,
      }
    }
    return {
      wrap: 'wrap',
      gap: 12,
      titleSize: 24,
      metricValueSize: 26,
      metricHintSize: 9.5,
      metricMin: 140,
      metricMax: 820,
      metricGap: 10,
    }
  }, [headerLayout])

  const CompactMetric = ({ label, value, tone, meta }) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            letterSpacing: 0.35,
            fontWeight: 900,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {label}
        </div>
        {meta ? (
          <span
            title={meta}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 18,
              height: 18,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.02)',
              color: 'rgba(255,255,255,0.65)',
              fontSize: 11,
              fontWeight: 950,
              flex: '0 0 auto',
            }}
            aria-label="info"
          >
            i
          </span>
        ) : null}
      </div>
      <div
        style={{
          fontSize: headerUi.metricValueSize,
          fontWeight: 1000,
          marginTop: 3,
          color: tone || 'var(--text)',
          lineHeight: 1.02,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
    </div>
  )

  const StripItem = ({ label, value, tone }) => (
    <div style={{ padding: '10px 0', minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.55)',
          textTransform: 'uppercase',
          letterSpacing: 0.35,
          fontWeight: 900,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 22,
          fontWeight: 950,
          color: tone || 'var(--text)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
    </div>
  )

  const Badge = ({ label, value }) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.02)',
        color: 'rgba(255,255,255,0.85)',
        fontWeight: 950,
        fontSize: 12,
      }}
    >
      <span
        style={{
          color: 'rgba(255,255,255,0.55)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 0.35,
          fontSize: 10,
        }}
      >
        {label}
      </span>
      <span style={{ color: 'var(--text)' }}>{value}</span>
    </span>
  )

  const cohortBlock = useMemo(() => {
    const cohortHealthLabel = (() => {
      const label = String(cohort?.overview?.flag?.flag || '').toUpperCase()
      if (label === 'GREEN') return t('dashboard.health.green')
      if (label === 'ORANGE') return t('dashboard.health.orange')
      if (label === 'RED') return t('dashboard.health.red')
      return t('dashboard.health.noData')
    })()

    return (
      <div style={{ marginTop: 26 }}>
        <div
          style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 4,
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 950,
              color: 'var(--text)',
              textTransform: 'uppercase',
              letterSpacing: 0.35,
            }}
          >
            {t('shareAffiliateReports.section.cohortPulse')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {t('shareAffiliateReports.section.cohortPulse.note')}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)' }}>
            {t('shareAffiliateReports.section.cohortPulse.scope') ||
              'This cohort view is global (all users), not specific to this affiliate.'}
          </div>
        </div>

        {cohort?.loading ? (
          <div
            style={{
              height: 120,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.010)',
              border: '1px solid rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
            }}
          >
            {t('common.loading')}
          </div>
        ) : cohort?.error ? (
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.22)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 12,
            }}
          >
            {t('shareAffiliateReports.section.cohortPulse.error')}:{' '}
            {String(cohort.error?.message || cohort.error)}
          </div>
        ) : (
          <>
            <div
              style={{
                padding: 14,
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: cohort?.overview?.flag?.tone || 'var(--text)',
                      fontWeight: 950,
                      fontSize: 12,
                    }}
                  >
                    {t('dashboard.cohortHealth.title')}: {cohortHealthLabel}
                  </span>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: 900 }}>
                    {cohort?.overview?.econ?.whyKey
                      ? t(cohort.overview.econ.whyKey)
                      : t('dashboard.cohortHealth.noData')}
                  </div>
                </div>

                <button
                  onClick={() => setShowCohortDetails((s) => !s)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: 950,
                    cursor: 'pointer',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showCohortDetails
                    ? t('common.hide') || 'Hide details'
                    : t('common.viewDetails') || 'View details'}
                </button>
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: 'grid',
                  rowGap: 6,
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 900 }}>
                    {t('dashboard.cohortHealth.meaningLabel')}:
                  </span>{' '}
                  <span style={{ color: 'var(--text)', fontWeight: 900 }}>
                    {cohort?.overview?.econ?.meaningKey
                      ? t(cohort.overview.econ.meaningKey)
                      : t('dashboard.cohortHealth.interpretationUnavailable')}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 900 }}>
                    {t('dashboard.cohortHealth.nextCheckLabel')}:
                  </span>{' '}
                  <span style={{ color: 'var(--text)', fontWeight: 900 }}>
                    {cohort?.overview?.econ?.nextCheckKey
                      ? t(cohort.overview.econ.nextCheckKey)
                      : t('dashboard.cohortHealth.recheckFallback')}
                  </span>
                </div>
              </div>
            </div>

            {showCohortDetails ? (
              <div
                style={{
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(2,6,23,0.55)',
                  padding: 10,
                }}
              >
                <style>{`@keyframes bwFadeUp { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                <div style={{ animation: 'bwFadeUp 180ms ease-out' }}>
                  <CohortDecayView
                    rows={cohort?.calendarView?.rows || []}
                    calendarEntries={cohort?.calendarView?.entries || []}
                    startAbs={cohort?.calendarView?.startAbs || 0}
                    selectedAffiliate="all"
                    selectedYear={2025}
                    onYearChange={() => {}}
                    metricLabel={t('shareAffiliateAnalysis.metric.netDeposits')}
                    layout="split"
                    showAverageLine
                    hideControls
                    defaultValueMode="absolute"
                  />
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    )
  }, [
    cohort?.loading,
    cohort?.error,
    cohort?.calendarView,
    cohort?.overview,
    t,
    locale,
    showCohortDetails,
  ])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: 18 }}>
      <div
        style={{
          width: '100%',
          maxWidth: 1480,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          ref={headerRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: headerUi.gap,
            paddingBottom: 10,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <img
            src="/Logo.png"
            alt="Bullwaves"
            style={{ height: 38, width: 'auto', display: 'block' }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                headerLayout === 'stack-narrow'
                  ? '1fr'
                  : `minmax(260px, 1.25fr) minmax(${headerUi.metricMin}px, 0.75fr) minmax(${headerUi.metricMin}px, 0.75fr)`,
              gap: headerUi.metricGap,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: headerLayout === 'stack-narrow' ? 640 : 980,
              margin: '0 auto',
            }}
          >
            <div
              ref={affiliatePickerWrapRef}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                alignItems: headerLayout === 'stack-narrow' ? 'center' : 'flex-start',
                minWidth: 0,
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: 0.35,
                  textTransform: 'uppercase',
                  fontWeight: 900,
                  textAlign: headerLayout === 'stack-narrow' ? 'center' : 'left',
                }}
              >
                {t('shareAffiliateReports.report.eyebrow') || 'Affiliate report'}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  justifyContent: headerLayout === 'stack-narrow' ? 'center' : 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setAffiliatePickerOpen((v) => !v)}
                  style={{
                    fontSize: headerUi.titleSize,
                    fontWeight: 1000,
                    lineHeight: 1.08,
                    minWidth: 0,
                    maxWidth: 540,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: headerLayout === 'stack-narrow' ? 'center' : 'left',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: 'var(--text)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    gap: 8,
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={affiliatePickerOpen}
                  title={t('shareAffiliateReports.header.changeAffiliate') || 'Change affiliate'}
                >
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedAffiliateName}
                  </span>
                  <span aria-hidden="true" style={{ fontSize: 14, opacity: 0.75 }}>
                    ▾
                  </span>
                </button>
                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.02)',
                    color: status.tone,
                    fontWeight: 950,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {status.label}
                </span>
              </div>

              {affiliatePickerOpen ? (
                <div
                  role="listbox"
                  aria-label={
                    t('shareAffiliateReports.header.changeAffiliate') || 'Change affiliate'
                  }
                  style={{
                    position: 'absolute',
                    top: headerLayout === 'stack-narrow' ? 72 : 58,
                    left: headerLayout === 'stack-narrow' ? '50%' : 0,
                    transform: headerLayout === 'stack-narrow' ? 'translateX(-50%)' : 'none',
                    width: headerLayout === 'stack-narrow' ? 'min(520px, 92vw)' : 520,
                    maxHeight: 360,
                    overflow: 'auto',
                    zIndex: 50,
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(2,6,23,0.92)',
                    backdropFilter: 'blur(10px)',
                    padding: 8,
                    boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.55)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.35,
                        fontWeight: 900,
                      }}
                    >
                      {t('shareAffiliateReports.header.selectAffiliate') || 'Select affiliate'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAffiliatePickerOpen(false)}
                      style={{
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.02)',
                        color: 'rgba(255,255,255,0.75)',
                        borderRadius: 999,
                        padding: '4px 8px',
                        fontSize: 12,
                        fontWeight: 950,
                        cursor: 'pointer',
                      }}
                      aria-label={t('common.close') || 'Close'}
                    >
                      ×
                    </button>
                  </div>

                  <div
                    style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0 8px' }}
                  />

                  {affiliateOptions.slice(0, 30).map((a) => {
                    const name = String(a.affiliate)
                    const rank = Number(a.rank || 0)
                    const s = statusFromProfit(t, Number(a.profit || 0))
                    const nd =
                      a.netDeposits === null || a.netDeposits === undefined
                        ? null
                        : Number(a.netDeposits)
                    const pl = a.pl === null || a.pl === undefined ? null : Number(a.pl)
                    const roi = a.roi === null || a.roi === undefined ? null : Number(a.roi)

                    return (
                      <button
                        key={name}
                        type="button"
                        role="option"
                        onClick={() => {
                          setAffiliatePickerOpen(false)
                          openAffiliateHref(name)
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 10px',
                          borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.06)',
                          background: 'rgba(255,255,255,0.02)',
                          color: 'rgba(255,255,255,0.88)',
                          cursor: 'pointer',
                          marginBottom: 8,
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
                            style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}
                          >
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 40,
                                height: 22,
                                padding: '0 8px',
                                borderRadius: 999,
                                border: '1px solid rgba(255,255,255,0.10)',
                                background: 'rgba(255,255,255,0.02)',
                                color: 'rgba(255,255,255,0.70)',
                                fontWeight: 950,
                                fontSize: 12,
                              }}
                              title={t('shareAffiliateReports.kpi.rank') || 'Rank'}
                            >
                              #{rank || '—'}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 1000,
                                  fontSize: 14,
                                  color: 'rgba(255,255,255,0.92)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: 'rgba(255,255,255,0.55)',
                                  fontWeight: 850,
                                  marginTop: 2,
                                  display: 'flex',
                                  gap: 10,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span>
                                  {t('shareAffiliateAnalysis.metric.netDeposits') || 'Net Deposits'}
                                  : {nd === null ? '—' : formatEuro(nd)}
                                </span>
                                <span>
                                  {t('shareAffiliateAnalysis.metric.pl') || 'P&L'}:{' '}
                                  {pl === null ? '—' : formatEuro(pl)}
                                </span>
                                <span>
                                  {t('shareAffiliateAnalysis.metric.roi') || 'ROI'}:{' '}
                                  {roi === null ? '—' : formatPercent(roi, 1)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              padding: '6px 10px',
                              borderRadius: 999,
                              border: '1px solid rgba(255,255,255,0.10)',
                              background: 'rgba(255,255,255,0.02)',
                              color: s.tone,
                              fontWeight: 950,
                              fontSize: 12,
                              whiteSpace: 'nowrap',
                              flex: '0 0 auto',
                            }}
                          >
                            {s.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <CompactMetric
              label={
                t('shareAffiliateReports.metric.affiliateRegistrations') ||
                'Affiliate registrations'
              }
              value={
                affiliateRegistrations === null ? '—' : formatNumberShort(affiliateRegistrations)
              }
              tone={'rgba(34,211,238,0.95)'}
              meta={selectedPeriodLabel || '—'}
            />
            <CompactMetric
              label={
                t('shareAffiliateReports.metric.companyRegistrations') || 'Company registrations'
              }
              value={
                companyRegistrations === null || companyRegistrations === undefined
                  ? '—'
                  : formatNumberShort(companyRegistrations)
              }
              tone={'var(--text)'}
              meta={(() => {
                const v = t('shareAffiliateReports.metric.companyRegistrations.hint')
                return v && v !== 'shareAffiliateReports.metric.companyRegistrations.hint'
                  ? v
                  : 'Comparable scale indicator'
              })()}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LanguageToggle locale={locale} setLocale={setLocale} />
          </div>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <a
              href={shareBase}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: 'rgba(255,255,255,0.72)',
                textDecoration: 'none',
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: 0.25,
                padding: '6px 0',
              }}
            >
              <span aria-hidden="true">←</span>
              <span>{t('shareAffiliateAnalysis.back')}</span>
            </a>

            <span
              style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }}
              aria-hidden="true"
            />

            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.55)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 0.35,
              }}
            >
              {t('shareAffiliateReports.period.label') || 'Period'}
            </div>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.02)',
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 950,
                fontSize: 12,
                outline: 'none',
              }}
              aria-label={t('shareAffiliateReports.period.label') || 'Period'}
            >
              {periodOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)', fontWeight: 850 }}>
              {selectedPeriodLabel || '—'}
            </div>
          </div>

          <div style={{ paddingTop: 2, width: '100%' }}>
            {cumulativeSeries && cumulativeSeries.length ? (
              <AffiliateExecutiveCumulativeChart
                t={t}
                locale={locale}
                data={cumulativeSeries}
                height={310}
                highlightStartId={highlightStartId}
                highlightEndId={highlightEndId}
              />
            ) : (
              <div
                style={{
                  height: 260,
                  width: '100%',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.010)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                {t('shareAffiliateReports.chart.noData') || 'No data for chart'}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 14,
              paddingTop: 6,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              width: '100%',
            }}
          >
            <StripItem
              label={t('shareAffiliateReports.metric.ftdClients') || 'FTD clients'}
              value={ftd === null ? '—' : formatNumberShort(ftd)}
              tone={'#10b981'}
            />
            <StripItem
              label={t('shareAffiliateReports.metric.qftdClients') || 'QFTD clients'}
              value={qftd === null ? '—' : formatNumberShort(qftd)}
              tone={'#f59e0b'}
            />
            <StripItem
              label={t('shareAffiliateReports.metric.depositsCount') || 'Deposits count'}
              value={
                depositsCount === null || depositsCount === undefined
                  ? '—'
                  : formatNumberShort(depositsCount)
              }
              tone={'rgba(148,163,184,0.95)'}
            />
            <StripItem
              label={t('shareAffiliateAnalysis.metric.netDeposits') || 'Net Deposits'}
              value={netDeposits === null ? '—' : formatEuro(netDeposits)}
              tone={toneForSigned(netDeposits)}
            />
            <StripItem
              label={t('shareAffiliateAnalysis.metric.pl') || 'P&L'}
              value={pl === null ? '—' : formatEuro(pl)}
              tone={toneForSigned(pl)}
            />
            <StripItem
              label={t('shareAffiliateAnalysis.metric.payments') || 'Payments'}
              value={paymentsTotal === null ? '—' : formatEuro(paymentsTotal)}
              tone={
                paymentsTotal !== null && Number(paymentsTotal) < 0
                  ? toneForSigned(paymentsTotal)
                  : 'var(--text)'
              }
            />
            <StripItem
              label={t('shareAffiliateAnalysis.metric.roi') || 'ROI'}
              value={roi === null ? '—' : formatPercent(roi, 1)}
              tone={roi !== null && roi < 0 ? '#ef4444' : '#22c55e'}
            />
          </div>

          <div style={{ display: 'grid', gap: 10, textAlign: 'center', maxWidth: 980 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'rgba(255,255,255,0.82)',
                fontWeight: 850,
                lineHeight: 1.55,
              }}
            >
              {narrative.p1}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'rgba(255,255,255,0.70)',
                fontWeight: 850,
                lineHeight: 1.55,
              }}
            >
              {narrative.p2}
            </p>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(34,211,238,0.22)',
              background: 'rgba(34,211,238,0.06)',
              borderLeft: '4px solid rgba(34,211,238,0.75)',
              width: '100%',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.55)',
                textTransform: 'uppercase',
                letterSpacing: 0.35,
                fontWeight: 950,
              }}
            >
              {t('shareAffiliateReports.feedback.nextStep') || 'Next step'}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                color: 'rgba(255,255,255,0.92)',
                fontWeight: 1000,
                lineHeight: 1.35,
              }}
            >
              {kpiFeedback.nextStep}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.55)',
                textTransform: 'uppercase',
                letterSpacing: 0.35,
                fontWeight: 950,
                marginBottom: 10,
              }}
            >
              {t('shareAffiliateReports.section.kpis') || 'KPIs'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <Badge
                label={t('shareAffiliateReports.metric.cr') || 'CR%'}
                value={conversionRate === null ? '—' : formatPercent(conversionRate, 1)}
              />
              <Badge
                label={t('shareAffiliateReports.metric.loginRatio') || 'Login ratio%'}
                value={loginRatio === null ? '—' : formatPercent(loginRatio, 1)}
              />
              <Badge
                label={t('shareAffiliateReports.metric.arpu') || 'ARPU'}
                value={formatEuro(kpiContext?.values?.arpu || 0)}
              />
              <Badge
                label={t('shareAffiliateReports.metric.cpa') || 'CPA'}
                value={formatEuro(kpiContext?.values?.cpa || 0)}
              />
              <Badge
                label={
                  t('shareAffiliateReports.metric.avgDepositsPerUser') || 'Avg deposits / FTD user'
                }
                value={formatEuro(kpiContext?.values?.avgDepositsPerUser || 0)}
              />
              <Badge
                label={
                  t('shareAffiliateReports.metric.avgDepositsCountPerFtdUser') ||
                  'Avg deposits count / FTD user'
                }
                value={
                  avgDepositsCountPerFtdUser === null
                    ? '—'
                    : Number(avgDepositsCountPerFtdUser || 0).toFixed(1)
                }
              />
            </div>
          </div>

          {cohortBlock}

          <div
            style={{
              borderRadius: 18,
              padding: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              marginTop: 18,
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.55)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.35,
                  fontWeight: 950,
                }}
              >
                {t('shareAffiliateReports.finalSummary.overallAssessment') || 'Overall assessment'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {cohort?.overview?.flag ? (
                  <span
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.10)',
                      background: 'rgba(255,255,255,0.02)',
                      color: cohort.overview.flag.tone || 'var(--text)',
                      fontWeight: 950,
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('dashboard.cohortHealth.title')}:{' '}
                    {(() => {
                      const label = String(cohort?.overview?.flag?.flag || '').toUpperCase()
                      if (label === 'GREEN') return t('dashboard.health.green')
                      if (label === 'ORANGE') return t('dashboard.health.orange')
                      if (label === 'RED') return t('dashboard.health.red')
                      return t('dashboard.health.noData')
                    })()}
                  </span>
                ) : null}
                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.02)',
                    color: status.tone,
                    fontWeight: 950,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {status.label}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 10, display: 'grid', rowGap: 8, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.88)',
                  fontWeight: 950,
                  lineHeight: 1.45,
                }}
              >
                {finalDecisionSummary.overall}
              </div>
              {cohort?.overview?.econ ? (
                <div
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.74)',
                    fontWeight: 850,
                    lineHeight: 1.45,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 950 }}>
                    {t('dashboard.cohortHealth.title')} (
                    {t('shareAffiliateAnalysis.metric.netDeposits')}):
                  </span>{' '}
                  M3{' '}
                  {cohort.overview.econ.retainedM3 === null ||
                  cohort.overview.econ.retainedM3 === undefined
                    ? '—'
                    : `${cohort.overview.econ.retainedM3.toFixed(1)}%`}
                  {', '}M6{' '}
                  {cohort.overview.econ.retainedM6 === null ||
                  cohort.overview.econ.retainedM6 === undefined
                    ? '—'
                    : `${cohort.overview.econ.retainedM6.toFixed(1)}%`}
                  {', '}half-life{' '}
                  {(() => {
                    const v = cohort.overview.econ.halfLife
                    if (v === null || v === undefined)
                      return t('dashboard.cohortHealth.halfLife.notReached')
                    const m = Math.max(1, Math.round(v))
                    return t('dashboard.cohortHealth.halfLife.reached', {
                      months: m,
                      unit: m === 1 ? t('common.month') : t('common.months'),
                    })
                  })()}
                </div>
              ) : null}
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.74)',
                  fontWeight: 850,
                  lineHeight: 1.45,
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 950 }}>
                  {t('shareAffiliateReports.finalSummary.keyStrength') || 'Key strength'}:
                </span>{' '}
                {finalDecisionSummary.strength}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.74)',
                  fontWeight: 850,
                  lineHeight: 1.45,
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 950 }}>
                  {t('shareAffiliateReports.finalSummary.keyRisk') || 'Key risk'}:
                </span>{' '}
                {finalDecisionSummary.risk}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.80)',
                  fontWeight: 950,
                  lineHeight: 1.45,
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 950 }}>
                  {t('shareAffiliateReports.finalSummary.recommendedAction') ||
                    'Recommended action'}
                  :
                </span>{' '}
                {finalDecisionSummary.action}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.45)',
              paddingTop: 6,
              textAlign: 'center',
            }}
          >
            {t('shareAffiliateReports.footer.note') ||
              'Board view is read-only. Data source: internal Affiliate → Analysis.'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PublicAffiliateAnalysisSharePage({
  token,
  affiliateId,
  period,
  boardMode = false,
}) {
  const { t, locale, setLocale } = useI18n()
  const [validating, setValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [periodType, setPeriodType] = useState('since-ever')

  const { mediaRows, payments, loading, error } = useMediaPaymentsData()

  const mediaByAffiliateKey = useMemo(() => {
    const map = new Map()
    ;(mediaRows || []).forEach((r) => {
      const k = normalizeKey(r?.affiliate || '')
      if (!k) return
      const arr = map.get(k) || []
      arr.push(r)
      map.set(k, arr)
    })
    return map
  }, [mediaRows])

  const paymentsByAffiliateKey = useMemo(() => {
    const map = new Map()
    ;(payments || []).forEach((p) => {
      const k = normalizeKey(p?.affiliate || '')
      if (!k) return
      const arr = map.get(k) || []
      arr.push(p)
      map.set(k, arr)
    })
    return map
  }, [payments])

  const authToken = useMemo(() => {
    const tkn = String(token || '').trim()
    if (isShareToken(tkn)) return tkn
    if (boardMode) return getBoardSessionToken()
    return tkn
  }, [token, boardMode])

  useEffect(() => {
    let alive = true
    setValidating(true)

    if (!authToken) {
      setIsValidToken(false)
      setValidating(false)
      return () => {
        alive = false
      }
    }

    validateAffiliateReportsToken(authToken).then((r) => {
      if (!alive) return
      setIsValidToken(Boolean(r.ok))
      setValidating(false)
    })

    return () => {
      alive = false
    }
  }, [authToken])

  const routePeriodType = useMemo(() => normalizePeriodType(period), [period])
  useEffect(() => {
    if (routePeriodType) setPeriodType(routePeriodType)
  }, [routePeriodType])

  const effectivePeriodType = periodType

  const affiliateNameIndex = useMemo(() => {
    const map = new Map()
    ;(mediaRows || []).forEach((r) => {
      const name = String(r?.affiliate || '').trim()
      if (!name) return
      const k = normalizeKey(name)
      if (!map.has(k)) map.set(k, name)
    })
    ;(payments || []).forEach((p) => {
      const name = String(p?.affiliate || '').trim()
      if (!name) return
      const k = normalizeKey(name)
      if (!map.has(k)) map.set(k, name)
    })
    return map
  }, [mediaRows, payments])

  const selectedAffiliateName = useMemo(() => {
    if (!affiliateId) return ''
    const decoded = decodeAffiliateId(affiliateId)
    const sel = normalizeKey(decoded)
    return affiliateNameIndex.get(sel) || decoded
  }, [affiliateId, affiliateNameIndex])

  const affiliateIdIndex = useMemo(() => {
    const map = new Map()
    ;(payments || []).forEach((p) => {
      const name = String(p?.affiliate || '').trim()
      const id = String(p?.affiliateId || '').trim()
      if (!name || !id) return
      const k = normalizeKey(name)
      if (!k) return
      if (!map.has(k)) map.set(k, id)
    })
    return map
  }, [payments])

  const affiliateIdIndexStrict = useMemo(() => {
    const map = new Map()
    ;(payments || []).forEach((p) => {
      const name = String(p?.affiliate || '').trim()
      const id = String(p?.affiliateId || '').trim()
      if (!name || !id) return
      const k = normalizeAffiliateKey(name)
      if (!k) return
      if (!map.has(k)) map.set(k, id)
    })
    return map
  }, [payments])

  const affiliateIndexFallback = useAffiliateIndexByName(true)

  const selectedAffiliateNumericId = useMemo(() => {
    // If route param is already a numeric affiliate id, accept it.
    const decoded = decodeAffiliateId(affiliateId)
    if (/^\d+$/.test(String(decoded || '').trim())) return String(decoded).trim()

    const k = normalizeKey(selectedAffiliateName)
    const ks = normalizeAffiliateKey(selectedAffiliateName)
    if (!k && !ks) return null

    return (
      affiliateIdIndex.get(k) ||
      affiliateIdIndexStrict.get(ks) ||
      affiliateIndexFallback?.byName?.get(k) ||
      affiliateIndexFallback?.byNameStrict?.get(ks) ||
      null
    )
  }, [
    affiliateId,
    selectedAffiliateName,
    affiliateIdIndex,
    affiliateIdIndexStrict,
    affiliateIndexFallback,
  ])

  const monthBounds = useMemo(() => {
    let earliest = null
    let latest = null
    const scan = (rows) => {
      for (const r of rows || []) {
        const id = monthIdForRow(r)
        if (id === null) continue
        if (latest === null || id > latest) latest = id
        if (earliest === null || id < earliest) earliest = id
      }
    }
    scan(mediaRows)
    scan(payments)
    return { earliest, latest }
  }, [mediaRows, payments])

  const periodContext = useMemo(() => {
    return buildRollingPeriodContextFromBounds(monthBounds, effectivePeriodType, t)
  }, [monthBounds, effectivePeriodType, t])

  const companyRegistrations = useMemo(() => {
    const rows = mediaRows || []
    if (!rows.length) return null

    const inRange = (row, startId, endId) => {
      const id = monthIdForRow(row)
      if (id === null) return false
      return id >= startId && id <= endId
    }

    if (
      effectivePeriodType === 'since-ever' ||
      periodContext.startId === null ||
      periodContext.endId === null
    ) {
      return rows.reduce((acc, r) => acc + (Number(r?.registrations || 0) || 0), 0)
    }

    return rows
      .filter((r) => inRange(r, periodContext.startId, periodContext.endId))
      .reduce((acc, r) => acc + (Number(r?.registrations || 0) || 0), 0)
  }, [mediaRows, effectivePeriodType, periodContext])

  const top20Affiliates = useMemo(() => {
    const byAffiliate = new Map()
    const ensure = (name) => {
      const key = String(name || '—')
      if (!byAffiliate.has(key)) byAffiliate.set(key, { affiliate: key, media: [], payments: [] })
      return byAffiliate.get(key)
    }

    ;(mediaRows || []).forEach((r) => ensure(r.affiliate).media.push(r))
    ;(payments || []).forEach((p) => ensure(p.affiliate).payments.push(p))

    const all = Array.from(byAffiliate.values())
      .map(({ affiliate, media, payments: payRows }) => {
        const kpis = deriveAffiliateKpis({ mediaRows: media, paymentsRows: payRows })
        return {
          affiliate,
          profit: kpis.totalProfit || 0,
          netDeposits: kpis.totalNetDeposits || 0,
          pl: kpis.totalPL || 0,
          payments: kpis.totalPayments || 0,
          roi: kpis.roi || 0,
        }
      })
      .filter((a) => a.affiliate && a.affiliate !== '—')
      .filter((a) => (a.netDeposits || 0) !== 0 || (a.pl || 0) !== 0 || (a.payments || 0) !== 0)

    const totalAbsPayments = all.reduce((acc, a) => acc + Math.abs(Number(a.payments || 0)), 0)

    return all
      .map((a) => {
        const weightPct = totalAbsPayments
          ? (Math.abs(Number(a.payments || 0)) / totalAbsPayments) * 100
          : 0
        return { ...a, weightPct }
      })
      .sort(
        (a, b) =>
          Math.abs(Number(b.payments || 0)) - Math.abs(Number(a.payments || 0)) ||
          (b.profit || 0) - (a.profit || 0)
      )
      .slice(0, 20)
      .map((a, idx) => ({ ...a, rank: idx + 1 }))
  }, [mediaRows, payments])

  const report = useMemo(() => {
    if (!selectedAffiliateName) return null

    const matchesAffiliate = (row) =>
      normalizeKey(row?.affiliate) === normalizeKey(selectedAffiliateName)
    const filteredMedia = mediaRows.filter(matchesAffiliate)
    const filteredPayments = payments.filter(matchesAffiliate)

    const inRange = (row, startId, endId) => {
      const id = monthIdForRow(row)
      if (id === null) return false
      return id >= startId && id <= endId
    }

    if (
      effectivePeriodType === 'since-ever' ||
      periodContext.startId === null ||
      periodContext.endId === null
    ) {
      const currentKpis = deriveAffiliateKpis({
        mediaRows: filteredMedia,
        paymentsRows: filteredPayments,
      })
      return {
        referenceLabel: periodContext.label,
        currentKpis,
        previousKpis: null,
        hasPrevious: false,
        previousLabel: '',
      }
    }

    const currentMedia = filteredMedia.filter((r) =>
      inRange(r, periodContext.startId, periodContext.endId)
    )
    const currentPayments = filteredPayments.filter((p) =>
      inRange(p, periodContext.startId, periodContext.endId)
    )

    const hasPrev = Boolean(
      periodContext.hasPrevious &&
      periodContext.prevStartId !== null &&
      periodContext.prevEndId !== null
    )
    const previousMedia = hasPrev
      ? filteredMedia.filter((r) => inRange(r, periodContext.prevStartId, periodContext.prevEndId))
      : []
    const previousPayments = hasPrev
      ? filteredPayments.filter((p) =>
          inRange(p, periodContext.prevStartId, periodContext.prevEndId)
        )
      : []

    const currentKpis = deriveAffiliateKpis({
      mediaRows: currentMedia,
      paymentsRows: currentPayments,
    })
    const previousKpis = hasPrev
      ? deriveAffiliateKpis({ mediaRows: previousMedia, paymentsRows: previousPayments })
      : null

    const prevLabel = hasPrev
      ? formatMonthRange(periodContext.prevStartId, periodContext.prevEndId)
      : ''

    return {
      referenceLabel: periodContext.label,
      currentKpis,
      previousKpis,
      hasPrevious: hasPrev,
      previousLabel: prevLabel,
    }
  }, [mediaRows, payments, selectedAffiliateName, effectivePeriodType, periodContext])

  const affiliateCumulativeSeries = useMemo(() => {
    if (!selectedAffiliateName) return []

    const aKey = normalizeKey(selectedAffiliateName)

    const byId = new Map()
    ;(mediaRows || []).forEach((r) => {
      if (normalizeKey(r?.affiliate) !== aKey) return
      const id = monthIdForRow(r)
      if (id === null) return

      const year = Number(r?.year)
      const monthIndex = Number(r?.monthIndex)
      if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return

      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
      const existing = byId.get(id) || {
        key,
        date: new Date(Date.UTC(year, monthIndex, 1)),
        _ts: Date.UTC(year, monthIndex, 1),
        monthId: id,
        regs: 0,
        ftd: 0,
        qftd: 0,
        hasData: false,
      }

      existing.regs += Number(r?.registrations || 0)
      existing.ftd += Number(r?.ftd || 0)
      existing.qftd += Number(r?.qftd || 0)
      existing.hasData = true
      byId.set(id, existing)
    })

    const months = Array.from(byId.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v)

    let runRegs = 0
    let runFtd = 0
    let runQftd = 0
    return months.map((m) => {
      runRegs += Number(m.regs || 0)
      runFtd += Number(m.ftd || 0)
      runQftd += Number(m.qftd || 0)
      return {
        ...m,
        cumRegs: runRegs,
        cumFTD: runFtd,
        cumQFTD: runQftd,
      }
    })
  }, [selectedAffiliateName, mediaRows])

  const kpiContext = useMemo(() => {
    if (!selectedAffiliateName) return null

    const top = (top20Affiliates || []).map((a) => a.affiliate).filter(Boolean)
    if (!top.length) return null

    const hasWindow =
      effectivePeriodType !== 'since-ever' &&
      periodContext.startId !== null &&
      periodContext.endId !== null
    const curWindow = hasWindow
      ? { startId: periodContext.startId, endId: periodContext.endId }
      : null

    const sum = (rows, field) => rows.reduce((acc, r) => acc + (Number(r?.[field]) || 0), 0)
    const inRange = (row, startId, endId) => {
      const id = monthIdForRow(row)
      if (id === null) return false
      return id >= startId && id <= endId
    }

    const applyWindow = (rows, window) => {
      if (!window) return rows
      return (rows || []).filter((r) => inRange(r, window.startId, window.endId))
    }

    const selKey = normalizeKey(selectedAffiliateName)
    let selected = null
    const totals = { absPayments: 0, absNetDeposits: 0, absPl: 0 }

    for (const affiliate of top) {
      const aKey = normalizeKey(affiliate)
      const mediaAll = mediaByAffiliateKey.get(aKey) || []
      const payAll = paymentsByAffiliateKey.get(aKey) || []
      const media = applyWindow(mediaAll, curWindow)
      const pay = applyWindow(payAll, curWindow)

      const kpis = deriveAffiliateKpis({ mediaRows: media, paymentsRows: pay })
      const pl = Number(kpis.totalPL || 0)
      const paymentsTotal = Number(kpis.totalPayments || 0)
      const netDeposits = Number(kpis.totalNetDeposits || 0)

      totals.absPayments += Math.abs(paymentsTotal)
      totals.absNetDeposits += Math.abs(netDeposits)
      totals.absPl += Math.abs(pl)

      if (aKey === selKey) {
        const ftd = Number(kpis.ftd || 0)
        const deposits = sum(media, 'deposits')
        const withdrawals = sum(media, 'withdrawals')
        selected = {
          deposits,
          withdrawals,
          payments: paymentsTotal,
          netDeposits,
          pl,
          arpu: ftd ? pl / Math.max(ftd, 1) : 0,
          cpa: ftd ? Math.abs(paymentsTotal) / Math.max(ftd, 1) : 0,
          avgDepositsPerUser: ftd ? deposits / Math.max(ftd, 1) : 0,
        }
      }
    }

    const cur = selected || {
      deposits: 0,
      withdrawals: 0,
      payments: 0,
      netDeposits: 0,
      pl: 0,
      arpu: 0,
      cpa: 0,
      avgDepositsPerUser: 0,
    }

    return {
      total: top.length,
      values: cur,
      weights: {
        paymentsPct: totals.absPayments
          ? (Math.abs(Number(cur.payments || 0)) / totals.absPayments) * 100
          : null,
        netDepositsPct: totals.absNetDeposits
          ? (Math.abs(Number(cur.netDeposits || 0)) / totals.absNetDeposits) * 100
          : null,
        plPct: totals.absPl ? (Math.abs(Number(cur.pl || 0)) / totals.absPl) * 100 : null,
      },
    }
  }, [
    selectedAffiliateName,
    top20Affiliates,
    mediaByAffiliateKey,
    paymentsByAffiliateKey,
    effectivePeriodType,
    periodContext,
  ])

  const shareBase = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    if (boardMode) return `${origin}/share/affiliate-reports`
    return `${origin}/share/affiliate-reports/${token}`
  }, [token, boardMode])

  if (validating || loading) {
    return <FullPageLoader progress={35} subtitle={t('common.loading')} />
  }

  if (boardMode && (!authToken || !isValidToken)) {
    const next =
      typeof window !== 'undefined' ? window.location.pathname : '/share/affiliate-reports'
    const target = `/share/login?next=${encodeURIComponent(next)}`
    if (typeof window !== 'undefined') window.location.href = target
    return <FullPageLoader progress={30} subtitle={t('common.loading')} />
  }

  if (!isValidToken) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--text)',
          padding: 40,
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: 'var(--text)' }}>{t('shareAffiliateAnalysis.accessDenied.title')}</h2>
        <p style={{ color: 'var(--muted)', marginTop: 10 }}>
          {t('shareAffiliateAnalysis.accessDenied.subtitle')}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--text)',
          padding: 40,
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: 'var(--text)' }}>{t('shareAffiliateAnalysis.error.title')}</h2>
        <p style={{ color: 'var(--muted)', marginTop: 10 }}>{String(error?.message || error)}</p>
      </div>
    )
  }

  const isReportView = Boolean(selectedAffiliateName)

  if (!isReportView) {
    return (
      <PublicAffiliateReportsEntryView
        t={t}
        locale={locale}
        setLocale={setLocale}
        affiliates={top20Affiliates}
        shareBase={shareBase}
      />
    )
  }

  return (
    <PublicAffiliateReportsDetailView
      t={t}
      locale={locale}
      setLocale={setLocale}
      shareBase={shareBase}
      selectedAffiliateId={selectedAffiliateNumericId}
      affiliates={top20Affiliates}
      selectedAffiliateName={selectedAffiliateName}
      periodType={effectivePeriodType}
      setPeriodType={setPeriodType}
      selectedPeriodLabel={periodContext?.label || '—'}
      highlightStartId={effectivePeriodType !== 'since-ever' ? periodContext?.startId : null}
      highlightEndId={effectivePeriodType !== 'since-ever' ? periodContext?.endId : null}
      companyRegistrations={companyRegistrations}
      report={report}
      kpiContext={kpiContext}
      cumulativeSeries={affiliateCumulativeSeries}
    />
  )
}
