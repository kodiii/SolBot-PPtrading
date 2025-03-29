import ExcelJS from 'exceljs'
import type { Trade } from './types'

export type ExportFormat = 'csv' | 'json' | 'excel'

const formatDate = (timestamp: number): string => new Date(timestamp).toLocaleString()

export const exportTrades = async (trades: Trade[], format: ExportFormat, fileName: string = 'trades'): Promise<void> => {
  switch (format) {
    case 'csv':
      return exportToCSV(trades, fileName)
    case 'json':
      return exportToJSON(trades, fileName)
    case 'excel':
      return exportToExcel(trades, fileName)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

const exportToCSV = (trades: Trade[], fileName: string): void => {
  const headers = [
    'Token Name',
    'Token Mint',
    'Buy Price (SOL)',
    'Sell Price (SOL)',
    'Position Size (SOL)',
    'Time Buy',
    'Time Sell',
    'Market Cap',
    'Liquidity Buy',
    'Liquidity Sell',
    'P/L'
  ]

  const rows = trades.map(trade => [
    trade.token_name,
    trade.token_mint,
    trade.buy_price,
    trade.sell_price || '',
    trade.amount_sol,
    formatDate(trade.time_buy),
    trade.time_sell ? formatDate(trade.time_sell) : '',
    trade.market_cap || '',
    trade.liquidity_buy_usd || '',
    trade.liquidity_sell_usd || '',
    trade.pnl || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.csv`
  link.click()
}

const exportToJSON = (trades: Trade[], fileName: string): void => {
  const jsonContent = JSON.stringify(trades, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.json`
  link.click()
}

const exportToExcel = async (trades: Trade[], fileName: string): Promise<void> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Trades')

  worksheet.columns = [
    { header: 'Token Name', key: 'tokenName', width: 20 },
    { header: 'Token Mint', key: 'tokenMint', width: 50 },
    { header: 'Buy Price (SOL)', key: 'buyPrice', width: 15 },
    { header: 'Sell Price (SOL)', key: 'sellPrice', width: 15 },
    { header: 'Position Size (SOL)', key: 'positionSize', width: 15 },
    { header: 'Time Buy', key: 'timeBuy', width: 20 },
    { header: 'Time Sell', key: 'timeSell', width: 20 },
    { header: 'Market Cap', key: 'marketCap', width: 15 },
    { header: 'Liquidity Buy', key: 'liquidityBuy', width: 15 },
    { header: 'Liquidity Sell', key: 'liquiditySell', width: 15 },
    { header: 'P/L', key: 'pnl', width: 15 }
  ]

  // Add rows to the worksheet
  trades.forEach(trade => {
    worksheet.addRow({
      tokenName: trade.token_name,
      tokenMint: trade.token_mint,
      buyPrice: trade.buy_price,
      sellPrice: trade.sell_price || '',
      positionSize: trade.amount_sol,
      timeBuy: formatDate(trade.time_buy),
      timeSell: trade.time_sell ? formatDate(trade.time_sell) : '',
      marketCap: trade.market_cap || '',
      liquidityBuy: trade.liquidity_buy_usd || '',
      liquiditySell: trade.liquidity_sell_usd || '',
      pnl: trade.pnl || ''
    })
  })

  // Style the header row
  worksheet.getRow(1).font = { bold: true }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${fileName}.xlsx`
  link.click()
}
