import React, { useMemo } from 'react'

import { useI18n } from '../i18n/I18nContext'

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
      kicker: t('sidebar.projectManagement'),
      emoji: '🧭',
      tone: 'accent',
    },
    {
      key: 'projectBoard',
      title: t('sidebar.projectBoard'),
      desc: t('home.action.tasks'),
      kicker: t('sidebar.projectManagement'),
      emoji: '✅',
      tone: 'accent',
    },
    {
      key: 'flows',
      title: t('sidebar.flows'),
      desc: t('home.action.flows'),
      kicker: t('sidebar.projectManagement'),
      emoji: '🧬',
      tone: 'info',
    },
    {
      key: 'overview',
      title: t('sidebar.overview'),
      desc: t('home.action.dashboard'),
      kicker: t('sidebar.dashboard'),
      emoji: '📈',
      tone: 'accent',
    },
    {
      key: 'executive',
      title: t('sidebar.executiveSuite'),
      desc: t('home.action.executiveSuite'),
      kicker: t('sidebar.dashboard'),
      emoji: '🧠',
      tone: 'success',
    },
    {
      key: 'affiliate',
      title: t('sidebar.affiliate'),
      desc: t('home.action.affiliateHub'),
      kicker: t('sidebar.affiliate'),
      emoji: '🤝',
      tone: 'warning',
    },
    {
      key: 'fraud',
      title: t('sidebar.fraud'),
      desc: t('home.action.fraud'),
      kicker: t('sidebar.dashboard'),
      emoji: '🛡️',
      tone: 'danger',
    },
    {
      key: 'traderPointsSimulator',
      title: t('sidebar.traderPoints'),
      desc: t('home.action.traderPoints'),
      kicker: t('sidebar.dashboard'),
      emoji: '🎯',
      tone: 'info',
    },
    {
      key: 'profitableRanking',
      title: t('sidebar.profitableRanking'),
      desc: t('home.action.profitableRanking'),
      kicker: t('sidebar.dashboard'),
      emoji: '🏅',
      tone: 'success',
    },
    {
      key: 'supportUserCheck',
      title: t('sidebar.supportUserCheck'),
      desc: t('home.action.userCheck'),
      kicker: t('sidebar.support'),
      emoji: '🎧',
      tone: 'warning',
    },
    {
      key: 'orgChart',
      title: t('sidebar.orgChart'),
      desc: t('home.action.orgChart'),
      kicker: t('sidebar.ops'),
      emoji: '🧩',
      tone: 'accent',
    },
    {
      key: 'upload',
      title: t('sidebar.upload'),
      desc: t('home.action.upload'),
      kicker: t('sidebar.ops'),
      emoji: '⬆️',
      tone: 'accent',
    },
  ]

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

        <div className="console-home__sectionLabel">{t('home.quickActions.title')}</div>

        <div className="card-columns console-home__actions" role="list">
          {sectionCards.map((card) => (
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

        {supportOnly ? (
          <div className="console-home__note">{t('home.quickActions.noteRestricted')}</div>
        ) : null}
      </div>
    </div>
  )
}
