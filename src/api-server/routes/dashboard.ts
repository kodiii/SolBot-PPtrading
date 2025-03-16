import { Express } from 'express';
import { DatabaseService } from '../../papertrading/db';
import fs from 'fs';
import path from 'path';
import { config } from '../../config';

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
      
      // In a production environment, you would update a database or configuration file
      // For this implementation, we'll log the settings and return a success message
      console.log('Received updated settings:', settings);
      
      // Here you would typically update the config file or database
      // For example, you could write to a JSON file:
      /*
      const configPath = path.resolve(__dirname, '../../config.json');
      fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
      */
      
      res.json({ 
        success: true, 
        message: 'Settings updated successfully',
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
      const holdings = await db.getHoldings();

      // Transform holdings into positions format
      const positions = holdings.map(holding => ({
        token_mint: holding.Token,
        token_name: holding.TokenName,
        amount: holding.Balance.toString(),
        position_size_sol: holding.SolPaid.toString(),
        last_updated: holding.Time,
        buy_price: holding.PerTokenPaidUSDC.toString(),
        current_price: '0', // Need to implement price tracking
        stop_loss: '0',    // Need to implement
        take_profit: '0'   // Need to implement
      }));

      // Get initial balance from config or use a default
      const initialBalance = 100; // This should come from config later
      
      // Calculate current balance by subtracting position sizes
      const totalInvested = positions.reduce((sum, pos) => 
        sum + parseFloat(pos.position_size_sol), 0);
      
      const currentBalance = initialBalance - totalInvested;

      res.json({
        balance: {
          balance_sol: currentBalance.toString(),
          updated_at: Date.now()
        },
        positions,
        trades: [], // Need to implement trades endpoint
        stats: {
          totalTrades: 0,
          successfulTrades: 0,
          failedTrades: 0,
          totalPnL: '0',
          winRate: 0
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Get positions only
  app.get('/api/dashboard/positions', async (req, res, next) => {
    try {
      const holdings = await db.getHoldings();
      const positions = holdings.map(holding => ({
        token_mint: holding.Token,
        token_name: holding.TokenName,
        amount: holding.Balance.toString(),
        position_size_sol: holding.SolPaid.toString(),
        last_updated: holding.Time,
        buy_price: holding.PerTokenPaidUSDC.toString(),
        current_price: '0', // Need to implement price tracking
        stop_loss: '0',    // Need to implement
        take_profit: '0'   // Need to implement
      }));
      res.json(positions);
    } catch (error) {
      next(error);
    }
  });

  // Get trades only
  app.get('/api/dashboard/trades', async (req, res, next) => {
    const limit = parseInt(req.query.limit as string) || 10;
    try {
      // Need to implement trades endpoint
      res.json([]);
    } catch (error) {
      next(error);
    }
  });

  // Get stats only
  app.get('/api/dashboard/stats', async (req, res, next) => {
    try {
      // Need to implement proper stats calculation
      res.json({
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalPnL: '0',
        winRate: 0
      });
    } catch (error) {
      next(error);
    }
  });
}
