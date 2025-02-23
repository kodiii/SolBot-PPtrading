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
const TABLE_WIDTH = 300;  // Increased width for more columns
const TOKEN_COL_WIDTH = 12;  // Adjusted for token name
const ADDRESS_COL_WIDTH = 45; // Width for addresses
const NUM_COL_WIDTH = 20;  // Width for numerical values
const TIME_COL_WIDTH = 20;  // Width for timestamp columns

/**
 * Represents market data from dexscreener
 */
interface DexScreenerData {
    volume_m5: number;
    marketCap: number;
    liquidity_usd: number;
    liquidity_usd_sell?: number;
}

/**
 * Represents an active trading position for a token
 */
interface TokenPosition {
    token_mint: string;
    token_name: string;
    amount: Decimal;
    buy_price: Decimal;
    current_price: Decimal;
    last_updated: number;
    stop_loss: Decimal;
    take_profit: Decimal;
    position_size_sol: Decimal;
    dex_data?: DexScreenerData;
    volume_m5?: number;
    market_cap?: number;
}

/**
 * Represents a completed trade in the paper trading system
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
    pnl?: Decimal;
    dex_data?: {
        volume_m5?: number;
        marketCap?: number;
        liquidity_buy_usd?: number;
        liquidity_sell_usd?: number;
    };
}

/**
 * Represents aggregated statistics for trading performance analysis
 */
interface TradingStats {
    totalTrades: number;
    profitableTrades: number;
    totalProfitLoss: Decimal;
    winRate: Decimal;
    avgProfitPerTrade: Decimal;
    bestTrade: { token: string; profit: Decimal };
    worstTrade: { token: string; profit: Decimal };
}

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

function drawBox(title: string, content: string[]): void {
    console.log('\n' + BOX.topLeft + BOX.horizontal.repeat(2) + 
                chalk.bold.blue(` ${title} `) + 
                BOX.horizontal.repeat(TABLE_WIDTH - title.length - 4) + BOX.topRight);
    
    content.forEach(line => {
        console.log(BOX.vertical + ' ' + line + ' '.repeat(Math.max(0, TABLE_WIDTH - line.length - 2)) + BOX.vertical);
    });
    
    console.log(BOX.bottomLeft + BOX.horizontal.repeat(TABLE_WIDTH) + BOX.bottomRight);
}

function drawTable(headers: string[], rows: string[][], title: string): void {
    const headerLine = headers.join(BOX.vertical);
    const separator = BOX.horizontal.repeat(TABLE_WIDTH);
    
    console.log('\n' + BOX.topLeft + BOX.horizontal.repeat(2) + 
                chalk.bold.blue(` ${title} `) + 
                BOX.horizontal.repeat(TABLE_WIDTH - title.length - 4) + BOX.topRight);
    
    console.log(BOX.vertical + ' ' + chalk.yellow(headerLine) + ' ' + BOX.vertical);
    console.log(BOX.leftT + separator + BOX.rightT);
    
    rows.forEach(row => {
        console.log(BOX.vertical + ' ' + row.join(BOX.vertical) + ' ' + BOX.vertical);
    });
    
    console.log(BOX.bottomLeft + separator + BOX.bottomRight);
}

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

