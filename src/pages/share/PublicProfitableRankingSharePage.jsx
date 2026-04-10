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
  const definitionKey = String(s.dk || s.definitionKey || 'traders').trim()

  // Current shape:
  // s.md (minDeposit), s.mt (minTrades), s.r (activityRecencyDays), s.c (countries), s.tab
  // Back-compat: accept older keys when present.
  const tab = String(s.tab || '')
  const validTabsByDefinition = {
    traders: new Set(['most_active', 'top_performing', 'most_consistent', 'rising', 'best_reward']),
    prime_challenge: new Set(['payout_users']),
  }
  const safeDefinitionKey = validTabsByDefinition[definitionKey] ? definitionKey : 'traders'
  const validTabs = validTabsByDefinition[safeDefinitionKey]

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
    definitionKey: safeDefinitionKey,
    minDeposit: coerceNumber(minDeposit, 0),
    minTrades: coerceNumber(minTrades, 0),
    activityRecencyDays: coerceNumber(activityRecencyDays, 0),
    selectedCountries: Array.isArray(s.c)
      ? s.c.map((x) => String(x || '').trim()).filter(Boolean)
      : [],
    activeTab: validTabs.has(tab)
      ? tab
      : safeDefinitionKey === 'prime_challenge'
        ? 'payout_users'
        : 'most_active',
    timeframe: ['all', 'last12', 'year', 'month'].includes(String(s.tf || '').trim())
      ? String(s.tf).trim()
      : 'all',
    selectedYear: Number.isFinite(Number(s.y)) ? Number(s.y) : null,
    selectedMonthKey: String(s.mk || '').trim(),
    sv: String(s.sv || '')
      .trim()
      .toLowerCase(),
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
    const publicTitle =
      initialState?.definitionKey === 'prime_challenge'
        ? 'Prime Challenge Ranking (Public)'
        : 'Profitable Ranking (Public)'
    document.title = isValid ? publicTitle : 'Profitable Ranking (Invalid Share)'
  }, [initialState?.definitionKey, isValid])

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

  return (
    <ProfitableRanking
      publicMode
      initialState={initialState}
      definitionKey={initialState?.definitionKey || 'traders'}
    />
  )
}
