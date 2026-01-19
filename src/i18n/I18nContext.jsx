import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SUPPORTED_LOCALES, translate } from './translations'

const STORAGE_KEY = 'bw-locale'

const I18nContext = createContext({
  locale: 'en',
  setLocale: () => {},
  t: (key, _params) => key,
  locales: SUPPORTED_LOCALES,
})

function detectDefaultLocale() {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved && ['en', 'it', 'sr'].includes(saved)) return saved
  return 'en'
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => detectDefaultLocale())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = (next) => {
    if (!['en', 'it', 'sr'].includes(next)) return
    setLocaleState(next)
  }

  const t = useMemo(() => (key, params) => translate(locale, key, params), [locale])

  const value = useMemo(() => ({ locale, setLocale, t, locales: SUPPORTED_LOCALES }), [locale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
