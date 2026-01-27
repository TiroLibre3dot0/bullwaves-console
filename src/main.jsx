import React from 'react'
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

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <AuthProvider>
      <DataStatusProvider>
        <App />
      </DataStatusProvider>
    </AuthProvider>
  </I18nProvider>
)
