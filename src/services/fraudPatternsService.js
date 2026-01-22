// Lightweight service to load fraud patterns index for dashboard lookups
// Usage: import { loadFraudPatternsIndex } from './fraudPatternsService'

import { withReportsVersion } from '../lib/fetchCache'

export async function loadFraudPatternsIndex() {
  const res = await fetch(withReportsVersion('/fraud_patterns_index.json'), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load fraud patterns index')
  return await res.json()
}

export function getFraudPatternForUser(index, userId) {
  if (!index || !userId) return null
  const key = String(userId).trim().toLowerCase()
  return index[key] || null
}
