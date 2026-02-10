import { useEffect, useMemo, useState } from 'react'
import FullPageLoader from '../../../components/FullPageLoader'
import { useI18n } from '../../../i18n/I18nContext'
import {
  loadAffiliateIndexById,
  loadRankingsIndex,
  loadRankingsUsersTable,
} from '../services/rankingService'
import { getPublicShareOrigin } from '../../../utils/publicShareOrigin'

const PERIODS = [
  { id: 'mtd', label: 'MTD' },
  { id: 'qtd', label: 'QTD' },
  { id: 'ytd', label: 'YTD' },
  { id: 'sem', label: 'SEM' },
  { id: 'annual', label: 'ANNUAL' },
  { id: 'all', label: 'SINCE EVER' },
]

const BOARD_CONFIG = {
  userPl: {
    pillLabel: 'P&L',
    title: 'Top P&L (User Profit)',
    helper:
      'Top 50 users by profit (based on report PL / Closed PL). Note: in the source report, negative P&L indicates user profit; this view inverts it.',
    metricLabel: 'User Profit',
    metricKey: 'userPl',
    extra: [
      { key: 'netDeposits', label: 'Net Deposits' },
      { key: 'positionCount', label: 'Positions' },
    ],
  },
  positionCount: {
    pillLabel: 'Positions',
    title: 'Top Position Count',
    helper: 'Top 50 users by Position Count (trading activity).',
    metricLabel: 'Position Count',
    metricKey: 'positionCount',
    extra: [
      { key: 'userPl', label: 'User Profit' },
      { key: 'netDeposits', label: 'Net Deposits' },
    ],
  },
  userPlPctNetDeposits: {
    pillLabel: '% Gain',
    title: 'Top % Gain',
    helper: 'Top 50 users by profit vs net deposits (User Profit / Net Deposits).',
    metricLabel: '% Gain',
    metricKey: 'userPlPctNetDeposits',
    isPercentRatio: true,
    extra: [
      { key: 'userPl', label: 'User Profit' },
      { key: 'netDeposits', label: 'Net Deposits' },
    ],
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
  return numberFmt2.format(n)
}

function formatPercent(v) {
  const n = Number(v || 0)
  return `${numberFmt2.format(n)}%`
}

function formatRatioPct(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '—'
  return `${numberFmt2.format(n * 100)}%`
}

function formatDateShort(iso) {
  const s = String(iso || '').trim()
  if (!s) return '—'
  const ms = Date.parse(s)
  if (!Number.isFinite(ms)) return '—'
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${day}/${m}/${y}`
}

function renderMetricValue(board, row) {
  const cfg = BOARD_CONFIG[board]
  if (!cfg) return '—'
  const raw = row?.[cfg.metricKey]

  if (cfg.isPercentRatio) return formatRatioPct(raw)
  if (cfg.isPercent) return formatPercent(raw)

  if (cfg.metricKey === 'positionCount' || cfg.metricKey === 'tenureDays') {
    return numberFmt0.format(Number(raw || 0))
  }

  return formatMoneyLike(raw)
}

function renderExtraValue(key, row) {
  if (key === 'registrationDate') return formatDateShort(row?.registrationDate)
  if (key === 'ftdDate') return formatDateShort(row?.ftdDate)
  if (key === 'positionCount' || key === 'depositCount') return numberFmt0.format(row?.[key] || 0)
  if (key === 'volume' || key === 'lots') return formatMoneyLike(row?.[key] || 0)
  if (key === 'userPl' || key === 'netPl' || key === 'netDeposits' || key === 'withdrawals')
    return formatMoneyLike(row?.[key] || 0)
  return String(row?.[key] ?? '—')
}

export default function RankingPage({
  publicMode = false,
  initialPeriodId = '',
  initialBoardId = '',
  initialQuery = '',
} = {}) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [periodId, setPeriodId] = useState(() => String(initialPeriodId || '').trim() || 'mtd')
  const [selectedBoardId, setSelectedBoardId] = useState(
    () => String(initialBoardId || '').trim() || ''
  )
  const [query, setQuery] = useState(() => String(initialQuery || ''))
  const [index, setIndex] = useState(null)
  const [affiliateById, setAffiliateById] = useState(null)
  const [usersTable, setUsersTable] = useState(null)
  const [shareState, setShareState] = useState('')

  const periodPills = useMemo(() => {
    const dynamic = Array.isArray(index?.reportPeriods)
      ? index.reportPeriods
          .map((p) => ({ id: p?.id, label: p?.label }))
          .filter((p) => p.id && p.label)
      : []
    return [...PERIODS, ...dynamic]
  }, [index])

  const reload = async ({ force = false } = {}) => {
    setError('')
    try {
      const [rankings, affiliates] = await Promise.all([
        loadRankingsIndex({ force }),
        loadAffiliateIndexById({ force }),
      ])
      setIndex(rankings)
      setAffiliateById(affiliates)
    } catch (e) {
      setError(e?.message || 'Unable to load rankings')
      setIndex(null)
      setAffiliateById(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const q = String(query || '').trim()
    if (!q) return
    if (usersTable) return

    let cancelled = false
    ;(async () => {
      try {
        const tbl = await loadRankingsUsersTable({ force: false })
        if (cancelled) return
        setUsersTable(tbl)
      } catch {
        // keep silent: fallback will be the Top-N rows
      }
    })()

    return () => {
      cancelled = true
    }
  }, [query, usersTable])

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

  const createPublicHref = () => {
    const origin = getPublicShareOrigin()
    const base = `${origin}/share/ranking`
    const sp = typeof window !== 'undefined' ? new window.URLSearchParams() : null
    if (!sp) return base
    if (periodId) sp.set('period', periodId)
    if (activeBoardId) sp.set('board', activeBoardId)
    if (String(query || '').trim()) sp.set('q', String(query || '').trim())
    const qs = sp.toString()
    return qs ? `${base}?${qs}` : base
  }

  const onShare = async () => {
    const href = createPublicHref()
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(href)
      } else if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        window.prompt('Copy link:', href)
      }
      setShareState('copied')
      setTimeout(() => setShareState(''), 1200)
    } catch {
      setShareState('')
    }
  }

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

  const formatAffiliate = (affiliateId) => {
    const id = String(affiliateId || '').trim()
    if (!id) return '—'
    const nmRaw = affiliateById && typeof affiliateById === 'object' ? affiliateById[id] : null
    const name = String(nmRaw || '').trim()
    if (!name) return id
    return `${name} (${id})`
  }

  const activeBoardId = selectedBoardId || boards[0] || ''
  const activeCfg = activeBoardId ? BOARD_CONFIG[activeBoardId] : null
  const activeRows = activeBoardId ? leaderboardsForPeriod?.[activeBoardId]?.rows || [] : []
  const activeExtraCols = activeCfg?.extra || []

  const filteredRows = useMemo(() => {
    const qRaw = String(query || '').trim()
    const q = qRaw.toLowerCase()
    if (!q) return activeRows

    // Prefer searching across the full cohort (not just Top-N), if available.
    const cols = usersTable?.columns
    const rows = usersTable?.rows
    if (!Array.isArray(cols) || !Array.isArray(rows) || !index) {
      return activeRows.filter((r) => {
        const name = String(r?.customerName || '').toLowerCase()
        const userId = String(r?.userId || '').toLowerCase()
        const mt5 = String(r?.mt5Account || '').toLowerCase()
        return name.includes(q) || userId.includes(q) || mt5.includes(q)
      })
    }

    const colIdx = Object.fromEntries(cols.map((c, i) => [c, i]))
    const idxName = colIdx.customerName
    const idxUserId = colIdx.userId
    const idxMt5 = colIdx.mt5Account
    const idxAffiliate = colIdx.affiliateId
    const idxCountry = colIdx.country
    const idxFtd = colIdx.ftdDate
    const idxReg = colIdx.registrationDate
    const idxNetDeposits = colIdx.netDeposits
    const idxPl = colIdx.pl
    const idxNetPl = colIdx.netPl
    const idxPos = colIdx.positionCount
    const idxUserPl = colIdx.userPl
    const idxRatio = colIdx.userPlPctNetDeposits
    const idxPeriod = colIdx.period
    const idxFraud = colIdx.fraud

    const periodMeta = index?.periods?.[periodId] || null
    const nowMs = Date.parse(index?.now || '') || Date.now()
    const startMs = periodMeta?.start ? Date.parse(periodMeta.start) : null
    const reportValue = periodMeta?.reportPeriodValue ? String(periodMeta.reportPeriodValue) : null

    const matches = []
    for (const row of rows) {
      if (!Array.isArray(row)) continue
      if (idxFraud != null && row[idxFraud]) continue

      if (reportValue != null) {
        if (idxPeriod == null) continue
        if (String(row[idxPeriod] || '').trim() !== reportValue) continue
      } else if (startMs != null) {
        if (idxFtd == null) continue
        const dt = String(row[idxFtd] || '').trim()
        if (!dt) continue
        const ms = Date.parse(dt)
        if (!Number.isFinite(ms)) continue
        if (ms > nowMs) continue
        if (ms < startMs) continue
      }

      const name = String((idxName != null ? row[idxName] : '') || '').toLowerCase()
      const userId = String((idxUserId != null ? row[idxUserId] : '') || '').toLowerCase()
      const mt5 = String((idxMt5 != null ? row[idxMt5] : '') || '').toLowerCase()
      if (!(name.includes(q) || userId.includes(q) || mt5.includes(q))) continue

      matches.push({
        customerName: idxName != null ? row[idxName] : '',
        userId: idxUserId != null ? row[idxUserId] : '',
        mt5Account: idxMt5 != null ? row[idxMt5] : '',
        affiliateId: idxAffiliate != null ? row[idxAffiliate] : '',
        country: idxCountry != null ? row[idxCountry] : '',
        ftdDate: idxFtd != null ? row[idxFtd] : '',
        registrationDate: idxReg != null ? row[idxReg] : '',
        netDeposits: idxNetDeposits != null ? Number(row[idxNetDeposits] || 0) : 0,
        pl: idxPl != null ? Number(row[idxPl] || 0) : 0,
        netPl: idxNetPl != null ? Number(row[idxNetPl] || 0) : 0,
        positionCount: idxPos != null ? Number(row[idxPos] || 0) : 0,
        userPl: idxUserPl != null ? Number(row[idxUserPl] || 0) : 0,
        userPlPctNetDeposits: idxRatio != null ? Number(row[idxRatio] || 0) : 0,
      })
    }

    const metricKey = BOARD_CONFIG[activeBoardId]?.metricKey
    const metricGetter = (r) => {
      if (!metricKey) return 0
      const v = Number(r?.[metricKey] || 0)
      return Number.isFinite(v) ? v : 0
    }

    matches.sort((a, b) => metricGetter(b) - metricGetter(a))

    // Render guard: avoid huge tables for broad queries.
    return matches.slice(0, 200)
  }, [activeRows, query, usersTable, index, periodId, activeBoardId])

  if (loading) {
    return <FullPageLoader progress={40} subtitle={t('common.loading')} />
  }

  return (
    <div className="page-shell">
      <header className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <p className="page-label">{publicMode ? 'Public share' : 'Marketing'}</p>
          <h1 className="page-title">{t('ranking.title')}</h1>
          <p className="page-subtitle">{t('ranking.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
              {t('ranking.period')}
            </span>
            {periodPills.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`pill-tab${periodId === p.id ? ' active' : ''}`}
                onClick={() => setPeriodId(p.id)}
              >
                {p.label}
              </button>
            ))}
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
            placeholder={t('ranking.search.placeholder')}
            aria-label={t('ranking.search.ariaLabel')}
            className="search-hero-input"
            style={{ width: 320, fontSize: 14, padding: '10px 12px', borderRadius: 10 }}
          />

          {!publicMode ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="pill-tab" onClick={onShare}>
                {shareState === 'copied' ? t('ranking.share.copied') : t('ranking.share.cta')}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="card-block">
          <h3 style={{ margin: 0, marginBottom: 6 }}>{t('ranking.errorTitle')}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {error}
          </p>
        </div>
      ) : null}

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
              <div className="muted">Cohort by FTD</div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table ranking-table" style={{ minWidth: 980 }}>
              <colgroup>
                <col style={{ width: 64 }} />
                <col style={{ width: 280 }} />
                <col style={{ width: 220 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 140 }} />
                {activeExtraCols.map((c) => (
                  <col key={c.key} style={{ width: 140 }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ width: 64 }}>#</th>
                  <th>User</th>
                  <th>Affiliate</th>
                  <th>Country</th>
                  <th>FTD</th>
                  <th style={{ textAlign: 'right' }}>{activeCfg.metricLabel}</th>
                  {activeExtraCols.map((c) => (
                    <th key={c.key} style={{ textAlign: 'right' }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length ? (
                  filteredRows.map((r, i) => (
                    <tr key={`${r.userId || r.mt5Account || r.customerName || 'u'}-${i}`}>
                      <td>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{r.customerName || '—'}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {r.userId ? `User ID: ${r.userId}` : ''}
                          {r.mt5Account ? `${r.userId ? ' · ' : ''}MT5: ${r.mt5Account}` : ''}
                        </div>
                      </td>
                      <td>{formatAffiliate(r.affiliateId)}</td>
                      <td>{r.country || '—'}</td>
                      <td>{formatDateShort(r.ftdDate)}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {renderMetricValue(activeBoardId, r)}
                      </td>
                      {activeExtraCols.map((c) => (
                        <td
                          key={c.key}
                          style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {renderExtraValue(c.key, r)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6 + activeExtraCols.length}
                      style={{ padding: 12, color: 'var(--text-muted)' }}
                    >
                      {t('ranking.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="card-block">
          <p className="muted" style={{ margin: 0 }}>
            {t('ranking.empty')}
          </p>
        </div>
      )}
    </div>
  )
}
