function hasKvEnv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function kvRequest(path, options) {
  const base = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  const url = path ? `${base}${path}` : base

  const resp = await fetch(url, {
    method: options?.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options?.headers || null),
    },
    body: options?.body,
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

async function kvCommand(commandArray) {
  // Upstash Redis REST API supports POSTing a command array to the base URL.
  // This avoids URL length limits for large values.
  return kvRequest('', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commandArray),
  })
}

async function kvSetJson(key, value, ttlSeconds) {
  const json = JSON.stringify(value)
  const ttl = Number(ttlSeconds)
  if (Number.isFinite(ttl) && ttl > 0) {
    await kvCommand(['SET', key, json, 'EX', String(Math.trunc(ttl))])
  } else {
    await kvCommand(['SET', key, json])
  }
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
  await kvCommand(['LPUSH', key, json])
}

module.exports = {
  hasKvEnv,
  kvSetJson,
  kvGetJson,
  kvExpire,
  kvLpushJson,
}
