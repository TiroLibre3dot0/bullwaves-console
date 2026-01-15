import { useMemo, useState } from 'react'
import InfoTooltip from './InfoTooltip'
import { getUiLang, t } from '../uiCopy'

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

function helperUnlockRate(v: number, guardrailOn: boolean) {
  const base = DEFAULTS.unlock_rate_pct
  const s = `${Math.round(v)}% di utenti ipotizzati come coinvolti dall’obiettivo.`
  if (guardrailOn) return `${s} Il guardrail riduce l’idoneità per gli utenti ad alto rischio.`
  if (Math.abs(v - base) < 0.5) return `${s} Quota di coinvolgimento baseline.`
  if (v > base) return `${s} Coinvolgimento più ampio → effetto più grande a livello sistema.`
  return `${s} Coinvolgimento più stretto → effetto più piccolo a livello sistema.`
}

export default function ScenarioControls({ scenario, onChange, pointsMultiplierReachabilityDeltaPct }: ScenarioControlsProps) {
  const [preset, setPreset] = useState<
    | 'custom'
    | 'commission_only'
    | 'goal_500'
    | 'accelerated_promo'
  >('custom')
  const [linkBonusToGoal, setLinkBonusToGoal] = useState(true)

  const lang = getUiLang('it')

  const pointsMultiplier = clampNum(scenario?.points_multiplier, DEFAULTS.points_multiplier)
  const unlockRate = clampNum(scenario?.unlock_rate_pct, DEFAULTS.unlock_rate_pct)
  const guardrailOn = !!scenario?.risk_guardrail_enabled

  const presetLabel = useMemo(() => {
    if (preset === 'commission_only') return t(lang, 'presetCommissionOnly')
    if (preset === 'goal_500') return t(lang, 'presetGoalBased500')
    if (preset === 'accelerated_promo') return t(lang, 'presetAcceleratedPromo')
    return null
  }, [preset])

  const presetSub = useMemo(() => {
    if (preset === 'commission_only') return t(lang, 'presetCommissionOnlySub')
    if (preset === 'goal_500') return t(lang, 'presetGoalBased500Sub')
    if (preset === 'accelerated_promo') return t(lang, 'presetAcceleratedPromoSub')
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
            <div className="text-sm font-semibold text-slate-200">Preset</div>
            <div className="mt-1 text-[11px] text-slate-400">Logica: goal commission-linked.</div>
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
              <option value="custom">Personalizzato</option>
              <option value="commission_only">{t(lang, 'presetCommissionOnly')}</option>
              <option value="goal_500">{t(lang, 'presetGoalBased500')}</option>
              <option value="accelerated_promo">{t(lang, 'presetAcceleratedPromo')}</option>
            </select>
            <InfoTooltip
              label="Preset"
              content={
                <div>
                  <div className="font-semibold text-slate-100">Preset</div>
                  <div className="mt-1">Questi preset cambiano solo i controlli scenario e il copy UI.</div>
                </div>
              }
            />
          </div>
        </div>
        {presetLabel && presetSub && (
          <div className="mt-2">
            <div className="text-[11px] text-slate-300 font-semibold">{t(lang, 'presetWhatMeansPrefix')} {presetLabel}</div>
            <div className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{presetSub}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
              {t(lang, 'reachabilityLabel')}
              <InfoTooltip
                label={t(lang, 'reachabilityLabel')}
                content={
                  <div>
                    <div className="font-semibold text-slate-100">{t(lang, 'reachabilityLabel')}</div>
                    <div className="mt-1">NON cambia come si guadagnano i punti. Cambia solo la raggiungibilità percepita del goal.</div>
                  </div>
                }
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {t(lang, 'reachabilityMicro')}
            </div>

            {typeof pointsMultiplierReachabilityDeltaPct === 'number' && Number.isFinite(pointsMultiplierReachabilityDeltaPct) && (
              <div className="mt-2 text-[11px] text-slate-300">
                Con ×{pointsMultiplier.toFixed(2).replace(/\.00$/, '')}, circa {Math.abs(pointsMultiplierReachabilityDeltaPct).toFixed(0)}%
                {' '}
                {pointsMultiplierReachabilityDeltaPct >= 0 ? 'in più' : 'in meno'} raggiungono la soglia obiettivo (prima del tasso di sblocco).
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
              Obiettivo (Trader Points)
              <InfoTooltip
                label="Punti richiesti"
                content={
                  <div>
                    <div className="font-semibold text-slate-100">Soglia obiettivo</div>
                    <div className="mt-1">I Trader Points rappresentano commissioni reali generate dall’utente.</div>
                    <div className="mt-1">Esempio: bonus 200€ → obiettivo 200 Trader Points.</div>
                  </div>
                }
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Il goal è commission-linked (1 TP ≈ 1€). Obiettivi più alti riducono la raggiungibilità.</div>
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
          <div className="text-[11px] text-slate-500">Collega goal e costo bonus</div>
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
              Importo bonus
              <InfoTooltip
                label="Importo bonus"
                content={
                  <div>
                    <div className="font-semibold text-slate-100">Importo bonus</div>
                    <div className="mt-1">Il bonus è il costo economico (es. 200€).</div>
                    <div className="mt-1">Nel setup classico, i punti obiettivo corrispondono al bonus (commission-linked).</div>
                  </div>
                }
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Il bonus si guadagna generando commissioni equivalenti (Trader Points).</div>
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
              Tasso di sblocco (%)
              <InfoTooltip
                label="Tasso di sblocco"
                content={
                  <div>
                    <div className="font-semibold text-slate-100">Tasso di sblocco (%)</div>
                    <div className="mt-1">Quota di utenti coinvolti dall’obiettivo.</div>
                    <div className="mt-1">Usato per la simulazione comportamentale, non per il payout reale.</div>
                  </div>
                }
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{helperUnlockRate(unlockRate, guardrailOn)}</div>
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
                Guardrail
                <InfoTooltip
                  label="Guardrail"
                  content={
                    <div>
                      <div className="font-semibold text-slate-100">Guardrail</div>
                      <div className="mt-1">Evita di incentivare comportamenti ad alto rischio.</div>
                      <div className="mt-1">Gli utenti ad alto rischio sono esclusi dall’idoneità allo sblocco (proxy rischio interno).</div>
                    </div>
                  }
                />
              </span>
              {guardrailOn && (
                <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                  Scenario filtrato per rischio
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {guardrailOn
                ? 'Gli utenti ad alto rischio sono esclusi dall’idoneità allo sblocco.'
                : 'Tutti gli utenti idonei sono considerati per lo sblocco.'}
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
