import { ConnectionManager } from "../db/connection_manager";
import { config } from "../../config";
import { getVirtualBalance } from "../paper_trading";
import { fetchActivePositions, fetchRecentTrades, fetchTradingStats } from './services/dashboard-data';

const MAX_RETRIES = 3;
const RETRY_DELAY = 500;

/**
 * Delay utility for retry mechanism
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches all dashboard data with retry mechanism
 */
export async function fetchDashboardData(retries = MAX_RETRIES) {
    try {
        const [balance, positions, trades, stats] = await Promise.all([
            getVirtualBalance(),
            fetchActivePositions(),
            fetchRecentTrades(config.paper_trading.recent_trades_limit),
            fetchTradingStats()
        ]);

        return {
            balance,
            positions,
            trades,
            stats,
            error: null
        };
    } catch (error) {
        console.error(`Error fetching dashboard data (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, error);
        
        if (retries > 0) {
            await delay(RETRY_DELAY);
            return fetchDashboardData(retries - 1);
        }

        return {
            balance: null,
            positions: [],
            trades: [],
            stats: null,
            error: 'Failed to fetch dashboard data after retries'
        };
    }
}

/**
 * Resets paper trading data
 */
export async function resetPaperTrading(): Promise<void> {
    const connectionManager = ConnectionManager.getInstance("src/papertrading/db/paper_trading.db");
    
    try {
        await connectionManager.initialize();
        const db = await connectionManager.getConnection();

        try {
            await db.exec('BEGIN TRANSACTION');
            
            // Clear all trading data
            await db.run('DELETE FROM simulated_trades');
            await db.run('DELETE FROM token_tracking');
            
            // Reset virtual balance
            await db.run(
                'UPDATE virtual_balance SET balance_sol = ?', 
                [config.paper_trading.initial_balance]
            );
            
            await db.exec('COMMIT');
            console.log('Paper trading data reset successfully');
            
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        } finally {
            await connectionManager.releaseConnection(db);
        }
    } catch (error) {
        console.error('Error resetting paper trading data:', error);
        throw error;
    }
}

/**
 * Validates database connection
 */
export async function validateConnection(): Promise<boolean> {
    const connectionManager = ConnectionManager.getInstance("src/papertrading/db/paper_trading.db");
    
    try {
        await connectionManager.initialize();
        const db = await connectionManager.getConnection();
        await connectionManager.releaseConnection(db);
        return true;
    } catch (error) {
        console.error('Database connection validation failed:', error);
        return false;
    }
}