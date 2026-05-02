/**
 * Console authentication handler.
 *
 * Public endpoints:
 *   POST /api/auth/login   â€“ email + password â†’ signed session token
 *   POST /api/auth/verify  â€“ existing token â†’ user info
 *
 * Admin endpoints (require valid token + email listed in ADMIN_EMAILS env var):
 *   GET  /api/auth/admin/users           â€“ list all users with plaintext pwd + enabled flag
 *   POST /api/auth/admin/generate        â€“ auto-generate passwords for users not yet in store
 *   POST /api/auth/admin/toggle-enabled  â€“ body: { email, enabled }
 *   POST /api/auth/admin/regenerate      â€“ body: { email } â€“ regenerate one password
 *
 * Credentials are stored in (priority order):
 *   1. CONSOLE_CREDENTIALS env var  (JSON string â€“ use on Vercel/production)
 *   2. config/credentials.json       (file â€“ local dev)
 *
 * Format: { "email": { pwd: "GeneratedPwd", enabled: true } }
 *
 * Session tokens are HMAC-SHA256 signed (12-hour TTL).
 * AUTH_SECRET env var must be set to a long random string in production.
 *
 * Admin access is controlled via ADMIN_EMAILS env var (comma-separated).
 */

'use strict'

const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

// Readable charset â€“ no ambiguous chars (0/O, 1/l/I)
const PWD_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
const PWD_LENGTH = 12

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function getSecret() {
  const s = process.env.AUTH_SECRET
  if (!s || s.length < 20) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET env var must be set in production (min 20 chars).')
    }
    return 'bw-console-dev-secret-please-set-in-prod'
  }
  return s
}

function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8')
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

function createToken(email) {
  const secret = getSecret()
  const now = Date.now()
  const payload = b64url(JSON.stringify({ email, iat: now, exp: now + TOKEN_TTL_MS }))
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  try {
    const secret = getSecret()
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    const sigBuf = Buffer.from(sig.padEnd(expected.length, '0').slice(0, expected.length), 'hex')
    const expBuf = Buffer.from(expected, 'hex')
    if (sigBuf.length !== expBuf.length) return null
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null
  } catch {
    return null
  }
  try {
    const decoded = JSON.parse(b64urlDecode(payload).toString('utf8'))
    if (!decoded.email || !decoded.exp) return null
    if (Date.now() > decoded.exp) return null
    return decoded
  } catch {
    return null
  }
}

function generatePassword() {
  const bytes = crypto.randomBytes(PWD_LENGTH * 2)
  let pwd = ''
  for (let i = 0; i < bytes.length && pwd.length < PWD_LENGTH; i++) {
    const idx = bytes[i] % PWD_CHARSET.length
    pwd += PWD_CHARSET[idx]
  }
  return pwd
}

// ---------------------------------------------------------------------------
// Credentials store
// ---------------------------------------------------------------------------

let _credsCache = null
const CREDS_PATH = path.join(__dirname, '..', '..', 'config', 'credentials.json')

function loadCredentials() {
  if (_credsCache !== null) return _credsCache

  const envRaw = process.env.CONSOLE_CREDENTIALS
  if (envRaw && envRaw.trim()) {
    try {
      _credsCache = JSON.parse(envRaw)
      return _credsCache
    } catch {
      console.error('[auth] Failed to parse CONSOLE_CREDENTIALS env var.')
    }
  }

  if (fs.existsSync(CREDS_PATH)) {
    try {
      _credsCache = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'))
      return _credsCache
    } catch {
      console.error('[auth] Failed to parse config/credentials.json')
    }
  }

  _credsCache = {}
  return _credsCache
}

function saveCredentials(creds) {
  _credsCache = creds
  // Only write to disk in local dev (when not using CONSOLE_CREDENTIALS env var)
  if (process.env.CONSOLE_CREDENTIALS) return
  try {
    const dir = path.dirname(CREDS_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CREDS_PATH, JSON.stringify(creds, null, 2) + '\n', 'utf8')
  } catch (e) {
    console.error('[auth] Failed to write credentials.json:', e.message)
  }
}

function reloadCredentials() {
  _credsCache = null
  return loadCredentials()
}

// ---------------------------------------------------------------------------
// Admin check
// ---------------------------------------------------------------------------

function isAdminToken(token) {
  const payload = verifyToken(token)
  if (!payload) return false
  const adminRaw = process.env.ADMIN_EMAILS || ''
  if (!adminRaw.trim()) return false
  const admins = adminRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  return admins.includes((payload.email || '').toLowerCase())
}

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body)
    let raw = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(raw)) } catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

