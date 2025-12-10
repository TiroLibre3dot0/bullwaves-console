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
import { formatNumberShort } from '../../lib/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function RegistrationBarChart({ data, title }) {
  const labels = data.map((d) => d.label)
  const values = data.map((d) => d.registrations)

  const chartData = {
    labels,
    datasets: [
      {
        label: title || 'Registrations',
        data: values,
        backgroundColor: 'rgba(34, 211, 238, 0.6)',
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
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${formatNumberShort(ctx.parsed.x)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cbd5e1',
          callback: (value) => formatNumberShort(value),
        },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
      y: {
        ticks: { color: '#cbd5e1' },
        grid: { display: false },
      },
    },
  }

  return <Bar data={chartData} options={options} height={220} />
}
