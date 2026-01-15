import { UserData } from '../data/getUsersData';

export interface UserFeatures {
  user_id: string;
  customer_name?: string;
  email?: string;
  mt5_account?: string;
  trader_points: number;
  total_volume: number;
  account_age_days: number;
  position_count: number;
  positions_per_day: number;
  tier: 'low' | 'medium' | 'high';
  avg_spread: number;
  pnl_total: number;
  roi: number;
}

export function buildUserFeatures(users: Array<UserData & { trader_points: number }>): UserFeatures[] {
  return users.map(u => ({
    user_id: u.user_id,
    customer_name: u.customer_name,
    email: u.email,
    mt5_account: u.mt5_account,
    trader_points: u.trader_points,
    total_volume: u.total_volume,
    account_age_days: u.account_age_days,
    position_count: u.position_count,
    positions_per_day: u.positions_per_day,
    tier: u.tier,
    avg_spread: u.avg_spread,
    pnl_total: u.pnl_total,
    roi: u.roi,
  }));
}
