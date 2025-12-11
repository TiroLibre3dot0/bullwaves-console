import React from 'react'
import { useAuth } from './AuthContext'
import LoginPage from '../pages/LoginPage'

export default function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <LoginPage />
  return <>{children}</>
}
