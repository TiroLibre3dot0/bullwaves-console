// Data-only React Flow definition: Master Flow — Full Lifecycle Map
// Keep this file pure data (no React imports).

const CANVAS_WIDTH = 1600
const axisX = 800

const stateW = 320
const influenceW = 260

const xCenter = (w) => Math.round(axisX - w / 2)

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

// Horizontal swimlanes (bands)
const bands = {
  left: 40,
  width: CANVAS_WIDTH - 80,
  acq: { y: 160, h: 250, label: { en: 'Acquisition', it: 'Acquisizione' } },
  reg: {
    y: 440,
    h: 340,
    label: { en: 'Registration & Onboarding', it: 'Registrazione & Onboarding' },
  },
  kyc: { y: 800, h: 280, label: { en: 'Compliance (KYC)', it: 'Compliance (KYC)' } },
  fin: { y: 1100, h: 280, label: { en: 'Finance (Deposits)', it: 'Finanza (Depositi)' } },
  trade: { y: 1400, h: 430, label: { en: 'Trading Activity', it: 'Attività di trading' } },
  ret: { y: 1850, h: 380, label: { en: 'Retention Systems', it: 'Sistemi di retention' } },
  out: { y: 2250, h: 520, label: { en: 'Outcomes', it: 'Esiti' }, accent: true },
}

// Primary lifecycle spine (single vertical axis)
const y = {
  traffic: 235,
  registration: 520,
  kyc: 905,
  ftd: 1210,
  firstTrade: 1515,
  active: 1665,
  dormant: 2005,
  reactivated: 2440,
  lost: 2610,

  // Side systems (attached modules)
  sysReg: 310,
  sysKyc: 660,
  sysPreFtd: 990,
  sysFtdTrade: 1320,
  sysNav: 1550,
  sysRetention: 1910,
  sysReactivation: 2265,

  // Email marketing transversal layer
  emailBand: 50,
  emailNode: 80,
}

// Two right-side columns for attached systems (prevents crossing the spine).
const sysColA = 1010
const sysColB = 1290

// Local communication templates (MVP): two clickable nodes.
// NOTE: Click behavior is implemented in the Flows UI via node.data.templateId.
const commW = 300
const commX = 320

