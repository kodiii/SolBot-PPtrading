import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

import { config } from "../../config";
import { ConnectionManager } from "../db/connection_manager";
import { getVirtualBalance } from "../paper_trading";
import { dashboardStyle, sectionConfigs } from '../config/dashboard_style';
import { displayVirtualBalance, displayActivePositions, displayRecentTrades, displayTradingStats } from './displays';
import { resetPaperTrading } from './dashboard-operations';
import { fetchActivePositions, fetchRecentTrades, fetchTradingStats } from './services/dashboard-data';

const DB_PATH = "src/papertrading/db/paper_trading.db";
const STYLE = dashboardStyle;

/**
 * Renders dashboard sections in the configured order
 */
async function renderDashboardSections(
    balance: any, 
    positions: any[], 
    trades: any[], 
    stats: any
): Promise<void> {
    // Get all sections sorted by order
    const orderedSections = Object.entries(sectionConfigs)
        .sort(([, a], [, b]) => a.order - b.order);

    // Render each section in order
    for (const [sectionKey, config] of orderedSections) {
        // Create a style override with section-specific colors
        const sectionStyle = {
            ...STYLE,
            color_scheme: {
                ...STYLE.color_scheme,
                border: config.colors.border,
                separator: config.colors.separator || config.colors.border,
                text: config.colors.text,
                header: config.colors.header,
                title: config.colors.title,
                label: config.colors.label || STYLE.color_scheme.label,
                value: config.colors.value || STYLE.color_scheme.value,
                profit: config.colors.profit || STYLE.color_scheme.profit,
                loss: config.colors.loss || STYLE.color_scheme.loss
            }
        };

        switch (sectionKey) {
            case 'virtualBalance':
                displayVirtualBalance(balance, sectionStyle);
                break;
            case 'activePositions':
                displayActivePositions(positions, sectionStyle);
                break;
            case 'tradingStats':
                if (stats) {
                    displayTradingStats(stats, sectionStyle);
                }
                break;
            case 'recentTrades':
                displayRecentTrades(trades, sectionStyle);
                break;
        }
    }
}

/**
 * Displays the complete dashboard with all components
 */
async function displayDashboard(): Promise<void> {
    console.clear();
    console.log(chalk.bold.cyan('\n=== Paper Trading Dashboard ==='));
    
    const [balance, positions, trades, stats] = await Promise.all([
        getVirtualBalance(),
        fetchActivePositions(),
        fetchRecentTrades(config.paper_trading.recent_trades_limit),
        fetchTradingStats()
    ]);

    await renderDashboardSections(balance, positions, trades, stats);

    console.log('\n' + chalk.gray(
        `Auto-refreshing every ${config.paper_trading.dashboard_refresh/1000} seconds. Press Ctrl+C to exit`
    ));
}

/**
 * Starts the dashboard display with auto-refresh and handles graceful shutdown
 */
async function startDashboard(): Promise<void> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    
    try {
        await connectionManager.initialize();
        const db = await connectionManager.getConnection();
        await connectionManager.releaseConnection(db);
        
        await displayDashboard();
        const intervalId = setInterval(displayDashboard, config.paper_trading.dashboard_refresh);

        process.on('SIGINT', () => {
            clearInterval(intervalId);
            console.log('\nDashboard stopped. Goodbye!');
            process.exit(0);
        });

        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            clearInterval(intervalId);
            process.exit(1);
        });
    } catch (error) {
        console.error('Error connecting to database. Make sure the bot is running:', error);
        process.exit(1);
    }
}

// Execute the dashboard when running directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--reset')) {
        resetPaperTrading().then(() => process.exit(0));
    } else {
        startDashboard();
    }
}

export { startDashboard };