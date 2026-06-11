import 'd3-transition'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './lib/chartSetup'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './i18n/I18nContext'
import { DataStatusProvider } from './context/DataStatusContext'
import { QlikStatusProvider } from './context/QlikStatusContext'
import { initAnalytics } from './utils/analytics'

initAnalytics()

// Safeguard for stale PWA service workers that can mask leaderboard/API updates.
// In PROD we only apply it on trading competition public-facing routes.
const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
const shouldClearSwInProd =
  /^\/(trading-competition(?:\/widget)?|share\/trading-competition)(?:\/|$)/.test(pathname)

if ((import.meta.env.DEV || shouldClearSwInProd) && typeof window !== 'undefined') {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        if (!regs?.length) return
        const reloadKey = '_tc_sw_cleared_once'
        if (shouldClearSwInProd && !sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, '1')
          Promise.all((regs || []).map((r) => r.unregister())).finally(() => {
            window.location.reload()
          })
          return
        }
        for (const r of regs || []) r.unregister()
      })
    }
    if ('caches' in window) {
      window.caches.keys().then((keys) => {
        for (const k of keys || []) window.caches.delete(k)
      })
    }
  } catch {
    // ignore
  }
}

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <AuthProvider>
      <DataStatusProvider>
        <QlikStatusProvider>
          <App />
        </QlikStatusProvider>
      </DataStatusProvider>
    </AuthProvider>
  </I18nProvider>
)
