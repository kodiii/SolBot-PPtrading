import express from 'express';
import cors from 'cors';
import { initializePaperTradingDB } from '../papertrading/paper_trading';
import { errorHandler } from './middleware/error-handler';
import { setupRoutes } from './routes';
import { ConnectionManager } from '../papertrading/db/connection_manager';

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

// Add middleware to ensure proper JSON formatting
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(body) {
    // Create a properly formatted JSON string
    let jsonString;
    try {
      // Use standard JSON.stringify without custom formatting
      jsonString = JSON.stringify(body);
      res.setHeader('Content-Type', 'application/json');
      res.send(jsonString);
    } catch (error) {
      console.error('Error serializing JSON:', error);
      return originalJson.call(this, body);
    }
    return res; // Return res for chaining
  };
  next();
});

// Setup routes
setupRoutes(app);

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize database and paper trading system
    await ensureDatabase();
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
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Starting graceful shutdown...');
  process.exit(0);
});

startServer().catch(console.error);

export default app;
