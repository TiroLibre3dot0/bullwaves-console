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
let existingKeys = new Set(existingRows.map(r => (r[keyField]||'').toString().trim()))

const toAdd = []
const duplicates = []
cleanedRows.forEach(r => {
  const k = (r[keyField]||'').toString().trim()
  if (!k) {
    // no key — treat as new row
    toAdd.push(r)
  } else if (existingKeys.has(k)) {
    duplicates.push(r)
  } else {
    toAdd.push(r)
    existingKeys.add(k)
  }
})

if (duplicates.length) {
  const dupPath = path.join(rawDir, `registrations_duplicates.${timestamp}.csv`)
  try {
    fs.writeFileSync(dupPath, Papa.unparse(duplicates, { columns: uniqueFields }), 'utf8')
    console.log('Wrote duplicates to', dupPath)
  } catch (e){ console.warn('Failed to write duplicates file:', e && e.message) }
}

// final rows: existing + toAdd
const finalFields = existingFields && existingFields.length ? existingFields : uniqueFields
const finalRows = existingRows.concat(toAdd)

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
  console.log('Existing rows:', existingRows.length, 'New added:', toAdd.length, 'Duplicates skipped:', duplicates.length)
} catch (e){
  console.error('Failed to write cleaned CSV:', e && e.message)
}

if (malformed.length) process.exitCode = 3
