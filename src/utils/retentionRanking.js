// Retention ranking utilities
// - Robust header normalization + column resolving
// - XLSX ingest (client-side)
// - Client-by-month aggregation (fast range filtering)
// - Scoring + tiering
//
// Notes:
// - Keep functions pure where possible to enable memoization in React.
// - Parsing is intentionally tolerant (currencies, commas, Excel serial dates, etc).

import * as XLSX from 'xlsx'

const MONTH_NAME_TO_NUM = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

export const COLUMN_VARIANTS = {
  client_id: ['client_id', 'clientid', 'id'],
  client_name: ['client_name', 'clientname', 'name', 'client'],
  country: ['country', 'geo', 'nationality'],
  trades: ['trades', '#trades', 'no_trades', 'num_trades'],
  deposit: ['deposit', 'deposits', '$deposit', 'amount_deposit'],
  wd: ['wd', 'withdrawal', 'withdrawals', '$wd'],
  closed_pl: [
    'closed_pl',
    'closedp_l',
    '$closed_pl',
    'closedpl',
    'pnl_closed',
    'closed_pnl',
    // Creolabs breakdown artifacts use `pl`.
    'pl',
  ],
  net: ['net', '$net', 'net_deposit', 'netdeposit'],
  // Creolabs breakdown artifacts use `periodId` like `2024-Mar`.
  year_month: ['year_month', 'yearmonth', 'periodid', 'period_id', 'month', 'ym'],
}

export const REQUIRED_FOR_SCORING = ['client_id', 'trades', 'deposit', 'wd', 'closed_pl']

export function normalizeHeader(h) {
  const raw = String(h ?? '')
    .trim()
    .toLowerCase()
  if (!raw) return ''

  // 1) Replace whitespace with underscores
  // 2) Remove any non-alphanumeric chars (keep underscores)
  // 3) Collapse underscores and trim
  const withUnderscore = raw.replace(/\s+/g, '_')
  const stripped = withUnderscore.replace(/[^a-z0-9_]/g, '')
  const collapsed = stripped.replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  return collapsed
}

export function parseNumberSafe(value) {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  // Excel can surface booleans/nulls; treat them as 0.
  if (typeof value === 'boolean') return value ? 1 : 0

  let s = String(value).trim()
  if (!s) return 0

  // Handle (123.45) => -123.45
  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1).trim()
  }

  // Remove currency symbols/letters but keep digits, separators and sign.
  s = s.replace(/\s+/g, '')
  s = s.replace(/[^0-9.,+-]/g, '')

  // Normalize sign: keep a single leading '-'
  if (s.includes('-')) {
    const hasLeading = s[0] === '-'
    s = s.replace(/-/g, '')
    if (hasLeading) s = `-${s}`
  }

  // Heuristics for comma/dot handling:
  // - If both present: decide decimal by last separator.
  // - If only comma: decide thousands vs decimal by grouping.
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma > lastDot) {
      // 1.234,56 => 1234.56
      s = s.replace(/\./g, '').replace(/,/g, '.')
    } else {
      // 1,234.56 => 1234.56
      s = s.replace(/,/g, '')
    }
  } else if (hasComma && !hasDot) {
    const parts = s.split(',')
    const last = parts[parts.length - 1] || ''
    // If we have multiple commas and the last group is exactly 3 digits, treat as thousands separators.
    if (parts.length > 2 && /^\d{3}$/.test(last)) {
      s = parts.join('')
    } else if (parts.length === 2 && /^\d{3}$/.test(last) && /^\d{1,3}$/.test(parts[0] || '')) {
      // 12,345 => 12345
      s = parts.join('')
    } else {
      // 123,45 => 123.45
      s = s.replace(/,/g, '.')
    }
  } else {
    // dot only or none => ok
  }

  const n = Number.parseFloat(s)
  if (!Number.isFinite(n)) return 0
  const out = negative ? -Math.abs(n) : n
  return Number.isFinite(out) ? out : 0
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function excelSerialToDateUtc(serial) {
  const n = Number(serial)
  if (!Number.isFinite(n)) return null
  // Excel date serial: days since 1899-12-30 (common JS convention for XLSX libs)
  const ms = Date.UTC(1899, 11, 30) + Math.round(n) * 86400000
  const d = new Date(ms)
  return Number.isFinite(d.getTime()) ? d : null
}

