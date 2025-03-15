import { Express } from 'express';
import { DatabaseService } from '../../papertrading/db';
import { setupDashboardRoutes } from './dashboard';

export function setupRoutes(app: Express, db: DatabaseService): void {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Setup feature-specific routes
  setupDashboardRoutes(app, db);
}
