export interface OLSFit {
  intercept: number;
  weights: number[];
}

export interface OLSResult {
  ok: boolean;
  fit?: OLSFit;
  error?: string;
}

// Plain OLS fit using normal equations with partial pivot Gaussian elimination.
// Returns {ok:false} if the system is singular/ill-conditioned.
// Note: In real datasets, multicollinearity can make X^T X near-singular. We apply
// a tiny ridge fallback to stabilize the solve (keeps behavior similar while avoiding
// hard failure and downstream “all-zero deltas” fallbacks).
export function fitOLS(y: number[], X: number[][]): OLSResult {
  if (!X.length || !X[0]?.length || X.length !== y.length) {
    return { ok: false, error: 'Invalid shapes for X/y' };
  }

  // Add intercept
  const Xb = X.map((row) => [1, ...row]);
  const m = Xb[0].length; // m = features + intercept

  // Compute A = X^T X, b = X^T y
  const A: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  const bVec: number[] = Array(m).fill(0);

  for (let i = 0; i < Xb.length; i++) {
    const xi = Xb[i];
    for (let r = 0; r < m; r++) {
      bVec[r] += xi[r] * y[i];
      for (let c = 0; c < m; c++) {
        A[r][c] += xi[r] * xi[c];
      }
    }
  }

  const toFit = (beta: number[]) => ({
    ok: true as const,
    fit: {
      intercept: beta[0],
      weights: beta.slice(1),
    },
  });

  try {
    const beta = solveLinearSystem(A, bVec);
    return toFit(beta);
  } catch (err: any) {
    // Ridge fallback(s): add lambda to diagonal (exclude intercept term).
    const lambdas = [1e-10, 1e-8, 1e-6, 1e-4, 1e-2];
    for (const lambda of lambdas) {
      const Ar = A.map((row) => [...row]);
      for (let d = 1; d < m; d++) Ar[d][d] += lambda;
      try {
        const beta = solveLinearSystem(Ar, bVec);
        return toFit(beta);
      } catch {
        // try next lambda
      }
    }
    return { ok: false, error: err?.message || 'OLS solve failed' };
  }
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  const eps = 1e-12;

  for (let col = 0; col < n; col++) {
    // Find pivot row
    let pivotRow = col;
    let pivotVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > pivotVal) {
        pivotVal = v;
        pivotRow = r;
      }
    }

    if (pivotVal < eps || !Number.isFinite(pivotVal)) {
      throw new Error('Singular or ill-conditioned matrix');
    }

    // Swap pivot row
    if (pivotRow !== col) {
      [M[col], M[pivotRow]] = [M[pivotRow], M[col]];
    }

    // Normalize pivot row
    const pivot = M[col][col];
    for (let c = col; c <= n; c++) {
      M[col][c] /= pivot;
    }

    // Eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) {
        M[r][c] -= factor * M[col][c];
      }
    }
  }

  // Extract solution
  return M.map((row) => row[n]);
}
