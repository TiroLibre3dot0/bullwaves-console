import React from 'react'

export default function Topbar({ children }){
  return (
    <header className="topbar">
      <div className="title">Bullwaves</div>
      <div className="topbar-nav-slot">{children}</div>
      <div className="meta">v1.0.0</div>
    </header>
  )
}
