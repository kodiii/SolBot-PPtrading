import { createSwapTransaction } from '../../transactions';
import { getOpenPositionsCount } from '../../tracker/db';
import { config } from '../../config';

// Mock dependencies
jest.mock('../../tracker/db');
jest.mock('axios');
jest.mock('@solana/web3.js');
jest.mock('@project-serum/anchor');
jest.mock('bs58', () => ({
  decode: jest.fn().mockReturnValue(new Uint8Array(32))
}));

describe('createSwapTransaction', () => {
  const mockGetOpenPositionsCount = getOpenPositionsCount as jest.MockedFunction<typeof getOpenPositionsCount>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock environment variables
    process.env.JUP_HTTPS_QUOTE_URI = 'mock-quote-uri';
    process.env.JUP_HTTPS_SWAP_URI = 'mock-swap-uri';
    process.env.HELIUS_HTTPS_URI = 'mock-rpc-uri';
    process.env.PRIV_KEY_WALLET = 'mock-private-key';
  });

  it('should return null when max positions limit is reached', async () => {
    // Mock the position count to be equal to max limit
    mockGetOpenPositionsCount.mockResolvedValue(config.swap.max_open_positions);

    const result = await createSwapTransaction(
      'solMintAddress',
      'tokenMintAddress'
    );

    expect(result).toBeNull();
    expect(mockGetOpenPositionsCount).toHaveBeenCalled();
  });

  it('should return null when positions exceed limit', async () => {
    // Mock the position count to be more than max limit
    mockGetOpenPositionsCount.mockResolvedValue(config.swap.max_open_positions + 1);

    const result = await createSwapTransaction(
      'solMintAddress',
      'tokenMintAddress'
    );

    expect(result).toBeNull();
    expect(mockGetOpenPositionsCount).toHaveBeenCalled();
  });

  it('should proceed with transaction when under position limit', async () => {
    // Mock the position count to be less than max limit
    mockGetOpenPositionsCount.mockResolvedValue(config.swap.max_open_positions - 1);

    // Mock axios for quote request
    const mockAxios = require('axios');
    mockAxios.get.mockImplementation(() => Promise.resolve({
      data: {
        // Mock quote response data
        id: 'mock-quote'
      }
    }));
    mockAxios.post.mockImplementation(() => Promise.resolve({
      data: {
        // Mock swap response data
        swapTransaction: 'mock-swap-transaction'
      }
    }));

    const result = await createSwapTransaction(
      'solMintAddress',
      'tokenMintAddress'
    );

    expect(mockGetOpenPositionsCount).toHaveBeenCalled();
    // We don't check the actual result since it depends on many mocked services,
    // but we verify it attempted the transaction flow
    expect(mockAxios.get).toHaveBeenCalled();
  });

  it('should handle getOpenPositionsCount errors gracefully', async () => {
    // Mock getOpenPositionsCount to throw an error
    mockGetOpenPositionsCount.mockRejectedValue(new Error('Database error'));

    const result = await createSwapTransaction(
      'solMintAddress',
      'tokenMintAddress'
    );

    expect(result).toBeNull();
    expect(mockGetOpenPositionsCount).toHaveBeenCalled();
  });
});