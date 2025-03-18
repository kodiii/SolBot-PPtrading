import { Express } from 'express';
import { config } from '../../config';
import { SettingsService } from '../../papertrading/services/settings-service';
import { SimulationService } from '../../papertrading/services/simulation';
import { fetchActivePositions, fetchRecentTrades, fetchTradingStats } from '../../papertrading/cli/services/dashboard-data';
import { getTrackedTokens, getVirtualBalance } from '../../papertrading/paper_trading';

export function setupDashboardRoutes(app: Express): void {
  // Get current settings
  app.get('/api/settings', async (req, res) => {
    try {
      const settingsService = SettingsService.getInstance();
      const settings = await settingsService.getSettings();
      
      res.json(settings);
    } catch (error) {
      console.error('Error retrieving settings:', error);
      res.status(500).json({ error: 'Failed to retrieve settings' });
    }
  });

  // Update settings
  app.post('/api/settings', async (req, res) => {
    try {
      const settings = req.body;
      
      console.log('Received updated settings:', settings);
      
      // Save settings to database
      const settingsService = SettingsService.getInstance();
      await settingsService.saveSettings(settings);
      
      // Update config in memory
      // This is a temporary solution until we refactor the config to use the settings service
      config.paper_trading.initial_balance = settings.paperTrading.initialBalance;
      config.paper_trading.dashboard_refresh = settings.paperTrading.dashboardRefresh;
      config.paper_trading.recent_trades_limit = settings.paperTrading.recentTradesLimit;
      config.paper_trading.verbose_log = settings.paperTrading.verboseLogging;
      
      config.price_validation.enabled = settings.priceValidation.enabled;
      config.price_validation.window_size = settings.priceValidation.windowSize;
      config.price_validation.max_deviation = settings.priceValidation.maxDeviation;
      config.price_validation.min_data_points = settings.priceValidation.minDataPoints;
      config.price_validation.fallback_to_single_source = settings.priceValidation.fallbackToSingleSource;
      
      config.swap.amount = settings.swap.amount.toString();
      config.swap.slippageBps = settings.swap.slippageBps.toString();
      config.swap.max_open_positions = settings.swap.maxOpenPositions;
      
      config.strategies.liquidity_drop.enabled = settings.strategies.liquidityDropEnabled;
      config.strategies.liquidity_drop.threshold_percent = settings.strategies.threshold;
      
      // Update rugCheck settings
      config.rug_check.verbose_log = settings.rugCheck.verboseLog;
      config.rug_check.simulation_mode = settings.rugCheck.simulationMode;
      config.rug_check.allow_mint_authority = settings.rugCheck.allowMintAuthority;
      config.rug_check.allow_not_initialized = settings.rugCheck.allowNotInitialized;
      config.rug_check.allow_freeze_authority = settings.rugCheck.allowFreezeAuthority;
      config.rug_check.allow_rugged = settings.rugCheck.allowRugged;
      config.rug_check.allow_mutable = settings.rugCheck.allowMutable;
      config.rug_check.block_returning_token_names = settings.rugCheck.blockReturningTokenNames;
      config.rug_check.block_returning_token_creators = settings.rugCheck.blockReturningTokenCreators;
      config.rug_check.block_symbols = settings.rugCheck.blockSymbols;
      config.rug_check.block_names = settings.rugCheck.blockNames;
      config.rug_check.only_contain_string = settings.rugCheck.onlyContainString;
      config.rug_check.contain_string = settings.rugCheck.containString;
      config.rug_check.allow_insider_topholders = settings.rugCheck.allowInsiderTopholders;
      config.rug_check.max_alowed_pct_topholders = settings.rugCheck.maxAllowedPctTopholders;
      config.rug_check.max_alowed_pct_all_topholders = settings.rugCheck.maxAllowedPctAllTopholders;
      config.rug_check.exclude_lp_from_topholders = settings.rugCheck.excludeLpFromTopholders;
      config.rug_check.min_total_markets = settings.rugCheck.minTotalMarkets;
      config.rug_check.min_total_lp_providers = settings.rugCheck.minTotalLpProviders;
      config.rug_check.min_total_market_Liquidity = settings.rugCheck.minTotalMarketLiquidity;
      config.rug_check.max_total_market_Liquidity = settings.rugCheck.maxTotalMarketLiquidity;
      config.rug_check.max_marketcap = settings.rugCheck.maxMarketcap;
      config.rug_check.max_price_token = settings.rugCheck.maxPriceToken;
      config.rug_check.ignore_pump_fun = settings.rugCheck.ignorePumpFun;
      config.rug_check.max_score = settings.rugCheck.maxScore;
      config.rug_check.legacy_not_allowed = settings.rugCheck.legacyNotAllowed;
      
      res.json({ 
        success: true, 
        message: 'Settings updated successfully.',
        requiresRestart: false,
        settings
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update settings' 
      });
    }
  });

  // Get all dashboard data
  app.get('/api/dashboard', async (req, res, next) => {
    try {
      // Get data from paper trading mode
      const [paperPositions, virtualBalance, allTrades, recentTrades, stats] = await Promise.all([
        fetchActivePositions(),
        getVirtualBalance(),
        fetchRecentTrades(1000), // High limit to fetch all trades
        fetchRecentTrades(config.paper_trading.recent_trades_limit), // Limited trades for charts
        fetchTradingStats()
      ]);

      // Transform paper positions into the same format
      const formattedPaperPositions = paperPositions.map(token => ({
        token_mint: token.token_mint,
        token_name: token.token_name,
        amount: token.amount.toString(),
        position_size_sol: token.position_size_sol?.toString() || '0',
        last_updated: token.last_updated,
        buy_price: token.buy_price.toString(),
        current_price: token.current_price.toString(),
        stop_loss: token.stop_loss.toString(),
        take_profit: token.take_profit.toString(),
        volume_m5: token.volume_m5?.toString() || '0',
        market_cap: token.market_cap?.toString() || '0',
        liquidity_usd: token.liquidity_usd?.toString() || '0'
      }));

      // Format trades for the response
      const formattedTrades = allTrades.map(trade => ({
        token_mint: trade.token_mint,
        token_name: trade.token_name,
        amount_token: trade.amount_token.toString(),
        amount_sol: trade.amount_sol.toString(),
        buy_price: trade.buy_price.toString(),
        buy_fees: trade.buy_fees.toString(),
        buy_slippage: trade.buy_slippage.toString(),
        sell_price: trade.sell_price?.toString() || null,
        sell_fees: trade.sell_fees?.toString() || null,
        sell_slippage: trade.sell_slippage?.toString() || null,
        time_buy: trade.time_buy,
        time_sell: trade.time_sell || null,
        pnl: trade.pnl?.toString() || null,
        market_cap: trade.dex_data?.marketCap?.toString() || '0',
        liquidity_buy_usd: trade.dex_data?.liquidity_buy_usd?.toString() || '0',
        liquidity_sell_usd: trade.dex_data?.liquidity_sell_usd?.toString() || null,
        volume_m5: trade.dex_data?.volume_m5?.toString() || '0'
      }));

      // Format stats for the response
      const formattedStats = stats ? {
        totalTrades: stats.totalTrades,
        successfulTrades: stats.profitableTrades,
        failedTrades: stats.totalTrades - stats.profitableTrades,
        totalPnL: stats.totalProfitLoss.toString(),
        winRate: stats.winRate.toString(),
        avgProfitPerTrade: stats.avgProfitPerTrade.toString(),
        bestTrade: {
          token: stats.bestTrade.token,
          profit: stats.bestTrade.profit.toString()
        },
        worstTrade: {
          token: stats.worstTrade.token,
          profit: stats.worstTrade.profit.toString()
        }
      } : {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalPnL: '0',
        winRate: '0'
      };

      // Get balance from virtual balance or config
      const balance = virtualBalance || { 
        balance_sol: config.paper_trading.initial_balance, 
        updated_at: Date.now() 
      };

      // Set cache control headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json({
        balance: {
          balance_sol: balance.balance_sol.toString(),
          updated_at: balance.updated_at
        },
        positions: formattedPaperPositions,
        trades: formattedTrades,
        recentTrades: recentTrades.map(trade => ({
          token_mint: trade.token_mint,
          token_name: trade.token_name,
          amount_token: trade.amount_token.toString(),
          amount_sol: trade.amount_sol.toString(),
          buy_price: trade.buy_price.toString(),
          buy_fees: trade.buy_fees.toString(),
          buy_slippage: trade.buy_slippage.toString(),
          sell_price: trade.sell_price?.toString() || null,
          sell_fees: trade.sell_fees?.toString() || null,
          sell_slippage: trade.sell_slippage?.toString() || null,
          time_buy: trade.time_buy,
          time_sell: trade.time_sell || null,
          pnl: trade.pnl?.toString() || null,
          market_cap: trade.dex_data?.marketCap?.toString() || '0',
          liquidity_buy_usd: trade.dex_data?.liquidity_buy_usd?.toString() || '0',
          liquidity_sell_usd: trade.dex_data?.liquidity_sell_usd?.toString() || null,
          volume_m5: trade.dex_data?.volume_m5?.toString() || '0'
        })),
        stats: formattedStats
      });
    } catch (error) {
      next(error);
    }
  });

  // Get positions only
  app.get('/api/dashboard/positions', async (req, res, next) => {
    try {
      // Get data from paper trading mode
      const paperPositions = await fetchActivePositions();

      // Transform paper positions into the same format
      const formattedPaperPositions = paperPositions.map(token => ({
        token_mint: token.token_mint,
        token_name: token.token_name,
        amount: token.amount.toString(),
        position_size_sol: token.position_size_sol?.toString() || '0',
        last_updated: token.last_updated,
        buy_price: token.buy_price.toString(),
        current_price: token.current_price.toString(),
        stop_loss: token.stop_loss.toString(),
        take_profit: token.take_profit.toString(),
        volume_m5: token.volume_m5?.toString() || '0',
        market_cap: token.market_cap?.toString() || '0',
        liquidity_usd: token.liquidity_usd?.toString() || '0'
      }));
      
      // Set cache control headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(formattedPaperPositions);
    } catch (error) {
      next(error);
    }
  });

  // Close a position
  app.post('/api/dashboard/positions/close', async (req, res, next) => {
    try {
      console.log('Received close position request:', req.body);
      
      const { tokenMint } = req.body;
      
      if (!tokenMint) {
        console.log('No token mint provided');
        return res.status(400).json({ error: 'Token mint address is required' });
      }
      
      // Get the token data
      console.log('Fetching tracked tokens...');
      const trackedTokens = await getTrackedTokens();
      console.log('Found', trackedTokens.length, 'tracked tokens');
      
      const token = trackedTokens.find(t => t.token_mint === tokenMint);
      
      if (!token) {
        console.log('Position not found for token mint:', tokenMint);
        return res.status(404).json({ error: 'Position not found' });
      }
      
      // Validate token data
      for (const key of ['amount', 'buy_price', 'current_price', 'stop_loss', 'take_profit']) {
        if (!(token as any)[key]) {
          console.error('Missing required token data:', key);
          return res.status(500).json({ error: `Missing required token data: ${key}` });
        }
      }
      
      console.log('Found position to close:', {
        token_name: token.token_name,
        token_mint: token.token_mint,
        amount: token.amount.toString(),
        current_price: token.current_price.toString()
      });
      
      // Create a simulation service instance
      const simulationService = SimulationService.getInstance();
      
      // Execute the sell
      console.log('Executing sell...');
      const result = await simulationService.executeSell(token, 'Manual close by user');
      console.log('Sell execution result:', result);
      
      if (result) {
        console.log('Position closed successfully');
        res.json({ 
          success: true, 
          message: 'Position closed successfully',
          token: {
            name: token.token_name,
            mint: token.token_mint,
            amount: token.amount.toString(),
            price: token.current_price.toString()
          }
        });
      } else {
        console.error('Failed to close position - executeSell returned false');
        res.status(500).json({ error: 'Failed to execute sell order' });
      }
    } catch (error) {
      console.error('Error closing position:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get trades only
  app.get('/api/dashboard/trades', async (req, res, next) => {
    const limit = parseInt(req.query.limit as string) || 10;
    try {
      const trades = await fetchRecentTrades(limit);
      
      // Format trades for the response
      const formattedTrades = trades.map(trade => ({
        token_mint: trade.token_mint,
        token_name: trade.token_name,
        amount_token: trade.amount_token.toString(),
        amount_sol: trade.amount_sol.toString(),
        buy_price: trade.buy_price.toString(),
        buy_fees: trade.buy_fees.toString(),
        buy_slippage: trade.buy_slippage.toString(),
        sell_price: trade.sell_price?.toString() || null,
        sell_fees: trade.sell_fees?.toString() || null,
        sell_slippage: trade.sell_slippage?.toString() || null,
        time_buy: trade.time_buy,
        time_sell: trade.time_sell || null,
        pnl: trade.pnl?.toString() || null,
        market_cap: trade.dex_data?.marketCap?.toString() || '0',
        liquidity_buy_usd: trade.dex_data?.liquidity_buy_usd?.toString() || '0',
        liquidity_sell_usd: trade.dex_data?.liquidity_sell_usd?.toString() || null,
        volume_m5: trade.dex_data?.volume_m5?.toString() || '0'
      }));
      
      // Set cache control headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(formattedTrades);
    } catch (error) {
      next(error);
    }
  });

  // Reset settings to default values
  app.post('/api/settings/reset', async (req, res) => {
    try {
      console.log('Resetting settings to default values...');
      
      // Get the settings service
      const settingsService = SettingsService.getInstance();
      
      // Reset settings to default values
      await settingsService.resetSettings();
      
      // Get the updated settings
      const settings = await settingsService.getSettings();
      
      // Update config in memory
      // This is a temporary solution until we refactor the config to use the settings service
      config.paper_trading.initial_balance = settings.paperTrading.initialBalance;
      config.paper_trading.dashboard_refresh = settings.paperTrading.dashboardRefresh;
      config.paper_trading.recent_trades_limit = settings.paperTrading.recentTradesLimit;
      config.paper_trading.verbose_log = settings.paperTrading.verboseLogging;
      
      config.price_validation.enabled = settings.priceValidation.enabled;
      config.price_validation.window_size = settings.priceValidation.windowSize;
      config.price_validation.max_deviation = settings.priceValidation.maxDeviation;
      config.price_validation.min_data_points = settings.priceValidation.minDataPoints;
      config.price_validation.fallback_to_single_source = settings.priceValidation.fallbackToSingleSource;
      
      config.swap.amount = settings.swap.amount.toString();
      config.swap.slippageBps = settings.swap.slippageBps.toString();
      config.swap.max_open_positions = settings.swap.maxOpenPositions;
      
      config.strategies.liquidity_drop.enabled = settings.strategies.liquidityDropEnabled;
      config.strategies.liquidity_drop.threshold_percent = settings.strategies.threshold;
      
      // Update rugCheck settings with proper boolean conversion
      const rugCheckSettings = settings.rugCheck;
      if (typeof rugCheckSettings !== 'undefined') {
        config.rug_check.verbose_log = Boolean(rugCheckSettings.verboseLog);
        config.rug_check.simulation_mode = Boolean(rugCheckSettings.simulationMode);
        config.rug_check.allow_mint_authority = Boolean(rugCheckSettings.allowMintAuthority);
        config.rug_check.allow_not_initialized = Boolean(rugCheckSettings.allowNotInitialized);
        config.rug_check.allow_freeze_authority = Boolean(rugCheckSettings.allowFreezeAuthority);
        config.rug_check.allow_rugged = Boolean(rugCheckSettings.allowRugged);
        config.rug_check.allow_mutable = Boolean(rugCheckSettings.allowMutable);
        config.rug_check.block_returning_token_names = Boolean(rugCheckSettings.blockReturningTokenNames);
        config.rug_check.block_returning_token_creators = Boolean(rugCheckSettings.blockReturningTokenCreators);
        config.rug_check.block_symbols = rugCheckSettings.blockSymbols;
        config.rug_check.block_names = rugCheckSettings.blockNames;
        config.rug_check.only_contain_string = Boolean(rugCheckSettings.onlyContainString);
        config.rug_check.contain_string = rugCheckSettings.containString;
        config.rug_check.allow_insider_topholders = Boolean(rugCheckSettings.allowInsiderTopholders);
        config.rug_check.max_alowed_pct_topholders = Number(rugCheckSettings.maxAllowedPctTopholders) || 0;
        config.rug_check.max_alowed_pct_all_topholders = Number(rugCheckSettings.maxAllowedPctAllTopholders) || 0;
        config.rug_check.exclude_lp_from_topholders = Boolean(rugCheckSettings.excludeLpFromTopholders);
        config.rug_check.min_total_markets = Number(rugCheckSettings.minTotalMarkets) || 0;
        config.rug_check.min_total_lp_providers = Number(rugCheckSettings.minTotalLpProviders) || 0;
        config.rug_check.min_total_market_Liquidity = Number(rugCheckSettings.minTotalMarketLiquidity) || 0;
        config.rug_check.max_total_market_Liquidity = Number(rugCheckSettings.maxTotalMarketLiquidity) || 0;
        config.rug_check.max_marketcap = Number(rugCheckSettings.maxMarketcap) || 0;
        config.rug_check.max_price_token = Number(rugCheckSettings.maxPriceToken) || 0;
        config.rug_check.ignore_pump_fun = Boolean(rugCheckSettings.ignorePumpFun);
        config.rug_check.max_score = Number(rugCheckSettings.maxScore) || 0;
        config.rug_check.legacy_not_allowed = rugCheckSettings.legacyNotAllowed;
      }
      
      res.json({ 
        success: true, 
        message: 'Settings reset to default values',
        requiresRestart: false,
        settings
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to reset settings' 
      });
    }
  });

  // Restart server - COMMENTED OUT TO AVOID CONFLICT WITH restart.ts
  /*
  app.post('/api/restart', (req, res) => {
    try {
      console.log('Restarting server...');
      
      // Send response before restarting
      res.json({ 
        success: true, 
        message: 'Server restart initiated'
      });
      
      // Wait a moment to ensure the response is sent
      setTimeout(() => {
        // Exit the process - if running with a process manager like PM2, it will restart automatically
        process.exit(0);
      }, 1000);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to restart server' 
      });
    }
  });
  */

  // Get stats only
  app.get('/api/dashboard/stats', async (req, res, next) => {
    try {
      const stats = await fetchTradingStats();
      
      // Format stats for the response
      const formattedStats = stats ? {
        totalTrades: stats.totalTrades,
        successfulTrades: stats.profitableTrades,
        failedTrades: stats.totalTrades - stats.profitableTrades,
        totalPnL: stats.totalProfitLoss.toString(),
        winRate: stats.winRate.toString(),
        avgProfitPerTrade: stats.avgProfitPerTrade.toString(),
        bestTrade: {
          token: stats.bestTrade.token,
          profit: stats.bestTrade.profit.toString()
        },
        worstTrade: {
          token: stats.worstTrade.token,
          profit: stats.worstTrade.profit.toString()
        }
      } : {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalPnL: '0',
        winRate: '0'
      };
      
      // Set cache control headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(formattedStats);
    } catch (error) {
      next(error);
    }
  });
}
