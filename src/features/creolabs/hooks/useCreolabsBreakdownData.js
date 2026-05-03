import { useEffect, useMemo, useState } from 'react'
import { useQlikStatus } from '../../../context/QlikStatusContext'

import {
  isQlikApiUnavailableError,
  loadCreolabsQlikAffiliateMonth,
  loadCreolabsAffiliateMonthTable,
  loadCreolabsClientsTable,
  logCreolabsQlikFallbackBlocked,
  logCreolabsQlikFallbackUsed,
} from '../services/creolabsService'

const MONTH_MAP = {
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

function parseCreolabsPeriodId(periodId) {
  const s = String(periodId || '').trim()
  const m = s.match(/^(\d{4})[-\s]?([A-Za-z]{3,})/)
  if (!m) return null
  const year = Number(m[1])
  const monRaw = String(m[2] || '')
    .slice(0, 3)
    .toLowerCase()
  const monthIndex = MONTH_MAP[monRaw]
  if (!Number.isFinite(year) || monthIndex == null) return null
  return { year, monthIndex }
}

export function useCreolabsBreakdownData() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const { reportQlikSource } = useQlikStatus()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        // API-first: use Qlik month-level aggregate.
        // Fallback is exceptional-only (API unavailable), not for empty successful responses.
        let table = null
        try {
          const api = await loadCreolabsQlikAffiliateMonth({ force: false })
          const rowsFromApi = Array.isArray(api?.data?.affiliateMonth)
            ? api.data.affiliateMonth
            : []
          table = { rows: rowsFromApi }
          if (!cancelled) reportQlikSource('creolabs-breakdown', 'api')
        } catch (e) {
          if (!isQlikApiUnavailableError(e)) {
            logCreolabsQlikFallbackBlocked('affiliate/payments aggregate load', e)
            throw e
          }
          logCreolabsQlikFallbackUsed('affiliate/payments aggregate load', e)
          if (!cancelled) reportQlikSource('creolabs-breakdown', 'local')
          try {
            table = await loadCreolabsAffiliateMonthTable({ force: false })
          } catch {
            table = await loadCreolabsClientsTable({ force: false })
          }
        }

        const nextRows = Array.isArray(table?.rows) ? table.rows : []
        if (!cancelled) setRows(nextRows)
      } catch (e) {
        console.warn('Unable to load Creolabs clients table', e)
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const onUpdated = () => {
      // Reload on reports update.
      ;(async () => {
        try {
          let table = null
          try {
            const api = await loadCreolabsQlikAffiliateMonth({ force: true })
            const rowsFromApi = Array.isArray(api?.data?.affiliateMonth)
              ? api.data.affiliateMonth
              : []
            table = { rows: rowsFromApi }
            if (!cancelled) reportQlikSource('creolabs-breakdown', 'api')
          } catch (e) {
            if (!isQlikApiUnavailableError(e)) {
              logCreolabsQlikFallbackBlocked('affiliate/payments aggregate reload', e)
              throw e
            }
            logCreolabsQlikFallbackUsed('affiliate/payments aggregate reload', e)
            if (!cancelled) reportQlikSource('creolabs-breakdown', 'local')
            try {
              table = await loadCreolabsAffiliateMonthTable({ force: true })
            } catch {
              table = await loadCreolabsClientsTable({ force: true })
            }
          }

          const nextRows = Array.isArray(table?.rows) ? table.rows : []
          if (!cancelled) setRows(nextRows)
        } catch (e) {
          console.warn('Unable to reload Creolabs clients table', e)
        }
      })()
    }

    window.addEventListener('bw-reports-updated', onUpdated)
    return () => {
      cancelled = true
      window.removeEventListener('bw-reports-updated', onUpdated)
      reportQlikSource('creolabs-breakdown', null)
    }
  }, [reportQlikSource])

  const mediaRows = useMemo(() => {
    // Output matches the fields consumed by useAffiliateLedger.
    // IMPORTANT: Creolabs breakdown numbers can be trader-perspective.
    // Net deposits are already treated as company-side positive.
    // P&L is inverted for Bullwaves (company) viewpoint so colors and KPIs reflect broker economics.
    const BULLWAVES_PL_SIGN = -1

    // If we're loading the affiliate-month artifact, rows already represent one affiliate+period.
    // If we're loading the legacy clients table, we still need to aggregate.
    const looksAggregated =
      Array.isArray(rows) &&
      rows.length > 0 &&
      rows[0]?.clientId == null &&
      rows[0]?.clientLogin == null &&
      rows[0]?.clientName == null

    if (looksAggregated) {
      const out = []
      for (const r of rows) {
        const parsed = parseCreolabsPeriodId(r?.periodId)
        if (!parsed) continue
        const affiliateId = String(r?.affiliateId || '—').trim() || '—'
        const brand = String(r?.brand || '').trim()
        out.push({
          affiliate: affiliateId,
          year: parsed.year,
          monthIndex: parsed.monthIndex,
          brand,
          registrations: 0,
          ftd: 0,
          qftd: 0,
          netDeposits: Number(r?.net || 0) || 0,
          commission: Number(r?.commission || 0) || 0,
          pl: (Number(r?.pl || 0) || 0) * BULLWAVES_PL_SIGN,
          type: 'Creolabs',
          tier: undefined,
        })
      }
      return out
    }

    const map = new Map()
    for (const r of rows) {
      const parsed = parseCreolabsPeriodId(r?.periodId)
      if (!parsed) continue

      const affiliateId = String(r?.affiliateId || '—').trim() || '—'
      const brand = String(r?.brand || '').trim()
      const key = `${affiliateId}|${brand}|${parsed.year}|${parsed.monthIndex}`

      if (!map.has(key)) {
        map.set(key, {
          affiliate: affiliateId,
          year: parsed.year,
          monthIndex: parsed.monthIndex,
          brand,
          registrations: 0,
          ftd: 0,
          qftd: 0,
          netDeposits: 0,
          commission: 0,
          pl: 0,
          type: 'Creolabs',
          tier: undefined,
        })
      }

      const acc = map.get(key)
      acc.netDeposits += Number(r?.net || 0) || 0
      acc.pl += (Number(r?.pl || 0) || 0) * BULLWAVES_PL_SIGN
      acc.commission += Number(r?.commission || 0) || 0
    }

    return Array.from(map.values())
  }, [rows])

  return {
    // InvestmentsDashboard expects payments/mediaRows/loading.
    // Creolabs breakdown does not currently include payout transactions.
    payments: [],
    mediaRows,
    loading,
  }
}
