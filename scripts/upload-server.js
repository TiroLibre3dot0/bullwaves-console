const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { exec, spawn } = require('child_process')

const app = express()
const port = process.env.UPLOAD_PORT || 4000

const uploadDir = path.join(__dirname, '..', 'uploads')
const rawDir = path.join(__dirname, '..', 'public', 'raw')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})
const upload = multer({ storage })

app.use(express.static(path.join(__dirname, '..', 'public')))

function safeBaseName(name) {
  const base = path.basename(String(name || 'upload'))
  return base.replace(/[^a-z0-9._-]+/gi, '_')
}

function isExcelExt(ext) {
  const e = String(ext || '').toLowerCase()
  return e === '.xlsx' || e === '.xls'
}

function pickFirstNonEmptySheet(workbook) {
  const names = (workbook && workbook.SheetNames) ? workbook.SheetNames : []
  for (const name of names) {
    const ws = workbook.Sheets && workbook.Sheets[name]
    if (!ws) continue
    try {
      const rows = require('xlsx').utils.sheet_to_json(ws, { header: 1, blankrows: false })
      if (rows && rows.length >= 1) return { name, ws }
    } catch (e) {
      // ignore and try next
    }
  }
  const first = names[0]
  return first ? { name: first, ws: workbook.Sheets[first] } : null
}

function ensureCsvForSanitizer({ uploadedPath, uploadedName }) {
  const ext = path.extname(String(uploadedName || '')).toLowerCase()
  if (!isExcelExt(ext)) {
    return { inputPath: uploadedPath, converted: false, rawExt: ext || '.csv', cleanup: null }
  }

  let XLSX
  try {
    XLSX = require('xlsx')
  } catch (e) {
    const err = new Error('Missing dependency: xlsx. Run `npm i` in Bullwaves_new.')
    err.code = 'missing_xlsx'
    throw err
  }

  const buf = fs.readFileSync(uploadedPath)
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true })
  const picked = pickFirstNonEmptySheet(wb)
  if (!picked || !picked.ws) {
    const err = new Error('No readable worksheet found in Excel file')
    err.code = 'xlsx_no_sheet'
    throw err
  }

  const csv = XLSX.utils.sheet_to_csv(picked.ws, { blankrows: false })
  const convertedName = `${Date.now()}-converted-${safeBaseName(uploadedName).replace(/\.(xlsx|xls)$/i, '')}.csv`
  const convertedPath = path.join(uploadDir, convertedName)
  fs.writeFileSync(convertedPath, csv, 'utf8')

  return {
    inputPath: convertedPath,
    converted: true,
    convertedFrom: ext,
    sheetName: picked.name,
    rawExt: ext,
    cleanup: () => {
      try { fs.unlinkSync(convertedPath) } catch (e) { /* ignore */ }
    },
  }
}

function resolveUploadType(req, uploadedName) {
  const forcedTypeRaw = (req.body && req.body.type) ? String(req.body.type).trim().toLowerCase() : ''
  const forcedType = (forcedTypeRaw === 'registrations' || forcedTypeRaw === 'payments' || forcedTypeRaw === 'media' || forcedTypeRaw === 'comments') ? forcedTypeRaw : ''

  const name = String(uploadedName || '')
  const inferred = forcedType
    || (/registration/i.test(name) ? 'registrations' : (/comment/i.test(name) ? 'comments' : (/media/i.test(name) ? 'media' : 'payments')))

  return {
    type: inferred,
    isRegistrations: inferred === 'registrations',
    isComments: inferred === 'comments',
    isMedia: inferred === 'media',
  }
}

function writeNdjson(res, obj) {
  try {
    res.write(JSON.stringify(obj) + '\n')
  } catch (e) {
    // ignore
  }
}

function runNodeScript(scriptFile, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptFile], {
      cwd: cwd || process.cwd(),
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d.toString('utf8')))
    child.stderr.on('data', (d) => (stderr += d.toString('utf8')))

    child.on('close', (code) => {
      if (code && code !== 0) {
        const err = new Error(`Script failed: ${scriptFile} (code=${code})`)
        err.code = code
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
        return
      }
      resolve({ script: path.basename(scriptFile), stdout, stderr })
    })
  })
}

