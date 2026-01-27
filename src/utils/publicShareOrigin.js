export function getPublicShareOrigin() {
  try {
    const raw =
      (typeof import.meta !== 'undefined' &&
        import.meta.env &&
        (import.meta.env.VITE_PUBLIC_SHARE_ORIGIN ||
          import.meta.env.VITE_PUBLIC_SHARE_BASE_URL ||
          import.meta.env.VITE_SHARE_ORIGIN)) ||
      ''

    const trimmed = String(raw || '')
      .trim()
      .replace(/\/+$/, '')
    if (trimmed) return trimmed
  } catch {
    // ignore
  }

  if (typeof window === 'undefined' || !window.location) return ''

  const runtimeOrigin = window.location.origin || ''
  const hostname = String(window.location.hostname || '').toLowerCase()

  // Local dev should keep using localhost.
  if (/^(localhost|127\.0\.0\.1)$/.test(hostname)) return runtimeOrigin

  // If we're already on the public host, keep it.
  if (hostname === 'bullwaves-console.vercel.app') return runtimeOrigin

  // Default: always generate public share links against the canonical public host.
  return 'https://bullwaves-console.vercel.app'
}
