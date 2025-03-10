/**
 * @file fees.ts
 * @description Handles dynamic and fixed fee calculations for transactions
 */

import { Connection } from "@solana/web3.js";
import { Config } from "../types";

export interface FeeInfo {
  maxLamports: number;
  priorityLevel: "min" | "low" | "medium" | "high" | "veryHigh" | "custom" | "unsafeMax";
}

/**
 * Calculate transaction fee based on configuration and network conditions
 * @param connection Solana RPC connection
 * @param config Application configuration
 * @returns FeeInfo with maxLamports and priorityLevel
 */
export async function calculateTransactionFee(
  connection: Connection,
  config: Config
): Promise<FeeInfo> {
  // Return fixed fee if dynamic mode is not enabled
  if (config.swap.fees.mode === "fixed") {
    return {
      maxLamports: config.swap.fees.fixedOptions.prio_fee_max_lamports,
      priorityLevel: config.swap.fees.fixedOptions.prio_level
    };
  }

  try {
    // Get recent prioritization fees
    const recentFees = await connection.getRecentPrioritizationFees();
    
    // Filter by age and get fee values
    const validFees = recentFees
      .filter(fee => fee.slot >= (Date.now() / 1000 - config.swap.fees.dynamicOptions.maxAgeSec))
      .map(fee => fee.prioritizationFee)
      .sort((a, b) => a - b);

    // Use minimum fee if no valid fees found
    if (validFees.length === 0) {
      console.log("⚠️ No recent fees found, using minimum fee");
      return {
        maxLamports: config.swap.fees.dynamicOptions.minFee,
        priorityLevel: "custom"
      };
    }

    // Calculate fee at specified percentile
    const index = Math.floor(validFees.length * (config.swap.fees.dynamicOptions.percentile / 100));
    const baseFee = validFees[index];
    
    // Apply multiplier and ensure minimum fee
    const calculatedFee = Math.max(
      Math.ceil(baseFee * config.swap.fees.dynamicOptions.multiplier),
      config.swap.fees.dynamicOptions.minFee
    );

    console.log(`ℹ️ Dynamic fee calculated: ${calculatedFee} lamports`);
    
    return {
      maxLamports: calculatedFee,
      priorityLevel: "custom"
    };
  } catch (error) {
    console.warn("⚠️ Error calculating dynamic fee, falling back to fixed fee:", error);
    return {
      maxLamports: config.swap.fees.fixedOptions.prio_fee_max_lamports,
      priorityLevel: config.swap.fees.fixedOptions.prio_level
    };
  }
}