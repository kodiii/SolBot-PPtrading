/**
 * Service type definitions for paper trading
 */

import { Decimal } from '../../utils/decimal';

/**
 * Dexscreener API response types
 */
export interface DexscreenerPairInfo {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels: string[];
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    symbol: string;
  };
  priceUsd: string;
  priceNative: string;
  txns: {
    m5: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    m5: number;
    h1: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
}

export interface DexscreenerPriceResponse {
  pairs: DexscreenerPairInfo[];
}

/**
 * Token price data structure
 */
export interface TokenPriceData {
  price: Decimal;
  symbol?: string;
  dexData?: {
    volume_m5: number;
    marketCap: number;
    liquidity_usd: number;
  };
}

/**
 * Price tracking service interface
 */
export interface IPriceTracker {
  getTokenPrice(tokenMint: string, retryCount?: number): Promise<TokenPriceData | null>;
  getSolUsdPrice(): Decimal | null;
}

/**
 * Trade execution service interface
 */
export interface ITradeExecutor {
  executeBuy(tokenMint: string, tokenName: string, currentPrice: Decimal): Promise<boolean>;
  executeSell(token: any, reason: string): Promise<boolean>;
}

/**
 * Strategy management service interface
 */
export interface IStrategyManager {
  evaluateStrategies(token: any, marketData: any): Promise<void>;
  isDebugEnabled(): boolean;
}

/**
 * Simulation service interface
 */
export interface ISimulationService {
  getTokenPrice(tokenMint: string, retryCount?: number): Promise<TokenPriceData | null>;
  getSolUsdPrice(): Decimal | null;
  executeBuy(tokenMint: string, tokenName: string, currentPrice: Decimal): Promise<boolean>;
  executeSell(token: any, reason: string): Promise<boolean>;
  cleanup(): void;
}