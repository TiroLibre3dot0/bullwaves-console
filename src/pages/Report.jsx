import React, { useEffect, useMemo, useState } from 'react'
import { formatEuro, formatNumber, formatNumberShort, formatPercent, cleanNumber } from '../lib/formatters'
import { parseCsv, parseMonthLabel, parseMonthFirstDate } from '../lib/csv'

const formatEuroShort = (value) => `${formatNumberShort(value)} €`
const formatNumberFull = (value) => formatNumber(value)

export default function Report() {
  const [mediaRows, setMediaRows] = useState([])
  const [payments, setPayments] = useState([])
  const [mode, setMode] = useState('global') // global | annual | monthly
  const [selectedMonth, setSelectedMonth] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      try {
        const mediaCandidates = ['/Media Report.csv', '/01012025 to 12072025 Media Report.csv']
        const paymentsCandidates = ['/Payments Report.csv', '/commissions.csv']

        let mediaText = ''
        for (const path of mediaCandidates) {
          const resp = await fetch(path)
          if (resp.ok) {
            mediaText = await resp.text()
            break
          }
        }

        let paymentsText = ''
        for (const path of paymentsCandidates) {
          const resp = await fetch(path)
          if (resp.ok) {
            paymentsText = await resp.text()
            break
          }
        }

        const parsedMedia = mediaText ? parseCsv(mediaText).map((r) => {
          const monthMeta = parseMonthLabel(r.Month)
          return {
            monthKey: monthMeta.key,
            monthIndex: monthMeta.monthIndex,
            monthLabel: monthMeta.label,
            year: monthMeta.year,
            affiliate: (r.Affiliate || '—').toString().trim(),
            registrations: cleanNumber(r.Registrations || r.Leads),
            ftd: cleanNumber(r.FTD),
            pl: cleanNumber(r.PL),
            netDeposits: cleanNumber(r['Net Deposits']),
          }
        }) : []

        const parsedPayments = paymentsText ? parseCsv(paymentsText).map((r) => {
          const date = r.PaymentDate ? parseMonthFirstDate(r.PaymentDate) : r['Commission Date'] ? new Date(r['Commission Date']) : null
          const monthIndex = date && !Number.isNaN(date.getTime()) ? date.getMonth() : -1
          const year = date && !Number.isNaN(date.getTime()) ? date.getFullYear() : null
          const monthKey = date && !Number.isNaN(date.getTime()) ? `${year}-${String(monthIndex).padStart(2, '0')}` : 'unknown'
          return {
            monthIndex,
            monthKey,
            year,
            affiliate: (r.Affiliate || r['Affiliate Id'] || '—').toString().trim(),
            amount: cleanNumber(r['Payment amount'] || r.amount),
          }
        }) : []

        setMediaRows(parsedMedia)
        setPayments(parsedPayments)
      } catch (err) {
        console.error('Failed to load reports', err)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  const availableMonths = useMemo(() => {
    const seen = new Map()
    mediaRows.forEach((r) => {
      if (!r.monthKey || r.monthKey === 'unknown') return
      if (!seen.has(r.monthKey)) {
        seen.set(r.monthKey, r.monthLabel)
      }
    })
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }))
  }, [mediaRows])

  useEffect(() => {
    if (mode === 'monthly' && availableMonths.length && !selectedMonth) {
      setSelectedMonth(availableMonths[0].key)
    }
  }, [mode, availableMonths, selectedMonth])

  const currentYear = new Date().getFullYear()

  const filteredMedia = useMemo(() => mediaRows.filter((r) => {
    if (mode === 'global') return true
    if (mode === 'annual') return r.year === currentYear
    if (mode === 'monthly') return selectedMonth ? r.monthKey === selectedMonth : false
    return true
  }), [mediaRows, mode, currentYear, selectedMonth])

  const filteredPayments = useMemo(() => payments.filter((r) => {
    if (mode === 'global') return true
    if (mode === 'annual') return r.year === currentYear
    if (mode === 'monthly') return selectedMonth ? r.monthKey === selectedMonth : false
    return true
  }), [payments, mode, currentYear, selectedMonth])

  const byAffiliate = useMemo(() => {
    const map = new Map()
    const ensure = (name) => {
      const key = name || '—'
      if (!map.has(key)) {
        map.set(key, {
          affiliate: key,
          registrations: 0,
          ftd: 0,
          pl: 0,
          payments: 0,
          monthTotals: new Map(),
        })
      }
      return map.get(key)
    }

    filteredMedia.forEach((r) => {
      const acc = ensure(r.affiliate)
      acc.registrations += r.registrations || 0
      acc.ftd += r.ftd || 0
      acc.pl += r.pl || 0
      if (r.monthKey) {
        const prev = acc.monthTotals.get(r.monthKey) || { pl: 0, pay: 0, monthKey: r.monthKey, monthIndex: r.monthIndex, year: r.year }
        acc.monthTotals.set(r.monthKey, { ...prev, pl: prev.pl + (r.pl || 0) })
      }
    })

    filteredPayments.forEach((p) => {
      const acc = ensure(p.affiliate)
      if (p.monthKey) {
        const prev = acc.monthTotals.get(p.monthKey) || { pl: 0, pay: 0, monthKey: p.monthKey, monthIndex: p.monthIndex, year: p.year }
        acc.monthTotals.set(p.monthKey, { ...prev, pay: prev.pay + (p.amount || 0) })
      }
      acc.payments += p.amount || 0
    })

    return Array.from(map.values()).map((r) => {
      const cpa = (r.ftd || 0) ? Math.abs(r.payments || 0) / Math.max(r.ftd, 1) : 0
      const arpu = (r.registrations || 0) ? (r.pl || 0) / Math.max(r.registrations, 1) : 0
      const profit = (r.pl || 0) - (r.payments || 0)
      const monthSeq = Array.from(r.monthTotals.values()).sort((a, b) => (a.year || 0) - (b.year || 0) || (a.monthIndex || 0) - (b.monthIndex || 0))
      let breakEvenMonth = null
      let accDiff = 0
      for (let i = 0; i < monthSeq.length; i += 1) {
        accDiff += (monthSeq[i].pl || 0) - (monthSeq[i].pay || 0)
        if (breakEvenMonth === null && accDiff >= 0) breakEvenMonth = i
      }
      const roi = r.payments ? ((profit) / Math.abs(r.payments)) * 100 : 0
      return {
        ...r,
        cpa,
        arpu,
        profit,
        roi,
        breakEvenMonths: breakEvenMonth !== null ? breakEvenMonth + 1 : null,
        breakEvenReached: profit >= 0,
      }
    })
  }, [filteredMedia, filteredPayments])

  const totals = useMemo(() => {
    const sum = (field) => byAffiliate.reduce((acc, r) => acc + (r[field] || 0), 0)
    const registrations = sum('registrations')
    const ftd = sum('ftd')
    const pl = sum('pl')
    const paymentsTotal = sum('payments')
    const cpa = ftd ? Math.abs(paymentsTotal) / Math.max(ftd, 1) : 0
    const arpu = registrations ? pl / Math.max(registrations, 1) : 0
    const profit = pl - paymentsTotal
    const roi = paymentsTotal ? (profit / Math.abs(paymentsTotal)) * 100 : 0
    return { registrations, ftd, pl, paymentsTotal, cpa, arpu, profit, roi }
  }, [byAffiliate])

  const topAffiliates = useMemo(() => {
    return [...byAffiliate]
      .filter((r) => r.ftd > 0 || r.registrations > 0 || r.pl !== 0 || r.payments !== 0)
      .sort((a, b) => b.profit - a.profit || b.pl - a.pl)
      .slice(0, 8)
  }, [byAffiliate])

  const card = {
    background: '#f7f9fc',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 14,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
  }

  const pill = (active) => ({
    padding: '6px 10px',
    borderRadius: 10,
    border: active ? '1px solid #2563eb' : '1px solid #e2e8f0',
    background: active ? 'linear-gradient(135deg, #2563eb, #38bdf8)' : '#ffffff',
    color: active ? '#ffffff' : '#0f172a',
    fontWeight: 700,
    cursor: 'pointer',
  })

  const muted = { color: '#475569' }

  const periodLabel = mode === 'global'
    ? 'Globale'
    : mode === 'annual'
      ? `Annuale ${currentYear}`
      : selectedMonth ? `Mensile ${availableMonths.find((m) => m.key === selectedMonth)?.label || ''}` : 'Mensile'

  return (
    <div style={{ width: '100%', padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <aside style={{ ...card, background: 'linear-gradient(135deg, #f8fbff, #eef2ff)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 0.2, color: '#475569', fontWeight: 700 }}>Report</div>
            <h2 style={{ margin: '4px 0', color: '#0f172a' }}>Periodo rapido</h2>
            <p style={{ ...muted, margin: 0 }}>Base chiara per export. Fonte: Media Report + Payments/Commissions.</p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={pill(mode === 'monthly')} onClick={() => setMode('monthly')}>Mensile</button>
            <button style={pill(mode === 'annual')} onClick={() => setMode('annual')}>Annuale</button>
            <button style={pill(mode === 'global')} onClick={() => setMode('global')}>Globale</button>
          </div>
        </div>
        {mode === 'monthly' && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ ...muted, fontWeight: 700 }}>Mese</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '6px 9px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 700 }}
            >
              {availableMonths.length === 0 && <option value="">Nessun mese</option>}
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
        )}
      </aside>

      <aside style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Periodo</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{periodLabel}</div>
          </div>
          <div style={{ fontSize: 12, color: '#475569', textAlign: 'right' }}>
            {loading ? 'Caricamento...' : `${filteredMedia.length} righe media · ${filteredPayments.length} pagamenti`}
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Fonte: Media Report + Payments/Commissions</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 12 }}>
          <div style={{ ...card, padding: 12, boxShadow: 'none' }}>
            <div style={{ fontSize: 12, ...muted }}>CPA</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0ea5e9' }}>{formatEuro(Math.round(totals.cpa || 0))}</div>
            <div style={{ fontSize: 11, ...muted }}>Payments / FTD</div>
          </div>
          <div style={{ ...card, padding: 12, boxShadow: 'none' }}>
            <div style={{ fontSize: 12, ...muted }}>ARPU</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{formatEuro(Math.round(totals.arpu || 0))}</div>
            <div style={{ fontSize: 11, ...muted }}>PL / registrations</div>
          </div>
          <div style={{ ...card, padding: 12, boxShadow: 'none' }}>
            <div style={{ fontSize: 12, ...muted }}>Profit</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: totals.profit >= 0 ? '#0f172a' : '#dc2626' }}>{formatEuroShort(totals.profit)}</div>
            <div style={{ fontSize: 11, ...muted }}>PL - payments</div>
          </div>
          <div style={{ ...card, padding: 12, boxShadow: 'none' }}>
            <div style={{ fontSize: 12, ...muted }}>ROI</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: totals.roi >= 0 ? '#0f172a' : '#dc2626' }}>{`${(totals.roi || 0).toFixed(1)}%`}</div>
            <div style={{ fontSize: 11, ...muted }}>Profit / payments</div>
          </div>
          <div style={{ ...card, padding: 12, boxShadow: 'none' }}>
            <div style={{ fontSize: 12, ...muted }}>Volume</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{formatter.format(totals.registrations)} reg · {formatter.format(totals.ftd)} FTD</div>
            <div style={{ fontSize: 11, ...muted }}>Registrazioni e FTD</div>
          </div>
        </div>
      </aside>

      <aside style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Top affiliati (8)</h3>
          <span style={{ fontSize: 12, ...muted }}>Ordine per profitto · Fonte media+payments</span>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="table" style={{ minWidth: 720, color: '#0f172a' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', color: '#475569', background: '#eef2ff' }}>Affiliate</th>
                <th style={{ textAlign: 'right', color: '#475569', background: '#eef2ff' }}>Reg</th>
                <th style={{ textAlign: 'right', color: '#475569', background: '#eef2ff' }}>FTD</th>
                <th style={{ textAlign: 'right', color: '#475569', background: '#eef2ff' }}>CPA</th>
                <th style={{ textAlign: 'right', color: '#475569', background: '#eef2ff' }}>ARPU</th>
                <th style={{ textAlign: 'right', color: '#475569', background: '#eef2ff' }}>ROI</th>
                <th style={{ textAlign: 'right', color: '#475569', background: '#eef2ff' }}>Profit</th>
                <th style={{ textAlign: 'right', color: '#475569', background: '#eef2ff' }}>Break-even</th>
              </tr>
            </thead>
            <tbody>
              {topAffiliates.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 12, color: '#94a3b8' }}>Nessun dato nel periodo selezionato</td>
                </tr>
              )}
              {topAffiliates.map((r) => (
                <tr key={`row-${r.affiliate}`} style={{ background: '#ffffff' }}>
                  <td style={{ fontWeight: 700 }}>{r.affiliate}</td>
                  <td style={{ textAlign: 'right' }}>{formatter.format(r.registrations || 0)}</td>
                  <td style={{ textAlign: 'right' }}>{formatter.format(r.ftd || 0)}</td>
                  <td style={{ textAlign: 'right', color: '#0ea5e9' }}>{formatEuro(Math.round(r.cpa || 0))}</td>
                  <td style={{ textAlign: 'right', color: '#10b981' }}>{formatEuro(Math.round(r.arpu || 0))}</td>
                  <td style={{ textAlign: 'right', color: r.roi >= 0 ? '#0f172a' : '#dc2626' }}>{`${(r.roi || 0).toFixed(1)}%`}</td>
                  <td style={{ textAlign: 'right', color: r.profit >= 0 ? '#0f172a' : '#dc2626' }}>{formatEuroShort(r.profit)}</td>
                  <td style={{ textAlign: 'right', color: '#2563eb' }}>{r.breakEvenMonths !== null ? `${r.breakEvenMonths} mesi` : 'n/d'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>

      <aside style={{ ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Note per export</h3>
          <span style={{ fontSize: 12, ...muted }}>Base layout pronta per aggiungere pulsante export</span>
        </div>
        <ul style={{ marginTop: 8, paddingLeft: 18, color: '#0f172a', lineHeight: 1.5 }}>
          <li>Layout chiaro e tabella già ordinata per profitto.</li>
          <li>Filtro periodo: globale (tutti i dati), annuale (anno corrente), mensile (mese selezionato).</li>
          <li>Metriche chiave: CPA, ARPU, profit, volume (reg/FTD), break-even stimato.</li>
          <li>Pronto a collegare un bottone di export (PDF/CSV) senza stravolgere il layout.</li>
        </ul>
      </aside>
    </div>
  )
}
