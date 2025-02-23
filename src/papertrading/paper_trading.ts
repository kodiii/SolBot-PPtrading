/**
 * Paper Trading System for Solana Tokens
 * 
 * This module implements a paper trading system that simulates trading of Solana tokens
 * without using real funds. It maintains virtual balances, tracks positions, and records
 * simulated trades in a SQLite database.
 * 
 * Key features:
 * - Virtual balance management in SOL
 * - Trade simulation (buy/sell) with fee tracking
 * - Position tracking with stop-loss and take-profit targets
 * - Historical trade recording
 */

import { ConnectionManager } from "./db/connection_manager";
import { config } from "../config";
import { Decimal } from "../utils/decimal";

const DB_PATH = "src/papertrading/db/paper_trading.db";

/**
 * Represents the virtual balance in the paper trading system
 * @interface VirtualBalance
 * @property {Decimal} balance_sol - Current balance in SOL
 * @property {number} updated_at - Timestamp of last balance update
 */
interface VirtualBalance {
  balance_sol: Decimal;
  updated_at: number;
}

/**
 * Represents a simulated trade in the paper trading system
 * @interface SimulatedTrade
 * @property {number} timestamp - When the trade was executed
 * @property {string} token_mint - Token's mint address
 * @property {string} token_name - Human-readable token name
 * @property {Decimal} amount_sol - Trade amount in SOL
 * @property {Decimal} amount_token - Amount of tokens traded
 * @property {Decimal} price_per_token - Execution price per token
 * @property {'buy' | 'sell'} type - Trade direction
 * @property {Decimal} fees - Transaction fees in SOL
 * @property {Decimal} slippage - Price slippage percentage
 * @property {DexScreenerData} [dex_data] - Optional market data from DEX
 */
interface SimulatedTrade {
  token_name: string;
  token_mint: string;
  amount_sol: Decimal;
  amount_token: Decimal;
  buy_price: Decimal;
  buy_fees: Decimal;
  buy_slippage: Decimal;
  sell_price?: Decimal;
  sell_fees?: Decimal;
  sell_slippage?: Decimal;
  time_buy: number;
  time_sell?: number;
  dex_data?: {
    volume_m5?: number;
    marketCap?: number;
    liquidity_buy_usd?: number;
    liquidity_sell_usd?: number;
  };
}

/**
 * Represents a tracked token position with risk management parameters
 * @interface TokenTracking
 * @property {string} token_mint - Token's mint address
 * @property {string} token_name - Human-readable token name
 * @property {Decimal} amount - Current position size
 * @property {Decimal} buy_price - Average entry price
 * @property {Decimal} current_price - Latest market price
 * @property {number} last_updated - Timestamp of last price update
 * @property {Decimal} stop_loss - Stop loss price level
 * @property {Decimal} take_profit - Take profit price level
 */
export interface TokenTracking {
  token_mint: string;
  token_name: string;
  amount: Decimal;
  buy_price: Decimal;
  buy_fees: Decimal;
  buy_slippage: Decimal;
  time_buy: number;
  current_price: Decimal;
  last_updated: number;
  stop_loss: Decimal;
  take_profit: Decimal;
  volume_m5?: number;
  market_cap?: number;
  liquidity_buy_usd?: number;
  liquidity_sell_usd?: number;
  position_size_sol?: Decimal;
}

/**
 * Initializes the paper trading database by creating necessary tables and setting initial balance
 * Creates three tables:
 * - virtual_balance: Tracks the virtual SOL balance
 * - simulated_trades: Records all buy/sell transactions
 * - token_tracking: Manages active positions with risk parameters
 * 
 * @returns {Promise<boolean>} True if initialization succeeds, false otherwise
 */
