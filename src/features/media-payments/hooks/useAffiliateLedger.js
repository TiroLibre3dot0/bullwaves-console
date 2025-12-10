import { useMemo } from 'react'
import { cleanNumber } from '../../../lib/formatters'
import { calculatePayout } from '../utils/payoutLogic'

const toKey = (year, monthIndex) => `${year}-${String(Number(monthIndex) + 1).padStart(2, '0')}`
const monthLabel = (year, monthIndex) => {
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const idx = Number(monthIndex)
  if (!Number.isFinite(idx) || idx < 0 || idx > 11) return 'Unknown'
  return `${names[idx]} ${year}`
}

// Mock negotiated CPA per affiliate until real data source is provided.
const fallbackNegotiatedCpa = 400

export function useAffiliateLedger({ mediaRows = [], payments = [], selectedYear = 'all', selectedMonth = 'all', search = '' }) {
  return useMemo(() => {
    const matchesFilters = (row) => {
      const yearOk = selectedYear === 'all' ? true : Number(row.year) === Number(selectedYear)
      const monthOk = selectedMonth === 'all' ? true : Number(row.monthIndex) === Number(selectedMonth)
      const searchOk = search ? (row.affiliate || '').toLowerCase().includes(search.toLowerCase()) : true
      return yearOk && monthOk && searchOk
    }

    const filteredMedia = mediaRows.filter(matchesFilters)
    const filteredPayments = payments.filter(matchesFilters)

    const affMonth = new Map()
    const ensure = (affiliate, year, monthIndex) => {
      const key = `${affiliate || '—'}|${year}|${monthIndex}`
      if (!affMonth.has(key)) {
        const negotiatedCpa = fallbackNegotiatedCpa
        affMonth.set(key, {
          affiliateId: affiliate || '—',
          affiliateName: affiliate || '—',
          month: toKey(year, monthIndex),
          monthIndex: Number(monthIndex),
          year: Number(year),
          registrations: 0,
          ftd: 0,
          qftd: 0,
          netDeposits: 0,
          roi: 0,
          negotiatedCpa,
          cpaTheoretical: 0,
          cpaPayable: 0,
          cpaDeferred: 0,
          totalPayments: 0,
          numberOfPayments: 0,
          paidAmount: 0,
          paymentDate: undefined,
          status: 'TO_PAY',
        })
      }
      return affMonth.get(key)
    }

    filteredMedia.forEach((m) => {
      const acc = ensure(m.affiliate, m.year, m.monthIndex)
      acc.registrations += cleanNumber(m.registrations)
      acc.ftd += cleanNumber(m.ftd)
      acc.qftd += cleanNumber(m.qftd)
      acc.netDeposits += cleanNumber(m.netDeposits)
      acc.roi = Number(m.roi || acc.roi || 0)
      if (m.tier) acc.tier = m.tier
      if (!acc.type && m.type) acc.type = m.type
    })

    filteredPayments.forEach((p) => {
      const acc = ensure(p.affiliate, p.year, p.monthIndex)
      acc.totalPayments += cleanNumber(p.amount)
      acc.paidAmount += cleanNumber(p.amount)
      acc.numberOfPayments += 1
      if (p.date && !acc.paymentDate) acc.paymentDate = p.date?.toISOString?.().slice(0, 10)
      if (!acc.type && p.type) acc.type = p.type
    })

    affMonth.forEach((entry) => {
      const payout = calculatePayout({
        qftd: entry.qftd,
        negotiatedCpa: entry.negotiatedCpa,
        netDeposits: entry.netDeposits,
        roi: entry.roi,
      })
      entry.cpaTheoretical = payout.cpaTheoretical
      entry.cpaPayable = payout.cpaPayable
      entry.cpaDeferred = payout.cpaDeferred
      if (entry.paidAmount >= entry.cpaPayable) {
        entry.status = 'PAID'
      } else if (entry.cpaDeferred > 0 && entry.paidAmount < entry.cpaPayable) {
        entry.status = 'PARTIALLY_DEFERRED'
      } else if (entry.cpaPayable > entry.paidAmount) {
        entry.status = 'TO_PAY'
      }
    })

    const ledger = Array.from(affMonth.values()).sort((a, b) => (b.year - a.year) || (b.monthIndex - a.monthIndex))

    const summaryMap = new Map()
    ledger.forEach((row) => {
      const key = row.affiliateId
      if (!summaryMap.has(key)) summaryMap.set(key, {
        affiliateId: row.affiliateId,
        affiliateName: row.affiliateName,
        tier: row.tier,
        totalQftd: 0,
        totalPaid: 0,
        totalDeferred: 0,
        lastMonth: null,
        lastStatus: 'OK',
      })
      const s = summaryMap.get(key)
      s.totalQftd += row.qftd
      s.totalPaid += row.paidAmount
      s.totalDeferred += row.cpaDeferred
      if (!s.lastMonth || row.month > s.lastMonth) s.lastMonth = row.month
      if (row.cpaDeferred > 0) s.lastStatus = 'HAS_ARREARS'
      if (row.status === 'ON_HOLD') s.lastStatus = 'ON_HOLD'
    })

    const affiliateSummaries = Array.from(summaryMap.values()).sort((a, b) => (b.totalPaid || 0) - (a.totalPaid || 0))

    const totals = ledger.reduce((acc, r) => {
      acc.totalQftd += r.qftd
      acc.totalCpaTheoretical += r.cpaTheoretical
      acc.totalCpaPayable += r.cpaPayable
      acc.totalCpaDeferred += r.cpaDeferred
      acc.totalPaid += r.paidAmount
      return acc
    }, { totalQftd: 0, totalCpaTheoretical: 0, totalCpaPayable: 0, totalCpaDeferred: 0, totalPaid: 0 })

    const timeline = new Map()
    ledger.forEach((r) => {
      const key = `${r.year}-${String(r.monthIndex).padStart(2, '0')}`
      if (!timeline.has(key)) timeline.set(key, { key, label: monthLabel(r.year, r.monthIndex), paid: 0 })
      timeline.get(key).paid += r.paidAmount
    })
    const timelineSeries = Array.from(timeline.values()).sort((a, b) => a.key.localeCompare(b.key))

    return { ledger, affiliateSummaries, totals, timelineSeries }
  }, [mediaRows, payments, selectedMonth, selectedYear, search])
}

export default useAffiliateLedger
