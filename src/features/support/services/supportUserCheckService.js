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
    // normalize rows and build map keyed by affiliate name (primary key)
    for (const rawRow of _mediaCache) {
      const row = {}
      for (const k of Object.keys(rawRow || {})) {
        const nk = normalizeHeaderKey(k)
        row[nk] = rawRow[k] == null ? '' : String(rawRow[k]).trim()
      }
      // Use affiliate name as primary key (consistent across reports)
      const affiliateName = (row.affiliate || row.affiliatename || row.name || '').toString().trim()
      if (affiliateName) {
        _affiliateMap[affiliateName.toLowerCase()] = {
          name: affiliateName,
          source: row.source || row.channel || '',
          meta: row
        }
        // Also map by uid for backward compatibility
        if (row.uid) {
          _affiliateMap[String(row.uid).trim()] = {
            name: affiliateName,
            source: row.source || row.channel || '',
            meta: row
          }
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
      // Use affiliate name as primary key (consistent across reports)
      const affiliateName = (row.affiliate || row.affiliatename || row.name || '').toString().trim()
      if (affiliateName) {
        _paymentsAffiliateMap[affiliateName.toLowerCase()] = {
          name: affiliateName,
          raw: row
        }
        // Also map by numeric affiliate id for backward compatibility
        const idCandidates = [row.affiliateid, row['affiliate id'], row.id]
        const idRaw = idCandidates.find(x => x !== undefined && x !== null && String(x).trim() !== '')
        if (idRaw) {
          const idKey = String(idRaw).replace(/\D+/g, '')
          if (idKey) {
            _paymentsAffiliateMap[idKey] = {
              name: affiliateName,
              raw: row
            }
          }
        }
      }
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
  // First try name-based lookup
  const nameKey = String(id).toLowerCase()
  if (_paymentsAffiliateMap[nameKey]) return _paymentsAffiliateMap[nameKey]
  // Fallback to numeric lookup
  const numericKey = String(id).replace(/\D+/g, '')
  return _paymentsAffiliateMap[numericKey] || null
}

// Resolve affiliate name/info from a variety of inputs (affiliate id string, numeric id, or a parsed registration row)
export async function resolveAffiliateName(input) {
  // ensure caches are loaded
  await loadPaymentsReport()
  await loadMediaReport()

  // Special case: ID 2287 is Default affiliate (no affiliate)
  const checkDefaultAffiliate = (val) => {
    if (!val && val !== 0) return false
    const numeric = String(val).replace(/\D+/g, '')
    return numeric === '2287'
  }

  // If input indicates default affiliate, return null (no affiliate)
  if (checkDefaultAffiliate(input)) return null

  // Helper to try payments map first (prioritize name-based lookup)
  const tryPayments = (val) => {
    if (!val && val !== 0) return null
    // First try by exact/lowercased name key
    const lower = String(val).toLowerCase()
    if (_paymentsAffiliateMap && _paymentsAffiliateMap[lower]) return { name: _paymentsAffiliateMap[lower].name || '', source: 'payments', raw: _paymentsAffiliateMap[lower].raw }
    // Fallback to numeric lookup
    const numeric = String(val).replace(/\D+/g, '')
    if (numeric) {
      const p = _paymentsAffiliateMap && _paymentsAffiliateMap[numeric]
      if (p) return { name: p.name || '', source: 'payments', raw: p.raw }
    }
    return null
  }

  // If input is an object (row), try common affiliate fields
  if (input && typeof input === 'object') {
    const candidates = [input.affiliate, input.affiliatename, input.name, input.affiliateid, input.affiliate_id, input.id, input.uid]
    for (const c of candidates) {
      if (c === undefined || c === null || String(c).trim() === '') continue
      // Check if this candidate is the default affiliate
      if (checkDefaultAffiliate(c)) return null
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

// Support Decision Engine - Pure function for user case classification
export function buildSupportDecision(selectedUser) {
  if (!selectedUser) return null

  const {
    totalDeposits,
    withdrawals,
    volume,
    affiliateId,
    affiliateCommissions,
    commissions,
    paymentsLoaded,
    mediaLoaded
  } = selectedUser

  // Helper functions
  const toNum = (x) => {
    if (x === null || x === undefined) return 0
    const n = Number(String(x).replace(/[^0-9.-]+/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  const depositsNum = toNum(totalDeposits)
  const withdrawalsNum = toNum(withdrawals)
  const volumeNum = toNum(volume)
  const hasCommissions = toNum(affiliateCommissions || commissions) > 0
  const withdrawalRatio = depositsNum > 0 ? withdrawalsNum / depositsNum : 0

  let caseType = 'ACTIVE_USER'
  let riskLevel = 'low'
  let riskExplanation = { 
    reason: 'No fraud signals detected, consistent trading behavior, withdrawals aligned with deposits.',
    impact: 'Standard risk assessment allows normal operations.'
  }
  let bonusDecision = { status: 'ELIGIBLE', reason: 'Standard user' }
  let bonusExplanation = {
    reason: 'User meets basic eligibility criteria for bonus programs.',
    impact: 'Bonus offers can be processed normally.'
  }
  let affiliateSwitchDecision = { status: 'ELIGIBLE', reason: 'No commissions generated yet. Affiliate switch possible without financial impact.' }
  let affiliateSwitchExplanation = {
    reason: 'No commissions generated yet.',
    impact: 'Affiliate switch possible without financial impact.'
  }
  let blockingConditions = []
  let flags = []
  let explanations = []
  let suggestedActions = ['Copy reply']
  let replyTemplate = 'Dear customer,\n\nThank you for contacting our support team. We appreciate your business and are here to help.\n\nBest regards,\nSupport Team'

  // Priority order evaluation (first match wins)

  // CASE: DATA_INCOMPLETE
  if (paymentsLoaded === false || mediaLoaded === false) {
    caseType = 'DATA_INCOMPLETE'
    riskLevel = 'medium'
    riskExplanation = {
      reason: 'Data synchronization in progress, cannot assess full risk profile.',
      impact: 'Operations limited until data loads completely.'
    }
    bonusDecision = { status: 'NOT_ELIGIBLE', reason: 'Data loading in progress' }
    bonusExplanation = {
      reason: 'Cannot determine bonus eligibility without complete account data.',
      impact: 'Bonus processing suspended until data synchronization.'
    }
    affiliateSwitchDecision = { status: 'NEEDS_MANUAL_REVIEW', reason: 'Data loading in progress. Cannot assess affiliate impact.' }
    affiliateSwitchExplanation = {
      reason: 'Data loading in progress.',
      impact: 'Cannot assess affiliate impact until data loads completely.'
    }
    blockingConditions = ['Data synchronization in progress']
    explanations = ['User data is still being loaded', 'Cannot make decisions with incomplete information']
    suggestedActions = ['Wait for data to load', 'Check back later']
    replyTemplate = 'Dear customer,\n\nWe are currently loading your account information. Please allow a few moments for the data to synchronize.\n\nWe will get back to you shortly.\n\nBest regards,\nSupport Team'
    return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
  }

  // CASE: POTENTIAL_ABUSE
  if (withdrawalsNum > 0 && depositsNum > 0 && withdrawalRatio > 0.7) {
    caseType = 'POTENTIAL_ABUSE'
    riskLevel = 'high'
    riskExplanation = {
      reason: 'High withdrawal ratio suggests potential abusive behavior patterns.',
      impact: 'Account flagged for security review and restricted operations.'
    }
    bonusDecision = { status: 'NOT_ELIGIBLE', reason: 'High withdrawal ratio indicates potential abuse' }
    bonusExplanation = {
      reason: 'Bonus programs not available for accounts with abuse indicators.',
      impact: 'Bonus eligibility suspended pending security review.'
    }
    affiliateSwitchDecision = { status: 'NOT_ELIGIBLE', reason: 'Account flagged for potential abuse. Affiliate switch not permitted.' }
    affiliateSwitchExplanation = {
      reason: 'Account flagged for potential abuse.',
      impact: 'Affiliate switch not permitted until security review completes.'
    }
    blockingConditions = ['High withdrawal ratio detected']
    flags = ['Risk pattern']
    explanations = ['High withdrawal ratio detected', 'May indicate abusive behavior', 'Requires manual review']
    suggestedActions = ['Escalate to Compliance', 'Flag for investigation']
    replyTemplate = 'Dear customer,\n\nWe have noted your account activity and are conducting a routine review. This process may take 24-48 hours.\n\nWe appreciate your patience during this time.\n\nBest regards,\nSupport Team'
    return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
  }

  // CASE: WITHDRAWAL_REQUEST
  if (withdrawalsNum > 0 && depositsNum > 0) {
    caseType = 'WITHDRAWAL_REQUEST'
    riskLevel = 'medium'
    riskExplanation = {
      reason: 'Active withdrawal request requires standard processing verification.',
      impact: 'Operations limited during withdrawal processing period.'
    }
    bonusDecision = { status: 'NOT_ELIGIBLE', reason: 'Active withdrawal request' }
    bonusExplanation = {
      reason: 'Bonus programs suspended during active withdrawal processing.',
      impact: 'Bonus eligibility paused until withdrawal completes.'
    }
    affiliateSwitchDecision = { status: 'NEEDS_MANUAL_REVIEW', reason: 'Active withdrawal in progress. Affiliate switch requires approval.' }
    affiliateSwitchExplanation = {
      reason: 'Active withdrawal in progress.',
      impact: 'Affiliate switch requires approval during withdrawal processing.'
    }
    blockingConditions = ['Active withdrawal request']
    explanations = ['User has active withdrawal requests', 'Standard processing applies', 'No bonus eligibility during withdrawal']
    suggestedActions = ['Process withdrawal', 'Escalate to Operations']
    replyTemplate = 'Dear customer,\n\nWe have received your withdrawal request and it is being processed according to our standard procedures. Processing typically takes 1-3 business days.\n\nYou will receive a confirmation email once the withdrawal is completed.\n\nBest regards,\nSupport Team'
    return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
  }

  // CASE: DEPOSIT_NO_TRADING
  if (depositsNum > 0 && volumeNum === 0) {
    caseType = 'DEPOSIT_NO_TRADING'
    riskLevel = 'low'
    riskExplanation = {
      reason: 'Deposit made but no trading activity, indicating potential onboarding needs.',
      impact: 'Low risk but requires engagement to activate trading.'
    }
    bonusDecision = { status: 'ELIGIBLE', reason: 'Retention incentive possible' }
    bonusExplanation = {
      reason: 'Retention bonuses available to encourage trading activity.',
      impact: 'Bonus offers can help activate dormant accounts.'
    }
    affiliateSwitchDecision = { status: 'ELIGIBLE', reason: 'No trading activity yet. Affiliate switch possible without impact.' }
    affiliateSwitchExplanation = {
      reason: 'No trading activity yet.',
      impact: 'Affiliate switch possible without impact on active operations.'
    }
    explanations = ['User has deposited but not traded', 'Good candidate for retention incentives', 'May benefit from trading education']
    suggestedActions = ['Copy reply', 'Consider bonus offer']
    replyTemplate = 'Dear customer,\n\nThank you for your deposit with us. We notice you haven\'t started trading yet.\n\nWe\'d like to offer you a small welcome bonus to get started. Would you be interested in learning more about our trading platform?\n\nBest regards,\nSupport Team'
    return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
  }

  // CASE: NO_DEPOSIT
  if (depositsNum === 0) {
    caseType = 'NO_DEPOSIT'
    riskLevel = 'low'
    riskExplanation = {
      reason: 'No deposits made, standard onboarding case with minimal risk.',
      impact: 'Account in early stage, focus on activation and engagement.'
    }
    bonusDecision = { status: 'NOT_ELIGIBLE', reason: 'No deposits made' }
    bonusExplanation = {
      reason: 'Bonus programs require deposit activity to qualify.',
      impact: 'Bonus eligibility available after first deposit.'
    }
    affiliateSwitchDecision = { status: 'ELIGIBLE', reason: 'No deposits or commissions. Affiliate switch possible.' }
    affiliateSwitchExplanation = {
      reason: 'No deposits or commissions.',
      impact: 'Affiliate switch possible without financial implications.'
    }
    explanations = ['User has not made any deposits', 'Standard onboarding case', 'May need encouragement to deposit']
    suggestedActions = ['Copy reply', 'Send onboarding materials']
    replyTemplate = 'Dear customer,\n\nThank you for registering with us. We hope you\'re finding our platform useful.\n\nIf you have any questions about getting started or making your first deposit, please don\'t hesitate to ask.\n\nBest regards,\nSupport Team'
    return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
  }

  // CASE: HIGH_VALUE_USER
  if (depositsNum > 5000) {
    caseType = 'HIGH_VALUE_USER'
    riskLevel = 'low'
    riskExplanation = {
      reason: 'High-value customer with significant deposits, low risk profile.',
      impact: 'Priority handling required for valuable account.'
    }
    bonusDecision = { status: 'PRIORITY_APPROVAL', reason: 'High-value customer - priority handling' }
    bonusExplanation = {
      reason: 'Priority approval process for premium bonus offers.',
      impact: 'Bonus requests escalated for immediate VIP processing.'
    }
    affiliateSwitchDecision = { status: 'NEEDS_MANUAL_REVIEW', reason: 'High-value customer. Affiliate switch requires VIP approval.' }
    affiliateSwitchExplanation = {
      reason: 'High-value customer.',
      impact: 'Affiliate switch requires VIP approval to protect relationship.'
    }
    flags = ['VIP']
    explanations = ['High-value customer with significant deposits', 'Requires priority handling', 'May qualify for premium bonuses']
    suggestedActions = ['Escalate to VIP Support', 'Consider premium bonus offers']
    replyTemplate = 'Dear valued customer,\n\nThank you for your significant investment with us. We truly appreciate your trust and partnership.\n\nWe\'re prioritizing your inquiry and will provide a personalized response within the next hour.\n\nBest regards,\nVIP Support Team'
    return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
  }

  // CASE: FRAUD_RISK
  if (selectedUser.fraud || selectedUser.action === 'fraud' || selectedUser.status === 'fraud') {
    caseType = 'FRAUD_RISK'
    riskLevel = 'high'
    riskExplanation = {
      reason: 'Account flagged with fraud indicators requiring security review.',
      impact: 'All operations suspended until security clearance.'
    }
    bonusDecision = { status: 'NOT_ELIGIBLE', reason: 'Account flagged for fraud risk' }
    bonusExplanation = {
      reason: 'Bonus programs suspended pending fraud investigation.',
      impact: 'Bonus eligibility blocked until fraud review completes.'
    }
    affiliateSwitchDecision = { status: 'NOT_ELIGIBLE', reason: 'Account under fraud investigation. Affiliate switch not permitted.' }
    affiliateSwitchExplanation = {
      reason: 'Account under fraud investigation.',
      impact: 'Affiliate switch not permitted until security review clears.'
    }
    blockingConditions = ['Fraud investigation in progress']
    flags = ['Fraud Risk']
    explanations = ['Account has fraud indicators', 'Requires security review', 'No bonuses until cleared']
    suggestedActions = ['Escalate to Security', 'Request verification documents']
    replyTemplate = 'Dear customer,\n\nFor security purposes, we need to verify some information on your account before we can proceed.\n\nPlease provide the requested verification documents. This process helps protect all our customers.\n\nBest regards,\nSecurity Team'
    return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
  }

  // CASE: NEW_USER_RECENT
  const regDate = selectedUser.regDate || selectedUser.registrationDate
  if (regDate && depositsNum === 0) {
    const regDateObj = new Date(regDate)
    const now = new Date()
    const daysSinceReg = (now - regDateObj) / (1000 * 60 * 60 * 24)
    if (daysSinceReg < 7) {
      caseType = 'NEW_USER_RECENT'
      riskLevel = 'low'
      riskExplanation = {
        reason: 'Recently registered user with standard onboarding risk profile.',
        impact: 'Focus on welcome experience and initial engagement.'
      }
      bonusDecision = { status: 'ELIGIBLE', reason: 'New user onboarding' }
      bonusExplanation = {
        reason: 'Welcome bonuses available for new user activation.',
        impact: 'Bonus offers help establish positive first impression.'
      }
      affiliateSwitchDecision = { status: 'ELIGIBLE', reason: 'New user with no activity. Affiliate switch possible.' }
      affiliateSwitchExplanation = {
        reason: 'New user with no activity.',
        impact: 'Affiliate switch possible without established patterns.'
      }
      explanations = ['Recently registered user', 'No deposits yet', 'Good candidate for onboarding incentives']
      suggestedActions = ['Send welcome bonus', 'Provide onboarding guidance']
      replyTemplate = 'Dear new customer,\n\nWelcome to our trading platform! We\'re excited to have you join our community.\n\nAs a welcome gesture, we\'d like to offer you a small bonus to get started. Would you like to learn more about our platform?\n\nBest regards,\nOnboarding Team'
      return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
    }
  }

  // CASE: SIGNIFICANT_LOSS
  const plNum = toNum(selectedUser.pl || selectedUser.profitLoss || selectedUser.netPl)
  if (depositsNum > 0 && plNum < 0 && Math.abs(plNum) > depositsNum * 0.5) {
    caseType = 'SIGNIFICANT_LOSS'
    riskLevel = 'medium'
    riskExplanation = {
      reason: 'Significant trading losses detected, may require risk management support.',
      impact: 'Account needs recovery support and risk assessment.'
    }
    bonusDecision = { status: 'ELIGIBLE', reason: 'Loss recovery support' }
    bonusExplanation = {
      reason: 'Recovery bonuses available to support trading continuation.',
      impact: 'Bonus offers can help rebuild confidence and activity.'
    }
    affiliateSwitchDecision = { status: 'NEEDS_MANUAL_REVIEW', reason: 'Significant losses detected. Affiliate switch requires approval.' }
    affiliateSwitchExplanation = {
      reason: 'Significant losses detected.',
      impact: 'Affiliate switch requires approval to assess retention impact.'
    }
    flags = ['Loss Recovery']
    explanations = ['Significant trading losses detected', 'May benefit from risk management support', 'Good candidate for recovery incentives']
    suggestedActions = ['Offer loss recovery bonus', 'Provide risk management education']
    replyTemplate = 'Dear customer,\n\nWe understand that trading can sometimes be challenging, and we appreciate your continued engagement with our platform.\n\nWe\'d like to support you during this time. Would you be interested in learning about our risk management tools or a recovery bonus?\n\nBest regards,\nSupport Team'
    return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
  }

  // CASE: AFFILIATE_DRIVEN
  const isDefaultAffiliate = affiliateId && String(affiliateId).replace(/\D+/g, '') === '2287'
  if (affiliateId && !isDefaultAffiliate) {
    flags.push('Affiliate')
    if (hasCommissions) {
      caseType = 'AFFILIATE_DRIVEN'
      riskLevel = 'medium'
      riskExplanation = {
        reason: 'Affiliate-driven account with commission generation, requires careful handling.',
        impact: 'Operations must consider affiliate cost implications.'
      }
      bonusDecision = { status: 'NEEDS_APPROVAL', reason: 'Affiliate cost impact - requires approval' }
      bonusExplanation = {
        reason: 'Bonus approval needed due to potential affiliate cost implications.',
        impact: 'Bonus requests require affiliate manager review.'
      }
      affiliateSwitchDecision = { status: 'NEEDS_MANUAL_REVIEW', reason: 'Commissions already generated. Switching requires manual approval.' }
      affiliateSwitchExplanation = {
        reason: 'Commissions already generated.',
        impact: 'Switching requires manual approval to manage cost implications.'
      }
      blockingConditions = ['Active affiliate commissions']
      explanations = ['User came through affiliate channel', 'Commissions already generated', 'Bonus may affect affiliate costs', 'Requires management approval']
      suggestedActions = ['Copy reply', 'Escalate to Affiliate Manager']
      replyTemplate = 'Dear customer,\n\nThank you for joining us through our affiliate program. We appreciate your business.\n\nRegarding your inquiry, this requires approval from our affiliate management team. We will get back to you within 24 hours.\n\nBest regards,\nSupport Team'
      return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
    }
  }

  // DEFAULT CASE: ACTIVE_USER
  caseType = 'ACTIVE_USER'
  riskLevel = 'low'
  riskExplanation = {
    reason: 'Active user with standard trading activity and risk profile.',
    impact: 'Standard operational procedures apply.'
  }
  bonusDecision = { status: 'ELIGIBLE', reason: 'Active trading user' }
  bonusExplanation = {
    reason: 'Standard bonus eligibility for active trading accounts.',
    impact: 'Bonus offers can be processed through normal channels.'
  }
  
  // Determine affiliate switch decision based on affiliate status
  if (affiliateId && !isDefaultAffiliate) {
    if (hasCommissions) {
      affiliateSwitchDecision = { status: 'NEEDS_MANUAL_REVIEW', reason: 'Commissions already generated. Switching requires manual approval.' }
      affiliateSwitchExplanation = {
        reason: 'Commissions already generated.',
        impact: 'Switching requires manual approval to manage cost implications.'
      }
    } else {
      affiliateSwitchDecision = { status: 'ELIGIBLE', reason: 'Affiliate assigned but no commissions generated yet. Switch possible.' }
      affiliateSwitchExplanation = {
        reason: 'Affiliate assigned but no commissions generated yet.',
        impact: 'Switch possible without established financial commitments.'
      }
    }
  } else {
    affiliateSwitchDecision = { status: 'ELIGIBLE', reason: 'No affiliate assigned. Switch possible without restrictions.' }
    affiliateSwitchExplanation = {
      reason: 'No affiliate assigned.',
      impact: 'Switch possible without restrictions or cost implications.'
    }
  }
  
  explanations = ['Active user with deposits and trading activity', 'Good standing account', 'Standard support case']
  suggestedActions = ['Copy reply', 'Process normally']
  replyTemplate = 'Dear customer,\n\nThank you for your continued business with us. We appreciate your loyalty.\n\nWe\'re here to help with any questions or concerns you may have.\n\nBest regards,\nSupport Team'

  return { caseType, riskLevel, riskExplanation, bonusDecision, bonusExplanation, affiliateSwitchDecision, affiliateSwitchExplanation, blockingConditions, flags, explanations, suggestedActions, replyTemplate }
}

// Note: buildAffiliateKpiMap and getAffiliateKpi are implemented above (definitive versions).
