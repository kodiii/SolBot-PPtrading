/**
 * Paper Trading Dashboard
 * 
 * A real-time dashboard for monitoring paper trading activities on the Solana blockchain.
 * Provides visualization of virtual balance, active positions, trading statistics, and recent trades.
 * The dashboard auto-refreshes to show live updates of trading activities.
 */

import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables
import { ConnectionManager } from "../db/connection_manager";
import { initializePaperTradingDB, getVirtualBalance } from "../paper_trading";
import { config } from "../../config";
import { SimulationService } from "../services";
import { Decimal } from "../../utils/decimal";

// Constants for database path and table formatting
const DB_PATH = "src/papertrading/db/paper_trading.db";
const TABLE_WIDTH = 150;  // Total width of the display tables
const TOKEN_COL_WIDTH = 45;  // Width for token-related columns
const NUM_COL_WIDTH = 20;  // Width for numerical value columns
const TIME_COL_WIDTH = 25;  // Width for timestamp columns

/**
 * Represents an active trading position for a token
 * Tracks current amount, prices, and risk management parameters
 */
interface TokenPosition {
    token_mint: string;  // Token's mint address
    token_name: string;  // Human-readable token name
    amount: Decimal;     // Current position size
    buy_price: Decimal;  // Average entry price
    current_price: Decimal;  // Latest market price
    last_updated: number;    // Timestamp of last update
    stop_loss: Decimal;      // Stop loss price level
    take_profit: Decimal;    // Take profit price level
}

/**
 * Represents a completed trade in the paper trading system
 * Records both buy and sell transactions with their details
 */
interface SimulatedTrade {
    timestamp: number;      // When the trade occurred
    token_mint: string;     // Token's mint address
    token_name: string;     // Human-readable token name
    amount_sol: Decimal;    // Trade amount in SOL
    amount_token: Decimal;  // Trade amount in token units
    price_per_token: Decimal;  // Execution price
    type: 'buy' | 'sell';     // Trade direction
    fees: Decimal;            // Transaction fees in SOL
}

/**
 * Aggregated statistics for trading performance analysis
 * Tracks profitability metrics and notable trades
 */
interface TradingStats {
    totalTrades: number;       // Total number of completed trades
    profitableTrades: number;  // Number of profitable trades
    totalProfitLoss: Decimal;  // Net P/L in SOL
    winRate: Decimal;          // Percentage of profitable trades
    avgProfitPerTrade: Decimal;  // Average P/L per trade
    bestTrade: { token: string; profit: Decimal };   // Most profitable trade
    worstTrade: { token: string; profit: Decimal };  // Least profitable trade
}

// Unicode box drawing characters for creating table borders
const BOX = {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    leftT: '├',
    rightT: '┤',
    topT: '┬',
    bottomT: '┴',
    cross: '┼',
};

/**
 * Draws a boxed section with a title and content
 * Used for displaying single-section information like balances
 */
function drawBox(title: string, content: string[]): void {
    // Top border with title
    console.log('\n' + BOX.topLeft + BOX.horizontal.repeat(2) + 
                chalk.bold.blue(` ${title} `) + 
                BOX.horizontal.repeat(TABLE_WIDTH - title.length - 4) + BOX.topRight);
    
    // Content with side borders
    content.forEach(line => {
        console.log(BOX.vertical + ' ' + line + ' '.repeat(Math.max(0, TABLE_WIDTH - line.length - 2)) + BOX.vertical);
    });
    
    // Bottom border
    console.log(BOX.bottomLeft + BOX.horizontal.repeat(TABLE_WIDTH) + BOX.bottomRight);
}

/**
 * Draws a formatted table with headers and rows
 * Used for displaying structured data like positions and trades
 */
function drawTable(headers: string[], rows: string[][], title: string): void {
    const headerLine = headers.join(BOX.vertical);
    const separator = BOX.horizontal.repeat(TABLE_WIDTH);
    
    // Draw title and top border
    console.log('\n' + BOX.topLeft + BOX.horizontal.repeat(2) + 
                chalk.bold.blue(` ${title} `) + 
                BOX.horizontal.repeat(TABLE_WIDTH - title.length - 4) + BOX.topRight);
    
    // Headers with yellow highlighting
    console.log(BOX.vertical + ' ' + chalk.yellow(headerLine) + ' ' + BOX.vertical);
    
    // Separator line between headers and data
    console.log(BOX.leftT + separator + BOX.rightT);
    
    // Data rows
    rows.forEach(row => {
        console.log(BOX.vertical + ' ' + row.join(BOX.vertical) + ' ' + BOX.vertical);
    });
    
    // Bottom border
    console.log(BOX.bottomLeft + separator + BOX.bottomRight);
}

