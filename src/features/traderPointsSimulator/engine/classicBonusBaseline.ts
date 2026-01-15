export const CLASSIC_BONUS_CONSTANTS = {
  // Spike strength: k1 * log(1 + bonus_amount) * engaged_share
  // Keep small: realistic, directional deltas (not a forecast)
  k1: 0.22,

  // Retention lift: min(spike * k2, cap_retention_days)
  k2: 8,
  cap_retention_days: 15,

  // Risk lift: spike * k3 (very small)
  k3: 0.03,

  // Activity spike decay window
  decay_days: 10,

  // If guardrail enabled, reduce engaged share by 20%
  guardrail_engaged_share_multiplier: 0.8,
} as const

export type BaselineTriple = {
  activity: number
  risk: number
  retention: number
}

export type ClassicBonusAssumptions = {
  model: 'classic_bonus_rule_based'
  note: string

  engaged_share_raw: number
  engaged_share_effective: number

  bonus_amount: number
  unlock_rate_pct: number
  guardrail_enabled: boolean

  spike: number
  decay_days: number
  decay_factor_avg: number

  activity_lift: number
  retention_lift: number
  retention_cap_days: number
  risk_lift: number

  constants: typeof CLASSIC_BONUS_CONSTANTS
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function decay(tDays: number, decayDays = CLASSIC_BONUS_CONSTANTS.decay_days) {
  const t = safeNum(tDays, 0)
  const d = Math.max(1e-9, safeNum(decayDays, CLASSIC_BONUS_CONSTANTS.decay_days))
  return Math.exp(-t / d)
}

export function meanDecayOverWindow(decayDays = CLASSIC_BONUS_CONSTANTS.decay_days) {
  // Average of exp(-t/d) over t∈[0,d] is (1 - e^{-1}).
  const d = Math.max(1e-9, safeNum(decayDays, CLASSIC_BONUS_CONSTANTS.decay_days))
  // window length cancels out due to using [0,d], so it's independent of d.
  // Keep d in the code path for clarity and to prevent unused-param drift.
  void d
  return 1 - Math.exp(-1)
}

export function computeClassicBonusBaseline(params: {
  observed: BaselineTriple
  scenario: {
    bonus_amount: number
    unlock_rate_pct: number
    risk_guardrail_enabled?: boolean
  }
}) {
  const observed = params.observed
  const bonusAmount = safeNum(params.scenario?.bonus_amount, 0)
  const unlockRatePct = safeNum(params.scenario?.unlock_rate_pct, 0)
  const guardrailEnabled = !!params.scenario?.risk_guardrail_enabled

  const engagedShareRaw = Math.max(0, Math.min(1, unlockRatePct / 100))
  const engagedShareEffective = guardrailEnabled
    ? engagedShareRaw * CLASSIC_BONUS_CONSTANTS.guardrail_engaged_share_multiplier
    : engagedShareRaw

  const spike =
    CLASSIC_BONUS_CONSTANTS.k1 *
    Math.log(1 + Math.max(0, bonusAmount)) *
    engagedShareEffective

  const decayFactorAvg = meanDecayOverWindow(CLASSIC_BONUS_CONSTANTS.decay_days)

  const activityLift = spike * decayFactorAvg
  const retentionLift = Math.min(
    spike * CLASSIC_BONUS_CONSTANTS.k2,
    CLASSIC_BONUS_CONSTANTS.cap_retention_days,
  )
  const riskLift = spike * CLASSIC_BONUS_CONSTANTS.k3

  const baseline: BaselineTriple = {
    activity: safeNum(observed.activity) + activityLift,
    risk: safeNum(observed.risk) + riskLift,
    retention: safeNum(observed.retention) + retentionLift,
  }

  const assumptions: ClassicBonusAssumptions = {
    model: 'classic_bonus_rule_based',
    note: 'Assumption model (rule-based), not forecast.',

    engaged_share_raw: engagedShareRaw,
    engaged_share_effective: engagedShareEffective,

    bonus_amount: bonusAmount,
    unlock_rate_pct: unlockRatePct,
    guardrail_enabled: guardrailEnabled,

    spike,
    decay_days: CLASSIC_BONUS_CONSTANTS.decay_days,
    decay_factor_avg: decayFactorAvg,

    activity_lift: activityLift,
    retention_lift: retentionLift,
    retention_cap_days: CLASSIC_BONUS_CONSTANTS.cap_retention_days,
    risk_lift: riskLift,

    constants: CLASSIC_BONUS_CONSTANTS,
  }

  return { baseline, assumptions }
}
