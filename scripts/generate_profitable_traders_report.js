const fs = require('fs')
const path = require('path')

function parseNumberSafe(value) {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'boolean') return value ? 1 : 0

  let s = String(value).trim()
  if (!s) return 0

  let negative = false
  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1).trim()
  }

  s = s.replace(/\s+/g, '')
  s = s.replace(/[^0-9.,+-]/g, '')

  if (s.includes('-')) {
    const hasLeading = s[0] === '-'
    s = s.replace(/-/g, '')
    if (hasLeading) s = `-${s}`
  }

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(',')
    const lastDot = s.lastIndexOf('.')
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(/,/g, '.')
    else s = s.replace(/,/g, '')
  } else if (hasComma && !hasDot) {
    const parts = s.split(',')
    const last = parts[parts.length - 1] || ''
    if (parts.length > 2 && /^\d{3}$/.test(last)) s = parts.join('')
    else if (parts.length === 2 && /^\d{3}$/.test(last) && /^\d{1,3}$/.test(parts[0] || '')) {
      s = parts.join('')
    } else s = s.replace(/,/g, '.')
  }

  const n = Number.parseFloat(s)
  if (!Number.isFinite(n)) return 0
  const out = negative ? -Math.abs(n) : n
  return Number.isFinite(out) ? out : 0
}

function safeDiv(num, den) {
  const n = Number(num)
  const d = Number(den)
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return 0
  return n / d
}

function toDate(v) {
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v : null
  if (!v) return null

  if (typeof v === 'number') {
    const ms = Date.UTC(1899, 11, 30) + Math.round(v) * 86400000
    const d = new Date(ms)
    return Number.isFinite(d.getTime()) ? d : null
  }

  const ms = Date.parse(String(v))
  if (!Number.isFinite(ms)) return null
  const d = new Date(ms)
  return Number.isFinite(d.getTime()) ? d : null
}

function pickMaxDate(a, b) {
  const da = a instanceof Date ? a : null
  const db = b instanceof Date ? b : null
  if (!da) return db
  if (!db) return da
  return da.getTime() >= db.getTime() ? da : db
}

function pickMinDate(a, b) {
  const da = a instanceof Date ? a : null
  const db = b instanceof Date ? b : null
  if (!da) return db
  if (!db) return da
  return da.getTime() <= db.getTime() ? da : db
}

