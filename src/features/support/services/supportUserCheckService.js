// supportUserCheckService.js
// Coherent implementation of support helpers used by the Support UI.
import Papa from 'papaparse'

const SUPPORT_USERS_INDEX_URL = '/support_users_index.json'

// Caches and maps
let _cache = null
let _parsedCount = 0
let _firstRowKeys = []
let _idMap = null
let _mt5Map = null
let _emailMap = null

let _reportsVersion = null

let _mediaCache = null
let _affiliateKpiMap = null
let _paymentsCache = null
let _paymentsAffiliateMap = null
let _paymentsAffiliateMapById = null
let _paymentsAffiliateMapByName = null

let _commentsCache = null
let _affiliateMovesByUserId = null

let _idToName = null
let _nameKeyToId = null
let _mediaByNameKey = null
let _affiliateDebugInfo = null

// Lab/index cache for the temporary mapping UI
let _labAffiliateIndex = null

function normalizeHeaderKey(header) {
  if (header == null) return ''
  const s = header.toString().trim().toLowerCase()
  // replace non-alphanum with empty
  const base = s.replace(/[^a-z0-9]+/g, '')
  if (base) return base
  // fallback for headers like "..." or other punctuation-only headers
  if (/^\.+$/.test(s)) return 'ellipsis'
  // generic fallback
  return 'col'
}

function normalizeAffiliateKey(s) {
  if (!s) return ''
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '')
}

function normalizeForIndex(value) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim().toLowerCase()
}

function pickField(obj, candidates) {
  if (!obj) return ''
  for (const k of candidates) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '')
      return String(obj[k])
  }
  return ''
}

function pickFieldNormalized(row, candidates) {
  if (!row) return ''
  for (const k of candidates) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '')
      return String(row[k]).trim()
  }
  return ''
}

function digitsOnly(s) {
  if (s == null) return ''
  const d = String(s).replace(/\D+/g, '')
  return d || ''
}

function normalizeUserIdKey(v) {
  const digits = digitsOnly(v)
  return digits || ''
}

function getReportsVersionSafe() {
  try {
    return String(localStorage.getItem('bw_reports_version') || '')
  } catch {
    return ''
  }
}

function looksLikeHtml(text) {
  const s = String(text || '').trimStart()
  return s.startsWith('<!doctype html') || s.startsWith('<html') || s.startsWith('<')
}

function resolveMapValueToRows(mapValue, rows) {
  if (mapValue === undefined || mapValue === null) return []
  if (Array.isArray(mapValue)) {
    if (mapValue.length && typeof mapValue[0] === 'number') {
      return mapValue.map((i) => rows[i]).filter(Boolean)
    }
    return mapValue
  }
  if (typeof mapValue === 'number') return rows[mapValue] ? [rows[mapValue]] : []
  return []
}

async function tryLoadSupportUsersIndex(versionNow) {
  try {
    const url = versionNow
      ? `${SUPPORT_USERS_INDEX_URL}?v=${encodeURIComponent(versionNow)}`
      : SUPPORT_USERS_INDEX_URL
    const res = await fetch(url)
    if (!res || !res.ok) return null

    const text = await res.text()
    if (!text || looksLikeHtml(text)) return null

    const json = JSON.parse(text)
    if (!json || !Array.isArray(json.rows)) return null

    return json
  } catch {
    return null
  }
}

function papaParseAsync(text, config) {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      ...config,
      complete: (res) => resolve(res),
      error: (err) => reject(err),
    })
  })
}

export async function loadCsvRows(force = false) {
  const versionNow = getReportsVersionSafe()
  if (_cache && !force && _reportsVersion === versionNow) return _cache
  _reportsVersion = versionNow

  // Prefer precomputed index (fast path) to avoid heavy CSV parsing in the browser.
  const index = await tryLoadSupportUsersIndex(versionNow)
  if (index && Array.isArray(index.rows)) {
    _cache = index.rows
    _parsedCount = _cache.length
    _firstRowKeys = Object.keys(_cache[0] || {})

    // These maps store indices (number | number[]) to avoid duplicating row objects.
    _idMap = index.byUserId || {}
    _mt5Map = index.byMt5 || {}
    _emailMap = index.byEmail || {}

    return _cache
  }

  // Try canonical filename first, then common variants.
  // The export we use going forward may be named like: "01012023 to 01112026 Registrations Report.csv".
  const candidatePaths = [
    '/Registrations Report.csv',
    '/Registrations Report.fixed.csv',
    '/01012023 to 01112026 Registrations Report.csv',
  ]

  let res = null
  for (const p of candidatePaths) {
    const url = versionNow ? `${p}?v=${encodeURIComponent(versionNow)}` : p
    const r = await fetch(encodeURI(url))
    if (r && r.ok) {
      res = r
      break
    }
  }

  if (!res || !res.ok) {
    _cache = []
    return _cache
  }
  const text = await res.text()
  let parsed = await papaParseAsync(text, {
    header: true,
    skipEmptyLines: true,
    // Offload parsing when possible; falls back gracefully.
    worker: true,
  })
  // If parser produced a single header key (malformed header wrapped in quotes),
  // attempt a lightweight recovery by splitting the first line into real headers
  try {
    if (parsed && parsed.data && parsed.data.length > 0) {
      const firstRowKeys = Object.keys(parsed.data[0] || {})
      if (firstRowKeys.length === 1) {
        const maybeHeaderKey = firstRowKeys[0] || ''
        // if the single key contains commas it's likely the header was wrapped
        if (maybeHeaderKey.indexOf(',') !== -1) {
          const lines = text.split(/\r?\n/)
          if (lines.length > 1) {
            let headerLine = lines.shift()
            // remove surrounding quotes if present and split by '","' pattern when appropriate
            let headerParts = null
            if (/","/.test(headerLine)) {
              headerParts = headerLine.replace(/^"+|"+$/g, '').split('","')
            } else {
              headerParts = headerLine.replace(/^"+|"+$/g, '').split(',')
            }
            // sanitize header parts
            headerParts = headerParts.map((h) => h.replace(/^"+|"+$/g, '').trim())
            const rebuilt = [headerParts.join(','), ...lines].join('\n')
            const reparsed = await papaParseAsync(rebuilt, {
              header: true,
              skipEmptyLines: true,
              worker: true,
            })
            if (reparsed && reparsed.data && Object.keys(reparsed.data[0] || {}).length > 1) {
              parsed = reparsed
            }
          }
        }
      }
    }
  } catch (e) {
    // best-effort recovery; ignore and continue with original parse
  }
  if (!parsed || (parsed.errors && parsed.errors.length)) {
    _cache = []
    return _cache
  }

  _parsedCount = parsed.data.length
  _firstRowKeys = Object.keys(parsed.data[0] || {})

  _cache = (parsed.data || []).map((rawRow) => {
    const row = {}
    const seen = {}
    for (const origKey of Object.keys(rawRow || {})) {
      let base = normalizeHeaderKey(origKey)
      if (!base) base = 'col'
      seen[base] = (seen[base] || 0) + 1
      const k = seen[base] === 1 ? base : `${base}__${seen[base]}`
      const v = rawRow[origKey] == null ? '' : String(rawRow[origKey]).trim()
      row[k] = v
    }

    // Keep the search index small: this is the hot path during typing.
    // (Building an index over every cell of 80k rows is expensive.)
    const idx = [
      row.userid,
      row.mt5account,
      row.customername,
      row.email,
      row.customeremail,
      row.affiliateid,
      row.country,
      row.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    row.__searchIndex = idx
    return row
  })

  // build quick lookup maps
  _idMap = {}
  _mt5Map = {}
  _emailMap = {}
  for (const r of _cache) {
    const uid = r.userid || r.user_id || r.user || ''
    const uidKey = uid ? String(uid).replace(/\D+/g, '') : ''
    if (uidKey) {
      _idMap[uidKey] = _idMap[uidKey] || []
      _idMap[uidKey].push(r)
    }
    const mt5 = r.mt5account || r.mt5 || ''
    const mt5Key = mt5 ? String(mt5).replace(/\D+/g, '') : ''
    if (mt5Key) {
      _mt5Map[mt5Key] = _mt5Map[mt5Key] || []
      _mt5Map[mt5Key].push(r)
    }
    const email = r.email || r.customeremail || ''
    if (email) {
      const lk = String(email).toLowerCase().trim()
      _emailMap[lk] = _emailMap[lk] || []
      _emailMap[lk].push(r)
    }
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

  if (/^\d+$/.test(qRaw)) {
    const exact = []
    if (_idMap && _idMap[qRaw]) exact.push(...resolveMapValueToRows(_idMap[qRaw], rows))
    if (_mt5Map && _mt5Map[qRaw]) exact.push(...resolveMapValueToRows(_mt5Map[qRaw], rows))
    if (exact.length) return Array.from(new Set(exact))

    return rows.filter((r) => {
      const uidDigits = String(r.userid || r.user_id || r.user || '').replace(/\D/g, '')
      const mt5Digits = String(r.mt5account || r.mt5 || '').replace(/\D/g, '')
      return uidDigits.includes(qRaw) || mt5Digits.includes(qRaw)
    })
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(qRaw)) {
    const key = qRaw.toLowerCase()
    if (_emailMap && _emailMap[key]) {
      const matches = resolveMapValueToRows(_emailMap[key], rows)
      return Array.from(new Set(matches))
    }
    return rows.filter((r) => {
      const e = String(r.email || r.customeremail || '')
      return e.toLowerCase().includes(key)
    })
  }

  const results = rows.filter((r) => r.__searchIndex && r.__searchIndex.includes(qNorm))
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
  try {
    const logs = JSON.parse(localStorage.getItem('supportUserCheckAudit') || '[]')
    logs.push({ action, payload, ts: Date.now() })
    localStorage.setItem('supportUserCheckAudit', JSON.stringify(logs))
  } catch (e) {
    // ignore
  }
}

export function getAuditLog() {
  try {
    return JSON.parse(localStorage.getItem('supportUserCheckAudit') || '[]')
  } catch (e) {
    return []
  }
}

export async function loadMediaReport(force = false) {
  if (_mediaCache && !force) return _mediaCache
  try {
    const res = await fetch(encodeURI('/Media Report.csv'))
    if (!res.ok) {
      _mediaCache = []
      _mediaByNameKey = {}
      return _mediaCache
    }
    const text = await res.text()
    const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })
    if (errors && errors.length) {
      _mediaCache = []
      _mediaByNameKey = {}
      return _mediaCache
    }
    // build processed rows with safe headers
    _mediaCache = (data || []).map((rawRow) => {
      const row = {}
      const seen = {}
      for (const origKey of Object.keys(rawRow || {})) {
        let base = normalizeHeaderKey(origKey)
        if (!base) base = 'col'
        seen[base] = (seen[base] || 0) + 1
        const k = seen[base] === 1 ? base : `${base}__${seen[base]}`
        row[k] = rawRow[origKey]
      }
      return row
    })
    _mediaByNameKey = {}
    for (const row of _mediaCache) {
      const affiliateName = row.affiliate || row.affiliatename || row.name || ''
      if (affiliateName) _mediaByNameKey[normalizeAffiliateKey(affiliateName)] = row
    }
    return _mediaCache
  } catch (err) {
    _mediaCache = []
    _mediaByNameKey = {}
    return _mediaCache
  }
}

