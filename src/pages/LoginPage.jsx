import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const typingMessages = ['Welcome to Bullwaves Intelligence', 'Management-only access', 'Email allowlist enforced']

export default function LoginPage() {
  const { loginWithEmail, allowlist } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const current = typingMessages[messageIndex]
    const atEnd = charIndex === current.length
    const atStart = charIndex === 0
    const pause = (!isDeleting && atEnd) ? 700 : (isDeleting && atStart ? 200 : 0)
    const interval = setTimeout(() => {
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
    }, pause || (isDeleting ? 40 : 85))
    return () => clearTimeout(interval)
  }, [charIndex, isDeleting, messageIndex])

  const allowlistPreview = useMemo(() => allowlist.map((person) => person.name).join(' • '), [allowlist])

  const onSubmit = (e) => {
    e.preventDefault()
    const result = loginWithEmail(email)
    if (!result.success) {
      setError(result.message || 'Unable to log in.')
      return
    }
    setError('')
  }

  const openOrgChart = () => {
    window.open('/org-chart', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-pill subtle">Management access only</div>
        <div className="login-typing" aria-live="polite">{displayed}</div>
        <div className="login-title">Bullwaves Intelligence</div>
        <p className="login-subtitle">Enter your work email to continue. Passwords are not required.</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-label" htmlFor="email">Work email</label>
          <div className="login-input-wrap">
            <div className="login-icon" aria-hidden="true">
              <img src="/favicon.png" alt="Bullwaves" loading="lazy" />
            </div>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="you@bullwaves.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="login-hint">Only management emails from the org chart will be accepted.</div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button type="submit" className="btn login-btn">Continue</button>
        </form>

        <div className="login-meta">
          <button type="button" className="linkish" onClick={openOrgChart}>View Organization Chart ↗</button>
        </div>

        {allowlistPreview && (
          <div className="login-allowlist" aria-label="Allowlisted management">
            <div className="allowlist-label">Who can log in</div>
            <div className="allowlist-names">{allowlistPreview}</div>
          </div>
        )}
      </div>
    </div>
  )
}
