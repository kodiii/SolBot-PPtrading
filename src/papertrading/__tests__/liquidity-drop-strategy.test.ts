import { LiquidityDropStrategy } from '../strategies/liquidity-drop';
import { MarketData } from '../strategies/types';
import { Decimal } from '../../utils/decimal';
import { ConnectionManager } from '../db/connection_manager';
import { config } from '../../config';

// Mock ConnectionManager
jest.mock('../db/connection_manager', () => {
  return {
    ConnectionManager: {
      getInstance: jest.fn().mockReturnValue({
        getConnection: jest.fn().mockResolvedValue({
          get: jest.fn(),
          run: jest.fn()
        })
      })
    }
  };
});

describe('LiquidityDropStrategy', () => {
  const mockConfig = {
    enabled: true,
    threshold_percent: 20
  };

  let strategy: LiquidityDropStrategy;
  let mockDb: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb = {
      get: jest.fn(),
      run: jest.fn()
    };
    (ConnectionManager.getInstance as jest.Mock).mockReturnValue({
      getConnection: jest.fn().mockResolvedValue(mockDb)
    });
    strategy = new LiquidityDropStrategy(mockConfig);
    // Wait for database initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should not trigger sell when no historical data exists', async () => {
    const marketData: MarketData = {
      token_mint: 'test-token',
      token_name: 'TEST',
      current_price: new Decimal('1.0'),
      volume_m5: 1000,
      marketCap: 1000000,
      liquidity_usd: 100000,
      timestamp: Date.now()
    };

    mockDb.get.mockResolvedValue(null);

    const result = await strategy.onMarketData(marketData);
    expect(result.shouldSell).toBeFalsy();
    expect(mockDb.get).toHaveBeenCalledWith(
      expect.stringContaining('SELECT MAX(liquidity_usd)'),
      ['test-token']
    );
  });

  it('should trigger sell when liquidity drops below threshold', async () => {
    const marketData: MarketData = {
      token_mint: 'test-token',
      token_name: 'TEST',
      current_price: new Decimal('1.0'),
      volume_m5: 1000,
      marketCap: 1000000,
      liquidity_usd: 75000, // 25% drop from 100000
      timestamp: Date.now()
    };

    // Mock highest liquidity in database
    mockDb.get.mockResolvedValue({ highest_liquidity: 100000 });

    const result = await strategy.onMarketData(marketData);
    expect(result.shouldSell).toBeTruthy();
    expect(result.reason).toContain('Liquidity dropped by');
    expect(result.reason).toContain('25.00%');
  });

  it('should not trigger sell when liquidity drop is below threshold', async () => {
    const marketData: MarketData = {
      token_mint: 'test-token',
      token_name: 'TEST',
      current_price: new Decimal('1.0'),
      volume_m5: 1000,
      marketCap: 1000000,
      liquidity_usd: 85000, // 15% drop from 100000
      timestamp: Date.now()
    };

    // Mock highest liquidity in database
    mockDb.get.mockResolvedValue({ highest_liquidity: 100000 });

    const result = await strategy.onMarketData(marketData);
    expect(result.shouldSell).toBeFalsy();
  });

  it('should respect update interval', async () => {
    const marketData: MarketData = {
      token_mint: 'test-token',
      token_name: 'TEST',
      current_price: new Decimal('1.0'),
      volume_m5: 1000,
      marketCap: 1000000,
      liquidity_usd: 70000, // 30% drop from 100000
      timestamp: Date.now()
    };

    // Mock highest liquidity in database
    mockDb.get.mockResolvedValue({ highest_liquidity: 100000 });

    // First check
    const result1 = await strategy.onMarketData(marketData);
    expect(result1.shouldSell).toBeTruthy();

    // Immediate second check should be ignored
    const result2 = await strategy.onMarketData(marketData);
    expect(result2.shouldSell).toBeFalsy();
    expect(mockDb.get).toHaveBeenCalledTimes(1); // Database only queried once

    // Wait for update interval
    await new Promise(resolve => setTimeout(resolve, config.paper_trading.real_data_update));

    // Now the check should happen
    const result3 = await strategy.onMarketData(marketData);
    expect(result3.shouldSell).toBeTruthy();
    expect(mockDb.get).toHaveBeenCalledTimes(2); // Database queried again after interval
  });

  it('should handle database errors gracefully', async () => {
    const marketData: MarketData = {
      token_mint: 'test-token',
      token_name: 'TEST',
      current_price: new Decimal('1.0'),
      volume_m5: 1000,
      marketCap: 1000000,
      liquidity_usd: 70000,
      timestamp: Date.now()
    };

    // Mock database error
    mockDb.get.mockRejectedValue(new Error('Database error'));

    const result = await strategy.onMarketData(marketData);
    expect(result.shouldSell).toBeFalsy(); // Should not sell on error
  });
});