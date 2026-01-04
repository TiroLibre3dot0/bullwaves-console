/*
Simple Registrations CSV sanitizer based on payments sanitizer.
Usage:
  node scripts/sanitize_registrations.js <sourceCsvPath>
Writes cleaned CSV to `public/Registrations Report.csv` and saves raw backup under `public/raw/`.
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const src = process.argv[2] || 'tmp_registrations.csv'
const dest = path.join('public', 'Registrations Report.csv')
const rawDir = path.join('public', 'raw')

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

function tryParse(text, opts = {}){
  return Papa.parse(text, Object.assign({ header: true, skipEmptyLines: true, quoteChar: '"', transformHeader: normalizedHeader }, opts))
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

console.log('Detected fields:', fields.join(', '))

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

function inspectRows(parsedData, expectedFields){
  const malformedLocal = []
  parsedData.forEach((r, idx) => {
    const keys = Object.keys(r)
    if (keys.length !== expectedFields.length) malformedLocal.push({ idx: idx+1, keysLength: keys.length })
  })
  return malformedLocal
}

let malformed = inspectRows(parsed.data, uniqueFields)
if (malformed.length){
  console.warn('Malformed rows detected in initial parse:', malformed.length, malformed.slice(0,5))
  const joined = balanceQuotesRejoin(pre)
  parsed = tryParse(joined, { delimiter: detectedDelimiter })
  fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : fields
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
  malformed = inspectRows(parsed.data, uniqueFields)
}

if (malformed.length){
  console.warn('Still malformed after rejoin; attempting parse without header as last resort')
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
    malformed = inspectRows(parsed.data, genFields)
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

console.log('Rows parsed:', cleanedRows.length)
if (malformed.length) console.warn('Malformed rows (field count mismatch):', malformed.length, malformed.slice(0,5))

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
if (fs.existsSync(dest)) {
  const bak = dest + '.' + timestamp + '.bak'
  fs.copyFileSync(dest, bak)
  console.log('Backed up existing', dest, '->', bak)
}

// write final CSV
try {
  const out = Papa.unparse(finalRows, { columns: finalFields })
  fs.writeFileSync(dest, out, 'utf8')
  console.log('Wrote cleaned CSV to', dest)
  console.log('Existing rows:', existingRows.length, 'New added:', toAdd.length, 'Unchanged duplicates skipped:', duplicatesUnchanged.length, 'Affiliate updates:', affiliateUpdates.length, 'Total field updates:', updatesLog.length)
} catch (e){
  console.error('Failed to write cleaned CSV:', e && e.message)
}

if (malformed.length) process.exitCode = 3