/**
 * Displays the current virtual balance in SOL and USD equivalent
 * Updates in real-time with the latest SOL/USD price
 */
async function displayVirtualBalance(): Promise<void> {
    try {
        const balance = await getVirtualBalance();
        const simulationService = SimulationService.getInstance();
        const solUsdPrice = simulationService.getSolUsdPrice();

        if (balance) {
            const content = [
                `${chalk.yellow('SOL Balance:')} ${chalk.green(balance.balance_sol.toString())} ${
                    solUsdPrice ?
                    ` (≈ $${balance.balance_sol.multiply(solUsdPrice).toString(2)} USD)` : ''
                }`,
                `${chalk.yellow('Last Updated:')} ${new Date(balance.updated_at).toLocaleString()}`
            ];
            drawBox('📊 Virtual Balance', content);
        }
    } catch (error) {
        console.error('Error fetching virtual balance:', error);
    }
}

/**
 * Displays all active trading positions with current P/L and risk parameters
 * Shows token amounts, prices, and color-coded profit/loss percentages
 */
async function displayActivePositions(): Promise<void> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        // Fetch and parse position data from database
        const db = await connectionManager.getConnection();
        const positions = (await db.all('SELECT * FROM token_tracking')).map(pos => ({
            ...pos,
            amount: new Decimal(pos.amount),
            buy_price: new Decimal(pos.buy_price),
            current_price: new Decimal(pos.current_price),
            stop_loss: new Decimal(pos.stop_loss),
            take_profit: new Decimal(pos.take_profit)
        }));
        connectionManager.releaseConnection(db);

        if (positions.length > 0) {
            // Define table structure
            const headers = [
                'Token'.padEnd(TOKEN_COL_WIDTH),
                'Amount'.padEnd(NUM_COL_WIDTH),
                'Buy Price'.padEnd(NUM_COL_WIDTH),
                'Current Price'.padEnd(NUM_COL_WIDTH),
                'PNL'.padEnd(NUM_COL_WIDTH),
                'Stop Loss'.padEnd(NUM_COL_WIDTH),
                'Take Profit'.padEnd(NUM_COL_WIDTH)
            ];

            // Format position data with color-coded P/L
            const rows = positions.map((pos: TokenPosition) => {
                const pnlPercent = pos.current_price.subtract(pos.buy_price).divide(pos.buy_price).multiply(new Decimal(100));
                const pnlColor = pnlPercent.isPositive() || pnlPercent.isZero() ? chalk.green : chalk.red;
                return [
                    pos.token_mint.padEnd(TOKEN_COL_WIDTH),
                    pos.amount.toString(8).padEnd(NUM_COL_WIDTH),
                    `$${pos.buy_price.toString(8)}`.padEnd(NUM_COL_WIDTH),
                    `$${pos.current_price.toString(8)}`.padEnd(NUM_COL_WIDTH),
                    pnlColor(pnlPercent.toString(2) + '%'.padEnd(NUM_COL_WIDTH - 3)),
                    pos.stop_loss.toString(8).padEnd(NUM_COL_WIDTH),
                    pos.take_profit.toString(8).padEnd(NUM_COL_WIDTH)
                ];
            });

            drawTable(headers, rows, '🎯 Active Positions');
        } else {
            drawBox('🎯 Active Positions', [chalk.yellow('No active positions')]);
        }
    } catch (error) {
        console.error('Error fetching active positions:', error);
    }
}

/**
 * Displays aggregated trading statistics with color-coded performance metrics
 * Shows win rate, total P/L, and best/worst trades
 */
