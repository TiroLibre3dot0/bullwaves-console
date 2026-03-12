/*
Comments report sanitizer.

Goal:
- Read uploaded CSV (often converted from XLSX by upload-server)
- Keep ONLY rows whose `comment` field contains the word "moved" (case-insensitive)
- From each matching comment extract:
  - bullwaves_id
  - from_affiliate_id
  - to_affiliate_id
- Write cleaned CSV to `public/comments.csv`
- Save raw backup under `artifacts/raw/`

Usage:
  node scripts/sanitize_comments.js <sourceCsvPath>
*/
const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')
const { replaceFileSync } = require('./replaceFileSync')

const projectRoot = path.join(__dirname, '..')
const srcArg = process.argv[2] || 'tmp_comments.csv'
const src = path.isAbsolute(srcArg) ? srcArg : path.join(projectRoot, srcArg)
const dest = path.join(projectRoot, 'public', 'comments.csv')
const destLegacy = path.join(projectRoot, 'public', 'Comments Report.csv')
const rawDir = path.join(projectRoot, 'artifacts', 'raw')

const VERBOSE = process.env.SANITIZER_VERBOSE === '1'
const debug = (...args) => { if (VERBOSE) console.log(...args) }

if (!fs.existsSync(src)) {
  console.error('Source file not found:', src)
  process.exit(1)
}
if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true })

let txt = fs.readFileSync(src, 'utf8')
if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1)

const timestamp = Date.now()
const rawBackup = path.join(rawDir, `comments_raw.${timestamp}.csv`)
fs.writeFileSync(rawBackup, txt, 'utf8')
console.log('Saved raw backup to', rawBackup)