async function displayActivePositions(): Promise<void> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();
        const positions = (await db.all('SELECT * FROM token_tracking')).map(pos => ({
            ...pos,
            amount: new Decimal(pos.amount),
            buy_price: new Decimal(pos.buy_price),
            current_price: new Decimal(pos.current_price),
            stop_loss: new Decimal(pos.stop_loss),
            take_profit: new Decimal(pos.take_profit),
            position_size_sol: new Decimal(pos.position_size_sol || 0)
        }));
        connectionManager.releaseConnection(db);

        if (positions.length > 0) {
            const headers = [
                'Token Name'.padEnd(TOKEN_COL_WIDTH),
                'Address'.padEnd(ADDRESS_COL_WIDTH),
                'Volume 5m ($)'.padEnd(NUM_COL_WIDTH),
                'Market Cap ($)'.padEnd(NUM_COL_WIDTH),
                'Position Size/Sol'.padEnd(NUM_COL_WIDTH),
                'Buy Price (SOL)'.padEnd(NUM_COL_WIDTH),
                'Current Price (SOL)'.padEnd(NUM_COL_WIDTH),
                'PNL'.padEnd(NUM_COL_WIDTH),
                'Take Profit (SOL)'.padEnd(NUM_COL_WIDTH),
                'Stop Loss (SOL)'.padEnd(NUM_COL_WIDTH)
            ];

            const rows = positions.map((pos: TokenPosition) => {
                // Calculate percentage gain/loss:
                // ((sell_price - buy_price) / buy_price) * 100
                // Calculate percentage gain/loss:
                // ((sell_price - buy_price) / buy_price) * 100
                const rawPnlPercent = pos.current_price.subtract(pos.buy_price)
                    .divide(pos.buy_price)
                    .multiply(new Decimal(100));
                const formattedPnlPercent = rawPnlPercent.toString(4); // Show 4 decimal places for more precision
                const pnlColor = rawPnlPercent.isPositive() ? chalk.green : chalk.red;
                
                return [
                    pos.token_name.padEnd(TOKEN_COL_WIDTH),
                    pos.token_mint.padEnd(ADDRESS_COL_WIDTH),
                    (pos.volume_m5 || '0').toString().padEnd(NUM_COL_WIDTH),
                    (pos.market_cap || '0').toString().padEnd(NUM_COL_WIDTH),
                    pos.position_size_sol.toString(4).padEnd(NUM_COL_WIDTH),
                    `${pos.buy_price.toString(8)} SOL`.padEnd(NUM_COL_WIDTH),
                    `${pos.current_price.toString(8)} SOL`.padEnd(NUM_COL_WIDTH),
                    pnlColor(formattedPnlPercent + '%').padEnd(NUM_COL_WIDTH),
                    `${pos.take_profit.toString(8)} SOL`.padEnd(NUM_COL_WIDTH),
                    `${pos.stop_loss.toString(8)} SOL`.padEnd(NUM_COL_WIDTH)
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

async function displayRecentTrades(limit: number = config.paper_trading.recent_trades_limit): Promise<void> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();
        const trades = (await db.all(
            'SELECT * FROM simulated_trades ORDER BY time_buy DESC LIMIT ?',
            [limit]
        )).map(trade => ({
            ...trade,
            amount_sol: new Decimal(trade.amount_sol),
            amount_token: new Decimal(trade.amount_token),
            buy_price: new Decimal(trade.buy_price),
            buy_fees: new Decimal(trade.buy_fees),
            buy_slippage: new Decimal(trade.buy_slippage || 0),
            sell_price: trade.sell_price ? new Decimal(trade.sell_price) : undefined,
            sell_fees: trade.sell_fees ? new Decimal(trade.sell_fees) : undefined,
            sell_slippage: new Decimal(trade.sell_slippage || 0),
            time_buy: trade.time_buy,
            time_sell: trade.time_sell,
            pnl: trade.pnl ? new Decimal(trade.pnl) : undefined,
            dex_data: {
                volume_m5: trade.volume_m5 ? parseFloat(trade.volume_m5) : 0,
                marketCap: trade.market_cap ? parseFloat(trade.market_cap) : 0,
                liquidity_buy_usd: trade.liquidity_buy_usd ? parseFloat(trade.liquidity_buy_usd) : 0,
                liquidity_sell_usd: trade.liquidity_sell_usd ? parseFloat(trade.liquidity_sell_usd) : 0
            }
        }));
        connectionManager.releaseConnection(db);

        if (trades.length > 0) {
            const headers = [
                'Token Name'.padEnd(TOKEN_COL_WIDTH),
                'Address'.padEnd(ADDRESS_COL_WIDTH),
                'Volume 5m ($)'.padEnd(NUM_COL_WIDTH),
                'MarketCap ($)'.padEnd(NUM_COL_WIDTH),
                'Buy Price (SOL)'.padEnd(NUM_COL_WIDTH),
                'Sell Price (SOL)'.padEnd(NUM_COL_WIDTH),
                'Position Size/Sol'.padEnd(NUM_COL_WIDTH),
                'Time Buy'.padEnd(TIME_COL_WIDTH),
                'Time Sell'.padEnd(TIME_COL_WIDTH),
                'Liquidity/buy ($)'.padEnd(NUM_COL_WIDTH),
                'Liquidity/sell ($)'.padEnd(NUM_COL_WIDTH),
                'PNL (SOL)'.padEnd(NUM_COL_WIDTH)
            ];

            const rows = trades.map((trade: SimulatedTrade) => {
                const timeFormat = (timestamp: number) => 
                    new Date(timestamp).toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });

                return [
                    trade.token_name.padEnd(TOKEN_COL_WIDTH),
                    trade.token_mint.padEnd(ADDRESS_COL_WIDTH),
                    (trade.dex_data?.volume_m5 || '0').toString().padEnd(NUM_COL_WIDTH),
                    (trade.dex_data?.marketCap || '0').toString().padEnd(NUM_COL_WIDTH),
                    `${trade.buy_price.toString(8)} SOL`.padEnd(NUM_COL_WIDTH),
                    (trade.sell_price ? `${trade.sell_price.toString(8)} SOL` : '-').padEnd(NUM_COL_WIDTH),
                    trade.amount_sol.toString(4).padEnd(NUM_COL_WIDTH),
                    timeFormat(trade.time_buy).padEnd(TIME_COL_WIDTH),
                    (trade.time_sell ? timeFormat(trade.time_sell) : '-').padEnd(TIME_COL_WIDTH),
                    (trade.dex_data?.liquidity_buy_usd || '0').toString().padEnd(NUM_COL_WIDTH),
                    (trade.time_sell ? (trade.dex_data?.liquidity_sell_usd || '0').toString() : '-').padEnd(NUM_COL_WIDTH),
                    (trade.pnl ? 
                        (trade.pnl.isPositive() ? chalk.green : chalk.red)(trade.pnl.toString(4)) :
                        '-'
                    ).padEnd(NUM_COL_WIDTH)
                ];
            });

            drawTable(headers, rows, '📈 Recent Trades');
        } else {
            drawBox('📈 Recent Trades', [chalk.yellow('No trades recorded yet')]);
        }
    } catch (error) {
        console.error('Error fetching recent trades:', error);
    }
}

