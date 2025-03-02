/**
 * @file Type definitions for RugCheck.xyz API
 */

/**
 * Configuration for RugCheck.xyz provider
 */
export interface RugCheckXYZConfig {
  apiUrl: string;
  timeout: number;
  retryConfig: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
  };
}

/**
 * Error response from RugCheck.xyz
 */
export class RugCheckXYZError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'RugCheckXYZError';
  }
}

/**
 * Market data structure
 */
export interface MarketData {
  pubkey: string;
  marketType: string;
  mintA: string;
  mintB: string;
  mintLP: string;
  liquidityA: string;
  liquidityB: string;
}

/**
 * Token metadata structure
 */
export interface TokenData {
  mintAuthority: string | null;
  supply: number;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: string | null;
}

/**
 * Token metadata structure
 */
export interface TokenMetadata {
  name: string;
  symbol: string;
  uri: string;
  mutable: boolean;
  updateAuthority: string;
}

/**
 * Token holder data structure
 */
export interface HolderData {
  address: string;
  amount: number;
  decimals: number;
  pct: number;
  uiAmount: number;
  uiAmountString: string;
  owner: string;
  insider: boolean;
}

/**
 * Risk information structure
 */
export interface RiskData {
  name: string;
  value: string;
  description: string;
  score: number;
  level: string;
}

/**
 * Response from RugCheck.xyz API
 */
export interface RugCheckXYZResponse {
  mint: string;
  tokenProgram: string;
  creator: string;
  token: TokenData;
  token_extensions: unknown | null;
  tokenMeta: TokenMetadata;
  topHolders: HolderData[];
  freezeAuthority: string | null;
  mintAuthority: string | null;
  risks: RiskData[];
  score: number;
  fileMeta: {
    description: string;
    name: string;
    symbol: string;
    image: string;
  };
  lockerOwners: Record<string, unknown>;
  lockers: Record<string, unknown>;
  lpLockers: unknown | null;
  markets: MarketData[];
  totalMarketLiquidity: number;
  totalLPProviders: number;
  rugged: boolean;
  price: number;
  marketCap?: number;  // Optional market cap data
}