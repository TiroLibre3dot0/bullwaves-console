import { parseNumberSafe, resolveColumn } from './retentionRanking'
import { computeClientMetricsV1 } from './profitableRankingV1'

const COLUMN_VARIANTS = {
  affiliate_id: ['affiliate_id', 'affiliateid'],
  brand: ['brand'],
  client_id: ['client_id', 'clientid', 'id'],
  client_name: ['client_name', 'clientname', 'name', 'client'],
  client_email: ['client_email', 'email', 'e_mail', 'e-mail', 'mail'],
  country: ['country', 'geo'],
  status: ['status', 'client_status', 'account_status'],
  date: ['date', 'day', 'report_date', 'trade_date'],
  year_month: ['year_month', 'yearmonth', 'periodid', 'period_id'],
  closed_pl: ['closed_pl', 'closedpl', 'pl', 'pnl', 'profit_loss'],
  open_pl: ['open_pl', 'openpl'],
  trades: ['trades', '#trades', 'num_trades', 'no_trades'],
  open_trades: ['open_trades', 'opentrades'],
  deposit: ['deposit', 'deposits', 'std'],
  wd: ['wd', 'withdrawal', 'withdrawals'],
  net: ['net', 'net_deposit', 'netdeposit'],
  ftd: ['ftd', 'first_deposit'],
  rdp: ['rdp', 'redeposit', 're_deposit'],
  payout_user: ['payout_user', 'is_payout_user', 'paid_out', 'paidout'],
  payout_count: ['payout_count', 'payouts', 'paid_count'],
  payout_amount: ['payout_amount', 'paid_amount', 'total_payout'],
}

function coerceString(v) {
  return String(v ?? '').trim()
}

function isBlankCell(v) {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return !v.trim()
  return false
}