async function displayTradingStats(stats: TradingStats): Promise<void> {
    const content = [
        `${chalk.yellow('Total Trades:')} ${stats.totalTrades}`,
        `${chalk.yellow('Win Rate:')} ${stats.winRate.greaterThan(50) || stats.winRate.equals(50) ? chalk.green(stats.winRate.toString(4)) : chalk.red(stats.winRate.toString(4))}%`,
        `${chalk.yellow('Total P/L:')} ${stats.totalProfitLoss.isPositive() || stats.totalProfitLoss.isZero() ? chalk.green(stats.totalProfitLoss.toString(8)) : chalk.red(stats.totalProfitLoss.toString(8))} SOL`,
        `${chalk.yellow('Avg P/L per Trade:')} ${stats.avgProfitPerTrade.isPositive() || stats.avgProfitPerTrade.isZero() ? chalk.green(stats.avgProfitPerTrade.toString(8)) : chalk.red(stats.avgProfitPerTrade.toString(8))} SOL`,
    ];

    if (!stats.bestTrade.profit.equals(new Decimal(-Infinity))) {
        const bestTradeColor = stats.bestTrade.profit.isPositive() || stats.bestTrade.profit.isZero() ? chalk.green : chalk.red;
        content.push(`${chalk.yellow('Best Trade:')} ${stats.bestTrade.token} (${bestTradeColor(stats.bestTrade.profit.toString(8))} SOL)`);
    }
    if (!stats.worstTrade.profit.equals(new Decimal(Infinity))) {
        const worstTradeColor = stats.worstTrade.profit.isPositive() || stats.worstTrade.profit.isZero() ? chalk.green : chalk.red;
        content.push(`${chalk.yellow('Worst Trade:')} ${stats.worstTrade.token} (${worstTradeColor(stats.worstTrade.profit.toString(8))} SOL)`);
    }

    drawBox('📈 Trading Statistics', content);
}

