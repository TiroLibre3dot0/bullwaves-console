/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const COHORT_FILES_BY_METRIC = {
  netDeposits: ['Cohort Analysis per churn analysis Net Depositis since 2024.csv'],
  deposits: ['Cohort Analysis per churn analysis Deposits.csv'],
  depositsCount: ['Cohort Analysis per churn analysis deposits count since 2024.csv'],
  withdrawals: ['Cohort Analysis per churn analysis Withdrawals since 2024.csv'],
};

const MEDIA_FILES = ['Media Report.csv', '01012025 to 12072025 Media Report.csv'];

function readCsvRows(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const res = Papa.parse(text, { header: true, skipEmptyLines: true });
  return Array.isArray(res.data) ? res.data : [];
}

function cleanNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const s0 = String(value).trim();
  if (!s0) return 0;
  // Remove currency symbols and spaces
  const s1 = s0.replace(/[€$\s]/g, '');
  // Convert percent to number (keep as-is for our metrics; percent not expected here)
  const s2 = s1.replace(/%/g, '');
  // Handle comma as thousands separator
  const normalized = s2.replace(/,/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

function monthIndexFromName(rawName) {
  const s = String(rawName || '').trim().toLowerCase();
  if (!s) return -1;
  const abbr = s.slice(0, 3);
  const abbrIdx = MONTH_ABBR.map((m) => m.toLowerCase()).indexOf(abbr);
  if (abbrIdx >= 0) return abbrIdx;
  const longIdx = MONTH_LONG.indexOf(s);
  if (longIdx >= 0) return longIdx;
  return -1;
}

function parseMonthLabel(raw) {
  const s = String(raw || '').trim();
  if (!s) return { year: null, monthIndex: null, key: null };

  const isoMatch = s.match(/^\s*(\d{4})[\/-](\d{1,2})(?:[\/-](\d{1,2}))?\s*$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const monthIndex = Math.max(0, (Number(isoMatch[2]) || 1) - 1);
    if (Number.isFinite(year)) return { year, monthIndex, key: `${year}-${String(monthIndex).padStart(2, '0')}` };
  }

  const monthFirst = s.match(/^\s*(\d{1,2})[\/-](\d{4})\s*$/);
  if (monthFirst) {
    const monthIndex = Math.max(0, (Number(monthFirst[1]) || 1) - 1);
    const year = Number(monthFirst[2]);
    if (Number.isFinite(year)) return { year, monthIndex, key: `${year}-${String(monthIndex).padStart(2, '0')}` };
  }

  const yearFirst = s.match(/^\s*(\d{4})[\/-](\d{1,2})\s*$/);
  if (yearFirst) {
    const year = Number(yearFirst[1]);
    const monthIndex = Math.max(0, (Number(yearFirst[2]) || 1) - 1);
    if (Number.isFinite(year)) return { year, monthIndex, key: `${year}-${String(monthIndex).padStart(2, '0')}` };
  }

  const nameFirst = s.match(/^\s*([A-Za-z]+)\s+(\d{4})\s*$/);
  if (nameFirst) {
    const monthIndex = monthIndexFromName(nameFirst[1]);
    const year = Number(nameFirst[2]);
    if (monthIndex >= 0 && Number.isFinite(year)) return { year, monthIndex, key: `${year}-${String(monthIndex).padStart(2, '0')}` };
  }

  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) {
    const monthIndex = dt.getMonth();
    const year = dt.getFullYear();
    return { year, monthIndex, key: `${year}-${String(monthIndex).padStart(2, '0')}` };
  }

  return { year: null, monthIndex: null, key: null };
}

