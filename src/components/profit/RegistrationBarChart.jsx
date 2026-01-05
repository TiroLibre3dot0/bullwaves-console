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

export function MetricBarChart({
  data,
  title,
  valueKey = 'registrations',
  valueFormat = 'number',
  barBackgroundColor = 'rgba(34, 211, 238, 0.6)',
  barBorderColor = 'rgba(34, 211, 238, 1)',
  getTooltipLines,
}) {
  const labels = data.map((d) => d.label)
  const values = data.map((d) => Number(d?.[valueKey] ?? 0))

  const formatValue = (v) => {
    const num = Number(v || 0)
    if (valueFormat === 'percent') return `${num.toFixed(2)}%`
    if (valueFormat === 'euro') return formatEuro(num)
    return formatNumberShort(num)
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: title || 'Registrations',
        data: values,
        backgroundColor: barBackgroundColor,
        borderColor: barBorderColor,
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
          label: (ctx) => {
            const datum = data?.[ctx.dataIndex]
            const lines = []
            lines.push(`${ctx.dataset.label}: ${formatValue(ctx.parsed.x)}`)
            if (typeof getTooltipLines === 'function' && datum) {
              const extra = getTooltipLines(datum) || []
              for (const l of extra) lines.push(String(l))
            }
            return lines
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cbd5e1',
          callback: (value) => formatValue(value),
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

export default function RegistrationBarChart({ data, title }) {
  return <MetricBarChart data={data} title={title} valueKey="registrations" valueFormat="number" />
}
