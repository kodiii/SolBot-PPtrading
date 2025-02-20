import axios from 'axios';
import { config } from '../../config';
import {
  initializePaperTradingDB,
  recordSimulatedTrade,
  getVirtualBalance,
  updateTokenPrice,
  getTrackedTokens,
  TokenTracking
} from '../paper_trading';
import { Decimal } from '../../utils/decimal';

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

type DexscreenerPriceResponse = DexscreenerPairInfo[];

export class SimulationService {
  private static instance: SimulationService;
  private priceCheckInterval: NodeJS.Timeout | null = null;
  private lastPrices: Map<string, Decimal> = new Map();
  private solUsdPrice: Decimal | null = null;

  private constructor() {
    this.updateSolPrice(); // Initial SOL price fetch
    setInterval(() => this.updateSolPrice(), 60000); // Update SOL price every minute
    // Initialize the paper trading database
    initializePaperTradingDB().then((success) => {
      if (success) {
        console.log('🎮 Paper Trading DB initialized successfully');
        this.startPriceTracking();
      } else {
        console.error('❌ Failed to initialize Paper Trading DB');
      }
    });
  }

  public static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  private async startPriceTracking(): Promise<void> {
    // Check prices
    this.priceCheckInterval = setInterval(async () => {
      const tokens = await getTrackedTokens();
      for (const token of tokens) {
        const currentPrice = await this.getTokenPrice(token.token_mint);
        if (currentPrice) {
          const updatedToken = await updateTokenPrice(token.token_mint, currentPrice);
          if (updatedToken) {
            await this.checkPriceTargets(updatedToken);
          }
        }
      }
    }, 1000); // Every second
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async getTokenPrice(tokenMint: string, retryCount = 0): Promise<Decimal | null> {
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
          return new Decimal(raydiumPair.priceUsd);
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

  public async executeBuy(
    tokenMint: string,
    tokenName: string,
    currentPrice: Decimal
  ): Promise<boolean> {
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

    const amountTokens = amountInSol.divide(currentPrice);

    const success = await recordSimulatedTrade({
      timestamp: Date.now(),
      token_mint: tokenMint,
      token_name: tokenName,
      amount_sol: amountInSol,
      amount_token: amountTokens,
      price_per_token: currentPrice,
      type: 'buy',
      fees: fees
    });

    if (success) {
      console.log(`🎮 Paper Trade: Bought ${amountTokens.toString(2)} ${tokenName} tokens`);
      console.log(`💰 Price per token: $${currentPrice.toString()}`);
      console.log(`🏦 Total spent: ${amountInSol.toString(4)} SOL (+ ${fees.toString()} SOL fees)`);
      return true;
    }

    return false;
  }

  private async executeSell(
    token: TokenTracking,
    reason: string
  ): Promise<boolean> {
    const amountInSol = token.amount.multiply(token.current_price);
    const fees = new Decimal(config.sell.prio_fee_max_lamports).divide(Decimal.LAMPORTS_PER_SOL);

    const success = await recordSimulatedTrade({
      timestamp: Date.now(),
      token_mint: token.token_mint,
      token_name: token.token_name,
      amount_sol: amountInSol,
      amount_token: token.amount,
      price_per_token: token.current_price,
      type: 'sell',
      fees: fees
    });

    if (success) {
      console.log(`🎮 Paper Trade: ${reason}`);
      console.log(`📈 Sold ${token.amount.toString(2)} ${token.token_name} tokens`);
      console.log(`💰 Price per token: $${token.current_price.toString()}`);
      console.log(`🏦 Total received: ${amountInSol.toString(4)} SOL (- ${fees.toString()} SOL fees)`);
      return true;
    }

    return false;
  }

  private async updateSolPrice(): Promise<void> {
    try {
      const response = await axios.get<DexscreenerPriceResponse>(
        `https://api.dexscreener.com/token-pairs/v1/solana/${config.liquidity_pool.wsol_pc_mint}`,
        { timeout: config.tx.get_timeout }
      );

      if (response.data && response.data.length > 0) {
        const raydiumPair = response.data.find(pair => pair.dexId === 'raydium');
        if (raydiumPair?.priceUsd) {
          this.solUsdPrice = new Decimal(raydiumPair.priceUsd);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching SOL price:', error);
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