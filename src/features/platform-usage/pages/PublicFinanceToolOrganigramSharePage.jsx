import { useEffect, useMemo, useState } from 'react'

import LanguageSelect from '../../../components/LanguageSelect'
import { useI18n } from '../../../i18n/I18nContext'
import { trackPublicShareOpen } from '../../../utils/analytics'
import { resetOpenGraphMeta, setOpenGraphMeta } from '../../../utils/ogMeta'
import { decodeSharePayload } from '../../../utils/shareCodec'
import FinanceToolOrganigramPage from './FinanceToolOrganigramPage'

export default function PublicFinanceToolOrganigramSharePage({ token = '' }) {
  const { t, locale } = useI18n()
  const [payload, setPayload] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const looksLikeToken = useMemo(() => String(token || '').trim().length > 0, [token])

  useEffect(() => {
    if (!looksLikeToken) {
      setPayload(null)
      setLoadError(null)
      return
    }

    const decoded = decodeSharePayload(String(token || '').trim())
    if (!decoded) {
      setPayload(null)
      setLoadError('Failed to load share')
      return
    }

    setPayload(decoded)
    setLoadError(null)
  }, [looksLikeToken, token])

  useEffect(() => {
    setOpenGraphMeta({
      title: t('publicShare.financeToolOrganigram.ogTitle'),
      description: t('publicShare.financeToolOrganigram.ogDescription'),
      image: '/Logo.png',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })
    return () => resetOpenGraphMeta()
  }, [t])

  const isValid =
    payload &&
    payload.k === 'finance_tool_organigram' &&
    payload.v === 1 &&
    Array.isArray(payload?.data?.groups)

  useEffect(() => {
    if (!isValid) return
    trackPublicShareOpen({
      kind: 'finance_tool_organigram',
      token,
      generatedAt: payload?.generatedAt,
    })
  }, [isValid, payload?.generatedAt, token])

  if (!isValid) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', color: '#e2e8f0', padding: 24 }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 950 }}>
              {t('publicShare.financeToolOrganigram.title')}
            </div>
            <LanguageSelect />
          </div>
          <div style={{ marginTop: 8, color: 'rgba(148,163,184,0.95)', fontWeight: 700 }}>
            {loadError || t('publicShare.invalid')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070b14' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(12px, 3vw, 18px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <img
            src="/Logo.png"
            alt="Bullwaves"
            style={{ height: 26, width: 'auto', display: 'block', opacity: 0.95 }}
          />
          <LanguageSelect />
        </div>

        <div
          style={{
            marginTop: 8,
            marginBottom: 12,
            color: 'rgba(148,163,184,0.95)',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {t('publicShare.readOnlyGenerated', {
            date: payload.generatedAt ? new Date(payload.generatedAt).toLocaleString(locale) : '—',
          })}
        </div>

        <FinanceToolOrganigramPage publicMode sharePayload={payload} />
      </div>
    </div>
  )
}
