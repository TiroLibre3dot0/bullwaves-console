import React, { useMemo, useState } from 'react'

const EMBED_JS_MAIN =
  'https://cdn.jsdelivr.net/gh/TiroLibre3dot0/bullwaves-console@main/public/embed/prime-contest.js'
const EMBED_JS_PINNED =
  'https://cdn.jsdelivr.net/gh/TiroLibre3dot0/bullwaves-console@43c7e92/public/embed/prime-contest.js'
const PREVIEW_HTML_PINNED =
  'https://cdn.jsdelivr.net/gh/TiroLibre3dot0/bullwaves-console@43c7e92/public/embed/prime-contest-preview.html'
const LIVE_WIDGET_DEMO_PATH = '/embed/prime-contest-widget-demo.html'
const LIVE_FULL_PREVIEW_PATH = '/embed/prime-contest-preview.html#leaderboard'

const BASE_SNIPPET = `<div
  data-bw-prime-contest
  data-limit="10"
  data-title="Prime Challenge Leaderboard"
  data-subtitle="Monthly payout ranking"
  data-cta-label="Start the challenge"
  data-cta-url="https://prime.bullwaves.com/"
  data-accent="#16a34a"
></div>
<script src="${EMBED_JS_MAIN}" defer></script>`

const PINNED_SNIPPET = `<div
  data-bw-prime-contest
  data-limit="10"
  data-title="Prime Challenge Leaderboard"
  data-subtitle="Monthly payout ranking"
  data-cta-label="Start the challenge"
  data-cta-url="https://prime.bullwaves.com/"
  data-accent="#16a34a"
></div>
<script src="${EMBED_JS_PINNED}" defer></script>`

const IFRAME_SNIPPET = `<iframe
  src="${PREVIEW_HTML_PINNED}"
  style="width:100%;min-height:2200px;border:0;border-radius:16px;"
  loading="lazy"
></iframe>`

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
          minHeight: 170,
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

export default function PrimeChallengeWidgetPage() {
  const [copiedKey, setCopiedKey] = useState('')

  const sections = useMemo(
    () => [
      {
        key: 'main',
        title: 'Webflow snippet (recommended)',
        description: 'Always latest version from @main. Paste into a Webflow Embed block.',
        value: BASE_SNIPPET,
      },
      {
        key: 'pinned',
        title: 'Webflow snippet (pinned version)',
        description: 'Fixed to commit 43c7e92 for deterministic rendering.',
        value: PINNED_SNIPPET,
      },
      {
        key: 'iframe',
        title: 'Full page embed (iframe)',
        description: 'Use this only when you need the entire long Prime preview page.',
        value: IFRAME_SNIPPET,
      },
    ],
    []
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
          PRIME CHALLENGE
        </div>
        <h1 style={{ margin: '6px 0 0', fontSize: 30, lineHeight: 1.05 }}>Widget</h1>
        <p style={{ margin: '10px 0 0', color: '#94a3b8', fontSize: 13, maxWidth: 880 }}>
          This section centralizes all embed links and snippets so the marketing team can reuse them
          without asking for updated URLs each time.
        </p>

        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 10,
            border: '1px solid rgba(148, 163, 184, 0.24)',
            background: 'rgba(30, 41, 59, 0.52)',
            color: '#cbd5e1',
            fontSize: 12,
          }}
        >
          Quick links: {EMBED_JS_MAIN} | {EMBED_JS_PINNED} | {PREVIEW_HTML_PINNED}
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
        <h2 style={{ margin: 0, fontSize: 18, color: '#e2e8f0' }}>Live previews</h2>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
          View both assets directly: standalone widget and full Prime contest page.
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          <a
            href={LIVE_WIDGET_DEMO_PATH}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700 }}
          >
            Open widget demo in new tab
          </a>
          <iframe
            title="Prime widget demo"
            src={LIVE_WIDGET_DEMO_PATH}
            style={{
              width: '100%',
              minHeight: 520,
              border: '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: 10,
            }}
          />
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <a
            href={LIVE_FULL_PREVIEW_PATH}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700 }}
          >
            Open full preview page in new tab
          </a>
          <iframe
            title="Prime full preview"
            src={LIVE_FULL_PREVIEW_PATH}
            style={{
              width: '100%',
              minHeight: 640,
              border: '1px solid rgba(148, 163, 184, 0.22)',
              borderRadius: 10,
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
