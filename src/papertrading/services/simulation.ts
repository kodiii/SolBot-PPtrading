/**
 * @file simulation.ts
 * @description Paper Trading Simulation Service for Solana tokens
 * This service provides functionality for simulating trades, tracking prices,
 * and executing automated trading strategies in a paper trading environment.
 * It uses DexScreener API for real-time price data and CoinDesk for SOL/USD prices.
 */

import axios from 'axios';
import { config } from '../../config';
import { ConnectionManager } from '../db/connection_manager';
import {
  recordSimulatedTrade,
  getVirtualBalance,
  updateTokenPrice,
  getTrackedTokens,
  getOpenPositionsCount,
  TokenTracking
} from '../paper_trading';
import { Decimal } from '../../utils/decimal';
import { LiquidityDropStrategy } from '../strategies/liquidity-drop';
import { IStrategy, MarketData } from '../strategies/types';

/**
 * Interface representing the structure of a trading pair from DexScreener API
 * Contains detailed information about the trading pair including price, volume,
 * and liquidity metrics
 */
interface DexscreenerPairInfo {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number; };
    h1: { buys: number; sells: number; };
    h6: { buys: number; sells: number; };
    h24: { buys: number; sells: number; };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
}

/** Array type for DexScreener API response */
type DexscreenerPriceResponse = DexscreenerPairInfo[];

/**
 * SimulationService class implements paper trading functionality
 * Uses Singleton pattern to ensure only one instance manages the simulation
 */
export class SimulationService {
  private static instance: SimulationService;
  private priceCheckInterval: NodeJS.Timeout | null = null;
  private lastPrices: Map<string, Decimal> = new Map();
  private lastLogTime: Map<string, number> = new Map(); // Track last log time per token
  private solUsdPrice: Decimal | null = null;
  private coinDeskUri: string;
  private LOG_THROTTLE_MS = 10000; // Only log once every 10 seconds per token
  private db: any; // Database connection instance
  private connectionManager: ConnectionManager;
  private strategies: IStrategy[] = [];

  /**
   * Initialize trading strategies based on configuration
   */
  private initializeStrategies(): void {
    if (config.strategies?.liquidity_drop?.enabled) {
      this.strategies.push(new LiquidityDropStrategy(config.strategies.liquidity_drop));
      console.log('📊 Liquidity Drop Strategy initialized');
    }
  }

  /**
   * Check all active strategies with current market data
   * @param marketData Current market data for the token
   */
  private async checkStrategies(marketData: MarketData): Promise<void> {
    for (const strategy of this.strategies) {
      if (strategy.isEnabled()) {
        try {
          const result = await strategy.onMarketData(marketData);
          if (result.shouldSell) {
            const token = await getTrackedTokens().then(tokens =>
              tokens.find(t => t.token_mint === marketData.token_mint)
            );
            if (token) {
              await this.executeSell(token, result.reason || 'Strategy triggered sell');
            }
          }
        } catch (error) {
          console.error(`❌ Error in strategy ${strategy.getName()}:`, error);
        }
      }
    }
  }

  private constructor() {
    // Initialize strategies
    this.initializeStrategies();
    this.coinDeskUri = process.env.COINDESK_HTTPS_URI || "";
    this.updateSolPrice(); // Initial SOL price fetch
    setInterval(() => this.updateSolPrice(), 60000); // Update SOL price every minute

    if (!this.coinDeskUri) {
      console.error('❌ COINDESK_HTTPS_URI not configured in environment');
    }

    // Initialize database connection
    this.connectionManager = ConnectionManager.getInstance("src/papertrading/db/paper_trading.db");
    
    // Get database connection
    this.connectionManager.getConnection().then(db => {
      this.db = db;
      console.log('🎮 Paper Trading Service initialized successfully');
      this.startPriceTracking();
    }).catch(error => {
      console.error('❌ Failed to get database connection:', error);
    });
  }

