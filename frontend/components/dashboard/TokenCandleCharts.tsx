'use client'

import * as React from 'react'
import { Position } from '@/lib/types'
import { TokenCandleChart } from './TokenCandleChart'
import { useCandleData } from '@/hooks/useDashboardData'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type TimeInterval = '1s' | '1m' | '5m' | '15m' | '1h'

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
      <CardHeader className="flex flex-row items-center justify-between space-x-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setChartsCollapsed(!chartsCollapsed)}>
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
        <div className="flex space-x-1">
          <Button 
            size="sm" 
            variant={interval === '1s' ? 'default' : 'outline'} 
            onClick={() => handleIntervalChange('1s')}
            className="px-2 py-1 h-7 text-xs"
          >
            1s
          </Button>
          <Button 
            size="sm" 
            variant={interval === '1m' ? 'default' : 'outline'} 
            onClick={() => handleIntervalChange('1m')}
            className="px-2 py-1 h-7 text-xs"
          >
            1m
          </Button>
          <Button 
            size="sm" 
            variant={interval === '5m' ? 'default' : 'outline'} 
            onClick={() => handleIntervalChange('5m')}
            className="px-2 py-1 h-7 text-xs"
          >
            5m
          </Button>
          <Button 
            size="sm" 
            variant={interval === '15m' ? 'default' : 'outline'} 
            onClick={() => handleIntervalChange('15m')}
            className="px-2 py-1 h-7 text-xs"
          >
            15m
          </Button>
          <Button 
            size="sm" 
            variant={interval === '1h' ? 'default' : 'outline'} 
            onClick={() => handleIntervalChange('1h')}
            className="px-2 py-1 h-7 text-xs"
          >
            1h
          </Button>
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
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
