import { useEffect, useMemo, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { useQlikStatus } from '../../context/QlikStatusContext'
import {
  canUseCreolabsLocalFallback,
  loadCreolabsQlikClientMonths,
  loadPrimeClientsRankingTable,
  loadPrimeEmailIndex,
  loadTradersRankingRewardsTable,
  logCreolabsQlikFallbackBlocked,
  logCreolabsQlikFallbackUsed,
} from './services/creolabsService'
const moneyFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const intFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const TH = {
  padding: '8px 12px',
  textAlign: 'right',
  fontWeight: 600,
  fontSize: '0.75rem',
  color: '#94a3b8',
  borderBottom: '1px solid rgba(71,85,105,0.4)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  userSelect: 'none',
}
const TH_L = { ...TH, textAlign: 'left' }
const TD = {
  padding: '6px 12px',
  textAlign: 'right',
  fontSize: '0.82rem',
  borderBottom: '1px solid rgba(71,85,105,0.15)',
  whiteSpace: 'nowrap',
}
const TD_L = { ...TD, textAlign: 'left' }

const COMBINED_FOREX_BRAND = 'BW + BW Global'
const BRANDS = [COMBINED_FOREX_BRAND, 'BW', 'BW Global', 'BW Prime']
const PAGE_SIZE = 100
const CONDITIONAL_COLUMN_KEYS = new Set([
  'client_timestamp',
  'ltd_date',
  'ltt_date',
  'equity',
  'clients_p',
  'opened_trades',
  'year',
  'month',
  'week',
  'date',
  'status',
  'last_time_contact',
  'ltc_group',
  'last_time_call',
  'last_time_comment',
  'pl_adjustment',
  'closed_vol',
  'open_vol',
  'open_trades',
  'rdps',
  'stds',
  'rdr',
  'ftds',
  'leads',
  'cr',
  'client_email',
])
const MONTH_ORDER = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
}

const FOREX_COLS = [
  { key: 'brand', label: 'Brand', align: 'left', type: 'text' },
  { key: 'affiliate_id', label: 'Affiliate ID', align: 'left', type: 'text' },
  { key: 'client_id', label: 'Client ID', align: 'left', type: 'text' },
  { key: 'client_name', label: 'Client Name', align: 'left', type: 'text' },
  { key: 'client_login', label: 'Client LOGIN', align: 'left', type: 'text' },
  { key: 'user', label: 'User', align: 'left', type: 'text' },
  { key: 'country', label: 'Country', align: 'left', type: 'text' },
  { key: 'balance', label: '$ Balance', align: 'right', type: 'money' },
  { key: 'ltv_commission', label: 'LTV Commission', align: 'right', type: 'money' },
  { key: 'closed_pl', label: '$ Closed PL', align: 'right', type: 'money' },
  { key: 'open_pl', label: '$ Open PL', align: 'right', type: 'money' },
  { key: 'trades', label: '# Trades', align: 'right', type: 'int' },
  { key: 'ftd', label: '$ FTD', align: 'right', type: 'money' },
  { key: 'rdp', label: '$ RDP', align: 'right', type: 'money' },
  { key: 'deposit', label: '$ Deposit', align: 'right', type: 'money' },
  { key: 'wd', label: '$ WD', align: 'right', type: 'money' },
  { key: 'net', label: '$ Net', align: 'right', type: 'money' },
  { key: 'client_timestamp', label: 'Client Timestamp', align: 'left', type: 'date' },
  { key: 'ltd_date', label: 'LTD Date', align: 'left', type: 'date' },
  { key: 'ltt_date', label: 'LTT Date', align: 'left', type: 'date' },
  { key: 'equity', label: '$ Equity', align: 'right', type: 'money' },
  { key: 'clients_p', label: '# Clients (P)', align: 'right', type: 'int' },
  { key: 'year_month', label: 'Year Month', align: 'left', type: 'text' },
  { key: 'opened_trades', label: '# Opened Trades', align: 'right', type: 'int' },
]

const PRIME_COLS = [
  { key: 'year', label: 'Year', align: 'right', type: 'int' },
  { key: 'month', label: 'Month', align: 'left', type: 'text' },
  { key: 'year_month', label: 'Year Month', align: 'left', type: 'text' },
  { key: 'week', label: 'Week', align: 'left', type: 'text' },
  { key: 'date', label: 'Date', align: 'left', type: 'date' },
  { key: 'brand', label: 'Brand', align: 'left', type: 'text' },
  { key: 'affiliate_id', label: 'Affiliate ID', align: 'left', type: 'text' },
  { key: 'client_id', label: 'Client ID', align: 'left', type: 'text' },
  { key: 'client_name', label: 'Client Name', align: 'left', type: 'text' },
  { key: 'status', label: 'Status', align: 'left', type: 'text' },
  { key: 'country', label: 'Country', align: 'left', type: 'text' },
  { key: 'last_time_contact', label: 'Last Time Contact', align: 'left', type: 'text' },
  { key: 'ltc_group', label: 'LTC Group', align: 'left', type: 'text' },
  { key: 'last_time_call', label: 'Last Time Call', align: 'left', type: 'text' },
  { key: 'last_time_comment', label: 'Last Time Comment', align: 'left', type: 'text' },
  { key: 'pl', label: '$ PL', align: 'right', type: 'money' },
  { key: 'raw_pl', label: '$ Raw PL', align: 'right', type: 'money' },
  { key: 'pl_adjustment', label: '$ PL Adjustment', align: 'right', type: 'money' },
  { key: 'open_pl', label: '$ Open PL', align: 'right', type: 'money' },
  { key: 'closed_pl', label: '$ Closed PL', align: 'right', type: 'money' },
  { key: 'closed_vol', label: '$ Closed VOL', align: 'right', type: 'money' },
  { key: 'open_vol', label: '$ Open VOL', align: 'right', type: 'money' },
  { key: 'traders', label: '# Traders', align: 'right', type: 'int' },
  { key: 'trades', label: '# Trades', align: 'right', type: 'int' },
  { key: 'open_trades', label: '# Open Trades', align: 'right', type: 'int' },
  { key: 'rdp', label: '$ RDP', align: 'right', type: 'money' },
  { key: 'rdps', label: '# RDPs', align: 'right', type: 'int' },
  { key: 'wd', label: '$ WD', align: 'right', type: 'money' },
  { key: 'std', label: '$ STD', align: 'right', type: 'money' },
  { key: 'stds', label: '# STDs', align: 'right', type: 'int' },
  { key: 'ftd', label: '$ FTD', align: 'right', type: 'money' },
  { key: 'deposit', label: '$ Deposit', align: 'right', type: 'money' },
  { key: 'net', label: '$ Net', align: 'right', type: 'money' },
  { key: 'rdr', label: '% RDR', align: 'right', type: 'money' },
  { key: 'ftds', label: '# FTDs', align: 'right', type: 'int' },
  { key: 'leads', label: '# Leads', align: 'right', type: 'int' },
  { key: 'cr', label: '% CR', align: 'right', type: 'money' },
  { key: 'client_email', label: 'Client Email', align: 'left', type: 'text' },
]

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function parseHeaderRows(payload) {
  const headers = Array.isArray(payload?.headers) ? payload.headers : []
  const rows = Array.isArray(payload?.rows) ? payload.rows : []
  return rows.map((row) => {
    const out = {}
    for (let i = 0; i < headers.length; i += 1) out[headers[i]] = row?.[i]
    return out
  })
}

