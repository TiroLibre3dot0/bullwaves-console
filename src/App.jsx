import React, { useEffect, useMemo, useState } from 'react'
import Topbar from './components/Topbar'
import Dashboard from './components/Dashboard'
import GlobalDashboard from './features/media-payments/components/GlobalDashboard'
import InvestmentsDashboard from './features/investments/components/InvestmentsDashboard'
import OrgChart from './pages/OrgChart'
import SummaryReport from './features/media-payments/pages/SummaryReport'
import Report from './features/media-payments/pages/Report'
import ProfitAnalysisPage from './features/media-payments/pages/ProfitAnalysisPage'
import AffiliateAnalysis from './features/affiliate-analysis/AffiliateAnalysis'
import RequireAuth from './context/RequireAuth'
import { useAuth } from './context/AuthContext'
import { trackEvent } from './services/trackingService'
import AdminPanel from './components/AdminPanel'
import RoadmapPage from './features/roadmap/pages/RoadmapPage'
import ExecutiveView from './features/executive-view/pages/ExecutiveView'

export default function App(){
  const { user } = useAuth()
  const isAdmin = user?.email?.toLowerCase() === 'paolo.v@bullwaves.com'

  const routes = useMemo(() => ({
    cohort: '/',
    executiveSummary: '/executive-summary',
    executiveView: '/executive-view',
    marketingExpenses: '/marketing-expenses',
    affiliateAnalysis: '/affiliate-analysis',
    orgChart: '/org-chart',
    overview: '/overview',
    report: '/report',
    roadmap: '/roadmap',
  }), []);

  const pathToView = (pathname) => {
    if (!pathname || pathname === '/') return 'overview';
    if (pathname.startsWith('/overview')) return 'overview';
    if (pathname.startsWith('/profit-analysis')) return 'overview';
    if (pathname.startsWith('/executive-summary')) return 'executiveSummary';
    if (pathname.startsWith('/executive-view')) return 'executiveView';
    if (pathname.startsWith('/global')) return 'executiveSummary';
    if (pathname.startsWith('/marketing-expenses')) return 'marketingExpenses';
    if (pathname.startsWith('/investments')) return 'marketingExpenses';
    if (pathname.startsWith('/affiliate-analysis')) return 'affiliateAnalysis';
    if (pathname.startsWith('/report')) return 'report';
    if (pathname.startsWith('/cohort')) return 'cohort';
    if (pathname.startsWith('/org-chart')) return 'orgChart';
    if (pathname.startsWith('/roadmap')) return 'roadmap';
    if (pathname.startsWith('/ongoing')) return 'roadmap';
    if (pathname.startsWith('/summary-report')) return 'summary';
    return 'overview';
  };

  const [view, setView] = useState(() => pathToView(window.location.pathname));

  useEffect(() => {
    const onPop = () => setView(pathToView(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (nextView) => {
    if (nextView === 'admin' && !isAdmin) {
      setView('overview')
      return
    }
    const nextPath = routes[nextView] || '/';
    if (nextView === 'admin') {
      setView('admin');
      return;
    }
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: nextView }, '', nextPath);
    }
    setView(nextView);
  };

  useEffect(() => {
    if (!user) return
    const viewToSection = {
      overview: 'overview',
      executiveSummary: 'executive-summary',
      executiveView: 'executive-view',
      affiliateAnalysis: 'affiliate-analysis',
      marketingExpenses: 'marketing-expenses',
      cohort: 'cohort',
      orgChart: 'org-chart',
      summary: 'summary',
      roadmap: 'mega-stories',
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
    <RequireAuth>
      <div className="app-root">
        <Topbar onAdminClick={() => navigate('admin')} showAdmin={isAdmin}>
          <nav className="subnav">
            <button className={`tab ${view === 'overview' ? 'active' : ''}`} onClick={() => navigate('overview')}>
              Overview
            </button>
            <button className={`tab ${view === 'executiveSummary' ? 'active' : ''}`} onClick={() => navigate('executiveSummary')}>
              Executive Summary
            </button>
            <button className={`tab ${view === 'executiveView' ? 'active' : ''}`} onClick={() => navigate('executiveView')}>
              Executive View
            </button>
            <button className={`tab ${view === 'affiliateAnalysis' ? 'active' : ''}`} onClick={() => navigate('affiliateAnalysis')}>
              Affiliate Analysis
            </button>
            <button className={`tab ${view === 'marketingExpenses' ? 'active' : ''}`} onClick={() => navigate('marketingExpenses')}>
              Affiliate Payments
            </button>
            <button className={`tab ${view === 'cohort' ? 'active' : ''}`} onClick={() => navigate('cohort')}>
              Cohort
            </button>
            <button className={`tab ${view === 'roadmap' ? 'active' : ''}`} onClick={() => navigate('roadmap')}>
              Mega-Stories
            </button>
            <button
              className={`tab ${view === 'orgChart' ? 'active' : ''}`}
              onClick={() => navigate('orgChart')}
              style={{ marginLeft: 'auto' }}
            >
              Org Chart
            </button>
          </nav>
        </Topbar>
        <main className="app-main">
          {view === 'overview' && <ProfitAnalysisPage />}
          {view === 'executiveSummary' && <GlobalDashboard />}
          {view === 'executiveView' && <ExecutiveView />}
          {view === 'affiliateAnalysis' && <AffiliateAnalysis />}
          {view === 'report' && <Report />}
          {view === 'marketingExpenses' && <InvestmentsDashboard />}
          {view === 'cohort' && <Dashboard />}
          {view === 'roadmap' && <RoadmapPage />}
          {view === 'orgChart' && <OrgChart />}
          {view === 'summary' && <SummaryReport />}
          {view === 'admin' && isAdmin && <AdminPanel />}
        </main>
      </div>
    </RequireAuth>
  )
}
