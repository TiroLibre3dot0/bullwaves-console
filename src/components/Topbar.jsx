import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Topbar({ children, onAdminClick, showAdmin = false }){
  const { user, logout } = useAuth()
  const initial = user?.name?.[0]?.toUpperCase() || 'B'

  return (
    <header className="topbar">
      <div className="title">Bullwaves</div>
      <div className="topbar-nav-slot">{children}</div>
      <div className="meta">
        {user ? (
          <div className="user-chip">
            <div className="user-avatar" aria-hidden="true">{initial}</div>
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.title || user.department}</div>
            </div>
            {showAdmin && (
              <button type="button" className="admin-btn" onClick={onAdminClick}>Admin</button>
            )}
            <button type="button" className="logout-btn" onClick={logout}>Logout</button>
          </div>
        ) : (
          <div className="user-chip ghost">v1.0.0</div>
        )}
      </div>
    </header>
  )
}
