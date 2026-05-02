import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { sections } from '../pages/orgChartData'
import { trackEvent } from '../services/trackingService'
import { translate } from '../i18n/translations'

const AuthContext = createContext({
  user: null,
  token: null,
  allowlist: [],
  authReady: false,
  loginWithEmail: async () => ({ success: false }),
  logout: () => {},
})
const TOKEN_KEY = 'bw-auth-token'
const USER_KEY = 'bw-auth-user'

function buildAllowlist() {
  const deduped = new Map()

  const allowDept = (department = '', sectionId = '') => {
    const d = department.trim().toLowerCase()
    if (sectionId === 'management-team') return true
    if (sectionId === 'finance') return true
    if (sectionId === 'support-team') return true
    if (sectionId === 'business-development') return true
    return (
      d === 'finance' ||
      d === 'reconciliation' ||
      d === 'psp' ||
      d === 'support team' ||
      d === 'support'
    )
  }

  sections.forEach((section) => {
    const roles = section?.roles || []
    roles.forEach((role) => {
      const email = (role.email || '').trim()
      if (!email || email === '—') return
      if (!allowDept(role.department || '', section.id)) return
      const key = email.toLowerCase()
      const prev = deduped.get(key)
      const isManagementTeam = Boolean(prev?.isManagementTeam || section.id === 'management-team')
      deduped.set(key, {
        name: role.name,
        email,
        division: role.division || '',
        department: role.department || '',
        title: role.title || '',
        isManagementTeam,
      })
    })
  })

  return Array.from(deduped.values())
}

export function AuthProvider({ children }) {
  const allowlist = useMemo(() => buildAllowlist(), [])
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  // authReady: true once the token verification attempt (or its absence) is settled.
  const [authReady, setAuthReady] = useState(false)

  // On mount: if a token exists in localStorage, verify it with the server.
  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null
    const storedToken = token

    if (!storedToken) {
      setAuthReady(true)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: storedToken }),
        })
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          if (data.ok && data.email) {
            const match = allowlist.find((e) => e.email.toLowerCase() === data.email.toLowerCase())
            if (match) {
              setUser(match)
              setToken(storedToken)
            } else {
              // Token valid but email no longer in allowlist – force logout
              window.localStorage.removeItem(TOKEN_KEY)
              window.localStorage.removeItem(USER_KEY)
            }
          } else {
            window.localStorage.removeItem(TOKEN_KEY)
            window.localStorage.removeItem(USER_KEY)
          }
        } else {
          window.localStorage.removeItem(TOKEN_KEY)
          window.localStorage.removeItem(USER_KEY)
        }
      } catch {
        // Network error – keep token, user stays logged out until next attempt
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [allowlist])

  const loginWithEmail = useCallback(
    async (emailInput, password) => {
      const normalized = (emailInput || '').trim().toLowerCase()
      if (!normalized) return { success: false, message: 'Please enter an email.' }
      if (!password) return { success: false, message: 'Please enter a password.' }

      // Check allowlist first (client-side gate)
      const match = allowlist.find((entry) => entry.email.toLowerCase() === normalized)
      if (!match) {
        const locale =
          typeof window !== 'undefined' ? window.localStorage.getItem('bw-locale') || 'en' : 'en'
        return { success: false, message: translate(locale, 'auth.emailNotAllowlisted') }
      }

      // Verify password server-side
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized, password }),
        })
        const data = await res.json()

        if (!res.ok || !data.ok) {
          return { success: false, message: data.error || 'Invalid credentials.' }
        }

        // Store token and user
        window.localStorage.setItem(TOKEN_KEY, data.token)
        window.localStorage.setItem(USER_KEY, JSON.stringify(match))
        setToken(data.token)
        setUser(match)

        trackEvent({
          type: 'LOGIN',
          userEmail: match.email,
          userName: match.name,
          userRole: match.title || match.department,
        })

        return { success: true, user: match }
      } catch (err) {
        return { success: false, message: 'Connection error. Please try again.' }
      }
    },
    [allowlist]
  )

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(USER_KEY)
    }
    setUser(null)
    setToken(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, allowlist, authReady, loginWithEmail, logout }),
    [user, token, allowlist, authReady, loginWithEmail, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