function parseDateValue(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null
  }
  if (typeof value === 'number') {
    const ms = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000
    const date = new Date(ms)
    return Number.isFinite(date.getTime()) ? date : null
  }

  const text = String(value).trim()
  if (!text || text === '-' || text === '—') return null

  const isoMs = Date.parse(text)
  if (Number.isFinite(isoMs)) {
    const date = new Date(isoMs)
    return Number.isFinite(date.getTime()) ? date : null
  }

  const isoLike = text.match(
    /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (isoLike) {
    const year = Number(isoLike[1])
    const month = Number(isoLike[2])
    const day = Number(isoLike[3])
    const hours = isoLike[4] != null ? Number(isoLike[4]) : 0
    const minutes = isoLike[5] != null ? Number(isoLike[5]) : 0
    const seconds = isoLike[6] != null ? Number(isoLike[6]) : 0
    const ms = Date.UTC(year, month - 1, day, hours, minutes, seconds)
    const date = new Date(ms)
    return Number.isFinite(date.getTime()) ? date : null
  }

  const dmy = text.match(
    /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2])
    let year = Number(dmy[3])
    const hours = dmy[4] != null ? Number(dmy[4]) : 0
    const minutes = dmy[5] != null ? Number(dmy[5]) : 0
    const seconds = dmy[6] != null ? Number(dmy[6]) : 0
    if (year >= 0 && year < 100) year += 2000
    const ms = Date.UTC(year, month - 1, day, hours, minutes, seconds)
    const date = new Date(ms)
    return Number.isFinite(date.getTime()) ? date : null
  }

  return null
}

function toIsoDateText(value) {
  const date = parseDateValue(value)
  return date ? date.toISOString() : ''
}

function normalizeText(value) {
  const text = String(value ?? '').trim()
  return text && text !== '-' && text !== '—' ? text : ''
}

function parseYearMonthParts(value) {
  const text = String(value || '').trim()
  const match = text.match(/^(\d{4})-([A-Za-z]{3})$/)
  if (!match) return null
  const year = Number(match[1])
  const monthAbbr = match[2]
  const month = MONTH_ORDER[monthAbbr]
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  return { year, month, monthLabel: monthAbbr }
}

function formatIsoWeek(value) {
  const date = parseDateValue(value)
  if (!date) return ''
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7)
  return `${utc.getUTCFullYear()}-${String(week).padStart(2, '0')}`
}

function pickEarlierDateText(currentValue, nextValue) {
  const currentDate = parseDateValue(currentValue)
  const nextDate = parseDateValue(nextValue)
  if (!currentDate) return nextDate ? nextDate.toISOString() : ''
  if (!nextDate) return currentDate.toISOString()
  return currentDate.getTime() <= nextDate.getTime()
    ? currentDate.toISOString()
    : nextDate.toISOString()
}

function pickLaterDateText(currentValue, nextValue) {
  const currentDate = parseDateValue(currentValue)
  const nextDate = parseDateValue(nextValue)
  if (!currentDate) return nextDate ? nextDate.toISOString() : ''
  if (!nextDate) return currentDate.toISOString()
  return currentDate.getTime() >= nextDate.getTime()
    ? currentDate.toISOString()
    : nextDate.toISOString()
}

function buildTradersDateLookup(payload) {
  const rows = parseHeaderRows(payload)
  const byClientMonth = new Map()
  const byClient = new Map()

  for (const row of rows) {
    const clientId = String(row?.client_id || row?.clientId || '').trim()
    if (!clientId) continue

    const yearMonth = String(row?.year_month || row?.yearMonth || row?.periodId || '').trim()
    const clientTimestamp = toIsoDateText(row?.client_timestamp || row?.clientTimestamp || '')
    const ltdDate = toIsoDateText(row?.ltd_date || row?.lastTradeDate || '')
    const lttDate = toIsoDateText(row?.ltt_date || row?.lastTransactionDate || '')

    const applyDates = (target) => {
      target.client_timestamp = pickEarlierDateText(target.client_timestamp, clientTimestamp)
      const lastTradeCandidate = pickLaterDateText(ltdDate, lttDate)
      target.ltd_date = pickLaterDateText(target.ltd_date, lastTradeCandidate)
      target.ltt_date = pickLaterDateText(target.ltt_date, lttDate)
    }

    if (!byClient.has(clientId)) {
      byClient.set(clientId, {
        client_timestamp: '',
        ltd_date: '',
        ltt_date: '',
      })
    }
    applyDates(byClient.get(clientId))

    if (yearMonth) {
      const clientMonthKey = `${clientId}|${yearMonth}`
      if (!byClientMonth.has(clientMonthKey)) {
        byClientMonth.set(clientMonthKey, {
          client_timestamp: '',
          ltd_date: '',
          ltt_date: '',
        })
      }
      applyDates(byClientMonth.get(clientMonthKey))
    }
  }

  return { byClientMonth, byClient }
}

function getTradersDates(dateLookup, row) {
  const clientId = String(row?.clientId || row?.client_id || '').trim()
  const yearMonth = String(row?.yearMonth || row?.year_month || row?.periodId || '').trim()
  const byClientMonth = dateLookup?.byClientMonth instanceof Map ? dateLookup.byClientMonth : null
  const byClient = dateLookup?.byClient instanceof Map ? dateLookup.byClient : null

  if (clientId && yearMonth && byClientMonth?.has(`${clientId}|${yearMonth}`)) {
    return byClientMonth.get(`${clientId}|${yearMonth}`)
  }
  if (clientId && byClient?.has(clientId)) {
    return byClient.get(clientId)
  }
  return null
}

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function createPrimeDetailsBucket() {
  return {
    year: null,
    month: '',
    year_month: '',
    week: '',
    date: '',
    status: '',
    country: '',
    last_time_contact: '',
    ltc_group: '',
    last_time_call: '',
    last_time_comment: '',
    raw_pl: 0,
    pl_adjustment: 0,
    closed_vol: 0,
    open_vol: 0,
    open_trades: 0,
    rdps: 0,
    stds: 0,
    ftds: 0,
    leads: 0,
    client_email: '',
    _latestDateMs: Number.NEGATIVE_INFINITY,
  }
}

