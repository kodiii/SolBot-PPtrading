import { IPriceTracker, ISimulationService, ITradeExecutor, TokenPriceData } from '../types';
import { Decimal } from '../../../utils/decimal';

describe('Service Interfaces', () => {
  class MockPriceTracker implements IPriceTracker {
    async getTokenPrice(): Promise<TokenPriceData | null> {
      return {
        price: new Decimal('1.0'),
        symbol: 'TEST',
        dexData: {
          volume_m5: 1000,
          marketCap: 50000,
          liquidity_usd: 10000
        }
      };
    }

    getSolUsdPrice(): Decimal | null {
      return new Decimal('30');  // Using simple format since toString() doesn't maintain trailing zeros
    }
  }

  class MockTradeExecutor implements ITradeExecutor {
    async executeBuy(): Promise<boolean> {
      return true;
    }

    async executeSell(): Promise<boolean> {
      return true;
    }
  }

  class MockSimulationService implements ISimulationService {
    async getTokenPrice(): Promise<TokenPriceData | null> {
      return {
        price: new Decimal('1.0'),
        symbol: 'TEST',
        dexData: {
          volume_m5: 1000,
          marketCap: 50000,
          liquidity_usd: 10000
        }
      };
    }

    getSolUsdPrice(): Decimal | null {
      return new Decimal('30');  // Using simple format since toString() doesn't maintain trailing zeros
    }

    async executeBuy(): Promise<boolean> {
      return true;
    }

    async executeSell(): Promise<boolean> {
      return true;
    }

    cleanup(): void {
      // Cleanup implementation
    }
  }

  describe('IPriceTracker', () => {
    let priceTracker: IPriceTracker;

    beforeEach(() => {
      priceTracker = new MockPriceTracker();
    });

    it('should implement required methods', async () => {
      const price = await priceTracker.getTokenPrice('test-mint');
      expect(price?.price).toBeTruthy();
      expect(price?.symbol).toBe('TEST');

      const solPrice = priceTracker.getSolUsdPrice();
      expect(Number(solPrice)).toBe(30);  // Compare as number instead of string to avoid formatting issues
    });
  });

  describe('ITradeExecutor', () => {
    let tradeExecutor: ITradeExecutor;

    beforeEach(() => {
      tradeExecutor = new MockTradeExecutor();
    });

    it('should implement required methods', async () => {
      const buyResult = await tradeExecutor.executeBuy('test-mint', 'TEST', new Decimal('1.0'));
      expect(buyResult).toBe(true);

      const sellResult = await tradeExecutor.executeSell({}, 'test');
      expect(sellResult).toBe(true);
    });
  });

  describe('ISimulationService', () => {
    let simulationService: ISimulationService;

    beforeEach(() => {
      simulationService = new MockSimulationService();
    });

    it('should implement required methods', async () => {
      const price = await simulationService.getTokenPrice('test-mint');
      expect(price?.price).toBeTruthy();
      expect(price?.symbol).toBe('TEST');

      const solPrice = simulationService.getSolUsdPrice();
      expect(Number(solPrice)).toBe(30);  // Compare as number instead of string to avoid formatting issues

      const buyResult = await simulationService.executeBuy('test-mint', 'TEST', new Decimal('1.0'));
      expect(buyResult).toBe(true);

      const sellResult = await simulationService.executeSell({}, 'test');
      expect(sellResult).toBe(true);

      expect(() => simulationService.cleanup()).not.toThrow();
    });
  });
});