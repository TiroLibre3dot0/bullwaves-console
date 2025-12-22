// supportUserCheckService.js
// Loads and parses the Registrations Report CSV, normalizes fields, builds a deterministic search index, and provides search utilities.
import Papa from 'papaparse'

const CSV_PATH = '/Registrations Report.csv'
let _cache = null
let _parsedCount = 0
let _firstRowKeys = []
let _idMap = null
let _mt5Map = null
let _emailMap = null

// normalized header keys used across functions
const NAME_KEYS = ['customername', 'customer_name', 'name', 'fullname']
const USERID_KEYS = ['userid', 'user_id', 'user id', 'user']
const MT5_KEYS = ['mt5account', 'mt5_account', 'mt5']
const EMAIL_KEYS = ['email', 'e-mail', 'customeremail', 'customer_email']
const COUNTRY_KEYS = ['country']
const AFF_KEYS = ['affiliateid', 'affiliate_id', 'affiliate']
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
    const email = normalizeForIndex(pickField(row, EMAIL_KEYS))
    const country = normalizeForIndex(pickField(row, COUNTRY_KEYS))
    const aff = normalizeForIndex(pickField(row, AFF_KEYS))

    // include email in the search index so textual queries match addresses
    row.__searchIndex = [name, uid, mt5, email, country, aff].filter(Boolean).join(' ')
    return row
  })

  // build quick lookup maps for exact numeric id / mt5 matches
  _idMap = {}
  _mt5Map = {}
  _emailMap = {}
  for (const r of _cache) {
    const uidRaw = pickField(r, USERID_KEYS)
    const uidKey = uidRaw ? String(uidRaw).replace(/\D+/g, '') : ''
    if (uidKey) {
      _idMap[uidKey] = _idMap[uidKey] || []
      _idMap[uidKey].push(r)
    }
    const mt5Raw = pickField(r, MT5_KEYS)
    const mt5Key = mt5Raw ? String(mt5Raw).replace(/\D+/g, '') : ''
    if (mt5Key) {
      _mt5Map[mt5Key] = _mt5Map[mt5Key] || []
      _mt5Map[mt5Key].push(r)
    }
    const emailRaw = pickField(r, EMAIL_KEYS)
    if (emailRaw) {
      const lk = String(emailRaw).toLowerCase().trim()
      if (lk) _emailMap[lk] = _emailMap[lk] || []
      _emailMap[lk].push(r)
    }
  }

  // DEV-only local self-check (no async recursion)
  try {
    const mode = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE) ? import.meta.env.MODE : (typeof process !== 'undefined' ? process.env.NODE_ENV : 'production')
    if (mode !== 'production') {
      const firstName = pickField(_cache[0], NAME_KEYS)
      if (firstName) {
        const has = _cache.some(r => (r.customername || '').toLowerCase().includes(String(firstName).toLowerCase()))
        if (!has) throw new Error('DEV self-test failed: first CSV customer not present after parsing')
      }
    }
  } catch (err) {
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
    // prefer fast map lookups when available
    const exact = []
    if (_idMap && _idMap[qRaw]) exact.push(..._idMap[qRaw])
    if (_mt5Map && _mt5Map[qRaw]) exact.push(..._mt5Map[qRaw])
    if (exact.length) {
      // mark match source for UI badges
      for (const r of exact) {
        if (String(pickField(r, USERID_KEYS)).replace(/\D+/g, '') === qRaw) r.__matchSource = r.__matchSource || 'id'
        else if (String(pickField(r, MT5_KEYS)).replace(/\D+/g, '') === qRaw) r.__matchSource = r.__matchSource || 'mt5'
      }
      return Array.from(new Set(exact))
    }

    // try to find matching id/mt5 keys that contain the query (handles partial/long numeric ids)
    const partialMatches = []
    if (_idMap) {
      for (const k of Object.keys(_idMap)) {
        if (k.includes(qRaw)) partialMatches.push(..._idMap[k])
      }
    }
    if (_mt5Map) {
      for (const k of Object.keys(_mt5Map)) {
        if (k.includes(qRaw)) partialMatches.push(..._mt5Map[k])
      }
    }
    if (partialMatches.length) {
      // mark matchSource appropriately
      for (const r of partialMatches) {
        const uidDigits = String(pickField(r, USERID_KEYS)).replace(/\D+/g, '')
        const mt5Digits = String(pickField(r, MT5_KEYS)).replace(/\D+/g, '')
        if (uidDigits.includes(qRaw)) r.__matchSource = r.__matchSource || 'id'
        else if (mt5Digits.includes(qRaw)) r.__matchSource = r.__matchSource || 'mt5'
      }
      return Array.from(new Set(partialMatches))
    }

    // final fallback: scan rows' uid/mt5 digit substrings
    return rows.filter(r => {
      const uid = (r.userid || r.user_id || r.user || '')
      const mt5 = (r.mt5account || r.mt5 || '')
      const uidDigits = String(uid).replace(/\D/g, '')
      const mt5Digits = String(mt5).replace(/\D/g, '')
      return uidDigits.includes(qRaw) || mt5Digits.includes(qRaw)
    })
  }

  // If query looks like an email, prefer fast exact lookup
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(qRaw)) {
    const key = qRaw.toLowerCase()
    if (_emailMap && _emailMap[key]) {
      for (const r of _emailMap[key]) r.__matchSource = r.__matchSource || 'email'
      return Array.from(new Set(_emailMap[key]))
    }
    // fallback to substring scan in email fields
    const byEmail = rows.filter(r => {
      const e = (r.email || r.e_mail || r.customeremail || '')
      return e && String(e).toLowerCase().includes(key)
    })
    if (byEmail.length) {
      for (const r of byEmail) r.__matchSource = r.__matchSource || 'email-substring'
      return byEmail
    }
  }

  // Textual search against precomputed __searchIndex
  const results = rows.filter(r => r.__searchIndex && r.__searchIndex.includes(qNorm))
  // mark textual matches
  for (const r of results) r.__matchSource = r.__matchSource || 'text'

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

