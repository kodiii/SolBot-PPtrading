/** 
 * Configuration file for the Solana Bot Paper Trading System
 * This file contains all the settings and parameters that control the bot's behavior
 * for trading, security checks, and simulation features.
 */
export const config = {
  // Liquidity pool configuration for Raydium DEX
  liquidity_pool: {
    radiyum_program_id: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium DEX program ID
    wsol_pc_mint: "So11111111111111111111111111111111111111112", // Wrapped SOL token mint address
  },

  // Transaction-related settings and timeouts
  tx: {
    fetch_tx_max_retries: 5, // Maximum number of attempts to fetch transaction details
    fetch_tx_initial_delay: 1000, // Initial delay (ms) before fetching LP creation transaction details
    swap_tx_initial_delay: 500, // Initial delay (ms) before executing first buy
    get_timeout: 10000, // API request timeout (ms)
    concurrent_transactions: 1, // Maximum number of simultaneous transactions
    retry_delay: 500, // Delay between retry attempts (ms)
  },

  // DexScreener API configuration
  dexscreener: {
    api_url: "https://api.dexscreener.com/token-pairs/v1/solana", // DexScreener API endpoint
    timeout: 10000, // API request timeout (ms)
  },

  // Paper trading simulation settings
  paper_trading: {
    verbose_log: false, // Enable/disable detailed logging of DexScreener API responses
    initial_balance: 5, // Starting balance in SOL for paper trading
    dashboard_refresh: 2000, // Faster refresh rate for more responsive UI
    recent_trades_limit: 12, // Number of recent trades to display in dashboard
    price_check: {
      max_retries: 15, // Maximum attempts to fetch token price from dex
      initial_delay: 3000, // Initial delay between price check attempts (ms)
      max_delay: 5000, // Maximum delay between Dex price retries (ms) from dex
    },
    real_data_update: 5000, // Market data & strategy update interval (ms)
  },

  // Price validation settings for paper trading
  price_validation: {
    enabled: true, // Enable/disable price validation checks
    window_size: 12, // Number of price points to maintain in rolling window
    max_deviation: 0.05, // Maximum allowed price deviation (5%) from rolling average
    min_data_points: 6, // Minimum required price points for validation
    fallback_to_single_source: true, // Allow trading with single price source if others unavailable
  },

  // Token swap configuration
  swap: {
    verbose_log: false, // Enable/disable detailed swap operation logging
    prio_fee_max_lamports: 10000000, // Default max fee if dynamic fees fail
    prio_level: "medium" as const, // Default priority level if dynamic fees fail
    amount: "500000000", // Swap amount in lamports (0.01 SOL)
    slippageBps: "200", // Maximum allowed slippage in basis points (2%)
    db_name_tracker_holdings: "src/tracker/holdings.db",
    max_open_positions: 3,
    token_not_tradable_400_error_retries: 5,
    token_not_tradable_400_error_delay: 2000,
    
    // Fee calculation configuration
    fees: {
      mode: "fixed" as const, // "fixed" or "dynamic"
      
      // Options for dynamic fee calculation
      dynamicOptions: {
        percentile: 75,       // Use 75th percentile of recent fees
        multiplier: 1.1,      // Add 10% safety margin
        maxAgeSec: 60,        // Consider fees from last minute
        minFee: 5000,        // Minimum fee (in lamports)
      },
      
      // Options for fixed fee calculation
      fixedOptions: {
        prio_fee_max_lamports: 10000000, // Maximum priority fee (0.01 SOL)
        prio_level: "medium" as const,    // Transaction priority level
      }
    }
  },

  // Sell configuration and automation
  sell: {
    price_source: "dex" as const, // Price source preference (dex=DexScreener, jup=Jupiter)
    prio_fee_max_lamports: 10000000, // Default max fee if dynamic fees fail
    prio_level: "medium" as const, // Default priority level if dynamic fees fail
    slippageBps: "200", // Maximum allowed slippage for sells (2%)
    auto_sell: true, // Enable/disable automated sell triggers
    stop_loss_percent: 30, // Stop loss trigger percentage
    take_profit_percent: 26, // Take profit trigger percentage
    track_public_wallet: "", // Public wallet tracking address (optional)
    
    // Fee calculation configuration (mirrors swap fee configuration)
    fees: {
      mode: "fixed" as const, // "fixed" or "dynamic"
      
      // Options for dynamic fee calculation
      dynamicOptions: {
        percentile: 75,       // Use 75th percentile of recent fees
        multiplier: 1.1,      // Add 10% safety margin
        maxAgeSec: 60,        // Consider fees from last minute
        minFee: 5000,        // Minimum fee (in lamports)
      },
      
      // Options for fixed fee calculation
      fixedOptions: {
        prio_fee_max_lamports: 10000000, // Maximum priority fee (0.01 SOL)
        prio_level: "medium" as const,    // Transaction priority level
      }
    }
  },

  // Trading strategies configuration
  strategies: {
    // Global debug setting for all strategies
    debug: false, // When true, enables debug logging for all strategies unless overridden
    
    liquidity_drop: {
      enabled: true, // Enable/disable liquidity drop strategy
      threshold_percent: 20, // Sell if liquidity drops by 20%
      debug: false, // Strategy-specific debug setting (overrides global setting)
    }
  },

  // Rug pull protection and token validation settings
  rug_check: {
    verbose_log: false, // Enable/disable detailed rug check logging
    simulation_mode: true, // Controls paper trading (true) vs real trading (false) mode
    
    // High-risk security checks
    allow_mint_authority: false, // Allow tokens with active mint authority (high risk)
    allow_not_initialized: false, // Allow uninitialized token accounts (high risk)
    allow_freeze_authority: false, // Allow tokens with freeze authority (high risk)
    allow_rugged: false, // Allow previously rugged tokens
    
    // Critical security parameters
    allow_mutable: true, // Allow tokens with mutable metadata
    block_returning_token_names: false, // Block tokens with previously seen names
    block_returning_token_creators: false, // Block tokens from known creators
    block_symbols: ["XXX"], // Blocked token symbols
    block_names: ["XXX"], // Blocked token names
    
    // Token name content filtering
    only_contain_string: false,
    contain_string: ["AI", "GPT", "AGENT"], // Required strings in token names
    
    // Holder distribution checks
    allow_insider_topholders: true, // Allow insider accounts in top holders
    max_alowed_pct_topholders: 50, // Maximum percentage for single top holder
    max_alowed_pct_all_topholders: 50, // Maximum total percentage for all top holders
    exclude_lp_from_topholders: true, // Exclude LP accounts from holder calculations
    
    // Market validation thresholds
    min_total_markets: 0, // Minimum required trading markets
    min_total_lp_providers: 0, // Minimum required liquidity providers
    min_total_market_Liquidity: 10000, // Minimum required market liquidity
    max_total_market_Liquidity: 100000, // Maximum required market liquidity
    max_marketcap: 25000000, // Maximum allowed market cap in $
    max_price_token: 0.001, // Maximum allowed token price in $
    
    // Miscellaneous settings
    ignore_pump_fun: false, // Ignore Pump.fun tokens
    max_score: 30000, // Maximum allowed rug pull risk score (0 to disable)
    
    // Legacy risk checks to enforce
    legacy_not_allowed: [
      "Freeze Authority still enabled", // Block tokens with active freeze authority
      "Single holder ownership", // Block tokens with concentrated ownership
      "Copycat token", // Block copycat token names
      // Commented out checks (can be enabled if needed)
      //"High holder concentration",
      //"Large Amount of LP Unlocked",
      //"Low Liquidity",
      //"Low amount of LP Providers",
    ],
  },
};
