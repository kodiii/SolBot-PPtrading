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
      const response = await axios.get<DexscreenerPriceResponse>(
        `${config.dexscreener.api_url}/${tokenMint}`,
        {
          headers: {
            'accept': 'application/json'
          },
          timeout: config.dexscreener.timeout
        }
      );

      // Check if pairs exist and find Raydium pair
      if (!response.data?.pairs || response.data.pairs.length === 0) {
        if (retryCount < this.maxRetries) {
          console.log(`🔄 [${this.serviceId}] No pairs found for ${tokenMint}, retrying...`);
          return this.getTokenPrice(tokenMint, retryCount + 1);
        }
        return null;
      }

      const pair = response.data.pairs.find((p: DexscreenerPairInfo) => 
        p.dexId.toLowerCase() === 'raydium'
      );

      if (!pair) {
        console.log(`❌ [${this.serviceId}] No Raydium pair found for ${tokenMint}`);
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
      console.error(`❌ [ERROR][${this.serviceId}] Failed to fetch price:`, error);
      if (retryCount < this.maxRetries - 1) {  // Adjusted to ensure exact number of retries
        console.log(`🔄 [${this.serviceId}] Retrying price fetch...`);
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