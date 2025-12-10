import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function MonthlyProfitLineChart({ data }) {
  const labels = data.map((d) => d.label)
  const values = data.map((d) => d.value)
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Profit',
        data: values,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,0.15)',
        pointBackgroundColor: '#22d3ee',
        tension: 0.32,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y.toLocaleString('en-GB')} €`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  }

  return <Line data={chartData} options={options} height={240} />
}
