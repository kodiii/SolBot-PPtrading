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
 * Process a new liquidity pool creation transaction
 * @param signature - Transaction signature to process
 */
export async function processTransaction(signature: string): Promise<void> {
  console.log("\n[" + TRADING_MODE + "] 🔎 New Liquidity Pool found");
  console.log("=============================================");

  const data: MintsDataReponse | null = await fetchTransactionDetails(signature);
  if (!data) {
    console.log("⛔ Transaction aborted. No data returned.");
    console.log("=============================================");
    return;
  }

  if (!data.solMint || !data.tokenMint) {
    console.log("⛔ Transaction aborted. Missing mint addresses.");
    console.log("=============================================");
    return;
  }

  const isRugCheckPassed = await getRugCheckConfirmed(data.tokenMint);
  if (!isRugCheckPassed) {
    console.log("🚫 Rug Check not passed! Transaction aborted.");
    console.log("=============================================");
    return;
  }

  if (data.tokenMint.trim().toLowerCase().endsWith("pump") && config.rug_check.ignore_pump_fun) {
    console.log("🚫 Transaction skipped. Ignoring Pump.fun token.");
    console.log("=============================================");
    return;
  }

  // These will be hidden unless verbose_log is true
  if (config.paper_trading.verbose_log) {
    console.log("Token Info:");
    console.log("👽 GMGN: https://gmgn.ai/sol/token/" + data.tokenMint);
    console.log("😈 BullX: https://neo.bullx.io/terminal?chainId=1399811149&address=" + data.tokenMint);
  }

  if (config.rug_check.simulation_mode && simulationService) {
    await handlePaperTrading(data.tokenMint);
  } else {
    await handleRealTrading(data.solMint, data.tokenMint);
  }
  
  console.log("=============================================");
}

/**
 * Handle paper trading simulation
 * @param tokenMint - Token mint address
 */
async function handlePaperTrading(tokenMint: string): Promise<void> {
  const tokenPrice = await simulationService?.getTokenPrice(tokenMint);
  
  if (tokenPrice) {
    const success = await simulationService?.executeBuy(tokenMint, tokenMint, tokenPrice.price);
    if (success) {
      console.log("🎮 Paper trade executed successfully");
    } else {
      console.log("❌ Failed to execute paper trade");
    }
  } else {
    console.log("❌ Could not fetch token price for paper trading");
  }
}

/**
 * Handle real trading execution
 * @param solMint - SOL mint address
 * @param tokenMint - Token mint address
 */
async function handleRealTrading(solMint: string, tokenMint: string): Promise<void> {
  try {
    await new Promise((resolve) => setTimeout(resolve, config.tx.swap_tx_initial_delay));

    const rpcUrl = process.env.HELIUS_HTTPS_URI || "";
    const connection = new Connection(rpcUrl);
    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIV_KEY_WALLET || "")));

    const balance = await connection.getBalance(wallet.publicKey);
    const balanceInSOL = balance / 1_000_000_000;
    console.log(`💰 Current wallet balance: ${balanceInSOL.toFixed(4)} SOL`);

    if (!await checkWalletBalance(connection, wallet)) {
      console.log("⛔ Transaction aborted due to insufficient balance.");
      return;
    }

    const tx = await createSwapTransaction(solMint, tokenMint);
    if (!tx) {
      console.log("⛔ Transaction aborted.");
      return;
    }

    console.log("[Real Trading] 🚀 Swapping SOL for Token");
    console.log("Swap Transaction: ", "https://solscan.io/tx/" + tx);

    const saveConfirmation = await fetchAndSaveSwapDetails(tx);
    if (!saveConfirmation) {
      console.log("❌ Warning: Transaction not saved for tracking!");
    }
  } catch (error) {
    console.error("[Real Trading] ❌ Error:", error);
  }
}
