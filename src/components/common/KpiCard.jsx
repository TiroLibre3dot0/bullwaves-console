import React from 'react'

export default function KpiCard({ label, value, helper, tone = '#e2e8f0', align = 'left', size = 'md', style }) {
  const isSmall = size === 'sm'
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
        ...style,
      }}
    >
      <div style={{ fontSize: isSmall ? 11 : 12, color: '#94a3b8', marginBottom: isSmall ? 3 : 4 }}>{label}</div>
      <div style={{ fontSize: isSmall ? 18 : 20, fontWeight: 700, color: tone, lineHeight: 1.1 }}>{value}</div>
      {helper ? <div style={{ fontSize: isSmall ? 10 : 11, color: '#94a3b8', marginTop: isSmall ? 1 : 2 }}>{helper}</div> : null}
    </div>
  )
}
