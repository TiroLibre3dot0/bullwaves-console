const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

;['.env.server.local', '.env.server', '.env.local', '.env'].forEach((name) => {
  const p = path.join(process.cwd(), name)
  if (fs.existsSync(p)) dotenv.config({ path: p, override: false })
})

const BASE = 'http://localhost:5174'

function norm(s) {
  return String(s || '').toLowerCase()
}

function looksPeriod(label) {
  const s = norm(label)
  return /period|date|month|anno|mese|day|giorno|week|settimana/.test(s)
}

function looksUser(label) {
  const s = norm(label)
  return /email|client|user|account|trader|login|cliente|utente|name|nome/.test(s)
}

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function requestJson(pathname) {
  const r = await fetch(`${BASE}${pathname}`)
  const txt = await r.text()
  let payload = null
  try {
    payload = JSON.parse(txt)
  } catch {
    payload = null
  }

  if (!r.ok || !payload?.ok) {
    return { ok: false, status: r.status, payload }
  }
  return { ok: true, status: r.status, payload }
}

async function main() {
  const appsRes = await requestJson('/api/qlik/items?limit=20')
  if (!appsRes.ok) throw new Error('Cannot read apps list')

  const apps = (appsRes.payload?.data?.data || [])
    .filter((a) => a.resourceType === 'app')
    .map((a) => ({
      id: a.resourceId,
      name: a.name,
    }))

  let best = null

  for (const app of apps) {
    const sheetsRes = await requestJson(`/api/qlik/engine/apps/${encodeURIComponent(app.id)}/sheets`)
    if (!sheetsRes.ok) continue
    const sheets = sheetsRes.payload?.data || []

    for (const sheet of sheets) {
      const objectsRes = await requestJson(
        `/api/qlik/engine/apps/${encodeURIComponent(app.id)}/sheets/${encodeURIComponent(sheet.id)}/objects`
      )
      if (!objectsRes.ok) continue
      const objects = (objectsRes.payload?.data || []).filter((o) => o.hasHypercube)

      for (const object of objects) {
        const dataRes = await requestJson(
          `/api/qlik/engine/apps/${encodeURIComponent(app.id)}/objects/${encodeURIComponent(object.id)}/data?rows=500&cols=20`
        )
        if (!dataRes.ok) continue

        const data = dataRes.payload?.data
        const dims = Array.isArray(data?.dimensions) ? data.dimensions.map(String) : []
        const meas = Array.isArray(data?.measures) ? data.measures.map(String) : []
        const matrix = Array.isArray(data?.data) ? data.data : []

        const periodIdx = dims.findIndex(looksPeriod)
        const userIdx = dims.findIndex(looksUser)

        if (periodIdx < 0 || userIdx < 0 || meas.length === 0 || matrix.length === 0) continue

        const grouped = new Map()
        for (const row of matrix) {
          if (!Array.isArray(row)) continue
          const period = String(row[periodIdx]?.text || '').trim()
          const user = String(row[userIdx]?.text || '').trim()
          if (!period || !user || user === '-') continue

          const key = `${period}||${user}`
          const rec = grouped.get(key) || {
            period,
            user,
            rowsMatched: 0,
            metricTotals: new Array(meas.length).fill(0),
            metricCounts: new Array(meas.length).fill(0),
          }

          rec.rowsMatched += 1
          for (let i = 0; i < meas.length; i += 1) {
            const cell = row[dims.length + i]
            const n = toNum(cell?.number)
            if (n == null) continue
            rec.metricTotals[i] += n
            rec.metricCounts[i] += 1
          }

          grouped.set(key, rec)
        }

        if (!grouped.size) continue

        const byPeriod = new Map()
        for (const rec of grouped.values()) {
          if (!byPeriod.has(rec.period)) byPeriod.set(rec.period, [])
          byPeriod.get(rec.period).push(rec)
        }

        const periods = [...byPeriod.keys()].sort((a, b) => String(b).localeCompare(String(a)))
        const chosenPeriod = periods[0]
        const examples = (byPeriod.get(chosenPeriod) || [])
          .sort((a, b) => b.rowsMatched - a.rowsMatched)
          .slice(0, 3)
          .map((rec) => {
            const out = {
              period: rec.period,
              user: rec.user,
              rowsMatched: rec.rowsMatched,
            }
            meas.forEach((m, idx) => {
              out[m] = rec.metricCounts[idx] ? rec.metricTotals[idx] : null
            })
            return out
          })

        const score = examples.length * 10 + meas.length * 2 + matrix.length
        if (!best || score > best.score) {
          best = {
            score,
            app,
            sheet,
            object,
            dims,
            meas,
            chosenPeriod,
            users: examples,
          }
        }
      }
    }
  }

  if (!best) {
    console.log(JSON.stringify({ ok: false, error: 'No object with period+user+metrics found' }, null, 2))
    return
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        app: best.app,
        sheet: { id: best.sheet.id, title: best.sheet.title },
        object: { id: best.object.id, title: best.object.title, type: best.object.type },
        dimensions: best.dims,
        measures: best.meas,
        period: best.chosenPeriod,
        users: best.users,
      },
      null,
      2
    )
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
