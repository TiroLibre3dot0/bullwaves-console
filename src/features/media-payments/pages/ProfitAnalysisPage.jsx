import React, { useMemo, useState } from 'react'
import KpiCard from '../../../components/profit/KpiCard'
import RegionBarChart from '../../../components/profit/RegionBarChart'
import CountryMapChart from '../../../components/profit/CountryMapChart'
import SegmentBarChart from '../../../components/profit/SegmentBarChart'
import ProfitRatioScatter from '../../../components/profit/ProfitRatioScatter'
import RegistrationBarChart from '../../../components/profit/RegistrationBarChart'
import PnLTrendChart from '../../../components/PnLTrendChart'
import { useMediaReport } from '../hooks/useMediaPaymentsData'

const formatter = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const formatNumberShort = (value) => {
  const num = Number(value || 0)
  const abs = Math.abs(num)
  if (abs >= 1_000_000) return `${Math.round(num / 1_000_000)}M`
  if (abs >= 1000) return `${Math.round(num / 1000)}k`
  return formatter.format(Math.round(num))
}
const formatEuro = (value) => `${formatNumberShort(value)} €`
const formatPercent = (value) => `${(Number(value || 0)).toFixed(2)}%`

const iso3FromName = (name) => {
  const n = (name || '').toLowerCase().trim()
  const map = {
    italy: 'ITA', spain: 'ESP', france: 'FRA', germany: 'DEU', poland: 'POL', portugal: 'PRT', greece: 'GRC', turkey: 'TUR', romania: 'ROU', russia: 'RUS', ukraine: 'UKR',
    canada: 'CAN', 'united states': 'USA', 'united states of america': 'USA', usa: 'USA', 'united kingdom': 'GBR', uk: 'GBR', ireland: 'IRL', netherlands: 'NLD', belgium: 'BEL', austria: 'AUT', switzerland: 'CHE',
    'czech republic': 'CZE', czechia: 'CZE', hungary: 'HUN', 'united arab emirates': 'ARE', 'saudi arabia': 'SAU', sweden: 'SWE', norway: 'NOR', finland: 'FIN', denmark: 'DNK'
  }
  if (map[n]) return map[n]
  return (name || '').toUpperCase().slice(0, 3) || 'UNK'
}

