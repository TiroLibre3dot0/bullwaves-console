import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../i18n/I18nContext'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../../utils/ogMeta'
import FullPageLoader from '../../../components/FullPageLoader'
import WeeklyExecutionHistoryPage from './WeeklyExecutionHistoryPage'

export default function PublicWeeklyExecutionHistoryPage({ token }) {
  const { t } = useI18n()
  const [isValidToken, setIsValidToken] = useState(false)
  const [loading, setLoading] = useState(true)

  const storedToken = useMemo(() => {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem('bw_weekly_map_share_token')
      : null
  }, [])

  useEffect(() => {
    const validateToken = () => {
      if (storedToken && token === storedToken) {
        setIsValidToken(true)
      } else if (!storedToken) {
        // Same public-access behaviour as PublicWeeklyMapPage: allow if no token exists locally.
        setIsValidToken(true)
      }
      setLoading(false)
    }

    validateToken()
  }, [token, storedToken])

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

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const mapHref = `${origin}/share/weekly-map/${token}`
  const histHref = `${origin}/share/weekly-execution-history/${token}`

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

        <WeeklyExecutionHistoryPage />
      </div>
    </div>
  )
}