const normalizedHeader = (h) => String(h || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(/[^a-z0-9_]/g, '')

function tryParse(text, opts = {}) {
  return Papa.parse(text, Object.assign({
    header: true,
    skipEmptyLines: true,
    quoteChar: '"',
    transformHeader: normalizedHeader,
  }, opts))
}

function preprocessRaw(text) {
  const lines = text.split(/\r?\n/)
  return lines.map(l => {
    if (!l) return l
    l = l.replace(/;{1,}\s*$/g, '')
    if (/^".*"$/.test(l) && l.indexOf('""') !== -1) {
      l = l.slice(1, -1).replace(/""/g, '"')
    }
    return l
  }).join('\n')
}

function stripLeadingNonDataLines(text) {
  const lines = String(text || '').split(/\r?\n/)
  // Some exports include a title line like:
  // "01/01/2000 to 01/11/2026 comments report,,,,"
  // followed by the real header row.
  // We find the first plausible header row containing a Comment column.
  const idx = lines.findIndex((l) => {
    const s = String(l || '').trim().toLowerCase()
    if (!s) return false
    // Require 'comment' and at least one other typical column name to reduce false matches.
    return s.includes('comment') && (s.includes('created') || s.includes('admin') || s.includes('affiliate'))
  })
  if (idx > 0) return lines.slice(idx).join('\n')
  return text
}

function detectDelimiter(sample) {
  const commaCount = (sample.match(/,/g) || []).length
  const semiCount = (sample.match(/;/g) || []).length
  return semiCount > commaCount ? ';' : ','
}

function balanceQuotesRejoin(text) {
  const lines = text.split(/\r?\n/)
  const out = []
  let buf = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (buf.length) buf += '\n' + line
    else buf = line
    const q = (buf.match(/\"/g) || []).length
    if (q % 2 === 0) {
      out.push(buf)
      buf = ''
    }
  }
  if (buf.length) out.push(buf)
  return out.join('\n')
}

function hasHardParseErrors(parsed) {
  const errs = parsed && Array.isArray(parsed.errors) ? parsed.errors : []
  return errs.some(e => e && (
    e.type === 'Quotes'
    || e.code === 'InvalidQuotes'
    || e.code === 'TooManyFields'
  ))
}

function inspectOverflowRows(parsedData) {
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

function lenientQuotedLineParse(text, { delimiter }) {
  const lines = String(text || '').split(/\r?\n/).filter(l => String(l || '').trim() !== '')
  if (!lines.length) return { data: [], meta: { fields: [] }, errors: [] }

  const sep = `"${delimiter}"`
  const stripOuterQuotes = (line) => {
    let s = String(line || '')
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1)
    s = s.replace(/\r$/, '')
    if (s.startsWith('"')) s = s.slice(1)
    if (s.endsWith('"')) s = s.slice(0, -1)
    return s
  }

  const headerRaw = stripOuterQuotes(lines[0])
  const headerFields = headerRaw.split(sep).map(normalizedHeader)
  const expectedLen = headerFields.length

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const raw = stripOuterQuotes(lines[i])
    let parts = raw.split(sep)

    if (parts.length > expectedLen && expectedLen >= 1) {
      const lastIdx = expectedLen - 1
      const merged = parts.slice(lastIdx).join(delimiter)
      parts = parts.slice(0, lastIdx).concat([merged])
    }
    if (parts.length < expectedLen) {
      while (parts.length < expectedLen) parts.push('')
    }

    const obj = {}
    for (let c = 0; c < expectedLen; c++) obj[headerFields[c] || `col_${c}`] = parts[c]
    rows.push(obj)
  }

  return { data: rows, meta: { fields: headerFields }, errors: [] }
}

function extractMove(commentRaw) {
  const comment = String(commentRaw || '')
  const lower = comment.toLowerCase()
  if (!lower.includes('moved')) return null

  let bullwavesId = ''
  let bullwavesUser = ''
  let fromAffiliateId = ''
  let toAffiliateId = ''

  // Bullwaves ID formats seen:
  // - User bullwaves-851993 was moved...
  // - used bullwaves id 308186
  // - Bullwaves ID: 308186
  let m = comment.match(/\bbullwaves\s*[-_]?\s*(\d{3,})\b/i)
  if (m) {
    bullwavesId = m[1]
    bullwavesUser = `bullwaves-${m[1]}`
  }
  if (!bullwavesId) {
    m = comment.match(/\bbullwaves\s*id\s*[:#-]?\s*(\d{3,})\b/i)
    if (m) {
      bullwavesId = m[1]
      bullwavesUser = `bullwaves-${m[1]}`
    }
  }
  if (!bullwavesId) {
    m = comment.match(/\bused\s+bullwaves\s*id\s*[:#-]?\s*(\d{3,})\b/i)
    if (m) {
      bullwavesId = m[1]
      bullwavesUser = `bullwaves-${m[1]}`
    }
  }

  // Affiliate movement patterns (robust across EN/IT)
  // Examples:
  // - moved da Affiliate Id 123 a Affiliate ID 456
  // - moved from Affiliate Id 123 to Affiliated ID 456
  // - moved from affiliate 2287 to affiliate 35272
  // - moved from 123 to 456
  m = comment.match(/\bmoved\s+(?:from|da)\s+(?:affiliate\s*id|affiliate|affiliated\s*id)?\s*[:#-]?\s*(\d{1,})\s+(?:to|a)\s+(?:affiliate\s*id|affiliate|affiliated\s*id)?\s*[:#-]?\s*(\d{1,})\b/i)
  if (!m) m = comment.match(/\bmoved\s+from\s+(\d{1,})\s+to\s+(\d{1,})\b/i)
  if (m) {
    fromAffiliateId = m[1]
    toAffiliateId = m[2]
  }

  return {
    bullwaves_user: bullwavesUser,
    bullwaves_id: bullwavesId,
    from_affiliate_id: fromAffiliateId,
    to_affiliate_id: toAffiliateId,
  }
}

const pre = stripLeadingNonDataLines(preprocessRaw(txt))
const sampleHeader = pre.split(/\r?\n/)[0] || ''
const detectedDelimiter = detectDelimiter(sampleHeader)
console.log('Auto-detected delimiter:', JSON.stringify(detectedDelimiter))

let parsed = tryParse(pre, { delimiter: detectedDelimiter })
let fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : null
let overflow = inspectOverflowRows(parsed.data)

if (!fields) {
  const joined = balanceQuotesRejoin(pre)
  parsed = tryParse(joined, { delimiter: detectedDelimiter })
  fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : null
  overflow = inspectOverflowRows(parsed.data)
}

if (!fields || hasHardParseErrors(parsed) || overflow.length) {
  debug('Debug: attempting lenient parser fallback for comments')
  console.log('Info: CSV had quoting/field-count issues; using lenient parser')
  parsed = lenientQuotedLineParse(pre, { delimiter: detectedDelimiter })
  fields = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : null
  overflow = inspectOverflowRows(parsed.data)
}

if (!fields) {
  console.error('Unable to detect header fields after fallback parsing. Aborting.')
  process.exit(2)
}

if (overflow.length) {
  console.warn('Malformed rows (__parsed_extra / overflow cols):', overflow.length, overflow.slice(0, 5))
}

if (VERBOSE) console.log('Detected fields:', fields.join(', '))
else console.log(`Detected fields: ${fields.length} (set SANITIZER_VERBOSE=1 to print names)`)

// Find the comment field
const commentField = fields.find(f => f === 'comment' || String(f).includes('comment'))
if (!commentField) {
  console.error('Missing expected comment column. Detected fields:', fields.join(', '))
  process.exit(3)
}

// Build output fields
const baseFields = ['bullwaves_user', 'bullwaves_id', 'from_affiliate_id', 'to_affiliate_id', 'comment']
const extraFields = []
for (const f of fields) {
  if (!f) continue
  if (f === commentField) continue // we will output `comment` normalized
  if (baseFields.includes(f)) continue
  extraFields.push(f)
}

const outputFields = baseFields.concat(extraFields)

const rowsIn = parsed.data || []
const extractedRows = []
for (const r of rowsIn) {
  const commentValue = r ? r[commentField] : ''
  const move = extractMove(commentValue)
  if (!move) continue
  const out = {}
  out.bullwaves_user = move.bullwaves_user
  out.bullwaves_id = move.bullwaves_id
  out.from_affiliate_id = move.from_affiliate_id
  out.to_affiliate_id = move.to_affiliate_id
  out.comment = String(commentValue || '')

  for (const f of extraFields) {
    out[f] = r && Object.prototype.hasOwnProperty.call(r, f) ? r[f] : ''
  }

  extractedRows.push(out)
}

console.log('Rows matched (comment contains "moved"):', extractedRows.length)

// Deduplicate against existing dest
let existingRows = []
if (fs.existsSync(dest)) {
  try {
    const exTxt = fs.readFileSync(dest, 'utf8')
    const exParsed = Papa.parse(exTxt, {
      header: true,
      skipEmptyLines: true,
      quoteChar: '"',
      transformHeader: normalizedHeader,
    })
    existingRows = exParsed.data || []
  } catch (e) {
      console.log('Info: failed to parse existing dest for dedupe; skipping dedupe:', e && e.message)
    existingRows = []
  }
}

const norm = (v) => String(v ?? '').trim()
const pickDate = (row) => {
  // best-effort: keep stable keys if the file contains timestamps
  const keys = ['created_on', 'external_date', 'date', 'created_at', 'created', 'timestamp']
  for (const k of keys) {
    const val = row && row[k]
    if (val) return norm(val)
  }
  return ''
}

const keyOf = (row) => {
  return [
    norm(row.bullwaves_id),
    norm(row.from_affiliate_id),
    norm(row.to_affiliate_id),
    pickDate(row),
    norm(row.comment),
  ].join('|')
}

const seen = new Set(existingRows.map(keyOf))
let added = 0
let duplicates = 0

for (const row of extractedRows) {
  const k = keyOf(row)
  if (seen.has(k)) {
    duplicates++
    continue
  }
  seen.add(k)
  existingRows.push(row)
  added++
}

const csvOut = Papa.unparse(existingRows, { columns: outputFields })
try {
  const tmpDest = dest + '.tmp'
  fs.writeFileSync(tmpDest, csvOut, 'utf8')
  replaceFileSync(tmpDest, dest)
} catch (e) {
  console.error('Failed to write cleaned CSV:', e && e.message)
  try {
    const tmpDest = dest + '.tmp'
    if (fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest)
  } catch (e2) { /* ignore */ }
  process.exitCode = 4
}
console.log('Wrote cleaned CSV to', dest)
try {
  const tmpLegacy = destLegacy + '.tmp'
  fs.writeFileSync(tmpLegacy, csvOut, 'utf8')
  replaceFileSync(tmpLegacy, destLegacy)
  console.log('Wrote cleaned CSV to', destLegacy)
} catch (e) {
  console.log('Info: failed to write legacy comments report:', e && e.message)
  try {
    const tmpLegacy = destLegacy + '.tmp'
    if (fs.existsSync(tmpLegacy)) fs.unlinkSync(tmpLegacy)
  } catch (e2) { /* ignore */ }
}
console.log(`Existing rows: ${existingRows.length - added} New added: ${added} Unchanged duplicates skipped: ${duplicates} Affiliate updates: 0 Total field updates: 0`)
