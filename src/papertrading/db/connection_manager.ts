import { Database, open } from 'sqlite';
import * as sqlite3 from 'sqlite3';

const DB_PATH = "src/papertrading/db/paper_trading.db";

export interface DatabaseTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

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

  public static getInstance(dbPath: string = DB_PATH): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager(dbPath);
    }
    return ConnectionManager.instance;
  }

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

  public releaseConnection(connection: Database): void {
    this.inUse.delete(connection);
  }

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

  private async createConnection(): Promise<Database> {
    return open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });
  }

  private isConnectionError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('sqlite_busy') ||
      errorMessage.includes('database is locked') ||
      errorMessage.includes('no such table') ||
      errorMessage.includes('connection')
    );
  }

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