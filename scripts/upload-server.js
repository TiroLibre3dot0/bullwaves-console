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
const { routeAnalytics } = require('../serverless/handlers/analytics')
const { routeAcuity } = require('../serverless/handlers/acuity')
const { routeBrokeree } = require('../serverless/handlers/brokeree')
const { routeReports } = require('../serverless/handlers/reports')
const { routeYpf } = require('../serverless/handlers/ypf')

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
  // NOTE: Skale tokens are single-use per affiliate settings.
  // Always generate fresh tokens via OAuth client_credentials flow.
  // SKALE_STATIC_TOKEN is ignored - it's only for manual Postman testing.
  
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
  // NOTE: Skale tokens are single-use per affiliate settings.
  // Always generate a fresh token for each request to avoid "invalid_token" errors.
  const token = await skaleAuthToken()

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
  const crmEntity = udbe?.crm_entity || {}
  const bill = udbe?.account_bill_ads_general || {}
  const fullName = pickFirstText(account?.accountname, lead?.lead_name, udbe?.accountname, row?.candidateName)
  const firstName = pickFirstText(account?.first_name)
  const lastName = pickFirstText(account?.last_name)
  const generalInfo = Array.isArray(udbe?.tp_accounts_general_info) && udbe.tp_accounts_general_info.length ? udbe.tp_accounts_general_info[0] : {}
  const snapshotInfo = Array.isArray(udbe?.tp_accounts_last_snapshot_info) && udbe.tp_accounts_last_snapshot_info.length ? udbe.tp_accounts_last_snapshot_info[0] : {}

  return {
    leadId: pickFirstText(row?.leadId, account?.lead_id, lead?.id),
    mtId: pickFirstText(account?.mt4_account, row?.accountNumber, udbe?.tp_accounts_general_info?.[0]?.acc),
    email: pickFirstText(account?.email, udbe?.email1, row?.email),
    phone: pickFirstText(account?.phone, udbe?.phone),
    name: fullName,
    firstName: firstName || pickFirstText(String(fullName || '').trim().split(/\s+/)[0]),
    lastName: lastName || pickFirstText(String(fullName || '').trim().split(/\s+/).slice(1).join(' ')),
    country: pickFirstText(account?.country, lead?.registration_country),
    registrationCountry: pickFirstText(account?.registration_country, lead?.country, bill?.bill_country),
    city: pickFirstText(account?.city, bill?.bill_city),
    state: pickFirstText(account?.state, bill?.bill_state),
    zipCode: pickFirstText(account?.zip, bill?.bill_code),
    address: pickFirstText(account?.address, bill?.bill_street),
    birthDate: pickFirstText(account?.date_of_birth),
    leadStatus: pickFirstText(lead?.status, lead?.lead_status, lead?.leadStatus),
    registrationDate: pickFirstText(lead?.created_time, lead?.registration_time, crmEntity?.createdtime),
    leadModifiedAt: pickFirstText(lead?.modified_date, crmEntity?.modifiedtime, account?.last_modified_date),
    verificationStatus: pickFirstText(udbe?.verification_status),
    providerName: pickFirstText(udbe?.provider_name),
    additionalInformation: pickFirstText(udbe?.additional_information),
    comments: pickFirstText(
      row?.managerComments,
      udbe?.additional_information,
      lead?.comment,
      lead?.comments,
      lead?.description,
      account?.comments,
      account?.comment
    ),
    affiliateId: pickFirstText(udbe?.affiliate_id),
    externalLeadId: pickFirstText(account?.external_lead_id, lead?.external_lead_id),
    secondaryEmail: pickFirstText(udbe?.email2, udbe?.secondary_email),
    campaignId: pickFirstText(row?.discovery?.campaign_id),
    utmSource: pickFirstText(row?.discovery?.utm_source),
    utmMedium: pickFirstText(row?.discovery?.utm_medium),
    utmCampaign: pickFirstText(row?.discovery?.utm_campaign),
    utmTerm: pickFirstText(row?.discovery?.utm_term),
    utmContent: pickFirstText(row?.discovery?.utm_content),
    gclId: pickFirstText(row?.discovery?.gcl_id),
    sourceIp: pickFirstText(account?.ip, lead?.ip),
    crmOwner: pickFirstText(udbe?.crm_entity?.user?.user_name),
    crmOwnerText: pickFirstText(udbe?.crm_entity?.user?.user_name, account?.original_retention_owner),
    crmOwnerId: pickFirstText(udbe?.crm_entity?.user?.id),
    crmSmOwnerId: pickFirstText(udbe?.crm_entity?.smownerid),
    crmCreatedAt: pickFirstText(udbe?.crm_entity?.createdtime),
    crmModifiedAt: pickFirstText(udbe?.crm_entity?.modifiedtime),
    accountType: pickFirstText(generalInfo?.account_type),
    platformName: pickFirstText(generalInfo?.platformname),
    mtGroup: pickFirstText(generalInfo?.mt4_group),
    currency: pickFirstText(generalInfo?.currency, account?.currency),
    leverage: pickFirstText(snapshotInfo?.leverage),
    balance: pickFirstText(snapshotInfo?.balance, account?.balance),
    credit: pickFirstText(snapshotInfo?.credit),
    equity: pickFirstText(snapshotInfo?.equity, account?.equity),
    margin: pickFirstText(snapshotInfo?.margin),
    marginFree: pickFirstText(snapshotInfo?.margin_free, account?.margin_free),
    marginLevel: pickFirstText(snapshotInfo?.margin_level),
    closedPnl: pickFirstText(snapshotInfo?.closed_pnl),
    openPnl: pickFirstText(snapshotInfo?.open_pnl),
    ftdDate: pickFirstText(account?.ftd_date),
    lastLogin: pickFirstText(account?.last_login),
  }
}

function extractSkaleManagerComments(payload) {
  const payloadStatusCode = String(payload?.status_code ?? '').trim()
  const payloadStatus = String(payload?.status ?? '').trim().toLowerCase()
  const isSuccess = payloadStatusCode === '1' || payloadStatus === 'success'
  if (!isSuccess) return ''

  const rows = []
  const seen = new Set()
  const textKeys = ['comment', 'comments', 'note', 'notes', 'description', 'message', 'text', 'body']
  const userKeys = ['created_by', 'user_name', 'user', 'author', 'manager']
  const timeKeys = ['created_on', 'created_at', 'createdtime', 'time', 'date', 'modified_date']

  const readKey = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return ''
    for (const key of keys) {
      const value = obj[key]
      const text = String(value ?? '').trim()
      if (text && text !== '[object Object]') return text
    }
    return ''
  }

  const walk = (value, depth = 0) => {
    if (depth > 6 || value == null) return
    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1)
      return
    }
    if (typeof value !== 'object') return

    const text = readKey(value, textKeys)
    if (text) {
      const user = readKey(value, userKeys)
      const when = readKey(value, timeKeys)
      const line = [when, user, text].filter(Boolean).join(' | ')
      const normalized = line || text
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized)
        rows.push(normalized)
      }
    }

    for (const nested of Object.values(value)) walk(nested, depth + 1)
  }

  walk(payload)
  return rows.slice(0, 10).join('\n')
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
    wd: null, // populated from db-native store via buildDbNativeWdIndex
  }
}

// Lazy-loaded, keyed by clientLogin (mt4 account number)
let _dbNativeWdIndex = null
let _dbNativeWdIndexBuiltAt = 0
const DB_NATIVE_WD_INDEX_TTL_MS = 30 * 60 * 1000

