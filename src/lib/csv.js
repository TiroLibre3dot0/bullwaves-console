import { cleanNumber } from './formatters'

export function splitCsvLine(line = '') {
  const out = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      out.push(current)
      current = ''
    } else {
      current += c
    }
  }
  out.push(current)
  return out
}

export function parseCsv(text = '') {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (!lines.length) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/(^"|"$)/g, ''))
  const rows = []
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? ''
    })
    rows.push(row)
  }
  return rows
}

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const monthNamesLong = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

function monthIndexFromName(rawName) {
  const s = String(rawName || '')
    .trim()
    .toLowerCase()
  if (!s) return -1
  const abbr = s.slice(0, 3)
  const abbrIdx = monthNames.map((m) => m.toLowerCase()).indexOf(abbr)
  if (abbrIdx >= 0) return abbrIdx
  const longIdx = monthNamesLong.indexOf(s)
  if (longIdx >= 0) return longIdx
  return -1
}

export function parseMonthLabel(raw) {
  if (!raw) return { label: 'Unknown', monthIndex: -1, year: '—', key: 'unknown' }

  const s = String(raw).trim()
  if (!s) return { label: 'Unknown', monthIndex: -1, year: '—', key: 'unknown' }

  // Try ISO-like dates: 2025-01-31, 2025/01/31, etc.
  const isoMatch = s.match(/^\s*(\d{4})[\/-](\d{1,2})(?:[\/-](\d{1,2}))?\s*$/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const monthIndex = Math.max(0, (Number(isoMatch[2]) || 1) - 1)
    if (Number.isFinite(year)) {
      return {
        label: `${monthNames[monthIndex]} ${year}`,
        monthIndex,
        year,
        key: `${year}-${String(monthIndex).padStart(2, '0')}`,
      }
    }
  }

  // Month-first: 01/2025, 1-2025
  const monthFirst = s.match(/^\s*(\d{1,2})[\/-](\d{4})\s*$/)
  if (monthFirst) {
    const monthIndex = Math.max(0, (Number(monthFirst[1]) || 1) - 1)
    const year = Number(monthFirst[2])
    if (Number.isFinite(year)) {
      return {
        label: `${monthNames[monthIndex]} ${year}`,
        monthIndex,
        year,
        key: `${year}-${String(monthIndex).padStart(2, '0')}`,
      }
    }
  }

  // Year-first: 2025-01, 2025/1
  const yearFirst = s.match(/^\s*(\d{4})[\/-](\d{1,2})\s*$/)
  if (yearFirst) {
    const year = Number(yearFirst[1])
    const monthIndex = Math.max(0, (Number(yearFirst[2]) || 1) - 1)
    if (Number.isFinite(year)) {
      return {
        label: `${monthNames[monthIndex]} ${year}`,
        monthIndex,
        year,
        key: `${year}-${String(monthIndex).padStart(2, '0')}`,
      }
    }
  }

  // Name formats: Jan 2025, January 2025
  const nameFirst = s.match(/^\s*([A-Za-z]+)\s+(\d{4})\s*$/)
  if (nameFirst) {
    const monthIndex = monthIndexFromName(nameFirst[1])
    const year = Number(nameFirst[2])
    if (monthIndex >= 0 && Number.isFinite(year)) {
      return {
        label: `${monthNames[monthIndex]} ${year}`,
        monthIndex,
        year,
        key: `${year}-${String(monthIndex).padStart(2, '0')}`,
      }
    }
  }

  // Try parsing as Date as a last resort.
  const dt = new Date(s)
  if (!Number.isNaN(dt.getTime())) {
    const monthIndex = dt.getMonth()
    const year = dt.getFullYear()
    return {
      label: `${monthNames[monthIndex]} ${year}`,
      monthIndex,
      year,
      key: `${year}-${String(monthIndex).padStart(2, '0')}`,
    }
  }

  return { label: 'Unknown', monthIndex: -1, year: '—', key: 'unknown' }
}

export function parseMonthFirstDate(raw) {
  if (!raw) return null
  const parts = raw.split('/').map((p) => Number(p))
  if (parts.length < 3) return null
  const [m, d, y] = parts
  const date = new Date(y, (m || 1) - 1, d || 1)
  return Number.isNaN(date.getTime()) ? null : date
}

export function monthMetaFromDate(date) {
  if (!date || Number.isNaN(date.getTime()))
    return { label: 'Unknown', monthIndex: -1, year: '—', key: 'unknown' }
  const monthIndex = date.getMonth()
  const year = date.getFullYear()
  return {
    label: `${monthNames[monthIndex]} ${year}`,
    monthIndex,
    year,
    key: `${year}-${String(monthIndex).padStart(2, '0')}`,
  }
}

export function safeCleanNumber(value) {
  return cleanNumber(value)
}

export default {
  splitCsvLine,
  parseCsv,
  parseMonthLabel,
  parseMonthFirstDate,
  monthMetaFromDate,
  safeCleanNumber,
}
