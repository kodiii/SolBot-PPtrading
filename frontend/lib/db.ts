import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

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

let dbPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    console.log('Opening database...');
    dbPromise = open({
      filename: './src/papertrading/db/paper_trading.db',
      mode: sqlite3.OPEN_READONLY,
      driver: sqlite3.Database
    }).catch((err) => {
      console.error('Failed to open database:', err);
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function getBalance(): Promise<Balance | undefined> {
  console.log('Getting balance...');
  const db = await getDb();
  try {
    const result = await db.get<Balance>(`
      SELECT balance_sol, updated_at 
      FROM virtual_balance 
      ORDER BY id DESC 
      LIMIT 1
    `);
    console.log('Balance result:', result);
    return result;
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
}

export async function getPositions(): Promise<Position[]> {
  console.log('Getting positions...');
  const db = await getDb();
  try {
    const results = await db.all<Position[]>(`
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
    console.log('Positions count:', results?.length);
    return results;
  } catch (error) {
    console.error('Error getting positions:', error);
    throw error;
  }
}

export async function getTrades(limit = 10): Promise<Trade[]> {
  console.log('Getting trades...');
  const db = await getDb();
  try {
    const results = await db.all<Trade[]>(`
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
    console.log('Trades count:', results?.length);
    return results;
  } catch (error) {
    console.error('Error getting trades:', error);
    throw error;
  }
}

export async function getStats(): Promise<TradingStats | null> {
  console.log('Getting stats...');
  const db = await getDb();
  try {
    const stats = await db.get<{ totalTrades: number; successfulTrades: number; totalPnL: string; }>(`
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

    console.log('Stats:', { ...stats, winRate });
    return {
      ...stats,
      winRate,
      failedTrades: stats.totalTrades - stats.successfulTrades
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}
