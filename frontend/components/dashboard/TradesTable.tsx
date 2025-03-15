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
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Token Name</th>
            <th>Address</th>
            <th>Buy Price (SOL)</th>
            <th>Sell Price (SOL)</th>
            <th>Position Size (SOL)</th>
            <th>Time Buy</th>
            <th>Time Sell</th>
            <th>Market Cap</th>
            <th>Liquidity Buy</th>
            <th>Liquidity Sell</th>
            <th>P/L</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => {
            const pnl = parseFloat(trade.pnl || '0')
            
            return (
              <tr key={`${trade.token_mint}-${trade.time_buy}-${index}`}>
                <td className="token-cell">{trade.token_name}</td>
                <td className="address-cell">{trade.token_mint}</td>
                <td>{formatDecimal(trade.buy_price)}</td>
                <td>{trade.sell_price ? formatDecimal(trade.sell_price) : '-'}</td>
                <td>{formatDecimal(trade.amount_sol)}</td>
                <td>{new Date(trade.time_buy).toLocaleString()}</td>
                <td>{trade.time_sell ? new Date(trade.time_sell).toLocaleString() : '-'}</td>
                <td>{formatDecimal(trade.market_cap)}</td>
                <td>{formatDecimal(trade.liquidity_buy_usd)}</td>
                <td>{trade.liquidity_sell_usd ? formatDecimal(trade.liquidity_sell_usd) : '-'}</td>
                <td className={pnl >= 0 ? 'positive' : 'negative'}>
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
