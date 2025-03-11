/**
 * Trading service that unifies paper and real trading functionality
 */

import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import { config } from "../config";
import { SimulationService } from "../papertrading/services";
import { IStrategy, MarketData } from "../papertrading/strategies/types";
import { LiquidityDropStrategy } from "../papertrading/strategies/liquidity-drop";
import { Decimal } from "../utils/decimal";
import { createSellTransaction } from "../transactions/sell";
import { getTrackedTokens } from "../papertrading/paper_trading";
import { TokenTracking } from "../types";
import bs58 from "bs58";

export class TradingService {
  private static instance: TradingService;
  private simulationService: SimulationService;
  private strategies: IStrategy[] = [];
  private priceCheckInterval: NodeJS.Timeout | null = null;
  private serviceId: string = `trading_service_${Date.now()}`;

  private constructor() {
    this.simulationService = SimulationService.getInstance();
    this.initializeStrategies();
  }

  public static getInstance(): TradingService {
    if (!TradingService.instance) {
      TradingService.instance = new TradingService();
    }
    return TradingService.instance;
  }

  private initializeStrategies(): void {
    if (config.strategies?.liquidity_drop?.enabled) {
      this.strategies.push(new LiquidityDropStrategy(config.strategies.liquidity_drop));
      console.log(`📊 [${this.serviceId}] Liquidity Drop Strategy initialized`);
    }
  }

  public async startMonitoring(): Promise<void> {
    console.log(`\n🔍 [${this.serviceId}] Starting real-time monitoring`);

    this.priceCheckInterval = setInterval(async () => {
      const tokens = await getTrackedTokens();

      for (const token of tokens) {
        const priceData = await this.simulationService.getTokenPrice(token.token_mint);
        if (!priceData?.price) continue;

        await this.checkPriceTargets(token.token_mint, token.token_name, priceData.price);
        
        if (priceData.dexData) {
          await this.checkStrategies({
            token_mint: token.token_mint,
            token_name: token.token_name,
            current_price: priceData.price,
            volume_m5: priceData.dexData.volume_m5,
            marketCap: priceData.dexData.marketCap,
            liquidity_usd: priceData.dexData.liquidity_usd,
            timestamp: Date.now()
          });
        }
      }
    }, config.paper_trading.real_data_update);
  }

  private async checkPriceTargets(tokenMint: string, tokenName: string, currentPrice: Decimal): Promise<void> {
    const tokens = await getTrackedTokens();
    const token = tokens.find(t => t.token_mint === tokenMint);
    if (!token) return;

    const priceChangePercent = currentPrice
      .subtract(token.buy_price)
      .divide(token.buy_price)
      .multiply(new Decimal(100));

    const stopLossThreshold = new Decimal(-config.sell.stop_loss_percent);
    const takeProfitThreshold = new Decimal(config.sell.take_profit_percent);

    if (priceChangePercent.lessThan(stopLossThreshold)) {
      await this.executeSell({
        ...token,
        current_price: currentPrice
      }, `Stop Loss triggered at ${priceChangePercent.toString(4)}% change`);
    }
    else if (priceChangePercent.greaterThan(takeProfitThreshold)) {
      await this.executeSell({
        ...token,
        current_price: currentPrice
      }, `Take Profit triggered at ${priceChangePercent.toString(4)}% change`);
    }
  }

  private async checkStrategies(marketData: MarketData): Promise<void> {
    for (const strategy of this.strategies) {
      if (strategy.isEnabled()) {
        try {
          const result = await strategy.onMarketData(marketData);
          if (result.shouldSell) {
            const tokens = await getTrackedTokens();
            const token = tokens.find(t => t.token_mint === marketData.token_mint);
            if (token) {
              await this.executeSell({
                ...token,
                current_price: marketData.current_price
              }, result.reason || 'Strategy triggered sell');
            }
          }
        } catch (error) {
          console.error(`❌ [${this.serviceId}] Strategy error:`, error);
        }
      }
    }
  }

  private async executeSell(token: TokenTracking, reason: string): Promise<void> {
    if (config.rug_check.simulation_mode) {
      // Use paper trading sell
      await this.simulationService.executeSell(token, reason);
    } else {
      // Execute real sell transaction
      console.log(`\n🔄 Executing sell: ${reason}`);
      const rpcUrl = process.env.HELIUS_HTTPS_URI || "";
      const connection = new Connection(rpcUrl);
      const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIV_KEY_WALLET || "")));

      const result = await createSellTransaction(
        config.liquidity_pool.wsol_pc_mint,
        token.token_mint,
        token.amount.toString()
      );

      if (result.success) {
        console.log(`✅ Sell transaction successful: ${result.tx}`);
      } else {
        console.error(`❌ Sell transaction failed: ${result.msg}`);
      }
    }
  }

  public cleanup(): void {
    if (this.priceCheckInterval) {
      clearInterval(this.priceCheckInterval);
      this.priceCheckInterval = null;
    }
  }
}