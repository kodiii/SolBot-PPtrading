import { ConnectionManager } from '../db/connection_manager';
import { Database } from 'sqlite';
import { EventEmitter } from 'events';

jest.mock('sqlite3', () => ({
  Database: jest.fn()
}));

jest.mock('sqlite', () => ({
  open: jest.fn()
}));

const createMockRunResult = () => ({
  lastID: 0,
  changes: 0,
  stmt: {} as any
});

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  const mockDb = {
    ...new EventEmitter(),
    configure: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockImplementation(() => Promise.resolve(createMockRunResult())),
    get: jest.fn(),
    exec: jest.fn(),
    all: jest.fn(),
  } as unknown as jest.Mocked<Database>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ advanceTimers: true });
    (require('sqlite').open as jest.Mock).mockResolvedValue(mockDb);
    connectionManager = ConnectionManager.getInstance('test.db');
  });

  afterEach(async () => {
    try {
      await connectionManager.closeAll();
    } catch (e) {
      // Ignore cleanup errors
    }
    jest.useRealTimers();
  });

  describe('Error Recovery', () => {
    it('should handle initialization failures with retries', async () => {
      const error = new Error('SQLITE_BUSY: database is locked');
      (require('sqlite').open as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockDb);

      const promise = connectionManager.initialize();
      for (let i = 0; i < 3; i++) {
        await jest.advanceTimersByTimeAsync(1000);
      }
      await expect(promise).resolves.not.toThrow();
    });

    it('should fail after max retries with no connections', async () => {
      const error = new Error('SQLITE_BUSY: database is locked');
      (require('sqlite').open as jest.Mock).mockRejectedValue(error);

      try {
        await connectionManager.initialize();
        fail('Should have thrown an error');
      } catch (err: unknown) {
        if (err instanceof Error) {
          expect(err.message).toBe('Failed to initialize connection pool');
        } else {
          fail('Unexpected error type');
        }
      }
    });

    it('should handle unrecoverable connections', async () => {
      const error = new Error('SQLITE_CORRUPT: database is corrupted');
      (require('sqlite').open as jest.Mock).mockRejectedValue(error);

      const promise = connectionManager.initialize();
      await jest.advanceTimersByTimeAsync(1000);
      await expect(promise).rejects.toThrow('Failed to initialize connection pool');
    });

    it('should handle connection close failures', async () => {
      await connectionManager.initialize();
      mockDb.close.mockRejectedValueOnce(new Error('Close failed'));
      await expect(connectionManager.closeAll()).resolves.not.toThrow();
    });

    it('should handle recovery failures', async () => {
      await connectionManager.initialize();

      let attempts = 0;
      try {
        await connectionManager.executeWithRetry(async () => {
          attempts++;
          throw new Error('database is locked');
        });
        fail('Should have thrown an error');
      } catch (err: unknown) {
        if (err instanceof Error) {
          expect(err.message).toMatch(/Database operation failed after \d+ attempts/);
          expect(attempts).toBe(3);
        } else {
          fail('Unexpected error type');
        }
      }
    });

    it('should handle query timeouts', async () => {
      await connectionManager.initialize();
      let timeoutReached = false;

      const promise = connectionManager.executeWithRetry(async () => {
        await new Promise<void>((_, reject) => {
          setTimeout(() => {
            timeoutReached = true;
            reject(new Error('Query timeout'));
          }, 6000);
        });
      });

      await jest.advanceTimersByTimeAsync(6000);
      await expect(promise).rejects.toThrow('Query timeout');
      expect(timeoutReached).toBe(true);
    });
  });

  describe('Transaction Management', () => {
    it('should handle transaction failures', async () => {
      await connectionManager.initialize();
      mockDb.run
        .mockResolvedValueOnce(createMockRunResult()) // BEGIN
        .mockRejectedValueOnce(new Error('Operation failed')); // COMMIT

      const promise = connectionManager.transaction(async () => "test");
      await expect(promise).rejects.toThrow('Operation failed');
      expect(mockDb.run).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should handle explicit transaction rollback', async () => {
      await connectionManager.initialize();

      const result = await connectionManager.transaction(async (transaction: { rollback: () => Promise<void> }) => {
        await transaction.rollback();
        return true;
      });

      expect(result).toBe(true);
      expect(mockDb.run).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Resource Management', () => {
    it('should handle connection pool exhaustion', async () => {
      await connectionManager.initialize();
      const connections = [];

      try {
        // Use up all connections
        for (let i = 0; i < 6; i++) {
          connections.push(await connectionManager.getConnection());
        }
        fail('Should have thrown');
      } catch (err: unknown) {
        if (err instanceof Error) {
          expect(err.message).toBe('No database connections available after retries');
        } else {
          fail('Unexpected error type');
        }
      } finally {
        connections.forEach(conn => connectionManager.releaseConnection(conn));
      }
    });

    it('should handle multiple connection recoveries', async () => {
      await connectionManager.initialize();
      const errors: Error[] = [];

      const recoveryPromises = Array(3).fill(null).map(() => 
        connectionManager.executeWithRetry(async () => {
          throw new Error('database is locked');
        }).catch((err: Error) => {
          errors.push(err);
        })
      );

      for (let i = 0; i < 3; i++) {
        await jest.advanceTimersByTimeAsync(1000 * Math.pow(2, i));
      }
      await Promise.all(recoveryPromises);
      
      expect(errors).toHaveLength(3);
      errors.forEach(err => {
        expect(err.message).toMatch(/Database operation failed/);
      });
    });

    it('should handle query errors with different retry patterns', async () => {
      await connectionManager.initialize();

      let attempts = 0;
      try {
        await connectionManager.executeWithRetry(async () => {
          attempts++;
          throw new Error('SQLITE_BUSY');
        }, 3);
        fail('Should have thrown');
      } catch (err: unknown) {
        if (err instanceof Error) {
          expect(err.message).toMatch(/Database operation failed/);
          expect(attempts).toBe(3);
        } else {
          fail('Unexpected error type');
        }
      }
    });
  });
});