import React, { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { formatNumberShort } from '../lib/formatters'

// Supports legacy props (curve/beCurve) and new dual-series display.
export default function BreakEvenChart({
  labels,
  beCurve,
  curve,
  cumulativePl,
  cumulativePayments,
  breakEvenIndex,
}) {
  const resolvedLabels = labels ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  // Profit curve (PL - payments) keeps backwards compatibility with old prop naming.
  const profitCurve = beCurve ?? curve ?? [2000, 3500, 5200, 7100, 9200, 11400]
  const plCurve = cumulativePl ?? []
  const paymentsCurve = cumulativePayments ?? []
  const minWidth = Math.max((resolvedLabels?.length || 0) * 70, 900) // ensure long timelines stay visible

  const data = useMemo(() => {
    const l = resolvedLabels
    const bePoint = breakEvenIndex >= 0 ? l.map((_, idx) => (idx === breakEvenIndex ? profitCurve[idx] : null)) : []

    const annotationPoints = breakEvenIndex >= 0 ? [
      {
        x: breakEvenIndex,
        y: profitCurve[breakEvenIndex],
        label: 'Break even',
      },
    ] : []

    const datasets = [
      {
        label: 'Cumulative P&L',
        data: plCurve.length ? plCurve : profitCurve,
        tension: 0.32,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.10)',
        fill: false,
        pointRadius: 3,
      },
      {
        label: 'Cumulative payments',
        data: paymentsCurve.length ? paymentsCurve : [],
        tension: 0.32,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.10)',
        fill: false,
        pointRadius: 3,
      },
      {
        label: 'Net (P&L - payments)',
        data: profitCurve,
        tension: 0.32,
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251,191,36,0.10)',
        borderDash: [6, 6],
        fill: true,
        segment: {
          borderColor: (ctx) => (ctx.p1.parsed.y >= 0 ? '#34d399' : '#f87171'),
          backgroundColor: (ctx) => (ctx.p1.parsed.y >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)'),
        },
        pointRadius: 0,
      },
      breakEvenIndex >= 0 ? {
        label: 'Break-even',
        data: bePoint,
        pointRadius: 6,
        pointBackgroundColor: '#fbbf24',
        borderColor: 'transparent',
        showLine: false,
      } : null,
      breakEvenIndex >= 0 ? {
        label: 'BE flag',
        data: annotationPoints,
        parsing: { xAxisKey: 'x', yAxisKey: 'y' },
        pointRadius: 0,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        datalabels: {
          align: 'top',
          anchor: 'end',
          color: '#fbbf24',
          font: { weight: '600' },
          formatter: () => 'Break even',
          offset: 6,
        },
      } : null,
    ].filter(Boolean)

    return { labels: l, datasets }
  }, [resolvedLabels, profitCurve, plCurve, paymentsCurve, breakEvenIndex])

  const regionPlugin = useMemo(() => ({
    id: 'breakEvenRegion',
    beforeDraw: (chart) => {
      if (!chart?.chartArea) return
      const { ctx, chartArea, scales } = chart
      const beIdx = breakEvenIndex ?? -1
      const xAxis = scales.x
      const startX = chartArea.left
      const endX = chartArea.right
      const beX = beIdx >= 0 ? xAxis.getPixelForValue(beIdx) : null

      ctx.save()
      ctx.globalAlpha = 0.04
      ctx.fillStyle = '#f87171'
      if (beX !== null && beX !== undefined) ctx.fillRect(startX, chartArea.top, beX - startX, chartArea.bottom - chartArea.top)
      ctx.fillStyle = '#22c55e'
      if (beX !== null && beX !== undefined) ctx.fillRect(beX, chartArea.top, endX - beX, chartArea.bottom - chartArea.top)
      ctx.restore()
    },
  }), [breakEvenIndex])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: true, labels: { color: '#cbd5e1' } },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatNumberShort(ctx.parsed.y)}`,
        },
      },
      datalabels: {
        display: (ctx) => ctx.dataset.label === 'BE flag',
      },
      breakEvenRegion: {},
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#cbd5e1' } },
      y: {
        grid: {
          color: (ctx) => (ctx.tick.value === 0 ? '#f8fafc33' : 'rgba(148, 163, 184, 0.2)'),
          lineWidth: (ctx) => (ctx.tick.value === 0 ? 1.2 : 0.5),
        },
        ticks: {
          color: '#cbd5e1',
          callback: (val) => formatNumberShort(val),
        },
        zeroLineColor: '#f87171',
      },
    },
  }), [breakEvenIndex])

  return (
    <div className="h-full w-full" style={{ overflowX: 'auto' }}>
      <div style={{ minWidth, height: '100%' }}>
        <Line data={data} options={options} plugins={[regionPlugin]} />
      </div>
    </div>
  )
}
