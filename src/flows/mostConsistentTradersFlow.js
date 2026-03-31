// Most Consistent Traders Segment Flow
// Journey objective: Retain & stabilize medium-high engagement; Scale toward top performers
// KPIs: Continuità mensile | Incremento ticket medio | Retention 60d

const CANVAS_WIDTH = 1600
const axisX = 800

const stateW = 280
const decisionW = 130
const outcomeW = 280
const influenceW = 190

const xCenter = (w) => Math.round(axisX - w / 2)

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

// Y positions (multi-step journey: D0, D7, D14, D21 + outcomes)
const y = {
  entrance: 90,
  step1: 220,
  step1Decision: 360,
  step2: 500,
  step2Decision: 650,
  step3: 800,
  step3Decision: 950,
  outcomes: 1150,
  followUp: 1320,
}

// Influence nodes (left: internal behavior, right: external context)
const influences = {
  top: 400,
  leftX: 60,
  rightX: 1090,
}

const baseEdge = {
  animated: false,
  type: 'default',
}

const decisionLabel = {
  labelStyle: { fontSize: 10, fontWeight: 700 },
  labelBgStyle: { fill: 'rgba(10, 10, 15, 0.92)', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px' },
}

const influenceEdgeStyle = {
  stroke: 'rgba(100, 116, 139, 0.45)',
  strokeWidth: 1.5,
  strokeDasharray: '4,4',
}

const nodes = [
  // ENTRANCE: Most Consistent Traders segment identified
  {
    ...nodeDefaults,
    id: 'E0',
    type: 'state',
    position: { x: xCenter(stateW), y: y.entrance },
    data: {
      label: { en: 'Consistent trader identified', it: 'Trader consistente identificato' },
      subLabel: {
        en: 'Entered Most Consistent Traders segment',
        it: 'Entrante nel segmento Most Consistent Traders',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Segment Entry', it: 'Ingresso segmento' },
          value: { en: '—', it: '—' },
          metricKey: 'segmentEntry',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },

  // STEP 1 (D0): Consistency badge recognition + tier upgrade offer
  {
    ...nodeDefaults,
    id: 'S1',
    type: 'state',
    position: { x: xCenter(stateW), y: y.step1 },
    data: {
      label: { en: 'Consistency Badge awarded', it: 'Badge Consistenza assegnato' },
      subLabel: {
        en: 'D0: Email + in-app notification "3+ months active"',
        it: 'D0: Email + notifica in-app "3+ mesi attivi"',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Badge delivered', it: 'Badge consegnato' },
          value: { en: '—', it: '—' },
          metricKey: 'badgeDelivered',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'D1',
    type: 'decision',
    position: { x: xCenter(decisionW), y: y.step1Decision },
    data: {
      label: { en: 'Engaged with badge?', it: 'Ha interagito col badge?' },
      subLabel: {
        en: 'Open email or view in-app notification',
        it: 'Apre email o visualizza notifica in-app',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },

  // STEP 2 (D7): Growth roadmap + challenge
  {
    ...nodeDefaults,
    id: 'S2',
    type: 'state',
    position: { x: xCenter(stateW), y: y.step2 },
    data: {
      label: { en: 'Growth roadmap sent', it: 'Roadmap crescita inviata' },
      subLabel: {
        en: 'D7: Personalized 2-month challenge with milestones',
        it: 'D7: Challenge personalizzata 2 mesi con milestone',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Roadmap sent', it: 'Roadmap inviata' },
          value: { en: '—', it: '—' },
          metricKey: 'roadmapSent',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'D2',
    type: 'decision',
    position: { x: xCenter(decisionW), y: y.step2Decision },
    data: {
      label: { en: 'Challenge participation?', it: 'Partecipa challenge?' },
      subLabel: {
        en: 'Reaches Day 7 milestone',
        it: 'Raggiunge milestone Day 7',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },

  // STEP 3 (D14/D21): Reward tier & final push
  {
    ...nodeDefaults,
    id: 'S3',
    type: 'state',
    position: { x: xCenter(stateW), y: y.step3 },
    data: {
      label: { en: 'Loyalty reward sent', it: 'Reward fedeltà inviato' },
      subLabel: {
        en: 'D21: Bonus tied to challenge completion & volume',
        it: 'D21: Bonus legato a completamento challenge + volume',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Bonus delivered', it: 'Bonus consegnato' },
          value: { en: '—', it: '—' },
          metricKey: 'bonusDelivered',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'D3',
    type: 'decision',
    position: { x: xCenter(decisionW), y: y.step3Decision },
    data: {
      label: { en: 'Sustained engagement?', it: 'Engagement sostenuto?' },
      subLabel: {
        en: 'Active 60+ days post-entry',
        it: 'Attivo 60+ giorni post-ingresso',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },

  // OUTCOMES
  {
    ...nodeDefaults,
    id: 'O1',
    type: 'outcome',
    position: { x: 400, y: y.outcomes },
    data: {
      label: { en: 'Promoted to Top Performers', it: 'Promosso a Top Performers' },
      kind: 'positive',
      kpis: [
        {
          label: { en: 'Upward migration', it: 'Migrazione ascendente' },
          value: { en: '—', it: '—' },
          metricKey: 'promotedTopPerformers',
        },
      ],
    },
    style: { width: outcomeW, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'O2',
    type: 'outcome',
    position: { x: 720, y: y.outcomes },
    data: {
      label: { en: 'Remains in Consistent', it: 'Rimane in Consistent' },
      kind: 'neutral',
      kpis: [
        {
          label: { en: 'Retention 60d', it: 'Retention 60g' },
          value: { en: '—', it: '—' },
          metricKey: 'retention60d',
        },
      ],
    },
    style: { width: outcomeW, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'O3',
    type: 'outcome',
    position: { x: 1040, y: y.outcomes },
    data: {
      label: { en: 'Churned / Dormant', it: 'Churned / Dormant' },
      kind: 'negative',
    },
    style: { width: outcomeW, zIndex: 10 },
  },

  // FOLLOW-UP
  {
    ...nodeDefaults,
    id: 'F1',
    type: 'state',
    position: { x: 400, y: y.followUp },
    data: {
      label: { en: 'Top Performers onboarding', it: 'Onboarding Top Performers' },
      subLabel: {
        en: 'VIP account manager assignment',
        it: 'Assegnazione account manager VIP',
      },
      kpis: [
        {
          label: { en: 'Escalation', it: 'Escalation' },
          value: { en: '—', it: '—' },
          metricKey: 'topPerformersEscalation',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'F2',
    type: 'state',
    position: { x: 720, y: y.followUp },
    data: {
      label: { en: 'Cycle restart', it: 'Riavvio ciclo' },
      subLabel: {
        en: 'New recognition + challenge in 30d',
        it: 'Nuovo riconoscimento + challenge in 30g',
      },
      kpis: [
        {
          label: { en: 'Engagement loop', it: 'Loop engagement' },
          value: { en: '—', it: '—' },
          metricKey: 'engagementCycleRestart',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },

  // INFLUENCES (context)
  {
    ...nodeDefaults,
    id: 'I1',
    type: 'communication',
    position: { x: influences.leftX, y: influences.top },
    data: {
      label: { en: 'Active months 3+', it: 'Mesi attivi 3+' },
      subLabel: { en: 'Continuity signal', it: 'Segnale di continuità' },
      kind: 'influence',
    },
    style: { width: influenceW + 40, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'I2',
    type: 'communication',
    position: { x: influences.leftX, y: influences.top + 150 },
    data: {
      label: { en: 'Trades/month 30+', it: 'Trade/mese 30+' },
      subLabel: { en: 'Engagement level', it: 'Livello engagement' },
      kind: 'influence',
    },
    style: { width: influenceW + 40, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'I3',
    type: 'communication',
    position: { x: influences.rightX, y: influences.top },
    data: {
      label: { en: 'Personalization engine', it: 'Engine di personalizzazione' },
      subLabel: { en: 'Roadmap based on history', it: 'Roadmap su storico' },
      kind: 'influence',
    },
    style: { width: influenceW + 60, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'I4',
    type: 'communication',
    position: { x: influences.rightX, y: influences.top + 150 },
    data: {
      label: { en: 'Gamification strategy', it: 'Strategia gamification' },
      subLabel: { en: 'Badges, challenges, rewards', it: 'Badge, challenge, reward' },
      kind: 'influence',
    },
    style: { width: influenceW + 60, zIndex: 10 },
  },
]

const edges = [
  // Main flow spine
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
    id: 'e-D1-S2-yes',
    source: 'D1',
    target: 'S2',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: { en: 'YES', it: 'SÌ' },
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-D1-D2-no',
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
    id: 'e-D2-S3-yes',
    source: 'D2',
    target: 'S3',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: { en: 'YES', it: 'SÌ' },
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-D2-D3-no',
    source: 'D2',
    target: 'D3',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: { en: 'NO', it: 'NO' },
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

  // Outcomes
  {
    ...baseEdge,
    id: 'e-D3-O1-promoted',
    source: 'D3',
    target: 'O1',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: { en: 'YES', it: 'SÌ' },
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-D3-O2-retained',
    source: 'D3',
    target: 'O2',
    sourceHandle: 'out-center',
    targetHandle: 'in',
    label: { en: '60+ DAYS', it: '60+ GIORNI' },
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-D3-O3-churned',
    source: 'D3',
    target: 'O3',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: { en: 'NO', it: 'NO' },
    ...decisionLabel,
  },

  // Follow-up paths
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

  // Influences
  {
    ...baseEdge,
    id: 'e-I1-S1',
    source: 'I1',
    target: 'S1',
    sourceHandle: 'out',
    targetHandle: 'in-left',
    style: influenceEdgeStyle,
  },
  {
    ...baseEdge,
    id: 'e-I2-S2',
    source: 'I2',
    target: 'S2',
    sourceHandle: 'out',
    targetHandle: 'in-left',
    style: influenceEdgeStyle,
  },
  {
    ...baseEdge,
    id: 'e-I3-S2',
    source: 'I3',
    target: 'S2',
    sourceHandle: 'out',
    targetHandle: 'in-right',
    style: influenceEdgeStyle,
  },
  {
    ...baseEdge,
    id: 'e-I4-S3',
    source: 'I4',
    target: 'S3',
    sourceHandle: 'out',
    targetHandle: 'in-right',
    style: influenceEdgeStyle,
  },
]

export const meta = {
  id: 'mostConsistentTraders',
  title: {
    en: 'Most Consistent Traders Journey',
    it: 'Journey per Trader Consistenti',
  },
  description: {
    en: 'Retention & stability engagement: Badge recognition (D0) → 2-month growth challenge (D7) → loyalty reward (D21). KPIs: monthly continuity, avg ticket ↑, retention 60d. Paths: upward migration to Top Performers, sustained engagement, or churn recovery.',
    it: 'Journey di retention e stabilizzazione: riconoscimento badge (D0) → challenge crescita 2 mesi (D7) → reward fedeltà (D21). KPI: continuità mensile, ticket medio ↑, retention 60g. Esiti: promozione verso Top Performers, engagement sostenuto, o churn recovery.',
  },
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: 1450,
  segment: 'most_consistent',
  goal: { en: 'Stabilize & scale medium-high engagement traders', it: 'Stabilizzare e scalare trader con engagement medio-alto' },
  kpis: [
    { en: 'Monthly continuity', it: 'Continuità mensile' },
    { en: 'Avg ticket growth', it: 'Crescita ticket medio' },
    { en: '60d retention', it: 'Retention 60 giorni' },
  ],
}

export { nodes, edges }
