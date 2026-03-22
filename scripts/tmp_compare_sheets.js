const Papa = require('papaparse')

const SPREADSHEET_ID = '1VG4usR1Tl1TSuiZAs8zjo43QikX88X6F'
const GID_A = '351412150'
const GID_B = '99494896'
const base = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=`
const required = ['Date Reviewed','Reviewer Name','Country','Star Rating','Review Summary','Category','Issue Type','Potential Lead','Action Needed','Assigned To','Status','Trustpilot Link','Follow-up Notes']

function norm(v) { return String(v || '').trim() }
function toNum(v) { const n = Number(String(v || '').replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : null }
function topN(obj, n = 10) { return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n) }
function freq(rows, key) { const m = {}; for (const r of rows) { const v = norm(r[key]) || '(vuoto)'; m[v] = (m[v] || 0) + 1 } return m }

async function loadSheet(gid) {
  const res = await fetch(base + gid)
  if (!res.ok) throw new Error(`gid ${gid} HTTP ${res.status}`)
  const text = await res.text()
  const p = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false })
  const rows = Array.isArray(p.data) ? p.data : []
  const headers = Array.isArray(p.meta && p.meta.fields) ? p.meta.fields : []
  const headerSet = new Set(headers)
  const missingRequired = required.filter((h) => !headerSet.has(h))
  const emptyRequired = Object.fromEntries(required.map((h) => [h, rows.reduce((acc, r) => acc + (norm(r[h]) ? 0 : 1), 0)]))

  const stars = {}
  for (const r of rows) {
    const s = toNum(r['Star Rating'])
    const key = s == null ? '(vuoto/non numerico)' : String(s)
    stars[key] = (stars[key] || 0) + 1
  }

  const keyOf = (r) => [norm(r['Date Reviewed']), norm(r['Reviewer Name']), norm(r['Trustpilot Link'])].join('||')
  const rowKeys = new Set(rows.map(keyOf))

  return {
    gid, rows: rows.length, columns: headers.length, headers, missingRequired, emptyRequired, stars,
    issueTop: topN(freq(rows, 'Issue Type'), 10),
    statusTop: topN(freq(rows, 'Status'), 10),
    assignedTop: topN(freq(rows, 'Assigned To'), 10),
    potentialTop: topN(freq(rows, 'Potential Lead'), 10),
    samples: rows.slice(0, 3).map((r) => ({ date: r['Date Reviewed'], reviewer: r['Reviewer Name'], stars: r['Star Rating'], issue: r['Issue Type'], status: r['Status'], link: r['Trustpilot Link'] })),
    rowKeys,
  }
}

async function main() {
  const a = await loadSheet(GID_A)
  const b = await loadSheet(GID_B)
  const onlyInA = a.headers.filter((h) => !b.headers.includes(h))
  const onlyInB = b.headers.filter((h) => !a.headers.includes(h))

  let shared = 0
  for (const k of a.rowKeys) if (b.rowKeys.has(k)) shared += 1

  const out = {
    sheetA: { gid: a.gid, rows: a.rows, columns: a.columns, missingRequired: a.missingRequired, issueTop: a.issueTop, statusTop: a.statusTop, assignedTop: a.assignedTop, potentialTop: a.potentialTop, stars: a.stars, samples: a.samples },
    sheetB: { gid: b.gid, rows: b.rows, columns: b.columns, missingRequired: b.missingRequired, issueTop: b.issueTop, statusTop: b.statusTop, assignedTop: b.assignedTop, potentialTop: b.potentialTop, stars: b.stars, samples: b.samples },
    schemaDiff: { onlyInA, onlyInB, commonCount: a.headers.length - onlyInA.length },
    overlapByDateNameLink: { shared, onlyInA: a.rowKeys.size - shared, onlyInB: b.rowKeys.size - shared },
    qualityDiff: { emptyRequiredA: a.emptyRequired, emptyRequiredB: b.emptyRequired },
  }

  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => { console.error(e.stack || String(e)); process.exit(1) })
