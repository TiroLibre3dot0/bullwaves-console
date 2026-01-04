const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function cleanNumber(value) {
  if (value === null || value === undefined) return 0;
  const str = String(value).replace(/[$,]/g, '').trim();
  if (!str) return 0;
  const num = Number(str);
  return Number.isNaN(num) ? 0 : num;
}

function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex).padStart(2, '0')}`;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function clamp01(v) {
  return clamp(v, 0, 1);
}

function parseMonthLabel(label) {
  const s = String(label || '').trim();
  const mdy = s.match(/^(\d{1,2})\s*\/\s*(\d{4})$/);
  if (mdy) {
    const m = Number(mdy[1]);
    const y = Number(mdy[2]);
    if (Number.isFinite(m) && Number.isFinite(y) && m >= 1 && m <= 12) {
      return { year: y, monthIndex: m - 1 };
    }
  }

  const name = s.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i);
  if (name) {
    const map = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const mi = map[String(name[1]).toLowerCase()];
    const y = Number(name[2]);
    if (Number.isFinite(mi) && Number.isFinite(y)) return { year: y, monthIndex: mi };
  }

  return { year: null, monthIndex: null };
}

function parsePaymentsDate(raw) {
  const s = String(raw || '').trim();
  // expected: MM/DD/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!Number.isFinite(mm) || !Number.isFinite(dd) || !Number.isFinite(yyyy)) return null;
  return { year: yyyy, monthIndex: mm - 1 };
}

function extractDepartmentBands(assumptionsPath) {
  const txt = fs.readFileSync(assumptionsPath, 'utf8');
  const start = txt.indexOf('export const departmentBands');
  if (start < 0) throw new Error('departmentBands not found');
  const braceStart = txt.indexOf('{', start);
  const braceEnd = txt.indexOf('}', braceStart);
  const body = txt.slice(braceStart + 1, braceEnd);

  const map = new Map();
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/\s*'([^']+)'\s*:\s*([0-9.]+)\s*,?/);
    if (!m) continue;
    map.set(m[1], Number(m[2]));
  }
  return map;
}

function estimatePersonnelTotal(orgChartPath, deptBands, defaultBand = 3600) {
  const txt = fs.readFileSync(orgChartPath, 'utf8');
  const re = /department\s*:\s*'([^']+)'/g;
  let match;
  let total = 0;
  let count = 0;
  while ((match = re.exec(txt))) {
    const dept = match[1];
    const band = deptBands.has(dept) ? deptBands.get(dept) : defaultBand;
    total += Number(band || 0);
    count += 1;
  }
  return { total, count };
}

function readCsv(filePath) {
  const csv = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors && parsed.errors.length) {
    // non-fatal: keep going
  }
  return parsed.data || [];
}

function buildActuals2025(mediaCsvPath, paymentsCsvPath) {
  const mediaRows = readCsv(mediaCsvPath);
  const payRows = readCsv(paymentsCsvPath);

  const mediaByMonth = new Map();
  for (const r of mediaRows) {
    const meta = parseMonthLabel(r.Month);
    if (meta.year !== 2025 || meta.monthIndex === null) continue;
    const key = monthKey(meta.year, meta.monthIndex);
    const acc = mediaByMonth.get(key) || { registrations: 0, ftd: 0, qftd: 0, revenue: 0 };
    acc.registrations += cleanNumber(r.Registrations || r.Leads);
    acc.ftd += cleanNumber(r.FTD);
    acc.qftd += cleanNumber(r.QFTD);
    acc.revenue += cleanNumber(r.PL);
    mediaByMonth.set(key, acc);
  }

  const payoutsByMonth = new Map();
  for (const r of payRows) {
    const meta = parsePaymentsDate(r.paymentdate || r.PaymentDate || r['Payment Date']);
    if (!meta || meta.year !== 2025) continue;
    const key = monthKey(meta.year, meta.monthIndex);
    const rawAmount = r.payment_amount ?? r['payment_amount'] ?? r['Payment amount'] ?? r.amount;
    const amt = Math.abs(cleanNumber(rawAmount));
    payoutsByMonth.set(key, (payoutsByMonth.get(key) || 0) + amt);
  }

  const months = [];
  for (let mi = 0; mi < 12; mi += 1) {
    const key = monthKey(2025, mi);
    const m = mediaByMonth.get(key) || { registrations: 0, ftd: 0, qftd: 0, revenue: 0 };
    const payouts = payoutsByMonth.get(key) || 0;
    months.push({ key, monthIndex: mi, year: 2025, ...m, payouts });
  }
  return months;
}

function deriveBaselinesFrom2025(actual2025) {
  const totals = actual2025.reduce(
    (acc, m) => {
      acc.registrations += m.registrations || 0;
      acc.ftd += m.ftd || 0;
      acc.qftd += m.qftd || 0;
      acc.revenue += m.revenue || 0;
      acc.payouts += m.payouts || 0;
      return acc;
    },
    { registrations: 0, ftd: 0, qftd: 0, revenue: 0, payouts: 0 },
  );

  const monthsWithData = actual2025.filter((m) => (m.registrations || m.ftd || m.qftd || m.revenue || m.payouts));
  const denom = monthsWithData.length || 1;
  const avgRegs = totals.registrations / denom;
  const avgFtd = totals.ftd / denom;
  const avgQftd = totals.qftd / denom;
  const avgRevenue = totals.revenue / denom;
  const avgPayout = totals.payouts / denom;

  const regToFtd = avgRegs ? avgFtd / Math.max(avgRegs, 1) : 0.18;
  const ftdToQftd = avgFtd ? avgQftd / Math.max(avgFtd, 1) : 0.7;
  const plPerFtd = avgFtd ? avgRevenue / Math.max(avgFtd, 1) : 280;
  const cpaPerQftd = avgQftd ? avgPayout / Math.max(avgQftd, 1) : 150;

  // seasonality index from positive revenue only; clamp 0.7–1.3.
  const values = actual2025.map((m) => {
    const rev = Number(m.revenue || 0);
    return Number.isFinite(rev) && rev > 0 ? rev : 0;
  });
  const positives = values.filter((v) => v > 0);
  const mean = positives.reduce((a, b) => a + b, 0) / Math.max(positives.length || 1, 1);
  const index = mean
    ? values.map((v) => clamp(v / mean, 0.7, 1.3))
    : Array(12).fill(1);

  return {
    totals,
    avgRegs,
    avgFtd,
    avgQftd,
    avgRevenue,
    avgPayout,
    regToFtd,
    ftdToQftd,
    plPerFtd,
    cpaPerQftd,
    seasonalityIndex: index,
  };
}

function forecastEbitda2026({ baselines, opexBaseWithoutDubai, dubaiMonthly, seasonalityStrength, scenario }) {
  const { avgRegs, regToFtd, ftdToQftd, plPerFtd, cpaPerQftd, seasonalityIndex } = baselines;

  const regGrowthMonthly = 1 + (scenario.regGrowth || 0);
  const convRegToFtd = clamp01((regToFtd || 0) * (scenario.regToFtdLift || 1));
  const convFtdToQftd = clamp01((ftdToQftd || 0) * (scenario.ftdToQftdLift || 1));
  const netPerFtd = Math.max(0, (plPerFtd || 0) * (scenario.netPerFtdLift || 1));
  const cpa = Math.max(0, (cpaPerQftd || 0) * (scenario.cpaPerQftdLift || 1));

  let total = 0;
  const monthly = [];
  for (let slot = 0; slot < 12; slot += 1) {
    const seasonBias = seasonalityIndex[slot] || 1;
    const seasonFactor = 1 + (seasonalityStrength || 0) * (seasonBias - 1);
    const growthFactor = Math.pow(regGrowthMonthly, slot + 1);

    const regs = Math.max(0, (avgRegs || 0) * growthFactor * seasonFactor);
    const ftd = Math.max(0, regs * convRegToFtd);
    const qftd = Math.max(0, ftd * convFtdToQftd);
    const revenue = Math.max(0, ftd * netPerFtd);
    const payouts = Math.max(0, qftd * cpa);
    const opex = (opexBaseWithoutDubai || 0) + (dubaiMonthly || 0);
    const ebitda = revenue - payouts - opex;

    monthly.push(ebitda);
    total += ebitda;
  }

  return { total, monthly };
}

function main() {
  const root = path.join(__dirname, '..');
  const assumptionsPath = path.join(root, 'src', 'features', 'executive-view', 'lib', 'assumptions.js');
  const orgChartPath = path.join(root, 'src', 'pages', 'orgChartData.js');
  const mediaCsvPath = path.join(root, 'public', 'Media Report.csv');
  const paymentsCsvPath = path.join(root, 'public', 'Payments Report.csv');

  const deptBands = extractDepartmentBands(assumptionsPath);
  const personnel = estimatePersonnelTotal(orgChartPath, deptBands, 3600);

  const tech = 18000 + 4500 + 6000;
  const legal = 9000 + 6500;
  const dubaiMonthly = 32000;

  const opexTotal = personnel.total + tech + legal + dubaiMonthly;
  const baseWithoutDubai = opexTotal - dubaiMonthly;

  const actual2025 = buildActuals2025(mediaCsvPath, paymentsCsvPath);
  const baselines = deriveBaselinesFrom2025(actual2025);

  const scenarios = {
    base: { regGrowth: 0.035, regToFtdLift: 1, ftdToQftdLift: 1, netPerFtdLift: 1.02, cpaPerQftdLift: 1 },
    conservative: { regGrowth: 0.015, regToFtdLift: 0.96, ftdToQftdLift: 0.95, netPerFtdLift: 0.96, cpaPerQftdLift: 1.05 },
    upside: { regGrowth: 0.06, regToFtdLift: 1.05, ftdToQftdLift: 1.04, netPerFtdLift: 1.08, cpaPerQftdLift: 0.96 },
  };

  const seasonalityStrength = 0.15;

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  console.log('--- Executive View: 2026 EBITDA (forecast) ---');
  console.log(`Personnel roles counted: ${personnel.count}`);
  console.log(`Personnel monthly total: ${fmt.format(personnel.total)}`);
  console.log(`OPEX base (ex Dubai) monthly: ${fmt.format(baseWithoutDubai)}`);
  console.log(`Dubai monthly: ${fmt.format(dubaiMonthly)}`);
  console.log('');

  for (const key of ['base', 'conservative', 'upside']) {
    const res = forecastEbitda2026({
      baselines,
      opexBaseWithoutDubai: baseWithoutDubai,
      dubaiMonthly,
      seasonalityStrength,
      scenario: scenarios[key],
    });
    console.log(`${key}: ${fmt.format(res.total)} (annual EBITDA)`);
  }
}

main();
