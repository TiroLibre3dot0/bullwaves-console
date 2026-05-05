const fs = require('fs')

const j = JSON.parse(fs.readFileSync('public/traders_ranking_rewards_table.json', 'utf8'))
const rows = Array.isArray(j.rows) ? j.rows : Array.isArray(j.data) ? j.data : []

if (!rows.length) {
  console.log(JSON.stringify({ ok: false, error: 'No rows' }, null, 2))
  process.exit(0)
}

const periodRegex = /^\d{4}-[A-Za-z]{3}$/

let width = 0
for (const r of rows) {
  if (Array.isArray(r) && r.length > width) width = r.length
}

let periodIdx = -1
let bestPeriodScore = -1
for (let c = 0; c < width; c += 1) {
  let score = 0
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i]
    if (!Array.isArray(r)) continue
    const v = String(r[c] == null ? '' : r[c]).trim()
    if (periodRegex.test(v)) score += 1
  }
  if (score > bestPeriodScore) {
    bestPeriodScore = score
    periodIdx = c
  }
}

let userIdx = 2
let bestUserScore = -1
for (let c = 0; c < Math.min(width, 10); c += 1) {
  let score = 0
  const lim = Math.min(rows.length, 20000)
  for (let i = 0; i < lim; i += 1) {
    const r = rows[i]
    if (!Array.isArray(r)) continue
    const v = String(r[c] == null ? '' : r[c]).trim()
    if (!v || periodRegex.test(v)) continue
    if (/[A-Za-z]{3,}/.test(v) && v !== '-' && v !== 'Unknown') score += 1
  }
  if (score > bestUserScore) {
    bestUserScore = score
    userIdx = c
  }
}

const periodsSet = new Set()
for (const r of rows) {
  if (!Array.isArray(r)) continue
  const p = String(r[periodIdx] == null ? '' : r[periodIdx]).trim()
  if (periodRegex.test(p)) periodsSet.add(p)
}
const periods = [...periodsSet].sort((a, b) => b.localeCompare(a))
const latestPeriod = periods[0]

const periodRows = rows.filter(
  (r) => Array.isArray(r) && String(r[periodIdx] == null ? '' : r[periodIdx]).trim() === latestPeriod
)

const numericCols = []
for (let c = 0; c < width; c += 1) {
  if (c === userIdx || c === periodIdx) continue
  let seen = 0
  let nonZero = 0
  for (const r of periodRows) {
    const n = Number(r[c])
    if (!Number.isFinite(n)) continue
    seen += 1
    if (n !== 0) nonZero += 1
  }
  if (seen > 0 && nonZero > 0) numericCols.push({ col: c, nonZero })
}
numericCols.sort((a, b) => b.nonZero - a.nonZero)
const metricCols = numericCols.slice(0, 4).map((x) => x.col)

const byUser = new Map()
for (const r of periodRows) {
  const user = String(r[userIdx] == null ? '' : r[userIdx]).trim()
  if (!user || user === '-' || user === 'Unknown') continue

  const rec = byUser.get(user) || { user, rowsMatched: 0, metrics: {} }
  rec.rowsMatched += 1

  for (const c of metricCols) {
    const n = Number(r[c])
    if (!Number.isFinite(n)) continue
    const key = `col_${c}`
    rec.metrics[key] = (rec.metrics[key] || 0) + n
  }

  byUser.set(user, rec)
}

const users = [...byUser.values()]
  .sort((a, b) => {
    const sa = Object.values(a.metrics).reduce((acc, n) => acc + Math.abs(Number(n) || 0), 0)
    const sb = Object.values(b.metrics).reduce((acc, n) => acc + Math.abs(Number(n) || 0), 0)
    return sb - sa
  })
  .slice(0, 3)

console.log(
  JSON.stringify(
    {
      ok: true,
      source: 'public/traders_ranking_rewards_table.json',
      rows: rows.length,
      periodIdx,
      userIdx,
      latestPeriod,
      metricCols,
      users,
    },
    null,
    2
  )
)
