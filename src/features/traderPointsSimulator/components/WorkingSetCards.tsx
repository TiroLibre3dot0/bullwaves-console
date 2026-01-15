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

import InfoTooltip from './InfoTooltip'

export function WorkingSetCards({ stats }: { stats: WorkingSetStats | null }) {
  if (!stats) return null;

  const pct = stats.totalUsers ? (stats.activeUsers / stats.totalUsers) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>Campione attivo</span>
          <InfoTooltip
            label="Regole working set"
            content={
              <div>
                <div className="font-semibold text-slate-100">Filtro utenti attivi</div>
                <div className="mt-1">depositi &gt; 0</div>
                <div>posizioni &gt; 0</div>
                <div>età account &gt; 1 giorno</div>
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
          <span>Posizioni medie (conteggio)</span>
          <InfoTooltip
            label="Info conteggio posizioni"
            content={
              <div>
                <div className="font-semibold text-slate-100">Cosa sono le “posizioni”?</div>
                <div className="mt-1">
                  È la colonna del report con il conteggio posizioni/trade (totale storico), non le “posizioni aperte in questo momento”.
                </div>
              </div>
            }
          />
        </div>
        <div className="mt-1 text-3xl font-black tracking-tight text-slate-100">{stats.avgPositionsCount.toFixed(0)}</div>
        <div className="text-xs text-slate-400 mt-1">Mediana {stats.medianPositionsCount.toFixed(0)}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>Posizioni/giorno (zona mediana)</span>
          <InfoTooltip
            label="Definizioni posizioni/giorno"
            content={
              <div>
                <div className="font-semibold text-slate-100">Posizioni/giorno</div>
                <div className="mt-1">PPD = posizioni / giorniDa(qualifica o primo deposito)</div>
                <div className="mt-2">
                  La “zona mediana” mantiene i valori vicini alla mediana (stile Gauss via MAD σ) per ridurre l’impatto degli outlier.
                </div>
              </div>
            }
          />
        </div>
        <div className="mt-1 text-3xl font-black tracking-tight text-slate-100">{stats.positionsPerDayMedianZoneMean.toFixed(2)}</div>
        <div className="text-xs text-slate-400 mt-1">Tenuti {stats.positionsPerDayMedianZoneKeptPct.toFixed(0)}% · Mediana {stats.positionsPerDayMedian.toFixed(2)}</div>
        <div className="text-xs text-slate-400">Media grezza {stats.avgPositionsPerDayUserMean.toFixed(2)} · Globale {stats.positionsPerDayGlobal.toFixed(2)}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>Lifetime (giorni)</span>
          <InfoTooltip
            label="Definizioni lifetime"
            content={
              <div>
                <div className="font-semibold text-slate-100">Definizioni</div>
                <div className="mt-1">Account lifetime: giorni dalla registrazione.</div>
                <div className="mt-1">Trader lifetime: giorni da qualifica/primo deposito (se disponibile).</div>
              </div>
            }
          />
        </div>
        <div className="mt-1 text-3xl font-black tracking-tight text-slate-100">{stats.avgAccountAgeDays.toFixed(0)}</div>
        <div className="text-xs text-slate-400 mt-1">
          Trader lifetime {stats.avgTraderLifetimeDays.toFixed(0)} · {stats.traderLifetimeAvailablePct.toFixed(0)}% disponibile
        </div>
      </div>
    </div>
  );
}

export default WorkingSetCards;
