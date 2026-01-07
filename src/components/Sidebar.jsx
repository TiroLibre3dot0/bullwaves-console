import React from 'react'
import { useI18n } from '../i18n/I18nContext'

export default function Sidebar({ view, executiveSection, affiliateSection, supportOnly, navigate, goExecutiveSection, goAffiliateSection }) {
  const { t } = useI18n()
  const disabled = (key) => Boolean(supportOnly && !['supportUserCheck', 'orgChart', 'upload'].includes(key))
  const roadmapActive = view === 'roadmap' || view === 'weeklyMap'

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">{t('sidebar.dashboard')}</div>
        <button disabled={disabled('overview')} type="button" className={`sidebar-item sidebar-main tab ${view === 'overview' ? 'active' : ''}`} onClick={() => navigate('overview')}>
          {t('sidebar.overview')}
        </button>
        <button disabled={disabled('executive')} type="button" className={`sidebar-item sidebar-main tab ${view === 'executive' ? 'active' : ''}`} onClick={() => goExecutiveSection('summary')}>
          {t('sidebar.executiveSuite')}
        </button>
        {view === 'executive' && (
          <div className="sidebar-subsection">
            <button
              disabled={disabled('executive')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${executiveSection === 'summary' ? 'active' : ''}`}
              onClick={() => goExecutiveSection('summary')}
            >
              {t('sidebar.executive.summary')}
            </button>
            <button
              disabled={disabled('executive')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${executiveSection === 'view' ? 'active' : ''}`}
              onClick={() => goExecutiveSection('view')}
            >
              {t('sidebar.executive.view')}
            </button>
          </div>
        )}
        <button disabled={disabled('affiliate')} type="button" className={`sidebar-item sidebar-main tab ${view === 'affiliate' ? 'active' : ''}`} onClick={() => goAffiliateSection('analysis')}>
          {t('sidebar.affiliate')}
        </button>
        {view === 'affiliate' && (
          <div className="sidebar-subsection">
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${affiliateSection === 'analysis' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('analysis')}
            >
              {t('sidebar.affiliate.analysis')}
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${affiliateSection === 'payments' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('payments')}
            >
              {t('sidebar.affiliate.payments')}
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${affiliateSection === 'payments2' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('payments2')}
            >
              {t('sidebar.affiliate.payments2')}
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${affiliateSection === 'cohort' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('cohort')}
            >
              {t('sidebar.affiliate.cohort')}
            </button>
          </div>
        )}
        <button disabled={disabled('fraud')} type="button" className={`sidebar-item sidebar-main tab ${view === 'fraud' ? 'active' : ''}`} onClick={() => navigate('fraud')}>
          {t('sidebar.fraud')}
        </button>
        <button disabled={disabled('roadmap')} type="button" className={`sidebar-item sidebar-main tab ${roadmapActive ? 'active' : ''}`} onClick={() => navigate('roadmap')}>
          {t('sidebar.roadmap')}
        </button>
        {roadmapActive && (
          <div className="sidebar-subsection">
            <button
              disabled={disabled('roadmap')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${view === 'roadmap' ? 'active' : ''}`}
              onClick={() => navigate('roadmap')}
            >
              {t('sidebar.roadmap')}
            </button>
            <button
              disabled={disabled('weeklyMap')}
              type="button"
              className={`sidebar-item sidebar-subitem tab ${view === 'weeklyMap' ? 'active' : ''}`}
              onClick={() => navigate('weeklyMap')}
            >
              {t('sidebar.weeklyMap')}
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-section" style={{ marginTop: 10 }}>
        <div className="sidebar-title">{t('sidebar.ops')}</div>
        <button disabled={disabled('orgChart')} type="button" className={`sidebar-item sidebar-main tab ${view === 'orgChart' ? 'active' : ''}`} onClick={() => navigate('orgChart')}>
          {t('sidebar.orgChart')}
        </button>
        <button disabled={disabled('supportUserCheck')} type="button" className={`sidebar-item sidebar-main tab ${view === 'supportUserCheck' ? 'active' : ''}`} onClick={() => navigate('supportUserCheck')}>
          {t('sidebar.supportUserCheck')}
        </button>
        <button disabled={disabled('upload')} type="button" className={`sidebar-item sidebar-main tab ${view === 'upload' ? 'active' : ''}`} onClick={() => navigate('upload')}>
          {t('sidebar.upload')}
        </button>
      </div>
    </div>
  )
}
