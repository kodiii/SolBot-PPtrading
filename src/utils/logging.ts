/**
 * Logging utility module
 * Provides centralized logging control
 */

import { config } from '../config';

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

/**
 * Check if a message should be shown based on content
 * @param msg - Message to check
 * @returns boolean
 */
function shouldShowMessage(msg: string): boolean {
  // Always show messages starting with these prefixes
  const alwaysShowPrefixes = [
    '[Real Trading]',
    '===',
    '❌',
    '⛔',
    '🚫',
    '🔎',
    '💰'
  ];

  // Hide messages containing trade details unless verbose_log is true
  const hideUnlessVerbose = [
    'PnL:',
    'Token price in SOL:',
    'Buy Amount:',
    'Sell Amount:',
    'Final price after',
    'Total received:',
    'Token Info:',
    'Original:',
    'Adjusted w/slippage:',
    'Paper Trade:',
    'trades executed',
    'profitable trades',
    'Paper trading balance'
  ];

  // Check if message should always be shown
  if (alwaysShowPrefixes.some(prefix => msg.includes(prefix))) {
    return true;
  }

  // Check if message should be hidden unless verbose
  if (!config.paper_trading.verbose_log && 
      hideUnlessVerbose.some(text => msg.includes(text))) {
    return false;
  }

  return true;
}

/**
 * Initialize logging based on configuration
 * Allows suppressing non-critical logs in production
 */
export function initializeLogging(): void {
    // Keep original error logging
    console.error = originalConsoleError;

    // Override console.log to respect verbose_log setting
    console.log = (...args: any[]) => {
        const msg = args[0]?.toString() || '';
        
        if (shouldShowMessage(msg)) {
            originalConsoleLog(...args);
        }
    };
}

/**
 * Reset logging to original behavior
 * Useful for testing or cleanup
 */
export function resetLogging(): void {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
}
