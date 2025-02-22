# Paper Trading Dashboard Update Plan

## Overview
Update the paper trading dashboard to include additional data from dexscreener and reorganize the display format for better trading visibility.

## Changes Required

### Recent Trades Board
New column structure:
1. Token Name (baseToken.name)
2. Token Address (baseToken.address)
3. Volume 5m (volume.m5)
4. MarketCap (marketCap)
5. Buy Price
6. Buy Fees
7. Slippage
8. Position Size/Sol
9. Sell Price
10. Sell Fees
11. Time Buy
12. Time Sell
13. Volume 5m (volume.m5)
14. Liquidity/buy (liquidity.usd)
15. Liquidity/sell (liquidity.usd)
16. PNL

### Active Positions Board
New column structure:
1. Token Name (baseToken.name)
2. Token Address (baseToken.address)
3. Position Size/Sol
4. Buy Price
5. Current Price
6. PNL
7. Take Profit
8. Stop Loss

## Implementation Steps

1. Interface Updates
   - Add new fields to TokenPosition interface
   - Update SimulatedTrade interface to include dexscreener data

2. Display Function Updates
   - Modify displayActivePositions()
     * Update headers array
     * Adjust column widths
     * Update row formatting
   - Modify displayRecentTrades()
     * Update headers array
     * Add new columns
     * Handle trade data formatting

3. Table Formatting
   - Adjust TABLE_WIDTH constant
   - Update column width constants
   - Ensure proper alignment and spacing

4. Database Modifications (if needed)
   - Update token_tracking table structure
   - Update simulated_trades table structure

## Technical Considerations
- Maintain existing color coding for profit/loss
- Ensure proper decimal formatting for numerical values
- Keep table alignment consistent
- Handle null/undefined values gracefully

## Test Cases
1. Verify all new columns display correctly
2. Check alignment with different data lengths
3. Validate color coding still works
4. Test with empty tables
5. Verify real-time updates still function

## Next Steps
1. Switch to Code mode
2. Implement the changes following this plan
3. Test the implementation
4. Update documentation