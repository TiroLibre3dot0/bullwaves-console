import { useEffect, useMemo, useState } from 'react'
import FullPageLoader from '../../../components/FullPageLoader'
import KpiCard from '../../../components/common/KpiCard'
import { useI18n } from '../../../i18n/I18nContext'
import { loadCreolabsClientsTable, loadCreolabsIndex } from '../services/creolabsService'

const BOARD_CONFIG = {
  net: {
    pillLabel: 'Net',
    title: 'Top Net',
    helper: 'Top clients by $ Net for the selected month.',
    metricLabel: '$ Net',
    metricKey: 'net',
  },
  pl: {
    pillLabel: 'P&L',
    title: 'Top P&L',
    helper: 'Top clients by $ PL for the selected month.',
    metricLabel: '$ PL',
    metricKey: 'pl',
  },
  deposit: {
    pillLabel: 'Deposits',
    title: 'Top Deposits',
    helper: 'Top clients by $ Deposit for the selected month.',
    metricLabel: '$ Deposit',
    metricKey: 'deposit',
  },
  trades: {
    pillLabel: 'Trades',
    title: 'Top Trades',
    helper: 'Top clients by # Trades for the selected month.',
    metricLabel: 'Trades',
    metricKey: 'trades',
    isCount: true,
  },
}

const numberFmt0 = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const numberFmt2 = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatMoneyLike(v) {
  const n = Number(v || 0)
  return numberFmt0.format(Math.round(n))
}

function formatRatioPct(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '—'
  return `${numberFmt2.format(n * 100)}%`
}

function clamp(n, min, max) {
  const v = Number(n)
  if (!Number.isFinite(v)) return min
  return Math.max(min, Math.min(max, v))
}

function computeMockWinRate(trades) {
  const pc = Math.max(0, Math.floor(Number(trades) || 0))
  const raw = ((pc % 60) + 10) / 100
  return clamp(raw, 0.05, 0.85)
}

function getWinRateTone(winRate) {
  const pct = (Number(winRate) || 0) * 100
  if (pct < 35) return 'bad'
  if (pct < 50) return 'warn'
  if (pct < 60) return 'mid'
  return 'good'
}

function getInitials(name) {
  const s = String(name || '').trim()
  if (!s) return ''
  const parts = s
    .split(/\s+/g)
    .map((p) => p.trim())
    .filter(Boolean)
  if (!parts.length) return ''
  const a = parts[0]?.[0] || ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : ''
  const out = `${a}${b}`.toUpperCase()
  return out.slice(0, 2)
}

function getRowKey(r) {
  const id = String(r?.clientId || '').trim()
  const login = String(r?.clientLogin || '').trim()
  const base = `${id}-${login}`
  if (base !== '-') return base
  const name = String(r?.clientName || '').trim()
  return name ? `name-${name}` : 'row'
}

function getRankClass(rank) {
  if (rank === 1) return 'ranking-top1'
  if (rank === 2) return 'ranking-top2'
  if (rank === 3) return 'ranking-top3'
  return ''
}

function getRowClass(isSelected) {
  return isSelected ? 'ranking-selected' : ''
}

function sortDescNumber(a, b) {
  const av = Number(a || 0)
  const bv = Number(b || 0)
  return (Number.isFinite(bv) ? bv : 0) - (Number.isFinite(av) ? av : 0)
}

const MONTHS = [
  { id: 'jan', label: 'Jan', n: 1 },
  { id: 'feb', label: 'Feb', n: 2 },
  { id: 'mar', label: 'Mar', n: 3 },
  { id: 'apr', label: 'Apr', n: 4 },
  { id: 'may', label: 'May', n: 5 },
  { id: 'jun', label: 'Jun', n: 6 },
  { id: 'jul', label: 'Jul', n: 7 },
  { id: 'aug', label: 'Aug', n: 8 },
  { id: 'sep', label: 'Sep', n: 9 },
  { id: 'oct', label: 'Oct', n: 10 },
  { id: 'nov', label: 'Nov', n: 11 },
  { id: 'dec', label: 'Dec', n: 12 },
]

const RANGE_PRESETS = [
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
  { id: '6m', label: '6M' },
  { id: '12m', label: '12M' },
  { id: 'ytd', label: 'YTD' },
]

