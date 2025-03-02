/**
 * @file Validation module entry point
 */

import { config } from '../../../../config';
import { RugCheckXYZResponse } from '../types';
import { ValidationResult } from './types';
import { validateMarket } from './market';
import { validateHolders } from './holders';
import { validateTokenMetadata } from './metadata';
import { validateTokenContent } from './content';
import { validateScoring } from './scoring';

/**
 * Runs all validation checks and logs results
 */
export function validateToken(data: RugCheckXYZResponse): string[] {
  const allResults: ValidationResult[] = [
    ...validateMarket(data),
    ...validateHolders(data),
    ...validateTokenMetadata(data),
    ...validateTokenContent(data),
    ...validateScoring(data)
  ];

  // Log validation results
  console.log('\n🔍 Token Validation Results:');
  
  // Initialize counters
  const stats = {
    total: allResults.length,
    passed: 0,
    failed: 0,
  };

  // Group results by category
  const resultsByCategory: Record<string, ValidationResult[]> = {};
  allResults.forEach(result => {
    if (!resultsByCategory[result.category]) {
      resultsByCategory[result.category] = [];
    }
    resultsByCategory[result.category].push(result);

    // Update stats
    if (result.passed) stats.passed++;
    else stats.failed++;
  });

  // Print results by category
  Object.entries(resultsByCategory).forEach(([category, results]) => {
    const categoryStats = {
      passed: results.filter(r => r.passed).length,
      total: results.length
    };

    console.log(`\n${category} (${categoryStats.passed}/${categoryStats.total}):`);
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`  ${icon} ${result.rule}${result.message ? `: ${result.message}` : ''}`);
    });
  });

  // Print summary
  console.log(`\n📊 Summary: ${stats.passed}/${stats.total} checks passed (${stats.failed} failed)`);
  if (config.rug_check.verbose_log) {
    console.log('\nRaw validation data:', data);
  }
  console.log('\n');

  // Return only error messages
  return allResults
    .filter(result => !result.passed)
    .map(result => result.message || result.rule);
}