/**
 * @file Validation rules for RugCheck.xyz provider
 */

import { config } from '../../../config';
import { RugCheckXYZResponse } from './types';

interface ValidationResult {
  category: string;
  rule: string;
  passed: boolean;
  message?: string;
}

/**
 * Validates market conditions
 */
function validateMarket(data: RugCheckXYZResponse): ValidationResult[] {
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

/**
 * Validates token holder distribution
 */
function validateHolders(data: RugCheckXYZResponse): ValidationResult[] {
  const results: ValidationResult[] = [];
  let totalTopHoldersPercentage = 0;

  // Check individual holder percentages
  data.topHolders.forEach((holder, index) => {
    results.push({
      category: 'Holders',
      rule: `Top Holder #${index + 1}`,
      passed: holder.pct <= config.rug_check.max_alowed_pct_topholders,
      message: holder.pct > config.rug_check.max_alowed_pct_topholders
        ? `Holder ${holder.address} owns too much: ${holder.pct}%`
        : undefined
    });
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

/**
 * Validates token metadata and properties
 */
function validateTokenMetadata(data: RugCheckXYZResponse): ValidationResult[] {
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

  return results;
}

/**
 * Validates token content rules
 */
function validateTokenContent(data: RugCheckXYZResponse): ValidationResult[] {
  const results: ValidationResult[] = [];
  const tokenName = data.tokenMeta.name.toLowerCase();
  const tokenSymbol = data.tokenMeta.symbol.toLowerCase();

  // Check blocked names
  const blockedName = config.rug_check.block_names.some((name: string) => 
    tokenName.includes(name.toLowerCase())
  );
  results.push({
    category: 'Content',
    rule: 'Name Blacklist',
    passed: !blockedName,
    message: blockedName ? 'Token name contains blocked terms' : undefined
  });

  // Check blocked symbols
  const blockedSymbol = config.rug_check.block_symbols.some((symbol: string) => 
    tokenSymbol === symbol.toLowerCase()
  );
  results.push({
    category: 'Content',
    rule: 'Symbol Blacklist',
    passed: !blockedSymbol,
    message: blockedSymbol ? 'Token symbol is blocked' : undefined
  });

  // Check required content
  if (config.rug_check.only_contain_string) {
    const hasRequiredString = config.rug_check.contain_string.some((str: string) => 
      tokenName.includes(str.toLowerCase())
    );
    results.push({
      category: 'Content',
      rule: 'Required Terms',
      passed: hasRequiredString,
      message: !hasRequiredString ? 'Token name missing required terms' : undefined
    });
  }

  return results;
}

/**
 * Validates token score and price
 */
function validateScoring(data: RugCheckXYZResponse): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check risk score
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

  // Check price
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

  return results;
}

/**
 * Validates legacy risk conditions
 */
function validateLegacyRisks(data: RugCheckXYZResponse): ValidationResult[] {
  return config.rug_check.legacy_not_allowed.map((risk: string) => {
    let passed = true;
    switch (risk) {
      case 'Freeze Authority still enabled':
        passed = data.token.freezeAuthority === null;
        break;
      case 'Single holder ownership':
        passed = !data.topHolders.some(h => h.pct > 50);
        break;
      case 'Copycat token':
        passed = !data.tokenMeta.name.includes('FAKE') && 
                !data.tokenMeta.name.includes('COPY');
        break;
    }

    return {
      category: 'Legacy',
      rule: risk,
      passed,
      message: passed ? undefined : risk
    };
  });
}

/**
 * Validates all conditions for a token
 */
export function validateToken(data: RugCheckXYZResponse): string[] {
  const allResults = [
    ...validateMarket(data),
    ...validateHolders(data),
    ...validateTokenMetadata(data),
    ...validateTokenContent(data),
    ...validateScoring(data),
    ...validateLegacyRisks(data)
  ];

  // Log validation results
  console.log('\n🔍 Validation Results:');
  let lastCategory = '';
  allResults.forEach(result => {
    if (result.category !== lastCategory) {
      console.log(`\n${result.category}:`);
      lastCategory = result.category;
    }
    
    const icon = result.passed ? '✅' : '❌';
    console.log(`  ${icon} ${result.rule}${result.message ? `: ${result.message}` : ''}`);
  });
  console.log('\n');

  // Return only error messages
  return allResults
    .filter(result => !result.passed)
    .map(result => result.message || result.rule);
}
