import React, { useEffect, useMemo, useState } from 'react'
import FlowsPage from '../FlowsPage'
import FullPageLoader from '../../../components/FullPageLoader'
import { useI18n } from '../../../i18n/I18nContext'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'

function isShareToken(value) {
  const clean = String(value || '').trim()
  return clean.startsWith('share_') || clean.startsWith('share_local_')
}

export default function PublicFlowsSharePage({ token }) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [payload, setPayload] = useState(null)

  const cleanToken = useMemo(() => String(token || '').trim(), [token])

  useEffect(() => {
    setOpenGraphMeta({
      title: 'Flows',
      description:
        'Vista pubblica read-only dei flussi (Registrazione, Navigazione, Retention, Email marketing).',
    })
    return () => resetOpenGraphMeta()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        setPayload(null)

        if (!cleanToken || !isShareToken(cleanToken)) {
          throw new Error('Link non valido')
        }

        // Dev-only local snapshot
        if (/^share_local_/i.test(cleanToken)) {
          const key = `bw_share_flows:${cleanToken}`
          const raw = window.localStorage.getItem(key)
          const parsed = raw ? JSON.parse(raw) : null
          const p = parsed?.payload
          if (!p) throw new Error('Link scaduto o non valido')
          if (!cancelled) setPayload(p)
          return
        }

        const resp = await fetch(`/api/share/flows/${encodeURIComponent(cleanToken)}`)
        const data = await resp.json().catch(() => null)
        if (!resp.ok || !data?.ok) {
          throw new Error(data?.error || data?.message || 'Link scaduto o non valido')
        }

        const p = data?.payload
        if (!p || p.k !== 'flows') {
          throw new Error('Link non valido')
        }

        if (!cancelled) setPayload(p)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Errore durante il caricamento')
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
    return <FullPageLoader progress={25} subtitle={t('common.loading')} />
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', color: '#e2e8f0', padding: 24 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ fontSize: 22, fontWeight: 950 }}>Flows</div>
          <div style={{ marginTop: 8, color: 'rgba(148,163,184,0.95)', fontWeight: 700 }}>
            {error}
          </div>
          <div
            style={{
              marginTop: 10,
              color: 'rgba(148,163,184,0.85)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Se ti serve un nuovo link, chiedi a chi gestisce la console di rigenerarlo.
          </div>
        </div>
      </div>
    )
  }

  // payload is currently used only as an access gate and for future-proofing.
  // The flows themselves are embedded in the client bundle.
  return (
    <div style={{ minHeight: '100vh', background: '#070b14' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(148,163,184,0.95)' }}>
            Public view
          </div>
          <div style={{ fontSize: 22, fontWeight: 950, color: '#fff' }}>Flows</div>
          <div
            style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: 'rgba(148,163,184,0.95)' }}
          >
            Vista read-only: puoi navigare tra i flussi, niente dashboard.
          </div>
        </div>

        <FlowsPage publicMode sharePayload={payload} />
      </div>
    </div>
  )
}
