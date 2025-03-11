/**
 * Wallet validation and checking utilities
 */

import { Connection } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import { config } from "../config";
import { calculateTransactionFee } from "./fees";

/**
 * Calculate total required amount including fees
 * @param connection - Solana connection
 * @returns Promise<number> - Required amount in SOL
 */
async function calculateRequiredAmount(connection: Connection): Promise<number> {
  const swapAmount = parseFloat(config.swap.amount) / 1_000_000_000; // Convert lamports to SOL
  const feeInfo = await calculateTransactionFee(connection, config);
  
  // Convert fee to SOL and add safety margin
  const estimatedFees = config.swap.fees.mode === 'fixed'
    ? config.swap.fees.fixedOptions.prio_fee_max_lamports / 1_000_000_000
    : Math.ceil(Number(feeInfo) * config.swap.fees.dynamicOptions.multiplier) / 1_000_000_000;

  return swapAmount + estimatedFees;
}

/**
 * Check wallet balance for trading
 * @param connection - Solana connection
 * @param wallet - Anchor wallet instance
 * @param retryCount - Current retry attempt (for recursive retries)
 * @returns true if wallet has sufficient balance
 */
export async function checkWalletBalance(
  connection: Connection, 
  wallet: Wallet,
  retryCount = 0
): Promise<boolean> {
  try {
    const balance = await connection.getBalance(wallet.publicKey);
    const balanceInSOL = balance / 1_000_000_000;
    const requiredAmount = await calculateRequiredAmount(connection);

    if (balanceInSOL < requiredAmount) {
      console.log('\n⚠️ Insufficient SOL balance for trading:');
      console.log(`💰 Current balance: ${balanceInSOL.toFixed(4)} SOL`);
      console.log(`💳 Required amount: ${requiredAmount.toFixed(4)} SOL`);
      console.log('   (includes transaction fees and safety margin)');
      console.log('❌ Transaction cannot proceed without sufficient funds\n');

      // Implement retry logic if needed
      const maxRetries = config.tx.fetch_tx_max_retries;
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying balance check (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, config.tx.retry_delay));
        return checkWalletBalance(connection, wallet, retryCount + 1);
      }

      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking wallet balance:', error);
    return false;
  }
}

/**
 * Initialize wallet checks for trading
 * @param connection - Solana connection
 * @param wallet - Anchor wallet instance
 * @returns true if wallet is ready for trading
 */
export async function initializeWalletChecks(
  connection: Connection,
  wallet: Wallet
): Promise<boolean> {
  console.log('\n🔍 Checking wallet status...');
  
  try {
    // Verify account exists
    const accountInfo = await connection.getAccountInfo(wallet.publicKey);
    if (!accountInfo) {
      console.log('❌ Wallet account not found on chain');
      return false;
    }

    // Check balance with retry logic
    const hasBalance = await checkWalletBalance(connection, wallet);
    if (!hasBalance) {
      return false;
    }

    console.log('✅ Wallet checks passed - Ready for trading\n');
    return true;
  } catch (error) {
    console.error('Error during wallet initialization:', error);
    return false;
  }
}