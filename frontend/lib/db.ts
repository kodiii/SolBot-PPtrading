export interface Balance {
  balance_sol: string;
  updated_at: number;
}

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
}

export interface Trade {
  token_name: string;
  token_mint: string;
  amount_sol: string;
  amount_token: string;
  buy_price: string;
  buy_fees: string;
  buy_slippage: string;
  sell_price: string | null;
  sell_fees: string | null;
  time_buy: number;
  time_sell: number | null;
  pnl: string | null;
  volume_m5: string;
  market_cap: string;
  liquidity_buy_usd: string;
  liquidity_sell_usd: string;
}

export interface TradingStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: string;
  winRate: number;
}
