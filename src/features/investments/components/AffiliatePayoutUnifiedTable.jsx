import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
  formatEuroFullNoDecimals,
  formatPercent,
  formatPercentRounded,
} from '../../../lib/formatters'
import { useAffiliateLedger } from '../../media-payments/hooks/useAffiliateLedger'
import StickyMetricsTable from './StickyMetricsTable'
import { computeDelta, mergeAffiliateSources } from '../utils/mergeAffiliateSources'
import { getDeltaPillStyle, getDeltaTone } from '../utils/deltaStyle'
import { formatMonthReference } from '../utils/formatMonthReference'

const UNIFIED_MIN_ACTIVITY_EUR = 1000

const subHeaderStyle = {
  textAlign: 'right',
  fontSize: 11,
  color: 'rgba(148,163,184,0.95)',
  cursor: 'pointer',
  userSelect: 'none',
}

const groupHeaderStyle = {
  textAlign: 'center',
  fontSize: 11,
  color: '#cbd5e1',
  letterSpacing: 0.2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const paymentsDividerStyle = {
  borderRight: '2px solid rgba(255,255,255,0.12)',
  paddingRight: 16,
}

const afterPaymentsStyle = {
  paddingLeft: 16,
}

const pillBaseStyle = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 0,
  padding: '0px 4px',
  borderRadius: 999,
  fontSize: 8,
  fontWeight: 800,
  lineHeight: 1,
  minWidth: 42,
}

const CREO_MONTH_MAP = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

function parseCreolabsPeriodToMonthScore(periodId) {
  const s = String(periodId || '').trim()
  const m = s.match(/^(\d{4})[-\s]?([A-Za-z]{3,})/)
  if (!m) return null
  const year = Number(m[1])
  const monRaw = String(m[2] || '')
    .slice(0, 3)
    .toLowerCase()
  const monthIndex = CREO_MONTH_MAP[monRaw]
  if (!Number.isFinite(year) || monthIndex == null) return null
  const score = year * 12 + monthIndex
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  return { year, monthIndex, score, monthKey }
}

const formatRoiRatio = (v, digits = 2) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  const fixed = n.toFixed(Math.max(0, Math.min(6, Number(digits) || 0)))
  // Trim trailing zeros to keep "max" decimals.
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