async function runPostUploadGenerators(type, emit) {
  const cwd = path.join(__dirname, '..')
  const scripts = [
    path.join(__dirname, 'generate_reports_meta.js'),
    path.join(__dirname, 'generate_affiliate_index.js'),
    path.join(__dirname, 'generate_support_users_index.js'),
    path.join(__dirname, 'generate_fraud_patterns_index.js'),
    path.join(__dirname, 'generate_affiliate_kpi_index.js'),
  ]

  // Fraud Monitoring dashboard also relies on these precomputed artifacts.
  // Regenerate them when the underlying source reports change.
  if (type === 'registrations' || type === 'media') {
    scripts.push(path.join(__dirname, 'fraud_monitor.js'))
  }

  const results = []
  for (let i = 0; i < scripts.length; i += 1) {
    const scriptFile = scripts[i]
    if (emit) emit(92 + i * 3, 'post_processing', `Generating ${path.basename(scriptFile)}…`)
    // eslint-disable-next-line no-await-in-loop
    const r = await runNodeScript(scriptFile, { cwd })
    results.push({
      script: r.script,
      stdoutPreview: String(r.stdout || '').split(/\r?\n/).slice(0, 6).join('\n'),
      stderrPreview: String(r.stderr || '').split(/\r?\n/).slice(0, 6).join('\n'),
    })
  }

  return {
    ok: true,
    scripts: results.map((r) => r.script),
    results,
  }
}

function inferDestByType(type) {
  if (type === 'registrations') return path.join('public', 'Registrations Report.csv')
  if (type === 'media') return path.join('public', 'Media Report.csv')
  if (type === 'comments') return path.join('public', 'comments.csv')
  return path.join('public', 'Payments Report.csv')
}

function tryParseSummaryLine(line, current) {
  const s = String(line || '').trim()
  if (!s) return current
  const next = current || {}

  // Registrations sanitizer summary
  // Example:
  // Existing rows: 123 New added: 45 Unchanged duplicates skipped: 6 Affiliate updates: 2 Total field updates: 10
  let m = s.match(/Existing rows:\s*(\d+)\s+New added:\s*(\d+)\s+Unchanged duplicates skipped:\s*(\d+)\s+Affiliate updates:\s*(\d+)\s+Total field updates:\s*(\d+)/i)
  if (m) {
    next.existing = Number(m[1])
    next.added = Number(m[2])
    next.duplicates = Number(m[3])
    next.affiliateUpdates = Number(m[4])
    next.fieldUpdates = Number(m[5])
    return next
  }

  // Media sanitizer summary (upsert)
  // Example:
  // Existing rows: 123 New added: 45 Updated: 67
  m = s.match(/Existing rows:\s*(\d+)\s+New added:\s*(\d+)\s+Updated:\s*(\d+)/i)
  if (m) {
    next.existing = Number(m[1])
    next.added = Number(m[2])
    next.updated = Number(m[3])
    return next
  }

  // Payments sanitizer summary
  // Example:
  // Wrote merged CSV to public\Payments Report.csv (existing=1, added=2, duplicates=3)
  m = s.match(/\(existing=(\d+),\s*added=(\d+),\s*duplicates=(\d+)\)/i)
  if (m) {
    next.existing = Number(m[1])
    next.added = Number(m[2])
    next.duplicates = Number(m[3])
    return next
  }

  return current
}

