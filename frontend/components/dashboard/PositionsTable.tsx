'use client'

import { formatDecimal } from '@/lib/utils'
import { SkeletonTable } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import type { Position } from '@/lib/types'

interface PositionsTableProps {
  positions: Position[]
  isLoading?: boolean
  onClosePosition?: (tokenMint: string) => void
}

export function PositionsTable({ positions, isLoading, onClosePosition }: PositionsTableProps): React.ReactElement {
  if (isLoading) {
    return <SkeletonTable />
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse">
        <colgroup>
          <col className="w-[200px]" />
          <col className="w-[200px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[150px]" />
          <col className="w-[120px]" />
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
            <th className="whitespace-nowrap px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => {
            const buyPrice = parseFloat(position.buy_price)
            const currentPrice = parseFloat(position.current_price)
            const pnlPercentage = ((currentPrice - buyPrice) / buyPrice) * 100

            return (
              <tr key={`${position.token_mint}-${index}`}>
                <td className="sticky left-0 bg-background z-10 border-r border-border text-yellow-500">{position.token_name}</td>
                <td className="whitespace-nowrap px-4">{position.token_mint}</td>
                <td className="whitespace-nowrap px-4">
                  {position.volume_m5 === null ? '...' : `$${formatDecimal(position.volume_m5)}`}
                </td>
                <td className="whitespace-nowrap px-4">
                  {position.market_cap === null ? '...' : `$${formatDecimal(position.market_cap)}`}
                </td>
                <td className="whitespace-nowrap px-4">
                  {position.liquidity_usd === null ? '...' : `$${formatDecimal(position.liquidity_usd)}`}
                </td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.amount)}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.buy_price)}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.current_price)}</td>
                <td className={`whitespace-nowrap px-4 ${pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {pnlPercentage.toFixed(4)}%
                </td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.take_profit)}</td>
                <td className="whitespace-nowrap px-4">{formatDecimal(position.stop_loss)}</td>
                <td className="whitespace-nowrap px-4">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => onClosePosition?.(position.token_mint)}
                    title="Close position and sell token"
                  >
                    Close
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
        </table>
    </div>
  )
}
