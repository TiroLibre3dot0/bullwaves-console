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

function resolveUploadType(req, uploadedName) {
  const forcedTypeRaw = (req.body && req.body.type) ? String(req.body.type).trim().toLowerCase() : ''
  const forcedType = (forcedTypeRaw === 'registrations' || forcedTypeRaw === 'payments' || forcedTypeRaw === 'media') ? forcedTypeRaw : ''
  const isRegistrations = forcedType ? forcedType === 'registrations' : /registration/i.test(uploadedName)
  const isMedia = forcedType ? forcedType === 'media' : /media/i.test(uploadedName)
  return {
    type: forcedType || (isRegistrations ? 'registrations' : (isMedia ? 'media' : 'payments')),
    isRegistrations,
    isMedia,
  }
}

function writeNdjson(res, obj) {
  try {
    res.write(JSON.stringify(obj) + '\n')
  } catch (e) {
    // ignore
  }
}

function inferDestByType(type) {
  if (type === 'registrations') return path.join('public', 'Registrations Report.csv')
  if (type === 'media') return path.join('public', 'Media Report.csv')
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

  const { type, isRegistrations, isMedia } = resolveUploadType(req, uploadedName)

  const rawPrefix = isRegistrations ? 'registrations_raw' : (isMedia ? 'media_raw' : 'payments_raw')
  const rawBackup = path.join(rawDir, `${rawPrefix}.${timestamp}.csv`)
  fs.copyFileSync(uploadedPath, rawBackup)

  // choose sanitizer
  const sanitizer = isRegistrations ? 'sanitize_registrations.js' : (isMedia ? 'sanitize_media.js' : 'sanitize_payments.js')
  const cmd = `node "${path.join(__dirname, sanitizer)}" "${uploadedPath}"`
  exec(cmd, { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
    const out = stdout || ''
    const errOut = stderr || ''
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
    res.json({ ok: true, type, rawBackup, sanitizer, stdout: out, stderr: errOut })
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

  const { type, isRegistrations, isMedia } = resolveUploadType(req, uploadedName)
  const rawPrefix = isRegistrations ? 'registrations_raw' : (isMedia ? 'media_raw' : 'payments_raw')
  const rawBackup = path.join(rawDir, `${rawPrefix}.${timestamp}.csv`)
  const dest = inferDestByType(type)

  writeNdjson(res, { type: 'progress', pct: 5, stage: 'received', message: 'Received file. Preparing…' })

  try {
    fs.copyFileSync(uploadedPath, rawBackup)
  } catch (e) {
    writeNdjson(res, { type: 'error', message: 'Failed to copy raw backup', details: e && e.message })
    return res.end()
  }

  writeNdjson(res, { type: 'progress', pct: 10, stage: 'raw_backup', message: 'Raw backup saved. Starting sanitizer…' })

  const sanitizer = isRegistrations ? 'sanitize_registrations.js' : (isMedia ? 'sanitize_media.js' : 'sanitize_payments.js')
  const child = spawn('node', [path.join(__dirname, sanitizer), uploadedPath], {
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
    if (code && code !== 0) {
      writeNdjson(res, { type: 'error', message: 'sanitizer_failed', code, stdout, stderr })
      return res.end()
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
        summary,
        stdout,
        stderr,
      },
    })
    res.end()
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
