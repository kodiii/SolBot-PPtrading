'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useDashboardData } from '@/hooks/useDashboardData'
import { formatDecimal, formatDateTime } from '@/lib/utils'
import { PositionsTable } from '@/components/dashboard/PositionsTable'
import { TradesTable } from '@/components/dashboard/TradesTable'
import { TradingCharts } from '@/components/dashboard/TradingCharts'
import { ConfigSidebar } from '@/components/dashboard/ConfigSidebar'
import { ModeToggle } from '@/components/theme/ModeToggle'
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
  const [configOpen, setConfigOpen] = useState(false)

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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Settings
            </Button>
            {/* Theme Toggle */}
            <div className="border-l border-border pl-2">
              <ModeToggle />
            </div>
          </div>
          <Card className="inline-flex items-center gap-2 px-4 py-2">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-semibold">
              {formatDecimal(data?.balance.balance_sol || '0')} SOL
            </span>
          </Card>
        </div>
      </header>

      {/* Trading Statistics Card - full width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trading Statistics</CardTitle>
          {!isLoading && (
            <div className="flex flex-row items-center">
              <div className="flex flex-col items-start px-8 first:pl-0 last:pr-0 border-r border-border last:border-0">
                <span className="text-sm text-muted-foreground">Total Trades</span>
                <span className="font-semibold mt-1">{data?.stats.totalTrades || 0}</span>
              </div>
              <div className="flex flex-col items-start px-8 first:pl-0 last:pr-0 border-r border-border last:border-0">
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <span className="font-semibold mt-1">{Number(data?.stats.winRate || 0).toFixed(2)}%</span>
              </div>
              <div className="flex flex-col items-start px-8 first:pl-0 last:pr-0 border-r border-border last:border-0">
                <span className="text-sm text-muted-foreground">Total P/L</span>
                <span className={`font-semibold mt-1 ${parseFloat(data?.stats.totalPnL || '0') > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatDecimal(data?.stats.totalPnL || '0')} SOL
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonCard />
          ) : (
            <div className="flex flex-col">
              {/* Charts */}
              {data?.trades && data.trades.length > 0 ? (
                <TradingCharts trades={data.trades} />
              ) : (
                <div className="flex items-center justify-center text-muted-foreground py-12">
                  No trade data available for charts
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Config Sidebar */}
      <ConfigSidebar isOpen={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  )
}
