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

function compactSecondaryLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  return raw
    .replace(/deposit\s*\+\s*trade\s*in\s*48h/gi, 'dep+trade 48h')
    .replace(/no\s+deposit\s+in\s+48h/gi, 'no dep 48h')
    .replace(/nessun\s+deposito\s+in\s+48h/gi, 'no dep 48h')
    .replace(/deposito\s*\+\s*trade\s*in\s*48h/gi, 'dep+trade 48h')
    .replace(/intent\s+detected/gi, 'intent')
    .replace(/intent\s+rilevato/gi, 'intent')
    .replace(/no\s+intent\s+event/gi, 'no intent')
    .replace(/nessun\s+evento\s+di\s+intent/gi, 'no intent')
    .replace(/revisited\s+funding/gi, 'revisit funding')
    .replace(/ha\s+rivisitato\s+il\s+funding/gi, 'revisit funding')
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
  const sourceHandleName = String(sourceHandle || '')
  const isDecisionBranchHandle =
    sourceHandleName.includes('out-left') ||
    sourceHandleName.includes('out-right') ||
    sourceHandleName.includes('out-center')
  const branchSide = sourceHandleName.includes('out-left')
    ? -1
    : sourceHandleName.includes('out-right')
      ? 1
      : 0
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
  const baseT =
    typeof data?.t === 'number'
      ? Math.max(0, Math.min(1, data.t))
      : isSolitics && isDecisionBranchHandle
        ? edgeVisibility === 'focus'
          ? 0.38
          : 0.34
        : defaultT
  const t = baseT
  let badgeX = sourceX + (targetX - sourceX) * t
  const badgeY = sourceY + (targetY - sourceY) * t
  const isHorizontal = sourcePosition === 'right' || targetPosition === 'left'
  const edgeDir = Math.sign(targetX - sourceX || 1)
  const minSourceDistance = isSolitics && isDecisionBranchHandle ? (branchSide > 0 ? 118 : 96) : 62
  if (isSolitics && Math.abs(badgeX - sourceX) < minSourceDistance) {
    badgeX = sourceX + edgeDir * minSourceDistance
  }

  const fallbackOffsetY = isHorizontal ? -20 : -16
  const defaultBranchOffsetY = branchSide < 0 ? -30 : branchSide > 0 ? 30 : -18
  const offsetY =
    typeof data?.offsetY === 'number'
      ? data.offsetY
      : isSolitics && isDecisionBranchHandle
        ? defaultBranchOffsetY
        : fallbackOffsetY
  const offsetX =
    typeof data?.offsetX === 'number'
      ? data.offsetX
      : isSolitics && isDecisionBranchHandle
        ? branchSide > 0
          ? 16
          : branchSide < 0
            ? -8
            : 0
        : 0

  const primary = data?.primary || 'YES'
  const primaryText = String(primary || '').trim()
  const primaryUpper = primaryText.toUpperCase()
  const secondaryRaw = data?.secondary || ''
  const secondaryCompact = compactSecondaryLabel(secondaryRaw)
  const showSecondary =
    Boolean(secondaryCompact) &&
    (!isSolitics ||
      edgeVisibility === 'focus' ||
      Boolean(data?.isConnected) ||
      Boolean(data?.alwaysShowSecondary) ||
      Boolean(data?.hasChoiceLabel))
  const plainTextColor = /no|not/i.test(primary) ? '#b91c1c' : '#2563eb'
  const isNoBranch = /\b(NO|NOT)\b/i.test(primaryText)
  const isYesBranch = /\b(YES|S[IÌ])\b/i.test(primaryText)
  const isWarmBranch = /\b(WARM|CALDO|STABLE|STABILE)\b/i.test(primaryText)
  const primaryPill = isNoBranch
    ? {
        background: 'linear-gradient(180deg, #fee2e2 0%, #fecaca 100%)',
        border: '1px solid #ef4444',
        color: '#991b1b',
      }
    : isYesBranch
      ? {
          background: 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)',
          border: '1px solid #16a34a',
          color: '#166534',
        }
      : isWarmBranch
        ? {
            background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
            border: '1px solid #d97706',
            color: '#92400e',
          }
        : {
            background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '1px solid #2563eb',
            color: '#1e3a8a',
          }
  const showLabel = !isSolitics || Boolean(data?.hasChoiceLabel) || Boolean(data?.isConnected)
  const showDot = !isSolitics || Boolean(data?.showDot)
  const edgeDeltaX = targetX - sourceX
  const dotX = sourceX + (Math.abs(edgeDeltaX) > 48 ? Math.sign(edgeDeltaX) * 38 : edgeDeltaX * 0.5)
  const dotY = sourceY
  const dotColor = '#0f766e'
  const dotOpacity = edgeVisibility === 'focus' ? 0.92 : 0.32
  const dotSize = edgeVisibility === 'focus' ? 6 : 4

  const width = Math.max(170, Math.min(280, 28 + primary.length * 8 + secondaryCompact.length * 6))
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
              transform: `translate(-50%, -50%) translate(${badgeX + offsetX}px, ${badgeY + offsetY}px)`,
              pointerEvents: 'none',
              zIndex: 80,
            }}
          >
            {isSolitics ? (
              <div style={{ textAlign: 'center', lineHeight: 1.1, display: 'grid', gap: 4 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 10px',
                    minWidth: 44,
                    borderRadius: 999,
                    background: primaryPill.background,
                    border: primaryPill.border,
                    color: primaryPill.color,
                    boxShadow: '0 4px 10px rgba(15,23,42,0.14)',
                    fontSize: 10,
                    fontWeight: 950,
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {primaryUpper}
                </div>
                {showSecondary ? (
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      color: plainTextColor,
                      opacity: 0.9,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {secondaryCompact}
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
                {showSecondary ? (
                  <span style={{ fontWeight: 800, color: '#475569' }}>{secondaryCompact}</span>
                ) : null}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
