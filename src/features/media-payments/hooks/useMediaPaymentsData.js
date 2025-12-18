import { useCallback, useMemo } from 'react'
import { cleanNumber, cleanPercent } from '../../../lib/formatters'
import { monthMetaFromDate, parseMonthFirstDate, parseMonthLabel } from '../../../lib/csv'
import { useCsvData } from '../../shared/hooks/useCsvData'

const MEDIA_CANDIDATES = ['/Media Report.csv', '/01012025 to 12072025 Media Report.csv']
const PAYMENT_CANDIDATES = ['/Payments Report.csv', '/commissions.csv']

const parseMediaRow = (r) => {
  const monthMeta = parseMonthLabel(r.Month)
  const country = (r.Country || r['Country Code'] || r['Country'] || '').toString().trim()
  const countryCode = (r['Country Code'] || r.CountryCode || country || '').toString().trim()
  return {
    raw: r,
    monthKey: monthMeta.key,
    monthLabel: monthMeta.label,
    monthIndex: monthMeta.monthIndex,
    year: monthMeta.year,
    affiliate: (r.Affiliate || '—').toString().trim(),
    uid: (r.uid ?? '').toString().trim(),
    impressions: cleanNumber(r.Impressions),
    uniqueImpressions: cleanNumber(r['Unique Impressions']),
    ctr: cleanPercent(r.CTR),
    uniqueVisitors: cleanNumber(r['Unique Visitors']),
    visitors: cleanNumber(r.Visitors),
    leads: cleanNumber(r.Leads),
    registrations: cleanNumber(r.Registrations || r.Leads),
    conversionRate: cleanPercent(r['Conversion Rate']),
    ftd: cleanNumber(r.FTD),
    qftd: cleanNumber(r.QFTD),
    deposits: cleanNumber(r.Deposits),
    withdrawals: cleanNumber(r.Withdrawals || r['Withdrawals']),
    netDeposits: cleanNumber(r['Net Deposits']),
    firstDeposits: cleanNumber(r['First Deposits']),
    churnPct: cleanNumber(r['Churn %'] || r.Churn),
    spread: cleanNumber(r.Spread),
    lot: cleanNumber(r.LOT),
    volume: cleanNumber(r.Volume),
    pl: cleanNumber(r.PL),
    roi: cleanNumber(r.ROI),
    commission: cleanNumber(r.Commission),
    cpaCommission: cleanNumber(r['CPA Commission']),
    cplCommission: cleanNumber(r['CPL Commission']),
    revShareCommission: cleanNumber(r['RevShare Commission']),
    subCommission: cleanNumber(r['Sub Commission']),
    otherCommission: cleanNumber(r['Other Commission']),
    country,
    countryCode,
  }
}

const parsePaymentRow = (r) => {
  const date = r.PaymentDate ? parseMonthFirstDate(r.PaymentDate) : r['Commission Date'] ? new Date(r['Commission Date']) : null
  const monthMeta = date ? monthMetaFromDate(date) : { key: 'unknown', label: 'Unknown', monthIndex: -1, year: '—' }
  return {
    id: r.id,
    date,
    monthKey: monthMeta.key,
    monthLabel: monthMeta.label,
    monthIndex: monthMeta.monthIndex,
    year: monthMeta.year,
    affiliateId: (r['Affiliate Id'] ?? '').toString().trim(),
    affiliate: (r.Affiliate ?? r['Affiliate'] ?? '').toString().trim() || '—',
    amount: cleanNumber(r['Payment amount'] ?? r.amount),
    type: (r['Payment Range'] ?? r['Commission Type'] ?? '').toString().trim() || 'Other',
    details: (r.Details ?? r['Details'] ?? r.details ?? '').toString().trim(),
  }
}

export function useMediaReport() {
  return useCsvData(MEDIA_CANDIDATES, parseMediaRow)
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
