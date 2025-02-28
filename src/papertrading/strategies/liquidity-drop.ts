import { IStrategy, LiquidityDropStrategyConfig, MarketData, StrategyResult } from './types';
import { ConnectionManager } from '../db/connection_manager';
import { Database } from 'sqlite';
import { config } from '../../config';
import { Decimal } from '../../utils/decimal';

// Debug helper function to format timestamps consistently
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export class LiquidityDropStrategy implements IStrategy {
    private config: LiquidityDropStrategyConfig;
    private db: Database | null = null;
    private lastUpdateTime: Map<string, number> = new Map();
    private strategyId: string;
    
    // Track execution metrics for debugging
    private executionCount: number = 0;
    private lastExecutionTime: number = 0;
    private dbOperationCount: number = 0;
    
    // Check if debug is enabled for this strategy
    private isDebugEnabled(): boolean {
        // Strategy-specific debug setting overrides global setting if defined
        if (typeof this.config.debug !== 'undefined') {
            return this.config.debug;
        }
        // Otherwise use global debug setting
        return config.strategies.debug || false;
    }

    constructor(config: LiquidityDropStrategyConfig) {
        this.config = config;
        this.strategyId = `liquidity_drop_${Date.now()}`;
        if (this.isDebugEnabled()) {
            console.log(`🔍 [DEBUG][${this.strategyId}] Initializing LiquidityDropStrategy with threshold: ${this.config.threshold_percent}%`);
        }
        this.initializeDatabase();
    }

    private async initializeDatabase() {
        try {
            if (this.isDebugEnabled()) {
                console.log(`🔍 [DEBUG][${this.strategyId}] Connecting to database at ${formatTimestamp(Date.now())}`);
            }
            this.db = await ConnectionManager.getInstance().getConnection();
            // Create table if not exists to track liquidity
            await this.db.run(`
                CREATE TABLE IF NOT EXISTS liquidity_tracking (
                    token_mint TEXT PRIMARY KEY,
                    liquidity_usd REAL,
                    highest_liquidity REAL,
                    updated_at INTEGER
                )
            `);
            if (this.isDebugEnabled()) {
                console.log(`🔍 [DEBUG][${this.strategyId}] Database initialized successfully`);
            }
            ConnectionManager.getInstance().releaseConnection(this.db);
            this.db = null;
        } catch (error) {
            console.error(`❌ [ERROR][${this.strategyId}] Failed to initialize database:`, error);
        }
    }

    async onMarketData(data: MarketData): Promise<StrategyResult> {
        this.executionCount++;
        const executionId = this.executionCount;
        const currentTime = Date.now();
        const timeSinceLastExecution = currentTime - this.lastExecutionTime;
        
        if (this.isDebugEnabled()) {
            console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}] Strategy called at ${formatTimestamp(currentTime)} for token ${data.token_name} (${data.token_mint.substring(0, 8)}...)`);
            console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}] Time since last execution: ${timeSinceLastExecution}ms`);
        }
        
        const result: StrategyResult = {
            shouldSell: false,
            tokenMint: data.token_mint
        };

        if (!this.isEnabled()) {
            if (this.isDebugEnabled()) {
                console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}] Strategy disabled, skipping`);
            }
            return result;
        }

        // Check if we should update based on interval
        const lastUpdate = this.lastUpdateTime.get(data.token_mint) || 0;
        
        if (this.isDebugEnabled()) {
            console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}] Last update for token: ${formatTimestamp(lastUpdate)}`);
            console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}] Time since last update: ${currentTime - lastUpdate}ms, threshold: ${config.paper_trading.real_data_update}ms`);
        }
        
        if (currentTime - lastUpdate < config.paper_trading.real_data_update) {
            if (this.isDebugEnabled()) {
                console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}] Skipping update, too soon since last update`);
            }
            return result;
        }
        
        if (this.isDebugEnabled()) {
            console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}] Processing update with liquidity: $${data.liquidity_usd.toLocaleString()}`);
        }
        this.lastExecutionTime = currentTime;

        try {
            // Get a fresh database connection for each operation
            this.dbOperationCount++;
            const dbOpId = this.dbOperationCount;
            if (this.isDebugEnabled()) {
                console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Requesting database connection`);
            }
            
            const db = await ConnectionManager.getInstance().getConnection();
            if (this.isDebugEnabled()) {
                console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Database connection acquired`);
            }

            try {
                // Get highest liquidity recorded for this token
                if (this.isDebugEnabled()) {
                    console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Querying highest liquidity for token`);
                }
                const highestLiquidityRecord = await db.get(
                    'SELECT highest_liquidity FROM liquidity_tracking WHERE token_mint = ?',
                    [data.token_mint]
                );

                let highestLiquidity = highestLiquidityRecord?.highest_liquidity || 0;
                if (this.isDebugEnabled()) {
                    console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Previous highest liquidity: $${highestLiquidity.toLocaleString()}, current: $${data.liquidity_usd.toLocaleString()}`);
                }
                
                // If current liquidity is higher than recorded, update the record
                if (data.liquidity_usd > highestLiquidity) {
                    if (this.isDebugEnabled()) {
                        console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] New highest liquidity detected, updating record`);
                    }
                    await db.run(
                        'INSERT OR REPLACE INTO liquidity_tracking (token_mint, liquidity_usd, highest_liquidity, updated_at) VALUES (?, ?, ?, ?)',
                        [data.token_mint, data.liquidity_usd, data.liquidity_usd, currentTime]
                    );
                    highestLiquidity = data.liquidity_usd;
                } else {
                    // Update current liquidity while preserving highest
                    if (this.isDebugEnabled()) {
                        console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Updating current liquidity while preserving highest`);
                    }
                    await db.run(
                        'UPDATE liquidity_tracking SET liquidity_usd = ?, updated_at = ? WHERE token_mint = ?',
                        [data.liquidity_usd, currentTime, data.token_mint]
                    );
                }

                // Update the last check time
                this.lastUpdateTime.set(data.token_mint, currentTime);
                if (this.isDebugEnabled()) {
                    console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Updated last check time to ${formatTimestamp(currentTime)}`);
                }

                // Skip evaluation if we don't have enough historical data
                if (highestLiquidity === 0) {
                    if (this.isDebugEnabled()) {
                        console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] No historical data available, skipping evaluation`);
                    }
                    return result;
                }

                // Calculate percentage drop
                const dropPercent = 100 * (1 - (data.liquidity_usd / highestLiquidity));
                if (this.isDebugEnabled()) {
                    console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Liquidity drop calculation: ${dropPercent.toFixed(2)}% (threshold: ${this.config.threshold_percent}%)`);
                }
                
                // Check if drop exceeds threshold
                if (dropPercent >= this.config.threshold_percent) {
                    // Always log alerts regardless of debug setting
                    console.log(`⚠️ [ALERT][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Liquidity drop threshold exceeded: ${dropPercent.toFixed(2)}% > ${this.config.threshold_percent}%`);
                    result.shouldSell = true;
                    result.reason = `Liquidity dropped by ${dropPercent.toFixed(2)}% from peak (${new Decimal(highestLiquidity).toString()} to ${new Decimal(data.liquidity_usd).toString()} USD)`;
                }

                if (this.isDebugEnabled()) {
                    console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Strategy execution completed, shouldSell: ${result.shouldSell}`);
                }
                return result;
            } finally {
                // Always release the database connection
                if (this.isDebugEnabled()) {
                    console.log(`🔍 [DEBUG][${this.strategyId}][Exec:${executionId}][DB:${dbOpId}] Releasing database connection`);
                }
                ConnectionManager.getInstance().releaseConnection(db);
            }
        } catch (error) {
            console.error(`❌ [ERROR][${this.strategyId}][Exec:${executionId}] Error in liquidity drop strategy:`, error);
            return result;
        }
    }

    getName(): string {
        return 'Liquidity Drop Strategy';
    }

    getDescription(): string {
        return `Sells when liquidity drops by ${this.config.threshold_percent}% or more from its highest recorded value`;
    }

    isEnabled(): boolean {
        return this.config.enabled;
    }
}