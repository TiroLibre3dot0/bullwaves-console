import { UserFeatures } from './buildUserFeatures';
import { ModelId } from './buildTargets';

export interface FeatureMatrix {
  X: number[][];
  featureNames: string[];
}

function encodeTier(tier: UserFeatures['tier']): number {
  if (tier === 'high') return 2;
  if (tier === 'medium') return 1;
  return 0;
}

export function buildFeatures(model: ModelId, users: UserFeatures[]): FeatureMatrix {
  if (model === 'activity') {
    const featureNames = ['trader_points', 'total_volume', 'account_age_days', 'tier_encoded'];
    const X = users.map((u) => [u.trader_points, u.total_volume, u.account_age_days, encodeTier(u.tier)]);
    return { X, featureNames };
  }

  if (model === 'risk') {
    const featureNames = ['trader_points', 'avg_spread', 'positions_per_day', 'tier_encoded'];
    const X = users.map((u) => [u.trader_points, u.avg_spread, u.positions_per_day, encodeTier(u.tier)]);
    return { X, featureNames };
  }

  // model === 'retention'
  const featureNames = ['trader_points', 'positions_per_day', 'pnl_total', 'tier_encoded'];
  const X = users.map((u) => [u.trader_points, u.positions_per_day, u.pnl_total, encodeTier(u.tier)]);
  return { X, featureNames };
}
