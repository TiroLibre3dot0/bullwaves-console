import React, { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { formatNumberShort } from '../lib/formatters'

export default function PnLTrendChart({
  dataPoints,
  labels,
  datasetLabel = 'Monthly P&L',
  formatValue = formatNumberShort,
  tooltipData,
  tooltipFormatter,
}) {

  const data = useMemo(() => ({
    labels: labels ?? ['Jan','Feb','Mar','Apr','May','Jun'],
    datasets: [
      {
        label: datasetLabel,
        data: dataPoints ?? [3200, 3500, 3650, 3800, 3950, 4100],
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.1)',
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
        segment: {
          borderColor: (ctx) => (ctx.p1.parsed.y >= 0 ? '#34d399' : '#f87171'),
        },
        pointBackgroundColor: (dataPoints ?? []).map((v) => (v >= 0 ? '#34d399' : '#f87171')),
      },
    ],
  }), [dataPoints, datasetLabel, labels])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: true },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx) => {
            const idx = ctx.dataIndex
            const extra = tooltipData && Array.isArray(tooltipData) ? tooltipData[idx] : undefined
            if (tooltipFormatter) {
              return tooltipFormatter({
                value: ctx.parsed.y,
                label: ctx.label,
                datasetLabel: ctx.dataset.label,
                extra,
              })
            }
            return `${ctx.dataset.label}: ${formatValue(ctx.parsed.y)}`
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: 'rgba(148,163,184,0.2)' },
        ticks: {
              callback: (val) => formatValue(val),
          color: '#cbd5e1',
        },
      },
    },
  }), [formatValue])

  return (
    <div className="h-full w-full">
      <Line data={data} options={options} />
    </div>
  )
}
