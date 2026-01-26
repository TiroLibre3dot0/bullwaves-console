import React from 'react'
import { useI18n } from '../../i18n/I18nContext'

export default function LanguageSwitcher() {
  const { locale, setLocale, locales } = useI18n()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 600 }}>🌍 Language:</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        style={{
          background: '#18181b',
          color: '#fff',
          border: '1px solid #6366f1',
          borderRadius: 6,
          padding: '2px 8px',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {locales.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label === 'EN'
              ? '🇬🇧 English'
              : l.label === 'IT'
                ? '🇮🇹 Italiano'
                : l.label === 'SR'
                  ? '🇷🇸 Srpski'
                  : l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
