export type UiLang = 'it' | 'en'

export function getUiLang(preferred?: string): UiLang {
  const raw = (preferred ?? (typeof navigator !== 'undefined' ? navigator.language : '') ?? '').toLowerCase()
  return raw.startsWith('it') ? 'it' : 'en'
}

export const UI_COPY = {
  it: {
    reachabilityLabel: 'Raggiungibilità del goal',
    reachabilityMicro: 'Makes the goal feel reachable',

    presetCommissionOnly: '🔵 Solo commissioni (Bonus classico)',
    presetCommissionOnlySub: 'Picco breve di attività, effetto retention limitato.',

    presetGoalBased500: '🟢 A obiettivo (500 → 500)',
    presetGoalBased500Sub: 'Partecipazione più ampia, progressione chiara, retention più stabile.',

    presetAcceleratedPromo: '🟣 Obiettivo accelerato (promo)',
    presetAcceleratedPromoSub: 'Stesso valore bonus, più utenti completano il goal.',

    presetWhatMeansPrefix: 'Cosa significa:',

    executiveTakeawayTitle: 'Executive takeaway',
    executiveTakeawayText:
      'At equal cost, goal-based incentives improve retention by increasing participation, not intensity.',

    narrativeBridgeTitle: 'Same pace, longer journey',
    narrativeBridgeLine1: 'Daily activity stays almost unchanged.',
    narrativeBridgeLine2: 'What changes is how long users remain active.',
    narrativeBridgeLine3: 'Time × consistency drive total points.',
    narrativeBridgeFormulaA: 'Total Points',
    narrativeBridgeFormulaB: 'Daily Activity',
    narrativeBridgeFormulaC: 'Active Days',

    retentionParticipationLine: 'Retention grows from participation, not pressure',

    economicLogicTitle: 'Economic logic (constant cost)',
    economicLogicBullet1: 'Bonuses are earned via commissions, not gifted',
    economicLogicBullet2: 'Progress speed changes reachability, not bonus value',
    economicLogicBullet3: 'Retention grows from participation, not pressure',

    impactWhereRetentionTitle: 'Where retention actually comes from',
    impactSanityTitle: 'Model sanity check (optional)',
    impactSanityNote: 'Audit-only: verifies internal consistency of the scenario math.',
  },
  en: {
    reachabilityLabel: 'Goal reachability',
    reachabilityMicro: 'Makes the goal feel reachable',

    presetCommissionOnly: '🔵 Commission-only (Classic bonus)',
    presetCommissionOnlySub: 'Short activity spike, limited retention effect.',

    presetGoalBased500: '🟢 Goal-based (500 → 500)',
    presetGoalBased500Sub: 'Broader participation, clear progress, more stable retention.',

    presetAcceleratedPromo: '🟣 Accelerated goal (promo)',
    presetAcceleratedPromoSub: 'Same bonus value, more users complete the goal.',

    presetWhatMeansPrefix: 'What it means:',

    executiveTakeawayTitle: 'Executive takeaway',
    executiveTakeawayText:
      'At equal cost, goal-based incentives improve retention by increasing participation, not intensity.',

    narrativeBridgeTitle: 'Same pace, longer journey',
    narrativeBridgeLine1: 'Daily activity stays almost unchanged.',
    narrativeBridgeLine2: 'What changes is how long users remain active.',
    narrativeBridgeLine3: 'Time × consistency drive total points.',
    narrativeBridgeFormulaA: 'Total Points',
    narrativeBridgeFormulaB: 'Daily Activity',
    narrativeBridgeFormulaC: 'Active Days',

    retentionParticipationLine: 'Retention grows from participation, not pressure',

    economicLogicTitle: 'Economic logic (constant cost)',
    economicLogicBullet1: 'Bonuses are earned via commissions, not gifted',
    economicLogicBullet2: 'Progress speed changes reachability, not bonus value',
    economicLogicBullet3: 'Retention grows from participation, not pressure',

    impactWhereRetentionTitle: 'Where retention actually comes from',
    impactSanityTitle: 'Model sanity check (optional)',
    impactSanityNote: 'Audit-only: verifies internal consistency of the scenario math.',
  },
} as const

export type UiCopyKey = keyof typeof UI_COPY.it

export function t(lang: UiLang, key: UiCopyKey): string {
  return UI_COPY[lang][key]
}
