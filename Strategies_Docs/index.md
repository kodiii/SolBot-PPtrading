# Trading Strategies Documentation

## Available Strategies

### 1. [Liquidity Drop Strategy](./liquidityDrop/index.md)
Monitors token liquidity and protects against sudden drops.

#### Key Components:
- [Strategy Overview and Flow](./liquidityDrop/liquidity-drop-flow.md)
- [Liquidity Drop Rule](./liquidityDrop/liquidity-drop-rule.md)

#### Configuration:
```typescript
strategies: {
  liquidity_drop: {
    enabled: true,
    threshold_percent: 20  // Triggers on 20% drop
  }
}
```

## Strategy Implementation Guidelines

### 1. Base Requirements
All strategies must:
- Extend BaseStrategy class
- Implement IStrategy interface
- Use existing market data where possible
- Include comprehensive tests

### 2. Documentation Structure
Each strategy should provide:
```
strategies/
└── strategyName/
    ├── index.md              # Overview and quick start
    ├── strategy-flow.md      # Technical implementation details
    └── rules/               # Individual rule documentation
        └── rule-name.md
```

### 3. Testing Requirements
- Unit tests for core logic
- Integration tests with SimulationService
- Edge case handling
- Performance considerations

### 4. Contribution Guidelines
When adding a new strategy:
1. Use BaseStrategy as foundation
2. Follow documentation structure
3. Include mermaid diagrams for flows
4. Document configuration parameters
5. Provide example scenarios
6. Add comprehensive tests

## Best Practices

### 1. Data Usage
- Use existing market data when possible
- Avoid duplicate monitoring
- Leverage database for historical data

### 2. Performance
- Respect update intervals
- Optimize database queries
- Handle errors gracefully

### 3. Integration
- Use SimulationService for market data
- Follow existing data flow patterns
- Maintain consistent timing

### 4. Documentation
- Clear configuration examples
- Detailed flow diagrams
- Example scenarios
- Troubleshooting guide