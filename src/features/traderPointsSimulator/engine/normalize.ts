export interface ZScoreStats {
  mean: number;
  std: number;
}

export interface NormalizationResult {
  trainX: number[][];
  testX: number[][];
  trainY: number[];
  testY: number[];
  featureNames: string[];
  xStats: ZScoreStats[];
  yStats: ZScoreStats;
  droppedFeatureNames: string[];
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / (values.length || 1);
}

function std(values: number[], mu: number): number {
  const v = values.reduce((a, b) => a + (b - mu) ** 2, 0) / (values.length || 1);
  return Math.sqrt(v);
}

export function normalizeDataset(
  trainX: number[][],
  testX: number[][],
  trainY: number[],
  testY: number[],
  featureNames: string[],
): NormalizationResult {
  if (trainX.length === 0) {
    return {
      trainX,
      testX,
      trainY,
      testY,
      featureNames,
      xStats: [],
      yStats: { mean: 0, std: 0 },
      droppedFeatureNames: [],
    };
  }

  const numFeatures = trainX[0].length;
  const xStatsAll: ZScoreStats[] = [];
  const keepIdx: number[] = [];
  const droppedFeatureNames: string[] = [];

  for (let j = 0; j < numFeatures; j++) {
    const col = trainX.map((row) => row[j]);
    const mu = mean(col);
    const sigma = std(col, mu);
    xStatsAll.push({ mean: mu, std: sigma });
    if (sigma === 0 || !Number.isFinite(sigma)) {
      droppedFeatureNames.push(featureNames[j] ?? `x${j}`);
      continue;
    }
    keepIdx.push(j);
  }

  const keptFeatureNames = keepIdx.map((j) => featureNames[j] ?? `x${j}`);
  const keptXStats = keepIdx.map((j) => xStatsAll[j]);

  const normalizeRow = (row: number[]) =>
    keepIdx.map((j, k) => {
      const s = keptXStats[k];
      return (row[j] - s.mean) / s.std;
    });

  const normTrainX = trainX.map(normalizeRow);
  const normTestX = testX.map(normalizeRow);

  const yMean = mean(trainY);
  const yStd = std(trainY, yMean);

  // If yStd==0, target has no variance; keep normalized targets at 0.
  const normY = (y: number[]) => (yStd === 0 || !Number.isFinite(yStd) ? y.map(() => 0) : y.map((v) => (v - yMean) / yStd));

  return {
    trainX: normTrainX,
    testX: normTestX,
    trainY: normY(trainY),
    testY: normY(testY),
    featureNames: keptFeatureNames,
    xStats: keptXStats,
    yStats: { mean: yMean, std: yStd },
    droppedFeatureNames,
  };
}
