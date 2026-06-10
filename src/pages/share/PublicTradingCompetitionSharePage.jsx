import { useEffect, useMemo } from 'react'
import FullPageLoader from '../../components/FullPageLoader'
import { setOpenGraphMeta, resetOpenGraphMeta } from '../../utils/ogMeta'
import { trackPublicShareOpen } from '../../utils/analytics'
import { getPublicShareOrigin } from '../../utils/publicShareOrigin'

export default function PublicTradingCompetitionSharePage() {
  const origin = useMemo(() => getPublicShareOrigin(), [])
  const previewHref = `${origin}/trading-competition-preview.html#leaderboard`

  useEffect(() => {
    setOpenGraphMeta({
      title: 'Bullwaves — Trading Competition',
      description: 'Public live leaderboard for the Bullwaves trading competition.',
      image: '/Logo.png',
      url: typeof window !== 'undefined' ? window.location.href : '',
    })

    trackPublicShareOpen({
      kind: 'trading_competition',
      token: 'public',
      generatedAt: null,
    })

    return () => resetOpenGraphMeta()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0b1220', color: '#e2e8f0', padding: 20 }}>
      <div style={{ maxWidth: 1500, margin: '0 auto' }}>
        <div
          style={{
            border: '1px solid rgba(148,163,184,0.22)',
            borderRadius: 18,
            background: 'rgba(15,23,42,0.72)',
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.16em', fontWeight: 900, color: '#60a5fa' }}>
            BULLWAVES LIVE
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, lineHeight: 1.05 }}>
            Trading Competition Leaderboard
          </h1>
          <p style={{ margin: '10px 0 0', color: '#94a3b8', fontSize: 13, maxWidth: 900 }}>
            Public, read-only leaderboard powered by the live DB Native dataset. Use this page as
            the canonical public destination for traders or as an iframe embed target.
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                minHeight: 42,
                padding: '0 16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                textDecoration: 'none',
                color: '#e2e8f0',
                border: '1px solid rgba(96,165,250,0.28)',
                background: 'rgba(37,99,235,0.22)',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Open live preview
            </a>
            <a
              href="/trading-competition/widget"
              style={{
                minHeight: 42,
                padding: '0 16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                textDecoration: 'none',
                color: '#e2e8f0',
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(15,23,42,0.56)',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Widget setup
            </a>
          </div>
        </div>

        <iframe
          title="Trading competition leaderboard"
          src={previewHref}
          style={{
            width: '100%',
            minHeight: 'calc(100vh - 140px)',
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 16,
            background: '#fff',
          }}
        />
      </div>
    </div>
  )
}
