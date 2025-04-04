/**
 * Database operations module for tracking token holdings and new token listings
 * Provides functionality for managing SQLite database operations including:
 * - Holdings table: Tracks token positions, balances, and transaction details
 * - Tokens table: Stores information about new token listings
 */

import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import { config } from "./../config";
import { HoldingRecord, NewTokenRecord } from "../types";

/**
 * Creates the holdings table if it doesn't exist
 * Table stores token position details including:
 * - Transaction time and slot
 * - Token identifiers and balance
 * - SOL costs and USDC equivalent values
 * @param database SQLite database instance
 * @returns true if table created/exists, false on error
 */
export async function createTableHoldings(database: any): Promise<boolean> {
  try {
    await database.exec(`
    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Time INTEGER NOT NULL,
      Token TEXT NOT NULL,
      TokenName TEXT NOT NULL,
      Balance TEXT NOT NULL,
      SolPaid TEXT NOT NULL,
      SolFeePaid TEXT NOT NULL,
      SolPaidUSDC TEXT NOT NULL,
      SolFeePaidUSDC TEXT NOT NULL,
      PerTokenPaidUSDC TEXT NOT NULL,
      Slot INTEGER NOT NULL,
      Program TEXT NOT NULL
    );
  `);
    return true;
  } catch (error: any) {
    console.error('Error creating holdings table:', error);
    return false;
  }
}

/**
 * Gets a database connection instance
 * @returns Promise resolving to SQLite database connection
 */
async function getDb() {
  return await open({
    filename: config.swap.db_name_tracker_holdings,
    driver: sqlite3.Database
  });
}

/**
 * Inserts a new holding record into the database
 * Automatically creates the holdings table if it doesn't exist
 * @param holding The holding record to insert
 * @throws Error if table creation fails
 */
export async function insertHolding(holding: HoldingRecord) {
  const db = await getDb();

  try {
    // Create Table if not exists
    const holdingsTableExist = await createTableHoldings(db);
    if (!holdingsTableExist) {
      throw new Error('Failed to create holdings table');
    }

    const { Time, Token, TokenName, Balance, SolPaid, SolFeePaid, SolPaidUSDC, SolFeePaidUSDC, PerTokenPaidUSDC, Slot, Program } = holding;
    await db.run(
      `INSERT INTO holdings (Time, Token, TokenName, Balance, SolPaid, SolFeePaid, SolPaidUSDC, SolFeePaidUSDC, PerTokenPaidUSDC, Slot, Program)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [Time, Token, TokenName, Balance.toString(), 
       SolPaid.toString(), SolFeePaid.toString(), SolPaidUSDC.toString(),
       SolFeePaidUSDC.toString(), PerTokenPaidUSDC.toString(), Slot, Program]
    );
  } finally {
    await db.close();
  }
}

/**
 * Removes a holding record by token mint address
 * @param tokenMint The token mint address to remove
 */
export async function removeHolding(tokenMint: string) {
  const db = await getDb();

  try {
    await db.run(
      `DELETE FROM holdings WHERE Token = ?;`,
      [tokenMint]
    );
  } finally {
    await db.close();
  }
}

/**
 * Creates the tokens table if it doesn't exist
 * Table stores information about new token listings including:
 * - Listing time
 * - Token name and mint address
 * - Creator address
 * @param database SQLite database instance
 * @returns true if table created/exists, false on error
 */
export async function createTableNewTokens(database: any): Promise<boolean> {
  try {
    await database.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time INTEGER NOT NULL,
      name TEXT NOT NULL,
      mint TEXT NOT NULL,
      creator TEXT NOT NULL
    );
  `);
    return true;
  } catch (error: any) {
    console.error('Error creating tokens table:', error);
    return false;
  }
}

/**
 * Inserts a new token record into the database
 * Automatically creates the tokens table if it doesn't exist
 * @param newToken The token record to insert
 * @throws Error if table creation fails
 */
export async function insertNewToken(newToken: NewTokenRecord) {
  const db = await getDb();

  try {
    const newTokensTableExist = await createTableNewTokens(db);
    if (!newTokensTableExist) {
      throw new Error('Failed to create tokens table');
    }

    const { time, name, mint, creator } = newToken;
    await db.run(
      `INSERT INTO tokens (time, name, mint, creator) VALUES (?, ?, ?, ?);`,
      [time, name, mint, creator]
    );
  } finally {
    await db.close();
  }
}

/**
 * Searches for tokens by name or creator address
 * @param name Token name to search for
 * @param creator Creator address to search for
 * @returns Array of matching token records
 * @throws Error if table creation fails
 */
export async function selectTokenByNameAndCreator(name: string, creator: string): Promise<NewTokenRecord[]> {
  const db = await getDb();

  try {
    const newTokensTableExist = await createTableNewTokens(db);
    if (!newTokensTableExist) {
      throw new Error('Failed to create tokens table');
    }

    return await db.all(
      `SELECT * FROM tokens WHERE name = ? OR creator = ?;`,
      [name, creator]
    );
  } finally {
    await db.close();
  }
}

/**
 * Searches for a token by mint address
 * @param mint Token mint address to search for
 * @returns Array of matching token records
 * @throws Error if table creation fails
 */
export async function selectTokenByMint(mint: string): Promise<NewTokenRecord[]> {
  const db = await getDb();

  try {
    const newTokensTableExist = await createTableNewTokens(db);
    if (!newTokensTableExist) {
      throw new Error('Failed to create tokens table');
    }

    return await db.all(
      `SELECT * FROM tokens WHERE mint = ?;`,
      [mint]
    );
  } finally {
    await db.close();
  }
}

/**
 * Gets the count of open positions in the holdings table
 * @param testDb Optional test database instance for unit testing
 * @returns Number of open positions, 0 if error or no positions
 */
export async function getOpenPositionsCount(testDb?: any): Promise<number> {
  const db = testDb || await getDb();

  try {
    const holdingsTableExist = await createTableHoldings(db);
    if (!holdingsTableExist) {
      throw new Error('Failed to create holdings table');
    }

    const result = await db.get('SELECT COUNT(*) as count FROM holdings');
    return result ? Number(result.count) : 0;
  } catch (error) {
    console.error('Error getting open positions count:', error);
    return 0;
  } finally {
    if (!testDb && db) {
      await db.close();
    }
  }
}

/**
 * Retrieves all token records from the database
 * @returns Array of all token records
 * @throws Error if table creation fails
 */
export async function selectAllTokens(): Promise<NewTokenRecord[]> {
  const db = await getDb();

  try {
    const newTokensTableExist = await createTableNewTokens(db);
    if (!newTokensTableExist) {
      throw new Error('Failed to create tokens table');
    }

    return await db.all('SELECT * FROM tokens');
  } finally {
    await db.close();
  }
}
