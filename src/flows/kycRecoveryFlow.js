// Data-only React Flow definition: KYC Recovery Flow
// Keep this file pure data (no React imports).

const CANVAS_WIDTH = 1600

// Swimlanes (vertical columns)
const lane = {
  user: { x: 40, w: 300 },
  compliance: { x: 350, w: 300 },
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
  laneH: 1280,

  // Primary flow
  registered: 120,
  kycIncomplete: 260,
  addedList: 420,
  decision: 590,

  // Automation emails (side sequence)
  email1: 480,
  email2: 620,
  email3: 760,
  email4: 900,

  // Outcomes
  outcome1: 1120,
  outcome2: 1210,
  outcome3: 1300,
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
    id: 'L-COMPLIANCE',
    type: 'container',
    position: { x: lane.compliance.x, y: y.laneTop },
    data: { label: { en: 'Compliance', it: 'Compliance' } },
    style: { width: lane.compliance.w, height: y.laneH, zIndex: 0 },
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

  // PRIMARY FLOW (center logic, not the emails)
  {
    ...nodeDefaults,
    id: 'K1',
    type: 'state',
    position: { x: xInLane('user', stateW), y: y.registered },
    data: {
      label: { en: 'User registered', it: 'Utente registrato' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'K2',
    type: 'state',
    position: { x: xInLane('user', stateW), y: y.kycIncomplete },
    data: {
      label: { en: 'KYC incomplete', it: 'KYC incompleto' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'K3',
    type: 'state',
    position: { x: xInLane('automation', stateW), y: y.addedList },
    data: {
      label: {
        en: 'User added to KYC reminders list',
        it: 'Utente aggiunto alla lista reminder KYC',
      },
      subLabel: {
        en: 'SendGrid Automation: KYC Verification Reminders – Bullwaves',
        it: 'SendGrid Automation: KYC Verification Reminders – Bullwaves',
      },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'KD1',
    type: 'decision',
    position: { x: xInLane('compliance', decisionW), y: y.decision },
    data: {
      label: { en: 'KYC completed?', it: 'KYC completato?' },
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
      label: {
        en: 'Complete Your Profile to Start Trading!',
        it: 'Complete Your Profile to Start Trading!',
      },
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
      label: {
        en: 'Don’t Miss Out—Verify Your Account Today!',
        it: 'Don’t Miss Out—Verify Your Account Today!',
      },
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
      label: {
        en: '⚠️ Your access to Bullwaves is at risk—verify now.',
        it: '⚠️ Your access to Bullwaves is at risk—verify now.',
      },
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
      label: { en: 'KYC Last Chance!', it: 'KYC Last Chance!' },
      subLabel: { en: 'Email 4', it: 'Email 4' },
    },
    style: { width: commW, zIndex: 10 },
  },

  // OUTCOMES (bottom)
  {
    ...nodeDefaults,
    id: 'O1',
    type: 'outcome',
    position: { x: xInLane('outcome', outcomeW), y: y.outcome1 },
    data: {
      label: { en: 'KYC completed → User activated', it: 'KYC completato → Utente attivato' },
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
      label: { en: 'Compliance blocked user', it: 'Compliance ha bloccato l’utente' },
      kind: 'negative',
    },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O3',
    type: 'outcome',
    position: { x: xInLane('outcome', outcomeW), y: y.outcome3 },
    data: {
      label: { en: 'Lost user', it: 'Utente perso' },
      kind: 'neutral',
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
  // Primary flow (center column)
  {
    ...baseEdge,
    id: 'e-K1-K2',
    source: 'K1',
    target: 'K2',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-K2-K3',
    source: 'K2',
    target: 'K3',
    sourceHandle: 'out',
    targetHandle: 'in',
  },
  {
    ...baseEdge,
    id: 'e-K3-KD1',
    source: 'K3',
    target: 'KD1',
    sourceHandle: 'out',
    targetHandle: 'in',
  },

  // Decision outcomes
  {
    ...baseEdge,
    id: 'e-KD1-O1',
    source: 'KD1',
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
    id: 'e-KD1-O2',
    source: 'KD1',
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
    id: 'e-KD1-O3',
    source: 'KD1',
    target: 'O3',
    sourceHandle: 'out-b3',
    targetHandle: 'in',
    label: { en: 'NO', it: 'NO' },
    labelStyle: { fill: 'rgba(226,232,240,0.95)', fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: 'rgba(2,6,23,0.85)', borderRadius: 6 },
    labelBgPadding: [6, 4],
  },

  // Automation: waits + emails (dashed, side sequence)
  {
    ...baseEdge,
    type: 'badge',
    style: dashedStyle,
    id: 'e-K3-E1',
    source: 'K3',
    target: 'E1',
    sourceHandle: 'out',
    targetHandle: 'in',
    data: {
      primary: { en: 'Wait 1 day', it: 'Attendi 1 giorno' },
      t: 0.34,
    },
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
    data: {
      primary: { en: 'Wait 3 days', it: 'Attendi 3 giorni' },
      t: 0.34,
    },
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
    data: {
      primary: { en: 'Wait 3 days', it: 'Attendi 3 giorni' },
      t: 0.34,
    },
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
    data: {
      primary: { en: 'Wait 4 days', it: 'Attendi 4 giorni' },
      t: 0.34,
    },
  },

  // Mandatory implicit logic: exit if KYC is completed at ANY point
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
      primary: { en: 'KYC completed → exit flow', it: 'KYC completato → esci dal flow' },
      secondary: { en: 'At any point', it: 'In qualsiasi momento' },
      t: 0.42,
      offsetY: -22,
    },
  },
]

export const meta = {
  id: 'kycRecovery',
  title: { en: 'KYC Recovery Flow', it: 'KYC Recovery Flow' },
  description: {
    en: 'Compliance recovery flow based on a real SendGrid automation (KYC Verification Reminders – Bullwaves). Main path shows the user state and compliance decision; emails are a side automation layer, not the decision path.',
    it: 'Flow di recovery Compliance basato su una reale automazione SendGrid (KYC Verification Reminders – Bullwaves). Il percorso principale mostra lo stato utente e la decisione Compliance; le email sono uno strato laterale di automazione, non il percorso decisionale.',
  },
}

export { CANVAS_WIDTH, nodes, edges }
