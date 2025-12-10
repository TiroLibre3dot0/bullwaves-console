import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { formatNumberShort } from '../lib/formatters'

export default function RevenueCostsStacked({ revenue, costs, labels }) {

  const data = useMemo(() => ({
    labels: labels ?? ['Jan','Feb','Mar','Apr','May','Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: revenue ?? [12000, 13500, 14200, 15800, 17300, 18100],
        backgroundColor: 'rgba(59,130,246,0.6)',
        stack: 'rev',
        borderRadius: 4,
      },
      {
        label: 'Costs',
        data: costs ?? [-5200, -5400, -5600, -5900, -6100, -6300],
        backgroundColor: 'rgba(248,113,113,0.6)',
        stack: 'cost',
        borderRadius: 4,
      },
    ],
  }), [revenue, costs, labels])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'start' },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatNumberShort(ctx.raw)}`
        }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: {
        stacked: true,
        grid: { color: 'rgba(148,163,184,0.2)' },
        ticks: {
          callback: (val) => formatNumberShort(val),
          color: '#cbd5e1',
        },
      },
    },
  }), [])

  return (
    <div className="h-full w-full">
      <Bar data={data} options={options} />
    </div>
  )
}
