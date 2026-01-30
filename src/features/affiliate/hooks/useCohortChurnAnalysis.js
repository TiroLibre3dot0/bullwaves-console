import { useMemo } from 'react'
import { cleanNumber, normalizeKey } from '../../../lib/formatters'
import { useCsvData } from '../../shared/hooks/useCsvData'

const COHORT_CANDIDATES_BY_METRIC = {
  netDeposits: ['/Cohort Analysis per churn analysis Net Depositis since 2024.csv'],
  deposits: ['/Cohort Analysis per churn analysis Deposits.csv'],
  depositsCount: ['/Cohort Analysis per churn analysis deposits count since 2024.csv'],
  withdrawals: ['/Cohort Analysis per churn analysis Withdrawals since 2024.csv'],
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const parseCohortDateString = (raw) => {
  if (!raw) return null
  const datePart = String(raw).split(/\s|T/)[0] || ''
  const parts = datePart.split('/').map((p) => Number(p))
  if (parts.length < 3) return null
  const [m, d, y] = parts // month-first
  const dt = new Date(y, (m || 1) - 1, d || 1)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const friendlyCohortLabel = (raw) => {
  if (!raw) return 'Cohort'
  const date = parseCohortDateString(raw)
  if (!date) return String(raw)
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

const getMonthKeys = (row) => {
  if (!row) return []
  return Object.keys(row)
    .filter((k) => /^Month\s+\d+$/i.test(k))
    .sort((a, b) => {
      const ai = Number((a.match(/\d+/) || [0])[0])
      const bi = Number((b.match(/\d+/) || [0])[0])
      return ai - bi
    })
}

export function useCohortChurnAnalysis(metric = 'netDeposits') {
  const candidates = COHORT_CANDIDATES_BY_METRIC[metric] || COHORT_CANDIDATES_BY_METRIC.netDeposits
  // IMPORTANT: do not pass an inline mapRow here (it changes every render and can cause
  // `useCsvData` to re-run its load effect indefinitely).
  const csv = useCsvData(candidates)

  const rows = useMemo(() => {
    const rawRows = Array.isArray(csv.data) ? csv.data : []
    return rawRows
      .map((row, idx) => {
        const rawDate = row['Cohort Date']
        const date = parseCohortDateString(rawDate)
        if (!date) return null

        const baseAbs = date.getFullYear() * 12 + date.getMonth()
        const affiliate = String(row['Affiliate'] ?? 'all').trim() || 'all'
        const affiliateKey = normalizeKey(affiliate)

        const monthKeys = getMonthKeys(row)
        const values = monthKeys.map((k) => {
          const n = cleanNumber(row[k])
          // withdrawals CSV can be negative; for cohort analysis treat as absolute outflow
          if (metric === 'withdrawals') return Math.abs(n)
          return n
        })

        return {
          id: `cohort-${baseAbs}-${affiliateKey || 'all'}-${idx}`,
          cohortLabel: friendlyCohortLabel(rawDate),
          cohortDateRaw: rawDate,
          cohortYear: date.getFullYear(),
          baseAbs,
          values,
          cohortSize: cleanNumber(row['Cohort Size']),
          affiliate,
          affiliateKey: affiliateKey || 'all',
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.baseAbs - b.baseAbs)
  }, [csv.data, metric])

  const cohortAbsRange = useMemo(() => {
    if (!rows.length) return null
    const minAbs = Math.min(...rows.map((r) => r.baseAbs))
    const maxAbs = Math.max(...rows.map((r) => r.baseAbs + (r.values?.length || 0) - 1))
    return { minAbs, maxAbs }
  }, [rows])

  return {
    rows,
    loading: csv.loading,
    error: csv.error,
    sourcePath: csv.sourcePath,
    reload: csv.reload,
    absRange: cohortAbsRange,
  }
}

export default useCohortChurnAnalysis
