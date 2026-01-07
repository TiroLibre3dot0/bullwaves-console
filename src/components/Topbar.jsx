import React, { useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDataStatus } from '../context/DataStatusContext'
import { useMediaPaymentsData } from '../features/media-payments/hooks/useMediaPaymentsData'
import { useI18n } from '../i18n/I18nContext'
import { CONSOLE_TOOLS } from '../config/tools'
import DataInfoModal from './DataInfoModal'

function DataStatusIcon({ dataStatus, onClick }) {
  const { t } = useI18n()
  const { status } = dataStatus;
  const getIcon = () => {
    switch (status) {
      case 'updated': return <span className="text-green-500" title={t('dataStatus.updated')}>✅</span>;
      case 'outdated': return <span className="text-yellow-500" title={t('dataStatus.outdated')}>⏰</span>;
      case 'no-data': return <span className="text-red-500" title={t('dataStatus.noData')}>⚠️</span>;
      default: return <span className="text-gray-400" title={t('dataStatus.unknown')}>❓</span>;
    }
  };
  return (
    <div className="data-status-icon flex items-center cursor-pointer" onClick={onClick}>
      {getIcon()}
    </div>
  );
}

export default function Topbar({ children, onAdminClick, showAdmin = false }){
  const { t, locale, setLocale, locales } = useI18n()
  const { dataStatus } = useDataStatus();
  const { mediaRows, payments, mediaSource, paymentsSource } = useMediaPaymentsData();
  const { user, logout } = useAuth()
  const initial = user?.name?.[0]?.toUpperCase() || 'B'
  const [showTools, setShowTools] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showDataInfoModal, setShowDataInfoModal] = useState(false)
  const hoverTimer = useRef(null)
  const hasNav = Boolean(children)

  const isMobile = () => window.innerWidth <= 768;

  // Calcola informazioni sui dati più recenti
  const getDataInfo = useMemo(() => {
    if (!mediaRows.length && !payments.length) {
      return { lastDate: t('dataStatus.noData'), mediaFile: 'N/A', paymentsFile: 'N/A' };
    }

    // Trova la data più recente nei media data
    const mediaDates = mediaRows
      .map(r => r.monthIndex)
      .filter(idx => idx > 0)
      .sort((a, b) => b - a);
    
    // Trova la data più recente nei payments
    const paymentDates = payments
      .map(p => p.monthIndex)
      .filter(idx => idx > 0)
      .sort((a, b) => b - a);

    const latestMonthIndex = Math.max(
      mediaDates[0] || 0,
      paymentDates[0] || 0
    );

    // Converti monthIndex in data leggibile
    const year = Math.floor(latestMonthIndex / 12) + 2000;
    const month = (latestMonthIndex % 12) + 1;
    const monthNamesByLocale = {
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      it: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
      sr: ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'],
    }
    const monthNames = monthNamesByLocale[locale] || monthNamesByLocale.en
    const lastDate = latestMonthIndex > 0 ? `${monthNames[month - 1]} ${year}` : t('dataStatus.unknown');

    return {
      lastDate,
      mediaFile: mediaSource ? mediaSource.replace('/', '') : 'N/A',
      paymentsFile: paymentsSource ? paymentsSource.replace('/', '') : 'N/A'
    };
  }, [mediaRows, payments, mediaSource, paymentsSource, locale, t]);

  const handleDataStatusClick = () => {
    setShowDataInfoModal(true)
  };

  const tools = useMemo(() => CONSOLE_TOOLS, [])

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
    if (!hasNav) return
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
        {dataStatus && <DataStatusIcon dataStatus={dataStatus} onClick={handleDataStatusClick} />}
        {showTools && (
          <div className="logo-tools-pop" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
            <div className="logo-tools-title">{t('app.tools')}</div>
            <div className="logo-tools-list">
              {tools.map((tool) => (
                <button key={tool.key || tool.name} className="logo-tools-item" onClick={() => openTool(tool.href)}>
                  {tool.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="topbar-nav-slot">
        {/* Hamburger Menu Button - Mobile Only (render only when viewport is mobile) */}
        {hasNav && typeof window !== 'undefined' && isMobile() && (
          <button
            className="hamburger-menu flex flex-col justify-center items-center w-8 h-8 space-y-1 bg-transparent border-none cursor-pointer"
            onClick={toggleMobileMenu}
            aria-label={t('topbar.aria.toggleNavMenu')}
          >
            <span className={`hamburger-line w-5 h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`hamburger-line w-5 h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? 'opacity-0' : ''}`}></span>
            <span className={`hamburger-line w-5 h-0.5 bg-current transition-all duration-300 ${showMobileMenu ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </button>
        )}

        {/* Desktop Navigation */}
        {hasNav ? (
          <div className="hidden md:block">
            {children}
          </div>
        ) : null}

        {/* Mobile Navigation Menu */}
        {hasNav && showMobileMenu && (
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
            <div className="lang-switch" title={t('lang.label')}>
              <select
                className="lang-select"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                aria-label={t('lang.label')}
              >
                {locales.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="user-avatar" aria-hidden="true">{initial}</div>
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.title || user.department}</div>
            </div>
            {showAdmin && (
              <button type="button" className="admin-btn" onClick={onAdminClick}>{t('app.admin')}</button>
            )}
            <button type="button" className="logout-btn" onClick={logout}>{t('app.logout')}</button>
          </div>
        ) : (
          <div className="user-chip ghost">{t('app.version')}</div>
        )}
      </div>
      </header>

      {/* Data Info Modal */}
      <DataInfoModal
        isOpen={showDataInfoModal}
        onClose={() => setShowDataInfoModal(false)}
        dataInfo={getDataInfo}
      />
    </>
  )
}
