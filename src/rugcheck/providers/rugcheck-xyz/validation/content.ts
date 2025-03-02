/**
 * @file Token content validation rules
 */

import { config } from '../../../../config';
import { RugCheckXYZResponse } from '../types';
import { ValidationResult } from './types';

export function validateTokenContent(data: RugCheckXYZResponse): ValidationResult[] {
  const results: ValidationResult[] = [];
  const tokenName = data.tokenMeta.name.toLowerCase();
  const tokenSymbol = data.tokenMeta.symbol.toLowerCase();

  // Check blocked names
  const blockedName = config.rug_check.block_names.some(name => 
    tokenName.includes(name.toLowerCase())
  );
  results.push({
    category: 'Content',
    rule: 'Name Blacklist',
    passed: !blockedName,
    message: blockedName ? 'Token name contains blocked terms' : undefined
  });

  // Check blocked symbols
  const blockedSymbol = config.rug_check.block_symbols.some(symbol => 
    tokenSymbol === symbol.toLowerCase()
  );
  results.push({
    category: 'Content',
    rule: 'Symbol Blacklist',
    passed: !blockedSymbol,
    message: blockedSymbol ? 'Token symbol is blocked' : undefined
  });

  // Check required content strings
  if (config.rug_check.only_contain_string) {
    const hasRequiredString = config.rug_check.contain_string.some(str => 
      tokenName.includes(str.toLowerCase())
    );
    results.push({
      category: 'Content',
      rule: 'Required Terms',
      passed: hasRequiredString,
      message: !hasRequiredString ? 'Token name missing required terms' : undefined
    });
  }

  // Check for potential copycat names
  if (config.rug_check.legacy_not_allowed.includes('Copycat token')) {
    const isCopycat = data.tokenMeta.name.toLowerCase().includes('fake') || 
                     data.tokenMeta.name.toLowerCase().includes('copy');
    results.push({
      category: 'Content',
      rule: 'Copycat Detection',
      passed: !isCopycat,
      message: isCopycat ? 'Token appears to be a copycat' : undefined
    });
  }

  return results;
}