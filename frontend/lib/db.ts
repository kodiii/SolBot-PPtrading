import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

interface Balance {
  balance_sol: string;
  updated_at: number;
}

interface Position {
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

interface Trade {
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

interface TradingStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: string;
  winRate: number;
}

let db: Database | null = null;

/**
 * Initialize database connection
 */
async function getDb(): Promise<Database> {
  if (db) return db;
  
  db = await open({
    filename: process.cwd() + '/../src/papertrading/db/paper_trading.db',
    driver: sqlite3.Database
  });
  
  return db;
}

/**
 * Get current virtual balance
 */
export async function getBalance(): Promise<Balance | undefined> {
  const db = await getDb();
  return db.get(`
    SELECT balance_sol, updated_at 
    FROM virtual_balance 
    ORDER BY id DESC 
    LIMIT 1
  `);
}

/**
 * Get active trading positions
 */
export async function getPositions(): Promise<Position[]> {
  const db = await getDb();
  return db.all(`
    SELECT 
      token_mint,
      token_name,
      amount,
      buy_price,
      current_price,
      stop_loss,
      take_profit,
      position_size_sol,
      last_updated
    FROM token_tracking
  `);
}

/**
 * Get recent trades with limit
 */
export async function getTrades(limit = 10): Promise<Trade[]> {
  const db = await getDb();
  return db.all(`
    SELECT 
      token_name,
      token_mint,
      amount_sol,
      amount_token,
      buy_price,
      buy_fees,
      buy_slippage,
      sell_price,
      sell_fees,
      time_buy,
      time_sell,
      pnl,
      volume_m5,
      market_cap,
      liquidity_buy_usd,
      liquidity_sell_usd
    FROM simulated_trades
    ORDER BY time_buy DESC
    LIMIT ?
  `, limit);
}

/**
 * Get trading statistics
 */
export async function getStats(): Promise<TradingStats | null> {
  const db = await getDb();
  const stats = await db.get(`
    SELECT 
      COUNT(*) as totalTrades,
      SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as successfulTrades,
      SUM(CASE WHEN pnl IS NOT NULL THEN pnl ELSE 0 END) as totalPnL
    FROM simulated_trades 
    WHERE sell_price IS NOT NULL
  `);

  if (!stats) return null;

  const winRate = stats.totalTrades > 0 
    ? (stats.successfulTrades / stats.totalTrades) * 100 
    : 0;

  return {
    ...stats,
    winRate,
    failedTrades: stats.totalTrades - stats.successfulTrades
  };
}
