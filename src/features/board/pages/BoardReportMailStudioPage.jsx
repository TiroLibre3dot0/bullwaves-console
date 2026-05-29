import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../../../context/AuthContext'
import { BOARD_CONTACTS, SALES_CONTACTS } from '../../../constants/boardContacts'
import {
  loadCreolabsQlikAnalytics,
  loadCreolabsQlikClientDates,
  loadCreolabsQlikClientLists,
  loadCreolabsQlikClientMonths,
  loadCreolabsQlikKpis,
} from '../../creolabs/services/creolabsService'
import { buildAffiliatePaymentsMap } from '../../affiliate/services/affiliatePaymentsService'

// Per-template recipient list
const TEMPLATE_CONTACTS = {
  board: BOARD_CONTACTS,
  pulse: BOARD_CONTACTS,
  sales: SALES_CONTACTS,
  marketing: BOARD_CONTACTS,
  trustpilot: BOARD_CONTACTS,
  retention: BOARD_CONTACTS,
  'board-weekly': BOARD_CONTACTS,
}

// Sales & Conversion Team (Philippines + Jake) - nomi esatti da Qlik
const SALES_CONVERSION_TEAM = [
  'Cruisel John Sanoy',
  'Jhuna Mae Masayon',
  'Ernest Bautista',
  'Migs Dy',
  'Jake Morgan',
]

// Retention Team - 4 members
const RETENTION_TEAM = ['Orlin Simovonyan', 'Gabriela Yordanova', 'Uros Radic', 'Imran Hossain']

// Legacy alias for backward compatibility (SALES report uses SALES_CONVERSION_TEAM only)
const SALES_REP_NAMES = SALES_CONVERSION_TEAM

const TEMPLATE_KEYS = ['board', 'pulse', 'trustpilot', 'board-weekly']

// Static Trustpilot stats (from TrustPilot Review Tracker.normalized.csv — 687 reviews total)
// Used as fallback when /api/trustpilot/stats is unavailable
const STATIC_TRUSTPILOT_STATS = {
  total: 687,
  trustScore: 4.0,
  byRating: { 1: 132, 2: 17, 3: 18, 4: 53, 5: 467 },
  byCategory: {
    'Positive Feedback': 511,
    Complaint: 152,
    Neutral: 16,
    'Potential Sales Opportunity': 7,
  },
  byIssue: {
    Support: 253,
    Other: 190,
    Withdrawal: 144,
    Trading: 77,
    Registration: 23,
  },
  byStatus: {
    Reviewed: 92,
    Pending: 75,
    Replied: 39,
    Closed: 4,
    Escalated: 1,
  },
  pending: 75,
  escalated: 1,
  complaints: 152,
  positive: 511,
  negatives: [],
  positives: [],
  generatedAt: null,
}
const BULLWAVES_LOGO_URL = 'https://bullwaves-console.vercel.app/Logo.png'
const BULLWAVES_PORTAL_URL = 'https://portal.bullwaves.com/login'
const ENABLE_TOP_AFFILIATES_SECTION = false

function safeNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(safeNumber(value))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(safeNumber(value))
}

// Alias for formatCurrency (used in cluster template)
function formatMoney(value) {
  return formatCurrency(value)
}

// Helper to render an unordered list from array of HTML strings
function renderUnorderedList(items) {
  if (!Array.isArray(items) || items.length === 0) return ''
  const listItems = items.map((item) => `<li style="margin-bottom:8px;">${item}</li>`).join('')
  return `<ul style="margin:10px 0 0 20px;padding-left:0;list-style-position:outside;color:#334155;line-height:1.7;">${listItems}</ul>`
}

function formatK(value) {
  const n = safeNumber(value)
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}�${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 1_000) return `${sign}�${Math.round(abs / 1_000)}K`
  return `${sign}�${Math.round(abs)}`
}

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

function parsePeriodId(periodId) {
  const value = String(periodId || '').trim()
  const match = value.match(/^(\d{4})-([A-Za-z]{3})$/)
  if (!match) return null
  const year = Number(match[1])
  const monthLabel = match[2]
  const month = MONTH_ORDER[monthLabel]
  if (!year || !month) return null
  return { periodId: value, year, month, monthLabel, sort: year * 100 + month }
}

// -------------------------------------------------------------------------------
// LIFECYCLE UTILITY FUNCTIONS (Phase 1.2)
// -------------------------------------------------------------------------------

function parseDate(dateString) {
  if (!dateString || dateString === '-' || dateString === '�') return null
  const d = new Date(dateString)
  return Number.isFinite(d.getTime()) ? d : null
}

function calcDaysSince(dateString, referenceDate = new Date()) {
  const date = parseDate(dateString)
  if (!date) return null
  const diff = referenceDate.getTime() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function buildClientDatesMap(clientDatesPayload) {
  const rows = clientDatesPayload?.data?.rows || []
  const map = new Map()
  for (const row of rows) {
    if (!row?.clientId) continue
    map.set(String(row.clientId), {
      clientId: row.clientId,
      clientTimestamp: row.clientTimestamp,
      ltdDate: row.ltdDate,
      lttDate: row.lttDate,
      kycTimestamp: row.kycTimestamp,
      status: row.status,
      lastTimeComment: row.lastTimeComment,
    })
  }
  return map
}

function filterClientMonthsByPeriod(clientMonths, periodId) {
  if (!periodId) return clientMonths
  return clientMonths.filter((cm) => cm.periodId === periodId)
}

function filterClientDatesByDays(clientDatesMap, daysBack) {
  if (!daysBack || !Number.isFinite(daysBack)) return clientDatesMap
  const now = new Date()
  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
  const filtered = new Map()
  for (const [clientId, dates] of clientDatesMap.entries()) {
    const regDate = parseDate(dates.clientTimestamp)
    if (regDate && regDate >= cutoff) {
      filtered.set(clientId, dates)
    }
  }
  return filtered
}

function calcRetentionStats(clientMonths, clientDatesMap, salesRepFilter = null, periodId = null) {
  const filteredMonths = periodId
    ? filterClientMonthsByPeriod(clientMonths, periodId)
    : clientMonths
  const clients = new Set()
  const withRDP = new Set()
  const withLTD = new Set()
  const withLTT = new Set()

  for (const cm of filteredMonths) {
    if (salesRepFilter && cm.user !== salesRepFilter) continue
    const clientId = String(cm.clientId || '')
    if (!clientId) continue

    clients.add(clientId)
    if (safeNumber(cm.rdp) > 0) withRDP.add(clientId)

    const dates = clientDatesMap?.get(clientId)
    if (dates?.ltdDate && dates.ltdDate !== '-') withLTD.add(clientId)
    if (dates?.lttDate && dates.lttDate !== '-') withLTT.add(clientId)
  }

  const total = clients.size
  const rdpRate = total > 0 ? (withRDP.size / total) * 100 : 0
  const ltdRate = total > 0 ? (withLTD.size / total) * 100 : 0
  const lttRate = total > 0 ? (withLTT.size / total) * 100 : 0

  return {
    totalClients: total,
    withRDP: withRDP.size,
    withLTD: withLTD.size,
    withLTT: withLTT.size,
    rdpRate,
    ltdRate,
    lttRate,
  }
}

function groupByCohort(clientDatesMap, daysBack = [7, 14, 30, 60, 90]) {
  const now = new Date()
  const cohorts = {}

  for (const days of daysBack) {
    cohorts[`last_${days}d`] = {
      label: `Last ${days} days`,
      days,
      clients: [],
      count: 0,
    }
  }

  if (!clientDatesMap || clientDatesMap.size === 0) return cohorts

  for (const [clientId, dates] of clientDatesMap.entries()) {
    const daysSince = calcDaysSince(dates.clientTimestamp, now)
    if (daysSince === null) continue

    for (const days of daysBack) {
      if (daysSince <= days) {
        cohorts[`last_${days}d`].clients.push(clientId)
        cohorts[`last_${days}d`].count += 1
      }
    }
  }

  return cohorts
}

function calcAvgDaysToLTD(clientMonths, clientDatesMap) {
  const delays = []
  const processed = new Set()

  for (const cm of clientMonths) {
    const clientId = String(cm.clientId || '')
    if (!clientId || processed.has(clientId)) continue

    const dates = clientDatesMap?.get(clientId)
    if (!dates?.clientTimestamp || !dates?.ltdDate) continue

    const regDate = parseDate(dates.clientTimestamp)
    const ltdDate = parseDate(dates.ltdDate)
    if (!regDate || !ltdDate) continue

    const diff = ltdDate.getTime() - regDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days >= 0) delays.push(days)
    processed.add(clientId)
  }

  if (delays.length === 0) return null
  return Math.round(delays.reduce((a, b) => a + b, 0) / delays.length)
}

// -------------------------------------------------------------------------------
// MARKETING HELPER FUNCTIONS (Phase 2B)
// -------------------------------------------------------------------------------

function calcWeeklyRegistrations(clientDatesMap, weeksBack = 6, daysBackMax = null) {
  const now = new Date()
  const weeks = []

  // Filter to recent registrations if daysBackMax specified
  const filteredMap = daysBackMax
    ? filterClientDatesByDays(clientDatesMap, daysBackMax)
    : clientDatesMap

  for (let w = 0; w < weeksBack; w++) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (w + 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    weeks.unshift({
      label: `W${weeksBack - w}`,
      start: weekStart,
      end: weekEnd,
      count: 0,
    })
  }

  if (!filteredMap || filteredMap.size === 0) return weeks

  for (const [_, dates] of filteredMap.entries()) {
    const regDate = parseDate(dates.clientTimestamp)
    if (!regDate) continue

    for (const week of weeks) {
      if (regDate >= week.start && regDate <= week.end) {
        week.count += 1
        break
      }
    }
  }

  return weeks
}

function calcConversionFunnel(clientDatesMap, clientMonths, daysBack = 30) {
  const registered = new Set()
  const deposited = new Set()
  const firstTrade = new Set()

  // Filter to recent registrations only
  const filteredDates = filterClientDatesByDays(clientDatesMap, daysBack)

  // Count registrations from filtered clientDates
  if (filteredDates && filteredDates.size > 0) {
    for (const [clientId] of filteredDates.entries()) {
      registered.add(clientId)
    }
  }

  // Count deposits and trades from clientMonths (only for registered clients in period)
  for (const cm of clientMonths) {
    const clientId = String(cm.clientId || '')
    if (!clientId || !registered.has(clientId)) continue

    if (safeNumber(cm.deposit) > 0) deposited.add(clientId)

    const dates = filteredDates.get(clientId)
    if (dates?.ltdDate && dates.ltdDate !== '-') firstTrade.add(clientId)
  }

  const totalReg = registered.size
  const depositRate = totalReg > 0 ? (deposited.size / totalReg) * 100 : 0
  const tradeRate = totalReg > 0 ? (firstTrade.size / totalReg) * 100 : 0

  return {
    registered: totalReg,
    deposited: deposited.size,
    firstTrade: firstTrade.size,
    depositRate,
    tradeRate,
    daysBack,
  }
}

function renderWeeklyTrendMiniChart(weeks) {
  if (!weeks || weeks.length === 0) return ''

  const max = Math.max(...weeks.map((w) => w.count), 1)
  const width = 400
  const height = 120
  const barWidth = Math.floor((width - (weeks.length - 1) * 4) / weeks.length)

  const bars = weeks
    .map((week, i) => {
      const barHeight = max > 0 ? Math.round((week.count / max) * 80) : 0
      const x = i * (barWidth + 4)
      const y = 80 - barHeight
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="2"/><text x="${x + barWidth / 2}" y="95" fill="#64748b" font-size="10" text-anchor="middle">${week.label}</text><text x="${x + barWidth / 2}" y="${y - 4}" fill="#0f172a" font-size="10" font-weight="600" text-anchor="middle">${week.count}</text>`
    })
    .join('')

  return `<svg width="${width}" height="${height}" style="display:block;margin:0 auto;">${bars}</svg>`
}

function getDaysInMonth(year, month) {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 0
  return new Date(year, month, 0).getDate()
}

function getBusinessDaysInMonth(year, month, upToDay = null) {
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 0
  const totalDays = getDaysInMonth(year, month)
  const limit =
    Number.isFinite(upToDay) && upToDay > 0
      ? Math.min(Math.max(Math.floor(upToDay), 1), totalDays)
      : totalDays
  let businessDays = 0
  for (let day = 1; day <= limit; day += 1) {
    const weekDay = new Date(year, month - 1, day).getDay()
    if (weekDay !== 0 && weekDay !== 6) businessDays += 1
  }
  return businessDays
}

function shiftPeriodMeta(meta, monthOffset) {
  if (
    !meta ||
    !Number.isFinite(meta.year) ||
    !Number.isFinite(meta.month) ||
    !Number.isFinite(monthOffset)
  ) {
    return null
  }
  const date = new Date(meta.year, meta.month - 1 + monthOffset, 1)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const monthLabel = Object.keys(MONTH_ORDER).find((label) => MONTH_ORDER[label] === month)
  if (!monthLabel) return null
  return {
    year,
    month,
    monthLabel,
    periodId: `${year}-${monthLabel}`,
    sort: year * 100 + month,
  }
}

function buildSameWindowMomComparison(monthlyById, currentMeta, currentElapsedDays) {
  if (!currentMeta || !Number.isFinite(currentElapsedDays)) {
    return { available: false, periodId: null, businessDays: 0, value: 0, dailyAvg: 0 }
  }

  const prevMeta = shiftPeriodMeta(currentMeta, -1)
  if (!prevMeta) return { available: false, periodId: null, businessDays: 0, value: 0, dailyAvg: 0 }

  const prevMonth = monthlyById.get(prevMeta.periodId)
  if (!prevMonth)
    return { available: false, periodId: prevMeta.periodId, businessDays: 0, value: 0, dailyAvg: 0 }

  // Use SAME elapsed days window (not full month)
  const comparisonWindow = Math.min(
    currentElapsedDays,
    getDaysInMonth(prevMeta.year, prevMeta.month)
  )
  const businessDays = getBusinessDaysInMonth(prevMeta.year, prevMeta.month, comparisonWindow)

  // Scale previous month value to same-window proportion
  const fullMonthBusinessDays = getBusinessDaysInMonth(prevMeta.year, prevMeta.month)
  const windowProportion = businessDays / Math.max(fullMonthBusinessDays, 1)
  const value = safeNumber(prevMonth.closedPl) * windowProportion

  return {
    available: true,
    periodId: prevMeta.periodId,
    window: `days 1-${comparisonWindow}`,
    businessDays,
    value,
    dailyAvg: value / Math.max(businessDays, 1),
  }
}

function buildTrailingDailyAverageComparison(monthlyById, latestMeta, monthsBack) {
  if (!latestMeta || !Number.isFinite(monthsBack) || monthsBack < 1) {
    return {
      available: false,
      days: 0,
      closedPl: 0,
      dailyAvg: 0,
      label: 'n/a',
      periodLabel: 'n/a',
      expectedMonths: monthsBack,
      foundMonths: 0,
    }
  }

  const metas = []
  for (let step = monthsBack; step >= 1; step -= 1) {
    const meta = shiftPeriodMeta(latestMeta, -step)
    if (meta) metas.push(meta)
  }

  let days = 0
  let closedPl = 0
  let foundMonths = 0
  const foundPeriodIds = []

  for (const meta of metas) {
    const row = monthlyById.get(meta.periodId)
    if (!row) continue
    foundMonths += 1
    foundPeriodIds.push(meta.periodId)
    days += getBusinessDaysInMonth(meta.year, meta.month)
    closedPl += safeNumber(row.closedPl)
  }

  const dailyAvg = days > 0 ? closedPl / days : 0
  const firstPeriod = foundPeriodIds[0] || ''
  const lastPeriod = foundPeriodIds[foundPeriodIds.length - 1] || ''
  const periodLabel =
    firstPeriod && lastPeriod
      ? firstPeriod === lastPeriod
        ? firstPeriod
        : `${firstPeriod} to ${lastPeriod}`
      : 'n/a'

  return {
    available: foundMonths > 0 && days > 0,
    days,
    closedPl,
    dailyAvg,
    label: `${foundMonths}/${monthsBack} months`,
    periodLabel,
    expectedMonths: monthsBack,
    foundMonths,
  }
}

function sortMonthlyRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : []
  return [...safeRows].sort((a, b) => {
    const pa = parsePeriodId(a?.periodId)
    const pb = parsePeriodId(b?.periodId)
    if (!pa && !pb) return 0
    if (!pa) return -1
    if (!pb) return 1
    return pa.sort - pb.sort
  })
}

function formatDelta(current, previous, formatter) {
  const c = safeNumber(current)
  const p = safeNumber(previous)
  const diff = c - p
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : ''
  const absDiff = Math.abs(diff)
  const deltaText = `${sign}${formatter(absDiff)}`
  if (p === 0) return `${deltaText} (${p === c ? '0%' : 'n/a'})`
  const pct = Math.round((diff / p) * 100)
  const pctSign = pct > 0 ? '+' : ''
  return `${deltaText} (${pctSign}${pct}%)`
}

function formatDeltaColored(current, previous, formatter) {
  const c = safeNumber(current)
  const p = safeNumber(previous)
  const diff = c - p
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : ''
  const color = diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#64748b'
  const absDiff = Math.abs(diff)
  const deltaText = `${sign}${formatter(absDiff)}`
  if (p === 0) {
    const pctPart = p === c ? '0%' : 'n/a'
    return `${deltaText} (<span style="color:${color};font-weight:600;">${pctPart}</span>)`
  }
  const pct = Math.round((diff / p) * 100)
  const pctSign = pct > 0 ? '+' : ''
  return `${deltaText} (<span style="color:${color};font-weight:600;">${pctSign}${pct}%</span>)`
}

function renderComparisonTable(rows) {
  const safeRows = Array.isArray(rows) ? rows : []
  if (!safeRows.length) {
    return '<p style="margin:0;color:#4b5563;font-size:14px;">No monthly comparison available from live payload.</p>'
  }

  const formatDeltaWithColoredPct = (deltaStr) => {
    const str = String(deltaStr || '')
    // Parse format: "+$1,234 (+15%)" or "+123 (-5%)" or "n/a"
    const match = str.match(/^(.+?)\s*\(([+-]?\d+%)\)$/)
    if (!match) return escapeHtml(str) // no percentage found, return as-is
    const [, absolute, percentage] = match
    const pctColor = percentage.startsWith('+')
      ? '#16a34a'
      : percentage.startsWith('-')
        ? '#dc2626'
        : '#64748b'
    return `${escapeHtml(absolute)} <span style="color:${pctColor};font-weight:600;">(${escapeHtml(percentage)})</span>`
  }

  const body = safeRows
    .map(
      (row) => `
      <tr>
        <td style="padding:9px 10px;border-bottom:1px solid #e7eefb;font-size:13px;color:#0f172a;">${escapeHtml(
          row.metric
        )}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #e7eefb;font-size:13px;color:#0f172a;text-align:right;font-weight:700;">${escapeHtml(
          row.current
        )}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #e7eefb;font-size:12px;color:#334155;text-align:right;">${formatDeltaWithColoredPct(
          row.mom
        )}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #e7eefb;font-size:12px;color:#334155;text-align:right;">${formatDeltaWithColoredPct(
          row.yoy
        )}</td>
      </tr>
    `
    )
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;overflow:hidden;">
      <tr>
        <th style="text-align:left;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">Metric</th>
        <th style="text-align:right;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">Current Month</th>
        <th style="text-align:right;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">MoM</th>
        <th style="text-align:right;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">YoY</th>
      </tr>
      ${body}
    </table>
  `
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function renderKpiCards(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<p style="margin:0;color:#4b5563;font-size:14px;">No real KPI cards available from data source.</p>'
  }

  const cardCell = (row, extraStyle = '') =>
    `<td style="padding:0 4px 10px 4px;width:50%;vertical-align:top;${extraStyle}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border:1px solid #dbe5f4;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:14px 16px;">
            <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">${escapeHtml(row.label)}</div>
            <div style="margin-top:6px;font-size:20px;line-height:1.2;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(row.value)}</div>
          </td>
        </tr>
      </table>
    </td>`

  const pairRows = []
  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i]
    const right = rows[i + 1]
    if (right) {
      pairRows.push(`<tr>${cardCell(left)}${cardCell(right)}</tr>`)
    } else {
      pairRows.push(
        `<tr><td colspan="2" style="padding:0 0 10px 0;">${cardCell(left)
          .replace(/^<td[^>]*>/, '')
          .replace(/<\/td>$/, '')}</td></tr>`
      )
    }
  }

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;margin-bottom:4px;">
      ${pairRows.join('')}
    </table>
  `
}

function renderInsightStrip(items) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : []
  if (!safeItems.length) return ''

  const rows = safeItems
    .map((item) => {
      // Support both plain strings and objects with { text, html: true }
      const isHtmlSafe = typeof item === 'object' && item !== null && item.html === true
      const content = isHtmlSafe ? item.text : escapeHtml(item)
      return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px dashed #dbeafe;color:#0f172a;font-size:14px;line-height:1.45;">${content}</td>
      </tr>
    `
    })
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8fbff;border:1px solid #dbeafe;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:12px 14px 0 14px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#1d4ed8;font-weight:700;">Executive Notes</td>
      </tr>
      <tr>
        <td style="padding:4px 14px 10px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${rows}
          </table>
        </td>
      </tr>
    </table>
  `
}

function renderMetricTable(rows, caption) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '<p style="margin:0;color:#4b5563;font-size:14px;">No real rows available from data source.</p>'
  }

  const captionRow = caption
    ? `<tr><td colspan="2" style="padding:9px 12px 7px 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#475569;background:#f8fbff;border-bottom:1px solid #dbe5f4;font-weight:700;">${escapeHtml(caption)}</td></tr>`
    : ''

  const lines = rows
    .map((row) => {
      const valueColor = row.color || '#111827' // use custom color if provided
      const valueWeight = row.color ? '700' : '600' // bold if colored
      const displayValue = row.html ? row.value : escapeHtml(row.value)
      return `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">${escapeHtml(
            row.label
          )}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:${valueColor};text-align:right;font-weight:${valueWeight};">${displayValue}</td>
        </tr>`
    })
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;overflow:hidden;">${captionRow}${lines}</table>`
}

function renderRankTable(title, rows, valueKey, formatter) {
  const safeRows = Array.isArray(rows) ? rows : []
  const body = safeRows
    .slice(0, 8)
    .map((item, idx) => {
      const value = formatter(item?.[valueKey])
      return `<tr>
        <td style="padding:9px 10px;border-bottom:1px solid #e7eefb;font-size:12px;color:#1e293b;font-weight:700;">${idx + 1}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #e7eefb;font-size:13px;color:#0f172a;">${escapeHtml(
          item?.clientName || item?.clientId || '-'
        )}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #e7eefb;font-size:12px;color:#334155;">${escapeHtml(
          item?.brand || '-'
        )}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #e7eefb;font-size:13px;color:#0f172a;text-align:right;font-weight:700;">${escapeHtml(
          value
        )}</td>
      </tr>`
    })
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;overflow:hidden;">
      <tr>
        <th colspan="4" style="text-align:left;background:#f8fbff;padding:9px 12px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#475569;border-bottom:1px solid #e7eefb;font-weight:700;">${escapeHtml(
          title
        )}</th>
      </tr>
      <tr>
        <th style="text-align:left;padding:8px 10px;background:#f8fbff;font-size:11px;color:#334155;">#</th>
        <th style="text-align:left;padding:8px 10px;background:#f8fbff;font-size:11px;color:#334155;">Client</th>
        <th style="text-align:left;padding:8px 10px;background:#f8fbff;font-size:11px;color:#334155;">Brand</th>
        <th style="text-align:right;padding:8px 10px;background:#f8fbff;font-size:11px;color:#334155;">Value</th>
      </tr>
      ${
        body ||
        '<tr><td colspan="4" style="padding:10px 12px;font-size:13px;color:#6b7280;">No real ranking rows available.</td></tr>'
      }
    </table>
  `
}

function buildMailHtml({
  title,
  subtitle,
  intro,
  sections,
  hideDefaultHeader = false,
  hideSectionTitles = false,
}) {
  const currentMonthLabel = new Date()
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase()

  const renderedSections = sections
    .map((section) => {
      const sectionTitleHtml = hideSectionTitles
        ? ''
        : `<h2 style="margin:0 0 14px 0;padding:0 0 8px 0;border-bottom:1px solid #e2e8f0;font-size:17px;line-height:1.25;color:#0f172a;font-weight:700;letter-spacing:0.01em;">${escapeHtml(section.title)}</h2>`
      const sectionPadding = section?.fullBleed ? '0 0 40px 0' : '0 24px 40px 24px'
      return `
      <tr>
        <td class="email-pad" style="padding:${sectionPadding};">
          ${sectionTitleHtml}
          ${section.html}
        </td>
      </tr>
    `
    })
    .join('')

  const headerHtml = hideDefaultHeader
    ? ''
    : `
            <tr>
              <td class="email-header" style="padding:22px 24px 20px 24px;background:#0f172a;color:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="right" style="padding:0 0 10px 0;">
                      <span style="display:inline-block;padding:2px 7px;font-size:8px;line-height:1.1;letter-spacing:0.05em;text-transform:uppercase;background:#13213a;color:#bfdbfe;border:1px solid #2b446f;border-radius:999px;font-weight:600;">${escapeHtml(currentMonthLabel)} • Creolabs API | V 1.0</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 auto;">
                        <tr>
                          <td style="vertical-align:middle;padding:0 12px 0 0;">
                            <img src="${BULLWAVES_LOGO_URL}" alt="Bullwaves" style="display:block;height:34px;width:auto;max-height:34px;border:0;margin:0;" />
                          </td>
                          <td style="vertical-align:middle;padding:0 12px;">
                            <div style="width:1px;height:34px;background:#60a5fa;border-radius:1px;"></div>
                          </td>
                          <td style="vertical-align:middle;padding:0 0 0 12px;">
                            <span style="display:block;font-family:Georgia, 'Times New Roman', serif;font-size:20px;line-height:1.08;font-weight:700;letter-spacing:0.02em;color:#f8fafc;">Board snapshot</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`

  const introHtml = intro
    ? `<tr>
              <td class="email-pad" style="padding:16px 24px 10px 24px;font-size:14px;color:#334155;line-height:1.55;">${escapeHtml(intro)}</td>
            </tr>`
    : ''

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      @media only screen and (max-width:600px){
        .email-container{width:100%!important;border-radius:0!important;}
        .email-pad{padding:14px 12px!important;}
        .email-header{padding:18px 12px 14px 12px!important;}
        .email-h1{font-size:20px!important;}
        .card-cell{display:block!important;width:100%!important;padding:0 0 8px 0!important;box-sizing:border-box!important;}
        .card-row td{display:block!important;width:100%!important;}
        table[role=presentation]{width:100%!important;}
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#edf3fb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf3fb;padding:20px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" class="email-container" style="max-width:980px;width:100%;background:#ffffff;border:1px solid #d6e2f3;border-radius:16px;overflow:hidden;">
            ${headerHtml}
            ${introHtml}
            ${renderedSections}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// ----------------------------------------------------------------------------
// BOARD WEEKLY REPORT  premium executive template
// ----------------------------------------------------------------------------
//
// Lives inside the existing Report Mail Studio rendering pipeline.
// Visual language adapted from /creolabs/board-snapshot but recast for
// email + print: table-based, inline styles, controlled width, restrained
// accent palette, dark "executive notes" call-out as the closing weight.
//
// Data contract (no recomputation): /api/qlik/creolabs/reports/board-snapshot
// ----------------------------------------------------------------------------

const BW_PALETTE = {
  ink: '#0f172a',
  inkSoft: '#1e293b',
  inkMute: '#475569',
  inkFaint: '#64748b',
  inkGhost: '#94a3b8',
  hairline: '#e2e8f0',
  hairlineSt: '#cbd5e1',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  surfaceSub: '#f1f5f9',
  premium: '#0f172a',
  premium2: '#111c30',
  premiumInk: '#e2e8f0',
  premiumMut: '#94a3b8',
  accent: '#1d4ed8',
  accentSoft: '#eff6ff',
  accentBord: '#bfdbfe',
  up: '#047857',
  upSoft: '#ecfdf5',
  upBord: '#a7f3d0',
  down: '#b91c1c',
  downSoft: '#fef2f2',
  downBord: '#fecaca',
  watch: '#b45309',
  watchSoft: '#fffbeb',
  watchBord: '#fde68a',
}

function bwFmtCur(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Math.round(n))}`
}
function bwFmtNum(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Math.round(n))
}
function bwFmtCurCompact(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  const abs = Math.abs(n)
  if (abs >= 1000000) return `${(n / 1000000).toFixed(2).replace(/\.00$/, '')}M`
  if (abs >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return bwFmtCur(n)
}
function bwFmtNumCompact(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  const abs = Math.abs(n)
  if (abs >= 1000000) return `${(n / 1000000).toFixed(2).replace(/\.00$/, '')}M`
  if (abs >= 1000) return `${(n / 1000).toFixed(0)}K`
  return bwFmtNum(n)
}
function bwFmtPct(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  return `${n.toFixed(1)}%`
}
function bwFmtDelta(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  const s = n >= 0 ? '+' : ''
  return `${s}${n.toFixed(1)}%`
}
function bwFmtDateLong(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(iso)
  }
}
function bwFmtDateMD(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  } catch {
    return String(iso)
  }
}
function bwPctChange(current, previous) {
  const c = Number(current)
  const p = Number(previous)
  if (!Number.isFinite(c) || !Number.isFinite(p) || Math.abs(p) < 0.000001) return 0
  return ((c - p) / Math.abs(p)) * 100
}
function bwNormalizeTradingEdgeKpiForView(kpi) {
  if (!kpi) return kpi
  // Trader losses = Bullwaves revenue (negate to show positive business perspective)
  const current = -safeNumber(kpi.current)
  const projection = -safeNumber(kpi.projection)
  const previousComparable = projection && Number.isFinite(kpi.deltaPct) ? null : null
  const deltaPct = Number.isFinite(Number(kpi.deltaPct)) ? -safeNumber(kpi.deltaPct) : 0
  return {
    ...kpi,
    current,
    projection,
    deltaPct,
    previousComparable,
    label: 'Bullwaves Edge',
    interpretation: 'Revenue from client trading losses',
  }
}
function bwToneOf(delta) {
  const n = Number(delta)
  if (!Number.isFinite(n)) return 'neutral'
  if (n >= 5) return 'up'
  if (n <= -5) return 'down'
  return 'watch'
}
function bwTone(tone) {
  if (tone === 'up')
    return {
      color: BW_PALETTE.up,
      bg: BW_PALETTE.upSoft,
      border: BW_PALETTE.upBord,
      arrow: '▲',
      label: 'STRONG',
    }
  if (tone === 'down')
    return {
      color: BW_PALETTE.down,
      bg: BW_PALETTE.downSoft,
      border: BW_PALETTE.downBord,
      arrow: '▼',
      label: 'PRESSURE',
    }
  if (tone === 'watch')
    return {
      color: BW_PALETTE.watch,
      bg: BW_PALETTE.watchSoft,
      border: BW_PALETTE.watchBord,
      arrow: '●',
      label: 'MONITOR',
    }
  return {
    color: BW_PALETTE.inkMute,
    bg: BW_PALETTE.surfaceSub,
    border: BW_PALETTE.hairline,
    arrow: '',
    label: '',
  }
}

