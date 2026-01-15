// User-centric dataset for simulation.
// Primary source: Support → User Check index (`/support_users_index.json`) via `loadCsvRows()`.
// Fallback: deterministic mock generator (useful in dev when reports are missing).

import {
  loadCsvRows,
  computeActivityIntelligence,
} from '../../support/services/supportUserCheckServiceTyped'

export interface UserData {
  user_id: string;
  customer_name?: string;
  email?: string;
  mt5_account?: string;
  account_age_days: number;
  qualified_age_days?: number;
  ppd_age_days_used?: number;
  first_deposit_date?: string;
  qualification_date?: string;
  total_volume: number;
  total_lots: number;
  position_count: number;
  positions_per_day: number;
  avg_spread: number;
  pnl_total: number;
  roi: number;
  deposits_count: number;
  total_deposits: number;
  net_cash_flow: number;
  withdrawal_ratio: number;
  tier: 'low' | 'medium' | 'high';
  potential_bot_flag: boolean;
  affiliate_id?: string;
}

function digitsOnly(s: unknown): string {
  if (s == null) return ''
  const d = String(s).replace(/\D+/g, '')
  return d || ''
}

function toNum(x: unknown): number {
  if (x === null || x === undefined) return 0
  const n = Number(String(x).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(n) ? n : 0
}

function toInt(x: unknown): number {
  const n = Math.trunc(toNum(x))
  return Number.isFinite(n) ? n : 0
}

function normalizeRoi(raw: unknown): number {
  const n = toNum(raw)
  if (!Number.isFinite(n)) return 0
  // Support report can be either ratio (0.12) or percent (12 / 12%).
  return Math.abs(n) > 1 ? n / 100 : n
}

function mapTier(intelTier: unknown): UserData['tier'] {
  const t = String(intelTier || '').toLowerCase().trim()
  if (t === 'high' || t === 'hyper') return 'high'
  if (t === 'active') return 'medium'
  return 'low'
}

function parseFlexibleDate(raw: unknown): Date | null {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null

  // Fast path: ISO / Date.parse-compatible
  const t = Date.parse(s)
  if (Number.isFinite(t)) return new Date(t)

  // Common CSV formats: dd/mm/yyyy or mm/dd/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+.*)?$/)
  if (m) {
    const a = parseInt(m[1], 10)
    const b = parseInt(m[2], 10)
    let y = parseInt(m[3], 10)
    if (y < 100) y = 2000 + y

    // Heuristic:
    // - if a > 12 -> dd/mm
    // - else if b > 12 -> mm/dd
    // - else ambiguous -> default dd/mm (EU-style exports)
    let day = a
    let month = b
    if (a <= 12 && b > 12) {
      month = a
      day = b
    }
    const dt = new Date(y, month - 1, day)
    if (Number.isFinite(dt.getTime())) return dt
  }

  return null
}

function daysSince(rawDate: unknown, now: Date): number | null {
  const dt = parseFlexibleDate(rawDate)
  if (!dt) return null
  const ms = now.getTime() - dt.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (!Number.isFinite(days)) return null
  return Math.max(1, days)
}

export async function loadUsersDataFromSupportUserCheck(): Promise<UserData[]> {
  const rows: any[] = await loadCsvRows(false)
  const now = new Date()

  const users: UserData[] = []
  for (const row of rows || []) {
    const userIdRaw = row?.userid ?? row?.user_id ?? row?.user
    const user_id = digitsOnly(userIdRaw) || String(userIdRaw || '').trim()
    if (!user_id) continue

    const customer_name = row?.customername ? String(row.customername).trim() : ''
    const email = row?.email ? String(row.email).trim() : ''
    const mt5_account = row?.mt5account ? String(row.mt5account).trim() : ''

    const intel: any = computeActivityIntelligence(row, now)

    const total_deposits = toNum(row?.totaldeposits)
    const net_deposits = toNum(row?.netdeposits)
    const withdrawals = toNum(row?.withdrawals)
    const pnl_total = toNum(row?.pl)

    const account_age_days = typeof intel?.ageDays === 'number' ? intel.ageDays : toInt(intel?.ageDays)
    const position_count = typeof intel?.positions === 'number' ? intel.positions : toInt(row?.positioncount)

    // IMPORTANT: to avoid underestimating activity, compute PPD from the trader-qualified period when possible.
    // Prefer qualification date, then first deposit date, then fall back to registration-based age.
    const qualifiedAgeDays =
      daysSince(row?.qualificationdate, now) ?? daysSince(row?.firstdeposit, now) ?? null
    const baseAgeForPpd = qualifiedAgeDays ?? account_age_days
    const positions_per_day =
      baseAgeForPpd > 0 ? position_count / Math.max(baseAgeForPpd, 1) : (typeof intel?.positionsPerDay === 'number' ? intel.positionsPerDay : 0)

    const withdrawal_ratio = total_deposits > 0 ? withdrawals / Math.max(total_deposits, 1) : 0
    const net_cash_flow = net_deposits !== 0 ? net_deposits + pnl_total : total_deposits - withdrawals + pnl_total

    users.push({
      user_id,
      customer_name: customer_name || undefined,
      email: email || undefined,
      mt5_account: mt5_account || undefined,
      account_age_days: account_age_days || 0,
      qualified_age_days: qualifiedAgeDays ?? undefined,
      ppd_age_days_used: baseAgeForPpd || undefined,
      first_deposit_date: row?.firstdeposit ? String(row.firstdeposit).trim() : undefined,
      qualification_date: row?.qualificationdate ? String(row.qualificationdate).trim() : undefined,
      total_volume: toNum(row?.volume),
      total_lots: toNum(row?.lots),
      position_count: position_count || 0,
      positions_per_day: positions_per_day || 0,
      avg_spread: toNum(row?.spread),
      pnl_total,
      roi: normalizeRoi(row?.roi),
      deposits_count: toInt(row?.depositcount),
      total_deposits,
      net_cash_flow,
      withdrawal_ratio,
      tier: mapTier(intel?.tier),
      potential_bot_flag: Boolean(intel?.isPotentialBot),
      affiliate_id: row?.affiliateid ? String(row.affiliateid).trim() : undefined,
    })
  }

  return users
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng: () => number): number {
  // Box–Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

// Deterministic mock data (fallback).
export function getUsersData(count: number = 800, seed: number = 1337): UserData[] {
  const rng = mulberry32(seed);
  const users: UserData[] = [];

  for (let i = 0; i < count; i++) {
    const user_id = `U${String(i + 1).padStart(5, '0')}`;

    // Tier distribution
    const p = rng();
    const tier: UserData['tier'] = p < 0.7 ? 'low' : p < 0.95 ? 'medium' : 'high';
    const tierBoost = tier === 'high' ? 1.8 : tier === 'medium' ? 1.25 : 1.0;

    // Account age (days)
    const account_age_days = Math.floor(clamp(30 + rng() * 1200 + randn(rng) * 50, 7, 2000));

    // Deposits
    const deposits_count = Math.floor(clamp((tier === 'low' ? 1 : tier === 'medium' ? 2 : 4) + randn(rng) * 1.2, 0, 12));
    const avgDeposit = (tier === 'high' ? 1500 : tier === 'medium' ? 700 : 250) * clamp(1 + randn(rng) * 0.25, 0.3, 2.5);
    const total_deposits = Math.max(0, deposits_count * avgDeposit);

    // Activity
    const positions_per_day = clamp(
      (tier === 'high' ? 4.5 : tier === 'medium' ? 1.8 : 0.7) * clamp(1 + randn(rng) * 0.35, 0.1, 3.0),
      0.05,
      25,
    );
    const position_count = Math.floor(clamp(positions_per_day * account_age_days * clamp(1 + randn(rng) * 0.15, 0.6, 1.6), 1, 150000));

    // Volume / lots (roughly correlated with activity + deposits)
    const total_lots = clamp(
      (position_count / 40) * tierBoost * clamp(1 + randn(rng) * 0.3, 0.2, 3.0),
      0,
      250000,
    );
    const total_volume = Math.max(0, total_lots * 1000 * clamp(1 + randn(rng) * 0.2, 0.3, 2.0));

    // Execution quality
    const avg_spread = clamp(0.08 + (tier === 'low' ? 0.04 : tier === 'medium' ? 0.02 : 0.01) + Math.abs(randn(rng)) * 0.03, 0.02, 0.6);

    // PnL model: noisy, weakly tied to volume and spread
    const pnlNoise = randn(rng);
    const edge = (tier === 'high' ? 0.000012 : tier === 'medium' ? 0.000006 : 0.000002);
    const pnl_total = total_volume * edge * clamp(1 + pnlNoise * 0.9, -2.5, 2.5) - total_volume * avg_spread * 0.000001;
    const roi = total_deposits > 0 ? pnl_total / total_deposits : 0;

    // Cash flow
    const withdrawal_ratio = clamp((tier === 'low' ? 0.12 : tier === 'medium' ? 0.22 : 0.35) + randn(rng) * 0.08, 0, 0.95);
    const total_withdrawals = total_deposits * withdrawal_ratio;
    const net_cash_flow = total_deposits - total_withdrawals + clamp(pnl_total, -total_deposits, total_deposits);

    // Potential bot flag: more likely for extreme positions/day and tight spread
    const potential_bot_flag = positions_per_day > 12 && avg_spread < 0.12 ? rng() < 0.45 : rng() < 0.02;

    users.push({
      user_id,
      account_age_days,
      total_volume,
      total_lots,
      position_count,
      positions_per_day,
      avg_spread,
      pnl_total,
      roi,
      deposits_count,
      total_deposits,
      net_cash_flow,
      withdrawal_ratio,
      tier,
      potential_bot_flag,
      affiliate_id: rng() < 0.35 ? `AFF${String(Math.floor(rng() * 50) + 1).padStart(2, '0')}` : undefined,
    });
  }

  return users;
}
