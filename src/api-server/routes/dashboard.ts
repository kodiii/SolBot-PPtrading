import { Express } from 'express';
import { DatabaseService } from '../../papertrading/db';
import fs from 'fs';
import path from 'path';
import { config } from '../../config';
import { getTrackedTokens, getVirtualBalance } from '../../papertrading/paper_trading';
import { fetchActivePositions, fetchRecentTrades, fetchTradingStats } from '../../papertrading/cli/services/dashboard-data';

export function setupDashboardRoutes(app: Express, db: DatabaseService): void {
  // Get current settings
  app.get('/api/settings', (req, res) => {
    try {
      // Return the current configuration
      res.json({
        paperTrading: {
          initialBalance: config.paper_trading.initial_balance,
          dashboardRefresh: config.paper_trading.dashboard_refresh,
          recentTradesLimit: config.paper_trading.recent_trades_limit,
          verboseLogging: config.paper_trading.verbose_log
        },
        priceValidation: {
          enabled: config.price_validation.enabled,
          windowSize: config.price_validation.window_size,
          maxDeviation: config.price_validation.max_deviation,
          minDataPoints: config.price_validation.min_data_points,
          fallbackToSingleSource: config.price_validation.fallback_to_single_source
        },
        swap: {
          amount: parseInt(config.swap.amount),
          slippageBps: parseInt(config.swap.slippageBps),
          maxOpenPositions: config.swap.max_open_positions
        },
        strategies: {
          liquidityDropEnabled: config.strategies.liquidity_drop.enabled,
          threshold: config.strategies.liquidity_drop.threshold_percent
        },
        rugCheck: {
          verboseLog: config.rug_check.verbose_log,
          simulationMode: config.rug_check.simulation_mode,
          allowMintAuthority: config.rug_check.allow_mint_authority,
          allowNotInitialized: config.rug_check.allow_not_initialized,
          allowFreezeAuthority: config.rug_check.allow_freeze_authority,
          allowRugged: config.rug_check.allow_rugged,
          allowMutable: config.rug_check.allow_mutable,
          blockReturningTokenNames: config.rug_check.block_returning_token_names,
          blockReturningTokenCreators: config.rug_check.block_returning_token_creators,
          blockSymbols: config.rug_check.block_symbols,
          blockNames: config.rug_check.block_names,
          onlyContainString: config.rug_check.only_contain_string,
          containString: config.rug_check.contain_string,
          allowInsiderTopholders: config.rug_check.allow_insider_topholders,
          maxAllowedPctTopholders: config.rug_check.max_alowed_pct_topholders,
          maxAllowedPctAllTopholders: config.rug_check.max_alowed_pct_all_topholders,
          excludeLpFromTopholders: config.rug_check.exclude_lp_from_topholders,
          minTotalMarkets: config.rug_check.min_total_markets,
          minTotalLpProviders: config.rug_check.min_total_lp_providers,
          minTotalMarketLiquidity: config.rug_check.min_total_market_Liquidity,
          maxTotalMarketLiquidity: config.rug_check.max_total_market_Liquidity,
          maxMarketcap: config.rug_check.max_marketcap,
          maxPriceToken: config.rug_check.max_price_token,
          ignorePumpFun: config.rug_check.ignore_pump_fun,
          maxScore: config.rug_check.max_score,
          legacyNotAllowed: config.rug_check.legacy_not_allowed
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve settings' });
    }
  });

  // Update settings
  app.post('/api/settings', (req, res) => {
    try {
      const settings = req.body;
      
      console.log('Received updated settings:', settings);
      
      // Save settings to data/settings.json
      const configPath = path.resolve(__dirname, '../../../data/settings.json');
      
      // Ensure the data directory exists
      const dataDir = path.dirname(configPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Write settings to file
      fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
      
      res.json({ 
        success: true, 
        message: 'Settings updated successfully. Please restart the bot for changes to take effect.',
        requiresRestart: true,
        settings
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to update settings' 
      });
    }
  });
  // Get all dashboard data
  app.get('/api/dashboard', async (req, res, next) => {
    try {
      // Get data from both real trading and paper trading modes
      const [holdings, paperPositions, virtualBalance, allTrades, recentTrades, stats] = await Promise.all([
        db.getHoldings(),
        fetchActivePositions(),
        getVirtualBalance(),
        fetchRecentTrades(), // No limit, fetch all trades
        fetchRecentTrades(config.paper_trading.recent_trades_limit), // Limited trades for charts
        fetchTradingStats()
      ]);

      // Transform holdings into positions format for real trading
      const realPositions = holdings.map(holding => ({
        token_mint: holding.Token,
        token_name: holding.TokenName,
        amount: holding.Balance.toString(),
        position_size_sol: holding.SolPaid.toString(),
        last_updated: holding.Time,
        buy_price: holding.PerTokenPaidUSDC.toString(),
        current_price: '0',
        stop_loss: '0',
        take_profit: '0'
      }));

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
        take_profit: token.take_profit.toString()
      }));

      // Combine positions from both modes
      const positions = [...realPositions, ...formattedPaperPositions];

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

      res.json({
        balance: {
          balance_sol: balance.balance_sol.toString(),
          updated_at: balance.updated_at
        },
        positions,
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
      // Get data from both real trading and paper trading modes
      const [holdings, paperPositions] = await Promise.all([
        db.getHoldings(),
        fetchActivePositions()
      ]);

      // Transform holdings into positions format for real trading
      const realPositions = holdings.map(holding => ({
        token_mint: holding.Token,
        token_name: holding.TokenName,
        amount: holding.Balance.toString(),
        position_size_sol: holding.SolPaid.toString(),
        last_updated: holding.Time,
        buy_price: holding.PerTokenPaidUSDC.toString(),
        current_price: '0',
        stop_loss: '0',
        take_profit: '0'
      }));

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
        take_profit: token.take_profit.toString()
      }));

      // Combine positions from both modes
      const positions = [...realPositions, ...formattedPaperPositions];
      
      res.json(positions);
    } catch (error) {
      next(error);
    }
  });

  // Close a position
  app.post('/api/dashboard/positions/close', async (req, res, next) => {
    try {
      const { tokenMint } = req.body;
      
      if (!tokenMint) {
        return res.status(400).json({ error: 'Token mint address is required' });
      }
      
      // Get the token data
      const trackedTokens = await getTrackedTokens();
      const token = trackedTokens.find(t => t.token_mint === tokenMint);
      
      if (!token) {
        return res.status(404).json({ error: 'Position not found' });
      }
      
      // Create a trade executor instance
      const tradeExecutor = new (await import('../../papertrading/services/trade-executor')).TradeExecutor();
      
      // Execute the sell
      const result = await tradeExecutor.executeSell(token, 'Manual close by user');
      
      if (result) {
        res.json({ success: true, message: 'Position closed successfully' });
      } else {
        res.status(500).json({ error: 'Failed to close position' });
      }
    } catch (error) {
      console.error('Error closing position:', error);
      next(error);
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
      
      res.json(formattedTrades);
    } catch (error) {
      next(error);
    }
  });

  // Restart server
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
      
      res.json(formattedStats);
    } catch (error) {
      next(error);
    }
  });
}
