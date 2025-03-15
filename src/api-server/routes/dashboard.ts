import { Express } from 'express';
import { DatabaseService } from '../../papertrading/db';

export function setupDashboardRoutes(app: Express, db: DatabaseService): void {
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

      res.json({
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
