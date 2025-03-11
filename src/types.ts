import { Decimal } from "./utils/decimal";

/**
 * Token tracking information structure
 */
export interface TokenTracking {
  token_name: string;
  token_mint: string;
  amount: Decimal;
  buy_price: Decimal;
  current_price: Decimal;
  buy_fees: Decimal;
  buy_slippage: Decimal;
  time_buy: number;
}

/**
 * Structure for new token record in database
 */
export interface NewTokenRecord {
  time: number;
  name: string;
  mint: string;
  creator: string;
}

/**
 * Structure for holding record in database
 */
export interface HoldingRecord {
  Time: number;
  Token: string;
  TokenName: string;
  Balance: string;
  SolPaid: string;
  SolFeePaid: string;
  SolPaidUSDC: string;
  SolFeePaidUSDC: string;
  PerTokenPaidUSDC: string;
  Slot: number;
  Program: string;
}

/**
 * Response structure for Jupiter price quotation
 */
export interface QuoteResponse {
  data: {
    id?: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    notEnoughLiquidity: boolean;
    priceImpactPct: string;
    [key: string]: any;
  };
}

/**
 * Response structure for Jupiter serialized transaction
 */
export interface SerializedQuoteResponse {
  swapTransaction: string;
}

/**
 * Response structure for transaction creation
 */
export interface createSellTransactionResponse {
  success: boolean;
  msg: string | null;
  tx: string | null;
}

/**
 * WebSocket request structure
 */
export interface WebSocketRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: [
    {
      mentions: string[];
    },
    {
      commitment: string;
    }
  ];
}

/**
 * Priority level types for fee calculation
 */
export type PriorityLevel = "min" | "low" | "medium" | "high" | "veryHigh" | "custom" | "unsafeMax";

/**
 * Fee calculation configuration for fixed mode
 */
interface FixedFeeOptions {
  prio_fee_max_lamports: number;
  prio_level: PriorityLevel;
}

/**
 * Fee calculation configuration for dynamic mode
 */
interface DynamicFeeOptions {
  multiplier: number;
  maxAgeSec: number;
  minFee: number;
  percentile: number;
}

/**
 * Configuration interface for trading settings
 */
export interface Config {
  liquidity_pool: {
    radiyum_program_id: string;
    wsol_pc_mint: string;
  };
  tx: {
    fetch_tx_max_retries: number;
    fetch_tx_initial_delay: number;
    swap_tx_initial_delay: number;
    get_timeout: number;
    concurrent_transactions: number;
    retry_delay: number;
  };
  paper_trading: {
    verbose_log: boolean;
    initial_balance: number;
    dashboard_refresh: number;
    recent_trades_limit: number;
    price_check: {
      max_retries: number;
      initial_delay: number;
      max_delay: number;
    };
    real_data_update: number;
    debug?: boolean;  // Optional since it's part of runtime configuration
  };
  price_validation: {
    enabled: boolean;
    window_size: number;
    max_deviation: number;
    min_data_points: number;
    fallback_to_single_source: boolean;
  };
  swap: {
    verbose_log: boolean;
    prio_fee_max_lamports: number;
    prio_level: PriorityLevel;
    amount: string;
    slippageBps: string;
    db_name_tracker_holdings: string;
    max_open_positions: number;
    token_not_tradable_400_error_retries: number;
    token_not_tradable_400_error_delay: number;
    fees: {
      mode: 'fixed' | 'dynamic';
      fixedOptions: FixedFeeOptions;
      dynamicOptions: DynamicFeeOptions;
    };
  };
  sell: {
    price_source: 'dex' | 'jup';
    prio_fee_max_lamports: number;
    prio_level: PriorityLevel;
    slippageBps: string;
    auto_sell: boolean;
    stop_loss_percent: number;
    take_profit_percent: number;
    track_public_wallet: string;
    fees: {
      mode: 'fixed' | 'dynamic';
      fixedOptions: FixedFeeOptions;
      dynamicOptions: DynamicFeeOptions;
    };
  };
  strategies: {
    debug: boolean;
    liquidity_drop?: {
      enabled: boolean;
      threshold_percent: number;
      debug?: boolean;
    };
  };
  rug_check: {
    verbose_log: boolean;
    simulation_mode: boolean;
    allow_mint_authority: boolean;
    allow_not_initialized: boolean;
    allow_freeze_authority: boolean;
    allow_rugged: boolean;
    allow_mutable: boolean;
    block_returning_token_names: boolean;
    block_returning_token_creators: boolean;
    block_symbols: string[];
    block_names: string[];
    only_contain_string: boolean;
    contain_string: string[];
    allow_insider_topholders: boolean;
    max_alowed_pct_topholders: number;
    max_alowed_pct_all_topholders: number;
    exclude_lp_from_topholders: boolean;
    min_total_markets: number;
    min_total_lp_providers: number;
    min_total_market_Liquidity: number;
    max_total_market_Liquidity: number;
    max_marketcap: number;
    max_price_token: number;
    ignore_pump_fun: boolean;
    max_score: number;
    legacy_not_allowed: string[];
  };
}
