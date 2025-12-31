const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

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

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  const uploadedPath = req.file.path
  const uploadedName = req.file.originalname || ''
  const timestamp = Date.now()
  const isRegistrations = /registration/i.test(uploadedName)
  const isMedia = /media/i.test(uploadedName)
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
    console.log('saved_raw:', rawBackup)
    console.log('sanitizer:', sanitizer)
    // include a trimmed stdout preview (first 10 lines) to avoid huge output
    const outLines = out.split(/\r?\n/).filter(Boolean)
    const preview = outLines.slice(0, 10).join('\n')
    console.log('sanitizer stdout preview:\n' + preview)
    if (outLines.length > 10) console.log('... (output truncated, full output returned in response)')
    if (errOut) console.warn('sanitizer stderr:\n', errOut)
    res.json({ ok: true, rawBackup, stdout: out, stderr: errOut })
  })
})

app.get('/health', (req, res) => res.json({ ok: true }))

app.listen(port, () => console.log(`Upload server listening on http://localhost:${port}`))
