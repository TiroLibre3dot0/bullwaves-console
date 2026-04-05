// Top Performing Traders Segment Flow
// Journey objective: protect profitable traders and increase value retention
// KPIs: retention 30d | net deposits growth | trading volume uplift

const CANVAS_WIDTH = 1600
const axisX = 800

const stateW = 290
const decisionW = 130
const outcomeW = 280
const influenceW = 220

const xCenter = (w) => Math.round(axisX - w / 2)

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

const y = {
  entrance: 90,
  step1: 230,
  step1Decision: 380,
  step2: 540,
  step2Decision: 700,
  step3: 860,
  step3Decision: 1020,
  outcomes: 1210,
  followUp: 1390,
}

const influences = {
  top: 420,
  leftX: 40,
  rightX: 1110,
}

const baseEdge = {
  animated: false,
  type: 'default',
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

const influenceEdgeStyle = {
  stroke: 'rgba(100, 116, 139, 0.45)',
  strokeWidth: 1.5,
  strokeDasharray: '4,4',
}

const nodes = [
  {
    ...nodeDefaults,
    id: 'E0',
    type: 'state',
    position: { x: xCenter(stateW), y: y.entrance },
    data: {
      label: { en: 'Top performer identified', it: 'Top performer identificato' },
      subLabel: {
        en: 'Entered Top Performing Traders segment',
        it: 'Entrato nel segmento Top Performing Traders',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Segment entry', it: 'Ingresso segmento' },
          value: { en: '—', it: '—' },
          metricKey: 'segmentEntry',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S1',
    type: 'state',
    position: { x: xCenter(stateW), y: y.step1 },
    data: {
      label: { en: 'VIP recognition touchpoint', it: 'Touchpoint VIP di riconoscimento' },
      templateId: 'top_performing_vip_recognition_email',
      timingBadge: 'D0',
      subLabel: {
        en: 'D0: email + AM outreach with performance acknowledgement',
        it: 'D0: email + contatto AM con riconoscimento performance',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'VIP touch delivered', it: 'Touch VIP erogato' },
          value: { en: '—', it: '—' },
          metricKey: 'vipTouchDelivered',
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
      label: { en: 'Responded?', it: 'Ha risposto?' },
      subLabel: {
        en: 'Opened / clicked / replied to outreach',
        it: 'Apertura / click / risposta al contatto',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S2',
    type: 'state',
    position: { x: xCenter(stateW), y: y.step2 },
    data: {
      label: { en: 'Advanced tools offer', it: 'Offerta strumenti avanzati' },
      templateId: 'top_performing_advanced_tools_email',
      timingBadge: 'D3',
      subLabel: {
        en: 'D3: premium insights, market brief, trading support',
        it: 'D3: insight premium, market brief, support trading',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Offer delivered', it: 'Offerta inviata' },
          value: { en: '—', it: '—' },
          metricKey: 'offerDelivered',
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
      label: { en: 'Trading uplift?', it: 'Uplift trading?' },
      subLabel: {
        en: 'Higher volume or redeposit after offer',
        it: 'Più volume o redeposit dopo l’offerta',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S3',
    type: 'state',
    position: { x: xCenter(stateW), y: y.step3 },
    data: {
      label: { en: 'Loyalty tier upgrade', it: 'Upgrade loyalty tier' },
      templateId: 'top_performing_loyalty_upgrade_email',
      timingBadge: 'D10',
      subLabel: {
        en: 'D10: reward or concierge perks for sustained profitability',
        it: 'D10: reward o vantaggi concierge per profittabilità sostenuta',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Tier upgrade sent', it: 'Upgrade tier inviato' },
          value: { en: '—', it: '—' },
          metricKey: 'tierUpgradeSent',
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
      label: { en: 'Retained at 30d?', it: 'Retained a 30g?' },
      subLabel: {
        en: 'Still profitable and active after 30 days',
        it: 'Ancora profittevole e attivo dopo 30 giorni',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O1',
    type: 'outcome',
    position: { x: 390, y: y.outcomes },
    data: {
      label: { en: 'Protected VIP revenue', it: 'Revenue VIP protetto' },
      kind: 'positive',
      kpis: [
        {
          label: { en: 'Retention 30d', it: 'Retention 30g' },
          value: { en: '—', it: '—' },
          metricKey: 'retention30d',
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
      label: { en: 'Stable high performer', it: 'High performer stabile' },
      kind: 'neutral',
      kpis: [
        {
          label: { en: 'Volume uplift', it: 'Volume uplift' },
          value: { en: '—', it: '—' },
          metricKey: 'volumeUplift',
        },
      ],
    },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O3',
    type: 'outcome',
    position: { x: 1050, y: y.outcomes },
    data: {
      label: { en: 'Drop in engagement', it: 'Calo di engagement' },
      kind: 'negative',
    },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'F1',
    type: 'state',
    position: { x: 390, y: y.followUp },
    data: {
      label: { en: 'Quarterly VIP review', it: 'Review VIP trimestrale' },
      templateId: 'top_performing_vip_review_email',
      timingBadge: 'Q+0d',
      subLabel: {
        en: 'Q+0d: dedicated account manager follow-up at the quarterly review checkpoint',
        it: 'Q+0d: follow-up con account manager dedicato al checkpoint review trimestrale',
      },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'F2',
    type: 'state',
    position: { x: 720, y: y.followUp },
    data: {
      label: { en: 'Premium nurture loop', it: 'Loop nurture premium' },
      templateId: 'top_performing_premium_nurture_email',
      timingBadge: 'D30',
      subLabel: {
        en: 'D30: repeat insights and loyalty treatment every 30 days',
        it: 'D30: ripeti insight e trattamento loyalty ogni 30 giorni',
      },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'I1',
    type: 'communication',
    position: { x: influences.leftX, y: influences.top },
    data: {
      label: { en: 'Closed P/L > 0', it: 'Closed P/L > 0' },
      subLabel: { en: 'Profitability signal', it: 'Segnale di profittabilità' },
      kind: 'influence',
    },
    style: { width: influenceW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'I2',
    type: 'communication',
    position: { x: influences.leftX, y: influences.top + 150 },
    data: {
      label: { en: '50+ trades', it: '50+ trade' },
      subLabel: { en: 'Proven trader', it: 'Trader comprovato' },
      kind: 'influence',
    },
    style: { width: influenceW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'I3',
    type: 'communication',
    position: { x: influences.rightX, y: influences.top },
    data: {
      label: { en: 'VIP treatment', it: 'Trattamento VIP' },
      subLabel: { en: 'AM, concierge, premium perks', it: 'AM, concierge, premium perks' },
      kind: 'influence',
    },
    style: { width: influenceW + 30, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'I4',
    type: 'communication',
    position: { x: influences.rightX, y: influences.top + 150 },
    data: {
      label: { en: 'Premium market content', it: 'Contenuti market premium' },
      subLabel: { en: 'Insight-driven retention', it: 'Retention guidata da insight' },
      kind: 'influence',
    },
    style: { width: influenceW + 30, zIndex: 10 },
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
    label: { en: 'YES', it: 'SÌ' },
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
    label: { en: 'YES', it: 'SÌ' },
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-D2-D3',
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
  {
    ...baseEdge,
    id: 'e-D3-O1',
    source: 'D3',
    target: 'O1',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: { en: 'YES', it: 'SÌ' },
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
    label: { en: 'NO', it: 'NO' },
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
    style: influenceEdgeStyle,
  },
  {
    ...baseEdge,
    id: 'e-I2-S1',
    source: 'I2',
    target: 'S1',
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
  id: 'topPerformingTraders',
  title: {
    en: 'Top Performing Traders Journey',
    it: 'Journey Top Performing Traders',
  },
  description: {
    en: 'VIP protection and upsell path for profitable high-value traders: premium recognition, advanced tools offer, and loyalty tier upgrade. KPIs: 30-day retention, net deposits growth, and trading volume uplift.',
    it: 'Percorso di protezione VIP e upsell per trader profittevoli ad alto valore: riconoscimento premium, offerta strumenti avanzati e upgrade loyalty. KPI: retention a 30 giorni, crescita net deposit e aumento volume trading.',
  },
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: 1520,
  segment: 'top_performing',
  goal: {
    en: 'Protect profitable high-value traders and grow their lifetime value',
    it: 'Proteggere trader profittevoli ad alto valore e aumentarne il lifetime value',
  },
  kpis: [
    { en: '30d retention', it: 'Retention 30g' },
    { en: 'Net deposits growth', it: 'Crescita net deposit' },
    { en: 'Trading volume uplift', it: 'Aumento volume trading' },
  ],
}

export { nodes, edges }
