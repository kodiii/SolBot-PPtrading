'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { formatDecimal } from '@/lib/utils'
import { format } from 'date-fns'

interface BalancePoint {
  balance_sol: string
  updated_at: number
}

interface ChartDataPoint {
  timestamp: number
  balance: number
}

interface BalanceChartProps {
  data: BalancePoint[]
  isLoading?: boolean
}

/**
 * Custom tooltip component for the balance chart
 */
function CustomTooltip({ 
  active, 
  payload 
}: TooltipProps<number, string>): React.ReactElement | null {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0]
  const timestamp = data.payload.timestamp as number
  const value = data.value || 0

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="text-muted-foreground">Time:</div>
        <div className="font-medium">
          {format(timestamp, 'HH:mm:ss')}
        </div>
        <div className="text-muted-foreground">Balance:</div>
        <div className="font-medium">
          {formatDecimal(value.toString())} SOL
        </div>
      </div>
    </div>
  )
}

/**
 * Chart component for displaying balance history
 */
export function BalanceChart({ data, isLoading }: BalanceChartProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance History</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonCard />
        </CardContent>
      </Card>
    )
  }

  // Transform data for Recharts
  const chartData: ChartDataPoint[] = data.map(point => ({
    timestamp: point.updated_at,
    balance: parseFloat(point.balance_sol),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="stroke-muted"
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(value, 'HH:mm')}
                className="text-muted-foreground text-xs"
              />
              <YAxis
                tickFormatter={(value) => formatDecimal(value.toString())}
                className="text-muted-foreground text-xs"
              />
              <Tooltip content={CustomTooltip} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                fill="url(#balanceGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}