import React, { useEffect, useMemo, useState } from 'react'
import { DataStatusProvider } from '../../../context/DataStatusContext'
import { useAuth } from '../../../context/AuthContext'
import FullPageLoader from '../../../components/FullPageLoader'
import { useI18n } from '../../../i18n/I18nContext'

const SupportUserCheck = React.lazy(() => import('./SupportUserCheck'))

function loadLocalSharePayload(token) {
  if (typeof window === 'undefined') return null
  try {
    const key = `bw_share_support_user_check:${token}`
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.payload && typeof parsed.payload === 'object' ? parsed.payload : null
  } catch {
    return null
  }
}

export default function SupportUserCheckSharePage({ token = '' }) {
  const { user, logout } = useAuth()
  const { t } = useI18n()

  const [sharePayload, setSharePayload] = useState(null)
  const [loadingShare, setLoadingShare] = useState(Boolean(token))

  const shareConfig = useMemo(() => {
    const m = sharePayload?.m && typeof sharePayload.m === 'object' ? sharePayload.m : null
    return {
      token,
      mask: {
        pii: Boolean(m?.pii),
        commissions: Boolean(m?.comm),
        affiliateRevenue: Boolean(m?.arev),
      },
    }
  }, [sharePayload, token])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!token) {
        setSharePayload(null)
        setLoadingShare(false)
        return
      }

      // Local dev / no-KV fallback
      if (token.startsWith('share_local_')) {
        const local = loadLocalSharePayload(token)
        if (!cancelled) {
          setSharePayload(local)
          setLoadingShare(false)
        }
        return
      }

      setLoadingShare(true)
      try {
        const resp = await fetch(`/api/share/support-user-check/${encodeURIComponent(token)}`)
        const data = await resp.json().catch(() => null)
        const payload = data?.payload
        if (resp.ok && payload && payload.k === 'suc') {
          if (!cancelled) setSharePayload(payload)
        } else {
          if (!cancelled) setSharePayload(null)
        }
      } catch {
        if (!cancelled) setSharePayload(null)
      } finally {
        if (!cancelled) setLoadingShare(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    if (!user?.email) return

    const device = {
      tz: (() => {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone
        } catch {
          return ''
        }
      })(),
      lang: typeof navigator !== 'undefined' ? navigator.language : '',
      platform: typeof navigator !== 'undefined' ? navigator.platform : '',
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      w: typeof window !== 'undefined' ? window.innerWidth : 0,
      h: typeof window !== 'undefined' ? window.innerHeight : 0,
      dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    }

    // best-effort tracking; never block UI
    fetch('/api/share/support-user-check/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        event: 'OPEN',
        userEmail: user.email,
        userName: user.name,
        userRole: user.title || user.department,
        device,
      }),
    }).catch(() => {})
  }, [token, user])

  return (
    <DataStatusProvider>
      <div className="app-root">
        <header
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.2px' }}>
              {t('support.userCheck.title')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {t('support.userCheck.pageShare.badge')}
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            {user?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Avatar con iniziali */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#6366f1 60%,#0ea5e9 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 4px 0 rgba(0,0,0,0.10)',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                  title={user.name || user.email}
                >
                  {user.name
                    ? user.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                    : user.email.split('@')[0].slice(0, 2)}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#fff',
                      maxWidth: 160,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={user.name || user.email}
                  >
                    {user.name || user.email}
                  </div>
                  {user.title || user.department ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#a5b4fc',
                        fontWeight: 600,
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={user.title || user.department}
                    >
                      {user.title || user.department}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
            <button
              type="button"
              className="btn secondary"
              onClick={logout}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 14,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(99,102,241,0.10)',
                color: '#6366f1',
                border: '1px solid #6366f1',
                fontWeight: 700,
                boxShadow: '0 1px 4px 0 rgba(99,102,241,0.08)',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              title="Logout"
            >
              <span style={{ fontSize: 18, marginRight: 2 }}>⎋</span> Logout
            </button>
          </div>
        </header>

        <div className="dashboard-shell">
          <main className="dashboard-content" style={{ padding: '14px 0' }}>
            <div className="dashboard-inner" style={{ gap: 0 }}>
              {loadingShare ? (
                <FullPageLoader progress={35} subtitle={t('common.loading')} />
              ) : (
                <React.Suspense
                  fallback={<FullPageLoader progress={35} subtitle={t('common.loading')} />}
                >
                  <SupportUserCheck shareConfig={shareConfig} />
                </React.Suspense>
              )}
            </div>
          </main>
        </div>
      </div>
    </DataStatusProvider>
  )
}
