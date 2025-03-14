"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SkeletonCard } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { formatDecimal } from "@/lib/utils"
import { format } from "date-fns"
import type { Trade } from "@/lib/types"

interface CumulativePnLChartProps {
  trades: Trade[];
  isLoading?: boolean;
}

interface ChartData {
  timestamp: number;
  pnl: number;
  totalPnL: number;
}

/**
 * Chart component for displaying cumulative PnL over time
 */
export function CumulativePnLChart({ trades, isLoading }: CumulativePnLChartProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Profit/Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonCard />
        </CardContent>
      </Card>
    )
  }

  // Transform and aggregate data for cumulative PnL
  const chartData: ChartData[] = trades
    .filter(trade => trade.pnl !== undefined)
    .map(trade => ({
      timestamp: trade.time_sell || trade.time_buy,
      pnl: parseFloat(trade.pnl || "0"),
      totalPnL: 0, // Will be calculated below
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((acc: ChartData[], point, i) => {
      const prevTotal = i > 0 ? acc[i - 1].totalPnL : 0
      return [...acc, { ...point, totalPnL: prevTotal + point.pnl }]
    }, [])

  const hasData = chartData.length > 0
  const maxPnL = Math.max(...chartData.map(d => d.totalPnL))
  const minPnL = Math.min(...chartData.map(d => d.totalPnL))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cumulative Profit/Loss</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
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
                domain={[minPnL * 1.1, maxPnL * 1.1]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const data = payload[0].payload as ChartData
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-muted-foreground">Time:</div>
                          <div className="font-medium">
                            {format(data.timestamp, 'HH:mm:ss')}
                          </div>
                          <div className="text-muted-foreground">Total P/L:</div>
                          <div className={`font-medium ${
                            data.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {data.totalPnL > 0 ? '+' : ''}{formatDecimal(data.totalPnL.toString())} SOL
                          </div>
                          <div className="text-muted-foreground">Trade P/L:</div>
                          <div className={`font-medium ${
                            data.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {data.pnl > 0 ? '+' : ''}{formatDecimal(data.pnl.toString())} SOL
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {hasData && <ReferenceLine y={0} stroke="hsl(var(--muted))" />}
              <Line
                type="monotone"
                dataKey="totalPnL"
                stroke="hsl(var(--primary))"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
