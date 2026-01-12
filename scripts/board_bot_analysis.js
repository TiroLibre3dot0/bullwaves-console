/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function cleanNumber(value) {
  if (value === null || value === undefined) return 0;
  const str = String(value).replace(/[€,]/g, '').trim();
  if (!str) return 0;
  const num = Number(str);
  return Number.isFinite(num) ? num : 0;
}

function parseMDY(dateTimeStr) {
  if (!dateTimeStr) return null;
  const raw = String(dateTimeStr).trim();
  if (!raw) return null;

  // Expected: M/D/YYYY or M/D/YYYY HH:mm:ss
  const [datePart, timePart] = raw.split(/\s+/);
  const parts = (datePart || '').split('/').map((p) => Number(p));
  if (parts.length < 3) return null;
  const [m, d, y] = parts;
  if (!Number.isFinite(m) || !Number.isFinite(d) || !Number.isFinite(y)) return null;

  let hh = 0;
  let mm = 0;
  let ss = 0;
  if (timePart) {
    const t = timePart.split(':').map((p) => Number(p));
    if (t.length >= 2) {
      hh = Number.isFinite(t[0]) ? t[0] : 0;
      mm = Number.isFinite(t[1]) ? t[1] : 0;
      ss = Number.isFinite(t[2]) ? t[2] : 0;
    }
  }

  const dt = new Date(y, m - 1, d, hh, mm, ss);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function quantile(sortedAsc, q) {
  if (!sortedAsc.length) return 0;
  const pos = (sortedAsc.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sortedAsc[base + 1];
  if (next === undefined) return sortedAsc[base];
  return sortedAsc[base] + rest * (next - sortedAsc[base]);
}

function median(sortedAsc) {
  return quantile(sortedAsc, 0.5);
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sum(values) {
  return values.reduce((a, b) => a + b, 0);
}

function countWhere(values, predicate) {
  let c = 0;
  for (const v of values) if (predicate(v)) c += 1;
  return c;
}

function fmtInt(n) {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Math.round(n));
}

function fmtMoney(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function safeKey(v) {
  const s = (v ?? '').toString().trim();
  return s || 'UNKNOWN';
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null && `${obj[key]}`.trim() !== '') return obj[key];
  }
  return undefined;
}

function parseCsvFile(filePath) {
  if (!fs.existsSync(filePath)) return { data: [], errors: [] };
  const text = fs.readFileSync(filePath, 'utf8');
  return Papa.parse(text, { header: true, skipEmptyLines: true });
}

function buildAffiliateNameMap(publicDir) {
  const map = new Map();

  // 1) Payments Report.csv: affiliate_id + affiliate
  const paymentsPath = path.join(publicDir, 'Payments Report.csv');
  const paymentsParsed = parseCsvFile(paymentsPath);
  for (const r of paymentsParsed.data || []) {
    const id = safeKey(pick(r, ['affiliate_id', 'Affiliate ID', 'Affiliate Id', 'AffiliateId']));
    const name = safeKey(pick(r, ['affiliate', 'Affiliate']));
    if (id !== 'UNKNOWN' && name !== 'UNKNOWN') map.set(id, name);
  }

  // 2) commissions.csv: Affiliate Id + Affiliate
  const commissionsPath = path.join(publicDir, 'commissions.csv');
  const commissionsParsed = parseCsvFile(commissionsPath);
  for (const r of commissionsParsed.data || []) {
    const id = safeKey(pick(r, ['Affiliate Id', 'Affiliate ID', 'affiliate_id', 'affiliateid']));
    const name = safeKey(pick(r, ['Affiliate', 'affiliate']));
    if (id !== 'UNKNOWN' && name !== 'UNKNOWN') map.set(id, name);
  }

  // 3) Media Report.csv (optional): affiliate name only (no id) -> can't map reliably.
  // Kept for future enrichment but not used for ID mapping here.

  return map;
}

function displayAffiliateName(affiliateId, affiliateName, affiliateNameMap) {
  const direct = (affiliateName ?? '').toString().trim();
  if (direct) return direct;
  const fromMap = affiliateNameMap.get(String(affiliateId));
  const mapped = (fromMap ?? '').toString().trim();
  return mapped || '(unknown)';
}

async function main() {
  const startArg = process.argv.find((a) => a.startsWith('--start='));
  const startDateStr = startArg ? startArg.split('=')[1] : '2024-01-01';
  const startDate = new Date(`${startDateStr}T00:00:00Z`);

  const fileArg = process.argv.find((a) => a.startsWith('--file='));
  const fileName = fileArg ? fileArg.split('=')[1] : 'Registrations Report.csv';
  const publicDir = path.resolve(__dirname, '..', 'public');
  const filePath = path.resolve(publicDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const affiliateNameMap = buildAffiliateNameMap(publicDir);

  const csvText = fs.readFileSync(filePath, 'utf8');

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors && parsed.errors.length) {
    console.error('PapaParse errors:', parsed.errors.slice(0, 5));
  }

  const rows = Array.isArray(parsed.data) ? parsed.data : [];

  const users = [];
  for (const r of rows) {
    const registrationDateRaw = pick(r, ['Registration Date', 'registration_date', 'RegistrationDate']);
    const regDt = parseMDY(registrationDateRaw);
    if (!regDt) continue;
    if (regDt < startDate) continue;

    const userId = safeKey(pick(r, ['User ID', 'user_id', 'UserId', 'userid']));
    const mt5 = safeKey(pick(r, ['MT5 Account', 'mt5_account', 'MT5Account', 'mt5account']));
    const affiliateId = safeKey(pick(r, ['Affiliate ID', 'affiliate_id', 'AffiliateId', 'affiliateid', 'Affiliate']));
    const affiliateName = affiliateNameMap.get(String(affiliateId)) || '';
    const country = safeKey(pick(r, ['Country', 'country']));

    const positionCount = cleanNumber(pick(r, ['Position Count', 'position_count', 'PositionCount', 'positioncount']));
    const pl = cleanNumber(pick(r, ['PL', 'pl']));
    const netPl = cleanNumber(pick(r, ['Net PL', 'NetPL', 'net_pl', 'netpl']));
    const netDeposits = cleanNumber(pick(r, ['Net Deposits', 'net_deposits', 'netdeposits']));

    users.push({
      userId,
      mt5,
      affiliateId,
      affiliateName,
      country,
      registrationDate: regDt,
      positionCount,
      pl,
      netPl,
      netDeposits,
    });
  }

  const traded = users.filter((u) => u.positionCount > 0);
  const posAll = users.map((u) => u.positionCount).sort((a, b) => a - b);
  const posTraded = traded.map((u) => u.positionCount).sort((a, b) => a - b);

  const p95 = quantile(posTraded, 0.95);
  const p99 = quantile(posTraded, 0.99);
  const aggressiveThreshold = p99;

  const aggressive = traded.filter((u) => u.positionCount >= aggressiveThreshold);
  const normal = traded.filter((u) => u.positionCount < aggressiveThreshold);

  const normalPositions = normal.map((u) => u.positionCount);
  const aggressivePositions = aggressive.map((u) => u.positionCount);
  const allTradedPositions = traded.map((u) => u.positionCount);

  const normalNetPL = normal.map((u) => u.netPl);
  const aggressiveNetPL = aggressive.map((u) => u.netPl);

  const aggressiveByAffiliate = new Map();
  for (const u of aggressive) {
    const key = u.affiliateId;
    const name = displayAffiliateName(key, u.affiliateName, affiliateNameMap);
    if (!aggressiveByAffiliate.has(key)) {
      aggressiveByAffiliate.set(key, {
        affiliateId: key,
        affiliateName: name,
        users: 0,
        positionsSum: 0,
        netDepositsSum: 0,
        plSum: 0,
        netPlSum: 0,
      });
    }
    const a = aggressiveByAffiliate.get(key);
    a.users += 1;
    a.positionsSum += u.positionCount;
    a.netDepositsSum += u.netDeposits;
    a.plSum += u.pl;
    a.netPlSum += u.netPl;
  }

  const topAffiliates = Array.from(aggressiveByAffiliate.values())
    .sort((a, b) => b.users - a.users || b.positionsSum - a.positionsSum)
    .slice(0, 10)
    .map((a) => ({
      ...a,
      avgPositions: a.users ? a.positionsSum / a.users : 0,
      avgNetPL: a.users ? a.netPlSum / a.users : 0,
      avgNetDeposits: a.users ? a.netDepositsSum / a.users : 0,
    }));

  const topActiveUsers = [...traded]
    .sort((a, b) => b.positionCount - a.positionCount)
    .slice(0, 27)
    .map((u) => ({
      userId: u.userId,
      mt5: u.mt5,
      affiliateId: u.affiliateId,
      affiliateName: displayAffiliateName(u.affiliateId, u.affiliateName, affiliateNameMap),
      country: u.country,
      registrationDate: u.registrationDate.toISOString().slice(0, 10),
      positions: u.positionCount,
      netDeposits: u.netDeposits,
      // IMPORTANT BUSINESS MEANING (per user instruction):
      // positive => Bullwaves gains; negative => trader gains.
      bullwavesEconomicResult: u.netPl,
    }));

  const report = {
    startDate: startDateStr,
    rowsParsed: rows.length,
    usersInScope: users.length,
    tradedUsers: traded.length,
    thresholds: {
      p95_traded_positions: p95,
      p99_traded_positions: p99,
      aggressive_threshold_positions: aggressiveThreshold,
    },
    normal: {
      users: normal.length,
      meanPositions: mean(normalPositions),
      medianPositions: median([...normalPositions].sort((a, b) => a - b)),
      positionsSum: sum(normalPositions),
      meanNetPL: mean(normalNetPL),
      netPLSum: sum(normalNetPL),
      netPLLossUsers: countWhere(normalNetPL, (v) => v < 0),
      netPLProfitUsers: countWhere(normalNetPL, (v) => v > 0),
      meanNetDeposits: mean(normal.map((u) => u.netDeposits)),
    },
    aggressive: {
      users: aggressive.length,
      meanPositions: mean(aggressivePositions),
      medianPositions: median([...aggressivePositions].sort((a, b) => a - b)),
      positionsSum: sum(aggressivePositions),
      meanNetPL: mean(aggressiveNetPL),
      netPLSum: sum(aggressiveNetPL),
      netPLLossUsers: countWhere(aggressiveNetPL, (v) => v < 0),
      netPLProfitUsers: countWhere(aggressiveNetPL, (v) => v > 0),
      meanNetDeposits: mean(aggressive.map((u) => u.netDeposits)),
      shareOfTradedUsers: traded.length ? aggressive.length / traded.length : 0,
      shareOfAllUsers: users.length ? aggressive.length / users.length : 0,
      shareOfAllPositions: sum(allTradedPositions) ? sum(aggressivePositions) / sum(allTradedPositions) : 0,
    },
    topAggressiveAffiliates: topAffiliates,
    top27MostActiveUsers: topActiveUsers,
    notes: {
      normalDefinition: 'Normal = traded users with Position Count < p99 (top 1% cutoff).',
      aggressiveDefinition: 'Aggressive = traded users with Position Count >= p99 among traded users.',
    },
  };

  // Markdown output (board-friendly raw material)
  console.log(`# Bot / EA activity analysis (since ${report.startDate})`);
  console.log('');
  console.log(`Data source: ${fileName} (rows: ${fmtInt(report.rowsParsed)})`);
  console.log(`Users in scope (registered since ${report.startDate}): ${fmtInt(report.usersInScope)}`);
  console.log(`Users with trades (Position Count > 0): ${fmtInt(report.tradedUsers)}`);
  console.log('');
  console.log('## Thresholds (Position Count, traded users only)');
  console.log(`- p95: ${fmtInt(report.thresholds.p95_traded_positions)}`);
  console.log(`- p99 (aggressive cutoff): ${fmtInt(report.thresholds.p99_traded_positions)}`);
  console.log('');
  console.log('## Normal vs Aggressive');
  console.log(`Normal (Position Count < p99): ${fmtInt(report.normal.users)} users`);
  console.log(`- Avg positions: ${fmtInt(report.normal.meanPositions)} | Median: ${fmtInt(report.normal.medianPositions)}`);
  console.log(`- Avg economic result (Bullwaves): ${fmtMoney(report.normal.meanNetPL)} | Avg Net Deposits: ${fmtMoney(report.normal.meanNetDeposits)}`);
  console.log(`- Users where Bullwaves gains (>0): ${fmtInt(report.normal.netPLProfitUsers)} | Users where trader gains (<0): ${fmtInt(report.normal.netPLLossUsers)} (total economic result: ${fmtMoney(report.normal.netPLSum)})`);
  console.log('');
  console.log(`Aggressive (Position Count >= p99): ${fmtInt(report.aggressive.users)} users (${(report.aggressive.shareOfTradedUsers * 100).toFixed(1)}% of traded)`);
  console.log(`- Avg positions: ${fmtInt(report.aggressive.meanPositions)} | Median: ${fmtInt(report.aggressive.medianPositions)}`);
  console.log(`- Avg economic result (Bullwaves): ${fmtMoney(report.aggressive.meanNetPL)} | Avg Net Deposits: ${fmtMoney(report.aggressive.meanNetDeposits)}`);
  console.log(`- Users where Bullwaves gains (>0): ${fmtInt(report.aggressive.netPLProfitUsers)} | Users where trader gains (<0): ${fmtInt(report.aggressive.netPLLossUsers)} (total economic result: ${fmtMoney(report.aggressive.netPLSum)})`);
  console.log(`- Position share (traded users): ${(report.aggressive.shareOfAllPositions * 100).toFixed(1)}% of all positions`);
  console.log('');
  console.log('## Top affiliates by aggressive users (top 10)');
  console.log('| Affiliate ID | Affiliate name | Aggressive users | Avg positions | Avg Net Deposits | Avg economic result (Bullwaves) |');
  console.log('|---:|---|---:|---:|---:|---:|');
  for (const a of report.topAggressiveAffiliates) {
    console.log(`| ${a.affiliateId} | ${(displayAffiliateName(a.affiliateId, a.affiliateName, affiliateNameMap)).replace(/\|/g, ' ')} | ${fmtInt(a.users)} | ${fmtInt(a.avgPositions)} | ${fmtMoney(a.avgNetDeposits)} | ${fmtMoney(a.avgNetPL)} |`);
  }

  console.log('');
  console.log('## Top 27 most active users (share with Chris)');
  console.log('Rule reminder: positive economic result => Bullwaves gains; negative => trader gains.');
  console.log('| User ID | MT5 | Affiliate ID | Affiliate name | Country | Reg date | Positions | Net Deposits | Economic result (Bullwaves) |');
  console.log('|---|---:|---:|---|---|---|---:|---:|---:|');
  for (const u of report.top27MostActiveUsers) {
    console.log(`| ${u.userId} | ${u.mt5} | ${u.affiliateId} | ${(displayAffiliateName(u.affiliateId, u.affiliateName, affiliateNameMap)).replace(/\|/g, ' ')} | ${u.country} | ${u.registrationDate} | ${fmtInt(u.positions)} | ${fmtMoney(u.netDeposits)} | ${fmtMoney(u.bullwavesEconomicResult)} |`);
  }

  // Also emit machine-readable JSON (to reuse later if needed)
  const outJson = path.resolve(__dirname, 'board_bot_analysis.output.json');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');
  console.error(`\nWrote ${outJson}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
