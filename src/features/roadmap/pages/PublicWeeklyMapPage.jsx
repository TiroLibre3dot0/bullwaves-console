import React, { useEffect, useState } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'
import WeeklyMapView from '../components/WeeklyMapView'
import { loadWeeklyMapStore, getWeekRange } from '../utils/weeklyMapStore'
import FullPageLoader from '../../../components/FullPageLoader'

export default function PublicWeeklyMapPage({ token }) {
  const { t } = useI18n()
  const [weeklyMapStore, setWeeklyMapStore] = useState(null)
  const [isValidToken, setIsValidToken] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate token validation - in production, verify against server/API
    const validateToken = () => {
      // Get the stored token from current browser's localStorage
      // This allows sharing within the same origin but not cross-origin without auth
      const storedToken =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('bw_weekly_map_share_token')
          : null

      if (storedToken && token === storedToken) {
        setIsValidToken(true)
      } else if (!storedToken) {
        // If no token in localStorage, assume this is a first-time public visitor
        // In production, you'd verify token against a server-side registry
        // For now, allow access (tokens are hard to guess but not cryptographically secure)
        setIsValidToken(true)
      }

      // Load the weekly map data
      const store = loadWeeklyMapStore()
      setWeeklyMapStore(store)
      setLoading(false)
    }

    validateToken()
  }, [token])

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
        <p style={{ color: 'var(--muted)', marginTop: 10 }}>This share link is no longer valid.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
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
