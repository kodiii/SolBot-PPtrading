/**
 * Strategy Manager Service
 * Handles execution and coordination of trading strategies
 */

import { config } from '../../config';
import { TokenTracking } from '../../types';
import { IStrategy, MarketData } from '../strategies/types';
import { LiquidityDropStrategy } from '../strategies/liquidity-drop';
import { Decimal } from '../../utils/decimal';

export class StrategyManager {
  private strategies: IStrategy[] = [];
  private serviceId: string = `strategy_manager_${Date.now()}`;

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    if (config.strategies?.liquidity_drop?.enabled) {
      this.strategies.push(new LiquidityDropStrategy(config.strategies.liquidity_drop));
      console.log(`📊 [${this.serviceId}] Liquidity Drop Strategy initialized`);
    }
  }

  public async evaluateStrategies(
    token: TokenTracking,
    marketData: MarketData,
    onSellSignal: (token: TokenTracking, reason: string) => Promise<void>
  ): Promise<void> {
    // Check price targets (stop loss/take profit)
    const priceChangePercent = marketData.current_price
      .subtract(token.buy_price)
      .divide(token.buy_price)
      .multiply(new Decimal(100));

    const stopLossThreshold = new Decimal(-config.sell.stop_loss_percent);
    const takeProfitThreshold = new Decimal(config.sell.take_profit_percent);

    if (priceChangePercent.lessThan(stopLossThreshold)) {
      await onSellSignal(token, `Stop Loss triggered at ${priceChangePercent.toString(4)}% change`);
      return;
    }
    
    if (priceChangePercent.greaterThan(takeProfitThreshold)) {
      await onSellSignal(token, `Take Profit triggered at ${priceChangePercent.toString(4)}% change`);
      return;
    }

    // Execute custom strategies
    for (const strategy of this.strategies) {
      if (strategy.isEnabled()) {
        try {
          const result = await strategy.onMarketData(marketData);
          if (result.shouldSell) {
            await onSellSignal(token, result.reason || "Strategy triggered sell");
            return;
          }
        } catch (error) {
          console.error(`❌ [ERROR][${this.serviceId}] Strategy error:`, error);
        }
      }
    }
  }

  public isDebugEnabled(): boolean {
    return config.strategies.debug || false;
  }
}