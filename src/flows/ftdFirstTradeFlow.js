// Data-only React Flow definition: FTD → First Trade Activation
// Keep this file pure data (no React imports).

const CANVAS_WIDTH = 1600

// Swimlanes (vertical columns)
const lane = {
  user: { x: 40, w: 300 },
  trading: { x: 350, w: 300 },
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
  laneH: 1320,

  // Primary flow (behavioral)
  ftd: 120,
  noTrades: 300,
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
    id: 'L-TRADING',
    type: 'container',
    position: { x: lane.trading.x, y: y.laneTop },
    data: { label: { en: 'Trading Activity', it: 'Attività di trading' } },
    style: { width: lane.trading.w, height: y.laneH, zIndex: 0 },
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
    id: 'F1',
    type: 'state',
    position: { x: xInLane('user', stateW), y: y.ftd },
    data: {
      label: { en: 'User deposited (FTD)', it: 'Utente ha depositato (FTD)' },
      kpis: [
        {
          label: { en: 'FTD', it: 'FTD' },
          value: { en: '—', it: '—' },
          metricKey: 'ftd',
        },
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
    id: 'F2',
    type: 'state',
    position: { x: xInLane('trading', stateW), y: y.noTrades },
    data: {
      label: { en: 'No trades executed', it: 'Nessun trade eseguito' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'F3',
    type: 'state',
    position: { x: xInLane('automation', stateW), y: y.enter },
    data: {
      label: {
        en: 'Enter First Trade Activation Flow',
        it: 'Ingresso nel First Trade Activation Flow',
      },
      subLabel: { en: 'Activation system starts', it: 'Avvio sistema di attivazione' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'FD1',
    type: 'decision',
    position: { x: xInLane('trading', decisionW), y: y.decision },
    data: {
      label: { en: 'User trades?', it: 'L’utente fa trading?' },
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
      label: { en: 'Ready to Make Your First Move?', it: 'Ready to Make Your First Move?' },
      subLabel: { en: 'Immediate email', it: 'Email immediata' },
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
      label: { en: 'Your Trading Journey Begins Now', it: 'Your Trading Journey Begins Now' },
      subLabel: { en: 'Follow-up', it: 'Follow-up' },
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
      label: {
        en: 'Get in the Game – Start Trading Now!',
        it: 'Get in the Game – Start Trading Now!',
      },
      subLabel: { en: 'Follow-up', it: 'Follow-up' },
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
      label: { en: 'Why Wait? Start Trading Today', it: 'Why Wait? Start Trading Today' },
      subLabel: { en: 'Follow-up', it: 'Follow-up' },
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
        en: 'First trade executed → Active trader',
        it: 'Primo trade eseguito → Trader attivo',
      },
      kind: 'positive',
      kpis: [
        {
          label: { en: 'FTS', it: 'FTS' },
          value: { en: '—', it: '—' },
          metricKey: 'fts',
        },
      ],
    },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O2',
    type: 'outcome',
    position: { x: xInLane('outcome', outcomeW), y: y.outcome2 },
    data: {
      label: { en: 'No trade → Dormant FTD', it: 'Nessun trade → FTD dormiente' },
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
    id: 'e-F1-F2',
    source: 'F1',
    target: 'F2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-F2-F3',
    source: 'F2',
    target: 'F3',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-F3-FD1',
    source: 'F3',
    target: 'FD1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },

  // Decision outcomes
  {
    ...baseEdge,
    id: 'e-FD1-O1',
    source: 'FD1',
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
    id: 'e-FD1-O2',
    source: 'FD1',
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
    id: 'e-FD1-O3',
    source: 'FD1',
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
    id: 'e-F3-E1',
    source: 'F3',
    target: 'E1',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: { primary: { en: 'Immediate', it: 'Immediato' }, t: 0.34 },
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
    data: { primary: { en: 'Wait 1 day', it: 'Attendi 1 giorno' }, t: 0.34 },
  },

  // Mandatory implicit logic: exit if user trades at ANY point
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
      primary: { en: 'User trades → exit flow', it: 'Se tradano → esci dal flow' },
      secondary: { en: 'At any point', it: 'In qualsiasi momento' },
      t: 0.42,
      offsetY: -22,
    },
  },
]

export const meta = {
  id: 'ftdFirstTrade',
  title: { en: 'FTD → First Trade Activation', it: 'FTD → First Trade Activation' },
  description: {
    en: 'Money deposited → activation system → trading behavior → outcome. Main path shows FTD → no trades → activation entry → behavior decision; emails are side tools and the user can trade (exit) at any point.',
    it: 'Deposito (FTD) → sistema di attivazione → comportamento di trading → esito. Il percorso principale mostra FTD → nessun trade → ingresso attivazione → decisione; le email sono strumenti laterali e l’utente può tradare (exit) in qualsiasi momento.',
  },
}

export { CANVAS_WIDTH, nodes, edges }
