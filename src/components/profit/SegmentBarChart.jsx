import React from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatEuro, formatNumberShort } from '../../lib/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

export default function SegmentBarChart({ data }) {
  const labels = data.map((d) => d.label)
  const deposits = data.map((d) => d.deposits)
  const withdrawals = data.map((d) => d.withdrawals)
  const pl = data.map((d) => d.pl)

  // Scale PL values to be more visible (multiply by 10 for better visibility)
  const scaledPl = pl.map(p => p * 10)

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
      {
        label: 'PL (Profit/Loss) x10',
        data: scaledPl,
        type: 'line',
        borderColor: 'rgba(255, 215, 0, 1)',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 4,
        fill: false,
        tension: 0.1,
        pointBackgroundColor: 'rgba(255, 215, 0, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        yAxisID: 'y1',
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#cbd5e1' } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.label === 'PL (Profit/Loss) x10') {
              return `${ctx.dataset.label}: ${formatEuro(ctx.parsed.y / 10)}`
            }
            return `${ctx.dataset.label}: ${formatEuro(ctx.parsed.y)}`
          },
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
      y1: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: '#FFD700',
          callback: (value) => formatEuro(value),
        },
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'PL (Profit/Loss)',
          color: '#FFD700',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        beginAtZero: false,
      },
    },
  }

  return <Bar data={chartData} options={options} height={200} />
}