function handleUpload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  const uploadedPath = req.file.path
  const uploadedName = req.file.originalname || ''
  const timestamp = Date.now()

  const { type } = resolveUploadType(req, uploadedName)

  let normalized
  try {
    normalized = ensureCsvForSanitizer({ uploadedPath, uploadedName })
  } catch (e) {
    return res.status(500).json({
      error: 'xlsx_convert_failed',
      code: e && e.code,
      message: e && e.message,
    })
  }

  const rawPrefix = type === 'registrations'
    ? 'registrations_raw'
    : (type === 'media' ? 'media_raw' : (type === 'comments' ? 'comments_raw' : 'payments_raw'))
  const rawBackup = path.join(rawDir, `${rawPrefix}.${timestamp}${normalized.rawExt || '.csv'}`)
  fs.copyFileSync(uploadedPath, rawBackup)

  // choose sanitizer
  const sanitizer = type === 'registrations'
    ? 'sanitize_registrations.js'
    : (type === 'media' ? 'sanitize_media.js' : (type === 'comments' ? 'sanitize_comments.js' : 'sanitize_payments.js'))
  const cmd = `node "${path.join(__dirname, sanitizer)}" "${normalized.inputPath}"`
  exec(cmd, { cwd: path.join(__dirname, '..') }, async (err, stdout, stderr) => {
    const out = stdout || ''
    const errOut = stderr || ''
    if (normalized && normalized.cleanup) normalized.cleanup()
    if (err && err.code !== 0) {
      console.error('Upload processing failed for', req.file.originalname, 'sanitizer=', sanitizer, 'code=', err.code)
      console.error('stdout:', out)
      console.error('stderr:', errOut)
      return res.status(500).json({ error: 'sanitizer_failed', code: err.code, stdout: out, stderr: errOut })
    }
    // Log a concise terminal confirmation for the user
    console.log('--- Upload processed ---')
    console.log('file:', req.file.originalname)
    console.log('type:', type)
    console.log('saved_raw:', rawBackup)
    console.log('sanitizer:', sanitizer)
    // include a trimmed stdout preview (first 10 lines) to avoid huge output
    const outLines = out.split(/\r?\n/).filter(Boolean)
    const preview = outLines.slice(0, 10).join('\n')
    console.log('sanitizer stdout preview:\n' + preview)
    if (outLines.length > 10) console.log('... (output truncated, full output returned in response)')
    if (errOut) console.warn('sanitizer stderr:\n', errOut)
    let postProcessing = null
    try {
      postProcessing = await runPostUploadGenerators(type)
    } catch (e) {
      postProcessing = {
        ok: false,
        error: e && e.message,
        code: e && e.code,
      }
    }

    res.json({
      ok: true,
      type,
      rawBackup,
      sanitizer,
      postProcessing,
      normalized: normalized && normalized.converted ? {
        converted: true,
        from: normalized.convertedFrom,
        sheetName: normalized.sheetName,
      } : { converted: false },
      stdout: out,
      stderr: errOut,
    })
  })
}

