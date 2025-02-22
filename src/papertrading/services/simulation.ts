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
  initializePaperTradingDB,
  recordSimulatedTrade,
  getVirtualBalance,
  updateTokenPrice,
  getTrackedTokens,
  getOpenPositionsCount,
  TokenTracking
} from '../paper_trading';
import { Decimal } from '../../utils/decimal';

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
  private solUsdPrice: Decimal | null = null;
  private coinDeskUri: string;
  private db: any; // Database connection instance
  private connectionManager: ConnectionManager;

  private constructor() {
    this.coinDeskUri = process.env.COINDESK_HTTPS_URI || "";
    this.updateSolPrice(); // Initial SOL price fetch
    setInterval(() => this.updateSolPrice(), 60000); // Update SOL price every minute

    if (!this.coinDeskUri) {
      console.error('❌ COINDESK_HTTPS_URI not configured in environment');
    }

    // Initialize database connection
    this.connectionManager = ConnectionManager.getInstance("src/papertrading/db/paper_trading.db");
    
    // Initialize the paper trading database
    initializePaperTradingDB().then(async (success) => {
      if (success) {
        this.db = await this.connectionManager.getConnection();
        console.log('🎮 Paper Trading DB initialized successfully');
        this.startPriceTracking();
      } else {
        console.error('❌ Failed to initialize Paper Trading DB');
      }
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
          const updatedToken = await updateTokenPrice(token.token_mint, priceData.price);
          if (updatedToken) {
            await this.checkPriceTargets(updatedToken);
          }
        }
      }
    }, config.paper_trading.price_check.max_delay); // Every 5 seconds
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
      if (config.paper_trading.verbose_log) {
        console.log(`🔍 Fetching price for token: ${tokenMint}${attempt > 1 ? ` (Attempt ${attempt}/${config.paper_trading.price_check.max_retries})` : ''}`);
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
        if (raydiumPair?.priceUsd) {
          return {
            price: new Decimal(raydiumPair.priceUsd),
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
    // Calculate current price change percentage from buy price
    const priceChangePercent = token.current_price.subtract(token.buy_price).divide(token.buy_price).multiply(new Decimal(100));
    const stopLossThreshold = new Decimal(-config.sell.stop_loss_percent);
    const takeProfitThreshold = new Decimal(config.sell.take_profit_percent);

    // Stop loss triggered if price drops by configured percentage or more
    if (priceChangePercent.lessThan(stopLossThreshold) || priceChangePercent.equals(stopLossThreshold)) {
      await this.executeSell(token, `Stop Loss triggered at ${priceChangePercent.toString(2)}% change`);
    }
    // Take profit triggered if price increases by configured percentage or more
    else if (priceChangePercent.greaterThan(takeProfitThreshold) || priceChangePercent.equals(takeProfitThreshold)) {
      await this.executeSell(token, `Take Profit triggered at ${priceChangePercent.toString(2)}% change`);
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

  // Use fixed amount from config
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

  // Calculate token amount with slippage-adjusted price
  const amountTokens = amountInSol.divide(priceWithSlippage);

    // Get DexScreener data for the token
    const priceData = await this.getTokenPrice(tokenMint);
    if (!priceData) {
      console.log('❌ Could not get token price data');
      return false;
    }

    const success = await recordSimulatedTrade({
      timestamp: Date.now(),
      token_mint: tokenMint,
      token_name: priceData.symbol || tokenName, // Use symbol from DexScreener if available
      amount_sol: amountInSol,
      amount_token: amountTokens,
      price_per_token: priceWithSlippage, // Store slippage-adjusted price
      type: 'buy',
      fees: fees,
      slippage: randomSlippage,
      dex_data: priceData.dexData
    });

    if (success) {
      console.log(`🎯 Simulated slippage: ${randomSlippage.multiply(100).toString(4)}%`);
      console.log(`🎮 Paper Trade: Bought ${amountTokens.toString(2)} ${tokenName} tokens`);
      console.log(`💰 Original price: $${currentPrice.toString()}`);
      console.log(`💰 Price with slippage: $${priceWithSlippage.toString()}`);
      console.log(`🏦 Total spent: ${amountInSol.toString(4)} SOL (+ ${fees.toString()} SOL fees)`);
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

    // Get the buy trade to calculate total slippage
    const buyTrade = await this.db.get(
      'SELECT slippage FROM simulated_trades WHERE token_mint = ? AND type = "buy" ORDER BY timestamp DESC LIMIT 1',
      [token.token_mint]
    );
    const buySlippage = buyTrade ? new Decimal(buyTrade.slippage) : new Decimal(0);
    const totalSlippage = buySlippage.add(randomSlippage);

    console.log(`🎯 Simulated sell slippage: ${randomSlippage.multiply(100).toString(4)}%`);
    console.log(`🎯 Total trade slippage (buy+sell): ${totalSlippage.multiply(100).toString(4)}%`);
    
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
      timestamp: Date.now(),
      token_mint: token.token_mint,
      token_name: token.token_name,
      amount_sol: amountInSol,
      amount_token: token.amount,
      price_per_token: priceWithSlippage,
      type: 'sell',
      fees: fees,
      slippage: totalSlippage, // Store combined buy+sell slippage
      dex_data: priceData.dexData // Ensure we're storing the latest liquidity data
    });

    if (success) {
      console.log(`🎮 Paper Trade: ${reason}`);
      console.log(`📈 Sold ${token.amount.toString(2)} ${token.token_name} tokens`);
      console.log(`💰 Original price: $${token.current_price.toString()}`);
      console.log(`💰 Price with slippage: $${priceWithSlippage.toString()}`);
      console.log(`🏦 Total received: ${amountInSol.toString(4)} SOL (- ${fees.toString()} SOL fees)`);
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

      if (response.data?.Data?.['SOL-USD']?.VALUE) {
        const solPrice = response.data.Data['SOL-USD'].VALUE;
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