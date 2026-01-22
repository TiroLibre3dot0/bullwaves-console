import React from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '../reactflowCompat'

export default function BadgeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
  })

  // Place the badge closer to the source node for board readability.
  // t=0 => at source, t=1 => at target.
  const t = typeof data?.t === 'number' ? Math.max(0, Math.min(1, data.t)) : 0.32
  const badgeX = sourceX + (targetX - sourceX) * t
  const badgeY = sourceY + (targetY - sourceY) * t
  const offsetY = typeof data?.offsetY === 'number' ? data.offsetY : -18

  const primary = data?.primary || 'YES'
  const secondary = data?.secondary || ''

  const width = Math.max(200, Math.min(320, 28 + primary.length * 8 + secondary.length * 6))
  const height = 30

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${badgeX}px, ${badgeY + offsetY}px)`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(2,6,23,0.92)',
              border: '1px solid rgba(226,232,240,0.18)',
              boxShadow: '0 10px 24px rgba(0,0,0,0.30)',
              color: 'rgba(226,232,240,0.92)',
              fontSize: 11,
              lineHeight: 1,
              maxWidth: width,
              height,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontWeight: 950, letterSpacing: 0.25 }}>{primary}</span>
            {secondary ? (
              <span style={{ fontWeight: 800, color: 'rgba(148,163,184,0.95)' }}>{secondary}</span>
            ) : null}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
