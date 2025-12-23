import { useEffect, useState, useCallback } from 'react'
import { buildAffiliatePaymentsMap } from '../services/affiliatePaymentsService'

export default function useAffiliatePayments(opts = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [map, setMap] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const m = await buildAffiliatePaymentsMap(opts)
      setMap(m)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(opts)])

  useEffect(() => { load() }, [load])

  const getAffiliate = useCallback((idOrName) => {
    if (!map) return null
    if (map[idOrName]) return map[idOrName]
    // try case-insensitive name match
    const found = Object.values(map).find(r => (r.name || '').toString().toLowerCase() === (idOrName || '').toString().toLowerCase())
    return found || null
  }, [map])

  const exportCsv = useCallback((affiliateKey) => {
    const rec = affiliateKey ? map?.[affiliateKey] || getAffiliate(affiliateKey) : null
    const headers = ['affiliate','month','total','cpa','revshare','cpl','subaffiliate','other','paid']
    const rows = []
    if (rec) {
      for (const month of Object.keys(rec.months).sort()) {
        const m = rec.months[month]
        rows.push([rec.id, month, m.total||0, m.cpa||0, m.revshare||0, m.cpl||0, m.subaffiliate||0, m.other||0, m.paid||0])
      }
    } else {
      for (const r of Object.values(map || {})) {
        for (const month of Object.keys(r.months)) {
          const m = r.months[month]
          rows.push([r.id, month, m.total||0, m.cpa||0, m.revshare||0, m.cpl||0, m.subaffiliate||0, m.other||0, m.paid||0])
        }
      }
    }
    const csv = [headers.join(','), ...rows.map(r => r.map(String).map(v => `"${v.replace(/"/g,'""')}"`).join(','))].join('\n')
    return csv
  }, [map, getAffiliate])

  return { loading, error, map, reload: load, getAffiliate, exportCsv }
}