function getToken(req, body) {
  // Accept token from Authorization header or request body
  const authHeader = (req.headers && req.headers['authorization']) || ''
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim()
  return body.token || ''
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

async function routeAuth(req, res, parts) {
  const action = parts[0] || ''

  // â”€â”€ POST /api/auth/login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (action === 'login' && req.method === 'POST') {
    const body = await readBody(req)
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''

    if (!email || !password) {
      return json(res, 400, { ok: false, error: 'Email e password obbligatori.' })
    }

    reloadCredentials()
    const creds = loadCredentials()
    const entry = creds[email]

    if (!entry) {
      return json(res, 401, { ok: false, error: 'Credenziali non valide.' })
    }
    if (entry.enabled === false) {
      return json(res, 403, { ok: false, error: 'Accesso disabilitato. Contatta l\'amministratore.' })
    }

    // Constant-time string comparison
    const a = Buffer.from(password)
    const b = Buffer.from(entry.pwd || '')
    const match =
      a.length === b.length &&
      crypto.timingSafeEqual(a, b)

    if (!match) {
      return json(res, 401, { ok: false, error: 'Credenziali non valide.' })
    }

    const token = createToken(email)
    return json(res, 200, { ok: true, token, email })
  }

  // â”€â”€ POST /api/auth/verify â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (action === 'verify' && req.method === 'POST') {
    const body = await readBody(req)
    const token = getToken(req, body)
    const payload = verifyToken(token)
    if (!payload) return json(res, 401, { ok: false, error: 'Sessione non valida o scaduta.' })
    return json(res, 200, { ok: true, email: payload.email })
  }

  // â”€â”€ Admin routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (action === 'admin') {
    const subAction = parts[1] || ''

    // Extract and verify admin token from all request types
    let bodyForAdmin = {}
    if (req.method !== 'GET') bodyForAdmin = await readBody(req)
    const token = getToken(req, bodyForAdmin)

    if (!isAdminToken(token)) {
      return json(res, 403, { ok: false, error: 'Accesso negato.' })
    }

    // GET /api/auth/admin/users
    if (subAction === 'users' && req.method === 'GET') {
      reloadCredentials()
      const creds = loadCredentials()
      const users = Object.entries(creds).map(([email, entry]) => ({
        email,
        pwd: entry.pwd,
        enabled: entry.enabled !== false,
      }))
      return json(res, 200, { ok: true, users })
    }

    // POST /api/auth/admin/generate  â€“ generate passwords for missing users
    // body: { allowlist: [{ email, name }] }
    if (subAction === 'generate' && req.method === 'POST') {
      const creds = reloadCredentials()
      const allowlist = Array.isArray(bodyForAdmin.allowlist) ? bodyForAdmin.allowlist : []
      let added = 0
      for (const entry of allowlist) {
        const key = (entry.email || '').trim().toLowerCase()
        if (!key) continue
        if (creds[key]) continue // already has password
        creds[key] = { pwd: generatePassword(), enabled: true }
        added++
      }
      saveCredentials(creds)
      const users = Object.entries(creds).map(([email, e]) => ({
        email,
        pwd: e.pwd,
        enabled: e.enabled !== false,
      }))
      return json(res, 200, { ok: true, added, users })
    }

    // POST /api/auth/admin/toggle-enabled
    if (subAction === 'toggle-enabled' && req.method === 'POST') {
      const email = (bodyForAdmin.email || '').trim().toLowerCase()
      const enabled = Boolean(bodyForAdmin.enabled)
      if (!email) return json(res, 400, { ok: false, error: 'Email mancante.' })
      const creds = reloadCredentials()
      if (!creds[email]) return json(res, 404, { ok: false, error: 'Utente non trovato.' })
      creds[email] = { ...creds[email], enabled }
      saveCredentials(creds)
      return json(res, 200, { ok: true, email, enabled })
    }

    // POST /api/auth/admin/regenerate
    if (subAction === 'regenerate' && req.method === 'POST') {
      const email = (bodyForAdmin.email || '').trim().toLowerCase()
      if (!email) return json(res, 400, { ok: false, error: 'Email mancante.' })
      const creds = reloadCredentials()
      if (!creds[email]) return json(res, 404, { ok: false, error: 'Utente non trovato.' })
      const newPwd = generatePassword()
      creds[email] = { ...creds[email], pwd: newPwd }
      saveCredentials(creds)
      return json(res, 200, { ok: true, email, pwd: newPwd })
    }

    return json(res, 404, { ok: false, error: 'Admin action non trovata.' })
  }

  return json(res, 404, { ok: false, error: 'Not found.' })
}

module.exports = { routeAuth }
