# System Design Patterns

## Frontend Architecture Pattern (Added 22/02/2025)

### Dual Mode Trading System
```typescript
// Mode management with type safety
type TradingMode = 'paper' | 'real';

interface ModeConfig {
  type: TradingMode;
  requiresWallet: boolean;
  validations: ValidationStrategy[];
  components: ComponentRegistry;
}

// Shared component base with mode-specific implementations
abstract class TradingComponent {
  protected mode: TradingMode;
  abstract render(): void;
  abstract update(data: any): void;
}

// Mode-specific implementations
class PaperTradingComponent extends TradingComponent {
  constructor() {
    super();
    this.mode = 'paper';
  }
}

class RealTradingComponent extends TradingComponent {
  constructor() {
    super();
    this.mode = 'real';
  }
}

// Mode switching with safety checks
class ModeManager {
  private currentMode: TradingMode = 'paper';
  private wallet: WalletConnection | null = null;

  async switchMode(newMode: TradingMode): Promise<boolean> {
    if (newMode === 'real' && !this.wallet) {
      throw new Error('Wallet connection required for real trading');
    }
    
    await this.cleanupCurrentMode();
    this.currentMode = newMode;
    await this.initializeMode(newMode);
    return true;
  }

  private async cleanupCurrentMode(): Promise<void> {
    // Cleanup resources, reset state, clear subscriptions
  }

  private async initializeMode(mode: TradingMode): Promise<void> {
    // Initialize components, connect services, setup listeners
  }
}
```

1. **Mode Separation**
   - Clear distinction between paper and real trading
   - Shared infrastructure components
   - Mode-specific implementations
   - Safe mode switching mechanism

2. **Component Architecture**
   ```typescript
   interface ComponentRegistry {
     balance: typeof BalanceDisplay;
     trades: typeof TradeHistory;
     positions: typeof PositionManager;
     orders: typeof OrderForm;
   }

   abstract class BalanceDisplay extends TradingComponent {
     protected abstract fetchBalance(): Promise<Balance>;
     protected abstract formatBalance(balance: Balance): string;
   }

   class PaperBalanceDisplay extends BalanceDisplay {
     protected async fetchBalance(): Promise<Balance> {
       return await paperTradingDB.getVirtualBalance();
     }
   }

   class RealBalanceDisplay extends BalanceDisplay {
     protected async fetchBalance(): Promise<Balance> {
       return await this.wallet.getBalance();
     }
   }
   ```
   - Base component abstractions
   - Shared market data services
   - Mode-specific validation rules
   - Common UI elements

3. **State Management**
   ```typescript
   interface TradingState {
     mode: TradingMode;
     shared: {
       marketData: MarketData;
       settings: UserSettings;
     };
     paper: PaperTradingState;
     real: RealTradingState;
   }

   interface MarketData {
     price: Decimal;
     volume: Volume;
     liquidity: Liquidity;
     timestamp: number;
   }

   class StateManager {
     private state: TradingState;
     private subscribers: Set<StateSubscriber>;

     updateSharedState(data: Partial<SharedState>): void {
       this.state.shared = { ...this.state.shared, ...data };
       this.notifySubscribers();
     }

     updateModeState(mode: TradingMode, data: any): void {
       if (mode === 'paper') {
         this.state.paper = { ...this.state.paper, ...data };
       } else {
         this.state.real = { ...this.state.real, ...data };
       }
       this.notifySubscribers();
     }
   }
   ```
   - Isolated state per mode
   - Shared market data
   - Type-safe state management
   - Real-time synchronization

## Price Slippage Pattern (Added 22/02/2025)

### Trade Execution with Slippage
```typescript
// Convert basis points to decimal percentage
const slippageBps = new Decimal(config.swap.slippageBps);
const maxSlippage = slippageBps.divide(10000); // 200 -> 0.02

// Random slippage between 0 and max
const randomSlippage = maxSlippage.multiply(new Decimal(Math.random()));

// Apply slippage differently for buy/sell
// Buy: Price increases (worse for buyer)
const buyPriceWithSlippage = currentPrice.multiply(Decimal.ONE.add(randomSlippage));
// Sell: Price decreases (worse for seller)
const sellPriceWithSlippage = currentPrice.multiply(Decimal.ONE.subtract(randomSlippage));
```

1. **Slippage Configuration**
   - Configurable slippage in basis points
   - Separate buy (swap) and sell configurations
   - Dynamic slippage calculation
   - Precise decimal arithmetic

2. **Price Impact Simulation**
   - Random slippage within maximum bounds
   - Different impact for buys vs sells
   - Realistic market simulation
   - Maintains price precision

3. **Trade Recording**
   - Stores slippage-adjusted prices
   - Tracks actual execution prices
   - Maintains trade history accuracy
   - Includes slippage in P&L calculations

## Module Organization Pattern (Added 20/02/2025)

### Paper Trading Module Structure
```
src/
├── papertrading/              # Paper trading implementation
│   ├── db/                   # Database management
│   ├── services/             # Business logic
│   └── cli/                  # CLI interface
├── frontend/                 # Frontend implementation
│   ├── components/           # Shared & mode-specific components
│   ├── services/            # Frontend services
│   ├── state/              # State management
│   └── modes/              # Mode implementations
└── shared/                  # Shared utilities and types
```

