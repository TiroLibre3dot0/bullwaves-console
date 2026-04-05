// Unfunded Newcomers Segment Flow
// Journey objective: convert newly registered users with no deposits into first-time depositors
// KPIs: FTD conversion | time to first deposit | first trade activation

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
      label: {
        en: 'Unfunded newcomer identified',
        it: 'Nuovo utente non depositante identificato',
      },
      subLabel: {
        en: 'Entered Unfunded Newcomers segment',
        it: 'Entrato nel segmento Unfunded Newcomers',
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
      label: { en: 'Welcome + value proposition', it: 'Welcome + proposta di valore' },
      templateId: 'unfunded_newcomers_welcome_value_email',
      timingBadge: 'D0',
      subLabel: {
        en: 'D0: email + push highlighting trust, speed, and top payment methods',
        it: 'D0: email + push su fiducia, velocità e metodi di pagamento principali',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Welcome delivered', it: 'Welcome consegnato' },
          value: { en: '—', it: '—' },
          metricKey: 'welcomeDelivered',
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
      label: { en: 'Visited deposit page?', it: 'Ha visitato la pagina deposito?' },
      subLabel: {
        en: 'Clicked CRM or entered cashier',
        it: 'Ha cliccato il CRM o aperto il cashier',
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
      label: { en: 'Friction-reduction sequence', it: 'Sequenza riduzione attriti' },
      templateId: 'unfunded_newcomers_friction_reduction_email',
      timingBadge: 'D2',
      subLabel: {
        en: 'D2: FAQ, payment-method proof, and assisted deposit CTA',
        it: 'D2: FAQ, prova metodi di pagamento e CTA con supporto al deposito',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Deposit assist sent', it: 'Supporto deposito inviato' },
          value: { en: '—', it: '—' },
          metricKey: 'depositAssistSent',
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
      label: { en: 'Started deposit intent?', it: 'Ha mostrato intento di deposito?' },
      subLabel: {
        en: 'KYC completion, cashier open, or payment method selection',
        it: 'KYC completata, cashier aperto o metodo di pagamento selezionato',
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
      label: { en: 'First deposit push', it: 'Spinta al primo deposito' },
      templateId: 'unfunded_newcomers_first_deposit_push_email',
      timingBadge: 'D5',
      subLabel: {
        en: 'D5: limited-time FTD incentive with preferred payment route',
        it: 'D5: incentivo FTD a tempo con percorso pagamento preferito',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'FTD push sent', it: 'Spinta FTD inviata' },
          value: { en: '—', it: '—' },
          metricKey: 'ftdPushSent',
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
      label: { en: 'First deposit completed?', it: 'Ha completato il primo deposito?' },
      subLabel: {
        en: 'Deposit completed within 14 days from entry',
        it: 'Deposito completato entro 14 giorni dall’ingresso',
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
      label: { en: 'FTD converted', it: 'FTD convertito' },
      kind: 'positive',
      kpis: [
        {
          label: { en: 'FTD rate', it: 'Tasso FTD' },
          value: { en: '—', it: '—' },
          metricKey: 'ftdRate',
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
      label: { en: 'Warm but not converted', it: 'Interessato ma non convertito' },
      kind: 'neutral',
      kpis: [
        {
          label: { en: 'Cashier visits', it: 'Visite cashier' },
          value: { en: '—', it: '—' },
          metricKey: 'cashierVisits',
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
      label: { en: 'Cold drop-off', it: 'Drop-off freddo' },
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
      label: { en: 'First trade onboarding', it: 'Onboarding al primo trade' },
      templateId: 'unfunded_newcomers_first_trade_onboarding_email',
      timingBadge: 'FTD +0d',
      subLabel: {
        en: 'FTD +0d: move into activation journey immediately after successful first deposit',
        it: 'FTD +0d: passaggio immediato al journey di activation dopo il primo deposito riuscito',
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
      label: { en: 'Re-entry nurture loop', it: 'Loop di riattivazione soft' },
      templateId: 'unfunded_newcomers_reentry_nurture_email',
      timingBadge: 'D21',
      subLabel: {
        en: 'D21: retry with a new angle after 21 days of no conversion',
        it: 'D21: nuovo tentativo con un angolo diverso dopo 21 giorni senza conversione',
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
      label: { en: '0 deposits / 0 trades', it: '0 depositi / 0 trade' },
      subLabel: { en: 'Pure registration state', it: 'Stato di sola registrazione' },
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
      label: { en: 'Trust and friction barriers', it: 'Barriere di fiducia e attrito' },
      subLabel: {
        en: 'KYC, payments, and reassurance needs',
        it: 'KYC, pagamenti e bisogno di rassicurazione',
      },
      kind: 'influence',
    },
    style: { width: influenceW + 30, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'I3',
    type: 'communication',
    position: { x: influences.rightX, y: influences.top },
    data: {
      label: { en: 'Preferred payment routing', it: 'Routing pagamento preferito' },
      subLabel: {
        en: 'Reduce steps to cashier completion',
        it: 'Ridurre i passaggi fino al completamento',
      },
      kind: 'influence',
    },
    style: { width: influenceW + 40, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'I4',
    type: 'communication',
    position: { x: influences.rightX, y: influences.top + 150 },
    data: {
      label: { en: 'CRM urgency and social proof', it: 'Urgenza CRM e social proof' },
      subLabel: {
        en: 'Deadline plus trust-building messages',
        it: 'Deadline e messaggi che rafforzano la fiducia',
      },
      kind: 'influence',
    },
    style: { width: influenceW + 40, zIndex: 10 },
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
    label: { en: 'WARM', it: 'CALDO' },
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
    id: 'e-I2-S2',
    source: 'I2',
    target: 'S2',
    sourceHandle: 'out',
    targetHandle: 'in-left',
    style: influenceEdgeStyle,
  },
  {
    ...baseEdge,
    id: 'e-I3-S3',
    source: 'I3',
    target: 'S3',
    sourceHandle: 'out',
    targetHandle: 'in-right',
    style: influenceEdgeStyle,
  },
  {
    ...baseEdge,
    id: 'e-I4-S3b',
    source: 'I4',
    target: 'S3',
    sourceHandle: 'out',
    targetHandle: 'in-right',
    style: influenceEdgeStyle,
  },
]

export const meta = {
  id: 'unfundedNewcomers',
  title: {
    en: 'Unfunded Newcomers Journey',
    it: 'Journey Unfunded Newcomers',
  },
  description: {
    en: 'Acquisition-to-FTD path for newly registered accounts with zero deposits and zero trades: welcome value framing, friction removal, and a timed first-deposit push. KPIs: FTD conversion, time to first deposit, and first-trade activation.',
    it: 'Percorso acquisition-to-FTD per account appena registrati con zero depositi e zero trade: value framing iniziale, rimozione attriti e spinta temporizzata al primo deposito. KPI: conversione FTD, tempo al primo deposito e attivazione al primo trade.',
  },
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: 1520,
  segment: 'new_unfunded',
  goal: {
    en: 'Convert newly registered accounts into first-time depositors',
    it: 'Convertire i nuovi account registrati in first-time depositors',
  },
  kpis: [
    { en: 'FTD conversion', it: 'Conversione FTD' },
    { en: 'Time to first deposit', it: 'Tempo al primo deposito' },
    { en: 'First-trade activation', it: 'Attivazione al primo trade' },
  ],
}

export { nodes, edges }
