import React from 'react'
import { Handle, Position } from '../reactflowCompat'

export default function OutcomeNode({ data }) {
  const tone = data?.kind
  const isLink = Boolean(data?.linkToFlow)
  const borderByTone = {
    positive: 'rgba(34,197,94,0.35)',
    neutral: 'rgba(148,163,184,0.28)',
    negative: 'rgba(239,68,68,0.32)',
  }

  const linkAccent = isLink
    ? {
        cursor: 'pointer',
        border: '1px solid rgba(56, 189, 248, 0.70)',
        outline: '2px solid rgba(34, 211, 238, 0.16)',
        outlineOffset: 2,
        boxShadow:
          '0 10px 30px rgba(0,0,0,0.24), 0 0 0 4px rgba(56, 189, 248, 0.08), 0 0 20px rgba(34, 211, 238, 0.14)',
      }
    : null

  return (
    <div
      style={{
        position: 'relative',
        padding: '10px 12px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: `1px solid ${borderByTone[tone] || 'rgba(148, 163, 184, 0.25)'}`,
        borderRadius: 999,
        boxShadow: '0 10px 30px rgba(0,0,0,0.24)',
        color: '#e5e7eb',
        fontWeight: 900,
        fontSize: 12,
        textAlign: 'center',
        letterSpacing: 0.2,
        ...(linkAccent || {}),
      }}
    >
      {isLink ? (
        <div
          style={{
            position: 'absolute',
            top: 7,
            right: 10,
            fontSize: 11,
            fontWeight: 950,
            color: 'rgba(56, 189, 248, 0.95)',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ↗
        </div>
      ) : null}
      <div style={{ lineHeight: 1.2 }}>{data?.label}</div>

      <Handle type="target" position={Position.Top} id="in" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="out" style={{ opacity: 0 }} />
    </div>
  )
}
