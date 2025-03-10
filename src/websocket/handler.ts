/**
 * WebSocket connection handler module
 * Manages WebSocket lifecycle and message processing
 */

import WebSocket from "ws";
import { config } from "../config";
import { WebSocketRequest } from "../types";
import { validateEnv } from "../utils/env-validator";
import { SimulationService } from "../papertrading/services";
import { ConnectionManager } from "../papertrading/db/connection_manager";
import { initializePaperTradingDB } from "../papertrading/paper_trading";
import { processTransaction } from "./transaction-processor";

// Transaction concurrency management
let activeTransactions = 0;
const MAX_CONCURRENT = config.tx.concurrent_transactions;
const TRADING_MODE = config.rug_check.simulation_mode ? "Paper Trading" : "Real Trading";

/**
 * Sends a subscription request to the WebSocket to monitor Raydium program logs
 */
function sendSubscribeRequest(ws: WebSocket): void {
  const request: WebSocketRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "logsSubscribe",
    params: [
      {
        mentions: [config.liquidity_pool.radiyum_program_id],
      },
      {
        commitment: "processed",
      },
    ],
  };
  ws.send(JSON.stringify(request));
}

/**
 * Initializes the trading system
 * Sets up database connections and logs the current trading mode
 */
async function initializeSystem(): Promise<void> {
  // Display trading mode banner
  console.clear();
  console.log('=============================================');
  console.log(`             ${TRADING_MODE} Mode`);
  console.log('=============================================');

  const connectionManager = ConnectionManager.getInstance("src/papertrading/db/paper_trading.db");
  await connectionManager.initialize();
  
  const dbSuccess = await initializePaperTradingDB();
  if (!dbSuccess) {
    console.error('Failed to initialize paper trading database');
    process.exit(1);
  }
  
  // Log trading mode details
  if (config.rug_check.simulation_mode) {
    console.log('\n🎮 Operating in Paper Trading Mode (Simulation)');
    console.log('💡 All trades will be simulated with no real transactions');
    SimulationService.getInstance();
    console.log('🎯 Paper Trading Simulation Mode initialized');
  } else {
    console.log('\n🚀 Operating in Real Trading Mode');
    console.log('⚠️  WARNING: Real transactions will be executed with actual SOL');
    console.log('💰 Make sure you have sufficient funds in your wallet');
  }
  console.log('=============================================\n');
}

let init = false;

/**
 * Main WebSocket handler that manages the connection lifecycle
 */
export async function websocketHandler(): Promise<void> {
  const env = validateEnv();
  await initializeSystem();

  let ws: WebSocket | null = new WebSocket(env.HELIUS_WSS_URI);

  // Send subscription to the websocket once the connection is open
  ws.on("open", () => {
    if (ws) sendSubscribeRequest(ws);
    console.log(`\n🔓 WebSocket is open and listening (${TRADING_MODE} Mode)`);
    init = true;
  });

  // Handle incoming messages
  ws.on("message", async (data: WebSocket.Data) => {
    try {
      const jsonString = data.toString();
      const parsedData = JSON.parse(jsonString);

      if (parsedData.result !== undefined && !parsedData.error) {
        console.log("✅ Subscription confirmed");
        return;
      }

      if (parsedData.error) {
        console.error("🚫 RPC Error:", parsedData.error);
        return;
      }

      const logs = parsedData?.params?.result?.value?.logs;
      const signature = parsedData?.params?.result?.value?.signature;

      if (!Array.isArray(logs) || !signature) return;

      const containsCreate = logs.some((log: string) => 
        typeof log === "string" && log.includes("Program log: initialize2: InitializeInstruction2")
      );
      
      if (!containsCreate || typeof signature !== "string") return;

      if (activeTransactions >= MAX_CONCURRENT) {
        console.log("⏳ Max concurrent transactions reached, skipping...");
        return;
      }

      activeTransactions++;

      // Log new transaction with mode indicator
      console.log(`\n[${TRADING_MODE} Mode] Processing new transaction...\n`);

      processTransaction(signature)
        .catch((error: Error) => {
          console.error("Error processing transaction:", error);
        })
        .finally(() => {
          activeTransactions--;
        });
    } catch (error: unknown) {
      console.error("💥 Error processing message:", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle errors and connection closure
  ws.on("error", (err: Error) => {
    console.error("WebSocket error:", err);
  });

  ws.on("close", () => {
    console.log("📴 WebSocket connection closed, cleaning up...");
    if (ws) {
      ws.removeAllListeners();
      ws = null;
    }
    console.log("🔄 Attempting to reconnect in 5 seconds...");
    setTimeout(websocketHandler, 5000);
  });
}