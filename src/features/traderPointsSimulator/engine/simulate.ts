// Scenario simulation logic
export function simulateScenario(userAgg: any[], scenario: any) {
  const points_multiplier = scenario.points_multiplier ?? 1.0;
  const required_points = scenario.required_points_to_unlock ?? 2000;
  // Simulate points
  return userAgg.map((u) => {
    const points_sim = u.points_earned * points_multiplier;
    const points_gap = Math.max(required_points - points_sim, 0);
    // For now, just copy baseline (no ML prediction)
    return {
      ...u,
      points_sim,
      points_gap,
      trades_count_sim: u.trades_count, // placeholder
      pnl_volatility_sim: u.pnl_volatility, // placeholder
      active_days_sim: u.active_days, // placeholder
      delta_trades: 0,
      delta_volatility: 0,
      delta_days: 0,
    };
  });
}
