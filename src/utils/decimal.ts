import BigNumber from 'bignumber.js';

// Configure BigNumber settings for our use case
BigNumber.config({
  DECIMAL_PLACES: 9,  // Solana's native precision
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,  // Standard rounding mode
  EXPONENTIAL_AT: [-9, 20]  // Range for non-exponential string representation
});

export class Decimal {
  private value: BigNumber;

  constructor(value: string | number | BigNumber | Decimal) {
    this.value = value instanceof Decimal ? value.getValue() : new BigNumber(value);
  }

  // Basic arithmetic operations
  add(other: Decimal | string | number): Decimal {
    return new Decimal(this.value.plus(other instanceof Decimal ? other.value : other));
  }

  subtract(other: Decimal | string | number): Decimal {
    return new Decimal(this.value.minus(other instanceof Decimal ? other.value : other));
  }

  multiply(other: Decimal | string | number): Decimal {
    return new Decimal(this.value.times(other instanceof Decimal ? other.value : other));
  }

  divide(other: Decimal | string | number): Decimal {
    const divisor = other instanceof Decimal ? other.value : new BigNumber(other);
    if (divisor.isZero()) {
      throw new Error('Division by zero');
    }
    return new Decimal(this.value.dividedBy(divisor));
  }

  // Comparison methods
  equals(other: Decimal | string | number): boolean {
    return this.value.isEqualTo(other instanceof Decimal ? other.value : other);
  }

  greaterThan(other: Decimal | string | number): boolean {
    return this.value.isGreaterThan(other instanceof Decimal ? other.value : other);
  }

  lessThan(other: Decimal | string | number): boolean {
    return this.value.isLessThan(other instanceof Decimal ? other.value : other);
  }

  // Formatting and conversion
  toString(decimals?: number): string {
    if (decimals !== undefined) {
      return this.value.toFixed(decimals, BigNumber.ROUND_HALF_UP);
    }
    return this.value.toString();
  }

  toNumber(): number {
    return this.value.toNumber();
  }

  // Utility methods
  abs(): Decimal {
    return new Decimal(this.value.abs());
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  isNegative(): boolean {
    return this.value.isNegative();
  }

  isPositive(): boolean {
    return this.value.isPositive();
  }

  // Solana-specific methods
  toLamports(): Decimal {
    return this.multiply(Decimal.LAMPORTS_PER_SOL);
  }

  static fromLamports(lamports: string | number | BigNumber | Decimal): Decimal {
    const value = lamports instanceof Decimal ? lamports : new Decimal(lamports);
    return value.divide(Decimal.LAMPORTS_PER_SOL);
  }

  // Static utility methods
  static max(...values: (Decimal | string | number)[]): Decimal {
    if (values.length === 0) {
      throw new Error('Cannot find maximum of empty array');
    }
    
    return values.reduce((max: Decimal, current) => {
      const currentDecimal = current instanceof Decimal ? current : new Decimal(current);
      return currentDecimal.greaterThan(max) ? currentDecimal : max;
    }, new Decimal(values[0]));
  }

  static min(...values: (Decimal | string | number)[]): Decimal {
    if (values.length === 0) {
      throw new Error('Cannot find minimum of empty array');
    }
    
    return values.reduce((min: Decimal, current) => {
      const currentDecimal = current instanceof Decimal ? current : new Decimal(current);
      return currentDecimal.lessThan(min) ? currentDecimal : min;
    }, new Decimal(values[0]));
  }

  // Commonly used constants
  static ZERO = new Decimal(0);
  static ONE = new Decimal(1);
  static LAMPORTS_PER_SOL = new Decimal('1000000000');

  // Allow access to underlying BigNumber value
  getValue(): BigNumber {
    return this.value;
  }
}

// Balance reconciliation helper
export class BalanceReconciliation {
  static validateBalance(
    recorded: Decimal,
    actual: Decimal,
    tolerance: Decimal = new Decimal('0.000000001') // 1 lamport tolerance
  ): boolean {
    const diff = recorded.subtract(actual).abs();
    return diff.lessThan(tolerance) || diff.equals(tolerance);
  }

  static calculateDiscrepancy(recorded: Decimal, actual: Decimal): Decimal {
    return recorded.subtract(actual);
  }
}