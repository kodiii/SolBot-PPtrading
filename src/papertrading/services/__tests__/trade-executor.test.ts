import { TradeExecutor } from '../trade-executor';
import { PriceTracker } from '../price-tracker';
import { Decimal } from '../../../utils/decimal';
import { TokenPriceData } from '../types';
import { TokenTracking } from '../../../types';
import * as paperTrading from '../../paper_trading';

// Mock dependencies
jest.mock('../price-tracker');
jest.mock('../../paper_trading');

describe('TradeExecutor', () => {
  let tradeExecutor: TradeExecutor;
  const mockTokenMint = 'test-token-mint';
  const mockTokenName = 'TEST';
  const mockPrice = new Decimal('1.5');

  beforeEach(() => {
    jest.clearAllMocks();
    tradeExecutor = new TradeExecutor();
  });

  describe('executeBuy', () => {
    const mockPriceData: TokenPriceData = {
      price: new Decimal('1.5'),
      symbol: 'TEST',
      dexData: {
        volume_m5: 1000,
        marketCap: 500000,
        liquidity_usd: 100000
      }
    };

    beforeEach(() => {
      (paperTrading.getVirtualBalance as jest.Mock).mockResolvedValue({
        balance_sol: new Decimal('10')
      });
      (paperTrading.getOpenPositionsCount as jest.Mock).mockResolvedValue(0);
      (PriceTracker.prototype.getTokenPrice as jest.Mock).mockResolvedValue(mockPriceData);
      (paperTrading.recordSimulatedTrade as jest.Mock).mockResolvedValue(true);
    });

    it('should execute buy successfully', async () => {
      const result = await tradeExecutor.executeBuy(mockTokenMint, mockTokenName, mockPrice);

      expect(result).toBe(true);
      expect(paperTrading.recordSimulatedTrade).toHaveBeenCalled();
      const tradeCall = (paperTrading.recordSimulatedTrade as jest.Mock).mock.calls[0][0];
      expect(tradeCall.token_name).toBe('TEST');
      expect(tradeCall.token_mint).toBe(mockTokenMint);
    });

    it('should handle insufficient balance', async () => {
      (paperTrading.getVirtualBalance as jest.Mock).mockResolvedValue({
        balance_sol: new Decimal('0.0001')
      });

      const result = await tradeExecutor.executeBuy(mockTokenMint, mockTokenName, mockPrice);

      expect(result).toBe(false);
      expect(paperTrading.recordSimulatedTrade).not.toHaveBeenCalled();
    });

    it('should handle max positions limit', async () => {
      (paperTrading.getOpenPositionsCount as jest.Mock).mockResolvedValue(999);

      const result = await tradeExecutor.executeBuy(mockTokenMint, mockTokenName, mockPrice);

      expect(result).toBe(false);
      expect(paperTrading.recordSimulatedTrade).not.toHaveBeenCalled();
    });

    it('should handle price data fetch failure', async () => {
      (PriceTracker.prototype.getTokenPrice as jest.Mock).mockResolvedValue(null);

      const result = await tradeExecutor.executeBuy(mockTokenMint, mockTokenName, mockPrice);

      expect(result).toBe(false);
      expect(paperTrading.recordSimulatedTrade).not.toHaveBeenCalled();
    });
  });

  describe('executeSell', () => {
    const mockToken: TokenTracking = {
      token_mint: mockTokenMint,
      token_name: mockTokenName,
      amount: new Decimal('100'),
      current_price: new Decimal('2.0'),
      buy_price: new Decimal('1.0'),
      buy_fees: new Decimal('0.001'),
      buy_slippage: new Decimal('0.01'),
      time_buy: Date.now()
    };

    const mockPriceData: TokenPriceData = {
      price: new Decimal('2.0'),
      symbol: 'TEST',
      dexData: {
        volume_m5: 1000,
        marketCap: 500000,
        liquidity_usd: 100000
      }
    };

    beforeEach(() => {
      (PriceTracker.prototype.getTokenPrice as jest.Mock).mockResolvedValue(mockPriceData);
      (paperTrading.recordSimulatedTrade as jest.Mock).mockResolvedValue(true);
    });

    it('should execute sell successfully', async () => {
      const result = await tradeExecutor.executeSell(mockToken, 'test reason');

      expect(result).toBe(true);
      expect(paperTrading.recordSimulatedTrade).toHaveBeenCalled();
      const tradeCall = (paperTrading.recordSimulatedTrade as jest.Mock).mock.calls[0][0];
      expect(tradeCall.token_name).toBe(mockTokenName);
      expect(tradeCall.token_mint).toBe(mockTokenMint);
      expect(tradeCall.time_sell).toBeDefined();
    });

    it('should handle price data fetch failure', async () => {
      (PriceTracker.prototype.getTokenPrice as jest.Mock).mockResolvedValue(null);

      const result = await tradeExecutor.executeSell(mockToken, 'test reason');

      expect(result).toBe(false);
      expect(paperTrading.recordSimulatedTrade).not.toHaveBeenCalled();
    });

    it('should apply slippage correctly', async () => {
      const result = await tradeExecutor.executeSell(mockToken, 'test reason');

      expect(result).toBe(true);
      const tradeCall = (paperTrading.recordSimulatedTrade as jest.Mock).mock.calls[0][0];
      expect(tradeCall.sell_slippage).toBeDefined();
      expect(new Decimal(tradeCall.sell_slippage).isPositive()).toBe(true);
      expect(new Decimal(tradeCall.sell_slippage).lessThan(new Decimal('0.1'))).toBe(true);
    });
  });
});