function getDbNativeWdIndex() {
  const now = Date.now()
  if (_dbNativeWdIndex && now - _dbNativeWdIndexBuiltAt < DB_NATIVE_WD_INDEX_TTL_MS) {
    return _dbNativeWdIndex
  }
  const storePath = path.join(uploadDir, 'db-native-store.json')
  if (!fs.existsSync(storePath)) return new Map()
  try {
    const store = JSON.parse(fs.readFileSync(storePath, 'utf8'))
    const rows = Array.isArray(store?.rows) ? store.rows : []
    const index = new Map()
    // db-native rows are monthly cumulative; pick the latest period row per login
    const periodOrder = ['2026-Jan','2026-Feb','2026-Mar','2026-Apr','2026-May','2026-Jun','2026-Jul','2026-Aug','2026-Sep','2026-Oct','2026-Nov','2026-Dec']
    for (const r of rows) {
      const login = normalizeDigits(r?.clientLogin)
      if (!login) continue
      const wd = parseSkaleMoney(r?.wd)
      if (wd == null) continue
      const period = String(r?.raw?.['Period Year Month'] || '').trim()
      const prev = index.get(login)
      if (!prev) {
        index.set(login, { wd, period })
      } else {
        const prevRank = periodOrder.indexOf(prev.period)
        const curRank = periodOrder.indexOf(period)
        if (curRank > prevRank) index.set(login, { wd, period })
      }
    }
    _dbNativeWdIndex = index
    _dbNativeWdIndexBuiltAt = now
    return index
  } catch {
    return new Map()
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
    const dbNativeWdIndex = includeMetrics ? getDbNativeWdIndex() : new Map()
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
      // Enrich metrics with WD from db-native store
      if (mt && metrics) {
        const wdEntry = dbNativeWdIndex.get(mt)
        if (wdEntry != null) metrics.wd = wdEntry.wd
      }
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
          metrics = { ...byMtMetrics.get(row.account) }
        } else if (row.email && byEmailMetrics.has(row.email)) {
          metrics = { ...byEmailMetrics.get(row.email) }
        }
        // Always try to populate WD from db-native index regardless of Skale metrics source
        if (metrics && metrics.wd == null && row.account) {
          const wdEntry = dbNativeWdIndex.get(row.account)
          if (wdEntry != null) metrics.wd = wdEntry.wd
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
              metrics = { ...liveMetrics }
              // Populate WD from db-native index if Skale live doesn't have it
              if (metrics.wd == null && row.account) {
                const wdEntry = dbNativeWdIndex.get(row.account)
                if (wdEntry != null) metrics.wd = wdEntry.wd
              }
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

function normalizeSkaleRuntime(payload) {
  const runtime = payload && typeof payload.runtime === 'object' ? payload.runtime : {}
  const metrics = runtime && typeof runtime.metrics === 'object' ? runtime.metrics : {}

  return {
    ...runtime,
    runId: runtime.runId || null,
    startedAt: runtime.startedAt || null,
    finishedAt: runtime.finishedAt || null,
    phase: runtime.phase || 'idle',
    isRunning: Boolean(runtime.isRunning),
    current: Number(runtime.current || 0),
    total: Number(runtime.total || 0),
    updatedAt: runtime.updatedAt || payload?.generatedAt || null,
    message: runtime.message || '',
    metrics: {
      elapsedSec: Number(metrics.elapsedSec || 0),
      lagSec: Number(metrics.lagSec || 0),
      samples: Number(metrics.samples || 0),
      phaseRatePerMin: Number.isFinite(Number(metrics.phaseRatePerMin))
        ? Number(metrics.phaseRatePerMin)
        : null,
      etaSec: Number.isFinite(Number(metrics.etaSec)) ? Number(metrics.etaSec) : null,
      etaText: metrics.etaText || null,
    },
  }
}

function loadSkaleLivePayload() {
  const progressPath = path.join(uploadDir, 'skale-users-db-progress.json')
  const publicPath = path.join(__dirname, '..', 'public', 'skale', 'skale-users-db.json')

  const candidates = [progressPath, publicPath].filter((p, idx, arr) => arr.indexOf(p) === idx)
  const existing = candidates.filter((p) => fs.existsSync(p))
  if (!existing.length) {
    return { ok: false, status: 404, error: 'skale_data_not_found', message: null }
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
    return {
      ok: false,
      status: 500,
      error: 'skale_data_read_failed',
      message: lastErr?.message || 'Unable to read skale payload',
    }
  }

  return {
    ok: true,
    payload,
    source: sourcePath.endsWith('skale-users-db-progress.json') ? 'progress' : 'public',
  }
}

function hasSkaleCredentials() {
  const staticToken = String(process.env.SKALE_STATIC_TOKEN || '').trim()
  if (staticToken) return true
  return Boolean(String(process.env.SKALE_CLIENT_ID || '').trim() && String(process.env.SKALE_CLIENT_SECRET || '').trim())
}

function findSkaleRowInSnapshot({ leadId, email, mtId }) {
  const loaded = loadSkaleLivePayload()
  if (!loaded.ok) return null

  const wantedLeadId = String(leadId || '').trim()
  const wantedEmail = normalizeEmail(email)
  const wantedMtId = normalizeDigits(mtId)
  const rows = Array.isArray(loaded.payload?.rows) ? loaded.payload.rows : []

  let best = null
  let bestScore = -1

  for (const row of rows) {
    const summary = rowSummary(row)
    const rowLeadId = String(summary.leadId || '').trim()
    const rowEmail = normalizeEmail(summary.email)
    const rowMtId = normalizeDigits(summary.mtId)

    let score = 0
    if (wantedLeadId && rowLeadId === wantedLeadId) score += 100
    if (wantedEmail && rowEmail === wantedEmail) score += 90
    if (wantedMtId && rowMtId === wantedMtId) score += 80
    if (!score) continue

    if (score > bestScore) {
      best = row
      bestScore = score
    }
  }

  return best
}

function classifySkaleRow(row) {
  const summary = rowSummary(row)
  const hasEmail = Boolean(normalizeEmail(summary.email))
  const hasPhone = Boolean(normalizeDigits(summary.phone))
  const hasLead = Boolean(String(summary.leadId || '').trim())
  const hasAccount = Boolean(String(summary.mtId || '').trim())

  if (!hasEmail && !hasPhone) return 'do_not_migrate'
  if (hasLead && hasAccount && hasEmail) return 'ready_for_fxbo'
  return 'incomplete_profile'
}

function getSkaleComparableValue(row, key) {
  const summary = rowSummary(row)
  const account = row?.accountDetails?.object || {}
  const lead = row?.leadStatus?.object || {}
  const classification = classifySkaleRow(row)

  switch (key) {
    case 'leadId':
      return String(summary.leadId || '')
    case 'mtId':
      return String(summary.mtId || '')
    case 'email':
      return String(summary.email || '')
    case 'phone':
      return String(summary.phone || '')
    case 'name':
      return String(summary.name || '')
    case 'country':
      return String(summary.country || '')
    case 'accountName':
      return String(account?.accountname || '')
    case 'classification':
      return classification
    case 'createdTime':
      return String(
        lead?.created_time ||
          lead?.registration_time ||
          account?.datecreated ||
          row?.createdAt ||
          row?.generatedAt ||
          ''
      )
    default:
      return String(summary.leadId || summary.email || summary.mtId || '')
  }
}

function parseCsvFilter(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean)
}

app.get('/api/skale/summary', (req, res) => {
  const loaded = loadSkaleLivePayload()
  if (!loaded.ok) {
    return res.status(loaded.status).json({ ok: false, error: loaded.error, message: loaded.message })
  }

  const payload = loaded.payload || {}
  const runtime = normalizeSkaleRuntime(payload)
  const rows = Array.isArray(payload?.rows) ? payload.rows : []

  let readyForFxbo = 0
  let incompleteProfile = 0
  let doNotMigrate = 0

  let minCreated = null
  let maxCreated = null

  for (const row of rows) {
    const cls = classifySkaleRow(row)
    if (cls === 'ready_for_fxbo') readyForFxbo += 1
    else if (cls === 'do_not_migrate') doNotMigrate += 1
    else incompleteProfile += 1

    const createdRaw = getSkaleComparableValue(row, 'createdTime')
    const ts = Date.parse(createdRaw)
    if (!Number.isFinite(ts)) continue
    if (minCreated == null || ts < minCreated) minCreated = ts
    if (maxCreated == null || ts > maxCreated) maxCreated = ts
  }

  const total = rows.length
  const pct = (count) => (total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0)

  return res.json({
    ok: true,
    status: 'ok',
    source: loaded.source,
    generatedAt: payload?.generatedAt || null,
    servedAt: new Date().toISOString(),
    runtime,
    database: {
      totalRecords: total,
      dateRange: {
        oldest: minCreated == null ? null : new Date(minCreated).toISOString(),
        newest: maxCreated == null ? null : new Date(maxCreated).toISOString(),
      },
    },
    classification: {
      readyForFxbo,
      readyForFxboPercent: pct(readyForFxbo),
      incompleteProfile,
      incompleteProfilePercent: pct(incompleteProfile),
      doNotMigrate,
      doNotMigratePercent: pct(doNotMigrate),
    },
    health: {
      localDbAccessible: true,
      skaleApiReachable: null,
      lastHealthCheck: new Date().toISOString(),
    },
  })
})

app.get('/api/skale/dataset', (req, res) => {
  const loaded = loadSkaleLivePayload()
  if (!loaded.ok) {
    return res.status(loaded.status).json({ ok: false, error: loaded.error, message: loaded.message })
  }

  const payload = loaded.payload || {}
  const rows = Array.isArray(payload?.rows) ? payload.rows : []

  const pageRaw = Number(req.query?.page || 1)
  const limitRaw = Number(req.query?.limit || 50)
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1
  const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 50))
  const sortBy = String(req.query?.sort || 'createdTime').trim() || 'createdTime'
  const order = String(req.query?.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  const search = String(req.query?.search || req.query?.q || '').trim().toLowerCase()
  const classificationFilter = parseCsvFilter(req.query?.classification)

  let filtered = rows

  if (classificationFilter.length) {
    const allowed = new Set(classificationFilter)
    filtered = filtered.filter((row) => allowed.has(classifySkaleRow(row)))
  }

  if (search) {
    filtered = filtered.filter((row) => {
      const summary = rowSummary(row)
      const account = row?.accountDetails?.object || {}
      const haystack = [
        summary.leadId,
        summary.mtId,
        summary.email,
        summary.phone,
        summary.name,
        summary.country,
        account?.accountname,
        classifySkaleRow(row),
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ')

      return haystack.includes(search)
    })
  }

  const dir = order === 'asc' ? 1 : -1
  filtered.sort((a, b) => {
    const leftRaw = getSkaleComparableValue(a, sortBy)
    const rightRaw = getSkaleComparableValue(b, sortBy)

    const leftTime = Date.parse(leftRaw)
    const rightTime = Date.parse(rightRaw)
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
      return leftTime === rightTime ? 0 : (leftTime - rightTime) * dir
    }

    const leftNum = Number(leftRaw)
    const rightNum = Number(rightRaw)
    if (Number.isFinite(leftNum) && Number.isFinite(rightNum)) {
      return leftNum === rightNum ? 0 : (leftNum - rightNum) * dir
    }

    const l = String(leftRaw || '').toLowerCase()
    const r = String(rightRaw || '').toLowerCase()
    if (l === r) return 0
    return l > r ? dir : -dir
  })

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, pages)
  const start = (safePage - 1) * limit
  const pageRows = filtered.slice(start, start + limit)

  const mappedRows = pageRows.map((row, idx) => {
    const summary = rowSummary(row)
    const account = row?.accountDetails?.object || {}
    const lead = row?.leadStatus?.object || {}
    const classification = classifySkaleRow(row)
    const id =
      String(summary.leadId || '').trim() ||
      String(summary.mtId || '').trim() ||
      String(summary.email || '').trim() ||
      `row-${start + idx + 1}`

    return {
      id,
      leadId: summary.leadId || null,
      mtId: summary.mtId || null,
      email: summary.email || null,
      phone: summary.phone || null,
      name: summary.name || null,
      country: summary.country || null,
      accountName: account?.accountname || null,
      crmAccountId: account?.id || account?.crm_account_id || null,
      classification,
      leadStatus: lead?.lead_status || lead?.status || null,
      createdTime:
        lead?.created_time || lead?.registration_time || account?.datecreated || row?.createdAt || null,
      updatedTime: lead?.updated_time || account?.last_login || null,
      source: row?.seedSource || row?.source || loaded.source,
      isMigrated: Boolean(row?.isMigrated || row?.fxboId),
    }
  })

  return res.json({
    ok: true,
    status: 'ok',
    source: loaded.source,
    servedAt: new Date().toISOString(),
    pagination: {
      page: safePage,
      limit,
      total,
      pages,
    },
    sort: {
      by: sortBy,
      order,
    },
    filters: {
      search: search || '',
      classification: classificationFilter,
    },
    rows: mappedRows,
    columns: [
      { key: 'leadId', label: 'Lead ID', sortable: true, filterable: true },
      { key: 'mtId', label: 'MT Account', sortable: true, filterable: true },
      { key: 'email', label: 'Email', sortable: true, filterable: true },
      { key: 'phone', label: 'Phone', sortable: false, filterable: true },
      { key: 'name', label: 'Name', sortable: true, filterable: true },
      { key: 'accountName', label: 'Account', sortable: true, filterable: true },
      { key: 'classification', label: 'Classification', sortable: true, filterable: true },
      { key: 'leadStatus', label: 'Lead Status', sortable: true, filterable: true },
      { key: 'createdTime', label: 'Created Time', sortable: true, filterable: false },
    ],
  })
})

