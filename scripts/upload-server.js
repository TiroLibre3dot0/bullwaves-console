const express = require('express')
const compression = require('compression')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { exec, spawn } = require('child_process')
const dotenv = require('dotenv')
const { routeAuth } = require('../serverless/handlers/auth')
const { routeEmail } = require('../serverless/handlers/email')
const { routeSms } = require('../serverless/handlers/sms')
const { routeGmail } = require('../serverless/handlers/gmail')
const { routeSlack } = require('../serverless/handlers/slack')
const { routeQlik } = require('../serverless/handlers/qlik')
const { routeAcuity } = require('../serverless/handlers/acuity')

process.on('unhandledRejection', (reason) => {
  const message = reason?.stack || reason?.message || String(reason || 'unknown error')
  console.warn('[upload-server] unhandledRejection intercepted; keeping process alive')
  console.warn(message)
})

const projectRoot = path.join(__dirname, '..')
;['.env.sendgrid.local', '.env.server.local', '.env.server', '.env.local', '.env'].forEach((name) => {
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

app.use(compression())
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
    path.join(__dirname, 'generate_affiliate_index.js'),
    path.join(__dirname, 'generate_creolabs_index.js'),
    // Investments dashboard relies on this precomputed artifact.
    // It aggregates Media Report.csv into a lightweight CellX affiliate+month table.
    ...(type === 'media' ? [path.join(__dirname, 'generate_cellx_affiliate_month.js')] : []),
    // Rankings rely on Registrations Report.csv; keep them in sync after registrations uploads.
    ...(type === 'registrations' ? [path.join(__dirname, 'generate_rankings_index.js')] : []),
    path.join(__dirname, 'generate_support_users_index.js'),
    path.join(__dirname, 'generate_fraud_patterns_index.js'),
    path.join(__dirname, 'generate_affiliate_kpi_index.js'),
    // Generate meta LAST so frontend cache-busting reflects all regenerated artifacts.
    path.join(__dirname, 'generate_reports_meta.js'),
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

const SKALE_AUTH_URL = 'https://client.api.skaleapps.io/api/authorisation'
const SKALE_API_URL = 'https://client.api.skaleapps.io/api/v-2'
let skaleTokenCache = { token: '', fetchedAt: 0 }

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeDigits(value) {
  return String(value || '').replace(/[^0-9]/g, '')
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = String(value || '').trim()
    if (text) return text
  }
  return ''
}

function readJsonWithRetries(filePath, retries = 2) {
  let lastErr = null
  for (let i = 0; i <= retries; i += 1) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      return { ok: true, payload: JSON.parse(raw), error: null }
    } catch (e) {
      lastErr = e
    }
  }
  return { ok: false, payload: null, error: lastErr }
}

function readSkaleSnapshotPayload() {
  const progressPath = path.join(uploadDir, 'skale-users-db-progress.json')
  const publicPath = path.join(__dirname, '..', 'public', 'skale', 'skale-users-db.json')
  const candidates = [progressPath, publicPath].filter((p, idx, arr) => arr.indexOf(p) === idx)
  const existing = candidates.filter((p) => fs.existsSync(p))
  if (!existing.length) return { ok: false, payload: null }

  for (const filePath of existing) {
    const result = readJsonWithRetries(filePath, 2)
    if (result.ok) return { ok: true, payload: result.payload }
  }
  return { ok: false, payload: null }
}

const skaleContactCachePath = path.join(uploadDir, 'skale-contact-cache.json')

function normalizeContactEntry(value) {
  if (typeof value === 'string') {
    return {
      phone: String(value || '').trim(),
      country: '',
      updatedAt: '',
    }
  }

  if (!value || typeof value !== 'object') {
    return {
      phone: '',
      country: '',
      updatedAt: '',
    }
  }

  return {
    phone: String(value.phone || '').trim(),
    country: String(value.country || '').trim(),
    updatedAt: String(value.updatedAt || '').trim(),
  }
}