function buildPrimeDetailsLookup(payload) {
  const rows = parseHeaderRows(payload)
  const byClientMonth = new Map()
  const byClient = new Map()
  // Fallback index when ID spaces differ across systems.
  const byClientName = new Map()

  const applyPrimeDetails = (target, row) => {
    const rowDateText = toIsoDateText(
      row?.date || row?.last_time_contact || row?.last_time_call || ''
    )
    const rowDate = parseDateValue(rowDateText)
    const rowDateMs = rowDate ? rowDate.getTime() : Number.NEGATIVE_INFINITY

    target.raw_pl += Number(row?.raw_pl || 0)
    target.pl_adjustment += Number(row?.pl_adjustment || 0)
    target.closed_vol += Number(row?.closed_vol || 0)
    target.open_vol += Number(row?.open_vol || 0)
    target.open_trades += Number(row?.open_trades || 0)
    target.rdps += Number(row?.rdps || 0)
    target.stds += Number(row?.stds || 0)
    target.ftds += Number(row?.ftds || 0)
    target.leads += Number(row?.leads || 0)

    const clientEmail = normalizeText(row?.client_email)
    if (clientEmail && (!target.client_email || clientEmail.includes('@'))) {
      target.client_email = clientEmail
    }

    if (rowDateMs >= target._latestDateMs) {
      target._latestDateMs = rowDateMs
      target.year = Number.isFinite(Number(row?.year)) ? Number(row.year) : target.year
      target.month = normalizeText(row?.month) || target.month
      target.year_month = normalizeText(row?.year_month) || target.year_month
      target.week = normalizeText(row?.week) || target.week
      target.date = rowDateText || target.date
      target.status = normalizeText(row?.status) || target.status
      target.country = normalizeText(row?.country) || target.country
      target.last_time_contact =
        normalizeText(row?.last_time_contact) ||
        normalizeText(row?.last_time_comment) ||
        target.last_time_contact
      target.ltc_group = normalizeText(row?.ltc_group) || target.ltc_group
      target.last_time_call = normalizeText(row?.last_time_call) || target.last_time_call
      target.last_time_comment = normalizeText(row?.last_time_comment) || target.last_time_comment
    }
  }

  for (const row of rows) {
    const clientId = String(row?.client_id || row?.clientId || '').trim()
    if (!clientId) continue

    const clientName = normalizeName(row?.client_name || row?.clientName || '')
    const yearMonth = String(row?.year_month || row?.yearMonth || row?.periodId || '').trim()

    if (!byClient.has(clientId)) byClient.set(clientId, createPrimeDetailsBucket())
    applyPrimeDetails(byClient.get(clientId), row)

    if (clientName) {
      if (!byClientName.has(clientName)) byClientName.set(clientName, createPrimeDetailsBucket())
      applyPrimeDetails(byClientName.get(clientName), row)
    }

    if (yearMonth) {
      const clientMonthKey = `${clientId}|${yearMonth}`
      if (!byClientMonth.has(clientMonthKey))
        byClientMonth.set(clientMonthKey, createPrimeDetailsBucket())
      applyPrimeDetails(byClientMonth.get(clientMonthKey), row)
    }
  }

  const finalizeBucket = (bucket) => ({
    year: bucket.year,
    month: bucket.month,
    year_month: bucket.year_month,
    week: bucket.week,
    date: bucket.date,
    status: bucket.status,
    country: bucket.country,
    last_time_contact: bucket.last_time_contact,
    ltc_group: bucket.ltc_group,
    last_time_call: bucket.last_time_call,
    last_time_comment: bucket.last_time_comment,
    raw_pl: bucket.raw_pl,
    pl_adjustment: bucket.pl_adjustment,
    closed_vol: bucket.closed_vol,
    open_vol: bucket.open_vol,
    open_trades: bucket.open_trades,
    rdps: bucket.rdps,
    stds: bucket.stds,
    ftds: bucket.ftds,
    leads: bucket.leads,
    client_email: bucket.client_email,
  })

  return {
    byClientMonth: new Map(
      [...byClientMonth.entries()].map(([key, bucket]) => [key, finalizeBucket(bucket)])
    ),
    byClient: new Map(
      [...byClient.entries()].map(([key, bucket]) => [key, finalizeBucket(bucket)])
    ),
    byClientName: new Map(
      [...byClientName.entries()].map(([key, bucket]) => [key, finalizeBucket(bucket)])
    ),
  }
}

function getPrimeDetails(lookup, row) {
  const clientId = String(row?.clientId || row?.client_id || '').trim()
  const clientName = normalizeName(row?.clientName || row?.client_name || '')
  const yearMonth = String(row?.yearMonth || row?.year_month || row?.periodId || '').trim()
  const byClientMonth = lookup?.byClientMonth instanceof Map ? lookup.byClientMonth : null
  const byClient = lookup?.byClient instanceof Map ? lookup.byClient : null
  const byClientName = lookup?.byClientName instanceof Map ? lookup.byClientName : null

  if (clientId && yearMonth && byClientMonth?.has(`${clientId}|${yearMonth}`)) {
    return byClientMonth.get(`${clientId}|${yearMonth}`)
  }
  if (clientId && byClient?.has(clientId)) {
    return byClient.get(clientId)
  }
  if (clientName && byClientName?.has(clientName)) {
    return byClientName.get(clientName)
  }
  return null
}

function hasMeaningfulColumnValue(col, value) {
  if (col?.type === 'money' || col?.type === 'int') {
    const n = toNum(value)
    return n != null && n !== 0
  }
  return Boolean(normalizeText(value))
}

function filterVisibleColumns(columns, rows) {
  return columns.filter((col) => {
    if (!CONDITIONAL_COLUMN_KEYS.has(col.key)) return true
    return rows.some((row) => hasMeaningfulColumnValue(col, row?.[col.key]))
  })
}

function mapQlikClientMonthToForexRow(row, dateLookup = null) {
  const closed = Number(row?.pl ?? row?.closedPL ?? 0)
  const open = Number(row?.openPl ?? row?.openPL ?? 0)
  const tradersDates = getTradersDates(dateLookup, row)
  return {
    brand: row?.brand || '',
    affiliate_id: row?.affiliateId || '',
    client_id: row?.clientId || '',
    client_name: row?.clientName || '',
    client_login: row?.clientLogin || '',
    user: row?.user || '',
    country: row?.country || '',
    balance: Number(row?.balance || 0),
    ltv_commission: Number(row?.ltvCommission || 0),
    closed_pl: closed,
    open_pl: open,
    trades: Number(row?.trades || 0),
    ftd: Number(row?.ftd || 0),
    rdp: Number(row?.rdp || 0),
    deposit: Number(row?.deposit || 0),
    wd: Number(row?.wd || 0),
    net: Number(row?.net || 0),
    client_timestamp: tradersDates?.client_timestamp || '',
    ltd_date: tradersDates?.ltd_date || '',
    ltt_date: tradersDates?.ltt_date || '',
    equity: 0,
    clients_p: 0,
    year_month: row?.yearMonth || row?.periodId || '',
    opened_trades: 0,
  }
}