export function parseYearMonthSafe(raw) {
  if (raw === null || raw === undefined) return null

  // Already parsed
  if (typeof raw === 'object' && raw && raw.id && raw.year && raw.month) {
    const y = Number(raw.year)
    const m = Number(raw.month)
    if (!y || !m) return null
    return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
  }

  if (raw instanceof Date) {
    const y = raw.getUTCFullYear()
    const m = raw.getUTCMonth() + 1
    if (!y || !m) return null
    return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
  }

  if (typeof raw === 'number') {
    const n = Number(raw)
    if (!Number.isFinite(n)) return null

    // 202601 style
    const int = Math.floor(Math.abs(n))
    if (int >= 190001 && int <= 250012 && String(int).length === 6) {
      const y = Math.floor(int / 100)
      const m = int % 100
      if (y >= 1900 && y <= 2500 && m >= 1 && m <= 12) {
        return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
      }
    }

    // Excel serial date
    const d = excelSerialToDateUtc(n)
    if (d) {
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      if (y && m) return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
    }

    return null
  }

  const s = String(raw).trim()
  if (!s) return null

  // YYYY-MM or YYYY/MM
  const m1 = s.match(/^(\d{4})\s*[-\/]\s*(\d{1,2})$/)
  if (m1) {
    const y = Number(m1[1])
    const m = Number(m1[2])
    if (y >= 1900 && y <= 2500 && m >= 1 && m <= 12) {
      return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
    }
  }

  // YYYYMM
  const m2 = s.match(/^(\d{4})\s*(\d{2})$/)
  if (m2) {
    const y = Number(m2[1])
    const m = Number(m2[2])
    if (y >= 1900 && y <= 2500 && m >= 1 && m <= 12) {
      return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
    }
  }

  // YYYY-Mon / YYYY-Month (e.g. 2024-Mar)
  const m2b = s.match(/^(\d{4})\s*[-\/]\s*([A-Za-z]{3,})$/)
  if (m2b) {
    const y = Number(m2b[1])
    const monName = String(m2b[2]).toLowerCase()
    const m = MONTH_NAME_TO_NUM[monName]
    if (y >= 1900 && y <= 2500 && m) {
      return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
    }
  }

  // Jan 2026 / January 2026
  const m3 = s.match(/^([A-Za-z]{3,})\s+(\d{4})$/)
  if (m3) {
    const monName = String(m3[1]).toLowerCase()
    const y = Number(m3[2])
    const m = MONTH_NAME_TO_NUM[monName]
    if (y >= 1900 && y <= 2500 && m) {
      return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
    }
  }

  // 2026 Jan / 2026 January
  const m4 = s.match(/^(\d{4})\s+([A-Za-z]{3,})$/)
  if (m4) {
    const y = Number(m4[1])
    const monName = String(m4[2]).toLowerCase()
    const m = MONTH_NAME_TO_NUM[monName]
    if (y >= 1900 && y <= 2500 && m) {
      return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
    }
  }

  // Fallback: try Date.parse (e.g. "Jan 2026", "2026-01-01")
  const ms = Date.parse(s)
  if (Number.isFinite(ms)) {
    const d = new Date(ms)
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    if (y >= 1900 && y <= 2500 && m >= 1 && m <= 12) {
      return { id: `${y}-${pad2(m)}`, year: y, month: m, key: y * 100 + m }
    }
  }

  return null
}