app.post('/api/skale/search', (req, res) => {
  const loaded = loadSkaleLivePayload()
  if (!loaded.ok) {
    return res.status(loaded.status).json({ ok: false, error: loaded.error, message: loaded.message })
  }

  const payload = loaded.payload || {}
  const rows = Array.isArray(payload?.rows) ? payload.rows : []

  const query = String(req.body?.query || req.body?.q || '').trim().toLowerCase()
  const offsetRaw = Number(req.body?.offset || 0)
  const limitRaw = Number(req.body?.limit || 10)
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 10))

  const bodyFilters = req.body?.filters && typeof req.body.filters === 'object' ? req.body.filters : {}
  const classFromArray = Array.isArray(bodyFilters.classification)
    ? bodyFilters.classification
    : Array.isArray(bodyFilters.status)
      ? bodyFilters.status
      : []
  const classificationFilter = classFromArray
    .map((v) => String(v || '').trim().toLowerCase())
    .filter(Boolean)
  const countryFilter = String(bodyFilters.country || bodyFilters.region || '').trim().toLowerCase()

  let filtered = rows

  if (classificationFilter.length) {
    const allowed = new Set(classificationFilter)
    filtered = filtered.filter((row) => allowed.has(classifySkaleRow(row)))
  }

  if (countryFilter) {
    filtered = filtered.filter((row) => {
      const summary = rowSummary(row)
      return String(summary.country || '').trim().toLowerCase() === countryFilter
    })
  }

  if (query) {
    filtered = filtered.filter((row) => {
      const summary = rowSummary(row)
      const account = row?.accountDetails?.object || {}
      const lead = row?.leadStatus?.object || {}
      const haystack = [
        summary.leadId,
        summary.mtId,
        summary.email,
        summary.phone,
        summary.name,
        summary.country,
        account?.accountname,
        lead?.lead_status,
        classifySkaleRow(row),
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ')

      return haystack.includes(query)
    })
  }

  const rankForQuery = (row) => {
    if (!query) return 0
    const summary = rowSummary(row)
    const leadId = String(summary.leadId || '').toLowerCase()
    const mtId = String(summary.mtId || '').toLowerCase()
    const email = String(summary.email || '').toLowerCase()
    const phone = String(summary.phone || '').toLowerCase()
    const name = String(summary.name || '').toLowerCase()

    let score = 0
    if (leadId === query || mtId === query || email === query || phone === query) score += 120
    if (email.startsWith(query) || name.startsWith(query)) score += 60
    if (leadId.includes(query) || mtId.includes(query) || phone.includes(query)) score += 45
    if (email.includes(query) || name.includes(query)) score += 30
    return score
  }

  filtered.sort((a, b) => {
    const sa = rankForQuery(a)
    const sb = rankForQuery(b)
    if (sa !== sb) return sb - sa

    const ta = Date.parse(getSkaleComparableValue(a, 'createdTime'))
    const tb = Date.parse(getSkaleComparableValue(b, 'createdTime'))
    if (Number.isFinite(ta) && Number.isFinite(tb)) return tb - ta

    const ea = String(rowSummary(a).email || '').toLowerCase()
    const eb = String(rowSummary(b).email || '').toLowerCase()
    if (ea === eb) return 0
    return ea > eb ? 1 : -1
  })

  const total = filtered.length
  const pageRows = filtered.slice(offset, offset + limit)

  const results = pageRows.map((row, idx) => {
    const summary = rowSummary(row)
    const account = row?.accountDetails?.object || {}
    const lead = row?.leadStatus?.object || {}
    const id =
      String(summary.leadId || '').trim() ||
      String(summary.mtId || '').trim() ||
      String(summary.email || '').trim() ||
      `search-${offset + idx + 1}`

    return {
      id,
      leadId: summary.leadId || null,
      mtId: summary.mtId || null,
      email: summary.email || null,
      phone: summary.phone || null,
      name: summary.name || null,
      country: summary.country || null,
      accountName: account?.accountname || null,
      crmAccountId: account?.id || account?.crm_account_id || null,
      classification: classifySkaleRow(row),
      leadStatus: lead?.lead_status || lead?.status || null,
      createdTime:
        lead?.created_time || lead?.registration_time || account?.datecreated || row?.createdAt || null,
      updatedTime: lead?.updated_time || account?.last_login || null,
      fxboReadiness: {
        status: classifySkaleRow(row) === 'ready_for_fxbo' ? 'ready' : 'review',
        missingFields: [
          summary.email ? null : 'email',
          summary.phone ? null : 'phone',
          summary.leadId ? null : 'leadId',
          summary.mtId ? null : 'mtId',
        ].filter(Boolean),
      },
    }
  })

  return res.json({
    ok: true,
    status: 'ok',
    query,
    total,
    count: results.length,
    offset,
    limit,
    source: loaded.source,
    servedAt: new Date().toISOString(),
    results,
  })
})

function skaleStableRowId(row, fallbackIdx = 0) {
  const summary = rowSummary(row)
  return (
    String(summary.leadId || '').trim() ||
    String(summary.mtId || '').trim() ||
    String(summary.email || '').trim() ||
    `row-${fallbackIdx + 1}`
  )
}

function mapRowToMigrationCheck(row, index = 0) {
  const summary = rowSummary(row)
  const classification = classifySkaleRow(row)
  const id = skaleStableRowId(row, index)
  const missingFields = [
    summary.leadId ? null : 'leadId',
    summary.email ? null : 'email',
    summary.mtId ? null : 'mtAccount',
  ].filter(Boolean)

  return {
    id,
    classification,
    missingFields,
    suggestedAction: classification === 'ready_for_fxbo' ? 'upsert' : 'review',
    canMigrate: classification !== 'do_not_migrate',
    summary: {
      leadId: summary.leadId || null,
      mtId: summary.mtId || null,
      email: summary.email || null,
      phone: summary.phone || null,
      name: summary.name || null,
      country: summary.country || null,
      firstName: summary.firstName || null,
      lastName: summary.lastName || null,
      registrationCountry: summary.registrationCountry || null,
      city: summary.city || null,
      state: summary.state || null,
      zipCode: summary.zipCode || null,
      address: summary.address || null,
      birthDate: summary.birthDate || null,
      verificationStatus: summary.verificationStatus || null,
      providerName: summary.providerName || null,
      additionalInformation: summary.additionalInformation || null,
      affiliateId: summary.affiliateId || null,
      externalLeadId: summary.externalLeadId || null,
      sourceIp: summary.sourceIp || null,
      crmOwner: summary.crmOwner || null,
      crmOwnerText: summary.crmOwnerText || null,
      accountType: summary.accountType || null,
      platformName: summary.platformName || null,
      mtGroup: summary.mtGroup || null,
      currency: summary.currency || null,
      leverage: summary.leverage || null,
      balance: summary.balance || null,
      credit: summary.credit || null,
      equity: summary.equity || null,
      margin: summary.margin || null,
      marginFree: summary.marginFree || null,
      marginLevel: summary.marginLevel || null,
      closedPnl: summary.closedPnl || null,
      openPnl: summary.openPnl || null,
      ftdDate: summary.ftdDate || null,
      lastLogin: summary.lastLogin || null,
    },
  }
}

function pickMigrationRows(payloadRows, requestedIds) {
  const rows = Array.isArray(payloadRows) ? payloadRows : []
  const idSet = new Set((requestedIds || []).map((v) => String(v || '').trim()).filter(Boolean))
  if (!idSet.size) return rows.slice(0, 100)

  const selected = []
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const id = skaleStableRowId(row, i)
    if (idSet.has(id)) selected.push(row)
  }
  return selected
}

function envFlag(name, fallback = false) {
  const raw = String(process.env[name] || '').trim().toLowerCase()
  if (!raw) return fallback
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}

function resolveFxboMigrationConfig() {
  return {
    baseUrl: String(process.env.FXBO_REST_BASE_URL || 'https://crm.bullwaves.com/rest').trim(),
    apiToken: String(process.env.FXBO_MIGRATION_API_TOKEN || '').trim(),
    liveMode: envFlag('FXBO_MIGRATION_LIVE_MODE', false),
    enableApply: envFlag('FXBO_MIGRATION_ENABLE_APPLY', false),
  }
}

