const QLIK_API_BASE = '/api/qlik'

async function requestJson(path) {
  const response = await fetch(`${QLIK_API_BASE}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    const message = payload?.error || `Qlik API request failed (${response.status})`
    const err = new Error(message)
    err.status = response.status
    err.details = payload?.details || ''
    err.payload = payload
    throw err
  }

  return payload
}

export async function fetchQlikHealth() {
  return requestJson('/health')
}

export async function fetchQlikItems(limit = 20) {
  const size = Number.isFinite(Number(limit)) ? Math.min(100, Math.max(1, Number(limit))) : 20
  return requestJson(`/items?limit=${size}`)
}

export async function fetchQlikApps(limit = 20) {
  const size = Number.isFinite(Number(limit)) ? Math.min(100, Math.max(1, Number(limit))) : 20
  return requestJson(`/apps?limit=${size}`)
}

export async function fetchQlikSnapshot(limit = 20) {
  const [health, items, apps] = await Promise.all([
    fetchQlikHealth(),
    fetchQlikItems(limit),
    fetchQlikApps(limit),
  ])

  return {
    health,
    items,
    apps,
    fetchedAt: new Date().toISOString(),
  }
}
