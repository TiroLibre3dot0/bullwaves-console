import React, { useEffect, useMemo, useState } from 'react'
import FlowDiagram from '../../features/flows/FlowDiagram'
import { useI18n } from '../../i18n/I18nContext'
import SegmentContentPreviewModal from './SegmentContentPreviewModal'
import { segmentJourneyTemplatesById } from './segmentJourneyTemplates'

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

  const localizedEdges = useMemo(
    () => localizeFlowValue(safeFlowData?.edges || []),
    [safeFlowData?.edges, locale]
  )

  const flowDescription = pickText(safeFlowData?.meta?.description)
  const flowGoal = pickText(safeFlowData?.meta?.goal)
  const segmentLabel = pickText(safeSegment?.label)
  const flowTitle = pickText(safeFlowData?.meta?.title) || segmentLabel
  const selectedTemplate = selectedTemplateId
    ? segmentJourneyTemplatesById?.[selectedTemplateId]
    : null

  const journeyNodes = useMemo(
    () =>
      [...localizedNodes]
        .filter(Boolean)
        .sort(
          (left, right) =>
            (left?.position?.y ?? 0) - (right?.position?.y ?? 0) ||
            (left?.position?.x ?? 0) - (right?.position?.x ?? 0)
        ),
    [localizedNodes]
  )

  const actionableNodes = useMemo(
    () =>
      journeyNodes.filter((node) =>
        ['state', 'decision', 'outcome', 'communication'].includes(String(node?.type || ''))
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
      incoming: localizedEdges.filter((edge) => edge?.target === selectedNodeId),
      outgoing: localizedEdges.filter((edge) => edge?.source === selectedNodeId),
    }
  }, [localizedEdges, selectedNodeId])

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
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
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

        {flowDescription && (
          <div className="segment-journey-modal__description">
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {flowDescription}
            </p>
          </div>
        )}

        <div className="segment-journey-modal__workspace">
          <aside className="segment-journey-modal__sidebar">
            <section className="segment-journey-modal__panel">
              <div className="segment-journey-modal__eyebrow">Solitics format</div>
              <h3 className="segment-journey-modal__panel-title">Journey blueprint</h3>
              <p className="segment-journey-modal__panel-copy">
                Ogni nodo mostra il corrispettivo operativo da replicare in Solitics: touch,
                condizione, outcome e timing.
              </p>
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
                <div className="segment-journey-modal__legend-item segment-journey-modal__legend-item--note">
                  <span />
                  <strong>Context</strong>
                </div>
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
                    <span className="segment-journey-modal__detail-label">Journey</span>
                    <strong className="segment-journey-modal__detail-value">{flowTitle}</strong>
                  </div>
                  <div>
                    <span className="segment-journey-modal__detail-label">Segment</span>
                    <strong className="segment-journey-modal__detail-value">{segmentLabel}</strong>
                  </div>
                  <div>
                    <span className="segment-journey-modal__detail-label">Template</span>
                    <strong className="segment-journey-modal__detail-value">
                      {selectedNode?.data?.templateId || 'No template linked'}
                    </strong>
                  </div>
                </div>

                {selectedNode?.data?.templateId ? (
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
                nodes={localizedNodes}
                edges={localizedEdges}
                theme="solitics"
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
