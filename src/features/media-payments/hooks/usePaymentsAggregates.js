import { useMemo } from 'react'

const cleanNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function usePaymentsAggregates({ payments = [], mediaRows = [], selectedYear = 'all', selectedMonth = 'all', selectedAffiliate = 'all' }) {
  const { availableYears, monthsByYear, filteredPayments, filteredMedia, totals, monthlyFlow, affiliateRows } = useMemo(() => {
    const yearSet = new Set()
    const monthsByYearMap = new Map()
    const addMonth = (year, monthIndex, monthLabel, monthKey) => {
      if (!Number.isFinite(Number(year))) return
      const y = Number(year)
      yearSet.add(y)
      if (!monthsByYearMap.has(y)) monthsByYearMap.set(y, new Map())
      const store = monthsByYearMap.get(y)
      store.set(monthIndex, { value: monthIndex, label: monthLabel || monthKey || `Month ${monthIndex + 1}` })
    }

    payments.forEach((p) => addMonth(p.year, p.monthIndex, p.monthLabel, p.monthKey))
    mediaRows.forEach((m) => addMonth(m.year, m.monthIndex, m.monthLabel, m.monthKey))

    const availableYearsArr = Array.from(yearSet.values()).sort((a, b) => a - b)

    const matchesPeriod = (row) => {
      const yearOk = selectedYear === 'all' ? true : Number(row.year) === Number(selectedYear)
      const monthOk = selectedMonth === 'all' ? true : Number(row.monthIndex) === Number(selectedMonth)
      const affOk = selectedAffiliate === 'all' ? true : row.affiliate === selectedAffiliate
      return yearOk && monthOk && affOk
    }

    const filteredPaymentsArr = payments.filter(matchesPeriod)
    const filteredMediaArr = mediaRows.filter(matchesPeriod)

    const totalsAcc = {
      totalPayments: 0,
      paymentsCount: 0,
      registrations: 0,
      ftd: 0,
      qftd: 0,
      netDeposits: 0,
      pl: 0,
    }

    filteredPaymentsArr.forEach((p) => {
      totalsAcc.totalPayments += cleanNumber(p.amount)
      totalsAcc.paymentsCount += 1
    })

    filteredMediaArr.forEach((m) => {
      totalsAcc.registrations += cleanNumber(m.registrations)
      totalsAcc.ftd += cleanNumber(m.ftd)
      totalsAcc.qftd += cleanNumber(m.qftd)
      totalsAcc.netDeposits += cleanNumber(m.netDeposits)
      totalsAcc.pl += cleanNumber(m.pl)
    })

    const totalsComputed = {
      ...totalsAcc,
      cpa: totalsAcc.ftd > 0 ? totalsAcc.totalPayments / totalsAcc.ftd : 0,
      payoutRatio: totalsAcc.netDeposits ? (totalsAcc.totalPayments / Math.max(Math.abs(totalsAcc.netDeposits), 1)) * 100 : 0,
    }

    const monthlyMap = new Map()
    const ensureMonth = (key, label, idx) => {
      if (!monthlyMap.has(key)) monthlyMap.set(key, { key, label: label || key || 'Unknown', monthIndex: idx ?? 99, payments: 0, netDeposits: 0 })
      return monthlyMap.get(key)
    }

    filteredPaymentsArr.forEach((p) => {
      const acc = ensureMonth(p.monthKey, p.monthLabel, p.monthIndex)
      acc.payments += cleanNumber(p.amount)
    })

    filteredMediaArr.forEach((m) => {
      const acc = ensureMonth(m.monthKey, m.monthLabel, m.monthIndex)
      acc.netDeposits += cleanNumber(m.netDeposits)
    })

    const monthlyFlowArr = Array.from(monthlyMap.values()).sort((a, b) => (a.monthIndex - b.monthIndex) || (a.key || '').localeCompare(b.key || ''))

    const affMap = new Map()
    const ensureAff = (name) => {
      const key = name || '—'
      if (!affMap.has(key)) affMap.set(key, { affiliate: key, registrations: 0, ftd: 0, qftd: 0, netDeposits: 0, pl: 0, totalPayments: 0, paymentsCount: 0 })
      return affMap.get(key)
    }

    filteredMediaArr.forEach((m) => {
      const acc = ensureAff(m.affiliate)
      acc.registrations += cleanNumber(m.registrations)
      acc.ftd += cleanNumber(m.ftd)
      acc.qftd += cleanNumber(m.qftd)
      acc.netDeposits += cleanNumber(m.netDeposits)
      acc.pl += cleanNumber(m.pl)
    })

    filteredPaymentsArr.forEach((p) => {
      const acc = ensureAff(p.affiliate)
      acc.totalPayments += cleanNumber(p.amount)
      acc.paymentsCount += 1
    })

    const affiliateRows = Array.from(affMap.values()).map((a) => ({
      ...a,
      cpa: a.ftd ? a.totalPayments / a.ftd : 0,
      payoutRatio: a.netDeposits ? (a.totalPayments / Math.max(Math.abs(a.netDeposits), 1)) * 100 : 0,
    }))
      .sort((a, b) => (b.totalPayments || 0) - (a.totalPayments || 0))

    const monthsByYearObj = {}
    monthsByYearMap.forEach((val, yr) => {
      monthsByYearObj[yr] = Array.from(val.values()).sort((a, b) => a.value - b.value)
    })

    return {
      availableYears: availableYearsArr,
      monthsByYear: monthsByYearObj,
      filteredPayments: filteredPaymentsArr,
      filteredMedia: filteredMediaArr,
      totals: totalsComputed,
      monthlyFlow: monthlyFlowArr,
      affiliateRows,
    }
  }, [payments, mediaRows, selectedMonth, selectedYear, selectedAffiliate])

  return { availableYears, monthsByYear, filteredPayments, filteredMedia, totals, monthlyFlow, affiliateRows }
}

export default usePaymentsAggregates
