import { fetchFirstOkCsvRowsCached } from '../../../lib/fetchCache'
import { safeCleanNumber } from '../../../lib/csv'

export type MarketingBaseline = {
  registrationsTotal: number
  depositUsersTotal: number
  depositCountTotal: number
  totalDepositsSum: number
  netDepositsSum: number
  lastExternalDate?: string
  sourcePath?: string | null
  depositRetentionM1Pct?: number | null
  depositRetentionM1Source?: string | null
}

export type MonthlyPoint = {
  key: string // YYYY-MM
  label: string
  registrations: number
  depositUsers: number
  depositCount: number
  totalDeposits: number
  netDeposits: number
}

function monthKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const mi = Math.max(0, (Number(m) || 1) - 1)
  return `${monthNames[mi]} ${y}`
}

function parseMaybeDate(raw: any): Date | null {
  if (!raw) return null
  const s = String(raw)
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d
  return null
}

function cleanNum(v: any): number {
  const n = safeCleanNumber(v)
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

export async function loadMarketingBaseline(): Promise<MarketingBaseline> {
  const { rows, sourcePath } = await fetchFirstOkCsvRowsCached(['/Registrations Report.csv'], {
    force: false,
  })

  const registrationsTotal = rows.length

  let depositUsersTotal = 0
  let depositCountTotal = 0
  let totalDepositsSum = 0
  let netDepositsSum = 0
  let lastExternalDate: string | undefined

  for (const r of rows) {
    const totalDeposits = cleanNum(r.total_deposits)
    const netDeposits = cleanNum(r.net_deposits)
    const depositCount = cleanNum(r.deposit_count)

    if (totalDeposits > 0 || netDeposits > 0 || depositCount > 0 || String(r.first_deposit || '').trim()) {
      depositUsersTotal += 1
    }

    depositCountTotal += depositCount
    totalDepositsSum += totalDeposits
    netDepositsSum += netDeposits

    const d = parseMaybeDate(r.external_date)
    if (d) {
      const iso = d.toISOString()
      if (!lastExternalDate || iso > lastExternalDate) lastExternalDate = iso
    }
  }

  // Cohort proxy for retention: Month1 / CohortSize on the latest cohort row
  let depositRetentionM1Pct: number | null = null
  let depositRetentionM1Source: string | null = null
  try {
    const cohort = await fetchFirstOkCsvRowsCached(
      ['/Cohort Analysis per churn analysis deposits count since 2024.csv'],
      { force: false }
    )
    if (cohort.rows.length) {
      const last = cohort.rows[cohort.rows.length - 1]
      const cohortSize = cleanNum(last['Cohort Size'] ?? last['"Cohort Size"'] ?? last.cohort_size)
      const m1 = cleanNum(last['Month 1'] ?? last['"Month 1"'] ?? last.month_1)
      if (cohortSize > 0) {
        depositRetentionM1Pct = (m1 / cohortSize) * 100
        depositRetentionM1Source = cohort.sourcePath
      }
    }
  } catch {
    // optional
  }

  return {
    registrationsTotal,
    depositUsersTotal,
    depositCountTotal,
    totalDepositsSum,
    netDepositsSum,
    lastExternalDate,
    sourcePath,
    depositRetentionM1Pct,
    depositRetentionM1Source,
  }
}

export async function loadMarketingMonthlySeries(): Promise<{ series: MonthlyPoint[]; sourcePath?: string | null }> {
  const { rows, sourcePath } = await fetchFirstOkCsvRowsCached(['/Registrations Report.csv'], {
    force: false,
  })

  const byMonth = new Map<string, MonthlyPoint>()

  for (const r of rows) {
    const d = parseMaybeDate(r.external_date) || parseMaybeDate(r.registration_date)
    if (!d) continue

    const key = monthKey(d)
    const existing = byMonth.get(key) || {
      key,
      label: monthLabel(key),
      registrations: 0,
      depositUsers: 0,
      depositCount: 0,
      totalDeposits: 0,
      netDeposits: 0,
    }

    existing.registrations += 1

    const totalDeposits = cleanNum(r.total_deposits)
    const netDeposits = cleanNum(r.net_deposits)
    const depositCount = cleanNum(r.deposit_count)

    if (totalDeposits > 0 || netDeposits > 0 || depositCount > 0 || String(r.first_deposit || '').trim()) {
      existing.depositUsers += 1
    }

    existing.depositCount += depositCount
    existing.totalDeposits += totalDeposits
    existing.netDeposits += netDeposits

    byMonth.set(key, existing)
  }

  const series = Array.from(byMonth.values()).sort((a, b) => a.key.localeCompare(b.key))
  return { series, sourcePath }
}

export async function computeActualsForLastDays(days: 30 | 60 | 90) {
  const { series } = await loadMarketingMonthlySeries()
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - days)

  // approximate using monthly buckets: include months whose midpoint is in range
  let usersActual = 0
  let depositsActual = 0
  let depositCountActual = 0

  for (const p of series) {
    const [y, m] = p.key.split('-').map((n) => Number(n))
    const mid = new Date(y, (m || 1) - 1, 15)
    if (mid >= start && mid <= now) {
      usersActual += p.registrations
      depositsActual += p.totalDeposits
      depositCountActual += p.depositCount
    }
  }

  return { usersActual, depositsActual, depositCountActual }
}
