import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

import { config } from "../../config";
//import { ConnectionManager } from "../db/connection_manager";
import { dashboardStyle, sectionConfigs } from './config/dashboard_style';
import { displayVirtualBalance, displayActivePositions, displayRecentTrades, displayTradingStats } from './displays';
import { resetPaperTrading, fetchDashboardData, validateConnection } from './dashboard-operations';

const DB_PATH = "src/papertrading/db/paper_trading.db";
const STYLE = dashboardStyle;

/**
 * Renders dashboard sections in the configured order
 */
async function renderDashboardSections(
    data: {
        balance: any,
        positions: any[],
        trades: any[],
        stats: any,
        error: string | null
    }
): Promise<void> {
    if (data.error) {
        console.log(chalk.red(`\nError: ${data.error}`));
        return;
    }

    // Get all sections sorted by order
    const orderedSections = Object.entries(sectionConfigs)
        .sort(([, a], [, b]) => a.order - b.order);

    // Render each section in order
    for (const [sectionKey, config] of orderedSections) {
        try {
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
                    if (data.balance) {
                        displayVirtualBalance(data.balance, sectionStyle);
                    }
                    break;
                case 'activePositions':
                    displayActivePositions(data.positions, sectionStyle);
                    break;
                case 'tradingStats':
                    if (data.stats) {
                        displayTradingStats(data.stats, sectionStyle);
                    }
                    break;
                case 'recentTrades':
                    displayRecentTrades(data.trades, sectionStyle);
                    break;
            }
        } catch (error) {
            console.error(`Error rendering section ${sectionKey}:`, error);
        }
    }
}

/**
 * Displays the complete dashboard with all components
 */
async function displayDashboard(): Promise<void> {
    try {
        console.clear();
        console.log(chalk.bold.cyan('\n=== Paper Trading Dashboard ==='));
        
        const data = await fetchDashboardData();
        await renderDashboardSections(data);

        console.log('\n' + chalk.gray(
            `Auto-refreshing every ${config.paper_trading.dashboard_refresh/1000} seconds. Press Ctrl+C to exit`
        ));
    } catch (error) {
        console.error('Error displaying dashboard:', error);
    }
}

/**
 * Starts the dashboard display with auto-refresh and handles graceful shutdown
 */
async function startDashboard(): Promise<void> {
    try {
        // Validate database connection before starting
        const isConnected = await validateConnection();
        if (!isConnected) {
            console.error('Could not establish database connection. Make sure the bot is running.');
            process.exit(1);
        }

        let lastError = 0;
        let errorCount = 0;

        // Initial display
        await displayDashboard();

        // Set up auto-refresh with error handling
        const intervalId = setInterval(async () => {
            try {
                await displayDashboard();
                errorCount = 0; // Reset error count on successful update
            } catch (error) {
                const now = Date.now();
                errorCount++;

                // If we get frequent errors, slow down the refresh rate
                if (errorCount > 3 && now - lastError < 5000) {
                    console.error('Too many errors, increasing refresh interval');
                    clearInterval(intervalId);
                    setInterval(displayDashboard, config.paper_trading.dashboard_refresh * 2);
                }

                lastError = now;
                console.error('Dashboard update error:', error);
            }
        }, config.paper_trading.dashboard_refresh);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            clearInterval(intervalId);
            console.log('\nDashboard stopped. Goodbye!');
            process.exit(0);
        });

        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            clearInterval(intervalId);
            process.exit(1);
        });
    } catch (error) {
        console.error('Error starting dashboard:', error);
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