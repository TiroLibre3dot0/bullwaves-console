/* eslint-disable no-console */

const BASE_URL = process.env.DB_LIVE_BASE_URL || 'http://localhost:4000'

async function getJson(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message = body?.error || `${res.status} ${res.statusText}`
    throw new Error(`GET ${path} failed: ${message}`)
  }
  if (!body?.ok) {
    throw new Error(`GET ${path} returned ok=false`)
  }
  return body
}

async function postJson(path, payload) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message = body?.error || `${res.status} ${res.statusText}`
    throw new Error(`POST ${path} failed: ${message}`)
  }
  if (!body?.ok) {
    throw new Error(`POST ${path} returned ok=false`)
  }
  return body
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  console.log(`[db-live-smoke-deep] base=${BASE_URL}`)

  const clearRes = await postJson('/api/qlik/creolabs/db-live-ingestion-control', {
    action: 'clear-store',
  })
  assert(
    clearRes?.data?.contractVersion === 'db-live-ingestion-control-v1',
    'Unexpected ingestion control contract after clear-store'
  )

  const exportAfterClear = await getJson('/api/qlik/creolabs/db-live-export?format=json&limit=10')
  assert(exportAfterClear?.data?.contractVersion === 'db-live-export-v1', 'Unexpected export contract after clear-store')
  assert(Number(exportAfterClear?.data?.count || 0) === 0, 'Store should be empty after clear-store')

  const fullRefreshRes = await postJson('/api/qlik/creolabs/db-live-ingestion-control', {
    action: 'full-refresh',
  })
  assert(
    fullRefreshRes?.data?.contractVersion === 'db-live-ingestion-control-v1',
    'Unexpected ingestion control contract after full-refresh'
  )
  assert(fullRefreshRes?.data?.run && typeof fullRefreshRes.data.run === 'object', 'Missing run metadata after full-refresh')

  const status = await getJson('/api/qlik/creolabs/db-live-ingestion-status')
  assert(status?.data?.contractVersion === 'db-live-v1.1', 'Unexpected ingestion status contract')
  assert(typeof status?.data?.auditLogFile === 'string', 'Missing auditLogFile in status payload')

  console.log('[db-live-smoke-deep] OK')
}

main().catch((error) => {
  console.error('[db-live-smoke-deep] FAIL:', error?.message || error)
  process.exitCode = 1
})
