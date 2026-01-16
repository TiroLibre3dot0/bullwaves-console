import { useMemo, useState } from 'react'
import InfoTooltip from './InfoTooltip'
import { useI18n } from '../../../i18n/I18nContext.ts'

interface ScenarioControlsProps {
  scenario: any;
  onChange: (s: any) => void;
  pointsMultiplierReachabilityDeltaPct?: number | null;
}

const DEFAULTS = {
  points_multiplier: 1.0,
  required_points_to_unlock: 2000,
  bonus_amount: 200,
  unlock_rate_pct: 35,
} as const

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function helperUnlockRate(t: (key: string, params?: Record<string, any>) => string, v: number, guardrailOn: boolean) {
  const base = DEFAULTS.unlock_rate_pct
  const s = t('traderPoints.controls.unlockRate.helper.base', { pct: Math.round(v) })
  if (guardrailOn) return t('traderPoints.controls.unlockRate.helper.guardrail', { base: s })
  if (Math.abs(v - base) < 0.5) return t('traderPoints.controls.unlockRate.helper.baseline', { base: s })
  if (v > base) return t('traderPoints.controls.unlockRate.helper.wider', { base: s })
  return t('traderPoints.controls.unlockRate.helper.narrower', { base: s })
}

export default function ScenarioControls({ scenario, onChange, pointsMultiplierReachabilityDeltaPct }: ScenarioControlsProps) {
  const [preset, setPreset] = useState<
    | 'custom'
    | 'commission_only'
    | 'goal_500'
    | 'accelerated_promo'
  >('custom')
  const [linkBonusToGoal, setLinkBonusToGoal] = useState(true)

  const { t } = useI18n()

  const pointsMultiplier = clampNum(scenario?.points_multiplier, DEFAULTS.points_multiplier)
  const unlockRate = clampNum(scenario?.unlock_rate_pct, DEFAULTS.unlock_rate_pct)
  const guardrailOn = !!scenario?.risk_guardrail_enabled

  const presetLabel = useMemo(() => {
    if (preset === 'commission_only') return t('traderPoints.controls.preset.commissionOnly')
    if (preset === 'goal_500') return t('traderPoints.controls.preset.goal500')
    if (preset === 'accelerated_promo') return t('traderPoints.controls.preset.acceleratedPromo')
    return null
  }, [preset])

  const presetSub = useMemo(() => {
    if (preset === 'commission_only') return t('traderPoints.controls.preset.commissionOnly.sub')
    if (preset === 'goal_500') return t('traderPoints.controls.preset.goal500.sub')
    if (preset === 'accelerated_promo') return t('traderPoints.controls.preset.acceleratedPromo.sub')
    return null
  }, [preset])

  const applyPreset = (key: Exclude<typeof preset, 'custom'>) => {
    setPreset(key)

    // UI-only preset: sets scenario controls only (does not change any engine logic).
    if (key === 'commission_only') {
      onChange({
        ...scenario,
        points_multiplier: 1.0,
        bonus_amount: 200,
        required_points_to_unlock: 200,
        unlock_rate_pct: 35,
        risk_guardrail_enabled: true,
        risk_threshold: 0.5,
      })
      return
    }

    if (key === 'goal_500') {
      onChange({
        ...scenario,
        points_multiplier: 1.5,
        bonus_amount: 500,
        required_points_to_unlock: 500,
        unlock_rate_pct: 50,
        risk_guardrail_enabled: true,
        risk_threshold: 0.5,
      })
      return
    }

    // accelerated_promo
    onChange({
      ...scenario,
      points_multiplier: 4.0,
      bonus_amount: 500,
      required_points_to_unlock: 500,
      unlock_rate_pct: 50,
      risk_guardrail_enabled: true,
      risk_threshold: 0.5,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-200">{t('traderPoints.controls.preset.title')}</div>
            <div className="mt-1 text-[11px] text-slate-400">{t('traderPoints.controls.preset.micro')}</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={preset}
              onChange={(e) => {
                const v = e.target.value as any
                if (v === 'custom') {
                  setPreset('custom')
                  return
                }
                applyPreset(v)
              }}
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/50"
            >
              <option value="custom">{t('traderPoints.controls.preset.custom')}</option>
              <option value="commission_only">{t('traderPoints.controls.preset.commissionOnly')}</option>
              <option value="goal_500">{t('traderPoints.controls.preset.goal500')}</option>
              <option value="accelerated_promo">{t('traderPoints.controls.preset.acceleratedPromo')}</option>
            </select>
            <InfoTooltip
              label={t('traderPoints.controls.preset.tooltip.label')}
              content={
                <div>
                  <div className="font-semibold text-slate-100">{t('traderPoints.controls.preset.tooltip.title')}</div>
                  <div className="mt-1">{t('traderPoints.controls.preset.tooltip.desc')}</div>
                </div>
              }
            />
          </div>
        </div>
        {presetLabel && presetSub && (
          <div className="mt-2">
            <div className="text-[11px] text-slate-300 font-semibold">{t('traderPoints.controls.preset.whatMeans')} {presetLabel}</div>
            <div className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{presetSub}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
              {t('traderPoints.controls.reachability.label')}
              <InfoTooltip
                label={t('traderPoints.controls.reachability.label')}
                content={
                  <div>
                    <div className="font-semibold text-slate-100">{t('traderPoints.controls.reachability.label')}</div>
                    <div className="mt-1">{t('traderPoints.controls.reachability.tooltip.desc')}</div>
                  </div>
                }
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {t('traderPoints.reachability.micro')}
            </div>

            {typeof pointsMultiplierReachabilityDeltaPct === 'number' && Number.isFinite(pointsMultiplierReachabilityDeltaPct) && (
              <div className="mt-2 text-[11px] text-slate-300">
                {pointsMultiplierReachabilityDeltaPct >= 0
                  ? t('traderPoints.controls.reachability.delta.more', {
                      mult: pointsMultiplier.toFixed(2).replace(/\.00$/, ''),
                      pct: Math.abs(pointsMultiplierReachabilityDeltaPct).toFixed(0),
                    })
                  : t('traderPoints.controls.reachability.delta.less', {
                      mult: pointsMultiplier.toFixed(2).replace(/\.00$/, ''),
                      pct: Math.abs(pointsMultiplierReachabilityDeltaPct).toFixed(0),
                    })}
              </div>
            )}
          </div>
          <input
            type="number"
            step="0.01"
            min="0.1"
            max="5"
            value={scenario.points_multiplier}
            onChange={(e) => {
              setPreset('custom')
              onChange({ ...scenario, points_multiplier: parseFloat(e.target.value) })
            }}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 w-24 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/50"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
              {t('traderPoints.controls.goal.label')}
              <InfoTooltip
                label={t('traderPoints.controls.goal.tooltip.label')}
                content={
                  <div>
                    <div className="font-semibold text-slate-100">{t('traderPoints.controls.goal.tooltip.title')}</div>
                    <div className="mt-1">{t('traderPoints.controls.goal.tooltip.line1')}</div>
                    <div className="mt-1">{t('traderPoints.controls.goal.tooltip.line2')}</div>
                  </div>
                }
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{t('traderPoints.controls.goal.micro')}</div>
          </div>
          <input
            type="number"
            step="100"
            min="0"
            value={scenario.required_points_to_unlock}
            onChange={(e) => {
              setPreset('custom')
              const v = parseInt(e.target.value)
              onChange(linkBonusToGoal
                ? { ...scenario, required_points_to_unlock: v, bonus_amount: v }
                : { ...scenario, required_points_to_unlock: v })
            }}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 w-28 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/50"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500">{t('traderPoints.controls.goal.linkLabel')}</div>
          <input
            type="checkbox"
            checked={linkBonusToGoal}
            onChange={(e) => {
              setPreset('custom')
              setLinkBonusToGoal(e.target.checked)
              if (e.target.checked) {
                const v = clampNum(scenario?.bonus_amount, DEFAULTS.bonus_amount)
                onChange({ ...scenario, bonus_amount: v, required_points_to_unlock: v })
              }
            }}
            className="h-4 w-4 accent-cyan-400"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
              {t('traderPoints.controls.bonus.label')}
              <InfoTooltip
                label={t('traderPoints.controls.bonus.tooltip.label')}
                content={
                  <div>
                    <div className="font-semibold text-slate-100">{t('traderPoints.controls.bonus.tooltip.title')}</div>
                    <div className="mt-1">{t('traderPoints.controls.bonus.tooltip.line1')}</div>
                    <div className="mt-1">{t('traderPoints.controls.bonus.tooltip.line2')}</div>
                  </div>
                }
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{t('traderPoints.controls.bonus.micro')}</div>
          </div>
          <input
            type="number"
            step="10"
            min="0"
            value={scenario.bonus_amount}
            onChange={(e) => {
              setPreset('custom')
              const v = parseInt(e.target.value)
              onChange(linkBonusToGoal
                ? { ...scenario, bonus_amount: v, required_points_to_unlock: v }
                : { ...scenario, bonus_amount: v })
            }}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 w-24 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/50"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
              {t('traderPoints.controls.unlockRate.label')}
              <InfoTooltip
                label={t('traderPoints.controls.unlockRate.tooltip.label')}
                content={
                  <div>
                    <div className="font-semibold text-slate-100">{t('traderPoints.controls.unlockRate.tooltip.title')}</div>
                    <div className="mt-1">{t('traderPoints.controls.unlockRate.tooltip.line1')}</div>
                    <div className="mt-1">{t('traderPoints.controls.unlockRate.tooltip.line2')}</div>
                  </div>
                }
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{helperUnlockRate(t, unlockRate, guardrailOn)}</div>
          </div>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={scenario.unlock_rate_pct}
            onChange={(e) => {
              setPreset('custom')
              onChange({ ...scenario, unlock_rate_pct: parseInt(e.target.value) })
            }}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 w-24 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/50"
          />
        </div>
      </div>

      <div className="sm:col-span-2 rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                {t('traderPoints.controls.guardrail.label')}
                <InfoTooltip
                  label={t('traderPoints.controls.guardrail.tooltip.label')}
                  content={
                    <div>
                      <div className="font-semibold text-slate-100">{t('traderPoints.controls.guardrail.tooltip.title')}</div>
                      <div className="mt-1">{t('traderPoints.controls.guardrail.tooltip.line1')}</div>
                      <div className="mt-1">{t('traderPoints.controls.guardrail.tooltip.line2')}</div>
                    </div>
                  }
                />
              </span>
              {guardrailOn && (
                <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                  {t('traderPoints.controls.guardrail.badge')}
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {guardrailOn
                ? t('traderPoints.controls.guardrail.micro.on')
                : t('traderPoints.controls.guardrail.micro.off')}
            </div>
          </div>

          <input
            type="checkbox"
            checked={guardrailOn}
            onChange={(e) => {
              setPreset('custom')
              onChange({ ...scenario, risk_guardrail_enabled: e.target.checked, risk_threshold: 0.5 })
            }}
            className="h-4 w-4 accent-cyan-400"
          />
        </div>
      </div>
      </div>
    </div>
  );
}
