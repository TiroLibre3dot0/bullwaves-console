import React from 'react'
import { useI18n } from '../i18n/I18nContext'

export default function LanguageSwitcher() {
  const { locale, setLocale, locales } = useI18n()
  return (
    <select
      className="lang-select"
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      aria-label="Language"
      style={{
        minWidth: 48,
        background: 'transparent',
        color: '#fff',
        border: '1px solid #6366f1',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        padding: '2px 8px',
      }}
    >
      {locales.map((l) => (
        <option key={l.id} value={l.id}>
          {l.label}
        </option>
      ))}
    </select>
  )
}
