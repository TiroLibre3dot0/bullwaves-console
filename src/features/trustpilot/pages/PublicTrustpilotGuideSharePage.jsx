import React, { useEffect, useMemo, useState } from 'react'
import FullPageLoader from '../../../components/FullPageLoader'
import LanguageSelect from '../../../components/LanguageSelect'
import TrustpilotGuidePage from './TrustpilotGuidePage'
import { useI18n } from '../../../i18n/I18nContext'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'
import { trackPublicShareOpen } from '../../../utils/analytics'

function isShareToken(value) {
  const clean = String(value || '').trim()
  return (clean.startsWith('share_') || clean.startsWith('share_local_')) && clean.length <= 96
}

export default function PublicTrustpilotGuideSharePage({ token = '' }) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)

  const cleanToken = useMemo(() => String(token || '').trim(), [token])

  useEffect(() => {
    setOpenGraphMeta({
      title: 'Trustpilot Guide - Public Share',
      description: 'Read-only Trustpilot operational guide.',
      image: '/Logo.png',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })
    return () => resetOpenGraphMeta()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError('')
        setPayload(null)

        if (!cleanToken || !isShareToken(cleanToken)) {
          throw new Error('Invalid or missing share token')
        }

        if (cleanToken.startsWith('share_local_')) {
          const raw = window.localStorage.getItem(`bw_share_trustpilot_guide:${cleanToken}`)
          const parsed = raw ? JSON.parse(raw) : null
          const localPayload = parsed?.payload
          if (!localPayload) throw new Error('Missing local share snapshot')
          if (!cancelled) setPayload(localPayload)
          return
        }

        const resp = await fetch(`/api/share/trustpilot-guide/${encodeURIComponent(cleanToken)}`)
        const data = await resp.json().catch(() => null)
        const remotePayload = data?.payload

        if (!resp.ok || !data?.ok || !remotePayload) {
          throw new Error(data?.error || data?.message || 'Failed to load share')
        }

        if (!cancelled) setPayload(remotePayload)
      } catch (e) {
        if (!cancelled) {
          setPayload(null)
          setError(e?.message || 'Unable to load public share')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [cleanToken])

  const isValid = payload && payload.k === 'tpguide' && payload.v === 1

  useEffect(() => {
    if (!isValid) return
    trackPublicShareOpen({
      kind: 'trustpilot-guide',
      token: cleanToken,
      generatedAt: payload?.generatedAt,
    })
  }, [isValid, cleanToken, payload])

  if (loading) {
    return <FullPageLoader progress={25} subtitle={t('common.loading')} />
  }

  if (!isValid) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', color: '#e2e8f0', padding: 24 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 950 }}>Trustpilot Guide</div>
            <LanguageSelect />
          </div>
          <div style={{ marginTop: 8, color: 'rgba(148,163,184,0.95)', fontWeight: 700 }}>
            {error || 'Invalid or expired public link'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b14' }}>
      <div style={{ width: '100%', padding: 'clamp(10px, 1.8vw, 24px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <img
            src="/Logo.png"
            alt="Bullwaves"
            style={{ height: 26, width: 'auto', display: 'block', opacity: 0.95 }}
          />
          <LanguageSelect />
        </div>
        <TrustpilotGuidePage publicMode sharePayload={payload} />
      </div>
    </div>
  )
}
