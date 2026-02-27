import { useEffect, useMemo, useState } from 'react'

import {
  loadCreolabsAffiliateMonthTable,
  loadCreolabsClientsTable,
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        // Prefer the much smaller affiliate-month artifact for dashboards.
        // Fall back to the full clients table if it's missing.
        let table = null
        try {
          table = await loadCreolabsAffiliateMonthTable({ force: false })
        } catch {
          table = await loadCreolabsClientsTable({ force: false })
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
            table = await loadCreolabsAffiliateMonthTable({ force: true })
          } catch {
            table = await loadCreolabsClientsTable({ force: true })
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
    }
  }, [])

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
        out.push({
          affiliate: affiliateId,
          year: parsed.year,
          monthIndex: parsed.monthIndex,
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
      const key = `${affiliateId}|${parsed.year}|${parsed.monthIndex}`

      if (!map.has(key)) {
        map.set(key, {
          affiliate: affiliateId,
          year: parsed.year,
          monthIndex: parsed.monthIndex,
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