function parsePeriodId(periodId) {
  const s = String(periodId || '').trim()
  if (!s) return null

  const m1 = s.match(/^(\d{4})[-\s]?([A-Za-z]{3,})$/)
  if (m1) {
    const year = Number(m1[1])
    const monRaw = m1[2].slice(0, 3).toLowerCase()
    const mon = MONTHS.find((x) => x.id === monRaw)
    if (!year || !mon) return null
    return { year, month: mon.n, monthId: mon.id, monthLabel: mon.label }
  }

  const m2 = s.match(/^(\d{4})[-\s]?(\d{1,2})$/)
  if (m2) {
    const year = Number(m2[1])
    const month = Number(m2[2])
    const mon = MONTHS.find((x) => x.n === month)
    if (!year || !mon) return null
    return { year, month: mon.n, monthId: mon.id, monthLabel: mon.label }
  }

  return null
}

function formatPeriodLabel(periodId) {
  const p = parsePeriodId(periodId)
  if (!p) return String(periodId || '')
  return `${p.monthLabel} ${p.year}`
}

function resolveRangePreset(periodIds, presetId) {
  const ids = Array.isArray(periodIds) ? periodIds : []
  if (!ids.length) return null

  const lastIdx = ids.length - 1
  const lastId = ids[lastIdx]
  const latest = parsePeriodId(lastId)

  const byMonths = (months) => {
    const startIdx = Math.max(0, lastIdx - (months - 1))
    return {
      startId: ids[startIdx],
      endId: lastId,
    }
  }

  if (presetId === '1m') return byMonths(1)
  if (presetId === '3m') return byMonths(3)
  if (presetId === '6m') return byMonths(6)
  if (presetId === '12m') return byMonths(12)

  if (presetId === 'ytd' && latest?.year) {
    const firstInYear = ids.find((id) => parsePeriodId(id)?.year === latest.year)
    if (firstInYear) {
      return {
        startId: firstInYear,
        endId: lastId,
      }
    }
  }

  return null
}

function getClientStableKey(r) {
  const id = String(r?.clientId || '').trim()
  const login = String(r?.clientLogin || '').trim()
  const base = `${id}-${login}`
  if (base !== '-') return base
  const name = String(r?.clientName || '').trim()
  return name ? `name-${name}` : 'row'
}

function aggregateClientsRows({ tableRows = [], activePeriodIds = [] }) {
  const set = new Set(activePeriodIds)
  const byClient = new Map()

  for (const row of tableRows) {
    const pid = String(row?.periodId || '').trim()
    if (!pid || !set.has(pid)) continue

    const stableKey = getClientStableKey(row)
    if (!stableKey) continue

    let agg = byClient.get(stableKey)
    if (!agg) {
      agg = {
        clientId: row?.clientId,
        clientLogin: row?.clientLogin,
        clientName: row?.clientName,
        affiliateId: row?.affiliateId,
        country: row?.country,
        brand: row?.brand,
        deposit: 0,
        wd: 0,
        net: 0,
        pl: 0,
        trades: 0,
        balance: 0,
      }
      byClient.set(stableKey, agg)
    }

    const deposit = Number(row?.deposit || 0)
    const wd = Number(row?.wd || 0)
    const net = Number(row?.net || 0)
    const pl = Number(row?.pl || 0)
    const trades = Math.max(0, Math.floor(Number(row?.trades) || 0))
    const balance = Number(row?.balance || 0)

    agg.deposit += Number.isFinite(deposit) ? deposit : 0
    agg.wd += Number.isFinite(wd) ? wd : 0
    agg.net += Number.isFinite(net) ? net : 0
    agg.pl += Number.isFinite(pl) ? pl : 0
    agg.trades += Number.isFinite(trades) ? trades : 0
    if (balance) agg.balance = balance
  }

  const out = [...byClient.values()]
  for (const r of out) {
    const denom = Number(r.net || 0)
    r.plPctNet = denom ? r.pl / denom : 0
  }
  return out
}

