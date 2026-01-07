/*
Simple Media CSV sanitizer.
Usage:
  node scripts/sanitize_media.js <sourceCsvPath>
Writes cleaned CSV to `public/Media Report.csv` and saves raw backup under `public/raw/`.
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run') || argv.includes('--dry')
const src = argv.find(a => !a.startsWith('--')) || 'tmp_media.csv'
const dest = path.join('public', 'Media Report.csv')
const rawDir = path.join('public', 'raw')

if (!fs.existsSync(src)) {
  console.error('Source file not found:', src)
  process.exit(1)
}
if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true })

let txt = fs.readFileSync(src, 'utf8')
if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1)

const timestamp = Date.now()
const rawBackup = path.join(rawDir, `media_raw.${timestamp}.csv`)
if (!dryRun) {
  fs.writeFileSync(rawBackup, txt, 'utf8')
  console.log('Saved raw backup to', rawBackup)
} else {
  console.log('Dry-run: would save raw backup to', rawBackup)
}

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

// For Media report we will dedupe before upserting.
// IMPORTANT: `uid` coming from exports is often NOT stable between runs, so
// using it as the primary key will cause duplicates (inflated metrics).
// We instead upsert by a stable business key: (month, affiliate, country).
let existingRows = []
let existingFields = null
if (fs.existsSync(dest)){
  try {
    const exTxt = fs.readFileSync(dest, 'utf8')
    const exParsed = Papa.parse(exTxt, { header: true, skipEmptyLines: true, quoteChar: '"', transformHeader: normalizedHeader })
    existingRows = exParsed.data || []
    existingFields = exParsed.meta && exParsed.meta.fields ? exParsed.meta.fields : null
  } catch (e){
    console.warn('Warning: failed to parse existing dest for append:', e && e.message)
    existingRows = []
  }
}

const finalFields = existingFields && existingFields.length ? existingFields : uniqueFields

function normalizeVal(v){
  if (v === undefined || v === null) return ''
  return String(v).trim().toLowerCase()
}

function normalizeForCompare(v){
  if (v === undefined || v === null) return ''
  let s = String(v).trim()
  // Normalize common numeric formatting differences (e.g. 1,215.00 vs 1215.00)
  if (/^[\d,.-]+%?$/.test(s)) s = s.replace(/,/g, '')
  return s.toLowerCase()
}

function normalizeMonth(v){
  const s = String(v ?? '').trim()
  if (!s) return ''

  // Accept: 1/2026, 01/2026, 1-2026
  let m = s.match(/^\s*(\d{1,2})\s*[\/\-]\s*(\d{4})\s*$/)
  if (m) {
    const month = String(Number(m[1])).padStart(2, '0')
    const year = m[2]
    return `${year}-${month}`
  }

  // Accept: 2026-01, 2026/1
  m = s.match(/^\s*(\d{4})\s*[\/\-]\s*(\d{1,2})\s*$/)
  if (m) {
    const year = m[1]
    const month = String(Number(m[2])).padStart(2, '0')
    return `${year}-${month}`
  }

  // Fallback: lowercase/trimmed raw value
  return normalizeVal(s)
}

function makeKey(row){
  const monthKey = normalizeMonth(row && row.month)
  const affiliateKey = normalizeVal(row && row.affiliate)
  const countryKey = normalizeVal(row && row.country)

  // Primary stable key.
  if (monthKey || affiliateKey || countryKey) {
    return `${monthKey}||${affiliateKey}||${countryKey}`
  }

  // Fallbacks if required.
  if (row && row.uid && String(row.uid).trim()) return `uid:${String(row.uid).trim()}`
  return JSON.stringify(row)
}

const originalExistingCount = existingRows.length

// First collapse duplicates already present in the destination file.
// This prevents metrics inflation from past bad merges.
let dedupedExisting = 0
const keyToIndex = new Map()
const dedupedRows = []
existingRows.forEach((r) => {
  const k = makeKey(r)
  if (keyToIndex.has(k)) {
    const idx = keyToIndex.get(k)
    dedupedRows[idx] = Object.assign({}, dedupedRows[idx], r)
    dedupedExisting++
  } else {
    keyToIndex.set(k, dedupedRows.length)
    dedupedRows.push(r)
  }
})

existingRows = dedupedRows

let updatedCount = 0
let addedCount = 0
let unchangedCount = 0
for (const r of cleanedRows) {
  const k = makeKey(r)
  if (keyToIndex.has(k)) {
    const idx = keyToIndex.get(k)
    const prev = existingRows[idx] || {}
    let changed = false
    for (const [field, nextVal] of Object.entries(r)) {
      // Treat month/affiliate/country equivalence as normalized values (so 1/2026 == 2026-01)
      if (field === 'month') {
        if (normalizeMonth(prev.month) !== normalizeMonth(nextVal)) changed = true
        continue
      }
      if (field === 'affiliate' || field === 'country') {
        if (normalizeVal(prev[field]) !== normalizeVal(nextVal)) changed = true
        continue
      }

      if (normalizeForCompare(prev[field]) !== normalizeForCompare(nextVal)) changed = true
    }

    if (changed) {
      existingRows[idx] = Object.assign({}, prev, r)
      updatedCount++
    } else {
      unchangedCount++
    }
  } else {
    existingRows.push(r)
    keyToIndex.set(k, existingRows.length - 1)
    addedCount++
  }
}

const finalRows = existingRows

// backup existing dest
if (dryRun){
  console.log('Dry-run summary:')
  console.log(' Existing rows in dest:', originalExistingCount)
  if (dedupedExisting) console.log(' Collapsed duplicates in dest:', dedupedExisting)
  console.log(' Parsed incoming rows:', cleanedRows.length)
  console.log(' New added:', addedCount)
  console.log(' Updated:', updatedCount)
  console.log(' Unchanged:', unchangedCount)
  if (malformed.length) console.warn('Malformed rows detected:', malformed.length)
  process.exit(0)
}

if (fs.existsSync(dest)) {
  var bakPath = dest + '.' + timestamp + '.bak'
  fs.copyFileSync(dest, bakPath)
  console.log('Backed up existing', dest, '->', bakPath)
}

// write final CSV atomically: write to temp file then rename
try {
  const out = Papa.unparse(finalRows, { columns: finalFields })
  const tmpDest = dest + '.tmp'
  fs.writeFileSync(tmpDest, out, 'utf8')
  // backup existing dest (already performed earlier)
  fs.renameSync(tmpDest, dest)
  console.log('Wrote cleaned CSV to', dest)
  console.log('Existing rows:', originalExistingCount, 'New added:', addedCount, 'Updated:', updatedCount)
  console.log('Unchanged duplicates skipped:', unchangedCount)
  if (dedupedExisting) console.log('Collapsed duplicates in dest:', dedupedExisting)

  // Cleanup: avoid accumulating .bak files unless explicitly requested.
  if (typeof bakPath === 'string' && bakPath && process.env.KEEP_BAK !== '1') {
    try {
      fs.unlinkSync(bakPath)
      console.log('Deleted backup', bakPath)
    } catch (e) {
      console.warn('Warning: failed to delete backup', bakPath, e && e.message)
    }
  }
} catch (e){
  console.error('Failed to write cleaned CSV atomically:', e && e.message)
  try {
    if (fs.existsSync(dest)) fs.unlinkSync(dest + '.tmp')
  } catch (e2) { /* ignore */ }
}

if (malformed.length) process.exitCode = 3
