/**
 * WebSocket connection handler module
 * Manages WebSocket lifecycle and message processing
 */

import WebSocket from "ws";
import { validateEnv } from "../utils/env-validator";
import { WebSocketRequest } from "../types";
import { config } from "../config";
import { processTransaction } from "./transaction-processor";
import { initializeSystem, TRADING_MODE } from "../system/initializer";

// Transaction concurrency management
let activeTransactions = 0;
const MAX_CONCURRENT = config.tx.concurrent_transactions;

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
 * Main WebSocket handler that manages the connection lifecycle
 */
export async function websocketHandler(): Promise<void> {
  const env = validateEnv();
  const systemInitialized = await initializeSystem();
  
  if (!systemInitialized) {
    console.error('System initialization failed. Exiting...');
    process.exit(1);
  }

  let ws: WebSocket | null = new WebSocket(env.HELIUS_WSS_URI);

  // Send subscription to the websocket once the connection is open
  ws.on("open", () => {
    if (ws) sendSubscribeRequest(ws);
    console.log(`\n🔓 WebSocket is open and listening (${TRADING_MODE} Mode)`);
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