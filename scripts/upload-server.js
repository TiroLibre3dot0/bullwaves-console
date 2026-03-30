const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { exec, spawn } = require('child_process')
const dotenv = require('dotenv')
const { routeConvrs } = require('../serverless/handlers/convrs')

const projectRoot = path.join(__dirname, '..')
;['.env.server.local', '.env.server', '.env.local', '.env'].forEach((name) => {
  const filePath = path.join(projectRoot, name)
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false })
  }
})

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

app.use(express.json({ limit: '1mb' }))
app.use(express.static(path.join(__dirname, '..', 'public')))

function truncateTextTail(text, { maxLines = 80, maxChars = 12000 } = {}) {
  const raw = String(text || '')
  if (!raw) return ''
  const lines = raw.split(/\r?\n/)
  const tail = lines.slice(-maxLines).join('\n')
  if (tail.length <= maxChars) return tail
  return tail.slice(-maxChars)
}

function writeUploadLogFile({ rawDir, type, timestamp, uploadedName, rawBackup, sanitizer, stdout, stderr, exitCode }) {
  const logName = `upload_log.${type}.${timestamp}.txt`
  const logPath = path.join(rawDir, logName)
  const header = [
    `time: ${new Date(timestamp).toISOString()}`,
    `type: ${type}`,
    `file: ${uploadedName || ''}`,
    `rawBackup: ${rawBackup || ''}`,
    `sanitizer: ${sanitizer || ''}`,
    `exitCode: ${exitCode ?? ''}`,
    '',
    '---- STDOUT ----',
    String(stdout || ''),
    '',
    '---- STDERR ----',
    String(stderr || ''),
    '',
  ].join('\n')

  try {
    fs.writeFileSync(logPath, header, 'utf8')
  } catch (e) {
    return { ok: false, error: e && e.message, logPath: null }
  }

  return { ok: true, logPath }
}

function safeBaseName(name) {
  const base = path.basename(String(name || 'upload'))
  return base.replace(/[^a-z0-9._-]+/gi, '_')
}

function isExcelExt(ext) {
  const e = String(ext || '').toLowerCase()
  return e === '.xlsx'
}

function csvEscape(value) {
  const s = String(value ?? '')
  if (!s) return ''
  if (/[\r\n",]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function cellToString(value) {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function rowsToCsv(rows) {
  const list = Array.isArray(rows) ? rows : []
  let maxCol = 0
  for (const r of list) {
    if (Array.isArray(r)) maxCol = Math.max(maxCol, r.length)
  }

  const lines = []
  for (const r of list) {
    if (!Array.isArray(r)) continue
    const cols = []
    for (let c = 0; c < maxCol; c += 1) {
      cols.push(csvEscape(cellToString(r[c])))
    }
    if (cols.every((x) => x === '')) continue
    lines.push(cols.join(','))
  }
  return lines.join('\n')
}

async function ensureCsvForSanitizer({ uploadedPath, uploadedName }) {
  const ext = path.extname(String(uploadedName || '')).toLowerCase()
  if (ext === '.xls') {
    const err = new Error('Unsupported Excel format: .xls. Please upload .xlsx or .csv')
    err.code = 'xls_not_supported'
    throw err
  }
  if (!isExcelExt(ext)) {
    return { inputPath: uploadedPath, converted: false, rawExt: ext || '.csv', cleanup: null }
  }

  let readXlsxFile
  try {
    readXlsxFile = require('read-excel-file/node')
  } catch (e) {
    const err = new Error('Missing dependency: read-excel-file. Run `npm i` in Bullwaves_new.')
    err.code = 'missing_read_excel_file'
    throw err
  }

  const buf = fs.readFileSync(uploadedPath)
  // List sheets first, then read the first non-empty sheet.
  let sheets
  try {
    sheets = await readXlsxFile(buf, { getSheets: true })
  } catch (e) {
    sheets = null
  }

  const sheetList = Array.isArray(sheets) && sheets.length ? sheets : [{ name: 1 }]
  let pickedName = null
  let pickedRows = null
  for (const s of sheetList) {
    const sheetName = (s && s.name) ? s.name : 1
    // eslint-disable-next-line no-await-in-loop
    const rows = await readXlsxFile(buf, { sheet: sheetName })
    if (Array.isArray(rows) && rows.length) {
      pickedName = sheetName
      pickedRows = rows
      break
    }
  }

  if (!pickedRows) {
    const err = new Error('No readable worksheet found in Excel file')
    err.code = 'xlsx_no_sheet'
    throw err
  }

  const csv = rowsToCsv(pickedRows)
  const convertedName = `${Date.now()}-converted-${safeBaseName(uploadedName).replace(/\.(xlsx)$/i, '')}.csv`
  const convertedPath = path.join(uploadDir, convertedName)
  fs.writeFileSync(convertedPath, csv, 'utf8')

  return {
    inputPath: convertedPath,
    converted: true,
    convertedFrom: ext,
    sheetName: String(pickedName || ''),
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

function runNodeScript(scriptFile, { cwd, timeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptFile], {
      cwd: cwd || process.cwd(),
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d.toString('utf8')))
    child.stderr.on('data', (d) => (stderr += d.toString('utf8')))

    const killChild = () => {
      try {
        child.kill()
      } catch {
        /* ignore */
      }

      // Best-effort hard kill on Windows (terminate process tree).
      if (process.platform === 'win32' && child.pid) {
        try {
          spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true })
        } catch {
          /* ignore */
        }
      }
    }

    let settled = false
    let timer = null
    const finish = (err, result) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      if (err) reject(err)
      else resolve(result)
    }

    child.on('error', (e) => {
      const err = new Error(`Failed to start script: ${scriptFile}`)
      err.code = 'spawn_error'
      err.details = e && e.message
      err.stdout = stdout
      err.stderr = stderr
      finish(err)
    })

    timer = timeoutMs
      ? setTimeout(() => {
          killChild()
          const err = new Error(`Script timeout after ${Math.round(timeoutMs / 1000)}s: ${scriptFile}`)
          err.code = 'timeout'
          err.stdout = stdout
          err.stderr = stderr
          finish(err)
        }, timeoutMs)
      : null

    child.on('close', (code) => {
      if (code && code !== 0) {
        const err = new Error(`Script failed: ${scriptFile} (code=${code})`)
        err.code = code
        err.stdout = stdout
        err.stderr = stderr
        finish(err)
        return
      }
      finish(null, { script: path.basename(scriptFile), stdout, stderr })
    })
  })
}

