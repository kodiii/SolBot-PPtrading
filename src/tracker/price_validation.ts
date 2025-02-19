import { PriceHistory, PriceValidationResult, RollingAverageConfig, TokenPrice } from '../types';
import { Decimal } from '../utils/decimal';

export class PriceValidator {
    private priceHistories: Map<string, PriceHistory> = new Map();
    private readonly rollingAverageConfig: RollingAverageConfig;
    
    constructor(config: RollingAverageConfig) {
        this.rollingAverageConfig = config;
    }

    /**
     * Add a new price point to the history
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
     * Validate a new price against historical data
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
     * Calculate rolling average from price history
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
     * Get the latest price from a specific source
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
     * Clear price history for a token
     */
    public clearHistory(mint: string): void {
        this.priceHistories.delete(mint);
    }

    /**
     * Get current price history for a token
     */
    public getHistory(mint: string): PriceHistory | undefined {
        return this.priceHistories.get(mint);
    }
}