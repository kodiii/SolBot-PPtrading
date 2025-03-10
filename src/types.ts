import { Decimal } from './utils/decimal';

/** 
 * Response interface for token mint addresses
 * @interface MintsDataReponse
 */
export interface MintsDataReponse {
  tokenMint?: string;  // The mint address of the token
  solMint?: string;    // The mint address of SOL
}

/**
 * Generic quote response interface
 * @interface QuoteResponse
 */
export interface QuoteResponse {
  data: unknown;
}

/**
 * Detailed quote response with swap transaction details
 * @interface SerializedQuoteResponse
 */
export interface SerializedQuoteResponse {
  swapTransaction: string;           // The serialized swap transaction
  lastValidBlockHeight: number;      // The last valid block height for this quote
  prioritizationFeeLamports: number; // Priority fee in lamports
  computeUnitLimit: number;          // Compute unit limit for the transaction
  prioritizationType: {
    computeBudget: Record<string, unknown>;
  };
  simulationSlot: number;
  dynamicSlippageReport: {
    slippageBps: number;                    // Slippage in basis points
    otherAmount: number;                    // Amount of the other token
    simulatedIncurredSlippageBps: number;   // Actual slippage incurred in simulation
    amplificationRatio: string;             // Ratio of price amplification
    categoryName: string;                   // Category of the swap
    heuristicMaxSlippageBps: number;       // Maximum allowed slippage
  };
  simulationError: string | null;           // Any errors during simulation
}

/**
 * Extended response interface for token rug pull analysis
 * @interface RugResponseExtended
 */
export interface RugResponseExtended {
  mint: string;              // Token mint address
  tokenProgram: string;      // Token program ID
  creator: string;           // Token creator address
  token: {
    mintAuthority: string | null;    // Authority to mint new tokens
    supply: number;                  // Total token supply
    decimals: number;                // Token decimals
    isInitialized: boolean;          // Token initialization status
    freezeAuthority: string | null;  // Authority to freeze token accounts
  };
  token_extensions: unknown | null;
  tokenMeta: {
    name: string;            // Token name
    symbol: string;          // Token symbol
    uri: string;             // Metadata URI
    mutable: boolean;        // Whether metadata is mutable
    updateAuthority: string; // Authority to update metadata
  };
  topHolders: {
    address: string;         // Holder's address
    amount: number;          // Token amount
    decimals: number;        // Token decimals
    pct: number;            // Percentage of total supply
    uiAmount: number;       // Human-readable amount
    uiAmountString: string; // Formatted amount string
    owner: string;          // Owner's address
    insider: boolean;       // Whether holder is an insider
  }[];
  freezeAuthority: string | null;    // Authority to freeze token accounts
  mintAuthority: string | null;      // Authority to mint new tokens
  risks: {
    name: string;           // Risk factor name
    value: string;          // Risk value
    description: string;    // Risk description
    score: number;          // Risk score
    level: string;          // Risk level
  }[];
  score: number;            // Overall risk score
  fileMeta: {
    description: string;    // Token description
    name: string;           // Token name
    symbol: string;         // Token symbol
    image: string;          // Token image URL
  };
  lockerOwners: Record<string, unknown>;  // Token locker owners
  lockers: Record<string, unknown>;       // Token lockers
  lpLockers: unknown | null;              // Liquidity pool lockers
  markets: {
    pubkey: string;         // Market public key
    marketType: string;      // Type of market
    mintA: string;          // First token mint
    mintB: string;          // Second token mint
    mintLP: string;         // LP token mint
    liquidityA: string;     // First token liquidity
    liquidityB: string;     // Second token liquidity
  }[];
  totalMarketLiquidity: number;  // Total liquidity across all markets
  totalLPProviders: number;      // Total number of LP providers
  rugged: boolean;               // Whether token is considered rugged
  price: number;                 // Token price in SOL
}

/**
 * WebSocket request interface
 * @interface WebSocketRequest
 */
export interface WebSocketRequest {
  jsonrpc: string;    // JSON-RPC version
  id: number;         // Request ID
  method: string;     // Method name
  params: unknown[];  // Method parameters
}

/**
 * Detailed transaction response interface
 * @interface TransactionDetailsResponse
 */
