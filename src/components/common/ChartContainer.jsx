import React from 'react'

export default function ChartContainer({ height = 240, children }) {
  return (
    <div className="chart-container" style={{ height, width: '100%' }}>
      {children}
    </div>
  )
}
