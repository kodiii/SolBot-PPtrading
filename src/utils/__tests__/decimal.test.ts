import { Decimal, BalanceReconciliation } from '../decimal';

describe('Decimal', () => {
  describe('constructor', () => {
    it('should create from string', () => {
      const d = new Decimal('123.456');
      expect(d.toString()).toBe('123.456');
    });

    it('should create from number', () => {
      const d = new Decimal(123.456);
      expect(d.toString()).toBe('123.456');
    });

    it('should create from Decimal', () => {
      const d1 = new Decimal('123.456');
      const d2 = new Decimal(d1);
      expect(d2.toString()).toBe('123.456');
    });

    it('should handle scientific notation', () => {
      const d = new Decimal('1.23456e-7');
      expect(d.toString()).toBe('0.000000123456');
    });
  });

  describe('arithmetic operations', () => {
    const a = new Decimal('10.5');
    const b = new Decimal('2.5');

    it('should add correctly', () => {
      expect(a.add(b).toString()).toBe('13');
      expect(a.add('2.5').toString()).toBe('13');
      expect(a.add(2.5).toString()).toBe('13');
      expect(a.add(-2.5).toString()).toBe('8');
    });

    it('should subtract correctly', () => {
      expect(a.subtract(b).toString()).toBe('8');
      expect(a.subtract('2.5').toString()).toBe('8');
      expect(a.subtract(2.5).toString()).toBe('8');
      expect(a.subtract(-2.5).toString()).toBe('13');
    });

    it('should multiply correctly', () => {
      expect(a.multiply(b).toString()).toBe('26.25');
      expect(a.multiply('2.5').toString()).toBe('26.25');
      expect(a.multiply(2.5).toString()).toBe('26.25');
      expect(a.multiply(-2.5).toString()).toBe('-26.25');
    });

    it('should divide correctly', () => {
      expect(a.divide(b).toString()).toBe('4.2');
      expect(a.divide('2.5').toString()).toBe('4.2');
      expect(a.divide(2.5).toString()).toBe('4.2');
      expect(a.divide(-2.5).toString()).toBe('-4.2');
    });

    it('should handle very large and small numbers', () => {
      const large = new Decimal('1e20');
      const small = new Decimal('1e-20');
      expect(large.multiply(small).toString()).toBe('1');
    });

    it('should throw error on division by zero', () => {
      expect(() => a.divide(0)).toThrow('Division by zero');
      expect(() => a.divide('0')).toThrow('Division by zero');
      expect(() => a.divide(new Decimal(0))).toThrow('Division by zero');
    });
  });

  describe('comparison operations', () => {
    const a = new Decimal('10.5');
    const b = new Decimal('2.5');
    const c = new Decimal('10.5');

    it('should compare equality correctly', () => {
      expect(a.equals(c)).toBe(true);
      expect(a.equals(b)).toBe(false);
      expect(a.equals('10.5')).toBe(true);
      expect(a.equals(10.5)).toBe(true);
      expect(a.equals(-10.5)).toBe(false);
    });

    it('should compare greater than correctly', () => {
      expect(a.greaterThan(b)).toBe(true);
      expect(b.greaterThan(a)).toBe(false);
      expect(a.greaterThan('2.5')).toBe(true);
      expect(a.greaterThan(2.5)).toBe(true);
      expect(a.greaterThan(-2.5)).toBe(true);
    });

    it('should compare less than correctly', () => {
      expect(b.lessThan(a)).toBe(true);
      expect(a.lessThan(b)).toBe(false);
      expect(b.lessThan('10.5')).toBe(true);
      expect(b.lessThan(10.5)).toBe(true);
      expect(b.lessThan(-10.5)).toBe(false);
    });
  });

  describe('formatting and conversion', () => {
    const d = new Decimal('123.456789');

    it('should convert to string with optional decimals', () => {
      expect(d.toString()).toBe('123.456789');
      expect(d.toString(2)).toBe('123.46');
      expect(d.toString(0)).toBe('123');
      expect(d.toString(10)).toBe('123.4567890000');
    });

    it('should convert to number', () => {
      expect(d.toNumber()).toBe(123.456789);
      expect(new Decimal('Infinity').toNumber()).toBe(Infinity);
      expect(new Decimal('-Infinity').toNumber()).toBe(-Infinity);
    });
  });

  describe('utility methods', () => {
    it('should calculate absolute value', () => {
      expect(new Decimal('-123.456').abs().toString()).toBe('123.456');
      expect(new Decimal('123.456').abs().toString()).toBe('123.456');
      expect(new Decimal('0').abs().toString()).toBe('0');
    });

    it('should check for zero', () => {
      expect(new Decimal('0').isZero()).toBe(true);
      expect(new Decimal('0.0').isZero()).toBe(true);
      expect(new Decimal('1').isZero()).toBe(false);
    });

    it('should check for negative values', () => {
      expect(new Decimal('-1').isNegative()).toBe(true);
      expect(new Decimal('1').isNegative()).toBe(false);
      expect(new Decimal('0').isNegative()).toBe(false);
    });

    it('should check for positive values', () => {
      expect(new Decimal('1').isPositive()).toBe(true);
      expect(new Decimal('-1').isPositive()).toBe(false);
      expect(new Decimal('0').isPositive()).toBe(false);
    });
  });

  describe('Solana-specific methods', () => {
    it('should convert to lamports', () => {
      const sol = new Decimal('1.23456789');
      expect(sol.toLamports().toString()).toBe('1234567890');
      expect(new Decimal('0.000000001').toLamports().toString()).toBe('1');
    });

    it('should convert from lamports', () => {
      expect(Decimal.fromLamports('1234567890').toString()).toBe('1.23456789');
      expect(Decimal.fromLamports(1234567890).toString()).toBe('1.23456789');
      expect(Decimal.fromLamports('1').toString()).toBe('0.000000001');
    });
  });

  describe('static operations', () => {
    it('should find maximum value', () => {
      const values = ['1.23', '2.34', '0.5'].map(v => new Decimal(v));
      expect(Decimal.max(...values).toString()).toBe('2.34');
      expect(Decimal.max('1.23', '2.34', '0.5').toString()).toBe('2.34');
      expect(Decimal.max('-1', '-2', '-3').toString()).toBe('-1');
    });

    it('should find minimum value', () => {
      const values = ['1.23', '2.34', '0.5'].map(v => new Decimal(v));
      expect(Decimal.min(...values).toString()).toBe('0.5');
      expect(Decimal.min('1.23', '2.34', '0.5').toString()).toBe('0.5');
      expect(Decimal.min('-1', '-2', '-3').toString()).toBe('-3');
    });

    it('should handle empty arrays for min/max', () => {
      expect(() => Decimal.max()).toThrow('Cannot find maximum of empty array');
      expect(() => Decimal.min()).toThrow('Cannot find minimum of empty array');
    });
  });
});

