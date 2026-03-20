import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

function Icon({ name, size = 16 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }
  switch (name) {
    case 'home':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3 11l9-7 9 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path
            d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      )
    case 'briefcase':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M9 6h6V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 12h18" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="7" y="10" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="12" y="8" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="17" y="6" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'layout':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 10h18M10 4v16" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="2" />
          <path
            d="M3 20a7 7 0 0 1 18 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'pie':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 12V3a9 9 0 1 1-9 9h9Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 12h9A9 9 0 0 0 12 3v9Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'card':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'layers':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 3 3 8l9 5 9-5-9-5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M3 12l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'map':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M9 5 3 7v12l6-2 6 2 6-2V5l-6 2-6-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 5v12M15 7v12" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 3v4M16 3v4M4 10h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'org':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M12 5v6M6 17h12M12 11H7m5 0h5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect x="10" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="4" y="15" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="16" y="15" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'upload':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 16V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M8 10l4-4 4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export default function Sidebar({
  view,
  executiveSection,
  affiliateSection,
  supportOnly,
  allowedViews,
  customEventsDisabled,
  navigate,
  goExecutiveSection,
  goAffiliateSection,
}) {
  const { t } = useI18n()
  const [openSections, setOpenSections] = useState({
    projectManagement: false,
    dashboard: false,
    affiliate: false,
    support: false,
    ops: false,
  })

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))
  }

  const disabled = (key) => {
    if (customEventsDisabled && key === 'customEvents') return true
    if (!supportOnly) return false
    const allowed =
      allowedViews && typeof allowedViews.has === 'function'
        ? allowedViews
        : new Set(['supportUserCheck', 'trustpilotGuide', 'orgChart', 'upload'])
    return !allowed.has(key)
  }

  return (
    <div className="sidebar">
      <div className="sidebar-section sidebar-section--projectManagement">
        <button
          type="button"
          className="sidebar-title"
          onClick={() => toggleSection('projectManagement')}
          aria-expanded={openSections.projectManagement ? 'true' : 'false'}
        >
          <span>{t('sidebar.projectManagement')}</span>
          <span className="sidebar-title-caret" aria-hidden="true">
            {openSections.projectManagement ? '▾' : '▸'}
          </span>
        </button>

        {openSections.projectManagement ? (
          <>
            <button
              disabled={disabled('commandCenter')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'commandCenter' ? 'active' : ''}`}
              onClick={() => navigate('commandCenter')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="home" />
                <span>{t('sidebar.commandCenter')}</span>
              </span>
            </button>

            <button
              disabled={disabled('flows')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'flows' ? 'active' : ''}`}
              onClick={() => navigate('flows')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="chart" />
                <span>{t('sidebar.flows')}</span>
              </span>
            </button>
          </>
        ) : null}
      </div>

      <div className="sidebar-section sidebar-section--dashboard" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="sidebar-title"
          onClick={() => toggleSection('dashboard')}
          aria-expanded={openSections.dashboard ? 'true' : 'false'}
        >
          <span>{t('sidebar.dashboard')}</span>
          <span className="sidebar-title-caret" aria-hidden="true">
            {openSections.dashboard ? '▾' : '▸'}
          </span>
        </button>

        {openSections.dashboard ? (
          <>
            <button
              disabled={disabled('overview')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'overview' ? 'active' : ''}`}
              onClick={() => navigate('overview')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="home" />
                <span>{t('sidebar.overview')}</span>
              </span>
            </button>
            <button
              disabled={disabled('executive')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'executive' ? 'active' : ''}`}
              onClick={() => goExecutiveSection('summary')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="briefcase" />
                <span>{t('sidebar.executiveSuite')}</span>
              </span>
            </button>
            {view === 'executive' && (
              <div className="sidebar-subsection">
                <button
                  disabled={disabled('executive')}
                  type="button"
                  className={`sidebar-item sidebar-subitem tab ${executiveSection === 'summary' ? 'active' : ''}`}
                  onClick={() => goExecutiveSection('summary')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="chart" />
                    <span>{t('sidebar.executive.summary')}</span>
                  </span>
                </button>
                <button
                  disabled={disabled('executive')}
                  type="button"
                  className={`sidebar-item sidebar-subitem tab ${executiveSection === 'view' ? 'active' : ''}`}
                  onClick={() => goExecutiveSection('view')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="layout" />
                    <span>{t('sidebar.executive.view')}</span>
                  </span>
                </button>
              </div>
            )}
            <button
              disabled={disabled('traderPointsSimulator')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'traderPointsSimulator' ? 'active' : ''}`}
              onClick={() => navigate('traderPointsSimulator')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="layers" />
                <span>{t('sidebar.traderPoints')}</span>
              </span>
            </button>

            <button
              disabled={disabled('profitableRanking')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'profitableRanking' ? 'active' : ''}`}
              onClick={() => navigate('profitableRanking')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="chart" />
                <span>{t('sidebar.profitableRanking')}</span>
              </span>
            </button>
            <button
              disabled={disabled('fraud')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'fraud' ? 'active' : ''}`}
              onClick={() => navigate('fraud')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="shield" />
                <span>{t('sidebar.fraud')}</span>
              </span>
            </button>
          </>
        ) : null}
      </div>

      <div className="sidebar-section sidebar-section--affiliate" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="sidebar-title"
          onClick={() => toggleSection('affiliate')}
          aria-expanded={openSections.affiliate ? 'true' : 'false'}
        >
          <span>{t('sidebar.affiliate')}</span>
          <span className="sidebar-title-caret" aria-hidden="true">
            {openSections.affiliate ? '▾' : '▸'}
          </span>
        </button>

        {openSections.affiliate ? (
          <>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'affiliate' && affiliateSection === 'analysis' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('analysis')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="pie" />
                <span>{t('sidebar.affiliate.analysis')}</span>
              </span>
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'affiliate' && affiliateSection === 'clientsMoved' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('clientsMoved')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="chart" />
                <span>{t('sidebar.affiliate.clientsMoved')}</span>
              </span>
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'affiliate' && affiliateSection === 'payments' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('payments')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="card" />
                <span>{t('sidebar.affiliate.payments')}</span>
              </span>
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'affiliate' && affiliateSection === 'payments2' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('payments2')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="card" />
                <span>{t('sidebar.affiliate.payments2')}</span>
              </span>
            </button>
            <button
              disabled={disabled('affiliate')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'affiliate' && affiliateSection === 'cohort' ? 'active' : ''}`}
              onClick={() => goAffiliateSection('cohort')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="layers" />
                <span>{t('sidebar.affiliate.cohort')}</span>
              </span>
            </button>
          </>
        ) : null}
      </div>

      <div className="sidebar-section sidebar-section--support" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="sidebar-title"
          onClick={() => toggleSection('support')}
          aria-expanded={openSections.support ? 'true' : 'false'}
        >
          <span>{t('sidebar.support')}</span>
          <span className="sidebar-title-caret" aria-hidden="true">
            {openSections.support ? '▾' : '▸'}
          </span>
        </button>

        {openSections.support ? (
          <>
            <button
              disabled={disabled('supportUserCheck')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'supportUserCheck' ? 'active' : ''}`}
              onClick={() => navigate('supportUserCheck')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="search" />
                <span>{t('sidebar.supportUserCheck')}</span>
              </span>
            </button>

            <button
              disabled={disabled('trustpilotGuide')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'trustpilotGuide' ? 'active' : ''}`}
              onClick={() => navigate('trustpilotGuide')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="chart" />
                <span>{t('sidebar.trustpilotGuide')}</span>
              </span>
            </button>
          </>
        ) : null}
      </div>

      <div className="sidebar-section sidebar-section--ops" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="sidebar-title"
          onClick={() => toggleSection('ops')}
          aria-expanded={openSections.ops ? 'true' : 'false'}
        >
          <span>{t('sidebar.ops')}</span>
          <span className="sidebar-title-caret" aria-hidden="true">
            {openSections.ops ? '▾' : '▸'}
          </span>
        </button>

        {openSections.ops ? (
          <>
            <button
              disabled={disabled('orgChart')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'orgChart' ? 'active' : ''}`}
              onClick={() => navigate('orgChart')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="org" />
                <span>{t('sidebar.orgChart')}</span>
              </span>
            </button>

            <button
              disabled={disabled('platformUsageBilling')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'platformUsageBilling' ? 'active' : ''}`}
              onClick={() => navigate('platformUsageBilling')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="card" />
                <span>{t('sidebar.platformUsageBilling')}</span>
              </span>
            </button>
            <button
              disabled={disabled('customEvents')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'customEvents' ? 'active' : ''}`}
              onClick={() => navigate('customEvents')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="chart" />
                <span>{t('sidebar.customEvents')}</span>
              </span>
            </button>
            <button
              disabled={disabled('upload')}
              type="button"
              className={`sidebar-item sidebar-main tab ${view === 'upload' ? 'active' : ''}`}
              onClick={() => navigate('upload')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="upload" />
                <span>{t('sidebar.upload')}</span>
              </span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
