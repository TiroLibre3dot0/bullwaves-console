import React, { useEffect, useMemo, useState } from 'react'
import PnLTrendChart from '../../../components/PnLTrendChart'
import CardSection from '../../../components/common/CardSection'
import FilterBar from '../../../components/common/FilterBar'
import KpiCard from '../../../components/common/KpiCard'
import YearSelector from '../../../components/common/YearSelector'
import FullPageLoader from '../../../components/FullPageLoader'
import {
  formatEuro,
  formatEuroFull,
  formatNumber,
  formatNumberShort,
  formatPercent,
} from '../../../lib/formatters'
import { useMediaPaymentsData } from '../../media-payments/hooks/useMediaPaymentsData'
import { useAffiliateLedger } from '../../media-payments/hooks/useAffiliateLedger'
import { checkDataStatus } from '../../../utils/dataStatusChecker'
import { useDataStatus } from '../../../context/DataStatusContext'
import { useI18n } from '../../../i18n/I18nContext'
import { getPublicShareOrigin } from '../../../utils/publicShareOrigin'

const selectStyle = {
  minWidth: 180,
  background: '#0d1a2c',
  color: 'var(--text)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '8px 10px',
}
const formatNumberFull = (value) => formatNumber(value)
const FINANCE_CONFIRMED_KEY = 'affiliate-finance-confirmed'

