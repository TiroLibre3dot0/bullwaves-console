import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './lib/chartSetup'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './i18n/I18nContext'

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </I18nProvider>
)