function readSkaleContactCache() {
  const empty = { byRowKey: {}, byAccount: {}, byEmail: {}, updatedAt: '' }
  if (!fs.existsSync(skaleContactCachePath)) return empty

  try {
    const raw = fs.readFileSync(skaleContactCachePath, 'utf8')
    const parsed = JSON.parse(raw)

    const byRowKey = {}
    const byAccount = {}
    const byEmail = {}

    for (const [k, v] of Object.entries(parsed?.byRowKey || {})) {
      const key = String(k || '').trim()
      if (!key) continue
      byRowKey[key] = normalizeContactEntry(v)
    }

    for (const [k, v] of Object.entries(parsed?.byAccount || {})) {
      const key = normalizeDigits(k)
      if (!key) continue
      byAccount[key] = normalizeContactEntry(v)
    }

    for (const [k, v] of Object.entries(parsed?.byEmail || {})) {
      const key = normalizeEmail(k)
      if (!key) continue
      byEmail[key] = normalizeContactEntry(v)
    }

    return {
      byRowKey,
      byAccount,
      byEmail,
      updatedAt: String(parsed?.updatedAt || '').trim(),
    }
  } catch {
    return empty
  }
}

function writeSkaleContactCache(cache) {
  try {
    fs.writeFileSync(skaleContactCachePath, JSON.stringify(cache, null, 2), 'utf8')
  } catch {
    // Ignore cache write errors to avoid breaking API behavior.
  }
}

async function skaleAuthToken() {
  const clientId = String(process.env.SKALE_CLIENT_ID || '').trim()
  const clientSecret = String(process.env.SKALE_CLIENT_SECRET || '').trim()
  if (!clientId || !clientSecret) {
    throw new Error('Missing SKALE_CLIENT_ID / SKALE_CLIENT_SECRET')
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const resp = await fetch(SKALE_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })
  const data = await resp.json()
  const token = String(data?.access_token || '').trim()
  if (!token) throw new Error(`Skale auth failed: ${JSON.stringify(data).slice(0, 300)}`)
  skaleTokenCache = { token, fetchedAt: Date.now() }
  return token
}

async function skaleRequest(requestName, params = {}, allowRetry = true) {
  const tokenFreshEnough = skaleTokenCache.token && Date.now() - skaleTokenCache.fetchedAt < 55 * 60 * 1000
  const token = tokenFreshEnough ? skaleTokenCache.token : await skaleAuthToken()

  const body = new URLSearchParams({
    access_token: token,
    request: requestName,
  })

  for (const [k, v] of Object.entries(params || {})) {
    if (v == null) continue
    const text = String(v).trim()
    if (!text) continue
    body.set(k, text)
  }

  const resp = await fetch(SKALE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })

  const payload = await resp.json()
  if (String(payload?.error || '').toLowerCase() === 'invalid_token' && allowRetry) {
    skaleTokenCache = { token: '', fetchedAt: 0 }
    return skaleRequest(requestName, params, false)
  }
  return payload
}

function rowSummary(row) {
  const account = row?.accountDetails?.object || {}
  const lead = row?.leadStatus?.object || {}
  const udbe = Array.isArray(row?.userDetails?.data) && row.userDetails.data.length ? row.userDetails.data[0] : {}

  return {
    leadId: pickFirstText(row?.leadId, account?.lead_id, lead?.id),
    mtId: pickFirstText(account?.mt4_account, row?.accountNumber, udbe?.tp_accounts_general_info?.[0]?.acc),
    email: pickFirstText(account?.email, udbe?.email1, row?.email),
    phone: pickFirstText(account?.phone, udbe?.phone),
    name: pickFirstText(account?.accountname, lead?.lead_name, udbe?.accountname, row?.candidateName),
    country: pickFirstText(account?.country, lead?.registration_country),
  }
}

