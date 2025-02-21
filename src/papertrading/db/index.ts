import { ConnectionManager } from './connection_manager';
import { HoldingRecord, NewTokenRecord } from '../../types';
import { Decimal } from '../../utils/decimal';

/**
 * DatabaseService provides a singleton interface for managing SQLite database operations
 * in the paper trading system. It handles token and holding records with transaction support
 * and connection pooling.
 *
 * Key features:
 * - Singleton pattern for centralized database access
 * - Connection pooling via ConnectionManager
 * - Transaction support for data integrity
 * - Automatic retry mechanism for failed operations
 * - Type-safe database operations with HoldingRecord and NewTokenRecord
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private connectionManager: ConnectionManager;

  constructor(connectionManager?: ConnectionManager) {
    // If none passed in, get the singleton instance
    this.connectionManager = connectionManager || ConnectionManager.getInstance();
  }

  /**
   * Gets or creates the singleton instance of DatabaseService
   * @returns The singleton DatabaseService instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initializes the database service by setting up connection pool and creating tables
   * @throws Error if database initialization fails
   */
  public async initialize(): Promise<void> {
    await this.connectionManager.initialize();
    await this.createTables();
  }

  /**
   * Creates database tables and indices if they don't exist
   * - holdings: Stores token holding records with decimal values as TEXT
   * - tokens: Stores token metadata with unique mint addresses
   * - Adds indices for optimizing common queries
   * @private
   */
  private async createTables(): Promise<void> {
    await this.connectionManager.executeWithRetry(async (db) => {
      // Create holdings table with explicit constraints, using TEXT for decimal values
      await db.exec(`
        CREATE TABLE IF NOT EXISTS holdings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          Time INTEGER NOT NULL CHECK (Time > 0),
          Token TEXT NOT NULL CHECK (length(Token) > 0),
          TokenName TEXT NOT NULL,
          Balance TEXT NOT NULL,
          SolPaid TEXT NOT NULL,
          SolFeePaid TEXT NOT NULL,
          SolPaidUSDC TEXT NOT NULL,
          SolFeePaidUSDC TEXT NOT NULL,
          PerTokenPaidUSDC TEXT NOT NULL,
          Slot INTEGER NOT NULL CHECK (Slot > 0),
          Program TEXT NOT NULL CHECK (length(Program) > 0)
        )
      `);

      // Create tokens table with explicit constraints
      await db.exec(`
        CREATE TABLE IF NOT EXISTS tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          time INTEGER NOT NULL CHECK (time > 0),
          name TEXT NOT NULL CHECK (length(name) > 0),
          mint TEXT NOT NULL CHECK (length(mint) > 0),
          creator TEXT NOT NULL CHECK (length(creator) > 0),
          UNIQUE(mint)
        )
      `);

      // Create indices for better query performance
      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_holdings_token ON holdings(Token);
        CREATE INDEX IF NOT EXISTS idx_tokens_mint ON tokens(mint);
        CREATE INDEX IF NOT EXISTS idx_tokens_name_creator ON tokens(name, creator);
      `);
    });
  }

  /**
   * Inserts a new holding record into the database with transaction support
   * @param holding The holding record to insert
   * @throws Error if transaction fails or invalid data
   */
  public async insertHolding(holding: HoldingRecord): Promise<void> {
    await this.connectionManager.transaction(async () => {
      const db = await this.connectionManager.getConnection();
      const { Time, Token, TokenName, Balance, SolPaid, SolFeePaid, SolPaidUSDC, SolFeePaidUSDC, PerTokenPaidUSDC, Slot, Program } = holding;
      
      await db.run(
        `INSERT INTO holdings (Time, Token, TokenName, Balance, SolPaid, SolFeePaid, SolPaidUSDC, SolFeePaidUSDC, PerTokenPaidUSDC, Slot, Program)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Time,
          Token,
          TokenName,
          Balance.toString(),
          SolPaid.toString(),
          SolFeePaid.toString(),
          SolPaidUSDC.toString(),
          SolFeePaidUSDC.toString(),
          PerTokenPaidUSDC.toString(),
          Slot,
          Program
        ]
      );
    });
  }

  /**
   * Removes a holding record by token mint address
   * @param tokenMint The token mint address to remove
   * @throws Error if tokenMint is invalid or empty
   */
  public async removeHolding(tokenMint: string): Promise<void> {
    if (!tokenMint?.trim()) {
      throw new Error('Invalid token mint');
    }

    await this.connectionManager.executeWithRetry(async (db) => {
      await db.run('DELETE FROM holdings WHERE Token = ?', [tokenMint]);
    });
  }

  /**
   * Retrieves all holding records ordered by time descending
   * Converts TEXT decimal values back to Decimal objects
   * @returns Array of holding records with proper decimal values
   */
  public async getHoldings(): Promise<HoldingRecord[]> {
    return this.connectionManager.executeWithRetry(async (db) => {
      const rows = await db.all('SELECT * FROM holdings ORDER BY Time DESC');
      return rows.map(row => ({
        ...row,
        Balance: new Decimal(row.Balance),
        SolPaid: new Decimal(row.SolPaid),
        SolFeePaid: new Decimal(row.SolFeePaid),
        SolPaidUSDC: new Decimal(row.SolPaidUSDC),
        SolFeePaidUSDC: new Decimal(row.SolFeePaidUSDC),
        PerTokenPaidUSDC: new Decimal(row.PerTokenPaidUSDC)
      }));
    });
  }

  /**
   * Inserts a new token record with validation
   * @param token The token record to insert
   * @throws Error if token data is invalid or incomplete
   */
  public async insertNewToken(token: NewTokenRecord): Promise<void> {
    const { time, name, mint, creator } = token;
    
    if (!mint?.trim() || !name?.trim() || !creator?.trim() || time <= 0) {
      throw new Error('Invalid token data');
    }

    await this.connectionManager.transaction(async () => {
      const db = await this.connectionManager.getConnection();
      await db.run(
        'INSERT INTO tokens (time, name, mint, creator) VALUES (?, ?, ?, ?)',
        [time, name, mint, creator]
      );
    });
  }

  /**
   * Finds token records by mint address
   * @param mint The mint address to search for
   * @returns Array of matching token records
   * @throws Error if mint address is invalid or empty
   */
  public async findTokenByMint(mint: string): Promise<NewTokenRecord[]> {
    if (!mint?.trim()) {
      throw new Error('Invalid mint address');
    }

    return this.connectionManager.executeWithRetry(async (db) => {
      return db.all<NewTokenRecord[]>('SELECT * FROM tokens WHERE mint = ?', [mint]);
    });
  }

  /**
   * Finds token records by name or creator
   * @param name The token name to search for
   * @param creator The creator address to search for
   * @returns Array of matching token records
   * @throws Error if name or creator is invalid
   */
  public async findTokenByNameAndCreator(name: string, creator: string): Promise<NewTokenRecord[]> {
    if (!name?.trim() || !creator?.trim()) {
      throw new Error('Invalid name or creator');
    }

    return this.connectionManager.executeWithRetry(async (db) => {
      return db.all<NewTokenRecord[]>(
        'SELECT * FROM tokens WHERE name = ? OR creator = ?',
        [name, creator]
      );
    });
  }

  /**
   * Closes all database connections
   * Should be called during application shutdown
   */
  public async close(): Promise<void> {
    await this.connectionManager.closeAll();
  }
}

// Export singleton instance for global use
export const db = DatabaseService.getInstance();