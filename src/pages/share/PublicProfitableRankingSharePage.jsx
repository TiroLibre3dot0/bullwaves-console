import { useEffect, useMemo, useState } from 'react'
import { decodeSharePayload } from '../../utils/shareCodec'
import { trackPublicShareOpen } from '../../utils/analytics'
import FullPageLoader from '../../components/FullPageLoader'
import ProfitableRanking from '../Retention/ProfitableRanking'

function coerceNumber(v, fallback) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function buildInitialStateFromPayload(payload) {
  const p = payload && typeof payload === 'object' ? payload : null
  if (!p || p.v !== 1 || p.k !== 'profitable-ranking') return null

  const s = p.s && typeof p.s === 'object' ? p.s : {}

  // Current shape:
  // s.md (minDeposit), s.mt (minTrades), s.r (activityRecencyDays), s.c (countries), s.tab
  // Back-compat: accept older keys when present.
  const tab = String(s.tab || '')
  const validTabs = new Set([
    'most_active',
    'top_performing',
    'most_consistent',
    'rising',
    'best_reward',
  ])

  const minDeposit = Number.isFinite(Number(s.md))
    ? Number(s.md)
    : Number.isFinite(Number(s.mn))
      ? Number(s.mn)
      : 0

  const minTrades = Number.isFinite(Number(s.mt)) ? Number(s.mt) : 0

  const activityRecencyDays = Number.isFinite(Number(s.r))
    ? Number(s.r)
    : // Back-compat: older payloads might have used rc
      Number.isFinite(Number(s.rc))
      ? Number(s.rc)
      : 0

  return {
    minDeposit: coerceNumber(minDeposit, 0),
    minTrades: coerceNumber(minTrades, 0),
    activityRecencyDays: coerceNumber(activityRecencyDays, 0),
    selectedCountries: Array.isArray(s.c)
      ? s.c.map((x) => String(x || '').trim()).filter(Boolean)
      : [],
    activeTab: validTabs.has(tab) ? tab : 'most_active',
    sv: String(s.sv || '').trim().toLowerCase(),
  }
}

export default function PublicProfitableRankingSharePage({ token }) {
  const cleanToken = useMemo(() => String(token || '').trim(), [token])
  const looksLikeToken = useMemo(() => {
    const t = cleanToken
    return (t.startsWith('share_') || t.startsWith('share_local_')) && t.length <= 96
  }, [cleanToken])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        setPayload(null)

        if (!cleanToken) {
          throw new Error('Missing share token.')
        }

        if (looksLikeToken) {
          if (cleanToken.startsWith('share_local_')) {
            const raw = window.localStorage.getItem(`bw_share_profitable_ranking:${cleanToken}`)
            const parsed = raw ? JSON.parse(raw) : null
            const p = parsed?.payload
            if (!p) throw new Error('Invalid or expired local share link.')
            if (!cancelled) setPayload(p)
            return
          }

          const resp = await fetch(
            `/api/share/profitable-ranking/${encodeURIComponent(cleanToken)}`
          )
          const data = await resp.json().catch(() => null)
          const p = data?.payload
          if (!resp.ok || !data?.ok || !p)
            throw new Error(data?.error || data?.message || 'Invalid or expired share link.')
          if (!cancelled) setPayload(p)
          return
        }

        // Legacy fallback: token embeds the payload.
        const decoded = decodeSharePayload(cleanToken)
        if (!cancelled) setPayload(decoded)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load share.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [cleanToken, looksLikeToken])

  const initialState = useMemo(() => buildInitialStateFromPayload(payload), [payload])
  const isValid = Boolean(initialState)

  useEffect(() => {
    if (!isValid) return
    trackPublicShareOpen({
      kind: 'profitable_ranking',
      token: cleanToken,
      generatedAt: String(payload?.generatedAt || ''),
    })
  }, [payload?.generatedAt, isValid, cleanToken])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.title = isValid ? 'Profitable Ranking (Public)' : 'Profitable Ranking (Invalid Share)'
  }, [isValid])

  if (loading) {
    return <FullPageLoader progress={25} subtitle="Loading share..." />
  }

  if (!isValid) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', color: '#e2e8f0', padding: 24 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ fontSize: 22, fontWeight: 950 }}>Profitable Ranking (Public)</div>
          <div style={{ marginTop: 8, color: 'rgba(148,163,184,0.95)', fontWeight: 700 }}>
            {error || 'Invalid or missing share token.'}
          </div>
        </div>
      </div>
    )
  }

  return <ProfitableRanking publicMode initialState={initialState} />
}
