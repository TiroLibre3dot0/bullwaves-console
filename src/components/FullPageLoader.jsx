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
  const glow = colors?.glow ?? 'rgba(56, 189, 248, 0.34)'
  const line = colors?.line ?? 'rgba(56, 189, 248, 0.20)'

  return (
    <div
      style={{
        minHeight,
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        background: surface,
        color: fg,
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes bwLoaderSweep {
          0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(240%) skewX(-18deg); opacity: 0; }
        }
        @keyframes bwLoaderPulse {
          0%, 100% { transform: scale(1); opacity: 0.65; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes bwLoaderFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bw-loader-animated,
          .bw-loader-animated::before,
          .bw-loader-animated::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div
        style={{
          width: 340,
          maxWidth: 'calc(100vw - 40px)',
          textAlign: 'center',
          position: 'relative',
          padding: '8px 0',
        }}
      >
        <div
          className="bw-loader-animated"
          style={{
            width: 162,
            height: 162,
            margin: '0 auto 16px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
            background:
              'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.72) 60%, rgba(15,23,42,0.92) 100%)',
            boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 44px ${glow}`,
            animation: 'bwLoaderFloat 3.2s ease-in-out infinite',
          }}
        >
          <div
            className="bw-loader-animated"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 12,
              borderRadius: '50%',
              border: `1px solid ${line}`,
              animation: 'bwLoaderPulse 2.8s ease-in-out infinite',
            }}
          />
          <div
            className="bw-loader-animated"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 28,
              borderRadius: '50%',
              border: '1px solid rgba(34,197,94,0.20)',
              animation: 'bwLoaderPulse 2.1s ease-in-out infinite reverse',
            }}
          />
          <img
            src={logoSrc}
            alt="Bullwaves"
            style={{
              width: 108,
              height: 108,
              objectFit: 'contain',
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>

        <div style={{ fontSize: 12, color: muted, marginBottom: 12, fontWeight: 700 }}>
          {subtitle}
        </div>

        <div
          style={{
            position: 'relative',
            height: 10,
            borderRadius: 999,
            background: barBg,
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accent} 0%, #22c55e 55%, #86efac 100%)`,
              borderRadius: 999,
              transition: 'width 220ms ease',
              boxShadow: `0 0 22px ${glow}`,
            }}
          />
          <div
            className="bw-loader-animated"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '-28%',
              width: '26%',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.12) 80%, transparent 100%)',
              animation: 'bwLoaderSweep 2.2s linear infinite',
            }}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: muted,
            fontWeight: 800,
          }}
        >
          <span style={{ color: fg }}>{pct}%</span>
        </div>
      </div>
    </div>
  )
}
