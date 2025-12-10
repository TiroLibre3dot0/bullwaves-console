import { parseCsv } from '../../../lib/csv'
import { cleanNumber, normalizeKey } from '../../../lib/formatters'

const TOP10_PATH = '/top 10 Cohort Analysis PL.csv'

const monthHeaders = Array.from({ length: 12 }, (_, idx) => `Month ${idx}`)

const mapRow = (row) => {
  const months = monthHeaders
    .map((header, idx) => ({ label: header, index: idx, value: cleanNumber(row[header]) }))
    .filter((m) => m.value || m.value === 0)

  return {
    affiliate: (row.Affiliate || row.affiliate || '').toString().trim(),
    cohortDate: row['Cohort Date'] || row.cohortDate || '',
    cohortSize: cleanNumber(row['Cohort Size'] || row.cohortSize),
    months,
    raw: row,
  }
}

let cachedRows = null

export const loadTop10CohortData = async () => {
  if (cachedRows) return cachedRows
  const resp = await fetch(TOP10_PATH)
  if (!resp.ok) return []
  const text = await resp.text()
  const parsed = parseCsv(text)
  cachedRows = parsed.map(mapRow)
  return cachedRows
}

export const filterTop10CohortRowsForAffiliate = (rows = [], affiliateName = '') => {
  if (!affiliateName) return []
  const key = normalizeKey(affiliateName)
  return rows.filter((r) => normalizeKey(r.affiliate) === key)
}

export default loadTop10CohortData
