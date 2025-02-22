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

import WebSocket from "ws"; // WebSocket client for Solana RPC connection
import { WebSocketRequest } from "./types"; // Type definitions for WebSocket messages
import { config } from "./config"; // System configuration and trading parameters
import { fetchTransactionDetails, createSwapTransaction, getRugCheckConfirmed, fetchAndSaveSwapDetails } from "./transactions";
import { validateEnv } from "./utils/env-validator";
import { SimulationService } from "./papertrading/services";

// Initialize paper trading simulation service if enabled in config
const simulationService = config.rug_check.simulation_mode ? SimulationService.getInstance() : null;

// Transaction concurrency management
let activeTransactions = 0; // Counter for currently processing transactions
const MAX_CONCURRENT = config.tx.concurrent_transactions; // Maximum allowed concurrent transactions

/**
 * Sends a subscription request to the WebSocket to monitor Raydium program logs
 * @param ws - WebSocket connection instance
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
        commitment: "processed", // Can use finalized to be more accurate.
      },
    ],
  };
  ws.send(JSON.stringify(request));
}

/**
 * Processes a new liquidity pool creation transaction
 * Includes rug check validation, paper trading simulation, and swap execution
 * @param signature - Transaction signature to process
 */
async function processTransaction(signature: string): Promise<void> {
  // Output logs
  console.log("=============================================");
  console.log("🔎 New Liquidity Pool found.");
  console.log("🔃 Fetching transaction details ...");

  // Fetch the transaction details
  const data = await fetchTransactionDetails(signature);
  if (!data) {
    console.log("⛔ Transaction aborted. No data returned.");
    console.log("🟢 Resuming looking for new tokens...\n");
    return;
  }

  // Ensure required data is available
  if (!data.solMint || !data.tokenMint) return;

  // Check rug check
  const isRugCheckPassed = await getRugCheckConfirmed(data.tokenMint);
  if (!isRugCheckPassed) {
    console.log("🚫 Rug Check not passed! Transaction aborted.");
    console.log("🟢 Resuming looking for new tokens...\n");
    return;
  }

  // Handle ignored tokens
  if (data.tokenMint.trim().toLowerCase().endsWith("pump") && config.rug_check.ignore_pump_fun) {
    // Check if ignored
    console.log("🚫 Transaction skipped. Ignoring Pump.fun.");
    console.log("🟢 Resuming looking for new tokens..\n");
    return;
  }

  // Ouput logs
  console.log("Token found");
  console.log("👽 GMGN: https://gmgn.ai/sol/token/" + data.tokenMint);
  console.log("😈 BullX: https://neo.bullx.io/terminal?chainId=1399811149&address=" + data.tokenMint);

  // Handle paper trading if simulation mode is enabled
  if (config.rug_check.simulation_mode && simulationService) {
    console.log("🎮 Paper Trading Mode: Simulating trade for new token");
    const tokenPrice = await simulationService.getTokenPrice(data.tokenMint);
    if (tokenPrice) {
      console.log(`💰 Found Raydium price: $${tokenPrice.price}`);
      const success = await simulationService.executeBuy(data.tokenMint, data.tokenMint, tokenPrice.price);
      if (success) {
        console.log("🟢 Paper trade executed successfully");
      } else {
        console.log("❌ Failed to execute paper trade");
      }
    } else {
      console.log("❌ Could not fetch token price for paper trading");
    }
    console.log("🟢 Resuming looking for new tokens..\n");
    return;
  }

  // Real trading flow - Add initial delay before first buy
  await new Promise((resolve) => setTimeout(resolve, config.tx.swap_tx_initial_delay));

  // Create Swap transaction
  const tx = await createSwapTransaction(data.solMint, data.tokenMint);
  if (!tx) {
    console.log("⛔ Transaction aborted.");
    console.log("🟢 Resuming looking for new tokens...\n");
    return;
  }

  // Output logs
  console.log("🚀 Swapping SOL for Token.");
  console.log("Swap Transaction: ", "https://solscan.io/tx/" + tx);

  // Fetch and store the transaction for tracking purposes
  const saveConfirmation = await fetchAndSaveSwapDetails(tx);
  if (!saveConfirmation) {
    console.log("❌ Warning: Transaction not saved for tracking! Track Manually!");
  }
}

let init = false;
/**
 * Main WebSocket handler that manages the connection lifecycle
 * - Establishes connection to Solana network
 * - Handles message processing
 * - Implements automatic reconnection
 * - Manages concurrent transaction limits
 */
async function websocketHandler(): Promise<void> {
  // Load environment variables from the .env file
  const env = validateEnv();

  // Create a WebSocket connection
  let ws: WebSocket | null = new WebSocket(env.HELIUS_WSS_URI);
  if (!init) console.clear();

  // @TODO, test with hosting our app on a Cloud instance closer to the RPC nodes physical location for minimal latency
  // @TODO, test with different RPC and API nodes (free and paid) from quicknode and shyft to test speed

  // Send subscription to the websocket once the connection is open
  ws.on("open", () => {
    // Subscribe
    if (ws) sendSubscribeRequest(ws); // Send a request once the WebSocket is open
    console.log("\n🔓 WebSocket is open and listening.");
    init = true;
  });

  // Logic for the message event for the .on event listener
  ws.on("message", async (data: WebSocket.Data) => {
    try {
      const jsonString = data.toString(); // Convert data to a string
      const parsedData = JSON.parse(jsonString); // Parse the JSON string

      // Handle subscription response
      if (parsedData.result !== undefined && !parsedData.error) {
        console.log("✅ Subscription confirmed");
        return;
      }

      // Only log RPC errors for debugging
      if (parsedData.error) {
        console.error("🚫 RPC Error:", parsedData.error);
        return;
      }

      // Safely access the nested structure
      const logs = parsedData?.params?.result?.value?.logs;
      const signature = parsedData?.params?.result?.value?.signature;

      // Validate `logs` is an array and if we have a signtature
      if (!Array.isArray(logs) || !signature) return;

      // Verify if this is a new pool creation
      const containsCreate = logs.some((log: string) => typeof log === "string" && log.includes("Program log: initialize2: InitializeInstruction2"));
      if (!containsCreate || typeof signature !== "string") return;

      // Verify if we have reached the max concurrent transactions
      if (activeTransactions >= MAX_CONCURRENT) {
        console.log("⏳ Max concurrent transactions reached, skipping...");
        return;
      }

      // Add additional concurrent transaction
      activeTransactions++;

      // Process transaction asynchronously
      processTransaction(signature)
        .catch((error) => {
          console.error("Error processing transaction:", error);
        })
        .finally(() => {
          activeTransactions--;
        });
    } catch (error) {
      console.error("💥 Error processing message:", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

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

// Start Socket Handler
websocketHandler().catch((err) => {
  console.error(err.message);
});
