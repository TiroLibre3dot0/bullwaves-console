import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { sections } from '../pages/orgChartData'

const AuthContext = createContext({ user: null, allowlist: [], loginWithEmail: () => ({ success: false }), logout: () => {} })
const STORAGE_KEY = 'bw-auth-user'

function buildManagementAllowlist() {
  const managementSection = sections.find((section) => section.id === 'management-team')
  const roles = managementSection?.roles || []
  const deduped = new Map()

  roles.forEach((role) => {
    const email = (role.email || '').trim()
    if (!email || email === '—') return
    const key = email.toLowerCase()
    deduped.set(key, {
      name: role.name,
      email,
      division: role.division || '',
      department: role.department || '',
      title: role.title || '',
    })
  })

  return Array.from(deduped.values())
}

export function AuthProvider({ children }) {
  const allowlist = useMemo(() => buildManagementAllowlist(), [])
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      const match = allowlist.find((entry) => entry.email.toLowerCase() === (parsed.email || '').toLowerCase())
      if (match) {
        setUser(match)
      }
    } catch (err) {
      // Ignore corrupted storage entries
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [allowlist])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const loginWithEmail = (emailInput) => {
    const normalized = (emailInput || '').trim().toLowerCase()
    if (!normalized) return { success: false, message: 'Please enter an email.' }

    const match = allowlist.find((entry) => entry.email.toLowerCase() === normalized)
    if (!match) return { success: false, message: 'Email not found in management allowlist.' }

    setUser(match)
    return { success: true, user: match }
  }

  const logout = () => setUser(null)

  const value = useMemo(() => ({ user, allowlist, loginWithEmail, logout }), [user, allowlist])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
