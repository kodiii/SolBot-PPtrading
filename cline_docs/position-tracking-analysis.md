# Position Tracking Analysis: Live vs Paper Trading

## Overview

This document compares the position tracking implementations between live trading (tracker module) and paper trading modes, identifying strengths and areas for standardization.

## Database Schema Comparison

### Live Trading (tracker/index.ts)
```sql
-- Holdings Table
CREATE TABLE holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Time INTEGER NOT NULL,
  Token TEXT NOT NULL,
  TokenName TEXT NOT NULL,
  Balance REAL NOT NULL,
  SolPaid REAL NOT NULL,
  SolFeePaid REAL NOT NULL,
  SolPaidUSDC REAL NOT NULL,
  SolFeePaidUSDC REAL NOT NULL,
  PerTokenPaidUSDC REAL NOT NULL,
  Slot INTEGER NOT NULL,
  Program TEXT NOT NULL
);
```

### Paper Trading (papertrading/paper_trading.ts)
```sql
-- Token Tracking Table
CREATE TABLE token_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_mint TEXT UNIQUE NOT NULL,
  token_name TEXT NOT NULL,
  amount TEXT NOT NULL,
  buy_price TEXT NOT NULL,
  current_price TEXT NOT NULL,
  last_updated INTEGER NOT NULL,
  stop_loss TEXT NOT NULL,
  take_profit TEXT NOT NULL,
  volume_m5 REAL DEFAULT 0,
  market_cap REAL DEFAULT 0,
  liquidity_usd REAL DEFAULT 0,
  position_size_sol TEXT DEFAULT '0'
);

-- Simulated Trades Table
CREATE TABLE simulated_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_name TEXT NOT NULL,
  token_mint TEXT NOT NULL,
  amount_sol TEXT NOT NULL,
  amount_token TEXT NOT NULL,
  buy_price TEXT NOT NULL,
  buy_fees TEXT NOT NULL,
  buy_slippage TEXT DEFAULT '0',
  sell_price TEXT DEFAULT NULL,
  sell_fees TEXT DEFAULT NULL,
  sell_slippage TEXT DEFAULT '0',
  time_buy INTEGER NOT NULL,
  time_sell INTEGER DEFAULT NULL,
  volume_m5 TEXT DEFAULT '0',
  market_cap TEXT DEFAULT '0',
  liquidity_buy_usd TEXT DEFAULT '0',
  liquidity_sell_usd TEXT DEFAULT NULL,
  pnl TEXT DEFAULT NULL
);
```

## Key Differences

1. **Position Management**
   - Paper Trading ✅
     - Dedicated position tracking table
     - Stop-loss/take-profit built into schema
     - Market data integration (volume, market cap, liquidity)
     - Clear separation between trades and positions
   - Live Trading ❌
     - Single table for all data
     - No built-in risk management parameters
     - Limited market data integration

2. **Trade History**
   - Paper Trading ✅
     - Comprehensive trade history with buy/sell pairs
     - Slippage tracking
     - Explicit PnL calculation
     - Market metrics at time of trade
   - Live Trading ❌
     - Basic trade recording
     - No explicit trade pairing
     - Manual PnL calculation

3. **Price Tracking**
   - Paper Trading ✅
     - Real-time price updates
     - Price validation system
     - Historical price tracking
   - Live Trading ❌
     - Basic price monitoring
     - Limited validation

4. **Risk Management**
   - Paper Trading ✅
     - Automated stop-loss/take-profit
     - Position size tracking
     - Liquidity monitoring
   - Live Trading ❌
     - Manual risk management
     - No built-in position limits

## Recommendations for Standardization

1. **Enhanced Schema**
   - Add risk management parameters to live trading
   - Standardize PnL calculation
   - Implement market data fields in both systems

```sql
-- Proposed Standard Schema
CREATE TABLE positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_mint TEXT UNIQUE NOT NULL,
  token_name TEXT NOT NULL,
  amount TEXT NOT NULL,
  buy_price TEXT NOT NULL,
  current_price TEXT NOT NULL,
  last_updated INTEGER NOT NULL,
  stop_loss TEXT NOT NULL,
  take_profit TEXT NOT NULL,
  volume_m5 REAL DEFAULT 0,
  market_cap REAL DEFAULT 0,
  liquidity_usd REAL DEFAULT 0,
  position_size_sol TEXT DEFAULT '0'
);

CREATE TABLE trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_mint TEXT NOT NULL,
  token_name TEXT NOT NULL,
  amount_token TEXT NOT NULL,
  amount_sol TEXT NOT NULL,
  price TEXT NOT NULL,
  fees TEXT NOT NULL,
  slippage TEXT DEFAULT '0',
  type TEXT NOT NULL, -- 'buy' or 'sell'
  timestamp INTEGER NOT NULL,
  related_trade_id INTEGER, -- Links buy/sell pairs
  market_data JSON -- Flexible storage for market metrics
);
```

2. **Standardized Features to Implement**
   - Price validation system
   - Automated risk management
   - Position size limits
   - Market data integration
   - Trade pairing and PnL tracking

3. **Code Structure**
   - Implement shared interfaces for position tracking
   - Create common utilities for risk calculation
   - Standardize price validation logic
   - Unified market data handling

## Implementation Priority

1. Risk Management Integration (High)
   - Add stop-loss/take-profit to live trading
   - Standardize position size tracking
   - Implement automated execution

2. Trade History Enhancement (Medium)
   - Add trade pairing to live trading
   - Standardize PnL calculation
   - Implement slippage tracking

3. Market Data Integration (Medium)
   - Add market metrics to live trading
   - Standardize data collection
   - Implement common validation

4. Schema Migration (Low)
   - Update live trading schema
   - Maintain backward compatibility
   - Add migration scripts

## Benefits of Standardization

1. **Risk Management**
   - Consistent position tracking
   - Automated risk controls
   - Better portfolio management

2. **Analysis & Reporting**
   - Unified trade history
   - Consistent PnL calculation
   - Better performance metrics

3. **Maintenance**
   - Shared code base
   - Easier updates
   - Reduced bugs

4. **User Experience**
   - Consistent behavior
   - Seamless mode switching
   - Better monitoring tools

## Next Steps

1. Create interfaces for standardized position tracking
2. Implement risk management in live trading
3. Update schemas with migration plan
4. Create shared utilities for common functions
5. Implement automated testing for both systems

The paper trading implementation has superior features and should be used as the model for standardizing both systems. Its comprehensive position tracking, risk management, and market data integration provide better trading control and analysis capabilities.