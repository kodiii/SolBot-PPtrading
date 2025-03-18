/**
 * Virtual balance record
 */
export interface Balance {
  balance_sol: string;
  updated_at: number;
}

/**
 * Active trading position
 */
export interface Position {
  token_mint: string;
  token_name: string;
  amount: string;
  buy_price: string;
  current_price: string;
  stop_loss: string;
  take_profit: string;
  position_size_sol: string;
  last_updated: number;
  volume_m5: string | null;
  market_cap: string | null;
  liquidity_usd: string | null;
}

/**
 * Trade record
 */
export interface Trade {
  token_name: string;
  token_mint: string;
  amount_sol: string;
  amount_token: string;
  buy_price: string;
  buy_fees: string;
  buy_slippage: string;
  sell_price?: string;
  sell_fees?: string;
  sell_slippage?: string;
  time_buy: number;
  time_sell?: number;
  pnl?: string;
  volume_m5?: string | null;
  market_cap: string | null;
  liquidity_buy_usd: string | null;
  liquidity_sell_usd?: string | null;
}

/**
 * Trading statistics
 */
export interface Stats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: string;
  winRate: number;
}

/**
 * Dashboard API response
 */
export interface DashboardData {
  balance: Balance;
  positions: Position[];
  trades: Trade[];
  recentTrades?: Trade[]; // Limited number of trades for charts
  stats: Stats;
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  details?: string;
}
