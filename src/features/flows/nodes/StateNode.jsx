import React from 'react'
import { Handle, Position } from '../reactflowCompat'

export default function StateNode({ data }) {
  const isPrimary = data?.kind === 'primary'
  const branching = Boolean(data?.branching)
  const isLink = Boolean(data?.linkToFlow)
  const linkVariant = isLink && data?.kind === 'influence' ? 'influence' : 'step'

  const linkPalette =
    linkVariant === 'influence'
      ? {
          border: 'rgba(168, 85, 247, 0.70)',
          outline: 'rgba(168, 85, 247, 0.18)',
          ring: 'rgba(168, 85, 247, 0.10)',
          glow: 'rgba(168, 85, 247, 0.18)',
          icon: 'rgba(192, 132, 252, 0.95)',
        }
      : {
          border: 'rgba(56, 189, 248, 0.72)',
          outline: 'rgba(34, 211, 238, 0.18)',
          ring: 'rgba(56, 189, 248, 0.10)',
          glow: 'rgba(34, 211, 238, 0.18)',
          icon: 'rgba(56, 189, 248, 0.95)',
        }

  const linkAccent = isLink
    ? {
        cursor: 'pointer',
        border: `1px solid ${linkPalette.border}`,
        outline: `2px solid ${linkPalette.outline}`,
        outlineOffset: 2,
        boxShadow: `0 12px 34px rgba(0,0,0,0.28), 0 0 0 4px ${linkPalette.ring}, 0 0 24px ${linkPalette.glow}`,
      }
    : null

  return (
    <div
      style={{
        position: 'relative',
        padding: isPrimary ? '12px 14px' : '10px 12px',
        background: isPrimary ? 'rgba(2, 6, 23, 0.78)' : 'rgba(15, 23, 42, 0.65)',
        border: isPrimary
          ? '1px solid rgba(226,232,240,0.22)'
          : '1px solid rgba(148, 163, 184, 0.22)',
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        color: '#e5e7eb',
        fontWeight: 800,
        fontSize: isPrimary ? 13 : 12,
        letterSpacing: 0.2,
        ...(linkAccent || {}),
      }}
    >
      {isLink ? (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontSize: 12,
            fontWeight: 900,
            color: linkPalette.icon,
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ↗
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ lineHeight: 1.15 }}>{data?.label}</div>
        {data?.subLabel ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.95)' }}>
            {data.subLabel}
          </div>
        ) : null}
      </div>

      <Handle type="target" position={Position.Top} id="in" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out" style={{ opacity: 0 }} />

      {branching ? (
        <Handle type="source" position={Position.Right} id="out-right" style={{ opacity: 0 }} />
      ) : null}
    </div>
  )
}
