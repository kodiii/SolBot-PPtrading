/**
 * @file Holder validation rules
 */

import { config } from '../../../../config';
import { RugCheckXYZResponse } from '../types';
import { ValidationResult } from './types';

export function validateHolders(data: RugCheckXYZResponse): ValidationResult[] {
  const results: ValidationResult[] = [];
  let totalTopHoldersPercentage = 0;

  // Check individual holder percentages
  data.topHolders.forEach((holder, index) => {
    const holderResult: ValidationResult = {
      category: 'Holders',
      rule: `Top Holder #${index + 1}`,
      passed: holder.pct <= config.rug_check.max_alowed_pct_topholders,
      message: holder.pct > config.rug_check.max_alowed_pct_topholders
        ? `Holder ${holder.address} owns too much: ${holder.pct}%`
        : undefined
    };
    
    results.push(holderResult);
    totalTopHoldersPercentage += holder.pct;
  });

  // Check total percentage
  results.push({
    category: 'Holders',
    rule: 'Combined Holdings',
    passed: totalTopHoldersPercentage <= config.rug_check.max_alowed_pct_all_topholders,
    message: totalTopHoldersPercentage > config.rug_check.max_alowed_pct_all_topholders
      ? `Top holders own too much combined: ${totalTopHoldersPercentage}%`
      : undefined
  });

  // Check for insiders
  if (!config.rug_check.allow_insider_topholders) {
    const insiders = data.topHolders.filter(h => h.insider);
    results.push({
      category: 'Holders',
      rule: 'Insider Check',
      passed: insiders.length === 0,
      message: insiders.length > 0
        ? `Found ${insiders.length} insider holders`
        : undefined
    });
  }

  return results;
}