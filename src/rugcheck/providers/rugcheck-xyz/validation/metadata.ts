/**
 * @file Token metadata validation rules
 */

import { config } from '../../../../config';
import { RugCheckXYZResponse } from '../types';
import { ValidationResult } from './types';

export function validateTokenMetadata(data: RugCheckXYZResponse): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check mint authority
  results.push({
    category: 'Metadata',
    rule: 'Mint Authority',
    passed: config.rug_check.allow_mint_authority || data.token.mintAuthority === null,
    message: !config.rug_check.allow_mint_authority && data.token.mintAuthority !== null
      ? 'Mint authority is not burned'
      : undefined
  });

  // Check freeze authority
  results.push({
    category: 'Metadata',
    rule: 'Freeze Authority',
    passed: config.rug_check.allow_freeze_authority || data.token.freezeAuthority === null,
    message: !config.rug_check.allow_freeze_authority && data.token.freezeAuthority !== null
      ? 'Freeze authority is not burned'
      : undefined
  });

  // Check initialization
  results.push({
    category: 'Metadata',
    rule: 'Initialization',
    passed: config.rug_check.allow_not_initialized || data.token.isInitialized,
    message: !config.rug_check.allow_not_initialized && !data.token.isInitialized
      ? 'Token is not initialized'
      : undefined
  });

  // Check mutability
  results.push({
    category: 'Metadata',
    rule: 'Mutability',
    passed: config.rug_check.allow_mutable || !data.tokenMeta.mutable,
    message: !config.rug_check.allow_mutable && data.tokenMeta.mutable
      ? 'Token metadata is mutable'
      : undefined
  });

  // Check legacy risks
  if (!config.rug_check.allow_rugged && data.rugged) {
    results.push({
      category: 'Metadata',
      rule: 'Rug Status',
      passed: false,
      message: 'Token is marked as rugged'
    });
  }

  return results;
}