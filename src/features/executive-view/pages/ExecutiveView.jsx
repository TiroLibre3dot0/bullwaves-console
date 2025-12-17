import React, { useEffect, useMemo, useState } from 'react'
import PnLTrendChart from '../../../components/PnLTrendChart'
import { formatEuro, formatNumberShort, formatPercent } from '../../../lib/formatters'
import { useMediaPaymentsData } from '../../media-payments/hooks/useMediaPaymentsData'
import { useRoadmapData } from '../../roadmap/hooks/useRoadmapData'
import { buildMonthRange, buildMonthlySeries } from '../lib/monthlySeries'
import { bandForDepartment, cloneAssumptions, defaultAssumptions } from '../lib/assumptions'
import { buildDefaultProjectPlan, updateProjectPlan } from '../lib/roadmapCosting'
import { sections } from '../../../pages/orgChartData'

export default function ExecutiveView() {
    const { mediaRows, payments, loading } = useMediaPaymentsData()
    const { projects } = useRoadmapData()
    const [scenario, setScenario] = useState('upside')
    const [assumptions, setAssumptions] = useState(() => cloneAssumptions(defaultAssumptions))
    const [projectPlan, setProjectPlan] = useState([])
    const [viewMode, setViewMode] = useState('quarter')
    const [showDetails, setShowDetails] = useState(false)
    const [showAssumptions, setShowAssumptions] = useState(false)
    const [personnelOverrides, setPersonnelOverrides] = useState({})
    const [showLowerCharts, setShowLowerCharts] = useState(false)
    const [peopleViewMode, setPeopleViewMode] = useState('quarter')
    const [peopleSearch, setPeopleSearch] = useState('')
    const [expandedDepts, setExpandedDepts] = useState({})
    const [activeTab, setActiveTab] = useState('financials')
    const [metricToggles, setMetricToggles] = useState({
      revenue: true,
      ebitda: true,
      opex: true,
      payouts: false,
      roi: false,
    })
    const [openInfo, setOpenInfo] = useState(null)

    const linePriority = ['revenue', 'opex', 'payouts', 'roi']

    useEffect(() => {
      setProjectPlan(buildDefaultProjectPlan(projects, defaultAssumptions.projectDefaults))
    }, [projects])

    useEffect(() => {
      const handleClickAway = () => setOpenInfo(null)
      window.addEventListener('click', handleClickAway)
      return () => window.removeEventListener('click', handleClickAway)
    }, [])

    const model = useMemo(() => buildMonthlySeries({ mediaRows, payments, assumptions, scenarioKey: scenario, projectPlan }), [mediaRows, payments, assumptions, scenario, projectPlan])

    const forecastMonthOptions = useMemo(() => buildMonthRange().filter((m) => m.year === 2026), [])

    const personnelRows = useMemo(() => {
      return (sections || []).flatMap((section, sectionIdx) => (section.roles || []).map((role, idx) => {
        const id = role.id || `${section.title || 'section'}-${sectionIdx}-${idx}`
        const department = role.department || section.title || 'Other'
        return {
          id,
          role: role.role || role.title || 'Role',
          department,
          baseSalary: bandForDepartment(department),
        }
      }))
    }, [])

    const personnelSummary = useMemo(() => {
      const breakdownMap = new Map()
      let total = 0
      personnelRows.forEach((row) => {
        const salary = Number(personnelOverrides[row.id] ?? row.baseSalary ?? 0)
        total += salary
        const dept = row.department || 'Other'
        const acc = breakdownMap.get(dept) || { department: dept, headcount: 0, monthlyCost: 0 }
        acc.headcount += 1
        acc.monthlyCost += salary
        breakdownMap.set(dept, acc)
      })
      return { total, breakdown: Array.from(breakdownMap.values()).sort((a, b) => b.monthlyCost - a.monthlyCost) }
    }, [personnelOverrides, personnelRows])

    useEffect(() => {
      if (!personnelRows.length) return
      setAssumptions((prev) => {
        const prevTotal = prev?.opex?.personnel?.total || 0
        if (prevTotal === personnelSummary.total) return prev
        const next = cloneAssumptions(prev)
        next.opex = next.opex || {}
        next.opex.personnel = {
          total: personnelSummary.total,
          breakdown: personnelSummary.breakdown,
        }
        return next
      })
    }, [personnelRows, personnelSummary])

    const labels = model.labels
    const actualCount = model.actualCount
    const actualMonths = model.months.slice(0, actualCount)
    const forecastMonths = model.months.slice(actualCount, actualCount + 12)
    const combinedMonths = [...actualMonths, ...forecastMonths]

    const sum = (arr, key) => arr.reduce((acc, m) => acc + (m[key] || 0), 0)
    const calcRoi = (monthsArr) => {
      const totalP = monthsArr.reduce((acc, m) => acc + (m.pnl || 0), 0)
      const totalCost = monthsArr.reduce((acc, m) => acc + ((m.payouts || 0) + (m.opex || 0)), 0)
      return totalCost ? (totalP / totalCost) * 100 : 0
    }
    const yoyDelta = (future, base) => {
      if (!Number.isFinite(base) || base === 0) return null
      return ((future - base) / Math.abs(base)) * 100
    }

    const totals2025 = {
      regs: sum(actualMonths, 'registrations'),
      ftd: sum(actualMonths, 'ftd'),
      qftd: sum(actualMonths, 'qftd'),
      revenue: sum(actualMonths, 'revenue'),
      ebitda: sum(actualMonths, 'ebitda'),
      payouts: sum(actualMonths, 'payouts'),
      opex: sum(actualMonths, 'opex'),
      roi: calcRoi(actualMonths),
    }
    const totals2026 = {
      regs: sum(forecastMonths, 'registrations'),
      ftd: sum(forecastMonths, 'ftd'),
      qftd: sum(forecastMonths, 'qftd'),
      revenue: sum(forecastMonths, 'revenue'),
      ebitda: sum(forecastMonths, 'ebitda'),
      payouts: sum(forecastMonths, 'payouts'),
      opex: sum(forecastMonths, 'opex'),
      roi: calcRoi(forecastMonths),
    }

    const aggregateQuarters = useMemo(() => {
      const map = new Map()
      combinedMonths.forEach((m) => {
        const quarter = Math.floor(m.monthIndex / 3) + 1
        const key = `Q${quarter} ${m.year}`
        if (!map.has(key)) {
          map.set(key, {
            label: key,
            registrations: 0,
            ftd: 0,
            qftd: 0,
            revenue: 0,
            payouts: 0,
            opex: 0,
            opexDubai: 0,
            opexRoadmap: 0,
            ebitda: 0,
            pnl: 0,
          })
        }
        const acc = map.get(key)
        acc.registrations += m.registrations || 0
        acc.ftd += m.ftd || 0
        acc.qftd += m.qftd || 0
        acc.revenue += m.revenue || 0
        acc.payouts += m.payouts || 0
        acc.opex += m.opex || 0
        acc.opexDubai += m.opexDubai || 0
        acc.opexRoadmap += m.opexRoadmap || 0
        acc.ebitda += m.ebitda || 0
        acc.pnl += m.pnl || 0
      })
      return Array.from(map.values())
    }, [combinedMonths])

    const periodSeries = useMemo(() => {
      if (viewMode === 'quarter') {
        const labelsQ = aggregateQuarters.map((q) => q.label)
        const actualQuarterCount = 4
        return {
          labels: labelsQ,
          revenue: aggregateQuarters.map((q) => q.revenue),
          opex: aggregateQuarters.map((q) => q.opex),
          ebitda: aggregateQuarters.map((q) => q.ebitda),
          payouts: aggregateQuarters.map((q) => q.payouts),
          ftd: aggregateQuarters.map((q) => q.ftd),
          qftd: aggregateQuarters.map((q) => q.qftd),
          actualCount: actualQuarterCount,
          tableRows: aggregateQuarters,
        }
      }
      return {
        labels: combinedMonths.map((m) => m.label),
        revenue: combinedMonths.map((m) => m.revenue || 0),
        opex: combinedMonths.map((m) => m.opex || 0),
        ebitda: combinedMonths.map((m) => m.ebitda || 0),
        payouts: combinedMonths.map((m) => m.payouts || 0),
        ftd: combinedMonths.map((m) => m.ftd || 0),
        qftd: combinedMonths.map((m) => m.qftd || 0),
        actualCount: actualCount,
        tableRows: combinedMonths,
      }
    }, [viewMode, aggregateQuarters, combinedMonths, actualCount])

    useEffect(() => {
      const len = periodSeries.labels.length
      const expected = viewMode === 'quarter' ? 8 : 24
      if (len !== expected) {
        // Temporary guard to detect runaway data series
        // eslint-disable-next-line no-console
        console.warn(`[ExecutiveView] Unexpected series length ${len}, expected ${expected}`)
      }
    }, [periodSeries.labels.length, viewMode])

    const roiSeries = useMemo(() => periodSeries.labels.map((_, idx) => {
      const cost = (periodSeries.opex[idx] || 0) + (periodSeries.payouts[idx] || 0)
      const pnl = periodSeries.ebitda[idx] || 0
      const val = cost ? (pnl / cost) * 100 : 0
      return Number.isFinite(val) ? val : 0
    }), [periodSeries])

    const clampSeries = (arr, cap = 1_000_000_000) => (arr || []).map((v) => {
      const n = Number(v)
      if (!Number.isFinite(n)) return 0
      if (Math.abs(n) > cap) return Math.sign(n) * cap
      return n
    })

    const maxLen = viewMode === 'quarter' ? 8 : 24
    const sanitizedSeries = useMemo(() => ({
      revenue: clampSeries(periodSeries.revenue).slice(0, maxLen),
      opex: clampSeries(periodSeries.opex).slice(0, maxLen),
      payouts: clampSeries(periodSeries.payouts).slice(0, maxLen),
      ebitda: clampSeries(periodSeries.ebitda).slice(0, maxLen),
      ftd: clampSeries(periodSeries.ftd || []).slice(0, maxLen),
      qftd: clampSeries(periodSeries.qftd).slice(0, maxLen),
      roi: clampSeries(roiSeries, 10_000).slice(0, maxLen),
      margin: clampSeries(periodSeries.revenue.map((rev, idx) => (rev ? (periodSeries.ebitda[idx] / rev) * 100 : 0)), 1000).slice(0, maxLen),
    }), [periodSeries, roiSeries, maxLen])

    const computeBounds = (arr, cap = Infinity) => {
      const values = (arr || []).filter((v) => Number.isFinite(v))
      if (!values.length) return { min: -1, max: 1 }
      const maxAbs = Math.max(...values.map((v) => Math.abs(v))) || 1
      const padded = maxAbs * 1.2
      const bound = Math.min(padded, cap)
      return { min: -bound, max: bound }
    }

    const mainBounds = useMemo(() => {
      const pools = []
      if (metricToggles.revenue) pools.push(...sanitizedSeries.revenue)
      if (metricToggles.opex) pools.push(...sanitizedSeries.opex)
      if (metricToggles.payouts) pools.push(...sanitizedSeries.payouts)
      if (metricToggles.roi) pools.push(...sanitizedSeries.roi)
      if (metricToggles.ebitda) pools.push(...sanitizedSeries.ebitda)
      return computeBounds(pools)
    }, [metricToggles, sanitizedSeries])

    const roiBounds = useMemo(() => computeBounds(sanitizedSeries.roi), [sanitizedSeries])
    const qftdBounds = useMemo(() => computeBounds(sanitizedSeries.qftd), [sanitizedSeries])
    const payoutsBounds = useMemo(() => computeBounds(sanitizedSeries.payouts), [sanitizedSeries])
    const marginBounds = useMemo(() => computeBounds(sanitizedSeries.margin), [sanitizedSeries])
    const ftdBounds = useMemo(() => computeBounds(sanitizedSeries.ftd), [sanitizedSeries])

    const hasVisibleData = useMemo(() => {
      const values = [
        ...sanitizedSeries.revenue,
        ...sanitizedSeries.opex,
        ...sanitizedSeries.payouts,
        ...sanitizedSeries.ebitda,
      ]
      return values.some((v) => Math.abs(v) > 0)
    }, [sanitizedSeries])

    const handleScenarioInput = (field, value) => {
      setAssumptions((prev) => {
        const next = cloneAssumptions(prev)
        next.scenarios = next.scenarios || {}
        next.scenarios[scenario] = next.scenarios[scenario] || {}
        next.scenarios[scenario][field] = value
        return next
      })
    }

    const handleMetricToggle = (key) => {
      setMetricToggles((prev) => {
        const next = { ...prev }

        if (key === 'ebitda') {
          next.ebitda = !prev.ebitda
          return next
        }

        const isEnabling = !prev[key]
        next[key] = isEnabling

        if (!isEnabling) return next

        const activeLines = linePriority.filter((k) => next[k])
        if (activeLines.length <= 2) return next

        const keep = new Set([key])
        const fallback = linePriority.find((k) => next[k] && k !== key)
        if (fallback) keep.add(fallback)

        linePriority.forEach((k) => {
          next[k] = keep.has(k)
        })

        return next
      })
    }

    const handleOpexInput = (section, key, value) => {
      setAssumptions((prev) => {
        const next = cloneAssumptions(prev)
        next.opex = next.opex || {}
        next.opex[section] = { ...(next.opex[section] || {}), [key]: value }
        return next
      })
    }

    const handleSalaryChange = (id, value) => {
      setPersonnelOverrides((prev) => ({ ...prev, [id]: value }))
    }

    const handleProjectChange = (projectId, patch) => {
      setProjectPlan((prev) => updateProjectPlan(prev, projectId, patch))
    }

    const roadmapPreview = projectPlan.slice(0, 6)

    const formatTooltipValue = (label, rawValue) => {
      const val = Number(rawValue ?? 0)
      const key = (label || '').toLowerCase()
      if (key.includes('roi') || key.includes('margin')) return `${val.toFixed(1)}%`
      return formatEuro(val)
    }

    const assumptionNotes = {
      regGrowth: 'Reg growth / month (%): aumenta/diminuisce il tasso di crescita mensile delle registrazioni 2026 → più registrazioni → più FTD/QFTD → più revenue e quindi più EBITDA (al netto di payouts/OPEX).',
      regToFtd: 'Reg → FTD lift (x): moltiplica il rapporto FTD/Registrazioni nelle proiezioni 2026 → ogni punto aumenta i FTD generati per lo stesso numero di registrazioni → più revenue e più payouts; EBITDA cresce solo se la marginalità resta positiva.',
      ftdToQftd: 'FTD → QFTD lift (x): aumenta la conversione da FTD a QFTD nelle proiezioni → più QFTD → maggiore P&L (Closed P&L) e maggiore payout/CPA dove applicato.',
      netPerFtd: 'Net / FTD uplift (x): moltiplica il net per FTD medio → impatta direttamente la revenue P&L per ogni FTD/QFTD → EBITDA sale o scende in proporzione, payout invariato salvo effetti indiretti.',
      cpaPerQftd: 'CPA / QFTD uplift (x): moltiplica il costo per QFTD (commissioni/CPA) → aumenta i payouts/commissioni per ogni QFTD → EBITDA si riduce se il costo cresce più del ricavo incrementale.',
      seasonality: 'Seasonality strength: varia l’ampiezza della stagionalità applicata al profilo mensile 2026 (basato sulla forma 2025) → ridistribuisce volumi e ricavi sui mesi/quarter; il totale annuo resta guidato dagli altri uplift, ma i picchi/valle cambiano e con essi EBITDA per periodo.',
      dubaiMonthly: 'Dubai OPEX / month (€) + start month: aggiunge un costo opex ricorrente a partire dal mese scelto nel 2026 → aumenta l’OPEX mensile/quarter e riduce l’EBITDA a partire da quel punto.',
      dubaiStart: 'Dubai OPEX / month (€) + start month: aggiunge un costo opex ricorrente a partire dal mese scelto nel 2026 → aumenta l’OPEX mensile/quarter e riduce l’EBITDA a partire da quel punto.',
      techPlatform: 'OPEX tech/platform, tooling, compliance (€): costi fissi mensili ricorrenti 2026 → aumentano OPEX lineare e riducono EBITDA in modo proporzionale.',
      monitoring: 'OPEX tech/platform, tooling, compliance (€): costi fissi mensili ricorrenti 2026 → aumentano OPEX lineare e riducono EBITDA in modo proporzionale.',
      compliance: 'OPEX tech/platform, tooling, compliance (€): costi fissi mensili ricorrenti 2026 → aumentano OPEX lineare e riducono EBITDA in modo proporzionale.',
    }

    const InfoIcon = ({ id, text }) => (
      <span
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setOpenInfo(id)}
        onMouseLeave={() => setOpenInfo((prev) => (prev === id ? null : prev))}
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation()
            setOpenInfo((prev) => (prev === id ? null : id))
          }}
          aria-label="Show explanation"
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.28)',
            background: '#0ea5e9',
            color: '#0b172a',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: 11,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
          }}
        >
          i
        </button>
        {openInfo === id && (
          <span
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '115%',
              left: 0,
              zIndex: 9999,
              background: 'rgba(8,14,26,0.98)',
              color: '#e2e8f0',
              border: '1px solid rgba(14,165,233,0.6)',
              borderRadius: 10,
              padding: '12px 14px',
              minWidth: 240,
              maxWidth: 360,
              boxShadow: '0 16px 34px rgba(0,0,0,0.6)',
              fontSize: 12,
              lineHeight: 1.5,
              pointerEvents: 'auto',
            }}
          >
            {text}
          </span>
        )}
      </span>
    )

    return (
      <div className="w-full space-y-4">
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1.2fr auto', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.18 }}>Budget & Projections 2026</div>
            <h2 style={{ margin: 0 }}>2025 actuals → 2026 projected scenarios</h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 13 }}>Board-ready view with Financials, People & OPEX, and Insights tabs.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {[{ key: 'financials', label: 'Financials' }, { key: 'people', label: 'People & OPEX' }, { key: 'insights', label: 'Insights' }].map((tab) => (
                <button
                  key={tab.key}
                  className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ padding: '8px 12px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 12, color: '#cbd5e1', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}>Model v2.0</span>
            {['base', 'conservative', 'upside'].map((key) => (
              <button
                key={key}
                className={`tab ${scenario === key ? 'active' : ''}`}
                onClick={() => setScenario(key)}
                style={{ padding: '8px 12px' }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'financials' && (
          <>
            <div className="card" style={{ background: 'linear-gradient(120deg, rgba(15,118,110,0.2), rgba(14,165,233,0.12))', border: '1px solid rgba(34,211,238,0.25)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {[{
                  label: '2026 Revenue (P&L)',
                  value: formatEuro(totals2026.revenue),
                  base: formatEuro(totals2025.revenue),
                  delta: yoyDelta(totals2026.revenue, totals2025.revenue),
                }, {
                  label: '2026 EBITDA',
                  value: formatEuro(totals2026.ebitda),
                  base: formatEuro(totals2025.ebitda),
                  delta: yoyDelta(totals2026.ebitda, totals2025.ebitda),
                }, {
                  label: 'Avg ROI 2026',
                  value: `${totals2026.roi.toFixed(1)}%`,
                  base: `${totals2025.roi.toFixed(1)}%`,
                  delta: yoyDelta(totals2026.roi, totals2025.roi),
                }, {
                  label: '2026 OPEX (all-in)',
                  value: formatEuro(totals2026.opex),
                  base: formatEuro(totals2025.opex),
                  delta: yoyDelta(totals2026.opex, totals2025.opex),
                }].map((kpi) => (
                  <div key={kpi.label} className="kpi" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span>{kpi.label}</span>
                    <strong style={{ fontSize: 22 }}>{kpi.value}</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                      <span>2025: {kpi.base}</span>
                      <span style={{ color: kpi.delta === null ? '#cbd5e1' : kpi.delta >= 0 ? '#34d399' : '#f97316' }}>{kpi.delta === null ? '—' : formatPercent(kpi.delta, 1)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1' }}>YoY deltas show 2026 vs locked 2025; ROI = P&L / (payouts + OPEX).</div>
            </div>

            <div className="grid-global" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'stretch' }}>
              <div className="card" style={{ background: '#0b1524', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>Financial trajectory</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>2025 solid · 2026 dashed</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[{ key: 'revenue', label: 'Closed P&L' }, { key: 'ebitda', label: 'EBITDA' }, { key: 'opex', label: 'OPEX' }, { key: 'payouts', label: 'Commissions' }, { key: 'roi', label: 'ROI' }].map((metric) => (
                        <label key={metric.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#cbd5e1', background: 'rgba(255,255,255,0.02)', padding: '3px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                          <input
                            type="checkbox"
                            checked={metricToggles[metric.key]}
                            onChange={() => handleMetricToggle(metric.key)}
                            style={{ accentColor: '#22d3ee' }}
                          />
                          {metric.label}
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6, padding: '2px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {['quarter', 'month'].map((mode) => (
                        <button key={mode} className={`tab ${viewMode === mode ? 'active' : ''}`} onClick={() => setViewMode(mode)} style={{ padding: '6px 10px' }}>{mode === 'quarter' ? 'Quarter' : 'Month'}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-72" style={{ marginTop: 4 }}>
                  {hasVisibleData ? (
                    <PnLTrendChart
                      labels={periodSeries.labels}
                      series={(() => {
                        const actualCut = periodSeries.actualCount || 0
                        const isQuarter = viewMode === 'quarter'

                        const splitBarData = (arr) => {
                          const actual = arr.map((v, idx) => (idx < actualCut ? v : null))
                          const forecast = arr.map((v, idx) => (idx >= actualCut ? v : null))
                          return { actual, forecast }
                        }

                        const makeLine = (data, color, label) => ({
                          label,
                          data,
                          type: 'line',
                          color,
                          borderWidth: 2,
                          pointRadius: 1,
                          tension: isQuarter ? 0.14 : 0.18,
                          backgroundColor: 'transparent',
                          segment: {
                            borderDash: (ctx) => {
                              const idx = Number(ctx?.p0DataIndex ?? -1)
                              if (!actualCut) return undefined
                              return idx >= actualCut - 1 ? [6, 4] : undefined
                            },
                            borderColor: (ctx) => {
                              const idx = Number(ctx?.p0DataIndex ?? -1)
                              return idx >= actualCut - 1 ? `${color}80` : color
                            },
                          },
                          order: 3,
                        })

                        const { actual: ebitdaActual, forecast: ebitdaForecast } = splitBarData(sanitizedSeries.ebitda)
                        const { actual: opexActual, forecast: opexForecast } = splitBarData(sanitizedSeries.opex)

                        const datasets = []

                        if (metricToggles.ebitda) {
                          datasets.push(
                            {
                              label: 'EBITDA',
                              type: 'bar',
                              data: ebitdaActual,
                              backgroundColor: 'rgba(34,197,94,0.72)',
                              borderColor: 'rgba(34,197,94,0.72)',
                              stack: 'bars',
                              barPercentage: 0.16,
                              categoryPercentage: 0.5,
                              borderRadius: 10,
                              order: 1,
                            },
                            {
                              label: 'EBITDA forecast',
                              type: 'bar',
                              data: ebitdaForecast,
                              backgroundColor: 'rgba(34,197,94,0.5)',
                              borderColor: 'rgba(34,197,94,0.5)',
                              stack: 'bars',
                              barPercentage: 0.16,
                              categoryPercentage: 0.5,
                              borderRadius: 10,
                              order: 1,
                            },
                          )
                        }

                        if (metricToggles.opex) {
                          datasets.push(
                            {
                              label: 'OPEX',
                              type: 'bar',
                              data: opexActual,
                              backgroundColor: 'rgba(249,115,22,0.7)',
                              borderColor: 'rgba(249,115,22,0.7)',
                              stack: 'bars',
                              barPercentage: 0.16,
                              categoryPercentage: 0.5,
                              borderRadius: 10,
                              order: 1,
                            },
                            {
                              label: 'OPEX forecast',
                              type: 'bar',
                              data: opexForecast,
                              backgroundColor: 'rgba(249,115,22,0.5)',
                              borderColor: 'rgba(249,115,22,0.5)',
                              stack: 'bars',
                              barPercentage: 0.16,
                              categoryPercentage: 0.5,
                              borderRadius: 10,
                              order: 1,
                            },
                          )
                        }

                        if (metricToggles.revenue) datasets.push(makeLine(sanitizedSeries.revenue, '#22d3ee', 'Closed P&L'))
                        if (metricToggles.payouts) datasets.push(makeLine(sanitizedSeries.payouts, '#facc15', 'Commissions'))
                        if (metricToggles.roi) datasets.push(makeLine(sanitizedSeries.roi, '#a3e635', 'ROI'))

                        return datasets
                      })()}
                      yMin={mainBounds.min}
                      yMax={mainBounds.max}
                      showLegend={false}
                      tooltipData={periodSeries.labels.map((label, idx) => ({
                        label,
                        isForecast: idx >= periodSeries.actualCount,
                      }))}
                      tooltipFormatter={({ datasetLabel, value, extra }) => {
                        const labelText = datasetLabel || 'Value'
                        const valText = formatTooltipValue(labelText, value)
                        if (extra?.label) {
                          const state = extra.isForecast ? 'forecast' : 'actual'
                          return `${extra.label} · ${labelText}: ${valText} (${state})`
                        }
                        return `${labelText}: ${valText}`
                      }}
                    />
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: 13, padding: 12 }}>Nessun dato valido da mostrare (revenues/opex/payouts tutti zero o non definiti).</div>
                  )}
                </div>
              </div>

              <div className="card" style={{ background: '#0b1524', border: '1px solid rgba(255,255,255,0.08)', overflow: 'visible' }}>
                <h3 style={{ marginTop: 0 }}>Assumption controls</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Reg growth / month
                      <InfoIcon id="regGrowth" text={assumptionNotes.regGrowth} />
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" step="0.005" value={assumptions.scenarios[scenario].regGrowth} onChange={(e) => handleScenarioInput('regGrowth', Number(e.target.value))} className="input-num" />
                      <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 48, textAlign: 'right' }}>{(assumptions.scenarios[scenario].regGrowth * 100).toFixed(2)}%</span>
                    </div>
                  </label>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Reg → FTD lift
                      <InfoIcon id="regToFtd" text={assumptionNotes.regToFtd} />
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" step="0.01" value={assumptions.scenarios[scenario].regToFtdLift} onChange={(e) => handleScenarioInput('regToFtdLift', Number(e.target.value))} className="input-num" />
                      <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 48, textAlign: 'right' }}>{assumptions.scenarios[scenario].regToFtdLift.toFixed(2)}x</span>
                    </div>
                  </label>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      FTD → QFTD lift
                      <InfoIcon id="ftdToQftd" text={assumptionNotes.ftdToQftd} />
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" step="0.01" value={assumptions.scenarios[scenario].ftdToQftdLift} onChange={(e) => handleScenarioInput('ftdToQftdLift', Number(e.target.value))} className="input-num" />
                      <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 48, textAlign: 'right' }}>{assumptions.scenarios[scenario].ftdToQftdLift.toFixed(2)}x</span>
                    </div>
                  </label>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Net / FTD uplift
                      <InfoIcon id="netPerFtd" text={assumptionNotes.netPerFtd} />
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" step="0.01" value={assumptions.scenarios[scenario].netPerFtdLift} onChange={(e) => handleScenarioInput('netPerFtdLift', Number(e.target.value))} className="input-num" />
                      <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 48, textAlign: 'right' }}>{assumptions.scenarios[scenario].netPerFtdLift.toFixed(2)}x</span>
                    </div>
                  </label>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      CPA / QFTD uplift
                      <InfoIcon id="cpaPerQftd" text={assumptionNotes.cpaPerQftd} />
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" step="0.01" value={assumptions.scenarios[scenario].cpaPerQftdLift} onChange={(e) => handleScenarioInput('cpaPerQftdLift', Number(e.target.value))} className="input-num" />
                      <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 48, textAlign: 'right' }}>{assumptions.scenarios[scenario].cpaPerQftdLift.toFixed(2)}x</span>
                    </div>
                  </label>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Seasonality strength
                      <InfoIcon id="seasonality" text={assumptionNotes.seasonality} />
                    </span>
                    <input type="range" min="0" max="0.4" step="0.01" value={assumptions.seasonalityStrength ?? 0.15} onChange={(e) => setAssumptions((prev) => ({ ...prev, seasonalityStrength: Number(e.target.value) }))} />
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>{(assumptions.seasonalityStrength ?? 0.15).toFixed(2)} (light bias)</span>
                  </label>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Dubai OPEX / month
                      <InfoIcon id="dubaiMonthly" text={assumptionNotes.dubaiMonthly} />
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" step="1000" value={assumptions.opex?.dubai?.monthly || 0} onChange={(e) => handleOpexInput('dubai', 'monthly', Number(e.target.value))} className="input-num" />
                      <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 72, textAlign: 'right' }}>{formatEuro(assumptions.opex?.dubai?.monthly || 0)}</span>
                    </div>
                  </label>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Dubai start (2026)
                      <InfoIcon id="dubaiStart" text={assumptionNotes.dubaiStart} />
                    </span>
                    <select value={assumptions.opex?.dubai?.startMonth || '2026-00'} onChange={(e) => handleOpexInput('dubai', 'startMonth', e.target.value)} style={{ padding: 8, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {forecastMonthOptions.map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 10, paddingTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  <div className="kpi" style={{ background: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'visible' }}>
                    <span>Personnel (org-derived)</span>
                    <strong>{formatEuro(assumptions.opex?.personnel?.total || 0)}</strong>
                  </div>
                  <label className="kpi" style={{ display: 'block', position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Tech / platform
                      <InfoIcon id="techPlatform" text={assumptionNotes.techPlatform} />
                    </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" className="input-num" value={assumptions.opex.tech.hosting} onChange={(e) => handleOpexInput('tech', 'hosting', Number(e.target.value))} />
                        <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 72, textAlign: 'right' }}>{formatEuro(assumptions.opex.tech.hosting)}</span>
                      </div>
                  </label>
                  <label className="kpi" style={{ display: 'block', position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Monitoring / tooling
                      <InfoIcon id="monitoring" text={assumptionNotes.monitoring} />
                    </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" className="input-num" value={assumptions.opex.tech.tooling} onChange={(e) => handleOpexInput('tech', 'tooling', Number(e.target.value))} />
                        <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 72, textAlign: 'right' }}>{formatEuro(assumptions.opex.tech.tooling)}</span>
                      </div>
                  </label>
                  <label className="kpi" style={{ display: 'block', position: 'relative', overflow: 'visible' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Compliance / legal
                      <InfoIcon id="compliance" text={assumptionNotes.compliance} />
                    </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="number" className="input-num" value={assumptions.opex.legal.compliance} onChange={(e) => handleOpexInput('legal', 'compliance', Number(e.target.value))} />
                        <span style={{ fontSize: 12, color: '#cbd5e1', minWidth: 72, textAlign: 'right' }}>{formatEuro(assumptions.opex.legal.compliance)}</span>
                      </div>
                  </label>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>Controls steer 2026 only; 2025 remains locked.</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Secondary charts</h3>
              <button className="tab" onClick={() => setShowLowerCharts((v) => !v)}>{showLowerCharts ? 'Hide' : 'Show'}</button>
            </div>

            {showLowerCharts && (
              <div className="grid-global" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', alignItems: 'stretch' }}>
                <div className="card">
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>FTD · QFTD trend</div>
                  <div className="h-64" style={{ marginTop: 6 }}>
                    <PnLTrendChart
                      labels={periodSeries.labels}
                      series={[
                        {
                          label: 'FTD',
                          data: sanitizedSeries.ftd,
                          color: '#60a5fa',
                          segment: { borderDash: (ctx) => (periodSeries.actualCount > 0 && Number(ctx?.p0DataIndex ?? -1) >= periodSeries.actualCount - 1 ? [6, 4] : undefined) },
                        },
                        {
                          label: 'QFTD',
                          data: sanitizedSeries.qftd,
                          color: '#a855f7',
                          segment: { borderDash: (ctx) => (periodSeries.actualCount > 0 && Number(ctx?.p0DataIndex ?? -1) >= periodSeries.actualCount - 1 ? [6, 4] : undefined) },
                        },
                      ]}
                      yMin={ftdBounds.min}
                      yMax={ftdBounds.max}
                    />
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>ROI %</div>
                  <div className="h-64" style={{ marginTop: 6 }}>
                    <PnLTrendChart
                      labels={periodSeries.labels}
                      series={[
                        {
                          label: 'ROI',
                          data: sanitizedSeries.roi,
                          color: '#38bdf8',
                          segment: { borderDash: (ctx) => (periodSeries.actualCount > 0 && Number(ctx?.p0DataIndex ?? -1) >= periodSeries.actualCount - 1 ? [6, 4] : undefined) },
                        },
                        {
                          label: 'Zero',
                          data: sanitizedSeries.roi.map(() => 0),
                          color: 'rgba(255,255,255,0.2)',
                          borderDash: [4, 4],
                        },
                      ]}
                      yMin={roiBounds.min}
                      yMax={roiBounds.max}
                    />
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Margin %</div>
                  <div className="h-64" style={{ marginTop: 6 }}>
                    <PnLTrendChart
                      labels={periodSeries.labels}
                      series={[
                        {
                          label: 'Margin',
                          data: sanitizedSeries.margin,
                          color: '#22c55e',
                          segment: { borderDash: (ctx) => (periodSeries.actualCount > 0 && Number(ctx?.p0DataIndex ?? -1) >= periodSeries.actualCount - 1 ? [6, 4] : undefined) },
                        },
                        {
                          label: 'Zero',
                          data: sanitizedSeries.margin.map(() => 0),
                          color: 'rgba(255,255,255,0.2)',
                          borderDash: [4, 4],
                        },
                      ]}
                      yMin={marginBounds.min}
                      yMax={marginBounds.max}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Details (toggle)</h3>
                <button className="tab" onClick={() => setShowDetails((v) => !v)}>{showDetails ? 'Hide' : 'Show'} table</button>
              </div>
              {showDetails && (
                <div className="table-wrap" style={{ marginTop: 8 }}>
                  <table className="table" style={{ minWidth: 960 }}>
                    <thead>
                      <tr>
                        <th>Period</th><th>Regs</th><th>FTD</th><th>QFTD</th><th>FTD/Reg</th><th>QFTD/FTD</th><th>P&L (rev)</th><th>Payouts</th><th>OPEX</th><th>OPEX (Dubai)</th><th>OPEX (Roadmap)</th><th>EBITDA</th><th>ROI%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodSeries.tableRows.map((row, idx) => (
                        <tr key={row.label || row.key || idx}>
                          <td>{row.label || row.key}</td>
                          <td>{formatNumberShort(row.registrations || 0)}</td>
                          <td>{formatNumberShort(row.ftd || 0)}</td>
                          <td>{formatNumberShort(row.qftd || 0)}</td>
                          <td>{row.registrations ? ((row.ftd || 0) / Math.max(row.registrations, 1) * 100).toFixed(1) + '%' : '—'}</td>
                          <td>{row.ftd ? ((row.qftd || 0) / Math.max(row.ftd, 1) * 100).toFixed(1) + '%' : '—'}</td>
                          <td>{formatEuro(row.revenue || 0)}</td>
                          <td>{formatEuro(row.payouts || 0)}</td>
                          <td>{formatEuro(row.opex || 0)}</td>
                          <td>{formatEuro(row.opexDubai || 0)}</td>
                          <td>{formatEuro(row.opexRoadmap || 0)}</td>
                          <td>{formatEuro(row.ebitda || row.pnl || 0)}</td>
                          <td>{row.opex || row.payouts ? (((row.pnl ?? row.ebitda ?? 0) / Math.max((row.payouts || 0) + (row.opex || 0), 1)) * 100).toFixed(1) + '%' : '0%'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th>Totals 2025</th>
                        <td>{formatNumberShort(totals2025.regs)}</td>
                        <td>{formatNumberShort(totals2025.ftd)}</td>
                        <td>{formatNumberShort(totals2025.qftd)}</td>
                        <td colSpan={2}></td>
                        <td>{formatEuro(totals2025.revenue)}</td>
                        <td>{formatEuro(totals2025.payouts)}</td>
                        <td>{formatEuro(totals2025.opex)}</td>
                        <td colSpan={2}></td>
                        <td>{formatEuro(totals2025.ebitda)}</td>
                        <td>{totals2025.roi.toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <th>Totals 2026</th>
                        <td>{formatNumberShort(totals2026.regs)}</td>
                        <td>{formatNumberShort(totals2026.ftd)}</td>
                        <td>{formatNumberShort(totals2026.qftd)}</td>
                        <td colSpan={2}></td>
                        <td>{formatEuro(totals2026.revenue)}</td>
                        <td>{formatEuro(totals2026.payouts)}</td>
                        <td>{formatEuro(totals2026.opex)}</td>
                        <td colSpan={2}></td>
                        <td>{formatEuro(totals2026.ebitda)}</td>
                        <td>{totals2026.roi.toFixed(1)}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="card" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Assumptions (transparent)</h3>
                <button className="tab" onClick={() => setShowAssumptions((v) => !v)}>{showAssumptions ? 'Hide' : 'Show'}</button>
              </div>
              {showAssumptions && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 10 }}>
                  <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontWeight: 700 }}>Scenario ({scenario})</div>
                    <ul style={{ margin: '6px 0 0 12px', padding: 0, color: '#cbd5e1', fontSize: 13 }}>
                      <li>Reg growth: {(assumptions.scenarios[scenario].regGrowth * 100).toFixed(2)}% monthly</li>
                      <li>Reg→FTD lift: {assumptions.scenarios[scenario].regToFtdLift.toFixed(2)}x</li>
                      <li>FTD→QFTD lift: {assumptions.scenarios[scenario].ftdToQftdLift.toFixed(2)}x</li>
                      <li>Net/FTD uplift: {assumptions.scenarios[scenario].netPerFtdLift.toFixed(2)}x</li>
                      <li>CPA/QFTD uplift: {assumptions.scenarios[scenario].cpaPerQftdLift.toFixed(2)}x</li>
                    </ul>
                  </div>
                  <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontWeight: 700 }}>Seasonality</div>
                    <ul style={{ margin: '6px 0 0 12px', padding: 0, color: '#cbd5e1', fontSize: 13 }}>
                      <li>Strength: {(assumptions.seasonalityStrength ?? 0.15).toFixed(2)} (clamped index 0.7–1.3)</li>
                      <li>Source: 2025 revenue shape (normalized)</li>
                    </ul>
                  </div>
                  <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontWeight: 700 }}>CPA & payouts</div>
                    <ul style={{ margin: '6px 0 0 12px', padding: 0, color: '#cbd5e1', fontSize: 13 }}>
                      <li>CPA/QFTD baseline: data-derived 2025</li>
                      <li>Fallback when zero QFTD: baseline average</li>
                      <li>Scenario uplift applied monthly</li>
                    </ul>
                  </div>
                  <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontWeight: 700 }}>Dubai OPEX</div>
                    <ul style={{ margin: '6px 0 0 12px', padding: 0, color: '#cbd5e1', fontSize: 13 }}>
                      <li>Monthly: {formatEuro(assumptions.opex?.dubai?.monthly || 0)}</li>
                      <li>Start month: {assumptions.opex?.dubai?.startMonth || '2026-00'}</li>
                    </ul>
                  </div>
                  <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontWeight: 700 }}>Roadmap (cost into OPEX)</div>
                    <ul style={{ margin: '6px 0 0 12px', padding: 0, color: '#cbd5e1', fontSize: 13 }}>
                      {roadmapPreview.map((p) => (
                        <li key={p.id}>{p.enabled ? 'Enabled' : 'Disabled'} · {p.label} · {p.startMonth} · {p.duration}m · {formatEuro((p.costs.personnel || 0) + (p.costs.tooling || 0) + (p.costs.marketing || 0))}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'people' && (
          <div className="grid-global" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>People cost (org chart derived)</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1' }}>Dept-first view; toggle quarter/month; expand to see roles.</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className={`tab ${peopleViewMode === 'quarter' ? 'active' : ''}`} onClick={() => setPeopleViewMode('quarter')}>Quarter</button>
                  <button className={`tab ${peopleViewMode === 'month' ? 'active' : ''}`} onClick={() => setPeopleViewMode('month')}>Month</button>
                  <div className="kpi" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <span>Total {peopleViewMode === 'quarter' ? 'quarterly' : 'monthly'}</span>
                    <strong>{peopleViewMode === 'quarter' ? formatEuro(personnelSummary.total * 3) : formatEuro(personnelSummary.total)}</strong>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search name/role/department"
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  style={{ padding: 8, borderRadius: 8, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.08)', minWidth: 240 }}
                />
                <button className="tab" onClick={() => setExpandedDepts({})}>Collapse all</button>
              </div>

              <div className="table-wrap" style={{ marginTop: 10 }}>
                <table className="table" style={{ minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th>Department</th><th>HC</th><th>Total</th><th>Share</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const term = peopleSearch.toLowerCase().trim()
                      const filtered = personnelRows.filter((row) => {
                        const hay = `${row.role} ${row.department}`.toLowerCase()
                        return !term || hay.includes(term)
                      }).map((row) => ({ ...row, salary: Number(personnelOverrides[row.id] ?? row.baseSalary ?? 0) }))
                      const deptMap = new Map()
                      filtered.forEach((row) => {
                        const dept = row.department || 'Other'
                        if (!deptMap.has(dept)) deptMap.set(dept, { department: dept, headcount: 0, monthly: 0, members: [] })
                        const acc = deptMap.get(dept)
                        acc.headcount += 1
                        acc.monthly += row.salary
                        acc.members.push(row)
                      })
                      const totalMonthly = Array.from(deptMap.values()).reduce((acc, d) => acc + d.monthly, 0) || 1
                      const viewMultiplier = peopleViewMode === 'quarter' ? 3 : 1
                      const rows = Array.from(deptMap.values()).sort((a, b) => b.monthly - a.monthly)
                      return rows.map((dept) => {
                        const expanded = !!expandedDepts[dept.department]
                        return (
                          <React.Fragment key={dept.department}>
                            <tr>
                              <td style={{ cursor: 'pointer' }} onClick={() => setExpandedDepts((prev) => ({ ...prev, [dept.department]: !expanded }))}>
                                {expanded ? '▾' : '▸'} {dept.department}
                              </td>
                              <td>{dept.headcount}</td>
                              <td>{formatEuro(dept.monthly * viewMultiplier)}</td>
                              <td>{((dept.monthly / totalMonthly) * 100).toFixed(1)}%</td>
                              <td></td>
                            </tr>
                            {expanded && dept.members.map((m) => (
                              <tr key={m.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <td colSpan={2} style={{ paddingLeft: 24 }}>{m.role}</td>
                                <td>
                                  <input type="number" className="input-num" value={personnelOverrides[m.id] ?? m.baseSalary} onChange={(e) => handleSalaryChange(m.id, Number(e.target.value))} />
                                </td>
                                <td colSpan={2}>{formatEuro((personnelOverrides[m.id] ?? m.baseSalary) * viewMultiplier)}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Roadmap levers</h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Costs flow into OPEX (personnel/tooling/marketing)</span>
              </div>
              <div className="table-wrap" style={{ marginTop: 8 }}>
                <table className="table" style={{ minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th>Project</th><th>Dept</th><th>Start</th><th>Duration</th><th>Costs</th><th>Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectPlan.map((p) => (
                      <tr key={p.id}>
                        <td>{p.label}</td>
                        <td>{p.department}</td>
                        <td>
                          <select value={p.startMonth} onChange={(e) => handleProjectChange(p.id, { startMonth: e.target.value })} style={{ padding: 6, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {forecastMonthOptions.map((m) => (
                              <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input type="number" min="1" className="input-num" value={p.duration} onChange={(e) => handleProjectChange(p.id, { duration: Number(e.target.value) })} />
                        </td>
                        <td>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                            <input type="number" className="input-num" value={p.costs.personnel} onChange={(e) => handleProjectChange(p.id, { costs: { personnel: Number(e.target.value) } })} />
                            <input type="number" className="input-num" value={p.costs.tooling} onChange={(e) => handleProjectChange(p.id, { costs: { tooling: Number(e.target.value) } })} />
                            <input type="number" className="input-num" value={p.costs.marketing} onChange={(e) => handleProjectChange(p.id, { costs: { marketing: Number(e.target.value) } })} />
                          </div>
                        </td>
                        <td>
                          <button className={`tab ${p.enabled ? 'active' : ''}`} onClick={() => handleProjectChange(p.id, { enabled: !p.enabled })}>{p.enabled ? 'Enabled' : 'Off'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>Impact reflected month-by-month when window is active.</div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="card" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Insights</div>
                <div style={{ fontSize: 12, color: '#cbd5e1' }}>Board-ready highlights derived from the current scenario.</div>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>2025 vs 2026 diffs auto-updated per scenario</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 12 }}>
              <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontWeight: 700 }}>Growth signal</div>
                <ul style={{ margin: '6px 0 0 12px', padding: 0, color: '#cbd5e1', fontSize: 13 }}>
                  <li>Revenue YoY: {formatPercent(yoyDelta(totals2026.revenue, totals2025.revenue) || 0, 1)}</li>
                  <li>EBITDA YoY: {formatPercent(yoyDelta(totals2026.ebitda, totals2025.ebitda) || 0, 1)}</li>
                  <li>ROI avg: {totals2026.roi.toFixed(1)}% (2025: {totals2025.roi.toFixed(1)}%)</li>
                </ul>
              </div>
              <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontWeight: 700 }}>Cost posture</div>
                <ul style={{ margin: '6px 0 0 12px', padding: 0, color: '#cbd5e1', fontSize: 13 }}>
                  <li>OPEX 2026: {formatEuro(totals2026.opex)} (vs {formatEuro(totals2025.opex)})</li>
                  <li>Payouts mix: {formatEuro(totals2026.payouts)} vs revenue {formatEuro(totals2026.revenue)}</li>
                  <li>Roadmap/Dubai already baked into OPEX.</li>
                </ul>
              </div>
              <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontWeight: 700 }}>Conversion health</div>
                <ul style={{ margin: '6px 0 0 12px', padding: 0, color: '#cbd5e1', fontSize: 13 }}>
                  <li>FTD YoY: {formatPercent(yoyDelta(totals2026.ftd, totals2025.ftd) || 0, 1)}</li>
                  <li>QFTD YoY: {formatPercent(yoyDelta(totals2026.qftd, totals2025.qftd) || 0, 1)}</li>
                  <li>Seasonality strength: {(assumptions.seasonalityStrength ?? 0.15).toFixed(2)}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="card" style={{ textAlign: 'center', color: '#94a3b8' }}>Loading media/payments…</div>
        )}
      </div>
    )
  }