function mapQlikClientMonthToPrimeRow(
  row,
  primeLookup = null,
  tradersDateLookup = null,
  emailIndex = null
) {
  const closed = Number(row?.pl ?? row?.closedPL ?? 0)
  const open = Number(row?.openPl ?? row?.openPL ?? 0)
  const pl = closed + open
  const primeDetails = getPrimeDetails(primeLookup, row)
  const tradersDates = getTradersDates(tradersDateLookup, row)
  const yearMonth = String(row?.yearMonth || row?.periodId || primeDetails?.year_month || '').trim()
  const parsedYearMonth = parseYearMonthParts(yearMonth)
  const detailDate =
    primeDetails?.date ||
    tradersDates?.ltt_date ||
    tradersDates?.ltd_date ||
    tradersDates?.client_timestamp ||
    ''
  const detailWeek = primeDetails?.week || formatIsoWeek(detailDate)
  const detailLeads = Number(primeDetails?.leads || 0)
  const detailFtds = Number(primeDetails?.ftds || 0)
  const detailStds = Number(primeDetails?.stds || 0)
  const detailRdps = Number(primeDetails?.rdps || 0)
  const computedCr = detailLeads > 0 ? (detailFtds / detailLeads) * 100 : 0
  const computedRdr = detailStds > 0 ? (detailRdps / detailStds) * 100 : 0
  return {
    year: primeDetails?.year ?? parsedYearMonth?.year ?? null,
    month: primeDetails?.month || parsedYearMonth?.monthLabel || '',
    year_month: yearMonth,
    week: detailWeek,
    date: detailDate,
    brand: row?.brand || '',
    affiliate_id: row?.affiliateId || '',
    client_id: row?.clientId || '',
    client_name: row?.clientName || '',
    status: primeDetails?.status || '',
    country: primeDetails?.country || row?.country || '',
    last_time_contact: primeDetails?.last_time_contact || '',
    ltc_group: primeDetails?.ltc_group || '',
    last_time_call: primeDetails?.last_time_call || '',
    last_time_comment: primeDetails?.last_time_comment || '',
    pl,
    raw_pl: Number(primeDetails?.raw_pl || pl),
    pl_adjustment: Number(primeDetails?.pl_adjustment || 0),
    open_pl: open,
    closed_pl: closed,
    closed_vol: Number(primeDetails?.closed_vol || 0),
    open_vol: Number(primeDetails?.open_vol || 0),
    traders: 1,
    trades: Number(row?.trades || 0),
    open_trades: Number(primeDetails?.open_trades || 0),
    rdp: Number(row?.rdp || 0),
    rdps: detailRdps,
    wd: Number(row?.wd || 0),
    std: Number(row?.deposit || 0),
    stds: detailStds,
    ftd: Number(row?.ftd || 0),
    deposit: Number(row?.deposit || 0),
    net: Number(row?.net || 0),
    rdr: computedRdr,
    ftds: detailFtds,
    leads: detailLeads,
    cr: computedCr,
    client_email:
      emailIndex?.byId?.[row?.clientId] ||
      emailIndex?.byName?.[
        String(row?.clientName || '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
      ] ||
      primeDetails?.client_email ||
      '',
  }
}

function getClientId(row) {
  return String(row?.clientId || row?.client_id || '').trim()
}

function buildPrimeCandidateClientIds(clientMonths = []) {
  const byClient = new Map()

  for (const row of clientMonths) {
    const clientId = getClientId(row)
    if (!clientId) continue

    const prev = byClient.get(clientId) || {
      closedPL: 0,
      openPL: 0,
      wd: 0,
      payoutCount: 0,
      payoutAmount: 0,
      isPayoutUser: false,
    }

    prev.closedPL += Number(row?.closedPL || 0)
    prev.openPL += Number(row?.openPL || 0)
    prev.wd += Number(row?.wd || 0)
    prev.payoutCount += Number(row?.payoutCount || 0)
    prev.payoutAmount += Number(row?.payoutAmount || 0)
    prev.isPayoutUser =
      prev.isPayoutUser || String(row?.isPayoutUser || '') === 'true' || Boolean(row?.isPayoutUser)

    byClient.set(clientId, prev)
  }

  const primeClientIds = new Set()
  for (const [clientId, metric] of byClient.entries()) {
    const explicitPayout =
      Boolean(metric?.isPayoutUser) ||
      Number(metric?.payoutCount || 0) > 0 ||
      Number(metric?.payoutAmount || 0) > 0 ||
      Number(metric?.wd || 0) > 0
    const positivePL =
      Number(metric?.closedPL || 0) > 0 ||
      Number(metric?.closedPL || 0) + Number(metric?.openPL || 0) > 0

    if (explicitPayout || positivePL) primeClientIds.add(clientId)
  }

  return primeClientIds
}

function fmt(type, value) {
  if (type === 'money') {
    const n = toNum(value)
    return n == null ? '—' : moneyFmt.format(n)
  }
  if (type === 'int') {
    const n = toNum(value)
    return n == null ? '—' : intFmt.format(Math.round(n))
  }
  if (type === 'date') {
    const t = String(value || '').trim()
    if (!t || t === '-') return '—'
    return t.length >= 10 ? t.slice(0, 10) : t
  }
  const t = String(value == null ? '' : value).trim()
  return t || '—'
}

function colorVal(n) {
  if (!Number.isFinite(n) || n === 0) return '#94a3b8'
  return n > 0 ? '#34d399' : '#f87171'
}

const SIGNED_COLOR_KEYS = new Set(['closed_pl', 'open_pl', 'net', 'pl', 'raw_pl', 'pl_adjustment'])
const TREND_PERIODS = ['week', 'month', 'year']
const TREND_METRICS = [
  { key: 'closedPnl', label: 'Closed PNL', color: '#34d399' },
  { key: 'ftd', label: 'FTD', color: '#60a5fa' },
  { key: 'rdp', label: 'RDP', color: '#f59e0b' },
  { key: 'wd', label: 'WD', color: '#f87171' },
  { key: 'newClients', label: 'New Clients', color: '#a78bfa' },
]

function toMetricNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return 0
    const cleaned = raw.replace(/\s|\$/g, '')
    const hasDot = cleaned.includes('.')
    const hasComma = cleaned.includes(',')

    if (hasDot && hasComma) {
      const lastDot = cleaned.lastIndexOf('.')
      const lastComma = cleaned.lastIndexOf(',')
      if (lastComma > lastDot) {
        const normalized = cleaned.replace(/\./g, '').replace(',', '.')
        const n = Number(normalized)
        return Number.isFinite(n) ? n : 0
      }
      const normalized = cleaned.replace(/,/g, '')
      const n = Number(normalized)
      return Number.isFinite(n) ? n : 0
    }

    if (hasComma && !hasDot) {
      const normalized = /,\d{1,2}$/.test(cleaned)
        ? cleaned.replace(',', '.')
        : cleaned.replace(/,/g, '')
      const n = Number(normalized)
      return Number.isFinite(n) ? n : 0
    }

    const n = Number(cleaned)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function getCellColor(col, rawValue) {
  if (!col || !SIGNED_COLOR_KEYS.has(col.key)) return '#e2e8f0'
  const n = toNum(rawValue)
  if (n == null) return '#94a3b8'
  return colorVal(n)
}

function monthKeyToSortNumber(monthKey) {
  const m = String(monthKey || '').match(/^(\d{4})-([A-Za-z]{3})$/)
  if (!m) return Number.POSITIVE_INFINITY
  const year = Number(m[1])
  const month = MONTH_ORDER[m[2]]
  if (!Number.isFinite(year) || !Number.isFinite(month)) return Number.POSITIVE_INFINITY
  return year * 100 + month
}

function parseWeekSortNumber(weekKey) {
  const m = String(weekKey || '').match(/^(\d{4})-(\d{1,2})$/)
  if (!m) return Number.POSITIVE_INFINITY
  const year = Number(m[1])
  const week = Number(m[2])
  if (!Number.isFinite(year) || !Number.isFinite(week)) return Number.POSITIVE_INFINITY
  return year * 100 + week
}

function rowDateFallback(row) {
  const dateSources = [
    row?.date,
    row?.client_timestamp,
    row?.ltt_date,
    row?.ltd_date,
    row?.year_month,
  ]
  for (const v of dateSources) {
    const d = parseDateValue(v)
    if (d) return d
  }
  return null
}

function getTrendBucketKeys(row) {
  // Primary source: year_month (trading period), NOT client activity dates.
  // Client dates (client_timestamp, ltt_date, ltd_date) are registration/activity
  // dates that can be years apart from the actual trading period.
  const yearMonthText = String(row?.year_month || '').trim()
  const ymParts = parseYearMonthParts(yearMonthText)

  let year = ''
  let month = ''
  let week = ''

  if (ymParts) {
    year = String(ymParts.year)
    month = `${year}-${ymParts.monthLabel}`
  }

  // For week: try explicit week field first, then derive from year_month start date.
  week = String(row?.week || '').trim()
  if (week && /^\d{4}-W?\d{1,2}$/.test(week)) {
    week = week.replace('-W', '-')
  } else if (ymParts) {
    // Approximate: use first day of the year_month as week anchor.
    const approxDate = new Date(Date.UTC(ymParts.year, MONTH_ORDER[ymParts.monthLabel] - 1, 1))
    week = formatIsoWeek(approxDate)
  }

  return { week, month, year }
}

function formatDateToTrendKey(date, period) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return ''
  const year = String(date.getUTCFullYear())
  if (period === 'year') return year
  if (period === 'month') {
    const monthNum = date.getUTCMonth() + 1
    const monthLabel = Object.keys(MONTH_ORDER).find((k) => MONTH_ORDER[k] === monthNum) || ''
    return monthLabel ? `${year}-${monthLabel}` : ''
  }
  return formatIsoWeek(date)
}

