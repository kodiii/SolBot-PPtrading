import { Decimal } from "../../utils/decimal";

/**
 * Base interface for strategy configuration
 */
export interface BaseStrategyConfig {
  enabled: boolean;
}

/**
 * Configuration for liquidity drop strategy
 */
export interface LiquidityDropStrategyConfig extends BaseStrategyConfig {
  threshold_percent: number;
}

/**
 * Market data provided to strategies
 */
export interface MarketData {
  token_mint: string;
  token_name: string;
  current_price: Decimal;
  volume_m5: number;
  marketCap: number;
  liquidity_usd: number;
  timestamp: number;
}

/**
 * Result returned by strategy evaluation
 */
export interface StrategyResult {
  shouldSell: boolean;
  reason?: string;
  tokenMint: string;
}

/**
 * Interface that all strategies must implement
 */
export interface IStrategy {
  onMarketData(data: MarketData): Promise<StrategyResult>;
  getName(): string;
  getDescription(): string;
  isEnabled(): boolean;
}