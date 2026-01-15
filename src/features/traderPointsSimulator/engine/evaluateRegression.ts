export interface RegressionFit {
  intercept: number;
  weights: number[];
}

export interface RegressionEvaluation {
  r2: number | null;
  mae: number;
  ssTot: number;
  ssRes: number;
  yMean: number;
  yStd: number;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / (values.length || 1);
}

function std(values: number[], mu: number): number {
  const v = values.reduce((a, b) => a + (b - mu) ** 2, 0) / (values.length || 1);
  return Math.sqrt(v);
}

export function predict(fit: RegressionFit, X: number[][]): number[] {
  return X.map((row) => fit.intercept + row.reduce((s, xj, j) => s + xj * (fit.weights[j] ?? 0), 0));
}

export function evaluateRegression(yTrue: number[], yPred: number[]): RegressionEvaluation {
  const yMean = mean(yTrue);
  const yStd = std(yTrue, yMean);

  const ssTot = yTrue.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
  const ssRes = yTrue.reduce((s, yi, i) => s + (yi - (yPred[i] ?? 0)) ** 2, 0);

  const mae = yTrue.reduce((s, yi, i) => s + Math.abs(yi - (yPred[i] ?? 0)), 0) / (yTrue.length || 1);

  const r2 = ssTot === 0 ? null : 1 - ssRes / ssTot;

  return { r2, mae, ssTot, ssRes, yMean, yStd };
}
