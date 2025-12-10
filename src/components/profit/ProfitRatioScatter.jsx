import React from 'react'
import { Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatEuro, formatNumberShort } from '../../lib/formatters'

ChartJS.register(LinearScale, PointElement, Tooltip, Legend)

export default function ProfitRatioScatter({ data }) {
  const chartData = {
    datasets: [
      {
        label: 'Entities',
        data: data.map((d) => ({ x: d.x, y: d.y, label: d.label })),
        backgroundColor: data.map((d) => (d.x >= 0 ? 'rgba(52, 211, 153, 0.6)' : 'rgba(248, 113, 113, 0.6)')),
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const l = ctx.raw.label || 'Entity'
            return `${l}: ROI ${ctx.parsed.x.toFixed(1)}%, Sales ${formatEuro(ctx.parsed.y)}`
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Profit ratio / ROI', color: '#cbd5e1' },
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        title: { display: true, text: 'Sales / Net deposits', color: '#cbd5e1' },
        ticks: {
          color: '#cbd5e1',
          callback: (value) => formatNumberShort(value),
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  }

  return <Scatter data={chartData} options={options} height={220} />
}
