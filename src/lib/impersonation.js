const IMPERSONATION_QUERY_KEY = 'bw_impersonate'
const IMPERSONATION_SESSION_KEY = 'bw-auth-impersonation'

function sanitizeImpersonationUser(user) {
  if (!user || typeof user !== 'object') return null

  const email = String(user.email || '')
    .trim()
    .toLowerCase()
  if (!email) return null

  return {
    name: String(user.name || '').trim(),
    email,
    division: String(user.division || '').trim(),
    department: String(user.department || user.section || '').trim(),
    section: String(user.section || user.department || '').trim(),
    title: String(user.title || '').trim(),
    isManagementTeam: Boolean(user.isManagementTeam),
  }
}

function readRawImpersonationParam(search = '') {
  try {
    const params = new window.URLSearchParams(String(search || ''))
    return params.get(IMPERSONATION_QUERY_KEY)
  } catch {
    return null
  }
}

function parseRawImpersonation(rawValue) {
  if (!rawValue) return null
  try {
    return sanitizeImpersonationUser(JSON.parse(rawValue))
  } catch {
    return null
  }
}

export function getImpersonationFromLocation(locationLike) {
  if (!locationLike) return null
  return parseRawImpersonation(readRawImpersonationParam(locationLike.search || ''))
}

export function getStoredImpersonation() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null
  try {
    return parseRawImpersonation(window.sessionStorage.getItem(IMPERSONATION_SESSION_KEY))
  } catch {
    return null
  }
}

export function storeImpersonation(user) {
  const sanitized = sanitizeImpersonationUser(user)
  if (!sanitized || typeof window === 'undefined' || !window.sessionStorage) return null
  try {
    window.sessionStorage.setItem(IMPERSONATION_SESSION_KEY, JSON.stringify(sanitized))
  } catch {
    return null
  }
  return sanitized
}

export function clearStoredImpersonation() {
  if (typeof window === 'undefined' || !window.sessionStorage) return
  try {
    window.sessionStorage.removeItem(IMPERSONATION_SESSION_KEY)
  } catch {
    // ignore
  }
}

export function clearImpersonationQueryParam() {
  if (typeof window === 'undefined' || !window.location || !window.history) return
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(IMPERSONATION_QUERY_KEY)) return
    url.searchParams.delete(IMPERSONATION_QUERY_KEY)
    const next = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState(window.history.state, '', next || '/')
  } catch {
    // ignore
  }
}

export function buildImpersonationUrl(pathname = '/home', user) {
  const sanitized = sanitizeImpersonationUser(user)
  if (!sanitized || typeof window === 'undefined' || !window.location) return ''

  const url = new URL(pathname || '/home', window.location.origin)
  url.searchParams.set(IMPERSONATION_QUERY_KEY, JSON.stringify(sanitized))
  return url.toString()
}
