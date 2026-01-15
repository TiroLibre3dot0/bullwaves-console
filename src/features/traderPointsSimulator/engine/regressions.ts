import { UserFeatures } from './buildUserFeatures';
import { buildFeatures } from './buildFeatures';
import { buildTargets, ModelId } from './buildTargets';
import { normalizeDataset } from './normalize';
import { fitOLS } from './regressionOLS';
import { evaluateRegression, predict } from './evaluateRegression';

export interface RegressionResult {
  r2: number | null;
  mae: number;
  intercept: number;
  weights: number[];
  featureNames: string[];
  xStats: { mean: number; std: number }[];
  yStats: { mean: number; std: number };
  ok: boolean;
  warnings: string[];
  lowConfidence: boolean;
  droppedFeatureNames: string[];
}

function hashToUnitInterval(input: string): number {
  // Simple deterministic hash -> [0,1)
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // >>> 0 to ensure unsigned
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

function splitByUserId(users: UserFeatures[], testRatio = 0.2): { train: UserFeatures[]; test: UserFeatures[] } {
  const train: UserFeatures[] = [];
  const test: UserFeatures[] = [];
  for (const u of users) {
    const r = hashToUnitInterval(u.user_id);
    if (r < testRatio) test.push(u);
    else train.push(u);
  }
  // Fallback: if split collapses, do a simple cut.
  if (train.length === 0 || test.length === 0) {
    const sorted = [...users].sort((a, b) => a.user_id.localeCompare(b.user_id));
    const cut = Math.floor(sorted.length * (1 - testRatio));
    return { train: sorted.slice(0, cut), test: sorted.slice(cut) };
  }
  return { train, test };
}

function runModel(users: UserFeatures[], model: ModelId): RegressionResult {
  const warnings: string[] = [];

  const { train, test } = splitByUserId(users, 0.2);

  const { X: trainXRaw, featureNames } = buildFeatures(model, train);
  const trainYRaw = buildTargets(model, train);

  const { X: testXRaw } = buildFeatures(model, test);
  const testYRaw = buildTargets(model, test);

  // Ensure target variance exists (at least in train). If not, we still fit but r2 will be null.
  if (trainYRaw.length === 0 || testYRaw.length === 0) {
    warnings.push('Insufficient data after split');
    return {
      r2: null,
      mae: 0,
      intercept: 0,
      weights: [],
      featureNames: [],
      xStats: [],
      yStats: { mean: 0, std: 0 },
      ok: false,
      warnings,
      lowConfidence: true,
      droppedFeatureNames: [],
    };
  }

  const norm = normalizeDataset(trainXRaw, testXRaw, trainYRaw, testYRaw, featureNames);
  if (norm.droppedFeatureNames.length) {
    warnings.push(`Dropped constant features: ${norm.droppedFeatureNames.join(', ')}`);
  }
  if (norm.yStats.std === 0) {
    warnings.push('Target has no variance in train set (std=0); R² will be null');
  }

  const fitRes = fitOLS(norm.trainY, norm.trainX);
  if (!fitRes.ok || !fitRes.fit) {
    warnings.push(`OLS invalid (${fitRes.error || 'unknown error'})`);
    console.warn(`[TraderPointsSimulator][regression:${model}] OLS failed:`, fitRes.error);
    return {
      r2: null,
      mae: 0,
      intercept: 0,
      weights: [],
      featureNames: norm.featureNames,
      xStats: norm.xStats,
      yStats: norm.yStats,
      ok: false,
      warnings,
      lowConfidence: true,
      droppedFeatureNames: norm.droppedFeatureNames,
    };
  }

  // Predict on test in normalized space, then unnormalize back to original target units
  const yPredNorm = predict(fitRes.fit, norm.testX);
  const yPred = yPredNorm.map((v) => v * (norm.yStats.std || 0) + norm.yStats.mean);

  const evalRes = evaluateRegression(testYRaw, yPred);
  let r2 = evalRes.r2;

  if (r2 !== null && (!Number.isFinite(r2) || Math.abs(r2) > 1)) {
    warnings.push('R² outside [-1,1] -> marked invalid');
    r2 = null;
  }

  const targetStd = evalRes.yStd;
  const lowConfidence = targetStd > 0 && evalRes.mae > 3 * targetStd;
  if (lowConfidence) {
    warnings.push('Low confidence: MAE > 3 * std(target)');
  }

  if (warnings.length) {
    console.warn(`[TraderPointsSimulator][regression:${model}]`, warnings);
  }

  return {
    r2,
    mae: evalRes.mae,
    intercept: fitRes.fit.intercept,
    weights: fitRes.fit.weights,
    featureNames: norm.featureNames,
    xStats: norm.xStats,
    yStats: norm.yStats,
    ok: true,
    warnings,
    lowConfidence,
    droppedFeatureNames: norm.droppedFeatureNames,
  };
}

export function runRegressions(users: UserFeatures[]) {
  // NOTE: Metrics are diagnostic only; not used as predictions.
  return {
    activity: runModel(users, 'activity'),
    risk: runModel(users, 'risk'),
    retention: runModel(users, 'retention'),
  };
}
