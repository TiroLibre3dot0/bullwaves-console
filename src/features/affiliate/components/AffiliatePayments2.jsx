import React, { useState, useMemo, useCallback, useEffect } from 'react'
import useAffiliatePayments from '../hooks/useAffiliatePayments'
import { formatEuro } from '../../../lib/formatters'
import { checkDataStatus } from '../../../utils/dataStatusChecker'
import { useDataStatus } from '../../../context/DataStatusContext'
import FullPageLoader from '../../../components/FullPageLoader'
import { useI18n } from '../../../i18n/I18nContext'

const panel = {
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-primary)',
  borderRadius: 12,
  padding: 14,
  boxShadow: 'var(--shadow-card)',
}

const inputStyle = {
  width: '100%',
  padding: 10,
  borderRadius: 10,
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 14,
}

const labelStyle = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  fontWeight: 700,
  display: 'block',
  marginBottom: 6,
}

const metricCard = {
  background: 'var(--bg-secondary)',
  padding: 12,
  borderRadius: 10,
  border: '1px solid var(--border-primary)',
}

function monthLabel(m) {
  const parts = (m || '').split('-')
  if (parts.length < 2) return m
  const idx = Number(parts[1]) - 1
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[idx] || m} ${parts[0]}`
}

function normalizeDelta(delta, threshold = 1) {
  const d = Number(delta || 0)
  if (!Number.isFinite(d)) return 0
  return Math.abs(d) < threshold ? 0 : d
}

export default function AffiliatePayments2() {
  const { t } = useI18n()
  const { loading, error, map, reload, getAffiliate } = useAffiliatePayments()
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [expandedMonth, setExpandedMonth] = useState(null)
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const { setDataStatus } = useDataStatus()

  const affiliates = useMemo(() => {
    if (!map) return []
    return Object.values(map).sort((a, b) => (b.totals?.total || 0) - (a.totals?.total || 0))
  }, [map])

  const selectedRec = useMemo(() => {
    if (!selected) return null
    return map && map[selected]
  }, [map, selected])

  const availableYears = useMemo(() => {
    if (!map) return []
    if (selectedRec) {
      const years = new Set()
      Object.keys(selectedRec.months).forEach((month) => {
        const year = month.split('-')[0]
        if (year && year !== 'unknown') years.add(year)
      })
      return Array.from(years).sort().reverse()
    } else {
      // For all affiliates
      const years = new Set()
      Object.values(map).forEach((aff) => {
        Object.keys(aff.months).forEach((month) => {
          const year = month.split('-')[0]
          if (year && year !== 'unknown') years.add(year)
        })
      })
      return Array.from(years).sort().reverse()
    }
  }, [selectedRec, map])

  const availableMonths = useMemo(() => {
    if (!map) return []
    if (selectedRec) {
      const months = new Set()
      Object.keys(selectedRec.months).forEach((month) => {
        const [year, mon] = month.split('-')
        if (mon && (!filterYear || year === filterYear)) months.add(mon)
      })
      return Array.from(months).sort()
    } else {
      const months = new Set()
      Object.values(map).forEach((aff) => {
        Object.keys(aff.months).forEach((month) => {
          const [year, mon] = month.split('-')
          if (mon && (!filterYear || year === filterYear)) months.add(mon)
        })
      })
      return Array.from(months).sort()
    }
  }, [selectedRec, map, filterYear])

  const aggregatedMonths = useMemo(() => {
    if (!map || selectedRec) return {}
    // Aggrega i mesi di tutti gli affiliati
    const monthMap = {}
    Object.values(map).forEach((aff) => {
      Object.entries(aff.months).forEach(([monthKey, monthData]) => {
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = {
            total: 0,
            subaffiliate: 0,
            cpa: 0,
            cpl: 0,
            revshare: 0,
            other: 0,
            paid: 0,
            netDeposits: 0,
            contributors: [],
          }
        }
        monthMap[monthKey].total += monthData.total || 0
        monthMap[monthKey].subaffiliate += monthData.subaffiliate || 0
        monthMap[monthKey].cpa += monthData.cpa || 0
        monthMap[monthKey].cpl += monthData.cpl || 0
        monthMap[monthKey].revshare += monthData.revshare || 0
        monthMap[monthKey].other += monthData.other || 0
        monthMap[monthKey].paid += monthData.paid || 0
        monthMap[monthKey].netDeposits += monthData.netDeposits || 0
        // Aggrega contributors da tutti gli affiliati per questo mese
        monthMap[monthKey].contributors.push(...(monthData.contributors || []))
      })
    })
    return monthMap
  }, [map, selectedRec])

  const filteredMonths = useMemo(() => {
    if (selectedRec) {
      const filtered = {}
      Object.entries(selectedRec.months).forEach(([monthKey, data]) => {
        const [year, mon] = monthKey.split('-')
        if ((!filterYear || year === filterYear) && (!filterMonth || mon === filterMonth)) {
          filtered[monthKey] = data
        }
      })
      return filtered
    } else {
      // For all affiliates, filter aggregatedMonths
      const filtered = {}
      Object.entries(aggregatedMonths).forEach(([monthKey, data]) => {
        const [year, mon] = monthKey.split('-')
        if ((!filterYear || year === filterYear) && (!filterMonth || mon === filterMonth)) {
          filtered[monthKey] = data
        }
      })
      return filtered
    }
  }, [selectedRec, aggregatedMonths, filterYear, filterMonth])

  const filteredTotals = useMemo(() => {
    const totals = {
      total: 0,
      subaffiliate: 0,
      cpa: 0,
      cpl: 0,
      revshare: 0,
      other: 0,
      paid: 0,
      netDeposits: 0,
    }
    Object.values(filteredMonths || {}).forEach((m) => {
      totals.total += m.total || 0
      totals.subaffiliate += m.subaffiliate || 0
      totals.cpa += m.cpa || 0
      totals.cpl += m.cpl || 0
      totals.revshare += m.revshare || 0
      totals.other += m.other || 0
      totals.paid += m.paid || 0
      totals.netDeposits += m.netDeposits || 0
    })
    return totals
  }, [filteredMonths])

  const showTotalsRow = !!(filterYear || filterMonth)

  const totalsTitle = useMemo(() => {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const monLabel = filterMonth
      ? `${monthNames[Number(filterMonth) - 1] || filterMonth} (${filterMonth})`
      : ''
    if (filterYear && filterMonth) return `Totals ${filterYear} · ${monLabel}`
    if (filterYear) return `Totals ${filterYear}`
    if (filterMonth) return `Totals · ${monLabel}`
    return 'Totals'
  }, [filterYear, filterMonth])

  const exportData = useCallback(() => {
    if (!filteredMonths || Object.keys(filteredMonths).length === 0) return

    const monthKeys = Object.keys(filteredMonths).sort()

    const sanitizeFilePart = (s) =>
      String(s || '')
        .trim()
        .replace(/[\\/?:%*|"<>]/g, '-')
        .replace(/\s+/g, ' ')
        .slice(0, 80)

    const monthLabelForFile = (year, month) => {
      const names = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ]
      const idx = Number(month) - 1
      const mm = names[idx] || String(month || '').toLowerCase()
      return year ? `${mm} ${year}` : mm
    }

    const num = (n, digits = 2) => {
      const v = Number(n || 0)
      if (!Number.isFinite(v)) return '0.00'
      return v.toFixed(digits)
    }

    const header = [
      'month',
      'total',
      'subaffiliate',
      'cpa',
      'cpl',
      'revshare',
      'other',
      'paid',
      'difference',
      'roi_pct',
      'ok_delta',
    ]

    const rows = monthKeys.map((monthKey) => {
      const m = filteredMonths[monthKey] || {}
      const total = m.total || 0
      const paid = m.paid || 0
      const componentsSum =
        (m.subaffiliate || 0) + (m.cpa || 0) + (m.cpl || 0) + (m.revshare || 0) + (m.other || 0)
      const okDelta = componentsSum - total
      const okDeltaExport = Math.abs(okDelta) < 1 ? 0 : okDelta
      const difference = total - paid
      const roiPct = total ? ((m.netDeposits || 0) / total) * 100 : 0

      return {
        month: monthKey,
        total,
        subaffiliate: m.subaffiliate || 0,
        cpa: m.cpa || 0,
        cpl: m.cpl || 0,
        revshare: m.revshare || 0,
        other: m.other || 0,
        paid,
        difference,
        roi_pct: roiPct,
        ok_delta: okDeltaExport,
      }
    })

    const affiliateLabel = selectedRec
      ? selectedRec.name || selectedRec.id || 'affiliate'
      : 'all-affiliates'
    const monthPart =
      filterMonth && filterYear
        ? monthLabelForFile(filterYear, filterMonth)
        : filterYear
          ? String(filterYear)
          : filterMonth
            ? monthLabelForFile('', filterMonth)
            : ''
    const parts = [
      'affiliate-payments2',
      sanitizeFilePart(affiliateLabel),
      monthPart ? sanitizeFilePart(monthPart) : null,
      new Date().toISOString().slice(0, 10),
    ].filter(Boolean)

    const downloadBlob = (blob, filename) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }

    // CSV export (aligned to filters)
    const esc = (v) => {
      const s = String(v ?? '')
      const needsQuotes = /[\",\n\r]/.test(s)
      const safe = s.replace(/\"/g, '\"\"')
      return needsQuotes ? `\"${safe}\"` : safe
    }
    const lines = [header.join(',')].concat(
      rows.map((r) =>
        header
          .map((h) => {
            if (h === 'month') return esc(r.month)
            if (h === 'roi_pct') return num(r.roi_pct, 1)
            return num(r[h], 2)
          })
          .join(',')
      )
    )
    const csv = `\ufeff${lines.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const filename = `${parts.join('_')}.csv`
    downloadBlob(blob, filename)
  }, [filteredMonths, selectedRec, filterYear, filterMonth])

  const aggregatedTotals = useMemo(() => {
    if (!map)
      return {
        total: 0,
        subaffiliate: 0,
        cpa: 0,
        cpl: 0,
        revshare: 0,
        other: 0,
        paid: 0,
        netDeposits: 0,
      }
    if (selectedRec) {
      // Aggregati per l'affiliato selezionato
      const totals = {
        total: 0,
        subaffiliate: 0,
        cpa: 0,
        cpl: 0,
        revshare: 0,
        other: 0,
        paid: 0,
        netDeposits: 0,
      }
      Object.values(selectedRec.months).forEach((month) => {
        totals.total += month.total || 0
        totals.subaffiliate += month.subaffiliate || 0
        totals.cpa += month.cpa || 0
        totals.cpl += month.cpl || 0
        totals.revshare += month.revshare || 0
        totals.other += month.other || 0
        totals.paid += month.paid || 0
        totals.netDeposits += month.netDeposits || 0
      })
      return totals
    } else {
      // Aggregati per tutti gli affiliati
      const totals = {
        total: 0,
        subaffiliate: 0,
        cpa: 0,
        cpl: 0,
        revshare: 0,
        other: 0,
        paid: 0,
        netDeposits: 0,
      }
      Object.values(map).forEach((aff) => {
        if (aff.totals) {
          totals.total += aff.totals.total || 0
          totals.subaffiliate += aff.totals.subaffiliate || 0
          totals.cpa += aff.totals.cpa || 0
          totals.cpl += aff.totals.cpl || 0
          totals.revshare += aff.totals.revshare || 0
          totals.other += aff.totals.other || 0
          totals.netDeposits += aff.totals.netDeposits || 0
          totals.paid += aff.totals.paid || 0
        }
      })
      return totals
    }
  }, [map, selectedRec])

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
        const dateKey = headers.find((h) => h.toLowerCase().includes('date')) || headers[0]
        const status = checkDataStatus(rows, dateKey, 'Payments Report')
        setDataStatus(status)
      } catch (err) {
        console.error('Failed to load payments for status', err)
      }
    }
    loadDataStatus()
  }, [])

  // Render the full logo loader on the console background.
  // NOTE: keep this AFTER all hooks to preserve hook order.
  const showLoader = !map && !error
  if (showLoader) {
    return <FullPageLoader progress={55} subtitle={t('affiliatePayments2.loader.data')} />
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 22, fontWeight: 800 }}>
          Affiliate Payments 2.0
        </h3>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={exportData}
            disabled={!map || Object.keys(filteredMonths || {}).length === 0}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid var(--border-primary)',
              background:
                !map || Object.keys(filteredMonths || {}).length === 0
                  ? 'var(--bg-tertiary)'
                  : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor:
                !map || Object.keys(filteredMonths || {}).length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              marginRight: 10,
            }}
            title="Export current table as CSV (aligned to filters). OK column will contain numeric delta (|delta| < 1 exported as 0)."
          >
            Export CSV
          </button>
          <button
            onClick={reload}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid var(--border-primary)',
              background: loading ? 'var(--bg-tertiary)' : 'var(--accent-secondary)',
              color: 'var(--text-primary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
          >
            {loading ? 'Loading…' : 'Reload'}
          </button>
        </div>
      </div>
      {error && (
        <div
          style={{
            color: 'var(--text-primary)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--error)',
            padding: 10,
            borderRadius: 10,
          }}
        >
          Error: {String(error)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ ...panel, flex: '0 0 320px', minWidth: 280 }}>
          <div>
            <label style={labelStyle}>Affiliate</label>
            <select
              style={inputStyle}
              value={selected || ''}
              onChange={(e) => {
                setSelected(e.target.value || null)
                setExpandedMonth(null)
                setFilterYear('')
                setFilterMonth('')
              }}
            >
              <option value="">— All affiliates —</option>
              {affiliates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name ? `${a.name} (${a.id})` : a.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Year</label>
            <select
              style={inputStyle}
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value)
                setFilterMonth('')
                setExpandedMonth(null)
              }}
            >
              <option value="">— All years —</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Month</label>
            <select
              style={inputStyle}
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value)
                setExpandedMonth(null)
              }}
              disabled={!filterYear && availableMonths.length === 0}
            >
              <option value="">— All months —</option>
              {availableMonths.map((mon) => {
                const monthNames = [
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ]
                return (
                  <option key={mon} value={mon}>
                    {monthNames[Number(mon) - 1]} ({mon})
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        <div
          style={{
            ...panel,
            flex: '1 1 680px',
            minWidth: 320,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <h4
            style={{
              marginTop: 0,
              marginBottom: 0,
              color: 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            {selectedRec
              ? `Aggregated for ${selectedRec.name || selectedRec.id}`
              : 'Overall Aggregated Totals'}
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={metricCard}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Total {selectedRec ? 'Commissions' : 'Earned'}</span>
              </div>
              <div style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 900 }}>
                {formatEuro(aggregatedTotals.total)}
              </div>
            </div>
            <div style={metricCard}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Paid</span>
              </div>
              <div style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 900 }}>
                {formatEuro(aggregatedTotals.paid)}
              </div>
            </div>
            <div style={metricCard}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>
                  Difference{aggregatedTotals.total - aggregatedTotals.paid > 0 ? ' (pending)' : ''}
                </span>
              </div>
              <div
                style={{
                  fontSize: 18,
                  color:
                    aggregatedTotals.total - aggregatedTotals.paid >= 0
                      ? 'var(--success)'
                      : 'var(--error)',
                  fontWeight: 900,
                }}
              >
                {formatEuro(aggregatedTotals.total - aggregatedTotals.paid)}
              </div>
            </div>
            <div style={metricCard}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Sub-aff</span>
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 800 }}>
                {formatEuro(aggregatedTotals.subaffiliate)}
              </div>
            </div>
            <div style={metricCard}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>CPA</span>
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 800 }}>
                {formatEuro(aggregatedTotals.cpa)}
              </div>
            </div>
            <div style={metricCard}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>CPL</span>
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 800 }}>
                {formatEuro(aggregatedTotals.cpl)}
              </div>
            </div>
            <div style={metricCard}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Revshare</span>
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 800 }}>
                {formatEuro(aggregatedTotals.revshare)}
              </div>
            </div>
            <div style={metricCard}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Other</span>
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 800 }}>
                {formatEuro(aggregatedTotals.other)}
              </div>
            </div>
            <div style={metricCard}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>ROI %</span>
              </div>
              <div style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 900 }}>
                {aggregatedTotals.total
                  ? (((aggregatedTotals.netDeposits || 0) / aggregatedTotals.total) * 100).toFixed(
                      1
                    )
                  : '0.0'}
                %
              </div>
            </div>
          </div>

          <h4
            style={{
              marginTop: 0,
              marginBottom: 0,
              color: 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            {selectedRec ? 'Monthly breakdown' : 'Overall Monthly Breakdown'}
          </h4>
          {map && Object.keys(filteredMonths).length === 0 && (
            <div style={{ color: 'var(--text-secondary)' }}>No data available.</div>
          )}
          {map && Object.keys(filteredMonths).length > 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  maxHeight: '60vh',
                  overflow: 'auto',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 10,
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      background: 'var(--bg-secondary)',
                      zIndex: 1,
                    }}
                  >
                    <tr
                      style={{ textAlign: 'left', borderBottom: '1px solid var(--border-primary)' }}
                    >
                      <th style={{ padding: 12, color: 'var(--text-secondary)', fontWeight: 800 }}>
                        Month
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'right',
                          fontWeight: 800,
                        }}
                      >
                        Total
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'right',
                          fontWeight: 800,
                        }}
                      >
                        Sub-aff
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'right',
                          fontWeight: 800,
                        }}
                      >
                        CPA
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'right',
                          fontWeight: 800,
                        }}
                      >
                        CPL
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'right',
                          fontWeight: 800,
                        }}
                      >
                        Revshare
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'right',
                          fontWeight: 800,
                        }}
                      >
                        Other
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'right',
                          fontWeight: 800,
                        }}
                      >
                        Paid
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'right',
                          fontWeight: 800,
                        }}
                      >
                        Difference
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'right',
                          fontWeight: 800,
                        }}
                      >
                        ROI %
                      </th>
                      <th
                        style={{
                          padding: 12,
                          color: 'var(--text-secondary)',
                          textAlign: 'center',
                          fontWeight: 800,
                        }}
                        title="Verifica di coerenza: ✓ se la somma delle componenti (Sub-aff + CPA + CPL + Revshare + Other) corrisponde al totale, ✗ se c'è discrepanza"
                      >
                        OK
                      </th>
                    </tr>

                    {showTotalsRow && (
                      <tr
                        style={{
                          textAlign: 'left',
                          borderBottom: '2px solid var(--border-primary)',
                          background: 'var(--bg-card)',
                          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.04)',
                        }}
                      >
                        <th
                          style={{
                            padding: 12,
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                            borderLeft: '3px solid var(--accent-secondary)',
                          }}
                        >
                          {totalsTitle}
                        </th>
                        <th
                          style={{
                            padding: 12,
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                          }}
                        >
                          {formatEuro(filteredTotals.total)}
                        </th>
                        <th
                          style={{
                            padding: 12,
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                          }}
                        >
                          {formatEuro(filteredTotals.subaffiliate)}
                        </th>
                        <th
                          style={{
                            padding: 12,
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                          }}
                        >
                          {formatEuro(filteredTotals.cpa)}
                        </th>
                        <th
                          style={{
                            padding: 12,
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                          }}
                        >
                          {formatEuro(filteredTotals.cpl)}
                        </th>
                        <th
                          style={{
                            padding: 12,
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                          }}
                        >
                          {formatEuro(filteredTotals.revshare)}
                        </th>
                        <th
                          style={{
                            padding: 12,
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                          }}
                        >
                          {formatEuro(filteredTotals.other)}
                        </th>
                        <th
                          style={{
                            padding: 12,
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                          }}
                        >
                          {formatEuro(filteredTotals.paid)}
                        </th>
                        <th
                          style={{
                            padding: 12,
                            textAlign: 'right',
                            color:
                              (filteredTotals.total || 0) - (filteredTotals.paid || 0) >= 0
                                ? 'var(--success)'
                                : 'var(--error)',
                            fontWeight: 900,
                          }}
                        >
                          {formatEuro((filteredTotals.total || 0) - (filteredTotals.paid || 0))}
                          {filteredTotals.total - filteredTotals.paid > 0 ? ' (pending)' : ''}
                        </th>
                        <th
                          style={{
                            padding: 12,
                            textAlign: 'right',
                            color: 'var(--text-primary)',
                            fontWeight: 900,
                          }}
                        >
                          {filteredTotals.total
                            ? (
                                ((filteredTotals.netDeposits || 0) / filteredTotals.total) *
                                100
                              ).toFixed(1)
                            : '0.0'}
                          %
                        </th>
                        {(() => {
                          const componentSum =
                            (filteredTotals.subaffiliate || 0) +
                            (filteredTotals.cpa || 0) +
                            (filteredTotals.cpl || 0) +
                            (filteredTotals.revshare || 0) +
                            (filteredTotals.other || 0)
                          const total = filteredTotals.total || 0
                          const delta = componentSum - total
                          const uiDelta = normalizeDelta(delta, 1)
                          const ok = uiDelta === 0
                          return (
                            <th
                              style={{
                                padding: 12,
                                textAlign: 'center',
                                fontWeight: 900,
                                color: ok ? 'var(--success)' : 'var(--error)',
                              }}
                              title={
                                ok
                                  ? ''
                                  : `Δ components-total: ${formatEuro(uiDelta)} (components ${formatEuro(componentSum)} vs total ${formatEuro(total)})`
                              }
                            >
                              {ok ? '✓' : '✗'}
                            </th>
                          )
                        })()}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {Object.keys(filteredMonths)
                      .sort()
                      .map((month, index) => {
                        const m = filteredMonths[month]
                        const okComponentSum =
                          (m.subaffiliate || 0) +
                          (m.cpa || 0) +
                          (m.cpl || 0) +
                          (m.revshare || 0) +
                          (m.other || 0)
                        const okDelta = okComponentSum - (m.total || 0)
                        const okUiDelta = normalizeDelta(okDelta, 1)
                        const ok = okUiDelta === 0
                        const rowStyle =
                          index % 2 === 0
                            ? { background: 'var(--bg-secondary)' }
                            : { background: 'var(--bg-tertiary)' }
                        return (
                          <tr
                            key={month}
                            style={{
                              ...rowStyle,
                              cursor:
                                m.contributors && m.contributors.length ? 'pointer' : 'default',
                              borderBottom: '1px solid var(--border-primary)',
                              transition: 'background 0.2s ease',
                            }}
                            onClick={() => setExpandedMonth(expandedMonth === month ? null : month)}
                            onMouseEnter={(e) =>
                              (e.target.closest('tr').style.background = 'var(--bg-secondary)')
                            }
                            onMouseLeave={(e) =>
                              (e.target.closest('tr').style.background = rowStyle.background)
                            }
                          >
                            <td
                              style={{ padding: 10, color: 'var(--text-primary)', fontWeight: 700 }}
                            >
                              {monthLabel(month)}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'right',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {formatEuro(m.total || 0)}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'right',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {formatEuro(m.subaffiliate || 0)}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'right',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {formatEuro(m.cpa || 0)}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'right',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {formatEuro(m.cpl || 0)}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'right',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {formatEuro(m.revshare || 0)}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'right',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {formatEuro(m.other || 0)}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'right',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {formatEuro(m.paid || 0)}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'right',
                                color:
                                  (m.total || 0) - (m.paid || 0) >= 0
                                    ? 'var(--success)'
                                    : 'var(--error)',
                                fontWeight: 800,
                              }}
                            >
                              {formatEuro((m.total || 0) - (m.paid || 0))}
                              {m.total - m.paid > 0 ? ' (pending)' : ''}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'right',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {m.total
                                ? (((m.netDeposits || 0) / m.total) * 100).toFixed(1)
                                : '0.0'}
                              %
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: 'center',
                                color: ok ? 'var(--success)' : 'var(--error)',
                              }}
                              title={
                                ok
                                  ? ''
                                  : `Δ components-total: ${formatEuro(okUiDelta)} (components ${formatEuro(okComponentSum)} vs total ${formatEuro(m.total || 0)})`
                              }
                            >
                              {ok ? '✓' : '✗'}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>

              {expandedMonth && filteredMonths[expandedMonth] && (
                <div
                  style={{
                    border: '1px solid var(--border-primary)',
                    borderRadius: 10,
                    padding: 12,
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <h5
                    style={{
                      margin: 0,
                      marginBottom: 12,
                      color: 'var(--text-primary)',
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    Users for {monthLabel(expandedMonth)}{' '}
                    {selectedRec ? `(${selectedRec.name || selectedRec.id})` : '(All Affiliates)'}
                  </h5>
                  <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr
                          style={{
                            textAlign: 'left',
                            borderBottom: '1px solid var(--border-primary)',
                          }}
                        >
                          <th
                            style={{ padding: 8, color: 'var(--text-secondary)', fontWeight: 800 }}
                          >
                            User ID
                          </th>
                          <th
                            style={{ padding: 8, color: 'var(--text-secondary)', fontWeight: 800 }}
                          >
                            Name
                          </th>
                          <th
                            style={{
                              padding: 8,
                              color: 'var(--text-secondary)',
                              textAlign: 'right',
                              fontWeight: 800,
                            }}
                          >
                            Total
                          </th>
                          <th
                            style={{
                              padding: 8,
                              color: 'var(--text-secondary)',
                              textAlign: 'right',
                              fontWeight: 800,
                            }}
                          >
                            CPA
                          </th>
                          <th
                            style={{
                              padding: 8,
                              color: 'var(--text-secondary)',
                              textAlign: 'right',
                              fontWeight: 800,
                            }}
                          >
                            Revshare
                          </th>
                          <th
                            style={{
                              padding: 8,
                              color: 'var(--text-secondary)',
                              textAlign: 'right',
                              fontWeight: 800,
                            }}
                          >
                            CPL
                          </th>
                          <th
                            style={{
                              padding: 8,
                              color: 'var(--text-secondary)',
                              textAlign: 'right',
                              fontWeight: 800,
                            }}
                          >
                            Sub-aff
                          </th>
                          <th
                            style={{
                              padding: 8,
                              color: 'var(--text-secondary)',
                              textAlign: 'right',
                              fontWeight: 800,
                            }}
                          >
                            Other
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMonths[expandedMonth].contributors
                          .sort((a, b) => (b.components?.total || 0) - (a.components?.total || 0))
                          .map((user, idx) => (
                            <tr
                              key={idx}
                              style={{ borderBottom: '1px solid var(--border-primary)' }}
                            >
                              <td
                                style={{
                                  padding: 8,
                                  color: 'var(--text-primary)',
                                  fontWeight: 700,
                                }}
                              >
                                {user.id || '—'}
                              </td>
                              <td style={{ padding: 8, color: 'var(--text-primary)' }}>
                                {user.name || '—'}
                              </td>
                              <td
                                style={{
                                  padding: 8,
                                  textAlign: 'right',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {formatEuro(user.components.total || 0)}
                              </td>
                              <td
                                style={{
                                  padding: 8,
                                  textAlign: 'right',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {formatEuro(user.components.cpa || 0)}
                              </td>
                              <td
                                style={{
                                  padding: 8,
                                  textAlign: 'right',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {formatEuro(user.components.revshare || 0)}
                              </td>
                              <td
                                style={{
                                  padding: 8,
                                  textAlign: 'right',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {formatEuro(user.components.cpl || 0)}
                              </td>
                              <td
                                style={{
                                  padding: 8,
                                  textAlign: 'right',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {formatEuro(user.components.subaffiliate || 0)}
                              </td>
                              <td
                                style={{
                                  padding: 8,
                                  textAlign: 'right',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {formatEuro(user.components.other || 0)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
