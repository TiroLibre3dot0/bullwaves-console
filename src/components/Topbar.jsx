import React, { useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDataStatus } from '../context/DataStatusContext'
import DataStatusIndicator from './DataStatusIndicator'

function DataStatusIcon({ dataStatus, onClick }) {
  const { status } = dataStatus;
  const getIcon = () => {
    switch (status) {
      case 'updated': return <span className="text-green-500" title="Data is up to date">✅</span>;
      case 'outdated': return <span className="text-yellow-500" title="Data may be outdated">⏰</span>;
      case 'no-data': return <span className="text-red-500" title="No data available">⚠️</span>;
      default: return <span className="text-gray-400" title="Unknown status">❓</span>;
    }
  };
  return (
    <div className="data-status-icon flex items-center cursor-pointer" onClick={onClick}>
      {getIcon()}
    </div>
  );
}

export default function Topbar({ children, onAdminClick, showAdmin = false }){
  const { dataStatus } = useDataStatus();
  const { user, logout } = useAuth()
  const initial = user?.name?.[0]?.toUpperCase() || 'B'
  const [showTools, setShowTools] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showDataStatusPopup, setShowDataStatusPopup] = useState(false)
  const hoverTimer = useRef(null)

  const isMobile = () => window.innerWidth <= 768;

  const tools = useMemo(
    () => [
      { name: 'Creolabs · Qlik Cloud', href: 'https://login.qlik.com/login?state=hKFo2SBsNGtYOEs4eXM0MTQyal9qZlZZd2JxVUxGRTNvOFk4eKFupWxvZ2luo3RpZNkgSTRORnUzNW5iSl9YR2NXVTZmQ0pKV1VkeVVJeXZFMDSjY2lk2SBQRjVZa0Nhem9qUGQ2OGhHVGhXVHhMNk4wcWw3RUVKYQ&client=PF5YkCazojPd68hGThWTxL6N0ql7EEJa&protocol=oauth2&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fqlk6ufzb2vk9dn9.uk.qlikcloud.com%2Flogin%2Fcallback&nonce=cMBZFdQmCwCyxd61Cz3Ios9DY-kDPwRIHfL0PgmmhYU&code_challenge=hHRAyjfogYyP8cEyDbZGNxEG8OiGaRulBWTmBBqH-G0&code_challenge_method=S256' },
      { name: 'Trading Platform', href: 'https://trading-platform-self-two.vercel.app/trade' },
      { name: 'CellXpert · Affiliate Hub', href: 'https://partner.trackingaffiliates.com/v2/login/admin-login/' },
      { name: 'Skale CRM · Console', href: 'https://bul934907.skalecrm.com/index.php' },
      { name: 'Skale App · Brand Manager', href: 'https://fbom.skaleapps.io/company-management/brands' },
      { name: 'Brokeree · Social Trading', href: 'http://77.76.9.111:8080/admin/' },
      { name: 'BullwavesPrime · Prop Admin', href: 'https://bwpadmin.bullwaves.com/login' },
    ],
    []
  )

  const handleLogoClick = () => {
    if (isMobile()) {
      setShowTools(!showTools);
    }
  };

  const handleOverlayClick = () => {
    setShowTools(false)
    setShowMobileMenu(false)
  }

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }

  const openTool = (href) => {
    window.open(href, '_blank', 'noopener,noreferrer')
    setShowTools(false)
  }

  const handleEnter = () => {
    if (!isMobile()) {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
      setShowTools(true)
    }
  }

  const handleLeave = () => {
    if (!isMobile()) {
      hoverTimer.current = setTimeout(() => setShowTools(false), 120)
    }
  }

  return (
    <>
      {(showTools || showMobileMenu) && <div className="logo-tools-backdrop" onClick={handleOverlayClick} />}
      <header className="topbar">
      <div
        className="title logo-hit flex items-center"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={handleLogoClick}
      >
        <img src="/Logo.png" alt="Bullwaves Logo" className="h-10 w-auto transition-all duration-300 hover:scale-105 cursor-pointer mr-2" />
        {dataStatus && <DataStatusIcon dataStatus={dataStatus} onClick={() => setShowDataStatusPopup(true)} />}
        {showTools && (
          <div className="logo-tools-pop" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
            <div className="logo-tools-title">Tools</div>
            <div className="logo-tools-list">
              {tools.map((tool) => (
                <button key={tool.name} className="logo-tools-item" onClick={() => openTool(tool.href)}>
                  {tool.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="topbar-nav-slot">
        {/* Hamburger Menu Button - Mobile Only */}
        <button
          className="hamburger-menu md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1 bg-transparent border-none cursor-pointer"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger-line w-5 h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`hamburger-line w-5 h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? 'opacity-0' : ''}`}></span>
          <span className={`hamburger-line w-5 h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          {children}
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="mobile-nav-menu absolute top-full left-0 right-0 bg-gradient-to-b from-slate-900/98 to-slate-800/98 backdrop-blur-lg border-b border-white/10 shadow-2xl md:hidden z-50">
            <div className="px-4 py-4 max-h-96 overflow-y-auto">
              {React.cloneElement(children, {
                onItemClick: () => setShowMobileMenu(false)
              })}
            </div>
          </div>
        )}
      </div>
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
      {dataStatus && (
        <DataStatusIndicator
          dataStatus={dataStatus}
          showPopup={showDataStatusPopup}
          onClosePopup={() => setShowDataStatusPopup(false)}
          onPillClick={() => setShowDataStatusPopup(true)}
        />
      )}
    </>
  )
}
