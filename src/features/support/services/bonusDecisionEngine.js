// Isolated Bonus Decision Engine (additive)

export const BONUS_DECISION_CONFIG = {
  AUTO_APPROVE_AMOUNT_MAX: 5000,
  TRADING_HISTORY_SCORE_THRESHOLD: 70,
  // When trading history is strong, the preferred suggestion can be configured.
  // Guardrails still apply (never losable for high-risk affiliates).
  PREFERRED_BONUS_TYPE_FOR_STRONG_HISTORY: 'losable',
  DEFAULT_AFFILIATE_RISK_LEVEL: 'medium'
}

function toNumber(v) {
  if (v === null || v === undefined || v === '') return 0
  const n = Number(String(v).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(n) ? n : 0
}

function clamp(n, min, max) {
  const x = Number.isFinite(n) ? n : 0
  return Math.min(max, Math.max(min, x))
}

function formatAmount(n) {
  const rounded = Math.round(toNumber(n))
  try {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(rounded)
  } catch {
    return String(rounded)
  }
}

/**
 * Build a structured bonus decision.
 * This function is PURE: it does not read external state.
 */
export function buildBonusDecision(input, cfg = BONUS_DECISION_CONFIG) {
  const depositAmount = toNumber(input?.depositAmount)
  const requestedBonusPercentage = toNumber(input?.requestedBonusPercentage)
  const requestedBonusAmountRaw = toNumber(input?.requestedBonusAmount)
  const tradingHistoryScore = clamp(toNumber(input?.tradingHistoryScore), 0, 100)
  const affiliateRiskLevelRaw = String(input?.affiliateRiskLevel || cfg.DEFAULT_AFFILIATE_RISK_LEVEL || 'medium').toLowerCase()
  const affiliateRiskLevel = (affiliateRiskLevelRaw === 'low' || affiliateRiskLevelRaw === 'high' || affiliateRiskLevelRaw === 'medium')
    ? affiliateRiskLevelRaw
    : 'medium'

  const computedFromPercent = depositAmount > 0 && requestedBonusPercentage > 0
    ? (depositAmount * (requestedBonusPercentage / 100))
    : 0

  const bonusAmount = Math.round(requestedBonusAmountRaw > 0 ? requestedBonusAmountRaw : computedFromPercent)

  const hasSufficientTradingHistory = tradingHistoryScore >= cfg.TRADING_HISTORY_SCORE_THRESHOLD
  const isHighRiskAffiliate = affiliateRiskLevel === 'high'
  const isMediumOrHighRiskAffiliate = affiliateRiskLevel === 'medium' || affiliateRiskLevel === 'high'

  // Rule 2 + Rule 3 (type suggestion + guardrails)
  let bonusType = 'non-losable'
  const reasons = []

  if (hasSufficientTradingHistory) {
    reasons.push('strong trading history')
    bonusType = cfg.PREFERRED_BONUS_TYPE_FOR_STRONG_HISTORY === 'non-losable' ? 'non-losable' : 'losable'
  } else {
    reasons.push('insufficient trading history')
    bonusType = 'non-losable'
  }

  if (isMediumOrHighRiskAffiliate) {
    // Guardrail: default to non-losable for medium/high risk.
    if (bonusType !== 'non-losable') reasons.push('risk guardrail: non-losable only')
    bonusType = 'non-losable'
  }

  if (isHighRiskAffiliate) {
    // Explicit guardrail.
    if (!reasons.includes('high-risk affiliate')) reasons.push('high-risk affiliate')
    bonusType = 'non-losable'
  } else {
    reasons.push(`${affiliateRiskLevel}-risk affiliate`)
  }

  // Rule 1 (approval threshold)
  const dealingApprovalRequired = bonusAmount > cfg.AUTO_APPROVE_AMOUNT_MAX

  let status = dealingApprovalRequired ? 'Approved – Dealing approval required' : 'Approved'

  // Rule 2: if insufficient history AND affiliate is not low-risk, suggest rejection/adjustment
  if (!hasSufficientTradingHistory && affiliateRiskLevel !== 'low') {
    status = 'Rejected / Needs adjustment'
    reasons.push('needs adjustment: reduce bonus or deny')
  }

  // Keep rationale one-line and copy-paste ready
  const amountText = formatAmount(bonusAmount)
  const rationale = `${status}: ${amountText} ${bonusType} credit. Rationale: ${reasons.join(', ')}.`

  return {
    status,
    bonusAmount,
    bonusType,
    rationale
  }
}
