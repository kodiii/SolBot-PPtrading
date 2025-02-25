import chalk from "chalk";
import { DashboardStyle, sectionConfigs } from '../../config/dashboard_style';
import { TokenPosition } from '../types';
import { createEmptyRow } from '../table-renderer';
import { Decimal } from "../../../utils/decimal";
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
 * Displays active trading positions in a formatted table
 */
export function displayActivePositions(positions: TokenPosition[], style: DashboardStyle): void {
    const config = sectionConfigs.activePositions;
    const headers = config.columns.map(col => col.header);
    const columnWidths = config.columns.map(col => col.width);

    if (positions.length === 0) {
        const emptyRow = createEmptyRow(headers, chalk.yellow('No active positions'), columnWidths);
        displayTable(config.title, headers, [emptyRow], columnWidths, style, true);
        return;
    }

    const rows = positions.map((pos: TokenPosition) => {
        const rawPnlPercent = pos.current_price.subtract(pos.buy_price)
            .divide(pos.buy_price)
            .multiply(new Decimal(100));
        const formattedPnlPercent = rawPnlPercent.toString(4);
        
        return [
            `${pos.token_name}`.padEnd(columnWidths[0]),
            `${pos.token_mint}`.padEnd(columnWidths[1]),
            `${formatNumberWithCommas(pos.volume_m5 || 0)}`.padStart(columnWidths[2]),
            `${formatNumberWithCommas(pos.market_cap || 0)}`.padStart(columnWidths[3]),
            `${formatNumberWithCommas(pos.liquidity_usd || 0)}`.padStart(columnWidths[4]),
            `${pos.amount.toString(2)}`.padStart(columnWidths[5]),
            `${pos.buy_price.toString(8)}`.padStart(columnWidths[6]),
            `${pos.current_price.toString(8)}`.padStart(columnWidths[7]),
            `${formattedPnlPercent}%`.padStart(columnWidths[8]),
            `${pos.take_profit.toString(8)}`.padStart(columnWidths[9]),
            `${pos.stop_loss.toString(8)}`.padStart(columnWidths[10])
        ];
    });

    displayTable(config.title, headers, rows, columnWidths, style, true);
}