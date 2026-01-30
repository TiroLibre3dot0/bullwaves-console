import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { cleanNumber, cleanPercent } from '../../../lib/formatters'
import { monthMetaFromDate, parseMonthFirstDate, parseMonthLabel } from '../../../lib/csv'
import { withReportsVersion } from '../../../lib/fetchCache'
import { useCsvData } from '../../shared/hooks/useCsvData'

const MEDIA_CANDIDATES = ['/Media Report.csv', '/01012025 to 12072025 Media Report.csv']
const PAYMENT_CANDIDATES = ['/Payments Report.csv', '/commissions.csv']

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

const parseMediaRow = (r) => {
  const monthMeta = parseMonthLabel(pick(r, ['Month', 'month']))
  const country = String(
    pick(r, ['Country', 'country', 'Country Code', 'country_code', 'countrycode'], '')
  ).trim()
  const countryCode = String(
    pick(r, ['Country Code', 'country_code', 'countrycode', 'Country', 'country'], country || '')
  ).trim()
  return {
    raw: r,
    monthKey: monthMeta.key,
    monthLabel: monthMeta.label,
    monthIndex: monthMeta.monthIndex,
    year: monthMeta.year,
    affiliate: String(pick(r, ['Affiliate', 'affiliate'], '—')).trim(),
    uid: String(pick(r, ['uid', 'UID'], '')).trim(),
    impressions: cleanNumber(pick(r, ['Impressions', 'impressions'])),
    uniqueImpressions: cleanNumber(pick(r, ['Unique Impressions', 'unique_impressions'])),
    ctr: cleanPercent(pick(r, ['CTR', 'ctr'])),
    uniqueVisitors: cleanNumber(pick(r, ['Unique Visitors', 'unique_visitors'])),
    visitors: cleanNumber(pick(r, ['Visitors', 'visitors'])),
    leads: cleanNumber(pick(r, ['Leads', 'leads'])),
    registrations: cleanNumber(pick(r, ['Registrations', 'registrations', 'Leads', 'leads'])),
    conversionRate: cleanPercent(pick(r, ['Conversion Rate', 'conversion_rate'])),
    ftd: cleanNumber(pick(r, ['FTD', 'ftd'])),
    qftd: cleanNumber(pick(r, ['QFTD', 'qftd'])),
    deposits: cleanNumber(pick(r, ['Deposits', 'deposits'])),
    depositsCount: cleanNumber(
      pick(r, [
        'Deposits Count',
        'Deposits count',
        'Deposit Count',
        'deposit_count',
        'deposits_count',
        'num_deposits',
        'depositcount',
      ])
    ),
    withdrawals: cleanNumber(pick(r, ['Withdrawals', 'withdrawals'])),
    netDeposits: cleanNumber(pick(r, ['Net Deposits', 'net_deposits', 'netdeposits'])),
    firstDeposits: cleanNumber(pick(r, ['First Deposits', 'first_deposits'])),
    churnPct: cleanNumber(pick(r, ['Churn %', 'churn_pct', 'churn', 'Churn'])),
    spread: cleanNumber(pick(r, ['Spread', 'spread'])),
    lot: cleanNumber(pick(r, ['LOT', 'lot'])),
    volume: cleanNumber(pick(r, ['Volume', 'volume'])),
    pl: cleanNumber(pick(r, ['PL', 'pl'])),
    roi: cleanNumber(pick(r, ['ROI', 'roi'])),
    commission: cleanNumber(pick(r, ['Commission', 'commission'])),
    cpaCommission: cleanNumber(pick(r, ['CPA Commission', 'cpa_commission'])),
    cplCommission: cleanNumber(pick(r, ['CPL Commission', 'cpl_commission'])),
    revShareCommission: cleanNumber(pick(r, ['RevShare Commission', 'revshare_commission'])),
    subCommission: cleanNumber(pick(r, ['Sub Commission', 'sub_commission'])),
    otherCommission: cleanNumber(pick(r, ['Other Commission', 'other_commission'])),
    country,
    countryCode,
  }
}

