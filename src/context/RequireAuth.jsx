import React, { useEffect } from 'react'
import { useAuth } from './AuthContext'
import LoginPage from '../pages/LoginPage'
import FullPageLoader from '../components/FullPageLoader'
import { initUserflowAfterLogin } from '../utils/userflowClient'

export default function RequireAuth({ children }) {
  const { user, authReady } = useAuth()

  useEffect(() => {
    if (!user) return
    initUserflowAfterLogin(user)
  }, [user])

  // Wait for the token verification round-trip before showing anything.
  // This prevents a flash of the login page for users with a valid session.
  if (!authReady) return <FullPageLoader />
  if (!user) return <LoginPage />
  return <>{children}</>
}
