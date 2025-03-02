/**
 * @file transactions.ts
 * @description Core transaction handling system for Solana trading bot.
 * This file is being deprecated in favor of the modular structure in /transactions folder.
 * @deprecated Use individual modules from /transactions instead
 */

import { validateToken } from './rugcheck';

export {
  createSwapTransaction,
  fetchTransactionDetails,
  fetchAndSaveSwapDetails,
  createSellTransaction,
  getRugCheckConfirmed
} from './transactions/index';

// Re-export performRugCheck for backward compatibility
export const performRugCheck = validateToken;
