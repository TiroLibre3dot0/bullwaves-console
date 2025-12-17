import React, { useState, useMemo, useEffect } from 'react';
import BreakEvenChart from './BreakEvenChart';
import PnLTrendChart from './PnLTrendChart';
import CohortDecayView from './CohortDecayView';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const inputMetrics = ['Users','Churn %','Net deposits','Commissions paid','Marketing spend'];
const derivedMetrics = ['Active users','P&L'];

const demoPreset = {
  'Net deposits': [12000, 13500, 14200, 15800, 17300, 18100, 19000, 19750, 20500, 21200, 22000, 23000],
  'Commissions': [3200, 3500, 3650, 3800, 3950, 4100, 4200, 4300, 4450, 4550, 4700, 4900],
  'Commissions paid': [2100, 2250, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3150, 3300],
  'Marketing spend': [1800, 1850, 1900, 1950, 2000, 2050, 2100, 2150, 2200, 2300, 2350, 2400],
  'Users': [320, 340, 350, 360, 370, 380, 390, 395, 400, 405, 410, 420],
  'Churn %': [4, 4, 4.5, 4.5, 5, 5, 5, 5.2, 5.2, 5.5, 5.5, 5.5],
};

const formatter = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Unified cohort source; per-affiliate overrides disabled to keep one consistent dataset.
const affiliateCohortFiles = {};

// Per-affiliate PL overrides no longer used; base file already contains affiliate column.
const affiliatePlFiles = {};

const friendlyCohortLabel = (raw) => {
  if (!raw) return 'Cohort';
  const datePart = raw.split(/\s|T/)[0] || raw;
  const parts = datePart.split('/').map((p) => Number(p));
  if (parts.length >= 3) {
    const [m, d, y] = parts; // month-first
    const monthName = months[Math.max(0, Math.min(11, (m || 1) - 1))];
    return `${monthName} ${y}`;
  }
  return raw;
};