export function monthsDiff(a, b) {
  const pa =
    typeof a === 'string' || typeof a === 'number' || a instanceof Date ? parseYearMonthSafe(a) : a
  const pb =
    typeof b === 'string' || typeof b === 'number' || b instanceof Date ? parseYearMonthSafe(b) : b
  if (!pa || !pb) return null
  const dy = Number(pb.year) - Number(pa.year)
  const dm = Number(pb.month) - Number(pa.month)
  if (!Number.isFinite(dy) || !Number.isFinite(dm)) return null
  return dy * 12 + dm
}

export function resolveColumn(
  availableHeaders = [],
  canonicalKey,
  variantsByKey = COLUMN_VARIANTS
) {
  const target = normalizeHeader(canonicalKey)
  const headers = Array.isArray(availableHeaders) ? availableHeaders : []

  // Map normalized header -> original header key as it appears in `row` objects.
  // This lets us support both:
  // - XLSX-ingested rows (already normalized keys)
  // - JSON artifacts like creolabs_clients_table.json (camelCase keys)
  const normToOriginal = new Map()
  for (const h of headers) {
    const norm = normalizeHeader(h)
    if (!norm) continue
    if (!normToOriginal.has(norm)) normToOriginal.set(norm, h)
  }

  const variants = [target, ...(variantsByKey?.[target] || [])]
  for (const v0 of variants) {
    const v = normalizeHeader(v0)
    const original = v ? normToOriginal.get(v) : ''
    if (original) return original
  }

  return ''
}

function ensureUniqueHeaders(headers) {
  const seen = new Map()
  return headers.map((h) => {
    const base = normalizeHeader(h)
    if (!base) return ''
    const c = seen.get(base) || 0
    seen.set(base, c + 1)
    return c === 0 ? base : `${base}_${c + 1}`
  })
}

export async function readXlsxToRows(fileOrArrayBuffer, { sheetIndex = 0 } = {}) {
  const buffer =
    fileOrArrayBuffer && typeof fileOrArrayBuffer.arrayBuffer === 'function'
      ? await fileOrArrayBuffer.arrayBuffer()
      : fileOrArrayBuffer

  if (!buffer) return { rows: [], headers: [] }

  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames?.[sheetIndex] || wb.SheetNames?.[0]
  if (!sheetName) return { rows: [], headers: [] }
  const sheet = wb.Sheets[sheetName]

  const aoa = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: true,
  })

  if (!Array.isArray(aoa) || !aoa.length) return { rows: [], headers: [] }

  const rawHeaders = Array.isArray(aoa[0]) ? aoa[0] : []
  const headers = ensureUniqueHeaders(rawHeaders)

  const rows = []
  for (let i = 1; i < aoa.length; i += 1) {
    const line = aoa[i]
    if (!Array.isArray(line)) continue

    // Skip totally empty lines
    let hasAny = false
    for (const v of line) {
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        hasAny = true
        break
      }
    }
    if (!hasAny) continue

    const obj = {}
    for (let j = 0; j < headers.length; j += 1) {
      const key = headers[j]
      if (!key) continue
      obj[key] = line[j]
    }
    rows.push(obj)
  }

  return { rows, headers }
}

function resolveSchema(headers) {
  const resolved = {}
  for (const canonical of Object.keys(COLUMN_VARIANTS)) {
    resolved[canonical] = resolveColumn(headers, canonical, COLUMN_VARIANTS)
  }

  const missingRequired = REQUIRED_FOR_SCORING.filter((k) => !resolved[k])
  const missing = [...missingRequired]
  if (!resolved.year_month) missing.push('year_month')

  return {
    ...resolved,
    hasNet: Boolean(resolved.net),
    scoringEnabled: missingRequired.length === 0,
    periodEnabled: Boolean(resolved.year_month),
    missingFields: missing,
  }
}

function coerceString(v) {
  const s = String(v ?? '').trim()
  return s
}

