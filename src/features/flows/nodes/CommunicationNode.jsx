import React from 'react'
import { Handle, Position } from '../reactflowCompat'

export default function CommunicationNode({ data }) {
  const isInfluence = data?.kind === 'influence'
  const isLink = Boolean(data?.linkToFlow)
  const linkVariant = isLink && isInfluence ? 'influence' : 'step'

  const linkPalette =
    linkVariant === 'influence'
      ? {
          border: 'rgba(168, 85, 247, 0.62)',
          outline: 'rgba(168, 85, 247, 0.16)',
          ring: 'rgba(168, 85, 247, 0.08)',
          glow: 'rgba(168, 85, 247, 0.14)',
          icon: 'rgba(192, 132, 252, 0.95)',
        }
      : {
          border: 'rgba(56, 189, 248, 0.65)',
          outline: 'rgba(34, 211, 238, 0.16)',
          ring: 'rgba(56, 189, 248, 0.08)',
          glow: 'rgba(34, 211, 238, 0.14)',
          icon: 'rgba(56, 189, 248, 0.95)',
        }

  return (
    <div
      style={{
        position: 'relative',
        padding: isInfluence ? '8px 10px' : '9px 12px',
        background: isInfluence ? 'rgba(15, 23, 42, 0.28)' : 'rgba(15, 23, 42, 0.55)',
        border: isLink
          ? `1px solid ${linkPalette.border}`
          : isInfluence
            ? '1px dashed rgba(148, 163, 184, 0.38)'
            : '1px dashed rgba(148, 163, 184, 0.55)',
        outline: isLink ? `2px solid ${linkPalette.outline}` : 'none',
        outlineOffset: isLink ? 2 : 0,
        borderRadius: 10,
        color: isInfluence ? 'rgba(226,232,240,0.68)' : 'rgba(226,232,240,0.95)',
        fontWeight: isInfluence ? 750 : 800,
        fontSize: isInfluence ? 11 : 12,
        letterSpacing: 0.2,
        opacity: isInfluence ? 0.72 : 1,
        cursor: isLink ? 'pointer' : 'default',
        boxShadow: isLink ? `0 0 0 4px ${linkPalette.ring}, 0 0 22px ${linkPalette.glow}` : 'none',
      }}
    >
      {isLink ? (
        <div
          style={{
            position: 'absolute',
            top: 7,
            right: 9,
            fontSize: 11,
            fontWeight: 950,
            color: linkPalette.icon,
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ↗
        </div>
      ) : null}
      <div style={{ lineHeight: 1.15 }}>{data?.label}</div>

      {data?.subLabel ? (
        <div
          style={{ marginTop: 4, fontSize: 10, fontWeight: 800, color: 'rgba(148,163,184,0.9)' }}
        >
          {data.subLabel}
        </div>
      ) : null}

      <Handle type="target" position={Position.Top} id="in" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out" style={{ opacity: 0 }} />
    </div>
  )
}
