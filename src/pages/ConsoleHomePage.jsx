import { useMemo } from 'react'

import { useI18n } from '../i18n/I18nContext'
import { getTopSectionsForUser } from '../services/trackingService'

// Inverse of AuthenticatedApp viewToSection — maps sectionId → viewKey
const SECTION_TO_VIEW = {
  overview: 'overview',
  affiliate: 'affiliate',
  executive: 'executive',
  'fraud-monitoring': 'fraud',
  'project-board': 'projectBoard',
  notion: 'notion',
  summary: 'summary',
  'retention-profitable-ranking': 'profitableRanking',
  'prime-challenge-ranking': 'primeChallengeRanking',
  'prime-challenge-widget': 'primeChallengeWidget',
  'retention-segment-composition': 'segmentComposition',
  'retention-sales-agents-monitor': 'salesAgentsMonitor',
  'retention-master-templates': 'masterTemplates',
  'retention-email-master-template': 'emailMasterTemplate',
  'org-chart': 'orgChart',
  'platform-usage-billing': 'platformUsageBilling',
  'finance-tool-organigram': 'financeToolOrganigram',
  'support-user-check': 'supportUserCheck',
  'support-ai-assistant': 'aiAssistant',
  'trustpilot-guide': 'trustpilotGuide',
  'reports-hub': 'reportsHub',
  upload: 'upload',
  'trader-points': 'traderPointsSimulator',
  'admin-panel': 'admin',
  'command-center': 'commandCenter',
}

function normalizeRoleText(user) {
  if (!user) return ''
  return String(user.title || user.department || '').trim()
}

function roleMeta(user) {
  const department = String(user?.department || '')
    .trim()
    .toLowerCase()
  const title = String(user?.title || '')
    .trim()
    .toLowerCase()
  const isManagement = Boolean(user?.isManagementTeam)

  const isSupport = department.includes('support') || title.includes('support')
  const isFinance =
    department.includes('finance') ||
    department.includes('reconciliation') ||
    department.includes('psp') ||
    title.includes('finance') ||
    title.includes('reconciliation') ||
    title.includes('psp')
  const isBusinessDev =
    department.includes('business development') ||
    department.includes('sales') ||
    title.includes('business development') ||
    title.includes('sales')

  if (isManagement) return { icon: '🧭', kind: 'management' }
  if (isFinance) return { icon: '💰', kind: 'finance' }
  if (isSupport) return { icon: '🎧', kind: 'support' }
  if (isBusinessDev) return { icon: '🤝', kind: 'businessDev' }
  return { icon: '📊', kind: 'default' }
}

