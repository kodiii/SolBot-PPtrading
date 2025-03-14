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
export async function GET() {
  try {
    // Fetch all data concurrently
    const [balance, positions, trades, stats] = await Promise.all([
      getBalance(),
      getPositions(),
      getTrades(10), // Last 10 trades
      getStats()
    ]);

    // Error check for required data
    if (!balance) {
      return NextResponse.json(
        { error: 'Balance data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      balance,
      positions: positions || [],
      trades: trades || [],
      stats: stats || {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalPnL: "0",
        winRate: 0
      }
    });
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