async function runPostUploadGenerators(type, emit) {
  const cwd = path.join(__dirname, '..')
  const scripts = [
    path.join(__dirname, 'generate_reports_meta.js'),
    path.join(__dirname, 'generate_affiliate_index.js'),
    // Investments dashboard relies on this precomputed artifact.
    // It aggregates Media Report.csv into a lightweight CellX affiliate+month table.
    ...(type === 'media' ? [path.join(__dirname, 'generate_cellx_affiliate_month.js')] : []),
    // Rankings rely on Registrations Report.csv; keep them in sync after registrations uploads.
    ...(type === 'registrations' ? [path.join(__dirname, 'generate_rankings_index.js')] : []),
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
    const pct = Math.min(99, 92 + i * 3)
    const scriptName = path.basename(scriptFile)
    if (emit) emit(pct, 'post_processing', `Generating ${scriptName}…`)

    // Long-running scripts (notably fraud_monitor.js) can make the UI look stuck.
    // Send periodic keep-alive progress messages while the script runs.
    const startMs = Date.now()
    let timer = null
    if (emit) {
      timer = setInterval(() => {
        const elapsedS = Math.max(0, Math.round((Date.now() - startMs) / 1000))
        emit(pct, 'post_processing', `Generating ${scriptName}… (${elapsedS}s)`)
      }, 4000)
    }

    let r
    try {
      // eslint-disable-next-line no-await-in-loop
      const timeoutMs = scriptName === 'fraud_monitor.js' ? 20 * 60 * 1000 : 10 * 60 * 1000
      r = await runNodeScript(scriptFile, { cwd, timeoutMs })
    } finally {
      if (timer) clearInterval(timer)
    }
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

function isVerboseRequest(req) {
  try {
    const q = req && req.query ? req.query.verbose : undefined
    const b = req && req.body ? req.body.verbose : undefined
    return String(q || b || '').trim() === '1'
  } catch {
    return false
  }
}

const LOG_PREVIEW_OPTS = { maxLines: 25, maxChars: 5000 }
const LOG_VERBOSE_OPTS = { maxLines: 400, maxChars: 120000 }

async function handleUpload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  const uploadedPath = req.file.path
  const uploadedName = req.file.originalname || ''
  const timestamp = Date.now()

  const verbose = isVerboseRequest(req)

  const { type } = resolveUploadType(req, uploadedName)

  let normalized
  try {
    normalized = await ensureCsvForSanitizer({ uploadedPath, uploadedName })
  } catch (e) {
    const status = (e && e.code === 'xls_not_supported') ? 400 : 500
    return res.status(status).json({
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
  exec(
    cmd,
    {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        ...(verbose ? { SANITIZER_VERBOSE: '1', SANITIZER_WARN_OVERFLOW: '1' } : null),
      },
    },
    async (err, stdout, stderr) => {
    const out = stdout || ''
    const errOut = stderr || ''
    if (normalized && normalized.cleanup) normalized.cleanup()

    const stdoutPreview = truncateTextTail(out, LOG_PREVIEW_OPTS)
    const stderrPreview = truncateTextTail(errOut, LOG_PREVIEW_OPTS)
    if (err && err.code !== 0) {
      console.error('Upload processing failed for', req.file.originalname, 'sanitizer=', sanitizer, 'code=', err.code)
      const logWrite = writeUploadLogFile({
        rawDir,
        type,
        timestamp,
        uploadedName: req.file.originalname,
        rawBackup,
        sanitizer,
        stdout: out,
        stderr: errOut,
        exitCode: err.code,
      })

      // Keep UI response compact, even on failure. Full logs are in logFile.
      return res.status(500).json({
        error: 'sanitizer_failed',
        code: err.code,
        type,
        rawBackup,
        sanitizer,
        logFile: logWrite && logWrite.ok ? logWrite.logPath : null,
        logsTruncated: !verbose,
        stdout: stdoutPreview,
        stderr: stderrPreview,
        ...(verbose
          ? {
              stdoutVerbose: truncateTextTail(out, LOG_VERBOSE_OPTS),
              stderrVerbose: truncateTextTail(errOut, LOG_VERBOSE_OPTS),
            }
          : null),
      })
    }

    const logWrite = writeUploadLogFile({
      rawDir,
      type,
      timestamp,
      uploadedName: req.file.originalname,
      rawBackup,
      sanitizer,
      stdout: out,
      stderr: errOut,
      exitCode: 0,
    })

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
    if (outLines.length > 10) console.log('... (output truncated; full output saved to log file)')
    if (errOut) console.warn('sanitizer stderr preview:\n' + truncateTextTail(errOut, LOG_PREVIEW_OPTS))
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
      logFile: logWrite && logWrite.ok ? logWrite.logPath : null,
      postProcessing,
      normalized: normalized && normalized.converted ? {
        converted: true,
        from: normalized.convertedFrom,
        sheetName: normalized.sheetName,
      } : { converted: false },
      // Keep responses compact: return only a small tail preview.
      logsTruncated: !verbose,
      stdout: stdoutPreview,
      stderr: stderrPreview,
      ...(verbose
        ? {
            stdoutVerbose: truncateTextTail(out, LOG_VERBOSE_OPTS),
            stderrVerbose: truncateTextTail(errOut, LOG_VERBOSE_OPTS),
          }
        : null),
    })
  })
}

async function handleUploadStream(req, res) {
  if (!req.file) return res.status(400).json({ error: 'no file' })

  const verbose = isVerboseRequest(req)

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
    normalized = await ensureCsvForSanitizer({ uploadedPath, uploadedName })
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
    env: {
      ...process.env,
      ...(verbose ? { SANITIZER_VERBOSE: '1', SANITIZER_WARN_OVERFLOW: '1' } : null),
    },
  })

  child.on('error', (e) => {
    try {
      if (normalized && normalized.cleanup) normalized.cleanup()
    } catch {
      /* ignore */
    }
    writeNdjson(res, {
      type: 'error',
      message: 'sanitizer_spawn_failed',
      details: e && e.message,
      data: { type, rawBackup, sanitizer },
    })
    try {
      res.end()
    } catch {
      /* ignore */
    }
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

    const stdoutPreview = truncateTextTail(stdout, LOG_PREVIEW_OPTS)
    const stderrPreview = truncateTextTail(stderr, LOG_PREVIEW_OPTS)
    if (code && code !== 0) {
      const logWrite = writeUploadLogFile({
        rawDir,
        type,
        timestamp,
        uploadedName,
        rawBackup,
        sanitizer,
        stdout,
        stderr,
        exitCode: code,
      })

      writeNdjson(res, {
        type: 'error',
        message: 'sanitizer_failed',
        code,
        data: {
          type,
          rawBackup,
          sanitizer,
          logFile: logWrite && logWrite.ok ? logWrite.logPath : null,
          logsTruncated: !verbose,
          stdout: stdoutPreview,
          stderr: stderrPreview,
          ...(verbose
            ? {
                stdoutVerbose: truncateTextTail(stdout, LOG_VERBOSE_OPTS),
                stderrVerbose: truncateTextTail(stderr, LOG_VERBOSE_OPTS),
              }
            : null),
        },
      })
      return res.end()
    }

    const logWrite = writeUploadLogFile({
      rawDir,
      type,
      timestamp,
      uploadedName,
      rawBackup,
      sanitizer,
      stdout,
      stderr,
      exitCode: 0,
    })

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
        logFile: logWrite && logWrite.ok ? logWrite.logPath : null,
        sanitizer,
        normalized: normalized && normalized.converted ? {
          converted: true,
          from: normalized.convertedFrom,
          sheetName: normalized.sheetName,
        } : { converted: false },
        summary,
        // Keep responses compact for UI: only tail previews.
        logsTruncated: !verbose,
        stdout: stdoutPreview,
        stderr: stderrPreview,
        ...(verbose
          ? {
              stdoutVerbose: truncateTextTail(stdout, LOG_VERBOSE_OPTS),
              stderrVerbose: truncateTextTail(stderr, LOG_VERBOSE_OPTS),
            }
          : null),
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

app.all('/convrs', (req, res) => routeConvrs(req, res, []))
app.all('/convrs/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/convrs\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeConvrs(req, res, tail)
})

app.all('/api/convrs', (req, res) => routeConvrs(req, res, []))
app.all('/api/convrs/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/convrs\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeConvrs(req, res, tail)
})

app.listen(port, () => console.log(`Upload server listening on http://localhost:${port}`))
