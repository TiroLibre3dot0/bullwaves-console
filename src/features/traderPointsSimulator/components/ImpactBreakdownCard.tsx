import InfoTooltip from './InfoTooltip'
import { getUiLang, t } from '../uiCopy'

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

  const lang = getUiLang('it')

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
          <div className="text-sm font-semibold text-slate-200">{t(lang, 'impactWhereRetentionTitle')}</div>
          <div className="mt-1 text-[11px] text-slate-400">Come cambia la retention media quando aumenta la raggiungibilità del goal.</div>
        </div>
        <InfoTooltip
          label="Come si calcola"
          content={
            <div>
              <div className="font-semibold text-slate-100">Come si calcola questo numero</div>
              <div className="mt-2">1) Alcuni utenti raggiungono la soglia obiettivo (idonei).</div>
              <div className="mt-1">2) Una quota degli idonei entra nel percorso a obiettivo (tasso di sblocco).</div>
              <div className="mt-1">3) La retention media cresce soprattutto perché più utenti partecipano al percorso a obiettivo, non perché gli utenti diventano più “intensi” o assumono più rischio.</div>
            </div>
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <div className="text-xs font-extrabold tracking-wide uppercase text-slate-300">Raggiungibilità</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Utenti idonei</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">
                {fmtInt(after.eligibleCount)} <span className="text-slate-400 font-semibold">({fmtPct(after.eligiblePct)})</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">Raggiungono la soglia obiettivo alla velocità attuale.</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Utenti sbloccati</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">
                {fmtInt(after.unlockedCount)} <span className="text-slate-400 font-semibold">({fmtPct(after.unlockedPct)})</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">Entrano nel percorso a obiettivo.</div>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-400">
            Definizioni: idonei = raggiungono la soglia. sbloccati = idonei che entrano nel percorso a obiettivo (tasso di sblocco).
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <div className="text-xs font-extrabold tracking-wide uppercase text-slate-300">Retenzione</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Retention media (baseline)</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtDays(baseRetention)} giorni</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Retention media (scenario)</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtDays(scRetention)} giorni</div>
            </div>
          </div>

          <div className="mt-2 rounded-lg border border-white/10 bg-slate-900/30 p-2">
            <div className="text-[11px] text-slate-400">Aumento retention media</div>
            <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtSignedDays(uplift)} giorni</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <div className="text-xs font-extrabold tracking-wide uppercase text-slate-300">{t(lang, 'impactWhereRetentionTitle')}</div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Aumento da quota sbloccati (effetto composizione)</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtSignedDays(compositionEffect)} giorni</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Con più velocità, più utenti entrano nel percorso a obiettivo.</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Aumento sugli utenti già sbloccati (effetto per-utente)</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtSignedDays(perUserEffect)} giorni</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Gli utenti che avrebbero sbloccato anche a ×1 si sentono comunque più vicini al completamento.</div>
            </div>
          </div>
        </div>

        <details className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <summary className="cursor-pointer select-none text-xs font-extrabold tracking-wide uppercase text-slate-300">
            {t(lang, 'impactSanityTitle')}
          </summary>
          <div className="mt-2 text-[11px] text-slate-400">{t(lang, 'impactSanityNote')}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Punti medi (prima)</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtInt(avgPoints)}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Punti medi (dopo)</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtInt(avgPointsSim)}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Sopra soglia (×1)</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtPct(before.eligiblePct)}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
              <div className="text-[11px] text-slate-400">Sopra soglia (×{pointsMultiplier.toFixed(2).replace(/\.00$/, '')})</div>
              <div className="mt-0.5 text-sm font-bold text-slate-100">{fmtPct(after.eligiblePct)}</div>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-400">
            Prima/dopo usano la stessa soglia e lo stesso tasso di sblocco; cambia solo la raggiungibilità del goal.
          </div>
        </details>
      </div>
    </div>
  )
}
