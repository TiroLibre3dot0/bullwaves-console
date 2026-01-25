import React, { useEffect, useMemo, useState } from 'react'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import OrgChart from './pages/OrgChart'
import SummaryReport from './features/media-payments/pages/SummaryReport'
import Report from './features/media-payments/pages/Report'
import { useAuth } from './context/AuthContext'
import { trackEvent } from './services/trackingService'
import AdminPanel from './components/AdminPanel'
import RoadmapPage from './features/roadmap/pages/RoadmapPage'
import WeeklyMapPage from './features/roadmap/pages/WeeklyMapPage'
import WeeklyExecutionHistoryPage from './features/roadmap/pages/WeeklyExecutionHistoryPage'
import AffiliateHub from './features/affiliate/pages/AffiliateHub'
import ExecutiveSuite from './features/executive/pages/ExecutiveSuite'
import TraderPointsSimulatorPage from './features/traderPointsSimulator/TraderPointsSimulatorPage'
import ProfitAnalysisPage from './pages/ProfitAnalysisPage'
import CommentsAnalysisPage from './pages/CommentsAnalysisPage'
import SupportUserCheck from './features/support/pages/SupportUserCheck'
import FraudMonitoringDashboard from './components/FraudMonitoringDashboard'
import { DataStatusProvider } from './context/DataStatusContext'
import FullPageLoader from './components/FullPageLoader'
import UploadReportsPage from './pages/UploadReportsPage'
import { translate } from './i18n/translations'
import { useI18n } from './i18n/I18nContext'
import MarketingPlanExecutionPage from './features/marketing-plan/pages/MarketingPlanExecutionPage'
import CustomEventsPage from './features/analytics/pages/CustomEventsPage'

const FlowsPage = React.lazy(() => import('./features/flows/FlowsPage'))
const ProjectBoardPage = React.lazy(() => import('./features/project-board/ProjectBoardPage'))