  /**
   * Gets the singleton instance of SimulationService
   * @returns The singleton instance
   */
  public static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  /**
   * Starts tracking prices for all tracked tokens
   * Polls prices every 5 seconds and triggers price target checks
   */
  private async startPriceTracking(): Promise<void> {
    this.priceCheckInterval = setInterval(async () => {
      const tokens = await getTrackedTokens();
      for (const token of tokens) {
        const priceData = await this.getTokenPrice(token.token_mint);
        if (priceData && priceData.price) {
          // Log market metrics only when there are significant changes
          const previousPriceData = this.lastPrices.get(token.token_mint);
          if (priceData.dexData && (!previousPriceData || !priceData.price.equals(previousPriceData))) {
            this.lastPrices.set(token.token_mint, priceData.price);
            if (config.paper_trading.verbose_log) {
              console.log(`📊 Market Data for ${token.token_name}:`);
              console.log(`   Volume (5m): $${priceData.dexData.volume_m5.toLocaleString()}`);
              console.log(`   Market Cap: $${priceData.dexData.marketCap.toLocaleString()}`);
              console.log(`   Liquidity: $${priceData.dexData.liquidity_usd.toLocaleString()}`);
            }
          }

          // Store market data and update price, then check strategies
          await this.db.run(
            `UPDATE token_tracking
             SET volume_m5 = ?,
                 market_cap = ?,
                 liquidity_usd = ?
             WHERE token_mint = ?`,
            [
              priceData.dexData?.volume_m5 || 0,
              priceData.dexData?.marketCap || 0,
              priceData.dexData?.liquidity_usd || 0,
              token.token_mint
            ]
          );

          const updatedToken = await updateTokenPrice(token.token_mint, priceData.price);
          if (updatedToken) {
            // Check standard price targets (stop loss/take profit)
            await this.checkPriceTargets(updatedToken);

            // Feed market data to active strategies
            await this.checkStrategies({
              token_mint: token.token_mint,
              token_name: token.token_name,
              current_price: priceData.price,
              volume_m5: priceData.dexData?.volume_m5 || 0,
              marketCap: priceData.dexData?.marketCap || 0,
              liquidity_usd: priceData.dexData?.liquidity_usd || 0,
              timestamp: Date.now()
            });
          }
        }
      }
    }, config.paper_trading.real_data_update);
  }

  /**
   * Utility method to create a delay
   * @param ms Delay duration in milliseconds
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetches current token price from DexScreener
   * Implements retry logic for failed requests
   * @param tokenMint Token mint address
   * @param retryCount Current retry attempt number
   * @returns Current token price or null if unavailable
   */
  public async getTokenPrice(tokenMint: string, retryCount = 0): Promise<{ price: Decimal; symbol?: string; dexData?: { volume_m5: number; marketCap: number; liquidity_usd: number; } } | null> {
    try {
      const attempt = retryCount + 1;
      const now = Date.now();
      const lastLog = this.lastLogTime.get(tokenMint) || 0;
      
      // Only log if enough time has passed since last log
      if (now - lastLog > this.LOG_THROTTLE_MS) {
        if (attempt > 1) {
          console.log(`🔍 Fetching price (Attempt ${attempt}/${config.paper_trading.price_check.max_retries}) for token: ${tokenMint}`);
        }
        this.lastLogTime.set(tokenMint, now);
      }
      
      const response = await axios.get<DexscreenerPriceResponse>(
        `https://api.dexscreener.com/token-pairs/v1/solana/${tokenMint}`,
        { timeout: config.tx.get_timeout }
      );

      if (config.paper_trading.verbose_log) {
        console.log(`📊 DexScreener response:`, JSON.stringify(response.data, null, 2));
      }

      if (response.data && response.data.length > 0) {
        // Find Raydium pair
        const raydiumPair = response.data.find(pair => pair.dexId === 'raydium');
        if (raydiumPair?.priceNative) {
          return {
            price: new Decimal(raydiumPair.priceNative),
            symbol: raydiumPair.baseToken.symbol,
            dexData: {
              volume_m5: raydiumPair.volume?.m5 || 0,
              marketCap: raydiumPair.marketCap || 0,
              liquidity_usd: raydiumPair.liquidity?.usd || 0
            }
          };
        }
        console.log('⚠️ No Raydium pair found');
      }

      // If we haven't exceeded max retries and response indicates no pairs yet
      if (retryCount < config.paper_trading.price_check.max_retries - 1) {
        const delayMs = Math.min(
          config.paper_trading.price_check.initial_delay * Math.pow(1.5, retryCount),
          config.paper_trading.price_check.max_delay
        );
        console.log(`⏳ No price data yet, retrying in ${delayMs/1000} seconds...`);
        await this.delay(delayMs);
        return this.getTokenPrice(tokenMint, retryCount + 1);
      }

      console.log('❌ No valid price data found after all retries');
      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('🚨 DexScreener API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });

        // If we haven't exceeded max retries and it's a potentially temporary error
        if (retryCount < config.paper_trading.price_check.max_retries - 1 && 
            (error.response?.status === 429 || error.response?.status === 503)) {
          const delayMs = Math.min(
            config.paper_trading.price_check.initial_delay * Math.pow(1.5, retryCount),
            config.paper_trading.price_check.max_delay
          );
          console.log(`⏳ API error, retrying in ${delayMs/1000} seconds...`);
          await this.delay(delayMs);
          return this.getTokenPrice(tokenMint, retryCount + 1);
        }
      } else {
        console.error('❌ Error fetching token price:', error);
      }
      return null;
    }
  }

