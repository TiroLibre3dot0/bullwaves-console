import React, { useEffect, useMemo, useState } from 'react'
import FlowDiagram from '../../features/flows/FlowDiagram'
import { useI18n } from '../../i18n/I18nContext'
import SegmentContentPreviewModal from './SegmentContentPreviewModal'
import { segmentJourneyTemplatesById } from './segmentJourneyTemplates'

function orientNodesHorizontal(nodes) {
  if (!Array.isArray(nodes) || !nodes.length) return []

  const uniqueX = [...new Set(nodes.map((node) => Number(node?.position?.x || 0)))].sort(
    (a, b) => a - b
  )
  const uniqueY = [...new Set(nodes.map((node) => Number(node?.position?.y || 0)))].sort(
    (a, b) => a - b
  )

  const rowCount = Math.max(1, uniqueX.length)
  const columnCount = Math.max(1, uniqueY.length)
  const laneSpacing = Math.max(92, Math.min(152, 740 / Math.max(1, rowCount - 1)))
  const columnSpacing = Math.max(176, Math.min(276, 1660 / Math.max(1, columnCount - 1)))
  const laneCenter = 292

  return nodes.map((node) => {
    const x = Number(node?.position?.x || 0)
    const y = Number(node?.position?.y || 0)
    const rowIndex = Math.max(0, uniqueX.indexOf(x))
    const colIndex = Math.max(0, uniqueY.indexOf(y))
    const laneIndex = rowIndex - (rowCount - 1) / 2

    return {
      ...node,
      position: {
        x: Math.round(112 + colIndex * columnSpacing),
        y: Math.round(laneCenter + laneIndex * laneSpacing),
      },
      data: {
        ...(node?.data || {}),
        flowDirection: 'horizontal',
      },
    }
  })
}

/**
 * SegmentJourneyModal - Visualizza il journey/flow di un segmento specifico
 * con React Flow diagram
 */