function parseSkaleMoney(value) {
  const raw = String(value ?? '').trim().replace(/,/g, '')
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function pickSkaleMetrics(row) {
  const user = Array.isArray(row?.userDetails?.data) && row.userDetails.data.length ? row.userDetails.data[0] : null
  const snapshot = Array.isArray(user?.tp_accounts_last_snapshot_info) && user.tp_accounts_last_snapshot_info.length
    ? user.tp_accounts_last_snapshot_info[0]
    : null

  return {
    closedPl: parseSkaleMoney(snapshot?.closed_pnl),
    openPl: parseSkaleMoney(snapshot?.open_pnl),
    wd: null,
  }
}

function matchScoreFromSummary(summary, queryText) {
  const q = String(queryText || '').trim().toLowerCase()
  if (!q) return 0

  const fields = [
    summary?.leadId,
    summary?.mtId,
    summary?.email,
    summary?.phone,
    summary?.name,
    summary?.country,
  ].map((v) => String(v || '').toLowerCase())

  let score = 0
  for (const value of fields) {
    if (!value) continue
    if (value === q) score += 60
    else if (value.startsWith(q)) score += 35
    else if (value.includes(q)) score += 14
  }
  return score
}

function buildSnapshotSeeds(rows, queryText, maxSeeds = 30) {
  const q = String(queryText || '').trim().toLowerCase()
  const scored = []

  for (const row of rows || []) {
    const summary = rowSummary(row)
    const score = matchScoreFromSummary(summary, q)
    if (score <= 0) continue
    scored.push({
      seedSource: 'snapshot',
      score,
      leadId: summary.leadId,
      accountNumber: summary.mtId,
      email: summary.email,
      phone: summary.phone,
      name: summary.name,
    })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, maxSeeds)
}

function buildDirectSeeds(queryText) {
  const q = String(queryText || '').trim()
  const out = []
  if (!q) return out

  const email = normalizeEmail(q)
  const digits = normalizeDigits(q)

  if (email.includes('@')) {
    out.push({ seedSource: 'direct-email', score: 100, email })
  }

  if (digits.length >= 5) {
    out.push({ seedSource: 'direct-account', score: 95, accountNumber: digits })
    out.push({ seedSource: 'direct-lead', score: 80, leadId: digits })
  }

  return out
}

function dedupeSeeds(seeds) {
  const map = new Map()
  for (const seed of seeds || []) {
    const key = [
      normalizeDigits(seed?.accountNumber),
      normalizeEmail(seed?.email),
      String(seed?.leadId || '').trim(),
      normalizeDigits(seed?.phone),
      String(seed?.name || '').trim().toLowerCase(),
    ].join('|')

    if (!map.has(key)) {
      map.set(key, seed)
      continue
    }
    const prev = map.get(key)
    if (Number(seed?.score || 0) > Number(prev?.score || 0)) map.set(key, seed)
  }
  return Array.from(map.values())
}

async function enrichSeed(seed) {
  const enriched = {
    summary: {
      leadId: String(seed?.leadId || '').trim(),
      mtId: String(seed?.accountNumber || '').trim(),
      email: String(seed?.email || '').trim(),
      phone: String(seed?.phone || '').trim(),
      name: String(seed?.name || '').trim(),
      country: '',
    },
    accountDetails: null,
    userDetails: null,
    leadStatus: null,
    score: Number(seed?.score || 0),
    source: seed?.seedSource || 'unknown',
  }

  if (enriched.summary.mtId) {
    enriched.accountDetails = await skaleRequest('GetAccountDetails', { account_number: enriched.summary.mtId })
  }

  if (enriched.summary.leadId) {
    enriched.leadStatus = await skaleRequest('GetLeadStatus', { lead_id: enriched.summary.leadId })
  }

  const leadObj = enriched.leadStatus?.object || {}
  if (!enriched.summary.mtId && Array.isArray(leadObj?.MT4_accounts) && leadObj.MT4_accounts.length) {
    enriched.summary.mtId = String(leadObj.MT4_accounts[0] || '').trim()
    if (enriched.summary.mtId) {
      enriched.accountDetails = await skaleRequest('GetAccountDetails', { account_number: enriched.summary.mtId })
    }
  }

  const accountObj = enriched.accountDetails?.object || {}
  if (!enriched.summary.leadId) {
    enriched.summary.leadId = pickFirstText(accountObj?.lead_id, leadObj?.id)
  }

  if (!enriched.summary.email) {
    enriched.summary.email = pickFirstText(accountObj?.email, leadObj?.email, leadObj?.email1)
  }

  if (enriched.summary.email) {
    enriched.userDetails = await skaleRequest('GetUserDetailsByEmail', { email: enriched.summary.email })
  }

  const udbe = Array.isArray(enriched.userDetails?.data) && enriched.userDetails.data.length
    ? enriched.userDetails.data[0]
    : {}

  enriched.summary.name = pickFirstText(
    accountObj?.accountname,
    leadObj?.lead_name,
    udbe?.accountname,
    enriched.summary.name
  )
  enriched.summary.phone = pickFirstText(accountObj?.phone, udbe?.phone, enriched.summary.phone)
  enriched.summary.country = pickFirstText(accountObj?.country, leadObj?.registration_country)
  enriched.summary.mtId = pickFirstText(accountObj?.mt4_account, enriched.summary.mtId)

  return enriched
}

async function mapWithConcurrency(items, concurrency, worker) {
  const list = Array.isArray(items) ? items : []
  const max = Math.max(1, Number(concurrency || 1))
  const out = new Array(list.length)
  let cursor = 0

  async function runOne() {
    while (true) {
      const idx = cursor
      cursor += 1
      if (idx >= list.length) return
      // eslint-disable-next-line no-await-in-loop
      out[idx] = await worker(list[idx], idx)
    }
  }

  const workers = Array.from({ length: Math.min(max, list.length) }, () => runOne())
  await Promise.all(workers)
  return out
}

app.post('/api/skale/phones', async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : []
  const forceLiveRaw = req.body?.forceLive
  const forceLive = forceLiveRaw === true || String(forceLiveRaw || '').trim().toLowerCase() === 'true' || String(forceLiveRaw || '').trim() === '1'
  const includeMetricsRaw = req.body?.includeMetrics
  const includeMetrics = includeMetricsRaw === true || String(includeMetricsRaw || '').trim().toLowerCase() === 'true' || String(includeMetricsRaw || '').trim() === '1'
  const concurrencyRaw = Number(req.body?.concurrency || 4)
  const concurrency = Math.max(1, Math.min(8, Number.isFinite(concurrencyRaw) ? concurrencyRaw : 4))

  if (!rows.length) {
    return res.status(400).json({ ok: false, error: 'missing_rows' })
  }

  try {
    const snapshotResult = readSkaleSnapshotPayload()
    const snapshotRows = Array.isArray(snapshotResult?.payload?.rows) ? snapshotResult.payload.rows : []
    const cacheStore = readSkaleContactCache()

    const byMt = new Map()
    const byEmail = new Map()
    const byMtCountry = new Map()
    const byEmailCountry = new Map()
    const byMtMetrics = new Map()
    const byEmailMetrics = new Map()
    const byCacheRowKey = new Map(Object.entries(cacheStore.byRowKey || {}))
    const byCacheAccount = new Map(Object.entries(cacheStore.byAccount || {}))
    const byCacheEmail = new Map(Object.entries(cacheStore.byEmail || {}))
    for (const snapRow of snapshotRows) {
      const summary = rowSummary(snapRow)
      const metrics = pickSkaleMetrics(snapRow)
      const mt = normalizeDigits(summary?.mtId)
      const email = normalizeEmail(summary?.email)
      const phone = pickFirstText(summary?.phone)
      const country = pickFirstText(summary?.country)
      if (mt && phone && !byMt.has(mt)) byMt.set(mt, phone)
      if (email && phone && !byEmail.has(email)) byEmail.set(email, phone)
      if (mt && country && !byMtCountry.has(mt)) byMtCountry.set(mt, country)
      if (email && country && !byEmailCountry.has(email)) byEmailCountry.set(email, country)
      if (mt && metrics && (metrics.closedPl != null || metrics.openPl != null) && !byMtMetrics.has(mt)) byMtMetrics.set(mt, metrics)
      if (email && metrics && (metrics.closedPl != null || metrics.openPl != null) && !byEmailMetrics.has(email)) byEmailMetrics.set(email, metrics)
    }

    const normalizedRows = rows.slice(0, 300).map((row, idx) => {
      const account = normalizeDigits(row?.tradingAccount || row?.account || row?.mtId)
      const email = normalizeEmail(row?.email)
      const rowKey = String(row?.rowKey || `${account}:${email || idx}`).trim()
      return { rowKey, account, email }
    })

    let cacheHits = 0

    const resultRows = await mapWithConcurrency(normalizedRows, concurrency, async (row) => {
      let phone = ''
      let country = ''
      let source = ''
      let error = ''
      let metrics = includeMetrics ? { closedPl: null, openPl: null, wd: null } : null

      const cachedRowKey = byCacheRowKey.get(row.rowKey)
      const cachedByAccount = row.account ? byCacheAccount.get(row.account) : null
      const cachedByEmail = row.email ? byCacheEmail.get(row.email) : null
      const cachedEntry = normalizeContactEntry(cachedRowKey || cachedByAccount || cachedByEmail)

      if (cachedEntry.phone || cachedEntry.country) {
        phone = cachedEntry.phone
        country = cachedEntry.country
        source = 'cache'
        cacheHits += 1
      }

      if (!phone && row.account && byMt.has(row.account)) {
        phone = String(byMt.get(row.account) || '').trim()
        source = 'snapshot'
      } else if (!phone && row.email && byEmail.has(row.email)) {
        phone = String(byEmail.get(row.email) || '').trim()
        source = 'snapshot'
      }

      if (!country && row.account && byMtCountry.has(row.account)) {
        country = String(byMtCountry.get(row.account) || '').trim()
      } else if (!country && row.email && byEmailCountry.has(row.email)) {
        country = String(byEmailCountry.get(row.email) || '').trim()
      }

      if (includeMetrics) {
        if (row.account && byMtMetrics.has(row.account)) {
          metrics = byMtMetrics.get(row.account)
        } else if (row.email && byEmailMetrics.has(row.email)) {
          metrics = byEmailMetrics.get(row.email)
        }
      }

      const needContact = !phone || !country
      const needMetrics = includeMetrics && (!metrics || (metrics.closedPl == null && metrics.openPl == null))

      // Run live lookups when data is incomplete after cache/snapshot.
      if (forceLive && (needContact || needMetrics)) {
        try {
          let resolvedEmail = row.email

          if (row.account && (needContact || needMetrics)) {
            const accountDetails = await skaleRequest('GetAccountDetails', { account_number: row.account })
            const accountPhone = pickFirstText(accountDetails?.object?.phone)
            const accountCountry = pickFirstText(accountDetails?.object?.country)
            const accountEmail = normalizeEmail(accountDetails?.object?.email)
            if (accountPhone) {
              phone = accountPhone
              source = 'live:GetAccountDetails'
            }
            if (!country && accountCountry) country = accountCountry
            if (!resolvedEmail && accountEmail) resolvedEmail = accountEmail
          }

          if (resolvedEmail && (needContact || needMetrics)) {
            const userDetails = await skaleRequest('GetUserDetailsByEmail', { email: resolvedEmail })
            const user = Array.isArray(userDetails?.data) && userDetails.data.length ? userDetails.data[0] : null
            const userPhone = pickFirstText(user?.phone)
            const userCountry = pickFirstText(user?.country)
            const liveMetrics = pickSkaleMetrics({ userDetails })
            if (userPhone) {
              phone = userPhone
              source = 'live:GetUserDetailsByEmail'
            }
            if (!country && userCountry) country = userCountry
            if (includeMetrics && (liveMetrics.closedPl != null || liveMetrics.openPl != null)) {
              metrics = liveMetrics
            }
          }
        } catch (e) {
          error = e?.message || 'live_lookup_failed'
        }
      }

      return {
        rowKey: row.rowKey,
        account: row.account,
        email: row.email,
        phone: phone || '',
        country: country || '',
        metrics,
        source: source || (phone ? 'unknown' : 'none'),
        error,
      }
    })

    const phones = {}
    const countries = {}
    const metrics = {}
    const sources = {}
    const errors = {}

    const nextCache = {
      byRowKey: { ...(cacheStore.byRowKey || {}) },
      byAccount: { ...(cacheStore.byAccount || {}) },
      byEmail: { ...(cacheStore.byEmail || {}) },
      updatedAt: new Date().toISOString(),
    }

    for (const row of resultRows) {
      if (!row?.rowKey) continue
      phones[row.rowKey] = String(row.phone || '')
      countries[row.rowKey] = String(row.country || '')
      if (includeMetrics) {
        metrics[row.rowKey] = {
          closedPl: row?.metrics?.closedPl ?? null,
          openPl: row?.metrics?.openPl ?? null,
          wd: row?.metrics?.wd ?? null,
        }
      }
      sources[row.rowKey] = String(row.source || 'none')
      if (row.error) errors[row.rowKey] = String(row.error)

      const hasData = String(row.phone || '').trim() || String(row.country || '').trim()
      if (!hasData) continue

      const entry = {
        phone: String(row.phone || '').trim(),
        country: String(row.country || '').trim(),
        updatedAt: nextCache.updatedAt,
      }

      nextCache.byRowKey[row.rowKey] = entry
      if (row.account) nextCache.byAccount[row.account] = entry
      if (row.email) nextCache.byEmail[row.email] = entry
    }

    writeSkaleContactCache(nextCache)

    return res.json({
      ok: true,
      count: resultRows.length,
      matched: resultRows.filter((item) => String(item?.phone || '').trim()).length,
      cacheHits,
      phones,
      countries,
      metrics,
      sources,
      errors,
      metricsWindow: includeMetrics
        ? {
            source: 'skale-snapshot-live',
          }
        : null,
    })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'skale_phone_lookup_failed',
      message: err?.message || 'Skale phone lookup failed',
    })
  }
})

