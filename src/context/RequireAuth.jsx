import React, { useEffect } from 'react'
import { useAuth } from './AuthContext'
import LoginPage from '../pages/LoginPage'
import { initUserflowAfterLogin } from '../utils/userflowClient'

export default function RequireAuth({ children }) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    initUserflowAfterLogin(user)
  }, [user])

  if (!user) return <LoginPage />
  return <>{children}</>
}