const nodes = [
  // Swimlane background containers (horizontal bands)
  {
    ...nodeDefaults,
    id: 'B-ACQ',
    type: 'container',
    position: { x: bands.left, y: bands.acq.y },
    data: { label: bands.acq.label },
    style: { width: bands.width, height: bands.acq.h, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'B-REG',
    type: 'container',
    position: { x: bands.left, y: bands.reg.y },
    data: { label: bands.reg.label },
    style: { width: bands.width, height: bands.reg.h, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'B-KYC',
    type: 'container',
    position: { x: bands.left, y: bands.kyc.y },
    data: { label: bands.kyc.label },
    style: { width: bands.width, height: bands.kyc.h, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'B-FIN',
    type: 'container',
    position: { x: bands.left, y: bands.fin.y },
    data: { label: bands.fin.label },
    style: { width: bands.width, height: bands.fin.h, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'B-TRADING',
    type: 'container',
    position: { x: bands.left, y: bands.trade.y },
    data: { label: bands.trade.label },
    style: { width: bands.width, height: bands.trade.h, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'B-RET',
    type: 'container',
    position: { x: bands.left, y: bands.ret.y },
    data: { label: bands.ret.label },
    style: { width: bands.width, height: bands.ret.h, zIndex: 0 },
  },
  {
    ...nodeDefaults,
    id: 'B-OUT',
    type: 'container',
    position: { x: bands.left, y: bands.out.y },
    data: { label: bands.out.label, variant: 'accent' },
    style: { width: bands.width, height: bands.out.h, zIndex: 0 },
  },

  // EMAIL MARKETING — transversal layer (NOT a flow branch)
  {
    ...nodeDefaults,
    id: 'B-EMAIL',
    type: 'container',
    position: { x: bands.left, y: y.emailBand },
    data: {
      label: {
        en: 'Email marketing (transversal influence)',
        it: 'Email marketing (influenza trasversale)',
      },
    },
    style: { width: bands.width, height: 90, zIndex: 2 },
  },
  {
    ...nodeDefaults,
    id: 'EMAIL',
    type: 'communication',
    position: { x: xCenter(1080), y: y.emailNode },
    data: {
      kind: 'influence',
      label: { en: 'Email marketing', it: 'Email marketing' },
      subLabel: {
        en: 'Overlay layer • Influences lifecycle stages • Open full flow ↗',
        it: 'Layer overlay • Influenza le fasi del lifecycle • Apri flusso completo ↗',
      },
      linkToFlow: 'mail',
    },
    style: { width: 1080, zIndex: 12 },
  },

  // PRIMARY LIFECYCLE SPINE (center column)
  {
    ...nodeDefaults,
    id: 'S1',
    type: 'state',
    position: { x: xCenter(stateW), y: y.traffic },
    data: {
      label: { en: 'Traffic / Acquisition', it: 'Traffico / Acquisizione' },
      subLabel: { en: 'Top of funnel', it: 'Top of funnel' },
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
    id: 'S2',
    type: 'state',
    position: { x: xCenter(stateW), y: y.registration },
    data: {
      label: { en: 'Registration', it: 'Registrazione' },
      subLabel: { en: 'User created an account', it: 'Utente creato account' },
      kpis: [
        {
          label: { en: 'Registrations', it: 'Registrazioni' },
          value: { en: '—', it: '—' },
          metricKey: 'registrations',
        },
      ],
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },

  // Communication templates (click to preview)
  {
    ...nodeDefaults,
    id: 'COMM-WELCOME-EMAIL',
    type: 'communication',
    position: { x: commX, y: y.registration - 10 },
    data: {
      label: { en: 'Welcome Email', it: 'Welcome Email' },
      subLabel: { en: 'Email', it: 'Email' },
      templateId: 'welcome_email',
    },
    style: { width: commW, zIndex: 11 },
  },
  {
    ...nodeDefaults,
    id: 'COMM-WELCOME-WHATSAPP',
    type: 'communication',
    position: { x: commX, y: y.registration + 90 },
    data: {
      label: { en: 'WhatsApp Message', it: 'Messaggio WhatsApp' },
      subLabel: { en: 'WhatsApp', it: 'WhatsApp' },
      templateId: 'welcome_whatsapp',
    },
    style: { width: commW, zIndex: 11 },
  },
  {
    ...nodeDefaults,
    id: 'S3',
    type: 'state',
    position: { x: xCenter(stateW), y: y.kyc },
    data: {
      label: { en: 'KYC Verification', it: 'Verifica KYC' },
      subLabel: { en: 'Compliance unlock', it: 'Sblocco compliance' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S4',
    type: 'state',
    position: { x: xCenter(stateW), y: y.ftd },
    data: {
      label: { en: 'First Deposit (FTD)', it: 'Primo deposito (FTD)' },
      subLabel: { en: 'Revenue creation starts', it: 'Inizio creazione revenue' },
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
    id: 'S5',
    type: 'state',
    position: { x: xCenter(stateW), y: y.firstTrade },
    data: {
      label: { en: 'First Trade', it: 'Primo trade' },
      subLabel: { en: 'Activation milestone', it: 'Milestone di attivazione' },
      kpis: [
        {
          label: { en: 'FTS', it: 'FTS' },
          value: { en: '—', it: '—' },
          metricKey: 'fts',
        },
      ],
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S6',
    type: 'state',
    position: { x: xCenter(stateW), y: y.active },
    data: {
      label: { en: 'Active Trader', it: 'Trader attivo' },
      subLabel: { en: 'Core value loop (trading)', it: 'Core value loop (trading)' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S7',
    type: 'state',
    position: { x: xCenter(stateW), y: y.dormant },
    data: {
      label: { en: 'Dormant User', it: 'Utente dormiente' },
      subLabel: { en: 'Drop in activity', it: 'Calo di attività' },
      branching: true,
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S8',
    type: 'state',
    position: { x: xCenter(stateW), y: y.reactivated },
    data: {
      label: { en: 'Reactivated User', it: 'Utente riattivato' },
      subLabel: { en: 'Returns to activity', it: 'Ritorno all’attività' },
      branching: true,
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S9',
    type: 'state',
    position: { x: xCenter(stateW), y: y.lost },
    data: {
      label: { en: 'Lost User', it: 'Utente perso' },
      subLabel: { en: 'Churn (exit)', it: 'Churn (uscita)' },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },

  // SIDE SYSTEMS (secondary, attached between spine transitions)
  {
    ...nodeDefaults,
    id: 'SYS-REG',
    type: 'communication',
    position: { x: sysColA, y: y.sysReg },
    data: {
      kind: 'influence',
      label: { en: 'Registration flow', it: 'Flow Registrazione' },
      subLabel: { en: 'Open ↗', it: 'Apri ↗' },
      linkToFlow: 'registration',
    },
    style: { width: influenceW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'SYS-PREFTD',
    type: 'communication',
    position: { x: sysColA, y: y.sysPreFtd },
    data: {
      kind: 'influence',
      label: { en: 'Pre-FTD Conversion', it: 'Pre-FTD Conversion' },
      subLabel: { en: 'Signup → FTD • Open ↗', it: 'Signup → FTD • Apri ↗' },
      linkToFlow: 'preFtdConversion',
    },
    style: { width: influenceW + 40, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'SYS-KYC',
    type: 'communication',
    position: { x: sysColB, y: y.sysKyc },
    data: {
      kind: 'influence',
      label: { en: 'KYC Recovery', it: 'KYC Recovery' },
      subLabel: { en: 'Recover verification • Open ↗', it: 'Recupero verifica • Apri ↗' },
      linkToFlow: 'kycRecovery',
    },
    style: { width: influenceW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'SYS-FTDTRADE',
    type: 'communication',
    position: { x: sysColB, y: y.sysFtdTrade },
    data: {
      kind: 'influence',
      label: { en: 'FTD → First Trade', it: 'FTD → Primo trade' },
      subLabel: { en: 'Activation system • Open ↗', it: 'Sistema attivazione • Apri ↗' },
      linkToFlow: 'ftdFirstTrade',
    },
    style: { width: influenceW + 30, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'SYS-NAV',
    type: 'communication',
    position: { x: sysColA, y: y.sysNav },
    data: {
      kind: 'influence',
      label: { en: 'Navigation', it: 'Navigazione' },
      subLabel: { en: 'On-platform guidance • Open ↗', it: 'Guida in piattaforma • Apri ↗' },
      linkToFlow: 'navigation',
    },
    style: { width: influenceW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'SYS-RET',
    type: 'communication',
    position: { x: sysColB, y: y.sysRetention },
    data: {
      kind: 'influence',
      label: { en: 'Retention', it: 'Retention' },
      subLabel: { en: 'Prevent dormancy • Open ↗', it: 'Prevenzione dormienza • Apri ↗' },
      kpis: [
        {
          label: { en: 'QFTD', it: 'QFTD' },
          value: { en: '—', it: '—' },
          metricKey: 'qftd',
        },
      ],
      linkToFlow: 'retention',
    },
    style: { width: influenceW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'SYS-REACT',
    type: 'communication',
    position: { x: sysColA, y: y.sysReactivation },
    data: {
      kind: 'influence',
      label: { en: 'Re-Activation (14d)', it: 'Re-Activation (14d)' },
      subLabel: { en: 'Recover dormant • Open ↗', it: 'Recupero dormienti • Apri ↗' },
      linkToFlow: 'reactivation14d',
    },
    style: { width: influenceW + 40, zIndex: 10 },
  },
]

const arrow = { type: 'arrowclosed', width: 18, height: 18, color: 'rgba(226,232,240,0.85)' }
const baseEdge = { type: 'step', markerEnd: arrow }

const dashedStyle = {
  stroke: 'rgba(148,163,184,0.55)',
  strokeWidth: 1.6,
  strokeDasharray: '6 6',
}

const spineEdge = (id, source, target) => ({
  ...baseEdge,
  id,
  source,
  target,
  sourceHandle: 'out',
  targetHandle: 'in',
})

const attach = (id, source, target, primary, secondary) => ({
  ...baseEdge,
  type: 'badge',
  id,
  source,
  target,
  sourceHandle: 'out',
  targetHandle: 'in',
  style: dashedStyle,
  data: {
    primary,
    secondary,
    t: 0.24,
    offsetY: -26,
  },
})

const edges = [
  // PRIMARY LIFECYCLE SPINE (dominant)
  spineEdge('e-S1-S2', 'S1', 'S2'),
  spineEdge('e-S2-S3', 'S2', 'S3'),
  spineEdge('e-S3-S4', 'S3', 'S4'),
  spineEdge('e-S4-S5', 'S4', 'S5'),
  spineEdge('e-S5-S6', 'S5', 'S6'),
  spineEdge('e-S6-S7', 'S6', 'S7'),
  spineEdge('e-S7-S8', 'S7', 'S8'),

  // COMMUNICATION TEMPLATES (preview only)
  spineEdge('e-S2-COMM-WELCOME-EMAIL', 'S2', 'COMM-WELCOME-EMAIL'),
  spineEdge('e-COMM-WELCOME-EMAIL-COMM-WHATSAPP', 'COMM-WELCOME-EMAIL', 'COMM-WELCOME-WHATSAPP'),

  // Outcome logic (fail path)
  {
    ...baseEdge,
    type: 'badge',
    id: 'e-S7-S9-fail',
    source: 'S7',
    target: 'S9',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    style: dashedStyle,
    data: {
      primary: { en: 'If fail → Lost user', it: 'Se fallisce → Utente perso' },
      secondary: { en: 'Churn', it: 'Churn' },
      t: 0.55,
      offsetY: -22,
    },
  },

  // Success loop (reactivation brings user back)
  {
    ...baseEdge,
    type: 'badge',
    id: 'e-S8-S6-success',
    source: 'S8',
    target: 'S6',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    style: dashedStyle,
    data: {
      primary: { en: 'If success → Active trader', it: 'Se successo → Trader attivo' },
      secondary: { en: 'Return loop', it: 'Loop di ritorno' },
      t: 0.55,
      offsetY: -22,
    },
  },

  // SIDE SYSTEM ATTACHMENTS (secondary)
  attach(
    'e-S1-SYSREG',
    'S1',
    'SYS-REG',
    { en: 'Attach', it: 'Collega' },
    { en: 'Traffic → Registration', it: 'Traffico → Registrazione' }
  ),
  attach(
    'e-S2-SYSKYC',
    'S2',
    'SYS-KYC',
    { en: 'Attach', it: 'Collega' },
    { en: 'Registration → KYC', it: 'Registrazione → KYC' }
  ),
  attach(
    'e-S2-SYSPREFTD',
    'S2',
    'SYS-PREFTD',
    { en: 'Attach', it: 'Collega' },
    { en: 'Registration → FTD', it: 'Registrazione → FTD' }
  ),
  attach(
    'e-S4-SYSFTDTRADE',
    'S4',
    'SYS-FTDTRADE',
    { en: 'Attach', it: 'Collega' },
    { en: 'FTD → Trade', it: 'FTD → Trade' }
  ),
  attach(
    'e-S5-SYSNAV',
    'S5',
    'SYS-NAV',
    { en: 'Attach', it: 'Collega' },
    { en: 'First Trade → Active', it: 'Primo trade → Attivo' }
  ),
  attach(
    'e-S6-SYSRET',
    'S6',
    'SYS-RET',
    { en: 'Attach', it: 'Collega' },
    { en: 'Active → Dormant', it: 'Attivo → Dormiente' }
  ),
  attach(
    'e-S7-SYSREACT',
    'S7',
    'SYS-REACT',
    { en: 'Attach', it: 'Collega' },
    { en: 'Dormant → Reactivated', it: 'Dormiente → Riattivato' }
  ),
]

export const meta = {
  id: 'master',
  title: {
    en: 'Master Flow — Full Lifecycle Map',
    it: 'Master Flow — Full Lifecycle Map',
  },
  description: {
    en: 'Single strategic map that connects all lifecycle stages on a dominant central spine, with existing flows attached as secondary side systems. Email marketing is represented as a transversal influence layer (not a branch).',
    it: 'Mappa strategica unica che connette tutte le fasi del ciclo di vita su una spina centrale dominante, con i flussi esistenti come sistemi laterali secondari. Email marketing è un layer di influenza trasversale (non un ramo).',
  },
}

export { CANVAS_WIDTH, nodes, edges }
