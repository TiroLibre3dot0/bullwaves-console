import { useEffect, useState } from 'react'
import { fetchFirstOkCsvRowsCached } from '../../../lib/fetchCache'

const MEDIA_CANDIDATES = ['/Media Report.csv', '/01012025 to 12072025 Media Report.csv']
const REGISTRATIONS_CANDIDATES = [
  '/Registrations Report.csv',
  '/01012023 to 01112026 Registrations Report.csv',
]

function toNumber(value) {
  return parseFloat(String(value || '').replace(/[^0-9\.-]/g, '')) || 0
}

function pickValue(row, keys) {
  for (const key of keys) {
    if (row && Object.prototype.hasOwnProperty.call(row, key)) return row[key]
  }
  return ''
}

export function computeUserBehaviorMetricsFromMediaRows(rows = []) {
  let uniqueVisitors = 0
  let visitors = 0
  let registrations = 0
  let deposits = 0
  let fts = 0
  let ftd = 0
  let qftd = 0

  ;(rows || []).forEach((row) => {
    uniqueVisitors +=
      toNumber(
        pickValue(row, [
          'Unique Visitors',
          'Unique_Visitors',
          'unique_visitors',
          'unique_visitors_count',
          'uniquevisitors',
        ])
      ) || 0

    visitors += toNumber(pickValue(row, ['Visitors', 'visitors'])) || 0

    registrations +=
      toNumber(
        pickValue(row, [
          'Registrations',
          'registrations',
          'registrazione',
          'registration_count',
          'Registration Count',
        ])
      ) || 0

    // User Behavior source (Media Report.csv) includes deposits as an amount (not a transaction count)
    deposits +=
      toNumber(pickValue(row, ['Deposits', 'deposits', 'total_deposits', 'Total Deposits'])) || 0

    fts +=
      toNumber(
        pickValue(row, [
          'FTS',
          'fts',
          'First Trade',
          'First Trades',
          'first_trade',
          'firsttrade',
          'FirstTrade',
          'FirstTradeCount',
          'First Trade Count',
        ])
      ) || 0

    ftd += toNumber(pickValue(row, ['FTD', 'ftd', 'First Time Deposit', 'FirstTimeDeposit'])) || 0
    qftd += toNumber(pickValue(row, ['QFTD', 'qftd', 'Qualified FTD', 'Qualified_FTD'])) || 0
  })

  return { uniqueVisitors, visitors, registrations, deposits, fts, ftd, qftd }
}

export function computeDepositsCountFromRegistrationsRows(rows = []) {
  let depositsCount = 0
  ;(rows || []).forEach((row) => {
    depositsCount +=
      toNumber(
        pickValue(row, [
          'deposit_count',
          'Deposit Count',
          'deposits_count',
          'Deposits Count',
          'num_deposits',
          'depositcount',
          'DepositCount',
        ])
      ) || 0
  })
  return depositsCount
}

export default function useUserBehaviorMetrics() {
  const [state, setState] = useState(() => ({
    loaded: false,
    loading: true,
    error: '',
    sourcePath: null,
    sourceRegistrationsPath: null,
    uniqueVisitors: 0,
    visitors: 0,
    registrations: 0,
    deposits: 0,
    depositsCount: 0,
    fts: 0,
    ftd: 0,
    qftd: 0,
  }))

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setState((prev) => ({ ...prev, loading: true, error: '' }))

        const { rows: mediaRows, sourcePath } = await fetchFirstOkCsvRowsCached(MEDIA_CANDIDATES)

        let regRows = []
        let regSourcePath = null
        try {
          const reg = await fetchFirstOkCsvRowsCached(REGISTRATIONS_CANDIDATES)
          regRows = reg?.rows || []
          regSourcePath = reg?.sourcePath || null
        } catch {
          // optional source
        }
        if (cancelled) return

        const metrics = computeUserBehaviorMetricsFromMediaRows(mediaRows)
        const depositsCount = computeDepositsCountFromRegistrationsRows(regRows)
        setState({
          loaded: true,
          loading: false,
          error: '',
          sourcePath,
          sourceRegistrationsPath: regSourcePath,
          uniqueVisitors: metrics.uniqueVisitors || 0,
          visitors: metrics.visitors || 0,
          registrations: metrics.registrations || 0,
          deposits: metrics.deposits || 0,
          depositsCount: depositsCount || 0,
          fts: metrics.fts || 0,
          ftd: metrics.ftd || 0,
          qftd: metrics.qftd || 0,
        })
      } catch (e) {
        if (cancelled) return
        setState((prev) => ({
          ...prev,
          loaded: true,
          loading: false,
          error: e?.message || 'failed-to-load-user-behavior-metrics',
          sourcePath: null,
          sourceRegistrationsPath: null,
          uniqueVisitors: 0,
          visitors: 0,
          registrations: 0,
          deposits: 0,
          depositsCount: 0,
          fts: 0,
          ftd: 0,
          qftd: 0,
        }))
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
