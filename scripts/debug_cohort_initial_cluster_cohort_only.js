/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function cleanNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const s0 = String(value).trim();
  if (!s0) return 0;
  const s1 = s0.replace(/[€$\s]/g, '');
  const s2 = s1.replace(/%/g, '');
  const normalized = s2.replace(/,/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
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

function monthAbsToKey(abs) {
  const y = Math.floor(abs / 12);
  const m = abs % 12;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function computeInitialClusterCohortOnly(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const rows = Array.isArray(parsed.data) ? parsed.data : [];

  const totalsByAbs = new Map();
  const initialByAbs = new Map();
  let minAbs = Infinity;
  let maxAbs = -Infinity;

  for (const r of rows) {
    const dt = parseCohortDateString(r['Cohort Date']);
    if (!dt) continue;

    const baseAbs = dt.getFullYear() * 12 + dt.getMonth();
    const monthKeys = getMonthKeys(r);

    minAbs = Math.min(minAbs, baseAbs);
    maxAbs = Math.max(maxAbs, baseAbs);

    for (let i = 0; i < monthKeys.length; i++) {
      const v = cleanNumber(r[monthKeys[i]]);
      if (!v) continue;

      const abs = baseAbs + i;
      totalsByAbs.set(abs, (totalsByAbs.get(abs) || 0) + v);
      if (i === 0) initialByAbs.set(abs, (initialByAbs.get(abs) || 0) + v);

      minAbs = Math.min(minAbs, abs);
      maxAbs = Math.max(maxAbs, abs);
    }
  }

  const monthRows = [];
  let sumRatios = 0;
  let count = 0;

  for (let abs = minAbs; abs <= maxAbs; abs++) {
    const total = totalsByAbs.get(abs) || 0;
    if (!total) continue;

    const initial = initialByAbs.get(abs) || 0;
    const ratio = initial / total;
    if (!Number.isFinite(ratio)) continue;

    monthRows.push({
      key: monthAbsToKey(abs),
      initial,
      total,
      ratio,
    });

    sumRatios += ratio;
    count += 1;
  }

  const avgRatio = count ? sumRatios / count : null;

  return { monthRows, avgRatio, count, rowCount: rows.length };
}

function formatFixed(n) {
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(0);
}

function formatPct(ratio) {
  if (!Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(6)}%`;
}

function main() {
  const rel = process.argv[2] || 'public/Cohort Analysis per churn analysis Withdrawals since 2024.csv';
  const filePath = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);

  const { monthRows, avgRatio, count, rowCount } = computeInitialClusterCohortOnly(filePath);

  console.log(`File: ${path.relative(process.cwd(), filePath)}`);
  console.log(`Cohort rows: ${rowCount}`);
  console.log(`Calendar months used (total != 0): ${count}`);
  console.log('month\tinitial(M0)\tcohortTotal\tM0_share');

  for (const x of monthRows) {
    console.log(`${x.key}\t${formatFixed(x.initial)}\t${formatFixed(x.total)}\t${formatPct(x.ratio)}`);
  }

  console.log('');
  console.log(`Initial cluster (media delle medie): ${formatPct(avgRatio)}`);
}

main();
