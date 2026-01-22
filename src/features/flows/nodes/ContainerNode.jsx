import React from 'react'

export default function ContainerNode({ data }) {
  const variant = data?.variant
  const isAccent = variant === 'accent'

  const containerStyle = isAccent
    ? {
        background: 'linear-gradient(135deg, rgba(27,77,184,0.14), rgba(37,208,242,0.10))',
        border: '1px solid rgba(34,211,238,0.32)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 14px 28px rgba(34,211,238,0.06)',
      }
    : {
        background: 'rgba(255,255,255,0.015)',
        border: '1px dashed rgba(148, 163, 184, 0.20)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }

  const labelStyle = isAccent
    ? {
        background: 'rgba(34,211,238,0.10)',
        border: '1px solid rgba(34,211,238,0.32)',
        color: 'rgba(199,246,255,0.95)',
      }
    : {
        background: 'rgba(2,6,23,0.45)',
        border: '1px solid rgba(148,163,184,0.14)',
        color: 'rgba(226,232,240,0.85)',
      }

  const gridDot = isAccent ? 'rgba(34,211,238,0.12)' : 'rgba(148,163,184,0.08)'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 14,
        ...containerStyle,
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 999,
          ...labelStyle,
          fontWeight: 900,
          fontSize: 12,
          letterSpacing: 0.25,
        }}
      >
        {data?.label || 'Influences'}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${gridDot} 1px, transparent 0)`,
          backgroundSize: '18px 18px',
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
