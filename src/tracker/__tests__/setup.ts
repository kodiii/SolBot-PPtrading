import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// This file will manage a shared in-memory database connection for tests
let sharedDb: any = null;

export async function getTestDb() {
    if (!sharedDb) {
        sharedDb = await open({
            filename: ':memory:',
            driver: sqlite3.Database
        });
    }
    return sharedDb;
}

export async function closeTestDb() {
    if (sharedDb) {
        await sharedDb.close();
        sharedDb = null;
    }
}