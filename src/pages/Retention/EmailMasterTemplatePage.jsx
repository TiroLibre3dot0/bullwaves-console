import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  isRecentlyUpdatedSegmentTemplate,
  segmentJourneyTemplatesById,
} from './segmentJourneyTemplates'
import {
  buildSendgridDynamicTemplateData,
  getSendgridTemplateMapping,
} from './sendgridTemplateRegistry'

const PREVIEW_PATH = '/email-master-template-preview.html'
const PRIVATE_PREVIEW_EMAIL = 'paolo.v@bullwaves.com'

const MASTER_TEMPLATE_OPTIONS = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'markleting', label: 'MARKLETING TEMPLATE' },
  { value: 'framework', label: 'Bullwaves Master Framework' },
]

const DEFAULT_TEST_SECRET = ''
const SENDGRID_SECRET_STORAGE_KEY = 'bullwaves.sendgrid.testSecret'
const SENDGRID_RECIPIENT_STORAGE_KEY = 'bullwaves.sendgrid.recipient'

function readStoredValue(key, fallback = '') {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback
    return window.localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

function writeStoredValue(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    if (!value) {
      window.localStorage.removeItem(key)
      return
    }
    window.localStorage.setItem(key, value)
  } catch {
    // Ignore storage failures.
  }
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function textInputStyle() {
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

function TextField({ label, value, onChange, placeholder, type = 'text', disabled = false }) {
  return (
    <label
      style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px', flex: 1 }}
    >
      <span
        style={{
          fontSize: '11px',
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
          ...textInputStyle(),
          opacity: disabled ? 0.72 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </label>
  )
}

function TextAreaField({ label, value, onChange, placeholder, minHeight = 110 }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#8fa6bd',
        }}
      >
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          ...textInputStyle(),
          minHeight,
          padding: '12px 14px',
          resize: 'vertical',
          fontFamily: 'inherit',
          lineHeight: 1.5,
        }}
      />
    </label>
  )
}

function ActionButton({ children, onClick, disabled, tone = 'primary' }) {
  const background =
    tone === 'secondary'
      ? 'rgba(255,255,255,0.06)'
      : 'linear-gradient(135deg, rgba(56,189,248,0.95), rgba(15,57,221,0.95))'
  const color = tone === 'secondary' ? '#d7e7f6' : '#ffffff'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: '44px',
        padding: '0 16px',
        borderRadius: '999px',
        border: tone === 'secondary' ? '1px solid rgba(255,255,255,0.10)' : '0',
        background,
        color,
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  )
}

