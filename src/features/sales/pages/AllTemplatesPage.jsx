import { useMemo, useState } from 'react'
import { ALL_TEMPLATES_CATALOG } from '../data/allTemplatesCatalog'

function getDisplayTemplateName(item) {
  const baseName = String(item?.name || '').trim()
  const html = String(item?.html || '')
  const hasGlobalLink = /https?:\/\/[^"'\s]*global/i.test(html)

  if (!baseName) return baseName
  if (!hasGlobalLink) return baseName
  if (!/^bullwaves\b/i.test(baseName)) return baseName
  if (/^bullwaves\s+global\b/i.test(baseName)) return baseName

  return baseName.replace(/^bullwaves\b/i, 'Bullwaves Global')
}

function getTemplateBrand(item) {
  const html = String(item?.html || '')
  if (/https?:\/\/[^"'\s]*bullwaves\.global/i.test(html)) {
    return { id: 'global', label: 'BG' }
  }
  return { id: 'portal', label: 'BP' }
}

function brandBadgeStyle(brandId) {
  if (brandId === 'global') {
    return {
      border: '1px solid rgba(56,189,248,0.5)',
      color: '#7dd3fc',
      background: 'rgba(56,189,248,0.14)',
    }
  }
  return {
    border: '1px solid rgba(34,197,94,0.42)',
    color: '#9af0b2',
    background: 'rgba(34,197,94,0.12)',
  }
}

function getTemplateLinks(item) {
  const html = String(item?.html || '')
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi
  const links = []
  let match

  const includeLink = (href) => {
    const normalized = href.toLowerCase()

    // Exclude non-CTA support channels
    if (
      normalized.startsWith('mailto:') ||
      normalized.includes('wa.me') ||
      normalized.includes('whatsapp') ||
      normalized.includes('livechat')
    ) {
      return false
    }

    // Keep only login/access and account verification CTAs
    return (
      normalized.includes('login') ||
      normalized.includes('webtrader') ||
      normalized.includes('email-confirmation') ||
      normalized.includes('verify') ||
      normalized.includes('verification') ||
      normalized.includes('confirm') ||
      normalized.includes('new-password') ||
      normalized.includes('reset-password') ||
      normalized.includes('pwd_reset_token')
    )
  }

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = String(match[1] || '').trim()
    if (!href) continue
    if (!includeLink(href)) continue
    if (links.includes(href)) continue
    links.push(href)
  }

  return links
}

function cardStyle(active) {
  return {
    width: '100%',
    textAlign: 'left',
    borderRadius: 16,
    border: active ? '1px solid rgba(56,189,248,0.55)' : '1px solid rgba(255,255,255,0.1)',
    background: active
      ? 'linear-gradient(160deg, rgba(56,189,248,0.2), rgba(15,23,42,0.95))'
      : 'rgba(15,23,42,0.72)',
    color: '#e7eff8',
    padding: 16,
    cursor: 'pointer',
  }
}

function TemplateCard({ item, active, onClick }) {
  const displayName = getDisplayTemplateName(item)
  const brand = getTemplateBrand(item)
  const links = getTemplateLinks(item)

  return (
    <button type="button" style={cardStyle(active)} onClick={onClick}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{displayName}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#9fb4c9' }}>{item.subject}</div>
        </div>
        <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderRadius: 999,
              padding: '5px 8px',
              ...brandBadgeStyle(brand.id),
            }}
          >
            {brand.label}
          </span>
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
        {links.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9fb4c9' }}>Nessun link trovato</div>
        ) : (
          links.map((link) => (
            <a
              key={`${item.id}-${link}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, lineHeight: 1.4, color: '#7dd3fc', wordBreak: 'break-all' }}
              onClick={(event) => event.stopPropagation()}
            >
              {link}
            </a>
          ))
        )}
      </div>
    </button>
  )
}

export default function AllTemplatesPage() {
  const visibleTemplates = useMemo(
    () => ALL_TEMPLATES_CATALOG.filter((item) => item.id !== 'acuity-bullwaves-46-en'),
    []
  )
  const [selectedId, setSelectedId] = useState(visibleTemplates[0]?.id || '')
  const [contentMode, setContentMode] = useState('preview')
  const [copyStatus, setCopyStatus] = useState('idle')

  const selectedTemplate = useMemo(
    () => visibleTemplates.find((item) => item.id === selectedId) || visibleTemplates[0],
    [selectedId, visibleTemplates]
  )
  const selectedTemplateDisplayName = getDisplayTemplateName(selectedTemplate)

  const handleCopyHtml = async () => {
    const html = String(selectedTemplate?.html || '')
    if (!html) return

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(html)
      } else {
        throw new Error('Clipboard API unavailable')
      }
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }

    setTimeout(() => setCopyStatus('idle'), 1800)
  }

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gap: 18,
        height: 'calc(100vh - 170px)',
        minHeight: 560,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(120deg, rgba(2,132,199,0.18), rgba(15,23,42,0.96))',
          padding: 20,
        }}
      >
        <div style={{ fontSize: 12, color: '#7dd3fc', fontWeight: 800, letterSpacing: '0.08em' }}>
          SALES / ALL TEMPLATES
        </div>
        <h1 style={{ margin: '6px 0 4px', fontSize: 24, color: '#f5f9ff' }}>All templates</h1>
        <p style={{ margin: 0, color: '#bdd0e4' }}>
          Seleziona una card per aprire la preview grafica o il sorgente HTML dell&apos;email.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 380px) minmax(0, 1fr)',
          gap: 16,
          minHeight: 0,
        }}
      >
        <aside
          style={{
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(15,23,42,0.82)',
            padding: 14,
            display: 'grid',
            gap: 10,
            alignContent: 'start',
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          {visibleTemplates.map((item) => (
            <TemplateCard
              key={item.id}
              item={item}
              active={item.id === selectedTemplate?.id}
              onClick={() => setSelectedId(item.id)}
            />
          ))}
        </aside>

        <article
          style={{
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(15,23,42,0.82)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div
              style={{ fontSize: 12, color: '#93acc5', letterSpacing: '0.07em', fontWeight: 800 }}
            >
              CONTENUTO CENTRALE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'inline-flex',
                  borderRadius: 999,
                  padding: 4,
                  gap: 4,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(2,6,23,0.5)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setContentMode('preview')}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    color: contentMode === 'preview' ? '#04111d' : '#b7c7d8',
                    background: contentMode === 'preview' ? '#7dd3fc' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('html')}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    color: contentMode === 'html' ? '#04111d' : '#b7c7d8',
                    background: contentMode === 'html' ? '#7dd3fc' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  HTML
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyHtml}
                style={{
                  border: '1px solid rgba(125,211,252,0.55)',
                  borderRadius: 999,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#dff6ff',
                  background:
                    copyStatus === 'copied'
                      ? 'rgba(22,163,74,0.25)'
                      : copyStatus === 'error'
                        ? 'rgba(220,38,38,0.25)'
                        : 'rgba(125,211,252,0.16)',
                  cursor: 'pointer',
                }}
              >
                {copyStatus === 'copied'
                  ? 'Copiato'
                  : copyStatus === 'error'
                    ? 'Errore copia'
                    : 'Copia HTML'}
              </button>
            </div>
          </div>

          <div>
            <div
              style={{ fontSize: 12, color: '#93acc5', letterSpacing: '0.07em', fontWeight: 800 }}
            >
              SUBJECT
            </div>
            <div style={{ marginTop: 4, color: '#f8fcff', fontWeight: 700 }}>
              {selectedTemplate?.subject}
            </div>
          </div>
          <div>
            <div
              style={{ fontSize: 12, color: '#93acc5', letterSpacing: '0.07em', fontWeight: 800 }}
            >
              DESCRIPTION
            </div>
            <div style={{ marginTop: 4, color: '#d3deea', lineHeight: 1.5 }}>
              {selectedTemplate?.description}
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              minHeight: 0,
              flex: 1,
              background: contentMode === 'preview' ? '#f5f7fa' : '#0a1220',
            }}
          >
            {contentMode === 'preview' ? (
              <iframe
                title={selectedTemplateDisplayName || 'Template preview'}
                srcDoc={selectedTemplate?.html || ''}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 760,
                  border: 0,
                  background: '#f5f7fa',
                }}
                scrolling="yes"
                sandbox="allow-same-origin"
              />
            ) : (
              <pre
                style={{
                  margin: 0,
                  height: '100%',
                  minHeight: 760,
                  overflow: 'auto',
                  padding: 16,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#cfe0f1',
                  fontSize: 12,
                  lineHeight: 1.5,
                  fontFamily: "'Fira Code', 'Consolas', monospace",
                }}
              >
                {selectedTemplate?.html || ''}
              </pre>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
