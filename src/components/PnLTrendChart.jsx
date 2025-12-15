import React, { useMemo } from 'react'
import { Chart as ChartJS, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { formatNumberShort } from '../lib/formatters'

ChartJS.register(LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function PnLTrendChart({
  dataPoints,
  labels,
  datasetLabel = 'Monthly P&L',
  formatValue = formatNumberShort,
  tooltipData,
  tooltipFormatter,
  series,
  yMin,
  yMax,
  showLegend = true,
}) {
  const datasets = useMemo(() => {
    if (Array.isArray(series) && series.length) {
      return series.map((s, idx) => {
        const color = s.color || (idx === 0 ? '#34d399' : '#60a5fa')
        const mergedSegment = s.segment ? s.segment : { borderColor: color }
        const isBar = s.type === 'bar'
        return {
          type: s.type || 'line',
          label: s.label || `Series ${idx + 1}`,
          data: s.data || [],
          borderColor: color,
          backgroundColor: s.backgroundColor || (isBar ? `${color}66` : `${color}1a`),
          tension: isBar ? 0 : 0.16,
          pointRadius: isBar ? 0 : 1.5,
          borderWidth: isBar ? 0 : 2,
          segment: mergedSegment,
          pointBackgroundColor: (s.data || []).map((v) => (v >= 0 ? color : '#f87171')),
          borderDash: s.borderDash,
          stack: s.stack,
        }
      })
    }

    return [{
      type: 'line',
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
    }]
  }, [dataPoints, datasetLabel, series])

  const data = useMemo(() => ({
    labels: labels ?? ['Jan','Feb','Mar','Apr','May','Jun'],
    datasets,
  }), [datasets, labels])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: showLegend },
      tooltip: {
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label: (ctx) => {
            const idx = ctx.dataIndex
            const extra = tooltipData && Array.isArray(tooltipData) ? tooltipData[idx] : undefined
            const value = ctx.parsed?.y ?? ctx.raw
            if (tooltipFormatter) {
              return tooltipFormatter({
                value,
                label: ctx.label,
                datasetLabel: ctx.dataset.label,
                extra,
              })
            }
            return `${ctx.dataset.label}: ${formatValue(value)}`
          },
        },
      },
    },
    interaction: { mode: 'nearest', intersect: false },
    scales: {
      y: {
        min: Number.isFinite(yMin) ? yMin : undefined,
        max: Number.isFinite(yMax) ? yMax : undefined,
        suggestedMin: Number.isFinite(yMin) ? yMin : undefined,
        suggestedMax: Number.isFinite(yMax) ? yMax : undefined,
        ticks: {
          callback: (val) => formatValue(val),
          font: { size: 10 },
        },
        grid: {
          color: 'rgba(255,255,255,0.02)',
          drawBorder: false,
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
    },
  }), [formatValue, tooltipData, tooltipFormatter])

  return <Chart type="bar" data={data} options={options} />
}
