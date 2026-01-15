import { UserData } from '../data/getUsersData';

export interface TraderPointsConfig {
  w1: number;
  w2: number;
  w3: number;
  w4: number;
  w5: number;
  scale?: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export function normalize(values: number[], clampOutliers: boolean = true): (v: number) => number {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  const min = clampOutliers ? percentile(sorted, 0.05) : Math.min(...sorted);
  const max = clampOutliers ? percentile(sorted, 0.95) : Math.max(...sorted);
  return (v: number) => {
    const vv = Number.isFinite(v) ? v : 0;
    let x = vv;
    if (clampOutliers) x = Math.max(min, Math.min(max, x));
    let norm = (x - min) / (max - min || 1);
    norm = Math.max(0, Math.min(1, norm));
    return norm;
  };
}

export function computeTraderPoints(users: UserData[], config: TraderPointsConfig) {
  // NOTE on leakage:
  // To keep regressions honest, trader_points must not directly include regression targets.
  // We therefore avoid using positions_per_day (activity target) and account_age_days (retention target)
  // in the trader points computation.

  const scale = config.scale ?? 5000;

  // Normalizers (percentile-clamped)
  const normVolume = normalize(users.map(u => u.total_volume));
  const normPosCount = normalize(users.map(u => u.position_count));
  const normLots = normalize(users.map(u => u.total_lots));
  const normDeposits = normalize(users.map(u => u.total_deposits));

  return users.map(u => {
    const raw =
      config.w1 * normVolume(u.total_volume) +
      config.w2 * normPosCount(u.position_count) +
      config.w3 * normLots(u.total_lots) +
      config.w4 * normDeposits(u.total_deposits) -
      (u.potential_bot_flag ? config.w5 : 0);

    const points = Math.max(0, raw) * scale;
    return { ...u, trader_points: points };
  });
}
// "Symbol exposure is modeled at market level, not individual user level."
