import { useMemo } from 'react'
import { cleanNumber } from '../../../lib/formatters'

const toKey = (year, monthIndex) => `${year}-${String(Number(monthIndex) + 1).padStart(2, '0')}`
const monthLabel = (year, monthIndex) => {
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const idx = Number(monthIndex)
  if (!Number.isFinite(idx) || idx < 0 || idx > 11) return 'Unknown'
  return `${names[idx]} ${year}`
}

// Mock negotiated CPA per affiliate until real data source is provided.
const fallbackNegotiatedCpa = 400

const commissionValue = (row) => {
  return cleanNumber(row.commission)
}

export function useAffiliateLedger({ mediaRows = [], payments = [], selectedYear = 'all', selectedMonth = 'all', search = '', negotiatedCpaOverrides = {} }) {
  return useMemo(() => {
    // Build monthly history per affiliate to derive dynamic CPA defaults from last 5 months.
    const monthlyHistory = new Map()
    mediaRows.forEach((m) => {
      const aff = m.affiliate || '—'
      const yearVal = Number(m.year)
      const monthVal = Number(m.monthIndex)
      if (!Number.isFinite(yearVal) || !Number.isFinite(monthVal)) return
      const ymKey = yearVal * 12 + monthVal
      if (!monthlyHistory.has(aff)) monthlyHistory.set(aff, new Map())
      const affMap = monthlyHistory.get(aff)
      if (!affMap.has(ymKey)) affMap.set(ymKey, { qftd: 0, commission: 0 })
      const rec = affMap.get(ymKey)
      rec.qftd += cleanNumber(m.qftd)
      rec.commission += commissionValue(m)
    })

    const getAvgCpaLast5Months = (affiliate, year, monthIndex) => {
      const aff = affiliate || '—'
      const yearVal = Number(year)
      const monthVal = Number(monthIndex)
      if (!monthlyHistory.has(aff) || !Number.isFinite(yearVal) || !Number.isFinite(monthVal)) return null
      const cutoff = yearVal * 12 + monthVal
      const entries = Array.from(monthlyHistory.get(aff).entries())
        .filter(([ym]) => ym < cutoff)
        .sort((a, b) => b[0] - a[0])
        .slice(0, 5)
        .map(([, val]) => (val.qftd > 0 ? val.commission / val.qftd : null))
        .filter((v) => Number.isFinite(v) && v > 0)
      if (!entries.length) return null
      return entries.reduce((a, b) => a + b, 0) / entries.length
    }

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
        const override = negotiatedCpaOverrides[affiliate] ?? negotiatedCpaOverrides[affiliate || '—']
        const historicalAvg = getAvgCpaLast5Months(affiliate, year, monthIndex)
        const negotiatedCpa = Number(override) > 0
          ? Number(override)
          : (Number.isFinite(historicalAvg) && historicalAvg > 0 ? historicalAvg : fallbackNegotiatedCpa)
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
          commissionTotal: 0,
          pl: 0,
          roi: 0,
          negotiatedCpa,
          marketingExpected: 0,
          marketingActual: 0,
          marketingPayable: 0,
          marketingDeferred: 0,
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
      acc.commissionTotal += commissionValue(m)
      acc.pl += cleanNumber(m.pl)
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
      const roiValue = entry.commissionTotal > 0 ? (entry.netDeposits / Math.max(entry.commissionTotal, 1)) : 0
      entry.roi = roiValue

      // Use the commission reported in Media Report as the expected amount.
      entry.marketingExpected = entry.commissionTotal
      const marketingActual = roiValue >= 1.5 ? entry.marketingExpected : (entry.netDeposits / 1.5)
      entry.marketingActual = marketingActual
      entry.marketingPayable = Math.min(entry.marketingExpected, marketingActual)
      entry.marketingDeferred = Math.max(entry.marketingExpected - entry.marketingPayable, 0)
      if (entry.paidAmount >= entry.marketingPayable) {
        entry.status = 'PAID'
      } else if (entry.marketingDeferred > 0 && entry.paidAmount < entry.marketingPayable) {
        entry.status = 'PARTIALLY_DEFERRED'
      } else if (entry.marketingPayable > entry.paidAmount) {
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
        totalPl: 0,
        currentMonthCommission: 0,
        lastMonth: null,
        lastStatus: 'OK',
      })
      const s = summaryMap.get(key)
      s.totalQftd += row.qftd
      s.totalPaid += row.paidAmount
      s.totalDeferred += row.marketingDeferred
      s.totalPl += row.pl
      // Track commission maturing in the latest month in scope for this affiliate
      if (!s.lastMonth || row.month > s.lastMonth) {
        s.lastMonth = row.month
        s.currentMonthCommission = row.commissionTotal
      }
      if (!s.lastMonth || row.month > s.lastMonth) s.lastMonth = row.month
      if (row.marketingDeferred > 0) s.lastStatus = 'Deferred'
      if (row.status === 'ON_HOLD') s.lastStatus = 'ON_HOLD'
    })

    const affiliateSummaries = Array.from(summaryMap.values()).sort((a, b) => (b.totalPaid || 0) - (a.totalPaid || 0))

    const totalCurrentMonthCommission = affiliateSummaries.reduce((acc, s) => acc + (s.currentMonthCommission || 0), 0)

    const totals = ledger.reduce((acc, r) => {
      acc.totalQftd += r.qftd
      acc.totalMarketingExpected += r.marketingExpected
      acc.totalMarketingActual += r.marketingActual
      acc.totalMarketingPayable += r.marketingPayable
      acc.totalMarketingDeferred += r.marketingDeferred
      acc.totalPaid += r.paidAmount
      acc.totalNetDeposits += r.netDeposits
      acc.totalCommission += r.commissionTotal
      acc.totalPl += r.pl
      return acc
    }, { totalQftd: 0, totalMarketingExpected: 0, totalMarketingActual: 0, totalMarketingPayable: 0, totalMarketingDeferred: 0, totalPaid: 0, totalNetDeposits: 0, totalCommission: 0, totalPl: 0 })

    totals.totalCurrentMonthCommission = totalCurrentMonthCommission

    totals.avgCpa = totals.totalQftd > 0 ? totals.totalCommission / totals.totalQftd : 0
    totals.totalRoi = totals.totalCommission > 0 ? (totals.totalNetDeposits / totals.totalCommission) : 0

    const timeline = new Map()
    ledger.forEach((r) => {
      const key = `${r.year}-${String(r.monthIndex).padStart(2, '0')}`
      if (!timeline.has(key)) timeline.set(key, { key, label: monthLabel(r.year, r.monthIndex), paid: 0 })
      timeline.get(key).paid += r.paidAmount
    })
    const timelineSeries = Array.from(timeline.values()).sort((a, b) => a.key.localeCompare(b.key))

    return { ledger, affiliateSummaries, totals, timelineSeries }
  }, [mediaRows, payments, selectedMonth, selectedYear, search, negotiatedCpaOverrides])
}

export default useAffiliateLedger
