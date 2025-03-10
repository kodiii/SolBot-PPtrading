/**
 * Solana Token Monitoring and Trading System
 * 
 * This system monitors the Solana blockchain for new token pool creations on Raydium DEX,
 * performs security checks (rug pull prevention), and executes trades based on configured
 * parameters. It supports both paper trading (simulation) and real trading modes.
 *
 * Key Features:
 * - Real-time monitoring of Raydium liquidity pool creations
 * - Automated rug pull detection and security validation
 * - Configurable paper trading simulation
 * - Concurrent transaction management
 * - Automatic reconnection handling
 */

import { websocketHandler } from "./websocket/handler";

// Start WebSocket Handler
websocketHandler().catch((err: Error) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
