import InfoTooltip from './InfoTooltip'
import { useI18n } from '../../../i18n/I18nContext.ts'

export default function RegressionSummary({ regression }: any) {
  if (!regression) return null;

  const { t } = useI18n()

  const r2ToNumber = (v: any) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return null
    // Treat negative/unstable R² as not reliable.
    if (n < 0 || n > 1) return null
    return n
  }

  const fmtR2 = (v: any) => {
    const n = r2ToNumber(v)
    if (n === null) return '—'
    return n.toFixed(2)
  }

  const fmt = (v: any) => (v === null || v === undefined ? '—' : Number(v).toFixed(2));

  const r2Label = (v: any) => {
    const n = r2ToNumber(v)
    if (n === null) return t('traderPoints.regression.r2Label.low')
    if (n < 0.2) return t('traderPoints.regression.r2Label.weak')
    if (n < 0.5) return t('traderPoints.regression.r2Label.medium')
    return t('traderPoints.regression.r2Label.strong')
  }

  const maeText = (metric: 'activity' | 'risk' | 'retention') => {
    const mae = regression?.[metric]?.mae
    const n = Number(mae)
    if (!Number.isFinite(n)) return '—'

    const value = metric === 'retention' ? Math.round(n).toLocaleString() : n.toFixed(2)
    return t(`traderPoints.regression.maeText.${metric}`, { value })
  }

  const r2Tone = (v: any) => {
    const s = fmtR2(v)
    if (s === '—') return 'bg-slate-600'
    const n = Number(s)
    if (n >= 0.35) return 'bg-emerald-400'
    if (n >= 0.15) return 'bg-amber-400'
    return 'bg-slate-600'
  }

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-gray-200">{t('traderPoints.regression.title')}</div>
        <InfoTooltip
          label={t('traderPoints.regression.tooltip.label')}
          content={
            <div>
              <div className="font-semibold text-gray-100">{t('traderPoints.regression.tooltip.title')}</div>
              <div className="mt-1">{t('traderPoints.regression.tooltip.desc')}</div>
              <div className="mt-3 border-t border-white/10 pt-2 text-[11px] text-gray-400">{t('traderPoints.regression.tooltip.note')}</div>
            </div>
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-gray-700/50 p-3">
          <div className="text-xs font-semibold text-gray-400">{t('traderPoints.regression.metric.activity')}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-gray-200">
            <span className="text-gray-400">R²</span>
            <span className="font-semibold text-gray-100">{fmtR2(regression.activity.r2)}</span>
          </div>
          <div className={`mt-1 h-1 w-12 rounded-full ${r2Tone(regression.activity.r2)}`} />
          <div className="mt-1 text-[11px] text-gray-400">{r2Label(regression.activity.r2)}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-gray-200">
            <span className="text-gray-400">MAE</span>
            <span className="font-semibold text-gray-100">{fmt(regression.activity.mae)}</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-400">{t('traderPoints.regression.avgError', { value: maeText('activity') })}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-gray-700/50 p-3">
          <div className="text-xs font-semibold text-gray-400">{t('traderPoints.regression.metric.risk')}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-gray-200">
            <span className="text-gray-400">R²</span>
            <span className="font-semibold text-gray-100">{fmtR2(regression.risk.r2)}</span>
          </div>
          <div className={`mt-1 h-1 w-12 rounded-full ${r2Tone(regression.risk.r2)}`} />
          <div className="mt-1 text-[11px] text-gray-400">{r2Label(regression.risk.r2)}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-gray-200">
            <span className="text-gray-400">MAE</span>
            <span className="font-semibold text-gray-100">{fmt(regression.risk.mae)}</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-400">{t('traderPoints.regression.avgError', { value: maeText('risk') })}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-gray-700/50 p-3">
          <div className="text-xs font-semibold text-gray-400">{t('traderPoints.regression.metric.retention')}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-gray-200">
            <span className="text-gray-400">R²</span>
            <span className="font-semibold text-gray-100">{fmtR2(regression.retention.r2)}</span>
          </div>
          <div className={`mt-1 h-1 w-12 rounded-full ${r2Tone(regression.retention.r2)}`} />
          <div className="mt-1 text-[11px] text-gray-400">{r2Label(regression.retention.r2)}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-gray-200">
            <span className="text-gray-400">MAE</span>
            <span className="font-semibold text-gray-100">{fmt(regression.retention.mae)}</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-400">{t('traderPoints.regression.avgError', { value: maeText('retention') })}</div>
        </div>
      </div>
    </div>
  );
}