function coerceTrades(v) {
  const n = parseNumberSafe(v)
  const asInt = Math.floor(Math.max(0, n))
  return Number.isFinite(asInt) ? asInt : 0
}

export function buildClientMonthAggregate({ rows = [], headers = [] } = {}) {
  const safeRows = Array.isArray(rows) ? rows : []
  const safeHeaders = Array.isArray(headers) ? headers : []
  const schema = resolveSchema(safeHeaders.length ? safeHeaders : Object.keys(safeRows[0] || {}))

  const byClient = new Map()
  const monthsSet = new Set()
  const countriesSet = new Set()

  for (const row of safeRows) {
    const clientId = coerceString(row?.[schema.client_id])
    if (!clientId) continue

    const ym = schema.year_month ? parseYearMonthSafe(row?.[schema.year_month]) : null
    const ymId = ym?.id || 'unknown'
    const ymKey = ym?.key || 0

    if (ymId && ymId !== 'unknown') monthsSet.add(ymId)

    const name = schema.client_name ? coerceString(row?.[schema.client_name]) : ''
    const country = schema.country ? coerceString(row?.[schema.country]) : ''
    if (country) countriesSet.add(country)

    const deposit = schema.deposit ? parseNumberSafe(row?.[schema.deposit]) : 0
    const wd = schema.wd ? parseNumberSafe(row?.[schema.wd]) : 0
    const net = schema.net ? parseNumberSafe(row?.[schema.net]) : 0
    const closedPL = schema.closed_pl ? parseNumberSafe(row?.[schema.closed_pl]) : 0
    const trades = schema.trades ? coerceTrades(row?.[schema.trades]) : 0

    let client = byClient.get(clientId)
    if (!client) {
      client = {
        clientId,
        clientName: name,
        country,
        months: new Map(),
      }
      byClient.set(clientId, client)
    } else {
      // Keep latest non-empty labels.
      if (name) client.clientName = name
      if (country) client.country = country
    }

    let m = client.months.get(ymId)
    if (!m) {
      m = {
        yearMonth: ymId,
        ymKey,
        deposit: 0,
        wd: 0,
        net: 0,
        closedPL: 0,
        trades: 0,
        depositFrequency: 0,
      }
      client.months.set(ymId, m)
    }

    if (Number.isFinite(deposit)) m.deposit += deposit
    if (Number.isFinite(wd)) m.wd += wd
    if (Number.isFinite(net)) m.net += net
    if (Number.isFinite(closedPL)) m.closedPL += closedPL
    if (Number.isFinite(trades)) m.trades += trades

    if (deposit > 0) m.depositFrequency += 1
  }

  const months = [...monthsSet].sort()
  const countries = [...countriesSet].sort((a, b) => a.localeCompare(b))

  return {
    byClient,
    months,
    countries,
    schema,
    missingFields: schema.missingFields,
    scoringEnabled: schema.scoringEnabled,
    periodEnabled: schema.periodEnabled,
    rowCount: safeRows.length,
    clientCount: byClient.size,
  }
}

function keyToYearMonth(key) {
  const k = Number(key)
  if (!Number.isFinite(k) || k <= 0) return null
  const y = Math.floor(k / 100)
  const m = k % 100
  if (y < 1900 || y > 2500 || m < 1 || m > 12) return null
  return { year: y, month: m, id: `${y}-${pad2(m)}`, key: y * 100 + m }
}

