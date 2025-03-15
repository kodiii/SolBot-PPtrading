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
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Token Name</th>
            <th>Address</th>
            <th>Volume</th>
            <th>Market Cap</th>
            <th>Liquidity</th>
            <th>Position Size (SOL)</th>
            <th>Buy Price (SOL)</th>
            <th>Current Price (SOL)</th>
            <th>P/L (%)</th>
            <th>Take Profit (SOL)</th>
            <th>Stop Loss (SOL)</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => {
            const buyPrice = parseFloat(position.buy_price)
            const currentPrice = parseFloat(position.current_price)
            const pnlPercentage = ((currentPrice - buyPrice) / buyPrice) * 100

            return (
              <tr key={`${position.token_mint}-${index}`}>
                <td className="token-cell">{position.token_name}</td>
                <td className="address-cell">{position.token_mint}</td>
                <td>0.00</td>
                <td>{formatDecimal('2611.00')}</td>
                <td>{formatDecimal('4859.25')}</td>
                <td>{formatDecimal(position.position_size_sol)}</td>
                <td>{formatDecimal(position.buy_price)}</td>
                <td>{formatDecimal(position.current_price)}</td>
                <td className={pnlPercentage >= 0 ? 'positive' : 'negative'}>
                  {pnlPercentage.toFixed(4)}%
                </td>
                <td>{formatDecimal(position.take_profit)}</td>
                <td>{formatDecimal(position.stop_loss)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
