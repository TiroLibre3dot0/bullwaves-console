import { useEffect, useMemo, useState } from 'react'

import { usePaymentsReport } from '../../media-payments/hooks/useMediaPaymentsData'
import { loadCellxAffiliateMonthTable } from '../services/cellxService'

export function useCellxInvestmentsData({ includePayments = true } = {}) {
  const [rows, setRows] = useState([])
  const [mediaSource, setMediaSource] = useState('/cellx_affiliate_month.json')
  const [loadingMedia, setLoadingMedia] = useState(true)
  const [errorMedia, setErrorMedia] = useState(null)

  const payments = usePaymentsReport({ enabled: includePayments })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingMedia(true)
      setErrorMedia(null)
      try {
        const table = await loadCellxAffiliateMonthTable({ force: false })
        const nextRows = Array.isArray(table?.rows) ? table.rows : []
        if (!cancelled) {
          setRows(nextRows)
          setMediaSource(table?.live ? 'cellxpert-admin-api' : table?.source || '/cellx_affiliate_month.json')
        }
      } catch (e) {
        if (!cancelled) {
          setRows([])
          setErrorMedia(e)
        }
      } finally {
        if (!cancelled) setLoadingMedia(false)
      }
    })()

    const onUpdated = () => {
      ;(async () => {
        try {
          const table = await loadCellxAffiliateMonthTable({ force: true })
          const nextRows = Array.isArray(table?.rows) ? table.rows : []
          if (!cancelled) {
            setRows(nextRows)
            setMediaSource(table?.live ? 'cellxpert-admin-api' : table?.source || '/cellx_affiliate_month.json')
          }
        } catch {
          // ignore
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
    // Shape the aggregated rows to match `useAffiliateLedger` expectations.
    // We keep both affiliateId and affiliateName so the ledger can key by id while search/display can use name.
    return (rows || []).map((r) => ({
      affiliateId: String(r?.affiliateId || '—').trim() || '—',
      affiliateName:
        String(r?.affiliateName || '').trim() || String(r?.affiliateId || '—').trim() || '—',
      affiliate:
        String(r?.affiliateName || '').trim() || String(r?.affiliateId || '—').trim() || '—',
      uid: String(r?.affiliateId || '').trim(),
      year: Number(r?.year),
      monthIndex: Number(r?.monthIndex),
      registrations: 0,
      ftd: 0,
      qftd: 0,
      netDeposits: Number(r?.netDeposits || 0) || 0,
      commission: Number(r?.commission || 0) || 0,
      pl: Number(r?.pl || 0) || 0,
      type: 'CellXpert',
      tier: undefined,
    }))
  }, [rows])

  const monthOptions = useMemo(() => {
    const map = new Map()
    mediaRows.forEach((r) => {
      const year = Number(r.year)
      const monthIdx = Number(r.monthIndex)
      if (!Number.isFinite(year) || !Number.isFinite(monthIdx) || monthIdx < 0) return
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
      map.set(key, key)
    })
    ;(payments.data || []).forEach((p) => map.set(p.monthKey, p.monthLabel))
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [mediaRows, payments.data])

  const affiliateOptions = useMemo(() => {
    const set = new Set()
    mediaRows.forEach((r) => set.add(r.affiliate))
    ;(payments.data || []).forEach((p) => set.add(p.affiliate))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [mediaRows, payments.data])

  return {
    mediaRows,
    payments: payments.data,
    loading: includePayments ? loadingMedia || payments.loading : loadingMedia,
    error: errorMedia || payments.error,
    mediaSource,
    paymentsSource: payments.sourcePath,
    monthOptions,
    affiliateOptions,
    reload: () => {
      try {
        payments.reload(true)
      } catch {
        // ignore
      }
    },
  }
}
