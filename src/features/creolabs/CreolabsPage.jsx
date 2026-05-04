import { useEffect, useMemo, useRef, useState } from 'react'
import { useQlikStatus } from '../../context/QlikStatusContext'
import {
  isQlikApiUnavailableError,
  loadCreolabsQlikAnalytics,
  loadCreolabsQlikClientMonths,
  loadCreolabsQlikKpis,
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

const BRANDS = ['BW', 'BW Global', 'BW Prime']
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
  const closed = Number(row?.closedPL || 0)
  const open = Number(row?.openPL || 0)
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
  const closed = Number(row?.closedPL || 0)
  const open = Number(row?.openPL || 0)
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

function getCellColor(col, rawValue) {
  if (!col || !SIGNED_COLOR_KEYS.has(col.key)) return '#e2e8f0'
  const n = toNum(rawValue)
  if (n == null) return '#94a3b8'
  return colorVal(n)
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

  const [brand, setBrand] = useState('BW')
  const [sortKey, setSortKey] = useState('year_month')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [showTopScrollbar, setShowTopScrollbar] = useState(false)
  const [validationLoading, setValidationLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [validationData, setValidationData] = useState(null)
  const [validationAt, setValidationAt] = useState('')
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [analyticsAt, setAnalyticsAt] = useState('')

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
        if (!isQlikApiUnavailableError(e)) {
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
        reportQlikSource('creolabs-overview', 'local')
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

  async function runValidation(force = false) {
    setValidationLoading(true)
    setValidationError('')
    try {
      const payload = await loadCreolabsQlikKpis({
        brand,
        period: periodTo || '',
        force,
      })
      setValidationData(payload?.data || null)
      setValidationAt(new Date().toLocaleTimeString())
    } catch (e) {
      setValidationError(e instanceof Error ? e.message : 'Validation failed')
      setValidationData(null)
    } finally {
      setValidationLoading(false)
    }
  }

  async function runAnalytics(force = false) {
    setAnalyticsLoading(true)
    setAnalyticsError('')
    try {
      const selectedBrand = brand === 'BW Prime' ? '' : brand
      const selectedYear = /^\d{4}/.test(String(periodTo || '')) ? String(periodTo).slice(0, 4) : ''
      const payload = await loadCreolabsQlikAnalytics({
        brand: selectedBrand,
        year: selectedYear,
        top: 10,
        force,
      })
      setAnalyticsData(payload?.data || null)
      setAnalyticsAt(new Date().toLocaleTimeString())
    } catch (e) {
      setAnalyticsError(e instanceof Error ? e.message : 'Analytics failed')
      setAnalyticsData(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const brandRows = useMemo(() => {
    let base
    if (brand === 'BW Prime') {
      base = primeRows.filter((r) => String(r.brand || '').trim() === 'BW Prime')
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
  }, [brand])

  useEffect(() => {
    if (!cols.some((c) => c.key === sortKey)) {
      setSortKey(cols[0]?.key || 'client_id')
      setSortDir('asc')
    }
  }, [cols, sortKey])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return brandRows
    return brandRows.filter((r) =>
      Object.values(r || {}).some((v) =>
        String(v == null ? '' : v)
          .toLowerCase()
          .includes(q)
      )
    )
  }, [brandRows, search])

  const isBwGlobalFallback = useMemo(() => {
    if (brand !== 'BW Global') return false
    const globalCount = forexRows.filter((r) => String(r.brand || '').trim() === 'BW Global').length
    const bwCount = forexRows.filter((r) => String(r.brand || '').trim() === 'BW').length
    return globalCount === 0 && bwCount > 0
  }, [brand, forexRows])

  // Local KPIs computed from the in-memory dataset for the active brand + optional period —
  // mirrors the server-side aggregateClientMonthKpis() so we can diff old vs new.
  const localBrandKpis = useMemo(() => {
    let base
    if (brand === 'BW Prime') {
      base = primeRows.filter((r) => String(r.brand || '').trim() === 'BW Prime')
    } else {
      const exact = forexRows.filter((r) => String(r.brand || '').trim() === brand)
      base =
        brand === 'BW Global' && exact.length === 0
          ? forexRows.filter((r) => String(r.brand || '').trim() === 'BW')
          : exact
    }
    const filtered = periodTo
      ? base.filter((r) => String(r.year_month || '').trim() === periodTo)
      : base
    const uniqueClients = new Set(filtered.map((r) => String(r.client_id || '')).filter(Boolean))
      .size
    const sum = (key) => filtered.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)
    return {
      rows: filtered.length,
      uniqueClients,
      deposit: sum('deposit'),
      wd: sum('wd'),
      net: sum('net'),
      closedPl: sum('closed_pl'),
      openPl: sum('open_pl'),
      balance: sum('balance'),
      trades: sum('trades'),
      ftd: sum('ftd'),
    }
  }, [brand, forexRows, primeRows, periodTo])

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

  // Prime-scope aggregate: identical to Prime Challenge ranking logic.
  // Aggregates by unique clientId across all periods — no active filters applied.
  const primeScope = useMemo(() => {
    if (!primeRows.length) return null
    const byClient = new Map()
    for (const r of primeRows) {
      const id = String(r.client_id || '').trim()
      if (!id) continue
      const prev = byClient.get(id) || { wd: 0, deposit: 0, closed_pl: 0 }
      prev.wd += toNum(r.wd) ?? 0
      prev.deposit += toNum(r.deposit) ?? 0
      prev.closed_pl += toNum(r.closed_pl) ?? 0
      byClient.set(id, prev)
    }
    const clients = [...byClient.values()]
    const totalWd = clients.reduce((a, c) => a + c.wd, 0)
    const totalDeposit = clients.reduce((a, c) => a + c.deposit, 0)
    const totalClosedPL = clients.reduce((a, c) => a + c.closed_pl, 0)
    return { clientCount: clients.length, totalWd, totalDeposit, totalClosedPL }
  }, [primeRows])

  const stats = useMemo(() => {
    if (!rows.length) return null
    const uniqueClients = new Set(
      rows.map((r) => String(r.client_id || r.clientId || '')).filter(Boolean)
    )
    const sum = (key) =>
      rows.reduce((acc, r) => {
        const n = toNum(r[key])
        return n != null ? acc + n : acc
      }, 0)
    if (brand === 'BW Prime') {
      return [
        { label: 'Clienti unici', value: intFmt.format(uniqueClients.size), color: '#94a3b8' },
        { label: 'Righe dataset', value: intFmt.format(rows.length), color: '#94a3b8' },
        { label: 'PL Totale', value: moneyFmt.format(sum('pl')), color: colorVal(sum('pl')) },
        {
          label: 'Closed PL',
          value: moneyFmt.format(sum('closed_pl')),
          color: colorVal(sum('closed_pl')),
        },
        {
          label: 'Open PL',
          value: moneyFmt.format(sum('open_pl')),
          color: colorVal(sum('open_pl')),
        },
        { label: 'Deposit Totale', value: moneyFmt.format(sum('deposit')), color: '#60a5fa' },
        { label: 'Net Totale', value: moneyFmt.format(sum('net')), color: colorVal(sum('net')) },
        { label: 'FTD Totale', value: moneyFmt.format(sum('ftd')), color: '#60a5fa' },
        { label: 'WD Totale', value: moneyFmt.format(sum('wd')), color: '#f87171' },
        { label: 'Trades Totali', value: intFmt.format(sum('trades')), color: '#94a3b8' },
      ]
    }
    return [
      { label: 'Clienti unici', value: intFmt.format(uniqueClients.size), color: '#94a3b8' },
      { label: 'Righe dataset', value: intFmt.format(rows.length), color: '#94a3b8' },
      { label: 'Balance Totale', value: moneyFmt.format(sum('balance')), color: '#60a5fa' },
      {
        label: 'Closed PL',
        value: moneyFmt.format(sum('closed_pl')),
        color: colorVal(sum('closed_pl')),
      },
      { label: 'Open PL', value: moneyFmt.format(sum('open_pl')), color: colorVal(sum('open_pl')) },
      { label: 'Deposit Totale', value: moneyFmt.format(sum('deposit')), color: '#60a5fa' },
      { label: 'Net Totale', value: moneyFmt.format(sum('net')), color: colorVal(sum('net')) },
      { label: 'FTD Totale', value: moneyFmt.format(sum('ftd')), color: '#60a5fa' },
      { label: 'WD Totale', value: moneyFmt.format(sum('wd')), color: '#f87171' },
      { label: 'Trades Totali', value: intFmt.format(sum('trades')), color: '#94a3b8' },
      {
        label: 'Equity Totale',
        value: moneyFmt.format(sum('equity')),
        color: colorVal(sum('equity')),
      },
      { label: 'LTV Commission', value: moneyFmt.format(sum('ltv_commission')), color: '#a78bfa' },
    ]
  }, [rows, brand, primeScope])

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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
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

      {!loading && !error && stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: brand !== 'BW Prime' && primeScope ? 10 : 18,
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

      {/* Ad-hoc section for KPI migration phase validation */}
      {!loading && !error && (
        <section
          style={{
            marginBottom: 18,
            border: '1px solid rgba(56,189,248,0.3)',
            borderRadius: 12,
            background: 'rgba(8,47,73,0.22)',
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#67e8f9',
              }}
            >
              Fase Validation & Migration KPI API
            </p>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Brand: {brand} {periodTo ? `· Periodo test: ${periodTo}` : ''}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                onClick={() => runValidation(false)}
                disabled={validationLoading}
                className="pill-tab"
                style={{ opacity: validationLoading ? 0.5 : 1 }}
              >
                {validationLoading ? 'Test in corso…' : 'Esegui test KPI'}
              </button>
              <button
                onClick={() => runValidation(true)}
                disabled={validationLoading}
                className="pill-tab"
                style={{ opacity: validationLoading ? 0.5 : 1 }}
              >
                Bust cache + test
              </button>
              <button
                onClick={() => runAnalytics(false)}
                disabled={analyticsLoading}
                className="pill-tab"
                style={{ opacity: analyticsLoading ? 0.5 : 1 }}
              >
                {analyticsLoading ? 'Analytics…' : 'Carica analytics'}
              </button>
              <button
                onClick={() => runAnalytics(true)}
                disabled={analyticsLoading}
                className="pill-tab"
                style={{ opacity: analyticsLoading ? 0.5 : 1 }}
              >
                Bust + analytics
              </button>
            </div>
          </div>

          {validationError ? (
            <p style={{ margin: '10px 0 0', color: '#fca5a5', fontSize: '0.8rem' }}>
              {validationError}
            </p>
          ) : null}

          {validationData ? (
            <div
              style={{
                marginTop: 10,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 8,
              }}
            >
              {[
                {
                  label: 'Rows (filtered)',
                  value: intFmt.format(Number(validationData.filteredRows || 0)),
                },
                {
                  label: 'Clienti unici',
                  value: intFmt.format(Number(validationData?.kpis?.uniqueClients || 0)),
                },
                {
                  label: 'Deposit',
                  value: moneyFmt.format(Number(validationData?.kpis?.deposit || 0)),
                },
                {
                  label: 'WD',
                  value: moneyFmt.format(Number(validationData?.kpis?.wd || 0)),
                },
                {
                  label: 'Net',
                  value: moneyFmt.format(Number(validationData?.kpis?.net || 0)),
                },
                {
                  label: 'Closed PL',
                  value: moneyFmt.format(Number(validationData?.kpis?.closedPl || 0)),
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    border: '1px solid rgba(56,189,248,0.25)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: 'rgba(15,23,42,0.4)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.67rem', color: '#94a3b8' }}>{card.label}</p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#e2e8f0',
                    }}
                  >
                    {card.value}
                  </p>
                </div>
              ))}

              <div
                style={{
                  gridColumn: '1 / -1',
                  border: '1px solid rgba(56,189,248,0.25)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: 'rgba(15,23,42,0.4)',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                  Esito check: {validationData?.validation?.pass ? 'PASS' : 'FAIL'}
                  {validationAt ? ` · ultimo test ${validationAt}` : ''}
                </p>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(validationData?.validation?.checks || []).map((c) => (
                    <span
                      key={c.id}
                      style={{
                        fontSize: '0.72rem',
                        borderRadius: 999,
                        padding: '2px 8px',
                        border: c.passed
                          ? '1px solid rgba(52,211,153,0.45)'
                          : '1px solid rgba(248,113,113,0.45)',
                        background: c.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: c.passed ? '#6ee7b7' : '#fca5a5',
                      }}
                      title={String(c.detail || '')}
                    >
                      {c.id}
                    </span>
                  ))}
                </div>
              </div>

              {/* Delta comparison: local dataset vs API */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  border: '1px solid rgba(56,189,248,0.2)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'rgba(15,23,42,0.4)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    padding: '6px 10px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#7dd3fc',
                    borderBottom: '1px solid rgba(56,189,248,0.15)',
                  }}
                >
                  Delta Locale → API
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.75rem',
                    }}
                  >
                    <thead>
                      <tr style={{ color: '#64748b' }}>
                        {['Metrica', 'Locale', 'API', 'Δ Ass.', 'Δ %', 'Esito'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '4px 10px',
                              textAlign: h === 'Metrica' ? 'left' : 'right',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              borderBottom: '1px solid rgba(56,189,248,0.1)',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: 'Righe',
                          localVal: localBrandKpis.rows,
                          apiVal: validationData.kpis.rows,
                          isMoney: false,
                        },
                        {
                          label: 'Clienti unici',
                          localVal: localBrandKpis.uniqueClients,
                          apiVal: validationData.kpis.uniqueClients,
                          isMoney: false,
                        },
                        {
                          label: 'Deposit',
                          localVal: localBrandKpis.deposit,
                          apiVal: validationData.kpis.deposit,
                          isMoney: true,
                        },
                        {
                          label: 'WD',
                          localVal: localBrandKpis.wd,
                          apiVal: validationData.kpis.wd,
                          isMoney: true,
                        },
                        {
                          label: 'Net',
                          localVal: localBrandKpis.net,
                          apiVal: validationData.kpis.net,
                          isMoney: true,
                        },
                        {
                          label: 'Closed PL',
                          localVal: localBrandKpis.closedPl,
                          apiVal: validationData.kpis.closedPl,
                          isMoney: true,
                        },
                        {
                          label: 'Open PL',
                          localVal: localBrandKpis.openPl,
                          apiVal: validationData.kpis.openPl,
                          isMoney: true,
                        },
                        {
                          label: 'Balance',
                          localVal: localBrandKpis.balance,
                          apiVal: validationData.kpis.balance,
                          isMoney: true,
                        },
                        {
                          label: 'Trades',
                          localVal: localBrandKpis.trades,
                          apiVal: validationData.kpis.trades,
                          isMoney: false,
                        },
                        {
                          label: 'FTD',
                          localVal: localBrandKpis.ftd,
                          apiVal: validationData.kpis.ftd,
                          isMoney: true,
                        },
                      ].map(({ label, localVal, apiVal, isMoney }) => {
                        const local = Number(localVal) || 0
                        const api = Number(apiVal) || 0
                        const delta = api - local
                        const pct =
                          local !== 0 ? (delta / Math.abs(local)) * 100 : api !== 0 ? 100 : 0
                        const tol = isMoney ? 0.1 : 0
                        const pass = Math.abs(pct) <= tol
                        const fmtNum = isMoney ? moneyFmt : intFmt
                        const deltaColor =
                          Math.abs(pct) < 0.001 ? '#94a3b8' : delta > 0 ? '#34d399' : '#f87171'
                        return (
                          <tr
                            key={label}
                            style={{
                              borderTop: '1px solid rgba(56,189,248,0.07)',
                            }}
                          >
                            <td style={{ padding: '4px 10px', color: '#cbd5e1' }}>{label}</td>
                            <td
                              style={{
                                padding: '4px 10px',
                                textAlign: 'right',
                                color: '#94a3b8',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {fmtNum.format(local)}
                            </td>
                            <td
                              style={{
                                padding: '4px 10px',
                                textAlign: 'right',
                                color: '#e2e8f0',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {fmtNum.format(api)}
                            </td>
                            <td
                              style={{
                                padding: '4px 10px',
                                textAlign: 'right',
                                color: deltaColor,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {delta >= 0 ? '+' : ''}
                              {fmtNum.format(delta)}
                            </td>
                            <td
                              style={{
                                padding: '4px 10px',
                                textAlign: 'right',
                                color: deltaColor,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {delta >= 0 ? '+' : ''}
                              {pct.toFixed(3)}%
                            </td>
                            <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  borderRadius: 999,
                                  padding: '1px 7px',
                                  border: pass
                                    ? '1px solid rgba(52,211,153,0.45)'
                                    : '1px solid rgba(248,113,113,0.45)',
                                  background: pass
                                    ? 'rgba(16,185,129,0.15)'
                                    : 'rgba(239,68,68,0.15)',
                                  color: pass ? '#6ee7b7' : '#fca5a5',
                                }}
                              >
                                {pass ? 'OK' : 'DIFF'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {analyticsError ? (
            <p style={{ margin: '10px 0 0', color: '#fca5a5', fontSize: '0.8rem' }}>
              {analyticsError}
            </p>
          ) : null}

          {analyticsData ? (
            <div
              style={{
                marginTop: 10,
                border: '1px solid rgba(56,189,248,0.25)',
                borderRadius: 8,
                background: 'rgba(15,23,42,0.4)',
                padding: 10,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#7dd3fc',
                }}
              >
                Analytics endpoint (ranking + annual/monthly/weekly)
                {analyticsAt ? ` · ultimo fetch ${analyticsAt}` : ''}
              </p>

              <div
                style={{
                  marginTop: 8,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                  gap: 8,
                }}
              >
                {[
                  {
                    label: 'Source rows',
                    value: intFmt.format(Number(analyticsData.sourceRows || 0)),
                  },
                  {
                    label: 'Filtered rows',
                    value: intFmt.format(Number(analyticsData.filteredRows || 0)),
                  },
                  {
                    label: 'Annual buckets',
                    value: intFmt.format(Number(analyticsData?.analytics?.annual?.length || 0)),
                  },
                  {
                    label: 'Monthly buckets',
                    value: intFmt.format(Number(analyticsData?.analytics?.monthly?.length || 0)),
                  },
                  {
                    label: 'Weekly buckets',
                    value: intFmt.format(Number(analyticsData?.analytics?.weekly?.length || 0)),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      border: '1px solid rgba(56,189,248,0.2)',
                      borderRadius: 8,
                      padding: '6px 8px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.66rem', color: '#94a3b8' }}>{item.label}</p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#e2e8f0',
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {String(analyticsData?.analytics?.weeklyNote || '').trim() ? (
                <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                  {String(analyticsData.analytics.weeklyNote)}
                </p>
              ) : null}

              <div style={{ marginTop: 8, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                  <thead>
                    <tr style={{ color: '#64748b' }}>
                      {['Top Net', 'Client', 'Brand', 'Net', 'Deposit', 'Trades'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '4px 8px',
                            textAlign: h === 'Client' || h === 'Brand' ? 'left' : 'right',
                            borderBottom: '1px solid rgba(56,189,248,0.1)',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(analyticsData?.analytics?.rankings?.topNet || [])
                      .slice(0, 5)
                      .map((r, idx) => (
                        <tr key={`${r.clientId || r.clientName || idx}`}>
                          <td style={{ padding: '4px 8px', textAlign: 'right', color: '#94a3b8' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#e2e8f0' }}>
                            {String(r.clientName || '—')}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#94a3b8' }}>
                            {String(r.brand || '—')}
                          </td>
                          <td
                            style={{
                              padding: '4px 8px',
                              textAlign: 'right',
                              color: colorVal(Number(r.net || 0)),
                            }}
                          >
                            {moneyFmt.format(Number(r.net || 0))}
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', color: '#60a5fa' }}>
                            {moneyFmt.format(Number(r.deposit || 0))}
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', color: '#e2e8f0' }}>
                            {intFmt.format(Number(r.trades || 0))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* Prime-scope comparison bar — shown on Forex tabs so numbers are comparable with Prime Challenge */}
      {!loading && !error && brand !== 'BW Prime' && primeScope && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          {[
            {
              label: 'Prime – Clienti unici',
              value: intFmt.format(primeScope.clientCount),
              color: '#94a3b8',
            },
            {
              label: 'Prime – WD/Payout (same scope as Ranking)',
              value: moneyFmt.format(primeScope.totalWd),
              color: '#f87171',
            },
            {
              label: 'Prime – Deposit',
              value: moneyFmt.format(primeScope.totalDeposit),
              color: '#60a5fa',
            },
            {
              label: 'Prime – Closed PL',
              value: moneyFmt.format(primeScope.totalClosedPL),
              color: colorVal(primeScope.totalClosedPL),
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 180,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.65rem',
                  color: '#6366f1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 5,
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
