import { fetchTextCached, withReportsVersion } from '../../../lib/fetchCache'

const CREOLABS_INDEX_URL = '/creolabs_index.json'
const CREOLABS_CLIENTS_TABLE_URL = '/creolabs_clients_table.json'

export async function loadCreolabsIndex({ force = false } = {}) {
  const url = withReportsVersion(CREOLABS_INDEX_URL)
  const text = await fetchTextCached(url, {
    force,
    headers: {
      Accept: 'application/json',
    },
  })

  const trimmed = String(text || '').trimStart()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    throw new Error(
      'creolabs_index.json is missing (server returned HTML). If you are in dev, restart Vite so it can serve newly generated public files.'
    )
  }
  try {
    return JSON.parse(text)
  } catch (e) {
    if (!force) return await loadCreolabsIndex({ force: true })
    const err = new Error('Invalid creolabs_index.json')
    err.cause = e
    throw err
  }
}

export async function loadCreolabsClientsTable({ force = false } = {}) {
  const url = withReportsVersion(CREOLABS_CLIENTS_TABLE_URL)
  const text = await fetchTextCached(url, {
    force,
    headers: {
      Accept: 'application/json',
    },
  })

  const trimmed = String(text || '').trimStart()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    throw new Error(
      'creolabs_clients_table.json is missing (server returned HTML). If you are in dev, restart Vite so it can serve newly generated public files.'
    )
  }

  try {
    return JSON.parse(text)
  } catch (e) {
    if (!force) return await loadCreolabsClientsTable({ force: true })
    const err = new Error('Invalid creolabs_clients_table.json')
    err.cause = e
    throw err
  }
}
