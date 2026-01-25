function hasKvEnv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function kvRequest(path) {
  const base = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  const url = `${base}${path}`

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  let data = null
  try {
    data = await resp.json()
  } catch {
    // ignore
  }

  if (!resp.ok) {
    const message = data?.error || data?.message || `KV request failed (${resp.status})`
    const err = new Error(message)
    err.status = resp.status
    err.data = data
    throw err
  }

  return data
}

async function kvSetJson(key, value, ttlSeconds) {
  const json = JSON.stringify(value)
  const encodedKey = encodeURIComponent(key)
  const encodedValue = encodeURIComponent(json)
  const ex = ttlSeconds ? `?EX=${encodeURIComponent(String(ttlSeconds))}` : ''
  await kvRequest(`/set/${encodedKey}/${encodedValue}${ex}`)
}

async function kvGetJson(key) {
  const encodedKey = encodeURIComponent(key)
  const data = await kvRequest(`/get/${encodedKey}`)
  const raw = data?.result
  if (raw == null) return null

  if (typeof raw === 'object') return raw

  try {
    return JSON.parse(String(raw))
  } catch {
    return null
  }
}

async function kvExpire(key, ttlSeconds) {
  const encodedKey = encodeURIComponent(key)
  const ttl = Number(ttlSeconds)
  if (!Number.isFinite(ttl) || ttl <= 0) return
  await kvRequest(`/expire/${encodedKey}/${encodeURIComponent(String(ttl))}`)
}

async function kvLpushJson(key, value) {
  const json = JSON.stringify(value)
  const encodedKey = encodeURIComponent(key)
  const encodedValue = encodeURIComponent(json)
  await kvRequest(`/lpush/${encodedKey}/${encodedValue}`)
}

module.exports = {
  hasKvEnv,
  kvSetJson,
  kvGetJson,
  kvExpire,
  kvLpushJson,
}
