/** 
 * Configuration file for the Solana Bot Paper Trading System
 * This file contains all the settings and parameters that control the bot's behavior
 * for trading, security checks, and simulation features.
 */

export const config = {
  // Liquidity pool configuration for Raydium DEX
  liquidity_pool: {
    radiyum_program_id: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium DEX program ID
    pump_fun_program_id: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", // PumpFun DEX program ID
    wsol_pc_mint: "So11111111111111111111111111111111111111112", // Wrapped SOL token mint address
  },

  // Transaction-related settings and timeouts
  tx: {
    fetch_tx_max_retries: 5, // Maximum number of attempts to fetch transaction details
    fetch_tx_initial_delay: 1000, // Initial delay (ms) before fetching LP creation transaction details
    swap_tx_initial_delay: 500, // Initial delay (ms) before executing first buy
    get_timeout: 10000, // API request timeout (ms)
    concurrent_transactions: 1, // Maximum number of simultaneous transactions
    retry_delay: 500, // Delay between retry attempts (ms),
  },

  // Paper trading simulation settings
  paper_trading: {
    verbose_log: false, // Enable/disable detailed logging of DexScreener API responses
    initial_balance: 10, // Starting balance in SOL for paper trading
    dashboard_refresh: 2000, // Faster refresh rate for more responsive UI
    recent_trades_limit: 12, // Number of recent trades to display in dashboard
    price_check: {
      max_retries: 15, // Maximum attempts to fetch token price from dex
      initial_delay: 3000, // Initial delay between price check attempts (ms)
      max_delay: 5000, // Maximum delay between Dex price retries (ms) from dex
    },
    real_data_update: 5000, // Market data & strategy update interval (ms)
    use_new_providers: false, // Feature flag for new market data provider system
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
    prio_fee_max_lamports: 10000000, // Maximum priority fee (0.01 SOL)
    // Transaction priority level:
    // Min (0th percentile)
    // Low (25th percentile)
    // Medium (50th percentile)
    // High (75th percentile)
    // VeryHigh (95th percentile)
    // UnsafeMax (100th percentile)
    prio_level: "medium", // Transaction priority level (medium/high/veryHigh)
    amount: "500000000", // Swap amount in lamports (0.01 SOL)
    slippageBps: "200", // Maximum allowed slippage in basis points (2%)
    db_name_tracker_holdings: "src/tracker/holdings.db", // Database path for tracking holdings
    max_open_positions: 3, // Maximum number of concurrent swap positions
    token_not_tradable_400_error_retries: 5, // Retries for token not tradable error
    token_not_tradable_400_error_delay: 2000, // Delay between retries for token not tradable error (ms)
  },

  // Sell configuration and automation
  sell: {
    price_source: "dex", // Price source preference (dex=DexScreener, jup=Jupiter)
    prio_fee_max_lamports: 10000000, // Maximum priority fee for sell transactions (0.01 SOL)
    // Transaction priority level:
    // Min (0th percentile)
    // Low (25th percentile)
    // Medium (50th percentile)
    // High (75th percentile)
    // VeryHigh (95th percentile)
    // UnsafeMax (100th percentile)
    prio_level: "medium", // Sell transaction priority level
    slippageBps: "200", // Maximum allowed slippage for sells (2%)
    auto_sell: true, // Enable/disable automated sell triggers
    stop_loss_percent: 30, // Stop loss trigger percentage
    take_profit_percent: 26, // Take profit trigger percentage
    track_public_wallet: "", // Public wallet tracking address (optional)
  },

  // Trading strategies configuration
  strategies: {
    // Global debug setting for all strategies
    debug: false, // When true, enables debug logging for all strategies unless overridden
    
    liquidity_drop: {
      enabled: true, // Enable/disable liquidity drop strategy
      threshold_percent: 20, // Sell if liquidity drops by 20%
      // Using paper_trading.real_data_update interval for consistency
      debug: false, // Strategy-specific debug setting (overrides global setting)
    }
  },

  // Rug pull protection and token validation settings
  rug_check: {
    verbose_log: false, // Enable/disable detailed rug check logging
    simulation_mode: true, // Controls paper trading (true) vs real trading (false) mode
    // When true, trades are simulated with virtual balance
    // When false, real transactions are executed on-chain
    
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
    
    // Enable token name content filtering, 
    // if the token as this string it will skip the rugcheck filters and be sniped
    only_contain_string: false, 
    contain_string: ["AI", "GPT", "AGENT"], // Required strings in token names
    
    // Holder distribution checks
    allow_insider_topholders: true, // Allow insider accounts in top holders
    max_alowed_pct_topholders: 100, // Maximum percentage for single top holder
    max_alowed_pct_all_topholders: 100, // Maximum total percentage for all top holders
    exclude_lp_from_topholders: true, // Exclude LP accounts from holder calculations
    
    // Market validation thresholds
    min_total_markets: 0, // Minimum required trading markets
    min_total_lp_providers: 0, // Minimum required liquidity providers
    min_total_market_Liquidity: 1000, // Minimum required market liquidity
    max_total_market_Liquidity: 1000000, // Maximum required market liquidity
    max_marketcap: 250000000, // Maximum allowed market cap in $
    max_price_token: 0.9, // Maximum allowed token price in $
    
    // Miscellaneous settings
    ignore_pump_fun: false, // Ignore Pump.fun tokens
    max_score: 30000, // Maximum allowed rug pull risk score (0 to disable)
    
    // Legacy risk checks to enforce
    legacy_not_allowed: [
      "Freeze Authority still enabled", // Block tokens with active freeze authority
      "Single holder ownership", // Block tokens with concentrated ownership
      "Copycat token", // Block copycat token names
      //Commented out checks (can be enabled if needed)
      "High holder concentration",
      "Large Amount of LP Unlocked",
      "Low Liquidity",
      "Low amount of LP Providers",
    ],
  },
};
