import { useEffect, useMemo, useState } from 'react'

import CommissionValidationRulesPage from '../CommissionValidationRulesPage'

function isShareToken(value) {
  const clean = String(value || '').trim()
  return (clean.startsWith('share_') || clean.startsWith('share_local_')) && clean.length <= 96
}

export default function PublicCommissionValidationRulesSharePage({ token = '' }) {
  const cleanToken = useMemo(() => String(token || '').trim(), [token])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        if (!cleanToken || !isShareToken(cleanToken)) {
          throw new Error('Invalid or missing share token')
        }

        if (cleanToken.startsWith('share_local_')) {
          const raw = window.localStorage.getItem(
            `bw_share_commission_validation_rules:${cleanToken}`
          )
          const parsed = raw ? JSON.parse(raw) : null
          const localPayload = parsed?.payload
          if (!localPayload || localPayload.k !== 'comval') {
            throw new Error('Missing local share snapshot')
          }
          return
        }

        const resp = await fetch(
          `/api/share/commission-validation-rules/${encodeURIComponent(cleanToken)}`
        )
        const data = await resp.json().catch(() => null)
        const payload = data?.payload

        if (!resp.ok || !data?.ok || !payload || payload.k !== 'comval') {
          throw new Error(data?.error || data?.message || 'Unable to load public share')
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Unable to load public share')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [cleanToken])

  if (loading) {
    return (
      <div
        className="page-shell"
        style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}
      >
        <div className="card-block" style={{ width: 'min(560px, 100%)' }}>
          Loading public compliance snapshot...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="page-shell"
        style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}
      >
        <div
          className="card-block"
          style={{ width: 'min(560px, 100%)', border: '1px solid rgba(248,113,113,0.4)' }}
        >
          {error}
        </div>
      </div>
    )
  }

  return <CommissionValidationRulesPage publicMode />
}
