/*
Simple Registrations CSV sanitizer based on payments sanitizer.
Usage:
  node scripts/sanitize_registrations.js <sourceCsvPath>
Writes cleaned CSV to `public/Registrations Report.csv` and saves raw backup under `public/raw/`.
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')
const { replaceFileSync } = require('./replaceFileSync')

const projectRoot = path.join(__dirname, '..')
const srcArg = process.argv[2] || 'tmp_registrations.csv'
const src = path.isAbsolute(srcArg) ? srcArg : path.join(projectRoot, srcArg)
const dest = path.join(projectRoot, 'public', 'Registrations Report.csv')
const rawDir = path.join(projectRoot, 'public', 'raw')

if (!fs.existsSync(src)) {
  console.error('Source file not found:', src)
  process.exit(1)
}
if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true })

let txt = fs.readFileSync(src, 'utf8')
if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1)

const timestamp = Date.now()
const rawBackup = path.join(rawDir, `registrations_raw.${timestamp}.csv`)
fs.writeFileSync(rawBackup, txt, 'utf8')
console.log('Saved raw backup to', rawBackup)

const normalizedHeader = h => String(h||'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')

const VERBOSE = process.env.SANITIZER_VERBOSE === '1'
const debug = (...args) => { if (VERBOSE) console.log(...args) }

function tryParse(text, opts = {}){
  return Papa.parse(text, Object.assign({ header: true, skipEmptyLines: true, quoteChar: '"', transformHeader: normalizedHeader }, opts))
}

function hasHardParseErrors(parsed){
  const errs = parsed && Array.isArray(parsed.errors) ? parsed.errors : []
  // TooFewFields is extremely common in exports (missing trailing empty columns)
  // and should not force fallbacks.
  return errs.some(e => e && (
    e.type === 'Quotes'
    || e.code === 'InvalidQuotes'
    || e.code === 'TooManyFields'
  ))
}

function recordWiseParse(text, { delimiter }) {
  const lines = String(text || '').split(/\r?\n/)
  const nonEmpty = lines.filter((l) => String(l || '').trim() !== '')
  if (!nonEmpty.length) return { data: [], meta: { fields: [] }, errors: [] }

  // Parse header as a single CSV record (no transformHeader here: we want raw field order).
  const headerLine = nonEmpty[0]
  const headerParsed = Papa.parse(headerLine, {
    header: false,
    skipEmptyLines: true,
    delimiter,
    quoteChar: '"',
  })
  const headerCells = (headerParsed && headerParsed.data && headerParsed.data[0]) || []
  const fields = headerCells.map(normalizedHeader)
  const expectedLen = fields.length

  const rows = []
  let buf = ''

  const flush = (recordText) => {
    const rec = Papa.parse(recordText, {
      header: false,
      skipEmptyLines: false,
      delimiter,
      quoteChar: '"',
    })
    const cells = (rec && rec.data && rec.data[0]) || []
    if (!expectedLen) return

    let parts = Array.isArray(cells) ? cells.slice() : []
    if (parts.length > expectedLen && expectedLen >= 1) {
      const lastIdx = expectedLen - 1
      const merged = parts.slice(lastIdx).join(delimiter)
      parts = parts.slice(0, lastIdx).concat([merged])
    }
    if (parts.length < expectedLen) {
      while (parts.length < expectedLen) parts.push('')
    }

    const obj = {}
    for (let c = 0; c < expectedLen; c++) obj[fields[c] || `col_${c}`] = parts[c]
    rows.push(obj)
  }

  // Consume data records (may span multiple lines if quotes are broken).
  for (let i = 1; i < nonEmpty.length; i++) {
    const line = nonEmpty[i]
    buf = buf ? `${buf}\n${line}` : line
    const q = (buf.match(/\"/g) || []).length
    if (q % 2 === 0) {
      flush(buf)
      buf = ''
    }
  }
  if (buf) flush(buf)

  return { data: rows, meta: { fields }, errors: [] }
}

function preprocessRaw(text){
  const lines = text.split(/\r?\n/)
  return lines.map(l=>{
    if (!l) return l
    l = l.replace(/;{1,}\s*$/g, '')
    if (/^".*"$/.test(l) && l.indexOf('""') !== -1){
      l = l.slice(1,-1).replace(/""/g, '"')
    }
    return l
  }).join('\n')
}

function detectDelimiter(sample){
  const commaCount = (sample.match(/,/g)||[]).length
  const semiCount = (sample.match(/;/g)||[]).length
  return semiCount > commaCount ? ';' : ','
}

function balanceQuotesRejoin(text){
  const lines = text.split(/\r?\n/)
  const out = []
  let buf = ''
  for (let i=0;i<lines.length;i++){
    const line = lines[i]
    if (buf.length) buf += '\n'+line; else buf = line
    const q = (buf.match(/\"/g)||[]).length
    if (q % 2 === 0) { out.push(buf); buf = '' }
  }
  if (buf.length) out.push(buf)
  return out.join('\n')
}

function summarizeParseIssues(parsed){
  const errs = parsed && Array.isArray(parsed.errors) ? parsed.errors : []
  const out = { total: errs.length, invalidQuotes: 0, tooManyFields: 0, tooFewFields: 0 }
  for (const e of errs) {
    if (!e) continue
    if (e.code === 'InvalidQuotes' || e.type === 'Quotes') out.invalidQuotes++
    else if (e.code === 'TooManyFields') out.tooManyFields++
    else if (e.code === 'TooFewFields') out.tooFewFields++
  }
  return out
}

function inspectRows(parsedData){
  // Only treat rows as malformed when they have overflow columns.
  // Missing fields are common in exports and are filled as blanks during normalization.
  const malformedLocal = []
  const list = Array.isArray(parsedData) ? parsedData : []
  for (let i = 0; i < list.length; i++) {
    const r = list[i]
    if (r && typeof r === 'object' && Object.prototype.hasOwnProperty.call(r, '__parsed_extra')) {
      const extra = Array.isArray(r.__parsed_extra) ? r.__parsed_extra.length : 1
      malformedLocal.push({ idx: i + 1, reason: '__parsed_extra', extraCols: extra })
    }
  }
  return malformedLocal
}

const pre = preprocessRaw(txt)
const sampleHeader = pre.split(/\r?\n/)[0] || ''
const detectedDelimiter = detectDelimiter(sampleHeader)
console.log('Auto-detected delimiter:', JSON.stringify(detectedDelimiter))

let parsed = tryParse(pre, { delimiter: detectedDelimiter })
let fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : null

if (!fields){
  const joined = balanceQuotesRejoin(pre)
  parsed = tryParse(joined, { delimiter: detectedDelimiter })
  fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : null
}

if (!fields){
  console.error('Unable to detect header fields after fallback parsing. Aborting.')
  process.exit(2)
}

if (VERBOSE) console.log('Detected fields:', fields.join(', '))
else console.log(`Detected fields: ${fields.length} (set SANITIZER_VERBOSE=1 to print names)`)

const uniqueFields = []
const seen = {}
fields.forEach((f,i)=>{
  let name = f || `col_${i}`
  if (seen[name]){
    let k = 1
    while(seen[`${name}_${k}`]) k++
    name = `${name}_${k}`
  }
  seen[name] = true
  uniqueFields.push(name)
})

const issueSummary = summarizeParseIssues(parsed)
if (issueSummary.total) {
  debug(
    `Debug: PapaParse issues (total=${issueSummary.total}, invalidQuotes=${issueSummary.invalidQuotes}, tooManyFields=${issueSummary.tooManyFields}, tooFewFields=${issueSummary.tooFewFields})`
  )
}

let malformed = inspectRows(parsed.data)

// Only attempt quote-rejoin fallback when there are hard quote/field-overflow issues.
if (hasHardParseErrors(parsed) || malformed.length) {
  debug('Debug: attempting quote-balanced rejoin fallback for registrations')
  const joined = balanceQuotesRejoin(pre)
  parsed = tryParse(joined, { delimiter: detectedDelimiter })
  fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : fields

  // rebuild uniqueFields from new fields
  uniqueFields.length = 0
  Object.keys(seen).forEach(k=>delete seen[k])
  fields.forEach((f,i)=>{
    let name = f || `col_${i}`
    if (seen[name]){
      let k = 1
      while(seen[`${name}_${k}`]) k++
      name = `${name}_${k}`
    }
    seen[name] = true
    uniqueFields.push(name)
  })

  malformed = inspectRows(parsed.data)
}

// If we still have hard parse issues or overflow columns, switch to lenient parser.
if (hasHardParseErrors(parsed) || malformed.length) {
  console.log('Info: CSV had quoting/field-count issues; using record-wise parser')
  parsed = recordWiseParse(pre, { delimiter: detectedDelimiter })
  fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : fields

  // rebuild uniqueFields from new fields
  uniqueFields.length = 0
  Object.keys(seen).forEach(k=>delete seen[k])
  fields.forEach((f,i)=>{
    let name = f || `col_${i}`
    if (seen[name]){
      let k = 1
      while(seen[`${name}_${k}`]) k++
      name = `${name}_${k}`
    }
    seen[name] = true
    uniqueFields.push(name)
  })

  malformed = inspectRows(parsed.data)
}

// Last resort: no-header parse is lossy; keep it behind explicit opt-in.
if (malformed.length && process.env.SANITIZER_ALLOW_NOHEADER === '1') {
  console.log('Info: overflow columns persist; attempting no-header parse (SANITIZER_ALLOW_NOHEADER=1)')
  const rawNoHeader = Papa.parse(txt, { header: false, skipEmptyLines: true, quoteChar: '"' })
  if (rawNoHeader && rawNoHeader.data && rawNoHeader.data.length>1){
    const headerRow = rawNoHeader.data[0]
    const genFields = headerRow.map((h,i)=> normalizedHeader(h||('col'+i)))
    const rows = rawNoHeader.data.slice(1).map(r=>{
      const obj = {}
      genFields.forEach((f,i)=> obj[f] = r[i])
      return obj
    })
    parsed = { data: rows, meta: { fields: genFields } }
    fields = genFields
    malformed = inspectRows(parsed.data)
  }
}

const cleanedRows = []
parsed.data.forEach((r, idx) => {
  const obj = {}
  uniqueFields.forEach((f, i) => {
    if (Object.prototype.hasOwnProperty.call(r, f)) obj[f] = r[f]
    else {
      const origKey = parsed.meta && parsed.meta.fields && parsed.meta.fields[i]
      obj[f] = origKey && Object.prototype.hasOwnProperty.call(r, origKey) ? r[origKey] : r[f]
    }
  })
  cleanedRows.push(obj)
})

function normalizeCommaPlaceholder(value) {
  const t = String(value ?? '').trim()
  return t === ',' ? '' : value
}

function normalizeNonNegativeIntString(value) {
  const t = String(value ?? '').trim()
  if (!t) return ''
  const cleaned = t.replace(/,/g, '')
  const n = Number.parseFloat(cleaned)
  if (!Number.isFinite(n)) return ''
  if (n < 0) return ''
  if (Math.abs(n - Math.round(n)) > 1e-9) return ''
  return String(Math.round(n))
}

// Some exports use a literal comma "," as a placeholder for missing values.
// Normalize those to empty strings to avoid downstream ambiguity.
const COMMA_PLACEHOLDER_FIELDS = [
  'first_deposit',
  'first_deposit_date',
  'external_ftd_date',
  'qualification_date',
]

cleanedRows.forEach((row) => {
  if (!row || typeof row !== 'object') return
  COMMA_PLACEHOLDER_FIELDS.forEach((f) => {
    if (Object.prototype.hasOwnProperty.call(row, f)) row[f] = normalizeCommaPlaceholder(row[f])
  })
  if (Object.prototype.hasOwnProperty.call(row, 'deposit_count')) {
    row.deposit_count = normalizeNonNegativeIntString(row.deposit_count)
  }
})

console.log('Rows parsed:', cleanedRows.length)
if (malformed.length && (VERBOSE || process.env.SANITIZER_WARN_OVERFLOW === '1')) {
  console.log('Info: overflow rows (__parsed_extra):', malformed.length, malformed.slice(0,5))
}

// Deduplication against existing `dest` (keep existing records, append new unique ones)
let existingRows = []
let existingFields = null
if (fs.existsSync(dest)){
  try {
    const exTxt = fs.readFileSync(dest, 'utf8')
    const exParsed = Papa.parse(exTxt, { header: true, skipEmptyLines: true, quoteChar: '"', transformHeader: normalizedHeader })
    existingRows = exParsed.data || []
    existingFields = exParsed.meta && exParsed.meta.fields ? exParsed.meta.fields : null
  } catch (e){
    console.warn('Warning: failed to parse existing dest for dedupe:', e && e.message)
    existingRows = []
  }
}

// choose dedupe key: prefer `user_id`, then `mt5_account`, else first column
let keyField = uniqueFields.find(f=>f==='user_id' || f.includes('user_id')) || uniqueFields.find(f=>f.includes('mt5')) || uniqueFields[0]
const norm = v => String(v ?? '').trim()

function parseDateMs(text) {
  const t = String(text || '').trim()
  if (!t) return 0

  // ISO
  if (/\d{4}-\d{2}-\d{2}T/.test(t)) {
    const ms = Date.parse(t)
    return Number.isFinite(ms) ? ms : 0
  }

  // M/D/YYYY or D/M/YYYY with optional time
  const parts = t.split(/\s+/, 2)
  const d = (parts[0] || '').split('/')
  if (d.length >= 3) {
    let a = parseInt(d[0], 10)
    let b = parseInt(d[1], 10)
    const yyyy = parseInt(d[2], 10)
    if (a && b && yyyy) {
      // Heuristic: if first number > 12, treat as D/M/YYYY, else M/D/YYYY
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

      const ms = Date.UTC(yyyy, mm - 1, dd, hh, mi, ss)
      return Number.isFinite(ms) ? ms : 0
    }
  }

  const ms = Date.parse(t)
  return Number.isFinite(ms) ? ms : 0
}

// Fields that can legitimately change over time for the same user.
// Rule of thumb:
// - overwrite-if-present for metrics/status/dates
// - fill-blanks-only for identity-ish fields (name/country/etc)
const OVERWRITE_IF_PRESENT_FIELDS = new Set([
  // attribution / lifecycle
  'affiliate_id',
  'status',
  'revshare_enabled',
  'fraudchargeback',
  'action',

  // base dates (these are often refreshed in new exports)
  'external_date',
  'registration_date',

  // deposits & dates
  'first_deposit',
  'first_deposit_date',
  'external_ftd_date',
  'qualification_date',

  // performance / metrics
  'net_deposits',
  'deposit_count',
  'withdrawals',
  'total_deposits',
  'pl',
  'net_pl',
  'position_count',
  'volume',
  'lots',
  'spread',
  'roi',
  'commissions',
  'affiliate_commissions',
  'sub_affiliate_commissions',
  'cpa_commission',
  'cpl_commission',
  'revshare_commission',
  'other_commissions',
])

// For date-like fields we should keep the latest value (avoid regressions
// when an upload contains older rows for the same account).
const DATE_MAX_FIELDS = new Set([
  'external_date',
  'registration_date',
  'first_deposit_date',
  'external_ftd_date',
  'qualification_date',
])

const existingIndexByKey = new Map()
existingRows.forEach((row, idx) => {
  const k = norm(row && row[keyField])
  if (k && !existingIndexByKey.has(k)) existingIndexByKey.set(k, idx)
})

const toAdd = []
const toAddIndexByKey = new Map()
const duplicatesUnchanged = []
const affiliateUpdates = []
const updatesLog = []

function mergeIncomingIntoTarget(targetRow, incomingRow, keyValueForLog) {
  if (!targetRow || !incomingRow) return { changed: false, affiliateChanged: false }

  let changed = false
  let affiliateChanged = false

  uniqueFields.forEach((f) => {
    if (f === keyField) return
    const incomingVal = norm(incomingRow[f])
    if (!incomingVal) return

    const existingVal = norm(targetRow[f])
    const shouldOverwrite = OVERWRITE_IF_PRESENT_FIELDS.has(f)
    if (shouldOverwrite) {
      if (existingVal && DATE_MAX_FIELDS.has(f)) {
        const existingMs = parseDateMs(existingVal)
        const incomingMs = parseDateMs(incomingVal)
        if (existingMs && incomingMs && incomingMs <= existingMs) return
      }
      if (incomingVal !== existingVal) {
        targetRow[f] = incomingVal
        changed = true
        if (f === 'affiliate_id') affiliateChanged = true
        updatesLog.push({
          key_field: keyField,
          key_value: keyValueForLog || '',
          field: f,
          old_value: existingVal,
          new_value: incomingVal,
        })
      }
      return
    }

    // Conservative merge for the rest: fill blanks only.
    if (!existingVal) {
      targetRow[f] = incomingVal
      changed = true
      updatesLog.push({
        key_field: keyField,
        key_value: keyValueForLog || '',
        field: f,
        old_value: existingVal,
        new_value: incomingVal,
      })
    }
  })

  return { changed, affiliateChanged }
}

cleanedRows.forEach((r) => {
  const k = norm(r && r[keyField])
  if (!k) {
    // No key — treat as new row.
    toAdd.push(r)
    return
  }

  // Duplicate of an existing row: update affiliate_id (and fill blanks) instead of skipping.
  if (existingIndexByKey.has(k)) {
    const idx = existingIndexByKey.get(k)
    const existingRow = existingRows[idx]
    const beforeAffiliate = norm(existingRow && existingRow.affiliate_id)
    const { changed, affiliateChanged } = mergeIncomingIntoTarget(existingRow, r, k)
    const afterAffiliate = norm(existingRow && existingRow.affiliate_id)
    if (affiliateChanged) {
      affiliateUpdates.push({
        key_field: keyField,
        key_value: k,
        old_affiliate_id: beforeAffiliate,
        new_affiliate_id: afterAffiliate,
      })
    }
    if (!changed) duplicatesUnchanged.push(r)
    return
  }

  // Duplicate within the new upload itself: merge into the first seen.
  if (toAddIndexByKey.has(k)) {
    const idx = toAddIndexByKey.get(k)
    const target = toAdd[idx]
    const { changed } = mergeIncomingIntoTarget(target, r, k)
    if (!changed) duplicatesUnchanged.push(r)
    return
  }

  toAddIndexByKey.set(k, toAdd.length)
  toAdd.push(r)
})

if (duplicatesUnchanged.length) {
  const dupPath = path.join(rawDir, `registrations_duplicates.${timestamp}.csv`)
  try {
    fs.writeFileSync(dupPath, Papa.unparse(duplicatesUnchanged, { columns: uniqueFields }), 'utf8')
    console.log('Wrote unchanged duplicates to', dupPath)
  } catch (e){ console.warn('Failed to write duplicates file:', e && e.message) }
}

if (affiliateUpdates.length) {
  const updPath = path.join(rawDir, `registrations_affiliate_updates.${timestamp}.csv`)
  try {
    fs.writeFileSync(updPath, Papa.unparse(affiliateUpdates, { columns: ['key_field','key_value','old_affiliate_id','new_affiliate_id'] }), 'utf8')
    console.log('Wrote affiliate updates to', updPath)
  } catch (e){ console.warn('Failed to write affiliate updates file:', e && e.message) }
}

if (updatesLog.length) {
  const updPath = path.join(rawDir, `registrations_updates.${timestamp}.csv`)
  try {
    fs.writeFileSync(updPath, Papa.unparse(updatesLog, { columns: ['key_field','key_value','field','old_value','new_value'] }), 'utf8')
    console.log('Wrote updates log to', updPath)
  } catch (e){ console.warn('Failed to write updates log file:', e && e.message) }
}

// final rows: existing + toAdd
const finalFields = (existingFields && existingFields.length ? existingFields.slice() : uniqueFields.slice())
uniqueFields.forEach(f => { if (!finalFields.includes(f)) finalFields.push(f) })
const finalRows = existingRows.concat(toAdd)

// Ensure output consistency across both existing and newly added rows.
finalRows.forEach((row) => {
  if (!row || typeof row !== 'object') return
  COMMA_PLACEHOLDER_FIELDS.forEach((f) => {
    if (Object.prototype.hasOwnProperty.call(row, f)) row[f] = normalizeCommaPlaceholder(row[f])
  })
  if (Object.prototype.hasOwnProperty.call(row, 'deposit_count')) {
    row.deposit_count = normalizeNonNegativeIntString(row.deposit_count)
  }
})

function parseAnyMDYorDMY(text) {
  const t = String(text || '').trim()
  if (!t) return null
  const parts = t.split(/\s+/, 2)
  const d = (parts[0] || '').split('/')
  if (d.length < 3) return null
  let a = parseInt(d[0], 10)
  let b = parseInt(d[1], 10)
  const yyyy = parseInt(d[2], 10)
  if (!a || !b || !yyyy) return null
  // Heuristic: if first number > 12, treat as D/M/YYYY, else M/D/YYYY
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
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd, hh, mi, ss))
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

// Keep newest rows first (matches existing report expectation and makes uploads obvious).
const sortField = finalFields.includes('registration_date')
  ? 'registration_date'
  : (finalFields.includes('external_date') ? 'external_date' : null)

if (sortField) {
  finalRows.sort((ra, rb) => {
    const da = parseAnyMDYorDMY(ra && ra[sortField])
    const db = parseAnyMDYorDMY(rb && rb[sortField])
    const ta = da ? da.getTime() : -Infinity
    const tb = db ? db.getTime() : -Infinity
    return tb - ta
  })
}

// backup existing dest
let bakPath = null
if (fs.existsSync(dest)) {
  bakPath = dest + '.' + timestamp + '.bak'
  fs.copyFileSync(dest, bakPath)
  console.log('Backed up existing', dest, '->', bakPath)
}

// write final CSV
try {
  const out = Papa.unparse(finalRows, { columns: finalFields })
  const tmpDest = dest + '.tmp'
  fs.writeFileSync(tmpDest, out, 'utf8')
  replaceFileSync(tmpDest, dest)
  console.log('Wrote cleaned CSV to', dest)
  console.log('Existing rows:', existingRows.length, 'New added:', toAdd.length, 'Unchanged duplicates skipped:', duplicatesUnchanged.length, 'Affiliate updates:', affiliateUpdates.length, 'Total field updates:', updatesLog.length)

  // Cleanup: avoid accumulating .bak files unless explicitly requested.
  if (bakPath && process.env.KEEP_BAK !== '1') {
    try {
      fs.unlinkSync(bakPath)
      console.log('Deleted backup', bakPath)
    } catch (e) {
      console.warn('Warning: failed to delete backup', bakPath, e && e.message)
    }
  }
} catch (e){
  console.error('Failed to write cleaned CSV:', e && e.message)
  try {
    const tmpDest = dest + '.tmp'
    if (fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest)
  } catch (e2) { /* ignore */ }
  process.exitCode = 4
}

if (malformed.length && !process.exitCode && process.env.SANITIZER_FAIL_ON_MALFORMED === '1') process.exitCode = 3