export async function initializePaperTradingDB(): Promise<boolean> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    await connectionManager.initialize();
    const db = await connectionManager.getConnection();

    try {
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
          token_name TEXT NOT NULL,
          token_mint TEXT NOT NULL,
          amount_sol TEXT NOT NULL,
          amount_token TEXT NOT NULL,
          buy_price TEXT NOT NULL,
          buy_fees TEXT NOT NULL,
          buy_slippage TEXT DEFAULT '0',
          sell_price TEXT DEFAULT NULL,
          sell_fees TEXT DEFAULT NULL,
          sell_slippage TEXT DEFAULT '0',
          time_buy INTEGER NOT NULL,
          time_sell INTEGER DEFAULT NULL,
          volume_m5 TEXT DEFAULT '0',
          market_cap TEXT DEFAULT '0',
          liquidity_buy_usd TEXT DEFAULT '0',
          liquidity_sell_usd TEXT DEFAULT NULL,
          pnl TEXT DEFAULT NULL
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
          take_profit TEXT NOT NULL,
          volume_m5 REAL DEFAULT 0,
          market_cap REAL DEFAULT 0,
          liquidity_usd REAL DEFAULT 0,
          position_size_sol TEXT DEFAULT '0'
        );
      `);

      // Safely add volume_m5 and market_cap columns if they don't exist
      const columns = ['volume_m5', 'market_cap', 'liquidity_usd', 'position_size_sol'];
      for (const column of columns) {
        try {
          await db.exec(`ALTER TABLE token_tracking ADD COLUMN ${column} TEXT DEFAULT '0'`);
        } catch (error) {
          // Ignore error if column already exists
          if (error instanceof Error && !error.message.includes('duplicate column name')) {
            console.error(`Error adding column ${column}:`, error);
            throw error; // Re-throw if it's a different error
          }
        }
      }

      // Get current balance
      const balance = await db.get('SELECT * FROM virtual_balance ORDER BY id DESC LIMIT 1');
      
      // Initialize balance only if it doesn't exist
      if (!balance) {
        await db.run(
          'INSERT INTO virtual_balance (balance_sol, updated_at) VALUES (?, ?)',
          [config.paper_trading.initial_balance.toString(), Date.now()]
        );
        console.log(`🎮 Paper Trading balance set to ${config.paper_trading.initial_balance} SOL`);
      }

      return true;
    } finally {
      connectionManager.releaseConnection(db);
    }
  } catch (error) {
    console.error('Error initializing paper trading database:', error);
    return false;
  }
}

/**
 * Retrieves the current virtual balance from the database
 * Returns the most recent balance record with SOL amount and timestamp
 * 
 * @returns {Promise<VirtualBalance | null>} Current balance or null if not found/error
 */
export async function getVirtualBalance(): Promise<VirtualBalance | null> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    const db = await connectionManager.getConnection();
    try {
      const balance = await db.get('SELECT * FROM virtual_balance ORDER BY id DESC LIMIT 1');
      return balance ? {
        balance_sol: new Decimal(balance.balance_sol),
        updated_at: balance.updated_at
      } : null;
    } finally {
      connectionManager.releaseConnection(db);
    }
  } catch (error) {
    console.error('Error getting virtual balance:', error);
    return null;
  }
}

/**
 * Records a simulated trade and updates related data atomically
 * Performs the following operations in a single transaction:
 * 1. Inserts the trade record
 * 2. Updates virtual balance
 * 3. Updates token tracking for position management
 * 
 * For buy trades:
 * - Deducts trade amount + fees from virtual balance
 * - Creates/updates token position with stop-loss and take-profit
 * 
 * For sell trades:
 * - Adds trade amount - fees to virtual balance
 * - Removes token from tracking (closes position)
 * 
 * @param {SimulatedTrade} trade - Trade details to record
 * @returns {Promise<boolean>} True if recording succeeds, false otherwise
 */
export async function recordSimulatedTrade(trade: SimulatedTrade): Promise<boolean> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    const db = await connectionManager.getConnection();
    try {
      await connectionManager.transaction(async (transaction) => {
        if (trade.sell_price) {
          // Get the original buy trade details
          const buyTrade = await db.get(
            'SELECT amount_sol, buy_price, buy_fees, buy_slippage FROM simulated_trades WHERE token_mint = ? AND sell_price IS NULL',
            [trade.token_mint]
          );

          if (!buyTrade) {
            console.error('Could not find original buy trade for PNL calculation');
            return false;
          }

          const originalBuyAmount = new Decimal(buyTrade.amount_sol);
          const buySlippage = new Decimal(buyTrade.buy_slippage);
          const buyFees = new Decimal(buyTrade.buy_fees);

          // Calculate sell return (current amount - sell_fees - sell_slippage)
          const sellReturn = trade.amount_sol
            .subtract(trade.sell_fees!)
            .subtract(trade.amount_sol.multiply(trade.sell_slippage || new Decimal(0)));

          // Calculate buy cost using original buy amount (buy amount + buy_fees + buy_slippage)
          const buyCost = originalBuyAmount
            .add(buyFees)
            .add(originalBuyAmount.multiply(buySlippage));

          // PNL is sell return minus buy cost
          const pnl = sellReturn.subtract(buyCost);

          console.log(`PNL Calculation:
          Sell Amount: ${trade.amount_sol.toString()} SOL
          Sell Fees: ${trade.sell_fees!.toString()} SOL
          Sell Slippage: ${trade.sell_slippage?.toString() || '0'} SOL
          Buy Amount: ${originalBuyAmount.toString()} SOL
          Buy Fees: ${buyFees.toString()} SOL
          Buy Slippage: ${buySlippage.toString()} SOL
          Final PNL: ${pnl.toString()} SOL`);

          // Update existing buy record with sell information
          await db.run(
            `UPDATE simulated_trades 
             SET sell_price = ?,
                 sell_fees = ?,
                 time_sell = ?,
                 sell_slippage = ?,
                 pnl = ?,
                 liquidity_sell_usd = ?
             WHERE token_mint = ? AND sell_price IS NULL`,
            [
             trade.sell_price!.toString(),
             trade.sell_fees!.toString(),
             trade.time_sell!,
             trade.sell_slippage?.toString() || '0',
             pnl.toString(),
             trade.dex_data?.liquidity_sell_usd || 0,
             trade.token_mint
            ]
          );
        } else {
          // Insert new buy trade record
          const buyValues = [
            trade.token_name,
            trade.token_mint,
            trade.amount_sol.toString(),
            trade.amount_token.toString(),
            trade.buy_price.toString(),
            trade.buy_fees.toString(),
            trade.buy_slippage.toString(),
            trade.time_buy,
            trade.dex_data?.volume_m5 || 0,
            trade.dex_data?.marketCap || 0,
            trade.dex_data?.liquidity_buy_usd || 0
          ];

          console.log(`Recording Buy Trade:
          Token: ${trade.token_name}
          Amount SOL: ${trade.amount_sol.toString()}
          Buy Price: ${trade.buy_price.toString()}
          Buy Fees: ${trade.buy_fees.toString()}
          Buy Slippage: ${trade.buy_slippage.toString()}`);
          
          await db.run(
            `INSERT INTO simulated_trades (
               token_name, token_mint, amount_sol, amount_token,
               buy_price, buy_fees, buy_slippage, time_buy,
               volume_m5, market_cap, liquidity_buy_usd
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            buyValues
          );
        }

        // Update virtual balance
        const currentBalance = await getVirtualBalance();
        if (currentBalance) {
          const newBalance = trade.sell_price
            ? currentBalance.balance_sol.add(trade.amount_sol.subtract(trade.sell_fees!))
            : currentBalance.balance_sol.subtract(trade.amount_sol.add(trade.buy_fees));

          await db.run(
            'INSERT INTO virtual_balance (balance_sol, updated_at) VALUES (?, ?)',
            [newBalance.toString(), Date.now()]
          );
        }

        // Update token tracking
        if (!trade.sell_price) {
          const stopLossPrice = trade.buy_price
            .multiply(new Decimal(1).subtract(new Decimal(config.sell.stop_loss_percent).divide(100)));
          const takeProfitPrice = trade.buy_price
            .multiply(new Decimal(1).add(new Decimal(config.sell.take_profit_percent).divide(100)));

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
              trade.buy_price.toString(),
              trade.buy_price.toString(),
              trade.time_buy,
              stopLossPrice.toString(8),
              takeProfitPrice.toString(8),
              trade.amount_token.toString(),
              trade.buy_price.toString(8),
              trade.time_buy
            ]
          );
        } else {
          await db.run('DELETE FROM token_tracking WHERE token_mint = ?', [trade.token_mint]);
        }
      });

      return true;
    } finally {
      connectionManager.releaseConnection(db);
    }
  } catch (error) {
    console.error('Error recording simulated trade:', error);
    return false;
  }
}