export async function loadPaymentsReport(force = false) {
  if (_paymentsCache && !force) return _paymentsCache
  try {
    const res = await fetch(encodeURI('/Payments Report.csv'))
    if (!res.ok) {
      _paymentsCache = []
      _paymentsAffiliateMap = {}
      return _paymentsCache
    }
    const text = await res.text()
    const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })
    if (errors && errors.length) {
      _paymentsCache = []
      _paymentsAffiliateMap = {}
      return _paymentsCache
    }
    // Process payments rows with safe header keys
    _paymentsCache = (data || []).map((rawRow) => {
      const row = {}
      const seen = {}
      for (const origKey of Object.keys(rawRow || {})) {
        let base = normalizeHeaderKey(origKey)
        if (!base) base = 'col'
        seen[base] = (seen[base] || 0) + 1
        const k = seen[base] === 1 ? base : `${base}__${seen[base]}`
        row[k] = rawRow[origKey]
      }
      return row
    })
    // build two maps: by id and by normalized name
    _paymentsAffiliateMap = {}
    _paymentsAffiliateMapById = {}
    _paymentsAffiliateMapByName = {}
    for (const row of _paymentsCache) {
      const nameCandidates = ['affiliate', 'affiliatename', 'affiliate_name', 'name', 'partner']
      const idCandidates = ['affiliateid', 'affiliate_id', 'id', 'affid', 'aff_id']
      const affiliateName = pickFieldNormalized(row, nameCandidates)
      const affiliateIdRaw = pickFieldNormalized(row, idCandidates)
      const idKey = digitsOnly(affiliateIdRaw)
      if (affiliateName) {
        const nameKey = normalizeAffiliateKey(affiliateName)
        _paymentsAffiliateMapByName[nameKey] = {
          affiliateId: idKey || null,
          affiliateName,
          raw: row,
        }
        _paymentsAffiliateMap[nameKey] = { name: affiliateName, raw: row }
      }
      if (idKey) {
        _paymentsAffiliateMapById[idKey] = {
          affiliateId: idKey,
          affiliateName: affiliateName || null,
          raw: row,
        }
        _paymentsAffiliateMap[idKey] = { name: affiliateName || null, raw: row }
      }
    }
    return _paymentsCache
  } catch (err) {
    _paymentsCache = []
    _paymentsAffiliateMap = {}
    return _paymentsCache
  }
}

export async function loadCommentsReport(force = false) {
  // Keep in sync with the registrations cache invalidation.
  const versionNow = getReportsVersionSafe()
  if (_reportsVersion !== versionNow) {
    _reportsVersion = versionNow
    _commentsCache = null
    _affiliateMovesByUserId = null
    // do not clear other caches here (they are force-refreshed by the UI when needed)
  }

  if (_commentsCache && !force) return _commentsCache
  try {
    const res = await fetch(encodeURI('/comments.csv'))
    if (!res.ok) {
      _commentsCache = []
      _affiliateMovesByUserId = {}
      return _commentsCache
    }
    const text = await res.text()
    const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })
    if (errors && errors.length) {
      _commentsCache = []
      _affiliateMovesByUserId = {}
      return _commentsCache
    }

    _commentsCache = (data || []).map((rawRow) => {
      const row = {}
      const seen = {}
      for (const origKey of Object.keys(rawRow || {})) {
        let base = normalizeHeaderKey(origKey)
        if (!base) base = 'col'
        seen[base] = (seen[base] || 0) + 1
        const k = seen[base] === 1 ? base : `${base}__${seen[base]}`
        row[k] = rawRow[origKey]
      }
      return row
    })

    _affiliateMovesByUserId = {}
    for (const r of _commentsCache) {
      const userIdKey = normalizeUserIdKey(
        r.bullwavesid ||
          r.bullwaves_id ||
          r.userid ||
          r.user_id ||
          r.user ||
          r.bullwavesuser ||
          r.bullwaves_user
      )
      if (!userIdKey) continue
      const fromId = normalizeUserIdKey(
        r.fromaffiliateid || r.from_affiliate_id || r.fromaffiliate || r.from
      )
      const toId = normalizeUserIdKey(r.toaffiliateid || r.to_affiliate_id || r.toaffiliate || r.to)
      if (!fromId && !toId) continue
      const createdOn = String(r.createdon || r.created_on || r.date || r.timestamp || '').trim()
      const move = {
        userId: userIdKey,
        fromAffiliateId: fromId || null,
        toAffiliateId: toId || null,
        createdOn: createdOn || null,
      }
      _affiliateMovesByUserId[userIdKey] = _affiliateMovesByUserId[userIdKey] || []
      _affiliateMovesByUserId[userIdKey].push(move)
    }

    // Sort newest-first when a date is available (best-effort)
    for (const k of Object.keys(_affiliateMovesByUserId || {})) {
      _affiliateMovesByUserId[k].sort((a, b) => {
        const da = a && a.createdOn ? Date.parse(a.createdOn) : NaN
        const db = b && b.createdOn ? Date.parse(b.createdOn) : NaN
        if (!Number.isNaN(da) && !Number.isNaN(db)) return db - da
        if (!Number.isNaN(db)) return 1
        if (!Number.isNaN(da)) return -1
        return 0
      })
    }

    return _commentsCache
  } catch (err) {
    _commentsCache = []
    _affiliateMovesByUserId = {}
    return _commentsCache
  }
}

