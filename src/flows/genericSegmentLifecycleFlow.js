function asText(value) {
  return value == null ? '' : String(value)
}

function asList(value) {
  return Array.isArray(value) ? value.filter(Boolean).map((item) => String(item)) : []
}

function formatStatuses(segment) {
  const nativeStatuses = asList(segment?.statusBuckets?.soliticsStatuses)
  const derivedStatuses = asList(segment?.statusBuckets?.derivedStatuses)
  const all = [...nativeStatuses, ...derivedStatuses]
  if (!all.length) return 'All statuses'
  return all.join(', ')
}

export function buildGenericSegmentLifecycleFlow(segment) {
  const segmentKey = asText(segment?.key) || 'segment_generic'
  const segmentLabel = asText(segment?.label) || 'Segment'
  const segmentGoal = asText(segment?.goal) || 'Drive progression for this segment.'
  const segmentGroup = asText(segment?.group) || 'Retention'
  const rulesList = asList(segment?.rulesList)
  const rulesSummary = asText(segment?.rules) || 'Business rules not specified'
  const statusesSummary = formatStatuses(segment)

  const CANVAS_WIDTH = 1480
  const CANVAS_HEIGHT = 1420
  const axisX = 740
  const stateW = 300
  const decisionW = 136
  const outcomeW = 280

  const xCenter = (w) => Math.round(axisX - w / 2)

  const y = {
    entrance: 90,
    step1: 230,
    decision1: 380,
    step2: 530,
    decision2: 690,
    step3: 850,
    decision3: 1020,
    outcomes: 1200,
    followUp: 1340,
  }

  const baseNode = {
    draggable: false,
    selectable: true,
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

  const nodes = [
    {
      ...baseNode,
      id: 'E0',
      type: 'state',
      position: { x: xCenter(stateW), y: y.entrance },
      data: {
        label: { en: 'Segment identified', it: 'Segmento identificato' },
        subLabel: {
          en: `Entered ${segmentLabel} segment`,
          it: `Entrato nel segmento ${segmentLabel}`,
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'S1',
      type: 'state',
      position: { x: xCenter(stateW), y: y.step1 },
      data: {
        label: { en: 'Initial segment touch', it: 'Touch iniziale segmento' },
        timingBadge: 'D0',
        subLabel: {
          en: 'D0: first communication aligned with segment objective',
          it: 'D0: prima comunicazione allineata all obiettivo del segmento',
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'D1',
      type: 'decision',
      position: { x: xCenter(decisionW), y: y.decision1 },
      data: {
        label: { en: 'Early response detected?', it: 'Risposta iniziale rilevata?' },
        subLabel: {
          en: 'Observed within first 72 hours after entry touch',
          it: 'Osservata nelle prime 72 ore dal touch di ingresso',
        },
      },
      style: { width: decisionW, height: decisionW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'S2',
      type: 'state',
      position: { x: xCenter(stateW), y: y.step2 },
      data: {
        label: { en: 'Progress reinforcement', it: 'Rinforzo progressione' },
        timingBadge: 'D3',
        subLabel: {
          en: 'D3: tactical follow-up based on first behavior signal',
          it: 'D3: follow-up tattico in base al primo segnale comportamentale',
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'D2',
      type: 'decision',
      position: { x: xCenter(decisionW), y: y.decision2 },
      data: {
        label: { en: 'Goal progression confirmed?', it: 'Progressione verso goal confermata?' },
        subLabel: {
          en: 'Check alignment with segment objective and intent signals',
          it: 'Verifica allineamento con obiettivo segmento e segnali di intento',
        },
      },
      style: { width: decisionW, height: decisionW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'S3',
      type: 'state',
      position: { x: xCenter(stateW), y: y.step3 },
      data: {
        label: { en: 'Value and retention touch', it: 'Touch di valore e retention' },
        timingBadge: 'D10',
        subLabel: {
          en: 'D10: consolidate behavior with stronger value framing',
          it: 'D10: consolidare il comportamento con framing di valore più forte',
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'D3',
      type: 'decision',
      position: { x: xCenter(decisionW), y: y.decision3 },
      data: {
        label: { en: 'Retained in cycle?', it: 'Retained nel ciclo?' },
        subLabel: {
          en: 'Evaluate retention and activity at cycle checkpoint',
          it: 'Valuta retention e attività al checkpoint di ciclo',
        },
      },
      style: { width: decisionW, height: decisionW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'O1',
      type: 'outcome',
      position: { x: 340, y: y.outcomes },
      data: {
        label: { en: 'High-value retained', it: 'Alto valore trattenuto' },
        kind: 'positive',
      },
      style: { width: outcomeW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'O2',
      type: 'outcome',
      position: { x: 690, y: y.outcomes },
      data: {
        label: { en: 'Stable in segment', it: 'Stabile nel segmento' },
        kind: 'neutral',
      },
      style: { width: outcomeW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'O3',
      type: 'outcome',
      position: { x: 1040, y: y.outcomes },
      data: {
        label: { en: 'Needs recovery path', it: 'Richiede percorso recovery' },
        kind: 'negative',
      },
      style: { width: outcomeW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'F1',
      type: 'state',
      position: { x: 340, y: y.followUp },
      data: {
        label: { en: 'Upsell / progression follow-up', it: 'Follow-up upsell / progressione' },
        timingBadge: 'Cycle +0d',
        subLabel: {
          en: 'Immediate follow-up for promoted and retained profiles',
          it: 'Follow-up immediato per profili promossi e trattenuti',
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'F2',
      type: 'state',
      position: { x: 690, y: y.followUp },
      data: {
        label: { en: 'Recovery loop', it: 'Loop di recovery' },
        timingBadge: 'D21',
        subLabel: {
          en: 'Re-entry nurture when conversion or retention target is missed',
          it: 'Nurture di rientro quando target di conversione o retention non centrato',
        },
        kind: 'primary',
      },
      style: { width: stateW, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'I1',
      type: 'communication',
      position: { x: 48, y: 470 },
      data: {
        label: { en: 'Rules context', it: 'Contesto regole' },
        subLabel: { en: rulesSummary, it: rulesSummary },
        kind: 'influence',
      },
      style: { width: 250, zIndex: 10 },
    },
    {
      ...baseNode,
      id: 'I2',
      type: 'communication',
      position: { x: 1085, y: 470 },
      data: {
        label: { en: 'Status coverage', it: 'Copertura status' },
        subLabel: { en: statusesSummary, it: statusesSummary },
        kind: 'influence',
      },
      style: { width: 250, zIndex: 10 },
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
      id: 'e-D1-S2',
      source: 'D1',
      target: 'S2',
      sourceHandle: 'out-left',
      targetHandle: 'in',
      label: { en: 'YES', it: 'SI' },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D1-D2',
      source: 'D1',
      target: 'D2',
      sourceHandle: 'out-right',
      targetHandle: 'in',
      label: { en: 'NO', it: 'NO' },
      ...decisionLabel,
      style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
    },
    {
      ...baseEdge,
      id: 'e-S2-D2',
      source: 'S2',
      target: 'D2',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      ...baseEdge,
      id: 'e-D2-S3',
      source: 'D2',
      target: 'S3',
      sourceHandle: 'out-left',
      targetHandle: 'in',
      label: { en: 'ON TRACK', it: 'IN LINEA' },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D2-D3',
      source: 'D2',
      target: 'D3',
      sourceHandle: 'out-right',
      targetHandle: 'in',
      label: { en: 'RECOVERY', it: 'RECOVERY' },
      ...decisionLabel,
      style: { stroke: 'rgba(148,163,184,0.45)', strokeWidth: 1.4 },
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
      label: { en: 'STRONG', it: 'FORTE' },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D3-O2',
      source: 'D3',
      target: 'O2',
      sourceHandle: 'out-center',
      targetHandle: 'in',
      label: { en: 'STABLE', it: 'STABILE' },
      ...decisionLabel,
    },
    {
      ...baseEdge,
      id: 'e-D3-O3',
      source: 'D3',
      target: 'O3',
      sourceHandle: 'out-right',
      targetHandle: 'in',
      label: { en: 'DROP', it: 'CALO' },
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
      style: { stroke: 'rgba(100, 116, 139, 0.45)', strokeWidth: 1.4, strokeDasharray: '4,4' },
    },
    {
      ...baseEdge,
      id: 'e-I2-S2',
      source: 'I2',
      target: 'S2',
      sourceHandle: 'out',
      targetHandle: 'in-right',
      style: { stroke: 'rgba(100, 116, 139, 0.45)', strokeWidth: 1.4, strokeDasharray: '4,4' },
    },
  ]

  const kpiSeed = rulesList.slice(0, 3)
  const kpis = kpiSeed.length
    ? kpiSeed.map((rule) => ({ en: rule, it: rule }))
    : [
        { en: 'Response rate', it: 'Response rate' },
        { en: 'Progression rate', it: 'Progression rate' },
        { en: 'Retention checkpoint', it: 'Retention checkpoint' },
      ]

  const meta = {
    id: `${segmentKey}Journey`,
    title: {
      en: `${segmentLabel} Journey`,
      it: `Journey ${segmentLabel}`,
    },
    description: {
      en: `${segmentGroup} lifecycle for ${segmentLabel}. Goal: ${segmentGoal}`,
      it: `Lifecycle ${segmentGroup} per ${segmentLabel}. Obiettivo: ${segmentGoal}`,
    },
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    segment: segmentKey,
    goal: {
      en: segmentGoal,
      it: segmentGoal,
    },
    kpis,
  }

  return { nodes, edges, meta }
}
