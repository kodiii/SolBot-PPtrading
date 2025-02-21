import BigNumber from 'bignumber.js';

/**
 * Configuration for BigNumber.js to handle decimal arithmetic with high precision
 * - Prevents scientific notation for numbers between 1e-20 and 1e20
 * - Sets internal precision to 20 decimal places
 * - Uses ROUND_HALF_UP for rounding
 * - Configures number formatting without separators
 */
BigNumber.config({
  EXPONENTIAL_AT: [-20, 20],
  DECIMAL_PLACES: 20,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
  FORMAT: {
    prefix: '',
    decimalSeparator: '.',
    groupSeparator: '',
    groupSize: 0,
    secondaryGroupSize: 0,
    fractionGroupSeparator: '',
    fractionGroupSize: 0,
    suffix: ''
  }
});

/**
 * A class for handling decimal arithmetic with high precision, particularly useful for
 * financial calculations and Solana token operations. Uses BigNumber.js internally to
 * prevent floating-point precision errors.
 */
export class Decimal {
  private value: BigNumber;

  /**
   * Creates a new Decimal instance
   * @param value - The value to initialize with. Can be a string (including scientific notation),
   *               number, BigNumber, or another Decimal instance
   */
  constructor(value: string | number | BigNumber | Decimal) {
    if (typeof value === 'string' && value.toLowerCase().includes('e')) {
      const [base, exponent] = value.toLowerCase().split('e');
      const exp = parseInt(exponent);
      const baseNum = new BigNumber(base);
      this.value = baseNum.multipliedBy(new BigNumber(10).pow(exp));
    } else {
      this.value = value instanceof Decimal ? value.getValue() : new BigNumber(value);
    }
  }

  /**
   * Adds another value to this Decimal
   * @param other - The value to add
   * @returns A new Decimal instance with the sum
   */
  add(other: Decimal | string | number): Decimal {
    return new Decimal(this.value.plus(other instanceof Decimal ? other.value : other));
  }

  /**
   * Subtracts another value from this Decimal
   * @param other - The value to subtract
   * @returns A new Decimal instance with the difference
   */
  subtract(other: Decimal | string | number): Decimal {
    return new Decimal(this.value.minus(other instanceof Decimal ? other.value : other));
  }

  /**
   * Multiplies this Decimal by another value
   * @param other - The value to multiply by
   * @returns A new Decimal instance with the product
   */
  multiply(other: Decimal | string | number): Decimal {
    return new Decimal(this.value.times(other instanceof Decimal ? other.value : other));
  }

  /**
   * Divides this Decimal by another value
   * @param other - The value to divide by
   * @returns A new Decimal instance with the quotient
   * @throws {Error} If attempting to divide by zero
   */
  divide(other: Decimal | string | number): Decimal {
    const divisor = other instanceof Decimal ? other.value : new BigNumber(other);
    if (divisor.isZero()) {
      throw new Error('Division by zero');
    }
    return new Decimal(this.value.dividedBy(divisor));
  }

  /**
   * Checks if this Decimal is equal to another value
   * @param other - The value to compare with
   * @returns true if the values are equal
   */
  equals(other: Decimal | string | number): boolean {
    return this.value.isEqualTo(other instanceof Decimal ? other.value : other);
  }

  /**
   * Checks if this Decimal is greater than another value
   * @param other - The value to compare with
   * @returns true if this value is greater
   */
  greaterThan(other: Decimal | string | number): boolean {
    return this.value.isGreaterThan(other instanceof Decimal ? other.value : other);
  }

  /**
   * Checks if this Decimal is less than another value
   * @param other - The value to compare with
   * @returns true if this value is less
   */
  lessThan(other: Decimal | string | number): boolean {
    return this.value.isLessThan(other instanceof Decimal ? other.value : other);
  }

  /**
   * Converts the Decimal to a string representation
   * @param decimals - Optional number of decimal places to fix to
   * @returns A string representation of the number
   */
  toString(decimals?: number): string {
    if (this.value.isZero()) {
      return decimals !== undefined ? '0'.padEnd(decimals + 2, '0') : '0';
    }

    let str: string;
    if (decimals !== undefined) {
      str = this.value.toFixed(decimals, BigNumber.ROUND_HALF_UP);
    } else {
      // For very small or large numbers, ensure we maintain precision
      if (this.value.abs().lt('0.000001') || this.value.abs().gt('1e20')) {
        str = this.value.toFixed(20);
      } else {
        str = this.value.toFixed(9);
      }

      // Remove trailing zeros after decimal point
      str = str.replace(/\.?0+$/, '');
      if (str.includes('.')) {
        str = str.replace(/0+$/, '');
      }
    }

    return str;
  }

