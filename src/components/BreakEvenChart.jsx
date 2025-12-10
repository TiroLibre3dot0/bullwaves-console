import React, { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { formatNumberShort } from '../lib/formatters'

export default function BreakEvenChart({
  beCurve,
  labels,
  breakEvenIndex,
}) {
  const resolvedLabels = labels ?? ['Jan','Feb','Mar','Apr','May','Jun']
  const resolvedCurve = beCurve ?? [2000, 3500, 5200, 7100, 9200, 11400]
  const minWidth = Math.max((resolvedLabels?.length || 0) * 60, 800) // ensure long timelines stay visible

  const data = useMemo(() => {
    const l = resolvedLabels
    const curve = resolvedCurve
    const bePoint = breakEvenIndex >= 0 ? l.map((_, idx) => (idx === breakEvenIndex ? curve[idx] : null)) : []

    const annotationPoints = breakEvenIndex >= 0 ? [
      {
        x: breakEvenIndex,
        y: curve[breakEvenIndex],
        label: 'Break even',
      },
    ] : []

    return {
      labels: l,
      datasets: [
        {
          label: 'Break-even curve',
          data: curve,
          tension: 0.32,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52,211,153,0.12)',
          fill: true,
          segment: {
            borderColor: (ctx) => (ctx.p1.parsed.y >= 0 ? '#34d399' : '#f87171'),
            backgroundColor: (ctx) => (ctx.p1.parsed.y >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.10)'),
          },
          pointBackgroundColor: curve.map((v) => (v >= 0 ? '#34d399' : '#f87171')),
          pointRadius: 3,
        },
        breakEvenIndex >= 0 ? {
          label: 'Break-even',
          data: bePoint,
          pointRadius: 5,
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
      ].filter(Boolean),
    }
  }, [resolvedCurve, resolvedLabels, breakEvenIndex])

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
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
