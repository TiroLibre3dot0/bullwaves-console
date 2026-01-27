import React, { useEffect, useState } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'
import WeeklyMapView from '../components/WeeklyMapView'
import { getPublicShareOrigin } from '../../../utils/publicShareOrigin'
import { getWeekRange } from '../utils/weeklyMapStore'
import FullPageLoader from '../../../components/FullPageLoader'
import { trackPublicShareOpen } from '../../../utils/analytics'

export default function PublicWeeklyMapPage({ token }) {
  const { t } = useI18n()
  const [weeklyMapStore, setWeeklyMapStore] = useState(null)
  const [isValidToken, setIsValidToken] = useState(false)
  const [loadError, setLoadError] = useState('')
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
          setWeeklyMapStore(null)
          setLoading(false)
          return
        }

        // Dev-only local snapshots
        if (/^share_local_/i.test(clean)) {
          const raw = window.localStorage.getItem(`bw_share_weekly_map:${clean}`)
          const parsed = raw ? JSON.parse(raw) : null
          const p = parsed?.payload
          const m = p?.m
          if (!m) throw new Error('Missing local share snapshot')
          if (!cancelled) {
            setWeeklyMapStore(m)
            setIsValidToken(true)
          }
          return
        }

        const resp = await fetch(`/api/share/weekly-map/${encodeURIComponent(clean)}`)
        const data = await resp.json().catch(() => null)
        const payload = data?.payload
        const m = payload?.m
        if (!resp.ok || !data?.ok || !payload || !m) {
          throw new Error(data?.error || data?.message || 'Invalid or expired link')
        }

        if (!cancelled) {
          setWeeklyMapStore(m)
          setIsValidToken(true)
        }
      } catch (e) {
        if (!cancelled) {
          setWeeklyMapStore(null)
          setIsValidToken(false)
          setLoadError(e?.message || 'Invalid or expired link')
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
    if (loading || !isValidToken) return
    trackPublicShareOpen({
      kind: 'weekly_map',
      token,
      generatedAt: null,
    })
  }, [loading, isValidToken, token])

  // Set Open Graph meta tags for link preview
  useEffect(() => {
    const current = getWeekRange(new Date())
    setOpenGraphMeta({
      title: 'Weekly Map — Team Execution Contract',
      description: `Week of ${current.week_start} → ${current.week_end}. Team commitments, mega-stories, and project governance.`,
      image: '/og-image-weekly-map.svg',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })

    // Cleanup: reset meta tags when component unmounts
    return () => {
      resetOpenGraphMeta()
    }
  }, [])

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

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {(() => {
          const origin = getPublicShareOrigin()
          const isLocal = /^share_local_/i.test(String(token || ''))
          const mapHref = isLocal
            ? `${origin}/share/weekly-map/${encodeURIComponent(token)}`
            : `${origin}/s/${encodeURIComponent(token)}`
          const histHref = isLocal
            ? `${origin}/share/weekly-execution-history/${encodeURIComponent(token)}`
            : `${origin}/s/${encodeURIComponent(token)}/h`
          return (
            <div style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a className="btn" href={mapHref}>
                Weekly Map
              </a>
              <a className="btn secondary" href={histHref}>
                Weekly Execution History
              </a>
            </div>
          )
        })()}

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: 'var(--text)', fontSize: 28, marginBottom: 4 }}>
            Weekly Map — Project Management
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            Read-only view: execution contract, tasks, and team commitments.
          </p>
        </div>
        <WeeklyMapView megaMap={weeklyMapStore} storyMap={weeklyMapStore} readOnly={true} />
      </div>
    </div>
  )
}
