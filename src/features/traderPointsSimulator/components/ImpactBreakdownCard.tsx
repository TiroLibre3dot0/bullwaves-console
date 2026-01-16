import InfoTooltip from './InfoTooltip'
import { useI18n } from '../../../i18n/I18nContext.ts'

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function fmtPct(p: number) {
  if (!Number.isFinite(p)) return '0%'
  return `${(p * 100).toFixed(1)}%`
}

function fmtInt(n: number) {
  return Number.isFinite(n) ? Math.round(n).toLocaleString() : '0'
}

function fmtDays(n: number) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '0.0'
  return v.toFixed(1)
}

function fmtSignedDays(n: number) {
  const v = Number(n)
  if (!Number.isFinite(v) || Math.abs(v) < 0.0005) return '0.0'
  const s = v > 0 ? '+' : ''
  return `${s}${v.toFixed(1)}`
}

function hash01(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1_000_000) / 1_000_000
}

export default function ImpactBreakdownCard({
  users,
  scenario,
  simulation,
  defaultRiskThreshold = 0.5,
}: {
  users: any[]
  scenario: any
  simulation: any
  defaultRiskThreshold?: number
}) {
  if (!users?.length || !simulation?.baseline || !simulation?.sim) return null

  const { t } = useI18n()

  const totalUsers = users.length

  const pointsMultiplier = clampNum(scenario?.points_multiplier, 1)
  const requiredPoints = clampNum(scenario?.required_points_to_unlock, 2000)
  const unlockRatePct = clampNum(scenario?.unlock_rate_pct, 0)
  const unlockRate = Math.max(0, Math.min(1, unlockRatePct / 100))
  const guardrailOn = !!scenario?.risk_guardrail_enabled
  const riskThreshold = clampNum(scenario?.risk_threshold, defaultRiskThreshold)

  const epsilon = 1e-9
  const riskProxy = (u: any) => Math.abs(u?.pnl_total ?? 0) / Math.max(u?.total_volume ?? 0, epsilon)

  const computeReach = (mult: number) => {
    const eligiblePool = guardrailOn ? users.filter((u) => riskProxy(u) <= riskThreshold) : users

    const eligible = new Set<string>()
    for (const u of eligiblePool) {
      const tp = Number(u?.trader_points ?? 0)
      if (Number.isFinite(tp) && tp * mult >= requiredPoints) eligible.add(String(u.user_id))
    }

    const unlocked = new Set<string>()
    for (const u of users) {
      const id = String(u.user_id)
      if (!eligible.has(id)) continue
      const r = hash01(`${id}|${mult}|${requiredPoints}|${unlockRatePct}`)
      if (r < unlockRate) unlocked.add(id)
    }

    return {
      eligibleCount: eligible.size,
      eligiblePct: totalUsers ? eligible.size / totalUsers : 0,
      unlockedCount: unlocked.size,
      unlockedPct: totalUsers ? unlocked.size / totalUsers : 0,
    }
  }

  const before = computeReach(1)
  const after = computeReach(pointsMultiplier)

  const avgPoints = users.reduce((s, u) => s + (Number(u?.trader_points ?? 0) || 0), 0) / (users.length || 1)
  const avgPointsSim = avgPoints * pointsMultiplier

  const baseRetention = Number(simulation.baseline.retention)
  const scRetention = Number(simulation.sim.retention)
  const uplift = scRetention - baseRetention

  const perUnlockedUplift = after.unlockedPct > 0 ? uplift / after.unlockedPct : 0
  const compositionEffect = (after.unlockedPct - before.unlockedPct) * perUnlockedUplift
  const perUserEffect = before.unlockedPct * perUnlockedUplift

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-200">{t('traderPoints.impact.whereRetentionTitle')}</div>
          <div className="mt-1 text-[11px] text-slate-400">{t('traderPoints.impact.micro')}</div>
        </div>
        <InfoTooltip
          label={t('traderPoints.impact.howCalc.label')}
          content={
            <div>
              <div className="font-semibold text-slate-100">{t('traderPoints.impact.howCalc.title')}</div>
              <div className="mt-2">{t('traderPoints.impact.howCalc.step1')}</div>
              <div className="mt-1">{t('traderPoints.impact.howCalc.step2')}</div>
              <div className="mt-1">{t('traderPoints.impact.howCalc.step3')}</div>
            </div>
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <div className="text-xs font-extrabold tracking-wide uppercase text-slate-300">{t('traderPoints.impact.reachability')}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">{t('traderPoints.impact.eligibleUsers')}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">
                {fmtInt(after.eligibleCount)} <span className="text-slate-400 font-semibold">({fmtPct(after.eligiblePct)})</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">{t('traderPoints.impact.eligibleDesc')}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">{t('traderPoints.impact.unlockedUsers')}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">
                {fmtInt(after.unlockedCount)} <span className="text-slate-400 font-semibold">({fmtPct(after.unlockedPct)})</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">{t('traderPoints.impact.unlockedDesc')}</div>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-400">
            {t('traderPoints.impact.definitions')}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <div className="text-xs font-extrabold tracking-wide uppercase text-slate-300">{t('traderPoints.impact.retention')}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">{t('traderPoints.impact.retentionBaseline')}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">
                {fmtDays(baseRetention)} {t('traderPoints.kpi.retention.unit')}
              </div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">{t('traderPoints.impact.retentionScenario')}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">
                {fmtDays(scRetention)} {t('traderPoints.kpi.retention.unit')}
              </div>
            </div>
          </div>

          <div className="mt-2 rounded-lg border border-white/10 bg-slate-900/30 p-2">
            <div className="text-[11px] text-slate-400">{t('traderPoints.impact.retentionUplift')}</div>
            <div className="mt-0.5 text-sm font-bold text-slate-100">
              {fmtSignedDays(uplift)} {t('traderPoints.kpi.retention.unit')}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <div className="text-xs font-extrabold tracking-wide uppercase text-slate-300">{t('traderPoints.impact.whereRetentionTitle')}</div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">{t('traderPoints.impact.compositionTitle')}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">
                {fmtSignedDays(compositionEffect)} {t('traderPoints.kpi.retention.unit')}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">{t('traderPoints.impact.compositionDesc')}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">{t('traderPoints.impact.perUserTitle')}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">
                {fmtSignedDays(perUserEffect)} {t('traderPoints.kpi.retention.unit')}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">{t('traderPoints.impact.perUserDesc')}</div>
            </div>
          </div>
        </div>

        <details className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <summary className="cursor-pointer select-none text-xs font-extrabold tracking-wide uppercase text-slate-300">
            {t('traderPoints.impact.sanity.title')}
          </summary>
          <div className="mt-2 text-[11px] text-slate-400">{t('traderPoints.impact.sanity.note')}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">{t('traderPoints.impact.sanity.avgPointsBefore')}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtInt(avgPoints)}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">{t('traderPoints.impact.sanity.avgPointsAfter')}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtInt(avgPointsSim)}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">{t('traderPoints.impact.sanity.aboveThreshold1x')}</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtPct(before.eligiblePct)}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">
                {t('traderPoints.impact.sanity.aboveThresholdMx', {
                  mult: pointsMultiplier.toFixed(2).replace(/\.00$/, ''),
                })}
              </div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtPct(after.eligiblePct)}</div>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-400">
            {t('traderPoints.impact.sanity.footer')}
          </div>
        </details>
      </div>
    </div>
  )
}