export default function AuthenticatedApp() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isAdmin = user?.email?.toLowerCase() === 'paolo.v@bullwaves.com'
  const isSupportUser = (user?.department || '').trim().toLowerCase() === 'support team'
  const supportAllowedViews = useMemo(() => new Set(['supportUserCheck', 'orgChart', 'upload']), [])

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => setIsSidebarOpen((open) => !open)

  const routes = useMemo(
    () => ({
      cohort: '/',
      executive: '/executive',
      affiliate: '/affiliate',
      fraud: '/fraud-monitoring',
      flows: '/flows',
      marketingPlan: '/marketing-plan',
      projectBoard: '/project-board',
      orgChart: '/org-chart',
      overview: '/overview',
      report: '/report',
      roadmap: '/roadmap',
      weeklyMap: '/weekly-map',
      weeklyExecutionHistory: '/weekly-execution-history',
      analysis: '/analysis',
      traderPointsSimulator: '/lab/trader-points-simulator',
      // lab removed
      supportUserCheck: '/support/user-check',
      upload: '/upload',
      customEvents: '/custom-events',
    }),
    []
  )

  const pathToView = (pathname) => {
    if (!pathname || pathname === '/') return 'overview'
    if (pathname.startsWith('/overview')) return 'overview'
    if (pathname.startsWith('/profit-analysis')) return 'overview'
    if (pathname.startsWith('/flows')) return 'flows'
    if (pathname.startsWith('/project-board')) return 'projectBoard'
    if (
      pathname.startsWith('/executive') ||
      pathname.startsWith('/executive-summary') ||
      pathname.startsWith('/executive-view') ||
      pathname.startsWith('/global')
    )
      return 'executive'
    if (pathname.startsWith('/affiliate') || pathname.startsWith('/affiliate-analysis'))
      return 'affiliate'
    if (pathname.startsWith('/marketing-expenses')) return 'affiliate'
    if (pathname.startsWith('/investments')) return 'affiliate'
    if (pathname.startsWith('/fraud')) return 'fraud'
    if (pathname.startsWith('/analysis')) return 'analysis'
    if (pathname.startsWith('/report')) return 'report'
    if (pathname.startsWith('/cohort')) return 'affiliate'
    if (pathname.startsWith('/marketing-plan')) return 'marketingPlan'
    if (pathname.startsWith('/org-chart')) return 'orgChart'
    if (pathname.startsWith('/roadmap')) return 'roadmap'
    if (pathname.startsWith('/weekly-map')) return 'weeklyMap'
    if (pathname.startsWith('/weekly-execution-history')) return 'weeklyExecutionHistory'
    if (pathname.startsWith('/lab/trader-points-simulator')) return 'traderPointsSimulator'
    if (pathname.startsWith('/ongoing')) return 'roadmap'
    if (pathname.startsWith('/summary-report')) return 'summary'
    if (pathname.startsWith('/support')) return 'supportUserCheck'
    if (pathname.startsWith('/upload')) return 'upload'
    if (pathname.startsWith('/custom-events')) return 'customEvents'
    return 'overview'
  }

  const affiliateSectionFromPath = (pathname) => {
    if (pathname.startsWith('/marketing-expenses') || pathname.startsWith('/investments'))
      return 'payments'
    if (pathname.startsWith('/cohort')) return 'cohort'
    return 'analysis'
  }

  const [view, setView] = useState(() => pathToView(window.location.pathname))
  const [affiliateSection, setAffiliateSection] = useState(() =>
    affiliateSectionFromPath(window.location.pathname)
  )
  const [executiveSection, setExecutiveSection] = useState(() => {
    const p = window.location.pathname
    if (p.startsWith('/executive-summary') || p.startsWith('/global')) return 'summary'
    if (p.startsWith('/executive-view')) return 'view'
    return 'summary'
  })

  useEffect(() => {
    const onPop = () => {
      const nextPath = window.location.pathname
      if (isSupportUser) {
        if (nextPath.startsWith('/support/user-check')) {
          setView('supportUserCheck')
          return
        }
        if (nextPath.startsWith('/org-chart')) {
          setView('orgChart')
          return
        }
        if (nextPath.startsWith('/upload')) {
          setView('upload')
          return
        }

        window.history.replaceState({ view: 'supportUserCheck' }, '', '/support/user-check')
        setView('supportUserCheck')
        return
      }

      setView(pathToView(nextPath))
      setAffiliateSection(affiliateSectionFromPath(nextPath))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isSupportUser])

  useEffect(() => {
    if (!user) return
    if (!isSupportUser) return
    // Support landing page defaults to Support • User Check.
    const p = window.location.pathname
    if (!p.startsWith('/support/user-check')) {
      window.history.replaceState({ view: 'supportUserCheck' }, '', '/support/user-check')
    }
    setView('supportUserCheck')
  }, [user, isSupportUser])

  const goAffiliateSection = (section = 'analysis') => {
    if (isSupportUser) {
      navigate('supportUserCheck')
      return
    }
    const pathBySection = {
      analysis: '/affiliate-analysis',
      payments: '/marketing-expenses',
      cohort: '/cohort',
    }
    const nextPath = pathBySection[section] || '/affiliate'
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: 'affiliate', section }, '', nextPath)
    }
    setAffiliateSection(section)
    setView('affiliate')
  }

  const goExecutiveSection = (section = 'summary') => {
    if (isSupportUser) {
      navigate('supportUserCheck')
      return
    }
    const pathBySection = {
      summary: '/executive-summary',
      view: '/executive-view',
    }
    const nextPath = pathBySection[section] || '/executive'
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: 'executive', section }, '', nextPath)
    }
    setExecutiveSection(section)
    setView('executive')
  }

  const navigate = (nextView) => {
    setIsSidebarOpen(false)
    if (isSupportUser && !supportAllowedViews.has(nextView)) {
      nextView = 'supportUserCheck'
    }
    if (window.__bwUploadInProgress && nextView !== 'upload') {
      const locale =
        typeof window !== 'undefined' ? window.localStorage.getItem('bw-locale') || 'en' : 'en'
      const ok = window.confirm(translate(locale, 'app.uploadLeaveConfirm'))
      if (!ok) return
    }
    if (nextView === 'admin' && !isAdmin) {
      setView('overview')
      return
    }
    if (nextView === 'affiliate') {
      goAffiliateSection(affiliateSection || 'analysis')
      return
    }
    if (nextView === 'executive') {
      goExecutiveSection(executiveSection || 'summary')
      return
    }
    const nextPath = routes[nextView] || '/'
    if (nextView === 'admin') {
      setView('admin')
      return
    }
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: nextView }, '', nextPath)
    }
    setView(nextView)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 900px)')

    const EDGE_PX = 24
    const OPEN_DX = 60
    const CLOSE_DX = 70
    const HORIZONTAL_BIAS = 1.2

    let startX = 0
    let startY = 0
    let tracking = false
    let startedInEdge = false
    let startedInDrawer = false

    const reset = () => {
      tracking = false
      startedInEdge = false
      startedInDrawer = false
    }

    const onTouchStart = (e) => {
      if (!media.matches) return
      if (!e.touches || e.touches.length !== 1) return

      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      tracking = true

      startedInEdge = !isSidebarOpen && startX <= EDGE_PX

      const drawerWidth = Math.min(window.innerWidth * 0.86, 320)
      startedInDrawer = isSidebarOpen && startX <= drawerWidth + 12
    }

    const onTouchEnd = (e) => {
      if (!media.matches) return
      if (!tracking) return
      if (!e.changedTouches || e.changedTouches.length !== 1) {
        reset()
        return
      }

      const touch = e.changedTouches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY

      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      const isMostlyHorizontal = absDx > absDy * HORIZONTAL_BIAS

      if (isMostlyHorizontal) {
        if (!isSidebarOpen && startedInEdge && dx >= OPEN_DX) {
          setIsSidebarOpen(true)
        } else if (isSidebarOpen && startedInDrawer && dx <= -CLOSE_DX) {
          setIsSidebarOpen(false)
        }
      }

      reset()
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', reset, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', reset)
    }
  }, [isSidebarOpen])

  useEffect(() => {
    if (!user) return
    const viewToSection = {
      overview: 'overview',
      affiliate: 'affiliate',
      executive: 'executive',
      fraud: 'fraud-monitoring',
      marketingPlan: 'marketing-plan',
      projectBoard: 'project-board',
      summary: 'summary',
      roadmap: 'mega-stories',
      weeklyMap: 'weekly-map',
      weeklyExecutionHistory: 'weekly-execution-history',
      analysis: 'analysis',
      orgChart: 'org-chart',
      supportUserCheck: 'support-user-check',
      upload: 'upload',
      traderPointsSimulator: 'trader-points',
      admin: 'admin-panel',
    }
    const sectionId = viewToSection[view]
    if (!sectionId) return
    trackEvent({
      type: 'NAVIGATE',
      userEmail: user.email,
      userName: user.name,
      userRole: user.title || user.department,
      section: sectionId,
    })
  }, [view, user])

  return (
    <DataStatusProvider>
      <div className="app-root">
        <Topbar
          onAdminClick={() => navigate('admin')}
          showAdmin={isAdmin}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <div className={`dashboard-shell${isSidebarOpen ? ' sidebar-open' : ''}`}>
          {isSidebarOpen && (
            <div className="dashboard-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
          )}
          <aside className="dashboard-sidebar">
            <Sidebar
              view={view}
              executiveSection={executiveSection}
              affiliateSection={affiliateSection}
              supportOnly={isSupportUser}
              navigate={navigate}
              goExecutiveSection={goExecutiveSection}
              goAffiliateSection={goAffiliateSection}
            />
          </aside>

          <main className="dashboard-content">
            <div className="dashboard-inner">
              {view === 'overview' && <ProfitAnalysisPage />}
              {view === 'executive' && (
                <ExecutiveSuite section={executiveSection} onSectionChange={goExecutiveSection} />
              )}
              {view === 'affiliate' && (
                <AffiliateHub section={affiliateSection} onSectionChange={goAffiliateSection} />
              )}
              {view === 'fraud' && <FraudMonitoringDashboard />}
              {view === 'analysis' && <CommentsAnalysisPage />}
              {view === 'report' && <Report />}
              {view === 'roadmap' && <RoadmapPage />}
              {view === 'weeklyMap' && <WeeklyMapPage />}
              {view === 'weeklyExecutionHistory' && <WeeklyExecutionHistoryPage />}
              {view === 'marketingPlan' && <MarketingPlanExecutionPage />}
              {view === 'orgChart' && <OrgChart />}
              {view === 'summary' && <SummaryReport />}
              {view === 'supportUserCheck' && (
                <React.Suspense
                  fallback={<FullPageLoader progress={35} subtitle={t('support.loader.page')} />}
                >
                  <SupportUserCheck />
                </React.Suspense>
              )}
              {view === 'upload' && <UploadReportsPage />}
              {view === 'customEvents' && <CustomEventsPage />}
              {view === 'traderPointsSimulator' && <TraderPointsSimulatorPage />}
              {view === 'flows' && (
                <React.Suspense
                  fallback={<FullPageLoader progress={35} subtitle={t('support.loader.page')} />}
                >
                  <FlowsPage />
                </React.Suspense>
              )}
              {view === 'projectBoard' && (
                <React.Suspense
                  fallback={<FullPageLoader progress={35} subtitle={t('support.loader.page')} />}
                >
                  <ProjectBoardPage />
                </React.Suspense>
              )}
              {view === 'admin' && isAdmin && <AdminPanel />}
            </div>
          </main>
        </div>
      </div>
    </DataStatusProvider>
  )
}
