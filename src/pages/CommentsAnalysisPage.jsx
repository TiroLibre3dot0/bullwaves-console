import React, { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import CardSection from '../components/common/CardSection'
import KpiCard from '../components/common/KpiCard'
import PeriodSelector from '../components/common/PeriodSelector'
import { formatEuro, formatNumberShort } from '../lib/formatters'
import { useI18n } from '../i18n/I18nContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const CPA_EUR = 650
const DEFAULT_COST_FROM = 2287
const COMMENTS_URL = '/comments.csv'
const REGISTRATIONS_URL = '/Registrations Report.csv'
const PAYMENTS_URL = '/Payments Report.csv'

const toInt = (val) => {
  if (val === null || val === undefined) return null
  const n = Number(String(val).trim())
  return Number.isFinite(n) ? n : null
}

const parseDate = (val) => {
  if (!val || typeof val !== 'string') return null
  // Try ISO format first
  let d = new Date(val)
  if (!isNaN(d)) return d
  // Try MM/DD/YYYY HH:MM:SS format
  const parts = val.trim().split(/\s+/)
  if (parts.length >= 1) {
    const datePart = parts[0]
    const [m, day, y] = datePart.split('/').map(Number)
    if (m && day && y) {
      d = new Date(y, m - 1, day)
      return isNaN(d) ? null : d
    }
  }
  return null
}

const normalizeKey = (k) =>
  (k || '').toString().trim().toLowerCase().replace(/\s+/g, '').replace(/_/g, '')

const isValidTransfer = (row) => {
  const from = toInt(row.from_affiliate_id)
  const to = toInt(row.to_affiliate_id)
  return from !== null && to !== null && from !== to
}

const sortDesc = (arr, key) => [...arr].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))

const monthLabel = (m) =>
  ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'][m] ||
  `${m + 1}`

const ChartBlock = ({ title, subtitle, labels, values, color, formatter, t, axis = 'x' }) => {
  const data = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: axis === 'y' ? 'y' : 'x',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const raw = axis === 'y' ? ctx.parsed.x : ctx.parsed.y
            const val = formatter ? formatter(raw) : raw
            const lbl = labels?.[ctx.dataIndex] ? `${labels[ctx.dataIndex]}: ` : ''
            return `${lbl}${val}`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cbd5e1',
          maxRotation: axis === 'y' ? 0 : 45,
          minRotation: axis === 'y' ? 0 : 45,
        },
        grid: { display: axis === 'y' },
      },
      y: {
        ticks: {
          color: '#cbd5e1',
          callback: (v) => (formatter ? formatter(v) : v),
        },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
    },
  }

  return (
    <div className="card-block">
      <div className="card-block-header">
        <div>
          <p className="eyebrow">{t('analysis.chart.ranking')}</p>
          <h3>{title}</h3>
          <p className="muted">{subtitle}</p>
        </div>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}

