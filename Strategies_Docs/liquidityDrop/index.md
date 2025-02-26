# Liquidity Drop Strategy Documentation

## Overview
The liquidity drop strategy monitors token liquidity and triggers protective actions when significant drops are detected. This directory contains detailed documentation for the strategy and its rules.

## Files

### [Liquidity Drop Rule](./liquidity-drop-rule.md)
Detailed documentation of the liquidity monitoring rule:
- How it calculates drops
- Configuration options
- Example scenarios
- Best practices for use

### [Flow Documentation](./liquidity-drop-flow.md)
Technical flow and implementation details:
- System architecture
- Data flow diagrams
- Integration points
- Optimization notes

## Quick Start

1. Enable the strategy in config.ts:
```typescript
strategies: {
  liquidity_drop: {
    enabled: true,
    threshold_percent: 20  // Trigger sell on 20% drop
  }
}
```

2. The strategy uses paper_trading.real_data_update for monitoring interval:
```typescript
paper_trading: {
  real_data_update: 5000  // Check every 5 seconds
}
```

## Summary
- Monitors token liquidity in real-time
- Uses highest recorded liquidity as reference
- Triggers sell when drop exceeds threshold
- Integrated with existing price monitoring
- No additional API calls or database tables needed