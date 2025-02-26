import { BaseStrategyConfig, IStrategy, MarketData, StrategyResult } from "./types";

/**
 * Abstract base class for trading strategies
 * Provides common functionality and enforces strategy contract
 */
export abstract class BaseStrategy implements IStrategy {
  protected config: BaseStrategyConfig;
  protected lastCheck: Map<string, number> = new Map();

  constructor(config: BaseStrategyConfig) {
    this.config = config;
  }

  /**
   * Process new market data and determine if action is needed
   * @param data Current market data
   */
  abstract onMarketData(data: MarketData): Promise<StrategyResult>;

  /**
   * Get the strategy name
   */
  abstract getName(): string;

  /**
   * Get the strategy description
   */
  abstract getDescription(): string;

  /**
   * Check if the strategy is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the strategy configuration
   */
  protected getConfig(): BaseStrategyConfig {
    return this.config;
  }

  /**
   * Helper to create a sell signal
   */
  protected createSellSignal(tokenMint: string, reason: string): StrategyResult {
    return {
      shouldSell: true,
      reason,
      tokenMint
    };
  }

  /**
   * Helper to create a hold signal
   */
  protected createHoldSignal(tokenMint: string): StrategyResult {
    return {
      shouldSell: false,
      tokenMint
    };
  }

  /**
   * Check if enough time has passed since last check for a token
   * @param tokenMint Token to check
   * @param interval Minimum time between checks
   */
  protected shouldCheck(tokenMint: string, interval: number): boolean {
    const now = Date.now();
    const lastCheck = this.lastCheck.get(tokenMint) || 0;
    
    if (now - lastCheck >= interval) {
      this.lastCheck.set(tokenMint, now);
      return true;
    }
    
    return false;
  }
}