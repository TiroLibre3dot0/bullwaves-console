function safeDiv(num, den) {
  const n = Number(num)
  const d = Number(den)
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return 0
  return n / d
}

function isCountryAllowed(clientCountry, allowedCountries) {
  const list = Array.isArray(allowedCountries) ? allowedCountries : []
  if (!list.length) return true
  const c = String(clientCountry || '').trim()
  if (!c) return false
  return list.includes(c)
}

function toDate(v) {
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v : null
  if (!v) return null
  const ms = Date.parse(String(v))
  if (!Number.isFinite(ms)) return null
  const d = new Date(ms)
  return Number.isFinite(d.getTime()) ? d : null
}

function monthsDiffCeil(startDate, endDate) {
  const a = startDate instanceof Date ? startDate : null
  const b = endDate instanceof Date ? endDate : null
  if (!a || !b) return 1

  const ay = a.getUTCFullYear()
  const am = a.getUTCMonth() + 1
  const by = b.getUTCFullYear()
  const bm = b.getUTCMonth() + 1

  const dy = by - ay
  const dm = bm - am
  const total = dy * 12 + dm + 1
  return Number.isFinite(total) && total > 0 ? total : 1
}

function diffDays(today, past) {
  const t = today instanceof Date ? today.getTime() : NaN
  const p = past instanceof Date ? past.getTime() : NaN
  if (!Number.isFinite(t) || !Number.isFinite(p)) return null
  const days = Math.floor((t - p) / 86400000)
  return Number.isFinite(days) ? Math.max(0, days) : null
}

function recencyScoreFromDays(recencyDays) {
  const d = Number(recencyDays)
  if (!Number.isFinite(d)) return 10
  if (d < 7) return 100
  if (d < 30) return 70
  if (d < 90) return 40
  return 10
}

function percentile(sorted, p) {
  const arr = Array.isArray(sorted) ? sorted : []
  if (!arr.length) return 0
  const pp = Math.max(0, Math.min(1, Number(p)))
  const idx = (arr.length - 1) * pp
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return Number(arr[lo] ?? 0)
  const a = Number(arr[lo] ?? 0)
  const b = Number(arr[hi] ?? 0)
  const t = idx - lo
  return a + (b - a) * t
}

