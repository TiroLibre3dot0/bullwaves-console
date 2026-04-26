import { useEffect, useMemo, useState } from 'react'
import ExecutionHubPage from '../ExecutionHubPage'
import { decodeSharePayload } from '../../../utils/shareCodec'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'
import { trackPublicShareOpen } from '../../../utils/analytics'
import { useI18n } from '../../../i18n/I18nContext'
import LanguageSelect from '../../../components/LanguageSelect'

export default function PublicExecutionSharePage({ token }) {
  const { t, locale } = useI18n()
  const [payload, setPayload] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [activeTab, setActiveTab] = useState('commandCenter')

  const looksLikeToken = useMemo(() => {
    const t = String(token || '').trim()
    return (t.startsWith('share_') || t.startsWith('share_local_')) && t.length <= 96
  }, [token])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoadError(null)

        const t = String(token || '').trim()
        if (!t) {
          if (!cancelled) setPayload(null)
          return
        }

        if (looksLikeToken) {
          if (t.startsWith('share_local_')) {
            const raw = window.localStorage.getItem(`bw_share_execution:${t}`)
            const parsed = raw ? JSON.parse(raw) : null
            const p = parsed?.payload
            if (!p) throw new Error('Missing local share snapshot')
            if (!cancelled) setPayload(p)
            return
          }

          const resp = await fetch(`/api/share/execution/${encodeURIComponent(t)}`)
          const data = await resp.json().catch(() => null)
          const p = data?.payload
          if (!resp.ok || !data?.ok || !p)
            throw new Error(data?.error || data?.message || 'Failed to load share')
          if (!cancelled) setPayload(p)
          return
        }

        const decoded = decodeSharePayload(t)
        if (!cancelled) setPayload(decoded)
      } catch (e) {
        if (!cancelled) {
          setPayload(null)
          setLoadError(e?.message || 'Failed to load share')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token, looksLikeToken])

  useEffect(() => {
    setOpenGraphMeta({
      title: t('publicShare.execution.ogTitle'),
      description: t('publicShare.execution.ogDescription'),
      image: '/Logo.png',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })
    return () => resetOpenGraphMeta()
  }, [t])

  const isValid = payload && payload.v === 1 && payload.k === 'exec'

  useEffect(() => {
    if (!isValid) return

    const initialTab = String(payload?.activeTab || 'commandCenter')
    const allowed = new Set(['commandCenter', 'storiesKanban', 'projectBoard'])
    setActiveTab(allowed.has(initialTab) ? initialTab : 'commandCenter')

    trackPublicShareOpen({
      kind: 'execution',
      token,
      generatedAt: payload?.generatedAt,
    })
  }, [isValid, token, payload])

  if (!isValid) {
    return (
      <div style={{ minHeight: '100vh', background: '#111827', color: '#e2e8f0', padding: 24 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 950 }}>{t('publicShare.execution.title')}</div>
            <LanguageSelect />
          </div>
          <div style={{ marginTop: 8, color: 'rgba(148,163,184,0.95)', fontWeight: 700 }}>
            {loadError || t('publicShare.invalid')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111827' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: 'clamp(12px, 3vw, 16px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/Logo.png"
              alt="Bullwaves"
              style={{ height: 26, width: 'auto', display: 'block', opacity: 0.95 }}
            />
          </div>
          <LanguageSelect />
        </div>

        <div
          style={{
            marginBottom: 12,
            color: 'rgba(148,163,184,0.95)',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {t('publicShare.readOnlyGenerated', {
            date: payload.generatedAt ? new Date(payload.generatedAt).toLocaleString(locale) : '—',
          })}
        </div>

        <ExecutionHubPage
          publicMode
          activeTab={activeTab}
          onChangeTab={(t) => setActiveTab(t)}
          sharePayload={payload}
          showLanguageSelect={false}
        />
      </div>
    </div>
  )
}
