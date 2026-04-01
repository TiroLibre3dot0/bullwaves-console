import { useMemo } from 'react'
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
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
  y1Min,
  y1Max,
  showLegend = true,
}) {
  const buildLineGradient = (ctx, baseColor) => {
    const chart = ctx?.chart
    const area = chart?.chartArea
    if (!area) return `${baseColor}1a`
    const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
    gradient.addColorStop(0, `${baseColor}30`)
    gradient.addColorStop(0.55, `${baseColor}0d`)
    gradient.addColorStop(1, `${baseColor}00`)
    return gradient
  }

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
          yAxisID: s.yAxisID,
          borderColor: color,
          backgroundColor:
            s.backgroundColor || (isBar ? `${color}66` : (ctx) => buildLineGradient(ctx, color)),
          fill: isBar ? false : (s.fill ?? false),
          tension: isBar ? 0 : 0.28,
          pointRadius: isBar ? 0 : 0,
          pointHoverRadius: isBar ? 0 : 3,
          pointHitRadius: isBar ? 4 : 16,
          borderWidth: isBar ? 0 : 2.2,
          segment: mergedSegment,
          pointBackgroundColor: (s.data || []).map((v) => (v >= 0 ? color : '#f87171')),
          pointBorderWidth: 0,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
          borderDash: s.borderDash,
          barThickness: isBar ? 12 : undefined,
          borderRadius: isBar ? 6 : 0,
          borderSkipped: isBar ? false : undefined,
          stack: s.stack,
          order: s.order,
        }
      })
    }

    return [
      {
        type: 'line',
        label: datasetLabel,
        data: dataPoints ?? [3200, 3500, 3650, 3800, 3950, 4100],
        borderColor: '#34d399',
        backgroundColor: (ctx) => buildLineGradient(ctx, '#34d399'),
        fill: false,
        tension: 0.28,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointHitRadius: 16,
        borderWidth: 2.2,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
        segment: {
          borderColor: (ctx) => (ctx.p1.parsed.y >= 0 ? '#34d399' : '#f87171'),
        },
        pointBackgroundColor: (dataPoints ?? []).map((v) => (v >= 0 ? '#34d399' : '#f87171')),
      },
    ]
  }, [dataPoints, datasetLabel, series])

  const data = useMemo(
    () => ({
      labels: labels ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets,
    }),
    [datasets, labels]
  )

  const hasSecondaryAxis = useMemo(() => {
    if (Number.isFinite(y1Min) || Number.isFinite(y1Max)) return true
    return datasets.some((d) => d?.yAxisID === 'y1')
  }, [datasets, y1Min, y1Max])

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 280,
        easing: 'easeOutCubic',
      },
      normalized: true,
      plugins: {
        legend: {
          display: showLegend,
          labels: {
            color: 'rgba(226,232,240,0.85)',
            usePointStyle: true,
            pointStyle: 'line',
            boxWidth: 14,
            boxHeight: 4,
            padding: 14,
            font: { size: 10 },
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(2,6,23,0.92)',
          titleColor: 'rgba(226,232,240,0.95)',
          bodyColor: 'rgba(226,232,240,0.9)',
          borderColor: 'rgba(148,163,184,0.25)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 8,
          displayColors: true,
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
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          min: Number.isFinite(yMin) ? yMin : undefined,
          max: Number.isFinite(yMax) ? yMax : undefined,
          suggestedMin: Number.isFinite(yMin) ? yMin : undefined,
          suggestedMax: Number.isFinite(yMax) ? yMax : undefined,
          ticks: {
            callback: (val) => formatValue(val),
            font: { size: 10 },
            color: 'rgba(226,232,240,0.7)',
            maxTicksLimit: 5,
          },
          grid: {
            color: 'rgba(148,163,184,0.07)',
            borderDash: [4, 4],
            drawBorder: false,
          },
        },
        ...(hasSecondaryAxis
          ? {
              y1: {
                position: 'right',
                min: Number.isFinite(y1Min) ? y1Min : undefined,
                max: Number.isFinite(y1Max) ? y1Max : undefined,
                suggestedMin: Number.isFinite(y1Min) ? y1Min : undefined,
                suggestedMax: Number.isFinite(y1Max) ? y1Max : undefined,
                ticks: {
                  callback: (val) => `${Number(val).toFixed(0)}%`,
                  font: { size: 10 },
                  color: 'rgba(226,232,240,0.7)',
                  maxTicksLimit: 5,
                },
                grid: {
                  drawOnChartArea: false,
                  color: 'rgba(148,163,184,0.07)',
                  drawBorder: false,
                },
              },
            }
          : {}),
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            autoSkip: false,
            font: { size: 10 },
            color: 'rgba(226,232,240,0.55)',
            minRotation: 45,
            maxRotation: 45,
          },
        },
      },
    }),
    [
      formatValue,
      tooltipData,
      tooltipFormatter,
      yMin,
      yMax,
      y1Min,
      y1Max,
      showLegend,
      hasSecondaryAxis,
    ]
  )

  return <Chart type="bar" data={data} options={options} />
}