app.all('/api/skale/account-search', async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const query = String(req.body?.query || req.query?.q || '').trim()
  const limitRaw = Number(req.body?.limit || req.query?.limit || 8)
  const limit = Math.max(1, Math.min(20, Number.isFinite(limitRaw) ? limitRaw : 8))

  if (!query || query.length < 2) {
    return res.status(400).json({ ok: false, error: 'invalid_query', message: 'Please provide at least 2 characters.' })
  }

  try {
    const snapshotResult = readSkaleSnapshotPayload()
    const rows = Array.isArray(snapshotResult?.payload?.rows) ? snapshotResult.payload.rows : []

    const seeds = dedupeSeeds([
      ...buildDirectSeeds(query),
      ...buildSnapshotSeeds(rows, query, Math.max(limit * 3, 30)),
    ])

    const selectedSeeds = seeds.slice(0, Math.max(limit * 2, 10))
    const results = []
    for (const seed of selectedSeeds) {
      // Keep requests serial to avoid overloading Skale APIs.
      // Single-search UX still remains responsive for this page.
      const enriched = await enrichSeed(seed)
      const matchScore = matchScoreFromSummary(enriched.summary, query)
      if (matchScore <= 0 && Number(seed?.score || 0) <= 0) continue
      const completenessScore =
        Number(Boolean(enriched?.accountDetails?.object)) * 30 +
        Number(Boolean(enriched?.userDetails?.data?.length)) * 20 +
        Number(Boolean(enriched?.leadStatus?.object)) * 15 +
        Number(Boolean(String(enriched?.summary?.leadId || '').trim())) * 8 +
        Number(Boolean(String(enriched?.summary?.mtId || '').trim())) * 8

      enriched.score = Number(seed?.score || 0) + matchScore + completenessScore
      results.push(enriched)
      if (results.length >= limit) break
    }

    results.sort((a, b) => Number(b?.score || 0) - Number(a?.score || 0))

    return res.json({
      ok: true,
      query,
      count: results.length,
      results,
    })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'skale_account_search_failed',
      message: err?.message || 'Skale account search failed',
    })
  }
})

