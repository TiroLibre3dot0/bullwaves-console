import { UserFeatures } from './buildUserFeatures';

export type ModelId = 'activity' | 'risk' | 'retention';

export function buildTargets(model: ModelId, users: UserFeatures[]): number[] {
  const epsilon = 1e-9;

  if (model === 'activity') {
    // Target: positions_per_day (stable, not cumulative)
    return users.map((u) => u.positions_per_day);
  }

  if (model === 'risk') {
    // Target: risk_proxy = abs(pnl_total) / total_volume
    return users.map((u) => Math.abs(u.pnl_total) / Math.max(u.total_volume, epsilon));
  }

  // model === 'retention'
  // Target: account_age_days
  return users.map((u) => u.account_age_days);
}
