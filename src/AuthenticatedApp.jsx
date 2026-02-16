import { useEffect, useMemo, useState } from 'react'

import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import OrgChart from './pages/OrgChart'
import ExecutionHubPage from './features/execution/ExecutionHubPage'
import FlowsPage from './features/flows/FlowsPage'
import ExecutiveSuite from './features/executive/pages/ExecutiveSuite'
import AffiliateHub from './features/affiliate/pages/AffiliateHub'
import ProfitAnalysisPage from './pages/ProfitAnalysisPage'
import CommentsAnalysisPage from './pages/CommentsAnalysisPage'
import FraudMonitoringDashboard from './components/FraudMonitoringDashboard'
import MarketingPlanExecutionPage from './features/marketing-plan/pages/MarketingPlanExecutionPage'
import SupportUserCheck from './features/support/pages/SupportUserCheck'
import CustomEventsPage from './features/analytics/pages/CustomEventsPage'
import UploadReportsPage from './pages/UploadReportsPage'
import TraderPointsSimulatorPage from './features/traderPointsSimulator/TraderPointsSimulatorPage'
import NotionBoard from './features/notion/NotionBoard'
import RankingPage from './features/ranking/pages/RankingPage'
import ConsoleHomePage from './pages/ConsoleHomePage'
import { useAuth } from './context/AuthContext'
import { trackEvent } from './services/trackingService'
import AdminPanel from './components/AdminPanel'

// StoriesKanbanPage / ProjectBoardPage are lazy-loaded inside ExecutionHubPage

export default function AuthenticatedApp() {
  const [notionPillarFilter] = useState(null)

  const isSalesDepartment = (department = '') => {
    const d = String(department || '')
      .trim()
      .toLowerCase()
    if (!d) return false
    return d.startsWith('sales') || d.includes('business development')
  }

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
  const isManagementTeam = Boolean(user?.isManagementTeam)
  // Admin features (Custom Events, Admin Panel) follow the org chart: Management Team has full access.
  // Keep a small explicit allowlist for exceptional admin users outside management.
  const adminEmails = new Set(['paolo.v@bullwaves.com'])
  const isAdmin = Boolean(isManagementTeam || adminEmails.has(normalizedEmail))
  const isSupportUser = (user?.department || '').trim().toLowerCase() === 'support team'
  const isSupportOnly = Boolean(isSupportUser && !isManagementTeam)
  const isBusinessDevSales = Boolean(!isManagementTeam && isSalesDepartment(user?.department || ''))
  const isRestrictedUser = Boolean(isSupportOnly || isBusinessDevSales)

  const restrictedAllowedViews = useMemo(() => {
    // Support can upload reports; BD/Sales should not.
    if (isSupportOnly) return new Set(['home', 'supportUserCheck', 'orgChart', 'upload'])
    return new Set(['home', 'supportUserCheck', 'orgChart'])
  }, [isSupportOnly])

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
      marketingPlan: '/marketing-plan',
      overview: '/overview',
      flows: '/flows',
      executive: '/executive',
      affiliate: '/affiliate',
      traderPointsSimulator: '/trader-points',
      ranking: '/ranking',
      fraud: '/fraud',
      orgChart: '/org-chart',
      supportUserCheck: '/support/user-check',
      customEvents: '/custom-events',
      upload: '/upload',
      notion: '/notion',
      admin: '/admin',
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
    if (pathname.startsWith('/marketing-plan')) return 'marketingPlan'
    if (pathname.startsWith('/roadmap')) return 'projectBoard'
    if (pathname.startsWith('/weekly-map')) return 'projectBoard'
    if (pathname.startsWith('/weekly-execution-history')) return 'projectBoard'
    if (pathname.startsWith('/overview')) return 'overview'
    if (pathname.startsWith('/flows')) return 'flows'
    if (pathname.startsWith('/executive')) return 'executive'
    if (pathname.startsWith('/analysis')) return 'affiliate'
    if (pathname.startsWith('/affiliate')) return 'affiliate'
    if (pathname.startsWith('/trader-points')) return 'traderPointsSimulator'
    if (pathname.startsWith('/ranking')) return 'ranking'
    if (pathname.startsWith('/fraud')) return 'fraud'
    if (pathname.startsWith('/org-chart')) return 'orgChart'
    if (pathname.startsWith('/support/user-check')) return 'supportUserCheck'
    if (pathname.startsWith('/custom-events')) return 'customEvents'
    if (pathname.startsWith('/upload')) return 'upload'
    if (pathname.startsWith('/notion')) return 'notion'
    if (pathname.startsWith('/admin')) return 'admin'
    return 'commandCenter'
  }

  const [view, setView] = useState(() => pathToView(window.location.pathname))

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
        if (nextPath.startsWith('/support/user-check')) {
          setView('supportUserCheck')
          return
        }
        if (nextPath.startsWith('/org-chart')) {
          setView('orgChart')
          return
        }
        if (isSupportOnly && nextPath.startsWith('/upload')) {
          setView('upload')
          return
        }

        window.history.replaceState({ view: 'supportUserCheck' }, '', '/support/user-check')
        setView('supportUserCheck')
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

      const nextView = pathToView(nextPath)

      setView(nextView)
      if (nextView === 'affiliate') {
        setAffiliateSection(pathToAffiliateSection(nextPath))
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isAdmin, isRestrictedUser, isSupportOnly, routes.commandCenter, routes.projectBoard])

  useEffect(() => {
    if (view !== 'affiliate') return
    setAffiliateSection(pathToAffiliateSection(window.location.pathname))
  }, [view])

  useEffect(() => {
    if (!user) return
    if (!isRestrictedUser) return
    // Restricted users still land on Home; navigation enforces allowed views.
    const p = window.location.pathname
    if (!p.startsWith('/home')) {
      window.history.replaceState({ view: 'home' }, '', routes.home)
    }
    setView('home')
  }, [user, isRestrictedUser])

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

  const navigate = (nextView) => {
    if (isMobile) setIsSidebarOpen(false)
    if (!nextView) return

    if (nextView === 'admin' && !isAdmin) return
    if (nextView === 'customEvents' && !isAdmin) return

    if (isRestrictedUser && !restrictedAllowedViews.has(nextView)) {
      const nextPath = routes.supportUserCheck
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ view: 'supportUserCheck' }, '', nextPath)
      }
      setView('supportUserCheck')
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
      marketingPlan: 'marketing-plan',
      projectBoard: 'project-board',
      notion: 'notion',
      summary: 'summary',
      ranking: 'ranking',
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
    <div className="app-root">
      <Topbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
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
            customEventsDisabled={!isAdmin}
            navigate={navigate}
            goExecutiveSection={goExecutiveSection}
            goAffiliateSection={goAffiliateSection}
          />
        </aside>
        <main className="dashboard-content">
          <div className="dashboard-inner">
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

            {view === 'marketingPlan' ? <MarketingPlanExecutionPage /> : null}

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
            {view === 'ranking' ? <RankingPage /> : null}
            {view === 'fraud' ? <FraudMonitoringDashboard /> : null}

            {view === 'orgChart' ? <OrgChart /> : null}
            {view === 'supportUserCheck' ? <SupportUserCheck /> : null}
            {view === 'customEvents' && isAdmin ? <CustomEventsPage /> : null}
            {view === 'upload' ? <UploadReportsPage /> : null}
            {view === 'notion' ? <NotionBoard pillarFilter={notionPillarFilter} /> : null}
            {view === 'admin' ? <AdminPanel /> : null}
          </div>
        </main>
      </div>
    </div>
  )
}
