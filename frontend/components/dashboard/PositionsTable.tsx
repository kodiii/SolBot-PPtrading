"use client"

import { Position } from "@/lib/types"
import { formatDecimal } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SkeletonTable } from "@/components/ui/skeleton"

interface PositionsTableProps {
  positions: Position[]
  isLoading?: boolean
}

/**
 * Displays active trading positions in a table format
 */
export function PositionsTable({ positions, isLoading }: PositionsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonTable />
        </CardContent>
      </Card>
    )
  }

  if (!positions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No active positions
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Token</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-right py-3 px-4">Entry Price</th>
                <th className="text-right py-3 px-4">Current Price</th>
                <th className="text-right py-3 px-4">Position Size</th>
                <th className="text-right py-3 px-4">Stop Loss</th>
                <th className="text-right py-3 px-4">Take Profit</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.token_mint} className="border-b">
                  <td className="py-3 px-4">{position.token_name}</td>
                  <td className="text-right py-3 px-4">
                    {formatDecimal(position.amount)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatDecimal(position.buy_price, 8)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatDecimal(position.current_price, 8)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatDecimal(position.position_size_sol)} SOL
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatDecimal(position.stop_loss, 8)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatDecimal(position.take_profit, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}