interface TransactionDetailsResponse {
  description: string;    // Transaction description
  type: string;          // Transaction type
  source: string;        // Transaction source
  fee: number;           // Transaction fee
  feePayer: string;      // Fee payer address
  signature: string;     // Transaction signature
  slot: number;          // Slot number
  timestamp: number;     // Transaction timestamp
  tokenTransfers: {
    fromTokenAccount: string;   // Source token account
    toTokenAccount: string;     // Destination token account
    fromUserAccount: string;    // Source user account
    toUserAccount: string;      // Destination user account
    tokenAmount: number | string; // Transfer amount
    mint: string;               // Token mint
    tokenStandard: string;      // Token standard
  }[];
  nativeTransfers: {
    fromUserAccount: string;    // Source account
    toUserAccount: string;      // Destination account
    amount: number;             // Transfer amount
  }[];
  accountData: {
    account: string;            // Account address
    nativeBalanceChange: number; // Change in native balance
    tokenBalanceChanges: {
      userAccount: string;      // User account
      tokenAccount: string;     // Token account
      rawTokenAmount: {
        tokenAmount: string;    // Raw token amount
        decimals: number;       // Token decimals
      };
      mint: string;            // Token mint
    }[];
  }[];
  transactionError: string | null;  // Transaction error if any
  instructions: {
    accounts: string[];         // Instruction accounts
    data: string;              // Instruction data
    programId: string;         // Program ID
    innerInstructions: {
      accounts: string[];      // Inner instruction accounts
      data: string;           // Inner instruction data
      programId: string;      // Inner instruction program ID
    }[];
  }[];
  events: {
    swap: {
      nativeInput: {
        account: string;      // Input account
        amount: string;       // Input amount
      } | null;
      nativeOutput: {
        account: string;      // Output account
        amount: string;       // Output amount
      } | null;
      tokenInputs: {
        userAccount: string;   // User account
        tokenAccount: string;  // Token account
        rawTokenAmount: {
          tokenAmount: string; // Raw token amount
          decimals: number;    // Token decimals
        };
        mint: string;         // Token mint
      }[];
      tokenOutputs: {
        userAccount: string;   // User account
        tokenAccount: string;  // Token account
        rawTokenAmount: {
          tokenAmount: string; // Raw token amount
          decimals: number;    // Token decimals
        };
        mint: string;         // Token mint
      }[];
      nativeFees: {
        account: string;      // Fee account
        amount: string;       // Fee amount
      }[];
      tokenFees: {
        userAccount: string;   // User account
        tokenAccount: string;  // Token account
        rawTokenAmount: {
          tokenAmount: string; // Raw token amount
          decimals: number;    // Token decimals
        };
        mint: string;         // Token mint
      }[];
      innerSwaps: {
        tokenInputs: {
          fromTokenAccount: string;  // Source token account
          toTokenAccount: string;    // Destination token account
          fromUserAccount: string;   // Source user account
          toUserAccount: string;     // Destination user account
          tokenAmount: number;       // Transfer amount
          mint: string;             // Token mint
          tokenStandard: string;    // Token standard
        }[];
        tokenOutputs: {
          fromTokenAccount: string;  // Source token account
          toTokenAccount: string;    // Destination token account
          fromUserAccount: string;   // Source user account
          toUserAccount: string;     // Destination user account
          tokenAmount: number;       // Transfer amount
          mint: string;             // Token mint
          tokenStandard: string;    // Token standard
        }[];
        tokenFees: {
          userAccount: string;      // User account
          tokenAccount: string;     // Token account
          rawTokenAmount: {
            tokenAmount: string;    // Raw token amount
            decimals: number;       // Token decimals
          };
          mint: string;            // Token mint
        }[];
        nativeFees: {
          account: string;         // Fee account
          amount: string;          // Fee amount
        }[];
        programInfo: {
          source: string;          // Program source
          account: string;         // Program account
          programName: string;     // Program name
          instructionName: string; // Instruction name
        };
      }[];
    };
  };
}

/**
 * Swap event details response interface
 * @interface SwapEventDetailsResponse
 */
export interface SwapEventDetailsResponse {
  programInfo: {
    source: string;          // Program source
    account: string;         // Program account
    programName: string;     // Program name
    instructionName: string; // Instruction name
  };
  tokenInputs: Array<{
    fromTokenAccount: string;  // Source token account
    toTokenAccount: string;    // Destination token account
    fromUserAccount: string;   // Source user account
    toUserAccount: string;     // Destination user account
    tokenAmount: number;       // Transfer amount
    mint: string;             // Token mint
    tokenStandard: string;    // Token standard
  }>;
  tokenOutputs: Array<{
    fromTokenAccount: string;  // Source token account
    toTokenAccount: string;    // Destination token account
    fromUserAccount: string;   // Source user account
    toUserAccount: string;     // Destination user account
    tokenAmount: number;       // Transfer amount
    mint: string;             // Token mint
    tokenStandard: string;    // Token standard
  }>;
  fee: number;           // Transaction fee
  slot: number;          // Slot number
  timestamp: number;     // Transaction timestamp
  description: string;   // Transaction description
}

/**
 * Record of token holdings
 * @interface HoldingRecord
 */
