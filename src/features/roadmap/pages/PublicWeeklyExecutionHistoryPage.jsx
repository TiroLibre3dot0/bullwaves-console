import React, { useEffect, useState } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'
import FullPageLoader from '../../../components/FullPageLoader'
import WeeklyExecutionHistoryPage from './WeeklyExecutionHistoryPage'
import { trackPublicShareOpen } from '../../../utils/analytics'

export default function PublicWeeklyExecutionHistoryPage({ token }) {
  const { t } = useI18n()
  const [isValidToken, setIsValidToken] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [historyStore, setHistoryStore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setLoadError('')
        setIsValidToken(false)

        const clean = String(token || '').trim()
        if (!clean) {
          setLoading(false)
          return
        }

        if (/^share_local_/i.test(clean)) {
          const raw = window.localStorage.getItem(`bw_share_weekly_map:${clean}`)
          const parsed = raw ? JSON.parse(raw) : null
          const p = parsed?.payload
          const h = p?.h
          if (!h) throw new Error('Missing local share snapshot')
          if (!cancelled) {
            setHistoryStore(h)
            setIsValidToken(true)
          }
          return
        }

        const resp = await fetch(`/api/share/weekly-execution-history/${encodeURIComponent(clean)}`)
        const data = await resp.json().catch(() => null)
        const payload = data?.payload
        const h = payload?.h
        if (!resp.ok || !data?.ok || !payload || !h) {
          throw new Error(data?.error || data?.message || 'Invalid or expired link')
        }

        if (!cancelled) {
          setHistoryStore(h)
          setIsValidToken(true)
        }
      } catch (e) {
        if (!cancelled) {
          setIsValidToken(false)
          setLoadError(e?.message || 'Invalid or expired link')
          setHistoryStore(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    setOpenGraphMeta({
      title: 'Weekly Execution History',
      description: 'Read-only log of planned vs completed work, week by week.',
      image: '/og-image-weekly-map.svg',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })

    return () => {
      resetOpenGraphMeta()
    }
  }, [])

  useEffect(() => {
    if (loading || !isValidToken) return
    trackPublicShareOpen({
      kind: 'weekly_execution_history',
      token,
      generatedAt: null,
    })
  }, [loading, isValidToken, token])

  if (loading) {
    return <FullPageLoader progress={40} subtitle={t('common.loading')} />
  }

  if (!isValidToken) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text)' }}>{t('common.accessDenied') || 'Access Denied'}</h2>
        <p style={{ color: 'var(--muted)', marginTop: 10 }}>
          {loadError || 'This share link is no longer valid.'}
        </p>
      </div>
    )
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const isLocal = /^share_local_/i.test(String(token || ''))
  const mapHref = isLocal
    ? `${origin}/share/weekly-map/${encodeURIComponent(token)}`
    : `${origin}/s/${encodeURIComponent(token)}`
  const histHref = isLocal
    ? `${origin}/share/weekly-execution-history/${encodeURIComponent(token)}`
    : `${origin}/s/${encodeURIComponent(token)}/h`

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn secondary" href={mapHref}>
            Weekly Map
          </a>
          <a className="btn" href={histHref}>
            Weekly Execution History
          </a>
        </div>

        <WeeklyExecutionHistoryPage storeOverride={historyStore} />
      </div>
    </div>
  )
}