  /**
   * Converts the Decimal to a JavaScript number
   * @returns The number value
   * @warning May lose precision for very large or small numbers
   */
  toNumber(): number {
    return this.value.toNumber();
  }

  /**
   * Returns the absolute value of this Decimal
   * @returns A new Decimal instance with the absolute value
   */
  abs(): Decimal {
    return new Decimal(this.value.abs());
  }

  /**
   * Checks if this Decimal is zero
   * @returns true if the value is zero
   */
  isZero(): boolean {
    return this.value.isZero();
  }

  /**
   * Checks if this Decimal is negative
   * @returns true if the value is negative
   */
  isNegative(): boolean {
    return this.value.isNegative();
  }

  /**
   * Checks if this Decimal is positive
   * @returns true if the value is positive
   */
  isPositive(): boolean {
    return this.value.isGreaterThan(0);
  }

  /**
   * Converts SOL to lamports (1 SOL = 1e9 lamports)
   * @returns A new Decimal instance with the value in lamports
   */
  toLamports(): Decimal {
    return this.multiply(Decimal.LAMPORTS_PER_SOL);
  }

  /**
   * Converts lamports to SOL
   * @param lamports - The number of lamports to convert
   * @returns A new Decimal instance with the value in SOL
   */
  static fromLamports(lamports: string | number | BigNumber | Decimal): Decimal {
    const value = lamports instanceof Decimal ? lamports : new Decimal(lamports);
    return value.divide(Decimal.LAMPORTS_PER_SOL);
  }

  /**
   * Returns the maximum value from an array of values
   * @param values - Array of values to compare
   * @returns The maximum value as a Decimal
   * @throws {Error} If the array is empty
   */
  static max(...values: (Decimal | string | number)[]): Decimal {
    if (values.length === 0) {
      throw new Error('Cannot find maximum of empty array');
    }
    
    return values.reduce((max: Decimal, current) => {
      const currentDecimal = current instanceof Decimal ? current : new Decimal(current);
      return currentDecimal.greaterThan(max) ? currentDecimal : max;
    }, new Decimal(values[0]));
  }

  /**
   * Returns the minimum value from an array of values
   * @param values - Array of values to compare
   * @returns The minimum value as a Decimal
   * @throws {Error} If the array is empty
   */
  static min(...values: (Decimal | string | number)[]): Decimal {
    if (values.length === 0) {
      throw new Error('Cannot find minimum of empty array');
    }
    
    return values.reduce((min: Decimal, current) => {
      const currentDecimal = current instanceof Decimal ? current : new Decimal(current);
      return currentDecimal.lessThan(min) ? currentDecimal : min;
    }, new Decimal(values[0]));
  }

  /** Constant representing zero */
  static ZERO = new Decimal(0);
  /** Constant representing one */
  static ONE = new Decimal(1);
  /** Number of lamports in one SOL (1e9) */
  static LAMPORTS_PER_SOL = new Decimal('1000000000');

  /**
   * Gets the internal BigNumber value
   * @returns The internal BigNumber instance
   */
  getValue(): BigNumber {
    return this.value;
  }
}

/**
 * Utility class for validating and reconciling balances
 */
export class BalanceReconciliation {
  /**
   * Validates if two balances are equal within a tolerance
   * @param recorded - The recorded balance
   * @param actual - The actual balance
   * @param tolerance - Maximum allowed difference (default: 0.000000001)
   * @returns true if the difference is within tolerance
   */
  static validateBalance(
    recorded: Decimal,
    actual: Decimal,
    tolerance: Decimal = new Decimal('0.000000001')
  ): boolean {
    const diff = recorded.subtract(actual).abs();
    return diff.lessThan(tolerance) || diff.equals(tolerance);
  }

  /**
   * Calculates the discrepancy between recorded and actual balances
   * @param recorded - The recorded balance
   * @param actual - The actual balance
   * @returns The difference between recorded and actual balances
   */
  static calculateDiscrepancy(recorded: Decimal, actual: Decimal): Decimal {
    return recorded.subtract(actual);
  }
}