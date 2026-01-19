import { useCallback, useEffect, useMemo, useState } from 'react'
import FullPageLoader from '../../components/FullPageLoader'
import { useI18n } from '../../i18n/I18nContext'
import {
  clearBoardSessionToken,
  getBoardSessionToken,
  isShareToken,
  setBoardSessionToken,
  validateAffiliateReportsToken,
} from '../../features/affiliate-analysis/utils/shareAuth'

function readQueryParam(name) {
  if (typeof window === 'undefined') return ''
  try {
    return new window.URLSearchParams(window.location.search).get(name) || ''
  } catch {
    return ''
  }
}

function Icon({ children, size = 18, color = 'currentColor' }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flex: '0 0 auto',
      }}
    >
      {children}
    </span>
  )
}

function LockIcon({ size = 18, color }) {
  return (
    <Icon size={size} color={color}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.5 10V7.8C7.5 5.15 9.55 3 12 3s4.5 2.15 4.5 4.8V10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6.5 10h11c.83 0 1.5.67 1.5 1.5v7C19 19.33 18.33 20 17.5 20h-11C5.67 20 5 19.33 5 18.5v-7C5 10.67 5.67 10 6.5 10Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M12 14v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </Icon>
  )
}

function KeyIcon({ size = 18, color }) {
  return (
    <Icon size={size} color={color}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.5 14.5a4.5 4.5 0 1 1 3.86-6.82"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M11.36 7.68 21 17.32V21h-3v-2h-2v-2h-2l-2.64-2.64"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  )
}

function ArrowRightIcon({ size = 18, color }) {
  return (
    <Icon size={size} color={color}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  )
}

function TrashIcon({ size = 18, color }) {
  return (
    <Icon size={size} color={color}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M9 7V5.5C9 4.67 9.67 4 10.5 4h3C14.33 4 15 4.67 15 5.5V7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M7.5 7l1 14h7l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </Icon>
  )
}

function AlertIcon({ size = 18, color }) {
  return (
    <Icon size={size} color={color}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2 22 20H2L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </Icon>
  )
}

