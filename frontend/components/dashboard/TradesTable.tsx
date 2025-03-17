'use client'

import { formatDecimal } from '@/lib/utils'
import { SkeletonTable } from '@/components/ui/skeleton'
import type { Trade } from '@/lib/types'

interface TradesTableProps {
  trades: Trade[]
  isLoading?: boolean
}

export function TradesTable({ trades, isLoading }: TradesTableProps): React.ReactElement {
  if (isLoading) {
    return <SkeletonTable />
  }

  return (
    <div className="relative overflow-x-auto overflow-y-auto max-h-[400px]">
      <table className="w-full border-collapse">
        <colgroup>
          <col className="w-[200px]" />
          <col className="w-[200px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[180px]" />
          <col className="w-[180px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
        </colgroup>
        <thead className="sticky top-0 bg-background z-20">
          <tr>
            <th className="sticky left-0 bg-background z-30 border-r border-border">Token Name</th>
            <th className="whitespace-nowrap px-4">Address</th>
            <th className="whitespace-nowrap px-4">Buy Price (SOL)</th>
            <th className="whitespace-nowrap px-4">Sell Price (SOL)</th>
            <th className="whitespace-nowrap px-4">Position Size (SOL)</th>
            <th className="whitespace-nowrap px-4">Time Buy</th>
            <th className="whitespace-nowrap px-4">Time Sell</th>
            <th className="whitespace-nowrap px-4">Market Cap</th>
            <th className="whitespace-nowrap px-4">Liquidity Buy</th>
            <th className="whitespace-nowrap px-4">Liquidity Sell</th>
            <th className="whitespace-nowrap px-4">P/L</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => {
            const pnl = parseFloat(trade.pnl || '0')
            
            return (
              <tr key={`${trade.token_mint}-${trade.time_buy}-${index}`}>
                <td className="sticky left-0 bg-background z-10 border-r border-border text-yellow-500">{trade.token_name}</td>
                <td className="whitespace-nowrap px-4">{trade.token_mint}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(trade.buy_price)}</td>
                <td className="whitespace-nowrap px-4">{trade.sell_price ? formatDecimal(trade.sell_price) : '-'}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(trade.amount_sol)}</td>
                <td className="whitespace-nowrap px-4">{new Date(trade.time_buy).toLocaleString()}</td>
                <td className="whitespace-nowrap px-4">{trade.time_sell ? new Date(trade.time_sell).toLocaleString() : '-'}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(trade.market_cap)}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(trade.liquidity_buy_usd)}</td>
                <td className="whitespace-nowrap px-4">{trade.liquidity_sell_usd ? formatDecimal(trade.liquidity_sell_usd) : '-'}</td>
                <td className={`whitespace-nowrap px-4 ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trade.pnl ? `${formatDecimal(trade.pnl)} SOL` : '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