function parseDateSafe(v) {
  if (v == null || v === '') return null

  if (v instanceof Date) {
    const t = v.getTime()
    return Number.isFinite(t) ? v : null
  }

  const ms = Date.parse(String(v).trim())
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

function coerceBoolean(v) {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return Number.isFinite(v) && v > 0
  const s = String(v ?? '')
    .trim()
    .toLowerCase()
  if (!s) return false
  return ['1', 'true', 'yes', 'y', 'paid', 'payout'].includes(s)
}

function buildHeaderIndex(headers = []) {
  const map = new Map()
  for (let i = 0; i < headers.length; i += 1) {
    const key = String(headers[i] || '').trim()
    if (key) map.set(key, i)
  }
  return map
}

function getRowValue(row, columnName, headerIndex, fallbackKeys = []) {
  if (Array.isArray(row)) {
    const idx = headerIndex.get(String(columnName || '').trim())
    return Number.isInteger(idx) ? row[idx] : undefined
  }

  if (row && typeof row === 'object') {
    if (columnName && Object.prototype.hasOwnProperty.call(row, columnName)) {
      return row[columnName]
    }
    for (const fallbackKey of fallbackKeys) {
      if (Object.prototype.hasOwnProperty.call(row, fallbackKey)) {
        return row[fallbackKey]
      }
    }
  }

  return undefined
}

function hasActivitySignal({ trades, openTrades, closedPL, openPL, deposit, wd, net }) {
  return (
    Number(trades || 0) > 0 ||
    Number(openTrades || 0) > 0 ||
    Number(closedPL || 0) !== 0 ||
    Number(openPL || 0) !== 0 ||
    Number(deposit || 0) !== 0 ||
    Number(wd || 0) !== 0 ||
    Number(net || 0) !== 0
  )
}

function hasPrimePayoutSignal(metric) {
  const explicitPayout =
    Boolean(metric?.isPayoutUser) ||
    Number(metric?.payoutCount || 0) > 0 ||
    Number(metric?.payoutAmount || 0) > 0

  const positivePL =
    Number(metric?.closedPL || 0) > 0 ||
    Number(metric?.closedPL || 0) + Number(metric?.openPL || 0) > 0

  return explicitPayout || positivePL
}

function payoutSignalLabel(metric) {
  const explicitPayout =
    Boolean(metric?.isPayoutUser) ||
    Number(metric?.payoutCount || 0) > 0 ||
    Number(metric?.payoutAmount || 0) > 0
  const positivePL =
    Number(metric?.closedPL || 0) > 0 ||
    Number(metric?.closedPL || 0) + Number(metric?.openPL || 0) > 0

  if (explicitPayout && positivePL) return 'Payout + Positive P&L'
  if (explicitPayout) return 'Payout User'
  if (positivePL) return 'Positive P&L'
  return 'No Payout Signal'
}

export function buildPrimeClientsRankingDataset({ rows = [], headers = [] } = {}) {
  const safeRows = Array.isArray(rows) ? rows : []
  const safeHeaders =
    Array.isArray(headers) && headers.length ? headers : Object.keys(safeRows[0] || {})
  const headerIndex = buildHeaderIndex(safeHeaders)

  const schema = {}
  for (const canonical of Object.keys(COLUMN_VARIANTS)) {
    schema[canonical] = resolveColumn(safeHeaders, canonical, COLUMN_VARIANTS)
  }

  const required = ['client_id', 'client_name', 'closed_pl', 'trades']
  const missingFields = required.filter((k) => !schema[k])

  const byClientId = new Map()
  const countriesSet = new Set()

  for (const row of safeRows) {
    const clientId = coerceString(
      getRowValue(row, schema.client_id, headerIndex, ['clientId', 'client_id'])
    )
    if (!clientId) continue

    const prev = byClientId.get(clientId)
    const clientName = coerceString(
      getRowValue(row, schema.client_name, headerIndex, ['clientName', 'client_name'])
    )
    const clientEmail = coerceString(
      getRowValue(row, schema.client_email, headerIndex, ['clientEmail', 'client_email', 'email'])
    )
    const country = coerceString(getRowValue(row, schema.country, headerIndex, ['country']))
    if (country && country !== '-') countriesSet.add(country)

    const next = prev
      ? { ...prev }
      : {
          affiliateId: '',
          brand: '',
          clientId,
          clientName: clientName || '',
          clientEmail: '',
          agentUser: 'Prime Challenge',
          sourceStatus: '',
          country: country && country !== '-' ? country : '',
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

    if (!next.affiliateId) {
      next.affiliateId = coerceString(getRowValue(row, schema.affiliate_id, headerIndex))
    }
    if (!next.brand) next.brand = coerceString(getRowValue(row, schema.brand, headerIndex))
    if (!next.sourceStatus) {
      next.sourceStatus = coerceString(getRowValue(row, schema.status, headerIndex))
    }
    if (clientName && clientName.length > next.clientName.length) next.clientName = clientName
    if (clientEmail) {
      if (!next.clientEmail) next.clientEmail = clientEmail
      else if (!String(next.clientEmail).includes('@') && String(clientEmail).includes('@')) {
        next.clientEmail = clientEmail
      }
    }
    if (country && country !== '-' && !next.country) next.country = country

    const closedPL = parseNumberSafe(
      getRowValue(row, schema.closed_pl, headerIndex, ['closed_pl', 'pl'])
    )
    const openPL = parseNumberSafe(getRowValue(row, schema.open_pl, headerIndex, ['open_pl']))
    const trades = Math.floor(
      Math.max(
        0,
        parseNumberSafe(getRowValue(row, schema.trades, headerIndex, ['totalTrades', 'trades']))
      )
    )
    const openTrades = Math.floor(
      Math.max(
        0,
        parseNumberSafe(
          getRowValue(row, schema.open_trades, headerIndex, ['openTrades', 'open_trades'])
        )
      )
    )
    const deposit = parseNumberSafe(
      getRowValue(row, schema.deposit, headerIndex, ['deposit', 'std'])
    )
    const wd = parseNumberSafe(getRowValue(row, schema.wd, headerIndex, ['wd']))

    let net
    if (schema.net) {
      const rawNet = getRowValue(row, schema.net, headerIndex, ['netDeposit', 'net'])
      net = isBlankCell(rawNet) ? deposit - wd : parseNumberSafe(rawNet)
    } else {
      net = deposit - wd
    }

    next.closedPL += closedPL
    next.openPL += openPL
    next.totalTrades += trades
    next.firstDeposit += parseNumberSafe(getRowValue(row, schema.ftd, headerIndex, ['ftd']))
    next.redeposit += parseNumberSafe(getRowValue(row, schema.rdp, headerIndex, ['rdp']))
    next.totalDeposit += deposit
    next.totalWithdrawals += wd
    next.netDeposit += net

    const payoutCount = parseNumberSafe(
      getRowValue(row, schema.payout_count, headerIndex, ['payout_count'])
    )
    const payoutAmount = parseNumberSafe(
      getRowValue(row, schema.payout_amount, headerIndex, ['payout_amount'])
    )
    next.payoutCount += Math.floor(Math.max(0, payoutCount))
    next.payoutAmount += payoutAmount
    next.isPayoutUser =
      next.isPayoutUser ||
      coerceBoolean(getRowValue(row, schema.payout_user, headerIndex, ['payout_user'])) ||
      payoutCount > 0 ||
      payoutAmount > 0

    const rowDate = parseDateSafe(
      getRowValue(row, schema.date, headerIndex, ['date', 'year_month'])
    )
    next.clientTimestamp = pickMinDate(next.clientTimestamp, rowDate)
    next.lastReportDate = pickMaxDate(next.lastReportDate, rowDate)

    if (
      hasActivitySignal({
        trades,
        openTrades,
        closedPL,
        openPL,
        deposit,
        wd,
        net,
      })
    ) {
      next.lastTradeDate = pickMaxDate(next.lastTradeDate, rowDate)
      next.lastTransactionDate = pickMaxDate(next.lastTransactionDate, rowDate)
    }

    byClientId.set(clientId, next)
  }

  const clients = [...byClientId.values()]
  const countries = [...countriesSet].sort((a, b) => a.localeCompare(b))

  return {
    kind: 'prime-clients-ranking',
    schema,
    missingFields,
    rowCount: safeRows.length,
    clientCount: clients.length,
    countries,
    clients,
  }
}

export function buildPrimeRankingsV1({
  dataset,
  minTrades = 0,
  countries = [],
  activityRecencyDays = 0,
  onlyPositivePayout = false,
  minPositivePayout = 0,
  today,
} = {}) {
  const list = Array.isArray(dataset?.clients) ? dataset.clients : []
  const t = today instanceof Date ? today : new Date()

  const base = []
  const allowedCountries = Array.isArray(countries) ? countries : []

  for (const client of list) {
    const metric = computeClientMetricsV1({ client, today: t })
    if (allowedCountries.length) {
      const country = String(metric?.country || '').trim()
      if (!country || !allowedCountries.includes(country)) continue
    }

    if (Number(metric.totalTrades || 0) < Number(minTrades || 0)) continue

    const maxDays = Number(activityRecencyDays || 0)
    if (maxDays > 0) {
      const d = Number(metric.recencyDays)
      if (!Number.isFinite(d) || d > maxDays) continue
    }

    const explicitPayoutAmount = Number(client?.payoutAmount || 0)
    const fallbackWithdrawals = Number(metric?.totalWithdrawals || client?.totalWithdrawals || 0)
    const primaryPayoutAmount =
      explicitPayoutAmount > 0 ? explicitPayoutAmount : fallbackWithdrawals

    base.push({
      ...metric,
      clientEmail: String(client?.clientEmail || '').trim(),
      brand: String(client?.brand || '').trim(),
      sourceStatus: String(client?.sourceStatus || '').trim(),
      payoutCount: Number(client?.payoutCount || 0),
      payoutAmount: primaryPayoutAmount,
      primaryPayoutAmount,
      totalWithdrawals: primaryPayoutAmount,
      isPayoutUser: Boolean(client?.isPayoutUser),
      lastReportDate: client?.lastReportDate || null,
    })
  }

  const payoutUsers = base
    .filter((metric) => hasPrimePayoutSignal(metric))
    .filter((metric) => {
      const payout = Number(metric?.primaryPayoutAmount || 0)
      if (onlyPositivePayout && payout <= 0) return false
      if (Number(minPositivePayout || 0) > 0 && payout < Number(minPositivePayout || 0)) {
        return false
      }
      return true
    })
    .map((metric) => ({
      ...metric,
      payoutSignalLabel: payoutSignalLabel(metric),
    }))
    .sort((a, b) => {
      const payoutDiff = Number(b.primaryPayoutAmount || 0) - Number(a.primaryPayoutAmount || 0)
      if (payoutDiff !== 0) return payoutDiff
      const tradeDiff = Number(b.totalTrades || 0) - Number(a.totalTrades || 0)
      if (tradeDiff !== 0) return tradeDiff
      const closedDiff = Number(b.closedPL || 0) - Number(a.closedPL || 0)
      if (closedDiff !== 0) return closedDiff
      return String(a.clientName || '').localeCompare(String(b.clientName || ''))
    })

  const summary = payoutUsers.reduce(
    (acc, metric) => {
      acc.totalTraders += 1
      acc.totalTrades += Number(metric.totalTrades || 0)
      acc.totalClosedPL += Number(metric.closedPL || 0)
      acc.totalNetDeposits += Number(metric.netDeposit || 0)
      acc.totalPayoutAmount += Number(metric.primaryPayoutAmount || 0)
      return acc
    },
    {
      totalTraders: 0,
      totalTrades: 0,
      totalClosedPL: 0,
      totalNetDeposits: 0,
      totalPayoutAmount: 0,
    }
  )

  return {
    summary,
    metrics: base,
    rankingsByKey: {
      payout_users: payoutUsers,
    },
  }
}