const parsePaymentRow = (r) => {
  // accept multiple header name variants from different CSV exports
  const rawDate =
    r.PaymentDate ??
    r.paymentdate ??
    r['Payment Date'] ??
    r['payment_date'] ??
    r['Commission Date'] ??
    r['commission_date']
  const date = rawDate
    ? typeof rawDate === 'string'
      ? parseMonthFirstDate(rawDate)
      : rawDate instanceof Date
        ? rawDate
        : new Date(rawDate)
    : null
  const monthMeta = date
    ? monthMetaFromDate(date)
    : { key: 'unknown', label: 'Unknown', monthIndex: -1, year: '—' }
  const affiliateId = (
    r['Affiliate Id'] ??
    r.affiliate_id ??
    r['affiliate_id'] ??
    r.affiliateId ??
    ''
  )
    .toString()
    .trim()
  const affiliateName =
    (r.Affiliate ?? r['Affiliate'] ?? r.affiliate ?? r['affiliate'] ?? '').toString().trim() || '—'
  const rawAmount =
    r['Payment amount'] ?? r.payment_amount ?? r['payment_amount'] ?? r.amount ?? r.payment_amount
  return {
    id: r.id,
    date,
    monthKey: monthMeta.key,
    monthLabel: monthMeta.label,
    monthIndex: monthMeta.monthIndex,
    year: monthMeta.year,
    affiliateId,
    affiliate: affiliateName,
    amount: cleanNumber(rawAmount),
    type:
      (r['Payment Range'] ?? r['Commission Type'] ?? r['payment_range'] ?? '').toString().trim() ||
      'Other',
    details: (r.Details ?? r['Details'] ?? r.details ?? r.details_text ?? '').toString().trim(),
  }
}

export function useMediaReport() {
  return useCsvData(MEDIA_CANDIDATES, parseMediaRow)
}

function getReportsVersionKey() {
  try {
    return String(
      window?.localStorage?.getItem('bw_reports_version') ||
        window?.localStorage?.getItem('bw_reports_meta_generatedAt') ||
        ''
    )
  } catch {
    return ''
  }
}

function buildAbsoluteVersionedUrl(path) {
  const withV = withReportsVersion(path)
  const raw = String(withV || '')
  const encoded = encodeURI(raw)
  try {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      if (/^https?:\/\//i.test(encoded)) return encoded
      return new URL(encoded, window.location.origin).toString()
    }
  } catch {
    // fall through
  }
  return encoded
}

