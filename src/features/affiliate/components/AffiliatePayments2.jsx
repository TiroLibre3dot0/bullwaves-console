import React, { useState, useMemo, useCallback } from 'react';
import useAffiliatePayments from '../hooks/useAffiliatePayments';
import { formatEuro } from '../../../lib/formatters';

const card = { background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 12, padding: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', margin: 12 };

function monthLabel(m) {
  const parts = (m || '').split('-');
  if (parts.length < 2) return m;
  const idx = Number(parts[1]) - 1;
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[idx] || m} ${parts[0]}`;
}

export default function AffiliatePayments2() {
  const { loading, error, map, reload, getAffiliate } = useAffiliatePayments();
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  
  const affiliates = useMemo(() => {
    if (!map) return [];
    return Object.values(map).sort((a, b) => (b.totals?.total || 0) - (a.totals?.total || 0));
  }, [map]);

  const selectedRec = useMemo(() => {
    if (!selected) return null;
    return map && map[selected];
  }, [map, selected]);

  const availableYears = useMemo(() => {
    if (!map) return [];
    if (selectedRec) {
      const years = new Set();
      Object.keys(selectedRec.months).forEach(month => {
        const year = month.split('-')[0];
        if (year && year !== 'unknown') years.add(year);
      });
      return Array.from(years).sort().reverse();
    } else {
      // For all affiliates
      const years = new Set();
      Object.values(map).forEach(aff => {
        Object.keys(aff.months).forEach(month => {
          const year = month.split('-')[0];
          if (year && year !== 'unknown') years.add(year);
        });
      });
      return Array.from(years).sort().reverse();
    }
  }, [selectedRec, map]);

  const availableMonths = useMemo(() => {
    if (!map) return [];
    if (selectedRec) {
      const months = new Set();
      Object.keys(selectedRec.months).forEach(month => {
        const [year, mon] = month.split('-');
        if (mon && (!filterYear || year === filterYear)) months.add(mon);
      });
      return Array.from(months).sort();
    } else {
      const months = new Set();
      Object.values(map).forEach(aff => {
        Object.keys(aff.months).forEach(month => {
          const [year, mon] = month.split('-');
          if (mon && (!filterYear || year === filterYear)) months.add(mon);
        });
      });
      return Array.from(months).sort();
    }
  }, [selectedRec, map, filterYear]);

  const aggregatedMonths = useMemo(() => {
    if (!map || selectedRec) return {};
    // Aggrega i mesi di tutti gli affiliati
    const monthMap = {};
    Object.values(map).forEach(aff => {
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
            contributors: []
          };
        }
        monthMap[monthKey].total += monthData.total || 0;
        monthMap[monthKey].subaffiliate += monthData.subaffiliate || 0;
        monthMap[monthKey].cpa += monthData.cpa || 0;
        monthMap[monthKey].cpl += monthData.cpl || 0;
        monthMap[monthKey].revshare += monthData.revshare || 0;
        monthMap[monthKey].other += monthData.other || 0;
        monthMap[monthKey].paid += monthData.paid || 0;
        monthMap[monthKey].netDeposits += monthData.netDeposits || 0;
        // Aggrega contributors da tutti gli affiliati per questo mese
        monthMap[monthKey].contributors.push(...(monthData.contributors || []));
      });
    });
    return monthMap;
  }, [map, selectedRec]);

  const filteredMonths = useMemo(() => {
    if (selectedRec) {
      const filtered = {};
      Object.entries(selectedRec.months).forEach(([monthKey, data]) => {
        const [year, mon] = monthKey.split('-');
        if ((!filterYear || year === filterYear) && (!filterMonth || mon === filterMonth)) {
          filtered[monthKey] = data;
        }
      });
      return filtered;
    } else {
      // For all affiliates, filter aggregatedMonths
      const filtered = {};
      Object.entries(aggregatedMonths).forEach(([monthKey, data]) => {
        const [year, mon] = monthKey.split('-');
        if ((!filterYear || year === filterYear) && (!filterMonth || mon === filterMonth)) {
          filtered[monthKey] = data;
        }
      });
      return filtered;
    }
  }, [selectedRec, aggregatedMonths, filterYear, filterMonth]);

  const aggregatedTotals = useMemo(() => {
    if (!map) return { total: 0, subaffiliate: 0, cpa: 0, cpl: 0, revshare: 0, other: 0, paid: 0, netDeposits: 0 };
    if (selectedRec) {
      // Aggregati per l'affiliato selezionato
      const totals = { total: 0, subaffiliate: 0, cpa: 0, cpl: 0, revshare: 0, other: 0, paid: 0, netDeposits: 0 };
      Object.values(selectedRec.months).forEach(month => {
        totals.total += month.total || 0;
        totals.subaffiliate += month.subaffiliate || 0;
        totals.cpa += month.cpa || 0;
        totals.cpl += month.cpl || 0;
        totals.revshare += month.revshare || 0;
        totals.other += month.other || 0;
        totals.netDeposits += month.netDeposits || 0;
      });
      return totals;
    } else {
      // Aggregati per tutti gli affiliati
      const totals = { total: 0, subaffiliate: 0, cpa: 0, cpl: 0, revshare: 0, other: 0, paid: 0, netDeposits: 0 };
      Object.values(map).forEach(aff => {
        if (aff.totals) {
          totals.total += aff.totals.total || 0;
          totals.subaffiliate += aff.totals.subaffiliate || 0;
          totals.cpa += aff.totals.cpa || 0;
          totals.cpl += aff.totals.cpl || 0;
          totals.revshare += aff.totals.revshare || 0;
          totals.other += aff.totals.other || 0;
          totals.netDeposits += aff.totals.netDeposits || 0;
          totals.paid += aff.totals.paid || 0;
        }
      });
      return totals;
    }
  }, [map, selectedRec]);

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 24, fontWeight: 600 }}>Affiliate Payments 2.0</h3>
        <div style={{ marginLeft: 'auto' }}>
          <button 
            onClick={reload} 
            disabled={loading} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: 6, 
              border: 'none', 
              background: loading ? '#64748b' : '#3b82f6', 
              color: 'white', 
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            {loading ? 'Loading...' : 'Reload'}
          </button>
        </div>
      </div>
      {error && <div style={{ color: '#ef4444', background: '#fef2f2', padding: 8, borderRadius: 6, marginBottom: 12 }}>Error: {String(error)}</div>}

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 200px)' }}>
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 14, color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: 6 }}>Affiliate</label>
            <select 
              style={{ 
                width: '100%', 
                padding: 10, 
                borderRadius: 8, 
                border: '1px solid #475569', 
                background: '#0f172a', 
                color: '#f1f5f9',
                fontSize: 14
              }} 
              value={selected || ''} 
              onChange={e => {
                setSelected(e.target.value || null);
                setExpandedMonth(null);
                setFilterYear('');
                setFilterMonth('');
              }}
            >
              <option value='' style={{ background: '#0f172a', color: '#f1f5f9' }}>— All affiliates —</option>
              {affiliates.map(a => (
                <option key={a.id} value={a.id} style={{ background: '#0f172a', color: '#f1f5f9' }}>{a.name || a.id} — {Number(a.totals?.total||0).toFixed(2)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 14, color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: 6 }}>Year</label>
            <select 
              style={{ 
                width: '100%', 
                padding: 10, 
                borderRadius: 8, 
                border: '1px solid #475569', 
                background: '#0f172a', 
                color: '#f1f5f9',
                fontSize: 14
              }} 
              value={filterYear} 
              onChange={e => {
                setFilterYear(e.target.value);
                setFilterMonth('');
                setExpandedMonth(null);
              }}
            >
              <option value='' style={{ background: '#0f172a', color: '#f1f5f9' }}>— All years —</option>
              {availableYears.map(year => (
                <option key={year} value={year} style={{ background: '#0f172a', color: '#f1f5f9' }}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 14, color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: 6 }}>Month</label>
            <select 
              style={{ 
                width: '100%', 
                padding: 10, 
                borderRadius: 8, 
                border: '1px solid #475569', 
                background: '#0f172a', 
                color: '#f1f5f9',
                fontSize: 14
              }} 
              value={filterMonth} 
              onChange={e => {
                setFilterMonth(e.target.value);
                setExpandedMonth(null);
              }}
              disabled={!filterYear && availableMonths.length === 0}
            >
              <option value='' style={{ background: '#0f172a', color: '#f1f5f9' }}>— All months —</option>
              {availableMonths.map(mon => {
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return (
                  <option key={mon} value={mon} style={{ background: '#0f172a', color: '#f1f5f9' }}>
                    {monthNames[Number(mon) - 1]} ({mon})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h4 style={{ marginTop: 0, marginBottom: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 500 }}>
            {selectedRec ? `Aggregated for ${selectedRec.name || selectedRec.id}` : 'Overall Aggregated Totals'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 12, borderRadius: 8, border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Total {selectedRec ? 'Commissions' : 'Earned'}</span>
              </div>
              <div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{formatEuro(aggregatedTotals.total)}</div>
            </div>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 12, borderRadius: 8, border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Paid</span>
                </div>
                <div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{formatEuro(aggregatedTotals.paid)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 12, borderRadius: 8, border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Difference{(aggregatedTotals.total - aggregatedTotals.paid) > 0 ? ' (pending)' : ''}</span>
                </div>
                <div style={{ fontSize: 18, color: (aggregatedTotals.total - aggregatedTotals.paid) >= 0 ? '#10b981' : '#dc2626', fontWeight: 700 }}>
                  {formatEuro(aggregatedTotals.total - aggregatedTotals.paid)}
                </div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 12, borderRadius: 8, border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Sub-aff</span>
                </div>
                <div style={{ fontSize: 16, color: '#f1f5f9' }}>{formatEuro(aggregatedTotals.subaffiliate)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 12, borderRadius: 8, border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>CPA</span>
                </div>
                <div style={{ fontSize: 16, color: '#f1f5f9' }}>{formatEuro(aggregatedTotals.cpa)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 12, borderRadius: 8, border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>CPL</span>
                </div>
                <div style={{ fontSize: 16, color: '#f1f5f9' }}>{formatEuro(aggregatedTotals.cpl)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 12, borderRadius: 8, border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Revshare</span>
                </div>
                <div style={{ fontSize: 16, color: '#f1f5f9' }}>{formatEuro(aggregatedTotals.revshare)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 12, borderRadius: 8, border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Other</span>
                </div>
                <div style={{ fontSize: 16, color: '#f1f5f9' }}>{formatEuro(aggregatedTotals.other)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 12, borderRadius: 8, border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>ROI %</span>
                </div>
                <div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>{aggregatedTotals.total ? ((aggregatedTotals.netDeposits || 0) / aggregatedTotals.total * 100).toFixed(1) : '0.0'}%</div>
              </div>
            </div>

          <h4 style={{ marginTop: 0, marginBottom: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 500 }}>
            {selectedRec ? 'Monthly breakdown' : 'Overall Monthly Breakdown'}
          </h4>
          {!map && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#64748b' }}>
              <div style={{
                width: 24,
                height: 24,
                border: '3px solid #334155',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{ marginLeft: 12 }}>Loading payments data…</span>
            </div>
          )}
          {map && Object.keys(filteredMonths).length === 0 && (
            <div style={{ color: '#64748b' }}>No data available.</div>
          )}
          {map && Object.keys(filteredMonths).length > 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ maxHeight: '60vh', overflow: 'auto', border: '1px solid #334155', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #334155' }}>
                      <th style={{ padding: 12, color: '#cbd5e1', fontWeight: 600 }}>Month</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Total</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Sub-aff</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>CPA</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>CPL</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Revshare</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Other</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Paid</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Difference</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>ROI %</th>
                      <th style={{ padding: 12, color: '#cbd5e1', textAlign: 'center', fontWeight: 600 }} title="Verifica di coerenza: ✓ se la somma delle componenti corrisponde al totale, ✗ se c'è discrepanza">OK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(filteredMonths).sort().map((month, index) => {
                      const m = filteredMonths[month];
                      const rowStyle = index % 2 === 0 ? { background: '#1e293b' } : { background: '#0f172a' };
                      return (
                        <tr 
                          key={month} 
                          style={{ 
                            ...rowStyle, 
                            cursor: m.contributors && m.contributors.length ? 'pointer' : 'default', 
                            borderBottom: '1px solid #334155',
                            transition: 'background 0.2s ease'
                          }} 
                          onClick={() => setExpandedMonth(expandedMonth === month ? null : month)}
                          onMouseEnter={(e) => e.target.closest('tr').style.background = '#1e293b'}
                          onMouseLeave={(e) => e.target.closest('tr').style.background = rowStyle.background}
                        >
                          <td style={{ padding: 10, color: '#f1f5f9' }}>{monthLabel(month)}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(m.total||0)}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(m.subaffiliate||0)}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(m.cpa||0)}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(m.cpl||0)}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(m.revshare||0)}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(m.other||0)}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(m.paid||0)}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: (m.total||0) - (m.paid||0) >= 0 ? '#10b981' : '#dc2626' }}>{formatEuro((m.total||0) - (m.paid||0))}{(m.total - m.paid) > 0 ? ' (pending)' : ''}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: '#f1f5f9' }}>{m.total ? ((m.netDeposits || 0) / m.total * 100).toFixed(1) : '0.0'}%</td>
                          <td style={{ padding: 10, textAlign: 'center', color: Math.abs((m.subaffiliate||0) + (m.cpa||0) + (m.cpl||0) + (m.revshare||0) + (m.other||0) - (m.total||0)) < 0.01 ? '#10b981' : '#ef4444' }}>
                            {Math.abs((m.subaffiliate||0) + (m.cpa||0) + (m.cpl||0) + (m.revshare||0) + (m.other||0) - (m.total||0)) < 0.01 ? '✓' : '✗'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {expandedMonth && filteredMonths[expandedMonth] && (
                <div style={{ border: '1px solid #334155', borderRadius: 8, padding: 12, background: '#0f172a' }}>
                  <h5 style={{ margin: 0, marginBottom: 12, color: '#f1f5f9', fontSize: 16 }}>
                    Users for {monthLabel(expandedMonth)} {selectedRec ? `(${selectedRec.name || selectedRec.id})` : '(All Affiliates)'}
                  </h5>
                  <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #334155' }}>
                          <th style={{ padding: 8, color: '#cbd5e1', fontWeight: 600 }}>User ID</th>
                          <th style={{ padding: 8, color: '#cbd5e1', fontWeight: 600 }}>Name</th>
                          <th style={{ padding: 8, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Total</th>
                          <th style={{ padding: 8, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>CPA</th>
                          <th style={{ padding: 8, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Revshare</th>
                          <th style={{ padding: 8, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>CPL</th>
                          <th style={{ padding: 8, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Sub-aff</th>
                          <th style={{ padding: 8, color: '#cbd5e1', textAlign: 'right', fontWeight: 600 }}>Other</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMonths[expandedMonth].contributors
                          .sort((a, b) => (b.components?.total || 0) - (a.components?.total || 0))
                          .map((user, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: 8, color: '#f1f5f9' }}>{user.id || '—'}</td>
                            <td style={{ padding: 8, color: '#f1f5f9' }}>{user.name || '—'}</td>
                            <td style={{ padding: 8, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(user.components.total||0)}</td>
                            <td style={{ padding: 8, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(user.components.cpa||0)}</td>
                            <td style={{ padding: 8, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(user.components.revshare||0)}</td>
                            <td style={{ padding: 8, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(user.components.cpl||0)}</td>
                            <td style={{ padding: 8, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(user.components.subaffiliate||0)}</td>
                            <td style={{ padding: 8, textAlign: 'right', color: '#f1f5f9' }}>{formatEuro(user.components.other||0)}</td>
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
  );
}
