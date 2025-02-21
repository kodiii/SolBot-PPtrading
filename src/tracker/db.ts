import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import { config } from "./../config";
import { HoldingRecord, NewTokenRecord } from "../types";

// Tracker
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

async function getDb() {
  return await open({
    filename: config.swap.db_name_tracker_holdings,
    driver: sqlite3.Database
  });
}

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

export async function getOpenPositionsCount(): Promise<number> {
  const db = await getDb();

  try {
    const holdingsTableExist = await createTableHoldings(db);
    if (!holdingsTableExist) {
      throw new Error('Failed to create holdings table');
    }

    const result = await db.get('SELECT COUNT(*) as count FROM holdings');
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting open positions count:', error);
    return 0;
  } finally {
    if (db) {
      await db.close();
    }
  }
}

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
