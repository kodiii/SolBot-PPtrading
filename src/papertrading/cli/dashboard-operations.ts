/**
 * Dashboard Operations
 * 
 * Handles paper trading dashboard operations like resetting the trading data.
 */

import { config } from "../../config";
import { ConnectionManager } from "../db/connection_manager";

const DB_PATH = "src/papertrading/db/paper_trading.db";

/**
 * Resets all paper trading data to initial state
 * @returns Promise<boolean> True if reset was successful, false otherwise
 */
export async function resetPaperTrading(): Promise<boolean> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();

        // Clear all trading data
        await db.exec(`
            DELETE FROM virtual_balance;
            DELETE FROM simulated_trades;
            DELETE FROM token_tracking;
        `);

        // Reset initial balance
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