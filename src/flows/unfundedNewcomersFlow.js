// Unfunded Newcomers Segment Flow
// Journey objective: convert newly registered users with no deposits into first-time depositors
// KPIs: FTD conversion | time to first deposit | first trade activation

const CANVAS_WIDTH = 2920
const CANVAS_HEIGHT = 700

const stateW = 290
const decisionW = 130
const outcomeW = 280
const influenceW = 220

const x = {
  entrance: 80,
  step1: 360,
  decision1: 710,
  noDeposit: 980,
  depositTrade: 980,
  decision2: 1330,
  recovery: 1600,
  depositPush: 1600,
  decision3: 1950,
  outcomes: 2210,
  followUp: 2520,
}

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

const y = {
  main: 170,
  upper: 80,
  lower: 260,
  decision: 170,
  upperDecision: 170,
  topOutcome: 80,
  middleOutcome: 170,
  bottomOutcome: 260,
  followUpTop: 80,
  followUpMiddle: 170,
  influences: 520,
}

const influences = {
  top: y.influences,
  x1: 120,
  x2: 390,
  x3: 760,
  x4: 1080,
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
    position: { x: x.entrance, y: y.main },
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
    position: { x: x.step1, y: y.main },
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
    position: { x: x.decision1, y: y.decision },
    data: {
      label: {
        en: 'Deposit + trade within 48h?',
        it: 'Deposito + trade entro 48h?',
      },
      subLabel: {
        en: 'YES when both events are tracked within 48 hours from welcome: first deposit confirmed and at least one trade opened. NO when no deposit is recorded in that window.',
        it: 'YES quando entro 48 ore dal welcome risultano entrambi gli eventi: primo deposito confermato e almeno un trade aperto. NO quando in quella finestra non risulta alcun deposito.',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S2',
    type: 'state',
    position: { x: x.depositTrade, y: y.lower },
    data: {
      label: { en: '+48hr - Deposit + trade', it: '+48h - Deposito + trade' },
      templateId: 'unfunded_newcomers_post_login_deposit_activation_email',
      timingBadge: '+48hr',
      subLabel: {
        en: 'Triggered at +48h for users with confirmed first deposit and at least one open trade. This is the successful early-activation branch and hands off to dedicated account-manager support.',
        it: 'Scatta a +48h per utenti con primo deposito confermato e almeno un trade aperto. Questo è il ramo di attivazione rapida e porta al supporto dedicato dell account manager.',
      },
      kind: 'primary',
      kpis: [
        {
          label: {
            en: 'Deposit+trade follow-up sent',
            it: 'Follow-up deposito+trade inviato',
          },
          value: { en: '—', it: '—' },
          metricKey: 'depositAssistSent',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S1B',
    type: 'state',
    position: { x: x.noDeposit, y: y.upper },
    data: {
      label: {
        en: '+48hr - No deposit',
        it: '+48h - Nessun deposito',
      },
      templateId: 'unfunded_newcomers_account_activation_reminder_email',
      timingBadge: '+48hr',
      subLabel: {
        en: 'Triggered at +48h when no deposit event is recorded after welcome. Content pushes a clear first action to start funding.',
        it: 'Scatta a +48h quando dopo il welcome non risulta alcun deposito. Il contenuto spinge una prima azione chiara per avviare il funding.',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'No-deposit follow-up sent', it: 'Follow-up no-deposito inviato' },
          value: { en: '—', it: '—' },
          metricKey: 'activationReminderSent',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'D2',
    type: 'decision',
    position: { x: x.decision2, y: y.upperDecision },
    data: {
      label: {
        en: 'Funding-path activity within 3d?',
        it: 'Attività percorso deposito entro 3g?',
      },
      subLabel: {
        en: 'YES when at least one of these events is tracked after the no-deposit follow-up: deposit page opened, verification started or completed, or payment method selected. NO if no meaningful funding-path activity is recorded within 3 days.',
        it: 'YES quando, dopo il touch no-deposito, viene tracciato almeno uno di questi eventi: pagina deposito aperta, verifica iniziata o completata, oppure metodo di pagamento selezionato. NO se entro 3 giorni non compare alcuna attività rilevante sul percorso di deposito.',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S2B',
    type: 'state',
    position: { x: x.recovery, y: y.lower },
    data: {
      label: { en: 'Funding-path recovery', it: 'Recupero percorso deposito' },
      templateId: 'unfunded_newcomers_deposit_intent_recovery_email',
      timingBadge: '+3d',
      subLabel: {
        en: 'Triggered 3 days after the no-deposit touch when the user still has not engaged with the deposit path. From here the path becomes explicit: deposit completed leads to the confirmation touch, softer intent stays warm, and no action goes to re-entry nurture.',
        it: 'Scatta 3 giorni dopo il touch no-deposito quando l utente non ha ancora interagito con il percorso di deposito. Da qui il percorso è esplicito: se il deposito arriva si passa alla conferma, se l interesse resta tiepido si rimane warm, se non succede nulla si entra nella riattivazione soft.',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Intent recovery sent', it: 'Recupero intento inviato' },
          value: { en: '—', it: '—' },
          metricKey: 'depositIntentRecoverySent',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S3',
    type: 'state',
    position: { x: x.depositPush, y: y.main },
    data: {
      label: { en: 'Deposit confirmed touch', it: 'Touch di conferma deposito' },
      templateId: 'unfunded_newcomers_first_deposit_push_email',
      timingBadge: 'DEPOSIT OK +0d',
      subLabel: {
        en: 'Triggered immediately after a successful Deposit OK event on the funding path. The next clear handoff from here is post-deposit activation support with the account manager.',
        it: 'Scatta subito dopo un evento Deposit OK sul funding path. Il passaggio successivo è chiaro: handoff al supporto di attivazione post-deposito con account manager.',
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
    position: { x: x.decision3, y: y.decision },
    data: {
      label: {
        en: 'After recovery or Deposit OK, what happens next?',
        it: 'Dopo recovery o Deposit OK, quale passo segue?',
      },
      subLabel: {
        en: 'YES when the first deposit is completed and the user moves straight into post-deposit onboarding. WARM when funding intent reappears but the deposit is still pending. NO when the user stays inactive and should be recycled into the softer re-entry path.',
        it: 'YES quando il primo deposito viene completato e l utente passa subito all onboarding post-deposito. WARM quando riappare l interesse sul funding ma il deposito resta in sospeso. NO quando l utente rimane inattivo e va riciclato nel percorso di riattivazione soft.',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'O1',
    type: 'outcome',
    position: { x: x.outcomes, y: y.topOutcome },
    data: {
      label: { en: 'FTD converted', it: 'FTD convertito' },
      subLabel: {
        en: 'Deposit completed successfully and ready for immediate activation support',
        it: 'Deposito completato con successo e pronto per il supporto di attivazione',
      },
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
    position: { x: x.outcomes, y: y.middleOutcome },
    data: {
      label: { en: 'Warm but not converted', it: 'Interessato ma non convertito' },
      subLabel: {
        en: 'Interest is visible again, but the funding step still needs completion',
        it: 'L interesse è tornato visibile, ma il funding deve ancora essere completato',
      },
      kind: 'neutral',
      kpis: [
        {
          label: { en: 'Deposit-path revisits', it: 'Riaperture percorso deposito' },
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
    position: { x: x.outcomes, y: y.bottomOutcome },
    data: {
      label: { en: 'Cold drop-off', it: 'Drop-off freddo' },
      subLabel: {
        en: 'No funding activity after recovery, so the user enters a softer recycle path',
        it: 'Nessuna attività funding dopo la recovery, quindi l utente entra in un percorso più soft',
      },
      kind: 'negative',
    },
    style: { width: outcomeW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'F1',
    type: 'state',
    position: { x: x.followUp, y: y.followUpTop },
    data: {
      label: { en: 'Post-deposit activation support', it: 'Supporto di attivazione post-deposito' },
      templateId: 'unfunded_newcomers_first_trade_onboarding_email',
      timingBadge: 'FTD +0d',
      subLabel: {
        en: 'FTD +0d: immediate handoff after the first successful deposit to help the user move from funding into the first trading decisions with dedicated guidance.',
        it: 'FTD +0d: handoff immediato dopo il primo deposito riuscito per accompagnare l utente dal funding alle prime decisioni operative con guida dedicata.',
      },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'F2',
    type: 'state',
    position: { x: x.followUp, y: y.followUpMiddle },
    data: {
      label: { en: 'Soft re-entry if still no FTD', it: 'Riattivazione soft se FTD assente' },
      templateId: 'unfunded_newcomers_reentry_nurture_email',
      timingBadge: 'D21',
      subLabel: {
        en: 'D21 from the last non-converted touch: re-enter with a softer, more relevant angle instead of repeating urgency.',
        it: 'D21 dall ultimo touch non convertito: nuovo ingresso con un angolo più morbido e più rilevante, senza ripetere urgenza.',
      },
      kind: 'primary',
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'I1',
    type: 'communication',
    position: { x: influences.x1, y: influences.top },
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
    position: { x: influences.x2, y: influences.top },
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
    position: { x: influences.x3, y: influences.top },
    data: {
      label: { en: 'Preferred payment routing', it: 'Routing pagamento preferito' },
      subLabel: {
        en: 'Reduce steps to deposit completion',
        it: 'Ridurre i passaggi fino al completamento del deposito',
      },
      kind: 'influence',
    },
    style: { width: influenceW + 40, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'I4',
    type: 'communication',
    position: { x: influences.x4, y: influences.top },
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
    data: {
      primary: { en: 'YES', it: 'SÌ' },
      secondary: { en: 'deposit + trade in 48h', it: 'deposito + trade in 48h' },
    },
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-D1-S1B-no',
    source: 'D1',
    target: 'S1B',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: { en: 'NO', it: 'NO' },
    data: {
      primary: { en: 'NO', it: 'NO' },
      secondary: { en: 'no deposit in 48h', it: 'nessun deposito in 48h' },
    },
    ...decisionLabel,
    style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
  },
  {
    ...baseEdge,
    id: 'e-S1B-D2',
    source: 'S1B',
    target: 'D2',
    sourceHandle: 'out',
    targetHandle: 'in',
    style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
  },
  {
    ...baseEdge,
    id: 'e-D2-S3-yes',
    source: 'D2',
    target: 'S3',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    label: { en: 'YES', it: 'SÌ' },
    data: {
      primary: { en: 'YES', it: 'SÌ' },
      secondary: { en: 'intent detected', it: 'intent rilevato' },
    },
    ...decisionLabel,
  },
  {
    ...baseEdge,
    id: 'e-D2-S2B-no',
    source: 'D2',
    target: 'S2B',
    sourceHandle: 'out-right',
    targetHandle: 'in',
    label: { en: 'NO', it: 'NO' },
    data: {
      primary: { en: 'NO', it: 'NO' },
      secondary: { en: 'no intent event', it: 'nessun evento di intent' },
    },
    ...decisionLabel,
    style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
  },
  {
    ...baseEdge,
    id: 'e-S2B-D3',
    source: 'S2B',
    target: 'D3',
    sourceHandle: 'out',
    targetHandle: 'in',
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
    data: {
      primary: { en: 'YES', it: 'SÌ' },
      secondary: { en: 'FTD completed', it: 'FTD completato' },
    },
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
    data: {
      primary: { en: 'WARM', it: 'CALDO' },
      secondary: { en: 'revisited funding', it: 'ha rivisitato il funding' },
    },
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
    data: {
      primary: { en: 'NO', it: 'NO' },
      secondary: { en: 'no funding event', it: 'nessun evento funding' },
    },
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
    en: 'Acquisition-to-FTD path for newly registered accounts with zero deposits and zero trades: welcome at D0, explicit +48h split between users with deposit+trade vs users with no deposit, then intent detection, recovery, first-deposit push, and terminal outcomes. KPIs: FTD conversion, time to first deposit, and first-trade activation.',
    it: 'Percorso acquisition-to-FTD per account appena registrati con zero depositi e zero trade: welcome a D0, split esplicito a +48h tra utenti con deposito+trade e utenti senza deposito, poi rilevazione intento, recovery, spinta al primo deposito e outcome finali. KPI: conversione FTD, tempo al primo deposito e attivazione al primo trade.',
  },
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
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
