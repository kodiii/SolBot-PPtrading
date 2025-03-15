import { NextResponse } from 'next/server';
import { getBalance, getPositions, getTrades, getStats } from '@/lib/db';

/**
 * Dashboard API endpoint
 * Fetches all data needed for the trading dashboard:
 * - Current balance
 * - Active positions
 * - Recent trades
 * - Trading statistics
 */
export async function GET(): Promise<NextResponse> {
  console.log('Dashboard API called');
  console.log('Working directory:', process.cwd());
  // Skip direct filesystem check in route handler since we already handle DB errors
  console.log('Working directory:', process.cwd());
  try {
    // Check DB connection first
    try {
      const testBalance = await getBalance();
      if (!testBalance) {
        console.warn('Database connection successful but no balance data found');
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 503 }
      );
    }

    // Fetch all data concurrently
    const [balance, positions, trades, stats] = await Promise.allSettled([
      getBalance(),
      getPositions(),
      getTrades(10), // Last 10 trades
      getStats()
    ]);

    // Process results, handling individual failures
    const dashboardData = {
      balance: balance.status === 'fulfilled' ? balance.value : null,
      positions: positions.status === 'fulfilled' ? positions.value : [],
      trades: trades.status === 'fulfilled' ? trades.value : [],
      stats: stats.status === 'fulfilled' ? stats.value : {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalPnL: "0",
        winRate: 0
      }
    };

    // If we don't have any balance data, that's a critical error
    if (!dashboardData.balance) {
      return NextResponse.json(
        { error: 'Balance data not found' },
        { status: 404 }
      );
    }

    // Log any individual failures
    [balance, positions, trades, stats].forEach((result, index) => {
      if (result.status === 'rejected') {
        const component = ['balance', 'positions', 'trades', 'stats'][index];
        console.error(`Failed to fetch ${component}:`, result.reason);
      }
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