async function displayTradingStats(stats: TradingStats): Promise<void> {
    const content = [
        `${chalk.yellow('Total Trades:')} ${stats.totalTrades}`,
        `${chalk.yellow('Win Rate:')} ${stats.winRate.greaterThan(50) || stats.winRate.equals(50) ? chalk.green(stats.winRate.toString(1)) : chalk.red(stats.winRate.toString(1))}%`,
        `${chalk.yellow('Total P/L:')} ${stats.totalProfitLoss.isPositive() || stats.totalProfitLoss.isZero() ? chalk.green(stats.totalProfitLoss.toString()) : chalk.red(stats.totalProfitLoss.toString())} SOL`,
        `${chalk.yellow('Avg P/L per Trade:')} ${stats.avgProfitPerTrade.isPositive() || stats.avgProfitPerTrade.isZero() ? chalk.green(stats.avgProfitPerTrade.toString()) : chalk.red(stats.avgProfitPerTrade.toString())} SOL`,
    ];

    // Add best trade if available
    if (!stats.bestTrade.profit.equals(new Decimal(-Infinity))) {
        const bestTradeColor = stats.bestTrade.profit.isPositive() || stats.bestTrade.profit.isZero() ? chalk.green : chalk.red;
        content.push(`${chalk.yellow('Best Trade:')} ${stats.bestTrade.token} (${bestTradeColor(stats.bestTrade.profit.toString(8))} SOL)`);
    }
    // Add worst trade if available
    if (!stats.worstTrade.profit.equals(new Decimal(Infinity))) {
        const worstTradeColor = stats.worstTrade.profit.isPositive() || stats.worstTrade.profit.isZero() ? chalk.green : chalk.red;
        content.push(`${chalk.yellow('Worst Trade:')} ${stats.worstTrade.token} (${worstTradeColor(stats.worstTrade.profit.toString(8))} SOL)`);
    }

    drawBox('📈 Trading Statistics', content);
}

/**
 * Displays recent trades with execution details
 * Shows timestamp, trade type, amounts, and fees
 * @param limit Maximum number of trades to display
 */
async function displayRecentTrades(limit: number = 20): Promise<void> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        // Fetch recent trades from database
        const db = await connectionManager.getConnection();
        const trades = (await db.all(
            'SELECT * FROM simulated_trades ORDER BY timestamp DESC LIMIT ?',
            [limit]
        )).map(trade => ({
            ...trade,
            amount_sol: new Decimal(trade.amount_sol),
            amount_token: new Decimal(trade.amount_token),
            price_per_token: new Decimal(trade.price_per_token),
            fees: new Decimal(trade.fees)
        }));
        connectionManager.releaseConnection(db);

        if (trades.length > 0) {
            // Define table structure
            const headers = [
                'Time'.padEnd(TIME_COL_WIDTH),
                'Type'.padEnd(10),
                'Token'.padEnd(TOKEN_COL_WIDTH),
                'Amount SOL'.padEnd(NUM_COL_WIDTH),
                'Price/Token'.padEnd(NUM_COL_WIDTH),
                'Fees'.padEnd(NUM_COL_WIDTH)
            ];

            // Format trade data with color-coded types
            const rows = trades.map((trade: SimulatedTrade) => [
                new Date(trade.timestamp).toLocaleString().padEnd(TIME_COL_WIDTH),
                (trade.type === 'buy' ? chalk.green : chalk.red)(trade.type.toUpperCase().padEnd(10)),
                trade.token_mint.padEnd(TOKEN_COL_WIDTH),
                trade.amount_sol.toString(8).padEnd(NUM_COL_WIDTH),
                `$${trade.price_per_token.toString(8)}`.padEnd(NUM_COL_WIDTH),
                trade.fees.toString(8).padEnd(NUM_COL_WIDTH)
            ]);

            drawTable(headers, rows, '📈 Recent Trades');
        } else {
            drawBox('📈 Recent Trades', [chalk.yellow('No trades recorded yet')]);
        }
    } catch (error) {
        console.error('Error fetching recent trades:', error);
    }
}

/**
 * Main dashboard display function
 * Coordinates the display of all dashboard components and handles auto-refresh
 */
async function displayDashboard(): Promise<void> {
    console.clear();
    console.log(chalk.bold.cyan('\n=== Paper Trading Dashboard ==='));
    
    // Display all dashboard components
    await displayVirtualBalance();
    await displayActivePositions();
    
    const stats = await calculateTradingStats();
    if (stats) {
        await displayTradingStats(stats);
    }
    
    await displayRecentTrades();

    console.log('\n' + chalk.gray(`Auto-refreshing every ${config.paper_trading.dashboard_refresh/1000} seconds. Press Ctrl+C to exit`));
}

/**
 * Calculates comprehensive trading statistics from historical trade data
 * Processes all trades to compute metrics like win rate, P/L, and best/worst trades
 * @returns Trading statistics or null if no trades exist
 */
