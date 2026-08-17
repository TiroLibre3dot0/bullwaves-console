const { json } = require('./_http')
const { URLSearchParams } = require('node:url')

const DEFAULT_BASE_URL = 'https://adminapi.cellxpert.com/'
const DEFAULT_ADMIN_URL = 'Bullwaves'
const DEFAULT_HISTORICAL_FROM = '2024-01-01'

const tokenCache = {
  token: '',
  expiresAtMs: 0,
}

const reportCache = new Map()
const REPORT_CACHE_TTL_MS = 5 * 60 * 1000

function env(name, fallback = '') {
  const value = process.env?.[name]
  if (value == null) return fallback
  return String(value)
}

function getConfig() {
  const baseUrl = String(env('CELLXPERT_API_BASE_URL', DEFAULT_BASE_URL)).trim() || DEFAULT_BASE_URL
  const adminUrl = String(env('CELLXPERT_ADMIN_URL', DEFAULT_ADMIN_URL)).trim() || DEFAULT_ADMIN_URL
  const user = String(env('CELLXPERT_ADMIN_USER')).trim()
  const password = String(env('CELLXPERT_ADMIN_PASSWORD')).trim()

  return {
    baseUrl: baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
    adminUrl,
    user,
    password,
    configured: Boolean(user && password),
    missing: {
      CELLXPERT_ADMIN_USER: !user,
      CELLXPERT_ADMIN_PASSWORD: !password,
    },
  }
}

function publicConfig(config) {
  return {
    baseUrl: config.baseUrl,
    adminUrl: config.adminUrl,
    configured: config.configured,
    missing: config.missing,
    user: config.user ? `${config.user.slice(0, 3)}***` : '',
  }
}

function buildUrl(config, command, query = {}) {
  const url = new URL(config.baseUrl)
  url.searchParams.set('command', command)
  for (const [key, value] of Object.entries(query || {})) {
    if (value == null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  return url
}

function normalizeDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    return `${Number(iso[2])}/${Number(iso[3])}/${iso[1]}`
  }
  return raw
}

function parseLimit(value, fallback = 100) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.max(1, Math.min(2000, Math.trunc(n)))
}

function cleanNumber(value) {
  if (value == null) return 0
  const text = String(value).replace(/[$,%\s,]/g, '').trim()
  if (!text) return 0
  const n = Number(text)
  return Number.isFinite(n) ? n : 0
}

function cleanText(value) {
  if (value == null) return ''
  return String(value).trim()
}

function pick(row, keys, fallback = '') {
  for (const key of keys || []) {
    if (row?.[key] != null && row[key] !== '') return row[key]
  }
  return fallback
}

function text(res, status, body, extraHeaders) {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  if (extraHeaders && typeof extraHeaders === 'object') {
    for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value)
  }
  res.end(String(body || ''))
}

