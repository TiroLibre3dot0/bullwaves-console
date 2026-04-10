const fs = require('fs')
const path = require('path')

const ROOT_DIR = path.join(__dirname, '..')
const INPUT_PATH = path.join(ROOT_DIR, 'public', 'prime_clients_ranking_table.json')
const OUT_PATH = path.join(ROOT_DIR, 'public', 'embed', 'prime-contest.json')

const COLUMN_VARIANTS = {
  client_id: ['client_id', 'clientid', 'id'],
  client_name: ['client_name', 'clientname', 'name', 'client'],
  country: ['country', 'geo'],
  date: ['date', 'day', 'report_date', 'trade_date'],
  year: ['year'],
  month: ['month'],
  year_month: ['year_month', 'yearmonth', 'periodid', 'period_id'],
  closed_pl: ['closed_pl', 'closedpl', 'pl', 'pnl', 'profit_loss'],
  trades: ['trades', '#trades', 'num_trades', 'no_trades'],
  wd: ['wd', 'withdrawal', 'withdrawals'],
  payout_user: ['payout_user', 'is_payout_user', 'paid_out', 'paidout'],
  payout_count: ['payout_count', 'payouts', 'paid_count'],
  payout_amount: ['payout_amount', 'paid_amount', 'total_payout'],
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function resolveColumn(headers, canonical) {
  const variants = COLUMN_VARIANTS[canonical] || []
  const byNormalized = new Map()
  for (const header of headers) {
    const normalized = normalizeHeader(header)
    if (normalized && !byNormalized.has(normalized)) {
      byNormalized.set(normalized, String(header))
    }
  }

  for (const variant of variants) {
    const hit = byNormalized.get(normalizeHeader(variant))
    if (hit) return hit
  }

  return null
}

function buildHeaderIndex(headers) {
  const map = new Map()
  for (let index = 0; index < headers.length; index += 1) {
    map.set(String(headers[index] || ''), index)
  }
  return map
}

function getRowValue(row, columnName, headerIndex, fallbackKeys = []) {
  if (Array.isArray(row)) {
    const index = headerIndex.get(String(columnName || ''))
    return Number.isInteger(index) ? row[index] : undefined
  }

  if (row && typeof row === 'object') {
    if (columnName && Object.prototype.hasOwnProperty.call(row, columnName)) return row[columnName]
    for (const key of fallbackKeys) {
      if (Object.prototype.hasOwnProperty.call(row, key)) return row[key]
    }
  }

  return undefined
}

function parseNumberSafe(value) {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'boolean') return value ? 1 : 0

  let text = String(value).trim()
  if (!text) return 0

  let negative = false
  if (/^\(.*\)$/.test(text)) {
    negative = true
    text = text.slice(1, -1).trim()
  }

  text = text.replace(/\s+/g, '')
  text = text.replace(/[^0-9.,+-]/g, '')

  if (text.includes('-')) {
    const keepLeadingMinus = text[0] === '-'
    text = text.replace(/-/g, '')
    if (keepLeadingMinus) text = `-${text}`
  }

  const hasComma = text.includes(',')
  const hasDot = text.includes('.')

  if (hasComma && hasDot) {
    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
      text = text.replace(/\./g, '').replace(/,/g, '.')
    } else {
      text = text.replace(/,/g, '')
    }
  } else if (hasComma) {
    const parts = text.split(',')
    const lastPart = parts[parts.length - 1] || ''
    if (parts.length > 1 && /^\d{3}$/.test(lastPart)) {
      text = parts.join('')
    } else {
      text = text.replace(/,/g, '.')
    }
  }

  const parsed = Number.parseFloat(text)
  if (!Number.isFinite(parsed)) return 0
  return negative ? -Math.abs(parsed) : parsed
}

function coerceString(value) {
  return String(value || '').trim()
}

function coerceBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) && value > 0
  const text = String(value || '')
    .trim()
    .toLowerCase()
  return ['1', 'true', 'yes', 'y', 'paid', 'payout'].includes(text)
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function buildPeriodKey(year, month) {
  const y = Math.floor(Number(year))
  const m = Math.floor(Number(month))
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return ''
  return `${y}-${pad2(m)}`
}

function parsePeriodValue(raw) {
  if (raw == null || raw === '') return null

  const text = String(raw).trim()
  if (!text) return null

  const isoMatch = text.match(/(\d{4})\s*[-/._\s]\s*(\d{1,2})/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    if (year >= 1900 && year < 3000 && month >= 1 && month <= 12) return { year, month }
  }

  const compactMatch = text.match(/\b(\d{4})(\d{2})\b/)
  if (compactMatch) {
    const year = Number(compactMatch[1])
    const month = Number(compactMatch[2])
    if (year >= 1900 && year < 3000 && month >= 1 && month <= 12) return { year, month }
  }

  const parsedDate = Date.parse(text)
  if (Number.isFinite(parsedDate)) {
    const date = new Date(parsedDate)
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
  }

  return null
}

function extractPeriod(row, schema, headerIndex) {
  const explicitYear = parseNumberSafe(getRowValue(row, schema.year, headerIndex, ['year']))
  const explicitMonth = parseNumberSafe(getRowValue(row, schema.month, headerIndex, ['month']))
  if (explicitYear >= 1900 && explicitYear < 3000 && explicitMonth >= 1 && explicitMonth <= 12) {
    return buildPeriodKey(explicitYear, explicitMonth)
  }

  const parsed = parsePeriodValue(
    getRowValue(row, schema.year_month, headerIndex, ['year_month', 'periodId', 'period_id']) ||
      getRowValue(row, schema.date, headerIndex, ['date'])
  )
  return parsed ? buildPeriodKey(parsed.year, parsed.month) : ''
}

