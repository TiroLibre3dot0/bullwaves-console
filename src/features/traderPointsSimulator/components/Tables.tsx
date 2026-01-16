import InfoTooltip from './InfoTooltip'
import { useI18n } from '../../../i18n/I18nContext.ts'

function pointsValue(u: any): number {
  const v = u?.trader_points ?? u?.points_earned ?? u?.traderPoints ?? u?.points ?? 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function userLabel(u: any, unknownLabel: string): string {
  const id = u?.customer_name || u?.customername || u?.customerName || u?.name || u?.full_name || u?.fullName || u?.email
  if (typeof id === 'string' && id.trim()) return id
  const first = typeof u?.first_name === 'string' ? u.first_name.trim() : ''
  const last = typeof u?.last_name === 'string' ? u.last_name.trim() : ''
  const full = `${first} ${last}`.trim()
  if (full) return full
  return unknownLabel
}

function userId(u: any): string {
  return String(u?.user_id || u?.userId || u?.userid || u?.account_id || '').trim()
}

function userMeta(u: any, idPrefix: string): string {
  const id = userId(u)
  return id ? `${idPrefix} ${id}` : ''
}

function symbolBadge(symbol: string) {
  const base = "inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-slate-900/60 text-[11px] font-semibold text-slate-200"
  if (symbol === 'XAUUSD') return <span className={`${base}`}>Au</span>
  if (symbol === 'BTCUSD') return <span className={`${base}`}>₿</span>
  if (symbol === 'EURUSD') return <span className={`${base}`}>€$</span>
  if (symbol === 'GBPUSD') return <span className={`${base}`}>£$</span>
  if (symbol === 'USDJPY') return <span className={`${base}`}>¥$</span>
  return <span className={`${base}`}>{symbol.slice(0, 2)}</span>
}

export default function Tables({ userAgg }: any) {
  const { t } = useI18n()

  if (!userAgg?.length) return null;

  // Requirement: show only users with at least 1 trade.
  // In this dataset, trade count is represented by position_count.
  const usersWithTrades = (userAgg as any[]).filter((u: any) => (u?.position_count ?? 0) >= 1)
  if (!usersWithTrades.length) return null;

  // Prefer selecting low-users among those with >0 points to avoid confusing “0 points” rows.
  // Points can be floored to 0 due to bot penalty or extremely low normalized metrics.
  const usersWithPositivePoints = usersWithTrades.filter((u: any) => pointsValue(u) > 0)
  const lowPool = usersWithPositivePoints.length ? usersWithPositivePoints : usersWithTrades

  // If we have per-trade data, use legacy symbol aggregation.
  const hasTrades = userAgg.some((u: any) => Array.isArray(u._trades));

  // Symbol exposure is modeled at market level, not individual user level.
  // In user-centric mode we use a global distribution (mocked here; wire to reports later).
  const globalTopSymbols: Array<[string, number]> = [
    ['EURUSD', 0.18],
    ['XAUUSD', 0.14],
    ['GBPUSD', 0.10],
    ['USDJPY', 0.08],
    ['BTCUSD', 0.06],
  ];

  const topSymbols = (() => {
    if (!hasTrades) return globalTopSymbols;
    const symbolMap: Record<string, number> = {};
    userAgg.forEach((u: any) => (u._trades || []).forEach((t: any) => {
      const sym = t.Symbol;
      const vol = parseFloat(t.Volume) || 0;
      symbolMap[sym] = (symbolMap[sym] || 0) + vol;
    }));
    const total = Object.values(symbolMap).reduce((a, v) => a + v, 0) || 1;
    return Object.entries(symbolMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sym, vol]) => [sym, vol / total] as [string, number]);
  })();

  const sortedByPointsDesc = [...usersWithTrades].sort((a: any, b: any) => {
    const dp = pointsValue(b) - pointsValue(a)
    if (dp !== 0) return dp
    const dt = (b?.position_count ?? 0) - (a?.position_count ?? 0)
    if (dt !== 0) return dt
    const dd = (b?.total_deposits ?? 0) - (a?.total_deposits ?? 0)
    if (dd !== 0) return dd
    const dv = (b?.total_volume ?? 0) - (a?.total_volume ?? 0)
    if (dv !== 0) return dv
    return userId(a).localeCompare(userId(b))
  })

  const sortedByPointsAsc = [...lowPool].sort((a: any, b: any) => {
    const dp = pointsValue(a) - pointsValue(b)
    if (dp !== 0) return dp
    const dt = (a?.position_count ?? 0) - (b?.position_count ?? 0)
    if (dt !== 0) return dt
    const dd = (a?.total_deposits ?? 0) - (b?.total_deposits ?? 0)
    if (dd !== 0) return dd
    const dv = (a?.total_volume ?? 0) - (b?.total_volume ?? 0)
    if (dv !== 0) return dv
    return userId(a).localeCompare(userId(b))
  })

  const topUsers = sortedByPointsDesc.slice(0, 5)
  const topIds = new Set(topUsers.map((u: any) => userId(u)).filter(Boolean))
  const lowUsers = sortedByPointsAsc.filter((u: any) => !topIds.has(userId(u))).slice(0, 5)

  const topTrades = [...usersWithTrades]
    .sort((a: any, b: any) => {
      const dt = (b?.position_count ?? 0) - (a?.position_count ?? 0)
      if (dt !== 0) return dt
      const dp = pointsValue(b) - pointsValue(a)
      if (dp !== 0) return dp
      const dd = (b?.total_deposits ?? 0) - (a?.total_deposits ?? 0)
      if (dd !== 0) return dd
      return userId(a).localeCompare(userId(b))
    })
    .slice(0, 5)

  const totalPoints = usersWithTrades.reduce((a: number, u: any) => a + pointsValue(u), 0) || 0

  const unknownUser = t('traderPoints.tables.unknownUser')
  const idPrefix = t('traderPoints.tables.idPrefix')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-200">{t('traderPoints.tables.symbolsTop')}</div>
          <InfoTooltip
            label={t('traderPoints.tables.symbolsTooltip.label')}
            content={
              <div>
                <div className="font-semibold text-slate-100">{t('traderPoints.tables.symbolsTooltip.title')}</div>
                <div className="mt-1">{t('traderPoints.tables.symbolsTooltip.line1')}</div>
                <div className="mt-2">{t('traderPoints.tables.symbolsTooltip.line2')}</div>
              </div>
            }
          />
        </div>

        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400">
              <th className="py-2 text-left font-semibold">{t('traderPoints.tables.col.symbol')}</th>
              <th className="py-2 text-right font-semibold">{t('traderPoints.tables.col.weight')}</th>
              <th className="py-2 text-right font-semibold">{t('traderPoints.tables.col.estimatedPoints')}</th>
            </tr>
          </thead>
          <tbody>
            {topSymbols.map(([sym, vol]) => (
              <tr key={sym} className="border-t border-white/5 hover:bg-white/5">
                <td className="py-1.5">
                  <div className="flex items-center gap-2">
                    {symbolBadge(sym)}
                    <div className="font-medium text-slate-100">{sym}</div>
                  </div>
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-200">{`${(vol * 100).toFixed(1)}%`}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-100 font-semibold">{Math.round(totalPoints * vol).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-200">{t('traderPoints.tables.usersTop')}</div>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400">
              <th className="py-2 text-left font-semibold">{t('traderPoints.tables.col.user')}</th>
              <th className="py-2 text-right font-semibold">{t('traderPoints.tables.col.positions')}</th>
              <th className="py-2 text-right font-semibold">{t('traderPoints.tables.col.points')}</th>
            </tr>
          </thead>
          <tbody>
            {topUsers.map((u: any) => (
              <tr key={userId(u)} className="border-t border-white/5 hover:bg-white/5">
                <td className="py-1.5">
                  <div className="truncate max-w-[260px] font-semibold text-slate-100">{userLabel(u, unknownUser)}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[260px]">{userMeta(u, idPrefix) || '—'}</div>
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-200">{Number(u?.position_count ?? 0).toLocaleString()}</td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-slate-100">{Math.round(pointsValue(u)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-200">{t('traderPoints.tables.topByPositions')}</div>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400">
              <th className="py-2 text-left font-semibold">{t('traderPoints.tables.col.user')}</th>
              <th className="py-2 text-right font-semibold">{t('traderPoints.tables.col.positions')}</th>
              <th className="py-2 text-right font-semibold">{t('traderPoints.tables.col.points')}</th>
            </tr>
          </thead>
          <tbody>
            {topTrades.map((u: any) => (
              <tr key={userId(u)} className="border-t border-white/5 hover:bg-white/5">
                <td className="py-1.5">
                  <div className="truncate max-w-[260px] font-semibold text-slate-100">{userLabel(u, unknownUser)}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[260px]">{userMeta(u, idPrefix) || '—'}</div>
                </td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-slate-100">{Number(u?.position_count ?? 0).toLocaleString()}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-200">{Math.round(pointsValue(u)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-200">{t('traderPoints.tables.usersLow')}</div>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400">
              <th className="py-2 text-left font-semibold">{t('traderPoints.tables.col.user')}</th>
              <th className="py-2 text-right font-semibold">{t('traderPoints.tables.col.positions')}</th>
              <th className="py-2 text-right font-semibold">{t('traderPoints.tables.col.points')}</th>
            </tr>
          </thead>
          <tbody>
            {lowUsers.map((u: any) => (
              <tr key={userId(u)} className="border-t border-white/5 hover:bg-white/5">
                <td className="py-1.5">
                  <div className="truncate max-w-[260px] font-semibold text-slate-100">{userLabel(u, unknownUser)}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[260px]">{userMeta(u, idPrefix) || '—'}</div>
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-200">{Number(u?.position_count ?? 0).toLocaleString()}</td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-slate-100">
                  {Math.round(pointsValue(u)).toLocaleString()}
                  {pointsValue(u) <= 0 && (
                    <span className="ml-1 text-[10px] text-slate-400">{t('traderPoints.tables.pointsFloored')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