app.get('/api/skale/live', (req, res) => {
  const progressPath = path.join(uploadDir, 'skale-users-db-progress.json')
  const publicPath = path.join(__dirname, '..', 'public', 'skale', 'skale-users-db.json')

  const candidates = [progressPath, publicPath].filter((p, idx, arr) => arr.indexOf(p) === idx)
  const existing = candidates.filter((p) => fs.existsSync(p))
  if (!existing.length) {
    return res.status(404).json({ ok: false, error: 'skale_data_not_found' })
  }

  let payload = null
  let sourcePath = ''
  let lastErr = null
  for (const filePath of existing) {
    const result = readJsonWithRetries(filePath, 2)
    if (result.ok) {
      payload = result.payload
      sourcePath = filePath
      break
    }
    lastErr = result.error
  }

  if (!payload) {
    return res.status(500).json({ ok: false, error: 'skale_data_read_failed', message: lastErr && lastErr.message })
  }

  const source = sourcePath.endsWith('skale-users-db-progress.json') ? 'progress' : 'public'
  const runtime = payload && typeof payload.runtime === 'object' ? payload.runtime : {}
  const metrics = runtime && typeof runtime.metrics === 'object' ? runtime.metrics : {}
  payload.runtime = {
    ...runtime,
    runId: runtime.runId || null,
    startedAt: runtime.startedAt || null,
    finishedAt: runtime.finishedAt || null,
    phase: runtime.phase || 'idle',
    isRunning: Boolean(runtime.isRunning),
    current: Number(runtime.current || 0),
    total: Number(runtime.total || 0),
    updatedAt: runtime.updatedAt || payload.generatedAt || null,
    message: runtime.message || '',
    metrics: {
      elapsedSec: Number(metrics.elapsedSec || 0),
      lagSec: Number(metrics.lagSec || 0),
      samples: Number(metrics.samples || 0),
      phaseRatePerMin: Number.isFinite(Number(metrics.phaseRatePerMin)) ? Number(metrics.phaseRatePerMin) : null,
      etaSec: Number.isFinite(Number(metrics.etaSec)) ? Number(metrics.etaSec) : null,
      etaText: metrics.etaText || null,
    },
  }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  return res.json({
    ...payload,
    liveSource: source,
    servedAt: new Date().toISOString(),
  })
})