// Worker-based loader for Media Report.
// Use this when the CSV is large to avoid blocking the main thread.
export function useMediaReportWorker() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sourcePath, setSourcePath] = useState(null)
  const [versionKey, setVersionKey] = useState(() => getReportsVersionKey())
  const runIdRef = useRef(0)

  useEffect(() => {
    const sync = () => {
      const next = getReportsVersionKey()
      setVersionKey((prev) => (prev === next ? prev : next))
    }

    const onStorage = (e) => {
      if (!e || e.key === 'bw_reports_version') sync()
    }

    window.addEventListener('bw-reports-updated', sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('bw-reports-updated', sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const load = useCallback(
    (force = false) => {
      const runId = (runIdRef.current += 1)
      setLoading(true)
      setError(null)

      const tryCandidate = (idx) => {
        const rawPath = MEDIA_CANDIDATES[idx]
        if (!rawPath) {
          if (runIdRef.current === runId) {
            setData([])
            setSourcePath(null)
            setLoading(false)
          }
          return
        }

        const url = buildAbsoluteVersionedUrl(rawPath)

        Papa.parse(url, {
          download: true,
          worker: true,
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            if (runIdRef.current !== runId) return
            const rows = Array.isArray(res.data) ? res.data : []
            const mapped = rows.map(parseMediaRow)
            setData(mapped)
            setSourcePath(rawPath)
            setLoading(false)
          },
          error: (err) => {
            if (runIdRef.current !== runId) return
            // Try next candidate if download/parse fails.
            if (idx + 1 < MEDIA_CANDIDATES.length) {
              tryCandidate(idx + 1)
              return
            }
            setError(err)
            setData([])
            setSourcePath(null)
            setLoading(false)
          },
        })
      }

      // force is kept for API parity; versioned URL cache-busts anyway.
      void force
      tryCandidate(0)
    },
    [versionKey]
  )

  useEffect(() => {
    load(false)
  }, [load])

  return {
    data,
    loading,
    error,
    sourcePath,
    reload: load,
  }
}

function initTotalsMaps() {
  return {
    netDeposits: new Map(),
    deposits: new Map(),
    depositsCount: new Map(),
    withdrawals: new Map(),
  }
}

function sumMap(map, key, value) {
  const prev = map.get(key) || 0
  map.set(key, prev + value)
}

// Worker-based monthly totals aggregation for Media Report.
// This avoids keeping a huge `mediaRows` array in memory when we only need totals.
export function useMediaReportMonthlyTotalsWorker() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sourcePath, setSourcePath] = useState(null)

  const [versionKey, setVersionKey] = useState(() => getReportsVersionKey())
  const runIdRef = useRef(0)

  const [result, setResult] = useState(() => ({
    affiliates: [],
    years: [],
    absRange: null,
    totalsAll: initTotalsMaps(),
    totalsByAffiliate: new Map(),
  }))

  useEffect(() => {
    const sync = () => {
      const next = getReportsVersionKey()
      setVersionKey((prev) => (prev === next ? prev : next))
    }

    const onStorage = (e) => {
      if (!e || e.key === 'bw_reports_version') sync()
    }

    window.addEventListener('bw-reports-updated', sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('bw-reports-updated', sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const load = useCallback(() => {
    const runId = (runIdRef.current += 1)
    setLoading(true)
    setError(null)

    const tryCandidate = (idx) => {
      const rawPath = MEDIA_CANDIDATES[idx]
      if (!rawPath) {
        if (runIdRef.current === runId) {
          setResult({
            affiliates: [],
            years: [],
            absRange: null,
            totalsAll: initTotalsMaps(),
            totalsByAffiliate: new Map(),
          })
          setSourcePath(null)
          setLoading(false)
        }
        return
      }

      const url = buildAbsoluteVersionedUrl(rawPath)

      const totalsAll = initTotalsMaps()
      const totalsByAffiliate = new Map()
      const affiliateSet = new Set()
      const yearSet = new Set()
      let minAbs = null
      let maxAbs = null
      let rowCount = 0

      const getAffiliateTotals = (affiliateKey) => {
        if (!totalsByAffiliate.has(affiliateKey)) {
          totalsByAffiliate.set(affiliateKey, initTotalsMaps())
        }
        return totalsByAffiliate.get(affiliateKey)
      }

      Papa.parse(url, {
        download: true,
        worker: true,
        header: true,
        skipEmptyLines: true,
        step: (stepRes, parser) => {
          if (runIdRef.current !== runId) {
            try {
              parser.abort()
            } catch {
              // ignore
            }
            return
          }

          const raw = stepRes?.data
          if (!raw) return

          const row = parseMediaRow(raw)
          if (!row.monthKey) return

          rowCount += 1

          const affiliateKey =
            String(row.affiliate || '')
              .trim()
              .toLowerCase() || 'unknown'
          affiliateSet.add(affiliateKey)

          const y = Number(row.year)
          if (Number.isFinite(y)) yearSet.add(y)

          const abs = Number(row.year) * 12 + Number(row.monthIndex)
          if (Number.isFinite(abs)) {
            minAbs = minAbs === null ? abs : Math.min(minAbs, abs)
            maxAbs = maxAbs === null ? abs : Math.max(maxAbs, abs)
          }

          const monthKey = String(row.monthKey)
          const vNet = Number(row.netDeposits || 0)
          const vDep = Number(row.deposits || 0)
          const vDepCount = Number(row.depositsCount || 0)
          const vW = Number(row.withdrawals || 0)

          if (Number.isFinite(vNet)) sumMap(totalsAll.netDeposits, monthKey, vNet)
          if (Number.isFinite(vDep)) sumMap(totalsAll.deposits, monthKey, vDep)
          if (Number.isFinite(vDepCount)) sumMap(totalsAll.depositsCount, monthKey, vDepCount)
          if (Number.isFinite(vW)) sumMap(totalsAll.withdrawals, monthKey, vW)

          const affTotals = getAffiliateTotals(affiliateKey)
          if (Number.isFinite(vNet)) sumMap(affTotals.netDeposits, monthKey, vNet)
          if (Number.isFinite(vDep)) sumMap(affTotals.deposits, monthKey, vDep)
          if (Number.isFinite(vDepCount)) sumMap(affTotals.depositsCount, monthKey, vDepCount)
          if (Number.isFinite(vW)) sumMap(affTotals.withdrawals, monthKey, vW)
        },
        complete: (res) => {
          if (runIdRef.current !== runId) return

          const hadErrors = Array.isArray(res?.errors) && res.errors.length > 0
          if (rowCount === 0 && hadErrors) {
            if (idx + 1 < MEDIA_CANDIDATES.length) {
              tryCandidate(idx + 1)
              return
            }
            setError(new Error(String(res.errors?.[0]?.message || 'Failed to parse Media Report')))
            setResult({
              affiliates: [],
              years: [],
              absRange: null,
              totalsAll: initTotalsMaps(),
              totalsByAffiliate: new Map(),
            })
            setSourcePath(null)
            setLoading(false)
            return
          }

          setResult({
            affiliates: Array.from(affiliateSet).sort((a, b) => a.localeCompare(b)),
            years: Array.from(yearSet).sort((a, b) => a - b),
            absRange: minAbs === null || maxAbs === null ? null : { minAbs, maxAbs },
            totalsAll,
            totalsByAffiliate,
          })
          setSourcePath(rawPath)
          setLoading(false)
        },
        error: (err) => {
          if (runIdRef.current !== runId) return
          if (idx + 1 < MEDIA_CANDIDATES.length) {
            tryCandidate(idx + 1)
            return
          }
          setError(err)
          setResult({
            affiliates: [],
            years: [],
            absRange: null,
            totalsAll: initTotalsMaps(),
            totalsByAffiliate: new Map(),
          })
          setSourcePath(null)
          setLoading(false)
        },
      })
    }

    tryCandidate(0)
  }, [])

  useEffect(() => {
    void versionKey
    load()
  }, [load, versionKey])

  return {
    ...result,
    loading,
    error,
    sourcePath,
    reload: load,
  }
}

export function usePaymentsReport() {
  return useCsvData(PAYMENT_CANDIDATES, parsePaymentRow)
}

export function useMediaPaymentsData() {
  const media = useMediaReport()
  const payments = usePaymentsReport()

  const monthOptions = useMemo(() => {
    const map = new Map()
    media.data.forEach((r) => map.set(r.monthKey, r.monthLabel))
    payments.data.forEach((p) => map.set(p.monthKey, p.monthLabel))
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [media.data, payments.data])

  const affiliateOptions = useMemo(() => {
    const set = new Set()
    media.data.forEach((r) => set.add(r.affiliate))
    payments.data.forEach((p) => set.add(p.affiliate))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [media.data, payments.data])

  const reload = useCallback(() => {
    media.reload()
    payments.reload()
  }, [media, payments])

  return {
    mediaRows: media.data,
    payments: payments.data,
    loading: media.loading || payments.loading,
    error: media.error || payments.error,
    mediaSource: media.sourcePath,
    paymentsSource: payments.sourcePath,
    monthOptions,
    affiliateOptions,
    reload,
  }
}

export default useMediaPaymentsData