// --- Media Report loading and affiliate lookup ---
let _mediaCache = null
let _affiliateMap = null
let _paymentsCache = null
let _paymentsAffiliateMap = null
let _affiliateKpiMap = null

export async function loadMediaReport(force = false) {
  if (_mediaCache && !force) return _affiliateMap || {}
  try {
    const res = await fetch(encodeURI('/Media Report.csv'))
    if (!res.ok) {
      _mediaCache = []
      _affiliateMap = {}
      return _affiliateMap
    }
    const text = await res.text()
    const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true })
    if (errors && errors.length) {
      _mediaCache = []
      _affiliateMap = {}
      return _affiliateMap
    }
    _mediaCache = data || []
    _affiliateMap = {}
    // normalize rows and build map keyed by possible affiliate id fields
    for (const rawRow of _mediaCache) {
      const row = {}
      for (const k of Object.keys(rawRow || {})) {
        const nk = normalizeHeaderKey(k)
        row[nk] = rawRow[k] == null ? '' : String(rawRow[k]).trim()
      }
      // try common id fields: uid, affiliateid, id
      const idCandidates = [row.uid, row.affiliateid, row.id, row.affiliatid]
      const id = idCandidates.find(x => x !== undefined && x !== null && String(x).trim() !== '')
      if (id) {
        _affiliateMap[String(id).trim()] = {
          name: row.affiliate || row.affiliatename || row.name || '',
          source: row.source || row.channel || '',
          meta: row
        }
      }
      // also map by affiliate name (lowercased) to help fuzzy lookups
      const nameKey = (row.affiliate || row.affiliatename || '')
      if (nameKey) {
        _affiliateMap[nameKey.toString().trim().toLowerCase()] = {
          name: nameKey,
          source: row.source || row.channel || '',
          meta: row
        }
      }
    }
    return _affiliateMap
  } catch (err) {
    _mediaCache = []
    _affiliateMap = {}
    return _affiliateMap
  }
}

