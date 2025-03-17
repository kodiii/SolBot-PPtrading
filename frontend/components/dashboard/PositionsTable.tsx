'use client'

import { formatDecimal } from '@/lib/utils'
import { SkeletonTable } from '@/components/ui/skeleton'
import type { Position } from '@/lib/types'

interface PositionsTableProps {
  positions: Position[]
  isLoading?: boolean
}

export function PositionsTable({ positions, isLoading }: PositionsTableProps): React.ReactElement {
  if (isLoading) {
    return <SkeletonTable />
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse">
        <colgroup>
          <col className="w-[200px]" /> {/* Fixed width for token name */}
          <col className="w-[200px]" /> {/* Minimum widths for scrollable columns */}
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
        </colgroup>
        <thead className="sticky top-0 bg-background z-20">
          <tr>
            <th className="sticky left-0 bg-background z-30 border-r border-border">Token Name</th>
            <th className="whitespace-nowrap px-4">Address</th>
            <th className="whitespace-nowrap px-4">Volume</th>
            <th className="whitespace-nowrap px-4">Market Cap</th>
            <th className="whitespace-nowrap px-4">Liquidity</th>
            <th className="whitespace-nowrap px-4">Position Size (SOL)</th>
            <th className="whitespace-nowrap px-4">Buy Price (SOL)</th>
            <th className="whitespace-nowrap px-4">Current Price (SOL)</th>
            <th className="whitespace-nowrap px-4">P/L (%)</th>
            <th className="whitespace-nowrap px-4">Take Profit (SOL)</th>
            <th className="whitespace-nowrap px-4">Stop Loss (SOL)</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => {
            const buyPrice = parseFloat(position.buy_price)
            const currentPrice = parseFloat(position.current_price)
            const pnlPercentage = ((currentPrice - buyPrice) / buyPrice) * 100

            return (
              <tr key={`${position.token_mint}-${index}`}>
                <td className="sticky left-0 bg-background z-10 border-r border-border">{position.token_name}</td>
                <td className="whitespace-nowrap px-4">{position.token_mint}</td>
                <td className="whitespace-nowrap px-4">0.00</td>
                <td className="whitespace-nowrap px-4">{formatDecimal('2611.00')}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal('4859.25')}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.position_size_sol)}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.buy_price)}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.current_price)}</td>
                <td className={`whitespace-nowrap px-4 ${pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {pnlPercentage.toFixed(4)}%
                </td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.take_profit)}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.stop_loss)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
