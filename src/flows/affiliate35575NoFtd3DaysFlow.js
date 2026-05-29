const CANVAS_WIDTH = 1880
const CANVAS_HEIGHT = 620

const nodes = [
  {
    id: 'E0',
    type: 'state',
    draggable: false,
    selectable: true,
    position: { x: 80, y: 220 },
    data: {
      label: {
        en: 'Segment entry detected',
        it: 'Ingresso segmento rilevato',
      },
      subLabel: {
        en: 'Affiliate 35575, registered exactly 3 days ago, still no FTD',
        it: 'Affiliate 35575, registrato esattamente 3 giorni fa, ancora senza FTD',
      },
      kind: 'primary',
    },
    style: { width: 320, zIndex: 10 },
  },
  {
    id: 'S1',
    type: 'state',
    draggable: false,
    selectable: true,
    position: { x: 560, y: 220 },
    data: {
      label: {
        en: 'Send bonus-rules email',
        it: 'Invia email regole bonus',
      },
      templateId: 'affiliate_35575_reg_3d_no_ftd_step1_email',
      timingBadge: 'D+3',
      subLabel: {
        en: 'Single communication with bonus terms, withdrawal constraints and support contacts',
        it: 'Comunicazione singola con termini bonus, vincoli di prelievo e contatti supporto',
      },
      kind: 'primary',
    },
    style: { width: 340, zIndex: 10 },
  },
  {
    id: 'O1',
    type: 'outcome',
    draggable: false,
    selectable: true,
    position: { x: 1080, y: 220 },
    data: {
      label: {
        en: 'Email delivered',
        it: 'Email consegnata',
      },
      kind: 'positive',
    },
    style: { width: 300, zIndex: 10 },
  },
]

const edges = [
  {
    id: 'e-E0-S1',
    source: 'E0',
    target: 'S1',
    sourceHandle: 'out',
    targetHandle: 'in',
    type: 'smoothstep',
    animated: false,
  },
  {
    id: 'e-S1-O1',
    source: 'S1',
    target: 'O1',
    sourceHandle: 'out',
    targetHandle: 'in',
    type: 'smoothstep',
    animated: false,
  },
]

const meta = {
  id: 'affiliate_35575_no_ftd_3d_flow',
  name: {
    en: 'Affiliate 35575 - 3D No FTD Journey',
    it: 'Affiliate 35575 - Journey no FTD a 3 giorni',
  },
  goal: {
    en: 'Notify bonus terms to users from affiliate 35575 who registered exactly 3 days ago and still have no FTD.',
    it: 'Notificare i termini bonus agli utenti dell affiliate 35575 registrati esattamente 3 giorni fa e ancora senza FTD.',
  },
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
}

export { nodes, edges, meta }
