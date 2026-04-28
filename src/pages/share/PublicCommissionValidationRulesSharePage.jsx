import { useEffect, useMemo, useState } from 'react'
import CommissionValidationRulesPage from '../CommissionValidationRulesPage'

const KEY_PILLS = [
  '30-Day Contact Window',
  '90s Effective Call',
  'Two-Way Interaction',
  'Voiso · Convrs · WhatsApp',
  'Exception Approval',
  'Audit Trail',
  'Anti-Manipulation Policy',
  'Funded Account Validation',
]

function isShareToken(value) {
  const clean = String(value || '').trim()
  return (clean.startsWith('share_') || clean.startsWith('share_local_')) && clean.length <= 96
}

function CorporateTopBar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 52,
        background: 'rgba(8, 15, 30, 0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(148,163,184,0.14)',
      }}
    >
      <a
        href="https://bullwaves.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
      >
        <img src="/Logo.png" alt="Bullwaves" style={{ height: 26, width: 'auto' }} />
      </a>

      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(148,163,184,0.8)',
        }}
      >
        Public Document
      </span>
    </header>
  )
}

function DocumentHero() {
  return (
    <div
      style={{
        padding: '32px 24px 24px',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(186,230,253,0.9)',
            background: 'rgba(14,116,144,0.28)',
            border: '1px solid rgba(125,211,252,0.32)',
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          Compliance
        </span>
        <span style={{ color: 'rgba(100,116,139,0.7)', fontSize: 12 }}>·</span>
        <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.9)', fontWeight: 600 }}>
          Bullwaves Sales Operations
        </span>
      </div>

      <h1
        style={{
          margin: '0 0 8px',
          fontSize: 'clamp(22px, 3vw, 30px)',
          fontWeight: 800,
          color: '#f8fafc',
          letterSpacing: '-0.3px',
          lineHeight: 1.12,
        }}
      >
        Sales Commission Validation Framework
      </h1>

      <p
        style={{
          margin: '0 0 18px',
          fontSize: 14,
          color: 'rgba(148,163,184,0.9)',
          maxWidth: 560,
          lineHeight: 1.5,
        }}
      >
        Rules governing deposit commission eligibility based on documented sales engagement, contact
        evidence, and audit controls.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {KEY_PILLS.map((label) => (
          <span
            key={label}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#e2e8f0',
              background: 'rgba(30,41,59,0.72)',
              border: '1px solid rgba(148,163,184,0.22)',
              borderRadius: 999,
              padding: '5px 12px',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid rgba(148,163,184,0.12)',
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Version', value: '1.0' },
          { label: 'Scope', value: 'Sales — All Regions' },
          { label: 'Status', value: 'Active Policy' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(100,116,139,0.8)',
                marginBottom: 2,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#cbd5e1' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background:
          'linear-gradient(90deg, transparent, rgba(148,163,184,0.18) 20%, rgba(148,163,184,0.18) 80%, transparent)',
        maxWidth: 960,
        margin: '0 auto',
      }}
    />
  )
}

function PublicFooter() {
  return (
    <footer
      style={{
        padding: '20px 24px',
        maxWidth: 960,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderTop: '1px solid rgba(148,163,184,0.1)',
        marginTop: 8,
      }}
    >
      <img src="/Logo.png" alt="Bullwaves" style={{ height: 18, width: 'auto', opacity: 0.5 }} />
      <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.7)', fontWeight: 600 }}>
        © Bullwaves · Compliance Department · Public Document
      </span>
    </footer>
  )
}

export default function PublicCommissionValidationRulesSharePage({ token = '' }) {
  const cleanToken = useMemo(() => String(token || '').trim(), [token])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        if (!cleanToken || !isShareToken(cleanToken)) {
          throw new Error('Invalid or missing share token')
        }

        if (cleanToken.startsWith('share_local_')) {
          const raw = window.localStorage.getItem(
            `bw_share_commission_validation_rules:${cleanToken}`
          )
          const parsed = raw ? JSON.parse(raw) : null
          if (!parsed?.payload || parsed.payload.k !== 'comval') {
            throw new Error('Missing local share snapshot')
          }
          return
        }

        const resp = await fetch(
          `/api/share/commission-validation-rules/${encodeURIComponent(cleanToken)}`
        )
        const data = await resp.json().catch(() => null)
        const payload = data?.payload

        if (!resp.ok || !data?.ok || !payload || payload.k !== 'comval') {
          throw new Error(data?.error || data?.message || 'Unable to load public share')
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Unable to load public share')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [cleanToken])

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #080f1e 0%, #0c1526 60%, #0f172a 100%)',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <CorporateTopBar />
        <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div
            style={{
              color: 'rgba(148,163,184,0.7)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            Loading compliance document…
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <CorporateTopBar />
        <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div
            style={{
              maxWidth: 480,
              padding: '20px 22px',
              borderRadius: 14,
              border: '1px solid rgba(248,113,113,0.3)',
              background: 'rgba(127,29,29,0.2)',
              color: '#fca5a5',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <CorporateTopBar />
      <DocumentHero />
      <Divider />
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <CommissionValidationRulesPage publicMode />
      </div>
      <PublicFooter />
    </div>
  )
}
