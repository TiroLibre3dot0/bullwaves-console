import { Suspense, lazy, useEffect, useMemo, useState } from 'react'

import FullPageLoader from './components/FullPageLoader'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import { useAuth } from './context/AuthContext'
import { trackEvent } from './services/trackingService'
import {
  getAccessMode,
  getAllowedViewsForAccessMode,
  getDeniedViewForAccessMode,
  getLandingViewForAccessMode,
  isAdminEmail,
} from './lib/accessControl'

const OrgChart = lazy(() => import('./pages/OrgChart'))
const ExecutionHubPage = lazy(() => import('./features/execution/ExecutionHubPage'))
const FlowsPage = lazy(() => import('./features/flows/FlowsPage'))
const ExecutiveSuite = lazy(() => import('./features/executive/pages/ExecutiveSuite'))
const AffiliateHub = lazy(() => import('./features/affiliate/pages/AffiliateHub'))
const ProfitAnalysisPage = lazy(() => import('./pages/ProfitAnalysisPage'))
const CommentsAnalysisPage = lazy(() => import('./pages/CommentsAnalysisPage'))
const FraudMonitoringDashboard = lazy(() => import('./components/FraudMonitoringDashboard'))
const SupportUserCheck = lazy(() => import('./features/support/pages/SupportUserCheck'))
const BullwavesAIAssistantPage = lazy(
  () => import('./features/support/pages/BullwavesAIAssistantPage')
)
const TrustpilotGuidePage = lazy(() => import('./features/trustpilot/pages/TrustpilotGuidePage'))
const CustomEventsPage = lazy(() => import('./features/analytics/pages/CustomEventsPage'))
const UploadReportsPage = lazy(() => import('./pages/UploadReportsPage'))
const TraderPointsSimulatorPage = lazy(
  () => import('./features/traderPointsSimulator/TraderPointsSimulatorPage')
)
const PlatformUsageBillingPage = lazy(
  () => import('./features/platform-usage/pages/PlatformUsageBillingPage')
)
const FinanceToolOrganigramPage = lazy(
  () => import('./features/platform-usage/pages/FinanceToolOrganigramPage')
)
const NotionBoard = lazy(() => import('./features/notion/NotionBoard'))
const ProfitableRanking = lazy(() => import('./pages/Retention/ProfitableRanking'))
const SalesAgentsMonitor = lazy(() => import('./pages/Retention/SalesAgentsMonitor'))
const AllTemplatesPage = lazy(() => import('./features/sales/pages/AllTemplatesPage'))
const ConsoleHomePage = lazy(() => import('./pages/ConsoleHomePage'))
const PrimeChallengeWidgetPage = lazy(() => import('./pages/PrimeChallengeWidgetPage'))
const TradingCompetitionPage = lazy(() => import('./pages/TradingCompetitionPage'))
const CommissionValidationRulesPage = lazy(() => import('./pages/CommissionValidationRulesPage'))
const SalesMonitoringPage = lazy(() => import('./pages/SalesMonitoringPage'))
const AcuityLabPage = lazy(() => import('./features/acuity/pages/AcuityLabPage'))
const ExternalReportsHubPage = lazy(
  () => import('./features/reportsHub/pages/ExternalReportsHubPage')
)
const CreolabsPage = lazy(() => import('./features/creolabs/CreolabsPage'))
const CreolabsClientListsPage = lazy(
  () => import('./features/creolabs/pages/CreolabsClientListsPage')
)
const CreolabsDbLivePage = lazy(() => import('./features/creolabs/pages/CreolabsDbLivePage'))
const CreolabsReportPage = lazy(() => import('./features/creolabs/pages/CreolabsReportPage'))
const CreolabsTestEnvironment3Page = lazy(
  () => import('./features/creolabs/pages/CreolabsTestEnvironment3Page')
)
const BoardReportMailStudioPage = lazy(
  () => import('./features/board/pages/BoardReportMailStudioPage')
)
const AdminPanel = lazy(() => import('./components/AdminPanel'))
const AdminPasswordsPage = lazy(() => import('./pages/AdminPasswordsPage'))

// StoriesKanbanPage / ProjectBoardPage are lazy-loaded inside ExecutionHubPage

