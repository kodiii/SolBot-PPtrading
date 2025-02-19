import BigNumber from 'bignumber.js';

BigNumber.config({
  EXPONENTIAL_AT: [-20, 20], // Prevent scientific notation for reasonable numbers
  DECIMAL_PLACES: 20,        // Increase internal precision
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

export class Decimal {
  private value: BigNumber;

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

  equals(other: Decimal | string | number): boolean {
    return this.value.isEqualTo(other instanceof Decimal ? other.value : other);
  }

  greaterThan(other: Decimal | string | number): boolean {
    return this.value.isGreaterThan(other instanceof Decimal ? other.value : other);
  }

  lessThan(other: Decimal | string | number): boolean {
    return this.value.isLessThan(other instanceof Decimal ? other.value : other);
  }

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

  toNumber(): number {
    return this.value.toNumber();
  }

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
    return this.value.isGreaterThan(0);
  }

  toLamports(): Decimal {
    return this.multiply(Decimal.LAMPORTS_PER_SOL);
  }

  static fromLamports(lamports: string | number | BigNumber | Decimal): Decimal {
    const value = lamports instanceof Decimal ? lamports : new Decimal(lamports);
    return value.divide(Decimal.LAMPORTS_PER_SOL);
  }

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

  static ZERO = new Decimal(0);
  static ONE = new Decimal(1);
  static LAMPORTS_PER_SOL = new Decimal('1000000000');

  getValue(): BigNumber {
    return this.value;
  }
}

export class BalanceReconciliation {
  static validateBalance(
    recorded: Decimal,
    actual: Decimal,
    tolerance: Decimal = new Decimal('0.000000001')
  ): boolean {
    const diff = recorded.subtract(actual).abs();
    return diff.lessThan(tolerance) || diff.equals(tolerance);
  }

  static calculateDiscrepancy(recorded: Decimal, actual: Decimal): Decimal {
    return recorded.subtract(actual);
  }
}