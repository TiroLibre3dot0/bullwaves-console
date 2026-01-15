import { UserFeatures } from './buildUserFeatures';
import { buildFeatures } from './buildFeatures';
import { ModelId } from './buildTargets';

export interface ScenarioConfig {
  points_multiplier: number;
  required_points_to_unlock: number;
  bonus_amount: number;
  unlock_rate_pct: number;
  risk_guardrail_enabled: boolean;
  risk_threshold: number; // e.g. max allowed risk_proxy
}

export function simulateScenario(
  users: UserFeatures[],
  scenario: ScenarioConfig,
  regression?: any,
) {
  const epsilon = 1e-9;

  const usersWithScenarioPoints = users.map((u) => ({
    ...u,
    trader_points_sim: u.trader_points * scenario.points_multiplier,
  }));

  const riskProxy = (u: any) => Math.abs(u.pnl_total) / Math.max(u.total_volume || 0, epsilon);

  // Risk guardrail: exclude users above risk threshold from eligibility
  let guardrailEligible = usersWithScenarioPoints;
  let guardrailFilteredOut = 0;
  if (scenario.risk_guardrail_enabled) {
    guardrailEligible = usersWithScenarioPoints.filter((u) => riskProxy(u) <= scenario.risk_threshold);
    guardrailFilteredOut = usersWithScenarioPoints.length - guardrailEligible.length;
  }

  // Unlock eligibility by points threshold + unlock rate
  const unlockEligible = new Set(
    guardrailEligible.filter((u) => u.trader_points_sim >= scenario.required_points_to_unlock).map((u) => u.user_id),
  );

  const hash01 = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };

  const unlockRate = Math.max(0, Math.min(1, (scenario.unlock_rate_pct ?? 0) / 100));
  const unlocked = new Set<string>();
  for (const u of usersWithScenarioPoints) {
    if (!unlockEligible.has(u.user_id)) continue;
    const r = hash01(`${u.user_id}|${scenario.points_multiplier}|${scenario.required_points_to_unlock}|${scenario.unlock_rate_pct}`);
    if (r < unlockRate) unlocked.add(u.user_id);
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

  // If regression is missing/invalid, fall back to observed values.
  const predictModelAvg = (model: ModelId, useScenarioPoints: boolean): number => {
    const reg = regression?.[model];
    if (!reg?.ok || !reg.weights || !reg.featureNames || !reg.xStats || !reg.yStats) {
      if (model === 'activity') return avg(users.map((u) => u.positions_per_day));
      if (model === 'risk') return avg(users.map((u) => riskProxy(u)));
      return avg(users.map((u) => u.account_age_days));
    }

    const baseUsers = users;
    const scUsers = usersWithScenarioPoints.map((u) => ({
      ...u,
      trader_points: useScenarioPoints ? u.trader_points_sim : u.trader_points,
    }));

    const built = buildFeatures(model, scUsers as any);
    const Xraw = built.X;
    const rawFeatureNames = built.featureNames;
    const rawIndexByName = new Map<string, number>();
    for (let j = 0; j < rawFeatureNames.length; j++) rawIndexByName.set(rawFeatureNames[j], j);

    const yPred = Xraw.map((row: number[]) => {
      const xNorm = reg.featureNames.map((fname: string, k: number) => {
        const rawIdx = rawIndexByName.get(fname);
        const xj = rawIdx === undefined ? 0 : row[rawIdx];
        const s = reg.xStats[k];
        return s && s.std ? (xj - s.mean) / s.std : 0;
      });
      const yNorm = reg.intercept + xNorm.reduce((s: number, xk: number, k: number) => s + xk * (reg.weights[k] ?? 0), 0);
      return yNorm * (reg.yStats.std || 0) + reg.yStats.mean;
    });

    // Apply unlock gating: only unlocked users shift to scenario predictions.
    if (!useScenarioPoints) return avg(yPred);
    const baseBuilt = buildFeatures(model, baseUsers as any);
    const baseXraw = baseBuilt.X;
    const baseRawFeatureNames = baseBuilt.featureNames;
    const baseRawIndexByName = new Map<string, number>();
    for (let j = 0; j < baseRawFeatureNames.length; j++) baseRawIndexByName.set(baseRawFeatureNames[j], j);

    const basePred = baseXraw.map((row: number[]) => {
      const xNorm = reg.featureNames.map((fname: string, k: number) => {
        const rawIdx = baseRawIndexByName.get(fname);
        const xj = rawIdx === undefined ? 0 : row[rawIdx];
        const s = reg.xStats[k];
        return s && s.std ? (xj - s.mean) / s.std : 0;
      });
      const yNorm = reg.intercept + xNorm.reduce((s: number, xk: number, k: number) => s + xk * (reg.weights[k] ?? 0), 0);
      return yNorm * (reg.yStats.std || 0) + reg.yStats.mean;
    });

    const blended = usersWithScenarioPoints.map((u, i) => (unlocked.has(u.user_id) ? yPred[i] : basePred[i]));
    return avg(blended);
  };

  const baseline = {
    activity: predictModelAvg('activity', false),
    risk: predictModelAvg('risk', false),
    retention: predictModelAvg('retention', false),
  };

  const sim = {
    activity: predictModelAvg('activity', true),
    risk: predictModelAvg('risk', true),
    retention: predictModelAvg('retention', true),
  };

  return {
    baseline,
    sim,
    delta: {
      activity: sim.activity - baseline.activity,
      risk: sim.risk - baseline.risk,
      retention: sim.retention - baseline.retention,
    },
    filteredOutPct: usersWithScenarioPoints.length ? guardrailFilteredOut / usersWithScenarioPoints.length : 0,
    unlockEligiblePct: usersWithScenarioPoints.length ? unlockEligible.size / usersWithScenarioPoints.length : 0,
    unlockedPct: usersWithScenarioPoints.length ? unlocked.size / usersWithScenarioPoints.length : 0,
  };
}
