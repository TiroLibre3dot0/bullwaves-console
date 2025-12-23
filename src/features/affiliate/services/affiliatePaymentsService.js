// Lightweight CSV parsing and affiliate payments aggregation service
// Usage: import { buildAffiliatePaymentsMap } from './affiliatePaymentsService'

function splitCsvLine(line) {
  // split on commas not inside quotes
  return line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(s => {
    let v = s.trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    return v;
  });
}

function normalizeHeader(h) {
  return (h || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseNumber(v) {
  if (v == null || v === '') return 0;
  // remove thousands separators and non-numeric chars except dot and -
  const n = v.toString().replace(/[^0-9.\-]/g, '');
  const parsed = parseFloat(n);
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthKeyFromDateString(s) {
  const d = new Date(s);
  if (isNaN(d)) return 'unknown';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return await res.text();
}

async function loadCsv(path) {
  const txt = await fetchText(path);
  const lines = txt.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map(l => splitCsvLine(l));
  return { headers, rows };
}

function headerIndexMap(headers) {
  const map = {};
  headers.forEach((h, i) => { map[normalizeHeader(h)] = i; });
  return map;
}

function pickValue(row, hmap, candidates) {
  for (const cand of candidates) {
    const idx = hmap[normalizeHeader(cand)];
    if (idx != null && row[idx] != null && row[idx] !== '') return row[idx];
  }
  return '';
}

export async function buildAffiliatePaymentsMap(opts = {}) {
  // opts.paths can override default public CSV paths
  const regsPath = (opts.registrationsPath) || '/Registrations Report.csv';
  const paymentsPath = (opts.paymentsPath) || '/Payments Report.csv';

  const [regs, pays] = await Promise.all([loadCsv(regsPath), loadCsv(paymentsPath).catch(() => ({ headers: [], rows: [] }))]);

  const regsH = headerIndexMap(regs.headers);
  const paysH = headerIndexMap(pays.headers);

    const affiliateMap = new Map();

    // Preferred canonical column names (exact) for clarity
    const canonical = {
      total: ['Commissions'],
      affiliate: ['Affiliate Commissions', 'Affiliate Commission'],
      subAffiliate: ['Sub Affiliate Commissions', 'Sub Affiliate Commission', 'Sub-Affiliate Commissions'],
      cpa: ['CPA Commission', 'CPA Commissions'],
      cpl: ['CPL Commission', 'CPL Commissions'],
      revshare: ['Revshare Commission', 'Revshare Commissions', 'Rev Share Commission'],
      other: ['Other Commissions', 'Other Commission']
    }

    function pickCanonical(row, hmap, group) {
      const candidates = canonical[group] || [];
      for (const name of candidates) {
        const idx = hmap[normalizeHeader(name)];
        if (idx != null && row[idx] != null && row[idx] !== '') return parseNumber(row[idx]);
      }
      return null;
    }

  // Helper to ensure affiliate entry
  function ensureAffiliate(id, name) {
    const key = (id || name || '—').toString();
    if (!affiliateMap.has(key)) {
      affiliateMap.set(key, { id: key, name: name || '—', months: {}, totals: { total: 0, cpa: 0, revshare: 0, cpl: 0, subaffiliate: 0, other: 0, netDeposits: 0 } });
    }
    // if a name is provided later, update the stored name
    const rec = affiliateMap.get(key);
    if (name && name !== rec.name) rec.name = name;
    return rec;
  }

  // Process registrations for commission fields
  for (const row of regs.rows) {
    try {
      const affiliateId = pickValue(row, regsH, ['affiliateid', 'affiliate id', 'affiliate_id', 'affiliate']);
      const affiliateName = pickValue(row, regsH, ['affiliate', 'affiliate name', 'affiliatename']);

      const rec = ensureAffiliate(affiliateId || affiliateName, affiliateName || affiliateId);

      // possible commission fields
      // Prefer exact known CSV column names; keep fallbacks
      const totalCanon = pickCanonical(row, regsH, 'total');
      const revCanon = pickCanonical(row, regsH, 'revshare');
      const cpaCanon = pickCanonical(row, regsH, 'cpa');
      const cplCanon = pickCanonical(row, regsH, 'cpl');
      const affCanon = pickCanonical(row, regsH, 'affiliate');
      const subAffCanon = pickCanonical(row, regsH, 'subAffiliate');
      const otherCanon = pickCanonical(row, regsH, 'other');

      const total = (totalCanon != null) ? totalCanon : parseNumber(pickValue(row, regsH, ['Commissions', 'commissions', 'commissions_total', 'commission', 'totalcommissions']));
      const revshare = (revCanon != null) ? revCanon : parseNumber(pickValue(row, regsH, ['Revshare Commission', 'revsharecommission', 'revsharecommissions', 'revshare']));
      const cpa = (cpaCanon != null) ? cpaCanon : parseNumber(pickValue(row, regsH, ['CPA Commission', 'cpacommission', 'cpa commission', 'cpa', 'cpacommissions']));
      const cpl = (cplCanon != null) ? cplCanon : parseNumber(pickValue(row, regsH, ['CPL Commission', 'cplcommission', 'cplcommissionamount', 'cpl']));
      const affiliate = (affCanon != null) ? affCanon : parseNumber(pickValue(row, regsH, ['Affiliate Commissions', 'affiliatecommissions', 'affiliatecommissionsamount', 'affiliate commission', 'affiliate_commissions']));
      const subaffiliate = (subAffCanon != null) ? subAffCanon : parseNumber(pickValue(row, regsH, ['Sub Affiliate Commissions', 'subaffiliatecommissions', 'sub_affiliate_commissions', 'subaffiliates']));
      const other = (otherCanon != null) ? otherCanon : parseNumber(pickValue(row, regsH, ['Other Commissions', 'othercommissions', 'othercommission', 'other_commissions']));

      // effective CPA heuristic: if cpa==0 and affiliate>0, treat affiliate as cpa
      const effectiveCpa = (cpa !== 0) ? cpa : (affiliate !== 0 ? affiliate : 0);
      const effectiveAffiliate = (cpa !== 0) ? affiliate : 0; // hide affiliate when used as CPA

      const effectiveTotal = total > 0 ? total : (revshare + effectiveCpa + cpl + effectiveAffiliate + subaffiliate + other);

      // Net Deposits
      const netDeposits = parseNumber(pickValue(row, regsH, ['netdeposits', 'net deposits', 'net_deposits']));

      // date/month — try to pick a date field present
      const dateStr = pickValue(row, regsH, ['firstdepositdate', 'firstdeposit', 'depositdate', 'registrationdate', 'regdate', 'date']);
      const userId = pickValue(row, regsH, ['userid', 'user id', 'user', 'id', 'account', 'accountid', 'bullwavesid']) || '';
      const userName = pickValue(row, regsH, ['name', 'clientname', 'client name', 'fullname']) || '';
      const month = dateStr ? monthKeyFromDateString(dateStr) : 'unknown';

      if (!rec.months[month]) rec.months[month] = { total: 0, cpa: 0, revshare: 0, cpl: 0, subaffiliate: 0, other: 0, netDeposits: 0, contributors: [] };
      const m = rec.months[month];
      m.total += effectiveTotal;
      m.cpa += effectiveCpa;
      m.revshare += revshare;
      m.cpl += cpl;
      // affiliate commissions are treated as CPA (not kept as separate field)
      m.subaffiliate += subaffiliate;
      m.other += other;
      m.netDeposits += netDeposits;

      // track per-user contributor breakdown for drilldown
      m.contributors.push({ id: userId || '', name: userName || '', components: { total: effectiveTotal, cpa: effectiveCpa, revshare, cpl, subaffiliate, other, netDeposits } });

      rec.totals.total += effectiveTotal;
      rec.totals.cpa += effectiveCpa;
      rec.totals.revshare += revshare;
      rec.totals.cpl += cpl;
      rec.totals.subaffiliate += subaffiliate;
      rec.totals.other += other;
      rec.totals.netDeposits += netDeposits;
    } catch (e) {
      // ignore row parse errors
    }
  }

  // Process Payments Report for paid amounts per affiliate (monthly)
  for (const row of pays.rows) {
    try {
      const affiliateId = pickValue(row, paysH, ['affiliate id', 'affiliateid', 'affiliate_id', 'affiliate']);
      const affiliateName = pickValue(row, paysH, ['affiliate', 'affiliate name', 'affiliatename']);
      const amountStr = pickValue(row, paysH, ['payment amount', 'paymentamount', 'payment_amount', 'paymentamount']);
      const dateStr = pickValue(row, paysH, ['paymentdate', 'payment date', 'date']);

      const amount = parseNumber(amountStr);
      const month = dateStr ? monthKeyFromDateString(dateStr) : 'unknown';

      const rec = ensureAffiliate(affiliateId || affiliateName, affiliateName || affiliateId);
      if (!rec.months[month]) rec.months[month] = { total: 0, cpa: 0, revshare: 0, cpl: 0, subaffiliate: 0, other: 0 };
      rec.months[month].paid = (rec.months[month].paid || 0) + amount;
      rec.totals.paid = (rec.totals.paid || 0) + amount;
    } catch (e) {
      // ignore
    }
  }

  // convert map to plain object map
  const out = {};
  for (const [k, v] of affiliateMap.entries()) out[k] = v;
  return out;
}

export default { buildAffiliatePaymentsMap };
