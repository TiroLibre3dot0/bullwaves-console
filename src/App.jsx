import React, { useEffect, useMemo, useState } from 'react'
import Topbar from './components/Topbar'
import OrgChart from './pages/OrgChart'
import SummaryReport from './features/media-payments/pages/SummaryReport'
import Report from './features/media-payments/pages/Report'
import RequireAuth from './context/RequireAuth'
import { useAuth } from './context/AuthContext'
import { trackEvent } from './services/trackingService'
import AdminPanel from './components/AdminPanel'
import RoadmapPage from './features/roadmap/pages/RoadmapPage'
import AffiliateHub from './features/affiliate/pages/AffiliateHub'
import ExecutiveSuite from './features/executive/pages/ExecutiveSuite'
import ProfitAnalysisPage from './pages/ProfitAnalysisPage'
import SupportUserCheck from './features/support/pages/SupportUserCheck'

export default function App(){
  const { user } = useAuth()
  const isAdmin = user?.email?.toLowerCase() === 'paolo.v@bullwaves.com'

   const routes = useMemo(() => ({
     cohort: '/',
     executive: '/executive',
     affiliate: '/affiliate',
     orgChart: '/org-chart',
     overview: '/overview',
     report: '/report',
     roadmap: '/roadmap',
    supportUserCheck: '/support/user-check',
   }), []);

   const pathToView = (pathname) => {
     if (!pathname || pathname === '/') return 'overview';
     if (pathname.startsWith('/overview')) return 'overview';
     if (pathname.startsWith('/profit-analysis')) return 'overview';
     if (pathname.startsWith('/executive') || pathname.startsWith('/executive-summary') || pathname.startsWith('/executive-view') || pathname.startsWith('/global')) return 'executive';
     if (pathname.startsWith('/affiliate') || pathname.startsWith('/affiliate-analysis')) return 'affiliate';
     if (pathname.startsWith('/marketing-expenses')) return 'affiliate';
     if (pathname.startsWith('/investments')) return 'affiliate';
     if (pathname.startsWith('/report')) return 'report';
     if (pathname.startsWith('/cohort')) return 'affiliate';
     if (pathname.startsWith('/org-chart')) return 'orgChart';
     if (pathname.startsWith('/roadmap')) return 'roadmap';
     if (pathname.startsWith('/ongoing')) return 'roadmap';
     if (pathname.startsWith('/summary-report')) return 'summary';
    if (pathname.startsWith('/support')) return 'supportUserCheck';
     return 'overview';
   };

  const affiliateSectionFromPath = (pathname) => {
    if (pathname.startsWith('/marketing-expenses') || pathname.startsWith('/investments')) return 'payments';
    if (pathname.startsWith('/cohort')) return 'cohort';
    return 'analysis';
  }

  const [view, setView] = useState(() => pathToView(window.location.pathname));
  const [affiliateSection, setAffiliateSection] = useState(() => affiliateSectionFromPath(window.location.pathname));
  const [executiveSection, setExecutiveSection] = useState(() => {
    const p = window.location.pathname
    if (p.startsWith('/executive-summary') || p.startsWith('/global')) return 'summary';
    if (p.startsWith('/executive-view')) return 'view';
    return 'summary';
  });

  useEffect(() => {
    const onPop = () => {
      const nextPath = window.location.pathname
      setView(pathToView(nextPath))
      setAffiliateSection(affiliateSectionFromPath(nextPath))
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goAffiliateSection = (section = 'analysis') => {
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
    const pathBySection = {
      summary: '/executive-summary',
      view: '/executive-view',
    }
    const nextPath = pathBySection[section] || '/executive';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: 'executive', section }, '', nextPath)
    }
    setExecutiveSection(section)
    setView('executive')
  }

  const navigate = (nextView) => {
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
      affiliate: 'affiliate',
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
            <button className={`tab ${view === 'executive' ? 'active' : ''}`} onClick={() => goExecutiveSection('summary')}>
              Executive Suite
            </button>
            <button className={`tab ${view === 'affiliate' ? 'active' : ''}`} onClick={() => goAffiliateSection('analysis')}>
              Affiliate
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
            <button className={`tab ${view === 'supportUserCheck' ? 'active' : ''}`} onClick={() => navigate('supportUserCheck')}>
              Support • User Check
            </button>
          </nav>
        </Topbar>
        <main className="app-main">
          {view === 'overview' && <ProfitAnalysisPage />}
          {view === 'executive' && (
            <ExecutiveSuite section={executiveSection} onSectionChange={goExecutiveSection} />
          )}
          {view === 'affiliate' && (
            <AffiliateHub section={affiliateSection} onSectionChange={goAffiliateSection} />
          )}
          {view === 'report' && <Report />}
          {view === 'roadmap' && <RoadmapPage />}
          {view === 'orgChart' && <OrgChart />}
          {view === 'summary' && <SummaryReport />}
          {view === 'supportUserCheck' && (
            <React.Suspense fallback={<div>Loading…</div>}>
                <SupportUserCheck />
            </React.Suspense>
          )}
 
          {view === 'admin' && isAdmin && <AdminPanel />}
        </main>
      </div>
    </RequireAuth>
  )
}
