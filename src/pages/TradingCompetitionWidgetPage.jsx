import { useMemo, useState } from 'react'
import { getPublicShareOrigin } from '../utils/publicShareOrigin'

const EMBED_IFRAME_SNIPPET = (publicHref) => `<iframe
  src="${publicHref}"
  style="width:100%;min-height:2200px;border:0;border-radius:16px;"
  loading="lazy"
></iframe>`

const PUBLIC_PREVIEW_PATH = '/trading-competition-preview.html#leaderboard'

function CodeBox({ title, description, value, onCopy, copied }) {
  return (
    <section
      style={{
        border: '1px solid rgba(148, 163, 184, 0.24)',
        borderRadius: 14,
        background: 'rgba(15, 23, 42, 0.64)',
        padding: 14,
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: '#e2e8f0' }}>{title}</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>{description}</p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          style={{
            border: '1px solid rgba(59, 130, 246, 0.5)',
            background: copied ? 'rgba(16, 185, 129, 0.24)' : 'rgba(37, 99, 235, 0.2)',
            color: '#dbeafe',
            borderRadius: 999,
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <textarea
        readOnly
        value={value}
        style={{
          width: '100%',
          marginTop: 10,
          minHeight: 160,
          resize: 'vertical',
          borderRadius: 10,
          border: '1px solid rgba(148, 163, 184, 0.22)',
          background: 'rgba(2, 6, 23, 0.72)',
          color: '#e5e7eb',
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
          fontSize: 12,
          lineHeight: 1.45,
          padding: 10,
        }}
      />
    </section>
  )
}

export default function TradingCompetitionWidgetPage() {
  const [copiedKey, setCopiedKey] = useState('')
  const publicOrigin = useMemo(() => getPublicShareOrigin(), [])
  const publicHref = `${publicOrigin}${PUBLIC_PREVIEW_PATH}`
  const shareHref = `${publicOrigin}/share/trading-competition`
  const iframeSnippet = useMemo(() => EMBED_IFRAME_SNIPPET(shareHref), [shareHref])

  const sections = useMemo(
    () => [
      {
        key: 'public-link',
        title: 'Public link',
        description:
          'Send this URL directly to traders or use it in newsletters and landing pages.',
        value: shareHref,
      },
      {
        key: 'iframe',
        title: 'Iframe embed',
        description: 'Drop this in a Webflow/HTML embed to show the live leaderboard on your site.',
        value: iframeSnippet,
      },
      {
        key: 'preview',
        title: 'Public preview URL',
        description: 'Canonical live preview page used by the share link.',
        value: publicHref,
      },
    ],
    [iframeSnippet, publicHref, shareHref]
  )

  const handleCopy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? '' : prev))
      }, 1400)
    } catch {
      setCopiedKey('')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <section
        style={{
          border: '1px solid rgba(148, 163, 184, 0.24)',
          borderRadius: 16,
          background: 'rgba(15, 23, 42, 0.7)',
          padding: 16,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 800, color: '#60a5fa' }}>
          TRADING COMPETITION
        </div>
        <h1 style={{ margin: '6px 0 0', fontSize: 30, lineHeight: 1.05 }}>Widget</h1>
        <p style={{ margin: '10px 0 0', color: '#94a3b8', fontSize: 13, maxWidth: 880 }}>
          Public leaderboard integration for marketing and partner sites. Use the share link for a
          hosted page or the iframe snippet for direct embedding.
        </p>
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.24)',
            background: 'rgba(30, 41, 59, 0.52)',
            color: '#cbd5e1',
            fontSize: 12,
          }}
        >
          The leaderboard is live and public. It reads directly from DB Native and updates with the
          current ranking data.
        </div>
      </section>

      <section
        style={{
          border: '1px solid rgba(148, 163, 184, 0.24)',
          borderRadius: 14,
          background: 'rgba(15, 23, 42, 0.64)',
          padding: 14,
          display: 'grid',
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, color: '#e2e8f0' }}>Live preview</h2>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
          Preview the public leaderboard page exactly as it will appear outside the console.
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          <a
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700 }}
          >
            Open public leaderboard share page
          </a>
          <iframe
            title="Trading competition public preview"
            src={shareHref}
            style={{
              width: '100%',
              minHeight: 700,
              border: '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: 10,
              background: '#fff',
            }}
          />
        </div>
      </section>

      {sections.map((section) => (
        <CodeBox
          key={section.key}
          title={section.title}
          description={section.description}
          value={section.value}
          copied={copiedKey === section.key}
          onCopy={() => handleCopy(section.key, section.value)}
        />
      ))}
    </div>
  )
}