export interface HoldingRecord {
  id?: number;              // Database ID (optional)
  Time: number;             // Timestamp
  Token: string;            // Token mint address
  TokenName: string;        // Token name
  Balance: Decimal;         // Token balance
  SolPaid: Decimal;        // Amount of SOL paid
  SolFeePaid: Decimal;     // Transaction fees paid in SOL
  SolPaidUSDC: Decimal;    // SOL paid in USDC equivalent
  SolFeePaidUSDC: Decimal; // Fees paid in USDC equivalent
  PerTokenPaidUSDC: Decimal; // Price per token in USDC
  Slot: number;            // Slot number
  Program: string;         // Program ID
}

/**
 * Record of new token creation
 * @interface NewTokenRecord
 */
export interface NewTokenRecord {
  id?: number;      // Database ID (optional)
  time: number;     // Creation timestamp
  name: string;     // Token name
  mint: string;     // Token mint address
  creator: string;  // Creator's address
}

/**
 * Response for sell transaction creation
 * @interface createSellTransactionResponse
 */
export interface createSellTransactionResponse {
  success: boolean;     // Transaction creation success
  msg: string | null;   // Status message
  tx: string | null;    // Transaction signature
}

/**
 * DEX price response interface
 * @interface LastPriceDexReponse
 */
export interface LastPriceDexReponse {
  schemaVersion: string;  // Schema version
  pairs: {
    chainId: string;     // Chain ID
    dexId: string;       // DEX identifier
    url: string;         // DEX URL
    pairAddress: string; // Trading pair address
    labels?: string[];   // Pair labels
    baseToken: {
      address: string;   // Token address
      name: string;      // Token name
      symbol: string;    // Token symbol
    };
    quoteToken: {
      address: string;   // Quote token address
      name: string;      // Quote token name
      symbol: string;    // Quote token symbol
    };
    priceNative: string; // Price in native token
    priceUsd: string;    // Price in USD
    txns: {
      m5: { buys: number; sells: number };   // 5-minute transactions
      h1: { buys: number; sells: number };   // 1-hour transactions
      h6: { buys: number; sells: number };   // 6-hour transactions
      h24: { buys: number; sells: number };  // 24-hour transactions
    };
    volume: {
      h24: number;      // 24-hour volume
      h6: number;       // 6-hour volume
      h1: number;       // 1-hour volume
      m5: number;       // 5-minute volume
    };
    priceChange: {
      m5: number;       // 5-minute price change
      h1: number;       // 1-hour price change
      h6: number;       // 6-hour price change
      h24: number;      // 24-hour price change
    };
    liquidity: {
      usd: number;      // Liquidity in USD
      base: number;     // Base token liquidity
      quote: number;    // Quote token liquidity
    };
    fdv: number;        // Fully diluted valuation
    marketCap: number;  // Market capitalization
    pairCreatedAt: number; // Pair creation timestamp
    info: {
      imageUrl: string;   // Token image URL
      header: string;     // Token header
      openGraph: string;  // Open graph data
      websites?: { label: string; url: string }[]; // Official websites
      socials: { type: string; url: string }[];
    };
  }[];
}

// Price tracking interfaces
export interface TokenPrice {
  price: Decimal;
  timestamp: number;
  source: 'jupiter' | 'dexscreener';
}

export interface PriceHistory {
  mint: string;
  prices: TokenPrice[];
  lastValidation: number;
}

export interface PriceValidationResult {
  isValid: boolean;
  reason?: string;
  confidence: number;
  suggestedPrice?: Decimal;
}

export interface RollingAverageConfig {
  windowSize: number;  // Number of price points to consider
  maxDeviation: number;  // Maximum allowed deviation from average
  minDataPoints: number;  // Minimum required data points
}

export type PriorityLevel = "min" | "low" | "medium" | "high" | "veryHigh" | "custom" | "unsafeMax";

// Update to reflect an array of transactions
export type TransactionDetailsResponseArray = TransactionDetailsResponse[];

export interface FeeConfig {
  mode: "dynamic" | "fixed";
  dynamicOptions: {
    percentile: number;     // 0-100, typically 75 for 75th percentile
    multiplier: number;     // e.g., 1.1 for 10% safety margin
    maxAgeSec: number;      // Maximum age of fees to consider
    minFee: number;        // Minimum fee in lamports
  };
  fixedOptions: {
    prio_fee_max_lamports: number;
    prio_level: PriorityLevel;
  };
}

/**
 * Configuration interface for the complete system
 * @interface Config
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
    fees: FeeConfig;
  };
  sell: {
    price_source: "dex" | "jup";
    prio_fee_max_lamports: number;
    prio_level: PriorityLevel;
    slippageBps: string;
    auto_sell: boolean;
    stop_loss_percent: number;
    take_profit_percent: number;
    track_public_wallet: string;
    fees: FeeConfig;
  };
  strategies: {
    debug: boolean;
    liquidity_drop: {
      enabled: boolean;
      threshold_percent: number;
      debug: boolean;
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
    max_score: number;
    ignore_pump_fun: boolean;
    legacy_not_allowed: string[];
  };
}