async function fxboApiRequest(config, endpoint, { method = 'GET', body } = {}) {
  const base = String(config?.baseUrl || '').replace(/\/$/, '')
  const url = `${base}${endpoint}`
  const headers = {
    Authorization: `Bearer ${config.apiToken}`,
    Accept: 'application/json',
  }
  if (body != null) headers['Content-Type'] = 'application/json'

  const timeoutRaw = Number(process.env.FXBO_API_TIMEOUT_MS || 15000)
  const timeoutMs = Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 15000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    const isAbort = error?.name === 'AbortError'
    const err = new Error(
      isAbort
        ? `FXBO request timeout: ${method} ${endpoint} exceeded ${timeoutMs}ms`
        : `FXBO request network error: ${method} ${endpoint} -> ${error?.message || 'unknown error'}`
    )
    err.status = isAbort ? 504 : null
    err.endpoint = endpoint
    err.method = method
    err.payload = null
    err.text = ''
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  let payload = null
  let text = ''
  try {
    payload = await response.json()
  } catch (e) {
    try {
      text = await response.text()
    } catch (ignored) {
      text = ''
    }
  }

  if (!response.ok) {
    const err = new Error(`FXBO request failed: ${method} ${endpoint} -> ${response.status}`)
    err.status = response.status
    err.endpoint = endpoint
    err.method = method
    err.payload = payload
    err.text = text
     // DEBUG: log failed request details
     if (endpoint === '/users/new') {
       console.error(`[FXBO DEBUG] POST /users/new failed with 400`, JSON.stringify({
         url,
         status: response.status,
         requestBody: body,
         responsePayload: payload,
         responseText: text,
       }, null, 2))
     }
    throw err
  }

  return payload != null ? payload : { raw: text }
}

function fxboPhoneAlreadyRegistered(err) {
  const payloadText = JSON.stringify(err?.payload || {})
  const text = String(err?.text || '')
  return /phone/i.test(payloadText + ' ' + text) && /already registered/i.test(payloadText + ' ' + text)
}

async function createFxboUserWithFallback(config, payload) {
  try {
    return await fxboApiRequest(config, '/users/new', {
      method: 'POST',
      body: payload,
    })
  } catch (err) {
    if (Number(err?.status) !== 400 || !payload?.phone) throw err
    if (!fxboPhoneAlreadyRegistered(err)) {
      const payloadText = JSON.stringify(err?.payload || {})
      const text = String(err?.text || '')
      if (!/phone/i.test(payloadText + ' ' + text)) throw err
    }
    const retryPayload = { ...payload }
    delete retryPayload.phone
    return fxboApiRequest(config, '/users/new', {
      method: 'POST',
      body: retryPayload,
    })
  }
}

async function runFxboLiveProbe(config) {
  const ping = await fxboApiRequest(config, '/ping', { method: 'GET' })
  const usersSample = await fxboApiRequest(config, '/users', {
    method: 'POST',
    body: { offset: 0, limit: 1 },
  })
  const accountsSample = await fxboApiRequest(config, '/accounts', {
    method: 'POST',
    body: { offset: 0, limit: 1 },
  })

  return {
    baseUrl: config.baseUrl,
    ping,
    usersSample,
    accountsSample,
    checkedAt: new Date().toISOString(),
  }
}

let _fxboManagersCache = null
let _fxboManagersFetchedAt = 0
const FXBO_MANAGERS_CACHE_TTL_MS = 10 * 60 * 1000

async function getFxboManagers(config) {
  const now = Date.now()
  if (_fxboManagersCache && now - _fxboManagersFetchedAt < FXBO_MANAGERS_CACHE_TTL_MS) {
    return _fxboManagersCache
  }

  const payload = await fxboApiRequest(config, '/managers', { method: 'GET' })
  const list = Array.isArray(payload) ? payload : []
  _fxboManagersCache = list
  _fxboManagersFetchedAt = now
  return list
}

function resolveFxboManagerId(summary, managers) {
  const list = Array.isArray(managers) ? managers : []
  if (!list.length) return null

  const ownerRaw = String(summary?.crmOwner || summary?.crmOwnerText || '').trim().toLowerCase()
  if (!ownerRaw) return null

  // 1) direct email match
  const byEmail = list.find((m) => String(m?.email || '').trim().toLowerCase() === ownerRaw)
  if (Number.isFinite(byEmail?.id)) return Number(byEmail.id)

  const ownerLocalPart = ownerRaw.includes('@') ? ownerRaw.split('@')[0] : ownerRaw

  // 2) fullName contains owner token
  const byNameContains = list.find((m) =>
    String(m?.fullName || '').trim().toLowerCase().includes(ownerLocalPart)
  )
  if (Number.isFinite(byNameContains?.id)) return Number(byNameContains.id)

  // 3) owner token contains fullName fragment
  const byOwnerContainsName = list.find((m) => {
    const name = String(m?.fullName || '').trim().toLowerCase()
    if (!name) return false
    const token = name.split(/\s+/)[0]
    return token && ownerLocalPart.includes(token)
  })
  if (Number.isFinite(byOwnerContainsName?.id)) return Number(byOwnerContainsName.id)

  return null
}

app.post('/api/skale/migrate-dry-run', async (req, res) => {
  const loaded = loadSkaleLivePayload()
  if (!loaded.ok) {
    return res.status(loaded.status).json({ ok: false, error: loaded.error, message: loaded.message })
  }

  const requestedIds = Array.isArray(req.body?.recordIds) ? req.body.recordIds : []
  const selectedRows = pickMigrationRows(loaded.payload?.rows, requestedIds)

  const checks = selectedRows.map((row, index) => mapRowToMigrationCheck(row, index))
  const recordsSuccessful = checks.filter((c) => c.canMigrate).length
  const recordsFailed = checks.length - recordsSuccessful

  const fxboConfig = resolveFxboMigrationConfig()
  const canProbeLive = Boolean(fxboConfig.liveMode && fxboConfig.apiToken)
  let probe = null
  let probeError = null

  if (canProbeLive) {
    try {
      probe = await runFxboLiveProbe(fxboConfig)
    } catch (error) {
      probeError = {
        message: error?.message || 'FXBO live probe failed',
        status: Number(error?.status || 0) || null,
        endpoint: error?.endpoint || null,
      }
    }
  }

  const results = checks.map((check) => ({
    recordId: check.id,
    status: check.canMigrate ? 'success' : 'failed',
    action: check.suggestedAction,
    fxboId: null,
    warnings: check.classification === 'incomplete_profile' ? ['manual_review_recommended'] : [],
    errors: check.canMigrate ? [] : ['record_not_migratable', ...check.missingFields],
    classification: check.classification,
    summary: check.summary,
  }))

  return res.json({
    ok: true,
    status: 'ok',
    dryRun: true,
    mockMode: !probe,
    target: 'fxbo',
    liveMode: canProbeLive,
    liveProbe: probe,
    liveProbeError: probeError,
    summary: {
      recordsProcessed: checks.length,
      recordsSuccessful,
      recordsFailed,
    },
    results,
    message: probe
      ? 'Dry-run completed with live FXBO connectivity checks (ping/users/accounts). No write operation has been executed.'
      : canProbeLive
        ? 'Dry-run completed, but live FXBO probe failed. Review liveProbeError and verify token/whitelist.'
        : 'Dry-run completed in mock mode. Set FXBO_MIGRATION_LIVE_MODE=1 and FXBO_MIGRATION_API_TOKEN to enable live probe.',
  })
})

