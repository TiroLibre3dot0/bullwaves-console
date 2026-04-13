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
    entry: 'Churned high-value profile detected',
    step1: [
      'High-value comeback touch',
      'D0',
      'Re-open conversation with premium relevance framing',
    ],
    decision1: ['Comeback response detected?', 'Signal within first 5 days'],
    step2: [
      'Tailored return package',
      'D5',
      'Offer precise return structure for high-value profile',
    ],
    decision2: ['Return package accepted?', 'Observed return intent and account activity'],
    step3: ['Executive reactivation touch', 'D14', 'Stabilize profile after comeback attempt'],
    decision3: ['Reactivated at 30d?', 'Recency and capital recovery checkpoints'],
    outcomes: ['High-value reactivated', 'Partial reactivation', 'Churn confirmed'],
    followups: ['VIP re-entry roadmap', 'Long-cycle reacquisition'],
    influences: ['Inactive status and >90 days recency', 'Net deposit >= 1000'],
    kpis: ['Reactivation 30d', 'Capital return', 'Comeback conversion'],
  },
  dormant_value: {
    entry: 'Dormant value profile identified',
    step1: ['Dormant wake-up touch', 'D0', 'Reintroduce value with low-friction return message'],
    decision1: ['Wake-up response?', 'Interaction within 72h'],
    step2: ['Guided restart path', 'D4', 'Simple re-entry sequence for value profiles'],
    decision2: ['Restart initiated?', 'Signals from platform return and action intent'],
    step3: ['Continuity support touch', 'D11', 'Reduce relapse into dormancy after restart'],
    decision3: ['Recovered at 21d?', 'Recency improves beyond dormancy threshold'],
    outcomes: ['Dormant value recovered', 'Dormant value warming', 'Dormant value unresolved'],
    followups: ['Monthly retention check', 'Extended reactivation nurture'],
    influences: ['Dormant status and net deposit >= 500', '31-90 day inactivity window'],
    kpis: ['Dormant recovery', 'Restart completion', '21d activity'],
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
      'Soft winback touch',
      'D0',
      'Low-pressure return invitation for low-value dormant users',
    ],
    decision1: ['Soft response detected?', 'Response or click in first 4 days'],
    step2: ['Simple restart offer', 'D5', 'Minimal-friction path to reactivate activity'],
    decision2: ['Restart action observed?', 'Initial return behavior detected'],
    step3: ['Nurture continuity touch', 'D14', 'Maintain light cadence to avoid repeated dormancy'],
    decision3: ['Recovered at 30d?', 'Recency improves versus dormant baseline'],
    outcomes: ['Dormant low recovered', 'Partial low-value recovery', 'Low-value still dormant'],
    followups: ['Light retention cadence', 'Long-tail winback'],
    influences: ['Deposit <= 499 and 31-120 days inactive', 'Trades >= 3'],
    kpis: ['Low-value reactivation', 'Restart rate', 'Dormancy reduction'],
  },
  dormant_mid: {
    entry: 'Dormant mid-value profile identified',
    step1: ['Mid-value winback touch', 'D0', 'Reopen relationship with stronger value framing'],
    decision1: ['Winback response detected?', 'Engagement in first 96h'],
    step2: ['Relaunch value path', 'D4', 'Guided return for medium-value dormant profile'],
    decision2: ['Relaunch adopted?', 'Behavior confirms return trajectory'],
    step3: ['Manager-assisted recovery', 'D12', 'Stabilize profile with human follow-up support'],
    decision3: ['Recovered at 30d checkpoint?', 'Recency and activity back in safe zone'],
    outcomes: ['Dormant mid recovered', 'Dormant mid warming', 'Dormant mid attrition risk'],
    followups: ['Recovery monitoring cadence', 'Extended winback escalation'],
    influences: ['Deposit 500-1999 and 31-120 days inactive', 'Trades >= 3'],
    kpis: ['Mid-value reactivation', 'Recovery speed', '30d retention'],
  },
}