describe('BalanceReconciliation', () => {
  describe('validateBalance', () => {
    it('should validate matching balances', () => {
      const recorded = new Decimal('1.23456789');
      const actual = new Decimal('1.23456789');
      expect(BalanceReconciliation.validateBalance(recorded, actual)).toBe(true);
    });

    it('should validate balances within tolerance', () => {
      const recorded = new Decimal('1.23456789');
      const actual = new Decimal('1.234567891'); // Difference of 0.000000001 (1 lamport)
      expect(BalanceReconciliation.validateBalance(recorded, actual)).toBe(true);
    });

    it('should reject balances outside tolerance', () => {
      const recorded = new Decimal('1.23456789');
      const actual = new Decimal('1.234567892'); // Difference of 0.000000002 (2 lamports)
      expect(BalanceReconciliation.validateBalance(recorded, actual)).toBe(false);
    });

    it('should calculate discrepancy', () => {
      const recorded = new Decimal('1.23456789');
      const actual = new Decimal('1.23456780');
      expect(BalanceReconciliation.calculateDiscrepancy(recorded, actual).toString()).toBe('0.00000009');
    });

    it('should handle custom tolerance', () => {
      const recorded = new Decimal('1.23456789');
      const actual = new Decimal('1.23456779');
      const tolerance = new Decimal('0.0000001');
      expect(BalanceReconciliation.validateBalance(recorded, actual, tolerance)).toBe(true);
    });
  });
});