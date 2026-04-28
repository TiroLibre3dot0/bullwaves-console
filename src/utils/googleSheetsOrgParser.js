/**
 * Parse Google Sheets CSV export → org chart sections format
 * Source: https://docs.google.com/spreadsheets/d/1UXKOLw0o9gQvTYoWr0BlPzxguMTiC4YEqFuXhZc9Kk4/export?format=csv&gid=0
 */

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1UXKOLw0o9gQvTYoWr0BlPzxguMTiC4YEqFuXhZc9Kk4/export?format=csv&gid=0'

// Map Division → org chart area
const DIVISION_TO_AREA = {
  Operations: 'operations-area',
  Revenue: 'revenue-area',
  'Trading & Risk': 'trading-risk',
  Corporate: 'corporate-area',
}

// Map Department → org chart area (more specific)
const DEPARTMENT_TO_AREA = {
  'Business Operations': 'operations-area',
  'Customer Support': 'customer-support-area',
  Sales: 'revenue-area',
  'MENA - BW Prime': 'revenue-area',
  'Affiliates & IBs': 'affiliates-area',
  'Marketing & Branding': 'marketing-area',
  'HR & Talent Acquisition': 'hr-area',
  Finance: 'finance-area',
  Banking: 'finance-area',
  Compliance: 'compliance-area',
  'Risk Management': 'trading-risk',
  'MT5 Operations': 'trading-risk',
  Dealing: 'trading-risk',
  'Prop Trading': 'trading-risk',
  'Tech Operations': 'operations-area',
  Reputation: 'marketing-area',
}

function parseCSV(raw) {
  const lines = String(raw || '')
    .split('\n')
    .filter((l) => l.trim())
  if (!lines.length) return []

  const header = lines[0].split(',').map((h) => h.trim())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const values = line.split(',').map((v) => v.trim())
    const row = {}
    header.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row)
  }

  return rows
}

function getAreaForPerson(person) {
  const dept = (person['Department'] || '').trim()
  if (DEPARTMENT_TO_AREA[dept]) return DEPARTMENT_TO_AREA[dept]

  const div = (person['Division'] || '').trim()
  if (DIVISION_TO_AREA[div]) return DIVISION_TO_AREA[div]

  return 'operations-area' // default
}

function buildSectionMap(rows) {
  const map = {}

  rows.forEach((row) => {
    if (!row['Employee Name'] || !row['Employee Name'].trim()) return

    const area = getAreaForPerson(row)
    if (!map[area]) {
      map[area] = []
    }

    map[area].push({
      name: row['Employee Name'].replace(/^\*+/, '').trim(),
      title: row['Job Ttle'] || row['Job Title'] || '',
      division: row['Division'] || '',
      department: row['Department'] || '',
      region: '—',
      email: '',
      focus: row['Department'] || '',
      duties: `${row['Sub Division'] || ''} - ${row['Department'] || ''}`.trim(),
    })
  })

  return map
}

export async function fetchOrgChartFromGoogleSheets() {
  try {
    const res = await fetch(SHEET_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const csv = await res.text()
    const rows = parseCSV(csv)

    if (!rows.length) throw new Error('No data rows found')

    const sectionMap = buildSectionMap(rows)

    // Return as simplified sections format (compatible with existing org chart)
    return {
      sections: Object.entries(sectionMap).map(([areaId, people]) => ({
        id: areaId,
        title: areaId.replace(/-/g, ' ').toUpperCase(),
        roles: people,
      })),
      sourceRef: SHEET_URL,
      timestamp: new Date().toISOString(),
    }
  } catch (e) {
    console.error('Failed to fetch Google Sheets org data:', e)
    throw e
  }
}

export function getSheetURL() {
  return SHEET_URL
}