async function calculateTradingStats(): Promise<TradingStats | null> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();
        // Fetch all trades and convert numeric strings to Decimal objects
        const trades = (await db.all('SELECT * FROM simulated_trades')).map(trade => ({
            ...trade,
            amount_sol: new Decimal(trade.amount_sol),
            amount_token: new Decimal(trade.amount_token),
            price_per_token: new Decimal(trade.price_per_token),
            fees: new Decimal(trade.fees)
        }));
        connectionManager.releaseConnection(db);

        if (trades.length === 0) return null;

        // Group trades by token for P/L calculation
        const tokenTrades = new Map<string, SimulatedTrade[]>();
        trades.forEach((trade: SimulatedTrade) => {
            if (!tokenTrades.has(trade.token_mint)) {
                tokenTrades.set(trade.token_mint, []);
            }
            tokenTrades.get(trade.token_mint)?.push(trade);
        });

        let totalProfitLoss = Decimal.ZERO;
        let profitableTrades = 0;
        let bestTrade = { token: '', profit: new Decimal(-Infinity) };
        let worstTrade = { token: '', profit: new Decimal(Infinity) };

        // Calculate P/L for each token's trades
        tokenTrades.forEach((trades, tokenMint) => {
            let buyTotal = Decimal.ZERO;
            let sellTotal = Decimal.ZERO;
            let buyFees = Decimal.ZERO;
            let sellFees = Decimal.ZERO;

            // Sum up buy and sell amounts separately
            trades.forEach(trade => {
                if (trade.type === 'buy') {
                    buyTotal = buyTotal.add(trade.amount_sol);
                    buyFees = buyFees.add(trade.fees);
                } else {
                    sellTotal = sellTotal.add(trade.amount_sol);
                    sellFees = sellFees.add(trade.fees);
                }
            });

            // Calculate net profit/loss including fees
            const totalFees = buyFees.add(sellFees);
            const profit = sellTotal.subtract(buyTotal).subtract(totalFees);
            if (profit.isPositive()) profitableTrades++;

            // Update best/worst trade records
            if (profit.greaterThan(bestTrade.profit)) {
                bestTrade = { token: trades[0].token_mint, profit };
            }
            if (profit.lessThan(worstTrade.profit) && trades.some(t => t.type === 'sell')) {
                worstTrade = { token: trades[0].token_mint, profit };
            }

            totalProfitLoss = totalProfitLoss.add(profit);
        });

        // Calculate win rate and average profit per trade
        const winRate = new Decimal(profitableTrades)
            .divide(tokenTrades.size)
            .multiply(100);

        const avgProfitPerTrade = tokenTrades.size > 0
            ? totalProfitLoss.divide(tokenTrades.size)
            : Decimal.ZERO;

        return {
            totalTrades: tokenTrades.size,
            profitableTrades,
            totalProfitLoss,
            winRate,
            avgProfitPerTrade,
            bestTrade,
            worstTrade
        };
    } catch (error) {
        console.error('Error calculating trading stats:', error);
        return null;
    }
}

/**
 * Initializes and starts the dashboard
 * Sets up database connection, initializes paper trading system, and starts auto-refresh
 */
async function startDashboard(): Promise<void> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    await connectionManager.initialize();
    
    const success = await initializePaperTradingDB();
    if (!success) {
        console.error('Failed to initialize paper trading database');
        return;
    }

    await displayDashboard();
    setInterval(displayDashboard, config.paper_trading.dashboard_refresh);
}

/**
 * Resets the paper trading system to initial state
 * Clears all trades, positions, and resets virtual balance to initial value
 * @returns boolean indicating success or failure
 */
async function resetPaperTrading(): Promise<boolean> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();

        // Clear all trading data
        await db.exec(`
            DELETE FROM virtual_balance;
            DELETE FROM simulated_trades;
            DELETE FROM token_tracking;
        `);

        // Reset virtual balance to initial value
        await db.run(
            'INSERT INTO virtual_balance (balance_sol, updated_at) VALUES (?, ?)',
            [config.paper_trading.initial_balance, Date.now()]
        );

        connectionManager.releaseConnection(db);
        console.log('🔄 Paper trading data reset successfully');
        console.log(`💰 Initial balance set to ${config.paper_trading.initial_balance} SOL`);
        return true;
    } catch (error) {
        console.error('Error resetting paper trading data:', error);
        return false;
    }
}

// Entry point handling for CLI commands
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--reset')) {
        resetPaperTrading().then(() => process.exit(0));
    } else {
        startDashboard();
    }
}

export { startDashboard, resetPaperTrading };