/*
Robust Payments CSV importer

Goals:
- Accept raw CSV files as-is (user copy/paste or downloads) without requiring manual edits.
- Always keep the original raw file (saved under `public/raw/` with timestamp).
- Attempt multiple parsing strategies with fallbacks (direct parse, quote-balanced rejoin) and produce a cleaned, standardized CSV used by the app at `public/Payments Report.csv`.
- Report parsing diagnostics (detected headers, rows parsed, malformed rows) and exit non-zero if there are unrecoverable issues.

Usage:
  node scripts/sanitize_payments.js <sourceCsvPath>
Defaults to: ./tmp_paste.csv
*/

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

const src = process.argv[2] || 'tmp_paste.csv'
const dest = path.join('public', 'Payments Report.csv')
const rawDir = path.join('public', 'raw')

if (!fs.existsSync(src)) {
  console.error('Source file not found:', src)
  process.exit(1)
}

if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true })

let txt = fs.readFileSync(src, 'utf8')
if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1)

const timestamp = Date.now()
const rawBackup = path.join(rawDir, `payments_raw.${timestamp}.csv`)
fs.writeFileSync(rawBackup, txt, 'utf8')
console.log('Saved raw backup to', rawBackup)

const normalizedHeader = h => String(h||'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')

function tryParse(text, opts = {}){
  const parsed = Papa.parse(text, Object.assign({ header: true, skipEmptyLines: true, quoteChar: '"', transformHeader: normalizedHeader }, opts))
  return parsed
}

function preprocessRaw(text){
  // line-wise safe cleanup: remove trailing semicolons and normalize certain doubled-quote artefacts
  const lines = text.split(/\r?\n/)
  const out = lines.map(l => {
    if (!l) return l
    // remove trailing semicolons that some exports append
    l = l.replace(/;{1,}\s*$/g, '')
    // if the entire line is wrapped in a single pair of quotes and contains repeated double-quotes
    // like: "...""id""..."  -> unwrap and replace double-double-quotes -> single quotes
    if (/^".*"$/.test(l) && l.indexOf('""') !== -1){
      // unwrap
      l = l.slice(1, -1)
      // replace double double-quotes with single double-quote
      l = l.replace(/""/g, '"')
    }
    return l
  })
  return out.join('\n')
}

function detectDelimiter(sample){
  // count commas vs semicolons in the header/sample
  const commaCount = (sample.match(/,/g)||[]).length
  const semiCount = (sample.match(/;/g)||[]).length
  return semiCount > commaCount ? ';' : ','
}

function parseNumString(s) {
  if (s === null || s === undefined) return 0
  let v = String(s).trim()
  if (v === '') return 0
  v = v.replace(/[€$£\s]/g, '')
  const lastDot = v.lastIndexOf('.')
  const lastComma = v.lastIndexOf(',')
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) v = v.replace(/\./g, '').replace(/,/g, '.')
    else v = v.replace(/,/g, '')
  } else if (v.indexOf(',') > -1 && v.indexOf('.') === -1) {
    v = v.replace(/\./g, '').replace(/,/g, '.')
  } else {
    v = v.replace(/,/g, '')
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function balanceQuotesRejoin(text){
  const lines = text.split(/\r?\n/)
  const out = []
  let buf = ''
  for (let i=0;i<lines.length;i++){
    const line = lines[i]
    if (buf.length) buf += '\n' + line; else buf = line
    const q = (buf.match(/\"/g)||[]).length
    if (q % 2 === 0) { out.push(buf); buf = '' }
    else { /* keep accumulating */ }
  }
  if (buf.length) out.push(buf)
  return out.join('\n')
}

// Preprocess raw and auto-detect delimiter
const pre = preprocessRaw(txt)
const sampleHeader = pre.split(/\r?\n/)[0] || ''
const detectedDelimiter = detectDelimiter(sampleHeader)
console.log('Auto-detected delimiter:', JSON.stringify(detectedDelimiter))

// 1) Direct parse with detected delimiter
let parsed = tryParse(pre, { delimiter: detectedDelimiter })
let fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : null
let malformed = []
if (!fields) {
  console.warn('Header parse failed on direct parse; attempting quote-balanced rejoin')
  const joined = balanceQuotesRejoin(pre)
  parsed = tryParse(joined, { delimiter: detectedDelimiter })
  fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : null
}

if (!fields) {
  console.error('Unable to detect header fields after fallback parsing. Aborting.')
  process.exit(2)
}

console.log('Detected fields:', fields.join(', '))

// ensure headers are unique (PapaParse may rename duplicates but be defensive)
const uniqueFields = []
const seen = {}
fields.forEach((f, i) => {
  let name = f || `col_${i}`
  if (seen[name]){
    let k = 1
    while(seen[`${name}_${k}`]) k++
    name = `${name}_${k}`
  }
  seen[name] = true
  uniqueFields.push(name)
})

const paymentKey = uniqueFields.find(f => f.includes('payment') && f.includes('amount')) || uniqueFields.find(f => f.includes('amount'))
if (!paymentKey) console.warn('Warning: no obvious payment amount field detected')

// If parsed.data contains objects with missing keys (malformed), attempt rejoin fallback
function inspectRows(parsedData, expectedFields){
  const malformedLocal = []
  parsedData.forEach((r, idx) => {
    const keys = Object.keys(r)
    if (keys.length !== expectedFields.length) malformedLocal.push({ idx: idx+1, keysLength: keys.length })
  })
  return malformedLocal
}

malformed = inspectRows(parsed.data, uniqueFields)
if (malformed.length){
  console.warn('Malformed rows detected in initial parse:', malformed.length, malformed.slice(0,5))
  // attempt the quote-rejoin approach and reparse
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
  malformed = inspectRows(parsed.data, uniqueFields)
}

  // final fallback: try parsing without header and building header from first row
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

// map parsed rows to uniqueFields (in case keys were renamed by parser)
const cleanedRows = []
parsed.data.forEach((r, idx) => {
  const obj = {}
  // if parser returned fields matching uniqueFields use those, else map by position
  uniqueFields.forEach((f, i) => {
    // prefer existing key
    if (Object.prototype.hasOwnProperty.call(r, f)) obj[f] = r[f]
    else {
      // fallback: try the original fields order
      const origKey = parsed.meta && parsed.meta.fields && parsed.meta.fields[i]
      obj[f] = origKey && Object.prototype.hasOwnProperty.call(r, origKey) ? r[origKey] : r[f]
    }
  })
  if (paymentKey && Object.prototype.hasOwnProperty.call(obj, paymentKey)){
    obj[paymentKey] = parseNumString(obj[paymentKey])
  }
  cleanedRows.push(obj)
})

console.log('Rows parsed:', cleanedRows.length)
if (malformed.length) console.warn('Malformed rows (field count mismatch):', malformed.length, malformed.slice(0,5))

// backup existing dest
if (fs.existsSync(dest)) {
  const bak = dest + '.' + timestamp + '.bak'
  fs.copyFileSync(dest, bak)
  console.log('Backed up existing', dest, '->', bak)
}

// write cleaned CSV
const out = Papa.unparse(cleanedRows, { columns: uniqueFields })
fs.writeFileSync(dest, out, 'utf8')
console.log('Wrote cleaned CSV to', dest)

// exit with code indicating presence of malformed rows
if (malformed.length) process.exitCode = 3
