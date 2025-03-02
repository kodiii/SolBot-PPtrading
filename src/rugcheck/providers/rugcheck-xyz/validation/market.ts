/**
 * @file Market validation rules
 */

import { config } from '../../../../config';
import { RugCheckXYZResponse } from '../types';
import { ValidationResult } from './types';

export function validateMarket(data: RugCheckXYZResponse): ValidationResult[] {
  const results: ValidationResult[] = [];
  const totalLiquidity = Number(data.totalMarketLiquidity);
  
  // Check min liquidity
  results.push({
    category: 'Market',
    rule: 'Minimum Liquidity',
    passed: totalLiquidity >= config.rug_check.min_total_market_Liquidity,
    message: totalLiquidity < config.rug_check.min_total_market_Liquidity
      ? `Total market liquidity (${totalLiquidity}) below minimum threshold`
      : undefined
  });

  // Check max liquidity
  results.push({
    category: 'Market',
    rule: 'Maximum Liquidity',
    passed: totalLiquidity <= config.rug_check.max_total_market_Liquidity,
    message: totalLiquidity > config.rug_check.max_total_market_Liquidity
      ? `Total market liquidity (${totalLiquidity}) above maximum threshold`
      : undefined
  });

  // Check LP providers
  results.push({
    category: 'Market',
    rule: 'LP Providers',
    passed: data.totalLPProviders >= config.rug_check.min_total_lp_providers,
    message: data.totalLPProviders < config.rug_check.min_total_lp_providers
      ? `Too few LP providers (${data.totalLPProviders})`
      : undefined
  });

  // Check markets count
  results.push({
    category: 'Market',
    rule: 'Market Count',
    passed: data.markets.length >= config.rug_check.min_total_markets,
    message: data.markets.length < config.rug_check.min_total_markets
      ? `Insufficient trading markets (${data.markets.length})`
      : undefined
  });

  return results;
}