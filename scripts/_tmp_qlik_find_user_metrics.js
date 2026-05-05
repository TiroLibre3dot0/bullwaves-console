const BASE = 'http://localhost:5174'
const APP_ID = 'f0a37b7b-3007-48d7-80b2-9f1d98aa31c9' // BullWaves Prime

function norm(s) {
  return String(s || '').toLowerCase()
}

function isUserDim(label) {
  return /email|client|user|account|trader|cliente|utente|name|nome/.test(norm(label))
}

function isPeriodDim(label) {
  return /period|date|month|anno|mese|day|giorno|week|settimana/.test(norm(label))
}

async function j(path) {
  const r = await fetch(`${BASE}${path}`)
  const t = await r.text()
  let p = null
  try {
    p = JSON.parse(t)
  } catch {
    p = null
  }
  return { ok: r.ok && p?.ok, status: r.status, payload: p }
}

async function main() {
  const sheetsRes = await j(`/api/qlik/engine/apps/${APP_ID}/sheets`)
  if (!sheetsRes.ok) throw new Error(`sheets failed (${sheetsRes.status})`)

  const sheets = (sheetsRes.payload.data || []).filter((s) =>
    /(affiliate|report|daily|performance|details)/i.test(String(s.title || ''))
  )

  for (const s of sheets) {
    const objRes = await j(`/api/qlik/engine/apps/${APP_ID}/sheets/${encodeURIComponent(s.id)}/objects`)
    if (!objRes.ok) continue
    const objects = (objRes.payload.data || []).filter((o) => o.hasHypercube)

    for (const o of objects) {
      const dataRes = await j(
        `/api/qlik/engine/apps/${APP_ID}/objects/${encodeURIComponent(o.id)}/data?rows=300&cols=20`
      )
      if (!dataRes.ok) continue

      const data = dataRes.payload.data || {}
      const dims = Array.isArray(data.dimensions) ? data.dimensions : []
      const meas = Array.isArray(data.measures) ? data.measures : []
      const matrix = Array.isArray(data.data) ? data.data : []

      const userIdx = dims.findIndex(isUserDim)
      const periodIdx = dims.findIndex(isPeriodDim)

      if (userIdx < 0 || periodIdx < 0 || !meas.length || !matrix.length) continue

      const rows = []
      for (const row of matrix) {
        if (!Array.isArray(row)) continue
        const period = String(row[periodIdx]?.text || '').trim()
        const user = String(row[userIdx]?.text || '').trim()
        if (!period || !user) continue

        const out = { period, user }
        meas.forEach((m, i) => {
          const cell = row[dims.length + i]
          out[m] = typeof cell?.number === 'number' ? cell.number : cell?.text || null
        })
        rows.push(out)
      }

      if (!rows.length) continue

      rows.sort((a, b) => String(b.period).localeCompare(String(a.period)))
      const chosenPeriod = rows[0].period
      const picked = rows.filter((r) => r.period === chosenPeriod).slice(0, 3)

      console.log(
        JSON.stringify(
          {
            ok: true,
            appId: APP_ID,
            sheet: { id: s.id, title: s.title },
            object: { id: o.id, title: o.title, type: o.type },
            dimensions: dims,
            measures: meas,
            period: chosenPeriod,
            users: picked,
          },
          null,
          2
        )
      )
      return
    }
  }

  console.log(JSON.stringify({ ok: false, error: 'No object with period+user+metrics found in target sheets' }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
