import InfoTooltip from './InfoTooltip'

export default function RegressionSummary({ regression }: any) {
  if (!regression) return null;

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
    if (n === null) return 'Segnale basso — solo direzione impatto'
    if (n < 0.2) return 'Debole'
    if (n < 0.5) return 'Medio'
    return 'Forte'
  }

  const maeText = (metric: 'activity' | 'risk' | 'retention') => {
    const mae = regression?.[metric]?.mae
    const n = Number(mae)
    if (!Number.isFinite(n)) return '—'
    if (metric === 'activity') return `±${n.toFixed(2)} trade/giorno`
    if (metric === 'retention') return `±${Math.round(n).toLocaleString()} giorni`
    return `±${n.toFixed(2)} unità di rischio`
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
        <div className="text-sm font-semibold text-slate-200">Affidabilità del segnale (direzionale)</div>
        <InfoTooltip
          label="Affidabilità del segnale"
          content={
            <div>
              <div className="font-semibold text-slate-100">Affidabilità del segnale (direzionale)</div>
              <div className="mt-1">Queste stime servono per direzione e impatto relativo, non per una previsione puntuale.</div>
              <div className="mt-3 border-t border-white/10 pt-2 text-[11px] text-slate-400">Supporto decisionale — non stima sul singolo utente.</div>
            </div>
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <div className="text-xs font-semibold text-slate-400">Attività</div>
          <div className="mt-1 flex items-center justify-between text-sm text-slate-200">
            <span className="text-slate-400">R²</span>
            <span className="font-semibold text-slate-100">{fmtR2(regression.activity.r2)}</span>
          </div>
          <div className={`mt-1 h-1 w-12 rounded-full ${r2Tone(regression.activity.r2)}`} />
          <div className="mt-1 text-[11px] text-slate-400">{r2Label(regression.activity.r2)}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-slate-200">
            <span className="text-slate-400">MAE</span>
            <span className="font-semibold text-slate-100">{fmt(regression.activity.mae)}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Errore medio (unità reali): {maeText('activity')}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <div className="text-xs font-semibold text-slate-400">Rischio</div>
          <div className="mt-1 flex items-center justify-between text-sm text-slate-200">
            <span className="text-slate-400">R²</span>
            <span className="font-semibold text-slate-100">{fmtR2(regression.risk.r2)}</span>
          </div>
          <div className={`mt-1 h-1 w-12 rounded-full ${r2Tone(regression.risk.r2)}`} />
          <div className="mt-1 text-[11px] text-slate-400">{r2Label(regression.risk.r2)}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-slate-200">
            <span className="text-slate-400">MAE</span>
            <span className="font-semibold text-slate-100">{fmt(regression.risk.mae)}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Errore medio (unità reali): {maeText('risk')}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <div className="text-xs font-semibold text-slate-400">Retenzione</div>
          <div className="mt-1 flex items-center justify-between text-sm text-slate-200">
            <span className="text-slate-400">R²</span>
            <span className="font-semibold text-slate-100">{fmtR2(regression.retention.r2)}</span>
          </div>
          <div className={`mt-1 h-1 w-12 rounded-full ${r2Tone(regression.retention.r2)}`} />
          <div className="mt-1 text-[11px] text-slate-400">{r2Label(regression.retention.r2)}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-slate-200">
            <span className="text-slate-400">MAE</span>
            <span className="font-semibold text-slate-100">{fmt(regression.retention.mae)}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Errore medio (unità reali): {maeText('retention')}</div>
        </div>
      </div>
    </div>
  );
}
