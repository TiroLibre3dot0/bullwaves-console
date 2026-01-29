import React from 'react'
import { useI18n } from '../i18n/I18nContext'

export default function LanguageSelect({ style = null }) {
  const { locale, setLocale, t, locales } = useI18n()

  return (
    <div className="lang-switch" title={t('lang.label')} style={style || undefined}>
      <select
        className="lang-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label={t('lang.label')}
      >
        {locales.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
