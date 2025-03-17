/**
 * Paper trading simulation service implementation
 */
import { config } from '../../config';
import { Decimal } from '../../utils/decimal';
import { ISimulationService, TokenPriceData } from './types';
import { PriceTracker } from './price-tracker';
import { TradeExecutor } from './trade-executor';
import { StrategyManager } from './strategy-manager';

export class SimulationService implements ISimulationService {
  private static instance: SimulationService;
  private readonly priceTracker: PriceTracker;
  private readonly tradeExecutor: TradeExecutor;
  private readonly strategyManager: StrategyManager;

  private constructor() {
    this.priceTracker = new PriceTracker();
    this.tradeExecutor = new TradeExecutor();
    this.strategyManager = new StrategyManager();
  }

  /**
   * Get singleton instance
   * @returns SimulationService instance
   */
  public static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  /**
   * Get current token price from DEX
   * @param tokenMint Token mint address
   * @param retryCount Number of retry attempts
   * @returns Token price data or null if not found
   */
  public async getTokenPrice(tokenMint: string, retryCount = 0): Promise<TokenPriceData | null> {
    return this.priceTracker.getTokenPrice(tokenMint, retryCount);
  }

  /**
   * Get current SOL/USD price
   * @returns SOL price in USD or null if not available
   */
  public getSolUsdPrice(): Decimal | null {
    return this.priceTracker.getSolUsdPrice();
  }

  /**
   * Execute simulated buy operation
   * @param tokenMint Token mint address
   * @param tokenName Token name
   * @param currentPrice Current token price
   * @returns Success status
   */
  public async executeBuy(tokenMint: string, tokenName: string, currentPrice: Decimal): Promise<boolean> {
    return this.tradeExecutor.executeBuy(tokenMint, tokenName, currentPrice);
  }

  /**
   * Execute simulated sell operation
   * @param token Token data
   * @param reason Sell reason
   * @returns Success status
   */
  public async executeSell(token: any, reason: string): Promise<boolean> {
    return this.tradeExecutor.executeSell(token, reason);
  }

  /**
   * Clean up service resources
   */
  public cleanup(): void {
    if (config.paper_trading.verbose_log) {
      console.log('Simulation service cleanup completed');
    }
  }
}
