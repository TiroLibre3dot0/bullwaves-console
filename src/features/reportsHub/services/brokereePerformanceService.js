const BROKEREE_API_BASE = '/api/brokeree'

async function requestJson(path) {
  const response = await fetch(`${BROKEREE_API_BASE}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    const message = payload?.error || `Brokeree API request failed (${response.status})`
    const err = new Error(message)
    err.status = response.status
    err.details = payload?.details || ''
    err.payload = payload
    throw err
  }

  return payload
}

export async function fetchBrokereeHealth() {
  return requestJson('/health')
}

export async function fetchBrokereePerformance({ from, to, limit = 500 } = {}) {
  const params = new URLSearchParams()
  if (from) params.set('from', String(from))
  if (to) params.set('to', String(to))
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(2000, Number(limit))) : 500
  params.set('limit', String(safeLimit))

  const qs = params.toString()
  return requestJson(`/performance${qs ? `?${qs}` : ''}`)
}
