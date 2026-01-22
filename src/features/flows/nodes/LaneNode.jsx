import React from 'react'

export default function LaneNode({ data }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 14,
        background: data?.tint || 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(148, 163, 184, 0.10)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 999,
          background: 'rgba(2,6,23,0.5)',
          border: '1px solid rgba(148,163,184,0.14)',
          color: 'rgba(226,232,240,0.90)',
          fontWeight: 900,
          fontSize: 12,
          letterSpacing: 0.25,
        }}
      >
        {data?.label}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.10) 1px, transparent 0)',
          backgroundSize: '16px 16px',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