export async function getAffiliateMovesForUser(userId) {
  const key = normalizeUserIdKey(userId)
  if (!key) return []
  await loadCommentsReport(false)
  return _affiliateMovesByUserId && _affiliateMovesByUserId[key] ? _affiliateMovesByUserId[key] : []
}

export async function getPaymentAffiliateById(id) {
  if (!id) return null
  await loadPaymentsReport()
  // check id map first
  if (_paymentsAffiliateMapById && _paymentsAffiliateMapById[String(id)])
    return _paymentsAffiliateMapById[String(id)]
  // fallback: check name map by normalized name
  const maybeNameKey = String(id).toLowerCase()
  if (_paymentsAffiliateMapByName && _paymentsAffiliateMapByName[maybeNameKey])
    return _paymentsAffiliateMapByName[maybeNameKey]
  const numericKey = String(id).replace(/\D+/g, '')
  if (numericKey && _paymentsAffiliateMapById && _paymentsAffiliateMapById[numericKey])
    return _paymentsAffiliateMapById[numericKey]
  return null
}

export async function loadAllReportsAndBuildAffiliateIndex(force = false) {
  if (_idToName && !force)
    return {
      idToName: _idToName,
      nameKeyToId: _nameKeyToId,
      mediaByNameKey: _mediaByNameKey,
      debugInfo: _affiliateDebugInfo,
    }
  const registrationsRows = await loadCsvRows(force)
  await loadPaymentsReport(force)
  await loadMediaReport(force)

  _idToName = {}
  _nameKeyToId = {}
  _affiliateDebugInfo = {
    unmatchedAffiliateIds: [],
    unmatchedAffiliateNamesInMedia: [],
    collisions: [],
  }

  // Use the payments maps populated by loadPaymentsReport to build id/name indexes
  _paymentsAffiliateMapById = _paymentsAffiliateMapById || {}
  _paymentsAffiliateMapByName = _paymentsAffiliateMapByName || {}

  // populate id->name and name->id
  for (const idKey of Object.keys(_paymentsAffiliateMapById || {})) {
    if (!idKey) continue
    if (idKey === '2287') continue
    const entry = _paymentsAffiliateMapById[idKey]
    const name = entry && entry.affiliateName ? entry.affiliateName : null
    if (!name) continue
    const nameKey = normalizeAffiliateKey(name)
    const numeric = parseInt(String(idKey), 10)
    if (_idToName[numeric] && _idToName[numeric] !== name) {
      _affiliateDebugInfo.collisions.push({
        id: numeric,
        existing: _idToName[numeric],
        incoming: name,
      })
    }
    _idToName[numeric] = name
    _nameKeyToId[nameKey] = numeric
  }

  // ensure names seen in payments-by-name are at least present in nameKey map (with null id)
  for (const nameKey of Object.keys(_paymentsAffiliateMapByName || {})) {
    const info = _paymentsAffiliateMapByName[nameKey]
    if (!_nameKeyToId[nameKey]) {
      _nameKeyToId[nameKey] = info && info.affiliateId ? parseInt(info.affiliateId, 10) : null
    }
  }

  _mediaByNameKey = _mediaByNameKey || {}
  return {
    idToName: _idToName,
    nameKeyToId: _nameKeyToId,
    mediaByNameKey: _mediaByNameKey,
    debugInfo: _affiliateDebugInfo,
  }
}

export async function resolveCurrentAffiliateForUser(userAffiliateId) {
  await loadAllReportsAndBuildAffiliateIndex()
  const id = parseInt(userAffiliateId, 10)
  if (isNaN(id)) return null
  const affiliateName = _idToName[id] || null
  const affiliateNameKey = affiliateName ? normalizeAffiliateKey(affiliateName) : null
  const mediaMetrics = affiliateNameKey ? _mediaByNameKey[affiliateNameKey] || null : null
  let mappingConfidence = 'LOW'
  if (affiliateName) mappingConfidence = mediaMetrics ? 'HIGH' : 'MEDIUM'
  return {
    affiliateId: id,
    affiliateName,
    affiliateNameKey,
    mediaMetrics,
    payoutMetrics: null,
    mappingConfidence,
  }
}

export async function resolveSearchedAffiliate(input) {
  await loadAllReportsAndBuildAffiliateIndex()
  if (!input || String(input).trim() === '') return null
  // Support being passed either a primitive (id/name) or a registration row object
  let affiliateId = null
  let affiliateName = null

  if (typeof input === 'object') {
    // examine common fields on a registration row
    const candidates = [
      input.affiliate,
      input.affiliatename,
      input.name,
      input.affiliateid,
      input.affiliate_id,
      input.id,
      input.uid,
    ]
    for (const c of candidates) {
      if (c === undefined || c === null || String(c).trim() === '') continue
      const s = String(c).trim()
      const numeric = parseInt(s, 10)
      if (!isNaN(numeric)) {
        affiliateId = numeric
        affiliateName = _idToName[affiliateId] || null
        // fallback: try payments report mapping by id if payments provide a name
        if (!affiliateName) {
          try {
            const payInfo = await getPaymentAffiliateById(numeric)
            if (payInfo && payInfo.affiliateName) affiliateName = payInfo.affiliateName
          } catch (e) {
            /* ignore */
          }
        }
        if (affiliateId || affiliateName) break
      }
      // treat as name
      const key = normalizeAffiliateKey(s)
      if (_nameKeyToId && _nameKeyToId[key]) {
        affiliateId = _nameKeyToId[key]
        affiliateName = _idToName[affiliateId] || null
        break
      }
      if (_mediaByNameKey && _mediaByNameKey[key]) {
        affiliateName = s
        affiliateId = null
        break
      }
    }
  } else {
    const trimmed = String(input).trim()
    const num = parseInt(trimmed, 10)
    if (!isNaN(num)) {
      affiliateId = num
      affiliateName = _idToName[affiliateId] || null
    } else {
      const key = normalizeAffiliateKey(trimmed)
      affiliateId = _nameKeyToId[key] || null
      if (affiliateId) affiliateName = _idToName[affiliateId] || null
      else if (_mediaByNameKey[key]) {
        affiliateName = trimmed
        affiliateId = null
      }
    }
  }
  if (!affiliateId && !affiliateName) return null
  const affiliateNameKey = affiliateName ? normalizeAffiliateKey(affiliateName) : null
  const mediaMetrics = affiliateNameKey ? _mediaByNameKey[affiliateNameKey] || null : null
  let mappingConfidence = 'LOW'
  if (affiliateId && affiliateName) mappingConfidence = mediaMetrics ? 'HIGH' : 'MEDIUM'
  else if (mediaMetrics) mappingConfidence = 'LOW'
  return {
    affiliateId,
    affiliateName,
    affiliateNameKey,
    mediaMetrics,
    payoutMetrics: null,
    mappingConfidence,
  }
}

