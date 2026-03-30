import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import KpiCard from '../../components/common/KpiCard'
import FullPageLoader from '../../components/FullPageLoader'
import {
  normalizeHeader,
  parseNumberSafe,
  parseYearMonthSafe,
} from '../../utils/retentionRanking'
import { buildTradersRankingRewardsDataset } from '../../utils/tradersRankingRewards'
import { useI18n } from '../../i18n/I18nContext'
import { sections as orgChartSections } from '../orgChartData'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const numberFmt0 = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numberFmt2 = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const eurFmt0 = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function fmtMoney0(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return 'â€”'
  return eurFmt0.format(n)
}

function fmtInt(v) {
  const n = Math.floor(Number(v || 0))
  if (!Number.isFinite(n)) return 'â€”'
  return numberFmt0.format(n)
}

function fmtNum2(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 'â€”'
  return numberFmt2.format(n)
}

function fmtSignedMoney0(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return 'â€”'
  const abs = eurFmt0.format(Math.abs(n))
  if (n > 0) return `+${abs}`
  if (n < 0) return `-${abs}`
  return abs
}

function toneFromDelta(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return 'neutral'
  if (n > 0) return 'up'
  if (n < 0) return 'down'
  return 'neutral'
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

function yearMonthIndex(y, m) {
  return y * 12 + (m - 1)
}

function daysFromDate(date, today) {
  if (!(date instanceof Date)) return null
  const ms = date.getTime()
  if (!Number.isFinite(ms)) return null
  const base = today instanceof Date ? today : new Date()
  const delta = base.getTime() - ms
  if (!Number.isFinite(delta)) return null
  return Math.max(0, Math.floor(delta / 86400000))
}

export default function SalesAgentsMonitor() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [artifact, setArtifact] = useState(null)
  const [fileName, setFileName] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)

  const [timeframe, setTimeframe] = useState('last12')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonthKey, setSelectedMonthKey] = useState('')

  const [selectedAgents, setSelectedAgents] = useState([])
  const [agentSearch, setAgentSearch] = useState('')
  const [focusSalesTeamOnly, setFocusSalesTeamOnly] = useState(false)

  const todayRef = useRef(new Date())
  const loadReqRef = useRef(0)
  const pageRootRef = useRef(null)

  const loadFromConsoleArtifact = useCallback(async () => {
    const reqId = (loadReqRef.current = loadReqRef.current + 1)
    setError('')
    setLoading(true)
    try {
      const ts = Date.now()
      const baseUrl = (import.meta?.env?.BASE_URL || '/').replace(/\/+$/, '/')
      const res = await fetch(`${baseUrl}traders_ranking_rewards_table.json?ts=${ts}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Traders Ranking Rewards report not found in console assets')
      const json = await res.json()
      const rows = Array.isArray(json?.rows) ? json.rows : []
      const headers = Array.isArray(json?.headers) ? json.headers : Object.keys(rows[0] || {})
      if (loadReqRef.current !== reqId) return
      setFileName('Traders Ranking Rewards.xlsx (auto)')
      setArtifact({ rows, headers })
    } catch (e) {
      const msg = String(e?.message || '').trim() || 'Refresh failed'
      setError(msg)
    } finally {
      if (loadReqRef.current === reqId) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!artifact) loadFromConsoleArtifact()
  }, [artifact, loadFromConsoleArtifact])

  useEffect(() => {
    const root = pageRootRef.current
    const scroller = root?.closest?.('.dashboard-content') || null
    if (!scroller) return undefined

    const onScroll = () => {
      setShowBackToTop((scroller.scrollTop || 0) > 240)
    }

    onScroll()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    const root = pageRootRef.current
    const scroller = root?.closest?.('.dashboard-content') || null
    if (scroller && typeof scroller.scrollTo === 'function') {
      scroller.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const rawRows = artifact?.rows || []
  const rawHeaders = artifact?.headers || []

  const salesTeamLookup = useMemo(() => {
    const byId = Array.isArray(orgChartSections)
      ? orgChartSections.find((s) => String(s?.id || '') === 'business-development')
      : null
    const roles = Array.isArray(byId?.roles) ? byId.roles : []

    const keys = new Set()
    for (const role of roles) {
      const fullName = String(role?.name || '').trim()
      const email = String(role?.email || '').trim().toLowerCase()
      const local = email.includes('@') ? email.split('@')[0] : ''
      const localSpaced = local.replace(/[._-]+/g, ' ').trim()

      const candidates = [fullName, local, localSpaced]
      for (const c of candidates) {
        const k = normalizeKey(c)
        if (k) keys.add(k)
      }
    }
    return keys
  }, [])

  const isSalesTeamAgent = useCallback(
    (agentValue) => {
      const raw = String(agentValue || '').trim()
      if (!raw) return false

      const key = normalizeKey(raw)
      if (!key) return false
      if (salesTeamLookup.has(key)) return true

      for (const memberKey of salesTeamLookup) {
        if (!memberKey || memberKey.length < 5) continue
        if (key.includes(memberKey) || memberKey.includes(key)) return true
      }
      return false
    },
    [salesTeamLookup]
  )

  const periodConfig = useMemo(() => {
    const headers = Array.isArray(rawHeaders) ? rawHeaders : []
    const firstRow = Array.isArray(rawRows) && rawRows.length ? rawRows[0] : null
    const rowKeys = firstRow && typeof firstRow === 'object' ? Object.keys(firstRow) : []
    const candidates = [...headers, ...rowKeys]

    const byNorm = new Map()
    for (const h of candidates) {
      const norm = normalizeHeader(h)
      if (!norm) continue
      if (!byNorm.has(norm)) byNorm.set(norm, String(h))
    }

    const yearCol = byNorm.get('year') || null
    const monthCol = byNorm.get('month') || null
    const periodCol =
      byNorm.get('year_month') ||
      byNorm.get('yearmonth') ||
      byNorm.get('period_id') ||
      byNorm.get('periodid') ||
      null

    return { yearCol, monthCol, periodCol }
  }, [rawHeaders, rawRows])

  const extractPeriod = useCallback(
    (row) => {
      const r = row && typeof row === 'object' ? row : null
      if (!r) return null

      const yearRaw = periodConfig.yearCol ? Number(r[periodConfig.yearCol]) : NaN
      const monthRaw = periodConfig.monthCol ? Number(r[periodConfig.monthCol]) : NaN
      if (Number.isFinite(yearRaw) && Number.isFinite(monthRaw)) {
        const y = Math.floor(yearRaw)
        const m = Math.floor(monthRaw)
        if (y > 1900 && y < 3000 && m >= 1 && m <= 12) {
          return { periodKey: `${y}-${String(m).padStart(2, '0')}`, year: y, month: m }
        }
      }

      const source = periodConfig.periodCol ? r[periodConfig.periodCol] : null
      const parsed = parseYearMonthSafe(source)
      if (!parsed) return null
      return { periodKey: parsed.id, year: parsed.year, month: parsed.month }
    },
    [periodConfig.monthCol, periodConfig.periodCol, periodConfig.yearCol]
  )

  const periodAvailable = useMemo(() => rawRows.some((r) => Boolean(extractPeriod(r))), [
    extractPeriod,
    rawRows,
  ])

  const yearOptions = useMemo(() => {
    const set = new Set()
    for (const r of rawRows) {
      const p = extractPeriod(r)
      if (p?.year) set.add(p.year)
    }
    return [...set].sort((a, b) => b - a)
  }, [extractPeriod, rawRows])

  const monthOptions = useMemo(() => {
    const set = new Set()
    for (const r of rawRows) {
      const p = extractPeriod(r)
      if (p?.periodKey) set.add(p.periodKey)
    }
    return [...set].sort((a, b) => (a < b ? 1 : -1))
  }, [extractPeriod, rawRows])

  useEffect(() => {
    if (!yearOptions.length) return
    if (selectedYear && yearOptions.includes(selectedYear)) return
    setSelectedYear(yearOptions[0])
  }, [selectedYear, yearOptions])

  useEffect(() => {
    if (!monthOptions.length) return
    if (selectedMonthKey && monthOptions.includes(selectedMonthKey)) return
    setSelectedMonthKey(monthOptions[0])
  }, [monthOptions, selectedMonthKey])

  const filteredRows = useMemo(() => {
    const list = Array.isArray(rawRows) ? rawRows : []
    if (!list.length) return []
    if (timeframe === 'all' || !periodAvailable) return list

    if (timeframe === 'year') {
      const y = Number(selectedYear)
      if (!Number.isFinite(y)) return list
      return list.filter((r) => {
        const p = extractPeriod(r)
        return p?.year === Math.floor(y)
      })
    }

    if (timeframe === 'month') {
      const k = String(selectedMonthKey || '').trim()
      if (!k) return list
      return list.filter((r) => {
        const p = extractPeriod(r)
        return p?.periodKey === k
      })
    }

    const t = todayRef.current instanceof Date ? todayRef.current : new Date()
    const currentIdx = t.getUTCFullYear() * 12 + t.getUTCMonth()
    const cutoffIdx = currentIdx - 11
    return list.filter((r) => {
      const p = extractPeriod(r)
      if (!p?.year || !p?.month) return false
      return yearMonthIndex(p.year, p.month) >= cutoffIdx
    })
  }, [extractPeriod, periodAvailable, rawRows, selectedMonthKey, selectedYear, timeframe])

  const dataset = useMemo(() => {
    if (!artifact) return null
    return buildTradersRankingRewardsDataset({ rows: filteredRows, headers: rawHeaders })
  }, [artifact, filteredRows, rawHeaders])

  const countryOptions = dataset?.countries || []
  const agentOptions = dataset?.agentUsers || []

  const agentSearchLower = String(agentSearch || '')
    .trim()
    .toLowerCase()
  const filteredAgentOptions = useMemo(() => {
    if (!agentSearchLower) return agentOptions
    return agentOptions.filter((a) => String(a).toLowerCase().includes(agentSearchLower))
  }, [agentOptions, agentSearchLower])

  const filteredClients = useMemo(() => {
    const list = Array.isArray(dataset?.clients) ? dataset.clients : []
    if (!list.length) return []

    const selectedAgentSet = new Set((selectedAgents || []).map((a) => String(a || '').trim()))

    return list.filter((c) => {
      const agent = String(c?.agentUser || 'Unassigned').trim() || 'Unassigned'
      if (selectedAgentSet.size && !selectedAgentSet.has(agent)) return false
      if (focusSalesTeamOnly && !isSalesTeamAgent(agent)) return false
      return true
    })
  }, [dataset?.clients, focusSalesTeamOnly, isSalesTeamAgent, selectedAgents])

  const salesAgentRows = useMemo(() => {
    const map = new Map()
    for (const c of filteredClients) {
      const agent = String(c?.agentUser || 'Unassigned').trim() || 'Unassigned'
      const rec = map.get(agent) || {
        agent,
        clients: 0,
        activeClients: 0,
        deposit: 0,
        withdrawals: 0,
        net: 0,
        closedPL: 0,
        trades: 0,
      }
      rec.clients += 1
      if (Number(c?.totalTrades || 0) > 0) rec.activeClients += 1
      rec.deposit += Number(c?.totalDeposit || 0)
      rec.withdrawals += Number(c?.totalWithdrawals || 0)
      rec.net += Number(c?.netDeposit || 0)
      rec.closedPL += Number(c?.closedPL || 0)
      rec.trades += Number(c?.totalTrades || 0)
      map.set(agent, rec)
    }

    return [...map.values()]
      .map((r) => ({
        ...r,
        netPerClient: r.clients > 0 ? r.net / r.clients : 0,
        tradesPerClient: r.clients > 0 ? r.trades / r.clients : 0,
      }))
      .sort((a, b) => b.net - a.net)
  }, [filteredClients])

  const salesAgentKpis = useMemo(() => {
    const agents = salesAgentRows.length
    const clients = salesAgentRows.reduce((acc, r) => acc + r.clients, 0)
    const activeClients = salesAgentRows.reduce((acc, r) => acc + r.activeClients, 0)
    const totalNet = salesAgentRows.reduce((acc, r) => acc + r.net, 0)
    const totalDeposit = salesAgentRows.reduce((acc, r) => acc + r.deposit, 0)
    return {
      agents,
      clients,
      activeClients,
      totalNet,
      totalDeposit,
      avgNetPerAgent: agents > 0 ? totalNet / agents : 0,
    }
  }, [salesAgentRows])

  const latestPeriodNetByAgent = useMemo(() => {
    if (!periodAvailable) return { latestLabel: '', prevLabel: '', byAgent: new Map() }
    const schema = dataset?.schema || {}
    const userCol = schema.user
    const netCol = schema.net
    if (!userCol || !netCol) return { latestLabel: '', prevLabel: '', byAgent: new Map() }

    const periodSet = new Set()
    for (const row of filteredRows) {
      const p = extractPeriod(row)
      if (p?.periodKey) periodSet.add(p.periodKey)
    }
    const periods = [...periodSet].sort()
    const latest = periods.length ? periods[periods.length - 1] : ''
    const prev = periods.length > 1 ? periods[periods.length - 2] : ''
    if (!latest) return { latestLabel: '', prevLabel: '', byAgent: new Map() }

    const byAgent = new Map()
    for (const row of filteredRows) {
      const p = extractPeriod(row)
      if (!p?.periodKey || (p.periodKey !== latest && p.periodKey !== prev)) continue
      const agent = String(row?.[userCol] || 'Unassigned').trim() || 'Unassigned'
      const netValue = parseNumberSafe(row?.[netCol])
      const rec = byAgent.get(agent) || { latest: 0, prev: 0 }
      if (p.periodKey === latest) rec.latest += netValue
      if (p.periodKey === prev) rec.prev += netValue
      byAgent.set(agent, rec)
    }
    return { latestLabel: latest, prevLabel: prev, byAgent }
  }, [dataset?.schema, extractPeriod, filteredRows, periodAvailable])

  const bestSixAgents = useMemo(() => {
    const base = salesAgentRows.slice(0, 6)
    const totalNet = Number(salesAgentKpis.totalNet || 0)
    return base.map((row, idx) => {
      const trend = latestPeriodNetByAgent.byAgent.get(row.agent) || { latest: 0, prev: 0 }
      const delta = Number(trend.latest || 0) - Number(trend.prev || 0)
      const weightPct = totalNet > 0 ? (Number(row.net || 0) / totalNet) * 100 : 0
      return {
        ...row,
        rank: idx + 1,
        trend,
        delta,
        weightPct,
      }
    })
  }, [latestPeriodNetByAgent.byAgent, salesAgentKpis.totalNet, salesAgentRows])

  const allAgentMetrics = useMemo(() => {
    return salesAgentRows.map((row) => {
      const trend = latestPeriodNetByAgent.byAgent.get(row.agent) || { latest: 0, prev: 0 }
      const momDelta = Number(trend.latest || 0) - Number(trend.prev || 0)
      const momDeltaPct = trend.prev !== 0 ? (momDelta / Math.abs(trend.prev)) * 100 : 0
      return { ...row, momDelta, momDeltaPct }
    })
  }, [latestPeriodNetByAgent.byAgent, salesAgentRows])

  const agentsWithAlerts = useMemo(() => {
    const alerts = []
    const median = salesAgentRows.length > 0
      ? [...salesAgentRows]
          .map(r => r.netPerClient)
          .sort((a, b) => a - b)
          [Math.floor(salesAgentRows.length / 2)]
      : 0

    for (const agent of allAgentMetrics) {
      const issueList = []

      if (agent.momDeltaPct < -20) {
        issueList.push({
          type: 'decline',
          icon: '📉',
          title: t('salesAgentsMonitor.alerts.decline.title'),
          desc: t('salesAgentsMonitor.alerts.decline.desc', { pct: Math.abs(Math.round(agent.momDeltaPct)) }),
        })
      }

      if (agent.activeClients < Math.max(1, agent.clients * 0.85)) {
        issueList.push({
          type: 'attrition',
          icon: '⚠️',
          title: t('salesAgentsMonitor.alerts.attrition.title'),
          desc: t('salesAgentsMonitor.alerts.attrition.desc', { lost: agent.clients - agent.activeClients }),
        })
      }

      if (agent.tradesPerClient > 8 && agent.netPerClient < median) {
        issueList.push({
          type: 'volume',
          icon: '📊',
          title: t('salesAgentsMonitor.alerts.volume.title'),
          desc: t('salesAgentsMonitor.alerts.volume.desc'),
        })
      }

      if (agent.net < 0 || agent.closedPL < 0) {
        issueList.push({
          type: 'negative',
          icon: '❌',
          title: t('salesAgentsMonitor.alerts.negative.title'),
          desc: t('salesAgentsMonitor.alerts.negative.desc'),
        })
      }

      if (issueList.length > 0) {
        alerts.push({ agent: agent.agent, issues: issueList, score: agent.net, momDelta: agent.momDelta })
      }
    }

    return alerts.sort((a, b) => a.score - b.score)
  }, [allAgentMetrics, salesAgentRows, t])

  const isPersonalMode = selectedAgents.length === 1
  const selectedAgentName = isPersonalMode ? String(selectedAgents[0] || '') : ''

  const selectedAgentSnapshot = useMemo(() => {
    if (!selectedAgentName) return null

    const row = salesAgentRows.find((r) => String(r.agent || '') === selectedAgentName)
    if (!row) return null

    const trend = latestPeriodNetByAgent.byAgent.get(row.agent) || { latest: 0, prev: 0 }
    const delta = Number(trend.latest || 0) - Number(trend.prev || 0)
    const deltaPct = trend.prev !== 0 ? (delta / Math.abs(trend.prev)) * 100 : 0
    const activeRate = row.clients > 0 ? (row.activeClients / row.clients) * 100 : 0

    const insights = []
    if (deltaPct < -20) {
      insights.push({
        icon: '📉',
        title: t('salesAgentsMonitor.personal.insight.decline.title'),
        desc: t('salesAgentsMonitor.personal.insight.decline.desc', {
          pct: Math.abs(Math.round(deltaPct)),
        }),
      })
    }
    if (activeRate < 85) {
      insights.push({
        icon: '⚠️',
        title: t('salesAgentsMonitor.personal.insight.attrition.title'),
        desc: t('salesAgentsMonitor.personal.insight.attrition.desc', {
          pct: Math.round(activeRate),
        }),
      })
    }
    if (row.tradesPerClient > 8 && row.netPerClient < 400) {
      insights.push({
        icon: '📊',
        title: t('salesAgentsMonitor.personal.insight.volume.title'),
        desc: t('salesAgentsMonitor.personal.insight.volume.desc'),
      })
    }
    if (row.net < 0 || row.closedPL < 0) {
      insights.push({
        icon: '❌',
        title: t('salesAgentsMonitor.personal.insight.negative.title'),
        desc: t('salesAgentsMonitor.personal.insight.negative.desc'),
      })
    }
    if (!insights.length) {
      insights.push({
        icon: '✅',
        title: t('salesAgentsMonitor.personal.insight.good.title'),
        desc: t('salesAgentsMonitor.personal.insight.good.desc'),
      })
    }

    return {
      ...row,
      trend,
      delta,
      deltaPct,
      activeRate,
      insights,
    }
  }, [latestPeriodNetByAgent.byAgent, salesAgentRows, selectedAgentName, t])

  const showOverlayLoader = Boolean(loading)

  const headerCellStyle = {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.10)',
    fontSize: 12,
    letterSpacing: 0.15,
    fontWeight: 800,
    background: 'rgba(255,255,255,0.01)',
    whiteSpace: 'nowrap',
  }

  const bodyCellStyle = {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.045)',
    fontSize: 12,
    whiteSpace: 'nowrap',
  }

  const metricLabelStyle = {
    cursor: 'help',
    textDecoration: 'underline dotted rgba(255,255,255,0.24)',
    textUnderlineOffset: 3,
  }

  return (
    <div
      ref={pageRootRef}
      className="page-shell profitable-ranking-page profitable-ranking-dashboard profitable-ranking-compact"
      style={{ height: 'auto', maxHeight: 'none', overflow: 'visible', minHeight: '100%' }}
    >
      {showOverlayLoader ? (
        <div
          className="logo-tools-backdrop"
          role="status"
          aria-live="polite"
          aria-label="Loadingâ€¦"
          style={{ zIndex: 210, display: 'grid', placeItems: 'center', padding: 14 }}
        >
          <div style={{ width: 'min(420px, 92vw)' }}>
            <FullPageLoader progress={40} subtitle="Loadingâ€¦" minHeight="auto" />
          </div>
        </div>
      ) : null}

      <div
        className="profitable-ranking-dashboard-content"
        style={{ display: 'block', height: 'auto', minHeight: 'auto', overflow: 'visible' }}
      >
        <div className="profitable-ranking-fixed">
          <header className="page-header ranking-header ranking-sticky-header" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <p className="page-label">{t('salesAgentsMonitor.section')}</p>
                <h1 className="page-title">{t('salesAgentsMonitor.title')}</h1>
                <p className="page-subtitle">{t('salesAgentsMonitor.subtitle')}</p>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
                    {fileName || t('salesAgentsMonitor.dataSource')}
                </div>
              </div>
              <label className="ranking-filter-field ranking-filter-field--agent" style={{ minWidth: 280, flexShrink: 0 }}>
                  <span className="ranking-filter-label">{t('salesAgentsMonitor.filterByAgent')}</span>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={focusSalesTeamOnly}
                    onChange={(e) => setFocusSalesTeamOnly(Boolean(e.target.checked))}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  <span>
                    {t('salesAgentsMonitor.focusSalesTeamOnly')} ({salesTeamLookup.size})
                  </span>
                </label>
                <input
                  type="text"
                  className="search-hero-input ranking-filter-input"
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(String(e.target.value || ''))}
                    placeholder={t('salesAgentsMonitor.searchAgents')}
                />
                <select
                  value={selectedAgentName}
                  onChange={(e) => {
                    const value = String(e.target.value || '')
                    setSelectedAgents(value ? [value] : [])
                  }}
                  className="search-hero-input ranking-filter-input ranking-filter-agents"
                  style={{ minHeight: 40 }}
                >
                  <option value="">{t('salesAgentsMonitor.personal.selectPlaceholder')}</option>
                  {filteredAgentOptions.map((a) => (
                    <option key={String(a)} value={String(a)}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: 8,
                width: '100%',
                maxWidth: 820,
              }}
            >
              <KpiCard label={t('salesAgentsMonitor.kpi.agents')} value={fmtInt(salesAgentKpis.agents)} size="sm" density="compact" />
              <KpiCard label={t('salesAgentsMonitor.kpi.activeClients')} value={fmtInt(salesAgentKpis.activeClients)} size="sm" density="compact" />
              <KpiCard label={t('salesAgentsMonitor.kpi.totalDeposit')} value={fmtMoney0(salesAgentKpis.totalDeposit)} size="sm" density="compact" />
              <KpiCard label={t('salesAgentsMonitor.kpi.totalNet')} value={fmtMoney0(salesAgentKpis.totalNet)} size="sm" density="compact" />
              <KpiCard label={t('salesAgentsMonitor.kpi.avgNetPerAgent')} value={fmtMoney0(salesAgentKpis.avgNetPerAgent)} size="sm" density="compact" />
            </div>
          </header>

          {error ? (
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(248, 113, 113, 0.08)',
                border: '1px solid rgba(248, 113, 113, 0.18)',
                color: 'rgba(248, 113, 113, 0.95)',
                fontWeight: 800,
              }}
            >
              {error}
            </div>
          ) : null}

          {/* ── HERO SECTION: overview vs personal ── */}
          {!isPersonalMode ? (
            <section
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 62%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 14 }}>{t('salesAgentsMonitor.top6.title')}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>{t('salesAgentsMonitor.top6.subtitle')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                {bestSixAgents.map((agent) => {
                  const tone = toneFromDelta(agent.delta)
                  const toneColor = tone === 'up' ? 'rgba(16,185,129,0.95)' : tone === 'down' ? 'rgba(248,113,113,0.95)' : 'var(--text-muted)'
                  return (
                    <article key={`top-${agent.agent}`} style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(9,14,22,0.6)', padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                        <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 13 }}>#{agent.rank} {agent.agent}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>{fmtNum2(agent.weightPct)}%</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{fmtMoney0(agent.net)}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>{fmtInt(agent.clients)} | {fmtInt(agent.trades)}</span>
                        <span style={{ fontWeight: 800, color: toneColor }}>{fmtSignedMoney0(agent.delta)}</span>
                      </div>
                    </article>
                  )
                })}
                {!bestSixAgents.length ? (
                  <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12 }}>{t('salesAgentsMonitor.top6.empty')}</div>
                ) : null}
              </div>
            </section>
          ) : (
            <section
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 62%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 14 }}>{t('salesAgentsMonitor.personal.title', { name: selectedAgentName })}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>{t('salesAgentsMonitor.personal.subtitle')}</div>
              </div>
              {selectedAgentSnapshot ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 10 }}>
                    <KpiCard label={t('salesAgentsMonitor.personal.kpi.clients')} value={fmtInt(selectedAgentSnapshot.clients)} size="sm" density="compact" />
                    <KpiCard label={t('salesAgentsMonitor.personal.kpi.activeRate')} value={`${fmtInt(selectedAgentSnapshot.activeRate)}%`} size="sm" density="compact" />
                    <KpiCard label={t('salesAgentsMonitor.personal.kpi.net')} value={fmtMoney0(selectedAgentSnapshot.net)} size="sm" density="compact" />
                    <KpiCard label={t('salesAgentsMonitor.personal.kpi.netPerClient')} value={fmtMoney0(selectedAgentSnapshot.netPerClient)} size="sm" density="compact" />
                    <KpiCard label={t('salesAgentsMonitor.personal.kpi.momDelta')} value={fmtSignedMoney0(selectedAgentSnapshot.delta)} size="sm" density="compact" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                    {selectedAgentSnapshot.insights.map((ins, insIdx) => (
                      <article key={`personal-ins-${insIdx}`} style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(9,14,22,0.55)', padding: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 4 }}>
                          <span style={{ marginRight: 6 }}>{ins.icon}</span>{ins.title}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{ins.desc}</div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12 }}>{t('salesAgentsMonitor.personal.noData')}</div>
              )}
            </section>
          )}

          {/* ── CHARTS (overview only) ── */}
          {!isPersonalMode ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            <section
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 62%)',
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 13 }}>
                  {t('salesAgentsMonitor.charts.deposits.title')}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>
                  {t('salesAgentsMonitor.charts.deposits.subtitle')}
                </div>
              </div>
              <div style={{ height: 220, position: 'relative' }}>
                {salesAgentRows.length ? (
                  <Bar
                    data={{
                      labels: salesAgentRows.slice(0, 10).map((r) => r.agent),
                      datasets: [
                        {
                          label: 'Deposits (EUR)',
                          data: salesAgentRows.slice(0, 10).map((r) => Number(r.deposit || 0)),
                          backgroundColor: 'rgba(34, 197, 94, 0.7)',
                          borderColor: 'rgba(34, 197, 94, 1)',
                          borderWidth: 1,
                          borderRadius: 4,
                          hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(30, 30, 40, 0.95)',
                          titleColor: 'rgba(255,255,255,0.95)',
                          bodyColor: 'rgba(255,255,255,0.8)',
                          borderColor: 'rgba(255,255,255,0.2)',
                          borderWidth: 1,
                          padding: 6,
                          displayColors: false,
                          callbacks: {
                            label: (context) => `€${numberFmt0.format(context.parsed.x)}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: 'rgba(255,255,255,0.6)',
                            font: { size: 9 },
                            callback: (value) => `€${numberFmt0.format(value)}`,
                          },
                          grid: {
                            color: 'rgba(255,255,255,0.05)',
                            drawBorder: false,
                          },
                        },
                        y: {
                          ticks: {
                            color: 'rgba(255,255,255,0.6)',
                            font: { size: 9 },
                          },
                          grid: {
                            display: false,
                            drawBorder: false,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 20 }}>
                    {t('salesAgentsMonitor.charts.empty')}
                  </div>
                )}
              </div>
            </section>

            <section
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 62%)',
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 13 }}>
                  {t('salesAgentsMonitor.charts.closedPl.title')}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>
                  {t('salesAgentsMonitor.charts.closedPl.subtitle')}
                </div>
              </div>
              <div style={{ height: 220, position: 'relative' }}>
                {salesAgentRows.length ? (
                  <Bar
                    data={{
                      labels: [...salesAgentRows].sort((a, b) => b.closedPL - a.closedPL).slice(0, 10).map((r) => r.agent),
                      datasets: [
                        {
                          label: 'Closed P&L (EUR)',
                          data: [...salesAgentRows].sort((a, b) => b.closedPL - a.closedPL).slice(0, 10).map((r) => Number(r.closedPL || 0)),
                          backgroundColor: 'rgba(168, 85, 247, 0.7)',
                          borderColor: 'rgba(168, 85, 247, 1)',
                          borderWidth: 1,
                          borderRadius: 4,
                          hoverBackgroundColor: 'rgba(168, 85, 247, 0.9)',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(30, 30, 40, 0.95)',
                          titleColor: 'rgba(255,255,255,0.95)',
                          bodyColor: 'rgba(255,255,255,0.8)',
                          borderColor: 'rgba(255,255,255,0.2)',
                          borderWidth: 1,
                          padding: 6,
                          displayColors: false,
                          callbacks: {
                            label: (context) => `€${numberFmt0.format(context.parsed.x)}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: 'rgba(255,255,255,0.6)',
                            font: { size: 9 },
                            callback: (value) => `€${numberFmt0.format(value)}`,
                          },
                          grid: {
                            color: 'rgba(255,255,255,0.05)',
                            drawBorder: false,
                          },
                        },
                        y: {
                          ticks: {
                            color: 'rgba(255,255,255,0.6)',
                            font: { size: 9 },
                          },
                          grid: {
                            display: false,
                            drawBorder: false,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 20 }}>
                    {t('salesAgentsMonitor.charts.empty')}
                  </div>
                )}
              </div>
            </section>
            </div>
          ) : null}

          {isPersonalMode ? (
            <div
              className="ranking-table-scroll hide-scrollbar"
              tabIndex={0}
              aria-label="Sales agents table"
              style={{ overflowY: 'visible', maxHeight: 'none', overflowX: 'auto', overscrollBehavior: 'auto' }}
            >
              <table
                className="table payout-unified-table ranking-table sticky-metrics-table"
                style={{ width: '100%', minWidth: 1380, borderCollapse: 'separate', borderSpacing: 0 }}
              >
              <thead>
                <tr>
                  <th style={{ ...headerCellStyle, textAlign: 'left', width: 56 }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.rank')}>
                      {t('salesAgentsMonitor.table.rank')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'left', width: 200 }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.agent')}>
                      {t('salesAgentsMonitor.table.agent')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.clients')}>
                      {t('salesAgentsMonitor.table.clients')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.active')}>
                      {t('salesAgentsMonitor.table.active')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.deposit')}>
                      {t('salesAgentsMonitor.table.deposit')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.wd')}>
                      {t('salesAgentsMonitor.table.wd')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.net')}>
                      {t('salesAgentsMonitor.table.net')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.closedPl')}>
                      {t('salesAgentsMonitor.table.closedPl')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.trades')}>
                      {t('salesAgentsMonitor.table.trades')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.netPerClient')}>
                      {t('salesAgentsMonitor.table.netPerClient')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.tradesPerClient')}>
                      {t('salesAgentsMonitor.table.tradesPerClient')}
                    </span>
                  </th>
                  {latestPeriodNetByAgent.latestLabel ? (
                    <th style={{ ...headerCellStyle, textAlign: 'right' }}>Net {latestPeriodNetByAgent.latestLabel}</th>
                  ) : null}
                  {latestPeriodNetByAgent.prevLabel ? (
                    <th style={{ ...headerCellStyle, textAlign: 'right' }}>Net {latestPeriodNetByAgent.prevLabel}</th>
                  ) : null}
                  {latestPeriodNetByAgent.prevLabel ? (
                    <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                      <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.momDelta')}>
                        {t('salesAgentsMonitor.table.momDelta')}
                      </span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {salesAgentRows.map((r, idx) => {
                  const trend = latestPeriodNetByAgent.byAgent.get(r.agent) || { latest: 0, prev: 0 }
                  const delta = Number(trend.latest || 0) - Number(trend.prev || 0)
                  const deltaTone = toneFromDelta(delta)
                  const deltaColor =
                    deltaTone === 'up'
                      ? 'rgba(16, 185, 129, 0.95)'
                      : deltaTone === 'down'
                        ? 'rgba(248, 113, 113, 0.95)'
                        : 'var(--text-muted)'

                  return (
                    <tr key={r.agent} style={{ background: idx % 2 ? 'rgba(255,255,255,0.008)' : 'transparent' }}>
                      <td style={{ ...bodyCellStyle, textAlign: 'left', fontWeight: 800 }}>{idx + 1}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'left', fontWeight: 800 }}>{r.agent}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtInt(r.clients)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtInt(r.activeClients)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtMoney0(r.deposit)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtMoney0(r.withdrawals)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtMoney0(r.net)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtMoney0(r.closedPL)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtInt(r.trades)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtMoney0(r.netPerClient)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtNum2(r.tradesPerClient)}</td>
                      {latestPeriodNetByAgent.latestLabel ? (
                        <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtMoney0(trend.latest)}</td>
                      ) : null}
                      {latestPeriodNetByAgent.prevLabel ? (
                        <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtMoney0(trend.prev)}</td>
                      ) : null}
                      {latestPeriodNetByAgent.prevLabel ? (
                        <td style={{ ...bodyCellStyle, textAlign: 'right', fontWeight: 800, color: deltaColor }}>
                          {fmtSignedMoney0(delta)}
                        </td>
                      ) : null}
                    </tr>
                  )
                })}
                {!salesAgentRows.length ? (
                  <tr>
                    <td
                      colSpan={latestPeriodNetByAgent.prevLabel ? 14 : latestPeriodNetByAgent.latestLabel ? 12 : 11}
                      style={{ ...bodyCellStyle, padding: 14, color: 'var(--text-muted)' }}
                    >
                      {t('salesAgentsMonitor.table.noAgents')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
              </table>
            </div>
          ) : (
            <section
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px dashed rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.015)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                {t('salesAgentsMonitor.personal.ctaTitle')}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
                {t('salesAgentsMonitor.personal.ctaSubtitle')}
              </div>
            </section>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label={t('salesAgentsMonitor.backToTop')}
        style={{
          position: 'fixed',
          right: 22,
          bottom: 22,
          zIndex: 120,
          height: 42,
          minWidth: 42,
          padding: '0 12px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(10, 16, 27, 0.92)',
          color: 'var(--text-primary)',
          fontSize: 12,
          fontWeight: 900,
          cursor: showBackToTop ? 'pointer' : 'default',
          boxShadow: '0 10px 24px rgba(0,0,0,0.32)',
          opacity: showBackToTop ? 1 : 0,
          transform: showBackToTop ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 180ms ease, transform 180ms ease',
          pointerEvents: showBackToTop ? 'auto' : 'none',
        }}
      >
        {t('salesAgentsMonitor.backToTopButton')}
      </button>
    </div>
  )
}