app.all('/api/email', (req, res) => routeEmail(req, res, []))
app.all('/api/email/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/email\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeEmail(req, res, tail)
})

app.all('/api/sms', (req, res) => routeSms(req, res, []))
app.all('/api/sms/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/sms\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeSms(req, res, tail)
})

app.all('/api/gmail', (req, res) => routeGmail(req, res, []))
app.all('/api/gmail/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/gmail\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeGmail(req, res, tail)
})

app.all('/api/slack', (req, res) => routeSlack(req, res, []))
app.all('/api/slack/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/slack\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeSlack(req, res, tail)
})

app.all('/api/qlik', (req, res) => routeQlik(req, res, []))
app.all('/api/qlik/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/qlik\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeQlik(req, res, tail)
})

app.all('/api/auth', (req, res) => routeAuth(req, res, []))
app.all('/api/auth/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/auth\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeAuth(req, res, tail)
})

app.all('/api/acuity', (req, res) => routeAcuity(req, res, []))
app.all('/api/acuity/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/acuity\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeAcuity(req, res, tail)
})

const server = app.listen(port, () => console.log(`Upload server listening on http://localhost:${port}`))

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`)
    console.error('Another upload server instance is likely already running.')
    console.error('Use: npm run upload:server:restart')
    process.exit(1)
    return
  }

  throw err
})
