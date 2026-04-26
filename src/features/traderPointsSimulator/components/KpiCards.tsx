import { useI18n } from '../../../i18n/I18nContext.ts'

export default function KpiCards({ userAgg, simulation }: any) {
  if (!userAgg?.length) return null;

  const { t } = useI18n()

  // New user-centric simulation returns a summary object:
  // { baseline: {activity,risk,retention}, sim: {...}, delta: {...}, filteredOutPct }
  if (simulation && !Array.isArray(simulation) && simulation.baseline && simulation.sim && simulation.delta) {
    const base = simulation.baseline;
    const sim = simulation.sim;
    const del = simulation.delta;
    const baselineLabel = simulation?.baselineLabel || t('traderPoints.baseline.label')

    const deltaNum = (v: any) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : 0
    }

    const guardrailOn = !!simulation?.guardrailEnabled || !!simulation?.risk_guardrail_enabled || !!simulation?.meta?.risk_guardrail_enabled

    const fmtSigned = (n: number, digits: number) => {
      const v = Number(n)
      if (!Number.isFinite(v) || Math.abs(v) < 0.005) return '0'
      const s = v > 0 ? '+' : ''
      return `${s}${v.toFixed(digits)}`
    }

    const activityDelta = deltaNum(del.activity)
    const riskDelta = deltaNum(del.risk)
    const retentionDelta = deltaNum(del.retention)

    const activityLine = t('traderPoints.kpi.activity.line')
    const retentionLine = t('traderPoints.kpi.retention.line')
    const riskLine = guardrailOn
      ? t('traderPoints.kpi.risk.line.guardrail')
      : t('traderPoints.kpi.risk.line.noGuardrail')

    const deltaView = (s: number, b: number) => {
      const d = Number(s) - Number(b)
      if (!Number.isFinite(d) || Math.abs(d) < 0.01) {
        return <span className="text-sm text-gray-400">(—)</span>
      }
      const up = d > 0
      return (
        <span className={`text-sm ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
          ({up ? '↗' : '↘'} {d > 0 ? `+${d.toFixed(2)}` : d.toFixed(2)})
        </span>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-gray-700/70 p-5 shadow-sm">
          <div className="text-xs font-extrabold tracking-wide uppercase text-blue-200/90">{t('traderPoints.kpi.activity.label')}</div>
          <div className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-gray-100">
            {fmtSigned(activityDelta, 2)}
            <span className="ml-2 text-base md:text-lg font-semibold text-gray-300">{t('traderPoints.kpi.activity.unit')}</span>
          </div>
          <div className="mt-1 text-[12px] text-gray-400">
            {t('traderPoints.kpi.deltaLine', {
              baseline: baselineLabel,
              value: Number(sim.activity).toFixed(1),
              delta: '',
            })}{' '}
            {deltaView(sim.activity, base.activity)}
          </div>
          <div className="mt-2 text-sm text-gray-200 line-clamp-1">{activityLine}</div>
          <div className="mt-1 text-[12px] text-gray-400">{t('traderPoints.why.bullet3')}</div>
          <div className="mt-3 h-0.5 w-10 rounded-full bg-blue-400/60" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-gray-700/70 p-5 shadow-sm">
          <div className="text-xs font-extrabold tracking-wide uppercase text-emerald-200/90">{t('traderPoints.kpi.retention.label')}</div>
          <div className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-gray-100">
            {fmtSigned(retentionDelta, 1)}
            <span className="ml-2 text-base md:text-lg font-semibold text-gray-300">{t('traderPoints.kpi.retention.unit')}</span>
          </div>
          <div className="mt-1 text-[12px] text-gray-400">
            {t('traderPoints.kpi.deltaLine', {
              baseline: baselineLabel,
              value: Number(sim.retention).toFixed(1),
              delta: '',
            })}{' '}
            {deltaView(sim.retention, base.retention)}
          </div>
          <div className="mt-2 text-sm text-gray-200 line-clamp-1">{retentionLine}</div>
          <div className="mt-1 text-[12px] text-gray-400">{t('traderPoints.why.bullet3')}</div>
          <div className="mt-3 h-0.5 w-10 rounded-full bg-emerald-400/60" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-gray-700/70 p-5 shadow-sm">
          <div className="text-xs font-extrabold tracking-wide uppercase text-amber-200/90">{t('traderPoints.kpi.risk.label')}</div>
          <div className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-gray-100">
            {fmtSigned(riskDelta, 2)}
            <span className="ml-2 text-base md:text-lg font-semibold text-gray-300">{t('traderPoints.kpi.risk.unit')}</span>
          </div>
          <div className="mt-1 text-[12px] text-gray-400">
            {t('traderPoints.kpi.deltaLine', {
              baseline: baselineLabel,
              value: Number(sim.risk).toFixed(2),
              delta: '',
            })}{' '}
            {deltaView(sim.risk, base.risk)}
          </div>
          <div className="mt-2 text-sm text-gray-200 line-clamp-1">{riskLine}</div>
          <div className="mt-3 h-0.5 w-10 rounded-full bg-amber-400/70" />
        </div>
      </div>
    );
  }

  // Legacy CSV trade-level mode
  const avgTrades = (userAgg.reduce((a: number, u: any) => a + (u.trades_count ?? 0), 0) / userAgg.length) || 0;
  const avgTradesSim = Array.isArray(simulation)
    ? (simulation.reduce((a: number, u: any) => a + (u.trades_count_sim || u.trades_count || 0), 0) / (simulation.length || 1))
    : avgTrades;
  const risk = (userAgg.reduce((a: number, u: any) => a + (u.pnl_volatility ?? 0), 0) / userAgg.length) || 0;
  const riskSim = Array.isArray(simulation)
    ? (simulation.reduce((a: number, u: any) => a + (u.pnl_volatility_sim || u.pnl_volatility || 0), 0) / (simulation.length || 1))
    : risk;
  const days = (userAgg.reduce((a: number, u: any) => a + (u.active_days ?? 0), 0) / userAgg.length) || 0;
  const daysSim = Array.isArray(simulation)
    ? (simulation.reduce((a: number, u: any) => a + (u.active_days_sim || u.active_days || 0), 0) / (simulation.length || 1))
    : days;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-xl border border-white/10 bg-gray-700/70 p-4">
        <div className="text-xs font-semibold text-gray-400">{t('traderPoints.legacy.avgTradesPerUser')}</div>
        <div className="mt-1 text-3xl font-black tracking-tight text-gray-100">
          {avgTradesSim.toFixed(1)} <span className="text-sm text-gray-400">({delta(avgTradesSim, avgTrades)})</span>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-gray-700/70 p-4">
        <div className="text-xs font-semibold text-gray-400">{t('traderPoints.legacy.riskIndicator')}</div>
        <div className="mt-1 text-3xl font-black tracking-tight text-gray-100">
          {riskSim.toFixed(2)} <span className="text-sm text-gray-400">({delta(riskSim, risk)})</span>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-gray-700/70 p-4">
        <div className="text-xs font-semibold text-gray-400">{t('traderPoints.legacy.activeDays')}</div>
        <div className="mt-1 text-3xl font-black tracking-tight text-gray-100">
          {daysSim.toFixed(1)} <span className="text-sm text-gray-400">({delta(daysSim, days)})</span>
        </div>
      </div>
    </div>
  );
}

function delta(sim: number, base: number) {
  const d = sim - base;
  if (Math.abs(d) < 0.01) return '–';
  return d > 0 ? `+${d.toFixed(2)}` : d.toFixed(2);
}