function parseCohortDateString(raw) {
  if (!raw) return null;
  const datePart = String(raw).split(/\s|T/)[0] || '';
  const parts = datePart.split('/').map((p) => Number(p));
  if (parts.length < 3) return null;
  const [m, d, y] = parts; // month-first
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function getMonthKeys(row) {
  return Object.keys(row)
    .filter((k) => /^Month\s+\d+$/i.test(k))
    .sort((a, b) => {
      const ai = Number((a.match(/\d+/) || [0])[0]);
      const bi = Number((b.match(/\d+/) || [0])[0]);
      return ai - bi;
    });
}

function loadMediaTotalsAll() {
  let mediaRows = null;
  let mediaPath = null;

  for (const name of MEDIA_FILES) {
    const p = path.join(PUBLIC_DIR, name);
    if (!fs.existsSync(p)) continue;
    mediaRows = readCsvRows(p);
    mediaPath = p;
    break;
  }

  if (!mediaRows) {
    throw new Error(`No Media Report CSV found in ${PUBLIC_DIR}`);
  }

  const totals = {
    netDeposits: new Map(),
    deposits: new Map(),
    depositsCount: new Map(),
    withdrawals: new Map(),
  };

  const monthAbsSet = new Set();
  let unknownMonthCount = 0;

  for (const r of mediaRows) {
    const meta = parseMonthLabel(r.Month ?? r.month);
    if (!meta.key || meta.year === null || meta.monthIndex === null) {
      unknownMonthCount += 1;
      continue;
    }

    const monthKey = meta.key;
    const abs = meta.year * 12 + meta.monthIndex;
    monthAbsSet.add(abs);

    const netDeposits = cleanNumber(r['Net Deposits'] ?? r.net_deposits ?? r.netdeposits);
    const deposits = cleanNumber(r.Deposits ?? r.deposits);
    const depositsCount = cleanNumber(
      r['Deposits Count'] ??
        r['Deposits count'] ??
        r['Deposit Count'] ??
        r.deposit_count ??
        r.deposits_count ??
        r.num_deposits ??
        r.depositcount
    );
    const withdrawals = cleanNumber(r.Withdrawals ?? r.withdrawals);

    totals.netDeposits.set(monthKey, (totals.netDeposits.get(monthKey) || 0) + netDeposits);
    totals.deposits.set(monthKey, (totals.deposits.get(monthKey) || 0) + deposits);
    totals.depositsCount.set(monthKey, (totals.depositsCount.get(monthKey) || 0) + depositsCount);
    totals.withdrawals.set(monthKey, (totals.withdrawals.get(monthKey) || 0) + withdrawals);
  }

  const monthAbs = Array.from(monthAbsSet).sort((a, b) => a - b);

  return {
    mediaPath,
    totals,
    monthAbs,
    unknownMonthCount,
    mediaRowCount: mediaRows.length,
  };
}

function loadCohortRows(metric) {
  const names = COHORT_FILES_BY_METRIC[metric] || [];
  for (const name of names) {
    const p = path.join(PUBLIC_DIR, name);
    if (!fs.existsSync(p)) continue;
    const rows = readCsvRows(p);
    const parsed = rows
      .map((row) => {
        const date = parseCohortDateString(row['Cohort Date']);
        if (!date) return null;
        const baseAbs = date.getFullYear() * 12 + date.getMonth();
        const monthKeys = getMonthKeys(row);
        const values = monthKeys.map((k) => {
          const n = cleanNumber(row[k]);
          if (metric === 'withdrawals') return Math.abs(n);
          return n;
        });
        return { baseAbs, values };
      })
      .filter(Boolean);

    return { path: p, rows: parsed };
  }
  throw new Error(`No cohort CSV found for metric=${metric} in ${PUBLIC_DIR}`);
}

function computeInitialClusterKpi({ cohortRows, totalsByKey, monthAbs }) {
  // KPI definition (mirrors app):
  // For each calendar month abs:
  //   denom = abs(total[monthKey])
  //   numer = sum_{cohorts} abs(value[offset]) where offset = abs - cohort.baseAbs
  // For Initial cluster (Month 0), offset===0.
  // share(abs) = numer / denom (only if denom != 0)
  // KPI = average share over all months.

  let monthsUsed = 0;
  let sumShare = 0;

  for (const abs of monthAbs) {
    const year = Math.floor(abs / 12);
    const monthIndex = abs % 12;
    const monthKey = `${year}-${String(monthIndex).padStart(2, '0')}`;
    const total = Math.abs(Number(totalsByKey.get(monthKey) || 0));
    if (!Number.isFinite(total) || total === 0) continue;

    let numer = 0;
    for (const row of cohortRows) {
      const offset = abs - row.baseAbs;
      if (offset !== 0) continue;
      const v = row.values?.[offset];
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      numer += Math.abs(n);
    }

    const share = numer / total;
    if (!Number.isFinite(share)) continue;
    monthsUsed += 1;
    sumShare += share;
  }

  if (!monthsUsed) return { monthsUsed: 0, avgPct: null };
  return { monthsUsed, avgPct: (sumShare / monthsUsed) * 100 };
}

function main() {
  const media = loadMediaTotalsAll();
  console.log('Media file:', path.basename(media.mediaPath));
  console.log('Media rows:', media.mediaRowCount, '| unknown Month rows:', media.unknownMonthCount);
  console.log('Calendar months:', media.monthAbs.length);

  for (const metric of Object.keys(COHORT_FILES_BY_METRIC)) {
    const cohort = loadCohortRows(metric);
    const totalsByKey = media.totals[metric];
    const kpi = computeInitialClusterKpi({ cohortRows: cohort.rows, totalsByKey, monthAbs: media.monthAbs });

    console.log('\nMETRIC:', metric);
    console.log('Cohort file:', path.basename(cohort.path));
    console.log('Cohort rows:', cohort.rows.length);
    console.log('Initial cluster (Month 0) avg:', kpi.avgPct === null ? '—' : `${kpi.avgPct.toFixed(6)}%`, '| months used:', kpi.monthsUsed);
  }
}

main();
