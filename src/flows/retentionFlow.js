// Data-driven React Flow definition for the "Retention" diagram.
// Keep this file pure data (no React imports).

const CANVAS_WIDTH = 1600
const axisX = 800

// Visual priority: center column (primary) > outcomes > influences.
const stateW = 280
const decisionW = 130
const outcomeW = 280
const influenceW = 190

const xCenter = (w) => Math.round(axisX - w / 2)

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

// Y positions (single vertical spine)
const y = {
  reg: 90,
  kyc: 210,
  ndep: 330,
  am: 470,
  mail: 610,
  dep: 760,
  trade: 900,
  pl: 1040,
  d0: 1190,
  wd: 1360,
  dep2: 1360,
  d1: 1530,
  outcomes: 1740,
  follow: 1900,
}

// Influence node placement (only true context, not steps)
const influences = {
  top: 1080,
  leftX: 90,
  rightX: 1090,
}

const nodes = [
  // PRIMARY FLOW (center column)
  {
    ...nodeDefaults,
    id: 'R0',
    type: 'state',
    position: { x: xCenter(stateW), y: y.reg },
    data: {
      label: 'Registrations',
      subLabel: 'Registrazione completata • Apri flusso completo ↗',
      kind: 'primary',
      linkToFlow: 'registration',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N1',
    type: 'state',
    position: { x: xCenter(stateW), y: y.kyc },
    data: { label: 'KYC approvato', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N2',
    type: 'state',
    position: { x: xCenter(stateW), y: y.ndep },
    data: { label: 'Deposits', subLabel: '0 (nessun deposito)', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N3',
    type: 'state',
    position: { x: xCenter(stateW), y: y.am },
    data: { label: 'Contatto AM', subLabel: 'Call / WhatsApp', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N4',
    type: 'state',
    position: { x: xCenter(stateW), y: y.mail },
    data: {
      label: 'Touchpoint email',
      subLabel: 'Apri flusso completo ↗',
      kind: 'primary',
      linkToFlow: 'mail',
    },
    style: { width: stateW, zIndex: 10 },
  },

  {
    ...nodeDefaults,
    id: 'N5',
    type: 'state',
    position: { x: xCenter(stateW), y: y.dep },
    data: { label: 'Deposits', subLabel: 'FTD (First Time Deposit)', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N6',
    type: 'state',
    position: { x: xCenter(stateW), y: y.trade },
    data: { label: 'Trading / attività', subLabel: 'Dopo FTD', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N7',
    type: 'state',
    position: { x: xCenter(stateW), y: y.pl },
    data: { label: 'P&L', subLabel: 'Profit & Loss', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'D1',
    type: 'decision',
    position: { x: xCenter(decisionW), y: y.d0 },
    data: { label: 'P&L positivo?', subLabel: 'Profit vs Loss', kind: 'primary' },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N8',
    type: 'state',
    position: { x: 520, y: y.wd },
    data: { label: 'Withdrawals', subLabel: 'Se profit', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'N9',
    type: 'state',
    position: { x: 860, y: y.dep2 },
    data: { label: 'Deposits', subLabel: 'Nuovo deposito se loss', kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'D2',
    type: 'decision',
    position: { x: xCenter(decisionW), y: y.d1 },
    data: {
      label: 'QFTD raggiunto?',
      subLabel: 'Soglia posizioni aperte o ammontare Deposits',
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },

  // Influences (LEFT: Affiliate/context)
  {
    ...nodeDefaults,
    id: 'A1',
    type: 'communication',
    position: { x: influences.leftX, y: influences.top + 70 },
    data: {
      label: 'Aspettative da affiliate',
      subLabel: 'Preparato vs non preparato',
      kind: 'influence',
    },
    style: { width: influenceW + 60, zIndex: 10 },
  },

  // Influences (RIGHT: Platform/context)
  {
    ...nodeDefaults,
    id: 'C1',
    type: 'communication',
    position: { x: influences.rightX, y: influences.top + 50 },
    data: { label: 'Copy sito / app', kind: 'influence' },
    style: { width: influenceW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'C2',
    type: 'communication',
    position: { x: influences.rightX + 210, y: influences.top + 50 },
    data: {
      label: 'UX navigazione',
      subLabel: 'Apri flusso completo ↗',
      kind: 'influence',
      linkToFlow: 'navigation',
    },
    style: { width: influenceW, zIndex: 10 },
  },

  // OUTCOMES
  {
    ...nodeDefaults,
    id: 'O1',
    type: 'outcome',
    position: { x: 520, y: y.outcomes },
    data: { label: 'QFTD', kind: 'positive' },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O2',
    type: 'outcome',
    position: { x: 860, y: y.outcomes },
    data: { label: 'Non QFTD (ancora)', kind: 'neutral' },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'C0',
    type: 'state',
    position: { x: 520, y: y.follow },
    data: { label: 'Commission all’affiliato', subLabel: 'Dopo QFTD', kind: 'primary' },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O3',
    type: 'outcome',
    position: { x: 860, y: y.follow },
    data: { label: 'Utente perso', kind: 'negative' },
    style: { width: outcomeW, zIndex: 10 },
  },
]

const arrow = { type: 'arrowclosed', width: 18, height: 18, color: 'rgba(226,232,240,0.85)' }

const baseEdge = {
  type: 'step',
  markerEnd: arrow,
}

const decisionLabel = {
  labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
  labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
  labelBgPadding: [6, 4],
}

const influenceEdgeStyle = {
  stroke: 'rgba(148,163,184,0.48)',
  strokeWidth: 1.15,
  strokeDasharray: '6 6',
}

const edges = [
  // Primary flow (single centered spine)
  {
    ...baseEdge,
    id: 'e-R0-N1',
    source: 'R0',
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
    id: 'e-N5-N6',
    source: 'N5',
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
    id: 'e-N7-D1',
    source: 'N7',
    target: 'D1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-D1-N8',
    source: 'D1',
    target: 'N8',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: 'Profit',
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-D1-N9',
    source: 'D1',
    target: 'N9',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: 'Loss',
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-N8-D2',
    source: 'N8',
    target: 'D2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-N9-D2',
    source: 'N9',
    target: 'D2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },

  // Outcomes
  {
    ...baseEdge,
    id: 'e-D2-O1',
    source: 'D2',
    target: 'O1',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: 'SI',
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-D2-O2',
    source: 'D2',
    target: 'O2',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: 'NO',
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-O2-O3',
    source: 'O2',
    target: 'O3',
    sourceHandle: 'out',
    targetHandle: 'in',
    style: { stroke: 'rgba(148,163,184,0.55)', strokeWidth: 1.4 },
  },
  {
    ...baseEdge,
    id: 'e-O1-C0',
    source: 'O1',
    target: 'C0',
    sourceHandle: 'out',
    targetHandle: 'in',
  },

  // Context (influences)
  {
    ...baseEdge,
    id: 'e-A1-D1',
    source: 'A1',
    target: 'D1',
    sourceHandle: 'out',
    targetHandle: 'in-left',
    style: influenceEdgeStyle,
  },
  {
    ...baseEdge,
    id: 'e-C1-N5',
    source: 'C1',
    target: 'N5',
    sourceHandle: 'out',
    targetHandle: 'in',
    style: influenceEdgeStyle,
  },
  {
    ...baseEdge,
    id: 'e-C2-N7',
    source: 'C2',
    target: 'N7',
    sourceHandle: 'out',
    targetHandle: 'in',
    style: influenceEdgeStyle,
  },
]

export const meta = {
  id: 'retention',
  title: 'Flusso Retention (FTD → QFTD)',
  description:
    'Percorso di conversione e Retention: Deposits (FTD), attività (P&L / Withdrawals), e qualificazione a QFTD. Commission all’affiliato dopo QFTD. Rimandi ad altri flussi (↗).',
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: 1900,
}

export { nodes, edges }
