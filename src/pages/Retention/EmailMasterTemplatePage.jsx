import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { segmentJourneyTemplatesById } from './segmentJourneyTemplates'
import {
  buildSendgridDynamicTemplateData,
  getSendgridTemplateMapping,
} from './sendgridTemplateRegistry'

const PRIVATE_PREVIEW_EMAIL = 'paolo.v@bullwaves.com'
const PRIVATE_PREVIEW_FIRST_NAME = 'Paolo'

function inputStyle() {
  return {
    minHeight: '42px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    color: '#f8fdff',
    padding: '0 14px',
    fontWeight: 600,
  }
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180, flex: 1 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#8fa6bd',
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...inputStyle(), fontWeight: 700 }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextField({ label, value, onChange, placeholder, disabled = false, type = 'text' }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220, flex: 1 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#8fa6bd',
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...inputStyle(),
          opacity: disabled ? 0.72 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </label>
  )
}

function ActionButton({ children, onClick, disabled, tone = 'primary' }) {
  const primary = tone === 'primary'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 44,
        padding: '0 16px',
        borderRadius: 999,
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.10)',
        background: primary
          ? 'linear-gradient(135deg, rgba(56,189,248,0.95), rgba(15,57,221,0.95))'
          : 'rgba(255,255,255,0.06)',
        color: '#ffffff',
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  )
}

function ToggleButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 38,
        padding: '0 14px',
        borderRadius: 999,
        border: active ? '1px solid rgba(56,189,248,0.55)' : '1px solid rgba(255,255,255,0.10)',
        background: active
          ? 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(15,57,221,0.30))'
          : 'rgba(255,255,255,0.03)',
        color: active ? '#f8fdff' : '#b9cadb',
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function StatusBadge({ loading, healthy }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 32,
        padding: '0 12px',
        borderRadius: 999,
        border: loading
          ? '1px solid rgba(255,255,255,0.10)'
          : healthy
            ? '1px solid rgba(34,197,94,0.30)'
            : '1px solid rgba(248,113,113,0.30)',
        background: loading
          ? 'rgba(255,255,255,0.04)'
          : healthy
            ? 'rgba(34,197,94,0.12)'
            : 'rgba(248,113,113,0.12)',
        color: loading ? '#d9e6f2' : healthy ? '#c7f9d3' : '#ffd2d2',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {loading ? 'Checking' : healthy ? 'API ready' : 'API blocked'}
    </span>
  )
}

function prettyTemplateLabel(template, fallbackId) {
  return (
    template?.locales?.it?.variants?.a?.name ||
    template?.locales?.en?.variants?.a?.name ||
    fallbackId
  )
}