function CommentsReportSection({ rows, year, month, affiliateMap }) {
  const { t } = useI18n()
  const stats = useMemo(() => {
    if (!rows.length) return null
    const inbound = new Map()
    const outbound = new Map()
    const flows = new Map()
    const users = new Set()
    let transfers = 0

    rows.forEach((row) => {
      if (!isValidTransfer(row)) return
      const dt = parseDate(row.created_on)
      const matchesYear = year === 'all' || (dt && dt.getFullYear() === year)
      const matchesMonth = month === 'all' || (dt && dt.getMonth() + 1 === month)
      if (!matchesYear || !matchesMonth) return

      transfers += 1
      const from = toInt(row.from_affiliate_id)
      const to = toInt(row.to_affiliate_id)
      const user = row.bullwaves_user || row.bullwaves_id
      if (user) users.add(String(user))

      inbound.set(to, (inbound.get(to) || 0) + 1)
      outbound.set(from, (outbound.get(from) || 0) + 1)
      const key = `${from} → ${to}`
      flows.set(key, (flows.get(key) || 0) + 1)
    })

    const affiliates = new Set([...inbound.keys(), ...outbound.keys()])
    const list = [...affiliates].map((id) => {
      const inCnt = inbound.get(id) || 0
      const outCnt = outbound.get(id) || 0
      return { id, inbound: inCnt, outbound: outCnt, net: inCnt - outCnt }
    })

    const byInbound = sortDesc(list, 'inbound')
    const byOutbound = sortDesc(list, 'outbound')
    const byNet = sortDesc(list, 'net')
    const flowsSorted = [...flows.entries()].sort((a, b) => b[1] - a[1])

    const movedFromDefault = outbound.get(DEFAULT_COST_FROM) || 0
    const extraCost = movedFromDefault * CPA_EUR

    return {
      transfers,
      uniqueUsers: users.size,
      affiliatesCount: affiliates.size,
      byInbound,
      byOutbound,
      byNet,
      flows: flowsSorted,
      movedFromDefault,
      extraCost,
    }
  }, [rows, year, month])

  if (!stats) return <p style={{ margin: 0 }}>{t('analysis.noData')}</p>

  const getAffLabel = (id) => {
    const key = id != null ? String(id) : ''
    const name = affiliateMap.get(key)
    return name ? `${key} — ${name}` : key
  }

  const inboundTop = stats.byInbound.slice(0, 10).map((r) => ({ ...r, label: getAffLabel(r.id) }))
  const outboundTop = stats.byOutbound.slice(0, 10).map((r) => ({ ...r, label: getAffLabel(r.id) }))
  const netTop = stats.byNet.slice(0, 10).map((r) => ({ ...r, label: getAffLabel(r.id) }))
  const flowTop = stats.flows.slice(0, 15).map(([flow, count]) => {
    const [fromRaw, toRaw] = flow.split(' → ')
    const from = getAffLabel(fromRaw)
    const to = getAffLabel(toRaw)
    return { flow: `${from} → ${to}`, count }
  })
  const flowCostTop = flowTop.map((f) => ({ flow: f.flow, cost: f.count * CPA_EUR }))

  return (
    <>
      <CardSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KpiCard
            label={t('analysis.kpi.validTransfers')}
            value={formatNumberShort(stats.transfers)}
            fullValue={stats.transfers.toLocaleString()}
            style={{ position: 'relative' }}
          />
          <KpiCard
            label={t('analysis.kpi.uniqueUsers')}
            value={formatNumberShort(stats.uniqueUsers)}
            fullValue={stats.uniqueUsers.toLocaleString()}
            style={{ position: 'relative' }}
          />
          <KpiCard
            label={t('analysis.kpi.affiliatesInvolved')}
            value={formatNumberShort(stats.affiliatesCount)}
            fullValue={stats.affiliatesCount.toLocaleString()}
            style={{ position: 'relative' }}
          />
          <KpiCard
            label={t('analysis.kpi.economicImpact', { id: DEFAULT_COST_FROM })}
            value={formatEuro(stats.extraCost)}
            fullValue={`€ ${Math.round(stats.extraCost).toLocaleString()}`}
            helper={t('analysis.kpi.economicImpactHelper', {
              count: formatNumberShort(stats.movedFromDefault),
              cpa: formatEuro(CPA_EUR),
            })}
            tone="#fbbf24"
            style={{ position: 'relative' }}
          />
        </div>
      </CardSection>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 24 }}
      >
        <ChartBlock
          t={t}
          title={t('analysis.chart.top10Inbound')}
          subtitle={t('analysis.chart.top10InboundSubtitle')}
          labels={inboundTop.map((r) => r.label)}
          values={inboundTop.map((r) => r.inbound)}
          color="rgba(52, 211, 153, 0.75)"
          formatter={(v) => formatNumberShort(v)}
        />

        <ChartBlock
          t={t}
          title={t('analysis.chart.top10Outbound')}
          subtitle={t('analysis.chart.top10OutboundSubtitle')}
          labels={outboundTop.map((r) => r.label)}
          values={outboundTop.map((r) => r.outbound)}
          color="rgba(239, 68, 68, 0.75)"
          formatter={(v) => formatNumberShort(v)}
        />

        <ChartBlock
          t={t}
          title={t('analysis.chart.top10Net')}
          subtitle={t('analysis.chart.top10NetSubtitle')}
          labels={netTop.map((r) => r.label)}
          values={netTop.map((r) => r.net)}
          color="rgba(251, 191, 36, 0.85)"
          formatter={(v) => formatNumberShort(v)}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <ChartBlock
            t={t}
            axis="y"
            title={t('analysis.chart.top15Flows')}
            subtitle={t('analysis.chart.top15FlowsSubtitle')}
            labels={flowTop.map((f) => f.flow)}
            values={flowTop.map((f) => f.count)}
            color="rgba(59, 130, 246, 0.75)"
            formatter={(v) => formatNumberShort(v)}
          />
          <ChartBlock
            t={t}
            axis="y"
            title={t('analysis.chart.top15Flows') + ' — €'}
            subtitle={t('analysis.chart.top15FlowsSubtitle')}
            labels={flowCostTop.map((f) => f.flow)}
            values={flowCostTop.map((f) => f.cost)}
            color="rgba(248, 180, 0, 0.8)"
            formatter={(v) => formatEuro(v)}
          />
        </div>
      </div>
    </>
  )
}