function csvValue(value) {
  const raw = value == null ? '' : String(value)
  if (!/[",\r\n]/.test(raw)) return raw
  return `"${raw.replace(/"/g, '""')}"`
}

function rowsToCsv(headers, rows) {
  const labels = headers.map((header) => header.label)
  const lines = [labels.map(csvValue).join(',')]
  for (const row of rows || []) {
    lines.push(headers.map((header) => csvValue(row?.[header.key])).join(','))
  }
  return `${lines.join('\n')}\n`
}

function parseMonth(raw) {
  const text = String(raw || '').trim()
  let match = text.match(/^(\d{4})[/-](\d{1,2})/)
  if (match) {
    return {
      year: Number(match[1]),
      monthIndex: Math.max(0, Number(match[2]) - 1),
    }
  }

  match = text.match(/^(\d{1,2})[/-](\d{4})/)
  if (match) {
    return {
      year: Number(match[2]),
      monthIndex: Math.max(0, Number(match[1]) - 1),
    }
  }

  const date = new Date(text)
  if (!Number.isNaN(date.getTime())) {
    return {
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
    }
  }

  return null
}

function parseJsonMaybe(text) {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function parseCsv(text) {
  const rows = []
  const raw = String(text || '')
  let field = ''
  let row = []
  let quoted = false

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i]
    const next = raw[i + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const [headers, ...items] = rows.filter((item) => item.some((value) => String(value || '').trim()))
  if (!headers?.length) return []

  return items.map((item) => headers.reduce((record, header, index) => {
    const key = String(header || '').trim()
    if (key) record[key] = item[index] ?? ''
    return record
  }, {}))
}

function parseRows(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.rows)) return payload.rows
  if (Array.isArray(payload.ManageAffiliatesData)) return payload.ManageAffiliatesData
  if (Array.isArray(payload.PixelLog)) return payload.PixelLog
  if (Array.isArray(payload.Registrations)) return payload.Registrations
  if (Array.isArray(payload.Report)) return payload.Report
  return []
}

function findSignedReport(payload) {
  if (!payload || typeof payload !== 'object') return null
  if (payload.s3 && payload.url) {
    return { url: String(payload.url) }
  }
  for (const value of Object.values(payload)) {
    if (value && typeof value === 'object' && value.s3 && value.url) {
      return { url: String(value.url) }
    }
  }
  return null
}

async function fetchSignedReport(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/csv, text/plain, */*',
    },
  })
  const text = await response.text()
  if (!response.ok) {
    const error = new Error(`Cellxpert signed report download failed (${response.status})`)
    error.status = response.status
    error.details = text.slice(0, 400)
    throw error
  }

  const jsonPayload = parseJsonMaybe(text)
  if (jsonPayload) return jsonPayload
  return parseCsv(text)
}

async function authenticate(config, { force = false } = {}) {
  if (!config.configured) {
    const error = new Error('Cellxpert API credentials are not configured.')
    error.code = 'cellxpert_not_configured'
    throw error
  }

  const now = Date.now()
  if (!force && tokenCache.token && tokenCache.expiresAtMs > now + 60_000) {
    return tokenCache.token
  }

  const url = buildUrl(config, 'authenticate')
  const body = new URLSearchParams()
  body.set('user', config.user)
  body.set('url', config.adminUrl)
  body.set('pass', config.password)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      admin_url: config.adminUrl,
    },
    body,
  })

  const text = await response.text()
  const payload = parseJsonMaybe(text)
  if (!response.ok || !payload?.token) {
    const error = new Error(payload?.error || payload?.message || `Cellxpert authenticate failed (${response.status})`)
    error.status = response.status
    error.details = text.slice(0, 400)
    throw error
  }

  tokenCache.token = String(payload.token)
  tokenCache.expiresAtMs = now + 25 * 60 * 1000
  return tokenCache.token
}

async function requestCommand(command, query = {}) {
  const config = getConfig()
  const token = await authenticate(config)
  const url = buildUrl(config, command, query)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${token}`,
      admin_url: config.adminUrl,
    },
  })

  const text = await response.text()
  let payload = parseJsonMaybe(text)
  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || `Cellxpert request failed (${response.status})`)
    error.status = response.status
    error.details = text.slice(0, 400)
    throw error
  }

  const signedReport = findSignedReport(payload)
  if (signedReport) {
    payload = await fetchSignedReport(signedReport.url)
  }

  const rows = parseRows(payload)
  return {
    ok: true,
    command,
    fetchedAt: new Date().toISOString(),
    count: rows.length,
    data: rows,
    rawType: Array.isArray(payload) ? 'array' : typeof payload,
  }
}

async function requestCommandCached(command, query = {}, { force = false, ttlMs = REPORT_CACHE_TTL_MS } = {}) {
  const key = `${command}:${JSON.stringify(Object.entries(query || {}).sort(([a], [b]) => a.localeCompare(b)))}`
  const now = Date.now()
  if (!force && reportCache.has(key)) {
    const cached = reportCache.get(key)
    if (cached?.expiresAtMs > now) return cached.value
    reportCache.delete(key)
  }

  const promise = requestCommand(command, query)
  reportCache.set(key, { expiresAtMs: now + ttlMs, value: promise })
  try {
    const value = await promise
    reportCache.set(key, { expiresAtMs: Date.now() + ttlMs, value })
    return value
  } catch (error) {
    reportCache.delete(key)
    throw error
  }
}

function dateRangeQuery(req) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const startDate = normalizeDate(req.query?.startDate || req.query?.from || today)
  const endDate = normalizeDate(req.query?.endDate || req.query?.to || today)
  return { startDate, endDate }
}

function historicalDateRangeQuery(req, fallbackFrom = DEFAULT_HISTORICAL_FROM) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const startDate = normalizeDate(req.query?.startDate || req.query?.from || fallbackFrom)
  const endDate = normalizeDate(req.query?.endDate || req.query?.to || today)
  return { startDate, endDate }
}

function reportQuery(req, extra = {}) {
  const { startDate, endDate } = dateRangeQuery(req)
  const query = {
    startDate,
    endDate,
    json: '1',
    JSON: '1',
    ...extra,
  }
  const affiliateId = req.query?.affiliateId || req.query?.bta
  if (affiliateId) query['filter-bta'] = affiliateId
  return query
}

function historicalReportQuery(req, extra = {}) {
  const { startDate, endDate } = historicalDateRangeQuery(req)
  const query = {
    startDate,
    endDate,
    json: '1',
    JSON: '1',
    ...extra,
  }
  const affiliateId = req.query?.affiliateId || req.query?.bta
  if (affiliateId) query['filter-bta'] = affiliateId
  return query
}

function buildAffiliateMonthRows(rows) {
  const acc = new Map()

  for (const row of rows || []) {
    const month = parseMonth(row?.Month || row?.month || row?.Day || row?.date)
    if (!month || !Number.isFinite(month.year) || !Number.isFinite(month.monthIndex)) continue

    const affiliateId = String(row?.BTA || row?.Affiliate_ID || row?.affiliateId || row?.uid || '').trim()
    const affiliateName = String(row?.Affiliate || row?.Affiliate_Username || row?.affiliateName || affiliateId || '—').trim() || '—'
    const id = affiliateId || affiliateName
    if (!id) continue

    const key = `${id}|${month.year}|${month.monthIndex}`
    if (!acc.has(key)) {
      acc.set(key, {
        affiliateId: id,
        affiliateName,
        year: month.year,
        monthIndex: month.monthIndex,
        netDeposits: 0,
        commission: 0,
        pl: 0,
      })
    }

    const item = acc.get(key)
    item.netDeposits += cleanNumber(row?.Net_Deposits ?? row?.netDeposits)
    item.commission += cleanNumber(row?.Commission ?? row?.commission)
    item.pl += cleanNumber(row?.PL ?? row?.pl)
  }

  return Array.from(acc.values()).sort(
    (a, b) => b.year - a.year || b.monthIndex - a.monthIndex || String(a.affiliateId).localeCompare(String(b.affiliateId))
  )
}

const MEDIA_REPORT_HEADERS = [
  'month',
  'affiliate',
  'country',
  'impressions',
  'unique_impressions',
  'ctr',
  'unique_visitors',
  'visitors',
  'leads',
  'registrations',
  'conversion_rate',
  'ftd',
  'qftd',
  'deposits',
  'withdrawals',
  'net_deposits',
  'first_deposits',
  'spread',
  'lot',
  'volume',
  'pl',
  'roi',
  'commission',
  'cpa_commission',
  'cpl_commission',
  'revshare_commission',
  'sub_commission',
  'other_commission',
  'ecpa',
  'ecpl',
  'chargeback_count',
  'chargeback_amount',
  'uid',
].map((key) => ({ key, label: key }))

function normalizeMediaReportRow(row) {
  return {
    month: pick(row, ['Month', 'month', 'Day', 'date']),
    affiliate: pick(row, ['Affiliate', 'affiliate', 'Affiliate_Username']),
    country: pick(row, ['Country', 'country']),
    impressions: pick(row, ['Impressions', 'impressions']),
    unique_impressions: pick(row, ['Unique_Impressions', 'unique_impressions', 'Unique Impressions']),
    ctr: pick(row, ['CTR', 'ctr']),
    unique_visitors: pick(row, ['Unique_Visitors', 'unique_visitors', 'Unique Visitors']),
    visitors: pick(row, ['Visitors', 'visitors']),
    leads: pick(row, ['Leads', 'leads']),
    registrations: pick(row, ['Registrations', 'registrations']),
    conversion_rate: pick(row, ['Conversion_Rate', 'conversion_rate', 'Conversion Rate']),
    ftd: pick(row, ['FTD', 'ftd']),
    qftd: pick(row, ['QFTD', 'qftd']),
    deposits: pick(row, ['Deposits', 'deposits']),
    withdrawals: pick(row, ['Withdrawals', 'withdrawals']),
    net_deposits: pick(row, ['Net_Deposits', 'net_deposits', 'Net Deposits']),
    first_deposits: pick(row, ['First_Deposits', 'first_deposits', 'First Deposits']),
    spread: pick(row, ['Spread', 'spread']),
    lot: pick(row, ['LOT', 'Lots', 'lot', 'lots']),
    volume: pick(row, ['Volume', 'volume']),
    pl: pick(row, ['PL', 'pl']),
    roi: pick(row, ['ROI', 'roi']),
    commission: pick(row, ['Commission', 'commission', 'Commissions']),
    cpa_commission: pick(row, ['CPA_Commission', 'cpa_commission', 'CPA Commission']),
    cpl_commission: pick(row, ['CPL_Commission', 'cpl_commission', 'CPL Commission']),
    revshare_commission: pick(row, ['Revshare_Commission', 'RevShare_Commission', 'revshare_commission']),
    sub_commission: pick(row, ['Sub_Commission', 'Sub_Affiliate_Commission', 'sub_commission']),
    other_commission: pick(row, ['Other_Commission', 'other_commission']),
    ecpa: pick(row, ['ECPA', 'ecpa']),
    ecpl: pick(row, ['ECPL', 'ecpl']),
    chargeback_count: pick(row, ['Chargeback_Count', 'chargeback_count']),
    chargeback_amount: pick(row, ['Chargeback_Amount', 'chargeback_amount']),
    uid: pick(row, ['BTA', 'uid', 'Affiliate_Id', 'Affiliate_ID', 'affiliate_id']),
  }
}

const REGISTRATIONS_REPORT_HEADERS = [
  'user_id',
  'customer_name',
  'mt5_account',
  'external_date',
  'registration_date',
  'country',
  'status',
  'affiliate_id',
  'first_deposit',
  'first_deposit_date',
  'external_ftd_date',
  'qualification_date',
  'net_deposits',
  'deposit_count',
  'withdrawals',
  'total_deposits',
  'pl',
  'net_pl',
  'position_count',
  'volume',
  'lots',
  'spread',
  'roi',
  'commissions',
  'affiliate_commissions',
  'sub_affiliate_commissions',
  'cpa_commission',
  'cpl_commission',
  'revshare_commission',
  'other_commissions',
  'revshare_enabled',
  'fraudchargeback',
  'action',
].map((key) => ({ key, label: key }))

function normalizeRegistrationReportRow(row) {
  return {
    user_id: pick(row, ['User_ID', 'user_id', 'User Id']),
    customer_name: pick(row, ['Customer_Name', 'customer_name', 'Customer Name']),
    mt5_account: pick(row, ['MT5_Account', 'mt5_account', 'MT5 Account']),
    external_date: pick(row, ['External_Date', 'external_date']),
    registration_date: pick(row, ['Registration_Date', 'registration_date', 'Registration Date']),
    country: pick(row, ['Country', 'country']),
    status: pick(row, ['Status', 'status']),
    affiliate_id: pick(row, ['Affiliate_ID', 'Affiliate_Id', 'affiliate_id', 'BTA', 'uid']),
    first_deposit: pick(row, ['First_Deposit', 'first_deposit']),
    first_deposit_date: pick(row, ['First_Deposit_Date', 'first_deposit_date']),
    external_ftd_date: pick(row, ['External_FTD_Date', 'external_ftd_date']),
    qualification_date: pick(row, ['Qualification_Date', 'qualification_date']),
    net_deposits: pick(row, ['Net_Deposits', 'net_deposits']),
    deposit_count: pick(row, ['Deposit_Count', 'deposit_count']),
    withdrawals: pick(row, ['Withdrawals', 'withdrawals']),
    total_deposits: pick(row, ['Total_Deposits', 'total_deposits']),
    pl: pick(row, ['PL', 'pl']),
    net_pl: pick(row, ['Net_PL', 'net_pl']),
    position_count: pick(row, ['Position_Count', 'position_count']),
    volume: pick(row, ['Volume', 'volume']),
    lots: pick(row, ['LOTS', 'Lots', 'lots']),
    spread: pick(row, ['Spread', 'spread']),
    roi: pick(row, ['ROI', 'roi']),
    commissions: pick(row, ['Commissions', 'commissions']),
    affiliate_commissions: pick(row, ['Affiliate_Commissions', 'affiliate_commissions']),
    sub_affiliate_commissions: pick(row, ['Sub_Affiliate_Commissions', 'sub_affiliate_commissions']),
    cpa_commission: pick(row, ['CPA_Commission', 'cpa_commission']),
    cpl_commission: pick(row, ['CPL_Commission', 'cpl_commission']),
    revshare_commission: pick(row, ['Revshare_Commission', 'RevShare_Commission', 'revshare_commission']),
    other_commissions: pick(row, ['Other_Commissions', 'other_commissions']),
    revshare_enabled: pick(row, ['RevShareEnabled', 'revshare_enabled']),
    fraudchargeback: pick(row, ['fraudStatus', 'FraudChargeback', 'fraudchargeback']),
    action: pick(row, ['action', 'Action']),
  }
}

const PAYMENTS_REPORT_HEADERS = [
  'paymentdate',
  'id',
  'affiliate_id',
  'affiliate',
  'payment_range',
  'payment_amount',
  'details',
  'action',
  'amount',
].map((key) => ({ key, label: key }))

function normalizePaymentReportRow(row) {
  const created = pick(row, ['created', 'Created', 'paymentdate', 'PaymentDate'])
  return {
    paymentdate: created,
    id: pick(row, ['id', 'ID']),
    affiliate_id: pick(row, ['Affiliate_Id', 'Affiliate_ID', 'affiliate_id']),
    affiliate: pick(row, ['Affiliate', 'affiliate']),
    payment_range: pick(row, ['Payment_Range', 'payment_range', 'Commission_Type', 'Commission Type']),
    payment_amount: pick(row, ['payment_amount', 'Payment_Amount', 'amount']),
    details: pick(row, ['details', 'Details', 'Reason', 'User_Id', 'User_ID']),
    action: pick(row, ['action', 'Action']),
    amount: pick(row, ['amount', 'Amount']),
  }
}

function buildAffiliateIndex(affiliateRows, performanceRows) {
  const byId = {}
  for (const row of affiliateRows || []) {
    const id = cleanText(pick(row, ['AffiliateID', 'Affiliate_Id', 'Affiliate_ID', 'affiliate_id', 'id', 'BTA', 'uid']))
    const name = cleanText(pick(row, ['Affiliate', 'Username', 'username', 'affiliate', 'Name', 'name']))
    if (id && name && !byId[id]) byId[id] = name
  }
  for (const row of performanceRows || []) {
    const id = cleanText(row?.affiliateId)
    const name = cleanText(row?.affiliateName)
    if (id && name && !byId[id]) byId[id] = name
  }
  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    source: 'cellxpert-admin-api',
    sources: ['browseaffiliatesjson', 'processReport'],
    total: Object.keys(byId).length,
    byId,
  }
}

function buildAffiliateKpiIndex(performanceRows) {
  const index = {}
  for (const row of performanceRows || []) {
    const key = cleanText(row?.affiliateId).toLowerCase()
    if (!key) continue
    if (!index[key]) {
      index[key] = {
        name: cleanText(row?.affiliateName),
        total_commissions: 0,
        kpi: '',
        deposits: 0,
        net_revenue: 0,
        users: 0,
      }
    }
    index[key].total_commissions += cleanNumber(row?.commission)
    index[key].deposits += cleanNumber(row?.netDeposits)
    index[key].net_revenue += cleanNumber(row?.pl)
  }
  return index
}

async function routeCellxpert(req, res, parts) {
  const method = String(req.method || 'GET').toUpperCase()
  if (method !== 'GET') {
    return json(res, 405, { ok: false, error: 'Method not allowed' }, { Allow: 'GET' })
  }

  const path = (Array.isArray(parts) ? parts : []).join('/')
  const config = getConfig()

  try {
    if (!path || path === 'health') {
      if (!config.configured) {
        return json(res, 200, {
          ok: true,
          status: 'not_configured',
          environment: publicConfig(config),
        }, { 'Cache-Control': 'no-store' })
      }

      await authenticate(config, { force: String(req.query?.force || '') === '1' })
      return json(res, 200, {
        ok: true,
        status: 'pass',
        environment: publicConfig(config),
        authenticatedAt: new Date().toISOString(),
      }, { 'Cache-Control': 'no-store' })
    }

    if (path === 'affiliates') {
      const status = String(req.query?.status || 'Approved').trim()
      const limit = parseLimit(req.query?.limit, 200)
      const payload = await requestCommand('browseaffiliatesjson', {
        status,
        OrderBy: req.query?.orderBy || 'created',
        OrderDirection: req.query?.orderDirection || 'DESC',
        SearchQuery: req.query?.search || '',
      })
      payload.data = payload.data.slice(0, limit)
      payload.count = payload.data.length
      return json(res, 200, payload, { 'Cache-Control': 'no-store' })
    }

    if (path === 'registrations') {
      return json(res, 200, await requestCommand('processregreport', reportQuery(req, {
        daterange: req.query?.daterange || 'registrationdate',
        DateFormat: req.query?.dateFormat || 'Day',
        Day: 'true',
        day: 'true',
      })), { 'Cache-Control': 'no-store' })
    }

    if (path === 'performance') {
      const payload = await requestCommand('processReport', reportQuery(req, {
        daterange: req.query?.daterange || 'registrationdate',
        DateFormat: req.query?.dateFormat || 'Month',
        day: 'true',
        Month: 'true',
        Affiliate: 'true',
        BTA: 'true',
      }))
      const rows = buildAffiliateMonthRows(payload.data)
      return json(res, 200, {
        ok: true,
        command: payload.command,
        fetchedAt: payload.fetchedAt,
        count: rows.length,
        rows,
        data: rows,
        source: 'cellxpert-admin-api',
      }, { 'Cache-Control': 'no-store' })
    }

    if (path === 'media-report.csv') {
      const payload = await requestCommandCached('processReport', historicalReportQuery(req, {
        daterange: req.query?.daterange || 'registrationdate',
        DateFormat: req.query?.dateFormat || 'Month',
        day: 'true',
        Month: 'true',
        Affiliate: 'true',
        BTA: 'true',
        Country: 'true',
      }), { force: String(req.query?.force || '') === '1' })
      const rows = payload.data.map(normalizeMediaReportRow)
      return text(res, 200, rowsToCsv(MEDIA_REPORT_HEADERS, rows), {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
      })
    }

    if (path === 'registrations-report.csv') {
      const payload = await requestCommandCached('processregreport', historicalReportQuery(req, {
        daterange: req.query?.daterange || 'registrationdate',
        DateFormat: req.query?.dateFormat || 'Day',
        Day: 'true',
        day: 'true',
        Affiliate: 'true',
        BTA: 'true',
      }), { force: String(req.query?.force || '') === '1' })
      const rows = payload.data.map(normalizeRegistrationReportRow)
      return text(res, 200, rowsToCsv(REGISTRATIONS_REPORT_HEADERS, rows), {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
      })
    }

    if (path === 'payments-report.csv') {
      const payload = await requestCommandCached('commissionsReportJSON', historicalReportQuery(req), {
        force: String(req.query?.force || '') === '1',
      })
      const rows = payload.data.map(normalizePaymentReportRow)
      return text(res, 200, rowsToCsv(PAYMENTS_REPORT_HEADERS, rows), {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
      })
    }

    if (path === 'affiliate-index.json') {
      const [affiliates, performance] = await Promise.all([
        requestCommandCached('browseaffiliatesjson', {
          status: String(req.query?.status || 'Approved').trim(),
          OrderBy: 'created',
          OrderDirection: 'DESC',
        }, { force: String(req.query?.force || '') === '1' }).catch(() => ({ data: [] })),
        requestCommandCached('processReport', historicalReportQuery(req, {
          daterange: 'registrationdate',
          DateFormat: 'Month',
          day: 'true',
          Month: 'true',
          Affiliate: 'true',
          BTA: 'true',
        }), { force: String(req.query?.force || '') === '1' })
          .then((payload) => ({ data: buildAffiliateMonthRows(payload.data) }))
          .catch(() => ({ data: [] })),
      ])
      return json(res, 200, buildAffiliateIndex(affiliates.data, performance.data), {
        'Cache-Control': 'no-store',
      })
    }

    if (path === 'affiliate-kpi-index.json') {
      const performance = await requestCommandCached('processReport', historicalReportQuery(req, {
        daterange: 'registrationdate',
        DateFormat: 'Month',
        day: 'true',
        Month: 'true',
        Affiliate: 'true',
        BTA: 'true',
      }), { force: String(req.query?.force || '') === '1' })
      return json(res, 200, buildAffiliateKpiIndex(buildAffiliateMonthRows(performance.data)), {
        'Cache-Control': 'no-store',
      })
    }

    if (path === 'pixel-logs') {
      const query = reportQuery(req)
      const affiliateId = req.query?.affiliateId || req.query?.bta
      if (affiliateId) query['filter-affiliateid'] = affiliateId
      return json(res, 200, await requestCommand('pixellogjson', query), { 'Cache-Control': 'no-store' })
    }

    if (path === 'commissions') {
      return json(res, 200, await requestCommand('commissionsReportJSON', reportQuery(req)), { 'Cache-Control': 'no-store' })
    }

    if (path === 'transactions') {
      return json(res, 200, await requestCommand('transactionsReportJSON', reportQuery(req)), { 'Cache-Control': 'no-store' })
    }

    if (path === 'positions') {
      return json(res, 200, await requestCommand('positionsReportJSON', reportQuery(req, {
        daterange: req.query?.daterange || 'created date',
      })), { 'Cache-Control': 'no-store' })
    }

    if (path === 'payments') {
      return json(res, 200, await requestCommand('paymentsReportJSON', reportQuery(req)), { 'Cache-Control': 'no-store' })
    }

    if (path === 'balances') {
      return json(res, 200, await requestCommand('processbalancereport', reportQuery(req)), { 'Cache-Control': 'no-store' })
    }

    if (path === 'snapshot') {
      const limit = parseLimit(req.query?.limit, 25)
      const pixelQuery = reportQuery(req)
      const affiliateId = req.query?.affiliateId || req.query?.bta
      if (affiliateId) pixelQuery['filter-affiliateid'] = affiliateId

      const [health, affiliates, registrations, pixelLogs] = await Promise.allSettled([
        authenticate(config).then(() => ({ ok: true })),
        requestCommand('browseaffiliatesjson', { status: 'Approved', OrderBy: 'created', OrderDirection: 'DESC' }),
        requestCommand('processregreport', reportQuery(req, { daterange: 'registrationdate', DateFormat: 'Day', Day: 'true', day: 'true' })),
        requestCommand('pixellogjson', pixelQuery),
      ])
      return json(res, 200, {
        ok: true,
        fetchedAt: new Date().toISOString(),
        health: health.status === 'fulfilled' ? health.value : { ok: false, error: health.reason?.message || 'failed' },
        affiliates: affiliates.status === 'fulfilled' ? { ...affiliates.value, data: affiliates.value.data.slice(0, limit) } : { ok: false, error: affiliates.reason?.message || 'failed' },
        registrations: registrations.status === 'fulfilled' ? registrations.value : { ok: false, error: registrations.reason?.message || 'failed' },
        pixelLogs: pixelLogs.status === 'fulfilled' ? pixelLogs.value : { ok: false, error: pixelLogs.reason?.message || 'failed' },
      }, { 'Cache-Control': 'no-store' })
    }

    return json(res, 404, { ok: false, error: 'Not found' })
  } catch (error) {
    return json(res, error?.code === 'cellxpert_not_configured' ? 200 : 502, {
      ok: false,
      status: error?.code === 'cellxpert_not_configured' ? 'not_configured' : 'fail',
      error: error?.message || 'Cellxpert request failed.',
      details: error?.details || '',
      environment: publicConfig(config),
    }, { 'Cache-Control': 'no-store' })
  }
}

module.exports = {
  routeCellxpert,
}
