# Liquidity Drop Strategy Implementation Plan

## 1. Configuration Updates (src/config.ts)

Add new strategies section:
```typescript
strategies: {
  liquidity_drop: {
    enabled: true,
    threshold_percent: 20, // Sell if liquidity drops by 20%
    check_interval: 5000, // How often to check liquidity (ms)
  }
}
```

## 2. Strategy Implementation Structure

Create new directories and files:
```
src/papertrading/strategies/
├── types.ts            // Strategy interfaces
├── base-strategy.ts    // Abstract base strategy class
└── liquidity-drop.ts   // Liquidity drop strategy implementation
```

### Strategy Interfaces (types.ts)
- Define common interfaces for all strategies
- Include specific interfaces for liquidity monitoring

### Base Strategy (base-strategy.ts)
- Abstract class with common strategy functionality
- Event handling and lifecycle management

### Liquidity Drop Strategy (liquidity-drop.ts)
- Implements base strategy
- Monitors liquidity changes
- Triggers sells when threshold is crossed

## 3. Integration Points

### Update SimulationService:
1. Add strategy management
2. Initialize enabled strategies
3. Feed market data to active strategies
4. Handle strategy sell signals

### Workflow:
1. SimulationService initializes enabled strategies on startup
2. Each price/liquidity update is passed to active strategies
3. Strategies can trigger sell signals
4. SimulationService executes sells when strategy conditions are met

## 4. Implementation Steps

1. Update config.ts with strategies section
2. Create strategy directory structure
3. Implement base strategy and interfaces
4. Implement liquidity drop strategy
5. Update SimulationService to support strategies
6. Add strategy initialization to paper trading startup
7. Test implementation with different thresholds

## 5. Testing Strategy

1. Create unit tests for strategy logic
2. Test different liquidity scenarios
3. Verify sell triggers work correctly
4. Test strategy enabling/disabling
5. Verify configuration changes take effect

## 6. Monitoring & Logging

- Add strategy-specific logging
- Track liquidity changes
- Log strategy decisions
- Record strategy-triggered sells