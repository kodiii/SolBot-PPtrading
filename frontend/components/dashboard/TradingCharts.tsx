'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'
import type { Trade } from '@/lib/types'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface TradingChartsProps {
  trades: Trade[]
}

export function TradingCharts({ trades }: TradingChartsProps): React.ReactElement {
  // Use the trades array directly
  const chartTrades = trades;
  // Only use completed trades (with sell price and pnl)
  const completedTrades = chartTrades.filter(trade => trade.sell_price && trade.pnl)
  
  // Sort trades by time_buy for chronological display
  const sortedTrades = [...completedTrades].sort((a, b) => a.time_buy - b.time_buy)
  
  // Prepare data for P/L over time chart
  const pnlChartData = {
    labels: sortedTrades.map(trade => new Date(trade.time_buy).toLocaleDateString()),
    datasets: [
      {
        label: 'Profit/Loss (SOL)',
        data: sortedTrades.map(trade => parseFloat(trade.pnl || '0')),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
    ],
  }
  
  // Prepare data for win/loss ratio pie chart
  const winningTrades = completedTrades.filter(trade => parseFloat(trade.pnl || '0') > 0).length
  const losingTrades = completedTrades.length - winningTrades
  
  const winLossChartData = {
    labels: ['Winning Trades', 'Losing Trades'],
    datasets: [
      {
        data: [winningTrades, losingTrades],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }
  
  // Prepare data for top tokens by P/L
  const tokenPnlMap = new Map<string, number>()
  completedTrades.forEach(trade => {
    const pnl = parseFloat(trade.pnl || '0')
    const currentPnl = tokenPnlMap.get(trade.token_name) || 0
    tokenPnlMap.set(trade.token_name, currentPnl + pnl)
  })
  
  // Sort tokens by P/L and take top 8
  const topTokens = Array.from(tokenPnlMap.entries())
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 8)
  
  const topTokensChartData = {
    labels: topTokens.map(([token]) => token),
    datasets: [
      {
        label: 'P/L by Token (SOL)',
        data: topTokens.map(([, pnl]) => pnl),
        backgroundColor: topTokens.map(([, pnl]) => 
          pnl >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
        ),
        borderColor: topTokens.map(([, pnl]) => 
          pnl >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
        ),
        borderWidth: 1,
      },
    ],
  }
  
  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1, // Fixed aspect ratio for all charts
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        font: {
          size: 14,
        },
        padding: {
          bottom: 10,
        },
      },
    },
  }

  // Specific chart options
  const lineOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        ...commonOptions.plugins.title,
        text: 'P/L Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          maxTicksLimit: 5,
        },
      },
      x: {
        ticks: {
          maxTicksLimit: 5,
        },
      },
    },
  }
  
  const barOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        ...commonOptions.plugins.title,
        text: 'Top Tokens by P/L',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          maxTicksLimit: 5,
        },
      },
      x: {
        ticks: {
          font: {
            size: 9
          }
        }
      }
    },
    barThickness: 'flex',
    maxBarThickness: 15
  }
  
  const pieOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          padding: 5,
          font: {
            size: 10
          }
        }
      },
      title: {
        ...commonOptions.plugins.title,
        text: 'Win/Loss Ratio',
      },
    },
  }
  
  if (completedTrades.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No completed trades to display charts
      </div>
    )
  }
  
  return (
    <div className="flex flex-row justify-between items-stretch w-full h-80 px-4">
      <div className="w-[35%]">
        <Line options={lineOptions} data={pnlChartData} />
      </div>
      <div className="w-[35%]">
        <Bar options={barOptions} data={topTokensChartData} />
      </div>
      <div className="w-[25%]">
        <Pie options={pieOptions} data={winLossChartData} />
      </div>
    </div>
  )
}
