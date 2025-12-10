import React, { useEffect, useMemo, useState } from 'react';
import BreakEvenChart from './BreakEvenChart';
import CardSection from './common/CardSection';
import FilterBar from './common/FilterBar';
import PeriodSelector from './common/PeriodSelector';
import { formatEuro, formatEuroFull, formatNumber, formatNumberShort, formatPercent, cleanNumber, cleanPercent, normalizeKey } from '../lib/formatters';
import { monthMetaFromDate, parseCsv, parseMonthFirstDate, parseMonthLabel } from '../lib/csv';

const formatNumberFull = (value) => formatNumber(value);
const formatPercentDisplay = (value) => formatPercent(value, 2);
const selectStyle = { minWidth: 160, background: '#0d1a2c', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' };

export default function GlobalDashboard() {
  const [mediaRows, setMediaRows] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState('all');
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const loading = loadingMedia || loadingPayments;

  useEffect(() => {
    async function loadMedia() {
      try {
        const candidates = ['/Media Report.csv', '/01012025 to 12072025 Media Report.csv'];
        let text = '';
        for (const path of candidates) {
          const resp = await fetch(path);
          if (resp.ok) {
            text = await resp.text();
            break;
          }
        }
        if (!text) return;
        const parsed = parseCsv(text).map((r) => {
          const monthMeta = parseMonthLabel(r.Month);
          return {
            raw: r,
            monthKey: monthMeta.key,
            monthLabel: monthMeta.label,
            monthIndex: monthMeta.monthIndex,
            year: monthMeta.year,
            affiliate: r.Affiliate || '—',
            uid: (r.uid ?? '').toString().trim(),
            impressions: cleanNumber(r.Impressions),
            uniqueImpressions: cleanNumber(r['Unique Impressions']),
            ctr: cleanPercent(r.CTR),
            uniqueVisitors: cleanNumber(r['Unique Visitors']),
            visitors: cleanNumber(r.Visitors),
            leads: cleanNumber(r.Leads),
            registrations: cleanNumber(r.Registrations),
            conversionRate: cleanPercent(r['Conversion Rate']),
            ftd: cleanNumber(r.FTD),
            qftd: cleanNumber(r.QFTD),
            deposits: cleanNumber(r.Deposits),
            withdrawals: cleanNumber(r.Withdrawals),
            netDeposits: cleanNumber(r['Net Deposits']),
            firstDeposits: cleanNumber(r['First Deposits']),
            spread: cleanNumber(r.Spread),
            lot: cleanNumber(r.LOT),
            volume: cleanNumber(r.Volume),
            pl: cleanNumber(r.PL),
            roi: cleanNumber(r.ROI),
            commission: cleanNumber(r.Commission),
            cpaCommission: cleanNumber(r['CPA Commission']),
            cplCommission: cleanNumber(r['CPL Commission']),
            revShareCommission: cleanNumber(r['RevShare Commission']),
            subCommission: cleanNumber(r['Sub Commission']),
            otherCommission: cleanNumber(r['Other Commission']),
          };
        });
        setMediaRows(parsed);
      return (
        <div className="w-full space-y-4">
          <CardSection
            title="Global view"
            subtitle="Media Report + Payments Report per panorama unico"
            actions={(
              <FilterBar>
                <PeriodSelector
                  availableYears={periodOptions.availableYears}
                  availableMonths={periodOptions.availableMonths}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  onYearChange={(value) => {
                    setSelectedYear(value)
                    if (value === 'all') setSelectedMonth('all')
                  }}
                  onMonthChange={(value) => setSelectedMonth(value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Affiliate</span>
                  <select
                    value={selectedAffiliate}
                    onChange={(e) => setSelectedAffiliate(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="all">All affiliates</option>
                    {affiliateOptions.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </FilterBar>
            )}
          >
          };
        });
        setPayments(parsed);
      } catch (err) {
        console.error('Failed to load payments report', err);
      } finally {
        setLoadingPayments(false);
      }
    }
    loadPayments();
  }, []);

  const periodOptions = useMemo(() => {
    const yearMap = new Map(); // year -> Set of {monthIndex, monthLabel}
    const add = (year, monthIndex, monthLabel) => {
      if (year === undefined || year === null || Number.isNaN(Number(year))) return;
      if (!yearMap.has(year)) yearMap.set(year, new Map());
      const mm = yearMap.get(year);
      const label = monthLabel || `Month ${monthIndex + 1}`;
      mm.set(monthIndex, label);
    };
    mediaRows.forEach((r) => add(r.year, r.monthIndex, r.monthLabel));
    payments.forEach((p) => add(p.year, p.monthIndex, p.monthLabel));

    const availableYears = Array.from(yearMap.keys()).sort((a, b) => a - b);
    const availableMonths = {};
    availableYears.forEach((y) => {
      availableMonths[y] = Array.from(yearMap.get(y).entries())
        .map(([idx, label]) => ({ value: idx, label }))
        .sort((a, b) => a.value - b.value);
    });
    return { availableYears, availableMonths };
  }, [mediaRows, payments]);

  const affiliateOptions = useMemo(() => {
    const set = new Set();
    mediaRows.forEach((r) => set.add(r.affiliate));
    payments.forEach((p) => set.add(p.affiliate));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [mediaRows, payments]);

  const selectedAffiliateKey = normalizeKey(selectedAffiliate);

  const matchesPeriod = (row) => {
    const yearOk = selectedYear === 'all' ? true : row.year === Number(selectedYear);
    const monthOk = selectedMonth === 'all' ? true : row.monthIndex === Number(selectedMonth);
    return yearOk && monthOk;
  };

  const filteredMedia = useMemo(() => mediaRows.filter((r) => {
    const matchPeriod = matchesPeriod(r);
    const matchAff = selectedAffiliate === 'all' ? true : normalizeKey(r.affiliate) === selectedAffiliateKey;
    return matchPeriod && matchAff;
  }), [mediaRows, selectedAffiliate, selectedAffiliateKey, selectedMonth, selectedYear]);

  const filteredPayments = useMemo(() => payments.filter((p) => {
    const matchPeriod = matchesPeriod(p);
    const matchAff = selectedAffiliate === 'all' ? true : normalizeKey(p.affiliate) === selectedAffiliateKey;
    return matchPeriod && matchAff;
  }), [payments, selectedAffiliate, selectedAffiliateKey, selectedMonth, selectedYear]);

  const totals = useMemo(() => {
    const sum = (field) => filteredMedia.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
    const visitors = sum('visitors');
    const registrations = sum('registrations');
    const ftd = sum('ftd');
    const qftd = sum('qftd');
    const deposits = sum('deposits');
    const withdrawals = sum('withdrawals');
    const paymentsTotal = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const roiValues = filteredMedia.map((r) => r.roi).filter((v) => !Number.isNaN(v));
    const roiAvg = roiValues.length ? roiValues.reduce((a, b) => a + b, 0) / roiValues.length : 0;
    const conversion = visitors > 0 ? (registrations / visitors) * 100 : 0;
    const pl = sum('pl');
    const profit = pl - paymentsTotal;

    return {
      impressions: sum('impressions'),
      uniqueImpressions: sum('uniqueImpressions'),
      ctrAvg: filteredMedia.length ? (filteredMedia.reduce((acc, r) => acc + (r.ctr || 0), 0) / filteredMedia.length) : 0,
      visitors,
      uniqueVisitors: sum('uniqueVisitors'),
      leads: sum('leads'),
      registrations,
      ftd,
      qftd,
      deposits,
      withdrawals,
      netDeposits: sum('netDeposits'),
      pl,
      paymentsTotal,
      profit,
      conversion,
      roiAvg,
    };
  }, [filteredMedia, filteredPayments]);
  const perMonth = useMemo(() => {
    const map = new Map();
    const ensureMonth = (year, monthIndex, label) => {
      const key = `${year || 'unknown'}-${monthIndex}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          year,
          monthIndex,
          monthLabel: label || `Month ${monthIndex + 1}`,
          visitors: 0,
          registrations: 0,
          ftd: 0,
          netDeposits: 0,
          pl: 0,
          payments: 0,
          roiSum: 0,
          roiCount: 0,
        });
      }
      return map.get(key);
    };

    filteredMedia.forEach((r) => {
      const acc = ensureMonth(r.year, r.monthIndex, r.monthLabel);
      acc.visitors += r.visitors || 0;
      acc.registrations += r.registrations || 0;
      acc.ftd += r.ftd || 0;
      acc.netDeposits += r.netDeposits || 0;
      acc.pl += r.pl || 0;
      if (!Number.isNaN(r.roi)) {
        acc.roiSum += r.roi;
        acc.roiCount += 1;
      }
    });

    filteredPayments.forEach((p) => {
      const acc = ensureMonth(p.year, p.monthIndex, p.monthLabel);
      acc.payments += p.amount || 0;
    });

    return Array.from(map.values())
      .sort((a, b) => (a.year - b.year) || (a.monthIndex - b.monthIndex))
      .map((r) => ({
        ...r,
        conversion: r.visitors > 0 ? (r.registrations / r.visitors) * 100 : 0,
        roi: r.roiCount ? r.roiSum / r.roiCount : 0,
        profit: (r.pl || 0) - (r.payments || 0),
      }));
  }, [filteredMedia, filteredPayments]);

  const [showAllAffiliates, setShowAllAffiliates] = useState(false);

  const affiliateLeaderboard = useMemo(() => {
    const map = new Map();
    const ensureAff = (name) => {
      if (!map.has(name)) {
        map.set(name, {
          affiliate: name,
          netDeposits: 0,
          pl: 0,
          payments: 0,
          profit: 0,
        });
      }
      return map.get(name);
    };

    filteredMedia.forEach((r) => {
      const acc = ensureAff(r.affiliate);
      acc.netDeposits += r.netDeposits || 0;
      acc.pl += r.pl || 0;
    });

    filteredPayments.forEach((p) => {
      const acc = ensureAff(p.affiliate);
      acc.payments += p.amount || 0;
    });

    const all = Array.from(map.values())
      .map((r) => ({
        ...r,
        profit: (r.pl || 0) - (r.payments || 0),
      }))
      .sort((a, b) => (b.netDeposits || 0) - (a.netDeposits || 0));

    const top10 = all.slice(0, 10);
    const mid5 = all.slice(10, 15);
    const rest = all.slice(15);
    const othersAgg = rest.length
      ? rest.reduce(
          (acc, r) => ({
            affiliate: 'Others',
            count: acc.count + 1,
            netDeposits: acc.netDeposits + (r.netDeposits || 0),
            pl: acc.pl + (r.pl || 0),
            payments: acc.payments + (r.payments || 0),
            profit: acc.profit + (r.profit || 0),
          }),
          { affiliate: 'Others', count: 0, netDeposits: 0, pl: 0, payments: 0, profit: 0 }
        )
      : null;

    return { all, top10, mid5, othersAgg };
  }, [filteredMedia, filteredPayments]);

  const breakEven = useMemo(() => {
    const months = perMonth.filter((m) => m.monthIndex >= 0);
    const labels = months.map((m) => m.monthLabel);
    const cumulative = [];
    let sum = 0;
    months.forEach((m) => {
      sum += (m.pl || 0) - (m.payments || 0);
      cumulative.push(sum);
    });
    const firstActive = cumulative.findIndex((v, idx) => idx === 0 || months[idx].pl || months[idx].payments);
    const beIndex = cumulative.findIndex((v, idx) => idx >= (firstActive >= 0 ? firstActive : 0) && v >= 0);
    return { labels, curve: cumulative, breakEvenIndex: beIndex };
  }, [perMonth]);

  const perMonthTotals = useMemo(() => {
    const base = {
      visitors: 0,
      registrations: 0,
      ftd: 0,
      netDeposits: 0,
      pl: 0,
      payments: 0,
      roiSum: 0,
      roiCount: 0,
      conversions: 0,
    };
    perMonth.forEach((m) => {
      base.visitors += m.visitors || 0;
      base.registrations += m.registrations || 0;
      base.ftd += m.ftd || 0;
      base.netDeposits += m.netDeposits || 0;
      base.pl += m.pl || 0;
      base.payments += m.payments || 0;
      base.roiSum += (m.roi || 0) * (m.roiCount || 1);
      base.roiCount += m.roiCount || 0;
    });
    const conversion = base.visitors > 0 ? (base.registrations / base.visitors) * 100 : 0;
    const roi = base.roiCount ? base.roiSum / base.roiCount : 0;
    const profit = (base.pl || 0) - (base.payments || 0);
    return { ...base, conversion, roi, profit };
  }, [perMonth]);

  const acquisitionSteps = useMemo(() => {
    const steps = [
      { key: 'uniqueVisitors', label: 'Unique visitors', value: totals.uniqueVisitors || totals.visitors, note: 'Top of funnel' },
      { key: 'registrations', label: 'Registrations / Leads', value: totals.registrations || totals.leads, note: `${formatPercentDisplay(totals.conversion)} CVR` },
      { key: 'ftd', label: 'FTD', value: totals.ftd, note: totals.visitors ? `${formatPercentDisplay((totals.ftd / Math.max(totals.visitors, 1)) * 100)} of visitors` : 'FTD' },
      { key: 'qftd', label: 'QFTD', value: totals.qftd, note: totals.ftd ? `${formatPercentDisplay((totals.qftd / Math.max(totals.ftd, 1)) * 100)} of FTD` : 'Qualified' },
      { key: 'payments', label: 'Payments (payout)', value: totals.paymentsTotal, note: totals.ftd ? `${formatEuroFull(totals.paymentsTotal / Math.max(totals.ftd, 1))} per FTD` : 'Payouts' },
    ];
    const max = Math.max(...steps.map((s) => s.value || 0), 1);
    return steps.map((s, idx) => ({ ...s, width: ((s.value || 0) / max) * 100, color: ['#38bdf8', '#a855f7', '#22d3ee', '#f97316', '#fbbf24'][idx % 5] }));
  }, [totals]);

  const moneySteps = useMemo(() => {
    const steps = [
      { key: 'deposits', label: 'Deposits', value: totals.deposits, note: 'Gross inflow' },
      { key: 'withdrawals', label: 'Withdrawals', value: totals.withdrawals, note: 'Cash out' },
      { key: 'netDeposits', label: 'Net deposits', value: totals.netDeposits, note: 'Deposits - Withdrawals' },
      { key: 'pl', label: 'PL', value: totals.pl, note: 'P&L (trading)' },
    ];
    const max = Math.max(...steps.map((s) => Math.abs(s.value || 0)), 1);
    return steps.map((s, idx) => ({ ...s, width: (Math.abs(s.value || 0) / max) * 100, color: ['#10b981', '#f59e0b', '#22d3ee', '#a855f7'][idx % 4] }));
  }, [totals]);

  const insights = useMemo(() => {
    const list = [];
    if (totals.conversion) list.push(`Conversion: ${formatPercentDisplay(totals.conversion)} from visitors to reg.`);
    if (totals.ftd && totals.registrations) {
      list.push(`FTD rate: ${formatPercentDisplay((totals.ftd / Math.max(totals.registrations, 1)) * 100)} from reg to FTD.`);
    }
    if (totals.qftd && totals.ftd) list.push(`QFTD quality: ${formatPercentDisplay((totals.qftd / Math.max(totals.ftd, 1)) * 100)} of FTD are qualified.`);
    if (totals.paymentsTotal && totals.ftd) list.push(`Payout per FTD: ${formatEuroFull(totals.paymentsTotal / Math.max(totals.ftd, 1))}.`);
    if (Number.isFinite(totals.profit)) list.push(`Profit: ${formatEuroFull(totals.profit)} (P&L - payments).`);
    return list;
  }, [totals]);

  const badgeStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 12,
    color: '#cbd5e1',
  };

  const showInsights = false;
  const showPerMonthTable = false;

  return (
    <div className="w-full space-y-3">
      <CardSection
        title="Global view"
        subtitle="Media Report + Payments Report per panorama unico"
        actions={(
          <FilterBar>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Mese</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={selectStyle}
              >
                <option value="all">Tutti</option>
                {monthOptions.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Affiliate</span>
              <select
                value={selectedAffiliate}
                onChange={(e) => setSelectedAffiliate(e.target.value)}
                style={{ ...selectStyle, minWidth: 200 }}
              >
                <option value="all">Tutti</option>
                {affiliateOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <button className="btn secondary" style={{ padding: '8px 12px', fontSize: 12 }} onClick={() => { setSelectedAffiliate('all'); setSelectedMonth('all'); }}>
              Reset filtri
            </button>
          </FilterBar>
        )}
      />

      <div className="grid-global" style={{ alignItems: 'start', gap: 12 }}>
        <div className="card card-global" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(168,85,247,0.10))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Acquisition funnel</h3>
            <span style={badgeStyle}>Visitors → Reg → FTD → QFTD</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {acquisitionSteps.map((s) => (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: s.color, display: 'inline-block' }} />
                    <strong style={{ fontSize: 13 }}>{s.label}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
                    <span title={formatNumberFull(s.value)}>{formatNumberShort(s.value)}</span>
                    <span style={{ color: '#9fb3c8' }}>{s.note}</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${Math.max(s.width, 6)}%`, height: '100%', background: s.color, boxShadow: '0 6px 18px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-global" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,211,238,0.10))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Money flow</h3>
            <span style={badgeStyle}>Deposits → Withdrawals → Net → PL</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {moneySteps.map((s) => (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: s.color, display: 'inline-block' }} />
                    <strong style={{ fontSize: 13 }}>{s.label}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
                    <span title={formatEuroFull(s.value)}>{formatEuro(s.value)}</span>
                    <span style={{ color: '#9fb3c8' }}>{s.note}</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${Math.max(s.width, 6)}%`, height: '100%', background: s.color, boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-global" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0 }}>Best affiliates</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#9fb3c8' }}>Top 15 per net deposits, clicca per filtrare</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={badgeStyle}>Top 10 + Next 5 + Others</span>
              <button
                className="btn secondary"
                style={{ padding: '6px 10px', fontSize: 12 }}
                onClick={() => setSelectedAffiliate('all')}
              >
                Reset filtro
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 13 }}>Top 10</strong>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {(affiliateLeaderboard?.top10 || []).map((r) => (
                  <button
                    key={`top10-${r.affiliate}`}
                    onClick={() => setSelectedAffiliate(r.affiliate)}
                    className="btn secondary"
                    style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '6px 10px', fontSize: 12, background: selectedAffiliate === r.affiliate ? 'rgba(96,165,250,0.16)' : '#0f172a' }}
                    title={`Net dep ${formatEuroFull(r.netDeposits)} | P&L ${formatEuroFull(r.pl)} | Profit ${formatEuroFull(r.profit)}`}
                  >
                    <span style={{ fontWeight: 600 }}>{r.affiliate}</span>
                    <span style={{ color: (r.netDeposits || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(r.netDeposits)}</span>
                  </button>
                ))}
                {(affiliateLeaderboard?.top10 || []).length === 0 && (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>Nessun dato</span>
                )}
              </div>
            </div>

            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 13 }}>Next 5</strong>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {(affiliateLeaderboard?.mid5 || []).map((r) => (
                  <button
                    key={`mid5-${r.affiliate}`}
                    onClick={() => setSelectedAffiliate(r.affiliate)}
                    className="btn secondary"
                    style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '6px 10px', fontSize: 12, background: selectedAffiliate === r.affiliate ? 'rgba(96,165,250,0.16)' : '#0f172a' }}
                    title={`Net dep ${formatEuroFull(r.netDeposits)} | P&L ${formatEuroFull(r.pl)} | Profit ${formatEuroFull(r.profit)}`}
                  >
                    <span style={{ fontWeight: 600 }}>{r.affiliate}</span>
                    <span style={{ color: (r.netDeposits || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(r.netDeposits)}</span>
                  </button>
                ))}
                {(affiliateLeaderboard?.mid5 || []).length === 0 && (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                )}
              </div>
            </div>

            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 13 }}>Others</strong>
                {affiliateLeaderboard?.othersAgg && (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{affiliateLeaderboard.othersAgg.count} affiliates</span>
                )}
              </div>
              {affiliateLeaderboard?.othersAgg ? (
                <button
                  onClick={() => setSelectedAffiliate('all')}
                  className="btn secondary"
                  style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '6px 10px', fontSize: 12, background: '#0f172a' }}
                  title={`Net dep ${formatEuroFull(affiliateLeaderboard.othersAgg.netDeposits)} | P&L ${formatEuroFull(affiliateLeaderboard.othersAgg.pl)} | Profit ${formatEuroFull(affiliateLeaderboard.othersAgg.profit)}`}
                >
                  <span style={{ fontWeight: 600 }}>Others</span>
                  <span style={{ color: (affiliateLeaderboard.othersAgg.netDeposits || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(affiliateLeaderboard.othersAgg.netDeposits)}</span>
                </button>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Nessun dato aggiuntivo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Removed redundant Best 15 block per request */}

      <div className="grid-global" style={{ alignItems: 'start', gap: 12 }}>
        <div className="card card-global">
          <h3 style={{ marginBottom: 8 }}>Acquisition & quality</h3>
          <div className="kpi-grid">
            <div className="kpi" title="Visitors = somma visitors nel periodo filtrato">
              <span>Visitors</span>
              <strong title={formatNumberFull(totals.visitors)}>{formatNumberShort(totals.visitors)}</strong>
            </div>
            <div className="kpi" title="Registrations = somma registrazioni nel periodo filtrato">
              <span>Registrations</span>
              <strong title={formatNumberFull(totals.registrations)}>{formatNumberShort(totals.registrations)}</strong>
            </div>
            <div className="kpi" title="FTD = first time deposit, somma per filtri">
              <span>FTD</span>
              <strong title={formatNumberFull(totals.ftd)}>{formatNumberShort(totals.ftd)}</strong>
            </div>
            <div className="kpi" title="Conversion = Registrations / Visitors">
              <span>Conversion</span>
              <strong>{formatPercentDisplay(totals.conversion)}</strong>
            </div>
            <div className="kpi" title="CTR medio dalle righe del media report">
              <span>CTR avg</span>
              <strong>{formatPercentDisplay(totals.ctrAvg)}</strong>
            </div>
            <div className="kpi" title="Impressions = somma impressions">
              <span>Impressions</span>
              <strong title={formatNumberFull(totals.impressions)}>{formatNumberShort(totals.impressions)}</strong>
            </div>
          </div>
        </div>

        <div className="card card-global">
          <h3 style={{ marginBottom: 8 }}>Monetization</h3>
          <div className="kpi-grid">
            <div className="kpi" title="Net deposits = somma net deposits filtrati">
              <span>Net deposits</span>
              <strong title={formatEuroFull(totals.netDeposits)} style={{ color: (totals.netDeposits || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(totals.netDeposits)}</strong>
            </div>
            <div className="kpi" title="P&L = somma PL (trading) filtrati">
              <span>P&L</span>
              <strong title={formatEuroFull(totals.pl)} style={{ color: (totals.pl || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(totals.pl)}</strong>
            </div>
            <div className="kpi" title="Payments pagati (Payments Report)">
              <span>Payments</span>
              <strong title={formatEuroFull(totals.paymentsTotal)} style={{ color: '#fbbf24' }}>{formatEuro(totals.paymentsTotal)}</strong>
            </div>
            <div className="kpi" title="Profit = PL - Payments">
              <span>Profit</span>
              <strong title={formatEuroFull(totals.profit)} style={{ color: (totals.profit || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(totals.profit)}</strong>
            </div>
            <div className="kpi" title="ROI medio semplice sulle righe filtrate">
              <span>ROI avg</span>
              <strong style={{ color: (totals.roiAvg || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatPercentDisplay(totals.roiAvg)}</strong>
            </div>
            <div className="kpi" title="Payout medio per FTD nel periodo">
              <span>Payout / FTD</span>
              <strong title={formatEuroFull(totals.ftd ? totals.paymentsTotal / Math.max(totals.ftd, 1) : 0)} style={{ color: '#fbbf24' }}>{formatEuro(totals.ftd ? totals.paymentsTotal / Math.max(totals.ftd, 1) : 0)}</strong>
            </div>
          </div>
        </div>
      </div>

      {showInsights && (
        <div className="card card-global" style={{ background: 'linear-gradient(120deg, rgba(34,211,238,0.08), rgba(59,130,246,0.06))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
            <div>
              <h3 style={{ margin: 0 }}>Insights</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#9fb3c8' }}>Pillole rapide per capire cosa succede</p>
            </div>
            <span style={badgeStyle}>Auto-generated</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {insights.length ? insights.map((item, idx) => (
              <div key={idx} style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', fontSize: 13 }}>
                {item}
              </div>
            )) : (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Nessun insight disponibile per questi filtri.</div>
            )}
          </div>
        </div>
      )}

      {showPerMonthTable && (
        <div className="card card-global">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginBottom: 8 }}>Per mese</h3>
            <span style={badgeStyle}>PL e pagamenti per ogni mese</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Mese</th>
                  <th style={{ textAlign: 'right' }}>Visitors</th>
                  <th style={{ textAlign: 'right' }}>Reg</th>
                  <th style={{ textAlign: 'right' }}>FTD</th>
                  <th style={{ textAlign: 'right' }}>Net dep</th>
                  <th style={{ textAlign: 'right' }}>P&L</th>
                  <th style={{ textAlign: 'right' }}>Payments</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                  <th style={{ textAlign: 'right' }}>ROI</th>
                  <th style={{ textAlign: 'right' }}>Conv%</th>
                </tr>
              </thead>
              <tbody>
                {perMonth.map((r) => (
                  <tr key={r.monthKey}>
                    <td>{r.monthLabel}</td>
                    <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(r.visitors)}>{formatNumberShort(r.visitors)}</td>
                    <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(r.registrations)}>{formatNumberShort(r.registrations)}</td>
                    <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(r.ftd)}>{formatNumberShort(r.ftd)}</td>
                    <td style={{ textAlign: 'right', color: (r.netDeposits || 0) >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatEuroFull(r.netDeposits)}>{formatEuro(r.netDeposits)}</td>
                    <td style={{ textAlign: 'right', color: (r.pl || 0) >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatEuroFull(r.pl)}>{formatEuro(r.pl)}</td>
                    <td style={{ textAlign: 'right', color: '#fbbf24' }} className="num" title={formatEuroFull(r.payments)}>{formatEuro(r.payments)}</td>
                    <td style={{ textAlign: 'right', color: (r.profit || 0) >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatEuroFull(r.profit)}>{formatEuro(r.profit)}</td>
                    <td style={{ textAlign: 'right', color: (r.roi || 0) >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatPercentDisplay(r.roi)}>{formatPercentDisplay(r.roi)}</td>
                    <td style={{ textAlign: 'right' }} className="num" title={formatPercentDisplay(r.conversion)}>{formatPercentDisplay(r.conversion)}</td>
                  </tr>
                ))}
                {perMonth.length > 0 && (
                  <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 700 }}>
                    <td>Totale</td>
                    <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(perMonthTotals.visitors)}>{formatNumberShort(perMonthTotals.visitors)}</td>
                    <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(perMonthTotals.registrations)}>{formatNumberShort(perMonthTotals.registrations)}</td>
                    <td style={{ textAlign: 'right' }} className="num" title={formatNumberFull(perMonthTotals.ftd)}>{formatNumberShort(perMonthTotals.ftd)}</td>
                    <td style={{ textAlign: 'right', color: (perMonthTotals.netDeposits || 0) >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatEuroFull(perMonthTotals.netDeposits)}>{formatEuro(perMonthTotals.netDeposits)}</td>
                    <td style={{ textAlign: 'right', color: (perMonthTotals.pl || 0) >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatEuroFull(perMonthTotals.pl)}>{formatEuro(perMonthTotals.pl)}</td>
                    <td style={{ textAlign: 'right', color: '#fbbf24' }} className="num" title={formatEuroFull(perMonthTotals.payments)}>{formatEuro(perMonthTotals.payments)}</td>
                    <td style={{ textAlign: 'right', color: (perMonthTotals.profit || 0) >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatEuroFull(perMonthTotals.profit)}>{formatEuro(perMonthTotals.profit)}</td>
                    <td style={{ textAlign: 'right', color: (perMonthTotals.roi || 0) >= 0 ? '#34d399' : '#f87171' }} className="num" title={formatPercentDisplay(perMonthTotals.roi)}>{formatPercentDisplay(perMonthTotals.roi)}</td>
                    <td style={{ textAlign: 'right' }} className="num" title={formatPercentDisplay(perMonthTotals.conversion)}>{formatPercentDisplay(perMonthTotals.conversion)}</td>
                  </tr>
                )}
                {!perMonth.length && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: '#94a3b8' }}>Nessun dato per i filtri correnti.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card card-global">
        <h3 style={{ marginBottom: 8 }}>Profit & break-even</h3>
        <p style={{ marginTop: 0, color: '#9fb3c8', fontSize: 12 }}>Curve cumulata di (PL - Payments) mese su mese.</p>
        <div className="kpi-grid" style={{ marginBottom: 10 }}>
          <div className="kpi" title="P&L = somma PL trading del periodo">
            <span>P&L</span>
            <strong title={formatEuroFull(totals.pl)} style={{ color: (totals.pl || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(totals.pl)}</strong>
          </div>
          <div className="kpi" title="Payments (Payments Report)">
            <span>Payments</span>
            <strong title={formatEuroFull(totals.paymentsTotal)} style={{ color: '#fbbf24' }}>{formatEuro(totals.paymentsTotal)}</strong>
          </div>
          <div className="kpi" title="Profit netto = P&L - Payments">
            <span>Profit netto</span>
            <strong title={formatEuroFull(totals.profit)} style={{ color: (totals.profit || 0) >= 0 ? '#34d399' : '#f87171' }}>{formatEuro(totals.profit)}</strong>
          </div>
        </div>
        <div style={{ height: 260 }}>
          <BreakEvenChart
            beCurve={breakEven.curve}
            labels={breakEven.labels}
            breakEvenIndex={breakEven.breakEvenIndex}
          />
        </div>
      </div>

      {loading && (
        <div className="card card-global" style={{ textAlign: 'center', color: '#94a3b8' }}>Caricamento report...</div>
      )}
    </div>
  );
}
