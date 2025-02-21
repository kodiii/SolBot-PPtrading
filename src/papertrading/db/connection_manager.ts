import { Database, open } from 'sqlite';
import * as sqlite3 from 'sqlite3';

/**
 * Default path for the SQLite database file
 */
const DB_PATH = "src/papertrading/db/paper_trading.db";

/**
 * Interface representing a database transaction with commit and rollback capabilities.
 * Used to ensure ACID properties in database operations.
 */
export interface DatabaseTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Manages a pool of SQLite database connections with built-in error handling and recovery mechanisms.
 * Implements a singleton pattern to ensure a single connection pool across the application.
 * Features:
 * - Connection pooling with configurable pool size
 * - Automatic connection recovery
 * - Transaction management
 * - Query retry mechanism with exponential backoff
 * - Connection timeout handling
 */
export class ConnectionManager {
  private static instance: ConnectionManager;
  private pool: Database[] = [];
  private inUse: Set<Database> = new Set();
  private maxConnections = 5;
  private connectionTimeout = 5000; // 5 seconds
  private maxRetries = 2;
  private retryDelay = 1000; // 1 second
  private dbPath: string;

  private constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Gets the singleton instance of the ConnectionManager.
   * Creates a new instance if one doesn't exist.
   * @param dbPath - Path to the SQLite database file
   * @returns The singleton ConnectionManager instance
   */
  public static getInstance(dbPath: string = DB_PATH): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager(dbPath);
    }
    return ConnectionManager.instance;
  }

  /**
   * Initializes the connection pool by creating the specified number of connections.
   * Implements retry logic for failed connection attempts.
   * @throws Error if unable to initialize the minimum required connections
   */
  public async initialize(): Promise<void> {
    let retryCount = 0;

    while (this.pool.length < this.maxConnections) {
      try {
        const connection = await this.createConnection();
        await connection.configure('busyTimeout', 3000);
        this.pool.push(connection);
      } catch (error) {
        console.error('Failed to create connection:', error instanceof Error ? error.message : String(error));
        retryCount++;
        if (this.pool.length === 0 && retryCount > this.maxRetries) {
          throw new Error('Failed to initialize connection pool');
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  /**
   * Retrieves an available connection from the pool.
   * Implements retry logic if no connections are immediately available.
   * @param retries - Number of retry attempts before failing
   * @returns A database connection
   * @throws Error if no connections are available after retries
   */
  public async getConnection(retries = 3): Promise<Database> {
    const connection = this.pool.find(conn => !this.inUse.has(conn));
    
    if (connection) {
      this.inUse.add(connection);
      return connection;
    }

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.getConnection(retries - 1);
    }

    throw new Error('No database connections available after retries');
  }

  /**
   * Returns a connection to the pool, making it available for reuse.
   * @param connection - The database connection to release
   */
  public releaseConnection(connection: Database): void {
    this.inUse.delete(connection);
  }

  /**
   * Executes a database transaction with automatic commit/rollback handling.
   * Ensures ACID properties by properly managing transaction boundaries.
   * @param callback - Function containing the transaction operations
   * @returns The result of the transaction
   * @throws Error if the transaction fails, automatically rolling back
   */
  public async transaction<T>(callback: (transaction: DatabaseTransaction) => Promise<T>): Promise<T> {
    const connection = await this.getConnection();

    try {
      await connection.run('BEGIN TRANSACTION');

      const transaction: DatabaseTransaction = {
        commit: async () => {
          await connection.run('COMMIT');
        },
        rollback: async () => {
          await connection.run('ROLLBACK');
        }
      };

      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await connection.run('ROLLBACK');
      throw error;
    } finally {
      this.releaseConnection(connection);
    }
  }

  /**
   * Executes a database query with automatic retry mechanism and timeout handling.
   * Implements exponential backoff for retries and recovers from connection errors.
   * @param query - The database query to execute
   * @param retries - Maximum number of retry attempts
   * @returns The query result
   * @throws Error if all retry attempts fail
   */
  public async executeWithRetry<T>(
    query: (db: Database) => Promise<T>,
    retries = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      const connection = await this.getConnection();

      try {
        const result = await Promise.race([
          query(connection),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), this.connectionTimeout)
          )
        ]);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (this.isConnectionError(lastError)) {
          await this.recoverConnection(connection);
        }
      } finally {
        this.releaseConnection(connection);
      }

      await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)));
    }

    throw new Error(`Database operation failed after ${retries} attempts: ${lastError?.message}`);
  }

  /**
   * Creates a new database connection with the configured settings.
   * @returns A new database connection
   * @throws Error if connection creation fails
   */
  private async createConnection(): Promise<Database> {
    return open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });
  }

  /**
   * Determines if an error is related to database connection issues.
   * Used to decide whether to attempt connection recovery.
   * @param error - The error to check
   * @returns True if the error is connection-related
   */
  private isConnectionError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('sqlite_busy') ||
      errorMessage.includes('database is locked') ||
      errorMessage.includes('no such table') ||
      errorMessage.includes('connection')
    );
  }

  /**
   * Attempts to recover a failed connection by creating a new one.
   * Removes the failed connection from the pool and replaces it with a new one.
   * @param connection - The failed connection to recover
   * @throws Error if connection recovery fails
   */
  private async recoverConnection(connection: Database): Promise<void> {
    try {
      this.pool = this.pool.filter(conn => conn !== connection);
      this.inUse.delete(connection);
      await connection.close();

      const newConnection = await this.createConnection();
      await newConnection.configure('busyTimeout', 3000);
      this.pool.push(newConnection);
    } catch (error) {
      console.error('Failed to recover database connection:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Closes all connections in the pool and clears the pool.
   * Used during application shutdown or pool reset.
   */
  public async closeAll(): Promise<void> {
    await Promise.all(
      this.pool.map(async (connection) => {
        try {
          await connection.close();
        } catch (error) {
          console.error('Error closing connection:', error instanceof Error ? error.message : String(error));
        }
      })
    );
    this.pool = [];
    this.inUse.clear();
  }
}