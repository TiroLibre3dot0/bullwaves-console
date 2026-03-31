import React, { useMemo } from 'react'
import FlowDiagram from '../flows/FlowDiagram'
import { fmtInt } from '../lib/formatters'

/**
 * SegmentJourneyModal - Visualizza il journey/flow di un segmento specifico
 * con React Flow diagram
 */
export default function SegmentJourneyModal({
  isOpen,
  onClose,
  segment,
  flowData,
}) {
  if (!isOpen || !segment || !flowData) return null

  const pickText = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const v = value?.en ?? value?.it
      return v == null ? '' : String(v)
    }
    return value == null ? '' : String(value)
  }

  const flowTitle = pickText(flowData?.meta?.title)
  const flowDescription = pickText(flowData?.meta?.description)
  const flowGoal = pickText(flowData?.meta?.goal)
  const segmentLabel = pickText(segment?.label)

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
              {pickText(segment?.group)}
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
            nodes={flowData?.nodes || []}
            edges={flowData?.edges || []}
            onOpenTemplate={() => {}}
          />
        </div>
      </div>
    </div>
  )
}