function monthsDiffCeil(startDate, endDate) {
  const a = startDate instanceof Date ? startDate : null
  const b = endDate instanceof Date ? endDate : null
  if (!a || !b) return 1

  const ay = a.getUTCFullYear()
  const am = a.getUTCMonth() + 1
  const by = b.getUTCFullYear()
  const bm = b.getUTCMonth() + 1

  const total = (by - ay) * 12 + (bm - am) + 1
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

function computeClientMetrics(client, today) {
  const t = today instanceof Date ? today : new Date()

  const totalDeposit = Number(client.totalDeposit || 0)
  const totalWithdrawals = Number(client.totalWithdrawals || 0)
  const netDeposit = Number(client.netDeposit || 0)
  const closedPL = Number(client.closedPL || 0)
  const openPL = Number(client.openPL || 0)
  const totalTrades = Math.floor(Number(client.totalTrades || 0))
  const balance = Number(client.balance || 0)
  const equity = Number(client.equity || 0)
  const firstDeposit = Number(client.firstDeposit || 0)
  const redeposit = Number(client.redeposit || 0)

  const clientTimestamp = toDate(client.clientTimestamp)
  const lastTradeDate = toDate(client.lastTradeDate)
  const lastTransactionDate = toDate(client.lastTransactionDate)
  const lastActivity = lastTradeDate || lastTransactionDate || clientTimestamp

  const recencyDays = diffDays(t, lastTradeDate || lastActivity)
  const recencyScore = recencyScoreFromDays(recencyDays)

  const activeMonths = monthsDiffCeil(clientTimestamp || lastActivity || t, lastTradeDate || lastActivity || t)
  const tradesPerMonth = safeDiv(totalTrades, Math.max(1, activeMonths))
  const roi = safeDiv(closedPL, Math.max(1, totalDeposit))
  const redepositRatio = safeDiv(redeposit, Math.max(1, totalDeposit))
  const capitalCommitment = Number(netDeposit || 0) + Number(equity || 0)
  const consistencyScore = tradesPerMonth * 40 + recencyScore * 30 + redepositRatio * 30
  const momentumScore = recencyScore * 0.6 + tradesPerMonth * 0.4

  return {
    clientId: String(client.clientId || ''),
    clientName: String(client.clientName || ''),
    country: String(client.country || ''),
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
    sourceStatus: String(client.sourceStatus || ''),
    primaryPayoutAmount: Number(client.primaryPayoutAmount || 0),
  }
}

function csvEscape(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function fmt(v, digits = 2) {
  const n = Number(v || 0)
  return Number.isFinite(n) ? n.toFixed(digits) : '0.00'
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function indexOfHeader(headers, name) {
  const i = headers.findIndex((h) => String(h || '').trim().toLowerCase() === name)
  return i
}

function indexOfFirstHeader(headers, names) {
  const list = Array.isArray(names) ? names : []
  for (const name of list) {
    const idx = indexOfHeader(headers, String(name || '').trim().toLowerCase())
    if (idx >= 0) return idx
  }
  return -1
}

function getArrVal(row, idx) {
  if (!Array.isArray(row)) return undefined
  if (!Number.isInteger(idx) || idx < 0) return undefined
  return row[idx]
}

function buildTradersClients(rows, headers) {
  const idx = {
    affiliateId: indexOfHeader(headers, 'affiliate_id'),
    clientId: indexOfHeader(headers, 'client_id'),
    clientName: indexOfHeader(headers, 'client_name'),
    user: indexOfHeader(headers, 'user'),
    country: indexOfHeader(headers, 'country'),
    balance: indexOfHeader(headers, 'balance'),
    equity: indexOfHeader(headers, 'equity'),
    closedPL: indexOfHeader(headers, 'closed_pl'),
    openPL: indexOfHeader(headers, 'open_pl'),
    totalTrades: indexOfHeader(headers, 'trades'),
    firstDeposit: indexOfHeader(headers, 'ftd'),
    redeposit: indexOfHeader(headers, 'rdp'),
    totalDeposit: indexOfHeader(headers, 'deposit'),
    totalWithdrawals: indexOfHeader(headers, 'wd'),
    netDeposit: indexOfHeader(headers, 'net'),
    clientTimestamp: indexOfHeader(headers, 'client_timestamp'),
    lastTradeDate: indexOfHeader(headers, 'ltd_date'),
    lastTransactionDate: indexOfHeader(headers, 'ltt_date'),
  }

  const map = new Map()

  for (const row of rows) {
    const clientId = String(getArrVal(row, idx.clientId) ?? '').trim()
    if (!clientId) continue

    const prev = map.get(clientId) || {
      affiliateId: '',
      clientId,
      clientName: '',
      agentUser: 'Unassigned',
      country: '',
      balance: 0,
      equity: 0,
      closedPL: 0,
      openPL: 0,
      totalTrades: 0,
      firstDeposit: 0,
      redeposit: 0,
      totalDeposit: 0,
      totalWithdrawals: 0,
      netDeposit: 0,
      clientTimestamp: null,
      lastTradeDate: null,
      lastTransactionDate: null,
    }

    const clientName = String(getArrVal(row, idx.clientName) ?? '').trim()
    const country = String(getArrVal(row, idx.country) ?? '').trim()
    const agent = String(getArrVal(row, idx.user) ?? '').trim()

    if (!prev.affiliateId) prev.affiliateId = String(getArrVal(row, idx.affiliateId) ?? '').trim()
    if (clientName.length > prev.clientName.length) prev.clientName = clientName
    if (country && !prev.country) prev.country = country
    if (agent && prev.agentUser === 'Unassigned') prev.agentUser = agent

    prev.balance += parseNumberSafe(getArrVal(row, idx.balance))
    prev.equity += parseNumberSafe(getArrVal(row, idx.equity))
    prev.closedPL += parseNumberSafe(getArrVal(row, idx.closedPL))
    prev.openPL += parseNumberSafe(getArrVal(row, idx.openPL))
    prev.totalTrades += Math.floor(Math.max(0, parseNumberSafe(getArrVal(row, idx.totalTrades))))
    prev.firstDeposit += parseNumberSafe(getArrVal(row, idx.firstDeposit))
    prev.redeposit += parseNumberSafe(getArrVal(row, idx.redeposit))

    const dep = parseNumberSafe(getArrVal(row, idx.totalDeposit))
    const wd = parseNumberSafe(getArrVal(row, idx.totalWithdrawals))
    const netRaw = getArrVal(row, idx.netDeposit)
    const net = netRaw == null || String(netRaw).trim() === '' ? dep - wd : parseNumberSafe(netRaw)

    prev.totalDeposit += dep
    prev.totalWithdrawals += wd
    prev.netDeposit += net

    const ts = toDate(getArrVal(row, idx.clientTimestamp))
    const ltd = toDate(getArrVal(row, idx.lastTradeDate))
    const ltt = toDate(getArrVal(row, idx.lastTransactionDate))

    prev.clientTimestamp = pickMinDate(prev.clientTimestamp, ts)
    prev.lastTradeDate = pickMaxDate(prev.lastTradeDate, pickMaxDate(ltd, ltt))
    prev.lastTransactionDate = pickMaxDate(prev.lastTransactionDate, ltt)

    map.set(clientId, prev)
  }

  return [...map.values()]
}

function buildPrimeClients(rows, headers) {
  const idx = {
    affiliateId: indexOfHeader(headers, 'affiliate_id'),
    brand: indexOfHeader(headers, 'brand'),
    clientId: indexOfHeader(headers, 'client_id'),
    clientName: indexOfHeader(headers, 'client_name'),
    status: indexOfHeader(headers, 'status'),
    country: indexOfHeader(headers, 'country'),
    date: indexOfHeader(headers, 'date'),
    closedPL: indexOfHeader(headers, 'closed_pl'),
    openPL: indexOfHeader(headers, 'open_pl'),
    trades: indexOfHeader(headers, 'trades'),
    openTrades: indexOfHeader(headers, 'open_trades'),
    deposit: indexOfHeader(headers, 'std'),
    wd: indexOfHeader(headers, 'wd'),
    net: indexOfHeader(headers, 'net'),
    ftd: indexOfHeader(headers, 'ftd'),
    rdp: indexOfHeader(headers, 'rdp'),
    clientEmail: indexOfFirstHeader(headers, [
      'client_email',
      'email',
      'e_mail',
      'e-mail',
      'mail',
    ]),
  }

  const byClientId = new Map()

  for (const row of rows) {
    const clientId = String(getArrVal(row, idx.clientId) ?? '').trim()
    if (!clientId) continue

    const prev = byClientId.get(clientId) || {
      affiliateId: '',
      brand: '',
      clientId,
      clientName: '',
      clientEmail: '',
      agentUser: 'Prime Challenge',
      sourceStatus: '',
      country: '',
      balance: 0,
      equity: 0,
      closedPL: 0,
      openPL: 0,
      totalTrades: 0,
      firstDeposit: 0,
      redeposit: 0,
      totalDeposit: 0,
      totalWithdrawals: 0,
      netDeposit: 0,
      payoutCount: 0,
      payoutAmount: 0,
      isPayoutUser: false,
      clientTimestamp: null,
      lastTradeDate: null,
      lastTransactionDate: null,
      lastReportDate: null,
    }

    const clientName = String(getArrVal(row, idx.clientName) ?? '').trim()
    const clientEmail = String(getArrVal(row, idx.clientEmail) ?? '').trim()
    const country = String(getArrVal(row, idx.country) ?? '').trim()
    if (!prev.affiliateId) prev.affiliateId = String(getArrVal(row, idx.affiliateId) ?? '').trim()
    if (!prev.brand) prev.brand = String(getArrVal(row, idx.brand) ?? '').trim()
    if (!prev.sourceStatus) prev.sourceStatus = String(getArrVal(row, idx.status) ?? '').trim()
    if (clientName.length > prev.clientName.length) prev.clientName = clientName
    if (clientEmail) {
      if (!prev.clientEmail) prev.clientEmail = clientEmail
      else if (!String(prev.clientEmail).includes('@') && String(clientEmail).includes('@')) {
        prev.clientEmail = clientEmail
      }
    }
    if (country && country !== '-' && !prev.country) prev.country = country

    const closedPL = parseNumberSafe(getArrVal(row, idx.closedPL))
    const openPL = parseNumberSafe(getArrVal(row, idx.openPL))
    const trades = Math.floor(Math.max(0, parseNumberSafe(getArrVal(row, idx.trades))))
    const openTrades = Math.floor(Math.max(0, parseNumberSafe(getArrVal(row, idx.openTrades))))
    const dep = parseNumberSafe(getArrVal(row, idx.deposit))
    const wd = parseNumberSafe(getArrVal(row, idx.wd))
    const netRaw = getArrVal(row, idx.net)
    const net = netRaw == null || String(netRaw).trim() === '' ? dep - wd : parseNumberSafe(netRaw)

    prev.closedPL += closedPL
    prev.openPL += openPL
    prev.totalTrades += trades
    prev.firstDeposit += parseNumberSafe(getArrVal(row, idx.ftd))
    prev.redeposit += parseNumberSafe(getArrVal(row, idx.rdp))
    prev.totalDeposit += dep
    prev.totalWithdrawals += wd
    prev.netDeposit += net

    const rowDate = toDate(getArrVal(row, idx.date))
    prev.clientTimestamp = pickMinDate(prev.clientTimestamp, rowDate)
    prev.lastReportDate = pickMaxDate(prev.lastReportDate, rowDate)

    const hasActivitySignal =
      trades > 0 || openTrades > 0 || closedPL !== 0 || openPL !== 0 || dep !== 0 || wd !== 0 || net !== 0

    if (hasActivitySignal) {
      prev.lastTradeDate = pickMaxDate(prev.lastTradeDate, rowDate)
      prev.lastTransactionDate = pickMaxDate(prev.lastTransactionDate, rowDate)
    }

    byClientId.set(clientId, prev)
  }

  return [...byClientId.values()]
}

function rankTradersTopPerforming(clients, today) {
  const metrics = clients.map((c) => computeClientMetrics(c, today))
  return metrics
    .filter((m) => Number(m.totalTrades || 0) >= 50 && Number(m.totalDeposit || 0) >= 1000)
    .sort((a, b) => Number(b.closedPL || 0) - Number(a.closedPL || 0))
}

function rankPrimePayoutUsers(clients, today) {
  const base = clients.map((client) => {
    const metric = computeClientMetrics(client, today)
    const primaryPayoutAmount = Number(metric.totalWithdrawals || 0)
    return {
      ...metric,
      sourceStatus: String(client.sourceStatus || ''),
      clientEmail: String(client.clientEmail || ''),
      primaryPayoutAmount,
    }
  })

  return base
    .filter((metric) => Number(metric.primaryPayoutAmount || 0) > 0)
    .sort((a, b) => {
      const payoutDiff = Number(b.primaryPayoutAmount || 0) - Number(a.primaryPayoutAmount || 0)
      if (payoutDiff !== 0) return payoutDiff
      const tradeDiff = Number(b.totalTrades || 0) - Number(a.totalTrades || 0)
      if (tradeDiff !== 0) return tradeDiff
      const closedDiff = Number(b.closedPL || 0) - Number(a.closedPL || 0)
      if (closedDiff !== 0) return closedDiff
      return String(a.clientName || '').localeCompare(String(b.clientName || ''))
    })
}

function main() {
  const root = path.resolve(__dirname, '..')
  const tradersArtifact = loadJson(path.join(root, 'public', 'traders_ranking_rewards_table.json'))
  const primeArtifact = loadJson(path.join(root, 'public', 'prime_clients_ranking_table.json'))

  const tradersRows = Array.isArray(tradersArtifact.rows) ? tradersArtifact.rows : []
  const tradersHeaders = Array.isArray(tradersArtifact.headers) ? tradersArtifact.headers : []
  const primeRows = Array.isArray(primeArtifact.rows) ? primeArtifact.rows : []
  const primeHeaders = Array.isArray(primeArtifact.headers) ? primeArtifact.headers : []

  const tradersClients = buildTradersClients(tradersRows, tradersHeaders)
  const primeClients = buildPrimeClients(primeRows, primeHeaders)

  const today = new Date()
  const tradersRanked = rankTradersTopPerforming(tradersClients, today)
  const primeRanked = rankPrimePayoutUsers(primeClients, today)

  const reportDate = today.toISOString().slice(0, 10)
  const reportsDir = path.join(root, 'reports')
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })

  const mdPath = path.join(reportsDir, `profittevoli_report_${reportDate}.md`)
  const csvTradersPath = path.join(reportsDir, `profittevoli_bullwaves_${reportDate}.csv`)
  const csvPrimePath = path.join(reportsDir, `profittevoli_bullwaves_prime_${reportDate}.csv`)

  const md = []
  md.push(`# Report trader profittevoli - ${reportDate}`)
  md.push('')
  md.push('## Fonte e criteri')
  md.push('- URL Bullwaves: /retention/profitable-ranking')
  md.push('- URL Bullwaves Prime: /prime-challenge/ranking')
  md.push('- Fonte dati: public/traders_ranking_rewards_table.json e public/prime_clients_ranking_table.json')
  md.push('- Criterio Bullwaves: classifica Top Performing (Total Trades >= 50 e Total Deposit >= 1000), ordinata per Closed PL desc')
  md.push('- Criterio Bullwaves Prime: classifica Payout Users con WD/Payout > 0, ordinata per WD/Payout desc, poi Trades, poi Closed PL')
  md.push('')
  md.push('## Sintesi')
  md.push(`- Bullwaves trader profittevoli trovati: ${tradersRanked.length}`)
  md.push(`- Bullwaves Prime trader profittevoli trovati: ${primeRanked.length}`)
  md.push('')

  md.push('## Lista utenti Bullwaves (Top Performing)')
  md.push('| # | Client ID | Nome | Country | Closed PL | Total Trades | Total Deposit |')
  md.push('|---:|---|---|---|---:|---:|---:|')
  tradersRanked.forEach((r, i) => {
    md.push(`| ${i + 1} | ${r.clientId} | ${String(r.clientName || '').replace(/\|/g, '\\|')} | ${String(r.country || '').replace(/\|/g, '\\|')} | ${fmt(r.closedPL)} | ${Math.floor(Number(r.totalTrades || 0))} | ${fmt(r.totalDeposit)} |`)
  })
  md.push('')

  md.push('## Lista utenti Bullwaves Prime (Payout Users)')
  md.push('| # | Client ID | Nome | Email | Country | WD/Payout | Total Trades | Closed PL |')
  md.push('|---:|---|---|---|---|---:|---:|---:|')
  primeRanked.forEach((r, i) => {
    md.push(`| ${i + 1} | ${r.clientId} | ${String(r.clientName || '').replace(/\|/g, '\\|')} | ${String(r.clientEmail || '').replace(/\|/g, '\\|')} | ${String(r.country || '').replace(/\|/g, '\\|')} | ${fmt(r.primaryPayoutAmount)} | ${Math.floor(Number(r.totalTrades || 0))} | ${fmt(r.closedPL)} |`)
  })

  fs.writeFileSync(mdPath, md.join('\n'))

  const tradersCsv = ['rank,client_id,client_name,country,closed_pl,total_trades,total_deposit']
  tradersRanked.forEach((r, i) => {
    tradersCsv.push([
      i + 1,
      csvEscape(r.clientId),
      csvEscape(r.clientName),
      csvEscape(r.country),
      fmt(r.closedPL),
      Math.floor(Number(r.totalTrades || 0)),
      fmt(r.totalDeposit),
    ].join(','))
  })
  fs.writeFileSync(csvTradersPath, tradersCsv.join('\n'))

  const primeCsv = ['rank,client_id,client_name,client_email,country,wd_payout,total_trades,closed_pl']
  primeRanked.forEach((r, i) => {
    primeCsv.push([
      i + 1,
      csvEscape(r.clientId),
      csvEscape(r.clientName),
      csvEscape(r.clientEmail),
      csvEscape(r.country),
      fmt(r.primaryPayoutAmount),
      Math.floor(Number(r.totalTrades || 0)),
      fmt(r.closedPL),
    ].join(','))
  })
  fs.writeFileSync(csvPrimePath, primeCsv.join('\n'))

  console.log(JSON.stringify({
    report: path.relative(root, mdPath),
    bullwavesCsv: path.relative(root, csvTradersPath),
    bullwavesPrimeCsv: path.relative(root, csvPrimePath),
    bullwavesCount: tradersRanked.length,
    bullwavesPrimeCount: primeRanked.length,
    bullwavesTop5: tradersRanked.slice(0, 5).map((r) => ({ clientId: r.clientId, clientName: r.clientName, closedPL: Number(r.closedPL || 0) })),
    primeTop5: primeRanked.slice(0, 5).map((r) => ({ clientId: r.clientId, clientName: r.clientName, wdPayout: Number(r.primaryPayoutAmount || 0) })),
  }, null, 2))
}

main()
