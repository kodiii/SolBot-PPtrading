# Paper Trading Data Fetching Plan

## Database Tables

### 1. virtual_balance
- Holds current virtual SOL balance
- Updated on every trade
- Fields:
  - id: INTEGER PRIMARY KEY
  - balance_sol: TEXT (Decimal)
  - updated_at: INTEGER (timestamp)

### 2. simulated_trades
- Records all trades (open and closed)
- Fields:
  - token_name: TEXT
  - token_mint: TEXT
  - amount_sol: TEXT (Decimal)
  - amount_token: TEXT (Decimal)
  - buy_price: TEXT (Decimal)
  - buy_fees: TEXT (Decimal)
  - buy_slippage: TEXT (Decimal)
  - sell_price: TEXT (Decimal nullable)
  - sell_fees: TEXT (Decimal nullable)
  - time_buy: INTEGER
  - time_sell: INTEGER
  - pnl: TEXT (Decimal nullable)
  - volume_m5: TEXT
  - market_cap: TEXT
  - liquidity_buy_usd: TEXT
  - liquidity_sell_usd: TEXT

### 3. token_tracking
- Tracks active positions
- Fields:
  - token_mint: TEXT PRIMARY KEY
  - token_name: TEXT
  - amount: TEXT (Decimal)
  - buy_price: TEXT (Decimal)
  - current_price: TEXT (Decimal)
  - last_updated: INTEGER
  - stop_loss: TEXT (Decimal)
  - take_profit: TEXT (Decimal)
  - position_size_sol: TEXT (Decimal)

## API Implementation

### 1. Dashboard Data API (`/api/dashboard`)
```typescript
interface DashboardResponse {
  balance: {
    balance_sol: string;
    updated_at: number;
  };
  positions: Array<{
    token_mint: string;
    token_name: string;
    amount: string;
    buy_price: string;
    current_price: string;
    stop_loss: string;
    take_profit: string;
    position_size_sol: string;
    last_updated: number;
  }>;
  trades: Array<{
    token_name: string;
    token_mint: string;
    amount_sol: string;
    amount_token: string;
    buy_price: string;
    buy_fees: string;
    buy_slippage: string;
    sell_price?: string;
    sell_fees?: string;
    time_buy: number;
    time_sell?: number;
    pnl?: string;
    dex_data: {
      volume_m5?: number;
      marketCap: number;
      liquidity_buy_usd: number;
      liquidity_sell_usd?: number;
    };
  }>;
  stats: {
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    totalPnL: string;
    winRate: number;
  };
}
```

### SQL Queries

1. Balance Query:
```sql
SELECT * FROM virtual_balance ORDER BY id DESC LIMIT 1;
```

2. Active Positions Query:
```sql
SELECT * FROM token_tracking;
```

3. Recent Trades Query:
```sql
SELECT * FROM simulated_trades 
ORDER BY time_buy DESC 
LIMIT ?;
```

4. Trading Stats Query:
```sql
SELECT 
  COUNT(*) as totalTrades,
  SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as successfulTrades,
  SUM(CASE WHEN pnl IS NOT NULL THEN pnl ELSE 0 END) as totalPnL
FROM simulated_trades 
WHERE sell_price IS NOT NULL;
```

## Data Fetching Strategy

1. **Real-time Updates**
   - Poll every 2 seconds using SWR
   - Cache data for 1 second
   - Show stale data while revalidating

2. **Progressive Loading**
   - Load balance and stats first
   - Then load positions
   - Finally load trade history
   - Use loading skeletons for visual feedback

3. **Error Handling**
   - Retry failed requests 3 times
   - Show error states in UI
   - Cache last successful data
   - Provide manual refresh button

4. **Data Transformation**
   - Convert Decimal strings to Decimal objects
   - Format timestamps to local timezone
   - Calculate derived statistics (win rate, etc.)

Would you like me to implement this data fetching layer first?