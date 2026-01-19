import { useEffect, useMemo, useState } from 'react'
import { parseCsv } from '../../../lib/csv'
import { cleanNumber, normalizeKey } from '../../../lib/formatters'

const DEFAULT_CANDIDATES = [
  '/Cohort Analysis per churn analysis Net Depositis since 2024.csv',
  '/Cohort Analysis per churn analysis Net Deposits since 2024.csv',
  '/Cohort Analysis per churn analysis Net Depositis.csv',
  '/Cohort Analysis per churn analysis Net Deposits.csv',
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const friendlyCohortLabel = (raw) => {
  if (!raw) return 'Cohort'
  const datePart = String(raw).split(/\s|T/)[0] || ''
  const parts = datePart.split('/').map((p) => Number(p))
  if (parts.length >= 3) {
    const [m, _d, y] = parts
    const monthIndex = (Number(m) || 1) - 1
    const year = Number(y) || null
    if (year && monthIndex >= 0 && monthIndex <= 11) return `${months[monthIndex]} ${year}`
  }
  return String(raw)
}

const parseCohortDateString = (raw) => {
  if (!raw) return null
  const datePart = String(raw).split(/\s|T/)[0] || ''
  const parts = datePart.split('/').map((p) => Number(p))
  if (parts.length < 3) return null
  const [m, d, y] = parts // month-first
  const dt = new Date(y, (m || 1) - 1, d || 1)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const average = (arr = []) => {
  const vals = arr.filter((v) => Number.isFinite(v))
  if (!vals.length) return null
  return vals.reduce((s, v) => s + v, 0) / vals.length
}

const buildCohortMetrics = (row) => {
  const values = row?.values || []
  const m0 = values[0] || 0
  const retainedAt = (idx) => {
    if (!m0) return null
    const v = values[idx]
    return v === undefined || v === null ? null : (v / m0) * 100
  }

  const retainedM1 = retainedAt(1)
  const retainedM3 = retainedAt(3)
  const retainedM6 = retainedAt(6)

  const halfLife = (() => {
    if (!m0) return null
    for (let i = 1; i < values.length; i += 1) {
      const v = values[i]
      if (v === null || v === undefined) continue
      if ((v / m0) * 100 < 50) return i
    }
    return null
  })()

  const lifetime = (() => {
    if (!m0) return null
    for (let i = 1; i < values.length; i += 1) {
      const v = values[i]
      if (v === null || v === undefined) continue
      if ((v / m0) * 100 < 10) return i
    }
    return null
  })()

  const cumulative = values.reduce((s, v) => s + (Number(v) || 0), 0)
  const earlyShare = cumulative ? (m0 / cumulative) * 100 : null

  return { retainedM1, retainedM3, retainedM6, halfLife, lifetime, cumulative, earlyShare, m0 }
}

const aggregateMetrics = (rows = []) => {
  if (!rows.length) return null
  const metrics = rows.map((r) => buildCohortMetrics(r))
  const avg = (key) =>
    average(metrics.map((m) => m[key]).filter((v) => v !== null && v !== undefined))
  const sum = metrics.reduce((s, m) => s + (m.cumulative || 0), 0)
  const totalSize = metrics.reduce((s, m) => s + (m.m0 || 0), 0)
  return {
    retainedM1: avg('retainedM1'),
    retainedM3: avg('retainedM3'),
    retainedM6: avg('retainedM6'),
    halfLife: avg('halfLife'),
    lifetime: avg('lifetime'),
    cumulative: sum,
    totalSize,
    earlyShare: avg('earlyShare'),
  }
}

const classifyCohortHealth = (stats) => {
  if (!stats) {
    return {
      flag: 'NO_DATA',
      tone: '#cbd5e1',
      whyKey: 'dashboard.cohortHealth.why.noData',
      meaningKey: 'dashboard.cohortHealth.meaning.noData',
      nextCheckKey: 'dashboard.cohortHealth.nextCheck.noData',
      valueConcentration: null,
    }
  }

  const r1 = stats.retainedM1 ?? null
  const r3 = stats.retainedM3 ?? null
  const r6 = stats.retainedM6 ?? null
  const hl = stats.halfLife ?? null
  const life = stats.lifetime ?? null
  const early = stats.earlyShare ?? null

  const isGreen =
    (r3 !== null && r3 >= 40) || (hl !== null && hl >= 3) || (life !== null && life >= 6)
  const isOrange =
    !isGreen &&
    ((r3 !== null && r3 >= 20) || (hl !== null && hl >= 2) || (life !== null && life >= 4))
  const flag = isGreen ? 'GREEN' : isOrange ? 'ORANGE' : 'RED'
  const tone = flag === 'GREEN' ? '#34d399' : flag === 'ORANGE' ? '#fbbf24' : '#f87171'

  const why = (() => {
    if (flag === 'GREEN') return 'dashboard.cohortHealth.why.green'
    if (early !== null && early !== undefined && early >= 60)
      return 'dashboard.cohortHealth.why.early'
    if (r1 !== null && r1 !== undefined && r1 < 25) return 'dashboard.cohortHealth.why.r1Low'
    if (r3 !== null && r3 !== undefined && r3 < 20) return 'dashboard.cohortHealth.why.r3Low'
    return 'dashboard.cohortHealth.why.default'
  })()

  const meaning = (() => {
    if (flag === 'GREEN') return 'dashboard.cohortHealth.meaning.green'
    if (flag === 'ORANGE') return 'dashboard.cohortHealth.meaning.orange'
    return 'dashboard.cohortHealth.meaning.red'
  })()

  const nextCheck = 'dashboard.cohortHealth.nextCheck.default'
  const valueConcentration = early === null || early === undefined ? null : early

  return {
    flag,
    tone,
    whyKey: why,
    meaningKey: meaning,
    nextCheckKey: nextCheck,
    valueConcentration,
  }
}

const getMonthKeys = (row) => {
  if (!row) return []
  return Object.keys(row)
    .filter((k) => /^Month\s+\d+$/i.test(k))
    .sort((a, b) => {
      const ai = Number((a.match(/\d+/) || [0])[0])
      const bi = Number((b.match(/\d+/) || [0])[0])
      return ai - bi
    })
}

export function useCohortNetDepositsCalendar({
  enabled = true,
  candidates = DEFAULT_CANDIDATES,
} = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])

  useEffect(() => {
    let alive = true
    if (!enabled) {
      setRows([])
      setLoading(false)
      setError(null)
      return () => {
        alive = false
      }
    }

    async function load() {
      setLoading(true)
      setError(null)

      try {
        let fileText = ''
        let usedPath = ''

        for (const path of candidates) {
          try {
            const resp = await fetch(path)
            if (!resp.ok) continue
            fileText = await resp.text()
            usedPath = path
            break
          } catch {
            // ignore and keep trying candidates
          }
        }

        if (!fileText) {
          if (!alive) return
          setRows([])
          setLoading(false)
          return
        }

        const rawRows = parseCsv(fileText)
        const aggregated = new Map()

        rawRows.forEach((row) => {
          const rawDate = row['Cohort Date']
          const dt = parseCohortDateString(rawDate)
          if (!dt) return

          const monthKeys = getMonthKeys(row)
          const values = monthKeys.map((k) => cleanNumber(row[k]))
          const cohortSize = cleanNumber(row['Cohort Size'])

          const baseAbs = dt.getFullYear() * 12 + dt.getMonth()
          const key = baseAbs

          const existing = aggregated.get(key) || {
            id: `cohort-${key}`,
            cohortLabel: friendlyCohortLabel(rawDate),
            cohortDateRaw: rawDate,
            cohortYear: dt.getFullYear(),
            baseAbs,
            values: Array(values.length || 12).fill(0),
            cohortSize: 0,
            affiliate: 'all',
            affiliateKey: normalizeKey('all'),
          }

          const nextValues = Array.from({
            length: Math.max(existing.values.length, values.length),
          }).map((_, idx) => (existing.values[idx] || 0) + (values[idx] || 0))

          aggregated.set(key, {
            ...existing,
            values: nextValues,
            cohortSize: (existing.cohortSize || 0) + (cohortSize || 0),
          })
        })

        const parsed = Array.from(aggregated.values())
          .map((item) => {
            const m0 = item.values[0] || 0
            const normalized = item.values.map((v) => {
              if (!m0) return null
              return (v / m0) * 100
            })
            return { ...item, normalized }
          })
          .sort((a, b) => a.baseAbs - b.baseAbs)

        if (!alive) return
        setRows(parsed)
        setLoading(false)

        if (!parsed.length) {
          console.warn(`Cohort Net Deposits loaded (${usedPath}) but parsed 0 rows.`)
        }
      } catch (err) {
        if (!alive) return
        setError(err)
        setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [enabled, candidates])

  const calendarView = useMemo(() => {
    if (!rows.length) return { rows: [], entries: [], startAbs: 0 }

    const minAbs = Math.min(...rows.map((r) => r.baseAbs))
    const maxAbs = Math.max(...rows.map((r) => r.baseAbs + (r.values?.length || 0) - 1))

    const entries = []
    for (let abs = minAbs; abs <= maxAbs; abs += 1) {
      const year = Math.floor(abs / 12)
      const month = abs % 12
      entries.push({ abs, label: `${months[month]} ${year}` })
    }

    return { rows, entries, startAbs: minAbs }
  }, [rows])

  const overview = useMemo(() => {
    const stats = aggregateMetrics(rows)
    const flag = classifyCohortHealth(stats)
    return {
      stats,
      flag,
      econ: {
        retainedM1: stats?.retainedM1 ?? null,
        retainedM3: stats?.retainedM3 ?? null,
        retainedM6: stats?.retainedM6 ?? null,
        halfLife: stats?.halfLife ?? null,
        lifetime: stats?.lifetime ?? null,
        whyKey: flag.whyKey,
        meaningKey: flag.meaningKey,
        nextCheckKey: flag.nextCheckKey,
        valueConcentration: flag.valueConcentration,
      },
    }
  }, [rows])

  return { calendarView, overview, loading, error }
}
