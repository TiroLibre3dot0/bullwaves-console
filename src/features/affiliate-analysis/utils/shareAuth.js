import { normalizeKey } from '../../../lib/formatters'

export const BOARD_SESSION_STORAGE_KEY = 'bw_board_affrep_session'

export function isShareToken(value) {
  const clean = String(value || '').trim()
  return clean.startsWith('share_') || clean.startsWith('share_local_')
}

export function getBoardSessionToken() {
  try {
    const raw = window.localStorage.getItem(BOARD_SESSION_STORAGE_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    const token = String(parsed?.token || '').trim()
    return token
  } catch {
    return ''
  }
}

export function setBoardSessionToken(token) {
  const clean = String(token || '').trim()
  if (!clean) return
  try {
    window.localStorage.setItem(
      BOARD_SESSION_STORAGE_KEY,
      JSON.stringify({ token: clean, createdAt: Date.now() })
    )
  } catch {
    // ignore
  }
}

export function clearBoardSessionToken() {
  try {
    window.localStorage.removeItem(BOARD_SESSION_STORAGE_KEY)
  } catch {
    // ignore
  }
}

function canUseLocalFallback(origin, token) {
  const o = String(origin || '')
  return (
    /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(o) ||
    String(token || '').startsWith('share_local_')
  )
}

function tryLocalToken(token) {
  const clean = String(token || '').trim()
  if (!clean) return null
  try {
    const key = `bw_share_affrep:${clean}`
    const raw = window.localStorage.getItem(key)
    if (raw) return { ok: true, payload: null }
  } catch {
    // ignore
  }
  return null
}

export async function validateAffiliateReportsToken(token) {
  const clean = String(token || '').trim()
  if (!clean) return { ok: false, error: 'missing' }

  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
  const allowLocal = canUseLocalFallback(origin, clean)

  const local = () => (allowLocal ? tryLocalToken(clean) : null)

  try {
    const resp = await fetch(`/api/share/affiliate-reports/${encodeURIComponent(clean)}`)
    const data = await resp.json().catch(() => null)
    if (!resp.ok) {
      const l = local()
      if (l) return l
      try {
        const resp2 = await fetch(`/api/share/affiliate-analysis/${encodeURIComponent(clean)}`)
        const data2 = await resp2.json().catch(() => null)
        if (!resp2.ok) {
          const l2 = local()
          if (l2) return l2
          return { ok: false, error: data2?.error || data2?.message || 'invalid' }
        }
        if (!data2?.ok) return { ok: false, error: data2?.error || 'invalid' }
        return { ok: true, payload: data2?.payload || data2?.data || null }
      } catch {
        const l3 = local()
        if (l3) return l3
        return { ok: false, error: data?.error || data?.message || 'invalid' }
      }
    }

    if (!data?.ok) {
      const l = local()
      if (l) return l
      return { ok: false, error: data?.error || 'invalid' }
    }

    return { ok: true, payload: data?.payload || data?.data || null }
  } catch {
    const l = local()
    if (l) return l
    return { ok: false, error: 'network' }
  }
}

export function canonicalAffiliateName(name, nameIndex) {
  const decoded = String(name || '').trim()
  const key = normalizeKey(decoded)
  return (nameIndex && nameIndex.get(key)) || decoded
}