function StatusBadge({ healthy }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        minHeight: '32px',
        padding: '0 12px',
        borderRadius: '999px',
        border: healthy ? '1px solid rgba(34,197,94,0.30)' : '1px solid rgba(248,113,113,0.30)',
        background: healthy ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
        color: healthy ? '#c7f9d3' : '#ffd2d2',
        fontSize: '12px',
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {healthy ? 'API ready' : 'API missing env'}
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

function NewBadge() {
  return (
    <span
      className="animate-pulse"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '8px',
        padding: '2px 8px',
        borderRadius: '999px',
        border: '1px solid rgba(56,189,248,0.38)',
        background: 'rgba(56,189,248,0.14)',
        color: '#7dd3fc',
        fontSize: '10px',
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      (new)
    </span>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px' }}>
      <span
        style={{
          fontSize: '11px',
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
        style={{
          minHeight: '42px',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.04)',
          color: '#f8fdff',
          padding: '0 14px',
          fontWeight: 700,
        }}
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

function ToggleButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: '40px',
        padding: '0 14px',
        borderRadius: '999px',
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

export default function EmailMasterTemplatePage() {
  const { user } = useAuth()
  const [masterTemplateType, setMasterTemplateType] = useState('minimal')
  const [skin, setSkin] = useState('light')
  const [device, setDevice] = useState('mobile')
  const [copyState, setCopyState] = useState('')
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

  const [templateId, setTemplateId] = useState(templateOptions[0]?.value || '')
  const [locale, setLocale] = useState('it')
  const [variant, setVariant] = useState('a')
  const [emailHealth, setEmailHealth] = useState({ loading: true, data: null, error: '' })
  const [recipient, setRecipient] = useState(() =>
    readStoredValue(SENDGRID_RECIPIENT_STORAGE_KEY, PRIVATE_PREVIEW_EMAIL)
  )
  const [testSecret, setTestSecret] = useState(() =>
    readStoredValue(SENDGRID_SECRET_STORAGE_KEY, DEFAULT_TEST_SECRET)
  )
  const [firstName, setFirstName] = useState('Paolo')
  const [accountManagerName, setAccountManagerName] = useState('The Bullwaves Team')
  const [ctaUrl, setCtaUrl] = useState('https://portal.bullwaves.com/custom/webtrader')
  const [supportUrl, setSupportUrl] = useState(
    'https://wa.me/35799514794?text=Hi%20Bullwaves%2C%20I%20would%20like%20help%20with%20the%20next%20step%20on%20my%20account.'
  )
  const [sendState, setSendState] = useState({ loading: false, mode: '', data: null, error: '' })

  const previewUrl = useMemo(
    () =>
      `${PREVIEW_PATH}?template=${encodeURIComponent(masterTemplateType)}&skin=${encodeURIComponent(skin)}&device=${encodeURIComponent(device)}`,
    [device, masterTemplateType, skin]
  )

  const requestViewerHeaders = useMemo(
    () => (viewerEmail ? { 'x-bullwaves-user-email': viewerEmail } : {}),
    [viewerEmail]
  )

  const selectedTemplate = templateId ? segmentJourneyTemplatesById?.[templateId] || null : null
  const selectedTemplateIsRecent = isRecentlyUpdatedSegmentTemplate(templateId)
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
        first_name: firstName || undefined,
        cta_url: ctaUrl || undefined,
        support_url: supportUrl || undefined,
        account_manager_name: accountManagerName || undefined,
      }),
    [accountManagerName, ctaUrl, firstName, supportUrl]
  )

  useEffect(() => {
    if (normalizeEmail(recipient) === PRIVATE_PREVIEW_EMAIL) return
    setRecipient(PRIVATE_PREVIEW_EMAIL)
  }, [recipient])

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
    writeStoredValue(SENDGRID_SECRET_STORAGE_KEY, testSecret.trim())
  }, [testSecret])

  useEffect(() => {
    writeStoredValue(SENDGRID_RECIPIENT_STORAGE_KEY, recipient.trim())
  }, [recipient])

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

    if (!recipient.trim()) {
      window.alert('Inserisci un destinatario email valido.')
      return
    }

    if (!testSecret.trim()) {
      window.alert('Inserisci SENDGRID_TEST_SECRET prima di inviare.')
      return
    }

    const body =
      mode === 'template'
        ? {
            to: recipient.trim(),
            viewerEmail,
            templateId: sendgridMapping?.templateId || '',
            subject: localizedVariant?.subject || sendgridMapping?.subject || '',
            dynamicTemplateData,
          }
        : {
            to: recipient.trim(),
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
          Authorization: `Bearer ${testSecret.trim()}`,
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

  async function copyShareLink() {
    if (typeof window === 'undefined') return

    const absoluteUrl = new URL(previewUrl, window.location.origin).toString()

    try {
      await navigator.clipboard.writeText(absoluteUrl)
      setCopyState('copied')
      window.setTimeout(() => setCopyState(''), 1800)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState(''), 2200)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <section
        style={{
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(2,6,23,0.22)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ maxWidth: '760px' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '7px 12px',
                borderRadius: '999px',
                background: 'rgba(34,211,238,0.10)',
                color: '#bff7ff',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Retention Design System
            </div>
            <h1 style={{ margin: '14px 0 10px', fontSize: '34px', lineHeight: 1.08 }}>
              Email Template Review
            </h1>
            <p style={{ margin: 0, color: '#9fb3c8', lineHeight: 1.7, fontSize: '15px' }}>
              Qui puoi rivedere i journey reali con lingua, variante e device reali senza passare
              dal modal del ranking. La preview master statica ora mostra anche i master template
              recenti, non solo il framework storico.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}
            >
              <ToggleButton active={skin === 'light'} onClick={() => setSkin('light')}>
                Light
              </ToggleButton>
              <ToggleButton active={skin === 'dark'} onClick={() => setSkin('dark')}>
                Dark
              </ToggleButton>
            </div>

            <SelectField
              label="Master template"
              value={masterTemplateType}
              onChange={setMasterTemplateType}
              options={MASTER_TEMPLATE_OPTIONS}
            />

            <div
              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}
            >
              <ToggleButton active={device === 'desktop'} onClick={() => setDevice('desktop')}>
                Desktop
              </ToggleButton>
              <ToggleButton active={device === 'mobile'} onClick={() => setDevice('mobile')}>
                Mobile
              </ToggleButton>
            </div>

            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                padding: '0 18px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0f39dd 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 800,
              }}
            >
              Open Static Preview
            </a>

            <ActionButton tone="secondary" onClick={copyShareLink}>
              {copyState === 'copied'
                ? 'Link copied'
                : copyState === 'error'
                  ? 'Copy failed'
                  : 'Copy link'}
            </ActionButton>
          </div>
        </div>
      </section>

      <section
        style={{
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(2,6,23,0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ maxWidth: '820px' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '7px 12px',
                borderRadius: '999px',
                background: 'rgba(56,189,248,0.10)',
                color: '#bff7ff',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              SendGrid Test Panel
            </div>
            <h2 style={{ margin: '14px 0 8px', fontSize: '28px', lineHeight: 1.1 }}>
              Test invio dal template selezionato
            </h2>
            <p style={{ margin: 0, color: '#9fb3c8', lineHeight: 1.7, fontSize: '14px' }}>
              Compila <strong>.env.sendgrid.local</strong> con API key, sender e test secret. Poi
              usa questo pannello per inviare sia il template dinamico SendGrid sia l HTML live
              generato dal builder.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <StatusBadge healthy={Boolean(emailHealth?.data?.configured)} />
            <ActionButton
              tone="secondary"
              onClick={refreshEmailHealth}
              disabled={emailHealth.loading}
            >
              {emailHealth.loading ? 'Checking...' : 'Refresh API health'}
            </ActionButton>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'minmax(300px, 1fr) minmax(340px, 460px)',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <TextField
                label="Destinatario"
                type="email"
                value={recipient}
                onChange={setRecipient}
                placeholder="paolo.v@bullwaves.com"
                disabled
              />
              <TextField
                label="Test Secret"
                value={testSecret}
                onChange={setTestSecret}
                placeholder="Inserisci SENDGRID_TEST_SECRET"
              />
            </div>

            <div style={{ fontSize: '12px', color: '#8fa6bd', lineHeight: 1.7 }}>
              Preview privata attiva: invio e accesso API sono attualmente limitati a{' '}
              <strong>{PRIVATE_PREVIEW_EMAIL}</strong>.
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <TextField
                label="First name"
                value={firstName}
                onChange={setFirstName}
                placeholder="Paolo"
              />
              <TextField
                label="Account manager"
                value={accountManagerName}
                onChange={setAccountManagerName}
                placeholder="The Bullwaves Team"
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <TextField
                label="CTA URL"
                value={ctaUrl}
                onChange={setCtaUrl}
                placeholder="https://..."
              />
              <TextField
                label="Support URL"
                value={supportUrl}
                onChange={setSupportUrl}
                placeholder="https://..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ActionButton
                onClick={() => sendEmail('template')}
                disabled={
                  sendState.loading ||
                  !sendgridMapping?.templateId ||
                  !emailHealth?.data?.configured
                }
              >
                {sendState.loading && sendState.mode === 'template'
                  ? 'Sending template...'
                  : 'Send SendGrid template'}
              </ActionButton>
              <ActionButton
                tone="secondary"
                onClick={() => sendEmail('html')}
                disabled={
                  sendState.loading || !localizedVariant?.html || !emailHealth?.data?.configured
                }
              >
                {sendState.loading && sendState.mode === 'html'
                  ? 'Sending HTML...'
                  : 'Send live HTML preview'}
              </ActionButton>
            </div>

            {sendState.error ? (
              <div
                style={{
                  borderRadius: '16px',
                  border: '1px solid rgba(248,113,113,0.24)',
                  background: 'rgba(248,113,113,0.10)',
                  color: '#ffd2d2',
                  padding: '14px 16px',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}
              >
                {sendState.error}
              </div>
            ) : null}

            {sendState.data?.accepted ? (
              <div
                style={{
                  borderRadius: '16px',
                  border: '1px solid rgba(34,197,94,0.24)',
                  background: 'rgba(34,197,94,0.10)',
                  color: '#d7fee2',
                  padding: '14px 16px',
                  fontSize: '13px',
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
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#8fa6bd',
                }}
              >
                API status
              </div>
              <div
                style={{ marginTop: '6px', fontSize: '14px', color: '#d9e6f2', lineHeight: 1.6 }}
              >
                {emailHealth.loading
                  ? 'Controllo configurazione in corso...'
                  : emailHealth.error ||
                    (emailHealth?.data?.configured
                      ? 'Configurazione pronta.'
                      : 'Mancano variabili server-side.')}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#8fa6bd',
                }}
              >
                Template mapping
              </div>
              <div
                style={{ marginTop: '6px', fontSize: '14px', color: '#d9e6f2', lineHeight: 1.6 }}
              >
                {sendgridMapping?.templateId || 'Nessun mapping SendGrid per questa combinazione.'}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#8fa6bd',
                }}
              >
                Subject attuale
              </div>
              <div
                style={{ marginTop: '6px', fontSize: '14px', color: '#d9e6f2', lineHeight: 1.6 }}
              >
                {sendgridMapping?.subject || localizedVariant?.subject || '—'}
              </div>
            </div>

            <TextAreaField
              label="Dynamic template data preview"
              value={JSON.stringify(dynamicTemplateData, null, 2)}
              onChange={() => {}}
              placeholder="{}"
              minHeight={180}
            />

            <div style={{ fontSize: '12px', color: '#8fa6bd', lineHeight: 1.7 }}>
              File locale da compilare: <strong>.env.sendgrid.local</strong>. Il pannello usa{' '}
              <strong>/api/email/health</strong> e<strong> /api/email/send-test</strong>.
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)',
          padding: '24px',
          boxShadow: '0 24px 60px rgba(2,6,23,0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '14px',
          }}
        >
          <div style={{ maxWidth: '760px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 12px',
                borderRadius: '999px',
                background: 'rgba(56,189,248,0.10)',
                color: '#bff7ff',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <span>Live Journey Preview</span>
              {selectedTemplateIsRecent ? <NewBadge /> : null}
            </div>
            <h2 style={{ margin: '14px 0 8px', fontSize: '28px', lineHeight: 1.1 }}>
              Journey reali renderizzati dal builder
            </h2>
            <p style={{ margin: 0, color: '#9fb3c8', lineHeight: 1.7, fontSize: '14px' }}>
              Questa area mostra l HTML finale dei template email reali, utile per controllare
              densita hero, contrasti e resa mobile.
            </p>
          </div>

          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-end' }}
          >
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
        </div>

        <div
          style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)',
          }}
        >
          <div
            style={{
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              padding: '18px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8fa6bd',
              }}
            >
              Nome
            </div>
            <div style={{ marginTop: '6px', fontSize: '15px', lineHeight: 1.5, fontWeight: 800 }}>
              {localizedVariant?.name || '—'}
            </div>

            <div
              style={{
                marginTop: '18px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8fa6bd',
              }}
            >
              Subject
            </div>
            <div style={{ marginTop: '6px', fontSize: '14px', lineHeight: 1.6, color: '#d9e6f2' }}>
              {localizedVariant?.subject || '—'}
            </div>

            <div
              style={{
                marginTop: '18px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8fa6bd',
              }}
            >
              Descrizione
            </div>
            <div style={{ marginTop: '6px', fontSize: '14px', lineHeight: 1.6, color: '#9fb3c8' }}>
              {localizedVariant?.description || '—'}
            </div>
          </div>

          <div
            style={{
              minHeight: '72vh',
              borderRadius: '26px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              boxShadow: '0 30px 80px rgba(2,6,23,0.24)',
              padding: device === 'mobile' ? '18px' : '0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'stretch',
            }}
          >
            <iframe
              title="Bullwaves Journey Template Preview"
              srcDoc={localizedVariant?.html || ''}
              style={{
                width: device === 'mobile' ? '430px' : '100%',
                maxWidth: '100%',
                minHeight: '72vh',
                height: '100%',
                border: 0,
                display: 'block',
                borderRadius: device === 'mobile' ? '26px' : '0',
                background: '#0b1320',
                boxShadow: device === 'mobile' ? '0 24px 60px rgba(2,6,23,0.30)' : 'none',
              }}
            />
          </div>
        </div>
      </section>

      <section
        style={{
          flex: 1,
          minHeight: '72vh',
          borderRadius: '26px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          boxShadow: '0 30px 80px rgba(2,6,23,0.24)',
          padding: device === 'mobile' ? '18px' : '0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}
      >
        <iframe
          title="Bullwaves Email Master Template Preview"
          src={previewUrl}
          style={{
            width: device === 'mobile' ? '402px' : '100%',
            maxWidth: '100%',
            minHeight: '72vh',
            height: '100%',
            border: 0,
            display: 'block',
            borderRadius: device === 'mobile' ? '26px' : '0',
            background: '#0b1320',
            boxShadow: device === 'mobile' ? '0 24px 60px rgba(2,6,23,0.30)' : 'none',
          }}
        />
      </section>
    </div>
  )
}
