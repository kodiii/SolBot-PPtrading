import { Decimal } from "../../utils/decimal";

/**
 * Market data from dexscreener
 */
export interface DexScreenerData {
    volume_m5: number;
    marketCap: number;
    liquidity_usd: number;
    liquidity_usd_sell?: number;
}

/**
 * Active trading position for a token
 */
export interface TokenPosition {
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
    liquidity_usd?: number;
}

/**
 * Completed trade in the paper trading system
 */
export interface SimulatedTrade {
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
 * Aggregated statistics for trading performance analysis
 */
export interface TradingStats {
    totalTrades: number;
    profitableTrades: number;
    totalProfitLoss: Decimal;
    winRate: Decimal;
    avgProfitPerTrade: Decimal;
    bestTrade: { token: string; profit: Decimal };
    worstTrade: { token: string; profit: Decimal };
}