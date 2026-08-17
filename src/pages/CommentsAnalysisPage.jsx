import React, { useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import CardSection from '../components/common/CardSection'
import KpiCard from '../components/common/KpiCard'
import PeriodSelector from '../components/common/PeriodSelector'
import FullPageLoader from '../components/FullPageLoader'
import { formatEuro, formatNumberShort } from '../lib/formatters'
import { useI18n } from '../i18n/I18nContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const CPA_EUR = 650
const DEFAULT_COST_FROM = 2287
const DEFAULT_COMMENTS_CANDIDATE_URLS = ['/comments.csv', '/Comments Report.csv']
const AFFILIATE_INDEX_URL = '/api/cellxpert/affiliate-index.json'

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

    // Optimized: Use for loop instead of forEach for better performance on large datasets
    const len = rows.length
    for (let i = 0; i < len; i++) {
      const row = rows[i]
      if (!isValidTransfer(row)) continue
      const dt = parseDate(row.created_on)
      const matchesYear = year === 'all' || (dt && dt.getFullYear() === year)
      const matchesMonth = month === 'all' || (dt && dt.getMonth() + 1 === month)
      if (!matchesYear || !matchesMonth) continue

      transfers += 1
      const from = toInt(row.from_affiliate_id)
      const to = toInt(row.to_affiliate_id)
      const user = row.bullwaves_user || row.bullwaves_id
      if (user) users.add(String(user))

      inbound.set(to, (inbound.get(to) || 0) + 1)
      outbound.set(from, (outbound.get(from) || 0) + 1)
      const key = `${from} → ${to}`
      flows.set(key, (flows.get(key) || 0) + 1)
    }

    const affiliates = new Set([...inbound.keys(), ...outbound.keys()])
    // Optimized: Pre-allocate array and use direct assignment
    const list = []
    for (const id of affiliates) {
      const inCnt = inbound.get(id) || 0
      const outCnt = outbound.get(id) || 0
      list.push({ id, inbound: inCnt, outbound: outCnt, net: inCnt - outCnt })
    }

    const byInbound = sortDesc(list, 'inbound')
    const byOutbound = sortDesc(list, 'outbound')
    const byNet = sortDesc(list, 'net')
    // Optimized: Single pass sort instead of creating intermediate array
    const flowsSorted = Array.from(flows.entries()).sort((a, b) => b[1] - a[1])

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

  // Optimized: Memoize top results generation to avoid recalculation on every render
  const inboundTop = useMemo(
    () => stats.byInbound.slice(0, 10).map((r) => ({ ...r, label: getAffLabel(r.id) })),
    [stats, affiliateMap]
  )
  const outboundTop = useMemo(
    () => stats.byOutbound.slice(0, 10).map((r) => ({ ...r, label: getAffLabel(r.id) })),
    [stats, affiliateMap]
  )
  const netTop = useMemo(
    () => stats.byNet.slice(0, 10).map((r) => ({ ...r, label: getAffLabel(r.id) })),
    [stats, affiliateMap]
  )
  const flowTop = useMemo(() => {
    const result = []
    const flowsLen = Math.min(15, stats.flows.length)
    for (let i = 0; i < flowsLen; i++) {
      const [flow, count] = stats.flows[i]
      const [fromRaw, toRaw] = flow.split(' → ')
      const from = getAffLabel(fromRaw)
      const to = getAffLabel(toRaw)
      result.push({ flow: `${from} → ${to}`, count })
    }
    return result
  }, [stats, affiliateMap])
  const flowCostTop = useMemo(
    () => flowTop.map((f) => ({ flow: f.flow, cost: f.count * CPA_EUR })),
    [flowTop]
  )

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

export default function CommentsAnalysisPage({ mode = 'full' }) {
  const { t } = useI18n()
  const tRef = useRef(t)
  const [rows, setRows] = useState([])
  const [affiliateMap, setAffiliateMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const transfersOnly = mode === 'transfersOnly'
  const [tab, setTab] = useState('comments')

  useEffect(() => {
    if (!transfersOnly) return
    setTab('comments')
  }, [transfersOnly])

  useEffect(() => {
    tRef.current = t
  }, [t])

  useEffect(() => {
    let mounted = true
    const map = new Map()

    const getReportsVersion = () => {
      try {
        return String(localStorage.getItem('bw_reports_version') || '')
      } catch {
        return ''
      }
    }

    const buildCommentsCandidateUrls = () => {
      const urls = []
      const add = (u) => {
        const s = String(u || '').trim()
        if (!s) return
        if (!urls.includes(s)) urls.push(s)
      }

      // Optional production override (e.g. a signed/static URL on external storage)
      // Falls back to public assets if not provided.
      try {
        add(import.meta?.env?.VITE_COMMENTS_CSV_URL)
      } catch {
        // ignore
      }

      const v = getReportsVersion()
      for (const u of DEFAULT_COMMENTS_CANDIDATE_URLS) {
        if (!u) continue
        if (v) add(`${u}?v=${encodeURIComponent(v)}`)
        add(u)
      }

      return urls
    }

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

    function looksLikeHtmlText(s) {
      const head = String(s || '')
        .trim()
        .slice(0, 200)
        .toLowerCase()
      return head.startsWith('<!doctype') || head.startsWith('<html') || head.includes('<head')
    }

    async function fetchFirstOkNonHtmlText(urls) {
      const candidates = Array.isArray(urls) ? urls : []
      let lastError = null
      let sawOnlyMissingLikeFailures = true

      for (const rawUrl of candidates) {
        if (!rawUrl) continue
        try {
          const url = encodeURI(String(rawUrl))
          const res = await fetch(url)
          if (!res || !res.ok) {
            const status = res?.status || 0
            lastError = new Error(`HTTP ${status || 'ERR'} for ${url}`)
            // In production, missing public assets may get rewritten to index.html (HTML) or return 404.
            // Treat these as a "no data" scenario.
            if (![0, 404].includes(status)) sawOnlyMissingLikeFailures = false
            continue
          }
          const text = await res.text()
          if (looksLikeHtmlText(text)) {
            lastError = new Error(`Received HTML for ${url}`)
            // This happens when SPA fallback rewrite serves index.html.
            continue
          }
          sawOnlyMissingLikeFailures = false
          return { text, sourceUrl: String(rawUrl) }
        } catch (e) {
          lastError = e
          sawOnlyMissingLikeFailures = false
        }
      }

      if (sawOnlyMissingLikeFailures) {
        const err = new Error('Comments report not found')
        err.kind = 'missing'
        err.candidates = candidates
        err.cause = lastError
        throw err
      }

      throw lastError || new Error('No CSV candidates available')
    }

    async function tryLoadAffiliateIndex() {
      try {
        const version = (() => {
          try {
            return String(localStorage.getItem('bw_reports_version') || '')
          } catch {
            return ''
          }
        })()

        const withVersion = version
          ? `${AFFILIATE_INDEX_URL}?v=${encodeURIComponent(version)}`
          : AFFILIATE_INDEX_URL

        const res = await fetch(withVersion)
        if (!res || !res.ok) return null
        const json = await res.json()
        const byId = json && typeof json === 'object' ? json.byId : null
        if (!byId || typeof byId !== 'object') return null
        return byId
      } catch {
        return null
      }
    }

    // Parse CSV in chunks, ingesting rows and optionally accumulating them.
    // NOTE: When using Papa `chunk`, `complete({ data })` is not reliable for full data.
    const parseCsvChunked = (
      source,
      { accumulate = false, download = true, onRows, onDone, onFail }
    ) => {
      const all = accumulate ? [] : null
      let receivedAny = false

      const normalizedSource = (() => {
        if (!download) return source
        if (typeof source !== 'string') return source

        // PapaParse with { download: true, worker: true } runs XHR inside a blob worker.
        // Relative URLs can be invalid there; always provide an absolute URL.
        try {
          if (typeof window !== 'undefined' && window.location?.origin) {
            return new URL(source, window.location.origin).toString()
          }
        } catch {
          // ignore
        }

        return source
      })()

      Papa.parse(normalizedSource, {
        download,
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        worker: true,
        encoding: 'UTF-8',
        chunk: (results) => {
          if (!mounted) return
          const data = results?.data
          if (Array.isArray(data) && data.length) {
            receivedAny = true
            if (accumulate) all.push(...data)
            if (typeof onRows === 'function') onRows(data)
          }
        },
        complete: (results) => {
          if (!mounted) return
          const hasErrors = Array.isArray(results?.errors) && results.errors.length > 0
          if (!receivedAny) {
            onFail?.(hasErrors ? new Error(results.errors[0]?.message || 'CSV parse error') : null)
            return
          }
          onDone?.(accumulate ? all : null)
        },
        error: (err) => {
          if (!mounted) return
          onFail?.(err)
        },
      })
    }

    // 1) Load comments report first (accumulate rows for analysis + ingest affiliates)
    ;(async () => {
      try {
        const { text } = await fetchFirstOkNonHtmlText(buildCommentsCandidateUrls())

        parseCsvChunked(text, {
          download: false,
          accumulate: true,
          onRows: (chunkRows) => {
            // Build affiliate map opportunistically from comments
            chunkRows.forEach(ingestRow)
          },
          onDone: (allRows) => {
            if (!mounted) return
            if (!Array.isArray(allRows) || allRows.length === 0) {
              setError(tRef.current('analysis.error.parsing'))
              setLoading(false)
              return
            }

            setRows(allRows)

            // Prefer a precomputed id->name index (fast, low CPU) if available.
            // Fallback to whatever we found in the comments report.
            ;(async () => {
              const byId = await tryLoadAffiliateIndex()
              if (!mounted) return

              if (byId) {
                for (const [id, name] of Object.entries(byId)) {
                  const key = String(id).trim()
                  const val = String(name ?? '').trim()
                  if (!key || !val) continue
                  // Overwrite placeholders where we previously stored the id as the label.
                  const existing = map.get(key)
                  const existingTrim = existing != null ? String(existing).trim() : ''
                  const isPlaceholder = !existingTrim || existingTrim === key
                  if (!map.has(key) || isPlaceholder) map.set(key, val)
                }
              }

              setAffiliateMap(new Map(map))
              setLoading(false)
            })()
          },
          onFail: (err) => {
            if (!mounted) return
            setError(tRef.current('analysis.error.parsing'))
            setLoading(false)
          },
        })
      } catch (e) {
        if (!mounted) return
        // If the report isn't deployed (common in production when CSVs are kept out of git),
        // render the page with "no data" instead of a hard error.
        if (e && e.kind === 'missing') {
          if (import.meta?.env?.DEV) {
            console.warn('Comments report missing. Candidates:', e.candidates, e.cause || e)
          }
          setRows([])
          setAffiliateMap(new Map())
          setLoading(false)
          return
        }
        setError(tRef.current('analysis.error.loading'))
        setLoading(false)
      }
    })()

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

  if (loading) return <FullPageLoader progress={35} subtitle={t('analysis.loading')} />
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
          {!transfersOnly && (
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
          )}
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
      {!transfersOnly && tab === 'bots' && <BotUsersSection />}
    </div>
  )
}
