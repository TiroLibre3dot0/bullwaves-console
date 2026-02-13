import React, { useMemo } from 'react'

import { useI18n } from '../i18n/I18nContext'

function normalizeRoleText(user) {
  if (!user) return ''
  const raw = String(user.title || user.department || '').trim()
  return raw
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
    <div className="w-full" style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 820,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 14,
          padding: '28px 12px',
          minHeight: '60vh',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-hidden="true"
          title={roleText || t('home.role.default')}
        >
          {meta.icon}
        </div>

        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2 }}>{welcome}</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: -6 }}>
          {roleText || t('home.role.default')}
        </div>

        <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
          {t('home.quickActions.title')}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <button
            className="btn"
            onClick={() => go('commandCenter')}
            disabled={!canGo('commandCenter')}
          >
            {t('sidebar.commandCenter')}
          </button>
          <button className="btn" onClick={() => go('overview')} disabled={!canGo('overview')}>
            {t('sidebar.dashboard')}
          </button>
          <button
            className="btn"
            onClick={() => go('supportUserCheck')}
            disabled={!canGo('supportUserCheck')}
          >
            {t('sidebar.supportUserCheck')}
          </button>
        </div>

        {supportOnly && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
            {t('home.quickActions.noteRestricted')}
          </div>
        )}
      </div>
    </div>
  )
}
