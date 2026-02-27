import React, { useMemo, useState } from 'react'

import {
  formatEuro,
  formatEuroFull,
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
  gap: 2,
  padding: '4px 6px',
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 800,
  lineHeight: 1.1,
  minWidth: 68,
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
  if (value == null || !Number.isFinite(Number(value))) return '—'
  if (metric.kind === 'eur') return formatEuro(Number(value) || 0)
  if (metric.kind === 'pl') return formatEuro(Number(value) || 0)
  if (metric.kind === 'roi') return formatPercentRounded((Number(value) || 0) * 100)
  return String(value)
}

function renderTitle(metric, value) {
  if (value == null || !Number.isFinite(Number(value))) return undefined
  if (metric.kind === 'eur') return formatEuroFull(Number(value) || 0)
  if (metric.kind === 'pl') return formatEuroFull(Number(value) || 0)
  if (metric.kind === 'roi') return formatPercent((Number(value) || 0) * 100, 4)
  return String(value)
}

function renderDeltaTitle(metric, deltaRec) {
  const { deltaPct, deltaPctIsNa } = deltaRec || {}
  if (deltaPctIsNa) return 'n/a'
  if (!Number.isFinite(Number(deltaPct))) return undefined

  // deltaPct is already in percent units.
  if (metric?.kind === 'roi') return formatPercent(Number(deltaPct) || 0, 4)
  return formatPercent(Number(deltaPct) || 0, 4)
}

function renderDeltaCell(metric, deltaRec) {
  const { deltaAbs, deltaPct, deltaPctIsNa } = deltaRec || {}
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
        minWidth: 62,
        opacity: 0.92,
      }}
    >
      <span style={{ fontWeight: 800 }}>{pctLine}</span>
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
}) {
  const [focusDiscrepancies, setFocusDiscrepancies] = useState(false)
  // Default to a practical “biggest affiliates first” ordering.
  const [sort, setSort] = useState({ key: 'size', dir: 'desc' })

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
    let latest = null
    let latestScore = -Infinity
    const all = [...(cellxScopedRows || []), ...(creolabsScopedRows || [])]
    all.forEach((row) => {
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
    ],
    [monthRef]
  )

  const compareMetricKeys = useMemo(
    () => activeMetrics.filter((m) => m.layout === 'compare').map((m) => m.key),
    [activeMetrics]
  )

  const totalMetricColumns = useMemo(
    () => activeMetrics.reduce((acc, m) => acc + (m.layout === 'compare' ? 3 : 1), 0),
    [activeMetrics]
  )

  const cellxMetricsByAffiliate = useMemo(() => {
    const latest = buildLatestByAffiliate(cellxMonthScopedRows, canonicalizeAffiliateId)
    const ever = buildAllTimeByAffiliate(cellxAllTimeLedger?.ledger || [], canonicalizeAffiliateId)
    return normalizeMetricMaps({ latestByAffiliate: latest, allTimeByAffiliate: ever })
  }, [cellxMonthScopedRows, cellxAllTimeLedger, canonicalizeAffiliateId])

  const creolabsMetricsByAffiliate = useMemo(() => {
    const latest = buildLatestByAffiliate(creolabsMonthScopedRows, canonicalizeAffiliateId)
    const ever = buildAllTimeByAffiliate(
      creolabsAllTimeLedger?.ledger || [],
      canonicalizeAffiliateId
    )
    return normalizeMetricMaps({ latestByAffiliate: latest, allTimeByAffiliate: ever })
  }, [creolabsMonthScopedRows, creolabsAllTimeLedger, canonicalizeAffiliateId])

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

      next.delta.roiMonth = computeDelta(next.cellx.roiMonth, next.creolabs.roiMonth)
      next.delta.roiEver = computeDelta(next.cellx.roiEver, next.creolabs.roiEver)

      // Recompute discrepancy aggregates including ROI.
      let maxAbsDeltaPct = 0
      let hasNaPct = false
      for (const k of compareMetricKeys) {
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
    sumKeys.forEach((k) => {
      totals.cellx[k] = totalsFromRows(rowsForTotals, k, 'cellx')
      totals.creolabs[k] = totalsFromRows(rowsForTotals, k, 'creolabs')
    })

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

    return totals
  }, [merged, compareMetricKeys, focusDiscrepancies, flaggedByRow])

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
          Click a header to sort
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
            {activeMetrics.map((m) => (
              <th
                key={m.key}
                colSpan={m.layout === 'compare' ? 3 : 1}
                style={{
                  ...groupHeaderStyle,
                  ...(m.key === 'paymentsEver' ? paymentsDividerStyle : null),
                  ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                }}
                title={m.title}
                onClick={() => toggleSort(`${m.key}|${m.layout === 'compare' ? 'delta' : 'cellx'}`)}
              >
                {m.label}
              </th>
            ))}
          </tr>
          <tr>
            {activeMetrics.map((m) => {
              return (
                <React.Fragment key={`${m.key}-sub`}>
                  <th
                    style={{
                      ...subHeaderStyle,
                      ...(m.key === 'paymentsEver' ? paymentsDividerStyle : null),
                      ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                    }}
                    title="Sort by CellXpert"
                    onClick={() => toggleSort(`${m.key}|cellx`)}
                  >
                    CellXpert
                  </th>
                  {m.layout === 'compare' ? (
                    <>
                      <th
                        style={{
                          ...subHeaderStyle,
                          ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                        }}
                        title="Sort by Creolabs"
                        onClick={() => toggleSort(`${m.key}|creolabs`)}
                      >
                        Creolabs
                      </th>
                      <th
                        style={{
                          ...subHeaderStyle,
                          ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                        }}
                        title="Sort by Delta"
                        onClick={() => toggleSort(`${m.key}|delta`)}
                      >
                        Delta
                      </th>
                    </>
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
              {activeMetrics.map((m) => (
                <React.Fragment key={`tot-${m.key}`}>
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
                  {m.layout === 'compare' ? (
                    <>
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
                      <td
                        style={{
                          textAlign: 'right',
                          ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                        }}
                      >
                        {renderDeltaCell(m, totalsRow.delta[m.key])}
                      </td>
                    </>
                  ) : null}
                </React.Fragment>
              ))}
            </tr>
          ) : null}

          {showEmpty ? (
            <tr>
              <td
                colSpan={2 + totalMetricColumns}
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
                  {activeMetrics.map((m) => (
                    <React.Fragment key={`${r.affiliateId}-${m.key}`}>
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
                      {m.layout === 'compare' ? (
                        <>
                          <td
                            style={{
                              textAlign: 'right',
                              ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                            }}
                            title={renderTitle(m, r.creolabs?.[m.key])}
                          >
                            {renderValue(m, r.creolabs?.[m.key])}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              ...(m.key === 'netDepositsMonth' ? afterPaymentsStyle : null),
                            }}
                          >
                            {renderDeltaCell(m, r.delta?.[m.key])}
                          </td>
                        </>
                      ) : null}
                    </React.Fragment>
                  ))}
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
