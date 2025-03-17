/**
 * Service for tracking and managing token prices
 */

import axios from 'axios';
import { config } from '../../config';
import { Decimal } from '../../utils/decimal';
import { 
  IPriceTracker,
  TokenPriceData,
  DexscreenerPairInfo,
  DexscreenerPriceResponse
} from './types';

export class PriceTracker implements IPriceTracker {
  private solUsdPrice: Decimal | null = null;
  private readonly maxRetries = config.paper_trading.price_check.max_retries;
  private readonly serviceId: string = `price_tracker_${Date.now()}`;

  /**
   * Get current token price from DEX
   * @param tokenMint Token mint address
   * @param retryCount Number of retry attempts
   * @returns Token price data or null if not found
   */
  public async getTokenPrice(tokenMint: string, retryCount = 0): Promise<TokenPriceData | null> {
    try {
      // Log API URL in verbose mode
      if (config.paper_trading.verbose_log) {
        console.log(`🔗 Fetching from DEXScreener API: ${config.dexscreener.api_url}/${tokenMint}`);
      }

      // Use the exact URL from the old implementation
      const response = await axios.get<DexscreenerPriceResponse>(
        `https://api.dexscreener.com/token-pairs/v1/solana/${tokenMint}`,
        {
          headers: {
            'accept': 'application/json'
          },
          timeout: config.dexscreener.timeout
        }
      );

      // Check if pairs exist (response is an array in the old implementation)
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        if (retryCount < this.maxRetries) {
          console.log(`⛔ No pairs found for ${tokenMint}`);
          return this.getTokenPrice(tokenMint, retryCount + 1);
        }
        return null;
      }

      // Log available pairs in verbose mode
      if (config.paper_trading.verbose_log) {
        console.log(`📊 Available pairs for ${tokenMint}:`, 
          response.data.map(p => ({ dex: p.dexId, liquidity: p.liquidity?.usd }))
        );
      }

      // Log raw response in verbose mode
      if (config.paper_trading.verbose_log) {
        console.log(`📊 Raw DEXScreener response:`, JSON.stringify(response.data, null, 2));
      }

      // Find Raydium pair with exact case matching (like the old implementation)
      const pair = response.data.find(p => {
        const isRaydium = p.dexId === 'raydium';
        
        if (config.paper_trading.verbose_log && isRaydium) {
          console.log(`✅ Found Raydium pair: ${p.pairAddress} (dexId: ${p.dexId})`);
        }
        
        return isRaydium;
      });

      if (!pair) {
        console.log(`⛔ No Raydium pair found for ${tokenMint} (${response.data.length} other pairs available)`);
        if (config.paper_trading.verbose_log) {
          console.log(`Available DEX IDs:`, response.data.map(p => p.dexId));
        }
        return null;
      }

      const price = new Decimal(pair.priceUsd);
      const result: TokenPriceData = {
        price,
        symbol: pair.baseToken.symbol,
        dexData: {
          volume_m5: pair.volume?.m5 || 0,
          marketCap: pair.marketCap || 0,
          liquidity_usd: pair.liquidity?.usd || 0
        }
      };

      if (pair.quoteToken.symbol.toLowerCase() === 'sol') {
        this.solUsdPrice = price;
      }

      return result;
    } catch (error) {
      console.error(`❌ Failed to fetch price for ${tokenMint}:`, error);
      if (retryCount < this.maxRetries - 1) {  // Adjusted to ensure exact number of retries
        return this.getTokenPrice(tokenMint, retryCount + 1);
      }
      return null;
    }
  }

  /**
   * Get current SOL/USD price
   * @returns SOL price in USD or null if not available
   */
  public getSolUsdPrice(): Decimal | null {
    return this.solUsdPrice;
  }
}
