import { PriceHistory, PriceValidationResult, RollingAverageConfig, TokenPrice } from '../types';
import { Decimal } from '../utils/decimal';

/**
 * PriceValidator provides a robust system for validating cryptocurrency token prices
 * by comparing them against historical data and cross-validating between different price sources.
 * 
 * Features:
 * - Maintains a rolling window of historical prices for each token
 * - Cross-validates prices between Jupiter and Dexscreener sources
 * - Implements asymmetric validation thresholds (more tolerant of price drops)
 * - Provides confidence scores for price validations
 * 
 * Configuration:
 * - windowSize: Number of historical price points to maintain
 * - maxDeviation: Maximum allowed price deviation (as a decimal, e.g., 0.05 = 5%)
 * - minDataPoints: Minimum required data points for validation
*/

export class PriceValidator {
    private priceHistories: Map<string, PriceHistory> = new Map();
    private readonly rollingAverageConfig: RollingAverageConfig;
    
    constructor(config: RollingAverageConfig) {
        this.rollingAverageConfig = config;
    }

    /**
     * Adds a new price point to the token's price history.
     * Maintains a sliding window of recent prices, keeping only the latest [windowSize] entries.
     * 
     * @param mint - The token's mint address
     * @param price - Price data including the price value, timestamp, and source
     */
    public addPricePoint(mint: string, price: TokenPrice): void {
        const history = this.priceHistories.get(mint) || {
            mint,
            prices: [],
            lastValidation: 0
        };

        history.prices.push(price);
        
        // Keep only the latest window size of prices
        if (history.prices.length > this.rollingAverageConfig.windowSize) {
            history.prices = history.prices.slice(-this.rollingAverageConfig.windowSize);
        }

        this.priceHistories.set(mint, history);
    }

    /**
     * Validates a new price against historical data using multiple validation strategies:
     * 1. Cross-source validation: Compares prices between Jupiter and Dexscreener
     * 2. Rolling average validation: Compares against historical average with asymmetric thresholds
     * 
     * The validation is asymmetric, allowing larger downside movements (1.5x threshold)
     * compared to upside movements to account for typical crypto market behavior.
     * 
     * @param mint - The token's mint address
     * @param newPrice - The price to validate
     * @param source - The price source ('jupiter' or 'dexscreener')
     * @returns Validation result including:
     *          - isValid: Whether the price is considered valid
     *          - confidence: Confidence score (0-1)
     *          - reason: Explanation of the validation result
     *          - suggestedPrice: Alternative price suggestion if validation fails
     */
    public validatePrice(mint: string, newPrice: number | string, source: 'jupiter' | 'dexscreener'): PriceValidationResult {
        const history = this.priceHistories.get(mint);
        const newPriceDecimal = new Decimal(newPrice);
        
        if (!history || history.prices.length < this.rollingAverageConfig.minDataPoints) {
            return {
                isValid: true,
                confidence: 0.5,
                reason: 'Insufficient historical data'
            };
        }

        const rollingAverage = this.calculateRollingAverage(history.prices);
        
        // Cross-validate between sources first
        const otherSource = source === 'jupiter' ? 'dexscreener' : 'jupiter';
        const latestOtherSourcePrice = this.getLatestPriceFromSource(history.prices, otherSource);
        
        if (latestOtherSourcePrice) {
            const sourceDivergence = newPriceDecimal
                .subtract(latestOtherSourcePrice.price)
                .abs()
                .divide(latestOtherSourcePrice.price);
            
            if (sourceDivergence.greaterThan(this.rollingAverageConfig.maxDeviation)) {
                return {
                    isValid: false,
                    confidence: new Decimal(1).subtract(sourceDivergence).toNumber(),
                    reason: `Price sources diverge by ${sourceDivergence.multiply(100).toString(2)}%`,
                    suggestedPrice: rollingAverage
                };
            }
        }

        // Calculate deviation from rolling average
        const deviation = newPriceDecimal.subtract(rollingAverage).divide(rollingAverage);
        const absDeviation = deviation.abs();

        // Asymmetric validation: allow more downside movement than upside
        const maxAllowedDeviation = deviation.isPositive()
            ? new Decimal(this.rollingAverageConfig.maxDeviation)
            : new Decimal(this.rollingAverageConfig.maxDeviation).multiply(1.5);

        if (absDeviation.greaterThan(maxAllowedDeviation)) {
            return {
                isValid: false,
                confidence: new Decimal(1).subtract(absDeviation).toNumber(),
                reason: `Price deviation (${absDeviation.multiply(100).toString(2)}%) exceeds maximum allowed (${maxAllowedDeviation.multiply(100).toString(2)}%)`,
                suggestedPrice: rollingAverage
            };
        }

        return {
            isValid: true,
            confidence: new Decimal(1).subtract(absDeviation).toNumber(),
            reason: 'Price within acceptable range'
        };
    }

    /**
     * Calculates the rolling average from recent price history.
     * Uses the most recent [windowSize] prices to compute a simple arithmetic mean.
     * 
     * @param prices - Array of historical price points
     * @returns The calculated rolling average as a Decimal
     */
    private calculateRollingAverage(prices: TokenPrice[]): Decimal {
        const relevantPrices = prices.slice(-this.rollingAverageConfig.windowSize);
        const sum = relevantPrices.reduce(
            (acc, curr) => acc.add(curr.price), 
            Decimal.ZERO
        );
        return sum.divide(relevantPrices.length);
    }

    /**
     * Retrieves the most recent price from a specific source (Jupiter or Dexscreener).
     * Used for cross-validation between different price sources.
     * 
     * @param prices - Array of historical price points
     * @param source - The price source to filter by
     * @returns The most recent matching price entry or null if none found
     */
    private getLatestPriceFromSource(prices: TokenPrice[], source: 'jupiter' | 'dexscreener'): TokenPrice | null {
        for (let i = prices.length - 1; i >= 0; i--) {
            if (prices[i].source === source) {
                return prices[i];
            }
        }
        return null;
    }

    /**
     * Clears all price history for a specific token.
     * Useful when resetting the validation state or cleaning up stale data.
     * 
     * @param mint - The token's mint address
     */
    public clearHistory(mint: string): void {
        this.priceHistories.delete(mint);
    }

    /**
     * Retrieves the current price history for a token.
     * Includes all stored price points within the rolling window.
     * 
     * @param mint - The token's mint address
     * @returns The token's price history or undefined if no history exists
     */
    public getHistory(mint: string): PriceHistory | undefined {
        return this.priceHistories.get(mint);
    }
}