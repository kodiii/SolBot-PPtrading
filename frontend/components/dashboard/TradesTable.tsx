"use client"

import type { Trade } from "@/lib/types"
import { formatDecimal } from "@/lib/utils"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SkeletonTable } from "@/components/ui/skeleton"

interface TradesTableProps {
  trades: Trade[]
  isLoading?: boolean
}

/**
 * Displays recent trades history in a table format
 */
export function TradesTable({ trades, isLoading }: TradesTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonTable />
        </CardContent>
      </Card>
    )
  }

  if (!trades.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No trades yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Token</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-right py-3 px-4">Buy Price</th>
                <th className="text-right py-3 px-4">Sell Price</th>
                <th className="text-right py-3 px-4">P/L</th>
                <th className="text-right py-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={`${trade.token_mint}-${trade.time_buy}`} className="border-b">
                  <td className="py-3 px-4">{trade.token_name}</td>
                  <td className="text-right py-3 px-4">
                    {formatDecimal(trade.amount_sol)} SOL
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatDecimal(trade.buy_price, 8)}
                    {trade.buy_slippage && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({trade.buy_slippage}%)
                      </span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4">
                    {trade.sell_price 
                      ? formatDecimal(trade.sell_price, 8)
                      : '-'
                    }
                  </td>
                  <td className={`text-right py-3 px-4 ${getPnLColor(trade.pnl)}`}>
                    {trade.pnl 
                      ? `${trade.pnl.startsWith('-') ? '' : '+'}${formatDecimal(trade.pnl)}`
                      : '-'
                    }
                  </td>
                  <td className="text-right py-3 px-4">
                    {format(trade.time_buy, 'HH:mm:ss')}
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

/**
 * Get color class based on PnL value
 */
function getPnLColor(pnl?: string) {
  if (!pnl) return ''
  const value = parseFloat(pnl)
  if (value > 0) return 'text-green-500'
  if (value < 0) return 'text-red-500'
  return ''
}