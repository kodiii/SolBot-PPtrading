'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SkeletonCard, SkeletonStats } from '@/components/ui/skeleton'
import { useDashboardData } from '@/hooks/useDashboardData'
import { formatDecimal } from '@/lib/utils'

interface StatItemProps {
  label: string
  value: string
  suffix?: string
}

/**
 * Stats item component
 */
function StatItem({ label, value, suffix }: StatItemProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">
        {value} {suffix}
      </p>
    </div>
  )
}

/**
 * Main dashboard page component
 * Displays:
 * - Current balance
 * - Trading statistics
 * - Active positions
 * - Recent trades
 */
export function DashboardPage(): React.ReactElement {
  const { data, isLoading, error, refresh } = useDashboardData()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={() => refresh()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonCard />
          ) : (
            <div className="text-4xl font-bold">
              {formatDecimal(data?.balance.balance_sol || '0')} SOL
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonStats />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem
                label="Total Trades"
                value={data?.stats.totalTrades.toString() || '0'}
              />
              <StatItem
                label="Win Rate"
                value={`${(data?.stats.winRate || 0).toFixed(1)}%`}
              />
              <StatItem
                label="Total P/L"
                value={formatDecimal(data?.stats.totalPnL || '0')}
                suffix="SOL"
              />
              <StatItem
                label="Active Positions"
                value={data?.positions.length.toString() || '0'}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
