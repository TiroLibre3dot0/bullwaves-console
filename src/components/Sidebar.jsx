import React from 'react'

export default function Sidebar({ view, executiveSection, affiliateSection, supportOnly, navigate, goExecutiveSection, goAffiliateSection }) {
  const disabled = (key) => Boolean(supportOnly && !['supportUserCheck', 'orgChart', 'upload'].includes(key))

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">Dashboard</div>
        <button disabled={disabled('overview')} type="button" className={`sidebar-item sidebar-main tab ${view === 'overview' ? 'active' : ''}`} onClick={() => navigate('overview')}>
          Overview
        </button>
        <button disabled={disabled('executive')} type="button" className={`sidebar-item sidebar-main tab ${view === 'executive' ? 'active' : ''}`} onClick={() => goExecutiveSection('summary')}>
          Executive Suite
        </button>
        {view === 'executive' && (
          <div className="sidebar-subsection">
            <button
              disabled={disabled('executive')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${executiveSection === 'summary' ? 'active' : ''}`}
              onClick={() => goExecutiveSection('summary')}
            >
              Summary
            </button>
            <button
              disabled={disabled('executive')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${executiveSection === 'view' ? 'active' : ''}`}
              onClick={() => goExecutiveSection('view')}
            >
              View
            </button>
          </div>
        )}
        <button disabled={disabled('affiliate')} type="button" className={`sidebar-item sidebar-main tab ${view === 'affiliate' ? 'active' : ''}`} onClick={() => goAffiliateSection('analysis')}>
          Affiliate
        </button>
        {view === 'affiliate' && (
          <div className="sidebar-subsection">
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${affiliateSection === 'analysis' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('analysis')}
            >
              Analysis
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${affiliateSection === 'payments' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('payments')}
            >
              Payments
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${affiliateSection === 'payments2' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('payments2')}
            >
              Payments 2.0
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${affiliateSection === 'cohort' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('cohort')}
            >
              Cohort
            </button>
          </div>
        )}
        <button disabled={disabled('fraud')} type="button" className={`sidebar-item sidebar-main tab ${view === 'fraud' ? 'active' : ''}`} onClick={() => navigate('fraud')}>
          Fraud Monitoring
        </button>
        <button disabled={disabled('roadmap')} type="button" className={`sidebar-item sidebar-main tab ${view === 'roadmap' ? 'active' : ''}`} onClick={() => navigate('roadmap')}>
          Mega-Stories
        </button>
      </div>

      <div className="sidebar-section" style={{ marginTop: 10 }}>
        <div className="sidebar-title">Ops</div>
        <button disabled={disabled('orgChart')} type="button" className={`sidebar-item sidebar-main tab ${view === 'orgChart' ? 'active' : ''}`} onClick={() => navigate('orgChart')}>
          Org Chart
        </button>
        <button disabled={disabled('supportUserCheck')} type="button" className={`sidebar-item sidebar-main tab ${view === 'supportUserCheck' ? 'active' : ''}`} onClick={() => navigate('supportUserCheck')}>
          Support • User Check
        </button>
        <button disabled={disabled('upload')} type="button" className={`sidebar-item sidebar-main tab ${view === 'upload' ? 'active' : ''}`} onClick={() => navigate('upload')}>
          Upload
        </button>
      </div>
    </div>
  )
}