function registrationDateFromRow(row) {
  return (
    parseDateValue(row?.client_timestamp) ||
    parseDateValue(row?.ltd_date) ||
    parseDateValue(row?.ltt_date) ||
    parseDateValue(row?.date) ||
    parseDateValue(row?.year_month)
  )
}

function metricValueFromRow(row, key) {
  if (key === 'closedPnl') {
    return toMetricNumber(row?.closed_pl ?? row?.closedPL ?? row?.closed_pl_value)
  }
  if (key === 'ftd') {
    return toMetricNumber(row?.ftd ?? row?.FTD)
  }
  if (key === 'rdp') {
    return toMetricNumber(row?.rdp ?? row?.RDP)
  }
  if (key === 'wd') {
    return toMetricNumber(row?.wd ?? row?.WD ?? row?.withdrawals)
  }
  return 0
}

function isKeyInSelectedYear(key, period, selectedYear) {
  if (!selectedYear) return true
  const k = String(key || '').trim()
  if (!k) return false
  if (period === 'year') return k === selectedYear
  return k.startsWith(`${selectedYear}-`)
}

function buildTrendSeries(rows = [], period = 'month', selectedYear = null) {
  const buckets = new Map()
  const registrationCountsByBucket = new Map()

  const rowsWithKey = rows
    .map((row) => {
      const keys = getTrendBucketKeys(row)
      const key = String(keys?.[period] || '').trim()
      if (!key || !isKeyInSelectedYear(key, period, selectedYear)) return null
      const sortValue =
        period === 'week'
          ? parseWeekSortNumber(key)
          : period === 'month'
            ? monthKeyToSortNumber(key)
            : Number(key)
      return { row, key, sortValue }
    })
    .filter(Boolean)
    .sort((a, b) => a.sortValue - b.sortValue)

  for (const item of rowsWithKey) {
    const { row, key } = item
    const bucket = buckets.get(key) || { closedPnl: 0, ftd: 0, rdp: 0, wd: 0, newClients: 0 }
    bucket.closedPnl += metricValueFromRow(row, 'closedPnl')
    bucket.ftd += metricValueFromRow(row, 'ftd')
    bucket.rdp += metricValueFromRow(row, 'rdp')
    bucket.wd += metricValueFromRow(row, 'wd')
    buckets.set(key, bucket)
  }

  const byClientRegDate = new Map()
  for (const row of rows) {
    const clientId = String(row?.client_id || '').trim()
    if (!clientId) continue
    const regDate = registrationDateFromRow(row)
    if (!regDate) continue
    const prev = byClientRegDate.get(clientId)
    if (!prev || regDate < prev) {
      byClientRegDate.set(clientId, regDate)
    }
  }

  for (const regDate of byClientRegDate.values()) {
    const regKey = formatDateToTrendKey(regDate, period)
    if (!regKey || !isKeyInSelectedYear(regKey, period, selectedYear)) continue
    registrationCountsByBucket.set(regKey, (registrationCountsByBucket.get(regKey) || 0) + 1)
    // Keep registration-only points only inside the selected timeframe.
    if (!buckets.has(regKey))
      buckets.set(regKey, { closedPnl: 0, ftd: 0, rdp: 0, wd: 0, newClients: 0 })
  }

  const labels = [...buckets.keys()].sort((a, b) => {
    const av =
      period === 'week'
        ? parseWeekSortNumber(a)
        : period === 'month'
          ? monthKeyToSortNumber(a)
          : Number(a)
    const bv =
      period === 'week'
        ? parseWeekSortNumber(b)
        : period === 'month'
          ? monthKeyToSortNumber(b)
          : Number(b)
    return av - bv
  })
  const series = { closedPnl: [], ftd: [], rdp: [], wd: [], newClients: [] }

  for (const key of labels) {
    const b = buckets.get(key)
    series.closedPnl.push(b.closedPnl)
    series.ftd.push(b.ftd)
    series.rdp.push(b.rdp)
    series.wd.push(b.wd)
    series.newClients.push(registrationCountsByBucket.get(key) || 0)
  }

  return { labels, series }
}

function SortArrow({ col, sortKey, dir }) {
  if (sortKey !== col) return <span style={{ opacity: 0.3, marginLeft: 3 }}>↕</span>
  return <span style={{ marginLeft: 3 }}>{dir === 'desc' ? '↓' : '↑'}</span>
}

