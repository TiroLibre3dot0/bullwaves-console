import React, { useState } from 'react'

export default function KpiCard({
  label,
  value,
  helper,
  fullValue,
  tone = '#e2e8f0',
  align = 'left',
  size = 'md',
  density = 'default',
  style,
}) {
  const isSmall = size === 'sm'
  const isCompact = density === 'compact'
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipText = helper || fullValue

  const padding = isSmall ? (isCompact ? '6px 8px' : '8px 10px') : '12px 14px'

  const labelFontSize = isSmall ? (isCompact ? 10 : 11) : 12
  const labelMarginBottom = isSmall ? (isCompact ? 2 : 3) : 4
  const valueFontSize = isSmall ? (isCompact ? 16 : 18) : 20
  const helperFontSize = isSmall ? (isCompact ? 9 : 10) : 11
  const helperMarginTop = isSmall ? (isCompact ? 0 : 1) : 2

  return (
    <div
      className="kpi-card"
      style={{
        padding,
        borderRadius: 12,
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
        textAlign: align,
        position: 'relative',
        ...style,
      }}
    >
      <div style={{ fontSize: labelFontSize, color: '#9ca3af', marginBottom: labelMarginBottom }}>
        {label}
      </div>
      <div
        onMouseEnter={() => tooltipText && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={tooltipText || undefined}
        style={{
          fontSize: valueFontSize,
          fontWeight: 700,
          color: tone,
          lineHeight: 1.1,
          position: 'relative',
          display: 'inline-block',
        }}
      >
        {value}
        {showTooltip && tooltipText && (
          <div
            style={{
              position: 'absolute',
              bottom: '110%',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(2, 8, 23, 0.98)',
              color: tone,
              padding: '5px 9px',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: `1px solid ${tone}33`,
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
              marginBottom: 6,
              zIndex: 1000,
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {tooltipText}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '3px solid transparent',
                borderRight: '3px solid transparent',
                borderTop: `3px solid rgba(2, 8, 23, 0.98)`,
              }}
            />
          </div>
        )}
      </div>
      {helper ? (
        <div style={{ fontSize: helperFontSize, color: '#9ca3af', marginTop: helperMarginTop }}>
          {helper}
        </div>
      ) : null}
    </div>
  )
}
