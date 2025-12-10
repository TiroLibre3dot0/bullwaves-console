import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatEuro, formatNumberShort } from '../../lib/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function SegmentBarChart({ data }) {
  const labels = data.map((d) => d.label)
  const deposits = data.map((d) => d.deposits)
  const withdrawals = data.map((d) => d.withdrawals)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Net Deposits',
        data: deposits,
        backgroundColor: 'rgba(34, 211, 238, 0.6)',
        borderColor: 'rgba(34, 211, 238, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
      {
        label: 'Withdrawals',
        data: withdrawals,
        backgroundColor: 'rgba(248, 113, 113, 0.6)',
        borderColor: 'rgba(248, 113, 113, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#cbd5e1' } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatEuro(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: {
          color: '#cbd5e1',
          callback: (value) => formatEuro(value),
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  }

  return <Bar data={chartData} options={options} height={200} />
}