export function getAffiliateById(id) {
  if (!id) return null
  if (!_affiliateMap) return null
  const key = String(id).trim()
  return _affiliateMap[key] || _affiliateMap[key.toLowerCase()] || null
}

// --- Payments Report loader (Affiliate identity source of truth) ---
export async function loadPaymentsReport(force = false) {
  if (_paymentsCache && !force) return _paymentsAffiliateMap || {}
  try {
    const res = await fetch(encodeURI('/Payments Report.csv'))
    if (!res.ok) {
      _paymentsCache = []
      _paymentsAffiliateMap = {}
      return _paymentsAffiliateMap
    }
    const text = await res.text()
    const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true })
    if (errors && errors.length) {
      _paymentsCache = []
      _paymentsAffiliateMap = {}
      return _paymentsAffiliateMap
    }
    _paymentsCache = data || []
    _paymentsAffiliateMap = {}
    for (const rawRow of _paymentsCache) {
      const row = {}
      for (const k of Object.keys(rawRow || {})) {
        const nk = normalizeHeaderKey(k)
        row[nk] = rawRow[k] == null ? '' : String(rawRow[k]).trim()
      }
      // Prefer numeric affiliate id fields
      const idCandidates = [row.affiliateid, row.id, row['affiliate id'], row.uid]
      const idRaw = idCandidates.find(x => x !== undefined && x !== null && String(x).trim() !== '')
      if (idRaw) {
        const idKey = String(idRaw).replace(/\D+/g, '')
        if (idKey) {
          _paymentsAffiliateMap[idKey] = {
            name: row.affiliate || row.affiliatename || row.name || '',
            raw: row
          }
        }
      }
      // Also map by affiliate name lowercased (useful fallback)
      const nameKey = (row.affiliate || row.affiliatename || row.name || '').toString().trim()
      if (nameKey) _paymentsAffiliateMap[nameKey.toLowerCase()] = { name: nameKey, raw: row }
    }
    return _paymentsAffiliateMap
  } catch (err) {
    _paymentsCache = []
    _paymentsAffiliateMap = {}
    return _paymentsAffiliateMap
  }
}

export function getPaymentAffiliateById(id) {
  if (!id) return null
  if (!_paymentsAffiliateMap) return null
  const key = String(id).replace(/\D+/g, '')
  if (!key) return null
  return _paymentsAffiliateMap[key] || _paymentsAffiliateMap[key.toLowerCase()] || null
}

// Resolve affiliate name/info from a variety of inputs (affiliate id string, numeric id, or a parsed registration row)
export async function resolveAffiliateName(input) {
  // ensure caches are loaded
  await loadPaymentsReport()
  await loadMediaReport()

  // Helper to try payments map first
  const tryPayments = (val) => {
    if (!val && val !== 0) return null
    // numeric-first lookup
    const numeric = String(val).replace(/\D+/g, '')
    if (numeric) {
      const p = _paymentsAffiliateMap && _paymentsAffiliateMap[numeric]
      if (p) return { name: p.name || '', source: 'payments', raw: p.raw }
    }
    // try by exact/lowercased name key
    const lower = String(val).toLowerCase()
    if (_paymentsAffiliateMap && _paymentsAffiliateMap[lower]) return { name: _paymentsAffiliateMap[lower].name || '', source: 'payments', raw: _paymentsAffiliateMap[lower].raw }
    return null
  }

  // If input is an object (row), try common affiliate fields
  if (input && typeof input === 'object') {
    const candidates = [input.affiliateid, input.affiliate_id, input.affiliate, input.affiliatename, input.id, input.uid]
    for (const c of candidates) {
      if (c === undefined || c === null || String(c).trim() === '') continue
      const byPay = tryPayments(c)
      if (byPay) return byPay
      const byMedia = getAffiliateById(c)
      if (byMedia) return { name: byMedia.name || '', source: 'media', raw: byMedia.meta }
    }
  }

  // If input is primitive, try direct lookups
  const byPay = tryPayments(input)
  if (byPay) return byPay
  const byMedia = getAffiliateById(input)
  if (byMedia) return { name: byMedia.name || '', source: 'media', raw: byMedia.meta }

  // Nothing found
  return null
}

