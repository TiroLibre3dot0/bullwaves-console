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

export default function App(){
  const routes = useMemo(() => ({
    cohort: '/',
    executiveSummary: '/executive-summary',
    marketingExpenses: '/marketing-expenses',
    affiliateAnalysis: '/affiliate-analysis',
    orgChart: '/org-chart',
    overview: '/overview',
    report: '/report',
  }), []);

  const pathToView = (pathname) => {
    if (!pathname || pathname === '/') return 'overview';
    if (pathname.startsWith('/overview')) return 'overview';
    if (pathname.startsWith('/profit-analysis')) return 'overview';
    if (pathname.startsWith('/executive-summary')) return 'executiveSummary';
    if (pathname.startsWith('/global')) return 'executiveSummary';
    if (pathname.startsWith('/marketing-expenses')) return 'marketingExpenses';
    if (pathname.startsWith('/investments')) return 'marketingExpenses';
    if (pathname.startsWith('/affiliate-analysis')) return 'affiliateAnalysis';
    if (pathname.startsWith('/report')) return 'report';
    if (pathname.startsWith('/cohort')) return 'cohort';
    if (pathname.startsWith('/org-chart')) return 'orgChart';
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
    const nextPath = routes[nextView] || '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: nextView }, '', nextPath);
    }
    setView(nextView);
  };

  return (
    <div className="app-root">
      <Topbar>
        <nav className="subnav">
          <button className={`tab ${view === 'overview' ? 'active' : ''}`} onClick={() => navigate('overview')}>
            Overview
          </button>
          <button className={`tab ${view === 'executiveSummary' ? 'active' : ''}`} onClick={() => navigate('executiveSummary')}>
            Executive Summary
          </button>
          <button className={`tab ${view === 'affiliateAnalysis' ? 'active' : ''}`} onClick={() => navigate('affiliateAnalysis')}>
            Affiliate Analysis
          </button>
          <button className={`tab ${view === 'marketingExpenses' ? 'active' : ''}`} onClick={() => navigate('marketingExpenses')}>
            Marketing Expenses
          </button>
          <button className={`tab ${view === 'cohort' ? 'active' : ''}`} onClick={() => navigate('cohort')}>
            Cohort
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
        {view === 'affiliateAnalysis' && <AffiliateAnalysis />}
        {view === 'report' && <Report />}
        {view === 'marketingExpenses' && <InvestmentsDashboard />}
        {view === 'cohort' && <Dashboard />}
        {view === 'orgChart' && <OrgChart />}
        {view === 'summary' && <SummaryReport />}
      </main>
    </div>
  )
}
