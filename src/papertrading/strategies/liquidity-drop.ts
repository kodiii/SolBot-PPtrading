import { BaseStrategy } from "./base-strategy";
import { LiquidityDropStrategyConfig, MarketData, StrategyResult } from "./types";
import { ConnectionManager } from "../db/connection_manager";
import { config } from "../../config";

/**
 * Strategy that monitors for significant drops in token liquidity
 * Uses existing market data from database to avoid duplicate monitoring
 */
export class LiquidityDropStrategy extends BaseStrategy {
  protected config: LiquidityDropStrategyConfig;
  private connectionManager: ConnectionManager;
  private db: any;

  constructor(config: LiquidityDropStrategyConfig) {
    super(config);
    this.config = config;
    this.connectionManager = ConnectionManager.getInstance("src/papertrading/db/paper_trading.db");
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      this.db = await this.connectionManager.getConnection();
    } catch (error) {
      console.error('❌ Failed to get database connection in LiquidityDropStrategy:', error);
    }
  }

  getName(): string {
    return "Liquidity Drop Strategy";
  }

  getDescription(): string {
    return `Monitors token liquidity and sells if it drops by ${this.config.threshold_percent}% or more`;
  }

  /**
   * Process market data and check for liquidity drops using DB history
   * Uses paper_trading.real_data_update interval from main config
   * @param data Current market data
   */
  async onMarketData(data: MarketData): Promise<StrategyResult> {
    const { token_mint, token_name } = data;

    // Only check at configured intervals from paper_trading settings
    if (!this.shouldCheck(token_mint, config.paper_trading.real_data_update)) {
      return this.createHoldSignal(token_mint);
    }

    if (!this.db) {
      console.error('❌ No database connection available');
      return this.createHoldSignal(token_mint);
    }

    try {
      // Get highest liquidity from database
      const highestLiquidity = await this.db.get(
        `SELECT MAX(liquidity_usd) as highest_liquidity 
         FROM token_tracking 
         WHERE token_mint = ?`,
        [token_mint]
      );

      if (!highestLiquidity?.highest_liquidity) {
        return this.createHoldSignal(token_mint);
      }

      // Calculate drop from highest point
      const currentLiquidity = data.liquidity_usd;
      const dropPercent = ((highestLiquidity.highest_liquidity - currentLiquidity) / highestLiquidity.highest_liquidity) * 100;

      // Check if drop exceeds threshold
      if (dropPercent >= this.config.threshold_percent) {
        const reason = `${token_name}: Liquidity dropped by ${dropPercent.toFixed(2)}% ` +
                      `(${currentLiquidity.toLocaleString()} USD from ${highestLiquidity.highest_liquidity.toLocaleString()} USD high)`;
        return this.createSellSignal(token_mint, reason);
      }

      return this.createHoldSignal(token_mint);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error checking liquidity drop: ${errorMessage}`);
      return this.createHoldSignal(token_mint);
    }
  }
}