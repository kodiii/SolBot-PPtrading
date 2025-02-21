import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config(); // Load environment variables
import { ConnectionManager } from "../db/connection_manager";
import { initializePaperTradingDB, getVirtualBalance } from "../paper_trading";
import { config } from "../../config";
import { SimulationService } from "../services";
import { Decimal } from "../../utils/decimal";

const DB_PATH = "src/papertrading/db/paper_trading.db";
const TABLE_WIDTH = 150;
const TOKEN_COL_WIDTH = 45;
const NUM_COL_WIDTH = 20;
const TIME_COL_WIDTH = 25;

interface TokenPosition {
    token_mint: string;
    token_name: string;
    amount: Decimal;
    buy_price: Decimal;
    current_price: Decimal;
    last_updated: number;
    stop_loss: Decimal;
    take_profit: Decimal;
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

function drawTable(headers: string[], rows: string[][], title: string): void {
    const headerLine = headers.join(BOX.vertical);
    const separator = BOX.horizontal.repeat(TABLE_WIDTH);
    
    console.log('\n' + BOX.topLeft + BOX.horizontal.repeat(2) + 
                chalk.bold.blue(` ${title} `) + 
                BOX.horizontal.repeat(TABLE_WIDTH - title.length - 4) + BOX.topRight);
    
    // Headers
    console.log(BOX.vertical + ' ' + chalk.yellow(headerLine) + ' ' + BOX.vertical);
    
    // Separator after headers
    console.log(BOX.leftT + separator + BOX.rightT);
    
    // Data rows
    rows.forEach(row => {
        console.log(BOX.vertical + ' ' + row.join(BOX.vertical) + ' ' + BOX.vertical);
    });
    
    // Bottom border
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
            take_profit: new Decimal(pos.take_profit)
        }));
        connectionManager.releaseConnection(db);

        if (positions.length > 0) {
            const headers = [
                'Token'.padEnd(TOKEN_COL_WIDTH),
                'Amount'.padEnd(NUM_COL_WIDTH),
                'Buy Price'.padEnd(NUM_COL_WIDTH),
                'Current Price'.padEnd(NUM_COL_WIDTH),
                'PNL'.padEnd(NUM_COL_WIDTH),
                'Stop Loss'.padEnd(NUM_COL_WIDTH),
                'Take Profit'.padEnd(NUM_COL_WIDTH)
            ];

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

async function displayTradingStats(stats: TradingStats): Promise<void> {
    const content = [
        `${chalk.yellow('Total Trades:')} ${stats.totalTrades}`,
        `${chalk.yellow('Win Rate:')} ${stats.winRate.greaterThan(50) || stats.winRate.equals(50) ? chalk.green(stats.winRate.toString(1)) : chalk.red(stats.winRate.toString(1))}%`,
        `${chalk.yellow('Total P/L:')} ${stats.totalProfitLoss.isPositive() || stats.totalProfitLoss.isZero() ? chalk.green(stats.totalProfitLoss.toString()) : chalk.red(stats.totalProfitLoss.toString())} SOL`,
        `${chalk.yellow('Avg P/L per Trade:')} ${stats.avgProfitPerTrade.isPositive() || stats.avgProfitPerTrade.isZero() ? chalk.green(stats.avgProfitPerTrade.toString()) : chalk.red(stats.avgProfitPerTrade.toString())} SOL`,
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

async function displayRecentTrades(limit: number = 20): Promise<void> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
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
            const headers = [
                'Time'.padEnd(TIME_COL_WIDTH),
                'Type'.padEnd(10),
                'Token'.padEnd(TOKEN_COL_WIDTH),
                'Amount SOL'.padEnd(NUM_COL_WIDTH),
                'Price/Token'.padEnd(NUM_COL_WIDTH),
                'Fees'.padEnd(NUM_COL_WIDTH)
            ];

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

async function calculateTradingStats(): Promise<TradingStats | null> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();
        const trades = (await db.all('SELECT * FROM simulated_trades')).map(trade => ({
            ...trade,
            amount_sol: new Decimal(trade.amount_sol),
            amount_token: new Decimal(trade.amount_token),
            price_per_token: new Decimal(trade.price_per_token),
            fees: new Decimal(trade.fees)
        }));
        connectionManager.releaseConnection(db);

        if (trades.length === 0) return null;

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

        tokenTrades.forEach((trades, tokenMint) => {
            let buyTotal = Decimal.ZERO;
            let sellTotal = Decimal.ZERO;
            let buyFees = Decimal.ZERO;
            let sellFees = Decimal.ZERO;

            trades.forEach(trade => {
                if (trade.type === 'buy') {
                    buyTotal = buyTotal.add(trade.amount_sol);
                    buyFees = buyFees.add(trade.fees);
                } else {
                    sellTotal = sellTotal.add(trade.amount_sol);
                    sellFees = sellFees.add(trade.fees);
                }
            });

            const totalFees = buyFees.add(sellFees);
            const profit = sellTotal.subtract(buyTotal).subtract(totalFees);
            if (profit.isPositive()) profitableTrades++;

            if (profit.greaterThan(bestTrade.profit)) {
                bestTrade = { token: trades[0].token_mint, profit };
            }
            if (profit.lessThan(worstTrade.profit) && trades.some(t => t.type === 'sell')) {
                worstTrade = { token: trades[0].token_mint, profit };
            }

            totalProfitLoss = totalProfitLoss.add(profit);
        });

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

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--reset')) {
        resetPaperTrading().then(() => process.exit(0));
    } else {
        startDashboard();
    }
}

export { startDashboard, resetPaperTrading };