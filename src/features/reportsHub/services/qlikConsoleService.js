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

export async function fetchQlikEngineSheets(appId) {
  const id = String(appId || '').trim()
  if (!id) throw new Error('Missing appId')
  return requestJson(`/engine/apps/${encodeURIComponent(id)}/sheets`)
}

export async function fetchQlikEngineSheetObjects(appId, sheetId) {
  const app = String(appId || '').trim()
  const sheet = String(sheetId || '').trim()
  if (!app) throw new Error('Missing appId')
  if (!sheet) throw new Error('Missing sheetId')
  return requestJson(
    `/engine/apps/${encodeURIComponent(app)}/sheets/${encodeURIComponent(sheet)}/objects`
  )
}

export async function fetchQlikEngineObjectData(appId, objectId, { rows = 200, cols = 20 } = {}) {
  const app = String(appId || '').trim()
  const object = String(objectId || '').trim()
  if (!app) throw new Error('Missing appId')
  if (!object) throw new Error('Missing objectId')

  const r = Number.isFinite(Number(rows)) ? Math.max(1, Math.min(2000, Number(rows))) : 200
  const c = Number.isFinite(Number(cols)) ? Math.max(1, Math.min(50, Number(cols))) : 20
  return requestJson(
    `/engine/apps/${encodeURIComponent(app)}/objects/${encodeURIComponent(object)}/data?rows=${r}&cols=${c}`
  )
}