function maskContestDisplayName(value) {
  const raw = String(value || '').trim()
  if (!raw) return '—'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  if (parts.length === 1) return `${parts[0].charAt(0).toUpperCase()}.`
  const firstName = parts[0]
  const surnameInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${firstName} ${surnameInitial}.`
}

function formatMonthLabel(periodKey) {
  const match = String(periodKey || '').match(/^(\d{4})-(\d{2})$/)
  if (!match) return 'Current Month'
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month, 1)))
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function buildContestPayload(artifact) {
  const headers = Array.isArray(artifact?.headers) ? artifact.headers : []
  const rows = Array.isArray(artifact?.rows) ? artifact.rows : []
  const headerIndex = buildHeaderIndex(headers)
  const schema = {}
  for (const key of Object.keys(COLUMN_VARIANTS)) {
    schema[key] = resolveColumn(headers, key)
  }

  let latestPeriodKey = ''
  for (const row of rows) {
    const periodKey = extractPeriod(row, schema, headerIndex)
    if (periodKey && periodKey > latestPeriodKey) latestPeriodKey = periodKey
  }

  const byClient = new Map()
  for (const row of rows) {
    if (latestPeriodKey) {
      const rowPeriodKey = extractPeriod(row, schema, headerIndex)
      if (rowPeriodKey !== latestPeriodKey) continue
    }

    const clientId = coerceString(getRowValue(row, schema.client_id, headerIndex, ['client_id']))
    if (!clientId) continue

    const clientName = coerceString(
      getRowValue(row, schema.client_name, headerIndex, ['client_name', 'clientName'])
    )
    const country = coerceString(getRowValue(row, schema.country, headerIndex, ['country']))

    const current = byClient.get(clientId) || {
      clientId,
      clientName: clientName || '',
      country: country || '',
      totalTrades: 0,
      closedPL: 0,
      payoutCount: 0,
      payoutAmount: 0,
      primaryPayoutAmount: 0,
      isPayoutUser: false,
    }

    if (clientName && clientName.length > current.clientName.length) current.clientName = clientName
    if (country && !current.country) current.country = country

    const totalTrades = Math.max(
      0,
      Math.floor(parseNumberSafe(getRowValue(row, schema.trades, headerIndex, ['trades'])))
    )
    const closedPL = parseNumberSafe(getRowValue(row, schema.closed_pl, headerIndex, ['closed_pl', 'pl']))
    const explicitPayoutAmount = parseNumberSafe(
      getRowValue(row, schema.payout_amount, headerIndex, ['payout_amount'])
    )
    const fallbackWithdrawals = parseNumberSafe(getRowValue(row, schema.wd, headerIndex, ['wd']))
    const payoutCount = Math.max(
      0,
      Math.floor(parseNumberSafe(getRowValue(row, schema.payout_count, headerIndex, ['payout_count'])))
    )
    const isPayoutUser =
      coerceBoolean(getRowValue(row, schema.payout_user, headerIndex, ['payout_user'])) ||
      payoutCount > 0 ||
      explicitPayoutAmount > 0

    const primaryPayoutAmount = explicitPayoutAmount > 0 ? explicitPayoutAmount : fallbackWithdrawals

    current.totalTrades += totalTrades
    current.closedPL += closedPL
    current.payoutCount += payoutCount
    current.payoutAmount += explicitPayoutAmount
    current.primaryPayoutAmount += primaryPayoutAmount
    current.isPayoutUser = current.isPayoutUser || isPayoutUser

    byClient.set(clientId, current)
  }

  const ranking = [...byClient.values()]
    .filter((entry) => entry.isPayoutUser || entry.closedPL > 0 || entry.primaryPayoutAmount > 0)
    .sort((left, right) => {
      const payoutDiff = Number(right.primaryPayoutAmount || 0) - Number(left.primaryPayoutAmount || 0)
      if (payoutDiff !== 0) return payoutDiff
      const tradeDiff = Number(right.totalTrades || 0) - Number(left.totalTrades || 0)
      if (tradeDiff !== 0) return tradeDiff
      const closedDiff = Number(right.closedPL || 0) - Number(left.closedPL || 0)
      if (closedDiff !== 0) return closedDiff
      return String(left.clientName || '').localeCompare(String(right.clientName || ''))
    })

  const topEntries = ranking.slice(0, 20).map((entry, index) => ({
    rank: index + 1,
    displayName: maskContestDisplayName(entry.clientName),
    country: entry.country || '—',
    payoutAmount: Math.round(Number(entry.primaryPayoutAmount || 0)),
    totalTrades: Math.round(Number(entry.totalTrades || 0)),
  }))

  const totalPayoutAmount = ranking.reduce(
    (sum, entry) => sum + Math.round(Number(entry.primaryPayoutAmount || 0)),
    0
  )

  return {
    kind: 'prime-contest-embed',
    generatedAt: new Date().toISOString(),
    sourceGeneratedAt: String(artifact?.generatedAt || ''),
    periodKey: latestPeriodKey || '',
    periodLabel: formatMonthLabel(latestPeriodKey),
    updatedAtLabel: new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(new Date()),
    summary: {
      totalContestants: ranking.length,
      totalPayoutAmount,
    },
    rows: topEntries,
  }
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.log(`SKIP prime contest embed generator (missing input): ${path.relative(ROOT_DIR, INPUT_PATH)}`)
    process.exit(0)
  }

  const raw = fs.readFileSync(INPUT_PATH, 'utf8')
  const artifact = JSON.parse(raw)
  const payload = buildContestPayload(artifact)

  ensureDir(OUT_PATH)
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2))
  console.log(`OK wrote ${path.relative(ROOT_DIR, OUT_PATH).replace(/\\/g, '/')} rows=${payload.rows.length}`)
}

try {
  main()
} catch (error) {
  console.error('ERR generate_prime_contest_embed failed')
  console.error(error)
  process.exit(1)
}