export default function CreolabsPage() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(null)

  const [clientsTable, setClientsTable] = useState(null)

  const [periodId, setPeriodId] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [query, setQuery] = useState('')
  const [selectedRowKey, setSelectedRowKey] = useState('')

  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [isCustomRange, setIsCustomRange] = useState(false)
  const [rangeStartId, setRangeStartId] = useState('')
  const [rangeEndId, setRangeEndId] = useState('')
  const [selectedRangePreset, setSelectedRangePreset] = useState('')

  const reload = async ({ force = false } = {}) => {
    setError('')
    try {
      const creolabs = await loadCreolabsIndex({ force })
      setIndex(creolabs)
    } catch (e) {
      setError(e?.message || 'Unable to load Creolabs')
      setIndex(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await reload({ force: false })
    })()

    const onUpdated = () => reload({ force: true })
    window.addEventListener('bw-reports-updated', onUpdated)
    return () => {
      cancelled = true
      window.removeEventListener('bw-reports-updated', onUpdated)
    }
  }, [])

  const periodPills = useMemo(() => {
    const rp = Array.isArray(index?.reportPeriods) ? index.reportPeriods : []
    return rp.map((p) => ({ id: p?.id, label: p?.label })).filter((p) => p.id && p.label)
  }, [index])

  const allPeriodIds = useMemo(() => periodPills.map((p) => p.id), [periodPills])

  const years = useMemo(() => {
    const ys = new Set()
    for (const p of periodPills) {
      const parsed = parsePeriodId(p.id)
      if (parsed?.year) ys.add(parsed.year)
    }
    return [...ys].sort((a, b) => a - b)
  }, [periodPills])

  const availableMonthsForSelectedYear = useMemo(() => {
    const y = Number(selectedYear)
    const set = new Set()
    for (const p of periodPills) {
      const parsed = parsePeriodId(p.id)
      if (!parsed) continue
      if (selectedYear && parsed.year !== y) continue
      set.add(parsed.monthId)
    }
    return MONTHS.filter((m) => set.has(m.id))
  }, [periodPills, selectedYear])

  useEffect(() => {
    if (periodId) return
    if (!periodPills.length) return
    setPeriodId(periodPills[periodPills.length - 1].id)
  }, [periodId, periodPills])

  useEffect(() => {
    if (!years.length) return

    if (!selectedYear) {
      setSelectedYear(String(years[years.length - 1]))
      return
    }

    const y = Number(selectedYear)
    if (!Number.isFinite(y)) return

    if (!selectedMonth) {
      // Default to latest available month within selected year.
      const perInYear = periodPills.filter((p) => parsePeriodId(p.id)?.year === y).map((p) => p.id)
      const latest = perInYear.length ? perInYear[perInYear.length - 1] : ''
      const parsed = parsePeriodId(latest)
      if (parsed?.monthId) setSelectedMonth(parsed.monthId)
    }
  }, [periodPills, selectedMonth, selectedYear, years])

  useEffect(() => {
    if (!allPeriodIds.length) return
    if (rangeStartId && rangeEndId) return
    setRangeStartId(allPeriodIds[0])
    setRangeEndId(allPeriodIds[allPeriodIds.length - 1])
  }, [allPeriodIds, rangeEndId, rangeStartId])

  // Keep periodId in sync for the single-month case.
  useEffect(() => {
    if (isCustomRange) return
    if (!selectedYear || !selectedMonth || selectedMonth === 'all') return

    const y = Number(selectedYear)
    const match = periodPills.find((p) => {
      const parsed = parsePeriodId(p.id)
      return parsed?.year === y && parsed?.monthId === selectedMonth
    })

    if (match?.id) setPeriodId(match.id)
  }, [isCustomRange, periodPills, selectedMonth, selectedYear])

  const boards = useMemo(() => {
    const order = index?.leaderboardOrder || []
    const per = index?.leaderboards?.[periodId] || null
    if (!per) return []
    const ids = order.length ? order : Object.keys(per)
    return ids.filter((id) => per[id] && BOARD_CONFIG[id])
  }, [index, periodId])

  useEffect(() => {
    if (!boards.length) {
      if (selectedBoardId) setSelectedBoardId('')
      return
    }
    if (!selectedBoardId || !boards.includes(selectedBoardId)) {
      setSelectedBoardId(boards[0])
    }
  }, [boards, selectedBoardId])

  const leaderboardsForPeriod = index?.leaderboards?.[periodId] || {}
  const activeBoardId = selectedBoardId || boards[0] || ''
  const activeCfg = activeBoardId ? BOARD_CONFIG[activeBoardId] : null

  const activePeriodIds = useMemo(() => {
    if (!periodPills.length) return []

    if (isCustomRange) {
      const a = String(rangeStartId || '').trim()
      const b = String(rangeEndId || '').trim()
      const ia = allPeriodIds.indexOf(a)
      const ib = allPeriodIds.indexOf(b)
      if (ia === -1 || ib === -1) return [periodId].filter(Boolean)
      const start = Math.min(ia, ib)
      const end = Math.max(ia, ib)
      return allPeriodIds.slice(start, end + 1)
    }

    const y = Number(selectedYear)
    const month = String(selectedMonth || '')
    if (selectedYear && Number.isFinite(y) && month === 'all') {
      return allPeriodIds.filter((id) => parsePeriodId(id)?.year === y)
    }

    if (selectedYear && Number.isFinite(y) && month && month !== 'all') {
      const match = allPeriodIds.find((id) => {
        const p = parsePeriodId(id)
        return p?.year === y && p?.monthId === month
      })
      return match ? [match] : [periodId].filter(Boolean)
    }

    if (!selectedYear && month && month !== 'all') {
      return allPeriodIds.filter((id) => parsePeriodId(id)?.monthId === month)
    }

    return [periodId].filter(Boolean)
  }, [
    allPeriodIds,
    isCustomRange,
    periodId,
    periodPills.length,
    rangeEndId,
    rangeStartId,
    selectedMonth,
    selectedYear,
  ])

  const activeRangeLabel = useMemo(() => {
    if (!activePeriodIds.length) return 'No period selected'
    const first = activePeriodIds[0]
    const last = activePeriodIds[activePeriodIds.length - 1]
    if (first === last) return formatPeriodLabel(first)
    return `${formatPeriodLabel(first)} -> ${formatPeriodLabel(last)}`
  }, [activePeriodIds])

  const applyRangePreset = (presetId) => {
    const range = resolveRangePreset(allPeriodIds, presetId)
    if (!range) return
    setIsCustomRange(true)
    setRangeStartId(range.startId)
    setRangeEndId(range.endId)
    setSelectedRangePreset(presetId)
  }

  const needsClientsTable = useMemo(() => {
    const q = String(query || '').trim()
    return activePeriodIds.length !== 1 || Boolean(q)
  }, [activePeriodIds.length, query])

  useEffect(() => {
    if (!needsClientsTable) return
    if (clientsTable) return

    let cancelled = false
    ;(async () => {
      try {
        const tbl = await loadCreolabsClientsTable({ force: false })
        if (cancelled) return
        setClientsTable(tbl)
      } catch {
        // keep silent: fallback will be Top-N for single-period
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clientsTable, needsClientsTable])

  const computedRows = useMemo(() => {
    if (!activeCfg) return []

    // Single period: prefer lightweight Top-N index.
    if (activePeriodIds.length === 1) {
      const pid = activePeriodIds[0]
      const per = index?.leaderboards?.[pid]
      const topN = per?.[activeBoardId]?.rows || []
      // If searching and we have the full table, use it.
      const q = String(query || '').trim()
      if (q && Array.isArray(clientsTable?.rows)) {
        const agg = aggregateClientsRows({ tableRows: clientsTable.rows, activePeriodIds })
        return agg
      }
      return topN
    }

    if (Array.isArray(clientsTable?.rows)) {
      return aggregateClientsRows({ tableRows: clientsTable.rows, activePeriodIds })
    }

    // Fallback: if table isn't loaded/available, show nothing (with empty state).
    return []
  }, [activeBoardId, activeCfg, activePeriodIds, clientsTable?.rows, index?.leaderboards, query])

  const sortedRows = useMemo(() => {
    if (!activeCfg) return []
    const rows = Array.isArray(computedRows) ? [...computedRows] : []
    const key = activeCfg.metricKey
    rows.sort((a, b) => sortDescNumber(a?.[key], b?.[key]))
    const q = String(query || '').trim()
    if (!q) {
      const topN = Number(index?.topN || 50)
      return rows.slice(0, topN)
    }
    return rows
  }, [computedRows, activeCfg, index?.topN, query])

  const activeRows = sortedRows

  const filteredRows = useMemo(() => {
    const qRaw = String(query || '').trim()
    const q = qRaw.toLowerCase()
    if (!q) return activeRows

    return activeRows.filter((r) => {
      const name = String(r?.clientName || '').toLowerCase()
      const id = String(r?.clientId || '').toLowerCase()
      const login = String(r?.clientLogin || '').toLowerCase()
      const aff = String(r?.affiliateId || '').toLowerCase()
      const country = String(r?.country || '').toLowerCase()
      return (
        name.includes(q) ||
        id.includes(q) ||
        login.includes(q) ||
        aff.includes(q) ||
        country.includes(q)
      )
    })
  }, [activeRows, query])

  const hintTotalRows = computedRows.length
  const hintShownRows = filteredRows.length

  const summaryCards = useMemo(() => {
    const rows = Array.isArray(filteredRows) ? filteredRows : []
    const uniqueClients = new Set(rows.map((r) => getRowKey(r)).filter(Boolean)).size
    const totalNet = rows.reduce((sum, r) => sum + Number(r?.net || 0), 0)
    const totalDeposit = rows.reduce((sum, r) => sum + Number(r?.deposit || 0), 0)
    const totalTrades = rows.reduce((sum, r) => sum + Number(r?.trades || 0), 0)
    const totalPl = rows.reduce((sum, r) => sum + Number(r?.pl || 0), 0)
    const topRow = rows[0] || null
    const topMetricKey = activeCfg?.metricKey || 'net'
    const topMetricValue = Number(topRow?.[topMetricKey] || 0)
    const topMetricName = String(topRow?.clientName || topRow?.clientId || '—').trim()
    const topMetricHelper = topRow
      ? `${topMetricName}${activeCfg?.isCount ? ` · ${numberFmt0.format(topMetricValue)}` : ` · ${numberFmt2.format(topMetricValue)}`}`
      : 'No rows'

    return [
      {
        label: 'Visible rows',
        value: numberFmt0.format(hintShownRows),
        helper: `of ${numberFmt0.format(hintTotalRows)} in the current view`,
        tone: '#e2e8f0',
      },
      {
        label: 'Active traders',
        value: numberFmt0.format(uniqueClients),
        helper: 'Distinct client keys in the filtered rows',
        tone: '#7dd3fc',
      },
      {
        label: 'Net',
        value: formatMoneyLike(totalNet),
        helper: 'Sum of visible net values',
        tone: '#34d399',
      },
      {
        label: 'Deposits',
        value: formatMoneyLike(totalDeposit),
        helper: 'Sum of visible deposits',
        tone: '#fbbf24',
      },
      {
        label: 'Trades',
        value: numberFmt0.format(totalTrades),
        helper: 'Total visible trade count',
        tone: '#f472b6',
      },
      {
        label: activeCfg ? `Top ${activeCfg.pillLabel}` : 'Top metric',
        value: activeCfg?.isCount
          ? numberFmt0.format(topMetricValue)
          : formatMoneyLike(topMetricValue),
        helper: topMetricHelper,
        tone: '#a78bfa',
      },
      {
        label: 'P&L',
        value: formatMoneyLike(totalPl),
        helper: 'Sum of visible P&L values',
        tone: '#22d3ee',
      },
    ]
  }, [activeCfg, filteredRows, hintShownRows, hintTotalRows])

  if (loading) {
    return <FullPageLoader progress={40} subtitle={t('common.loading')} />
  }

  return (
    <div className="page-shell">
      <header
        className="page-header ranking-header ranking-sticky-header"
        style={{ alignItems: 'center' }}
      >
        <div>
          <p className="page-label">Marketing</p>
          <h1 className="page-title">{t('creolabs.title')}</h1>
          <p className="page-subtitle">{t('creolabs.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
              {t('creolabs.year')}
            </span>
            <button
              type="button"
              className={`pill-tab${!selectedYear ? ' active' : ''}`}
              onClick={() => {
                setIsCustomRange(false)
                setSelectedRangePreset('')
                setSelectedYear('')
                setSelectedMonth('')
              }}
            >
              {t('creolabs.all')}
            </button>
            {years.map((y) => (
              <button
                key={String(y)}
                type="button"
                className={`pill-tab${String(y) === String(selectedYear) ? ' active' : ''}`}
                onClick={() => {
                  setIsCustomRange(false)
                  setSelectedRangePreset('')
                  setSelectedYear(String(y))
                }}
              >
                {String(y)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
              {t('creolabs.month')}
            </span>
            <button
              type="button"
              className={`pill-tab${selectedMonth === 'all' ? ' active' : ''}`}
              onClick={() => {
                setIsCustomRange(false)
                setSelectedRangePreset('')
                setSelectedMonth('all')
              }}
            >
              {t('creolabs.all')}
            </button>

            {(selectedYear ? availableMonthsForSelectedYear : MONTHS).map((m) => {
              const isAvailable = !selectedYear
                ? allPeriodIds.some((id) => parsePeriodId(id)?.monthId === m.id)
                : availableMonthsForSelectedYear.some((x) => x.id === m.id)

              return (
                <button
                  key={m.id}
                  type="button"
                  className={`pill-tab${selectedMonth === m.id ? ' active' : ''}`}
                  onClick={() => {
                    setIsCustomRange(false)
                    setSelectedRangePreset('')
                    setSelectedMonth(m.id)
                  }}
                  disabled={!isAvailable}
                >
                  {m.label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
              {t('creolabs.range')}
            </span>
            <button
              type="button"
              className={`pill-tab${isCustomRange ? ' active' : ''}`}
              onClick={() => {
                setIsCustomRange((v) => {
                  const next = !v
                  if (!next) setSelectedRangePreset('')
                  return next
                })
              }}
            >
              {t('creolabs.range.custom')}
            </button>

            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`pill-tab${selectedRangePreset === preset.id ? ' active' : ''}`}
                onClick={() => applyRangePreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}

            {isCustomRange ? (
              <>
                <select
                  value={rangeStartId}
                  onChange={(e) => {
                    setSelectedRangePreset('custom')
                    setRangeStartId(e.target.value)
                  }}
                  aria-label={t('creolabs.range.start')}
                  className="search-hero-input"
                  style={{ width: 160, fontSize: 13, padding: '8px 10px', borderRadius: 10 }}
                >
                  {allPeriodIds.map((id) => (
                    <option key={`start-${id}`} value={id}>
                      {formatPeriodLabel(id)}
                    </option>
                  ))}
                </select>

                <select
                  value={rangeEndId}
                  onChange={(e) => {
                    setSelectedRangePreset('custom')
                    setRangeEndId(e.target.value)
                  }}
                  aria-label={t('creolabs.range.end')}
                  className="search-hero-input"
                  style={{ width: 160, fontSize: 13, padding: '8px 10px', borderRadius: 10 }}
                >
                  {allPeriodIds.map((id) => (
                    <option key={`end-${id}`} value={id}>
                      {formatPeriodLabel(id)}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>

          <div className="ranking-period-hint" aria-live="polite">
            <span>
              {t('creolabs.rowsSummary', {
                shown: numberFmt0.format(hintShownRows),
                total: numberFmt0.format(hintTotalRows),
              })}
            </span>
            <span style={{ marginLeft: 10 }}>{t('creolabs.periods')}: </span>
            <strong>{numberFmt0.format(activePeriodIds.length || 0)}</strong>
            <span style={{ marginLeft: 10, color: 'var(--text-muted)' }}>Window: </span>
            <strong>{activeRangeLabel}</strong>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>Rank</span>
            {boards.map((id) => (
              <button
                key={id}
                type="button"
                className={`pill-tab${activeBoardId === id ? ' active' : ''}`}
                onClick={() => setSelectedBoardId(id)}
              >
                {BOARD_CONFIG[id]?.pillLabel || BOARD_CONFIG[id]?.title || id}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('creolabs.search.placeholder')}
            aria-label={t('creolabs.search.ariaLabel')}
            className="search-hero-input"
            style={{ width: 320, fontSize: 14, padding: '10px 12px', borderRadius: 10 }}
          />
        </div>
      </header>

      {error ? (
        <div className="card-block">
          <h3 style={{ margin: 0, marginBottom: 6 }}>{t('creolabs.errorTitle')}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {error}
          </p>
        </div>
      ) : null}

      <section className="card-block" style={{ marginTop: 12 }}>
        <div className="card-block-header" style={{ marginBottom: 10 }}>
          <div>
            <p className="eyebrow">Snapshot</p>
            <h3>Riepilogo dati principali</h3>
            <p className="muted">Controllo rapido del perimetro attivo e dei valori visibili.</p>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
          }}
        >
          {summaryCards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              tone={card.tone}
              size="sm"
              density="compact"
            />
          ))}
        </div>
      </section>

      {activeCfg ? (
        <section key={activeBoardId} className="card-block table-card">
          <div className="card-block-header">
            <div>
              <p className="eyebrow">Top {index?.topN || 50}</p>
              <h3>{activeCfg.title}</h3>
              <p className="muted">{activeCfg.helper}</p>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'right' }}>
              <div style={{ fontWeight: 800 }}>{activeCfg.metricLabel}</div>
              <div className="muted">Monthly breakdown</div>
            </div>
          </div>

          <div className="table-wrap">
            <div className="ranking-list" role="list" aria-label={t('creolabs.title')}>
              {filteredRows.length ? (
                filteredRows.map((r, i) => {
                  const rank = i + 1
                  const rowKey = `${getRowKey(r)}-${i}`
                  const stableKey = getRowKey(r)
                  const isSelected = stableKey && selectedRowKey === stableKey

                  const net = Number(r?.net || 0)
                  const pl = Number(r?.pl || 0)
                  const ratio = Number(r?.plPctNet || 0)

                  const plValue = formatMoneyLike(pl)
                  const plTone = pl > 0 ? 'pos' : pl < 0 ? 'neg' : 'zero'
                  const roiText = formatRatioPct(ratio)
                  const roiTone = ratio > 0 ? 'pos' : ratio < 0 ? 'neg' : 'zero'
                  const netValue = formatMoneyLike(net)

                  const tradesNum = Math.max(0, Math.floor(Number(r?.trades) || 0))
                  const tradesText = numberFmt0.format(tradesNum)
                  const winRate = computeMockWinRate(tradesNum)
                  const winRatePct = winRate * 100
                  const winRateText = `${numberFmt2.format(winRatePct)}%`
                  const winTone = getWinRateTone(winRate)

                  const displayNameRaw = String(r?.clientName || '').trim()
                  const clientId = String(r?.clientId || '').trim()
                  const displayName = displayNameRaw || (clientId ? `Client ${clientId}` : 'Client')
                  const initials = getInitials(displayNameRaw)
                  const login = String(r?.clientLogin || '').trim()

                  return (
                    <div
                      key={rowKey}
                      role="listitem"
                      className={['ranking-row', getRankClass(rank), getRowClass(isSelected)]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setSelectedRowKey(stableKey)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedRowKey(stableKey)
                        }
                      }}
                    >
                      <div className="ranking-left" aria-hidden="true">
                        <div className={`ranking-left-value ranking-left-value--${plTone}`}>
                          {plValue}
                        </div>
                        <div className={`ranking-left-percent ranking-left-percent--${roiTone}`}>
                          {roiText}
                        </div>
                      </div>

                      <div className="ranking-center">
                        <div className="ranking-rank-badge" aria-label={`Rank ${rank}`}>
                          {rank}
                        </div>

                        <div className="ranking-avatar" aria-hidden="true">
                          {initials ? (
                            <span className="ranking-avatar-initials">{initials}</span>
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="ranking-avatar-icon"
                            >
                              <path
                                d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Zm0 2c-4.33 0-7.8 2.08-7.8 4.65V20h15.6v-1.35C19.8 16.08 16.33 14 12 14Z"
                                fill="currentColor"
                                opacity="0.9"
                              />
                            </svg>
                          )}
                        </div>

                        <div className="ranking-identity">
                          <div className="ranking-name">{displayName}</div>
                          <div className="ranking-meta">
                            {clientId ? `Client ID: ${clientId}` : ''}
                            {login ? `${clientId ? ' · ' : ''}Login: ${login}` : ''}
                            {r?.affiliateId ? ` · Affiliate: ${String(r.affiliateId)}` : ''}
                            {r?.country ? ` · ${String(r.country)}` : ''}
                          </div>

                          <div className="ranking-end-mobile" aria-hidden="true">
                            <div className={`ranking-end-value ranking-end-value--${plTone}`}>
                              {plValue}
                            </div>
                            <div className={`ranking-end-percent ranking-end-percent--${roiTone}`}>
                              {roiText}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ranking-right">
                        <div className="ranking-metric">
                          <div className="ranking-metric-label">Trades</div>
                          <div className="ranking-metric-value">{tradesText}</div>
                        </div>

                        <div className="ranking-metric ranking-metric--winrate">
                          <div className="ranking-metric-label">Win rate {winRateText}</div>
                          <div className="ranking-winbar-track" aria-hidden="true">
                            <div
                              className={`ranking-winbar-fill ranking-winbar-fill--${winTone}`}
                              style={{ width: `${Math.round(winRatePct * 100) / 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="ranking-end-desktop" aria-hidden="true">
                          <div className="ranking-metric-label">Net</div>
                          <div className="ranking-end-value">{netValue}</div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="ranking-empty">{t('creolabs.empty')}</div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="card-block">
          <p className="muted" style={{ margin: 0 }}>
            {t('creolabs.empty')}
          </p>
        </div>
      )}
    </div>
  )
}
