#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const AUTH_URL = 'https://client.api.skaleapps.io/api/authorisation'
const API_URL = 'https://client.api.skaleapps.io/api/v-2'
const OUTPUT_DB_PUBLIC = path.join(ROOT, 'public', 'skale', 'skale-users-db.json')
const OUTPUT_DB_STAGING = path.join(ROOT, 'uploads', 'skale-users-db-progress.json')
const OUTPUT_ROWS_LOCAL_STREAM = path.join(ROOT, 'uploads', 'skale-users-live.ndjson')

const DAYS_BACK = Number(process.env.SKALE_SYNC_DAYS_BACK || 30)
const WINDOW_DAYS = Number(process.env.SKALE_SYNC_WINDOW_DAYS || 7)
const MAX_CANDIDATES = Number(process.env.SKALE_SYNC_MAX_CANDIDATES || 250)
const ENRICH_DELAY_MS = Number(process.env.SKALE_SYNC_DELAY_MS || 220)
const FLUSH_EVERY = Math.max(1, Number(process.env.SKALE_SYNC_FLUSH_EVERY || 10))
const RUNTIME_HEARTBEAT_EVERY = Math.max(1, Number(process.env.SKALE_SYNC_RUNTIME_HEARTBEAT_EVERY || 10))
const REQUEST_RETRIES = Math.max(0, Number(process.env.SKALE_SYNC_REQUEST_RETRIES || 3))
const REQUEST_RETRY_DELAY_MS = Math.max(0, Number(process.env.SKALE_SYNC_REQUEST_RETRY_DELAY_MS || 800))
const RANGE_START = String(process.env.SKALE_SYNC_START_DATE || '').trim()
const RANGE_END = String(process.env.SKALE_SYNC_END_DATE || '').trim()
const FINAL_DEDUPE = String(process.env.SKALE_SYNC_FINAL_DEDUPE || 'false').trim().toLowerCase() === 'true'
const INCREMENTAL_MODE = String(process.env.SKALE_SYNC_INCREMENTAL || 'true').trim().toLowerCase() === 'true'
const SKIP_EXISTING_CANDIDATES = String(process.env.SKALE_SYNC_SKIP_EXISTING || 'true').trim().toLowerCase() === 'true'
const WRITE_PUBLIC_DURING_SYNC = String(process.env.SKALE_SYNC_WRITE_PUBLIC_DURING_SYNC || 'false').trim().toLowerCase() === 'true'
const ONLY_COMPLETE_ACCOUNTS = String(process.env.SKALE_SYNC_ONLY_COMPLETE_ACCOUNTS || 'true').trim().toLowerCase() === 'true'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseEnvFile(filePath) {
  const out = {}
  if (!fs.existsSync(filePath)) return out
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = String(line || '').trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const i = trimmed.indexOf('=')
    const key = trimmed.slice(0, i).trim()
    const value = trimmed.slice(i + 1).trim()
    out[key] = value
  }
  return out
}

function toIsoDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function dateWindows(daysBack, windowDays) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - daysBack)

  const windows = []
  let cursor = new Date(start)
  while (cursor < end) {
    const next = new Date(cursor)
    next.setDate(next.getDate() + windowDays)
    const winEnd = next < end ? next : end
    windows.push({ start: toIsoDate(cursor), end: toIsoDate(winEnd) })
    cursor = winEnd
  }
  return windows
}

function explicitDateWindows(startDate, endDate) {
  const s = String(startDate || '').trim()
  const e = String(endDate || '').trim()
  if (!s && !e) return null
  if (!s || !e) throw new Error('Set both SKALE_SYNC_START_DATE and SKALE_SYNC_END_DATE together')
  return [{ start: s, end: e }]
}

