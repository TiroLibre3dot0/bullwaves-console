import { normalizeHeader, parseNumberSafe, resolveColumn } from './retentionRanking'

const COLUMN_VARIANTS = {
  affiliate_id: ['affiliate_id', 'affiliateid'],
  client_id: ['client_id', 'clientid', 'id'],
  client_name: ['client_name', 'clientname', 'name', 'client'],
  client_login: ['client_login', 'clientlogin', 'login'],
  user: ['user'],
  country: ['country'],

  balance: ['balance', '$balance'],
  equity: ['equity', '$equity'],

  closed_pl: ['closed_pl', 'closedpl', 'closed_pnl', 'pnl_closed'],
  open_pl: ['open_pl', 'openpl', 'open_pnl', 'pnl_open'],

  trades: ['trades', '#trades', 'num_trades', 'no_trades'],

  ftd: ['ftd', 'first_deposit'],
  rdp: ['rdp', 'redeposit', 're_deposit'],

  deposit: ['deposit', 'deposits', 'total_deposit'],
  wd: ['wd', 'withdrawal', 'withdrawals'],
  net: ['net', 'net_deposit', 'netdeposit'],

  deposit_count: [
    'deposit_count',
    'deposits_count',
    'num_deposits',
    'number_of_deposits',
    '#deposits',
    'deposits#',
  ],

  client_timestamp: ['client_timestamp', 'clienttimestamp', 'timestamp', 'client_ts'],
  ltd_date: ['ltd_date', 'last_trade_date', 'lasttradedate'],
  ltt_date: ['ltt_date', 'last_transaction_date', 'lasttransactiondate'],

  clients_p: ['clients_p', 'clients(p)', 'clients_p_1'],
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

  if (typeof v === 'number') {
    // Excel serial date (days since 1899-12-30)
    const ms = Date.UTC(1899, 11, 30) + Math.round(v) * 86400000
    const d = new Date(ms)
    return Number.isFinite(d.getTime()) ? d : null
  }

  const s0 = String(v).trim()
  if (!s0) return null
  if (s0 === '-' || s0 === '—') return null

  const s = s0.replace(/\s+/g, ' ')
  if (!s) return null

  // ISO is the best case
  const msIso = Date.parse(s)
  if (Number.isFinite(msIso)) {
    const d = new Date(msIso)
    return Number.isFinite(d.getTime()) ? d : null
  }

  // Common XLSX-export format: 'YYYY-MM-DD HH:mm:ss' (not always parseable by Date.parse)
  const mIsoLike = s.match(
    /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (mIsoLike) {
    const y = Math.floor(Number(mIsoLike[1]))
    const mo = Math.floor(Number(mIsoLike[2]))
    const d0 = Math.floor(Number(mIsoLike[3]))
    const hh = mIsoLike[4] != null ? Math.floor(Number(mIsoLike[4])) : 0
    const mm = mIsoLike[5] != null ? Math.floor(Number(mIsoLike[5])) : 0
    const ss = mIsoLike[6] != null ? Math.floor(Number(mIsoLike[6])) : 0
    if (
      Number.isFinite(y) &&
      Number.isFinite(mo) &&
      Number.isFinite(d0) &&
      y > 1900 &&
      y < 3000 &&
      mo >= 1 &&
      mo <= 12 &&
      d0 >= 1 &&
      d0 <= 31 &&
      hh >= 0 &&
      hh <= 23 &&
      mm >= 0 &&
      mm <= 59 &&
      ss >= 0 &&
      ss <= 59
    ) {
      const ms = Date.UTC(y, mo - 1, d0, hh, mm, ss)
      const d = new Date(ms)
      return Number.isFinite(d.getTime()) ? d : null
    }
  }

  // Fallback: 'DD/MM/YYYY' or 'DD-MM-YYYY'
  const mDmy = s.match(
    /^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (mDmy) {
    const dd = Math.floor(Number(mDmy[1]))
    const mo = Math.floor(Number(mDmy[2]))
    let y = Math.floor(Number(mDmy[3]))
    const hh = mDmy[4] != null ? Math.floor(Number(mDmy[4])) : 0
    const mm = mDmy[5] != null ? Math.floor(Number(mDmy[5])) : 0
    const ss = mDmy[6] != null ? Math.floor(Number(mDmy[6])) : 0
    if (y >= 0 && y < 100) y = y + 2000
    if (
      Number.isFinite(y) &&
      Number.isFinite(mo) &&
      Number.isFinite(dd) &&
      y > 1900 &&
      y < 3000 &&
      mo >= 1 &&
      mo <= 12 &&
      dd >= 1 &&
      dd <= 31 &&
      hh >= 0 &&
      hh <= 23 &&
      mm >= 0 &&
      mm <= 59 &&
      ss >= 0 &&
      ss <= 59
    ) {
      const ms = Date.UTC(y, mo - 1, dd, hh, mm, ss)
      const d = new Date(ms)
      return Number.isFinite(d.getTime()) ? d : null
    }
  }

  return null
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

export function buildTradersRankingRewardsDataset({ rows = [], headers = [] } = {}) {
  const safeRows = Array.isArray(rows) ? rows : []
  const safeHeaders =
    Array.isArray(headers) && headers.length ? headers : Object.keys(safeRows[0] || {})

  const schema = {}
  for (const canonical of Object.keys(COLUMN_VARIANTS)) {
    schema[canonical] = resolveColumn(safeHeaders, canonical, COLUMN_VARIANTS)
  }

  const required = [
    'client_id',
    'client_name',
    'country',
    'deposit',
    'wd',
    'net',
    'closed_pl',
    'trades',
    'equity',
    'rdp',
    'ltd_date',
  ]

  const missingFields = required.filter((k) => !schema[k])

  const hasDepositCountColumn =
    Boolean(schema.deposit_count) ||
    safeRows.some((row) =>
      row && typeof row === 'object' ? row.depositCount != null || row.deposit_count != null : false
    )

  const byClientId = new Map()
  const countriesSet = new Set()
  const agentUsersSet = new Set()

  for (const row of safeRows) {
    const clientId = coerceString(row?.[schema.client_id] ?? row?.clientId ?? row?.client_id)
    if (!clientId) continue

    const prev = byClientId.get(clientId)

    const clientName = coerceString(
      row?.[schema.client_name] ?? row?.clientName ?? row?.client_name
    )
    const country = coerceString(row?.[schema.country] ?? row?.country)
    if (country) countriesSet.add(country)

    const next = prev
      ? { ...prev }
      : {
          affiliateId: '',
          clientId,
          clientName: clientName || '',
          clientLogin: '',
          user: '',
          agentUser: 'Unassigned',
          country: country || '',

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

          ...(hasDepositCountColumn ? { depositCount: 0 } : {}),

          clientTimestamp: null,
          lastTradeDate: null,
          lastTransactionDate: null,

          clientsP: 0,
        }

    if (hasDepositCountColumn && !Number.isFinite(Number(next.depositCount))) {
      next.depositCount = 0
    }

    if (!next.affiliateId)
      next.affiliateId = coerceString(row?.[schema.affiliate_id] ?? row?.affiliateId)
    if (!next.clientLogin)
      next.clientLogin = coerceString(row?.[schema.client_login] ?? row?.clientLogin)
    if (!next.user) next.user = coerceString(row?.[schema.user] ?? row?.user)

    const agentRaw = coerceString(row?.[schema.user] ?? row?.user ?? row?.User)
    const agentUser = agentRaw || 'Unassigned'
    if (agentUser && agentUser !== 'Unassigned') {
      if (!next.agentUser || next.agentUser === 'Unassigned') next.agentUser = agentUser
    } else if (!next.agentUser) {
      next.agentUser = 'Unassigned'
    }

    if (clientName && clientName.length > next.clientName.length) next.clientName = clientName
    if (country && !next.country) next.country = country

    next.balance += parseNumberSafe(row?.[schema.balance] ?? row?.balance)
    next.equity += parseNumberSafe(row?.[schema.equity] ?? row?.equity)

    next.closedPL += parseNumberSafe(row?.[schema.closed_pl] ?? row?.closedPL ?? row?.closed_pl)
    next.openPL += parseNumberSafe(row?.[schema.open_pl] ?? row?.openPL ?? row?.open_pl)

    next.totalTrades += Math.floor(
      Math.max(0, parseNumberSafe(row?.[schema.trades] ?? row?.totalTrades ?? row?.trades))
    )

    next.firstDeposit += parseNumberSafe(row?.[schema.ftd] ?? row?.firstDeposit ?? row?.ftd)
    next.redeposit += parseNumberSafe(row?.[schema.rdp] ?? row?.redeposit ?? row?.rdp)

    const dep = parseNumberSafe(row?.[schema.deposit] ?? row?.totalDeposit ?? row?.deposit)
    const wd = parseNumberSafe(row?.[schema.wd] ?? row?.totalWithdrawals ?? row?.wd)

    // Net Deposit handling (raw-first, but no blanks):
    // - If the dataset provides `net` for the row, use it.
    // - If it's missing/blank (or the column is absent), derive net = deposit - withdrawals.
    let netRow
    if (schema.net) {
      const rawNet = row?.[schema.net] ?? row?.netDeposit ?? row?.net
      netRow = isBlankCell(rawNet) ? dep - wd : parseNumberSafe(rawNet)
    } else {
      const rawNet = row?.netDeposit ?? row?.net
      netRow = isBlankCell(rawNet) ? dep - wd : parseNumberSafe(rawNet)
    }

    next.totalDeposit += dep
    next.totalWithdrawals += wd
    next.netDeposit += netRow

    if (hasDepositCountColumn) {
      next.depositCount += Math.floor(
        Math.max(
          0,
          parseNumberSafe(row?.[schema.deposit_count] ?? row?.depositCount ?? row?.deposit_count)
        )
      )
    }

    next.clientsP += Math.floor(
      Math.max(0, parseNumberSafe(row?.[schema.clients_p] ?? row?.clientsP ?? row?.clients_p))
    )

    const ts = parseDateSafe(
      row?.[schema.client_timestamp] ?? row?.clientTimestamp ?? row?.client_timestamp
    )
    const ltd = parseDateSafe(row?.[schema.ltd_date] ?? row?.lastTradeDate ?? row?.ltd_date)
    const ltt = parseDateSafe(row?.[schema.ltt_date] ?? row?.lastTransactionDate ?? row?.ltt_date)

    next.clientTimestamp = pickMinDate(next.clientTimestamp, ts)

    // In some exports, the last-trade signal can be present in either ltd_date or ltt_date.
    // Keep a strict max aggregation, but allow ltt_date to contribute to lastTradeDate.
    const lastTradeCandidate = pickMaxDate(ltd, ltt)
    next.lastTradeDate = pickMaxDate(next.lastTradeDate, lastTradeCandidate)
    next.lastTransactionDate = pickMaxDate(next.lastTransactionDate, ltt)

    const finalAgent = coerceString(next.agentUser) || 'Unassigned'
    next.agentUser = finalAgent
    agentUsersSet.add(finalAgent)

    byClientId.set(clientId, next)
  }

  const clients = [...byClientId.values()]

  const countries = [...countriesSet].sort((a, b) => a.localeCompare(b))
  const agentUsers = [...agentUsersSet].sort((a, b) => a.localeCompare(b))

  return {
    kind: 'traders-ranking-rewards',
    schema,
    missingFields,
    rowCount: safeRows.length,
    clientCount: clients.length,
    countries,
    agentUsers,
    clients,
  }
}

export function inferSheetHeaders(headers) {
  // Convenience: normalize for UI display if needed
  return (Array.isArray(headers) ? headers : []).map((h) => normalizeHeader(h))
}
