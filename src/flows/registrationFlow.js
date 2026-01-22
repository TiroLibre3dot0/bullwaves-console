// Data-only React Flow definition: Registration flow
// Keep this file pure data (no React imports).

const CANVAS_WIDTH = 1600
const axisX = 800

const stateW = 280
const decisionW = 130
const outcomeW = 280

const xCenter = (w) => Math.round(axisX - w / 2)

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

const y = {
  n1: 90,
  n2: 210,
  n3: 330,
  n4: 450,
  n5: 580,
  d1: 740,
  outcomes: 940,
}

const nodes = [
  // Primary spine
  {
    ...nodeDefaults,
    id: 'R1',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n1 },
    data: { label: 'Acquisizione', subLabel: 'Link affiliato / Portale organico', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'R2',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n2 },
    data: { label: 'Registrations', subLabel: 'Registrazione completata', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'R3',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n3 },
    data: {
      label: 'Email di benvenuto inviata',
      subLabel: 'Apri flusso completo ↗',
      kind: 'primary',
      linkToFlow: 'mail',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'R4',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n4 },
    data: {
      label: 'Verifica email / telefono',
      subLabel: 'Step di attivazione account',
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'R5',
    type: 'state',
    position: { x: xCenter(stateW), y: y.n5 },
    data: { label: 'KYC inviato e valutato', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'RD1',
    type: 'decision',
    position: { x: xCenter(decisionW), y: y.d1 },
    data: { label: 'KYC approvato?', kind: 'primary' },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },

  // Outcomes
  {
    ...nodeDefaults,
    id: 'RO1',
    type: 'outcome',
    position: { x: 520, y: y.outcomes },
    data: {
      label: 'Utente pronto a navigare',
      kind: 'positive',
      linkToFlow: 'navigation',
    },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'RO2',
    type: 'outcome',
    position: { x: 860, y: y.outcomes },
    data: { label: 'KYC in attesa / rifiutato', kind: 'neutral' },
    style: { width: outcomeW, zIndex: 10 },
  },
]

const arrow = { type: 'arrowclosed', width: 18, height: 18, color: 'rgba(226,232,240,0.85)' }
const baseEdge = { type: 'step', markerEnd: arrow }

const edges = [
  // Spine
  {
    ...baseEdge,
    id: 'e-R1-R2',
    source: 'R1',
    target: 'R2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-R2-R3',
    source: 'R2',
    target: 'R3',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-R3-R4',
    source: 'R3',
    target: 'R4',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-R4-R5',
    source: 'R4',
    target: 'R5',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-R5-RD1',
    source: 'R5',
    target: 'RD1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },

  // Decision to outcomes
  {
    ...baseEdge,
    id: 'e-RD1-RO1',
    source: 'RD1',
    target: 'RO1',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: 'SI',
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },
  {
    ...baseEdge,
    id: 'e-RD1-RO2',
    source: 'RD1',
    target: 'RO2',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: 'NO',
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },
]

export const meta = {
  id: 'registration',
  title: 'Flusso di registrazione',
  description:
    'Dall’acquisizione all’approvazione KYC. Gli step cross-flow (es. email di benvenuto, passaggio a Navigazione) sono cliccabili (↗).',
}

export { nodes, edges }
