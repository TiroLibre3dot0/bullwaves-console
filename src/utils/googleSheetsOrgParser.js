/**
 * Parse Google Sheets CSV export → org chart sections format
 * Compatible with mapInternalRoleToPublicNode() sectionIds in ShareOrgChartTrueTree.jsx
 *
 * Source: https://docs.google.com/spreadsheets/d/1UXKOLw0o9gQvTYoWr0BlPzxguMTiC4YEqFuXhZc9Kk4/export?format=csv&gid=0
 *
 * Sheet columns (0-based):
 *   0: Employee Name  1: Job Title  2: Division  3: Sub Division  4: Department  5: Status
 *   6: (empty)        7: Topics/extra person name (sometimes a second person)
 *   8-12: extra person's Job Title, Division, Sub Division, Department, Status
 */

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1UXKOLw0o9gQvTYoWr0BlPzxguMTiC4YEqFuXhZc9Kk4/export?format=csv&gid=0'
const SHEET_URL_GVIZ =
  'https://docs.google.com/spreadsheets/d/1UXKOLw0o9gQvTYoWr0BlPzxguMTiC4YEqFuXhZc9Kk4/gviz/tq?tqx=out:csv&gid=0'

const KNOWN_DIVISIONS = new Set(['Operations', 'Revenue', 'Trading & Risk', 'Corporate'])

/**
 * Map Google Sheets Department/Division → sectionId used by mapInternalRoleToPublicNode()
 */
function departmentToSectionId(division, subDivision, department) {
  const dept = (department || '').trim()
  const sub = (subDivision || '').trim()
  const div = (division || '').trim()

  if (dept === 'Customer Support') return 'support-team'
  if (dept === 'Compliance') return 'compliance'
  if (dept === 'Dealing') return 'dealing'
  if (dept === 'Risk Management' || dept === 'MT5 Operations') return 'dealing'
  if (dept === 'Prop Trading') return 'dealing'
  if (dept === 'Finance' || dept === 'Banking') return 'finance'
  if (dept === 'Affiliates & IBs') return 'affiliation'
  if (dept === 'Marketing & Branding' || dept === 'Marketing - BW Prime') return 'marketing'
  if (dept === 'Reputation') return 'marketing'
  if (dept === 'HR & Talent Acquisition') return 'operations'
  if (dept === 'Sales' || dept === 'MENA - BW Prime') return 'business-development'
  if (dept === 'Tech Operations') return 'operations'

  // Fallback by sub-division
  if (sub === 'Support') return 'support-team'
  if (sub === 'Compliance') return 'compliance'
  if (sub === 'Finance & Banking') return 'finance'
  if (sub === 'Sales & Growth') return 'business-development'
  if (sub === 'Channels') return 'affiliation'
  if (sub === 'Marketing') return 'marketing'
  if (sub === 'Trading' || sub === 'Risk & Platforms') return 'dealing'
  if (sub === 'Human Resource') return 'operations'

  // Fallback by division
  if (div === 'Trading & Risk') return 'dealing'
  if (div === 'Corporate') return 'finance'
  if (div === 'Revenue') return 'business-development'

  return 'management-team'
}

/**
 * Normalize the department field to match what mapInternalRoleToPublicNode() checks
 */
function normalizeDepartment(dept) {
  const d = (dept || '').trim()
  if (d === 'HR & Talent Acquisition') return 'HR'
  if (d === 'Customer Support') return 'Support Team'
  if (d === 'Affiliates & IBs') return 'Affiliate Manager'
  return d
}

/**
 * Parse a single CSV line into an array of fields (handles quoted fields).
 */
function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuote = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuote = !inQuote
      }
    } else if (ch === ',' && !inQuote) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Extract people from a parsed CSV row.
 * Handles rows where two people are stored side-by-side (cols 0-5 and 7-11).
 */
function extractPeopleFromRow(cols) {
  const people = []

  const name0 = (cols[0] || '').replace(/^\*+/, '').trim()
  const title0 = (cols[1] || '').trim()
  const division0 = (cols[2] || '').trim()
  const subDiv0 = (cols[3] || '').trim()
  const dept0 = (cols[4] || '').trim()

  if (name0 && title0) {
    people.push({
      name: name0,
      title: title0,
      division: division0,
      subDivision: subDiv0,
      department: dept0,
    })
  }

  // Check if cols 7-11 contain a second person (Division must be a known value)
  const name1 = (cols[7] || '').replace(/^\*+/, '').trim()
  const title1 = (cols[8] || '').trim()
  const division1 = (cols[9] || '').trim()
  const subDiv1 = (cols[10] || '').trim()
  const dept1 = (cols[11] || '').trim()

  if (name1 && title1 && KNOWN_DIVISIONS.has(division1)) {
    people.push({
      name: name1,
      title: title1,
      division: division1,
      subDivision: subDiv1,
      department: dept1,
    })
  }

  return people
}

/**
 * Parse raw CSV text → array of person objects with sectionId.
 */
function parsePeopleFromCSV(csv) {
  const lines = String(csv || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
  if (lines.length < 2) return []

  const people = []
  const seenNames = new Set()

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = parseCsvLine(line)
    const extracted = extractPeopleFromRow(cols)

    for (const p of extracted) {
      if (!p.name || p.name.length < 2) continue
      const nameKey = p.name.toLowerCase().replace(/\s+/g, ' ')
      if (seenNames.has(nameKey)) continue
      seenNames.add(nameKey)

      const sectionId = departmentToSectionId(p.division, p.subDivision, p.department)

      people.push({
        name: p.name,
        title: p.title,
        division: p.division,
        department: normalizeDepartment(p.department),
        region: '—',
        email: '',
        focus: p.department,
        duties: [p.subDivision, p.department].filter(Boolean).join(' – '),
        _sectionId: sectionId,
      })
    }
  }

  return people
}

/**
 * Group people by sectionId and return in sections format.
 */
function groupIntoSections(people) {
  const sectionOrder = [
    'management-team',
    'support-team',
    'business-development',
    'affiliation',
    'marketing',
    'finance',
    'operations',
    'compliance',
    'dealing',
  ]

  const map = {}
  for (const p of people) {
    const sid = p._sectionId || 'management-team'
    if (!map[sid]) map[sid] = []
    const { _sectionId, ...role } = p
    map[sid].push(role)
  }

  return sectionOrder.filter((id) => map[id]).map((id) => ({ id, title: id, roles: map[id] }))
}

export async function fetchOrgChartFromGoogleSheets() {
  let csv = ''
  let sourceRef = SHEET_URL
  let lastError = null

  for (const url of [SHEET_URL, SHEET_URL_GVIZ]) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      csv = await res.text()
      sourceRef = url
      break
    } catch (e) {
      lastError = e
    }
  }

  if (!csv) {
    throw new Error(
      `Google Sheets fetch failed on all endpoints: ${String(lastError?.message || 'unknown error')}`
    )
  }

  const people = parsePeopleFromCSV(csv)

  if (!people.length) throw new Error('No people found in Google Sheets data')

  return {
    sections: groupIntoSections(people),
    sourceRef,
    timestamp: new Date().toISOString(),
  }
}

export function getSheetURL() {
  return SHEET_URL
}
