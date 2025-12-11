// Payout logic based on expected vs actual marketing spend.
// Marketing expected = QFTD * negotiated CPA.
// Marketing actual =
//   - if ROI >= 1.5, use marketing expected (no cap)
//   - else use Net Deposits / 1.5 (guardrail)
// Payable = min(expected, actual); deferred = expected - payable.
export function calculatePayout({ qftd, negotiatedCpa, netDeposits, roi }) {
  const q = Number(qftd) || 0
  const cpa = Number(negotiatedCpa) || 0
  const nd = Number(netDeposits) || 0
  const roiVal = Number(roi) || 0

  const marketingExpected = q * cpa
  const marketingActual = roiVal >= 1.5 ? marketingExpected : nd / 1.5

  if (marketingExpected <= 0 || q === 0 || cpa === 0) {
    return { marketingExpected: 0, marketingActual: 0, marketingPayable: 0, marketingDeferred: 0 }
  }

  const marketingPayable = Math.min(marketingExpected, marketingActual)
  const marketingDeferred = Math.max(marketingExpected - marketingPayable, 0)
  return { marketingExpected, marketingActual, marketingPayable, marketingDeferred }
}

export default calculatePayout