class SkaleClient {
  constructor({ clientId, clientSecret }) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.token = ''
  }

  async auth() {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    })

    const resp = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    })
    const data = await resp.json()
    const token = String(data?.access_token || '').trim()
    if (!token) throw new Error(`Skale auth failed: ${JSON.stringify(data).slice(0, 400)}`)
    this.token = token
  }

  async request(requestName, params = {}, retried = false) {
    if (!this.token) await this.auth()

    let data = null
    let lastError = null

    for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
      try {
        const body = new URLSearchParams({
          access_token: this.token,
          request: requestName,
        })
        for (const [k, v] of Object.entries(params || {})) {
          if (v == null) continue
          body.set(k, String(v))
        }

        const resp = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body,
        })
        data = await resp.json()
        lastError = null
        break
      } catch (err) {
        lastError = err
        if (attempt >= REQUEST_RETRIES) break
        await sleep(REQUEST_RETRY_DELAY_MS)
      }
    }

    if (lastError) throw lastError

    if (String(data?.error || '').toLowerCase() === 'invalid_token' && !retried) {
      this.token = ''
      await this.auth()
      return this.request(requestName, params, true)
    }

    return data
  }
}

function collectArrayEntries(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) {
      if (item && typeof item === 'object') out.push(item)
      collectArrayEntries(item, out)
    }
    return
  }
  if (node && typeof node === 'object') {
    for (const value of Object.values(node)) {
      collectArrayEntries(value, out)
    }
  }
}

function pickFirst(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k]
    if (v == null) continue
    const s = String(v).trim()
    if (s) return s
  }
  return ''
}

function normalizeAccountNumber(value) {
  const s = String(value || '').replace(/[^0-9]/g, '').trim()
  return s || ''
}

function normalizeAccountRaw(value) {
  return String(value || '').trim()
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function extractCandidate(entry) {
  const leadId = pickFirst(entry, ['id', 'lead_id', 'leadid'])
  const name = pickFirst(entry, ['lead_name', 'name', 'accountname', 'full_name'])
  const email = normalizeEmail(pickFirst(entry, ['email', 'email1']))
  const accountRaw = normalizeAccountRaw(pickFirst(entry, ['account_number', 'acc', 'mt4_account', 'trading_account', 'account_no']))
  const accountNumber = normalizeAccountNumber(accountRaw)

  return {
    leadId,
    name,
    email,
    accountRaw,
    accountNumber,
    raw: entry,
  }
}

function candidatePriority(c) {
  let score = 0
  if (normalizeAccountNumber(c?.accountNumber)) score += 100
  if (normalizeEmail(c?.email)) score += 30
  if (String(c?.leadId || '').trim()) score += 10
  return score
}

function mapUDBEFirst(payload) {
  if (!Array.isArray(payload?.data) || !payload.data.length) return null
  return payload.data[0]
}

function accountLookupVariants(value) {
  const out = []
  const raw = normalizeAccountRaw(value)
  const digits = normalizeAccountNumber(value)

  if (raw) out.push(raw)
  if (digits) out.push(digits)
  if (digits) out.push(`ACC${digits}`)

  return [...new Set(out)]
}

function accountDetailsPayloadScore(payload) {
  const obj = payload?.object || null
  if (!obj || typeof obj !== 'object') return 0

  const important = [
    'accountname',
    'first_name',
    'last_name',
    'email',
    'country',
    'phone',
    'city',
    'address',
    'crm_account_id',
    'balance',
    'equity',
    'ip',
  ]

  let score = 0
  for (const key of important) {
    if (String(obj?.[key] || '').trim()) score += 1
  }
  return score
}

function accountDetailsLooksConsistent(payload, expectedLeadId, expectedAccountDigits) {
  const obj = payload?.object || null
  if (!obj || typeof obj !== 'object') return false

  const gotLead = String(obj?.lead_id || '').trim()
  const expLead = String(expectedLeadId || '').trim()
  if (expLead && gotLead && gotLead !== expLead) return false

  const gotAcc = normalizeAccountNumber(obj?.mt4_account)
  const expAcc = normalizeAccountNumber(expectedAccountDigits)
  if (expAcc && gotAcc && gotAcc !== expAcc) return false

  return true
}

function normalizeLeadId(value) {
  const s = String(value || '').trim()
  return s || ''
}

function isAccountDetailsConsistent(payload, expectedLeadId, requestedAccountValue) {
  const obj = payload?.object || null
  if (!obj || typeof obj !== 'object') return { ok: false, reason: 'empty_account_payload' }

  const requestedDigits = normalizeAccountNumber(requestedAccountValue)
  const returnedDigits = normalizeAccountNumber(obj.mt4_account)
  if (requestedDigits && returnedDigits && requestedDigits !== returnedDigits) {
    return { ok: false, reason: 'mt4_account_mismatch' }
  }

  const expLead = normalizeLeadId(expectedLeadId)
  const gotLead = normalizeLeadId(obj.lead_id)
  if (expLead && gotLead && expLead !== gotLead) {
    return { ok: false, reason: 'lead_id_mismatch' }
  }

  return { ok: true, reason: '' }
}

function hasValue(v) {
  return String(v ?? '').trim() !== ''
}

function isCompleteAccountPayload(payload) {
  const obj = payload?.object || null
  if (!obj || typeof obj !== 'object') return false

  const required = ['accountname', 'email', 'country']
  for (const key of required) {
    if (!hasValue(obj[key])) return false
  }

  const operational = ['crm_account_id', 'phone', 'city', 'balance', 'equity', 'ip']
  return operational.some((key) => hasValue(obj[key]))
}

function dedupeKeyFor(row) {
  const accountObj = row?.accountDetails?.object || {}
  const udbe = mapUDBEFirst(row?.userDetails) || {}
  const acc = normalizeAccountNumber(accountObj.mt4_account || row?.accountNumber || udbe?.tp_accounts_general_info?.[0]?.acc)
  if (acc) return `acc:${acc}`
  const crm = String(accountObj.crm_account_id || udbe.crm_account_id || '').trim()
  if (crm) return `crm:${crm}`
  const email = normalizeEmail(accountObj.email || udbe.email1 || row?.email)
  if (email) return `email:${email}`
  const lead = String(row?.leadId || '').trim()
  if (lead) return `lead:${lead}`
  return `rand:${Math.random().toString(36).slice(2)}`
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8')
  fs.renameSync(tmpPath, filePath)
}

function appendJsonLine(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, 'utf8')
}

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function rowQualityScore(row) {
  const accountObj = row?.accountDetails?.object || null
  const userObj = mapUDBEFirst(row?.userDetails) || null
  let score = 0
  if (accountObj && typeof accountObj === 'object') score += 2
  if (userObj && typeof userObj === 'object') score += 2
  if (String(row?.leadId || '').trim()) score += 1
  if (normalizeEmail(accountObj?.email || userObj?.email1 || row?.email)) score += 1
  if (normalizeAccountNumber(accountObj?.mt4_account || row?.accountNumber || userObj?.tp_accounts_general_info?.[0]?.acc)) score += 1
  return score
}