function buildPercentileRank(values) {
  const arr = (Array.isArray(values) ? values : []).map((v) => Number(v || 0))
  const n = arr.length
  if (n <= 1) return () => 100

  const sorted = [...arr].sort((a, b) => a - b)

  function lowerBound(x) {
    let lo = 0
    let hi = sorted.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (sorted[mid] < x) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  function upperBound(x) {
    let lo = 0
    let hi = sorted.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (sorted[mid] <= x) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  return (x0) => {
    const x = Number(x0)
    if (!Number.isFinite(x)) return 0
    const lo = lowerBound(x)
    const hi = upperBound(x)
    const avg = (lo + hi) / 2
    const rank01 = avg / (n - 1)
    return Math.max(0, Math.min(1, rank01)) * 100
  }
}

function normalizeMetric(values, { clampP5P95 = true, log1p = false } = {}) {
  const arr = (Array.isArray(values) ? values : []).map((v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  })

  if (!arr.length) {
    return {
      scores: [],
      p5: 0,
      p95: 0,
    }
  }

  const sorted = [...arr].sort((a, b) => a - b)
  const p5 = clampP5P95 ? percentile(sorted, 0.05) : Math.min(...sorted)
  const p95 = clampP5P95 ? percentile(sorted, 0.95) : Math.max(...sorted)

  const transformed = arr.map((v) => {
    const clamped = Math.max(Math.min(v, p95), p5)
    if (!log1p) return clamped
    // Signed log1p keeps ordering for negative values too.
    // (Useful for metrics like NetDeposit which can be < 0.)
    return Math.sign(clamped) * Math.log1p(Math.abs(clamped))
  })

  const rankFn = buildPercentileRank(transformed)
  const scores = transformed.map((v) => rankFn(v))

  return { scores, p5, p95 }
}

export function computeClientMetricsV1({ client, today } = {}) {
  const t = today instanceof Date ? today : new Date()

  const totalDeposit = Number(client?.totalDeposit || 0)
  const totalWithdrawals = Number(client?.totalWithdrawals || 0)
  const netDeposit = Number(client?.netDeposit || 0)

  const closedPL = Number(client?.closedPL || 0)
  const openPL = Number(client?.openPL || 0)

  const totalTrades = Math.floor(Number(client?.totalTrades || 0))
  const balance = Number(client?.balance || 0)
  const equity = Number(client?.equity || 0)

  const firstDeposit = Number(client?.firstDeposit || 0)
  const redeposit = Number(client?.redeposit || 0)

  const clientTimestamp = toDate(client?.clientTimestamp)
  const lastTradeDate = toDate(client?.lastTradeDate)
  const lastTransactionDate = toDate(client?.lastTransactionDate)

  const lastActivity = lastTradeDate || lastTransactionDate || clientTimestamp
  const recencyDays = diffDays(t, lastTradeDate || lastActivity)
  const recencyScore = recencyScoreFromDays(recencyDays)

  const activeMonths = monthsDiffCeil(
    clientTimestamp || lastActivity || t,
    lastTradeDate || lastActivity || t
  )
  const tradesPerMonth = safeDiv(totalTrades, Math.max(1, activeMonths))

  const roi = safeDiv(closedPL, Math.max(1, totalDeposit))
  const redepositRatio = safeDiv(redeposit, Math.max(1, totalDeposit))
  const capitalCommitment = Number(netDeposit || 0) + Number(equity || 0)

  const consistencyScore = tradesPerMonth * 40 + recencyScore * 30 + redepositRatio * 30
  const momentumScore = recencyScore * 0.6 + tradesPerMonth * 0.4

  return {
    clientId: String(client?.clientId || ''),
    clientName: String(client?.clientName || ''),
    country: String(client?.country || ''),

    totalDeposit,
    totalWithdrawals,
    netDeposit,

    closedPL,
    openPL,

    totalTrades,
    balance,
    equity,

    firstDeposit,
    redeposit,

    clientTimestamp,
    lastTradeDate,
    lastTransactionDate,
    lastActivity,

    activeMonths,
    tradesPerMonth,

    recencyDays,
    recencyScore,

    roi,
    redepositRatio,
    capitalCommitment,

    consistencyScore,
    momentumScore,
  }
}

export function buildRankingsV1({
  dataset,
  minTrades = 0,
  minDeposit = 0,
  countries = [],
  activityRecencyDays = 0,
  today,
} = {}) {
  const list = Array.isArray(dataset?.clients) ? dataset.clients : []
  const t = today instanceof Date ? today : new Date()

  const base = []
  for (const c of list) {
    if (!isCountryAllowed(c?.country, countries)) continue

    const m = computeClientMetricsV1({ client: c, today: t })

    if (Number(m.totalTrades || 0) < Number(minTrades || 0)) continue
    if (Number(m.totalDeposit || 0) < Number(minDeposit || 0)) continue

    const maxDays = Number(activityRecencyDays || 0)
    if (maxDays > 0) {
      const d = Number(m.recencyDays)
      if (!Number.isFinite(d) || d > maxDays) continue
    }

    base.push(m)
  }

  let totalTrades = 0
  let totalDeposits = 0
  let totalClosedPL = 0
  for (const m of base) {
    totalTrades += Number(m.totalTrades || 0)
    totalDeposits += Number(m.totalDeposit || 0)
    totalClosedPL += Number(m.closedPL || 0)
  }

  // Normalization for RewardScore.
  const tradesPerMonthVals = base.map((m) => Number(m.tradesPerMonth || 0))
  const netDepositVals = base.map((m) => Number(m.netDeposit || 0))
  const equityVals = base.map((m) => Number(m.equity || 0))
  const redepositRatioVals = base.map((m) => Number(m.redepositRatio || 0))
  const recencyScoreVals = base.map((m) => Number(m.recencyScore || 0))
  const closedPlPosVals = base.map((m) => Math.max(0, Number(m.closedPL || 0)))

  const tradesPerMonthNorm = normalizeMetric(tradesPerMonthVals, { clampP5P95: true, log1p: true })
  const netDepositNorm = normalizeMetric(netDepositVals, { clampP5P95: true, log1p: true })
  const equityNorm = normalizeMetric(equityVals, { clampP5P95: true, log1p: true })
  const redepositRatioNorm = normalizeMetric(redepositRatioVals, { clampP5P95: true, log1p: false })
  const recencyScoreNorm = normalizeMetric(recencyScoreVals, { clampP5P95: false, log1p: false })
  const closedPlPosNorm = normalizeMetric(closedPlPosVals, { clampP5P95: true, log1p: true })

  const metrics = base.map((m, i) => {
    const scoreTradesPerMonth = tradesPerMonthNorm.scores[i] || 0
    const scoreRecency = recencyScoreNorm.scores[i] || 0
    const scoreNetDeposit = netDepositNorm.scores[i] || 0
    const scoreEquity = equityNorm.scores[i] || 0
    const scoreRedepositRatio = redepositRatioNorm.scores[i] || 0

    const rewardScore =
      0.35 * scoreTradesPerMonth +
      0.25 * scoreRecency +
      0.15 * scoreNetDeposit +
      0.1 * scoreEquity +
      0.15 * scoreRedepositRatio

    return {
      ...m,
      scoreTradesPerMonth,
      scoreRecency,
      scoreNetDeposit,
      scoreEquity,
      scoreRedepositRatio,
      scoreClosedPLPos: closedPlPosNorm.scores[i] || 0,
      rewardScore,
    }
  })

  const summary = {
    totalTraders: metrics.length,
    totalTrades,
    totalDeposits,
    totalClosedPL,
  }

  const mostActive = [...metrics].sort(
    (a, b) => Number(b.totalTrades || 0) - Number(a.totalTrades || 0)
  )

  const topPerforming = metrics
    .filter((m) => Number(m.totalTrades || 0) >= 50 && Number(m.totalDeposit || 0) >= 1000)
    .sort((a, b) => Number(b.closedPL || 0) - Number(a.closedPL || 0))

  const mostConsistent = [...metrics].sort(
    (a, b) => Number(b.consistencyScore || 0) - Number(a.consistencyScore || 0)
  )

  const rising = [...metrics].sort(
    (a, b) => Number(b.momentumScore || 0) - Number(a.momentumScore || 0)
  )

  const bestRewardCandidates = metrics
    .filter((m) => {
      const recencyDays = Number(m.recencyDays)
      const last30 = Number.isFinite(recencyDays) && recencyDays <= 30
      const tpm = Number(m.tradesPerMonth || 0)
      const rr = Number(m.redepositRatio || 0)
      return last30 || tpm > 10 || rr > 0.2
    })
    .sort((a, b) => Number(b.rewardScore || 0) - Number(a.rewardScore || 0))

  return {
    summary,
    metrics,
    rankings: {
      mostActive,
      topPerforming,
      mostConsistent,
      rising,
      bestRewardCandidates,
    },
  }
}
