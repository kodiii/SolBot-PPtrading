'use client'

import React from 'react'
import { useChartTheme } from '@/hooks/useChartTheme'
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

  // Configure chart defaults
  ChartJS.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  
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
  
  // Use theme hook for chart colors
  const { getThemeColor, getThemeColorWithOpacity } = useChartTheme()

  // Prepare data for P/L over time chart
  // Memoize chart data to prevent unnecessary updates
  const pnlChartData = React.useMemo(() => ({
    labels: sortedTrades.map(trade => new Date(trade.time_buy).toLocaleDateString()),
    datasets: [
      {
        label: 'Profit/Loss (SOL)',
        data: sortedTrades.map(trade => parseFloat(trade.pnl || '0')),
        borderColor: getThemeColor(0),
        backgroundColor: getThemeColorWithOpacity(0, 0.5),
        tension: 0.3,
      },
    ],
  }), [sortedTrades, getThemeColor, getThemeColorWithOpacity])
  
  // Prepare data for win/loss ratio pie chart
  const winningTrades = completedTrades.filter(trade => parseFloat(trade.pnl || '0') > 0).length
  const losingTrades = completedTrades.length - winningTrades
  
  const winLossChartData = React.useMemo(() => ({
    labels: ['Winning Trades', 'Losing Trades'],
    datasets: [
      {
        data: [winningTrades, losingTrades],
        backgroundColor: [
          getThemeColorWithOpacity(0, 0.6),
          getThemeColorWithOpacity(1, 0.6),
        ],
        borderColor: [
          getThemeColor(0),
          getThemeColor(1),
        ],
        borderWidth: 1,
      },
    ],
  }), [winningTrades, losingTrades, getThemeColor, getThemeColorWithOpacity])
  
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
  
  const topTokensChartData = React.useMemo(() => ({
    labels: topTokens.map(([token]) => token),
    datasets: [
      {
        label: 'P/L by Token (SOL)',
        data: topTokens.map(([, pnl]) => pnl),
        backgroundColor: topTokens.map(([, pnl]) => 
          getThemeColorWithOpacity(pnl >= 0 ? 0 : 1, 0.6)
        ),
        borderColor: topTokens.map(([, pnl]) => 
          getThemeColor(pnl >= 0 ? 0 : 1)
        ),
        borderWidth: 1,
      },
    ],
  }), [topTokens, getThemeColor, getThemeColorWithOpacity])
  
    // Common chart options with theme colors - including text and grid colors
  const commonOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        color: 'hsl(var(--foreground))',
        font: {
          size: 13,
          weight: 'bold' as const
        },
        padding: {
          top: 0,
          bottom: 12,
        },
      },
      legend: {
        display: true,
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          color: 'hsl(var(--muted-foreground))',
          boxWidth: 8,
          padding: 10,
          font: {
            size: 12,
            weight: 'normal' as const
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(var(--muted-foreground) / 0.2)',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 12,
            weight: 'normal' as const
          }
        }
      },
      y: {
        grid: {
          color: 'hsl(var(--muted-foreground) / 0.2)',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 12,
            weight: 'normal' as const
          }
        }
      }
    }
  }), [])

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
            size: 9,
            weight: 'normal' as const
          }
        }
      }
    },
    barThickness: 'flex',
    maxBarThickness: 15
  }
  
  const pieOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1,
    plugins: {
      title: {
        display: true,
        color: 'hsl(var(--foreground))',
        text: 'Win/Loss Ratio',
        font: {
          size: 13,
          weight: 'bold' as const
        },
        padding: {
          top: 0,
          bottom: 12,
        },
      },
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: 'hsl(var(--muted-foreground))',
          boxWidth: 8,
          padding: 6,
          font: {
            size: 11,
            weight: 'normal' as const
          }
        }
      },
    }
  }), [])
  
  if (completedTrades.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No completed trades to display charts
      </div>
    )
  }
  
  return (
    <div className="flex flex-row justify-between items-stretch w-full h-[26rem] px-4">
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