function pickBlueprint(segmentKey) {
  return BLUEPRINTS[String(segmentKey || '').trim()] || null
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

  const CANVAS_WIDTH = 2360
  const CANVAS_HEIGHT = 1080

  const stateW = 298
  const decisionW = 136
  const outcomeW = 286

  const x = {
    entrance: 80,
    step1: 320,
    decision1: 560,
    step2: 760,
    decision2: 1000,
    step3: 1220,
    decision3: 1460,
    outcomes: 1700,
    followUp: 1980,
  }

  const y = {
    main: 460,
    top: 250,
    bottom: 680,
    influenceTop: 110,
    influenceBottom: 825,
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

  const nodeDefaults = { draggable: false, selectable: true }
  const baseEdge = { animated: false, type: 'default' }

  const nodes = [
    {
      ...nodeDefaults,
      id: 'E0',
      type: 'state',
      position: { x: x.entrance, y: y.main },
      data: {
        label: { en: blueprint.entry, it: blueprint.entry },
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
        label: { en: blueprint.step1[0], it: blueprint.step1[0] },
        templateId: templateIdFor(segmentKey, 'step1'),
        timingBadge: blueprint.step1[1],
        subLabel: { en: blueprint.step1[2], it: blueprint.step1[2] },
        kind: 'primary',
        kpis: [
          {
            label: {
              en: blueprint.kpis[0] || 'Primary KPI',
              it: blueprint.kpis[0] || 'Primary KPI',
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
        label: { en: blueprint.decision1[0], it: blueprint.decision1[0] },
        subLabel: { en: blueprint.decision1[1], it: blueprint.decision1[1] },
      },
      style: { width: decisionW, height: decisionW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'S2',
      type: 'state',
      position: { x: x.step2, y: y.main },
      data: {
        label: { en: blueprint.step2[0], it: blueprint.step2[0] },
        templateId: templateIdFor(segmentKey, 'step2'),
        timingBadge: blueprint.step2[1],
        subLabel: { en: blueprint.step2[2], it: blueprint.step2[2] },
        kind: 'primary',
        kpis: [
          {
            label: {
              en: blueprint.kpis[1] || 'Secondary KPI',
              it: blueprint.kpis[1] || 'Secondary KPI',
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
      id: 'D2',
      type: 'decision',
      position: { x: x.decision2, y: y.main - 20 },
      data: {
        label: { en: blueprint.decision2[0], it: blueprint.decision2[0] },
        subLabel: { en: blueprint.decision2[1], it: blueprint.decision2[1] },
      },
      style: { width: decisionW, height: decisionW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'S3',
      type: 'state',
      position: { x: x.step3, y: y.main },
      data: {
        label: { en: blueprint.step3[0], it: blueprint.step3[0] },
        templateId: templateIdFor(segmentKey, 'step3'),
        timingBadge: blueprint.step3[1],
        subLabel: { en: blueprint.step3[2], it: blueprint.step3[2] },
        kind: 'primary',
        kpis: [
          {
            label: {
              en: blueprint.kpis[2] || 'Outcome KPI',
              it: blueprint.kpis[2] || 'Outcome KPI',
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
      id: 'D3',
      type: 'decision',
      position: { x: x.decision3, y: y.main - 20 },
      data: {
        label: { en: blueprint.decision3[0], it: blueprint.decision3[0] },
        subLabel: { en: blueprint.decision3[1], it: blueprint.decision3[1] },
      },
      style: { width: decisionW, height: decisionW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'O1',
      type: 'outcome',
      position: { x: x.outcomes, y: y.top },
      data: { label: { en: blueprint.outcomes[0], it: blueprint.outcomes[0] }, kind: 'positive' },
      style: { width: outcomeW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'O2',
      type: 'outcome',
      position: { x: x.outcomes, y: y.main },
      data: { label: { en: blueprint.outcomes[1], it: blueprint.outcomes[1] }, kind: 'neutral' },
      style: { width: outcomeW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'O3',
      type: 'outcome',
      position: { x: x.outcomes, y: y.bottom },
      data: { label: { en: blueprint.outcomes[2], it: blueprint.outcomes[2] }, kind: 'negative' },
      style: { width: outcomeW, zIndex: 10 },
    },
    {
      ...nodeDefaults,
      id: 'F1',
      type: 'state',
      position: { x: x.followUp, y: y.top },
      data: {
        label: { en: blueprint.followups[0], it: blueprint.followups[0] },
        templateId: templateIdFor(segmentKey, 'followup_retained'),
        timingBadge: 'Cycle +0d',
        subLabel: {
          en: 'Dedicated follow-up for retained or promoted users',
          it: 'Follow-up dedicato per utenti trattenuti o promossi',
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
        label: { en: blueprint.followups[1], it: blueprint.followups[1] },
        templateId: templateIdFor(segmentKey, 'followup_recovery'),
        timingBadge: 'D21',
        subLabel: {
          en: 'Re-entry loop when core segment goal is not achieved',
          it: 'Loop di rientro quando il goal principale non viene raggiunto',
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
        subLabel: { en: blueprint.influences[0], it: blueprint.influences[0] },
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
        subLabel: { en: blueprint.influences[1], it: blueprint.influences[1] },
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
      id: 'e-D1-S2',
      source: 'D1',
      target: 'S2',
      sourceHandle: 'out-left',
      targetHandle: 'in',
      label: { en: 'YES', it: 'SI' },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D1-D2',
      source: 'D1',
      target: 'D2',
      sourceHandle: 'out-right',
      targetHandle: 'in',
      label: { en: 'NO', it: 'NO' },
      ...decisionLabel,
      style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
    },
    {
      ...baseEdge,
      id: 'e-S2-D2',
      source: 'S2',
      target: 'D2',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      ...baseEdge,
      id: 'e-D2-S3',
      source: 'D2',
      target: 'S3',
      sourceHandle: 'out-left',
      targetHandle: 'in',
      label: { en: 'ON TRACK', it: 'IN LINEA' },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D2-D3',
      source: 'D2',
      target: 'D3',
      sourceHandle: 'out-right',
      targetHandle: 'in',
      label: { en: 'RECOVERY', it: 'RECOVERY' },
      ...decisionLabel,
      style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
    },
    {
      ...baseEdge,
      id: 'e-S3-D3',
      source: 'S3',
      target: 'D3',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      ...baseEdge,
      id: 'e-D3-O1',
      source: 'D3',
      target: 'O1',
      sourceHandle: 'out-left',
      targetHandle: 'in',
      label: { en: 'STRONG', it: 'FORTE' },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D3-O2',
      source: 'D3',
      target: 'O2',
      sourceHandle: 'out-center',
      targetHandle: 'in',
      label: { en: 'STABLE', it: 'STABILE' },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D3-O3',
      source: 'D3',
      target: 'O3',
      sourceHandle: 'out-right',
      targetHandle: 'in',
      label: { en: 'DROP', it: 'CALO' },
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
