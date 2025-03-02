/**
 * @file validation.ts
 * @description Token validation using rugcheck providers
 */

import { config } from "../config";
import { validateToken } from './index';
import { NewTokenRecord } from "../types";
import { insertNewToken } from "../tracker/db";

/**
 * Legacy function for backward compatibility
 * @param tokenMint Token mint address to validate
 * @returns Promise<boolean> Validation result
 */
export async function getRugCheckConfirmed(tokenMint: string): Promise<boolean> {
  try {
    const validationResult = await validateToken(tokenMint);
    
    if (config.rug_check.verbose_log) {
      console.log("Full token report:", validationResult);
    }

    if (!validationResult.isValid) {
      validationResult.errors.forEach(error => console.log('🚫', error));
      return false;
    }

    // Create new token record
    const newToken: NewTokenRecord = {
      time: Date.now(),
      mint: tokenMint,
      name: validationResult.tokenName,
      creator: validationResult.tokenCreator,
    };

    await insertNewToken(newToken).catch((err: Error) => {
      if (config.rug_check.block_returning_token_names || config.rug_check.block_returning_token_creators) {
        console.log("⛔ Unable to store new token for tracking duplicate tokens: " + err.message);
      }
    });

    return true;
  } catch (error: unknown) {
    console.error('❌ Failed to perform rug check:', error instanceof Error ? error.message : String(error));
    return false;
  }
}