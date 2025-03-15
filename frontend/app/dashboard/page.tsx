'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useDashboardData } from '@/hooks/useDashboardData'
import { formatDecimal, formatDateTime } from '@/lib/utils'
import { PositionsTable } from '@/components/dashboard/PositionsTable'
import { TradesTable } from '@/components/dashboard/TradesTable'
import { useState } from 'react'
import { Trade } from '@/lib/types'

interface StatItemProps {
  label: string
  value: string | number
  suffix?: string
  isPositive?: boolean
  isNegative?: boolean
}

function StatItem({ label, value, suffix, isPositive, isNegative }: StatItemProps): React.ReactElement {
  const valueClass = isPositive ? 'text-positive' : isNegative ? 'text-destructive' : ''
  
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${valueClass}`}>
        {value} {suffix}
      </p>
    </div>
  )
}

export default function DashboardPage(): React.ReactElement {
  const { data, isLoading, error, refresh } = useDashboardData()
  const [activeTab, setActiveTab] = useState<'positions' | 'trades'>('positions')

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={() => refresh()}>Retry</Button>
      </div>
    )
  }

  // Calculate best and worst trades
  const bestTrade = data?.trades.reduce((best: Trade, trade: Trade) => {
    const pnl = parseFloat(trade.pnl || '0')
    return pnl > parseFloat(best?.pnl || '0') ? trade : best
  }, data?.trades[0])

  const worstTrade = data?.trades.reduce((worst: Trade, trade: Trade) => {
    const pnl = parseFloat(trade.pnl || '0')
    return pnl < parseFloat(worst?.pnl || '0') ? trade : worst
  }, data?.trades[0])

  // Calculate average P/L per trade
  const avgPnL = data?.stats
    ? parseFloat(data.stats.totalPnL) / data.stats.totalTrades
    : 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Balance */}
      <header className="flex justify-between items-center pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-primary">Paper Trading Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded">
            3336664916988/13321480772534583585
          </div>
          <Card className="inline-flex items-center gap-2 px-4 py-2">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-semibold">
              {formatDecimal(data?.balance.balance_sol || '0')} SOL
            </span>
          </Card>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Virtual Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonCard />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <StatItem
                  label="SOL Balance"
                  value={formatDecimal(data?.balance.balance_sol || '0')}
                />
                <StatItem
                  label="Updated At"
                  value={formatDateTime(data?.balance.updated_at || 0)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trading Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonCard />
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <StatItem
                  label="Total Trades"
                  value={data?.stats.totalTrades || 0}
                />
                <StatItem
                  label="Win Rate"
                  value={`${(data?.stats.winRate || 0).toFixed(2)}%`}
                />
                <StatItem
                  label="Total P/L"
                  value={formatDecimal(data?.stats.totalPnL || '0')}
                  suffix="SOL"
                  isPositive={parseFloat(data?.stats.totalPnL || '0') > 0}
                  isNegative={parseFloat(data?.stats.totalPnL || '0') < 0}
                />
                <StatItem
                  label="Avg P/L per Trade"
                  value={formatDecimal(avgPnL.toString())}
                  suffix="SOL"
                  isPositive={avgPnL > 0}
                  isNegative={avgPnL < 0}
                />
                <StatItem
                  label="Best Trade"
                  value={`${bestTrade?.token_name || '-'} (${formatDecimal(bestTrade?.pnl || '0')} SOL)`}
                  isPositive={true}
                />
                <StatItem
                  label="Worst Trade"
                  value={`${worstTrade?.token_name || '-'} (${formatDecimal(worstTrade?.pnl || '0')} SOL)`}
                  isNegative={true}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Tables */}
      <div className="space-y-4">
        <div className="border-b border-border">
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'positions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('positions')}
            >
              Active Positions
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'trades'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('trades')}
            >
              Recent Trades
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {activeTab === 'positions' ? (
              <PositionsTable positions={data?.positions || []} isLoading={isLoading} />
            ) : (
              <TradesTable trades={data?.trades || []} isLoading={isLoading} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="flex justify-between items-center pt-4 mt-8 border-t border-border text-sm text-muted-foreground">
        <div>Last updated: {formatDateTime(data?.balance.updated_at || Date.now())}</div>
        <div>Paper Trading System v1.0</div>
      </footer>
    </div>
  )
}
