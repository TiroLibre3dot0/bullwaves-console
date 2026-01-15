function toCsv(rows: any[], columns: string[]) {
  const header = columns.join(',');
  const body = rows.map(r => columns.map(c => JSON.stringify(r[c] ?? '')).join(','));
  return [header, ...body].join('\n');
}

export default function ExportSnapshot({ userAgg, simulation, regression, scenario, baselineMode, baselineLabel }: any) {
  const handleExport = (type: 'csv' | 'json' | 'ppd_csv') => {
    let data = '';
    let filename = '';
    if (type === 'ppd_csv') {
      const rows = Array.isArray((window as any).__tp_rawUsers)
        ? (window as any).__tp_rawUsers
        : (Array.isArray(userAgg) ? userAgg : []);
      const ppdRows = rows
        .filter((r: any) => r && (r.user_id || r.userId) && typeof r.positions_per_day === 'number')
        .map((r: any) => ({
          user_id: r.user_id || r.userId,
          positions_per_day: r.positions_per_day,
          position_count: r.position_count ?? '',
          account_age_days: r.account_age_days ?? '',
          qualified_age_days: r.qualified_age_days ?? '',
          ppd_age_days_used: r.ppd_age_days_used ?? '',
          first_deposit_date: r.first_deposit_date ?? '',
          qualification_date: r.qualification_date ?? '',
          total_deposits: r.total_deposits ?? '',
        }));

      data = toCsv(ppdRows, ['user_id', 'positions_per_day', 'position_count', 'account_age_days', 'qualified_age_days', 'ppd_age_days_used', 'first_deposit_date', 'qualification_date', 'total_deposits']);
      filename = 'working-set-positions-per-day.csv';
    } else if (type === 'csv') {
      const rows = Array.isArray(simulation) ? simulation : userAgg;
      const isUserCentric = Array.isArray(rows) && rows.some((r: any) => r && (r.user_id || typeof r.trader_points === 'number'));

      const meta = {
        baseline_mode: baselineMode ?? (simulation && !Array.isArray(simulation) ? simulation.baselineMode : ''),
        baseline_label: baselineLabel ?? (simulation && !Array.isArray(simulation) ? simulation.baselineLabel : ''),
        scenario_points_multiplier: scenario?.points_multiplier ?? '',
        scenario_required_points_to_unlock: scenario?.required_points_to_unlock ?? '',
        scenario_bonus_amount: scenario?.bonus_amount ?? '',
        scenario_unlock_rate_pct: scenario?.unlock_rate_pct ?? '',
        scenario_risk_guardrail_enabled: scenario?.risk_guardrail_enabled ?? '',
      };

      const classic = simulation && !Array.isArray(simulation) ? simulation.classicBonusAssumptions : null;
      const classicFlat = classic
        ? {
            classic_model: classic.model,
            classic_note: classic.note,
            classic_spike: classic.spike,
            classic_decay_days: classic.decay_days,
            classic_decay_factor_avg: classic.decay_factor_avg,
            classic_retention_cap_days: classic.retention_cap_days,
            classic_engaged_share_raw: classic.engaged_share_raw,
            classic_engaged_share_effective: classic.engaged_share_effective,
            classic_activity_lift: classic.activity_lift,
            classic_risk_lift: classic.risk_lift,
            classic_retention_lift: classic.retention_lift,

            classic_k1: classic.constants.k1,
            classic_k2: classic.constants.k2,
            classic_k3: classic.constants.k3,
            classic_guardrail_engaged_share_multiplier: classic.constants.guardrail_engaged_share_multiplier,
            classic_cap_retention_days: classic.constants.cap_retention_days,
            classic_decay_days_const: classic.constants.decay_days,
          }
        : {};

      const cols = isUserCentric
        ? [
            'user_id',
            'tier',
            'account_age_days',
            'total_volume',
            'position_count',
            'positions_per_day',
            'avg_spread',
            'pnl_total',
            'roi',
            'trader_points',

            // export meta/assumptions for board transparency
            'baseline_mode',
            'baseline_label',
            'scenario_points_multiplier',
            'scenario_required_points_to_unlock',
            'scenario_bonus_amount',
            'scenario_unlock_rate_pct',
            'scenario_risk_guardrail_enabled',
            'classic_model',
            'classic_note',
            'classic_spike',
            'classic_decay_days',
            'classic_decay_factor_avg',
            'classic_retention_cap_days',
            'classic_engaged_share_raw',
            'classic_engaged_share_effective',
            'classic_activity_lift',
            'classic_risk_lift',
            'classic_retention_lift',
            'classic_k1',
            'classic_k2',
            'classic_k3',
            'classic_guardrail_engaged_share_multiplier',
            'classic_cap_retention_days',
            'classic_decay_days_const',
          ]
        : [
            'userId','customerName','trades_count','total_volume','avg_trade_volume','total_lots','unique_symbols','avg_spread','pnl_sum','pnl_volatility','loss_trades_ratio','active_days','points_earned','points_sim','points_gap'
          ];

      const enrichedRows = (rows || []).map((r: any) => ({
        ...r,
        ...meta,
        ...classicFlat,
      }));

      data = toCsv(enrichedRows, cols);
      filename = 'trader-points-simulation.csv';
    } else {
      data = JSON.stringify(
        {
          meta: {
            baseline_mode: baselineMode ?? (simulation && !Array.isArray(simulation) ? simulation.baselineMode : null),
            baseline_label: baselineLabel ?? (simulation && !Array.isArray(simulation) ? simulation.baselineLabel : null),
            scenario: scenario ?? null,
            classic_bonus_assumptions:
              simulation && !Array.isArray(simulation) ? simulation.classicBonusAssumptions ?? null : null,
          },
          userAgg,
          simulation,
          regression,
        },
        null,
        2,
      );
      filename = 'trader-points-simulation.json';
    }
    const blob = new Blob([data], { type: (type === 'csv' || type === 'ppd_csv') ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
      <button onClick={() => handleExport('csv')} className="tab">Esporta snapshot (CSV)</button>
      <button onClick={() => handleExport('json')} className="tab">Esporta snapshot (JSON)</button>
      <button onClick={() => handleExport('ppd_csv')} className="tab">Esporta PPD (CSV)</button>
    </div>
  );
}
