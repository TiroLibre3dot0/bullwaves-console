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

export default function RegionBarChart({ data }) {
  const labels = data.map((d) => d.label)
  const profitValues = data.map((d) => d.profit)
  const netDepositValues = data.map((d) => d.netDeposits)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'PL',
        data: profitValues,
        backgroundColor: 'rgba(52, 211, 153, 0.6)',
        borderColor: 'rgba(52, 211, 153, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: 'Net Deposits',
        data: netDepositValues,
        backgroundColor: 'rgba(34, 211, 238, 0.5)',
        borderColor: 'rgba(34, 211, 238, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#cbd5e1' } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatEuro(ctx.parsed.x)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cbd5e1',
          callback: (value) => formatEuro(value),
        },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
      y: {
        ticks: { color: '#cbd5e1' },
        grid: { display: false },
      },
    },
  }

  return <Bar data={chartData} options={options} height={200} />
}
