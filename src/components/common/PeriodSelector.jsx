import React from 'react'

const selectStyle = { minWidth: 140, background: '#0d1a2c', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }

export default function PeriodSelector({ availableYears = [], availableMonths = {}, selectedYear = 'all', selectedMonth = 'all', onYearChange, onMonthChange }) {
  const handleYearChange = (e) => {
    const val = e.target.value === 'all' ? 'all' : Number(e.target.value)
    onYearChange?.(val)
  }

  const handleMonthChange = (e) => {
    const val = e.target.value === 'all' ? 'all' : Number(e.target.value)
    onMonthChange?.(val)
  }

  const monthsForYear = selectedYear === 'all' ? [] : availableMonths[selectedYear] || []
  const monthDisabled = selectedYear === 'all'

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Year</span>
        <select value={selectedYear} onChange={handleYearChange} style={selectStyle}>
          <option value="all">All years</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, opacity: monthDisabled ? 0.6 : 1 }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Month</span>
        <select value={selectedMonth} onChange={handleMonthChange} style={selectStyle} disabled={monthDisabled}>
          <option value="all">All months</option>
          {monthsForYear.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
