import * as sqlite3 from "sqlite3";
import { ConnectionManager } from "./db/connection_manager";
import { config } from "../config";
import { Decimal } from "../utils/decimal";

const DB_PATH = "src/tracker/paper_trading.db";

interface VirtualBalance {
  balance_sol: Decimal;
  updated_at: number;
}

interface SimulatedTrade {
  timestamp: number;
  token_mint: string;
  token_name: string;
  amount_sol: Decimal;
  amount_token: Decimal;
  price_per_token: Decimal;
  type: 'buy' | 'sell';
  fees: Decimal;
}

interface TokenTracking {
  token_mint: string;
  token_name: string;
  amount: Decimal;
  buy_price: Decimal;
  current_price: Decimal;
  last_updated: number;
  stop_loss: Decimal;
  take_profit: Decimal;
}

// Create tables with REAL type for decimal storage
export async function initializePaperTradingDB(): Promise<boolean> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    await connectionManager.initialize();
    const db = await connectionManager.getConnection();

    // Virtual balance table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS virtual_balance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        balance_sol TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Simulated trades table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS simulated_trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        token_mint TEXT NOT NULL,
        token_name TEXT NOT NULL,
        amount_sol TEXT NOT NULL,
        amount_token TEXT NOT NULL,
        price_per_token TEXT NOT NULL,
        type TEXT NOT NULL,
        fees TEXT NOT NULL
      );
    `);

    // Token tracking table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS token_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_mint TEXT UNIQUE NOT NULL,
        token_name TEXT NOT NULL,
        amount TEXT NOT NULL,
        buy_price TEXT NOT NULL,
        current_price TEXT NOT NULL,
        last_updated INTEGER NOT NULL,
        stop_loss TEXT NOT NULL,
        take_profit TEXT NOT NULL
      );
    `);

    // Get current balance
    const balance = await db.get('SELECT * FROM virtual_balance ORDER BY id DESC LIMIT 1');
    
    // Initialize or update balance if it doesn't match config
    if (!balance || new Decimal(balance.balance_sol).toString() !== new Decimal(config.paper_trading.initial_balance).toString()) {
      await db.run(
        'INSERT INTO virtual_balance (balance_sol, updated_at) VALUES (?, ?)',
        [new Decimal(config.paper_trading.initial_balance).toString(), Date.now()]
      );
      console.log(`🎮 Paper Trading balance set to ${config.paper_trading.initial_balance} SOL`);
    }

    connectionManager.releaseConnection(db);
    return true;
  } catch (error) {
    console.error('Error initializing paper trading database:', error);
    return false;
  }
}

export async function getVirtualBalance(): Promise<VirtualBalance | null> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    const db = await connectionManager.getConnection();
    const balance = await db.get('SELECT * FROM virtual_balance ORDER BY id DESC LIMIT 1');
    connectionManager.releaseConnection(db);
    return balance ? {
      balance_sol: new Decimal(balance.balance_sol),
      updated_at: balance.updated_at
    } : null;
  } catch (error) {
    console.error('Error getting virtual balance:', error);
    return null;
  }
}

export async function recordSimulatedTrade(trade: SimulatedTrade): Promise<boolean> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    const db = await connectionManager.getConnection();

    await connectionManager.transaction(async (transaction) => {
      await db.run(
        `INSERT INTO simulated_trades (timestamp, token_mint, token_name, amount_sol, amount_token, price_per_token, type, fees)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trade.timestamp,
          trade.token_mint,
          trade.token_name,
          trade.amount_sol.toString(),
          trade.amount_token.toString(),
          trade.price_per_token.toString(),
          trade.type,
          trade.fees.toString()
        ]
      );

      // Update virtual balance
      const currentBalance = await getVirtualBalance();
      if (currentBalance) {
        const newBalance = trade.type === 'buy' 
          ? currentBalance.balance_sol.subtract(trade.amount_sol.add(trade.fees))
          : currentBalance.balance_sol.add(trade.amount_sol.subtract(trade.fees));

        await db.run(
          'INSERT INTO virtual_balance (balance_sol, updated_at) VALUES (?, ?)',
          [newBalance.toString(), Date.now()]
        );
      }

      // Update token tracking
      if (trade.type === 'buy') {
        const stopLossPrice = trade.price_per_token.multiply(new Decimal(1).subtract(new Decimal(config.sell.stop_loss_percent).divide(100)));
        const takeProfitPrice = trade.price_per_token.multiply(new Decimal(1).add(new Decimal(config.sell.take_profit_percent).divide(100)));

        await db.run(
          `INSERT INTO token_tracking 
           (token_mint, token_name, amount, buy_price, current_price, last_updated, stop_loss, take_profit)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(token_mint) DO UPDATE SET
           amount = amount + ?,
           current_price = ?,
           last_updated = ?`,
          [
            trade.token_mint,
            trade.token_name,
            trade.amount_token.toString(),
            trade.price_per_token.toString(),
            trade.price_per_token.toString(),
            trade.timestamp,
            stopLossPrice.toString(),
            takeProfitPrice.toString(),
            trade.amount_token.toString(),
            trade.price_per_token.toString(),
            trade.timestamp
          ]
        );
      } else {
        await db.run('DELETE FROM token_tracking WHERE token_mint = ?', [trade.token_mint]);
      }
    });

    connectionManager.releaseConnection(db);
    return true;
  } catch (error) {
    console.error('Error recording simulated trade:', error);
    return false;
  }
}

export async function updateTokenPrice(tokenMint: string, currentPrice: Decimal): Promise<TokenTracking | null> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    const db = await connectionManager.getConnection();
    
    await db.run(
      `UPDATE token_tracking 
       SET current_price = ?, last_updated = ?
       WHERE token_mint = ?`,
      [currentPrice.toString(), Date.now(), tokenMint]
    );

    const token = await db.get(
      'SELECT * FROM token_tracking WHERE token_mint = ?',
      [tokenMint]
    );

    connectionManager.releaseConnection(db);
    
    return token ? {
      ...token,
      amount: new Decimal(token.amount),
      buy_price: new Decimal(token.buy_price),
      current_price: new Decimal(token.current_price),
      stop_loss: new Decimal(token.stop_loss),
      take_profit: new Decimal(token.take_profit)
    } : null;
  } catch (error) {
    console.error('Error updating token price:', error);
    return null;
  }
}

export async function getTrackedTokens(): Promise<TokenTracking[]> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    const db = await connectionManager.getConnection();
    const tokens = await db.all('SELECT * FROM token_tracking');
    connectionManager.releaseConnection(db);
    
    return tokens.map(token => ({
      ...token,
      amount: new Decimal(token.amount),
      buy_price: new Decimal(token.buy_price),
      current_price: new Decimal(token.current_price),
      stop_loss: new Decimal(token.stop_loss),
      take_profit: new Decimal(token.take_profit)
    }));
  } catch (error) {
    console.error('Error getting tracked tokens:', error);
    return [];
  }
}