export default function CreolabsPage() {
  const { reportQlikSource } = useQlikStatus()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forexRows, setForexRows] = useState([])
  const [primeRows, setPrimeRows] = useState([])
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [brandCached, setBrandCached] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [brand, setBrand] = useState(COMBINED_FOREX_BRAND)
  const [sortKey, setSortKey] = useState('year_month')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showTopScrollbar, setShowTopScrollbar] = useState(false)
  const [selectedTrendMetric, setSelectedTrendMetric] = useState('all')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)

  const topScrollbarRef = useRef(null)
  const topScrollbarSizerRef = useRef(null)
  const tableViewportRef = useRef(null)
  const isSyncingScrollRef = useRef(false)

  function loadData(bustCache = false) {
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        // API-first: use the same Qlik source used by Prime Challenge ranking.
        const [qlikPayload, tradersPayloadResult, primePayloadResult, emailIndexResult] =
          await Promise.all([
            loadCreolabsQlikClientMonths({ force: bustCache }),
            loadTradersRankingRewardsTable({ force: bustCache }).catch(() => null),
            loadPrimeClientsRankingTable({ force: bustCache }).catch(() => null),
            loadPrimeEmailIndex({ force: bustCache }).catch(() => null),
          ])
        if (cancelled) return

        const clientMonths = Array.isArray(qlikPayload?.data?.clientMonths)
          ? qlikPayload.data.clientMonths
          : []
        const tradersDateLookup = buildTradersDateLookup(tradersPayloadResult)
        const primeDetailsLookup = buildPrimeDetailsLookup(primePayloadResult)
        const literalPrimeRows = clientMonths.filter(
          (r) => String(r?.brand || '').trim() === 'BW Prime'
        )

        // Some Qlik snapshots expose only BW/BW Global labels; derive Prime cohort
        // using the same payout/positive-PL signal used by Prime ranking.
        const derivedPrimeClientIds = buildPrimeCandidateClientIds(clientMonths)
        const primeSourceRows =
          literalPrimeRows.length > 0
            ? literalPrimeRows
            : clientMonths.filter((r) => derivedPrimeClientIds.has(getClientId(r)))

        const primeClientIds = new Set(primeSourceRows.map((r) => getClientId(r)).filter(Boolean))

        const forex = clientMonths
          .filter((r) => !primeClientIds.has(getClientId(r)))
          .map((row) => mapQlikClientMonthToForexRow(row, tradersDateLookup))
        const prime = primeSourceRows.map((r) =>
          mapQlikClientMonthToPrimeRow(
            { ...r, brand: 'BW Prime' },
            primeDetailsLookup,
            tradersDateLookup,
            emailIndexResult
          )
        )

        setForexRows(forex)
        setPrimeRows(prime)
        setPeriodFrom(String(qlikPayload?.data?.periodFrom || ''))
        setPeriodTo(String(qlikPayload?.data?.periodTo || ''))
        setBrandCached(Boolean(qlikPayload?.data?.cached))
        reportQlikSource('creolabs-overview', 'api')
      } catch (e) {
        if (cancelled) return

        // Strict policy: fallback only when API is unavailable.
        if (!canUseCreolabsLocalFallback(e)) {
          logCreolabsQlikFallbackBlocked('creolabs overview load', e)
          throw e
        }

        logCreolabsQlikFallbackUsed('creolabs overview load', e)
        const [forexPayload, primePayload] = await Promise.all([
          fetch('/traders_ranking_rewards_table.json').then((r) => r.json()),
          fetch('/prime_clients_ranking_table.json').then((r) => r.json()),
        ])
        if (cancelled) return

        const forex = parseHeaderRows(forexPayload)
        const prime = parseHeaderRows(primePayload)

        setForexRows(forex)
        setPrimeRows(prime)
        setBrandCached(false)
        reportQlikSource('creolabs-overview', 'local')
      }
    })()
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Errore durante il caricamento')
        reportQlikSource('creolabs-overview', null)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      })

    return () => {
      cancelled = true
    }
  }

  useEffect(() => {
    const cleanup = loadData(false)
    return () => {
      if (typeof cleanup === 'function') cleanup()
      reportQlikSource('creolabs-overview', null)
    }
  }, [reportQlikSource])

  // Silent background refresh — no loading spinner, doesn't interrupt the user.
  const silentInFlightRef = useRef(false)
  useEffect(() => {
    const INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

    const silentRefresh = async () => {
      if (silentInFlightRef.current) return
      silentInFlightRef.current = true
      try {
        const [qlikPayload, tradersPayloadResult, primePayloadResult, emailIndexResult] =
          await Promise.all([
            loadCreolabsQlikClientMonths({ force: true }),
            loadTradersRankingRewardsTable({ force: true }).catch(() => null),
            loadPrimeClientsRankingTable({ force: true }).catch(() => null),
            loadPrimeEmailIndex({ force: true }).catch(() => null),
          ])
        const clientMonths = Array.isArray(qlikPayload?.data?.clientMonths)
          ? qlikPayload.data.clientMonths
          : []
        const tradersDateLookup = buildTradersDateLookup(tradersPayloadResult)
        const primeDetailsLookup = buildPrimeDetailsLookup(primePayloadResult)
        const literalPrimeRows = clientMonths.filter(
          (r) => String(r?.brand || '').trim() === 'BW Prime'
        )
        const derivedPrimeClientIds = buildPrimeCandidateClientIds(clientMonths)
        const primeSourceRows =
          literalPrimeRows.length > 0
            ? literalPrimeRows
            : clientMonths.filter((r) => derivedPrimeClientIds.has(getClientId(r)))
        const primeClientIds = new Set(primeSourceRows.map((r) => getClientId(r)).filter(Boolean))
        const forex = clientMonths
          .filter((r) => !primeClientIds.has(getClientId(r)))
          .map((row) => mapQlikClientMonthToForexRow(row, tradersDateLookup))
        const prime = primeSourceRows.map((r) =>
          mapQlikClientMonthToPrimeRow(
            { ...r, brand: 'BW Prime' },
            primeDetailsLookup,
            tradersDateLookup,
            emailIndexResult
          )
        )
        setForexRows(forex)
        setPrimeRows(prime)
        setPeriodFrom(String(qlikPayload?.data?.periodFrom || ''))
        setPeriodTo(String(qlikPayload?.data?.periodTo || ''))
        setBrandCached(Boolean(qlikPayload?.data?.cached))
        reportQlikSource('creolabs-overview', 'api')
      } catch {
        // Ignore errors on silent refresh — keep showing current data.
      } finally {
        silentInFlightRef.current = false
      }
    }

    const timerId = window.setInterval(silentRefresh, INTERVAL_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') silentRefresh()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(timerId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reportQlikSource])

  function handleRefreshBrands() {
    setRefreshing(true)
    loadData(true)
  }

  const brandRows = useMemo(() => {
    let base
    if (brand === 'BW Prime') {
      base = primeRows.filter((r) => String(r.brand || '').trim() === 'BW Prime')
    } else if (brand === COMBINED_FOREX_BRAND) {
      base = forexRows.filter((r) => {
        const b = String(r.brand || '').trim()
        return b === 'BW' || b === 'BW Global'
      })
    } else {
      const exact = forexRows.filter((r) => String(r.brand || '').trim() === brand)
      if (brand === 'BW Global' && exact.length === 0) {
        // Temporary fallback: Qlik may emit BW label for BW Global clients.
        base = forexRows.filter((r) => String(r.brand || '').trim() === 'BW')
      } else {
        base = exact
      }
    }

    return base
  }, [brand, forexRows, primeRows])

  const cols = useMemo(() => {
    const baseCols = brand === 'BW Prime' ? PRIME_COLS : FOREX_COLS
    return filterVisibleColumns(baseCols, brandRows)
  }, [brand, brandRows])

  useEffect(() => {
    setPage(0)
    setSelectedYear(null)
    setSelectedMonth(null)
    setSelectedWeek(null)
  }, [brand])

  useEffect(() => {
    if (!cols.some((c) => c.key === sortKey)) {
      setSortKey(cols[0]?.key || 'client_id')
      setSortDir('asc')
    }
  }, [cols, sortKey])

  const availableYears = useMemo(() => {
    const years = new Set()
    for (const r of brandRows) {
      const ym = String(r.year_month || '').trim()
      const y = ym.slice(0, 4)
      if (y && /^\d{4}$/.test(y)) years.add(y)
    }
    return [...years].sort().reverse()
  }, [brandRows])

  const availableMonths = useMemo(() => {
    const base = selectedYear
      ? brandRows.filter((r) => String(r.year_month || '').startsWith(selectedYear))
      : brandRows
    const months = new Set()
    for (const r of base) {
      const ym = String(r.year_month || '').trim()
      if (/^\d{4}-[A-Za-z]{3}$/.test(ym)) months.add(ym)
    }
    return [...months].sort((a, b) => monthKeyToSortNumber(a) - monthKeyToSortNumber(b))
  }, [brandRows, selectedYear])

  const availableWeeks = useMemo(() => {
    let base = brandRows
    if (selectedYear) base = base.filter((r) => String(r.year_month || '').startsWith(selectedYear))
    if (selectedMonth)
      base = base.filter((r) => String(r.year_month || '').trim() === selectedMonth)
    const weeks = new Set()
    for (const r of base) {
      const w = getTrendBucketKeys(r).week
      if (w) weeks.add(w)
    }
    return [...weeks].sort((a, b) => parseWeekSortNumber(a) - parseWeekSortNumber(b))
  }, [brandRows, selectedYear, selectedMonth])

  const rows = useMemo(() => {
    let base = brandRows
    if (selectedYear) {
      base = base.filter((r) => String(r.year_month || '').startsWith(selectedYear))
    }
    if (selectedMonth) {
      base = base.filter((r) => String(r.year_month || '').trim() === selectedMonth)
    }
    if (selectedWeek) {
      base = base.filter((r) => getTrendBucketKeys(r).week === selectedWeek)
    }
    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter((r) =>
      Object.values(r || {}).some((v) =>
        String(v == null ? '' : v)
          .toLowerCase()
          .includes(q)
      )
    )
  }, [brandRows, selectedYear, selectedMonth, selectedWeek, search])

  const isBwGlobalFallback = useMemo(() => {
    if (brand !== 'BW Global') return false
    const globalCount = forexRows.filter((r) => String(r.brand || '').trim() === 'BW Global').length
    const bwCount = forexRows.filter((r) => String(r.brand || '').trim() === 'BW').length
    return globalCount === 0 && bwCount > 0
  }, [brand, forexRows])

  const trendByPeriod = useMemo(() => {
    const out = {}
    for (const period of TREND_PERIODS) {
      out[period] = buildTrendSeries(rows, period, selectedYear)
    }
    return out
  }, [rows, selectedYear])

  const sorted = useMemo(() => {
    const dir = sortDir === 'desc' ? -1 : 1
    return [...rows].sort((a, b) => {
      const av = a?.[sortKey]
      const bv = b?.[sortKey]
      const an = toNum(av)
      const bn = toNum(bv)
      if (an != null && bn != null) return dir * (an - bn)
      return dir * String(av == null ? '' : av).localeCompare(String(bv == null ? '' : bv))
    })
  }, [rows, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const stats = useMemo(() => {
    if (!rows.length) return null
    const uniqueClients = new Set(
      rows.map((r) => String(r.client_id || r.clientId || '')).filter(Boolean)
    )
    const ftdClients = new Set(
      rows
        .filter((r) => {
          const ftdValue = toNum(r.ftd)
          return ftdValue != null && ftdValue > 0
        })
        .map((r) => String(r.client_id || r.clientId || ''))
        .filter(Boolean)
    )
    const sum = (key) =>
      rows.reduce((acc, r) => {
        const n = toNum(r[key])
        return n != null ? acc + n : acc
      }, 0)
    const cards = [
      { label: 'Registrati', value: intFmt.format(uniqueClients.size), color: '#94a3b8' },
      { label: '#FTDs', value: intFmt.format(ftdClients.size), color: '#60a5fa' },
      {
        label: 'Closed PL',
        value: moneyFmt.format(sum('closed_pl')),
        color: colorVal(sum('closed_pl')),
      },
      { label: 'Deposit', value: moneyFmt.format(sum('deposit')), color: '#34d399' },
      { label: 'WD', value: moneyFmt.format(sum('wd')), color: '#f87171' },
      { label: 'Net', value: moneyFmt.format(sum('net')), color: colorVal(sum('net')) },
    ]
    return cards
  }, [rows, brand])

  useEffect(() => {
    const updateScrollMetrics = () => {
      const viewportEl = tableViewportRef.current
      const sizerEl = topScrollbarSizerRef.current
      if (!viewportEl || !sizerEl) return

      sizerEl.style.width = `${viewportEl.scrollWidth}px`
      setShowTopScrollbar(viewportEl.scrollWidth > viewportEl.clientWidth)

      const topEl = topScrollbarRef.current
      if (topEl && topEl.scrollLeft !== viewportEl.scrollLeft) {
        topEl.scrollLeft = viewportEl.scrollLeft
      }
    }

    const rafId = requestAnimationFrame(updateScrollMetrics)
    window.addEventListener('resize', updateScrollMetrics)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', updateScrollMetrics)
    }
  }, [brand, cols, error, loading, page, pageRows.length, search, sorted.length])

  function syncFromTopScroll(e) {
    if (isSyncingScrollRef.current) return
    const viewportEl = tableViewportRef.current
    if (!viewportEl) return
    isSyncingScrollRef.current = true
    viewportEl.scrollLeft = e.currentTarget.scrollLeft
    isSyncingScrollRef.current = false
  }

  function syncFromViewportScroll(e) {
    if (isSyncingScrollRef.current) return
    const topEl = topScrollbarRef.current
    if (!topEl) return
    isSyncingScrollRef.current = true
    topEl.scrollLeft = e.currentTarget.scrollLeft
    isSyncingScrollRef.current = false
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="page-label">CREOLABS</p>
          <h1 className="page-title">Forex vs Prime - Full Fields</h1>
          <p className="page-subtitle">
            Forex (BW, BW Global) con schema completo + Prime (BW Prime) da Prime Clients Ranking.
            {periodFrom && periodTo ? ` Range live brand map: ${periodFrom} -> ${periodTo}` : ''}
          </p>
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 14,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {BRANDS.map((b) => (
          <button
            key={b}
            className={`pill-tab${brand === b ? ' active' : ''}`}
            onClick={() => {
              setBrand(b)
              setPage(0)
            }}
          >
            {b}
          </button>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {/* Timeframe pills */}
          {!loading && availableYears.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                className={`pill-tab${selectedYear === null ? ' active' : ''}`}
                onClick={() => {
                  setSelectedYear(null)
                  setSelectedMonth(null)
                  setSelectedWeek(null)
                }}
                style={{ fontSize: '0.72rem', padding: '3px 10px' }}
              >
                Tutti
              </button>
              {availableYears.map((y) => (
                <button
                  key={y}
                  className={`pill-tab${selectedYear === y ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedYear(y)
                    setSelectedMonth(null)
                    setSelectedWeek(null)
                  }}
                  style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
          {brandCached && (
            <span
              style={{
                fontSize: '0.72rem',
                color: '#f59e0b',
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              ⚠ cache attiva
            </span>
          )}
          <button
            onClick={handleRefreshBrands}
            disabled={refreshing || loading}
            style={{
              fontSize: '0.75rem',
              padding: '4px 12px',
              borderRadius: 8,
              border: '1px solid rgba(99,102,241,0.4)',
              background: 'rgba(99,102,241,0.12)',
              color: '#a5b4fc',
              cursor: 'pointer',
              opacity: refreshing || loading ? 0.5 : 1,
            }}
          >
            {refreshing ? '⟳ Ricarico…' : '⟳ Ricarica brand da Qlik'}
          </button>
        </div>
      </div>

      {/* Month filter pills */}
      {!loading && selectedYear !== null && availableMonths.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginRight: 4 }}>Mese:</span>
          <button
            className={`pill-tab${selectedMonth === null ? ' active' : ''}`}
            onClick={() => {
              setSelectedMonth(null)
              setSelectedWeek(null)
            }}
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}
          >
            Tutti
          </button>
          {availableMonths.map((m) => (
            <button
              key={m}
              className={`pill-tab${selectedMonth === m ? ' active' : ''}`}
              onClick={() => {
                setSelectedMonth(m)
                setSelectedWeek(null)
              }}
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
            >
              {m.slice(5)}
            </button>
          ))}
        </div>
      )}

      {/* Week filter pills */}
      {!loading && selectedMonth !== null && availableWeeks.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginRight: 4 }}>Settimana:</span>
          <button
            className={`pill-tab${selectedWeek === null ? ' active' : ''}`}
            onClick={() => setSelectedWeek(null)}
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}
          >
            Tutte
          </button>
          {availableWeeks.map((w) => (
            <button
              key={w}
              className={`pill-tab${selectedWeek === w ? ' active' : ''}`}
              onClick={() => setSelectedWeek(w)}
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
            >
              W{w.slice(5)}
            </button>
          ))}
        </div>
      )}

      {!loading && !error && stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 18,
          }}
        >
          {stats.map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(71,85,105,0.3)',
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.7rem',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <section
          style={{
            marginBottom: 18,
            border: '1px solid rgba(71,85,105,0.35)',
            borderRadius: 12,
            background: 'rgba(15,23,42,0.45)',
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#cbd5e1',
              }}
            >
              Trends · {brand}
            </p>
            <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
              Closed PNL, FTD, RDP, WD, New Clients (valori per periodo)
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="pill-tab"
                onClick={() => setSelectedTrendMetric('all')}
                style={{
                  opacity: selectedTrendMetric === 'all' ? 1 : 0.75,
                  borderColor:
                    selectedTrendMetric === 'all'
                      ? 'rgba(99,102,241,0.55)'
                      : 'rgba(71,85,105,0.45)',
                }}
              >
                All
              </button>
              {TREND_METRICS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className="pill-tab"
                  onClick={() => setSelectedTrendMetric(m.key)}
                  style={{
                    opacity: selectedTrendMetric === m.key ? 1 : 0.75,
                    color: m.color,
                    borderColor:
                      selectedTrendMetric === m.key ? `${m.color}AA` : 'rgba(71,85,105,0.45)',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            }}
          >
            {TREND_PERIODS.map((period) => {
              const trend = trendByPeriod?.[period] || { labels: [], series: {} }
              const labels = Array.isArray(trend.labels) ? trend.labels : []
              const hasData = labels.length > 0
              const chartData = {
                labels,
                datasets: TREND_METRICS.filter(
                  (m) => selectedTrendMetric === 'all' || m.key === selectedTrendMetric
                ).map((m) => ({
                  label: m.label,
                  data: trend.series?.[m.key] || [],
                  borderColor: m.color,
                  backgroundColor: `${m.color}22`,
                  pointRadius: 1.8,
                  borderWidth: 2,
                  tension: 0.25,
                })),
              }
              const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#cbd5e1', boxWidth: 10 } },
                },
                scales: {
                  x: { ticks: { color: '#94a3b8', maxRotation: 0 }, grid: { display: false } },
                  y: {
                    ticks: {
                      color: '#94a3b8',
                      callback: (value) =>
                        Math.abs(Number(value)) >= 1000
                          ? `${(Number(value) / 1000).toFixed(1)}k`
                          : `${Number(value).toFixed(0)}`,
                    },
                    grid: { color: 'rgba(148,163,184,0.15)' },
                  },
                },
              }

              return (
                <div
                  key={period}
                  style={{
                    border: '1px solid rgba(71,85,105,0.35)',
                    borderRadius: 10,
                    padding: 10,
                    background: 'rgba(2,6,23,0.45)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      marginBottom: 8,
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#94a3b8',
                    }}
                  >
                    By {period}
                  </p>

                  <div style={{ height: 220 }}>
                    {hasData ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#64748b',
                          fontSize: '0.8rem',
                        }}
                      >
                        Nessun dato disponibile
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!loading && !error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          {isBwGlobalFallback && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#fbbf24',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid rgba(251,191,36,0.35)',
                background: 'rgba(251,191,36,0.1)',
              }}
            >
              Qlik live sta etichettando BW Global come BW: fallback attivo.
            </span>
          )}
          <input
            type="text"
            placeholder="Cerca su tutte le voci..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(71,85,105,0.45)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#e2e8f0',
              fontSize: '0.82rem',
              width: 280,
              outline: 'none',
            }}
          />
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
            {intFmt.format(rows.length)} righe · p. {page + 1}/{totalPages}
          </span>
        </div>
      )}

      <section className="card-block" style={{ padding: 0 }}>
        {error ? (
          <div
            style={{
              padding: 20,
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 12,
              background: 'rgba(127,29,29,0.2)',
              color: '#fecaca',
            }}
          >
            {error}
          </div>
        ) : loading ? (
          <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
            Caricamento dataset completi...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
            Nessun dato trovato per {brand}.
          </div>
        ) : (
          <>
            <div
              ref={topScrollbarRef}
              onScroll={syncFromTopScroll}
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                height: 14,
                display: showTopScrollbar ? 'block' : 'none',
                borderBottom: '1px solid rgba(71,85,105,0.25)',
              }}
            >
              <div ref={topScrollbarSizerRef} style={{ height: 1 }} />
            </div>

            <div
              ref={tableViewportRef}
              onScroll={syncFromViewportScroll}
              style={{ overflow: 'auto', maxHeight: '68vh' }}
            >
              <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      background: 'rgba(30,41,59,0.95)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                    }}
                  >
                    {cols.map((c) => (
                      <th
                        key={c.key}
                        style={c.align === 'left' ? TH_L : TH}
                        onClick={() => handleSort(c.key)}
                      >
                        {c.label}
                        <SortArrow col={c.key} sortKey={sortKey} dir={sortDir} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, idx) => (
                    <tr
                      key={`${brand}-${idx}`}
                      style={{ background: idx % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'transparent' }}
                    >
                      {cols.map((c) => {
                        const raw = row?.[c.key]
                        const textColor = getCellColor(c, raw)
                        const baseStyle = c.align === 'left' ? TD_L : TD
                        return (
                          <td key={c.key} style={{ ...baseStyle, color: textColor }}>
                            {fmt(c.type, raw)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {!loading && !error && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            className="pill-tab"
            style={{ opacity: page === 0 ? 0.4 : 1 }}
          >
            ««
          </button>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="pill-tab"
            style={{ opacity: page === 0 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ padding: '6px 12px', color: '#94a3b8', fontSize: '0.82rem' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="pill-tab"
            style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }}
          >
            Next →
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="pill-tab"
            style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }}
          >
            »»
          </button>
        </div>
      )}
    </div>
  )
}
