import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import KpiCard from '../../components/common/KpiCard'
import FullPageLoader from '../../components/FullPageLoader'
import { useQlikStatus } from '../../context/QlikStatusContext'
import { normalizeHeader, parseNumberSafe, parseYearMonthSafe } from '../../utils/retentionRanking'
import { buildTradersRankingRewardsDataset } from '../../utils/tradersRankingRewards'
import { useI18n } from '../../i18n/I18nContext'
import { sections as orgChartSections } from '../orgChartData'
import { loadCreolabsQlikClientMonths } from '../../features/creolabs/services/creolabsService'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

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
  if (!Number.isFinite(n)) return '--'
  return eurFmt0.format(n)
}

function fmtInt(v) {
  const n = Math.floor(Number(v || 0))
  if (!Number.isFinite(n)) return '--'
  return numberFmt0.format(n)
}

function fmtNum2(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '--'
  return numberFmt2.format(n)
}

function fmtSignedMoney0(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '--'
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

const PIE_COLORS = [
  'rgba(59, 130, 246, 0.82)',
  'rgba(16, 185, 129, 0.82)',
  'rgba(249, 115, 22, 0.82)',
  'rgba(168, 85, 247, 0.82)',
  'rgba(236, 72, 153, 0.82)',
  'rgba(234, 179, 8, 0.82)',
  'rgba(148, 163, 184, 0.80)',
]

function formatPeriodLabel(periodKey) {
  const raw = String(periodKey || '').trim()
  const match = raw.match(/^(\d{4})-(\d{2})$/)
  if (!match) return raw || '--'
  const year = Number(match[1])
  const month = Number(match[2])
  const dt = new Date(year, Math.max(0, month - 1), 1)
  return dt.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

function mapQlikClientMonthsToSalesRows(clientMonths = []) {
  const list = Array.isArray(clientMonths) ? clientMonths : []
  return list.map((row) => {
    const periodId = String(row?.periodId || '').trim()
    const balance = Number(row?.balance || 0)
    return {
      affiliate_id: String(row?.affiliateId || '').trim(),
      client_id: String(row?.clientId || '').trim(),
      client_name: String(row?.clientName || '').trim(),
      client_login: String(row?.clientLogin || '').trim(),
      user: String(row?.user || '').trim(),
      country: String(row?.country || '').trim(),
      brand: String(row?.brand || '').trim(),
      balance,
      equity: balance,
      closed_pl: Number(row?.pl || 0),
      open_pl: Number(row?.openPl || 0),
      trades: Number(row?.trades || 0),
      ftd: Number(row?.ftd || 0),
      rdp: Number(row?.rdp || 0),
      deposit: Number(row?.deposit || 0),
      wd: Number(row?.wd || 0),
      net: Number(row?.net || 0),
      year_month: periodId,
    }
  })
}

export default function SalesAgentsMonitor() {
  const { t } = useI18n()
  const { reportQlikSource } = useQlikStatus()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [artifact, setArtifact] = useState(null)
  const [fileName, setFileName] = useState('')
  const [sourceMode, setSourceMode] = useState('api')
  const [lastLoadedAt, setLastLoadedAt] = useState(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  const [timeframe, setTimeframe] = useState('month')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonthKey, setSelectedMonthKey] = useState('')

  const [selectedAgents, setSelectedAgents] = useState([])
  const [agentQuery, setAgentQuery] = useState('')
  const [focusSalesTeamOnly, setFocusSalesTeamOnly] = useState(false)
  const [focusRetentionTeamOnly, setFocusRetentionTeamOnly] = useState(false)

  const todayRef = useRef(new Date())
  const loadReqRef = useRef(0)
  const pageRootRef = useRef(null)

  const loadFromConsoleArtifact = useCallback(
    async ({ force = false } = {}) => {
      const reqId = (loadReqRef.current = loadReqRef.current + 1)
      setError('')
      setLoading(true)
      try {
        const payload = await loadCreolabsQlikClientMonths({ force })
        const clientMonths = Array.isArray(payload?.data?.clientMonths)
          ? payload.data.clientMonths
          : []
        const rows = mapQlikClientMonthsToSalesRows(clientMonths)
        const headers = Object.keys(rows[0] || {})
        if (loadReqRef.current !== reqId) return
        setFileName('Qlik CREOLABS API (live)')
        setSourceMode(payload?.data?.cached ? 'cached' : 'api')
        setLastLoadedAt(new Date())
        setArtifact({ rows, headers })
        reportQlikSource('sales-agents-monitor', 'api')
      } catch (e) {
        const msg = String(e?.message || '').trim() || 'Qlik API unavailable'
        if (loadReqRef.current === reqId) setError(msg)
      } finally {
        if (loadReqRef.current === reqId) setLoading(false)
      }
    },
    [reportQlikSource]
  )

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

  const businessDevelopmentRoles = useMemo(() => {
    const byId = Array.isArray(orgChartSections)
      ? orgChartSections.find((s) => String(s?.id || '') === 'business-development')
      : null
    return Array.isArray(byId?.roles) ? byId.roles : []
  }, [])

  const salesTeamLookup = useMemo(() => {
    const members = [
      'Jake Morgan',
      'jake.m@bullwaves.com',
      'Ernest Medalla Bautista',
      'Ernest Bautista',
      'ernestmedallabautista96@gmail.com',
      'ernest.bautista@bullwaves.com',
      'Cruiseljohn',
      'Cruisel John',
      'Cruisel John Sanoy',
      'cruiseljohn@gmail.com',
      'csanoy@bullwaves.com',
      'Jhunamae Masayon',
      'Jhuna Mae Masayon',
      'jhunamae.masayon@gmail.com',
      'jmasayon@bullwaves.com',
      'Santiagangelo Tabian',
      'Santiangelo Tabian',
      'Santiago Angelo Tabian',
      'Santi Tabian',
      'santiagangelo.tabian@gmail.com',
      'Nicoangelo Calingasan2',
      'Nicoangelo Calingasan',
      'nicoangelo.calingasan2@gmail.com',
    ]

    const keys = new Set()
    for (const member of members) {
      const raw = String(member || '').trim()
      const email = raw.toLowerCase()
      const local = email.includes('@') ? email.split('@')[0] : ''
      const localSpaced = local.replace(/[._-]+/g, ' ').trim()
      const candidates = [raw, local, localSpaced]
      for (const c of candidates) {
        const k = normalizeKey(c)
        if (k) keys.add(k)
      }
    }
    return keys
  }, [])

  const retentionTeamLookup = useMemo(() => {
    const retentionSeeds = ['orlin', 'gabriela', 'milen', 'uros', 'imran', 'imram']

    const keys = new Set()
    for (const role of businessDevelopmentRoles) {
      const fullName = String(role?.name || '').trim()
      const fullKey = normalizeKey(fullName)
      const isIncluded = retentionSeeds.some((seed) => fullKey.includes(seed))
      if (!isIncluded) continue

      const email = String(role?.email || '')
        .trim()
        .toLowerCase()
      const local = email.includes('@') ? email.split('@')[0] : ''
      const localSpaced = local.replace(/[._-]+/g, ' ').trim()

      const candidates = [fullName, local, localSpaced]
      for (const c of candidates) {
        const k = normalizeKey(c)
        if (k) keys.add(k)
      }
    }
    return keys
  }, [businessDevelopmentRoles])

  const salesConversionTeamCount = 6
  const retentionTeamCount = 5

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

  const isRetentionTeamAgent = useCallback(
    (agentValue) => {
      const raw = String(agentValue || '').trim()
      if (!raw) return false

      const key = normalizeKey(raw)
      if (!key) return false
      if (retentionTeamLookup.has(key)) return true

      for (const memberKey of retentionTeamLookup) {
        if (!memberKey || memberKey.length < 5) continue
        if (key.includes(memberKey) || memberKey.includes(key)) return true
      }
      return false
    },
    [retentionTeamLookup]
  )

  const periodConfig = useMemo(() => {
    const headers = Array.isArray(rawHeaders) ? rawHeaders : []
    const headerIndex = new Map()
    headers.forEach((header, idx) => {
      headerIndex.set(String(header || '').trim(), idx)
    })

    const firstRow = Array.isArray(rawRows) && rawRows.length ? rawRows[0] : null
    const rowKeys =
      firstRow && !Array.isArray(firstRow) && typeof firstRow === 'object'
        ? Object.keys(firstRow)
        : []
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

    return { yearCol, monthCol, periodCol, headerIndex }
  }, [rawHeaders, rawRows])

  const extractPeriod = useCallback(
    (row) => {
      const r = row && typeof row === 'object' ? row : null
      if (!r) return null

      const readValue = (columnName) => {
        if (!columnName) return undefined
        if (Array.isArray(r)) {
          const idx = periodConfig.headerIndex.get(String(columnName || '').trim())
          return Number.isInteger(idx) ? r[idx] : undefined
        }
        return r[columnName]
      }

      const yearRaw = Number(readValue(periodConfig.yearCol))
      const monthRaw = Number(readValue(periodConfig.monthCol))
      if (Number.isFinite(yearRaw) && Number.isFinite(monthRaw)) {
        const y = Math.floor(yearRaw)
        const m = Math.floor(monthRaw)
        if (y > 1900 && y < 3000 && m >= 1 && m <= 12) {
          return { periodKey: `${y}-${String(m).padStart(2, '0')}`, year: y, month: m }
        }
      }

      const source = readValue(periodConfig.periodCol)
      const parsed = parseYearMonthSafe(source)
      if (!parsed) return null
      return { periodKey: parsed.id, year: parsed.year, month: parsed.month }
    },
    [periodConfig.headerIndex, periodConfig.monthCol, periodConfig.periodCol, periodConfig.yearCol]
  )

  const periodAvailable = useMemo(
    () => rawRows.some((r) => Boolean(extractPeriod(r))),
    [extractPeriod, rawRows]
  )

  const yearOptions = useMemo(() => {
    const set = new Set()
    for (const r of rawRows) {
      const p = extractPeriod(r)
      if (p?.year) set.add(p.year)
    }
    return [...set].sort((a, b) => b - a)
  }, [extractPeriod, rawRows])

  const availableMonthOptionsForSelectedYear = useMemo(() => {
    const targetYear = Number(selectedYear)
    if (!Number.isFinite(targetYear)) return []

    const set = new Set()
    for (const r of rawRows) {
      const p = extractPeriod(r)
      if (p?.year === targetYear && p?.month) set.add(p.month)
    }

    return [...set].sort((a, b) => b - a)
  }, [extractPeriod, rawRows, selectedYear])

  const monthOptionsForSelectedYear = useMemo(
    () => Array.from({ length: 12 }, (_, idx) => 12 - idx),
    []
  )

  useEffect(() => {
    if (!yearOptions.length) return
    if (selectedYear && yearOptions.includes(selectedYear)) return
    const currentYear =
      todayRef.current instanceof Date
        ? todayRef.current.getUTCFullYear()
        : new Date().getUTCFullYear()
    setSelectedYear(yearOptions.includes(currentYear) ? currentYear : yearOptions[0])
  }, [selectedYear, yearOptions])

  useEffect(() => {
    if (timeframe !== 'month') return
    if (!selectedYear || !availableMonthOptionsForSelectedYear.length) return

    const currentMonth = Number(String(selectedMonthKey || '').slice(5, 7))
    if (
      String(selectedMonthKey || '').startsWith(`${selectedYear}-`) &&
      availableMonthOptionsForSelectedYear.includes(currentMonth)
    ) {
      return
    }

    const now = todayRef.current instanceof Date ? todayRef.current : new Date()
    const currentYear = now.getUTCFullYear()
    const currentMonthNumber = now.getUTCMonth() + 1
    const preferredMonth =
      selectedYear === currentYear &&
      availableMonthOptionsForSelectedYear.includes(currentMonthNumber)
        ? currentMonthNumber
        : availableMonthOptionsForSelectedYear[0]
    setSelectedMonthKey(`${selectedYear}-${String(preferredMonth).padStart(2, '0')}`)
  }, [availableMonthOptionsForSelectedYear, selectedMonthKey, selectedYear, timeframe])

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

  const agentOptions = dataset?.agentUsers || []
  const agentQueryLower = String(agentQuery || '')
    .trim()
    .toLowerCase()

  const filteredClients = useMemo(() => {
    const list = Array.isArray(dataset?.clients) ? dataset.clients : []
    if (!list.length) return []

    const selectedAgentSet = new Set((selectedAgents || []).map((a) => String(a || '').trim()))

    return list.filter((c) => {
      const agent = String(c?.agentUser || 'Unassigned').trim() || 'Unassigned'
      const agentLower = agent.toLowerCase()
      if (selectedAgentSet.size && !selectedAgentSet.has(agent)) return false
      if (!selectedAgentSet.size && agentQueryLower && !agentLower.includes(agentQueryLower))
        return false
      if (focusSalesTeamOnly || focusRetentionTeamOnly) {
        const inSales = isSalesTeamAgent(agent)
        const inRetention = isRetentionTeamAgent(agent)
        const include =
          focusSalesTeamOnly && focusRetentionTeamOnly
            ? inSales || inRetention
            : focusSalesTeamOnly
              ? inSales
              : inRetention
        if (!include) return false
      }
      return true
    })
  }, [
    agentQueryLower,
    dataset?.clients,
    focusRetentionTeamOnly,
    focusSalesTeamOnly,
    isRetentionTeamAgent,
    isSalesTeamAgent,
    selectedAgents,
  ])

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

  const canPopulateMomColumn = useMemo(() => {
    if (!latestPeriodNetByAgent.prevLabel) return false
    const now = todayRef.current instanceof Date ? todayRef.current : new Date()
    const currentPeriodKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    return latestPeriodNetByAgent.latestLabel !== currentPeriodKey
  }, [latestPeriodNetByAgent.latestLabel, latestPeriodNetByAgent.prevLabel])

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
    const median =
      salesAgentRows.length > 0
        ? [...salesAgentRows].map((r) => r.netPerClient).sort((a, b) => a - b)[
            Math.floor(salesAgentRows.length / 2)
          ]
        : 0

    for (const agent of allAgentMetrics) {
      const issueList = []

      if (agent.momDeltaPct < -20) {
        issueList.push({
          type: 'decline',
          icon: '📉',
          title: t('salesAgentsMonitor.alerts.decline.title'),
          desc: t('salesAgentsMonitor.alerts.decline.desc', {
            pct: Math.abs(Math.round(agent.momDeltaPct)),
          }),
        })
      }

      if (agent.activeClients < Math.max(1, agent.clients * 0.85)) {
        issueList.push({
          type: 'attrition',
          icon: '⚠️',
          title: t('salesAgentsMonitor.alerts.attrition.title'),
          desc: t('salesAgentsMonitor.alerts.attrition.desc', {
            lost: agent.clients - agent.activeClients,
          }),
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
        alerts.push({
          agent: agent.agent,
          issues: issueList,
          score: agent.net,
          momDelta: agent.momDelta,
        })
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

  const selectedAgentCountryBreakdown = useMemo(() => {
    if (!selectedAgentName) return []

    const countryMap = new Map()
    for (const c of filteredClients) {
      const agent = String(c?.agentUser || 'Unassigned').trim() || 'Unassigned'
      if (agent !== selectedAgentName) continue

      const country = String(c?.country || 'Unknown').trim() || 'Unknown'
      const rec = countryMap.get(country) || {
        country,
        clients: 0,
        activeClients: 0,
        deposit: 0,
        withdrawals: 0,
        net: 0,
        trades: 0,
      }
      rec.clients += 1
      if (Number(c?.totalTrades || 0) > 0) rec.activeClients += 1
      rec.deposit += Number(c?.totalDeposit || 0)
      rec.withdrawals += Number(c?.totalWithdrawals || 0)
      rec.net += Number(c?.netDeposit || 0)
      rec.trades += Number(c?.totalTrades || 0)
      countryMap.set(country, rec)
    }

    const baseRows = [...countryMap.values()]
    const positiveNetTotal = baseRows.reduce(
      (acc, row) => acc + Math.max(0, Number(row.net || 0)),
      0
    )
    const useNet = positiveNetTotal > 0

    const rows = baseRows
      .map((row) => ({
        ...row,
        performanceValue: useNet
          ? Math.max(0, Number(row.net || 0))
          : Math.max(0, Number(row.deposit || 0)),
      }))
      .sort((a, b) => b.performanceValue - a.performanceValue || b.deposit - a.deposit)

    const total = rows.reduce((acc, row) => acc + Number(row.performanceValue || 0), 0)
    if (!rows.length) return []

    const major = []
    const other = []

    rows.forEach((row, idx) => {
      const sharePct = total > 0 ? (Number(row.performanceValue || 0) / total) * 100 : 0
      const enriched = { ...row, sharePct, metricLabel: useNet ? 'net' : 'deposit' }
      if ((idx < 5 && sharePct >= 4) || idx < 3) major.push(enriched)
      else other.push(enriched)
    })

    if (other.length) {
      const grouped = other.reduce(
        (acc, row) => ({
          country: 'Other',
          clients: acc.clients + row.clients,
          activeClients: acc.activeClients + row.activeClients,
          deposit: acc.deposit + row.deposit,
          withdrawals: acc.withdrawals + row.withdrawals,
          net: acc.net + row.net,
          trades: acc.trades + row.trades,
          performanceValue: acc.performanceValue + row.performanceValue,
        }),
        {
          country: 'Other',
          clients: 0,
          activeClients: 0,
          deposit: 0,
          withdrawals: 0,
          net: 0,
          trades: 0,
          performanceValue: 0,
        }
      )
      grouped.sharePct = total > 0 ? (grouped.performanceValue / total) * 100 : 0
      grouped.metricLabel = useNet ? 'net' : 'deposit'
      grouped.isOther = true
      major.push(grouped)
    }

    return major
  }, [filteredClients, selectedAgentName])

  const selectedAgentCountryPie = useMemo(() => {
    if (!selectedAgentCountryBreakdown.length) return null
    return {
      labels: selectedAgentCountryBreakdown.map((row) => row.country),
      datasets: [
        {
          label: 'Country performance',
          data: selectedAgentCountryBreakdown.map((row) => Number(row.performanceValue || 0)),
          backgroundColor: selectedAgentCountryBreakdown.map(
            (_, idx) => PIE_COLORS[idx % PIE_COLORS.length]
          ),
          borderColor: 'rgba(10, 16, 27, 0.88)',
          borderWidth: 2,
        },
      ],
    }
  }, [selectedAgentCountryBreakdown])

  const showOverlayLoader = Boolean(loading)
  const freshnessLabel = lastLoadedAt
    ? lastLoadedAt.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--'

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

  const stickyColRank = {
    position: 'sticky',
    left: 0,
    zIndex: 3,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  }

  const stickyColAgent = {
    position: 'sticky',
    left: 56,
    zIndex: 3,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  }

  const sectionCardStyle = {
    padding: 16,
    borderRadius: 18,
    border: '1px solid rgba(148,163,184,0.14)',
    background: 'linear-gradient(180deg, rgba(15,23,42,0.88), rgba(8,15,30,0.78))',
    boxShadow: '0 18px 44px rgba(2, 8, 23, 0.24)',
  }

  const sectionEyebrowStyle = {
    margin: 0,
    color: 'rgba(148,163,184,0.88)',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  }

  const sectionTitleStyle = {
    margin: '4px 0 0',
    fontSize: 18,
    fontWeight: 900,
    color: 'var(--text-primary)',
  }

  const sectionSubtitleStyle = {
    margin: '6px 0 0',
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 600,
  }

  const personalCountryMetricLabel =
    selectedAgentCountryBreakdown[0]?.metricLabel === 'net' ? 'net deposit' : 'deposit'

  return (
    <div
      ref={pageRootRef}
      className="page-shell profitable-ranking-page sales-agent-monitor-page sales-agent-monitor-layout"
      style={{ height: 'auto', maxHeight: 'none', overflow: 'visible', minHeight: '100%' }}
    >
      {showOverlayLoader ? (
        <div
          className="logo-tools-backdrop"
          role="status"
          aria-live="polite"
          aria-label="Loading..."
          style={{ zIndex: 210, display: 'grid', placeItems: 'center', padding: 14 }}
        >
          <div style={{ width: 'min(420px, 92vw)' }}>
            <FullPageLoader progress={40} subtitle="Loading..." minHeight="auto" />
          </div>
        </div>
      ) : null}

      <div className="sales-agent-monitor-main">
        <header
          className="page-header sales-agent-monitor-header"
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <section className="sales-agent-monitor-summaryStrip">
            <div className="sales-agent-monitor-summaryRow">
              <article className="sales-agent-monitor-summaryCard">
                <span className="sales-agent-monitor-summaryLabel">
                  {t('salesAgentsMonitor.kpi.agents')}
                </span>
                <strong className="sales-agent-monitor-summaryValue">
                  {fmtInt(salesAgentKpis.agents)}
                </strong>
              </article>

              <article className="sales-agent-monitor-summaryCard">
                <span className="sales-agent-monitor-summaryLabel">
                  {t('salesAgentsMonitor.kpi.activeClients')}
                </span>
                <strong className="sales-agent-monitor-summaryValue">
                  {fmtInt(salesAgentKpis.activeClients)}
                </strong>
              </article>

              <article className="sales-agent-monitor-summaryCard">
                <span className="sales-agent-monitor-summaryLabel">
                  {t('salesAgentsMonitor.kpi.totalDeposit')}
                </span>
                <strong className="sales-agent-monitor-summaryValue">
                  {fmtMoney0(salesAgentKpis.totalDeposit)}
                </strong>
              </article>

              <article className="sales-agent-monitor-summaryCard">
                <span className="sales-agent-monitor-summaryLabel">
                  {t('salesAgentsMonitor.kpi.totalNet')}
                </span>
                <strong className="sales-agent-monitor-summaryValue">
                  {fmtMoney0(salesAgentKpis.totalNet)}
                </strong>
              </article>

              <article className="sales-agent-monitor-summaryCard">
                <span className="sales-agent-monitor-summaryLabel">
                  {t('salesAgentsMonitor.kpi.avgNetPerAgent')}
                </span>
                <strong className="sales-agent-monitor-summaryValue">
                  {fmtMoney0(salesAgentKpis.avgNetPerAgent)}
                </strong>
              </article>

              <article className="sales-agent-monitor-summaryCard sales-agent-monitor-summaryCard--status">
                <div className="sales-agent-monitor-summaryMeta">
                  <span className="sales-agent-monitor-sourceBadge sales-agent-monitor-sourceBadge--neutral">
                    Fonte: {sourceMode === 'cached' ? 'Cached snapshot' : 'Live API'}
                  </span>
                  <span className="sales-agent-monitor-sourceBadge sales-agent-monitor-sourceBadge--neutral">
                    Aggiornato: {freshnessLabel}
                  </span>
                </div>
                <button
                  type="button"
                  className="sales-agent-monitor-refreshBtn"
                  onClick={() => loadFromConsoleArtifact({ force: true })}
                  disabled={loading}
                >
                  {loading ? 'Aggiornamento...' : 'Aggiorna dati'}
                </button>
              </article>
            </div>
          </section>

          <section
            className="sales-agent-monitor-filterRow sales-agent-monitor-heroCard sales-agent-monitor-heroCard--filters"
            style={{ padding: 12 }}
          >
            <div>
              <div className="sales-agent-monitor-filterMenus">
                <div
                  className="ranking-filter-field sales-agent-monitor-filterUnit"
                  style={{ minWidth: 160, flexShrink: 0 }}
                >
                  {periodAvailable ? (
                    <select
                      value={timeframe === 'month' || timeframe === 'year' ? 'custom' : timeframe}
                      onChange={(e) => {
                        const next = String(e.target.value || 'last12')
                        if (next === 'custom') {
                          setTimeframe(selectedMonthKey ? 'month' : 'year')
                          return
                        }
                        setTimeframe(next)
                        if (next === 'all' || next === 'last12') setSelectedMonthKey('')
                      }}
                      className="search-hero-input ranking-filter-input"
                      style={{ minHeight: 40 }}
                      aria-label="Intervallo periodo"
                    >
                      <option value="last12">Ultimi 12 mesi</option>
                      <option value="custom">Personalizzato</option>
                      <option value="all">Tutti</option>
                    </select>
                  ) : null}
                </div>

                <div
                  className="ranking-filter-field sales-agent-monitor-filterUnit"
                  style={{ minWidth: 140, flexShrink: 0 }}
                >
                  <select
                    value={selectedYear || ''}
                    onChange={(e) => {
                      const year = Number(e.target.value || 0) || null
                      setSelectedYear(year)
                      setSelectedMonthKey('')
                      if (year) setTimeframe('year')
                    }}
                    className="search-hero-input ranking-filter-input"
                    style={{ minHeight: 40 }}
                    aria-label="Anno"
                  >
                    {yearOptions.map((year) => (
                      <option key={`year-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className="ranking-filter-field sales-agent-monitor-filterUnit"
                  style={{ minWidth: 170, flexShrink: 0 }}
                >
                  <select
                    value={selectedMonthKey || ''}
                    onChange={(e) => {
                      const periodKey = String(e.target.value || '')
                      if (!periodKey) {
                        setSelectedMonthKey('')
                        setTimeframe(selectedYear ? 'year' : 'all')
                        return
                      }
                      setSelectedMonthKey(periodKey)
                      setTimeframe('month')
                    }}
                    className="search-hero-input ranking-filter-input"
                    style={{ minHeight: 40 }}
                    disabled={!selectedYear}
                    aria-label="Mese"
                  >
                    <option value="">Tutti i mesi</option>
                    {monthOptionsForSelectedYear.map((month) => {
                      const value = `${selectedYear}-${String(month).padStart(2, '0')}`
                      const hasData = availableMonthOptionsForSelectedYear.includes(month)
                      return (
                        <option key={`month-${value}`} value={value}>
                          {formatPeriodLabel(value)}
                          {hasData ? '' : ' (no data)'}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div
                  className="ranking-filter-field sales-agent-monitor-filterUnit"
                  style={{ minWidth: 300, flexShrink: 0 }}
                >
                  <input
                    type="text"
                    className="search-hero-input ranking-filter-input ranking-filter-agents"
                    value={agentQuery}
                    onChange={(e) => {
                      const rawValue = String(e.target.value || '')
                      setAgentQuery(rawValue)

                      const normalized = rawValue.trim().toLowerCase()
                      if (!normalized) {
                        setSelectedAgents([])
                        return
                      }

                      const exactMatch = agentOptions.find(
                        (a) =>
                          String(a || '')
                            .trim()
                            .toLowerCase() === normalized
                      )
                      setSelectedAgents(exactMatch ? [String(exactMatch)] : [])
                    }}
                    list="sales-agent-options"
                    style={{ minHeight: 40 }}
                    placeholder={t('salesAgentsMonitor.personal.selectPlaceholder')}
                    aria-label={t('salesAgentsMonitor.filterByAgent')}
                  />
                  <datalist id="sales-agent-options">
                    {agentOptions.map((a) => (
                      <option key={String(a)} value={String(a)} />
                    ))}
                  </datalist>
                </div>

                <label
                  className="ranking-filter-field sales-agent-monitor-filterUnit sales-agent-monitor-filterUnit--check"
                  style={{ minWidth: 190, flexShrink: 0 }}
                >
                  <input
                    type="checkbox"
                    checked={focusSalesTeamOnly}
                    onChange={(e) => setFocusSalesTeamOnly(Boolean(e.target.checked))}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  <span>Sales-conversion team ({salesConversionTeamCount})</span>
                </label>

                <label
                  className="ranking-filter-field sales-agent-monitor-filterUnit sales-agent-monitor-filterUnit--check"
                  style={{ minWidth: 210, flexShrink: 0 }}
                >
                  <input
                    type="checkbox"
                    checked={focusRetentionTeamOnly}
                    onChange={(e) => setFocusRetentionTeamOnly(Boolean(e.target.checked))}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  <span>Retention team ({retentionTeamCount})</span>
                </label>
              </div>
            </div>
          </section>
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

        <section
          className="sales-agent-monitor-section"
          style={{ ...sectionCardStyle, padding: 18 }}
        >
          <div className="sales-agent-monitor-panelHeader" style={{ marginBottom: 14 }}>
            <div>
              <p style={sectionEyebrowStyle}>Ranking</p>
              <h2 style={sectionTitleStyle}>Ranking agenti</h2>
              <p style={sectionSubtitleStyle}>
                Classifica completa per confrontare in modo ordinato performance e trend.
              </p>
            </div>
            <div className="sales-agent-monitor-miniStat">
              <span className="sales-agent-monitor-miniStatLabel">Agenti visibili</span>
              <span className="sales-agent-monitor-miniStatValue">
                {fmtInt(salesAgentRows.length)}
              </span>
            </div>
          </div>
          <div
            className="ranking-table-scroll hide-scrollbar"
            tabIndex={0}
            aria-label="Sales agents table"
            style={{
              overflowY: 'visible',
              maxHeight: 'none',
              overflowX: 'auto',
              overscrollBehavior: 'auto',
            }}
          >
            <table
              className="table payout-unified-table ranking-table sticky-metrics-table"
              style={{
                width: '100%',
                minWidth: 1380,
                borderCollapse: 'separate',
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{ ...headerCellStyle, ...stickyColRank, textAlign: 'left', width: 56 }}
                  >
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.rank')}>
                      {t('salesAgentsMonitor.table.rank')}
                    </span>
                  </th>
                  <th
                    style={{ ...headerCellStyle, ...stickyColAgent, textAlign: 'left', width: 200 }}
                  >
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
                    <span
                      style={metricLabelStyle}
                      title={t('salesAgentsMonitor.tooltip.netPerClient')}
                    >
                      {t('salesAgentsMonitor.table.netPerClient')}
                    </span>
                  </th>
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span
                      style={metricLabelStyle}
                      title={t('salesAgentsMonitor.tooltip.tradesPerClient')}
                    >
                      {t('salesAgentsMonitor.table.tradesPerClient')}
                    </span>
                  </th>
                  {latestPeriodNetByAgent.latestLabel ? (
                    <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                      Net {latestPeriodNetByAgent.latestLabel}
                    </th>
                  ) : null}
                  {latestPeriodNetByAgent.prevLabel ? (
                    <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                      Net {latestPeriodNetByAgent.prevLabel}
                    </th>
                  ) : null}
                  <th style={{ ...headerCellStyle, textAlign: 'right' }}>
                    <span style={metricLabelStyle} title={t('salesAgentsMonitor.tooltip.momDelta')}>
                      {t('salesAgentsMonitor.table.momDelta')}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesAgentRows.map((r, idx) => {
                  const trend = latestPeriodNetByAgent.byAgent.get(r.agent) || {
                    latest: 0,
                    prev: 0,
                  }
                  const delta = Number(trend.latest || 0) - Number(trend.prev || 0)
                  const deltaTone = toneFromDelta(delta)
                  const deltaColor =
                    deltaTone === 'up'
                      ? 'rgba(16, 185, 129, 0.95)'
                      : deltaTone === 'down'
                        ? 'rgba(248, 113, 113, 0.95)'
                        : 'var(--text-muted)'

                  return (
                    <tr
                      key={r.agent}
                      style={{ background: idx % 2 ? 'rgba(255,255,255,0.008)' : 'transparent' }}
                    >
                      <td
                        style={{
                          ...bodyCellStyle,
                          ...stickyColRank,
                          textAlign: 'left',
                          fontWeight: 800,
                          background: idx % 2 ? 'rgba(11,16,28,0.94)' : 'rgba(7,12,22,0.94)',
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td
                        style={{
                          ...bodyCellStyle,
                          ...stickyColAgent,
                          textAlign: 'left',
                          fontWeight: 800,
                          background: idx % 2 ? 'rgba(11,16,28,0.9)' : 'rgba(7,12,22,0.9)',
                        }}
                      >
                        {r.agent}
                      </td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtInt(r.clients)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                        {fmtInt(r.activeClients)}
                      </td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                        {fmtMoney0(r.deposit)}
                      </td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                        {fmtMoney0(r.withdrawals)}
                      </td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtMoney0(r.net)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                        {fmtMoney0(r.closedPL)}
                      </td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>{fmtInt(r.trades)}</td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                        {fmtMoney0(r.netPerClient)}
                      </td>
                      <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                        {fmtNum2(r.tradesPerClient)}
                      </td>
                      {latestPeriodNetByAgent.latestLabel ? (
                        <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                          {fmtMoney0(trend.latest)}
                        </td>
                      ) : null}
                      {latestPeriodNetByAgent.prevLabel ? (
                        <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                          {fmtMoney0(trend.prev)}
                        </td>
                      ) : null}
                      <td
                        style={{
                          ...bodyCellStyle,
                          textAlign: 'right',
                          fontWeight: 800,
                          color: canPopulateMomColumn ? deltaColor : 'var(--text-muted)',
                        }}
                      >
                        {canPopulateMomColumn ? fmtSignedMoney0(delta) : '--'}
                      </td>
                    </tr>
                  )
                })}
                {!salesAgentRows.length ? (
                  <tr>
                    <td
                      colSpan={
                        latestPeriodNetByAgent.latestLabel
                          ? latestPeriodNetByAgent.prevLabel
                            ? 14
                            : 13
                          : 12
                      }
                      style={{ ...bodyCellStyle, padding: 14, color: 'var(--text-muted)' }}
                    >
                      {t('salesAgentsMonitor.table.noAgents')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── INSIGHTS SECTION: overview vs personal ── */}
        {!isPersonalMode ? (
          <section
            className="sales-agent-monitor-section"
            style={{
              ...sectionCardStyle,
              padding: 18,
            }}
          >
            <div className="sales-agent-monitor-panelHeader" style={{ marginBottom: 14 }}>
              <div>
                <p style={sectionEyebrowStyle}>Overview</p>
                <h2 style={sectionTitleStyle}>{t('salesAgentsMonitor.top6.title')}</h2>
                <p style={sectionSubtitleStyle}>{t('salesAgentsMonitor.top6.subtitle')}</p>
              </div>
              <div className="sales-agent-monitor-miniStat">
                <span className="sales-agent-monitor-miniStatLabel">Net totale</span>
                <span className="sales-agent-monitor-miniStatValue">
                  {fmtMoney0(salesAgentKpis.totalNet)}
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 8,
              }}
            >
              {bestSixAgents.map((agent) => {
                const tone = toneFromDelta(agent.delta)
                const toneColor =
                  tone === 'up'
                    ? 'rgba(16,185,129,0.95)'
                    : tone === 'down'
                      ? 'rgba(248,113,113,0.95)'
                      : 'var(--text-muted)'
                return (
                  <article
                    key={`top-${agent.agent}`}
                    className="sales-agent-monitor-reveal"
                    style={{
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(9,14,22,0.6)',
                      padding: 10,
                      animationDelay: `${Math.min(360, agent.rank * 40)}ms`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 13 }}>
                        #{agent.rank} {agent.agent}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)' }}>
                        {fmtNum2(agent.weightPct)}%
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>
                      {fmtMoney0(agent.net)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>
                        {fmtInt(agent.clients)} | {fmtInt(agent.trades)}
                      </span>
                      <span style={{ fontWeight: 800, color: toneColor }}>
                        {fmtSignedMoney0(agent.delta)}
                      </span>
                    </div>
                  </article>
                )
              })}
              {loading && !bestSixAgents.length
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <article
                      key={`top-skeleton-${idx}`}
                      className="sales-agent-monitor-skeletonCard"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="sales-agent-monitor-skeletonLine" style={{ width: '72%' }} />
                      <div
                        className="sales-agent-monitor-skeletonLine"
                        style={{ width: '48%', height: 18, marginTop: 10 }}
                      />
                      <div className="sales-agent-monitor-skeletonLine" style={{ width: '90%' }} />
                    </article>
                  ))
                : null}
              {!bestSixAgents.length ? (
                <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12 }}>
                  {t('salesAgentsMonitor.top6.empty')}
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <section
            className="sales-agent-monitor-section"
            style={{
              ...sectionCardStyle,
              padding: 18,
            }}
          >
            <div className="sales-agent-monitor-panelHeader" style={{ marginBottom: 14 }}>
              <div>
                <p style={sectionEyebrowStyle}>Focus agente</p>
                <h2 style={sectionTitleStyle}>
                  {t('salesAgentsMonitor.personal.title', { name: selectedAgentName })}
                </h2>
                <p style={sectionSubtitleStyle}>{t('salesAgentsMonitor.personal.subtitle')}</p>
              </div>
              <div className="sales-agent-monitor-miniStat">
                <span className="sales-agent-monitor-miniStatLabel">Trend mese</span>
                <span className="sales-agent-monitor-miniStatValue">
                  {selectedAgentSnapshot ? fmtSignedMoney0(selectedAgentSnapshot.delta) : '--'}
                </span>
              </div>
            </div>
            {selectedAgentSnapshot ? (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <KpiCard
                    label={t('salesAgentsMonitor.personal.kpi.clients')}
                    value={fmtInt(selectedAgentSnapshot.clients)}
                    size="sm"
                    density="compact"
                  />
                  <KpiCard
                    label={t('salesAgentsMonitor.personal.kpi.activeRate')}
                    value={`${fmtInt(selectedAgentSnapshot.activeRate)}%`}
                    size="sm"
                    density="compact"
                  />
                  <KpiCard
                    label={t('salesAgentsMonitor.personal.kpi.net')}
                    value={fmtMoney0(selectedAgentSnapshot.net)}
                    size="sm"
                    density="compact"
                  />
                  <KpiCard
                    label={t('salesAgentsMonitor.personal.kpi.netPerClient')}
                    value={fmtMoney0(selectedAgentSnapshot.netPerClient)}
                    size="sm"
                    density="compact"
                  />
                  <KpiCard
                    label={t('salesAgentsMonitor.personal.kpi.momDelta')}
                    value={fmtSignedMoney0(selectedAgentSnapshot.delta)}
                    size="sm"
                    density="compact"
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 8,
                  }}
                >
                  {selectedAgentSnapshot.insights.map((ins, insIdx) => (
                    <article
                      key={`personal-ins-${insIdx}`}
                      style={{
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(9,14,22,0.55)',
                        padding: 10,
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 4 }}>
                        <span style={{ marginRight: 6 }}>{ins.icon}</span>
                        {ins.title}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{ins.desc}</div>
                    </article>
                  ))}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <section
                    style={{
                      ...sectionCardStyle,
                      padding: 14,
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 13 }}>
                        Performance by country
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>
                        Small percentages are grouped into one slice.
                      </div>
                    </div>
                    <div style={{ height: 260, position: 'relative' }}>
                      {selectedAgentCountryPie ? (
                        <Pie
                          data={selectedAgentCountryPie}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  title: (items) => {
                                    const row =
                                      selectedAgentCountryBreakdown[items?.[0]?.dataIndex || 0]
                                    return row?.country || ''
                                  },
                                  label: (context) => {
                                    const row = selectedAgentCountryBreakdown[context.dataIndex]
                                    const share = Number(row?.sharePct || 0)
                                    const value =
                                      row?.metricLabel === 'net'
                                        ? fmtMoney0(row?.net)
                                        : fmtMoney0(row?.deposit)
                                    return `${value} · ${fmtNum2(share)}%`
                                  },
                                },
                              },
                            },
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            paddingTop: 32,
                          }}
                        >
                          No country breakdown available for this agent.
                        </div>
                      )}
                    </div>
                  </section>

                  <section
                    style={{
                      ...sectionCardStyle,
                      padding: 14,
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 13 }}>
                        Top countries detail
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>
                        Ranked by {personalCountryMetricLabel} contribution.
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {selectedAgentCountryBreakdown.map((row, idx) => (
                        <div
                          key={`country-${row.country}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: 10,
                            alignItems: 'center',
                            padding: '9px 10px',
                            borderRadius: 10,
                            background: 'rgba(9,14,22,0.55)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              title={row.country}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontWeight: 900,
                                fontSize: 12,
                                minWidth: 0,
                              }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 999,
                                  background: PIE_COLORS[idx % PIE_COLORS.length],
                                  flex: '0 0 auto',
                                }}
                              />
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {row.country}
                              </span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                              {fmtInt(row.clients)} clients · {fmtMoney0(row.net)} net
                            </div>
                          </div>
                          <div
                            style={{
                              fontWeight: 900,
                              fontSize: 12,
                              color: 'rgba(34,211,238,0.95)',
                            }}
                          >
                            {fmtNum2(row.sharePct)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12 }}>
                {t('salesAgentsMonitor.personal.noData')}
              </div>
            )}
          </section>
        )}

        {/* ── CHARTS (overview only) ── */}
        {!isPersonalMode ? (
          <section
            className="sales-agent-monitor-section"
            style={{
              ...sectionCardStyle,
              padding: 18,
            }}
          >
            <div className="sales-agent-monitor-panelHeader" style={{ marginBottom: 14 }}>
              <div>
                <p style={sectionEyebrowStyle}>Grafici</p>
                <h2 style={sectionTitleStyle}>Performance maps</h2>
                <p style={sectionSubtitleStyle}>
                  Due letture veloci per capire chi porta volume e chi genera risultato.
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 12,
              }}
            >
              <section
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
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
                    <div
                      style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 20 }}
                    >
                      {t('salesAgentsMonitor.charts.empty')}
                    </div>
                  )}
                </div>
              </section>

              <section
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
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
                        labels: [...salesAgentRows]
                          .sort((a, b) => b.closedPL - a.closedPL)
                          .slice(0, 10)
                          .map((r) => r.agent),
                        datasets: [
                          {
                            label: 'Closed P&L (EUR)',
                            data: [...salesAgentRows]
                              .sort((a, b) => b.closedPL - a.closedPL)
                              .slice(0, 10)
                              .map((r) => Number(r.closedPL || 0)),
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
                    <div
                      style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 20 }}
                    >
                      {t('salesAgentsMonitor.charts.empty')}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>
        ) : null}

        {!isPersonalMode ? (
          <section
            className="sales-agent-monitor-section"
            style={{
              ...sectionCardStyle,
              padding: 18,
            }}
          >
            <div className="sales-agent-monitor-panelHeader" style={{ marginBottom: 14 }}>
              <div>
                <p style={sectionEyebrowStyle}>Alert</p>
                <h2 style={sectionTitleStyle}>{t('salesAgentsMonitor.alerts.title')}</h2>
                <p style={sectionSubtitleStyle}>{t('salesAgentsMonitor.alerts.subtitle')}</p>
              </div>
              <div className="sales-agent-monitor-miniStat">
                <span className="sales-agent-monitor-miniStatLabel">Agenti in alert</span>
                <span className="sales-agent-monitor-miniStatValue">
                  {fmtInt(agentsWithAlerts.length)}
                </span>
              </div>
            </div>

            {agentsWithAlerts.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 10,
                }}
              >
                {agentsWithAlerts.map((alert) => (
                  <article
                    key={`alert-${alert.agent}`}
                    className="sales-agent-monitor-reveal"
                    style={{
                      borderRadius: 12,
                      border: '1px solid rgba(248,113,113,0.24)',
                      background: 'linear-gradient(180deg, rgba(127,29,29,0.2), rgba(9,14,22,0.5))',
                      padding: 12,
                      animationDelay: `${Math.min(420, alert.issues.length * 30)}ms`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{alert.agent}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>
                        {fmtSignedMoney0(alert.momDelta)}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {alert.issues.slice(0, 3).map((issue, idx) => (
                        <div
                          key={`issue-${alert.agent}-${idx}`}
                          style={{
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '8px 9px',
                            background: 'rgba(9,14,22,0.45)',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 2 }}>
                            <span style={{ marginRight: 6 }}>{issue.icon}</span>
                            {issue.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {issue.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12 }}>
                {t('salesAgentsMonitor.alerts.empty')}
              </div>
            )}
          </section>
        ) : null}

        {!isPersonalMode ? (
          <section
            className="sales-agent-monitor-section sales-agent-monitor-cta"
            style={{
              padding: 16,
              borderRadius: 18,
              border: '1px dashed rgba(96,165,250,0.26)',
              background: 'linear-gradient(180deg, rgba(30,41,59,0.54), rgba(15,23,42,0.3))',
            }}
          >
            <p style={sectionEyebrowStyle}>Prossimo step</p>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
              {t('salesAgentsMonitor.personal.ctaTitle')}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
              {t('salesAgentsMonitor.personal.ctaSubtitle')}
            </div>
          </section>
        ) : null}
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
