import { DashboardStyle, sectionConfigs } from '../../config/dashboard_style';
import { TradingStats } from '../types';
import { displayTable } from './table-display';
import { Decimal } from "../../../utils/decimal";

/**
 * Formats a number with thousand separators for better readability
 */
function formatNumberWithCommas(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    // Format with commas and limit to 2 decimal places for monetary values
    return num.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    });
}

/**
 * Displays trading statistics in a formatted table
 */
export function displayTradingStats(stats: TradingStats, style: DashboardStyle): void {
    const config = sectionConfigs.tradingStats;
    const headers = config.columns.map(col => col.header);
    const columnWidths = config.columns.map(col => col.width);

    const rows = [
        [`Total Trades: ${formatNumberWithCommas(stats.totalTrades)}`],
        [`Win Rate: ${stats.winRate.toString(2)}%`],
        [`Total P/L: ${formatNumberWithCommas(stats.totalProfitLoss.toString())} SOL`],
        [`Avg P/L per Trade: ${formatNumberWithCommas(stats.avgProfitPerTrade.toString())} SOL`]
    ];

    if (!stats.bestTrade.profit.equals(new Decimal(-Infinity))) {
        rows.push([`Best Trade: ${stats.bestTrade.token} (${formatNumberWithCommas(stats.bestTrade.profit.toString())} SOL)`]);
    }
    if (!stats.worstTrade.profit.equals(new Decimal(Infinity))) {
        rows.push([`Worst Trade: ${stats.worstTrade.token} (${formatNumberWithCommas(stats.worstTrade.profit.toString())} SOL)`]);
    }

    // Format rows to match column width
    const formattedRows = rows.map(row => [
        row[0].padEnd(columnWidths[0])
    ]);

    displayTable(config.title, headers, formattedRows, columnWidths, style);
}