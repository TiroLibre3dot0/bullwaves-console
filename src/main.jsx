import 'd3-transition'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './lib/chartSetup'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './i18n/I18nContext'
import { DataStatusProvider } from './context/DataStatusContext'
import { initAnalytics } from './utils/analytics'

initAnalytics()

// DEV safeguard: stale PWA service workers can mask local UI changes.
// Keep this DEV-only to avoid touching production installs.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
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
        <App />
      </DataStatusProvider>
    </AuthProvider>
  </I18nProvider>
)
