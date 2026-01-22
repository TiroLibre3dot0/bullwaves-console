import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import FlowDiagram from './FlowDiagram'
import {
  nodes as retentionNodes,
  edges as retentionEdges,
  meta as retentionMeta,
} from '../../flows/retentionFlow'
import {
  nodes as registrationNodes,
  edges as registrationEdges,
  meta as registrationMeta,
} from '../../flows/registrationFlow'
import {
  nodes as navigationNodes,
  edges as navigationEdges,
  meta as navigationMeta,
} from '../../flows/navigationFlow'
import {
  nodes as mailNodes,
  edges as mailEdges,
  meta as mailMeta,
} from '../../flows/mailMarketingFlow'

function randomHex(bytes = 12) {
  try {
    const arr = new Uint8Array(bytes)
    // eslint-disable-next-line no-undef
    crypto.getRandomValues(arr)
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return String(Math.random()).slice(2) + String(Date.now())
  }
}

export default function FlowsPage({ publicMode = false, sharePayload = null }) {
  const { t } = useI18n()

  const flows = useMemo(
    () => ({
      retention: { meta: retentionMeta, nodes: retentionNodes, edges: retentionEdges },
      registration: { meta: registrationMeta, nodes: registrationNodes, edges: registrationEdges },
      navigation: { meta: navigationMeta, nodes: navigationNodes, edges: navigationEdges },
      mail: { meta: mailMeta, nodes: mailNodes, edges: mailEdges },
    }),
    []
  )

  const readFlowFromUrl = () => {
    try {
      const params = new window.URLSearchParams(window.location.search || '')
      const id = String(params.get('flow') || '').trim()
      if (flows[id]) return id
      const fallback = publicMode ? String(sharePayload?.initialFlow || '').trim() : ''
      return flows[fallback] ? fallback : 'retention'
    } catch {
      return 'retention'
    }
  }

  const [flowId, setFlowId] = useState(() => readFlowFromUrl())

  const [shareState, setShareState] = useState({
    status: 'idle',
    href: '',
    error: '',
    copied: false,
  })

  useEffect(() => {
    const onPop = () => setFlowId(readFlowFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const goFlow = (next) => {
    if (!flows[next]) return
    const url = new URL(window.location.href)
    url.searchParams.set('flow', next)
    const qs = url.searchParams.toString()
    const nextUrl = `${url.pathname}${qs ? `?${qs}` : ''}`
    window.history.pushState({ view: 'flows', flow: next }, '', nextUrl)
    setFlowId(next)
  }

  const createPublicLink = async () => {
    if (publicMode) return
    try {
      setShareState({ status: 'loading', href: '', error: '', copied: false })

      const payload = {
        k: 'flows',
        v: 1,
        createdAt: Date.now(),
        initialFlow: flowId,
        flows: ['registration', 'navigation', 'retention', 'mail'],
      }

      let token = ''
      try {
        const resp = await fetch('/api/share/create-flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        })
        const data = await resp.json().catch(() => null)
        if (resp.ok && data?.ok && data?.token) token = String(data.token)
        else throw new Error(data?.error || data?.message || 'share-not-available')
      } catch {
        // Local fallback (dev only / when KV is not available)
        token = `share_local_${randomHex(12)}`
        try {
          window.localStorage.setItem(`bw_share_flows:${token}`, JSON.stringify({ payload }))
        } catch {
          // ignore
        }
      }

      const origin = window.location?.origin || ''
      const href = `${origin}/share/flows/${encodeURIComponent(token)}?flow=${encodeURIComponent(flowId)}`

      // Primary UX: open the public page immediately.
      try {
        window.open(href, '_blank', 'noopener,noreferrer')
      } catch {
        // ignore
      }

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(href)
          setShareState({ status: 'ready', href, error: '', copied: true })
          return
        }
      } catch {
        // ignore
      }

      setShareState({ status: 'ready', href, error: '', copied: false })
    } catch (e) {
      setShareState({ status: 'error', href: '', error: e?.message || 'Errore', copied: false })
    }
  }

  const active = flows[flowId] || flows.retention
  const meta = active.meta

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {publicMode ? null : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#9aa4b2', letterSpacing: 0.2 }}>
            {t('app.tools')}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{t('sidebar.flows')}</div>
        </div>
      )}

      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div className="subnav" style={{ padding: 0, justifyContent: 'flex-start' }}>
          <button
            type="button"
            className={`tab ${flowId === 'registration' ? 'active' : ''}`}
            onClick={() => goFlow('registration')}
          >
            Registrazione
          </button>
          <button
            type="button"
            className={`tab ${flowId === 'navigation' ? 'active' : ''}`}
            onClick={() => goFlow('navigation')}
          >
            Navigazione
          </button>
          <button
            type="button"
            className={`tab ${flowId === 'retention' ? 'active' : ''}`}
            onClick={() => goFlow('retention')}
          >
            Retention
          </button>
          <button
            type="button"
            className={`tab ${flowId === 'mail' ? 'active' : ''}`}
            onClick={() => goFlow('mail')}
          >
            Email marketing
          </button>
        </div>

        <div style={{ height: 10 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 950, color: '#fff', letterSpacing: 0.2 }}>
              {meta.title}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(148,163,184,0.95)',
              }}
            >
              {meta.description}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 800,
                color: 'rgba(226,232,240,0.82)',
              }}
            >
              I box con il simbolo ↗ sono cliccabili e aprono il flusso completo. Contorno blu =
              step; contorno viola = influenza. Le frecce tratteggiate (quando presenti) indicano
              solo contesto/influenze.
            </div>

            {publicMode ? (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'rgba(148,163,184,0.95)',
                }}
              >
                Vista pubblica read-only.
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
              justifyContent: 'flex-end',
              maxWidth: 520,
            }}
          >
            <LegendItem label="Step (freccia)" shape="edgeSolid" />
            <LegendItem label="Influenza (freccia)" shape="edgeDashed" />
            <LegendItem label="Stato" shape="rect" />
            <LegendItem label="Decisione" shape="diamond" />
            <LegendItem label="Esito" shape="pill" />
            <LegendItem label="Influenza" shape="dashed" />

            {publicMode ? null : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
                <button
                  type="button"
                  onClick={createPublicLink}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    fontWeight: 900,
                    fontSize: 12,
                    background: 'rgba(59,130,246,0.14)',
                    border: '1px solid rgba(59,130,246,0.30)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {shareState.status === 'loading'
                    ? 'Creo link…'
                    : shareState.copied
                      ? 'Link copiato'
                      : 'Condividi (link pubblico)'}
                </button>
              </div>
            )}
          </div>
        </div>

        {!publicMode && shareState.status === 'ready' && shareState.href ? (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 12,
              background: 'rgba(2,6,23,0.35)',
              border: '1px solid rgba(148,163,184,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(226,232,240,0.85)' }}>
              Link pubblico (read-only):{' '}
              <a
                href={shareState.href}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#93c5fd' }}
              >
                apri
              </a>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.95)' }}>
              {shareState.href}
            </div>
          </div>
        ) : null}

        {!publicMode && shareState.status === 'error' ? (
          <div
            style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: 'rgba(248,113,113,0.95)' }}
          >
            {shareState.error || 'Errore durante la creazione del link'}
          </div>
        ) : null}

        <div style={{ height: 10 }} />
        <FlowDiagram
          key={flowId}
          nodes={active.nodes}
          edges={active.edges}
          onNavigateFlow={goFlow}
        />
      </div>
    </div>
  )
}

