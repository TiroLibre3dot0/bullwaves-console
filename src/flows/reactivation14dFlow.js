// Data-only React Flow definition: Re-Activation Flow — 14 Days No Trading
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
  laneH: 1450,

  // Primary flow (behavioral)
  scopeDecision: 110,
  scopeNodes: 240,
  active: 380,
  noTrading: 560,
  enter: 740,
  decision: 920,

  // Automation emails (side sequence)
  email1: 800,
  email2: 1080,
  email3: 1240,

  // Outcomes
  outcome1: 1160,
  outcome2: 1280,
  outcome3: 1400,
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

  // Scope decision (two operational scopes, one behavioral strategy)
  {
    ...nodeDefaults,
    id: 'SD0',
    type: 'decision',
    position: { x: xInLane('trading', decisionW), y: y.scopeDecision },
    data: {
      label: { en: 'Scope of inactivity detection?', it: 'Scope rilevazione inattività?' },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'SLOCAL',
    type: 'state',
    position: { x: xInLane('user', stateW), y: y.scopeNodes },
    data: { label: { en: 'Bullwaves Local', it: 'Bullwaves Local' }, kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'SGLOBAL',
    type: 'state',
    position: { x: xInLane('trading', stateW), y: y.scopeNodes },
    data: { label: { en: 'Global', it: 'Global' }, kind: 'primary' },
    style: { width: stateW, zIndex: 10 },
  },

  // PRIMARY FLOW (center logic, not the emails)
  {
    ...nodeDefaults,
    id: 'R1',
    type: 'state',
    position: { x: xInLane('user', stateW), y: y.active },
    data: {
      label: { en: 'Active trader', it: 'Trader attivo' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'R2',
    type: 'state',
    position: { x: xInLane('trading', stateW), y: y.noTrading },
    data: {
      label: { en: 'No trading for 14 days', it: 'Nessun trading per 14 giorni' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'R3',
    type: 'state',
    position: { x: xInLane('automation', stateW), y: y.enter },
    data: {
      label: { en: 'Enter Re-Activation Flow', it: 'Ingresso nel Re-Activation Flow' },
      subLabel: { en: 'Recovery system starts', it: 'Avvio sistema di recovery' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'RD1',
    type: 'decision',
    position: { x: xInLane('trading', decisionW), y: y.decision },
    data: {
      label: { en: 'User trades again?', it: 'L’utente torna a tradare?' },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },

  // AUTOMATION LAYER (side sequence)
  {
    ...nodeDefaults,
    id: 'E1',
    type: 'communication',
    position: { x: xInLane('communication', commW), y: y.email1 },
    data: {
      label: { en: 'Time to Get Back in the Game', it: 'Time to Get Back in the Game' },
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
      label: {
        en: 'Haven’t Traded in a While? Let’s Get You Back on Track!',
        it: 'Haven’t Traded in a While? Let’s Get You Back on Track!',
      },
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
      label: {
        en: 'Take Advantage of Today’s Market Opportunities!',
        it: 'Take Advantage of Today’s Market Opportunities!',
      },
      subLabel: { en: 'Second follow-up', it: 'Secondo follow-up' },
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
      label: { en: 'Reactivated → Active trader', it: 'Riattivato → Trader attivo' },
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
      label: { en: 'Still inactive → Dormant user', it: 'Ancora inattivo → Utente dormiente' },
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
  // Scope branching (one strategy, two scopes)
  {
    ...baseEdge,
    type: 'badge',
    id: 'e-SD0-SLOCAL',
    source: 'SD0',
    target: 'SLOCAL',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    data: { primary: { en: 'Bullwaves Local', it: 'Bullwaves Local' }, t: 0.34 },
  },
  {
    ...baseEdge,
    type: 'badge',
    id: 'e-SD0-SGLOBAL',
    source: 'SD0',
    target: 'SGLOBAL',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    data: { primary: { en: 'Global', it: 'Global' }, t: 0.34 },
  },
  {
    ...baseEdge,
    id: 'e-SLOCAL-R1',
    source: 'SLOCAL',
    target: 'R1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-SGLOBAL-R1',
    source: 'SGLOBAL',
    target: 'R1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },

  // Primary flow
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
    id: 'e-R3-RD1',
    source: 'R3',
    target: 'RD1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },

  // Decision outcomes
  {
    ...baseEdge,
    id: 'e-RD1-O1',
    source: 'RD1',
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
    id: 'e-RD1-O2',
    source: 'RD1',
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
    id: 'e-RD1-O3',
    source: 'RD1',
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
    id: 'e-R3-E1',
    source: 'R3',
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
    data: { primary: { en: 'Wait 2 days', it: 'Attendi 2 giorni' }, t: 0.34 },
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
  id: 'reactivation14d',
  title: {
    en: 'Re-Activation Flow — 14 Days No Trading',
    it: 'Re-Activation Flow — 14 Days No Trading',
  },
  description: {
    en: 'Behavioral reactivation system after 14 days of no trading. Main path shows inactivity → recovery entry → behavior decision → outcome; emails are side tools and the user can trade (exit) at any point.',
    it: 'Sistema di riattivazione comportamentale dopo 14 giorni senza trading. Il percorso principale mostra inattività → ingresso recovery → decisione comportamentale → esito; le email sono strumenti laterali e l’utente può tornare a tradare (exit) in qualsiasi momento.',
  },
}

export { CANVAS_WIDTH, nodes, edges }
