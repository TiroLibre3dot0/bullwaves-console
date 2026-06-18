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
const PublicAffiliateAnalysisSharePage = lazy(
  () => import('./features/affiliate-analysis/pages/PublicAffiliateAnalysisSharePage')
)
const AFFILIATE_PERFORMANCE_TOKEN = 'share_local_317rccbafberxt00'
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
const EmailMasterTemplatePage = lazy(() => import('./pages/Retention/EmailMasterTemplatePage'))
const AllTemplatesPage = lazy(() => import('./features/sales/pages/AllTemplatesPage'))
const ConsoleHomePage = lazy(() => import('./pages/ConsoleHomePage'))
const PrimeChallengeWidgetPage = lazy(() => import('./pages/PrimeChallengeWidgetPage'))
const TradingCompetitionPage = lazy(() => import('./pages/TradingCompetitionPage'))
const TradingCompetitionWidgetPage = lazy(() => import('./pages/TradingCompetitionWidgetPage'))
const CommissionValidationRulesPage = lazy(() => import('./pages/CommissionValidationRulesPage'))
const SalesMonitoringPage = lazy(() => import('./pages/SalesMonitoringPage'))
const AcuityLabPage = lazy(() => import('./features/acuity/pages/AcuityLabPage'))
const MarketingCampaignPage = lazy(() => import('./features/sales/pages/MarketingCampaignPage'))
const CustomerIoConsolePage = lazy(() => import('./features/sales/pages/CustomerIoConsolePage'))
const SmsConsolePage = lazy(() => import('./features/sms/pages/SmsConsolePage'))
const SlackInboxPage = lazy(() => import('./features/slack/pages/SlackInboxPage'))
const ExternalReportsHubPage = lazy(
  () => import('./features/reportsHub/pages/ExternalReportsHubPage')
)
const SoliticsInsightsPage = lazy(() => import('./features/reportsHub/pages/SoliticsInsightsPage'))
const CreolabsDbNativePage = lazy(() => import('./features/creolabs/pages/CreolabsDbNativePage'))
const SkalePage = lazy(() => import('./features/skale/pages/SkalePage'))
const SkaleAccountPage = lazy(() => import('./features/skale/pages/SkaleAccountPage'))
const FxboMigrationPage = lazy(() => import('./features/fxbo/pages/FxboMigrationPage'))
const ProjectManagementPage = lazy(
  () => import('./features/projectManagement/pages/ProjectManagementPage')
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

  const { user, realUser, isImpersonating, stopImpersonation } = useAuth()
  const normalizedEmail = user?.email?.toLowerCase() || ''
  const normalizedName = String(user?.name || '')
    .trim()
    .toLowerCase()
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

  const isStefanPopovskiProfile =
    normalizedEmail === 'partners@bullwaves.com' || normalizedName === 'stefan popovski'
  const isPaoloVulloProfile =
    normalizedEmail === 'paolo.v@bullwaves.com' || normalizedName === 'paolo vullo'

  const stefanAllowedViews = useMemo(
    () =>
      new Set([
        'home',
        'projectManagement',
        'affiliate',
        'affiliatePerformance',
        'profitableRanking',
        'segmentComposition',
        'marketingCampaign',
        'customerIoConsole',
        'smsConsole',
        'slackConsole',
        'masterTemplates',
        'emailMasterTemplate',
        'primeChallengeRanking',
        'primeChallengeWidget',
        'primeChallengeYpfMigration',
        'orgChart',
        'overview',
        'fraud',
      ]),
    []
  )

  const isEffectivelyRestricted = Boolean(isRestrictedUser || isStefanPopovskiProfile)
  const effectiveAllowedViews = isStefanPopovskiProfile
    ? stefanAllowedViews
    : restrictedAllowedViews
  const effectiveLandingView = isStefanPopovskiProfile
    ? 'affiliatePerformance'
    : restrictedLandingView
  const effectiveDeniedView = isStefanPopovskiProfile ? 'home' : restrictedDeniedView

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
      primeChallengeYpfMigration: '/prime-challenge/ypf-migration',
      tradingCompetition: '/trading-competition',
      tradingCompetitionWidget: '/trading-competition/widget',
      commissionValidationRules: '/compliance/commission-validation-rules',
      salesMonitoring: '/sales/monitoring',
      marketingCampaign: '/sales/marketing-campaign',
      customerIoConsole: '/sales/customerio',
      smsConsole: '/sales/sms-console',
      slackConsole: '/sales/slack-inbox',
      segmentComposition: '/retention/segment-composition',
      salesAgentsMonitor: '/retention/sales-agents-monitor',
      masterTemplates: '/retention/master-templates',
      emailMasterTemplate: '/retention/email-master-template',
      fraud: '/fraud',
      orgChart: '/org-chart',
      platformUsageBilling: '/platform-usage-billing',
      financeToolOrganigram: '/finance/tool-organigram',
      supportUserCheck: '/support/user-check',
      aiAssistant: '/support/ai-assistant',
      trustpilotGuide: '/trustpilot-guide',
      creolabs: '/creolabs/native',
      creolabsClientLists: '/creolabs/native',
      creolabsNative: '/creolabs/native',
      skale: '/skale',
      skaleAccount: '/skale/account',
      fxboMigration: '/database/fxbo-migration',
      projectManagement: '/project-management',
      boardReportMailStudio: '/board/report-mail-studio',
      reportsHub: '/reports',
      soliticsInsights: '/reports/solitics-insights',
      acuity: '/acuity',
      customEvents: '/custom-events',
      upload: '/upload',
      notion: '/notion',
      admin: '/admin',
      adminPasswords: '/admin/passwords',
      overviewLast24: '/overview?range=last24&source=both&kpi=all',
      affiliatePerformance: '/affiliate-performance',
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
    if (pathname.startsWith('/affiliate-performance')) return 'affiliatePerformance'
    if (pathname.startsWith('/analysis')) return 'affiliate'
    if (pathname.startsWith('/affiliate')) return 'affiliate'
    if (pathname.startsWith('/trader-points')) return 'traderPointsSimulator'
    // Ranking section removed: keep legacy URLs working.
    if (pathname.startsWith('/ranking')) return 'profitableRanking'
    if (pathname.startsWith('/retention/profitable-ranking')) return 'profitableRanking'
    if (pathname.startsWith('/prime-challenge/ranking')) return 'primeChallengeRanking'
    if (pathname.startsWith('/prime-challenge/widget')) return 'primeChallengeWidget'
    if (pathname.startsWith('/prime-challenge/ypf-migration')) return 'primeChallengeYpfMigration'
    if (pathname.startsWith('/trading-competition/widget')) return 'tradingCompetitionWidget'
    if (pathname.startsWith('/trading-competition')) return 'tradingCompetition'
    if (pathname.startsWith('/compliance/commission-validation-rules'))
      return 'commissionValidationRules'
    if (pathname.startsWith('/sales/monitoring')) return 'salesMonitoring'
    if (pathname.startsWith('/sales/marketing-campaign')) return 'marketingCampaign'
    if (pathname.startsWith('/sales/customerio')) return 'customerIoConsole'
    if (pathname.startsWith('/sales/sms-console')) return 'smsConsole'
    if (pathname.startsWith('/sales/slack-inbox')) return 'slackConsole'
    if (pathname.startsWith('/retention/segment-composition')) return 'segmentComposition'
    if (pathname.startsWith('/retention/sales-agents-monitor')) return 'salesAgentsMonitor'
    if (pathname.startsWith('/retention/master-templates')) return 'masterTemplates'
    if (pathname.startsWith('/retention/email-master-template')) return 'emailMasterTemplate'
    if (pathname.startsWith('/fraud')) return 'fraud'
    if (pathname.startsWith('/org-chart')) return 'orgChart'
    if (pathname.startsWith('/platform-usage-billing')) return 'platformUsageBilling'
    if (pathname.startsWith('/finance/tool-organigram')) return 'financeToolOrganigram'
    if (pathname.startsWith('/support/user-check')) return 'supportUserCheck'
    if (pathname.startsWith('/support/ai-assistant')) return 'aiAssistant'
    if (pathname.startsWith('/trustpilot-guide')) return 'trustpilotGuide'
    if (pathname.startsWith('/creolabs/client-lists')) return 'creolabsNative'
    if (pathname.startsWith('/creolabs/native')) return 'creolabsNative'
    if (pathname.startsWith('/creolabs/report')) return 'creolabsNative'
    if (pathname.startsWith('/project-management')) return 'projectManagement'
    if (pathname.startsWith('/creolabs/test-environment-2-0')) return 'creolabsNative'
    if (pathname.startsWith('/creolabs/test-environment')) return 'creolabsNative'
    if (pathname.startsWith('/creolabs/db-live')) return 'creolabsNative'
    if (pathname.startsWith('/creolabs')) return 'creolabsNative'
    if (pathname.startsWith('/skale/account')) return 'skaleAccount'
    if (pathname.startsWith('/skale')) return 'skale'
    if (pathname.startsWith('/database/fxbo-migration')) return 'fxboMigration'
    if (pathname.startsWith('/board/report-mail-studio')) return 'boardReportMailStudio'
    if (pathname.startsWith('/reports/solitics-insights')) return 'soliticsInsights'
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
      window.history.replaceState({ view: 'creolabsNative' }, '', routes.creolabsNative)
      setView('creolabsNative')
    }
    if (p && (p.startsWith('/creolabs/client-lists') || p.startsWith('/creolabs/db-live'))) {
      window.history.replaceState({ view: 'creolabsNative' }, '', routes.creolabsNative)
      setView('creolabsNative')
    }
    if (p && p.startsWith('/creolabs/db-live-2')) {
      window.history.replaceState({ view: 'creolabsNative' }, '', routes.creolabsNative)
      setView('creolabsNative')
    }
    if (
      p &&
      (p.startsWith('/creolabs/test-environment-2-0') || p.startsWith('/creolabs/test-environment'))
    ) {
      window.history.replaceState({ view: 'creolabsNative' }, '', routes.creolabsNative)
      setView('creolabsNative')
    }
    if (p && p.startsWith('/solitics')) {
      window.history.replaceState({ view: 'reportsHub' }, '', routes.reportsHub)
      setView('reportsHub')
    }
  }, [
    routes.commandCenter,
    routes.creolabsNative,
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
      if (isEffectivelyRestricted) {
        if (
          effectiveAllowedViews?.has('supportUserCheck') &&
          nextPath.startsWith('/support/user-check')
        ) {
          setView('supportUserCheck')
          return
        }
        if (
          effectiveAllowedViews?.has('trustpilotGuide') &&
          nextPath.startsWith('/trustpilot-guide')
        ) {
          setView('trustpilotGuide')
          return
        }
        if (
          effectiveAllowedViews?.has('aiAssistant') &&
          nextPath.startsWith('/support/ai-assistant')
        ) {
          setView('aiAssistant')
          return
        }
        if (effectiveAllowedViews?.has('orgChart') && nextPath.startsWith('/org-chart')) {
          setView('orgChart')
          return
        }
        if (effectiveAllowedViews?.has('upload') && nextPath.startsWith('/upload')) {
          setView('upload')
          return
        }

        const nextView = pathToView(nextPath)
        if (effectiveAllowedViews?.has(nextView)) {
          setView(nextView)
          if (nextView === 'affiliate') {
            setAffiliateSection(pathToAffiliateSection(nextPath))
          }
          return
        }

        const deniedPath = routes[effectiveDeniedView] || routes.home
        window.history.replaceState({ view: effectiveDeniedView }, '', deniedPath)
        setView(effectiveDeniedView)
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
        window.history.replaceState({ view: 'creolabsNative' }, '', routes.creolabsNative)
        setView('creolabsNative')
        return
      }

      if (
        nextPath.startsWith('/creolabs/client-lists') ||
        nextPath.startsWith('/creolabs/db-live')
      ) {
        window.history.replaceState({ view: 'creolabsNative' }, '', routes.creolabsNative)
        setView('creolabsNative')
        return
      }

      if (
        nextPath.startsWith('/creolabs/db-live-2') ||
        nextPath.startsWith('/creolabs/test-environment-3-0')
      ) {
        window.history.replaceState({ view: 'creolabsNative' }, '', routes.creolabsNative)
        setView('creolabsNative')
        return
      }

      if (
        !canAccessEmailMasterTemplate &&
        (nextPath.startsWith('/retention/email-master-template') ||
          nextPath.startsWith('/retention/master-templates'))
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
    isEffectivelyRestricted,
    routes.commandCenter,
    routes.creolabsNative,
    routes.projectBoard,
    routes,
    effectiveAllowedViews,
    effectiveDeniedView,
  ])

  useEffect(() => {
    if (view !== 'affiliate') return
    setAffiliateSection(pathToAffiliateSection(window.location.pathname))
  }, [view])

  useEffect(() => {
    if (!user) return
    if (!isEffectivelyRestricted) return
    const p = window.location.pathname
    const landingPath = routes[effectiveLandingView] || routes.home
    if (p !== landingPath) {
      window.history.replaceState({ view: effectiveLandingView }, '', landingPath)
    }
    setView(effectiveLandingView)
  }, [effectiveLandingView, routes, user, isEffectivelyRestricted])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!user) return
    if (isEffectivelyRestricted) return

    // Canonicalize legacy root route to Home.
    if (window.location.pathname === '/') {
      window.history.replaceState({ view: 'home' }, '', routes.home)
    }
  }, [user, isEffectivelyRestricted, routes.home])

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
    if (view !== 'emailMasterTemplate' && view !== 'masterTemplates') return
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
    if (nextView === 'masterTemplates' && !canAccessEmailMasterTemplate) return

    // Resolve aliases before any restriction check so allowedViews can use the canonical key
    const resolvedView = nextView === 'overviewLast24' ? 'overview' : nextView

    if (isEffectivelyRestricted && !effectiveAllowedViews.has(resolvedView)) {
      const fallbackView = effectiveDeniedView
      const nextPath = routes[fallbackView] || routes.home
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ view: fallbackView }, '', nextPath)
      }
      setView(fallbackView)
      return
    }

    const nextPath =
      nextView === 'affiliate'
        ? affiliateSectionToPath(affiliateSection)
        : routes[nextView] || routes[resolvedView] || '/'
    if (window.location.pathname + window.location.search !== nextPath) {
      window.history.pushState({ view: resolvedView }, '', nextPath)
    }
    setView(resolvedView)
  }

  const exitPreview = () => {
    stopImpersonation()
    const nextPath = routes.home
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({ view: 'home' }, '', nextPath)
    }
    setView('home')
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
      primeChallengeYpfMigration: 'prime-challenge-ypf-migration',
      tradingCompetition: 'trading-competition',
      tradingCompetitionWidget: 'trading-competition-widget',
      commissionValidationRules: 'commission-validation-rules',
      segmentComposition: 'retention-segment-composition',
      salesAgentsMonitor: 'retention-sales-agents-monitor',
      masterTemplates: 'retention-master-templates',
      salesMonitoring: 'sales-monitoring',
      marketingCampaign: 'sales-marketing-campaign',
      customerIoConsole: 'sales-customerio-console',
      smsConsole: 'sales-sms-console',
      slackConsole: 'sales-slack-inbox',
      emailMasterTemplate: 'retention-email-master-template',
      orgChart: 'org-chart',
      platformUsageBilling: 'platform-usage-billing',
      financeToolOrganigram: 'finance-tool-organigram',
      supportUserCheck: 'support-user-check',
      aiAssistant: 'support-ai-assistant',
      trustpilotGuide: 'trustpilot-guide',
      creolabs: 'creolabs-db-native',
      creolabsNative: 'creolabs-db-native',
      fxboMigration: 'fxbo-migration',
      projectManagement: 'project-management',
      boardReportMailStudio: 'board-report-mail-studio',
      reportsHub: 'reports-hub',
      soliticsInsights: 'reports-solitics-insights',
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
            supportOnly={isEffectivelyRestricted}
            allowedViews={effectiveAllowedViews}
            accessMode={accessMode}
            customEventsDisabled={!isAdmin}
            canAccessEmailMasterTemplate={canAccessEmailMasterTemplate}
            isAdmin={isAdmin}
            isStefanProfile={isStefanPopovskiProfile}
            showRestrictedSections={isPaoloVulloProfile}
            navigate={navigate}
            goExecutiveSection={goExecutiveSection}
            goAffiliateSection={goAffiliateSection}
          />
        </aside>
        <main className="dashboard-content">
          <div className="dashboard-inner">
            {isImpersonating ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(56,189,248,0.28)',
                  background: 'linear-gradient(135deg, rgba(8,47,73,0.92), rgba(12,74,110,0.82))',
                  boxShadow: '0 16px 40px rgba(2, 132, 199, 0.12)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#7dd3fc',
                    }}
                  >
                    Preview mode
                  </div>
                  <div style={{ color: '#e0f2fe', fontSize: 15, fontWeight: 700 }}>
                    {`Previewing as ${user?.name || user?.email || 'selected user'}`}
                  </div>
                  <div style={{ color: '#bae6fd', fontSize: 12 }}>
                    {`Real session: ${realUser?.name || realUser?.email || 'Admin user'}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={exitPreview}
                  style={{
                    border: '1px solid rgba(186,230,253,0.35)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#f0f9ff',
                    padding: '9px 14px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Exit preview
                </button>
              </div>
            ) : null}
            <Suspense fallback={<FullPageLoader progress={20} minHeight="60vh" />}>
              {view === 'home' ? (
                <ConsoleHomePage
                  user={user}
                  supportOnly={isEffectivelyRestricted}
                  allowedViews={effectiveAllowedViews}
                  profileVariant={isStefanPopovskiProfile ? 'stefan-popovski' : 'default'}
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
              {view === 'affiliatePerformance' ? (
                <PublicAffiliateAnalysisSharePage
                  token={AFFILIATE_PERFORMANCE_TOKEN}
                  affiliateId=""
                  period=""
                  boardMode={false}
                  trustedInternalAccess
                />
              ) : null}
              {view === 'analysis' ? <CommentsAnalysisPage mode="transfersOnly" /> : null}
              {view === 'traderPointsSimulator' ? <TraderPointsSimulatorPage /> : null}
              {view === 'profitableRanking' ? <ProfitableRanking definitionKey="traders" /> : null}
              {view === 'primeChallengeRanking' ? (
                <ProfitableRanking definitionKey="prime_challenge" />
              ) : null}
              {view === 'primeChallengeWidget' ? <PrimeChallengeWidgetPage /> : null}
              {view === 'primeChallengeYpfMigration' ? (
                <ProjectManagementPage initialProjectId="ypf-prime-challenge-migration" />
              ) : null}
              {view === 'tradingCompetition' ? <TradingCompetitionPage /> : null}
              {view === 'tradingCompetitionWidget' ? <TradingCompetitionWidgetPage /> : null}
              {view === 'commissionValidationRules' ? <CommissionValidationRulesPage /> : null}
              {view === 'salesMonitoring' ? <SalesMonitoringPage /> : null}
              {view === 'marketingCampaign' ? <MarketingCampaignPage /> : null}
              {view === 'customerIoConsole' ? <CustomerIoConsolePage /> : null}
              {view === 'smsConsole' ? <SmsConsolePage /> : null}
              {view === 'slackConsole' ? <SlackInboxPage /> : null}
              {view === 'segmentComposition' ? <ProfitableRanking segmentsOnly /> : null}
              {view === 'salesAgentsMonitor' ? <SalesAgentsMonitor /> : null}
              {view === 'masterTemplates' ? <EmailMasterTemplatePage /> : null}
              {view === 'emailMasterTemplate' ? <AllTemplatesPage /> : null}
              {view === 'fraud' ? <FraudMonitoringDashboard /> : null}

              {view === 'orgChart' ? <OrgChart /> : null}
              {view === 'platformUsageBilling' ? <PlatformUsageBillingPage /> : null}
              {view === 'financeToolOrganigram' ? <FinanceToolOrganigramPage /> : null}
              {view === 'supportUserCheck' ? <SupportUserCheck /> : null}
              {view === 'aiAssistant' ? <BullwavesAIAssistantPage /> : null}
              {view === 'trustpilotGuide' ? <TrustpilotGuidePage /> : null}
              {view === 'creolabs' ? <CreolabsDbNativePage /> : null}
              {view === 'creolabsNative' ? <CreolabsDbNativePage /> : null}
              {view === 'skale' ? <SkalePage /> : null}
              {view === 'skaleAccount' ? <SkaleAccountPage /> : null}
              {view === 'fxboMigration' ? <FxboMigrationPage /> : null}
              {view === 'projectManagement' ? <ProjectManagementPage /> : null}
              {view === 'boardReportMailStudio' ? <BoardReportMailStudioPage /> : null}
              {view === 'reportsHub' ? <ExternalReportsHubPage /> : null}
              {view === 'soliticsInsights' ? <SoliticsInsightsPage /> : null}
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
