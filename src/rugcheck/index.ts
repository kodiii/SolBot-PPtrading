/**
 * @file rugcheck/index.ts
 * @description Main entry point for rugcheck module
 */

export * from './types';
export { ProviderType, getRugCheckProvider } from './factory';
export { getRugCheckConfirmed } from './validation';

import { getRugCheckProvider } from './factory';
import type { TokenValidationResult } from './types';

/**
 * Validates a token using the configured provider
 * @param tokenMint Token mint address to validate
 * @returns TokenValidationResult
 */
export async function validateToken(tokenMint: string): Promise<TokenValidationResult> {
  const provider = getRugCheckProvider();
  return provider.validateToken(tokenMint);
}