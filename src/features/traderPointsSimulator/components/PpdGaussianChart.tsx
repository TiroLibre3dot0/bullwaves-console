import InfoTooltip from './InfoTooltip'
import { useI18n } from '../../../i18n/I18nContext'

export type PpdGaussianChartData = {
  rangeMin: number;
  rangeMax: number;
  binCenters: number[];
  histogramCounts: number[];
  curveCounts: number[];
  mu: number;
  sigma: number;
  n: number;
};

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export default function PpdGaussianChart({
  data,
  title,
}: {
  data: PpdGaussianChartData | null;
  title?: string;
}) {
  if (!data || !data.binCenters.length) return null;

  const { t } = useI18n()
  const titleText = title ?? t('traderPoints.chart.ppdTitle')

  const {
    rangeMin,
    rangeMax,
    binCenters,
    histogramCounts,
    curveCounts,
    mu,
    sigma,
    n,
  } = data;

  const width = 760;
  const height = 220;
  const padL = 46;
  const padR = 18;
  const padT = 18;
  const padB = 34;

  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxY = Math.max(
    1,
    ...histogramCounts.filter(Number.isFinite),
    ...curveCounts.filter(Number.isFinite),
  );

  const xScale = (x: number) =>
    padL + ((x - rangeMin) / Math.max(rangeMax - rangeMin, 1e-9)) * plotW;
  const yScale = (y: number) => padT + (1 - y / maxY) * plotH;

  const binWidth =
    binCenters.length > 1 ? binCenters[1] - binCenters[0] : rangeMax - rangeMin;
  const barW = Math.max(
    1,
    (binWidth / Math.max(rangeMax - rangeMin, 1e-9)) * plotW,
  );

  const curvePath = (() => {
    const pts = binCenters.map((x, i) => {
      const cx = xScale(x);
      const cy = yScale(curveCounts[i] ?? 0);
      return [cx, cy] as const;
    });
    if (!pts.length) return '';
    return pts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(' ');
  })();

  const ticks = 5;
  const xTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const t = i / ticks;
    return rangeMin + t * (rangeMax - rangeMin);
  });

  const yTicks = Array.from({ length: 4 + 1 }, (_, i) => {
    const t = i / 4;
    return t * maxY;
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-slate-200">{titleText}</div>
          <InfoTooltip
            label={t('traderPoints.chart.tooltip.label')}
            content={
              <div>
                <div className="font-semibold text-slate-100">{t('traderPoints.chart.tooltip.title')}</div>
                <div className="mt-1">{t('traderPoints.chart.tooltip.line1')}</div>
                <div className="mt-2">{t('traderPoints.chart.tooltip.line2')}</div>
              </div>
            }
          />
        </div>
        <div className="text-xs text-slate-400 whitespace-nowrap">
          {t('traderPoints.chart.stats', {
            n: n.toLocaleString(),
            mu: mu.toFixed(2),
            sigma: sigma.toFixed(2),
          })}
        </div>
      </div>

      <div className="mt-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[220px]"
          role="img"
          aria-label={t('traderPoints.chart.aria')}
        >
          {/* grid + axes */}
          <rect x={padL} y={padT} width={plotW} height={plotH} fill="#0b1220" opacity={0.55} />

          {yTicks.map((y, i) => {
            const yy = yScale(y);
            return (
              <g key={i}>
                <line
                  x1={padL}
                  x2={padL + plotW}
                  y1={yy}
                  y2={yy}
                  stroke="#334155"
                  strokeWidth={1}
                />
                <text
                  x={padL - 8}
                  y={yy + 4}
                  fontSize={10}
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  {Math.round(y).toLocaleString()}
                </text>
              </g>
            );
          })}

          {xTicks.map((x, i) => {
            const xx = xScale(x);
            return (
              <g key={i}>
                <line
                  x1={xx}
                  x2={xx}
                  y1={padT}
                  y2={padT + plotH}
                  stroke="#1f2937"
                  strokeWidth={1}
                />
                <text
                  x={xx}
                  y={padT + plotH + 18}
                  fontSize={10}
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  {x.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* histogram */}
          {binCenters.map((x, i) => {
            const count = histogramCounts[i] ?? 0;
            const xx = xScale(x) - barW / 2;
            const yy = yScale(count);
            const h = clamp(padT + plotH - yy, 0, plotH);
            return (
              <rect
                key={i}
                x={xx}
                y={yy}
                width={barW}
                height={h}
                fill="#22d3ee"
                opacity={0.7}
              />
            );
          })}

          {/* gaussian curve */}
          {sigma > 0 && curvePath && (
            <path d={curvePath} fill="none" stroke="#60a5fa" strokeWidth={2} />
          )}

          {/* median marker */}
          <line
            x1={xScale(mu)}
            x2={xScale(mu)}
            y1={padT}
            y2={padT + plotH}
            stroke="#e2e8f0"
            strokeDasharray="4 3"
            strokeWidth={1}
            opacity={0.7}
          />
          <text
            x={xScale(mu)}
            y={padT + 10}
            fontSize={10}
            fill="#e2e8f0"
            textAnchor="middle"
          >
            {t('traderPoints.chart.medianLabel')}
          </text>
        </svg>
      </div>
    </div>
  );
}
