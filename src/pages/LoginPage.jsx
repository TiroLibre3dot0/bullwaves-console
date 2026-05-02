import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export default function LoginPage() {
  const { loginWithEmail } = useAuth()
  const { t, locale, setLocale, locales } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [messageIndex, setMessageIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const typingMessages = useMemo(
    () => [t('login.typing.welcome'), t('login.typing.access'), t('login.typing.allowlist')],
    [t]
  )

  useEffect(() => {
    const current = typingMessages[messageIndex]
    const atEnd = charIndex === current.length
    const atStart = charIndex === 0
    const pause = !isDeleting && atEnd ? 700 : isDeleting && atStart ? 200 : 0
    const interval = setTimeout(
      () => {
        if (!isDeleting) {
          const next = charIndex + 1
          setCharIndex(next)
          setDisplayed(current.slice(0, next))
          if (next === current.length) setIsDeleting(true)
        } else {
          const next = Math.max(charIndex - 1, 0)
          setCharIndex(next)
          setDisplayed(current.slice(0, next))
          if (next === 0) {
            setIsDeleting(false)
            setMessageIndex((messageIndex + 1) % typingMessages.length)
          }
        }
      },
      pause || (isDeleting ? 40 : 85)
    )
    return () => clearTimeout(interval)
  }, [charIndex, isDeleting, messageIndex, typingMessages])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await loginWithEmail(email, password)
    setLoading(false)
    if (!result.success) {
      setError(result.message || t('login.error.unable'))
    }
  }

  const openOrgChart = () => {
    window.open('/org-chart', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="login-shell">
      <div className="login-brand" aria-label="Bullwaves">
        <img src="/Logo.png" alt="Bullwaves" loading="eager" />
      </div>
      <div className="login-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div />
          <div className="lang-switch" title={t('lang.label')}>
            <select
              className="lang-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              aria-label={t('lang.label')}
            >
              {locales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="login-typing" aria-live="polite">
          {displayed}
        </div>
        <div className="login-title">{t('login.title')}</div>
        <p className="login-subtitle">{t('login.subtitle')}</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-label" htmlFor="email">
            {t('login.workEmail')}
          </label>
          <div className="login-input-wrap">
            <div className="login-icon" aria-hidden="true">
              <img src="/favicon.png" alt="Bullwaves" loading="lazy" />
            </div>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder={t('login.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <label className="login-label" htmlFor="password" style={{ marginTop: 12 }}>
            Password
          </label>
          <div className="login-input-wrap">
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="login-hint">{t('login.hint')}</div>
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="btn login-btn" disabled={loading}>
            {loading ? '...' : t('login.continue')}
          </button>
        </form>

        <div className="login-meta">
          <button type="button" className="linkish" onClick={openOrgChart}>
            {t('login.viewOrgChart')}
          </button>
        </div>
      </div>
    </div>
  )
}