export async function searchAffiliate(query) {
  await loadAllReportsAndBuildAffiliateIndex()
  const qRaw = String(query).trim()
  const isNumeric = /^\d+$/.test(qRaw)
  if (isNumeric) {
    const id = parseInt(qRaw, 10)
    const name = _idToName[id]
    return name ? { id, display: `${id} — ${name}` } : null
  } else {
    const key = normalizeAffiliateKey(qRaw)
    const id = _nameKeyToId[key]
    if (id) {
      const name = _idToName[id]
      return { id, display: `${id} — ${name}` }
    }
    return null
  }
}

function toNum(x) {
  if (x === null || x === undefined || x === '') return 0
  const n = Number(String(x).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function buildSupportDecision(selectedUser) {
  if (!selectedUser) return null
  const depositsNum = toNum(selectedUser.totalDeposits)
  const withdrawalsNum = toNum(selectedUser.withdrawals)
  const netDeposits = toNum(selectedUser.netDeposits)
  const volumeNum = toNum(selectedUser.volume)
  const positionCountNum = toNum(selectedUser.positionCount || selectedUser.positioncount)
  const plNum = toNum(selectedUser.pl)
  const hasCommissions = toNum(selectedUser.affiliateCommissions || selectedUser.commissions) > 0
  const withdrawalRatio = depositsNum > 0 ? withdrawalsNum / depositsNum : 0

  // determine basic caseType/riskLevel as before but keep full object including replyTemplate
  let caseType = 'ACTIVE_USER'
  let riskLevel = 'low'

  if (selectedUser.paymentsLoaded === false || selectedUser.mediaLoaded === false) {
    caseType = 'DATA_INCOMPLETE'
    riskLevel = 'medium'
  } else if (withdrawalsNum > 0 && depositsNum > 0 && withdrawalRatio > 0.7) {
    caseType = 'POTENTIAL_ABUSE'
    riskLevel = 'high'
  } else if (withdrawalsNum > 0 && depositsNum > 0) {
    caseType = 'WITHDRAWAL_REQUEST'
    riskLevel = 'medium'
  } else if (depositsNum > 0 && volumeNum === 0 && positionCountNum === 0) {
    caseType = 'DEPOSIT_NO_TRADING'
    riskLevel = 'low'
  } else if (depositsNum === 0) {
    caseType = 'NO_DEPOSIT'
    riskLevel = 'low'
  } else if (depositsNum > 5000) {
    caseType = 'HIGH_VALUE_USER'
    riskLevel = 'low'
  } else if (
    selectedUser.fraud ||
    selectedUser.action === 'fraud' ||
    selectedUser.status === 'fraud'
  ) {
    caseType = 'FRAUD_RISK'
    riskLevel = 'high'
  } else {
    caseType = 'ACTIVE_USER'
    riskLevel = 'low'
  }

  // replyTemplate mapping
  let replyTemplate = ''
  switch (caseType) {
    case 'DATA_INCOMPLETE':
      replyTemplate = "Thanks — we're checking your account details and will update you shortly."
      break
    case 'WITHDRAWAL_REQUEST':
      replyTemplate =
        "Thanks — your withdrawal request is in review. We'll confirm once checks are completed."
      break
    case 'POTENTIAL_ABUSE':
      replyTemplate =
        'Thanks — we need additional verification before proceeding. Our team will contact you if needed.'
      break
    case 'HIGH_VALUE_USER':
      replyTemplate = "Thanks — we'll prioritize your request and confirm next steps shortly."
      break
    case 'NO_DEPOSIT':
      replyTemplate = 'Thanks — your account is active. If you need help funding, we can guide you.'
      break
    case 'ACTIVE_USER':
      replyTemplate = "Thanks — we're reviewing your request and will update you shortly."
      break
    default:
      replyTemplate = "Thanks — we're reviewing and will follow up shortly."
  }

  const replyKey = `support.reply.caseType.${caseType}`
  return { caseType, riskLevel, replyTemplate, replyKey }
}

export function buildSupportDecisions(selectedUser) {
  if (!selectedUser) return null
  // derive numeric helpers
  const deposits = toNum(selectedUser.totalDeposits)
  const withdrawals = toNum(selectedUser.withdrawals)
  const netDeposits = toNum(selectedUser.netDeposits)
  const volume = toNum(selectedUser.volume)
  const pl = toNum(selectedUser.pl)
  const hasCommissions = toNum(selectedUser.affiliateCommissions || selectedUser.commissions) > 0
  const withdrawalRatio = deposits > 0 ? withdrawals / deposits : 0
  const isHighValue = deposits >= 5000
  const hasAffiliate = Boolean(
    selectedUser.affiliateId && String(selectedUser.affiliateId).trim() !== ''
  )

  const decisions = {}

  // 1) Affiliate Switch
  if (!hasAffiliate) {
    decisions.affiliateSwitch = {
      status: 'NEEDS_CONTEXT',
      whyKey: 'support.decision.affiliateSwitch.noAffiliate.why',
      why: 'No affiliate assigned on this account.',
      nextActionsI18n: [
        { key: 'support.decision.affiliateSwitch.noAffiliate.action.verifyCrm' },
        { key: 'support.decision.affiliateSwitch.noAffiliate.action.openNewAccount' },
      ],
      nextActions: [
        'Verify CRM affiliate attribution.',
        'If user wants a new affiliate, open a NEW account via affiliate link.',
      ],
    }
  } else if (hasCommissions) {
    decisions.affiliateSwitch = {
      status: 'NOT_ELIGIBLE',
      whyKey: 'support.decision.affiliateSwitch.hasCommissions.why',
      why: 'Account already generated affiliate commissions. Switching would create cost/attribution issues.',
      nextActionsI18n: [
        { key: 'support.decision.affiliateSwitch.hasCommissions.action.doNotSwitch' },
        { key: 'support.decision.affiliateSwitch.hasCommissions.action.openNewAccount' },
        { key: 'support.decision.affiliateSwitch.hasCommissions.action.escalate' },
      ],
      nextActions: [
        'Do NOT switch the existing account.',
        'If user insists, propose opening a NEW account under the requested affiliate link (min deposit may apply).',
        'Escalate to Emanuele for final approval if needed.',
      ],
      signalsI18n: [{ key: 'support.decision.signal.commissionsGt0' }],
      signals: ['Commissions > 0'],
    }
  } else {
    decisions.affiliateSwitch = {
      status: 'ELIGIBLE',
      whyKey: 'support.decision.affiliateSwitch.noCommissions.why',
      why: 'No affiliate commissions generated on current account. Switch has no attribution cost.',
      nextActionsI18n: [
        { key: 'support.decision.affiliateSwitch.noCommissions.action.proceedSwitch' },
        { key: 'support.decision.affiliateSwitch.noCommissions.action.confirmUpdated' },
      ],
      nextActions: [
        'Proceed with switch (CRM + Skale).',
        'Confirm affiliate updated consistently in both systems.',
      ],
      signalsI18n: [{ key: 'support.decision.signal.commissionsEq0' }],
      signals: ['Commissions = 0'],
    }
  }

  // 2) Account Type Change
  if (withdrawalRatio > 0.7 && deposits > 0) {
    decisions.accountTypeChange = {
      status: 'NEEDS_MANUAL_REVIEW',
      whyKey: 'support.decision.accountTypeChange.highWithdrawalRatio.why',
      why: 'High withdrawal ratio suggests potential abuse; manual review required before account type change.',
      nextActionsI18n: [
        { key: 'support.decision.accountTypeChange.highWithdrawalRatio.action.escalateRisk' },
        { key: 'support.decision.accountTypeChange.highWithdrawalRatio.action.holdChange' },
      ],
      nextActions: [
        'Escalate to risk team for manual review.',
        'Hold account type change until clearance.',
      ],
      signalsI18n: [{ key: 'support.decision.signal.highWithdrawalRatio' }],
      signals: ['High withdrawal ratio'],
    }
  } else {
    const next = ['Allow account type change with conditions: verify KYC and PSP status.']
    if (withdrawals > 0) next.unshift('Require KYC/PSP check before changing type')
    decisions.accountTypeChange = {
      status: 'APPROVED_WITH_CONDITIONS',
      whyKey: 'support.decision.accountTypeChange.approvedWithConditions.why',
      why: 'Account type change allowed with operational checks.',
      nextActionsI18n: [
        ...(withdrawals > 0
          ? [
              {
                key: 'support.decision.accountTypeChange.approvedWithConditions.action.requireKycPsp',
              },
            ]
          : []),
        { key: 'support.decision.accountTypeChange.approvedWithConditions.action.allowWithChecks' },
      ],
      nextActions: next,
    }
  }

  // 3) Bonus/Credit Eligibility
  if (hasCommissions && deposits > 0) {
    decisions.bonus = {
      status: 'NEEDS_VERIFICATION',
      whyKey: 'support.decision.bonus.hasCommissionsAndDeposits.why',
      why: 'Account has affiliate commissions and deposits — bonus allocation requires verification to avoid double-cost.',
      nextActionsI18n: [
        { key: 'support.decision.bonus.hasCommissionsAndDeposits.action.verifyOwnership' },
        { key: 'support.decision.bonus.hasCommissionsAndDeposits.action.recordCrm' },
      ],
      nextActions: [
        'Verify affiliate commission ownership and marketing agreement before granting bonus.',
        'If approved, record reason in CRM.',
      ],
      signalsI18n: [
        { key: 'support.decision.signal.commissionsGt0' },
        { key: 'support.decision.signal.depositsEq', params: { value: deposits } },
      ],
      signals: ['Commissions > 0', `Deposits = ${deposits}`],
    }
  } else if (deposits === 0) {
    decisions.bonus = {
      status: 'NOT_ELIGIBLE',
      whyKey: 'support.decision.bonus.noDeposits.why',
      why: 'No deposits on account — bonus requires deposit activity.',
      nextActionsI18n: [{ key: 'support.decision.bonus.noDeposits.action.informFunding' }],
      nextActions: ['Inform user about funding options and minimum deposit requirements.'],
    }
  } else if (isHighValue) {
    decisions.bonus = {
      status: 'ELIGIBLE',
      whyKey: 'support.decision.bonus.highValue.why',
      why: 'High-value user eligible for bonus, subject to KYC.',
      nextActionsI18n: [{ key: 'support.decision.bonus.highValue.action.proceedKyc' }],
      nextActions: ['Proceed with bonus offer and initiate KYC if not present.'],
      signalsI18n: [{ key: 'support.decision.signal.highValueUser' }],
      signals: ['High value user'],
    }
  } else {
    decisions.bonus = {
      status: 'ELIGIBLE',
      whyKey: 'support.decision.bonus.standard.why',
      why: 'User eligible for standard promotional offers.',
      nextActionsI18n: [{ key: 'support.decision.bonus.standard.action.offerStandard' }],
      nextActions: ['Offer standard bonus per promotions catalogue.'],
    }
  }

  // 4) Withdrawal/Refund Handling
  if (withdrawals > 0 && deposits > 0 && withdrawalRatio > 0.7) {
    decisions.withdrawals = {
      status: 'HIGH_RISK',
      whyKey: 'support.decision.withdrawals.highRisk.why',
      why: 'High withdrawal ratio vs deposits.',
      nextActionsI18n: [
        { key: 'support.decision.withdrawals.highRisk.action.holdInvestigate' },
        { key: 'support.decision.withdrawals.highRisk.action.checkPspKyc' },
      ],
      nextActions: [
        'Hold and investigate.',
        'Check PSP/KYC, trading activity, and payment methods.',
      ],
      signalsI18n: [{ key: 'support.decision.signal.highWithdrawalRatio' }],
      signals: ['High withdrawal ratio'],
    }
  } else if (withdrawals > 0) {
    decisions.withdrawals = {
      status: 'NEEDS_PSP_CHECK',
      whyKey: 'support.decision.withdrawals.needsPspCheck.why',
      why: 'Withdrawals detected — verify PSP and KYC before processing.',
      nextActionsI18n: [
        { key: 'support.decision.withdrawals.needsPspCheck.action.verifyPsp' },
        { key: 'support.decision.withdrawals.needsPspCheck.action.confirmKyc' },
        { key: 'support.decision.withdrawals.needsPspCheck.action.processSla' },
      ],
      nextActions: ['Verify PSP status.', 'Confirm KYC.', 'Process according to SLA.'],
      signalsI18n: [{ key: 'support.decision.signal.withdrawalsGt0' }],
      signals: ['Withdrawals > 0'],
    }
  } else {
    decisions.withdrawals = {
      status: 'STANDARD_PROCESS',
      whyKey: 'support.decision.withdrawals.standardProcess.why',
      why: 'No withdrawals; follow standard processing.',
      nextActionsI18n: [{ key: 'support.decision.withdrawals.standardProcess.action.noAction' }],
      nextActions: ['No action required.'],
    }
  }

  // 5) Revenue Share Analysis
  if (pl < 0 && deposits > 0 && Math.abs(pl) > deposits * 0.5) {
    decisions.revenueShare = {
      status: 'CRITICAL_RISK',
      whyKey: 'support.decision.revenueShare.criticalRisk.why',
      why: 'Large negative P/L relative to deposits indicating potential retention/abuse risk.',
      nextActionsI18n: [
        { key: 'support.decision.revenueShare.criticalRisk.action.reviewRetention' },
        { key: 'support.decision.revenueShare.criticalRisk.action.considerLimits' },
      ],
      nextActions: [
        'Review retention strategy and fraud indicators.',
        'Consider special handling or limits.',
      ],
      signalsI18n: [
        { key: 'support.decision.signal.pl' },
        { key: 'support.decision.signal.plEq', params: { value: pl } },
        { key: 'support.decision.signal.depositsEqNoSpace', params: { value: deposits } },
      ],
      signals: ['P/L', `PL=${pl}`, `Deposits=${deposits}`],
    }
  } else if (pl > 0 && withdrawals > 0) {
    decisions.revenueShare = {
      status: 'NEUTRAL',
      whyKey: 'support.decision.revenueShare.profitAndWithdrawals.why',
      why: 'User shows profit and has withdrawals — monitor for churn/cashout.',
      nextActionsI18n: [
        { key: 'support.decision.revenueShare.profitAndWithdrawals.action.monitor' },
        { key: 'support.decision.revenueShare.profitAndWithdrawals.action.ensureCompliance' },
      ],
      nextActions: ['Monitor cashout behavior.', 'Ensure tax/compliance reporting if needed.'],
      signalsI18n: [
        { key: 'support.decision.signal.plPositive' },
        { key: 'support.decision.signal.withdrawalsDetected' },
      ],
      signals: ['P/L positive', 'Withdrawals detected'],
    }
  } else if (deposits === 0) {
    decisions.revenueShare = {
      status: 'NEUTRAL',
      whyKey: 'support.decision.revenueShare.noDeposits.why',
      why: 'No deposits — revenue impact is neutral.',
      nextActionsI18n: [{ key: 'support.decision.revenueShare.noDeposits.action.noAction' }],
      nextActions: ['No revenue actions required.'],
    }
  } else if (pl < 0) {
    decisions.revenueShare = {
      status: 'PROFITABLE',
      whyKey: 'support.decision.revenueShare.netLoss.why',
      why: 'User is net-loss (negative P/L) which may be beneficial for revenue share depending on contract.',
      nextActionsI18n: [{ key: 'support.decision.revenueShare.netLoss.action.reviewContract' }],
      nextActions: ['Review contract terms and retention options.'],
      signalsI18n: [
        { key: 'support.decision.signal.plNegative' },
        { key: 'support.decision.signal.plEq', params: { value: pl } },
      ],
      signals: ['P/L negative', `PL=${pl}`],
    }
  } else {
    decisions.revenueShare = {
      status: 'NEUTRAL',
      whyKey: 'support.decision.revenueShare.noIndicators.why',
      why: 'No significant revenue indicators.',
      nextActionsI18n: [{ key: 'support.decision.revenueShare.noIndicators.action.noAction' }],
      nextActions: ['No action required.'],
    }
  }

  // dev console snapshot for quick verification
  try {
    const uid = selectedUser.userId || selectedUser.userid || selectedUser.user || null
    console.log('Support decisions', { userId: uid, decisions })
  } catch (e) {
    /* ignore */
  }

  return decisions
}

export async function buildAffiliateKpiMap(force = false) {
  await loadAllReportsAndBuildAffiliateIndex(force)
  await loadMediaReport(force)
  const rows = Array.isArray(_mediaCache) ? _mediaCache : []
  const map = {}
  _affiliateDebugInfo = { totalRows: rows.length, aggregatedAffiliates: 0, missingIdMappings: [] }

  function getVal(row, candidates) {
    for (const c of candidates) {
      if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '')
        return toNum(row[c])
    }
    // try keys that start with candidate (handles suffixes like __2)
    for (const key of Object.keys(row || {})) {
      for (const c of candidates) {
        if (key.toLowerCase().startsWith(c)) return toNum(row[key])
      }
    }
    return 0
  }

  function addToAgg(agg, row) {
    agg.clicks += getVal(row, ['visitors', 'uniquevisitors', 'clicks', 'traffic'])
    agg.registrations += getVal(row, ['registrations', 'registration', 'regs'])
    agg.ftd += getVal(row, ['ftd', 'firstdeposit', 'first_trade', 'firsttrade'])
    agg.qftd += getVal(row, ['qftd', 'qualification'])
    agg.deposits += getVal(row, ['deposits', 'deposit', 'amount'])
    agg.withdrawals += getVal(row, ['withdrawals', 'withdrawal'])
    agg.netDeposits += getVal(row, ['netdeposits', 'net_deposits', 'net'])
    agg.revenue += getVal(row, ['commission', 'commissiontotal', 'commission_total', 'revenue'])
    agg.cpa += getVal(row, ['cpa', 'cpacommission', 'cpa_commission'])
    agg.cpl += getVal(row, ['cpl', 'cplcommission', 'cpl_commission'])
    agg.revshare += getVal(row, ['revshare', 'revsharecommission', 'revshare_commission'])
    agg.sub += getVal(row, ['sub', 'subcommission', 'sub_commission', 'subaffiliatecommissions'])
    agg.other += getVal(row, ['other', 'othercommission', 'other_commission'])
    agg.volume += getVal(row, ['volume', 'turnover'])
    agg.pl += getVal(row, ['pl', 'profitloss', 'netpl', 'net_pl'])
    agg.spend += getVal(row, ['spend', 'cost', 'media_spend'])
    agg.rows += 1
  }

  for (const row of rows) {
    const affiliateName = row.affiliate || row.affiliatename || row.name || ''
    if (!affiliateName) continue
    const nameKey = normalizeAffiliateKey(affiliateName)

    if (!map[nameKey]) {
      map[nameKey] = {
        affiliateId: null,
        name: affiliateName,
        clicks: 0,
        registrations: 0,
        ftd: 0,
        qftd: 0,
        deposits: 0,
        withdrawals: 0,
        netDeposits: 0,
        revenue: 0,
        commissionTotal: 0,
        cpa: 0,
        cpl: 0,
        revshare: 0,
        sub: 0,
        other: 0,
        volume: 0,
        pl: 0,
        roi: null,
        spend: 0,
        rows: 0,
      }
    }

    addToAgg(map[nameKey], row)
  }

  // post-process: attach ids and compute derived fields
  for (const nameKey of Object.keys(map)) {
    const entry = map[nameKey]
    const affiliateId = _nameKeyToId && _nameKeyToId[nameKey] ? _nameKeyToId[nameKey] : null
    if (affiliateId) {
      entry.affiliateId = affiliateId
      const idKey = String(affiliateId)
      map[idKey] = Object.assign({}, entry)
    } else {
      _affiliateDebugInfo.missingIdMappings.push(nameKey)
    }

    // commissionTotal: if commissionTotal column present use revenue value already read, else sum components
    if (!entry.revenue || entry.revenue === 0) {
      entry.commissionTotal = entry.cpa + entry.cpl + entry.revshare + entry.sub + entry.other
      entry.revenue = entry.commissionTotal
    } else {
      entry.commissionTotal = entry.revenue
    }

    // ecpa derived: cpa / max(ftd,1) else null
    entry.ecpa = entry.ftd > 0 ? entry.cpa / Math.max(1, entry.ftd) : entry.ecpa || null

    // roi: if spend > 0
    if (entry.spend > 0) {
      entry.roi = ((entry.revenue - entry.spend) / entry.spend) * 100
    } else {
      entry.roi = null
    }
  }

  _affiliateKpiMap = map
  _affiliateDebugInfo.totalAggregated = Object.keys(map).length
  _affiliateDebugInfo.aggregatedAffiliates = Object.keys(map).length

  return _affiliateKpiMap
}

export async function getAffiliateKpi(input) {
  if (!input) return null
  await buildAffiliateKpiMap()
  // numeric id lookup
  const asNum = parseInt(String(input).trim(), 10)
  if (!Number.isNaN(asNum)) {
    const idKey = String(asNum)
    if (_affiliateKpiMap && _affiliateKpiMap[idKey]) return _affiliateKpiMap[idKey]
    const name = _idToName && _idToName[asNum]
    if (name) {
      const nameKey = normalizeAffiliateKey(name)
      return (_affiliateKpiMap && _affiliateKpiMap[nameKey]) || null
    }
    return null
  }
  // treat as name
  const nameKey = normalizeAffiliateKey(String(input))
  return (
    (_affiliateKpiMap &&
      (_affiliateKpiMap[nameKey] ||
        _affiliateKpiMap[String((_nameKeyToId && _nameKeyToId[nameKey]) || '')])) ||
    null
  )
}

export async function getAffiliateOverview(id) {
  if (!id && id !== 0) return null
  await loadAllReportsAndBuildAffiliateIndex()

  const raw = String(id).trim()
  // try numeric id first
  const asNum = parseInt(raw, 10)
  let affiliateId = null
  let name = null
  if (!Number.isNaN(asNum)) {
    affiliateId = asNum
    name = _idToName ? _idToName[affiliateId] : null
  } else {
    // treat input as affiliate name (or display name)
    const nameKey = normalizeAffiliateKey(raw)
    if (_nameKeyToId && _nameKeyToId[nameKey]) {
      affiliateId = _nameKeyToId[nameKey]
      name = _idToName ? _idToName[affiliateId] : raw
    } else {
      // no id mapping available, return partial overview with provided name
      return {
        id: null,
        name: raw || null,
        clicks: 0,
        registrations: 0,
        ftd: 0,
        revenue: 0,
        ecpa: null,
        roi: null,
      }
    }
  }

  const kpi = affiliateId !== null ? await getAffiliateKpi(affiliateId) : null
  if (!kpi) {
    return {
      id: affiliateId,
      name: name || null,
      clicks: 0,
      registrations: 0,
      ftd: 0,
      revenue: 0,
      ecpa: null,
      roi: null,
    }
  }
  return {
    id: affiliateId,
    name: name || kpi.name || null,
    clicks: kpi.clicks,
    registrations: kpi.registrations,
    ftd: kpi.ftd,
    revenue: kpi.revenue,
    ecpa: kpi.ecpa,
    roi: kpi.roi,
  }
}

export function getAffiliateDebugSnapshot() {
  const paymentsAffiliates = _idToName ? Object.keys(_idToName).length : 0
  const mediaAffiliates = Array.isArray(_mediaCache) ? _mediaCache.length : 0
  const kpiKeys = _affiliateKpiMap ? Object.keys(_affiliateKpiMap).length : 0
  const sampleKpi = []
  if (_affiliateKpiMap) {
    for (const k of Object.keys(_affiliateKpiMap).slice(0, 3)) {
      const v = _affiliateKpiMap[k]
      sampleKpi.push({
        key: k,
        id: v.affiliateId || null,
        name: v.name,
        clicks: v.clicks,
        ftd: v.ftd,
        revenue: v.revenue,
      })
    }
  }
  return { paymentsAffiliates, mediaAffiliates, kpiKeys, sampleKpi }
}

// --- Lab helpers (temporary, used by Lab page) -----------------------------
export async function loadRegistrationsReport(force = false) {
  // wrapper around existing CSV loader for registrations
  return await loadCsvRows(force)
}

export async function buildAffiliateIdNameIndex(force = false) {
  if (_labAffiliateIndex && !force) return _labAffiliateIndex

  // reuse canonical index builder for payments -> id/name mapping
  await loadAllReportsAndBuildAffiliateIndex(force)
  const regs = Array.isArray(await loadCsvRows(force)) ? await loadCsvRows(force) : []

  const affiliateIdsSet = new Set()
  for (const r of regs) {
    const candidates = [r.affiliateid, r.affiliate, r.affiliatename, r.id]
    for (const c of candidates) {
      if (c === undefined || c === null) continue
      const s = String(c).trim()
      if (s === '') continue
      const digits = digitsOnly(s)
      if (!digits) continue
      if (digits === '2287') continue
      affiliateIdsSet.add(Number(digits))
      break
    }
  }

  const affiliateIdsFromRegistrations = Array.from(affiliateIdsSet).sort((a, b) => a - b)

  const idToName = {}
  for (const k of Object.keys(_idToName || {})) {
    idToName[String(k)] = _idToName[k]
  }

  const rows = affiliateIdsFromRegistrations.map((idNum) => {
    const idKey = String(idNum)
    const affiliateName = idToName[idKey] || null
    return { affiliateId: idKey, affiliateName, status: affiliateName ? 'MAPPED' : 'MISSING' }
  })

  _labAffiliateIndex = { affiliateIdsFromRegistrations, idToName, rows }
  return _labAffiliateIndex
}

export async function getAffiliateNameById(id) {
  if (!id && id !== 0) return null
  if (!_labAffiliateIndex) await buildAffiliateIdNameIndex()
  const key = String(id).replace(/\D+/g, '')
  if (!key) return null
  return _labAffiliateIndex && _labAffiliateIndex.idToName
    ? _labAffiliateIndex.idToName[key] || null
    : null
}

// --- Activity intelligence (Position Count + lifetime) ---------------------
// NOTE: All rows are pre-normalized by loadCsvRows() so keys are mostly alphanumeric.
// This helper is pure and safe to use from UI.

const ACTIVITY_THRESHOLDS = Object.freeze({
  // tier thresholds on positions/day
  lowMax: 1,
  activeMax: 5,
  highMax: 20,

  // bot/EA heuristics
  earlyDays: 7,
  earlyPositions: 200,
  earlyPositionsPerDay: 30,
  veryHighPositionsPerDay: 50,
})

function parseFlexibleDate(value) {
  if (value instanceof Date) return value
  if (value == null) return null
  const s = String(value).trim()
  if (!s) return null

  // Common report format: M/D/YYYY HH:mm:ss (but sometimes D/M)
  const parts = s.split(/\s+/, 2)
  const d = (parts[0] || '').split('/')
  if (d.length >= 3) {
    let a = parseInt(d[0], 10)
    let b = parseInt(d[1], 10)
    const yyyy = parseInt(d[2], 10)
    if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(yyyy)) {
      // Heuristic: if first number > 12 => D/M, else M/D
      let mm = a
      let dd = b
      if (a > 12) {
        dd = a
        mm = b
      }
      let hh = 0
      let mi = 0
      let ss = 0
      if (parts[1]) {
        const tp = parts[1].split(':')
        hh = parseInt(tp[0] || '0', 10)
        mi = parseInt(tp[1] || '0', 10)
        ss = parseInt(tp[2] || '0', 10)
      }
      const dt = new Date(yyyy, mm - 1, dd, hh, mi, ss)
      if (!Number.isNaN(dt.getTime())) return dt
    }
  }

  const dt2 = new Date(s)
  if (!Number.isNaN(dt2.getTime())) return dt2
  return null
}