async function calculateTradingStats(): Promise<TradingStats | null> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();
        const trades = (await db.all('SELECT * FROM simulated_trades')).map(trade => ({
            ...trade,
            amount_sol: new Decimal(trade.amount_sol),
            amount_token: new Decimal(trade.amount_token),
            price_per_token: new Decimal(trade.price_per_token),
            fees: new Decimal(trade.fees),
            sell_price: trade.sell_price ? new Decimal(trade.sell_price) : undefined,
            sell_fees: trade.sell_fees ? new Decimal(trade.sell_fees) : undefined,
            pnl: trade.pnl ? new Decimal(trade.pnl) : undefined
        }));
        connectionManager.releaseConnection(db);

        if (trades.length === 0) return null;

        // Group trades by token mint
        const tokenTrades = new Map<string, SimulatedTrade[]>();
        trades.forEach((trade: SimulatedTrade) => {
            if (!tokenTrades.has(trade.token_mint)) {
                tokenTrades.set(trade.token_mint, []);
            }
            tokenTrades.get(trade.token_mint)?.push(trade);
        });

        let totalProfitLoss = Decimal.ZERO;
        let profitableTrades = 0;
        let completedTrades = 0;
        let bestTrade = { token: '', profit: new Decimal(-Infinity) };
        let worstTrade = { token: '', profit: new Decimal(Infinity) };

        tokenTrades.forEach((trades, tokenMint) => {
            // Find completed trades (buy trades with sell_price)
            // Find trades that have been sold
            const soldTrades = trades.filter(t =>
                t.sell_price !== undefined && t.pnl !== undefined
            );

            if (soldTrades.length === 0) return;

            completedTrades += soldTrades.length;
            
            soldTrades.forEach((trade: SimulatedTrade) => {
                const profit = trade.pnl!; // We know pnl exists from the filter
                totalProfitLoss = totalProfitLoss.add(profit);

                if (profit.isPositive()) {
                    profitableTrades++;
                }

                if (profit.greaterThan(bestTrade.profit)) {
                    bestTrade = { token: trade.token_name, profit };
                }
                if (profit.lessThan(worstTrade.profit)) {
                    worstTrade = { token: trade.token_name, profit };
                }
            });
        });

        const winRate = completedTrades > 0
            ? new Decimal(profitableTrades).divide(completedTrades).multiply(100)
            : new Decimal(0);

        const avgProfitPerTrade = completedTrades > 0
            ? totalProfitLoss.divide(completedTrades)
            : Decimal.ZERO;

        return {
            totalTrades: completedTrades,
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

async function displayDashboard(): Promise<void> {
    console.clear();
    console.log(chalk.bold.cyan('\n=== Paper Trading Dashboard ==='));
    
    await displayVirtualBalance();
    await displayActivePositions();
    
    const stats = await calculateTradingStats();
    if (stats) {
        await displayTradingStats(stats);
    }
    
    await displayRecentTrades();

    console.log('\n' + chalk.gray(`Auto-refreshing every ${config.paper_trading.dashboard_refresh/1000} seconds. Press Ctrl+C to exit`));
}

async function resetPaperTrading(): Promise<boolean> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();

        await db.exec(`
            DELETE FROM virtual_balance;
            DELETE FROM simulated_trades;
            DELETE FROM token_tracking;
        `);

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