export default function BoardLoginPage() {
  const { t, locale, setLocale } = useI18n()
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const mapError = useCallback(
    (code) => {
      const c = String(code || '').toLowerCase()
      if (c === 'missing') return t('shareBoardLogin.error.missing')
      if (c === 'network') return t('shareBoardLogin.error.network')
      return t('shareBoardLogin.error.invalid')
    },
    [t]
  )

  const next = useMemo(() => {
    const n = readQueryParam('next')
    return n && n.startsWith('/share/') ? n : '/share/affiliate-reports'
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      // If token is provided via URL, prefer it over any stored session.
      const fromUrl = readQueryParam('token')
      if (fromUrl) return

      const existing = getBoardSessionToken()
      if (!existing) return

      setBusy(true)
      const res = await validateAffiliateReportsToken(existing)
      if (cancelled) return

      if (res.ok) {
        window.location.href = next
        return
      }

      clearBoardSessionToken()
      setBusy(false)
      setError(mapError(res.error))
    }

    run()
    return () => {
      cancelled = true
    }
  }, [next, mapError])

  const attemptLogin = useCallback(
    async (rawToken) => {
      if (busy) return
      setError('')
      setBusy(true)

      const clean = String(rawToken || '').trim()
      if (!clean) {
        setError(mapError('missing'))
        setBusy(false)
        return
      }

      if (!isShareToken(clean)) {
        setError(mapError('invalid'))
        setBusy(false)
        return
      }

      const res = await validateAffiliateReportsToken(clean)
      if (!res.ok) {
        setError(mapError(res.error))
        setBusy(false)
        return
      }

      setBoardSessionToken(clean)
      window.location.href = next
    },
    [busy, mapError, next]
  )

  useEffect(() => {
    const fromUrl = readQueryParam('token')
    if (!fromUrl) return

    const run = async () => {
      setToken(fromUrl)
      // Auto-login when a token is provided via URL
      await attemptLogin(fromUrl)
    }

    run()
  }, [next, attemptLogin])

  const onSubmit = async (e) => {
    e.preventDefault()
    await attemptLogin(token)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        position: 'relative',
      }}
    >
      {/* Subtle decorative glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(900px 420px at 20% 10%, rgba(34,211,238,0.14), rgba(34,211,238,0.00) 65%), radial-gradient(700px 380px at 80% 20%, rgba(99,102,241,0.10), rgba(99,102,241,0.00) 60%)',
          pointerEvents: 'none',
          opacity: 0.9,
        }}
      />

      <div
        style={{ maxWidth: 760, margin: '0 auto', padding: '64px 20px 44px', position: 'relative' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              className="card card-global"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: '1px solid rgba(34,211,238,0.18)',
                background:
                  'linear-gradient(180deg, rgba(34,211,238,0.14), rgba(255,255,255,0.02))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 14px 40px rgba(0,0,0,0.25)',
              }}
            >
              <LockIcon size={20} color="rgba(34,211,238,0.95)" />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    fontWeight: 900,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                  }}
                >
                  {t('shareBoardLogin.eyebrow')}
                </div>
                <div
                  className="card card-global"
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'rgba(34,211,238,0.90)',
                    fontWeight: 900,
                    fontSize: 12,
                    letterSpacing: 0.2,
                  }}
                >
                  {t('shareBoardLogin.badge.readOnly')}
                </div>
              </div>

              <h1 style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 950, letterSpacing: -0.2 }}>
                {t('shareBoardLogin.title')}
              </h1>
              <div
                style={{
                  marginTop: 8,
                  color: 'var(--muted)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  maxWidth: 560,
                }}
              >
                {t('shareBoardLogin.subtitle')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setLocale('en')}
              className="card card-global"
              style={{
                padding: '8px 10px',
                borderRadius: 12,
                border:
                  locale === 'en'
                    ? '1px solid rgba(34,211,238,0.55)'
                    : '1px solid rgba(255,255,255,0.12)',
                background: locale === 'en' ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.02)',
                color: 'var(--text)',
                fontWeight: 950,
                cursor: 'pointer',
                lineHeight: 1,
                minWidth: 44,
              }}
            >
              EN
            </button>
            <button
              onClick={() => setLocale('it')}
              className="card card-global"
              style={{
                padding: '8px 10px',
                borderRadius: 12,
                border:
                  locale === 'it'
                    ? '1px solid rgba(34,211,238,0.55)'
                    : '1px solid rgba(255,255,255,0.12)',
                background: locale === 'it' ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.02)',
                color: 'var(--text)',
                fontWeight: 950,
                cursor: 'pointer',
                lineHeight: 1,
                minWidth: 44,
              }}
            >
              IT
            </button>
          </div>
        </div>

        <div
          className="card card-global"
          style={{
            marginTop: 18,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}
        >
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
            >
              {t('shareBoardLogin.field.accessCode')}
            </label>
            <div style={{ position: 'relative' }}>
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.95,
                }}
              >
                <KeyIcon size={18} color="rgba(148,163,184,0.95)" />
              </div>

              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('shareBoardLogin.field.placeholder')}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: 12,
                  border: error
                    ? '1px solid rgba(239,68,68,0.55)'
                    : '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(0,0,0,0.18)',
                  color: 'var(--text)',
                  outline: 'none',
                  fontSize: 14,
                  fontWeight: 750,
                  boxShadow: error
                    ? '0 0 0 4px rgba(239,68,68,0.08)'
                    : '0 0 0 0 rgba(34,211,238,0)',
                  transition: 'box-shadow 140ms ease, border-color 140ms ease, transform 80ms ease',
                }}
              />
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
              {t('shareBoardLogin.helper')}
            </div>

            {error && (
              <div
                className="card card-global"
                style={{
                  marginTop: 6,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(239,68,68,0.25)',
                  background: 'linear-gradient(180deg, rgba(239,68,68,0.12), rgba(0,0,0,0.12))',
                  color: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <AlertIcon size={18} color="rgba(239,68,68,0.95)" />
                <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.35 }}>{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="card card-global"
              style={{
                marginTop: 6,
                padding: '12px 12px',
                borderRadius: 12,
                border: '1px solid rgba(34,211,238,0.30)',
                background: 'rgba(34,211,238,0.12)',
                color: 'var(--text)',
                fontWeight: 900,
                cursor: busy ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <LockIcon size={18} color="rgba(34,211,238,0.95)" />
              <span>{busy ? t('common.loading') : t('shareBoardLogin.cta')}</span>
              <ArrowRightIcon size={18} color="rgba(203,213,225,0.95)" />
            </button>

            <button
              type="button"
              onClick={() => {
                clearBoardSessionToken()
                setToken('')
                setError('')
              }}
              className="card card-global"
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--muted)',
                fontWeight: 900,
                cursor: busy ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
              disabled={busy}
            >
              <TrashIcon size={18} color="rgba(148,163,184,0.95)" />
              {t('shareBoardLogin.clear')}
            </button>

            <div
              className="card card-global"
              style={{
                marginTop: 6,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.015)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                color: 'var(--muted)',
                lineHeight: 1.5,
                fontSize: 12,
              }}
            >
              <LockIcon size={18} color="rgba(148,163,184,0.95)" />
              <div>{t('shareBoardLogin.note')}</div>
            </div>
          </form>
        </div>

        {busy && <FullPageLoader progress={40} subtitle={t('common.loading')} />}
      </div>
    </div>
  )
}