export default function EmailMasterTemplatePage() {
  const { user } = useAuth()
  const viewerEmail = String(user?.email || '')
    .trim()
    .toLowerCase()

  const templateOptions = useMemo(
    () =>
      Object.entries(segmentJourneyTemplatesById)
        .map(([id, template]) => ({ value: id, label: prettyTemplateLabel(template, id) }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    []
  )

  const [device, setDevice] = useState('desktop')
  const [templateId, setTemplateId] = useState(templateOptions[0]?.value || '')
  const [locale, setLocale] = useState('it')
  const [variant, setVariant] = useState('a')
  const [emailHealth, setEmailHealth] = useState({ loading: true, data: null, error: '' })
  const [sendState, setSendState] = useState({ loading: false, mode: '', data: null, error: '' })

  const requestViewerHeaders = useMemo(
    () => (viewerEmail ? { 'x-bullwaves-user-email': viewerEmail } : {}),
    [viewerEmail]
  )

  const selectedTemplate = templateId ? segmentJourneyTemplatesById?.[templateId] || null : null
  const localeOptions = useMemo(() => {
    const locales = Object.keys(selectedTemplate?.locales || {})
    return locales.map((entry) => ({
      value: entry,
      label: entry === 'it' ? 'Italiano' : 'English',
    }))
  }, [selectedTemplate])

  const activeLocale = localeOptions.some((entry) => entry.value === locale)
    ? locale
    : localeOptions[0]?.value || 'it'

  const variantOptions = useMemo(() => {
    const variants = Object.keys(selectedTemplate?.locales?.[activeLocale]?.variants || {})
    return variants.map((entry) => ({
      value: entry,
      label: `Variant ${String(entry).toUpperCase()}`,
    }))
  }, [activeLocale, selectedTemplate])

  const activeVariant = variantOptions.some((entry) => entry.value === variant)
    ? variant
    : variantOptions[0]?.value || 'a'

  const localizedVariant =
    selectedTemplate?.locales?.[activeLocale]?.variants?.[activeVariant] || null

  const sendgridMapping = useMemo(
    () => getSendgridTemplateMapping(templateId, activeLocale, activeVariant),
    [activeLocale, activeVariant, templateId]
  )

  const dynamicTemplateData = useMemo(
    () =>
      buildSendgridDynamicTemplateData({
        first_name: PRIVATE_PREVIEW_FIRST_NAME,
        locale: activeLocale,
      }),
    [activeLocale]
  )

  useEffect(() => {
    if (!localeOptions.length) return
    if (!localeOptions.some((entry) => entry.value === locale)) {
      setLocale(localeOptions[0].value)
    }
  }, [locale, localeOptions])

  useEffect(() => {
    if (!variantOptions.length) return
    if (!variantOptions.some((entry) => entry.value === variant)) {
      setVariant(variantOptions[0].value)
    }
  }, [variant, variantOptions])

  useEffect(() => {
    let cancelled = false

    async function loadHealth() {
      if (!viewerEmail) {
        setEmailHealth({ loading: false, data: null, error: 'Sessione utente non disponibile.' })
        return
      }

      setEmailHealth((current) => ({ ...current, loading: true, error: '' }))
      try {
        const response = await fetch('/api/email/health', {
          cache: 'no-store',
          headers: requestViewerHeaders,
        })
        const data = await response.json()
        if (cancelled) return
        setEmailHealth({
          loading: false,
          data,
          error: response.ok ? '' : data?.error || 'Healthcheck failed',
        })
      } catch (error) {
        if (cancelled) return
        setEmailHealth({
          loading: false,
          data: null,
          error: error?.message || 'Healthcheck failed',
        })
      }
    }

    loadHealth()
    return () => {
      cancelled = true
    }
  }, [requestViewerHeaders, viewerEmail])

  async function refreshEmailHealth() {
    if (!viewerEmail) {
      setEmailHealth({ loading: false, data: null, error: 'Sessione utente non disponibile.' })
      return
    }

    setEmailHealth((current) => ({ ...current, loading: true, error: '' }))
    try {
      const response = await fetch('/api/email/health', {
        cache: 'no-store',
        headers: requestViewerHeaders,
      })
      const data = await response.json()
      setEmailHealth({
        loading: false,
        data,
        error: response.ok ? '' : data?.error || 'Healthcheck failed',
      })
    } catch (error) {
      setEmailHealth({ loading: false, data: null, error: error?.message || 'Healthcheck failed' })
    }
  }

  async function sendEmail(mode) {
    if (!viewerEmail) {
      window.alert('Sessione utente non disponibile.')
      return
    }

    const body =
      mode === 'template'
        ? {
            to: PRIVATE_PREVIEW_EMAIL,
            viewerEmail,
            templateId: sendgridMapping?.templateId || '',
            subject: localizedVariant?.subject || sendgridMapping?.subject || '',
            dynamicTemplateData,
          }
        : {
            to: PRIVATE_PREVIEW_EMAIL,
            viewerEmail,
            subject: localizedVariant?.subject || 'Bullwaves email preview',
            html: localizedVariant?.html || '',
            text:
              localizedVariant?.description ||
              localizedVariant?.subject ||
              'Bullwaves email preview',
          }

    setSendState({ loading: true, mode, data: null, error: '' })

    try {
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...requestViewerHeaders,
        },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) {
        setSendState({ loading: false, mode, data: null, error: data?.error || 'Send failed' })
        return
      }
      setSendState({ loading: false, mode, data, error: '' })
    } catch (error) {
      setSendState({ loading: false, mode, data: null, error: error?.message || 'Send failed' })
    }
  }

  const canSendTemplate = Boolean(sendgridMapping?.templateId && emailHealth?.data?.configured)
  const canSendHtml = Boolean(localizedVariant?.html && emailHealth?.data?.configured)

  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <section
        style={{
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))',
          padding: 20,
          boxShadow: '0 24px 60px rgba(2,6,23,0.22)',
          display: 'grid',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div
              style={{
                display: 'inline-block',
                padding: '7px 12px',
                borderRadius: 999,
                background: 'rgba(56,189,248,0.10)',
                color: '#bff7ff',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Email test
            </div>
            <h1 style={{ margin: '12px 0 8px', fontSize: 30, lineHeight: 1.08 }}>
              Email Master Template
            </h1>
            <p style={{ margin: 0, color: '#9fb3c8', lineHeight: 1.65, fontSize: 14 }}>
              Solo il necessario: scegli il journey, controlla la preview e invia il test a{' '}
              <strong>{PRIVATE_PREVIEW_EMAIL}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ToggleButton active={device === 'desktop'} onClick={() => setDevice('desktop')}>
              Desktop
            </ToggleButton>
            <ToggleButton active={device === 'mobile'} onClick={() => setDevice('mobile')}>
              Mobile
            </ToggleButton>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <SelectField
            label="Journey"
            value={templateId}
            onChange={setTemplateId}
            options={templateOptions}
          />
          <SelectField
            label="Lingua"
            value={activeLocale}
            onChange={setLocale}
            options={localeOptions}
          />
          <SelectField
            label="Variante"
            value={activeVariant}
            onChange={setVariant}
            options={variantOptions}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 420px) minmax(0, 1fr)',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              padding: 16,
              display: 'grid',
              gap: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <StatusBadge
                loading={emailHealth.loading}
                healthy={Boolean(emailHealth?.data?.configured)}
              />
              <ActionButton
                tone="secondary"
                onClick={refreshEmailHealth}
                disabled={emailHealth.loading}
              >
                Refresh
              </ActionButton>
            </div>

            <TextField
              label="Destinatario"
              type="email"
              value={PRIVATE_PREVIEW_EMAIL}
              onChange={() => {}}
              disabled
            />

            <div
              style={{
                display: 'grid',
                gap: 10,
                color: '#d9e6f2',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              <div>
                <strong>Subject:</strong>{' '}
                {sendgridMapping?.subject || localizedVariant?.subject || '—'}
              </div>
              <div>
                <strong>Template ID:</strong>{' '}
                {sendgridMapping?.templateId || 'Nessun mapping SendGrid'}
              </div>
              {emailHealth.error ? (
                <div style={{ color: '#ffd2d2' }}>{emailHealth.error}</div>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ActionButton
                onClick={() => sendEmail('template')}
                disabled={sendState.loading || !canSendTemplate}
              >
                {sendState.loading && sendState.mode === 'template'
                  ? 'Sending...'
                  : 'Send template'}
              </ActionButton>
              <ActionButton
                tone="secondary"
                onClick={() => sendEmail('html')}
                disabled={sendState.loading || !canSendHtml}
              >
                {sendState.loading && sendState.mode === 'html' ? 'Sending...' : 'Send HTML'}
              </ActionButton>
            </div>

            {sendState.error ? (
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(248,113,113,0.24)',
                  background: 'rgba(248,113,113,0.10)',
                  color: '#ffd2d2',
                  padding: '12px 14px',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {sendState.error}
              </div>
            ) : null}

            {sendState.data?.accepted ? (
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(34,197,94,0.24)',
                  background: 'rgba(34,197,94,0.10)',
                  color: '#d7fee2',
                  padding: '12px 14px',
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                Invio accettato da SendGrid. Status {sendState.data.sendgridStatus}
                {sendState.data.messageId ? ` · Message ID ${sendState.data.messageId}` : ''}
              </div>
            ) : null}
          </div>

          <div
            style={{
              borderRadius: 22,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              boxShadow: '0 30px 80px rgba(2,6,23,0.24)',
              padding: device === 'mobile' ? 18 : 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'stretch',
              minHeight: '72vh',
            }}
          >
            <iframe
              title="Bullwaves Journey Template Preview"
              srcDoc={localizedVariant?.html || ''}
              style={{
                width: device === 'mobile' ? 430 : '100%',
                maxWidth: '100%',
                minHeight: '72vh',
                height: '100%',
                border: 0,
                display: 'block',
                borderRadius: device === 'mobile' ? 22 : 0,
                background: '#0b1320',
                boxShadow: device === 'mobile' ? '0 24px 60px rgba(2,6,23,0.30)' : 'none',
              }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
