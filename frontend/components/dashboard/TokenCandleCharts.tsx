'use client'

import * as React from 'react'
import { Position } from '@/lib/types'
import { TokenCandleChart } from './TokenCandleChart'
import { useCandleData } from '@/hooks/useDashboardData'
import { useState } from 'react'

type TimeInterval = '1s' | '1m' | '5m' | '15m' | '1h'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface TokenCandleChartsProps {
  positions: Position[]
  isLoading?: boolean
}

export function TokenCandleCharts({ positions, isLoading }: TokenCandleChartsProps) {
  const [chartsCollapsed, setChartsCollapsed] = React.useState(false);
  const [interval, setInterval] = useState<TimeInterval>('5m');
  
  const { data: candleDataMap, isLoading: candleLoading, refresh } = useCandleData(positions, interval);
  
  // Handle interval change for a specific token
  const handleIntervalChange = (newInterval: TimeInterval) => {
    setInterval(newInterval);
    refresh();
  };

  return (
    <Card>
      <CardHeader 
        className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50"
        onClick={() => setChartsCollapsed(!chartsCollapsed)}
      >
        <div className="flex items-center gap-2">
          <CardTitle>Price Charts</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transform transition-transform ${chartsCollapsed ? '-rotate-90' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </CardHeader>
      <CardContent className={`transition-all duration-300 ease-in-out overflow-hidden ${
        chartsCollapsed ? 'max-h-0 p-0' : 'max-h-[2000px]'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((position) => (
            <TokenCandleChart
              key={`chart-${position.token_mint}`}
              tokenName={position.token_name}
              data={candleDataMap.get(position.token_mint) || []}
              isLoading={isLoading || candleLoading}
              onIntervalChange={handleIntervalChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
