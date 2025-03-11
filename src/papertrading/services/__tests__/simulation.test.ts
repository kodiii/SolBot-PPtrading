import { SimulationService } from '../simulation';
import { PriceTracker } from '../price-tracker';
import { TradeExecutor } from '../trade-executor';
import { Decimal } from '../../../utils/decimal';

// Mock dependencies
jest.mock('../price-tracker');
jest.mock('../trade-executor');

describe('SimulationService', () => {
  let simulationService: SimulationService;
  const mockTokenMint = 'test-token-mint';
  const mockTokenName = 'TEST';
  const mockPrice = new Decimal('1.5');

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear singleton instance
    (SimulationService as any).instance = null;
    simulationService = SimulationService.getInstance();
  });

  describe('getInstance', () => {
    it('should create a singleton instance', () => {
      const instance1 = SimulationService.getInstance();
      const instance2 = SimulationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with required services', () => {
      const instance = SimulationService.getInstance();
      expect((instance as any).priceTracker).toBeInstanceOf(PriceTracker);
      expect((instance as any).tradeExecutor).toBeInstanceOf(TradeExecutor);
    });
  });

  describe('getTokenPrice', () => {
    it('should delegate to price tracker service', async () => {
      const mockPriceData = {
        price: mockPrice,
        symbol: 'TEST',
        dexData: {
          volume_m5: 1000,
          marketCap: 500000,
          liquidity_usd: 100000
        }
      };

      (PriceTracker.prototype.getTokenPrice as jest.Mock).mockResolvedValue(mockPriceData);

      const result = await simulationService.getTokenPrice(mockTokenMint);

      expect(PriceTracker.prototype.getTokenPrice).toHaveBeenCalledWith(mockTokenMint, 0);
      expect(result).toEqual(mockPriceData);
    });

    it('should handle price tracker errors', async () => {
      (PriceTracker.prototype.getTokenPrice as jest.Mock).mockResolvedValue(null);

      const result = await simulationService.getTokenPrice(mockTokenMint);

      expect(result).toBeNull();
    });
  });

  describe('getSolUsdPrice', () => {
    it('should delegate to price tracker service', () => {
      const mockSolPrice = new Decimal('30.5');
      (PriceTracker.prototype.getSolUsdPrice as jest.Mock).mockReturnValue(mockSolPrice);

      const result = simulationService.getSolUsdPrice();

      expect(PriceTracker.prototype.getSolUsdPrice).toHaveBeenCalled();
      expect(result).toBe(mockSolPrice);
    });
  });

  describe('executeBuy', () => {
    it('should delegate to trade executor service', async () => {
      (TradeExecutor.prototype.executeBuy as jest.Mock).mockResolvedValue(true);

      const result = await simulationService.executeBuy(mockTokenMint, mockTokenName, mockPrice);

      expect(TradeExecutor.prototype.executeBuy).toHaveBeenCalledWith(
        mockTokenMint,
        mockTokenName,
        mockPrice
      );
      expect(result).toBe(true);
    });

    it('should handle trade executor errors', async () => {
      (TradeExecutor.prototype.executeBuy as jest.Mock).mockResolvedValue(false);

      const result = await simulationService.executeBuy(mockTokenMint, mockTokenName, mockPrice);

      expect(result).toBe(false);
    });
  });

  describe('executeSell', () => {
    it('should delegate to trade executor service', async () => {
      const mockToken = { token_mint: mockTokenMint };
      const mockReason = 'test reason';
      (TradeExecutor.prototype.executeSell as jest.Mock).mockResolvedValue(true);

      const result = await simulationService.executeSell(mockToken, mockReason);

      expect(TradeExecutor.prototype.executeSell).toHaveBeenCalledWith(mockToken, mockReason);
      expect(result).toBe(true);
    });

    it('should handle trade executor errors', async () => {
      const mockToken = { token_mint: mockTokenMint };
      const mockReason = 'test reason';
      (TradeExecutor.prototype.executeSell as jest.Mock).mockResolvedValue(false);

      const result = await simulationService.executeSell(mockToken, mockReason);

      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should perform cleanup successfully', () => {
      expect(() => simulationService.cleanup()).not.toThrow();
    });
  });
});