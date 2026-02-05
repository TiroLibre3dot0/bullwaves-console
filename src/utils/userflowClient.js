let initStarted = false
let initPromise = null

export function getUserflowToken() {
  const token = (import.meta?.env?.VITE_USERFLOW_TOKEN || '').trim()
  // Fallback to the provided production token if env is not set.
  return token || 'ct_us1_54kyscwdbredhhxehctrlqky24'
}

export async function initUserflowAfterLogin(user) {
  if (typeof window === 'undefined') return
  if (initStarted) return initPromise
  initStarted = true

  initPromise = (async () => {
    const token = getUserflowToken()
    if (!token) return

    const mod = await import('userflow.js')
    const userflow = mod?.default || mod
    if (!userflow?.init) return

    userflow.init(token)

    // Keep this tool decoupled from CRM tracking by default.
    // You can opt-in to email identification via env.
    const identifyMode = String(import.meta?.env?.VITE_USERFLOW_IDENTIFY_MODE || 'anonymous')
      .trim()
      .toLowerCase()

    if (identifyMode === 'off' || identifyMode === 'disabled' || identifyMode === 'false') return

    if (identifyMode === 'email') {
      const email = String(user?.email || '').trim()
      if (!email) {
        userflow.identifyAnonymous?.()
        return
      }
      userflow.identify(email, {
        name: String(user?.name || '').trim() || undefined,
        email,
      })
      return
    }

    userflow.identifyAnonymous?.()
  })()

  return initPromise
}
