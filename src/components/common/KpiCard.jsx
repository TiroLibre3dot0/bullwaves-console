import React, { useState } from 'react'

export default function KpiCard({
  label,
  value,
  helper,
  fullValue,
  tone = '#e2e8f0',
  align = 'left',
  size = 'md',
  style,
}) {
  const isSmall = size === 'sm'
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className="kpi-card"
      style={{
        padding: isSmall ? '8px 10px' : '12px 14px',
        borderRadius: 12,
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
        textAlign: align,
        position: 'relative',
        ...style,
      }}
    >
      <div style={{ fontSize: isSmall ? 11 : 12, color: '#94a3b8', marginBottom: isSmall ? 3 : 4 }}>
        {label}
      </div>
      <div
        onMouseEnter={() => fullValue && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          fontSize: isSmall ? 18 : 20,
          fontWeight: 700,
          color: tone,
          lineHeight: 1.1,
          position: 'relative',
          display: 'inline-block',
        }}
      >
        {value}
        {showTooltip && fullValue && (
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
            {fullValue}
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
        <div style={{ fontSize: isSmall ? 10 : 11, color: '#94a3b8', marginTop: isSmall ? 1 : 2 }}>
          {helper}
        </div>
      ) : null}
    </div>
  )
}
