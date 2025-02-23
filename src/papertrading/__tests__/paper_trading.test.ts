import { initializePaperTradingDB, getVirtualBalance, recordSimulatedTrade, updateTokenPrice, getTrackedTokens, getOpenPositionsCount } from '../../papertrading/paper_trading';
import { ConnectionManager } from '../../papertrading/db/connection_manager';
import { Database } from 'sqlite';
import { EventEmitter } from 'events';
import { Decimal } from '../../utils/decimal';
import { config } from '../../config';

// Mock the ConnectionManager
jest.mock('../db/connection_manager', () => ({
  ConnectionManager: {
    getInstance: jest.fn()
  }
}));

describe('Paper Trading', () => {
  let mockConnectionManager: jest.Mocked<ConnectionManager>;

  // Create mock functions
  const execMock = jest.fn().mockResolvedValue(undefined);
  const runMock = jest.fn().mockResolvedValue(undefined);
  const allMock = jest.fn().mockResolvedValue([]);
  const getMock = jest.fn().mockResolvedValue(null);
  const closeMock = jest.fn().mockResolvedValue(undefined);

  // Create a complete mock of the Database interface
  const mockDb = {
    ...new EventEmitter(),
    exec: execMock,
    run: runMock,
    all: allMock,
    get: getMock,
    close: closeMock,
    each: jest.fn(),
    prepare: jest.fn(),
    configure: jest.fn(),
    serialize: jest.fn(),
    parallelize: jest.fn(),
    interrupt: jest.fn(),
    wait: jest.fn(),
    getDatabaseInstance: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    db: {},
    config: {},
  } as unknown as Database;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConnectionManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      executeWithRetry: jest.fn(),
      transaction: jest.fn(),
      getConnection: jest.fn().mockResolvedValue(mockDb),
      closeAll: jest.fn().mockResolvedValue(undefined),
      releaseConnection: jest.fn()
    } as unknown as jest.Mocked<ConnectionManager>;

    (ConnectionManager.getInstance as jest.Mock).mockReturnValue(mockConnectionManager);
  });

  describe('initialization', () => {
    it('should initialize paper trading database', async () => {
      const result = await initializePaperTradingDB();
      expect(result).toBe(true);
      expect(execMock).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS virtual_balance'));
    });

    it('should initialize with correct initial balance', async () => {
      getMock.mockResolvedValueOnce(null);
      const result = await initializePaperTradingDB();
      expect(result).toBe(true);
      expect(runMock).toHaveBeenCalledWith(
        'INSERT INTO virtual_balance (balance_sol, updated_at) VALUES (?, ?)',
        [new Decimal(config.paper_trading.initial_balance).toString(), expect.any(Number)]
      );
    });

    it('should handle database initialization errors', async () => {
      mockConnectionManager.initialize.mockRejectedValueOnce(new Error('DB Error'));
      const result = await initializePaperTradingDB();
      expect(result).toBe(false);
    });
  });

  describe('virtual balance operations', () => {
    it('should get virtual balance', async () => {
      const mockBalance = {
        balance_sol: '100.5',
        updated_at: Date.now()
      };
      getMock.mockResolvedValueOnce(mockBalance);

      const balance = await getVirtualBalance();
      expect(balance).toBeDefined();
      expect(balance?.balance_sol.equals(new Decimal('100.5'))).toBe(true);
    });

    it('should return null when no balance exists', async () => {
      getMock.mockResolvedValueOnce(null);
      const balance = await getVirtualBalance();
      expect(balance).toBeNull();
    });

    it('should handle balance retrieval errors', async () => {
      getMock.mockRejectedValueOnce(new Error('DB Error'));
      const balance = await getVirtualBalance();
      expect(balance).toBeNull();
    });
  });

  describe('simulated trade operations', () => {
    const mockTrade = {
      token_name: 'Test Token',
      token_mint: 'token123',
      amount_sol: new Decimal('1.5'),
      amount_token: new Decimal('1000'),
      buy_price: new Decimal('0.0015'),
      buy_fees: new Decimal('0.001'),
      buy_slippage: new Decimal('0.01'),
      time_buy: Date.now()
    };

    it('should record a buy trade', async () => {
      getMock.mockResolvedValueOnce({
        balance_sol: '10.0',
        updated_at: Date.now()
      });

      mockConnectionManager.transaction.mockImplementationOnce(async (callback) => {
        await callback({ commit: jest.fn(), rollback: jest.fn() });
      });

      const result = await recordSimulatedTrade(mockTrade);
      expect(result).toBe(true);
    });

    it('should record a sell trade', async () => {
      const sellTrade = {
        ...mockTrade,
        sell_price: new Decimal('0.002'),
        sell_fees: new Decimal('0.001'),
        sell_slippage: new Decimal('0.01'),
        time_sell: Date.now()
      };
      getMock.mockResolvedValueOnce({
        balance_sol: '10.0',
        updated_at: Date.now()
      });

      mockConnectionManager.transaction.mockImplementationOnce(async (callback) => {
        await callback({ commit: jest.fn(), rollback: jest.fn() });
      });

      const result = await recordSimulatedTrade(sellTrade);
      expect(result).toBe(true);
    });

    it('should handle trade recording errors', async () => {
      mockConnectionManager.transaction.mockRejectedValueOnce(new Error('Transaction Error'));
      const result = await recordSimulatedTrade(mockTrade);
      expect(result).toBe(false);
    });
  });

  describe('position counting operations', () => {
    it('should get open positions count', async () => {
      getMock.mockResolvedValueOnce({ count: 3 });
      const count = await getOpenPositionsCount();
      expect(count).toBe(3);
    });

    it('should return 0 when no positions exist', async () => {
      getMock.mockResolvedValueOnce({ count: 0 });
      const count = await getOpenPositionsCount();
      expect(count).toBe(0);
    });

    it('should handle errors when getting positions count', async () => {
      getMock.mockRejectedValueOnce(new Error('DB Error'));
      const count = await getOpenPositionsCount();
      expect(count).toBe(0);
    });
  });

  describe('token tracking operations', () => {
    it('should update token price', async () => {
      const mockToken = {
        token_mint: 'token123',
        token_name: 'Test Token',
        amount: '1000',
        buy_price: '0.0015',
        current_price: '0.002',
        last_updated: Date.now(),
        stop_loss: '0.001',
        take_profit: '0.003'
      };

      getMock.mockResolvedValueOnce(mockToken);

      const result = await updateTokenPrice('token123', new Decimal('0.002'));
      expect(result).toBeDefined();
      expect(result?.current_price.equals(new Decimal('0.002'))).toBe(true);
    });

    it('should handle token price update errors', async () => {
      runMock.mockRejectedValueOnce(new Error('Update Error'));
      const result = await updateTokenPrice('token123', new Decimal('0.002'));
      expect(result).toBeNull();
    });

    it('should get tracked tokens', async () => {
      const mockTokens = [{
        token_mint: 'token123',
        token_name: 'Test Token',
        amount: '1000',
        buy_price: '0.0015',
        current_price: '0.002',
        last_updated: Date.now(),
        stop_loss: '0.001',
        take_profit: '0.003'
      }];

      allMock.mockResolvedValueOnce(mockTokens);

      const tokens = await getTrackedTokens();
      expect(tokens).toHaveLength(1);
      expect(tokens[0].amount instanceof Decimal).toBe(true);
    });

    it('should handle tracked tokens retrieval errors', async () => {
      allMock.mockRejectedValueOnce(new Error('Retrieval Error'));
      const tokens = await getTrackedTokens();
      expect(tokens).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle connection failures', async () => {
      mockConnectionManager.getConnection.mockRejectedValueOnce(new Error('Connection Error'));
      const result = await getVirtualBalance();
      expect(result).toBeNull();
    });

    it('should handle transaction failures', async () => {
      mockConnectionManager.transaction.mockRejectedValueOnce(new Error('Transaction Error'));
      const result = await recordSimulatedTrade({
        token_name: 'Test Token',
        token_mint: 'token123',
        amount_sol: new Decimal('1.5'),
        amount_token: new Decimal('1000'),
        buy_price: new Decimal('0.0015'),
        buy_fees: new Decimal('0.001'),
        buy_slippage: new Decimal('0.01'),
        time_buy: Date.now()
      });
      expect(result).toBe(false);
    });

    it('should release connections even after errors', async () => {
      getMock.mockRejectedValueOnce(new Error('DB Error'));
      await getVirtualBalance();
      expect(mockConnectionManager.releaseConnection).toHaveBeenCalled();
    });
  });
});