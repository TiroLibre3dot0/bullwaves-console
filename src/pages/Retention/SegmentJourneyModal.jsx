import React, { useMemo, useState } from 'react'
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
  const selectedTemplate = selectedTemplateId
    ? segmentJourneyTemplatesById?.[selectedTemplateId]
    : null

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
              {segmentLabel} — Journey
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

        <div className="segment-journey-modal__diagram-wrap">
          <FlowDiagram
            nodes={localizedNodes}
            edges={localizedEdges}
            onOpenTemplate={(templateId) => openTemplate(templateId)}
          />
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