function BotUsersSection() {
  const { t } = useI18n()
  return (
    <div className="card-block">
      <div className="card-block-header">
        <div>
          <p className="eyebrow">{t('analysis.bots.eyebrow')}</p>
          <h3>{t('analysis.bots.title')}</h3>
          <p className="muted">{t('analysis.bots.description')}</p>
        </div>
      </div>
      <p style={{ margin: 0 }}>{t('analysis.bots.details')}</p>
    </div>
  )
}

export default function CommentsAnalysisPage() {
  const { t } = useI18n()
  const [rows, setRows] = useState([])
  const [affiliateMap, setAffiliateMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [tab, setTab] = useState('comments')

  useEffect(() => {
    let mounted = true
    const map = new Map()
    const ingestRow = (row) => {
      const entries = Object.entries(row || {})
      let id = null
      let name = null
      for (const [k, v] of entries) {
        const nk = normalizeKey(k)
        if (!id && (nk === 'affiliateid' || nk === 'affiliate')) id = v
        if (!name && (nk === 'affiliate' || nk === 'affiliatename' || nk === 'affiliatename'))
          name = v
      }
      if (id) {
        const key = String(id).trim()
        const val = (name || '').toString().trim()
        if (key && !map.has(key)) map.set(key, val || key)
      }
    }

    Papa.parse(COMMENTS_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (!mounted) return
        if (errors && errors.length) {
          setError(t('analysis.error.parsing'))
          setLoading(false)
          return
        }
        setRows(Array.isArray(data) ? data : [])
        setLoading(false)
      },
      error: (err) => {
        if (!mounted) return
        setError(err?.message || t('analysis.error.loading'))
        setLoading(false)
      },
    })
    Papa.parse(REGISTRATIONS_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        if (!mounted) return
        data.forEach(ingestRow)
        setAffiliateMap(new Map(map))
      },
    })
    Papa.parse(PAYMENTS_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        if (!mounted) return
        data.forEach(ingestRow)
        setAffiliateMap(new Map(map))
      },
    })
    return () => {
      mounted = false
    }
  }, [])

  const periodOptions = useMemo(() => {
    const yearsSet = new Set()
    const monthsMap = new Map()
    rows.forEach((r) => {
      const d = parseDate(r.created_on)
      if (!d) return
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      yearsSet.add(y)
      const arr = monthsMap.get(y) || []
      if (!arr.some((x) => x.value === m)) {
        arr.push({ value: m, label: `${m} - ${monthLabel(m - 1)}` })
        monthsMap.set(y, arr)
      }
    })
    const years = Array.from(yearsSet).sort((a, b) => a - b)
    const monthsObj = {}
    monthsMap.forEach((v, k) => {
      monthsObj[k] = v.sort((a, b) => a.value - b.value)
    })
    return { years, monthsObj }
  }, [rows])

  if (loading)
    return (
      <div className="page-shell">
        <p>{t('analysis.loading')}</p>
      </div>
    )
  if (error)
    return (
      <div className="page-shell">
        <p style={{ color: '#d32f2f' }}>{error}</p>
      </div>
    )

  return (
    <div className="page-shell">
      <header className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <p className="page-label">{t('analysis.header.label')}</p>
          <h1 className="page-title">{t('analysis.header.title')}</h1>
          <p className="page-subtitle">{t('analysis.header.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs" style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`pill-tab ${tab === 'comments' ? 'active' : ''}`}
              onClick={() => setTab('comments')}
            >
              {t('analysis.tabs.comments')}
            </button>
            <button
              type="button"
              className={`pill-tab ${tab === 'bots' ? 'active' : ''}`}
              onClick={() => setTab('bots')}
            >
              {t('analysis.tabs.bots')}
            </button>
          </div>
          <PeriodSelector
            availableYears={periodOptions.years}
            availableMonths={periodOptions.monthsObj}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={(y) => {
              setSelectedYear(y)
              setSelectedMonth('all')
            }}
            onMonthChange={(m) => setSelectedMonth(m)}
          />
        </div>
      </header>

      {tab === 'comments' && (
        <CommentsReportSection
          rows={rows}
          year={selectedYear}
          month={selectedMonth}
          affiliateMap={affiliateMap}
        />
      )}
      {tab === 'bots' && <BotUsersSection />}
    </div>
  )
}
