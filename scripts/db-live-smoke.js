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

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  console.log(`[db-live-smoke] base=${BASE_URL}`)

  const dbLive = await getJson('/api/qlik/creolabs/db-live?limit=5&sort=-clientTimestamp,-clientId&monthFallback=1')
  const dbMeta = dbLive?.data?.meta || {}
  assert(dbMeta.contractVersion === 'db-live-v1.1', 'Unexpected db-live contractVersion')
  assert(dbMeta.freshness && typeof dbMeta.freshness.state === 'string', 'Missing freshness block')
  assert(dbMeta.quality && Number.isFinite(Number(dbMeta.quality.score)), 'Missing quality score')

  const status = await getJson('/api/qlik/creolabs/db-live-ingestion-status')
  assert(status?.data?.contractVersion === 'db-live-v1.1', 'Unexpected status contractVersion')

  const templates = await getJson('/api/qlik/creolabs/db-live-report-templates')
  assert(templates?.data?.contractVersion === 'db-live-report-templates-v1', 'Unexpected templates contractVersion')
  assert(Array.isArray(templates?.data?.templates), 'Templates payload is not an array')

  const jobs = await getJson('/api/qlik/creolabs/reports/jobs')
  assert(jobs?.data?.contractVersion === 'db-live-reports-jobs-v1', 'Unexpected reports jobs contractVersion')

  const exported = await getJson('/api/qlik/creolabs/db-live-export?format=json&limit=20')
  assert(exported?.data?.contractVersion === 'db-live-export-v1', 'Unexpected export contractVersion')
  assert(Array.isArray(exported?.data?.users), 'Export users is not an array')

  console.log('[db-live-smoke] OK')
}

main().catch((error) => {
  console.error('[db-live-smoke] FAIL:', error?.message || error)
  process.exitCode = 1
})
