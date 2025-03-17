/**
 * System initialization module
 * Handles initial setup, wallet validation, and trading mode configuration
 */

import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";
import { config } from "../config";
import { SimulationService } from "../papertrading/services";
import { ConnectionManager } from "../papertrading/db/connection_manager";
import { initializePaperTradingDB } from "../papertrading/paper_trading";
import { initializeWalletChecks } from "../utils/wallet-checks";
import { initializeLogging } from "../utils/logging";

export const TRADING_MODE = config.rug_check.simulation_mode ? "Paper Trading" : "Real Trading";

/**
 * Initialize and validate wallet for real trading
 * @returns Promise<boolean> true if wallet is ready for trading
 */
async function initializeWallet(): Promise<boolean> {
  try {
    const rpcUrl = process.env.HELIUS_HTTPS_URI || "";
    const connection = new Connection(rpcUrl);
    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIV_KEY_WALLET || "")));
    
    // Check and display current balance
    const balance = await connection.getBalance(wallet.publicKey);
    const balanceInSOL = balance / 1_000_000_000;
    console.log(`\n💰 Current wallet balance: ${balanceInSOL.toFixed(4)} SOL`);
    
    if (balanceInSOL === 0) {
      console.error('❌ Wallet has zero balance. Cannot proceed with real trading.');
      return false;
    }

    const hasWallet = await initializeWalletChecks(connection, wallet);
    if (!hasWallet) {
      console.error('❌ Wallet validation failed. Cannot proceed with real trading.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error initializing wallet:', error);
    return false;
  }
}

/**
 * Initializes the trading system and validates configuration
 */
export async function initializeSystem(): Promise<boolean> {
  // Initialize logging system
  initializeLogging();
  
  // Display trading mode banner
  console.clear();
  console.log('=============================================');
  console.log(`             ${TRADING_MODE} Mode`);
  console.log('=============================================');

  // Initialize database connections
  const connectionManager = ConnectionManager.getInstance("src/papertrading/db/paper_trading.db");
  await connectionManager.initialize();
  
  const dbSuccess = await initializePaperTradingDB();
  if (!dbSuccess) {
    console.error('Failed to initialize paper trading database');
    return false;
  }
  
  // Initialize services based on trading mode
  if (config.rug_check.simulation_mode) {
    console.log('\n🎮 Operating in Paper Trading Mode (Simulation)');
    console.log('💡 All trades will be simulated with no real transactions');
    SimulationService.getInstance();
    console.log('🎯 Paper Trading Simulation Mode initialized');
  } else {
    console.log('\n🚀 Operating in Real Trading Mode');
    console.log('⚠️  WARNING: Real transactions will be executed with actual SOL');
    console.log('💰 Make sure you have sufficient funds in your wallet');

    // Validate wallet for real trading
    const walletReady = await initializeWallet();
    if (!walletReady) {
      return false;
    }
  }
  
  console.log('=============================================\n');
  return true;
}
