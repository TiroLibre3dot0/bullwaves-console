// Data-only React Flow definition: Navigation flow
// Keep this file pure data (no React imports).

const CANVAS_WIDTH = 1600
const axisX = 800

const stateW = 290
const decisionW = 130
const outcomeW = 280

const xCenter = (w) => Math.round(axisX - w / 2)

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

const y = {
  n0: 70,
  n1: 190,
  n2: 310,
  n3: 430,
  n4: 550,
  n5: 670,
  d1: 820,
  outcomes: 1030,
  n6: 1210,
  n7: 1340,
  d2: 1470,
  n8: 1610,
  n9: 1610,
}

const nodes = [
  {
    ...nodeDefaults,
    id: 'N0',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n0 },
    data: {
      label: { en: 'Registrations', it: 'Registrazioni' },
      subLabel: { en: 'Open full flow ↗', it: 'Apri flusso completo ↗' },
      kpis: [
        {
          label: { en: 'Registrations', it: 'Registrazioni' },
          value: { en: '—', it: '—' },
          metricKey: 'registrations',
        },
      ],
      kind: 'primary',
      linkToFlow: 'registration',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N1',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n1 },
    data: {
      label: { en: 'First access / landing', it: 'Primo accesso / landing' },
      subLabel: { en: 'Portal or app entry', it: 'Ingresso portale o app' },
      kpis: [
        {
          label: { en: 'Unique Visitors', it: 'Visitatori Unici' },
          value: { en: '—', it: '—' },
          metricKey: 'uniqueVisitors',
        },
      ],
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N2',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n2 },
    data: {
      label: {
        en: 'Onboarding / key screens visited',
        it: 'Onboarding / schermate chiave visitate',
      },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N3',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n3 },
    data: {
      label: { en: 'Deposit page reached', it: 'Pagina deposito raggiunta' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    type: 'state',
    id: 'N4',
    position: { x: xCenter(stateW), y: y.n4 },
    data: {
      label: { en: 'Deposits', it: 'Depositi' },
      subLabel: { en: 'Method + amount + confirm', it: 'Metodo + importo + conferma' },
      kpis: [
        {
          label: { en: 'N° deposits', it: 'N° depositi' },
          value: { en: '—', it: '—' },
          metricKey: 'depositsCount',
        },
      ],
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N5',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n5 },
    data: {
      label: { en: 'Deposits', it: 'Depositi' },
      subLabel: { en: 'Request sent / processing', it: 'Richiesta inviata / in processing' },
      kpis: [
        {
          label: { en: 'N° deposits', it: 'N° depositi' },
          value: { en: '—', it: '—' },
          metricKey: 'depositsCount',
        },
      ],
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'D1',
    type: 'decision',
    position: { x: xCenter(decisionW), y: y.d1 },
    data: {
      label: { en: 'FTD completed?', it: 'FTD completato?' },
      subLabel: { en: 'First Time Deposit', it: 'First Time Deposit' },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },

  // Outcomes
  {
    ...nodeDefaults,
    id: 'O1',
    type: 'outcome',
    position: { x: 520, y: y.outcomes },
    data: {
      label: { en: 'FTD', it: 'FTD' },
      kind: 'positive',
      kpis: [
        {
          label: { en: 'FTD', it: 'FTD' },
          value: { en: '—', it: '—' },
          metricKey: 'ftd',
        },
      ],
    },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O2',
    type: 'outcome',
    position: { x: 860, y: y.outcomes },
    data: {
      label: { en: 'No FTD / needs follow-up', it: 'No FTD / serve ricontatto' },
      kind: 'neutral',
      linkToFlow: 'retention',
    },
    style: { width: outcomeW, zIndex: 10 },
  },

  // Post-FTD (platform usage)
  {
    ...nodeDefaults,
    id: 'N6',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n6 },
    data: {
      label: { en: 'Trading / activity', it: 'Trading / attività' },
      subLabel: { en: 'After FTD', it: 'Dopo FTD' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N7',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n7 },
    data: {
      label: { en: 'P&L', it: 'P&L' },
      subLabel: { en: 'Profit & Loss', it: 'Profit & Loss' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'D2',
    type: 'decision',
    position: { x: xCenter(decisionW), y: y.d2 },
    data: {
      label: { en: 'P&L positive?', it: 'P&L positivo?' },
      subLabel: { en: 'Profit vs Loss', it: 'Profit vs Loss' },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N8',
    type: 'state',
    position: { x: 520, y: y.n8 },
    data: {
      label: { en: 'Withdrawals', it: 'Prelievi' },
      subLabel: { en: 'If profit', it: 'Se profitto' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N9',
    type: 'state',
    position: { x: 860, y: y.n9 },
    data: {
      label: { en: 'Deposits', it: 'Depositi' },
      subLabel: { en: 'New deposit if loss', it: 'Nuovo deposito se perdita' },
      kpis: [
        {
          label: { en: 'N° deposits', it: 'N° depositi' },
          value: { en: '—', it: '—' },
          metricKey: 'depositsCount',
        },
      ],
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
]

const arrow = { type: 'arrowclosed', width: 18, height: 18, color: 'rgba(226,232,240,0.85)' }
const baseEdge = { type: 'step', markerEnd: arrow }

const edges = [
  {
    ...baseEdge,
    id: 'e-N0-N1',
    source: 'N0',
    target: 'N1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-N1-N2',
    source: 'N1',
    target: 'N2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-N2-N3',
    source: 'N2',
    target: 'N3',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-N3-N4',
    source: 'N3',
    target: 'N4',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-N4-N5',
    source: 'N4',
    target: 'N5',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-N5-D1',
    source: 'N5',
    target: 'D1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-D1-O1',
    source: 'D1',
    target: 'O1',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: { en: 'YES', it: 'SÌ' },
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },
  {
    ...baseEdge,
    id: 'e-D1-O2',
    source: 'D1',
    target: 'O2',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: { en: 'NO', it: 'NO' },
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },
  {
    ...baseEdge,
    id: 'e-O1-N6',
    source: 'O1',
    target: 'N6',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-N6-N7',
    source: 'N6',
    target: 'N7',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-N7-D2',
    source: 'N7',
    target: 'D2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-D2-N8',
    source: 'D2',
    target: 'N8',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: { en: 'Profit', it: 'Profitto' },
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },
  {
    ...baseEdge,
    id: 'e-D2-N9',
    source: 'D2',
    target: 'N9',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: { en: 'Loss', it: 'Perdita' },
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },
]

export const meta = {
  id: 'navigation',
  title: { en: 'Navigation flow', it: 'Flusso di navigazione' },
  description: {
    en: 'After login: key pages, the Deposits path up to FTD, then P&L / Withdrawals. If no FTD, hand off to Retention (↗).',
    it: 'Dopo il login: pagine chiave, percorso Deposits fino a FTD, e poi P&L / Withdrawals. Se non arriva a FTD, passa a Retention (↗).',
  },
}

export { nodes, edges }