app.post('/api/skale/migrate-apply', async (req, res) => {
  const loaded = loadSkaleLivePayload()
  if (!loaded.ok) {
    return res.status(loaded.status).json({ ok: false, error: loaded.error, message: loaded.message })
  }

  const requestedIds = Array.isArray(req.body?.recordIds) ? req.body.recordIds : []
  const selectedRows = pickMigrationRows(loaded.payload?.rows, requestedIds)
  const checks = selectedRows.map((row, index) => mapRowToMigrationCheck(row, index))

  const fxboConfig = resolveFxboMigrationConfig()
  if (!fxboConfig.liveMode || !fxboConfig.apiToken) {
    return res.status(409).json({
      ok: false,
      status: 'blocked',
      target: 'fxbo',
      message:
        'Apply requires live FXBO config. Set FXBO_MIGRATION_LIVE_MODE=1 and FXBO_MIGRATION_API_TOKEN.',
    })
  }

  if (!fxboConfig.enableApply) {
    return res.status(409).json({
      ok: false,
      status: 'blocked',
      target: 'fxbo',
      message:
        'Apply is safety-locked. Set FXBO_MIGRATION_ENABLE_APPLY=1 only after UAT sign-off and reconciliation checks.',
    })
  }

  let probe = null
  try {
    probe = await runFxboLiveProbe(fxboConfig)
  } catch (error) {
    return res.status(502).json({
      ok: false,
      status: 'error',
      target: 'fxbo',
      message: error?.message || 'FXBO live probe failed before apply.',
      probeError: {
        status: Number(error?.status || 0) || null,
        endpoint: error?.endpoint || null,
      },
    })
  }

  const timestamp = new Date().toISOString()
  const migratable = checks.filter((c) => c.canMigrate)
  const notMigratable = checks.filter((c) => !c.canMigrate)

  // ISO-2 country code mapping (Skale country name → FXBO code)
  const countryMap = {
    'United Kingdom': 'GB', 'UK': 'GB',
    'Germany': 'DE',
    'Nigeria': 'NG',
    'Cyprus': 'CY', 'Seychelles': 'SC',
    'Australia': 'AU', 'Canada': 'CA', 'United States': 'US', 'USA': 'US',
    'India': 'IN', 'China': 'CN', 'Japan': 'JP',
    'France': 'FR', 'Italy': 'IT', 'Spain': 'ES', 'Netherlands': 'NL',
    'South Africa': 'ZA', 'Egypt': 'EG', 'Kenya': 'KE',
    'Singapore': 'SG', 'Hong Kong': 'HK', 'Thailand': 'TH',
    'Brazil': 'BR', 'Mexico': 'MX', 'Argentina': 'AR',
    // Additional countries from Skale dataset
    'Ukraine': 'UA',
    'Romania': 'RO',
    'Belgium': 'BE',
    'United Arab Emirates': 'AE',
    'Greece': 'GR',
    'Poland': 'PL',
    'Portugal': 'PT',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Austria': 'AT',
    'Switzerland': 'CH',
    'Belgium': 'BE',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Bulgaria': 'BG',
    'Serbia': 'RS',
    'Croatia': 'HR',
    'Slovakia': 'SK',
    'Slovenia': 'SI',
    'Turkey': 'TR',
    'Israel': 'IL',
    'Pakistan': 'PK',
    'Bangladesh': 'BD',
    'Malaysia': 'MY',
    'Indonesia': 'ID',
    'Philippines': 'PH',
    'Vietnam': 'VN',
    'Thailand': 'TH',
    'South Korea': 'KR',
    'Taiwan': 'TW',
    'New Zealand': 'NZ',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Peru': 'PE',
    'Ecuador': 'EC',
    'Venezuela': 'VE',
    'Panama': 'PA',
    'Costa Rica': 'CR',
  }

  function countryNameToIso(countryName) {
    if (!countryName) return null
    const name = String(countryName).trim()
    return countryMap[name] || null
  }

  function formatFxboBirthDate(value) {
    const raw = String(value || '').trim()
    if (!raw) return null
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`
    return raw
  }

  function formatFxboDateTime(value) {
    const raw = String(value || '').trim()
    if (!raw) return null
    const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (dateOnlyMatch) return `${dateOnlyMatch[3]}-${dateOnlyMatch[2]}-${dateOnlyMatch[1]}`
    return raw
  }

  function formatFxboMoney(value) {
    const raw = String(value || '').trim().replace(/,/g, '')
    if (!raw) return null
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return raw
    return parsed.toFixed(2)
  }

  let supportUsersIndexCache = null

  function loadSupportUsersIndex() {
    const indexPath = path.join(__dirname, '..', 'public', 'support_users_index.json')
    if (!fs.existsSync(indexPath)) return null

    try {
      const mtimeMs = fs.statSync(indexPath).mtimeMs
      if (supportUsersIndexCache && supportUsersIndexCache.mtimeMs === mtimeMs) {
        return supportUsersIndexCache.data
      }

      const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
      const rows = Array.isArray(parsed?.rows) ? parsed.rows : []
      const byMt5 = new Map()
      const byUserId = new Map()
      const byEmail = new Map()

      for (const row of rows) {
        const mt5Key = normalizeDigits(row?.mt5account || '')
        const userIdKey = normalizeEmail(row?.userid || '')
        const emailKey = normalizeEmail(row?.email || '')
        if (mt5Key) byMt5.set(mt5Key, row)
        if (userIdKey) byUserId.set(userIdKey, row)
        if (emailKey) byEmail.set(emailKey, row)
      }

      supportUsersIndexCache = {
        mtimeMs,
        data: { source: path.basename(indexPath), rows, byMt5, byUserId, byEmail },
      }

      return supportUsersIndexCache.data
    } catch {
      return null
    }
  }

  function buildFxboDepositCustomFields(summary) {
    const supportIndex = loadSupportUsersIndex()
    const byMt5 = supportIndex?.byMt5 || new Map()
    const byUserId = supportIndex?.byUserId || new Map()
    const byEmail = supportIndex?.byEmail || new Map()

    const reportRow =
      byMt5.get(normalizeDigits(summary.mtId || '')) ||
      byUserId.get(normalizeEmail(summary.leadId || '')) ||
      byEmail.get(normalizeEmail(summary.email || '')) ||
      null

    const ftdDate = formatFxboDateTime(summary.ftdDate)
    const balance = formatFxboMoney(summary.balance)
    const hasFallbackDeposit = Boolean(ftdDate && balance && Number(balance) > 0)

    const firstDeposit = formatFxboMoney(reportRow?.firstdeposit) || (hasFallbackDeposit ? balance : null)
    const firstDepositDate = String(reportRow?.firstdepositdate || '').trim() || ftdDate || null
    const externalFtdDate = String(reportRow?.externalftddate || '').trim() || ftdDate || null
    const qualificationDate = String(reportRow?.qualificationdate || '').trim() || null
    const netDeposits = formatFxboMoney(reportRow?.netdeposits) || (hasFallbackDeposit ? balance : null)
    const totalDeposits = formatFxboMoney(reportRow?.totaldeposits) || (hasFallbackDeposit ? balance : null)
    const withdrawals = formatFxboMoney(reportRow?.withdrawals) || null
    const depositCountRaw = String(reportRow?.depositcount || '').trim()
    const depositCount = depositCountRaw || (hasFallbackDeposit ? '1' : null)

    return {
      custom_first_deposit: firstDeposit,
      custom_first_deposit_date: firstDepositDate,
      custom_external_ftd_date: externalFtdDate,
      custom_qualification_date: qualificationDate,
      custom_net_deposits: netDeposits,
      custom_deposit_count: depositCount,
      custom_total_deposits: totalDeposits,
      custom_withdrawals: withdrawals,
    }
  }

  function parseOwnerToManagerId(ownerText) {
    const raw = String(ownerText || '').trim()
    if (!raw) return null
    const match = raw.match(/ID:\s*(\d+)/i)
    return match ? Number(match[1]) : null
  }

  function buildFxboUserCustomFields(summary) {
    const customFields = {}
    const addText = (key, value) => {
      const text = String(value ?? '').trim()
      if (text) customFields[key] = text
    }

    addText('custom_skale_lead_id', summary.leadId)
    addText('custom_external_lead_id', summary.externalLeadId)
    addText('custom_kyc_provider', summary.providerName)
    addText('custom_kyc_verification_status', summary.verificationStatus)
    addText('custom_kyc_additional_information', summary.additionalInformation)
    addText('custom_affiliate_id', summary.affiliateId)
    addText('custom_lead_status', summary.leadStatus)
    addText('custom_source_ip', summary.sourceIp)
    addText('custom_secondary_email', summary.secondaryEmail)
    addText('custom_campaign_id', summary.campaignId)
    addText('custom_gcl_id', summary.gclId)
    addText('custom_skale_account_type', summary.accountType)
    addText('custom_skale_platform_name', summary.platformName)
    addText('custom_skale_mt_group', summary.mtGroup)
    addText('custom_currency', summary.currency)
    addText('custom_leverage', summary.leverage)
    addText('custom_balance', summary.balance)
    addText('custom_credit', summary.credit)
    addText('custom_equity', summary.equity)
    addText('custom_margin', summary.margin)
    addText('custom_margin_free', summary.marginFree)
    addText('custom_margin_level', summary.marginLevel)
    addText('custom_closed_pnl', summary.closedPnl)
    addText('custom_open_pnl', summary.openPnl)
    addText('custom_ftd_date', summary.ftdDate)
    addText('custom_last_login', summary.lastLogin)
    const depositFields = buildFxboDepositCustomFields(summary)
    for (const [key, value] of Object.entries(depositFields)) {
      addText(key, value)
    }

    return customFields
  }

  // Helper: map a Skale check summary to the FXBO /users/new payload
  function buildFxboUserPayload(check) {
    const s = check.summary
    const nameParts = String(s.name || '').trim().split(/\s+/)
    const firstName = s.firstName || nameParts[0] || 'Unknown'
    const lastName = s.lastName || nameParts.slice(1).join(' ') || '-'
    const countryCode = countryNameToIso(s.country)
    const registrationCountryCode = countryNameToIso(s.registrationCountry)
    
    // Normalize phone: convert format like "4407540155396" to "+447540155396"
    let phone = s.phone || null
    if (phone) {
      phone = String(phone).trim()
      // If it starts with country code without +, add the +
      if (phone.match(/^\d{10,}/)) {
        // Assume it's already international format like 4407540155396 or 447540155396
        if (!phone.startsWith('+')) {
          phone = '+' + phone
        }
      }
    }
    
    const payload = {
      email: s.email,
      firstName,
      lastName,
      phone,
      country: countryCode,
      city: s.city || null,
      state: s.state || null,
      zipCode: s.zipCode || null,
      address: s.address || null,
      birthDate: formatFxboBirthDate(s.birthDate),
      nationality: countryCode,
      countryOfBirth: registrationCountryCode || countryCode,
      clientIp: s.sourceIp || null,
      secondaryEmail: s.secondaryEmail || null,
      customFields: buildFxboUserCustomFields(s),
      managerId: parseOwnerToManagerId(s.crmOwnerText || ''),
      referralLinkId: s.externalLeadId || null,
      cellxpertCxd: s.externalLeadId || null,
      // Skale rows are client profiles, not leads; create them as clients in FXBO.
      lead: false,
      source: 'skale_migration',
    }

    const utmParams = {}
    if (s.utmSource) utmParams.source = s.utmSource
    if (s.utmMedium) utmParams.medium = s.utmMedium
    if (s.utmCampaign) utmParams.campaign = s.utmCampaign
    if (s.utmTerm) utmParams.term = s.utmTerm
    if (s.utmContent) utmParams.content = s.utmContent
    if (Object.keys(utmParams).length) payload.utmParams = utmParams

    return payload
  }

  function buildFxboAccountPayload(check) {
    const s = check.summary
    const accountType = String(s.accountType || 'Live').trim()
    const platform = String(s.platformName || 'MT5').trim()
    return {
      login: s.mtId || null,
      currency: s.currency || null,
      leverage: Number(s.leverage || 0) || null,
      groupName: s.mtGroup || null,
      tradingStatus: s.tpAccountStatus || null,
      accountType,
      platform,
      balance: s.balance || null,
      credit: s.credit || null,
      equity: s.equity || null,
      margin: s.margin || null,
      customFields: {
        crmTpAccountId: s.crmTpAccountId || null,
        sourceIp: s.sourceIp || null,
        ftdDate: formatFxboDateTime(s.ftdDate),
        marginFree: s.marginFree || null,
        marginLevel: s.marginLevel || null,
        closedPnl: s.closedPnl || null,
        openPnl: s.openPnl || null,
      },
    }
  }

  const BATCH_CONCURRENCY = 3
  const results = []
  let cursor = 0

  // Process not-migratable first (no API call needed)
  for (const check of notMigratable) {
    results.push({
      recordId: check.id,
      status: 'skipped',
      action: check.suggestedAction,
      fxboId: null,
      classification: check.classification,
      errors: ['record_not_migratable', ...check.missingFields],
    })
  }

  // Process migratable records with limited concurrency
  async function processBatch(batch) {
    await Promise.all(
      batch.map(async (check) => {
        const payload = buildFxboUserPayload(check)
        let fxboId = null
        let status = 'failed'
        const errors = []
        let existingId = null

        try {
          // Check if user already exists by email first (idempotent migration)
          try {
            const existing = await fxboApiRequest(fxboConfig, '/users', {
              method: 'POST',
              body: { email: payload.email, offset: 0, limit: 1 },
            })
            if (Number.isFinite(existing?.id)) {
              existingId = existing.id
              fxboId = existing.id
              status = 'existing'
            } else if (Array.isArray(existing) && existing[0]?.id) {
              existingId = existing[0].id
              fxboId = existing[0].id
              status = 'existing'
            }
          } catch {
            // If lookup fails, attempt create anyway
          }

          if (!existingId) {
            const created = await createFxboUserWithFallback(fxboConfig, payload)
            fxboId = created?.id ?? null
            if (!fxboId) {
              errors.push('fxbo_create_returned_no_id')
            } else {
              status = 'success'
            }
          }
        } catch (error) {
          errors.push(error?.message || 'fxbo_create_failed')
          if (error?.status) errors.push(`http_${error.status}`)
          if (error?.payload) errors.push(`fxbo_error: ${JSON.stringify(error.payload).substring(0, 200)}`)
        }

        results.push({
          recordId: check.id,
          status,
          action: check.suggestedAction,
          fxboId,
          classification: check.classification,
          errors,
          summary: {
            email: check.summary.email,
            name: check.summary.name,
            country: check.summary.country,
            city: check.summary.city,
            address: check.summary.address,
            zipCode: check.summary.zipCode,
            birthDate: check.summary.birthDate,
            verificationStatus: check.summary.verificationStatus,
            affiliateId: check.summary.affiliateId,
            externalLeadId: check.summary.externalLeadId,
            sourceIp: check.summary.sourceIp,
            registrationCountry: check.summary.registrationCountry,
          },
        })
      })
    )
  }

  while (cursor < migratable.length) {
    const batch = migratable.slice(cursor, cursor + BATCH_CONCURRENCY)
    // eslint-disable-next-line no-await-in-loop
    await processBatch(batch)
    cursor += BATCH_CONCURRENCY
  }

  const successResults = results.filter((r) => r.status === 'success')
  const existingResults = results.filter((r) => r.status === 'existing')
  const failedResults = results.filter((r) => r.status === 'failed' || r.status === 'skipped')

  return res.json({
    ok: true,
    status: 'ok',
    dryRun: false,
    mockMode: false,
    target: 'fxbo',
    liveMode: true,
    liveProbe: probe,
    migration: {
      timestamp,
      recordsRequested: checks.length,
      recordsCreated: successResults.length,
      recordsExisting: existingResults.length,
      recordsFailed: failedResults.length,
      fxboIds: [...successResults, ...existingResults].map((r) => r.fxboId).filter(Boolean),
    },
    results,
    message: `Apply completed. Created: ${successResults.length}, already existing: ${existingResults.length}, failed/skipped: ${failedResults.length}.`,
  })
})

app.get('/api/skale/live', (req, res) => {
  const loaded = loadSkaleLivePayload()
  if (!loaded.ok) {
    return res.status(loaded.status).json({ ok: false, error: loaded.error, message: loaded.message })
  }

  const payload = loaded.payload || {}
  payload.runtime = normalizeSkaleRuntime(payload)
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  return res.json({
    ...payload,
    liveSource: loaded.source,
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

app.all('/api/analytics', (req, res) => routeAnalytics(req, res, []))
app.all('/api/analytics/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/analytics\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeAnalytics(req, res, tail)
})

app.all('/api/reports', (req, res) => routeReports(req, res, []))
app.all('/api/reports/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/reports\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeReports(req, res, tail)
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

app.all('/api/brokeree', (req, res) => routeBrokeree(req, res, []))
app.all('/api/brokeree/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/brokeree\/?/, '')
    .split('/')
    .filter(Boolean)
  return routeBrokeree(req, res, tail)
})

app.all('/api/ypf', (req, res) => routeYpf(req, res, []))
app.all('/api/ypf/*', (req, res) => {
  const tail = String(req.path || '')
    .replace(/^\/api\/ypf\/?/, '')
    .split('/')
    .filter(Boolean)

  return routeYpf(req, res, tail)
})

// ─── Migration Workbench ──────────────────────────────────────────────────────

const MIGRATION_STATE_PATH = path.join(uploadDir, 'migration-state.json')

function readMigrationState() {
  try {
    if (fs.existsSync(MIGRATION_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(MIGRATION_STATE_PATH, 'utf8'))
    }
  } catch (_) {}
  return { users: {} }
}

function writeMigrationState(state) {
  fs.writeFileSync(MIGRATION_STATE_PATH, JSON.stringify(state, null, 2), 'utf8')
}

// GET /api/migration/state  — return the whole migration state
app.get('/api/migration/state', (req, res) => {
  res.json({ ok: true, state: readMigrationState() })
})

// POST /api/migration/user/fetch  — pull a fresh full profile from Skale live API and save locally
// Body: { leadId } or { email } or { mtId }
app.post('/api/migration/user/fetch', async (req, res) => {
  const leadId  = String(req.body?.leadId  || '').trim()
  const email   = String(req.body?.email   || '').trim()
  const mtId    = String(req.body?.mtId    || '').trim()
  const forceLiveRaw = req.body?.forceLive
  const forceLive =
    forceLiveRaw === true ||
    String(forceLiveRaw || '').trim().toLowerCase() === 'true' ||
    String(forceLiveRaw || '').trim() === '1'

  if (!leadId && !email && !mtId) {
    return res.status(400).json({ ok: false, error: 'Provide leadId, email, or mtId.' })
  }

  try {
    const snapshotRow = findSkaleRowInSnapshot({ leadId, email, mtId })
    const snapshotSummary = snapshotRow ? rowSummary(snapshotRow) : {}
    const enriched = {
      leadId: pickFirstText(leadId, snapshotSummary.leadId),
      email: pickFirstText(email, snapshotSummary.email),
      mtId: pickFirstText(mtId, snapshotSummary.mtId),
      fetchedAt: new Date().toISOString(),
      accountDetails: snapshotRow?.accountDetails || null,
      leadStatus:     snapshotRow?.leadStatus || null,
      userDetails:    snapshotRow?.userDetails || null,
      managerComments: '',
      leadComments: null,
    }

    const canUseLiveSkale = hasSkaleCredentials()
    const mustUseLiveSkale = forceLive

    if (mustUseLiveSkale && !canUseLiveSkale) {
      return res.status(400).json({
        ok: false,
        error: 'forceLive requested but SKALE credentials are not configured (set SKALE_STATIC_TOKEN or SKALE_CLIENT_ID / SKALE_CLIENT_SECRET).',
      })
    }

    if (!snapshotRow && !canUseLiveSkale) {
      return res.status(404).json({
        ok: false,
        error: 'No snapshot match found, and SKALE live credentials are not configured (set SKALE_STATIC_TOKEN or SKALE_CLIENT_ID / SKALE_CLIENT_SECRET).',
      })
    }

    let liveCallsUsed = false
    if (canUseLiveSkale) {
      // 1. GetLeadStatus
      if (enriched.leadId) {
        enriched.leadStatus = await skaleRequest('GetLeadStatus', { lead_id: enriched.leadId })
        liveCallsUsed = true
      }

      const liveLeadObj = enriched.leadStatus?.object || {}

      // If no mtId yet, try from leadStatus
      if (!enriched.mtId && Array.isArray(liveLeadObj?.MT4_accounts) && liveLeadObj.MT4_accounts.length) {
        enriched.mtId = String(liveLeadObj.MT4_accounts[0] || '').trim()
      }

      // 2. GetAccountDetails
      if (enriched.mtId) {
        enriched.accountDetails = await skaleRequest('GetAccountDetails', { account_number: enriched.mtId })
        liveCallsUsed = true
      }

      const liveAccountObj = enriched.accountDetails?.object || {}

      // Resolve email from account details if still missing
      if (!enriched.email) {
        enriched.email = pickFirstText(liveAccountObj?.email, liveLeadObj?.email, snapshotSummary.email)
      }

      // Resolve leadId from account details if still missing
      if (!enriched.leadId) {
        enriched.leadId = pickFirstText(liveAccountObj?.lead_id, liveLeadObj?.id, snapshotSummary.leadId)
      }

      // 3. GetUserDetailsByEmail — the richest source (KYC, trading accounts, snapshots)
      if (enriched.email) {
        enriched.userDetails = await skaleRequest('GetUserDetailsByEmail', { email: enriched.email })
        liveCallsUsed = true
      }

      // 4. GetLeadComments — manager activity/comment thread (permission-dependent)
      const allowManagerComments = String(process.env.SKALE_FETCH_MANAGER_COMMENTS || 'true').trim().toLowerCase() !== 'false'
      if (allowManagerComments && enriched.leadId) {
        const commentsPayload = await skaleRequest('GetLeadComments', { lead_id: enriched.leadId }).catch(() => null)
        enriched.leadComments = commentsPayload
        enriched.managerComments = extractSkaleManagerComments(commentsPayload)
      }
    }

    // Build a full summary using rowSummary()
    enriched.summary = rowSummary({
      leadId: enriched.leadId,
      accountNumber: enriched.mtId,
      email: enriched.email,
      accountDetails: enriched.accountDetails,
      leadStatus: enriched.leadStatus,
      userDetails: enriched.userDetails,
      managerComments: enriched.managerComments,
      leadComments: enriched.leadComments,
    })

    // Persist to migration state
    const resolvedLeadId = enriched.leadId || enriched.email || enriched.mtId
    const state = readMigrationState()
    const existing = state.users[resolvedLeadId] || {}
    state.users[resolvedLeadId] = {
      ...existing,
      skaleLeadId:    enriched.leadId   || null,
      skaleEmail:     enriched.email    || null,
      skaleMtId:      enriched.mtId     || null,
      fetchedAt:      enriched.fetchedAt,
      rawSkaleData:   {
        accountDetails: enriched.accountDetails,
        leadStatus:     enriched.leadStatus,
        userDetails:    enriched.userDetails,
        leadComments:   enriched.leadComments,
      },
      skaleFetchMeta: {
        forceLive,
        liveCallsUsed,
        usedSnapshotSeed: Boolean(snapshotRow),
      },
      summary:        enriched.summary,
      profileStatus:  existing.profileStatus  || 'pending',
      accountsStatus: existing.accountsStatus || 'pending',
      fxboUserId:     existing.fxboUserId     || null,
      fxboAccountIds: existing.fxboAccountIds || [],
      errors:         existing.errors         || [],
    }
    writeMigrationState(state)

    res.json({
      ok: true,
      source: {
        forceLive,
        liveCallsUsed,
        usedSnapshotSeed: Boolean(snapshotRow),
      },
      user: state.users[resolvedLeadId],
    })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message || 'skale_fetch_failed' })
  }
})

// POST /api/migration/user/push  — migrate a fetched user to FXBO (profile + all trading accounts)
// Body: { leadId }
app.post('/api/migration/user/push', async (req, res) => {
  const leadId = String(req.body?.leadId || '').trim()
  if (!leadId) return res.status(400).json({ ok: false, error: 'leadId required' })

  const state = readMigrationState()
  const user = state.users[leadId]
  if (!user) return res.status(404).json({ ok: false, error: 'User not in migration state. Fetch first.' })

  const fxboConfig = resolveFxboMigrationConfig()
  if (!fxboConfig.liveMode) {
    return res.status(400).json({ ok: false, error: 'FXBO_MIGRATION_LIVE_MODE not set. Cannot push.' })
  }

  const errors = []
  let fxboUserId = user.fxboUserId || null

  const pickFxboDepositCustomFields = (fxboUserPayload) => {
    const cf = fxboUserPayload?.customFields || {}
    return {
      custom_first_deposit: cf.custom_first_deposit ?? null,
      custom_first_deposit_date: cf.custom_first_deposit_date ?? null,
      custom_net_deposits: cf.custom_net_deposits ?? null,
      custom_deposit_count: cf.custom_deposit_count ?? null,
      custom_total_deposits: cf.custom_total_deposits ?? null,
      custom_withdrawals: cf.custom_withdrawals ?? null,
      custom_qualification_date: cf.custom_qualification_date ?? null,
    }
  }

  // ── Step 1: create or find client profile ──────────────────────────────
  try {
    state.users[leadId].profileStatus = 'migrating'
    writeMigrationState(state)

    // Build check object compatible with buildFxboUserPayload
    const check = {
      id: leadId,
      summary: user.summary,
      canMigrate: true,
      suggestedAction: 'create',
      classification: 'client',
      missingFields: [],
    }

    // Helper functions copied from migrate-apply scope — re-declare here
    const countryMap = {
      'United Kingdom': 'GB', 'UK': 'GB', 'Germany': 'DE', 'Nigeria': 'NG',
      'Cyprus': 'CY', 'Seychelles': 'SC', 'Australia': 'AU', 'Canada': 'CA',
      'United States': 'US', 'USA': 'US', 'India': 'IN', 'China': 'CN',
      'Japan': 'JP', 'France': 'FR', 'Italy': 'IT', 'Spain': 'ES',
      'Netherlands': 'NL', 'South Africa': 'ZA', 'Egypt': 'EG', 'Kenya': 'KE',
      'Singapore': 'SG', 'Hong Kong': 'HK', 'Thailand': 'TH', 'Brazil': 'BR',
      'Mexico': 'MX', 'Argentina': 'AR', 'Ukraine': 'UA', 'Romania': 'RO',
      'Belgium': 'BE', 'United Arab Emirates': 'AE', 'Greece': 'GR',
      'Poland': 'PL', 'Portugal': 'PT', 'Sweden': 'SE', 'Norway': 'NO',
      'Denmark': 'DK', 'Finland': 'FI', 'Austria': 'AT', 'Switzerland': 'CH',
      'Czech Republic': 'CZ', 'Hungary': 'HU', 'Bulgaria': 'BG', 'Serbia': 'RS',
      'Croatia': 'HR', 'Slovakia': 'SK', 'Slovenia': 'SI', 'Turkey': 'TR',
      'Israel': 'IL', 'Pakistan': 'PK', 'Bangladesh': 'BD', 'Malaysia': 'MY',
      'Indonesia': 'ID', 'Philippines': 'PH', 'Vietnam': 'VN', 'South Korea': 'KR',
      'Taiwan': 'TW', 'New Zealand': 'NZ', 'Chile': 'CL', 'Colombia': 'CO',
      'Peru': 'PE', 'Ecuador': 'EC', 'Venezuela': 'VE', 'Panama': 'PA', 'Costa Rica': 'CR',
      'Ivory Coast': 'CI', "Cote d'Ivoire": 'CI', "Côte d'Ivoire": 'CI',
    }
    const iso = (name) => (name ? countryMap[String(name).trim()] || null : null)
    const fmtDate = (v) => {
      const m = String(v || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
      return m ? `${m[3]}-${m[2]}-${m[1]}` : (String(v || '').trim() || null)
    }
    const fmtDt = (v) => {
      const m = String(v || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
      return m ? `${m[3]}-${m[2]}-${m[1]}` : (String(v || '').trim() || null)
    }
    const normalizeDateLikeText = (value) => {
      const raw = String(value || '').trim()
      if (!raw) return ''
      const isoLike = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/)
      if (isoLike) return `${isoLike[3]}-${isoLike[2]}-${isoLike[1]}`
      const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+.*)?$/)
      if (slash) {
        const day = String(slash[1]).padStart(2, '0')
        const month = String(slash[2]).padStart(2, '0')
        return `${day}-${month}-${slash[3]}`
      }
      const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+.*)?$/)
      if (dash) {
        const day = String(dash[1]).padStart(2, '0')
        const month = String(dash[2]).padStart(2, '0')
        return `${day}-${month}-${dash[3]}`
      }
      return raw
    }
    const fmtMoney = (v) => {
      const raw = String(v || '').trim().replace(/,/g, '')
      if (!raw) return null
      const parsed = Number(raw)
      if (!Number.isFinite(parsed)) return raw
      return parsed.toFixed(2)
    }
    const managerIdFromSummary = (summary) => {
      const candidates = [summary?.crmOwnerId, summary?.crmSmOwnerId]
      for (const value of candidates) {
        const raw = String(value || '').trim()
        if (!raw) continue
        const m = raw.match(/^(\d+)$/)
        if (!m) continue
        const id = Number(m[1])
        if (Number.isFinite(id) && id > 0) return id
      }
      return null
    }
    const statusFromSummary = (summary) => {
      const raw = String(summary?.leadStatus || '').trim()
      if (!raw) return null
      const normalized = raw.toLowerCase()
      if (normalized === 'registered' || normalized === 'new') return 'new'
      return raw.slice(0, 120)
    }

    const s = check.summary
    const managers = await getFxboManagers(fxboConfig).catch(() => [])
    const resolvedManagerId = resolveFxboManagerId(s, managers)
    const nameParts = String(s.name || '').trim().split(/\s+/)
    let phone = s.phone || null
    if (phone && String(phone).trim().match(/^\d{10,}/) && !String(phone).trim().startsWith('+')) {
      phone = '+' + String(phone).trim()
    }
    const buildPushDepositCustomFields = (summary) => {
      const indexPath = path.join(__dirname, '..', 'public', 'support_users_index.json')
      let reportRow = null

      try {
        if (fs.existsSync(indexPath)) {
          const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
          const rows = Array.isArray(parsed?.rows) ? parsed.rows : []
          const mtKey = normalizeDigits(summary.mtId || '')
          const leadKey = normalizeEmail(summary.leadId || '')
          const emailKey = normalizeEmail(summary.email || '')
          reportRow = rows.find((row) => {
            const rowMt = normalizeDigits(row?.mt5account || '')
            const rowUserId = normalizeEmail(row?.userid || '')
            const rowEmail = normalizeEmail(row?.email || '')
            return (mtKey && rowMt === mtKey) || (leadKey && rowUserId === leadKey) || (emailKey && rowEmail === emailKey)
          }) || null
        }
      } catch {
        reportRow = null
      }

      const ftdDate = fmtDt(summary.ftdDate)
      const balance = fmtMoney(summary.balance)
      const hasFallbackDeposit = Boolean(ftdDate && balance && Number(balance) > 0)
      const customDate = (value) => {
        const raw = String(value || '').trim()
        if (!raw) return null
        const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`
        const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
        if (slash) {
          const month = String(slash[1]).padStart(2, '0')
          const day = String(slash[2]).padStart(2, '0')
          return `${day}-${month}-${slash[3]}`
        }
        const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/)
        if (dash) {
          const day = String(dash[1]).padStart(2, '0')
          const month = String(dash[2]).padStart(2, '0')
          return `${day}-${month}-${dash[3]}`
        }
        return null
      }

      return {
        custom_first_deposit: fmtMoney(reportRow?.firstdeposit) || (hasFallbackDeposit ? balance : null),
        custom_first_deposit_date: customDate(reportRow?.firstdepositdate) || ftdDate || null,
        custom_qualification_date: customDate(reportRow?.qualificationdate) || null,
        custom_net_deposits: fmtMoney(reportRow?.netdeposits) || (hasFallbackDeposit ? balance : null),
        custom_deposit_count: String(reportRow?.depositcount || '').trim() || (hasFallbackDeposit ? '1' : null),
        custom_total_deposits: fmtMoney(reportRow?.totaldeposits) || (hasFallbackDeposit ? balance : null),
        custom_withdrawals: fmtMoney(reportRow?.withdrawals) || null,
      }
    }
    const buildPushUserCustomFields = (summary) => {
      const customFields = {}
      const addText = (key, value) => {
        const text = String(value ?? '').trim()
        if (text) customFields[key] = text
      }
      addText('custom_skale_lead_id', summary.leadId)
      addText('custom_external_lead_id', summary.externalLeadId)
      addText('custom_affiliate_id', summary.affiliateId)
      addText('custom_kyc_provider', summary.providerName)
      addText('custom_kyc_verification_status', summary.verificationStatus)
      addText('custom_kyc_additional_information', summary.additionalInformation || summary.comments)
      addText('custom_lead_status', summary.leadStatus)
      addText('custom_registration_date', normalizeDateLikeText(summary.registrationDate))
      addText('custom_lead_modified_at', normalizeDateLikeText(summary.leadModifiedAt))
      addText('custom_crm_owner_user', summary.crmOwner)
      addText('custom_crm_owner_id', summary.crmOwnerId || summary.crmSmOwnerId)
      addText('custom_crm_created_at', normalizeDateLikeText(summary.crmCreatedAt))
      addText('custom_crm_modified_at', normalizeDateLikeText(summary.crmModifiedAt))
      addText('custom_skale_comment', summary.comments)
      addText('custom_campaign_id', summary.campaignId)
      addText('custom_gcl_id', summary.gclId)
      addText('custom_source_ip', summary.sourceIp)
      const depositFields = buildPushDepositCustomFields(summary)
      for (const [key, value] of Object.entries(depositFields)) {
        addText(key, value)
      }
      return customFields
    }
    const userPayload = {
      email: s.email,
      firstName: s.firstName || nameParts[0] || 'Unknown',
      lastName: s.lastName || nameParts.slice(1).join(' ') || '-',
      phone,
      country: iso(s.country),
      city: s.city || null,
      state: s.state || null,
      zipCode: s.zipCode || null,
      address: s.address || null,
      birthDate: fmtDate(s.birthDate),
      nationality: iso(s.country),
      countryOfBirth: iso(s.registrationCountry) || iso(s.country),
      clientIp: s.sourceIp || null,
      managerId: resolvedManagerId || managerIdFromSummary(s),
      secondaryStatus: statusFromSummary(s),
      lead: false,
      customFields: buildPushUserCustomFields(s),
    }

    const createWithOptionalFieldFallback = async (payload) => {
      const safeCustomFields = (() => {
        const all = payload?.customFields || {}
        const safeKeys = [
          'custom_lead_status',
          'custom_first_deposit',
          'custom_first_deposit_date',
          'custom_qualification_date',
          'custom_net_deposits',
          'custom_deposit_count',
          'custom_total_deposits',
          'custom_withdrawals',
        ]
        const kept = {}
        for (const key of safeKeys) {
          const value = all[key]
          if (value != null && String(value).trim()) kept[key] = String(value).trim()
        }
        return kept
      })()

      const variants = [
        payload,
        { ...payload, managerId: null },
        { ...payload, secondaryStatus: null },
        { ...payload, managerId: null, secondaryStatus: null },
        { ...payload, managerId: null, secondaryStatus: null, customFields: safeCustomFields },
        { ...payload, managerId: null, secondaryStatus: null, customFields: {} },
      ]

      let lastErr = null
      for (const variant of variants) {
        try {
          return await createFxboUserWithFallback(fxboConfig, variant)
        } catch (err) {
          lastErr = err
          if (Number(err?.status) !== 400) throw err
        }
      }

      throw lastErr || new Error('FXBO /users/new failed')
    }

    // Idempotency check
    if (!fxboUserId) {
      const existing = await fxboApiRequest(fxboConfig, '/users', {
        method: 'POST',
        body: { email: userPayload.email, offset: 0, limit: 1 },
      }).catch(() => null)

      if (Number.isFinite(existing?.id)) {
        fxboUserId = existing.id
      } else if (Array.isArray(existing) && existing[0]?.id) {
        fxboUserId = existing[0].id
      }
    }

    if (!fxboUserId) {
      const created = await createWithOptionalFieldFallback(userPayload)
      fxboUserId = created?.id ?? null
      if (!fxboUserId) throw new Error('FXBO /users/new returned no id')
    } else {
      // Backfill path: user already exists in FXBO, refresh profile with latest mapping.
      try {
        await fxboApiRequest(fxboConfig, '/users/update', {
          method: 'POST',
          body: { id: fxboUserId, ...userPayload },
        })
      } catch (updateErr) {
        // Some tenants/tokens do not expose profile update for REST users.
        // Keep migration idempotent if user already exists and update is not allowed.
        const status = Number(updateErr?.status)
        if (status !== 403 && status !== 404 && status !== 405) throw updateErr
      }
    }

    state.users[leadId].fxboUserId = fxboUserId
    state.users[leadId].profileStatus = 'migrated'
    state.users[leadId].profileMigratedAt = new Date().toISOString()
  } catch (err) {
    errors.push(`profile: ${err?.message || 'unknown'}`)
    state.users[leadId].profileStatus = 'error'
  }

  // ── Step 2: create trading accounts ────────────────────────────────────
  if (fxboUserId) {
    const listUserAccounts = async () => {
      const payload = await fxboApiRequest(fxboConfig, '/accounts', {
        method: 'POST',
        body: { user: fxboUserId, offset: 0, limit: 500 },
      })
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload?.data)) return payload.data
      if (Array.isArray(payload?.items)) return payload.items
      return []
    }

    const pickNewlyCreatedAccount = (before, after, expectedGroupName) => {
      const beforeLogins = new Set(
        (Array.isArray(before) ? before : [])
          .map((a) => String(a?.login || '').trim())
          .filter(Boolean)
      )

      const candidates = (Array.isArray(after) ? after : [])
        .filter((a) => {
          const login = String(a?.login || '').trim()
          return login && !beforeLogins.has(login)
        })
        .filter((a) => String(a?.groupName || '').trim() === String(expectedGroupName || '').trim())

      if (!candidates.length) return null
      candidates.sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))
      return candidates[0] || null
    }

    const tpAccounts = user.rawSkaleData?.userDetails?.data?.[0]?.tp_accounts_general_info || []
    const snapshotAccounts = user.rawSkaleData?.userDetails?.data?.[0]?.tp_accounts_last_snapshot_info || []
    const snapByAcc = {}
    snapshotAccounts.forEach((s) => { if (s?.acc) snapByAcc[String(s.acc)] = s })

    const fxboAccountIds = []

    for (const tp of tpAccounts) {
      try {
        const accNum = String(tp?.acc || '').trim()
        const snap = accNum ? (snapByAcc[accNum] || {}) : {}

        // Per ticket FXBO #64536 il payload minimo supportato per /accounts/new
        // e' { user, sid, groupName, leverage }. Evitiamo custom fields opzionali
        // per non incorrere in 500 tenant-specific durante la migrazione.
        const accountPayload = {
          user: fxboUserId,
          groupName: String(tp?.mt4_group || '').trim() || null,
          leverage: Number(snap?.leverage || tp?.leverage || 0) || 500,
        }

        if (!accountPayload.groupName) {
          errors.push(`account ${accNum}: missing groupName from Skale mt4_group`)
          fxboAccountIds.push({ skaleAccId: accNum, fxboAccountId: null, status: 'error' })
          continue
        }

        // Only create if sid is available — otherwise record as pending
        const sid = String(process.env.FXBO_MT5_SERVER_SID || '').trim()
        if (!sid) {
          errors.push(`account ${accNum}: FXBO_MT5_SERVER_SID not set — account creation skipped`)
          fxboAccountIds.push({ skaleAccId: accNum, fxboAccountId: null, status: 'pending_sid' })
          continue
        }
        accountPayload.sid = sid
        const beforeAccounts = await listUserAccounts().catch(() => [])

        try {
          const created = await fxboApiRequest(fxboConfig, '/accounts/new', {
            method: 'POST',
            body: accountPayload,
          })

          fxboAccountIds.push({
            skaleAccId: accNum,
            fxboAccountId: created?.login || created?.id || null,
            status: 'migrated',
          })
        } catch (createErr) {
          // Some FXBO tenants may persist the account but still return 500.
          // Reconcile by diffing user's accounts before/after the create call.
          if (Number(createErr?.status) === 500) {
            const afterAccounts = await listUserAccounts().catch(() => [])
            const recovered = pickNewlyCreatedAccount(beforeAccounts, afterAccounts, accountPayload.groupName)
            if (recovered?.login) {
              fxboAccountIds.push({
                skaleAccId: accNum,
                fxboAccountId: String(recovered.login),
                status: 'migrated',
              })
              continue
            }
          }
          throw createErr
        }
      } catch (err) {
        const accNum = String(tp?.acc || '?')
        errors.push(`account ${accNum}: ${err?.message || 'unknown'}`)
        fxboAccountIds.push({ skaleAccId: accNum, fxboAccountId: null, status: 'error' })
      }
    }

    state.users[leadId].fxboAccountIds = fxboAccountIds
    state.users[leadId].accountsStatus = fxboAccountIds.every((a) => a.status === 'migrated')
      ? 'migrated'
      : fxboAccountIds.some((a) => a.status === 'migrated')
      ? 'partial'
      : 'pending_sid'
    state.users[leadId].accountsMigratedAt = new Date().toISOString()
  }

  // ── Step 3: read back FXBO custom fields for immediate visibility in workbench ──
  if (fxboUserId) {
    try {
      const fxboUserPayload = await fxboApiRequest(fxboConfig, `/users/${fxboUserId}`, {
        method: 'GET',
      })
      state.users[leadId].fxboDepositCustomFields = pickFxboDepositCustomFields(fxboUserPayload)
      state.users[leadId].fxboCustomFieldsFetchedAt = new Date().toISOString()
    } catch (err) {
      errors.push(`fxbo_custom_fields: ${err?.message || 'read_failed'}`)
    }
  }

  state.users[leadId].errors = errors
  writeMigrationState(state)

  res.json({
    ok: errors.length === 0,
    fxboUserId,
    profileStatus:  state.users[leadId].profileStatus,
    accountsStatus: state.users[leadId].accountsStatus,
    fxboAccountIds: state.users[leadId].fxboAccountIds,
    errors,
    user: state.users[leadId],
  })
})

// ─────────────────────────────────────────────────────────────────────────────

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
