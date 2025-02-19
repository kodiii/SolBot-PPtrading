import { initializePaperTradingDB, getVirtualBalance, recordSimulatedTrade, updateTokenPrice, getTrackedTokens } from '../paper_trading';
import { ConnectionManager } from '../db/connection_manager';
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
      expect(execMock).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS simulated_trades'));
      expect(execMock).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS token_tracking'));
    });

    it('should initialize with correct initial balance', async () => {
      getMock.mockResolvedValueOnce(null); // No existing balance
      
      const result = await initializePaperTradingDB();
      
      expect(result).toBe(true);
      expect(runMock).toHaveBeenCalledWith(
        'INSERT INTO virtual_balance (balance_sol, updated_at) VALUES (?, ?)',
        [new Decimal(config.paper_trading.initial_balance).toString(), expect.any(Number)]
      );
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
      expect(balance?.balance_sol).toEqual(new Decimal('100.5'));
      expect(balance?.updated_at).toBe(mockBalance.updated_at);
    });

    it('should return null when no balance exists', async () => {
      getMock.mockResolvedValueOnce(null);
      
      const balance = await getVirtualBalance();
      expect(balance).toBeNull();
    });
  });

  describe('simulated trade operations', () => {
    const mockTrade = {
      timestamp: Date.now(),
      token_mint: 'token123',
      token_name: 'Test Token',
      amount_sol: new Decimal('1.5'),
      amount_token: new Decimal('1000'),
      price_per_token: new Decimal('0.0015'),
      type: 'buy' as const,
      fees: new Decimal('0.001')
    };

    it('should record a buy trade', async () => {
      mockConnectionManager.transaction.mockImplementation(async (callback) => {
        await callback({ commit: jest.fn(), rollback: jest.fn() });
      });

      getMock.mockResolvedValueOnce({
        balance_sol: '10.0',
        updated_at: Date.now()
      });

      const result = await recordSimulatedTrade(mockTrade);

      expect(result).toBe(true);
      expect(runMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO simulated_trades'),
        expect.arrayContaining([
          mockTrade.timestamp,
          mockTrade.token_mint,
          mockTrade.amount_sol.toString(),
          mockTrade.amount_token.toString()
        ])
      );
    });

    it('should update token price', async () => {
      const tokenMint = 'token123';
      const newPrice = new Decimal('0.002');

      getMock.mockResolvedValueOnce({
        token_mint: tokenMint,
        token_name: 'Test Token',
        amount: '1000',
        buy_price: '0.0015',
        current_price: '0.002',
        last_updated: Date.now(),
        stop_loss: '0.001',
        take_profit: '0.003'
      });

      const result = await updateTokenPrice(tokenMint, newPrice);

      expect(result).toBeDefined();
      expect(result?.current_price.equals(newPrice)).toBe(true);
      expect(runMock).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE token_tracking'),
        [newPrice.toString(), expect.any(Number), tokenMint]
      );
    });
  });

  describe('token tracking operations', () => {
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
      expect(tokens[0].buy_price instanceof Decimal).toBe(true);
      expect(tokens[0].current_price instanceof Decimal).toBe(true);
      expect(tokens[0].stop_loss instanceof Decimal).toBe(true);
      expect(tokens[0].take_profit instanceof Decimal).toBe(true);
    });
  });
});