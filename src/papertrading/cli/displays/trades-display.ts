import chalk from "chalk";
import { DashboardStyle, sectionConfigs } from '../config/dashboard_style';
import { SimulatedTrade } from '../types';
import { createEmptyRow } from '../table-renderer';
import { displayTable } from './table-display';

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
 * Displays recent trades in a formatted table
 */
export function displayRecentTrades(trades: SimulatedTrade[], style: DashboardStyle): void {
    const config = sectionConfigs.recentTrades;
    const headers = config.columns.map(col => col.header);
    const columnWidths = config.columns.map(col => col.width);

    if (trades.length === 0) {
        const emptyRow = createEmptyRow(headers, chalk.yellow('No trades recorded yet'), columnWidths);
        displayTable(config.title, headers, [emptyRow], columnWidths, style, true);
        return;
    }

    const rows = trades.map((trade: SimulatedTrade) => {
        const timeFormat = (timestamp: number) =>
            new Date(timestamp).toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

        return [
            `${trade.token_name}`.padEnd(columnWidths[0]),
            `${trade.token_mint}`.padEnd(columnWidths[1]),
            `${trade.buy_price.toString(8)}`.padStart(columnWidths[2]),
            `${trade.sell_price ? trade.sell_price.toString(8) : '-'}`.padStart(columnWidths[3]),
            `${trade.amount_token.toString(2)}`.padStart(columnWidths[4]),
            `${timeFormat(trade.time_buy)}`.padStart(columnWidths[5]),
            `${trade.time_sell ? timeFormat(trade.time_sell) : '-'}`.padStart(columnWidths[6]),
            `${formatNumberWithCommas(trade.dex_data?.marketCap || 0)}`.padStart(columnWidths[7]),
            `${formatNumberWithCommas(trade.dex_data?.liquidity_buy_usd || 0)}`.padStart(columnWidths[8]),
            `${trade.time_sell ? formatNumberWithCommas(trade.dex_data?.liquidity_sell_usd || 0) : '-'}`.padStart(columnWidths[9]),
            `${trade.pnl ? (trade.pnl.greaterThan(0) ? '+' + trade.pnl.toString(8) : trade.pnl.toString(8)) : '-'}`.padStart(columnWidths[10])
        ];
    });

    displayTable(config.title, headers, rows, columnWidths, style, true);
}