function parseNumberSafe(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return v
  const s = String(v).replace(/[^0-9.\-]+/g, '')
  if (s === '' || s === '-' || s === '.') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// Build KPI aggregation map from Media Report (traffic metrics)
export async function buildAffiliateKpiMap(force = false) {
  if (_affiliateKpiMap && !force) return _affiliateKpiMap
  try {
    await loadMediaReport(force)
    await loadPaymentsReport(force)
    _affiliateKpiMap = {}
    const mediaRows = _mediaCache || []
    for (const rawRow of mediaRows) {
      const row = {}
      for (const k of Object.keys(rawRow || {})) {
        const nk = normalizeHeaderKey(k)
        row[nk] = rawRow[k] == null ? '' : rawRow[k]
      }
      // alias detection
      const idCandidates = [row.affiliateid, row.id, row.uid, row.affiliatid]
      let idKey = idCandidates.find(x => x !== undefined && x !== null && String(x).trim() !== '')
      idKey = idKey ? String(idKey).replace(/\D+/g, '') : null

      // fallback to affiliate name
      const nameKey = (row.affiliate || row.affiliatename || row.name || '')
      const mapKey = idKey || (nameKey ? String(nameKey).toLowerCase() : null)
      if (!mapKey) continue

      if (!_affiliateKpiMap[mapKey]) _affiliateKpiMap[mapKey] = { spend: 0, clicks: 0, registrations: 0, ftd: 0, revenue: 0 }

      const m = _affiliateKpiMap[mapKey]
      // common metric aliases
      const clicks = parseNumberSafe(row.clicks || row.impressions || row.views || row.click)
      const regs = parseNumberSafe(row.registrations || row.regs || row.leads)
      const ftd = parseNumberSafe(row.ftd || row.firstdeposit || row.first_deposit)
      const spend = parseNumberSafe(row.spend || row.spent || row.cost)
      const revenue = parseNumberSafe(row.revenue || row.net)

      if (clicks != null) m.clicks += clicks
      if (regs != null) m.registrations += regs
      if (ftd != null) m.ftd += ftd
      if (spend != null) m.spend += spend
      if (revenue != null) m.revenue += revenue
    }

    // derive metrics
    for (const k of Object.keys(_affiliateKpiMap)) {
      const v = _affiliateKpiMap[k]
      v.CR_reg = (v.clicks && v.registrations) ? (v.registrations / v.clicks) : null
      v.CR_ftd = (v.registrations && v.ftd) ? (v.ftd / v.registrations) : null
      v.eCPA = (v.ftd && v.spend && v.ftd > 0) ? (v.spend / v.ftd) : null
      v.ROI = (v.spend && v.revenue && v.spend !== 0) ? ((v.revenue - v.spend) / v.spend) : null
    }

    return _affiliateKpiMap
  } catch (err) {
    _affiliateKpiMap = {}
    return _affiliateKpiMap
  }
}

export function getAffiliateKpi(id) {
  if (!id) return null
  if (!_affiliateKpiMap) return null
  const key = String(id).replace(/\D+/g, '')
  if (key && _affiliateKpiMap[key]) return _affiliateKpiMap[key]
  const lower = String(id).toLowerCase()
  return _affiliateKpiMap[lower] || null
}

// Note: buildAffiliateKpiMap and getAffiliateKpi are implemented above (definitive versions).
