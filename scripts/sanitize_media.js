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

// For Media report we will dedupe before appending. Prefer `uid` when available,
// otherwise fall back to a composite key of several available columns.
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

function makeKey(row){
  if (row.uid && String(row.uid).trim()) return String(row.uid).trim()
  const candidates = ['month','affiliate','country','registrations','ftd','qftd','deposits','unique_impressions','visitors','leads']
  const parts = []
  for (const k of candidates){
    if (Object.prototype.hasOwnProperty.call(row, k)) parts.push(normalizeVal(row[k]))
  }
  if (parts.length) return parts.join('||')
  // fallback to JSON string if nothing useful
  return JSON.stringify(row)
}

const existingKeySet = new Set()
existingRows.forEach(r => existingKeySet.add(makeKey(r)))

let duplicatesRemoved = 0
const filteredNew = []
for (const r of cleanedRows){
  const k = makeKey(r)
  if (existingKeySet.has(k)) { duplicatesRemoved++; continue }
  existingKeySet.add(k)
  filteredNew.push(r)
}

const finalRows = existingRows.concat(filteredNew)

// backup existing dest
if (dryRun){
  console.log('Dry-run summary:')
  console.log(' Existing rows in dest:', existingRows.length)
  console.log(' Parsed incoming rows:', cleanedRows.length)
  console.log(' Unique new rows to add:', finalRows.length - existingRows.length)
  console.log(' Duplicates detected and skipped:', duplicatesRemoved)
  if (malformed.length) console.warn('Malformed rows detected:', malformed.length)
  process.exit(0)
}

if (fs.existsSync(dest)) {
  const bak = dest + '.' + timestamp + '.bak'
  fs.copyFileSync(dest, bak)
  console.log('Backed up existing', dest, '->', bak)
}

// write final CSV atomically: write to temp file then rename
try {
  const out = Papa.unparse(finalRows, { columns: finalFields })
  const tmpDest = dest + '.tmp'
  fs.writeFileSync(tmpDest, out, 'utf8')
  // backup existing dest (already performed earlier)
  fs.renameSync(tmpDest, dest)
  console.log('Wrote cleaned CSV to', dest)
  console.log('Existing rows:', existingRows.length, 'New added:', finalRows.length - existingRows.length)
} catch (e){
  console.error('Failed to write cleaned CSV atomically:', e && e.message)
  try {
    if (fs.existsSync(dest)) fs.unlinkSync(dest + '.tmp')
  } catch (e2) { /* ignore */ }
}

if (malformed.length) process.exitCode = 3