export default function SegmentJourneyModal({ isOpen, onClose, segment, flowData }) {
  const { locale } = useI18n()
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const safeFlowData = flowData || null
  const safeSegment = segment || null

  const pickText = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const v = value?.[locale] ?? value?.en ?? value?.it
      return v == null ? '' : String(v)
    }
    return value == null ? '' : String(value)
  }

  const localizeFlowValue = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => localizeFlowValue(item))
    }

    if (value && typeof value === 'object') {
      const keys = Object.keys(value)
      const looksLocalizedText =
        (Object.prototype.hasOwnProperty.call(value, 'en') ||
          Object.prototype.hasOwnProperty.call(value, 'it')) &&
        keys.every((key) => ['en', 'it', 'sr', 'hr'].includes(key))

      if (looksLocalizedText) return pickText(value)

      return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [key, localizeFlowValue(nestedValue)])
      )
    }

    return value
  }

  const localizedNodes = useMemo(
    () => localizeFlowValue(safeFlowData?.nodes || []),
    [safeFlowData?.nodes, locale]
  )

  const horizontalNodes = useMemo(() => orientNodesHorizontal(localizedNodes), [localizedNodes])

  const localizedEdges = useMemo(
    () => localizeFlowValue(safeFlowData?.edges || []),
    [safeFlowData?.edges, locale]
  )

  const visibleNodes = useMemo(
    () => horizontalNodes.filter((node) => String(node?.type || '') !== 'communication'),
    [horizontalNodes]
  )

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => String(node?.id || ''))),
    [visibleNodes]
  )

  const visibleEdges = useMemo(
    () =>
      localizedEdges.filter(
        (edge) =>
          visibleNodeIds.has(String(edge?.source || '')) &&
          visibleNodeIds.has(String(edge?.target || ''))
      ),
    [localizedEdges, visibleNodeIds]
  )

  const flowRenderKey = useMemo(() => {
    const nodeSignature = (visibleNodes || [])
      .map((node) => `${node?.id || ''}:${node?.position?.x ?? 0}:${node?.position?.y ?? 0}`)
      .join('|')
    return `${safeFlowData?.meta?.id || 'flow'}::${nodeSignature}`
  }, [visibleNodes, safeFlowData?.meta?.id])

  const flowGoal = pickText(safeFlowData?.meta?.goal)
  const segmentLabel = pickText(safeSegment?.label)
  const selectedTemplate = selectedTemplateId
    ? segmentJourneyTemplatesById?.[selectedTemplateId]
    : null

  const journeyNodes = useMemo(
    () =>
      [...visibleNodes]
        .filter(Boolean)
        .sort(
          (left, right) =>
            (left?.position?.x ?? 0) - (right?.position?.x ?? 0) ||
            (left?.position?.y ?? 0) - (right?.position?.y ?? 0)
        ),
    [visibleNodes]
  )

  const actionableNodes = useMemo(
    () =>
      journeyNodes.filter((node) =>
        ['state', 'decision', 'outcome'].includes(String(node?.type || ''))
      ),
    [journeyNodes]
  )

  const stepNodes = useMemo(
    () => actionableNodes.filter((node) => ['state', 'decision', 'outcome'].includes(node.type)),
    [actionableNodes]
  )

  const defaultSelectedNodeId =
    stepNodes.find((node) => node?.data?.templateId)?.id ||
    stepNodes[0]?.id ||
    actionableNodes[0]?.id ||
    null

  useEffect(() => {
    if (!isOpen) return
    setSelectedNodeId(defaultSelectedNodeId)
  }, [defaultSelectedNodeId, isOpen, safeFlowData?.meta?.id])

  const selectedNode = useMemo(
    () => actionableNodes.find((node) => node?.id === selectedNodeId) || null,
    [actionableNodes, selectedNodeId]
  )

  const linkedTemplatePreview = useMemo(() => {
    const templateId = String(selectedNode?.data?.templateId || '').trim()
    if (!templateId) return null

    const template = segmentJourneyTemplatesById?.[templateId]
    if (!template) return null

    const localePack = template?.locales?.[locale] || template?.locales?.en || template?.locales?.it
    const variant = localePack?.variants?.a || localePack?.variants?.b || null
    const html = variant?.html || {}

    return {
      subject: pickText(variant?.subject),
      description: pickText(variant?.description),
      title: pickText(html?.heroTitle || html?.title || html?.mainTitle),
      body: pickText(html?.bodyOne || html?.introLead || html?.bodyThree),
    }
  }, [selectedNode, locale])

  const countByType = useMemo(
    () => ({
      steps: journeyNodes.filter((node) => node?.type === 'state').length,
      decisions: journeyNodes.filter((node) => node?.type === 'decision').length,
      outcomes: journeyNodes.filter((node) => node?.type === 'outcome').length,
    }),
    [journeyNodes]
  )

  const nodeConnections = useMemo(() => {
    if (!selectedNodeId) return { incoming: [], outgoing: [] }

    return {
      incoming: visibleEdges.filter((edge) => edge?.target === selectedNodeId),
      outgoing: visibleEdges.filter((edge) => edge?.source === selectedNodeId),
    }
  }, [visibleEdges, selectedNodeId])

  const getNodeLabel = (node) => {
    if (!node) return ''
    return pickText(node?.data?.label || node?.id)
  }

  const getNodeSubLabel = (node) => pickText(node?.data?.subLabel)

  const getNodeTypeLabel = (node) => {
    switch (node?.type) {
      case 'state':
        return node?.data?.templateId ? 'Communication step' : 'Journey step'
      case 'decision':
        return 'Decision split'
      case 'outcome':
        return 'Outcome bucket'
      case 'communication':
        return 'Influence / note'
      default:
        return 'Journey node'
    }
  }

  const getNodeSoliticsAction = (node) => {
    if (!node) return ''
    if (node?.data?.templateId) return 'Send communication'
    if (node?.type === 'decision') return 'Wait for event and branch'
    if (node?.type === 'outcome') return 'Mark result and handoff'
    if (node?.type === 'communication') return 'Supporting rule or context'
    return 'Journey logic'
  }

  const getNodeTiming = (node) => {
    if (!node) return ''
    if (node?.data?.timingBadge) return String(node.data.timingBadge)
    if (node?.id === 'E0') return 'Segment entry'
    if (node?.type === 'decision') return 'Behavior-based check'
    return 'Immediate'
  }

  const getEdgeLabel = (edge) => {
    if (!edge) return ''
    if (edge?.data?.primary) return pickText(edge.data.primary)
    return pickText(edge?.label)
  }

  const classifyBranch = (edgeLabel) => {
    const normalized = String(edgeLabel || '')
      .trim()
      .toUpperCase()

    if (!normalized) return 'other'
    if (['YES', 'SI', 'SÌ', 'ON TRACK', 'STRONG', 'STABLE', 'WARM'].includes(normalized)) {
      return 'yes'
    }
    if (['NO', 'DROP', 'CALO', 'RECOVERY'].includes(normalized)) return 'no'
    return 'other'
  }

  const buildConnectionSummary = (edge, direction) => {
    const counterpartId = direction === 'incoming' ? edge?.source : edge?.target
    const counterpart = actionableNodes.find((node) => node?.id === counterpartId)
    return {
      id: edge?.id || `${direction}-${counterpartId}`,
      title: getNodeLabel(counterpart) || counterpartId,
      caption: getEdgeLabel(edge) || (direction === 'incoming' ? 'Previous step' : 'Next step'),
    }
  }

  const incomingSummary = nodeConnections.incoming.map((edge) =>
    buildConnectionSummary(edge, 'incoming')
  )
  const outgoingSummary = nodeConnections.outgoing.map((edge) =>
    buildConnectionSummary(edge, 'outgoing')
  )

  const timelineSummary = useMemo(() => {
    const lifecycleSteps = journeyNodes
      .filter(
        (node) =>
          node?.type === 'state' && /_step\d+_email$/i.test(String(node?.data?.templateId || ''))
      )
      .sort((left, right) => (left?.position?.x ?? 0) - (right?.position?.x ?? 0))

    const initialStep = lifecycleSteps[0] || null

    return {
      initialStep,
      lifecycleSteps,
    }
  }, [journeyNodes])

  const branchPlaybook = useMemo(() => {
    const decisions = journeyNodes
      .filter((node) => node?.type === 'decision')
      .sort((left, right) => (left?.position?.x ?? 0) - (right?.position?.x ?? 0))

    return decisions.map((decision) => {
      const outgoing = visibleEdges.filter((edge) => edge?.source === decision?.id)

      const grouped = { yes: [], no: [], other: [] }

      outgoing.forEach((edge) => {
        const target = actionableNodes.find((node) => node?.id === edge?.target) || null
        const branchLabel = getEdgeLabel(edge)
        const bucket = classifyBranch(branchLabel)

        grouped[bucket].push({
          id: edge?.id || `${decision?.id}-${edge?.target}`,
          edgeLabel: branchLabel || 'Route',
          title: getNodeLabel(target) || String(edge?.target || ''),
          timing: getNodeTiming(target),
          content: getNodeSubLabel(target),
          templateId: String(target?.data?.templateId || ''),
        })
      })

      return {
        id: String(decision?.id || ''),
        title: getNodeLabel(decision),
        window: getNodeSubLabel(decision),
        yes: grouped.yes,
        no: grouped.no,
        other: grouped.other,
      }
    })
  }, [journeyNodes, visibleEdges, actionableNodes])

  const openTemplate = (templateId) => {
    const id = String(templateId || '').trim()
    if (!id) return
    if (!segmentJourneyTemplatesById?.[id]) return
    setSelectedTemplateId(id)
  }

  const closeTemplate = () => {
    setSelectedTemplateId(null)
  }

  if (!isOpen || !safeSegment || !safeFlowData) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        className="modal-card segment-journey-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="segment-journey-modal-title"
      >
        <div className="modal-header segment-journey-modal__header">
          <div>
            <p className="page-label" style={{ marginBottom: 4 }}>
              {pickText(safeSegment?.group)}
            </p>
            <h2 id="segment-journey-modal-title" style={{ margin: 0, fontSize: 20 }}>
              {segmentLabel} — Solitics View
            </h2>
            {flowGoal && (
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
                {flowGoal}
              </p>
            )}
          </div>

          <button
            type="button"
            className="pill-tab"
            onClick={onClose}
            aria-label="Close journey modal"
          >
            Close
          </button>
        </div>

        <div className="segment-journey-modal__workspace">
          <aside className="segment-journey-modal__sidebar">
            <section className="segment-journey-modal__panel">
              <div className="segment-journey-modal__eyebrow">Solitics format</div>
              <h3 className="segment-journey-modal__panel-title">Journey map</h3>
              <div className="segment-journey-modal__legend">
                <div className="segment-journey-modal__legend-item segment-journey-modal__legend-item--step">
                  <span />
                  <strong>Touch</strong>
                </div>
                <div className="segment-journey-modal__legend-item segment-journey-modal__legend-item--decision">
                  <span />
                  <strong>Condition</strong>
                </div>
                <div className="segment-journey-modal__legend-item segment-journey-modal__legend-item--outcome">
                  <span />
                  <strong>Outcome</strong>
                </div>
              </div>
            </section>

            <section className="segment-journey-modal__panel">
              <div className="segment-journey-modal__eyebrow">Operational brief</div>
              <h3 className="segment-journey-modal__panel-title">Release, timing, YES/NO</h3>

              {timelineSummary.initialStep ? (
                <div className="segment-journey-modal__route-card" style={{ marginBottom: 10 }}>
                  <strong>Initial release: {getNodeLabel(timelineSummary.initialStep)}</strong>
                  <small>
                    Expected at {getNodeTiming(timelineSummary.initialStep)}.{' '}
                    {getNodeSubLabel(timelineSummary.initialStep)}
                  </small>
                </div>
              ) : null}

              <div className="segment-journey-modal__route-list" style={{ marginBottom: 12 }}>
                {timelineSummary.lifecycleSteps.map((step) => (
                  <div key={step.id} className="segment-journey-modal__route-card">
                    <strong>{getNodeLabel(step)}</strong>
                    <small>
                      {getNodeTiming(step)} · {getNodeSubLabel(step)}
                    </small>
                  </div>
                ))}
              </div>

              <div className="segment-journey-modal__route-list">
                {branchPlaybook.map((item) => (
                  <div key={item.id} className="segment-journey-modal__route-card">
                    <strong>{item.title}</strong>
                    <small>{item.window || 'Behavior checkpoint'}</small>

                    {item.yes.map((route) => (
                      <small key={`${route.id}-yes`}>
                        YES action: {route.title} ({route.timing})
                        {route.content ? ` · ${route.content}` : ''}
                      </small>
                    ))}

                    {item.no.map((route) => (
                      <small key={`${route.id}-no`}>
                        NO action: {route.title} ({route.timing})
                        {route.content ? ` · ${route.content}` : ''}
                      </small>
                    ))}

                    {item.other.map((route) => (
                      <small key={`${route.id}-other`}>
                        {route.edgeLabel}: {route.title} ({route.timing})
                        {route.content ? ` · ${route.content}` : ''}
                      </small>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <section className="segment-journey-modal__panel">
              <div className="segment-journey-modal__eyebrow">Step navigator</div>
              <div className="segment-journey-modal__step-list">
                {stepNodes.map((node, index) => (
                  <button
                    key={node.id}
                    type="button"
                    className={`segment-journey-modal__step-button${
                      node.id === selectedNodeId ? ' is-active' : ''
                    }`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <span className="segment-journey-modal__step-index">{index + 1}</span>
                    <span className="segment-journey-modal__step-copy">
                      <strong>{getNodeLabel(node)}</strong>
                      <small>{getNodeTypeLabel(node)}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {selectedNode ? (
              <section className="segment-journey-modal__panel segment-journey-modal__panel--active">
                <div className="segment-journey-modal__eyebrow">Selected node</div>
                <h3 className="segment-journey-modal__panel-title">{getNodeLabel(selectedNode)}</h3>
                <div className="segment-journey-modal__tag-row">
                  <span className="segment-journey-modal__tag">
                    {getNodeTypeLabel(selectedNode)}
                  </span>
                  <span className="segment-journey-modal__tag">{getNodeTiming(selectedNode)}</span>
                </div>
                {getNodeSubLabel(selectedNode) ? (
                  <p className="segment-journey-modal__panel-copy">
                    {getNodeSubLabel(selectedNode)}
                  </p>
                ) : null}

                <div className="segment-journey-modal__details-grid">
                  <div>
                    <span className="segment-journey-modal__detail-label">Solitics action</span>
                    <strong className="segment-journey-modal__detail-value">
                      {getNodeSoliticsAction(selectedNode)}
                    </strong>
                  </div>
                  <div>
                    <span className="segment-journey-modal__detail-label">Node</span>
                    <strong className="segment-journey-modal__detail-value">
                      {getNodeLabel(selectedNode)}
                    </strong>
                  </div>
                  <div>
                    <span className="segment-journey-modal__detail-label">Template</span>
                    <strong className="segment-journey-modal__detail-value">
                      {selectedNode?.data?.templateId || 'No template linked'}
                    </strong>
                  </div>
                </div>

                {linkedTemplatePreview ? (
                  <div
                    className="segment-journey-modal__route-card"
                    style={{ marginTop: 12, marginBottom: 12 }}
                  >
                    <strong>{linkedTemplatePreview.subject || 'Template preview'}</strong>
                    {linkedTemplatePreview.title ? (
                      <small>{linkedTemplatePreview.title}</small>
                    ) : null}
                    {linkedTemplatePreview.body ? (
                      <small>{linkedTemplatePreview.body}</small>
                    ) : null}
                  </div>
                ) : null}

                {selectedNode?.data?.templateId && linkedTemplatePreview ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => openTemplate(selectedNode.data.templateId)}
                  >
                    Open linked template
                  </button>
                ) : null}

                <div className="segment-journey-modal__routes">
                  <div>
                    <span className="segment-journey-modal__detail-label">Incoming</span>
                    <div className="segment-journey-modal__route-list">
                      {incomingSummary.length ? (
                        incomingSummary.map((item) => (
                          <div key={item.id} className="segment-journey-modal__route-card">
                            <strong>{item.title}</strong>
                            <small>{item.caption}</small>
                          </div>
                        ))
                      ) : (
                        <div className="segment-journey-modal__route-card is-empty">
                          <strong>Start point</strong>
                          <small>Nessun nodo precedente</small>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="segment-journey-modal__detail-label">Outgoing</span>
                    <div className="segment-journey-modal__route-list">
                      {outgoingSummary.length ? (
                        outgoingSummary.map((item) => (
                          <div key={item.id} className="segment-journey-modal__route-card">
                            <strong>{item.title}</strong>
                            <small>{item.caption}</small>
                          </div>
                        ))
                      ) : (
                        <div className="segment-journey-modal__route-card is-empty">
                          <strong>Final node</strong>
                          <small>Nessun passaggio successivo</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </aside>

          <div className="segment-journey-modal__canvas-panel">
            <div className="segment-journey-modal__canvas-toolbar">
              <div>
                <div className="segment-journey-modal__eyebrow">Console to Solitics</div>
                <h3 className="segment-journey-modal__panel-title">
                  Operational map for collaborators
                </h3>
              </div>
              <div className="segment-journey-modal__toolbar-stats">
                <span className="segment-journey-modal__stat-pill">{countByType.steps} touch</span>
                <span className="segment-journey-modal__stat-pill">
                  {countByType.decisions} split
                </span>
                <span className="segment-journey-modal__stat-pill">
                  {countByType.outcomes} outcome
                </span>
              </div>
            </div>

            <div className="segment-journey-modal__diagram-wrap">
              <FlowDiagram
                key={flowRenderKey}
                nodes={visibleNodes}
                edges={visibleEdges}
                theme="solitics"
                layoutMode="source"
                height="100%"
                selectedNodeId={selectedNodeId}
                onSelectNode={(node) => setSelectedNodeId(node?.id || null)}
                onOpenTemplate={(templateId, node) => {
                  if (node?.id) setSelectedNodeId(node.id)
                  openTemplate(templateId)
                }}
              />
            </div>
          </div>
        </div>

        <SegmentContentPreviewModal
          isOpen={Boolean(selectedTemplate)}
          onClose={closeTemplate}
          template={selectedTemplate}
        />
      </div>
    </div>
  )
}