export default function AuthenticatedApp() {
  const [notionPillarFilter] = useState(null)

  const getIsMobile = () =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 900px)').matches
      : false

  const [isMobile, setIsMobile] = useState(() => getIsMobile())

  const [executiveSection, setExecutiveSection] = useState('summary')
  const pathToAffiliateSection = (pathname) => {
    if (!pathname || !pathname.startsWith('/affiliate')) return 'analysis'
    // Backward-compatible alias: old standalone Report Analysis URL
    if (pathname.startsWith('/analysis')) return 'clientsMoved'
    if (pathname.startsWith('/affiliate/cohort')) return 'cohort'
    if (pathname.startsWith('/affiliate/payments2')) return 'payments2'
    if (pathname.startsWith('/affiliate/payments')) return 'payments'
    if (pathname.startsWith('/affiliate/clients-moved')) return 'clientsMoved'
    if (pathname.startsWith('/affiliate/analysis')) return 'analysis'
    return 'analysis'
  }

  const affiliateSectionToPath = (section) => {
    if (section === 'cohort') return '/affiliate/cohort'
    if (section === 'payments') return '/affiliate/payments'
    if (section === 'payments2') return '/affiliate/payments2'
    if (section === 'clientsMoved') return '/affiliate/clients-moved'
    return '/affiliate'
  }

  const [affiliateSection, setAffiliateSection] = useState(() =>
    pathToAffiliateSection(window.location.pathname)
  )

  const { user } = useAuth()
  const normalizedEmail = user?.email?.toLowerCase() || ''
  const accessMode = getAccessMode(user)
  const isAdmin = accessMode === 'admin'
  const canAccessEmailMasterTemplate = Boolean(
    user?.isManagementTeam || isAdminEmail(normalizedEmail)
  )
  const isRestrictedUser = Boolean(['support', 'sales', 'trustpilotOnly'].includes(accessMode))
  const restrictedAllowedViews = useMemo(
    () => getAllowedViewsForAccessMode(accessMode),
    [accessMode]
  )
  const restrictedLandingView = getLandingViewForAccessMode(accessMode)
  const restrictedDeniedView = getDeniedViewForAccessMode(accessMode)

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      const saved = window.localStorage.getItem('ui.sidebarOpen')
      if (saved === 'true') return true
      if (saved === 'false') return false
    } catch {
      // ignore
    }
    return !getIsMobile()
  })
  const toggleSidebar = () => setIsSidebarOpen((open) => !open)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('ui.sidebarOpen', String(isSidebarOpen))
    } catch {
      // ignore
    }
  }, [isSidebarOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia) return
    const media = window.matchMedia('(max-width: 900px)')

    const onChange = (e) => setIsMobile(Boolean(e.matches))
    onChange(media)

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    }

    // Safari fallback
    if (typeof media.addListener === 'function') {
      media.addListener(onChange)
      return () => media.removeListener(onChange)
    }
  }, [])

  const routes = useMemo(
    () => ({
      home: '/home',
      commandCenter: '/command-center',
      storiesKanban: '/stories-kanban',
      projectBoard: '/project-board',
      overview: '/overview',
      flows: '/flows',
      executive: '/executive',
      affiliate: '/affiliate',
      traderPointsSimulator: '/trader-points',
      profitableRanking: '/retention/profitable-ranking',
      primeChallengeRanking: '/prime-challenge/ranking',
      primeChallengeWidget: '/prime-challenge/widget',
      tradingCompetition: '/trading-competition',
      commissionValidationRules: '/compliance/commission-validation-rules',
      salesMonitoring: '/sales/monitoring',
      segmentComposition: '/retention/segment-composition',
      salesAgentsMonitor: '/retention/sales-agents-monitor',
      emailMasterTemplate: '/retention/email-master-template',
      fraud: '/fraud',
      orgChart: '/org-chart',
      platformUsageBilling: '/platform-usage-billing',
      financeToolOrganigram: '/finance/tool-organigram',
      supportUserCheck: '/support/user-check',
      aiAssistant: '/support/ai-assistant',
      trustpilotGuide: '/trustpilot-guide',
      creolabs: '/creolabs',
      creolabsClientLists: '/creolabs/client-lists',
      creolabsDbLive: '/creolabs/db-live',
      creolabsReport: '/creolabs/report',
      creolabsTestEnvironment3: '/creolabs/test-environment-3-0',
      boardReportMailStudio: '/board/report-mail-studio',
      reportsHub: '/reports',
      acuity: '/acuity',
      customEvents: '/custom-events',
      upload: '/upload',
      notion: '/notion',
      admin: '/admin',
      adminPasswords: '/admin/passwords',
    }),
    []
  )

  const pathToView = (pathname) => {
    if (!pathname) return 'home'
    if (pathname.startsWith('/home')) return 'home'
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/command-center')) return 'commandCenter'
    if (pathname.startsWith('/stories-kanban')) return 'storiesKanban'
    if (pathname.startsWith('/project-board')) return 'projectBoard'
    if (pathname.startsWith('/roadmap')) return 'projectBoard'
    if (pathname.startsWith('/weekly-map')) return 'projectBoard'
    if (pathname.startsWith('/weekly-execution-history')) return 'projectBoard'
    if (pathname.startsWith('/overview')) return 'overview'
    if (pathname.startsWith('/flows')) return 'flows'
    if (pathname.startsWith('/executive')) return 'executive'
    if (pathname.startsWith('/analysis')) return 'affiliate'
    if (pathname.startsWith('/affiliate')) return 'affiliate'
    if (pathname.startsWith('/trader-points')) return 'traderPointsSimulator'
    // Ranking section removed: keep legacy URLs working.
    if (pathname.startsWith('/ranking')) return 'profitableRanking'
    if (pathname.startsWith('/retention/profitable-ranking')) return 'profitableRanking'
    if (pathname.startsWith('/prime-challenge/ranking')) return 'primeChallengeRanking'
    if (pathname.startsWith('/prime-challenge/widget')) return 'primeChallengeWidget'
    if (pathname.startsWith('/trading-competition')) return 'tradingCompetition'
    if (pathname.startsWith('/compliance/commission-validation-rules'))
      return 'commissionValidationRules'
    if (pathname.startsWith('/sales/monitoring')) return 'salesMonitoring'
    if (pathname.startsWith('/retention/segment-composition')) return 'segmentComposition'
    if (pathname.startsWith('/retention/sales-agents-monitor')) return 'salesAgentsMonitor'
    if (pathname.startsWith('/retention/email-master-template')) return 'emailMasterTemplate'
    if (pathname.startsWith('/fraud')) return 'fraud'
    if (pathname.startsWith('/org-chart')) return 'orgChart'
    if (pathname.startsWith('/platform-usage-billing')) return 'platformUsageBilling'
    if (pathname.startsWith('/finance/tool-organigram')) return 'financeToolOrganigram'
    if (pathname.startsWith('/support/user-check')) return 'supportUserCheck'
    if (pathname.startsWith('/support/ai-assistant')) return 'aiAssistant'
    if (pathname.startsWith('/trustpilot-guide')) return 'trustpilotGuide'
    if (pathname.startsWith('/creolabs/client-lists')) return 'creolabsClientLists'
    if (pathname.startsWith('/creolabs/report')) return 'creolabsReport'
    if (pathname.startsWith('/creolabs/test-environment-3-0')) return 'creolabsTestEnvironment3'
    if (pathname.startsWith('/creolabs/test-environment-2-0')) return 'creolabsDbLive'
    if (pathname.startsWith('/creolabs/test-environment')) return 'creolabsDbLive'
    if (pathname.startsWith('/creolabs/db-live')) return 'creolabsDbLive'
    if (pathname.startsWith('/creolabs')) return 'creolabs'
    if (pathname.startsWith('/board/report-mail-studio')) return 'boardReportMailStudio'
    if (pathname.startsWith('/reports')) return 'reportsHub'
    if (pathname.startsWith('/acuity')) return 'acuity'
    if (pathname.startsWith('/custom-events')) return 'customEvents'
    if (pathname.startsWith('/upload')) return 'upload'
    if (pathname.startsWith('/notion')) return 'notion'
    if (pathname.startsWith('/admin/passwords')) return 'adminPasswords'
    if (pathname.startsWith('/admin')) return 'admin'
    return 'commandCenter'
  }

  const [view, setView] = useState(() => pathToView(window.location.pathname))

  // Redirect removed section URLs to the active page.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = window.location.pathname
    if (p && p.startsWith('/ranking')) {
      window.history.replaceState({ view: 'profitableRanking' }, '', routes.profitableRanking)
      setView('profitableRanking')
    }
    if (p && p.startsWith('/marketing-plan')) {
      window.history.replaceState({ view: 'commandCenter' }, '', routes.commandCenter)
      setView('commandCenter')
    }
    if (p === '/creolabs') {
      window.history.replaceState({ view: 'creolabs' }, '', routes.creolabs)
      setView('creolabs')
    }
    if (
      p &&
      (p.startsWith('/creolabs/test-environment-2-0') || p.startsWith('/creolabs/test-environment'))
    ) {
      window.history.replaceState({ view: 'creolabsDbLive' }, '', routes.creolabsDbLive)
      setView('creolabsDbLive')
    }
    if (p && p.startsWith('/solitics')) {
      window.history.replaceState({ view: 'reportsHub' }, '', routes.reportsHub)
      setView('reportsHub')
    }
  }, [
    routes.commandCenter,
    routes.creolabs,
    routes.creolabsDbLive,
    routes.overview,
    routes.profitableRanking,
    routes.reportsHub,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!user) return

    // On each new console session (login or reopen), always land on Home once.
    // sessionStorage survives reloads but resets when the tab is closed.
    const key = 'bw-console-session-user'
    const email = String(user?.email || '').toLowerCase()
    const prev = window.sessionStorage ? window.sessionStorage.getItem(key) : ''
    const isNewSession = !prev || prev !== email

    if (window.sessionStorage) {
      try {
        window.sessionStorage.setItem(key, email)
      } catch {
        // ignore
      }
    }

    if (!isNewSession) return

    const nextPath = routes.home
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({ view: 'home' }, '', nextPath)
    }
    setView('home')
  }, [routes.home, user])

  useEffect(() => {
    // Keep legacy Weekly Map / History URLs working but route users to the Tasks Board.
    if (typeof window !== 'undefined') {
      const p = window.location.pathname
      if (
        p.startsWith('/roadmap') ||
        p.startsWith('/weekly-map') ||
        p.startsWith('/weekly-execution-history')
      ) {
        window.history.replaceState({ view: 'projectBoard' }, '', routes.projectBoard)
        setView('projectBoard')
      }
    }

    const onPop = () => {
      const nextPath = window.location.pathname
      if (isRestrictedUser) {
        if (
          restrictedAllowedViews?.has('supportUserCheck') &&
          nextPath.startsWith('/support/user-check')
        ) {
          setView('supportUserCheck')
          return
        }
        if (
          restrictedAllowedViews?.has('trustpilotGuide') &&
          nextPath.startsWith('/trustpilot-guide')
        ) {
          setView('trustpilotGuide')
          return
        }
        if (
          restrictedAllowedViews?.has('aiAssistant') &&
          nextPath.startsWith('/support/ai-assistant')
        ) {
          setView('aiAssistant')
          return
        }
        if (restrictedAllowedViews?.has('orgChart') && nextPath.startsWith('/org-chart')) {
          setView('orgChart')
          return
        }
        if (restrictedAllowedViews?.has('upload') && nextPath.startsWith('/upload')) {
          setView('upload')
          return
        }

        const deniedPath = routes[restrictedDeniedView] || routes.home
        window.history.replaceState({ view: restrictedDeniedView }, '', deniedPath)
        setView(restrictedDeniedView)
        return
      }

      if (!isAdmin && nextPath.startsWith('/custom-events')) {
        window.history.replaceState({ view: 'commandCenter' }, '', routes.commandCenter)
        setView('commandCenter')
        return
      }

      if (
        nextPath.startsWith('/roadmap') ||
        nextPath.startsWith('/weekly-map') ||
        nextPath.startsWith('/weekly-execution-history')
      ) {
        window.history.replaceState({ view: 'projectBoard' }, '', routes.projectBoard)
        setView('projectBoard')
        return
      }

      if (
        nextPath.startsWith('/creolabs/test-environment-2-0') ||
        nextPath.startsWith('/creolabs/test-environment')
      ) {
        window.history.replaceState({ view: 'creolabsDbLive' }, '', routes.creolabsDbLive)
        setView('creolabsDbLive')
        return
      }

      if (
        !canAccessEmailMasterTemplate &&
        nextPath.startsWith('/retention/email-master-template')
      ) {
        window.history.replaceState({ view: 'commandCenter' }, '', routes.commandCenter)
        setView('commandCenter')
        return
      }

      const nextView = pathToView(nextPath)

      setView(nextView)
      if (nextView === 'affiliate') {
        setAffiliateSection(pathToAffiliateSection(nextPath))
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [
    canAccessEmailMasterTemplate,
    isAdmin,
    isRestrictedUser,
    routes.commandCenter,
    routes.creolabsDbLive,
    routes.projectBoard,
    routes,
    restrictedAllowedViews,
    restrictedDeniedView,
  ])

  useEffect(() => {
    if (view !== 'affiliate') return
    setAffiliateSection(pathToAffiliateSection(window.location.pathname))
  }, [view])

  useEffect(() => {
    if (!user) return
    if (!isRestrictedUser) return
    const p = window.location.pathname
    const landingPath = routes[restrictedLandingView] || routes.home
    if (p !== landingPath) {
      window.history.replaceState({ view: restrictedLandingView }, '', landingPath)
    }
    setView(restrictedLandingView)
  }, [restrictedLandingView, routes, user, isRestrictedUser])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!user) return
    if (isRestrictedUser) return

    // Canonicalize legacy root route to Home.
    if (window.location.pathname === '/') {
      window.history.replaceState({ view: 'home' }, '', routes.home)
    }
  }, [user, isRestrictedUser, routes.home])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!user) return
    if (view !== 'customEvents') return
    if (isAdmin) return

    window.history.replaceState({ view: 'commandCenter' }, '', routes.commandCenter)
    setView('commandCenter')
  }, [isAdmin, routes.commandCenter, user, view])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!user) return
    if (view !== 'emailMasterTemplate') return
    if (canAccessEmailMasterTemplate) return

    window.history.replaceState({ view: 'commandCenter' }, '', routes.commandCenter)
    setView('commandCenter')
  }, [canAccessEmailMasterTemplate, routes.commandCenter, user, view])

  const navigate = (nextView) => {
    if (isMobile) setIsSidebarOpen(false)
    if (!nextView) return

    if (nextView === 'admin' && !isAdmin) return
    if (nextView === 'adminPasswords' && !isAdmin) return
    if (nextView === 'customEvents' && !isAdmin) return
    if (nextView === 'emailMasterTemplate' && !canAccessEmailMasterTemplate) return

    if (isRestrictedUser && !restrictedAllowedViews.has(nextView)) {
      const fallbackView = restrictedDeniedView
      const nextPath = routes[fallbackView] || routes.home
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ view: fallbackView }, '', nextPath)
      }
      setView(fallbackView)
      return
    }

    const nextPath =
      nextView === 'affiliate' ? affiliateSectionToPath(affiliateSection) : routes[nextView] || '/'
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: nextView }, '', nextPath)
    }
    setView(nextView)
  }

  const goExecutiveSection = (section) => {
    const s = section === 'view' ? 'view' : 'summary'
    setExecutiveSection(s)
    navigate('executive')
  }

  const goAffiliateSection = (section) => {
    const allowed = new Set(['analysis', 'payments', 'payments2', 'cohort', 'clientsMoved'])
    const s = allowed.has(section) ? section : 'analysis'
    setAffiliateSection(s)

    const nextPath = affiliateSectionToPath(s)
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: 'affiliate', affiliateSection: s }, '', nextPath)
    }
    setView('affiliate')
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
      home: 'home',
      overview: 'overview',
      affiliate: 'affiliate',
      executive: 'executive',
      fraud: 'fraud-monitoring',
      projectBoard: 'project-board',
      notion: 'notion',
      summary: 'summary',
      profitableRanking: 'retention-profitable-ranking',
      primeChallengeRanking: 'prime-challenge-ranking',
      primeChallengeWidget: 'prime-challenge-widget',
      tradingCompetition: 'trading-competition',
      commissionValidationRules: 'commission-validation-rules',
      segmentComposition: 'retention-segment-composition',
      salesAgentsMonitor: 'retention-sales-agents-monitor',
      salesMonitoring: 'sales-monitoring',
      emailMasterTemplate: 'retention-email-master-template',
      orgChart: 'org-chart',
      platformUsageBilling: 'platform-usage-billing',
      financeToolOrganigram: 'finance-tool-organigram',
      supportUserCheck: 'support-user-check',
      aiAssistant: 'support-ai-assistant',
      trustpilotGuide: 'trustpilot-guide',
      creolabs: 'creolabs-overview',
      creolabsClientLists: 'creolabs-client-lists',
      creolabsDbLive: 'creolabs-db-live',
      creolabsReport: 'creolabs-report',
      creolabsTestEnvironment3: 'creolabs-test-environment-3-0',
      boardReportMailStudio: 'board-report-mail-studio',
      reportsHub: 'reports-hub',
      acuity: 'acuity-lab',
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
    <div className="app-root">
      <Topbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} onNavigate={navigate} />
      <div className={`dashboard-shell${isSidebarOpen ? ' sidebar-open' : ''}`}>
        {isMobile && isSidebarOpen && (
          <div className="dashboard-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
        )}
        <aside className="dashboard-sidebar">
          <Sidebar
            view={view}
            executiveSection={executiveSection}
            affiliateSection={affiliateSection}
            supportOnly={isRestrictedUser}
            allowedViews={restrictedAllowedViews}
            accessMode={accessMode}
            customEventsDisabled={!isAdmin}
            canAccessEmailMasterTemplate={canAccessEmailMasterTemplate}
            isAdmin={isAdmin}
            navigate={navigate}
            goExecutiveSection={goExecutiveSection}
            goAffiliateSection={goAffiliateSection}
          />
        </aside>
        <main className="dashboard-content">
          <div className="dashboard-inner">
            <Suspense fallback={<FullPageLoader progress={20} minHeight="60vh" />}>
              {view === 'home' ? (
                <ConsoleHomePage
                  user={user}
                  supportOnly={isRestrictedUser}
                  allowedViews={restrictedAllowedViews}
                  onNavigate={navigate}
                />
              ) : null}

              {['commandCenter', 'storiesKanban', 'projectBoard'].includes(view) ? (
                <ExecutionHubPage
                  activeTab={view}
                  onChangeTab={(nextTab) => navigate(nextTab)}
                  showLanguageSelect={false}
                />
              ) : null}

              {view === 'overview' ? <ProfitAnalysisPage /> : null}
              {view === 'flows' ? <FlowsPage /> : null}
              {view === 'executive' ? (
                <ExecutiveSuite section={executiveSection} onSectionChange={setExecutiveSection} />
              ) : null}
              {view === 'affiliate' ? (
                <AffiliateHub section={affiliateSection} onSectionChange={setAffiliateSection} />
              ) : null}
              {view === 'analysis' ? <CommentsAnalysisPage mode="transfersOnly" /> : null}
              {view === 'traderPointsSimulator' ? <TraderPointsSimulatorPage /> : null}
              {view === 'profitableRanking' ? <ProfitableRanking definitionKey="traders" /> : null}
              {view === 'primeChallengeRanking' ? (
                <ProfitableRanking definitionKey="prime_challenge" />
              ) : null}
              {view === 'primeChallengeWidget' ? <PrimeChallengeWidgetPage /> : null}
              {view === 'tradingCompetition' ? <TradingCompetitionPage /> : null}
              {view === 'commissionValidationRules' ? <CommissionValidationRulesPage /> : null}
              {view === 'salesMonitoring' ? <SalesMonitoringPage /> : null}
              {view === 'segmentComposition' ? <ProfitableRanking segmentsOnly /> : null}
              {view === 'salesAgentsMonitor' ? <SalesAgentsMonitor /> : null}
              {view === 'emailMasterTemplate' ? <AllTemplatesPage /> : null}
              {view === 'fraud' ? <FraudMonitoringDashboard /> : null}

              {view === 'orgChart' ? <OrgChart /> : null}
              {view === 'platformUsageBilling' ? <PlatformUsageBillingPage /> : null}
              {view === 'financeToolOrganigram' ? <FinanceToolOrganigramPage /> : null}
              {view === 'supportUserCheck' ? <SupportUserCheck /> : null}
              {view === 'aiAssistant' ? <BullwavesAIAssistantPage /> : null}
              {view === 'trustpilotGuide' ? <TrustpilotGuidePage /> : null}
              {view === 'creolabs' ? <CreolabsPage /> : null}
              {view === 'creolabsClientLists' ? <CreolabsClientListsPage /> : null}
              {view === 'creolabsDbLive' ? <CreolabsDbLivePage /> : null}
              {view === 'creolabsReport' ? <CreolabsReportPage /> : null}
              {view === 'creolabsTestEnvironment3' ? <CreolabsTestEnvironment3Page /> : null}
              {view === 'boardReportMailStudio' ? <BoardReportMailStudioPage /> : null}
              {view === 'reportsHub' ? <ExternalReportsHubPage /> : null}
              {view === 'acuity' ? <AcuityLabPage /> : null}
              {view === 'customEvents' && isAdmin ? <CustomEventsPage /> : null}
              {view === 'upload' ? <UploadReportsPage /> : null}
              {view === 'notion' ? <NotionBoard pillarFilter={notionPillarFilter} /> : null}
              {view === 'admin' ? <AdminPanel /> : null}
              {view === 'adminPasswords' && isAdmin ? <AdminPasswordsPage /> : null}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
