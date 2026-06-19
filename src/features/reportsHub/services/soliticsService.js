export async function fetchSoliticsSummary() {
  const response = await fetch('/api/reports/solitics', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || !payload?.ok) {
    const message =
      payload?.message || payload?.error || `Solitics API failed (${response.status})`
    throw new Error(message)
  }

  return payload.data
}