const roiPillStyle = (roi) => {
  const isPositive = Number(roi) > 0
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    border: `1px solid ${isPositive ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
    background: isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
    color: isPositive ? '#34d399' : '#f87171',
  }
}
const toIntlLocale = (locale) => {
  if (locale === 'it') return 'it-IT'
  if (locale === 'sr') return 'sr-RS'
  return 'en-US'
}

const monthLabel = (locale, m) => {
  const parts = (m || '').split('-')
  if (parts.length < 2) return m

  const year = Number(parts[0])
  const monthIdx = Number(parts[1]) - 1
  if (!Number.isFinite(year) || !Number.isFinite(monthIdx) || monthIdx < 0 || monthIdx > 11)
    return m

  try {
    const date = new Date(year, monthIdx, 1)
    return new Intl.DateTimeFormat(toIntlLocale(locale), {
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return m
  }
}

export default function InvestmentsDashboard(props) {
  const {
    initialSelectedYear = 'all',
    initialSelectedMonth = 'all',
    initialSearch = '',
  } = props || {}

  const { t, locale } = useI18n()
  const { payments, mediaRows, loading } = useMediaPaymentsData()
  const [selectedYear, setSelectedYear] = useState(initialSelectedYear || 'all')
  const [selectedMonth, setSelectedMonth] = useState(initialSelectedMonth || 'all')
  const [search, setSearch] = useState(initialSearch || '')
  const [showAllAffiliates, setShowAllAffiliates] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [financeConfirmed, setFinanceConfirmed] = useState({})
  const { setDataStatus } = useDataStatus()

  const ledger = useAffiliateLedger({ mediaRows, payments, selectedYear, selectedMonth, search })

  const availableYears = useMemo(() => {
    const set = new Set()
    mediaRows.forEach((m) => Number.isFinite(Number(m.year)) && set.add(Number(m.year)))
    payments.forEach((p) => Number.isFinite(Number(p.year)) && set.add(Number(p.year)))
    return Array.from(set).sort((a, b) => a - b)
  }, [mediaRows, payments])

  const monthOptions = useMemo(() => {
    const map = new Map()
    const add = (row) => {
      if (row == null) return
      if (selectedYear !== 'all' && Number(row.year) !== Number(selectedYear)) return
      const year = Number(row.year)
      const monthIdx = Number(row.monthIndex)
      if (!Number.isFinite(year) || !Number.isFinite(monthIdx) || monthIdx < 0) return
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
      map.set(key, monthLabel(locale, key))
    }
    mediaRows.forEach(add)
    payments.forEach(add)
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value.localeCompare(b.value))
  }, [mediaRows, payments, selectedYear, locale])

  const toggleExpand = (aff) => setExpanded((prev) => (prev === aff ? null : aff))

  const onShare = () => {
    try {
      const origin = getPublicShareOrigin()
      const params = new window.URLSearchParams()
      if (selectedYear && selectedYear !== 'all') params.set('year', String(selectedYear))
      if (selectedMonth && selectedMonth !== 'all') params.set('month', String(selectedMonth))
      if (search) params.set('search', String(search))
      const qs = params.toString()
      const href = `${origin}/share/affiliate-payout-summary${qs ? `?${qs}` : ''}`
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch (e) {
      console.warn('Unable to open share link', e)
    }
  }

  useEffect(() => {
    try {
      const rawFinance = localStorage.getItem(FINANCE_CONFIRMED_KEY)
      if (rawFinance) {
        const parsed = JSON.parse(rawFinance)
        if (parsed && typeof parsed === 'object') setFinanceConfirmed(parsed)
      }
    } catch (e) {
      console.warn('Unable to load finance confirmations', e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(FINANCE_CONFIRMED_KEY, JSON.stringify(financeConfirmed))
    } catch (e) {
      console.warn('Unable to persist finance confirmations', e)
    }
  }, [financeConfirmed])

  // Carica status dati
  useEffect(() => {
    async function loadDataStatus() {
      try {
        const resp = await fetch('/Payments Report.csv')
        if (!resp.ok) return
        const text = await resp.text()
        const lines = text.split(/\r?\n/).filter((line) => line.trim())
        if (lines.length < 2) return
        const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim())
        const rows = lines.slice(1).map((line) => {
          const cols = line.split(',').map((v) => v.replace(/"/g, '').trim())
          const row = {}
          headers.forEach((h, idx) => {
            row[h] = cols[idx] || ''
          })
          return row
        })
        // Trova colonna data, usa 'Date' o simili
        const dateKey = headers.find((h) => h.toLowerCase().includes('date')) || headers[0]
        const status = checkDataStatus(rows, dateKey, 'Payments Report')
        setDataStatus(status)
      } catch (err) {
        console.error('Failed to load payments for status', err)
      }
    }
    loadDataStatus()
  }, [])

  const toggleFinanceConfirmed = (affiliateId) => {
    setFinanceConfirmed((prev) => ({ ...prev, [affiliateId]: !prev[affiliateId] }))
  }

  if (loading) {
    return <FullPageLoader progress={45} subtitle={t('investments.loader.data')} />
  }

  return (
    <div className="w-full space-y-4">
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          paddingTop: 4,
          marginTop: -4,
          background: 'linear-gradient(180deg, rgba(9,16,28,0.96), rgba(9,16,28,0.85))',
          backdropFilter: 'blur(8px)',
        }}
      >
        <CardSection
          title={t('investments.header.title')}
          subtitle={t('investments.header.subtitle')}
          actions={
            <FilterBar>
              <YearSelector
                availableYears={availableYears}
                value={selectedYear}
                onChange={(val) => {
                  setSelectedYear(val)
                  setSelectedMonth('all')
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {t('investments.filters.month')}
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ ...selectStyle, minWidth: 160 }}
                >
                  <option value="all">{t('investments.filters.allMonths')}</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <span
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: 12,
                  color: '#cbd5e1',
                }}
              >
                {t('investments.badge.monthlyRows', { count: ledger.ledger.length })}
              </span>
            </FilterBar>
          }
        />
      </div>

      <>
        <div
          className="kpi-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}
        >
          <KpiCard
            label={t('investments.kpi.totalQftd')}
            value={formatNumberShort(ledger.totals.totalQftd)}
            helper={formatNumberFull(ledger.totals.totalQftd)}
          />
          <KpiCard
            label={t('investments.kpi.avgCpa')}
            value={formatEuro(ledger.totals.avgCpa)}
            helper={formatEuroFull(ledger.totals.avgCpa)}
          />
          <KpiCard
            label={t('investments.kpi.totalCommissions')}
            value={formatEuro(ledger.totals.totalCommission)}
            helper={formatEuroFull(ledger.totals.totalCommission)}
          />
          <KpiCard
            label={t('investments.kpi.commissionPayable')}
            value={formatEuro(ledger.totals.totalMarketingPayable)}
            helper={formatEuroFull(ledger.totals.totalMarketingPayable)}
            tone="#22c55e"
          />
          <KpiCard
            label={t('investments.kpi.commissionsDeferred')}
            value={formatEuro(ledger.totals.totalMarketingDeferred)}
            helper={formatEuroFull(ledger.totals.totalMarketingDeferred)}
            tone="#f97316"
          />
          <KpiCard
            label={t('investments.kpi.roi')}
            value={formatPercent(ledger.totals.totalRoi * 100, 2)}
            helper={formatPercent(ledger.totals.totalRoi * 100, 4)}
            tone={ledger.totals.totalRoi > 0 ? '#34d399' : '#f87171'}
          />
          <KpiCard
            label={t('investments.kpi.paid')}
            value={formatEuro(ledger.totals.totalPaid)}
            helper={formatEuroFull(ledger.totals.totalPaid)}
            tone="#38bdf8"
          />
        </div>

        <div className="card card-global" style={{ minWidth: 320 }}>
          <h3 style={{ marginBottom: 8 }}>{t('investments.section.payoutTimeline')}</h3>
          <div style={{ height: 260 }}>
            <PnLTrendChart
              labels={ledger.timelineSeries.map((m) => m.label)}
              series={[
                {
                  label: t('investments.kpi.paid'),
                  data: ledger.timelineSeries.map((m) => m.paid),
                  color: '#f97316',
                },
              ]}
              formatValue={formatNumberShort}
            />
          </div>
        </div>

        <div className="card card-global">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h3 style={{ marginBottom: 0, flex: 1 }}>
              {t('investments.section.affiliatePayoutSummary')}
            </h3>
            <button className="btn" onClick={onShare} title={t('investments.share.title')}>
              {t('investments.share.cta')}
            </button>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...selectStyle, minWidth: 200, background: 'rgba(255,255,255,0.04)' }}
              placeholder={t('investments.search.placeholder')}
              aria-label={t('investments.search.aria')}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'right' }}>{t('dashboard.topAffiliates.table.rank')}</th>
                  <th style={{ textAlign: 'left' }}>{t('investments.table.header.affiliate')}</th>
                  <th style={{ textAlign: 'right' }}>{t('investments.table.header.cpa')}</th>
                  <th style={{ textAlign: 'right' }}>{t('investments.table.header.totalQftd')}</th>
                  <th
                    style={{ textAlign: 'right' }}
                    title={t('investments.table.title.paidFiltered')}
                  >
                    {t('investments.table.header.paidFiltered')}
                  </th>
                  <th style={{ textAlign: 'right' }}>{t('investments.table.header.pl')}</th>
                  <th style={{ textAlign: 'right' }}>
                    {t('investments.table.header.currentMonthCommission')}
                  </th>
                  <th
                    style={{ textAlign: 'right' }}
                    title={t('investments.details.title.roiFormula')}
                  >
                    {t('investments.details.header.roi')}
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    {t('investments.table.header.financeConfirmed')}
                  </th>
                  <th style={{ textAlign: 'left' }}>{t('investments.table.header.lastMonth')}</th>
                  <th style={{ textAlign: 'left' }}>{t('investments.table.header.details')}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 600 }}>
                  <td style={{ textAlign: 'right', color: '#94a3b8' }}>—</td>
                  <td>{t('investments.table.row.totals')}</td>
                  <td
                    style={{ textAlign: 'right', color: '#fbbf24' }}
                    className="num"
                    title={formatEuroFull(ledger.totals.avgCpa)}
                  >
                    {formatEuro(ledger.totals.avgCpa)}
                  </td>
                  <td
                    style={{ textAlign: 'right' }}
                    className="num"
                    title={formatNumberFull(ledger.totals.totalQftd)}
                  >
                    {formatNumberShort(ledger.totals.totalQftd)}
                  </td>
                  <td
                    style={{ textAlign: 'right', color: '#38bdf8' }}
                    className="num"
                    title={formatEuroFull(ledger.totals.totalPaid)}
                  >
                    {formatEuro(ledger.totals.totalPaid)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: ledger.totals.totalPl >= 0 ? '#34d399' : '#f87171',
                    }}
                    className="num"
                    title={formatEuroFull(ledger.totals.totalPl)}
                  >
                    {formatEuro(ledger.totals.totalPl)}
                  </td>
                  <td
                    style={{ textAlign: 'right', color: '#f97316' }}
                    className="num"
                    title={formatEuroFull(ledger.totals.totalCurrentMonthCommission)}
                  >
                    {formatEuro(ledger.totals.totalCurrentMonthCommission)}
                  </td>
                  <td
                    style={{ textAlign: 'right' }}
                    className="num"
                    title={formatPercent(ledger.totals.totalRoi * 100, 4)}
                  >
                    <span style={roiPillStyle(ledger.totals.totalRoi)}>
                      {formatPercent(ledger.totals.totalRoi * 100, 2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', color: '#94a3b8' }}>—</td>
                  <td>—</td>
                  <td></td>
                </tr>
                {(showAllAffiliates
                  ? ledger.affiliateSummaries
                  : ledger.affiliateSummaries.slice(0, 10)
                ).map((a) => (
                  <React.Fragment key={a.affiliateId}>
                    <tr>
                      <td style={{ textAlign: 'right', color: '#94a3b8' }} className="num">
                        {a.rank}
                      </td>
                      <td>{a.affiliateName}</td>
                      <td
                        style={{ textAlign: 'right' }}
                        className="num"
                        title={formatEuroFull(a.cpa)}
                      >
                        {formatEuro(a.cpa)}
                      </td>
                      <td
                        style={{ textAlign: 'right' }}
                        className="num"
                        title={formatNumberFull(a.totalQftd)}
                      >
                        {formatNumberShort(a.totalQftd)}
                      </td>
                      <td
                        style={{ textAlign: 'right', color: '#38bdf8' }}
                        className="num"
                        title={formatEuroFull(a.totalPaid)}
                      >
                        {formatEuro(a.totalPaid)}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          color: a.totalPl >= 0 ? '#34d399' : '#f87171',
                        }}
                        className="num"
                        title={formatEuroFull(a.totalPl)}
                      >
                        {formatEuro(a.totalPl)}
                      </td>
                      <td
                        style={{ textAlign: 'right', color: '#f97316' }}
                        className="num"
                        title={formatEuroFull(a.currentMonthCommission)}
                      >
                        {formatEuro(a.currentMonthCommission)}
                      </td>
                      <td
                        style={{ textAlign: 'right' }}
                        className="num"
                        title={formatPercent(a.currentMonthRoi * 100, 4)}
                      >
                        <span style={roiPillStyle(a.currentMonthRoi)}>
                          {formatPercent(a.currentMonthRoi * 100, 2)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={!!financeConfirmed[a.affiliateId]}
                          onChange={() => toggleFinanceConfirmed(a.affiliateId)}
                          title={t('investments.checkbox.title.financeConfirmed')}
                        />
                      </td>
                      <td>{a.lastMonth ? monthLabel(locale, a.lastMonth) : '—'}</td>
                      <td>
                        <button className="btn" onClick={() => toggleExpand(a.affiliateId)}>
                          {expanded === a.affiliateId
                            ? t('common.hide')
                            : t('investments.button.details')}
                        </button>
                      </td>
                    </tr>
                    {expanded === a.affiliateId && (
                      <tr>
                        <td colSpan={11}>
                          <div
                            style={{
                              padding: '8px 12px',
                              background: 'rgba(255,255,255,0.02)',
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <table className="table" style={{ width: '100%' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left' }}>
                                    {t('investments.details.header.month')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.reg')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.ftd')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.qftd')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.netDeposits')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.commissions')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.pl')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.roiFormula')}
                                  >
                                    {t('investments.details.header.roi')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.cpa')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.commExpected')}
                                  >
                                    {t('investments.details.header.commExpected')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.commActual')}
                                  >
                                    {t('investments.details.header.commActual')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.commPayable')}
                                  >
                                    {t('investments.details.header.commPayable')}
                                  </th>
                                  <th
                                    style={{ textAlign: 'right' }}
                                    title={t('investments.details.title.commDeferred')}
                                  >
                                    {t('investments.details.header.commDeferred')}
                                  </th>
                                  <th style={{ textAlign: 'right' }}>
                                    {t('investments.details.header.paid')}
                                  </th>
                                  <th style={{ textAlign: 'left' }}>
                                    {t('investments.details.header.paymentDate')}
                                  </th>
                                  <th style={{ textAlign: 'left' }}>
                                    {t('investments.details.header.details')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {ledger.ledger
                                  .filter((r) => r.affiliateId === a.affiliateId)
                                  .sort((x, y) => y.year - x.year || y.monthIndex - x.monthIndex)
                                  .map((r) => (
                                    <tr key={`${r.month}-${r.affiliateId}`}>
                                      <td>{monthLabel(locale, r.month)}</td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatNumberFull(r.registrations)}
                                      >
                                        {formatNumberShort(r.registrations)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatNumberFull(r.ftd)}
                                      >
                                        {formatNumberShort(r.ftd)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatNumberFull(r.qftd)}
                                      >
                                        {formatNumberShort(r.qftd)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#38bdf8' }}
                                        className="num"
                                        title={formatEuroFull(r.netDeposits)}
                                      >
                                        {formatEuro(r.netDeposits)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFull(r.commissionTotal)}
                                      >
                                        {formatEuro(r.commissionTotal)}
                                      </td>
                                      <td
                                        style={{
                                          textAlign: 'right',
                                          color: r.pl >= 0 ? '#34d399' : '#f87171',
                                        }}
                                        className="num"
                                        title={formatEuroFull(r.pl)}
                                      >
                                        {formatEuro(r.pl)}
                                      </td>
                                      <td
                                        style={{
                                          textAlign: 'right',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'flex-end',
                                          gap: 6,
                                        }}
                                        className="num"
                                        title={formatNumber(r.roi, {
                                          minimumFractionDigits: 4,
                                          maximumFractionDigits: 4,
                                        })}
                                      >
                                        <span
                                          style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: r.roi > 0 ? '#22c55e' : '#ef4444',
                                          }}
                                        />
                                        <span style={roiPillStyle(r.roi)}>
                                          {formatPercent(r.roi * 100, 2)}
                                        </span>
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFull(r.negotiatedCpa)}
                                      >
                                        {formatEuro(r.negotiatedCpa)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFull(r.marketingExpected)}
                                      >
                                        {formatEuro(r.marketingExpected)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right' }}
                                        className="num"
                                        title={formatEuroFull(r.marketingActual)}
                                      >
                                        {formatEuro(r.marketingActual)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#22c55e' }}
                                        className="num"
                                        title={formatEuroFull(r.marketingPayable)}
                                      >
                                        {formatEuro(r.marketingPayable)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#f97316' }}
                                        className="num"
                                        title={formatEuroFull(r.marketingDeferred)}
                                      >
                                        {formatEuro(r.marketingDeferred)}
                                      </td>
                                      <td
                                        style={{ textAlign: 'right', color: '#38bdf8' }}
                                        className="num"
                                        title={formatEuroFull(r.paidAmount)}
                                      >
                                        {formatEuro(r.paidAmount)}
                                      </td>
                                      <td>{r.paymentDate || '—'}</td>
                                      <td title={r.details?.length ? r.details.join(' | ') : '—'}>
                                        {r.details?.length ? r.details.join(' • ') : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                {!ledger.ledger.some((r) => r.affiliateId === a.affiliateId) && (
                                  <tr>
                                    <td
                                      colSpan={16}
                                      style={{ textAlign: 'center', color: '#94a3b8' }}
                                    >
                                      {t('investments.details.empty.noMonthlyRows')}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {!ledger.affiliateSummaries.length && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', color: '#94a3b8' }}>
                      {t('investments.table.empty.noAffiliates')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {ledger.affiliateSummaries.length > 10 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <button
                  className="btn"
                  onClick={() => setShowAllAffiliates((prev) => !prev)}
                  style={{ padding: '8px 14px' }}
                >
                  {showAllAffiliates
                    ? t('investments.button.showTop10')
                    : t('investments.button.showAll', { count: ledger.affiliateSummaries.length })}
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    </div>
  )
}
