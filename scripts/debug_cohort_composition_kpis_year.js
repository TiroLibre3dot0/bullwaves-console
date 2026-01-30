/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')

function cleanNumber(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const s0 = String(value).trim()
  if (!s0) return null
  const normalized = s0.replace(/[€$\s]/g, '').replace(/,/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function parseCohortDateString(raw) {
  if (!raw) return null
  const datePart = String(raw).split(/\s|T/)[0] || ''
  const parts = datePart.split('/').map((p) => Number(p))
  if (parts.length < 3) return null
  const [m, d, y] = parts
  const dt = new Date(y, (m || 1) - 1, d || 1)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function getMonthKeys(row) {
  return Object.keys(row)
    .filter((k) => /^Month\s+\d+$/i.test(k))
    .sort((a, b) => {
      const ai = Number((a.match(/\d+/) || [0])[0])
      const bi = Number((b.match(/\d+/) || [0])[0])
      return ai - bi
    })
}

function monthAbsToKey(abs) {
  const y = Math.floor(abs / 12)
  const m = abs % 12
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

function groupRowsByBaseAbs(rows) {
  const map = new Map()
  for (const r of rows) {
    const baseAbs = Number(r.baseAbs)
    if (!Number.isFinite(baseAbs)) continue
    const list = map.get(baseAbs) || []
    list.push(r)
    map.set(baseAbs, list)
  }
  return map
}

function computeCohortContribution(rowsForCohortAbs, monthOffset) {
  const rows = Array.isArray(rowsForCohortAbs) ? rowsForCohortAbs : []
  if (!rows.length) return { sum: null, complete: false }

  let sum = 0
  for (const r of rows) {
    const v = r.values?.[monthOffset]
    const n = cleanNumber(v)
    if (n === null) return { sum: null, complete: false }
    sum += n
  }
  return { sum, complete: true }
}

function computeMonthlyTotalFromMatrix(cohortRows, monthAbs) {
  const abs = Number(monthAbs)
  if (!Number.isFinite(abs)) return { total: null, complete: false }

  let total = 0
  for (const r of cohortRows) {
    const baseAbs = Number(r.baseAbs)
    if (!Number.isFinite(baseAbs)) continue
    const offset = abs - baseAbs
    if (offset < 0) continue

    const v = r.values?.[offset]
    const n = cleanNumber(v)
    if (n === null) return { total: null, complete: false }
    total += n
  }

  return { total, complete: true }
}

function computeMonthShares({ cohortRows, grouped, monthAbs }) {
  const totalRes = computeMonthlyTotalFromMatrix(cohortRows, monthAbs)
  if (!totalRes.complete || totalRes.total === null) return null
  if (!(totalRes.total > 0)) return null

  const cur = computeCohortContribution(grouped.get(monthAbs), 0)
  const prev1 = computeCohortContribution(grouped.get(monthAbs - 1), 1)
  const prev2 = computeCohortContribution(grouped.get(monthAbs - 2), 2)
  if (!cur.complete || !prev1.complete || !prev2.complete) return null

  const total = totalRes.total
  const s0 = cur.sum / total
  const s2 = (prev1.sum + prev2.sum) / total
  const sold = 1 - s0 - s2

  if (![s0, s2, sold].every((x) => Number.isFinite(x))) return null

  return { total, cur: cur.sum, prev2: prev1.sum + prev2.sum, old: total - cur.sum - (prev1.sum + prev2.sum), s0, s2, sold }
}

function avg(xs) {
  const list = (xs || []).filter((x) => Number.isFinite(x))
  if (!list.length) return null
  return list.reduce((s, x) => s + x, 0) / list.length
}

function main() {
  const relPath = process.argv[2]
  const year = Number(process.argv[3])
  if (!relPath || !Number.isFinite(year)) {
    console.log('Usage: node scripts/debug_cohort_composition_kpis_year.js <public/cohort.csv> <year>')
    process.exit(1)
  }

  const filePath = path.isAbsolute(relPath) ? relPath : path.join(process.cwd(), relPath)
  const treatAsWithdrawals = /withdrawals/i.test(String(relPath))
  const text = fs.readFileSync(filePath, 'utf8')
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
  const rawRows = Array.isArray(parsed.data) ? parsed.data : []

  const rows = rawRows
    .map((row) => {
      const dt = parseCohortDateString(row['Cohort Date'])
      if (!dt) return null
      const baseAbs = dt.getFullYear() * 12 + dt.getMonth()
      const monthKeys = getMonthKeys(row)
      const values = monthKeys.map((k) => {
        const n = cleanNumber(row[k])
        if (n === null) return null
        return treatAsWithdrawals ? Math.abs(n) : n
      })
      return { baseAbs, values }
    })
    .filter(Boolean)

  const grouped = groupRowsByBaseAbs(rows)

  const months = []
  const s0s = []
  const s2s = []
  const solds = []

  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const abs = year * 12 + monthIndex
    const shares = computeMonthShares({ cohortRows: rows, grouped, monthAbs: abs })
    if (!shares) continue
    months.push({ key: monthAbsToKey(abs), ...shares })
    s0s.push(shares.s0)
    s2s.push(shares.s2)
    solds.push(shares.sold)
  }

  console.log(`File: ${path.relative(process.cwd(), filePath)}`)
  console.log(`Year: ${year}`)
  console.log(`Months used: ${months.length}`)
  console.log('month\tTotal\tCur\tPrev2\tOlder\tS0\tS2\tSold')
  for (const m of months) {
    console.log(`${m.key}\t${m.total.toFixed(0)}\t${m.cur.toFixed(0)}\t${m.prev2.toFixed(0)}\t${m.old.toFixed(0)}\t${(m.s0 * 100).toFixed(4)}%\t${(m.s2 * 100).toFixed(4)}%\t${(m.sold * 100).toFixed(4)}%`)
  }

  console.log('')
  const a0 = avg(s0s)
  const a2 = avg(s2s)
  const aOld = avg(solds)
  console.log(`Current Cohort Avg Share: ${a0 === null ? '—' : (a0 * 100).toFixed(6) + '%'}`)
  console.log(`Previous 2 Cohorts Avg Share: ${a2 === null ? '—' : (a2 * 100).toFixed(6) + '%'}`)
  console.log(`Older Cohorts Avg Share: ${aOld === null ? '—' : (aOld * 100).toFixed(6) + '%'}`)
}

main()