function handleUploadStream(req, res) {
  if (!req.file) return res.status(400).json({ error: 'no file' })

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.flushHeaders && res.flushHeaders()

  const uploadedPath = req.file.path
  const uploadedName = req.file.originalname || ''
  const timestamp = Date.now()

  const { type } = resolveUploadType(req, uploadedName)
  const rawPrefix = type === 'registrations'
    ? 'registrations_raw'
    : (type === 'media' ? 'media_raw' : (type === 'comments' ? 'comments_raw' : 'payments_raw'))
  let normalized
  const dest = inferDestByType(type)

  writeNdjson(res, { type: 'progress', pct: 5, stage: 'received', message: 'Received file. Preparing…' })

  try {
    normalized = ensureCsvForSanitizer({ uploadedPath, uploadedName })
    if (normalized && normalized.converted) {
      writeNdjson(res, {
        type: 'progress',
        pct: 8,
        stage: 'xlsx_convert',
        message: `Converted Excel (${normalized.convertedFrom}) sheet “${normalized.sheetName}” to CSV…`,
      })
    }
  } catch (e) {
    writeNdjson(res, { type: 'error', message: 'xlsx_convert_failed', code: e && e.code, details: e && e.message })
    return res.end()
  }

  const rawBackup = path.join(rawDir, `${rawPrefix}.${timestamp}${(normalized && normalized.rawExt) || '.csv'}`)

  try {
    fs.copyFileSync(uploadedPath, rawBackup)
  } catch (e) {
    writeNdjson(res, { type: 'error', message: 'Failed to copy raw backup', details: e && e.message })
    return res.end()
  }

  writeNdjson(res, { type: 'progress', pct: 10, stage: 'raw_backup', message: 'Raw backup saved. Starting sanitizer…' })

  const sanitizer = type === 'registrations'
    ? 'sanitize_registrations.js'
    : (type === 'media' ? 'sanitize_media.js' : (type === 'comments' ? 'sanitize_comments.js' : 'sanitize_payments.js'))
  const child = spawn('node', [path.join(__dirname, sanitizer), normalized.inputPath], {
    cwd: path.join(__dirname, '..'),
    windowsHide: true,
  })

  writeNdjson(res, { type: 'progress', pct: 15, stage: 'sanitizer_start', message: `Running ${sanitizer}…` })

  let stdout = ''
  let stderr = ''
  let lastStagePct = 15
  let summary = null

  const bump = (pct, stage, message) => {
    const next = Math.max(lastStagePct, pct)
    lastStagePct = next
    writeNdjson(res, { type: 'progress', pct: next, stage, message })
  }

  const handleLine = (line) => {
    const s = String(line || '').trim()
    if (!s) return

    summary = tryParseSummaryLine(s, summary)

    // Map common sanitizer log lines to coarse-grained progress.
    if (/Auto-detected delimiter/i.test(s)) bump(25, 'parse_start', 'Parsing CSV…')
    else if (/Detected fields/i.test(s)) bump(35, 'fields', 'Header detected. Normalizing…')
    else if (/Rows parsed:/i.test(s)) bump(55, 'parsed', 'Rows parsed. Deduplicating/merging…')
    else if (/Wrote duplicates to/i.test(s)) bump(65, 'duplicates', 'Duplicates extracted.')
    else if (/Backed up existing/i.test(s)) bump(75, 'backup_dest', 'Backed up existing report.')
    else if (/Wrote cleaned CSV to|Wrote merged CSV to|Wrote cleaned CSV/i.test(s)) bump(90, 'write_dest', 'Writing updated report…')
  }

  const consume = (buf, onLine) => {
    const text = String(buf || '')
    const lines = text.split(/\r?\n/)
    lines.forEach(onLine)
  }

  child.stdout.on('data', (d) => {
    const chunk = d.toString('utf8')
    stdout += chunk
    consume(chunk, handleLine)
  })

  child.stderr.on('data', (d) => {
    const chunk = d.toString('utf8')
    stderr += chunk
    // stderr often contains warnings; still surface a coarse progress bump so user sees activity
    if (chunk && chunk.trim()) bump(Math.min(85, lastStagePct + 1), 'stderr', 'Sanitizer warnings…')
  })

  child.on('close', (code) => {
    if (normalized && normalized.cleanup) normalized.cleanup()
    if (code && code !== 0) {
      writeNdjson(res, { type: 'error', message: 'sanitizer_failed', code, stdout, stderr })
      return res.end()
    }

    ;(async () => {
      try {
        await runPostUploadGenerators(type, (pct, stage, message) => bump(pct, stage, message))
      } catch (e) {
        // Do not fail the upload if post-processing fails; surface a warning in the stream.
        writeNdjson(res, { type: 'warning', message: 'post_processing_failed', details: e && e.message })
      }

      bump(100, 'done', 'Done.')
    writeNdjson(res, {
      type: 'result',
      data: {
        ok: true,
        type,
        dest,
        rawBackup,
        sanitizer,
        normalized: normalized && normalized.converted ? {
          converted: true,
          from: normalized.convertedFrom,
          sheetName: normalized.sheetName,
        } : { converted: false },
        summary,
        stdout,
        stderr,
      },
    })
    res.end()
    })()
  })
}

app.post('/upload', upload.single('file'), handleUpload)
app.post('/api/upload', upload.single('file'), handleUpload)

// Streaming variant: emits NDJSON progress updates so clients can show server-side processing progress.
app.post('/upload-stream', upload.single('file'), handleUploadStream)
app.post('/api/upload-stream', upload.single('file'), handleUploadStream)

// Avoid the confusing default Express 404 page if a browser ever lands here.
app.get('/upload', (req, res) => {
  res.status(200).send('Upload endpoint. Use POST /upload or POST /upload-stream.')
})

app.get('/health', (req, res) => res.json({ ok: true }))

// Alias for console/dev proxy
app.get('/api/health', (req, res) => res.json({ ok: true }))

app.listen(port, () => console.log(`Upload server listening on http://localhost:${port}`))