function pickRowValue(row, candidates) {
  if (!row) return ''
  for (const k of candidates) {
    const v = row[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return v
  }
  return ''
}

function pickRowValueByPrefix(row, prefixes) {
  if (!row) return ''
  const keys = Object.keys(row)
  for (const prefix of prefixes) {
    if (!prefix) continue
    const direct = row[prefix]
    if (direct !== undefined && direct !== null && String(direct).trim() !== '') return direct
    const dupKey = keys.find((k) => k === prefix || k.startsWith(`${prefix}__`))
    if (dupKey) {
      const v = row[dupKey]
      if (v !== undefined && v !== null && String(v).trim() !== '') return v
    }
  }
  return ''
}

function parseIntLike(value) {
  if (value === null || value === undefined) return null
  const raw = String(value).trim()
  if (!raw) return null
  // Position count should be an integer (or an integer-looking string)
  const cleaned = raw.replace(/[^0-9.-]+/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return null
  const rounded = Math.round(n)
  if (Math.abs(n - rounded) > 1e-6) return null
  return rounded
}

function readPositionCount(row) {
  // Explicit position/trade count column only. Avoid using volume/lots as a proxy.
  // Keys are already normalized by loadCsvRows() (non-alphanum stripped).
  const raw = pickRowValueByPrefix(row, [
    'positioncount',
    'positioncounts',
    'positionscount',
    'tradecount',
    'tradescount',
    'totaltrades',
    'deals',
    'dealcount',
  ])

  const n = parseIntLike(raw)
  if (n == null || n < 0) return null

  // Heuristic guard: if the "position count" column is actually volume (common swap/mapping error),
  // it tends to match volume very closely and be extremely large.
  const volume = toNum(pickRowValue(row, ['volume', 'turnover']))
  if (volume > 0 && n > 1000) {
    const rel = Math.abs(n - volume) / Math.max(n, volume)
    if (rel < 0.002) return null
  }

  return n
}

function computeAgeDaysFromRow(row, now) {
  // IMPORTANT:
  // Rows are typically normalized by loadCsvRows(): keys are lowercase alphanum
  // (e.g. "registration_at" -> "registrationat", "registeredAt" -> "registeredat").
  // The Support UI accepts several registration date variants; keep this aligned
  // so bot/EA intensity (ageDays + positions/day) doesn't silently degrade.
  const regRaw =
    pickRowValueByPrefix(row, [
      'registrationdate',
      'regdate',
      'externaldate',
      'registered',
      'registeredat',
      'registrationat',
    ]) ||
    pickRowValue(row, [
      // legacy / non-normalized fallbacks (defensive)
      'registration_date',
      'external_date',
      'registeredAt',
      'registration_at',
    ])
  const dt = parseFlexibleDate(regRaw)
  if (!dt) return null
  const ms = (now || new Date()).getTime() - dt.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  return Math.max(1, Number.isFinite(days) ? days : 1)
}

function computeTier(positions, positionsPerDay) {
  if (!positions || positions <= 0) return 'inactive'
  if (positionsPerDay < ACTIVITY_THRESHOLDS.lowMax) return 'low'
  if (positionsPerDay < ACTIVITY_THRESHOLDS.activeMax) return 'active'
  if (positionsPerDay < ACTIVITY_THRESHOLDS.highMax) return 'high'
  return 'hyper'
}

export function computeActivityIntelligence(row, now = new Date()) {
  // IMPORTANT: "positions" must be the true position count (number of positions/trades),
  // not volume and not lots. If the report doesn't provide it reliably, leave it unknown.
  const positions = readPositionCount(row)
  const ageDays = computeAgeDaysFromRow(row, now)
  // If age is unknown, positions/day is unknown (do not assume 1 day).
  const positionsPerDay =
    positions != null && positions > 0 && ageDays != null && ageDays > 0
      ? positions / ageDays
      : null

  const totalDeposits = toNum(
    pickRowValue(row, ['totaldeposits', 'total_deposits', 'totaldeposit', 'total_deposit'])
  )
  const withdrawals = toNum(
    pickRowValue(row, ['withdrawals', 'totalwithdrawals', 'total_withdrawals'])
  )
  const volume = toNum(pickRowValue(row, ['volume', 'turnover']))
  const lots = toNum(pickRowValue(row, ['lots', 'total_lots']))
  const pl = toNum(pickRowValue(row, ['pl', 'netpl', 'net_pl', 'profitloss']))

  const tier =
    positions == null || positionsPerDay == null ? null : computeTier(positions, positionsPerDay)
  const signals = []
  const withdrawalRatio = totalDeposits > 0 ? withdrawals / Math.max(totalDeposits, 1) : null

  // 1) Early hyper-activity (bot/EA aggressive)
  const earlyWindow = ageDays != null && ageDays <= ACTIVITY_THRESHOLDS.earlyDays
  const earlyHyper = Boolean(
    positions != null &&
    positionsPerDay != null &&
    earlyWindow &&
    (positions >= ACTIVITY_THRESHOLDS.earlyPositions ||
      positionsPerDay >= ACTIVITY_THRESHOLDS.earlyPositionsPerDay)
  )
  if (earlyHyper) {
    signals.push({
      id: 'early_hyper',
      severity: 'high',
      titleKey: 'support.activity.signal.earlyHyper.title',
      bodyKey: 'support.activity.signal.earlyHyper.body',
      params: {
        ageDays: ageDays ?? '—',
        positions: Math.trunc(positions),
        ppd: positionsPerDay.toFixed(1),
      },
    })
  }

  // 2) Funded but not trading
  if (totalDeposits > 0 && positions === 0 && (ageDays == null || ageDays >= 3)) {
    signals.push({
      id: 'funded_no_trading',
      severity: 'medium',
      titleKey: 'support.activity.signal.fundedNoTrading.title',
      bodyKey: 'support.activity.signal.fundedNoTrading.body',
      params: { deposits: totalDeposits.toLocaleString() },
    })
  }

  // 3) High trading + heavy losses
  if (positionsPerDay != null && positionsPerDay >= 5 && totalDeposits > 0) {
    const roi = (pl / Math.max(totalDeposits, 1)) * 100
    if (roi <= -30) {
      signals.push({
        id: 'active_heavy_losses',
        severity: roi <= -60 ? 'high' : 'medium',
        titleKey: 'support.activity.signal.activeHeavyLosses.title',
        bodyKey: 'support.activity.signal.activeHeavyLosses.body',
        params: { roi: `${roi.toFixed(1)}%` },
      })
    }
  }

  // 4) Withdrawal-heavy + low trading
  if (positionsPerDay != null && totalDeposits > 0) {
    const wr = withdrawals / Math.max(totalDeposits, 1)
    if (wr >= 0.7 && positionsPerDay < 1) {
      signals.push({
        id: 'withdrawal_heavy_low_trading',
        severity: 'high',
        titleKey: 'support.activity.signal.withdrawalHeavyLowTrading.title',
        bodyKey: 'support.activity.signal.withdrawalHeavyLowTrading.body',
        params: { ratio: `${(wr * 100).toFixed(0)}%` },
      })
    }
  }

  // 4b) Withdrawals without deposits (data mismatch / abuse risk)
  if (totalDeposits === 0 && withdrawals > 0) {
    signals.push({
      id: 'withdrawals_without_deposits',
      severity: 'high',
      titleKey: 'support.activity.signal.withdrawalsWithoutDeposits.title',
      bodyKey: 'support.activity.signal.withdrawalsWithoutDeposits.body',
      params: { withdrawals: `$${withdrawals.toLocaleString()}` },
    })
  }

  // 4c) Withdrawals exceed deposits (potential fraud / chargeback / reporting issue)
  if (totalDeposits > 0) {
    const wr = withdrawals / Math.max(totalDeposits, 1)
    if (wr >= 1.05) {
      signals.push({
        id: 'withdrawals_exceed_deposits',
        severity: 'high',
        titleKey: 'support.activity.signal.withdrawalsExceedDeposits.title',
        bodyKey: 'support.activity.signal.withdrawalsExceedDeposits.body',
        params: { ratio: `${(wr * 100).toFixed(0)}%` },
      })
    }
  }

  // 4d) High cash-out while active (quick profit-taking / bonus abuse pattern)
  if (positionsPerDay != null && totalDeposits > 0) {
    const wr = withdrawals / Math.max(totalDeposits, 1)
    if (wr >= 0.8 && positionsPerDay >= 5 && ageDays != null && ageDays <= 30) {
      signals.push({
        id: 'high_cashout_active',
        severity: 'medium',
        titleKey: 'support.activity.signal.highCashoutActive.title',
        bodyKey: 'support.activity.signal.highCashoutActive.body',
        params: { ratio: `${(wr * 100).toFixed(0)}%`, ageDays },
      })
    }
  }

  // 5) Data mismatch: positions but no volume/lots
  if (positions != null && positions > 0 && volume === 0 && lots === 0) {
    signals.push({
      id: 'mismatch_positions_no_volume',
      severity: 'low',
      titleKey: 'support.activity.signal.mismatchPositionsNoVolume.title',
      bodyKey: 'support.activity.signal.mismatchPositionsNoVolume.body',
      params: {},
    })
  }

  const isPotentialBot = Boolean(
    positions != null &&
    positionsPerDay != null &&
    (earlyHyper ||
      (positionsPerDay >= ACTIVITY_THRESHOLDS.veryHighPositionsPerDay && positions >= 100))
  )

  // Simple ranking score for bot list (deterministic)
  const botScore =
    positions != null && positionsPerDay != null
      ? positionsPerDay * 2 + positions / 50 + (earlyHyper ? 100 : 0)
      : 0

  return {
    ageDays,
    positions: positions == null ? null : Math.trunc(positions),
    positionsPerDay,
    withdrawals: Math.trunc(withdrawals),
    withdrawalRatio,
    tier,
    signals,
    isPotentialBot,
    botScore,
    thresholds: ACTIVITY_THRESHOLDS,
  }
}

export function getAffiliateDebugInfo() {
  return {
    parsedPayments: Array.isArray(_paymentsCache) ? _paymentsCache.length : 0,
    idToNameSize: _idToName ? Object.keys(_idToName).length : 0,
    sampleKeys: _idToName ? Object.keys(_idToName).slice(0, 10) : [],
    debug: _affiliateDebugInfo || {},
  }
}