const formatSignedPercent = (v) => {
  const n = Number(v) || 0
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${formatPercentRounded(Math.abs(n))}`
}

function affiliateDisplayLabel(affiliateId, affiliateIndexById, derivedIdToName) {
  const id = String(affiliateId || '').trim()
  if (!id) return '—'
  const entry = affiliateIndexById?.[id]
  const name =
    typeof entry === 'string'
      ? entry.trim()
      : String(entry?.name || entry?.affiliateName || '').trim()
  const derivedName = String(derivedIdToName?.[id] || '').trim()
  const bestName = name || derivedName
  if (bestName && bestName.toLowerCase() !== id.toLowerCase()) return `${bestName} (${id})`
  return id
}

function buildLatestByAffiliate(rows, canonicalizeAffiliateId) {
  const map = new Map()
  ;(rows || []).forEach((row) => {
    const year = Number(row.year)
    const monthIndex = Number(row.monthIndex)
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0) return
    const score = year * 12 + monthIndex
    const rawKey = row.affiliateId || row.uid || row.affiliate
    const key = canonicalizeAffiliateId ? canonicalizeAffiliateId(rawKey) : rawKey
    if (!map.has(key) || score > map.get(key).score) {
      map.set(key, {
        score,
        month: row.month,
        netDepositsMonth: row.netDeposits,
        paymentsMonth: row.commissionTotal ?? row.commission,
        plMonth: row.pl,
      })
    }
  })
  return map
}

function buildAllTimeByAffiliate(rows, canonicalizeAffiliateId) {
  const map = new Map()
  ;(rows || []).forEach((row) => {
    const rawKey = row.affiliateId || row.uid || row.affiliate
    const key = canonicalizeAffiliateId ? canonicalizeAffiliateId(rawKey) : rawKey
    if (!map.has(key)) map.set(key, { netDepositsEver: 0, paymentsEver: 0, plEver: 0 })
    const acc = map.get(key)
    acc.netDepositsEver += Number(row.netDeposits) || 0
    acc.paymentsEver += Number(row.commissionTotal ?? row.commission) || 0
    acc.plEver += Number(row.pl) || 0
  })
  return map
}

function normalizeMetricMaps({ latestByAffiliate, allTimeByAffiliate }) {
  const out = {}
  const keys = new Set([
    ...Array.from(latestByAffiliate?.keys?.() || []),
    ...Array.from(allTimeByAffiliate?.keys?.() || []),
  ])

  keys.forEach((affiliateId) => {
    const latest = latestByAffiliate?.get?.(affiliateId)
    const ever = allTimeByAffiliate?.get?.(affiliateId)
    out[affiliateId] = {
      ...(latest || {}),
      ...(ever || {}),
    }
  })
  return out
}

function totalsFromRows(rows, metricKey, source) {
  return rows.reduce((acc, r) => {
    const v = Number(r?.[source]?.[metricKey])
    return acc + (Number.isFinite(v) ? v : 0)
  }, 0)
}

function renderValue(metric, value) {
  if (value == null) return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) {
    if (Number.isNaN(n)) {
      if (String(metric?.key || '').startsWith('balance')) return '—'
      return 'n/a'
    }
    return '—'
  }
  if (metric.kind === 'eur') return formatEuroFullNoDecimals(n || 0)
  if (metric.kind === 'pl') return formatEuroFullNoDecimals(n || 0)
  if (metric.kind === 'roi') return formatRoiRatio(n || 0, 2)
  return String(value)
}

function renderTitle(metric, value) {
  if (value == null || !Number.isFinite(Number(value))) return undefined
  if (metric.kind === 'eur') return formatEuroFullNoDecimals(Number(value) || 0)
  if (metric.kind === 'pl') return formatEuroFullNoDecimals(Number(value) || 0)
  if (metric.kind === 'roi') return formatRoiRatio(Number(value) || 0, 4)
  return String(value)
}

function renderDeltaTitle(metric, deltaRec) {
  const { deltaPct, deltaPctIsNa } = deltaRec || {}
  if (deltaPctIsNa) {
    if (String(metric?.key || '').startsWith('balance')) return undefined
    return 'n/a'
  }
  if (!Number.isFinite(Number(deltaPct))) return undefined

  // deltaPct is already in percent units.
  if (metric?.kind === 'roi') return formatPercent(Number(deltaPct) || 0, 4)
  return formatPercent(Number(deltaPct) || 0, 4)
}

function renderDeltaCell(metric, deltaRec) {
  const { deltaAbs, deltaPct, deltaPctIsNa } = deltaRec || {}
  if (deltaPctIsNa && String(metric?.key || '').startsWith('balance')) return '—'
  const tone = getDeltaTone({ deltaAbs, deltaPct, deltaPctIsNa })
  const pillStyle = getDeltaPillStyle(tone)

  const pctLine = deltaPctIsNa ? 'n/a' : formatSignedPercent(deltaPct)

  return (
    <span
      title={renderDeltaTitle(metric, deltaRec)}
      style={{
        ...pillBaseStyle,
        ...pillStyle,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 38,
        opacity: 0.92,
      }}
    >
      <span
        style={{
          fontWeight: 800,
          fontSize: 10,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pctLine}
      </span>
    </span>
  )
}

export default function AffiliatePayoutUnifiedTable({
  _t,
  selectedYear,
  selectedMonth,
  search,
  cellxPayments,
  cellxMediaRows,
  creolabsPayments,
  creolabsMediaRows,
  affiliateIndexById,
  creolabsClientRows,
}) {
  const [focusDiscrepancies, setFocusDiscrepancies] = useState(false)
  // Default to a practical “biggest affiliates first” ordering.
  const [sort, setSort] = useState({ key: 'size', dir: 'desc' })

  const unifiedLockedColumns = useMemo(() => new Set(['affiliate', 'rank']), [])

  const derivedAffiliateMaps = useMemo(() => {
    const idToName = {}
    const nameToId = {}

    ;(cellxPayments || []).forEach((p) => {
      const id = String(p?.affiliateId || '').trim()
      const name = String(p?.affiliate || p?.affiliateName || '').trim()
      if (!id || !name) return
      if (!idToName[id]) idToName[id] = name
      const k = name.toLowerCase()
      if (!nameToId[k]) nameToId[k] = id
    })
    ;(cellxMediaRows || []).forEach((m) => {
      const id = String(m?.uid || '').trim()
      const name = String(m?.affiliate || '').trim()
      if (!id || !name) return
      if (!idToName[id]) idToName[id] = name
      const k = name.toLowerCase()
      if (!nameToId[k]) nameToId[k] = id
    })

    return { idToName, nameToId }
  }, [cellxPayments, cellxMediaRows])

  const canonicalizeAffiliateId = useMemo(() => {
    const byId =
      affiliateIndexById && typeof affiliateIndexById === 'object' ? affiliateIndexById : null
    const indexNameToId = {}

    if (byId) {
      Object.entries(byId).forEach(([id, entry]) => {
        const name =
          typeof entry === 'string'
            ? entry.trim()
            : String(entry?.name || entry?.affiliateName || '').trim()
        if (!name) return
        const k = name.toLowerCase()
        if (!indexNameToId[k]) indexNameToId[k] = id
      })
    }

    return (raw) => {
      const s = String(raw || '').trim() || '—'

      // If it's a known ID (affiliate_index.json), keep it.
      if (byId && Object.prototype.hasOwnProperty.call(byId, s)) return s

      // Try name -> id via affiliate_index.json.
      const maybeIndex = indexNameToId[s.toLowerCase()]
      if (maybeIndex) return maybeIndex

      // Fallback: try name -> id from CellX payments/media pairs.
      const maybeDerived = derivedAffiliateMaps?.nameToId?.[s.toLowerCase()]
      return maybeDerived || s
    }
  }, [affiliateIndexById, derivedAffiliateMaps])

  const cellxAllTimeLedger = useAffiliateLedger({
    mediaRows: cellxMediaRows,
    payments: cellxPayments,
    selectedYear: 'all',
    selectedMonth: 'all',
    search,
  })
  const creolabsAllTimeLedger = useAffiliateLedger({
    mediaRows: creolabsMediaRows,
    payments: creolabsPayments,
    selectedYear: 'all',
    selectedMonth: 'all',
    search,
  })

  const scopeFilter = useMemo(() => {
    const yearVal = selectedYear
    const monthVal = selectedMonth
    return (row) => {
      if (!row) return false
      const yearOk = yearVal === 'all' ? true : Number(row.year) === Number(yearVal)
      const monthOk = monthVal === 'all' ? true : String(row.month) === String(monthVal)
      return yearOk && monthOk
    }
  }, [selectedYear, selectedMonth])

  const cellxScopedRows = useMemo(
    () => (cellxAllTimeLedger?.ledger || []).filter(scopeFilter),
    [cellxAllTimeLedger, scopeFilter]
  )

  const creolabsScopedRows = useMemo(
    () => (creolabsAllTimeLedger?.ledger || []).filter(scopeFilter),
    [creolabsAllTimeLedger, scopeFilter]
  )

  const scopeLatestMonth = useMemo(() => {
    const pickLatest = (rows) => {
      let latest = null
      let latestScore = -Infinity
      ;(rows || []).forEach((row) => {
        const year = Number(row?.year)
        const monthIndex = Number(row?.monthIndex)
        if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0) return
        const score = year * 12 + monthIndex
        if (score > latestScore) {
          latestScore = score
          latest = row?.month
        }
      })
      return latest
    }

    // In unified mode, auto-picking the latest month across *either* source can choose a month
    // that exists only for one source (e.g. Creolabs has Mar, CellX has up to Feb).
    // That makes month-scoped columns look “misaligned”. Prefer the latest month common to both.
    const byMonth = new Map()

    const addRows = (rows, flag) => {
      ;(rows || []).forEach((row) => {
        const monthKey = String(row?.month || '').trim()
        if (!monthKey) return
        const year = Number(row?.year)
        const monthIndex = Number(row?.monthIndex)
        if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0) return
        const score = year * 12 + monthIndex

        const prev = byMonth.get(monthKey) || {
          score: -Infinity,
          hasCellx: false,
          hasCreolabs: false,
        }
        const next = {
          ...prev,
          score: Math.max(prev.score, score),
          hasCellx: prev.hasCellx || flag === 'cellx',
          hasCreolabs: prev.hasCreolabs || flag === 'creolabs',
        }
        byMonth.set(monthKey, next)
      })
    }

    addRows(cellxScopedRows, 'cellx')
    addRows(creolabsScopedRows, 'creolabs')

    let bestCommon = null
    let bestCommonScore = -Infinity
    byMonth.forEach((rec, monthKey) => {
      if (!rec?.hasCellx || !rec?.hasCreolabs) return
      if (Number(rec.score) > bestCommonScore) {
        bestCommonScore = Number(rec.score)
        bestCommon = monthKey
      }
    })

    if (bestCommon) return bestCommon

    // Fallback: if one source has no overlap (or is empty), still pick a deterministic latest month.
    return pickLatest(cellxScopedRows) || pickLatest(creolabsScopedRows) || null
  }, [cellxScopedRows, creolabsScopedRows])

  const effectiveMonthKey = useMemo(() => {
    const raw = String(selectedMonth || '').trim()
    if (raw && raw !== 'all') return raw
    return scopeLatestMonth || 'all'
  }, [selectedMonth, scopeLatestMonth])

  const monthRef = useMemo(
    () => formatMonthReference(selectedYear, effectiveMonthKey),
    [selectedYear, effectiveMonthKey]
  )

  // IMPORTANT: in unified mode, when the UI shows a specific month label (e.g. “February 2026”)
  // we want month-scoped metrics to refer to that same month for everyone.
  // Previously, when selectedMonth === 'all', we were picking the latest month *per affiliate*
  // (mixing Jan/Feb/etc) while still labeling the column with the global latest month.
  // That made totals look inflated/mismatched.
  const cellxMonthScopedRows = useMemo(() => {
    const monthKey = String(effectiveMonthKey || '').trim()
    if (!monthKey || monthKey === 'all') return []
    return (cellxAllTimeLedger?.ledger || []).filter((row) => String(row?.month) === monthKey)
  }, [cellxAllTimeLedger, effectiveMonthKey])

  const creolabsMonthScopedRows = useMemo(() => {
    const monthKey = String(effectiveMonthKey || '').trim()
    if (!monthKey || monthKey === 'all') return []
    return (creolabsAllTimeLedger?.ledger || []).filter((row) => String(row?.month) === monthKey)
  }, [creolabsAllTimeLedger, effectiveMonthKey])

  const activeMetrics = useMemo(
    () => [
      {
        key: 'paymentsMonth',
        label: `Payments (CellXpert) (${monthRef})`,
        kind: 'eur',
        layout: 'cellxOnly',
        title: `Payments used for ROI denominator — ${monthRef}`,
      },
      {
        key: 'paymentsEver',
        label: 'Payments (CellXpert) (All Time)',
        kind: 'eur',
        layout: 'cellxOnly',
        title: 'Payments used for ROI denominator — All Time',
      },
      {
        key: 'netDepositsMonth',
        label: `Net Deposits (${monthRef})`,
        kind: 'eur',
        layout: 'compare',
        title: `Per affiliate — ${monthRef}`,
      },
      {
        key: 'netDepositsEver',
        label: 'Net Deposits (All Time)',
        kind: 'eur',
        layout: 'compare',
        title: 'Per affiliate — All Time',
      },
      {
        key: 'plMonth',
        label: `P&L (${monthRef})`,
        kind: 'pl',
        layout: 'compare',
        title: `Per affiliate — ${monthRef}`,
      },
      {
        key: 'plEver',
        label: 'P&L (All Time)',
        kind: 'pl',
        layout: 'compare',
        title: 'Per affiliate — All Time',
      },
      {
        key: 'roiMonth',
        label: `ROI (${monthRef})`,
        kind: 'roi',
        layout: 'compare',
        title: `ROI = P&L / CellX Payments\nPer affiliate — ${monthRef}`,
      },
      {
        key: 'roiEver',
        label: 'ROI (All Time)',
        kind: 'roi',
        layout: 'compare',
        title: 'ROI = P&L / CellX Payments\nPer affiliate — All Time',
      },
      {
        key: 'balanceMonth',
        label: `Balance (${monthRef})`,
        kind: 'eur',
        layout: 'compare',
        title: `Affiliate Balance (sum client balances) — ${monthRef}`,
      },
      {
        key: 'balanceEver',
        label: 'Balance (Historic AVG)',
        kind: 'eur',
        layout: 'compare',
        title:
          'Affiliate Balance (Historic AVG of monthly snapshots; each snapshot = sum of max client balances)',
      },
    ],
    [monthRef]
  )

  const compareMetricKeys = useMemo(
    () => activeMetrics.filter((m) => m.layout === 'compare').map((m) => m.key),
    [activeMetrics]
  )

  const unifiedColumns = useMemo(() => {
    const cols = [
      { id: 'affiliate', label: 'Affiliate' },
      { id: 'rank', label: '#' },
    ]

    activeMetrics.forEach((m) => {
      cols.push({ id: `${m.key}|cellx`, label: `${m.label} · CellXpert` })
      if (m.layout === 'compare') {
        cols.push({ id: `${m.key}|creolabs`, label: `${m.label} · Creolabs` })
        cols.push({ id: `${m.key}|delta`, label: `${m.label} · Delta` })
      }
    })

    return cols
  }, [activeMetrics])

  const unifiedDefaultVisibility = useMemo(() => {
    const out = {}
    unifiedColumns.forEach((c) => {
      out[c.id] = true
    })
    return out
  }, [unifiedColumns])

  const [unifiedColumnVisibility, setUnifiedColumnVisibility] = useState(unifiedDefaultVisibility)

  useEffect(() => {
    setUnifiedColumnVisibility((prev) => {
      const next = { ...unifiedDefaultVisibility }
      Object.keys(next).forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(prev || {}, k)) next[k] = prev[k] !== false
      })
      return next
    })
  }, [unifiedDefaultVisibility])

  const isUnifiedVisible = (id) => {
    if (unifiedLockedColumns.has(id)) return true
    return unifiedColumnVisibility?.[id] !== false
  }

  const toggleUnifiedColumn = (id) => {
    setUnifiedColumnVisibility((prev) => {
      if (unifiedLockedColumns.has(id)) return prev
      const isCurrentlyVisible = prev?.[id] !== false
      return { ...prev, [id]: !isCurrentlyVisible }
    })
  }

  const resetUnifiedColumns = () => {
    setUnifiedColumnVisibility(unifiedDefaultVisibility)
  }

  const unifiedVisibleColumnsCount = Math.max(
    1,
    unifiedColumns.reduce((acc, c) => acc + (isUnifiedVisible(c.id) ? 1 : 0), 0)
  )

  const deltaColumnCellStyle = {
    width: 72,
    maxWidth: 72,
    paddingLeft: 8,
    paddingRight: 8,
  }

  const headerClickTimersRef = useRef({})
  const scheduleHeaderClick = (key, cb) => {
    const timers = headerClickTimersRef.current
    if (timers[key]) {
      window.clearTimeout(timers[key])
      delete timers[key]
    }
    timers[key] = window.setTimeout(() => {
      delete timers[key]
      cb()
    }, 250)
  }
  const cancelHeaderClick = (key) => {
    const timers = headerClickTimersRef.current
    if (timers[key]) {
      window.clearTimeout(timers[key])
      delete timers[key]
    }
  }

  // When reconciling two sources, summing "All Time" over different coverage windows produces
  // misleading deltas (often ~-100%). To keep comparisons meaningful, restrict "All Time" to the
  // months that exist in BOTH sources per affiliate.
  const comparableAllTimeLedgers = useMemo(() => {
    const cellxLedger = Array.isArray(cellxAllTimeLedger?.ledger) ? cellxAllTimeLedger.ledger : []
    const creoLedger = Array.isArray(creolabsAllTimeLedger?.ledger)
      ? creolabsAllTimeLedger.ledger
      : []

    const monthsByAffiliate = (rows) => {
      const map = new Map()
      for (const r of rows) {
        const rawId = r?.affiliateId
        const key = canonicalizeAffiliateId ? canonicalizeAffiliateId(rawId) : rawId
        const monthKey = String(r?.month || '').trim()
        if (!key || !monthKey) continue
        if (!map.has(key)) map.set(key, new Set())
        map.get(key).add(monthKey)
      }
      return map
    }

    const cellxMonths = monthsByAffiliate(cellxLedger)
    const creoMonths = monthsByAffiliate(creoLedger)

    const filterToCommon = (rows, otherMonthsMap) => {
      const out = []
      for (const r of rows) {
        const rawId = r?.affiliateId
        const key = canonicalizeAffiliateId ? canonicalizeAffiliateId(rawId) : rawId
        const monthKey = String(r?.month || '').trim()
        if (!key || !monthKey) continue
        const set = otherMonthsMap.get(key)
        if (set && set.has(monthKey)) out.push(r)
      }
      return out
    }

    return {
      cellx: filterToCommon(cellxLedger, creoMonths),
      creolabs: filterToCommon(creoLedger, cellxMonths),
    }
  }, [cellxAllTimeLedger, creolabsAllTimeLedger, canonicalizeAffiliateId])

  const creolabsBalanceMaps = useMemo(() => {
    const rows = Array.isArray(creolabsClientRows) ? creolabsClientRows : []
    const wantedMonthKey = String(effectiveMonthKey || '').trim()
    const wantMonth = wantedMonthKey && wantedMonthKey !== 'all' ? wantedMonthKey : null

    if (!rows.length) {
      return {
        hasData: false,
        wantMonth,
        monthByAffiliate: new Map(),
        everByAffiliate: new Map(),
      }
    }

    // We treat Balance as a month snapshot (per affiliate: SUM(max(balance) per client)).
    // For “All Time”, use the average of monthly snapshots (not a sum over months).
    const records = []

    for (const r of rows) {
      const parsed = parseCreolabsPeriodToMonthScore(r?.periodId)
      if (!parsed) continue
      const rawAff = r?.affiliateId
      const affiliateId = canonicalizeAffiliateId
        ? canonicalizeAffiliateId(rawAff)
        : String(rawAff || '').trim()
      if (!affiliateId) continue
      const clientId = String(r?.clientId || r?.clientLogin || r?.clientName || '').trim()
      if (!clientId) continue
      const bal = Number(r?.balance)
      if (!Number.isFinite(bal)) continue

      records.push({
        affiliateId,
        monthKey: parsed.monthKey,
        score: parsed.score,
        clientId,
        bal,
      })
    }

    if (!records.length) {
      return {
        hasData: false,
        wantMonth,
        monthByAffiliate: new Map(),
        everByAffiliate: new Map(),
      }
    }

    records.sort((a, b) => {
      const affCmp = a.affiliateId.localeCompare(b.affiliateId)
      if (affCmp) return affCmp
      const scoreCmp = Number(a.score) - Number(b.score)
      if (scoreCmp) return scoreCmp
      return a.clientId.localeCompare(b.clientId)
    })

    const monthByAffiliate = new Map()
    const sumMonthsByAffiliate = new Map()
    const monthsCountByAffiliate = new Map()

    let curAffiliate = null
    let curMonthKey = null
    let curClient = null
    let curClientMax = 0
    let curMonthSum = 0
    let curAffiliateSum = 0
    let curAffiliateMonths = 0

    const flushClient = () => {
      if (curClient == null) return
      curMonthSum += Number(curClientMax) || 0
      curClient = null
      curClientMax = 0
    }

    const flushMonth = () => {
      if (curMonthKey == null) return
      flushClient()
      if (wantMonth && curMonthKey === wantMonth) {
        monthByAffiliate.set(curAffiliate, curMonthSum)
      }
      curAffiliateSum += Number(curMonthSum) || 0
      curAffiliateMonths += 1
      curMonthKey = null
      curMonthSum = 0
    }

    const flushAffiliate = () => {
      if (curAffiliate == null) return
      flushMonth()
      sumMonthsByAffiliate.set(curAffiliate, curAffiliateSum)
      monthsCountByAffiliate.set(curAffiliate, curAffiliateMonths)
      curAffiliate = null
      curAffiliateSum = 0
      curAffiliateMonths = 0
    }

    for (const rec of records) {
      if (curAffiliate !== rec.affiliateId) {
        flushAffiliate()
        curAffiliate = rec.affiliateId
        curMonthKey = rec.monthKey
        curClient = rec.clientId
        curClientMax = rec.bal
        continue
      }

      if (curMonthKey !== rec.monthKey) {
        flushMonth()
        curMonthKey = rec.monthKey
        curClient = rec.clientId
        curClientMax = rec.bal
        continue
      }

      if (curClient !== rec.clientId) {
        flushClient()
        curClient = rec.clientId
        curClientMax = rec.bal
        continue
      }

      if (Number(rec.bal) > Number(curClientMax)) curClientMax = rec.bal
    }

    flushAffiliate()

    const everByAffiliate = new Map()
    sumMonthsByAffiliate.forEach((sum, affiliateId) => {
      const count = Number(monthsCountByAffiliate.get(affiliateId)) || 0
      if (count > 0) everByAffiliate.set(affiliateId, Number(sum) / count)
    })

    return { hasData: true, wantMonth, monthByAffiliate, everByAffiliate }
  }, [creolabsClientRows, effectiveMonthKey, canonicalizeAffiliateId])

  const cellxMetricsByAffiliate = useMemo(() => {
    const latest = buildLatestByAffiliate(cellxMonthScopedRows, canonicalizeAffiliateId)
    const ever = buildAllTimeByAffiliate(
      comparableAllTimeLedgers?.cellx || [],
      canonicalizeAffiliateId
    )
    const out = normalizeMetricMaps({ latestByAffiliate: latest, allTimeByAffiliate: ever })

    // CellX balance is not available in current artifacts.
    Object.keys(out || {}).forEach((affiliateId) => {
      out[affiliateId].balanceMonth = Number.NaN
      out[affiliateId].balanceEver = Number.NaN
    })

    return out
  }, [cellxMonthScopedRows, comparableAllTimeLedgers, canonicalizeAffiliateId])

  const creolabsMetricsByAffiliate = useMemo(() => {
    const latest = buildLatestByAffiliate(creolabsMonthScopedRows, canonicalizeAffiliateId)
    const ever = buildAllTimeByAffiliate(
      comparableAllTimeLedgers?.creolabs || [],
      canonicalizeAffiliateId
    )
    const out = normalizeMetricMaps({ latestByAffiliate: latest, allTimeByAffiliate: ever })

    if (creolabsBalanceMaps?.hasData) {
      Object.keys(out || {}).forEach((affiliateId) => {
        out[affiliateId].balanceMonth = creolabsBalanceMaps.monthByAffiliate.has(affiliateId)
          ? creolabsBalanceMaps.monthByAffiliate.get(affiliateId)
          : Number.NaN
        out[affiliateId].balanceEver = creolabsBalanceMaps.everByAffiliate.has(affiliateId)
          ? creolabsBalanceMaps.everByAffiliate.get(affiliateId)
          : Number.NaN
      })
    }

    return out
  }, [
    creolabsMonthScopedRows,
    comparableAllTimeLedgers,
    canonicalizeAffiliateId,
    creolabsBalanceMaps,
  ])

  // Creolabs exports sometimes provide Net/Deposit/WD only for a subset of periods.
  // When Net coverage is missing for a month, treating it as zero makes deltas look ~-100% everywhere.
  // Detect month-level net coverage (sum abs(netDeposits) > 0) to mark those comparisons as n/a.
  const creolabsNetCoverageMonths = useMemo(() => {
    const ledger = Array.isArray(creolabsAllTimeLedger?.ledger) ? creolabsAllTimeLedger.ledger : []
    const absByMonth = new Map()
    for (const r of ledger) {
      const monthKey = String(r?.month || '').trim()
      if (!monthKey) continue
      const v = Math.abs(Number(r?.netDeposits) || 0)
      if (!v) continue
      absByMonth.set(monthKey, (absByMonth.get(monthKey) || 0) + v)
    }
    const out = new Set()
    absByMonth.forEach((sumAbs, monthKey) => {
      if (Number(sumAbs) > 0) out.add(monthKey)
    })
    return out
  }, [creolabsAllTimeLedger])

  const netDepositsEverComparable = useMemo(() => {
    const months = creolabsNetCoverageMonths
    const cellxLedger = Array.isArray(cellxAllTimeLedger?.ledger) ? cellxAllTimeLedger.ledger : []
    const creoLedger = Array.isArray(creolabsAllTimeLedger?.ledger)
      ? creolabsAllTimeLedger.ledger
      : []

    const sumByAffiliate = (rows) => {
      const map = new Map()
      for (const r of rows) {
        const monthKey = String(r?.month || '').trim()
        if (!monthKey || !months.has(monthKey)) continue
        const rawId = r?.affiliateId
        const affiliateId = canonicalizeAffiliateId ? canonicalizeAffiliateId(rawId) : rawId
        if (!affiliateId) continue
        map.set(affiliateId, (map.get(affiliateId) || 0) + (Number(r?.netDeposits) || 0))
      }
      return map
    }

    return {
      cellxByAffiliate: sumByAffiliate(cellxLedger),
      creolabsByAffiliate: sumByAffiliate(creoLedger),
    }
  }, [
    cellxAllTimeLedger,
    creolabsAllTimeLedger,
    creolabsNetCoverageMonths,
    canonicalizeAffiliateId,
  ])

  const merged = useMemo(() => {
    const base = mergeAffiliateSources({
      cellxByAffiliate: cellxMetricsByAffiliate,
      creolabsByAffiliate: creolabsMetricsByAffiliate,
      metricKeys: compareMetricKeys.filter((k) => k !== 'roiMonth' && k !== 'roiEver'),
    })

    const enriched = base.map((r) => {
      const cellx = r?.cellx || {}
      const creolabs = r?.creolabs || {}

      const paymentsMonth = Number(cellx.paymentsMonth) || 0
      const paymentsEver = Number(cellx.paymentsEver) || 0

      const cellxPlMonth = Number(cellx.plMonth) || 0
      const cellxPlEver = Number(cellx.plEver) || 0
      const creoPlMonth = Number(creolabs.plMonth) || 0
      const creoPlEver = Number(creolabs.plEver) || 0

      const cellxRoiMonth = paymentsMonth > 0 ? cellxPlMonth / paymentsMonth : 0
      const creoRoiMonth = paymentsMonth > 0 ? creoPlMonth / paymentsMonth : 0
      const cellxRoiEver = paymentsEver > 0 ? cellxPlEver / paymentsEver : 0
      const creoRoiEver = paymentsEver > 0 ? creoPlEver / paymentsEver : 0

      const next = {
        ...r,
        cellx: { ...cellx, roiMonth: cellxRoiMonth, roiEver: cellxRoiEver },
        creolabs: { ...creolabs, roiMonth: creoRoiMonth, roiEver: creoRoiEver },
        delta: { ...(r.delta || {}) },
      }

      // Net deposits comparisons: if Creolabs has no net coverage for the selected month,
      // mark the month metric as n/a (instead of showing a misleading -100% delta).
      const monthKey = String(effectiveMonthKey || '').trim()
      const monthHasNet =
        monthKey && monthKey !== 'all' ? creolabsNetCoverageMonths.has(monthKey) : false
      if (!monthHasNet) {
        next.creolabs.netDepositsMonth = Number.NaN
        next.delta.netDepositsMonth = { deltaAbs: null, deltaPct: null, deltaPctIsNa: true }
      }

      // For "All Time" net deposits, compare only across months where Creolabs net is actually present.
      // This keeps the window consistent and avoids global ~-100% deltas when Creolabs net is absent historically.
      const affKey = r?.affiliateId
      const cellxNetEver = netDepositsEverComparable?.cellxByAffiliate?.get?.(affKey)
      const creoNetEver = netDepositsEverComparable?.creolabsByAffiliate?.get?.(affKey)
      if (cellxNetEver != null || creoNetEver != null) {
        next.cellx.netDepositsEver = Number(cellxNetEver) || 0
        next.creolabs.netDepositsEver = Number(creoNetEver) || 0
        next.delta.netDepositsEver = computeDelta(
          next.cellx.netDepositsEver,
          next.creolabs.netDepositsEver
        )
      }

      next.delta.roiMonth = computeDelta(next.cellx.roiMonth, next.creolabs.roiMonth)
      next.delta.roiEver = computeDelta(next.cellx.roiEver, next.creolabs.roiEver)

      // Balance is not available in CellX artifacts: keep the cell values as "—" and
      // avoid treating the delta as a discrepancy (so rows don't get flagged).
      for (const k of ['balanceMonth', 'balanceEver']) {
        if (!Object.prototype.hasOwnProperty.call(next.delta, k)) continue
        const c = Number(next.cellx?.[k])
        const o = Number(next.creolabs?.[k])
        const cOk = Number.isFinite(c)
        const oOk = Number.isFinite(o)
        if (!cOk || !oOk) {
          next.delta[k] = { deltaAbs: 0, deltaPct: null, deltaPctIsNa: true }
        }
      }

      // Recompute discrepancy aggregates including ROI.
      let maxAbsDeltaPct = 0
      let hasNaPct = false
      for (const k of compareMetricKeys) {
        if (String(k).startsWith('balance')) continue
        const d = next.delta?.[k]
        if (!d) continue
        if (
          d.deltaPctIsNa &&
          (Number(next.cellx?.[k]) || 0) === 0 &&
          (Number(next.creolabs?.[k]) || 0) !== 0
        ) {
          hasNaPct = true
        }
        if (Number.isFinite(Number(d.deltaPct))) {
          maxAbsDeltaPct = Math.max(maxAbsDeltaPct, Math.abs(Number(d.deltaPct)))
        }
      }
      next.maxAbsDeltaPct = maxAbsDeltaPct
      next.discrepancyScore = hasNaPct ? 1e9 : maxAbsDeltaPct

      return next
    })

    // Ignore low-activity affiliates to reduce noise and memory churn.
    // Activity is measured on "ever" metrics as they are the most stable.
    return enriched.filter((r) => {
      const c = r?.cellx || {}
      const o = r?.creolabs || {}
      const cPay = Math.abs(Number(c.paymentsEver) || 0)
      const cNet = Math.abs(Number(c.netDepositsEver) || 0)
      const oNet = Math.abs(Number(o.netDepositsEver) || 0)
      const cPl = Math.abs(Number(c.plEver) || 0)
      const oPl = Math.abs(Number(o.plEver) || 0)
      const activity = Math.max(cPay, cNet, oNet, cPl, oPl)
      return activity >= UNIFIED_MIN_ACTIVITY_EUR
    })
  }, [cellxMetricsByAffiliate, creolabsMetricsByAffiliate, compareMetricKeys])

  const flaggedByRow = useMemo(() => {
    const out = new Map()
    merged.forEach((r) => {
      let flagged = false
      for (const k of compareMetricKeys) {
        const d = r.delta?.[k]
        const tone = getDeltaTone(d || {})
        if (tone && tone !== 'ok' && tone !== 'neutral') {
          flagged = true
          break
        }
      }
      out.set(r.affiliateId, flagged)
    })
    return out
  }, [merged, compareMetricKeys])

  const totalsRow = useMemo(() => {
    const rowsForTotals = focusDiscrepancies
      ? merged.filter((r) => flaggedByRow.get(r.affiliateId))
      : merged

    const totals = {
      affiliateId: '__TOTALS__',
      cellx: {},
      creolabs: {},
      delta: {},
    }

    // Sum numeric metrics except ROI (computed from totals net/comm).
    const sumKeys = new Set([
      'paymentsMonth',
      'paymentsEver',
      'netDepositsMonth',
      'plMonth',
      'netDepositsEver',
      'plEver',
    ])

    if (creolabsBalanceMaps?.hasData) {
      sumKeys.add('balanceMonth')
      sumKeys.add('balanceEver')
    }
    sumKeys.forEach((k) => {
      totals.cellx[k] = totalsFromRows(rowsForTotals, k, 'cellx')
      totals.creolabs[k] = totalsFromRows(rowsForTotals, k, 'creolabs')
    })

    if (creolabsBalanceMaps?.hasData) {
      // Explicitly mark CellX balance as unavailable.
      totals.cellx.balanceMonth = Number.NaN
      totals.cellx.balanceEver = Number.NaN
    }

    totals.cellx.roiMonth =
      totals.cellx.paymentsMonth > 0 ? totals.cellx.plMonth / totals.cellx.paymentsMonth : 0
    totals.creolabs.roiMonth =
      totals.cellx.paymentsMonth > 0 ? totals.creolabs.plMonth / totals.cellx.paymentsMonth : 0
    totals.cellx.roiEver =
      totals.cellx.paymentsEver > 0 ? totals.cellx.plEver / totals.cellx.paymentsEver : 0
    totals.creolabs.roiEver =
      totals.cellx.paymentsEver > 0 ? totals.creolabs.plEver / totals.cellx.paymentsEver : 0

    for (const k of compareMetricKeys) {
      totals.delta[k] = computeDelta(totals.cellx[k], totals.creolabs[k])
    }

    // Make Balance deltas neutral when CellX balance is unavailable.
    for (const k of ['balanceMonth', 'balanceEver']) {
      if (!Object.prototype.hasOwnProperty.call(totals.delta, k)) continue
      const c = Number(totals.cellx?.[k])
      const o = Number(totals.creolabs?.[k])
      const cOk = Number.isFinite(c)
      const oOk = Number.isFinite(o)
      if (!cOk || !oOk) {
        totals.delta[k] = { deltaAbs: 0, deltaPct: null, deltaPctIsNa: true }
      }
    }

    const monthKey = String(effectiveMonthKey || '').trim()
    const monthHasNet =
      monthKey && monthKey !== 'all' ? creolabsNetCoverageMonths.has(monthKey) : false
    if (!monthHasNet) {
      totals.creolabs.netDepositsMonth = Number.NaN
      totals.delta.netDepositsMonth = { deltaAbs: null, deltaPct: null, deltaPctIsNa: true }
    }

    return totals
  }, [
    merged,
    compareMetricKeys,
    focusDiscrepancies,
    flaggedByRow,
    effectiveMonthKey,
    creolabsNetCoverageMonths,
  ])

  const flaggedCount = useMemo(() => {
    let count = 0
    merged.forEach((r) => {
      if (flaggedByRow.get(r.affiliateId)) count += 1
    })
    return count
  }, [merged, flaggedByRow])

  const visibleRows = useMemo(() => {
    const base = focusDiscrepancies ? merged.filter((r) => flaggedByRow.get(r.affiliateId)) : merged

    const sorted = [...base]
    const dirMul = sort.dir === 'asc' ? 1 : -1

    const getMetric = (row, side, key) => {
      const v = Number(row?.[side]?.[key])
      return Number.isFinite(v) ? v : null
    }

    const getDeltaDiscrepancy = (row, key) => {
      const d = row?.delta?.[key]
      if (d?.deltaPctIsNa && (Number(row?.creolabs?.[key]) || 0) !== 0) return 1e9
      if (Number.isFinite(Number(d?.deltaPct))) return Math.abs(Number(d.deltaPct))
      return Math.abs(Number(d?.deltaAbs) || 0)
    }

    const getSizeScore = (row) => {
      // Use “ever” metrics to keep ranking stable across filters.
      // Primary: CellX paymentsEver, fallback: netDepositsEver.
      const cPay = Math.abs(Number(row?.cellx?.paymentsEver) || 0)
      const cNet = Math.abs(Number(row?.cellx?.netDepositsEver) || 0)
      const oNet = Math.abs(Number(row?.creolabs?.netDepositsEver) || 0)
      if (cPay > 0) return cPay
      return Math.max(cNet, oNet)
    }

    sorted.sort((a, b) => {
      if (sort.key === 'size') {
        return (getSizeScore(a) - getSizeScore(b)) * dirMul
      }
      if (sort.key === 'discrepancy') {
        return (a.discrepancyScore - b.discrepancyScore) * dirMul
      }

      const [key, side] = String(sort.key || '').split('|')
      if (!key || !side) return 0
      if (side === 'delta') {
        const av = getDeltaDiscrepancy(a, key)
        const bv = getDeltaDiscrepancy(b, key)
        return (av - bv) * dirMul
      }

      const av = getMetric(a, side, key)
      const bv = getMetric(b, side, key)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return (av - bv) * dirMul
    })

    return sorted
  }, [merged, focusDiscrepancies, flaggedByRow, sort])

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      return { key, dir: 'desc' }
    })
  }

  const focusLabel = 'Focus discrepancies'
  const countLabel = `${flaggedCount} flagged / ${merged.length} total`

  const showEmpty = !visibleRows.length
  const hasAnyRows = merged.length > 0

  const defaultSortSideForMetric = (m) => {
    if (m.layout === 'compare') {
      if (isUnifiedVisible(`${m.key}|delta`)) return 'delta'
      if (isUnifiedVisible(`${m.key}|cellx`)) return 'cellx'
      if (isUnifiedVisible(`${m.key}|creolabs`)) return 'creolabs'
      return 'delta'
    }
    return 'cellx'
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className={focusDiscrepancies ? 'btn' : 'btn secondary'}
          onClick={() => setFocusDiscrepancies((v) => !v)}
          title={focusLabel}
        >
          {focusLabel}
        </button>
        <button type="button" className="btn secondary" onClick={resetUnifiedColumns}>
          Reset columns
        </button>
        <span
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 12,
            color: '#cbd5e1',
            fontWeight: 700,
          }}
        >
          {countLabel}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.95)' }}>
          Click a header to hide, double-click to sort
        </span>
      </div>

      <StickyMetricsTable className="table payout-unified-table">
        <thead>
          <tr>
            <th
              rowSpan={2}
              style={{
                textAlign: 'left',
                whiteSpace: 'nowrap',
              }}
            >
              Affiliate
            </th>
            <th
              rowSpan={2}
              style={{
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}
            >
              #
            </th>
            {activeMetrics.map((m) => {
              const groupVisibleCols =
                m.layout === 'compare'
                  ? (isUnifiedVisible(`${m.key}|cellx`) ? 1 : 0) +
                    (isUnifiedVisible(`${m.key}|creolabs`) ? 1 : 0) +
                    (isUnifiedVisible(`${m.key}|delta`) ? 1 : 0)
                  : isUnifiedVisible(`${m.key}|cellx`)
                    ? 1
                    : 0

              if (!groupVisibleCols) return null
              return (
                <th
                  key={m.key}
                  colSpan={groupVisibleCols}
                  style={{
                    ...groupHeaderStyle,
                    ...(m.key === 'paymentsEver' ? paymentsDividerStyle : null),
                    ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                  }}
                  title={m.title}
                  onDoubleClick={() => toggleSort(`${m.key}|${defaultSortSideForMetric(m)}`)}
                >
                  {m.label}
                </th>
              )
            })}
          </tr>
          <tr>
            {activeMetrics.map((m) => {
              const showCellx = isUnifiedVisible(`${m.key}|cellx`)
              const showCreolabs = m.layout === 'compare' && isUnifiedVisible(`${m.key}|creolabs`)
              const showDelta = m.layout === 'compare' && isUnifiedVisible(`${m.key}|delta`)

              if (!showCellx && !showCreolabs && !showDelta) return null
              return (
                <React.Fragment key={`${m.key}-sub`}>
                  {showCellx ? (
                    <th
                      style={{
                        ...subHeaderStyle,
                        ...(m.key === 'paymentsEver' ? paymentsDividerStyle : null),
                        ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                      }}
                      title="Click to hide, double-click to sort"
                      onClick={() =>
                        scheduleHeaderClick(`${m.key}|cellx`, () =>
                          toggleUnifiedColumn(`${m.key}|cellx`)
                        )
                      }
                      onDoubleClick={() => {
                        cancelHeaderClick(`${m.key}|cellx`)
                        toggleSort(`${m.key}|cellx`)
                      }}
                    >
                      CellXpert
                    </th>
                  ) : null}
                  {showCreolabs ? (
                    <th
                      style={{
                        ...subHeaderStyle,
                        ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                      }}
                      title="Click to hide, double-click to sort"
                      onClick={() =>
                        scheduleHeaderClick(`${m.key}|creolabs`, () =>
                          toggleUnifiedColumn(`${m.key}|creolabs`)
                        )
                      }
                      onDoubleClick={() => {
                        cancelHeaderClick(`${m.key}|creolabs`)
                        toggleSort(`${m.key}|creolabs`)
                      }}
                    >
                      Creolabs
                    </th>
                  ) : null}
                  {showDelta ? (
                    <th
                      style={{
                        ...subHeaderStyle,
                        ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                        ...deltaColumnCellStyle,
                      }}
                      title="Click to hide, double-click to sort"
                      onClick={() =>
                        scheduleHeaderClick(`${m.key}|delta`, () =>
                          toggleUnifiedColumn(`${m.key}|delta`)
                        )
                      }
                      onDoubleClick={() => {
                        cancelHeaderClick(`${m.key}|delta`)
                        toggleSort(`${m.key}|delta`)
                      }}
                    >
                      Delta
                    </th>
                  ) : null}
                </React.Fragment>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {hasAnyRows ? (
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              <td style={{ textAlign: 'left', fontWeight: 900 }}>Totals</td>
              <td style={{ textAlign: 'right', fontWeight: 800 }}>—</td>
              {activeMetrics.map((m) => {
                const showCellx = isUnifiedVisible(`${m.key}|cellx`)
                const showCreolabs = m.layout === 'compare' && isUnifiedVisible(`${m.key}|creolabs`)
                const showDelta = m.layout === 'compare' && isUnifiedVisible(`${m.key}|delta`)
                if (!showCellx && !showCreolabs && !showDelta) return null
                return (
                  <React.Fragment key={`tot-${m.key}`}>
                    {showCellx ? (
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          ...(m.key === 'paymentsEver' ? paymentsDividerStyle : null),
                          ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                        }}
                        title={renderTitle(m, totalsRow.cellx[m.key])}
                      >
                        {renderValue(m, totalsRow.cellx[m.key])}
                      </td>
                    ) : null}
                    {showCreolabs ? (
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                        }}
                        title={renderTitle(m, totalsRow.creolabs[m.key])}
                      >
                        {renderValue(m, totalsRow.creolabs[m.key])}
                      </td>
                    ) : null}
                    {showDelta ? (
                      <td
                        style={{
                          textAlign: 'right',
                          ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                          ...deltaColumnCellStyle,
                        }}
                      >
                        {renderDeltaCell(m, totalsRow.delta[m.key])}
                      </td>
                    ) : null}
                  </React.Fragment>
                )
              })}
            </tr>
          ) : null}

          {showEmpty ? (
            <tr>
              <td
                colSpan={unifiedVisibleColumnsCount}
                style={{ textAlign: 'left', color: 'var(--muted)' }}
              >
                No affiliates found
              </td>
            </tr>
          ) : (
            visibleRows.map((r, idx) => {
              const label = affiliateDisplayLabel(
                r.affiliateId,
                affiliateIndexById,
                derivedAffiliateMaps?.idToName
              )
              const isFlagged = flaggedByRow.get(r.affiliateId)
              return (
                <tr
                  key={r.affiliateId}
                  style={isFlagged ? { outline: '1px solid rgba(249,115,22,0.16)' } : undefined}
                >
                  <td style={{ textAlign: 'left', fontWeight: 800 }}>{label}</td>
                  <td style={{ textAlign: 'right' }}>{idx + 1}</td>
                  {activeMetrics.map((m) => {
                    const showCellx = isUnifiedVisible(`${m.key}|cellx`)
                    const showCreolabs =
                      m.layout === 'compare' && isUnifiedVisible(`${m.key}|creolabs`)
                    const showDelta = m.layout === 'compare' && isUnifiedVisible(`${m.key}|delta`)
                    if (!showCellx && !showCreolabs && !showDelta) return null

                    return (
                      <React.Fragment key={`${r.affiliateId}-${m.key}`}>
                        {showCellx ? (
                          <td
                            style={{
                              textAlign: 'right',
                              ...(m.key === 'paymentsEver' ? paymentsDividerStyle : null),
                              ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                            }}
                            title={renderTitle(m, r.cellx?.[m.key])}
                          >
                            {renderValue(m, r.cellx?.[m.key])}
                          </td>
                        ) : null}
                        {showCreolabs ? (
                          <td
                            style={{
                              textAlign: 'right',
                              ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                            }}
                            title={renderTitle(m, r.creolabs?.[m.key])}
                          >
                            {renderValue(m, r.creolabs?.[m.key])}
                          </td>
                        ) : null}
                        {showDelta ? (
                          <td
                            style={{
                              textAlign: 'right',
                              ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                              ...deltaColumnCellStyle,
                            }}
                          >
                            {renderDeltaCell(m, r.delta?.[m.key])}
                          </td>
                        ) : null}
                      </React.Fragment>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </StickyMetricsTable>

      <div style={{ marginTop: 10, color: 'rgba(148,163,184,0.95)', fontSize: 12 }}>
        Delta is shown as percent difference (for comparable metrics).
      </div>
    </>
  )
}
