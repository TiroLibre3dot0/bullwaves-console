const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatMonthReference(selectedYear, selectedMonth) {
  const monthRaw = String(selectedMonth || '').trim()
  const yearRaw = String(selectedYear || '').trim()

  // Preferred: month key is 'YYYY-MM' across the dashboard.
  const keyMatch = monthRaw.match(/^(\d{4})-(\d{2})$/)
  if (keyMatch) {
    const y = Number(keyMatch[1])
    const m = Number(keyMatch[2])
    if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12)
      return `${MONTHS[m - 1]} ${y}`
  }

  // Fallback: separate year + numeric month.
  const y = Number(yearRaw)
  const m = Number(monthRaw)
  if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) return `${MONTHS[m - 1]} ${y}`

  // If a specific year is selected but month is 'all', make the scope explicit.
  if (monthRaw === 'all' && Number.isFinite(y)) return `All Months ${y}`

  return 'All Months'
}
