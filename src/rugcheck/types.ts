/**
 * @file Common types and interfaces for rugcheck providers
 */

export interface TokenValidationResult {
  isValid: boolean;
  tokenName: string;
  tokenCreator: string;
  score: number;
  errors: string[];
  risks: Risk[];
  metadata: TokenMetadata;
}

export interface Risk {
  name: string;
  value: string;
  description: string;
  score: number;
  level: RiskLevel;
}

export type RiskLevel = 'good' | 'warning' | 'critical';

export interface TokenMetadata {
  name: string;
  symbol: string;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  supply: number;
  decimals: number;
  isInitialized: boolean;
  isMutable: boolean;
}

export interface TokenHolderInfo {
  address: string;
  pct: number;
  insider: boolean;
}

export interface MarketInfo {
  liquidityA?: string;
  liquidityB?: string;
  totalLiquidity: number;
}

export interface RugCheckValidationConfig {
  verbose_log: boolean;
  max_total_market_Liquidity: number;
  min_total_market_Liquidity: number;
  min_total_markets: number;
  min_total_lp_providers: number;
  max_alowed_pct_topholders: number;
  max_alowed_pct_all_topholders: number;
  max_score: number;
  max_price_token: number;
  max_marketcap: number;
  allow_mint_authority: boolean;
  allow_freeze_authority: boolean;
  allow_not_initialized: boolean;
  allow_mutable: boolean;
  allow_insider_topholders: boolean;
  allow_rugged: boolean;
  block_returning_token_names: boolean;
  block_returning_token_creators: boolean;
  exclude_lp_from_topholders: boolean;
  only_contain_string: boolean;
  contain_string: string[];
  block_symbols: string[];
  block_names: string[];
  legacy_not_allowed: string[];
}

export interface IRugCheckProvider {
  validateToken(tokenMint: string): Promise<TokenValidationResult>;
  getTokenMetadata(tokenMint: string): Promise<TokenMetadata>;
  checkDuplicate(name: string, creator: string): Promise<boolean>;
}