export default function ConsoleHomePage({ user, supportOnly, allowedViews, onNavigate }) {
  const { t } = useI18n()

  const meta = useMemo(() => roleMeta(user), [user])
  const roleText = useMemo(() => normalizeRoleText(user), [user])

  const canGo = (viewKey) => {
    if (!supportOnly) return true
    if (allowedViews && typeof allowedViews.has === 'function') return allowedViews.has(viewKey)
    return false
  }

  const go = (viewKey) => {
    if (typeof onNavigate !== 'function') return
    onNavigate(viewKey)
  }

  const name = String(user?.name || '').trim()
  const welcome = name ? t('home.welcome.personal', { name }) : t('home.welcome.generic')

  const sectionCards = [
    {
      key: 'commandCenter',
      title: t('sidebar.commandCenter'),
      desc: t('home.action.commandCenter'),
      kicker: 'Operations',
      area: 'Operations',
      emoji: '🧭',
      tone: 'accent',
    },
    {
      key: 'projectBoard',
      title: t('sidebar.projectBoard'),
      desc: t('home.action.tasks'),
      kicker: 'Operations',
      area: 'Operations',
      emoji: '✅',
      tone: 'accent',
    },
    {
      key: 'flows',
      title: t('sidebar.flows'),
      desc: t('home.action.flows'),
      kicker: 'Operations',
      area: 'Operations',
      emoji: '🧬',
      tone: 'info',
    },
    {
      key: 'overview',
      title: t('sidebar.overview'),
      desc: t('home.action.dashboard'),
      kicker: 'Finance',
      area: 'Finance',
      emoji: '📈',
      tone: 'accent',
    },
    {
      key: 'executive',
      title: t('sidebar.executiveSuite'),
      desc: t('home.action.executiveSuite'),
      kicker: 'Finance',
      area: 'Finance',
      emoji: '🧠',
      tone: 'success',
    },
    {
      key: 'affiliate',
      title: t('sidebar.affiliate'),
      desc: t('home.action.affiliateHub'),
      kicker: 'Sales',
      area: 'Sales',
      emoji: '🤝',
      tone: 'warning',
    },
    {
      key: 'fraud',
      title: t('sidebar.fraud'),
      desc: t('home.action.fraud'),
      kicker: 'Dealing',
      area: 'Dealing',
      emoji: '🛡️',
      tone: 'danger',
    },
    {
      key: 'traderPointsSimulator',
      title: t('sidebar.traderPoints'),
      desc: t('home.action.traderPoints'),
      kicker: 'Dealing',
      area: 'Dealing',
      emoji: '🎯',
      tone: 'info',
    },
    {
      key: 'profitableRanking',
      title: t('sidebar.profitableRanking'),
      desc: t('home.action.profitableRanking'),
      kicker: 'Sales',
      area: 'Sales',
      emoji: '🏅',
      tone: 'success',
    },
    {
      key: 'segmentComposition',
      title: 'Segment Composition',
      desc: 'Standalone customer-base segmentation view for retention and winback clusters.',
      kicker: 'Sales',
      area: 'Sales',
      emoji: '🧩',
      tone: 'info',
    },
    {
      key: 'supportUserCheck',
      title: t('sidebar.supportUserCheck'),
      desc: t('home.action.userCheck'),
      kicker: 'Support',
      area: 'Support',
      emoji: '🎧',
      tone: 'warning',
    },
    {
      key: 'aiAssistant',
      title: t('sidebar.aiAssistant'),
      desc: t('home.action.aiAssistant'),
      kicker: 'Support',
      area: 'Support',
      emoji: '💬',
      tone: 'success',
    },
    {
      key: 'orgChart',
      title: t('sidebar.orgChart'),
      desc: t('home.action.orgChart'),
      kicker: 'Operations',
      area: 'Operations',
      emoji: '🧩',
      tone: 'accent',
    },
    {
      key: 'upload',
      title: t('sidebar.upload'),
      desc: t('home.action.upload'),
      kicker: 'Operations',
      area: 'Operations',
      emoji: '⬆️',
      tone: 'accent',
    },
    {
      key: 'reportsHub',
      title: 'Reports Hub',
      desc: 'Apri i report esterni e interni direttamente dalla console.',
      kicker: 'Operations',
      area: 'Operations',
      emoji: '📄',
      tone: 'info',
    },
  ]

  const areaOrder = ['Sales', 'Support', 'Operations', 'Finance', 'Marketing', 'Dealing']

  const areaSections = areaOrder
    .map((area) => ({
      area,
      cards: sectionCards.filter((card) => card.area === area),
    }))
    .filter((section) => section.cards.length > 0)

  // Smart quick access: top visited sections for the current user
  const smartCards = useMemo(() => {
    const email = user?.email || user?.userEmail || ''
    if (!email) return []
    const topSections = getTopSectionsForUser(email, 6)
    return topSections
      .map(({ sectionId, count }) => {
        const viewKey = SECTION_TO_VIEW[sectionId]
        if (!viewKey) return null
        const card = sectionCards.find((c) => c.key === viewKey)
        if (!card) return null
        return { ...card, visitCount: count }
      })
      .filter(Boolean)
      .filter((card) => canGo(card.key))
  }, [user?.email, user?.userEmail])

  const hasSmartCards = smartCards.length >= 2

  return (
    <div className="console-home">
      <div className="console-home__inner">
        <div
          className="console-home__roleIcon"
          aria-hidden="true"
          title={roleText || t('home.role.default')}
        >
          {meta.icon}
        </div>

        <div className="console-home__welcome">{welcome}</div>
        <div className="console-home__roleText">{roleText || t('home.role.default')}</div>

        {/* ── Smart Quick Access ── */}
        <div className="console-home__quickAccess">
          <div className="console-home__quickAccess-header">
            <span className="console-home__quickAccess-icon" aria-hidden="true">
              ⚡
            </span>
            <span className="console-home__quickAccess-title">Quick Access</span>
            <span className="console-home__quickAccess-badge">personalizzato per te</span>
          </div>

          {hasSmartCards ? (
            <div className="card-columns console-home__actions" role="list">
              {smartCards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  className={`card card-global console-home__action console-home__action--${card.tone} console-home__action--smart`}
                  onClick={() => go(card.key)}
                  disabled={!canGo(card.key)}
                  role="listitem"
                >
                  <div className="console-home__actionTop">
                    <div className="console-home__actionEmoji" aria-hidden="true">
                      {card.emoji}
                    </div>
                    <div className="console-home__smartVisits">
                      {card.visitCount} {card.visitCount === 1 ? 'visita' : 'visite'}
                    </div>
                  </div>
                  <h3 className="console-home__actionTitle">{card.title}</h3>
                  <div className="console-home__actionDesc">{card.desc}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="console-home__quickAccess-empty">
              Naviga la console per sbloccare i tuoi accessi rapidi intelligenti.
            </div>
          )}
        </div>

        <div className="console-home__sectionLabel">Areas</div>

        <div className="console-home__areaSections">
          {areaSections.map((section) => (
            <section key={section.area} className="console-home__areaSection">
              <div className="console-home__areaHeader">
                <h2 className="console-home__areaTitle">{section.area}</h2>
              </div>
              <div className="card-columns console-home__actions" role="list">
                {section.cards.map((card) => (
                  <button
                    key={card.key}
                    type="button"
                    className={`card card-global console-home__action console-home__action--${card.tone}`}
                    onClick={() => go(card.key)}
                    disabled={!canGo(card.key)}
                    role="listitem"
                  >
                    <div className="console-home__actionTop">
                      <div className="console-home__actionEmoji" aria-hidden="true">
                        {card.emoji}
                      </div>
                      <div className="console-home__actionKicker">{card.kicker}</div>
                    </div>
                    <h3 className="console-home__actionTitle">{card.title}</h3>
                    <div className="console-home__actionDesc">{card.desc}</div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {supportOnly ? (
          <div className="console-home__note">{t('home.quickActions.noteRestricted')}</div>
        ) : null}
      </div>
    </div>
  )
}