/**
 * Updates the current price of a tracked token
 * Used for monitoring positions and triggering stop-loss/take-profit orders
 * 
 * @param {string} tokenMint - Token's mint address
 * @param {Decimal} currentPrice - Latest price to update
 * @returns {Promise<TokenTracking | null>} Updated token data or null if not found/error
 */
export async function updateTokenPrice(tokenMint: string, currentPrice: Decimal): Promise<TokenTracking | null> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    const db = await connectionManager.getConnection();
    try {
      await db.run(
        `UPDATE token_tracking 
         SET current_price = ?, last_updated = ?
         WHERE token_mint = ?`,
        [currentPrice.toString(8), Date.now(), tokenMint]
      );

      const token = await db.get(
        'SELECT * FROM token_tracking WHERE token_mint = ?',
        [tokenMint]
      );
      
      return token ? {
        ...token,
        amount: new Decimal(token.amount),
        buy_price: new Decimal(token.buy_price),
        current_price: new Decimal(token.current_price),
        stop_loss: new Decimal(token.stop_loss),
        take_profit: new Decimal(token.take_profit)
      } : null;
    } finally {
      connectionManager.releaseConnection(db);
    }
  } catch (error) {
    console.error('Error updating token price:', error);
    return null;
  }
}

/**
 * Gets the count of currently open positions
 * Used for position limit management
 * 
 * @returns {Promise<number>} Number of open positions, 0 if none or error
 */
export async function getOpenPositionsCount(): Promise<number> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    const db = await connectionManager.getConnection();
    try {
      const result = await db.get('SELECT COUNT(*) as count FROM token_tracking');
      return result ? result.count : 0;
    } finally {
      connectionManager.releaseConnection(db);
    }
  } catch (error) {
    console.error('Error getting open positions count:', error);
    return 0;
  }
}

/**
 * Retrieves all currently tracked tokens with their positions and risk parameters
 * Used for monitoring active positions and price updates
 * 
 * @returns {Promise<TokenTracking[]>} Array of tracked tokens, empty if none or error
 */
export async function getTrackedTokens(): Promise<TokenTracking[]> {
  const connectionManager = ConnectionManager.getInstance(DB_PATH);
  try {
    const db = await connectionManager.getConnection();
    try {
      const tokens = await db.all('SELECT * FROM token_tracking');
      return tokens.map(token => ({
        ...token,
        amount: new Decimal(token.amount),
        buy_price: new Decimal(token.buy_price),
        current_price: new Decimal(token.current_price),
        stop_loss: new Decimal(token.stop_loss),
        take_profit: new Decimal(token.take_profit)
      }));
    } finally {
      connectionManager.releaseConnection(db);
    }
  } catch (error) {
    console.error('Error getting tracked tokens:', error);
    return [];
  }
}