function bwSparkPct(delta) {
  const n = Math.abs(Number(delta) || 0)
  return Math.max(8, Math.min(100, n * 2))
}

// -- Helper: generate Unicode sparkline --------------------------------------
function bwSparkline(values) {
  if (!Array.isArray(values) || values.length === 0)
    return '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581'
  const blocks = ['\u2581', '\u2582', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2588']
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return values
    .map((v) => blocks[Math.min(7, Math.max(0, Math.floor(((v - min) / range) * 7)))])
    .join('')
}

// -- NEW HEADER (Board Snapshot style) ---------------------------------------
function bwHero(snapshot) {
  const pc = snapshot?.periodContext || {}
  const reportDate = pc.reportDate ? new Date(pc.reportDate) : null
  const reportMonthLabel = reportDate
    ? reportDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase()
    : 'CURRENT PERIOD'
  const generatedAt = snapshot?.generatedAt ? new Date(snapshot.generatedAt) : null
  const generatedDateLabel = generatedAt
    ? generatedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''
  const generatedTimeLabel = generatedAt
    ? generatedAt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : ''

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(90deg,#081a44 0%,#0b214f 52%,#0a1c45 100%);border:0;border-radius:18px 18px 0 0;overflow:hidden;">
      <tr>
        <td style="padding:18px 22px 16px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td width="25%" style="vertical-align:middle;padding-right:16px;">
                <img src="${BULLWAVES_LOGO_URL}" alt="Bullwaves" style="height:40px;width:auto;display:block;max-width:210px;" />
              </td>
              <td width="43%" style="vertical-align:middle;border-left:1px solid rgba(191,219,254,0.34);padding:0 18px;">
                <div style="font-size:23px;font-weight:800;color:#f8fafc;line-height:1.05;letter-spacing:-0.03em;">Board Snapshot</div>
                <div style="font-size:14px;color:#f8fafc;font-weight:500;line-height:1.2;margin-top:4px;">Weekly Performance Report</div>
              </td>
              <td width="32%" align="right" style="vertical-align:middle;padding-left:12px;">
                <span style="display:inline-block;padding:8px 14px;border:1px solid rgba(191,219,254,0.4);border-radius:999px;color:#ffffff;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;white-space:nowrap;">${escapeHtml(reportMonthLabel)} · CREOLABS API v1.1.0</span>
                <div style="font-size:12px;color:#ffffff;font-weight:500;line-height:1.2;margin-top:10px;">Generated: ${escapeHtml(generatedDateLabel)} · ${escapeHtml(generatedTimeLabel)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

// -- Section eyebrow + title (institutional rhythm) --------------------------
function bwEyebrow(num, title, hint) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px 0;">
      <tr>
        <td style="vertical-align:bottom;">
          <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${BW_PALETTE.inkFaint};font-weight:700;margin:0 0 4px 0;">${escapeHtml(num)}  ${escapeHtml(title.toUpperCase())}</div>
          ${hint ? `<div style="font-size:12px;color:${BW_PALETTE.inkMute};font-weight:500;line-height:1.4;">${escapeHtml(hint)}</div>` : ''}
        </td>
      </tr>
    </table>`
}

// -- 01  THIS WEEK IN ONE SCREEN (new hero section with KPI cards) ----------
function bwSectionThisWeek(snapshot) {
  const pc = snapshot?.periodContext || {}
  const k = snapshot?.kpis || {}

  // Period label
  const periodStartDate = pc.currentPeriodStart ? new Date(pc.currentPeriodStart) : null
  const periodEndDate = pc.currentPeriodEnd ? new Date(pc.currentPeriodEnd) : null
  const periodStart = periodStartDate
    ? periodStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : ''
  const periodEnd = periodEndDate
    ? periodEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const elapsedDays = pc.elapsedDays || 0
  const totalDays = pc.totalDaysInMonth || 31
  const reportDate = pc.reportDate ? new Date(pc.reportDate) : null
  const reportMonth = reportDate
    ? `${reportDate.getFullYear()}-${reportDate.toLocaleDateString('en-GB', { month: 'short' })}`
    : 'Current Period'
  const reportMonthName = reportDate
    ? reportDate.toLocaleDateString('en-GB', { month: 'long' })
    : 'This month'

  // Mixed week badge logic
  let mixedWeekLabel = 'MIXED WEEK'
  let mixedWeekColor = '#f59e0b'
  const netDelta = Number(k.netDeposits?.deltaPct)
  const ftdDelta = Number(k.ftdCount?.deltaPct)
  if (Number.isFinite(netDelta) && Number.isFinite(ftdDelta)) {
    if (netDelta >= 5 && ftdDelta >= 5) {
      mixedWeekLabel = 'STRONG WEEK'
      mixedWeekColor = '#10b981'
    } else if (netDelta <= -5 && ftdDelta <= -5) {
      mixedWeekLabel = 'SOFT WEEK'
      mixedWeekColor = '#ef4444'
    }
  }

  // KPI Cards data - reordered: Registrations, FTD+RDP, Net Deposits, Bullwaves Edge
  const ftdRdpCurrent = Number(k.ftdCount?.current || 0) + Number(k.rdpCount?.current || 0)
  const ftdRdpProjection = Number(k.ftdCount?.projection || 0) + Number(k.rdpCount?.projection || 0)
  const ftdRdpDeltaPct =
    Number.isFinite(k.ftdCount?.deltaPct) && Number.isFinite(k.rdpCount?.deltaPct)
      ? (Number(k.ftdCount?.deltaPct) + Number(k.rdpCount?.deltaPct)) / 2
      : Number.isFinite(k.ftdCount?.deltaPct)
        ? k.ftdCount?.deltaPct
        : k.rdpCount?.deltaPct

  const kpiCards = [
    {
      label: 'LEADS',
      current: snapshot.funnel?.leads || 0,
      projection: k.registrations?.projection || 0,
      momPct: k.registrations?.deltaPct,
      color: '#10b981',
      bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f7fef9 100%)',
      format: 'number',
    },
    {
      label: 'FTD + RDP',
      current: ftdRdpCurrent,
      projection: ftdRdpProjection,
      momPct: ftdRdpDeltaPct,
      color: '#2563eb',
      bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
      format: 'number',
    },
    {
      label: 'NET DEPOSITS',
      current: k.netDeposits?.current || 0,
      projection: k.netDeposits?.projection || 0,
      momPct: k.netDeposits?.deltaPct,
      color: '#2563eb',
      bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
      format: 'currency',
    },
    {
      label: 'BULLWAVES EDGE',
      current: -(k.closedPl?.current || 0),
      projection: -(k.closedPl?.projection || 0),
      momPct: -(k.closedPl?.deltaPct || 0),
      color: '#10b981',
      bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f7fef9 100%)',
      format: 'currency',
    },
  ]

  const renderKpiCard = (card) => {
    const mom = Number(card.momPct)
    const momStr = Number.isFinite(mom)
      ? mom > 0
        ? `+${Math.round(mom)}%`
        : `${Math.round(mom)}%`
      : 'n/a'
    const momColor = mom > 0 ? '#10b981' : mom < 0 ? '#dc2626' : '#64748b'

    const fmt = card.format === 'currency' ? bwFmtCurCompact : bwFmtNum
    const currentFormatted = fmt(card.current)
    const projectionFormatted = fmt(card.projection)

    return `
      <td width="25%" valign="top" style="padding:0 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${card.bgGradient};border:1px solid rgba(148,163,184,0.18);border-radius:16px;box-shadow:0 10px 24px rgba(15,23,42,0.07);height:168px;overflow:hidden;">
          <tr>
            <td style="padding:18px 20px 16px 20px;vertical-align:top;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${card.color};font-weight:800;margin-bottom:10px;">${escapeHtml(card.label)}</div>
              <div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.04;margin-bottom:4px;">${escapeHtml(currentFormatted)}</div>
              <div style="font-size:12px;color:${momColor};font-weight:700;margin-bottom:10px;">MoM: ${escapeHtml(momStr)}</div>
              <div style="border-top:1px solid rgba(148,163,184,0.15);padding-top:10px;">
                <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:4px;">PROJECTED</div>
                <div style="font-size:15px;color:#334155;font-weight:700;">${escapeHtml(projectionFormatted)}</div>
              </div>
            </td>
          </tr>
        </table>
      </td>`
  }

  const kpiCardsGridHtml = kpiCards.map(renderKpiCard).join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;padding:0;margin:22px 0 0 0;">
      <tr>
        <td style="padding:0 0 12px 0;border-bottom:1px solid #dbe7f6;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td width="44%" style="vertical-align:middle;padding:0 12px 0 0;">
                <div style="font-size:19px;font-weight:800;color:#0f172a;line-height:1.15;margin:0 0 8px 0;">This Week in One Screen · ${escapeHtml(reportMonth)}</div>
                <div style="font-size:13px;color:#334155;font-weight:500;line-height:1.45;">MTD period: ${escapeHtml(periodStart)} → ${escapeHtml(periodEnd)} (${elapsedDays} days elapsed)</div>
              </td>
              <td width="14%" align="center" style="vertical-align:middle;padding:0 10px;">
                <span style="display:inline-block;padding:10px 16px;background:#fff7e6;color:${mixedWeekColor};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:800;border-radius:999px;white-space:nowrap;">${escapeHtml(mixedWeekLabel)}</span>
              </td>
              <td width="42%" valign="middle" style="padding-top:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#f7faff;border:1px solid #d3e3fb;border-radius:12px;box-shadow:0 6px 14px rgba(37,99,235,0.05);margin-top:0;">
                  <tr>
                    <td style="padding:12px 16px 11px 16px;vertical-align:top;">
                      <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#1e40af;font-weight:800;margin:0 0 6px 0;">PERIOD CONTEXT</div>
                      <div style="font-size:12px;color:#1e293b;font-weight:500;line-height:1.45;margin-bottom:4px;">${escapeHtml(reportMonthName)} is currently <strong>${Math.round(pc.mtdPercentage || 0)}% complete</strong> (${elapsedDays} of ${totalDays} days).</div>
                      <div style="font-size:12px;color:#1d4ed8;font-weight:700;line-height:1.45;">All MoM comparisons are normalized to daily averages</div>
                      <div style="font-size:12px;color:#1e293b;font-weight:500;line-height:1.45;">to account for incomplete month.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;">
            <tr>
              ${kpiCardsGridHtml}
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

// -- Section eyebrow + title (institutional rhythm) --------------------------
function bwEyebrow_OLD(num, title, hint) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px 0;">
      <tr>
        <td style="vertical-align:bottom;">
          <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${BW_PALETTE.inkFaint};font-weight:700;margin:0 0 4px 0;">${escapeHtml(num)}  ${escapeHtml(title.toUpperCase())}</div>
          ${hint ? `<div style="font-size:12px;color:${BW_PALETTE.inkMute};font-weight:500;line-height:1.4;">${escapeHtml(hint)}</div>` : ''}
        </td>
      </tr>
    </table>`
}

// -- 01  Reporting period  methodology strip -------------------------------
function bwSectionPeriod(pc) {
  const items = [
    ['Reporting date', bwFmtDateLong(pc.reportDate)],
    [
      'MTD progress',
      `${pc.elapsedDays || 0} / ${pc.totalDaysInMonth || 0} days • ${pc.mtdPercentage || 0}%`,
    ],
    [
      'Current window',
      `${bwFmtDateMD(pc.currentPeriodStart)} ? ${bwFmtDateMD(pc.currentPeriodEnd)}`,
    ],
    [
      'Comparable window',
      `${bwFmtDateMD(pc.previousComparablePeriodStart)} ? ${bwFmtDateMD(pc.previousComparablePeriodEnd)}`,
    ],
  ]
  const cells = items
    .map(
      ([k, v]) => `
    <td style="padding:14px 16px;vertical-align:top;border-right:1px solid ${BW_PALETTE.hairline};">
      <div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${BW_PALETTE.inkFaint};font-weight:700;margin:0 0 6px 0;">${escapeHtml(k)}</div>
      <div style="font-size:13px;color:${BW_PALETTE.ink};font-weight:600;line-height:1.3;">${escapeHtml(v)}</div>
    </td>`
    )
    .join('')
  return `
    ${bwEyebrow('01', 'Reporting period', 'Methodology • MTD daily-average run-rate projection')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BW_PALETTE.surfaceAlt};border:1px solid ${BW_PALETTE.hairline};border-radius:10px;overflow:hidden;">
      <tr>${cells.replace(/border-right:1px solid [^;]+;(?=[^<]*<\/td>\s*$)/, '')}</tr>
    </table>`
}

// -- KPI card cell (used inside a 2-col table) -------------------------------
function bwKpiCell(label, kpi, kind) {
  const tone = bwToneOf(kpi?.deltaPct)
  const t = bwTone(tone)
  const fmt = kind === 'number' ? bwFmtNum : bwFmtCur
  const spark = bwSparkPct(kpi?.deltaPct)
  return `
    <td class="card-cell" width="50%" style="padding:0 8px 14px 0;vertical-align:top;box-sizing:border-box;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BW_PALETTE.surface};border:1px solid ${BW_PALETTE.hairline};border-radius:10px;box-shadow:0 8px 22px rgba(15,23,42,0.08);">
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${BW_PALETTE.hairline};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${BW_PALETTE.inkFaint};font-weight:700;">${escapeHtml(label)}</td>
                <td align="right" style="font-size:11px;font-weight:700;letter-spacing:0.06em;color:${t.color};">${t.arrow} ${escapeHtml(bwFmtDelta(kpi?.deltaPct))}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 16px 16px 16px;">
            <div style="font-size:27px;font-weight:700;color:${BW_PALETTE.ink};letter-spacing:-0.02em;line-height:1;">${escapeHtml(fmt(kpi?.current))}</div>
            <div style="font-size:11px;color:${BW_PALETTE.inkFaint};margin:4px 0 12px 0;">MTD actual</div>
            <div style="height:4px;background:${BW_PALETTE.hairline};border-radius:999px;overflow:hidden;margin:0 0 12px 0;line-height:4px;">
              <div style="width:${spark}%;height:4px;background:${t.color};border-radius:999px;line-height:4px;">&nbsp;</div>
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid ${BW_PALETTE.hairline};padding-top:10px;">
              <tr>
                <td style="padding-top:10px;">
                  <div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${BW_PALETTE.inkFaint};font-weight:700;margin:0 0 3px 0;">Projection</div>
                  <div style="font-size:13px;color:${BW_PALETTE.ink};font-weight:600;">${escapeHtml(fmt(kpi?.projection))}</div>
                </td>
                <td align="right" style="padding-top:10px;">
                  <div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${BW_PALETTE.inkFaint};font-weight:700;margin:0 0 3px 0;">Basis</div>
                  <div style="font-size:11px;color:${BW_PALETTE.inkMute};font-weight:600;">vs same period previous month</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>`
}

// -- 02  EXECUTIVE ATTENTION SIGNALS (redesigned - 3 horizontal cards) ------
// -- PHASE 2A: UP DOWN WATCH ORCHESTRATION (with fallback to legacy) --------

// Helper: Map orchestrated alert to signal card structure
function mapAlertToSignalCard(alert) {
  // Severity ? Color mapping
  const severityConfig = {
    critical: {
      type: 'CRITICAL',
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      icon: '?',
    },
    warning: {
      type: 'WARNING',
      color: '#ef4444',
      bg: '#fef2f2',
      border: '#fecaca',
      icon: '?',
    },
    watch: {
      type: 'WATCH',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      icon: '?',
    },
  }

  const config = severityConfig[alert.severity] || severityConfig.watch

  return {
    type: config.type,
    color: config.color,
    bg: config.bg,
    border: config.border,
    icon: config.icon,
    title: alert.title,
    description: `${alert.impactLine} · ${alert.actionLine}`,
  }
}

// Helper: Create "Stable" placeholder card with specific operational context
function createAllClearCard() {
  return {
    type: 'STABLE',
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: '✓',
    title: 'Acquisition efficiency remains within expected volatility range',
    description:
      'No abnormal pressure detected across deposit flow, conversion rates, or client retention cohorts. Normal operational variance observed.',
  }
}

// Orchestrated Executive Attention Signals (uses attentionRequired)
function renderOrchestratedUpDownWatch(attentionRequired) {
  const cards = []

  // Add orchestrated alerts (max 3)
  attentionRequired.slice(0, 3).forEach((alert) => {
    cards.push(mapAlertToSignalCard(alert))
  })

  // Fill remaining slots with "Stable" cards (always show 3 cards)
  while (cards.length < 3) {
    cards.push(createAllClearCard())
  }

  return renderSignalCards(cards, 'real-time intelligence from operating data')
}

// Legacy Executive Attention Signals (hardcoded thresholds)
function renderLegacyUpDownWatch(snapshot) {
  const kpis = snapshot?.kpis || {}
  const netDelta = Number(kpis?.netDeposits?.deltaPct)
  const ftdDelta = Number(kpis?.ftdCount?.deltaPct)
  const qftdPct = Number(snapshot?.funnel?.registrationToQftdPct)

  const upSignal = {
    type: 'STRONG',
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: '▲',
    title:
      Number.isFinite(netDelta) && netDelta >= 5
        ? 'Net deposit flow holding above acquisition baseline'
        : 'Deposit base stability remains operationally resilient',
    description: Number.isFinite(netDelta)
      ? `Net deposits tracking ${netDelta > 0 ? '+' : ''}${Math.round(netDelta)}% MoM (trading day avg). Cash inflow quality remains aligned with commercial expectations.`
      : 'Deposit flow volatility remains within expected acquisition range. No abnormal withdrawal pressure detected across client cohorts.',
  }

  const downSignal = {
    type: 'PRESSURE',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    icon: '▼',
    title:
      Number.isFinite(ftdDelta) && ftdDelta <= -5
        ? 'FTD conversion momentum declined below expected acquisition velocity'
        : 'Acquisition funnel conversion tracking below commercial target',
    description: Number.isFinite(ftdDelta)
      ? `First-time deposits running ${Math.round(ftdDelta)}% MoM (trading day avg). Conversion pressure should remain elevated through month-end window.`
      : 'Client funding acquisition remains the primary area requiring sustained commercial focus to maintain revenue baseline trajectory.',
  }

  const watchSignal = {
    type: 'MONITOR',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: '●',
    title: 'Current cohort quality tracking below repeat-deposit threshold',
    description: Number.isFinite(qftdPct)
      ? `Registration-to-qualified-FTD conversion at ${Math.round(qftdPct)}% for current cohort. Measures clients progressing through full funding cycle (FTD + RDP).`
      : 'Client registration quality requires monitoring to ensure cohort progression through funding stages (FTD → RDP) maintains operational baseline.',
  }

  const signals = [upSignal, downSignal, watchSignal]

  return renderSignalCards(signals, 'based on daily average momentum')
}

// Shared rendering function for signal cards
function renderSignalCards(signals, subtitleText) {
  const signalCards = signals
    .map(
      (s) => `
    <td width="33.33%" valign="top" style="padding:0 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${s.bg};border:1px solid ${s.border};border-left:5px solid ${s.color};border-radius:13px;box-shadow:0 4px 12px rgba(15,23,42,0.04);height:150px;">
        <tr>
          <td style="padding:20px 20px 18px 20px;vertical-align:top;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:top;width:42px;">
                  <div style="width:34px;height:34px;line-height:34px;text-align:center;background:${s.color};color:#ffffff;font-size:15px;font-weight:800;border-radius:50%;opacity:0.92;">${s.icon}</div>
                </td>
                <td style="vertical-align:top;padding-left:12px;">
                  <div style="display:inline-block;padding:3px 9px;background:${s.color};color:#ffffff;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;font-weight:800;border-radius:999px;margin-bottom:9px;">${escapeHtml(s.type)}</div>
                  <div style="font-size:16px;font-weight:700;color:#0f172a;line-height:1.28;margin-bottom:6px;">${escapeHtml(s.title)}</div>
                  <div style="font-size:13px;color:#475569;font-weight:500;line-height:1.55;">${escapeHtml(s.description)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>`
    )
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0 0 0;">
      <tr>
        <td style="padding-bottom:12px;">
          <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:2px;">Executive Attention Signals</div>
          <div style="font-size:13px;color:#64748b;font-weight:500;">${escapeHtml(subtitleText)}</div>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;">
            <tr>${signalCards}</tr>
          </table>
        </td>
      </tr>
    </table>`
}

// Main Executive Attention Signals function (with orchestration + fallback)
function bwSectionUpDownWatch(snapshot, weeklyExecutive) {
  // PHASE 2A: Try orchestrated version first
  if (
    weeklyExecutive?.attentionRequired &&
    Array.isArray(weeklyExecutive.attentionRequired) &&
    weeklyExecutive.attentionRequired.length > 0
  ) {
    console.log(
      '[EXECUTIVE SIGNALS] Using orchestrated signals:',
      weeklyExecutive.attentionRequired.length,
      'alerts'
    )
    return renderOrchestratedUpDownWatch(weeklyExecutive.attentionRequired)
  }

  // Fallback to legacy logic
  console.log(
    '[EXECUTIVE SIGNALS] Falling back to legacy logic (orchestrator unavailable or no alerts)'
  )
  return renderLegacyUpDownWatch(snapshot)
}

// -- 03  DECISION LAYER (dark premium section with target icon) -------------

// Helper: Map orchestrated recommendedAction to Decision Layer directive
function mapRecommendedActionToDirective(action) {
  return {
    headline: action.action,
    owner: action.owner,
    objective: action.expectedImpact || 'Strengthen business fundamentals',
    impact: action.expectedImpact || 'Improve key operational metrics',
    priority: action.priority, // Used for console logging only, not displayed
  }
}

// Helper: Render Decision Layer HTML (shared by orchestrated + legacy)
function renderDecisionLayerHTML(directive) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);border:1px solid #334155;border-radius:14px;margin:22px 0 0 0;">
      <tr>
        <td style="padding:22px 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td width="48px" style="vertical-align:top;">
                <div style="width:52px;height:52px;line-height:52px;text-align:center;background:#1e3a8a;border-radius:50%;font-size:28px;">◈</div>
              </td>
              <td style="padding-left:16px;vertical-align:top;">
                <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#60a5fa;font-weight:800;margin-bottom:8px;">DECISION LAYER</div>
                <div style="font-size:20px;font-weight:700;color:#f8fafc;line-height:1.25;margin-bottom:14px;">${escapeHtml(directive.headline)}</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td width="26%" style="padding:8px 12px 8px 0;border-top:1px solid rgba(148,163,184,0.25);vertical-align:top;">
                      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;font-weight:700;">OWNER</div>
                    </td>
                    <td style="padding:8px 0;border-top:1px solid rgba(148,163,184,0.25);">
                      <div style="font-size:14px;color:#e2e8f0;font-weight:600;">${escapeHtml(directive.owner)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 12px 0 0;border-top:1px solid rgba(148,163,184,0.25);vertical-align:top;">
                      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;font-weight:700;">EXPECTED IMPACT</div>
                    </td>
                    <td style="padding:8px 0 0 0;border-top:1px solid rgba(148,163,184,0.25);">
                      <div style="font-size:14px;color:#e2e8f0;font-weight:600;">${escapeHtml(directive.impact)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

// Orchestrated Decision Layer (uses top 1 recommendedAction only)
function renderOrchestratedDecisionLayer(recommendedActions) {
  // Use only the top priority action (first in array)
  const topAction = recommendedActions[0]
  const directive = mapRecommendedActionToDirective(topAction)

  console.log('[DECISION LAYER] Orchestrated:', {
    priority: topAction.priority,
    headline: directive.headline,
    owner: directive.owner,
  })

  return renderDecisionLayerHTML(directive)
}

// Legacy Decision Layer (static directive with dynamic headline)
function renderLegacyDecisionLayer(snapshot) {
  const k = snapshot?.kpis || {}
  const directive = {
    headline: 'Use this week to remove friction in the funnel before the next monthly close.',
    owner: 'Philippines team, Retention lead, Roberta',
    objective: 'Defend net deposits while improving next-touch conversion quality',
    impact: 'Better deposit retention and clearer weekly accountability',
  }

  // Dynamic directive based on data
  const netDelta = Number(k.netDeposits?.deltaPct)
  if (Number.isFinite(netDelta) && netDelta <= -5) {
    directive.headline = 'Recover net deposit run-rate before month-end window narrows'
    directive.objective = 'Lift daily net-deposit average back into comparable band'
    directive.impact = 'Lift daily net-deposit average back into comparable band'
  }

  console.log('[DECISION LAYER] Legacy fallback:', directive.headline)

  return renderDecisionLayerHTML(directive)
}

// Main Decision Layer function (orchestration + fallback)
function bwSectionDecisionLayer(snapshot, weeklyExecutive) {
  // Try orchestrated version first (top 1 action only)
  if (
    weeklyExecutive?.recommendedActions &&
    Array.isArray(weeklyExecutive.recommendedActions) &&
    weeklyExecutive.recommendedActions.length > 0
  ) {
    console.log(
      '[DECISION LAYER] Using orchestrated directive (top 1 of',
      weeklyExecutive.recommendedActions.length,
      'actions)'
    )
    return renderOrchestratedDecisionLayer(weeklyExecutive.recommendedActions)
  }

  // Fallback to legacy static directive
  console.log(
    '[DECISION LAYER] Falling back to legacy logic (orchestrator unavailable or no actions)'
  )
  return renderLegacyDecisionLayer(snapshot)
}

function bwSectionMonthlyComparison(snapshot) {
  const sourceRows = Array.isArray(snapshot?.comparison) ? snapshot.comparison : []
  if (!sourceRows.length) {
    return '<p style="margin:0;color:#4b5563;font-size:14px;">No monthly comparison available from board snapshot payload.</p>'
  }

  const rows = sourceRows.map((row) => {
    const metric = String(row?.kpi || 'Metric')
    const current = bwFmtCur(safeNumber(row?.currentMtdDailyAverage))
    const mom = `${safeNumber(row?.deltaPct) >= 0 ? '+' : ''}${Math.round(safeNumber(row?.deltaPct))}%`
    const yoyRaw = row?.deltaYoyPct
    const yoy = Number.isFinite(Number(yoyRaw))
      ? `${Number(yoyRaw) >= 0 ? '+' : ''}${Math.round(Number(yoyRaw))}%`
      : 'n/a'
    return { metric, current, mom, yoy }
  })

  const body = rows
    .map(
      (row, idx) => `
      <tr>
        <td style="padding:9px 10px;border-bottom:${idx < rows.length - 1 ? '1px solid #e7eefb' : '0'};font-size:13px;color:#0f172a;">${escapeHtml(row.metric)}</td>
        <td style="padding:9px 10px;border-bottom:${idx < rows.length - 1 ? '1px solid #e7eefb' : '0'};font-size:13px;color:#0f172a;text-align:right;font-weight:700;">${escapeHtml(row.current)}</td>
        <td style="padding:9px 10px;border-bottom:${idx < rows.length - 1 ? '1px solid #e7eefb' : '0'};font-size:12px;color:#334155;text-align:right;">${escapeHtml(row.mom)}</td>
        <td style="padding:9px 10px;border-bottom:${idx < rows.length - 1 ? '1px solid #e7eefb' : '0'};font-size:12px;color:#334155;text-align:right;">${escapeHtml(row.yoy)}</td>
      </tr>
    `
    )
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;overflow:hidden;">
      <tr>
        <th style="text-align:left;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">Metric</th>
        <th style="text-align:right;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">Current</th>
        <th style="text-align:right;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">MoM</th>
        <th style="text-align:right;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">YoY</th>
      </tr>
      ${body}
    </table>
  `
}

// -- 04  SCOREBOARD (2-column layout: table left, operating radar right) ----
function bwSectionScoreboard(snapshot) {
  const k = snapshot?.kpis || {}
  const comparisonRows = Array.isArray(snapshot?.comparison) ? snapshot.comparison : []
  const funnel = snapshot?.funnel || {}

  const parseMetricNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value !== 'string') return 0
    const normalized = value.replace(/[^0-9.-]/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  const signedCurrency = (value) => {
    const amount = parseMetricNumber(value)
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
    return `${sign}${bwFmtCur(Math.abs(amount))}`
  }
  const formatDeltaCell = (baseValue, deltaPct) => {
    const delta = Number(deltaPct)
    const color = delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '#64748b'
    const pctLabel = Number.isFinite(delta) ? `${delta > 0 ? '+' : ''}${Math.round(delta)}%` : 'n/a'
    const currencyPart = escapeHtml(signedCurrency(baseValue))
    const percentPart = escapeHtml(pctLabel)
    return {
      html: `<span style="color:#0f172a;">${currencyPart}</span> <span style="color:${color};">(${percentPart})</span>`,
    }
  }
  const getComparisonRow = (label) =>
    comparisonRows.find((row) => String(row?.kpi || '').toLowerCase() === label.toLowerCase()) ||
    null

  const tableRows = [
    { label: 'Bullwaves Edge', comparison: getComparisonRow('Closed P&L') },
    { label: 'Net Deposits', comparison: getComparisonRow('Net Deposits') },
    { label: 'Deposits', comparison: getComparisonRow('Deposits') },
    { label: 'Withdrawals', comparison: getComparisonRow('Withdrawals') },
  ].map((row) => {
    const currentDaily = row.comparison?.currentMtdDailyAverage || ''
    const previousDaily = row.comparison?.previousComparableDailyAverage || ''
    const deltaValue = parseMetricNumber(currentDaily) - parseMetricNumber(previousDaily)
    const deltaPct = row.comparison?.deltaPct
    const deltaYoyPct = row.comparison?.deltaYoyPct // Check if backend provides YoY separately

    // Format currentDaily as currency without color
    const currentFormatted = currentDaily === '' ? '' : bwFmtCur(parseMetricNumber(currentDaily))

    // CRITICAL FIX: YoY must be calculated separately from MoM
    const yoyCellContent = Number.isFinite(deltaYoyPct)
      ? formatDeltaCell(deltaValue, deltaYoyPct)
      : null // null = no YoY data available

    return {
      label: row.label,
      currentDaily: currentFormatted,
      momCell: formatDeltaCell(deltaValue, deltaPct),
      yoyCell: yoyCellContent,
      hasYoY: Number.isFinite(deltaYoyPct),
    }
  })

  // EXECUTIVE TRUST: Hide YoY column entirely if no real data available (don't show placeholders)
  const showYoYColumn = tableRows.some((row) => row.hasYoY)

  const tableRowsHtml = tableRows
    .map(
      (row, index) => `
      <tr>
        <td style="padding:8px 14px;border-bottom:${index < tableRows.length - 1 ? '1px solid #edf2f7' : '0'};font-size:14px;color:#0f172a;font-weight:600;">${escapeHtml(row.label)}</td>
        <td align="right" style="padding:8px 14px;border-bottom:${index < tableRows.length - 1 ? '1px solid #edf2f7' : '0'};font-size:14px;color:#0f172a;font-weight:700;white-space:nowrap;">${escapeHtml(row.currentDaily)}</td>
        <td align="right" style="padding:8px 14px;border-bottom:${index < tableRows.length - 1 ? '1px solid #edf2f7' : '0'};font-size:14px;font-weight:400;white-space:nowrap;">${row.momCell.html}</td>
        ${showYoYColumn ? `<td align="right" style="padding:8px 14px;border-bottom:${index < tableRows.length - 1 ? '1px solid #edf2f7' : '0'};font-size:14px;font-weight:400;white-space:nowrap;">${row.yoyCell.html}</td>` : ''}
      </tr>`
    )
    .join('')

  const rdpPct = parseMetricNumber(funnel.registrationToQftdPct)
  const radarItems = [
    { badge: '$', label: 'Deposits', value: bwFmtCur(parseMetricNumber(k.deposits?.current)) },
    {
      badge: '||',
      label: 'Withdrawals',
      value: bwFmtCur(parseMetricNumber(k.withdrawals?.current)),
    },
    {
      badge: '\u25CF',
      label: 'Active Users',
      value: bwFmtNum(k.activeUsers?.current || funnel.registrations),
    },
    { badge: '%', label: 'Retention Rate (RDP)', value: `${Math.round(rdpPct || 0)}%` },
  ]

  const radarHtml = radarItems
    .map(
      (item, index) => `
    <tr>
      <td style="padding:${index === 0 ? '4px 0 8px 0' : '8px 0'};vertical-align:middle;border-bottom:${index < radarItems.length - 1 ? '1px solid #edf2f7' : '0'};">
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:middle;padding-right:9px;">
              <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;background:#2563eb;color:#ffffff;border-radius:50%;font-size:11px;font-weight:700;">${item.badge}</span>
            </td>
            <td style="font-size:13px;color:#0f172a;font-weight:600;">${escapeHtml(item.label)}</td>
          </tr>
        </table>
      </td>
      <td align="right" style="padding:${index === 0 ? '4px 0 8px 0' : '8px 0'};vertical-align:middle;border-bottom:${index < radarItems.length - 1 ? '1px solid #edf2f7' : '0'};font-size:14px;color:#0f172a;font-weight:700;white-space:nowrap;">${escapeHtml(item.value)}</td>
    </tr>`
    )
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:22px 0 0 0;">
      <tr>
        <td width="62%" valign="top" style="padding-right:12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border:1px solid #e7eef7;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,0.04);overflow:hidden;">
            <tr>
              <td colspan="${showYoYColumn ? '4' : '3'}" style="padding:14px 18px 8px 18px;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1d4ed8;font-weight:800;display:inline-block;">SCOREBOARD</div>
                <span style="font-size:12px;color:#64748b;font-weight:600;margin-left:4px;">(Daily Averages)</span>
              </td>
            </tr>
            <tr>
              <td style="padding:7px 14px 8px 14px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Metric</td>
              <td align="right" style="padding:7px 14px 8px 14px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Current Month</td>
              <td align="right" style="padding:7px 14px 8px 14px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">MoM Trading Day Avg</td>
              ${showYoYColumn ? '<td align="right" style="padding:7px 14px 8px 14px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">YoY Trading Day Avg</td>' : ''}
            </tr>
            ${tableRowsHtml}
          </table>
        </td>
        <td width="38%" valign="top">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border:1px solid #e7eef7;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,0.04);overflow:hidden;">
            <tr>
              <td colspan="2" style="padding:14px 18px 8px 18px;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1d4ed8;font-weight:800;display:inline-block;">OPERATING RADAR</div>
                <span style="font-size:12px;color:#64748b;font-weight:600;margin-left:4px;">(Current Month)</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:0 18px 6px 18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  ${radarHtml}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

// -- COHORT ACQUISITION FUNNEL HELPERS (Semantic Refactor Phase 4) ----------
// Note: parsePeriodId already defined at line 137, reusing existing implementation

function findCohortStartDate(clientDatesArray, currentPeriodId) {
  const currentMonth = parsePeriodId(currentPeriodId)
  if (!currentMonth) return null

  let earliestRegDate = null

  const isCurrentPeriodMonth = (dateObj) => {
    if (!dateObj || Number.isNaN(dateObj.getTime())) return false
    const monthSort = dateObj.getUTCFullYear() * 100 + (dateObj.getUTCMonth() + 1)
    return monthSort === currentMonth.sort
  }

  for (const dates of clientDatesArray) {
    // Active in current month = clients who traded in current month.
    const lttDate = dates.lttDate && dates.lttDate !== '-' ? parseDate(dates.lttDate) : null

    if (!isCurrentPeriodMonth(lttDate)) continue

    // Check registration date of active-month users and keep the earliest one.
    const regDate = dates.clientTimestamp ? parseDate(dates.clientTimestamp) : null
    if (!regDate) continue

    if (!earliestRegDate || regDate < earliestRegDate) {
      earliestRegDate = regDate
    }
  }

  return earliestRegDate
}

function buildCohortAcquisitionFunnel(clientDatesArray, currentPeriodId) {
  console.log('[COHORT DEBUG] buildCohortAcquisitionFunnel start', {
    arrayLength: clientDatesArray?.length,
    currentPeriodId,
    sampleRecord: clientDatesArray?.[0],
  })

  const cohortStartDate = findCohortStartDate(clientDatesArray, currentPeriodId)
  console.log('[COHORT DEBUG] findCohortStartDate result', {
    cohortStartDate: cohortStartDate?.toISOString(),
    found: !!cohortStartDate,
  })

  if (!cohortStartDate) {
    return { available: false, stages: [], unavailableReason: 'no cohort start date found' }
  }

  const today = new Date()
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)

  // STEP 2: Count registrations from cohort
  const cohortRegistrations = clientDatesArray.filter((dates) => {
    const regDate = dates.clientTimestamp ? parseDate(dates.clientTimestamp) : null
    return regDate && regDate >= cohortStartDate && regDate <= today
  })

  // STEP 3: Count FTDs from cohort (clients with ltdDate - used LTD as reference per user request)
  const cohortFtds = cohortRegistrations.filter((dates) => {
    const ltdDate = dates.ltdDate && dates.ltdDate !== '-' ? parseDate(dates.ltdDate) : null
    return ltdDate // Has made at least one deposit
  })

  // STEP 4: Count Active Depositors (FTD clients who also have trading activity)
  // Since rdpTimestamp doesn't exist, we use ltdDate (deposit) + lttDate (trade) as proxy
  const cohortActiveDepositors = cohortFtds.filter((dates) => {
    const lttDate = dates.lttDate && dates.lttDate !== '-' ? parseDate(dates.lttDate) : null
    return lttDate // Has both deposit AND trade history
  })

  // STEP 5: Count Retained Active Traders (Active Depositors with RECENT trading - used LTT per user request)
  const retainedActiveTraders = cohortActiveDepositors.filter((dates) => {
    const lastTradeDate = dates.lttDate && dates.lttDate !== '-' ? parseDate(dates.lttDate) : null
    return lastTradeDate && lastTradeDate >= fourteenDaysAgo
  })

  console.log('[COHORT DEBUG] Stage counts:', {
    registrations: cohortRegistrations.length,
    ftds: cohortFtds.length,
    activeDepositors: cohortActiveDepositors.length,
    retainedActive: retainedActiveTraders.length,
  })

  return {
    available: true,
    cohortStartDate,
    stages: [
      {
        name: 'Registrations',
        count: cohortRegistrations.length,
        conversionRate: 100,
        definition: `New registrations from ${cohortStartDate.toLocaleDateString('en-GB')} to today`,
      },
      {
        name: 'FTD (Deposited)',
        count: cohortFtds.length,
        conversionRate: (cohortFtds.length / Math.max(cohortRegistrations.length, 1)) * 100,
        definition: 'Have deposit history (LTD populated)',
      },
      {
        name: 'Active Depositors',
        count: cohortActiveDepositors.length,
        conversionRate: (cohortActiveDepositors.length / Math.max(cohortFtds.length, 1)) * 100,
        definition: 'Have both deposit and trading history',
      },
      {
        name: 'Retained Active',
        count: retainedActiveTraders.length,
        conversionRate:
          (retainedActiveTraders.length / Math.max(cohortActiveDepositors.length, 1)) * 100,
        definition: 'Traded in last 14 days (LTT within 14d)',
      },
    ],
  }
}

// -- 05  ACQUISITION FUNNEL (visual funnel + definitions table) -------------
function bwSectionAcquisitionFunnel(snapshot, clientDatesArray = null) {
  const f = snapshot?.funnel || {}
  const k = snapshot?.kpis || {}
  const pc = snapshot?.periodContext || {}
  const reportDate = pc.reportDate ? new Date(pc.reportDate) : null
  const periodLabel = reportDate
    ? `${reportDate.getFullYear()}-${reportDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}`
    : 'CURRENT PERIOD'

  console.log('[COHORT DEBUG] bwSectionAcquisitionFunnel called', {
    hasClientDatesArray: !!clientDatesArray,
    clientDatesLength: clientDatesArray?.length || 0,
    hasReportDate: !!reportDate,
    reportDate: reportDate?.toISOString(),
    periodLabel,
  })

  // Try cohort-based funnel if clientDatesArray is available
  if (clientDatesArray && clientDatesArray.length > 0 && reportDate) {
    const periodId = `${reportDate.getUTCFullYear()}-${reportDate.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}`
    console.log('[COHORT DEBUG] Attempting cohort funnel', { periodId })

    const cohortFunnel = buildCohortAcquisitionFunnel(clientDatesArray, periodId)

    console.log('[COHORT DEBUG] buildCohortAcquisitionFunnel result', {
      available: cohortFunnel.available,
      cohortStartDate: cohortFunnel.cohortStartDate?.toISOString(),
      stagesCount: cohortFunnel.stages?.length,
      stages: cohortFunnel.stages?.map((s) => ({ name: s.name, count: s.count })),
    })

    if (cohortFunnel.available) {
      console.log('[COHORT DEBUG] ✅ COHORT FUNNEL ACTIVE - rendering cohort-based funnel')
      // Render cohort-based funnel
      const cohortLabel = cohortFunnel.cohortStartDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
      const stages = cohortFunnel.stages

      const funnelSteps = stages.map((stage, index) => ({
        stage: stage.name,
        value: bwFmtNum(stage.count),
        pctLabel: `${Math.round(stage.conversionRate)}%`,
        color:
          index === 0 ? '#2563eb' : index === 1 ? '#10b981' : index === 2 ? '#f59e0b' : '#8b5cf6',
        width: `${Math.max(100 - index * 15, 40)}%`,
      }))

      const funnelHtml = funnelSteps
        .map(
          (step, index) => `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:${index < funnelSteps.length - 1 ? '5px' : '0'};">
          <tr>
            <td align="center">
              <table role="presentation" width="${step.width}" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="background:${step.color};padding:14px 20px;color:#ffffff;text-align:center;border-radius:6px;">
                    <span style="font-size:15px;font-weight:800;line-height:1.3;color:#ffffff;">
                      ${escapeHtml(step.value)}
                      <span style="font-size:11px;font-weight:700;opacity:0.9;margin-left:3px;">(${escapeHtml(step.pctLabel)})</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`
        )
        .join('')

      const definitionsHtml = stages
        .map(
          (stage, index) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:${index < stages.length - 1 ? '1px solid #edf2f7' : '0'};font-size:13px;color:#0f172a;font-weight:700;vertical-align:top;">${escapeHtml(stage.name)}</td>
          <td style="padding:8px 12px;border-bottom:${index < stages.length - 1 ? '1px solid #edf2f7' : '0'};font-size:12px;color:#64748b;font-weight:500;line-height:1.4;vertical-align:top;">${escapeHtml(stage.definition)}</td>
          <td align="right" style="padding:8px 12px;border-bottom:${index < stages.length - 1 ? '1px solid #edf2f7' : '0'};font-size:13px;color:#0f172a;font-weight:700;white-space:nowrap;vertical-align:top;">${bwFmtNum(stage.count)}</td>
          <td align="right" style="padding:8px 12px;border-bottom:${index < stages.length - 1 ? '1px solid #edf2f7' : '0'};font-size:13px;color:#475569;font-weight:700;white-space:nowrap;vertical-align:top;">${Math.round(stage.conversionRate)}%</td>
        </tr>`
        )
        .join('')

      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:22px 0 0 0;">
          <tr>
            <td colspan="2">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border:1px solid #e7eef7;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,0.04);overflow:hidden;">
                <tr>
                  <td colspan="2" style="padding:14px 18px 10px 18px;border-bottom:1px solid #dbe7f6;">
                    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1d4ed8;font-weight:800;display:inline-block;">ACQUISITION FUNNEL</div>
                    <span style="font-size:12px;color:#1d4ed8;font-weight:700;margin-left:4px;">Cohort from ${escapeHtml(cohortLabel)}</span>
                    <span style="font-size:12px;color:#64748b;font-weight:600;margin-left:4px;">(Intelligence-driven)</span>
                    <span style="display:inline-block;background:#10b981;color:#ffffff;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;margin-left:8px;">✓ COHORT ACTIVE</span>
                  </td>
                </tr>
                <tr>
                  <td width="32%" valign="top" style="padding:14px 12px 12px 12px;background:#fafbfc;border-right:1px solid #edf2f7;">
                    ${funnelHtml}
                  </td>
                  <td width="68%" valign="top" style="padding:0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;">
                      <tr>
                        <td style="padding:7px 12px 8px 12px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Stage</td>
                        <td style="padding:7px 12px 8px 12px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Definition</td>
                        <td align="right" style="padding:7px 12px 8px 12px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Count</td>
                        <td align="right" style="padding:7px 12px 8px 12px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Conversion</td>
                      </tr>
                      ${definitionsHtml}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:9px 14px;border-top:1px solid #e5e7eb;background:#f9fafb;font-size:11px;color:#64748b;font-weight:500;line-height:1.4;">
                    <span style="display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;background:#eff6ff;color:#2563eb;border-radius:50%;font-size:9px;font-weight:800;margin-right:6px;vertical-align:middle;">i</span><span style="vertical-align:middle;">Cohort start is the oldest registration date among clients who traded in current month (LTT in month). Blue = all registrations from that date to today; green = cohort with LTD; orange = cohort with LTD + LTT history; purple = LTT within last 14 days.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`
    } else {
      console.log(
        '[COHORT DEBUG] ⚠️ Cohort funnel unavailable, reason:',
        cohortFunnel.unavailableReason || 'no cohort start date found'
      )
    }
  }

  // Fallback to legacy static funnel
  console.log('[COHORT DEBUG] ❌ LEGACY FALLBACK ACTIVE - using static snapshot funnel')
  const qftdCount = Number(f.registrationsWhoQftd || 0)
  const qftdPct = Number(f.registrationToQftdPct || 0)
  const parseMetricNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value !== 'string') return 0
    const normalized = value.replace(/[^0-9.-]/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  const ftdDisplayValue = bwFmtNum(
    parseMetricNumber(k.ftdCount?.projection) || f.ftdAllCohortsCount
  )

  const funnelSteps = [
    {
      stage: 'FTD (all cohorts)',
      value: ftdDisplayValue,
      pctLabel: '100%',
      color: '#2563eb',
      width: '100%',
    },
    {
      stage: 'New Registrations (May 1-15)',
      value: bwFmtNum(f.leads),
      pctLabel: bwFmtPct(f.registrationToFundedPct),
      color: '#10b981',
      width: '85%',
    },
    {
      stage: 'Reg(May) ? FTD (any month)',
      value: bwFmtNum(f.registrationsWhoFunded),
      pctLabel: bwFmtPct(f.registrationToQftdPct),
      color: '#f59e0b',
      width: '70%',
    },
    {
      stage: 'Reg(May) ? QFTD (FTD+RDP)',
      value: bwFmtNum(qftdCount),
      pctLabel: `${Math.round(qftdPct || 0)}%`,
      color: '#ef4444',
      width: '55%',
    },
  ]

  const funnelHtml = funnelSteps
    .map(
      (step, index) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:${index < funnelSteps.length - 1 ? '5px' : '0'};">
      <tr>
        <td align="center">
          <table role="presentation" width="${step.width}" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="background:${step.color};padding:14px 20px;color:#ffffff;text-align:center;border-radius:6px;">
                <span style="font-size:15px;font-weight:800;line-height:1.3;color:#ffffff;">
                  ${escapeHtml(step.value)}
                  <span style="font-size:11px;font-weight:700;opacity:0.9;margin-left:3px;">(${escapeHtml(step.pctLabel)})</span>
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
    )
    .join('')

  const definitionsRows = [
    {
      stage: 'FTD (all cohorts)',
      definition: 'All first-time deposits in May, regardless of registration date',
      current: ftdDisplayValue,
      conversion: '100%',
    },
    {
      stage: 'New Registrations (May 1-15)',
      definition: `New client registrations between May 1-15 (excluding UUID-format test accounts)`,
      current: bwFmtNum(f.leads),
      conversion: bwFmtPct(f.registrationToFundedPct),
    },
    {
      stage: 'Reg(May) ? FTD (any month)',
      definition: 'May registrations who made their first deposit (in any month)',
      current: bwFmtNum(f.registrationsWhoFunded),
      conversion: bwFmtPct(f.registrationToQftdPct),
    },
    {
      stage: 'Reg(May) ? QFTD (FTD+RDP)',
      definition: 'May registrations who funded AND re-deposited (qualified)',
      current: bwFmtNum(qftdCount),
      conversion: `${Math.round(qftdPct || 0)}%`,
    },
  ]

  const definitionsHtml = definitionsRows
    .map(
      (row, index) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:${index < definitionsRows.length - 1 ? '1px solid #edf2f7' : '0'};font-size:13px;color:#0f172a;font-weight:700;vertical-align:top;">${escapeHtml(row.stage)}</td>
      <td style="padding:8px 12px;border-bottom:${index < definitionsRows.length - 1 ? '1px solid #edf2f7' : '0'};font-size:12px;color:#64748b;font-weight:500;line-height:1.4;vertical-align:top;">${escapeHtml(row.definition)}</td>
      <td align="right" style="padding:8px 12px;border-bottom:${index < definitionsRows.length - 1 ? '1px solid #edf2f7' : '0'};font-size:13px;color:#0f172a;font-weight:700;white-space:nowrap;vertical-align:top;">${escapeHtml(row.current)}</td>
      <td align="right" style="padding:8px 12px;border-bottom:${index < definitionsRows.length - 1 ? '1px solid #edf2f7' : '0'};font-size:13px;color:#475569;font-weight:700;white-space:nowrap;vertical-align:top;">${escapeHtml(row.conversion)}</td>
    </tr>`
    )
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:22px 0 0 0;">
      <tr>
        <td colspan="2">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border:1px solid #e7eef7;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,0.04);overflow:hidden;">
            <tr>
              <td colspan="2" style="padding:14px 18px 10px 18px;border-bottom:1px solid #dbe7f6;">
                <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1d4ed8;font-weight:800;display:inline-block;">ACQUISITION FUNNEL</div>
                <span style="font-size:12px;color:#1d4ed8;font-weight:700;margin-left:4px;"> ${escapeHtml(periodLabel)}</span>
                <span style="font-size:12px;color:#64748b;font-weight:600;margin-left:4px;">(MTD)</span>
                <span style="display:inline-block;background:#ef4444;color:#ffffff;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;margin-left:8px;">\u26a0 LEGACY FALLBACK</span>
              </td>
            </tr>
            <tr>
              <td width="32%" valign="top" style="padding:14px 12px 12px 12px;background:#fafbfc;border-right:1px solid #edf2f7;">
                ${funnelHtml}
              </td>
              <td width="68%" valign="top" style="padding:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;">
                  <tr>
                    <td style="padding:7px 12px 8px 12px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Stage</td>
                    <td style="padding:7px 12px 8px 12px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Definition</td>
                    <td align="right" style="padding:7px 12px 8px 12px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Current (MTD)</td>
                    <td align="right" style="padding:7px 12px 8px 12px;border-bottom:1px solid #dbe7f6;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Conversion</td>
                  </tr>
                  ${definitionsHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:9px 14px;border-top:1px solid #e5e7eb;background:#f9fafb;font-size:11px;color:#64748b;font-weight:500;line-height:1.4;">
                <span style="display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;background:#eff6ff;color:#2563eb;border-radius:50%;font-size:9px;font-weight:800;margin-right:6px;vertical-align:middle;">i</span><span style="vertical-align:middle;">FTD includes funding from both new and existing clients in ${reportDate ? reportDate.toLocaleDateString('en-GB', { month: 'long' }) : 'the current month'}. RDP includes re-deposits made in the same month only.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

// -- 06  EXECUTIVE NOTES (dark premium section with 4 compact notes) --------
function bwSectionExecutiveNotes(snapshot) {
  const notes = [
    {
      icon: '?',
      title: 'Team split is active',
      description:
        'Conversion & Sales team (Philippines team + Jake) now separated from Retention.',
    },
    {
      icon: '?',
      title: 'New hire accepted',
      description:
        'Milen Hristovski joins as Retention Agent with terms aligned to the current retention structure.',
    },
    {
      icon: '?',
      title: 'Appraisals completed',
      description: 'Roberta, Orlin and Gabriela; Mirna Bridi is in third-step interview.',
    },
    {
      icon: '?',
      title: 'Automation in progress',
      description:
        'Tracking automation and incentive system are in build to reduce manual reporting load.',
    },
  ]

  const notesHtml = notes
    .map(
      (n) => `
    <tr>
      <td style="padding:11px 0;vertical-align:top;border-top:1px solid rgba(226,232,240,0.10);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td width="28px" style="vertical-align:top;">
              <span style="display:inline-block;width:16px;height:16px;line-height:14px;text-align:center;border:1px solid rgba(253,230,138,0.55);border-radius:50%;font-size:10px;color:#fde68a;">${n.icon}</span>
            </td>
            <td style="padding-left:10px;vertical-align:top;">
              <div style="font-size:13px;color:#fde68a;font-weight:700;margin-bottom:3px;">${escapeHtml(n.title)}</div>
              <div style="font-size:12px;color:#d7e0ec;font-weight:500;line-height:1.55;">${escapeHtml(n.description)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(135deg, #0b1830 0%, #142746 100%);border:1px solid #334155;border-radius:14px;margin:22px 0 0 0;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);">
      <tr>
        <td style="padding:24px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td width="48px" style="vertical-align:top;">
                <div style="width:44px;height:44px;line-height:44px;text-align:center;background:rgba(253,230,138,0.12);border:1px solid rgba(253,230,138,0.25);border-radius:50%;font-size:18px;color:#fde68a;">?</div>
              </td>
              <td style="padding-left:18px;vertical-align:top;">
                <div style="font-size:14px;letter-spacing:0.14em;text-transform:uppercase;color:#fde68a;font-weight:800;margin-bottom:10px;">EXECUTIVE NOTES</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  ${notesHtml}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

// -- PHASE 1A: BUSINESS HEALTH PANEL (orchestrated department status) ------

// PHASE 1 FIX: Number formatting helper for Business Health metrics
function formatBusinessHealthMetric(dept) {
  const metric = dept.metric
  if (metric === 'n/a' || metric === null || metric === undefined) {
    // Graceful fallback instead of "n/a"
    return '<span style="color:#94a3b8;">Data unavailable</span>'
  }

  // Client Experience: percentage with clarifying label
  if (dept.department === 'Client Experience') {
    const num = parseFloat(metric)
    if (isNaN(num)) return String(metric)
    return `${num.toFixed(2)}% <span style="font-size:10px;color:#64748b;font-weight:500;">(Reg ? QFTD)</span>`
  }

  // Revenue Ops, Finance, Retention: currency formatting
  const num = parseFloat(metric)
  if (isNaN(num)) return String(metric)

  const sign = num >= 0 ? '+' : ''
  const absNum = Math.abs(num)

  // Use compact notation for large numbers (>= 1M)
  if (absNum >= 1_000_000) {
    return `${sign}\u20ac${(num / 1_000_000).toFixed(1)}M`
  } else if (absNum >= 1_000) {
    return `${sign}\u20ac${(num / 1_000).toFixed(0)}K`
  } else {
    // Small numbers: full formatting with comma separator
    return `${sign}\u20ac${absNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

function bwSectionBusinessHealth(businessHealth) {
  if (!businessHealth || !Array.isArray(businessHealth) || businessHealth.length === 0) {
    return '' // Skip section if no orchestrated data
  }

  const statusColors = {
    green: { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', badge: '#10b981' },
    yellow: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', badge: '#f59e0b' },
    red: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', badge: '#ef4444' },
  }

  const departmentCards = businessHealth
    .map((dept) => {
      const colors = statusColors[dept.status] || statusColors.yellow
      const statusLabel = dept.status.toUpperCase()
      const formattedMetric = formatBusinessHealthMetric(dept)

      // Explicit metric identity and interpretation (with graceful fallback)
      const metricName = dept.metricName || 'Metric'
      const metricInterpretation = dept.metricInterpretation || dept.note || ''

      return `
      <td width="25%" valign="top" style="padding:0 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${colors.bg};border:1px solid ${colors.border};border-left:3px solid ${colors.badge};border-radius:10px;box-shadow:0 2px 8px rgba(15,23,42,0.03);min-height:120px;">
          <tr>
            <td style="padding:14px 16px;vertical-align:top;">
              <div style="display:inline-block;padding:3px 8px;background:${colors.badge};color:#ffffff;font-size:8px;letter-spacing:0.12em;text-transform:uppercase;font-weight:800;border-radius:999px;margin-bottom:8px;">${escapeHtml(statusLabel)}</div>
              <div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.25;margin-bottom:6px;">${escapeHtml(dept.department)}</div>
              <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">${escapeHtml(metricName)}</div>
              <div style="font-size:12px;color:${colors.text};font-weight:600;margin-bottom:8px;">${formattedMetric}</div>
              <div style="font-size:11px;color:#334155;font-weight:500;line-height:1.4;">${escapeHtml(metricInterpretation)}</div>
            </td>
          </tr>
        </table>
      </td>`
    })
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0 0 0;">
      <tr>
        <td style="padding-bottom:8px;">
          <div style="font-size:17px;font-weight:800;color:#0f172a;margin-bottom:3px;">
            Business Health 
            <span style="font-size:12px;color:#64748b;font-weight:600;">(Department Status)</span>
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;">
            <tr>${departmentCards}</tr>
          </table>
        </td>
      </tr>
    </table>`
}

function bwSectionBusinessHealthIndicators(snapshot) {
  const k = snapshot?.kpis || {}
  const funnel = snapshot?.funnel || {}

  const rows = [
    {
      label: 'Bullwaves Edge',
      value: bwFmtCur(k.closedPl?.current),
      note: `MoM ${formatDelta(k.closedPl?.currentMtdDailyAverage, k.closedPl?.previousComparableDailyAverage, bwFmtCur)} | YoY ${formatDelta(k.closedPl?.currentMtdDailyAverage, k.closedPl?.deltaYoyPct == null ? null : k.closedPl?.currentMtdDailyAverage / (1 + k.closedPl?.deltaYoyPct / 100), bwFmtCur)}`,
    },
    {
      label: 'Net Deposits',
      value: bwFmtCur(k.netDeposits?.current),
      note: `MoM ${formatDelta(k.netDeposits?.currentMtdDailyAverage, k.netDeposits?.previousComparableDailyAverage, bwFmtCur)} | YoY ${formatDelta(k.netDeposits?.currentMtdDailyAverage, k.netDeposits?.deltaYoyPct == null ? null : k.netDeposits?.currentMtdDailyAverage / (1 + k.netDeposits?.deltaYoyPct / 100), bwFmtCur)}`,
    },
    {
      label: 'Deposits',
      value: bwFmtCur(k.deposits?.current),
      note: `MoM ${formatDelta(k.deposits?.currentMtdDailyAverage, k.deposits?.previousComparableDailyAverage, bwFmtCur)} | YoY ${formatDelta(k.deposits?.currentMtdDailyAverage, k.deposits?.deltaYoyPct == null ? null : k.deposits?.currentMtdDailyAverage / (1 + k.deposits?.deltaYoyPct / 100), bwFmtCur)}`,
    },
    {
      label: 'Withdrawals',
      value: bwFmtCur(k.withdrawals?.current),
      note: `MoM ${formatDelta(k.withdrawals?.currentMtdDailyAverage, k.withdrawals?.previousComparableDailyAverage, bwFmtCur)} | YoY ${formatDelta(k.withdrawals?.currentMtdDailyAverage, k.withdrawals?.deltaYoyPct == null ? null : k.withdrawals?.currentMtdDailyAverage / (1 + k.withdrawals?.deltaYoyPct / 100), bwFmtCur)}`,
    },
    {
      label: 'Active Users',
      value: bwFmtNum(k.activeUsers?.current),
      note: `MoM ${formatDelta(k.activeUsers?.currentMtdDailyAverage, k.activeUsers?.previousComparableDailyAverage, bwFmtNum)} | YoY ${formatDelta(k.activeUsers?.currentMtdDailyAverage, k.activeUsers?.deltaYoyPct == null ? null : k.activeUsers?.currentMtdDailyAverage / (1 + k.activeUsers?.deltaYoyPct / 100), bwFmtNum)}`,
    },
    {
      label: 'FTD',
      value: bwFmtNum(k.ftdCount?.current),
      note: `MoM ${formatDelta(k.ftdCount?.currentMtdDailyAverage, k.ftdCount?.previousComparableDailyAverage, bwFmtNum)} | YoY ${formatDelta(k.ftdCount?.currentMtdDailyAverage, k.ftdCount?.deltaYoyPct == null ? null : k.ftdCount?.currentMtdDailyAverage / (1 + k.ftdCount?.deltaYoyPct / 100), bwFmtNum)}`,
    },
    {
      label: 'RDP',
      value: bwFmtNum(k.rdpCount?.current),
      note: `MoM ${formatDelta(k.rdpCount?.currentMtdDailyAverage, k.rdpCount?.previousComparableDailyAverage, bwFmtNum)} | YoY ${formatDelta(k.rdpCount?.currentMtdDailyAverage, k.rdpCount?.deltaYoyPct == null ? null : k.rdpCount?.currentMtdDailyAverage / (1 + k.rdpCount?.deltaYoyPct / 100), bwFmtNum)}`,
    },
    {
      label: 'Registrations',
      value: bwFmtNum(funnel.registrations),
      note: `Cohort check: FTD ${bwFmtNum(funnel.withFtd)} | QFTD ${bwFmtNum(funnel.withQftd)}`,
    },
    {
      label: 'FTD Rate',
      value: Number.isFinite(Number(funnel.ftdRate))
        ? `${Math.round(Number(funnel.ftdRate))}%`
        : 'n/a',
      note: 'Registered cohort only',
    },
    {
      label: 'QFTD Rate',
      value: Number.isFinite(Number(funnel.qftdRate))
        ? `${Math.round(Number(funnel.qftdRate))}%`
        : 'n/a',
      note: 'Registered cohort only',
    },
  ]

  const body = rows
    .map(
      (row, idx) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:${idx < rows.length - 1 ? '1px solid #e7eefb' : '0'};font-size:13px;color:#0f172a;font-weight:600;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 12px;border-bottom:${idx < rows.length - 1 ? '1px solid #e7eefb' : '0'};font-size:13px;color:#0f172a;text-align:right;font-weight:700;white-space:nowrap;">${escapeHtml(row.value)}</td>
        <td style="padding:10px 12px;border-bottom:${idx < rows.length - 1 ? '1px solid #e7eefb' : '0'};font-size:12px;color:#334155;text-align:right;white-space:nowrap;">${escapeHtml(row.note)}</td>
      </tr>
    `
    )
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;overflow:hidden;">
      <tr>
        <th style="text-align:left;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">KPI</th>
        <th style="text-align:right;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">Current</th>
        <th style="text-align:right;padding:9px 10px;background:#f8fbff;font-size:11px;color:#334155;">Check</th>
      </tr>
      ${body}
    </table>
  `
}

function buildBoardWeeklyTemplate(
  snapshot,
  weeklyExecutive,
  clientDates = null,
  allClientMonths = [],
  clientDatesMap = null
) {
  console.log('[COHORT DEBUG] buildBoardWeeklyTemplate called', {
    hasSnapshot: !!snapshot,
    hasClientDates: !!clientDates,
    clientDatesLength: clientDates?.data?.rows?.length || 0,
    sampleClientDate: clientDates?.data?.rows?.[0],
    allClientMonthsLength: allClientMonths.length,
    clientDatesMapSize: clientDatesMap?.size || 0,
  })

  // Loading / not-yet-fetched state  keeps the template selectable in the UI.
  if (!snapshot || !snapshot.ok) {
    return {
      key: 'board-weekly',
      label: 'Board Weekly Report',
      html: buildMailHtml({
        title: 'Board Weekly Report',
        subtitle: 'Executive Operating Report',
        intro:
          'Loading live operating data from the validated /api/qlik/creolabs/reports/board-snapshot endpoint',
        sections: [
          {
            title: 'Awaiting live data',
            html: `<div style="padding:18px 20px;background:${BW_PALETTE.surfaceAlt};border:1px solid ${BW_PALETTE.hairline};border-radius:10px;color:${BW_PALETTE.inkMute};font-size:13px;line-height:1.5;">
              The Board Weekly Report renders from the same data contract used by the operational <code style="background:${BW_PALETTE.surfaceSub};padding:1px 6px;border-radius:4px;">/creolabs/board-snapshot</code> dashboard.
              The snapshot will populate automatically as soon as the backend cache responds.
            </div>`,
          },
        ],
      }),
    }
  }

  // Build clientDatesMap and array for cohort funnel (if available).
  // Reuse the injected map when already provided by caller.
  const resolvedClientDatesMap =
    clientDatesMap || (clientDates ? buildClientDatesMap(clientDates) : null)
  const clientDatesArray = resolvedClientDatesMap
    ? Array.from(resolvedClientDatesMap.values())
    : null

  console.log('[COHORT DEBUG] clientDatesMap built', {
    mapSize: resolvedClientDatesMap?.size || 0,
    arrayLength: clientDatesArray?.length || 0,
    sampleEntry: clientDatesArray?.[0],
  })

  const pc = snapshot.periodContext || {}
  const kpisView = {
    ...(snapshot.kpis || {}),
    closedPl: bwNormalizeTradingEdgeKpiForView(snapshot?.kpis?.closedPl),
  }

  // Week 2 Phase 1 + 2A: Extract orchestrated sections (with graceful degradation)
  const businessHealth = weeklyExecutive?.businessHealth || []
  const intelligenceSignals = weeklyExecutive?.intelligenceSignals || []
  const attentionRequired = weeklyExecutive?.attentionRequired || []

  // Phase 1: Use enhanced sections if orchestrated data available, fallback to legacy
  const executiveNotesHtml = bwSectionExecutiveNotes(snapshot)

  return {
    key: 'board-weekly',
    label: 'Board Weekly Report',
    html: buildMailHtml({
      title: 'Board Weekly Report',
      subtitle: 'Executive Operating Report',
      intro: '',
      hideDefaultHeader: true,
      hideSectionTitles: true,
      sections: [
        { title: 'Header', html: bwHero(snapshot), fullBleed: true },
        { title: 'This Week in One Screen', html: bwSectionThisWeek(snapshot) },
        {
          title: 'Executive Attention Signals',
          html: bwSectionUpDownWatch(snapshot, weeklyExecutive),
        }, // PHASE 2A: ORCHESTRATED
        { title: 'Decision Layer', html: bwSectionDecisionLayer(snapshot, weeklyExecutive) },
        { title: 'Business Health Indicators', html: bwSectionBusinessHealthIndicators(snapshot) },
        { title: 'Monthly Comparison', html: bwSectionMonthlyComparison(snapshot) },
        {
          title: 'Acquisition Funnel',
          html: bwSectionAcquisitionFunnel(snapshot, clientDatesArray),
        },
        { title: 'Executive Notes', html: executiveNotesHtml },
        {
          title: 'Project Board',
          html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0 0 0;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;overflow:hidden;"><tr><td style="padding:16px 18px;"><div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:6px;">Project Board</div><div style="font-size:12px;color:#64748b;line-height:1.5;">Coming soon: automated task summary, priorities and weekly ownership.</div></td></tr></table>`,
        },
        {
          title: 'Footer',
          html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:32px 0 20px 0;border-top:1px solid #e5e7eb;padding-top:20px;"><tr><td style="vertical-align:middle;"><div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:2px;">Paolo Vullo</div><div style="font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;">HEAD OF OPERATIONS  BULLWAVES</div></td><td align="right" style="vertical-align:middle;padding-left:20px;"><a href="http://localhost:5174" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Open Bullwaves Portal</a></td></tr><tr><td colspan="2" style="padding-top:16px;"><div style="font-size:11px;color:#94a3b8;font-weight:500;text-align:center;">Generated automatically from live Qlik CREOLABS endpoints.</div></td></tr></table>`,
        },
      ],
    }),
  }
}

// -- Cluster Analysis Template ----------------------------------------------
function buildClusterTemplate(
  allClientMonths,
  clientDatesMap,
  kpis,
  clusterData,
  clusterDataError,
  loadingClusterData
) {
  // Use ML cluster data passed from parent component (loaded via useEffect)
  if (clusterDataError) {
    return {
      key: 'cluster',
      label: 'Cluster Analysis (ML)',
      html: buildMailHtml({
        title: 'Client Lifetime & ML Cluster Analysis',
        subtitle: 'Error Loading Data',
        intro: 'Failed to load ML cluster analysis.',
        sections: [
          {
            title: 'Error Details',
            html: `
            <div style="padding:20px;background:#fee2e2;border:2px solid #ef4444;border-radius:8px;color:#7f1d1d;">
              <strong>? ${clusterDataError}</strong><br/><br/>
              <strong>Troubleshooting:</strong>
              <ul style="margin:10px 0 0 20px;">
                <li>Ensure local API server is running on <code>http://localhost:3001</code></li>
                <li>Check browser console (F12) for detailed errors</li>
                <li>Verify ML endpoint: <code>/api/qlik/creolabs/lifetime-clusters</code></li>
                <li>Backend may need ~60s to warm up cache on first start</li>
              </ul>
            </div>
          `,
          },
        ],
      }),
    }
  }

  if (loadingClusterData || !clusterData) {
    return {
      key: 'cluster',
      label: 'Cluster Analysis (ML)',
      html: buildMailHtml({
        title: 'Client Lifetime & ML Cluster Analysis',
        subtitle: 'Loading...',
        intro: 'ML cluster data is being loaded from backend.',
        sections: [
          {
            title: 'Loading',
            html: `
            <div style="padding:20px;background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;color:#78350f;">
              <strong>? Loading cluster analysis...</strong><br/><br/>
              First load may take up to 60 seconds if backend cache is cold.<br/>
              Subsequent loads will be instant (1h cache).
            </div>
          `,
          },
        ],
      }),
    }
  }

  const { clients, clusters, inactiveSegment, metadata } = clusterData

  // Build cluster ID ? label map for enrichment
  const clusterMap = new Map()
  clusters.forEach((c) => clusterMap.set(c.clusterId, c.label))

  // Enrich clients with cluster labels
  clients.forEach((c) => {
    c.clusterLabel = clusterMap.get(c.clusterId) || 'Unknown'
  })

  // Top performers by LTV
  const topByLtv = [...clients]
    .filter((c) => c.ltv > 0)
    .sort((a, b) => b.ltv - a.ltv)
    .slice(0, 20)

  // Top performers by tenure
  const topByTenure = [...clients].sort((a, b) => b.tenureDays - a.tenureDays).slice(0, 20)

  // HTML Rendering Functions
  const renderClusterTable = () => {
    const rows = clusters
      .map((cluster) => {
        const pct =
          metadata.validClients > 0
            ? ((cluster.clientCount / metadata.validClients) * 100).toFixed(1)
            : '0.0'
        const labelColor = cluster.label.includes('Churned')
          ? '#ef4444'
          : cluster.label.includes('At Risk')
            ? '#f59e0b'
            : cluster.label.includes('High Activity')
              ? '#10b981'
              : cluster.label.includes('New Actives')
                ? '#3b82f6'
                : '#8b5cf6'
        return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:${labelColor};">[${cluster.clusterId}]</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:left;font-weight:600;"><span style="padding:3px 8px;border-radius:4px;font-size:10px;background:${labelColor}22;color:${labelColor};">${cluster.label}</span></td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatNumber(cluster.clientCount)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${pct}%</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatNumber(cluster.avgTenureDays)} days</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(cluster.avgLtv)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#16a34a;">${formatMoney(cluster.totalLtv)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatNumber(cluster.avgTrades)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${cluster.avgRecencyDays < 30 ? '#16a34a' : cluster.avgRecencyDays < 90 ? '#f59e0b' : '#ef4444'};">${formatNumber(cluster.avgRecencyDays)}d</td>
        </tr>
      `
      })
      .join('')

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;">ID</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b;">Cluster Label</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Clients</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">% Total</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Avg Tenure</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Avg LTV</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Total LTV</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Avg Trades</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Recency</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }

  const renderInactiveSegment = () => {
    if (!inactiveSegment || inactiveSegment.totalCount === 0) return ''

    const sampleRows = inactiveSegment.sampleClients
      .slice(0, 10)
      .map(
        (client, idx) => `
      <tr style="${idx % 2 === 0 ? 'background:#f8fafc;' : ''}">
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:left;font-family:monospace;font-size:11px;">${client.clientId}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:left;">${client.clientName || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:10px;">${client.registrationDate || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${client.daysSinceReg}d</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(client.totalDeposits || 0)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;"><span style="padding:3px 8px;border-radius:4px;font-size:10px;background:#fee2e2;color:#dc2626;">${client.reason}</span></td>
      </tr>
    `
      )
      .join('')

    return `
      <div style="margin:30px 0;padding:20px;background:#fff5f5;border:2px solid #fecaca;border-radius:12px;">
        <h3 style="margin:0 0 16px;color:#7f1d1d;font-size:18px;">?? Inactive Segment Analysis</h3>
        <div style="display:flex;gap:12px;margin-bottom:20px;">
          <div style="flex:1;padding:14px;background:#fff;border:1px solid #fecaca;border-radius:8px;">
            <div style="font-size:11px;color:#991b1b;text-transform:uppercase;margin-bottom:4px;">Total Inactive</div>
            <div style="font-size:24px;font-weight:700;color:#dc2626;">${formatNumber(inactiveSegment.totalCount)}</div>
            <div style="font-size:10px;color:#991b1b;margin-top:2px;">${inactiveSegment.percentage}% of CB</div>
          </div>
          <div style="flex:1;padding:14px;background:#fff;border:1px solid #fecaca;border-radius:8px;">
            <div style="font-size:11px;color:#991b1b;text-transform:uppercase;margin-bottom:4px;">Never Traded</div>
            <div style="font-size:24px;font-weight:700;color:#dc2626;">${formatNumber(inactiveSegment.breakdown.neverTraded)}</div>
          </div>
          <div style="flex:1;padding:14px;background:#fff;border:1px solid #fbbf24;border-radius:8px;">
            <div style="font-size:11px;color:#78350f;text-transform:uppercase;margin-bottom:4px;">Has Deposits</div>
            <div style="font-size:24px;font-weight:700;color:#f59e0b;">${formatNumber(inactiveSegment.breakdown.hasDeposits)}</div>
          </div>
          <div style="flex:1;padding:14px;background:#fff;border:1px solid #6ee7b7;border-radius:8px;">
            <div style="font-size:11px;color:#065f46;text-transform:uppercase;margin-bottom:4px;">Reactivation Opp.</div>
            <div style="font-size:24px;font-weight:700;color:#10b981;">${formatNumber(inactiveSegment.insights.reactivationOpportunity)}</div>
            <div style="font-size:10px;color:#065f46;margin-top:2px;">${formatMoney(inactiveSegment.insights.totalDepositValue)} deposits</div>
          </div>
        </div>
        <div style="margin-top:16px;padding:12px;background:#fff;border-radius:8px;">
          <div style="font-size:12px;color:#7f1d1d;margin-bottom:8px;"><strong>?? Key Insight:</strong></div>
          <div style="font-size:13px;color:#991b1b;line-height:1.6;">
            <strong>${formatNumber(inactiveSegment.insights.reactivationOpportunity)} clients</strong> have deposited 
            <strong>${formatMoney(inactiveSegment.insights.totalDepositValue)}</strong> but never traded. 
            Average ${inactiveSegment.insights.avgDaysSinceRegistration} days since registration. 
            <strong>Priority target for conversion campaigns.</strong>
          </div>
        </div>
        <h4 style="margin:20px 0 10px;color:#7f1d1d;font-size:14px;">Sample Inactive Clients (Top 10 Most Recent):</h4>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;text-align:left;font-size:11px;color:#64748b;">Client ID</th>
              <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;text-align:left;font-size:11px;color:#64748b;">Name</th>
              <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;text-align:center;font-size:11px;color:#64748b;">Registration</th>
              <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:11px;color:#64748b;">Days</th>
              <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:11px;color:#64748b;">Deposits</th>
              <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;text-align:center;font-size:11px;color:#64748b;">Reason</th>
            </tr>
          </thead>
          <tbody>
            ${sampleRows}
          </tbody>
        </table>
      </div>
    `
  }

  const renderTopLtvTable = () => {
    const rows = topByLtv
      .slice(0, 10)
      .map((client, idx) => {
        const clusterColor = client.clusterLabel?.includes('Churned')
          ? '#ef4444'
          : client.clusterLabel?.includes('At Risk')
            ? '#f59e0b'
            : client.clusterLabel?.includes('High Activity')
              ? '#10b981'
              : client.clusterLabel?.includes('New Actives')
                ? '#3b82f6'
                : '#8b5cf6'
        return `
        <tr style="${idx % 2 === 0 ? 'background:#f8fafc;' : ''}">
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;color:#3b82f6;">${idx + 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:left;font-family:monospace;font-size:11px;">${client.clientId}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:left;">${client.clientName || '-'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#16a34a;">${formatMoney(client.ltv)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${client.tenureDays} days</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatNumber(client.totalTrades)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;"><span style="padding:3px 8px;border-radius:4px;font-size:9px;font-weight:600;background:${clusterColor}22;color:${clusterColor};">${client.clusterLabel}</span></td>
        </tr>
      `
      })
      .join('')

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;">Rank</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b;">Client ID</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b;">Name</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">LTV</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Tenure</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Trades</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;">Cluster</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }

  const renderTopTenureTable = () => {
    const rows = topByTenure
      .slice(0, 10)
      .map((client, idx) => {
        const clusterColor = client.clusterLabel?.includes('Churned')
          ? '#ef4444'
          : client.clusterLabel?.includes('At Risk')
            ? '#f59e0b'
            : client.clusterLabel?.includes('High Activity')
              ? '#10b981'
              : client.clusterLabel?.includes('New Actives')
                ? '#3b82f6'
                : '#8b5cf6'
        return `
        <tr style="${idx % 2 === 0 ? 'background:#f8fafc;' : ''}">
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;color:#3b82f6;">${idx + 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:left;font-family:monospace;font-size:11px;">${client.clientId}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:left;">${client.clientName || '-'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#7c3aed;">${client.tenureDays} days</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(client.ltv)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatNumber(client.totalTrades)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;"><span style="padding:3px 8px;border-radius:4px;font-size:9px;font-weight:600;background:${clusterColor}22;color:${clusterColor};">${client.clusterLabel}</span></td>
        </tr>
      `
      })
      .join('')

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;">Rank</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b;">Client ID</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b;">Name</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Tenure</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">LTV</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:right;font-size:12px;text-transform:uppercase;color:#64748b;">Trades</th>
            <th style="padding:10px 12px;border-bottom:2px solid #cbd5e1;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;">Cluster</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }

  // Calculate summary metrics
  const totalLtv = clusters.reduce((sum, c) => sum + c.totalLtv, 0)
  const avgLtv = metadata.validClients > 0 ? totalLtv / metadata.validClients : 0
  const avgTenure =
    clusters.reduce((sum, c) => sum + c.avgTenureDays * c.clientCount, 0) / metadata.validClients
  const activeCount = clusters
    .filter((c) => !c.label.includes('Churned'))
    .reduce((sum, c) => sum + c.clientCount, 0)
  const churnedCount = clusters
    .filter((c) => c.label.includes('Churned'))
    .reduce((sum, c) => sum + c.clientCount, 0)
  const churnRate = metadata.validClients > 0 ? (churnedCount / metadata.validClients) * 100 : 0

  return {
    key: 'cluster',
    label: 'Cluster Analysis (ML)',
    html: buildMailHtml({
      title: 'Client Lifetime & ML Cluster Analysis',
      subtitle: 'K-Means++ Behavioral Segmentation',
      intro: `Advanced ML clustering of ${formatNumber(metadata.validClients)} active clients from Creolabs using K-Means++ algorithm with 8 behavioral dimensions.`,
      sections: [
        {
          title: 'Executive Summary',
          html: `
            <div style="padding:20px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px;color:white;margin-bottom:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:20%;text-align:center;padding:12px;">
                    <div style="font-size:36px;font-weight:800;margin-bottom:4px;">${formatNumber(metadata.totalClients)}</div>
                    <div style="font-size:12px;opacity:0.9;text-transform:uppercase;letter-spacing:0.05em;">Total CB</div>
                  </td>
                  <td style="width:20%;text-align:center;padding:12px;border-left:1px solid rgba(255,255,255,0.2);">
                    <div style="font-size:36px;font-weight:800;margin-bottom:4px;">${formatNumber(metadata.validClients)}</div>
                    <div style="font-size:12px;opacity:0.9;text-transform:uppercase;letter-spacing:0.05em;">Active (ML)</div>
                  </td>
                  <td style="width:20%;text-align:center;padding:12px;border-left:1px solid rgba(255,255,255,0.2);">
                    <div style="font-size:36px;font-weight:800;margin-bottom:4px;">${Math.round(avgTenure)}</div>
                    <div style="font-size:12px;opacity:0.9;text-transform:uppercase;letter-spacing:0.05em;">Avg Tenure (days)</div>
                  </td>
                  <td style="width:20%;text-align:center;padding:12px;border-left:1px solid rgba(255,255,255,0.2);">
                    <div style="font-size:36px;font-weight:800;margin-bottom:4px;">${formatMoney(avgLtv)}</div>
                    <div style="font-size:12px;opacity:0.9;text-transform:uppercase;letter-spacing:0.05em;">Avg LTV</div>
                  </td>
                  <td style="width:20%;text-align:center;padding:12px;border-left:1px solid rgba(255,255,255,0.2);">
                    <div style="font-size:36px;font-weight:800;margin-bottom:4px;">${churnRate.toFixed(1)}%</div>
                    <div style="font-size:12px;opacity:0.9;text-transform:uppercase;letter-spacing:0.05em;">Churn Rate</div>
                  </td>
                </tr>
              </table>
            </div>
            <div style="display:flex;gap:12px;margin-bottom:20px;">
              <div style="flex:1;padding:16px;background:#dcfce7;border:2px solid #22c55e;border-radius:8px;">
                <div style="font-size:12px;color:#166534;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Active Clients</div>
                <div style="font-size:28px;font-weight:800;color:#16a34a;">${formatNumber(activeCount)}</div>
                <div style="font-size:11px;color:#166534;margin-top:4px;">${((activeCount / metadata.validClients) * 100).toFixed(1)}% of clustered</div>
              </div>
              <div style="flex:1;padding:16px;background:#fee2e2;border:2px solid #ef4444;border-radius:8px;">
                <div style="font-size:12px;color:#7f1d1d;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Churned Clients</div>
                <div style="font-size:28px;font-weight:800;color:#dc2626;">${formatNumber(churnedCount)}</div>
                <div style="font-size:11px;color:#7f1d1d;margin-top:4px;">${churnRate.toFixed(1)}% churn rate</div>
              </div>
              <div style="flex:1;padding:16px;background:#dbeafe;border:2px solid #3b82f6;border-radius:8px;">
                <div style="font-size:12px;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Total LTV</div>
                <div style="font-size:28px;font-weight:800;color:#2563eb;">${formatMoney(totalLtv)}</div>
                <div style="font-size:11px;color:#1e3a8a;margin-top:4px;">Revenue generated</div>
              </div>
              <div style="flex:1;padding:16px;background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;">
                <div style="font-size:12px;color:#78350f;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">ML Quality</div>
                <div style="font-size:28px;font-weight:800;color:#f59e0b;">${metadata.silhouetteScore.toFixed(3)}</div>
                <div style="font-size:11px;color:#78350f;margin-top:4px;">Silhouette Score</div>
              </div>
            </div>
          `,
        },
        {
          title: `ML Clusters (${metadata.optimalK} identified by Elbow Method)`,
          html: renderClusterTable(),
        },
        {
          title: 'Inactive Segment (Re-engagement Opportunity)',
          html: renderInactiveSegment(),
        },
        {
          title: 'Top 10 Clients by LTV',
          html: renderTopLtvTable(),
        },
        {
          title: 'Top 10 Clients by Tenure (Loyalty)',
          html: renderTopTenureTable(),
        },
        {
          title: 'ML Methodology & Technical Details',
          html: renderUnorderedList([
            `<strong>Algorithm:</strong> ${metadata.algorithm} with automatic K selection (tested K=${metadata.kRange}).`,
            `<strong>Optimal K:</strong> ${metadata.optimalK} clusters selected via Elbow Method (WCSS=${metadata.wcss}).`,
            `<strong>Clustering Quality:</strong> Silhouette Score = ${metadata.silhouetteScore} (>0.5 is excellent, 0.3-0.5 is acceptable).`,
            `<strong>Feature Engineering:</strong> 8 dimensions ? ${metadata.featureNames.join(', ')}.`,
            `<strong>Normalization:</strong> ${metadata.normalization} scaling applied to all features.`,
            `<strong>Active Clients:</strong> ${formatNumber(metadata.validClients)} with trades & tenure data (${((metadata.validClients / metadata.totalClients) * 100).toFixed(1)}% coverage).`,
            `<strong>Inactive Clients:</strong> ${formatNumber(metadata.inactiveClients)} excluded (no trades or lifecycle dates). ${formatNumber(inactiveSegment?.insights?.reactivationOpportunity || 0)} have deposits ? re-engagement target.`,
            `<strong>Data Source:</strong> Creolabs Qlik API (client-months + lifecycle dates). Live computation with 1h cache TTL.`,
          ]),
        },
      ],
    }),
  }
}

function buildTemplates(
  data,
  affiliatePaymentsMap,
  boardSnapshot,
  clusterData,
  clusterDataError,
  loadingClusterData
) {
  const kpisPayload = data?.kpis?.data || {}
  const analyticsPayload = data?.analytics?.data || {}
  const listsPayload = data?.clientLists?.data || {}
  const clientDatesPayload = data?.clientDates || {}

  const kpis = kpisPayload.kpis || {}
  const analytics = analyticsPayload.analytics || {}
  const rankings = analytics.rankings || {}
  const brands = listsPayload.brands || {}

  // Build client-dates enrichment map (Phase 1.3)
  const clientDatesMap = buildClientDatesMap(clientDatesPayload)
  const allClientMonths = data?.clientMonths?.data?.clientMonths || []

  const periodFrom = kpisPayload.basePeriodFrom || analyticsPayload.periodFrom || '-'
  const periodTo = kpisPayload.basePeriodTo || analyticsPayload.periodTo || '-'

  const monthlyRows = sortMonthlyRows(analytics?.monthly)
  const monthlyById = new Map(monthlyRows.map((row) => [String(row?.periodId || '').trim(), row]))
  const latestMonth = monthlyRows.length ? monthlyRows[monthlyRows.length - 1] : null
  const previousMonth = monthlyRows.length > 1 ? monthlyRows[monthlyRows.length - 2] : null

  const latestMeta = parsePeriodId(latestMonth?.periodId)
  const yoyMonth =
    latestMeta &&
    monthlyRows.find((row) => {
      const p = parsePeriodId(row?.periodId)
      return p && p.year === latestMeta.year - 1 && p.month === latestMeta.month
    })

  const annualRows = Array.isArray(analytics?.annual) ? [...analytics.annual] : []
  annualRows.sort((a, b) => Number(a?.year || 0) - Number(b?.year || 0))
  const latestYear = annualRows.length ? annualRows[annualRows.length - 1] : null
  const previousYear = annualRows.length > 1 ? annualRows[annualRows.length - 2] : null

  const periodLabel = latestMonth?.periodId
    ? `${latestMonth.periodId}${previousMonth?.periodId ? ` vs ${previousMonth.periodId}` : ''}${
        yoyMonth?.periodId ? ` | YoY vs ${yoyMonth.periodId}` : ''
      }`
    : `${periodFrom} to ${periodTo}`

  // Daily avg: use day-of-month elapsed (for current incomplete month) or full days
  const today = new Date()
  const dayOfMonth = latestMeta
    ? latestMeta.year === today.getFullYear() && latestMeta.month === today.getMonth() + 1
      ? Math.max(today.getDate(), 1)
      : new Date(latestMeta.year, latestMeta.month, 0).getDate() // days in that month
    : today.getDate()
  const businessDaysForAverage = latestMeta
    ? getBusinessDaysInMonth(
        latestMeta.year,
        latestMeta.month,
        latestMeta.year === today.getFullYear() && latestMeta.month === today.getMonth() + 1
          ? dayOfMonth
          : null
      )
    : Math.max(dayOfMonth, 1)
  const closedPlMonthly = latestMonth ? safeNumber(latestMonth.closedPl) : safeNumber(kpis.closedPl)
  const closedPlDailyAvg = Math.round(closedPlMonthly / Math.max(businessDaysForAverage, 1))
  const uniqueClientsMonthly = latestMonth
    ? safeNumber(latestMonth.uniqueClients)
    : safeNumber(kpis.uniqueClients)
  const ftdMonthly = latestMonth ? safeNumber(latestMonth.ftd) : safeNumber(kpis.ftd)
  const netMonthly = latestMonth ? safeNumber(latestMonth.net) : safeNumber(kpis.net)
  const depositMonthly = latestMonth ? safeNumber(latestMonth.deposit) : safeNumber(kpis.deposit)
  const wdMonthly = latestMonth ? safeNumber(latestMonth.wd) : safeNumber(kpis.wd)
  const openPlMonthly = latestMonth ? safeNumber(latestMonth.openPl) : safeNumber(kpis.openPl)
  const tradesMonthly = latestMonth ? safeNumber(latestMonth.trades) : safeNumber(kpis.trades)
  const rdpMonthly = latestMonth ? safeNumber(latestMonth.rdp) : safeNumber(kpis.rdp)

  const prevMonthMeta = latestMeta ? shiftPeriodMeta(latestMeta, -1) : null
  const prevMonthExact = prevMonthMeta ? monthlyById.get(prevMonthMeta.periodId) : null

  // Same-window MoM comparison: compare current elapsed days vs same elapsed days in previous month
  const sameWindowMom = buildSameWindowMomComparison(monthlyById, latestMeta, dayOfMonth)
  const prevMonthDailyAvg = sameWindowMom.available ? sameWindowMom.dailyAvg : null

  const prevQuarterDaily = buildTrailingDailyAverageComparison(monthlyById, latestMeta, 3)
  const prevSemesterDaily = buildTrailingDailyAverageComparison(monthlyById, latestMeta, 6)

  const dailyAvgRows = [
    {
      label: `Trading Day AVG (${latestMonth?.periodId || 'current scope'})`,
      value: `${formatCurrency(closedPlDailyAvg)} (${businessDaysForAverage} days)`,
    },
    {
      label: `vs previous month ${sameWindowMom.available ? `(${sameWindowMom.periodId} ${sameWindowMom.window})` : '(n/a)'}`,
      value:
        prevMonthDailyAvg == null
          ? 'n/a'
          : `${formatCurrency(prevMonthDailyAvg)} | ${formatDelta(closedPlDailyAvg, prevMonthDailyAvg, formatCurrency)}`,
    },
    {
      label: `vs previous quarter (${prevQuarterDaily.periodLabel})`,
      value: prevQuarterDaily.available
        ? `${formatCurrency(prevQuarterDaily.dailyAvg)} | ${formatDelta(closedPlDailyAvg, prevQuarterDaily.dailyAvg, formatCurrency)} | ${prevQuarterDaily.label}`
        : 'n/a',
    },
    {
      label: `vs previous semester (${prevSemesterDaily.periodLabel})`,
      value: prevSemesterDaily.available
        ? `${formatCurrency(prevSemesterDaily.dailyAvg)} | ${formatDelta(closedPlDailyAvg, prevSemesterDaily.dailyAvg, formatCurrency)} | ${prevSemesterDaily.label}`
        : 'n/a',
    },
  ]

  const netExpected = depositMonthly - wdMonthly
  const netDeltaAbs = Math.abs(netMonthly - netExpected)
  const netCheckPass = netDeltaAbs < 0.01
  const timeframeLabel = latestMonth?.periodId
    ? `Monthly scope ${latestMonth.periodId}`
    : `Aggregated scope ${periodFrom} to ${periodTo}`
  const sourceRowsTotal = safeNumber(analyticsPayload.sourceRows)
  const filteredRowsTotal = safeNumber(analyticsPayload.filteredRows)
  const latestMonthRows = latestMonth ? safeNumber(latestMonth.rows) : 0
  const timeframeAuditRows = [
    {
      label: 'Scope check',
      value: `${timeframeLabel} for Bullwaves Edge, Trading Day AVG, FTD, Net, Deposit, Withdrawals, Active Users, Open P/L, Trades and RDP.`,
    },
    {
      label: 'Dataset rows (source / filtered)',
      value: `${formatNumber(sourceRowsTotal)} source rows, ${formatNumber(filteredRowsTotal)} after brand/year filter`,
    },
    {
      label: `Rows for ${latestMonth?.periodId || 'current period'}`,
      value: `${formatNumber(latestMonthRows)} client-month rows ? ${formatNumber(uniqueClientsMonthly)} unique clients (Active Users)`,
    },
    {
      label: 'Net Deposits consistency check',
      value: `Net Deposits ${formatCurrency(netMonthly)} vs Deposit-WD ${formatCurrency(netExpected)} | delta ${formatCurrency(netDeltaAbs)} | ${netCheckPass ? 'OK' : 'CHECK'}`,
    },
  ]

  // Top 4 highlight cards: the most decision-critical metrics
  const highlightCards = [
    {
      label: `Bullwaves Edge · ${latestMonth?.periodId || 'Period'}`,
      value: formatCurrency(closedPlMonthly),
    },
    { label: 'Bullwaves Edge · Trading Day Avg', value: formatCurrency(closedPlDailyAvg) },
    { label: `FTD · ${latestMonth?.periodId || 'Period'}`, value: formatNumber(ftdMonthly) },
    {
      label: `Active Users · ${latestMonth?.periodId || 'Period'}`,
      value: formatNumber(uniqueClientsMonthly),
    },
  ]

  const boardRows = [
    { label: 'Deposit', value: formatCurrency(depositMonthly) },
    { label: 'FTD', value: formatNumber(ftdMonthly) },
    { label: 'RDP', value: formatNumber(rdpMonthly) },
    { label: 'Withdrawals', value: formatCurrency(wdMonthly) },
    { label: 'Net Deposits (Deposit - WD)', value: formatCurrency(netMonthly) },
  ]

  // Detect if current month is partial (in progress)
  const isPartialMonth =
    latestMeta &&
    latestMeta.year === today.getFullYear() &&
    latestMeta.month === today.getMonth() + 1 &&
    dayOfMonth < getDaysInMonth(latestMeta.year, latestMeta.month)

  // Calculate daily averages for fair comparison when month is partial
  const latestDailyAvg = latestMonth
    ? {
        closedPl: safeNumber(latestMonth.closedPl) / Math.max(businessDaysForAverage, 1),
        ftd: safeNumber(latestMonth.ftd) / Math.max(dayOfMonth, 1),
        uniqueClients: safeNumber(latestMonth.uniqueClients) / Math.max(dayOfMonth, 1),
        net: safeNumber(latestMonth.net) / Math.max(dayOfMonth, 1),
        deposit: safeNumber(latestMonth.deposit) / Math.max(dayOfMonth, 1),
        wd: safeNumber(latestMonth.wd) / Math.max(dayOfMonth, 1),
        trades: safeNumber(latestMonth.trades) / Math.max(dayOfMonth, 1),
      }
    : null

  const momCompMeta = parsePeriodId(previousMonth?.periodId)
  const momCompBusinessDays = momCompMeta
    ? getBusinessDaysInMonth(momCompMeta.year, momCompMeta.month)
    : 1
  const momCompDaysInMonth = momCompMeta ? getDaysInMonth(momCompMeta.year, momCompMeta.month) : 1
  const prevDailyAvg = previousMonth
    ? {
        closedPl: safeNumber(previousMonth.closedPl) / Math.max(momCompBusinessDays, 1),
        ftd: safeNumber(previousMonth.ftd) / Math.max(momCompDaysInMonth, 1),
        uniqueClients: safeNumber(previousMonth.uniqueClients) / Math.max(momCompDaysInMonth, 1),
        net: safeNumber(previousMonth.net) / Math.max(momCompDaysInMonth, 1),
        deposit: safeNumber(previousMonth.deposit) / Math.max(momCompDaysInMonth, 1),
        wd: safeNumber(previousMonth.wd) / Math.max(momCompDaysInMonth, 1),
        trades: safeNumber(previousMonth.trades) / Math.max(momCompDaysInMonth, 1),
      }
    : null

  const yoyCompMeta = parsePeriodId(yoyMonth?.periodId)
  const yoyCompBusinessDays = yoyCompMeta
    ? getBusinessDaysInMonth(yoyCompMeta.year, yoyCompMeta.month)
    : 1
  const yoyCompDaysInMonth = yoyCompMeta ? getDaysInMonth(yoyCompMeta.year, yoyCompMeta.month) : 1
  const yoyDailyAvg = yoyMonth
    ? {
        closedPl: safeNumber(yoyMonth.closedPl) / Math.max(yoyCompBusinessDays, 1),
        ftd: safeNumber(yoyMonth.ftd) / Math.max(yoyCompDaysInMonth, 1),
        uniqueClients: safeNumber(yoyMonth.uniqueClients) / Math.max(yoyCompDaysInMonth, 1),
        net: safeNumber(yoyMonth.net) / Math.max(yoyCompDaysInMonth, 1),
        deposit: safeNumber(yoyMonth.deposit) / Math.max(yoyCompDaysInMonth, 1),
        wd: safeNumber(yoyMonth.wd) / Math.max(yoyCompDaysInMonth, 1),
        trades: safeNumber(yoyMonth.trades) / Math.max(yoyCompDaysInMonth, 1),
      }
    : null

  const monthComparisonRows = latestMonth
    ? [
        {
          metric: isPartialMonth ? 'Bullwaves Edge (trading day avg)' : 'Bullwaves Edge',
          current: isPartialMonth
            ? formatCurrency(Math.round(latestDailyAvg.closedPl))
            : formatCurrency(latestMonth.closedPl),
          mom: isPartialMonth
            ? formatDelta(latestDailyAvg.closedPl, prevDailyAvg?.closedPl, (x) =>
                formatCurrency(Math.round(x))
              )
            : formatDelta(latestMonth.closedPl, previousMonth?.closedPl, formatCurrency),
          yoy: isPartialMonth
            ? formatDelta(latestDailyAvg.closedPl, yoyDailyAvg?.closedPl, (x) =>
                formatCurrency(Math.round(x))
              )
            : formatDelta(latestMonth.closedPl, yoyMonth?.closedPl, formatCurrency),
        },
        {
          metric: isPartialMonth ? 'Net Deposits (trading day avg)' : 'Net Deposits (Deposit - WD)',
          current: isPartialMonth
            ? formatCurrency(Math.round(latestDailyAvg.net))
            : formatCurrency(latestMonth.net),
          mom: isPartialMonth
            ? formatDelta(latestDailyAvg.net, prevDailyAvg?.net, (x) =>
                formatCurrency(Math.round(x))
              )
            : formatDelta(latestMonth.net, previousMonth?.net, formatCurrency),
          yoy: isPartialMonth
            ? formatDelta(latestDailyAvg.net, yoyDailyAvg?.net, (x) =>
                formatCurrency(Math.round(x))
              )
            : formatDelta(latestMonth.net, yoyMonth?.net, formatCurrency),
        },
        {
          metric: isPartialMonth ? 'Deposit (trading day avg)' : 'Deposit',
          current: isPartialMonth
            ? formatCurrency(Math.round(latestDailyAvg.deposit))
            : formatCurrency(latestMonth.deposit),
          mom: isPartialMonth
            ? formatDelta(latestDailyAvg.deposit, prevDailyAvg?.deposit, (x) =>
                formatCurrency(Math.round(x))
              )
            : formatDelta(latestMonth.deposit, previousMonth?.deposit, formatCurrency),
          yoy: isPartialMonth
            ? formatDelta(latestDailyAvg.deposit, yoyDailyAvg?.deposit, (x) =>
                formatCurrency(Math.round(x))
              )
            : formatDelta(latestMonth.deposit, yoyMonth?.deposit, formatCurrency),
        },
        {
          metric: isPartialMonth ? 'Withdrawals (trading day avg)' : 'Withdrawals',
          current: isPartialMonth
            ? formatCurrency(Math.round(latestDailyAvg.wd))
            : formatCurrency(latestMonth.wd),
          mom: isPartialMonth
            ? formatDelta(latestDailyAvg.wd, prevDailyAvg?.wd, (x) => formatCurrency(Math.round(x)))
            : formatDelta(latestMonth.wd, previousMonth?.wd, formatCurrency),
          yoy: isPartialMonth
            ? formatDelta(latestDailyAvg.wd, yoyDailyAvg?.wd, (x) => formatCurrency(Math.round(x)))
            : formatDelta(latestMonth.wd, yoyMonth?.wd, formatCurrency),
        },
      ]
    : []

  const comparablePreviousMonthTotals = previousMonth
    ? {
        closedPl: isPartialMonth
          ? safeNumber(prevDailyAvg?.closedPl) * Math.max(businessDaysForAverage, 1)
          : safeNumber(previousMonth.closedPl),
        net: isPartialMonth
          ? safeNumber(prevDailyAvg?.net) * Math.max(dayOfMonth, 1)
          : safeNumber(previousMonth.net),
        ftd: isPartialMonth
          ? safeNumber(prevDailyAvg?.ftd) * Math.max(dayOfMonth, 1)
          : safeNumber(previousMonth.ftd),
      }
    : null

  const formatRate = (value) => `${Math.round(Number.isFinite(value) ? value : 0)}%`
  const formatCountK = (value) => {
    const n = safeNumber(value)
    const abs = Math.abs(n)
    const sign = n < 0 ? '-' : ''
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
    if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K`
    return `${sign}${Math.round(abs)}`
  }

  const collectRegistrationsForPeriod = (meta, upToDay = null) => {
    const ids = new Set()
    if (!meta) return ids
    const maxDay = Number.isFinite(upToDay) ? Math.max(Math.floor(upToDay), 1) : null
    for (const [clientId, dates] of clientDatesMap.entries()) {
      const regDate = parseDate(dates?.clientTimestamp)
      if (!regDate) continue
      if (regDate.getFullYear() !== meta.year || regDate.getMonth() + 1 !== meta.month) continue
      if (maxDay && regDate.getDate() > maxDay) continue
      ids.add(clientId)
    }
    return ids
  }

  const buildRegistrationFunnel = (meta, registeredIds) => {
    const safeRegisteredIds = registeredIds instanceof Set ? registeredIds : new Set()
    const withFtd = new Set()
    const withRdp = new Set()

    if (!meta || !safeRegisteredIds.size) {
      return {
        registrations: 0,
        withFtd: 0,
        withQftd: 0,
        ftdRate: 0,
        qftdRate: 0,
      }
    }

    for (const cm of allClientMonths) {
      const clientId = String(cm.clientId || '')
      if (!clientId || !safeRegisteredIds.has(clientId)) continue
      if (safeNumber(cm.ftd) > 0) withFtd.add(clientId)
      if (safeNumber(cm.rdp) > 0) withRdp.add(clientId)
    }

    const withQftd = new Set([...withFtd].filter((clientId) => withRdp.has(clientId)))

    const totalRegistrations = safeRegisteredIds.size
    return {
      registrations: totalRegistrations,
      withFtd: withFtd.size,
      withQftd: withQftd.size,
      ftdRate: totalRegistrations > 0 ? (withFtd.size / totalRegistrations) * 100 : 0,
      qftdRate: totalRegistrations > 0 ? (withQftd.size / totalRegistrations) * 100 : 0,
    }
  }

  const latestRegistrationIds = latestMeta
    ? collectRegistrationsForPeriod(latestMeta, null)
    : new Set()
  const latestRegistrationFunnel = buildRegistrationFunnel(latestMeta, latestRegistrationIds)
  const previousRegistrationIds = prevMonthMeta
    ? collectRegistrationsForPeriod(prevMonthMeta, null)
    : new Set()
  const previousRegistrationFunnel = buildRegistrationFunnel(prevMonthMeta, previousRegistrationIds)
  const hasPreviousRegistrationBaseline = previousRegistrationFunnel.registrations > 0

  // Per-rep aggregation for SALES template (uses allClientMonths from top of function)
  function aggRepForPeriod(periodId) {
    if (!periodId) return {}
    const byRep = {}
    for (const cm of allClientMonths) {
      if (cm.periodId !== periodId || !SALES_REP_NAMES.includes(cm.user)) continue
      const rep = cm.user
      if (!byRep[rep]) {
        byRep[rep] = {
          clients: new Set(),
          ftd: 0,
          net: 0,
          deposit: 0,
          wd: 0,
          closedPl: 0,
          trades: 0,
          clientsWithRDP: new Set(),
          clientsWithLTD: new Set(),
        }
      }
      const clientId = String(cm.clientId || '')
      byRep[rep].clients.add(clientId)
      byRep[rep].ftd += safeNumber(cm.ftd)
      byRep[rep].net += safeNumber(cm.net)
      byRep[rep].deposit += safeNumber(cm.deposit)
      byRep[rep].wd += safeNumber(cm.wd)
      byRep[rep].closedPl += safeNumber(cm.pl)
      byRep[rep].trades += safeNumber(cm.trades)

      // Retention tracking (Phase 2A)
      if (safeNumber(cm.rdp) > 0) byRep[rep].clientsWithRDP.add(clientId)
      const dates = clientDatesMap?.get(clientId)
      if (dates?.ltdDate && dates.ltdDate !== '-') byRep[rep].clientsWithLTD.add(clientId)
    }
    for (const rep of Object.keys(byRep)) {
      const totalClients = byRep[rep].clients.size
      byRep[rep].uniqueClients = totalClients
      byRep[rep].retentionRate =
        totalClients > 0 ? (byRep[rep].clientsWithRDP.size / totalClients) * 100 : 0
      byRep[rep].ltdRate =
        totalClients > 0 ? (byRep[rep].clientsWithLTD.size / totalClients) * 100 : 0
      delete byRep[rep].clients
      delete byRep[rep].clientsWithRDP
      delete byRep[rep].clientsWithLTD
    }
    return byRep
  }

  const repCurrent = aggRepForPeriod(latestMonth?.periodId)
  const repPrevious = aggRepForPeriod(previousMonth?.periodId)

  function renderSalesRepTable() {
    // Dynamic: derive active reps from data, filtered to Sales & Conversion team only, sorted by net desc
    const activeReps = SALES_CONVERSION_TEAM.filter(
      (name) =>
        repCurrent[name] &&
        (repCurrent[name].net !== 0 || repCurrent[name].deposit !== 0 || repCurrent[name].ftd !== 0)
    ).sort((a, b) => safeNumber(repCurrent[b]?.net) - safeNumber(repCurrent[a]?.net))

    if (!activeReps.length) {
      return `<p style="margin:0;color:#64748b;font-size:14px;">Nessun dato disponibile per ${latestMonth?.periodId || 'il periodo corrente'}. Assicurati che il server sia avviato.</p>`
    }

    const hL = `padding:10px 14px;background:#f8fbff;font-size:11px;color:#334155;font-weight:700;text-transform:uppercase;letter-spacing:.07em;text-align:left;border-bottom:1px solid #dbe5f4;`
    const hR = hL + `text-align:right;`
    const deltaColor = (s) =>
      s?.startsWith('+') ? '#16a34a' : s?.startsWith('-') ? '#dc2626' : '#64748b'
    const badge = (s) =>
      s && s !== '-'
        ? ` <span style="font-size:10px;font-weight:600;color:${deltaColor(s)};">${s}</span>`
        : ''

    const rows = activeReps
      .map((name, i) => {
        const cur = repCurrent[name]
        const prev = repPrevious[name] || null
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc'
        const c = `padding:11px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;background:${bg};`
        const momNet = prev ? formatDelta(cur.net, prev.net, formatK) : ''
        const momDep = prev ? formatDelta(cur.deposit, prev.deposit, formatK) : ''
        const momWd = prev ? formatDelta(cur.wd, prev.wd, formatK) : ''
        const momFtd = prev ? formatDelta(cur.ftd, prev.ftd, formatNumber) : ''
        const shortName = name.split(' ')[0]
        const retentionPct = cur.retentionRate > 0 ? `${cur.retentionRate.toFixed(1)}%` : 'No data'
        return `<tr>
        <td style="${c}color:#0f172a;font-weight:700;">${escapeHtml(shortName)}</td>
        <td style="${c}color:#334155;text-align:right;">${cur.ftd > 0 ? `<strong style="color:#0f172a;">${formatNumber(cur.ftd)}</strong>${badge(momFtd)}` : '<span style="color:#94a3b8;">—</span>'}</td>
        <td style="${c}color:#334155;text-align:right;">${formatNumber(cur.uniqueClients)}</td>
        <td style="${c}color:#334155;text-align:right;font-weight:600;">${retentionPct}</td>
        <td style="${c}color:#334155;text-align:right;">${formatK(cur.deposit)}${badge(momDep)}</td>
        <td style="${c}color:#334155;text-align:right;">${formatK(cur.wd)}${badge(momWd)}</td>
        <td style="${c}color:#0f172a;text-align:right;font-weight:700;">${formatK(cur.net)}${badge(momNet)}</td>
        <td style="${c}color:#334155;text-align:right;">${formatK(cur.closedPl)}</td>
      </tr>`
      })
      .join('')

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #dbe5f4;">
      <tr>
        <th style="${hL}">Rep</th>
        <th style="${hR}">FTD</th>
        <th style="${hR}">Clienti</th>
        <th style="${hR}">Retention %</th>
        <th style="${hR}">Deposit</th>
        <th style="${hR}">WD</th>
        <th style="${hR}">Net</th>
        <th style="${hR}">Bullwaves Edge</th>
      </tr>
      ${rows}
    </table>`
  }

  function bwSectionExecutiveNotes_Enhanced(_snapshot, intelligenceSignals) {
    const notes =
      Array.isArray(intelligenceSignals) && intelligenceSignals.length > 0
        ? intelligenceSignals.map((signal) => ({
            icon: '•',
            title: signal?.title || 'Signal',
            description:
              `${signal?.summary || signal?.detail || ''}${signal?.opportunity ? ` · ${signal.opportunity}` : ''}`.trim(),
            source: signal?.source || '',
            isMlInsight: true,
          }))
        : [
            {
              icon: '•',
              title: 'Team split is active',
              description: 'Conversion & Sales team now separated from Retention.',
              isMlInsight: false,
            },
            {
              icon: '•',
              title: 'New hire accepted',
              description: 'Retention onboarding in progress.',
              isMlInsight: false,
            },
            {
              icon: '•',
              title: 'Appraisals completed',
              description: 'Current review cycle has closed.',
              isMlInsight: false,
            },
            {
              icon: '•',
              title: 'Automation in progress',
              description: 'Reporting automation is still being built.',
              isMlInsight: false,
            },
          ]

    const notesHtml = notes
      .map(
        (n, idx) => `
    <tr>
      <td style="padding:${idx === 0 ? '0' : '11px'} 0 11px 0;vertical-align:top;border-top:${idx === 0 ? '0' : '1px solid rgba(226,232,240,0.10)'};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td width="28px" style="vertical-align:top;">
              <span style="display:inline-block;width:16px;height:16px;line-height:14px;text-align:center;border:1px solid ${n.isMlInsight ? 'rgba(96,165,250,0.55)' : 'rgba(253,230,138,0.55)'};border-radius:50%;font-size:10px;color:${n.isMlInsight ? '#60a5fa' : '#fde68a'};">${n.icon}</span>
            </td>
            <td style="padding-left:10px;vertical-align:top;">
              <div style="font-size:13px;color:${n.isMlInsight ? '#60a5fa' : '#fde68a'};font-weight:700;margin-bottom:3px;">${escapeHtml(n.title)}</div>
              <div style="font-size:12px;color:#d7e0ec;font-weight:500;line-height:1.55;">${escapeHtml(n.description)}</div>
              ${n.source ? `<div style="font-size:10px;color:#94a3b8;font-weight:500;margin-top:3px;">Source: ${escapeHtml(n.source)}</div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`
      )
      .join('')

    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(135deg, #0b1830 0%, #142746 100%);border:1px solid #334155;border-radius:14px;margin:22px 0 0 0;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);">
      <tr>
        <td style="padding:24px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td width="48px" style="vertical-align:top;">
                <div style="width:44px;height:44px;line-height:44px;text-align:center;background:rgba(253,230,138,0.12);border:1px solid rgba(253,230,138,0.25);border-radius:50%;font-size:18px;color:#fde68a;">?</div>
              </td>
              <td style="padding-left:18px;vertical-align:top;">
                <div style="font-size:14px;letter-spacing:0.14em;text-transform:uppercase;color:#fde68a;font-weight:800;margin-bottom:10px;">EXECUTIVE NOTES</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  ${notesHtml}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  }

  function bwSectionProjectBoard() {
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0 0 0;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:6px;">Project Board</div>
          <div style="font-size:12px;color:#64748b;line-height:1.5;">Coming soon: automated task summary, priorities and weekly ownership.</div>
        </td>
      </tr>
    </table>`
  }

  function bwFooter() {
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:32px 0 20px 0;border-top:1px solid #e5e7eb;padding-top:20px;">
      <tr>
        <td style="vertical-align:middle;">
          <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:2px;">Paolo Vullo</div>
          <div style="font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;">HEAD OF OPERATIONS  BULLWAVES</div>
        </td>
        <td align="right" style="vertical-align:middle;padding-left:20px;">
          <a href="http://localhost:5174" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Open Bullwaves Portal</a>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top:16px;">
          <div style="font-size:11px;color:#94a3b8;font-weight:500;text-align:center;">Generated automatically from live Qlik CREOLABS endpoints.</div>
        </td>
      </tr>
    </table>`
  }
  const marketingRows = Object.entries(brands).map(([brandName, group]) => {
    const deposited = Array.isArray(group?.deposited) ? group.deposited.length : 0
    const withdrawn = Array.isArray(group?.withdrawn) ? group.withdrawn.length : 0
    const inProfit = Array.isArray(group?.inProfit) ? group.inProfit.length : 0
    return {
      brand: brandName,
      deposited,
      withdrawn,
      inProfit,
    }
  })

  const getIsoWeekNumber = (date) => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const day = utcDate.getUTCDay() || 7
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
    return Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7)
  }

  const currentBoardDate = new Date()
  const currentBoardWeek = getIsoWeekNumber(currentBoardDate)
  const currentBoardMonth = currentBoardDate.toLocaleDateString('en-US', { month: 'long' })
  const boardRetentionStats = calcRetentionStats(
    allClientMonths,
    clientDatesMap,
    null,
    latestMonth?.periodId
  )
  const boardRetentionRate = boardRetentionStats.rdpRate

  const renderPulseStatCards = (items) => {
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : []
    if (!safeItems.length) return ''
    const cells = safeItems
      .map(
        (item) => `<td style="width:${100 / safeItems.length}%;padding:0 6px;vertical-align:top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${item.background || '#ffffff'};border:1px solid ${item.border || '#dbe5f4'};border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.06);">
            <tr>
              <td style="padding:14px 14px 12px 14px;">
                <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${item.labelColor || '#64748b'};font-weight:700;">${escapeHtml(item.label)}</div>
                <div style="margin-top:8px;font-size:22px;line-height:1.1;font-weight:800;color:${item.valueColor || '#0f172a'};">${escapeHtml(item.value)}</div>
                <div style="margin-top:6px;font-size:12px;line-height:1.4;color:${item.noteColor || '#475569'};">${item.noteHtml || escapeHtml(item.note || '')}</div>
              </td>
            </tr>
          </table>
        </td>`
      )
      .join('')

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;margin-top:14px;"><tr>${cells}</tr></table>`
  }

  const renderPulseSignalCards = (items) => {
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : []
    if (!safeItems.length) return ''
    const cells = safeItems
      .map(
        (item) => `<td style="width:${100 / safeItems.length}%;padding:0 6px;vertical-align:top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid ${item.borderColor};border-radius:14px;overflow:hidden;box-shadow:0 10px 26px rgba(15,23,42,0.05);">
            <tr>
              <td style="padding:12px 14px 10px 14px;border-bottom:1px solid #e2e8f0;background:${item.headerBackground || '#ffffff'};">
                <div style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${item.badgeColor};font-weight:800;background:${item.badgeBackground || '#f8fafc'};">${escapeHtml(item.kicker)}</div>
                <div style="margin-top:6px;font-size:15px;line-height:1.25;font-weight:700;color:#0f172a;">${escapeHtml(item.title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 14px 14px 14px;font-size:13px;line-height:1.6;color:#334155;">${item.bodyHtml || escapeHtml(item.body)}</td>
            </tr>
          </table>
        </td>`
      )
      .join('')

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;"><tr>${cells}</tr></table>`
  }

  const pulseHeadline = (() => {
    if (!previousMonth)
      return 'Live performance snapshot with momentum, pressure points, and execution priorities.'
    if (netMonthly > safeNumber(previousMonth.net) && ftdMonthly >= safeNumber(previousMonth.ftd)) {
      return 'Commercial momentum is building, with net deposits and acquisition holding above last month.'
    }
    if (wdMonthly > safeNumber(previousMonth.wd) && ftdMonthly < safeNumber(previousMonth.ftd)) {
      return 'Commercial output is under pressure, with softer FTD and heavier withdrawal flow to manage.'
    }
    if (closedPlMonthly > safeNumber(previousMonth.closedPl)) {
      return 'Profitability is improving, but the operating picture still needs selective intervention.'
    }
    return 'Performance is stable overall, with a few levers that now matter more than the headline totals.'
  })()

  const pulseMomentum = (() => {
    if (!previousMonth) {
      return {
        label: 'Signal forming',
        tone: 'Use this week as the baseline for the new weekly board rhythm.',
        bg: '#e0f2fe',
        color: '#075985',
      }
    }
    if (netMonthly > safeNumber(previousMonth.net) && ftdMonthly >= safeNumber(previousMonth.ftd)) {
      return {
        label: 'Momentum up',
        tone: 'Commercial engine is accelerating and should be protected, not diluted.',
        bg: '#dcfce7',
        color: '#166534',
      }
    }
    if (wdMonthly > safeNumber(previousMonth.wd) && ftdMonthly < safeNumber(previousMonth.ftd)) {
      return {
        label: 'Pressure building',
        tone: 'Acquisition and retention need immediate coordination this week.',
        bg: '#fee2e2',
        color: '#991b1b',
      }
    }
    return {
      label: 'Mixed week',
      tone: 'Headline numbers hold, but the operating texture is uneven.',
      bg: '#fef3c7',
      color: '#92400e',
    }
  })()

  const pulseSpotlightCards = [
    {
      label: 'Net deposits',
      value: formatK(netMonthly),
      noteHtml: comparablePreviousMonthTotals
        ? `MoM ${formatDelta(netMonthly, comparablePreviousMonthTotals.net, formatK)}`
        : 'MoM n/a',
      background: '#eff6ff',
      border: '#bfdbfe',
      labelColor: '#1d4ed8',
      valueColor: '#0f172a',
    },
    {
      label: 'FTD (all cohorts)',
      value: formatCountK(ftdMonthly),
      noteHtml: comparablePreviousMonthTotals
        ? `MoM ${formatDelta(ftdMonthly, comparablePreviousMonthTotals.ftd, formatCountK)}`
        : 'MoM n/a',
      background: '#f8fafc',
      border: '#dbe5f4',
      labelColor: '#475569',
      valueColor: '#0f172a',
    },
    {
      label: 'Registrations',
      value: formatNumber(latestRegistrationFunnel.registrations),
      noteHtml: `FTD(any): ${formatRate(latestRegistrationFunnel.ftdRate)}`,
      background: '#f0fdf4',
      border: '#bbf7d0',
      labelColor: '#15803d',
      valueColor: '#0f172a',
    },
    {
      label: 'Bullwaves Edge',
      value: formatK(closedPlMonthly),
      noteHtml: comparablePreviousMonthTotals
        ? `MoM ${formatDelta(closedPlMonthly, comparablePreviousMonthTotals.closedPl, formatK)}`
        : 'MoM n/a',
      background: '#f0fdf4',
      border: '#bbf7d0',
      labelColor: '#15803d',
      valueColor: '#0f172a',
    },
  ]

  const pulseSignals = [
    {
      kicker: 'Up',
      title:
        netMonthly >= depositMonthly - wdMonthly - 1
          ? 'Net quality holding'
          : 'Deposit engine expanding',
      body: comparablePreviousMonthTotals
        ? `Net ${formatK(netMonthly)} | Prev ${formatK(comparablePreviousMonthTotals.net)} | ? ${formatDelta(netMonthly, comparablePreviousMonthTotals.net, formatK)}`
        : `Net ${formatK(netMonthly)} | Prev n/a`,
      borderColor: '#bbf7d0',
      badgeColor: '#15803d',
      badgeBackground: '#dcfce7',
      headerBackground: '#f0fdf4',
    },
    {
      kicker: 'Down',
      title:
        hasPreviousRegistrationBaseline &&
        latestRegistrationFunnel.ftdRate < previousRegistrationFunnel.ftdRate
          ? 'Funnel conversion softened'
          : wdMonthly > safeNumber(previousMonth?.wd)
            ? 'Withdrawal pressure elevated'
            : 'Acquisition intensity softened',
      body: previousMonth
        ? hasPreviousRegistrationBaseline &&
          latestRegistrationFunnel.ftdRate < previousRegistrationFunnel.ftdRate
          ? `Reg ${formatNumber(latestRegistrationFunnel.registrations)} | FTD ${formatRate(latestRegistrationFunnel.ftdRate)} vs ${formatRate(previousRegistrationFunnel.ftdRate)}`
          : wdMonthly > safeNumber(previousMonth.wd)
            ? `WD ${formatK(wdMonthly)} | Prev ${formatK(previousMonth.wd)} | ? ${formatDelta(wdMonthly, previousMonth.wd, formatK)}`
            : `FTD ${formatCountK(ftdMonthly)} | Prev ${formatCountK(previousMonth.ftd)} | ? ${formatDelta(ftdMonthly, previousMonth.ftd, formatCountK)}`
        : `Reg ${formatNumber(latestRegistrationFunnel.registrations)} | FTD ${formatRate(latestRegistrationFunnel.ftdRate)}`,
      borderColor: '#fecaca',
      badgeColor: '#b91c1c',
      badgeBackground: '#fee2e2',
      headerBackground: '#fff1f2',
    },
    {
      kicker: 'Watch',
      title: 'True funnel quality',
      body:
        latestRegistrationFunnel.registrations > 0
          ? `Reg(May) ${formatNumber(latestRegistrationFunnel.registrations)} | FTD(any) ${formatNumber(latestRegistrationFunnel.withFtd)} ${formatRate(latestRegistrationFunnel.ftdRate)} | QFTD(FTD+RDP) ${formatNumber(latestRegistrationFunnel.withQftd)} ${formatRate(latestRegistrationFunnel.qftdRate)}`
          : boardRetentionRate > 0
            ? `Retention ${Math.round(boardRetentionRate)}%`
            : 'n/a',
      borderColor: '#fde68a',
      badgeColor: '#a16207',
      badgeBackground: '#fef3c7',
      headerBackground: '#fffbeb',
    },
  ]

  const pulseDecisionHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0f172a;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:16px 18px 8px 18px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#93c5fd;font-weight:800;">Decision Layer</td>
      </tr>
      <tr>
        <td style="padding:0 18px 18px 18px;">
          <div style="font-size:18px;line-height:1.35;font-weight:700;color:#f8fafc;">${escapeHtml(
            wdMonthly > safeNumber(previousMonth?.wd) && ftdMonthly < safeNumber(previousMonth?.ftd)
              ? 'Tighten conversion follow-up and increase retention saves on recent first depositors.'
              : netMonthly > safeNumber(previousMonth?.net)
                ? 'Protect current momentum and turn visibility into faster execution across sales and retention.'
                : 'Use this week to remove friction in the funnel before the next monthly close.'
          )}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:14px;">
            <tr>
              <td style="padding:10px 12px;background:#13213a;border:1px solid #243b63;border-radius:10px;font-size:12px;line-height:1.55;color:#cbd5e1;">
                <strong style="color:#f8fafc;">Owner:</strong> Philippines team, Retention lead, Roberta<br/>
                <strong style="color:#f8fafc;">Objective:</strong> defend net deposits while improving next-touch conversion quality<br/>
                <strong style="color:#f8fafc;">Expected impact:</strong> better deposit retention and clearer weekly accountability
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `

  const pulseExecutionHtml = renderInsightStrip([
    'Team split is active: Conversion & Sales team (Philippines team + Jake) now separated from Retention.',
    'New hire accepted: Milen Hristovski joins as Retention Agent with terms aligned to the current retention structure.',
    'Appraisals closed for Roberta, Orlin and Gabriela; Mirna Bridi is in third-step interview.',
    'Tracking automation and incentive system are in build to reduce manual reporting load.',
  ])

  const boardTemplate = {
    key: 'board',
    label: 'BOARD',
    subject: `Board - weekly snapshot - W${currentBoardWeek} - ${currentBoardMonth}`,
    html: buildMailHtml({
      title: 'BOARD Executive Snapshot',
      subtitle: periodLabel,
      intro: 'Executive snapshot of core business performance from live CREOLABS data.',
      sections: [
        {
          title: `Core KPIs • ${latestMonth?.periodId || 'Current Period'}`,
          html: `${renderKpiCards(highlightCards)}<div style="height:18px;"></div>${renderMetricTable(boardRows, latestMonth ? `Monthly data • ${latestMonth.periodId}` : 'Aggregated period data')}`,
        },
        {
          title: isPartialMonth
            ? 'Monthly Comparison (MoM / YoY, Daily Average Basis)'
            : 'Monthly Comparison (MoM / YoY)',
          html: renderComparisonTable(monthComparisonRows),
        },
        ...(ENABLE_TOP_AFFILIATES_SECTION
          ? [
              {
                title: 'Top Affiliates',
                html: (() => {
                  // Calculate previous period
                  const latestPeriod = latestMonth?.periodId // e.g., "2026-05"
                  if (!latestPeriod) {
                    return '<p style="margin:0;color:#64748b;font-size:14px;">No period data available.</p>'
                  }

                  if (!affiliatePaymentsMap) {
                    return '<p style="margin:0;color:#64748b;font-size:14px;">Loading affiliate commissions data...</p>'
                  }

                  // Multi-dimensional aggregation from Qlik: Net Deposits, P/L (current month + lifetime)
                  const currentMonthDeposits = new Map()
                  const lifetimeDeposits = new Map()
                  const currentMonthPl = new Map()
                  const lifetimePl = new Map()

                  for (const cm of allClientMonths) {
                    const affId = String(cm.affiliateId || 'unknown')

                    // Lifetime aggregations
                    if (!lifetimeDeposits.has(affId)) {
                      lifetimeDeposits.set(affId, 0)
                      lifetimePl.set(affId, 0)
                    }
                    lifetimeDeposits.set(
                      affId,
                      lifetimeDeposits.get(affId) + safeNumber(cm.deposit)
                    )
                    lifetimePl.set(affId, lifetimePl.get(affId) + safeNumber(cm.pl))

                    // Current month aggregations
                    if (cm.periodId === latestPeriod) {
                      if (!currentMonthDeposits.has(affId)) {
                        currentMonthDeposits.set(affId, 0)
                        currentMonthPl.set(affId, 0)
                      }
                      currentMonthDeposits.set(
                        affId,
                        currentMonthDeposits.get(affId) + safeNumber(cm.deposit)
                      )
                      currentMonthPl.set(affId, currentMonthPl.get(affId) + safeNumber(cm.pl))
                    }
                  }

                  // Extract commissions from affiliatePaymentsMap CSV data
                  const affiliateStats = []
                  for (const [affKey, affData] of Object.entries(affiliatePaymentsMap)) {
                    const affId = affData.id || affKey
                    const affName = affData.name || affKey

                    // Skip "unknown" and placeholder affiliates
                    if (affId === 'unknown' || affId === '-') continue

                    // Current month commissions from CSV
                    const monthCommissions = affData.months?.[latestPeriod]?.total || 0

                    // Lifetime commissions from CSV
                    const lifetimeCommissions = affData.totals?.total || 0

                    // Net Deposits from Qlik (Creolabs)
                    const monthDeposits = currentMonthDeposits.get(affId) || 0
                    const lifeDeposits = lifetimeDeposits.get(affId) || 0

                    // P/L from Qlik
                    const monthPl = currentMonthPl.get(affId) || 0
                    const lifePl = lifetimePl.get(affId) || 0

                    // Calculate ROI: (P/L - Commissions) / Commissions * 100
                    const monthRoi =
                      monthCommissions > 0
                        ? ((monthPl - monthCommissions) / monthCommissions) * 100
                        : 0
                    const lifeRoi =
                      lifetimeCommissions > 0
                        ? ((lifePl - lifetimeCommissions) / lifetimeCommissions) * 100
                        : 0

                    affiliateStats.push({
                      id: affId,
                      name: affName,
                      monthDeposits,
                      lifeDeposits,
                      monthCommissions,
                      lifetimeCommissions,
                      monthPl,
                      lifePl,
                      monthRoi,
                      lifeRoi,
                    })
                  }

                  // Rank by lifetime deposits (highest first) - affiliates driving most revenue
                  const topAffiliates = affiliateStats
                    .filter((a) => a.lifeDeposits > 0 || a.lifetimeCommissions > 0) // Has activity
                    .sort((a, b) => b.lifeDeposits - a.lifeDeposits) // Highest deposits first
                    .slice(0, 5)

                  if (!topAffiliates.length) {
                    return '<p style="margin:0;color:#64748b;font-size:14px;">No affiliate data available.</p>'
                  }

                  // Calculate totals for the top 5
                  const totals = topAffiliates.reduce(
                    (acc, aff) => ({
                      monthDeposits: acc.monthDeposits + aff.monthDeposits,
                      lifeDeposits: acc.lifeDeposits + aff.lifeDeposits,
                      monthCommissions: acc.monthCommissions + aff.monthCommissions,
                      lifetimeCommissions: acc.lifetimeCommissions + aff.lifetimeCommissions,
                      monthPl: acc.monthPl + aff.monthPl,
                      lifePl: acc.lifePl + aff.lifePl,
                    }),
                    {
                      monthDeposits: 0,
                      lifeDeposits: 0,
                      monthCommissions: 0,
                      lifetimeCommissions: 0,
                      monthPl: 0,
                      lifePl: 0,
                    }
                  )

                  // Calculate total ROI
                  totals.monthRoi =
                    totals.monthCommissions > 0
                      ? ((totals.monthPl - totals.monthCommissions) / totals.monthCommissions) * 100
                      : 0
                  totals.lifeRoi =
                    totals.lifetimeCommissions > 0
                      ? ((totals.lifePl - totals.lifetimeCommissions) /
                          totals.lifetimeCommissions) *
                        100
                      : 0

                  const hL =
                    'padding:8px 6px;background:#f8fbff;border-bottom:1px solid #dbe5f4;font-size:10px;color:#334155;text-align:left;font-weight:600;'
                  const hR =
                    'padding:8px 6px;background:#f8fbff;border-bottom:1px solid #dbe5f4;font-size:10px;color:#334155;text-align:right;font-weight:600;'
                  const c = 'padding:6px 6px;border-bottom:1px solid #f1f5f9;font-size:12px;'
                  const cTotal =
                    'padding:8px 6px;border-top:2px solid #334155;font-size:12px;font-weight:700;'

                  // Elegant number formatting with K/M suffixes
                  const formatNum = (val) => {
                    const num = Math.round(val)
                    if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1)}M`
                    if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}K`
                    return num.toString()
                  }

                  const formatRoi = (roi) => {
                    const color = roi > 0 ? '#10b981' : roi < 0 ? '#ef4444' : '#64748b'
                    const sign = roi > 0 ? '+' : ''
                    return `<span style=\"color:${color};font-weight:600;\">${sign}${Math.round(roi)}%</span>`
                  }

                  const rows = topAffiliates
                    .map((aff, idx) => {
                      const bg = idx % 2 === 0 ? 'background:#ffffff;' : 'background:#f9fafb;'
                      return `<tr>
        <td style=\"${c}${bg}color:#0f172a;\">
          <div style=\"font-weight:600;font-size:11px;\">${escapeHtml(aff.id)}</div>
          <div style=\"font-size:9px;color:#64748b;margin-top:1px;\">${escapeHtml(aff.name)}</div>
        </td>
        <td style=\"${c}${bg}color:#334155;text-align:right;\">${formatNum(aff.monthDeposits)}</td>
        <td style=\"${c}${bg}color:#64748b;text-align:right;\">${formatNum(aff.lifeDeposits)}</td>
        <td style=\"${c}${bg}color:#334155;text-align:right;\">${formatNum(aff.monthCommissions)}</td>
        <td style=\"${c}${bg}color:#64748b;text-align:right;\">${formatNum(aff.lifetimeCommissions)}</td>
        <td style=\"${c}${bg}color:#334155;text-align:right;\">${formatNum(aff.monthPl)}</td>
        <td style=\"${c}${bg}color:#64748b;text-align:right;\">${formatNum(aff.lifePl)}</td>
        <td style=\"${c}${bg}text-align:right;\">${formatRoi(aff.monthRoi)}</td>
        <td style=\"${c}${bg}text-align:right;\">${formatRoi(aff.lifeRoi)}</td>
      </tr>`
                    })
                    .join('')

                  const totalRow = `<tr>
        <td style=\"${cTotal}background:#f8fbff;color:#0f172a;\">TOTAL</td>
        <td style=\"${cTotal}background:#f8fbff;color:#0f172a;text-align:right;\">${formatNum(totals.monthDeposits)}</td>
        <td style=\"${cTotal}background:#f8fbff;color:#0f172a;text-align:right;\">${formatNum(totals.lifeDeposits)}</td>
        <td style=\"${cTotal}background:#f8fbff;color:#0f172a;text-align:right;\">${formatNum(totals.monthCommissions)}</td>
        <td style=\"${cTotal}background:#f8fbff;color:#0f172a;text-align:right;\">${formatNum(totals.lifetimeCommissions)}</td>
        <td style=\"${cTotal}background:#f8fbff;color:#0f172a;text-align:right;\">${formatNum(totals.monthPl)}</td>
        <td style=\"${cTotal}background:#f8fbff;color:#0f172a;text-align:right;\">${formatNum(totals.lifePl)}</td>
        <td style=\"${cTotal}background:#f8fbff;text-align:right;\">${formatRoi(totals.monthRoi)}</td>
        <td style=\"${cTotal}background:#f8fbff;text-align:right;\">${formatRoi(totals.lifeRoi)}</td>
      </tr>`

                  return `<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #dbe5f4;font-size:11px;\">
      <tr>
        <th style=\"${hL}\">Affiliate</th>
        <th style=\"${hR}\">Net Dep<br/><span style=\"font-size:9px;font-weight:400;color:#64748b;\">May</span></th>
        <th style=\"${hR}\">Net Dep<br/><span style=\"font-size:9px;font-weight:400;color:#64748b;\">Life</span></th>
        <th style=\"${hR}\">Comm<br/><span style=\"font-size:9px;font-weight:400;color:#64748b;\">May</span></th>
        <th style=\"${hR}\">Comm<br/><span style=\"font-size:9px;font-weight:400;color:#64748b;\">Life</span></th>
        <th style=\"${hR}\">P/L<br/><span style=\"font-size:9px;font-weight:400;color:#64748b;\">May</span></th>
        <th style=\"${hR}\">P/L<br/><span style=\"font-size:9px;font-weight:400;color:#64748b;\">Life</span></th>
        <th style=\"${hR}\">ROI<br/><span style=\"font-size:9px;font-weight:400;color:#64748b;\">May</span></th>
        <th style=\"${hR}\">ROI<br/><span style=\"font-size:9px;font-weight:400;color:#64748b;\">Life</span></th>
      </tr>
      ${rows}
      ${totalRow}
    </table>`
                })(),
              },
            ]
          : []),
        {
          title: 'Business Health',
          html: (() => {
            const retentionStats = calcRetentionStats(
              allClientMonths,
              clientDatesMap,
              null,
              latestMonth?.periodId
            )
            const retentionRate = retentionStats.rdpRate

            // Retention Rate comparisons
            const prevRetentionStats = previousMonth
              ? calcRetentionStats(allClientMonths, clientDatesMap, null, previousMonth.periodId)
              : null
            const yoyRetentionStats = yoyMonth
              ? calcRetentionStats(allClientMonths, clientDatesMap, null, yoyMonth.periodId)
              : null

            const retentionMoM =
              prevRetentionStats && prevRetentionStats.rdpRate > 0
                ? Math.round((retentionRate - prevRetentionStats.rdpRate) * 10) / 10 // 1 decimal
                : null
            const retentionYoY =
              yoyRetentionStats && yoyRetentionStats.rdpRate > 0
                ? Math.round((retentionRate - yoyRetentionStats.rdpRate) * 10) / 10
                : null

            const retentionDisplay =
              retentionRate > 0
                ? `${Math.round(retentionRate)}%${
                    retentionMoM !== null
                      ? ` <span style="font-size:11px;color:${retentionMoM >= 0 ? '#16a34a' : '#dc2626'};font-weight:600;">(${retentionMoM >= 0 ? '+' : ''}${retentionMoM}% MoM)</span>`
                      : ''
                  }${
                    retentionYoY !== null
                      ? ` <span style="font-size:11px;color:${retentionYoY >= 0 ? '#16a34a' : '#dc2626'};font-weight:600;">(${retentionYoY >= 0 ? '+' : ''}${retentionYoY}% YoY)</span>`
                      : ''
                  }`
                : 'n/a'

            const avgDays = calcAvgDaysToLTD(allClientMonths, clientDatesMap)
            const depositWdRatio = wdMonthly > 0 ? (depositMonthly / wdMonthly).toFixed(1) : 'n/a'

            // FTD Growth with partial month handling
            const ftdGrowth =
              isPartialMonth && previousMonth && latestDailyAvg && prevDailyAvg
                ? Math.round(
                    ((latestDailyAvg.ftd - prevDailyAvg.ftd) / Math.max(prevDailyAvg.ftd, 1)) * 100
                  )
                : previousMonth && previousMonth.ftd > 0
                  ? Math.round(((ftdMonthly - previousMonth.ftd) / previousMonth.ftd) * 100)
                  : 'n/a'
            const ftdGrowthColor =
              ftdGrowth !== 'n/a'
                ? ftdGrowth > 0
                  ? '#16a34a'
                  : ftdGrowth < 0
                    ? '#dc2626'
                    : '#64748b'
                : undefined

            return renderMetricTable(
              [
                { label: 'Retention Rate (RDP)', value: retentionDisplay, html: true },
                {
                  label: 'Avg Days to First Trade',
                  value: avgDays !== null ? `${avgDays} days` : 'loading...',
                },
                {
                  label: 'Deposit/WD Ratio',
                  value:
                    depositWdRatio !== 'n/a'
                      ? `${depositWdRatio}x ( deposited per  withdrawn)`
                      : 'n/a',
                },
                {
                  label: isPartialMonth ? 'FTD Growth (daily avg MoM)' : 'FTD Growth (MoM)',
                  value: ftdGrowth !== 'n/a' ? `${ftdGrowth > 0 ? '+' : ''}${ftdGrowth}%` : 'n/a',
                  color: ftdGrowthColor,
                },
              ],
              'Health Indicators'
            )
          })(),
        },
        {
          title: 'Executive Notes',
          html: (() => {
            const histRows = [...monthlyRows].reverse().slice(0, 12)
            if (!histRows.length)
              return '<p style="margin:0;color:#4b5563;font-size:14px;">No data available.</p>'
            const chartRows = [...histRows].reverse() // oldest -> newest for left-to-right curve
            const values = chartRows.map((row) => safeNumber(row.uniqueClients))
            const latestValue = values.length ? values[values.length - 1] : 0
            const daysInLatestMonth = latestMeta
              ? getDaysInMonth(latestMeta.year, latestMeta.month)
              : 0
            const isCurrentMonthInProgress =
              !!latestMeta &&
              latestMeta.year === today.getFullYear() &&
              latestMeta.month === today.getMonth() + 1 &&
              dayOfMonth < daysInLatestMonth
            // Linear regression over all complete months ? predict value at current month index
            const linRegValues = isCurrentMonthInProgress ? values.slice(0, -1) : values
            const linRegN = linRegValues.length
            const projectedLatestValue = (() => {
              if (!isCurrentMonthInProgress || linRegN < 2) return null
              const xBar = (linRegN - 1) / 2
              const yBar = linRegValues.reduce((s, v) => s + v, 0) / linRegN
              let num = 0
              let den = 0
              linRegValues.forEach((v, i) => {
                num += (i - xBar) * (v - yBar)
                den += (i - xBar) ** 2
              })
              const slope = den === 0 ? 0 : num / den
              const intercept = yBar - slope * xBar
              return Math.max(0, Math.round(intercept + slope * (chartRows.length - 1)))
            })()
            const maxValue = Math.max(
              1,
              ...values,
              projectedLatestValue == null ? 0 : projectedLatestValue
            )
            const minValue = 0 // force value axis to start at zero
            const range = Math.max(1, maxValue - minValue)
            const chartW = 760
            const chartH = 220
            const padX = 30
            const padY = 18
            const innerW = chartW - padX * 2
            const innerH = chartH - padY * 2
            const baselineY = chartH - padY
            const pointStep = chartRows.length > 1 ? innerW / (chartRows.length - 1) : innerW
            const points = chartRows.map((row, idx) => {
              const value = safeNumber(row.uniqueClients)
              const x = Math.round(padX + idx * pointStep)
              const y = Math.round(padY + ((maxValue - value) / range) * innerH)
              return { periodId: row.periodId, value, x, y }
            })

            const toSmoothPath = (pts) => {
              if (!pts.length) return ''
              if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
              let d = `M ${pts[0].x} ${pts[0].y}`
              for (let i = 1; i < pts.length; i += 1) {
                const prev = pts[i - 1]
                const cur = pts[i]
                const cpX = Math.round((prev.x + cur.x) / 2)
                d += ` C ${cpX} ${prev.y}, ${cpX} ${cur.y}, ${cur.x} ${cur.y}`
              }
              return d
            }

            const linePath = toSmoothPath(points)
            const areaPath = `${linePath} L ${padX + innerW} ${baselineY} L ${padX} ${baselineY} Z`
            const projectedPoints =
              projectedLatestValue == null
                ? []
                : points.map((p, idx) => {
                    if (idx !== points.length - 1) return p
                    const projectedY = Math.round(
                      padY + ((maxValue - projectedLatestValue) / range) * innerH
                    )
                    return { ...p, value: projectedLatestValue, y: projectedY }
                  })
            const projectedPath = projectedPoints.length ? toSmoothPath(projectedPoints) : ''
            const projectedLastPoint = projectedPoints.length
              ? projectedPoints[projectedPoints.length - 1]
              : null
            const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(padY + t * innerH))

            const dots = points
              .map(
                (p) =>
                  `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#2563eb" stroke="#ffffff" stroke-width="2"></circle>`
              )
              .join('')

            const xLabels = points
              .filter((_, i) => i % 2 === 0 || i === points.length - 1)
              .map(
                (p) =>
                  `<text x="${p.x}" y="${chartH - 2}" text-anchor="middle" font-size="10" fill="#64748b">${escapeHtml(
                    String(p.periodId || '').slice(2)
                  )}</text>`
              )
              .join('')

            // Simple line chart without gradients and projections
            const simpleChartH = 140
            const simpleInnerH = simpleChartH - padY * 2
            const simplePath = points
              .map((p, idx) => {
                const y = Math.round(padY + ((maxValue - p.value) / range) * simpleInnerH)
                return idx === 0 ? `M ${p.x} ${y}` : `L ${p.x} ${y}`
              })
              .join(' ')
            const simpleDots = points
              .map((p) => {
                const y = Math.round(padY + ((maxValue - p.value) / range) * simpleInnerH)
                return `<circle cx="${p.x}" cy="${y}" r="3" fill="#2563eb" />`
              })
              .join('')
            const simpleLabels = points
              .filter((_, i) => i % 2 === 0 || i === points.length - 1)
              .map((p) => {
                const y = Math.round(padY + ((maxValue - p.value) / range) * simpleInnerH)
                return `<text x="${p.x}" y="${simpleChartH - 2}" text-anchor="middle" font-size="10" fill="#64748b">${escapeHtml(String(p.periodId || '').slice(2))}</text>`
              })
              .join('')

            return `
              <!-- Strategic Initiatives -->
              <div style="padding:20px 22px;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;margin-bottom:20px;box-shadow:0 1px 2px rgba(15,23,42,0.04);">
                <div style="display:flex;align-items:center;margin-bottom:12px;">
                  <div style="width:22px;height:22px;margin-right:10px;border:1px solid #cbd5e1;border-radius:999px;background:#f8fafc;color:#334155;font-size:12px;line-height:22px;text-align:center;font-weight:700;">?</div>
                  <h3 style="margin:0;font-size:15px;color:#0f172a;font-weight:700;letter-spacing:0.02em;">Strategic Initiatives</h3>
                </div>
                <div style="padding-left:38px;">
                  <p style="margin:0 0 12px 0;font-size:13px;color:#1f2937;line-height:1.7;">
                    <strong style="color:#0f172a;">Team Restructuring:</strong> In coordination with Roberta, established clear separation between:
                  </p>
                  <ul style="margin:0 0 12px 0;padding-left:20px;font-size:13px;color:#1f2937;line-height:1.7;">
                    <li style="margin-bottom:6px;"><strong>Conversion & Sales Team</strong> (Philippines team + Jake)</li>
                    <li><strong>Retention Team</strong> (dedicated focus)</li>
                  </ul>
                  <p style="margin:0 0 12px 0;font-size:12px;color:#4b5563;line-height:1.6;font-style:italic;">
                    Goal: Define clear roles and responsibilities based on individual strengths
                  </p>
                  <div style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
                    <p style="margin:0 0 8px 0;font-size:12px;color:#334155;line-height:1.6;font-weight:700;">
                      In Development:
                    </p>
                    <ul style="margin:0;padding-left:20px;font-size:12px;color:#334155;line-height:1.6;">
                      <li style="margin-bottom:4px;">Tracking system for both teams (daily work monitoring)</li>
                      <li style="margin-bottom:4px;">Automated visibility & reporting</li>
                      <li style="margin-bottom:4px;">Reduced manual commission calculations for Roberta</li>
                      <li>Incentive/bonus system (includes Roberta + Philippines team)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Project Board -->
              <div style="padding:20px 22px;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;margin-bottom:20px;box-shadow:0 1px 2px rgba(15,23,42,0.04);">
                <div style="display:flex;align-items:center;margin-bottom:10px;">
                  <div style="width:22px;height:22px;margin-right:10px;border:1px solid #cbd5e1;border-radius:999px;background:#f8fafc;color:#334155;font-size:12px;line-height:22px;text-align:center;font-weight:700;">?</div>
                  <h3 style="margin:0;font-size:15px;color:#0f172a;font-weight:700;letter-spacing:0.02em;">Project Board Status</h3>
                </div>
                <p style="margin:0 0 8px 0;font-size:13px;color:#475569;line-height:1.7;">
                  For detailed task tracking and project updates, visit: 
                  <a href="http://localhost:5174/project-board" style="color:#0ea5e9;text-decoration:none;font-weight:600;border-bottom:1px solid #0ea5e9;">Project Board</a>
                </p>
                <p style="margin:0;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:11px;color:#334155;font-style:italic;">
                  ?? Coming soon: Automated task summary (ongoing, completed, priorities)
                </p>
              </div>

              <!-- Team Updates -->
              <div style="padding:20px 22px;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;margin-bottom:20px;box-shadow:0 1px 2px rgba(15,23,42,0.04);">
                <div style="display:flex;align-items:center;margin-bottom:12px;">
                  <div style="width:22px;height:22px;margin-right:10px;border:1px solid #cbd5e1;border-radius:999px;background:#f8fafc;color:#334155;font-size:12px;line-height:22px;text-align:center;font-weight:700;">?</div>
                  <h3 style="margin:0;font-size:15px;color:#0f172a;font-weight:700;letter-spacing:0.02em;">Team Updates</h3>
                </div>
                <div style="padding-left:38px;">
                  <p style="margin:0 0 12px 0;font-size:13px;color:#1f2937;line-height:1.7;">
                    <strong style="color:#15803d;">New Hire:</strong> <strong>Milen Hristovski</strong> accepted our offer last week as Retention Agent. Commercial proposal matches Orlin and Gabriela's terms.
                  </p>
                  <p style="margin:0;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;color:#334155;line-height:1.6;">
                    <strong>Background:</strong> Previously at Ava Trade and Blueberry
                  </p>
                </div>
              </div>

              <!-- Interviews & Appraisals -->
              <div style="padding:20px 22px;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;box-shadow:0 1px 2px rgba(15,23,42,0.04);">
                <div style="display:flex;align-items:center;margin-bottom:12px;">
                  <div style="width:22px;height:22px;margin-right:10px;border:1px solid #cbd5e1;border-radius:999px;background:#f8fafc;color:#334155;font-size:12px;line-height:22px;text-align:center;font-weight:700;">?</div>
                  <h3 style="margin:0;font-size:15px;color:#0f172a;font-weight:700;letter-spacing:0.02em;">Interviews & Appraisals</h3>
                </div>
                <div style="padding-left:38px;">
                  <p style="margin:0 0 12px 0;font-size:13px;color:#1f2937;line-height:1.7;">
                    <strong style="color:#a16207;">Completed:</strong> Appraisals for <strong>Roberta</strong>, <strong>Orlin</strong>, and <strong>Gabriela</strong> — all results positive. Team members were informed about upcoming changes and showed enthusiasm.
                  </p>
                  <p style="margin:0;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;color:#334155;line-height:1.6;">
                    <strong>This Week:</strong> Third interview step with <strong>Mirna Bridi</strong> (Retention Agent, known to Roberta, ex-BDSwiss)
                  </p>
                </div>
              </div>
            `
          })(),
        },
      ],
    }),
  }

  const pulseTemplate = {
    key: 'pulse',
    label: 'PULSE',
    subject: `Pulse - weekly snapshot - W${currentBoardWeek} - ${currentBoardMonth}`,
    html: buildMailHtml({
      title: 'Weekly Pulse',
      subtitle: periodLabel,
      intro: 'A sharper board brief focused on momentum, pressure points, and the next move.',
      sections: [
        {
          title: `This Week in One Screen • ${latestMonth?.periodId || 'Current Period'}`,
          html: `
            <div style="padding:20px 20px 18px 20px;background:linear-gradient(135deg,#dbeafe 0%,#ffffff 45%,#ecfeff 100%);border:1px solid #bfdbfe;border-radius:16px;box-shadow:0 14px 34px rgba(37,99,235,0.10);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
                <div>
                  <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#2563eb;font-weight:900;">Weekly Pulse</div>
                  <div style="margin-top:8px;font-size:26px;line-height:1.28;font-weight:800;color:#0f172a;">${escapeHtml(pulseHeadline)}</div>
                </div>
                <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:${pulseMomentum.bg};font-size:11px;line-height:1.1;letter-spacing:0.08em;text-transform:uppercase;color:${pulseMomentum.color};font-weight:800;white-space:nowrap;">${escapeHtml(pulseMomentum.label)}</div>
              </div>
              <div style="margin-top:10px;font-size:13px;line-height:1.65;color:#475569;">${escapeHtml(latestMonth?.periodId || currentBoardMonth)} | MTD day ${dayOfMonth} | ${escapeHtml(pulseMomentum.label)}</div>
            </div>
            ${renderPulseStatCards(pulseSpotlightCards)}
          `,
        },
        {
          title: 'Up / Down / Watch',
          html: renderPulseSignalCards(pulseSignals),
        },
        {
          title: 'Decision Layer',
          html: pulseDecisionHtml,
        },
        {
          title: 'Scoreboard',
          html: `${renderComparisonTable(monthComparisonRows)}<div style="height:18px;"></div>${renderMetricTable(
            [
              { label: 'Deposit', value: formatK(depositMonthly) },
              { label: 'Withdrawals', value: formatK(wdMonthly) },
              { label: 'Active Users', value: formatCountK(uniqueClientsMonthly) },
              {
                label: 'Retention Rate (RDP)',
                value: boardRetentionRate > 0 ? `${Math.round(boardRetentionRate)}%` : 'n/a',
              },
            ],
            'Operating radar'
          )}<div style="height:14px;"></div>${renderMetricTable(
            [
              { label: 'FTD (all cohorts)', value: formatCountK(ftdMonthly) },
              {
                label: 'Leads (active clients)',
                value: formatNumber(boardSnapshot?.funnel?.leads || 0),
              },
              {
                label: 'Registrations (new signups)',
                value: formatNumber(boardSnapshot?.funnel?.registrations || 0),
              },
              {
                label: 'Reg(May) ? FTD (any month)',
                value: `${formatNumber(latestRegistrationFunnel.withFtd)} | ${formatRate(latestRegistrationFunnel.ftdRate)}`,
              },
              {
                label: 'Reg(May) ? QFTD (FTD+RDP, any month)',
                value: `${formatNumber(latestRegistrationFunnel.withQftd)} | ${formatRate(latestRegistrationFunnel.qftdRate)}`,
              },
            ],
            `Acquisition funnel • ${latestMonth?.periodId || 'Current Period'}`
          )}`,
        },
        {
          title: 'Execution Notes',
          html: pulseExecutionHtml,
        },
      ],
    }),
  }

  const salesTemplate = {
    key: 'sales',
    label: 'SALES',
    subject: `SALES & CONVERSION | Team Performance | ${latestMonth?.periodId || periodLabel}`,
    html: buildMailHtml({
      title: 'SALES & CONVERSION Team Performance',
      subtitle: latestMonth?.periodId
        ? `${latestMonth.periodId}${previousMonth?.periodId ? ` vs ${previousMonth.periodId}` : ''}`
        : periodLabel,
      intro:
        'Sales & Conversion team performance (Philippines + Jake) — unique clients, FTD, deposit, net, closed P/L and trades, with month-over-month comparison where available.',
      sections: [
        {
          title: `Rep Performance • ${latestMonth?.periodId || 'Current Period'}`,
          html: renderSalesRepTable(),
        },
        {
          title: 'Team Highlights',
          html: renderInsightStrip([
            (() => {
              const totals = SALES_CONVERSION_TEAM.reduce(
                (acc, name) => {
                  const cur = repCurrent[name] || {}
                  acc.ftd += safeNumber(cur.ftd)
                  acc.deposit += safeNumber(cur.deposit)
                  acc.wd += safeNumber(cur.wd)
                  acc.net += safeNumber(cur.net)
                  acc.closedPl += safeNumber(cur.closedPl)
                  acc.clients += safeNumber(cur.uniqueClients)
                  return acc
                },
                { ftd: 0, deposit: 0, wd: 0, net: 0, closedPl: 0, clients: 0 }
              )
              return `${latestMonth?.periodId || 'This period'}: totali Sales & Conversion team � ${formatNumber(totals.ftd)} FTD, ${formatNumber(totals.clients)} clienti, ${formatK(totals.deposit)} deposit, ${formatK(totals.wd)} WD, ${formatK(totals.net)} net, ${formatK(totals.closedPl)} closed P/L.`
            })(),
            (() => {
              const avgDays = calcAvgDaysToLTD(allClientMonths, clientDatesMap)
              return avgDays !== null
                ? `Avg time to first trade: ${avgDays} days (registration ? LTD).`
                : 'Avg time to first trade: not available (missing lifecycle dates).'
            })(),
            previousMonth?.periodId
              ? `MoM comparison vs ${previousMonth.periodId} shown inline. Green = growth, red = decline.`
              : 'Month-over-month comparison not available � only one period in data.',
            `Data sourced live from CREOLABS Qlik client-months. Rep attribution based on the \"user\" field.`,
          ]),
        },
      ],
    }),
  }

  const marketingTableHtml = (() => {
    if (!marketingRows.length) {
      return '<p style="margin:0;color:#4b5563;font-size:14px;">No brand list rows available from /api/qlik/creolabs/client-lists.</p>'
    }
    const rowsHtml = marketingRows
      .map(
        (row) => `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">${escapeHtml(
            row.brand
          )}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${formatNumber(
            row.deposited
          )}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${formatNumber(
            row.withdrawn
          )}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${formatNumber(
            row.inProfit
          )}</td>
        </tr>`
      )
      .join('')

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #dbe5f4;border-radius:10px;overflow:hidden;">
        <tr>
          <th style="text-align:left;padding:10px 12px;background:#f8fbff;font-size:13px;color:#111827;">Brand</th>
          <th style="text-align:right;padding:10px 12px;background:#f8fbff;font-size:13px;color:#111827;">Deposited</th>
          <th style="text-align:right;padding:10px 12px;background:#f8fbff;font-size:13px;color:#111827;">Withdrawn</th>
          <th style="text-align:right;padding:10px 12px;background:#f8fbff;font-size:13px;color:#111827;">In Profit</th>
        </tr>
        ${rowsHtml}
      </table>
    `
  })()

  const marketingTemplate = {
    key: 'marketing',
    label: 'MARKETING',
    subject: `MARKETING | Brand Momentum | ${periodLabel}`,
    html: buildMailHtml({
      title: 'MARKETING Brand Momentum',
      subtitle: `${periodLabel} | rolling ${listsPayload.days || 30}d client-lists`,
      intro:
        'This template uses the real rolling client-lists endpoint to expose brand-level momentum signals, plus lifecycle-based conversion insights.',
      sections: [
        {
          title: 'Client Lists by Brand',
          html: marketingTableHtml,
        },
        {
          title: 'Weekly Registration Trend',
          html: (() => {
            const weeks = calcWeeklyRegistrations(clientDatesMap, 6, 60) // Last 60 days only
            const chart = renderWeeklyTrendMiniChart(weeks)
            const totalNew = weeks.reduce((sum, w) => sum + w.count, 0)
            const avgPerWeek = weeks.length > 0 ? Math.round(totalNew / weeks.length) : 0
            return `
              <div style="padding:16px;background:#f8fbff;border:1px solid #dbe5f4;border-radius:10px;">
                ${chart}
                <p style="margin:12px 0 0 0;font-size:13px;color:#334155;text-align:center;">
                  <strong style="color:#0f172a;">${totalNew}</strong> nuove registrazioni nelle ultime 6 settimane
                  (media <strong style="color:#3b82f6;">${avgPerWeek}/settimana</strong>)
                </p>
              </div>
            `
          })(),
        },
        {
          title: 'Conversion Funnel',
          html: (() => {
            const funnel = calcConversionFunnel(clientDatesMap, allClientMonths, 30) // Last 30 days
            return `
              <div style="padding:16px;background:#f8fbff;border:1px solid #dbe5f4;border-radius:10px;">
                <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="font-size:13px;color:#334155;padding:6px 0;">Registrazioni ultimi ${funnel.daysBack}gg</td>
                    <td style="font-size:16px;color:#0f172a;font-weight:700;text-align:right;padding:6px 0;">${formatNumber(funnel.registered)}</td>
                    <td style="font-size:12px;color:#64748b;text-align:right;padding:6px 0;width:60px;">100%</td>
                  </tr>
                  <tr style="background:#eef5ff;">
                    <td style="font-size:13px;color:#334155;padding:6px 8px;">? First Deposit</td>
                    <td style="font-size:16px;color:#3b82f6;font-weight:700;text-align:right;padding:6px 8px;">${formatNumber(funnel.deposited)}</td>
                    <td style="font-size:12px;color:#3b82f6;font-weight:600;text-align:right;padding:6px 8px;">${funnel.depositRate.toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#334155;padding:6px 0;">? First Trade (LTD)</td>
                    <td style="font-size:16px;color:#22c55e;font-weight:700;text-align:right;padding:6px 0;">${formatNumber(funnel.firstTrade)}</td>
                    <td style="font-size:12px;color:#22c55e;font-weight:600;text-align:right;padding:6px 0;">${funnel.tradeRate.toFixed(1)}%</td>
                  </tr>
                </table>
              </div>
            `
          })(),
        },
        {
          title: 'Marketing Direction',
          html: renderInsightStrip([
            `Rolling ${listsPayload.days || 30} day window highlights audience quality by brand and profitability posture.`,
            `Prioritize lifecycle campaigns where deposited users are high and in-profit cohorts show repeat trading behavior.`,
            `Weekly registration trend shows last 6 weeks (60 days) � target ${Math.round((calcWeeklyRegistrations(clientDatesMap, 6, 60).reduce((s, w) => s + w.count, 0) / 6) * 1.15)}/week for 15% growth.`,
            `Conversion funnel for last 30 days from Creolabs lifecycle dates � optimize deposit rate to maximize trading activation.`,
          ]),
        },
      ],
    }),
  }

  // -- TRUSTPILOT TEMPLATE --------------------------------------------
  const tp = STATIC_TRUSTPILOT_STATS

  // Compute deposit/wd transaction counts from client-months (already loaded for SALES template)
  const tpPeriodRows = latestMonth?.periodId
    ? allClientMonths.filter((cm) => cm.periodId === latestMonth.periodId)
    : []
  const tpDepositMonthly = tpPeriodRows.filter((cm) => safeNumber(cm.deposit) > 0).length
  const tpWdMonthly = tpPeriodRows.filter((cm) => safeNumber(cm.wd) > 0).length
  const tpDaysInMonth = latestMeta ? new Date(latestMeta.year, latestMeta.month, 0).getDate() : 30
  const tpDepositDaily = tpDaysInMonth > 0 ? Math.round(tpDepositMonthly / tpDaysInMonth) : 0
  const tpWdDaily = tpDaysInMonth > 0 ? Math.round(tpWdMonthly / tpDaysInMonth) : 0

  const trustpilotTemplate = (() => {
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const dataLabel = `snapshot � ${dateStr}`

    const stars = tp.byRating || {}
    const totalRatings = Object.values(stars).reduce((a, b) => a + b, 0)
    const starBar = (n) => {
      const count = stars[n] || 0
      const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
      const starColor = n >= 4 ? '#22c55e' : n === 3 ? '#facc15' : '#f87171'
      const filled = Math.round(pct / 5)
      const bar = `<span style="display:inline-block;width:${Math.max(filled * 6, 2)}px;height:8px;background:${starColor};border-radius:3px;vertical-align:middle;margin:0 6px;"></span>`
      return `<tr>
        <td style="padding:5px 12px;font-size:13px;color:#f1f5f9;white-space:nowrap;">? ${n}</td>
        <td style="padding:5px 4px;">${bar}</td>
        <td style="padding:5px 8px;font-size:12px;color:#94a3b8;">${count} (${pct}%)</td>
      </tr>`
    }

    const ratingTableHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${[5, 4, 3, 2, 1].map(starBar).join('')}
      </table>`

    const scoreCardHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
        <tr>
          <td style="padding:16px 20px;background:#0f172a;border-radius:10px;border:1px solid #1e293b;text-align:center;width:25%;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Trustscore</div>
            <div style="font-size:32px;font-weight:800;color:#22c55e;">${tp.trustScore ?? '�'}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">/ 5.0</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:16px 20px;background:#0f172a;border-radius:10px;border:1px solid #1e293b;text-align:center;width:25%;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Totale Reviews</div>
            <div style="font-size:32px;font-weight:800;color:#f8fafc;">${formatNumber(tp.total)}</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:16px 20px;background:#0f172a;border-radius:10px;border:1px solid #1e293b;text-align:center;width:25%;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Pending</div>
            <div style="font-size:32px;font-weight:800;color:${tp.pending > 0 ? '#fb923c' : '#94a3b8'};">${formatNumber(tp.pending)}</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:16px 20px;background:#0f172a;border-radius:10px;border:1px solid #1e293b;text-align:center;width:25%;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Reclami</div>
            <div style="font-size:32px;font-weight:800;color:${tp.complaints > 0 ? '#f87171' : '#94a3b8'};">${formatNumber(tp.complaints)}</div>
          </td>
        </tr>
      </table>`

    const negatives = tp.negatives || []
    const negativesHtml =
      negatives.length === 0
        ? '<p style="margin:0;color:#4ade80;font-size:14px;">Nessuna review negativa recente � ottimo!</p>'
        : negatives
            .map((r) => {
              const starColor = r.stars <= 1 ? '#f87171' : '#fb923c'
              return `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:14px 16px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:13px;font-weight:700;color:#f1f5f9;">${escapeHtml(r.reviewer)}${r.country ? ` <span style="color:#64748b;font-weight:400;font-size:11px;">(${escapeHtml(r.country)})</span>` : ''}</span>
              <span style="font-size:13px;color:${starColor};font-weight:700;">${'?'.repeat(r.stars)}${'?'.repeat(5 - r.stars)}</span>
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">${escapeHtml(r.date)} � ${escapeHtml(r.issue || r.category || '')}${r.assignedTo ? ` � <em>Assegnato: ${escapeHtml(r.assignedTo)}</em>` : ''} � <strong style="color:${r.status === 'Reviewed' || r.status === 'Replied' ? '#4ade80' : '#fb923c'};">${escapeHtml(r.status || 'Da esaminare')}</strong></div>
            <div style="font-size:13px;color:#cbd5e1;line-height:1.5;">${escapeHtml(r.summary || '')}</div>
            ${r.link ? `<div style="margin-top:6px;"><a href="${escapeHtml(r.link)}" style="font-size:11px;color:#60a5fa;">Apri su Trustpilot ?</a></div>` : ''}
          </div>`
            })
            .join('')

    const statusRows = Object.entries(tp.byStatus || {})
      .sort((a, b) => b[1] - a[1])
      .map(
        ([status, count]) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;font-size:13px;color:#f1f5f9;">${escapeHtml(status)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;font-size:13px;color:#94a3b8;text-align:right;">${formatNumber(count)}</td>
      </tr>`
      )
      .join('')

    const issueRows = Object.entries(tp.byIssue || {})
      .sort((a, b) => b[1] - a[1])
      .map(
        ([issue, count]) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;font-size:13px;color:#f1f5f9;">${escapeHtml(issue)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;font-size:13px;color:#94a3b8;text-align:right;">${formatNumber(count)}</td>
      </tr>`
      )
      .join('')

    const statsTableHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;width:48%;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Per status</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0f172a;border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
              ${statusRows}
            </table>
          </td>
          <td style="width:4%;"></td>
          <td style="vertical-align:top;width:48%;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Per issue type</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0f172a;border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
              ${issueRows}
            </table>
          </td>
        </tr>
      </table>`

    return {
      key: 'trustpilot',
      label: 'TRUSTPILOT',
      subject: `TRUSTPILOT | Review Digest | ${dateStr}`,
      html: buildMailHtml({
        title: 'Trustpilot Review Digest',
        subtitle: dataLabel,
        intro: `Recensioni Bullwaves su Trustpilot � ${formatNumber(tp.total)} review totali, Trustscore ${tp.trustScore ?? '�'}/5.`,
        sections: [
          {
            title: 'Score Overview',
            html: scoreCardHtml + ratingTableHtml,
          },
          {
            title: 'Status & Issue Breakdown',
            html: statsTableHtml,
          },
          {
            title: `Ultime Review Negative (1�2 ?) � ${negatives.length} mostrate`,
            html: negativesHtml,
          },
          {
            title: `Richieste Review � Transazioni ${latestMonth?.periodId || ''}`,
            html: (() => {
              const depositMonthly = tpDepositMonthly
              const wdMonthly = tpWdMonthly
              const depositDaily = tpDepositDaily
              const wdDaily = tpWdDaily
              const totalMonthly = depositMonthly + wdMonthly
              const cardStyle = `padding:16px 20px;background:#0f172a;border-radius:10px;border:1px solid #1e293b;text-align:center;`
              const labelStyle = `font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;`
              const valStyle = (color) => `font-size:28px;font-weight:800;color:${color};`
              const subStyle = `font-size:11px;color:#94a3b8;margin-top:4px;`
              const noData = tpPeriodRows.length === 0
              if (noData)
                return `<p style="margin:0;color:#64748b;font-size:14px;">Dati client-months non disponibili per ${latestMonth?.periodId || 'questo periodo'}.</p>`
              return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:14px;">
                <tr>
                  <td style="${cardStyle}">
                    <div style="${labelStyle}">Depositi / mese</div>
                    <div style="${valStyle('#93c5fd')}">${formatNumber(depositMonthly)}</div>
                    <div style="${subStyle}">clienti con deposito</div>
                  </td>
                  <td style="width:10px;"></td>
                  <td style="${cardStyle}">
                    <div style="${labelStyle}">Prelievi / mese</div>
                    <div style="${valStyle('#fda4af')}">${formatNumber(wdMonthly)}</div>
                    <div style="${subStyle}">clienti con prelievo</div>
                  </td>
                  <td style="width:10px;"></td>
                  <td style="${cardStyle}">
                    <div style="${labelStyle}">Depositi / giorno</div>
                    <div style="${valStyle('#86efac')}">${formatNumber(depositDaily)}</div>
                    <div style="${subStyle}">media su ${tpDaysInMonth}gg</div>
                  </td>
                  <td style="width:10px;"></td>
                  <td style="${cardStyle}">
                    <div style="${labelStyle}">Prelievi / giorno</div>
                    <div style="${valStyle('#fbbf24')}">${formatNumber(wdDaily)}</div>
                    <div style="${subStyle}">media su ${tpDaysInMonth}gg</div>
                  </td>
                  <td style="width:10px;"></td>
                  <td style="${cardStyle}">
                    <div style="${labelStyle}">Tot. op. / mese</div>
                    <div style="${valStyle('#e2e8f0')}">${formatNumber(totalMonthly)}</div>
                    <div style="${subStyle}">potenziali richieste review</div>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#64748b;">Fonte: CREOLABS Qlik client-months � ${latestMonth?.periodId}. Ogni cliente con deposito o prelievo riceve una richiesta di recensione.</p>`
            })(),
          },
          {
            title: 'Note Operative',
            html: renderInsightStrip([
              `${formatNumber(tp.pending)} review in attesa di risposta � priorit�: Withdrawal (${formatNumber((tp.byIssue || {})['Withdrawal'] || 0)}) e Trading (${formatNumber((tp.byIssue || {})['Trading'] || 0)}).`,
              `${Math.round(((tp.positive || 0) / Math.max(tp.total, 1)) * 100)}% delle review sono positive � il brand score pu� essere migliorato rispondendo attivamente alle negative pending.`,
              tp.escalated > 0
                ? `?? ${formatNumber(tp.escalated)} review escalated � richiedono attenzione immediata.`
                : 'Nessuna review in stato escalated al momento.',
            ]),
          },
        ],
      }),
    }
  })()

  // -- RETENTION TEMPLATE --------------------------------------------
  // Retention stats for current month only
  const retentionStats = calcRetentionStats(
    allClientMonths,
    clientDatesMap,
    null,
    latestMonth?.periodId
  )

  function calcActiveVsDormant(clientDatesMap, thresholdDays = 30) {
    const now = new Date()
    const active = []
    const dormant = []

    if (!clientDatesMap || clientDatesMap.size === 0) {
      return { active, dormant, activeCount: 0, dormantCount: 0 }
    }

    for (const [clientId, dates] of clientDatesMap.entries()) {
      const daysSinceLTT = calcDaysSince(dates.lttDate, now)
      if (daysSinceLTT === null) continue

      if (daysSinceLTT <= thresholdDays) {
        active.push({ clientId, daysSinceLTT, ...dates })
      } else {
        dormant.push({ clientId, daysSinceLTT, ...dates })
      }
    }

    return {
      active,
      dormant,
      activeCount: active.length,
      dormantCount: dormant.length,
    }
  }

  function calcAtRiskClients(clientMonths, clientDatesMap, thresholdDays = 30, periodId = null) {
    const now = new Date()
    const atRisk = []
    const processed = new Set()

    const filteredMonths = periodId
      ? filterClientMonthsByPeriod(clientMonths, periodId)
      : clientMonths

    for (const cm of filteredMonths) {
      const clientId = String(cm.clientId || '')
      if (!clientId || processed.has(clientId)) continue

      const dates = clientDatesMap?.get(clientId)
      if (!dates) continue

      // Has deposit but no recent trade
      const hasDeposit = safeNumber(cm.deposit) > 0
      const daysSinceLTT = calcDaysSince(dates.lttDate, now)

      if (hasDeposit && (daysSinceLTT === null || daysSinceLTT > thresholdDays)) {
        atRisk.push({
          clientId,
          clientName: cm.clientName || clientId,
          brand: cm.brand,
          deposit: safeNumber(cm.deposit),
          daysSinceLTT: daysSinceLTT || 999,
          status: dates.status,
        })
        processed.add(clientId)
      }
    }

    return atRisk.sort((a, b) => b.deposit - a.deposit).slice(0, 20)
  }

  const activeVsDormant = calcActiveVsDormant(clientDatesMap, 30)
  // At-risk clients scoped to current month
  const atRiskClients = calcAtRiskClients(
    allClientMonths,
    clientDatesMap,
    30,
    latestMonth?.periodId
  )

  const retentionTemplate = {
    key: 'retention',
    label: 'RETENTION',
    subject: `RETENTION | Lifecycle Intelligence | ${periodLabel}`,
    html: buildMailHtml({
      title: 'RETENTION Lifecycle Intelligence',
      subtitle: periodLabel,
      intro:
        'Client retention and lifecycle analysis powered by Creolabs registration, deposit, and trading dates.',
      sections: [
        {
          title: 'Retention Overview',
          html: (() => {
            const cardStyle = `padding:18px 20px;background:#0f172a;border-radius:12px;border:1px solid #1e293b;text-align:center;`
            const labelStyle = `font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;`
            const valStyle = (color) =>
              `font-size:32px;font-weight:800;color:${color};line-height:1;`
            const subStyle = `font-size:12px;color:#94a3b8;margin-top:6px;`
            const periodLabel = latestMonth?.periodId || 'current period'

            return `
              <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;text-align:center;">Dati riferiti al periodo <strong style="color:#0f172a;">${periodLabel}</strong></p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
                <tr>
                  <td style="${cardStyle}">
                    <div style="${labelStyle}">Total Clients</div>
                    <div style="${valStyle('#e2e8f0')}">${formatNumber(retentionStats.totalClients)}</div>
                    <div style="${subStyle}">unique client IDs</div>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="${cardStyle}">
                    <div style="${labelStyle}">RDP Rate</div>
                    <div style="${valStyle('#86efac')}">${retentionStats.rdpRate.toFixed(1)}%</div>
                    <div style="${subStyle}">${formatNumber(retentionStats.withRDP)} clients with RDP</div>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="${cardStyle}">
                    <div style="${labelStyle}">LTD Rate</div>
                    <div style="${valStyle('#3b82f6')}">${retentionStats.ltdRate.toFixed(1)}%</div>
                    <div style="${subStyle}">${formatNumber(retentionStats.withLTD)} had first trade</div>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="${cardStyle}">
                    <div style="${labelStyle}">LTT Rate</div>
                    <div style="${valStyle('#fbbf24')}">${retentionStats.lttRate.toFixed(1)}%</div>
                    <div style="${subStyle}">${formatNumber(retentionStats.withLTT)} recent trade</div>
                  </td>
                </tr>
              </table>
            `
          })(),
        },
        {
          title: 'Active vs Dormant (Last Trade < 30 days)',
          html: (() => {
            const activeRate =
              activeVsDormant.activeCount + activeVsDormant.dormantCount > 0
                ? (activeVsDormant.activeCount /
                    (activeVsDormant.activeCount + activeVsDormant.dormantCount)) *
                  100
                : 0
            const dormantRate = 100 - activeRate

            return `
              <div style="padding:20px;background:#f8fbff;border:1px solid #dbe5f4;border-radius:10px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="width:50%;padding-right:8px;">
                      <div style="padding:16px;background:#dcfce7;border:2px solid #22c55e;border-radius:8px;text-align:center;">
                        <div style="font-size:12px;color:#166534;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Active Traders</div>
                        <div style="font-size:36px;font-weight:800;color:#15803d;line-height:1;">${formatNumber(activeVsDormant.activeCount)}</div>
                        <div style="font-size:13px;color:#166534;margin-top:6px;">${activeRate.toFixed(1)}% of total</div>
                      </div>
                    </td>
                    <td style="width:50%;padding-left:8px;">
                      <div style="padding:16px;background:#fee2e2;border:2px solid #f87171;border-radius:8px;text-align:center;">
                        <div style="font-size:12px;color:#991b1b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Dormant (30+ days)</div>
                        <div style="font-size:36px;font-weight:800;color:#dc2626;line-height:1;">${formatNumber(activeVsDormant.dormantCount)}</div>
                        <div style="font-size:13px;color:#991b1b;margin-top:6px;">${dormantRate.toFixed(1)}% needs reactivation</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            `
          })(),
        },
        {
          title: 'At-Risk Clients (Top 20 by Deposit)',
          html: (() => {
            const periodLabel = latestMonth?.periodId || 'current period'
            if (atRiskClients.length === 0) {
              return `<p style="margin:0;color:#64748b;font-size:14px;">No at-risk clients identified for ${periodLabel} (all depositors traded recently).</p>`
            }

            const rows = atRiskClients
              .slice(0, 20)
              .map((client, i) => {
                const bg = i % 2 === 0 ? '#ffffff' : '#f8fbff'
                const daysSince =
                  client.daysSinceLTT < 999 ? `${client.daysSinceLTT}d ago` : 'never'
                return `
                <tr>
                  <td style="padding:10px 12px;background:${bg};border-bottom:1px solid #e7eefb;font-size:13px;color:#0f172a;font-weight:600;">${escapeHtml(client.clientName)}</td>
                  <td style="padding:10px 12px;background:${bg};border-bottom:1px solid #e7eefb;font-size:12px;color:#64748b;">${escapeHtml(client.brand)}</td>
                  <td style="padding:10px 12px;background:${bg};border-bottom:1px solid #e7eefb;font-size:13px;color:#3b82f6;text-align:right;font-weight:600;">${formatK(client.deposit)}</td>
                  <td style="padding:10px 12px;background:${bg};border-bottom:1px solid #e7eefb;font-size:12px;color:#f87171;text-align:right;">${daysSince}</td>
                  <td style="padding:10px 12px;background:${bg};border-bottom:1px solid #e7eefb;font-size:11px;color:#64748b;text-align:center;">${escapeHtml(client.status || '�')}</td>
                </tr>
              `
              })
              .join('')

            return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #dbe5f4;border-radius:10px;overflow:hidden;">
                <tr>
                  <th style="padding:10px 12px;background:#1e293b;color:#93c5fd;font-size:11px;text-transform:uppercase;letter-spacing:.06em;text-align:left;">Client</th>
                  <th style="padding:10px 12px;background:#1e293b;color:#93c5fd;font-size:11px;text-transform:uppercase;letter-spacing:.06em;text-align:left;">Brand</th>
                  <th style="padding:10px 12px;background:#1e293b;color:#93c5fd;font-size:11px;text-transform:uppercase;letter-spacing:.06em;text-align:right;">Deposit</th>
                  <th style="padding:10px 12px;background:#1e293b;color:#93c5fd;font-size:11px;text-transform:uppercase;letter-spacing:.06em;text-align:right;">Last Trade</th>
                  <th style="padding:10px 12px;background:#1e293b;color:#93c5fd;font-size:11px;text-transform:uppercase;letter-spacing:.06em;text-align:center;">Status</th>
                </tr>
                ${rows}
              </table>
            `
          })(),
        },
        {
          title: 'Retention Action Plan',
          html: renderInsightStrip([
            `${activeVsDormant.dormantCount} dormant clients (no trade in 30+ days) � prioritize reactivation campaigns.`,
            `${atRiskClients.length} high-value clients deposited but not trading � consider personalized outreach.`,
            `Active trader retention: ${retentionStats.lttRate.toFixed(1)}% of clients traded recently � benchmark for growth.`,
            `Avg time to first trade: ${calcAvgDaysToLTD(allClientMonths, clientDatesMap) || 'N/A'} days � optimize onboarding to reduce friction.`,
            `Data sourced from Creolabs lifecycle dates (clientTimestamp, LTD, LTT) + client-months trading activity.`,
          ]),
        },
      ],
    }),
  }

  // --------------------------------------------------------------------------
  // CLUSTER ANALYSIS REPORT � ML-powered lifetime & behavioral segmentation
  // --------------------------------------------------------------------------
  const clusterTemplate = buildClusterTemplate(
    allClientMonths,
    clientDatesMap,
    kpis,
    clusterData,
    clusterDataError,
    loadingClusterData
  )

  const boardWeeklyTemplate = buildBoardWeeklyTemplate(
    boardSnapshot,
    null,
    data?.clientDates,
    allClientMonths,
    clientDatesMap
  )

  return [
    boardTemplate,
    pulseTemplate,
    salesTemplate,
    marketingTemplate,
    trustpilotTemplate,
    retentionTemplate,
    clusterTemplate,
    boardWeeklyTemplate,
  ]
}

export default function BoardReportMailStudioPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTemplateKey, setActiveTemplateKey] = useState('board')
  const [data, setData] = useState(null)
  const [affiliatePaymentsMap, setAffiliatePaymentsMap] = useState(null)
  const [showHtmlSource, setShowHtmlSource] = useState(false)
  const activeContacts = TEMPLATE_CONTACTS[activeTemplateKey] || BOARD_CONTACTS

  const [selectedContacts, setSelectedContacts] = useState(
    () => new Set((TEMPLATE_CONTACTS[activeTemplateKey] || BOARD_CONTACTS).map((c) => c.id))
  )

  // Reset selection to all when template tab changes
  useEffect(() => {
    setSelectedContacts(new Set(activeContacts.map((c) => c.id)))
  }, [activeTemplateKey])
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')

  const [loadingClientDates, setLoadingClientDates] = useState(false)
  // Live data for the new "Board Weekly Report" template  sourced from the
  // already-validated /api/qlik/creolabs/reports/board-snapshot endpoint.
  // No KPI re-computation here: this page reuses the validated data contract.
  const [boardSnapshot, setBoardSnapshot] = useState(null)
  const [loadingBoardSnapshot, setLoadingBoardSnapshot] = useState(false)

  // ML Cluster Analysis data
  const [clusterData, setClusterData] = useState(null)
  const [loadingClusterData, setLoadingClusterData] = useState(false)
  const [clusterDataError, setClusterDataError] = useState(null)

  // Week 2 Phase 1: Orchestrated Weekly Executive data
  const [weeklyExecutive, setWeeklyExecutive] = useState(null)
  const [loadingWeeklyExecutive, setLoadingWeeklyExecutive] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Load only essential data at startup (skip heavy client-dates)
      const [kpis, analytics, clientLists, clientMonths] = await Promise.all([
        loadCreolabsQlikKpis(),
        loadCreolabsQlikAnalytics({ top: 12 }),
        loadCreolabsQlikClientLists({ days: 30 }),
        loadCreolabsQlikClientMonths(),
      ])

      setData({
        kpis,
        analytics,
        clientLists,
        clientMonths,
        clientDates: null, // Lazy loaded when needed
        fetchedAt: new Date().toISOString(),
      })
    } catch (err) {
      setError(String(err?.message || 'Failed to load board report data'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Lazy load client-dates only when needed (SALES, MARKETING, RETENTION templates)
  const ensureClientDatesLoaded = useCallback(async () => {
    if (data?.clientDates) return // Already loaded
    if (loadingClientDates) return // Already loading

    setLoadingClientDates(true)
    try {
      const clientDates = await loadCreolabsQlikClientDates()
      setData((prev) => ({ ...prev, clientDates }))
    } catch (err) {
      console.error('[BoardReportMailStudio] Failed to load client-dates:', err)
      // Don't fail entirely, just log and continue with empty data
    } finally {
      setLoadingClientDates(false)
    }
  }, [data?.clientDates, loadingClientDates])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Load affiliate payments data
  useEffect(() => {
    buildAffiliatePaymentsMap().then(setAffiliatePaymentsMap).catch(console.error)
  }, [])

  // Auto-load client-dates when switching to templates that need it
  useEffect(() => {
    const needsClientDates = ['board', 'pulse', 'board-weekly'].includes(activeTemplateKey)
    if (needsClientDates && data && !data.clientDates && !loadingClientDates) {
      ensureClientDatesLoaded()
    }
  }, [activeTemplateKey, data, loadingClientDates, ensureClientDatesLoaded])

  // PHASE 1 FIX: Parallel fetch for board-weekly template (board-snapshot + weekly-executive)
  // Optimized lazy-load pattern: fetches both resources in parallel using Promise.all()
  // to eliminate sequential fetch delays and improve perceived performance.
  useEffect(() => {
    if (activeTemplateKey !== 'board-weekly') return

    // Determine what needs to be fetched
    const needsBoardSnapshot = !boardSnapshot && !loadingBoardSnapshot
    const needsWeeklyExecutive = !weeklyExecutive && !loadingWeeklyExecutive

    if (!needsBoardSnapshot && !needsWeeklyExecutive) return // Nothing to fetch

    console.log('[BOARD-WEEKLY] Parallel fetch:', { needsBoardSnapshot, needsWeeklyExecutive })

    // Create fetch promises array
    const fetches = []

    if (needsBoardSnapshot) {
      setLoadingBoardSnapshot(true)
      fetches.push(
        fetch('/api/qlik/creolabs/reports/board-snapshot?brandScope=combined', { cache: 'default' })
          .then((res) => res.json())
          .then((payload) => {
            if (payload?.ok) {
              setBoardSnapshot(payload)
              console.log('[BOARD-WEEKLY] Board snapshot loaded')
            } else {
              console.error('[BOARD-WEEKLY] board-snapshot payload not ok:', payload)
            }
          })
          .catch((err) => console.error('[BOARD-WEEKLY] failed to load board-snapshot:', err))
          .finally(() => setLoadingBoardSnapshot(false))
      )
    }

    if (needsWeeklyExecutive) {
      setLoadingWeeklyExecutive(true)
      fetches.push(
        fetch('/api/qlik/creolabs/reports/weekly-executive', { cache: 'default' })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
          })
          .then((payload) => {
            console.log('[BOARD-WEEKLY] Weekly Executive orchestrated data loaded:', {
              hasSnapshot: !!payload?.executiveSnapshot,
              hasAlerts: !!payload?.attentionRequired,
              hasActions: !!payload?.recommendedActions,
              hasHealth: !!payload?.businessHealth,
              hasSignals: !!payload?.intelligenceSignals,
            })
            setWeeklyExecutive(payload)
          })
          .catch((err) => {
            console.warn(
              '[BOARD-WEEKLY] Failed to load orchestrated data (falling back to legacy):',
              err
            )
            setWeeklyExecutive(null) // Fallback: template will use legacy rendering
          })
          .finally(() => setLoadingWeeklyExecutive(false))
      )
    }

    // Execute fetches in parallel (if multiple needed)
    if (fetches.length > 0) {
      Promise.all(fetches).then(() => {
        console.log('[BOARD-WEEKLY] Parallel fetch complete')
      })
    }
  }, [
    activeTemplateKey,
    boardSnapshot,
    loadingBoardSnapshot,
    weeklyExecutive,
    loadingWeeklyExecutive,
  ])

  // Lazy-load ML Cluster Analysis data only when cluster template is active
  useEffect(() => {
    if (activeTemplateKey !== 'cluster') return
    if (clusterData || loadingClusterData || clusterDataError) return

    console.log('[CLUSTER FETCH] Starting fetch...')
    setLoadingClusterData(true)
    setClusterDataError(null)

    fetch('/api/qlik/creolabs/lifetime-clusters', { cache: 'default' })
      .then((res) => {
        console.log('[CLUSTER FETCH] Response status:', res.status, res.ok)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((payload) => {
        console.log('[CLUSTER FETCH] Payload received:', {
          hasPayload: !!payload,
          hasClients: !!payload?.clients,
          clientsLength: payload?.clients?.length,
          hasClusters: !!payload?.clusters,
          clustersLength: payload?.clusters?.length,
          payloadKeys: payload ? Object.keys(payload) : [],
        })

        if (payload?.clients && payload?.clusters) {
          console.log('[CLUSTER FETCH] ? Setting clusterData')
          setClusterData(payload)
          setClusterDataError(null)
        } else {
          const errorMsg = 'Invalid data structure from ML endpoint'
          console.error('[CLUSTER FETCH] ? Validation failed - payload structure:', payload)
          setClusterDataError(errorMsg)
        }
      })
      .catch((err) => {
        console.error('[CLUSTER FETCH] ? Fetch error:', err)
        setClusterDataError(`Failed to load ML data: ${err.message}`)
      })
      .finally(() => {
        console.log('[CLUSTER FETCH] Completed, setting loading=false')
        setLoadingClusterData(false)
      })
  }, [activeTemplateKey, clusterData, loadingClusterData, clusterDataError])

  const templates = useMemo(() => {
    const result = []

    // Build standard templates (board, pulse, sales, etc.) if data is available
    if (data) {
      const standardTemplates = buildTemplates(
        data,
        affiliatePaymentsMap,
        boardSnapshot,
        clusterData,
        clusterDataError,
        loadingClusterData
      )
      // Filter out board-weekly from standard templates (it's handled separately)
      result.push(
        ...standardTemplates.filter(
          (t) => !['sales', 'marketing', 'retention', 'cluster', 'board-weekly'].includes(t.key)
        )
      )
    }

    // Build board-weekly template independently if boardSnapshot is available
    if (boardSnapshot) {
      const allClientMonths = data?.clientMonths?.data?.clientMonths || []
      const clientDatesMap = data?.clientDates ? buildClientDatesMap(data.clientDates) : null
      result.push(
        buildBoardWeeklyTemplate(
          boardSnapshot,
          weeklyExecutive,
          data?.clientDates,
          allClientMonths,
          clientDatesMap
        )
      )
    }

    return result
  }, [
    data,
    affiliatePaymentsMap,
    boardSnapshot,
    clusterData,
    clusterDataError,
    loadingClusterData,
    weeklyExecutive,
  ])

  const activeTemplate = useMemo(
    () => templates.find((t) => t.key === activeTemplateKey) || templates[0] || null,
    [templates, activeTemplateKey]
  )

  const toggleContact = useCallback((id) => {
    setSelectedContacts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSendTest = useCallback(async () => {
    if (!activeTemplate) return
    const recipients = activeContacts.filter((c) => selectedContacts.has(c.id))
    if (recipients.length === 0) {
      setSendResult('Select at least one recipient.')
      return
    }

    setSending(true)
    setSendResult('')

    const viewerEmail = String(user?.email || '').trim()
    const results = []

    for (const contact of recipients) {
      try {
        const response = await fetch('/api/email/send-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-bullwaves-user-email': viewerEmail,
          },
          body: JSON.stringify({
            to: contact.email,
            subject: activeTemplate.subject,
            html: activeTemplate.html,
            text: htmlToText(activeTemplate.html),
            viewerEmail,
          }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload?.ok) {
          results.push(`\u2717 ${contact.name}: ${payload?.error || response.status}`)
        } else {
          results.push(`\u2713 ${contact.name}`)
        }
      } catch (err) {
        results.push(`\u2717 ${contact.name}: ${err?.message || 'error'}`)
      }
    }

    setSendResult(results.join(' | '))
    setSending(false)
  }, [activeTemplate, activeContacts, selectedContacts, user?.email])

  const handleOpenFullPreview = useCallback(() => {
    if (!activeTemplate?.html || typeof window === 'undefined') return
    const blob = new Blob([activeTemplate.html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 15000)
  }, [activeTemplate])

  return (
    <section style={{ padding: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#f8fafc' }}>Board Report Mail Studio</h1>
          <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 14 }}>
            HTML templates generated from live CREOLABS data only.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={{
            border: '1px solid #334155',
            background: '#0f172a',
            color: '#e2e8f0',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh real data'}
        </button>
      </div>

      {error ? (
        <div
          style={{
            border: '1px solid #7f1d1d',
            background: '#450a0a',
            color: '#fecaca',
            borderRadius: 8,
            padding: 10,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ marginBottom: 12, color: '#94a3b8', fontSize: 12 }}>
        Fetched at: {data?.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : '-'}
        {loadingClientDates && (
          <span style={{ marginLeft: 12, color: '#fbbf24' }}>
            {'\u23F3'} Loading lifecycle dates (heavy dataset)...
          </span>
        )}
        {!loadingClientDates && data?.clientDates && (
          <span style={{ marginLeft: 12, color: '#86efac' }}>
            {'\u2713'} Lifecycle dates loaded
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {TEMPLATE_KEYS.map((key) => {
          const selected = key === (activeTemplate?.key || activeTemplateKey)
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTemplateKey(key)}
              style={{
                border: selected ? '1px solid #22d3ee' : '1px solid #334155',
                background: selected ? '#083344' : '#0f172a',
                color: selected ? '#67e8f9' : '#e2e8f0',
                borderRadius: 999,
                padding: '7px 12px',
                fontSize: 12,
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              {key.toUpperCase()}
            </button>
          )
        })}
      </div>

      {!activeTemplate ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#94a3b8',
            padding: '24px 0',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" stroke="#334155" strokeWidth="3" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="#60a5fa"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </svg>
          <span style={{ fontSize: 14 }}>
            Caricamento dati in corso, attendere qualche secondo�
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              border: '1px solid #1e293b',
              borderRadius: 10,
              background: '#0b1220',
              padding: 12,
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 12 }}>Subject</div>
            <div style={{ color: '#f8fafc', marginTop: 4 }}>{activeTemplate.subject}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
            <div
              style={{
                border: '1px solid #1e293b',
                borderRadius: 10,
                background: '#0b1220',
                padding: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: 12 }}>HTML Preview</div>
                <button
                  type="button"
                  onClick={handleOpenFullPreview}
                  style={{
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#cbd5e1',
                    borderRadius: 6,
                    padding: '5px 9px',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Open Full Preview
                </button>
              </div>
              {['board', 'pulse'].includes(activeTemplateKey) && !data?.clientDates && (
                <div
                  style={{
                    border: '1px solid #854d0e',
                    background: '#422006',
                    color: '#fef08a',
                    borderRadius: 6,
                    padding: 8,
                    marginBottom: 8,
                    fontSize: 12,
                  }}
                >
                  ?? Lifecycle dates not loaded yet - some metrics may show zero.{' '}
                  {loadingClientDates
                    ? 'Loading now...'
                    : 'Switch to this template to trigger load.'}
                </div>
              )}
              <iframe
                title={`${activeTemplate.label} html preview`}
                srcDoc={activeTemplate.html}
                style={{
                  width: '100%',
                  height: 420,
                  border: '1px solid #334155',
                  borderRadius: 8,
                  background: '#fff',
                }}
              />
            </div>

            <div
              style={{
                border: '1px solid #1e293b',
                borderRadius: 10,
                background: '#0b1220',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
                SendGrid � Recipients
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginBottom: 10,
                  flex: 1,
                  alignContent: 'flex-start',
                }}
              >
                {activeContacts.map((contact) => {
                  const checked = selectedContacts.has(contact.id)
                  return (
                    <label
                      key={contact.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 10px',
                        border: checked ? '1px solid #0e7490' : '1px solid #334155',
                        background: checked ? '#083344' : '#0f172a',
                        borderRadius: 999,
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontSize: 13,
                        color: checked ? '#67e8f9' : '#cbd5e1',
                        height: 'fit-content',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleContact(contact.id)}
                        style={{ accentColor: '#22d3ee', cursor: 'pointer' }}
                      />
                      <span>{contact.name}</span>
                      <span style={{ fontSize: 11, opacity: 0.65 }}>{contact.role}</span>
                    </label>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={sending || !activeTemplate || selectedContacts.size === 0}
                style={{
                  border: '1px solid #0e7490',
                  background: '#083344',
                  color: '#67e8f9',
                  borderRadius: 8,
                  padding: '8px 14px',
                  cursor: sending || selectedContacts.size === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedContacts.size === 0 ? 0.5 : 1,
                  marginTop: 'auto',
                }}
              >
                {sending
                  ? 'Sending...'
                  : `Send ${activeTemplate?.label || ''} to ${selectedContacts.size} recipient${selectedContacts.size !== 1 ? 's' : ''}`}
              </button>
              {sendResult ? (
                <div style={{ marginTop: 10, color: '#cbd5e1', fontSize: 13 }}>{sendResult}</div>
              ) : null}
            </div>
          </div>

          <div
            style={{
              border: '1px solid #1e293b',
              borderRadius: 10,
              background: '#0b1220',
              padding: 12,
            }}
          >
            <button
              type="button"
              onClick={() => setShowHtmlSource(!showHtmlSource)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
                padding: 0,
                marginBottom: showHtmlSource ? 8 : 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: showHtmlSource ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>HTML Source {showHtmlSource ? '(nascondere)' : '(mostrare)'}</span>
            </button>
            {showHtmlSource && (
              <textarea
                readOnly
                value={activeTemplate.html}
                style={{
                  width: '100%',
                  minHeight: 180,
                  resize: 'vertical',
                  border: '1px solid #334155',
                  background: '#020617',
                  color: '#cbd5e1',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  fontFamily: 'Consolas, Menlo, Monaco, monospace',
                }}
              />
            )}
          </div>
        </div>
      )}
    </section>
  )
}
