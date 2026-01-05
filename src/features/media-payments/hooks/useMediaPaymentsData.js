import { useCallback, useMemo } from 'react'
import { cleanNumber, cleanPercent } from '../../../lib/formatters'
import { monthMetaFromDate, parseMonthFirstDate, parseMonthLabel } from '../../../lib/csv'
import { useCsvData } from '../../shared/hooks/useCsvData'

const MEDIA_CANDIDATES = ['/Media Report.csv', '/01012025 to 12072025 Media Report.csv']
const PAYMENT_CANDIDATES = ['/Payments Report.csv', '/commissions.csv']

const pick = (row, keys, fallback = '') => {
  for (const k of keys) {
    if (!k) continue
    if (Object.prototype.hasOwnProperty.call(row, k) && row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k]
    }
  }
  return fallback
}

const parseMediaRow = (r) => {
  const monthMeta = parseMonthLabel(pick(r, ['Month', 'month']))
  const country = String(pick(r, ['Country', 'country', 'Country Code', 'country_code', 'countrycode'], '')).trim()
  const countryCode = String(pick(r, ['Country Code', 'country_code', 'countrycode', 'Country', 'country'], country || '')).trim()
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
  const rawDate = r.PaymentDate ?? r.paymentdate ?? r['Payment Date'] ?? r['payment_date'] ?? r['Commission Date'] ?? r['commission_date']
  const date = rawDate ? (typeof rawDate === 'string' ? parseMonthFirstDate(rawDate) : (rawDate instanceof Date ? rawDate : new Date(rawDate))) : null
  const monthMeta = date ? monthMetaFromDate(date) : { key: 'unknown', label: 'Unknown', monthIndex: -1, year: '—' }
  const affiliateId = (r['Affiliate Id'] ?? r.affiliate_id ?? r['affiliate_id'] ?? r.affiliateId ?? '').toString().trim()
  const affiliateName = (r.Affiliate ?? r['Affiliate'] ?? r.affiliate ?? r['affiliate'] ?? '').toString().trim() || '—'
  const rawAmount = r['Payment amount'] ?? r.payment_amount ?? r['payment_amount'] ?? r.amount ?? r.payment_amount
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
    type: (r['Payment Range'] ?? r['Commission Type'] ?? r['payment_range'] ?? '').toString().trim() || 'Other',
    details: (r.Details ?? r['Details'] ?? r.details ?? r.details_text ?? '').toString().trim(),
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
