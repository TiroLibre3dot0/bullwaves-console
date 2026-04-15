const BLUEPRINTS = {
  reward_candidates: {
    entry: 'High-value profile re-qualification',
    step1: ['VIP reward signal touch', 'D0', 'Immediate recognition for active high-value profile'],
    decision1: ['Responded to reward signal?', 'Open or click within 72h'],
    step2: [
      'Reward ladder proposal',
      'D5',
      'Structured plan to keep net capital and activity stable',
    ],
    decision2: [
      'Accepted progression path?',
      'Observed via follow-up interaction and account activity',
    ],
    step3: [
      'Retention commitment touch',
      'D14',
      'Anchor profile with account-manager-led continuity plan',
    ],
    decision3: [
      'Retained at 45d checkpoint?',
      'Combined recency and capital preservation checkpoint',
    ],
    outcomes: ['Reward path retained', 'Stable value profile', 'High-value cooling risk'],
    followups: ['Quarterly reward review', 'Controlled winback sequence'],
    influences: ['Net deposit >= 3000 and 50+ trades', 'Recency between 7 and 60 days'],
    kpis: ['Retention 45d', 'Reward acceptance', 'Net capital stability'],
  },
  most_active: {
    entry: 'High-frequency trader detected',
    step1: [
      'Frequency recognition touch',
      'D0',
      'Acknowledge volume and set quality-oriented baseline',
    ],
    decision1: [
      'Quality engagement detected?',
      'Interaction with touch and platform continuity in 72h',
    ],
    step2: ['Execution quality challenge', 'D3', 'Push from raw volume to disciplined consistency'],
    decision2: ['Challenge continuation?', 'Behavior confirms controlled activity pattern'],
    step3: [
      'Advanced discipline package',
      'D10',
      'Risk and execution framework for sustainable high frequency',
    ],
    decision3: [
      'Sustained quality at 30d?',
      'Volume remains high with improved behavioral stability',
    ],
    outcomes: ['High-frequency retained', 'Volume stable but neutral', 'Overtrading risk path'],
    followups: ['Monthly performance calibration', 'Risk moderation loop'],
    influences: ['Trades per month >= 100', 'Days since last trade <= 14'],
    kpis: ['Activity continuity', 'Execution quality', '30d retention'],
  },
  rising: {
    entry: 'Early momentum profile detected',
    step1: [
      'Momentum accelerator touch',
      'D0',
      'Convert short-term velocity into structured progression',
    ],
    decision1: ['Engaged with accelerator?', 'Response to first momentum touch in 72h'],
    step2: ['Milestone sprint plan', 'D4', 'Set short milestones to avoid early flattening'],
    decision2: ['Milestone completion trend?', 'Early signs of progression versus drop in pace'],
    step3: [
      'Tier-up preparation',
      'D12',
      'Prepare profile for transition into stronger retention cohorts',
    ],
    decision3: [
      'Promotion-ready at 30d?',
      'Profile reaches sustainable activity and capital behavior',
    ],
    outcomes: ['Promoted to stronger tier', 'Rising profile stabilized', 'Momentum faded'],
    followups: ['Tier migration onboarding', 'Soft momentum restart'],
    influences: ['Trades per month >= 50', 'Active months <= 3'],
    kpis: ['Momentum retention', 'Milestone completion', 'Tier migration rate'],
  },
  engaged_builders: {
    entry: 'Builder profile identified',
    step1: [
      'Growth foundation touch',
      'D0',
      'Frame account as medium-value profile ready to scale',
    ],
    decision1: ['Initial intent confirmed?', 'First behavior signal after foundation touch'],
    step2: [
      'Capital progression roadmap',
      'D6',
      'Push disciplined growth of net deposited capital',
    ],
    decision2: ['Roadmap adherence?', 'Observed pattern aligned with growth milestones'],
    step3: ['Value consolidation touch', 'D15', 'Prevent plateau and improve retention quality'],
    decision3: ['Retained and progressing?', 'Profile keeps activity and value trajectory'],
    outcomes: ['Builder upgraded', 'Builder stable', 'Builder stalled'],
    followups: ['Quarterly growth check', 'Re-activation nurture'],
    influences: ['Net deposit >= 1000', 'Trades per month >= 15'],
    kpis: ['Value growth', 'Roadmap adherence', 'Retention 60d'],
  },
  at_risk_value: {
    entry: 'Value profile with recency risk',
    step1: ['Critical winback alert', 'D0', 'Immediate intervention before deep inactivity'],
    decision1: ['Reactivation signal detected?', 'Open, click, or account return within 96h'],
    step2: ['Recovery plan touch', 'D4', 'Low-friction return path with focused value proposition'],
    decision2: ['Recovery path accepted?', 'Evidence of return behavior and improved recency'],
    step3: ['Retention safeguard touch', 'D12', 'Stabilize profile after initial reactivation'],
    decision3: ['Recovered at 30d?', 'Recency and value metrics normalize'],
    outcomes: ['Value recovered', 'Partially reactivated', 'Escalated churn risk'],
    followups: ['Manager-led retention review', 'Long-cycle winback'],
    influences: ['60 < days since last trade <= 180', 'Net deposit >= 1500'],
    kpis: ['Reactivation rate', 'Recovery speed', 'Value preserved'],
  },
  early_stage: {
    entry: 'Early-stage trader identified',
    step1: [
      'First-month orientation touch',
      'D0',
      'Guide profile through first structured trading phase',
    ],
    decision1: ['Orientation completed?', 'Early engagement with starter guidance'],
    step2: [
      'Confidence builder sequence',
      'D3',
      'Increase execution confidence and routine clarity',
    ],
    decision2: ['Routine signal present?', 'Behavior indicates stable first routine'],
    step3: ['Activation reinforcement touch', 'D10', 'Prevent early dropout and anchor continuity'],
    decision3: ['Active at day 30?', 'Profile remains active through first month window'],
    outcomes: ['Early stage converted', 'Early stage stable', 'Early stage drop-off'],
    followups: ['Month-2 progression plan', 'Restart onboarding'],
    influences: ['5 to 49 total trades', 'Active months <= 3'],
    kpis: ['Day-30 activity', 'Routine adoption', 'Early retention'],
  },
  vip_whales: {
    entry: 'VIP whale profile detected',
    step1: [
      'Concierge assignment touch',
      'D0',
      'Position dedicated support and premium continuity',
    ],
    decision1: ['Concierge engagement confirmed?', 'Interaction with VIP contact layer in 72h'],
    step2: ['Capital protection review', 'D2', 'Focus on risk-aware capital preservation actions'],
    decision2: ['Protection plan adoption?', 'Behavior aligns with advised protection structure'],
    step3: [
      'Executive premium check-in',
      'D9',
      'Maintain trust and high-value relationship quality',
    ],
    decision3: [
      'VIP retained at checkpoint?',
      'Capital and activity remain in healthy premium range',
    ],
    outcomes: ['VIP relationship secured', 'VIP stable with watch', 'VIP attrition risk'],
    followups: ['Executive account cadence', 'Priority recovery protocol'],
    influences: ['Total deposit >= 10000 or equity >= 10000', 'High-value servicing priority'],
    kpis: ['VIP retention', 'Capital protection adherence', 'Relationship continuity'],
  },
  churned_high_value: {
    entry: {
      en: 'Return opportunity identified',
      it: 'Opportunità di rientro identificata',
    },
    step1: [
      { en: 'Client re-engagement touch', it: 'Touch di riavvicinamento cliente' },
      'D0',
      {
        en: 'Re-open the conversation with softer value, bonus support, and upcoming AI tools',
        it: 'Riapre la conversazione con un tono più morbido, supporto bonus e nuovi AI tools in arrivo',
      },
    ],
    decision1: [
      { en: 'Positive response within 3 days?', it: 'Segnale positivo entro 3 giorni?' },
      {
        en: 'Open, click, login, or manager-interest signal after the first touch',
        it: 'Apertura, click, login o interesse verso il manager dopo il primo touch',
      },
    ],
    step2: [
      { en: 'Deposit confirmed follow-up', it: 'Follow-up dopo deposito confermato' },
      'D3',
      {
        en: 'Acknowledge the completed deposit and move the client into a better-supported return path',
        it: 'Conferma il deposito completato e accompagna il cliente in un rientro meglio supportato',
      },
    ],
    decision2: [
      { en: 'Deposit completed after the review?', it: 'Deposito completato dopo la review?' },
      {
        en: 'Observed deposit, concrete return action, or renewed platform activity after the review',
        it: 'Deposito osservato, azione concreta di rientro o nuova attività in piattaforma dopo la review',
      },
    ],
    step3: [
      { en: 'Post-deposit continuity support', it: 'Supporto di continuità post-deposito' },
      'D7',
      {
        en: 'Keep the return stable after the deposit and prevent a new pause',
        it: 'Mantiene stabile il rientro dopo il deposito ed evita una nuova pausa',
      },
    ],
    decision3: [
      { en: 'Return reactivated at 14d?', it: 'Rientro riattivato a 14 giorni?' },
      {
        en: 'Recency and activity improve back toward a healthy account rhythm',
        it: 'Recency e attività tornano verso un ritmo account più sano',
      },
    ],
    outcomes: [
      { en: 'Return reactivated', it: 'Rientro riattivato' },
      { en: 'Relationship warming', it: 'Relazione in riattivazione' },
      { en: 'Relationship still paused', it: 'Relazione ancora in pausa' },
    ],
    followups: [
      { en: 'Retention continuity review', it: 'Review di continuità retention' },
      { en: 'Softer re-entry path', it: 'Percorso di rientro più morbido' },
    ],
    influences: [
      {
        en: 'Inactive client with prior deposited value',
        it: 'Cliente inattivo con valore depositato pregresso',
      },
      { en: 'More than 90 days from last trade', it: 'Oltre 90 giorni dall ultimo trade' },
    ],
    kpis: [
      { en: 'Return reactivation at 14d', it: 'Riattivazione del ritorno a 14 giorni' },
      { en: 'Return acceptance', it: 'Accettazione del rientro' },
      { en: 'Continuity quality', it: 'Qualità della continuità' },
    ],
    followupRecoveryTiming: 'D14',
  },
  dormant_value: {
    entry: {
      en: 'Dormant value profile identified',
      it: 'Profilo dormant value identificato',
    },
    step1: [
      { en: 'Value reactivation touch', it: 'Touch di riattivazione value' },
      'D0',
      {
        en: 'Re-open the relationship with a low-friction value reminder',
        it: 'Riapre la relazione con un richiamo di valore a basso attrito',
      },
    ],
    decision1: [
      { en: 'Wake-up response within 72h?', it: 'Segnale di riattivazione entro 72h?' },
      {
        en: 'Open, click, login, or other early response to the first reactivation touch',
        it: 'Apertura, click, login o altro segnale iniziale dopo il primo touch di riattivazione',
      },
    ],
    step2: [
      { en: 'Guided return plan', it: 'Piano guidato di rientro' },
      'D3',
      {
        en: 'Offer a simple, credible path back into platform activity',
        it: 'Offre un percorso semplice e credibile per tornare attivi in piattaforma',
      },
    ],
    decision2: [
      { en: 'Return path started?', it: 'Il percorso di rientro è partito?' },
      {
        en: 'Platform revisit, client-area activity, or reactivation intent observed',
        it: 'Ritorno in piattaforma, attività in area cliente o intento di riattivazione osservato',
      },
    ],
    step3: [
      { en: 'Continuity reinforcement', it: 'Rinforzo di continuità' },
      'D9',
      {
        en: 'Protect the first comeback signal and keep the profile from cooling again',
        it: 'Protegge il primo segnale di ritorno ed evita un nuovo raffreddamento del profilo',
      },
    ],
    decision3: [
      {
        en: 'Recovered at the 14-day checkpoint?',
        it: 'Recupero confermato al checkpoint di 14 giorni?',
      },
      {
        en: 'Recency and activity move back above the dormant threshold',
        it: 'Recency e attività tornano sopra la soglia di dormancy',
      },
    ],
    outcomes: [
      { en: 'Dormant value recovered', it: 'Dormant value recuperato' },
      { en: 'Dormant value warming', it: 'Dormant value in riscaldamento' },
      { en: 'Dormant value unresolved', it: 'Dormant value non risolto' },
    ],
    followups: [
      { en: 'Monthly retention check', it: 'Check mensile di retention' },
      { en: 'Extended reactivation nurture', it: 'Nurture esteso di riattivazione' },
    ],
    influences: [
      {
        en: 'Dormant status with net deposit >= 500',
        it: 'Stato dormant con net deposit >= 500',
      },
      {
        en: 'Inactivity window between 31 and 90 days',
        it: 'Finestra di inattività tra 31 e 90 giorni',
      },
    ],
    kpis: [
      { en: 'Dormant recovery at 14d', it: 'Recupero dormant a 14 giorni' },
      { en: 'Restart completion', it: 'Completamento del rientro' },
      { en: 'Return continuity', it: 'Continuità del ritorno' },
    ],
    followupRecoveryTiming: 'D18',
  },
  high_volume_losing: {
    entry: 'High-volume losing profile flagged',
    step1: ['Risk reset communication', 'D0', 'Reframe behavior toward controlled execution'],
    decision1: ['Risk-reset engagement?', 'Interaction with risk-control message'],
    step2: [
      'Loss-control toolkit touch',
      'D3',
      'Provide practical structure to reduce destructive patterns',
    ],
    decision2: ['Control behavior adopted?', 'Observed improvement in risk discipline signals'],
    step3: [
      'Stability coaching touch',
      'D9',
      'Consolidate balanced behavior and prevent churn spike',
    ],
    decision3: ['Stabilized at 30d?', 'Losing behavior cools while activity remains sustainable'],
    outcomes: ['Behavior stabilized', 'Neutral risk profile', 'Escalated loss risk'],
    followups: ['Behavior coaching cadence', 'Risk intervention loop'],
    influences: ['Total trades >= 100 with closed PL < 0', 'High churn sensitivity cohort'],
    kpis: ['Risk normalization', 'Retention under stress', 'Behavior stabilization'],
  },
  funded_no_trade: {
    entry: 'Funded non-trading profile detected',
    step1: [
      'First-trade kickoff touch',
      'D0',
      'Remove friction between funding and first execution',
    ],
    decision1: ['First-trade intent detected?', 'Engagement with kickoff guidance in 48h'],
    step2: ['Execution primer touch', 'D2', 'Guide profile through first practical trade setup'],
    decision2: ['Execution initiated?', 'Observed first operational signal toward trade action'],
    step3: ['Assisted activation touch', 'D7', 'Manager-assisted prompt to complete first trade'],
    decision3: ['First trade completed?', 'Conversion checkpoint from funded to active trader'],
    outcomes: ['First trade activated', 'Warm funded profile', 'Funded inactivity persists'],
    followups: ['Post-first-trade onboarding', 'Low-friction restart'],
    influences: ['Total deposit > 0 and total trades <= 0', 'Activation-critical state'],
    kpis: ['First-trade conversion', 'Time to first trade', 'Activation completion'],
  },
  promising_mid: {
    entry: 'Promising mid-tier profile detected',
    step1: ['Mid-tier acceleration touch', 'D0', 'Position profile for next retention tier'],
    decision1: ['Acceleration signal?', 'Early response to progression narrative'],
    step2: [
      'Upgrade roadmap touch',
      'D5',
      'Set tactical path toward stronger consistency and value',
    ],
    decision2: ['Upgrade path adopted?', 'Behavior aligns with roadmap checkpoints'],
    step3: ['Tier progression invitation', 'D12', 'Invite profile into stronger cohort logic'],
    decision3: [
      'Promoted at cycle checkpoint?',
      'Evidence of tier-readiness and retention quality',
    ],
    outcomes: ['Promoted mid-tier profile', 'Stable mid-tier profile', 'Mid-tier cooling risk'],
    followups: ['Tier transition onboarding', 'Re-acceleration sequence'],
    influences: ['10-49 trades and net deposit >= 300', 'Recency <= 45 days'],
    kpis: ['Tier progression', 'Roadmap adoption', 'Retention quality'],
  },
  onboarding_light: {
    entry: 'Light onboarding profile identified',
    step1: [
      'Early rhythm touch',
      'D0',
      'Create first routine for newly activated low-trade profile',
    ],
    decision1: ['Routine signal in first 72h?', 'Interaction plus early session continuity'],
    step2: ['Habit builder touch', 'D2', 'Build repeatable behavior with low-pressure guidance'],
    decision2: ['Habit continuity?', 'Profile repeats activity within expected early window'],
    step3: [
      'Confidence reinforcement touch',
      'D8',
      'Prevent drop-off and prepare next maturity step',
    ],
    decision3: ['Activated at day 21?', 'Profile remains active with improving consistency'],
    outcomes: ['Onboarding matured', 'Onboarding stable', 'Onboarding stalled'],
    followups: ['Maturity handoff touch', 'Soft re-onboarding loop'],
    influences: ['1-9 total trades', 'Recency <= 30 days'],
    kpis: ['Early activation', 'Routine continuity', 'Day-21 retention'],
  },
  dormant_low: {
    entry: 'Dormant low-value profile identified',
    step1: [
      'Soft re-entry touch',
      'D0',
      'Invite a simple return without pressure for low-value dormant users',
    ],
    decision1: ['Soft response detected?', 'Response or click in first 5 days'],
    step2: [
      'Simple restart path',
      'D6',
      'Minimal-friction route to bring the account back into motion',
    ],
    decision2: ['Restart action observed?', 'Initial return behavior or login intent detected'],
    step3: [
      'Light continuity nurture',
      'D15',
      'Maintain a gentle cadence and avoid repeated dormancy',
    ],
    decision3: ['Recovered at 21d?', 'Recency improves versus the dormant baseline'],
    outcomes: ['Dormant low recovered', 'Partial low-value recovery', 'Low-value still dormant'],
    followups: ['Light retention cadence', 'Long-tail winback'],
    influences: ['Deposit <= 499 and 31-120 days inactive', 'Trades >= 3'],
    kpis: ['Low-value reactivation 21d', 'Restart rate', 'Dormancy reduction'],
    followupRecoveryTiming: 'D21',
  },
  dormant_mid: {
    entry: 'Dormant mid-value profile identified',
    step1: [
      'Mid-value winback touch',
      'D0',
      'Reopen the relationship with a stronger but still practical value frame',
    ],
    decision1: ['Winback response detected?', 'Engagement within first 96h'],
    step2: ['Relaunch value path', 'D4', 'Guide the profile back with a clearer return sequence'],
    decision2: ['Relaunch adopted?', 'Behavior confirms intent to return'],
    step3: [
      'Manager continuity touch',
      'D10',
      'Use a human follow-up to stabilize the recovery attempt',
    ],
    decision3: ['Recovered at 21d?', 'Recency and activity move back into a safer range'],
    outcomes: ['Dormant mid recovered', 'Dormant mid warming', 'Dormant mid attrition risk'],
    followups: ['Recovery monitoring cadence', 'Extended winback escalation'],
    influences: ['Deposit 500-1999 and 31-120 days inactive', 'Trades >= 3'],
    kpis: ['Mid-value reactivation 21d', 'Recovery speed', 'Return stability'],
    followupRecoveryTiming: 'D18',
  },
}