  /**
   * Checks if price targets (stop loss/take profit) have been reached
   * Executes sell orders when targets are hit
   * @param token Token tracking information
   */
  private async checkPriceTargets(token: TokenTracking): Promise<void> {
    // Only log price changes if there is a significant movement
    const priceChangePercent = token.current_price
      .subtract(token.buy_price)
      .divide(token.buy_price)
      .multiply(new Decimal(100));

    const stopLossThreshold = new Decimal(-config.sell.stop_loss_percent);
    const takeProfitThreshold = new Decimal(config.sell.take_profit_percent);

    // Log price changes when approaching/exceeding thresholds and respecting throttle
    const approachingThreshold = stopLossThreshold.multiply(0.8).abs(); // 80% of stop loss
    const now = Date.now();
    const lastLog = this.lastLogTime.get(token.token_mint) || 0;

    if (priceChangePercent.abs().greaterThan(approachingThreshold) &&
        (now - lastLog > this.LOG_THROTTLE_MS)) {
      console.log(`📊 Price Change: ${priceChangePercent.toString(4)}% (${token.buy_price.toString(8)} -> ${token.current_price.toString(8)} SOL)`);
      this.lastLogTime.set(token.token_mint, now);
    }

    // Stop loss triggered if price drops by configured percentage or more
    if (priceChangePercent.lessThan(stopLossThreshold) || priceChangePercent.equals(stopLossThreshold)) {
      await this.executeSell(token, `Stop Loss triggered at ${priceChangePercent.toString(4)}% change`);
    }
    // Take profit triggered if price increases by configured percentage or more
    else if (priceChangePercent.greaterThan(takeProfitThreshold) || priceChangePercent.equals(takeProfitThreshold)) {
      await this.executeSell(token, `Take Profit triggered at ${priceChangePercent.toString(4)}% change`);
    }
  }

  /**
   * Executes a simulated buy order
   * Checks position limits and available balance before executing
   * @param tokenMint Token mint address
   * @param tokenName Token name
   * @param currentPrice Current token price
   * @returns Success status of the buy operation
   */
  public async executeBuy(
    tokenMint: string,
    tokenName: string,
    currentPrice: Decimal
  ): Promise<boolean> {
    // Check positions limit
    const openPositions = await getOpenPositionsCount();
    if (openPositions >= config.swap.max_open_positions) {
      console.log(`❌ Maximum open positions limit (${config.swap.max_open_positions}) reached`);
      return false;
    }

    const balance = await getVirtualBalance();
    if (!balance) {
      console.log('❌ Could not get virtual balance');
      return false;
    }

    // Convert configured lamport amount to SOL
    const amountInSol = new Decimal(config.swap.amount).divide(Decimal.LAMPORTS_PER_SOL);
    const fees = new Decimal(config.swap.prio_fee_max_lamports).divide(Decimal.LAMPORTS_PER_SOL);

    if (balance.balance_sol.lessThan(amountInSol.add(fees))) {
      console.log('❌ Insufficient virtual balance for trade');
      return false;
    }

    // Apply slippage to simulate real market conditions
    const slippageBps = new Decimal(config.swap.slippageBps);
    const maxSlippage = slippageBps.divide(10000); // Convert basis points to decimal (200 -> 0.02)
    const randomSlippage = maxSlippage.multiply(new Decimal(Math.random())); // Random slippage between 0 and max
    const priceWithSlippage = currentPrice.multiply(Decimal.ONE.add(randomSlippage));

    // Calculate token amount with slippage-adjusted price (price is already in SOL)
    const amountTokens = amountInSol.divide(priceWithSlippage);
    console.log(`💱 Token price in SOL: ${currentPrice.toString(8)} SOL`);

    // Get DexScreener data for the token
    const priceData = await this.getTokenPrice(tokenMint);
    if (!priceData) {
      console.log('❌ Could not get token price data');
      return false;
    }

    const success = await recordSimulatedTrade({
      token_name: priceData.symbol || tokenName,
      token_mint: tokenMint,
      amount_sol: amountInSol,
      amount_token: amountTokens,
      buy_price: priceWithSlippage,
      buy_fees: fees,
      buy_slippage: randomSlippage,
      time_buy: Date.now(),
      dex_data: {
        volume_m5: priceData.dexData?.volume_m5 || 0,
        marketCap: priceData.dexData?.marketCap || 0,
        liquidity_buy_usd: priceData.dexData?.liquidity_usd || 0
      }
    });

    if (success) {
      console.log(`🎯 Simulated slippage: ${randomSlippage.multiply(100).toString(4)}%`);
      console.log(`🎮 Paper Trade: Bought ${amountTokens.toString(8)} ${tokenName} tokens`);
      console.log(`💰 Original price: ${currentPrice.toString(8)} SOL`);
      console.log(`💰 Price with slippage: ${priceWithSlippage.toString(8)} SOL`);
      console.log(`🏦 Total spent: ${amountInSol.toString(8)} SOL (+ ${fees.toString(8)} SOL fees)`);
      return true;
    }

    return false;
  }

