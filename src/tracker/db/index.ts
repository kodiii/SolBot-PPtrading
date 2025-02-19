import { ConnectionManager } from './connection_manager';
import { HoldingRecord, NewTokenRecord } from '../../types';
import { Decimal } from '../../utils/decimal';

export class DatabaseService {
  private static instance: DatabaseService;
  private connectionManager: ConnectionManager;

  constructor(connectionManager?: ConnectionManager) {
    // If none passed in, get the singleton instance
    this.connectionManager = connectionManager || ConnectionManager.getInstance();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    await this.connectionManager.initialize();
    await this.createTables();
  }

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

  public async removeHolding(tokenMint: string): Promise<void> {
    if (!tokenMint?.trim()) {
      throw new Error('Invalid token mint');
    }

    await this.connectionManager.executeWithRetry(async (db) => {
      await db.run('DELETE FROM holdings WHERE Token = ?', [tokenMint]);
    });
  }

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

  public async findTokenByMint(mint: string): Promise<NewTokenRecord[]> {
    if (!mint?.trim()) {
      throw new Error('Invalid mint address');
    }

    return this.connectionManager.executeWithRetry(async (db) => {
      return db.all<NewTokenRecord[]>('SELECT * FROM tokens WHERE mint = ?', [mint]);
    });
  }

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

  public async close(): Promise<void> {
    await this.connectionManager.closeAll();
  }
}

export const db = DatabaseService.getInstance();