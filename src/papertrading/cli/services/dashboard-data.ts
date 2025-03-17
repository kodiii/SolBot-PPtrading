import { ConnectionManager } from "../../db/connection_manager";
import { TokenPosition, SimulatedTrade, TradingStats } from "../types.js";
import { Decimal } from "../../../utils/decimal";

const DB_PATH = "src/papertrading/db/paper_trading.db";

export async function fetchActivePositions(): Promise<TokenPosition[]> {
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
        return positions;
    } catch (error) {
        console.error('Error fetching active positions:', error);
        return [];
    }
}

export async function fetchRecentTrades(limit?: number): Promise<SimulatedTrade[]> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();
        
        // If limit is 0 or not provided, get all trades
        const query = limit && limit > 0 
            ? 'SELECT * FROM simulated_trades ORDER BY time_buy DESC LIMIT ?'
            : 'SELECT * FROM simulated_trades ORDER BY time_buy DESC';
        
        const params = limit && limit > 0 ? [limit] : [];
        
        const trades = (await db.all(query, params)).map(trade => ({
            ...trade,
            amount_sol: new Decimal(trade.amount_sol),
            amount_token: new Decimal(trade.amount_token),
            buy_price: new Decimal(trade.buy_price),
            buy_fees: new Decimal(trade.buy_fees),
            buy_slippage: new Decimal(trade.buy_slippage || 0),
            sell_price: trade.sell_price ? new Decimal(trade.sell_price) : undefined,
            sell_fees: trade.sell_fees ? new Decimal(trade.sell_fees) : undefined,
            sell_slippage: new Decimal(trade.sell_slippage || 0),
            pnl: trade.pnl ? new Decimal(trade.pnl) : undefined,
            dex_data: {
                volume_m5: trade.volume_m5 ? parseFloat(trade.volume_m5) : 0,
                marketCap: trade.market_cap ? parseFloat(trade.market_cap) : 0,
                liquidity_buy_usd: trade.liquidity_buy_usd ? parseFloat(trade.liquidity_buy_usd) : 0,
                liquidity_sell_usd: trade.liquidity_sell_usd ? parseFloat(trade.liquidity_sell_usd) : 0
            }
        }));
        connectionManager.releaseConnection(db);
        return trades;
    } catch (error) {
        console.error('Error fetching recent trades:', error);
        return [];
    }
}

export async function fetchTradingStats(): Promise<TradingStats | null> {
    const connectionManager = ConnectionManager.getInstance(DB_PATH);
    try {
        const db = await connectionManager.getConnection();
        const trades = await db.all('SELECT * FROM simulated_trades');
        connectionManager.releaseConnection(db);

        if (trades.length === 0) return null;

        let totalProfitLoss = Decimal.ZERO;
        let profitableTrades = 0;
        let completedTrades = 0;
        let bestTrade = { token: '', profit: new Decimal(-Infinity) };
        let worstTrade = { token: '', profit: new Decimal(Infinity) };

        trades.forEach(trade => {
            if (!trade.sell_price || !trade.pnl) return;
            
            const profit = new Decimal(trade.pnl);
            totalProfitLoss = totalProfitLoss.add(profit);
            completedTrades++;

            if (profit.isPositive()) profitableTrades++;
            
            if (profit.greaterThan(bestTrade.profit)) {
                bestTrade = { token: trade.token_name, profit };
            }
            if (profit.lessThan(worstTrade.profit)) {
                worstTrade = { token: trade.token_name, profit };
            }
        });

        return {
            totalTrades: completedTrades,
            profitableTrades,
            totalProfitLoss,
            winRate: completedTrades > 0 
                ? new Decimal(profitableTrades).divide(completedTrades).multiply(100)
                : new Decimal(0),
            avgProfitPerTrade: completedTrades > 0
                ? totalProfitLoss.divide(completedTrades)
                : Decimal.ZERO,
            bestTrade,
            worstTrade
        };
    } catch (error) {
        console.error('Error calculating trading stats:', error);
        return null;
    }
}