  /**
   * Executes a simulated sell order
   * @param token Token tracking information
   * @param reason Reason for the sell (e.g., "Stop Loss triggered")
   * @returns Success status of the sell operation
   */
  private async executeSell(
    token: TokenTracking,
    reason: string
  ): Promise<boolean> {
    // Apply slippage to simulate real market conditions
    const slippageBps = new Decimal(config.sell.slippageBps);
    const maxSlippage = slippageBps.divide(10000); // Convert basis points to decimal (200 -> 0.02)
    const randomSlippage = maxSlippage.multiply(new Decimal(Math.random())); // Random slippage between 0 and max
    const priceWithSlippage = token.current_price.multiply(Decimal.ONE.subtract(randomSlippage));

    const amountInSol = token.amount.multiply(priceWithSlippage);
    const fees = new Decimal(config.sell.prio_fee_max_lamports).divide(Decimal.LAMPORTS_PER_SOL);

    // Get DexScreener data for the token
    const priceData = await this.getTokenPrice(token.token_mint);
    if (!priceData) {
      console.log('❌ Could not fetch token price and liquidity data for sell operation');
      return false;
    }

    // Log liquidity information
    if (priceData.dexData) {
      console.log(`💧 Current Liquidity: $${priceData.dexData.liquidity_usd.toLocaleString()}`);
      console.log(`📊 5m Volume: $${priceData.dexData.volume_m5.toLocaleString()}`);
      console.log(`💰 Market Cap: $${priceData.dexData.marketCap.toLocaleString()}`);
    }

    const success = await recordSimulatedTrade({
      token_name: token.token_name,
      token_mint: token.token_mint,
      amount_sol: amountInSol,
      amount_token: token.amount,
      buy_price: token.buy_price,
      buy_fees: token.buy_fees,
      buy_slippage: token.buy_slippage,
      sell_price: priceWithSlippage,
      sell_fees: fees,
      sell_slippage: randomSlippage,
      time_buy: token.time_buy,
      time_sell: Date.now(),
      dex_data: {
        volume_m5: priceData.dexData?.volume_m5 || 0,
        marketCap: priceData.dexData?.marketCap || 0,
        liquidity_buy_usd: priceData.dexData?.liquidity_usd || 0,
        liquidity_sell_usd: priceData.dexData?.liquidity_usd || 0
      }
    });

    if (success) {
      console.log(`🎮 Paper Trade: ${reason}`);
      console.log(`📈 Sold ${token.amount.toString(8)} ${token.token_name} tokens`);
      console.log(`💰 Original price: ${token.current_price.toString(8)} SOL`);
      console.log(`💰 Price with slippage: ${priceWithSlippage.toString(8)} SOL`);
      console.log(`🏦 Total received: ${amountInSol.toString(8)} SOL (- ${fees.toString(8)} SOL fees)`);
      return true;
    }

    return false;
  }

  /**
   * Updates the current SOL/USD price from CoinDesk
   * Price is updated every minute and used for USD value calculations
   */
  private async updateSolPrice(): Promise<void> {
    try {
      if (!this.coinDeskUri) {
        console.error('❌ Cannot fetch SOL price: COINDESK_HTTPS_URI not configured');
        return;
      }

      const response = await axios.get(
        this.coinDeskUri,
        { timeout: config.tx.get_timeout }
      );

      // Adjusted response parsing to match the actual Coindesk format
      if (response.data?.solana?.usd) {
        const solPrice = response.data.solana.usd;
        this.solUsdPrice = new Decimal(solPrice);
        
        if (config.paper_trading.verbose_log) {
          console.log(`💰 Updated SOL price: $${this.solUsdPrice.toString()}`);
        }
      } else {
        console.error('❌ Invalid price data format from Coindesk:', response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Coindesk API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      } else {
        console.error('❌ Error fetching SOL price:', error);
      }
    }
}

  public getSolUsdPrice(): Decimal | null {
    return this.solUsdPrice;
  }

  public cleanup(): void {
    if (this.priceCheckInterval) {
      clearInterval(this.priceCheckInterval);
      this.priceCheckInterval = null;
    }
  }
}