export default function ProfitAnalysisPage() {
  const { data: mediaRows, loading } = useMediaReport()
  const [selectedYear, setSelectedYear] = useState('all')
  const [scatterEntity, setScatterEntity] = useState('affiliate')

  const yearOptions = useMemo(() => {
    const set = new Set(mediaRows.map((r) => r.year).filter((y) => y && y !== '—'))
    return ['all', ...Array.from(set).sort()]
  }, [mediaRows])

  const filteredRows = useMemo(() => mediaRows.filter((r) => selectedYear === 'all' ? true : r.year === Number(selectedYear)), [mediaRows, selectedYear])

  const kpis = useMemo(() => {
    const sum = (field) => filteredRows.reduce((acc, r) => acc + (r[field] || 0), 0)
    const sales = sum('netDeposits')
    const profit = sum('pl')
    const ftd = sum('ftd')
    const registrations = sum('registrations')
    const profitRatio = sales ? (profit / sales) * 100 : 0
    return { sales, profit, ftd, registrations, profitRatio }
  }, [filteredRows])

  const affiliatesData = useMemo(() => {
    const map = new Map()
    filteredRows.forEach((r) => {
      const key = r.affiliate || '—'
      if (!map.has(key)) map.set(key, { label: key, profit: 0, netDeposits: 0 })
      const acc = map.get(key)
      acc.profit += r.pl || 0
      acc.netDeposits += r.netDeposits || 0
    })
    return Array.from(map.values())
      .sort((a, b) => (b.profit || 0) - (a.profit || 0))
      .slice(0, 10)
  }, [filteredRows])

  const countryData = useMemo(() => {
    const map = new Map()
    filteredRows.forEach((r) => {
      const code = iso3FromName(r.country || r.countryCode)
      if (!map.has(code)) map.set(code, { code, label: r.country || code, value: 0, netDeposits: 0 })
      const acc = map.get(code)
      acc.value += r.pl || 0
      acc.netDeposits += r.netDeposits || 0
    })
    return Array.from(map.values())
  }, [filteredRows])

  const depositsWithdrawalsByMonth = useMemo(() => {
    const map = new Map()
    filteredRows.forEach((r) => {
      if (!map.has(r.monthIndex)) map.set(r.monthIndex, { label: r.monthLabel, deposits: 0, withdrawals: 0, pl: 0 })
      const acc = map.get(r.monthIndex)
      acc.deposits += r.netDeposits || 0
      acc.withdrawals += r.withdrawals || 0
      acc.pl += r.pl || 0
    })
    const result = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v)
    return result
  }, [filteredRows])

  const registrationsByAffiliate = useMemo(() => {
    const map = new Map()
    filteredRows.forEach((r) => {
      const key = r.affiliate || '—'
      if (!map.has(key)) map.set(key, { label: key, registrations: 0 })
      map.get(key).registrations += r.registrations || 0
    })
    const values = Array.from(map.values())
    const best = [...values].sort((a, b) => (b.registrations || 0) - (a.registrations || 0)).slice(0, 10)
    const worst = [...values].sort((a, b) => (a.registrations || 0) - (b.registrations || 0)).slice(0, 10)
    return { best, worst }
  }, [filteredRows])

  const scatterData = useMemo(() => {
    if (scatterEntity === 'country') {
      return countryData.map((c) => ({
        x: c.netDeposits ? (c.value / Math.max(c.netDeposits, 1)) * 100 : 0,
        y: c.netDeposits,
        label: c.label,
      }))
    }
    const map = new Map()
    filteredRows.forEach((r) => {
      if (!map.has(r.affiliate)) map.set(r.affiliate, { pl: 0, netDeposits: 0 })
      const acc = map.get(r.affiliate)
      acc.pl += r.pl || 0
      acc.netDeposits += r.netDeposits || 0
    })
    return Array.from(map.entries()).map(([affiliate, agg]) => ({
      x: agg.netDeposits ? (agg.pl / Math.max(agg.netDeposits, 1)) * 100 : 0,
      y: agg.netDeposits,
      label: affiliate,
    }))
  }, [filteredRows, scatterEntity, countryData])

  const profitRatioTrend = useMemo(() => {
    const map = new Map()
    filteredRows.forEach((r) => {
      const key = r.monthKey || 'unknown'
      if (!map.has(key)) {
        map.set(key, {
          monthKey: key,
          monthIndex: r.monthIndex ?? -1,
          year: r.year ?? 0,
          monthLabel: r.monthLabel || key,
          pl: 0,
          netDeposits: 0,
        })
      }
      const acc = map.get(key)
      acc.pl += r.pl || 0
      acc.netDeposits += r.netDeposits || 0
    })

    const ordered = Array.from(map.values())
      .filter((m) => m.monthIndex !== undefined && m.monthIndex >= 0)
      .sort((a, b) => {
        const ay = Number(a.year) || 0
        const by = Number(b.year) || 0
        return ay - by || (a.monthIndex || 0) - (b.monthIndex || 0)
      })

    const labels = ordered.map((m) => m.monthLabel)
    const values = ordered.map((m) => (m.netDeposits ? (m.pl / Math.max(m.netDeposits, 1)) * 100 : 0))
    const tooltipData = ordered.map((m) => ({ pl: m.pl, netDeposits: m.netDeposits }))
    return { labels, values, tooltipData }
  }, [filteredRows])

  return (
    <div className="w-full space-y-4" style={{ background: 'radial-gradient(120% 120% at 10% 20%, #0b1c24 0%, #0a0f1e 45%, #0a090f 100%)', padding: 16, borderRadius: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Profit analysis</h2>
          <p style={{ margin: 0, color: '#9fb3c8', fontSize: 12 }}>Media Report only · KPIs, affiliates, map, deposits</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ color: '#94a3b8', fontSize: 12 }}>Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ background: '#0f172a', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', minWidth: 120 }}
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y === 'all' ? 'All' : y}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <KpiCard label="Net Deposits" value={formatEuro(kpis.sales)} tone="#22d3ee" />
        <KpiCard label="PL" value={formatEuro(kpis.profit)} tone="#34d399" />
        <KpiCard label="FTD" value={formatNumberShort(kpis.ftd)} tone="#fbbf24" />
        <KpiCard label="Registrations" value={formatNumberShort(kpis.registrations)} tone="#a855f7" />
        <KpiCard label="PL / Net Deposits" value={formatPercent(kpis.profitRatio)} tone={kpis.profitRatio >= 0 ? '#34d399' : '#f87171'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <div className="card card-global">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>PL vs Net Deposits by affiliate</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Top 10 by PL</span>
          </div>
          <RegionBarChart data={affiliatesData} />
        </div>
        <div className="card card-global">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Profit by country</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Hover to inspect</span>
          </div>
          <div className="h-72 md:h-80 lg:h-96">
            <CountryMapChart data={countryData} />
          </div>
        </div>
        <div className="card card-global">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Net Deposits vs Withdrawals vs PL</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>By month</span>
          </div>
          <SegmentBarChart data={depositsWithdrawalsByMonth} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        <div className="card card-global">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Best affiliates by registrations</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Top 10</span>
          </div>
          <RegistrationBarChart data={registrationsByAffiliate.best} title="Registrations" />
        </div>
        <div className="card card-global">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0 }}>PL / Net Deposits trend</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>KPI mensile (redditività dei trader)</p>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Positivo = PL superiore ai net deposits</span>
          </div>
          {profitRatioTrend.values.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 12 }}>Nessun dato disponibile</div>
          ) : (
            <div style={{ height: 240 }}>
              <PnLTrendChart
                dataPoints={profitRatioTrend.values}
                labels={profitRatioTrend.labels}
                datasetLabel="PL / Net Deposits (%)"
                formatValue={(v) => `${(Number(v) || 0).toFixed(1)}%`}
                tooltipData={profitRatioTrend.tooltipData}
                tooltipFormatter={({ value, extra }) => {
                  const pl = extra?.pl || 0
                  const net = extra?.netDeposits || 0
                  const ratio = Number(value) || 0
                  return `PL / Net Deposits: ${ratio.toFixed(1)}% (PL ${formatEuro(pl)} / Net ${formatEuro(net)})`
                }}
              />
            </div>
          )}
        </div>
        <div className="card card-global">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Profit ratio vs sales</h3>
            <select
              value={scatterEntity}
              onChange={(e) => setScatterEntity(e.target.value)}
              style={{ background: '#0f172a', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 8px', fontSize: 12 }}
            >
              <option value="affiliate">By affiliate</option>
              <option value="country">By country</option>
            </select>
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Destra = ROI migliore, alto = Net Deposits più alti. I punti verdi rendono di più; rossi = PL negativo.</div>
          <ProfitRatioScatter data={scatterData} />
        </div>
      </div>

      {loading && (
        <div className="card card-global" style={{ textAlign: 'center', color: '#94a3b8' }}>Loading media report…</div>
      )}
    </div>
  )
}
