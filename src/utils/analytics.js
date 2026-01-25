// Lightweight analytics integration for public share pages.
// No DB required: relies on a hosted analytics provider (default: Plausible).

const DEFAULT_PLAUSIBLE_SRC = 'https://plausible.io/js/script.js'

export function initAnalytics() {
  if (typeof document === 'undefined') return

  const provider = String(import.meta.env.VITE_ANALYTICS_PROVIDER || 'plausible').toLowerCase()
  if (provider !== 'plausible') return

  const domain = String(import.meta.env.VITE_PLAUSIBLE_DOMAIN || '').trim()
  if (!domain) return

  const src = String(import.meta.env.VITE_PLAUSIBLE_SRC || DEFAULT_PLAUSIBLE_SRC).trim()
  if (!src) return

  // Install Plausible queue stub early so events fired before the script loads are not lost.
  if (typeof window !== 'undefined' && typeof window.plausible !== 'function') {
    window.plausible = function () {
      ;(window.plausible.q = window.plausible.q || []).push(arguments)
    }
  }

  // Avoid double-inject.
  const existing = document.querySelector('script[data-bw-analytics="plausible"]')
  if (existing) return

  const script = document.createElement('script')
  script.defer = true
  script.src = src
  script.setAttribute('data-domain', domain)
  script.setAttribute('data-bw-analytics', 'plausible')
  document.head.appendChild(script)
}

const LOCAL_EVENTS_KEY = 'bw_local_analytics_events_v1'
const LOCAL_EVENTS_MAX = 200

function readLocalEvents() {
  try {
    const raw = window.localStorage.getItem(LOCAL_EVENTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalEvents(list) {
  try {
    window.localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function recordLocalEvent(entry) {
  if (typeof window === 'undefined') return
  if (!window.localStorage) return

  const list = readLocalEvents()
  list.unshift(entry)
  if (list.length > LOCAL_EVENTS_MAX) list.length = LOCAL_EVENTS_MAX
  writeLocalEvents(list)
}

function fnv1a32(input) {
  // Non-cryptographic stable hash; good enough for grouping in analytics.
  const str = String(input || '')
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i)
    // 32-bit FNV-1a prime
    hash = (hash * 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

export function track(eventName, props = undefined) {
  try {
    if (typeof window === 'undefined') return false

    // Local preview for the in-console Custom Events page.
    try {
      recordLocalEvent({ ts: Date.now(), eventName, props: props || {} })
    } catch {
      // ignore
    }

    const provider = String(import.meta.env.VITE_ANALYTICS_PROVIDER || 'plausible').toLowerCase()
    if (provider === 'plausible' && typeof window.plausible === 'function') {
      window.plausible(eventName, props ? { props } : undefined)
      return true
    }

    return false
  } catch {
    return false
  }
}

export function getRecentLocalEvents(limit = 50) {
  if (typeof window === 'undefined') return []
  const n = Math.max(0, Math.min(Number(limit) || 50, LOCAL_EVENTS_MAX))
  return readLocalEvents().slice(0, n)
}

export function clearLocalEvents() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LOCAL_EVENTS_KEY)
  } catch {
    // ignore
  }
}

export function trackPublicShareOpen({ kind, token, generatedAt, extra } = {}) {
  const safeKind = String(kind || 'share').trim() || 'share'

  // Never send the raw token (it can embed data). Use a stable hash instead.
  const shareId = token ? fnv1a32(token) : ''

  const props = {
    kind: safeKind,
    share_id: shareId,
    generated_at: generatedAt ? String(generatedAt) : '',
    ...(extra && typeof extra === 'object' ? extra : null),
  }

  // Remove empty keys to keep analytics tidy.
  for (const k of Object.keys(props)) {
    if (props[k] === '' || props[k] == null) delete props[k]
  }

  return track('public_share_open', props)
}
