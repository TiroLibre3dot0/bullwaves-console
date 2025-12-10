import React from 'react'

const selectStyle = { minWidth: 140, background: '#0d1a2c', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }

export default function YearSelector({ availableYears = [], value = 'all', onChange }) {
  const handleChange = (e) => {
    const val = e.target.value === 'all' ? 'all' : Number(e.target.value)
    onChange?.(val)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>Year</span>
      <select value={value} onChange={handleChange} style={selectStyle}>
        <option value="all">All years</option>
        {availableYears.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
