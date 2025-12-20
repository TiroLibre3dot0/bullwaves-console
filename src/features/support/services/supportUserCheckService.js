// supportUserCheckService.js
// Loads and parses the Registrations Report CSV, normalizes fields, builds a deterministic search index, and provides search utilities.
import Papa from 'papaparse'

const CSV_PATH = '/Registrations Report.csv'
let _cache = null
let _parsedCount = 0
let _firstRowKeys = []

function normalizeHeaderKey(header) {
  if (header == null) return ''
  return header.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function normalizeForIndex(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim().toLowerCase()
}

// helper to pick first non-empty among several normalized keys
function pickField(obj, candidates) {
  for (const k of candidates) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return String(obj[k])
  }
  return ''
}

export async function loadCsvRows(force = false) {
  if (_cache && !force) return _cache
  const res = await fetch(encodeURI(CSV_PATH))
  if (!res.ok) throw new Error('CSV fetch error: ' + res.status + ' ' + res.statusText)
  const text = await res.text()
  const { data, errors, meta } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true })
  if (errors && errors.length) throw new Error('CSV parse error: ' + errors[0].message)
  if (!data || data.length === 0) throw new Error('CSV loaded but contains no rows or headers mismatch')

  // normalize headers/rows into compact keys (e.g. Customer Name -> customername)
  _parsedCount = data.length
  _firstRowKeys = Object.keys(data[0] || {})

  const NAME_KEYS = ['customername', 'customer_name', 'name', 'fullname']
  const USERID_KEYS = ['userid', 'user_id', 'user id', 'user']
  const MT5_KEYS = ['mt5account', 'mt5_account', 'mt5']
  const COUNTRY_KEYS = ['country']
  const AFF_KEYS = ['affiliateid', 'affiliate_id', 'affiliate']

  _cache = data.map(rawRow => {
    const row = {}
    // map original columns into normalized compact keys with original (trimmed) values
    for (const origKey of Object.keys(rawRow)) {
      const k = normalizeHeaderKey(origKey)
      const v = rawRow[origKey] == null ? '' : String(rawRow[origKey]).trim()
      row[k] = v
    }

    // build a deterministic search index (normalized lowercased, collapsed spaces)
    const name = normalizeForIndex(pickField(row, NAME_KEYS))
    const uid = normalizeForIndex(pickField(row, USERID_KEYS))
    const mt5 = normalizeForIndex(pickField(row, MT5_KEYS))
    const country = normalizeForIndex(pickField(row, COUNTRY_KEYS))
    const aff = normalizeForIndex(pickField(row, AFF_KEYS))

    row.__searchIndex = [name, uid, mt5, country, aff].filter(Boolean).join(' ')
    return row
  })

  // DEV-only self-test: ensure search can return at least the first customer's name
  try {
    const mode = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE) ? import.meta.env.MODE : (typeof process !== 'undefined' ? process.env.NODE_ENV : 'production')
    if (mode !== 'production') {
      const firstName = pickField(_cache[0], NAME_KEYS)
      if (firstName) {
        const found = await searchUsers(firstName)
        if (!found || found.length === 0) throw new Error('DEV self-test failed: first CSV customer not found by search')
      }
    }
  } catch (err) {
    // bubble up DEV self-test errors so developer sees them early
    throw err
  }

  return _cache
}

export function getParsedCount() {
  return _parsedCount
}

export function getFirstRowKeys() {
  return _firstRowKeys
}

export async function searchUsers(query) {
  if (!query && query !== 0) return []
  const rows = await loadCsvRows()
  const qRaw = String(query).trim()
  const qNorm = normalizeForIndex(qRaw)

  // If query looks numeric, match numeric IDs exactly (or as substring)
  if (/^\d+$/.test(qRaw)) {
    return rows.filter(r => {
      const uid = (r.userid || r.user_id || r.user || '')
      const mt5 = (r.mt5account || r.mt5 || '')
      const uidDigits = String(uid).replace(/\D/g, '')
      const mt5Digits = String(mt5).replace(/\D/g, '')
      return uidDigits.includes(qRaw) || mt5Digits.includes(qRaw)
    })
  }

  // Textual search against precomputed __searchIndex
  const results = rows.filter(r => r.__searchIndex && r.__searchIndex.includes(qNorm))

  // Guard: if known record exists in CSV and our search returned 0, throw
  const knownName = 'oliver drejer'
  const hasKnown = rows.some(r => (r.customername || '').toLowerCase().includes(knownName))
  if (hasKnown && results.length === 0 && qNorm.toLowerCase().includes(knownName.split(' ')[0])) {
    throw new Error('Search logic failure: known record not matched')
  }

  return results
}

export function computePriority(row) {
  if (!row) return 'unknown'
  const regDate = row.registrationdate || row.externaldate || ''
  const hasAffiliate = !!(row.affiliateid || row.affiliate)
  if (hasAffiliate && regDate) return 'high'
  if (hasAffiliate) return 'medium'
  return 'normal'
}

export function logAudit(action, payload) {
  const logs = JSON.parse(localStorage.getItem('supportUserCheckAudit') || '[]')
  logs.push({ action, payload, ts: Date.now() })
  localStorage.setItem('supportUserCheckAudit', JSON.stringify(logs))
}

export function getAuditLog() {
  return JSON.parse(localStorage.getItem('supportUserCheckAudit') || '[]')
}
