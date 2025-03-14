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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatDecimal } from "@/lib/utils"
import { format } from "date-fns"
import type { Trade } from "@/lib/types"

interface PnLChartProps {
  trades: Trade[];
  isLoading?: boolean;
}

interface ChartData {
  timestamp: number;
  pnl: number;
  isPositive: boolean;
}

/**
 * Chart component for displaying trade PnL history
 */
export function PnLChart({ trades, isLoading }: PnLChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profit/Loss History</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonCard />
        </CardContent>
      </Card>
    )
  }

  // Transform data for Recharts
  const chartData: ChartData[] = trades
    .filter(trade => trade.pnl !== undefined)
    .map(trade => ({
      timestamp: trade.time_sell || trade.time_buy,
      pnl: parseFloat(trade.pnl || "0"),
      isPositive: parseFloat(trade.pnl || "0") >= 0,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit/Loss History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
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
                          <div className="text-muted-foreground">P/L:</div>
                          <div className={`font-medium ${
                            data.isPositive ? 'text-green-500' : 'text-red-500'
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
              <Bar
                dataKey="pnl"
                fill="currentColor"
                className="text-primary"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}