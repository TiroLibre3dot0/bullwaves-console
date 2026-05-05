import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

const RECENT_SECTION_KEYS = new Set([
  'segmentComposition',
  'emailMasterTemplate',
  'primeChallengeRanking',
  'primeChallengeWidget',
])

function SidebarNewBadge() {
  return (
    <span
      className="animate-pulse"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '8px',
        padding: '1px 6px',
        borderRadius: '999px',
        border: '1px solid rgba(125,211,252,0.28)',
        background: 'rgba(56,189,248,0.12)',
        color: '#9edcff',
        fontSize: '9px',
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
      }}
    >
      (new)
    </span>
  )
}

function SidebarItemLabel({ label, itemKey }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
      <span>{label}</span>
      {RECENT_SECTION_KEYS.has(itemKey) ? <SidebarNewBadge /> : null}
    </span>
  )
}

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
    case 'chat':
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
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
  accessMode,
  customEventsDisabled,
  canAccessEmailMasterTemplate,
  isAdmin,
  navigate,
  goExecutiveSection,
  goAffiliateSection,
}) {
  const { t } = useI18n()
  const [isStandbyOpen, setIsStandbyOpen] = useState(false)
  const trustpilotOnlyMode = accessMode === 'trustpilotOnly'

  const disabled = (key) => {
    if (customEventsDisabled && key === 'customEvents') return true
    if (key === 'emailMasterTemplate' && !canAccessEmailMasterTemplate) return true
    if (!supportOnly) return false
    const allowed =
      allowedViews && typeof allowedViews.has === 'function'
        ? allowedViews
        : new Set([
            'supportUserCheck',
            'aiAssistant',
            'whatsappPerformance',
            'trustpilotGuide',
            'commissionValidationRules',
            'salesMonitoring',
            'orgChart',
            'upload',
          ])
    return !allowed.has(key)
  }

  const trustpilotSupportItem = {
    key: 'trustpilotGuide',
    label: t('sidebar.trustpilotGuide'),
    icon: 'chart',
    active: view === 'trustpilotGuide',
    onClick: () => navigate('trustpilotGuide'),
    disabled: disabled('trustpilotGuide'),
  }

  const sectionGroups = [
    {
      key: 'creolabs',
      title: 'CREOLABS',
      items: [
        {
          key: 'creolabsApps',
          label: 'Qlik Apps',
          icon: 'chart',
          active: view === 'creolabs',
          onClick: () => navigate('creolabs'),
          disabled: disabled('creolabs'),
        },
        {
          key: 'creolabsClientLists',
          label: 'Client Lists (30d)',
          icon: 'list',
          active: view === 'creolabsClientLists',
          onClick: () => navigate('creolabsClientLists'),
          disabled: disabled('creolabs'),
        },
      ],
    },
    {
      key: 'sales',
      title: 'Sales',
      items: [
        {
          key: 'affiliateAnalysis',
          label: t('sidebar.affiliate.analysis'),
          icon: 'pie',
          active: view === 'affiliate' && affiliateSection === 'analysis',
          onClick: () => goAffiliateSection('analysis'),
          disabled: disabled('affiliate'),
        },
        {
          key: 'affiliateClientsMoved',
          label: t('sidebar.affiliate.clientsMoved'),
          icon: 'chart',
          active: view === 'affiliate' && affiliateSection === 'clientsMoved',
          onClick: () => goAffiliateSection('clientsMoved'),
          disabled: disabled('affiliate'),
        },
        {
          key: 'profitableRanking',
          label: t('sidebar.profitableRanking'),
          icon: 'chart',
          active: view === 'profitableRanking',
          onClick: () => navigate('profitableRanking'),
          disabled: disabled('profitableRanking'),
        },
        {
          key: 'segmentComposition',
          label: 'Segment Composition',
          icon: 'layers',
          active: view === 'segmentComposition',
          onClick: () => navigate('segmentComposition'),
          disabled: disabled('segmentComposition'),
        },
        {
          key: 'salesMonitoring',
          label: 'Monitoring',
          icon: 'chart',
          active:
            view === 'salesMonitoring' ||
            view === 'salesAgentsMonitor' ||
            view === 'commissionValidationRules',
          onClick: () => navigate('salesMonitoring'),
          disabled: disabled('salesMonitoring'),
        },
        {
          key: 'emailMasterTemplate',
          label: 'Email Master Template',
          icon: 'layout',
          active: view === 'emailMasterTemplate',
          onClick: () => navigate('emailMasterTemplate'),
          disabled: disabled('emailMasterTemplate'),
        },
      ],
    },
    {
      key: 'board',
      title: 'Board',
      items: [
        {
          key: 'boardAffiliatePayoutSummary',
          label: t('investments.section.affiliatePayoutSummary'),
          icon: 'layout',
          active: view === 'affiliate' && affiliateSection === 'payments',
          onClick: () => goAffiliateSection('payments'),
          disabled: disabled('affiliate'),
        },
      ],
    },
    {
      key: 'support',
      title: 'Support',
      items: trustpilotOnlyMode
        ? [trustpilotSupportItem]
        : [
            {
              key: 'supportUserCheck',
              label: t('sidebar.supportUserCheck'),
              icon: 'search',
              active: view === 'supportUserCheck',
              onClick: () => navigate('supportUserCheck'),
              disabled: disabled('supportUserCheck'),
            },
          ],
    },
    {
      key: 'primeChallenge',
      title: 'Prime Challenge',
      items: [
        {
          key: 'primeChallengeRanking',
          label: 'Ranking',
          icon: 'chart',
          active: view === 'primeChallengeRanking',
          onClick: () => navigate('primeChallengeRanking'),
          disabled: disabled('primeChallengeRanking'),
        },
        {
          key: 'primeChallengeWidget',
          label: 'Widget',
          icon: 'layout',
          active: view === 'primeChallengeWidget',
          onClick: () => navigate('primeChallengeWidget'),
          disabled: disabled('primeChallengeWidget'),
        },
      ],
    },
    {
      key: 'operations',
      title: 'Operations',
      items: [
        {
          key: 'commandCenter',
          label: t('sidebar.commandCenter'),
          icon: 'home',
          active: view === 'commandCenter',
          onClick: () => navigate('commandCenter'),
          disabled: disabled('commandCenter'),
        },
        {
          key: 'flows',
          label: t('sidebar.flows'),
          icon: 'chart',
          active: view === 'flows',
          onClick: () => navigate('flows'),
          disabled: disabled('flows'),
        },
        {
          key: 'orgChart',
          label: t('sidebar.orgChart'),
          icon: 'org',
          active: view === 'orgChart',
          onClick: () => navigate('orgChart'),
          disabled: disabled('orgChart'),
        },
        {
          key: 'upload',
          label: t('sidebar.upload'),
          icon: 'upload',
          active: view === 'upload',
          onClick: () => navigate('upload'),
          disabled: disabled('upload'),
        },
      ],
    },
    {
      key: 'finance',
      title: 'Finance',
      items: [
        {
          key: 'overview',
          label: t('sidebar.overview'),
          icon: 'home',
          active: view === 'overview',
          onClick: () => navigate('overview'),
          disabled: disabled('overview'),
        },
        {
          key: 'executive',
          label: t('sidebar.executiveSuite'),
          icon: 'briefcase',
          active: view === 'executive',
          onClick: () => goExecutiveSection('summary'),
          disabled: disabled('executive'),
          subitems:
            view === 'executive'
              ? [
                  {
                    key: 'executiveSummary',
                    label: t('sidebar.executive.summary'),
                    icon: 'chart',
                    active: executiveSection === 'summary',
                    onClick: () => goExecutiveSection('summary'),
                    disabled: disabled('executive'),
                  },
                  {
                    key: 'executiveView',
                    label: t('sidebar.executive.view'),
                    icon: 'layout',
                    active: executiveSection === 'view',
                    onClick: () => goExecutiveSection('view'),
                    disabled: disabled('executive'),
                  },
                ]
              : [],
        },
        {
          key: 'platformUsageBilling',
          label: t('sidebar.platformUsageBilling'),
          icon: 'card',
          active: view === 'platformUsageBilling',
          onClick: () => navigate('platformUsageBilling'),
          disabled: disabled('platformUsageBilling'),
        },
        {
          key: 'financeToolOrganigram',
          label: t('sidebar.financeToolOrganigram'),
          icon: 'org',
          active: view === 'financeToolOrganigram',
          onClick: () => navigate('financeToolOrganigram'),
          disabled: disabled('financeToolOrganigram'),
        },
      ],
    },
    {
      key: 'marketing',
      title: 'Marketing',
      items: [
        {
          key: 'whatsappPerformance',
          label: t('sidebar.whatsappPerformance'),
          icon: 'chart',
          active: view === 'whatsappPerformance',
          onClick: () => navigate('whatsappPerformance'),
          disabled: disabled('whatsappPerformance'),
        },
        {
          key: 'trustpilotGuide',
          label: t('sidebar.trustpilotGuide'),
          icon: 'chart',
          active: view === 'trustpilotGuide',
          onClick: () => navigate('trustpilotGuide'),
          disabled: disabled('trustpilotGuide'),
        },
        {
          key: 'whatsappTemplates',
          label: t('sidebar.whatsappTemplates'),
          icon: 'chat',
          active: view === 'whatsappTemplates',
          onClick: () => navigate('whatsappTemplates'),
          disabled: disabled('whatsappTemplates'),
        },
        {
          key: 'acuity',
          label: 'ACUITY Lab',
          icon: 'layout',
          active: view === 'acuity',
          onClick: () => navigate('acuity'),
          disabled: disabled('acuity'),
        },
        {
          key: 'customEvents',
          label: t('sidebar.customEvents'),
          icon: 'chart',
          active: view === 'customEvents',
          onClick: () => navigate('customEvents'),
          disabled: disabled('customEvents'),
        },
      ],
    },
    {
      key: 'solitics',
      title: 'SOLITICS',
      items: [
        {
          key: 'solitics',
          label: 'Journey Report',
          icon: 'layout',
          active: view === 'solitics',
          onClick: () => navigate('solitics'),
          disabled: disabled('solitics'),
        },
      ],
    },
    {
      key: 'dealing',
      title: 'Dealing',
      items: [
        {
          key: 'traderPointsSimulator',
          label: t('sidebar.traderPoints'),
          icon: 'layers',
          active: view === 'traderPointsSimulator',
          onClick: () => navigate('traderPointsSimulator'),
          disabled: disabled('traderPointsSimulator'),
        },
        {
          key: 'fraud',
          label: t('sidebar.fraud'),
          icon: 'shield',
          active: view === 'fraud',
          onClick: () => navigate('fraud'),
          disabled: disabled('fraud'),
        },
      ],
    },
    {
      key: 'standby',
      title: 'Standby',
      items: [
        {
          key: 'standbyClientsMoved',
          label: 'Cleints moved',
          icon: 'chart',
          active: view === 'affiliate' && affiliateSection === 'clientsMoved',
          onClick: () => goAffiliateSection('clientsMoved'),
          disabled: disabled('affiliate'),
        },
        {
          key: 'standbyAiAssistant',
          label: t('sidebar.aiAssistant'),
          icon: 'chat',
          active: view === 'aiAssistant',
          onClick: () => navigate('aiAssistant'),
          disabled: disabled('aiAssistant'),
        },
        {
          key: 'standbyReportsHub',
          label: 'Reports hub',
          icon: 'layout',
          active: view === 'reportsHub',
          onClick: () => navigate('reportsHub'),
          disabled: disabled('reportsHub'),
        },
        ...(isAdmin
          ? [
              {
                key: 'adminPasswords',
                label: 'Gestione Accessi',
                icon: 'shield',
                active: view === 'adminPasswords',
                onClick: () => navigate('adminPasswords'),
                disabled: false,
              },
            ]
          : []),
      ],
    },
  ]

  const visibleSectionGroups = trustpilotOnlyMode
    ? sectionGroups.filter((section) => section.key === 'support')
    : sectionGroups

  return (
    <div className="sidebar">
      {visibleSectionGroups.map((section) => (
        <section key={section.key} className={`sidebar-section sidebar-section--${section.key}`}>
          {section.key === 'standby' ? (
            <button
              type="button"
              className="sidebar-title"
              onClick={() => setIsStandbyOpen((open) => !open)}
              aria-expanded={isStandbyOpen}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{section.title}</span>
              <span aria-hidden="true" style={{ opacity: 0.8 }}>
                {isStandbyOpen ? '▾' : '▸'}
              </span>
            </button>
          ) : (
            <div className="sidebar-title">
              <span>{section.title}</span>
            </div>
          )}

          <div
            className="sidebar-list"
            style={section.key === 'standby' && !isStandbyOpen ? { display: 'none' } : undefined}
          >
            {section.items.map((item) => (
              <div key={item.key}>
                <button
                  disabled={item.disabled}
                  type="button"
                  className={`sidebar-item sidebar-main tab ${item.active ? 'active' : ''}`}
                  onClick={item.onClick}
                >
                  <span className="sidebar-item__content">
                    <span className="sidebar-item__icon" aria-hidden="true">
                      <Icon name={item.icon} />
                    </span>
                    <span className="sidebar-item__label">
                      <SidebarItemLabel label={item.label} itemKey={item.key} />
                    </span>
                  </span>
                </button>

                {Array.isArray(item.subitems) && item.subitems.length ? (
                  <div className="sidebar-subsection">
                    {item.subitems.map((subitem) => (
                      <button
                        key={subitem.key}
                        disabled={subitem.disabled}
                        type="button"
                        className={`sidebar-item sidebar-subitem tab ${subitem.active ? 'active' : ''}`}
                        onClick={subitem.onClick}
                      >
                        <span className="sidebar-item__content">
                          <span className="sidebar-item__icon" aria-hidden="true">
                            <Icon name={subitem.icon} size={14} />
                          </span>
                          <span className="sidebar-item__label">{subitem.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
