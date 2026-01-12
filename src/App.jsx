import React, { useMemo } from 'react'
import RequireAuth from './context/RequireAuth'
import FullPageLoader from './components/FullPageLoader'
import { useI18n } from './i18n/I18nContext'

const AuthenticatedApp = React.lazy(() => import('./AuthenticatedApp'))
const PublicSupportBotListPage = React.lazy(
  () => import('./features/support/pages/PublicSupportBotListPage')
)
const PublicWeeklyMapPage = React.lazy(() => import('./features/roadmap/pages/PublicWeeklyMapPage'))
const PublicWeeklyExecutionHistoryPage = React.lazy(
  () => import('./features/roadmap/pages/PublicWeeklyExecutionHistoryPage')
)

export default function App() {
  const { t } = useI18n()

  const shareRoute = useMemo(() => {
    if (typeof window === 'undefined') return null
    const p = window.location.pathname
    if (p.startsWith('/share/support-botlist')) return 'support-botlist'
    if (p.startsWith('/share/weekly-map/')) return 'weekly-map'
    if (p.startsWith('/share/weekly-execution-history/')) return 'weekly-execution-history'
    return null
  }, [])

  if (shareRoute === 'support-botlist') {
    return (
      <React.Suspense fallback={<FullPageLoader progress={20} subtitle={t('common.loading')} />}>
        <PublicSupportBotListPage />
      </React.Suspense>
    )
  }

  if (shareRoute === 'weekly-map') {
    const token = window.location.pathname.split('/').pop()
    return (
      <React.Suspense fallback={<FullPageLoader progress={20} subtitle={t('common.loading')} />}>
        <PublicWeeklyMapPage token={token} />
      </React.Suspense>
    )
  }

  if (shareRoute === 'weekly-execution-history') {
    const token = window.location.pathname.split('/').pop()
    return (
      <React.Suspense fallback={<FullPageLoader progress={20} subtitle={t('common.loading')} />}>
        <PublicWeeklyExecutionHistoryPage token={token} />
      </React.Suspense>
    )
  }

  return (
    <RequireAuth>
      <React.Suspense fallback={<FullPageLoader progress={25} subtitle={t('common.loading')} />}>
        <AuthenticatedApp />
      </React.Suspense>
    </RequireAuth>
  )
}