1. **Modular Database Management**
   - Dedicated database location within module
   - Consistent path management
   - Module-specific connection handling
   - Data persistence patterns

2. **State Management**
   ```typescript
   interface VirtualBalance {
     balance_sol: Decimal;
     updated_at: number;
   }
   ```
   - Persistent state storage
   - Balance preservation between restarts
   - Type-safe decimal handling
   - Timestamp tracking for updates

3. **Service Layer Pattern**
   ```typescript
   export class SimulationService {
     private static instance: SimulationService;
     private constructor() {
       initializePaperTradingDB();
     }
     public static getInstance(): SimulationService {
       if (!SimulationService.instance) {
         SimulationService.instance = new SimulationService();
       }
       return SimulationService.instance;
     }
   }
   ```
   - Singleton service management
   - Encapsulated initialization
   - Controlled database access
   - Resource lifecycle management

## Database Connection Management

### Connection Pool Pattern
The system implements a robust connection pool pattern with the following characteristics:

1. **Singleton Connection Manager**
   ```typescript
   private static instance: ConnectionManager;
   ```
   - Ensures single point of control for database connections
   - Manages connection lifecycle consistently
   - Enforces memory usage limits

2. **Resource Pool Management**
   ```typescript
   private pool: Database[] = [];
   private inUse: Set<Database> = new Set();
   private lastUsed: Map<Database, number> = new Map();
   ```
   - Maintains fixed-size connection pool
   - Tracks active connections
   - Monitors connection age and usage
   - Implements idle connection cleanup
   - Prevents memory leaks

3. **Memory Management Strategy**
   ```typescript
   private memoryCheck(): void {
     const now = Date.now();
     this.lastUsed.forEach((timestamp, connection) => {
       if (now - timestamp > this.idleTimeout) {
         this.cleanupIdleConnection(connection);
       }
     });
   }
   ```
   - Automatic idle connection cleanup
   - Memory usage monitoring
   - Resource utilization tracking
   - Periodic health checks

4. **Transaction Management**
   - Automatic rollback on errors
   - Proper cleanup of resources
   - Nested transaction support
   - Memory-aware transaction limits

### Error Handling Patterns

1. **Retry with Backoff**
   ```typescript
   retryDelay * Math.pow(2, attempt)
   ```
   - Exponential backoff for failed operations
   - Configurable retry limits
   - Error categorization for recovery decisions
   - Memory-aware retry limits

2. **Resource Cleanup**
   ```typescript
   finally {
     try {
       await this.releaseConnection(connection);
     } catch (error) {
       await this.forceCleanup(connection);
     }
   }
   ```
   - Guaranteed resource cleanup
   - Connection state restoration
   - Pool maintenance
   - Memory leak prevention
   - Forced cleanup for stuck connections

3. **Error Propagation**
   - Preserves error context
   - Provides meaningful error messages
   - Maintains error chain
   - Includes memory usage context

### Memory Management Patterns

1. **Connection Aging**
   ```typescript
   private readonly maxConnectionAge = 3600000; // 1 hour
   private readonly idleTimeout = 300000;     // 5 minutes

   private isConnectionStale(connection: Database): boolean {
     const lastUsedTime = this.lastUsed.get(connection);
     return lastUsedTime && (Date.now() - lastUsedTime > this.maxConnectionAge);
   }
   ```
   - Maximum connection lifetime
   - Idle connection timeout
   - Stale connection detection
   - Automatic renewal of aged connections

2. **Resource Monitoring**
   ```typescript
   private checkResourceLimits(): void {
     if (this.pool.length > this.maxPoolSize) {
       this.shrinkPool();
     }
     this.memoryCheck();
   }
   ```
   - Pool size monitoring
   - Memory usage tracking
   - Resource limit enforcement
   - Automatic pool size adjustment

3. **Health Checks**
   ```typescript
   private async verifyConnection(connection: Database): Promise<boolean> {
     try {
       await connection.get('SELECT 1');
       return true;
     } catch {
       return false;
     }
   }
   ```
   - Regular connection testing
   - Proactive error detection
   - Performance monitoring
   - Memory leak detection

### Testing Patterns

1. **Memory Testing**
   - Memory leak detection
   - Resource usage tracking
   - Long-running stability tests
   - Memory pressure tests

2. **Stress Testing**
   - Concurrent operation handling
   - Resource exhaustion scenarios
   - Recovery mechanism verification
   - Memory limit testing

3. **Coverage Strategy**
   - Statement coverage: 100%
   - Branch coverage: 89.79%
   - Function coverage: 100%
   - Memory management coverage: 95%

## Latest Improvements

1. **Frontend Architecture (22/02/2025)**
   - Implemented dual-mode trading system
   - Created shared component structure
   - Established mode switching patterns
   - Added security validations
   - Integrated market data services

2. **Dashboard Improvements (22/02/2025)**
   - Configurable recent trades display
   - Enhanced market data integration
   - Improved trade visualization
   - Real-time updates pattern
   - DexScreener data integration

