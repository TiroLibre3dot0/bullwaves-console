// Data-only React Flow definition: Mail marketing flow
// Keep this file pure data (no React imports).

const axisX = 800

const stateW = 300
const outcomeW = 280

const xCenter = (w) => Math.round(axisX - w / 2)

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

const y = {
  t1: 70,
  n1: 200,
  n2: 330,
  n3: 460,
  n4: 590,
  n5: 720,
  n6: 850,
  n7: 980,
  n8: 1110,
  outcomes: 1320,
}

const nodes = [
  // Triggers (cross-flow steps)
  {
    ...nodeDefaults,
    id: 'T1',
    type: 'state',
    position: { x: 160, y: y.t1 },
    data: {
      label: 'Registrations',
      subLabel: 'Apri flusso completo ↗',
      kind: 'primary',
      linkToFlow: 'registration',
    },
    style: { width: 280, zIndex: 12 },
  },
  {
    ...nodeDefaults,
    id: 'T2',
    type: 'state',
    position: { x: 1160, y: y.t1 },
    data: {
      label: 'Nessun deposito',
      subLabel: 'Apri flusso completo ↗',
      kind: 'primary',
      linkToFlow: 'retention',
    },
    style: { width: 280, zIndex: 12 },
  },

  {
    ...nodeDefaults,
    id: 'M1',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n1 },
    data: {
      label: 'Automazione email avviata',
      subLabel: 'Logica campagna applicata',
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'M2',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n2 },
    data: {
      label: 'Email di benvenuto',
      subLabel: 'Subito dopo la registrazione',
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'M3',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n3 },
    data: { label: 'Email education / prodotto', subLabel: 'Giorno 1–3', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'M4',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n4 },
    data: { label: 'Deposits reminder', subLabel: 'Se non ha ancora fatto FTD', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'M5',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n5 },
    data: { label: 'Re-engagement', subLabel: 'Se inattività continua', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'M6',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n6 },
    data: { label: 'FTD follow-up', subLabel: 'Dopo First Time Deposit', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'M7',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n7 },
    data: {
      label: 'QFTD milestone',
      subLabel: 'Soglia posizioni aperte o ammontare Deposits',
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'M8',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n8 },
    data: { label: 'Withdrawals / P&L', subLabel: 'Info e guida post-FTD', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },

  // Outcomes
  {
    ...nodeDefaults,
    id: 'MO1',
    type: 'outcome',
    position: { x: 520, y: y.outcomes },
    data: { label: 'Deposits / attività avviata', kind: 'positive' },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'MO2',
    type: 'outcome',
    position: { x: 860, y: y.outcomes },
    data: { label: 'Serve contatto umano', kind: 'neutral' },
    style: { width: outcomeW, zIndex: 10 },
  },
]

const arrow = { type: 'arrowclosed', width: 18, height: 18, color: 'rgba(226,232,240,0.85)' }
const baseEdge = { type: 'step', markerEnd: arrow }

const edges = [
  {
    ...baseEdge,
    id: 'e-T1-M1',
    source: 'T1',
    target: 'M1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-T2-M1',
    source: 'T2',
    target: 'M1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-M1-M2',
    source: 'M1',
    target: 'M2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-M2-M3',
    source: 'M2',
    target: 'M3',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-M3-M4',
    source: 'M3',
    target: 'M4',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-M4-M5',
    source: 'M4',
    target: 'M5',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-M5-M6',
    source: 'M5',
    target: 'M6',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-M6-M7',
    source: 'M6',
    target: 'M7',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-M7-M8',
    source: 'M7',
    target: 'M8',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-M8-MO1',
    source: 'M8',
    target: 'MO1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-M8-MO2',
    source: 'M8',
    target: 'MO2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
]

export const meta = {
  id: 'mail',
  title: 'Flusso email marketing',
  description:
    'Touchpoint email come step espliciti con terminologia piattaforma (Deposits, FTD, QFTD, Withdrawals, P&L). I trigger cross-flow sono cliccabili (↗).',
}

export { nodes, edges }
