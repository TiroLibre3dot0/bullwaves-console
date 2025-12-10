// Payout logic for affiliate CPA based on Qualified FTD (QFTD) and ROI safeguard.
// QFTD represents first-time deposits that meet qualification rules; it is used as the payout volume driver.
// If ROI is below 1.5%, part of the CPA is deferred to protect margin until performance improves.
export function calculatePayout({ qftd, negotiatedCpa, netDeposits, roi }) {
  const q = Number(qftd) || 0
  const cpa = Number(negotiatedCpa) || 0
  const nd = Number(netDeposits) || 0
  const roiInput = Number(roi) || 0
  const roiRatio = roiInput >= 1 ? roiInput / 100 : roiInput // allow percent or ratio

  const cpaTheoretical = q * cpa
  if (cpaTheoretical <= 0 || q === 0 || cpa === 0) {
    return { cpaTheoretical: 0, cpaPayable: 0, cpaDeferred: 0 }
  }

  if (roiRatio >= 0.015) {
    return { cpaTheoretical, cpaPayable: cpaTheoretical, cpaDeferred: 0 }
  }

  const maxPayableFromROI = nd / 0.015 // cap based on ROI threshold
  const cpaPayable = Math.min(cpaTheoretical, maxPayableFromROI)
  const cpaDeferred = Math.max(cpaTheoretical - cpaPayable, 0)
  return { cpaTheoretical, cpaPayable, cpaDeferred }
}

export default calculatePayout
