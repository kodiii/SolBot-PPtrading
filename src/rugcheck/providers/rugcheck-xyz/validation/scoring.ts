/**
 * @file Token scoring and price validation rules
 */

import { config } from '../../../../config';
import { RugCheckXYZResponse } from '../types';
import { ValidationResult } from './types';

export function validateScoring(data: RugCheckXYZResponse): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check risk score if configured
  if (config.rug_check.max_score > 0) {
    results.push({
      category: 'Scoring',
      rule: 'Risk Score',
      passed: data.score <= config.rug_check.max_score,
      message: data.score > config.rug_check.max_score
        ? `Risk score too high: ${data.score}`
        : undefined
    });
  }

  // Check token price
  const price = Number(data.price);
  if (!isNaN(price)) {
    results.push({
      category: 'Scoring',
      rule: 'Price Check',
      passed: price <= config.rug_check.max_price_token,
      message: price > config.rug_check.max_price_token
        ? `Token price too high: ${price}`
        : undefined
    });
  }

  // Check market cap if available and configured
  const marketCap = Number(data.marketCap);
  if (!isNaN(marketCap) && config.rug_check.max_marketcap > 0) {
    results.push({
      category: 'Scoring',
      rule: 'Market Cap',
      passed: marketCap <= config.rug_check.max_marketcap,
      message: marketCap > config.rug_check.max_marketcap
        ? `Market cap too high: ${marketCap}`
        : undefined
    });
  }

  // Check individual risk factors
  data.risks?.forEach((risk, index) => {
    results.push({
      category: 'Risk Factors',
      rule: risk.name,
      passed: risk.level.toLowerCase() !== 'critical',
      message: risk.level.toLowerCase() === 'critical'
        ? `Critical risk found: ${risk.description} (Score: ${risk.score})`
        : undefined
    });
  });

  return results;
}