const formatNumberShort = (value) => {
  const num = Number(value || 0);
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${Math.round(num / 1000)}K`;
  }
  return formatter.format(Math.round(num));
};

const formatEuro = (value) => `€${formatNumberShort(value)}`;
// Keep consistent K/M formatting everywhere (including tooltips).
const formatEuroFull = (value) => `€${formatNumberShort(value)}`;
const formatNumberFull = (value) => formatter.format(Number(value || 0));
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const normalizeKey = (str = '') => str.trim().toLowerCase();
const average = (arr = []) => {
  const vals = arr.filter((v) => Number.isFinite(v));
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
};

const parseCohortDateString = (raw) => {
  if (!raw) return null;
  const datePart = raw.split(/\s|T/)[0] || '';
  const parts = datePart.split('/').map((p) => Number(p));
  if (parts.length < 3) return null;
  const [m, d, y] = parts; // month-first
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const buildCohortMetrics = (row) => {
  const values = row?.values || [];
  const m0 = values[0] || 0;
  const retainedAt = (idx) => {
    if (!m0) return null;
    const v = values[idx];
    return v === undefined || v === null ? null : (v / m0) * 100;
  };
  const retainedM1 = retainedAt(1);
  const retainedM3 = retainedAt(3);
  const retainedM6 = retainedAt(6);

  const halfLife = (() => {
    if (!m0) return null;
    for (let i = 1; i < values.length; i += 1) {
      const v = values[i];
      if (v === null || v === undefined) continue;
      if ((v / m0) * 100 < 50) return i;
    }
    return null;
  })();

  const lifetime = (() => {
    if (!m0) return null;
    for (let i = 1; i < values.length; i += 1) {
      const v = values[i];
      if (v === null || v === undefined) continue;
      if ((v / m0) * 100 < 10) return i;
    }
    return null;
  })();

  const cumulative = values.reduce((s, v) => s + (Number(v) || 0), 0);
  const earlyShare = cumulative ? (m0 / cumulative) * 100 : null;

  return {
    retainedM1,
    retainedM3,
    retainedM6,
    halfLife,
    lifetime,
    cumulative,
    earlyShare,
    m0,
  };
};

const aggregateMetrics = (rows = []) => {
  if (!rows.length) return null;
  const metrics = rows.map((r) => buildCohortMetrics(r));
  const avg = (key) => average(metrics.map((m) => m[key]).filter((v) => v !== null && v !== undefined));
  const sum = metrics.reduce((s, m) => s + (m.cumulative || 0), 0);
  const totalSize = metrics.reduce((s, m) => s + (m.m0 || 0), 0);
  return {
    retainedM1: avg('retainedM1'),
    retainedM3: avg('retainedM3'),
    retainedM6: avg('retainedM6'),
    halfLife: avg('halfLife'),
    lifetime: avg('lifetime'),
    cumulative: sum,
    totalSize,
    earlyShare: avg('earlyShare'),
  };
};

const classifyCohortHealth = (stats) => {
  if (!stats) {
    return {
      flag: 'NO DATA',
      tone: '#cbd5e1',
      why: 'No cohort data available for this selection.',
      meaning: 'There is not enough data to assess cohort health.',
      nextCheck: 'Wait for more months of activity and re-check M1/M3 retained value.',
      valueConcentration: null,
    };
  }

  const r1 = stats.retainedM1 ?? null;
  const r3 = stats.retainedM3 ?? null;
  const r6 = stats.retainedM6 ?? null;
  const hl = stats.halfLife ?? null;
  const life = stats.lifetime ?? null;
  const early = stats.earlyShare ?? null;

  const isGreen = (r3 !== null && r3 >= 40) || (hl !== null && hl >= 3) || (life !== null && life >= 6);
  const isOrange = !isGreen && ((r3 !== null && r3 >= 20) || (hl !== null && hl >= 2) || (life !== null && life >= 4));
  const flag = isGreen ? 'GREEN' : isOrange ? 'ORANGE' : 'RED';
  const tone = flag === 'GREEN' ? '#34d399' : flag === 'ORANGE' ? '#fbbf24' : '#f87171';

  const why = (() => {
    if (flag === 'GREEN') return 'Value stays strong beyond Month 0.';
    if (early !== null && early !== undefined && early >= 60) return 'Most value is generated in Month 0.';
    if (r1 !== null && r1 !== undefined && r1 < 25) return 'Value drops sharply after Month 0.';
    if (r3 !== null && r3 !== undefined && r3 < 20) return 'Value fades quickly by Month 3.';
    return 'Value declines after Month 0.';
  })();

  const meaning = (() => {
    if (flag === 'GREEN') return 'Recurring activity sustains value across multiple months.';
    if (flag === 'ORANGE') return 'Some repeat activity exists, but it weakens over time.';
    return 'Business depends heavily on first-month activity and weak repeat usage.';
  })();

  const nextCheck = 'After retention actions, focus on improving M1 and M3 retained value.';

  const valueConcentration = early === null || early === undefined ? null : early;

  return { flag, tone, why, meaning, nextCheck, valueConcentration };
};

const matchCohortSelection = (monthIndex, selection) => {
  if (selection === null) return false;
  if (selection === 'all') return true;
  if (typeof selection === 'number') return monthIndex === selection;
  const buckets = {
    Q1: [0, 1, 2],
    Q2: [3, 4, 5],
    Q3: [6, 7, 8],
    Q4: [9, 10, 11],
    S1: [0, 1, 2, 3, 4, 5],
    S2: [6, 7, 8, 9, 10, 11],
  };
  const key = typeof selection === 'string' ? selection.toUpperCase() : '';
  const bucket = buckets[key];
  return Array.isArray(bucket) ? bucket.includes(monthIndex) : false;
};

const getSelectionStart = (selection) => {
  if (selection === null || selection === 'all') return 0;
  if (typeof selection === 'number') return Math.max(0, Math.min(11, selection));
  const startMap = { Q1: 0, Q2: 3, Q3: 6, Q4: 9, S1: 0, S2: 6 };
  const key = typeof selection === 'string' ? selection.toUpperCase() : '';
  return startMap[key] ?? 0;
};

export default function Dashboard() {
  const emptyMonthlyData = () => {
    const base = {};
    inputMetrics.forEach((m) => {
      base[m] = Array(12).fill(0);
    });
    return base;
  };

  const [monthlyData, setMonthlyData] = useState(() => emptyMonthlyData());
  const [baseCohortsSummary, setBaseCohortsSummary] = useState([]);
  const [baseCohortsDetail, setBaseCohortsDetail] = useState([]);
  const [cohortsSummary, setCohortsSummary] = useState([]);
  const [cohortsDetail, setCohortsDetail] = useState([]);
  const [customCohorts, setCustomCohorts] = useState(() => new Map());
  const [balanceRows, setBalanceRows] = useState([]);
  const [commissionsData, setCommissionsData] = useState([]);
  const [mediaRows, setMediaRows] = useState([]);
  const [plSummary, setPlSummary] = useState([]);
  const [plDetail, setPlDetail] = useState([]);
  const [customPl, setCustomPl] = useState(() => new Map());
  const [plSeries, setPlSeries] = useState(() => Array(12).fill(0));
  const [selectedCohortMonth, setSelectedCohortMonth] = useState(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState('all');
  const [cohortAnalysisMetric, setCohortAnalysisMetric] = useState('netDeposits');
  const [kpiOverrides, setKpiOverrides] = useState({});
  const [reportText, setReportText] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [showCohortDb, setShowCohortDb] = useState(true);
  const [showAffiliatesDetail, setShowAffiliatesDetail] = useState(true);
  const [showCohortKpisBlock, setShowCohortKpisBlock] = useState(true);
  const [showMonthlyAggregatesBlock, setShowMonthlyAggregatesBlock] = useState(true);
  const [showBreakEvenBlock, setShowBreakEvenBlock] = useState(true);
  const [showPnLTrendBlock, setShowPnLTrendBlock] = useState(true);
  const [showTopAffiliatesBlock, setShowTopAffiliatesBlock] = useState(true);
  const [showMonthlyInfo, setShowMonthlyInfo] = useState(false);
  const [showKpiInfo, setShowKpiInfo] = useState(false);
  const [showCohortDbInfo, setShowCohortDbInfo] = useState(false);
  const [showBreakEvenInfo, setShowBreakEvenInfo] = useState(false);
  const [showAutoReportInfo, setShowAutoReportInfo] = useState(false);
  const showCohortDbBlock = false; // temporarily hidden per request
  const showAutoReportBlock = false; // temporarily hidden per request
  const [selectedCalendarYear, setSelectedCalendarYear] = useState(2025);

  const cohortMetricLabel = (() => {
    if (cohortAnalysisMetric === 'deposits') return 'Deposits';
    if (cohortAnalysisMetric === 'depositsCount') return 'Number of deposits';
    if (cohortAnalysisMetric === 'withdrawals') return 'Withdrawals';
    return 'Net deposits';
  })();

  const cohortMetricKind = cohortAnalysisMetric === 'depositsCount' ? 'count' : 'currency';
  const retainedMetricLabel = cohortMetricKind === 'count' ? 'Retained activity' : 'Retained value';
  // Internally the dashboard data model uses the "Net deposits" key.
  // When metricLabel is "Deposits" we still store/compute under this key, but render labels coherently.
  const cohortMetricDataKey = 'Net deposits';

  const cohortDetailRows = useMemo(() => {
    if (selectedCohortMonth === null) return cohortsDetail;
    return cohortsDetail.filter((d) => matchCohortSelection(d.monthIndex, selectedCohortMonth));
  }, [cohortsDetail, selectedCohortMonth]);

  const selectedCohortSummary = useMemo(() => {
    if (selectedCohortMonth === null) return null;
    const matches = cohortsSummary.filter((c) => matchCohortSelection(c.monthIndex, selectedCohortMonth));
    if (!matches.length) return null;
    return matches.reduce(
      (acc, c) => {
        acc.cohortSize += c.cohortSize || 0;
        acc.m0 += c.m0 || 0;
        acc.m1 += c.m1 || 0;
        acc.m2 += c.m2 || 0;
        acc.months = acc.months.map((v, idx) => v + ((c.months || [])[idx] || 0));
        return acc;
      },
      { cohortSize: 0, m0: 0, m1: 0, m2: 0, months: Array(12).fill(0) }
    );
  }, [cohortsSummary, selectedCohortMonth]);

  const balanceByAffiliate = useMemo(() => {
    const map = new Map();
    balanceRows.forEach((b) => {
      if (b.name) map.set(normalizeKey(b.name), b);
    });
    return map;
  }, [balanceRows]);

  const commissionsAggregates = useMemo(() => {
    const byAffiliate = new Map();
    const byType = new Map();

    commissionsData.forEach((c) => {
      const key = c.affiliateId || c.affiliate || 'ÔÇö';
      const acc = byAffiliate.get(key) || {
        affiliate: c.affiliate || 'ÔÇö',
        affiliateId: c.affiliateId || 'ÔÇö',
        total: 0,
        count: 0,
      };
      acc.total += c.amount || 0;
      acc.count += 1;
      byAffiliate.set(key, acc);

      const typeKey = c.type || 'Other';
      const typeAcc = byType.get(typeKey) || { type: typeKey, total: 0, count: 0 };
      typeAcc.total += c.amount || 0;
      typeAcc.count += 1;
      byType.set(typeKey, typeAcc);
    });

    const topAffiliates = Array.from(byAffiliate.values()).sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 15);
    const payoutSchema = Array.from(byType.values()).sort((a, b) => (b.total || 0) - (a.total || 0));

    return { topAffiliates, payoutSchema, byAffiliate };
  }, [commissionsData]);

  const mediaTopAffiliates = useMemo(() => {
    if (!mediaRows.length) return [];
    const agg = Array.from(
      mediaRows.reduce((map, r) => {
        const key = r.affiliate || 'ÔÇö';
        const acc = map.get(key) || { affiliate: key, registrations: 0, pl: 0, netDeposits: 0, commission: 0 };
        acc.registrations += r.registrations || 0;
        acc.pl += r.pl || 0;
        acc.netDeposits += r.netDeposits || 0;
        acc.commission += r.commission || 0;
        map.set(key, acc);
        return map;
      }, new Map()).values()
    );

    const totalReg = agg.reduce((s, r) => s + (r.registrations || 0), 0);
    const totalPl = agg.reduce((s, r) => s + (r.pl || 0), 0);

    return agg
      .map((r) => ({
        ...r,
        regPct: totalReg ? ((r.registrations || 0) / totalReg) * 100 : 0,
        plPct: totalPl ? ((r.pl || 0) / totalPl) * 100 : 0,
        roi: r.registrations ? ((r.pl || 0) / r.registrations) * 100 : 0,
        total: r.pl || 0,
      }))
      .sort((a, b) => (b.pl || 0) - (a.pl || 0))
      .slice(0, 10);
  }, [mediaRows]);

  const plTopAffiliates = useMemo(() => {
    if (!plDetail.length) return [];
    const agg = Array.from(
      plDetail.reduce((map, d) => {
        const key = d.affiliate || friendlyCohortLabel(d.cohortDate);
        const acc = map.get(key) || { ...d, affiliate: key, months: Array(12).fill(0), cohortSize: 0 };
        acc.months = acc.months.map((v, idx) => v + ((d.months || [])[idx] || 0));
        acc.cohortSize += d.cohortSize || 0;
        map.set(key, acc);
        return map;
      }, new Map()).values()
    );

    const totalPl = agg.reduce((sum, r) => sum + (r.months || []).reduce((a, v) => a + (v || 0), 0), 0);

    return agg
      .map((d) => {
        const total = (d.months || []).reduce((acc, v) => acc + (v || 0), 0);
        const plPct = totalPl ? (total / totalPl) * 100 : 0;
        const roi = (d.cohortSize || 0) ? (total / d.cohortSize) * 100 : 0;
        return {
          ...d,
          total,
          regPct: 0,
          plPct,
          roi,
        };
      })
      .sort((a, b) => (b.total || 0) - (a.total || 0))
      .slice(0, 10);
  }, [plDetail]);

  const topAffiliates = mediaTopAffiliates.length ? mediaTopAffiliates : plTopAffiliates;

  const affiliateOptionGroups = useMemo(() => {
    const specialAffiliates = Object.keys(affiliateCohortFiles || {});

    let names = topAffiliates.map((a) => a.affiliate || 'ÔÇö');
    // ensure dedicated-file affiliates are always selectable even if not in top list
    specialAffiliates.forEach((name) => {
      if (name && !names.includes(name)) names.push(name);
    });
    if (!names.length) {
      const rows = cohortsDetail.filter((d) => (d.affiliate || '').trim() !== '');
      const stats = new Map();
      rows.forEach((d) => {
        const name = d.affiliate || 'ÔÇö';
        const total = (d.months || []).reduce((acc, v) => acc + (v || 0), 0);
        const score = Math.abs(total) + (d.cohortSize || 0);
        const current = stats.get(name) || { name, score: 0 };
        current.score += score;
        stats.set(name, current);
      });
      names = Array.from(stats.values())
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .map((s) => s.name);
      specialAffiliates.forEach((name) => {
        if (name && !names.includes(name)) names.push(name);
      });
    }

    if (selectedAffiliate && selectedAffiliate !== 'all' && !names.includes(selectedAffiliate)) {
      names = [selectedAffiliate, ...names];
    }

    const top = Array.from(new Set(names)).slice(0, 10);
    return { top };
  }, [topAffiliates, cohortsDetail, selectedAffiliate]);

  const cohortCalendar = useMemo(() => {
    const aggregated = new Map();
    let maxMonths = 0;

    cohortsDetail.forEach((row) => {
      const date = parseCohortDateString(row.cohortDate);
      if (!date) return;
      const baseAbs = date.getFullYear() * 12 + date.getMonth();
      const key = baseAbs;
      const values = row.months || [];
      maxMonths = Math.max(maxMonths, values.length);
      const existing = aggregated.get(key) || {
        id: `cohort-${key}`,
        cohortLabel: friendlyCohortLabel(row.cohortDate),
        cohortDateRaw: row.cohortDate,
        cohortYear: date.getFullYear(),
        baseAbs,
        values: Array(values.length || 12).fill(0),
        cohortSize: 0,
        affiliate: 'all',
        affiliateKey: 'all',
      };
      const nextValues = Array.from({ length: Math.max(existing.values.length, values.length) }).map(
        (_, idx) => (existing.values[idx] || 0) + (values[idx] || 0)
      );
      aggregated.set(key, {
        ...existing,
        values: nextValues,
        cohortSize: (existing.cohortSize || 0) + (row.cohortSize || 0),
      });
      maxMonths = Math.max(maxMonths, nextValues.length);
    });

    const parsed = Array.from(aggregated.values())
      .map((item) => {
        const m0 = item.values[0] || 0;
        const normalized = item.values.map((v) => {
          if (!m0) return null;
          return (v / m0) * 100;
        });
        return { ...item, normalized };
      })
      .sort((a, b) => a.baseAbs - b.baseAbs);

    if (!parsed.length) return { rows: [], labels: [], startAbs: 0, years: [] };

    const labels = Array.from({ length: maxMonths || 12 }).map((_, idx) => `Month ${idx}`);
    const years = Array.from(new Set(parsed.map((r) => r.cohortYear))).sort((a, b) => a - b);

    return { rows: parsed, labels, startAbs: 0, years };
  }, [cohortsDetail]);

  const calendarView = useMemo(() => {
    const filteredRows = cohortCalendar.rows.filter((r) => (selectedCalendarYear === 'all' ? true : r.cohortYear === selectedCalendarYear));
    if (!filteredRows.length) return { rows: [], entries: [], startAbs: 0 };

    const minAbs = selectedCalendarYear === 'all'
      ? Math.min(...filteredRows.map((r) => r.baseAbs))
      : selectedCalendarYear * 12; // Jan of selected year

    const maxAbs = selectedCalendarYear === 'all'
      ? Math.max(...filteredRows.map((r) => r.baseAbs + (r.values?.length || 0) - 1))
      : (selectedCalendarYear * 12) + 11; // Dec of selected year

    const entries = [];
    for (let abs = minAbs; abs <= maxAbs; abs += 1) {
      const year = Math.floor(abs / 12);
      const month = abs % 12;
      entries.push({ abs, label: selectedCalendarYear === 'all' ? `${months[month]} ${year}` : months[month] });
    }

    return { rows: filteredRows, entries, startAbs: minAbs };
  }, [cohortCalendar, selectedCalendarYear]);

  const overviewKpis = useMemo(() => {
    const affiliateKey = normalizeKey(selectedAffiliate);
    const filtered = calendarView.rows.filter((r) => (affiliateKey === 'all' ? true : r.affiliateKey === affiliateKey));

    const agg = aggregateMetrics(filtered);
    const flag = classifyCohortHealth(agg);

    return {
      avgRetainedM1: agg?.retainedM1 ?? null,
      avgRetainedM3: agg?.retainedM3 ?? null,
      avgRetainedM6: agg?.retainedM6 ?? null,
      retainedM1: agg?.retainedM1 ?? null,
      healthLabel: flag.flag,
      healthTone: flag.tone,
      econ: {
        retainedM1: agg?.retainedM1,
        retainedM3: agg?.retainedM3,
        retainedM6: agg?.retainedM6,
        halfLife: agg?.halfLife,
        lifetime: agg?.lifetime,
        why: flag.why,
        meaning: flag.meaning,
        nextCheck: flag.nextCheck,
        valueConcentration: flag.valueConcentration,
      },
    };
  }, [calendarView, selectedAffiliate]);

  function updateValue(metric, idx, value) {
    setMonthlyData((prev) => {
      const next = { ...prev, [metric]: [...prev[metric]] };
      const parsed = Number(value);
      const safe = Number.isNaN(parsed) ? 0 : parsed;
      const costMetrics = ['Commissions paid', 'Marketing spend'];
      next[metric][idx] = costMetrics.includes(metric) ? -Math.abs(safe) : safe;
      return next;
    });
  }

  function loadPreset() {
    setMonthlyData(() => {
      const base = {};
      inputMetrics.forEach((m) => {
        const safe = [...demoPreset[m]];
        const costMetrics = ['Commissions paid', 'Marketing spend'];
        base[m] = costMetrics.includes(m) ? safe.map((v) => -Math.abs(v)) : safe;
      });
      return base;
    });
  }

  useEffect(() => {
    async function loadCohortDb() {
      try {
        const fetchCsv = async (path) => {
          const resp = await fetch(path);
          if (!resp.ok) return null;
          const text = await resp.text();
          return { path, text };
        };

        const candidatePaths = (() => {
          if (cohortAnalysisMetric === 'deposits') return ['/Cohort Analysis per churn analysis Deposits.csv'];
          if (cohortAnalysisMetric === 'depositsCount') return ['/Cohort Analysis per churn analysis deposits count since 2024.csv'];
          if (cohortAnalysisMetric === 'withdrawals') return ['/Cohort Analysis per churn analysis Withdrawals since 2024.csv'];
          return ['/Cohort Analysis per churn analysis Net Depositis since 2024.csv'];
        })();

        let primaryFile = null;
        for (const path of candidatePaths) {
          const loaded = await fetchCsv(path);
          if (!loaded) continue;
          const rows = parseCsv(loaded.text);
          const hasAffiliate = rows.length && Object.prototype.hasOwnProperty.call(rows[0], 'Affiliate');
          primaryFile = { ...loaded, rows, hasAffiliate };
          break;
        }

        if (!primaryFile) {
          console.warn(`Cohort source not found for metric: ${cohortAnalysisMetric}`);
          return;
        }

        const parseCohortDate = (raw) => {
          if (!raw) return null;
          const datePart = raw.split(/\s|T/)[0] || '';
          const parts = datePart.split('/').map((p) => Number(p));
          if (parts.length < 3) return null;
          const [m, d, y] = parts; // assume M/D/Y as per provided files
          const dt = new Date(y, (m || 1) - 1, d || 1);
          return Number.isNaN(dt.getTime()) ? null : dt;
        };

        const getMonthKeys = (row) => {
          if (!row) return [];
          return Object.keys(row)
            .filter((k) => /^Month\s+\d+$/i.test(k))
            .sort((a, b) => {
              const ai = Number((a.match(/\d+/) || [0])[0]);
              const bi = Number((b.match(/\d+/) || [0])[0]);
              return ai - bi;
            });
        };

        const parseRows = (rows, defaultAffiliate = '') =>
          rows
            .map((row) => {
              const d = parseCohortDate(row['Cohort Date']);
              if (!d) return null;
              const monthKeys = getMonthKeys(row);
              const monthsArr = monthKeys.map((k) => {
                const raw = cleanNumber(row[k]);
                if (cohortAnalysisMetric === 'withdrawals') return Math.abs(raw);
                return raw;
              });
              return {
                rawDate: row['Cohort Date'],
                date: d,
                absIdx: d.getFullYear() * 12 + d.getMonth(),
                affiliate: (row['Affiliate'] ?? defaultAffiliate ?? '').toString().trim(),
                cohortSize: cleanNumber(row['Cohort Size']),
                months: monthsArr,
              };
            })
            .filter(Boolean);

        const parsedRows = parseRows(primaryFile.rows, primaryFile.hasAffiliate ? '' : '');

        if (!parsedRows.length) return;
        const minAbsAll = Math.min(...parsedRows.map((r) => r.absIdx));
        const minAbsActive = Math.min(
          ...parsedRows
            .filter((r) => (r.cohortSize || 0) !== 0 || (r.months || []).some((v) => v && v !== 0))
            .map((r) => r.absIdx)
        );
        const minAbs = Number.isFinite(minAbsActive) ? minAbsActive : minAbsAll;

        const summaryMap = new Map();
        const detail = [];

        parsedRows.forEach((row) => {
          const relIdx = row.absIdx - minAbs;
          if (relIdx < 0) return;
          const cohortSize = row.cohortSize;
          const monthsValues = row.months;

          const acc = summaryMap.get(relIdx) || {
            monthIndex: relIdx,
            cohortSize: 0,
            months: Array(monthsValues.length || 12).fill(0),
          };
          acc.cohortSize += cohortSize;
          const maxLen = Math.max(acc.months.length, monthsValues.length);
          acc.months = Array.from({ length: maxLen }).map((_, idx) => (acc.months[idx] || 0) + (monthsValues[idx] || 0));
          acc.m0 = (acc.m0 || 0) + (monthsValues[0] || 0);
          acc.m1 = (acc.m1 || 0) + (monthsValues[1] || 0);
          acc.m2 = (acc.m2 || 0) + (monthsValues[2] || 0);
          summaryMap.set(relIdx, acc);

          detail.push({
            monthIndex: relIdx,
            cohortDate: row.rawDate,
            affiliate: row.affiliate,
            cohortSize,
            months: monthsValues,
            m0: monthsValues[0] || 0,
            m1: monthsValues[1] || 0,
            m2: monthsValues[2] || 0,
          });
        });

        const summary = Array.from(summaryMap.values())
          .map((c) => ({
            ...c,
            m0: c.m0 || 0,
            m1: c.m1 || 0,
            m2: c.m2 || 0,
          }))
          .sort((a, b) => a.monthIndex - b.monthIndex);

        setBaseCohortsSummary(summary);
        setBaseCohortsDetail(detail);
        setCohortsSummary(summary);
        setCohortsDetail(detail);
        if (summary.length) {
          setSelectedCohortMonth('all');
          // Keep current affiliate selection; do not reset to 'all' so switching affiliates preserves context.
        }
      } catch (err) {
        console.error('Failed to load cohort DB', err);
      }
    }

    loadCohortDb();
  }, [cohortAnalysisMetric]);

  useEffect(() => {
    async function loadBalance() {
      try {
        const resp = await fetch('/Balance Report.csv');
        if (!resp.ok) return;
        const text = await resp.text();
        const rows = parseCsv(text);
        const parsed = rows.map((r) => ({
          name: (r['Name'] ?? '').toString().trim(),
          paid: cleanNumber(r['Paid']),
        }));
        setBalanceRows(parsed);
      } catch (err) {
        console.error('Failed to load balance report for cohort', err);
      }
    }

    loadBalance();
  }, []);

  useEffect(() => {
    async function loadMediaReport() {
      try {
        const resp = await fetch('/Media Report.csv');
        if (!resp.ok) return;
        const text = await resp.text();
        const rows = parseCsv(text);

        const parsed = rows.map((r) => ({
          affiliate: (r['Affiliate'] ?? '').toString().trim() || 'ÔÇö',
          registrations: cleanNumber(r['Registrations'] ?? r['Leads']),
          pl: cleanNumber(r['PL']),
          netDeposits: cleanNumber(r['Net Deposits']),
          commission: cleanNumber(r['Commission']),
        }));
        setMediaRows(parsed);
      } catch (err) {
        console.error('Failed to load media report for top affiliates', err);
      }
    }

    loadMediaReport();
  }, []);

  useEffect(() => {
    async function loadPlCohort() {
      try {
        const candidatePaths = [
          '/top 10 Cohort Analysis PL.csv',
          '/PL Cohort 2025 first quarter.csv',
          '/PL Cohort Analysis.csv',
          '/Basilatwani Cohort Analysis.csv',
          '/Mertyoz Cohort Analysis.csv',
        ];

        let text = '';
        let loadedPath = '';
        for (const path of candidatePaths) {
          const resp = await fetch(path);
          if (resp.ok) {
            text = await resp.text();
            loadedPath = path;
            break;
          }
        }
        if (!text) return;

        // Usa il testo grezzo: parseCsv gestisce le virgolette; nessuna rimozione per non rompere l'header.
        const rows = parseCsv(text);

        const summaryMap = new Map();
        const detail = [];

        const parseMonthFirstDate = (raw) => {
          if (!raw) return null;
          const datePart = raw.split(/[\sT]/)[0] || '';
          const parts = datePart.split('/').map((p) => Number(p));
          if (parts.length < 3) return null;
          const [m, d, y] = parts; // assume M/D/Y
          const dt = new Date(y, (m || 1) - 1, d || 1);
          return Number.isNaN(dt.getTime()) ? null : dt;
        };

        const parsedRows = rows
          .map((row) => {
            const d = parseMonthFirstDate(row['Cohort Date']);
            if (!d) return null;
            const label = (row['Affiliate'] || friendlyCohortLabel(row['Cohort Date']) || '').toString().trim();
            return {
              rawDate: row['Cohort Date'],
              date: d,
              absIdx: d.getFullYear() * 12 + d.getMonth(),
              affiliate: label,
              affiliateKey: normalizeKey(label),
              cohortSize: cleanNumber(row['Cohort Size']),
              months: Array.from({ length: 12 }).map((_, k) => cleanNumber(row[`Month ${k}`])),
            };
          })
          .filter(Boolean);

        if (!parsedRows.length) return;
        const minAbsAll = Math.min(...parsedRows.map((r) => r.absIdx));
        const minAbsActive = Math.min(
          ...parsedRows
            .filter((r) => (r.cohortSize || 0) !== 0 || (r.months || []).some((v) => v && v !== 0))
            .map((r) => r.absIdx)
        );
        const minAbs = Number.isFinite(minAbsActive) ? minAbsActive : minAbsAll;

        parsedRows.forEach((row) => {
          const relIdx = row.absIdx - minAbs;
          if (relIdx < 0) return;
          const cohortSize = row.cohortSize;
          const monthsValues = row.months;

          const acc = summaryMap.get(relIdx) || {
            monthIndex: relIdx,
            cohortSize: 0,
            months: Array(12).fill(0),
          };
          acc.cohortSize += cohortSize;
          acc.months = acc.months.map((v, idx) => v + (monthsValues[idx] || 0));
          summaryMap.set(relIdx, acc);

          detail.push({
            monthIndex: relIdx,
            cohortDate: row.rawDate,
            affiliate: row.affiliate,
            affiliateKey: row.affiliateKey,
            cohortSize,
            months: monthsValues,
          });
        });

        const summary = Array.from(summaryMap.values()).sort((a, b) => a.monthIndex - b.monthIndex);
        setPlSummary(summary);
        setPlDetail(detail);
        setCustomPl((prev) => {
          const next = new Map(prev);
          next.set('base', { summary, detail });
          return next;
        });

        const hasFutureMonths = summary.some((s) => (s.months || []).some((v, idx) => idx > 0 && (v || 0) !== 0));
        if (!hasFutureMonths) {
          console.warn(`PL Cohort file (${loadedPath}) has only Month 0 data; add Month 1..11 for full evolution.`);
        }
      } catch (err) {
        console.error('Failed to load PL cohort report', err);
      }
    }

    loadPlCohort();
  }, []);

  useEffect(() => {
    async function loadCommissionsReport() {
      try {
        const candidatePaths = ['/Payments Report.csv', '/commissions.csv'];
        let text = '';
        for (const path of candidatePaths) {
          const resp = await fetch(path);
          if (resp.ok) {
            text = await resp.text();
            break;
          }
        }
        if (!text) return;
        const rows = parseCsv(text);

        const parseMonthFirstDate = (raw) => {
          if (!raw) return null;
          const parts = raw.split('/').map((p) => Number(p));
          if (parts.length < 3) return null;
          const [m, d, y] = parts;
          const date = new Date(y, (m || 1) - 1, d || 1);
          return Number.isNaN(date.getTime()) ? null : date;
        };

        const parsed = rows.map((r) => {
          const d = r['PaymentDate'] ? parseMonthFirstDate(r['PaymentDate']) : r['Commission Date'] ? new Date(r['Commission Date']) : null;
          const monthIndex = d && !Number.isNaN(d.getTime()) ? d.getMonth() : -1;
          return {
            id: r.id,
            date: d,
            monthIndex,
            affiliateId: (r['Affiliate Id'] ?? '').toString().trim(),
            affiliate: (r['Affiliate'] ?? '').toString().trim() || 'ÔÇö',
            amount: cleanNumber(r['Payment amount'] ?? r.amount),
            type: (r['Payment Range'] ?? r['Commission Type'] ?? '').toString().trim() || 'Other',
          };
        });
        setCommissionsData(parsed);
      } catch (err) {
        console.error('Failed to load commissions report', err);
      }
    }

    loadCommissionsReport();
  }, []);

  function applySelectedCohortToDashboard() {
    if (selectedCohortMonth === null) return;

    const netDeposits = Array(12).fill(0);
    const users = Array(12).fill(0);
    const commissionsPaid = Array(12).fill(0);
    const pnl = Array(12).fill(0);

    const applyRow = (row) => {
      const base = row.monthIndex;
      const values = row.months || [];
      values.forEach((val, k) => {
        const idx = base + k;
        if (idx >= 0 && idx < 12) netDeposits[idx] += val || 0;
      });
      if (row.cohortSize) users[base] += row.cohortSize;
    };

    const applyPlRow = (row) => {
      const base = row.monthIndex;
      const values = row.months || [];
      values.forEach((val, k) => {
        const idx = base + k;
        if (idx >= 0 && idx < 12) pnl[idx] += val || 0;
      });
    };

    const cohortRows = cohortsDetail.filter((row) =>
      matchCohortSelection(row.monthIndex, selectedCohortMonth) &&
      (selectedAffiliate === 'all' || normalizeKey(row.affiliate) === normalizeKey(selectedAffiliate))
    );

    const selectedAffKey = normalizeKey(selectedAffiliate);
    const plRows = plDetail.filter((row) =>
      matchCohortSelection(row.monthIndex, selectedCohortMonth) &&
      (selectedAffiliate === 'all' || (row.affiliateKey || normalizeKey(row.affiliate)) === selectedAffKey)
    );

    cohortRows.forEach(applyRow);
    plRows.forEach(applyPlRow);

    const filteredCommissions = commissionsData.filter(
      (c) =>
        (selectedAffiliate === 'all' ? true : normalizeKey(c.affiliate) === selectedAffKey) &&
        matchCohortSelection(c.monthIndex, selectedCohortMonth)
    );

    filteredCommissions.forEach((c) => {
      if (c.monthIndex >= 0 && c.monthIndex < 12) {
        commissionsPaid[c.monthIndex] += c.amount || 0;
      }
    });

    setMonthlyData((prev) => ({
      ...prev,
      'Net deposits': netDeposits,
      Users: users,
      'Commissions paid': commissionsPaid.map((v) => -Math.abs(v || 0)),
    }));

    setPlSeries(pnl);
  }

  useEffect(() => {
    applySelectedCohortToDashboard();
  }, [selectedCohortMonth, selectedAffiliate, cohortsSummary, cohortsDetail, commissionsData, plSummary, plDetail]);

  useEffect(() => {
    const path = affiliateCohortFiles[selectedAffiliate];
    if (!path) {
      setCohortsSummary(baseCohortsSummary);
      setCohortsDetail(baseCohortsDetail);
      return;
    }

    const cached = customCohorts.get(selectedAffiliate);
    if (cached) {
      setCohortsSummary(cached.summary);
      setCohortsDetail(cached.detail);
      if (!cached.summary.some((c) => matchCohortSelection(c.monthIndex, selectedCohortMonth))) {
        const firstActive = cached.summary.find((c) => (c.cohortSize || 0) > 0 || (c.m0 || 0) !== 0 || (c.m1 || 0) !== 0 || (c.m2 || 0) !== 0);
        if (firstActive) setSelectedCohortMonth(firstActive.monthIndex);
      }
      return;
    }

    const loadAffiliateFile = async () => {
      try {
        const resp = await fetch(path);
        if (!resp.ok) {
          setCohortsSummary(baseCohortsSummary);
          setCohortsDetail(baseCohortsDetail);
          return;
        }
        const text = await resp.text();
        const rows = parseCsv(text);

        const parseCohortDate = (raw) => {
          if (!raw) return null;
          const datePart = raw.split(/\s|T/)[0] || '';
          const parts = datePart.split('/').map((p) => Number(p));
          if (parts.length < 3) return null;
          const [m, d, y] = parts; // assume M/D/Y
          const dt = new Date(y, (m || 1) - 1, d || 1);
          return Number.isNaN(dt.getTime()) ? null : dt;
        };

        const parsedRows = rows
          .map((row) => {
            const d = parseCohortDate(row['Cohort Date']);
            if (!d) return null;
            return {
              rawDate: row['Cohort Date'],
              date: d,
              absIdx: d.getFullYear() * 12 + d.getMonth(),
              affiliate: (row['Affiliate'] ?? selectedAffiliate ?? '').toString().trim() || selectedAffiliate,
              cohortSize: cleanNumber(row['Cohort Size']),
              months: Array.from({ length: 12 }).map((_, k) => cleanNumber(row[`Month ${k}`])),
            };
          })
          .filter(Boolean);

        if (!parsedRows.length) {
          setCohortsSummary(baseCohortsSummary);
          setCohortsDetail(baseCohortsDetail);
          return;
        }

        const minAbs = Math.min(...parsedRows.map((r) => r.absIdx));
        const summaryMap = new Map();
        const detail = [];

        parsedRows.forEach((row) => {
          const relIdx = row.absIdx - minAbs;
          if (relIdx < 0) return;
          const monthsValues = row.months;

          const acc = summaryMap.get(relIdx) || {
            monthIndex: relIdx,
            cohortSize: 0,
            months: Array(12).fill(0),
          };
          acc.cohortSize += row.cohortSize;
          acc.months = acc.months.map((v, idx) => v + (monthsValues[idx] || 0));
          acc.m0 = (acc.m0 || 0) + (monthsValues[0] || 0);
          acc.m1 = (acc.m1 || 0) + (monthsValues[1] || 0);
          acc.m2 = (acc.m2 || 0) + (monthsValues[2] || 0);
          summaryMap.set(relIdx, acc);

          detail.push({
            monthIndex: relIdx,
            cohortDate: row.rawDate,
            affiliate: row.affiliate,
            cohortSize: row.cohortSize,
            months: monthsValues,
            m0: monthsValues[0] || 0,
            m1: monthsValues[1] || 0,
            m2: monthsValues[2] || 0,
          });
        });

        const summary = Array.from(summaryMap.values())
          .map((c) => ({
            ...c,
            m0: c.m0 || 0,
            m1: c.m1 || 0,
            m2: c.m2 || 0,
          }))
          .sort((a, b) => a.monthIndex - b.monthIndex);

        setCustomCohorts((prev) => {
          const next = new Map(prev);
          next.set(selectedAffiliate, { summary, detail });
          return next;
        });
        setCohortsSummary(summary);
        setCohortsDetail(detail);

        const firstActive = summary.find((c) => (c.cohortSize || 0) > 0 || (c.m0 || 0) !== 0 || (c.m1 || 0) !== 0 || (c.m2 || 0) !== 0);
        if (firstActive) setSelectedCohortMonth(firstActive.monthIndex);
      } catch (err) {
        console.error('Failed to load affiliate cohort file', err);
        setCohortsSummary(baseCohortsSummary);
        setCohortsDetail(baseCohortsDetail);
      }
    };

    loadAffiliateFile();
  }, [selectedAffiliate, selectedCohortMonth, baseCohortsSummary, baseCohortsDetail, customCohorts]);

  useEffect(() => {
    const path = affiliatePlFiles[selectedAffiliate];
    const basePl = customPl.get('base');

    if (!path) {
      if (basePl) {
        setPlSummary(basePl.summary);
        setPlDetail(basePl.detail);
      }
      return;
    }

    const cached = customPl.get(selectedAffiliate);
    if (cached) {
      setPlSummary(cached.summary);
      setPlDetail(cached.detail);
      return;
    }

    const loadAffiliatePl = async () => {
      try {
        const resp = await fetch(path);
        if (!resp.ok) return;
        const text = await resp.text();
        const rows = parseCsv(text);

        const parseCohortDate = (raw) => {
          if (!raw) return null;
          const datePart = raw.split(/[\sT]/)[0] || '';
          const parts = datePart.split('/').map((p) => Number(p));
          if (parts.length < 3) return null;
          const [a, b, c] = parts;
          const dayFirst = a > 12 || (a <= 12 && b <= 12 && a > b);
          const day = dayFirst ? a : b;
          const month = dayFirst ? b : a;
          const year = c;
          const d = new Date(year, (month || 1) - 1, day || 1);
          return Number.isNaN(d.getTime()) ? null : d;
        };

        const parsedRows = rows
          .map((row) => {
            const d = parseCohortDate(row['Cohort Date']);
            if (!d) return null;
            return {
              rawDate: row['Cohort Date'],
              date: d,
              absIdx: d.getFullYear() * 12 + d.getMonth(),
              affiliate: selectedAffiliate,
              cohortSize: cleanNumber(row['Cohort Size']),
              months: Array.from({ length: 12 }).map((_, k) => cleanNumber(row[`Month ${k}`])),
            };
          })
          .filter(Boolean);

        if (!parsedRows.length) return;

        const minAbsAll = Math.min(...parsedRows.map((r) => r.absIdx));
        const minAbsActive = Math.min(
          ...parsedRows
            .filter((r) => (r.cohortSize || 0) !== 0 || (r.months || []).some((v) => v && v !== 0))
            .map((r) => r.absIdx)
        );
        const minAbs = Number.isFinite(minAbsActive) ? minAbsActive : minAbsAll;

        const summaryMap = new Map();
        const detail = [];

        parsedRows.forEach((row) => {
          const relIdx = row.absIdx - minAbs;
          if (relIdx < 0) return;
          const monthsValues = row.months;

          const acc = summaryMap.get(relIdx) || {
            monthIndex: relIdx,
            cohortSize: 0,
            months: Array(12).fill(0),
          };
          acc.cohortSize += row.cohortSize;
          acc.months = acc.months.map((v, idx) => v + (monthsValues[idx] || 0));
          acc.m0 = (acc.m0 || 0) + (monthsValues[0] || 0);
          acc.m1 = (acc.m1 || 0) + (monthsValues[1] || 0);
          acc.m2 = (acc.m2 || 0) + (monthsValues[2] || 0);
          summaryMap.set(relIdx, acc);

          detail.push({
            monthIndex: relIdx,
            cohortDate: row.rawDate,
            affiliate: row.affiliate,
            cohortSize: row.cohortSize,
            months: monthsValues,
            m0: monthsValues[0] || 0,
            m1: monthsValues[1] || 0,
            m2: monthsValues[2] || 0,
          });
        });

        const summary = Array.from(summaryMap.values())
          .map((c) => ({
            ...c,
            m0: c.m0 || 0,
            m1: c.m1 || 0,
            m2: c.m2 || 0,
          }))
          .sort((a, b) => a.monthIndex - b.monthIndex);

        setCustomPl((prev) => {
          const next = new Map(prev);
          if (!next.has('base') && plSummary.length && plDetail.length) {
            next.set('base', { summary: plSummary, detail: plDetail });
          }
          next.set(selectedAffiliate, { summary, detail });
          return next;
        });
        setPlSummary(summary);
        setPlDetail(detail);
      } catch (err) {
        console.error('Failed to load affiliate PL file', err);
      }
    };

    loadAffiliatePl();
  }, [selectedAffiliate, customPl]);

  function cleanNumber(value) {
    if (value === null || value === undefined) return 0;
    const str = String(value).trim();
    if (!str) return 0;
    const num = Number(str.replace(/[$,]/g, ''));
    return Number.isNaN(num) ? 0 : num;
  }

  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines.length) return [];
    const headers = splitCsvLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i += 1) {
      const cols = splitCsvLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] ?? '';
      });
      rows.push(row);
    }
    return rows;
  }

  function splitCsvLine(line) {
    const out = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        out.push(current);
        current = '';
      } else {
        current += c;
      }
    }
    out.push(current);
    return out;
  }

  function clearAll() {
    setMonthlyData(() => {
      const base = {};
      inputMetrics.forEach((m) => (base[m] = Array(12).fill(0)));
      return base;
    });
  }

  const derivedSeries = useMemo(() => {
    const pl = months.map((_, idx) => {
      return plSeries[idx] || 0; // PL preso dal report PL Cohort Analysis
    });

    const active = months.map((_, idx) => {
      const users = monthlyData['Users'][idx] || 0;
      const churn = (monthlyData['Churn %'][idx] || 0) / 100;
      return users * (1 - churn);
    });

    return {
      'P&L': pl,
      'Active users': active,
    };
  }, [monthlyData, plSeries]);

  const selectionStartIdx = useMemo(() => getSelectionStart(selectedCohortMonth), [selectedCohortMonth]);

  const breakEvenStartIdx = useMemo(() => {
    const firstActive = () => {
      for (let i = selectionStartIdx; i < months.length; i += 1) {
        const users = monthlyData['Users'][i] || 0;
        const pnlVal = derivedSeries['P&L'][i] || 0;
        const comm = monthlyData['Commissions paid'][i] || 0;
        if (users !== 0 || pnlVal !== 0 || comm !== 0) return i;
      }
      return selectionStartIdx;
    };
    return firstActive();
  }, [selectionStartIdx, monthlyData, derivedSeries]);

  const breakEvenCurveFull = useMemo(() => {
    let plSum = 0;
    let paidSum = 0;
    return months.map((_, idx) => {
      if (idx < breakEvenStartIdx) return null;
      plSum += derivedSeries['P&L'][idx] || 0;
      paidSum += Math.abs(monthlyData['Commissions paid'][idx] || 0);
      return plSum - paidSum;
    });
  }, [derivedSeries, monthlyData, breakEvenStartIdx]);

  const breakEvenCurve = useMemo(() => {
    return breakEvenCurveFull.slice(breakEvenStartIdx).map((v) => v ?? 0);
  }, [breakEvenCurveFull, breakEvenStartIdx]);

  const breakEvenLabels = useMemo(() => months.slice(breakEvenStartIdx), [breakEvenStartIdx]);

  const breakEvenRow = breakEvenCurveFull;

  const lastBreakEvenValue = useMemo(() => {
    for (let i = breakEvenRow.length - 1; i >= 0; i -= 1) {
      const v = breakEvenRow[i];
      if (v !== null && v !== undefined) return v;
    }
    return null;
  }, [breakEvenRow]);

  const totals = useMemo(() => {
    const t = {};
    inputMetrics.forEach((m) => {
      t[m] = monthlyData[m].reduce((acc, v) => acc + (Number(v) || 0), 0);
    });
    derivedMetrics.forEach((m) => {
      t[m] = derivedSeries[m].reduce((acc, v) => acc + (Number(v) || 0), 0);
    });
    t.cohortCost = Math.abs(t['Commissions paid'] || 0) + Math.abs(t['Marketing spend'] || 0);
    return t;
  }, [monthlyData, derivedSeries]);

  const cohortUsers = totals['Users'] || 0;
  const cohortCPA =
    cohortUsers > 0 ? totals.cohortCost / cohortUsers : 0;
  const ltv =
    cohortUsers > 0 ? totals['P&L'] / cohortUsers : 0;
  const avgChurn =
    monthlyData['Churn %'].reduce(
      (acc, v) => acc + (Number(v) || 0),
      0
    ) / months.length || 0;

  const breakEvenIndex = breakEvenCurve.findIndex((v) => v >= 0);

  const breakEvenMonthsToHit = breakEvenIndex >= 0 ? breakEvenIndex + 1 : null;

  const roiValue = totals.cohortCost
    ? ((totals['P&L'] - totals.cohortCost) / totals.cohortCost) * 100
    : null;

  const netDepToCommission = (() => {
    const net = totals[cohortMetricDataKey] || 0;
    const comm = Math.abs(totals['Commissions paid'] || 0);
    if (!comm) return null;
    return net / comm;
  })();

  const breakEvenDisplay =
    breakEvenIndex >= 0
      ? `${breakEvenLabels[breakEvenIndex]} (${breakEvenMonthsToHit} mesi)`
      : 'ÔÇö';

  const displayKpis = {
    cohortUsers: kpiOverrides.cohortUsers ?? cohortUsers,
    activeUsers: kpiOverrides.activeUsers
      ?? Math.round(derivedSeries['Active users']?.reduce((acc, v) => acc + (v || 0), 0) || 0),
    marketingSpend: kpiOverrides.marketingSpend ?? Math.abs(totals['Marketing spend'] || 0),
    commissionsPaid: kpiOverrides.commissionsPaid ?? Math.abs(totals['Commissions paid'] || 0),
    cohortCost: kpiOverrides.cohortCost ?? (totals.cohortCost || 0),
    cpa: kpiOverrides.cpa ?? (cohortUsers ? Math.round(cohortCPA) : 0),
    ltv: kpiOverrides.ltv ?? (cohortUsers ? Math.round(ltv) : 0),
    avgChurn: kpiOverrides.avgChurn ?? avgChurn,
    breakEvenLabel: kpiOverrides.breakEvenLabel ?? breakEvenDisplay,
    roi: kpiOverrides.roi ?? roiValue,
    netDepToCommission: netDepToCommission,
  };

  const kpiInputStyle = {
    width: 90,
    background: '#0b1420',
    color: 'var(--text)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '6px 8px',
    fontSize: 12,
    textAlign: 'right',
  };

  const kpiLabelStyle = { fontSize: 12, color: '#94a3b8', display: 'block' };

  function generateLocalReport() {
    setReportLoading(true);
    const lines = [];
    lines.push(`Cohort size: ${formatNumberShort(displayKpis.cohortUsers)}`);
    lines.push(`${cohortMetricLabel} total: ${formatEuro(totals[cohortMetricDataKey] || 0)}`);
    lines.push(`Commissions paid: ${formatEuro(Math.abs(totals['Commissions paid'] || 0))}`);
    lines.push(`Marketing spend: ${formatEuro(Math.abs(totals['Marketing spend'] || 0))}`);
    lines.push(`P&L total: ${formatEuro(totals['P&L'] || 0)}`);
    lines.push(`Break-even: ${displayKpis.breakEvenLabel}`);
    lines.push(`Top month for P&L: ${months[derivedSeries['P&L'].indexOf(Math.max(...derivedSeries['P&L']))]}`);
    const quickInsight = breakEvenIndex >= 0
      ? `Quick insight: break-even in ~${breakEvenMonthsToHit} mesi (cohort selezionata).`
      : 'Quick insight: break-even non raggiunto entro il periodo osservato.';
    lines.push(quickInsight);
    setReportText(lines.join('\n'));
    setReportLoading(false);
  }

  const cohortKpiCards = useMemo(() => {
    const items = [
      {
        key: 'cohortUsers',
        label: 'Users',
        value: displayKpis.cohortUsers,
        formatter: (v) => formatNumberShort(Math.round(v || 0)),
        helper: 'Cohort size over 12 months',
        overrideKey: 'cohortUsers',
        type: 'count',
        hideIfZero: false,
      },
      {
        key: 'activeUsers',
        label: 'Active users',
        value: displayKpis.activeUsers,
        formatter: (v) => formatNumberShort(Math.round(v || 0)),
        helper: 'Users * (1 - churn) at month 12',
        overrideKey: 'activeUsers',
        type: 'count',
        hideIfZero: true,
      },
      {
        key: 'marketingSpend',
        label: 'Marketing spend',
        value: displayKpis.marketingSpend,
        formatter: (v) => formatEuro(Math.abs(v || 0)),
        helper: 'Total marketing mapped to cohort months',
        overrideKey: 'marketingSpend',
        type: 'currency',
        hideIfZero: true,
      },
      {
        key: 'commissionsPaid',
        label: 'Commissions paid',
        value: displayKpis.commissionsPaid,
        formatter: (v) => formatEuro(Math.abs(v || 0)),
        helper: 'From Balance Report, by acquisition month',
        overrideKey: 'commissionsPaid',
        type: 'currency',
        hideIfZero: true,
      },
      {
        key: 'netDepToCommission',
        label: `${cohortAnalysisMetric === 'deposits' ? 'Dep' : 'Net dep'} / Commission`,
        value: displayKpis.netDepToCommission,
        formatter: (v) => (v === null ? 'ÔÇö' : v.toFixed(2)),
        helper: 'If < 1.5: commission posticipata allÔÇÖaffiliato',
        overrideKey: null,
        type: 'ratio',
        hideIfZero: true,
      },
      {
        key: 'cohortCost',
        label: 'Cohort cost',
        value: displayKpis.cohortCost,
        formatter: (v) => formatEuro(Math.abs(v || 0)),
        helper: 'Marketing spend + Commissions paid',
        overrideKey: 'cohortCost',
        type: 'currency',
        hideIfZero: true,
      },
      {
        key: 'cpa',
        label: 'CPA',
        value: displayKpis.cpa,
        formatter: (v) => formatEuro(Math.abs(v || 0)),
        helper: 'Cohort cost / Users',
        overrideKey: 'cpa',
        type: 'currency',
        hideIfZero: true,
      },
      {
        key: 'ltv',
        label: 'LTV',
        value: displayKpis.ltv,
        formatter: (v) => formatEuro(Math.abs(v || 0)),
        helper: 'P&L / Users',
        overrideKey: 'ltv',
        type: 'currency',
        hideIfZero: true,
      },
      {
        key: 'avgChurn',
        label: 'Avg churn %',
        value: displayKpis.avgChurn,
        formatter: (v) => formatPercent(v),
        helper: 'Average monthly churn input',
        overrideKey: 'avgChurn',
        type: 'percent',
        hideIfZero: true,
      },
      {
        key: 'roi',
        label: 'ROI',
        value: displayKpis.roi,
        formatter: (v) => (v === null ? 'ÔÇö' : formatPercent(v)),
        helper: 'ROI = (P&L - Cohort cost) / Cohort cost',
        overrideKey: null,
        type: 'percent',
        hideIfZero: true,
      },
      {
        key: 'breakEvenLabel',
        label: 'Break-even month',
        value: displayKpis.breakEvenLabel,
        formatter: (v) => v,
        helper: 'First month where cumulative P&L - cumulative commissions ÔëÑ 0',
        overrideKey: 'breakEvenLabel',
        type: 'text',
        hideIfZero: false,
      },
    ];

    return items.filter((k) => !(k.hideIfZero && (!k.value || k.value === 0)));
  }, [displayKpis, cohortAnalysisMetric]);

  return (
    <div className="w-full px-4 py-6 space-y-8">
      <section className="card w-full">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-slate-200 m-0">Cohort financial pulse</h2>
            <p className="text-xs text-slate-400 m-0">{retainedMetricLabel} (%) shows how much Month 0 {cohortMetricLabel.toLowerCase()} remains over time.</p>
          </div>
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Metric</span>
              <select
                value={cohortAnalysisMetric}
                onChange={(e) => setCohortAnalysisMetric(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 min-w-[160px]"
              >
                <option value="netDeposits">Net deposits</option>
                <option value="deposits">Deposits</option>
                <option value="depositsCount">Number of deposits</option>
                <option value="withdrawals">Withdrawals</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Calendar year</span>
              <select
                value={selectedCalendarYear}
                onChange={(e) => setSelectedCalendarYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 min-w-[140px]"
              >
                <option value="all">All years</option>
                {cohortCalendar.years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Affiliate</span>
              <select
                value={selectedAffiliate}
                onChange={(e) => setSelectedAffiliate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 min-w-[180px]"
              >
                <option value="all">All affiliates</option>
                {affiliateOptionGroups.top.map((name) => (
                  <option key={`overview-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[{
            key: 'retainedM1',
            label: 'Retained Month 1',
            value: overviewKpis.avgRetainedM1,
            helper: `Primary metric: retained ${cohortMetricLabel.toLowerCase()} vs Month 0`,
          }, {
            key: 'retainedM3',
            label: 'Retained Month 3',
            value: overviewKpis.avgRetainedM3,
            helper: `Primary metric: retained ${cohortMetricLabel.toLowerCase()} vs Month 0`,
          }, {
            key: 'retainedM6',
            label: 'Retained Month 6',
            value: overviewKpis.avgRetainedM6,
            helper: `Primary metric: retained ${cohortMetricLabel.toLowerCase()} vs Month 0`,
          }, {
            key: 'health',
            label: 'Cohort health',
            value: overviewKpis.healthLabel,
            helper: 'Rule-based: retained value, half-life, lifetime',
          }].map((card) => {
            const isHealth = card.key === 'health';
            const formatted = card.value === null
              ? '—'
              : isHealth
                ? card.value
                : `${Number(card.value || 0).toFixed(1)}%`;
            const color = isHealth ? overviewKpis.healthTone : '#e2e8f0';
            return (
              <div key={card.key} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-1" title={card.helper}>
                <span className="text-xs text-slate-400">{card.label}</span>
                <span className="text-xl font-semibold" style={{ color }}>{formatted}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${overviewKpis.healthTone}22`, color: overviewKpis.healthTone, border: `1px solid ${overviewKpis.healthTone}55` }}>
              {overviewKpis.healthLabel}
            </span>
            <span className="text-sm font-semibold text-slate-200">Cohort health: {overviewKpis.healthLabel}</span>
          </div>

          <div>
            <div className="text-[11px] text-slate-400">WHY</div>
            <div className="text-sm text-slate-200">{overviewKpis.econ?.why || 'No cohort data available for this selection.'}</div>
          </div>

          <ul className="text-sm text-slate-200 list-disc pl-5">
            <li>
              {retainedMetricLabel}: M1 {overviewKpis.econ?.retainedM1 === null || overviewKpis.econ?.retainedM1 === undefined ? '—' : `${overviewKpis.econ.retainedM1.toFixed(1)}%`},
              {' '}M3 {overviewKpis.econ?.retainedM3 === null || overviewKpis.econ?.retainedM3 === undefined ? '—' : `${overviewKpis.econ.retainedM3.toFixed(1)}%`},
              {' '}M6 {overviewKpis.econ?.retainedM6 === null || overviewKpis.econ?.retainedM6 === undefined ? '—' : `${overviewKpis.econ.retainedM6.toFixed(1)}%`}
            </li>
            <li>
              Economic half-life: {(() => {
                const v = overviewKpis.econ?.halfLife;
                if (v === null || v === undefined) return 'not reached (retained stays above 50%)';
                const m = Math.max(1, Math.round(v));
                return `~${m} ${m === 1 ? 'month' : 'months'} (retained value falls below 50%)`;
              })()}
            </li>
            <li>
              Economic lifetime: {(() => {
                const v = overviewKpis.econ?.lifetime;
                if (v === null || v === undefined) return 'not reached (retained stays above 10%)';
                const m = Math.max(1, Math.round(v));
                return `~${m} ${m === 1 ? 'month' : 'months'} (retained value falls below 10%)`;
              })()}
            </li>
          </ul>

          {cohortMetricKind === 'currency' && overviewKpis.econ?.valueConcentration !== null && overviewKpis.econ?.valueConcentration !== undefined && (
            <div className="text-sm text-slate-200">
              Value concentration: {overviewKpis.econ.valueConcentration.toFixed(0)}% of total value generated in Month 0
            </div>
          )}

          <div className="text-sm text-slate-400">
            <span className="font-semibold text-slate-300">Meaning:</span> {overviewKpis.econ?.meaning || 'Interpretation not available.'}
          </div>
          <div className="text-sm text-slate-400">
            <span className="font-semibold text-slate-300">Next check:</span> {overviewKpis.econ?.nextCheck || 'Re-check M1 and M3 retained value.'}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <CohortDecayView
          rows={calendarView.rows}
          calendarEntries={calendarView.entries}
          startAbs={calendarView.startAbs}
          selectedAffiliate={selectedAffiliate}
          selectedYear={selectedCalendarYear}
          onYearChange={setSelectedCalendarYear}
          metricLabel={cohortMetricLabel}
          layout="split"
          showAverageLine
        />
      </section>

      <div className="grid grid-cols-1 gap-8 items-start dashboard-grid">
        {/* Legacy cohort inputs & reports */}
        <div className="space-y-4 w-full">
          <aside className="card w-full">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h2 style={{ fontSize: 14, margin: 0 }}>Cohort KPIs</h2>
                  <button
                    aria-label="Info cohort KPIs"
                    className="btn secondary"
                    style={{ padding: '2px 6px', height: 24, minWidth: 24 }}
                    onClick={() => setShowKpiInfo((v) => !v)}
                  >
                    i
                  </button>
                </div>
                <button
                  className="btn secondary"
                  style={{ padding: '4px 10px', height: 28 }}
                  onClick={() => setShowCohortKpisBlock((v) => !v)}
                >
                  {showCohortKpisBlock ? 'Hide' : 'Show'}
                </button>
              </div>

              {showCohortKpisBlock && (
                <>
                  {showKpiInfo && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: 8 }}>
                      Users = cohort size; Active users = users*(1-churn) cumulati; Marketing & Commissions mappati per mese di acquisizione; Cohort cost = marketing + commissions; CPA = cost/users; LTV = P&L/users; ROI = (P&L - cost)/cost; Net dep/Commission: se &lt; 1.5 le commissioni sono posticipate allÔÇÖaffiliato; Break-even = primo mese con cum. P&L - cum. commissions ÔëÑ 0.
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {cohortKpiCards.map((card) => {
                      const formatted = card.formatter ? card.formatter(card.value) : card.value;
                      const isNegative = typeof card.value === 'number' && card.value < 0;
                      const valueColor = (() => {
                        if (card.key === 'netDepToCommission') {
                          if (card.value === null) return '#cbd5e1';
                          return card.value < 1.5 ? '#fbbf24' : '#34d399';
                        }
                        if (card.type === 'currency' || card.type === 'percent') {
                          return isNegative ? '#f87171' : '#34d399';
                        }
                        return '#cbd5e1';
                      })();

                      return (
                        <div
                          key={card.key}
                          className="small-card"
                          style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, minHeight: 80 }}
                          title={card.helper}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <span style={kpiLabelStyle}>{card.label}</span>
                            <div style={{ fontWeight: 600, color: valueColor }} title={formatted}>
                              {formatted}
                            </div>
                          </div>
                          {card.helper && (
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                              {card.helper}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
          </aside>
        </div>

        {/* COLONNA 2: tabella + top affiliates */}
        <div className="space-y-4 w-full">
          <main className="card w-full">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h2 style={{ marginBottom: 4, marginTop: 0 }}>Monthly aggregates</h2>
                  <button
                    aria-label="Info sui dati"
                    className="btn secondary"
                    style={{ padding: '2px 6px', height: 26, minWidth: 26 }}
                    onClick={() => setShowMonthlyInfo((v) => !v)}
                  >
                    i
                  </button>
                </div>
                {showMonthlyInfo && (
                  <div
                    style={{
                      color: '#94a3b8',
                      fontSize: 12,
                      marginTop: 4,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      padding: '8px 10px',
                      borderRadius: 8,
                      maxWidth: 780,
                    }}
                  >
                    {cohortMetricLabel} e cohort size arrivano dal file di cohort selezionato; le commissioni pagate vengono prese dal Balance Report e assegnate al mese di acquisizione della cohort; il P&L ├¿ aggregato per data di first deposit (stessa logica delle cohort).
                  </div>
                )}
              </div>
              <button
                className="btn secondary"
                style={{ padding: '4px 10px', height: 28 }}
                onClick={() => setShowMonthlyAggregatesBlock((v) => !v)}
              >
                {showMonthlyAggregatesBlock ? 'Hide' : 'Show'}
              </button>
            </div>

            {showMonthlyAggregatesBlock && (
              <>
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  alignItems: 'flex-end',
                }}
              >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Cohort (mese FD)</span>
                <select
                  value={selectedCohortMonth ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all') return setSelectedCohortMonth('all');
                    const grouped = ['Q1', 'Q2', 'Q3', 'Q4', 'S1', 'S2'];
                    if (grouped.includes(val)) return setSelectedCohortMonth(val);
                    setSelectedCohortMonth(Number(val));
                  }}
                  disabled={!cohortsSummary.length}
                  style={{
                    minWidth: 200,
                    background: '#0b1420',
                    color: 'var(--text)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}
                >
                  {!cohortsSummary.length && (
                    <option value="" disabled>
                      Caricamento...
                    </option>
                  )}
                  <option value="all">Tutte le cohort</option>
                  <option value="Q1">Q1 (Jan-Mar)</option>
                  <option value="Q2">Q2 (Apr-Jun)</option>
                  <option value="Q3">Q3 (Jul-Sep)</option>
                  <option value="Q4">Q4 (Oct-Dec)</option>
                  <option value="S1">S1 (Jan-Jun)</option>
                  <option value="S2">S2 (Jul-Dec)</option>
                  {cohortsSummary.map((c) => (
                    <option key={c.monthIndex} value={c.monthIndex}>
                      {months[c.monthIndex]}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Affiliate</span>
                <select
                  value={selectedAffiliate}
                  onChange={(e) => setSelectedAffiliate(e.target.value)}
                  disabled={selectedCohortMonth === null}
                  style={{
                    minWidth: 220,
                    background: '#0b1420',
                    color: 'var(--text)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}
                >
                  <option value="all">Tutti nella cohort</option>
                  {affiliateOptionGroups.top.length === 0 && (
                    <option value="" disabled>
                      Nessun affiliato disponibile
                    </option>
                  )}
                  {affiliateOptionGroups.top.length > 0 && (
                    <optgroup label="Top 10">
                      {affiliateOptionGroups.top.map((name) => (
                        <option key={`top-${name}`} value={name}>
                          {name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 260 }}>
                La tabella viene popolata automaticamente con {cohortMetricLabel} e Cohort size della selezione.
              </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <table className="table w-full">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {months.map((m) => (
                      <th
                        key={m}
                        style={{ textAlign: 'center' }}
                        className="month-col"
                      >
                        {m}
                      </th>
                    ))}
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Active users first */}
                  {['Active users'].map((r) => (
                    <tr key={r}>
                      <td>{r}</td>
                      {months.map((m, idx) => (
                        <td key={m} style={{ textAlign: 'right', color: '#cbd5e1' }}>
                          <span title={formatNumberFull(Math.round(derivedSeries[r][idx] || 0))} className="num">
                            {formatNumberShort(Math.round(derivedSeries[r][idx] || 0))}
                          </span>
                        </td>
                      ))}
                      <td style={{ textAlign: 'right' }}>
                        <span title={formatNumberFull(Math.round(totals[r] || 0))} className="num">
                          {formatNumberShort(Math.round(totals[r] || 0))}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Input metrics without marketing spend */}
                  {inputMetrics.filter((r) => r !== 'Marketing spend').map((r) => (
                    <tr key={r}>
                      <td>{r === 'Net deposits' ? cohortMetricLabel : r}</td>
                      {months.map((m, idx) => (
                        <td key={m}>
                          <input
                            className="input-num"
                            type="number"
                            step={r === 'Churn %' ? '0.1' : '1'}
                            min={r === 'Churn %' ? '0' : undefined}
                            max={r === 'Churn %' ? '100' : undefined}
                            value={
                              r === 'Churn %'
                                ? monthlyData[r][idx]
                                : r === 'Commissions paid'
                                  ? Math.round(Math.abs(monthlyData[r][idx] || 0))
                                  : Math.round(monthlyData[r][idx] || 0)
                            }
                            title={
                              r === 'Churn %'
                                ? formatPercent(monthlyData[r][idx] || 0)
                                : r === 'Users'
                                  ? formatNumberFull(monthlyData[r][idx] || 0)
                                  : formatEuroFull(Math.abs(monthlyData[r][idx] || 0))
                            }
                            style={{
                              color:
                                r === 'Churn %'
                                  ? '#cbd5e1'
                                  : r === 'Users'
                                    ? '#cbd5e1'
                                    : (monthlyData[r][idx] || 0) >= 0
                                      ? '#34d399'
                                      : '#f87171',
                            }}
                            onChange={(e) =>
                              updateValue(r, idx, r === 'Commissions paid' ? -Math.abs(Number(e.target.value) || 0) : e.target.value)
                            }
                            readOnly={r === 'Commissions paid'}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'right' }}>
                        {r === 'Users'
                          ? (
                              <span title={formatNumberFull(totals[r] || 0)} className="num">
                                {formatNumberShort(totals[r] || 0)}
                              </span>
                            )
                          : r === 'Churn %'
                          ? (
                              <span title={formatPercent(avgChurn)} className="num">
                                {formatPercent(avgChurn)}
                              </span>
                            )
                          : (
                              <span
                                title={formatEuroFull(Math.abs(totals[r] || 0))}
                                className="num"
                                style={{
                                  color: '#34d399',
                                }}
                              >
                                {formatEuro(Math.abs(totals[r] || 0))}
                              </span>
                            )}
                      </td>
                    </tr>
                  ))}

                  {/* P&L row */}
                  {['P&L'].map((r) => (
                    <tr key={r}>
                      <td>{r}</td>
                      {months.map((m, idx) => (
                        <td
                          key={m}
                          style={{
                            textAlign: 'right',
                            color:
                              (derivedSeries[r][idx] || 0) >= 0
                                ? '#34d399'
                                : '#f87171',
                          }}
                        >
                          <span title={formatEuroFull(derivedSeries[r][idx] || 0)} className="num">
                            {formatEuro(
                              derivedSeries[r][idx] || 0
                            )}
                          </span>
                        </td>
                      ))}
                      <td style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            color:
                              (totals[r] || 0) >= 0
                                ? '#34d399'
                                : '#f87171',
                          }}
                          title={formatEuroFull(totals[r] || 0)}
                          className="num"
                        >
                          {formatEuro(totals[r] || 0)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Break-even cumulative: PL cumulato - commissioni paid cumulative */}
                  <tr>
                    <td>Break even</td>
                    {months.map((m, idx) => (
                      <td
                        key={m}
                        style={{
                          textAlign: 'right',
                          color:
                            breakEvenRow[idx] === null || breakEvenRow[idx] === undefined
                              ? '#94a3b8'
                              : (breakEvenRow[idx] || 0) >= 0
                                ? '#34d399'
                                : '#f87171',
                        }}
                      >
                        {breakEvenRow[idx] === null || breakEvenRow[idx] === undefined ? (
                          <span className="num" style={{ color: '#94a3b8' }}>ÔÇö</span>
                        ) : (
                          <span title={formatEuroFull(breakEvenRow[idx] || 0)} className="num">
                            {formatEuro(breakEvenRow[idx] || 0)}
                          </span>
                        )}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right' }}>
                      <span
                        style={{ color: (lastBreakEvenValue || 0) >= 0 ? '#34d399' : '#f87171' }}
                        title={lastBreakEvenValue === null ? undefined : formatEuroFull(lastBreakEvenValue || 0)}
                        className="num"
                      >
                        {lastBreakEvenValue === null ? 'ÔÇö' : formatEuro(lastBreakEvenValue || 0)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
              </>
            )}
          </main>

          {showCohortDbBlock && (
            <aside className="card w-full" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ margin: 0 }}>Cohort DB (CSV)</h3>
                <button
                  aria-label="Info Cohort DB"
                  className="btn secondary"
                  style={{ padding: '2px 6px', height: 24, minWidth: 24 }}
                  onClick={() => setShowCohortDbInfo((v) => !v)}
                >
                  i
                </button>
              </div>
              {showCohortDbInfo && (
                <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: 8 }}>
                  Seleziona un cohort (mese di first deposit) e applicalo ai Net deposits del dashboard (dati da Net deposits Cohort 2025.csv). P&L segue la stessa logica per data di first deposit.
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <button className="btn secondary" onClick={() => setShowCohortDb((v) => !v)}>
                  {showCohortDb ? 'Nascondi Cohort DB' : 'Mostra Cohort DB'}
                </button>
                <button className="btn secondary" onClick={() => setShowAffiliatesDetail((v) => !v)}>
                  {showAffiliatesDetail ? 'Nascondi Dettaglio affiliati' : 'Mostra Dettaglio affiliati'}
                </button>
              </div>

              {showCohortDb && (
                <div style={{ overflowX: 'auto', marginTop: 10 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mese FD</th>
                        <th style={{ textAlign: 'right' }}>Cohort size</th>
                        <th style={{ textAlign: 'right' }}>Month 0</th>
                        <th style={{ textAlign: 'right' }}>Month 1</th>
                        <th style={{ textAlign: 'right' }}>Month 2</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohortsSummary.map((c) => (
                        <tr key={c.monthIndex}>
                          <td>{months[c.monthIndex]}</td>
                          <td style={{ textAlign: 'right' }} title={formatNumberFull(c.cohortSize || 0)} className="num">{formatNumberShort(c.cohortSize || 0)}</td>
                          <td style={{ textAlign: 'right' }} title={formatEuroFull(c.m0 || 0)} className="num">{formatEuro(c.m0 || 0)}</td>
                          <td style={{ textAlign: 'right' }} title={formatEuroFull(c.m1 || 0)} className="num">{formatEuro(c.m1 || 0)}</td>
                          <td style={{ textAlign: 'right' }} title={formatEuroFull(c.m2 || 0)} className="num">{formatEuro(c.m2 || 0)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="radio"
                              name="cohort-month"
                              checked={selectedCohortMonth === c.monthIndex}
                              onChange={() => setSelectedCohortMonth(c.monthIndex)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showAffiliatesDetail && (
                <div style={{ marginTop: 10 }}>
                  <h4 style={{ margin: '8px 0 6px', color: '#cbd5e1' }}>Dettaglio affiliati (primi 15)</h4>
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Affiliate</th>
                          <th>Mese</th>
                          <th style={{ textAlign: 'right' }}>Size</th>
                          <th style={{ textAlign: 'right' }}>M0</th>
                          <th style={{ textAlign: 'right' }}>M1</th>
                          <th style={{ textAlign: 'right' }}>M2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohortDetailRows.slice(0, 15).map((r, idx) => (
                          <tr key={`${r.affiliate}-${idx}`}>
                            <td>{r.affiliate}</td>
                            <td>{months[r.monthIndex]}</td>
                            <td style={{ textAlign: 'right' }} title={formatNumberFull(r.cohortSize || 0)} className="num">{formatNumberShort(r.cohortSize || 0)}</td>
                            <td style={{ textAlign: 'right' }} title={formatEuroFull(r.m0 || 0)} className="num">{formatEuro(r.m0 || 0)}</td>
                            <td style={{ textAlign: 'right' }} title={formatEuroFull(r.m1 || 0)} className="num">{formatEuro(r.m1 || 0)}</td>
                            <td style={{ textAlign: 'right' }} title={formatEuroFull(r.m2 || 0)} className="num">{formatEuro(r.m2 || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>

        {/* COLONNA 3: grafici */}
        <div className="space-y-4 w-full flex flex-col items-end">
          <section className="w-full bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-slate-200 m-0">Break-even analysis</h3>
                <button
                  aria-label="Info break-even"
                  className="btn secondary"
                  style={{ padding: '2px 6px', height: 24, minWidth: 24 }}
                  onClick={() => setShowBreakEvenInfo((v) => !v)}
                >
                  i
                </button>
              </div>
              <button
                className="btn secondary"
                style={{ padding: '4px 10px', height: 28 }}
                onClick={() => setShowBreakEvenBlock((v) => !v)}
              >
                {showBreakEvenBlock ? 'Hide' : 'Show'}
              </button>
            </div>
            {showBreakEvenBlock && (
              <>
                {showBreakEvenInfo && (
                  <p className="text-xs text-slate-400 mb-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px' }}>
                    Formula: cumulative P&amp;L (da "PL Cohort Analysis.csv") meno cumulative Commissions paid (negative). Il break-even month ├¿ il primo indice in cui la curva diventa &gt;= 0.
                  </p>
                )}
                <div className="h-48 w-full flex justify-end">
                  <BreakEvenChart
                    beCurve={breakEvenCurve}
                    labels={breakEvenLabels}
                    breakEvenIndex={breakEvenIndex}
                  />
                </div>
              </>
            )}
          </section>

          <section className="w-full bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-medium text-slate-200 m-0">P&L trend</h3>
              <button
                className="btn secondary"
                style={{ padding: '4px 10px', height: 28 }}
                onClick={() => setShowPnLTrendBlock((v) => !v)}
              >
                {showPnLTrendBlock ? 'Hide' : 'Show'}
              </button>
            </div>
            {showPnLTrendBlock && (
              <div className="h-48 w-full flex justify-end">
                <PnLTrendChart
                  dataPoints={derivedSeries['P&L']}
                  labels={months}
                />
              </div>
            )}
          </section>

          <section className="w-full bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-medium text-slate-200 m-0">Top Performing Affiliates</h3>
              <button
                className="btn secondary"
                style={{ padding: '4px 10px', height: 28 }}
                onClick={() => setShowTopAffiliatesBlock((v) => !v)}
              >
                {showTopAffiliatesBlock ? 'Hide' : 'Show'}
              </button>
            </div>
            {showTopAffiliatesBlock && (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ minWidth: 380 }}>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th>Affiliate</th>
                    <th style={{ textAlign: 'right' }} title="Registrations">R</th>
                    <th style={{ textAlign: 'right' }} title="% Registrations">%R</th>
                    <th style={{ textAlign: 'right' }} title="P&amp;L">P</th>
                    <th style={{ textAlign: 'right' }} title="% P&amp;L">%P</th>
                    <th style={{ textAlign: 'center' }} title="ROI">ÔùÅ</th>
                  </tr>
                </thead>
                <tbody>
                  {topAffiliates.map((a, idx) => {
                    const roiPositive = true; // placeholder: show green dot only
                    return (
                      <tr key={`${a.affiliate}-${idx}`}>
                        <td>{idx + 1}</td>
                        <td style={{ color: '#60a5fa', fontWeight: 600 }}>{a.affiliate || 'ÔÇö'}</td>
                        <td style={{ textAlign: 'right' }} title={formatNumberFull(a.cohortSize || 0)} className="num">{formatNumberShort(a.cohortSize || 0)}</td>
                        <td style={{ textAlign: 'right' }} title={formatPercent(a.regPct)} className="num">{formatPercent(a.regPct)}</td>
                        <td style={{ textAlign: 'right' }} title={formatEuroFull(a.total || 0)} className="num">{formatEuro(a.total || 0)}</td>
                        <td style={{ textAlign: 'right' }} title={formatPercent(a.plPct)} className="num">{formatPercent(a.plPct)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              borderRadius: '999px',
                              background: roiPositive ? '#22c55e' : '#ef4444',
                            }}
                            title="ROI"
                          ></span>
                        </td>
                      </tr>
                    );
                  })}
                  {!topAffiliates.length && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>
                        Nessun affiliato disponibile per la selezione corrente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            )}
          </section>

          {showAutoReportBlock && (
            <section className="w-full bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium text-slate-200 m-0">Auto report</h3>
                <button
                  aria-label="Info auto report"
                  className="btn secondary"
                  style={{ padding: '2px 6px', height: 24, minWidth: 24 }}
                  onClick={() => setShowAutoReportInfo((v) => !v)}
                >
                  i
                </button>
              </div>
              {showAutoReportInfo && (
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 0, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: 8 }}>
                  Genera un breve riepilogo ora; in seguito potremo collegare OpenAI per commenti e next steps.
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <button className="btn" onClick={generateLocalReport} disabled={reportLoading}>
                  {reportLoading ? 'Generazione...' : 'Genera report locale'}
                </button>
                <button
                  className="btn secondary"
                  onClick={() => setReportText('')}
                >
                  Pulisci
                </button>
              </div>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Report pronto qui..."
                style={{
                  width: '100%',
                  minHeight: 120,
                  background: '#0b1420',
                  color: 'var(--text)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 12,
                  resize: 'vertical',
                }}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

