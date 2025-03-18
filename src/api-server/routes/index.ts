import { Express } from 'express';
import { ConnectionManager } from '../../papertrading/db/connection_manager';
import { setupDashboardRoutes } from './dashboard';

export function setupRoutes(app: Express): void {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Setup feature-specific routes
  setupDashboardRoutes(app);
}
