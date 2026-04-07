import React from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '../reactflowCompat'

function getLinearHorizontalPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  edgeVisibility,
  sourceHandle,
}) {
  const sameRow = Math.abs(targetY - sourceY) <= 12
  const deltaX = targetX - sourceX
  const direction = Math.sign(deltaX || 1)
  const exitStub = edgeVisibility === 'focus' ? 42 : edgeVisibility === 'main' ? 34 : 28
  const entryStub = sameRow ? 0 : 18 * direction
  const bendX = sourceX + exitStub * direction
  const preTargetX = targetX - entryStub

  if (sameRow) {
    return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
  }

  return `M ${sourceX} ${sourceY} L ${bendX} ${sourceY} L ${bendX} ${targetY} L ${preTargetX} ${targetY} L ${targetX} ${targetY}`
}

export default function BadgeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceHandle,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}) {
  const isSolitics = data?.theme === 'solitics'
  const edgeVisibility = data?.edgeVisibility || 'main'
  const [smoothPath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
  })
  const edgePath = isSolitics
    ? getLinearHorizontalPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        edgeVisibility,
        sourceHandle,
      })
    : smoothPath

  // Place the badge closer to the source node for board readability.
  // t=0 => at source, t=1 => at target.
  const defaultT = edgeVisibility === 'focus' ? 0.3 : edgeVisibility === 'main' ? 0.24 : 0.18
  const t = typeof data?.t === 'number' ? Math.max(0, Math.min(1, data.t)) : defaultT
  const badgeX = sourceX + (targetX - sourceX) * t
  const badgeY = sourceY + (targetY - sourceY) * t
  const isHorizontal = sourcePosition === 'right' || targetPosition === 'left'
  const offsetY = typeof data?.offsetY === 'number' ? data.offsetY : isHorizontal ? -20 : -16

  const primary = data?.primary || 'YES'
  const secondary = data?.secondary || ''
  const plainTextColor = /no|not/i.test(primary) ? '#b91c1c' : '#2563eb'
  const showLabel = !isSolitics || Boolean(data?.hasChoiceLabel) || Boolean(data?.isConnected)
  const showDot = !isSolitics || Boolean(data?.showDot)
  const edgeDeltaX = targetX - sourceX
  const dotX = sourceX + (Math.abs(edgeDeltaX) > 48 ? Math.sign(edgeDeltaX) * 38 : edgeDeltaX * 0.5)
  const dotY = sourceY
  const dotColor = '#0f766e'
  const dotOpacity = edgeVisibility === 'focus' ? 0.92 : 0.32
  const dotSize = edgeVisibility === 'focus' ? 6 : 4

  const width = Math.max(200, Math.min(320, 28 + primary.length * 8 + secondary.length * 6))
  const height = 30

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />

      {isSolitics && showDot ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${dotX}px, ${dotY}px)`,
              width: dotSize,
              height: dotSize,
              borderRadius: 999,
              background: dotColor,
              opacity: dotOpacity,
              pointerEvents: 'none',
            }}
          />
        </EdgeLabelRenderer>
      ) : null}

      {showLabel ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${badgeX}px, ${badgeY + offsetY}px)`,
              pointerEvents: 'none',
            }}
          >
            {isSolitics ? (
              <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    color: plainTextColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {primary}
                </div>
                {secondary ? (
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#2563eb',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {secondary}
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 12px',
                  borderRadius: 999,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 10px 22px rgba(15,23,42,0.12)',
                  color: '#0f172a',
                  fontSize: 11,
                  lineHeight: 1,
                  maxWidth: width,
                  height,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontWeight: 950, letterSpacing: 0.25 }}>{primary}</span>
                {secondary ? (
                  <span style={{ fontWeight: 800, color: '#475569' }}>{secondary}</span>
                ) : null}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
