import { getOpenPositionsCount, createTableHoldings } from '../db';
import { HoldingRecord } from '../../types';
import { getTestDb, closeTestDb } from './setup';
import { Decimal } from '../../utils/decimal';

// Mock the database connection
jest.mock('../../config', () => ({
  config: {
    swap: {
      db_name_tracker_holdings: ':memory:'
    }
  }
}));

// Mock the getDb function to use our test database
jest.mock('../db', () => {
  const actual = jest.requireActual('../db');
  return {
    ...actual,
    // Override getDb to return our test database
    getDb: jest.fn().mockImplementation(async () => getTestDb())
  };
});

describe('Tracker DB Operations', () => {
  beforeAll(async () => {
    const testDb = await getTestDb();
    const success = await createTableHoldings(testDb);
    if (!success) {
      throw new Error('Failed to initialize test database schema');
    }
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    const testDb = await getTestDb();
    await testDb.run('DELETE FROM holdings');
  });

  describe('getOpenPositionsCount', () => {
    it('should return 0 when no positions exist', async () => {
      const count = await getOpenPositionsCount();
      expect(count).toBe(0);
    });

    it('should return correct count when positions exist', async () => {
      const testDb = await getTestDb();

      const testHolding1: HoldingRecord = {
        Time: Date.now(),
        Token: 'token1',
        TokenName: 'Test Token 1',
        Balance: new Decimal('100'),
        SolPaid: new Decimal('1'),
        SolFeePaid: new Decimal('0.01'),
        SolPaidUSDC: new Decimal('25'),
        SolFeePaidUSDC: new Decimal('0.25'),
        PerTokenPaidUSDC: new Decimal('0.25'),
        Slot: 1,
        Program: 'test'
      };

      const testHolding2: HoldingRecord = {
        Time: Date.now(),
        Token: 'token2',
        TokenName: 'Test Token 2',
        Balance: new Decimal('200'),
        SolPaid: new Decimal('2'),
        SolFeePaid: new Decimal('0.01'),
        SolPaidUSDC: new Decimal('50'),
        SolFeePaidUSDC: new Decimal('0.25'),
        PerTokenPaidUSDC: new Decimal('0.25'),
        Slot: 2,
        Program: 'test'
      };

      await testDb.run(
        `INSERT INTO holdings (Time, Token, TokenName, Balance, SolPaid, SolFeePaid, SolPaidUSDC, SolFeePaidUSDC, PerTokenPaidUSDC, Slot, Program)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [testHolding1.Time, testHolding1.Token, testHolding1.TokenName, testHolding1.Balance.toString(), 
         testHolding1.SolPaid.toString(), testHolding1.SolFeePaid.toString(), testHolding1.SolPaidUSDC.toString(),
         testHolding1.SolFeePaidUSDC.toString(), testHolding1.PerTokenPaidUSDC.toString(), testHolding1.Slot, testHolding1.Program]
      );

      await testDb.run(
        `INSERT INTO holdings (Time, Token, TokenName, Balance, SolPaid, SolFeePaid, SolPaidUSDC, SolFeePaidUSDC, PerTokenPaidUSDC, Slot, Program)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [testHolding2.Time, testHolding2.Token, testHolding2.TokenName, testHolding2.Balance.toString(),
         testHolding2.SolPaid.toString(), testHolding2.SolFeePaid.toString(), testHolding2.SolPaidUSDC.toString(),
         testHolding2.SolFeePaidUSDC.toString(), testHolding2.PerTokenPaidUSDC.toString(), testHolding2.Slot, testHolding2.Program]
      );

      const count = await getOpenPositionsCount(testDb);
      expect(count).toBe(2);
    });

    it('should return correct count after removing a position', async () => {
      const testDb = await getTestDb();
      
      // Insert test holding
      const testHolding: HoldingRecord = {
        Time: Date.now(),
        Token: 'token1',
        TokenName: 'Test Token 1',
        Balance: new Decimal('100'),
        SolPaid: new Decimal('1'),
        SolFeePaid: new Decimal('0.01'),
        SolPaidUSDC: new Decimal('25'),
        SolFeePaidUSDC: new Decimal('0.25'),
        PerTokenPaidUSDC: new Decimal('0.25'),
        Slot: 1,
        Program: 'test'
      };

      await testDb.run(
        `INSERT INTO holdings (Time, Token, TokenName, Balance, SolPaid, SolFeePaid, SolPaidUSDC, SolFeePaidUSDC, PerTokenPaidUSDC, Slot, Program)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [testHolding.Time, testHolding.Token, testHolding.TokenName, testHolding.Balance.toString(),
         testHolding.SolPaid.toString(), testHolding.SolFeePaid.toString(), testHolding.SolPaidUSDC.toString(),
         testHolding.SolFeePaidUSDC.toString(), testHolding.PerTokenPaidUSDC.toString(), testHolding.Slot, testHolding.Program]
      );
      
      let count = await getOpenPositionsCount(testDb);
      expect(count).toBe(1);

      await testDb.run('DELETE FROM holdings WHERE Token = ?', ['token1']);
      
      count = await getOpenPositionsCount(testDb);
      expect(count).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Force a database error
      jest.spyOn(require('./setup'), 'getTestDb').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const count = await getOpenPositionsCount();
      expect(count).toBe(0);
    });
  });
});