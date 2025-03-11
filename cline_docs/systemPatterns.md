## Paper Trading Service Architecture (Added 11/03/2025)

### Modular Service Pattern
The paper trading system now uses a modular service architecture for better separation of concerns and maintainability:

```
SimulationService (Orchestrator)
├── PriceTracker
├── TradeExecutor
└── StrategyManager
```

1. **Service Responsibilities**
   ```typescript
   class PriceTracker {
     // Handles market data and price monitoring
     async getTokenPrice(tokenMint: string): Promise<PriceData>;
     getSolUsdPrice(): Decimal;
   }

   class TradeExecutor {
     // Manages trade operations
     async executeBuy(tokenMint: string, ...): Promise<boolean>;
     async executeSell(token: TokenTracking, ...): Promise<boolean>;
   }

   class StrategyManager {
     // Handles strategy execution
     async evaluateStrategies(token: TokenTracking, ...): Promise<void>;
   }
   ```

2. **Service Communication**
   - Unidirectional data flow
   - Clear dependency hierarchy
   - Event-based updates
   - Clean service interfaces

3. **State Management**
   - Isolated service state
   - Coordinated updates
   - Thread-safe operations
   - Recovery mechanisms

4. **Resource Management**
   - Service lifecycle control
   - Cleanup on shutdown
   - Health monitoring
   - Resource pooling

### Service Coordination Pattern

1. **Price Updates**
   ```typescript
   // PriceTracker triggers updates
   priceTracker.getTokenPrice(token.mint)
   → SimulationService processes update
   → StrategyManager evaluates strategies
   → TradeExecutor performs actions
   ```

2. **Strategy Execution**
   ```typescript
   // StrategyManager coordinates decisions
   strategyManager.evaluateStrategies(token, marketData)
   → TradeExecutor handles trades
   → SimulationService updates state
   ```

3. **Trade Operations**
   ```typescript
   // TradeExecutor manages trade lifecycle
   tradeExecutor.executeBuy/executeSell
   → Update virtual balance
   → Record trade details
   → Notify system components
   ```

This architecture ensures better maintainability, testability, and scalability while reducing complexity in the main SimulationService.