export function aggregateClientsForRange({
  byClient,
  schema,
  fromMonth,
  toMonth,
  mode = 'all',
} = {}) {
  if (!byClient || !(byClient instanceof Map)) return []
  const hasNet = Boolean(schema?.hasNet)

  const from = mode === 'range' ? parseYearMonthSafe(fromMonth) : null
  const to = mode === 'range' ? parseYearMonthSafe(toMonth) : null
  const fromKey = from?.key || 0
  const toKey = to?.key || 999999
  const startKey = Math.min(fromKey || 0, toKey || 0)
  const endKey = Math.max(fromKey || 0, toKey || 0)
  const useRange = mode === 'range' && Boolean(from && to)

  const out = []

  for (const client of byClient.values()) {
    let totalDeposit = 0
    let totalWithdrawals = 0
    let netSum = 0
    let totalTrades = 0
    let closedPL = 0
    let depositFrequency = 0

    let activeMonths = 0
    let firstKey = Infinity
    let lastKey = 0

    for (const m of client.months.values()) {
      if (m.yearMonth !== 'unknown') {
        const k = Number(m.ymKey) || 0
        if (useRange && (k < startKey || k > endKey)) continue

        activeMonths += 1
        if (k && k < firstKey) firstKey = k
        if (k && k > lastKey) lastKey = k
      } else {
        // No year_month column in source file: include everything.
        if (useRange) continue
        activeMonths = Math.max(activeMonths, 1)
      }

      totalDeposit += Number(m.deposit || 0)
      totalWithdrawals += Number(m.wd || 0)
      netSum += Number(m.net || 0)
      closedPL += Number(m.closedPL || 0)
      totalTrades += Number(m.trades || 0)
      depositFrequency += Number(m.depositFrequency || 0)
    }

    // If a range is selected, skip clients with zero activity in-range.
    if (useRange && (!Number.isFinite(activeMonths) || activeMonths <= 0)) continue

    const netDeposit = hasNet ? netSum : totalDeposit - totalWithdrawals

    const first =
      Number.isFinite(firstKey) && firstKey !== Infinity ? keyToYearMonth(firstKey) : null
    const last = lastKey ? keyToYearMonth(lastKey) : null

    const span =
      first && last
        ? Math.max(1, (last.year - first.year) * 12 + (last.month - first.month) + 1)
        : Math.max(1, activeMonths || 0)

    out.push({
      clientId: client.clientId,
      clientName: client.clientName || '',
      country: client.country || '',
      totalDeposit,
      totalWithdrawals,
      netDeposit,
      totalTrades,
      closedPL,
      brokerProfit: Math.abs(closedPL || 0),
      depositFrequency,
      activeMonths: Math.max(0, activeMonths || 0),
      firstMonth: first?.id || '',
      lastMonth: last?.id || '',
      activitySpanMonths: span,
    })
  }

  return out
}

export function computeScores(clients = [], { enabled = true } = {}) {
  if (!Array.isArray(clients)) return []
  if (!enabled) {
    return clients.map((c) => ({ ...c, tvs: null, lvs: null, rewardTier: '—' }))
  }

  return clients.map((c) => {
    const netDeposit = Number(c.netDeposit || 0)
    const brokerProfit = Number(c.brokerProfit || 0)
    const totalTrades = Math.max(0, Math.floor(Number(c.totalTrades) || 0))
    const depositFrequency = Math.max(0, Math.floor(Number(c.depositFrequency) || 0))
    const totalDeposit = Number(c.totalDeposit || 0)
    const span = Math.max(1, Math.floor(Number(c.activitySpanMonths) || 1))

    const tvs =
      netDeposit * 0.4 + brokerProfit * 0.3 + totalTrades * 10 * 0.2 + depositFrequency * 0.1

    const depositPerMonth = totalDeposit / Math.max(1, span)
    const lvs = netDeposit * 0.35 + totalTrades * 0.25 + span * 200 * 0.2 + depositPerMonth * 0.2

    let rewardTier = 'No Reward'
    if (tvs > 10000) rewardTier = 'VIP Gift'
    else if (tvs > 5000) rewardTier = 'Premium Gift'
    else if (tvs > 2000) rewardTier = 'Standard Gift'

    return {
      ...c,
      tvs,
      lvs,
      rewardTier,
      depositPerMonth,
    }
  })
}