3. **Enhanced Memory Management (17/02/2025)**
   - Added connection aging system
   - Implemented idle connection cleanup
   - Added memory usage monitoring
   - Improved connection pool efficiency

4. **Resource Management**
   - Automatic cleanup in error cases
   - Proper connection state tracking
   - Memory leak prevention
   - Resource usage optimization

## Future Considerations

1. **Frontend Scalability**
   - Component lazy loading
   - State management optimization
   - Real-time data efficiency
   - Mode switching performance
   - Shared component reusability

2. **Performance Monitoring**
   - Connection acquisition metrics
   - Transaction performance tracking
   - Recovery time measurements
   - Memory usage analytics
   - Frontend render performance

3. **Scalability Patterns**
   - Dynamic pool sizing
   - Load-based connection management
   - Automated resource optimization
   - Memory-aware scaling
   - Component code splitting

## Implementation Examples

### Memory-Aware Connection Recovery
```typescript
private async recoverConnection(connection: Database): Promise<void> {
  try {
    // Remove broken connection and cleanup
    this.pool = this.pool.filter(conn => conn !== connection);
    this.inUse.delete(connection);
    this.lastUsed.delete(connection);
    await connection.close();

    // Create new connection with monitoring
    const newConnection = await this.createConnection();
    await newConnection.configure('busyTimeout', 3000);
    this.lastUsed.set(newConnection, Date.now());
    this.pool.push(newConnection);
  } catch (error) {
    console.error('Failed to recover connection:', error);
    throw error;
  }
}
```

### Resource-Aware Transaction Management
```typescript
public async transaction<T>(
  callback: (transaction: DatabaseTransaction) => Promise<T>
): Promise<T> {
  const connection = await this.getConnection();
  
  try {
    if (this.isConnectionStale(connection)) {
      await this.renewConnection(connection);
    }
    
    await connection.run('BEGIN TRANSACTION');
    const result = await callback({
      commit: async () => connection.run('COMMIT'),
      rollback: async () => connection.run('ROLLBACK')
    });
    await connection.run('COMMIT');
    return result;
  } catch (error) {
    await connection.run('ROLLBACK');
    throw error;
  } finally {
    this.updateLastUsed(connection);
    this.releaseConnection(connection);
    this.checkResourceLimits();
  }
}
```

These patterns ensure robust database operations with proper memory management, error handling, resource optimization, and recovery mechanisms, while providing a clear separation between paper and real trading modes in the frontend architecture.

## Dashboard Style Configuration Pattern (Added 23/02/2025)

### Configurable UI Styling System
```typescript
// Color scheme interface for consistent styling
interface ColorScheme {
    // Value colors for metrics
    profit: keyof typeof chalk;
    loss: keyof typeof chalk;
    neutral: keyof typeof chalk;
    
    // Text element colors
    header: keyof typeof chalk;
    title: keyof typeof chalk;
    text: keyof typeof chalk;
    label: keyof typeof chalk;
    
    // Border styling
    border: keyof typeof chalk;
    separator: keyof typeof chalk;
}

// Complete dashboard styling configuration
interface DashboardStyle {
    border_style: "single" | "double";
    header_style: keyof typeof chalk;
    text_style: "normal" | "bold" | "dim";
    color_scheme: ColorScheme;
    section_spacing: number;
    align_numbers: "left" | "right";
    row_separator: boolean;
}
```

1. **Color Configuration**
   - Semantic color assignments (profit/loss)
   - Element-specific colors (headers/borders)
   - Support for basic and bright colors
   - Background color options

2. **Layout Management**
   - Dynamic table width calculation
   - Column width constraints
   - Section spacing control
   - Number alignment options
   - Configurable row separators

3. **Style Implementation**
   ```typescript
   // Example of dynamic table width calculation
   function calculateTableWidth(columnWidths: number[]): number {
       return columnWidths.reduce((sum, width) => sum + width, 0)
              + columnWidths.length + 1; // Add separators
   }

   // Color application with type safety
   const colorBorder = (str: string) =>
       (chalk[STYLE.color_scheme.border] as ChalkFunction)(str);
   ```
   - Type-safe color application
   - Dynamic width calculations
   - Consistent border styling
   - Flexible text formatting

4. **Column Configuration**
   ```typescript
   export const columnWidths = {
       TOKEN_NAME_WIDTH: 8,
       ADDRESS_WIDTH: 42,
       TIME_WIDTH: 15,
       SOL_PRICE_WIDTH: 12,
       USD_AMOUNT_WIDTH: 12,
       TOKEN_AMOUNT_WIDTH: 15,
       PERCENT_WIDTH: 10
   };
   ```
   - Standardized column widths
   - Content-type specific sizing
   - Maintainable configuration
   - Responsive to content length

5. **Box Drawing Patterns**
   ```typescript
   export const getBoxChars = (style: "single" | "double") => ({
       topLeft: style === "double" ? '╔' : '┌',
       topRight: style === "double" ? '╗' : '┐',
       // ... other box characters
   });
   ```
   - Configurable border styles
   - Unicode box drawing
   - Consistent visual presentation
   - Style switching support