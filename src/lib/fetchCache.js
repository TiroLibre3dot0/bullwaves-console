import { parseCsv } from './csv'

const textCache = new Map()
const csvRowsCache = new Map()

export function withReportsVersion(path) {
  const encodedPath = encodeURI(String(path || ''))
  let v = null
  try {
    v =
      window?.localStorage?.getItem('bw_reports_version') ||
      window?.localStorage?.getItem('bw_reports_meta_generatedAt')
  } catch {
    v = null
  }
  if (!v) return encodedPath
  const sep = encodedPath.includes('?') ? '&' : '?'
  return `${encodedPath}${sep}v=${encodeURIComponent(String(v))}`
}

function makeCacheKey(url, headers) {
  const base = String(url || '')
  if (!headers) return base

  // Keep it simple: stable enough for our limited use (mainly Accept).
  try {
    const HeadersCtor = globalThis?.Headers
    const obj =
      HeadersCtor && headers instanceof HeadersCtor
        ? Object.fromEntries(headers.entries())
        : headers
    const entries = Object.entries(obj || {}).sort(([a], [b]) => a.localeCompare(b))
    return `${base}@@headers=${JSON.stringify(entries)}`
  } catch {
    return `${base}@@headers=1`
  }
}

async function fetchTextUncached(url, { force = false, headers } = {}) {
  const resp = await fetch(url, { cache: force ? 'no-store' : 'default', headers })
  if (!resp.ok) {
    const err = new Error(`HTTP ${resp.status} while fetching ${url}`)
    err.status = resp.status
    throw err
  }
  return await resp.text()
}

export async function fetchTextCached(url, { force = false, headers } = {}) {
  const key = makeCacheKey(url, headers)
  if (!key) return ''

  if (!force && textCache.has(key)) {
    const cached = textCache.get(key)
    return cached instanceof Promise ? await cached : cached
  }

  const p = fetchTextUncached(String(url || ''), { force, headers })
  textCache.set(key, p)
  try {
    const text = await p
    textCache.set(key, text)
    return text
  } catch (e) {
    textCache.delete(key)
    throw e
  }
}

export async function fetchCsvRowsCached(url, { force = false } = {}) {
  const key = String(url || '')
  if (!key) return []

  if (!force && csvRowsCache.has(key)) {
    const cached = csvRowsCache.get(key)
    return cached instanceof Promise ? await cached : cached
  }

  const p = (async () => {
    const text = await fetchTextCached(key, { force })
    return parseCsv(text)
  })()

  csvRowsCache.set(key, p)
  try {
    const rows = await p
    csvRowsCache.set(key, rows)
    return rows
  } catch (e) {
    csvRowsCache.delete(key)
    throw e
  }
}

export async function fetchFirstOkCsvRowsCached(candidatePaths = [], { force = false } = {}) {
  for (const rawPath of candidatePaths) {
    const url = withReportsVersion(rawPath)
    try {
      const rows = await fetchCsvRowsCached(url, { force })
      if (Array.isArray(rows) && rows.length) return { rows, sourcePath: rawPath }
      if (Array.isArray(rows) && rows.length === 0) {
        // If the file exists but is empty, treat as success.
        return { rows, sourcePath: rawPath }
      }
    } catch {
      // try next
    }
  }
  return { rows: [], sourcePath: null }
}

export function clearFetchCaches() {
  textCache.clear()
  csvRowsCache.clear()
}