function parseTs(value) {
  const text = String(value || '').trim()
  if (!text) return 0
  const normalized = text.includes('T') ? text : text.replace(' ', 'T')
  const withZone = /Z$|[+-]\d\d:?\d\d$/.test(normalized) ? normalized : `${normalized}Z`
  const ms = Date.parse(withZone)
  return Number.isFinite(ms) ? ms : 0
}

function formatEtaText(seconds) {
  const sec = Number(seconds)
  if (!Number.isFinite(sec) || sec < 0) return 'n/a'
  const total = Math.round(sec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function pickBetterRow(a, b) {
  const qa = rowQualityScore(a)
  const qb = rowQualityScore(b)
  if (qb > qa) return b
  if (qa > qb) return a
  const ta = parseTs(a?.fetchedAt)
  const tb = parseTs(b?.fetchedAt)
  return tb >= ta ? b : a
}

function mergeRowsByDedupeKey(rows) {
  const out = []
  const map = new Map()
  for (const row of rows || []) {
    const key = dedupeKeyFor(row)
    const prev = map.get(key)
    if (!prev) {
      map.set(key, row)
      out.push(row)
      continue
    }
    const better = pickBetterRow(prev, row)
    if (better !== prev) {
      map.set(key, better)
      const idx = out.indexOf(prev)
      if (idx >= 0) out[idx] = better
    }
  }
  return out
}

function rowIdentityKeys(row) {
  const accountObj = row?.accountDetails?.object || null
  const userObj = mapUDBEFirst(row?.userDetails) || null
  const leadId = String(row?.leadId || '').trim()
  const email = normalizeEmail(accountObj?.email || userObj?.email1 || row?.email)
  const account = normalizeAccountNumber(accountObj?.mt4_account || row?.accountNumber || userObj?.tp_accounts_general_info?.[0]?.acc)
  const keys = []
  if (leadId) keys.push(`lead:${leadId}`)
  if (email) keys.push(`email:${email}`)
  if (account) keys.push(`acc:${account}`)
  return keys
}

function candidateIdentityKeys(c) {
  const leadId = String(c?.leadId || '').trim()
  const email = normalizeEmail(c?.email)
  const account = normalizeAccountNumber(c?.accountNumber || c?.accountRaw)
  const keys = []
  if (leadId) keys.push(`lead:${leadId}`)
  if (email) keys.push(`email:${email}`)
  if (account) keys.push(`acc:${account}`)
  return keys
}

function writeProgressOutput(output) {
  // Keep progress in staging to avoid Vite page refresh while syncing.
  writeJson(OUTPUT_DB_STAGING, output)
  if (WRITE_PUBLIC_DURING_SYNC) {
    writeJson(OUTPUT_DB_PUBLIC, output)
  }
}

function publishFinalOutput(output, options = {}) {
  const preserveOnEmptyError = Boolean(options.preserveOnEmptyError)

  if (preserveOnEmptyError) {
    const existing = readJson(OUTPUT_DB_PUBLIC)
    const existingRows = Array.isArray(existing?.rows) ? existing.rows : []
    const nextRows = Array.isArray(output?.rows) ? output.rows : []

    if (nextRows.length === 0 && existingRows.length > 0) {
      // Keep the last good snapshot to avoid wiping UI/local backup on transient API failures.
      writeJson(OUTPUT_DB_STAGING, existing)
      writeJson(OUTPUT_DB_PUBLIC, existing)
      return
    }
  }

  // Publish once at the end by default.
  writeJson(OUTPUT_DB_STAGING, output)
  writeJson(OUTPUT_DB_PUBLIC, output)
}

function makeOutput({
  candidates,
  dedupCandidates,
  rows,
  success,
  partial,
  failed,
  skippedIncomplete,
  generatedAt,
  runtime,
  newRowsCount,
  existingRowsCount,
}) {
  return {
    generatedAt,
    source: 'skale-only',
    runtime: {
      runId: runtime?.runId || '',
      startedAt: runtime?.startedAt || generatedAt,
      finishedAt: runtime?.finishedAt || null,
      phase: runtime?.phase || 'idle',
      isRunning: Boolean(runtime?.isRunning),
      current: Number(runtime?.current || 0),
      total: Number(runtime?.total || 0),
      updatedAt: runtime?.updatedAt || generatedAt,
      message: runtime?.message || '',
      metrics: {
        elapsedSec: Number(runtime?.metrics?.elapsedSec || 0),
        lagSec: Number(runtime?.metrics?.lagSec || 0),
        samples: Number(runtime?.metrics?.samples || 0),
        phaseRatePerMin: Number.isFinite(Number(runtime?.metrics?.phaseRatePerMin))
          ? Number(runtime.metrics.phaseRatePerMin)
          : null,
        etaSec: Number.isFinite(Number(runtime?.metrics?.etaSec))
          ? Number(runtime.metrics.etaSec)
          : null,
        etaText: runtime?.metrics?.etaText || 'n/a',
      },
    },
    config: {
      daysBack: DAYS_BACK,
      windowDays: WINDOW_DAYS,
      maxCandidates: MAX_CANDIDATES,
      delayMs: ENRICH_DELAY_MS,
      flushEvery: FLUSH_EVERY,
      runtimeHeartbeatEvery: RUNTIME_HEARTBEAT_EVERY,
      requestRetries: REQUEST_RETRIES,
      requestRetryDelayMs: REQUEST_RETRY_DELAY_MS,
      startDate: RANGE_START || null,
      endDate: RANGE_END || null,
      finalDedupe: FINAL_DEDUPE,
      incrementalMode: INCREMENTAL_MODE,
      skipExistingCandidates: SKIP_EXISTING_CANDIDATES,
      onlyCompleteAccounts: ONLY_COMPLETE_ACCOUNTS,
    },
    totals: {
      discoveredRaw: candidates.length,
      discoveredDeduped: dedupCandidates.length,
      existingRows: Number(existingRowsCount || 0),
      enrichedRows: Number(newRowsCount || rows.length),
      finalRows: rows.length,
      success,
      partial,
      failed,
      skippedIncomplete,
    },
    rows,
  }
}

async function main() {
  const env = {
    ...parseEnvFile(path.join(ROOT, '.env.server.local')),
    ...parseEnvFile(path.join(ROOT, '.env.server')),
    ...parseEnvFile(path.join(ROOT, '.env.local')),
    ...parseEnvFile(path.join(ROOT, '.env')),
  }

  const clientId = String(env.SKALE_CLIENT_ID || '').trim()
  const clientSecret = String(env.SKALE_CLIENT_SECRET || '').trim()
  if (!clientId || !clientSecret) throw new Error('Missing SKALE_CLIENT_ID / SKALE_CLIENT_SECRET')

  const skale = new SkaleClient({ clientId, clientSecret })
  const windows = explicitDateWindows(RANGE_START, RANGE_END) || dateWindows(DAYS_BACK, WINDOW_DAYS)

  const existingSnapshot = readJson(OUTPUT_DB_STAGING) || readJson(OUTPUT_DB_PUBLIC)
  const existingRows = Array.isArray(existingSnapshot?.rows) ? existingSnapshot.rows : []
  const existingIdentity = new Set()
  if (SKIP_EXISTING_CANDIDATES) {
    for (const row of existingRows) {
      for (const key of rowIdentityKeys(row)) existingIdentity.add(key)
    }
  }

  const candidates = []
  

  const dedupCandidates = []

  const rows = []
  let success = 0
  let partial = 0
  let failed = 0
  let skippedIncomplete = 0
  const apiErrors = []
  const runStartedAt = new Date().toISOString()
  const runId = `skale-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const runtimeSamples = []
  const MAX_RUNTIME_SAMPLES = 160

  const runtimeState = {
    runId,
    startedAt: runStartedAt,
    finishedAt: null,
    phase: 'discovery',
    isRunning: true,
    current: 0,
    total: windows.length,
    updatedAt: new Date().toISOString(),
    message: 'Discovering candidates from Skale',
    metrics: {
      elapsedSec: 0,
      lagSec: 0,
      samples: 0,
      phaseRatePerMin: null,
      etaSec: null,
      etaText: 'n/a',
    },
  }

  const updateRuntimeMetrics = () => {
    const nowMs = Date.now()
    const updatedAtMs = parseTs(runtimeState.updatedAt) || nowMs

    const last = runtimeSamples.length ? runtimeSamples[runtimeSamples.length - 1] : null
    const changed = !last
      || last.phase !== runtimeState.phase
      || last.current !== runtimeState.current
      || last.total !== runtimeState.total

    if (changed) {
      runtimeSamples.push({
        ts: updatedAtMs,
        phase: runtimeState.phase,
        current: Number(runtimeState.current || 0),
        total: Number(runtimeState.total || 0),
      })
      if (runtimeSamples.length > MAX_RUNTIME_SAMPLES) {
        runtimeSamples.splice(0, runtimeSamples.length - MAX_RUNTIME_SAMPLES)
      }
    }

    const startedAtMs = parseTs(runtimeState.startedAt) || updatedAtMs
    const elapsedSec = Math.max(0, Math.round((updatedAtMs - startedAtMs) / 1000))
    const lagSec = Math.max(0, Math.floor((nowMs - updatedAtMs) / 1000))

    const scoped = runtimeSamples.filter(
      (s) => s.phase === runtimeState.phase && Number(s.total || 0) === Number(runtimeState.total || 0)
    )

    let phaseRatePerMin = null
    if (scoped.length >= 2) {
      const first = scoped[0]
      const lastPoint = scoped[scoped.length - 1]
      const deltaItems = Math.max(0, Number(lastPoint.current || 0) - Number(first.current || 0))
      const deltaMs = Math.max(1, Number(lastPoint.ts || 0) - Number(first.ts || 0))
      if (deltaItems > 0 && deltaMs > 0) {
        phaseRatePerMin = (deltaItems / deltaMs) * 60000
      }
    }

    const total = Number(runtimeState.total || 0)
    const current = Number(runtimeState.current || 0)
    const remaining = Math.max(0, total - current)
    const etaSec = runtimeState.isRunning && phaseRatePerMin && phaseRatePerMin > 0 && remaining > 0
      ? Math.round((remaining / phaseRatePerMin) * 60)
      : null

    runtimeState.metrics = {
      elapsedSec,
      lagSec,
      samples: runtimeSamples.length,
      phaseRatePerMin: Number.isFinite(phaseRatePerMin) ? Number(phaseRatePerMin.toFixed(4)) : null,
      etaSec,
      etaText: etaSec == null ? 'n/a' : formatEtaText(etaSec),
    }
  }

  const writeProgressSnapshot = () => {
    updateRuntimeMetrics()
    const mergedRows = INCREMENTAL_MODE ? mergeRowsByDedupeKey([...existingRows, ...rows]) : rows
    writeProgressOutput(
      makeOutput({
        candidates,
        dedupCandidates,
        rows: mergedRows,
        success,
        partial,
        failed,
        skippedIncomplete,
        generatedAt: new Date().toISOString(),
        runtime: runtimeState,
        newRowsCount: rows.length,
        existingRowsCount: existingRows.length,
      })
    )
  }

  // Write an initial empty snapshot so the UI/file exists immediately.
  writeProgressSnapshot()

  // Start a fresh local NDJSON stream file for this run.
  fs.mkdirSync(path.dirname(OUTPUT_ROWS_LOCAL_STREAM), { recursive: true })
  fs.writeFileSync(OUTPUT_ROWS_LOCAL_STREAM, '', 'utf8')
  appendJsonLine(OUTPUT_ROWS_LOCAL_STREAM, {
    type: 'meta',
    startedAt: new Date().toISOString(),
    note: 'rows appended as they are received',
  })

  for (let i = 0; i < windows.length; i += 1) {
    runtimeState.phase = 'discovery'
    runtimeState.isRunning = true
    runtimeState.current = i + 1
    runtimeState.total = windows.length
    runtimeState.updatedAt = new Date().toISOString()
    runtimeState.message = `Discovery window ${i + 1}/${windows.length}`
    writeProgressSnapshot()

    const w = windows[i]
    const payload = await skale.request('GetAllLeadsStatus', {
      start_date: w.start,
      end_date: w.end,
    })
    if (payload?.error) {
      apiErrors.push(`GetAllLeadsStatus ${w.start}->${w.end}: ${payload.error}`)
    }

    const arrays = []
    collectArrayEntries(payload?.object || payload, arrays)
    for (const entry of arrays) {
      candidates.push(extractCandidate(entry))
    }

    console.log(`[discovery ${i + 1}/${windows.length}] ${w.start} -> ${w.end} | +${arrays.length}`)
    await sleep(ENRICH_DELAY_MS)

    const accountPayloads = [
      await skale.request('GetAccountsUpdates', { start_date: w.start, end_date: w.end }),
      await skale.request('GetNewAccounts', { start_date: w.start, end_date: w.end }),
    ]

    let accountEntries = 0
    for (const p of accountPayloads) {
      if (p?.error) {
        apiErrors.push(`account_discovery ${w.start}->${w.end}: ${p.error}`)
      }
      const list = Array.isArray(p?.object?.accounts) ? p.object.accounts : []
      accountEntries += list.length
      for (const entry of list) {
        candidates.push(extractCandidate(entry))
      }
    }

    if (accountEntries) {
      console.log(`[discovery accounts ${i + 1}/${windows.length}] ${w.start} -> ${w.end} | +${accountEntries}`)
    }
    await sleep(ENRICH_DELAY_MS)
  }

  const seenCandidateKeys = new Set()
  candidates.sort((a, b) => candidatePriority(b) - candidatePriority(a))
  for (const c of candidates) {
    const key = c.leadId ? `lead:${c.leadId}` : c.email ? `email:${c.email}` : c.accountNumber ? `acc:${c.accountNumber}` : ''
    if (!key) continue
    if (seenCandidateKeys.has(key)) continue
    if (SKIP_EXISTING_CANDIDATES) {
      const identities = candidateIdentityKeys(c)
      if (identities.some((k) => existingIdentity.has(k))) continue
    }
    seenCandidateKeys.add(key)
    dedupCandidates.push(c)
    if (dedupCandidates.length >= MAX_CANDIDATES) break
  }

  runtimeState.phase = 'enrich'
  runtimeState.isRunning = true
  runtimeState.current = 0
  runtimeState.total = dedupCandidates.length
  runtimeState.updatedAt = new Date().toISOString()
  runtimeState.message = `Enriching accounts 0/${dedupCandidates.length}`
  writeProgressSnapshot()

  for (let i = 0; i < dedupCandidates.length; i += 1) {
    const c = dedupCandidates[i]
    runtimeState.phase = 'enrich'
    runtimeState.isRunning = true
    runtimeState.current = i + 1
    runtimeState.total = dedupCandidates.length
    runtimeState.updatedAt = new Date().toISOString()
    runtimeState.message = `Enriching accounts ${i + 1}/${dedupCandidates.length}`
    if (!c.leadId) {
      skippedIncomplete += 1
      appendJsonLine(OUTPUT_ROWS_LOCAL_STREAM, {
        type: 'skip',
        at: new Date().toISOString(),
        reason: 'missing_lead_id',
        candidate: c,
      })
      console.log(`[skip ${i + 1}/${dedupCandidates.length}] missing_lead_id`)
      continue
    }

    let leadStatus = null
    let accountDetails = null
    let userDetails = null
    let finalAccount = c.accountRaw || c.accountNumber
    let finalEmail = c.email
    let error = ''
    let accountDetailsRejectedReason = ''

    try {
      leadStatus = await skale.request('GetLeadStatus', { lead_id: c.leadId })
      const maybeObj = leadStatus?.object || {}
      if (Array.isArray(maybeObj?.MT4_accounts) && maybeObj.MT4_accounts.length) {
        finalAccount = normalizeAccountRaw(maybeObj.MT4_accounts[0])
      }
      if (!finalAccount) {
        finalAccount = normalizeAccountNumber(
          pickFirst(maybeObj, ['account_number', 'acc', 'mt4_account', 'trading_account'])
        )
      }
      if (!finalEmail) {
        finalEmail = normalizeEmail(pickFirst(maybeObj, ['email', 'email1']))
      }

      if (finalAccount) {
        accountDetails = await skale.request('GetAccountDetails', {
          account_number: finalAccount,
        })

        if (!accountDetailsLooksConsistent(accountDetails, c.leadId, finalAccount)) {
          accountDetails = null
          accountDetailsRejectedReason = 'lead_or_account_mismatch'
        }

        const check = isAccountDetailsConsistent(accountDetails, c.leadId, finalAccount)
        if (!check.ok) {
          accountDetailsRejectedReason = check.reason
          accountDetails = null
        } else {
          const emailFromAccount = normalizeEmail(accountDetails?.object?.email)
          if (emailFromAccount) finalEmail = emailFromAccount
          if (String(accountDetails?.object?.mt4_account || '').trim()) {
            finalAccount = String(accountDetails.object.mt4_account).trim()
          }
        }
      }

      if (ONLY_COMPLETE_ACCOUNTS && !isCompleteAccountPayload(accountDetails)) {
        accountDetailsRejectedReason = accountDetailsRejectedReason || 'incomplete_account_profile'
        skippedIncomplete += 1
      }

      if (ONLY_COMPLETE_ACCOUNTS && accountDetailsRejectedReason) {
        appendJsonLine(OUTPUT_ROWS_LOCAL_STREAM, {
          type: 'skip',
          at: new Date().toISOString(),
          reason: accountDetailsRejectedReason,
          leadId: c.leadId,
          accountNumber: finalAccount,
          email: finalEmail,
        })
        console.log(
          `[skip ${i + 1}/${dedupCandidates.length}] lead=${c.leadId || '-'} acc=${finalAccount || '-'} reason=${accountDetailsRejectedReason}`
        )
        continue
      }

      if (finalEmail) {
        userDetails = await skale.request('GetUserDetailsByEmail', {
          email: finalEmail,
        })
      }

      const accountOk = String(accountDetails?.status || '').toLowerCase() === 'success'
      const userOk = String(userDetails?.status || '').toLowerCase() === 'success'
      const leadOk = String(leadStatus?.status || '').toLowerCase() === 'success'

      if (accountOk || userOk || leadOk) {
        if ((accountOk && userOk) || (accountOk && leadOk) || (userOk && leadOk)) success += 1
        else partial += 1
      } else {
        failed += 1
      }
    } catch (err) {
      error = err?.message || 'unknown_error'
      failed += 1
    }

    const shouldKeepRow = !error && (!ONLY_COMPLETE_ACCOUNTS || isCompleteAccountPayload(accountDetails))
    if (!shouldKeepRow) {
      skippedIncomplete += 1
      appendJsonLine(OUTPUT_ROWS_LOCAL_STREAM, {
        type: 'skip',
        at: new Date().toISOString(),
        reason: error || accountDetailsRejectedReason || 'incomplete_account_profile',
        leadId: c.leadId,
        accountNumber: finalAccount,
        email: finalEmail,
      })
      console.log(
        `[skip ${i + 1}/${dedupCandidates.length}] lead=${c.leadId || '-'} acc=${finalAccount || '-'} reason=${error || accountDetailsRejectedReason || 'incomplete_account_profile'}`
      )
    } else {
      const row = {
        fetchedAt: new Date().toISOString(),
        leadId: c.leadId,
        candidateName: c.name,
        accountNumber: finalAccount,
        email: finalEmail,
        discovery: c.raw,
        leadStatus,
        accountDetails,
        userDetails,
        accountDetailsRejectedReason,
        error,
      }
      rows.push(row)
      // Local incremental persistence while receiving data.
      appendJsonLine(OUTPUT_ROWS_LOCAL_STREAM, row)
    }

    // Persist in small batches to avoid UI refresh churn on every single row.
    const shouldFlush =
      (i + 1) % FLUSH_EVERY === 0 ||
      (i + 1) % RUNTIME_HEARTBEAT_EVERY === 0 ||
      i === dedupCandidates.length - 1
    if (shouldFlush) {
      writeProgressSnapshot()
    }

    console.log(`[enrich ${i + 1}/${dedupCandidates.length}] lead=${c.leadId || '-'} acc=${finalAccount || '-'} email=${finalEmail || '-'}${error ? ` ERROR=${error}` : ''}`)
    await sleep(ENRICH_DELAY_MS)
  }

  let finalRows = rows
  runtimeState.phase = 'finalizing'
  runtimeState.isRunning = true
  runtimeState.current = rows.length
  runtimeState.total = rows.length
  runtimeState.updatedAt = new Date().toISOString()
  runtimeState.message = 'Finalizing dataset'
  writeProgressSnapshot()

  if (FINAL_DEDUPE) {
    const dedupRows = []
    const dedupMap = new Map()
    for (const row of rows) {
      const key = dedupeKeyFor(row)
      const prev = dedupMap.get(key)
      if (!prev) {
        dedupMap.set(key, row)
        dedupRows.push(row)
        continue
      }

      const prevScore = Number(Boolean(prev?.accountDetails?.object)) + Number(Boolean(mapUDBEFirst(prev?.userDetails)))
      const currScore = Number(Boolean(row?.accountDetails?.object)) + Number(Boolean(mapUDBEFirst(row?.userDetails)))
      if (currScore > prevScore) {
        dedupMap.set(key, row)
        const idx = dedupRows.indexOf(prev)
        if (idx >= 0) dedupRows[idx] = row
      }
    }
    finalRows = dedupRows
  }

  if (INCREMENTAL_MODE) {
    finalRows = mergeRowsByDedupeKey([...existingRows, ...finalRows])
  }

  runtimeState.isRunning = false
  runtimeState.phase = 'done'
  runtimeState.current = finalRows.length
  runtimeState.total = finalRows.length
  runtimeState.updatedAt = new Date().toISOString()
  runtimeState.finishedAt = runtimeState.updatedAt
  runtimeState.message = 'Sync completed'

  const finalOutput = makeOutput({
      candidates,
      dedupCandidates,
      rows: finalRows,
      success,
      partial,
      failed,
      skippedIncomplete,
      generatedAt: new Date().toISOString(),
      runtime: runtimeState,
      newRowsCount: rows.length,
      existingRowsCount: existingRows.length,
    })

  publishFinalOutput(finalOutput, {
    preserveOnEmptyError: finalRows.length === 0 && apiErrors.length > 0,
  })

  console.log('\nDone')
  console.log(`Output: ${OUTPUT_DB_PUBLIC}`)
  console.log(`Staging: ${OUTPUT_DB_STAGING}`)
  console.log(`Final rows: ${finalRows.length}`)
  console.log(`Success: ${success}, Partial: ${partial}, Failed: ${failed}`)
}

main().catch((err) => {
  console.error(err?.stack || err)
  process.exit(1)
})