function LegendItem({ label, shape }) {
  const base = {
    width: 18,
    height: 12,
    background: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(148, 163, 184, 0.25)',
  }

  if (shape === 'edgeSolid' || shape === 'edgeDashed') {
    const stroke =
      shape === 'edgeDashed' ? 'rgba(148, 163, 184, 0.55)' : 'rgba(148, 163, 184, 0.85)'
    const dash = shape === 'edgeDashed' ? '6 6' : undefined

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
          <line
            x1="1"
            y1="6"
            x2="18"
            y2="6"
            stroke={stroke}
            strokeWidth="2"
            strokeDasharray={dash}
          />
          <path
            d="M18 2 L23 6 L18 10"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(226,232,240,0.85)' }}>
          {label}
        </div>
      </div>
    )
  }

  const shapeStyle =
    shape === 'diamond'
      ? { ...base, width: 12, height: 12, transform: 'rotate(45deg)', borderRadius: 3 }
      : shape === 'pill'
        ? { ...base, width: 18, height: 12, borderRadius: 999 }
        : shape === 'dashed'
          ? {
              ...base,
              width: 18,
              height: 12,
              borderStyle: 'dashed',
              borderColor: 'rgba(148, 163, 184, 0.55)',
            }
          : { ...base, borderRadius: 3 }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={shapeStyle} />
      <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(226,232,240,0.85)' }}>{label}</div>
    </div>
  )
}
