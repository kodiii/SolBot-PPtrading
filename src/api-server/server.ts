import express from 'express';
import cors from 'cors';
import { DatabaseService } from '../papertrading/db';
import { initializePaperTradingDB } from '../papertrading/paper_trading';
import { errorHandler } from './middleware/error-handler';
import { setupRoutes } from './routes';

const app = express();
const PORT = process.env.API_PORT || 3002;

// Ensure database is initialized before starting server
async function ensureDatabase() {
  const initialized = await initializePaperTradingDB();
  if (!initialized) {
    throw new Error('Failed to initialize database');
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database service
const db = DatabaseService.getInstance();

// Setup routes
setupRoutes(app, db);

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize database and paper trading system
    await ensureDatabase();
    await db.initialize();
    console.log('Database and paper trading system initialized successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Starting graceful shutdown...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Starting graceful shutdown...');
  await db.close();
  process.exit(0);
});

startServer().catch(console.error);

export default app;
