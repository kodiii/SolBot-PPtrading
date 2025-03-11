import axios from 'axios';
import { config } from '../../../config';
import { Decimal } from '../../../utils/decimal';
import { PriceTracker } from '../price-tracker';
import { DexscreenerPairInfo } from '../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test data
const mockPairInfo: DexscreenerPairInfo = {
  chainId: 'solana',
  dexId: 'raydium',
  url: 'test-url',
  pairAddress: 'test-pair',
  labels: [],
  baseToken: {
    address: 'test-address',
    name: 'Test Token',
    symbol: 'TEST'
  },
  quoteToken: {
    symbol: 'SOL'
  },
  priceUsd: '1.5',
  priceNative: '0.5',
  txns: {
    m5: { buys: 10, sells: 5 },
    h1: { buys: 50, sells: 25 },
    h24: { buys: 100, sells: 50 }
  },
  volume: {
    m5: 1000,
    h1: 5000,
    h24: 10000
  },
  priceChange: {
    m5: 0.1,
    h1: 0.2,
    h24: 0.3
  },
  liquidity: {
    usd: 100000,
    base: 50000,
    quote: 50000
  },
  fdv: 1000000,
  marketCap: 500000
};

describe('PriceTracker', () => {
  let priceTracker: PriceTracker;
  const mockTokenMint = 'test-token-mint';

  beforeEach(() => {
    priceTracker = new PriceTracker();
    jest.clearAllMocks();
  });

  describe('getTokenPrice', () => {
    it('should fetch and return token price data successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { pairs: [mockPairInfo] }
      });

      const result = await priceTracker.getTokenPrice(mockTokenMint);

      expect(result).toBeTruthy();
      expect(result?.price).toEqual(new Decimal('1.5'));
      expect(result?.symbol).toBe('TEST');
      expect(result?.dexData).toEqual({
        volume_m5: 1000,
        marketCap: 500000,
        liquidity_usd: 100000
      });
    });

    it('should update SOL price when quote token is SOL', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { pairs: [mockPairInfo] }
      });

      await priceTracker.getTokenPrice(mockTokenMint);
      const solPrice = priceTracker.getSolUsdPrice();

      expect(solPrice).toBeTruthy();
      expect(solPrice?.toString()).toBe('1.5');
    });

    it('should handle API error and retry', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          data: { pairs: [mockPairInfo] }
        });

      const result = await priceTracker.getTokenPrice(mockTokenMint);

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(result).toBeTruthy();
      expect(result?.price.toString()).toBe('1.5');
    });

    it('should return null after max retries', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await priceTracker.getTokenPrice(mockTokenMint);

      expect(mockedAxios.get).toHaveBeenCalledTimes(config.paper_trading.price_check.max_retries);
      expect(result).toBeNull();
    });

    it('should handle empty pairs array', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { pairs: [] }
      });

      const result = await priceTracker.getTokenPrice(mockTokenMint);

      expect(result).toBeNull();
    });

    it('should handle missing Raydium pair', async () => {
      const nonRaydiumPair = { ...mockPairInfo, dexId: 'other-dex' };
      mockedAxios.get.mockResolvedValueOnce({
        data: { pairs: [nonRaydiumPair] }
      });

      const result = await priceTracker.getTokenPrice(mockTokenMint);

      expect(result).toBeNull();
    });
  });

  describe('getSolUsdPrice', () => {
    it('should initially return null', () => {
      expect(priceTracker.getSolUsdPrice()).toBeNull();
    });

    it('should return updated SOL price after fetch', async () => {
      const mockPair = {
        ...mockPairInfo,
        quoteToken: { symbol: 'SOL' },
        priceUsd: '2.5'
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: { pairs: [mockPair] }
      });

      await priceTracker.getTokenPrice(mockTokenMint);
      const solPrice = priceTracker.getSolUsdPrice();

      expect(solPrice).toBeTruthy();
      expect(solPrice?.toString()).toBe('2.5');
    });
  });
});