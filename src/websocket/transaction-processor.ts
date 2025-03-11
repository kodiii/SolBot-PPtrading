/**
 * Transaction processing module
 * Handles validation and execution of transactions
 */

import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";
import { config } from "../config";
import { SimulationService } from "../papertrading/services";
import { fetchTransactionDetails, createSwapTransaction, getRugCheckConfirmed, fetchAndSaveSwapDetails } from "../transactions";
import { MintsDataReponse } from "../transactions/types";
import { checkWalletBalance } from "../utils/wallet-checks";
import { TRADING_MODE } from "../system/initializer";

// Initialize paper trading simulation service if enabled in config
const simulationService = config.rug_check.simulation_mode ? SimulationService.getInstance() : null;

/**
 * Processes a new liquidity pool creation transaction
 * Includes rug check validation, paper trading simulation, and swap execution
 * @param signature - Transaction signature to process
 */
export async function processTransaction(signature: string): Promise<void> {
  console.log("\n[" + TRADING_MODE + "] Processing new transaction...");
  console.log("=============================================");
  console.log("🔎 New Liquidity Pool found.");
  console.log("🔃 Fetching transaction details ...");

  const data: MintsDataReponse | null = await fetchTransactionDetails(signature);
  if (!data) {
    console.log("⛔ Transaction aborted. No data returned.");
    console.log("🟢 Resuming looking for new tokens...\n");
    return;
  }

  if (!data.solMint || !data.tokenMint) {
    console.log("⛔ Transaction aborted. Missing mint addresses.");
    console.log("🟢 Resuming looking for new tokens...\n");
    return;
  }

  const isRugCheckPassed = await getRugCheckConfirmed(data.tokenMint);
  if (!isRugCheckPassed) {
    console.log("🚫 Rug Check not passed! Transaction aborted.");
    console.log("🟢 Resuming looking for new tokens...\n");
    return;
  }

  if (data.tokenMint.trim().toLowerCase().endsWith("pump") && config.rug_check.ignore_pump_fun) {
    console.log("🚫 Transaction skipped. Ignoring Pump.fun.");
    console.log("🟢 Resuming looking for new tokens..\n");
    return;
  }

  console.log("Token found");
  console.log("👽 GMGN: https://gmgn.ai/sol/token/" + data.tokenMint);
  console.log("😈 BullX: https://neo.bullx.io/terminal?chainId=1399811149&address=" + data.tokenMint);

  if (config.rug_check.simulation_mode && simulationService) {
    await handlePaperTrading(data.tokenMint);
    return;
  }

  await handleRealTrading(data.solMint, data.tokenMint);
}

/**
 * Handles paper trading simulation
 * @param tokenMint - Token mint address
 */
async function handlePaperTrading(tokenMint: string): Promise<void> {
  console.log("🎮 Paper Trading Mode: Simulating trade for new token");
  const tokenPrice = await simulationService?.getTokenPrice(tokenMint);
  
  if (tokenPrice) {
    console.log(`💰 Found Raydium price: $${tokenPrice.price}`);
    const success = await simulationService?.executeBuy(tokenMint, tokenMint, tokenPrice.price);
    if (success) {
      console.log("🟢 Paper trade executed successfully");
    } else {
      console.log("❌ Failed to execute paper trade");
    }
  } else {
    console.log("❌ Could not fetch token price for paper trading");
  }
  
  console.log("🟢 Resuming looking for new tokens..\n");
}

/**
 * Handles real trading execution
 * @param solMint - SOL mint address
 * @param tokenMint - Token mint address
 */
async function handleRealTrading(solMint: string, tokenMint: string): Promise<void> {
  try {
    // Add initial delay
    await new Promise((resolve) => setTimeout(resolve, config.tx.swap_tx_initial_delay));

    // Initialize connection and wallet
    const rpcUrl = process.env.HELIUS_HTTPS_URI || "";
    const connection = new Connection(rpcUrl);
    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIV_KEY_WALLET || "")));

    // Always check balance before proceeding with real trades
    const balance = await connection.getBalance(wallet.publicKey);
    const balanceInSOL = balance / 1_000_000_000;
    console.log(`\n💰 Current wallet balance: ${balanceInSOL.toFixed(4)} SOL`);

    // Verify sufficient balance
    if (!await checkWalletBalance(connection, wallet)) {
      console.log("⛔ Transaction aborted due to insufficient balance.");
      console.log("🟢 Resuming looking for new tokens...\n");
      return;
    }

    const tx = await createSwapTransaction(solMint, tokenMint);
    if (!tx) {
      console.log("⛔ Transaction aborted.");
      console.log("🟢 Resuming looking for new tokens...\n");
      return;
    }

    console.log("🚀 Swapping SOL for Token.");
    console.log("Swap Transaction: ", "https://solscan.io/tx/" + tx);

    const saveConfirmation = await fetchAndSaveSwapDetails(tx);
    if (!saveConfirmation) {
      console.log("❌ Warning: Transaction not saved for tracking! Track Manually!");
    }
  } catch (error) {
    console.error("[Real Trading Mode] Error:", error);
    console.log("🟢 Resuming looking for new tokens...\n");
  }
}