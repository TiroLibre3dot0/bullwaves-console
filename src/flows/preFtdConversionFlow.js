// Data-only React Flow definition: Signup → First Deposit (Pre-FTD Conversion)
// Keep this file pure data (no React imports).

const CANVAS_WIDTH = 1600

// Swimlanes (vertical columns)
const lane = {
  user: { x: 40, w: 300 },
  finance: { x: 350, w: 300 },
  automation: { x: 660, w: 300 },
  communication: { x: 970, w: 300 },
  outcome: { x: 1280, w: 300 },
}

const stateW = 280
const decisionW = 130
const commW = 280
const outcomeW = 280

const xInLane = (laneKey, nodeW) => Math.round(lane[laneKey].x + (lane[laneKey].w - nodeW) / 2)

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

const y = {
  laneTop: 50,
  laneH: 1340,

  // Primary flow (behavioral)
  signup: 120,
  noDeposit: 300,
  enter: 500,
  decision: 700,

  // Automation emails (side sequence)
  email1: 560,
  email2: 740,
  email3: 920,
  email4: 1100,

  // Outcomes
  outcome1: 880,
  outcome2: 1030,
  outcome3: 1180,
}

const nodes = [
  // Swimlane background containers
  {
    ...nodeDefaults,
    id: 'L-USER',
    type: 'container',
    position: { x: lane.user.x, y: y.laneTop },
    data: { label: { en: 'User State', it: 'Stato utente' } },
    style: { width: lane.user.w, height: y.laneH, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'L-FINANCE',
    type: 'container',
    position: { x: lane.finance.x, y: y.laneTop },
    data: { label: { en: 'Finance / Deposit', it: 'Finanza / Deposito' } },
    style: { width: lane.finance.w, height: y.laneH, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'L-AUTOMATION',
    type: 'container',
    position: { x: lane.automation.x, y: y.laneTop },
    data: { label: { en: 'Automation System', it: 'Sistema automazioni' } },
    style: { width: lane.automation.w, height: y.laneH, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'L-COMMUNICATION',
    type: 'container',
    position: { x: lane.communication.x, y: y.laneTop },
    data: { label: { en: 'Communication', it: 'Comunicazione' } },
    style: { width: lane.communication.w, height: y.laneH, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'L-OUTCOME',
    type: 'container',
    position: { x: lane.outcome.x, y: y.laneTop },
    data: { label: { en: 'Outcome', it: 'Esito' }, variant: 'accent' },
    style: { width: lane.outcome.w, height: y.laneH, zIndex: 0 },
  },

  // PRIMARY FLOW (main story, not the emails)
  {
    ...nodeDefaults,
    id: 'P1',
    type: 'state',
    position: { x: xInLane('user', stateW), y: y.signup },
    data: {
      label: { en: 'User registered', it: 'Utente registrato' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'P2',
    type: 'state',
    position: { x: xInLane('finance', stateW), y: y.noDeposit },
    data: {
      label: { en: 'No deposit', it: 'Nessun deposito' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'P3',
    type: 'state',
    position: { x: xInLane('automation', stateW), y: y.enter },
    data: {
      label: { en: 'Enter Pre-FTD Conversion Flow', it: 'Ingresso nel Pre-FTD Conversion Flow' },
      subLabel: { en: 'Conversion system starts', it: 'Avvio sistema di conversione' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'PD1',
    type: 'decision',
    position: { x: xInLane('finance', decisionW), y: y.decision },
    data: {
      label: { en: 'User deposits?', it: 'L’utente deposita?' },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },

  // AUTOMATION LAYER (side tools)
  {
    ...nodeDefaults,
    id: 'E1',
    type: 'communication',
    position: { x: xInLane('communication', commW), y: y.email1 },
    data: {
      kind: 'influence',
      label: { en: 'Your account is ready to go', it: 'Your account is ready to go' },
      subLabel: { en: 'Email 1', it: 'Email 1' },
    },
    style: { width: commW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'E2',
    type: 'communication',
    position: { x: xInLane('communication', commW), y: y.email2 },
    data: {
      kind: 'influence',
      label: { en: 'Still thinking about it?', it: 'Still thinking about it?' },
      subLabel: { en: 'Email 2', it: 'Email 2' },
    },
    style: { width: commW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'E3',
    type: 'communication',
    position: { x: xInLane('communication', commW), y: y.email3 },
    data: {
      kind: 'influence',
      label: { en: 'What’s holding you back?', it: 'What’s holding you back?' },
      subLabel: { en: 'Email 3', it: 'Email 3' },
    },
    style: { width: commW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'E4',
    type: 'communication',
    position: { x: xInLane('communication', commW), y: y.email4 },
    data: {
      kind: 'influence',
      label: { en: 'Don’t just take our word for it', it: 'Don’t just take our word for it' },
      subLabel: { en: 'Email 4', it: 'Email 4' },
    },
    style: { width: commW, zIndex: 10 },
  },

  // OUTCOMES
  {
    ...nodeDefaults,
    id: 'O1',
    type: 'outcome',
    position: { x: xInLane('outcome', outcomeW), y: y.outcome1 },
    data: {
      label: {
        en: 'First Deposit completed → FTD user',
        it: 'Primo deposito completato → Utente FTD',
      },
      kind: 'positive',
    },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O2',
    type: 'outcome',
    position: { x: xInLane('outcome', outcomeW), y: y.outcome2 },
    data: {
      label: { en: 'No deposit → Dormant lead', it: 'Nessun deposito → Lead dormiente' },
      kind: 'neutral',
    },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O3',
    type: 'outcome',
    position: { x: xInLane('outcome', outcomeW), y: y.outcome3 },
    data: {
      label: { en: 'Long inactivity → Lost user', it: 'Lunga inattività → Utente perso' },
      kind: 'negative',
    },
    style: { width: outcomeW, zIndex: 10 },
  },
]

const arrow = { type: 'arrowclosed', width: 18, height: 18, color: 'rgba(226,232,240,0.85)' }
const baseEdge = { type: 'step', markerEnd: arrow }

const dashedStyle = {
  stroke: 'rgba(148,163,184,0.55)',
  strokeWidth: 1.6,
  strokeDasharray: '6 6',
}

const edges = [
  // Primary flow
  {
    ...baseEdge,
    id: 'e-P1-P2',
    source: 'P1',
    target: 'P2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-P2-P3',
    source: 'P2',
    target: 'P3',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-P3-PD1',
    source: 'P3',
    target: 'PD1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },

  // Decision outcomes
  {
    ...baseEdge,
    id: 'e-PD1-O1',
    source: 'PD1',
    target: 'O1',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: { en: 'YES', it: 'SÌ' },
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },
  {
    ...baseEdge,
    id: 'e-PD1-O2',
    source: 'PD1',
    target: 'O2',
    sourceHandle: 'out-b1',
    targetHandle: 'in',
    label: { en: 'NO', it: 'NO' },
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },
  {
    ...baseEdge,
    id: 'e-PD1-O3',
    source: 'PD1',
    target: 'O3',
    sourceHandle: 'out-b3',
    targetHandle: 'in',
    label: { en: 'NO', it: 'NO' },
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },

  // Automation: emails (dashed)
  {
    ...baseEdge,
    type: 'badge',
    style: dashedStyle,
    id: 'e-P3-E1',
    source: 'P3',
    target: 'E1',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: { primary: { en: 'Wait 5 hours', it: 'Attendi 5 ore' }, t: 0.34 },
  },
  {
    ...baseEdge,
    type: 'badge',
    style: dashedStyle,
    id: 'e-E1-E2',
    source: 'E1',
    target: 'E2',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: { primary: { en: 'Wait 1 day', it: 'Attendi 1 giorno' }, t: 0.34 },
  },
  {
    ...baseEdge,
    type: 'badge',
    style: dashedStyle,
    id: 'e-E2-E3',
    source: 'E2',
    target: 'E3',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: { primary: { en: 'Wait 1 day', it: 'Attendi 1 giorno' }, t: 0.34 },
  },
  {
    ...baseEdge,
    type: 'badge',
    style: dashedStyle,
    id: 'e-E3-E4',
    source: 'E3',
    target: 'E4',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: { primary: { en: 'Wait 2 days', it: 'Attendi 2 giorni' }, t: 0.34 },
  },

  // Mandatory implicit logic: exit if user deposits at ANY point
  {
    ...baseEdge,
    type: 'badge',
    style: dashedStyle,
    id: 'e-E1-O1-exit',
    source: 'E1',
    target: 'O1',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: {
      primary: { en: 'User deposits → exit flow', it: 'Se depositano → esci dal flow' },
      secondary: { en: 'At any point', it: 'In qualsiasi momento' },
      t: 0.42,
      offsetY: -22,
    },
  },
]

export const meta = {
  id: 'preFtdConversion',
  title: {
    en: 'Signup → First Deposit (Pre-FTD Conversion)',
    it: 'Signup → First Deposit (Pre-FTD Conversion)',
  },
  description: {
    en: 'Signup → conversion system → deposit behavior → outcome. Main path shows registered → no deposit → conversion entry → behavior decision; emails are side tools and the user can deposit (exit) at any point.',
    it: 'Signup → sistema di conversione → comportamento di deposito → esito. Il percorso principale mostra registrato → nessun deposito → ingresso conversione → decisione; le email sono strumenti laterali e l’utente può depositare (exit) in qualsiasi momento.',
  },
}

export { CANVAS_WIDTH, nodes, edges }
