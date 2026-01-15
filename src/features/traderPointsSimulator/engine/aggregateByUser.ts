import { mean, std } from './mathUtils';

export function aggregateByUser(trades: any[]) {
  const users: Record<string, any[]> = {};
  trades.forEach((t) => {
    if (!users[t['User ID']]) users[t['User ID']] = [];
    users[t['User ID']].push(t);
  });
  return Object.entries(users).map(([userId, trades]) => {
    const volumes = trades.map((t) => parseFloat(t.Volume) || 0);
    const lots = trades.map((t) => parseFloat(t['LOT Amount']) || 0);
    const spreads = trades.map((t) => parseFloat(t.Spread) || 0);
    const pls = trades.map((t) => parseFloat(t.PL) || 0);
    const points = trades.map((t) => t.tradePoints || 0);
    const dates = Array.from(new Set(trades.map((t) => t['External Date']?.split(' ')[0])));
    const symbols = Array.from(new Set(trades.map((t) => t.Symbol)));
    const lossTrades = pls.filter((pl) => pl < 0).length;
    return {
      userId,
      customerName: trades[0]['Customer Name'],
      trades_count: trades.length,
      total_volume: volumes.reduce((a, b) => a + b, 0),
      avg_trade_volume: mean(volumes),
      total_lots: lots.reduce((a, b) => a + b, 0),
      unique_symbols: symbols.length,
      avg_spread: mean(spreads),
      pnl_sum: pls.reduce((a, b) => a + b, 0),
      pnl_volatility: std(pls),
      loss_trades_ratio: trades.length ? lossTrades / trades.length : 0,
      active_days: dates.length,
      points_earned: points.reduce((a, b) => a + b, 0),
      _trades: trades,
    };
  });
}
