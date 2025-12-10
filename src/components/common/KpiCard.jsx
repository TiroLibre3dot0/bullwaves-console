import React from 'react'

export default function KpiCard({ label, value, helper, tone = '#e2e8f0', align = 'left' }) {
  return (
    <div
      className="kpi-card"
      style={{
        padding: '12px 14px',
        borderRadius: 12,
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
        textAlign: align,
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: tone }}>{value}</div>
      {helper ? <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{helper}</div> : null}
    </div>
  )
}
