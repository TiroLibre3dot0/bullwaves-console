// Lightweight service to load fraud patterns index for dashboard lookups
// Usage: import { loadFraudPatternsIndex } from './fraudPatternsService'

export async function loadFraudPatternsIndex() {
  const res = await fetch('/fraud_patterns_index.json')
  if (!res.ok) throw new Error('Failed to load fraud patterns index')
  return await res.json()
}

export function getFraudPatternForUser(index, userId) {
  if (!index || !userId) return null
  const key = String(userId).trim().toLowerCase()
  return index[key] || null
}
