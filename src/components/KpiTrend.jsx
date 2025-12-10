import React, { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { formatNumberShort } from '../lib/formatters'

export default function KpiTrend({ labels, series, title, color = '#38bdf8', suffix = '' }) {

  const data = useMemo(() => {
    const l = labels ?? []
    const values = series ?? []
    return {
      labels: l,
      datasets: [
        {
          label: title,
          data: values,
          borderColor: color,
          backgroundColor: `${color}22`,
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    }
  }, [labels, series, color, title])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${title}: ${formatNumberShort(ctx.parsed.y)}${suffix}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#cbd5e1' } },
      y: {
        grid: { color: 'rgba(148,163,184,0.2)' },
        ticks: {
          color: '#cbd5e1',
          callback: (val) => formatNumberShort(val),
        },
      },
    },
  }), [title, suffix])

  return (
    <div className="h-full w-full">
      <Line data={data} options={options} />
    </div>
  )
}