function pickBlueprint(segmentKey) {
  return BLUEPRINTS[String(segmentKey || '').trim()] || null
}

function asLocaleText(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const en = String(value.en ?? value.it ?? '').trim()
    const it = String(value.it ?? value.en ?? '').trim()
    return { en, it }
  }

  const text = String(value ?? '').trim()
  return { en: text, it: text }
}

function templateIdFor(segmentKey, stepKey) {
  return `${String(segmentKey || '').trim()}_${stepKey}_email`
}

export function hasDedicatedSegmentBlueprint(segmentKey) {
  return Boolean(pickBlueprint(segmentKey))
}

export function buildDedicatedSegmentLifecycleFlow(segment) {
  const segmentKey = String(segment?.key || '').trim()
  const blueprint = pickBlueprint(segmentKey)

  if (!blueprint) return null

  const segmentLabel = String(segment?.label || segmentKey || 'Segment').trim()
  const segmentGoal = String(segment?.goal || 'Drive progression and retention quality.').trim()
  const segmentGroup = String(segment?.group || 'Retention').trim()

  const CANVAS_WIDTH = 3680
  const CANVAS_HEIGHT = 1120

  const stateW = 298
  const decisionW = 136
  const outcomeW = 286

  const x = {
    entrance: 80,
    step1: 450,
    decision1: 880,
    step2: 1260,
    decision2: 1690,
    step3: 2070,
    decision3: 2500,
    outcomes: 2810,
    followUp: 3180,
  }

  const y = {
    main: 470,
    top: 230,
    bottom: 730,
    influenceTop: 100,
    influenceBottom: 865,
  }

  const decisionLabel = {
    labelStyle: { fontSize: 10, fontWeight: 700 },
    labelBgStyle: {
      fill: 'rgba(10, 10, 15, 0.92)',
      color: '#94a3b8',
      padding: '4px 8px',
      borderRadius: '4px',
    },
  }

  const step2Label = {
    en: 'Deposit confirmed · next-step support',
    it: 'Deposito confermato · supporto al prossimo passo',
  }
  const step2NoLabel = {
    en: 'No deposit yet · reactivation push',
    it: 'Nessun deposito · spinta di riattivazione',
  }
  const step3Label = {
    en: 'Post-deposit continuity',
    it: 'Continuità post-deposito',
  }
  const step3NoLabel = {
    en: 'Still no deposit · softer re-entry',
    it: 'Ancora nessun deposito · rientro più morbido',
  }
  const decision3Label = asLocaleText(blueprint.decision3[0])
  const retainedFollowupLabel = asLocaleText(blueprint.followups[0])
  const recoveryFollowupLabel = asLocaleText(blueprint.followups[1])

  const routeLabel = (prefixEn, prefixIt, target) => ({
    en: `${prefixEn} → ${target.en}`,
    it: `${prefixIt} → ${target.it}`,
  })

  const nodeDefaults = { draggable: false, selectable: true }
  const baseEdge = {
    animated: false,
    type: 'smoothstep',
    pathOptions: { offset: 28, borderRadius: 14 },
  }

  const nodes = [
    {
      ...nodeDefaults,
      id: 'E0',
      type: 'state',
      position: { x: x.entrance, y: y.main },
      data: {
        label: asLocaleText(blueprint.entry),
        subLabel: {
          en: `Entered ${segmentLabel} segment`,
          it: `Entrato nel segmento ${segmentLabel}`,
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'S1',
      type: 'state',
      position: { x: x.step1, y: y.main },
      data: {
        label: asLocaleText(blueprint.step1[0]),
        templateId: templateIdFor(segmentKey, 'step1'),
        timingBadge: blueprint.step1[1],
        subLabel: asLocaleText(blueprint.step1[2]),
        kind: 'primary',
        kpis: [
          {
            label: {
              ...asLocaleText(blueprint.kpis[0] || 'Primary KPI'),
            },
            value: { en: '—', it: '—' },
            metricKey: 'step1Primary',
          },
        ],
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'D1',
      type: 'decision',
      position: { x: x.decision1, y: y.main - 20 },
      data: {
        label: asLocaleText(blueprint.decision1[0]),
        subLabel: asLocaleText(blueprint.decision1[1]),
      },
      style: { width: decisionW, height: decisionW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'S2Y',
      type: 'state',
      position: { x: x.step2, y: y.top },
      data: {
        label: step2Label,
        templateId: templateIdFor(segmentKey, 'step2'),
        timingBadge: blueprint.step2[1],
        subLabel: {
          en: `YES send: ${asLocaleText(blueprint.step2[2]).en}`,
          it: `Invio SI: ${asLocaleText(blueprint.step2[2]).it}`,
        },
        kind: 'primary',
        kpis: [
          {
            label: {
              ...asLocaleText(blueprint.kpis[1] || 'Secondary KPI'),
            },
            value: { en: '—', it: '—' },
            metricKey: 'step2Secondary',
          },
        ],
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'S2N',
      type: 'state',
      position: { x: x.step2, y: y.bottom },
      data: {
        label: step2NoLabel,
        templateId: templateIdFor(segmentKey, 'followup_recovery'),
        timingBadge: blueprint.step2[1],
        subLabel: {
          en: `NO send: no deposit completed yet, send a new reactivation push`,
          it: `Invio NO: nessun deposito completato, invia un nuovo contenuto di riattivazione`,
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'D2',
      type: 'decision',
      position: { x: x.decision2, y: y.main - 20 },
      data: {
        label: asLocaleText(blueprint.decision2[0]),
        subLabel: asLocaleText(blueprint.decision2[1]),
      },
      style: { width: decisionW, height: decisionW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'S3Y',
      type: 'state',
      position: { x: x.step3, y: y.top },
      data: {
        label: step3Label,
        templateId: templateIdFor(segmentKey, 'step3'),
        timingBadge: blueprint.step3[1],
        subLabel: {
          en: `YES send: ${asLocaleText(blueprint.step3[2]).en}`,
          it: `Invio SI: ${asLocaleText(blueprint.step3[2]).it}`,
        },
        kind: 'primary',
        kpis: [
          {
            label: {
              ...asLocaleText(blueprint.kpis[2] || 'Outcome KPI'),
            },
            value: { en: '—', it: '—' },
            metricKey: 'step3Outcome',
          },
        ],
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'S3N',
      type: 'state',
      position: { x: x.step3, y: y.bottom },
      data: {
        label: step3NoLabel,
        templateId: templateIdFor(segmentKey, 'followup_recovery'),
        timingBadge: blueprint.followupRecoveryTiming || 'D14',
        subLabel: {
          en: 'NO send: softer re-entry and recovery content',
          it: 'Invio NO: contenuto di rientro morbido e recovery',
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'D3',
      type: 'decision',
      position: { x: x.decision3, y: y.main - 20 },
      data: {
        label: asLocaleText(blueprint.decision3[0]),
        subLabel: asLocaleText(blueprint.decision3[1]),
      },
      style: { width: decisionW, height: decisionW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'O1',
      type: 'outcome',
      position: { x: x.outcomes, y: y.top },
      data: { label: asLocaleText(blueprint.outcomes[0]), kind: 'positive' },
      style: { width: outcomeW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'O2',
      type: 'outcome',
      position: { x: x.outcomes, y: y.main },
      data: { label: asLocaleText(blueprint.outcomes[1]), kind: 'neutral' },
      style: { width: outcomeW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'O3',
      type: 'outcome',
      position: { x: x.outcomes, y: y.bottom },
      data: { label: asLocaleText(blueprint.outcomes[2]), kind: 'negative' },
      style: { width: outcomeW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'F1',
      type: 'state',
      position: { x: x.followUp, y: y.top },
      data: {
        label: asLocaleText(blueprint.followups[0]),
        templateId: templateIdFor(segmentKey, 'followup_retained'),
        timingBadge: 'Cycle +0d',
        subLabel: {
          en: 'YES path follow-up for retained or reactivated users',
          it: 'Follow-up del percorso SI per utenti trattenuti o riattivati',
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'F2',
      type: 'state',
      position: { x: x.followUp, y: y.main },
      data: {
        label: asLocaleText(blueprint.followups[1]),
        templateId: templateIdFor(segmentKey, 'followup_recovery'),
        timingBadge: blueprint.followupRecoveryTiming || 'D21',
        subLabel: {
          en: 'NO/WARM path follow-up when the main return goal is not yet achieved',
          it: 'Follow-up del percorso NO/CALDO quando l’obiettivo principale non è ancora raggiunto',
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'I1',
      type: 'communication',
      position: { x: x.step2 - 40, y: y.influenceTop },
      data: {
        label: { en: 'Behavior context', it: 'Contesto comportamentale' },
        subLabel: asLocaleText(blueprint.influences[0]),
        kind: 'influence',
      },
      style: { width: 255, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'I2',
      type: 'communication',
      position: { x: x.step3 + 20, y: y.influenceBottom },
      data: {
        label: { en: 'Operational trigger', it: 'Trigger operativo' },
        subLabel: asLocaleText(blueprint.influences[1]),
        kind: 'influence',
      },
      style: { width: 255, zIndex: 10 },
    },
  ]

  const edges = [
    {
      ...baseEdge,
      id: 'e-E0-S1',
      source: 'E0',
      target: 'S1',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      ...baseEdge,
      id: 'e-S1-D1',
      source: 'S1',
      target: 'D1',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      ...baseEdge,
      id: 'e-D1-S2Y',
      source: 'D1',
      target: 'S2Y',
      sourceHandle: 'out-left',
      targetHandle: 'in',
      label: routeLabel('YES', 'SI', step2Label),
      data: {
        primary: { en: 'YES', it: 'SI' },
        secondary: {
          en: `Positive signal detected, continue to ${step2Label.en}`,
          it: `Segnale positivo rilevato, prosegui verso ${step2Label.it}`,
        },
        hasChoiceLabel: true,
        alwaysShowSecondary: true,
      },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D1-S2N',
      source: 'D1',
      target: 'S2N',
      sourceHandle: 'out-right',
      targetHandle: 'in',
      label: routeLabel('NO', 'NO', step2Label),
      data: {
        primary: { en: 'NO', it: 'NO' },
        secondary: {
          en: `No early signal yet, still escalate to ${step2Label.en}`,
          it: `Nessun segnale iniziale, si passa comunque a ${step2Label.it}`,
        },
        hasChoiceLabel: true,
        alwaysShowSecondary: true,
      },
      ...decisionLabel,
      style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
    },
    {
      ...baseEdge,
      id: 'e-S2Y-D2',
      source: 'S2Y',
      target: 'D2',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      ...baseEdge,
      id: 'e-S2N-D2',
      source: 'S2N',
      target: 'D2',
      sourceHandle: 'out',
      targetHandle: 'in',
      style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
    },
    {
      ...baseEdge,
      id: 'e-D2-S3Y',
      source: 'D2',
      target: 'S3Y',
      sourceHandle: 'out-left',
      targetHandle: 'in',
      label: routeLabel('YES', 'SI', step3Label),
      data: {
        primary: { en: 'YES', it: 'SI' },
        secondary: {
          en: `Return intent confirmed, move to ${step3Label.en}`,
          it: `Intento di rientro confermato, passa a ${step3Label.it}`,
        },
        hasChoiceLabel: true,
        alwaysShowSecondary: true,
      },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D2-S3N',
      source: 'D2',
      target: 'S3N',
      sourceHandle: 'out-right',
      targetHandle: 'in',
      label: routeLabel('NO', 'NO', step3NoLabel),
      data: {
        primary: { en: 'NO', it: 'NO' },
        secondary: {
          en: `Return path not accepted, send ${step3NoLabel.en}`,
          it: `Percorso di rientro non accettato, invia ${step3NoLabel.it}`,
        },
        hasChoiceLabel: true,
        alwaysShowSecondary: true,
      },
      ...decisionLabel,
      style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
    },
    {
      ...baseEdge,
      id: 'e-S3Y-D3',
      source: 'S3Y',
      target: 'D3',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      ...baseEdge,
      id: 'e-S3N-D3',
      source: 'S3N',
      target: 'D3',
      sourceHandle: 'out',
      targetHandle: 'in',
      style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
    },
    {
      ...baseEdge,
      id: 'e-D3-O1',
      source: 'D3',
      target: 'O1',
      sourceHandle: 'out-left',
      targetHandle: 'in',
      label: routeLabel('YES', 'SI', retainedFollowupLabel),
      data: {
        primary: { en: 'YES', it: 'SI' },
        secondary: {
          en: `Strong return signal, continue to ${retainedFollowupLabel.en}`,
          it: `Rientro forte confermato, continua con ${retainedFollowupLabel.it}`,
        },
        hasChoiceLabel: true,
        alwaysShowSecondary: true,
      },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D3-O2',
      source: 'D3',
      target: 'O2',
      sourceHandle: 'out-center',
      targetHandle: 'in',
      label: routeLabel('WARM', 'CALDO', recoveryFollowupLabel),
      data: {
        primary: { en: 'WARM', it: 'CALDO' },
        secondary: {
          en: `Partial recovery, continue with ${recoveryFollowupLabel.en}`,
          it: `Recupero parziale, continua con ${recoveryFollowupLabel.it}`,
        },
        hasChoiceLabel: true,
        alwaysShowSecondary: true,
      },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D3-O3',
      source: 'D3',
      target: 'O3',
      sourceHandle: 'out-right',
      targetHandle: 'in',
      label: routeLabel('NO', 'NO', recoveryFollowupLabel),
      data: {
        primary: { en: 'NO', it: 'NO' },
        secondary: {
          en: `No recovery yet, continue with ${recoveryFollowupLabel.en}`,
          it: `Nessun recupero ancora, continua con ${recoveryFollowupLabel.it}`,
        },
        hasChoiceLabel: true,
        alwaysShowSecondary: true,
      },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-O1-F1',
      source: 'O1',
      target: 'F1',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      ...baseEdge,
      id: 'e-O2-F2',
      source: 'O2',
      target: 'F2',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      ...baseEdge,
      id: 'e-O3-F2',
      source: 'O3',
      target: 'F2',
      sourceHandle: 'out',
      targetHandle: 'in',
      style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
    },
    {
      ...baseEdge,
      id: 'e-I1-S1',
      source: 'I1',
      target: 'S1',
      sourceHandle: 'out',
      targetHandle: 'in-left',
      style: { stroke: 'rgba(100, 116, 139, 0.45)', strokeWidth: 1.4, strokeDasharray: '4,4' },
    },
    {
      ...baseEdge,
      id: 'e-I2-S2',
      source: 'I2',
      target: 'S2',
      sourceHandle: 'out',
      targetHandle: 'in-right',
      style: { stroke: 'rgba(100, 116, 139, 0.45)', strokeWidth: 1.4, strokeDasharray: '4,4' },
    },
  ]

  const meta = {
    id: `${segmentKey}Journey`,
    title: {
      en: `${segmentLabel} Journey`,
      it: `Journey ${segmentLabel}`,
    },
    description: {
      en: `${segmentGroup} lifecycle for ${segmentLabel}. Goal: ${segmentGoal}`,
      it: `Lifecycle ${segmentGroup} per ${segmentLabel}. Obiettivo: ${segmentGoal}`,
    },
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    segment: segmentKey,
    goal: {
      en: segmentGoal,
      it: segmentGoal,
    },
    kpis: (blueprint.kpis || []).slice(0, 3).map((kpi) => ({ en: kpi, it: kpi })),
  }

  return { nodes, edges, meta }
}
