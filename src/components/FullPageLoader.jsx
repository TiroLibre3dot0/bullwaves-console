import React from 'react'

export default function FullPageLoader({
  progress = 0,
  subtitle = 'Loading…',
  logoSrc = '/Logo.png',
  minHeight = '100vh',
  // Optional override when a page already has its own palette.
  // If omitted, rely on the global CSS theme variables defined in src/index.css.
  colors,
}) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)))

  // Default to transparent so we inherit the page background (often a gradient).
  // Use theme vars with safe fallbacks.
  const surface = colors?.surface ?? 'transparent'
  const fg = colors?.text ?? 'var(--text, var(--text-primary))'
  const muted = colors?.muted ?? 'var(--muted, var(--text-secondary))'
  const accent = colors?.accent ?? 'var(--accent, var(--accent-secondary))'
  const barBg = colors?.barBg ?? 'var(--border, rgba(255,255,255,0.10))'

  return (
    <div
      style={{
        minHeight,
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        background: surface,
        color: fg,
      }}
    >
      <div style={{ width: 340, textAlign: 'center' }}>
        <img
          src={logoSrc}
          alt="Bullwaves"
          style={{ width: 140, height: 140, objectFit: 'contain', margin: '0 auto 14px' }}
        />
        <div style={{ fontSize: 12, color: muted, marginBottom: 10 }}>{subtitle}</div>
        <div style={{ height: 6, borderRadius: 999, background: barBg, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: accent,
              borderRadius: 999,
              transition: 'width 220ms ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
