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
          <button
            type="button"
            className="card card-global console-home__action"
            onClick={() => go('commandCenter')}
            disabled={!canGo('commandCenter')}
            role="listitem"
          >
            <h3 className="console-home__actionTitle">{t('sidebar.commandCenter')}</h3>
            <div className="console-home__actionDesc">{t('home.action.commandCenter')}</div>
            <div className="console-home__preview" aria-hidden="true">
              <span className="console-home__previewPill">{t('home.preview.commandCenter.1')}</span>
              <span className="console-home__previewPill">{t('home.preview.commandCenter.2')}</span>
              <span className="console-home__previewPill">{t('home.preview.commandCenter.3')}</span>
            </div>
          </button>

          <button
            type="button"
            className="card card-global console-home__action"
            onClick={() => go('overview')}
            disabled={!canGo('overview')}
            role="listitem"
          >
            <h3 className="console-home__actionTitle">{t('sidebar.dashboard')}</h3>
            <div className="console-home__actionDesc">{t('home.action.dashboard')}</div>
            <div className="console-home__preview" aria-hidden="true">
              <span className="console-home__previewPill">{t('home.preview.dashboard.1')}</span>
              <span className="console-home__previewPill">{t('home.preview.dashboard.2')}</span>
              <span className="console-home__previewPill">{t('home.preview.dashboard.3')}</span>
            </div>
          </button>

          <button
            type="button"
            className="card card-global console-home__action"
            onClick={() => go('supportUserCheck')}
            disabled={!canGo('supportUserCheck')}
            role="listitem"
          >
            <h3 className="console-home__actionTitle">{t('sidebar.supportUserCheck')}</h3>
            <div className="console-home__actionDesc">{t('home.action.userCheck')}</div>
            <div className="console-home__preview" aria-hidden="true">
              <span className="console-home__previewPill">{t('home.preview.userCheck.1')}</span>
              <span className="console-home__previewPill">{t('home.preview.userCheck.2')}</span>
              <span className="console-home__previewPill">{t('home.preview.userCheck.3')}</span>
            </div>
          </button>
        </div>

        {supportOnly ? (
          <div className="console-home__note">{t('home.quickActions.noteRestricted')}</div>
        ) : null}
      </div>
    </div>
  )
}
