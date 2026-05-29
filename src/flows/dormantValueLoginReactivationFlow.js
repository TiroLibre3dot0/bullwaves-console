const CANVAS_WIDTH = 1460
const CANVAS_HEIGHT = 440

const stateW = 280
const decisionW = 130

const nodeDefaults = {
  draggable: false,
  selectable: true,
}

const x = {
  target: 120,
  loginEvent: 540,
  welcomeBack: 920,
}

const y = {
  center: 170,
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

const nodes = [
  {
    ...nodeDefaults,
    id: 'E0',
    type: 'state',
    position: { x: x.target, y: y.center },
    data: {
      label: {
        en: 'Target Group',
        it: 'Target Group',
      },
      subLabel: {
        en: 'Dormant Value users with no login for more than 30 days',
        it: 'Utenti Dormant Value senza login da oltre 30 giorni',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Segment entry', it: 'Ingresso segmento' },
          value: { en: '30+ days inactive', it: '30+ giorni inattivi' },
          metricKey: 'dormantEntry',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'D1',
    type: 'decision',
    position: { x: x.loginEvent, y: y.center },
    data: {
      label: {
        en: 'LOGIN',
        it: 'LOGIN',
      },
      subLabel: {
        en: 'Trigger fires when login is detected after dormancy window',
        it: 'Trigger attivo quando viene rilevato il login dopo la dormancy',
      },
      kind: 'primary',
    },
    style: { width: decisionW, height: decisionW, zIndex: 10 },
  },
  {
    ...nodeDefaults,
    id: 'S1',
    type: 'state',
    position: { x: x.welcomeBack, y: y.center },
    data: {
      label: {
        en: 'Login',
        it: 'Login',
      },
      templateId: 'dormant_value_login_welcome_back_email',
      timingBadge: 'LOGIN +0m',
      subLabel: {
        en: 'Immediately after login, send a welcome-back email and route to account reactivation path',
        it: 'Subito dopo il login invia una mail bentornato e avvia il percorso di riattivazione account',
      },
      kind: 'primary',
      kpis: [
        {
          label: { en: 'Welcome-back sent', it: 'Bentornato inviato' },
          value: { en: 'Event based', it: 'Event based' },
          metricKey: 'welcomeBackSent',
        },
      ],
    },
    style: { width: stateW, zIndex: 10 },
  },
]

const edges = [
  {
    id: 'e-E0-D1',
    source: 'E0',
    target: 'D1',
    sourceHandle: 'out',
    targetHandle: 'in',
    animated: false,
    type: 'default',
  },
  {
    id: 'e-D1-S1',
    source: 'D1',
    target: 'S1',
    sourceHandle: 'out-left',
    targetHandle: 'in',
    animated: false,
    type: 'default',
    label: { en: 'YES', it: 'SI' },
    data: {
      primary: { en: 'YES', it: 'SI' },
      secondary: { en: 'login detected', it: 'login rilevato' },
    },
    ...decisionLabel,
  },
]

export const meta = {
  id: 'dormantValueLoginReactivation',
  title: {
    en: 'Dormant Value - Login Reactivation Journey',
    it: 'Dormant Value - Journey Riattivazione Login',
  },
  description: {
    en: 'Simple event journey: users inactive for more than 30 days enter the target group, then a login event triggers an immediate welcome-back email.',
    it: 'Journey evento semplice: utenti inattivi da oltre 30 giorni entrano nel target group, poi un evento login attiva subito la mail bentornato.',
  },
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  segment: 'dormant_value',
  goal: {
    en: 'Reconnect dormant users at the first login touchpoint',
    it: 'Riconnettere utenti dormant al primo login utile',
  },
  kpis: [
    { en: 'Login reactivation rate', it: 'Tasso login di riattivazione' },
    { en: 'Welcome-back open rate', it: 'Open rate mail bentornato' },
    { en: '7-day post-login activity', it: 'Attivita post-login a 7 giorni' },
  ],
}

export { nodes, edges }
