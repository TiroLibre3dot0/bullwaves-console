import React, { useEffect, useMemo } from 'react'
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
const ShareOrgChartPage = React.lazy(() => import('./pages/share/ShareOrgChartTrueTree'))
const BoardLoginPage = React.lazy(() => import('./pages/share/BoardLoginPage'))
const PublicMarketingPlanSharePage = React.lazy(
  () => import('./features/marketing-plan/pages/PublicMarketingPlanSharePage')
)
const PublicAffiliateAnalysisSharePage = React.lazy(
  () => import('./features/affiliate-analysis/pages/PublicAffiliateAnalysisSharePage')
)
const PublicFlowsSharePage = React.lazy(() => import('./features/flows/pages/PublicFlowsSharePage'))

export default function App() {
  const { t } = useI18n()

  // Ensure report CSV/JSON fetches always have a cache-busting version.
  // If localStorage gets cleared, requests fall back to unversioned URLs and
  // can appear to "revert" to older cached data (browser/CDN).
  useEffect(() => {
    let cancelled = false

    const coerceToMillis = (v) => {
      const s = String(v || '').trim()
      if (!s) return 0
      if (/^\d{10,}$/.test(s)) {
        const n = Number(s)
        return Number.isFinite(n) ? n : 0
      }
      const d = Date.parse(s)
      return Number.isFinite(d) ? d : 0
    }

    const syncFromMeta = async () => {
      try {
        if (typeof window === 'undefined' || !window.fetch) return
        const res = await fetch(`/reports_meta.json?ts=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const meta = await res.json()
        const metaGeneratedAt = String(meta?.generatedAt || '').trim()
        if (!metaGeneratedAt) return
        if (cancelled) return

        const metaMs = coerceToMillis(metaGeneratedAt)
        const current = String(window.localStorage.getItem('bw_reports_version') || '')
        const currentMs = coerceToMillis(current)

        // If the app has no version yet, or the deployment meta is newer than the current
        // version (common when updated CSVs are deployed without using the upload UI),
        // bump it to metaGeneratedAt.
        if (!current || (metaMs && (!currentMs || metaMs > currentMs + 1000))) {
          window.localStorage.setItem('bw_reports_version', metaGeneratedAt)
          window.dispatchEvent(new Event('bw-reports-updated'))
        }

        window.localStorage.setItem('bw_reports_meta_generatedAt', metaGeneratedAt)
      } catch {
        // ignore
      }
    }

    syncFromMeta()
    return () => {
      cancelled = true
    }
  }, [])

  const shareRoute = useMemo(() => {
    if (typeof window === 'undefined') return null
    const p = window.location.pathname
    if (p === '/share/login' || p.startsWith('/share/login/')) return 'board-login'
    if (p.startsWith('/share/org-chart')) return 'org-chart'
    if (p.startsWith('/share/support-botlist')) return 'support-botlist'
    if (p.startsWith('/share/weekly-map/')) return 'weekly-map'
    if (p.startsWith('/share/weekly-execution-history/')) return 'weekly-execution-history'
    if (p.startsWith('/share/marketing-plan/')) return 'marketing-plan'
    if (p.startsWith('/share/flows/')) return 'flows'
    if (p === '/share/affiliate-reports' || p.startsWith('/share/affiliate-reports/'))
      return 'affiliate-reports'
    if (p.startsWith('/share/affiliate-analysis/')) return 'affiliate-analysis'
    return null
  }, [])

  if (shareRoute === 'board-login') {
    return (
      <React.Suspense fallback={<FullPageLoader progress={20} subtitle={t('common.loading')} />}>
        <BoardLoginPage />
      </React.Suspense>
    )
  }

  if (shareRoute === 'org-chart') {
    return (
      <React.Suspense fallback={<FullPageLoader progress={20} subtitle={t('common.loading')} />}>
        <ShareOrgChartPage />
      </React.Suspense>
    )
  }

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

  if (shareRoute === 'marketing-plan') {
    const token = window.location.pathname.split('/').pop()
    return (
      <React.Suspense fallback={<FullPageLoader progress={20} subtitle={t('common.loading')} />}>
        <PublicMarketingPlanSharePage token={token} />
      </React.Suspense>
    )
  }

  if (shareRoute === 'flows') {
    const token = window.location.pathname.split('/').pop()
    return (
      <React.Suspense fallback={<FullPageLoader progress={20} subtitle={t('common.loading')} />}>
        <PublicFlowsSharePage token={token} />
      </React.Suspense>
    )
  }

  if (shareRoute === 'affiliate-reports') {
    const parts = window.location.pathname.split('/').filter(Boolean)
    // Patterns supported:
    // - /share/affiliate-reports                      (board overview, requires board login)
    // - /share/affiliate-reports/:affiliateId          (board affiliate report, requires board login)
    // - /share/affiliate-reports/:token               (legacy public share link)
    // - /share/affiliate-reports/:token/:affiliateId  (legacy public share link)
    const seg1 = parts[2] || ''
    const seg2 = parts[3] || ''
    const seg3 = parts[4] || ''

    const looksLikeToken = seg1.startsWith('share_') || seg1.startsWith('share_local_')
    const token = looksLikeToken ? seg1 : ''
    const affiliateId = looksLikeToken ? seg2 : seg1
    const period = looksLikeToken ? seg3 : ''
    return (
      <React.Suspense fallback={<FullPageLoader progress={20} subtitle={t('common.loading')} />}>
        <PublicAffiliateAnalysisSharePage
          token={token}
          affiliateId={affiliateId}
          period={period}
          boardMode={!looksLikeToken}
        />
      </React.Suspense>
    )
  }

  // Backward-compatible alias (older link format)
  if (shareRoute === 'affiliate-analysis') {
    const parts = window.location.pathname.split('/').filter(Boolean)
    const token = parts[2] || ''
    const affiliateId = parts[3] || ''
    return (
      <React.Suspense fallback={<FullPageLoader progress={20} subtitle={t('common.loading')} />}>
        <PublicAffiliateAnalysisSharePage
          token={token}
          affiliateId={affiliateId}
          period={'monthly'}
        />
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
