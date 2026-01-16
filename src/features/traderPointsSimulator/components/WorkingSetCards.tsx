import InfoTooltip from './InfoTooltip'
import { useI18n } from '../../../i18n/I18nContext.ts'

export interface WorkingSetStats {
  totalUsers: number;
  activeUsers: number;
  avgPositionsCount: number;
  medianPositionsCount: number;
  avgPositionsPerDayUserMean: number;
  positionsPerDayGlobal: number;
  positionsPerDayMedian: number;
  positionsPerDayMedianZoneMean: number;
  positionsPerDayMedianZoneKeptPct: number;
  avgAccountAgeDays: number;
  avgTraderLifetimeDays: number;
  traderLifetimeAvailablePct: number;
}

export function WorkingSetCards({ stats }: { stats: WorkingSetStats | null }) {
  if (!stats) return null;

  const { t } = useI18n()

  const pct = stats.totalUsers ? (stats.activeUsers / stats.totalUsers) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>{t('traderPoints.workingSet.activeSample')}</span>
          <InfoTooltip
            label={t('traderPoints.workingSet.tooltip.rules.label')}
            content={
              <div>
                <div className="font-semibold text-slate-100">{t('traderPoints.workingSet.tooltip.rules.title')}</div>
                <div className="mt-1">{t('traderPoints.workingSet.tooltip.rules.deposits')}</div>
                <div>{t('traderPoints.workingSet.tooltip.rules.positions')}</div>
                <div>{t('traderPoints.workingSet.tooltip.rules.age')}</div>
              </div>
            }
          />
        </div>
        <div className="mt-1 text-3xl font-black tracking-tight text-slate-100">
          {stats.activeUsers.toLocaleString()}
          <span className="ml-2 text-sm font-semibold text-slate-400">/ {stats.totalUsers.toLocaleString()} ({pct.toFixed(1)}%)</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>{t('traderPoints.workingSet.avgPositions')}</span>
          <InfoTooltip
            label={t('traderPoints.workingSet.tooltip.positions.label')}
            content={
              <div>
                <div className="font-semibold text-slate-100">{t('traderPoints.workingSet.tooltip.positions.title')}</div>
                <div className="mt-1">{t('traderPoints.workingSet.tooltip.positions.desc')}</div>
              </div>
            }
          />
        </div>
        <div className="mt-1 text-3xl font-black tracking-tight text-slate-100">{stats.avgPositionsCount.toFixed(0)}</div>
        <div className="text-xs text-slate-400 mt-1">
          {t('traderPoints.workingSet.medianLabel', { value: stats.medianPositionsCount.toFixed(0) })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>{t('traderPoints.workingSet.ppdMedianZone')}</span>
          <InfoTooltip
            label={t('traderPoints.workingSet.tooltip.ppd.label')}
            content={
              <div>
                <div className="font-semibold text-slate-100">{t('traderPoints.workingSet.tooltip.ppd.title')}</div>
                <div className="mt-1">{t('traderPoints.workingSet.tooltip.ppd.formula')}</div>
                <div className="mt-2">{t('traderPoints.workingSet.tooltip.ppd.zone')}</div>
              </div>
            }
          />
        </div>
        <div className="mt-1 text-3xl font-black tracking-tight text-slate-100">{stats.positionsPerDayMedianZoneMean.toFixed(2)}</div>
        <div className="text-xs text-slate-400 mt-1">
          {t('traderPoints.workingSet.keptLine', {
            keptPct: stats.positionsPerDayMedianZoneKeptPct.toFixed(0),
            median: stats.positionsPerDayMedian.toFixed(2),
          })}
        </div>
        <div className="text-xs text-slate-400">
          {t('traderPoints.workingSet.rawLine', {
            rawMean: stats.avgPositionsPerDayUserMean.toFixed(2),
            globalMean: stats.positionsPerDayGlobal.toFixed(2),
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>{t('traderPoints.workingSet.lifetime')}</span>
          <InfoTooltip
            label={t('traderPoints.workingSet.tooltip.lifetime.label')}
            content={
              <div>
                <div className="font-semibold text-slate-100">{t('traderPoints.workingSet.tooltip.lifetime.title')}</div>
                <div className="mt-1">{t('traderPoints.workingSet.tooltip.lifetime.account')}</div>
                <div className="mt-1">{t('traderPoints.workingSet.tooltip.lifetime.trader')}</div>
              </div>
            }
          />
        </div>
        <div className="mt-1 text-3xl font-black tracking-tight text-slate-100">{stats.avgAccountAgeDays.toFixed(0)}</div>
        <div className="text-xs text-slate-400 mt-1">
          {t('traderPoints.workingSet.traderLifetimeLine', {
            days: stats.avgTraderLifetimeDays.toFixed(0),
            pct: stats.traderLifetimeAvailablePct.toFixed(0),
          })}
        </div>
      </div>
    </div>
  );
}

export default WorkingSetCards;
